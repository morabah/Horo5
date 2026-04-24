// === CHART RENDERING (charts.js) ===
Chart.defaults.color = '#9898b0';
Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
Chart.defaults.font.family = 'Cairo';

const charts = {};

function destroyChart(id) {
  if (charts[id]) {
    charts[id].destroy();
    delete charts[id];
  }
}

function legend(position='top') {
  return {
    position,
    rtl: lang === 'ar',
    textDirection: lang === 'ar' ? 'rtl' : 'ltr'
  };
}

function pct(v) {
  return (v / C.price * 100).toFixed(1) + '%';
}

function moneyCell(value, color) {
  const style = color ? ` style="text-align:right;color:${color}"` : ' style="text-align:right"';
  return `<td${style}>${value}</td>`;
}

function fixedLabel(key) {
  return tx(`input.${key}`);
}

function renderOverview() {
  const t = document.getElementById('unitEconTable');
  t.innerHTML = `<thead><tr><th>${tx('table.component')}</th><th>${tx('unit.egp')}</th><th>${tx('table.percent')}</th></tr></thead><tbody>
    <tr><td>${tx('input.shirt')}</td><td>${fmtD(C.cogs.shirt)}</td><td>${pct(C.cogs.shirt)}</td></tr>
    <tr><td>${tx('input.markup')}</td><td>${fmt(C.cogs.markup)}</td><td>${pct(C.cogs.markup)}</td></tr>
    <tr><td>${tx('input.dtf')}</td><td>${fmt(C.cogs.dtf)}</td><td>${pct(C.cogs.dtf)}</td></tr>
    <tr><td>${tx('input.pkg')}</td><td>${fmt(C.cogs.pkg)}</td><td>${pct(C.cogs.pkg)}</td></tr>
    <tr><td>${tx('input.tags')}</td><td>${fmt(C.cogs.tags)}</td><td>${pct(C.cogs.tags)}</td></tr>
    <tr class="row-total"><td><strong>${tx('table.totalCOGS')}</strong></td><td><strong>${fmtD(D.totalCOGS)}</strong></td><td><strong>${pct(D.totalCOGS)}</strong></td></tr>
    <tr class="row-sep"><td colspan="3"></td></tr>
    <tr class="row-var"><td>CPA <span class="badge badge-var">${tx('table.variableBadge')}</span></td><td>${fmt(C.perUnit.cpa)}</td><td>${pct(C.perUnit.cpa)}</td></tr>
    <tr class="row-var"><td>${tx('input.subsidiary')}</td><td>${fmt(C.perUnit.subsidiary)}</td><td>${pct(C.perUnit.subsidiary)}</td></tr>
    <tr class="row-var"><td>${tx('input.platform')}</td><td>${fmt(C.perUnit.platform)}</td><td>${pct(C.perUnit.platform)}</td></tr>
    <tr class="row-var"><td>${tx('input.tax')}</td><td>${fmtD(C.perUnit.tax)}</td><td>${pct(C.perUnit.tax)}</td></tr>
    <tr class="row-total"><td><strong>${tx('table.totalVariable')}</strong></td><td><strong>${fmtD(D.totalVar)}</strong></td><td><strong>${pct(D.totalVar)}</strong></td></tr>
    <tr class="row-sep"><td colspan="3"></td></tr>
    <tr class="row-total highlight-green"><td><strong>${tx('table.totalCostUnit')}</strong></td><td><strong>${fmtD(D.costPerUnit)}</strong></td><td><strong>${pct(D.costPerUnit)}</strong></td></tr>
    <tr class="row-total highlight-profit"><td><strong>${tx('table.contributionMargin')}</strong></td><td><strong>${fmtD(D.margin)}</strong></td><td><strong>${pct(D.margin)}</strong></td></tr>
  </tbody>`;

  const ft = document.getElementById('fixedTable');
  ft.innerHTML = `<thead><tr><th>${tx('table.item')}</th><th>${tx('unit.egp')}</th></tr></thead><tbody>
    ${Object.entries(C.fixed).map(([k,v]) => `<tr><td>${fixedLabel(k)}</td><td>${fmt(v)}</td></tr>`).join('')}
    <tr class="row-total"><td><strong>${tx('table.total')}</strong></td><td><strong>${fmt(D.totalFixed)}</strong></td></tr></tbody>`;

  const mt = document.getElementById('monthlyTable');
  mt.innerHTML = `<thead><tr><th>${tx('table.item')}</th><th>${tx('unit.egpMo')}</th></tr></thead><tbody>
    <tr><td>${tx('input.content')}</td><td>${fmt(C.monthly.content)}</td></tr>
    <tr><td>${tx('input.hosting')}</td><td>${fmt(C.monthly.hosting)}</td></tr>
    <tr><td>${tx('input.design')}</td><td>${fmt(C.monthly.design)}</td></tr>
    <tr><td>${tx('input.moderator')}</td><td>${fmt(C.monthly.moderator)}</td></tr>
    <tr class="row-total"><td><strong>${tx('table.subtotalNoOperator')}</strong></td><td><strong>${fmt(D.growthMonthly)}</strong></td></tr>
    <tr class="row-warn"><td>${tx('table.operatorDeferred')}</td><td>${fmt(C.monthly.operator)}</td></tr>
    <tr class="row-total"><td><strong>${tx('table.fullMonthly')}</strong></td><td><strong>${fmt(D.fullMonthly)}</strong></td></tr></tbody>`;

  document.getElementById('cpaNote').innerHTML = phrase(
    lang,
    `<strong>CPA (${currency(C.perUnit.cpa)}) تكلفة متغيرة لكل قطعة.</strong> ${cpaBlendStatus('ar')} ${cpaPaidStatus('ar')} ضع أيضاً حد إنفاق شهري ثابت للتسويق في حدود ${currency(C.benchmarks.marketingFloorMin)}-${currency(C.benchmarks.marketingFloorMax)} حتى لا يتوقف الاختبار.`,
    `<strong>CPA (${currency(C.perUnit.cpa)}) is a variable cost per unit.</strong> ${cpaBlendStatus('en')} ${cpaPaidStatus('en')} Also keep a fixed monthly marketing floor around ${currency(C.benchmarks.marketingFloorMin)}-${currency(C.benchmarks.marketingFloorMax)} so testing does not stall.`
  );

  destroyChart('chartUnitEcon');
  charts.chartUnitEcon = new Chart(document.getElementById('chartUnitEcon'), {
    type: 'doughnut',
    data: {
      labels: [tx('chart.tshirt'), tx('chart.markup'), tx('chart.dtf'), tx('chart.packaging'), tx('chart.tags'), tx('chart.cpa'), tx('chart.subsidiary'), tx('chart.platform'), tx('chart.tax'), tx('chart.margin')],
      datasets: [{
        data: [C.cogs.shirt, C.cogs.markup, C.cogs.dtf, C.cogs.pkg, C.cogs.tags, C.perUnit.cpa, C.perUnit.subsidiary, C.perUnit.platform, C.perUnit.tax, D.margin],
        backgroundColor: ['#7c5cff','#a78bfa','#60a5fa','#22d3ee','#34d399','#f87171','#fb923c','#fbbf24','#f472b6','#10b981'],
        borderWidth: 0
      }]
    },
    options: { plugins: { legend: { ...legend(lang === 'ar' ? 'left' : 'right'), labels: { boxWidth: 12, padding: 8, font: { size: 11 } } } } }
  });

  destroyChart('chartFixedCosts');
  const fLabels = Object.keys(C.fixed).map(fixedLabel);
  const fData = Object.values(C.fixed);
  charts.chartFixedCosts = new Chart(document.getElementById('chartFixedCosts'), {
    type: 'bar',
    data: { labels: fLabels, datasets: [{ label: tx('unit.egp'), data: fData, backgroundColor: '#7c5cff', borderRadius: 6 }] },
    options: { indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } } } }
  });
}

