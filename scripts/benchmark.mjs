import { performance } from 'node:perf_hooks';
import { buildReport } from '../src/report.js';

const ASSERT = process.argv.includes('--assert');

const CASES = [
  {
    name: 'plain-100k',
    text: 'Project Purify normal multilingual text AI生成テスト. '.repeat(2200).slice(0, 100_000),
    iterations: 3,
    budgetMs: 2_500
  },
  {
    name: 'findings-100k',
    text: 'alpha\u200Bbeta pаypal אבג العربية 日本語 한국어 '.repeat(2600).slice(0, 100_000),
    iterations: 3,
    budgetMs: 3_500
  },
  {
    name: 'plain-1m',
    text: 'Unicode local forensic analysis. '.repeat(40_000).slice(0, 1_000_000),
    iterations: 1,
    budgetMs: 12_000
  }
];

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function runCase(entry) {
  buildReport(entry.text);
  const samples = [];
  let lastReport;
  for (let i = 0; i < entry.iterations; i += 1) {
    const start = performance.now();
    lastReport = buildReport(entry.text);
    samples.push(performance.now() - start);
  }
  const medianMs = median(samples);
  return {
    name: entry.name,
    bytes: Buffer.byteLength(entry.text, 'utf8'),
    utf16Length: entry.text.length,
    iterations: entry.iterations,
    medianMs: Number(medianMs.toFixed(2)),
    throughputMiBPerSecond: Number(((Buffer.byteLength(entry.text, 'utf8') / 1024 / 1024) / (medianMs / 1000)).toFixed(2)),
    findings: {
      unicode: lastReport.summary.invisibleOrControlCount,
      confusables: lastReport.summary.confusableCount,
      mixedScripts: lastReport.summary.mixedScriptCount
    },
    budgetMs: entry.budgetMs,
    withinBudget: medianMs <= entry.budgetMs
  };
}

const results = CASES.map(runCase);
console.log(JSON.stringify({
  benchmarkVersion: 1,
  node: process.version,
  platform: process.platform,
  arch: process.arch,
  results
}, null, 2));

if (ASSERT && results.some((result) => !result.withinBudget)) process.exitCode = 1;
