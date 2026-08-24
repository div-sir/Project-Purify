# Browser Runtime Verification

Static tests verify extension packaging, permissions, shared-core copying, and absence of remote text transport APIs. They do not prove that browser runtime behavior works.

This matrix is a v0.9 release gate.

## Chromium matrix

Test the unpacked `dist/extension` build in a current stable Chromium-family browser.

- [ ] Extension loads without manifest errors.
- [ ] Popup opens.
- [ ] Current page selection can be loaded.
- [ ] Selection inside a text input can be loaded.
- [ ] Password fields are not inspected.
- [ ] Context-menu selection analysis works.
- [ ] Visible-page scan works after explicit user action.
- [ ] Copy inspection updates the badge without blocking copy.
- [ ] Form-submit inspection updates the badge without blocking submit.
- [ ] Popup clean-text copy works.
- [ ] No analyzed text appears in network requests.
- [ ] Restricted browser pages fail gracefully.
- [ ] `activeTab` access does not become persistent host access.

## Firefox matrix

Test a temporary extension build in a current stable Firefox release.

- [ ] Manifest loads with the `background.scripts` fallback.
- [ ] Popup opens.
- [ ] Selection analysis works.
- [ ] Context menu works.
- [ ] Visible-page scan works where the API is supported.
- [ ] Badge updates work.
- [ ] Storage session behavior works or degrades safely.
- [ ] Clipboard copy works or uses the documented fallback.
- [ ] No analyzed text appears in network requests.
- [ ] Restricted pages fail gracefully.

## Workbench matrix

Test `index.html` through the local development server in Chromium, Firefox, and Safari/WebKit where available.

- [ ] Paste/input live analysis works.
- [ ] English UI works.
- [ ] Traditional Chinese UI works.
- [ ] Japanese UI works.
- [ ] Analysis-language policy remains independent from UI language.
- [ ] File picker works.
- [ ] Drag-and-drop works.
- [ ] JSON report download works.
- [ ] Clipboard fallback works where needed.
- [ ] Narrow responsive layout remains usable.
- [ ] No text is sent to a remote endpoint.

## Evidence recording

For each runtime test record:

- Browser name and exact version.
- Operating system.
- Project Purify commit SHA.
- Extension manifest version when applicable.
- Pass/fail status.
- Console errors.
- Any permission warning shown by the browser.

Do not mark the Roadmap browser runtime items complete until this matrix has recorded results.
