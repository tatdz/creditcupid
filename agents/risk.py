# risk.py — MeTTa-aligned Risk/Score (frontend parity)
import os
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from uagents import Agent, Context, Protocol, Model
from uagents.setup import fund_agent_if_low

load_dotenv()

RISK = Protocol(name="risk_protocol", version="1.0.0")

class ScoreRequest(Model):
    request_id: str
    summary: dict            # { totalsUSD, debtUSD, utilization, chainCount, ... }
    by_chain: List[dict]     # [{ chain, totalUSD, debtUSD, approvals:[{infinite,...}], ... }]
    extras: Optional[dict] = None
    # extras (all optional):
    # {
    #   "tx_count": int, "active_months": int, "volume_eth": float,
    #   "token_count": int, "bluechip_ratio": float, "max_concentration": float,
    #   "protocol_interactions": int, "unique_protocols": int,
    #   "repayments": int, "late_repayments": int, "defaults": int,
    #   "plaid": {"incomeVerified": bool,"balanceVerified": bool,"historyVerified": bool,"identityVerified": bool}
    # }

class ScoreResponse(Model):
    request_id: str
    score: int                    # 300–850
    rationale: List[str]
    actions: List[dict]
    breakdown: Dict[str, Any]     # factor scores, weights, contributions, notes

USE_METTA = True
try:
    # If hyperon isn't installed, we'll auto-fallback to Python rules
    from hyperon import MeTTa  # type: ignore
except Exception:
    USE_METTA = False
    MeTTa = None  # type: ignore

RISK_SEED = os.getenv("RISK_SEED", "risk_seed_dev")
agent = Agent(
    name="darma_risk",
    seed=RISK_SEED,
    port=8004,
    endpoint=["http://127.0.0.1:8004/submit"]
)
fund_agent_if_low(agent.wallet.address())

@agent.on_event("startup")
async def up(ctx: Context):
    ctx.logger.info(f"[Risk] Address: {agent.address}")
    if USE_METTA:
        ctx.logger.info("[Risk] MeTTa available — using declarative rules (frontend parity).")
    else:
        ctx.logger.info("[Risk] MeTTa not found — using Python fallback (same logic).")

# ---------- Shared helpers to derive inputs ----------
BLUECHIPS = {"ETH","WBTC","USDC","USDT","DAI"}

def _count_infinite_approvals(by_chain: List[dict]) -> int:
    return sum(1 for c in by_chain for a in (c.get("approvals") or []) if a.get("infinite"))

def _collateral_signals(by_chain: List[dict]) -> Dict[str, float]:
    # token_count, bluechip_ratio, max_concentration (by USD)
    tokens: List[Dict[str, Any]] = []
    total_usd = 0.0
    for c in by_chain:
        total_usd += float(c.get("totalUSD", 0.0))
        for t in (c.get("tokens") or []):
            # tokens array is optional in Analyst for now; safe guard
            tokens.append({"symbol": t.get("symbol") or "", "usd": float(t.get("usd", 0.0))})
    if total_usd <= 0:
        return {"token_count": 0.0, "bluechip_ratio": 0.0, "max_concentration": 1.0}

    token_count = float(len(tokens))
    bluechip_value = sum(t["usd"] for t in tokens if t["symbol"] in BLUECHIPS)
    bluechip_ratio = bluechip_value / total_usd if total_usd > 0 else 0.0
    max_concentration = 0.0
    if tokens:
        max_concentration = max((t["usd"] for t in tokens)) / total_usd if total_usd > 0 else 1.0

    return {
        "token_count": token_count,
        "bluechip_ratio": bluechip_ratio,
        "max_concentration": max_concentration
    }

