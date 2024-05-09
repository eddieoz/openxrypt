document.getElementById('encrypt').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'encryptText' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          alert("Please open a supported Twitter page to encrypt text.");
        } else if (response && response.status === "success") {
          alert(response.message);
        } else if (response && response.status === "error") {
          alert(response.message);
        } else {
          alert("No response from the content script.");
        }
      });
    } else {
      alert("No active tab found.");
    }
  });
});

document.getElementById('addKey').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("keys.html") });
});
