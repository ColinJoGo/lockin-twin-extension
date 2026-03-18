// Lock In Twin - Content Listener v3.1
// Runs automatically on every http/https page via manifest

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action !== "show") return;
  if (document.getElementById("lit-root")) return;

  chrome.storage.sync.get(["alertType"], (data) => {
    const type = (data && data.alertType) || "game";
    playAlarm();
    flashScreen();
    showAlert(type);
  });
});

const MSGS = [
  "you've been gone a while. lock in.",
  "bro what are you doing. get back to it.",
  "the grind don't pause. what's the move?",
  "aye. you still there? focus up.",
  "your future self is watching.",
  "idle time is borrowed time. snap out of it.",
  "wake up. you got goals.",
  "stop drifting. you know what you're supposed to be doing.",
];
const msg = () => MSGS[Math.floor(Math.random() * MSGS.length)];

// ── ALARM SOUND (Web Audio API — no files needed) ──────
function playAlarm() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    function beep(freq, startTime, duration, vol = 0.4) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "square";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(vol, startTime + 0.01);
      gain.gain.setValueAtTime(vol, startTime + duration - 0.03);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    }

    const now = ctx.currentTime;
    // Alarm pattern: two high beeps, pause, two high beeps
    beep(880, now,        0.12);
    beep(880, now + 0.16, 0.12);
    beep(660, now + 0.36, 0.18);
    beep(880, now + 0.62, 0.12);
    beep(880, now + 0.78, 0.12);
    beep(660, now + 0.98, 0.22);

    // Close context after alarm finishes
    setTimeout(() => ctx.close(), 1500);
  } catch(e) {
    // Audio blocked or unavailable — silent fail
  }
}

// ── SCREEN PULSE (epilepsy-safe: 0.6Hz, low opacity, smooth ease) ─────────────
function flashScreen() {
  if (document.getElementById("lit-flash")) return;

  if (!document.getElementById("lit-flash-style")) {
    const style = document.createElement("style");
    style.id = "lit-flash-style";
    // Safe parameters:
    // - 1.6s per cycle = 0.6 Hz (danger threshold is 3 Hz)
    // - Max opacity 12% — subtle glow, no harsh contrast
    // - ease-in-out = smooth sine curve, no hard cuts
    style.textContent = `
      @keyframes lit-pulse-anim {
        0%   { background: rgba(0, 255, 136, 0.0);  }
        50%  { background: rgba(0, 255, 136, 0.12); }
        100% { background: rgba(0, 255, 136, 0.0);  }
      }
    `;
    document.head.appendChild(style);
  }

  const flash = document.createElement("div");
  flash.id = "lit-flash";
  flash.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 2147483646;
    pointer-events: none;
    animation: lit-pulse-anim 1.6s ease-in-out infinite;
  `;
  document.body.appendChild(flash);

  // Stop pulsing once the alert is dismissed
  const observer = new MutationObserver(() => {
    if (!document.getElementById("lit-root")) {
      flash.remove();
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true });
}

// ── CSS INJECTION ──────────────────────────────────────
function injectCSS() {
  if (document.getElementById("lit-styles")) return;
  const link = document.createElement("link");
  link.id = "lit-styles";
  link.rel = "stylesheet";
  link.href = chrome.runtime.getURL("content.css");
  document.head.appendChild(link);
}

function showAlert(type) {
  injectCSS();
  if (type === "banner") showBanner();
  else if (type === "overlay") showOverlay();
  else showGame();
}

// ── BANNER ─────────────────────────────────────────────
function showBanner() {
  const el = document.createElement("div");
  el.id = "lit-root";
  el.innerHTML = `<div id="lit-banner"><span>🔒 LOCK IN TWIN — ${msg()}</span><button id="lit-banner-btn">i'm back ✕</button></div>`;
  document.body.appendChild(el);
  setTimeout(() => document.getElementById("lit-banner").classList.add("lit-show"), 30);
  document.getElementById("lit-banner-btn").onclick = () => el.remove();
  setTimeout(() => { if (el.parentNode) el.remove(); }, 12000);
}

