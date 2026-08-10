import { strictEqual } from 'node:assert/strict';
import { test } from 'node:test';
import './stubs.js';

// ponytail: reuse sanitizeHandle from sanitize.test.js
function sanitizeHandle(raw) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!/^@?[A-Za-z0-9_]{1,15}$/.test(trimmed)) return null;
  return trimmed;
}

function normalizeRecipientHandle(handle) {
  if (!handle) return null;
  if (handle === '@unknown_dest_user' || handle === '@unknown_user') return null;
  return sanitizeHandle(handle);
}

test('fake handle returns null', () => {
  strictEqual(normalizeRecipientHandle('@unknown_dest_user'), null);
  strictEqual(normalizeRecipientHandle('@unknown_user'), null);
});

test('valid handle returns sanitized', () => {
  strictEqual(normalizeRecipientHandle('@eddieoz'), '@eddieoz');
});
