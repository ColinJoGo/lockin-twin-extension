// Lock In Twin - content script
// Idle threshold: 2 minutes of no mouse/keyboard/scroll activity

const IDLE_TIMEOUT = 2 * 60 * 1000; // 2 minutes

const MESSAGES = [
  "you've been zoning out for 2 minutes. get back to it.",
  "bro what are you doing. lock in.",
  "the grind don't pause. what's the move?",
  "aye. you still there? focus up.",
  "2 minutes gone. don't let it be 20.",
  "your future self is watching. lock in.",
  "this ain't it. get back to work twin.",
  "idle time is borrowed time. snap out of it.",
  "wake up. you got goals.",
  "stop drifting. you know what you're supposed to be doing.",
];

let idleTimer = null;
let isEnabled = true;
let overlayVisible = false;

// Get initial state from background
chrome.runtime.sendMessage({ action: "getState" }, (res) => {
  if (res) isEnabled = res.enabled;
  if (isEnabled) startIdleTimer();
});

// Listen for state changes from background
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "stateChange") {
    isEnabled = msg.enabled;
    if (isEnabled) {
      startIdleTimer();
    } else {
      clearTimeout(idleTimer);
      hideOverlay();
    }
  }
});

function resetTimer() {
  if (!isEnabled) return;
  clearTimeout(idleTimer);
  idleTimer = setTimeout(showOverlay, IDLE_TIMEOUT);
}

function startIdleTimer() {
  resetTimer();
}

// Activity listeners
["mousemove", "keydown", "mousedown", "touchstart", "scroll", "click"].forEach(event => {
  document.addEventListener(event, () => {
    if (overlayVisible) hideOverlay();
    resetTimer();
  }, { passive: true });
});

function getRandomMessage() {
  return MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
}

function showOverlay() {
  if (overlayVisible || !isEnabled) return;
  overlayVisible = true;

  const overlay = document.createElement("div");
  overlay.id = "lockin-overlay";

  const msg = getRandomMessage();

  overlay.innerHTML = `
    <div class="li-backdrop"></div>
    <div class="li-card">
      <div class="li-glitch-wrap">
        <div class="li-title" data-text="LOCK IN TWIN">LOCK IN TWIN</div>
      </div>
      <div class="li-divider"></div>
      <div class="li-message">${msg}</div>
      <div class="li-timer-wrap">
        <div class="li-timer-bar"><div class="li-timer-fill" id="li-timer-fill"></div></div>
        <div class="li-timer-label">auto-dismiss in <span id="li-countdown">10</span>s</div>
      </div>
      <button class="li-btn" id="li-dismiss">i'm locked in 🔒</button>
    </div>
  `;

  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add("li-visible"), 30);

  // Countdown
  let secs = 10;
  const fill = document.getElementById("li-timer-fill");
  const countdown = document.getElementById("li-countdown");

  const interval = setInterval(() => {
    secs--;
    if (countdown) countdown.textContent = secs;
    if (fill) fill.style.width = `${(secs / 10) * 100}%`;
    if (secs <= 0) {
      clearInterval(interval);
      hideOverlay();
      resetTimer();
    }
  }, 1000);

  document.getElementById("li-dismiss").addEventListener("click", () => {
    clearInterval(interval);
    hideOverlay();
    resetTimer();
  });
}

function hideOverlay() {
  overlayVisible = false;
  const overlay = document.getElementById("lockin-overlay");
  if (!overlay) return;
  overlay.classList.remove("li-visible");
  setTimeout(() => overlay.remove(), 500);
}
