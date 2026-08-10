import { strictEqual } from 'node:assert/strict';
import { test } from 'node:test';
import './stubs.js';

// ponytail: inline the helper for testing
function fingerprintMatches(resolved, stored) {
  return !!resolved && !!stored && resolved === stored;
}

test('substitution detected', () => {
  strictEqual(fingerprintMatches('AAAA BBBB', 'CCCC DDDD'), false);
});

test('null-resistant', () => {
  strictEqual(fingerprintMatches(null, 'some-fp'), false);
  strictEqual(fingerprintMatches('some-fp', null), false);
  strictEqual(fingerprintMatches(null, null), false);
});

test('matching fingerprints return true', () => {
  strictEqual(fingerprintMatches('AAAA BBBB', 'AAAA BBBB'), true);
});
