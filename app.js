/**
 * SentinelRisk - UI Controller & Dashboard Logic
 */

let rebalanceChartInstance = null;
let stressChartInstance = null;
let currentTab = 'A';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (window.lucide) lucide.createIcons();

  // Initialize Charts
  initRebalanceChart();
  initStressChart();

  // Initial table renders
  renderIndexTable();
  renderWholesaleTable();

  // Auto-run first sample to populate dashboard nicely
  loadPresetSample('0');
  processCustomText();
});

// --- Tab Switching ---
function switchTab(tab) {
  currentTab = tab;
  const tabA = document.getElementById('tabBtnA');
  const tabB = document.getElementById('tabBtnB');
  const viewA = document.getElementById('moduleAView');
  const viewB = document.getElementById('moduleBView');

  if (tab === 'A') {
    tabA.className = 'px-5 py-2.5 font-bold text-sm border-b-2 border-cyan-400 text-cyan-400 flex items-center gap-2 transition cursor-pointer';
    tabB.className = 'px-5 py-2.5 font-semibold text-sm border-b-2 border-transparent text-slate-400 hover:text-slate-200 flex items-center gap-2 transition cursor-pointer';
    viewA.classList.remove('hidden');
    viewB.classList.add('hidden');
    if (rebalanceChartInstance) rebalanceChartInstance.update();
  } else {
    tabB.className = 'px-5 py-2.5 font-bold text-sm border-b-2 border-rose-400 text-rose-400 flex items-center gap-2 transition cursor-pointer';
    tabA.className = 'px-5 py-2.5 font-semibold text-sm border-b-2 border-transparent text-slate-400 hover:text-slate-200 flex items-center gap-2 transition cursor-pointer';
    viewB.classList.remove('hidden');
    viewA.classList.add('hidden');
    if (stressChartInstance) stressChartInstance.update();
  }
}

// --- Preset Samples Loader ---
function loadPresetSample(index) {
  if (index === '') return;
  const sample = window.RiskEngine.SAMPLE_FEEDS[parseInt(index, 10)];
  if (sample) {
    document.getElementById('feedSourceSelect').value = sample.sourceType === 'Social Media' ? 'X / Twitter Stream' : 'Bloomberg / Reuters Terminal';
    document.getElementById('rawTextInput').value = sample.headline + "\n\n" + sample.content;
  }
}

// --- Process Ingestion & Pipeline Execution ---
function processCustomText() {
  const text = document.getElementById('rawTextInput').value.trim();
  if (!text) return;

  const sourceName = document.getElementById('feedSourceSelect').value;
  const sourceType = sourceName.includes('Twitter') ? 'Social Media' : 'Financial News';

  // 1. Run NLP Risk Engine
  const signal = window.RiskEngine.analyzeTextNLP(text, sourceName, sourceType);

  // 2. Downstream Module A: Rebalance Mock Index
  window.RiskEngine.executeTacticalRebalance(signal);

  // 3. Downstream Module B: Execute Stress Test
  const stressResult = window.RiskEngine.executeStressTest(signal);

  // 4. Update UI Components
  updateSignalsStream();
  renderIndexTable();
  updateRebalanceChart();
  renderWholesaleTable(stressResult);
  updateStressDashboard(stressResult);

  // Update total signals metric
  const signals = window.RiskEngine.getProcessedSignals();
  document.getElementById('statTotalSignals').innerText = signals.length;

  if (window.lucide) lucide.createIcons();
}

// --- Batch Simulation ---
function simulateAllFeeds() {
  const samples = window.RiskEngine.SAMPLE_FEEDS;
  samples.forEach((sample, idx) => {
    setTimeout(() => {
      document.getElementById('feedSourceSelect').value = sample.sourceType === 'Social Media' ? 'X / Twitter Stream' : 'Bloomberg / Reuters Terminal';
      document.getElementById('rawTextInput').value = sample.headline + "\n\n" + sample.content;
      processCustomText();
    }, idx * 450);
  });
}

function clearAllSignals() {
  window.RiskEngine.getProcessedSignals().length = 0;
  updateSignalsStream();
  document.getElementById('statTotalSignals').innerText = '0';
}

