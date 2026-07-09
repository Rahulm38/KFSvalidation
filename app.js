const state = {
  template: '',
  renderedHtml: '',
  kfsData: null,
  schedule: []
};

const $ = (id) => document.getElementById(id);
const inputs = ['flow','language','loanAmount','roi','tenure','processingFee','otherCharges','date'];
const TEST_DATA = {
  applicantName: 'TEST DATA',
  loanProposalNumber: 'PZ0000000001',
  repaymentStartDate: '01/01/2026',
  applicationSubmitted: 'Application is submitted on-line by the customer on 01/01/2026 at 00:00'
};

function money(value, decimals = 0) {
  const n = Number(value || 0);
  const amount = Math.abs(n) < 10000
    ? n.toFixed(decimals)
    : n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return '₹ ' + amount;
}

function percent(value) {
  return `${Number(value || 0).toFixed(2)} %`;
}

function pmt(principal, annualRatePct, months) {
  const r = annualRatePct / 100 / 12;
  if (!r) return principal / months;
  const pow = Math.pow(1 + r, months);
  return principal * r * pow / (pow - 1);
}

function npv(rate, cashflows) {
  return cashflows.reduce((sum, cf, index) => sum + cf / Math.pow(1 + rate, index), 0);
}

function solveMonthlyIrr(cashflows) {
  let low = -0.9999;
  let high = 10;
  let lowVal = npv(low, cashflows);
  let highVal = npv(high, cashflows);
  for (let expand = 0; lowVal * highVal > 0 && expand < 20; expand += 1) {
    high *= 2;
    highVal = npv(high, cashflows);
  }
  if (lowVal * highVal > 0) return 0;
  for (let i = 0; i < 120; i += 1) {
    const mid = (low + high) / 2;
    const midVal = npv(mid, cashflows);
    if (Math.abs(midVal) < 1e-7) return mid;
    if (lowVal * midVal <= 0) {
      high = mid;
      highVal = midVal;
    } else {
      low = mid;
      lowVal = midVal;
    }
  }
  return (low + high) / 2;
}

function buildSchedule(principal, annualRatePct, months, emi) {
  const r = annualRatePct / 100 / 12;
  let outstanding = principal;
  const rows = [];
  for (let i = 1; i <= months; i += 1) {
    const interest = i === months ? Math.round(outstanding * r) : Math.round(outstanding * r);
    let principalPaid = emi - interest;
    let instalment = emi;
    if (i === months) {
      principalPaid = outstanding;
      instalment = principalPaid + interest;
    }
    rows.push({
      instalmentNo: i,
      outstandingPrincipal: Math.round(outstanding).toString(),
      principal: Number(principalPaid.toFixed(2)).toString(),
      interest: Number(interest.toFixed(2)).toString(),
      instalment: Number(instalment.toFixed(2)).toString()
    });
    outstanding = Math.max(0, outstanding - principalPaid);
  }
  return rows;
}

function readInputs() {
  return {
    flow: $('flow').value,
    language: $('language').value,
    loanAmount: Number($('loanAmount').value || 0),
    roi: Number($('roi').value || 0),
    tenure: Number($('tenure').value || 0),
    processingFee: Number($('processingFee').value || 0),
    otherCharges: Number($('otherCharges').value || 0),
    date: $('date').value,
    ...TEST_DATA
  };
}

function calculate() {
  const input = readInputs();
  const emi = pmt(input.loanAmount, input.roi, input.tenure);
  const schedule = buildSchedule(input.loanAmount, input.roi, input.tenure, emi);
  const totalPaid = schedule.reduce((sum, row) => sum + Number(row.instalment), 0);
  const totalInterest = schedule.reduce((sum, row) => sum + Number(row.interest), 0);
  const netAmount = input.loanAmount - input.processingFee - input.otherCharges;
  const cashflows = [-netAmount, ...Array.from({ length: input.tenure }, () => emi)];
  const monthlyApr = solveMonthlyIrr(cashflows);
  const apr = monthlyApr * 12 * 100;

  state.schedule = schedule;
  state.kfsData = {
    flow: input.flow,
    date: input.date,
    applicantName: input.applicantName,
    loanProposalNumber: input.loanProposalNumber,
    loanAmount: money(input.loanAmount),
    loanTerm: `${input.tenure} Months`,
    numberOfEPIs: String(input.tenure),
    epiAmount: money(emi, 2),
    repaymentStartDate: input.repaymentStartDate,
    interestRate: percent(input.roi),
    apr: percent(apr),
    processingFee: money(input.processingFee),
    totalInterest: money(totalInterest),
    totalAmountPayable: money(input.loanAmount + input.processingFee + totalInterest),
    netDisbursedAmount: money(input.loanAmount),
    applicationSubmitted: input.applicationSubmitted,
    repaymentSchedule: schedule
  };
  return { input, emi, apr, totalInterest, totalPaid, netAmount, schedule };
}

