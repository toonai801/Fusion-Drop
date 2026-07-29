const CANVAS_W = 280;
const CANVAS_H = 420;
const DROP_LINE_Y = 60;
const MAX_PREVIEW_TIER = 2;
const GRACE_FRAMES = 180;
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
    this.currentShape = this.randomShapeTier(MAX_PREVIEW_TIER, this.nextShape);
    this.dropX = this.canvas.width / 2;
    this.dropTimer = 0;
    this.playerName = '';

    // Explicit state machine
    this.state = 'intro';

    this.mergeParticles = [];
    this.scorePopups = [];
    this.ambientParticles = [];
    this.mergeFlashes = [];
    this.leaderboard = [];
    this.sounds = new SoundManager();
    this.frameCount = 0;

    this.renderShapeChain();
    this.bindEvents();
    this.showIntroScreen();
    this.fetchLeaderboard();
    this.startActivePolling();
    this.initAmbientParticles();
    this.loop();

    // Expose for debugging
    window.game = this;
  }

  getShapes() { return getCurrentShapes(this.level); }
  getPhysicsSpeed() { return getPhysicsSpeed(this.level); }
  getDeathLine() { return DROP_LINE_Y + getDeathLineOffset(this.level); }

  randomShapeTier(maxTier, excludeTier = null) {
    const weights = [];
    for (let i = 0; i <= maxTier; i++) weights.push(Math.pow(0.55, i));
    if (excludeTier !== null && excludeTier >= 0 && excludeTier <= maxTier) {
      weights[excludeTier] = 0; // Don't pick the excluded tier
    }
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r <= 0) return i; }
    return 0;
  }

  resize() {
    // On mobile (max-width: 850px), let CSS handle sizing via media queries
    if (window.innerWidth <= 850) {
      // Just ensure internal resolution is correct
      if (this.canvas.width !== CANVAS_W || this.canvas.height !== CANVAS_H) {
        this.canvas.width = CANVAS_W;
        this.canvas.height = CANVAS_H;
      }
      return;
    }
    
    const parentRect = this.canvas.parentElement.getBoundingClientRect();
    const wrapperRect = document.getElementById('game-wrapper').getBoundingClientRect();
    
    // Available width/height within the wrapper, accounting for side panels
    let displayW = parentRect.width;
    let displayH = wrapperRect.height;
    
    // Fixed internal game resolution
    const gameW = CANVAS_W;
    const gameH = CANVAS_H;
    const aspect = gameW / gameH;
    
    // Calculate display size while maintaining aspect ratio
    if (displayW / displayH > aspect) {
      displayW = displayH * aspect;
    } else {
      displayH = displayW / aspect;
    }
    
    // Ensure minimum sizes
    displayW = Math.max(displayW, 300);
    displayH = Math.max(displayH, 400);

    // Set CSS display size — scale up to fill available space
    this.canvas.style.width = Math.floor(displayW) + 'px';
    this.canvas.style.height = Math.floor(displayH) + 'px';
    
    // Keep internal canvas resolution fixed at game dimensions
    if (this.canvas.width !== gameW || this.canvas.height !== gameH) {
      this.canvas.width = gameW;
      this.canvas.height = gameH;
    }
    
    this.canvas.style.marginLeft = '0px';
    this.canvas.style.marginTop = '0px';
  }

  showIntroScreen() {
    this.state = 'intro';
    const intro = document.getElementById('intro-screen');
    const btnStart = document.getElementById('btn-intro-start');
    intro.classList.remove('hidden');
    this.disableCanvas();
    btnStart.addEventListener('click', () => {
      intro.classList.add('hidden');
      this.enableCanvas();
      this.showStartScreen();
    }, { once: true });
  }

  showStartScreen() {
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

    // Use touch events on mobile, click on desktop — prevent double-firing
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouch) {
      this.canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
        this.touchMoved = false;
        this.handleTouchMove(e);
      }, { passive: false });

      this.canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        this.touchMoved = true;
        this.handleTouchMove(e);
      }, { passive: false });

      this.canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (this.touchMoved) return;
        const touch = e.changedTouches[0];
        const dx = Math.abs(touch.clientX - this.touchStartX);
        const dy = Math.abs(touch.clientY - this.touchStartY);
        if (dx < 10 && dy < 10) {
          this.handleDrop(touch);
        }
      }, { passive: false });
    } else {
      this.canvas.addEventListener('click', (e) => this.handleDrop(e));
    }

    document.getElementById('btn-pause').addEventListener('click', () => this.togglePause());
    document.getElementById('btn-restart').addEventListener('click', () => this.restart());
    const btnPauseDesk = document.getElementById('btn-pause-desk');
    if (btnPauseDesk) btnPauseDesk.addEventListener('click', () => this.togglePause());
    const btnRestartDesk = document.getElementById('btn-restart-desk');
    if (btnRestartDesk) btnRestartDesk.addEventListener('click', () => this.restart());
    document.getElementById('btn-save').addEventListener('click', () => this.saveScore());
    document.getElementById('btn-play-again').addEventListener('click', () => this.restart());
    document.getElementById('btn-resume').addEventListener('click', () => this.togglePause());

    const lbToggle = document.getElementById('lb-toggle');
    if (lbToggle) {
      lbToggle.addEventListener('click', () => {
        const content = document.getElementById('lb-content');
        if (content) {
          content.classList.toggle('hidden');
          lbToggle.textContent = content.classList.contains('hidden') ? '🏆 Leaderboard ▼' : '🏆 Leaderboard ▲';
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'Enter') { if (this.state === 'playing') this.drop(); }
      if (e.code === 'Escape') this.togglePause();
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

  async fetchActivePlayers() {
    if (typeof backend === 'undefined') { this.renderActivePlayers([]); return; }
    try {
      const active = await backend.fetchActivePlayers();
      this.renderActivePlayers(active.map(p => ({ name: p.player_name, score: p.score, lastSeen: p.last_seen })));
    } catch (e) {
      console.error('Active players fetch failed:', e);
      this.renderActivePlayers([]);
    }
  }

  async reportActive() {
    if (!this.playerName || this.state !== 'playing') return;
    if (typeof backend === 'undefined') return;
    try {
      await backend.heartbeat(this.playerName, this.score);
    } catch (e) { /* Silent fail for heartbeats */ }
  }

  startActivePolling() {
    setInterval(() => this.reportActive(), 5000);
    setInterval(() => this.fetchActivePlayers(), 5000);
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
    // Enforce drop cooldown — must wait for previous drop to settle
    if (this.entities.some(e => e.immuneTimer > 0)) return;

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
    this.nextShape = this.randomShapeTier(MAX_PREVIEW_TIER, this.currentShape);
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
    }

    this.entities = this.entities.filter(e => e.active);
    if (biggestMerged) this.checkLevelComplete();

    // Wait for last dropped entity to land before allowing next drop
    // A dropped entity is the one still within its initial immune period
    const lastDropped = this.entities.find(e => e.immuneTimer > 0);
    if (!lastDropped) {
      // All entities have settled enough - allow next drop
      this.dropTimer = 0;
    }

    // Update particles
    for (const p of this.mergeParticles) { p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life -= 0.04; }
    this.mergeParticles = this.mergeParticles.filter(p => p.life > 0);

    for (const p of this.scorePopups) { p.y -= 1.5; p.life -= 0.025; p.scale = 1 + (1 - p.life) * 0.3; }
    this.scorePopups = this.scorePopups.filter(p => p.life > 0);

    for (const f of this.mergeFlashes) { f.life -= 0.05; f.radius += 2; }
    this.mergeFlashes = this.mergeFlashes.filter(f => f.life > 0);

    for (const p of this.ambientParticles) {
      p.y -= p.speed; p.x += Math.sin(p.time) * 0.5; p.time += 0.02;
      if (p.y < 0) { p.y = this.canvas.height + 10; p.x = Math.random() * this.canvas.width; }
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Background
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Grid
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.05)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < this.canvas.width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.canvas.height); ctx.stroke(); }
    for (let y = 0; y < this.canvas.height; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.canvas.width, y); ctx.stroke(); }

    // Border glow
    ctx.beginPath(); ctx.roundRect(4, 4, this.canvas.width - 8, this.canvas.height - 8, 8);
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)'; ctx.lineWidth = 1; ctx.stroke();

    // Death line
    const deathLine = this.getDeathLine();
    ctx.beginPath(); ctx.setLineDash([6, 6]);
    ctx.moveTo(4, deathLine); ctx.lineTo(this.canvas.width - 4, deathLine);
    ctx.strokeStyle = 'rgba(255, 0, 102, 0.4)'; ctx.lineWidth = 1.5; ctx.stroke();
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
      ctx.beginPath(); ctx.setLineDash([4, 4]);
      ctx.moveTo(this.dropX, aimY + s.radius + 4); ctx.lineTo(this.dropX, this.canvas.height - 4);
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.2)'; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
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

  triggerScreenShake() {
    const wrapper = document.getElementById('game-wrapper');
    wrapper.classList.remove('shake');
    void wrapper.offsetWidth;
    wrapper.classList.add('shake');
    setTimeout(() => wrapper.classList.remove('shake'), 300);
  }

  loop() {
    this.frameCount++;
    this.update();
    this.draw();
    requestAnimationFrame(() => this.loop());
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
    } else if (this.state === 'playing') {
      this.state = 'paused';
      document.getElementById('pause-overlay').classList.remove('hidden');
      this.canvas.style.pointerEvents = 'none';
    }
  }

  endGame() {
    this.state = 'game-over';
    this.sounds.stopAmbient();
    this.sounds.playGameOver();
    document.getElementById('final-score').textContent = this.score;
    document.getElementById('game-over').classList.remove('hidden');
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
        if (!ok) throw new Error('Failed to save score');
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
        li.innerHTML = `<span>${i + 1}. ${escapeHtml(entry.name)}</span><span>${entry.score}</span>`;
        list.appendChild(li);
      }
      if (this.leaderboard.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No scores yet'; li.style.justifyContent = 'center';
        li.style.color = 'rgba(0, 212, 255, 0.4)'; list.appendChild(li);
      }
    }
  }

  renderActivePlayers(active) {
    const lists = [document.getElementById('lb-active'), document.getElementById('lb-active-desk')];
    for (const list of lists) {
      if (!list) continue;
      list.innerHTML = '';
      active.sort((a, b) => b.score - a.score);
      for (let i = 0; i < active.length; i++) {
        const p = active[i];
        const li = document.createElement('li');
        li.innerHTML = `<span><span class="live-dot">●</span> ${escapeHtml(p.name)}</span><span>${p.score}</span>`;
        list.appendChild(li);
      }
      if (active.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No active players'; li.style.justifyContent = 'center';
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
    this.currentShape = this.randomShapeTier(MAX_PREVIEW_TIER, this.nextShape);
    this.dropX = this.canvas.width / 2;
    this.dropTimer = 0;
    this.frameCount = 0;
    this.playerName = '';

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
