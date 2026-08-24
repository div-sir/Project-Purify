import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorkbenchModel, filterFindings } from '../src/workbench.js';

test('workbench model combines Unicode and confusable findings', () => {
  const model = createWorkbenchModel('A\u200Bpаypal');
  assert.equal(model.report.summary.invisibleOrControlCount, 1);
  assert.equal(model.report.summary.confusableCount >= 1, true);
  assert.equal(model.findings.some((finding) => finding.category === 'confusable'), true);
  assert.match(model.annotatedText, /U\+200B/);
  assert.match(model.annotatedText, /confusable/);
});

test('workbench filters by severity and category', () => {
  const model = createWorkbenchModel('A\u200Bpаypal');
  const high = filterFindings(model.findings, { severity: 'high' });
  assert.equal(high.every((finding) => finding.severity === 'high'), true);

  const confusables = filterFindings(model.findings, { category: 'confusable' });
  assert.equal(confusables.length >= 1, true);
  assert.equal(confusables.every((finding) => finding.category === 'confusable'), true);
});

test('workbench exposes cleaned text, skeleton, and changes', () => {
  const model = createWorkbenchModel('A\u200Bpаypal');
  assert.equal(model.cleanedText.includes('\u200B'), false);
  assert.equal(model.changes.length >= 1, true);
  assert.notEqual(model.confusableSkeleton, 'A\u200Bpаypal');
});
