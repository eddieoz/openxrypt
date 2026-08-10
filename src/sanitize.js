// ponytail: minimal handle sanitizer — reuse in keys.js and content.js
function sanitizeHandle(raw) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!/^@?[A-Za-z0-9_]{1,15}$/.test(trimmed)) return null;
  return trimmed;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { sanitizeHandle };
}
if (typeof globalThis !== 'undefined') {
  globalThis.sanitizeHandle = sanitizeHandle;
}
