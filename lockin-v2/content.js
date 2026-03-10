// Lock In Twin v2 - Content Script
(function() {
  if (document.getElementById("lockin-overlay")) return;

  const MESSAGES = [
    "you've been gone a while. get back to it.",
    "bro what are you doing. lock in.",
    "the grind don't pause. what's the move?",
    "aye. you still there? focus up.",
    "don't let 2 minutes turn into 20.",
    "your future self is watching. lock in.",
    "this ain't it. get back to work twin.",
    "idle time is borrowed time. snap out of it.",
    "wake up. you got goals.",
    "stop drifting. you know what you're supposed to be doing.",
  ];

  function randomMsg() { return MESSAGES[Math.floor(Math.random() * MESSAGES.length)]; }

  // Read settings then show appropriate alert
  chrome.storage.sync.get(["alertType"], (data) => {
    const type = data.alertType || "game";
    if      (type === "game")    showGameOverlay();
    else if (type === "overlay") showSimpleOverlay();
    else if (type === "banner")  showBanner();
  });

  // ===================== ALERT TYPE 1: Full overlay + mini game =====================
  function showGameOverlay() {
    const overlay = document.createElement("div");
    overlay.id = "lockin-overlay";
    overlay.innerHTML = `
      <div class="li-backdrop"></div>
      <div class="li-card">
        <div class="li-screen" id="li-screen-alert">
          <div class="li-glitch-wrap">
            <div class="li-title" data-text="LOCK IN TWIN">LOCK IN TWIN</div>
          </div>
          <div class="li-divider"></div>
          <div class="li-message">${randomMsg()}</div>
          <button class="li-btn li-btn-outline" id="li-play-btn">prove you're focused → play</button>
          <button class="li-skip" id="li-skip-btn">skip game, just dismiss</button>
        </div>
        <div class="li-screen li-hidden" id="li-screen-game">
          <div class="li-game-header">
            <div class="li-game-title">TAP THE <span style="color:#00ff88">GREEN</span> ONES</div>
            <div class="li-game-sub">hit 5 to unlock</div>
          </div>
          <div class="li-game-area" id="li-game-area"></div>
          <div class="li-game-footer">
            <div class="li-progress-wrap"><div class="li-progress-fill" id="li-progress-fill"></div></div>
            <div class="li-score-label"><span id="li-score">0</span> / 5</div>
          </div>
        </div>
        <div class="li-screen li-hidden" id="li-screen-win">
          <div class="li-win-emoji">💪</div>
          <div class="li-win-title">LOCKED IN</div>
          <div class="li-win-sub">good. now stay on it.</div>
          <button class="li-btn" id="li-win-btn">let's go</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add("li-visible"), 30);

    function showScreen(id) {
      document.querySelectorAll(".li-screen").forEach(s => s.classList.add("li-hidden"));
      document.getElementById(id).classList.remove("li-hidden");
    }
    function dismiss() {
      overlay.classList.remove("li-visible");
      setTimeout(() => overlay.remove(), 500);
    }

    document.getElementById("li-skip-btn").addEventListener("click", dismiss);
    document.getElementById("li-play-btn").addEventListener("click", () => { showScreen("li-screen-game"); startGame(); });
    document.getElementById("li-win-btn").addEventListener("click", dismiss);

    let score = 0, gameActive = false, spawnInterval = null;
    const NEEDED = 5;

    function startGame() {
      gameActive = true; score = 0; updateScore();
      spawnInterval = setInterval(spawnTarget, 900);
      spawnTarget();
    }
    function updateScore() {
      document.getElementById("li-score").textContent = score;
      document.getElementById("li-progress-fill").style.width = (score / NEEDED * 100) + "%";
    }
    function spawnTarget() {
      if (!gameActive) return;
      const area = document.getElementById("li-game-area");
      if (!area) return;
      const isGood = Math.random() > 0.3;
      const t = document.createElement("div");
      t.className = "li-target " + (isGood ? "li-target-good" : "li-target-bad");
      const size = 52, aW = area.offsetWidth || 340, aH = area.offsetHeight || 180;
      const x = Math.random() * (aW - size), y = Math.random() * (aH - size);
      t.style.left = x + "px"; t.style.top = y + "px";
      t.innerHTML = isGood ? "✓" : "✗";
      t.addEventListener("click", () => {
        if (!gameActive) return;
        if (isGood) { score = Math.min(score + 1, NEEDED); t.classList.add("li-target-hit"); showPop(area, x+size/2, y, "+1", "#00ff88"); }
        else        { score = Math.max(score - 1, 0);      t.classList.add("li-target-miss"); showPop(area, x+size/2, y, "-1", "#ff3355"); }
        updateScore();
        setTimeout(() => t.remove(), 200);
        if (score >= NEEDED) { gameActive = false; clearInterval(spawnInterval); setTimeout(() => showScreen("li-screen-win"), 400); }
      });
      area.appendChild(t);
      setTimeout(() => { if (t.parentNode) t.remove(); }, 2000);
    }
    function showPop(parent, x, y, text, color) {
      const p = document.createElement("div");
      p.className = "li-pop"; p.style.left = x+"px"; p.style.top = y+"px"; p.style.color = color; p.textContent = text;
      parent.appendChild(p); setTimeout(() => p.remove(), 700);
    }
  }

  // ===================== ALERT TYPE 2: Simple full overlay, no game =====================
  function showSimpleOverlay() {
    const overlay = document.createElement("div");
    overlay.id = "lockin-overlay";
    overlay.innerHTML = `
      <div class="li-backdrop"></div>
      <div class="li-card">
        <div class="li-screen" id="li-screen-alert">
          <div class="li-glitch-wrap">
            <div class="li-title" data-text="LOCK IN TWIN">LOCK IN TWIN</div>
          </div>
          <div class="li-divider"></div>
          <div class="li-message">${randomMsg()}</div>
          <div class="li-timer-wrap">
            <div class="li-timer-bar"><div class="li-timer-fill" id="li-timer-fill"></div></div>
            <div class="li-timer-label">auto-dismiss in <span id="li-countdown">10</span>s</div>
          </div>
          <button class="li-btn" id="li-dismiss-btn">i'm locked in 🔒</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add("li-visible"), 30);

    function dismiss() { overlay.classList.remove("li-visible"); setTimeout(() => overlay.remove(), 500); }
    document.getElementById("li-dismiss-btn").addEventListener("click", dismiss);

    let secs = 10;
    const fill = document.getElementById("li-timer-fill");
    const countdown = document.getElementById("li-countdown");
    const interval = setInterval(() => {
      secs--;
      if (countdown) countdown.textContent = secs;
      if (fill) fill.style.width = (secs / 10 * 100) + "%";
      if (secs <= 0) { clearInterval(interval); dismiss(); }
    }, 1000);
  }

  // ===================== ALERT TYPE 3: Top banner (non-intrusive) =====================
  function showBanner() {
    if (document.getElementById("lockin-banner")) return;
    const banner = document.createElement("div");
    banner.id = "lockin-banner";
    banner.innerHTML = `
      <span class="li-banner-icon">🔒</span>
      <span class="li-banner-text">LOCK IN TWIN — <span class="li-banner-msg">${randomMsg()}</span></span>
      <button class="li-banner-close" id="li-banner-close">✕ i'm back</button>`;
    document.body.prepend(banner);
    setTimeout(() => banner.classList.add("li-banner-visible"), 30);

    document.getElementById("li-banner-close").addEventListener("click", () => {
      banner.classList.remove("li-banner-visible");
      setTimeout(() => banner.remove(), 400);
    });

    // Auto dismiss after 15s
    setTimeout(() => {
      if (banner.parentNode) { banner.classList.remove("li-banner-visible"); setTimeout(() => banner.remove(), 400); }
    }, 15000);
  }

})();
