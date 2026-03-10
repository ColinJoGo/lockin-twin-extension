// Lock In Twin v2 - Background Service Worker

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ enabled: true, timerMinutes: 2, alertType: "game" });
  updateIcon(true);
  chrome.idle.setDetectionInterval(120);
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.sync.get(["enabled", "timerMinutes"], (data) => {
    updateIcon(data.enabled !== false);
    const secs = Math.max(15, (data.timerMinutes || 2) * 60);
    chrome.idle.setDetectionInterval(secs);
  });
});

function updateIcon(enabled) {
  chrome.action.setBadgeText({ text: enabled ? "ON" : "OFF" });
  chrome.action.setBadgeBackgroundColor({ color: enabled ? "#00ff88" : "#555555" });
}

// Browser-wide idle detection
chrome.idle.onStateChanged.addListener((state) => {
  if (state !== "idle" && state !== "locked") return;
  chrome.storage.sync.get("enabled", (data) => {
    if (data.enabled !== false) triggerLockIn();
  });
});

async function triggerLockIn() {
  let tabs;
  try {
    tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  } catch (e) { return; }

  if (!tabs || !tabs[0]) return;
  const tab = tabs[0];
  if (!tab.url) return;
  if (tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://") || tab.url.startsWith("about:") || tab.url.startsWith("edge://")) return;

  try {
    await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ["content.css"] });
  } catch(e) { console.log("CSS inject failed:", e.message); }

  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
  } catch(e) { console.log("JS inject failed:", e.message); }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "toggle") {
    chrome.storage.sync.get("enabled", (data) => {
      const newState = !data.enabled;
      chrome.storage.sync.set({ enabled: newState });
      updateIcon(newState);
      sendResponse({ enabled: newState });
    });
    return true;
  }

  if (msg.action === "getState") {
    chrome.storage.sync.get(["enabled", "timerMinutes", "alertType"], (data) => {
      sendResponse({
        enabled: data.enabled !== false,
        timerMinutes: data.timerMinutes || 2,
        alertType: data.alertType || "game"
      });
    });
    return true;
  }

  if (msg.action === "updateSettings") {
    const secs = Math.max(15, (msg.timerMinutes || 2) * 60);
    chrome.idle.setDetectionInterval(secs);
    sendResponse({ ok: true });
    return true;
  }

  if (msg.action === "testFire") {
    triggerLockIn().then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false }));
    return true;
  }
});
