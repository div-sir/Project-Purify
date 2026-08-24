import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildReport } from '../src/report.js';
import { cleanText, scanText } from '../src/scanner.js';
import { analyzeScripts } from '../src/scripts.js';

const corpus = JSON.parse(await readFile(new URL('./fixtures/unicode-torture.json', import.meta.url), 'utf8'));

for (const entry of corpus) {
  test(`unicode torture: ${entry.name}`, () => {
    const report = buildReport(entry.text);
    assert.equal(typeof report.summary.highRiskCount, 'number');
    assert.match(report.evidenceHashes.input, /^[0-9a-f]{64}$/);
    assert.match(report.evidenceHashes.cleaned, /^[0-9a-f]{64}$/);
    assert.equal(cleanText(cleanText(entry.text)), cleanText(entry.text));
    assert.doesNotThrow(() => scanText(entry.text));
    assert.doesNotThrow(() => analyzeScripts(entry.text));
  });
}

test('torture corpus preserves shaping-sensitive defaults', () => {
  assert.equal(cleanText('👨‍👩‍👧‍👦'), '👨‍👩‍👧‍👦');
  assert.equal(cleanText('می\u200Cخواهم'), 'می\u200Cخواهم');
  assert.equal(cleanText(`abc\u2067אבג\u2069def`), `abc\u2067אבג\u2069def`);
});

test('supplementary-character offsets remain distinct', () => {
  const report = buildReport('😀\u200Bz');
  const finding = report.findings.unicode.find((item) => item.label === 'U+200B');
  assert.equal(finding.charIndex, 1);
  assert.equal(finding.utf16Index, 2);
});
