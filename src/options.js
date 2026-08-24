export function normalizeReportOptions(options = {}) {
  const clean = options.clean ?? {};
  const confusables = options.confusables ?? {};
  const scripts = options.scripts ?? {};

  return {
    clean: {
      removeZeroWidthJoiner: clean.removeZeroWidthJoiner === true,
      removeVariationSelectors: clean.removeVariationSelectors === true,
      normalize: Object.prototype.hasOwnProperty.call(clean, 'normalize') ? clean.normalize : 'NFC'
    },
    confusables: {
      includeAscii: confusables.includeAscii === true
    },
    scripts: {
      languageHint: scripts.languageHint ?? 'auto',
      profile: scripts.profile ?? 'prose',
      strictMixedScript: scripts.strictMixedScript === true
    }
  };
}
