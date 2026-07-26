const CANVAS_W = 400;
const CANVAS_H = 600;
const DROP_LINE_Y = 90;
const MAX_PREVIEW_TIER = 2;

class SuikaGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.nextCanvas = document.getElementById('next-canvas');
    this.nextCtx = this.nextCanvas.getContext('2d');

    // Responsive sizing
    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.physics = new Physics(0.3, 0.97, 0.3);
    this.entities = [];
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('suika_high_score') || '0');
    this.nextFruit = randomFruitTier(MAX_PREVIEW_TIER);
    this.currentFruit = randomFruitTier(MAX_PREVIEW_TIER);
    this.dropX = CANVAS_W / 2;
    this.isAiming = true;
    this.isDropping = false;
    this.dropCooldown = 0;
    this.gameOver = false;
    this.paused = false;
    this.mergeParticles = [];
    this.leaderboard = JSON.parse(localStorage.getItem('suika_leaderboard') || '[]');

    this.updateHighScoreDisplay();
    this.renderLeaderboard();
    this.bindEvents();
    this.loop();
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const scale = Math.min(rect.width / CANVAS_W, rect.height / CANVAS_H);
    this.canvas.style.width = CANVAS_W + 'px';
    this.canvas.style.height = CANVAS_H + 'px';
    this.scale = window.devicePixelRatio || 1;
    this.canvas.width = CANVAS_W * this.scale;
    this.canvas.height = CANVAS_H * this.scale;
    this.ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
  }

  bindEvents() {
    // Mouse
    this.canvas.addEventListener('mousemove', (e) => this.handleMove(e));
    this.canvas.addEventListener('click', (e) => this.handleDrop(e));
    this.canvas.addEventListener('touchmove', (e) => { e.preventDefault(); this.handleMove(e.touches[0]); }, { passive: false });
    this.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); this.handleMove(e.touches[0]); }, { passive: false });
    this.canvas.addEventListener('touchend', (e) => { e.preventDefault(); this.handleDrop(e.changedTouches[0]); }, { passive: false });

    // Buttons
    document.getElementById('btn-pause').addEventListener('click', () => this.togglePause());
    document.getElementById('btn-restart').addEventListener('click', () => this.restart());
    document.getElementById('btn-save').addEventListener('click', () => this.saveScore());
    document.getElementById('btn-play-again').addEventListener('click', () => this.restart());
    document.getElementById('btn-resume').addEventListener('click', () => this.togglePause());

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        if (!this.gameOver && !this.paused) this.drop();
      }
      if (e.code === 'Escape') this.togglePause();
    });
  }

  handleMove(e) {
    if (!this.isAiming || this.gameOver || this.paused || this.isDropping) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (CANVAS_W / rect.width);
    const r = FRUITS[this.currentFruit].radius;
    this.dropX = Math.max(r + 4, Math.min(CANVAS_W - r - 4, x));
  }

  handleDrop(e) {
    if (this.gameOver || this.paused || this.isDropping) return;
    this.drop();
  }

  drop() {
    if (!this.isAiming || this.isDropping) return;
    this.isAiming = false;
    this.isDropping = true;

    const f = FRUITS[this.currentFruit];
    this.entities.push({
      x: this.dropX,
      y: -f.radius * 2,
      vx: 0,
      vy: 2,
      radius: f.radius,
      fruitType: this.currentFruit,
      active: true,
      settled: false,
      settleTimer: 0,
      spawnScale: 0,
      targetScale: 1,
    });

    // Shift preview to current
    this.currentFruit = this.nextFruit;
    this.nextFruit = randomFruitTier(MAX_PREVIEW_TIER);
  }

  update() {
    if (this.gameOver || this.paused) return;

    this.dropCooldown = Math.max(0, this.dropCooldown - 1);

    // Update entities
    this.physics.update(this.entities, CANVAS_W - 4, CANVAS_H - 4);

    // Entity logic: merging, settling, game over
    const toMerge = [];
    const n = this.entities.length;

    for (let i = 0; i < n; i++) {
      const a = this.entities[i];
      if (!a.active) continue;

      // Spawn animation
      if (a.spawnScale < a.targetScale) {
        a.spawnScale += 0.08;
        if (a.spawnScale > a.targetScale) a.spawnScale = a.targetScale;
      }

      // Settle check
      if (Math.abs(a.vy) < 0.15 && Math.abs(a.vx) < 0.15 && a.y + a.radius < CANVAS_H - 6) {
        a.settleTimer++;
        if (a.settleTimer > 15) {
          a.settled = true;
        }
      } else {
        a.settleTimer = 0;
      }

      // Game over: fruit above drop line
      if (a.y - a.radius < DROP_LINE_Y && a.settled) {
        // Check if it's been there a bit
        if (a.settleTimer > 60) {
          this.endGame();
          return;
        }
      }

      // Merge check
      for (let j = i + 1; j < n; j++) {
        const b = this.entities[j];
        if (!b.active) continue;
        if (a.fruitType !== b.fruitType) continue;
        if (a.fruitType >= FRUITS.length - 1) continue; // Can't merge max fruit

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < (a.radius + b.radius) * 0.85) {
          // Check if not already queued
          let already = false;
          for (const m of toMerge) {
            if ((m.a === i && m.b === j) || (m.a === j && m.b === i) || m.a === i || m.b === i || m.a === j || m.b === j) {
              already = true;
              break;
            }
          }
          if (!already) {
            toMerge.push({ a: i, b: j });
          }
        }
      }
    }

    // Process merges
    const merged = new Set();
    for (const m of toMerge) {
      if (merged.has(m.a) || merged.has(m.b)) continue;

      const a = this.entities[m.a];
      const b = this.entities[m.b];
      if (!a.active || !b.active) continue;

      // Create merged fruit
      const newType = a.fruitType + 1;
      const newF = FRUITS[newType];
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;

      // Particles
      for (let p = 0; p < 12; p++) {
        const angle = (p / 12) * Math.PI * 2;
        this.mergeParticles.push({
          x: mx,
          y: my,
          vx: Math.cos(angle) * (2 + Math.random() * 3),
          vy: Math.sin(angle) * (2 + Math.random() * 3),
          life: 1.0,
          color: newF.color,
          size: 3 + Math.random() * 4,
        });
      }

      this.entities.push({
        x: mx,
        y: my - 2,
        vx: (a.vx + b.vx) * 0.3,
        vy: -1.5,
        radius: newF.radius,
        fruitType: newType,
        active: true,
        settled: false,
        settleTimer: 0,
        spawnScale: 0.1,
        targetScale: 1,
      });

      a.active = false;
      b.active = false;
      merged.add(m.a);
      merged.add(m.b);

      this.score += newF.score;
      this.updateScoreDisplay();
    }

    // Clean up inactive
    this.entities = this.entities.filter(e => e.active);

    // Check if dropping fruit has settled
    const dropping = this.entities.find(e => !e.settled && e.y > 0);
    if (!dropping && this.isDropping) {
      this.isDropping = false;
      this.isAiming = true;
    }

    // Update particles
    for (const p of this.mergeParticles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.life -= 0.04;
    }
    this.mergeParticles = this.mergeParticles.filter(p => p.life > 0);
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Background
    ctx.fillStyle = '#fff8e7';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Bottom rounded container feel
    ctx.beginPath();
    ctx.roundRect(4, 4, CANVAS_W - 8, CANVAS_H - 8, 8);
    ctx.strokeStyle = '#d4a373';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw entities
    for (const e of this.entities) {
      const scale = e.spawnScale || 1;
      drawFruit(ctx, e.x, e.y, e.fruitType, scale);
    }

    // Draw preview fruit following mouse
    if (this.isAiming && !this.gameOver && !this.paused) {
      const f = FRUITS[this.currentFruit];
      drawFruit(ctx, this.dropX, DROP_LINE_Y - 10, this.currentFruit);

      // Drop guide line
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.moveTo(this.dropX, DROP_LINE_Y + f.radius + 4);
      ctx.lineTo(this.dropX, CANVAS_H - 4);
      ctx.strokeStyle = 'rgba(212, 163, 115, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Particles
    for (const p of this.mergeParticles) {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.restore();
    }

    // Draw next fruit preview
    this.nextCtx.clearRect(0, 0, 120, 120);
    drawFruit(this.nextCtx, 60, 60, this.nextFruit, 1.4);
  }

  loop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.loop());
  }

  updateScoreDisplay() {
    document.getElementById('score').textContent = this.score;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('suika_high_score', String(this.highScore));
      this.updateHighScoreDisplay();
    }
  }

  updateHighScoreDisplay() {
    document.getElementById('high-score').textContent = this.highScore;
  }

  togglePause() {
    if (this.gameOver) return;
    this.paused = !this.paused;
    document.getElementById('pause-overlay').classList.toggle('hidden', !this.paused);
  }

  endGame() {
    this.gameOver = true;
    document.getElementById('final-score').textContent = this.score;
    document.getElementById('game-over').classList.remove('hidden');
  }

  saveScore() {
    const name = document.getElementById('player-name').value.trim() || 'Anonymous';
    this.leaderboard.push({ name, score: this.score, date: Date.now() });
    this.leaderboard.sort((a, b) => b.score - a.score);
    this.leaderboard = this.leaderboard.slice(0, 20);
    localStorage.setItem('suika_leaderboard', JSON.stringify(this.leaderboard));
    this.renderLeaderboard();
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('btn-save').disabled = true;
    document.getElementById('btn-save').textContent = 'Saved!';
  }

  renderLeaderboard() {
    const list = document.getElementById('lb-list');
    list.innerHTML = '';
    for (let i = 0; i < this.leaderboard.length; i++) {
      const entry = this.leaderboard[i];
      const li = document.createElement('li');
      li.innerHTML = `<span>${i + 1}. ${escapeHtml(entry.name)}</span><span>${entry.score}</span>`;
      list.appendChild(li);
    }
    if (this.leaderboard.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'No scores yet';
      li.style.justifyContent = 'center';
      li.style.color = '#c4b49a';
      list.appendChild(li);
    }
  }

  restart() {
    this.entities = [];
    this.score = 0;
    this.mergeParticles = [];
    this.nextFruit = randomFruitTier(MAX_PREVIEW_TIER);
    this.currentFruit = randomFruitTier(MAX_PREVIEW_TIER);
    this.dropX = CANVAS_W / 2;
    this.isAiming = true;
    this.isDropping = false;
    this.gameOver = false;
    this.paused = false;
    this.dropCooldown = 0;

    document.getElementById('score').textContent = '0';
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('pause-overlay').classList.add('hidden');
    document.getElementById('btn-save').disabled = false;
    document.getElementById('btn-save').textContent = 'Save Score';
    document.getElementById('player-name').value = '';
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Start
window.addEventListener('DOMContentLoaded', () => {
  new SuikaGame();
});
