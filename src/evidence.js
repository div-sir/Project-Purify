import { buildReport } from './report.js';
import { stableStringify } from './canonical.js';
import { sha256Text } from './hash.js';
import { AUDIT_BUNDLE_VERSION, PROJECT_PURIFY_NAME, PROJECT_PURIFY_VERSION } from './version.js';

function bundlePayload(bundle) {
  const { integrity, ...payload } = bundle;
  return payload;
}

function findingIds(report) {
  return [
    ...(report?.findings?.unicode ?? []),
    ...(report?.findings?.confusables ?? []),
    ...(report?.findings?.mixedScripts ?? [])
  ].map((finding) => finding.id).sort();
}

export function createAuditBundle(text, options = {}, bundleOptions = {}) {
  const report = buildReport(text, options);
  const includeInput = bundleOptions.includeInput === true;
  const payload = {
    bundleVersion: AUDIT_BUNDLE_VERSION,
    tool: {
      name: PROJECT_PURIFY_NAME,
      version: PROJECT_PURIFY_VERSION
    },
    analysisOptions: report.analysisOptions,
    evidence: {
      inputSha256: report.evidenceHashes.input,
      inputText: includeInput ? text : null
    },
    report
  };
  const bundleSha256 = sha256Text(stableStringify(payload));

  return {
    ...payload,
    integrity: {
      algorithm: 'SHA-256',
      bundleSha256,
      contentAddress: `sha256:${bundleSha256}`
    }
  };
}

export function verifyAuditBundle(bundle) {
  if (!bundle || typeof bundle !== 'object') {
    return { valid: false, integrityValid: false, inputHashValid: false, reason: 'Bundle must be an object.' };
  }

  const expected = bundle?.integrity?.bundleSha256;
  const actual = sha256Text(stableStringify(bundlePayload(bundle)));
  const integrityValid = typeof expected === 'string' && expected === actual;

  let inputHashValid = null;
  if (typeof bundle?.evidence?.inputText === 'string') {
    inputHashValid = sha256Text(bundle.evidence.inputText) === bundle?.evidence?.inputSha256;
  }

  return {
    valid: integrityValid && inputHashValid !== false,
    integrityValid,
    inputHashValid,
    expectedBundleSha256: expected ?? null,
    actualBundleSha256: actual,
    contentAddress: `sha256:${actual}`
  };
}

export function reproduceAuditBundle(bundle) {
  if (typeof bundle?.evidence?.inputText !== 'string') {
    throw new Error('Audit bundle does not include input text. Reproduction requires a self-contained bundle.');
  }

  const report = buildReport(bundle.evidence.inputText, bundle.analysisOptions ?? {});
  const inputHashMatches = report.evidenceHashes.input === bundle.report?.evidenceHashes?.input;
  const cleanedHashMatches = report.evidenceHashes.cleaned === bundle.report?.evidenceHashes?.cleaned;
  const skeletonHashMatches = report.evidenceHashes.confusableSkeleton === bundle.report?.evidenceHashes?.confusableSkeleton;
  const toolVersionMatches = report.tool?.version === bundle.report?.tool?.version;
  const analysisOptionsMatch = stableStringify(report.analysisOptions) === stableStringify(bundle.report?.analysisOptions ?? {});
  const confusablesProvenanceMatches = stableStringify(report.dataProvenance?.confusables ?? {}) === stableStringify(bundle.report?.dataProvenance?.confusables ?? {});
  const scriptsProvenanceMatches = stableStringify(report.dataProvenance?.scripts ?? {}) === stableStringify(bundle.report?.dataProvenance?.scripts ?? {});
  const findingSetMatches = stableStringify(findingIds(report)) === stableStringify(findingIds(bundle.report));

  return {
    report,
    inputHashMatches,
    cleanedHashMatches,
    skeletonHashMatches,
    toolVersionMatches,
    analysisOptionsMatch,
    confusablesProvenanceMatches,
    scriptsProvenanceMatches,
    findingSetMatches,
    reproductionValid: inputHashMatches && cleanedHashMatches && skeletonHashMatches && toolVersionMatches && analysisOptionsMatch && confusablesProvenanceMatches && scriptsProvenanceMatches && findingSetMatches
  };
}
