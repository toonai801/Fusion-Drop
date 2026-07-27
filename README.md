# Fusion Drop — BETA

A Suika-style merge game with programmatic theme visuals, neon styling, and progressive level unlocking.

## Supported Beta Launch Methods

### Method 1: Node.js Server (Full Features)
Leaderboard and active-player features work:

```bash
npm install
node server.js
```

Visit `http://localhost:8090`

### Method 2: Static File (Local-Only)
Open `index.html` directly in a browser. Leaderboard and live players are hidden; local high score persists via `localStorage`.

## Test

```bash
# Unit tests
node game-engine.test.js

# Browser E2E tests
npx playwright test --project=chromium

# Screenshot capture
node e2e/screenshot-helper.js
```

## Files

| File | Purpose |
|------|---------|
| `index.html` | Game UI |
| `game.js` | Game logic with state machine |
| `themes.js` | 11 theme definitions (7–13 tiers each) |
| `shapes.js` | Theme-specific drawing functions |
| `physics.js` | Verlet-style physics |
| `sounds.js` | Web Audio API sound manager |
| `style.css` | Responsive dark neon theme |
| `server.js` | Node.js backend (scores + active players) |
| `game-engine.test.js` | Node.js automated unit tests |
| `e2e/fusion-drop.spec.js` | Playwright browser tests |
| `playwright.config.js` | Test configuration |
| `qa-evidence/` | Screenshot evidence |

## How to Play

1. Click or tap to drop shapes
2. Equal shapes merge into the next tier
3. Create the largest tier to advance to the next theme
4. Don't let shapes settle above the death line
5. Unlock all 11 themes

## Beta Status

- All 12 known failure categories addressed
- 15 automated browser tests passing
- Visual evidence captured for intro, gameplay, mobile, desktop, game over
- Working tree clean, committed and pushed
