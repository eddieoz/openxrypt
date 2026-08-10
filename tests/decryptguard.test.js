import { strictEqual } from 'node:assert/strict';
import { test } from 'node:test';
import './stubs.js';

// ponytail: inline the guard for testing
const processedSet = new WeakSet();

function markDecrypted(el) {
  processedSet.add(el);
}

function alreadyProcessed(el) {
  return processedSet.has(el);
}

function shouldAttemptDecrypt(el, site) {
  const isTextOnly = el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE;
  if (isTextOnly) return true;
  if (site === 'whatsapp' && el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE && el.textContent.length > 60) {
    return true;
  }
  return false;
}

test('fresh element is not processed', () => {
  const el = { nodeType: 1 };
  strictEqual(alreadyProcessed(el), false);
});

test('marked element is processed', () => {
  const el = { nodeType: 1 };
  markDecrypted(el);
  strictEqual(alreadyProcessed(el), true);
});

test('multi-child whatsapp element is NOT eligible', () => {
  const el = { nodeType: 1, childNodes: [{ nodeType: 1 }, { nodeType: 3 }], textContent: 'a'.repeat(70) };
  strictEqual(shouldAttemptDecrypt(el, 'whatsapp'), false);
});

test('single-text-node whatsapp element with >60 chars IS eligible', () => {
  const el = { nodeType: 1, childNodes: [{ nodeType: 3 }], textContent: 'a'.repeat(70) };
  strictEqual(shouldAttemptDecrypt(el, 'whatsapp'), true);
});
