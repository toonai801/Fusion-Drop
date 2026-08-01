(async () => {
  const browser = await (require('playwright').chromium.launch());
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGE-ERR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE-ERR: ' + m.text()); });
  await page.goto('http://localhost:8090/');
  await page.waitForTimeout(500);
  await page.click('#btn-intro-start');
  await page.waitForTimeout(300);
  await page.fill('#start-name', 'Stress');
  await page.click('#btn-start');
  await page.waitForTimeout(800);
  // 100 drops
  for (let i = 0; i < 100; i++) {
    await page.evaluate(() => {
      const cv = window.game.canvas;
      const rect = cv.getBoundingClientRect();
      const x = rect.left + 50 + Math.random() * 300;
      const y = rect.top + 30;
      const evt = new MouseEvent('click', { clientX: x, clientY: y, bubbles: true });
      cv.dispatchEvent(evt);
    });
    await page.waitForTimeout(150);
  }
  const data = await page.evaluate(() => ({
    state: window.game.state,
    score: window.game.score,
    drops: window.game.dropsCount,
    merges: window.game.mergesCount,
    activeEntities: window.game.entities.filter(e => e.active).length,
    achievements: window.game.achievements.size,
    achievementsList: Array.from(window.game.achievements),
    level: window.game.level,
    themeName: window.game.currentTheme && window.game.currentTheme.name,
  }));
  console.log('after-100-drops:', JSON.stringify(data, null, 2));
  console.log('errs:', JSON.stringify(errs));
  await browser.close();
})();
