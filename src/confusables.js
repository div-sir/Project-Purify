const COMMON_CONFUSABLES = new Map([
  [0x0410, 'A'], [0x0430, 'a'], [0x0412, 'B'], [0x0415, 'E'], [0x0435, 'e'],
  [0x041A, 'K'], [0x041C, 'M'], [0x041D, 'H'], [0x041E, 'O'], [0x043E, 'o'],
  [0x0420, 'P'], [0x0440, 'p'], [0x0421, 'C'], [0x0441, 'c'], [0x0422, 'T'],
  [0x0425, 'X'], [0x0445, 'x'], [0x0423, 'Y'], [0x0443, 'y'], [0x0456, 'i'],
  [0x0406, 'I'], [0x0458, 'j'],
  [0x0391, 'A'], [0x03B1, 'a'], [0x0392, 'B'], [0x0395, 'E'], [0x03B5, 'e'],
  [0x0397, 'H'], [0x0399, 'I'], [0x039A, 'K'], [0x039C, 'M'], [0x039D, 'N'],
  [0x039F, 'O'], [0x03BF, 'o'], [0x03A1, 'P'], [0x03C1, 'p'], [0x03A4, 'T'],
  [0x03A7, 'X'], [0x03C7, 'x'], [0x03A5, 'Y'], [0x03BD, 'v']
]);

function codeLabel(cp) {
  return `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;
}

function scriptOf(cp) {
  if ((cp >= 0x0041 && cp <= 0x024F)) return 'Latin';
  if (cp >= 0x0370 && cp <= 0x03FF) return 'Greek';
  if (cp >= 0x0400 && cp <= 0x052F) return 'Cyrillic';
  return 'Other';
}

export function detectConfusables(text) {
  const findings = [];
  let utf16Index = 0;
  let charIndex = 0;

  for (const ch of text) {
    const cp = ch.codePointAt(0);
    const replacement = COMMON_CONFUSABLES.get(cp);
    if (replacement) {
      findings.push({
        type: 'confusable',
        char: ch,
        codePoint: cp,
        label: codeLabel(cp),
        skeleton: replacement,
        script: scriptOf(cp),
        severity: 'medium',
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
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    out += COMMON_CONFUSABLES.get(cp) ?? ch;
  }
  return out;
}
