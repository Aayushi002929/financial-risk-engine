/**
 * SentinelRisk - Financial NLP Risk Engine & Analytics Engine
 * Modules: NLP Ingestion, Tactical Rebalancing (Module A), Strategic Stress Testing (Module B)
 */

// --- 1. NLP Risk Engine Lexicons & Dictionaries ---
const FINANCIAL_LEXICON = {
  // Sentiment weights (-1.0 to 1.0)
  surge: 0.85, record: 0.8, rally: 0.75, beat: 0.8, outperform: 0.7, profit: 0.7, breakthrough: 0.9,
  partnership: 0.65, approval: 0.75, growth: 0.6, dividend: 0.5, bullish: 0.8, upgrade: 0.75, innovation: 0.6,
  success: 0.7, jump: 0.65, boost: 0.6, gain: 0.65, soaring: 0.8, expands: 0.55,
  crash: -0.9, plunge: -0.85, slump: -0.75, fraud: -0.95, investigation: -0.8, downgrade: -0.75, default: -0.95,
  bankrupt: -0.98, subpoena: -0.85, loss: -0.7, warning: -0.65, probe: -0.75, breach: -0.8, penalty: -0.7,
  fine: -0.65, sanctions: -0.85, bearish: -0.75, recession: -0.8, contagion: -0.9, lawsuit: -0.65, scandal: -0.9,
  miss: -0.6, decline: -0.55, drop: -0.5, tariff: -0.6, conflict: -0.75, war: -0.85, inflation: -0.45
};

const EVENT_PATTERNS = [
  { type: 'Geopolitical', keywords: ['sanctions', 'tariff', 'war', 'tensions', 'embargo', 'strait', 'geopolitical', 'treaty', 'military', 'border'] },
  { type: 'Macroeconomic', keywords: ['inflation', 'fed', 'interest rate', 'rate hike', 'treasury', 'yield', 'cpi', 'gdp', 'recession', 'central bank', 'unemployment'] },
  { type: 'Credit Event', keywords: ['default', 'downgrade', 'liquidity', 'insolvency', 'bankruptcy', 'credit facility', 'distressed', 'spread blowout', 'non-performing'] },
  { type: 'Merger & Acquisition', keywords: ['acquisition', 'merger', 'buyout', 'takeover', 'hostile', 'consortium', 'all-cash', 'deal value', 'antitrust clearance'] },
  { type: 'Regulatory / Legal', keywords: ['probe', 'investigation', 'sec', 'subpoena', 'fraud', 'lawsuit', 'fine', 'penalty', 'compliance', 'regulator', 'doj'] },
  { type: 'Product / Tech Launch', keywords: ['launch', 'patent', 'breakthrough', 'announces new', 'partnership', 'ai platform', 'flagship', 'unveils', 'fda approval'] }
];

const TICKER_MAP = {
  'apple': 'AAPL', 'aapl': 'AAPL', 'iphone': 'AAPL',
  'microsoft': 'MSFT', 'msft': 'MSFT', 'azure': 'MSFT',
  'nvidia': 'NVDA', 'nvda': 'NVDA', 'geforce': 'NVDA', 'blackwell': 'NVDA',
  'amazon': 'AMZN', 'amzn': 'AMZN', 'aws': 'AMZN',
  'google': 'GOOGL', 'alphabet': 'GOOGL', 'googl': 'GOOGL',
  'jpmorgan': 'JPM', 'jpm': 'JPM', 'chase': 'JPM', 'jamie dimon': 'JPM',
  'tesla': 'TSLA', 'tsla': 'TSLA', 'elon': 'TSLA',
  'exxon': 'XOM', 'xom': 'XOM', 'exxonmobil': 'XOM',
  'pfizer': 'PFE', 'pfe': 'PFE',
  'goldman': 'GS', 'goldman sachs': 'GS', 'gs': 'GS'
};

// --- Mock Portfolio for Module A (Tactical Index Rebalancer) ---
let indexPortfolio = [
  { ticker: 'AAPL', name: 'Apple Inc.', baseWeight: 14.0, currentWeight: 14.0, sentiment: 0.15, scoreImpact: 0 },
  { ticker: 'MSFT', name: 'Microsoft Corp.', baseWeight: 14.0, currentWeight: 14.0, sentiment: 0.10, scoreImpact: 0 },
  { ticker: 'NVDA', name: 'NVIDIA Corp.', baseWeight: 12.0, currentWeight: 12.0, sentiment: 0.25, scoreImpact: 0 },
  { ticker: 'AMZN', name: 'Amazon.com Inc.', baseWeight: 10.0, currentWeight: 10.0, sentiment: 0.05, scoreImpact: 0 },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', baseWeight: 10.0, currentWeight: 10.0, sentiment: 0.08, scoreImpact: 0 },
  { ticker: 'JPM', name: 'JPMorgan Chase & Co.', baseWeight: 10.0, currentWeight: 10.0, sentiment: -0.05, scoreImpact: 0 },
  { ticker: 'TSLA', name: 'Tesla Inc.', baseWeight: 8.0, currentWeight: 8.0, sentiment: -0.20, scoreImpact: 0 },
  { ticker: 'XOM', name: 'Exxon Mobil Corp.', baseWeight: 8.0, currentWeight: 8.0, sentiment: 0.12, scoreImpact: 0 },
  { ticker: 'PFE', name: 'Pfizer Inc.', baseWeight: 7.0, currentWeight: 7.0, sentiment: 0.00, scoreImpact: 0 },
  { ticker: 'GS', name: 'Goldman Sachs Group', baseWeight: 7.0, currentWeight: 7.0, sentiment: 0.02, scoreImpact: 0 }
];

