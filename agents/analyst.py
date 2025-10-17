"""
analyst.py — Analyst Agent (local)
- Receives DataRequest{ account, chains[] }
- Fetches multichain balances/approvals from Blockscout MCP
- Returns normalized DataResponse { summary, by_chain[] }

"""

import os, asyncio, math
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from uagents import Agent, Context, Protocol, Model
from uagents.setup import fund_agent_if_low
import aiohttp

load_dotenv()

# ---------- Protocol ----------
ANALYST = Protocol(name="analyst_protocol", version="1.0.0")

class DataRequest(Model):
    request_id: str
    account: str
    chains: List[str]

class DataResponse(Model):
    request_id: str
    summary: Dict[str, Any]
    by_chain: List[Dict[str, Any]]

# ---------- Config ----------
ANALYST_SEED = os.getenv("ANALYST_SEED", "analyst_seed_dev_only")
MCP_BASE     = os.getenv("MCP_BASE", "https://mcp.blockscout.com").rstrip("/")
API_KEY      = os.getenv("BLOCKSCOUT_API_KEY", "")
TIMEOUT_S    = float(os.getenv("MCP_TIMEOUT", "3.5"))

HEADERS = {"accept": "application/json"}
if API_KEY:
    HEADERS["x-api-key"] = API_KEY

# Helpful: map friendly names to MCP chain slugs (adjust as needed)
CHAIN_MAP = {
    "ethereum": "ethereum",
    "mainnet":  "ethereum",
    "optimism": "optimism",
    "base":     "base",
    "arbitrum": "arbitrum",
    "polygon":  "polygon",
}

# ---------- Utils ----------
def _num(*vals) -> float:
    for v in vals:
        try:
            if v is None: 
                continue
            return float(v)
        except Exception:
            continue
    return 0.0

async def _mcp_get(session: aiohttp.ClientSession, path: str, params: Dict[str, Any]) -> Any:
    url = f"{MCP_BASE}{path}"
    async with session.get(url, params=params, headers=HEADERS, timeout=TIMEOUT_S) as r:
        if r.status != 200:
            raise RuntimeError(f"MCP {r.status} {await r.text()}")
        return await r.json()

async def _fetch_balances(session, address: str, chain_slug: str) -> Dict[str, Any]:
    # expected: list of token balances with USD values
    try:
        data = await _mcp_get(session, "/resources/balances", {"address": address, "chain": chain_slug})
        # be tolerant to schema: sum possible usd fields
        total_usd = 0.0
        tokens_norm = []
        for t in (data if isinstance(data, list) else data.get("balances", [])):
            usd = _num(t.get("usd"), t.get("fiatValueUSD"), t.get("valueUSD"), t.get("totalUSD"))
            total_usd += usd
            tokens_norm.append({
                "symbol": t.get("symbol") or t.get("token", {}).get("symbol"),
                "usd": usd,
            })
        return {"totalUSD": round(total_usd, 2), "tokens": tokens_norm}
    except Exception as e:
        return {"totalUSD": 0.0, "tokens": [], "error": f"balances: {e}"}

async def _fetch_approvals(session, address: str, chain_slug: str) -> Dict[str, Any]:
    # optional; used for hygiene later
    try:
        data = await _mcp_get(session, "/resources/approvals", {"address": address, "chain": chain_slug})
        approvals = []
        for a in (data if isinstance(data, list) else data.get("approvals", [])):
            approvals.append({
                "token": a.get("token", {}).get("symbol") or a.get("token_symbol"),
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

    # You may add protocol positions later; for now set debtUSD=0 (safe default)
    total_usd = _num(bal.get("totalUSD"))
    debt_usd  = 0.0
    return {
        "chain": chain,
        "chainSlug": slug,
        "totalUSD": total_usd,
        "debtUSD": debt_usd,
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

# ---------- Agent ----------
agent = Agent(name="darma_analyst", seed=ANALYST_SEED, port=8001,endpoint=["http://127.0.0.1:8001/submit"])
fund_agent_if_low(agent.wallet.address())

@agent.on_event("startup")
async def on_start(ctx: Context):
    ctx.logger.info(f"[Analyst] Address: {agent.address}")
    ctx.logger.info(f"[Analyst] MCP_BASE: {MCP_BASE}")

@ANALYST.on_message(model=DataRequest, replies={DataResponse})
async def on_request(ctx: Context, msg: DataRequest):
    account = msg.account
    chains  = msg.chains or ["optimism","base","arbitrum"]
    async with aiohttp.ClientSession() as session:
        results = await asyncio.gather(*[
            _fetch_chain(session, account, c) for c in chains
        ])
    summary = _summarize(results)
    await ctx.send(msg, DataResponse(request_id=msg.request_id, summary=summary, by_chain=results))

agent.include(ANALYST)

if __name__ == "__main__":
    agent.run()