function renderTest() {
  const units = Math.max(0, C.scenario.pilotUnits);
  const months = Math.max(0, C.scenario.pilotMonths);
  const pilotCOGS = C.cogs.shirt + C.scenario.pilotMarkup + C.cogs.dtf + C.cogs.pkg + C.cogs.tags;
  const pilotMonthly = D.testMonthly;
  const pilotFixed = D.testFixed;
  const rev = units * C.price;
  const cogs = units * pilotCOGS;
  const vc = units * D.totalVar;
  const fo = pilotFixed;
  const mf = pilotMonthly * months;
  const tc = cogs + vc + fo + mf;
  const pl = rev - tc;
  const pilotMargin = C.price - pilotCOGS - D.totalVar;
  const title = document.getElementById('testScenarioTitle');
  const subtitle = document.getElementById('testScenarioSubtitle');
  if (title) {
    title.textContent = phrase(
      lang,
      `السيناريو أ: مرحلة الاختبار (${monthPhrase(months)})`,
      `Scenario A: Test Phase (${monthPhrase(months)})`
    );
  }
  if (subtitle) {
    subtitle.textContent = phrase(
      lang,
      `${unitPhrase(units)} خلال ${monthPhrase(months)} • الموقع داخل الاختبار • مستثنى: الأوبريتور، التراخيص، الموديريتور، المكبس`,
      `${unitPhrase(units)} over ${monthPhrase(months)} • Website included • Excluded: Operator, License, Moderator, Press`
    );
  }

  document.getElementById('testRevenue').textContent = fmt(rev);
  document.getElementById('testCosts').textContent = fmt(Math.round(tc));
  document.getElementById('testPL').textContent = signedPL(pl);
  document.getElementById('testPL').style.color = plColor(pl);

  const netLabel = pl > 0 ? tx('profit.netProfit') : (pl < 0 ? tx('profit.netLoss') : tx('profit.netBreakeven'));
  document.getElementById('testTable').innerHTML = `<thead><tr><th>${tx('table.item')}</th><th>${tx('unit.egp')}</th></tr></thead><tbody>
    <tr><td>${callTx('table.revenueFormula', { units: fmt(units), price: fmt(C.price) })}</td>${moneyCell(fmt(rev))}</tr>
    <tr><td>${tx('table.cogs')}</td>${moneyCell('-' + fmt(Math.round(cogs)))}</tr>
    <tr><td>${tx('table.variableCosts')}</td>${moneyCell('-' + fmt(Math.round(vc)))}</tr>
    <tr><td>${tx('table.fixedReduced')}</td>${moneyCell('-' + fmt(fo))}</tr>
    <tr><td>${tx('table.monthlyThree')}</td>${moneyCell('-' + fmt(mf))}</tr>
    <tr class="row-total"><td><strong>${netLabel}</strong></td>${moneyCell(`<strong>${signedPL(pl)}</strong>`, plColor(pl))}</tr></tbody>`;

  destroyChart('chartTestWaterfall');
  charts.chartTestWaterfall = new Chart(document.getElementById('chartTestWaterfall'), {
    type: 'bar',
    data: {
      labels: [tx('chart.revenue'), tx('chart.cogs'), tx('chart.variableCosts') || tx('table.variableCosts'), tx('chart.fixed'), tx('chart.monthly'), tx('chart.net')],
      datasets: [{ data: [rev, -cogs, -vc, -fo, -mf, pl], backgroundColor: ['#34d399','#f87171','#fb923c','#fbbf24','#f472b6', plColor(pl)] }]
    },
    options: { plugins: { legend: { display: false } } }
  });

  const monthCount = Math.max(1, Math.round(months));
  const baseSplit = C.sales.slice(0, monthCount);
  const splitTotal = baseSplit.reduce((a,b) => a + b, 0);
  const mS = splitTotal > 0
    ? baseSplit.map(s => s * units / splitTotal)
    : Array.from({ length: monthCount }, () => units / monthCount);
  const mR = mS.map(s => s * C.price);
  const mC = mS.map((s, i) => s * (pilotCOGS + D.totalVar) + pilotMonthly + (i === 0 ? pilotFixed : 0));
  destroyChart('chartTestMonthly');
  charts.chartTestMonthly = new Chart(document.getElementById('chartTestMonthly'), {
    type: 'bar',
    data: {
      labels: Array.from({ length: monthCount }, (_, i) => callTx('unit.month', i + 1)),
      datasets: [
        { label: tx('chart.revenue'), data: mR, backgroundColor: 'rgba(52,211,153,.7)', borderRadius: 6 },
        { label: tx('chart.cost'), data: mC, backgroundColor: 'rgba(248,113,113,.6)', borderRadius: 6 }
      ]
    },
    options: { plugins: { legend: legend('top') } }
  });

  const fixedUnits = pilotMargin > 0 ? formatUnits(Math.ceil(pilotFixed / pilotMargin)) : tx('unit.unavailable');
  const overhead = units > 0 ? fmt(Math.round(pilotFixed / units + pilotMonthly * months / units)) : tx('unit.unavailable');
  const resultLine = pl > 0
    ? `<span class="good">${phrase(lang, 'النتيجة المتوقعة', 'Expected result')}: ${signedPL(pl)}</span>`
    : pl < 0
      ? `<span class="bad">${phrase(lang, 'النتيجة المتوقعة', 'Expected result')}: ${signedPL(pl)}</span>`
      : `<span class="warn">${phrase(lang, 'النتيجة المتوقعة: تعادل تقريباً', 'Expected result: roughly breakeven')}</span>`;

  document.getElementById('testAnalysis').innerHTML = phrase(
    lang,
    `<ul>
      <li>${resultLine}</li>
      <li>نحتاج إلى <strong>${fixedUnits}</strong> لتغطية مصاريف تأسيس البايلوت الشاملة للموقع.</li>
      <li>كل قطعة في البايلوت تتحمل تقريباً <strong>${overhead}</strong> جنيه من المصاريف غير المباشرة.</li>
      <li class="good">✅ الهدف المالي من البايلوت هو إثبات الطلب ومعرفة CPA والمرتجعات، وليس الحكم النهائي على الربحية.</li>
    </ul>`,
    `<ul>
      <li>${resultLine}</li>
      <li>Need <strong>${fixedUnits}</strong> to cover pilot setup costs including the website.</li>
      <li>Each pilot unit absorbs approx. <strong>${overhead}</strong> EGP of overhead.</li>
      <li class="good">✅ The financial goal of the pilot is to validate demand, CPA, and returns, not to judge final profitability.</li>
    </ul>`
  );
}

