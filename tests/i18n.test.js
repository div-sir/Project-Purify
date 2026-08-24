import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { UI_LANGUAGES, getMessages, translate } from '../src/i18n.js';

const INDEX = fileURLToPath(new URL('../index.html', import.meta.url));

test('English Traditional Chinese and Japanese expose the same UI keys', () => {
  const [referenceLanguage, ...others] = UI_LANGUAGES;
  const referenceKeys = Object.keys(getMessages(referenceLanguage)).sort();
  for (const language of others) {
    assert.deepEqual(Object.keys(getMessages(language)).sort(), referenceKeys, language);
  }
});

test('translation falls back to English for unknown UI language', () => {
  assert.equal(translate('xx-invalid', 'original'), getMessages('en').original);
});

test('workbench exposes UI and analysis language controls', async () => {
  const html = await fs.readFile(INDEX, 'utf8');
  assert.match(html, /id="uiLanguage"/);
  assert.match(html, /id="analysisLanguage"/);
  assert.match(html, /value="zh-Hant"/);
  assert.match(html, /value="ja"/);
  assert.match(html, /mixedScriptCount/);
  assert.match(html, /data-i18n="shapingHelp"/);
});
