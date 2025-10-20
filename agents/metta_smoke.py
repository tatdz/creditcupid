# metta_smoke.py
import os, asyncio
from metta_reasoner import MeTTaCreditReasoner

async def main():
    # tiny mock data to exercise rules
    credit_data = {
        "creditScore": 735,
        "chains": [
            {"balance": 0.05, "tokens": [{"symbol":"USDC","valueUSD":1200}]},
            {"balance": 0.03, "tokens": [{"symbol":"ETH","valueUSD":1800}]}
        ],
        "protocolInteractions": [
            {"protocol":"aave","type":"borrow","timestamp": 1},
            {"protocol":"aave","type":"repay","timestamp": 2},
            {"protocol":"morpho","type":"supply","timestamp": 3}
        ],
        "transactions": []
    }

    r = MeTTaCreditReasoner()
    report = await r.generate_risk_report(credit_data)
    print("MeTTa report:")
    for k,v in report.items():
        print(" ", k, "=>", v)

if __name__ == "__main__":
    # allow running without hyperon installed
    if os.getenv("METTA_ENABLED","1") != "1":
        print("METTA_ENABLED != 1 — skipping MeTTa test.")
    else:
        asyncio.run(main())
