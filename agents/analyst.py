# analyst.py
import os, asyncio, aiohttp
from typing import List, Dict, Any
from dotenv import load_dotenv
from uagents import Agent, Context, Protocol, Model
from uagents.setup import fund_agent_if_low

load_dotenv()

ANALYST = Protocol(name="analyst_protocol", version="1.0.0")

class DataRequest(Model):
    request_id: str
    account: str
    chains: List[str]

class DataResponse(Model):
    request_id: str
    summary: Dict[str, Any]
    by_chain: List[Dict[str, Any]]

ANALYST_SEED = os.getenv("ANALYST_SEED", "analyst_seed_dev_only")
MCP_BASE     = os.getenv("MCP_BASE", "https://mcp.blockscout.com").rstrip("/")
API_KEY      = os.getenv("BLOCKSCOUT_API_KEY", "")
TIMEOUT_S    = float(os.getenv("MCP_TIMEOUT", "6.0"))

HEADERS = {"accept": "application/json"}
if API_KEY:
    HEADERS["x-api-key"] = API_KEY

CHAIN_MAP = {
    "ethereum":"ethereum","mainnet":"ethereum",
    "optimism":"optimism","base":"base","arbitrum":"arbitrum","polygon":"polygon",
}

def _num(*vals) -> float:
    for v in vals:
        try:
            if v is None: continue
            return float(v)
        except Exception:
            pass
    return 0.0

async def _mcp_get(session: aiohttp.ClientSession, path: str, params: Dict[str, Any]) -> Any:
    url = f"{MCP_BASE}{path}"
    async with session.get(url, params=params, headers=HEADERS, timeout=TIMEOUT_S) as r:
        if r.status != 200:
            raise RuntimeError(f"MCP {r.status} {await r.text()}")
        return await r.json()

async def _fetch_balances(session, address: str, chain_slug: str) -> Dict[str, Any]:
    try:
        data = await _mcp_get(session, "/resources/balances", {"address": address, "chain": chain_slug})
        total_usd, tokens_norm = 0.0, []
        src = data if isinstance(data, list) else data.get("balances", [])
        for t in src:
            usd = _num(t.get("usd"), t.get("fiatValueUSD"), t.get("valueUSD"), t.get("totalUSD"))
            total_usd += usd
            tokens_norm.append({
                "symbol": t.get("symbol") or (t.get("token") or {}).get("symbol"),
                "usd": usd,
            })
        return {"totalUSD": round(total_usd, 2), "tokens": tokens_norm}
    except Exception as e:
        return {"totalUSD": 0.0, "tokens": [], "error": f"balances: {e}"}

async def _fetch_approvals(session, address: str, chain_slug: str) -> Dict[str, Any]:
    try:
        data = await _mcp_get(session, "/resources/approvals", {"address": address, "chain": chain_slug})
        src = data if isinstance(data, list) else data.get("approvals", [])
        approvals = []
        for a in src:
            approvals.append({
                "token": (a.get("token") or {}).get("symbol") or a.get("token_symbol"),
                "spender": a.get("spender"),
                "infinite": bool(a.get("infinite") or a.get("isUnlimited")),
                "usd": _num(a.get("usd"), a.get("valueUSD")),
            })
        return {"approvals": approvals}
    except Exception as e:
        return {"approvals": [], "error": f"approvals: {e}"}

async def _fetch_chain(session, account: str, chain: str) -> Dict[str, Any]:
    slug = CHAIN_MAP.get(chain.lower(), chain.lower())
    bal = await _fetch_balances(session, account, slug)
    apr = await _fetch_approvals(session, account, slug)
    total_usd = _num(bal.get("totalUSD"))
    debt_usd  = 0.0  # (optional) add MCP positions later
    return {
        "chain": chain, "chainSlug": slug,
        "totalUSD": total_usd, "debtUSD": debt_usd,
        "approvals": apr.get("approvals", []),
        "errors": [x for x in [bal.get("error"), apr.get("error")] if x],
    }

def _summarize(per_chain: List[Dict[str, Any]]) -> Dict[str, Any]:
    totals = sum(_num(c.get("totalUSD")) for c in per_chain)
    debts  = sum(_num(c.get("debtUSD"))  for c in per_chain)
    util   = 0.0 if totals <= 0 else round(debts / totals, 4)
    return {
        "totalsUSD": round(totals, 2),
        "debtUSD": round(debts, 2),
        "utilization": util,
        "chainCount": len(per_chain),
    }

agent = Agent(
    name="darma_analyst",
    seed=ANALYST_SEED,
    port=8001,
    endpoint=["http://127.0.0.1:8001/submit"]
)
fund_agent_if_low(agent.wallet.address())

@agent.on_event("startup")
async def on_start(ctx: Context):
    ctx.logger.info(f"[Analyst] Address: {agent.address}")
    ctx.logger.info(f"[Analyst] MCP_BASE: {MCP_BASE}")

@ANALYST.on_message(model=DataRequest, replies={DataResponse})
async def on_request(ctx: Context, sender: str, msg: DataRequest):
    ctx.logger.info(f"[Analyst] ← DataRequest rid={msg.request_id} acct={msg.account} chains={msg.chains}")
    async with aiohttp.ClientSession() as session:
        results = await asyncio.gather(*[_fetch_chain(session, msg.account, c) for c in (msg.chains or [])])
    summary = _summarize(results)
    ctx.logger.info(f"[Analyst] → {sender} DataResponse rid={msg.request_id} util={summary['utilization']}")
    await ctx.send(sender, DataResponse(request_id=msg.request_id, summary=summary, by_chain=results))

agent.include(ANALYST)

if __name__ == "__main__":
    agent.run()
