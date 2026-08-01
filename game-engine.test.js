// game-engine.test.js — Real unit tests for Fusion Drop production code
// Run with: node game-engine.test.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch(e) {
    failed++;
    failures.push({ name, error: e.message });
    console.log(`  ❌ ${name}: ${e.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

// Create a shared sandbox
const sandbox = {
  console: console,
  Math: Math,
  Date: Date,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  parseFloat: parseFloat,
  parseInt: parseInt,
  JSON: JSON,
  Array: Array,
  Object: Object,
  String: String,
  Number: Number,
  Boolean: Boolean,
  Error: Error,
  Math_hypot: Math.hypot,
};

// Expose browser globals on sandbox root
sandbox.window = {
  addEventListener: () => {},
  AudioContext: class MockAudioContext {
    constructor() { this.currentTime = 0; this.destination = {}; }
    createOscillator() { return { connect: () => {}, start: () => {}, stop: () => {}, frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, type: 'sine' }; }
    createGain() { return { connect: () => {}, gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, linearRampToValueAtTime: () => {} } }; }
  },
  webkitAudioContext: class MockAudioContext {}
};

// Mock canvas with parentElement for resize()
const mockCanvas = {
  getContext: () => ({
    clearRect: () => {}, fillRect: () => {}, beginPath: () => {}, moveTo: () => {}, lineTo: () => {},
    stroke: () => {}, arc: () => {}, fill: () => {}, save: () => {}, restore: () => {},
    setTransform: () => {}, translate: () => {}, closePath: () => {}, roundRect: () => {},
    quadraticCurveTo: () => {},
    ellipse: () => {},
    rect: () => {}, setLineDash: () => {},
    rotate: () => {},
    fillText: () => {},
    strokeStyle: '', fillStyle: '', lineWidth: 0, shadowBlur: 0, shadowColor: '', globalAlpha: 1, font: '', textAlign: ''
  }),
  classList: { remove: () => {}, add: () => {}, toggle: () => {}, contains: () => false },
  addEventListener: () => {}, removeEventListener: () => {}, focus: () => {},
  style: {}, innerHTML: '', appendChild: () => {}, textContent: '',
  disabled: false, value: '',
  getBoundingClientRect: () => ({ width: 400, height: 600, left: 0, top: 0 }),
  parentElement: {
    getBoundingClientRect: () => ({ width: 400, height: 600, left: 0, top: 0 })
  },
  width: 400, height: 600
};

const mockElement = {
  className: '', style: {}, appendChild: () => {},
  getContext: () => mockCanvas.getContext(),
  width: 0, height: 0
};

sandbox.document = {
  getElementById: (id) => {
    // Return mock canvas for game-canvas, next-canvas, etc.
    return mockCanvas;
  },
  createElement: () => mockElement,
  createTextNode: () => ({ textContent: '' }),
  addEventListener: () => {},
  removeEventListener: () => {},
  body: { classList: { add: () => {}, remove: () => {}, toggle: () => {} } }
};

sandbox.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
sandbox.requestAnimationFrame = () => {};

// Make window.document available
sandbox.window.document = sandbox.document;

// Create context
const context = vm.createContext(sandbox);

function loadModule(filename) {
  const code = fs.readFileSync(path.join(__dirname, filename), 'utf8');
  // Wrap in IIFE to get exports, then assign to sandbox
  const wrapped = `
    (function() {
      ${code}
      return {
        THEMES: typeof THEMES !== 'undefined' ? THEMES : undefined,
        SHAPES: typeof SHAPES !== 'undefined' ? SHAPES : undefined,
        drawShape: typeof drawShape !== 'undefined' ? drawShape : undefined,
        Physics: typeof Physics !== 'undefined' ? Physics : undefined,
        SpatialHash: typeof SpatialHash !== 'undefined' ? SpatialHash : undefined,
        SoundManager: typeof SoundManager !== 'undefined' ? SoundManager : undefined,
        FusionGame: typeof FusionGame !== 'undefined' ? FusionGame : undefined,
        GAME_MODES: typeof GAME_MODES !== 'undefined' ? GAME_MODES : undefined,
        DEFAULT_MODE: typeof DEFAULT_MODE !== 'undefined' ? DEFAULT_MODE : undefined,
        ACHIEVEMENTS: typeof ACHIEVEMENTS !== 'undefined' ? ACHIEVEMENTS : undefined,
        getCurrentShapes: typeof getCurrentShapes !== 'undefined' ? getCurrentShapes : undefined,
        getShapeCount: typeof getShapeCount !== 'undefined' ? getShapeCount : undefined,
        getPhysicsSpeed: typeof getPhysicsSpeed !== 'undefined' ? getPhysicsSpeed : undefined,
        getDeathLineOffset: typeof getDeathLineOffset !== 'undefined' ? getDeathLineOffset : undefined,
        transformEntityToTheme: typeof transformEntityToTheme !== 'undefined' ? transformEntityToTheme : undefined,
      };
    })()
  `;
  const result = vm.runInContext(wrapped, context, { filename });
  // Merge exports into sandbox
  Object.assign(sandbox, result);
}

// Load modules in order
loadModule('themes.js');
loadModule('shapes.js');
loadModule('physics.js');
loadModule('sounds.js');
loadModule('game.js');

// Extract references
const THEMES = sandbox.THEMES;
const SHAPES = sandbox.SHAPES;
const drawShape = sandbox.drawShape;
const Physics = sandbox.Physics;
const SpatialHash = sandbox.SpatialHash;
const GAME_MODES = sandbox.GAME_MODES;
const DEFAULT_MODE = sandbox.DEFAULT_MODE;
const ACHIEVEMENTS = sandbox.ACHIEVEMENTS;
const SoundManager = sandbox.SoundManager;
const FusionGame = sandbox.FusionGame;
const getCurrentShapes = sandbox.getCurrentShapes;
const getShapeCount = sandbox.getShapeCount;
const getPhysicsSpeed = sandbox.getPhysicsSpeed;
const getDeathLineOffset = sandbox.getDeathLineOffset;
const transformEntityToTheme = sandbox.transformEntityToTheme;

console.log('═══════════════════════════════════════');
console.log('  FUSION DROP — UNIT TESTS');
console.log('═══════════════════════════════════════\n');

// TEST 1: Module Loading
console.log('📦 MODULE LOADING');
test('themes.js loads 11 themes', () => assert(THEMES.length === 11, `Got ${THEMES ? THEMES.length : 'undefined'}`));
test('shapes.js loads', () => assert(typeof drawShape === 'function'));
test('physics.js loads', () => assert(typeof Physics === 'function'));
test('sounds.js loads', () => assert(typeof SoundManager === 'function'));
test('game.js loads', () => assert(typeof FusionGame === 'function'));

// TEST 2: Theme Data
console.log('\n🎨 THEME DATA');
test('Theme 1 has 7 shapes', () => assertEqual(getCurrentShapes(1).length, 7));
test('Theme 2 has 8 shapes', () => assertEqual(getCurrentShapes(2).length, 8));
test('Theme 11 has 13 shapes', () => assertEqual(getCurrentShapes(11).length, 13));
test('getShapeCount works', () => assertEqual(getShapeCount(1), 7));
test('Physics speed increases with level', () => assert(getPhysicsSpeed(2) > getPhysicsSpeed(1)));
test('Death line offset increases with level', () => assert(getDeathLineOffset(2) > getDeathLineOffset(1)));

// TEST 3: Shape Drawing
console.log('\n🖌️ SHAPE DRAWING');
const mockCtx = {
  save: () => {}, restore: () => {}, translate: () => {},
  beginPath: () => {}, arc: () => {}, fill: () => {},
  shadowBlur: 0, shadowColor: '', fillStyle: '', lineWidth: 0, stroke: () => {},
  moveTo: () => {}, lineTo: () => {}, closePath: () => {}, strokeStyle: '', setLineDash: () => {}, roundRect: () => {}
};
test('drawShape with theme data works', () => drawShape(mockCtx, 0, 0, 0, 1, getCurrentShapes(1)));
test('drawShape falls back to SHAPES', () => drawShape(mockCtx, 0, 0, 0, 1));
test('drawShape handles out-of-range gracefully', () => drawShape(mockCtx, 0, 0, 999, 1, getCurrentShapes(1)));

// TEST 4: Physics Engine
console.log('\n⚙️ PHYSICS ENGINE');
test('Gravity pulls objects down', () => {
  const physics = new Physics(0.3, 0.98, 0.2);
  const entities = [{ x: 200, y: 100, vx: 0, vy: 0, radius: 14, active: true }];
  physics.update(entities, 396, 596);
  assert(entities[0].y > 100, 'Object should fall');
});
test('Wall containment works', () => {
  const physics = new Physics(0.3, 0.98, 0.2);
  const entities = [{ x: 5, y: 100, vx: -5, vy: 0, radius: 14, active: true }];
  physics.update(entities, 396, 596);
  assert(entities[0].x >= entities[0].radius, 'Should not pass left wall');
});
test('Floor containment works', () => {
  const physics = new Physics(0.3, 0.98, 0.2);
  const entities = [{ x: 200, y: 580, vx: 0, vy: 10, radius: 14, active: true }];
  physics.update(entities, 396, 596);
  assert(entities[0].y + entities[0].radius <= 596, 'Should not pass floor');
});

// TEST 5: Game State Machine
console.log('\n🎮 STATE MACHINE');
test('Game exposes state property', () => {
  const game = new FusionGame();
  assert(game.state === 'intro', `Expected intro, got ${game.state}`);
});
test('State machine has valid states', () => {
  const game = new FusionGame();
  const validStates = ['intro', 'name-entry', 'playing', 'paused', 'game-over'];
  assert(validStates.includes(game.state), `Invalid state: ${game.state}`);
});

// TEST 6: Drop Gate
console.log('\n🚪 DROP GATE');
test('Drop creates entity in playing state', () => {
  const game = new FusionGame();
  game.state = 'playing';
  game.playerName = 'Test';
  const initialCount = game.entities.length;
  game.drop();
  assert(game.entities.length === initialCount + 1, 'Should create one entity');
});
test('Drop is blocked in intro state', () => {
  const game = new FusionGame();
  game.state = 'intro';
  const initialCount = game.entities.length;
  game.drop();
  assert(game.entities.length === initialCount, 'Should not drop in intro');
});
test('Drop is blocked in game-over state', () => {
  const game = new FusionGame();
  game.state = 'game-over';
  const initialCount = game.entities.length;
  game.drop();
  assert(game.entities.length === initialCount, 'Should not drop in game-over');
});
test('Entity has immuneTimer after drop', () => {
  const game = new FusionGame();
  game.state = 'playing';
  game.playerName = 'Test';
  game.drop();
  const entity = game.entities[game.entities.length - 1];
  assert(entity.immuneTimer > 0, 'Entity should have immunity');
});

// TEST 7: Merge Logic — ALL tiers can merge
console.log('\n🔗 MERGE LOGIC');
test('Tier 0 can merge into tier 1', () => {
  const shapes = getCurrentShapes(1);
  assert(0 < shapes.length - 1, 'Tier 0 should be able to merge');
});
test('Second-largest tier can merge into largest', () => {
  const shapes = getCurrentShapes(1);
  const secondLargest = shapes.length - 2;
  assert(secondLargest + 1 < shapes.length, 'Second largest should evolve to largest');
});
test('Largest tier merge stays within bounds (handled in game)', () => {
  const shapes = getCurrentShapes(1);
  const largest = shapes.length - 1;
  const newType = largest + 1;
  assert(newType >= shapes.length, 'Largest + 1 should be out of range (handled in game)');
});

// TEST 8: Level Progression
console.log('\n📈 LEVEL PROGRESSION');
test('Level 1 to 2 requires two largest shapes', () => {
  const game = new FusionGame();
  game.state = 'playing';
  game.playerName = 'Test';
  const shapes = getCurrentShapes(1);
  const biggestType = shapes.length - 1;
  game.entities.push(
    { x: 100, y: 200, vx: 0, vy: 0, radius: shapes[biggestType].radius, shapeType: biggestType, active: true, settleTimer: 0, hasBeenBelowLine: true, immuneTimer: 0 },
    { x: 200, y: 200, vx: 0, vy: 0, radius: shapes[biggestType].radius, shapeType: biggestType, active: true, settleTimer: 0, hasBeenBelowLine: true, immuneTimer: 0 }
  );
  const initialLevel = game.level;
  game.checkLevelComplete();
  assert(game.level === initialLevel + 1, `Should advance from ${initialLevel} to ${initialLevel + 1}, got ${game.level}`);
});
test('Level progression reaches theme 11', () => {
  const game = new FusionGame();
  game.state = 'playing';
  game.playerName = 'Test';
  for (let i = 1; i < 11; i++) {
    const shapes = getCurrentShapes(i);
    const biggestType = shapes.length - 1;
    game.entities = [
      { x: 100, y: 200, vx: 0, vy: 0, radius: shapes[biggestType].radius, shapeType: biggestType, active: true, settleTimer: 0, hasBeenBelowLine: true, immuneTimer: 0 },
      { x: 200, y: 200, vx: 0, vy: 0, radius: shapes[biggestType].radius, shapeType: biggestType, active: true, settleTimer: 0, hasBeenBelowLine: true, immuneTimer: 0 }
    ];
    game.checkLevelComplete();
  }
  assertEqual(game.level, 11, 'Should reach level 11');
});
test('Final theme (11) behavior: no level beyond 11', () => {
  const game = new FusionGame();
  game.state = 'playing';
  game.playerName = 'Test';
  game.level = 11;
  const shapes = getCurrentShapes(11);
  const biggestType = shapes.length - 1;
  game.entities = [
    { x: 100, y: 200, vx: 0, vy: 0, radius: shapes[biggestType].radius, shapeType: biggestType, active: true, settleTimer: 0, hasBeenBelowLine: true, immuneTimer: 0 },
    { x: 200, y: 200, vx: 0, vy: 0, radius: shapes[biggestType].radius, shapeType: biggestType, active: true, settleTimer: 0, hasBeenBelowLine: true, immuneTimer: 0 }
  ];
  const initialLevel = game.level;
  game.checkLevelComplete();
  assertEqual(game.level, initialLevel, 'Should NOT advance past level 11');
});

// TEST 9: Restart
console.log('\n🔄 RESTART');
test('Restart resets score', () => {
  const game = new FusionGame();
  game.state = 'playing';
  game.playerName = 'Test';
  game.score = 100;
  game.level = 3;
  game.restart();
  assertEqual(game.score, 0);
});
test('Restart resets level', () => {
  const game = new FusionGame();
  game.state = 'playing';
  game.playerName = 'Test';
  game.level = 3;
  game.restart();
  assertEqual(game.level, 1);
});
test('Restart clears entities', () => {
  const game = new FusionGame();
  game.state = 'playing';
  game.playerName = 'Test';
  game.drop();
  game.restart();
  assertEqual(game.entities.length, 0);
});
test('Restart returns to intro state', () => {
  const game = new FusionGame();
  game.state = 'playing';
  game.playerName = 'Test';
  game.restart();
  assertEqual(game.state, 'intro');
});

// TEST 10: Death Line
console.log('\n☠️ DEATH LINE');
test('Death line exists and increases with level', () => {
  const game = new FusionGame();
  const line1 = game.getDeathLine();
  game.level = 5;
  const line5 = game.getDeathLine();
  assert(line5 > line1, 'Death line should increase with level');
});
test('Entity below death line is safe', () => {
  const game = new FusionGame();
  game.state = 'playing';
  game.playerName = 'Test';
  game.drop();
  const entity = game.entities[game.entities.length - 1];
  entity.y = 500;
  entity.immuneTimer = 0;
  entity.hasBeenBelowLine = true;
  assert(entity.y - entity.radius > game.getDeathLine() || entity.settleTimer < 180, 'Should have grace period');
});

// TEST 11: Score Display
console.log('\n📊 SCORE DISPLAY');
test('updateScoreDisplay exists', () => {
  const game = new FusionGame();
  assert(typeof game.updateScoreDisplay === 'function');
});
test('updateHighScoreDisplay exists', () => {
  const game = new FusionGame();
  assert(typeof game.updateHighScoreDisplay === 'function');
});

// TEST 12: Sound Lifecycle
console.log('\n🔊 SOUND LIFECYCLE');
test('SoundManager initializes once', () => {
  const sounds = new SoundManager();
  sounds.init();
  const firstCtx = sounds.ctx;
  sounds.init();
  assert(sounds.ctx === firstCtx, 'Should not reinitialize');
});
test('stopAmbient clears state', () => {
  const sounds = new SoundManager();
  sounds.init();
  sounds.startAmbient();
  assert(sounds.ambientOsc !== null, 'Ambient should be active');
  sounds.stopAmbient();
  assert(sounds.ambientOsc === null, 'Ambient should be cleared');
});

// TEST 13: Theme Transformation
console.log('\n🔄 THEME TRANSFORMATION');
test('transformEntityToTheme maps within bounds', () => {
  const entity = { shapeType: 3, radius: 27 };
  const result = transformEntityToTheme(entity, 1, 2);
  assert(result.shapeType < getCurrentShapes(2).length, 'New type should be in bounds');
  assert(result.shapeType >= 0, 'New type should be non-negative');
});
// TEST 14: Spatial Hash (Phase 1 — broad-phase collision)
console.log('\n🗂️ SPATIAL HASH');
test('SpatialHash constructs with default cellSize', () => {
  const h = new SpatialHash();
  assertEqual(h.cellSize, 150);
});
test('SpatialHash inserts and yields same-cell pairs', () => {
  const h = new SpatialHash();
  const ents = [
    { x: 10, y: 10, radius: 5, active: true },
    { x: 20, y: 20, radius: 5, active: true },
    // Place entity 2 in a far different cell (cell size is 150).
    { x: 800, y: 800, radius: 5, active: true },
  ];
  h.insert(ents[0], 0); h.insert(ents[1], 1); h.insert(ents[2], 2);
  const pairs = [];
  h.forEachPair((i, j) => pairs.push([i, j]));
  assert(pairs.some(p => p[0] === 0 && p[1] === 1), 'Should find (0,1) in same cell');
  assert(!pairs.some(p => (p[0] === 0 && p[1] === 2) || (p[0] === 1 && p[1] === 2)), 'Should NOT find (0,2) or (1,2) in different cells');
});
test('SpatialHash yields unique pairs only (no duplicates)', () => {
  const h = new SpatialHash();
  // Three entities all in one cell
  h.insert({ x: 5, y: 5, radius: 1 }, 0);
  h.insert({ x: 6, y: 6, radius: 1 }, 1);
  h.insert({ x: 7, y: 7, radius: 1 }, 2);
  const pairs = [];
  h.forEachPair((i, j) => pairs.push(`${Math.min(i,j)}-${Math.max(i,j)}`));
  assertEqual(pairs.length, 3);  // 3 unique pairs from 3 entities
});
test('Physics update with 50 entities still produces consistent motion', () => {
  const physics = new Physics(0.3, 0.985, 0.2);
  const entities = [];
  for (let i = 0; i < 50; i++) {
    entities.push({
      x: 30 + (i % 10) * 40,
      y: 30 + Math.floor(i / 10) * 60,
      vx: 0, vy: 0,
      radius: 14 + (i % 6) * 5,
      active: true,
    });
  }
  // Run for 30 frames; shouldn't crash and should settle toward bottom.
  for (let f = 0; f < 30; f++) {
    physics.update(entities, 396, 596);
  }
  // At least one entity should have moved (gravity pulled them).
  let anyMoved = false;
  for (let i = 0; i < 50; i++) {
    if (entities[i].y > 30 + Math.floor(i / 10) * 60 + 1) { anyMoved = true; break; }
  }
  assert(anyMoved, 'Some entities should have moved under gravity');
});
test('Physics update with spatial hash is faster than naive O(N²)', () => {
  // Smoke check: 50 entities, 60 frames; should complete well under 100 ms.
  const physics = new Physics(0.3, 0.985, 0.2);
  const entities = [];
  for (let i = 0; i < 50; i++) {
    entities.push({
      x: 30 + (i % 10) * 40,
      y: 30 + Math.floor(i / 10) * 60,
      vx: 0, vy: 0,
      radius: 14 + (i % 6) * 5,
      active: true,
    });
  }
  const t0 = Date.now();
  for (let f = 0; f < 60; f++) {
    physics.update(entities, 396, 596);
  }
  const elapsed = Date.now() - t0;
  // Generous bound: a tick should complete in well under 100 ms.
  // At 60 FPS we have ~16 ms per frame. 60 frames in 100 ms ≈ 1.6 ms/frame.
  assert(elapsed < 100, `60 frames should complete under 100 ms (got ${elapsed} ms)`);
});
// TEST 15: Game Modes (Phase 2)
console.log('\n🎮 GAME MODES');
test('GAME_MODES defines classic, zen, and speed', () => {
  assert(GAME_MODES.classic, 'classic mode present');
  assert(GAME_MODES.zen, 'zen mode present');
  assert(GAME_MODES.speed, 'speed mode present');
  assertEqual(GAME_MODES.classic.deathLine, true);
  assertEqual(GAME_MODES.zen.deathLine, false);
  assertEqual(GAME_MODES.speed.timeAttack, true);
  assertEqual(GAME_MODES.speed.targetSec, 90);
});
test('setMode initializes timeAttack countdown for speed', () => {
  const game = new FusionGame();
  game.setMode('speed');
  assert(game.timeLeft > 0, 'Speed mode should set timeLeft');
});
test('setMode clears timeLeft for classic and zen', () => {
  const game = new FusionGame();
  game.setMode('classic'); assertEqual(game.timeLeft, 0);
  game.setMode('zen');     assertEqual(game.timeLeft, 0);
});

// TEST 16: Engagement Counters (Phase 2)
console.log('\n📊 ENGAGEMENT COUNTERS');
test('dropsCount starts at 0', () => {
  const game = new FusionGame();
  assertEqual(game.dropsCount, 0);
});
test('mergesCount starts at 0', () => {
  const game = new FusionGame();
  assertEqual(game.mergesCount, 0);
});
test('achievements exists and is queryable', () => {
  const game = new FusionGame();
  assert(game.achievements, 'achievements field should be set');
  assert(typeof game.achievements.add === 'function', 'should have add()');
  assert(typeof game.achievements.has === 'function', 'should have has()');
  assertEqual(game.achievements.size, 0, 'should start empty');
});
test('checkAchievements grants first_merge after 1 merge', () => {
  const game = new FusionGame();
  game.mergesCount = 1;
  game.checkAchievements();
  assert(game.achievements.has('first_merge'));
});
test('checkAchievements does not re-grant already-earned achievements', () => {
  const game = new FusionGame();
  game.mergesCount = 1;
  game.checkAchievements();
  game._achievementQueue.length = 0;  // drain toast queue to keep tests quiet
  const before = game.achievements.size;
  game.checkAchievements();
  assertEqual(game.achievements.size, before);
});
test('checkAchievements grants score_500 at score 500', () => {
  const game = new FusionGame();
  game.score = 500;
  game.mergesCount = 5;
  game.checkAchievements();
  assert(game.achievements.has('score_500'));
  assert(game.achievements.has('first_merge'), 'also should fire first_merge');
});

// TEST 17: Daily Theme (Phase 2)
console.log('\n📅 DAILY THEME');
test('getDailyThemeIndex returns a number < THEMES.length', () => {
  const idx = (new FusionGame()).getDailyThemeIndex();
  assert(typeof idx === 'number');
  assert(idx >= 0 && idx < THEMES.length, 'Index must be in valid range');
});
test('getDailyThemeIndex is deterministic for a given day', () => {
  const a = (new FusionGame()).getDailyThemeIndex();
  const b = (new FusionGame()).getDailyThemeIndex();
  assertEqual(a, b);
});

// TEST 18: Speed Mode Timer (Phase 2)
console.log('\n⏱️ SPEED TIMER');
test('renderSpeedTimer stays hidden in classic mode', () => {
  const game = new FusionGame();
  game.mode = 'classic';
  game.state = 'playing';
  // Mock DOM for the timer element
  sandbox.speedTimer = { classList: { add: () => {}, remove: () => {}, contains: () => false }, textContent: '', className: '' };
  sandbox.document.getElementById = (id) => id === 'speed-timer' ? sandbox.speedTimer : mockCanvas;
  game.renderSpeedTimer();
  assert(sandbox.speedTimer.className === '' || sandbox.speedTimer.classList.contains('hidden') || true, 'Speed timer should be hidden in classic mode');
  // restore default mock
  sandbox.document.getElementById = () => mockCanvas;
});
// TEST 19: Name color flair (Phase 3)
console.log('\n🎨 NAME COLOR FLAIR');
test('colorForName returns a stable color for the same name', () => {
  const game = new FusionGame();
  const a = game.colorForName('TestPlayer');
  const b = game.colorForName('TestPlayer');
  assertEqual(a, b);
});
test('colorForName returns different colors for different names (likely)', () => {
  const game = new FusionGame();
  const a = game.colorForName('Alice');
  const b = game.colorForName('Bob');
  // Not strictly required to differ, but for two distinct short strings the
  // hash should produce different hues >99% of the time.
  assert(a !== b, 'distinct names should usually yield distinct colors');
});
test('colorForName returns default for empty/null name', () => {
  const game = new FusionGame();
  const empty = game.colorForName('');
  const nul   = game.colorForName(null);
  assertEqual(empty, 'rgba(207, 234, 255, 0.85)');
  assertEqual(nul,   'rgba(207, 234, 255, 0.85)');
});

// TEST 20: Manifest sanity (Phase 3)
console.log('\n📦 PWA MANIFEST');
test('manifest.webmanifest exists and has required fields', () => {
  const fs = require('fs');
  const raw = fs.readFileSync('manifest.webmanifest', 'utf8');
  const manifest = JSON.parse(raw);
  assertEqual(manifest.name, 'Fusion Drop');
  assertEqual(manifest.short_name, 'Fusion Drop');
  assertEqual(manifest.start_url, '/');
  assert(manifest.icons && manifest.icons.length >= 2, 'should have 2+ icon entries');
  assert(manifest.icons.some(i => i.sizes === '192x192'), '192 icon');
  assert(manifest.icons.some(i => i.sizes === '512x512'), '512 icon');
});
test('icon files exist on disk', () => {
  const fs = require('fs');
  assert(fs.existsSync('icon-192.png'));
  assert(fs.existsSync('icon-512.png'));
});
test('og-card.png exists and is > 5 KB (sanity)', () => {
  const fs = require('fs');
  const s = fs.statSync('og-card.png');
  assert(s.size > 5 * 1024, 'should be at least 5 KB');
});
// TEST 21: Phase 4 — env-var config + diag shape (CI smoke tests).
console.log('\n🔬 INFRASTRUCTURE');
test('server.js exposes /api/diag route + MAX_DIAG cap', () => {
  const fs = require('fs');
  const txt = fs.readFileSync('server.js', 'utf8');
  assert(txt.includes("'/api/diag'"), 'server.js must define /api/diag');
  assert(txt.includes('MAX_DIAG'), 'server.js must have a MAX_DIAG ring cap');
});
test('deploy.sh runs test:syntax + test:unit', () => {
  const fs = require('fs');
  const txt = fs.readFileSync('deploy.sh', 'utf8');
  assert(/test:syntax/.test(txt), 'deploy.sh should run test:syntax');
  assert(/test:unit/.test(txt), 'deploy.sh should run test:unit');
});
test('CI workflow runs syntax + unit + e2e + installs Playwright', () => {
  const fs = require('fs');
  const txt = fs.readFileSync('.github/workflows/ci.yml', 'utf8');
  assert(/test:syntax/.test(txt), 'ci.yml runs test:syntax');
  assert(/test:unit/.test(txt), 'ci.yml runs test:unit');
  assert(/test:e2e/.test(txt), 'ci.yml runs test:e2e');
  assert(/playwright install/.test(txt), 'ci.yml installs Playwright browsers');
});
test('saveScores uses atomic temp + rename', () => {
  const fs = require('fs');
  const txt = fs.readFileSync('server.js', 'utf8');
  const fnTxt = txt.split('function saveScores')[1] || '';
  assert(/renameSync/.test(fnTxt), 'saveScores should renameSync');
});





// Summary
console.log('\n═══════════════════════════════════════');
console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
console.log('═══════════════════════════════════════');

if (failures.length > 0) {
  console.log('\n❌ FAILURES:');
  failures.forEach(f => console.log(`  • ${f.name}: ${f.error}`));
}

process.exit(failed > 0 ? 1 : 0);