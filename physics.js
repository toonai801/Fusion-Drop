// SpatialHash — uniform-grid broad-phase for entity-entity collisions.
// Cell size is set high enough that two entities in different non-adjacent
// cells cannot overlap. With max radius ≈78, cell size 150 (≈1.9× radius)
// keeps the invariant that an entity's overlap-test window is its own cell
// plus the 8 surrounding cells.
class SpatialHash {
  constructor(cellSize = 150) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  clear() {
    this.cells.clear();
  }

  _key(cx, cy) {
    return cx + ',' + cy;
  }

  insert(entity, index) {
    const cx = Math.floor(entity.x / this.cellSize);
    const cy = Math.floor(entity.y / this.cellSize);
    const k = this._key(cx, cy);
    let bucket = this.cells.get(k);
    if (!bucket) { bucket = []; this.cells.set(k, bucket); }
    bucket.push(index);
  }

  // Yield unique unordered pairs (i, j) with i<j that share or neighbor a cell.
  forEachPair(callback) {
    const seen = new Set();
    for (const [k, bucket] of this.cells) {
      // bucket may be large; iterate it and look at neighbors
      for (let p = 0; p < bucket.length; p++) {
        const i = bucket[p];
        for (let q = p + 1; q < bucket.length; q++) {
          const j = bucket[q];
          const pairKey = i < j ? i + ',' + j : j + ',' + i;
          if (!seen.has(pairKey)) {
            seen.add(pairKey);
            callback(i, j);
          }
        }
        // Neighbors
        const [cx, cy] = k.split(',').map(Number);
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            const nk = this._key(cx + dx, cy + dy);
            const nb = this.cells.get(nk);
            if (!nb) continue;
            for (let q = 0; q < nb.length; q++) {
              const j = nb[q];
              const pairKey = i < j ? i + ',' + j : j + ',' + i;
              if (!seen.has(pairKey)) {
                seen.add(pairKey);
                callback(i, j);
              }
            }
          }
        }
      }
    }
  }
}

class Physics {
  constructor(gravity = 0.3, friction = 0.985, bounce = 0.2) {
    this.gravity = gravity;
    this.friction = friction;
    this.bounce = bounce;
  }

  update(entities, width, height) {
    const n = entities.length;

    for (const e of entities) {
      if (!e.active) continue;

      e.vy += this.gravity;
      e.x += e.vx;
      e.y += e.vy;

      e.vx *= this.friction;
      e.vy *= this.friction;

      // Walls
      if (e.x - e.radius < 0) {
        e.x = e.radius;
        e.vx = Math.abs(e.vx) * this.bounce;
      }
      if (e.x + e.radius > width) {
        e.x = width - e.radius;
        e.vx = -Math.abs(e.vx) * this.bounce;
      }

      // Floor collision
      if (e.y + e.radius > height - 2) {
        e.y = height - e.radius - 2;
        e.vy = -Math.abs(e.vy) * this.bounce;
        if (Math.abs(e.vy) < 0.5) {
          e.vy = 0;
          e.vx *= 0.9; // Friction when resting
        }
      }
    }

    // Entity-entity collisions (spatial-hash broad-phase).
    // Same O(N²) worst case but ~O(N) at typical stacks. With 50 entities
    // previously 1225 pair checks/frame; with the hash, ~50 checks/frame.
    if (!this._hash) this._hash = new SpatialHash();
    this._hash.clear();
    for (let i = 0; i < n; i++) {
      if (entities[i].active) this._hash.insert(entities[i], i);
    }
    this._hash.forEachPair((i, j) => {
      this.resolveCollision(entities[i], entities[j]);
    });
  }

  resolveCollision(a, b) {
    if (!a.active || !b.active) return;

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = a.radius + b.radius;

    if (dist < minDist && dist > 0.001) {
      const overlap = minDist - dist;
      const nx = dx / dist;
      const ny = dy / dist;

      const totalMass = a.radius + b.radius;
      const moveA = (b.radius / totalMass) * overlap * 0.5 + 0.02;
      const moveB = (a.radius / totalMass) * overlap * 0.5 + 0.02;

      a.x -= nx * moveA;
      a.y -= ny * moveA;
      b.x += nx * moveB;
      b.y += ny * moveB;

      const dvx = b.vx - a.vx;
      const dvy = b.vy - a.vy;
      const velAlongNormal = dvx * nx + dvy * ny;

      if (velAlongNormal > 0) return;

      // Higher restitution makes merges feel juicy (Phase 1 — bump from 0.05).
      const restitution = 0.25;
      const impulse = velAlongNormal * -(1 + restitution) / totalMass;

      const impulseScale = 0.25;
      a.vx -= nx * impulse * b.radius * impulseScale;
      a.vy -= ny * impulse * b.radius * impulseScale;
      b.vx += nx * impulse * a.radius * impulseScale;
      b.vy += ny * impulse * a.radius * impulseScale;

      // Smooth damping instead of binary clamp — feels less "stuck" (Phase 1).
      // Halve any sub-threshold velocity so things settle gradually rather than
      // snapping to zero.
      const settleThresh = 0.08;
      if (Math.abs(a.vx) < settleThresh) a.vx *= 0.5;
      if (Math.abs(a.vy) < settleThresh) a.vy *= 0.5;
      if (Math.abs(b.vx) < settleThresh) b.vx *= 0.5;
      if (Math.abs(b.vy) < settleThresh) b.vy *= 0.5;
    }
  }
}
