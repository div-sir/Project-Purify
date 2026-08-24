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

test('aggressive CLI cleaning removes tag characters explicitly', () => {
  const tagged = `A\u{E0067}B`;
  const conservative = run(['--text', tagged, '--clean']);
  const aggressive = run(['--text', tagged, '--clean', '--aggressive']);
  assert.equal(conservative.status, 0, conservative.stderr);
  assert.equal(conservative.stdout, tagged);
  assert.equal(aggressive.status, 0, aggressive.stderr);
  assert.equal(aggressive.stdout, 'AB');
});

test('audit output can be self-contained and integrity protected', () => {
  const result = run(['--text', 'A\u200BB', '--audit', '--include-input']);
  assert.equal(result.status, 0, result.stderr);
  const bundle = JSON.parse(result.stdout);
  assert.equal(bundle.bundleVersion, '1.0.0');
  assert.equal(bundle.evidence.inputText, 'A\u200BB');
  assert.match(bundle.evidence.inputSha256, /^[a-f0-9]{64}$/);
  assert.match(bundle.integrity.bundleSha256, /^[a-f0-9]{64}$/);
});

test('audit refuses structured single-file input', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'purify-cli-'));
  const file = path.join(dir, 'data.json');
  await fs.writeFile(file, JSON.stringify({ value: 'A\u200BB' }), 'utf8');
  const result = run(['--file', file, '--audit']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /in-memory text\/source report/);
});

test('compare-reports produces deterministic comparison JSON', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'purify-cli-'));
  const left = path.join(dir, 'left.json');
  const right = path.join(dir, 'right.json');

  const leftResult = run(['--text', 'paypal', '--language', 'en', '--json']);
  const rightResult = run(['--text', 'pаypal', '--language', 'en', '--json']);
  assert.equal(leftResult.status, 0, leftResult.stderr);
  assert.equal(rightResult.status, 0, rightResult.stderr);
  await fs.writeFile(left, leftResult.stdout, 'utf8');
  await fs.writeFile(right, rightResult.stdout, 'utf8');

  const comparison = run(['--compare-reports', left, right]);
  assert.equal(comparison.status, 0, comparison.stderr);
  const parsed = JSON.parse(comparison.stdout);
  assert.equal(parsed.input.sameHash, false);
  assert.equal(parsed.summaryDelta.mixedScriptCount, 1);
  assert.equal(parsed.equivalent, false);
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

test('streaming human output marks mixed-script analysis as not evaluated', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'purify-cli-'));
  const file = path.join(dir, 'large.txt');
  await fs.writeFile(file, 'pаypal', 'utf8');
  const result = run(['--file', file, '--max-bytes', '2', '--stream']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Mixed-script findings: not-evaluated/);
  assert.match(result.stdout, /mixed-script token analysis is not evaluated/i);
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
