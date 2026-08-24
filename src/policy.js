const SEVERITY_RANK = Object.freeze({
  low: 1,
  medium: 2,
  high: 3
});

export const VALID_SEVERITIES = Object.freeze(Object.keys(SEVERITY_RANK));

export function validateSeverity(value) {
  if (!VALID_SEVERITIES.includes(value)) {
    throw new Error(`Invalid severity ${JSON.stringify(value)}. Use low, medium, or high.`);
  }
  return value;
}

export function severityAtLeast(actual, threshold) {
  if (!actual || !threshold) return false;
  return (SEVERITY_RANK[actual] ?? 0) >= (SEVERITY_RANK[threshold] ?? Number.POSITIVE_INFINITY);
}

export function reportFailsSeverity(report, threshold) {
  validateSeverity(threshold);
  const counts = report?.summary?.severityCounts ?? {};
  return Object.entries(counts).some(([severity, count]) => count > 0 && severityAtLeast(severity, threshold));
}

export function resultFailsSeverity(result, threshold) {
  validateSeverity(threshold);
  if (!result?.ok) return false;
  const counts = result?.summary?.severityCounts ?? result?.report?.summary?.severityCounts ?? {};
  return Object.entries(counts).some(([severity, count]) => count > 0 && severityAtLeast(severity, threshold));
}
