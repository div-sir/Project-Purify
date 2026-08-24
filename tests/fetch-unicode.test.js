import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchUnicodeText } from '../scripts/fetch-unicode.mjs';

const ORIGINAL_FETCH = globalThis.fetch;

test.afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
});

test('Unicode downloader rejects non-allowlisted hosts before network access', async () => {
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    throw new Error('must not be called');
  };

  await assert.rejects(
    () => fetchUnicodeText('https://example.com/confusables.txt'),
    /must use https:\/\/www\.unicode\.org/
  );
  assert.equal(called, false);
});

test('Unicode downloader accepts bounded UTF-8 text', async () => {
  globalThis.fetch = async () => new Response('Unicode data\n', {
    status: 200,
    headers: { 'content-type': 'text/plain' }
  });

  const text = await fetchUnicodeText('https://www.unicode.org/Public/test.txt', { maxBytes: 1024 });
  assert.equal(text, 'Unicode data\n');
});

test('Unicode downloader enforces declared content-length limits', async () => {
  globalThis.fetch = async () => new Response('small', {
    status: 200,
    headers: { 'content-length': '9999' }
  });

  await assert.rejects(
    () => fetchUnicodeText('https://www.unicode.org/Public/test.txt', { maxBytes: 32 }),
    /exceeds 32 byte limit/
  );
});

test('Unicode downloader enforces streamed size limits', async () => {
  globalThis.fetch = async () => new Response('x'.repeat(128), { status: 200 });

  await assert.rejects(
    () => fetchUnicodeText('https://www.unicode.org/Public/test.txt', { maxBytes: 32 }),
    /exceeds 32 byte limit/
  );
});
