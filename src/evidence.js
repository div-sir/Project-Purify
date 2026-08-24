import { buildReport } from './report.js';
import { stableStringify } from './canonical.js';
import { sha256Text } from './hash.js';
import { AUDIT_BUNDLE_VERSION, PROJECT_PURIFY_NAME, PROJECT_PURIFY_VERSION } from './version.js';

function bundlePayload(bundle) {
  const { integrity, ...payload } = bundle;
  return payload;
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

  return {
    ...payload,
    integrity: {
      algorithm: 'SHA-256',
      bundleSha256: sha256Text(stableStringify(payload))
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
    actualBundleSha256: actual
  };
}

export function reproduceAuditBundle(bundle) {
  if (typeof bundle?.evidence?.inputText !== 'string') {
    throw new Error('Audit bundle does not include input text. Reproduction requires a self-contained bundle.');
  }
  const report = buildReport(bundle.evidence.inputText, bundle.analysisOptions ?? {});
  return {
    report,
    inputHashMatches: report.evidenceHashes.input === bundle.report?.evidenceHashes?.input,
    cleanedHashMatches: report.evidenceHashes.cleaned === bundle.report?.evidenceHashes?.cleaned,
    skeletonHashMatches: report.evidenceHashes.confusableSkeleton === bundle.report?.evidenceHashes?.confusableSkeleton
  };
}
