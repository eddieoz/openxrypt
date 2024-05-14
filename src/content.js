// Retrieve the session passphrase securely
async function getSessionPassphrase() {
  if (!sessionPassphrase) {
    return "[Decryption Failed - No Passphrase]";
  }
  return sessionPassphrase;
}

// Retrieve private key of the extension user from storage
async function retrieveExtensionUserPrivateKey() {
  const extensionUserHandle = findUsernameFromInitialState();
  return new Promise((resolve, reject) => {
    chrome.storage.local.get({ private_keys: {} }, (result) => {
      const keys = result.private_keys;
      if (keys[extensionUserHandle]) {
        resolve(keys[extensionUserHandle]);
      } else {
        reject(`Private key not found for ${extensionUserHandle}`);
      }
    });
  });
}

// Decrypt PGP message using the extension user's private key
async function decryptPGPMessage(message) {
  try {
    const privateKeyArmored = await retrieveExtensionUserPrivateKey();
    const passphrase = await getSessionPassphrase();
    if (!passphrase || passphrase === "[Decryption Failed - No Passphrase]")
      return passphrase;

    const privateKey = await openpgp.decryptKey({
      privateKey: await openpgp.readPrivateKey({
        armoredKey: privateKeyArmored,
      }),
      passphrase: passphrase,
    });

    const decryptedMessage = await openpgp.decrypt({
      message: await openpgp.readMessage({ armoredMessage: message }),
      decryptionKeys: [privateKey],
    });

    // Consider the msg document format
    // {
    //   "event": "xrypt.[msg_type].[event_type]",
    //   "params": {
    //     "content": {
    //       "type": "text",
    //       "text": base64("hello!")
    //     }
    //   }
    // }

    // Decode from Base64 then decode URI components
    const decodedData = JSON.parse(decryptedMessage.data)

    const decodedText = decodeURIComponent(atob(decodedData.params.content.text).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return decodedText;
  } catch (error) {
    // console.error("Error decrypting PGP message:", error);
    return "[Decryption Failed]";
  }
}

// Automatically scan and decrypt all PGP encrypted texts on the page
async function autoDecryptAllXryptTexts() {
  const pgpBlockRegex =
    /-----BEGIN PGP MESSAGE-----.*?-----END PGP MESSAGE-----/gs;

  const elements = document.querySelectorAll("body, body *");
  for (const el of elements) {
    if (
      el.childNodes.length === 1 &&
      el.childNodes[0].nodeType === Node.TEXT_NODE
    ) {
      const textContent = el.textContent;
      const matches = textContent.match(pgpBlockRegex);

      if (matches) {
        let newContent = textContent;
        for (const match of matches) {
          const decryptedText = await decryptPGPMessage(match);
          newContent = newContent.replace(match, decryptedText);
        }
        el.textContent = newContent;
      }
    }
  }
}

// Retrieve public key of a user from storage
function retrieveUserPublicKey(username) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get({ keys: {} }, (result) => {
      const keys = result.keys;
      if (keys[username]) {
        resolve(keys[username]);
      } else {
        reject(`Public key not found for ${username}`);
      }
    });
  });
}

// Retrieve public key of a user from a private key
async function retrieveUserPublicKeyFromPrivate(username) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get({ private_keys: {} }, async (result) => {
      const keys = result.private_keys;
      if (keys[username]) {
        const publicKey = await getPublicKeyFromPrivate(keys[username]);
        resolve(publicKey);
      } else {
        reject(`Public key not found for ${username}`);
      }
    });
  });
}

// Retrieve public key from a private key
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

// Encrypt the text using PGP
async function encryptTextPGP(text, recipientPublicKeys) {
  try {
    
    // Create a message object from the modified text
    const message = await openpgp.createMessage({ text });
        
    const recipientKeys = await Promise.all(
      recipientPublicKeys.map((key) => openpgp.readKey({ armoredKey: key }))
    );

    const encrypted = await openpgp.encrypt({
      message,
      encryptionKeys: recipientKeys,
    });

    return `${encrypted}`;
  } catch (error) {
    console.error("Error encrypting text with PGP:", error);
    return "[Encryption Failed]";
  }
}

