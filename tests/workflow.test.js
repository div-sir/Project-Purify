import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const WORKFLOW = fileURLToPath(new URL('../.github/workflows/purify-reusable.yml', import.meta.url));

test('reusable workflow exposes workflow_call and Project Purify policy inputs', async () => {
  const yaml = await fs.readFile(WORKFLOW, 'utf8');
  assert.match(yaml, /workflow_call:/);
  assert.match(yaml, /severity:/);
  assert.match(yaml, /upload-sarif:/);
  assert.match(yaml, /purify-ref:/);
});

test('reusable workflow produces SARIF before enforcing the exit policy', async () => {
  const yaml = await fs.readFile(WORKFLOW, 'utf8');
  assert.match(yaml, /--sarif/);
  assert.match(yaml, /actions\/upload-artifact@v4/);
  assert.match(yaml, /github\/codeql-action\/upload-sarif@v4/);
  assert.match(yaml, /steps\.purify\.outputs\.status/);
});

test('reusable workflow excludes its own checkout from repository scan', async () => {
  const yaml = await fs.readFile(WORKFLOW, 'utf8');
  assert.match(yaml, /\.project-purify/);
  assert.match(yaml, /--exclude/);
});
