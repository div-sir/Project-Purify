import { scanText, cleanText } from './scanner.js';
import { detectConfusables, confusableSkeleton, getConfusablesMetadata } from './confusables.js';

export const REPORT_SCHEMA_VERSION = '1.1.0';

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] ?? 'unknown';
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

export function diffText(original, cleaned) {
  if (original === cleaned) return [];

  const changes = [];
  let oi = 0;
  let ci = 0;

  while (oi < original.length || ci < cleaned.length) {
    if (original[oi] === cleaned[ci]) {
      oi += 1;
      ci += 1;
      continue;
    }

    const startOriginal = oi;
    const startCleaned = ci;

    while (oi < original.length && original[oi] !== cleaned[ci]) oi += 1;
    while (ci < cleaned.length && cleaned[ci] !== original[oi]) ci += 1;

    changes.push({
      originalStart: startOriginal,
      cleanedStart: startCleaned,
      removed: original.slice(startOriginal, oi),
      added: cleaned.slice(startCleaned, ci)
    });
  }

  return changes;
}

export function buildReport(text, options = {}) {
  const scan = scanText(text);
  const cleanedText = cleanText(text, options.clean ?? {});
  const confusables = detectConfusables(text);
  const changes = diffText(text, cleanedText);
  const confusablesData = getConfusablesMetadata();

  const severityCounts = countBy([...scan.findings, ...confusables], 'severity');
  const categoryCounts = countBy(scan.findings, 'category');
  const limitations = [
    'Unicode findings are text-level evidence only and do not prove AI authorship.'
  ];

  if (confusablesData.completeness !== 'full') {
    limitations.push('This build uses the offline fallback confusables dataset. Run the pinned Unicode data generator for complete UTS #39 coverage.');
  }

  return {
    schemaVersion: REPORT_SCHEMA_VERSION,
    dataProvenance: {
      confusables: confusablesData
    },
    input: {
      utf16Length: text.length,
      codePointLength: [...text].length
    },
    summary: {
      invisibleOrControlCount: scan.count,
      confusableCount: confusables.length,
      highRiskCount: scan.highRiskCount,
      changed: text !== cleanedText,
      severityCounts,
      categoryCounts
    },
    findings: {
      unicode: scan.findings,
      confusables
    },
    transformations: {
      cleanedText,
      changes,
      confusableSkeleton: confusableSkeleton(text)
    },
    limitations
  };
}
