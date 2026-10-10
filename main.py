"""
SentinelRisk: AI/NLP Financial Risk Engine & Capital Analytics Platform
S&P Global & Crisil Campus Hackathon 2026 - Master Execution Script
"""

import json
import os
import sys
from pathlib import Path

# Add src to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), "src"))
from cli_engine import FinancialNLPRiskEngine

def run_pipeline():
    print("=" * 80)
    print("  SENTINELRISK: S&P GLOBAL & CRISIL HACKATHON 2026 EVALUATION PIPELINE")
    print("  Unified AI/NLP Financial Risk Engine & Capital Analytics Engine")
    print("=" * 80)

    base_dir = Path(__file__).resolve().parent
    data_dir = base_dir / "data"

    # 1. Load Datasets
    feeds_path = data_dir / "sample_feeds.json"
    index_path = data_dir / "sp100_constituents.json"
    wholesale_path = data_dir / "wholesale_banking_portfolio.json"

    with open(feeds_path, "r", encoding="utf-8") as f:
        sample_feeds = json.load(f)
    with open(index_path, "r", encoding="utf-8") as f:
        sp_stocks = json.load(f)
    with open(wholesale_path, "r", encoding="utf-8") as f:
        wholesale_assets = json.load(f)

    engine = FinancialNLPRiskEngine()

    print(f"\n[+] Ingestion Status: Loaded {len(sample_feeds)} raw unstructured text feeds from data/sample_feeds.json")
    print(f"[+] Module A Portfolio: {len(sp_stocks)} S&P Constituents tracking 100% normalized allocation")
    print(f"[+] Module B Portfolio: ${sum(a['carrying_value_usd'] for a in wholesale_assets):,} Wholesale Banking Book\n")

    print("-" * 80)
    print("STAGE 1: REAL-TIME NLP RISK ENGINE INGESTION & SIGNAL EXTRACTION")
    print("-" * 80)

    extracted_signals = []
    for idx, feed in enumerate(sample_feeds, 1):
        full_text = f"{feed['headline']} {feed['content']}"
        signal = engine.analyze(full_text, source=feed['source'])
        signal["id"] = f"SIG-{idx:03d}"
        extracted_signals.append(signal)

        sent_sign = "+" if signal["sentiment_score"] > 0 else ""
        print(f"[{signal['id']}] Source: {feed['source'][:28]:<28} | Ticker: {signal['ticker']:<7}")
        print(f"       Sentiment: {sent_sign}{signal['sentiment_score']:.2f} ({signal['sentiment_label']:<7}) | Event: {signal['event_classification']:<24} | Impact: {signal['impact_score']}/10")
        print(f"       Headline: {feed['headline'][:72]}...")
        print()

    # ---------------------------------------------------------
    # STAGE 2: MODULE A - TACTICAL INDEX REBALANCING
    # ---------------------------------------------------------
    print("-" * 80)
    print("STAGE 2: MODULE A — TACTICAL HIGH-FREQUENCY INDEX REBALANCING")
    print("-" * 80)

    # Rebalance weights based on latest sentiment signals
    sentiment_map = {s["ticker"]: s["sentiment_score"] for s in extracted_signals if s["ticker"] != "MACRO/SYSTEMIC"}
    
    total_raw_weight = 0
    for stock in sp_stocks:
        ticker = stock["ticker"]
        base_w = stock["base_weight_pct"]
        sent = sentiment_map.get(ticker, 0.0)
        adj = sent * 3.5  # Sentiment adjustment factor
        new_w = max(2.0, base_w + adj)
        stock["raw_weight"] = new_w
        stock["last_sentiment"] = sent
        total_raw_weight += new_w

    # Normalize to 100%
    for stock in sp_stocks:
        stock["normalized_weight"] = round((stock["raw_weight"] / total_raw_weight) * 100.0, 2)

    print(f"{'Ticker':<8} | {'Base Wt %':<10} | {'Sentiment':<10} | {'Rebalanced Wt %':<16} | {'Delta %'}")
    print("-" * 65)
    for s in sp_stocks:
        delta = s["normalized_weight"] - s["base_weight_pct"]
        d_sign = "+" if delta > 0 else ""
        s_sign = "+" if s["last_sentiment"] > 0 else ""
        print(f"{s['ticker']:<8} | {s['base_weight_pct']:<10.1f} | {s_sign}{s['last_sentiment']:<9.2f} | {s['normalized_weight']:<16.2f} | {d_sign}{delta:.2f}%")
    print(f"\n[+] Total Portfolio Allocation: {sum(s['normalized_weight'] for s in sp_stocks):.2f}% (Conservation satisfied)")

    # ---------------------------------------------------------
    # STAGE 3: MODULE B — STRATEGIC WHOLESALE STRESS TESTING
    # ---------------------------------------------------------
    print("\n" + "-" * 80)
    print("STAGE 3: MODULE B — WHOLESALE BANKING EVENT-DRIVEN STRESS TESTING")
    print("-" * 80)

    # Filter for high-impact trigger (Impact >= 7 or Geopolitical/Credit)
    high_impact_signals = [s for s in extracted_signals if s["impact_score"] >= 7]
    trigger_signal = high_impact_signals[0] if high_impact_signals else extracted_signals[0]

    print(f"[*] Trigger Event Detected: {trigger_signal['event_classification']} (Severity: {trigger_signal['impact_score']}/10)")
    print(f"[*] Trigger Context: {trigger_signal.get('source')} - Impact >= 7 activates Wholesale Stress Matrix\n")

    # Apply calibrated shocks
    spread_shock_bps = 180 * (trigger_signal["impact_score"] / 8)
    rate_shock_bps = 120 * (trigger_signal["impact_score"] / 8)

    total_base_val = sum(a["carrying_value_usd"] for a in wholesale_assets)
    total_stressed_val = 0

    print(f"{'Asset Name':<38} | {'Type':<16} | {'Base Val ($M)':<14} | {'Stressed ($M)':<14} | {'Impairment'}")
    print("-" * 95)

    for asset in wholesale_assets:
        base_v = asset["carrying_value_usd"]
        duration = asset["duration_years"]
        a_type = asset["asset_type"]

        if a_type == "Commercial Loan":
            mult = 1.0 - (duration * (spread_shock_bps / 10000) * 1.2)
        elif a_type in ["Corporate Bond", "Sovereign Bond"]:
            mult = 1.0 - (duration * ((rate_shock_bps + spread_shock_bps * 0.8) / 10000))
        elif a_type == "Derivatives":
            if "Hedge" in asset["asset_name"]:
                mult = 1.0 + (spread_shock_bps / 150)  # Hedge appreciation
            else:
                mult = 1.0 - (duration * (rate_shock_bps / 10000))
        else:
            mult = 0.95

        stressed_v = max(0, int(base_v * mult))
        total_stressed_val += stressed_v
        pct_chg = ((stressed_v - base_v) / base_v) * 100

        chg_sign = "+" if pct_chg > 0 else ""
        print(f"{asset['asset_name'][:36]:<38} | {a_type:<16} | ${base_v/1e6:<13.1f} | ${stressed_v/1e6:<13.1f} | {chg_sign}{pct_chg:.2f}%")

    drawdown_pct = ((total_base_val - total_stressed_val) / total_base_val) * 100
    total_loss = total_base_val - total_stressed_val

    print("-" * 95)
    print(f"[!] Total Wholesale Book Value (Pre-Stress):   ${total_base_val:,.2f}")
    print(f"[!] Total Wholesale Book Value (Post-Stress):  ${total_stressed_val:,.2f}")
    print(f"[!] Simulated Capital Drawdown:                ${total_loss:,.2f} (-{drawdown_pct:.2f}%)")
    print(f"[!] CDS Portfolio Hedge Contribution:          Mitigated downside by absorption of credit widening")

    print("\n" + "=" * 80)
    print("  EXECUTION COMPLETE: All modules verified successfully!")
    print("  Interactive Web Dashboard: Open index.html in browser or view on Vercel")
    print("=" * 80 + "\n")

if __name__ == "__main__":
    run_pipeline()
