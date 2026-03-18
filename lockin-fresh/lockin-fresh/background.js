// Lock In Twin - Background

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ enabled: true, timerMinutes: 2, alertType: "game" });
  chrome.action.setBadgeText({ text: "ON" });
  chrome.action.setBadgeBackgroundColor({ color: "#00ff88" });
  chrome.idle.setDetectionInterval(120);
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.sync.get(["enabled", "timerMinutes"], (data) => {
    const on = data.enabled !== false;
    chrome.action.setBadgeText({ text: on ? "ON" : "OFF" });
    chrome.action.setBadgeBackgroundColor({ color: on ? "#00ff88" : "#555" });
    chrome.idle.setDetectionInterval(Math.max(15, (data.timerMinutes || 2) * 60));
  });
});

chrome.idle.onStateChanged.addListener((state) => {
  if (state !== "idle") return;
  chrome.storage.sync.get("enabled", (data) => {
    if (data.enabled === false) return;
    trigger();
  });
});

function trigger() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    const url = tabs[0].url || "";
    if (!url.startsWith("http://") && !url.startsWith("https://")) return;
    // content_listener.js is already running on the page - just message it
    chrome.tabs.sendMessage(tabs[0].id, { action: "show" }, () => {
      if (chrome.runtime.lastError) console.log("msg err:", chrome.runtime.lastError.message);
    });
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "toggle") {
    chrome.storage.sync.get("enabled", (data) => {
      const next = !data.enabled;
      chrome.storage.sync.set({ enabled: next });
      chrome.action.setBadgeText({ text: next ? "ON" : "OFF" });
      chrome.action.setBadgeBackgroundColor({ color: next ? "#00ff88" : "#555" });
      sendResponse({ enabled: next });
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
    chrome.idle.setDetectionInterval(Math.max(15, (msg.timerMinutes || 2) * 60));
    sendResponse({ ok: true });
    return true;
  }

  if (msg.action === "test") {
    trigger();
    sendResponse({ ok: true });
    return true;
  }
});
