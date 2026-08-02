(async () => {
  const browser = await (require('playwright').chromium.launch());
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('https://reg-nurses-cove-exit.trycloudflare.com/');
  await page.waitForTimeout(2000);
  await page.click('#btn-intro-start');
  await page.waitForTimeout(400);
  await page.fill('#start-name', 'G');
  await page.click('#btn-start');
  await page.waitForTimeout(1500);
  // Stack near death line to trigger game-over, then verify screen
  await page.evaluate(() => {
    const g = window.game;
    const shapes = g.getShapes();
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 4; col++) {
        g.entities.push({
          x: 50 + col * 80, y: 60 + row * 30,
          vx: 0, vy: 0,
          radius: shapes[Math.min(row, shapes.length - 1)].radius,
          shapeType: Math.min(row, shapes.length - 1),
          active: true, settleTimer: 200, hasBeenBelowLine: true,
          immuneTimer: 0, spawnScale: 1, targetScale: 1,
        });
      }
    }
  });
  await page.waitForTimeout(2500);
  const data = await page.evaluate(() => ({
    state: window.game.state,
    goVisible: !document.getElementById('game-over').classList.contains('hidden'),
    goRect: document.getElementById('game-over').getBoundingClientRect(),
    cvRect: document.getElementById('game-canvas').getBoundingClientRect(),
    vh: window.innerHeight,
  }));
  console.log('gameover-mobile:', JSON.stringify(data, null, 2));
  await page.screenshot({ path: '/tmp/v19_gameover_mobile.png' });
  await browser.close();
})();
