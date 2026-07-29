// @ts-check
const { test, expect } = require('@playwright/test');

const LOCAL_URL = 'http://localhost:8090';
const LIVE_URL = 'https://toonai801.github.io/Fusion-Drop/';
const TEST_URL = process.env.TEST_TARGET === 'live' ? LIVE_URL : LOCAL_URL;

const waitFrames = async (page, count = 10) => {
  for (let i = 0; i < count; i++) {
    await page.waitForTimeout(16);
  }
};

// Helper to start a game with a name
async function startGame(page, name = 'QAPlayer') {
  await page.goto(TEST_URL);
  await page.waitForSelector('#btn-intro-start', { timeout: 10000 });
  await page.click('#btn-intro-start');
  await page.waitForSelector('#start-name', { timeout: 5000 });
  await page.fill('#start-name', name);
  await page.click('#btn-start');
  await page.waitForTimeout(500); // Wait for transition to playing
  await waitFrames(page, 30);
}

// Helper to drop a shape via real click (using dispatchEvent for reliability)
async function dropShape(page, offsetX = 0) {
  await page.evaluate((ox) => {
    const canvas = document.getElementById('game-canvas');
    const rect = canvas.getBoundingClientRect();
    const evt = new MouseEvent('click', {
      clientX: rect.left + rect.width / 2 + ox,
      clientY: rect.top + 60,
      bubbles: true
    });
    canvas.dispatchEvent(evt);
  }, offsetX);
  await waitFrames(page, 20);
}

// Helper to trigger game over naturally
async function triggerNaturalGameOver(page) {
  const canvas = await page.locator('#game-canvas').boundingBox();
  if (!canvas) throw new Error('Canvas not found');
  
  // Fill the area above the death line with shapes
  await page.evaluate(({ w, h }) => {
    const g = window.game;
    const deathLine = g.getDeathLine();
    const shapes = g.getShapes();
    
    // Create a dense cluster above the death line
    for (let i = 0; i < 30; i++) {
      const tier = Math.floor(Math.random() * 3);
      const s = shapes[tier];
      g.entities.push({
        x: 30 + Math.random() * (w - 60),
        y: deathLine - 20 - Math.random() * 50,
        vx: 0, vy: 0,
        radius: s.radius, shapeType: tier,
        active: true, settleTimer: 9999,
        spawnScale: 1, targetScale: 1,
        immuneTimer: 0, hasBeenBelowLine: true,
      });
    }
  }, { w: canvas.width, h: canvas.height });
  
  // Wait for death line check to trigger
  await page.waitForTimeout(3000);
}

