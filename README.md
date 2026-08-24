# Project Purify

Project Purify is a Unicode text-forensics toolkit. It detects invisible, format-control, and visually confusable Unicode characters, explains the findings, and produces a controlled clean version.

> Project Purify does **not** claim that Unicode artifacts prove AI authorship. Findings are text-level evidence only.

## Current status

`v0.2.0-dev` is under active development.

Implemented:

- Zero-width and format-control detection.
- Bidi control detection.
- Unicode tag character detection.
- BOM and soft-hyphen detection.
- Safe cleaning with ZWJ and variation-selector preservation by default.
- Common Greek/Cyrillic Latin-lookalike detection.
- Confusable skeleton generation.
- Versioned JSON forensic reports.
- Original-versus-cleaned change records.
- CLI input from literal text, UTF-8 files, or stdin.
- Browser-based MVP UI.
- Node test suite.

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

Analyze a file:

```bash
npm run scan -- --file ./sample.txt
```

Analyze stdin:

```bash
cat sample.txt | npm run scan -- --json
```

Print only cleaned text:

```bash
npm run scan -- --file ./sample.txt --clean
```

Aggressive cleaning also removes Zero Width Joiner and variation selectors:

```bash
npm run scan -- --file ./sample.txt --clean --aggressive
```

Use aggressive mode only when loss of shaping or emoji-variation information is acceptable.

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
- Input lengths.
- Severity and category summaries.
- Unicode findings.
- Confusable findings.
- Cleaned text.
- Change records.
- Confusable skeleton.
- Explicit limitations.

## Cleaning policy

Default cleaning removes characters that are commonly invisible and unnecessary in ordinary prose. It preserves characters that can be semantically required, including U+200D ZERO WIDTH JOINER and Unicode variation selectors.

```js
cleanText(text, {
  removeZeroWidthJoiner: true,
  removeVariationSelectors: true
});
```

## Confusable coverage

The current confusable detector covers a practical subset of common Greek and Cyrillic Latin-lookalike characters. It is deliberately labeled incomplete.

A future v0.2 milestone will generate the full table from Unicode Consortium confusables data instead of maintaining a hand-written subset.

## Security and evidence limits

Project Purify is a deterministic Unicode inspection tool. A suspicious character can come from AI tools, websites, copy/paste, typography systems, messaging applications, malicious text, or legitimate multilingual writing.

Do not use a finding by itself to accuse a person or system of generating text with AI.

## License

MIT