function renderGrowth() {
  document.getElementById('growthBE').textContent = formatUnits(D.growthBE);
  document.getElementById('growthRecover').textContent = formatUnits(D.recoverUnits);

  let cum = -(D.testFixed + D.testMonthly * C.scenario.pilotMonths + C.scenario.pilotUnits * D.costPerUnit - C.scenario.pilotUnits * C.price);
  let pm = '—';
  for (let m = 4; m <= 12; m++) {
    const s = C.sales[m - 1];
    cum += s * D.margin - D.growthMonthly;
    if (cum > 0 && pm === '—') pm = callTx('unit.month', m);
  }
  document.getElementById('growthProfitMonth').textContent = pm === '—' ? tx('unit.notYear1') : pm;

  const slider = document.getElementById('growthSlider');
  const update = () => {
    const u = parseInt(slider.value);
    document.getElementById('growthSliderVal').textContent = u;
    const r = u * C.price;
    const tc = u * D.costPerUnit + D.growthMonthly;
    const p = r - tc;
    const pctVal = r > 0 ? (p / r * 100).toFixed(1) : '0.0';
    const gap = Math.max(0, D.growthBE - u);
    const status = D.margin <= 0
      ? phrase(lang, '❌ لا توجد نقطة تعادل لأن هامش القطعة سالب أو صفر', '❌ No breakeven because unit contribution is zero or negative')
      : p >= 0
        ? phrase(lang, '✅ تم الوصول للتعادل', '✅ Breakeven achieved')
        : phrase(lang, `❌ نحتاج ${formatUnits(gap)} إضافية`, `❌ Need ${formatUnits(gap)} more units`);
    document.getElementById('growthCalcResult').innerHTML = phrase(
      lang,
      `<p>الإيرادات: <strong>${currency(r)}</strong> | التكلفة: <strong>${currency(Math.round(tc))}</strong></p>
       <p>الصافي: <span class="${plClass(p)}">${signedPL(p)} (${pctVal}%)</span></p>
       <p>${status}</p>`,
      `<p>Revenue: <strong>${currency(r)}</strong> | Cost: <strong>${currency(Math.round(tc))}</strong></p>
       <p>Net: <span class="${plClass(p)}">${signedPL(p)} (${pctVal}%)</span></p>
       <p>${status}</p>`
    );
  };
  slider.oninput = update;
  update();

  const xU = Array.from({ length: 10 }, (_, i) => (i + 1) * 50);
  destroyChart('chartGrowthMargin');
  const breakevenRevenue = Number.isFinite(D.growthBE) ? D.growthBE * C.price : null;
  charts.chartGrowthMargin = new Chart(document.getElementById('chartGrowthMargin'), {
    type: 'line',
    data: {
      labels: xU,
      datasets: [
        { label: tx('chart.revenue'), data: xU.map(u => u * C.price), borderColor: '#34d399', tension: .3, fill: false },
        { label: tx('chart.totalCost'), data: xU.map(u => u * D.costPerUnit + D.growthMonthly), borderColor: '#f87171', tension: .3, fill: false },
        { label: tx('chart.breakeven'), data: xU.map(() => breakevenRevenue), borderColor: '#fbbf24', borderDash: [5,5], pointRadius: 0 }
      ]
    },
    options: { plugins: { legend: legend('top') }, scales: { x: { title: { display: true, text: tx('chart.units') } }, y: { title: { display: true, text: tx('chart.egp') } } } }
  });

  const gS = C.sales.slice(3);
  const gR = gS.map(s => s * C.price);
  const gC = gS.map(s => s * D.costPerUnit + D.growthMonthly);
  const gP = gR.map((r, i) => r - gC[i]);
  destroyChart('chartGrowthProjection');
  charts.chartGrowthProjection = new Chart(document.getElementById('chartGrowthProjection'), {
    type: 'bar',
    data: {
      labels: Array.from({ length: 9 }, (_, i) => callTx('unit.monthShort', i + 4)),
      datasets: [
        { label: tx('chart.revenue'), data: gR, backgroundColor: 'rgba(52,211,153,.7)', borderRadius: 6 },
        { label: tx('chart.cost'), data: gC, backgroundColor: 'rgba(248,113,113,.6)', borderRadius: 6 },
        { label: tx('chart.pl'), data: gP, type: 'line', borderColor: '#7c5cff', tension: .3, fill: false, borderWidth: 3 }
      ]
    },
    options: { plugins: { legend: legend('top') } }
  });
}

