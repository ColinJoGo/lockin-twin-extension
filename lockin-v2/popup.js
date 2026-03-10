const mainToggle   = document.getElementById("main-toggle");
const toggleSwitch = document.getElementById("toggle-switch");
const mtLabel      = document.getElementById("mt-label");
const mtSub        = document.getElementById("mt-sub");
const timerSlider  = document.getElementById("timer-slider");
const timerDisplay = document.getElementById("timer-display");
const saveBtn      = document.getElementById("save-btn");
const testBtn      = document.getElementById("test-btn");
const savedFlash   = document.getElementById("saved-flash");
const alertOpts    = document.querySelectorAll(".alert-opt");

let currentEnabled   = true;
let selectedAlertType = "game";
let settingsChanged  = false;

// --- Load saved settings ---
chrome.storage.sync.get(["enabled", "timerMinutes", "alertType"], (data) => {
  currentEnabled    = data.enabled !== false;
  const mins        = data.timerMinutes || 2;
  selectedAlertType = data.alertType || "game";

  applyToggleUI(currentEnabled);
  timerSlider.value = mins;
  updateTimerDisplay(mins);
  selectAlertType(selectedAlertType);
});

// --- Toggle power ---
mainToggle.addEventListener("click", () => {
  currentEnabled = !currentEnabled;
  applyToggleUI(currentEnabled);
  chrome.runtime.sendMessage({ action: "toggle" });
});

function applyToggleUI(enabled) {
  toggleSwitch.classList.toggle("on", enabled);
  mtLabel.textContent = enabled ? "Enabled" : "Enable";
  mtLabel.classList.toggle("on", enabled);
  mtSub.classList.toggle("on", enabled);
}

// --- Timer slider ---
timerSlider.addEventListener("input", () => {
  updateTimerDisplay(timerSlider.value);
  markChanged();
});

function updateTimerDisplay(mins) {
  timerDisplay.textContent = mins == 1 ? "1 min" : `${mins} min`;
}

// --- Alert type selection ---
alertOpts.forEach(opt => {
  opt.addEventListener("click", () => {
    selectAlertType(opt.dataset.type);
    markChanged();
  });
});

function selectAlertType(type) {
  selectedAlertType = type;
  alertOpts.forEach(o => o.classList.toggle("selected", o.dataset.type === type));
}

// --- Save button ---
function markChanged() {
  settingsChanged = true;
}

saveBtn.addEventListener("click", () => {
  const mins = parseInt(timerSlider.value);
  chrome.storage.sync.set({
    timerMinutes: mins,
    alertType: selectedAlertType,
    enabled: currentEnabled
  }, () => {
    // Tell background to update its idle interval
    chrome.runtime.sendMessage({ action: "updateSettings", timerMinutes: mins, alertType: selectedAlertType });
    flashSaved();
    settingsChanged = false;
  });
});

function flashSaved() {
  savedFlash.classList.add("show");
  setTimeout(() => savedFlash.classList.remove("show"), 1800);
}

// --- Test fire ---
testBtn.addEventListener("click", () => {
  testBtn.textContent = "firing...";
  testBtn.disabled = true;
  chrome.runtime.sendMessage({ action: "testFire" }, () => {
    setTimeout(() => {
      testBtn.textContent = "⚡ test";
      testBtn.disabled = false;
    }, 2000);
  });
  window.close();
});
