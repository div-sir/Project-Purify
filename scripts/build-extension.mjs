import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(ROOT, 'extension');
const OUTPUT = path.join(ROOT, 'dist', 'extension');
const CORE_OUTPUT = path.join(OUTPUT, 'core');
const GENERATED_OUTPUT = path.join(CORE_OUTPUT, 'generated');

const CORE_FILES = [
  'scanner.js',
  'confusables.js',
  'scripts.js',
  'hash.js',
  'options.js',
  'version.js',
  'report.js',
  'workbench.js'
];

const GENERATED_FILES = [
  'confusables-data.js',
  'scripts-data.js'
];

await fs.rm(OUTPUT, { recursive: true, force: true });
await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
await fs.cp(SOURCE, OUTPUT, { recursive: true });
await fs.mkdir(GENERATED_OUTPUT, { recursive: true });

for (const name of CORE_FILES) {
  await fs.copyFile(path.join(ROOT, 'src', name), path.join(CORE_OUTPUT, name));
}
for (const name of GENERATED_FILES) {
  await fs.copyFile(
    path.join(ROOT, 'src', 'generated', name),
    path.join(GENERATED_OUTPUT, name)
  );
}

const manifest = JSON.parse(await fs.readFile(path.join(OUTPUT, 'manifest.json'), 'utf8'));
if (manifest.manifest_version !== 3) throw new Error('Extension manifest must use Manifest V3.');

console.log(`Built Project Purify extension ${manifest.version} at ${OUTPUT}`);
