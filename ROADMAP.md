# Project Purify Roadmap

Project Purify is a Unicode text-forensics toolkit. It detects invisible and suspicious Unicode characters, explains the findings, and produces a controlled clean version.

Project Purify MUST NOT claim that Unicode artifacts prove AI authorship. Findings are text-level evidence only.

## Product principles

1. Preserve legitimate text semantics by default.
2. Explain every modification.
3. Keep analysis deterministic and local-first.
4. Separate detection from attribution.
5. Prefer auditable reports over opaque scores.
6. Keep one shared detection core for CLI, web, extensions, and future editor integrations.
7. Treat UTS #39 skeleton mappings as comparison data, not automatic proof that a character is suspicious.

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

Status: implemented in PR #1.

- [x] Define versioned JSON report schema.
- [x] Add original-versus-cleaned change list.
- [x] Add confusable/homoglyph detection.
- [x] Add UTS #39 skeleton generation.
- [x] Separate raw skeleton mappings from reportable suspicious findings.
- [x] Suppress ASCII source mappings by default to reduce full-data false positives.
- [x] Add aggregate severity and category summaries.
- [x] Add CLI input from arguments, stdin, and files.
- [x] Add machine-readable JSON output.
- [x] Add stable finding IDs and remediation reasons.
- [x] Add snapshot fixtures for multilingual text.
- [x] Add deterministic fuzz/property tests for scanner invariants.
- [x] Add a version-pinned Unicode Consortium confusables data generator.
- [x] Integrate generated Unicode 17.0.0 confusables data into the runtime detector.
- [x] Add generated-data provenance and SHA-256 integrity metadata.
- [x] Verify full generated data in CI while retaining an offline fallback dataset.

Exit criteria: the same build and input produce a stable, explainable report from library and CLI, with its Unicode data source recorded in the report.

## v0.3 — File and Batch Analysis

Status: implemented in PR #1.

- [x] TXT and Markdown file analysis.
- [x] JSON text-field analysis without modifying non-string values.
- [x] CSV field analysis with quoted-field parsing and safe serialization.
- [x] Source-code safe mode with detect-only rewrite policy.
- [x] Directory recursion with include/exclude globs.
- [x] Default exclusion of `.git` and `node_modules`.
- [x] Batch JSON/JSONL reports.
- [x] Dry-run and fail-on-severity CLI options.
- [x] Stable automation exit-code categories.
- [x] File size limits.
- [x] Detect-only streaming for large plain-text and source files.
- [x] Findings caps and a separate streaming byte ceiling.

Exit criteria: Project Purify can scan repositories and document collections safely without authorizing unsafe source-code rewrites.

## v0.4 — Web Forensics Workbench

Status: implemented in PR #1; browser runtime verification remains required before release.

- [x] Side-by-side original and cleaned workspace.
- [x] Inline markers for invisible characters.
- [x] Finding filters by severity and category.
- [x] Confusable annotation and skeleton preview.
- [x] Copy clean text and download report actions.
- [x] Drag-and-drop TXT/Markdown analysis.
- [x] Local-only privacy indicator and no remote script dependency.
- [x] Responsive layout and keyboard-accessible file drop target.
- [x] Reusable workbench model with Node tests.
- [x] Local-first HTML smoke tests.

Exit criteria: a non-technical user can understand what changed and why without uploading text to a remote service.

## v0.5 — Browser Extension

Status: implemented in PR #1; Chromium and Firefox runtime verification remains required before release.

- [x] Chrome/Chromium Manifest V3 extension shell.
- [x] Analyze selected page or editable-field text.
- [x] Local copy-event inspection.
- [x] Local form-submit inspection without blocking submission.
- [x] Context-menu action for explicit selection analysis.
- [x] On-demand visible-page scan through `activeTab`.
- [x] Page-level finding badge summary.
- [x] Exclude password fields from content-script inspection.
- [x] No remote text transport API.
- [x] No persistent broad `host_permissions` requirement.
- [x] Reuse scanner/report/workbench/generated-data core at build time.
- [x] Firefox API compatibility assessment.
- [x] Firefox `background.scripts` fallback for current MV3 background differences.
- [x] Prefer `browser.*` with `chrome.*` fallback.
- [x] Extension packaging and privacy-boundary tests.

Exit criteria: users can inspect selected or visible web text locally without opening the full workbench or granting a remote text service access.

## v0.6 — Developer Integrations

Status: in progress in PR #1.

- [ ] Publish an npm package. Blocked until release verification and package-readiness review.
- [x] Define one public ESM entry point through package `exports`.
- [x] Add Node `>=20` engine contract.
- [x] Add GitHub Actions reusable workflow.
- [x] Add pre-commit integration guidance.
- [x] Add CI exit codes based on severity policy.
- [x] Add SARIF 2.1.0 output for code-scanning interfaces.
- [x] Keep JSON/CSV field-local positions from being misreported as whole-file SARIF regions.
- [x] Add developer integration documentation.
- [x] Complete VS Code extension feasibility architecture.
- [x] Add public API, workflow, SARIF, and CLI integration tests.

Exit criteria: repositories can use Project Purify as a deterministic Unicode policy check. npm publication remains a release action, not a prerequisite for validating the integration design.

## v0.7 — Unicode Coverage and Internationalization

Status: next after v0.6 validation.

- [ ] Generate broader character metadata from version-pinned Unicode data files.
- [ ] Add stronger mixed-script analysis.
- [ ] Add language/script-aware false-positive reduction.
- [ ] Add identifier-focused security profile for source code.
- [ ] Add English UI.
- [ ] Add Traditional Chinese UI.
- [ ] Add Japanese UI.
- [ ] Explain legitimate ZWJ/ZWNJ and shaping use cases in context.
- [ ] Add full-data false-positive corpus for ordinary multilingual prose.

Exit criteria: broader Unicode coverage does not sacrifice legitimate multilingual text.

## v0.8 — Forensic Evidence and Reproducibility

- [ ] Add reproducible tool/build metadata to reports.
- [ ] Add SHA-256 input/output hashes.
- [ ] Add optional immutable audit bundle.
- [ ] Publish report schema documentation.
- [ ] Compare two reports deterministically.
- [ ] Define explicit evidence limitations and confidence language.
- [ ] Document UTF-16 versus code-point versus byte offsets for each output format.

Exit criteria: reports can be independently reproduced and reviewed.

## v0.9 — Hardening

- [ ] Security review.
- [ ] Performance benchmark suite.
- [ ] Unicode torture corpus.
- [ ] Cross-platform CLI testing.
- [ ] Chromium extension runtime test matrix.
- [ ] Firefox extension runtime test matrix.
- [ ] Accessibility audit.
- [ ] Documentation review.
- [ ] API deprecation policy.

Exit criteria: no known critical correctness, security, privacy, or accessibility defects.

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
- IDE diagnostics backed by Project Purify's shared core.

The project will not convert these signals into an unsupported "AI-generated" probability score.
