import { strictEqual } from 'node:assert/strict';
import { test } from 'node:test';
import './stubs.js';

// ponytail: inline the guard for testing
function isTrustedSender(sender, myId) {
  return !!sender && !!myId && sender.id === myId;
}

test('rejects undefined sender', () => {
  strictEqual(isTrustedSender(undefined, 'my-id'), false);
});

test('rejects foreign sender', () => {
  strictEqual(isTrustedSender({ id: 'other-id' }, 'my-id'), false);
});

test('accepts own extension sender', () => {
  strictEqual(isTrustedSender({ id: 'my-id' }, 'my-id'), true);
});
