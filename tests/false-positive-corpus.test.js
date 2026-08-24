import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { analyzeScripts, analyzeIdentifierScripts } from '../src/scripts.js';

const FIXTURE = fileURLToPath(new URL('./fixtures/multilingual-prose.json', import.meta.url));

test('ordinary multilingual prose corpus has no mixed-script findings', async () => {
  const cases = JSON.parse(await fs.readFile(FIXTURE, 'utf8'));
  for (const item of cases) {
    const analysis = analyzeScripts(item.text, { languageHint: item.languageHint });
    assert.equal(
      analysis.findings.length,
      0,
      `${item.languageHint}: ${JSON.stringify(item.text)} produced ${JSON.stringify(analysis.findings)}`
    );
  }
});

test('language-aware identifier policy preserves common CJK plus Latin identifiers', () => {
  assert.equal(analyzeIdentifierScripts('使用者ID', { languageHint: 'zh-Hant' }).findings.length, 0);
  assert.equal(analyzeIdentifierScripts('ユーザーID', { languageHint: 'ja' }).findings.length, 0);
  assert.equal(analyzeIdentifierScripts('사용자ID', { languageHint: 'ko' }).findings.length, 0);
});

test('security-sensitive lookalike tokens remain reportable across language profiles', () => {
  for (const languageHint of ['auto', 'en', 'zh-Hant', 'ja', 'ko', 'ar']) {
    const analysis = analyzeScripts('pаypal', { languageHint });
    assert.equal(analysis.findings.length, 1, languageHint);
    assert.equal(analysis.findings[0].severity, 'high', languageHint);
  }
});
