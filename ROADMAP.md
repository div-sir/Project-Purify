# Project Purify Roadmap

Project Purify is a Unicode text-forensics toolkit. It detects invisible and suspicious Unicode characters, explains the findings, and produces a controlled clean version.

Project Purify MUST NOT claim that Unicode artifacts prove AI authorship. Findings are text-level evidence only.

## Product principles

1. Preserve legitimate text semantics by default.
2. Explain every modification.
3. Keep analysis deterministic and local-first.
4. Separate detection from attribution.
5. Prefer auditable reports over opaque scores.
6. Keep the core library usable without the web UI.

## v0.1 — MVP foundation

Status: implemented in PR #1.

- [x] Detect common zero-width characters.
- [x] Detect bidi control characters.
- [x] Detect Unicode tag characters.
- [x] Detect BOM and soft hyphen.
- [x] Show code points, positions, severity, and context.
- [x] Produce cleaned text.
- [x] Preserve ZWJ and variation selectors by default.
- [x] Provide browser UI and Node test suite.

Exit criteria: deterministic scan and clean APIs with safe defaults.

## v0.2 — Text Forensics Core

Status: in progress.

- [x] Define versioned JSON report schema.
- [x] Add original-versus-cleaned change list.
- [x] Add a practical confusable/homoglyph detector for common Latin-lookalike characters.
- [x] Add aggregate severity and category summaries.
- [x] Add CLI input from arguments, stdin, and files.
- [x] Add machine-readable JSON output.
- [x] Add stable finding IDs and remediation reasons.
- [x] Add snapshot fixtures for multilingual text.
- [x] Add deterministic fuzz/property tests for scanner invariants.
- [x] Add a version-pinned Unicode Consortium confusables data generator.
- [ ] Integrate the generated full Unicode 17.0.0 confusables mapping into the runtime detector.
- [ ] Add generated-data provenance and integrity metadata.

Exit criteria: the same input produces a stable, explainable report from library and CLI.

## v0.3 — File and Batch Analysis

- [ ] TXT and Markdown file analysis.
- [ ] JSON and CSV text-field analysis without damaging syntax.
- [ ] Source-code safe mode.
- [ ] Directory recursion with include/exclude globs.
- [ ] Batch JSON/JSONL reports.
- [ ] Dry-run and fail-on-severity CLI options.
- [ ] Size limits and streaming for large files.

Exit criteria: Project Purify can scan repositories and document collections safely.

## v0.4 — Web Forensics Workbench

- [ ] Side-by-side original and cleaned diff.
- [ ] Inline markers for invisible characters.
- [ ] Finding filters by severity and category.
- [ ] Confusable highlighting and skeleton preview.
- [ ] Copy clean text and download report actions.
- [ ] Drag-and-drop file analysis.
- [ ] Local-only privacy indicator.
- [ ] Responsive and accessible keyboard navigation.

Exit criteria: a non-technical user can understand what changed and why.

## v0.5 — Browser Extension

- [ ] Chrome/Chromium Manifest V3 extension.
- [ ] Scan selected text.
- [ ] Scan editable fields before copy or submit.
- [ ] Context-menu action: Purify selection.
- [ ] Optional page-level suspicious-character indicator.
- [ ] Firefox compatibility assessment.
- [ ] No remote text upload by default.

Exit criteria: users can inspect copied web text without opening the full workbench.

## v0.6 — Developer Integrations

- [ ] Publish an npm package.
- [ ] Stable ESM API.
- [ ] GitHub Actions reusable workflow.
- [ ] pre-commit integration example.
- [ ] CI exit codes based on severity policy.
- [ ] SARIF output for code-scanning interfaces.
- [ ] VS Code extension feasibility prototype.

Exit criteria: repositories can automatically detect suspicious Unicode during CI.

## v0.7 — Unicode Coverage and Internationalization

- [ ] Generate character metadata from current Unicode data files.
- [ ] Full confusable skeleton support.
- [ ] Script-mixing analysis.
- [ ] Language/script-aware false-positive reduction.
- [ ] English, Traditional Chinese, and Japanese UI.
- [ ] Explain legitimate ZWJ/ZWNJ and shaping use cases.

Exit criteria: broader coverage does not sacrifice legitimate multilingual text.

## v0.8 — Forensic Evidence and Reproducibility

- [ ] Reproducible report metadata and tool version.
- [ ] SHA-256 input/output hashes.
- [ ] Optional immutable audit bundle.
- [ ] Report schema documentation.
- [ ] Comparison of two reports.
- [ ] Explicit evidence limitations and confidence language.

Exit criteria: reports can be independently reproduced and reviewed.

## v0.9 — Hardening

- [ ] Security review.
- [ ] Performance benchmark suite.
- [ ] Unicode torture corpus.
- [ ] Cross-platform CLI testing.
- [ ] Accessibility audit.
- [ ] Documentation review.
- [ ] API deprecation policy.

Exit criteria: no known critical correctness, security, or accessibility defects.

## v1.0 — Stable Release

- [ ] Stable scanner, cleaner, report, and CLI APIs.
- [ ] Stable report schema with migration policy.
- [ ] Web workbench release.
- [ ] Browser extension release.
- [ ] npm release.
- [ ] CI integration documentation.
- [ ] Threat model and limitations documentation.
- [ ] Versioned changelog and release process.

Exit criteria: Project Purify is suitable for routine personal and developer use.

## Future research

These items are research tracks. They are not claims of current capability.

- Statistical analysis of unusual Unicode patterns across text sources.
- Provenance metadata standards for generated content.
- Integration with C2PA or cryptographic content provenance where applicable.
- Detection of visually deceptive identifiers in source code.
- IDE diagnostics for Unicode security issues.

The project will not convert these signals into an unsupported "AI-generated" probability score.
