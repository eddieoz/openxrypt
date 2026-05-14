// Retrieve private key of the extension user from storage
async function retrieveExtensionUserPrivateKey() {
  const extensionUserHandle = globalThis.getAction('sender');
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
    if (!passphrase || passphrase === '[Decryption Failed - No Passphrase]')
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

    // FIX (Implicit globals): declare with const/let
    let decodedData;
    if (isJSON(decryptedMessage.data)) {
      decodedData = JSON.parse(decryptedMessage.data);
    } else {
      decodedData = decryptedMessage.data;
    }

    if (typeof decodedData === 'object' && decodedData !== null) {
      if (decodedData.event === 'xrypt.msg.new'){
        const decodedText = decodeURIComponent(atob(decodedData.params.content.text).split('').map(c => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return decodedText;
      } else {
        return '[Decryption Failed]';
      }
    } else {
      return decodedData + ' 🔒\n[ std ]';
    }
      
    
  } catch (error) {
    console.error("Error decrypting PGP message:", error);
    return '[Decryption Failed]';
  }
}

// Automatically scan and decrypt all AES-GCM and PGP encrypted texts on the page
async function autoDecryptAllXryptTexts() {
  const pgpBlockRegex = /-----BEGIN PGP MESSAGE-----[\s\S]{0,65536}?-----END PGP MESSAGE-----/g;
  const pgpBlockRegexXrypt = /-----BEGIN PGP MESSAGE-----[\s\S]{0,65536}?\[ Encrypted with OpenXrypt \]/g;
  // FIX (ReDoS): anchored, length-capped pattern; XRPT markers are fixed strings
  const aesBlockRegexXrypt = /XRPT([\s\S]{1,4096}?)XRPT/g;

  const elements = globalThis.getAction('decrypt');
  if (elements) {
    for (const el of elements) {
      if (
        el.childNodes.length === 1 &&
        el.childNodes[0].nodeType === Node.TEXT_NODE ||
        (await getWebsite() === 'whatsapp' && el.textContent.length > 60)
      ) {
        const textContent = el.textContent;

        // FIX: skip elements whose text is excessively long before regex evaluation
        if (textContent.length > 131072) continue;

        const pgpMatches = textContent.match(pgpBlockRegexXrypt) || textContent.match(pgpBlockRegex);
        const aesMatches = textContent.match(aesBlockRegexXrypt);
        
        let newContent = textContent;
        if (pgpMatches) {
          for (const match of pgpMatches) {
            const decryptedText = await decryptPGPMessage(match);
            newContent = newContent.replace(match, decryptedText);
          }
        }

        if (aesMatches) {
          if (window.location.pathname == "/notifications") {
            return;
          }
          for (const match of aesMatches) {
            const encryptedData = match.replace('XRPT', '').replace('XRPT', '').trim();
            const tweetContainer = el.closest('article[role="article"]');
            const userLink = tweetContainer ? tweetContainer.querySelector('a[href^="/"]') : null;
            const username = userLink ? userLink.getAttribute('href').substring(1) : null;

            try {
              let decryptionKey;
              if (username) {
                const recipientPublicKey = await retrieveUserPublicKey(`@${username}`);
                const fingerprint = await getGPGFingerprint(recipientPublicKey);
                decryptionKey = await generateEncryptionKey(fingerprint);
              } else {
                const privateKeyArmored = await retrieveExtensionUserPrivateKey();
                const privateKey = await openpgp.readPrivateKey({ armoredKey: privateKeyArmored });
                const publicKey = privateKey.toPublic();
                const fingerprint = publicKey.getFingerprint().match(/.{1,4}/g).join(' ');
                decryptionKey = await generateEncryptionKey(fingerprint);
              }
              const decryptedText = await decryptSymmetric(encryptedData, decryptionKey);
              newContent = newContent.replace(match, decryptedText);
            } catch (err) {
              console.error(`Failed to decrypt message:`, err);
            }
          }
        }

        el.textContent = newContent;
      }
    }
  }
}

// Retrieve public key of a user from storage
// FIX: replace alert() with console.error + thrown rejection;
// alert() in a content script leaks internal error details to the page context and
function retrieveUserPublicKey(username) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get({ keys: {} }, (result) => {
      const keys = result.keys;      
      if (keys[username]) {
        resolve(keys[username]);
      } else {
        console.error(`Public key not found for ${username}`);
        reject(`Public key not found for ${username}`);
      }
    });
  });
}

