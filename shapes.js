// Suika-style fruit set. 11 tiers. Real fruit names, real fruit colors.
// Radii follow Suika's curve: smallest ~30, largest ~110 (on a 400-wide canvas).
// Spawn weights strongly favor the smallest tiers — Suika gameplay depends on this.

const SHAPES = [
  { name: 'spark seed',         radius: 22, color: '#f6b83f', glow: '#ffe083', score: 2,   tier: 0  },
  { name: 'glass droplet',      radius: 30, color: '#38aee8', glow: '#8be8ff', score: 6,   tier: 1  },
  { name: 'luminous pearl',     radius: 40, color: '#eee7ff', glow: '#ffffff', score: 15,  tier: 2  },
  { name: 'faceted core',       radius: 50, color: '#6654de', glow: '#9c8cff', score: 35,  tier: 3  },
  { name: 'orbiting rune stone',radius: 58, color: '#253c86', glow: '#69d9ff', score: 70,  tier: 4  },
  { name: 'crystal bloom',      radius: 68, color: '#7088ff', glow: '#b5ccff', score: 150, tier: 5  },
  { name: 'contained star',     radius: 76, color: '#f0a83b', glow: '#ffe28c', score: 300, tier: 6  },
  { name: 'arcane planet',      radius: 84, color: '#243b9a', glow: '#5ed6ff', score: 600, tier: 7  },
  { name: 'crowned relic',      radius: 92, color: '#287bd8', glow: '#75e7ff', score: 1200,tier: 8  },
  { name: 'celestial heart',    radius: 102,color: '#5e4eda', glow: '#b68cff', score: 2400,tier: 9  },
  { name: 'fusion singularity', radius: 115,color: '#37237f', glow: '#ffb45f', score: 5000,tier: 10 },
];

const FUSION_SPRITE_FILES = [
  'spark-seed', 'glass-droplet', 'luminous-pearl', 'faceted-core',
  'orbiting-rune-stone', 'crystal-bloom', 'contained-star', 'arcane-planet',
  'crowned-relic', 'celestial-heart', 'fusion-singularity',
];
let fusionSprites = [];
if (typeof Image !== 'undefined') {
  fusionSprites = FUSION_SPRITE_FILES.map((name) => {
    const image = new Image();
    image.src = 'assets/pieces/' + name + '.png';
    return image;
  });
}

// Spawn weights: cherry 50%, strawberry 25%, grape 12%, orange 7%, lemon 4%, apple 1.5%, pear 0.4%, peach 0.09%, others ~0%.
// Big fruits are NOT in the spawn pool — they only appear via merges.
const SPAWN_POOL = [
  { tier: 0, weight: 50 },   // cherry
  { tier: 1, weight: 25 },   // strawberry
  { tier: 2, weight: 12 },   // grape
  { tier: 3, weight: 7 },    // orange
  { tier: 4, weight: 4 },    // lemon
  { tier: 5, weight: 1.5 },  // apple
  { tier: 6, weight: 0.4 },  // pear (rare)
  // tiers 7+ only via merge
];

function drawShape(ctx, x, y, shapeType, scale = 1, shapes = null, themeId = null) {
  const shapeList = shapes || SHAPES;
  const s = shapeList[shapeType];
  if (!s) return;

  const r = s.radius * scale;
  ctx.save();
  ctx.translate(x, y);

  const sprite = fusionSprites[shapeType];
  if (sprite && sprite.complete && sprite.naturalWidth > 0 && typeof ctx.drawImage === 'function') {
    // Individual square, alpha-trimmed sprites are drawn without filters,
    // procedural highlights, color tinting, or sprite-sheet interpolation.
    const size = r * 2.28;
    ctx.shadowBlur = 0;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
    ctx.restore();
    return;
  }

  // Soft outer glow
  ctx.shadowBlur = 14 * scale;
  ctx.shadowColor = s.glow;

  // Body — radial gradient for fruit-like sheen
  const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
  grad.addColorStop(0, lighten(s.color, 0.4));
  grad.addColorStop(0.7, s.color);
  grad.addColorStop(1, darken(s.color, 0.3));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // Subtle rim
  ctx.shadowBlur = 0;
  ctx.strokeStyle = darken(s.color, 0.4);
  ctx.lineWidth = Math.max(1, scale * 1.5);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();

  // Highlight dot — FD-002: brighter, slightly bigger.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.beginPath();
  ctx.arc(-r * 0.32, -r * 0.38, r * 0.22, 0, Math.PI * 2);
  ctx.fill();
  // Secondary smaller highlight for more depth.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.beginPath();
  ctx.arc(-r * 0.5, -r * 0.15, r * 0.08, 0, Math.PI * 2);
  ctx.fill();

  // Per-tier decorative touch: leaf on apple/pear/peach/watermelon, stem on cherry/etc.
  drawDecor(ctx, s, r, shapeType);

  ctx.restore();
}