function injectTemplate(copy, data, lang) {
  let html = state.template;
  html = html.replace(/window\.KFS_COPY = window\.KFS_COPY \|\| [\s\S]*?;\n\s*window\.KFS_DATA = window\.KFS_DATA \|\| [\s\S]*?;\n/, () => {
    return `window.KFS_COPY = ${JSON.stringify(copy, null, 6)};\n    window.KFS_DATA = ${JSON.stringify(data, null, 6)};\n`;
  });
  
  if (lang) {
    const isRtl = ['urdu', 'kashmiri'].includes(lang.toLowerCase());
    html = html.replace(/<html lang="en">/, `<html lang="${lang}" dir="${isRtl ? 'rtl' : 'ltr'}">`);
  }
  return html;
}

function render() {
  const result = calculate();
  const copy = window.KFS_JSONS[result.input.language] || window.KFS_JSONS.english;
  state.renderedHtml = injectTemplate(copy, state.kfsData, result.input.language);
  $('previewFrame').srcdoc = state.renderedHtml;
  renderJson();
}

function renderJson() {
  const lang = $('language').value;
  const copy = window.KFS_JSONS[lang] || {};
  $('jsonInfo').textContent = `${lang}.json`;
  $('jsonViewer').textContent = JSON.stringify(copy, null, 2);
}

function showResultPanel(panel) {
  $('previewPanel').classList.toggle('hidden', panel !== 'preview');
  $('jsonPanel').classList.toggle('hidden', panel !== 'json');
  $('viewPreviewBtn').classList.toggle('active', panel === 'preview');
  $('viewJsonBtn').classList.toggle('active', panel === 'json');
}

function generateKfs() {
  render();
  $('emptyState').classList.add('hidden');
  $('resultArea').classList.remove('hidden');
  showResultPanel('preview');
}

function downloadPdf() {
  if (!state.renderedHtml) return;
  const printWindow = $('previewFrame').contentWindow;
  printWindow.focus();
  printWindow.print();
}

async function inflateScript(base64Value) {
  if (!('DecompressionStream' in window)) {
    throw new Error('This browser does not support the compressed KFS payload.');
  }
  const bytes = Uint8Array.from(atob(base64Value), char => char.charCodeAt(0));
  const stream = new Response(bytes).body.pipeThrough(new DecompressionStream('gzip'));
  const scriptText = await new Response(stream).text();
  (0, eval)(scriptText);
}

async function loadPayload() {
  if (!window.KFS_PAYLOAD) return;
  if (!window.KFS_JSONS && window.KFS_PAYLOAD.jsons) {
    await inflateScript(window.KFS_PAYLOAD.jsons);
  }
  if (!window.KFS_TEMPLATE && window.KFS_PAYLOAD.template) {
    await inflateScript(window.KFS_PAYLOAD.template);
  }
}

async function init() {
  await loadPayload();
  const languages = Object.keys(window.KFS_JSONS || {}).sort();
  $('language').innerHTML = languages.map(lang => `<option value="${lang}">${lang}</option>`).join('');
  $('language').value = 'english';
  state.template = window.KFS_TEMPLATE || '';
  $('generateBtn').addEventListener('click', generateKfs);
  $('downloadPdfBtn').addEventListener('click', downloadPdf);
  $('viewPreviewBtn').addEventListener('click', () => showResultPanel('preview'));
  $('viewJsonBtn').addEventListener('click', () => {
    renderJson();
    showResultPanel('json');
  });
}

init();
