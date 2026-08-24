import test from 'node:test';
import assert from 'node:assert/strict';
import * as purify from '../src/index.js';

test('public ESM API exposes core and evidence functions', () => {
  for (const name of [
    'scanText',
    'cleanText',
    'buildReport',
    'analyzeFile',
    'discoverFiles',
    'createWorkbenchModel',
    'reportToSarif',
    'analyzeScripts',
    'createAuditBundle',
    'verifyAuditBundle',
    'reproduceAuditBundle',
    'compareReports',
    'sha256Text'
  ]) {
    assert.equal(typeof purify[name], 'function', `${name} should be exported`);
  }
});

test('public API can build, hash, compare, and export one report without private imports', () => {
  const report = purify.buildReport('A\u200BB');
  assert.equal(report.summary.invisibleOrControlCount, 1);
  assert.equal(purify.cleanText('A\u200BB'), 'AB');
  assert.match(report.evidenceHashes.input, /^[a-f0-9]{64}$/);

  const comparison = purify.compareReports(report, purify.buildReport('A\u200BB'));
  assert.equal(comparison.equivalent, true);

  const sarif = purify.reportToSarif(report, { artifactUri: 'sample.txt' });
  assert.equal(sarif.version, '2.1.0');
  assert.equal(sarif.runs[0].results.length, 1);
});
