const RULES = [
  { name: 'Zero Width Space', code: 0x200B, severity: 'high', remove: true },
  { name: 'Zero Width Non-Joiner', code: 0x200C, severity: 'medium', remove: true },
  { name: 'Zero Width Joiner', code: 0x200D, severity: 'medium', remove: false },
  { name: 'Left-to-Right Mark', code: 0x200E, severity: 'high', remove: true },
  { name: 'Right-to-Left Mark', code: 0x200F, severity: 'high', remove: true },
  { name: 'Word Joiner', code: 0x2060, severity: 'high', remove: true },
  { name: 'Zero Width No-Break Space / BOM', code: 0xFEFF, severity: 'high', remove: true },
  { name: 'Soft Hyphen', code: 0x00AD, severity: 'medium', remove: true },
  { name: 'Mongolian Vowel Separator', code: 0x180E, severity: 'medium', remove: true }
];

const BIDI_RANGES = [
  [0x202A, 0x202E],
  [0x2066, 0x2069]
];

const VARIATION_SELECTORS = [
  [0xFE00, 0xFE0F],
  [0xE0100, 0xE01EF]
];

function inRanges(cp, ranges) {
  return ranges.some(([a, b]) => cp >= a && cp <= b);
}

function codeLabel(cp) {
  return `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;
}

export function classifyCodePoint(cp) {
  const exact = RULES.find((r) => r.code === cp);
  if (exact) return { ...exact, codePoint: cp, label: codeLabel(cp), category: 'format-control' };

  if (inRanges(cp, BIDI_RANGES)) {
    return {
      name: 'Bidirectional Control',
      codePoint: cp,
      label: codeLabel(cp),
      category: 'bidi-control',
      severity: 'high',
      remove: true
    };
  }

  if (inRanges(cp, VARIATION_SELECTORS)) {
    return {
      name: 'Variation Selector',
      codePoint: cp,
      label: codeLabel(cp),
      category: 'variation-selector',
      severity: 'low',
      remove: false
    };
  }

  if (cp >= 0xE0000 && cp <= 0xE007F) {
    return {
      name: 'Unicode Tag Character',
      codePoint: cp,
      label: codeLabel(cp),
      category: 'tag-character',
      severity: 'high',
      remove: true
    };
  }

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
        char: ch,
        utf16Index,
        charIndex,
        context: text.slice(Math.max(0, utf16Index - 12), utf16Index + ch.length + 12)
      });
    }
    utf16Index += ch.length;
    charIndex += 1;
  }

  return {
    findings,
    count: findings.length,
    highRiskCount: findings.filter((f) => f.severity === 'high').length
  };
}

export function cleanText(text, options = {}) {
  const {
    removeZeroWidthJoiner = false,
    removeVariationSelectors = false,
    normalize = 'NFC'
  } = options;

  let out = '';
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    const c = classifyCodePoint(cp);
    if (!c) {
      out += ch;
      continue;
    }

    if (cp === 0x200D && !removeZeroWidthJoiner) {
      out += ch;
      continue;
    }

    if (c.category === 'variation-selector' && !removeVariationSelectors) {
      out += ch;
      continue;
    }

    if (!c.remove && !(cp === 0x200D && removeZeroWidthJoiner) && !(c.category === 'variation-selector' && removeVariationSelectors)) {
      out += ch;
    }
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
