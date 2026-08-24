import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReport } from '../src/report.js';
import { compareReports } from '../src/compare.js';

test('identical reports compare as equivalent', () => {
  const left = buildReport('A\u200BB');
  const right = buildReport('A\u200BB');
  const comparison = compareReports(left, right);
  assert.equal(comparison.equivalent, true);
  assert.equal(comparison.findings.sameSet, true);
  assert.equal(comparison.input.sameHash, true);
  assert.equal(comparison.analysisOptions.same, true);
});

test('comparison reports added mixed-script findings', () => {
  const left = buildReport('paypal', { scripts: { languageHint: 'en' } });
  const right = buildReport('pаypal', { scripts: { languageHint: 'en' } });
  const comparison = compareReports(left, right);
  assert.equal(comparison.equivalent, false);
  assert.equal(comparison.input.sameHash, false);
  assert.equal(comparison.summaryDelta.mixedScriptCount, 1);
  assert.ok(comparison.findings.addedFindingIds.some((id) => id.startsWith('mixed-script:')));
});

test('comparison detects analysis-policy differences on the same input', () => {
  const left = buildReport('abcאבג', { scripts: { languageHint: 'auto', profile: 'identifier', strictMixedScript: true } });
  const right = buildReport('abcאבג', { scripts: { languageHint: 'en', profile: 'identifier', strictMixedScript: true } });
  const comparison = compareReports(left, right);
  assert.equal(comparison.input.sameHash, true);
  assert.equal(comparison.analysisOptions.same, false);
  assert.equal(comparison.equivalent, false);
});
