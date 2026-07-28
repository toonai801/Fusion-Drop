# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: production-qa.spec.js >> Fusion Drop Production QA >> 13. Stability and Soak Test >> 20-minute soak test with no errors
- Location: e2e/production-qa.spec.js:859:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForTimeout: Test timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=f6e2]:
  - generic [ref=f6e3]:
    - generic [ref=f6e4]:
      - generic [ref=f6e5]: SCORE
      - generic [ref=f6e6]: "4"
      - generic [ref=f6e7]: BEST
      - generic [ref=f6e8]: "4"
    - generic [ref=f6e9]: NEXT
    - generic [ref=f6e12]:
      - button "⏸" [ref=f6e13] [cursor=pointer]
      - button "↻" [ref=f6e14] [cursor=pointer]
    - generic [ref=f6e15]:
      - generic [ref=f6e16]: 🏆 ALL TIME
      - list [ref=f6e17]:
        - listitem [ref=f6e18]: 1. TestPlayer_1785275630518999
        - listitem [ref=f6e19]: 2. Test100
        - listitem [ref=f6e20]: 3. Test409_17850
        - listitem [ref=f6e21]: 4. PersistTest0
        - listitem [ref=f6e22]: 5. SupabaseTest0
        - listitem [ref=f6e23]: 6. PersistTest0
        - listitem [ref=f6e24]: 7. SupabaseTest0
        - listitem [ref=f6e25]: 8. PersistTest0
        - listitem [ref=f6e26]: 9. SupabaseTest0
        - listitem [ref=f6e27]: 10. SupabaseTest0
        - listitem [ref=f6e28]: 11. PersistTest0
        - listitem [ref=f6e29]: 12. SupabaseTest0
        - listitem [ref=f6e30]: 13. PersistTest0
        - listitem [ref=f6e31]: 14. SupabaseTest0
      - generic [ref=f6e32]: 🔴 LIVE PLAYERS
      - list
  - generic [ref=f6e36]:
    - heading "FUSION DROP" [level=1] [ref=f6e37]
    - generic [ref=f6e38]:
      - heading "How to Play" [level=2] [ref=f6e39]
      - list [ref=f6e40]:
        - listitem [ref=f6e41]: Move mouse to aim, click to drop shapes
        - listitem [ref=f6e42]: Same shapes merge into bigger shapes
        - listitem [ref=f6e43]: Don't let shapes cross the death line
        - listitem [ref=f6e44]: Merge two biggest shapes to unlock next level
    - generic [ref=f6e45]:
      - heading "11 Themes to Unlock" [level=2] [ref=f6e46]
      - paragraph [ref=f6e47]: Fusion → Treasure → Slime → Potion → Planet → Food → Aquarium → Dice → Dungeon → Wizard → Cat
    - button "Start Game" [ref=f6e48] [cursor=pointer]
  - generic [ref=f6e49]: FUSION CHAIN
