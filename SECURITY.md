# Security Policy

Project Purify processes untrusted text and may be used in source-code and forensic workflows. Security and privacy reports are welcome.

## Supported versions

Project Purify is currently pre-1.0. Until the first stable release, security fixes are applied to the active development line.

## Reporting a vulnerability

Prefer a private GitHub security report when the repository offers that option. Do not publish exploit details, private text, credentials, or sensitive forensic material in a public issue.

If a private reporting channel is not available, open a minimal public issue that states that you have a security concern without including sensitive reproduction data. A maintainer can then establish an appropriate private channel.

Include when safe:

- Affected version or commit.
- Affected surface: core, CLI, Workbench, extension, CI, Unicode generator, SARIF, or audit bundle.
- Impact.
- Minimal reproduction steps.
- Whether untrusted text or a malicious repository is required.
- Whether the issue can expose analyzed text.

## Priority areas

High-priority issues include:

- Remote or unintended transmission of analyzed text.
- Reading password fields or other excluded browser inputs.
- Automatic source-code modification despite `detect-only` policy.
- Path traversal or arbitrary file access outside requested scan scope.
- Unbounded memory/CPU behavior reachable with practical untrusted input.
- Incorrect audit-bundle integrity claims.
- Unicode data provenance bypass or silent unpinned data changes.
- A cleaner default that destroys legitimate multilingual semantics.

## Scope limitations

A false positive, by itself, is normally a correctness issue rather than a security vulnerability. However, false positives or false negatives that make a documented security policy materially unsafe should be reported as security-sensitive.

Project Purify findings do not prove AI authorship, malicious intent, or identity.
