# Project Purify Threat Model

## Scope

Project Purify is a local-first Unicode text-forensics toolkit. It analyzes text, files, source repositories, browser selections, and editable text for invisible controls, confusables, and suspicious mixed-script tokens.

The threat model covers the CLI, shared analysis core, Web Workbench, browser extension, generated Unicode data, forensic reports, audit bundles, and CI integrations.

## Security goals

Project Purify SHOULD:

1. Keep analyzed text local unless the user explicitly exports or uploads a report.
2. Never treat Unicode findings as proof of AI authorship or malicious intent.
3. Preserve legitimate multilingual semantics under conservative cleaning.
4. Avoid silently rewriting source code.
5. Make generated Unicode data provenance auditable.
6. Bound CPU, memory, and output growth for untrusted inputs.
7. Make forensic reports and audit bundles deterministic and tamper-evident where documented.
8. Keep browser extension permissions minimal.

## Assets

- Original user text and files.
- Cleaned text.
- Source-code identifiers.
- Forensic reports and audit bundles.
- Unicode data provenance and hashes.
- Browser selections and form text inspected locally.
- CI output and SARIF findings.

## Trust boundaries

### Local analysis core

The scanner, cleaner, confusable detector, script analyzer, report builder, Workbench model, and evidence APIs run locally. They MUST NOT require remote text submission.

### Unicode data update scripts

`update:unicode-data` downloads version-pinned Unicode data. Downloaded data is untrusted until parsed and hashed. Runtime analysis does not require network access because fallback datasets are committed to the repository.

### Browser extension

The extension runs in privileged browser contexts. Page content is untrusted. Content scripts MUST avoid password fields and MUST NOT transmit inspected text to remote services.

### CI

Repository content is untrusted input. Source analysis uses a detect-only policy. SARIF output can expose snippets or metadata if future features add them, so CI changes MUST review data exposure explicitly.

## Threats and controls

### T1 — Destructive multilingual cleaning

**Threat:** Removing ZWNJ, ZWJ, bidi direction controls, or variation selectors can damage valid Persian, Arabic, bidirectional text, emoji, or glyph presentation.

**Control:** Conservative cleaning preserves these characters by default. Explicit aggressive options are required to remove them.

### T2 — Trojan Source / visual source-code deception

**Threat:** Bidi controls or mixed-script identifiers can make source code appear different from its logical content.

**Control:** Source files use `detect-only`. Bidi controls are high-risk findings. Identifier analysis uses the stricter mixed-script profile. SARIF can surface findings to code review.

### T3 — Confusable false positives

**Threat:** Treating every UTS #39 skeleton mapping as suspicious creates large numbers of false positives, including ordinary ASCII mappings.

**Control:** Skeleton generation and suspicious-finding policy are separate. ASCII source mappings are suppressed by default. Language-aware mixed-script policy reduces ordinary multilingual false positives.

### T4 — Resource exhaustion

**Threat:** Very large text, huge numbers of findings, or adversarial Unicode can consume excessive memory or CPU.

**Control:** In-memory file limits, streaming byte limits, findings caps, batch isolation, and deterministic linear scanning. Benchmarks and torture-corpus tests are part of v0.9.

### T5 — Structured-file corruption

**Threat:** Treating JSON/CSV as raw prose can corrupt structure or misreport offsets.

**Control:** JSON and CSV analyze string/field content separately. Whole-file automatic rewrite is not implied. Field-local positions are not emitted as whole-file SARIF regions.

### T6 — Source-code auto-rewrite

**Threat:** Automatic Unicode cleanup can change identifiers, strings, comments, or syntax.

**Control:** Source files and large streamed files are `detect-only`. `--clean` is refused for detect-only inputs.

### T7 — Browser data exfiltration

**Threat:** Extension code could send selected text, form text, or page content to a remote service.

**Control:** Extension source contains no remote text transport API, uses local analysis, excludes password fields, and does not request persistent broad host permissions.

### T8 — Over-privileged extension permissions

**Threat:** Excessive permissions increase the impact of extension compromise.

**Control:** Use `activeTab`, `scripting`, `contextMenus`, and `storage` only where needed. Avoid persistent `host_permissions` unless a future feature has a documented requirement.

### T9 — Unicode data supply-chain drift

**Threat:** Upstream Unicode data changes can alter findings or skeletons.

**Control:** Pin Unicode version, record source URLs and SHA-256 hashes, retain fallback data, and expose provenance in reports and audit reproduction.

### T10 — Evidence tampering

**Threat:** A report or audit bundle can be modified after analysis.

**Control:** Reports contain evidence hashes. Audit bundles use canonical serialization and a bundle SHA-256. Verification detects modification. This is integrity checking, not digital signing.

### T11 — Misinterpreting severity as attribution probability

**Threat:** Consumers may interpret `high` severity as a probability of AI generation or malicious authorship.

**Control:** Reports expose machine-readable limitations: attribution is unsupported, attribution confidence is null, and severity is not a probability.

### T12 — Offset confusion

**Threat:** Mixing Unicode code-point offsets, UTF-16 offsets, and byte offsets can point reviewers to the wrong location.

**Control:** Offset semantics are documented. SARIF/editor-facing regions use UTF-16 offsets. Structured field-local offsets are not claimed as whole-file regions.

## Non-goals

Project Purify does not:

- Prove that text was generated by AI.
- Identify an author from Unicode artifacts.
- Guarantee that a finding is malicious.
- Cryptographically authenticate the original source of text.
- Safely auto-rewrite arbitrary source code.
- Replace a full Unicode security review for high-assurance systems.

## Security review checklist

Before a stable release:

- [ ] All untrusted-input loops have practical bounds or documented size limits.
- [ ] No browser path sends analyzed text remotely.
- [ ] Password inputs remain excluded.
- [ ] Source-code cleaning remains detect-only.
- [ ] Conservative cleaning preserves shaping/direction controls by default.
- [ ] SARIF offsets are UTF-16-correct for supplementary characters.
- [ ] Structured-file findings do not claim false whole-file coordinates.
- [ ] Unicode data generation is version-pinned and hashed.
- [ ] Audit-bundle integrity tests detect mutation.
- [ ] Dependency and package contents are reviewed before npm publication.