// Retrieve public key of a user from a private key
// FIX (alert() in content script): same as above
async function retrieveUserPublicKeyFromPrivate(username) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get({ private_keys: {} }, async (result) => {
      const keys = result.private_keys;
      if (keys[username]) {
        const publicKey = await getPublicKeyFromPrivate(keys[username]);
        resolve(publicKey);
      } else {
        console.error(`Public key not found for ${username}`);
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
    console.error('Error retrieving public key:', error);
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
      .join(' ');
  } catch (error) {
    console.error('Error generating GPG fingerprint:', error);
    return null;
  }
}

// Encrypt the text using PGP
async function encryptTextPGP(text, recipientPublicKeys) {
  try {
    
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
    console.error('Error encrypting text with PGP:', error);
    return '[Encryption Failed]';
  }
}

// Encrypt and replace the selected text using PGP for two keys
async function encryptAndReplaceSelectedTextPGP(sendResponse) {
  const userHandle = globalThis.getAction('userid');
  const extensionUserHandle = globalThis.getAction('sender');
  const selectedText = window.getSelection().toString();

  const emojiPattern = /[\u231A-\uDFFF\u200D\u263A-\uFFFF]/;
  if (emojiPattern.test(selectedText)) {
    alert('Please do not send messages with emojis.');
    sendResponse({ status: 'error', message: 'Emojis are not allowed.' });
    return;
  }

  if (selectedText.length > 0) {
    try {
      const recipientPublicKey = await retrieveUserPublicKey(userHandle);
      const extensionUserPublicKey = await retrieveUserPublicKeyFromPrivate(
        extensionUserHandle
      );

      const base64Text = btoa(encodeURIComponent(`${selectedText} 🔒`).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1)));
      const xryptDocument = {
        "event": "xrypt.msg.new",
        "params": {
          "content": {
            "type": "text",
            "text": base64Text
          }
        }
      };

      const encryptedText = await encryptTextPGP(JSON.stringify(xryptDocument), [
        recipientPublicKey,
        extensionUserPublicKey,
      ]);

      replaceSelectedText(encryptedText);

      sendResponse({
        status: 'success',
        message: 'Text encrypted and ready to send!',
      });
    } catch (err) {
      console.error(err);
      sendResponse({ status: 'error', message: 'Failed to encrypt text.' });
    }
  } else {
    alert('No text selected for encryption.');
    sendResponse({ status: 'error', message: 'No text selected.' });
  }
}

// Replace the selected text with the encrypted version
function replaceSelectedText(replacementText) {
  let messageInput = document.querySelector('textarea[data-testid="dmComposerTextInput"]');
  if (messageInput) {
    messageInput.value = replacementText;
  } else {
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

      const event = new Event('input', { bubbles: true });
      const editableElement = range.startContainer.parentNode.closest(
        '[contenteditable="true"], textarea, input'
      );
      if (editableElement) editableElement.dispatchEvent(event);
    }
  }
}

// FIX (Plaintext passphrase in sessionStorage):
async function _deriveWrappingKey(salt) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    salt,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(16),
      info: new TextEncoder().encode('openxrypt-session-wrap'),
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function setSessionPassphrase(passphrase) {
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const wrappingKey = await _deriveWrappingKey(salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    wrappingKey,
    new TextEncoder().encode(passphrase)
  );
  const blob = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  blob.set(salt, 0);
  blob.set(iv, salt.length);
  blob.set(new Uint8Array(ciphertext), salt.length + iv.length);
  sessionStorage.setItem('sessionPassphraseBlob', btoa(String.fromCharCode(...blob)));
}

async function getSessionPassphrase() {
  const stored = sessionStorage.getItem('sessionPassphraseBlob');
  if (!stored) return '[Decryption Failed - No Passphrase]';
  try {
    const blob    = Uint8Array.from(atob(stored), c => c.charCodeAt(0));
    const salt    = blob.slice(0, 32);
    const iv      = blob.slice(32, 44);
    const ciphertext = blob.slice(44);
    const wrappingKey = await _deriveWrappingKey(salt);
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      wrappingKey,
      ciphertext
    );
    return new TextDecoder().decode(plaintext);
  } catch {
    return '[Decryption Failed - No Passphrase]';
  }
}

