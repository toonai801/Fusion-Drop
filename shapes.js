const SHAPES = [
  { name: 'spark',       radius: 25, color: '#00d4ff', glow: '#00f0ff', score: 2,   tier: 0 },
  { name: 'ember',       radius: 32, color: '#0099cc', glow: '#00d4ff', score: 4,   tier: 1 },
  { name: 'crystal',     radius: 40, color: '#3366ff', glow: '#6699ff', score: 8,   tier: 2 },
  { name: 'shard',       radius: 48, color: '#6633cc', glow: '#9966ff', score: 16,  tier: 3 },
  { name: 'prism',       radius: 56, color: '#9933ff', glow: '#cc66ff', score: 32,  tier: 4 },
  { name: 'nexus',       radius: 65, color: '#cc3399', glow: '#ff66cc', score: 64,  tier: 5 },
  { name: 'singularity', radius: 78, color: '#ff0066', glow: '#ff3399', score: 128, tier: 6 },
];

function drawShape(ctx, x, y, shapeType, scale = 1, shapes = null) {
  // Use provided shapes array or fall back to global SHAPES for backwards compatibility
  const shapeList = shapes || SHAPES;
  const s = shapeList[shapeType];
  if (!s) return;

  const r = s.radius * scale;
  ctx.save();
  ctx.translate(x, y);

  // Glow effect
  ctx.shadowBlur = 15 * scale;
  ctx.shadowColor = s.glow;

  // Draw based on shape type
  switch (s.name) {
    case 'spark':
      drawSpark(ctx, r, s.color);
      break;
    case 'ember':
      drawEmber(ctx, r, s.color);
      break;
    case 'crystal':
      drawCrystal(ctx, r, s.color);
      break;
    case 'shard':
      drawShard(ctx, r, s.color);
      break;
    case 'prism':
      drawPrism(ctx, r, s.color);
      break;
    case 'nexus':
      drawNexus(ctx, r, s.color);
      break;
    case 'singularity':
      drawSingularity(ctx, r, s.color);
      break;
    default:
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.fill();
  }

  ctx.restore();
}

function drawSpark(ctx, r, color) {
  // Small 4-point star
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 - Math.PI / 2;
    const innerAngle = ((i + 0.5) / 4) * Math.PI * 2 - Math.PI / 2;
    if (i === 0) {
      ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
    } else {
      ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    ctx.lineTo(Math.cos(innerAngle) * r * 0.4, Math.sin(innerAngle) * r * 0.4);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawEmber(ctx, r, color) {
  // Hexagon
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
  
  // Inner hexagon
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const px = Math.cos(angle) * r * 0.6;
    const py = Math.sin(angle) * r * 0.6;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fill();
}

function drawCrystal(ctx, r, color) {
  // Diamond with facets
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r * 0.7, 0);
  ctx.lineTo(0, r);
  ctx.lineTo(-r * 0.7, 0);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  
  // Facet lines
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(0, r);
  ctx.moveTo(-r * 0.7, 0);
  ctx.lineTo(r * 0.7, 0);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawShard(ctx, r, color) {
  // Octahedron (8-sided)
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  
  // Inner octagon
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 - Math.PI / 2 + Math.PI / 8;
    const px = Math.cos(angle) * r * 0.5;
    const py = Math.sin(angle) * r * 0.5;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fill();
}

function drawPrism(ctx, r, color) {
  // Dodecahedron-like (12 sides simplified)
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  
  // Star pattern inside
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const px = Math.cos(angle) * r * 0.6;
    const py = Math.sin(angle) * r * 0.6;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawNexus(ctx, r, color) {
  // Complex crystal with outer ring
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  
  // Inner ring of triangles
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
  
  // Center core
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fill();
}

function drawSingularity(ctx, r, color) {
  // Swirling singularity
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  
  // Spiral arms
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
  
  // Bright center
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fill();
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