// --- Mock Portfolio for Module B (Wholesale Banking Assets) ---
const wholesalePortfolio = [
  { id: 'WB-001', assetName: 'Syndicated Term Loan B (Tech Corp)', assetType: 'Commercial Loan', notional: 45000000, creditRating: 'BBB-', duration: 3.5, baseValue: 45000000, currentValue: 45000000 },
  { id: 'WB-002', assetName: 'Senior Secured Energy Infrastructure Bond', assetType: 'Corporate Bond', notional: 35000000, creditRating: 'A+', duration: 6.2, baseValue: 35000000, currentValue: 35000000 },
  { id: 'WB-003', assetName: 'Interest Rate Swap Portfolio (Float-to-Fixed)', assetType: 'Derivatives', notional: 60000000, creditRating: 'AA-', duration: 4.8, baseValue: 6000000, currentValue: 6000000 },
  { id: 'WB-004', assetName: 'Commercial Real Estate Mezzanine Debt', assetType: 'Commercial Loan', notional: 28000000, creditRating: 'BB', duration: 2.8, baseValue: 28000000, currentValue: 28000000 },
  { id: 'WB-005', assetName: 'Sovereign Emerging Market Debt Notes', assetType: 'Sovereign Bond', notional: 22000000, creditRating: 'BBB', duration: 7.1, baseValue: 22000000, currentValue: 22000000 },
  { id: 'WB-006', assetName: 'Credit Default Swap Index Hedge (CDX.NA.IG)', assetType: 'Derivatives', notional: 40000000, creditRating: 'AAA', duration: 1.5, baseValue: 4000000, currentValue: 4000000 }
];

// Pre-packaged Live Sample Feed
const SAMPLE_FEEDS = [
  {
    id: 1,
    source: "Bloomberg News Terminal",
    sourceType: "News Feed",
    headline: "NVIDIA Unveils Quantum-Ready AI Architecture with Record Order Backlog from Cloud Giants",
    content: "NVIDIA Corp (NVDA) surged today after announcing a major technological breakthrough in accelerated datacenter computing, with analysts forecasting a 35% beat on upcoming quarterly margins. Hyperscalers have expanded long-term partnership agreements.",
    timestamp: "2 mins ago"
  },
  {
    id: 2,
    source: "X / Twitter Finance",
    sourceType: "Social Media",
    headline: "$TSLA faces regulatory probe over autonomous driving telemetry failures; DOJ opens formal review",
    content: "Breaking: Regulators and DOJ have issued a formal subpoena to Tesla following multiple safety discrepancies in full self-driving data logs. Stock down 5.8% pre-market as risk monitors issue severe warnings.",
    timestamp: "5 mins ago"
  },
  {
    id: 3,
    source: "Financial Times Live",
    sourceType: "News Feed",
    headline: "Middle East Strait of Hormuz Tensions Flare; Threatens Crude Shipping Lanes and Strains Global Trade",
    content: "Escalating geopolitical conflict and newly introduced retaliatory sanctions have heightened maritime shipping insurance premiums. Global market participants fear acute supply chain disruption and inflation contagion.",
    timestamp: "8 mins ago"
  },
  {
    id: 4,
    source: "Wall Street Journal Alert",
    sourceType: "News Feed",
    headline: "Commercial Real Estate Developer Default Rattles Regional Banks; Credit Downgrades Accelerate",
    content: "A major commercial office developer with $3.8B in liabilities defaulted on senior syndicated loans, causing rating agencies to initiate swift credit downgrades across bank debt portfolios.",
    timestamp: "12 mins ago"
  },
  {
    id: 5,
    source: "X / Twitter MacroWatcher",
    sourceType: "Social Media",
    headline: "Federal Reserve chair signals higher-for-longer policy; 10Y Treasury yields spike to 16-year high",
    content: "Fed statement indicates persistent inflation pressures; rate hike trajectory may stay elevated. Heavy pressure observed across wholesale bonds and sovereign debt portfolios as yield curve shifts.",
    timestamp: "15 mins ago"
  }
];

