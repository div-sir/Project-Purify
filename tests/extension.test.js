import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('extension uses Manifest V3 with minimal local-analysis permissions', async () => {
  const manifest = JSON.parse(await fs.readFile(path.join(ROOT, 'extension', 'manifest.json'), 'utf8'));
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.permissions.includes('activeTab'), true);
  assert.equal(manifest.permissions.includes('scripting'), true);
  assert.equal('host_permissions' in manifest, false);
  assert.equal(manifest.background.service_worker, 'background.js');
  assert.deepEqual(manifest.background.scripts, ['background.js']);
});

test('extension source has no remote text transport API', async () => {
  const files = ['background.js', 'content.js', 'popup.js'];
  const source = (await Promise.all(files.map((name) => fs.readFile(path.join(ROOT, 'extension', name), 'utf8')))).join('\n');
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /XMLHttpRequest|WebSocket|sendBeacon/);
  assert.match(source, /globalThis\.browser \?\? globalThis\.chrome/);
});

test('popup exposes selection and visible-page scans', async () => {
  const html = await fs.readFile(path.join(ROOT, 'extension', 'popup.html'), 'utf8');
  assert.match(html, /id="selection"/);
  assert.match(html, /id="page"/);
  assert.match(html, /Local only/);
});

test('extension build copies the shared forensic core', async () => {
  const result = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'build-extension.mjs')], {
    cwd: ROOT,
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr);

  const builtWorkbench = await fs.readFile(path.join(ROOT, 'dist', 'extension', 'core', 'workbench.js'), 'utf8');
  const sourceWorkbench = await fs.readFile(path.join(ROOT, 'src', 'workbench.js'), 'utf8');
  assert.equal(builtWorkbench, sourceWorkbench);

  const builtGenerated = await fs.readFile(path.join(ROOT, 'dist', 'extension', 'core', 'generated', 'confusables-data.js'), 'utf8');
  assert.match(builtGenerated, /CONFUSABLES_METADATA/);
});
