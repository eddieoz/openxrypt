// ponytail: shared crypto helpers — fingerprintMatches + deriveSymmetricKey
async function fingerprintMatches(resolved, stored) {
  return !!resolved && !!stored && resolved === stored;
}

async function deriveSymmetricKey(fingerprint, sha256Fn) {
  const hash = await sha256Fn(fingerprint);
  return hash;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { fingerprintMatches, deriveSymmetricKey };
}
if (typeof globalThis !== 'undefined') {
  globalThis.fingerprintMatches = fingerprintMatches;
  globalThis.deriveSymmetricKey = deriveSymmetricKey;
}
