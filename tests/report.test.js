import test from 'node:test';
import assert from 'node:assert/strict';
import { detectConfusables, confusableSkeleton } from '../src/confusables.js';
import { buildReport, diffText, REPORT_SCHEMA_VERSION } from '../src/report.js';

test('detects common Cyrillic confusables', () => {
  const findings = detectConfusables('pаypal');
  assert.equal(findings.length, 1);
  assert.equal(findings[0].label, 'U+0430');
  assert.equal(findings[0].skeleton, 'a');
});

test('builds a Latin-lookalike skeleton', () => {
  assert.equal(confusableSkeleton('pаypal'), 'paypal');
});

test('ASCII skeleton mappings are not suspicious findings by default', () => {
  assert.equal(confusableSkeleton('m'), 'rn');
  assert.equal(detectConfusables('normal message').some((finding) => finding.label === 'U+006D'), false);
  assert.equal(detectConfusables('m', { includeAscii: true })[0].label, 'U+006D');
});

test('builds a versioned forensic report', () => {
  const report = buildReport('A\u200Bpаypal');
  assert.equal(report.schemaVersion, REPORT_SCHEMA_VERSION);
  assert.equal(report.summary.invisibleOrControlCount, 1);
  assert.equal(report.summary.confusableCount, 1);
  assert.equal(report.summary.changed, true);
  assert.equal(report.transformations.cleanedText, 'Apаypal');
  assert.equal(report.transformations.confusableSkeleton, 'A\u200Bpaypal');
});

test('reports no diff when text is unchanged', () => {
  assert.deepEqual(diffText('plain text', 'plain text'), []);
});

test('reports removed invisible content', () => {
  const changes = diffText('A\u200BB', 'AB');
  assert.equal(changes.length, 1);
  assert.equal(changes[0].removed, '\u200B');
  assert.equal(changes[0].added, '');
});
