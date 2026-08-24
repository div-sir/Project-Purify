import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const workbench = await fs.readFile(new URL('../index.html', import.meta.url), 'utf8');
const popup = await fs.readFile(new URL('../extension/popup.html', import.meta.url), 'utf8');

test('Workbench keeps keyboard and live-region accessibility hooks', () => {
  assert.match(workbench, /<html[^>]+lang=/i);
  assert.match(workbench, /:focus-visible/);
  assert.match(workbench, /id="dropZone"[^>]+tabindex="0"[^>]+role="button"/);
  assert.match(workbench, /dropZone\.addEventListener\('keydown'/);
  assert.match(workbench, /aria-live="polite"/);
  assert.match(workbench, /<th>/);
  assert.match(workbench, /<button\b/);
  assert.match(workbench, /<select\b/);
});

test('Extension popup exposes labeled controls and visible local-only status', () => {
  assert.match(popup, /Local only/);
  assert.match(popup, /textarea[^>]+aria-label=/);
  assert.match(popup, /id="status"[^>]+aria-live="polite"/);
  assert.match(popup, /<button\b/);
  assert.match(popup, /:focus-visible/);
});
