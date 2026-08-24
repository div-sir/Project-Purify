#!/usr/bin/env node

import fs from 'node:fs/promises';
import process from 'node:process';
import { buildReport } from './report.js';
import { analyzeFiles } from './files.js';

function usage() {
  return `Project Purify CLI\n\nUsage:\n  project-purify --text "text" [--json]\n  project-purify --file path/to/file.txt [--json]\n  project-purify --batch a.txt b.md [--json | --jsonl]\n  cat file.txt | project-purify [--json]\n\nOptions:\n  --text <text>       Analyze literal text.\n  --file <path>       Analyze one UTF-8 text file.\n  --batch <paths...>  Analyze multiple TXT/Markdown files.\n  --json              Print complete JSON output.\n  --jsonl             Print one JSON object per batch input line.\n  --clean             Print only cleaned text for single-input mode.\n  --aggressive        Also remove ZWJ and variation selectors.\n  --help              Show this help.\n`;
}

function getValue(args, name) {
  const index = args.indexOf(name);
  if (index === -1) return null;
  return args[index + 1] ?? null;
}

function getMultiValues(args, name) {
  const index = args.indexOf(name);
  if (index === -1) return null;
  const values = [];
  for (let i = index + 1; i < args.length && !args[i].startsWith('--'); i += 1) values.push(args[i]);
  return values;
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

async function runBatch(paths, args, aggressive) {
  if (paths.length === 0) throw new Error('--batch requires at least one path.');
  if (args.includes('--clean')) throw new Error('--clean is only available for single-input mode.');

  const results = await analyzeFiles(paths, {
    report: { clean: cleanOptions(aggressive) }
  });

  if (args.includes('--jsonl')) {
    for (const result of results) process.stdout.write(`${JSON.stringify(result)}\n`);
    return;
  }

  if (args.includes('--json')) {
    process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
    return;
  }

  for (const result of results) {
    if (!result.ok) {
      process.stdout.write(`ERROR ${result.path}: ${result.error}\n`);
      continue;
    }
    const { summary } = result.report;
    process.stdout.write(`${result.path}: controls=${summary.invisibleOrControlCount} confusables=${summary.confusableCount} changed=${summary.changed ? 'yes' : 'no'}\n`);
  }

  if (results.some((result) => !result.ok)) process.exitCode = 2;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    process.stdout.write(usage());
    return;
  }

  const textArg = getValue(args, '--text');
  const fileArg = getValue(args, '--file');
  const batchArgs = getMultiValues(args, '--batch');
  const selectedInputs = [textArg !== null, fileArg !== null, batchArgs !== null].filter(Boolean).length;

  if (args.includes('--text') && textArg === null) throw new Error('--text requires a value.');
  if (args.includes('--file') && fileArg === null) throw new Error('--file requires a path.');
  if (selectedInputs > 1) throw new Error('Use only one input source: --text, --file, --batch, or stdin.');

  const aggressive = args.includes('--aggressive');
  if (batchArgs !== null) {
    await runBatch(batchArgs, args, aggressive);
    return;
  }

  let text;
  if (textArg !== null) text = textArg;
  else if (fileArg !== null) text = await fs.readFile(fileArg, 'utf8');
  else if (!process.stdin.isTTY) text = await readStdin();
  else {
    process.stdout.write(usage());
    process.exitCode = 1;
    return;
  }

  const report = buildReport(text, { clean: cleanOptions(aggressive) });

  if (args.includes('--clean')) {
    process.stdout.write(report.transformations.cleanedText);
    return;
  }

  if (args.includes('--json')) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return;
  }

  const { summary } = report;
  process.stdout.write([
    'Project Purify',
    `Invisible/control findings: ${summary.invisibleOrControlCount}`,
    `Confusable findings: ${summary.confusableCount}`,
    `High-risk findings: ${summary.highRiskCount}`,
    `Text changed by safe cleaning: ${summary.changed ? 'yes' : 'no'}`,
    '',
    'Cleaned text:',
    report.transformations.cleanedText,
    ''
  ].join('\n'));
}

main().catch((error) => {
  process.stderr.write(`Error: ${error.message}\n`);
  process.exitCode = 1;
});
