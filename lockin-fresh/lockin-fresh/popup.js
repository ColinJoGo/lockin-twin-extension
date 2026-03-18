const powerRow  = document.getElementById("power-row");
const powerLabel= document.getElementById("power-label");
const sw        = document.getElementById("sw");
const tslider   = document.getElementById("tslider");
const tval      = document.getElementById("tval");
const saveBtn   = document.getElementById("save-btn");
const testBtn   = document.getElementById("test-btn");
const flash     = document.getElementById("flash");
const aopts     = document.querySelectorAll(".aopt");

let enabled = true;
let alertType = "game";

// Load
chrome.runtime.sendMessage({ action: "getState" }, (res) => {
  if (!res) return;
  enabled = res.enabled;
  tslider.value = res.timerMinutes || 2;
  alertType = res.alertType || "game";
  updateTimerLabel(tslider.value);
  applyPower(enabled);
  applyAlertType(alertType);
});

// Power toggle
powerRow.addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "toggle" }, (res) => {
    if (res) { enabled = res.enabled; applyPower(enabled); }
  });
});

function applyPower(on) {
  sw.classList.toggle("on", on);
  powerLabel.classList.toggle("on", on);
  powerLabel.textContent = on ? "Enabled" : "Disabled";
}

// Timer
tslider.addEventListener("input", () => updateTimerLabel(tslider.value));
function updateTimerLabel(v) { tval.textContent = v == 1 ? "1 min" : v + " min"; }

// Alert type
aopts.forEach(o => o.addEventListener("click", () => {
  alertType = o.dataset.t;
  applyAlertType(alertType);
}));
function applyAlertType(t) {
  aopts.forEach(o => o.classList.toggle("sel", o.dataset.t === t));
}

// Save
saveBtn.addEventListener("click", () => {
  const mins = parseInt(tslider.value);
  chrome.storage.sync.set({ timerMinutes: mins, alertType, enabled }, () => {
    chrome.runtime.sendMessage({ action: "updateSettings", timerMinutes: mins });
    flash.classList.add("show");
    setTimeout(() => flash.classList.remove("show"), 1800);
  });
});

// Test
testBtn.addEventListener("click", () => {
  testBtn.textContent = "...";
  testBtn.disabled = true;
  chrome.runtime.sendMessage({ action: "test" }, () => {
    setTimeout(() => { testBtn.textContent = "⚡ test"; testBtn.disabled = false; }, 2000);
  });
  setTimeout(() => window.close(), 150);
});
