import test from 'node:test';
import assert from 'node:assert/strict';
import { sha256Text } from '../src/hash.js';

test('SHA-256 matches standard known vectors', () => {
  assert.equal(sha256Text(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  assert.equal(sha256Text('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.equal(sha256Text('AI生成テスト😀'), '9231465d2857b7226bee66928dcae99f0db8209779ebc769e6af2264b2ab0199');
});