// Encrypt and replace the selected text using PGP for two keys
async function encryptAndReplaceSelectedTextPGP(sendResponse) {
  const twitterHandle = findTwitterHandle();
  const extensionUserHandle = findUsernameFromInitialState();
  const selectedText = window.getSelection().toString();

  // Check for emojis in the selected text. Temporary workaround for twitter treatment of selected text.
  const emojiPattern = /[\u231A-\uDFFF\u200D\u263A-\uFFFF]/;
  if (emojiPattern.test(selectedText)) {
    alert("Please do not send messages with emojis.");
    sendResponse({ status: "error", message: "Emojis are not allowed." });
    return;
  }

  if (selectedText.length > 0) {
    try {
      const recipientPublicKey = await retrieveUserPublicKey(twitterHandle);
      const extensionUserPublicKey = await retrieveUserPublicKeyFromPrivate(
        extensionUserHandle
      );

      // Create a formatted document in the format that allow future developments:
      // Based on docs/protocol/simplex-chat.md
      // {
      //   "event": "xrypt.[msg_type].[event_type]",
      //   "params": {
      //     "content": {
      //       "type": "text",
      //       "text": base64("hello!")
      //     }
      //   }
      // }

      // Add lock marker after the text
      // Encode text to UTF-8 then to Base64
      const base64Text = btoa(encodeURIComponent(`${selectedText} 🔒`).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1)));
      const xryptDocument = {
        "event": "xrypt.msg.new",
        "params": {
          "content": {
            "type": "text",
            "text": base64Text
          }
        }
      }

      const encryptedText = await encryptTextPGP(JSON.stringify(xryptDocument), [
        recipientPublicKey,
        extensionUserPublicKey,
      ]);

      replaceSelectedText(encryptedText);

      sendResponse({
        status: "success",
        message: "Text encrypted and ready to send!",
      });

    } catch (err) {
      console.error(err);
      sendResponse({ status: "error", message: "Failed to encrypt text." });
    }
  } else {
    alert("No text selected for encryption.");
    sendResponse({ status: "error", message: "No text selected." });
  }
}

// Improved version using a link preceding the handle
function findTwitterHandle() {
  // Find the section containing the conversation or profile details
  const section = document.querySelector('section[aria-label="Section details"]') ||
                  document.querySelector('section[aria-labelledby="detail-header"]');

  if (section) {
    
    // Test if DM does't show the use info on top
    // If it shows just an avatar with link, it gets the user from the avatar link
    // otherwise it gets the user from the info
    const topAvatar = section.querySelector('[data-testid="DM_Conversation_Avatar"]')
    if (topAvatar){
      const handleMatch = topAvatar.href.match(/\/([^\/?]+)(?:\?|$)/);
      if (handleMatch) {
        return `@${handleMatch[1]}`;
      }
    } 
    // Try to find the handle from a preceding link
    const scrooler = section.querySelector('[data-testid="DmScrollerContainer"]')
    if (scrooler) {
      const link = scrooler.querySelector('a[href*="/"]');
      if (link) {
        const handleMatch = link.href.match(/\/([^\/?]+)(?:\?|$)/);
        if (handleMatch) {
          return `@${handleMatch[1]}`;
        }
      }
    }
  }

  // Try to find the user in the DM popup if available in main X screen
  const dmDrawer = document.querySelector('div[data-testid="DMDrawer"]');
  if (dmDrawer){
    console.log(dmDrawer)
    const dmDrawerHeader = dmDrawer.querySelector('div[data-testid="DMDrawerHeader"]');
    if (dmDrawerHeader) {
      console.log(dmDrawerHeader)
      const handleElement = dmDrawerHeader.querySelector('span[dir="ltr"]');
      console.log(handleElement)
      if (handleElement && handleElement.textContent.startsWith('@')) {
        return handleElement.textContent.trim();
      }
    }
  }
  
  // Default value if the handle is not found
  return "@unknown_dest_user";
}



// Find the username from the `window.__INITIAL_STATE__` JSON object
function findUsernameFromInitialState() {
  const scriptTags = document.querySelectorAll(
    'script[type="text/javascript"]'
  );
  for (const scriptTag of scriptTags) {
    if (scriptTag.textContent.includes("window.__INITIAL_STATE__")) {
      const regex = /window\.__INITIAL_STATE__\s*=\s*(\{.*?\});/s;
      const match = regex.exec(scriptTag.textContent);
      if (match) {
        try {
          const jsonData = JSON.parse(match[1]);
          if (
            jsonData &&
            jsonData.entities &&
            jsonData.entities.users &&
            jsonData.entities.users.entities
          ) {
            const users = jsonData.entities.users.entities;
            for (const userId in users) {
              if (users.hasOwnProperty(userId) && users[userId].screen_name) {
                return `@${users[userId].screen_name}`;
              }
            }
          }
        } catch (error) {
          console.error("Error parsing __INITIAL_STATE__ JSON:", error);
        }
      }
    }
  }
  return "@unknown_user";
}