def _defaults_from(summary: dict, by_chain: List[dict], extras: Optional[dict]) -> Dict[str, float]:
    totals = float(summary.get("totalsUSD", 0.0))
    debt   = float(summary.get("debtUSD", 0.0))
    utilization = 0.0 if totals <= 0 else min(1.0, max(0.0, debt / totals))
    chains = int(summary.get("chainCount", len(by_chain)))

    # on-chain activity proxies (neutral default if unknown)
    tx_count      = float(extras.get("tx_count") if extras else 0.0)
    active_months = float(extras.get("active_months") if extras else 0.0)
    volume_eth    = float(extras.get("volume_eth") if extras else 0.0)

    # protocol usage proxies
    protocol_interactions = int(extras.get("protocol_interactions") if extras else 0)
    unique_protocols      = int(extras.get("unique_protocols") if extras else max(1, chains))  # at least chain count heuristic

    # collateral diversity
    col = _collateral_signals(by_chain)
    token_count      = float(extras.get("token_count") if extras and "token_count" in extras else col["token_count"])
    bluechip_ratio   = float(extras.get("bluechip_ratio") if extras and "bluechip_ratio" in extras else col["bluechip_ratio"])
    max_concentration= float(extras.get("max_concentration") if extras and "max_concentration" in extras else col["max_concentration"])

    # repayments
    repayments      = int(extras.get("repayments") if extras else 0)
    late_repayments = int(extras.get("late_repayments") if extras else 0)
    defaults        = int(extras.get("defaults") if extras else 0)

    # financial health (Plaid proofs)
    plaid = (extras or {}).get("plaid") if extras else None
    income_v   = bool(plaid.get("incomeVerified")) if plaid else False
    balance_v  = bool(plaid.get("balanceVerified")) if plaid else False
    history_v  = bool(plaid.get("historyVerified")) if plaid else False
    identity_v = bool(plaid.get("identityVerified")) if plaid else False

    return dict(
        utilization=utilization, chains=chains,
        tx_count=tx_count, active_months=active_months, volume_eth=volume_eth,
        protocol_interactions=protocol_interactions, unique_protocols=unique_protocols,
        token_count=token_count, bluechip_ratio=bluechip_ratio, max_concentration=max_concentration,
        repayments=repayments, late_repayments=late_repayments, defaults=defaults,
        income_v=income_v, balance_v=balance_v, history_v=history_v, identity_v=identity_v,
        infinite_approvals=_count_infinite_approvals(by_chain)
    )

# ---------- MeTTa rules mirroring your frontend formula ----------
METTA_RULES = r"""
; weights (sum = 1.0)
(= w_history 0.25)
(= w_collat  0.20)
(= w_proto   0.15)
(= w_fin     0.25)
(= w_repay   0.15)

; map each raw signal → subscore 0..100
; On-chain history: tx_count, active_months, volume_eth
(= (sub_onchain tx months vol)
   (min 100 (+ (min 40 (/ tx 4)) (min 30 (* months 2.5)) (min 30 (* vol 0.66)))))

; Collateral diversity: token_count, max_concentration (lower better), bluechip_ratio (higher better)
(= (sub_collat token_count max_conc bluechip_ratio)
   (min 100 (+ (min 40 (* token_count 10))
               (min 30 (* (- 1 max_conc) 30))
               (min 30 (* bluechip_ratio 30)))))

; Protocol usage: interactions count, unique protocols (diversity), complexity (approx: interactions/5)
(= (sub_proto interactions uniq)
   (let ((interaction_score (min 50 (* interactions 2)))
         (diversity_score   (min 30 (* uniq 6)))
         (complexity_score  (min 20 (* (/ interactions 5) 2))))
        (min 100 (+ interaction_score diversity_score complexity_score))))

; Financial health (Plaid proofs): each verified flag adds 25pts (cap 100)
(= (sub_fin incomeV balanceV historyV identityV)
   (min 100 (* 25 (+ (if incomeV 1 0) (if balanceV 1 0) (if historyV 1 0) (if identityV 1 0)))))

; Repayment history: repayments vs late/defaults
(= (sub_repay repayments late defaults)
   (let ((base (if (> repayments 0) 40 20))
         (timely (if (> repayments 0) (min 40 (* 40 (/ (- repayments late) (max repayments 1)))) 20))
         (ndef (if (= defaults 0) 20 0)))
        (min 100 (+ base timely ndef))))

; aggregate weighted 0..100
(= (weighted_total h c p f r)
   (+ (* h w_history) (* c w_collat) (* p w_proto) (* f w_fin) (* r w_repay)))

; linear map 0..100 → 300..850
(= (to_300_850 x) (+ 300 (* x 5.5)))

; full pipeline: inputs → subscores → total → credit
(= (credit_score tx months vol token_count max_conc bluechip_ratio interactions uniq
                 incomeV balanceV historyV identityV repayments late defaults)
   (let ((h (sub_onchain tx months vol))
         (c (sub_collat token_count max_conc bluechip_ratio))
         (p (sub_proto interactions uniq))
         (f (sub_fin incomeV balanceV historyV identityV))
         (r (sub_repay repayments late defaults))
         (t (weighted_total h c p f r)))
        (list (int (to_300_850 t)) h c p f r)))

; rationale lines
(= (rationale tx months vol token_count max_conc bluechip_ratio interactions uniq incomeV balanceV historyV identityV repayments late defaults)
   (list
     (str "On-chain: " tx " tx / " months " mo / " vol " ETH")
     (str "Collateral: " token_count " tokens, bluechip " (int (* bluechip_ratio 100)) "%, max conc " (int (* max_conc 100)) "%")
     (str "Protocol: " interactions " interactions across " uniq " protocols")
     (str "Financial: proofs " (+ (if incomeV 1 0) (if balanceV 1 0) (if historyV 1 0) (if identityV 1 0)) "/4")
     (str "Repayments: " repayments " repays, " late " late, " defaults " defaults " defaults")))
"""

