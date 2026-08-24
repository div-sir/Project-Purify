# Release Readiness Checklist

This checklist gates the transition from the development line to a stable Project Purify release.

## Correctness

- [ ] Full Node test suite passes with fallback Unicode data.
- [ ] Full Node test suite passes after generating pinned Unicode 17 data.
- [ ] Unicode torture corpus passes.
- [ ] Ordinary multilingual false-positive corpus passes.
- [ ] Supplementary-character SARIF offsets are verified.
- [ ] Conservative cleaning preserves ZWNJ, ZWJ, direction controls, and variation selectors by default.
- [ ] Aggressive cleaning is explicit and documented.

## Security and privacy

- [ ] Threat-model checklist is complete.
- [ ] Browser extension source has no remote text transport path.
- [ ] Password fields remain excluded.
- [ ] Source files remain detect-only.
- [ ] File and stream size limits are enforced.
- [ ] Audit-bundle tamper tests pass.
- [ ] Generated Unicode data remains version-pinned and hashed.

## Performance

- [ ] `npm run benchmark -- --assert` passes on the reference CI runner.
- [ ] No benchmark case regresses beyond its documented budget without review.
- [ ] Large-file streaming remains bounded by byte and finding limits.

## Portability

- [ ] Linux Node 20 tests pass.
- [ ] Linux Node 22 tests pass.
- [ ] macOS Node 20 tests pass.
- [ ] macOS Node 22 tests pass.
- [ ] Windows Node 20 tests pass.
- [ ] Windows Node 22 tests pass.
- [ ] `npm pack --dry-run` succeeds on the cross-platform matrix.

## Browser runtime

- [ ] Chromium extension runtime matrix is recorded.
- [ ] Firefox extension runtime matrix is recorded.
- [ ] Workbench runtime matrix is recorded in Chromium.
- [ ] Workbench runtime matrix is recorded in Firefox.
- [ ] Workbench runtime matrix is recorded in Safari/WebKit where available.

## Accessibility

- [ ] Automated accessibility smoke tests pass.
- [ ] Keyboard-only audit is complete.
- [ ] Screen-reader audit is complete.
- [ ] 200% zoom/reflow audit is complete.
- [ ] Light/dark focus visibility is checked.

## API and evidence

- [ ] Public ESM exports are reviewed.
- [ ] CLI flags and exit codes are frozen for 1.0.
- [ ] Report schema migration policy is documented.
- [ ] Audit bundle version policy is documented.
- [ ] API deprecation policy is approved.
- [ ] Attribution limitations remain machine-readable.

## Packaging and documentation

- [ ] `package.json` package contents are reviewed.
- [ ] `private` is removed only immediately before intentional npm publication.
- [ ] README matches actual stable behavior.
- [ ] SECURITY.md is current.
- [ ] Threat model is current.
- [ ] Report schema and offset documentation are current.
- [ ] Browser runtime notes are current.
- [ ] CHANGELOG.md exists and includes the release.
- [ ] License and package metadata are correct.

## Release operations

- [ ] Create a release candidate tag.
- [ ] Run the complete release matrix against the exact tag.
- [ ] Confirm no unreviewed generated-data changes exist.
- [ ] Publish npm package only from the verified tag.
- [ ] Publish browser extension artifacts only from the verified tag.
- [ ] Create GitHub Release with checksums and release notes.
