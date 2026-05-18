function getWebsite() {
  const names = location.href.split('/')[2].split('.');
  if (names.length > 2) {
    // return second name
    return names[1];
  }
  return names[0];
}

const commonTwitterActions = [
  { type: 'sender', action: findUsernameFromInitialState },
  { type: 'userid', action: findTwitterHandle },
  { type: 'groupIds', action: getXGroupUserIds },
  {
    type: 'senderButton',
    action: () =>
      document.querySelector('[data-testid="dmComposerSendButton"]'),
  },
  {
    type: 'input',
    action: () => document.querySelector('[data-testid="dmComposerTextInput"]'),
  },
  { type: 'decrypt', action: () => document.querySelectorAll('body, body *') },
  {
    type: 'postButton',
    action: () => document.querySelector('button[data-testid="tweetButton"]'),
  },
];

// Site mapping for arrays of specific functions
const siteActions = {
  twitter: commonTwitterActions,
  x: commonTwitterActions,
  whatsapp: [
    { type: 'sender', action: findWhatsappNumberSender },
    { type: 'userid', action: findWhatsappNumber },
    {
      type: 'groupIds',
      action: async () => {
        const userIds = await getWhatsappGroupUserIds(
          await getWhatsappGroupId()
        );
        return userIds;
      },
    },
    {
      type: 'senderButton',
      action: () => {
        const elements = Array.from(
          document.querySelectorAll('#main footer button[aria-label]')
        );
        const lastElement = elements[elements.length - 1];
        return lastElement;
      },
    },
    {
      type: 'input',
      action: () => {
        const mainEl = document.querySelector('#main');
        return mainEl.querySelector('div[contenteditable="true"]');
      },
    },
    {
      type: 'decrypt',
      action: () => {
        const mainEl = document.querySelector('#main');
        if (mainEl)
          mainEl
            .querySelectorAll(
              'div[data-id^="false_"] span[dir="ltr"] span, div[data-id^="true_"] div[role="button"].read-more-button'
            ) // clica no botão de read more automaticamente se ele existir
            .forEach((bt) => bt.click());
        return mainEl.querySelectorAll(
          'div[data-id^="false_"] span[dir="ltr"] span, div[data-id^="true_"] span[dir="ltr"]'
        );
        return null;
      },
    },
  ],
};

function getAction(type) {
  const websiteName = getWebsite();

  // Checks if there is an array of functions associated with the current site
  if (siteActions.hasOwnProperty(websiteName)) {
    // Iterates over the associated functions and performs those that are relevant to the desired action type
    const senderAction = siteActions[websiteName].find(
      (element) => element.type === type
    );
    if (senderAction) {
      return senderAction.action();
    } else {
      return null;
    }
  } else {
    return null;
  }
}

// WhatsApp functions
function findWhatsappNumberSender() {
  const number = localStorage
    .getItem('last-wid-md')
    .split(':')[0]
    .replace('"', '');
  return number;
}
function findWhatsappNumber() {
  // Get the first message element that contains the data-id attribute with a phone number
  const messageElement = document.querySelector('div[data-id*="@c.us_"]');

  // Check if the element exists and has the data-id attribute
  if (messageElement && messageElement.dataset.id) {
    const dataId = messageElement.dataset.id;

    // Extract the phone number from the data-id
    const numberMatch = dataId.match(/true_(\d+?)@c\.us_/);

    // If a match is found, return the phone number
    if (numberMatch) {
      return numberMatch[1];
    }
  }

  // Return null if no valid number is found
  return null;
}

// twitter functions

// Improved version using a link preceding the handle
function findTwitterHandle() {
  // Find the section containing the conversation or profile details
  const section =
    document.querySelector('section[aria-label="Section details"]') ||
    document.querySelector('section[aria-labelledby="detail-header"]');

  if (section) {
    // Test if DM does't show the use info on top
    // If it shows just an avatar with link, it gets the user from the avatar link
    // otherwise it gets the user from the info
    const topAvatar = section.querySelector(
      '[data-testid="DM_Conversation_Avatar"]'
    );
    if (topAvatar) {
      const handleMatch = topAvatar.href.match(/\/([^\/?]+)(?:\?|$)/);
      if (handleMatch) {
        return `@${handleMatch[1]}`;
      }
    }
    // Try to find the handle from a preceding link
    const scrooler = section.querySelector(
      '[data-testid="DmScrollerContainer"]'
    );
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

  const topAvatar = document.querySelector(
    '[data-testid="DM_Conversation_Avatar"]'
  );
  if (topAvatar) {
    const handleMatch = topAvatar.href.match(/\/([^\/?]+)(?:\?|$)/);
    if (handleMatch) {
      return `@${handleMatch[1]}`;
    }
  }

  const scrooler = document.querySelector(
    '[data-testid="DmScrollerContainer"]'
  );
  if (scrooler) {
    const link = scrooler.querySelector('a[href*="/"]');
    if (link) {
      const handleMatch = link.href.match(/\/([^\/?]+)(?:\?|$)/);
      if (handleMatch) {
        return `@${handleMatch[1]}`;
      }
    }
  }

  // Try to find the user in the DM popup if available in main X screen
  const dmDrawer = document.querySelector('div[data-testid="DMDrawer"]');
  if (dmDrawer) {
    const dmDrawerHeader = dmDrawer.querySelector(
      'div[data-testid="DMDrawerHeader"]'
    );
    if (dmDrawerHeader) {
      const handleElement = dmDrawerHeader.querySelector('span[dir="ltr"]');
      if (handleElement && handleElement.textContent.startsWith('@')) {
        return handleElement.textContent.trim();
      }
    }
  }

  // Default value if the handle is not found
  return '@unknown_dest_user';
}

// Find the username from the `window.__INITIAL_STATE__` JSON object
function findUsernameFromInitialState() {
  const scriptTags = document.querySelectorAll(
    'script[type="text/javascript"]'
  );
  for (const scriptTag of scriptTags) {
    if (scriptTag.textContent.includes('window.__INITIAL_STATE__')) {
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
          console.error('Error parsing __INITIAL_STATE__ JSON:', error);
        }
      }
    }
  }
  return '@unknown_user';
}