// ── SIMPLE OVERLAY ─────────────────────────────────────
function showOverlay() {
  const el = document.createElement("div");
  el.id = "lit-root";
  el.innerHTML = `
    <div id="lit-overlay">
      <div id="lit-card">
        <div id="lit-title">LOCK IN TWIN</div>
        <div id="lit-msg">${msg()}</div>
        <div id="lit-bar-wrap"><div id="lit-bar"></div></div>
        <div id="lit-countdown-label">auto-dismiss in <span id="lit-secs">10</span>s</div>
        <button id="lit-ok-btn">i'm locked in 🔒</button>
      </div>
    </div>`;
  document.body.appendChild(el);
  setTimeout(() => document.getElementById("lit-overlay").classList.add("lit-show"), 30);
  const dismiss = () => el.remove();
  document.getElementById("lit-ok-btn").onclick = dismiss;
  let s = 10;
  const iv = setInterval(() => {
    s--;
    const se = document.getElementById("lit-secs");
    const ba = document.getElementById("lit-bar");
    if (se) se.textContent = s;
    if (ba) ba.style.width = (s / 10 * 100) + "%";
    if (s <= 0) { clearInterval(iv); dismiss(); }
  }, 1000);
}

// ── GAME OVERLAY ───────────────────────────────────────
function showGame() {
  const el = document.createElement("div");
  el.id = "lit-root";
  el.innerHTML = `
    <div id="lit-overlay">
      <div id="lit-card">
        <div id="lit-screen-wake">
          <div id="lit-title">LOCK IN TWIN</div>
          <div id="lit-msg">${msg()}</div>
          <button id="lit-play-btn" class="lit-btn-outline">prove you're focused → play</button>
          <button id="lit-just-btn" class="lit-skip">skip, just dismiss</button>
        </div>
        <div id="lit-screen-game" class="lit-hidden">
          <div class="lit-game-head">TAP THE <span style="color:#00ff88">GREEN ✓</span> — AVOID RED ✗</div>
          <div class="lit-game-sub">hit 5 to unlock</div>
          <div id="lit-arena"></div>
          <div class="lit-game-foot">
            <div id="lit-prog-wrap"><div id="lit-prog"></div></div>
            <div id="lit-score-lbl"><span id="lit-hits">0</span>/5</div>
          </div>
        </div>
        <div id="lit-screen-win" class="lit-hidden">
          <div id="lit-win-icon">💪</div>
          <div id="lit-win-title">LOCKED IN</div>
          <div id="lit-win-sub">good. now stay on it.</div>
          <button id="lit-win-btn" class="lit-btn-solid">let's go</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(el);
  setTimeout(() => document.getElementById("lit-overlay").classList.add("lit-show"), 30);

  const $ = id => document.getElementById(id);
  const screens = ["lit-screen-wake","lit-screen-game","lit-screen-win"];
  const show = id => { screens.forEach(s => $(s).classList.add("lit-hidden")); $(id).classList.remove("lit-hidden"); };
  const dismiss = () => el.remove();

  $("lit-just-btn").onclick = dismiss;
  $("lit-play-btn").onclick = () => { show("lit-screen-game"); startGame(); };
  $("lit-win-btn").onclick = dismiss;

  let hits = 0, active = false, iv = null;
  const NEED = 5;

  function startGame() {
    active = true; hits = 0; updateHits();
    iv = setInterval(spawn, 850);
    spawn();
  }
  function updateHits() {
    $("lit-hits").textContent = hits;
    $("lit-prog").style.width = (hits / NEED * 100) + "%";
  }
  function spawn() {
    if (!active) return;
    const arena = $("lit-arena");
    if (!arena) return;
    const good = Math.random() > 0.3;
    const t = document.createElement("div");
    t.className = "lit-target " + (good ? "lit-good" : "lit-bad");
    const sz = 50, aw = arena.offsetWidth || 320, ah = arena.offsetHeight || 160;
    const x = Math.random() * (aw - sz), y = Math.random() * (ah - sz);
    t.style.cssText = `left:${x}px;top:${y}px`;
    t.textContent = good ? "✓" : "✗";
    t.onclick = () => {
      if (!active) return;
      if (good) { hits = Math.min(hits+1, NEED); pop(arena,x+sz/2,y,"+1","#00ff88"); }
      else       { hits = Math.max(hits-1, 0);   pop(arena,x+sz/2,y,"-1","#ff3355"); }
      t.remove(); updateHits();
      if (hits >= NEED) { active=false; clearInterval(iv); setTimeout(()=>show("lit-screen-win"),350); }
    };
    arena.appendChild(t);
    setTimeout(() => { if (t.parentNode) t.remove(); }, 1800);
  }
  function pop(parent, x, y, txt, color) {
    const p = document.createElement("div");
    p.className = "lit-pop";
    p.style.cssText = `left:${x}px;top:${y}px;color:${color}`;
    p.textContent = txt;
    parent.appendChild(p);
    setTimeout(() => p.remove(), 650);
  }
}
