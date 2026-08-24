# Project Purify

Project Purify is a local-first Unicode text-forensics toolkit. It detects invisible and format-control characters, Unicode confusables, and suspicious mixed-script tokens, explains the findings, and produces a controlled clean version when rewriting is safe.

> Project Purify does **not** claim that Unicode artifacts prove AI authorship. Findings are deterministic text-level evidence only.

## Current status

`v0.9.0-dev` hardening is in progress in PR #1.

Implemented:

- Invisible, zero-width, bidi-control, tag, BOM, and soft-hyphen detection.
- Conservative cleaning that preserves ZWNJ, ZWJ, direction controls, variation selectors, and Unicode tag characters by default.
- Explicit `--aggressive` opt-in for removing shaping-, direction-, presentation-, and tag-sensitive controls.
- Version-pinned Unicode 17.0.0 confusable and script-data generators with bounded HTTPS downloads and SHA-256 provenance.
- UTS #39 confusable skeleton generation with ASCII exemplar false-positive suppression.
- Mixed-script token analysis with language-aware policy hints.
- Identifier-focused source-code security profile.
- Stable finding IDs, reasons, remediation guidance, and Unicode data provenance.
- Forensic report schema `1.4.0` with normalized options and SHA-256 evidence hashes.
- Content-addressed, tamper-evident audit bundles and deterministic report comparison.
- TXT/Markdown, JSON string-field, CSV field, and source-code analysis.
- Recursive repository discovery with include/exclude globs.
- Detect-only streaming for large plain-text/source files; mixed-script token coverage is explicitly marked `not-evaluated` in streaming mode.
- CLI JSON, JSONL, SARIF 2.1.0, audit, comparison, severity policy, and dry-run modes.
- Local Web Forensics Workbench with English, Traditional Chinese, and Japanese UI.
- Browser extension implementation using explicit `activeTab` access instead of persistent all-site content-script injection.
- Reusable GitHub Actions workflow, cross-platform hardening matrix, performance budgets, pre-commit guidance, and VS Code integration architecture.
- Threat model, API compatibility policy, accessibility checklist, security policy, browser runtime matrix, Unicode torture corpus, and release-readiness checklist.

The npm package is intentionally **not published yet**. `package.json` remains private until release verification and package-readiness review are complete.

See [ROADMAP.md](./ROADMAP.md) for the path to v1.0.

## Why

Text copied from AI tools, websites, PDFs, editors, messaging apps, or source repositories can contain Unicode that is difficult to see but changes comparison, parsing, visual ordering, identifiers, filenames, or search results.

Project Purify separates four questions:

1. What unusual Unicode is present?
2. Is a visually deceptive or mixed-script token present?
3. What can be conservatively removed or normalized without damaging legitimate text?
4. Can the exact analysis be identified, verified, and reproduced later?

It does not convert these signals into an unsupported AI-generation probability.

## Requirements

Node.js 20 or newer.

```bash
npm test
npm run benchmark
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

Scan a repository recursively:

```bash
npm run scan -- --dir . \
  --include "**/*.js" \
  --include "**/*.md" \
  --exclude "**/dist/**" \
  --fail-on-severity high
