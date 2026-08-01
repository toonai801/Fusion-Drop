const CANVAS_W = 400;
const CANVAS_H = 600;
// Phase B polish-16: convert hex color to rgba string with alpha.
function hexToRgba(hex, alpha) {
  const h = (hex || '').replace('#', '');
  if (h.length !== 6) return 'rgba(0, 212, 255, ' + alpha + ')';
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

const DROP_LINE_Y = 90;
const MAX_PREVIEW_TIER = 2;
const GRACE_FRAMES = 180;

// Phase 2 — game modes.
//  'classic' = standard Suika: death line ends the run.
//  'zen'     = no death line (no fail), target is max score.
//  'speed'   = 90-second time attack; max score in 90 s.
// GameMode is reflected on this.mode and persisted on pause/restart.
const GAME_MODES = {
  classic: { name: 'Classic', deathLine: true, timeAttack: false, targetSec: 0 },
  zen:     { name: 'Zen',     deathLine: false, timeAttack: false, targetSec: 0 },
  speed:   { name: 'Speed',   deathLine: true, timeAttack: true,  targetSec: 90 },
};
const DEFAULT_MODE = 'classic';

// Phase 2 — milestone achievements. id -> { label, description }.
const ACHIEVEMENTS = {
  first_merge: { label: 'First Merge', description: 'Drop, collide, merge!' },
  merges_10:   { label: 'Merger',      description: '10 merges in one run' },
  merges_50:   { label: 'Fusion Master', description: '50 merges in one run' },
  score_500:   { label: 'Half K',       description: 'Score 500' },
  score_2000:  { label: 'Two Big',      description: 'Score 2000' },
  first_max:   { label: 'Apex',         description: 'Spawn the largest tier' },
};
const DROP_DELAY = 30;

class FusionGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.nextCanvas = document.getElementById('next-canvas');
    this.nextCtx = this.nextCanvas ? this.nextCanvas.getContext('2d') : null;
    this.nextCanvasDesk = document.getElementById('next-canvas-desk');
    this.nextCtxDesk = this.nextCanvasDesk ? this.nextCanvasDesk.getContext('2d') : null;

    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.physics = new Physics(0.3, 0.98, 0.2);
    this.entities = [];
    this.score = 0;
    this.highScore = 0;
    this.level = 1;
    this.currentTheme = THEMES[0];
    this.nextShape = this.randomShapeTier(MAX_PREVIEW_TIER);
    this.currentShape = this.randomShapeTier(MAX_PREVIEW_TIER);
    this.dropX = this.canvas.width / 2;
    this.dropTimer = 0;
    this.playerName = '';
    this.mode = DEFAULT_MODE;

    // Explicit state machine
    this.state = 'intro';

    this.mergeParticles = [];
    this.scorePopups = [];
    this.ambientParticles = [];
    this.mergeFlashes = [];
    this.leaderboard = [];
    this.sounds = new SoundManager();
    // Phase 5 — frame-time history (last 60 frames) and a debug overlay.
    this._frameTimes = [];
    this._lastFrameTs = 0;
    this._debugOverlay = false;
    this.frameCount = 0;

    this.renderShapeChain();
    this.reducedMotion = typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.bindEvents();
    this.showIntroScreen();
    this.fetchLeaderboard();
    // startActivePolling removed — FD-001-A2: live-players heartbeat theater cut
    this.initAmbientParticles();
    this.loop();

    // Expose for debugging
    window.game = this;

    // Phase 2 — engagement counters + achievement set.
    this.timeLeft = 0;
    this.dropsCount = 0;
    this.mergesCount = 0;
    this.achievements = new Set();
    this._longestChain = 0;
    this._chainLength = 0;
    this._lastMergeAt = 0;

    // Phase 4 — forward client-side errors to /api/diag. Best-effort, no
    // throw if the network call fails.
    if (typeof window !== 'undefined' && !window.__fd_diag_wired) {
      window.__fd_diag_wired = true;
      window.addEventListener('error', (ev) => {
        try {
          fetch('/api/diag', { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'window.onerror', detail: { msg: ev.message, src: ev.filename, line: ev.lineno, col: ev.colno } }) }).catch(() => {});
        } catch (_) {}
      });
      window.addEventListener('unhandledrejection', (ev) => {
        try {
          fetch('/api/diag', { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'unhandledrejection', detail: { reason: String(ev.reason) } }) }).catch(() => {});
        } catch (_) {}
      });
    }
  }

  getShapes() { return getCurrentShapes(this.level); }
  getPhysicsSpeed() { return getPhysicsSpeed(this.level); }
  getDeathLine() { return DROP_LINE_Y + getDeathLineOffset(this.level); }

  randomShapeTier(maxTier) {
    const weights = [];
    for (let i = 0; i <= maxTier; i++) weights.push(Math.pow(0.55, i));
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r <= 0) return i; }
    return 0;
  }

  resize() {
    // Use the canvas's actual CSS-rendered size (driven by CSS, not the parent).
    // Previously this read the parent's getBoundingClientRect, which created a
    // feedback loop on desktop (parent grew to canvas, canvas grew to parent).
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    if (this.canvas.width !== w)  this.canvas.width  = w;
    if (this.canvas.height !== h) this.canvas.height = h;
    this.canvas.style.marginLeft = '0px';
    this.canvas.style.marginTop = '0px';
    if (this.ctx) this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  setMode(mode) {
    if (!GAME_MODES[mode]) return;
    this.mode = mode;
    if (GAME_MODES[mode].timeAttack) {
      this.timeLeft = GAME_MODES[mode].targetSec * 60;
    } else {
      this.timeLeft = 0;
    }
    if (typeof document !== 'undefined' && document.getElementById) {
      const timerEl = document.getElementById('speed-timer');
      if (timerEl) {
        if (GAME_MODES[mode].timeAttack) timerEl.classList.remove('hidden');
        else timerEl.classList.add('hidden');
      }
    }
  }

  bindModeButtons() {
    if (typeof document === 'undefined' || !document.querySelectorAll) return;
    // Daily-theme button: jump-start the run at today's theme index.
    const dailyBtn = document.getElementById('btn-play-daily');
    if (dailyBtn) {
      dailyBtn.addEventListener('click', () => {
        const idx = this.getDailyThemeIndex();
        this.level = idx + 1;
        this.currentTheme = THEMES[Math.min(this.level - 1, THEMES.length - 1)];
        if (this.sounds && typeof this.sounds.setThemeIndex === 'function') {
          this.sounds.setThemeIndex(this.level - 1);
        }
      });
    }
    const buttons = document.querySelectorAll('.mode-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        const m = btn.getAttribute('data-mode');
        if (m) this.setMode(m);
      });
    });
  }

  getDailyThemeIndex() {
    const days = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    return days % THEMES.length;
  }

  // Hours remaining until the next daily theme swap. Updates each render.
  getDailyThemeHoursRemaining() {
    const now = Date.now();
    const msInDay = 1000 * 60 * 60 * 24;
    const msLeft = msInDay - (now % msInDay);
    return msLeft / (1000 * 60 * 60);
  }

  updateDailyThemeBanner() {
    if (typeof document === 'undefined' || !document.getElementById) return;
    const banner = document.getElementById('daily-theme-banner');
    if (!banner || typeof banner.querySelector !== 'function') return;
    const idx = this.getDailyThemeIndex();
    const theme = THEMES[idx];
    if (!theme) { banner.classList.add('hidden'); return; }
    banner.classList.remove('hidden');
    const nameEl = banner.querySelector('.dt-name');
    if (nameEl) nameEl.textContent = theme.name + ' (#' + (idx + 1) + ')';
    const hrEl = banner.querySelector('.dt-hours');
    if (hrEl) {
      const hrs = this.getDailyThemeHoursRemaining();
      hrEl.textContent = hrs >= 1 ? (Math.round(hrs) + 'h') : (Math.round(hrs * 60) + 'm');
    }
  }

  // Phase B polish-15: sound toggle. Persists across sessions.
  setSoundEnabled(enabled) {
    if (this.sounds) this.sounds.enabled = !!enabled;
    const btn = document.getElementById('btn-toggle-sound');
    if (btn) btn.textContent = enabled ? '🔊 Sound On' : '🔇 Sound Off';
    try { localStorage.setItem('fusion_drop_sound', enabled ? '1' : '0'); } catch (_) {}
  }

  // Phase B polish-18: today's best score from server-side leaderboard.
  async updateBestTodayBanner() {
    if (typeof document === 'undefined' || !document.getElementById) return;
    const banner = document.getElementById('best-today-banner');
    const scoreEl = banner ? banner.querySelector('.bt-score') : null;
    if (!banner || !scoreEl) return;
    try {
      const resp = await fetch('/api/scores');
      if (!resp.ok) { banner.classList.add('hidden'); return; }
      const scores = await resp.json();
      const todayStart = Math.floor(new Date().setHours(0,0,0,0) / 1000) * 1000;
      const todayScores = scores.filter(s => (s.date || 0) >= todayStart);
      if (todayScores.length === 0) { banner.classList.add('hidden'); return; }
      const top = todayScores.reduce((a, b) => (b.score > a.score ? b : a));
      banner.classList.remove('hidden');
      scoreEl.textContent = top.score + ' by ' + top.name;
    } catch (_) {
      banner.classList.add('hidden');
    }
  }

  // Phase 3 — deterministic name flair. Same name = same color across sessions.
  colorForName(name) {
    if (!name) return 'rgba(207, 234, 255, 0.85)';
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    const hue = h % 360;
    return 'hsl(' + hue + ', 70%, 65%)';
  }

  renderSpeedTimer() {
    if (typeof document === 'undefined' || !document.getElementById) return;
    const el = document.getElementById('speed-timer');
    if (!el) return;
    if (!(this.state === 'playing' && GAME_MODES[this.mode] && GAME_MODES[this.mode].timeAttack)) {
      el.classList.add('hidden');
      return;
    }
    el.classList.remove('hidden');
    const seconds = Math.max(0, this.timeLeft / 60);
    el.textContent = seconds.toFixed(1);
    if (seconds <= 10) el.classList.add('low'); else el.classList.remove('low');
  }

  // Phase 5 — show one-time onboarding overlay. Skippable; remembers it was dismissed.
  showOnboardingIfNeeded() {
    if (typeof window === 'undefined') return;
    try {
      const dismissed = localStorage.getItem('fusion_drop_onboarded') === 'true';
      if (dismissed) return;
    } catch (_) { return; }
    const el = document.getElementById('onboarding-overlay');
    const btn = document.getElementById('btn-onboarding-dismiss');
    if (!el || !btn) return;
    el.classList.remove('hidden');
    btn.addEventListener('click', () => {
      el.classList.add('hidden');
      try { localStorage.setItem('fusion_drop_onboarded', 'true'); } catch (_) {}
    }, { once: true });
  }

  showIntroScreen() {
    this.state = 'intro';
    if (typeof this.updateBestTodayBanner === 'function') this.updateBestTodayBanner();
    const intro = document.getElementById('intro-screen');
    const btnStart = document.getElementById('btn-intro-start');
    intro.classList.remove('hidden');
    this.disableCanvas();
    btnStart.addEventListener('click', () => {
      intro.classList.add('hidden');
      this.enableCanvas();
      this.showStartScreen();
    }, { once: true });

    // Phase B polish-13: 'Resume saved game' button appears if there's
    // a persisted snapshot from a previous session.
    const btnResume = document.getElementById('btn-resume-saved');
    if (btnResume) {
      if (this.hasPersistedGame()) {
        btnResume.classList.remove('hidden');
        btnResume.onclick = () => {
          if (this.restorePersistedGame()) {
            intro.classList.add('hidden');
            this.enableCanvas();
          }
        };
      } else {
        btnResume.classList.add('hidden');
        btnResume.onclick = null;
      }
    }
  }

  showStartScreen() {
    this.showOnboardingIfNeeded();
    this.state = 'name-entry';
    document.getElementById('start-screen').classList.remove('hidden');
    this.disableCanvas();
    const startName = document.getElementById('start-name');
    const btnStart = document.getElementById('btn-start');
    startName.value = '';
    startName.focus();

    const onStart = () => {
      const name = startName.value.trim();
      if (!name) { startName.style.borderColor = 'rgba(255, 0, 102, 0.6)'; return; }
      this.playerName = name;
      this.state = 'playing';
      this.sounds.init();
      this.sounds.startAmbient();
      document.getElementById('start-screen').classList.add('hidden');
      this.enableCanvas();
      startName.style.borderColor = 'rgba(0, 212, 255, 0.4)';
      this.updateHighScoreDisplay();
      this.renderLeaderboard();
    };

    btnStart.addEventListener('click', onStart, { once: true });
    startName.addEventListener('keydown', (e) => { if (e.code === 'Enter') onStart(); }, { once: true });
  }

  enableCanvas() { this.canvas.style.pointerEvents = 'auto'; }
  disableCanvas() { this.canvas.style.pointerEvents = 'none'; }

  bindEvents() {
    this.canvas.addEventListener('mousemove', (e) => this.handleMove(e));
    this.canvas.addEventListener('click', (e) => this.handleDrop(e));
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
      this.handleTouchMove(e);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      this.handleTouchMove(e);
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      // Only drop if we didn't scroll too much
      const touch = e.changedTouches[0];
      const dx = Math.abs(touch.clientX - this.touchStartX);
      const dy = Math.abs(touch.clientY - this.touchStartY);
      if (dx < 10 && dy < 10) {
        this.handleDrop(touch);
      }
    }, { passive: false });

    document.getElementById('btn-pause').addEventListener('click', () => this.togglePause());
    document.getElementById('btn-restart').addEventListener('click', () => this.restart());
    const btnPauseDesk = document.getElementById('btn-pause-desk');
    if (btnPauseDesk) btnPauseDesk.addEventListener('click', () => this.togglePause());
    const btnRestartDesk = document.getElementById('btn-restart-desk');
    if (btnRestartDesk) btnRestartDesk.addEventListener('click', () => this.restart());
    document.getElementById('btn-save').addEventListener('click', () => this.saveScore());
    document.getElementById('btn-play-again').addEventListener('click', () => this.restart());
    document.getElementById('btn-resume').addEventListener('click', () => this.togglePause());
    const btnRestartPause = document.getElementById('btn-restart-from-pause');
    if (btnRestartPause) btnRestartPause.addEventListener('click', () => this.restart());

    // Phase B polish-10: mobile leaderboard collapsible.
    const lbToggle = document.getElementById('lb-toggle');
    const lbContent = document.getElementById('lb-content');
    if (lbToggle && lbContent) {
      // Start collapsed on mobile.
      lbContent.classList.add('hidden');
      lbToggle.addEventListener('click', () => {
        const hidden = lbContent.classList.toggle('hidden');
        lbToggle.textContent = hidden ? '🏆 Leaderboard' : '🏆 Leaderboard ✕';
      });
    }

    if (typeof this.bindModeButtons === 'function') this.bindModeButtons();
    if (typeof this.updateDailyThemeBanner === 'function') this.updateDailyThemeBanner();
    const soundBtn = document.getElementById('btn-toggle-sound');
    if (soundBtn) {
      // Initial label reflects current state.
      try {
        const cur = localStorage.getItem('fusion_drop_sound');
        if (cur === '0') this.setSoundEnabled(false);
        else this.setSoundEnabled(true);
      } catch (_) { this.setSoundEnabled(true); }
      soundBtn.addEventListener('click', () => {
        const cur = this.sounds && this.sounds.enabled !== false;
        this.setSoundEnabled(!cur);
      });
    }
    const resetBtn = (typeof document !== 'undefined' && document.getElementById) ? document.getElementById('btn-reset-progress') : null;
    if (resetBtn && resetBtn.addEventListener) {
      resetBtn.addEventListener('click', () => {
        Object.keys(GAME_MODES).forEach(m => {
          try { localStorage.removeItem('fusion_drop_pb_' + m); } catch (_) {}
        });
        try { localStorage.removeItem('fusion_drop_paused'); } catch (_) {}
        try { localStorage.removeItem('fusion_drop_scores'); } catch (_) {}
        resetBtn.textContent = 'Progress reset';
        setTimeout(() => { resetBtn.textContent = 'Reset progress'; }, 1500);
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Backquote') { e.preventDefault(); this.toggleDebugOverlay(); }
      if (e.code === 'Space' || e.code === 'Enter') { if (this.state === 'playing') this.drop(); }
      if (e.code === 'Escape') this.togglePause();
      // Phase 1 — keyboard aim (Left/Right or A/D)
      if (this.state === 'playing') {
        const step = 14;
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.moveAim(-step);
        if (e.code === 'ArrowRight' || e.code === 'KeyD') this.moveAim(step);
      }
      // Phase 1 — keyboard restart
      if (e.code === 'KeyR' && (this.state === 'game-over' || this.state === 'paused')) this.restart();
    });
  }

  async fetchLeaderboard() {
    if (typeof backend === 'undefined') {
      // Static file mode — use localStorage only
      try {
        const local = JSON.parse(localStorage.getItem('fusion_drop_scores') || '[]');
        this.leaderboard = local.sort((a, b) => b.score - a.score).slice(0, 50);
        this.renderLeaderboard();
      } catch (_) { this.leaderboard = []; this.renderLeaderboard(); }
      return;
    }
    try {
      const scores = await backend.fetchScores();
      this.leaderboard = scores.map(s => ({ name: s.player_name, score: s.score, date: s.created_at }));
      this.renderLeaderboard();
    } catch (e) {
      console.error('Leaderboard fetch failed:', e);
      // Fallback to localStorage for static hosting
      try {
        const local = JSON.parse(localStorage.getItem('fusion_drop_scores') || '[]');
        this.leaderboard = local.sort((a, b) => b.score - a.score).slice(0, 50);
        this.renderLeaderboard();
      } catch (_) {}
    }
  }

  // Phase 1 — programmatic aim step (used by keyboard arrow keys).
  moveAim(dx) {
    if (this.state !== 'playing') return;
    const w = this.canvas ? this.canvas.width : CANVAS_W;
    this.dropX = Math.max(20, Math.min(w - 20, this.dropX + dx));
    // Trigger an aim-render so the preview indicator moves without needing a mouse event.
    if (typeof this.renderAim === 'function') this.renderAim();
  }

  handleMove(e) {
    if (this.state !== 'playing') return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const shapes = this.getShapes();
    const r = shapes[this.currentShape].radius;
    this.dropX = Math.max(r + 4, Math.min(this.canvas.width - r - 4, x));
  }

  handleTouchMove(e) {
    if (this.state !== 'playing') return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const shapes = this.getShapes();
    const r = shapes[this.currentShape].radius;
    this.dropX = Math.max(r + 4, Math.min(this.canvas.width - r - 4, x));
  }

  handleDrop(e) {
    if (this.state !== 'playing') return;
    this.drop();
  }

  drop() {
    if (this.state !== 'playing') return;
    this.dropTimer = 0;
    this.dropsCount++;
    this._chainLength = 0;
    this._lastMergeAt = 0;

    const shapes = this.getShapes();
    const s = shapes[this.currentShape];
    const deathLine = this.getDeathLine();
    const startY = Math.min(deathLine - s.radius - 10, this.canvas.height * 0.15);
    this.entities.push({
      x: this.dropX, y: startY,
      vx: 0, vy: 2 * this.getPhysicsSpeed(),
      radius: s.radius, shapeType: this.currentShape,
      active: true, settleTimer: 0,
      spawnScale: 0, targetScale: 1,
      immuneTimer: DROP_DELAY,
      hasBeenBelowLine: false,
    });

    this.currentShape = this.nextShape;
    this.nextShape = this.randomShapeTier(MAX_PREVIEW_TIER);
    this.sounds.playDrop();
  }

  checkLevelComplete() {
    const shapes = this.getShapes();
    const biggestType = shapes.length - 1;
    const biggestCount = this.entities.filter(e => e.active && e.shapeType === biggestType).length;
    if (biggestCount >= 2 && this.level < THEMES.length) this.advanceLevel();
  }

  advanceLevel() {
    const oldLevel = this.level;
    this.level++;
    this.currentTheme = THEMES[Math.min(this.level - 1, THEMES.length - 1)];
    if (this.sounds && typeof this.sounds.setThemeIndex === 'function') {
      this.sounds.setThemeIndex(this.level - 1);
    }
    for (const e of this.entities) {
      if (!e.active) continue;
      const transformed = transformEntityToTheme(e, oldLevel, this.level);
      e.shapeType = transformed.shapeType;
      e.radius = transformed.radius;
    }
    this.physics = new Physics(0.3 * this.getPhysicsSpeed(), 0.98, 0.2);
    this.sounds.playLevelComplete();
    this.renderShapeChain();
    this.addScorePopup(this.canvas.width / 2, this.canvas.height / 2, 'LEVEL ' + this.level + '!');
  }

  update() {
    if (this.state !== 'playing') return;

    const shapes = this.getShapes();
    const deathLine = this.getDeathLine();
    const width = this.canvas ? this.canvas.width : CANVAS_W;
    const height = this.canvas ? this.canvas.height : CANVAS_H;
    this.physics.update(this.entities, width - 4, height - 4);

    // Process merges
    const toMerge = [];
    const n = this.entities.length;
    for (let i = 0; i < n; i++) {
      const a = this.entities[i];
      if (!a.active) continue;

      // Spawn animation
      if (a.spawnScale < a.targetScale) {
        a.spawnScale = Math.min(a.spawnScale + 0.08, a.targetScale);
      }

      // Decrement immunity timer
      if (a.immuneTimer > 0) {
        a.immuneTimer--;
      }

      // Death line check
      // Clean rule: after immunity expires, if entity center is above death line
      // for GRACE_FRAMES consecutive frames AND it has crossed below at least once, game over.
      if (a.immuneTimer <= 0 && a.y - a.radius < deathLine && a.y > 0 && a.y < height) {
        if (a.hasBeenBelowLine) {
          a.settleTimer++;
          if (a.settleTimer > GRACE_FRAMES) { this.endGame(); return; }
        }
      } else {
        a.settleTimer = 0;
        if (a.y - a.radius >= deathLine) {
          a.hasBeenBelowLine = true;
        }
      }

      // Merge detection - allow ALL tiers to merge
      for (let j = i + 1; j < n; j++) {
        const b = this.entities[j];
        if (!b.active || a.shapeType !== b.shapeType) continue;
        const dist = Math.hypot(b.x - a.x, b.y - a.y);
        if (dist < a.radius + b.radius) {
          let already = false;
          for (const m of toMerge) {
            if (m.a === i || m.b === i || m.a === j || m.b === j) { already = true; break; }
          }
          if (!already) toMerge.push({ a: i, b: j });
        }
      }
    }

    // Execute merges
    const merged = new Set();
    let biggestMerged = false;
    const biggestType = shapes.length - 1;
    for (const m of toMerge) {
      if (merged.has(m.a) || merged.has(m.b)) continue;
      const a = this.entities[m.a], b = this.entities[m.b];
      if (!a || !b || !a.active || !b.active) continue;

      const isMaxTierMerge = a.shapeType === biggestType;
      let newType = a.shapeType + 1;
      let bonusScore = 0;

      // Suika-like behavior: when two max-tier shapes merge, they don't evolve further.
      // Award bonus points and create a super version (same tier, bonus points).
      if (newType >= shapes.length) {
        newType = biggestType;
        bonusScore = shapes[biggestType].score * 2;
        biggestMerged = true;
        this.triggerScreenShake();
      } else if (a.shapeType === biggestType - 1) {
        biggestMerged = true;
        this.triggerScreenShake();
      }

      const newS = shapes[newType];
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;

      // Merge particles
      for (let p = 0; p < 12; p++) {
        const angle = (p / 12) * Math.PI * 2;
        this.mergeParticles.push({ x: mx, y: my,
          vx: Math.cos(angle) * (2 + Math.random() * 3),
          vy: Math.sin(angle) * (2 + Math.random() * 3),
          life: 1.0, color: newS.glow, size: 3 + Math.random() * 4,
        });
      }

      this.entities.push({
        x: mx, y: my - 2,
        vx: (a.vx + b.vx) * 0.3, vy: -1.5,
        radius: newS.radius, shapeType: newType,
        active: true, settleTimer: 0,
        spawnScale: 0.1, targetScale: 1,
        immuneTimer: 0,
        hasBeenBelowLine: false,
      });

      a.active = false; b.active = false;
      merged.add(m.a); merged.add(m.b);
      this.score += newS.score + bonusScore;
      this.updateScoreDisplay();
      this.addScorePopup(mx, my - 30, newS.score + bonusScore);
      this.addMergeFlash(mx, my);
      this.sounds.playMerge(newType);
      this.mergesCount++;
      // Phase B polish-20: track chain length. A chain is multiple
      // merges that happen within a short time window (~2 s) of each
      // other. Reset chain on long gap.
      const now = Date.now();
      if (this._lastMergeAt && (now - this._lastMergeAt) < 2000) {
        this._chainLength = (this._chainLength || 1) + 1;
      } else {
        this._chainLength = 1;
      }
      this._lastMergeAt = now;
      if (!this._longestChain || this._chainLength > this._longestChain) {
        this._longestChain = this._chainLength;
      }
      this.checkAchievements();
    }

    this.entities = this.entities.filter(e => e.active);
    if (biggestMerged) this.checkLevelComplete();

    // Phase 1 — danger warning. Compute once per frame and ramp the warning tone.
    // Thresholds: 0 if any entity is far below the line, ramps to 1 within 100 px.
    let highestAbove = -Infinity;
    for (const e of this.entities) {
      if (e.active && e.immuneTimer <= 0) {
        const top = e.y - e.radius;
        if (top < deathLine && top > highestAbove) highestAbove = top;
      }
    }
    if (highestAbove === -Infinity || (deathLine - highestAbove) > 100) {
      // Far from danger — stop the warning if it was running.
      if (this._warningOn) {
        this.sounds.stopWarning();
        this._warningOn = false;
      }
    } else {
      const intensity = Math.max(0, Math.min(1, 1 - (deathLine - highestAbove) / 100));
      // Only call playWarning when intensity changes meaningfully (>10%) to avoid per-frame work.
      if (this.reducedMotion) {
        if (this._warningOn) { this.sounds.stopWarning(); this._warningOn = false; }
      } else if (!this._warningOn || Math.abs(intensity - (this._warningIntensity || 0)) > 0.1) {
        this.sounds.playWarning(intensity);
        this._warningOn = true;
        this._warningIntensity = intensity;
      }
    }
    this._dangerLevel = highestAbove === -Infinity ? 0 : Math.max(0, Math.min(1, 1 - (deathLine - highestAbove) / 100));
    this.renderSpeedTimer();

    // Wait for last dropped entity to land before allowing next drop
    // A dropped entity is the one still within its initial immune period
    const lastDropped = this.entities.find(e => e.immuneTimer > 0);
    if (!lastDropped) {
      // All entities have settled enough - allow next drop
      this.dropTimer = 0;
    }

    // Phase 2 — Speed mode time-attack countdown.
    if (this.state === 'playing' && GAME_MODES[this.mode] && GAME_MODES[this.mode].timeAttack) {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.endGame();
        return;
      }
      // Phase B polish-8: low-time pulse. When < 10 s left, briefly tint
      // the screen-edge with a red warning. Toggle once per ~30 frames
      // so the visual breathes rather than strobing.
      if (this.timeLeft / 60 < 10) {
        this._lowTimePulse = (this._lowTimePulse || 0) + 1;
      } else {
        this._lowTimePulse = 0;
      }
    }

    // Update particles
    for (const p of this.mergeParticles) { p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life -= 0.04; }
    this.mergeParticles = this.mergeParticles.filter(p => p.life > 0);

    for (const p of this.scorePopups) { p.y -= 1.5; p.life -= 0.025; p.scale = 1 + (1 - p.life) * 0.3; }
    this.scorePopups = this.scorePopups.filter(p => p.life > 0);

    for (const f of this.mergeFlashes) { f.life -= 0.05; f.radius += 2; }
    this.mergeFlashes = this.mergeFlashes.filter(f => f.life > 0);

    // Phase 2 — achievement toast lifecycle. Show one at a time.
    if (!this._achievementQueue) this._achievementQueue = [];
    if (!this._activeToast) {
      const next = this._achievementQueue.shift();
      if (next) this._activeToast = { ...next, maxLife: 180 };  // ~3 s at 60 fps
    }
    if (this._activeToast) {
      this._activeToast.life = (this._activeToast.life || 0) + 1;
      if (this._activeToast.life >= this._activeToast.maxLife) {
        this._activeToast = null;
      }
    }

    for (const p of this.ambientParticles) {
      p.y -= p.speed; p.x += Math.sin(p.time) * 0.5; p.time += 0.02;
      if (p.y < 0) { p.y = this.canvas.height + 10; p.x = Math.random() * this.canvas.width; }
    }
  }


  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Background: tinted with the current theme's accent color so each
    // level feels distinct. Tint is subtle (15% blend with dark base).
    const themeColor = (this.currentTheme && this.currentTheme.color) || '#00d4ff';
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = hexToRgba(themeColor, 0.04);
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Grid
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.05)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < this.canvas.width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.canvas.height); ctx.stroke(); }
    for (let y = 0; y < this.canvas.height; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.canvas.width, y); ctx.stroke(); }

    // Border glow
    ctx.beginPath(); ctx.roundRect(4, 4, this.canvas.width - 8, this.canvas.height - 8, 8);
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)'; ctx.lineWidth = 1; ctx.stroke();

    // Death line + danger zone glow (Phase 1).
    // Compute proximity to the line from the highest non-immune entity.
    const deathLine = this.getDeathLine();
    let highestAbove = -Infinity;
    for (const e of this.entities) {
      if (e.active && e.immuneTimer <= 0) {
        const top = e.y - e.radius;
        if (top < deathLine && top > highestAbove) highestAbove = top;
      }
    }
    // 0..1, ramps as stack approaches the line.
    const dangerDist = 100;
    const danger = highestAbove === -Infinity
      ? 0
      : Math.max(0, Math.min(1, 1 - (deathLine - highestAbove) / dangerDist));

    // Filled danger zone above the line. The danger band spans the lower
    // 100 px of the play area above the death line; intensity fades to
    // 0 at the top edge of the band, full at the death line.
    if (danger > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(255, 0, 102, ${0.06 + danger * 0.18})`;
      const bandHeight = 100;
      const top = Math.max(0, deathLine - bandHeight);
      ctx.fillRect(4, top, this.canvas.width - 8, deathLine - top);
      ctx.restore();
    }

    ctx.beginPath(); ctx.setLineDash([6, 6]);
    ctx.moveTo(4, deathLine); ctx.lineTo(this.canvas.width - 4, deathLine);
    const lineAlpha = 0.4 + danger * 0.5;
    ctx.strokeStyle = `rgba(255, ${Math.round(80 - danger * 60)}, ${Math.round(140 - danger * 60)}, ${lineAlpha})`;
    ctx.lineWidth = 1.5 + danger * 1.5; ctx.stroke();
    ctx.setLineDash([]);

    // Level indicator
    ctx.save();
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(0, 212, 255, 0.6)';
    ctx.fillText(`Level ${this.level}: ${this.currentTheme.name}`, 10, 20);
    ctx.restore();

    // Entities
    const currentShapes = this.getShapes();
    for (const e of this.entities) {
      const scale = e.spawnScale || 1;
      drawShape(ctx, e.x, e.y, e.shapeType, scale, currentShapes);
    }

    // Aiming indicator
    if (this.state === 'playing') {
      const s = currentShapes[this.currentShape];
      const aimY = Math.min(deathLine - s.radius - 10, this.canvas.height * 0.15);
      drawShape(ctx, this.dropX, aimY, this.currentShape, 1, currentShapes);
      ctx.beginPath(); ctx.setLineDash([4, 6]);
      ctx.moveTo(this.dropX, aimY + s.radius + 4); ctx.lineTo(this.dropX, this.canvas.height - 4);
      // Phase B polish-9: brighter aim line that fades towards the death
      // line, so the player can see where the shape will land.
      const grad = ctx.createLinearGradient(this.dropX, aimY + s.radius + 4, this.dropX, this.canvas.height - 4);
      grad.addColorStop(0, 'rgba(0, 240, 255, 0.6)');
      grad.addColorStop(1, 'rgba(0, 212, 255, 0.05)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
      // Aim dot at the drop point for clarity.
      ctx.beginPath();
      ctx.arc(this.dropX, aimY + s.radius + 4, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 240, 255, 0.8)';
      ctx.fill();
    }

    // Particles
    for (const p of this.mergeParticles) {
      ctx.save(); ctx.globalAlpha = p.life; ctx.shadowBlur = 10; ctx.shadowColor = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fillStyle = p.color; ctx.fill(); ctx.restore();
    }

    // Ambient
    for (const p of this.ambientParticles) {
      ctx.save(); ctx.globalAlpha = p.alpha * (0.5 + 0.5 * Math.sin(p.time * 2));
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color; ctx.fill(); ctx.restore();
    }

    // Flashes
    for (const f of this.mergeFlashes) {
      ctx.save(); ctx.globalAlpha = f.life * 0.3;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
      ctx.fillStyle = f.color; ctx.fill(); ctx.restore();
    }

    // Score popups
    for (const p of this.scorePopups) {
      ctx.save(); ctx.globalAlpha = p.life;
      ctx.font = `bold ${16 * p.scale}px Inter, sans-serif`;
      ctx.textAlign = 'center'; ctx.fillStyle = p.color; ctx.shadowBlur = 10; ctx.shadowColor = p.color;
      ctx.fillText('+' + p.score, p.x, p.y); ctx.restore();
    }

    // Phase B polish-8: low-time red border pulse (speed mode < 10 s).
    if (this.state === 'playing' && GAME_MODES[this.mode] && GAME_MODES[this.mode].timeAttack && this.timeLeft / 60 < 10) {
      const phase = (this._lowTimePulse || 0) % 60;
      const intensity = phase < 30 ? (phase / 30) : ((60 - phase) / 30);
      ctx.save();
      ctx.globalAlpha = 0.18 + intensity * 0.22;
      ctx.fillStyle = '#ff0066';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.globalAlpha = 0.6 + intensity * 0.4;
      ctx.lineWidth = 4 + intensity * 4;
      ctx.strokeStyle = '#ff0066';
      ctx.strokeRect(2, 2, this.canvas.width - 4, this.canvas.height - 4);
      ctx.restore();
    }

    // Phase 5 — debug overlay text.
    if (this._debugOverlay) {
      const panel = document.getElementById('debug-overlay');
      if (panel) {
        const times = this._frameTimes;
        let avg = 0, pMax = 0;
        for (const t of times) { avg += t; if (t > pMax) pMax = t; }
        if (times.length > 0) avg /= times.length;
        const fps = avg > 0 ? (1000 / avg).toFixed(0) : '---';
        const entityCount = (this.entities || []).filter(e => e.active).length;
        const themeName = (this.currentTheme && this.currentTheme.name) || '?';
        panel.textContent =
          'fps: ' + fps + ' (' + avg.toFixed(1) + 'ms)\n' +
          'pMax: ' + pMax.toFixed(1) + 'ms\n' +
          'ents: ' + entityCount + '\n' +
          'theme: ' + themeName + ' (#' + this.level + ')\n' +
          'mode: ' + this.mode + '\n' +
          'score: ' + this.score;
      }
    }

    // Phase 2 — achievement toast banner.
    if (this._activeToast) {
      const a = this._activeToast;
      const fadeIn = Math.min(1, a.life / 12);
      const fadeOut = Math.max(0, 1 - (a.life - (a.maxLife - 30)) / 30);
      const alpha = Math.min(fadeIn, fadeOut);
      if (alpha > 0) {
        ctx.save();
        ctx.globalAlpha = alpha;
        const w = 240, h = 56;
        const cx = (this.canvas.width - w) / 2;
        const cy = 18;
        ctx.fillStyle = 'rgba(20, 20, 30, 0.85)';
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(cx, cy, w, h, 8);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('★ ' + a.label, this.canvas.width / 2, cy + 22);
        ctx.fillStyle = '#ffffff';
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText(a.description, this.canvas.width / 2, cy + 40);
        ctx.restore();
      }
    }

    // Next preview (mobile)
    const previewShapes = this.getShapes();
    if (this.nextCtx) {
      this.nextCtx.clearRect(0, 0, 80, 80);
      drawShape(this.nextCtx, 40, 40, this.nextShape, 1.0, previewShapes);
    }
    // Next preview (desktop)
    if (this.nextCtxDesk) {
      this.nextCtxDesk.clearRect(0, 0, 120, 120);
      drawShape(this.nextCtxDesk, 60, 60, this.nextShape, 1.4, previewShapes);
    }
  }

  initAmbientParticles() {
    for (let i = 0; i < 20; i++) {
      this.ambientParticles.push({
        x: Math.random() * this.canvas.width, y: Math.random() * this.canvas.height,
        size: 1 + Math.random() * 2, speed: 0.2 + Math.random() * 0.5,
        color: ['rgba(0, 212, 255, 0.3)', 'rgba(0, 240, 255, 0.2)', 'rgba(255, 0, 102, 0.15)'][Math.floor(Math.random() * 3)],
        alpha: 0.3 + Math.random() * 0.4, time: Math.random() * Math.PI * 2,
      });
    }
  }

  addScorePopup(x, y, score) {
    const colors = ['#00f0ff', '#00d4ff', '#ffd700', '#ff0066'];
    this.scorePopups.push({ x, y, score, life: 1.0, scale: 1, color: colors[Math.floor(Math.random() * colors.length)] });
  }

  addMergeFlash(x, y) {
    this.mergeFlashes.push({ x, y, radius: 10, life: 1.0, color: '#ffffff' });
  }

  // Phase 2 — achievement toast queue. Each toast renders for ~3 s, then fades.
  // One toast visible at a time; queue holds the rest.
  addAchievementToast(label, description) {
    if (!this._achievementQueue) this._achievementQueue = [];
    this._achievementQueue.push({ label, description, t: 0 });
  }

  // Phase 2 — milestone checks; called after every merge.
  // Grants at most one achievement per call (so a multi-merge only fires one at a time).
  checkAchievements() {
    if (!this.achievements) return;
    const tryGrant = (id, fn) => {
      if (this.achievements.has(id)) return;
      if (fn()) {
        this.achievements.add(id);
        const def = ACHIEVEMENTS[id];
        if (def) this.addAchievementToast(def.label, def.description);
      }
    };
    tryGrant('first_merge', () => this.mergesCount >= 1);
    tryGrant('merges_10',   () => this.mergesCount >= 10);
    tryGrant('merges_50',   () => this.mergesCount >= 50);
    tryGrant('score_500',   () => this.score >= 500);
    tryGrant('score_2000',  () => this.score >= 2000);
    tryGrant('first_max',   () => {
      const shapes = this.getShapes();
      return this.entities.some(e => e.active && e.shapeType === shapes.length - 1);
    });
  }

  triggerScreenShake() {
    if (this.reducedMotion) return;
    const wrapper = document.getElementById('game-wrapper');
    wrapper.classList.remove('shake');
    void wrapper.offsetWidth;
    wrapper.classList.add('shake');
    setTimeout(() => wrapper.classList.remove('shake'), 300);
  }

  loop() {
    // Phase 5 — frame-time histogram. Guarded for unit-test sandboxes that
    // may not expose `performance`.
    if (typeof performance !== 'undefined') {
      const now = performance.now();
      if (this._lastFrameTs) {
        const dt = now - this._lastFrameTs;
        this._frameTimes.push(dt);
        if (this._frameTimes.length > 60) this._frameTimes.shift();
      }
      this._lastFrameTs = now;
    }
    this.frameCount++;
    this.update();
    this.draw();
    requestAnimationFrame(() => this.loop());
  }

  // Phase 5 — toggle the `~`-bound debug overlay (fps + entity count + theme).
  toggleDebugOverlay() {
    this._debugOverlay = !this._debugOverlay;
    let panel = document.getElementById('debug-overlay');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'debug-overlay';
      panel.style.cssText = 'position:fixed;bottom:8px;left:8px;z-index:99;background:rgba(20,20,30,0.85);color:#00f0ff;border:1px solid rgba(0,212,255,0.4);border-radius:6px;padding:6px 10px;font:11px/1.4 monospace;pointer-events:none;min-width:160px;';
      document.body.appendChild(panel);
    }
    panel.style.display = this._debugOverlay ? 'block' : 'none';
  }

  updateScoreDisplay() {
    const scoreMob = document.getElementById('score');
    const scoreDesk = document.getElementById('score-desk');
    if (scoreMob) scoreMob.textContent = this.score;
    if (scoreDesk) scoreDesk.textContent = this.score;
    if (this.score > this.highScore) { this.highScore = this.score; this.updateHighScoreDisplay(); }
  }

  updateHighScoreDisplay() {
    const elMob = document.getElementById('high-score');
    const elDesk = document.getElementById('high-score-desk');
    if (elMob) elMob.textContent = this.highScore;
    if (elDesk) elDesk.textContent = this.highScore;
  }

  togglePause() {
    if (this.state === 'game-over' || this.state === 'intro' || this.state === 'name-entry') return;
    if (this.state === 'paused') {
      this.state = 'playing';
      document.getElementById('pause-overlay').classList.add('hidden');
      this.canvas.style.pointerEvents = 'auto';
      this.clearPersistedGame();
    } else if (this.state === 'playing') {
      this.state = 'paused';
      document.getElementById('pause-overlay').classList.remove('hidden');
      this.canvas.style.pointerEvents = 'none';
      this.persistGame();
    }
  }

  // Phase 1 — persist current game state to localStorage so a refresh preserves it.
  persistGame() {
    try {
      const snap = {
        version: 1,
        score: this.score,
        level: this.level,
        playerName: this.playerName,
        currentShape: this.currentShape,
        nextShape: this.nextShape,
        dropX: this.dropX,
        dropsCount: this.dropsCount,
        mergesCount: this.mergesCount,
        achievements: Array.from(this.achievements || []),
        entities: this.entities.map(e => ({
          x: e.x, y: e.y, vx: e.vx || 0, vy: e.vy || 0,
          radius: e.radius, shapeType: e.shapeType, active: e.active,
          spawnScale: e.spawnScale, targetScale: e.targetScale,
          immuneTimer: e.immuneTimer || 0,
          hasBeenBelowLine: !!e.hasBeenBelowLine,
          settleTimer: e.settleTimer || 0,
        })),
        currentTheme: this.level - 1,  // THEMES index is level-1
      };
      localStorage.setItem('fusion_drop_paused', JSON.stringify(snap));
    } catch (e) { /* localStorage quota or disabled — ignore */ }
  }

  clearPersistedGame() {
    try { localStorage.removeItem('fusion_drop_paused'); } catch (_) {}
  }

  hasPersistedGame() {
    try {
      const raw = localStorage.getItem('fusion_drop_paused');
      if (!raw) return false;
      const snap = JSON.parse(raw);
      return !!(snap && Array.isArray(snap.entities));
    } catch (_) { return false; }
  }

  // Restore from a saved snapshot. Called when the player chooses "Resume" on a paused-state restore UI.
  restorePersistedGame() {
    let snap;
    try { snap = JSON.parse(localStorage.getItem('fusion_drop_paused') || 'null'); } catch (_) { snap = null; }
    if (!snap || !Array.isArray(snap.entities)) return false;
    this.score = snap.score || 0;
    this.level = snap.level || 1;
    this.playerName = snap.playerName || '';
    this.currentShape = snap.currentShape || 0;
    this.nextShape = snap.nextShape || 0;
    this.dropX = snap.dropX || (this.canvas.width / 2);
    this.currentTheme = THEMES[Math.max(0, Math.min(THEMES.length - 1, snap.currentTheme || 0))];
    this.entities = snap.entities.map(e => ({ ...e, active: e.active !== false }));
    this.dropsCount = snap.dropsCount || 0;
    this.mergesCount = snap.mergesCount || 0;
    if (snap.achievements && Array.isArray(snap.achievements)) {
      this.achievements = new Set(snap.achievements);
    } else {
      this.achievements = new Set();
    }
    this.state = 'playing';
    this.updateScoreDisplay();
    this.updateHighScoreDisplay();
    return true;
  }

  endGame() {
    this.state = 'game-over';
    this.sounds.stopAmbient();
    this.sounds.stopWarning();
    this.sounds.playGameOver();
    const finalEl = document.getElementById('final-score');
    if (finalEl) finalEl.textContent = this.score;
    // Phase 2 — end-of-run stats and personal best.
    const statsEl = document.getElementById('game-over-stats');
    if (statsEl) {
      const perDrop = this.dropsCount > 0 ? (this.score / this.dropsCount).toFixed(1) : '0';
      const modeName = (GAME_MODES[this.mode] && GAME_MODES[this.mode].name) || this.mode;
      statsEl.innerHTML =
        '<div>Mode: <strong>' + modeName + '</strong></div>' +
        '<div>Drops: <strong>' + this.dropsCount + '</strong> &nbsp; Merges: <strong>' + this.mergesCount + '</strong></div>' +
        '<div>Score/Drop: <strong>' + perDrop + '</strong> &nbsp; Achievements: <strong>' + this.achievements.size + '</strong></div>' +
        ((this._longestChain && this._longestChain > 1)
          ? '<div>Best chain: <strong>' + this._longestChain + '</strong> merges in a row</div>'
          : '');
    }
    const pbEl = document.getElementById('game-over-pb');
    if (pbEl) {
      const key = 'fusion_drop_pb_' + this.mode;
      const prev = parseInt(localStorage.getItem(key) || '0', 10) || 0;
      if (this.score > prev) {
        try { localStorage.setItem(key, String(this.score)); } catch (_) {}
        pbEl.innerHTML = '<div>🏆 New personal best for <strong>' + ((GAME_MODES[this.mode]||{}).name||this.mode) + '</strong>!</div>';
      } else if (prev > 0) {
        pbEl.innerHTML = '<div>Personal best: <strong>' + prev + '</strong></div>';
      }
    }
    const goEl = document.getElementById('game-over');
    if (goEl) goEl.classList.remove('hidden');
    this.disableCanvas();
  }

  async saveScore() {
    // Client-side validation
    const name = (this.playerName || '').trim();
    if (!name) {
      const btn = document.getElementById('btn-save');
      if (btn) { btn.textContent = 'Name Required'; }
      return;
    }
    if (typeof this.score !== 'number' || this.score < 0 || this.score > 99999999) {
      const btn = document.getElementById('btn-save');
      if (btn) { btn.textContent = 'Invalid Score'; }
      return;
    }

    const entry = { name, score: this.score, date: Date.now() };
    const btnSave = document.getElementById('btn-save');
    let saved = false;

    // Always save to localStorage as fallback / primary for static hosting
    try {
      const existing = JSON.parse(localStorage.getItem('fusion_drop_scores') || '[]');
      existing.push(entry);
      existing.sort((a, b) => b.score - a.score);
      localStorage.setItem('fusion_drop_scores', JSON.stringify(existing.slice(0, 50)));
      this.leaderboard = existing.slice(0, 50);
      saved = true;
    } catch (e) {
      console.error('localStorage save failed:', e);
    }

    try {
      if (typeof backend !== 'undefined') {
        const ok = await backend.saveScore(name, this.score, this.level);
        if (!ok) throw new Error('Server rejected the score (anti-cheat). Try again with a fresh run.');
      }
      await this.fetchLeaderboard();
      if (btnSave) {
        btnSave.disabled = true;
        btnSave.textContent = 'Saved!';
      }
    } catch (e) {
      console.error('Score save failed:', e);
      // On static hosting, localStorage is the primary store
      if (saved) {
        this.renderLeaderboard();
        if (btnSave) {
          btnSave.disabled = true;
          btnSave.textContent = 'Saved (local)';
        }
      } else if (btnSave) {
        btnSave.textContent = 'Save Failed - Retry?';
        btnSave.disabled = false;
      }
    }
  }

  renderLeaderboard() {
    const lists = [document.getElementById('lb-list'), document.getElementById('lb-list-desk')];
    for (const list of lists) {
      if (!list) continue;
      list.innerHTML = '';
      for (let i = 0; i < this.leaderboard.length; i++) {
        const entry = this.leaderboard[i];
        const li = document.createElement('li');
        const liSpan = document.createElement('span');
        liSpan.style.color = this.colorForName(entry.name);
        liSpan.textContent = (i + 1) + '. ' + entry.name;
        const scoreSpan = document.createElement('span');
        scoreSpan.textContent = entry.score;
        li.appendChild(liSpan);
        li.appendChild(scoreSpan);
        list.appendChild(li);
      }
      if (this.leaderboard.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No scores yet'; li.style.justifyContent = 'center';
        li.style.color = 'rgba(0, 212, 255, 0.4)'; list.appendChild(li);
      }
    }
  }

  restart() {
    this.entities = [];
    this.score = 0;
    this.mergeParticles = [];
    this.scorePopups = [];
    this.mergeFlashes = [];
    this.ambientParticles = [];
    this.level = 1;
    this.currentTheme = THEMES[0];
    this.physics = new Physics(0.3, 0.98, 0.2);
    this.nextShape = this.randomShapeTier(MAX_PREVIEW_TIER);
    this.currentShape = this.randomShapeTier(MAX_PREVIEW_TIER);
    this.dropX = this.canvas.width / 2;
    this.dropTimer = 0;
    this.frameCount = 0;
    this.playerName = '';
    // Reset per-run counters so a fresh game shows zeros on the
    // end-game stats screen.
    this.dropsCount = 0;
    this.mergesCount = 0;
    this.achievements = new Set();
    this._achievementQueue = [];
    this._activeToast = null;
    this.timeLeft = 0;
    this._longestChain = 0;
    this._chainLength = 0;
    this._lastMergeAt = 0;

    this.state = 'intro';

    // Reset both score displays independently
    const scoreMob = document.getElementById('score');
    const scoreDesk = document.getElementById('score-desk');
    if (scoreMob) scoreMob.textContent = '0';
    if (scoreDesk) scoreDesk.textContent = '0';

    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('pause-overlay').classList.add('hidden');

    const btnSave = document.getElementById('btn-save');
    if (btnSave) {
      btnSave.disabled = false;
      btnSave.textContent = 'Save Score';
    }

    this.enableCanvas();
    this.updateHighScoreDisplay();
    this.renderLeaderboard();
    this.renderShapeChain();

    // Sound state: stop ambient and don't leak oscillators
    this.sounds.stopAmbient();

    this.showIntroScreen();
  }

  renderShapeChain() {
    const shapes = this.getShapes();

    // Desktop: vertical 2-column chain
    const container = document.getElementById('chain-list');
    if (container) {
      container.innerHTML = '';
      const panelWidth = 180, gap = 4, cols = 2;
      const mid = Math.ceil(shapes.length / 2);
      const cellW = (panelWidth - gap * (cols - 1)) / cols;
      const maxDiam = cellW;

      const leftDiv = document.createElement('div'); leftDiv.className = 'chain-col';
      for (let i = 0; i < mid; i++) {
        const s = shapes[i]; const item = document.createElement('div'); item.className = 'chain-item';
        const canvas = document.createElement('canvas');
        const scale = Math.min(1.0, maxDiam / (s.radius * 2));
        const size = Math.ceil(s.radius * 2 * scale) + 4;
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        drawShape(ctx, size / 2, size / 2, i, scale, shapes);
        item.appendChild(canvas); leftDiv.appendChild(item);
      }

      const rightDiv = document.createElement('div'); rightDiv.className = 'chain-col';
      for (let i = mid; i < shapes.length; i++) {
        const s = shapes[i]; const item = document.createElement('div'); item.className = 'chain-item';
        const canvas = document.createElement('canvas');
        const scale = Math.min(1.0, maxDiam / (s.radius * 2));
        const size = Math.ceil(s.radius * 2 * scale) + 4;
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        drawShape(ctx, size / 2, size / 2, i, scale, shapes);
        item.appendChild(canvas); rightDiv.appendChild(item);
      }
      container.appendChild(leftDiv); container.appendChild(rightDiv);
    }

    // Mobile: horizontal chain
    const mobileChain = document.getElementById('shape-chain-mobile');
    if (mobileChain) {
      mobileChain.innerHTML = '';
      for (let i = 0; i < shapes.length; i++) {
        const s = shapes[i];
        const div = document.createElement('div');
        div.className = 'chain-shape';
        div.style.background = s.color;
        div.style.boxShadow = `0 0 8px ${s.glow}`;
        div.textContent = i + 1;
        mobileChain.appendChild(div);
        if (i < shapes.length - 1) {
          const arrow = document.createElement('span');
          arrow.className = 'chain-arrow';
          arrow.textContent = '→';
          mobileChain.appendChild(arrow);
        }
      }
    }
  }
}

function escapeHtml(str) {
  const div = document.createElement('div'); div.textContent = str; return div.innerHTML;
}

window.addEventListener('DOMContentLoaded', () => { new FusionGame(); });