function renderFull() {
  document.getElementById('fullBE').textContent = formatUnits(D.fullBE);
  document.getElementById('fullRevNeeded').textContent = Number.isFinite(D.fullBE) ? fmt(D.fullBE * C.price) : tx('unit.unavailable');
  document.getElementById('fullGrowthTarget').textContent = D.margin > 0 ? formatUnits(Math.ceil((D.fullMonthly / 0.7) / D.margin)) : tx('unit.unavailable');
  const subtitle = document.getElementById('fullScenarioSubtitle');
  if (subtitle) {
    subtitle.textContent = phrase(
      lang,
      `جميع التكاليف مفعلة بما فيها الأوبريتور (${currency(C.monthly.operator)}/شهر)`,
      `All costs active including Operator (${currency(C.monthly.operator)}/mo)`
    );
  }

  const yr2 = [350, 370, 390, 410, 430, 450, 470, 490, 510, 530, 550, 570];
  destroyChart('chartFullProjection');
  charts.chartFullProjection = new Chart(document.getElementById('chartFullProjection'), {
    type: 'bar',
    data: {
      labels: yr2.map((_, i) => callTx('unit.monthShort', i + 13)),
      datasets: [
        { label: tx('chart.revenue'), data: yr2.map(s => s * C.price), backgroundColor: 'rgba(167,139,250,.7)', borderRadius: 6 },
        { label: tx('chart.cost'), data: yr2.map(s => s * D.costPerUnit + D.fullMonthly), backgroundColor: 'rgba(236,72,153,.5)', borderRadius: 6 },
        { label: tx('chart.profit'), data: yr2.map(s => s * C.price - s * D.costPerUnit - D.fullMonthly), type: 'line', borderColor: '#34d399', tension: .3, fill: false, borderWidth: 3 }
      ]
    },
    options: { plugins: { legend: legend('top') } }
  });

  const extraUnits = D.margin > 0 ? Math.ceil(C.monthly.operator * 12 / D.margin) : tx('unit.unavailable');
  const triggerUnits = D.margin > 0 ? Math.ceil((D.growthMonthly + C.monthly.operator) / D.margin) : tx('unit.unavailable');
  document.getElementById('operatorAnalysis').innerHTML = phrase(
    lang,
    `<h3>💼 تحليل راتب الأوبريتور</h3><ul>
      <li><span class="good">✅ تأجيل ${currency(C.monthly.operator)}/شهر خلال السنة الأولى يقلل نقطة التعادل.</span></li>
      <li>مع الأوبريتور: <strong>${formatUnits(D.fullBE)}</strong> ${tx('unit.unitsMo')} | بدون الأوبريتور: <strong>${formatUnits(D.growthBE)}</strong> ${tx('unit.unitsMo')}</li>
      <li>الأوبريتور = ${currency(C.monthly.operator * 12)} في السنة = حوالي <strong>${extraUnits}</strong> قطعة إضافية سنوياً.</li>
      <li class="warn">⚠️ أضفه فقط عندما تكون المبيعات أكبر من <strong>${triggerUnits}</strong> ${tx('unit.unitsMo')} لمدة 3 أشهر متتالية.</li>
      <li><strong>التوصية:</strong> اربط التعيين بمؤشر واضح: يبدأ عندما يتجاوز الربح التراكمي ${currency(C.scenario.operatorProfitTrigger)}.</li>
    </ul>`,
    `<h3>💼 Operator Salary Analysis</h3><ul>
      <li><span class="good">✅ Deferring ${currency(C.monthly.operator)}/mo in Year 1 keeps breakeven lower.</span></li>
      <li>With operator: <strong>${formatUnits(D.fullBE)}</strong> ${tx('unit.unitsMo')} | Without: <strong>${formatUnits(D.growthBE)}</strong> ${tx('unit.unitsMo')}</li>
      <li>Operator = ${currency(C.monthly.operator * 12)} per year = approx. <strong>${extraUnits}</strong> extra units/year.</li>
      <li class="warn">⚠️ Introduce only when sales stay above <strong>${triggerUnits}</strong> ${tx('unit.unitsMo')} for 3 consecutive months.</li>
      <li><strong>Recommendation:</strong> Use a clear milestone: starts when cumulative profit exceeds ${currency(C.scenario.operatorProfitTrigger)}.</li>
    </ul>`
  );
}

function renderProjection() {
  const si = document.getElementById('salesInputs');
  si.innerHTML = '';
  C.sales.forEach((s, i) => {
    const d = document.createElement('div');
    d.className = 'sales-input-item';
    d.innerHTML = `<label>${callTx('unit.monthShort', i + 1)}</label><input type="number" value="${s}" data-m="${i}" min="0">`;
    si.appendChild(d);
  });
  si.querySelectorAll('input').forEach(inp => inp.addEventListener('change', () => {
    C.sales[parseInt(inp.dataset.m)] = parseInt(inp.value) || 0;
    D = calc();
    persistAssumptionsToStorage({ silent: true });
    updateProjectionCharts();
    renderMarket();
    if (priceOptimizationVisible) renderPriceOptimization();
  }));
  updateProjectionCharts();
}

function updateProjectionCharts() {
  const labels = C.sales.map((_, i) => callTx('unit.monthShort', i + 1));
  const rev = [];
  const cost = [];
  const profit = [];
  const cumPL = [];
  let cum = 0;

  C.sales.forEach((u, m) => {
    const r = u * C.price;
    let c = u * D.costPerUnit;
    if (m < 3) {
      c += D.testMonthly;
      if (m === 0) c += D.testFixed;
    } else {
      c += D.growthMonthly;
      if (m === 3) c += D.deferredFixed;
    }
    const p = r - c;
    cum += p;
    rev.push(r);
    cost.push(c);
    profit.push(p);
    cumPL.push(cum);
  });

  const tR = rev.reduce((a,b) => a + b, 0);
  const tC = cost.reduce((a,b) => a + b, 0);
  const tP = tR - tC;
  const be = cumPL.findIndex(v => v > 0);

  document.getElementById('projRevenue').textContent = fmtK(tR);
  document.getElementById('projCosts').textContent = fmtK(tC);
  document.getElementById('projPL').textContent = signedPL(tP, { compact: true });
  document.getElementById('projPL').style.color = plColor(tP);
  document.getElementById('projBEMonth').textContent = be >= 0 ? callTx('unit.monthShort', be + 1) : tx('unit.notYear1');

  destroyChart('chart12Month');
  charts.chart12Month = new Chart(document.getElementById('chart12Month'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: tx('chart.revenue'), data: rev, backgroundColor: 'rgba(52,211,153,.7)', borderRadius: 6 },
        { label: tx('chart.cost'), data: cost, backgroundColor: 'rgba(248,113,113,.6)', borderRadius: 6 },
        { label: tx('chart.pl'), data: profit, type: 'line', borderColor: '#7c5cff', borderWidth: 3, tension: .3, fill: false, pointBackgroundColor: profit.map(plColor), pointRadius: 5 }
      ]
    },
    options: { plugins: { legend: legend('top') } }
  });

  destroyChart('chartCumulative');
  charts.chartCumulative = new Chart(document.getElementById('chartCumulative'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: tx('chart.cumulativePL'), data: cumPL, borderColor: '#a78bfa', fill: true, backgroundColor: cumPL.map(v => v > 0 ? 'rgba(52,211,153,.15)' : 'rgba(248,113,113,.15)'), tension: .3, borderWidth: 3, pointRadius: 5, pointBackgroundColor: cumPL.map(plColor) },
        { label: tx('chart.breakeven'), data: labels.map(() => 0), borderColor: '#fbbf24', borderDash: [6,4], pointRadius: 0, borderWidth: 2 }
      ]
    },
    options: { plugins: { legend: legend('top') } }
  });
}

