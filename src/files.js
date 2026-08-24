import fs from 'node:fs/promises';
import path from 'node:path';
import { buildReport } from './report.js';

export const DEFAULT_MAX_FILE_BYTES = 5 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = new Set(['.txt', '.md', '.markdown']);

export function isSupportedTextPath(filePath) {
  return SUPPORTED_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

export async function analyzeFile(filePath, options = {}) {
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_FILE_BYTES;
  const stat = await fs.stat(filePath);

  if (!stat.isFile()) throw new Error(`Not a file: ${filePath}`);
  if (!isSupportedTextPath(filePath)) throw new Error(`Unsupported text file type: ${filePath}`);
  if (stat.size > maxBytes) throw new Error(`File exceeds ${maxBytes} byte limit: ${filePath}`);

  const text = await fs.readFile(filePath, 'utf8');
  return {
    path: filePath,
    bytes: stat.size,
    report: buildReport(text, options.report ?? {})
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
