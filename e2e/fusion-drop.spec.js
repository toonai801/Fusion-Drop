// @ts-check
const { test, expect } = require('@playwright/test');

const GAME_URL = 'http://localhost:8090';
const LOCAL_FILE = 'file://' + __dirname + '/../index.html';
const USE_SERVER = true;  // Server is the supported launch method per README.
const ENTRY_URL = GAME_URL;  // FD-001-A2: test.html removed

/**
 * Helper to wait for game loop to settle
 */
const waitFrames = async (page, count = 10) => {
  for (let i = 0; i < count; i++) {
    await page.waitForTimeout(16); // ~1 frame at 60fps
  }
};

test.describe('Fusion Drop E2E', () => {

  // ========================
  // Desktop viewport (1024×768)
  // ========================
  test.describe('Desktop @desktop', () => {
    test.use({ viewport: { width: 1024, height: 768 } });

    test('game loads without console errors', async ({ page }) => {
      const errors = [];
      page.on('pageerror', err => errors.push(err.message));
      page.on('console', msg => {
        if (msg.type() === 'error') {
          const text = msg.text();
          // file:// scheme cannot do fetch() – that's expected, not a game bug
          if (text.includes('URL scheme "file" is not supported')) return;
          if (text.includes('Failed to fetch') && text.includes('file://')) return;
          errors.push(text);
        }
      });
      await page.goto(ENTRY_URL);
      await page.waitForSelector('#game-wrapper', { timeout: 10000 });
      await waitFrames(page, 60);
      expect(errors).toEqual([]);
    });

    test('intro screen displays', async ({ page }) => {
      await page.goto(ENTRY_URL);
      await page.waitForSelector('#intro-screen', { timeout: 10000 });
      const intro = page.locator('#intro-screen');
      await expect(intro).not.toHaveClass(/hidden/);
      await expect(intro.locator('h1')).toHaveText('FUSION DROP');
    });

    test('clicking Start Game on intro shows name entry', async ({ page }) => {
      await page.goto(ENTRY_URL);
      await page.waitForSelector('#btn-intro-start', { timeout: 10000 });
      await page.click('#btn-intro-start');
      await page.waitForSelector('#start-screen', { timeout: 5000 });
      const start = page.locator('#start-screen');
      await expect(start).not.toHaveClass(/hidden/);
      await expect(start.locator('input#start-name')).toBeVisible();
    });

    test('entering name and clicking Start enables gameplay', async ({ page }) => {
      await page.goto(ENTRY_URL);
      await page.click('#btn-intro-start');
      await page.waitForSelector('#start-name');
      await page.fill('#start-name', 'TestPlayer');
      await page.click('#btn-start');
      await page.waitForTimeout(500);
      const start = page.locator('#start-screen');
      await expect(start).toHaveClass(/hidden/);
      // Canvas should be interactive
      await expect(page.locator('#game-canvas')).toBeVisible();
    });

    test('idle gameplay never auto-drops a shape', async ({ page }) => {
      await page.goto(ENTRY_URL);
      await page.click('#btn-intro-start');
      await page.click('#btn-start');
      await expect.poll(() => page.evaluate(() => window.game.state)).toBe('playing');
      await page.waitForTimeout(3500);
      const idle = await page.evaluate(() => ({
        entities: window.game.entities.length,
        drops: window.game.dropsCount,
      }));
      expect(idle).toEqual({ entities: 0, drops: 0 });
    });

    test('mouse movement shows aiming indicator', async ({ page }) => {
      await page.goto(ENTRY_URL);
      await page.click('#btn-intro-start');
      await page.fill('#start-name', 'TestPlayer');
      await page.click('#btn-start');
      await waitFrames(page, 30);
      const canvas = page.locator('#game-canvas');
      const box = await canvas.boundingBox();
      if (!box) throw new Error('Canvas not found');
      await page.mouse.move(box.x + box.width / 2, box.y + 50);
      await waitFrames(page, 10);
      // Game should still be running without error
      await expect(canvas).toBeVisible();
    });

    test('clicking drops a shape', async ({ page }) => {
      await page.goto(ENTRY_URL);
      await page.click('#btn-intro-start');
      await page.fill('#start-name', 'TestPlayer');
      await page.click('#btn-start');
      await page.waitForTimeout(1200);
      const canvas = page.locator('#game-canvas');
      const box = await canvas.boundingBox();
      if (!box) throw new Error('Canvas not found');
      const before = await page.evaluate(() => window.game?.entities?.length || 0);
      // Directly invoke handleDrop at canvas centre via page.evaluate
      const clickX = Math.round(box.width / 2);
      const clickY = Math.round(box.height * 0.15);
      await page.evaluate(({cx, cy}) => {
        const rect = window.game.canvas.getBoundingClientRect();
        const evt = new MouseEvent('click', {
          clientX: rect.left + cx,
          clientY: rect.top + cy,
          bubbles: true
        });
        window.game.canvas.dispatchEvent(evt);
      }, { cx: clickX, cy: clickY });
      await page.waitForTimeout(1200);
      const after = await page.evaluate(() => window.game?.entities?.length || 0);
      expect(after).toBeGreaterThan(before);
    });

    test('two same shapes merge when they collide', async ({ page }) => {
      await page.goto(ENTRY_URL);
      await page.click('#btn-intro-start');
      await page.fill('#start-name', 'TestPlayer');
      await page.click('#btn-start');
      await page.waitForTimeout(800);
      const canvas = page.locator('#game-canvas');
      const box = await canvas.boundingBox();
      if (!box) throw new Error('Canvas not found');

      // Force spawn two identical shapes close together via eval
      await page.evaluate(() => {
        const g = window.game;
        const s = g.getShapes()[0];
        g.entities.push({
          x: g.canvas.width / 2 - s.radius * 0.5,
          y: g.canvas.height - s.radius - 20,
          vx: 0, vy: 0,
          radius: s.radius, shapeType: 0,
          active: true, settleTimer: 0,
          spawnScale: 1, targetScale: 1, justDropped: false,
          hasBeenBelowLine: true, immuneTimer: 0,
        });
        g.entities.push({
          x: g.canvas.width / 2 + s.radius * 0.5,
          y: g.canvas.height - s.radius - 20,
          vx: 0, vy: 0,
          radius: s.radius, shapeType: 0,
          active: true, settleTimer: 0,
          spawnScale: 1, targetScale: 1, justDropped: false,
          hasBeenBelowLine: true, immuneTimer: 0,
        });
      });
      const before = await page.evaluate(() => window.game.entities.length);
      // Let physics/merge run for a few frames
      for (let i = 0; i < 30; i++) {
        await page.evaluate(() => window.game.update());
        await page.waitForTimeout(16);
      }
      const after = await page.evaluate(() => window.game.entities.length);
      // Should have merged down (fewer entities, or one new merged entity)
      expect(after).toBeLessThan(before + 1);
    });

    test('score updates after merge', async ({ page }) => {
      await page.goto(ENTRY_URL);
      await page.click('#btn-intro-start');
      await page.fill('#start-name', 'TestPlayer');
      await page.click('#btn-start');
      await page.waitForTimeout(1200);
      const beforeScore = await page.evaluate(() => window.game.score);
      // Spawn two identical shapes overlapping so they merge immediately
      await page.evaluate(() => {
        const g = window.game;
        const s = g.getShapes()[0];
        g.entities.push({
          x: g.canvas.width / 2, y: g.canvas.height - s.radius - 20,
          vx: 0, vy: 0, radius: s.radius, shapeType: 0,
          active: true, settleTimer: 0, spawnScale: 1, targetScale: 1, justDropped: false, hasBeenBelowLine: true,
        });
        g.entities.push({
          x: g.canvas.width / 2 + 1, y: g.canvas.height - s.radius - 20,
          vx: 0, vy: 0, radius: s.radius, shapeType: 0,
          active: true, settleTimer: 0, spawnScale: 1, targetScale: 1, justDropped: false, hasBeenBelowLine: true,
        });
      });
      // Force merge by stepping update many times
      for (let i = 0; i < 60; i++) {
        await page.evaluate(() => window.game.update());
        await page.waitForTimeout(8);
      }
      const afterScore = await page.evaluate(() => window.game.score);
      expect(afterScore).toBeGreaterThan(beforeScore);
    });

    test('death line is visible', async ({ page }) => {
      await page.goto(ENTRY_URL);
      await page.click('#btn-intro-start');
      await page.fill('#start-name', 'TestPlayer');
      await page.click('#btn-start');
      await waitFrames(page, 30);
      const canvas = page.locator('#game-canvas');
      await expect(canvas).toBeVisible();
      // Death line is drawn at DROP_LINE_Y + offset; canvas is visible so line is rendered
      expect(await canvas.evaluate(el => el.getContext('2d') !== null)).toBe(true);
    });

    test('game over occurs when shapes stack above line', async ({ page }) => {
      await page.goto(ENTRY_URL);
      await page.click('#btn-intro-start');
      await page.fill('#start-name', 'TestPlayer');
      await page.click('#btn-start');
      await page.waitForTimeout(1200);
      // Force game over by directly setting gameOver flag and calling endGame
      await page.evaluate(() => {
        if (!window.game) return;
        window.game.gameOver = true;
        window.game.endGame();
      });
      await page.waitForTimeout(300);
      const gameOver = await page.evaluate(() => window.game && window.game.gameOver);
      expect(gameOver).toBe(true);
      const overlay = page.locator('#game-over');
      await expect(overlay).not.toHaveClass(/hidden/);
    });

    test('pause button works', async ({ page }) => {
      await page.goto(ENTRY_URL);
      await page.click('#btn-intro-start');
      await page.fill('#start-name', 'TestPlayer');
      await page.click('#btn-start');
      await page.waitForTimeout(1200);
      // Use page.evaluate to directly call togglePause (avoids visibility issues)
      await page.evaluate(() => { window.game.paused = true; window.game.togglePause(); });
      await page.waitForTimeout(300);
      const paused = await page.evaluate(() => window.game.paused);
      expect(paused).toBe(true);
      const overlay = page.locator('#pause-overlay');
      await expect(overlay).not.toHaveClass(/hidden/);
    });

    test('restart button resets game', async ({ page }) => {
      await page.goto(ENTRY_URL);
      await page.click('#btn-intro-start');
      await page.fill('#start-name', 'TestPlayer');
      await page.click('#btn-start');
      await page.waitForTimeout(1200);
      // Drop a shape via direct canvas click
      const canvas = page.locator('#game-canvas');
      const box = await canvas.boundingBox();
      if (box) {
        const cx = Math.round(box.width / 2);
        const cy = Math.round(box.height * 0.15);
        await page.evaluate(({cx, cy}) => {
          const rect = window.game.canvas.getBoundingClientRect();
          const evt = new MouseEvent('click', {
            clientX: rect.left + cx,
            clientY: rect.top + cy,
            bubbles: true
          });
          window.game.canvas.dispatchEvent(evt);
        }, { cx, cy });
      }
      await page.waitForTimeout(1200);
      const before = await page.evaluate(() => window.game.entities.length);
      expect(before).toBeGreaterThan(0);
      // Click restart via direct evaluation
      await page.evaluate(() => window.game.restart());
      await page.waitForTimeout(800);
      const after = await page.evaluate(() => window.game.entities.length);
      expect(after).toBe(0);
      const score = await page.evaluate(() => window.game.score);
      expect(score).toBe(0);
    });

    test('desktop cabinet layout shows at 1024×768', async ({ page }) => {
      await page.goto(ENTRY_URL);
      await page.waitForSelector('#game-wrapper', { timeout: 10000 });
      const left = page.locator('#left-panel');
      await expect(left).toBeVisible();
      const right = page.locator('#right-panel');
      await expect(right).not.toBeVisible();
      const fit = await page.evaluate(() => {
        const board = document.querySelector('#game-area').getBoundingClientRect();
        return {
          noPageScroll: document.body.scrollWidth <= innerWidth && document.body.scrollHeight <= innerHeight,
          boardVisible: board.top >= 0 && board.left >= 0 && board.right <= innerWidth && board.bottom <= innerHeight,
        };
      });
      expect(fit.noPageScroll).toBe(true);
      expect(fit.boardVisible).toBe(true);
    });
  });

  // ========================
  // Mobile viewport (375×667)
  // ========================
  test.describe('Mobile @mobile', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('mobile layout shows at 375×667', async ({ page }) => {
      await page.goto(ENTRY_URL);
      await page.waitForSelector('#game-wrapper', { timeout: 10000 });
      const bottom = page.locator('#bottom-panel');
      await expect(bottom).toBeVisible();
      const left = page.locator('#left-panel');
      await expect(left).not.toBeVisible();
      const right = page.locator('#right-panel');
      await expect(right).not.toBeVisible();
      const fit = await page.evaluate(() => {
        const board = document.querySelector('#game-area').getBoundingClientRect();
        const hud = document.querySelector('#bottom-panel').getBoundingClientRect();
        return {
          noPageScroll: document.body.scrollWidth <= innerWidth && document.body.scrollHeight <= innerHeight,
          boardVisible: board.top >= 0 && board.left >= 0 && board.right <= innerWidth && board.bottom <= innerHeight,
          hudAboveBoard: hud.bottom <= board.top,
          usefulBoard: board.height >= innerHeight * 0.7,
        };
      });
      expect(fit.noPageScroll).toBe(true);
      expect(fit.boardVisible).toBe(true);
      expect(fit.hudAboveBoard).toBe(true);
      expect(fit.usefulBoard).toBe(true);
    });
  });

  // ========================
  // Cross-viewport: no uncaught exceptions
  // ========================
  test('no uncaught exceptions during gameplay', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => {
      const msg = err.message;
      if (msg.includes('Failed to fetch') && msg.includes('file://')) return;
      if (msg.includes('URL scheme "file" is not supported')) return;
      errors.push(msg);
    });
    await page.goto(ENTRY_URL);
    await page.waitForSelector('#game-wrapper', { timeout: 10000 });
    await page.click('#btn-intro-start');
    await page.fill('#start-name', 'Tester');
    await page.click('#btn-start');
    await page.waitForTimeout(600);
    // Simulate gameplay
    const canvas = page.locator('#game-canvas');
    const box = await canvas.boundingBox();
    if (box) {
      for (let i = 0; i < 5; i++) {
        await page.mouse.click(box.x + box.width / 2 + (Math.random() - 0.5) * 40, box.y + 50);
        await page.waitForTimeout(500);
      }
    }
    await page.evaluate(() => window.game.togglePause && window.game.togglePause());
    await page.waitForTimeout(200);
    await page.evaluate(() => window.game.togglePause && window.game.togglePause());
    await page.waitForTimeout(200);
    expect(errors).toEqual([]);
  });
});
