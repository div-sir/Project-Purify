if (!globalThis.__PROJECT_PURIFY_MONITOR_ACTIVE__) {
  globalThis.__PROJECT_PURIFY_MONITOR_ACTIVE__ = true;

  const ext = globalThis.browser ?? globalThis.chrome;
  const MAX_EVENT_TEXT = 1024 * 1024;
  const corePromise = import(ext.runtime.getURL('core/workbench.js')).catch(() => null);

  function selectedEditableText() {
    const active = document.activeElement;
    if (active instanceof HTMLTextAreaElement || (active instanceof HTMLInputElement && /^(text|search|url|email|tel)$/i.test(active.type))) {
      const start = active.selectionStart ?? 0;
      const end = active.selectionEnd ?? start;
      if (end > start) return active.value.slice(start, end);
    }
    return window.getSelection()?.toString() ?? '';
  }

  function formText(form) {
    const values = [];
    let length = 0;
    const fields = form.querySelectorAll('textarea, input');
    for (const field of fields) {
      if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) continue;
      if (field instanceof HTMLInputElement && !/^(text|search|url|email|tel)$/i.test(field.type)) continue;
      const value = field.value ?? '';
      if (!value) continue;
      const remaining = MAX_EVENT_TEXT - length;
      if (remaining <= 0) break;
      values.push(value.slice(0, remaining));
      length += Math.min(value.length, remaining);
    }
    return values.join('\n');
  }

  async function inspect(text, source) {
    if (!text) return;
    const core = await corePromise;
    if (!core) return;
    const bounded = text.slice(0, MAX_EVENT_TEXT);
    const model = core.createWorkbenchModel(bounded);
    const count = model.findings.length;
    if (count === 0) return;

    ext.runtime.sendMessage({
      type: 'purify:finding-summary',
      source,
      count,
      highRiskCount: model.findings.filter((finding) => finding.severity === 'high').length,
      truncated: text.length > bounded.length
    }).catch(() => {});
  }

  document.addEventListener('copy', () => {
    void inspect(selectedEditableText(), 'copy');
  }, true);

  document.addEventListener('submit', (event) => {
    if (event.target instanceof HTMLFormElement) void inspect(formText(event.target), 'submit');
  }, true);
}
