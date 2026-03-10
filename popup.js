const toggleWrap = document.getElementById("toggle-wrap");
const toggleLabel = document.getElementById("toggle-label");
const statusPill = document.getElementById("status-pill");

function applyState(enabled) {
  if (enabled) {
    toggleWrap.classList.add("on");
    toggleLabel.textContent = "Enabled";
    statusPill.textContent = "ACTIVE";
    statusPill.classList.add("on");
  } else {
    toggleWrap.classList.remove("on");
    toggleLabel.textContent = "Enable";
    statusPill.textContent = "INACTIVE";
    statusPill.classList.remove("on");
  }
}

// Load current state
chrome.runtime.sendMessage({ action: "getState" }, (res) => {
  applyState(res?.enabled !== false);
});

// Toggle on click
toggleWrap.addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "toggle" }, (res) => {
    applyState(res.enabled);
  });
});
