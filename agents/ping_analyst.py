# ping_analyst.py
from uagents import Agent, Context, Protocol, Model
from uagents.setup import fund_agent_if_low
import os

ANALYST = Protocol(name="analyst_protocol", version="1.0.0")

class DataRequest(Model):
    request_id: str
    account: str
    chains: list[str]

class DataResponse(Model):
    request_id: str
    summary: dict
    by_chain: list[dict]

ANALYST_ADDR = os.getenv("ANALYST_ADDR","").strip()
assert ANALYST_ADDR, "export ANALYST_ADDR=<address from analyst.py>"

pinger = Agent(name="ping_analyst", seed="ping_analyst_seed", port=8004, endpoint=["http://127.0.0.1:8004/submit"])
fund_agent_if_low(pinger.wallet.address())

@pinger.on_event("startup")
async def go(ctx: Context):
    await ctx.send(ANALYST_ADDR, DataRequest(
        request_id="test1",
        account="0x000000000000000000000000000000000000dEaD",  # replace with a funded test address
        chains=["optimism","base","arbitrum"]
    ))

@ANALYST.on_message(model=DataResponse)
async def got(ctx: Context, _sender: str, msg: DataResponse):
    ctx.logger.info(f"SUMMARY: {msg.summary}")
    ctx.logger.info(f"BY_CHAIN: {msg.by_chain}")

pinger.include(ANALYST)

if __name__ == "__main__":
    print(pinger.address)
    pinger.run()
