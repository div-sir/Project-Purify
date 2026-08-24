import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { scanText } from './scanner.js';
import { detectConfusables } from './confusables.js';

export const DEFAULT_STREAM_MAX_BYTES = 256 * 1024 * 1024;
export const DEFAULT_STREAM_MAX_FINDINGS = 10000;

function addCount(target, key, amount = 1) {
  target[key] = (target[key] ?? 0) + amount;
}

export async function analyzeTextFileStream(filePath, options = {}) {
  const maxBytes = options.maxStreamBytes ?? DEFAULT_STREAM_MAX_BYTES;
  const maxFindings = options.maxFindings ?? DEFAULT_STREAM_MAX_FINDINGS;
  const highWaterMark = options.highWaterMark ?? 64 * 1024;
  const stat = await fsp.stat(filePath);

  if (!stat.isFile()) throw new Error(`Not a file: ${filePath}`);
  if (stat.size > maxBytes) throw new Error(`File exceeds ${maxBytes} byte streaming limit: ${filePath}`);

  const findings = [];
  const severityCounts = {};
  const categoryCounts = {};
  let utf16Base = 0;
  let charBase = 0;
  let totalUnicode = 0;
  let totalConfusables = 0;
  let highRiskCount = 0;
  let findingsTruncated = false;

  const stream = fs.createReadStream(filePath, { encoding: 'utf8', highWaterMark });
  for await (const chunk of stream) {
    const unicode = scanText(chunk);
    const confusables = detectConfusables(chunk);

    totalUnicode += unicode.count;
    totalConfusables += confusables.length;
    highRiskCount += unicode.highRiskCount;

    for (const finding of unicode.findings) {
      addCount(severityCounts, finding.severity);
      addCount(categoryCounts, finding.category);
      if (findings.length < maxFindings) {
        findings.push({
          ...finding,
          id: `unicode:${finding.label}:${finding.charIndex + charBase}`,
          utf16Index: finding.utf16Index + utf16Base,
          charIndex: finding.charIndex + charBase
        });
      } else {
        findingsTruncated = true;
      }
    }

    for (const finding of confusables) {
      addCount(severityCounts, finding.severity);
      addCount(categoryCounts, 'confusable');
      if (findings.length < maxFindings) {
        findings.push({
          ...finding,
          id: `confusable:${finding.label}:${finding.charIndex + charBase}`,
          utf16Index: finding.utf16Index + utf16Base,
          charIndex: finding.charIndex + charBase
        });
      } else {
        findingsTruncated = true;
      }
    }

    utf16Base += chunk.length;
    charBase += [...chunk].length;
  }

  return {
    mode: 'stream-detect-only',
    path: filePath,
    bytes: stat.size,
    rewritePolicy: 'detect-only',
    analysisCoverage: {
      unicodeControls: 'full',
      confusables: 'full',
      mixedScriptTokens: 'not-evaluated'
    },
    summary: {
      invisibleOrControlCount: totalUnicode,
      confusableCount: totalConfusables,
      mixedScriptCount: null,
      highRiskCount,
      changed: false,
      severityCounts,
      categoryCounts
    },
    findings,
    findingsTruncated,
    limitations: [
      'Streaming mode is detect-only and does not produce cleaned output.',
      'Finding context is limited to the stream chunk that contained the character.',
      'Mixed-script token analysis is not evaluated in streaming mode because token boundaries can span chunks.',
      'Structured JSON and CSV files are not streamed because field boundaries can span chunks.'
    ]
  };
}
