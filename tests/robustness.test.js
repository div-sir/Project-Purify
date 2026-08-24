import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { cleanText, scanText } from '../src/scanner.js';
import { confusableSkeleton } from '../src/confusables.js';

const fixtures = JSON.parse(await readFile(new URL('./fixtures/multilingual.json', import.meta.url), 'utf8'));

for (const fixture of fixtures) {
  if ('expectedClean' in fixture) {
    test(`fixture clean: ${fixture.name}`, () => {
      assert.equal(cleanText(fixture.text), fixture.expectedClean);
    });
  }
  if ('expectedSkeleton' in fixture) {
    test(`fixture skeleton: ${fixture.name}`, () => {
      assert.equal(confusableSkeleton(fixture.text), fixture.expectedSkeleton);
    });
  }
}

test('finding IDs are deterministic', () => {
  const text = `A\u200BB\u202EC`;
  assert.deepEqual(
    scanText(text).findings.map((finding) => finding.id),
    scanText(text).findings.map((finding) => finding.id)
  );
});

test('cleaning is idempotent across deterministic fuzz cases', () => {
  let state = 0x51F15EED;
  const controls = ['\u200B', '\u2060', '\uFEFF', '\u00AD'];
  const visible = ['a', 'Z', '中', '文', '日', '本', '🙂', ' ', '\n'];

  const next = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return state >>> 0;
  };

  for (let caseIndex = 0; caseIndex < 250; caseIndex += 1) {
    let text = '';
    const length = 1 + (next() % 80);
    for (let i = 0; i < length; i += 1) {
      const source = next() % 5 === 0 ? controls : visible;
      text += source[next() % source.length];
    }

    const once = cleanText(text);
    const twice = cleanText(once);
    assert.equal(twice, once, `cleanText must be idempotent for case ${caseIndex}`);
  }
});

test('cleaning removes default removable findings from fuzz cases', () => {
  const samples = [
    `alpha\u200Bbeta`,
    `中\u2060文`,
    `a\uFEFFb\u00ADc`,
    `plain text`
  ];

  for (const sample of samples) {
    const cleaned = cleanText(sample);
    const remaining = scanText(cleaned).findings.filter((finding) => finding.remove);
    assert.equal(remaining.length, 0);
  }
});