```

Emit SARIF:

```bash
npm run scan -- --dir . --sarif > project-purify.sarif
```

Create a tamper-evident audit bundle without embedding the original text:

```bash
npm run scan -- --text "pаypal" --language en --audit > audit.json
```

Create a self-contained reproducible bundle:

```bash
npm run scan -- --text "pаypal" --language en --audit --include-input > audit.json
```

Compare two report JSON files:

```bash
npm run scan -- --compare-reports before.json after.json
```

Use detect-only streaming when a large plain/source file exceeds the normal in-memory limit:

```bash
npm run scan -- --file ./large.log --stream --json
```

Streaming mode evaluates Unicode controls and confusables. Mixed-script token analysis is explicitly reported as `not-evaluated` because tokens can span stream chunks.

Structured JSON/CSV files do not use large-file streaming because field boundaries can cross chunks.

### Exit codes

- `0`: analysis completed and policy threshold was not reached.
- `1`: CLI usage or single-input analysis error.
- `2`: one or more batch inputs failed analysis.
- `3`: `--fail-on-severity` threshold was reached.

## Cleaning policy

Conservative cleaning removes common ordinary-prose artifacts such as U+200B ZERO WIDTH SPACE, U+2060 WORD JOINER, embedded BOM, and soft hyphen.

It **preserves by default** characters that can carry legitimate semantics:

- U+200C ZERO WIDTH NON-JOINER.
- U+200D ZERO WIDTH JOINER.
- LRM/RLM and Unicode bidi controls.
- Variation selectors.
- Unicode tag characters used by standardized tag sequences.

Use aggressive cleaning only when semantic loss is acceptable:

```bash
npm run scan -- --text "$TEXT" --clean --aggressive
```

Detection is independent from cleaning. Preserved controls still appear as findings.

## File safety policy

| Input | Policy |
| --- | --- |
| TXT / Markdown | `allowed` |
| JSON / CSV | `structured-fields-only` |
| Source code | `detect-only` |
| Large streamed text/source | `detect-only` |

Source-code analysis never authorizes automatic rewriting. Review identifier/confusable findings before changing code.

## Mixed-script analysis

Ordinary multilingual writing should remain usable under the matching language profile:

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

Mixed-script findings are policy signals, not proof of malicious intent.

## Reproducible evidence

Report schema `1.4.0` records:

- Project Purify version.
- Normalized analysis and cleaning options.
- SHA-256 of input, cleaned output, and confusable skeleton.
- Unicode data source/version/integrity metadata.
- Machine-readable attribution limits.
- Stable finding IDs and transformations.

Audit bundles add a canonical bundle integrity hash and content address. A self-contained bundle can reproduce and compare tool version, options, Unicode provenance, hashes, and finding sets.

See:

- [Report schema](./docs/REPORT-SCHEMA.md)
- [Offset semantics](./docs/OFFSETS.md)
- [Audit bundles](./docs/AUDIT-BUNDLES.md)

Hashes establish content identity, not authorship or authenticity. Audit bundle integrity is tamper evidence, not a digital signature.

## Unicode data

The repository contains deterministic fallback data for offline use. CI/release environments can regenerate full pinned Unicode 17.0.0 data:

```bash
npm run update:unicode-data
```

Generated metadata records Unicode version, source URL, SHA-256, source date when available, entry/range count, and dataset completeness. The downloader only accepts HTTPS from `www.unicode.org`, applies a timeout, and enforces a response-size cap.

## Public ESM API

```js
import {
  buildReport,
  analyzeFile,
  analyzeScripts,
  createAuditBundle,
  verifyAuditBundle,
  reproduceAuditBundle,
  compareReports,
  reportToSarif
} from 'project-purify';

const report = buildReport('pаypal', {
  scripts: { languageHint: 'en' }
});
```

The package entry point is defined, but npm publication is intentionally blocked until release verification.

## Web Workbench

The browser Workbench provides side-by-side text, inline markers, severity/category filters, confusable skeleton, mixed-script findings, English/Traditional Chinese/Japanese UI, an independent analysis-language selector, drag-and-drop TXT/Markdown input, report download, and local-only processing.

## Browser extension

```bash
npm run build:extension
```

The extension implementation includes selected-text analysis, context-menu analysis, on-demand visible-page scanning, local copy/submit inspection after explicit tab activation, password-field exclusion, and a finding badge. It does not use a remote text transport API and no longer registers a persistent `<all_urls>` content script.

Chromium and Firefox runtime verification remain release gates. See [Browser runtime verification](./docs/BROWSER-RUNTIME.md).

## Hardening and developer integrations

- [Threat model](./docs/THREAT-MODEL.md)
- [Security policy](./SECURITY.md)
- [API compatibility and deprecation](./docs/API-COMPATIBILITY.md)
- [Accessibility audit](./docs/ACCESSIBILITY.md)
- [Release checklist](./docs/RELEASE-CHECKLIST.md)
- [Developer integrations](./docs/DEVELOPER-INTEGRATIONS.md)
- [VS Code feasibility](./docs/VSCODE-FEASIBILITY.md)

The `Hardening` GitHub Actions workflow runs the full suite across Linux, macOS, and Windows with Node 20/22, builds the extension, checks package contents, and enforces reference performance budgets.

## Evidence limits

A suspicious character can come from AI tools, websites, copy/paste, typography systems, messaging applications, malicious text, or legitimate multilingual writing.

UTS #39 skeleton mappings are comparison data, not automatic proof that a character is suspicious. `high`, `medium`, and `low` are deterministic policy severities, not probabilities.

Project Purify does not support attribution confidence. Do not use a finding by itself to accuse a person or system of generating text with AI or acting maliciously.

## License

MIT
