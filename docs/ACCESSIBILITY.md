# Accessibility Audit

Project Purify's Web Workbench and browser-extension popup MUST remain usable without a mouse and MUST not rely on color alone to communicate forensic meaning.

## Current design requirements

### Keyboard

- Native buttons and selects are used for actions and filters.
- Focus-visible styles are present.
- The Workbench file drop target supports `Enter` and `Space`.
- Findings remain readable without hover-only interactions.

### Screen readers

- Textareas have accessible labels.
- Dynamic status areas use `aria-live` where status updates matter.
- Summary regions have descriptive labels.
- Tables use semantic table elements and header cells.

### Visual presentation

- Severity is written as text, not represented by color alone.
- The layout collapses for narrow screens.
- Text is not embedded into images.
- System light/dark appearance remains supported through `color-scheme`.

### Motion

Project Purify does not require motion or animation to understand findings.

## v0.9 automated checks

The repository SHOULD keep smoke tests that verify:

- Required controls exist.
- Interactive non-native controls have keyboard handlers.
- Local-only privacy text remains visible.
- Status regions retain `aria-live` where required.
- Findings tables retain semantic headers.
- Extension popup retains labeled textareas and buttons.

Automated markup checks do not replace assistive-technology testing.

## Manual release audit

Before v1.0, test the Workbench and extension popup with:

### Keyboard-only

- [ ] Reach every interactive element using Tab/Shift+Tab.
- [ ] Activate every action without a pointer.
- [ ] Open a file through the keyboard-accessible drop target.
- [ ] Change language, analysis policy, severity, and category filters.
- [ ] Confirm focus is always visible.
- [ ] Confirm no keyboard trap exists.

### Screen reader

- [ ] macOS Safari + VoiceOver.
- [ ] Chromium + a platform screen reader where available.
- [ ] Verify editor labels, filter labels, summary values, table headers, and status changes.
- [ ] Verify findings can be understood without relying on visual marker position alone.

### Zoom and reflow

- [ ] Browser zoom at 200%.
- [ ] Browser zoom at 400% where practical.
- [ ] Narrow mobile viewport.
- [ ] No essential control is clipped or requires two-dimensional scrolling outside wide forensic tables.

### Contrast and color independence

- [ ] Check focus indicators in light mode.
- [ ] Check focus indicators in dark mode.
- [ ] Confirm severity remains understandable with color perception disabled.

## Known release gate

A complete manual assistive-technology audit has not yet been recorded. v0.9 MUST NOT mark accessibility verification complete until the manual matrix is executed and results are documented.
