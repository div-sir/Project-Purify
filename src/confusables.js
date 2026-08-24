import { GENERATED_CONFUSABLES, CONFUSABLES_METADATA } from './generated/confusables-data.js';

function codeLabel(cp) {
  return `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;
}

function scriptOf(cp) {
  if (cp >= 0x0041 && cp <= 0x024F) return 'Latin';
  if (cp >= 0x0370 && cp <= 0x03FF) return 'Greek';
  if (cp >= 0x0400 && cp <= 0x052F) return 'Cyrillic';
  return 'Other';
}

function stableId(label, charIndex) {
  return `confusable:${label}:${charIndex}`;
}

function shouldReportMapping(cp, options) {
  if (options.includeAscii === true) return true;
  return cp > 0x7F;
}

export function getConfusablesMetadata() {
  return { ...CONFUSABLES_METADATA };
}

export function detectConfusables(text, options = {}) {
  const findings = [];
  let utf16Index = 0;
  let charIndex = 0;

  for (const ch of text) {
    const cp = ch.codePointAt(0);
    const replacement = GENERATED_CONFUSABLES.get(cp);
    if (replacement && shouldReportMapping(cp, options)) {
      const label = codeLabel(cp);
      const script = scriptOf(cp);
      findings.push({
        id: stableId(label, charIndex),
        type: 'confusable',
        char: ch,
        codePoint: cp,
        label,
        skeleton: replacement,
        script,
        severity: 'medium',
        reason: `${script} character has a Unicode confusable skeleton of ${JSON.stringify(replacement)}.`,
        remediation: 'Review the character in context. Replace it with the intended script character when mixed-script use is not intentional.',
        dataSource: {
          unicodeVersion: CONFUSABLES_METADATA.unicodeVersion,
          completeness: CONFUSABLES_METADATA.completeness
        },
        utf16Index,
        charIndex
      });
    }
    utf16Index += ch.length;
    charIndex += 1;
  }

  return findings;
}

export function confusableSkeleton(text) {
  let out = '';
  for (const ch of text.normalize('NFD')) {
    const cp = ch.codePointAt(0);
    out += GENERATED_CONFUSABLES.get(cp) ?? ch;
  }
  return out.normalize('NFD');
}
