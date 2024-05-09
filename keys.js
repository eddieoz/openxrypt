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
  
  function loadKeys() {
    chrome.storage.local.get({ keys: {} }, async (result) => {
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
            <button class="show-btn" data-handle="${twitterHandle}">Show Key</button>
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
  
      document.querySelectorAll('.show-btn').forEach((btn) => {
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
    });
  }
  
  loadKeys();
  