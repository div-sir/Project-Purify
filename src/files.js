import fs from 'node:fs/promises';
import path from 'node:path';
import { buildReport } from './report.js';
import { analyzeJsonText, analyzeCsvText } from './structured.js';
import { analyzeTextFileStream } from './stream.js';

export const DEFAULT_MAX_FILE_BYTES = 5 * 1024 * 1024;
const TEXT_EXTENSIONS = new Set(['.txt', '.md', '.markdown']);
const STRUCTURED_EXTENSIONS = new Set(['.json', '.csv']);
const SOURCE_EXTENSIONS = new Set([
  '.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cc', '.cpp', '.h', '.hpp',
  '.go', '.rs', '.sh', '.bash', '.zsh', '.yml', '.yaml'
]);

export function isSupportedTextPath(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return TEXT_EXTENSIONS.has(ext) || STRUCTURED_EXTENSIONS.has(ext) || SOURCE_EXTENSIONS.has(ext);
}

function addCounts(target, source = {}) {
  for (const [key, value] of Object.entries(source)) target[key] = (target[key] ?? 0) + value;
}

function summarizeReports(reports) {
  return reports.reduce((summary, report) => {
    summary.invisibleOrControlCount += report.summary.invisibleOrControlCount;
    summary.confusableCount += report.summary.confusableCount;
    summary.highRiskCount += report.summary.highRiskCount;
    summary.changed ||= report.summary.changed;
    addCounts(summary.severityCounts, report.summary.severityCounts);
    addCounts(summary.categoryCounts, report.summary.categoryCounts);
    return summary;
  }, {
    invisibleOrControlCount: 0,
    confusableCount: 0,
    highRiskCount: 0,
    changed: false,
    severityCounts: {},
    categoryCounts: {}
  });
}

function analyzeByExtension(filePath, text, options) {
  const ext = path.extname(filePath).toLowerCase();

  if (TEXT_EXTENSIONS.has(ext)) {
    const report = buildReport(text, options.report ?? {});
    return { format: 'text', rewritePolicy: 'allowed', report, summary: report.summary };
  }

  if (ext === '.json') {
    const structured = analyzeJsonText(text, options);
    const summary = summarizeReports(structured.fields.map((field) => field.report));
    return { format: 'json', rewritePolicy: 'structured-fields-only', structured, summary };
  }

  if (ext === '.csv') {
    const structured = analyzeCsvText(text, options);
    const summary = summarizeReports(structured.fields.map((field) => field.report));
    return { format: 'csv', rewritePolicy: 'structured-fields-only', structured, summary };
  }

  if (SOURCE_EXTENSIONS.has(ext)) {
    const report = buildReport(text, options.report ?? {});
    return {
      format: 'source',
      rewritePolicy: 'detect-only',
      report,
      summary: report.summary,
      warning: 'Source-code safe mode does not authorize automatic rewriting. Review findings before changing code.'
    };
  }

  throw new Error(`Unsupported text file type: ${filePath}`);
}

async function analyzeLargeFile(filePath, stat, options) {
  const ext = path.extname(filePath).toLowerCase();
  if (STRUCTURED_EXTENSIONS.has(ext)) {
    throw new Error(`Structured file exceeds ${options.maxBytes ?? DEFAULT_MAX_FILE_BYTES} byte in-memory limit and cannot use streaming mode: ${filePath}`);
  }

  const streamed = await analyzeTextFileStream(filePath, options);
  return {
    path: filePath,
    bytes: stat.size,
    format: SOURCE_EXTENSIONS.has(ext) ? 'source' : 'text',
    ...streamed
  };
}

export async function analyzeFile(filePath, options = {}) {
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_FILE_BYTES;
  const stat = await fs.stat(filePath);

  if (!stat.isFile()) throw new Error(`Not a file: ${filePath}`);
  if (!isSupportedTextPath(filePath)) throw new Error(`Unsupported text file type: ${filePath}`);

  if (stat.size > maxBytes) {
    if (options.streamLargeFiles) return analyzeLargeFile(filePath, stat, options);
    throw new Error(`File exceeds ${maxBytes} byte limit: ${filePath}`);
  }

  const text = await fs.readFile(filePath, 'utf8');
  return {
    path: filePath,
    bytes: stat.size,
    ...analyzeByExtension(filePath, text, options)
  };
}

export async function analyzeFiles(filePaths, options = {}) {
  const results = [];
  for (const filePath of filePaths) {
    try {
      results.push({ ok: true, ...(await analyzeFile(filePath, options)) });
    } catch (error) {
      results.push({ ok: false, path: filePath, error: error.message });
      if (options.failFast) break;
    }
  }
  return results;
}