// Ingested signal historical log
let processedSignals = [];
let rebalanceHistory = [];
let stressTestResult = null;

// --- Core NLP Risk Analysis Function ---
function analyzeTextNLP(text, sourceName = 'Manual Input', sourceType = 'User Feed') {
  const cleanText = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = cleanText.split(/\s+/).filter(w => w.length > 1);

  // 1. Calculate Sentiment Score (-1.0 to 1.0)
  let sentimentTotal = 0;
  let sentimentCount = 0;
  let detectedKeywords = [];

  words.forEach(word => {
    if (FINANCIAL_LEXICON[word] !== undefined) {
      sentimentTotal += FINANCIAL_LEXICON[word];
      sentimentCount++;
      detectedKeywords.push({ word, weight: FINANCIAL_LEXICON[word] });
    }
  });

  let sentimentScore = 0;
  if (sentimentCount > 0) {
    sentimentScore = sentimentTotal / sentimentCount;
    // Dampen and normalize between -1.0 and 1.0
    sentimentScore = Math.max(-1.0, Math.min(1.0, Number((sentimentScore).toFixed(3))));
  }

  // 2. Identify Event Classification
  let bestEvent = 'General Corporate Announcement';
  let maxMatches = 0;

  EVENT_PATTERNS.forEach(pattern => {
    let matches = 0;
    pattern.keywords.forEach(kw => {
      if (cleanText.includes(kw)) {
        matches++;
      }
    });
    if (matches > maxMatches) {
      maxMatches = matches;
      bestEvent = pattern.type;
    }
  });

  // 3. Extract Company / Ticker
  let detectedTicker = 'MACRO/SYSTEMIC';
  for (const [key, ticker] of Object.entries(TICKER_MAP)) {
    if (cleanText.includes(key)) {
      detectedTicker = ticker;
      break;
    }
  }

  // 4. Calculate Market Impact Score (1 to 10)
  // Depends on sentiment extremity, detected event severity, and match count
  const eventMultipliers = {
    'Geopolitical': 8.5,
    'Credit Event': 9.0,
    'Macroeconomic': 8.0,
    'Regulatory / Legal': 7.5,
    'Merger & Acquisition': 6.5,
    'Product / Tech Launch': 5.5,
    'General Corporate Announcement': 3.5
  };

  const baseSeverity = eventMultipliers[bestEvent] || 4.0;
  const sentimentAbs = Math.abs(sentimentScore); // 0 to 1
  let calculatedImpact = (baseSeverity * 0.6) + (sentimentAbs * 3.5) + (Math.min(maxMatches, 3) * 0.5);
  let impactScore = Math.min(10, Math.max(1, Math.round(calculatedImpact)));

  const signal = {
    id: 'SIG-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
    timestamp: new Date().toLocaleTimeString(),
    source: sourceName,
    sourceType: sourceType,
    textSnippet: text.length > 120 ? text.substring(0, 117) + '...' : text,
    ticker: detectedTicker,
    sentimentScore: sentimentScore,
    sentimentLabel: sentimentScore > 0.15 ? 'BULLISH' : sentimentScore < -0.15 ? 'BEARISH' : 'NEUTRAL',
    eventClassification: bestEvent,
    impactScore: impactScore,
    detectedKeywords: detectedKeywords
  };

  // Add to in-memory store
  processedSignals.unshift(signal);
  if (processedSignals.length > 25) processedSignals.pop();

  return signal;
}

// --- Module A: Tactical Index Rebalancer Logic ---
function executeTacticalRebalance(signal) {
  // Check if ticker is in mock index
  const stock = indexPortfolio.find(s => s.ticker === signal.ticker);
  
  if (stock) {
    // Dynamic weight adjustment: delta proportional to sentiment
    const adjustmentFactor = signal.sentimentScore * 3.5; // up to +/- 3.5% shift
    stock.sentiment = signal.sentimentScore;
    stock.scoreImpact = signal.impactScore;
    stock.currentWeight = Math.max(2.0, stock.baseWeight + adjustmentFactor);
  } else {
    // If Macro/Systemic event, apply directional beta tilt
    indexPortfolio.forEach(s => {
      const systemicDelta = signal.sentimentScore * 0.8;
      s.currentWeight = Math.max(2.0, s.currentWeight + systemicDelta);
    });
  }

  // Renormalize portfolio weights to sum exactly to 100%
  const currentTotal = indexPortfolio.reduce((sum, s) => sum + s.currentWeight, 0);
  indexPortfolio.forEach(s => {
    s.currentWeight = Number(((s.currentWeight / currentTotal) * 100).toFixed(2));
  });

  // Record rebalance snapshot
  rebalanceHistory.unshift({
    timestamp: new Date().toLocaleTimeString(),
    triggerSignal: signal.id,
    triggerTicker: signal.ticker,
    portfolioSnapshot: JSON.parse(JSON.stringify(indexPortfolio))
  });

  if (rebalanceHistory.length > 10) rebalanceHistory.pop();
}

