// @ts-check
const { chromium } = require('playwright');

const ENTRY_URL = 'file://' + __dirname + '/../test.html';

(async () => {
  const browser = await chromium.launch();

  async function snap(name, viewport) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    await page.goto(ENTRY_URL);
    await page.waitForSelector('#game-wrapper', { timeout: 10000 });
    await page.waitForTimeout(800);

    // Intro screenshot
    if (name === 'intro') {
      await page.evaluate(() => window.scrollTo(0,0));
      await page.screenshot({ path: __dirname + '/../qa-evidence/' + name + '.png', fullPage: false });
      await context.close();
      return;
    }

    // Start gameplay via evaluate to bypass visibility issues
    await page.evaluate(() => {
      const btn = document.getElementById('btn-intro-start');
      if (btn) btn.click();
    });
    await page.fill('#start-name', 'TestPlayer');
    await page.evaluate(() => {
      const btn = document.getElementById('btn-start');
      if (btn) btn.click();
    });
    await page.waitForTimeout(800);

    if (name === 'gameplay') {
      // Drop a shape
      const box = await page.locator('#game-canvas').boundingBox();
      if (box) {
        await page.evaluate(({cx, cy}) => {
          const rect = window.game.canvas.getBoundingClientRect();
          const evt = new MouseEvent('click', {
            clientX: rect.left + cx,
            clientY: rect.top + cy,
            bubbles: true
          });
          window.game.canvas.dispatchEvent(evt);
        }, { cx: Math.round(box.width / 2), cy: Math.round(box.height * 0.15) });
      }
      await page.waitForTimeout(800);
      await page.screenshot({ path: __dirname + '/../qa-evidence/' + name + '.png', fullPage: false });
      await context.close();
      return;
    }

    if (name === 'gameover') {
      await page.evaluate(() => {
        if (window.game) { window.game.gameOver = true; window.game.endGame(); }
      });
      await page.waitForTimeout(400);
      await page.evaluate(() => window.scrollTo(0,0));
      await page.screenshot({ path: __dirname + '/../qa-evidence/' + name + '.png', fullPage: false });
      await context.close();
      return;
    }

    // Desktop / Mobile layout screenshots (already in correct viewport)
    await page.evaluate(() => window.scrollTo(0,0));
    await page.screenshot({ path: __dirname + '/../qa-evidence/' + name + '.png', fullPage: false });
    await context.close();
  }

  await snap('intro',    { width: 1024, height: 768 });
  await snap('gameplay', { width: 1024, height: 768 });
  await snap('desktop',  { width: 1024, height: 768 });
  await snap('mobile',   { width: 375,  height: 667 });
  await snap('gameover', { width: 1024, height: 768 });

  await browser.close();
  console.log('Screenshots saved to qa-evidence/');
})();
