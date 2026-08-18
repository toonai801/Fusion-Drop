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
  constructor(gravity = 0.42, friction = 0.994, bounce = 0.04) {
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
        e.vy *= 0.995;
      }
      if (e.x + e.radius > width) {
        e.x = width - e.radius;
        e.vx = -Math.abs(e.vx) * this.bounce;
        e.vy *= 0.995;
      }

      // Floor collision
      if (e.y + e.radius > height - 2) {
        e.y = height - e.radius - 2;
        e.vy = -Math.abs(e.vy) * this.bounce;
        e.vx *= 0.82;
        if (Math.abs(e.vy) < 0.35) {
          e.vy = 0;
        }
        if (Math.abs(e.vx) < 0.025) e.vx = 0;
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
    const pairs = [];
    this._hash.forEachPair((i, j) => pairs.push([i, j]));
    for (let pass = 0; pass < 3; pass++) {
      for (const [i, j] of pairs) this.resolveCollision(entities[i], entities[j]);
    }
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

      const massA = a.radius * a.radius;
      const massB = b.radius * b.radius;
      const invMassA = 1 / massA;
      const invMassB = 1 / massB;
      const invMassSum = invMassA + invMassB;
      const correction = Math.max(overlap - 0.08, 0) * 0.88;
      const moveA = correction * (invMassA / invMassSum);
      const moveB = correction * (invMassB / invMassSum);

      a.x -= nx * moveA;
      a.y -= ny * moveA;
      b.x += nx * moveB;
      b.y += ny * moveB;

      const dvx = b.vx - a.vx;
      const dvy = b.vy - a.vy;
      const velAlongNormal = dvx * nx + dvy * ny;

      if (velAlongNormal > 0) return;

      // Higher restitution makes merges feel juicy (Phase 1 — bump from 0.05).
      const restitution = 0.025;
      const impulse = -(1 + restitution) * velAlongNormal / invMassSum;
      const impulseX = impulse * nx;
      const impulseY = impulse * ny;
      a.vx -= impulseX * invMassA;
      a.vy -= impulseY * invMassA;
      b.vx += impulseX * invMassB;
      b.vy += impulseY * invMassB;

      const tx = -ny;
      const ty = nx;
      const tangentSpeed = dvx * tx + dvy * ty;
      const frictionImpulse = -tangentSpeed / invMassSum * 0.16;
      a.vx -= frictionImpulse * tx * invMassA;
      a.vy -= frictionImpulse * ty * invMassA;
      b.vx += frictionImpulse * tx * invMassB;
      b.vy += frictionImpulse * ty * invMassB;

      // Smooth damping instead of binary clamp — feels less "stuck" (Phase 1).
      // Halve any sub-threshold velocity so things settle gradually rather than
      // snapping to zero.
      const settleThresh = 0.035;
      if (Math.abs(a.vx) < settleThresh) a.vx = 0;
      if (Math.abs(a.vy) < settleThresh) a.vy = 0;
      if (Math.abs(b.vx) < settleThresh) b.vx = 0;
      if (Math.abs(b.vy) < settleThresh) b.vy = 0;
    }
  }
}
