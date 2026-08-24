#!/usr/bin/env node

import fs from 'node:fs/promises';
import process from 'node:process';
import { buildReport } from './report.js';
import { analyzeFile, analyzeFiles, DEFAULT_MAX_FILE_BYTES } from './files.js';
import { discoverFiles } from './discovery.js';
import { reportFailsSeverity, resultFailsSeverity, validateSeverity } from './policy.js';
import { reportToSarif, fileResultToSarif, batchResultsToSarif } from './sarif.js';
import { validateLanguageHint, VALID_LANGUAGE_HINTS } from './scripts.js';
import { createAuditBundle } from './evidence.js';
import { compareReports } from './compare.js';

function usage() {
  return `Project Purify CLI\n\nUsage:\n  project-purify --text "text" [--json | --sarif | --audit]\n  project-purify --file path/to/file.txt [--json | --sarif | --audit]\n  project-purify --batch a.txt b.md data.json [--json | --jsonl | --sarif]\n  project-purify --dir . [--include "**/*.js"] [--exclude "**/dist/**"] [--sarif]\n  project-purify --compare-reports before.json after.json\n  cat file.txt | project-purify [--json | --sarif | --audit]\n\nOptions:\n  --text <text>              Analyze literal text.\n  --file <path>              Analyze one supported UTF-8 file.\n  --batch <paths...>         Analyze multiple supported files.\n  --dir <path>               Discover and analyze supported files recursively.\n  --compare-reports <a> <b> Compare two Project Purify report JSON files.\n  --include <glob>           Directory include glob. Repeat as needed.\n  --exclude <glob>           Directory exclude glob. Repeat as needed.\n  --language <hint>          Script policy hint: ${VALID_LANGUAGE_HINTS.join(', ')}.\n  --json                     Print complete JSON output.\n  --jsonl                    Print one JSON object per batch input line.\n  --sarif                    Print SARIF 2.1.0 for code-scanning integrations.\n  --audit                    Print a reproducible single-input audit bundle.\n  --include-input            Include original text in --audit for self-contained reproduction.\n  --clean                    Print only safe cleaned text for a single rewritable input.\n  --aggressive               Also remove ZWJ and variation selectors.\n  --dry-run                  Report changes without printing cleaned payloads.\n  --fail-on-severity <level> Exit 3 when low, medium, or high threshold is met.\n  --max-bytes <bytes>        In-memory per-file limit. Default: ${DEFAULT_MAX_FILE_BYTES}.\n  --stream                   Use detect-only streaming when plain/source files exceed --max-bytes.\n  --help                     Show this help.\n`;
}

function getValue(args, name) {
  const index = args.indexOf(name);
  if (index === -1) return null;
  return args[index + 1] ?? null;
}

function getRepeatedValues(args, name) {
  const values = [];
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === name && args[i + 1] !== undefined) values.push(args[i + 1]);
  }
  return values;
}

function getMultiValues(args, name) {
  const index = args.indexOf(name);
  if (index === -1) return null;
  const values = [];
  for (let i = index + 1; i < args.length && !args[i].startsWith('--'); i += 1) values.push(args[i]);
  return values;
}

