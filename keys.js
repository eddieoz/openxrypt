document.getElementById('addKey').addEventListener('click', async () => {
    const twitterHandle = document.getElementById('twitterHandle').value.trim();
    const publicKey = document.getElementById('publicKey').value.trim();
    if (twitterHandle && publicKey) {
      const fingerprint = await getGPGFingerprint(publicKey);
      if (fingerprint) {
        chrome.storage.local.get({ keys: {} }, (result) => {
          const keys = result.keys;
          keys[twitterHandle] = publicKey;
          chrome.storage.local.set({ keys }, () => {
            alert("Key added successfully!");
            document.getElementById('twitterHandle').value = '';
            document.getElementById('publicKey').value = '';
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
  
  document.getElementById('addPrivateKey').addEventListener('click', async () => {
    const ownerHandle = document.getElementById('ownerHandle').value.trim();
    const privateKey = document.getElementById('privateKey').value.trim();
    if (ownerHandle && privateKey) {
      const publicKey = await getPublicKeyFromPrivate(privateKey);
      const fingerprint = await getGPGFingerprint(publicKey);
      if (fingerprint) {
        chrome.storage.local.set({ privateKey: { ownerHandle, privateKey, publicKey } }, () => {
          alert("Private key added successfully!");
          document.getElementById('ownerHandle').value = '';
          document.getElementById('privateKey').value = '';
          loadPrivateKeyInfo();
        });
      } else {
        alert("Invalid Private Key. Please try again.");
      }
    } else {
      alert("Please provide both your Twitter Handle and Private Key.");
    }
  });
  
  document.getElementById('showPublicKey').addEventListener('click', () => {
    chrome.storage.local.get({ privateKey: {} }, (result) => {
      const privateKeyInfo = result.privateKey;
      if (privateKeyInfo && privateKeyInfo.publicKey) {
        const publicKey = encodeURIComponent(privateKeyInfo.publicKey);
        const url = chrome.runtime.getURL(`show_key.html?key=${publicKey}`);
        chrome.tabs.create({ url });
      } else {
        alert("No private key found.");
      }
    });
  });
  
  document.getElementById('deletePrivateKey').addEventListener('click', () => {
    chrome.storage.local.remove('privateKey', () => {
      alert("Private key deleted successfully.");
      loadPrivateKeyInfo();
    });
  });
  
  async function getPublicKeyFromPrivate(privateKey) {
    try {
      const { keys: [key] } = await openpgp.key.readArmored(privateKey);
      return key.toPublic().armor();
    } catch (error) {
      console.error('Error retrieving public key:', error);
      return null;
    }
  }
  
  async function getGPGFingerprint(publicKey) {
    try {
      const { keys } = await openpgp.key.readArmored(publicKey);
      if (keys.length > 0) {
        return keys[0].getFingerprint().match(/.{1,4}/g).join(' ');
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error generating GPG fingerprint:', error);
      return null;
    }
  }
  
  function loadPrivateKeyInfo() {
    chrome.storage.local.get({ privateKey: {} }, async (result) => {
      const privateKeyInfo = result.privateKey;
      const privateKeyInputSection = document.getElementById('privateKeyInputSection');
      const privateKeyInfoSection = document.getElementById('privateKeyInfoSection');
  
      if (privateKeyInfo && privateKeyInfo.publicKey) {
        const fingerprint = await getGPGFingerprint(privateKeyInfo.publicKey);
        document.getElementById('displayOwnerHandle').textContent = privateKeyInfo.ownerHandle;
        document.getElementById('displayFingerprint').textContent = fingerprint || 'Invalid Key';
        privateKeyInputSection.style.display = 'none';
        privateKeyInfoSection.style.display = 'block';
      } else {
        privateKeyInputSection.style.display = 'block';
        privateKeyInfoSection.style.display = 'none';
      }
    });
  }
  
  function loadKeys() {
    chrome.storage.local.get({ keys: {}, privateKey: {} }, async (result) => {
      const keysTableBody = document.querySelector('#keysTable tbody');
      keysTableBody.innerHTML = '';
      const keys = result.keys;
      for (const twitterHandle in keys) {
        const fingerprint = await getGPGFingerprint(keys[twitterHandle]);
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${twitterHandle}</td>
          <td>${fingerprint || 'Invalid Key'}</td>
          <td>
            <button class="show-btn-pubkey" data-handle="${twitterHandle}">Show Key</button>
            <button class="delete-btn" data-handle="${twitterHandle}">Delete</button>
          </td>
        `;
        keysTableBody.appendChild(row);
      }
  
      document.querySelectorAll('.delete-btn').forEach((btn) => {
        btn.addEventListener('click', (event) => {
          const twitterHandle = event.target.getAttribute('data-handle');
          chrome.storage.local.get({ keys: {} }, (result) => {
            const keys = result.keys;
            delete keys[twitterHandle];
            chrome.storage.local.set({ keys }, loadKeys);
          });
        });
      });
  
      document.querySelectorAll('.show-btn-pubkey').forEach((btn) => {
        btn.addEventListener('click', (event) => {
          const twitterHandle = event.target.getAttribute('data-handle');
          chrome.storage.local.get({ keys: {} }, (result) => {
            const keys = result.keys;
            const publicKey = encodeURIComponent(keys[twitterHandle]);
            const url = chrome.runtime.getURL(`show_key.html?key=${publicKey}`);
            chrome.tabs.create({ url });
          });
        });
      });
  
      loadPrivateKeyInfo();
    });
  }
  
  loadKeys();
  