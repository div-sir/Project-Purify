import { scanText, cleanText } from './scanner.js';
import { detectConfusables, confusableSkeleton, getConfusablesMetadata } from './confusables.js';
import { analyzeScripts, getScriptsMetadata } from './scripts.js';
import { sha256Text } from './hash.js';
import { normalizeReportOptions } from './options.js';
import { PROJECT_PURIFY_NAME, PROJECT_PURIFY_VERSION } from './version.js';

export const REPORT_SCHEMA_VERSION = '1.4.0';

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
  const analysisOptions = normalizeReportOptions(options);
  const scan = scanText(text);
  const cleanedText = cleanText(text, analysisOptions.clean);
  const confusables = detectConfusables(text, analysisOptions.confusables);
  const scriptAnalysis = analyzeScripts(text, analysisOptions.scripts);
  const mixedScripts = scriptAnalysis.findings;
  const changes = diffText(text, cleanedText);
  const skeleton = confusableSkeleton(text);
  const confusablesData = getConfusablesMetadata();
  const scriptsData = getScriptsMetadata();
  const allFindings = [...scan.findings, ...confusables, ...mixedScripts];

  const severityCounts = countBy(allFindings, 'severity');
  const categoryCounts = countBy(allFindings, 'category');
  const limitations = [
    'Unicode findings are text-level evidence only and do not prove AI authorship.',
    'UTS #39 skeleton mappings are broader than suspicious findings. ASCII source mappings are suppressed by default to reduce false positives.',
    'Mixed-script findings are policy signals, not proof of deception. Legitimate multilingual text can mix scripts intentionally.',
    'Conservative cleaning preserves shaping-, direction-, presentation-, and tag-sensitive controls by default. Aggressive removal requires explicit opt-in.'
  ];

  if (confusablesData.completeness !== 'full') {
    limitations.push('This build uses the offline fallback confusables dataset. Run the pinned Unicode data generator for complete UTS #39 coverage.');
  }
  if (scriptsData.completeness !== 'full') {
    limitations.push('This build uses fallback script-range metadata. Run the pinned Unicode script-data generator for complete script coverage.');
  }

  return {
    schemaVersion: REPORT_SCHEMA_VERSION,
    tool: {
      name: PROJECT_PURIFY_NAME,
      version: PROJECT_PURIFY_VERSION
    },
    analysisOptions,
    evidenceHashes: {
      algorithm: 'SHA-256',
      input: sha256Text(text),
      cleaned: sha256Text(cleanedText),
      confusableSkeleton: sha256Text(skeleton)
    },
    evidenceInterpretation: {
      model: 'deterministic-rule-based',
      attributionSupported: false,
      attributionConfidence: null,
      severityIsProbability: false,
      statement: 'Findings describe deterministic Unicode properties and configured policy signals. They do not establish AI authorship, author intent, or malicious intent.'
    },
    dataProvenance: {
      confusables: confusablesData,
      scripts: scriptsData
    },
    input: {
      utf16Length: text.length,
      codePointLength: [...text].length
    },
    scriptAnalysis: {
      profile: scriptAnalysis.profile,
      languageHint: scriptAnalysis.languageHint,
      tokensAnalyzed: scriptAnalysis.tokensAnalyzed,
      scriptsUsed: scriptAnalysis.scriptsUsed
    },
    summary: {
      invisibleOrControlCount: scan.count,
      confusableCount: confusables.length,
      mixedScriptCount: mixedScripts.length,
      highRiskCount: allFindings.filter((finding) => finding.severity === 'high').length,
      changed: text !== cleanedText,
      severityCounts,
      categoryCounts
    },
    findings: {
      unicode: scan.findings,
      confusables,
      mixedScripts
    },
    transformations: {
      cleanedText,
      changes,
      confusableSkeleton: skeleton
    },
    limitations
  };
}
