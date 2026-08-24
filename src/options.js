export function normalizeReportOptions(options = {}) {
  const clean = options.clean ?? {};
  const confusables = options.confusables ?? {};
  const scripts = options.scripts ?? {};

  return {
    clean: {
      removeZeroWidthNonJoiner: clean.removeZeroWidthNonJoiner === true,
      removeZeroWidthJoiner: clean.removeZeroWidthJoiner === true,
      removeDirectionalControls: clean.removeDirectionalControls === true,
      removeVariationSelectors: clean.removeVariationSelectors === true,
      removeTagCharacters: clean.removeTagCharacters === true,
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
