const SARIF_VERSION = '2.1.0';
const SARIF_SCHEMA = 'https://json.schemastore.org/sarif-2.1.0.json';

function levelForSeverity(severity) {
  if (severity === 'high') return 'error';
  if (severity === 'medium') return 'warning';
  return 'note';
}

function findingCategory(finding) {
  return finding.category ?? finding.type ?? 'unicode';
}

function ruleIdFor(finding) {
  return `project-purify/${findingCategory(finding)}/${finding.label ?? 'unknown'}`;
}

function ruleFor(finding) {
  return {
    id: ruleIdFor(finding),
    name: finding.name ?? finding.type ?? 'Unicode finding',
    shortDescription: {
      text: finding.reason ?? 'Suspicious Unicode text artifact.'
    },
    fullDescription: {
      text: finding.remediation ?? 'Review the Unicode character in context.'
    },
    defaultConfiguration: {
      level: levelForSeverity(finding.severity)
    },
    properties: {
      category: findingCategory(finding),
      severity: finding.severity ?? 'unknown'
    }
  };
}

function resultForFinding(finding, artifactUri, options = {}) {
  const physicalLocation = {
    artifactLocation: { uri: artifactUri }
  };

  if (options.includeRegion !== false && Number.isInteger(finding.charIndex)) {
    physicalLocation.region = {
      charOffset: finding.charIndex,
      charLength: 1
    };
  }

  return {
    ruleId: ruleIdFor(finding),
    level: levelForSeverity(finding.severity),
    message: {
      text: `${finding.label ?? 'Unicode finding'}: ${finding.reason ?? finding.name ?? finding.type ?? 'Review this character.'}`
    },
    locations: [{ physicalLocation }],
    properties: {
      findingId: finding.id,
      category: findingCategory(finding),
      severity: finding.severity,
      remediation: finding.remediation,
      logicalPath: options.logicalPath ?? null
    }
  };
}

function findingsFromReport(report) {
  return [
    ...(report?.findings?.unicode ?? []),
    ...(report?.findings?.confusables ?? [])
  ];
}

function entriesForFileResult(result) {
  const artifactUri = result.path ?? 'unknown';

  if (result.mode === 'stream-detect-only') {
    return (result.findings ?? []).map((finding) => ({ finding, artifactUri, includeRegion: true }));
  }

  if (result.report) {
    return findingsFromReport(result.report).map((finding) => ({ finding, artifactUri, includeRegion: true }));
  }

  if (result.format === 'json') {
    return (result.structured?.fields ?? []).flatMap((field) =>
      findingsFromReport(field.report).map((finding) => ({
        finding,
        artifactUri,
        includeRegion: false,
        logicalPath: field.path
      }))
    );
  }

  if (result.format === 'csv') {
    return (result.structured?.fields ?? []).flatMap((field) =>
      findingsFromReport(field.report).map((finding) => ({
        finding,
        artifactUri,
        includeRegion: false,
        logicalPath: `row ${field.row}, column ${field.column}`
      }))
    );
  }

  return [];
}

function buildSarif(entries, errors = []) {
  const rules = new Map();
  const results = [];

  for (const entry of entries) {
    const { finding } = entry;
    const ruleId = ruleIdFor(finding);
    if (!rules.has(ruleId)) rules.set(ruleId, ruleFor(finding));
    results.push(resultForFinding(finding, entry.artifactUri, entry));
  }

  return {
    $schema: SARIF_SCHEMA,
    version: SARIF_VERSION,
    runs: [{
      tool: {
        driver: {
          name: 'Project Purify',
          informationUri: 'https://github.com/div-sir/Project-Purify',
          rules: [...rules.values()]
        }
      },
      results,
      invocations: [{
        executionSuccessful: errors.length === 0,
        toolExecutionNotifications: errors.map((error) => ({
          level: 'error',
          message: { text: `${error.path ?? 'input'}: ${error.error ?? 'Analysis failed.'}` }
        }))
      }]
    }]
  };
}

export function reportToSarif(report, options = {}) {
  const artifactUri = options.artifactUri ?? 'stdin';
  const entries = findingsFromReport(report).map((finding) => ({ finding, artifactUri, includeRegion: true }));
  return buildSarif(entries);
}

export function fileResultToSarif(result) {
  return buildSarif(entriesForFileResult(result));
}

export function batchResultsToSarif(results) {
  const entries = results.filter((result) => result.ok).flatMap(entriesForFileResult);
  const errors = results.filter((result) => !result.ok);
  return buildSarif(entries, errors);
}
