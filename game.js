const CANVAS_W = 400;
const CANVAS_H = 600;
const DROP_LINE_Y = 90;
const MAX_PREVIEW_TIER = 2;
const GRACE_FRAMES = 180;
const DROP_DELAY = 30;

class FusionGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.nextCanvas = document.getElementById('next-canvas');
    this.nextCtx = this.nextCanvas.getContext('2d');

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
    this.dropX = CANVAS_W / 2;
    this.isAiming = true;
    this.canDrop = true;
    this.dropTimer = 0;
    this.gameOver = false;
    this.paused = false;
    this.playerName = '';

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

  randomShapeTier(maxTier) {
    const weights = [];
    for (let i = 0; i <= maxTier; i++) weights.push(Math.pow(0.55, i));
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r <= 0) return i; }
    return 0;
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.scale = window.devicePixelRatio || 1;
    
    // Maintain 2:3 aspect ratio, fit within container
    const targetRatio = CANVAS_W / CANVAS_H; // 400/600 = 0.666
    const actualRatio = w / h;
    let drawW, drawH;
    if (actualRatio > targetRatio) {
      // Container is wider than target - fit to height
      drawH = h;
      drawW = h * targetRatio;
    } else {
      // Container is taller than target - fit to width
      drawW = w;
      drawH = w / targetRatio;
    }
    
    this.canvas.width = drawW * this.scale;
    this.canvas.height = drawH * this.scale;
    this.canvas.style.width = drawW + 'px';
    this.canvas.style.height = drawH + 'px';
    
    // Center the canvas in the container
    const offsetX = (w - drawW) / 2;
    const offsetY = (h - drawH) / 2;
    this.canvas.style.marginLeft = offsetX + 'px';
    this.canvas.style.marginTop = offsetY + 'px';
    
    // Scale context to fill the canvas with game world
    this.ctx.setTransform(
      this.scale * (drawW / CANVAS_W), 0,
      0, this.scale * (drawH / CANVAS_H),
      0, 0
    );
  }

  showIntroScreen() {
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
    this.paused = true;
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
      this.paused = false;
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
      if (e.code === 'Space' || e.code === 'Enter') { if (!this.gameOver && !this.paused) this.drop(); }
      if (e.code === 'Escape') this.togglePause();
    });
  }

  async fetchLeaderboard() {
    try {
      const res = await fetch('/api/scores');
      if (!res.ok) throw new Error('Failed to fetch scores');
      this.leaderboard = await res.json();
      this.renderLeaderboard();
    } catch (e) { console.error('Leaderboard fetch failed:', e); }
  }

  async fetchActivePlayers() {
    try {
      const res = await fetch('/api/active');
      if (!res.ok) throw new Error('Failed to fetch active players');
      this.renderActivePlayers(await res.json());
    } catch (e) { console.error('Active players fetch failed:', e); }
  }

  async reportActive() {
    if (!this.playerName || this.paused) return;
    try {
      await fetch('/api/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: this.playerName, score: this.score }),
      });
    } catch (e) { /* Silent fail for heartbeats */ }
  }

  startActivePolling() {
    setInterval(() => this.reportActive(), 5000);
    setInterval(() => this.fetchActivePlayers(), 5000);
  }

  handleMove(e) {
    if (!this.isAiming || this.gameOver || this.paused) return;
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const x = (e.clientX - rect.left) * scaleX;
    const shapes = this.getShapes();
    const r = shapes[this.currentShape].radius;
    this.dropX = Math.max(r + 4, Math.min(CANVAS_W - r - 4, x));
  }

  handleTouchMove(e) {
    if (!this.isAiming || this.gameOver || this.paused) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const x = (touch.clientX - rect.left) * scaleX;
    const shapes = this.getShapes();
    const r = shapes[this.currentShape].radius;
    this.dropX = Math.max(r + 4, Math.min(CANVAS_W - r - 4, x));
  }

  handleDrop(e) {
    if (this.gameOver || this.paused || !this.canDrop) return;
    this.drop();
  }

  drop() {
    if (!this.isAiming || !this.canDrop) return;
    this.isAiming = false;
    this.canDrop = false;
    this.dropTimer = 0;

    const shapes = this.getShapes();
    const s = shapes[this.currentShape];
    this.entities.push({
      x: this.dropX, y: -s.radius * 2,
      vx: 0, vy: 2 * this.getPhysicsSpeed(),
      radius: s.radius, shapeType: this.currentShape,
      active: true, settleTimer: 0,
      spawnScale: 0, targetScale: 1, justDropped: true,
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
    for (const e of this.entities) {
      if (!e.active) continue;
      const transformed = transformEntityToTheme(e, oldLevel, this.level);
      e.shapeType = transformed.shapeType;
      e.radius = transformed.radius;
    }
    this.physics = new Physics(0.3 * this.getPhysicsSpeed(), 0.98, 0.2);
    this.sounds.playLevelComplete();
    this.renderShapeChain();
    this.addScorePopup(CANVAS_W / 2, CANVAS_H / 2, 'LEVEL ' + this.level + '!');
  }

  update() {
    if (this.gameOver || this.paused) return;

    const shapes = this.getShapes();
    const deathLine = this.getDeathLine();
    this.physics.update(this.entities, CANVAS_W - 4, CANVAS_H - 4);

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

      // Death line check
      if (a.y - a.radius < deathLine && a.y > 0) {
        a.settleTimer++;
        if (a.settleTimer > GRACE_FRAMES) { this.endGame(); return; }
      } else { a.settleTimer = 0; }

      // Merge detection
      for (let j = i + 1; j < n; j++) {
        const b = this.entities[j];
        if (!b.active || a.shapeType !== b.shapeType || a.shapeType >= shapes.length - 1) continue;
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
    for (const m of toMerge) {
      if (merged.has(m.a) || merged.has(m.b)) continue;
      const a = this.entities[m.a], b = this.entities[m.b];
      if (!a || !b || !a.active || !b.active) continue;

      const newType = a.shapeType + 1;
      const newS = shapes[newType];
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;

      if (a.shapeType === shapes.length - 1) { biggestMerged = true; this.triggerScreenShake(); }

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
        spawnScale: 0.1, targetScale: 1, justDropped: false,
      });

      a.active = false; b.active = false;
      merged.add(m.a); merged.add(m.b);
      this.score += newS.score;
      this.updateScoreDisplay();
      this.addScorePopup(mx, my - 30, newS.score);
      this.addMergeFlash(mx, my);
      this.sounds.playMerge(newType);
    }

    this.entities = this.entities.filter(e => e.active);
    if (biggestMerged) this.checkLevelComplete();

    // Wait for last dropped to land before next drop
    const lastDropped = this.entities.find(e => e.justDropped);
    if (lastDropped) {
      // Count frames since drop - entity is considered "landed" after it exists for a few frames
      // regardless of position (physics handles the actual landing)
      this.dropTimer++;
      if (this.dropTimer > DROP_DELAY) {
        lastDropped.justDropped = false;
        this.isAiming = true;
        this.canDrop = true;
      }
    } else {
      // No lastDropped entity waiting - always allow next drop
      this.isAiming = true;
      this.canDrop = true;
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
      if (p.y < 0) { p.y = CANVAS_H + 10; p.x = Math.random() * CANVAS_W; }
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Background
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Grid
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.05)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < CANVAS_W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke(); }
    for (let y = 0; y < CANVAS_H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke(); }

    // Border glow
    ctx.beginPath(); ctx.roundRect(4, 4, CANVAS_W - 8, CANVAS_H - 8, 8);
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)'; ctx.lineWidth = 1; ctx.stroke();

    // Death line
    const deathLine = this.getDeathLine();
    ctx.beginPath(); ctx.setLineDash([6, 6]);
    ctx.moveTo(4, deathLine); ctx.lineTo(CANVAS_W - 4, deathLine);
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
    for (const e of this.entities) {
      const scale = e.spawnScale || 1;
      drawShape(ctx, e.x, e.y, e.shapeType, scale);
    }

    // Aiming indicator
    if (this.isAiming && !this.gameOver && !this.paused) {
      const shapes = this.getShapes();
      const s = shapes[this.currentShape];
      drawShape(ctx, this.dropX, deathLine - 10, this.currentShape);
      ctx.beginPath(); ctx.setLineDash([4, 4]);
      ctx.moveTo(this.dropX, deathLine + s.radius + 4); ctx.lineTo(this.dropX, CANVAS_H - 4);
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

    // Next preview
    this.nextCtx.clearRect(0, 0, 120, 120);
    drawShape(this.nextCtx, 60, 60, this.nextShape, 1.4);
  }

  initAmbientParticles() {
    for (let i = 0; i < 20; i++) {
      this.ambientParticles.push({
        x: Math.random() * CANVAS_W, y: Math.random() * CANVAS_H,
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
    const scoreEl = document.getElementById('score') || document.getElementById('score-desk');
    if (scoreEl) scoreEl.textContent = this.score;
    if (this.score > this.highScore) { this.highScore = this.score; this.updateHighScoreDisplay(); }
  }

  updateHighScoreDisplay() {
    const el = document.getElementById('high-score') || document.getElementById('high-score-desk');
    if (el) el.textContent = this.highScore;
  }

  togglePause() {
    if (this.gameOver) return;
    this.paused = !this.paused;
    document.getElementById('pause-overlay').classList.toggle('hidden', !this.paused);
    this.canvas.style.pointerEvents = this.paused ? 'none' : 'auto';
  }

  endGame() {
    this.gameOver = true;
    this.sounds.stopAmbient();
    this.sounds.playGameOver();
    document.getElementById('final-score').textContent = this.score;
    document.getElementById('game-over').classList.remove('hidden');
    this.disableCanvas();
  }

  async saveScore() {
    if (!this.playerName) return;
    const entry = { name: this.playerName, score: this.score, date: Date.now() };
    try {
      const res = await fetch('/api/scores', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      if (!res.ok) throw new Error('Failed to save score');
      await this.fetchLeaderboard();
    } catch (e) { console.error('Score save failed:', e); }
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('btn-save').disabled = true;
    document.getElementById('btn-save').textContent = 'Saved!';
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
    this.entities = []; this.score = 0;
    this.mergeParticles = []; this.scorePopups = []; this.mergeFlashes = [];
    this.level = 1; this.currentTheme = THEMES[0];
    this.nextShape = this.randomShapeTier(MAX_PREVIEW_TIER);
    this.currentShape = this.randomShapeTier(MAX_PREVIEW_TIER);
    this.dropX = CANVAS_W / 2; this.isAiming = true; this.canDrop = true;
    this.dropTimer = 0; this.gameOver = false; this.paused = false;
    const scoreEl = document.getElementById('score') || document.getElementById('score-desk');
    if (scoreEl) scoreEl.textContent = '0';
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('pause-overlay').classList.add('hidden');
    document.getElementById('btn-save').disabled = false;
    document.getElementById('btn-save').textContent = 'Save Score';
    this.enableCanvas();
    this.updateHighScoreDisplay();
    this.renderLeaderboard();
    this.renderShapeChain();
    this.sounds.startAmbient();
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
        drawShape(ctx, size / 2, size / 2, i, scale);
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
        drawShape(ctx, size / 2, size / 2, i, scale);
        item.appendChild(canvas); rightDiv.appendChild(item);
      }
      container.appendChild(leftDiv); container.appendChild(rightDiv);
    }
    
    // Mobile: horizontal chain
    const mobileChain = document.getElementById('shape-chain');
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
