class Physics {
  constructor(gravity = 0.25, friction = 0.98, bounce = 0.4) {
    this.gravity = gravity;
    this.friction = friction;
    this.bounce = bounce;
  }

  update(entities, width, height) {
    const n = entities.length;

    for (const e of entities) {
      if (!e.active) continue;

      // Gravity
      e.vy += this.gravity;

      // Velocity
      e.x += e.vx;
      e.y += e.vy;

      // Friction
      e.vx *= this.friction;
      e.vy *= this.friction;

      // Wall collisions
      const r = e.radius;
      if (e.x - r < 0) {
        e.x = r;
        e.vx = Math.abs(e.vx) * this.bounce;
      }
      if (e.x + r > width) {
        e.x = width - r;
        e.vx = -Math.abs(e.vx) * this.bounce;
      }
      if (e.y + r > height) {
        e.y = height - r;
        e.vy = -Math.abs(e.vy) * this.bounce * 0.5;
        if (Math.abs(e.vy) < 0.3) e.vy = 0;
      }
    }

    // Entity-entity collisions (simple circle-circle)
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
      // Overlap
      const overlap = minDist - dist;
      const nx = dx / dist;
      const ny = dy / dist;

      // Separate
      const totalMass = a.radius + b.radius;
      const moveA = (b.radius / totalMass) * overlap * 0.5;
      const moveB = (a.radius / totalMass) * overlap * 0.5;

      a.x -= nx * moveA;
      a.y -= ny * moveA;
      b.x += nx * moveB;
      b.y += ny * moveB;

      // Bounce
      const dvx = b.vx - a.vx;
      const dvy = b.vy - a.vy;
      const impulse = (dvx * nx + dvy * ny) * 0.3;

      a.vx -= nx * impulse * (b.radius / totalMass);
      a.vy -= ny * impulse * (b.radius / totalMass);
      b.vx += nx * impulse * (a.radius / totalMass);
      b.vy += ny * impulse * (a.radius / totalMass);
    }
  }
}
