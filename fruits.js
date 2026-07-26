const FRUITS = [
  { name: 'cherry',      radius: 14, color: '#d90429', stem: '#5c4a32', score: 2,   tier: 0 },
  { name: 'strawberry',  radius: 18, color: '#ff4d6d', seeds: '#9b2226', score: 4,   tier: 1 },
  { name: 'grape',       radius: 22, color: '#7209b7', highlight: '#b5179e', score: 8,   tier: 2 },
  { name: 'orange',      radius: 27, color: '#f77f00', dimple: '#e85d04', score: 16,  tier: 3 },
  { name: 'apple',       radius: 32, color: '#d00000', leaf: '#55a630', score: 32,  tier: 4 },
  { name: 'pear',        radius: 37, color: '#d4d700', dimple: '#bfd200', score: 64,  tier: 5 },
  { name: 'peach',       radius: 42, color: '#ff758f', score: 128, tier: 6 },
  { name: 'pineapple',   radius: 48, color: '#ffb703', crosshatch: '#fb8500', score: 256, tier: 7 },
  { name: 'cantaloupe',  radius: 54, color: '#90be6d', stripes: '#43aa8b', score: 512, tier: 8 },
  { name: 'watermelon',  radius: 62, color: '#e63946', stripes: '#1a7431', score: 1024, tier: 9 },
];