```

# Test source

```ts
  1   | // @ts-check
  2   | const { test, expect } = require('@playwright/test');
  3   | 
  4   | const LOCAL_URL = 'http://localhost:8090';
  5   | const LIVE_URL = 'https://toonai801.github.io/Fusion-Drop/';
  6   | const TEST_URL = process.env.TEST_TARGET === 'live' ? LIVE_URL : LOCAL_URL;
  7   | 
  8   | const waitFrames = async (page, count = 10) => {
  9   |   for (let i = 0; i < count; i++) {
> 10  |     await page.waitForTimeout(16);
      |                ^ Error: page.waitForTimeout: Test timeout of 30000ms exceeded.
  11  |   }
  12  | };
  13  | 
  14  | // Helper to start a game with a name
  15  | async function startGame(page, name = 'QAPlayer') {
  16  |   await page.goto(TEST_URL);
  17  |   await page.waitForSelector('#btn-intro-start', { timeout: 10000 });
  18  |   await page.click('#btn-intro-start');
  19  |   await page.waitForSelector('#start-name', { timeout: 5000 });
  20  |   await page.fill('#start-name', name);
  21  |   await page.click('#btn-start');
  22  |   await page.waitForTimeout(500); // Wait for transition to playing
  23  |   await waitFrames(page, 30);
  24  | }
  25  | 
  26  | // Helper to drop a shape via real click (using dispatchEvent for reliability)
  27  | async function dropShape(page, offsetX = 0) {
  28  |   await page.evaluate((ox) => {
  29  |     const canvas = document.getElementById('game-canvas');
  30  |     const rect = canvas.getBoundingClientRect();
  31  |     const evt = new MouseEvent('click', {
  32  |       clientX: rect.left + rect.width / 2 + ox,
  33  |       clientY: rect.top + 60,
  34  |       bubbles: true
  35  |     });
  36  |     canvas.dispatchEvent(evt);
  37  |   }, offsetX);
  38  |   await waitFrames(page, 20);
  39  | }
  40  | 
  41  | // Helper to trigger game over naturally
  42  | async function triggerNaturalGameOver(page) {
  43  |   const canvas = await page.locator('#game-canvas').boundingBox();
  44  |   if (!canvas) throw new Error('Canvas not found');
  45  |   
  46  |   // Fill the area above the death line with shapes
  47  |   await page.evaluate(({ w, h }) => {
  48  |     const g = window.game;
  49  |     const deathLine = g.getDeathLine();
  50  |     const shapes = g.getShapes();
  51  |     
  52  |     // Create a dense cluster above the death line
  53  |     for (let i = 0; i < 30; i++) {
  54  |       const tier = Math.floor(Math.random() * 3);
  55  |       const s = shapes[tier];
  56  |       g.entities.push({
  57  |         x: 30 + Math.random() * (w - 60),
  58  |         y: deathLine - 20 - Math.random() * 50,
  59  |         vx: 0, vy: 0,
  60  |         radius: s.radius, shapeType: tier,
  61  |         active: true, settleTimer: 9999,
  62  |         spawnScale: 1, targetScale: 1,
  63  |         immuneTimer: 0, hasBeenBelowLine: true,
  64  |       });
  65  |     }
  66  |   }, { w: canvas.width, h: canvas.height });
  67  |   
  68  |   // Wait for death line check to trigger
  69  |   await page.waitForTimeout(3000);
  70  | }
  71  | 
  72  | test.describe('Fusion Drop Production QA', () => {
  73  | 
  74  |   // ========================================
  75  |   // 1. LAUNCH AND PLAYER SETUP
  76  |   // ========================================
  77  |   test.describe('1. Launch and Player Setup', () => {
  78  |     test.use({ viewport: { width: 1024, height: 768 } });
  79  | 
  80  |     test('intro loads and displays correctly', async ({ page }) => {
  81  |       await page.goto(TEST_URL);
  82  |       await page.waitForSelector('#intro-screen', { timeout: 10000 });
  83  |       const intro = page.locator('#intro-screen');
  84  |       await expect(intro).not.toHaveClass(/hidden/);
  85  |       await expect(intro.locator('h1')).toHaveText('FUSION DROP');
  86  |       await expect(intro.locator('.intro-howto')).toBeVisible();
  87  |       await expect(intro.locator('.intro-themes')).toBeVisible();
  88  |       await expect(page.locator('#btn-intro-start')).toBeVisible();
  89  |     });
  90  | 
  91  |     test('Start Game button transitions to name entry', async ({ page }) => {
  92  |       await page.goto(TEST_URL);
  93  |       await page.click('#btn-intro-start');
  94  |       await page.waitForSelector('#start-screen', { timeout: 5000 });
  95  |       const startScreen = page.locator('#start-screen');
  96  |       await expect(startScreen).not.toHaveClass(/hidden/);
  97  |       await expect(page.locator('#start-name')).toBeVisible();
  98  |       await expect(page.locator('#btn-start')).toBeVisible();
  99  |     });
  100 | 
  101 |     test('valid name starts gameplay', async ({ page }) => {
  102 |       await startGame(page, 'ValidName');
  103 |       await expect(page.locator('#start-screen')).toHaveClass(/hidden/);
  104 |       await expect(page.locator('#game-canvas')).toBeVisible();
  105 |       const state = await page.evaluate(() => window.game?.state);
  106 |       expect(state).toBe('playing');
  107 |     });
  108 | 
  109 |     test('empty name prevents start', async ({ page }) => {
  110 |       await page.goto(TEST_URL);
```