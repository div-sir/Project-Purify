import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { buildReport } from '../src/report.js';
import { reportToSarif, fileResultToSarif, batchResultsToSarif } from '../src/sarif.js';
import { analyzeFile } from '../src/files.js';

test('SARIF report uses 2.1.0 and code-point offsets', () => {
  const report = buildReport('😀\u200Bz');
  const sarif = reportToSarif(report, { artifactUri: 'sample.txt' });
  assert.equal(sarif.version, '2.1.0');
  assert.equal(sarif.runs[0].results.length, 1);
  assert.equal(sarif.runs[0].results[0].locations[0].physicalLocation.region.charOffset, 1);
  assert.equal(sarif.runs[0].results[0].locations[0].physicalLocation.artifactLocation.uri, 'sample.txt');
});

test('structured SARIF does not claim field-local offsets are file offsets', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'purify-sarif-'));
  const file = path.join(dir, 'data.json');
  await fs.writeFile(file, JSON.stringify({ value: 'A\u200BB' }), 'utf8');
  const result = await analyzeFile(file);
  const sarif = fileResultToSarif(result);
  const physical = sarif.runs[0].results[0].locations[0].physicalLocation;
  assert.equal('region' in physical, false);
  assert.equal(sarif.runs[0].results[0].properties.logicalPath, '$.value');
});

test('batch SARIF records analysis errors as invocation notifications', () => {
  const sarif = batchResultsToSarif([
    { ok: false, path: 'bad.bin', error: 'Unsupported text file type' }
  ]);
  const invocation = sarif.runs[0].invocations[0];
  assert.equal(invocation.executionSuccessful, false);
  assert.equal(invocation.toolExecutionNotifications.length, 1);
});
