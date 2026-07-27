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

      // Floor friction - kill horizontal when resting
      if (e.y + e.radius >= height - 2 && Math.abs(e.vy) < 2) {
        e.vx *= 0.85;
        e.vy = 0; // Stop vertical when on floor
      }

      const r = e.radius;
      if (e.x - r < 0) {
        e.x = r;
        e.vx = Math.abs(e.vx) * this.bounce;
      }
      if (e.x + r > width) {
        e.x = width - r;
        e.vx = -Math.abs(e.vx) * this.bounce;
      }
      if (e.y + r > height - 2) {
        e.y = height - r - 2;
        e.vy = -Math.abs(e.vy) * this.bounce;
        if (Math.abs(e.vy) < 1.0) e.vy = 0;
        // Strong floor friction to prevent sliding through
        e.vx *= 0.8;
      }
    }

    // Entity-entity collisions
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        this.resolveCollision(entities[i], entities[j]);
      }
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

      // Very low restitution for calm stacking
      const restitution = 0.05;
      const impulse = velAlongNormal * -(1 + restitution) / totalMass;

      const impulseScale = 0.25;
      a.vx -= nx * impulse * b.radius * impulseScale;
      a.vy -= ny * impulse * b.radius * impulseScale;
      b.vx += nx * impulse * a.radius * impulseScale;
      b.vy += ny * impulse * a.radius * impulseScale;

      // Clamp tiny velocities
      const minVel = 0.015;
      if (Math.abs(a.vx) < minVel) a.vx = 0;
      if (Math.abs(a.vy) < minVel) a.vy = 0;
      if (Math.abs(b.vx) < minVel) b.vx = 0;
      if (Math.abs(b.vy) < minVel) b.vy = 0;
    }
  }
}
