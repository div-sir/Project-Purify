import fs from 'node:fs/promises';
import path from 'node:path';
import { isSupportedTextPath } from './files.js';

const DEFAULT_EXCLUDES = ['**/.git/**', '**/node_modules/**'];

function escapeRegex(text) {
  return text.replace(/[.+^${}()|[\]\\]/g, '\\$&');
}

export function globToRegExp(pattern) {
  const normalized = pattern.replaceAll('\\', '/');
  let source = '';
  for (let i = 0; i < normalized.length; i += 1) {
    const ch = normalized[i];
    if (ch === '*' && normalized[i + 1] === '*') {
      source += '.*';
      i += 1;
    } else if (ch === '*') {
      source += '[^/]*';
    } else if (ch === '?') {
      source += '[^/]';
    } else {
      source += escapeRegex(ch);
    }
  }
  return new RegExp(`^${source}$`);
}

function matchesAny(value, patterns) {
  return patterns.some((pattern) => globToRegExp(pattern).test(value));
}

export async function discoverFiles(root, options = {}) {
  const include = options.include ?? ['**/*'];
  const exclude = [...DEFAULT_EXCLUDES, ...(options.exclude ?? [])];
  const rootPath = path.resolve(root);
  const results = [];

  async function walk(current) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      const relative = path.relative(rootPath, absolute).replaceAll(path.sep, '/');
      const matchPath = `**/${relative}`;

      if (matchesAny(matchPath, exclude) || matchesAny(relative, exclude)) continue;
      if (entry.isDirectory()) {
        await walk(absolute);
        continue;
      }
      if (!entry.isFile() || !isSupportedTextPath(absolute)) continue;
      if (matchesAny(relative, include) || matchesAny(matchPath, include)) results.push(absolute);
    }
  }

  await walk(rootPath);
  results.sort();
  return results;
}
