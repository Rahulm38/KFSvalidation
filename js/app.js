/**
 * app.js — UI wiring, generate/render flow, and download handlers.
 *
 * Depends on:
 *   - calc.js   (window.Calc)
 *   - loader.js (window.Loader)
 *   - data/kfs-payload.js (sets window.KFS_PAYLOAD)
 */

'use strict';

/* ─────────────────────────────────────────────────────────────
   State
───────────────────────────────────────────────────────────── */
const state = {
  renderedHtml: '',
  currentLang: 'english',
};

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */
const $ = (id) => document.getElementById(id);

/** Fixed test-mode data — applicant info not generated from inputs */
const TEST_DATA = {
  applicantName: 'TEST DATA',
  loanProposalNumber: 'PZ0000000001',
  repaymentStartDate: '01/01/2026',
  applicationSubmitted:
    'Application is submitted on-line by the customer on 01/01/2026 at 00:00',
};

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
    ...TEST_DATA,
  };
}

/* ─────────────────────────────────────────────────────────────
   Template injection
───────────────────────────────────────────────────────────── */
const RTL_LANGUAGES = ['urdu', 'kashmiri'];

function buildKfsData(input, calcResult, copy) {
  const { Calc } = window;
  const monthsLabel = (copy?.months || copy?.Months || 'Months').trim();
  return {
    flow: input.flow,
    date: input.date,
    applicantName: input.applicantName,
    loanProposalNumber: input.loanProposalNumber,
    loanAmount: Calc.money(input.loanAmount),
    loanTerm: `${input.tenure} ${monthsLabel}`,
    numberOfEPIs: String(input.tenure),
    epiAmount: Calc.money(calcResult.emi, 2),
    repaymentStartDate: input.repaymentStartDate,
    interestRate: Calc.percent(input.roi),
    apr: Calc.percent(calcResult.apr),
    processingFee: Calc.money(input.processingFee),
    totalInterest: Calc.money(calcResult.totalInterest),
    totalAmountPayable: Calc.money(
      input.loanAmount + input.processingFee + calcResult.totalInterest
    ),
    netDisbursedAmount: Calc.money(input.loanAmount),
    applicationSubmitted: input.applicationSubmitted,
    repaymentSchedule: calcResult.schedule,
  };
}

function injectTemplate(copy, kfsData, lang) {
  let html = window.KFS_TEMPLATE;

  // Replace the default copy + data placeholders in the template
  html = html.replace(
    /window\.KFS_COPY = window\.KFS_COPY \|\| [\s\S]*?;\n\s*window\.KFS_DATA = window\.KFS_DATA \|\| [\s\S]*?;\n/,
    () =>
      `window.KFS_COPY = ${JSON.stringify(copy, null, 4)};\n    window.KFS_DATA = ${JSON.stringify(kfsData, null, 4)};\n`
  );

  // Set correct html[lang] and dir attributes
  const isRtl = RTL_LANGUAGES.includes((lang || '').toLowerCase());
  html = html.replace(
    /<html[^>]*>/,
    `<html lang="${lang}" dir="${isRtl ? 'rtl' : 'ltr'}">`
  );

  return html;
}

/* ─────────────────────────────────────────────────────────────
   Generate + Render
───────────────────────────────────────────────────────────── */
function generate() {
  const input = readInputs();
  state.currentLang = input.language;

  const calcResult = window.Calc.calculateKfs(input);
  const copy = window.KFS_JSONS[input.language] || window.KFS_JSONS.english;
  const kfsData = buildKfsData(input, calcResult, copy);

  state.renderedHtml = injectTemplate(copy, kfsData, input.language);
  $('previewFrame').srcdoc = state.renderedHtml;

  // Update the JSON panel in the background
  updateJsonPanel(input.language);

  // Show result area
  $('emptyState').classList.add('hidden');
  $('resultArea').classList.remove('hidden');
  showPanel('preview');
}

