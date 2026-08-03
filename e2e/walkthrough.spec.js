const { test, expect } = require('@playwright/test');

const GAME_URL = 'http://localhost:8090';

test.describe('Fusion Drop full walkthrough (smoke)', () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test('full game flow: intro → play → save → restart', async ({ page }) => {
    const errs = [];
    page.on('pageerror', e => errs.push('PAGE-ERR: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE-ERR: ' + m.text()); });

    await page.goto(GAME_URL);
    await page.waitForTimeout(500);

    // Intro -> start
    await page.click('#btn-intro-start');
    await page.waitForTimeout(300);

    // All three mode buttons visible
    await expect(page.locator('[data-mode="classic"]')).toBeVisible();
    await expect(page.locator('[data-mode="zen"]')).toBeVisible();
    await expect(page.locator('[data-mode="speed"]')).toBeVisible();
    await expect(page.locator('#daily-theme-banner')).toBeVisible();

    await page.fill('#start-name', 'Walkthrough');
    await page.click('#btn-start');
    await page.waitForTimeout(800);

    // Playing state
    const state = await page.evaluate(() => window.game.state);
    expect(state).toBe('playing');

    // Canvas dimensions
    const cv = await page.evaluate(() => ({ w: window.game.canvas.width, h: window.game.canvas.height }));
    expect(cv.w).toBeGreaterThanOrEqual(440);
    expect(cv.w).toBeLessThanOrEqual(520);
    expect(cv.h / cv.w).toBeGreaterThan(1.49);
    expect(cv.h / cv.w).toBeLessThan(1.51);

    // Drop 8 shapes — alternate at two positions to force at least one merge.
    for (let i = 0; i < 8; i++) {
      await page.evaluate((i) => {
        const cv = window.game.canvas;
        // Keep this smoke test deterministic. Random previews can otherwise
        // produce eight different pieces and never exercise a merge.
        window.game.currentShape = 0;
        window.game.nextShape = 0;
        const rect = cv.getBoundingClientRect();
        // Alternate x positions: 1st, 3rd, 5th, 7th at x=150; 2nd, 4th, 6th, 8th at x=250.
        const x = rect.left + (i % 2 === 0 ? 150 : 250);
        const evt = new MouseEvent('click', { clientX: x, clientY: rect.top + 30, bubbles: true });
        cv.dispatchEvent(evt);
      }, i);
      await expect.poll(() => page.evaluate(() =>
        window.game.entities.every(e => !e.active || e.immuneTimer <= 0)
      )).toBe(true);
    }
    const drops = await page.evaluate(() => window.game.dropsCount);
    expect(drops).toBe(8);

    // Achievement earned
    const achievements = await page.evaluate(() => Array.from(window.game.achievements));
    expect(achievements).toContain('first_merge');

    // Pause and resume
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.game.state)).toBe('paused');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.game.state)).toBe('playing');

    // End game
    await page.evaluate(() => window.game.endGame());
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => window.game.state)).toBe('game-over');
    const finalScore = await page.evaluate(() => parseInt(document.getElementById('final-score').textContent));
    expect(finalScore).toBeGreaterThan(0);

    // Save score
    await page.click('#btn-save');
    await page.waitForTimeout(800);
    const onLeaderboard = await page.evaluate(async () => {
      const r = await fetch('/api/scores').then(r => r.json());
      return r.some(e => e.name === 'Walkthrough');
    });
    expect(onLeaderboard).toBe(true);

    // Restart
    await page.click('#btn-play-again');
    await page.waitForTimeout(500);
    const afterRestart = await page.evaluate(() => ({
      state: window.game.state,
      score: window.game.score,
      drops: window.game.dropsCount,
      achievements: window.game.achievements.size,
    }));
    expect(afterRestart.state).toBe('intro');
    expect(afterRestart.score).toBe(0);
    expect(afterRestart.drops).toBe(0);
    expect(afterRestart.achievements).toBe(0);

    expect(errs).toEqual([]);
  });
});
