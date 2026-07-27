const SHAPES = [
  { name: 'spark',       radius: 25, color: '#00d4ff', glow: '#00f0ff', score: 2,   tier: 0 },
  { name: 'ember',       radius: 32, color: '#0099cc', glow: '#00d4ff', score: 4,   tier: 1 },
  { name: 'crystal',     radius: 40, color: '#3366ff', glow: '#6699ff', score: 8,   tier: 2 },
  { name: 'shard',       radius: 48, color: '#6633cc', glow: '#9966ff', score: 16,  tier: 3 },
  { name: 'prism',       radius: 56, color: '#9933ff', glow: '#cc66ff', score: 32,  tier: 4 },
  { name: 'nexus',       radius: 65, color: '#cc3399', glow: '#ff66cc', score: 64,  tier: 5 },
  { name: 'singularity', radius: 78, color: '#ff0066', glow: '#ff3399', score: 128, tier: 6 },
];

function drawShape(ctx, x, y, shapeType, scale = 1, shapes = null, themeId = null) {
  // Use provided shapes array or fall back to global SHAPES for backwards compatibility
  const shapeList = shapes || SHAPES;
  const s = shapeList[shapeType];
  if (!s) return;

  // Determine theme: if shapes matches a known theme, infer themeId
  let resolvedTheme = themeId;
  if (!resolvedTheme && typeof THEMES !== 'undefined') {
    for (const t of THEMES) {
      if (t.shapes === shapeList || (t.shapes.length === shapeList.length && t.shapes[0].name === shapeList[0].name)) {
        resolvedTheme = t.id;
        break;
      }
    }
  }
  // Fallback to fusion if no theme matched
  if (!resolvedTheme) resolvedTheme = 'fusion';

  const r = s.radius * scale;
  ctx.save();
  ctx.translate(x, y);

  // Glow effect
  ctx.shadowBlur = 15 * scale;
  ctx.shadowColor = s.glow;

  // Theme-specific drawing
  switch (resolvedTheme) {
    case 'treasure':
      drawTreasureShape(ctx, s.name, r, s.color);
      break;
    case 'slime':
      drawSlimeShape(ctx, s.name, r, s.color);
      break;
    case 'potion':
      drawPotionShape(ctx, s.name, r, s.color);
      break;
    case 'planet':
      drawPlanetShape(ctx, s.name, r, s.color);
      break;
    case 'food':
      drawFoodShape(ctx, s.name, r, s.color);
      break;
    case 'aquarium':
      drawAquariumShape(ctx, s.name, r, s.color);
      break;
    case 'dice':
      drawDiceShape(ctx, s.name, r, s.color);
      break;
    case 'dungeon':
      drawDungeonShape(ctx, s.name, r, s.color);
      break;
    case 'wizard':
      drawWizardShape(ctx, s.name, r, s.color);
      break;
    case 'cat':
      drawCatShape(ctx, s.name, r, s.color);
      break;
    case 'fusion':
    default:
      drawFusionShape(ctx, s.name, r, s.color);
      break;
  }

  ctx.restore();
}

// ────────────────────
// FUSION (geometric crystals)
// ────────────────────
function drawFusionShape(ctx, name, r, color) {
  switch (name) {
    case 'spark': drawSpark(ctx, r, color); break;
    case 'ember': drawEmber(ctx, r, color); break;
    case 'crystal': drawCrystal(ctx, r, color); break;
    case 'shard': drawShard(ctx, r, color); break;
    case 'prism': drawPrism(ctx, r, color); break;
    case 'nexus': drawNexus(ctx, r, color); break;
    case 'singularity': drawSingularity(ctx, r, color); break;
    default: drawCircle(ctx, r, color); break;
  }
}

function drawSpark(ctx, r, color) {
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 - Math.PI / 2;
    const innerAngle = ((i + 0.5) / 4) * Math.PI * 2 - Math.PI / 2;
    if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
    else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    ctx.lineTo(Math.cos(innerAngle) * r * 0.4, Math.sin(innerAngle) * r * 0.4);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawEmber(ctx, r, color) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
    ctx.lineTo(Math.cos(angle) * r * 0.6, Math.sin(angle) * r * 0.6);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fill();
}

function drawCrystal(ctx, r, color) {
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r * 0.7, 0);
  ctx.lineTo(0, r);
  ctx.lineTo(-r * 0.7, 0);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, -r); ctx.lineTo(0, r);
  ctx.moveTo(-r * 0.7, 0); ctx.lineTo(r * 0.7, 0);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawShard(ctx, r, color) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
    if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
    else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 - Math.PI / 2 + Math.PI / 8;
    if (i === 0) ctx.moveTo(Math.cos(angle) * r * 0.5, Math.sin(angle) * r * 0.5);
    else ctx.lineTo(Math.cos(angle) * r * 0.5, Math.sin(angle) * r * 0.5);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fill();
}

function drawPrism(ctx, r, color) {
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
    if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
    else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
    if (i === 0) ctx.moveTo(Math.cos(angle) * r * 0.6, Math.sin(angle) * r * 0.6);
    else ctx.lineTo(Math.cos(angle) * r * 0.6, Math.sin(angle) * r * 0.6);
  }
  ctx.closePath();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawNexus(ctx, r, color) {
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    ctx.save();
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(r * 0.3, 0);
    ctx.lineTo(r * 0.7, -r * 0.2);
    ctx.lineTo(r * 0.7, r * 0.2);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fill();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fill();
}