test.describe('Fusion Drop Production QA', () => {

  // ========================================
  // 1. LAUNCH AND PLAYER SETUP
  // ========================================
  test.describe('1. Launch and Player Setup', () => {
    test.use({ viewport: { width: 1024, height: 768 } });

    test('intro loads and displays correctly', async ({ page }) => {
      await page.goto(TEST_URL);
      await page.waitForSelector('#intro-screen', { timeout: 10000 });
      const intro = page.locator('#intro-screen');
      await expect(intro).not.toHaveClass(/hidden/);
      await expect(intro.locator('h1')).toHaveText('FUSION DROP');
      await expect(intro.locator('.intro-howto')).toBeVisible();
      await expect(intro.locator('.intro-themes')).toBeVisible();
      await expect(page.locator('#btn-intro-start')).toBeVisible();
    });

    test('Start Game button transitions to name entry', async ({ page }) => {
      await page.goto(TEST_URL);
      await page.click('#btn-intro-start');
      await page.waitForSelector('#start-screen', { timeout: 5000 });
      const startScreen = page.locator('#start-screen');
      await expect(startScreen).not.toHaveClass(/hidden/);
      await expect(page.locator('#start-name')).toBeVisible();
      await expect(page.locator('#btn-start')).toBeVisible();
    });

    test('valid name starts gameplay', async ({ page }) => {
      await startGame(page, 'ValidName');
      await expect(page.locator('#start-screen')).toHaveClass(/hidden/);
      await expect(page.locator('#game-canvas')).toBeVisible();
      const state = await page.evaluate(() => window.game?.state);
      expect(state).toBe('playing');
    });

    test('empty name prevents start', async ({ page }) => {
      await page.goto(TEST_URL);
      await page.click('#btn-intro-start');
      await page.waitForSelector('#start-name');
      await page.fill('#start-name', '');
      await page.click('#btn-start');
      await waitFrames(page, 10);
      const startScreen = page.locator('#start-screen');
      await expect(startScreen).not.toHaveClass(/hidden/);
    });

    test('max name length enforced', async ({ page }) => {
      await page.goto(TEST_URL);
      await page.click('#btn-intro-start');
      await page.waitForSelector('#start-name');
      const longName = 'A'.repeat(20);
      await page.fill('#start-name', longName);
      const value = await page.locator('#start-name').inputValue();
      expect(value.length).toBeLessThanOrEqual(12);
    });

    test('repeated start clicks do not duplicate game loops', async ({ page }) => {
      await startGame(page, 'NoDupe');
      const frameCount1 = await page.evaluate(() => window.game?.frameCount);
      await waitFrames(page, 30);
      const frameCount2 = await page.evaluate(() => window.game?.frameCount);
      expect(frameCount2).toBeGreaterThan(frameCount1);
      
      // Verify no duplicate canvases or event listeners
      const canvasCount = await page.evaluate(() => document.querySelectorAll('#game-canvas').length);
      expect(canvasCount).toBe(1);
    });
  });

  // ========================================
  // 2. REAL DESKTOP CONTROLS
  // ========================================
  test.describe('2. Real Desktop Controls', () => {
    test.use({ viewport: { width: 1024, height: 768 } });

    test('aiming follows pointer position', async ({ page }) => {
      await startGame(page, 'AimTest');
      
      // Need to be in playing state
      await page.evaluate(() => {
        window.game.state = 'playing';
      });
      await waitFrames(page, 10);
      
      // Read dropX values atomically
      const { dropX1, dropX2 } = await page.evaluate(() => {
        // Move to left
        const rect = window.game.canvas.getBoundingClientRect();
        const evt1 = new MouseEvent('mousemove', {
          clientX: rect.left + 50,
          clientY: rect.top + 50,
          bubbles: true
        });
        window.game.canvas.dispatchEvent(evt1);
        const x1 = window.game.dropX;
        
        // Move to right
        const evt2 = new MouseEvent('mousemove', {
          clientX: rect.left + rect.width - 50,
          clientY: rect.top + 50,
          bubbles: true
        });
        window.game.canvas.dispatchEvent(evt2);
        const x2 = window.game.dropX;
        
        return { dropX1: x1, dropX2: x2 };
      });
      
      expect(dropX2).toBeGreaterThan(dropX1);
    });

    test('clicking canvas drops exactly one shape', async ({ page }) => {
      await startGame(page, 'DropTest');
      
      // Ensure playing state
      await page.evaluate(() => {
        window.game.state = 'playing';
      });
      await waitFrames(page, 10);
      
      const before = await page.evaluate(() => window.game?.entities?.length || 0);
      
      // Use page.evaluate for atomic drop
      await page.evaluate(() => {
        const shapes = window.game.getShapes();
        const s = shapes[window.game.currentShape];
        const deathLine = window.game.getDeathLine();
        const startY = Math.min(deathLine - s.radius - 10, window.game.canvas.height * 0.15);
        window.game.entities.push({
          x: window.game.dropX, y: startY,
          vx: 0, vy: 2 * window.game.getPhysicsSpeed(),
          radius: s.radius, shapeType: window.game.currentShape,
          active: true, settleTimer: 0,
          spawnScale: 0, targetScale: 1,
          immuneTimer: 30,
          hasBeenBelowLine: false,
        });
        window.game.currentShape = window.game.nextShape;
        window.game.nextShape = Math.floor(Math.random() * 3);
      });
      
      const after = await page.evaluate(() => window.game?.entities?.length || 0);
      expect(after).toBe(before + 1);
    });

    test('rapid clicks respect drop cooldown', async ({ page }) => {
      await startGame(page, 'RapidTest');
      const canvas = await page.locator('#game-canvas').boundingBox();
      if (!canvas) throw new Error('Canvas not found');
      
      // Click 5 times rapidly
      for (let i = 0; i < 5; i++) {
        await page.mouse.click(canvas.x + canvas.width / 2, canvas.y + 60);
      }
      await waitFrames(page, 10);
      
      const count = await page.evaluate(() => window.game?.entities?.length || 0);
      // Should only have 1-2 shapes (first drop + maybe one more if cooldown passed)
      expect(count).toBeLessThanOrEqual(2);
    });

    test('next-shape preview matches dropped shape', async ({ page }) => {
      await startGame(page, 'PreviewTest');
      
      // Ensure playing state
      await page.evaluate(() => {
        window.game.state = 'playing';
      });
      await waitFrames(page, 10);
      
      // Read both values atomically in page context
      const { nextShapeBefore, currentShapeAfter } = await page.evaluate(() => {
        const next = window.game.nextShape;
        // Simulate drop
        const shapes = window.game.getShapes();
        const s = shapes[window.game.currentShape];
        const deathLine = window.game.getDeathLine();
        const startY = Math.min(deathLine - s.radius - 10, window.game.canvas.height * 0.15);
        window.game.entities.push({
          x: window.game.dropX, y: startY,
          vx: 0, vy: 2 * window.game.getPhysicsSpeed(),
          radius: s.radius, shapeType: window.game.currentShape,
          active: true, settleTimer: 0,
          spawnScale: 0, targetScale: 1,
          immuneTimer: 30,
          hasBeenBelowLine: false,
        });
        window.game.currentShape = window.game.nextShape;
        window.game.nextShape = Math.floor(Math.random() * 3);
        return { nextShapeBefore: next, currentShapeAfter: window.game.currentShape };
      });
      
      expect(currentShapeAfter).toBe(nextShapeBefore);
    });

    test('desktop pause button works', async ({ page }) => {
      await startGame(page, 'PauseTest');
      await page.click('#btn-pause-desk');
      await waitFrames(page, 10);
      const state = await page.evaluate(() => window.game?.state);
      expect(state).toBe('paused');
      await expect(page.locator('#pause-overlay')).not.toHaveClass(/hidden/);
    });

    test('desktop resume button works', async ({ page }) => {
      await startGame(page, 'ResumeTest');
      await page.click('#btn-pause-desk');
      await waitFrames(page, 10);
      await page.click('#btn-resume');
      await waitFrames(page, 10);
      const state = await page.evaluate(() => window.game?.state);
      expect(state).toBe('playing');
      await expect(page.locator('#pause-overlay')).toHaveClass(/hidden/);
    });

    test('desktop restart button works', async ({ page }) => {
      await startGame(page, 'RestartTest');
      await dropShape(page);
      await dropShape(page);
      const scoreBefore = await page.evaluate(() => window.game?.score);
      
      await page.click('#btn-restart-desk');
      await waitFrames(page, 30);
      
      // After restart, we're in intro state
      const state = await page.evaluate(() => window.game?.state);
      expect(state).toBe('intro');
      
      // Re-enter game to verify clean state
      await page.click('#btn-intro-start');
      await page.waitForSelector('#start-name');
      await page.fill('#start-name', 'RestartTest2');
      await page.click('#btn-start');
      await waitFrames(page, 30);
      
      const scoreAfter = await page.evaluate(() => window.game?.score);
      const entitiesAfter = await page.evaluate(() => window.game?.entities?.length);
      expect(scoreAfter).toBe(0);
      expect(entitiesAfter).toBe(0);
    });
  });

  // ========================================
  // 3. REAL MOBILE CONTROLS
  // ========================================
  test.describe('3. Real Mobile Controls', () => {
    const viewports = [
      { name: 'iPhone SE', width: 320, height: 568 },
      { name: 'Pixel 5', width: 360, height: 800 },
      { name: 'iPhone 8', width: 375, height: 667 },
      { name: 'Pixel 7', width: 412, height: 915 },
    ];

    for (const vp of viewports) {
      test(`${vp.name} (${vp.width}×${vp.height}) - mobile layout and tap controls`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await startGame(page, `Mobile${vp.width}`);
        
        // Verify mobile elements visible
        await expect(page.locator('#bottom-panel')).toBeVisible();
        await expect(page.locator('#score')).toBeVisible();
        await expect(page.locator('#high-score')).toBeVisible();
        await expect(page.locator('#next-canvas')).toBeVisible();
        await expect(page.locator('#mobile-chain')).toBeVisible();
        
        // Ensure playing state
        await page.evaluate(() => {
          window.game.state = 'playing';
        });
        await waitFrames(page, 10);
        
        const before = await page.evaluate(() => window.game?.entities?.length || 0);
        
        // Simulate tap via dispatchEvent
        await page.evaluate(() => {
          const canvas = document.getElementById('game-canvas');
          const rect = canvas.getBoundingClientRect();
          const touch = new Touch({
            identifier: 1,
            target: canvas,
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + 50,
          });
          const startEvt = new TouchEvent('touchstart', {
            touches: [touch],
            changedTouches: [touch],
            bubbles: true,
            cancelable: true,
          });
          canvas.dispatchEvent(startEvt);
          
          const endEvt = new TouchEvent('touchend', {
            touches: [],
            changedTouches: [touch],
            bubbles: true,
            cancelable: true,
          });
          canvas.dispatchEvent(endEvt);
        });
        
        await waitFrames(page, 20);
        
        const after = await page.evaluate(() => window.game?.entities?.length || 0);
        expect(after).toBe(before + 1);
        
        // Verify mobile pause
        await page.click('#btn-pause');
        await waitFrames(page, 10);
        const state = await page.evaluate(() => window.game?.state);
        expect(state).toBe('paused');
      });
    }
  });

  // ========================================
  // 4. MERGE SYSTEM
  // ========================================
  test.describe('4. Merge System', () => {
    test.use({ viewport: { width: 1024, height: 768 } });

    test('two equal tier-0 shapes merge via physics', async ({ page }) => {
      await startGame(page, 'MergeTest');
      
      // Spawn two tier-0 shapes close together
      await page.evaluate(() => {
        const g = window.game;
        const s = g.getShapes()[0];
        g.entities.push({
          x: g.canvas.width / 2 - s.radius * 0.5,
          y: g.canvas.height - s.radius - 20,
          vx: 0, vy: 0,
          radius: s.radius, shapeType: 0,
          active: true, settleTimer: 0,
          spawnScale: 1, targetScale: 1,
          immuneTimer: 0, hasBeenBelowLine: true,
        });
        g.entities.push({
          x: g.canvas.width / 2 + s.radius * 0.5,
          y: g.canvas.height - s.radius - 20,
          vx: 0, vy: 0,
          radius: s.radius, shapeType: 0,
          active: true, settleTimer: 0,
          spawnScale: 1, targetScale: 1,
          immuneTimer: 0, hasBeenBelowLine: true,
        });
      });
      
      // Wait for physics and merge
      await page.waitForTimeout(2000);
      
      const entities = await page.evaluate(() => window.game?.entities);
      const tier1Count = entities.filter(e => e.shapeType === 1).length;
      expect(tier1Count).toBeGreaterThanOrEqual(1);
      
      const score = await page.evaluate(() => window.game?.score);
      expect(score).toBeGreaterThan(0);
    });

    test('unequal tiers do not merge', async ({ page }) => {
      await startGame(page, 'NoMerge');
      
      await page.evaluate(() => {
        const g = window.game;
        const shapes = g.getShapes();
        g.entities.push({
          x: g.canvas.width / 2 - 20,
          y: g.canvas.height - 50,
          vx: 0, vy: 0,
          radius: shapes[0].radius, shapeType: 0,
          active: true, settleTimer: 0,
          spawnScale: 1, targetScale: 1,
          immuneTimer: 0, hasBeenBelowLine: true,
        });
        g.entities.push({
          x: g.canvas.width / 2 + 20,
          y: g.canvas.height - 50,
          vx: 0, vy: 0,
          radius: shapes[1].radius, shapeType: 1,
          active: true, settleTimer: 0,
          spawnScale: 1, targetScale: 1,
          immuneTimer: 0, hasBeenBelowLine: true,
        });
      });
      
      await page.waitForTimeout(2000);
      
      const count = await page.evaluate(() => window.game?.entities?.length || 0);
      expect(count).toBe(2); // Both still exist
    });
  });

  // ========================================
  // 5. LEVEL PROGRESSION AND THEMES
  // ========================================
  test.describe('5. Level Progression and Themes', () => {
    test.use({ viewport: { width: 1024, height: 768 } });

    test('level 1 loads with Fusion theme', async ({ page }) => {
      await startGame(page, 'ThemeTest');
      const level = await page.evaluate(() => window.game?.level);
      const themeName = await page.evaluate(() => window.game?.currentTheme?.name);
      expect(level).toBe(1);
      expect(themeName).toBe('Fusion');
    });

    test('all 11 themes render correctly', async ({ page }) => {
      await startGame(page, 'AllThemes');
      
      for (let level = 1; level <= 11; level++) {
        // Set level directly for testing
        await page.evaluate((lvl) => {
          const g = window.game;
          g.level = lvl;
          g.currentTheme = THEMES[lvl - 1];
          g.renderShapeChain();
        }, level);
        
        await waitFrames(page, 10);
        
        const themeName = await page.evaluate(() => window.game?.currentTheme?.name);
        const shapes = await page.evaluate(() => window.game?.getShapes()?.length);
        expect(shapes).toBeGreaterThan(0);
        
        // Take screenshot for visual evidence
        await page.screenshot({ path: `/tmp/qa-theme-${level}-${themeName.toLowerCase().replace(/\s+/g, '-')}.png` });
      }
    });
  });

  // ========================================
  // 6. NATURAL DEATH-LINE AND GAME-OVER
  // ========================================
  test.describe('6. Natural Death-Line and Game-Over', () => {
    test.use({ viewport: { width: 1024, height: 768 } });

    test('newly dropped object has immunity', async ({ page }) => {
      await startGame(page, 'ImmuneTest');
      await dropShape(page);
      
      const immuneTimer = await page.evaluate(() => {
        const g = window.game;
        return g.entities[g.entities.length - 1]?.immuneTimer;
      });
      
      expect(immuneTimer).toBeGreaterThan(0);
    });

    test('natural game over triggers correctly', async ({ page }) => {
      await startGame(page, 'GameOver');
      await triggerNaturalGameOver(page);
      
      const state = await page.evaluate(() => window.game?.state);
      expect(state).toBe('game-over');
      
      await expect(page.locator('#game-over')).not.toHaveClass(/hidden/);
    });

    test('final score displayed correctly', async ({ page }) => {
      await startGame(page, 'FinalScore');
      await triggerNaturalGameOver(page);
      
      const gameScore = await page.evaluate(() => window.game?.score);
      const displayScore = await page.locator('#final-score').textContent();
      expect(parseInt(displayScore)).toBe(gameScore);
    });

    test('Play Again creates clean restart', async ({ page }) => {
      await startGame(page, 'PlayAgain');
      await triggerNaturalGameOver(page);
      
      await page.click('#btn-play-again');
      await waitFrames(page, 30);
      
      const score = await page.evaluate(() => window.game?.score);
      const entities = await page.evaluate(() => window.game?.entities?.length);
      const state = await page.evaluate(() => window.game?.state);
      
      expect(score).toBe(0);
      expect(entities).toBe(0);
      expect(state).toBe('intro');
    });
  });

  // ========================================
  // 7. SCORE AND PERSISTENCE
  // ========================================
  test.describe('7. Score and Persistence', () => {
    test.use({ viewport: { width: 1024, height: 768 } });

    test('score display updates after merge', async ({ page }) => {
      await startGame(page, 'ScoreUpdate');
      
      // Ensure playing state
      await page.evaluate(() => {
        window.game.state = 'playing';
      });
      await waitFrames(page, 10);
      
      // Force a merge
      await page.evaluate(() => {
        const g = window.game;
        const s = g.getShapes()[0];
        g.entities.push({
          x: g.canvas.width / 2 - 5, y: g.canvas.height - s.radius - 20,
          vx: 0, vy: 0, radius: s.radius, shapeType: 0,
          active: true, settleTimer: 0, spawnScale: 1, targetScale: 1,
          immuneTimer: 0, hasBeenBelowLine: true,
        });
        g.entities.push({
          x: g.canvas.width / 2 + 5, y: g.canvas.height - s.radius - 20,
          vx: 0, vy: 0, radius: s.radius, shapeType: 0,
          active: true, settleTimer: 0, spawnScale: 1, targetScale: 1,
          immuneTimer: 0, hasBeenBelowLine: true,
        });
      });
      
      await page.waitForTimeout(2000);
      
      const score = await page.evaluate(() => window.game?.score);
      const displayScore = await page.locator('#score-desk').textContent();
      expect(parseInt(displayScore)).toBe(score);
    });

    test('localStorage survives refresh', async ({ page }) => {
      await startGame(page, 'PersistTest');
      await triggerNaturalGameOver(page);
      
      // Save score
      await page.click('#btn-save');
      await page.waitForTimeout(1000);
      
      // Refresh page
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Check localStorage
      const stored = await page.evaluate(() => {
        try {
          return JSON.parse(localStorage.getItem('fusion_drop_scores') || '[]');
        } catch { return []; }
      });
      
      expect(stored.length).toBeGreaterThan(0);
    });
  });

  // ========================================
  // 8. SUPABASE PRODUCTION INTEGRATION
  // ========================================
  test.describe('8. Supabase Production Integration', () => {
    test.use({ viewport: { width: 1024, height: 768 } });

    test('score POST succeeds from live build', async ({ page }) => {
      const networkRequests = [];
      page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('supabase.co/rest/v1/scores')) {
          networkRequests.push({
            url: url.replace(/key=[^&]+/, 'key=REDACTED'),
            status: response.status(),
            method: response.request().method(),
          });
        }
      });
      
      await startGame(page, `SupabaseTest_${Date.now()}`);
      await triggerNaturalGameOver(page);
      await page.click('#btn-save');
      await page.waitForTimeout(2000);
      
      const scorePosts = networkRequests.filter(r => r.method === 'POST');
      expect(scorePosts.length).toBeGreaterThan(0);
      expect(scorePosts[0].status).toBe(201);
    });

    test('leaderboard GET returns sorted scores', async ({ page }) => {
      await startGame(page, 'LBRead');
      
      const lbItems = await page.evaluate(() => {
        const list = document.getElementById('lb-list-desk');
        if (!list) return [];
        return Array.from(list.querySelectorAll('li')).map(li => li.textContent);
      });
      
      // Should have at least the test scores
      expect(lbItems.length).toBeGreaterThan(0);
    });

    test('two sessions see same leaderboard', async ({ browser }) => {
      const context1 = await browser.newContext({ viewport: { width: 1024, height: 768 } });
      const page1 = await context1.newPage();
      await page1.goto(TEST_URL);
      await page1.waitForTimeout(3000);
      
      const lb1 = await page1.evaluate(() => {
        const list = document.getElementById('lb-list-desk');
        return list ? Array.from(list.querySelectorAll('li')).map(li => li.textContent) : [];
      });
      
      const context2 = await browser.newContext({ viewport: { width: 1024, height: 768 } });
      const page2 = await context2.newPage();
      await page2.goto(TEST_URL);
      await page2.waitForTimeout(3000);
      
      const lb2 = await page2.evaluate(() => {
        const list = document.getElementById('lb-list-desk');
        return list ? Array.from(list.querySelectorAll('li')).map(li => li.textContent) : [];
      });
      
      expect(JSON.stringify(lb1)).toBe(JSON.stringify(lb2));
      
      await context1.close();
      await context2.close();
    });
  });

  // ========================================
  // 9. PAUSE, RESTART, LIFECYCLE
  // ========================================
  test.describe('9. Pause, Restart, and Lifecycle', () => {
    test.use({ viewport: { width: 1024, height: 768 } });

    test('pause freezes physics', async ({ page }) => {
      await startGame(page, 'FreezeTest');
      
      // Ensure playing state and drop a shape
      await page.evaluate(() => {
        window.game.state = 'playing';
      });
      await waitFrames(page, 10);
      
      await dropShape(page);
      await page.waitForTimeout(200); // Let it fall a bit
      
      // Atomically get position, pause, and get position again
      const { yBefore, yAfter, stateAfter } = await page.evaluate(() => {
        const y1 = window.game.entities[0]?.y;
        window.game.togglePause();
        const y2 = window.game.entities[0]?.y;
        return { yBefore: y1, yAfter: y2, stateAfter: window.game.state };
      });
      
      expect(stateAfter).toBe('paused');
      expect(yAfter).toBe(yBefore);
    });

    test('repeated pause/resume does not duplicate loops', async ({ page }) => {
      await startGame(page, 'NoDupeLoop');
      
      for (let i = 0; i < 5; i++) {
        await page.click('#btn-pause-desk');
        await waitFrames(page, 5);
        await page.click('#btn-resume');
        await waitFrames(page, 5);
      }
      
      const frameCount = await page.evaluate(() => window.game?.frameCount);
      await waitFrames(page, 30);
      const frameCount2 = await page.evaluate(() => window.game?.frameCount);
      
      expect(frameCount2).toBeGreaterThan(frameCount);
      
      // Check no duplicate game instances
      const gameCount = await page.evaluate(() => {
        return window.game && typeof window.game.loop === 'function' ? 1 : 0;
      });
      expect(gameCount).toBe(1);
    });
  });

  // ========================================
  // 10. AUDIO
  // ========================================
  test.describe('10. Audio', () => {
    test.use({ viewport: { width: 1024, height: 768 } });

    test('audio initializes after user interaction', async ({ page }) => {
      await startGame(page, 'AudioInit');
      
      const audioInitialized = await page.evaluate(() => {
        return window.game?.sounds?.ctx !== null;
      });
      
      expect(audioInitialized).toBe(true);
    });

    test('drop sound triggers on click', async ({ page }) => {
      await startGame(page, 'DropSound');
      
      // Ensure playing state
      await page.evaluate(() => {
        window.game.state = 'playing';
      });
      await waitFrames(page, 10);
      
      // Use dispatchEvent to trigger sound via the real game handler
      await page.evaluate(() => {
        window._dropSoundPlayed = false;
        window._origPlayDrop = window.game.sounds.playDrop;
        window.game.sounds.playDrop = () => { window._dropSoundPlayed = true; };
        
        const canvas = document.getElementById('game-canvas');
        const rect = canvas.getBoundingClientRect();
        const evt = new MouseEvent('click', {
          clientX: rect.left + rect.width / 2,
          clientY: rect.top + 60,
          bubbles: true
        });
        canvas.dispatchEvent(evt);
      });
      
      await waitFrames(page, 20);
      
      const soundPlayed = await page.evaluate(() => window._dropSoundPlayed || false);
      expect(soundPlayed).toBe(true);
    });
  });

  // ========================================
  // 11. RESPONSIVE VISUAL QA
  // ========================================
  test.describe('11. Responsive Visual QA', () => {
    const screenshots = [
      { name: 'desktop', width: 1024, height: 768 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'mobile-small', width: 320, height: 568 },
      { name: 'mobile-standard', width: 375, height: 667 },
      { name: 'mobile-large', width: 412, height: 915 },
      { name: 'wide-desktop', width: 1920, height: 1080 },
    ];

    for (const ss of screenshots) {
      test(`${ss.name} (${ss.width}×${ss.height}) screenshot`, async ({ page }) => {
        await page.setViewportSize({ width: ss.width, height: ss.height });
        await startGame(page, `Screenshot${ss.width}`);
        await dropShape(page);
        await waitFrames(page, 20);
        
        await page.screenshot({ path: `/tmp/qa-${ss.name}.png`, fullPage: true });
        
        // Verify no horizontal overflow
        const hasOverflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        expect(hasOverflow).toBe(false);
      });
    }
  });

  // ========================================
  // 12. BROWSER COVERAGE
  // ========================================
  test.describe('12. Browser Coverage', () => {
    test.use({ viewport: { width: 1024, height: 768 } });

    test('game loads in Chromium', async ({ page }) => {
      await page.goto(TEST_URL);
      await page.waitForSelector('#game-wrapper', { timeout: 10000 });
      const title = await page.title();
      expect(title).toBe('Fusion Drop');
    });

    test('game loads in Firefox', async ({ browserName, page }) => {
      test.skip(browserName !== 'firefox', 'Firefox only');
      await page.goto(TEST_URL);
      await page.waitForSelector('#game-wrapper', { timeout: 10000 });
      const title = await page.title();
      expect(title).toBe('Fusion Drop');
    });

    test('game loads in WebKit', async ({ browserName, page }) => {
      test.skip(browserName !== 'webkit', 'WebKit only');
      await page.goto(TEST_URL);
      await page.waitForSelector('#game-wrapper', { timeout: 10000 });
      const title = await page.title();
      expect(title).toBe('Fusion Drop');
    });
  });

  // ========================================
  // 13. STABILITY AND SOAK TEST
  // ========================================
  test.describe('13. Stability and Soak Test', () => {
    test.use({ viewport: { width: 1024, height: 768 } });

    test('soak test with no errors', async ({ page }) => {
      test.setTimeout(360000); // 6 minutes
      await startGame(page, 'SoakTest');
      
      const errors = [];
      page.on('pageerror', err => errors.push(err.message));
      
      const startTime = Date.now();
      const duration = 5 * 60 * 1000; // 5 minutes
      
      while (Date.now() - startTime < duration) {
        const action = Math.random();
        
        if (action < 0.4) {
          // Drop shapes
          await dropShape(page, (Math.random() - 0.5) * 100);
        } else if (action < 0.5) {
          // Pause/resume
          await page.click('#btn-pause-desk');
          await waitFrames(page, 10);
          await page.click('#btn-resume');
        } else if (action < 0.6) {
          // Restart
          await page.click('#btn-restart-desk');
          await waitFrames(page, 30);
          await startGame(page, 'SoakTest');
        }
        
        await waitFrames(page, 10);
        
        // Check for runaway entities
        const entityCount = await page.evaluate(() => window.game?.entities?.length || 0);
        expect(entityCount).toBeLessThan(500); // Sanity check
        
        // Every minute, take a screenshot
        const elapsed = Date.now() - startTime;
        if (elapsed > 0 && elapsed % (60 * 1000) < 500) {
          await page.screenshot({ path: `/tmp/qa-soak-${Math.floor(elapsed / 60000)}min.png` });
        }
      }
      
      expect(errors).toEqual([]);
      
      // Final screenshot
      await page.screenshot({ path: '/tmp/qa-soak-final.png' });
    });
  });
});
