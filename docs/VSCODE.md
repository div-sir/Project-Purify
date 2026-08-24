# VS Code Extension Feasibility

Status: feasible; implementation is deferred until the core package boundary is validated.

## Goal

A Project Purify VS Code integration should expose Unicode findings as editor diagnostics without changing source code automatically.

The integration should reuse the Project Purify ESM core. It MUST NOT maintain a separate list of Unicode rules.

## Proposed architecture

1. Create one `vscode.DiagnosticCollection` named `project-purify`.
2. Analyze supported text documents after open, save, and debounced edits.
3. Run `buildReport(document.getText())` from the shared core.
4. Convert each finding's code-point `charIndex` to an editor offset and then to a `vscode.Position`.
5. Create one `vscode.Diagnostic` per finding.
6. Clear diagnostics when a document closes or becomes unsupported.

The conversion step is important because Project Purify's `charIndex` counts Unicode code points while VS Code document offsets use UTF-16 positions. The extension MUST convert deliberately instead of treating the two values as interchangeable.

## Diagnostic mapping

| Project Purify severity | VS Code severity |
| --- | --- |
| `high` | Error |
| `medium` | Warning |
| `low` | Information |

Each diagnostic should include:

- Unicode code point label.
- Finding category.
- Reason.
- Remediation guidance.
- Stable Project Purify finding ID.

## Source-code policy

Source code remains `detect-only`.

The VS Code extension SHOULD provide:

- `Project Purify: Scan Current Document`
- `Project Purify: Scan Selection`
- `Project Purify: Copy Purified Selection` for explicitly selected prose/text
- `Project Purify: Show Finding Details`

It MUST NOT expose a blanket "Fix all" command for source code.

A future code action may be safe for individual, explicitly reviewed findings. That action must show the exact character replacement before applying it.

## Performance

Recommended first implementation:

- Debounce edit scans by approximately 250–500 ms.
- Skip or switch to an explicit manual scan above a configurable document-size threshold.
- Cancel stale analysis when a newer document version exists.
- Keep analysis local and deterministic.

The current scanner is synchronous. If profiling shows editor latency on large documents, the integration can move analysis to a worker without changing the scanner API.

## Privacy

The extension should have no telemetry or remote text transport by default.

Project Purify diagnostics can expose sensitive source text in editor surfaces, so diagnostics SHOULD contain only the minimum context needed to identify the Unicode issue.

## Initial prototype acceptance criteria

- Uses the public Project Purify ESM entry point.
- Creates and disposes a `DiagnosticCollection` correctly.
- Maps code-point indices to VS Code UTF-16 document positions correctly, including astral-plane characters before a finding.
- Updates diagnostics after edits without leaving stale results.
- Never offers automatic source-code rewriting.
- Works without network access.
- Has fixture tests for zero-width, bidi, confusable, CJK, Arabic, and emoji ZWJ text.

## References

- VS Code API: `languages.createDiagnosticCollection`
- VS Code API: `Diagnostic`, `DiagnosticCollection`, `TextDocument.positionAt`
- VS Code extension diagnostics guidance

Official documentation:

- https://code.visualstudio.com/api/references/vscode-api
- https://code.visualstudio.com/api/language-extensions/programmatic-language-features
