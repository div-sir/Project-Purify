# Changelog

All notable Project Purify changes are recorded here.

Project Purify uses semantic versioning for public releases. Development milestones can use `-dev` versions before the first stable release.

## [Unreleased]

### Added

- Release metadata consistency checks.
- Cross-platform hardening workflow for Linux, macOS, and Windows.
- Performance regression budgets and Unicode torture corpus.
- Threat model, security policy, accessibility checklist, API compatibility policy, browser runtime matrix, and release checklist.

### Changed

- Browser extension page access now uses explicit `activeTab + scripting` instead of persistent all-site content-script injection.
- Unicode data downloads are bounded, timed out, HTTPS-only, and restricted to `www.unicode.org`.
- Conservative cleaning preserves shaping-, direction-, presentation-, and tag-sensitive Unicode by default.
- GitHub Actions workflows use current action runtimes.

### Fixed

- Streaming mode no longer implies that mixed-script analysis returned zero findings when that analysis was not evaluated.
- Unicode script-data generation no longer records a non-deterministic generation timestamp.

## [0.9.0-dev]

Hardening milestone in progress. This is not a published npm release.

## [0.8.0-dev]

Added reproducible forensic evidence, SHA-256 hashes, audit bundles, report comparison, evidence interpretation metadata, and documented offset semantics.

## [0.7.0-dev]

Added Unicode script metadata, language-aware mixed-script analysis, multilingual false-positive corpus, and English/Traditional Chinese/Japanese Workbench localization.

## [0.6.0-dev]

Added public ESM API boundaries, SARIF output, reusable CI integration, developer integration guidance, and VS Code feasibility architecture.

## [0.5.0-dev]

Added the browser extension implementation using the shared forensic core.

## [0.4.0-dev]

Added the local Web Forensics Workbench.

## [0.3.0-dev]

Added file, batch, repository, structured-data, source-code detect-only, and large-file streaming analysis.

## [0.2.0-dev]

Added versioned forensic reports, UTS #39 confusable analysis, CLI support, generated Unicode data, stable findings, and robustness tests.

## [0.1.0]

Initial scanner, conservative cleaner, browser UI, and Node test suite.
