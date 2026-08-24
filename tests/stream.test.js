import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { analyzeTextFileStream } from '../src/stream.js';
import { analyzeFile } from '../src/files.js';

test('streaming analysis preserves absolute positions across tiny chunks', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'purify-stream-'));
  const file = path.join(dir, 'large.txt');
  await fs.writeFile(file, 'AA\u200BBBpаypal', 'utf8');

  const result = await analyzeTextFileStream(file, { highWaterMark: 2 });
  assert.equal(result.mode, 'stream-detect-only');
  assert.equal(result.summary.invisibleOrControlCount, 1);
  assert.equal(result.summary.confusableCount >= 1, true);
  assert.equal(result.summary.mixedScriptCount, null);
  assert.equal(result.analysisCoverage.mixedScriptTokens, 'not-evaluated');
  assert.equal(result.findings.some((finding) => finding.label === 'U+200B' && finding.charIndex === 2), true);
  assert.equal(result.rewritePolicy, 'detect-only');
});

test('analyzeFile can switch oversized plain text to streaming mode', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'purify-stream-'));
  const file = path.join(dir, 'large.md');
  await fs.writeFile(file, '1234\u200B5678', 'utf8');

  const result = await analyzeFile(file, {
    maxBytes: 4,
    streamLargeFiles: true,
    highWaterMark: 3
  });
  assert.equal(result.mode, 'stream-detect-only');
  assert.equal(result.format, 'text');
  assert.equal(result.summary.invisibleOrControlCount, 1);
  assert.match(result.limitations.join(' '), /Mixed-script token analysis is not evaluated/);
});

test('oversized structured files refuse streaming mode', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'purify-stream-'));
  const file = path.join(dir, 'large.json');
  await fs.writeFile(file, JSON.stringify({ value: 'A\u200BB' }), 'utf8');

  await assert.rejects(
    () => analyzeFile(file, { maxBytes: 4, streamLargeFiles: true }),
    /cannot use streaming mode/
  );
});

test('streaming finding collection can be capped without losing counts', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'purify-stream-'));
  const file = path.join(dir, 'many.txt');
  await fs.writeFile(file, '\u200B\u200B\u200B', 'utf8');

  const result = await analyzeTextFileStream(file, { maxFindings: 1, highWaterMark: 1 });
  assert.equal(result.summary.invisibleOrControlCount, 3);
  assert.equal(result.findings.length, 1);
  assert.equal(result.findingsTruncated, true);
});
