import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuditBundle, verifyAuditBundle, reproduceAuditBundle } from '../src/evidence.js';

test('audit bundle verifies when unchanged', () => {
  const bundle = createAuditBundle('A\u200BB', { scripts: { languageHint: 'en' } });
  const verification = verifyAuditBundle(bundle);
  assert.equal(verification.valid, true);
  assert.equal(verification.integrityValid, true);
  assert.equal(verification.inputHashValid, null);
});

test('self-contained audit bundle verifies input and reproduces hashes', () => {
  const bundle = createAuditBundle('pаypal', { scripts: { languageHint: 'en' } }, { includeInput: true });
  const verification = verifyAuditBundle(bundle);
  assert.equal(verification.valid, true);
  assert.equal(verification.inputHashValid, true);

  const reproduced = reproduceAuditBundle(bundle);
  assert.equal(reproduced.inputHashMatches, true);
  assert.equal(reproduced.cleanedHashMatches, true);
  assert.equal(reproduced.skeletonHashMatches, true);
});

test('audit bundle detects tampering', () => {
  const bundle = createAuditBundle('safe', {}, { includeInput: true });
  bundle.report.summary.highRiskCount = 99;
  const verification = verifyAuditBundle(bundle);
  assert.equal(verification.valid, false);
  assert.equal(verification.integrityValid, false);
});

test('reproduction requires included input text', () => {
  const bundle = createAuditBundle('safe');
  assert.throws(() => reproduceAuditBundle(bundle), /does not include input text/);
});
