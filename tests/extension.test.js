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

test('extension bounds page and pending selection text and clears pending storage', async () => {
  const background = await fs.readFile(path.join(ROOT, 'extension', 'background.js'), 'utf8');
  const popup = await fs.readFile(path.join(ROOT, 'extension', 'popup.js'), 'utf8');
  assert.match(background, /MAX_PENDING_TEXT\s*=\s*1024 \* 1024/);
  assert.match(background, /pendingTruncated/);
  assert.match(background, /storage\.session\.remove\(PENDING_KEYS\)/);
  assert.match(popup, /MAX_PAGE_TEXT\s*=\s*1024 \* 1024/);
  assert.match(popup, /storage\.session\.remove\(PENDING_KEYS\)/);
});

test('content inspection allowlist excludes password inputs', async () => {
  const source = await fs.readFile(path.join(ROOT, 'extension', 'content.js'), 'utf8');
  assert.match(source, /\^\(text\|search\|url\|email\|tel\)\$/i);
  assert.doesNotMatch(source, /type\s*===?\s*['"]password['"]/i);
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

  for (const name of ['workbench.js', 'scripts.js', 'hash.js', 'options.js', 'version.js', 'report.js']) {
    const built = await fs.readFile(path.join(ROOT, 'dist', 'extension', 'core', name), 'utf8');
    const source = await fs.readFile(path.join(ROOT, 'src', name), 'utf8');
    assert.equal(built, source, name);
  }

  const builtConfusables = await fs.readFile(path.join(ROOT, 'dist', 'extension', 'core', 'generated', 'confusables-data.js'), 'utf8');
  assert.match(builtConfusables, /CONFUSABLES_METADATA/);

  const builtScriptsData = await fs.readFile(path.join(ROOT, 'dist', 'extension', 'core', 'generated', 'scripts-data.js'), 'utf8');
  assert.match(builtScriptsData, /SCRIPTS_METADATA/);
});
