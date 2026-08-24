# Offset Semantics

Project Purify exposes more than one position unit. Consumers MUST use the correct unit for the target interface.

## Core finding positions

### `charIndex`

`charIndex` is the index produced by JavaScript Unicode code-point iteration (`for...of`).

It counts a supplementary-plane character such as `😀` as one character.

Use `charIndex` for human-facing character positions and Project Purify stable finding IDs.

### `utf16Index`

`utf16Index` is a zero-based UTF-16 code-unit offset.

JavaScript strings and many editor APIs use UTF-16 indexing. A supplementary-plane character such as `😀` occupies two UTF-16 code units.

Example:

```text
😀​z
```

The zero-width character after the emoji has:

```text
charIndex  = 1
utf16Index = 2
```

### `utf16Length`

Token-level findings such as mixed-script findings can span more than one character. `utf16Length` is the UTF-16 code-unit length of that token.

## SARIF

Project Purify emits SARIF `region.charOffset` and `region.charLength` from UTF-16 positions.

This matches the position model used by JavaScript/editor integrations and avoids treating Unicode code-point indexes as UTF-16 offsets.

## JSON and CSV structured analysis

JSON and CSV reports analyze string/field values independently.

Their finding offsets are **field-local**. They are not whole-file offsets.

For that reason, Project Purify SARIF intentionally omits a physical file `region` for structured field-local findings and records a logical field path instead:

- JSON: JSONPath-like field location such as `$.value`.
- CSV: logical row/column description.

Consumers MUST NOT convert a field-local offset into a file offset without reparsing the original structured file.

## Diff positions

`transformations.changes[].originalStart` and `cleanedStart` currently use JavaScript string indexes from the deterministic diff implementation. They therefore represent UTF-16 code-unit offsets.

Consumers SHOULD use these fields only for original/cleaned comparison. Do not substitute them for finding `charIndex`.

## Bytes and files

File-analysis `bytes` values are filesystem byte sizes. They are not text positions.

Streaming analysis is intentionally detect-only. Token-level transformations that require complete cross-chunk context are not claimed in streaming mode.

## Rule

When exporting to another system, document the conversion explicitly:

```text
human character position -> charIndex
JavaScript/editor/SARIF -> utf16Index / utf16Length
structured field -> field-local position + logical path
filesystem size -> bytes
```
