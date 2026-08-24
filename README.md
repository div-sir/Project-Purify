# Project Purify

Project Purify is a local-first Unicode text-forensics toolkit. It detects invisible and format-control characters, Unicode confusables, and suspicious mixed-script tokens, explains the findings, and produces a controlled clean version when rewriting is safe.

> Project Purify does **not** claim that Unicode artifacts prove AI authorship. Findings are text-level evidence only.

## Current status

`v0.7.0-dev` is under development in PR #1.

Implemented:

- Invisible, zero-width, bidi-control, tag, BOM, and soft-hyphen detection.
- Safe cleaning that preserves ZWJ and variation selectors by default.
- Version-pinned Unicode 17.0.0 confusable and script-data generators.
- UTS #39 confusable skeleton generation with ASCII exemplar false-positive suppression.
- Mixed-script token analysis with language-aware policy hints.
- Identifier-focused source-code security profile.
- Stable finding IDs, reasons, remediation guidance, and Unicode data provenance.
- Versioned forensic JSON report schema (`1.2.0`).
- TXT/Markdown, JSON string-field, CSV field, and source-code analysis.
- Recursive repository discovery with include/exclude globs.
- Detect-only streaming for large plain-text/source files.
- CLI JSON, JSONL, SARIF 2.1.0, severity exit policies, and dry-run mode.
- Local Web Forensics Workbench with English, Traditional Chinese, and Japanese UI.
- Chromium/Firefox-oriented browser extension implementation using the shared core.
- Reusable GitHub Actions workflow, pre-commit guidance, and VS Code integration architecture.

The npm package is intentionally **not published yet**. `package.json` remains private until release verification and package-readiness review are complete.

See [ROADMAP.md](./ROADMAP.md) for the path to v1.0.

## Why

Text copied from AI tools, websites, PDFs, editors, messaging apps, or source repositories can contain Unicode that is difficult to see but changes comparison, parsing, visual ordering, identifiers, filenames, or search results.

Project Purify separates three questions:

1. What unusual Unicode is present?
2. Is a visually deceptive or mixed-script token present?
3. What can be safely removed or normalized without damaging legitimate text?

It does not convert these signals into an unsupported AI-generation probability.

## Requirements

Node.js 20 or newer.

```bash
npm test
npm run serve
```

Open `http://localhost:4173` for the browser Workbench.

## CLI

Analyze literal text:

```bash
npm run scan -- --text "hello​world"
```

Use a language-aware mixed-script policy:

```bash
npm run scan -- --text "AI生成文字" --language zh-Hant
npm run scan -- --text "pаypal" --language en --fail-on-severity high --dry-run
```

Supported analysis hints:

```text
auto, en, zh-Hant, zh, ja, ko, ar
```

Analyze one file:

```bash
npm run scan -- --file ./sample.txt --json
```

Scan a repository recursively:

```bash
npm run scan -- --dir . \
  --include "**/*.js" \
  --include "**/*.md" \
  --exclude "**/dist/**" \
  --fail-on-severity high
```

Emit SARIF for code-scanning integrations:

```bash
npm run scan -- --dir . --sarif > project-purify.sarif
```

Analyze multiple explicit files:

```bash
npm run scan -- --batch ./a.txt ./README.md ./data.json --jsonl
```

Use detect-only streaming when a large plain/source file exceeds the normal in-memory limit:

```bash
npm run scan -- --file ./large.log --stream --json
```

Structured JSON/CSV files do not use large-file streaming because field boundaries can cross chunks.

### Exit codes

- `0`: analysis completed and policy threshold was not reached.
- `1`: CLI usage or single-input analysis error.
- `2`: one or more batch inputs failed analysis.
- `3`: `--fail-on-severity` threshold was reached.

## File safety policy

Project Purify does not treat every file as rewritable.

| Input | Policy |
| --- | --- |
| TXT / Markdown | `allowed` |
| JSON / CSV | `structured-fields-only` |
| Source code | `detect-only` |
| Large streamed text/source | `detect-only` |

Source-code analysis never authorizes automatic rewriting. Review identifier and confusable findings before changing code.

## Mixed-script analysis

Project Purify distinguishes ordinary multilingual writing from security-sensitive same-token script mixing.

Examples that should normally remain unflagged under the matching language profile:

```text
AI生成文字
AI生成テスト日本語
AI모델테스트
```

A token such as the following is treated differently because it combines Latin and Cyrillic lookalikes in one token:

```text
pаypal
 ^ Cyrillic U+0430
```

Mixed-script findings are still policy signals, not proof of malicious intent.

## Unicode data

The repository contains deterministic fallback data for offline use. Release/CI environments can regenerate full pinned Unicode 17.0.0 data:

```bash
npm run update:unicode-data
```

This runs:

```bash
npm run update:confusables
npm run update:scripts
```

Generated metadata records the Unicode version, source URL, SHA-256, source date when available, entry/range count, generation time, and whether the dataset is `fallback` or `full`.

## Public ESM API

```js
import {
  buildReport,
  analyzeFile,
  analyzeScripts,
  analyzeIdentifierScripts,
  reportToSarif
} from 'project-purify';

const report = buildReport('pаypal', {
  scripts: { languageHint: 'en' }
});
```

The package entry point is defined, but npm publication is intentionally blocked until release verification.

## Web Workbench

The browser Workbench provides:

- Side-by-side original and clean text.
- Inline forensic markers.
- Severity/category filters.
- Confusable skeleton preview.
- Mixed-script findings.
- English / Traditional Chinese / Japanese UI.
- Independent analysis-language policy selector.
- Drag-and-drop TXT/Markdown analysis.
- JSON report download.
- Local-only processing with no remote text API.

ZWJ and variation selectors are preserved by default because they can be required for emoji or script shaping. ZWNJ can also be meaningful in some writing systems; review language context before removing it.

## Browser extension

Build the shared-core extension package with:

```bash
npm run build:extension
```

The extension implementation includes selected-text analysis, context-menu analysis, on-demand visible-page scanning, local copy/submit inspection, password-field exclusion, and a finding badge. It does not use a remote text transport API.

Chromium and Firefox runtime verification remain release gates.

## Developer integrations

See `docs/DEVELOPER-INTEGRATIONS.md` for reusable GitHub Actions and pre-commit examples, and `docs/VSCODE-FEASIBILITY.md` for the editor-integration architecture.

## Security and evidence limits

A suspicious character can come from AI tools, websites, copy/paste, typography systems, messaging applications, malicious text, or legitimate multilingual writing.

UTS #39 skeleton mappings are comparison data, not automatic proof that a character is suspicious. Project Purify suppresses ASCII source mappings by default and applies language-aware mixed-script policies to reduce false positives.

Do not use a finding by itself to accuse a person or system of generating text with AI or acting maliciously.

## License

MIT
