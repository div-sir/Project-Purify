const RULES = [
  { name: 'Zero Width Space', code: 0x200B, severity: 'high', remove: true, reason: 'Invisible spacing can change text comparison or matching.', remediation: 'Remove unless the source format or writing system explicitly requires it.' },
  { name: 'Zero Width Non-Joiner', code: 0x200C, severity: 'medium', remove: false, reason: 'This character is invisible and can be required for correct shaping in languages such as Persian.', remediation: 'Preserve by default. Remove only when the writing system does not require shaping control.' },
  { name: 'Zero Width Joiner', code: 0x200D, severity: 'medium', remove: false, reason: 'This character is invisible but can be required for emoji or script shaping.', remediation: 'Preserve by default. Remove only in aggressive cleaning when shaping loss is acceptable.' },
  { name: 'Left-to-Right Mark', code: 0x200E, severity: 'high', remove: false, reason: 'Directional marks can alter visual ordering without visible content, but they can also be legitimate in bidirectional text.', remediation: 'Preserve by default. Remove only after reviewing the intended bidirectional layout.' },
  { name: 'Right-to-Left Mark', code: 0x200F, severity: 'high', remove: false, reason: 'Directional marks can alter visual ordering without visible content, but they can also be legitimate in bidirectional text.', remediation: 'Preserve by default. Remove only after reviewing the intended bidirectional layout.' },
  { name: 'Word Joiner', code: 0x2060, severity: 'high', remove: true, reason: 'Invisible joining can change wrapping and text comparison.', remediation: 'Remove in ordinary prose unless non-breaking behavior is required.' },
  { name: 'Zero Width No-Break Space / BOM', code: 0xFEFF, severity: 'high', remove: true, reason: 'An embedded BOM is usually unnecessary and can affect parsing or comparison.', remediation: 'Remove embedded BOM characters. Preserve file-level encoding metadata separately.' },
  { name: 'Soft Hyphen', code: 0x00AD, severity: 'medium', remove: true, reason: 'Soft hyphen is normally invisible and can alter search or token matching.', remediation: 'Remove unless discretionary hyphenation is intentionally required.' },
  { name: 'Mongolian Vowel Separator', code: 0x180E, severity: 'medium', remove: true, reason: 'This deprecated-format character can be invisible in many renderers.', remediation: 'Remove unless processing legacy Mongolian text that requires it.' }
];

const BIDI_RANGES = [[0x202A, 0x202E], [0x2066, 0x2069]];
const VARIATION_SELECTORS = [[0xFE00, 0xFE0F], [0xE0100, 0xE01EF]];

function inRanges(cp, ranges) {
  return ranges.some(([a, b]) => cp >= a && cp <= b);
}

function codeLabel(cp) {
  return `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;
}

function stableId(kind, label, charIndex) {
  return `${kind}:${label}:${charIndex}`;
}

export function classifyCodePoint(cp) {
  const exact = RULES.find((r) => r.code === cp);
  if (exact) return { ...exact, codePoint: cp, label: codeLabel(cp), category: 'format-control' };

  if (inRanges(cp, BIDI_RANGES)) return {
    name: 'Bidirectional Control',
    codePoint: cp,
    label: codeLabel(cp),
    category: 'bidi-control',
    severity: 'high',
    remove: false,
    reason: 'Bidirectional controls can reorder visible text and obscure the logical character sequence, but some are legitimate in bidirectional text.',
    remediation: 'Preserve by default. Remove only after reviewing the intended bidirectional layout or when using an explicit aggressive policy.'
  };

  if (inRanges(cp, VARIATION_SELECTORS)) return { name: 'Variation Selector', codePoint: cp, label: codeLabel(cp), category: 'variation-selector', severity: 'low', remove: false, reason: 'Variation selectors are invisible but may select a required glyph presentation.', remediation: 'Preserve by default. Remove only when presentation differences are not needed.' };

  if (cp >= 0xE0000 && cp <= 0xE007F) return {
    name: 'Unicode Tag Character',
    codePoint: cp,
    label: codeLabel(cp),
    category: 'tag-character',
    severity: 'high',
    remove: false,
    reason: 'Tag characters can carry hidden metadata-like text, but standardized emoji tag sequences can also use them legitimately.',
    remediation: 'Preserve by default. Remove only after confirming that the tag sequence is not required.'
  };

  return null;
}

export function scanText(text) {
  const findings = [];
  let utf16Index = 0;
  let charIndex = 0;

  for (const ch of text) {
    const cp = ch.codePointAt(0);
    const classification = classifyCodePoint(cp);
    if (classification) {
      findings.push({
        ...classification,
        id: stableId('unicode', classification.label, charIndex),
        type: 'unicode',
        char: ch,
        utf16Index,
        charIndex,
        context: text.slice(Math.max(0, utf16Index - 12), utf16Index + ch.length + 12)
      });
    }
    utf16Index += ch.length;
    charIndex += 1;
  }

  return { findings, count: findings.length, highRiskCount: findings.filter((f) => f.severity === 'high').length };
}

function shouldRemove(classification, cp, options) {
  if (cp === 0x200C) return options.removeZeroWidthNonJoiner;
  if (cp === 0x200D) return options.removeZeroWidthJoiner;
  if (cp === 0x200E || cp === 0x200F || classification.category === 'bidi-control') return options.removeDirectionalControls;
  if (classification.category === 'variation-selector') return options.removeVariationSelectors;
  if (classification.category === 'tag-character') return options.removeTagCharacters;
  return classification.remove;
}

export function cleanText(text, options = {}) {
  const {
    removeZeroWidthNonJoiner = false,
    removeZeroWidthJoiner = false,
    removeDirectionalControls = false,
    removeVariationSelectors = false,
    removeTagCharacters = false,
    normalize = 'NFC'
  } = options;
  const policy = {
    removeZeroWidthNonJoiner,
    removeZeroWidthJoiner,
    removeDirectionalControls,
    removeVariationSelectors,
    removeTagCharacters
  };
  let out = '';

  for (const ch of text) {
    const cp = ch.codePointAt(0);
    const classification = classifyCodePoint(cp);
    if (!classification || !shouldRemove(classification, cp, policy)) out += ch;
  }

  return normalize ? out.normalize(normalize) : out;
}

export function visualizeText(text) {
  let out = '';
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    const c = classifyCodePoint(cp);
    out += c ? `⟦${c.label} ${c.name}⟧` : ch;
  }
  return out;
}
