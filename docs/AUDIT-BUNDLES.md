# Audit Bundles

Project Purify audit bundles are content-addressed, tamper-evident forensic containers.

They are not digital signatures and do not prove who created the text.

## Create a bundle

Library:

```js
import { createAuditBundle } from 'project-purify';

const bundle = createAuditBundle(text, {
  scripts: { languageHint: 'en' }
}, {
  includeInput: true
});
```

CLI:

```bash
project-purify --text "pаypal" --language en --audit --include-input
```

Without `--include-input`, the bundle contains the input SHA-256 but not the original text. This is useful when the raw content is sensitive.

With `--include-input`, the bundle is self-contained and can be reproduced independently by a compatible Project Purify build and the same Unicode datasets.

## Integrity

`integrity.bundleSha256` is the SHA-256 of the canonical JSON payload excluding the `integrity` object itself.

`integrity.contentAddress` is the same digest in content-address form:

```text
sha256:<64 hex characters>
```

If any covered field changes, `verifyAuditBundle()` returns `integrityValid: false`.

This is tamper evidence. It is **not** authenticity. Anyone can create a new valid bundle for modified content.

For authenticity, a future system can sign the bundle content address with an external signing/provenance mechanism.

## Verification

```js
import { verifyAuditBundle } from 'project-purify';

const result = verifyAuditBundle(bundle);
```

Verification checks:

- canonical bundle integrity hash;
- original input hash when input text is included.

## Reproduction

```js
import { reproduceAuditBundle } from 'project-purify';

const result = reproduceAuditBundle(bundle);
```

A self-contained bundle reproduces the report and compares:

- input hash;
- cleaned-text hash;
- confusable-skeleton hash;
- Project Purify version;
- normalized analysis options;
- confusables data provenance;
- scripts data provenance;
- finding ID set.

`reproductionValid` is true only when all of these invariants match.

A reproduction can legitimately fail after changing the tool version, analysis policy, or Unicode dataset. The failure is evidence of an environment difference, not automatically a software defect.

## Structured and streaming inputs

The CLI does not emit one whole-file audit bundle for JSON/CSV structured analysis because those formats contain multiple field-local reports.

The CLI also does not emit a self-contained report audit for detect-only streaming mode because streaming intentionally does not claim all whole-document transformations and token analysis.

Consumers can build higher-level collection manifests that hash multiple field/file reports without pretending those reports share one offset space.

## Comparison

Compare two report JSON files:

```bash
project-purify --compare-reports before.json after.json
```

Or use the API:

```js
import { compareReports } from 'project-purify';

const comparison = compareReports(before, after);
```

Comparison distinguishes:

- input changes;
- cleaned/skeleton output changes;
- analysis-policy changes;
- Unicode data provenance changes;
- finding-set changes;
- aggregate count deltas.

## Evidence boundary

An audit bundle establishes deterministic content and analysis identity under recorded conditions.

It does not establish:

- AI authorship;
- human authorship;
- author identity;
- author intent;
- malicious intent;
- time of original creation.
