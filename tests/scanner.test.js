import test from 'node:test';
import assert from 'node:assert/strict';
import { scanText, cleanText, visualizeText } from '../src/scanner.js';

test('detects zero width space and bidi control', () => {
  const text = `a\u200Bb\u202Ec`;
  const result = scanText(text);
  assert.equal(result.count, 2);
  assert.equal(result.highRiskCount, 2);
  assert.deepEqual(result.findings.map((f) => f.label), ['U+200B', 'U+202E']);
});

test('removes suspicious controls', () => {
  const text = `A\u200BB\u2060C\uFEFFD`;
  assert.equal(cleanText(text), 'ABCD');
});

test('keeps zero width joiner by default for emoji shaping', () => {
  const family = '👨‍👩‍👧‍👦';
  assert.equal(cleanText(family), family);
});

test('can remove zero width joiner in aggressive mode', () => {
  const text = `A\u200DB`;
  assert.equal(cleanText(text, { removeZeroWidthJoiner: true }), 'AB');
});

test('visualizes hidden characters', () => {
  assert.match(visualizeText(`x\u200By`), /U\+200B/);
});