# ---------- Python fallback implements same math ----------
def _clip(v, lo, hi): return max(lo, min(hi, v))

def _sub_onchain(tx, months, vol):
    return _clip(min(40, tx/4) + min(30, months*2.5) + min(30, vol*0.66), 0, 100)

def _sub_collat(token_count, max_conc, bluechip_ratio):
    return _clip(min(40, token_count*10) + min(30, (1-max_conc)*30) + min(30, bluechip_ratio*30), 0, 100)

def _sub_proto(interactions, uniq):
    interaction_score = min(50, interactions*2)
    diversity_score   = min(30, uniq*6)
    complexity_score  = min(20, (interactions/5)*2)
    return _clip(interaction_score + diversity_score + complexity_score, 0, 100)

def _sub_fin(incomeV, balanceV, historyV, identityV):
    return _clip(25 * sum([1 if incomeV else 0, 1 if balanceV else 0, 1 if historyV else 0, 1 if identityV else 0]), 0, 100)

def _sub_repay(repayments, late, defaults):
    base = 40 if repayments > 0 else 20
    timely = min(40, 40 * ((repayments - min(late, repayments)) / max(repayments, 1))) if repayments > 0 else 20
    ndef = 20 if defaults == 0 else 0
    return _clip(base + timely + ndef, 0, 100)

W_HISTORY, W_COLLAT, W_PROTO, W_FIN, W_REPAY = 0.25, 0.20, 0.15, 0.25, 0.15

def _to_score_300_850(total0_100: float) -> int:
    return int(round(300 + (total0_100 * 5.5)))

