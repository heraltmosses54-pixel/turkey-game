// Gobble Run — the turkey. Physics, squash-and-stretch, stumble and the
// dust it kicks up. The turkey never moves on screen: the world scrolls
// past it; its x stays fixed and the farmer closes the gap behind it.

import { RUN, VIEW } from './config.js';

export function createTurkey(audio) {
  const turkey = {
    x: 300,
    y: VIEW.groundY,
    vy: 0,
    width: 74,
    height: 66,
    onGround: true,
    jumps: 0,
    sliding: false,
    slideTimer: 0,
    // Squash (1 = normal): <1 squashed wide, >1 stretched tall.
    squash: 1,
    squashVel: 0,
    invulnerable: 0,
    stumbleTimer: 0,
    runCycle: 0,
    particles: [],
  };

  function puff(x, y, count, spread, color) {
    for (let i = 0; i < count; i++) {
      turkey.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y,
        vx: -60 - Math.random() * 120,
        vy: -20 - Math.random() * 70,
        life: 0.5 + Math.random() * 0.35,
        age: 0,
        size: 4 + Math.random() * 7,
        color,
      });
    }
  }

  // Live getters: the returned object always reads the closure state,
  // never a stale copy of it.
  return {
    get x() { return turkey.x; },
    get y() { return turkey.y; },
    get width() { return turkey.width; },
    get height() { return turkey.height; },
    get onGround() { return turkey.onGround; },
    get sliding() { return turkey.sliding; },
    get runCycle() { return turkey.runCycle; },
    get squashValue() { return turkey.squash; },
    get particlesList() { return turkey.particles; },
    get isInvulnerable() { return turkey.invulnerable > 0; },
    get isStumbling() { return turkey.stumbleTimer > 0; },

    reset() {
      turkey.y = VIEW.groundY;
      turkey.vy = 0;
      turkey.onGround = true;
      turkey.jumps = 0;
      turkey.sliding = false;
      turkey.slideTimer = 0;
      turkey.squash = 1;
      turkey.squashVel = 0;
      turkey.invulnerable = 0;
      turkey.stumbleTimer = 0;
      turkey.runCycle = 0;
      turkey.particles.length = 0;
    },

    // Stage a pose from outside (screenshots): apply a patch of state
    // onto the closure. The public face is getters-only on purpose, so
    // this is the one sanctioned way in.
    pose(patch) {
      for (const [key, value] of Object.entries(patch)) {
        if (key in turkey) turkey[key] = value;
      }
    },

    jump() {
      if (turkey.stumbleTimer > 0) return;
      if (turkey.onGround) {
        turkey.vy = RUN.jumpVelocity;
        turkey.onGround = false;
        turkey.jumps = 1;
        turkey.squash = 1.28; // stretch up on take-off
        audio.jump();
        puff(turkey.x - 20, VIEW.groundY, 6, 0, '#d9c1a0');
      } else if (turkey.jumps < 2) {
        turkey.vy = RUN.doubleJumpVelocity;
        turkey.jumps = 2;
        turkey.squash = 1.22;
        audio.jump();
        puff(turkey.x - 10, turkey.y + 30, 5, 0, '#efe3c8');
      }
    },

    slide() {
      if (!turkey.onGround || turkey.stumbleTimer > 0) return;
      if (!turkey.sliding) audio.slide();
      turkey.sliding = true;
      turkey.slideTimer = RUN.slideTime;
    },

    // A hazard hit: lose a heart, stumble, flash invulnerable.
    stumble() {
      turkey.stumbleTimer = 0.7;
      turkey.invulnerable = RUN.invulnerableSeconds;
      turkey.vy = -260;
      turkey.onGround = false;
      turkey.squash = 0.7; // squash flat on the hit
      audio.hit();
      puff(turkey.x, turkey.y, 12, 0, '#c9a06a');
    },

    update(dt, speed) {
      // Spring the squash back to 1 with a little overshoot.
      const k = 180;
      const damp = 14;
      turkey.squashVel += (-k * (turkey.squash - 1) - damp * turkey.squashVel) * dt;
      turkey.squash += turkey.squashVel * dt;

      if (turkey.stumbleTimer > 0) turkey.stumbleTimer -= dt;
      if (turkey.invulnerable > 0) turkey.invulnerable -= dt;

      if (turkey.sliding) {
        turkey.slideTimer -= dt;
        if (turkey.slideTimer <= 0) turkey.sliding = false;
      }

      if (!turkey.onGround) {
        turkey.vy += RUN.gravity * dt;
        turkey.y += turkey.vy * dt;
        if (turkey.y >= VIEW.groundY) {
          turkey.y = VIEW.groundY;
          turkey.vy = 0;
          turkey.onGround = true;
          turkey.jumps = 0;
          turkey.squash = 0.72; // squash on landing
          audio.land();
          puff(turkey.x - 24, VIEW.groundY, 7, 0, '#d9c1a0');
        }
      } else {
        turkey.runCycle += dt * (speed / 34);
        // Kicked-up dust while sprinting.
        if (Math.random() < dt * 14) {
          puff(turkey.x - 34, VIEW.groundY - 2, 1, 0, '#d9c1a0');
        }
      }

      for (const p of turkey.particles) {
        p.age += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 160 * dt;
      }
      turkey.particles = turkey.particles.filter((p) => p.age < p.life);
    },

    // The turkey's collision box (tighter than the art, so near-misses feel fair).
    box() {
      const h = turkey.sliding ? turkey.height * 0.55 : turkey.height;
      return {
        x: turkey.x - 26,
        y: turkey.y - h,
        w: 52,
        h,
      };
    },
  };
}
