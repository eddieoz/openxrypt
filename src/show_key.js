// ponytail: show_key.js — look up by handle, ignore key param
document.addEventListener("DOMContentLoaded", () => {
  const queryString = new URLSearchParams(window.location.search);
  const handle = queryString.get("handle");
  if (!handle || !acceptsQueryParam("handle")) {
    return;
  }
  chrome.storage.local.get({ keys: {} }, (result) => {
    const record = result.keys[handle];
    if (record && record.armor) {
      document.getElementById("publicKey").textContent = record.armor;
    }
  });
});

// Only accept handle query param
function acceptsQueryParam(name) {
  return name === 'handle';
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { acceptsQueryParam };
}
if (typeof globalThis !== 'undefined') {
  globalThis.acceptsQueryParam = acceptsQueryParam;
}