// --- Module B: Strategic Wholesale Stress-Testing Logic ---
function executeStressTest(signal) {
  // Trigger stress test when Impact Score >= 7 or high-risk event category
  const isHighImpact = signal.impactScore >= 7 || ['Geopolitical', 'Credit Event', 'Macroeconomic'].includes(signal.eventClassification);

  let shockParameters = {
    equityShock: 0,
    creditSpreadShockBps: 0,
    interestRateShockBps: 0,
    fxShock: 0
  };

  // Calibrate shocks based on NLP event categorization
  switch (signal.eventClassification) {
    case 'Geopolitical':
      shockParameters.equityShock = -0.12 * (signal.impactScore / 8);
      shockParameters.creditSpreadShockBps = 150 * (signal.impactScore / 8);
      shockParameters.interestRateShockBps = 40;
      break;
    case 'Credit Event':
      shockParameters.creditSpreadShockBps = 320 * (signal.impactScore / 8);
      shockParameters.equityShock = -0.09 * (signal.impactScore / 8);
      shockParameters.interestRateShockBps = -25; // Flight to safety
      break;
    case 'Macroeconomic':
      shockParameters.interestRateShockBps = 180 * (signal.impactScore / 8);
      shockParameters.creditSpreadShockBps = 110;
      shockParameters.equityShock = -0.14 * (signal.impactScore / 8);
      break;
    default:
      shockParameters.equityShock = signal.sentimentScore < 0 ? -0.05 : 0.03;
      shockParameters.creditSpreadShockBps = signal.sentimentScore < 0 ? 60 : -20;
      shockParameters.interestRateShockBps = 20;
      break;
  }

  // Stress-test each asset in the wholesale banking portfolio
  let totalBaseValue = 0;
  let totalStressedValue = 0;

  const stressedAssets = wholesalePortfolio.map(asset => {
    totalBaseValue += asset.baseValue;
    let priceMultiplier = 1.0;

    if (asset.assetType === 'Commercial Loan') {
      // Impacted by credit spread widening: Delta P approx - Duration * Delta Spread
      const spreadDelta = shockParameters.creditSpreadShockBps / 10000;
      priceMultiplier = 1.0 - (asset.duration * spreadDelta * 1.2);
    } else if (asset.assetType === 'Corporate Bond' || asset.assetType === 'Sovereign Bond') {
      // Impacted by interest rate and spread shifts
      const rateDelta = shockParameters.interestRateShockBps / 10000;
      const spreadDelta = shockParameters.creditSpreadShockBps / 10000;
      priceMultiplier = 1.0 - (asset.duration * (rateDelta + spreadDelta * 0.8));
    } else if (asset.assetType === 'Derivatives') {
      // Non-linear hedge sensitivity
      if (asset.assetName.includes('Hedge')) {
        // Hedges gain value during credit widening
        priceMultiplier = 1.0 + (shockParameters.creditSpreadShockBps / 150);
      } else {
        priceMultiplier = 1.0 - (asset.duration * (shockParameters.interestRateShockBps / 10000));
      }
    }

    const stressedVal = Math.max(0, Math.round(asset.baseValue * priceMultiplier));
    totalStressedValue += stressedVal;

    return {
      ...asset,
      stressedValue: stressedVal,
      lossAmount: asset.baseValue - stressedVal,
      percentageChange: Number((((stressedVal - asset.baseValue) / asset.baseValue) * 100).toFixed(2))
    };
  });

  const totalLoss = totalBaseValue - totalStressedValue;
  const portfolioDrawdownPct = Number(((totalLoss / totalBaseValue) * 100).toFixed(2));

  stressTestResult = {
    triggerSignal: signal,
    shockParameters: shockParameters,
    isHighImpact: isHighImpact,
    totalBaseValue: totalBaseValue,
    totalStressedValue: totalStressedValue,
    totalLoss: totalLoss,
    portfolioDrawdownPct: portfolioDrawdownPct,
    stressedAssets: stressedAssets
  };

  return stressTestResult;
}

// Export for UI consumption
window.RiskEngine = {
  SAMPLE_FEEDS,
  analyzeTextNLP,
  executeTacticalRebalance,
  executeStressTest,
  getIndexPortfolio: () => indexPortfolio,
  getWholesalePortfolio: () => wholesalePortfolio,
  getProcessedSignals: () => processedSignals,
  getRebalanceHistory: () => rebalanceHistory,
  getStressTestResult: () => stressTestResult
};