function drawFruit(ctx, x, y, fruitType, scale = 1) {
  const f = FRUITS[fruitType];
  if (!f) return;

  const r = f.radius * scale;
  ctx.save();
  ctx.translate(x, y);

  // Shadow
  ctx.beginPath();
  ctx.ellipse(0, r * 0.85, r * 0.7, r * 0.25, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.fill();

  // Main body
  ctx.beginPath();

  if (f.name === 'pear') {
    // Pear shape
    ctx.moveTo(0, -r * 1.1);
    ctx.bezierCurveTo(r * 0.6, -r * 0.8, r, -r * 0.2, r * 0.9, r * 0.5);
    ctx.bezierCurveTo(r * 0.8, r * 0.9, r * 0.4, r, 0, r);
    ctx.bezierCurveTo(-r * 0.4, r, -r * 0.8, r * 0.9, -r * 0.9, r * 0.5);
    ctx.bezierCurveTo(-r, -r * 0.2, -r * 0.6, -r * 0.8, 0, -r * 1.1);
  } else if (f.name === 'pineapple') {
    // Pineapple - more oval
    ctx.ellipse(0, 0, r * 0.85, r, 0, 0, Math.PI * 2);
  } else {
    ctx.arc(0, 0, r, 0, Math.PI * 2);
  }

  ctx.fillStyle = f.color;
  ctx.fill();

  // Gradient overlay for roundness
  if (f.name === 'pear') {
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.1);
    ctx.bezierCurveTo(r * 0.6, -r * 0.8, r, -r * 0.2, r * 0.9, r * 0.5);
    ctx.bezierCurveTo(r * 0.8, r * 0.9, r * 0.4, r, 0, r);
    ctx.bezierCurveTo(-r * 0.4, r, -r * 0.8, r * 0.9, -r * 0.9, r * 0.5);
    ctx.bezierCurveTo(-r, -r * 0.2, -r * 0.6, -r * 0.8, 0, -r * 1.1);
  } else if (f.name === 'pineapple') {
    ctx.ellipse(0, 0, r * 0.85, r, 0, 0, Math.PI * 2);
  } else {
    ctx.arc(0, 0, r, 0, Math.PI * 2);
  }

  const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
  grad.addColorStop(0, 'rgba(255,255,255,0.4)');
  grad.addColorStop(1, 'rgba(0,0,0,0.05)');
  ctx.fillStyle = grad;
  ctx.fill();

  // Fruit-specific details
  if (f.name === 'cherry') {
    // Stem
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.quadraticCurveTo(r * 0.5, -r * 1.4, r * 0.2, -r * 1.6);
    ctx.lineWidth = 2 * scale;
    ctx.strokeStyle = f.stem;
    ctx.stroke();

    // Leaf
    ctx.beginPath();
    ctx.ellipse(r * 0.2, -r * 1.4, r * 0.3, r * 0.15, 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#55a630';
    ctx.fill();
  }

  if (f.name === 'strawberry' && f.seeds) {
    // Seeds
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + Math.PI * 0.3;
      const sr = r * 0.08;
      const sx = Math.cos(angle) * r * 0.5;
      const sy = Math.sin(angle) * r * 0.5;
      ctx.beginPath();
      ctx.ellipse(sx, sy, sr, sr * 1.5, angle, 0, Math.PI * 2);
      ctx.fillStyle = f.seeds;
      ctx.fill();
    }
    // Top leaves
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(-r * 0.3, -r * 1.3);
    ctx.lineTo(0, -r * 1.1);
    ctx.lineTo(r * 0.3, -r * 1.3);
    ctx.closePath();
    ctx.fillStyle = '#55a630';
    ctx.fill();
  }

  if (f.name === 'grape' && f.highlight) {
    // Grape highlight
    ctx.beginPath();
    ctx.arc(-r * 0.35, -r * 0.35, r * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = f.highlight;
    ctx.fill();
    // Small highlight
    ctx.beginPath();
    ctx.arc(-r * 0.25, -r * 0.4, r * 0.05, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fill();
  }

  if (f.name === 'orange' && f.dimple) {
    // Dimple
    ctx.beginPath();
    ctx.arc(0, -r * 0.6, r * 0.08, 0, Math.PI * 2);
    ctx.fillStyle = f.dimple;
    ctx.fill();
    // Segments
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2);
    ctx.lineWidth = 1 * scale;
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7);
    }
    ctx.stroke();
  }

  if (f.name === 'apple' && f.leaf) {
    // Stem
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.quadraticCurveTo(r * 0.2, -r * 1.3, r * 0.3, -r * 1.1);
    ctx.lineWidth = 2 * scale;
    ctx.strokeStyle = '#5c4a32';
    ctx.stroke();
    // Leaf
    ctx.beginPath();
    ctx.ellipse(r * 0.3, -r * 1.2, r * 0.35, r * 0.15, 0.8, 0, Math.PI * 2);
    ctx.fillStyle = f.leaf;
    ctx.fill();
  }

  if (f.name === 'pineapple' && f.crosshatch) {
    // Crosshatch pattern
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.85, r, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.lineWidth = 1 * scale;
    ctx.strokeStyle = f.crosshatch;
    for (let i = -r; i <= r; i += r * 0.25) {
      ctx.beginPath();
      ctx.moveTo(-r, i);
      ctx.lineTo(r, i + r * 0.3);
      ctx.moveTo(-r, i + r * 0.3);
      ctx.lineTo(r, i);
      ctx.stroke();
    }
    ctx.restore();
    // Crown
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(-r * 0.2, -r * 1.4);
    ctx.lineTo(-r * 0.1, -r * 1.2);
    ctx.lineTo(0, -r * 1.5);
    ctx.lineTo(r * 0.1, -r * 1.2);
    ctx.lineTo(r * 0.2, -r * 1.4);
    ctx.lineTo(0, -r);
    ctx.fillStyle = '#55a630';
    ctx.fill();
  }

  if ((f.name === 'cantaloupe' || f.name === 'watermelon') && f.stripes) {
    // Stripes
    ctx.save();
    if (f.name === 'watermelon') {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.lineWidth = 3 * scale;
      ctx.strokeStyle = f.stripes;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.6 + i * r * 0.06, a + Math.PI * 0.1, a + Math.PI * 1.8);
        ctx.stroke();
      }
    } else {
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.lineWidth = 2 * scale;
      ctx.strokeStyle = f.stripes;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(
          Math.cos(a) * r * 1.5,
          Math.sin(a) * r * 1.5,
          Math.cos(a + 0.8) * r * 0.6,
          Math.sin(a + 0.8) * r * 0.6
        );
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  if (f.name === 'peach') {
    // Crease
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.1, r * 0.95, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(200,100,100,0.15)';
    ctx.lineWidth = 2 * scale;
    ctx.stroke();
    // Highlight
    ctx.beginPath();
    ctx.arc(-r * 0.4, -r * 0.35, r * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fill();
  }

  // Shine
  ctx.beginPath();
  ctx.arc(-r * 0.3, -r * 0.3, r * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fill();

  ctx.restore();
}

function randomFruitTier(maxTier = 2) {
  // Higher tiers are rarer
  const weights = [];
  for (let i = 0; i <= maxTier; i++) {
    weights.push(Math.pow(0.55, i));
  }
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return 0;
}
