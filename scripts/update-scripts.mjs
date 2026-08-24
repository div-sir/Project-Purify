import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const UNICODE_VERSION = process.env.UNICODE_VERSION ?? '17.0.0';
const SOURCE = `https://www.unicode.org/Public/${UNICODE_VERSION}/ucd/Scripts.txt`;
const OUTPUT = new URL('../src/generated/scripts-data.js', import.meta.url);

function parseRange(field) {
  const [startHex, endHex = startHex] = field.trim().split('..');
  return [Number.parseInt(startHex, 16), Number.parseInt(endHex, 16)];
}

const response = await fetch(SOURCE);
if (!response.ok) throw new Error(`Failed to fetch ${SOURCE}: ${response.status}`);
const text = await response.text();
const sourceSha256 = createHash('sha256').update(text, 'utf8').digest('hex');
const ranges = [];

for (const line of text.split(/\r?\n/)) {
  const body = line.split('#', 1)[0].trim();
  if (!body) continue;
  const [rangeField, scriptField] = body.split(';').map((part) => part.trim());
  if (!rangeField || !scriptField) continue;
  const [start, end] = parseRange(rangeField);
  ranges.push([start, end, scriptField]);
}

ranges.sort((a, b) => a[0] - b[0]);
const merged = [];
for (const range of ranges) {
  const previous = merged.at(-1);
  if (previous && previous[2] === range[2] && previous[1] + 1 === range[0]) previous[1] = range[1];
  else merged.push([...range]);
}

const sourceDate = text.match(/^#\s*Date:\s*(.+)$/m)?.[1]?.trim() ?? null;
const metadata = {
  unicodeVersion: UNICODE_VERSION,
  sourceUrl: SOURCE,
  sourceSha256,
  sourceDate,
  generatedAt: new Date().toISOString(),
  rangeCount: merged.length,
  completeness: 'full'
};

const lines = [
  '// Generated file. Do not edit by hand.',
  `// Source: ${SOURCE}`,
  `export const SCRIPTS_METADATA = Object.freeze(${JSON.stringify(metadata, null, 2)});`,
  'export const SCRIPT_RANGES = Object.freeze([',
  ...merged.map(([start, end, script]) => `  [0x${start.toString(16).toUpperCase()}, 0x${end.toString(16).toUpperCase()}, ${JSON.stringify(script)}],`),
  ']);',
  ''
];

await mkdir(dirname(fileURLToPath(OUTPUT)), { recursive: true });
await writeFile(OUTPUT, lines.join('\n'), 'utf8');
console.log(`Wrote ${merged.length} script ranges to ${OUTPUT.pathname}`);
