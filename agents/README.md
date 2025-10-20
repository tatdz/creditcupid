# Darma Agents

uAgents (Advisor ↔ Analyst ↔ Risk) + Blockscout MCP + MeTTa (Hyperon).

## Files
- `agent.py` — Advisor (ASI-style chat). Orchestrates Analyst + Risk.
- `analyst.py` — On-chain data via Blockscout MCP.
- `risk.py` — Risk + scoring using MeTTa rules.
- `metta_reasoner.py` — Shared rules (works with/without Hyperon).
- `test_client.py` — Local test harness.
- `requirements.txt` — Python deps.
- `.env.example` — Template for local env.

## Quickstart
```bash
cd agents
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # then fill variables

# 1) start analyst
python analyst.py

# 2) start risk (export ANALYST_ADDR first)
export ANALYST_ADDR=<printed analyst address>
python risk.py

# 3) start advisor (export RISK_ADDR)
export RISK_ADDR=<printed risk address>
python agent.py

# 4) run client (export ADVISOR_ADDR)
export ADVISOR_ADDR=<printed advisor address>
python test_client.py
