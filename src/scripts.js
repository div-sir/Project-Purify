import { SCRIPT_RANGES, SCRIPTS_METADATA } from './generated/scripts-data.js';
import { detectConfusables } from './confusables.js';

const SORTED_RANGES = [...SCRIPT_RANGES].sort((a, b) => a[0] - b[0]);
const TOKEN_CHAR = /[\p{L}\p{M}\p{N}\p{Pc}]/u;
const IDENTIFIER_START = /[$_\p{ID_Start}]/u;
const IDENTIFIER_CONTINUE = /[$_\u200C\u200D\p{ID_Continue}]/u;
const IGNORED_SCRIPTS = new Set(['Common', 'Inherited', 'Unknown', 'Other']);

const RISKY_PAIRS = [
  ['Latin', 'Cyrillic'],
  ['Latin', 'Greek'],
  ['Greek', 'Cyrillic'],
  ['Latin', 'Armenian'],
  ['Latin', 'Cherokee']
];

const LANGUAGE_ALLOWED = {
  auto: [
    new Set(['Latin', 'Han', 'Hiragana', 'Katakana']),
    new Set(['Latin', 'Han', 'Bopomofo']),
    new Set(['Latin', 'Han', 'Hangul'])
  ],
  ja: [new Set(['Latin', 'Han', 'Hiragana', 'Katakana'])],
  'zh-Hant': [new Set(['Latin', 'Han', 'Bopomofo'])],
  zh: [new Set(['Latin', 'Han', 'Bopomofo'])],
  ko: [new Set(['Latin', 'Han', 'Hangul'])]
};

function stableId(charIndex, scripts) {
  return `mixed-script:${charIndex}:${scripts.join('+')}`;
}

function isSubset(values, allowed) {
  return values.every((value) => allowed.has(value));
}

function allowedByLanguage(scripts, languageHint) {
  const profiles = LANGUAGE_ALLOWED[languageHint] ?? LANGUAGE_ALLOWED.auto;
  return profiles.some((allowed) => isSubset(scripts, allowed));
}

function riskyPairsFor(scripts) {
  const set = new Set(scripts);
  return RISKY_PAIRS.filter(([a, b]) => set.has(a) && set.has(b)).map(([a, b]) => `${a}+${b}`);
}

export function getScriptsMetadata() {
  return { ...SCRIPTS_METADATA };
}

export function scriptOfCodePoint(cp) {
  let low = 0;
  let high = SORTED_RANGES.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    const [start, end, script] = SORTED_RANGES[mid];
    if (cp < start) high = mid - 1;
    else if (cp > end) low = mid + 1;
    else return script;
  }
  return 'Other';
}

export function scriptsInText(text) {
  const scripts = new Set();
  for (const ch of text) {
    const script = scriptOfCodePoint(ch.codePointAt(0));
    if (!IGNORED_SCRIPTS.has(script)) scripts.add(script);
  }
  return [...scripts].sort();
}

function analyzeToken(token, position, options) {
  const scripts = scriptsInText(token);
  if (scripts.length <= 1) return null;

  const languageHint = options.languageHint ?? 'auto';
  const riskyPairs = riskyPairsFor(scripts);
  const languageAllowed = allowedByLanguage(scripts, languageHint);
  const strictMixedScript = options.strictMixedScript === true;
  if (riskyPairs.length === 0 && (!strictMixedScript || languageAllowed)) return null;

  const confusableEvidence = detectConfusables(token).length;
  const severity = riskyPairs.length > 0 ? (confusableEvidence > 0 ? 'high' : 'medium') : 'low';
  const profile = options.profile ?? 'prose';

  return {
    id: stableId(position.charIndex, scripts),
    type: 'mixed-script',
    category: 'mixed-script',
    token,
    scripts,
    riskyPairs,
    severity,
    languageHint,
    profile,
    confusableEvidenceCount: confusableEvidence,
    charIndex: position.charIndex,
    utf16Index: position.utf16Index,
    codePointLength: [...token].length,
    utf16Length: token.length,
    reason: riskyPairs.length > 0
      ? `One token mixes security-sensitive scripts: ${riskyPairs.join(', ')}.`
      : `One ${profile} token mixes scripts outside the ${languageHint} language profile: ${scripts.join(', ')}.`,
    remediation: profile === 'identifier'
      ? 'Review the identifier character-by-character. Prefer one intentional script and reject visually deceptive substitutions.'
      : 'Review the token in context. Preserve legitimate multilingual text; replace unintended cross-script lookalikes.'
  };
}

function collectTokens(text, mode) {
  const tokens = [];
  let token = '';
  let tokenUtf16 = 0;
  let tokenChar = 0;
  let utf16Index = 0;
  let charIndex = 0;
  let active = false;

  const flush = () => {
    if (token) tokens.push({ token, utf16Index: tokenUtf16, charIndex: tokenChar });
    token = '';
    active = false;
  };

  for (const ch of text) {
    const starts = mode === 'identifier' ? IDENTIFIER_START.test(ch) : TOKEN_CHAR.test(ch);
    const continues = mode === 'identifier' ? IDENTIFIER_CONTINUE.test(ch) : TOKEN_CHAR.test(ch);

    if (!active) {
      if (starts) {
        active = true;
        token = ch;
        tokenUtf16 = utf16Index;
        tokenChar = charIndex;
      }
    } else if (continues) {
      token += ch;
    } else {
      flush();
      if (mode !== 'identifier' && starts) {
        active = true;
        token = ch;
        tokenUtf16 = utf16Index;
        tokenChar = charIndex;
      }
    }

    utf16Index += ch.length;
    charIndex += 1;
  }
  flush();
  return tokens;
}

export function analyzeScripts(text, options = {}) {
  const profile = options.profile ?? 'prose';
  const tokens = collectTokens(text, profile === 'identifier' ? 'identifier' : 'prose');
  const findings = [];
  for (const item of tokens) {
    const finding = analyzeToken(item.token, item, { ...options, profile });
    if (finding) findings.push(finding);
  }

  return {
    profile,
    languageHint: options.languageHint ?? 'auto',
    tokensAnalyzed: tokens.length,
    scriptsUsed: scriptsInText(text),
    findings,
    dataSource: getScriptsMetadata()
  };
}

export function analyzeIdentifierScripts(text, options = {}) {
  return analyzeScripts(text, {
    ...options,
    profile: 'identifier',
    strictMixedScript: options.strictMixedScript ?? true
  });
}
