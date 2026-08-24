# Release Process

This document defines the release procedure for Project Purify.

A release MUST NOT be published because a version number was changed. The release gates below must pass first.

## 1. Select the release version

Update the same version in:

- `package.json`
- `src/version.js`
- README current-status text
- `CHANGELOG.md`

Run:

```bash
npm run check:release-metadata
```

For a public npm release, remove the `-dev` suffix and set `package.json` `private` to `false` only after all release gates pass. Then run:

```bash
npm run check:release-metadata -- --release
```

## 2. Validate report compatibility

Confirm:

- `REPORT_SCHEMA_VERSION` matches `docs/REPORT-SCHEMA.md`.
- Schema changes follow `docs/API-COMPATIBILITY.md`.
- Offset semantics remain consistent with `docs/OFFSETS.md`.
- Audit bundle behavior remains compatible or its bundle version is changed explicitly.

Do not silently change the meaning of an existing report field.

## 3. Regenerate pinned Unicode data

Run:

```bash
npm run update:unicode-data
npm test
```

Confirm both generated datasets report:

- the intended Unicode version;
- `completeness: full`;
- a source SHA-256;
- the expected Unicode source URL.

The normal GitHub `Test` workflow performs this verification independently.

## 4. Run automated release gates

Required green checks:

```bash
npm test
npm run benchmark -- --assert
npm run build:extension
npm pack --dry-run
```

GitHub Actions must also pass:

- Test workflow on supported Node versions;
- full generated Unicode-data tests;
- Hardening Linux/macOS/Windows matrix;
- benchmark budget job.

A locally passing test suite does not replace GitHub runner verification.

## 5. Run browser runtime matrices

Complete `docs/BROWSER-RUNTIME.md` for the release candidate.

At minimum record:

- browser and exact version;
- operating system;
- Project Purify commit SHA;
- pass/fail result;
- console errors;
- permission warnings.

Static manifest tests do not satisfy this gate.

## 6. Run accessibility verification

Complete the manual checks in `docs/ACCESSIBILITY.md`.

Automated markup smoke tests do not replace keyboard and assistive-technology verification.

## 7. Security and privacy review

Review `docs/THREAT-MODEL.md` and `SECURITY.md` against the release candidate.

Confirm:

- no remote analyzed-text transport was added;
- browser permissions did not broaden unexpectedly;
- password fields remain excluded;
- text-retention bounds remain enforced;
- source-code rewrite policy remains detect-only;
- structured offsets are not presented as whole-file regions;
- Unicode downloads remain bounded and allowlisted;
- evidence severity is not described as AI-authorship probability.

## 8. Package review

Inspect `npm pack --dry-run` output.

The package SHOULD contain only intended public runtime files and documentation. Generated build artifacts, local caches, and test fixtures SHOULD NOT leak into the npm package unless explicitly required.

## 9. Prepare the release commit

Update `CHANGELOG.md`:

- move applicable Unreleased entries to the release version;
- include breaking changes explicitly;
- include report-schema changes explicitly;
- include security/privacy behavior changes explicitly.

Run all automated gates again after the final metadata commit.

## 10. Publish and tag

Only after all release gates pass:

1. Merge the reviewed release PR.
2. Create an annotated Git tag matching the release version.
3. Create the GitHub Release from the changelog.
4. Publish npm when the npm package is part of that release.
5. Build browser-extension release artifacts from the tagged commit.

Do not publish from an uncommitted local working tree.

## 11. Post-release verification

After publication:

- install the npm package in a clean environment;
- run one CLI text scan;
- run one SARIF export;
- build one forensic report through the public ESM API;
- verify the GitHub Release/tag points to the intended commit;
- verify browser release artifacts match the tagged source.

If a release defect affects forensic correctness or evidence interpretation, document it prominently and issue a corrective release rather than silently changing published semantics.
