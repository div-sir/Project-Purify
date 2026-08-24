import { writeFile } from 'node:fs/promises';

const UNICODE_VERSION = process.env.UNICODE_VERSION ?? '17.0.0';
const SOURCE = `https://www.unicode.org/Public/${UNICODE_VERSION}/security/confusables.txt`;
const OUTPUT = new URL('../src/generated/confusables-data.js', import.meta.url);

function parseSequence(field) {
  return field.trim().split(/\s+/).filter(Boolean).map((hex) => String.fromCodePoint(Number.parseInt(hex, 16))).join('');
}

const response = await fetch(SOURCE);
if (!response.ok) throw new Error(`Failed to fetch ${SOURCE}: ${response.status}`);
const text = await response.text();
const entries = [];

for (const line of text.split(/\r?\n/)) {
  const body = line.split('#', 1)[0].trim();
  if (!body) continue;
  const [sourceField, targetField] = body.split(';').map((part) => part.trim());
  if (!sourceField || !targetField) continue;
  const sourcePoints = sourceField.split(/\s+/);
  if (sourcePoints.length !== 1) continue;
  const cp = Number.parseInt(sourcePoints[0], 16);
  entries.push([cp, parseSequence(targetField)]);
}

entries.sort((a, b) => a[0] - b[0]);
const lines = [
  '// Generated file. Do not edit by hand.',
  `// Source: ${SOURCE}`,
  `export const CONFUSABLES_UNICODE_VERSION = ${JSON.stringify(UNICODE_VERSION)};`,
  'export const GENERATED_CONFUSABLES = new Map([',
  ...entries.map(([cp, target]) => `  [0x${cp.toString(16).toUpperCase()}, ${JSON.stringify(target)}],`),
  ']);',
  ''
];

await writeFile(OUTPUT, lines.join('\n'), 'utf8');
console.log(`Wrote ${entries.length} mappings to ${OUTPUT.pathname}`);