function paidCpaBenchmark() {
  const b = marketingBenchmark();
  return {
    clickCost: b.clickCost,
    paidMin: b.egyptMetaPurchaseCpaLow,
    paidMax: b.egyptMetaPurchaseCpaHigh,
    impliedCvr: value => value > 0 ? b.clickCost / value * 100 : Infinity
  };
}

function paidCpaBenchmarkText() {
  const b = marketingBenchmark();
  return phrase(
    lang,
    `مصر: Retail CPA ${currencyRange(b.egyptRetailCpaLow, b.egyptRetailCpaHigh)}؛ Meta purchase ${currencyRange(b.egyptMetaPurchaseCpaLow, b.egyptMetaPurchaseCpaHigh)}؛ CPC ${currencyRange(C.benchmarks.egyptMetaCpcMin, C.benchmarks.egyptMetaCpcMax)}؛ CVR ${pctText(C.benchmarks.egyptEcommerceCvrPct, 1)}`,
    `Egypt: retail CPA ${currencyRange(b.egyptRetailCpaLow, b.egyptRetailCpaHigh)}; Meta purchase ${currencyRange(b.egyptMetaPurchaseCpaLow, b.egyptMetaPurchaseCpaHigh)}; CPC ${currencyRange(C.benchmarks.egyptMetaCpcMin, C.benchmarks.egyptMetaCpcMax)}; CVR ${pctText(C.benchmarks.egyptEcommerceCvrPct, 1)}`
  );
}

function priceBandLabel(type) {
  if (type === 'budget') return `${tx('chart.budget')} (<${fmt(C.benchmarks.priceBudgetMax)})`;
  if (type === 'mid') return `${tx('chart.mid')} (${fmt(C.benchmarks.priceMidMin)}-${fmt(C.benchmarks.priceMidMax)})`;
  if (type === 'premium') return `${tx('chart.premium')} (${fmt(C.benchmarks.pricePremiumMin)}-${fmt(C.benchmarks.pricePremiumMax)})`;
  if (type === 'luxury') return `${tx('chart.luxury')} (${fmt(C.benchmarks.priceLuxuryMin)}+)`;
  return type;
}

function assessmentText(type, value) {
  if (type === 'price') {
    if (value < C.benchmarks.pricePremiumMin) return { text: tx('assessment.priceLow'), className: 'warn' };
    if (value <= C.benchmarks.pricePremiumMax) return { text: tx('assessment.priceGood'), className: 'good' };
    return { text: tx('assessment.priceHigh'), className: 'warn' };
  }
  if (type === 'cogs') {
    if (value <= C.benchmarks.cogsTargetMaxPct) return { text: tx('assessment.cogsGood'), className: 'good' };
    if (value <= C.benchmarks.cogsWatchMaxPct) return { text: tx('assessment.cogsHigh'), className: 'warn' };
    return { text: tx('assessment.cogsBad'), className: 'bad' };
  }
  if (type === 'cpa') {
    const b = marketingBenchmark();
    if (!Number.isFinite(b.cpaRevenuePct)) return { text: tx('assessment.cpaBad'), className: 'bad' };
    if (value >= b.egyptRetailCpaLow && value <= b.egyptRetailCpaHigh && value < b.egyptMetaPurchaseCpaLow) {
      return {
        text: phrase(lang, '✅ جيد محلياً؛ ⚠️ قوي لـ Meta purchase', '✅ Good locally; ⚠️ aggressive for Meta purchase'),
        className: 'warn'
      };
    }
    if (value >= b.egyptRetailCpaLow && value <= b.egyptRetailCpaHigh) {
      return { text: tx('assessment.cpaExcellent'), className: 'good' };
    }
    if (value < b.egyptRetailCpaLow) {
      return {
        text: phrase(lang, '⚠️ أقل من نطاق مصر؛ هدف متفائل', '⚠️ Below Egypt range; optimistic target'),
        className: 'warn'
      };
    }
    if (value <= b.maxAffordableCpa) {
      return {
        text: phrase(lang, '⚠️ قابل للتحمل لكنه يضغط الربح', '⚠️ Affordable but compresses profit'),
        className: 'warn'
      };
    }
    return { text: tx('assessment.cpaBad'), className: 'bad' };
  }
  if (type === 'margin') {
    if (value <= 0) return { text: tx('assessment.marginBad'), className: 'bad' };
    if (value < C.benchmarks.contributionTypicalMinPct) return { text: tx('assessment.marginThin'), className: 'warn' };
    if (value <= C.benchmarks.contributionTypicalMaxPct) return { text: tx('assessment.marginHealthy'), className: 'good' };
    return { text: tx('assessment.marginStrong'), className: 'good' };
  }
  if (type === 'gross') {
    if (value >= C.benchmarks.grossTargetMinPct) return { text: tx('assessment.grossGood'), className: 'good' };
    return { text: tx('assessment.grossLow'), className: 'warn' };
  }
  return { text: tx('assessment.good'), className: 'good' };
}

function scoreMarket(value, type) {
  if (type === 'price') return value >= C.benchmarks.pricePremiumMin && value <= C.benchmarks.pricePremiumMax ? 8 : (value < C.benchmarks.pricePremiumMin ? 5 : 6);
  if (type === 'cpa') {
    const b = marketingBenchmark();
    if (value >= b.egyptRetailCpaLow && value <= b.egyptRetailCpaHigh) return value < b.egyptMetaPurchaseCpaLow ? 7 : 8;
    if (value < b.egyptRetailCpaLow) return 5;
    if (value <= b.maxAffordableCpa) return 4;
    return 2;
  }
  if (type === 'margin') return value <= 0 ? 1 : (value < C.benchmarks.contributionTypicalMinPct ? 4 : (value <= C.benchmarks.contributionTypicalMaxPct ? 7 : 9));
  if (type === 'cogs') return value <= C.benchmarks.cogsTargetMaxPct ? 8 : (value <= C.benchmarks.cogsWatchMaxPct ? 5 : 3);
  return 7;
}

