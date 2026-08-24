# Developer Integrations

Project Purify can run as a local CLI, a repository policy check, or a reusable GitHub Actions workflow.

Project Purify reports Unicode evidence. It does not determine who or what generated the text.

## Exit codes

The CLI uses stable exit-code categories for automation:

| Exit code | Meaning |
| --- | --- |
| `0` | Analysis completed and the configured severity policy did not fail. |
| `1` | CLI usage, configuration, or top-level execution error. |
| `2` | One or more batch inputs could not be analyzed. |
| `3` | A finding met or exceeded `--fail-on-severity`. |

File-analysis errors take precedence over a severity-policy failure in the current CLI.

## Repository scan

Scan all supported files recursively:

```bash
node ./src/cli.js --dir . --dry-run
```

Restrict the scan and add exclusions:

```bash
node ./src/cli.js \
  --dir . \
  --include "**/*.js" \
  --include "**/*.md" \
  --exclude "**/dist/**" \
  --fail-on-severity high \
  --dry-run
```

`.git` and `node_modules` are excluded by default.

## SARIF 2.1.0

Generate a SARIF result for GitHub code-scanning compatible workflows:

```bash
node ./src/cli.js \
  --dir . \
  --sarif \
  --fail-on-severity high \
  > project-purify.sarif
```

For plain text and source files, Project Purify uses the scanner's Unicode code-point offset as the SARIF `charOffset`.

For JSON and CSV, findings are created from individual string fields. Project Purify does not pretend that a field-local offset is the same as a whole-file offset. These results keep the artifact URI and a logical field path but omit a physical region until a source-preserving structured parser is implemented.

## Reusable GitHub Actions workflow

The repository contains:

```text
.github/workflows/purify-reusable.yml
```

A caller can use it as follows:

```yaml
name: Unicode Security

on:
  pull_request:

jobs:
  purify:
    uses: div-sir/Project-Purify/.github/workflows/purify-reusable.yml@main
    permissions:
      contents: read
      security-events: write
    with:
      severity: high
      upload-sarif: true
```

Before a stable release exists, `@main` is useful for development only. Production users SHOULD pin a tagged Project Purify release after one is published.

`upload-sarif` defaults to `false`. When disabled, the workflow still uploads `project-purify.sarif` as a workflow artifact. This keeps the scan usable in repositories that cannot upload code-scanning results.

## Minimal workflow without reusable Actions

```yaml
- uses: actions/checkout@v6
- uses: actions/setup-node@v4
  with:
    node-version: 22
- uses: actions/checkout@v6
  with:
    repository: div-sir/Project-Purify
    path: .project-purify
- run: >-
    node .project-purify/src/cli.js
    --dir .
    --exclude "**/.project-purify/**"
    --fail-on-severity high
    --dry-run
```

## Git pre-commit hook

Until the npm package is published, a repository can keep Project Purify as a sibling checkout or submodule and use a local hook such as:

```sh
#!/bin/sh
set -eu

PURIFY="../Project-Purify/src/cli.js"
FILES=$(git diff --cached --name-only --diff-filter=ACMR | tr '\n' ' ')

[ -z "$FILES" ] && exit 0
node "$PURIFY" --batch $FILES --fail-on-severity high --dry-run
```

This simple example assumes staged paths do not contain whitespace. A production hook SHOULD use a NUL-delimited file list or a hook framework that passes paths safely.

The hook deliberately uses `--dry-run`. Project Purify MUST NOT rewrite source code automatically as part of pre-commit checks.

## Large files

Normal file analysis uses a 5 MiB in-memory limit. Plain text and source files can opt into detect-only streaming:

```bash
node ./src/cli.js --file ./large.log --stream --max-bytes 5242880 --json
```

Streaming mode does not produce cleaned output. JSON and CSV do not use streaming mode because a structured field can cross a chunk boundary.

## Public ESM API

The package entry point is `src/index.js` and is exposed through the package `exports` field.

```js
import {
  buildReport,
  scanText,
  cleanText,
  reportToSarif
} from 'project-purify';

const report = buildReport('A\u200BB');
console.log(report.summary);
console.log(reportToSarif(report));
```

The npm package is not published yet. The API boundary exists now so it can be tested before publication.
