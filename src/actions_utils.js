// ponytail: shared action helpers — normalizeRecipientHandle + whatsappSenderFromWid
function normalizeRecipientHandle(handle) {
  if (!handle) return null;
  if (handle === '@unknown_dest_user' || handle === '@unknown_user') return null;
  const trimmed = handle.trim();
  if (!/^@?[A-Za-z0-9_]{1,15}$/.test(trimmed)) return null;
  return trimmed;
}

function whatsappSenderFromWid(raw) {
  if (!raw) return null;
  return raw.split(':')[0]?.replace(/"/g, '');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { normalizeRecipientHandle, whatsappSenderFromWid };
}
if (typeof globalThis !== 'undefined') {
  globalThis.normalizeRecipientHandle = normalizeRecipientHandle;
  globalThis.whatsappSenderFromWid = whatsappSenderFromWid;
}
