const DEFAULT_MAX_BYTES = 16 * 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 30_000;
const ALLOWED_HOST = 'www.unicode.org';

export async function fetchUnicodeText(source, options = {}) {
  const url = new URL(source);
  if (url.protocol !== 'https:' || url.hostname !== ALLOWED_HOST) {
    throw new Error(`Unicode data source must use https://${ALLOWED_HOST}/`);
  }

  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error(`Unicode download timed out after ${timeoutMs} ms.`)), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal, redirect: 'error' });
    if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
    if (!response.body) throw new Error(`Unicode response has no body: ${url}`);

    const declaredLength = Number(response.headers.get('content-length'));
    if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
      throw new Error(`Unicode response exceeds ${maxBytes} byte limit: ${declaredLength}`);
    }

    const chunks = [];
    let total = 0;
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel('Unicode download size limit exceeded.');
        throw new Error(`Unicode response exceeds ${maxBytes} byte limit.`);
      }
      chunks.push(value);
    }

    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }

    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } finally {
    clearTimeout(timer);
  }
}