def compute_breakdown(inputs: Dict[str, float]) -> Dict[str, Any]:
    h = _sub_onchain(inputs["tx_count"], inputs["active_months"], inputs["volume_eth"])
    c = _sub_collat(inputs["token_count"], inputs["max_concentration"], inputs["bluechip_ratio"])
    p = _sub_proto(inputs["protocol_interactions"], inputs["unique_protocols"])
    f = _sub_fin(inputs["income_v"], inputs["balance_v"], inputs["history_v"], inputs["identity_v"])
    r = _sub_repay(inputs["repayments"], inputs["late_repayments"], inputs["defaults"])

    weighted = h*W_HISTORY + c*W_COLLAT + p*W_PROTO + f*W_FIN + r*W_REPAY
    score = _to_score_300_850(weighted)

    contributions = {
        "ON_CHAIN_HISTORY": round(h*W_HISTORY*5.5),
        "COLLATERAL_DIVERSITY": round(c*W_COLLAT*5.5),
        "PROTOCOL_USAGE": round(p*W_PROTO*5.5),
        "FINANCIAL_HEALTH": round(f*W_FIN*5.5),
        "REPAYMENT_HISTORY": round(r*W_REPAY*5.5),
    }

    rationale = [
        f"On-chain: {int(inputs['tx_count'])} tx / {int(inputs['active_months'])} mo / {inputs['volume_eth']:.2f} ETH",
        f"Collateral: {int(inputs['token_count'])} tokens, bluechip {int(inputs['bluechip_ratio']*100)}%, max conc {int(inputs['max_concentration']*100)}%",
        f"Protocol: {int(inputs['protocol_interactions'])} interactions across {int(inputs['unique_protocols'])} protocols",
        f"Financial: proofs {sum([inputs['income_v'], inputs['balance_v'], inputs['history_v'], inputs['identity_v']])}/4",
        f"Repayments: {int(inputs['repayments'])} repays, {int(inputs['late_repayments'])} late, {int(inputs['defaults'])} defaults"
    ]

    actions = []
    if inputs["max_concentration"] > 0.8:
        actions.append({"id":"diversify","label":"Diversify highly concentrated holdings","payload":{}})
    if inputs["repayments"]>0 and (inputs["late_repayments"]/max(inputs["repayments"],1))>0.2:
        actions.append({"id":"improve_repayments","label":"Improve repayment timeliness","payload":{}})
    if inputs["protocol_interactions"] < 3:
        actions.append({"id":"build_history","label":"Build protocol history (Aave/Morpho)","payload":{}})
    if not any([inputs["income_v"], inputs["balance_v"], inputs["history_v"], inputs["identity_v"]]):
        actions.append({"id":"connect_plaid","label":"Connect bank (Plaid) for +100 potential points","payload":{}})
    if not actions:
        actions=[{"id":"maintain","label":"Maintain healthy profile","payload":{}}]

    breakdown = {
        "weights": {"ON_CHAIN_HISTORY":25,"COLLATERAL_DIVERSITY":20,"PROTOCOL_USAGE":15,"FINANCIAL_HEALTH":25,"REPAYMENT_HISTORY":15},
        "subscores": {
            "ON_CHAIN_HISTORY": int(round(h)),
            "COLLATERAL_DIVERSITY": int(round(c)),
            "PROTOCOL_USAGE": int(round(p)),
            "FINANCIAL_HEALTH": int(round(f)),
            "REPAYMENT_HISTORY": int(round(r)),
        },
        "contributions": contributions,   # per-factor contribution in 300–850 space
        "utilization": inputs["utilization"],
        "chains": inputs["chains"]
    }

    return {"score": score, "rationale": rationale, "actions": actions, "breakdown": breakdown}

@RISK.on_message(model=ScoreRequest, replies={ScoreResponse})
async def on_score(ctx: Context, sender: str, msg: ScoreRequest):
    inputs = _defaults_from(msg.summary or {}, msg.by_chain or [], msg.extras or {})
    if USE_METTA:
        try:
            m = MeTTa()
            m.run(METTA_RULES)
            # assert facts
            for k,v in inputs.items():
                if isinstance(v, bool):
                    m.run(f"(= {k} {'true' if v else 'false'})")
                else:
                    m.run(f"(= {k} {float(v)})")
            # compute score + subscores
            res = m.run("(credit_score tx_count active_months volume_eth token_count max_concentration bluechip_ratio protocol_interactions unique_protocols income_v balance_v history_v identity_v repayments late_repayments defaults)")
            if not res:
                raise RuntimeError("MeTTa returned empty result")
            arr = list(res[0])  # [score, h, c, p, f, r]
            score = int(arr[0]); h,c,p,f,r = [float(x) for x in arr[1:6]]

            # rationale via MeTTa
            why = m.run("(rationale tx_count active_months volume_eth token_count max_concentration bluechip_ratio protocol_interactions unique_protocols income_v balance_v history_v identity_v repayments late_repayments defaults)")
            rationale = [str(x) for x in (why[0] if why else [])]

            # build actions + breakdown in Python (same as fallback so UI stays consistent)
            out = compute_breakdown(inputs)
            out["score"] = score
            out["rationale"] = rationale or out["rationale"]

        except Exception as e:
            ctx.logger.warning(f"[Risk] MeTTa error, using fallback: {e}")
            out = compute_breakdown(inputs)
    else:
        out = compute_breakdown(inputs)

    await ctx.send(sender, ScoreResponse(
        request_id=msg.request_id,
        score=out["score"],
        rationale=out["rationale"],
        actions=out["actions"],
        breakdown=out["breakdown"]
    ))

agent.include(RISK)

if __name__ == "__main__":
    agent.run()
