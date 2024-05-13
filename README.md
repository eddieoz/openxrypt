## OpenXrypt: Secure Direct Messaging for Social Media

OpenXrypt is a Chrome extension that provides secure and encrypted communication on social media platforms, particularly for direct messages (DMs) on X (formerly known as Twitter). It utilizes the OpenPGP encryption standard to help protect the privacy of your communications and ensure the confidentiality of sensitive information.

## The Importance of Secure Communication
Social media platforms have become integral parts of our daily lives, facilitating real-time communication, information sharing, and community building. However, the inherent nature of these platforms often raises concerns regarding user privacy and data security. Unencrypted messages and personal information are susceptible to potential surveillance, data breaches, and unauthorized access, posing significant risks to individuals and organizations.

OpenXrypt recognizes the critical need for secure communication channels, particularly in an era where privacy violations and data mishandling have become increasingly prevalent. By offering robust encryption capabilities, OpenXrypt aims to empower users to engage in secure conversations, share sensitive information, and express themselves freely without the fear of unauthorized monitoring or interception.

## Key Features

- **End-to-End Encryption:** Encrypts messages using OpenPGP to ensure only the sender and recipient can access the content.
- **Automatic Encryption and Decryption:** OpenXrypt seamlessly integrates with X (formerly Twitter) direct messaging, automatically encrypting and decrypting messages using OpenPGP standards, ensuring that sensitive information remains protected during transmission and storage.
- **Passphrase Management:** Users can securely set, reset, and manage their passphrases, enabling them to maintain control over their encryption keys and ensure the confidentiality of their communications.
- **Key Management:** OpenXrypt provides a user-friendly interface for adding, editing, and deleting GPG public and private keys, allowing users to manage their encryption keys and those of their contacts with ease.

### Screenshots

![Popup](imgs/opnxrpt-popup.png)
![Manage pubkeys](imgs/opnxrpt-mng-pubkeys.png)
![Manage privkeys](imgs/opnxrpt-mng-privkeys.png)
![Show pubkey](imgs/opnxrpt-show-pubkeys.png)

### How It Works

1. **Install Extension:** Add OpenXrypt to your Chrome browser.
2. **Setup Keys:**
   - Add GPG (armored) public keys for your contacts.
   - Add GPG (armored) your own private key for decryption (recommend ECC-25519 bc size&speed)
3. **Encrypt & Decrypt:**
   - **Encrypt:** Select text in a direct message and click the "Encrypt" button in the popup.
   - **Decrypt:** Encrypted messages will be automatically decrypted and replaced with readable text.

### Getting Started

#### Installation

1. Clone the repository or download the ZIP:
    ```bash
    git clone https://github.com/eddieoz/openxrypt.git
    ```
2. Open the Chrome Extensions page by navigating to `chrome://extensions/`.
3. Enable "Developer mode" using the toggle switch.
4. Click "Load unpacked" and select the cloned/downloaded `openxrypt` folder.
5. Close and reopen the browser to correctly load the extension.

### Key Management

- **Manage Public Keys:** Add and delete public keys for your contacts.
- **Manage Private Keys:** Add, delete, and use your private key to decrypt messages.
- **View Fingerprints:** Easily view the GPG fingerprint for each key.

1. All keys are managed locally. 
2. It is recommended to create a new private key for messaging purposes.

#### Public Key Management

1. Open the **Manage Keys** section via the popup.
2. Enter the X handle and paste the contact's public key.
3. Click **Add Key**.

#### Private Key Management

1. Enter your X handle and paste your private key.
2. Click **Add Private Key**.

### How to Encrypt and Decrypt Messages

#### Encrypt Text

1. Go and DM one of your contacts that you have already added a public key (from Messages left menu)
![](imgs/opnxrpt-send.msg.png)
2. Write a message
3. Selected the entire messade (CTRL + A or CMD + A)
4. Open the OpenXrypt popup by clicking the extension icon.
5. Click the **Encrypt** button.
   - The selected text will be encrypted and replaced.
7. Send the message on X.

#### Automatic Decryption

Encrypted messages will be automatically decrypted on the X website.

#### My pubkey

If you want to try, drop me a DM on X. Just add `@eddieoz` and the pubkey below.

```
-----BEGIN PGP PUBLIC KEY BLOCK-----

xjMEZj4wahYJKwYBBAHaRw8BAQdAFYhu0HUpfn3Iku+KFGghJdYB1HefU4cB
F5u2rhmI5NfNHEVkZGllT3ogKHVzZWQgZm9yIE9wZW5YcnlwdCnCrQQTFggA
PhYhBBOCHcMytdy4w1uDNtbLM3XlJgVNBQJmPjBqAhsDBQkB4TOABQsJCAcC
BhUKCQgLAgQWAgMBAh4BAheAACEJENbLM3XlJgVNFiEEE4IdwzK13LjDW4M2
1sszdeUmBU0pKwD9EgovnDI7yVZXmSKZlFgl3VZl2tDnw1EgIoEG9Qt+v/QB
AI0dIlX3J7IZrccUWPcRcOU3V9Jb6hMeChkd3tUKlOMPzjgEZj4wahIKKwYB
BAGXVQEFAQEHQKfhytNbWHaSneg613gh/nA/wA+IcuKiuszsPHJ8kSswAwEI
B8KVBBgWCAAmFiEEE4IdwzK13LjDW4M21sszdeUmBU0FAmY+MGoCGwwFCQHh
M4AAIQkQ1sszdeUmBU0WIQQTgh3DMrXcuMNbgzbWyzN15SYFTXQAAP4jOFzK
MjdyS8Sw//1pD1Sle329OCU+bW1gh96m0fErzgEA+GkFAcH5XkELMDy6CUHF
fPpU+z70EKFF+IXjY6nm9QY=
=JhSM
-----END PGP PUBLIC KEY BLOCK-----

```

#### Setup for Development

1. Clone the repository.
2. Install the extension using the steps in the Installation section.
3. Make changes and reload the extension.

### Contribution Guidelines

- Fork the repository and clone to your local environment.
- Create a new feature branch.
- Commit your changes with clear messages.
- Push your feature branch and submit a PR.

### To-do
- Encrypted public timeline posts (maybe use symmetric encryption with X handle, just to keep it fuzzy).
- Encrypted group messages.
- Extend the extension to cover more web messengers like WhatsApp, Telegram, and others.

### License

This project is licensed under the MIT License.

---

#### FAQs

1. **How does OpenXrypt handle my passphrase?**

   The passphrase is securely stored in session storage and only for the current browser session.

2. **Can I use OpenXrypt with other platforms?**

   Currently, OpenXrypt is optimized for X direct messages but can be extended to other platforms.

3. **Is my data stored online?**

   No, OpenXrypt stores encryption keys locally in your browser's storage.

### Contact

For further queries, reach out via [GitHub Issues](https://github.com/eddieoz/openxrypt/issues).

Feel free to ask for more questions or specific edits!

## Buy me a coffee
Did you like it? [Buy me a coffee](https://www.buymeacoffee.com/eddieoz)

[![Buy me a coffee](https://ipfs.io/ipfs/QmR6W4L3XiozMQc3EjfFeqSkcbu3cWnhZBn38z2W2FuTMZ?filename=buymeacoffee.webp)](https://www.buymeacoffee.com/eddieoz)

Or drop me a tip through Lightning Network: ⚡ [zbd.gg/eddieoz](https://zbd.gg/eddieoz)