function drawSingularity(ctx, r, color) {
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  for (let arm = 0; arm < 3; arm++) {
    ctx.beginPath();
    const offset = (arm / 3) * Math.PI * 2;
    for (let t = 0; t < 20; t++) {
      const angle = t * 0.3 + offset;
      const dist = (t / 20) * r * 0.8;
      const px = Math.cos(angle) * dist;
      const py = Math.sin(angle) * dist;
      if (t === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fill();
}

function drawCircle(ctx, r, color) {
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

// ────────────────────
// TREASURE
// ────────────────────
function drawTreasureShape(ctx, name, r, color) {
  switch (name) {
    case 'copper': drawCoin(ctx, r, color, '$'); break;
    case 'silver': drawCoin(ctx, r, '#c0c0c0', '$'); break;
    case 'gold':   drawCoin(ctx, r, '#ffd700', '$'); break;
    case 'gem':    drawGem(ctx, r, color); break;
    case 'ring':   drawRing(ctx, r, color); break;
    case 'crown':  drawCrown(ctx, r, '#daa520'); break;
    case 'chest':  drawChest(ctx, r, '#8b4513'); break;
    case 'hoard':  drawCoinPile(ctx, r, '#ff4500'); break;
    default: drawCoin(ctx, r, color, '$'); break;
  }
}

function drawCoin(ctx, r, color, symbol) {
  // Outer rim
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  // Inner ridge
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = Math.max(1, r * 0.05);
  ctx.stroke();
  // Symbol
  ctx.save();
  ctx.font = `bold ${Math.floor(r)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillText(symbol, 0, r * 0.05);
  ctx.restore();
}

function drawGem(ctx, r, color) {
  // Diamond facet
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r * 0.75, -r * 0.15);
  ctx.lineTo(r * 0.5, r);
  ctx.lineTo(-r * 0.5, r);
  ctx.lineTo(-r * 0.75, -r * 0.15);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  // Facet lines
  ctx.beginPath();
  ctx.moveTo(0, -r); ctx.lineTo(0, r * 0.3);
  ctx.moveTo(-r * 0.75, -r * 0.15); ctx.lineTo(r * 0.75, -r * 0.15);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Highlight
  ctx.beginPath();
  ctx.moveTo(-r * 0.2, -r * 0.6); ctx.lineTo(r * 0.2, -r * 0.6);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.stroke();
}

function drawRing(ctx, r, color) {
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  // Inner hole
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
  ctx.fillStyle = '#0a0a0f'; // dark background color
  ctx.fill();
  // Band highlight
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.65, -Math.PI * 0.8, -Math.PI * 0.2);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = Math.max(1, r * 0.12);
  ctx.stroke();
}

function drawCrown(ctx, r, color) {
  ctx.beginPath();
  ctx.moveTo(-r, r * 0.3);
  ctx.lineTo(-r, -r * 0.2);
  ctx.lineTo(-r * 0.6, -r * 0.55);
  ctx.lineTo(-r * 0.2, -r * 0.2);
  ctx.lineTo(r * 0.2, -r * 0.55);
  ctx.lineTo(r * 0.6, -r * 0.2);
  ctx.lineTo(r, -r * 0.2);
  ctx.lineTo(r, r * 0.3);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  // Jewel
  ctx.beginPath();
  ctx.arc(0, -r * 0.05, r * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = '#ff1493';
  ctx.fill();
  // Bands
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-r, -r * 0.1); ctx.lineTo(r, -r * 0.1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-r, r * 0.1); ctx.lineTo(r, r * 0.1); ctx.stroke();
}

function drawChest(ctx, r, color) {
  // Base
  ctx.beginPath();
  ctx.moveTo(-r * 0.9, -r * 0.1);
  ctx.lineTo(r * 0.9, -r * 0.1);
  ctx.lineTo(r * 0.8, r * 0.6);
  ctx.lineTo(-r * 0.8, r * 0.6);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  // Lid arch
  ctx.beginPath();
  ctx.moveTo(-r * 0.9, -r * 0.1);
  ctx.quadraticCurveTo(0, -r * 0.9, r * 0.9, -r * 0.1);
  ctx.fillStyle = '#a0522d';
  ctx.fill();
  // Lock
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = '#ffd700';
  ctx.fill();
  // Keyhole
  ctx.beginPath();
  ctx.arc(0, r * 0.05, r * 0.05, 0, Math.PI * 2);
  ctx.fillStyle = '#0a0a0f';
  ctx.fill();
}

function drawCoinPile(ctx, r, color) {
  // Draw 3 overlapping coins
  const offsets = [[-r * 0.35, r * 0.1], [r * 0.35, r * 0.1], [0, -r * 0.2]];
  for (const [ox, oy] of offsets) {
    ctx.beginPath();
    ctx.arc(ox, oy, r * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ox, oy, r * 0.4, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

// ────────────────────
// SLIME
// ────────────────────
function drawSlimeShape(ctx, name, r, color) {
  switch (name) {
    case 'ghost': drawSlimeGhost(ctx, r, color); break;
    case 'king':  drawSlimeCrown(ctx, r, color); break;
    case 'ancient': drawSlimeAncient(ctx, r, color); break;
    case 'rainbow': drawSlimeRainbow(ctx, r, color); break;
    case 'god':   drawSlimeGod(ctx, r, color); break;
    default:      drawSlimeBlob(ctx, r, color); break;
  }
}

function drawSlimeBlob(ctx, r, color) {
  ctx.beginPath();
  ctx.arc(0, -r * 0.15, r * 0.9, Math.PI, 0);
  ctx.quadraticCurveTo(r * 0.95, r * 0.5, r * 0.6, r * 0.75);
  ctx.quadraticCurveTo(0, r * 0.9, -r * 0.6, r * 0.75);
  ctx.quadraticCurveTo(-r * 0.95, r * 0.5, -r * 0.9, -r * 0.15);
  ctx.fillStyle = color;
  ctx.fill();
  // Eyes
  ctx.beginPath(); ctx.arc(-r * 0.25, -r * 0.15, r * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
  ctx.beginPath(); ctx.arc(r * 0.25, -r * 0.15, r * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
  // Pupils
  ctx.beginPath(); ctx.arc(-r * 0.25, -r * 0.1, r * 0.08, 0, Math.PI * 2);
  ctx.fillStyle = '#0a0a0f'; ctx.fill();
  ctx.beginPath(); ctx.arc(r * 0.25, -r * 0.1, r * 0.08, 0, Math.PI * 2);
  ctx.fillStyle = '#0a0a0f'; ctx.fill();
  // Mouth
  ctx.beginPath();
  ctx.arc(0, r * 0.15, r * 0.25, 0, Math.PI);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = Math.max(1, r * 0.08);
  ctx.stroke();
}

function drawSlimeGhost(ctx, r, color) {
  drawSlimeBlob(ctx, r, color);
  // Ghost tail
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, r * 0.7);
  ctx.quadraticCurveTo(-r * 0.2, r * 1.05, 0, r * 0.8);
  ctx.quadraticCurveTo(r * 0.2, r * 1.05, r * 0.5, r * 0.7);
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fill();
}

function drawSlimeCrown(ctx, r, color) {
  drawSlimeBlob(ctx, r, color);
  // Tiny crown
  ctx.beginPath();
  ctx.moveTo(-r * 0.35, -r * 0.7);
  ctx.lineTo(-r * 0.2, -r * 0.95);
  ctx.lineTo(0, -r * 0.75);
  ctx.lineTo(r * 0.2, -r * 0.95);
  ctx.lineTo(r * 0.35, -r * 0.7);
  ctx.closePath();
  ctx.fillStyle = '#ffd700';
  ctx.fill();
}

function drawSlimeAncient(ctx, r, color) {
  drawSlimeBlob(ctx, r, color);
  // Runes on body
  ctx.save();
  ctx.font = `bold ${Math.floor(r * 0.5)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillText('✦', 0, 0);
  ctx.restore();
}

function drawSlimeRainbow(ctx, r, color) {
  const hues = ['#ff0000','#ff7f00','#ffff00','#00ff00','#0000ff','#8a2be2'];
  for (let i = 0; i < hues.length; i++) {
    const rr = r * (1 - i * 0.12);
    if (rr < 2) break;
    ctx.beginPath();
    ctx.arc(0, -r * 0.15, rr * 0.9, Math.PI, 0);
    ctx.quadraticCurveTo(rr * 0.95, rr * 0.5, rr * 0.6, rr * 0.75);
    ctx.quadraticCurveTo(0, rr * 0.9, -rr * 0.6, rr * 0.75);
    ctx.quadraticCurveTo(-rr * 0.95, rr * 0.5, -rr * 0.9, -r * 0.15);
    ctx.fillStyle = hues[i];
    ctx.fill();
  }
}

function drawSlimeGod(ctx, r, color) {
  drawSlimeBlob(ctx, r, color);
  // Halo
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.75, r * 0.55, r * 0.12, 0, 0, Math.PI * 2);
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = Math.max(1, r * 0.08);
  ctx.stroke();
}

// ────────────────────
// POTION
// ────────────────────
function drawPotionShape(ctx, name, r, color) {
  switch (name) {
    case 'herb':     drawLeaf(ctx, r, '#228b22'); break;
    case 'mushroom': drawMushroom(ctx, r, '#8b0000'); break;
    default:         drawFlask(ctx, r, color, name); break;
  }
}

function drawLeaf(ctx, r, color) {
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.5, r * 0.9, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.9); ctx.lineTo(0, r * 0.9);
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawMushroom(ctx, r, color) {
  // Cap
  ctx.beginPath();
  ctx.arc(0, -r * 0.2, r * 0.75, Math.PI, 0);
  ctx.fillStyle = color;
  ctx.fill();
  // Stem
  ctx.beginPath();
  ctx.roundRect(-r * 0.2, -r * 0.2, r * 0.4, r * 0.7, r * 0.1);
  ctx.fillStyle = '#f5deb3';
  ctx.fill();
  // Spots
  ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.45, r * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill();
  ctx.beginPath(); ctx.arc(r * 0.25, -r * 0.35, r * 0.1, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill();
}

function drawFlask(ctx, r, color, name) {
  const isRound = name === 'potion' || name === 'greater' || name === 'elixir' || name === 'divine';
  const isTall = name === 'philosopher' || name === 'eternity' || name === 'omnipotence';
  const neckW = isTall ? r * 0.25 : r * 0.35;
  const neckH = isTall ? r * 0.45 : r * 0.25;
  const bodyR = isRound ? r * 0.7 : r * 0.65;
  const bodyY = isTall ? r * 0.15 : r * 0.1;

  // Flask glass outline
  ctx.beginPath();
  // Neck left
  ctx.moveTo(-neckW, -r * 0.55);
  ctx.lineTo(-neckW, -r * 0.15);
  // Body left
  ctx.quadraticCurveTo(-bodyR, bodyY - bodyR, 0, bodyY - bodyR);
  ctx.quadraticCurveTo(bodyR, bodyY - bodyR, neckW, -r * 0.15);
  // Neck right
  ctx.lineTo(neckW, -r * 0.55);
  ctx.closePath();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = Math.max(1, r * 0.06);
  ctx.stroke();

  // Liquid fill (bottom half)
  ctx.beginPath();
  ctx.moveTo(-bodyR * 0.85, bodyY);
  ctx.quadraticCurveTo(-bodyR, bodyY + bodyR * 0.7, 0, bodyY + bodyR * 0.85);
  ctx.quadraticCurveTo(bodyR, bodyY + bodyR * 0.7, bodyR * 0.85, bodyY);
  ctx.lineTo(bodyR * 0.85, bodyY);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  // Cork
  ctx.beginPath();
  ctx.roundRect(-neckW * 0.8, -r * 0.65, neckW * 1.6, r * 0.15, r * 0.03);
  ctx.fillStyle = '#8b4513';
  ctx.fill();

  // Bubbles for higher tiers
  if (name !== 'bottle') {
    ctx.beginPath();
    ctx.arc(-r * 0.15, bodyY + r * 0.25, r * 0.08, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(r * 0.2, bodyY + r * 0.05, r * 0.06, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fill();
  }
}

// ────────────────────
// PLANET
// ────────────────────
function drawPlanetShape(ctx, name, r, color) {
  switch (name) {
    case 'dust':     drawCircle(ctx, r, '#696969'); break;
    case 'rock':     drawAsteroid(ctx, r, '#8b4513'); break;
    case 'moon':     drawMoon(ctx, r, '#c0c0c0'); break;
    case 'star':     drawStarShape(ctx, r, '#ffd700'); break;
    case 'neutron':  drawNeutronStar(ctx, r, '#00ffff'); break;
    case 'blackhole':drawBlackHole(ctx, r); break;
    case 'galaxy':   drawGalaxy(ctx, r, '#ff00ff'); break;
    case 'universe': drawUniverse(ctx, r, '#ffffff'); break;
    case 'multiverse': drawMultiverse(ctx, r, '#9400d3'); break;
    default:         drawPlanet(ctx, r, color, name); break;
  }
}

function drawAsteroid(ctx, r, color) {
  ctx.beginPath();
  const pts = 7;
  for (let i = 0; i < pts; i++) {
    const angle = (i / pts) * Math.PI * 2 - Math.PI / 2;
    const rr = r * (0.75 + Math.random() * 0.25); // deterministic-ish jaggedness via index
    const j = (i % 3) / 3; // pseudo-random factor
    const rad = r * (0.7 + j * 0.3);
    const px = Math.cos(angle) * rad;
    const py = Math.sin(angle) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  // Crater
  ctx.beginPath(); ctx.arc(r * 0.15, -r * 0.1, r * 0.25, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fill();
}

function drawMoon(ctx, r, color) {
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  // Craters
  const craters = [[-r * 0.3, -r * 0.25, 0.22], [r * 0.35, r * 0.15, 0.18], [0, r * 0.4, 0.15], [-r * 0.1, -r * 0.45, 0.12]];
  for (const [cx, cy, cs] of craters) {
    ctx.beginPath(); ctx.arc(cx, cy, r * cs, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fill();
  }
}

function drawPlanet(ctx, r, color, name) {
  // Planet body
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  // Bands for gas giant
  if (name === 'gasgiant') {
    for (let i = 0; i < 3; i++) {
      const yOff = (-0.4 + i * 0.4) * r;
      ctx.beginPath();
      ctx.ellipse(0, yOff, r * 0.9, r * 0.12, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.lineWidth = Math.max(1, r * 0.06);
      ctx.stroke();
    }
  }
  // Atmosphere glow arc
  ctx.beginPath();
  ctx.arc(0, 0, r, -Math.PI * 0.85, -Math.PI * 0.15);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = Math.max(1, r * 0.1);
  ctx.stroke();
}

function drawStarShape(ctx, r, color) {
  // Sun body
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  // Rays
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    ctx.save();
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(r * 0.7, -r * 0.12);
    ctx.lineTo(r * 1.15, 0);
    ctx.lineTo(r * 0.7, r * 0.12);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,0,0.35)';
    ctx.fill();
    ctx.restore();
  }
}

function drawNeutronStar(ctx, r, color) {
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  // Spin lines
  for (let i = 0; i < 3; i++) {
    const yy = (-0.5 + i * 0.5) * r;
    ctx.beginPath();
    ctx.ellipse(0, yy, r * 0.85, r * 0.06, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = Math.max(1, r * 0.05);
    ctx.stroke();
  }
}

function drawBlackHole(ctx, r) {
  // Accretion disk
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.35, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#4b0082';
  ctx.fill();
  // Event horizon
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
  ctx.fillStyle = '#000000';
  ctx.fill();
  // Rim light
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.55, -Math.PI * 0.7, -Math.PI * 0.3);
  ctx.strokeStyle = 'rgba(138,43,226,0.5)';
  ctx.lineWidth = Math.max(1, r * 0.08);
  ctx.stroke();
}

function drawGalaxy(ctx, r, color) {
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  // Spiral arms
  for (let arm = 0; arm < 2; arm++) {
    ctx.beginPath();
    const offset = arm * Math.PI;
    for (let t = 0; t < 30; t++) {
      const angle = t * 0.18 + offset;
      const dist = (t / 30) * r;
      const px = Math.cos(angle) * dist;
      const py = Math.sin(angle) * dist * 0.35;
      if (t === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, r * 0.12);
    ctx.lineCap = 'round';
    ctx.stroke();
  }
}

function drawUniverse(ctx, r, color) {
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fill();
  // Distant stars
  const stars = [[-0.5, -0.4], [0.3, -0.55], [0.55, 0.2], [-0.2, 0.5], [0, 0]];
  for (const [sx, sy] of stars) {
    ctx.beginPath(); ctx.arc(sx * r, sy * r, r * 0.08, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fill();
  }
}

function drawMultiverse(ctx, r, color) {
  // Overlapping bubbles
  const bubbles = [[-0.25, -0.15, 0.55], [0.25, 0.15, 0.55], [0, 0, 0.45]];
  for (const [bx, by, br] of bubbles) {
    ctx.beginPath(); ctx.arc(bx * r, by * r, br * r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.6;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// ────────────────────
// FOOD
// ────────────────────
function drawFoodShape(ctx, name, r, color) {
  switch (name) {
    case 'fries':    drawFries(ctx, r, '#ffd700'); break;
    case 'burger':   drawBurger(ctx, r, '#8b4513'); break;
    case 'pizza':    drawPizza(ctx, r, '#ff4500'); break;
    case 'taco':     drawTaco(ctx, r, '#ffd700'); break;
    case 'hotdog':   drawHotdog(ctx, r, '#dc143c'); break;
    case 'bbq':      drawBbq(ctx, r, '#8b0000'); break;
    case 'feast':    drawFeast(ctx, r, '#ff8c00'); break;
    case 'banquet':  drawBanquet(ctx, r, '#ffd700'); break;
    case 'royal':    drawRoyal(ctx, r, '#9400d3'); break;
    case 'godmeal':  drawGodMeal(ctx, r, '#ffffff'); break;
    case 'ambrosia': drawAmbrosia(ctx, r, '#00ffff'); break;
    case 'infinity': drawInfinityFood(ctx, r, '#ff00ff'); break;
    default: drawCircle(ctx, r, color); break;
  }
}

function drawFries(ctx, r, color) {
  // Carton
  ctx.beginPath();
  ctx.moveTo(-r * 0.6, r * 0.4);
  ctx.lineTo(r * 0.6, r * 0.4);
  ctx.lineTo(r * 0.4, -r * 0.2);
  ctx.lineTo(-r * 0.4, -r * 0.2);
  ctx.closePath();
  ctx.fillStyle = '#cc3300';
  ctx.fill();
  // Fries sticking out
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, r * 0.15);
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-r * 0.25, -r * 0.15); ctx.lineTo(-r * 0.25, -r * 0.75); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -r * 0.15); ctx.lineTo(0, -r * 0.85); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(r * 0.25, -r * 0.15); ctx.lineTo(r * 0.25, -r * 0.7); ctx.stroke();
}

function drawBurger(ctx, r, color) {
  // Top bun
  ctx.beginPath();
  ctx.arc(0, -r * 0.25, r * 0.75, Math.PI, 0);
  ctx.fillStyle = '#deb887';
  ctx.fill();
  // Patty
  ctx.beginPath();
  ctx.roundRect(-r * 0.7, -r * 0.05, r * 1.4, r * 0.25, r * 0.05);
  ctx.fillStyle = color;
  ctx.fill();
  // Lettuce
  ctx.beginPath();
  ctx.roundRect(-r * 0.7, -r * 0.2, r * 1.4, r * 0.12, r * 0.03);
  ctx.fillStyle = '#32cd32';
  ctx.fill();
  // Bottom bun
  ctx.beginPath();
  ctx.roundRect(-r * 0.7, r * 0.15, r * 1.4, r * 0.35, r * 0.08);
  ctx.fillStyle = '#deb887';
  ctx.fill();
  // Sesame seeds
  ctx.fillStyle = '#f5deb3';
  ctx.beginPath(); ctx.arc(-r * 0.2, -r * 0.55, r * 0.05, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(r * 0.3, -r * 0.5, r * 0.05, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -r * 0.65, r * 0.05, 0, Math.PI * 2); ctx.fill();
}

function drawPizza(ctx, r, color) {
  // Triangle slice
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.85);
  ctx.lineTo(r * 0.8, r * 0.55);
  ctx.lineTo(-r * 0.8, r * 0.55);
  ctx.closePath();
  ctx.fillStyle = '#ffcc66';
  ctx.fill();
  // Crust
  ctx.beginPath();
  ctx.moveTo(-r * 0.85, r * 0.55);
  ctx.lineTo(r * 0.85, r * 0.55);
  ctx.lineTo(r * 0.75, r * 0.7);
  ctx.lineTo(-r * 0.75, r * 0.7);
  ctx.closePath();
  ctx.fillStyle = '#d2691e';
  ctx.fill();
  // Pepperoni
  ctx.beginPath(); ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();
  ctx.beginPath(); ctx.arc(r * 0.25, -r * 0.2, r * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();
  ctx.beginPath(); ctx.arc(-r * 0.25, -r * 0.1, r * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();
}

function drawTaco(ctx, r, color) {
  // Shell
  ctx.beginPath();
  ctx.arc(0, r * 0.15, r * 0.9, Math.PI, 0);
  ctx.closePath();
  ctx.fillStyle = '#daa520';
  ctx.fill();
  // Fillings
  ctx.beginPath();
  ctx.arc(0, r * 0.05, r * 0.6, Math.PI, 0);
  ctx.fillStyle = '#8b4513';
  ctx.fill();
  // Lettuce top
  ctx.beginPath();
  ctx.moveTo(-r * 0.55, -r * 0.15);
  ctx.quadraticCurveTo(0, -r * 0.45, r * 0.55, -r * 0.15);
  ctx.strokeStyle = '#32cd32';
  ctx.lineWidth = Math.max(2, r * 0.12);
  ctx.stroke();
}

function drawHotdog(ctx, r, color) {
  // Bun
  ctx.beginPath();
  ctx.roundRect(-r * 0.55, -r * 0.35, r * 1.1, r * 0.7, r * 0.2);
  ctx.fillStyle = '#deb887';
  ctx.fill();
  // Sausage
  ctx.beginPath();
  ctx.roundRect(-r * 0.55, -r * 0.2, r * 1.1, r * 0.4, r * 0.15);
  ctx.fillStyle = color;
  ctx.fill();
  // Mustard squiggle
  ctx.beginPath();
  ctx.moveTo(-r * 0.4, -r * 0.05);
  ctx.quadraticCurveTo(-r * 0.2, -r * 0.15, 0, -r * 0.05);
  ctx.quadraticCurveTo(r * 0.2, r * 0.05, r * 0.4, -r * 0.05);
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = Math.max(2, r * 0.1);
  ctx.lineCap = 'round';
  ctx.stroke();
}

function drawBbq(ctx, r, color) {
  // Ribs
  ctx.beginPath();
  ctx.roundRect(-r * 0.65, -r * 0.45, r * 1.3, r * 0.9, r * 0.15);
  ctx.fillStyle = color;
  ctx.fill();
  // Bone ends
  ctx.fillStyle = '#f5deb3';
  ctx.beginPath(); ctx.arc(-r * 0.55, -r * 0.3, r * 0.12, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(r * 0.55, -r * 0.3, r * 0.12, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(-r * 0.55, r * 0.3, r * 0.12, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(r * 0.55, r * 0.3, r * 0.12, 0, Math.PI * 2); ctx.fill();
  // Sauce glaze
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, -r * 0.15);
  ctx.quadraticCurveTo(0, r * 0.1, r * 0.5, -r * 0.15);
  ctx.strokeStyle = 'rgba(139,0,0,0.4)';
  ctx.lineWidth = Math.max(2, r * 0.12);
  ctx.stroke();
}

function drawFeast(ctx, r, color) {
  // Platter
  ctx.beginPath();
  ctx.ellipse(0, r * 0.35, r * 0.85, r * 0.25, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#silver';
  ctx.fill();
  // Roast
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  // Leg bone
  ctx.beginPath();
  ctx.roundRect(r * 0.25, -r * 0.15, r * 0.5, r * 0.25, r * 0.08);
  ctx.fillStyle = '#f5deb3';
  ctx.fill();
}

function drawBanquet(ctx, r, color) {
  // Goblet
  ctx.beginPath();
  ctx.moveTo(-r * 0.45, -r * 0.35);
  ctx.lineTo(-r * 0.55, r * 0.15);
  ctx.lineTo(r * 0.55, r * 0.15);
  ctx.lineTo(r * 0.45, -r * 0.35);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  // Stem
  ctx.beginPath();
  ctx.moveTo(0, r * 0.15); ctx.lineTo(0, r * 0.55);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, r * 0.1);
  ctx.stroke();
  // Base
  ctx.beginPath();
  ctx.ellipse(0, r * 0.55, r * 0.35, r * 0.08, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawRoyal(ctx, r, color) {
  // Crown with jewels
  ctx.beginPath();
  ctx.moveTo(-r, r * 0.3);
  ctx.lineTo(-r, -r * 0.2);
  ctx.lineTo(-r * 0.6, -r * 0.55);
  ctx.lineTo(-r * 0.2, -r * 0.2);
  ctx.lineTo(r * 0.2, -r * 0.55);
  ctx.lineTo(r * 0.6, -r * 0.2);
  ctx.lineTo(r, -r * 0.2);
  ctx.lineTo(r, r * 0.3);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  // Jewels
  ctx.beginPath(); ctx.arc(0, -r * 0.05, r * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = '#ff1493'; ctx.fill();
  ctx.beginPath(); ctx.arc(-r * 0.4, r * 0.05, r * 0.1, 0, Math.PI * 2);
  ctx.fillStyle = '#00ffff'; ctx.fill();
  ctx.beginPath(); ctx.arc(r * 0.4, r * 0.05, r * 0.1, 0, Math.PI * 2);
  ctx.fillStyle = '#ffd700'; ctx.fill();
}

function drawGodMeal(ctx, r, color) {
  // Divine orb
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  // Rays
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    ctx.save();
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(r * 0.55, -r * 0.1);
    ctx.lineTo(r * 1.1, 0);
    ctx.lineTo(r * 0.55, r * 0.1);
    ctx.closePath();
    ctx.fillStyle = '#ffd700';
    ctx.fill();
    ctx.restore();
  }
}

function drawAmbrosia(ctx, r, color) {
  // Crystal bowl
  ctx.beginPath();
  ctx.moveTo(-r * 0.65, -r * 0.15);
  ctx.quadraticCurveTo(-r * 0.85, r * 0.45, 0, r * 0.65);
  ctx.quadraticCurveTo(r * 0.85, r * 0.45, r * 0.65, -r * 0.15);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0,255,255,0.25)';
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.stroke();
  // Liquid
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.5, r * 0.2, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawInfinityFood(ctx, r, color) {
  // Infinity symbol made of two circles
  ctx.beginPath(); ctx.arc(-r * 0.35, 0, r * 0.5, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();
  ctx.beginPath(); ctx.arc(r * 0.35, 0, r * 0.5, 0, Math.PI * 2);
  ctx.fillStyle = '#ff69b4'; ctx.fill();
  // Center overlap clear
  ctx.beginPath(); ctx.arc(-r * 0.35, 0, r * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();
  ctx.beginPath(); ctx.arc(r * 0.35, 0, r * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = '#ff69b4'; ctx.fill();
}

// ────────────────────
// AQUARIUM
// ────────────────────
function drawAquariumShape(ctx, name, r, color) {
  switch (name) {
    case 'shrimp':    drawShrimp(ctx, r, color); break;
    case 'minnow':    drawFish(ctx, r, '#c0c0c0', 'minnow'); break;
    case 'goldfish':  drawFish(ctx, r, '#ffd700', 'goldfish'); break;
    case 'clownfish': drawFish(ctx, r, '#ff4500', 'clown'); break;
    case 'shark':     drawShark(ctx, r, '#708090'); break;
    case 'whale':     drawWhale(ctx, r, '#4682b4'); break;
    case 'kraken':    drawKraken(ctx, r, '#4b0082'); break;
    case 'leviathan': drawLeviathan(ctx, r, '#00008b'); break;
    case 'poseidon':  drawPoseidon(ctx, r, '#00ffff'); break;
    case 'ocean':     drawOcean(ctx, r, '#000080'); break;
    case 'abyss':     drawAbyss(ctx, r); break;
    case 'chaos':     drawChaosFish(ctx, r, '#9400d3'); break;
    default: drawFish(ctx, r, color, 'fish'); break;
  }
}

function drawFish(ctx, r, color, variant) {
  // Body (ellipse)
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.75, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  // Tail
  ctx.beginPath();
  ctx.moveTo(r * 0.65, 0);
  ctx.lineTo(r * 1.05, -r * 0.4);
  ctx.lineTo(r * 1.05, r * 0.4);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  // Fins
  ctx.beginPath();
  ctx.moveTo(-r * 0.2, -r * 0.45);
  ctx.lineTo(r * 0.2, -r * 0.75);
  ctx.lineTo(r * 0.4, -r * 0.4);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  // Eye
  ctx.beginPath(); ctx.arc(-r * 0.35, -r * 0.1, r * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
  ctx.beginPath(); ctx.arc(-r * 0.38, -r * 0.08, r * 0.06, 0, Math.PI * 2);
  ctx.fillStyle = '#0a0a0f'; ctx.fill();
  // Clown stripes
  if (variant === 'clown') {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath(); ctx.rect(-r * 0.15, -r * 0.48, r * 0.08, r * 0.96); ctx.fill();
    ctx.beginPath(); ctx.rect(r * 0.2, -r * 0.42, r * 0.08, r * 0.84); ctx.fill();
  }
}

function drawShrimp(ctx, r, color) {
  // Curved body segments
  for (let i = 0; i < 4; i++) {
    const yy = (-0.3 + i * 0.2) * r;
    const xx = Math.sin(i * 0.8) * r * 0.25;
    ctx.beginPath();
    ctx.arc(xx, yy, r * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
  // Tail fan
  ctx.beginPath();
  ctx.moveTo(-r * 0.1, r * 0.45);
  ctx.lineTo(r * 0.3, r * 0.65);
  ctx.lineTo(-r * 0.35, r * 0.65);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawShark(ctx, r, color) {
  // Body (pointed)
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.8, r * 0.4, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  // Dorsal fin
  ctx.beginPath();
  ctx.moveTo(-r * 0.1, -r * 0.35);
  ctx.lineTo(r * 0.15, -r * 0.85);
  ctx.lineTo(r * 0.4, -r * 0.35);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  // Tail (crescent)
  ctx.beginPath();
  ctx.moveTo(r * 0.7, 0);
  ctx.quadraticCurveTo(r * 1.1, -r * 0.45, r * 1.0, -r * 0.15);
  ctx.quadraticCurveTo(r * 1.1, r * 0.45, r * 0.7, 0);
  ctx.fillStyle = color;
  ctx.fill();
  // Eye
  ctx.beginPath(); ctx.arc(-r * 0.45, -r * 0.05, r * 0.08, 0, Math.PI * 2);
  ctx.fillStyle = '#0a0a0f'; ctx.fill();
  // Mouth line
  ctx.beginPath();
  ctx.moveTo(-r * 0.55, r * 0.1);
  ctx.quadraticCurveTo(-r * 0.2, r * 0.25, r * 0.1, r * 0.05);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = Math.max(1, r * 0.06);
  ctx.stroke();
}

function drawWhale(ctx, r, color) {
  // Large rounded body
  ctx.beginPath();
  ctx.ellipse(-r * 0.15, 0, r * 0.75, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  // Tail flukes
  ctx.beginPath();
  ctx.moveTo(r * 0.55, 0);
  ctx.lineTo(r * 1.0, -r * 0.35);
  ctx.lineTo(r * 0.9, 0);
  ctx.lineTo(r * 1.0, r * 0.35);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  // Eye
  ctx.beginPath(); ctx.arc(-r * 0.55, -r * 0.1, r * 0.08, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill();
  // Blowhole spout
  ctx.beginPath();
  ctx.moveTo(-r * 0.15, -r * 0.5);
  ctx.lineTo(-r * 0.15, -r * 0.8);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = Math.max(1, r * 0.06);
  ctx.stroke();
}

function drawKraken(ctx, r, color) {
  // Central body
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  // Tentacles
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    ctx.save();
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(r * 0.35, 0);
    ctx.quadraticCurveTo(r * 0.75, -r * 0.25, r * 0.9, 0);
    ctx.quadraticCurveTo(r * 0.75, r * 0.25, r * 0.55, r * 0.1);
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2, r * 0.12);
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();
  }
  // Eye
  ctx.beginPath(); ctx.arc(0, -r * 0.1, r * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = '#ff0000'; ctx.fill();
}

function drawLeviathan(ctx, r, color) {
  // Serpentine S-curve (simplified as 3 overlapping circles)
  ctx.beginPath(); ctx.arc(-r * 0.4, r * 0.25, r * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();
  ctx.beginPath(); ctx.arc(0, -r * 0.15, r * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();
  ctx.beginPath(); ctx.arc(r * 0.4, r * 0.2, r * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();
  // Spikes
  ctx.beginPath(); ctx.moveTo(0, -r * 0.55); ctx.lineTo(r * 0.12, -r * 0.75); ctx.lineTo(-r * 0.12, -r * 0.75); ctx.closePath();
  ctx.fillStyle = color; ctx.fill();
  // Eye on head
  ctx.beginPath(); ctx.arc(0, -r * 0.2, r * 0.08, 0, Math.PI * 2);
  ctx.fillStyle = '#00ffff'; ctx.fill();
}

function drawPoseidon(ctx, r, color) {
  // Trident shape
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.9);
  ctx.lineTo(0, r * 0.6);
  ctx.lineWidth = Math.max(2, r * 0.12);
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.stroke();
  // Prongs
  const prongY = -r * 0.9;
  ctx.beginPath(); ctx.moveTo(-r * 0.45, prongY + r * 0.35); ctx.lineTo(-r * 0.45, prongY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, prongY + r * 0.2); ctx.lineTo(0, prongY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(r * 0.45, prongY + r * 0.35); ctx.lineTo(r * 0.45, prongY); ctx.stroke();
  // Crossbar
  ctx.beginPath(); ctx.moveTo(-r * 0.5, prongY + r * 0.35); ctx.lineTo(r * 0.5, prongY + r * 0.35); ctx.stroke();
  // Orb
  ctx.beginPath(); ctx.arc(0, r * 0.5, r * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = '#ffd700'; ctx.fill();
}

function drawOcean(ctx, r, color) {
  // Large circle with wave lines
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  for (let i = 0; i < 3; i++) {
    const wy = (-0.3 + i * 0.3) * r;
    ctx.beginPath();
    ctx.moveTo(-r * 0.6, wy);
    ctx.quadraticCurveTo(-r * 0.2, wy - r * 0.15, r * 0.2, wy);
    ctx.quadraticCurveTo(r * 0.6, wy + r * 0.15, r * 0.8, wy);
    ctx.strokeStyle = 'rgba(0,255,255,0.25)';
    ctx.lineWidth = Math.max(1, r * 0.08);
    ctx.stroke();
  }
}

function drawAbyss(ctx, r) {
  // Dark void
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = '#000000';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
  ctx.fillStyle = '#1a0033';
  ctx.fill();
  // Teeth ring
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    ctx.save(); ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(r * 0.65, -r * 0.08);
    ctx.lineTo(r * 0.9, 0);
    ctx.lineTo(r * 0.65, r * 0.08);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fill();
    ctx.restore();
  }
}

function drawChaosFish(ctx, r, color) {
  // Abstract many-eyed blob
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  const eyes = [[-0.35, -0.25], [0.3, -0.3], [0.1, 0.25], [-0.2, 0.3]];
  for (const [ex, ey] of eyes) {
    ctx.beginPath(); ctx.arc(ex * r, ey * r, r * 0.12, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.beginPath(); ctx.arc(ex * r, ey * r, r * 0.05, 0, Math.PI * 2);
    ctx.fillStyle = '#ff0000'; ctx.fill();
  }
}

// ────────────────────
// DICE
// ────────────────────
function drawDiceShape(ctx, name, r, color) {
  const pips = getDicePips(name);
  const sides = getDiceSides(name);
  drawDiceFace(ctx, r, color, pips, sides);
}

function getDicePips(name) {
  const map = { d4: 4, d6: 6, d8: 8, d10: 10, d12: 12, d20: 20, mythic: 1, legendary: 2, cosmic: 3, divine: 4, fate: 5, destiny: 6, creator: 7 };
  return map[name] || 1;
}

function getDiceSides(name) {
  const map = { d4: 4, d6: 6, d8: 8, d10: 10, d12: 12, d20: 20 };
  return map[name] || 20;
}

function drawDiceFace(ctx, r, color, pips, sides) {
  // Rounded square body
  const cr = r * 0.2;
  ctx.beginPath();
  ctx.roundRect(-r * 0.8, -r * 0.8, r * 1.6, r * 1.6, cr);
  ctx.fillStyle = color;
  ctx.fill();
  // Border
  ctx.beginPath();
  ctx.roundRect(-r * 0.8, -r * 0.8, r * 1.6, r * 1.6, cr);
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = Math.max(1, r * 0.06);
  ctx.stroke();
  // Pip positions for standard 1-7 patterns
  const positions = [
    [[0, 0]],
    [[-0.35, -0.35], [0.35, 0.35]],
    [[-0.35, -0.35], [0, 0], [0.35, 0.35]],
    [[-0.35, -0.35], [0.35, -0.35], [-0.35, 0.35], [0.35, 0.35]],
    [[-0.35, -0.35], [0.35, -0.35], [0, 0], [-0.35, 0.35], [0.35, 0.35]],
    [[-0.35, -0.35], [0.35, -0.35], [-0.35, 0], [0.35, 0], [-0.35, 0.35], [0.35, 0.35]],
    [[-0.35, -0.35], [0.35, -0.35], [-0.35, 0], [0, 0], [0.35, 0], [-0.35, 0.35], [0.35, 0.35]],
  ];
  const layout = positions[Math.min(pips, 7) - 1] || positions[0];
  for (const [px, py] of layout) {
    ctx.beginPath();
    ctx.arc(px * r, py * r, r * 0.12, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fill();
  }
  // Number text for d10+ faces
  if (sides >= 10) {
    ctx.save();
    ctx.font = `bold ${Math.floor(r * 0.35)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText(sides.toString(), 0, 0);
    ctx.restore();
  }
}

// ────────────────────
// DUNGEON
// ────────────────────
function drawDungeonShape(ctx, name, r, color) {
  switch (name) {
    case 'stick':      drawSword(ctx, r, '#8b4513', true); break;
    case 'sword':      drawSword(ctx, r, '#c0c0c0', false); break;
    case 'magic':      drawMagicSword(ctx, r, '#4169e1'); break;
    case 'epic':       drawEpicSword(ctx, r, '#9400d3'); break;
    case 'legendary':  drawLegendarySword(ctx, r, '#ffd700'); break;
    case 'excalibur':  drawExcalibur(ctx, r, '#00ffff'); break;
    case 'relic':      drawRelic(ctx, r, '#ff4500'); break;
    case 'artifact':   drawArtifact(ctx, r, '#ff00ff'); break;
    case 'primordial': drawPrimordial(ctx, r, '#ffffff'); break;
    case 'celestial':  drawCelestialWeapon(ctx, r, '#00ffff'); break;
    case 'godforged':  drawGodforged(ctx, r, '#9400d3'); break;
    case 'infinity':   drawInfinityWeapon(ctx, r, '#ff00ff'); break;
    case 'omnipotence': drawOmnipotence(ctx, r); break;
    default: drawSword(ctx, r, color, false); break;
  }
}

function drawSword(ctx, r, color, isStick) {
  // Blade
  ctx.beginPath();
  ctx.moveTo(-r * 0.12, -r * 0.85);
  ctx.lineTo(0, -r);
  ctx.lineTo(r * 0.12, -r * 0.85);
  ctx.lineTo(r * 0.1, r * 0.25);
  ctx.lineTo(-r * 0.1, r * 0.25);
  ctx.closePath();
  ctx.fillStyle = isStick ? '#a0522d' : '#dcdcdc';
  ctx.fill();
  // Guard
  ctx.beginPath();
  ctx.moveTo(-r * 0.55, r * 0.25);
  ctx.lineTo(r * 0.55, r * 0.25);
  ctx.lineTo(r * 0.5, r * 0.4);
  ctx.lineTo(-r * 0.5, r * 0.4);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  // Hilt
  ctx.beginPath();
  ctx.roundRect(-r * 0.1, r * 0.4, r * 0.2, r * 0.45, r * 0.03);
  ctx.fillStyle = '#8b4513';
  ctx.fill();
  // Pommel
  ctx.beginPath();
  ctx.arc(0, r * 0.9, r * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawMagicSword(ctx, r, color) {
  drawSword(ctx, r, color, false);
  // Magic glow line on blade
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.85); ctx.lineTo(0, r * 0.15);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, r * 0.06);
  ctx.stroke();
}

function drawEpicSword(ctx, r, color) {
  drawSword(ctx, r, color, false);
  // Crossguard gems
  ctx.beginPath(); ctx.arc(-r * 0.35, r * 0.32, r * 0.08, 0, Math.PI * 2); ctx.fillStyle = '#ff0000'; ctx.fill();
  ctx.beginPath(); ctx.arc(r * 0.35, r * 0.32, r * 0.08, 0, Math.PI * 2); ctx.fillStyle = '#00ffff'; ctx.fill();
}

function drawLegendarySword(ctx, r, color) {
  drawSword(ctx, r, color, false);
  // Winged guard
  ctx.beginPath();
  ctx.moveTo(-r * 0.55, r * 0.3);
  ctx.quadraticCurveTo(-r * 0.9, r * 0.1, -r * 0.75, r * 0.45);
  ctx.lineTo(-r * 0.45, r * 0.4);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(r * 0.55, r * 0.3);
  ctx.quadraticCurveTo(r * 0.9, r * 0.1, r * 0.75, r * 0.45);
  ctx.lineTo(r * 0.45, r * 0.4);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawExcalibur(ctx, r, color) {
  drawSword(ctx, r, color, false);
  // Halo above blade
  ctx.beginPath();
  ctx.ellipse(0, -r * 1.05, r * 0.35, r * 0.08, 0, 0, Math.PI * 2);
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = Math.max(1, r * 0.06);
  ctx.stroke();
}

function drawRelic(ctx, r, color) {
  // Shield shape
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.quadraticCurveTo(r * 0.9, -r * 0.4, r * 0.75, r * 0.25);
  ctx.lineTo(0, r * 0.85);
  ctx.lineTo(-r * 0.75, r * 0.25);
  ctx.quadraticCurveTo(-r * 0.9, -r * 0.4, 0, -r);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  // Border
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.quadraticCurveTo(r * 0.9, -r * 0.4, r * 0.75, r * 0.25);
  ctx.lineTo(0, r * 0.85);
  ctx.lineTo(-r * 0.75, r * 0.25);
  ctx.quadraticCurveTo(-r * 0.9, -r * 0.4, 0, -r);
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = Math.max(1, r * 0.08);
  ctx.stroke();
  // Center emblem
  ctx.beginPath(); ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2);
  ctx.fillStyle = '#ffd700'; ctx.fill();
}

function drawArtifact(ctx, r, color) {
  // Chest variant
  drawChest(ctx, r, '#4b0082');
  // Glow aura
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.1, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, r * 0.06);
  ctx.stroke();
}

function drawPrimordial(ctx, r, color) {
  // Glowing orb
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  // Inner rune circle
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = Math.max(1, r * 0.06);
  ctx.stroke();
  // Cross
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.35); ctx.lineTo(0, r * 0.35);
  ctx.moveTo(-r * 0.35, 0); ctx.lineTo(r * 0.35, 0);
  ctx.strokeStyle = '#ffd700';
  ctx.stroke();
}

function drawCelestialWeapon(ctx, r, color) {
  // Spear
  ctx.beginPath();
  ctx.moveTo(-r * 0.08, -r);
  ctx.lineTo(r * 0.08, -r);
  ctx.lineTo(r * 0.06, r * 0.7);
  ctx.lineTo(-r * 0.06, r * 0.7);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  // Blade wings
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.75);
  ctx.lineTo(-r * 0.45, -r * 0.35);
  ctx.lineTo(0, -r * 0.5);
  ctx.lineTo(r * 0.45, -r * 0.35);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();
}

function drawGodforged(ctx, r, color) {
  // Hammer
  ctx.beginPath();
  ctx.moveTo(-r * 0.08, -r * 0.85);
  ctx.lineTo(r * 0.08, -r * 0.85);
  ctx.lineTo(r * 0.06, r * 0.75);
  ctx.lineTo(-r * 0.06, r * 0.75);
  ctx.closePath();
  ctx.fillStyle = '#8b4513';
  ctx.fill();
  // Head
  ctx.beginPath();
  ctx.roundRect(-r * 0.65, -r * 0.85, r * 1.3, r * 0.35, r * 0.05);
  ctx.fillStyle = color;
  ctx.fill();
  // Spark
  ctx.beginPath(); ctx.arc(r * 0.55, -r * 0.65, r * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = '#ffd700'; ctx.fill();
}

function drawInfinityWeapon(ctx, r, color) {
  // Infinity bow
  ctx.beginPath();
  ctx.moveTo(-r * 0.6, -r * 0.8);
  ctx.quadraticCurveTo(r * 0.4, -r * 0.4, r * 0.6, 0);
  ctx.quadraticCurveTo(r * 0.4, r * 0.4, -r * 0.6, r * 0.8);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, r * 0.12);
  ctx.lineCap = 'round';
  ctx.stroke();
  // String
  ctx.beginPath();
  ctx.moveTo(-r * 0.6, -r * 0.8); ctx.lineTo(-r * 0.6, r * 0.8);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = Math.max(1, r * 0.06);
  ctx.stroke();
}

function drawOmnipotence(ctx, r) {
  // Dark crown with eye
  ctx.beginPath();
  ctx.moveTo(-r, r * 0.3);
  ctx.lineTo(-r, -r * 0.2);
  ctx.lineTo(-r * 0.6, -r * 0.55);
  ctx.lineTo(-r * 0.2, -r * 0.2);
  ctx.lineTo(r * 0.2, -r * 0.55);
  ctx.lineTo(r * 0.6, -r * 0.2);
  ctx.lineTo(r, -r * 0.2);
  ctx.lineTo(r, r * 0.3);
  ctx.closePath();
  ctx.fillStyle = '#1a1a2e';
  ctx.fill();
  // Central eye
  ctx.beginPath(); ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
  ctx.fillStyle = '#ff0000'; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, r * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = '#0a0a0f'; ctx.fill();
}

// ────────────────────
// WIZARD
// ────────────────────
function drawWizardShape(ctx, name, r, color) {
  switch (name) {
    case 'hat':       drawWizardHat(ctx, r, '#4b0082'); break;
    case 'book':      drawSpellBook(ctx, r, '#8b4513'); break;
    case 'staff':     drawStaff(ctx, r, '#696969'); break;
    case 'mage':      drawMage(ctx, r, '#4169e1'); break;
    case 'archmage':  drawArchmage(ctx, r, '#9400d3'); break;
    case 'dragon':    drawTinyDragon(ctx, r, '#dc143c'); break;
    case 'lich':      drawLich(ctx, r, '#00ffff'); break;
    case 'demigod':   drawDemigod(ctx, r, '#ffd700'); break;
    case 'titan':     drawTitan(ctx, r, '#ff00ff'); break;
    case 'elder':     drawElder(ctx, r, '#ffffff'); break;
    case 'primal':    drawPrimal(ctx, r, '#00ffff'); break;
    case 'cosmic':    drawCosmicWizard(ctx, r, '#9400d3'); break;
    case 'overlord':  drawOverlord(ctx, r, '#ff00ff'); break;
    default: drawWizardHat(ctx, r, color); break;
  }
}

function drawWizardHat(ctx, r, color) {
  // Cone
  ctx.beginPath();
  ctx.moveTo(-r * 0.85, r * 0.35);
  ctx.quadraticCurveTo(-r * 0.35, -r * 0.55, 0, -r);
  ctx.quadraticCurveTo(r * 0.35, -r * 0.55, r * 0.85, r * 0.35);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  // Brim
  ctx.beginPath();
  ctx.ellipse(0, r * 0.35, r * 0.9, r * 0.18, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  // Band
  ctx.beginPath();
  ctx.ellipse(0, r * 0.15, r * 0.55, r * 0.1, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#ffd700';
  ctx.fill();
}

function drawSpellBook(ctx, r, color) {
  // Cover
  ctx.beginPath();
  ctx.roundRect(-r * 0.65, -r * 0.75, r * 1.3, r * 1.5, r * 0.08);
  ctx.fillStyle = color;
  ctx.fill();
  // Pages edge
  ctx.beginPath();
  ctx.roundRect(-r * 0.55, -r * 0.7, r * 1.1, r * 1.4, r * 0.05);
  ctx.fillStyle = '#f5deb3';
  ctx.fill();
  // Spine
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.75); ctx.lineTo(0, r * 0.75);
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = Math.max(1, r * 0.08);
  ctx.stroke();
  // Rune
  ctx.save();
  ctx.font = `bold ${Math.floor(r * 0.45)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillText('✦', -r * 0.25, 0);
  ctx.fillText('✦', r * 0.25, 0);
  ctx.restore();
}

function drawStaff(ctx, r, color) {
  // Shaft
  ctx.beginPath();
  ctx.roundRect(-r * 0.08, -r, r * 0.16, r * 1.9, r * 0.03);
  ctx.fillStyle = color;
  ctx.fill();
  // Orb
  ctx.beginPath(); ctx.arc(0, -r * 0.75, r * 0.28, 0, Math.PI * 2);
  ctx.fillStyle = '#00ffff'; ctx.fill();
  // Base
  ctx.beginPath();
  ctx.roundRect(-r * 0.25, r * 0.8, r * 0.5, r * 0.15, r * 0.03);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawMage(ctx, r, color) {
  // Robed figure (triangle body + circle head)
  ctx.beginPath();
  ctx.arc(0, -r * 0.35, r * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = '#ffdbac';
  ctx.fill();
  // Hood
  ctx.beginPath();
  ctx.arc(0, -r * 0.4, r * 0.42, Math.PI, 0);
  ctx.fillStyle = color;
  ctx.fill();
  // Body
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, -r * 0.05);
  ctx.lineTo(r * 0.5, -r * 0.05);
  ctx.lineTo(r * 0.35, r * 0.75);
  ctx.lineTo(-r * 0.35, r * 0.75);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  // Wand tip
  ctx.beginPath(); ctx.arc(r * 0.65, r * 0.15, r * 0.1, 0, Math.PI * 2);
  ctx.fillStyle = '#ffd700'; ctx.fill();
}

function drawArchmage(ctx, r, color) {
  drawMage(ctx, r, color);
  // Extra staff
  ctx.beginPath();
  ctx.roundRect(-r * 0.55, -r * 0.2, r * 0.1, r * 1.1, r * 0.02);
  ctx.fillStyle = '#ffd700';
  ctx.fill();
  ctx.beginPath(); ctx.arc(-r * 0.5, -r * 0.35, r * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = '#00ffff'; ctx.fill();
}

function drawTinyDragon(ctx, r, color) {
  // Body
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.6, r * 0.4, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  // Head
  ctx.beginPath();
  ctx.arc(-r * 0.45, -r * 0.2, r * 0.32, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  // Eye
  ctx.beginPath(); ctx.arc(-r * 0.55, -r * 0.25, r * 0.08, 0, Math.PI * 2);
  ctx.fillStyle = '#ffd700'; ctx.fill();
  // Wings
  ctx.beginPath();
  ctx.moveTo(r * 0.1, -r * 0.25);
  ctx.quadraticCurveTo(r * 0.65, -r * 0.75, r * 0.55, -r * 0.1);
  ctx.quadraticCurveTo(r * 0.45, r * 0.15, r * 0.1, 0);
  ctx.closePath();
  ctx.fillStyle = '#8b0000';
  ctx.fill();
  // Tail
  ctx.beginPath();
  ctx.moveTo(r * 0.55, r * 0.1);
  ctx.quadraticCurveTo(r * 0.9, r * 0.35, r * 0.75, r * 0.55);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, r * 0.1);
  ctx.lineCap = 'round';
  ctx.stroke();
}

function drawLich(ctx, r, color) {
  // Skull shape
  ctx.beginPath();
  ctx.arc(0, -r * 0.15, r * 0.55, 0, Math.PI * 2);
  ctx.fillStyle = '#e0e0e0';
  ctx.fill();
  // Eye sockets
  ctx.beginPath(); ctx.arc(-r * 0.2, -r * 0.2, r * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = '#0a0a0f'; ctx.fill();
  ctx.beginPath(); ctx.arc(r * 0.2, -r * 0.2, r * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = '#0a0a0f'; ctx.fill();
  // Glowing eyes
  ctx.beginPath(); ctx.arc(-r * 0.2, -r * 0.2, r * 0.06, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();
  ctx.beginPath(); ctx.arc(r * 0.2, -r * 0.2, r * 0.06, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();
  // Crown
  ctx.beginPath();
  ctx.moveTo(-r * 0.55, -r * 0.5);
  ctx.lineTo(-r * 0.35, -r * 0.85);
  ctx.lineTo(0, -r * 0.65);
  ctx.lineTo(r * 0.35, -r * 0.85);
  ctx.lineTo(r * 0.55, -r * 0.5);
  ctx.closePath();
  ctx.fillStyle = '#4b0082';
  ctx.fill();
}

function drawDemigod(ctx, r, color) {
  // Glowing humanoid
  ctx.beginPath();
  ctx.arc(0, -r * 0.3, r * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = '#ffdbac';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-r * 0.4, -r * 0.05);
  ctx.lineTo(r * 0.4, -r * 0.05);
  ctx.lineTo(r * 0.25, r * 0.7);
  ctx.lineTo(-r * 0.25, r * 0.7);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  // Halo
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.75, r * 0.45, r * 0.1, 0, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, r * 0.08);
  ctx.stroke();
}

function drawTitan(ctx, r, color) {
  // Large armored figure
  ctx.beginPath();
  ctx.arc(0, -r * 0.25, r * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = '#a9a9a9';
  ctx.fill();
  // Shoulders
  ctx.beginPath();
  ctx.moveTo(-r * 0.75, -r * 0.05);
  ctx.lineTo(r * 0.75, -r * 0.05);
  ctx.lineTo(r * 0.55, r * 0.65);
  ctx.lineTo(-r * 0.55, r * 0.65);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  // Core gem
  ctx.beginPath(); ctx.arc(0, r * 0.25, r * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = '#ffd700'; ctx.fill();
}

function drawElder(ctx, r, color) {
  // Ethereal orb with many eyes
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fill();
  const eyes = [[-0.35, -0.25], [0.3, -0.3], [0, 0.35], [-0.25, 0.25], [0.35, 0.15]];
  for (const [ex, ey] of eyes) {
    ctx.beginPath(); ctx.arc(ex * r, ey * r, r * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.beginPath(); ctx.arc(ex * r, ey * r, r * 0.04, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0a0f'; ctx.fill();
  }
}

function drawPrimal(ctx, r, color) {
  // Flame shape
  ctx.beginPath();
  ctx.moveTo(-r * 0.25, r * 0.45);
  ctx.quadraticCurveTo(-r * 0.55, -r * 0.15, -r * 0.15, -r * 0.55);
  ctx.quadraticCurveTo(0, -r, r * 0.15, -r * 0.55);
  ctx.quadraticCurveTo(r * 0.55, -r * 0.15, r * 0.25, r * 0.45);
  ctx.quadraticCurveTo(0, r * 0.75, -r * 0.25, r * 0.45);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  // Inner flame
  ctx.beginPath();
  ctx.moveTo(-r * 0.12, r * 0.25);
  ctx.quadraticCurveTo(-r * 0.3, -r * 0.05, 0, -r * 0.35);
  ctx.quadraticCurveTo(r * 0.3, -r * 0.05, r * 0.12, r * 0.25);
  ctx.quadraticCurveTo(0, r * 0.45, -r * 0.12, r * 0.25);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();
}

function drawCosmicWizard(ctx, r, color) {
  // Galaxy-hat wizard silhouette
  ctx.beginPath();
  ctx.arc(0, -r * 0.2, r * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = '#ffdbac';
  ctx.fill();
  // Starry hat
  ctx.beginPath();
  ctx.moveTo(-r * 0.7, r * 0.05);
  ctx.quadraticCurveTo(-r * 0.25, -r * 0.55, 0, -r * 0.9);
  ctx.quadraticCurveTo(r * 0.25, -r * 0.55, r * 0.7, r * 0.05);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  // Stars on hat
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-r * 0.25, -r * 0.35, r * 0.05, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(r * 0.15, -r * 0.55, r * 0.04, 0, Math.PI * 2); ctx.fill();
}

function drawOverlord(ctx, r, color) {
  // Dark throne silhouette
  ctx.beginPath();
  ctx.moveTo(-r * 0.55, r * 0.75);
  ctx.lineTo(-r * 0.55, -r * 0.35);
  ctx.lineTo(-r * 0.25, -r * 0.65);
  ctx.lineTo(0, -r * 0.45);
  ctx.lineTo(r * 0.25, -r * 0.65);
  ctx.lineTo(r * 0.55, -r * 0.35);
  ctx.lineTo(r * 0.55, r * 0.75);
  ctx.closePath();
  ctx.fillStyle = '#1a0033';
  ctx.fill();
  // Orb of power
  ctx.beginPath(); ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();
}

// ────────────────────
// CAT
// ────────────────────
function drawCatShape(ctx, name, r, color) {
  switch (name) {
    case 'kitten':    drawCatHead(ctx, r, '#ffa500', true); break;
    case 'housecat':  drawCatHead(ctx, r, '#ff8c00', false); break;
    case 'fatcat':    drawFatCat(ctx, r, '#ff6347'); break;
    case 'lion':      drawLion(ctx, r, '#ffd700'); break;
    case 'tiger':     drawTiger(ctx, r, '#ff4500'); break;
    case 'panther':   drawPanther(ctx, r, '#000000'); break;
    case 'sphinx':    drawSphinxCat(ctx, r, '#9400d3'); break;
    case 'chimera':   drawChimera(ctx, r, '#00ffff'); break;
    case 'griffin':   drawGriffin(ctx, r, '#ffd700'); break;
    case 'dragoncat': drawDragonCat(ctx, r, '#ff00ff'); break;
    case 'deity':     drawCatDeity(ctx, r, '#ffffff'); break;
    case 'cosmic':    drawCosmicCat(ctx, r, '#00ffff'); break;
    case 'meowthulhu': drawMeowthulhu(ctx, r); break;
    default: drawCatHead(ctx, r, color, false); break;
  }
}

function drawCatHead(ctx, r, color, isKitten) {
  // Head circle
  ctx.beginPath();
  ctx.arc(0, r * 0.05, r * 0.72, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  // Left ear
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, -r * 0.55);
  ctx.lineTo(-r * 0.75, -r * 0.95);
  ctx.lineTo(-r * 0.15, -r * 0.65);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  // Right ear
  ctx.beginPath();
  ctx.moveTo(r * 0.5, -r * 0.55);
  ctx.lineTo(r * 0.75, -r * 0.95);
  ctx.lineTo(r * 0.15, -r * 0.65);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  // Inner ears
  ctx.beginPath(); ctx.moveTo(-r * 0.5, -r * 0.6); ctx.lineTo(-r * 0.65, -r * 0.82); ctx.lineTo(-r * 0.25, -r * 0.68); ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(r * 0.5, -r * 0.6); ctx.lineTo(r * 0.65, -r * 0.82); ctx.lineTo(r * 0.25, -r * 0.68); ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fill();
  // Eyes
  ctx.beginPath(); ctx.arc(-r * 0.25, -r * 0.05, r * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
  ctx.beginPath(); ctx.arc(r * 0.25, -r * 0.05, r * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
  // Pupils
  const pupilW = isKitten ? r * 0.1 : r * 0.06;
  ctx.beginPath(); ctx.ellipse(-r * 0.25, -r * 0.05, pupilW, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#0a0a0f'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(r * 0.25, -r * 0.05, pupilW, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#0a0a0f'; ctx.fill();
  // Nose
  ctx.beginPath();
  ctx.moveTo(-r * 0.06, r * 0.1);
  ctx.lineTo(r * 0.06, r * 0.1);
  ctx.lineTo(0, r * 0.18);
  ctx.closePath();
  ctx.fillStyle = '#ff69b4'; ctx.fill();
  // Mouth
  ctx.beginPath();
  ctx.moveTo(0, r * 0.18);
  ctx.quadraticCurveTo(-r * 0.1, r * 0.32, -r * 0.18, r * 0.25);
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 1; ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, r * 0.18);
  ctx.quadraticCurveTo(r * 0.1, r * 0.32, r * 0.18, r * 0.25);
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 1; ctx.stroke();
  // Whiskers
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-r * 0.35, r * 0.08); ctx.lineTo(-r * 0.75, r * 0.0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-r * 0.35, r * 0.15); ctx.lineTo(-r * 0.75, r * 0.2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(r * 0.35, r * 0.08); ctx.lineTo(r * 0.75, r * 0.0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(r * 0.35, r * 0.15); ctx.lineTo(r * 0.75, r * 0.2); ctx.stroke();
}

function drawFatCat(ctx, r, color) {
  drawCatHead(ctx, r, color, false);
  // Chubby cheeks
  ctx.beginPath(); ctx.arc(-r * 0.55, r * 0.15, r * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();
  ctx.beginPath(); ctx.arc(r * 0.55, r * 0.15, r * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();
}

function drawLion(ctx, r, color) {
  drawCatHead(ctx, r, color, false);
  // Mane
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    ctx.save(); ctx.rotate(angle);
    ctx.beginPath(); ctx.ellipse(0, -r * 0.85, r * 0.18, r * 0.08, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#daa520'; ctx.fill();
    ctx.restore();
  }
}

function drawTiger(ctx, r, color) {
  drawCatHead(ctx, r, color, false);
  // Stripes
  ctx.fillStyle = '#0a0a0f';
  ctx.beginPath(); ctx.moveTo(-r * 0.15, -r * 0.55); ctx.lineTo(r * 0.05, -r * 0.45); ctx.lineTo(-r * 0.1, -r * 0.35); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(r * 0.15, -r * 0.55); ctx.lineTo(-r * 0.05, -r * 0.45); ctx.lineTo(r * 0.1, -r * 0.35); ctx.closePath(); ctx.fill();
}

function drawPanther(ctx, r, color) {
  drawCatHead(ctx, r, color, false);
  // Glowing eyes
  ctx.beginPath(); ctx.arc(-r * 0.25, -r * 0.05, r * 0.08, 0, Math.PI * 2);
  ctx.fillStyle = '#00ff00'; ctx.fill();
  ctx.beginPath(); ctx.arc(r * 0.25, -r * 0.05, r * 0.08, 0, Math.PI * 2);
  ctx.fillStyle = '#00ff00'; ctx.fill();
}

function drawSphinxCat(ctx, r, color) {
  drawCatHead(ctx, r, color, false);
  // Headdress
  ctx.beginPath();
  ctx.moveTo(-r * 0.85, -r * 0.25);
  ctx.lineTo(-r * 0.55, -r * 0.85);
  ctx.lineTo(r * 0.55, -r * 0.85);
  ctx.lineTo(r * 0.85, -r * 0.25);
  ctx.closePath();
  ctx.fillStyle = '#ffd700';
  ctx.fill();
}

function drawChimera(ctx, r, color) {
  // Three-headed suggestion: cat + snake + goat
  // Cat head
  drawCatHead(ctx, r * 0.65, color, false);
  // Snake on right
  ctx.beginPath();
  ctx.moveTo(r * 0.45, 0);
  ctx.quadraticCurveTo(r * 0.85, -r * 0.35, r * 0.75, r * 0.15);
  ctx.strokeStyle = '#32cd32';
  ctx.lineWidth = Math.max(2, r * 0.1);
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.beginPath(); ctx.arc(r * 0.75, r * 0.15, r * 0.1, 0, Math.PI * 2);
  ctx.fillStyle = '#32cd32'; ctx.fill();
  // Goat horn on left
  ctx.beginPath();
  ctx.moveTo(-r * 0.45, -r * 0.25);
  ctx.quadraticCurveTo(-r * 0.75, -r * 0.85, -r * 0.55, -r * 0.95);
  ctx.strokeStyle = '#a9a9a9';
  ctx.lineWidth = Math.max(2, r * 0.08);
  ctx.stroke();
}

function drawGriffin(ctx, r, color) {
  // Cat-eagle hybrid: cat face + beak + wings
  drawCatHead(ctx, r * 0.75, color, false);
  // Beak overlay
  ctx.beginPath();
  ctx.moveTo(-r * 0.08, r * 0.12);
  ctx.lineTo(r * 0.08, r * 0.12);
  ctx.lineTo(0, r * 0.35);
  ctx.closePath();
  ctx.fillStyle = '#ffd700'; ctx.fill();
  // Wing on right
  ctx.beginPath();
  ctx.moveTo(r * 0.35, -r * 0.15);
  ctx.quadraticCurveTo(r * 0.85, -r * 0.65, r * 0.65, r * 0.05);
  ctx.quadraticCurveTo(r * 0.55, r * 0.25, r * 0.35, 0);
  ctx.closePath();
  ctx.fillStyle = '#ffffff'; ctx.fill();
}

function drawDragonCat(ctx, r, color) {
  drawCatHead(ctx, r, color, false);
  // Dragon wings
  ctx.beginPath();
  ctx.moveTo(r * 0.35, -r * 0.1);
  ctx.quadraticCurveTo(r * 0.9, -r * 0.65, r * 0.75, r * 0.05);
  ctx.quadraticCurveTo(r * 0.65, r * 0.3, r * 0.4, r * 0.1);
  ctx.closePath();
  ctx.fillStyle = '#8b0000'; ctx.fill();
  // Flame breath
  ctx.beginPath();
  ctx.moveTo(0, r * 0.25);
  ctx.quadraticCurveTo(r * 0.35, r * 0.65, r * 0.15, r * 0.85);
  ctx.quadraticCurveTo(-r * 0.15, r * 0.65, 0, r * 0.25);
  ctx.closePath();
  ctx.fillStyle = '#ff4500'; ctx.fill();
}

function drawCatDeity(ctx, r, color) {
  drawCatHead(ctx, r, color, false);
  // Halo
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.85, r * 0.55, r * 0.1, 0, 0, Math.PI * 2);
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = Math.max(1, r * 0.08);
  ctx.stroke();
  // Wings
  ctx.beginPath();
  ctx.moveTo(-r * 0.35, r * 0.05);
  ctx.quadraticCurveTo(-r * 0.9, -r * 0.35, -r * 0.75, r * 0.25);
  ctx.quadraticCurveTo(-r * 0.55, r * 0.45, -r * 0.35, r * 0.15);
  ctx.closePath();
  ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(r * 0.35, r * 0.05);
  ctx.quadraticCurveTo(r * 0.9, -r * 0.35, r * 0.75, r * 0.25);
  ctx.quadraticCurveTo(r * 0.55, r * 0.45, r * 0.35, r * 0.15);
  ctx.closePath();
  ctx.fillStyle = '#ffffff'; ctx.fill();
}

function drawCosmicCat(ctx, r, color) {
  drawCatHead(ctx, r, '#000033', false);
  // Starry eyes
  ctx.beginPath(); ctx.arc(-r * 0.25, -r * 0.05, r * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = '#00ffff'; ctx.fill();
  ctx.beginPath(); ctx.arc(r * 0.25, -r * 0.05, r * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = '#00ffff'; ctx.fill();
  // Galaxy swirl on forehead
  ctx.beginPath();
  ctx.arc(0, -r * 0.35, r * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = '#ff00ff'; ctx.fill();
}

function drawMeowthulhu(ctx, r) {
  // Tentacled cat horror
  drawCatHead(ctx, r, '#2d004d', false);
  // Tentacles instead of whiskers
  ctx.strokeStyle = '#4b0082';
  ctx.lineWidth = Math.max(2, r * 0.08);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-r * 0.35, r * 0.15);
  ctx.quadraticCurveTo(-r * 0.75, r * 0.55, -r * 0.55, r * 0.85);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(r * 0.35, r * 0.15);
  ctx.quadraticCurveTo(r * 0.75, r * 0.55, r * 0.55, r * 0.85);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, r * 0.25);
  ctx.quadraticCurveTo(0, r * 0.75, 0, r * 0.95);
  ctx.stroke();
  // Red eyes
  ctx.beginPath(); ctx.arc(-r * 0.25, -r * 0.05, r * 0.1, 0, Math.PI * 2);
  ctx.fillStyle = '#ff0000'; ctx.fill();
  ctx.beginPath(); ctx.arc(r * 0.25, -r * 0.05, r * 0.1, 0, Math.PI * 2);
  ctx.fillStyle = '#ff0000'; ctx.fill();
}

function randomShapeTier(maxTier = 2) {
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
