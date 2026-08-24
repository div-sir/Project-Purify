import test from 'node:test';
import assert from 'node:assert/strict';
import { detectConfusables, getConfusablesMetadata } from '../src/confusables.js';
import { buildReport } from '../src/report.js';

test('exposes pinned confusables provenance', () => {
  const metadata = getConfusablesMetadata();
  assert.equal(metadata.unicodeVersion, '17.0.0');
  assert.match(metadata.sourceUrl, /17\.0\.0\/security\/confusables\.txt$/);
  assert.ok(metadata.entryCount > 0);
  assert.ok(['fallback', 'full'].includes(metadata.completeness));
});

test('runtime detector uses generated data module', () => {
  const findings = detectConfusables('pаypal');
  assert.equal(findings.length, 1);
  assert.equal(findings[0].skeleton, 'a');
  assert.equal(findings[0].dataSource.unicodeVersion, '17.0.0');
});

test('report includes confusables provenance', () => {
  const report = buildReport('safe');
  assert.equal(report.schemaVersion, '1.1.0');
  assert.equal(report.dataProvenance.confusables.unicodeVersion, '17.0.0');
});
