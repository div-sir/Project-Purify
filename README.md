# Project Purify

Project Purify is a Unicode text-forensics toolkit. It detects invisible, format-control, and visually confusable Unicode characters, explains the findings, and produces a controlled clean version.

> Project Purify does **not** claim that Unicode artifacts prove AI authorship. Findings are text-level evidence only.

## Current status

`v0.2` Text Forensics Core is implemented in PR #1. `v0.3` File and Batch Analysis is now in progress.

Implemented:

- Zero-width and format-control detection.
- Bidi control detection.
- Unicode tag character detection.
- BOM and soft-hyphen detection.
- Safe cleaning with ZWJ and variation-selector preservation by default.
- Unicode confusable skeleton support through a generated-data runtime module.
- Stable finding IDs, reasons, and remediation guidance.
- Versioned JSON forensic reports with Unicode data provenance.
- Original-versus-cleaned change records.
- CLI input from literal text, UTF-8 files, stdin, or file batches.
- TXT and Markdown batch analysis with JSON/JSONL output.
- Multilingual fixtures and deterministic property-style tests.
- Browser-based MVP UI.
- GitHub Actions tests for Node 20 and 22.

See [ROADMAP.md](./ROADMAP.md) for the full path to v1.0.

## Why

Text copied from AI tools, websites, PDFs, editors, or messaging apps can contain invisible Unicode characters. Some are harmless and required for correct rendering. Others can alter search, comparison, identifiers, source-code review, filenames, or visual ordering.

Project Purify separates two questions:

1. What unusual Unicode is present?
2. What can be safely removed or normalized?

It does not turn those findings into an unsupported AI-generation probability.

## Run

Requirements: Node.js 20 or newer is recommended.

```bash
npm test
npm run serve
```

Open `http://localhost:4173` for the browser MVP.

## CLI

Analyze literal text:

```bash
npm run scan -- --text "hello​world"
```

Analyze one file:

```bash
npm run scan -- --file ./sample.txt
```

Analyze stdin:

```bash
cat sample.txt | npm run scan -- --json
```

Analyze multiple TXT/Markdown files:

```bash
npm run scan -- --batch ./a.txt ./README.md --json
```

Emit one machine-readable record per input:

```bash
npm run scan -- --batch ./a.txt ./b.md --jsonl
```

Print only cleaned text for one input:

```bash
npm run scan -- --file ./sample.txt --clean
```

Aggressive cleaning also removes Zero Width Joiner and variation selectors:

```bash
npm run scan -- --file ./sample.txt --clean --aggressive
```

Use aggressive mode only when loss of shaping or emoji-variation information is acceptable.

## Unicode confusables data

The runtime imports `src/generated/confusables-data.js`.

The repository contains a small offline fallback dataset so Project Purify remains usable without network access. Generate the complete pinned Unicode 17.0.0 UTS #39 mapping with:

```bash
npm run update:confusables
```

The generator records:

- Unicode version.
- Source URL.
- Source file date when available.
- SHA-256 of the downloaded source.
- Generator version.
- Mapping entry count.
- Dataset completeness.

GitHub Actions regenerates the pinned dataset and verifies that full-data mode includes integrity metadata.

## Library API

### Scan and clean

```js
import { scanText, cleanText, visualizeText } from './src/scanner.js';

const report = scanText(text);
const clean = cleanText(text);
const visible = visualizeText(text);
```

### Build a forensic report

```js
import { buildReport } from './src/report.js';

const report = buildReport(text);
console.log(JSON.stringify(report, null, 2));
```

The report contains:

- Schema version.
- Unicode data provenance.
- Input lengths.
- Severity and category summaries.
- Unicode findings.
- Confusable findings.
- Cleaned text.
- Change records.
- Confusable skeleton.
- Explicit limitations.

### Analyze files

```js
import { analyzeFile, analyzeFiles } from './src/files.js';

const one = await analyzeFile('./notes.md');
const many = await analyzeFiles(['./a.txt', './b.md']);
```

TXT, `.md`, and `.markdown` files are currently supported. The default per-file limit is 5 MiB.

## Cleaning policy

Default cleaning removes characters that are commonly invisible and unnecessary in ordinary prose. It preserves characters that can be semantically required, including U+200D ZERO WIDTH JOINER and Unicode variation selectors.

```js
cleanText(text, {
  removeZeroWidthJoiner: true,
  removeVariationSelectors: true
});
```

## Security and evidence limits

Project Purify is a deterministic Unicode inspection tool. A suspicious character can come from AI tools, websites, copy/paste, typography systems, messaging applications, malicious text, or legitimate multilingual writing.

Do not use a finding by itself to accuse a person or system of generating text with AI.

## License

MIT
