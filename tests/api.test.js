import test from 'node:test';
import assert from 'node:assert/strict';
import * as purify from '../src/index.js';

test('public ESM API exposes core analysis functions', () => {
  for (const name of [
    'scanText',
    'cleanText',
    'buildReport',
    'analyzeFile',
    'discoverFiles',
    'createWorkbenchModel',
    'reportToSarif'
  ]) {
    assert.equal(typeof purify[name], 'function', `${name} should be exported`);
  }
});

test('public API can build and export one report without private imports', () => {
  const report = purify.buildReport('A\u200BB');
  assert.equal(report.summary.invisibleOrControlCount, 1);
  assert.equal(purify.cleanText('A\u200BB'), 'AB');

  const sarif = purify.reportToSarif(report, { artifactUri: 'sample.txt' });
  assert.equal(sarif.version, '2.1.0');
  assert.equal(sarif.runs[0].results.length, 1);
});
