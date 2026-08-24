import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { analyzeFile, analyzeFiles, isSupportedTextPath } from '../src/files.js';

test('supports text, structured, and source extensions', () => {
  assert.equal(isSupportedTextPath('a.txt'), true);
  assert.equal(isSupportedTextPath('README.md'), true);
  assert.equal(isSupportedTextPath('notes.markdown'), true);
  assert.equal(isSupportedTextPath('data.json'), true);
  assert.equal(isSupportedTextPath('data.csv'), true);
  assert.equal(isSupportedTextPath('index.js'), true);
  assert.equal(isSupportedTextPath('image.bin'), false);
});

test('analyzes a UTF-8 text file', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'purify-'));
  const file = path.join(dir, 'sample.txt');
  await fs.writeFile(file, 'A\u200BB', 'utf8');
  const result = await analyzeFile(file);
  assert.equal(result.report.summary.invisibleOrControlCount, 1);
  assert.equal(result.report.transformations.cleanedText, 'AB');
  assert.equal(result.rewritePolicy, 'allowed');
});

test('JSON files use structured-fields-only policy', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'purify-'));
  const file = path.join(dir, 'data.json');
  await fs.writeFile(file, JSON.stringify({ value: 'A\u200BB', count: 2 }), 'utf8');
  const result = await analyzeFile(file);
  assert.equal(result.format, 'json');
  assert.equal(result.rewritePolicy, 'structured-fields-only');
  assert.equal(result.summary.invisibleOrControlCount, 1);
  assert.equal(result.structured.cleanedValue.count, 2);
});

test('source files are detect-only', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'purify-'));
  const file = path.join(dir, 'index.js');
  await fs.writeFile(file, 'const token = "A\u200BB";', 'utf8');
  const result = await analyzeFile(file);
  assert.equal(result.format, 'source');
  assert.equal(result.rewritePolicy, 'detect-only');
  assert.equal(result.summary.invisibleOrControlCount, 1);
  assert.match(result.warning, /does not authorize automatic rewriting/);
});

test('batch analysis isolates unsupported-file errors', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'purify-'));
  const good = path.join(dir, 'good.md');
  const bad = path.join(dir, 'bad.bin');
  await fs.writeFile(good, 'hello', 'utf8');
  await fs.writeFile(bad, 'binary-ish', 'utf8');
  const results = await analyzeFiles([good, bad]);
  assert.equal(results.length, 2);
  assert.equal(results[0].ok, true);
  assert.equal(results[1].ok, false);
  assert.match(results[1].error, /Unsupported text file type/);
});

test('enforces configurable size limits', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'purify-'));
  const file = path.join(dir, 'large.txt');
  await fs.writeFile(file, '12345', 'utf8');
  await assert.rejects(() => analyzeFile(file, { maxBytes: 4 }), /exceeds 4 byte limit/);
});
