import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const CLI = fileURLToPath(new URL('../src/cli.js', import.meta.url));

function run(args) {
  return spawnSync(process.execPath, [CLI, ...args], {
    encoding: 'utf8',
    env: { ...process.env }
  });
}

test('fail-on-severity returns exit code 3 when threshold is met', () => {
  const result = run(['--text', 'A\u200BB', '--fail-on-severity', 'high', '--dry-run']);
  assert.equal(result.status, 3);
  assert.match(result.stdout, /High-risk findings: 1/);
});

test('dry-run suppresses cleaned payload in human output', () => {
  const result = run(['--text', 'A\u200BB', '--dry-run']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Dry run: no cleaned payload emitted/);
  assert.doesNotMatch(result.stdout, /Cleaned text:/);
});

test('language hint is exposed in human output', () => {
  const result = run(['--text', 'AI生成文字', '--language', 'zh-Hant', '--dry-run']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Language hint: zh-Hant/);
  assert.match(result.stdout, /Mixed-script findings: 0/);
});

test('unsupported language hint is rejected', () => {
  const result = run(['--text', 'safe', '--language', 'xx-invalid']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unsupported language hint/);
});

test('mixed-script spoof can trigger severity policy', () => {
  const result = run(['--text', 'pаypal', '--language', 'en', '--fail-on-severity', 'high', '--dry-run']);
  assert.equal(result.status, 3, result.stderr);
  assert.match(result.stdout, /Mixed-script findings: 1/);
});

test('directory mode discovers nested supported files', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'purify-cli-'));
  const nested = path.join(dir, 'nested');
  await fs.mkdir(nested);
  await fs.writeFile(path.join(dir, 'README.md'), 'A\u200BB', 'utf8');
  await fs.writeFile(path.join(nested, 'index.js'), 'const x = "safe";', 'utf8');
  await fs.writeFile(path.join(nested, 'skip.bin'), 'ignored', 'utf8');

  const result = run(['--dir', dir, '--json']);
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.length, 2);
  assert.equal(parsed.every((item) => item.ok), true);
});

test('clean output is refused for detect-only source files', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'purify-cli-'));
  const file = path.join(dir, 'index.js');
  await fs.writeFile(file, 'const x = "A\u200BB";', 'utf8');

  const result = run(['--file', file, '--clean']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /detect-only input/);
});

test('SARIF output is machine-readable and preserves severity exit code', () => {
  const result = run(['--text', 'A\u200BB', '--sarif', '--fail-on-severity', 'high']);
  assert.equal(result.status, 3, result.stderr);
  const sarif = JSON.parse(result.stdout);
  assert.equal(sarif.version, '2.1.0');
  assert.equal(sarif.runs[0].results.length, 1);
  assert.equal(sarif.runs[0].results[0].level, 'error');
});

test('directory SARIF contains findings from discovered files', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'purify-cli-'));
  const file = path.join(dir, 'README.md');
  await fs.writeFile(file, 'A\u200BB', 'utf8');

  const result = run(['--dir', dir, '--sarif']);
  assert.equal(result.status, 0, result.stderr);
  const sarif = JSON.parse(result.stdout);
  assert.equal(sarif.runs[0].results.length, 1);
  assert.equal(sarif.runs[0].results[0].locations[0].physicalLocation.artifactLocation.uri, file);
});