function marketRecommendations(cogsPct, contributionPct, grossPct) {
  const recs = [];
  const baseTarget = C.scenario.profitTargetBase;
  const upsideTarget = C.scenario.profitTargetUpside;
  const baseProfit = baseTarget * D.margin - D.growthMonthly;
  const upsideProfit = upsideTarget * D.margin - D.growthMonthly;
  const marketing = marketingBenchmark();

  if (C.perUnit.cpa >= marketing.egyptRetailCpaLow && C.perUnit.cpa <= marketing.egyptRetailCpaHigh) {
    recs.push(`<li><span class="good">✅ ${phrase(lang, `CPA عند ${currency(C.perUnit.cpa)} داخل نطاق التجزئة في مصر`, `CPA at ${currency(C.perUnit.cpa)} sits inside Egypt retail range`)}</span> - ${phrase(lang, `النطاق المحلي ${currencyRange(marketing.egyptRetailCpaLow, marketing.egyptRetailCpaHigh)}، والرقم الحالي يساوي ${pctText(marketing.cpaRevenuePct, 1)} من سعر البيع.`, `The local range is ${currencyRange(marketing.egyptRetailCpaLow, marketing.egyptRetailCpaHigh)}, and the current number is ${pctText(marketing.cpaRevenuePct, 1)} of retail price.`)}</li>`);
  } else if (C.perUnit.cpa < marketing.egyptRetailCpaLow) {
    recs.push(`<li><span class="warn">⚠️ ${phrase(lang, `CPA عند ${currency(C.perUnit.cpa)} أقل من نطاق مصر`, `CPA at ${currency(C.perUnit.cpa)} is below Egypt range`)}</span> - ${phrase(lang, `هذا ممتاز لو جاء من organic/referrals/retargeting، لكنه هدف متفائل كقناة paid مباشرة.`, `This is excellent if it comes from organic/referrals/retargeting, but optimistic as a direct paid channel.`)}</li>`);
  } else if (C.perUnit.cpa <= marketing.maxAffordableCpa) {
    recs.push(`<li><span class="warn">⚠️ ${phrase(lang, `CPA عند ${currency(C.perUnit.cpa)} قابل للتحمل لكنه يضغط هامش القطعة`, `CPA at ${currency(C.perUnit.cpa)} is affordable but compresses unit margin`)}</span> - ${phrase(lang, `أقصى CPA قبل خسارة كل بيعة هو ${currency(marketing.maxAffordableCpa)}.`, `The max CPA before each sale loses money is ${currency(marketing.maxAffordableCpa)}.`)}</li>`);
  } else {
    recs.push(`<li><span class="bad">❌ ${phrase(lang, `CPA عند ${currency(C.perUnit.cpa)} يكسر ربحية القطعة`, `CPA at ${currency(C.perUnit.cpa)} breaks unit profitability`)}</span> - ${phrase(lang, `أقصى CPA تتحمله القطعة حالياً ${currency(marketing.maxAffordableCpa)}؛ لا توسع قبل رفع السعر أو خفض الإنتاج/المتغيرات.`, `The current max affordable CPA is ${currency(marketing.maxAffordableCpa)}; do not scale before raising price or reducing production/variable costs.`)}</li>`);
  }

  if (marketing.egyptMetaPurchaseCpaHigh > marketing.maxAffordableCpa) {
    recs.push(`<li><span class="warn">⚠️ ${phrase(lang, 'Meta purchase في مصر يحتاج ضبط قبل التوسع', 'Egypt Meta purchase needs control before scaling')}</span> - ${phrase(lang, `مدى CPA الشراء على Meta في مصر ${currencyRange(marketing.egyptMetaPurchaseCpaLow, marketing.egyptMetaPurchaseCpaHigh)}؛ الحد الأعلى أعلى من سقف ربحية القطعة ${currency(marketing.maxAffordableCpa)}.`, `Egypt Meta purchase CPA range is ${currencyRange(marketing.egyptMetaPurchaseCpaLow, marketing.egyptMetaPurchaseCpaHigh)}; the high end is above the unit profitability cap of ${currency(marketing.maxAffordableCpa)}.`)}</li>`);
  }

  if (C.perUnit.cpa < marketing.egyptMetaPurchaseCpaLow) {
    recs.push(`<li><span class="warn">⚠️ ${phrase(lang, `لا تبن الربحية على Meta purchase مباشر = ${currency(C.perUnit.cpa)}`, `Do not build profitability on direct Meta purchase CPA = ${currency(C.perUnit.cpa)}`)}</span> - ${phrase(lang, `CPC أزياء مصر حوالي ${currency(marketing.clickCost)} وCVR مصر ${pctText(C.benchmarks.egyptEcommerceCvrPct, 1)} ينتج CPA نموذجي ${currency(marketing.clickModelCpaTypical)}، بينما مدى الشراء المحلي ${currencyRange(marketing.egyptMetaPurchaseCpaLow, marketing.egyptMetaPurchaseCpaHigh)}.`, `Egypt fashion CPC is about ${currency(marketing.clickCost)} and Egypt CVR is ${pctText(C.benchmarks.egyptEcommerceCvrPct, 1)}, implying a typical CPA of ${currency(marketing.clickModelCpaTypical)}, while local purchase range is ${currencyRange(marketing.egyptMetaPurchaseCpaLow, marketing.egyptMetaPurchaseCpaHigh)}.`)}</li>`);
  }

  if (cogsPct > C.benchmarks.cogsWatchMaxPct) {
    recs.push(`<li><span class="bad">❌ ${phrase(lang, `تكلفة الإنتاج عند ${pctText(cogsPct, 0)} أعلى من حد المتابعة ${pctText(C.benchmarks.cogsWatchMaxPct, 0)}`, `COGS at ${pctText(cogsPct, 0)} is above the watch limit of ${pctText(C.benchmarks.cogsWatchMaxPct, 0)}`)}</span> - ${phrase(lang, `الهدف الأفضل هو ${pctRange(C.benchmarks.cogsTargetMinPct, C.benchmarks.cogsTargetMaxPct)} من سعر البيع. تفاوض على التيشيرت السادة أو هامش المصنع قبل التوسع.`, `The better target is ${pctRange(C.benchmarks.cogsTargetMinPct, C.benchmarks.cogsTargetMaxPct)} of selling price. Renegotiate blank-shirt cost or factory markup before scaling.`)}</li>`);
  } else if (cogsPct > C.benchmarks.cogsTargetMaxPct) {
    recs.push(`<li><span class="warn">⚠️ ${phrase(lang, `تكلفة الإنتاج عند ${pctText(cogsPct, 0)} أعلى من هدف ${pctText(C.benchmarks.cogsTargetMaxPct, 0)}`, `COGS at ${pctText(cogsPct, 0)} is above the ${pctText(C.benchmarks.cogsTargetMaxPct, 0)} target`)}</span> - ${phrase(lang, 'يمكن إطلاق الاختبار، لكن لا تعتبر هامش القطعة نهائياً قبل تحسين التوريد.', 'You can launch the test, but do not treat unit margin as final before supplier improvement.')}</li>`);
  } else {
    recs.push(`<li><span class="good">✅ ${phrase(lang, `تكلفة الإنتاج عند ${pctText(cogsPct, 0)} داخل هدف التشغيل`, `COGS at ${pctText(cogsPct, 0)} is within the operating target`)}</span> - ${phrase(lang, 'الأولوية الآن للحفاظ على الجودة وليس خفض التكلفة بشكل يضر البراند.', 'The priority is preserving quality, not cutting cost in a way that hurts the brand.')}</li>`);
  }

  if (C.price < C.benchmarks.pricePremiumMin) {
    recs.push(`<li><span class="warn">⚠️ ${phrase(lang, `سعر ${currency(C.price)} أقل من نطاق ${priceRange(C.benchmarks.pricePremiumMin, C.benchmarks.pricePremiumMax)}`, `${currency(C.price)} is below the ${priceRange(C.benchmarks.pricePremiumMin, C.benchmarks.pricePremiumMax)} range`)}</span> - ${phrase(lang, `لا تنزل عن ${currency(C.benchmarks.pricePremiumMin)} إلا لو تكلفة الإنتاج وCPA انخفضوا فعلاً.`, `Do not go below ${currency(C.benchmarks.pricePremiumMin)} unless COGS and CPA materially drop.`)}</li>`);
  } else if (C.price <= C.benchmarks.pricePremiumMax) {
    recs.push(`<li><span class="good">✅ ${phrase(lang, `سعر ${currency(C.price)} مناسب للبريميوم`, `${currency(C.price)} price fits premium positioning`)}</span> - ${phrase(lang, 'هو كاف للهامش ومقبول للحجم إذا كانت الخامة والتجربة قوية.', 'It supports margin and remains accessible for volume if fabric and experience are strong.')}</li>`);
  } else {
    recs.push(`<li><span class="warn">⚠️ ${phrase(lang, `سعر ${currency(C.price)} أعلى من نطاق السوق الأساسي`, `${currency(C.price)} is above the core benchmark`)}</span> - ${phrase(lang, 'احتاج إثبات جودة أقوى ومحتوى أوضح قبل التوسع.', 'You need stronger quality proof and clearer content before scaling.')}</li>`);
  }

  if (grossPct < C.benchmarks.grossTargetMinPct) {
    recs.push(`<li><span class="warn">⚠️ ${phrase(lang, `الهامش الإجمالي ${pctText(grossPct, 1)} أقل من هدف ${pctRange(C.benchmarks.grossTargetMinPct, C.benchmarks.grossTargetMaxPct)}`, `Gross margin ${pctText(grossPct, 1)} is below the ${pctRange(C.benchmarks.grossTargetMinPct, C.benchmarks.grossTargetMaxPct)} target`)}</span> - ${phrase(lang, 'أي تخفيض في السعر سيزيد الضغط، لذلك الأولوية لتكلفة الإنتاج أو رفع قيمة العرض.', 'Any discount will add pressure, so prioritize production cost or stronger perceived value.')}</li>`);
  }

  if (contributionPct < C.benchmarks.contributionTypicalMinPct) {
    recs.push(`<li><span class="warn">⚠️ ${phrase(lang, `هامش المساهمة ${pctText(contributionPct, 1)} أقل من نطاق ${pctRange(C.benchmarks.contributionTypicalMinPct, C.benchmarks.contributionTypicalMaxPct)}`, `Contribution ${pctText(contributionPct, 1)} is below the ${pctRange(C.benchmarks.contributionTypicalMinPct, C.benchmarks.contributionTypicalMaxPct)} range`)}</span> - ${phrase(lang, 'النمو سيزيد الإيرادات لكنه لن يحل الربحية بدون تعديل هيكل التكلفة.', 'Growth will lift revenue but will not fix profitability without cost-structure changes.')}</li>`);
  } else if (contributionPct >= C.benchmarks.contributionHealthyPct) {
    recs.push(`<li><span class="good">✅ ${phrase(lang, `هامش المساهمة ${pctText(contributionPct, 1)} عند/فوق هدف ${pctText(C.benchmarks.contributionHealthyPct, 0)}`, `Contribution ${pctText(contributionPct, 1)} is at/above the ${pctText(C.benchmarks.contributionHealthyPct, 0)} target`)}</span> - ${phrase(lang, 'هنا يصبح التوسع أكثر قابلية للدفاع إذا كانت المرتجعات تحت السيطرة.', 'Scaling becomes more defensible here if returns are controlled.')}</li>`);
  }

  if (D.margin <= 0) {
    recs.push(`<li><span class="bad">❌ ${phrase(lang, 'كل بيعة تخسر قبل حتى مصاريف التشغيل', 'Every sale loses money before operating costs')}</span> - ${phrase(lang, 'ارفع السعر أو اخفض تكلفة الإنتاج وCPA فوراً قبل أي إنتاج جديد.', 'Raise price or cut COGS/CPA before any new production.')}</li>`);
  } else if (baseProfit > 0) {
    recs.push(`<li><span class="good">✅ ${phrase(lang, `عند ${unitPhrase(baseTarget)} شهرياً يوجد ${signedPL(baseProfit)}`, `At ${unitPhrase(baseTarget)} per month there is ${signedPL(baseProfit)}`)}</span> - ${phrase(lang, `وعند ${unitPhrase(upsideTarget)} يرتفع الصافي إلى ${signedPL(upsideProfit)}.`, `At ${unitPhrase(upsideTarget)} net improves to ${signedPL(upsideProfit)}.`)}</li>`);
  } else if (upsideProfit > 0) {
    recs.push(`<li><span class="warn">⚠️ ${phrase(lang, `${unitPhrase(baseTarget)} شهرياً تعني ${signedPL(baseProfit)}`, `${unitPhrase(baseTarget)} per month means ${signedPL(baseProfit)}`)}</span> - ${phrase(lang, `لا تعتبر Lean_${formatUnits(C.initProd, 'en')} مستقرة إلا عند الاقتراب من ${unitPhrase(upsideTarget)} حيث تصبح ${signedPL(upsideProfit)}.`, `Treat Lean_${formatUnits(C.initProd, 'en')} as stable only near ${unitPhrase(upsideTarget)}, where it becomes ${signedPL(upsideProfit)}.`)}</li>`);
  } else {
    recs.push(`<li><span class="bad">❌ ${phrase(lang, `حتى ${unitPhrase(upsideTarget)} شهرياً تعطي ${signedPL(upsideProfit)}`, `Even ${unitPhrase(upsideTarget)} per month gives ${signedPL(upsideProfit)}`)}</span> - ${phrase(lang, 'النموذج يحتاج تعديل سعر أو تكلفة قبل التوسع.', 'The model needs price or cost changes before scaling.')}</li>`);
  }

  recs.push(`<li>${phrase(lang, `رافعات النمو العملية: خفض تكلفة التيشيرت، رفع التكرار، إضافة منتجات أعلى هامشاً، واستخدام email/WhatsApp والريتارجتنج لأنها أقرب إلى CPA منخفض، مع تحسين الشراء من الموبايل لأن انتشار الإنترنت في مصر ${pctText(C.benchmarks.egyptInternetPct, 1)} واتصالات الموبايل ${pctText(C.benchmarks.egyptMobileConnectionsPct, 0)} من السكان.`, `Practical growth levers: reduce shirt cost, increase repeat rate, add higher-margin products, and use email/WhatsApp plus retargeting because they are closer to low CPA, while optimizing mobile checkout because Egypt internet penetration is ${pctText(C.benchmarks.egyptInternetPct, 1)} and mobile connections are ${pctText(C.benchmarks.egyptMobileConnectionsPct, 0)} of population.`)}</li>`);

  return `<ul>${recs.join('')}</ul>`;
}

