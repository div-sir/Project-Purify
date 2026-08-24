import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { analyzeFile, analyzeFiles, isSupportedTextPath } from '../src/files.js';

test('supports plain text and Markdown extensions', () => {
  assert.equal(isSupportedTextPath('a.txt'), true);
  assert.equal(isSupportedTextPath('README.md'), true);
  assert.equal(isSupportedTextPath('notes.markdown'), true);
  assert.equal(isSupportedTextPath('data.json'), false);
});

test('analyzes a UTF-8 text file', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'purify-'));
  const file = path.join(dir, 'sample.txt');
  await fs.writeFile(file, 'A\u200BB', 'utf8');
  const result = await analyzeFile(file);
  assert.equal(result.report.summary.invisibleOrControlCount, 1);
  assert.equal(result.report.transformations.cleanedText, 'AB');
});

test('batch analysis isolates unsupported-file errors', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'purify-'));
  const good = path.join(dir, 'good.md');
  const bad = path.join(dir, 'bad.json');
  await fs.writeFile(good, 'hello', 'utf8');
  await fs.writeFile(bad, '{}', 'utf8');
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
