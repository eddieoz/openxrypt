// Encrypt the text using AES and prefix with "Xrypt"
function encryptText(username, text) {
  const encrypted = CryptoJS.AES.encrypt(text, username).toString();
  return `Xrypt: ${encrypted}`;
}

// Decrypt the text using AES
function decryptText(username, encryptedText) {
  try {
    const cipherText = encryptedText.replace('Xrypt: ', '');
    const bytes = CryptoJS.AES.decrypt(cipherText, username);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || '[Decryption Failed]';
  } catch (error) {
    console.error('Error decrypting text:', error);
    return '[Decryption Failed]';
  }
}

// Find the username from the `window.__INITIAL_STATE__` JSON object
function findUsernameFromInitialState() {
  const scriptTags = document.querySelectorAll('script[type="text/javascript"]');
  for (const scriptTag of scriptTags) {
    if (scriptTag.textContent.includes('window.__INITIAL_STATE__')) {
      const regex = /window\.__INITIAL_STATE__\s*=\s*(\{.*?\});/s;
      const match = regex.exec(scriptTag.textContent);
      if (match) {
        try {
          const jsonData = JSON.parse(match[1]);
          if (jsonData && jsonData.entities && jsonData.entities.users && jsonData.entities.users.entities) {
            const users = jsonData.entities.users.entities;
            for (const userId in users) {
              if (users.hasOwnProperty(userId) && users[userId].screen_name) {
                return `@${users[userId].screen_name}`;
              }
            }
          }
        } catch (error) {
          console.error('Error parsing __INITIAL_STATE__ JSON:', error);
        }
      }
    }
  }
  return "@unknown_user";
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'encryptText') {
    encryptAndReplaceSelectedText(sendResponse);
  } else {
    sendResponse({ status: "unknown action" });
  }
});

// Encrypt and replace the selected text
function encryptAndReplaceSelectedText(sendResponse) {
  const username = findUsernameFromInitialState(); // Use the username as the key
  const selectedText = window.getSelection().toString();
  if (selectedText.length > 0) {
    const encryptedText = encryptText(username, selectedText);
    replaceSelectedText(encryptedText);
    copyToClipboard(encryptedText)
      .then(() => {
        sendResponse({ status: "success", message: "Text encrypted and copied to clipboard!" });
      })
      .catch((err) => {
        console.error(err);
        sendResponse({ status: "error", message: "Failed to copy text to clipboard." });
      });
  } else {
    alert("No text selected for encryption.");
    sendResponse({ status: "error", message: "No text selected." });
  }
}

// Replace the selected text with the encrypted version and simulate user input
function replaceSelectedText(replacementText) {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const textNode = document.createTextNode(replacementText);
    range.insertNode(textNode);

    // Update the selection to the new text
    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(textNode);
    selection.addRange(newRange);

    // Trigger an input event to ensure the changes are detected
    const event = new Event('input', { bubbles: true });
    const editableElement = range.startContainer.parentNode.closest('[contenteditable="true"], textarea, input');
    if (editableElement) {
      editableElement.dispatchEvent(event);
    }
  }
}

// Automatically scan and decrypt all "Xrypt" encrypted texts on the page
function autoDecryptAllXryptTexts() {
  const username = findUsernameFromInitialState();
  const elements = document.querySelectorAll('body, body *');

  elements.forEach((el) => {
    if (el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE) {
      const textContent = el.textContent;
      if (textContent.startsWith('Xrypt: ')) {
        const decryptedText = decryptText(username, textContent);
        el.textContent = decryptedText;
      }
    }
  });
}

// Copy text to clipboard
function copyToClipboard(text) {
  return navigator.clipboard.writeText(text);
}

// Initialize decryption observer
function initAutoDecryptionObserver() {
  autoDecryptAllXryptTexts(); // Decrypt initially

  const observer = new MutationObserver(autoDecryptAllXryptTexts);
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Start automatic decryption
initAutoDecryptionObserver();
