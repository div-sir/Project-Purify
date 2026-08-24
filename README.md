# Project Purify

Project Purify detects invisible and format-control Unicode characters in text and produces a clean version.

## Why

Text copied from AI tools, websites, PDFs, editors, or messaging apps can contain invisible Unicode characters. Some are harmless and required for correct text rendering. Others can alter search, comparison, source code review, filenames, or visual ordering.

Project Purify does **not** claim that invisible Unicode proves AI authorship. It reports text-level evidence only.

## MVP features

- Detect zero-width characters.
- Detect bidi control characters.
- Detect Unicode tag characters.
- Detect soft hyphen and BOM.
- Show exact Unicode code point and character position.
- Visualize hidden characters inline.
- Produce a cleaned text version.
- Preserve Zero Width Joiner by default because emoji and some scripts depend on it.
- Preserve variation selectors by default.
- NFC-normalize cleaned output.

## Run

```bash
npm test
npm run serve
```

Open `http://localhost:4173`.

## Cleaning policy

Default cleaning removes characters that are commonly invisible and unnecessary in ordinary prose. It keeps characters that can be semantically required, including U+200D ZERO WIDTH JOINER and Unicode variation selectors.

An aggressive mode is available through the library API:

```js
cleanText(text, {
  removeZeroWidthJoiner: true,
  removeVariationSelectors: true
});
```

Use aggressive mode only when loss of shaping information is acceptable.

## Library API

```js
import { scanText, cleanText, visualizeText } from './src/scanner.js';

const report = scanText(text);
const clean = cleanText(text);
const visible = visualizeText(text);
```

## Planned

- Browser extension.
- File upload for TXT, Markdown, JSON, CSV, and source code.
- Diff view between original and cleaned text.
- Unicode category explanations.
- Confusable / homoglyph inspection.
- CLI package.
- Batch scanning.
- Exportable JSON report.

## License

MIT
