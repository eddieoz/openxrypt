## OpenXrypt: Upgrade Your Social Media Privacy (Proof-of-Concept)

OpenXrypt is a Chrome extension designed to provide secure and encrypted communication on social media platforms, particularly on X (formerly known as Twitter). Utilizing OpenPGP encryption standards, OpenXrypt aims to help you protect your privacy and secure sensitive information.

### Features

- **Automatic Encryption & Decryption:** Automatically encrypt and decrypt messages using OpenPGP standards.
- **Passphrase Management:** Securely set, reset, and manage your passphrase.
- **Key Management:** Add, edit, and delete GPG public/private keys.
- **Multiple Key Encryption:** Encrypt messages for multiple recipients simultaneously.
- **Direct Message (DM) Compatibility:** Seamless integration with X (formerly Twitter) direct messaging.

### How It Works

1. **Install Extension:** Add OpenXrypt to your Chrome browser.
2. **Setup Keys:**
   - Add GPG (armored) public keys for your contacts.
   - Add GPG (armored) your own private key for decryption.
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

1. Go and DM one of your contacts that you have already added a public key
2. Write a message
3. Selected the entire messade (CTRL + A)
4. Open the OpenXrypt popup by clicking the extension icon.
5. Click the **Encrypt** button.
6. The selected text will be encrypted and replaced.
7. Send the message.

#### Automatic Decryption

Encrypted messages will be automatically decrypted on the X website.


#### Setup for Development

1. Clone the repository.
2. Install the extension using the steps in the Installation section.
3. Make changes and reload the extension.

### Contribution Guidelines

- Fork the repository and clone to your local environment.
- Create a new feature branch.
- Commit your changes with clear messages.
- Push your feature branch and submit a PR.

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

