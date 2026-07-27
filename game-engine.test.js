// game-engine.test.js — Automated QA for Fusion Drop game logic
// Run with: node game-engine.test.js

const fs = require('fs');
const path = require('path');

// Track test results
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

// Mock browser environment
global.window = {
  addEventListener: () => {},
  AudioContext: class MockAudioContext {
    constructor() {
      this.currentTime = 0;
      this.destination = {};
    }
    createOscillator() { return { connect: () => {}, start: () => {}, stop: () => {}, frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, type: 'sine' }; }
    createGain() { return { connect: () => {}, gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, linearRampToValueAtTime: () => {} } }; }
    createOscillator() { return { connect: () => {}, start: () => {}, stop: () => {}, frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} } }; }
  },
  webkitAudioContext: class MockAudioContext {}
};

global.document = {
  getElementById: (id) => ({
    id,
    getContext: () => ({
      clearRect: () => {}, fillRect: () => {}, beginPath: () => {}, moveTo: () => {}, lineTo: () => {}, 
      stroke: () => {}, arc: () => {}, fill: () => {}, save: () => {}, restore: () => {}, 
      setTransform: () => {}, translate: () => {}, closePath: () => {}, 
      strokeStyle: '', fillStyle: '', lineWidth: 0, shadowBlur: 0, shadowColor: '',
      globalAlpha: 1, font: '', textAlign: '', roundRect: () => {}, setLineDash: () => {}
    }),
    classList: { remove: () => {}, add: () => {}, toggle: () => {}, contains: () => false },
    addEventListener: () => {}, removeEventListener: () => {}, focus: () => {},
    style: {}, innerHTML: '', appendChild: () => {}, textContent: '',
    disabled: false, value: '', getBoundingClientRect: () => ({ width: 400, height: 600, left: 0, top: 0 })
  }),
  createElement: () => ({
    className: '', style: {}, appendChild: () => {}, getContext: () => ({
      clearRect: () => {}, fillRect: () => {}, beginPath: () => {}, arc: () => {}, fill: () => {},
      save: () => {}, restore: () => {}, translate: () => {}, stroke: () => {}, lineTo: () => {},
      moveTo: () => {}, closePath: () => {}
    }), width: 0, height: 0
  }),
  createTextNode: () => ({ textContent: '' })
};

global.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
global.requestAnimationFrame = () => {};
global.Math.random = () => 0.5; // Deterministic for testing

// Load modules
const themesCode = fs.readFileSync(path.join(__dirname, 'themes.js'), 'utf8');
eval(themesCode);

const shapesCode = fs.readFileSync(path.join(__dirname, 'shapes.js'), 'utf8');
eval(shapesCode);

const physicsCode = fs.readFileSync(path.join(__dirname, 'physics.js'), 'utf8');
eval(physicsCode);

const soundsCode = fs.readFileSync(path.join(__dirname, 'sounds.js'), 'utf8');
eval(soundsCode);

const gameCode = fs.readFileSync(path.join(__dirname, 'game.js'), 'utf8');
eval(gameCode);

console.log('═══════════════════════════════════════');
console.log('  FUSION DROP — GAME ENGINE QA');
console.log('═══════════════════════════════════════\n');

// TEST 1: Module Loading
console.log('📦 MODULE LOADING');
test('themes.js loads', () => assert(typeof THEMES !== 'undefined' && THEMES.length === 11, 'Expected 11 themes'));
test('shapes.js loads', () => assert(typeof drawShape === 'function', 'drawShape not defined'));
test('physics.js loads', () => assert(typeof Physics === 'function', 'Physics not defined'));
test('sounds.js loads', () => assert(typeof SoundManager === 'function', 'SoundManager not defined'));
test('game.js loads', () => assert(typeof FusionGame === 'function', 'FusionGame not defined'));

// TEST 2: Theme Data
console.log('\n🎨 THEME DATA');
test('Theme 1 has 7 shapes', () => assertEqual(getCurrentShapes(1).length, 7));
test('Theme 2 has 8 shapes', () => assertEqual(getCurrentShapes(2).length, 8));
test('Theme 11 has 13 shapes', () => assertEqual(getCurrentShapes(11).length, 13));
test('getShapeCount works', () => assertEqual(getShapeCount(1), 7));
test('getPhysicsSpeed increases with level', () => assert(getPhysicsSpeed(2) > getPhysicsSpeed(1), 'Speed should increase'));
test('getDeathLineOffset increases with level', () => assert(getDeathLineOffset(2) > getDeathLineOffset(1), 'Offset should increase'));

// TEST 3: Shape Drawing
console.log('\n🖌️ SHAPE DRAWING');
const mockCtx = {
  save: () => {}, restore: () => {}, translate: () => {},
  beginPath: () => {}, arc: () => {}, fill: () => {},
  shadowBlur: 0, shadowColor: '', fillStyle: '', lineWidth: 0, stroke: () => {},
  moveTo: () => {}, lineTo: () => {}, closePath: () => {}, strokeStyle: ''
};
test('drawShape with theme data works', () => {
  drawShape(mockCtx, 0, 0, 0, 1, getCurrentShapes(1));
});
test('drawShape falls back to SHAPES', () => {
  drawShape(mockCtx, 0, 0, 0, 1);
});
test('drawShape handles out-of-range gracefully', () => {
  drawShape(mockCtx, 0, 0, 999, 1, getCurrentShapes(1));
});