/* ─────────────────────────────────────────────────────────────
   Panel switching
───────────────────────────────────────────────────────────── */
function showPanel(panel) {
  const isPreview = panel === 'preview';
  $('previewPanel').classList.toggle('hidden', !isPreview);
  $('jsonPanel').classList.toggle('hidden', isPreview);
  $('tabPreview').classList.toggle('active', isPreview);
  $('tabJson').classList.toggle('active', !isPreview);
}

/* ─────────────────────────────────────────────────────────────
   JSON viewer
───────────────────────────────────────────────────────────── */
function updateJsonPanel(lang) {
  const copy = window.KFS_JSONS[lang] || {};
  const keyCount = Object.keys(copy).length;
  $('jsonMeta').textContent = `${lang}.json  ·  ${keyCount} keys`;
  $('jsonViewer').textContent = JSON.stringify(copy, null, 2);
}

/* ─────────────────────────────────────────────────────────────
   Downloads
───────────────────────────────────────────────────────────── */
function downloadPdf() {
  if (!state.renderedHtml) return;
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(state.renderedHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  } else {
    alert("Please allow popups to download the PDF");
  }
}

function downloadHtml() {
  if (!state.renderedHtml) return;
  triggerDownload(
    new Blob([state.renderedHtml], { type: 'text/html;charset=utf-8' }),
    `${state.currentLang}-kfs.html`
  );
}

function downloadJson() {
  const lang = $('language').value;
  const copy = window.KFS_JSONS[lang];
  if (!copy) return;
  triggerDownload(
    new Blob([JSON.stringify(copy, null, 2)], { type: 'application/json' }),
    `${lang}.json`
  );
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/* ─────────────────────────────────────────────────────────────
   Init
───────────────────────────────────────────────────────────── */
async function init() {
  // Show loading state
  $('generateBtn').disabled = true;
  $('generateBtn').textContent = 'Loading…';

  try {
    await window.Loader.loadPayload();
  } catch (err) {
    $('generateBtn').textContent = 'Load Error';
    console.error('[KFS] Payload load failed:', err);
    alert('Failed to load KFS payload: ' + err.message);
    return;
  }

  // Populate language dropdown (exclude internal keys)
  const languages = Object.keys(window.KFS_JSONS || {})
    .filter((k) => !k.startsWith('_'))
    .sort();

  $('language').innerHTML = languages
    .map(
      (lang) =>
        `<option value="${lang}">${lang.charAt(0).toUpperCase() + lang.slice(1)}</option>`
    )
    .join('');
  $('language').value = 'english';

  // Re-enable generate button
  $('generateBtn').disabled = false;
  $('generateBtn').textContent = 'Generate KFS';

  // Wire up events
  $('generateBtn').addEventListener('click', generate);
  $('tabPreview').addEventListener('click', () => showPanel('preview'));
  $('tabJson').addEventListener('click', () => {
    updateJsonPanel($('language').value);
    showPanel('json');
  });
  $('dlPdfBtn').addEventListener('click', downloadPdf);
  $('dlHtmlBtn').addEventListener('click', downloadHtml);
  $('dlJsonBtn').addEventListener('click', downloadJson);

  // Update JSON panel when language changes (even before generating)
  $('language').addEventListener('change', () => {
    if (!$('jsonPanel').classList.contains('hidden')) {
      updateJsonPanel($('language').value);
    }
  });

  // Hide the result area and show the empty state whenever any input changes
  const inputIds = ['flow', 'language', 'loanAmount', 'roi', 'tenure', 'processingFee', 'otherCharges', 'date'];
  inputIds.forEach(id => {
    $(id).addEventListener('input', () => {
      $('emptyState').classList.remove('hidden');
      $('resultArea').classList.add('hidden');
      state.renderedHtml = '';
      $('previewFrame').srcdoc = '';
    });
  });
}

init();