// Helper function to check if a string is valid JSON
function isJSON(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

// Checks if the current message is a group message
function isXGroupMessage() {
  return document.querySelector('a[aria-label="Group info"]') !== null;
}

// Function to check if the current message is a WhatsApp group message
function isWhatsappGroupMessage() {
  // Find all elements with a data-id attribute
  const elements = document.querySelectorAll('[data-id]');

  // Loop through the elements to check for the presence of @g.us
  for (let element of elements) {
    const dataId = element.getAttribute('data-id');
    if (dataId && dataId.includes('@g.us')) {
      return true;
    }
  }
  return false;
}

// Function to extract group ID from the Whatsapp group
async function getWhatsappGroupId() {
  // Find all elements with a data-id attribute
  const elements = document.querySelectorAll('[data-id]');

  // Loop through the elements to find the first occurrence of @g.us
  for (let element of elements) {
    const dataId = element.getAttribute('data-id');
    if (dataId && dataId.includes('@g.us')) {
      // Extract the group ID using regex
      const groupIdMatch = dataId.match(/_(.*?)@g\.us/);
      if (groupIdMatch && groupIdMatch[1]) {
        return groupIdMatch[1] + '@g.us';
      }
    }
  }
  return null;
}

// Get Whatsapp Group Participants from IndexDB
async function getWhatsappGroupUserIds(groupId) {
  return new Promise((resolve, reject) => {
    // Open the IndexedDB without specifying a version
    const request = indexedDB.open('model-storage');

    request.onerror = (event) => {
      console.error('Error opening IndexedDB:', event.target.error);
      reject('Error opening IndexedDB: ' + event.target.error.message);
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['participant'], 'readonly');
      const store = transaction.objectStore('participant');

      // Get the group data by groupId
      const getRequest = store.get(groupId);

      getRequest.onerror = (event) => {
        console.error('Error retrieving group data:', event.target.error);
        reject('Error retrieving group data: ' + event.target.error.message);
      };

      getRequest.onsuccess = (event) => {
        const groupData = event.target.result;
        if (groupData && groupData.participants) {
          // Remove the @c.us part from each participant's user ID
          const cleanedParticipants = groupData.participants.map(
            (participant) => participant.replace('@c.us', '')
          );
          resolve(cleanedParticipants);
        } else {
          reject('Group not found or no participants');
        }
      };
    };

    request.onupgradeneeded = (event) => {
      console.error('Upgrade needed but not handled');
      reject('Upgrade needed but not handled');
    };
  });
}

// This function is used to get the list of user IDs for a given group.
// It first finds the "Group info" button, and then clicks on it to open the group's information page.
async function getXGroupUserIds() {
  const groupInfoButton = document.querySelector('a[aria-label="Group info"]');
  if (groupInfoButton) {
    groupInfoButton.click();
    // Wait for the user list to load (you might need to adjust the delay)
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const userElements = document.querySelectorAll(
      '[data-testid="UserCell"] a[role="link"]'
    );

    // Retrieve and format unique user IDs
    const userIds = Array.from(
      new Set(
        Array.from(userElements).map(
          (el) => '@' + el.getAttribute('href').split('/').pop()
        )
      )
    );

    // Click the back button
    const backButton = document.querySelector(
      'button[data-testid="app-bar-back"]'
    );
    if (backButton) {
      backButton.click();
    }

    return userIds;
  }
  return [];
}

// Check if it is the X composition page (mobile or desktop)
function isTweetCompositionPage() {
  const canonicalLink = document.querySelector(
    'link[rel="canonical"][href="https://x.com/compose/post"]'
  );
  const alternateLink = document.querySelector(
    'link[rel="alternate"][hreflang="x-default"][href="https://x.com/compose/post"]'
  );
  return canonicalLink || alternateLink;
}

if (isTweetCompositionPage()) {
  injectEncryptButtonForTweet();
}
