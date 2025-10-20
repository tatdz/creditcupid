# agents/mcp_smoke.py
import os, sys, json, requests

CHAIN_BASES = {
    "eth": "https://eth.blockscout.com",
    "base": "https://base.blockscout.com",
    "op": "https://optimism.blockscout.com",
    "sepolia": "https://eth-sepolia.blockscout.com",
}

def _to_float(x):
    try:
        return float(x)
    except Exception:
        return 0.0

def _usd_value(item):
    # Try common keys across Blockscout shapes
    for k in ("usd_value", "balanceUSD", "fiat_value", "usd", "usdPrice"):
        if k in item and item[k] is not None:
            return _to_float(item[k])
    # Some shapes: {"token": {...}, "value": "...", "usd_value": "..."}
    # If missing, try value * token.usd_price when present
    tok = item.get("token") if isinstance(item, dict) else None
    if tok and isinstance(tok, dict):
        price = _to_float(tok.get("price", 0)) or _to_float(tok.get("usd_price", 0))
        # "value" is often raw token amount as string
        amt = _to_float(item.get("value", 0))
        return amt * price if price and amt else 0.0
    return 0.0

def main():
    if len(sys.argv) < 2 and not os.getenv("MCP_ACCOUNT"):
        print("Usage: python agents/mcp_smoke.py <EVM_ADDRESS> [chain=eth|base|op|sepolia]")
        sys.exit(1)

    account = (sys.argv[1] if len(sys.argv) > 1 else os.getenv("MCP_ACCOUNT")).strip()
    chain = (sys.argv[2] if len(sys.argv) > 2 else os.getenv("MCP_CHAIN","eth")).lower()
    base = CHAIN_BASES.get(chain, CHAIN_BASES["eth"])

    url = f"{base}/api/v2/addresses/{account}/token-balances"
    print("GET", url)
    r = requests.get(url, timeout=20)
    print("Status:", r.status_code)

    try:
        data = r.json()
    except Exception:
        print("Non-JSON response:\n", r.text[:600])
        sys.exit(2)

    # Normalize to list
    if isinstance(data, list):
        items = data
    elif isinstance(data, dict):
        items = data.get("items") or data.get("tokens") or []
    else:
        items = []

    print(f"items: {len(items)}")

    # Top 3 by USD-ish value
    top3 = sorted(items, key=_usd_value, reverse=True)[:3]
    print(json.dumps(top3, indent=2)[:1500])

if __name__ == "__main__":
    main()
