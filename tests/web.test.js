import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const INDEX = fileURLToPath(new URL('../index.html', import.meta.url));

test('web workbench stays local-first with no remote scripts', async () => {
  const html = await fs.readFile(INDEX, 'utf8');
  assert.match(html, /Local only/);
  assert.match(html, /\.\/src\/workbench\.js/);
  assert.doesNotMatch(html, /<script[^>]+src=["']https?:\/\//i);
});

test('web workbench exposes primary forensic controls', async () => {
  const html = await fs.readFile(INDEX, 'utf8');
  for (const id of ['input', 'clean', 'download', 'severityFilter', 'categoryFilter', 'dropZone']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.match(html, /aria-label=/);
  assert.match(html, /keydown/);
});
