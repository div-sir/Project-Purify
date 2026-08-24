# v0.9 Security Review

This review covers the Project Purify shared core, cleaning policy, file and streaming analysis, Unicode data generators, Web Workbench, browser extension, evidence APIs, and CI integrations.

Status meanings:

- **Resolved**: code and regression coverage were added in the v0.9 development branch.
- **Accepted limitation**: behavior is explicitly disclosed and is not represented as complete coverage.
- **Open release gate**: implementation exists, but runtime/manual verification is still required.

## Findings

### SR-001 — Semantic Unicode controls were removed too aggressively

**Severity:** High correctness risk  
**Status:** Resolved

The earlier cleaner could remove ZWNJ and direction controls by default. This can damage Persian/Arabic shaping and legitimate bidirectional text.

**Resolution:** Conservative cleaning now preserves ZWNJ, ZWJ, LRM/RLM, bidi controls, variation selectors, and Unicode tag characters. Explicit aggressive options are required to remove them. Detection remains independent from cleaning.

### SR-002 — Unicode tag characters had an unsafe blanket-removal default

**Severity:** Medium correctness risk  
**Status:** Resolved

Unicode tag characters can be suspicious, but standardized emoji tag sequences can use them legitimately.

**Resolution:** Tag characters remain reportable but are preserved by default. Aggressive removal requires explicit opt-in.

### SR-003 — Streaming output implied mixed-script coverage that was not executed

**Severity:** Medium evidence-integrity risk  
**Status:** Resolved / accepted limitation

Chunk-based streaming does not preserve arbitrary token boundaries. Reporting `mixedScriptCount: 0` could be interpreted as a completed negative result.

**Resolution:** Streaming now reports `mixedScriptCount: null` and `analysisCoverage.mixedScriptTokens: not-evaluated`. Human output states the limitation. Full mixed-script token analysis remains an in-memory path.

### SR-004 — Unicode data downloads were not bounded

**Severity:** Medium availability/supply-chain risk  
**Status:** Resolved

Generators previously used an unbounded `response.text()` path.

**Resolution:** Unicode downloads now require HTTPS from `www.unicode.org`, reject redirects, use a timeout, enforce a 16 MiB response cap, validate UTF-8, and validate parsed code points/ranges.

### SR-005 — Script-data generation included a nondeterministic timestamp

**Severity:** Medium reproducibility risk  
**Status:** Resolved

A runtime generation timestamp caused otherwise identical pinned Unicode data to produce different provenance metadata.

**Resolution:** Runtime-dependent generation time was removed from the generated scripts metadata. Source version/date/hash remain the provenance inputs.

### SR-006 — Context-menu selections could remain in extension session storage after popup failure

**Severity:** Medium privacy risk  
**Status:** Resolved

Pending selected text was stored in `storage.session` before attempting to open the popup.

**Resolution:** Pending context text is capped at 1 MiB, truncation is recorded, pending keys are cleared if popup opening fails, and successful popup consumption also clears the keys.

### SR-007 — Extension registered a persistent `<all_urls>` content script

**Severity:** High privacy/least-privilege risk  
**Status:** Resolved

The extension avoided `host_permissions` but still registered a persistent content script across all URLs.

**Resolution:** Persistent `content_scripts` were removed. Copy/submit monitoring is now injected on demand only after explicit extension activation using `activeTab` plus `scripting`. Injection is idempotent per page.

### SR-008 — Browser-selected/page text needed explicit size bounds

**Severity:** Medium resource/privacy risk  
**Status:** Resolved

Large selections or page text could increase memory use and session-storage exposure.

**Resolution:** Page, selection, context-menu, copy, and submit inspection paths are bounded to 1 MiB where applicable and expose truncation status.

### SR-009 — Generated-data and browser runtime behavior still require real environment verification

**Severity:** Release gate  
**Status:** Open release gate

Static tests cannot prove browser API compatibility, permission prompts, or runtime network behavior.

**Required before stable release:** Execute and record the Chromium, Firefox, and Workbench matrices in `BROWSER-RUNTIME.md`.

### SR-010 — Accessibility requires assistive-technology verification

**Severity:** Release gate  
**Status:** Open release gate

Markup regression tests cover keyboard hooks, labels, focus styles, live regions, and semantic tables, but they do not replace screen-reader testing.

**Required before stable release:** Execute and record the manual matrix in `ACCESSIBILITY.md`.

## Additional reviewed controls

- Directory recursion skips symlink entries encountered by `readdir(..., { withFileTypes: true })` because only real directories/files are traversed.
- Source files remain `detect-only`; `--clean` is refused.
- Structured JSON/CSV field-local offsets are not emitted as whole-file SARIF regions.
- SARIF/editor offsets use UTF-16 coordinates.
- In-memory, streaming byte, and findings limits are enforced.
- Audit bundles are canonicalized and SHA-256 integrity checked. They are explicitly not digital signatures.
- Severity remains machine-readable policy severity and is explicitly not attribution probability.
- Extension source regression tests reject common remote text transport APIs.
- Password input types are excluded by a positive allowlist of non-secret text input types.

## Residual risk

Project Purify is a Unicode policy and forensic inspection tool. It cannot prove author intent, malicious intent, or AI authorship. It also cannot guarantee that every Unicode security issue is detected. Consumers requiring high-assurance identifier security should combine Project Purify with language/compiler-specific analysis and Unicode security guidance.
