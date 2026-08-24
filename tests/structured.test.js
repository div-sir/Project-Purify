import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeJsonText, analyzeCsvText, parseCsv } from '../src/structured.js';

test('JSON analysis scans string values without changing non-string values', () => {
  const input = JSON.stringify({ name: 'A\u200BB', count: 3, nested: ['pаypal', true] });
  const result = analyzeJsonText(input);
  assert.equal(result.fieldsAnalyzed, 2);
  assert.equal(result.fields[0].path, '$.name');
  assert.equal(result.cleanedValue.name, 'AB');
  assert.equal(result.cleanedValue.count, 3);
  assert.equal(result.cleanedValue.nested[1], true);
  assert.equal(result.fields[1].report.summary.confusableCount, 1);
});

test('CSV parser preserves commas and escaped quotes in quoted fields', () => {
  const rows = parseCsv('name,note\n"Alice, A.","said ""hi"""');
  assert.deepEqual(rows, [['name', 'note'], ['Alice, A.', 'said "hi"']]);
});

test('CSV analysis cleans individual fields and returns valid serialized CSV', () => {
  const result = analyzeCsvText('name,note\nAlice,"A\u200BB"');
  assert.equal(result.rows, 2);
  assert.equal(result.fieldsAnalyzed, 4);
  assert.equal(result.cleanedRows[1][1], 'AB');
  assert.equal(result.cleanedText, 'name,note\nAlice,AB');
});

test('CSV parser rejects unterminated quoted fields', () => {
  assert.throws(() => parseCsv('a,"broken'), /Unterminated quoted CSV field/);
});