function renderMarket() {
  const cogsPct = D.totalCOGS / C.price * 100;
  const contributionPct = D.margin / C.price * 100;
  const grossPct = (C.price - D.totalCOGS) / C.price * 100;
  const priceAssessment = assessmentText('price', C.price);
  const cogsAssessment = assessmentText('cogs', cogsPct);
  const cpaAssessment = assessmentText('cpa', C.perUnit.cpa);
  const contributionAssessment = assessmentText('margin', contributionPct);
  const grossAssessment = assessmentText('gross', grossPct);
  const marketing = marketingBenchmark();
  const cartText = phrase(
    lang,
    `${pctText(C.benchmarks.cartAbandonmentAvgPct, 2)} متوسط عام / ${pctRange(C.benchmarks.cartAbandonmentFashionMinPct, C.benchmarks.cartAbandonmentFashionMaxPct)} نطاق تخطيط`,
    `${pctText(C.benchmarks.cartAbandonmentAvgPct, 2)} avg / ${pctRange(C.benchmarks.cartAbandonmentFashionMinPct, C.benchmarks.cartAbandonmentFashionMaxPct)} planning range`
  );
  const digitalReach = phrase(
    lang,
    `${pctText(C.benchmarks.egyptInternetPct, 1)} إنترنت / ${pctText(C.benchmarks.egyptMobileConnectionsPct, 0)} اتصالات موبايل`,
    `${pctText(C.benchmarks.egyptInternetPct, 1)} internet / ${pctText(C.benchmarks.egyptMobileConnectionsPct, 0)} mobile connections`
  );

  const bm = [
    [tx('market.retailPrice'), currency(C.price), priceRange(C.benchmarks.pricePremiumMin, C.benchmarks.pricePremiumMax), priceAssessment],
    [tx('market.cogsPct'), pctText(cogsPct, 1), `${pctRange(C.benchmarks.cogsTargetMinPct, C.benchmarks.cogsTargetMaxPct)} ${phrase(lang, 'هدف', 'target')}`, cogsAssessment],
    [tx('market.cpa'), `${currency(C.perUnit.cpa)} (${pctText(marketing.cpaRevenuePct, 1)})`, paidCpaBenchmarkText(), cpaAssessment],
    [tx('market.contributionMargin'), pctText(contributionPct, 1), `${pctRange(C.benchmarks.contributionTypicalMinPct, C.benchmarks.contributionTypicalMaxPct)} / ${pctText(C.benchmarks.contributionHealthyPct, 0)}+`, contributionAssessment],
    [tx('market.grossMargin'), pctText(grossPct, 1), pctRange(C.benchmarks.grossTargetMinPct, C.benchmarks.grossTargetMaxPct), grossAssessment],
    [tx('market.cartAbandonment'), tx('market.planForIt'), cartText, { text: tx('assessment.cart'), className: 'warn' }],
    [tx('market.mobileTransactions'), tx('market.critical'), digitalReach, { text: tx('assessment.mobile'), className: 'good' }]
  ];

  const tb = document.querySelector('#benchmarkTable tbody');
  tb.innerHTML = '';
  bm.forEach(([m, h, ind, a]) => {
    tb.innerHTML += `<tr><td>${m}</td><td style="text-align:right"><strong>${h}</strong></td><td style="text-align:right">${ind}</td><td><span class="${a.className}">${a.text}</span></td></tr>`;
  });

  destroyChart('chartMarketRadar');
  charts.chartMarketRadar = new Chart(document.getElementById('chartMarketRadar'), {
    type: 'radar',
    data: {
      labels: [tx('chart.price'), tx('chart.cpa'), tx('chart.margin'), tx('chart.cogs'), tx('chart.brand'), tx('chart.scale')],
      datasets: [
        { label: 'HORO', data: [scoreMarket(C.price, 'price'), scoreMarket(C.perUnit.cpa, 'cpa'), scoreMarket(contributionPct, 'margin'), scoreMarket(cogsPct, 'cogs'), 8, 5], borderColor: '#7c5cff', backgroundColor: 'rgba(124,92,255,.2)', borderWidth: 2 },
        { label: tx('chart.industry'), data: [6, 5, 7, 7, 5, 7], borderColor: '#60a5fa', backgroundColor: 'rgba(96,165,250,.1)', borderWidth: 2 }
      ]
    },
    options: { plugins: { legend: legend('top') }, scales: { r: { beginAtZero: true, max: 10, grid: { color: 'rgba(255,255,255,.08)' } } } }
  });

  destroyChart('chartPricePos');
  charts.chartPricePos = new Chart(document.getElementById('chartPricePos'), {
    type: 'bar',
    data: {
      labels: [priceBandLabel('budget'), priceBandLabel('mid'), priceBandLabel('premium'), `HORO (${fmt(C.price)})`, priceBandLabel('luxury')],
      datasets: [{ data: [C.benchmarks.priceBudgetAnchor, C.benchmarks.priceMidAnchor, C.benchmarks.pricePremiumAnchor, C.price, C.benchmarks.priceLuxuryAnchor], backgroundColor: ['#64748b','#60a5fa','#a78bfa','#34d399','#f472b6'], borderRadius: 6 }]
    },
    options: { plugins: { legend: { display: false } } }
  });

  document.getElementById('recommendations').innerHTML = marketRecommendations(cogsPct, contributionPct, grossPct);
}

// === RENDER ALL ===
function renderAll() {
  Chart.defaults.font.family = lang === 'ar' ? 'Cairo' : 'Inter';
  renderBrief();
  renderOverview();
  renderTest();
  renderGrowth();
  renderFull();
  renderProjection();
  renderMarket();
}

// === INIT ===
buildEditors();
document.documentElement.dir = 'rtl';
document.documentElement.lang = 'ar';
document.getElementById('briefContent').classList.remove('lang-en');
document.querySelectorAll('[data-ar]').forEach(el => el.textContent = el.getAttribute('data-ar'));
renderAll();