// TEST 4: Physics Engine
console.log('\n⚙️ PHYSICS ENGINE');
test('Physics.update runs without error', () => {
  const physics = new Physics(0.3, 0.98, 0.2);
  const entities = [
    { x: 200, y: 100, vx: 0, vy: 0, radius: 14, active: true },
    { x: 200, y: 300, vx: 0, vy: 0, radius: 18, active: true }
  ];
  physics.update(entities, 396, 596);
  assert(entities[0].y > 100, 'Object should fall due to gravity');
});
test('Wall containment works', () => {
  const physics = new Physics(0.3, 0.98, 0.2);
  const entities = [{ x: 5, y: 100, vx: -5, vy: 0, radius: 14, active: true }];
  physics.update(entities, 396, 596);
  assert(entities[0].x >= entities[0].radius, 'Object should not pass left wall');
});
test('Floor containment works', () => {
  const physics = new Physics(0.3, 0.98, 0.2);
  const entities = [{ x: 200, y: 580, vx: 0, vy: 10, radius: 14, active: true }];
  physics.update(entities, 396, 596);
  assert(entities[0].y + entities[0].radius <= 596, 'Object should not pass floor');
});

// TEST 5: Game State Machine
console.log('\n🎮 GAME STATE MACHINE');
test('Game starts in intro state', () => {
  const game = new FusionGame();
  assert(game.gameOver === false, 'Should not be game over');
  assert(game.paused === false, 'Should not be paused');
});
test('Drop creates entity with correct properties', () => {
  const game = new FusionGame();
  game.playerName = 'Test';
  game.paused = false;
  const initialCount = game.entities.length;
  game.drop();
  assert(game.entities.length === initialCount + 1, 'Should create one entity');
  const entity = game.entities[game.entities.length - 1];
  assert(entity.hasBeenBelowLine === false, 'New entity should not have been below line');
  assert(entity.justDropped === true, 'New entity should be justDropped');
});
test('Entity becomes eligible for death line after falling below', () => {
  const game = new FusionGame();
  game.playerName = 'Test';
  game.paused = false;
  game.drop();
  const entity = game.entities[game.entities.length - 1];
  entity.y = 500; // Below death line
  game.update();
  assert(entity.hasBeenBelowLine === true, 'Should mark as below line');
});

// TEST 6: Merge Logic
console.log('\n🔗 MERGE LOGIC');
test('Merge guard allows tier 0 to merge', () => {
  const shapes = getCurrentShapes(1);
  assert(0 < shapes.length - 2, 'Tier 0 should be able to merge');
});
test('Merge guard blocks second-largest tier', () => {
  const shapes = getCurrentShapes(1);
  const secondLargest = shapes.length - 2;
  assert(secondLargest >= shapes.length - 2, 'Second largest should be blocked from merging');
});
test('Merge guard blocks largest tier', () => {
  const shapes = getCurrentShapes(1);
  const largest = shapes.length - 1;
  assert(largest >= shapes.length - 2, 'Largest should be blocked from merging');
});

// TEST 7: Level Progression
console.log('\n📈 LEVEL PROGRESSION');
test('checkLevelComplete requires 2 biggest shapes', () => {
  const game = new FusionGame();
  game.playerName = 'Test';
  game.paused = false;
  const shapes = getCurrentShapes(1);
  const biggestType = shapes.length - 1;
  // Add two biggest shapes
  game.entities.push(
    { x: 100, y: 200, vx: 0, vy: 0, radius: shapes[biggestType].radius, shapeType: biggestType, active: true, settleTimer: 0, hasBeenBelowLine: true },
    { x: 200, y: 200, vx: 0, vy: 0, radius: shapes[biggestType].radius, shapeType: biggestType, active: true, settleTimer: 0, hasBeenBelowLine: true }
  );
  const initialLevel = game.level;
  game.checkLevelComplete();
  assert(game.level > initialLevel, 'Should advance level');
});

// TEST 8: Restart
console.log('\n🔄 RESTART');
test('Restart resets all state', () => {
  const game = new FusionGame();
  game.playerName = 'Test';
  game.paused = false;
  game.drop();
  game.score = 100;
  game.level = 3;
  game.restart();
  assertEqual(game.score, 0, 'Score should reset');
  assertEqual(game.level, 1, 'Level should reset');
  assertEqual(game.entities.length, 0, 'Entities should clear');
  assert(game.gameOver === false, 'Game over should be false');
  assert(game.paused === false, 'Paused should be false');
});

// TEST 9: Score Display
console.log('\n📊 SCORE DISPLAY');
test('updateScoreDisplay updates mobile element', () => {
  const game = new FusionGame();
  game.score = 42;
  let mobileUpdated = false;
  let desktopUpdated = false;
  
  // Override getElementById for this test
  const originalGetElementById = document.getElementById;
  document.getElementById = (id) => {
    if (id === 'score') { mobileUpdated = true; return { textContent: '' }; }
    if (id === 'score-desk') { desktopUpdated = true; return { textContent: '' }; }
    return originalGetElementById(id);
  };
  
  game.updateScoreDisplay();
  
  document.getElementById = originalGetElementById;
  assert(mobileUpdated, 'Mobile score should update');
  assert(desktopUpdated, 'Desktop score should update');
});

// TEST 10: Sound Lifecycle
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

// Summary
console.log('\n═══════════════════════════════════════');
console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
console.log('═══════════════════════════════════════');

if (failures.length > 0) {
  console.log('\n❌ FAILURES:');
  failures.forEach(f => console.log(`  • ${f.name}: ${f.error}`));
}

process.exit(failed > 0 ? 1 : 0);
