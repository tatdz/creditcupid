import os, asyncio
from fastapi import FastAPI
from pydantic import BaseModel
from uagents import Agent, Context, Protocol, Model
from uagents.setup import fund_agent_if_low
import uvicorn

ASI_CHAT = Protocol(name="asi_chat_protocol", version="1.0.0")

class Ask(Model):
    message: str
    account: str | None = None
    chains: list[str] | None = None

class Answer(Model):
    reply: str
    score: int | None = None
    rationale: list[str] | None = None
    actions: list[dict] | None = None
    preview: dict | None = None

ADVISOR_ADDR = os.getenv("ADVISOR_ADDR","").strip()
assert ADVISOR_ADDR, "export ADVISOR_ADDR=<advisor agent address>"

bridge = Agent(name="http_bridge", seed="http_bridge_seed",
               port=8005, endpoint=["http://127.0.0.1:8005/submit"])
fund_agent_if_low(bridge.wallet.address())
bridge.include(ASI_CHAT)

pending = {}

@ASI_CHAT.on_message(model=Answer)
async def got(ctx: Context, _sender: str, msg: Answer):
    fut = pending.pop(ctx.session, None)
    if fut and not fut.done():
        fut.set_result(msg)

app = FastAPI()

class AskBody(BaseModel):
    message: str
    account: str | None = None
    chains: list[str] | None = None

@app.on_event("startup")
async def start_agents():
    asyncio.create_task(bridge.run_async())

@app.post("/ask")
async def ask(body: AskBody):
    fut = asyncio.get_event_loop().create_future()
    key = str(id(fut))
    pending[key] = fut
    await bridge.ctx.send(ADVISOR_ADDR, Ask(message=body.message, account=body.account, chains=body.chains))
    ans: Answer = await asyncio.wait_for(fut, timeout=15.0)
    return {"reply": ans.reply, "score": ans.score, "rationale": ans.rationale, "actions": ans.actions, "preview": ans.preview}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8787)
