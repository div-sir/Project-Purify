#!/usr/bin/env node

import fs from 'node:fs/promises';
import process from 'node:process';
import { buildReport } from './report.js';

function usage() {
  return `Project Purify CLI\n\nUsage:\n  project-purify --text "text" [--json]\n  project-purify --file path/to/file.txt [--json]\n  cat file.txt | project-purify [--json]\n\nOptions:\n  --text <text>       Analyze literal text.\n  --file <path>       Analyze one UTF-8 text file.\n  --json              Print the complete JSON report.\n  --clean             Print only cleaned text.\n  --aggressive        Also remove ZWJ and variation selectors.\n  --help              Show this help.\n`;
}

function getValue(args, name) {
  const index = args.indexOf(name);
  if (index === -1) return null;
  return args[index + 1] ?? null;
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    process.stdout.write(usage());
    return;
  }

  const textArg = getValue(args, '--text');
  const fileArg = getValue(args, '--file');

  if (args.includes('--text') && textArg === null) throw new Error('--text requires a value.');
  if (args.includes('--file') && fileArg === null) throw new Error('--file requires a path.');
  if (textArg !== null && fileArg !== null) throw new Error('Use only one input source: --text, --file, or stdin.');

  let text;
  if (textArg !== null) text = textArg;
  else if (fileArg !== null) text = await fs.readFile(fileArg, 'utf8');
  else if (!process.stdin.isTTY) text = await readStdin();
  else {
    process.stdout.write(usage());
    process.exitCode = 1;
    return;
  }

  const aggressive = args.includes('--aggressive');
  const report = buildReport(text, {
    clean: {
      removeZeroWidthJoiner: aggressive,
      removeVariationSelectors: aggressive
    }
  });

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
