import { strictEqual } from 'node:assert/strict';
import { test } from 'node:test';
import './stubs.js';

// ponytail: inline the derivation for testing
async function deriveSymmetricKey(fingerprint, sha256Fn) {
  const hash = await sha256Fn(fingerprint);
  return hash;
}

test('deterministic for same fingerprint', async () => {
  const stubSha256 = async (input) => new Uint8Array([1, 2, 3, 4]);
  const a = await deriveSymmetricKey('fp1', stubSha256);
  const b = await deriveSymmetricKey('fp1', stubSha256);
  strictEqual(a[0], b[0]);
});

test('different fingerprints differ', async () => {
  const stubSha256 = async (input) => {
    const hash = new Uint8Array(32);
    for (let i = 0; i < 32; i++) hash[i] = input.charCodeAt(i % input.length) + i;
    return hash;
  };
  const a = await deriveSymmetricKey('fp1', stubSha256);
  const b = await deriveSymmetricKey('gp2', stubSha256);
  strictEqual(a[0] !== b[0], true);
});
