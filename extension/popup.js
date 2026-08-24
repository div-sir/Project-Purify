import { createWorkbenchModel } from './core/workbench.js';

const ext = globalThis.browser ?? globalThis.chrome;
const MAX_PAGE_TEXT = 1024 * 1024;
const input = document.querySelector('#input');
const clean = document.querySelector('#clean');
const findings = document.querySelector('#findings');
const status = document.querySelector('#status');
let model = createWorkbenchModel('');

function render() {
  model = createWorkbenchModel(input.value);
  clean.value = model.cleanedText;
  document.querySelector('#total').textContent = String(model.findings.length);
  document.querySelector('#high').textContent = String(model.findings.filter((finding) => finding.severity === 'high').length);
  document.querySelector('#confusables').textContent = String(model.report.summary.confusableCount);

  findings.replaceChildren();
  const visible = model.findings.slice(0, 20);
  for (const finding of visible) {
    const li = document.createElement('li');
    const title = document.createElement('div');
    const code = document.createElement('code');
    code.textContent = `${finding.label} · ${finding.severity}`;
    title.append(code);
    const detail = document.createElement('div');
    detail.className = 'muted';
    detail.textContent = finding.reason ?? finding.title;
    li.append(title, detail);
    findings.append(li);
  }
  if (model.findings.length > visible.length) {
    const li = document.createElement('li');
    li.className = 'muted';
    li.textContent = `+${model.findings.length - visible.length} more findings`;
    findings.append(li);
  }

  ext.runtime.sendMessage({
    type: 'purify:finding-summary',
    source: 'popup',
    count: model.findings.length,
    highRiskCount: model.findings.filter((finding) => finding.severity === 'high').length
  }).catch(() => {});
}

async function activeTabId() {
  const [tab] = await ext.tabs.query({ active: true, currentWindow: true });
  return tab?.id ?? null;
}

async function readPageSelection() {
  const tabId = await activeTabId();
  if (!tabId) return '';

  const [result] = await ext.scripting.executeScript({
    target: { tabId },
    func: () => {
      const active = document.activeElement;
      if (active instanceof HTMLTextAreaElement || (active instanceof HTMLInputElement && /^(text|search|url|email|tel)$/i.test(active.type))) {
        const start = active.selectionStart ?? 0;
        const end = active.selectionEnd ?? start;
        if (end > start) return active.value.slice(start, end);
      }
      return window.getSelection()?.toString() ?? '';
    }
  });
  return result?.result ?? '';
}

async function readVisiblePageText() {
  const tabId = await activeTabId();
  if (!tabId) return { text: '', truncated: false };

  const [result] = await ext.scripting.executeScript({
    target: { tabId },
    args: [MAX_PAGE_TEXT],
    func: (limit) => {
      const text = document.body?.innerText ?? '';
      return { text: text.slice(0, limit), truncated: text.length > limit };
    }
  });
  return result?.result ?? { text: '', truncated: false };
}

async function useSelection() {
  try {
    const text = await readPageSelection();
    if (!text) {
      status.textContent = 'No page selection found.';
      return;
    }
    input.value = text;
    status.textContent = 'Loaded current page selection.';
    render();
  } catch {
    status.textContent = 'This page does not allow selection access.';
  }
}

async function scanPage() {
  try {
    const { text, truncated } = await readVisiblePageText();
    if (!text) {
      status.textContent = 'No visible page text found.';
      return;
    }
    input.value = text;
    status.textContent = truncated ? 'Loaded first 1 MiB of visible page text.' : 'Loaded visible page text.';
    render();
  } catch {
    status.textContent = 'This page does not allow page-text access.';
  }
}

async function copyClean() {
  await navigator.clipboard.writeText(clean.value);
  status.textContent = 'Clean text copied.';
}

async function loadPendingContextSelection() {
  const { pendingText, pendingSource } = await ext.storage.session.get(['pendingText', 'pendingSource']);
  if (!pendingText) return false;
  input.value = pendingText;
  status.textContent = pendingSource === 'context-menu' ? 'Loaded context-menu selection.' : 'Loaded pending selection.';
  await ext.storage.session.remove(['pendingText', 'pendingSource']);
  render();
  return true;
}

document.querySelector('#selection').addEventListener('click', useSelection);
document.querySelector('#page').addEventListener('click', scanPage);
document.querySelector('#copy').addEventListener('click', copyClean);
document.querySelector('#clear').addEventListener('click', () => {
  input.value = '';
  status.textContent = '';
  render();
});
input.addEventListener('input', render);

if (!(await loadPendingContextSelection())) {
  await useSelection();
  if (!input.value) render();
}
