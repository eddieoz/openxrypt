// ponytail: prevent re-decrypt loop — WeakSet keyed on element
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { markDecrypted, alreadyProcessed, shouldAttemptDecrypt };
}
if (typeof globalThis !== 'undefined') {
  globalThis.markDecrypted = markDecrypted;
  globalThis.alreadyProcessed = alreadyProcessed;
  globalThis.shouldAttemptDecrypt = shouldAttemptDecrypt;
}
