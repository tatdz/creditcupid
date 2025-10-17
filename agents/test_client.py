from uagents import Agent, Context, Protocol, Model
from uagents.setup import fund_agent_if_low
import os

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
assert ADVISOR_ADDR, "export ADVISOR_ADDR to the Advisor address printed by agent.py"

client = Agent(name="tester", seed="tester_seed_dev", port=8003,endpoint=["http://127.0.0.1:8003/submit"])
fund_agent_if_low(client.wallet)

@client.on_event("startup")
async def go(ctx: Context):
    await ctx.send(ADVISOR_ADDR, Ask(
        message="Analyze my wallet",
        account="0x000000000000000000000000000000000000dead",
        chains=["optimism","base","arbitrum"]
    ))

@ASI_CHAT.on_message(model=Answer)
async def got(ctx: Context, ans: Answer):
    ctx.logger.info(f"Reply: {ans.reply}")
    ctx.logger.info(f"JSON: score={ans.score} preview={ans.preview} rationale={ans.rationale}")

client.include(ASI_CHAT)

if __name__ == "__main__":
    print(f"[Client] {client.address}")
    client.run()
