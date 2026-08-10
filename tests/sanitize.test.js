import { strictEqual, throws } from 'node:assert/strict';
import { test } from 'node:test';
import './stubs.js';

// ponytail: inline the sanitizeHandle function for testing
// (it will later live in src/sanitize.js)
function sanitizeHandle(raw) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!/^@?[A-Za-z0-9_]{1,15}$/.test(trimmed)) return null;
  return trimmed;
}

test('sanitizeHandle rejects HTML special chars', () => {
  strictEqual(sanitizeHandle('<script>'), null);
  strictEqual(sanitizeHandle('"><script>'), null);
  strictEqual(sanitizeHandle('`alert(1)`'), null);
  strictEqual(sanitizeHandle('test="x"'), null);
});

test('sanitizeHandle accepts normal handles', () => {
  strictEqual(sanitizeHandle('@eddieoz'), '@eddieoz');
  strictEqual(sanitizeHandle('eddieoz'), 'eddieoz');
  strictEqual(sanitizeHandle('@user_123'), '@user_123');
});

test('sanitizeHandle rejects empty and whitespace', () => {
  strictEqual(sanitizeHandle(''), null);
  strictEqual(sanitizeHandle('   '), null);
  strictEqual(sanitizeHandle('a'.repeat(16)), null);
});
