import { strictEqual } from 'node:assert/strict';
import { test } from 'node:test';
import './stubs.js';

// ponytail: inline the helper for testing
function whatsappSenderFromWid(raw) {
  if (!raw) return null;
  return raw.split(':')[0]?.replace(/"/g, '');
}

test('returns null for null/undefined input', () => {
  strictEqual(whatsappSenderFromWid(null), null);
  strictEqual(whatsappSenderFromWid(undefined), null);
  strictEqual(whatsappSenderFromWid(''), null);
});

test('strips quotes and returns number', () => {
  strictEqual(whatsappSenderFromWid('"55119999@c.us":1690000000'), '55119999@c.us');
});
