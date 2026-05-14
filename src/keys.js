// FIX: helper that safely sets text on a newly created element
function createTextCell(text) {
  const td = document.createElement('td');
  td.textContent = text;
  return td;
}

// FIX: build table rows with DOM API instead of innerHTML
function createKeyRow(handle, fingerprint, showBtnClass, deleteBtnClass) {
  const row = document.createElement('tr');

  row.appendChild(createTextCell(handle));
  row.appendChild(createTextCell(fingerprint || 'Invalid Key'));

  const actionCell = document.createElement('td');

  const showBtn = document.createElement('button');
  showBtn.className = showBtnClass;
  showBtn.textContent = showBtnClass === 'show-btn-pubkey' ? 'Show Key' : 'Show Pub Key';
  showBtn.dataset.handle = handle;

  const deleteBtn = document.createElement('button');
  deleteBtn.className = deleteBtnClass;
  deleteBtn.textContent = 'Delete';
  deleteBtn.dataset.handle = handle;

  actionCell.appendChild(showBtn);
  actionCell.appendChild(deleteBtn);
  row.appendChild(actionCell);

  return row;
}

document.getElementById("addKey").addEventListener("click", async () => {
  const twitterHandle = document.getElementById("twitterHandle").value.trim();
  const publicKey = document.getElementById("publicKey").value.trim();
  if (twitterHandle && publicKey) {
    const fingerprint = await getGPGFingerprint(publicKey);
    if (fingerprint) {
      chrome.storage.local.get({ keys: {} }, (result) => {
        const keys = result.keys;
        keys[twitterHandle] = publicKey;
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

document.getElementById("addPrivateKey").addEventListener("click", async () => {
  const ownerHandle = document.getElementById("ownerHandle").value.trim();
  const privateKey = document.getElementById("privateKey").value.trim();
  if (ownerHandle && privateKey) {
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

async function getPublicKeyFromPrivate(privateKey) {
  try {
    const key = await openpgp.readKey({ armoredKey: privateKey });
    return key.toPublic().armor();
  } catch (error) {
    console.error("Error retrieving public key:", error);
    return null;
  }
}

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

function loadKeys() {
  chrome.storage.local.get({ keys: {} }, async (result) => {
    const keysTableBody = document.querySelector("#keysTable tbody");
    keysTableBody.innerHTML = "";
    const keys = result.keys;
    for (const twitterHandle in keys) {
      const fingerprint = await getGPGFingerprint(keys[twitterHandle]);
      // FIX (innerHTML XSS): use safe DOM-based row builder
      const row = createKeyRow(twitterHandle, fingerprint, 'show-btn-pubkey', 'delete-pub-btn');
      keysTableBody.appendChild(row);
    }

    document.querySelectorAll(".delete-pub-btn").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        const twitterHandle = event.target.getAttribute("data-handle");
        chrome.storage.local.get({ keys: {} }, (result) => {
          const keys = result.keys;
          delete keys[twitterHandle];
          chrome.storage.local.set({ keys }, loadKeys);
        });
      });
    });

    document.querySelectorAll(".show-btn-pubkey").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        const twitterHandle = event.target.getAttribute("data-handle");
        chrome.storage.local.get({ keys: {} }, (result) => {
          const keys = result.keys;
          const publicKey = encodeURIComponent(keys[twitterHandle]);
          const url = chrome.runtime.getURL(`/src/show_key.html?key=${publicKey}`);
          chrome.tabs.create({ url });
        });
      });
    });
  });
}

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
      // FIX (innerHTML XSS): use safe DOM-based row builder
      const row = createKeyRow(ownerHandle, fingerprint, 'show-btn-privkey', 'delete-priv-btn');
      privateKeysTableBody.appendChild(row);
    }

    document.querySelectorAll(".delete-priv-btn").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        const ownerHandle = event.target.getAttribute("data-handle");
        chrome.storage.local.get({ private_keys: {} }, (result) => {
          const private_keys = result.private_keys;
          delete private_keys[ownerHandle];
          chrome.storage.local.set({ private_keys }, loadPrivateKeys);
        });
      });
    });

    document.querySelectorAll(".show-btn-privkey").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        const ownerHandle = event.target.getAttribute("data-handle");
        chrome.storage.local.get({ private_keys: {} }, async (result) => {
          const privateKey = result.private_keys[ownerHandle];
          const publicKey = encodeURIComponent(
            await getPublicKeyFromPrivate(privateKey)
          );
          const url = chrome.runtime.getURL(`/src/show_key.html?key=${publicKey}`);
          chrome.tabs.create({ url });
        });
      });
    });
  });
}

loadKeys();
loadPrivateKeys();
