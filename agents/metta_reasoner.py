# metta_reasoner.py
"""
Thin MeTTa adapter for Darma.
- Uses Hyperon MeTTa if available (pip install hyperon).
- Falls back to identical Python logic so agents never break.
"""

import os
from typing import Dict, Any, List

METTA_ENABLED = os.getenv("METTA_ENABLED", "1") == "1"

try:
    from hyperon import MeTTa  # Hyperon runtime
    _HYPERON_OK = True
except Exception:
    _HYPERON_OK = False


class MeTTaCreditReasoner:
    def __init__(self) -> None:
        self.rules_text = self._rules_as_text()
        self._metta = None
        if METTA_ENABLED and _HYPERON_OK:
            try:
                self._metta = MeTTa()
                # (Optional) Load rule text for audit traces
                self._metta.run(f'; Darma MeTTa rules\n; ' + self.rules_text.replace('\n', '\n; ') + '\n')
            except Exception:
                self._metta = None

    async def generate_risk_report(self, credit_data: Dict[str, Any]) -> Dict[str, Any]:
        f = self._extract_facts(credit_data)

        # TODO: later we can push facts into self._metta and query.
        tier = self._tier_from_rules(f)
        risk = self._risk_from_rules(f)
        recs = self._recs_from_rules(f)
        max_ltv = self._ltv_from_tier(tier)

        return {
            "credit_tier": tier,
            "risk_level": risk,
            "recommendations": recs,
            "max_ltv": max_ltv,
            "reasoning_factors": {
                "portfolio_value": f["portfolio_value"],
                "repayment_ratio": f["repayment_ratio"],
                "asset_concentration": f["asset_concentration"],
                "cross_chain_activity": f["active_chains"],
                "protocol_engagement": f["protocol_interactions"],
            },
            "rules_text": self.rules_text,
        }

    def _rules_as_text(self) -> str:
        return """
        Credit tiers:
          AA: score>=800 & chains>=3 & repay>=0.9
          A+: score>=750 & chains>=2 & repay>=0.8
          A : score>=700
          B+: score>=650
          B : score>=600
          C : score>=550
          D : else

        Risk levels:
          high   if repay<0.5 or gas>50 or conc>0.8 or active_chains<1
          medium if (0.5<=repay<0.7) or (25<gas<=50) or (0.6<conc<=0.8)
          low    if repay>=0.7 and gas<=25 and conc<=0.6 and active_chains>=2

        Recommendations:
          diversify-assets      if concentration>0.7
          increase-repayments   if repayment_ratio<0.8
          expand-chains         if active_chains<2
          reduce-gas            if gas_usage>30
          build-history         if protocol_interactions<5

        Max LTV by tier:
          AA:80  A+:75  A:70  B+:65  B:60  C:55  D:50
        """

    # -------- Python fallback (also used for now) --------
    def _extract_facts(self, credit_data: Dict[str, Any]) -> Dict[str, Any]:
        chains = credit_data.get("chains", [])
        interactions = credit_data.get("protocolInteractions", [])

        portfolio_value = 0.0
        active_chains = 0
        for c in chains:
            bal = float(c.get("balance", 0) or 0)
            tok_total = sum(float(t.get("valueUSD", 0) or 0) for t in c.get("tokens", []))
            if bal > 0 or tok_total > 0:
                active_chains += 1
            portfolio_value += bal + tok_total

        borrows = [i for i in interactions if i.get("type") == "borrow"]
        repays  = [i for i in interactions if i.get("type") == "repay"]
        repayment_ratio = (len(repays) / len(borrows)) if borrows else 1.0

        max_conc = 0.0
        for c in chains:
            tokens = c.get("tokens", [])
            tot = sum(float(t.get("valueUSD", 0) or 0) for t in tokens)
            if tot > 0:
                top = max(tokens, key=lambda t: float(t.get("valueUSD", 0) or 0))
                conc = float(top.get("valueUSD", 0) or 0) / tot
                max_conc = max(max_conc, conc)

        gas_usage = 0.0
        for c in chains:
            for tx in c.get("transactions", []):
                gas_usage += float(tx.get("gasUsed", 0) or 0)

        return dict(
            score=int(credit_data.get("creditScore", 300) or 300),
            chains=len(chains),
            active_chains=active_chains,
            repayment_ratio=repayment_ratio,
            gas_usage=gas_usage,
            asset_concentration=max_conc,
            protocol_interactions=len(interactions),
            portfolio_value=portfolio_value,
        )

    def _tier_from_rules(self, f: Dict[str, Any]) -> str:
        score, chains, repay = f["score"], f["chains"], f["repayment_ratio"]
        if score >= 800 and chains >= 3 and repay >= 0.9: return "AA"
        if score >= 750 and chains >= 2 and repay >= 0.8: return "A+"
        if score >= 700: return "A"
        if score >= 650: return "B+"
        if score >= 600: return "B"
        if score >= 550: return "C"
        return "D"

    def _risk_from_rules(self, f: Dict[str, Any]) -> str:
        repay = f["repayment_ratio"]; gas=f["gas_usage"]; conc=f["asset_concentration"]; ac=f["active_chains"]
        if (repay < 0.5) or (gas > 50) or (conc > 0.8) or (ac < 1): return "high"
        if (0.5 <= repay < 0.7) or (25 < gas <= 50) or (0.6 < conc <= 0.8): return "medium"
        if (repay >= 0.7) and (gas <= 25) and (conc <= 0.6) and (ac >= 2): return "low"
        return "medium"

    def _recs_from_rules(self, f: Dict[str, Any]) -> List[str]:
        out = []
        if f["asset_concentration"] > 0.7:
            out.append("Diversify your asset holdings to reduce concentration risk")
        if f["repayment_ratio"] < 0.8:
            out.append("Increase your repayment consistency across protocols")
        if f["active_chains"] < 2:
            out.append("Expand your activity to multiple blockchain networks")
        if f["gas_usage"] > 30:
            out.append("Optimize your transaction patterns to reduce gas spending")
        if f["protocol_interactions"] < 5:
            out.append("Build more protocol interaction history")
        return out

    def _ltv_from_tier(self, tier: str) -> int:
        table = {"AA":80,"A+":75,"A":70,"B+":65,"B":60,"C":55,"D":50}
        return table.get(tier, 50)