// --- Render Signal Cards Stream ---
function updateSignalsStream() {
  const signals = window.RiskEngine.getProcessedSignals();
  const container = document.getElementById('signalsContainer');

  if (signals.length === 0) {
    container.innerHTML = `<div class="text-center py-12 text-slate-500 text-xs">No signals generated yet. Click "Process Sample Stream" above or submit text to start ingestion.</div>`;
    return;
  }

  container.innerHTML = signals.map(s => {
    const isBull = s.sentimentScore > 0.15;
    const isBear = s.sentimentScore < -0.15;
    const sentColor = isBull ? 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30' : isBear ? 'text-rose-400 bg-rose-950/60 border-rose-500/30' : 'text-slate-300 bg-slate-800 border-slate-700';
    const sentBadge = isBull ? 'BULLISH' : isBear ? 'BEARISH' : 'NEUTRAL';
    const impactColor = s.impactScore >= 7 ? 'text-rose-400 border-rose-500/40 bg-rose-950/40' : s.impactScore >= 5 ? 'text-amber-400 border-amber-500/40 bg-amber-950/40' : 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40';

    return `
      <div class="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 hover:border-cyan-500/40 transition space-y-2">
        <div class="flex items-center justify-between text-[11px]">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded font-mono font-bold bg-slate-800 text-cyan-400">${s.id}</span>
            <span class="text-slate-400">${s.source}</span>
          </div>
          <span class="text-slate-500">${s.timestamp}</span>
        </div>

        <p class="text-xs text-slate-200 line-clamp-2">${s.textSnippet}</p>

        <div class="flex flex-wrap items-center gap-2 pt-1 border-t border-white/5 text-[11px]">
          <span class="px-2 py-0.5 rounded border ${sentColor} font-mono font-semibold">
            Sentiment: ${s.sentimentScore > 0 ? '+' : ''}${s.sentimentScore.toFixed(2)} (${sentBadge})
          </span>
          <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            ${s.eventClassification}
          </span>
          <span class="px-2 py-0.5 rounded border ${impactColor} font-mono font-bold">
            Impact: ${s.impactScore}/10
          </span>
          <span class="ml-auto text-cyan-300 font-mono text-[10px] bg-cyan-950/40 px-2 py-0.5 rounded">
            Target: ${s.ticker}
          </span>
        </div>
      </div>
    `;
  }).join('');
}

// --- Module A: Rebalance Visuals ---
function initRebalanceChart() {
  const ctx = document.getElementById('rebalanceChart').getContext('2d');
  const portfolio = window.RiskEngine.getIndexPortfolio();

  rebalanceChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: portfolio.map(p => p.ticker),
      datasets: [
        {
          label: 'Base Weight (%)',
          data: portfolio.map(p => p.baseWeight),
          backgroundColor: 'rgba(148, 163, 184, 0.35)',
          borderColor: 'rgba(148, 163, 184, 0.7)',
          borderWidth: 1,
          borderRadius: 4
        },
        {
          label: 'Dynamic AI Weight (%)',
          data: portfolio.map(p => p.currentWeight),
          backgroundColor: 'rgba(0, 242, 254, 0.8)',
          borderColor: '#00f2fe',
          borderWidth: 1,
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8', font: { family: 'monospace', size: 10 } }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#cbd5e1', font: { weight: 'bold', size: 11 } }
        }
      },
      plugins: {
        legend: {
          labels: { color: '#e2e8f0', font: { size: 11 } }
        }
      }
    }
  });
}

function updateRebalanceChart() {
  if (!rebalanceChartInstance) return;
  const portfolio = window.RiskEngine.getIndexPortfolio();
  rebalanceChartInstance.data.datasets[1].data = portfolio.map(p => p.currentWeight);
  rebalanceChartInstance.update();
}

function renderIndexTable() {
  const portfolio = window.RiskEngine.getIndexPortfolio();
  const tbody = document.getElementById('indexTableBody');

  tbody.innerHTML = portfolio.map(stock => {
    const delta = stock.currentWeight - stock.baseWeight;
    const deltaColor = delta > 0.01 ? 'text-emerald-400' : delta < -0.01 ? 'text-rose-400' : 'text-slate-400';
    const deltaStr = (delta > 0 ? '+' : '') + delta.toFixed(2) + '%';

    return `
      <tr class="hover:bg-slate-800/40 transition">
        <td class="py-2.5 font-bold text-cyan-300">${stock.ticker} <span class="text-[10px] text-slate-400 font-normal">(${stock.name.split(' ')[0]})</span></td>
        <td class="text-slate-400">${stock.baseWeight.toFixed(1)}%</td>
        <td class="text-white font-bold">${stock.currentWeight.toFixed(2)}% <span class="text-[10px] ${deltaColor}">(${deltaStr})</span></td>
        <td>
          <span class="px-1.5 py-0.5 rounded text-[10px] ${stock.sentiment > 0.1 ? 'bg-emerald-950 text-emerald-400' : stock.sentiment < -0.1 ? 'bg-rose-950 text-rose-400' : 'bg-slate-800 text-slate-400'}">
            ${stock.sentiment > 0 ? '+' : ''}${stock.sentiment.toFixed(2)}
          </span>
        </td>
      </tr>
    `;
  }).join('');
}

