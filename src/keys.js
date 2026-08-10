// ponytail: uses sanitizeHandle from src/sanitize.js (loaded before this)
// ponytail: uses getGPGFingerprint from src/content.js (loaded before this)

// Add Public Key event listener
document.getElementById("addKey").addEventListener("click", async () => {
  const rawHandle = document.getElementById("twitterHandle").value;
  const publicKey = document.getElementById("publicKey").value.trim();
  const twitterHandle = sanitizeHandle(rawHandle);
  if (!twitterHandle) {
    alert("Invalid handle. Use alphanumeric characters only (e.g. @eddieoz).");
    return;
  }
  if (publicKey) {
    const fingerprint = await getGPGFingerprint(publicKey);
    if (fingerprint) {
      chrome.storage.local.get({ keys: {} }, (result) => {
        const keys = result.keys;
        keys[twitterHandle] = { armor: publicKey, fingerprint };
        chrome.storage.local.set({ keys }, () => {
          alert("Key added successfully!");
          document.getElementById("twitterHandle").value = "";
          document.getElementById("publicKey").value = "";
          loadKeys();
        });
      });
    } else {
      alert("Invalid GPG Public Key. Please try again.");
    }
  } else {
    alert("Please provide both Twitter Handle and Public Key.");
  }
});

// Add Private Key event listener
document.getElementById("addPrivateKey").addEventListener("click", async () => {
  const rawHandle = document.getElementById("ownerHandle").value;
  const privateKey = document.getElementById("privateKey").value.trim();
  const ownerHandle = sanitizeHandle(rawHandle);
  if (!ownerHandle) {
    alert("Invalid handle. Use alphanumeric characters only (e.g. @eddieoz).");
    return;
  }
  if (privateKey) {
    const publicKey = await getPublicKeyFromPrivate(privateKey);
    const fingerprint = await getGPGFingerprint(publicKey);
    if (fingerprint) {
      chrome.storage.local.get({ private_keys: {} }, (result) => {
        const private_keys = result.private_keys;
        private_keys[ownerHandle] = privateKey;
        chrome.storage.local.set({ private_keys }, () => {
          alert("Private key added successfully!");
          document.getElementById("ownerHandle").value = "";
          document.getElementById("privateKey").value = "";
          loadPrivateKeys();
        });
      });
    } else {
      alert("Invalid Private Key. Please try again.");
    }
  } else {
    alert("Please provide both your Twitter Handle and Private Key.");
  }
});

// Retrieve public key from private key
async function getPublicKeyFromPrivate(privateKey) {
  try {
    const key = await openpgp.readKey({ armoredKey: privateKey });
    return key.toPublic().armor();
  } catch (error) {
    console.error("Error retrieving public key:", error);
    return null;
  }
}

// Generate GPG fingerprint from a public key
async function getGPGFingerprint(publicKey) {
  try {
    const key = await openpgp.readKey({ armoredKey: publicKey });
    return key
      .getFingerprint()
      .match(/.{1,4}/g)
      .join(" ");
  } catch (error) {
    console.error("Error generating GPG fingerprint:", error);
    return null;
  }
}

// Build show-key URL using handle (not key material)
function buildShowKeyUrl(handle) {
  return `/src/show_key.html?handle=${encodeURIComponent(handle)}`;
}

// Only accept handle query param — rejects key-based access
function acceptsQueryParam(name) {
  return name === 'handle';
}

// Load and display all public keys
function loadKeys() {
  chrome.storage.local.get({ keys: {} }, async (result) => {
    const keysTableBody = document.querySelector("#keysTable tbody");
    keysTableBody.innerHTML = "";
    const keys = result.keys;
    for (const twitterHandle in keys) {
      const record = keys[twitterHandle];
      const armor = record.armor || record;
      const fingerprint = await getGPGFingerprint(armor);
      const row = document.createElement("tr");
      const handleCell = document.createElement("td");
      handleCell.textContent = twitterHandle;
      const fpCell = document.createElement("td");
      fpCell.textContent = fingerprint || "Invalid Key";
      const btnCell = document.createElement("td");
      const showBtn = document.createElement("button");
      showBtn.className = "show-btn-pubkey";
      showBtn.dataset.handle = twitterHandle;
      showBtn.textContent = "Show Key";
      const delBtn = document.createElement("button");
      delBtn.className = "delete-pub-btn";
      delBtn.dataset.handle = twitterHandle;
      delBtn.textContent = "Delete";
      btnCell.appendChild(showBtn);
      btnCell.appendChild(delBtn);
      row.appendChild(handleCell);
      row.appendChild(fpCell);
      row.appendChild(btnCell);
      keysTableBody.appendChild(row);
    }

    document.querySelectorAll(".delete-pub-btn").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        const twitterHandle = event.target.dataset.handle;
        chrome.storage.local.get({ keys: {} }, (result) => {
          const keys = result.keys;
          delete keys[twitterHandle];
          chrome.storage.local.set({ keys }, loadKeys);
        });
      });
    });

    document.querySelectorAll(".show-btn-pubkey").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        const twitterHandle = event.target.dataset.handle;
        const url = chrome.runtime.getURL(buildShowKeyUrl(twitterHandle));
        chrome.tabs.create({ url });
      });
    });
  });
}

// Load and display all private keys
function loadPrivateKeys() {
  const privateKeysTableBody = document.querySelector(
    "#privateKeysTable tbody"
  );
  privateKeysTableBody.innerHTML = "";
  chrome.storage.local.get({ private_keys: {} }, async (result) => {
    const private_keys = result.private_keys;
    for (const ownerHandle in private_keys) {
      const publicKey = await getPublicKeyFromPrivate(
        private_keys[ownerHandle]
      );
      const fingerprint = await getGPGFingerprint(publicKey);
      const row = document.createElement("tr");
      const handleCell = document.createElement("td");
      handleCell.textContent = ownerHandle;
      const fpCell = document.createElement("td");
      fpCell.textContent = fingerprint || "Invalid Key";
      const btnCell = document.createElement("td");
      const showBtn = document.createElement("button");
      showBtn.className = "show-btn-privkey";
      showBtn.dataset.handle = ownerHandle;
      showBtn.textContent = "Show Pub Key";
      const delBtn = document.createElement("button");
      delBtn.className = "delete-priv-btn";
      delBtn.dataset.handle = ownerHandle;
      delBtn.textContent = "Delete";
      btnCell.appendChild(showBtn);
      btnCell.appendChild(delBtn);
      row.appendChild(handleCell);
      row.appendChild(fpCell);
      row.appendChild(btnCell);
      privateKeysTableBody.appendChild(row);
    }

    document.querySelectorAll(".delete-priv-btn").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        const ownerHandle = event.target.dataset.handle;
        chrome.storage.local.get({ private_keys: {} }, (result) => {
          const private_keys = result.private_keys;
          delete private_keys[ownerHandle];
          chrome.storage.local.set({ private_keys }, loadPrivateKeys);
        });
      });
    });

    document.querySelectorAll(".show-btn-privkey").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        const ownerHandle = event.target.dataset.handle;
        const url = chrome.runtime.getURL(buildShowKeyUrl(ownerHandle));
        chrome.tabs.create({ url });
      });
    });
  });
}

loadKeys();
loadPrivateKeys();
