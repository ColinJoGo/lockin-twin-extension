// Background service worker for Lock In Twin

// Default state: enabled
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ enabled: true });
  updateIcon(true);
});

function updateIcon(enabled) {
  // Tint the badge to show state
  chrome.action.setBadgeText({ text: enabled ? "ON" : "OFF" });
  chrome.action.setBadgeBackgroundColor({ color: enabled ? "#00ff88" : "#444444" });
}

// Listen for toggle messages from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "toggle") {
    chrome.storage.sync.get("enabled", (data) => {
      const newState = !data.enabled;
      chrome.storage.sync.set({ enabled: newState });
      updateIcon(newState);

      // Tell all content scripts about the state change
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, { action: "stateChange", enabled: newState }).catch(() => {});
        });
      });

      sendResponse({ enabled: newState });
    });
    return true;
  }

  if (msg.action === "getState") {
    chrome.storage.sync.get("enabled", (data) => {
      sendResponse({ enabled: data.enabled !== false });
    });
    return true;
  }
});

// Set initial badge on startup
chrome.storage.sync.get("enabled", (data) => {
  updateIcon(data.enabled !== false);
});
