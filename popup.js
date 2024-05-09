// Dynamically update the passphrase section
function updatePassphraseSection(hasPassphrase) {
  const passphraseSection = document.getElementById("passphraseSection");
  passphraseSection.innerHTML = "";

  if (hasPassphrase) {
    // Show reset button
    const resetButton = document.createElement("button");
    resetButton.id = "resetPassphraseButton";
    resetButton.textContent = "Reset Passphrase";
    passphraseSection.appendChild(resetButton);
  } else {
    // Show passphrase input and confirm button
    const passphraseInput = document.createElement("input");
    passphraseInput.type = "password";
    passphraseInput.placeholder = "Enter Passphrase";
    passphraseInput.id = "passphraseInput";
    passphraseSection.appendChild(passphraseInput);

    const confirmButton = document.createElement("button");
    confirmButton.id = "confirmPassphraseButton";
    confirmButton.textContent = "Confirm Passphrase";
    passphraseSection.appendChild(confirmButton);
  }
}

// Confirm passphrase by sending it to the content script
function confirmPassphrase() {
  const passphraseInput = document.getElementById("passphraseInput").value;
  if (passphraseInput.trim()) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: "setPassphrase", passphrase: passphraseInput },
          (response) => {
            if (response && response.status === "success") {
              updatePassphraseSection(true);
              alert("Passphrase has been set successfully.");
            } else {
              alert("Unable to set passphrase.");
            }
          }
        );
      } else {
        alert("No active tab found.");
      }
    });
  } else {
    alert("Passphrase cannot be empty.");
  }
}

// Reset passphrase by clearing it from memory
function resetPassphrase() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "resetPassphrase" },
        (response) => {
          if (response && response.status === "success") {
            updatePassphraseSection(false);
            alert("Passphrase has been reset.");
          } else {
            alert("Failed to reset passphrase.");
          }
        }
      );
    } else {
      alert("No active tab found.");
    }
  });
}

// Add event listeners for confirm and reset buttons
function addEventListeners() {
  const confirmButton = document.getElementById("confirmPassphraseButton");
  const resetButton = document.getElementById("resetPassphraseButton");

  if (confirmButton) confirmButton.addEventListener("click", confirmPassphrase);
  if (resetButton) resetButton.addEventListener("click", resetPassphrase);
}

// Check passphrase status on popup load
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs.length > 0) {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { action: "checkPassphrase" },
      (response) => {
        const hasPassphrase = response && response.hasPassphrase;
        updatePassphraseSection(hasPassphrase);
        addEventListeners(); // Attach listeners after updating the section
      }
    );
  }
});

document.getElementById("encrypt").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "encryptText" },
        (response) => {
          if (response && response.status === "success") {
            alert(response.message);
          } else {
            alert("Failed to encrypt text.");
          }
        }
      );
    } else {
      alert("No active tab found.");
    }
  });
});

document.getElementById("addKey").addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("keys.html") });
});
