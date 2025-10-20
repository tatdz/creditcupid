# agent.py
import os, asyncio
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv
from uagents import Agent, Context, Protocol, Model
from uagents.setup import fund_agent_if_low

load_dotenv()

# ----- ASI Chat Protocol -----
ASI_CHAT = Protocol(name="asi_chat_protocol", version="1.0.0")

class Ask(Model):
    message: str
    account: Optional[str] = None
    chains: Optional[List[str]] = None

class Answer(Model):
    reply: str
    score: Optional[int] = None
    rationale: Optional[List[str]] = None
    actions: Optional[List[dict]] = None
    preview: Optional[dict] = None

# ----- Analyst Protocol -----
ANALYST = Protocol(name="analyst_protocol", version="1.0.0")

class DataRequest(Model):
    request_id: str
    account: str
    chains: List[str]

class DataResponse(Model):
    request_id: str
    summary: dict
    by_chain: List[dict]

# ----- Risk Protocol -----
RISK = Protocol(name="risk_protocol", version="1.0.0")

class ScoreRequest(Model):
    request_id: str
    summary: dict
    by_chain: List[dict]

class ScoreResponse(Model):
    request_id: str
    score: int
    rationale: List[str]
    actions: List[dict]

ADVISOR_SEED    = os.getenv("ADVISOR_SEED", "advisor_seed_dev_only")
ANALYST_ADDR    = os.getenv("ANALYST_ADDR", "").strip()
RISK_ADDR       = os.getenv("RISK_ADDR", "").strip()
REQUEST_TIMEOUT = float(os.getenv("REQUEST_TIMEOUT", "8.0"))

agent = Agent(
    name="darma_advisor",
    seed=ADVISOR_SEED,
    port=8002,
    endpoint=["http://127.0.0.1:8002/submit"]
)
fund_agent_if_low(agent.wallet.address())

_pending_analyst: Dict[str, asyncio.Future] = {}
_pending_risk: Dict[str, asyncio.Future] = {}

def _reqid() -> str:
    import uuid; return uuid.uuid4().hex

async def _await_with_timeout(fut: asyncio.Future, timeout: float):
    try:
        return await asyncio.wait_for(fut, timeout=timeout)
    except asyncio.TimeoutError:
        return None

@agent.on_event("startup")
async def on_start(ctx: Context):
    ctx.logger.info(f"[Advisor] Address: {agent.address}")
    if not ANALYST_ADDR:
        ctx.logger.warning("[Advisor] ANALYST_ADDR not set — will use fallback summary.")
    if not RISK_ADDR:
        ctx.logger.info("[Advisor] RISK_ADDR not set — will use fallback scoring.")

# ----- Ask Analyst -----
async def ask_analyst(ctx: Context, account: str, chains: List[str]) -> Optional[dict]:
    if not ANALYST_ADDR:
        return None
    rid = _reqid()
    ctx.logger.info(f"[Advisor] → Analyst {ANALYST_ADDR} rid={rid} acct={account} chains={chains}")
    fut: asyncio.Future = asyncio.get_event_loop().create_future()
    _pending_analyst[rid] = fut
    await ctx.send(ANALYST_ADDR, DataRequest(request_id=rid, account=account, chains=chains))
    resp: Optional[DataResponse] = await _await_with_timeout(fut, REQUEST_TIMEOUT)
    _pending_analyst.pop(rid, None)
    if not resp:
        ctx.logger.warning("[Advisor] Analyst timed out")
        return None
    ctx.logger.info(f"[Advisor] ← Analyst rid={resp.request_id} util={resp.summary.get('utilization')}")
    return {"summary": resp.summary, "by_chain": resp.by_chain}

@ANALYST.on_message(model=DataResponse)
async def on_analyst_response(ctx: Context, _sender: str, msg: DataResponse):
    fut = _pending_analyst.get(msg.request_id)
    if fut and not fut.done():
        fut.set_result(msg)

# ----- Ask Risk -----
async def ask_risk(ctx: Context, summary: dict, by_chain: List[dict]) -> Optional[dict]:
    if not RISK_ADDR:
        return None
    rid = _reqid()
    ctx.logger.info(f"[Advisor] → Risk {RISK_ADDR} rid={rid}")
    fut: asyncio.Future = asyncio.get_event_loop().create_future()
    _pending_risk[rid] = fut

    extras = {}

    await ctx.send(RISK_ADDR, ScoreRequest(request_id=rid, summary=summary, by_chain=by_chain, extras=extras))
    resp: Optional[ScoreResponse] = await _await_with_timeout(fut, REQUEST_TIMEOUT)
    _pending_risk.pop(rid, None)
    if not resp:
        ctx.logger.warning("[Advisor] Risk timed out")
        return None
    ctx.logger.info(f"[Advisor] ← Risk rid={resp.request_id} score={resp.score}")
    return {"score": resp.score, "rationale": resp.rationale, "actions": resp.actions}

@RISK.on_message(model=ScoreResponse)
async def on_risk_response(ctx: Context, _sender: str, msg: ScoreResponse):
    fut = _pending_risk.get(msg.request_id)
    if fut and not fut.done():
        fut.set_result(msg)

# ----- Fallbacks -----
def fallback_summary(chains: List[str]) -> dict:
    by_chain = [{"chain": c, "totalUSD": 400.0, "debtUSD": 0.0, "approvals": []} for c in chains]
    totalsUSD = sum(x["totalUSD"] for x in by_chain)
    return {"summary": {"totalsUSD": totalsUSD, "debtUSD": 0.0, "utilization": 0.0, "chainCount": len(chains)}, "by_chain": by_chain}

def fallback_scoring(summary: dict) -> dict:
    util = float(summary.get("utilization", 0.0))
    base = 740 - int(120 * util)
    score = max(300, min(850, base))
    return {
        "score": score,
        "rationale": [f"Utilization {int(util*100)}%", "Fallback scoring (no Risk agent)"],
        "actions": [{"id": "maintain", "label": "Maintain healthy utilization", "payload": {"type": "advice"}}],
    }

# ----- ASI Chat Handler -----
@ASI_CHAT.on_message(model=Ask, replies={Answer})
async def handle_chat(ctx: Context, sender: str, msg: Ask):
    account = msg.account or "0x0000000000000000000000000000000000000000"
    chains  = msg.chains  or ["optimism","base","arbitrum"]

    data = await ask_analyst(ctx, account, chains)
    if not data:
        data = fallback_summary(chains)

    summary, by_chain = data["summary"], data["by_chain"]

    scored = await ask_risk(ctx, summary, by_chain)
    if not scored:
        scored = fallback_scoring(summary)

    score = scored["score"]
    rationale = scored.get("rationale", [])
    actions = scored.get("actions", [])

    util_pct = int(round(100 * float(summary.get("utilization", 0.0))))
    reply = f"Provisional score: {score}. Utilization {util_pct}%, across {summary.get('chainCount', len(chains))} chains. Suggestion: {actions[0]['label'] if actions else 'Maintain healthy utilization'}"

    preview = {
        "utilization": summary.get("utilization"),
        "totalsUSD": summary.get("totalsUSD"),
        "debtUSD": summary.get("debtUSD"),
        "chainCount": summary.get("chainCount"),
        "breakdown": scored.get("breakdown"),
    }

    await ctx.send(sender, Answer(reply=reply, score=score, rationale=rationale, actions=actions, preview=preview))

agent.include(ASI_CHAT)
agent.include(ANALYST)
agent.include(RISK)

if __name__ == "__main__":
    agent.run()
