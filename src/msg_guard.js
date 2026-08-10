// ponytail: authenticate popup→content messages — reject untrusted senders
function isTrustedSender(sender, myId) {
  return !!sender && !!myId && sender.id === myId;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { isTrustedSender };
}
if (typeof globalThis !== 'undefined') {
  globalThis.isTrustedSender = isTrustedSender;
}