// Replace the selected text with the encrypted version
function replaceSelectedText(replacementText) {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const textNode = document.createTextNode(replacementText);
    range.insertNode(textNode);

    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(textNode);
    selection.addRange(newRange);

    const event = new Event("input", { bubbles: true });
    const editableElement = range.startContainer.parentNode.closest(
      '[contenteditable="true"], textarea, input'
    );
    if (editableElement) editableElement.dispatchEvent(event);
  }
}

async function getSessionPassphrase() {
  const sessionPassphrase = sessionStorage.getItem("sessionPassphrase");
  return sessionPassphrase || "[Decryption Failed - No Passphrase]";
}

// Set the passphrase in session storage
async function setSessionPassphrase(passphrase) {
  sessionStorage.setItem("sessionPassphrase", passphrase);
}

// Function to replace the text in the input with the encrypted version
function replaceTextInInput(replacementText) {
  const messageInput = document.querySelector('[contenteditable="true"][data-testid="dmComposerTextInput"]');
  if (messageInput) {
    messageInput.innerText = replacementText;
    messageInput.value = replacementText;
    console.log('message input: ', messageInput)

    // Trigger the input event to update the DOM
    const event = new Event('input', { bubbles: true });
    messageInput.dispatchEvent(event);
  }
}

async function handleEncryptAndSend() {
  const messageInput = document.querySelector('[contenteditable="true"][data-testid="dmComposerTextInput"]');
  if (messageInput) {
    // Select the entire text in the input box
    const range = document.createRange();
    range.selectNodeContents(messageInput);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    // Retrieve the text from the selection
    const messageText = selection.toString().trim();
    console.log('original msg:', messageText);

    if (messageText) {
      const twitterHandle = findTwitterHandle();
      const extensionUserHandle = findUsernameFromInitialState();

      try {
        const recipientPublicKey = await retrieveUserPublicKey(twitterHandle);
        const extensionUserPublicKey = await retrieveUserPublicKeyFromPrivate(extensionUserHandle);

        const base64Text = btoa(encodeURIComponent(`${messageText} 🔒`).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1)));
        const xryptDocument = {
          "event": "xrypt.msg.new",
          "params": {
            "content": {
              "type": "text",
              "text": base64Text
            }
          }
        }

        const encryptedText = await encryptTextPGP(JSON.stringify(xryptDocument), [recipientPublicKey, extensionUserPublicKey]);
        console.log('encrypted msg:', encryptedText);

        // Replace the selected text with the encrypted text
        replaceSelectedText(encryptedText);

        // Optionally, click the original send button
        const sendButton = document.querySelector('[data-testid="dmComposerSendButton"]');
        // if (sendButton) sendButton.click();
      } catch (err) {
        console.error('Failed to encrypt text:', err);
        alert('Failed to encrypt text.');
      }
    } else {
      alert('Message text cannot be empty.');
    }
  } else {
    alert('Message input not found.');
  }
}



// Function to inject Encrypt button before the Send button
function injectEncryptButton() {
  const sendButton = document.querySelector('[data-testid="dmComposerSendButton"]');
  if (sendButton && !document.querySelector('#encryptAndSendButton')) {
    const encryptButton = document.createElement('button');
    encryptButton.id = 'encryptAndSendButton';
    encryptButton.innerText = 'Encrypt';
    encryptButton.style.marginRight = '10px'; // Add some space between buttons
    sendButton.parentNode.insertBefore(encryptButton, sendButton);

    // Add click event listener to the new button
    encryptButton.addEventListener('click', handleEncryptAndSend);
  }
}

// Call the function to inject the button
injectEncryptButton();

// Observe changes in the DOM to ensure the button is always injected
const observer = new MutationObserver(injectEncryptButton);
observer.observe(document.body, { childList: true, subtree: true });


// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "encryptText") {
    encryptAndReplaceSelectedTextPGP(sendResponse);
  } else if (request.action === "resetPassphrase") {
    sessionStorage.removeItem("sessionPassphrase"); // Reset passphrase
    sendResponse({ status: "success", message: "Passphrase reset" });
  } else if (request.action === "setPassphrase") {
    setSessionPassphrase(request.passphrase);
    sendResponse({ status: "success", message: "Passphrase set" });
  } else if (request.action === "checkPassphrase") {
    const hasPassphrase = !!sessionStorage.getItem("sessionPassphrase");
    sendResponse({ hasPassphrase });
  } else {
    sendResponse({ status: "unknown action" });
  }
  return true; // Required for asynchronous responses
});

// Initialize decryption observer
function initAutoDecryptionObserver() {
  autoDecryptAllXryptTexts(); // Decrypt initially

  const observer = new MutationObserver(autoDecryptAllXryptTexts);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Start automatic decryption
initAutoDecryptionObserver();