function drawDecor(ctx, s, r, tier) {
  // FD-002: tier 2 (grape) - subtle cluster dots for texture.
  if (tier === 2) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    for (let i = 0; i < 3; i++) {
      const ang = (i / 3) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(ang) * r * 0.35, Math.sin(ang) * r * 0.35, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#2a1a3a';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.85);
    ctx.lineTo(r * 0.06, -r * 1.05);
    ctx.lineTo(-r * 0.06, -r * 1.05);
    ctx.closePath();
    ctx.fill();
  } else if (tier === 3) {
    // Orange: tiny leaf
    ctx.fillStyle = '#3aa83a';
    ctx.beginPath();
    ctx.ellipse(r * 0.2, -r * 0.85, r * 0.18, r * 0.07, -0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // FD-002: small leaf at the top of strawberry (tier 1) so it doesn't look like a generic red blob.
  if (tier === 1) {
    ctx.fillStyle = '#3aa83a';
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.9, r * 0.3, r * 0.08, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // tiny stem
    ctx.strokeStyle = '#2a2';
    ctx.lineWidth = Math.max(1.5, r * 0.06);
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.95);
    ctx.lineTo(0, -r * 1.15);
    ctx.stroke();
  } else if (tier === 4) {
    // Lemon: tiny tip
    ctx.fillStyle = '#9aa820';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.95);
    ctx.lineTo(r * 0.1, -r * 1.15);
    ctx.lineTo(-r * 0.1, -r * 1.15);
    ctx.closePath();
    ctx.fill();
  } else if (tier === 8) {
    // Pineapple-ish accent for tier 8 (still feels distinct)
    ctx.fillStyle = '#a37c2a';
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.9, r * 0.18, r * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (tier === 0) {
    // Cherry: little stem
    ctx.strokeStyle = '#4a2';
    ctx.lineWidth = Math.max(1.5, r * 0.08);
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.95);
    ctx.lineTo(r * 0.05, -r * 1.25);
    ctx.stroke();
  } else if (tier === 5 || tier === 6 || tier === 7) {
    // Apple/pear/peach: leaf
    ctx.fillStyle = '#4a8c3a';
    ctx.beginPath();
    ctx.ellipse(r * 0.25, -r * 0.9, r * 0.25, r * 0.1, -0.6, 0, Math.PI * 2);
    ctx.fill();
  } else if (tier === 9) {
    // Pineapple: crown of spikes
    ctx.fillStyle = '#2e7d32';
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * r * 0.18, -r * 0.95);
      ctx.lineTo(i * r * 0.18 - r * 0.06, -r * 1.25);
      ctx.lineTo(i * r * 0.18 + r * 0.06, -r * 1.25);
      ctx.closePath();
      ctx.fill();
    }
  } else if (tier === 10) {
    // Watermelon: dark stripes
    ctx.strokeStyle = 'rgba(0, 60, 30, 0.5)';
    ctx.lineWidth = Math.max(1.5, r * 0.04);
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.95, -Math.PI/2 + i * 0.35, -Math.PI/2 + i * 0.35 + 0.12);
      ctx.stroke();
    }
  }
}

function lighten(hex, amt) {
  return mixHex(hex, '#ffffff', amt);
}
function darken(hex, amt) {
  return mixHex(hex, '#000000', amt);
}
function mixHex(a, b, t) {
  const ah = (a || '').replace('#', '');
  const bh = (b || '').replace('#', '');
  if (ah.length !== 6 || bh.length !== 6) return a;
  const ar = parseInt(ah.slice(0, 2), 16), ag = parseInt(ah.slice(2, 4), 16), ab = parseInt(ah.slice(4, 6), 16);
  const br = parseInt(bh.slice(0, 2), 16), bg = parseInt(bh.slice(2, 4), 16), bb = parseInt(bh.slice(4, 6), 16);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return '#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + bl.toString(16).padStart(2, '0');
}

function pickSpawnTier() {
  const total = SPAWN_POOL.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  for (const p of SPAWN_POOL) {
    r -= p.weight;
    if (r <= 0) return p.tier;
  }
  return 0;
}

// Expose for legacy callers
window.SHAPES = SHAPES;
window.SPAWN_POOL = SPAWN_POOL;
window.pickSpawnTier = pickSpawnTier;
