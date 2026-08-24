# API Compatibility and Deprecation Policy

Project Purify is pre-1.0. Public APIs can still change while correctness and safety are hardened. This document defines the compatibility rules that apply before and after 1.0.

## Public surfaces

The following are public surfaces when exported from `src/index.js` or documented for external use:

- ESM library exports.
- CLI flags and exit codes.
- Forensic report schema.
- Audit-bundle schema.
- SARIF rule identifiers and severity mapping.
- Reusable GitHub Actions workflow inputs.

Files under `src/generated/`, internal helper functions, browser-extension implementation files, and scripts that are not documented as public APIs are internal unless explicitly stated otherwise.

## Pre-1.0 policy

Before 1.0:

1. Breaking changes MAY occur when required for correctness, security, privacy, or preservation of legitimate multilingual text.
2. Breaking changes SHOULD be documented in `CHANGELOG.md` once the changelog is introduced.
3. Report schema changes MUST increment `schemaVersion` when consumers may observe a structural or semantic change.
4. Audit bundle changes MUST increment `bundleVersion` when verification semantics change.
5. CLI exit-code meanings SHOULD remain stable unless a security or correctness problem requires a change.
6. A safer default MAY replace an unsafe default without waiting for a major release. The change MUST be documented.

## 1.x policy

After 1.0:

- Patch releases MUST NOT intentionally break documented public APIs.
- Minor releases MAY add fields, findings, CLI flags, or optional workflow inputs.
- Removal or incompatible semantic changes require a major version unless needed to fix an actively unsafe behavior.
- New report fields SHOULD be additive within the same major schema version when old consumers can safely ignore them.
- Removing or renaming report fields requires a schema-major change.

## Deprecation process

For a normal, non-security deprecation after 1.0:

1. Mark the API as deprecated in documentation.
2. Keep it functional for at least one minor release when practical.
3. Add a replacement path before removal.
4. Add migration guidance.
5. Remove it only in the next major release.

Security-critical behavior can be changed faster. The release notes MUST explain the reason and migration impact.

## Report schema compatibility

Consumers MUST check `schemaVersion` before relying on report structure.

Consumers SHOULD:

- Ignore unknown additive fields.
- Reject unsupported major schema versions when silent misinterpretation would be unsafe.
- Treat severity as policy severity, never as authorship probability.
- Use documented offset units rather than assuming all indexes share one coordinate system.

## CLI compatibility

Stable exit-code intent:

- `0`: analysis completed and policy threshold was not reached.
- `1`: usage or single-input analysis error.
- `2`: one or more batch inputs failed analysis.
- `3`: configured severity policy threshold was reached.

Automation SHOULD match exit-code meaning rather than parsing human-readable text.

## Safety-default changes

Cleaning defaults have stronger compatibility requirements because they can alter user text. A default cleaner MUST prefer preservation when an invisible character can carry legitimate shaping, direction, or presentation semantics.

Aggressive removal MUST require explicit opt-in.
