# Firefox Compatibility Assessment

Assessment date: 2026-08-24

This document records the expected compatibility of the Project Purify Manifest V3 extension with current Firefox WebExtensions APIs. It is an API-level assessment until the extension is loaded and exercised in Firefox during release verification.

## Current design

Project Purify uses one extension source tree for Chromium and Firefox where practical.

- The code selects `globalThis.browser` when available and falls back to `globalThis.chrome`.
- The manifest specifies both `background.scripts` and `background.service_worker`.
- Chromium uses the service worker.
- Firefox uses the background script fallback because Firefox does not currently support extension background service workers.
- Core forensic logic is copied from `src/` during `npm run build:extension`; detector rules are not duplicated in the extension source.

## API compatibility

| Capability | Firefox assessment | Project Purify handling |
| --- | --- | --- |
| Manifest V3 `action` | Supported | Uses `action` popup and badge APIs. |
| Background service worker | Not supported by Firefox | Manifest also supplies `background.scripts`. |
| `action.openPopup()` | Supported in MV3 | Called from context-menu user action; fallback badge is used if opening fails. |
| `storage.session` | Supported | Stores only an explicit context-menu selection until the popup consumes it. |
| `scripting.executeScript()` | Supported in MV3 | Uses `activeTab` after explicit user interaction. |
| `contextMenus` | Supported alias for Firefox `menus` | Uses the cross-browser `contextMenus` name. |
| Dynamic module import in content scripts | Supported for extension URLs | Imports `core/workbench.js` through `runtime.getURL()`. |
| `browser.*` Promise namespace | Preferred in Firefox | Selected automatically when available. |

## Privacy boundary

The extension does not request broad host permissions. It uses `activeTab` for explicit popup actions and a manifest content script for local copy/submit checks.

The content script:

- Does not inspect password fields.
- Does not send raw copy or form text to the background script.
- Sends only finding counts and severity summary for copy/submit events.
- Caps event text analysis at 1 MiB.
- Does not block a copy or form submission.

The context-menu workflow stores the selected text in extension session storage because the user explicitly requested analysis of that selection. The popup removes the pending selection after reading it.

## Known browser differences

1. Firefox does not currently implement Manifest V3 extension background service workers. Keep the `background.scripts` fallback until Mozilla changes this support status.
2. Built-in browser pages, PDF viewers, reader views, and other privileged pages can reject `activeTab` or script injection. The popup reports that selection access is unavailable instead of requesting broader permissions.
3. Firefox extension resources use a randomized `moz-extension://` origin. Code must use `runtime.getURL()` and must not assume a stable extension origin.
4. `action.openPopup()` is subject to user-action restrictions. The context-menu click is treated as a user action; the badge fallback remains required for browsers or situations where the popup cannot open.

## Release verification required

Before calling Firefox support production-ready:

- Load the built extension from `dist/extension` in `about:debugging`.
- Confirm the background script starts.
- Confirm context-menu selection opens or prepares the popup.
- Confirm toolbar selection analysis works on normal HTTPS pages.
- Confirm copy and form-submit finding badges work.
- Confirm password fields are not read.
- Confirm privileged pages fail closed without requesting extra permissions.
- Run the same multilingual and confusable fixtures used by the core test suite.

## Official references

- https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background
- https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/action/openPopup
- https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/session
- https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/scripting/executeScript
- https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/menus
- https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts
- https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Chrome_incompatibilities
