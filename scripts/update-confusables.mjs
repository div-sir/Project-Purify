import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchUnicodeText } from './fetch-unicode.mjs';

const UNICODE_VERSION = process.env.UNICODE_VERSION ?? '17.0.0';
const SOURCE = `https://www.unicode.org/Public/${UNICODE_VERSION}/security/confusables.txt`;
const OUTPUT = new URL('../src/generated/confusables-data.js', import.meta.url);
const GENERATOR_VERSION = 1;

function parseSequence(field) {
  return field.trim().split(/\s+/).filter(Boolean).map((hex) => String.fromCodePoint(Number.parseInt(hex, 16))).join('');
}

const text = await fetchUnicodeText(SOURCE);
const sourceSha256 = createHash('sha256').update(text, 'utf8').digest('hex');
const sourceDate = text.match(/^#\s*Date:\s*(.+)$/m)?.[1]?.trim() ?? null;
const entries = [];

for (const line of text.split(/\r?\n/)) {
  const body = line.split('#', 1)[0].trim();
  if (!body) continue;
  const [sourceField, targetField] = body.split(';').map((part) => part.trim());
  if (!sourceField || !targetField) continue;
  const sourcePoints = sourceField.split(/\s+/);
  if (sourcePoints.length !== 1) continue;
  const cp = Number.parseInt(sourcePoints[0], 16);
  if (!Number.isInteger(cp) || cp < 0 || cp > 0x10FFFF) throw new Error(`Invalid confusable source code point: ${sourcePoints[0]}`);
  entries.push([cp, parseSequence(targetField)]);
}

entries.sort((a, b) => a[0] - b[0]);
const metadata = {
  unicodeVersion: UNICODE_VERSION,
  sourceUrl: SOURCE,
  sourceSha256,
  sourceDate,
  generatorVersion: GENERATOR_VERSION,
  entryCount: entries.length,
  completeness: 'full'
};

const lines = [
  '// Generated file. Do not edit by hand.',
  `// Source: ${SOURCE}`,
  `// SHA-256: ${sourceSha256}`,
  `export const CONFUSABLES_METADATA = Object.freeze(${JSON.stringify(metadata, null, 2)});`,
  'export const GENERATED_CONFUSABLES = new Map([',
  ...entries.map(([cp, target]) => `  [0x${cp.toString(16).toUpperCase()}, ${JSON.stringify(target)}],`),
  ']);',
  ''
];

await mkdir(dirname(fileURLToPath(OUTPUT)), { recursive: true });
await writeFile(OUTPUT, lines.join('\n'), 'utf8');
console.log(`Wrote ${entries.length} mappings from Unicode ${UNICODE_VERSION}.`);
console.log(`Source SHA-256: ${sourceSha256}`);