// Function to replace the text in the input with the encrypted version
function replaceTextInInput(replacementText) {
  const messageInput = document.querySelector('[contenteditable="true"][data-testid="dmComposerTextInput"]');
  if (messageInput) {
    messageInput.innerText = replacementText;
    messageInput.value = replacementText;

    const event = new Event('input', { bubbles: true });
    messageInput.dispatchEvent(event);
  }
}


async function handleEncryptAndSend() {
  let messageText = '';
  let messageInput = await globalThis.getAction('input');

  if (messageInput) {
    if (messageInput.tagName === 'TEXTAREA') {
      messageText = messageInput.value;
    } else {
      // FIX (Implicit globals): declare range/selection with let
      let range = document.createRange();
      range.selectNodeContents(messageInput);
      let selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      messageText = selection.toString().trim();
    }

    if (messageText) {
      const extensionUserHandle = globalThis.getAction('sender');
      let recipientHandles = [];
      if (isXGroupMessage() || isWhatsappGroupMessage()) {
        const userIds = await globalThis.getAction('groupIds');
        for (const userId of userIds) {
          recipientHandles.push(await retrieveUserPublicKey(userId));
        }
      } else {
        const userHandle = globalThis.getAction('userid');
        recipientHandles.push(await retrieveUserPublicKey(userHandle));
      }
      
      if (!extensionUserHandle) {
        alert('Failed to encrypt text. Was not possible to get your user info.');
        return null;
      }
      
      recipientHandles.push(await retrieveUserPublicKeyFromPrivate(extensionUserHandle));

      const base64Text = btoa(encodeURIComponent(`${messageText} 🔒`).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1)));
      const xryptDocument = {
        "event": "xrypt.msg.new",
        "params": {
          "content": {
            "type": "text",
            "text": base64Text
          }
        }
      };

      try {

        if (isXGroupMessage()){
          messageInput = await globalThis.getAction('input');
          if (messageInput.tagName != 'TEXTAREA') {
            // FIX (Implicit globals): declare range/selection with let
            let range = document.createRange();
            range.selectNodeContents(messageInput);
            let selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }

        const encryptedText = await encryptTextPGP(JSON.stringify(xryptDocument), recipientHandles);
        replaceSelectedText(encryptedText + '[ Encrypted with OpenXrypt ]\n');
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

// Function to handle encryption of tweet
async function handleEncryptAndTweet() {
  const tweetInput = document.querySelector('div[data-testid="tweetTextarea_0"]');
  if (tweetInput) {
    const tweetText = tweetInput.innerText.trim();
    if (tweetText) {
      const extensionUserHandle = await getAction('sender');
      const recipientPublicKey = await retrieveUserPublicKey(extensionUserHandle);
      
      const fingerprint = await getGPGFingerprint(recipientPublicKey);
      const encryptionKey = await generateEncryptionKey(fingerprint);

      // FIX: declare range/selection with let
      let range = document.createRange();
      range.selectNodeContents(tweetInput);
      let selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      const encryptedText = await encryptSymmetric(`${tweetText} 🔒`, encryptionKey);
      replaceSelectedText('XRPT\n' + encryptedText + '\nXRPT\n');
      
    } else {
      alert('Tweet text cannot be empty.');
    }
  } else {
    alert('Tweet input not found.');
  }
}


// Generate encryption key from the fingerprint
async function generateEncryptionKey(fingerprint) {
  const enc = new TextEncoder();
  const keyData = enc.encode(fingerprint);
  const hash = await crypto.subtle.digest('SHA-256', keyData);
  return crypto.subtle.importKey(
    'raw',
    hash,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt text using AES-GCM
async function encryptSymmetric(text, key) {
  const paddedText = padText(text);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const encodedText = enc.encode(paddedText);
  
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    encodedText
  );
  
  return btoa(String.fromCharCode(...new Uint8Array(iv)) + String.fromCharCode(...new Uint8Array(ciphertext)));
}

// Decrypt text using AES-GCM
async function decryptSymmetric(encryptedText, key) {
  const rawData = atob(encryptedText);
  const iv = new Uint8Array(rawData.slice(0, 12).split('').map(c => c.charCodeAt(0)));
  const ciphertext = new Uint8Array(rawData.slice(12).split('').map(c => c.charCodeAt(0)));
  
  const decryptedText = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    ciphertext
  );
  
  const dec = new TextDecoder();
  // FIX (Implicit globals): declare decryptedMessage with const
  const decryptedMessage = dec.decode(decryptedText);
  return removePadding(decryptedMessage);
  
}

const PAD_CHAR = ' ';

function padText(text) {
  if (text.length < 270){
    const paddingNeeded = 270 - text.length;
    return text + PAD_CHAR.repeat(paddingNeeded);
  } else {
    return text;
  }
}

function removePadding(text) {
  return text.replace(new RegExp(PAD_CHAR + '+$'), '');
}

// Function to inject Encrypt button before the Send button
function injectEncryptButton() {
  const sendButton = globalThis.getAction('senderButton');
  if (sendButton && !document.querySelector('#encryptAndSendButton')) {
    const encryptButton = document.createElement('button');
    encryptButton.id = 'encryptAndSendButton';
    encryptButton.innerText = 'Encrypt';
    encryptButton.style.marginRight = '10px';
    encryptButton.style.backgroundColor = '#1884cb';
    encryptButton.style.borderRadius = '5px';
    encryptButton.style.padding = '5px';
    encryptButton.style.color = 'aliceblue';
    encryptButton.style.border = 'none';
    encryptButton.style.zIndex = '1000';
    encryptButton.style.position = 'relative';

    if(globalThis.getWebsite() === 'whatsapp'){
      sendButton.parentElement.setAttribute("style", "display: flex; flex-wrap: nowrap; flex-direction: row; justify-content: flex-end;");
      encryptButton.style.marginRight = '33px';
    }
    sendButton.parentNode.insertBefore(encryptButton, sendButton);

    encryptButton.addEventListener('click', handleEncryptAndSend);
  }
}

injectEncryptButton();

const observerDM = new MutationObserver(injectEncryptButton);
observerDM.observe(document.body, { childList: true, subtree: true });

// Function to inject Encrypt button next to the Post button
function injectEncryptButtonForTweet() {
  const postButtonInline = document.querySelector('button[data-testid="tweetButtonInline"]');
  const postButton = document.querySelector('button[data-testid="tweetButton"]');
  if ((postButtonInline || postButton) && !document.querySelector('#encryptAndTweetButton')) {
    const encryptButton = document.createElement('button');
    encryptButton.id = 'encryptAndTweetButton';
    encryptButton.innerText = 'Obfuscate';
    encryptButton.style.marginRight = '10px';
    encryptButton.style.backgroundColor = '#1884cb';
    encryptButton.style.borderRadius = '5px';
    encryptButton.style.padding = '5px';
    encryptButton.style.color = 'aliceblue';
    encryptButton.style.border = 'none';
    encryptButton.style.zIndex = '1000';
    encryptButton.style.position = 'relative';

    if (postButtonInline) {
      postButtonInline.parentNode.insertBefore(encryptButton, postButtonInline);
    } else if (postButton) {
      postButton.parentNode.insertBefore(encryptButton, postButton);
    }

    encryptButton.addEventListener('click', handleEncryptAndTweet);
  }
}

function monitorURLChanges() {
  const targetNode = document.body;
  const config = { childList: true, subtree: true };

  const callback = function (mutationsList) {
    for (const mutation of mutationsList) {
      if (window.location.href === "https://x.com/compose/post") {
        injectEncryptButtonForTweet();
      }
    }
  };

  const observerPost = new MutationObserver(callback);
  observerPost.observe(targetNode, config);
}

monitorURLChanges();

const observerPost = new MutationObserver(injectEncryptButtonForTweet);
observerPost.observe(document.body, { childList: true, subtree: true });

// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'encryptText') {
    encryptAndReplaceSelectedTextPGP(sendResponse);
  } else if (request.action === 'resetPassphrase') {
    // FIX (Plaintext passphrase in sessionStorage): clear the wrapped blob key
    sessionStorage.removeItem('sessionPassphraseBlob');
    sendResponse({ status: 'success', message: 'Passphrase reset' });
  } else if (request.action === 'setPassphrase') {
    setSessionPassphrase(request.passphrase).then(() => {
      sendResponse({ status: 'success', message: 'Passphrase set' });
    });
  } else if (request.action === 'checkPassphrase') {
    // FIX (Plaintext passphrase in sessionStorage): check the wrapped blob key
    const hasPassphrase = !!sessionStorage.getItem('sessionPassphraseBlob');
    sendResponse({ hasPassphrase });
  } else {
    sendResponse({ status: 'unknown action' });
  }
  return true;
});

// Initialize decryption observer
function initAutoDecryptionObserver() {
  autoDecryptAllXryptTexts();

  const observer = new MutationObserver(autoDecryptAllXryptTexts);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

initAutoDecryptionObserver();
