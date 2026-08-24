import { buildReport } from './report.js';

function normalizeFinding(finding, source) {
  if (source === 'confusable') {
    return {
      ...finding,
      source,
      category: 'confusable',
      title: `Confusable ${finding.label}`,
      detail: `${finding.char} → ${finding.skeleton}`
    };
  }

  return {
    ...finding,
    source,
    title: finding.name,
    detail: finding.label
  };
}

export function annotateText(text, findings) {
  const byIndex = new Map();
  for (const finding of findings) {
    const list = byIndex.get(finding.charIndex) ?? [];
    list.push(finding);
    byIndex.set(finding.charIndex, list);
  }

  let out = '';
  let charIndex = 0;
  for (const ch of text) {
    const atIndex = byIndex.get(charIndex) ?? [];
    const unicode = atIndex.find((finding) => finding.source === 'unicode');
    const confusable = atIndex.find((finding) => finding.source === 'confusable');

    if (unicode) out += `⟦${unicode.label} ${unicode.name}⟧`;
    else out += ch;

    if (confusable) out += `⟦confusable ${confusable.label}→${confusable.skeleton}⟧`;
    charIndex += 1;
  }
  return out;
}

export function createWorkbenchModel(text, options = {}) {
  const report = buildReport(text, options);
  const findings = [
    ...report.findings.unicode.map((finding) => normalizeFinding(finding, 'unicode')),
    ...report.findings.confusables.map((finding) => normalizeFinding(finding, 'confusable'))
  ].sort((a, b) => a.charIndex - b.charIndex || a.source.localeCompare(b.source));

  return {
    report,
    findings,
    annotatedText: annotateText(text, findings),
    cleanedText: report.transformations.cleanedText,
    confusableSkeleton: report.transformations.confusableSkeleton,
    changes: report.transformations.changes,
    categories: [...new Set(findings.map((finding) => finding.category))].sort()
  };
}

export function filterFindings(findings, filters = {}) {
  const severity = filters.severity ?? 'all';
  const category = filters.category ?? 'all';
  return findings.filter((finding) => {
    if (severity !== 'all' && finding.severity !== severity) return false;
    if (category !== 'all' && finding.category !== category) return false;
    return true;
  });
}
