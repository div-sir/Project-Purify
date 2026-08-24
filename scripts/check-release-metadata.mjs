import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROJECT_PURIFY_VERSION } from '../src/version.js';
import { REPORT_SCHEMA_VERSION } from '../src/report.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const releaseMode = process.argv.includes('--release');

const [packageText, readme, schemaDoc] = await Promise.all([
  fs.readFile(path.join(ROOT, 'package.json'), 'utf8'),
  fs.readFile(path.join(ROOT, 'README.md'), 'utf8'),
  fs.readFile(path.join(ROOT, 'docs', 'REPORT-SCHEMA.md'), 'utf8')
]);

const pkg = JSON.parse(packageText);
const errors = [];

function requireCondition(condition, message) {
  if (!condition) errors.push(message);
}

const documentedVersion = readme.includes(`\`${PROJECT_PURIFY_VERSION}\``)
  || readme.includes(`\`v${PROJECT_PURIFY_VERSION}\``);

requireCondition(pkg.version === PROJECT_PURIFY_VERSION,
  `package.json version ${pkg.version} does not match src/version.js ${PROJECT_PURIFY_VERSION}.`);
requireCondition(documentedVersion,
  `README.md does not mention current version ${PROJECT_PURIFY_VERSION} (with optional v prefix).`);
requireCondition(readme.includes(`schema \`${REPORT_SCHEMA_VERSION}\``),
  `README.md does not mention report schema ${REPORT_SCHEMA_VERSION}.`);
requireCondition(schemaDoc.includes(`Current schema version: \`${REPORT_SCHEMA_VERSION}\``),
  `docs/REPORT-SCHEMA.md does not declare current schema ${REPORT_SCHEMA_VERSION}.`);

if (releaseMode) {
  requireCondition(pkg.private === false, 'Release mode requires package.json private=false.');
  requireCondition(!PROJECT_PURIFY_VERSION.includes('-dev'), 'Release mode requires a non-dev version.');
} else {
  requireCondition(pkg.private === true, 'Development mode expects package.json private=true until release approval.');
}

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exit(1);
}

console.log(JSON.stringify({
  version: PROJECT_PURIFY_VERSION,
  reportSchemaVersion: REPORT_SCHEMA_VERSION,
  packagePrivate: pkg.private,
  mode: releaseMode ? 'release' : 'development',
  valid: true
}, null, 2));
