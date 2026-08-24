import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanText, scanText } from '../src/scanner.js';

test('conservative cleaning preserves Persian ZWNJ', () => {
  const text = 'می\u200Cخواهم';
  assert.equal(cleanText(text), text);
  assert.equal(scanText(text).findings.some((finding) => finding.label === 'U+200C'), true);
});

test('conservative cleaning preserves directional controls while still detecting them', () => {
  const text = `abc\u200Fאבג\u202C`;
  assert.equal(cleanText(text), text);
  const labels = scanText(text).findings.map((finding) => finding.label);
  assert.equal(labels.includes('U+200F'), true);
  assert.equal(labels.includes('U+202C'), true);
});

test('conservative cleaning preserves standardized emoji tag sequences', () => {
  const england = `🏴\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}`;
  assert.equal(cleanText(england), england);
  assert.equal(scanText(england).findings.some((finding) => finding.category === 'tag-character'), true);
});

test('aggressive cleaning can remove semantic invisible controls explicitly', () => {
  const text = `A\u200CB\u200DC\u200ED\u202EE\uFE0F\u{E0067}`;
  const cleaned = cleanText(text, {
    removeZeroWidthNonJoiner: true,
    removeZeroWidthJoiner: true,
    removeDirectionalControls: true,
    removeVariationSelectors: true,
    removeTagCharacters: true
  });
  assert.equal(cleaned, 'ABCDE');
});

test('conservative cleaning still removes common ordinary-prose artifacts', () => {
  assert.equal(cleanText(`A\u200BB\u2060C\uFEFFD\u00ADE`), 'ABCDE');
});
