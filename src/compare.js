import { stableStringify } from './canonical.js';

function flattenFindings(report) {
  return [
    ...(report?.findings?.unicode ?? []),
    ...(report?.findings?.confusables ?? []),
    ...(report?.findings?.mixedScripts ?? [])
  ];
}

function findingMap(report) {
  return new Map(flattenFindings(report).map((finding) => [finding.id, finding]));
}

function delta(left = 0, right = 0) {
  return (right ?? 0) - (left ?? 0);
}

function provenanceKey(value) {
  if (!value) return null;
  return stableStringify({
    unicodeVersion: value.unicodeVersion ?? null,
    sourceSha256: value.sourceSha256 ?? null,
    completeness: value.completeness ?? null
  });
}

export function compareReports(left, right) {
  if (!left || !right) throw new Error('compareReports requires two reports.');

  const leftFindings = findingMap(left);
  const rightFindings = findingMap(right);
  const addedFindingIds = [...rightFindings.keys()].filter((id) => !leftFindings.has(id)).sort();
  const removedFindingIds = [...leftFindings.keys()].filter((id) => !rightFindings.has(id)).sort();
  const commonFindingIds = [...leftFindings.keys()].filter((id) => rightFindings.has(id)).sort();

  const sameInput = left?.evidenceHashes?.input != null && left.evidenceHashes.input === right?.evidenceHashes?.input;
  const sameCleaned = left?.evidenceHashes?.cleaned != null && left.evidenceHashes.cleaned === right?.evidenceHashes?.cleaned;
  const sameSkeleton = left?.evidenceHashes?.confusableSkeleton != null && left.evidenceHashes.confusableSkeleton === right?.evidenceHashes?.confusableSkeleton;
  const sameOptions = stableStringify(left.analysisOptions ?? {}) === stableStringify(right.analysisOptions ?? {});

  return {
    schema: {
      left: left.schemaVersion ?? null,
      right: right.schemaVersion ?? null,
      same: left.schemaVersion === right.schemaVersion
    },
    tool: {
      left: left.tool ?? null,
      right: right.tool ?? null,
      sameVersion: left?.tool?.version === right?.tool?.version
    },
    input: {
      sameHash: sameInput,
      leftSha256: left?.evidenceHashes?.input ?? null,
      rightSha256: right?.evidenceHashes?.input ?? null
    },
    output: {
      sameCleanedHash: sameCleaned,
      sameSkeletonHash: sameSkeleton,
      leftCleanedSha256: left?.evidenceHashes?.cleaned ?? null,
      rightCleanedSha256: right?.evidenceHashes?.cleaned ?? null
    },
    analysisOptions: {
      same: sameOptions,
      left: left.analysisOptions ?? null,
      right: right.analysisOptions ?? null
    },
    dataProvenance: {
      confusablesSame: provenanceKey(left?.dataProvenance?.confusables) === provenanceKey(right?.dataProvenance?.confusables),
      scriptsSame: provenanceKey(left?.dataProvenance?.scripts) === provenanceKey(right?.dataProvenance?.scripts)
    },
    summaryDelta: {
      invisibleOrControlCount: delta(left?.summary?.invisibleOrControlCount, right?.summary?.invisibleOrControlCount),
      confusableCount: delta(left?.summary?.confusableCount, right?.summary?.confusableCount),
      mixedScriptCount: delta(left?.summary?.mixedScriptCount, right?.summary?.mixedScriptCount),
      highRiskCount: delta(left?.summary?.highRiskCount, right?.summary?.highRiskCount)
    },
    findings: {
      addedFindingIds,
      removedFindingIds,
      commonFindingIds,
      sameSet: addedFindingIds.length === 0 && removedFindingIds.length === 0
    },
    equivalent: sameInput && sameCleaned && sameSkeleton && sameOptions && addedFindingIds.length === 0 && removedFindingIds.length === 0
  };
}
