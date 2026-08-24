import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReport } from '../src/report.js';
import { reportFailsSeverity, severityAtLeast, validateSeverity } from '../src/policy.js';

test('orders severity thresholds', () => {
  assert.equal(severityAtLeast('high', 'medium'), true);
  assert.equal(severityAtLeast('medium', 'high'), false);
  assert.equal(severityAtLeast('low', 'low'), true);
});

test('fails when report meets configured severity threshold', () => {
  const high = buildReport('A\u200BB');
  assert.equal(reportFailsSeverity(high, 'high'), true);
  assert.equal(reportFailsSeverity(high, 'medium'), true);

  const clean = buildReport('plain text');
  assert.equal(reportFailsSeverity(clean, 'low'), false);
});

test('rejects unknown severity names', () => {
  assert.throws(() => validateSeverity('critical'), /low, medium, or high/);
});
