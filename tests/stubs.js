// Shared stubs for Chrome extension tests running in Node
// ponytail: Node.js already has crypto.subtle; only stub chrome.*

global.chrome = {
  runtime: {
    id: 'test-extension-id',
    getURL: (path) => `chrome-extension://test-extension-id${path}`,
  },
  storage: {
    local: {
      get: (defaults, cb) => cb(defaults),
      set: (obj, cb) => cb && cb(),
    },
  },
  tabs: {
    query: (opts, cb) => cb([]),
    create: (opts) => {},
    sendMessage: (id, msg, cb) => cb && cb({ status: 'success' }),
  },
};

global.openpgp = {
  readKey: async ({ armoredKey }) => ({
    toPublic: () => ({ armor: () => armoredKey }),
    getFingerprint: () => 'AB CD EF 12 34 56 78 90 AB CD EF 12 34 56 78 90',
  }),
  readPrivateKey: async ({ armoredKey }) => ({
    toPublic: () => ({ armor: () => armoredKey.replace('PRIVATE', 'PUBLIC') }),
  }),
  decryptKey: async () => ({}),
  decrypt: async () => ({ data: 'decrypted' }),
  readMessage: async () => ({}),
  encrypt: async () => '-----BEGIN PGP MESSAGE-----\ntest\n-----END PGP MESSAGE-----',
  createMessage: async ({ text }) => ({ getText: () => text }),
};

global.sessionStorage = {
  getItem: () => null,
  setItem: () => {},
};

global.Node = { TEXT_NODE: 3 };
