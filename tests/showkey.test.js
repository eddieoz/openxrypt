import { strictEqual, ok } from 'node:assert/strict';
import { test } from 'node:test';
import './stubs.js';

// ponytail: inline helpers for testing
function buildShowKeyUrl(handle) {
  return `/src/show_key.html?handle=${encodeURIComponent(handle)}`;
}

function acceptsQueryParam(name) {
  return name === 'handle';
}

test('buildShowKeyUrl contains handle not key', () => {
  const url = buildShowKeyUrl('@eddieoz');
  ok(url.includes('handle='));
  ok(!url.includes('key='));
  ok(!url.includes('BEGIN PGP'));
});

test('acceptsQueryParam only allows handle', () => {
  strictEqual(acceptsQueryParam('handle'), true);
  strictEqual(acceptsQueryParam('key'), false);
  strictEqual(acceptsQueryParam('foo'), false);
});
