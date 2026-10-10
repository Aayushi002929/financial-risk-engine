import json
import re
from datetime import datetime

class FinancialNLPRiskEngine:
    def __init__(self):
        self.sentiment_lexicon = {
            "surge": 0.85, "record": 0.8, "rally": 0.75, "beat": 0.8, "breakthrough": 0.9,
            "partnership": 0.65, "growth": 0.6, "bullish": 0.8, "upgrade": 0.75, "success": 0.7,
            "crash": -0.9, "plunge": -0.85, "slump": -0.75, "fraud": -0.95, "investigation": -0.8,
            "downgrade": -0.75, "default": -0.95, "bankrupt": -0.98, "subpoena": -0.85, "loss": -0.7,
            "probe": -0.75, "penalty": -0.7, "sanctions": -0.85, "recession": -0.8, "war": -0.85
        }
        self.event_patterns = {
            "Geopolitical": ["sanctions", "tariff", "war", "tensions", "geopolitical", "military", "embargo"],
            "Macroeconomic": ["inflation", "fed", "interest rate", "rate hike", "treasury", "yield", "gdp", "cpi"],
            "Credit Event": ["default", "downgrade", "liquidity", "insolvency", "bankruptcy", "distressed"],
            "Regulatory / Legal": ["probe", "investigation", "sec", "subpoena", "fraud", "lawsuit", "penalty", "doj"],
            "Product / Tech Launch": ["launch", "patent", "breakthrough", "announces new", "unveils", "platform"]
        }
        self.ticker_map = {
            "apple": "AAPL", "aapl": "AAPL", "microsoft": "MSFT", "msft": "MSFT",
            "nvidia": "NVDA", "nvda": "NVDA", "tesla": "TSLA", "tsla": "TSLA",
            "jpmorgan": "JPM", "amazon": "AMZN", "google": "GOOGL"
        }

    def analyze(self, text: str, source: str = "News Feed") -> dict:
        clean = re.sub(r'[^a-zA-Z0-9\s]', ' ', text.lower())
        words = clean.split()

        # 1. Sentiment Score (-1.0 to 1.0)
        scores = [self.sentiment_lexicon[w] for w in words if w in self.sentiment_lexicon]
        sentiment_score = round(sum(scores) / len(scores), 3) if scores else 0.0

        # 2. Event Classification
        detected_event = "General Corporate Announcement"
        max_matches = 0
        for event, kws in self.event_patterns.items():
            matches = sum(1 for kw in kws if kw in clean)
            if matches > max_matches:
                max_matches = matches
                detected_event = event

        # 3. Target Ticker Extraction
        ticker = "MACRO/SYSTEMIC"
        for k, sym in self.ticker_map.items():
            if k in clean:
                ticker = sym
                break

        # 4. Severity Impact Score (1 to 10)
        severity_weights = {
            "Geopolitical": 8.5, "Credit Event": 9.0, "Macroeconomic": 8.0,
            "Regulatory / Legal": 7.5, "Product / Tech Launch": 5.5,
            "General Corporate Announcement": 3.5
        }
        base_sev = severity_weights.get(detected_event, 4.0)
        impact_score = min(10, max(1, round(base_sev * 0.6 + abs(sentiment_score) * 3.5 + min(max_matches, 3) * 0.5)))

        return {
            "source": source,
            "ticker": ticker,
            "sentiment_score": sentiment_score,
            "sentiment_label": "BULLISH" if sentiment_score > 0.15 else "BEARISH" if sentiment_score < -0.15 else "NEUTRAL",
            "event_classification": detected_event,
            "impact_score": impact_score,
            "timestamp": datetime.now().isoformat()
        }

if __name__ == "__main__":
    engine = FinancialNLPRiskEngine()
    sample = "NVIDIA surges after announcing breakthrough AI architecture with record orders."
    result = engine.analyze(sample, source="Reuters")
    print(json.dumps(result, indent=2))