function getPositiveInteger(args, name, fallback) {
  const raw = getValue(args, name);
  if (raw === null) return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${name} requires a positive integer.`);
  return value;
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

function cleanOptions(aggressive) {
  return {
    removeZeroWidthJoiner: aggressive,
    removeVariationSelectors: aggressive
  };
}

function reportOptions(options) {
  return {
    clean: cleanOptions(options.aggressive),
    scripts: {
      languageHint: options.languageHint
    }
  };
}

function cleanedFilePayload(result) {
  if (result.rewritePolicy === 'detect-only') {
    throw new Error(`Clean output is unavailable for detect-only input: ${result.path}`);
  }
  if (result.format === 'text') return result.report.transformations.cleanedText;
  if (result.format === 'json') return `${JSON.stringify(result.structured.cleanedValue, null, 2)}\n`;
  if (result.format === 'csv') return result.structured.cleanedText;
  throw new Error(`Clean output is unavailable for format: ${result.format}`);
}

function applySeverityExit(failed) {
  if (failed && !process.exitCode) process.exitCode = 3;
}

function printBatchHuman(results, dryRun) {
  for (const result of results) {
    if (!result.ok) {
      process.stdout.write(`ERROR ${result.path}: ${result.error}\n`);
      continue;
    }
    const { summary } = result;
    const stream = result.mode === 'stream-detect-only' ? ' stream=yes' : '';
    const dry = dryRun ? ' dryRun=yes' : '';
    process.stdout.write(`${result.path}: format=${result.format} controls=${summary.invisibleOrControlCount} confusables=${summary.confusableCount} mixedScripts=${summary.mixedScriptCount ?? 0} changed=${summary.changed ? 'yes' : 'no'} policy=${result.rewritePolicy}${stream}${dry}\n`);
  }
}

async function compareReportFiles(paths) {
  if (paths.length !== 2) throw new Error('--compare-reports requires exactly two report JSON paths.');
  const [leftText, rightText] = await Promise.all(paths.map((filePath) => fs.readFile(filePath, 'utf8')));
  const comparison = compareReports(JSON.parse(leftText), JSON.parse(rightText));
  process.stdout.write(`${JSON.stringify(comparison, null, 2)}\n`);
}

async function runBatch(paths, args, options) {
  if (paths.length === 0) throw new Error('Batch analysis requires at least one path.');
  if (args.includes('--clean')) throw new Error('--clean is only available for single-input mode.');
  if (args.includes('--audit')) throw new Error('--audit is only available for a single raw-text/source report.');

  const results = await analyzeFiles(paths, {
    report: reportOptions(options),
    maxBytes: options.maxBytes,
    streamLargeFiles: options.streamLargeFiles
  });

  if (args.includes('--sarif')) {
    process.stdout.write(`${JSON.stringify(batchResultsToSarif(results), null, 2)}\n`);
  } else if (args.includes('--jsonl')) {
    for (const result of results) process.stdout.write(`${JSON.stringify(result)}\n`);
  } else if (args.includes('--json')) {
    process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
  } else {
    printBatchHuman(results, options.dryRun);
  }

  if (results.some((result) => !result.ok)) process.exitCode = 2;
  if (options.failOnSeverity) {
    applySeverityExit(results.some((result) => resultFailsSeverity(result, options.failOnSeverity)));
  }
}

async function runSingleFile(filePath, args, options) {
  const result = await analyzeFile(filePath, {
    report: reportOptions(options),
    maxBytes: options.maxBytes,
    streamLargeFiles: options.streamLargeFiles
  });

  if (args.includes('--clean')) {
    if (options.dryRun) throw new Error('--dry-run cannot be combined with --clean.');
    process.stdout.write(cleanedFilePayload(result));
  } else if (args.includes('--audit')) {
    if (!result.report || result.mode === 'stream-detect-only') {
      throw new Error('--audit requires an in-memory text/source report; structured and streaming inputs are not supported.');
    }
    const rawText = await fs.readFile(filePath, 'utf8');
    const bundle = createAuditBundle(rawText, result.report.analysisOptions, { includeInput: options.includeInput });
    process.stdout.write(`${JSON.stringify(bundle, null, 2)}\n`);
  } else if (args.includes('--sarif')) {
    process.stdout.write(`${JSON.stringify(fileResultToSarif(result), null, 2)}\n`);
  } else if (args.includes('--json')) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    const { summary } = result;
    process.stdout.write([
      'Project Purify',
      `Path: ${result.path}`,
      `Format: ${result.format}`,
      `Rewrite policy: ${result.rewritePolicy}`,
      `Invisible/control findings: ${summary.invisibleOrControlCount}`,
      `Confusable findings: ${summary.confusableCount}`,
      `Mixed-script findings: ${summary.mixedScriptCount ?? 0}`,
      `High-risk findings: ${summary.highRiskCount}`,
      `Text changed by safe cleaning: ${summary.changed ? 'yes' : 'no'}`,
      options.dryRun ? 'Dry run: no cleaned payload emitted.' : '',
      result.mode === 'stream-detect-only' ? 'Streaming mode: detect-only.' : '',
      ''
    ].filter(Boolean).join('\n'));
  }

  if (options.failOnSeverity) applySeverityExit(resultFailsSeverity({ ok: true, ...result }, options.failOnSeverity));
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    process.stdout.write(usage());
    return;
  }

  const compareArgs = getMultiValues(args, '--compare-reports');
  if (compareArgs !== null) {
    const conflicting = ['--text', '--file', '--batch', '--dir', '--clean', '--audit', '--sarif', '--json', '--jsonl'].some((flag) => args.includes(flag));
    if (conflicting) throw new Error('--compare-reports cannot be combined with analysis input/output modes.');
    await compareReportFiles(compareArgs);
    return;
  }

  const textArg = getValue(args, '--text');
  const fileArg = getValue(args, '--file');
  const batchArgs = getMultiValues(args, '--batch');
  const dirArg = getValue(args, '--dir');
  const selectedInputs = [textArg !== null, fileArg !== null, batchArgs !== null, dirArg !== null].filter(Boolean).length;

  if (args.includes('--text') && textArg === null) throw new Error('--text requires a value.');
  if (args.includes('--file') && fileArg === null) throw new Error('--file requires a path.');
  if (args.includes('--dir') && dirArg === null) throw new Error('--dir requires a path.');
  if (selectedInputs > 1) throw new Error('Use only one input source: --text, --file, --batch, --dir, or stdin.');

  const machineFormats = ['--json', '--jsonl', '--sarif', '--audit'].filter((flag) => args.includes(flag));
  if (machineFormats.length > 1) throw new Error('Use only one machine-readable format: --json, --jsonl, --sarif, or --audit.');
  if (args.includes('--include-input') && !args.includes('--audit')) throw new Error('--include-input requires --audit.');

  const failOnSeverity = getValue(args, '--fail-on-severity');
  if (args.includes('--fail-on-severity') && failOnSeverity === null) throw new Error('--fail-on-severity requires low, medium, or high.');
  if (failOnSeverity) validateSeverity(failOnSeverity);

  const languageHint = getValue(args, '--language') ?? 'auto';
  if (args.includes('--language') && getValue(args, '--language') === null) throw new Error('--language requires a value.');
  validateLanguageHint(languageHint);

  const options = {
    aggressive: args.includes('--aggressive'),
    dryRun: args.includes('--dry-run'),
    streamLargeFiles: args.includes('--stream'),
    includeInput: args.includes('--include-input'),
    failOnSeverity,
    languageHint,
    maxBytes: getPositiveInteger(args, '--max-bytes', DEFAULT_MAX_FILE_BYTES)
  };

  if (batchArgs !== null) {
    await runBatch(batchArgs, args, options);
    return;
  }

  if (dirArg !== null) {
    const include = getRepeatedValues(args, '--include');
    const exclude = getRepeatedValues(args, '--exclude');
    const paths = await discoverFiles(dirArg, {
      include: include.length > 0 ? include : undefined,
      exclude
    });
    await runBatch(paths, args, options);
    return;
  }

  if (fileArg !== null) {
    await runSingleFile(fileArg, args, options);
    return;
  }

  let text;
  if (textArg !== null) text = textArg;
  else if (!process.stdin.isTTY) text = await readStdin();
  else {
    process.stdout.write(usage());
    process.exitCode = 1;
    return;
  }

  const optionsForReport = reportOptions(options);
  const report = buildReport(text, optionsForReport);

  if (args.includes('--clean')) {
    if (options.dryRun) throw new Error('--dry-run cannot be combined with --clean.');
    process.stdout.write(report.transformations.cleanedText);
  } else if (args.includes('--audit')) {
    const bundle = createAuditBundle(text, report.analysisOptions, { includeInput: options.includeInput });
    process.stdout.write(`${JSON.stringify(bundle, null, 2)}\n`);
  } else if (args.includes('--sarif')) {
    process.stdout.write(`${JSON.stringify(reportToSarif(report), null, 2)}\n`);
  } else if (args.includes('--json')) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    const { summary } = report;
    process.stdout.write([
      'Project Purify',
      `Language hint: ${options.languageHint}`,
      `Invisible/control findings: ${summary.invisibleOrControlCount}`,
      `Confusable findings: ${summary.confusableCount}`,
      `Mixed-script findings: ${summary.mixedScriptCount ?? 0}`,
      `High-risk findings: ${summary.highRiskCount}`,
      `Text changed by safe cleaning: ${summary.changed ? 'yes' : 'no'}`,
      options.dryRun ? 'Dry run: no cleaned payload emitted.' : '',
      options.dryRun ? '' : 'Cleaned text:',
      options.dryRun ? '' : report.transformations.cleanedText,
      ''
    ].filter((line, index, all) => line !== '' || index === all.length - 1).join('\n'));
  }

  if (options.failOnSeverity) applySeverityExit(reportFailsSeverity(report, options.failOnSeverity));
}

main().catch((error) => {
  process.stderr.write(`Error: ${error.message}\n`);
  process.exitCode = 1;
});
