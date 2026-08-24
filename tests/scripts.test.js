import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeScripts,
  analyzeIdentifierScripts,
  scriptsInText,
  scriptOfCodePoint,
  getScriptsMetadata,
  validateLanguageHint
} from '../src/scripts.js';
import { buildReport, REPORT_SCHEMA_VERSION } from '../src/report.js';

test('classifies common scripts from pinned runtime metadata', () => {
  assert.equal(scriptOfCodePoint('A'.codePointAt(0)), 'Latin');
  assert.equal(scriptOfCodePoint('а'.codePointAt(0)), 'Cyrillic');
  assert.equal(scriptOfCodePoint('日'.codePointAt(0)), 'Han');
  assert.deepEqual(scriptsInText('pаypal'), ['Cyrillic', 'Latin']);
});

test('flags Latin and Cyrillic inside one token as high risk', () => {
  const analysis = analyzeScripts('pаypal');
  assert.equal(analysis.findings.length, 1);
  assert.equal(analysis.findings[0].severity, 'high');
  assert.deepEqual(analysis.findings[0].scripts, ['Cyrillic', 'Latin']);
  assert.match(analysis.findings[0].riskyPairs.join(','), /Latin\+Cyrillic/);
});

test('does not flag ordinary Traditional Chinese plus Latin text', () => {
  const analysis = analyzeScripts('AI生成文字測試', { languageHint: 'zh-Hant' });
  assert.equal(analysis.findings.length, 0);
});

test('does not flag ordinary Japanese script combinations', () => {
  const analysis = analyzeScripts('AI生成テスト日本語', { languageHint: 'ja' });
  assert.equal(analysis.findings.length, 0);
});

test('identifier profile catches deceptive mixed-script identifiers', () => {
  const analysis = analyzeIdentifierScripts('const pаypal = 1;');
  assert.equal(analysis.profile, 'identifier');
  assert.equal(analysis.findings.length, 1);
  assert.equal(analysis.findings[0].token, 'pаypal');
  assert.equal(analysis.findings[0].severity, 'high');
});

test('strict English identifier profile reports unexpected non-risky script mixing', () => {
  const analysis = analyzeIdentifierScripts('abcאבג', { languageHint: 'en' });
  assert.equal(analysis.findings.length, 1);
  assert.equal(analysis.findings[0].severity, 'low');
});

test('rejects unsupported language hints', () => {
  assert.throws(() => validateLanguageHint('xx-invalid'), /Unsupported language hint/);
});

test('exposes script-data provenance in reports', () => {
  const metadata = getScriptsMetadata();
  assert.equal(metadata.unicodeVersion, '17.0.0');
  assert.ok(['fallback', 'full'].includes(metadata.completeness));

  const report = buildReport('pаypal');
  assert.equal(report.schemaVersion, REPORT_SCHEMA_VERSION);
  assert.equal(report.schemaVersion, '1.4.0');
  assert.equal(report.summary.mixedScriptCount, 1);
  assert.equal(report.findings.mixedScripts.length, 1);
  assert.equal(report.dataProvenance.scripts.unicodeVersion, '17.0.0');
});
