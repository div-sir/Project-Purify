import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { discoverFiles, globToRegExp } from '../src/discovery.js';

test('glob conversion supports double-star and single-star patterns', () => {
  assert.equal(globToRegExp('**/*.md').test('docs/readme.md'), true);
  assert.equal(globToRegExp('src/*.js').test('src/index.js'), true);
  assert.equal(globToRegExp('src/*.js').test('src/lib/index.js'), false);
});

test('recursive discovery includes supported files and skips default excluded directories', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'purify-discovery-'));
  await fs.mkdir(path.join(root, 'docs'), { recursive: true });
  await fs.mkdir(path.join(root, 'node_modules', 'pkg'), { recursive: true });
  await fs.writeFile(path.join(root, 'root.txt'), 'ok', 'utf8');
  await fs.writeFile(path.join(root, 'docs', 'readme.md'), 'ok', 'utf8');
  await fs.writeFile(path.join(root, 'docs', 'image.bin'), 'no', 'utf8');
  await fs.writeFile(path.join(root, 'node_modules', 'pkg', 'index.js'), 'skip', 'utf8');

  const files = await discoverFiles(root);
  const relative = files.map((file) => path.relative(root, file).replaceAll(path.sep, '/'));
  assert.deepEqual(relative, ['docs/readme.md', 'root.txt']);
});

test('recursive discovery applies include and exclude patterns', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'purify-discovery-'));
  await fs.mkdir(path.join(root, 'docs', 'private'), { recursive: true });
  await fs.writeFile(path.join(root, 'docs', 'a.md'), 'a', 'utf8');
  await fs.writeFile(path.join(root, 'docs', 'private', 'b.md'), 'b', 'utf8');
  await fs.writeFile(path.join(root, 'root.txt'), 'c', 'utf8');

  const files = await discoverFiles(root, {
    include: ['**/*.md'],
    exclude: ['**/private', '**/private/**']
  });
  const relative = files.map((file) => path.relative(root, file).replaceAll(path.sep, '/'));
  assert.deepEqual(relative, ['docs/a.md']);
});
