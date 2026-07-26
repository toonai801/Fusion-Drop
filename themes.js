const THEMES = [
  {
    id: 'fusion',
    name: 'Fusion',
    color: '#00d4ff',
    shapes: [
      { name: 'spark',       radius: 14, color: '#00d4ff', glow: '#00f0ff', score: 2 },
      { name: 'ember',       radius: 18, color: '#0099cc', glow: '#00d4ff', score: 4 },
      { name: 'crystal',     radius: 22, color: '#3366ff', glow: '#6699ff', score: 8 },
      { name: 'shard',       radius: 27, color: '#6633cc', glow: '#9966ff', score: 16 },
      { name: 'prism',       radius: 32, color: '#9933ff', glow: '#cc66ff', score: 32 },
      { name: 'nexus',       radius: 37, color: '#cc3399', glow: '#ff66cc', score: 64 },
      { name: 'singularity', radius: 44, color: '#ff0066', glow: '#ff3399', score: 128 },
    ]
  },
  {
    id: 'treasure',
    name: 'Treasure Chest',
    color: '#ffd700',
    shapes: [
      { name: 'copper',   radius: 14, color: '#b87333', glow: '#cd7f32', score: 2 },
      { name: 'silver',   radius: 18, color: '#c0c0c0', glow: '#e8e8e8', score: 4 },
      { name: 'gold',     radius: 22, color: '#ffd700', glow: '#ffec8b', score: 8 },
      { name: 'gem',      radius: 27, color: '#00ced1', glow: '#40e0d0', score: 16 },
      { name: 'ring',     radius: 32, color: '#ff69b4', glow: '#ff1493', score: 32 },
      { name: 'crown',    radius: 37, color: '#daa520', glow: '#ffd700', score: 64 },
      { name: 'chest',    radius: 44, color: '#8b4513', glow: '#a0522d', score: 128 },
      { name: 'hoard',    radius: 52, color: '#ff4500', glow: '#ff6347', score: 256 },
    ]
  },
  {
    id: 'slime',
    name: 'Slime Evolution',
    color: '#32cd32',
    shapes: [
      { name: 'green',    radius: 14, color: '#32cd32', glow: '#7fff00', score: 2 },
      { name: 'blue',     radius: 18, color: '#4169e1', glow: '#87ceeb', score: 4 },
      { name: 'red',      radius: 22, color: '#dc143c', glow: '#ff6b6b', score: 8 },
      { name: 'crystal',  radius: 27, color: '#00ffff', glow: '#e0ffff', score: 16 },
      { name: 'ghost',    radius: 32, color: '#f8f8ff', glow: '#e6e6fa', score: 32 },
      { name: 'king',     radius: 37, color: '#9370db', glow: '#ba55d3', score: 64 },
      { name: 'ancient',  radius: 44, color: '#4b0082', glow: '#8a2be2', score: 128 },
      { name: 'rainbow',  radius: 52, color: '#ff00ff', glow: '#ff69b4', score: 256 },
      { name: 'god',      radius: 60, color: '#ffffff', glow: '#ffd700', score: 512 },
    ]
  },
  {
    id: 'potion',
    name: 'Potion Lab',
    color: '#9932cc',
    shapes: [
      { name: 'herb',     radius: 14, color: '#228b22', glow: '#32cd32', score: 2 },
      { name: 'mushroom', radius: 18, color: '#8b0000', glow: '#cd5c5c', score: 4 },
      { name: 'bottle',   radius: 22, color: '#4682b4', glow: '#87cefa', score: 8 },
      { name: 'potion',   radius: 27, color: '#ff1493', glow: '#ff69b4', score: 16 },
      { name: 'greater',  radius: 32, color: '#ff4500', glow: '#ff6347', score: 32 },
      { name: 'elixir',   radius: 37, color: '#ffd700', glow: '#ffec8b', score: 64 },
      { name: 'philosopher', radius: 44, color: '#ffffff', glow: '#ffd700', score: 128 },
      { name: 'eternity', radius: 52, color: '#00ffff', glow: '#e0ffff', score: 256 },
      { name: 'divine',   radius: 60, color: '#9400d3', glow: '#ba55d3', score: 512 },
      { name: 'omnipotence', radius: 70, color: '#ff00ff', glow: '#ff69b4', score: 1024 },
    ]
  },
  {
    id: 'planet',
    name: 'Planet Builder',
    color: '#4169e1',
    shapes: [
      { name: 'dust',      radius: 14, color: '#696969', glow: '#a9a9a9', score: 2 },
      { name: 'rock',      radius: 18, color: '#8b4513', glow: '#a0522d', score: 4 },
      { name: 'moon',      radius: 22, color: '#c0c0c0', glow: '#d3d3d3', score: 8 },
      { name: 'planet',    radius: 27, color: '#4169e1', glow: '#87ceeb', score: 16 },
      { name: 'gasgiant',  radius: 32, color: '#ff8c00', glow: '#ffa500', score: 32 },
      { name: 'star',      radius: 37, color: '#ffd700', glow: '#ffff00', score: 64 },
      { name: 'neutron',   radius: 44, color: '#00ffff', glow: '#e0ffff', score: 128 },
      { name: 'blackhole', radius: 52, color: '#000000', glow: '#4b0082', score: 256 },
      { name: 'galaxy',    radius: 60, color: '#ff00ff', glow: '#da70d6', score: 512 },
      { name: 'universe',  radius: 70, color: '#ffffff', glow: '#e6e6fa', score: 1024 },
      { name: 'multiverse', radius: 82, color: '#9400d3', glow: '#ba55d3', score: 2048 },
    ]
  },
  {
    id: 'food',
    name: 'Food Truck',
    color: '#ff6347',
    shapes: [
      { name: 'fries',     radius: 14, color: '#ffd700', glow: '#ffec8b', score: 2 },
      { name: 'burger',    radius: 18, color: '#8b4513', glow: '#a0522d', score: 4 },
      { name: 'pizza',     radius: 22, color: '#ff4500', glow: '#ff6347', score: 8 },
      { name: 'taco',      radius: 27, color: '#ffd700', glow: '#ffec8b', score: 16 },
      { name: 'hotdog',    radius: 32, color: '#dc143c', glow: '#ff6b6b', score: 32 },
      { name: 'bbq',       radius: 37, color: '#8b0000', glow: '#cd5c5c', score: 64 },
      { name: 'feast',     radius: 44, color: '#ff8c00', glow: '#ffa500', score: 128 },
      { name: 'banquet',   radius: 52, color: '#ffd700', glow: '#ffff00', score: 256 },
      { name: 'royal',     radius: 60, color: '#9400d3', glow: '#ba55d3', score: 512 },
      { name: 'godmeal',   radius: 70, color: '#ffffff', glow: '#ffd700', score: 1024 },
      { name: 'ambrosia',  radius: 82, color: '#00ffff', glow: '#e0ffff', score: 2048 },
      { name: 'infinity',  radius: 95, color: '#ff00ff', glow: '#ff69b4', score: 4096 },
    ]
  },
  {
    id: 'aquarium',
    name: 'Aquarium',
    color: '#00ced1',
    shapes: [
      { name: 'shrimp',    radius: 14, color: '#ff69b4', glow: '#ffb6c1', score: 2 },
      { name: 'minnow',    radius: 18, color: '#c0c0c0', glow: '#e8e8e8', score: 4 },
      { name: 'goldfish',  radius: 22, color: '#ffd700', glow: '#ffec8b', score: 8 },
      { name: 'clownfish', radius: 27, color: '#ff4500', glow: '#ff6347', score: 16 },
      { name: 'shark',     radius: 32, color: '#708090', glow: '#778899', score: 32 },
      { name: 'whale',     radius: 37, color: '#4682b4', glow: '#87ceeb', score: 64 },
      { name: 'kraken',    radius: 44, color: '#4b0082', glow: '#8a2be2', score: 128 },
      { name: 'leviathan', radius: 52, color: '#00008b', glow: '#0000cd', score: 256 },
      { name: 'poseidon',  radius: 60, color: '#00ffff', glow: '#e0ffff', score: 512 },
      { name: 'ocean',     radius: 70, color: '#000080', glow: '#4169e1', score: 1024 },
      { name: 'abyss',     radius: 82, color: '#000000', glow: '#4b0082', score: 2048 },
      { name: 'chaos',     radius: 95, color: '#9400d3', glow: '#ba55d3', score: 4096 },
    ]
  },
  {
    id: 'dice',
    name: 'Dice Merge',
    color: '#dc143c',
    shapes: [
      { name: 'd4',      radius: 14, color: '#dc143c', glow: '#ff6b6b', score: 2 },
      { name: 'd6',      radius: 18, color: '#4169e1', glow: '#87ceeb', score: 4 },
      { name: 'd8',      radius: 22, color: '#228b22', glow: '#32cd32', score: 8 },
      { name: 'd10',     radius: 27, color: '#ff8c00', glow: '#ffa500', score: 16 },
      { name: 'd12',     radius: 32, color: '#9400d3', glow: '#ba55d3', score: 32 },
      { name: 'd20',     radius: 37, color: '#ffd700', glow: '#ffec8b', score: 64 },
      { name: 'mythic',  radius: 44, color: '#00ffff', glow: '#e0ffff', score: 128 },
      { name: 'legendary', radius: 52, color: '#ff00ff', glow: '#ff69b4', score: 256 },
      { name: 'cosmic',  radius: 60, color: '#ffffff', glow: '#e6e6fa', score: 512 },
      { name: 'divine',  radius: 70, color: '#ffd700', glow: '#ffff00', score: 1024 },
      { name: 'fate',    radius: 82, color: '#000000', glow: '#4b0082', score: 2048 },
      { name: 'destiny', radius: 95, color: '#9400d3', glow: '#ba55d3', score: 4096 },
      { name: 'creator', radius: 110, color: '#ff00ff', glow: '#ff69b4', score: 8192 },
    ]
  },
  {
    id: 'dungeon',
    name: 'Dungeon Loot',
    color: '#8b4513',
    shapes: [
      { name: 'stick',      radius: 14, color: '#8b4513', glow: '#a0522d', score: 2 },
      { name: 'sword',      radius: 18, color: '#c0c0c0', glow: '#e8e8e8', score: 4 },
      { name: 'magic',      radius: 22, color: '#4169e1', glow: '#87ceeb', score: 8 },
      { name: 'epic',       radius: 27, color: '#9400d3', glow: '#ba55d3', score: 16 },
      { name: 'legendary',  radius: 32, color: '#ffd700', glow: '#ffec8b', score: 32 },
      { name: 'excalibur',  radius: 37, color: '#00ffff', glow: '#e0ffff', score: 64 },
      { name: 'relic',      radius: 44, color: '#ff4500', glow: '#ff6347', score: 128 },
      { name: 'artifact',   radius: 52, color: '#ff00ff', glow: '#ff69b4', score: 256 },
      { name: 'primordial', radius: 60, color: '#ffffff', glow: '#ffd700', score: 512 },
      { name: 'celestial',  radius: 70, color: '#00ffff', glow: '#e0ffff', score: 1024 },
      { name: 'godforged',  radius: 82, color: '#9400d3', glow: '#ba55d3', score: 2048 },
      { name: 'infinity',   radius: 95, color: '#ff00ff', glow: '#ff69b4', score: 4096 },
      { name: 'omnipotence', radius: 110, color: '#000000', glow: '#4b0082', score: 8192 },
    ]
  },
  {
    id: 'wizard',
    name: 'Wizard Academy',
    color: '#9400d3',
    shapes: [
      { name: 'hat',       radius: 14, color: '#4b0082', glow: '#8a2be2', score: 2 },
      { name: 'book',      radius: 18, color: '#8b4513', glow: '#a0522d', score: 4 },
      { name: 'staff',     radius: 22, color: '#696969', glow: '#a9a9a9', score: 8 },
      { name: 'mage',      radius: 27, color: '#4169e1', glow: '#87ceeb', score: 16 },
      { name: 'archmage',  radius: 32, color: '#9400d3', glow: '#ba55d3', score: 32 },
      { name: 'dragon',    radius: 37, color: '#dc143c', glow: '#ff6b6b', score: 64 },
      { name: 'lich',      radius: 44, color: '#00ffff', glow: '#e0ffff', score: 128 },
      { name: 'demigod',   radius: 52, color: '#ffd700', glow: '#ffec8b', score: 256 },
      { name: 'titan',     radius: 60, color: '#ff00ff', glow: '#ff69b4', score: 512 },
      { name: 'elder',     radius: 70, color: '#ffffff', glow: '#e6e6fa', score: 1024 },
      { name: 'primal',    radius: 82, color: '#00ffff', glow: '#e0ffff', score: 2048 },
      { name: 'cosmic',    radius: 95, color: '#9400d3', glow: '#ba55d3', score: 4096 },
      { name: 'overlord',  radius: 110, color: '#ff00ff', glow: '#ff69b4', score: 8192 },
    ]
  },
  {
    id: 'cat',
    name: 'Cat Tower',
    color: '#ff8c00',
    shapes: [
      { name: 'kitten',    radius: 14, color: '#ffa500', glow: '#ffec8b', score: 2 },
      { name: 'housecat',  radius: 18, color: '#ff8c00', glow: '#ffa500', score: 4 },
      { name: 'fatcat',    radius: 22, color: '#ff6347', glow: '#ff7f50', score: 8 },
      { name: 'lion',      radius: 27, color: '#ffd700', glow: '#ffec8b', score: 16 },
      { name: 'tiger',     radius: 32, color: '#ff4500', glow: '#ff6347', score: 32 },
      { name: 'panther',   radius: 37, color: '#000000', glow: '#4b0082', score: 64 },
      { name: 'sphinx',    radius: 44, color: '#9400d3', glow: '#ba55d3', score: 128 },
      { name: 'chimera',   radius: 52, color: '#00ffff', glow: '#e0ffff', score: 256 },
      { name: 'griffin',   radius: 60, color: '#ffd700', glow: '#ffff00', score: 512 },
      { name: 'dragoncat', radius: 70, color: '#ff00ff', glow: '#ff69b4', score: 1024 },
      { name: 'deity',     radius: 82, color: '#ffffff', glow: '#e6e6fa', score: 2048 },
      { name: 'cosmic',    radius: 95, color: '#00ffff', glow: '#e0ffff', score: 4096 },
      { name: 'meowthulhu', radius: 110, color: '#000000', glow: '#4b0082', score: 8192 },
    ]
  },
];

function getCurrentShapes(level) {
  return THEMES[Math.min(level - 1, THEMES.length - 1)].shapes;
}

function getShapeCount(level) {
  return getCurrentShapes(level).length;
}

function getPhysicsSpeed(level) {
  return 1.0 + (level - 1) * 0.1;
}

function getDeathLineOffset(level) {
  return (level - 1) * 5;
}

function transformEntityToTheme(entity, oldLevel, newLevel) {
  // Map shape from old theme to equivalent in new theme
  const oldShapes = getCurrentShapes(oldLevel);
  const newShapes = getCurrentShapes(newLevel);
  
  // Get relative position in old theme (0 to 1)
  const oldMax = oldShapes.length - 1;
  const relativePos = entity.shapeType / oldMax;
  
  // Map to new theme
  const newMax = newShapes.length - 1;
  const newType = Math.min(Math.round(relativePos * newMax), newMax);
  
  return {
    ...entity,
    shapeType: newType,
    radius: newShapes[newType].radius,
  };
}