// --- Module B: Stress-Testing Visuals ---
function initStressChart() {
  const ctx = document.getElementById('stressChart').getContext('2d');
  const wholesale = window.RiskEngine.getWholesalePortfolio();

  // Aggregate by asset type
  const typeMap = {};
  wholesale.forEach(w => {
    typeMap[w.assetType] = (typeMap[w.assetType] || 0) + (w.baseValue / 1000000);
  });

  const labels = Object.keys(typeMap);

  stressChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Baseline Notional ($M)',
          data: labels.map(l => typeMap[l]),
          backgroundColor: 'rgba(79, 172, 254, 0.4)',
          borderColor: '#4facfe',
          borderWidth: 1,
          borderRadius: 4
        },
        {
          label: 'Stressed Valuation ($M)',
          data: labels.map(l => typeMap[l]),
          backgroundColor: 'rgba(244, 63, 94, 0.75)',
          borderColor: '#f43f5e',
          borderWidth: 1,
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8', font: { family: 'monospace', size: 10 } }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#cbd5e1', font: { size: 10 } }
        }
      },
      plugins: {
        legend: { labels: { color: '#e2e8f0', font: { size: 11 } } }
      }
    }
  });
}

function updateStressDashboard(stressResult) {
  if (!stressResult) return;

  // Format currency
  const fmt = (num) => '$' + num.toLocaleString();

  document.getElementById('stressBaseVal').innerText = fmt(stressResult.totalBaseValue);
  document.getElementById('stressNewVal').innerText = fmt(stressResult.totalStressedValue);
  document.getElementById('stressLossVal').innerText = fmt(stressResult.totalLoss);

  const deltaPctElem = document.getElementById('stressPctDelta');
  deltaPctElem.innerText = `-${stressResult.portfolioDrawdownPct}% Drawdown`;
  deltaPctElem.className = 'text-[10px] text-rose-400 font-bold';

  const badge = document.getElementById('stressTestStatusBadge');
  if (stressResult.isHighImpact) {
    badge.className = 'px-3 py-1.5 rounded-lg bg-rose-950/80 border border-rose-500/50 text-xs font-semibold text-rose-400 flex items-center gap-1.5 animate-pulse';
    badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-rose-500"></span> STRESS TEST TRIGGERED (${stressResult.triggerSignal.eventClassification})`;
  } else {
    badge.className = 'px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300';
    badge.innerHTML = `Baseline Impact (Severity: ${stressResult.triggerSignal.impactScore}/10)`;
  }

  const p = stressResult.shockParameters;
  document.getElementById('stressShockParams').innerText = 
    `Eq: ${(p.equityShock * 100).toFixed(1)}% | Spread: +${p.creditSpreadShockBps}bps | Rate: +${p.interestRateShockBps}bps`;

  // Update chart
  if (stressChartInstance) {
    const typeBase = {};
    const typeStressed = {};

    stressResult.stressedAssets.forEach(a => {
      typeBase[a.assetType] = (typeBase[a.assetType] || 0) + (a.baseValue / 1000000);
      typeStressed[a.assetType] = (typeStressed[a.assetType] || 0) + (a.stressedValue / 1000000);
    });

    const labels = Object.keys(typeBase);
    stressChartInstance.data.labels = labels;
    stressChartInstance.data.datasets[0].data = labels.map(l => typeBase[l]);
    stressChartInstance.data.datasets[1].data = labels.map(l => typeStressed[l]);
    stressChartInstance.update();
  }
}

function renderWholesaleTable(stressResult = null) {
  const assets = stressResult ? stressResult.stressedAssets : window.RiskEngine.getWholesalePortfolio();
  const tbody = document.getElementById('wholesaleTableBody');

  tbody.innerHTML = assets.map(a => {
    const lossPct = a.percentageChange !== undefined ? a.percentageChange : 0;
    const lossClass = lossPct < 0 ? 'text-rose-400 font-bold' : lossPct > 0 ? 'text-emerald-400 font-bold' : 'text-slate-400';

    return `
      <tr class="hover:bg-slate-800/40 transition">
        <td class="py-2.5 font-sans font-medium text-slate-200">${a.assetName}</td>
        <td class="text-slate-400">${a.assetType}</td>
        <td class="text-cyan-300">$${(a.baseValue / 1000000).toFixed(1)}M</td>
        <td><span class="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300">${a.creditRating}</span></td>
        <td class="${lossClass}">${lossPct > 0 ? '+' : ''}${lossPct.toFixed(2)}%</td>
      </tr>
    `;
  }).join('');
}
