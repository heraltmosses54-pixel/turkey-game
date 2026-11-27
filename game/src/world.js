// Gobble Run — the world: stages, obstacle and corn spawns, and the
// farmer who chases the turkey from behind. The farmer is the real clock:
// every stumble lets him close in, every clean stretch pushes him back.

import { RUN, SPAWN, STAGES, VIEW } from './config.js';

const OBSTACLE_KINDS = ['hay', 'fence', 'oven', 'knife'];

export function createWorld(random) {
  const world = {
    distance: 0, // metres
    speed: RUN.baseSpeed,
    score: 0,
    lives: RUN.lives,
    farmerGap: RUN.farmerGapStart,
    obstacles: [],
    corns: [],
    spawnTimer: 1.1,
    cornTimer: 2.2,
    shake: 0,
    stageIndex: 0,
    stageFlash: 0,
    stageFlashText: '',
    nearMiss: 0,
    nearMissTimer: 0,
    scroll: 0,
    escaped: false,
    caught: false,
  };

  function stageFor(distance) {
    for (let i = 0; i < STAGES.length; i++) {
      if (distance >= STAGES[i].from && distance < STAGES[i].to) return i;
    }
    return STAGES.length - 1;
  }

  function pickKind(distance) {
    // The kitchen brings the oven and the carving knife; the farmyard
    // starts gentle with hay and fences only.
    const pool = distance < 400
      ? ['hay', 'hay', 'fence']
      : distance < 800
        ? ['hay', 'fence', 'fence', 'knife']
        : ['hay', 'fence', 'oven', 'knife', 'knife', 'oven'];
    return pool[Math.floor(random() * pool.length)];
  }

  function spawnObstacle() {
    const kind = pickKind(world.distance);
    const x = VIEW.width + 80;
    if (kind === 'hay') {
      world.obstacles.push({ kind, x, w: 74, h: 52, y: VIEW.groundY, passed: false });
    } else if (kind === 'fence') {
      world.obstacles.push({ kind, x, w: 46, h: 78, y: VIEW.groundY, passed: false });
    } else if (kind === 'oven') {
      // The oven: tall, hot, and wide — jump it clean or slide under nothing.
      world.obstacles.push({ kind, x, w: 96, h: 118, y: VIEW.groundY, passed: false });
    } else {
      // The carving knife: hangs from above and swings down as you pass.
      world.obstacles.push({
        kind, x, w: 30, h: 150, y: VIEW.groundY, passed: false,
        swing: random() * Math.PI * 2, swingSpeed: 2.2 + random() * 1.4,
      });
    }
  }

  function spawnCornArc() {
    const count = SPAWN.cornArcMin + Math.floor(random() * (SPAWN.cornArcMax - SPAWN.cornArcMin + 1));
    const baseX = VIEW.width + 120;
    for (let i = 0; i < count; i++) {
      world.corns.push({
        x: baseX + i * 44,
        y: VIEW.groundY - 90 - Math.sin((i / Math.max(1, count - 1)) * Math.PI) * 70,
        taken: false,
        bob: random() * Math.PI * 2,
      });
    }
  }

  function obstacleBox(o) {
    if (o.kind === 'knife') {
      // The blade hangs from the top of its swing arc.
      const drop = Math.max(0, Math.sin(o.swing)) * 46;
      return { x: o.x - 12, y: VIEW.groundY - 190 + drop, w: 24, h: 190 - drop };
    }
    return { x: o.x - o.w / 2 + 6, y: o.y - o.h, w: o.w - 12, h: o.h - 4 };
  }

  function boxesOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // Live getters: the returned object always reads the closure state,
  // never a stale copy of it.
  return {
    get distance() { return world.distance; },
    get speed() { return world.speed; },
    get score() { return world.score; },
    get lives() { return world.lives; },
    get farmerGap() { return world.farmerGap; },
    get obstacles() { return world.obstacles; },
    get corns() { return world.corns; },
    get shake() { return world.shake; },
    get stageIndex() { return world.stageIndex; },
    get stageFlash() { return world.stageFlash; },
    get stageFlashText() { return world.stageFlashText; },
    get nearMiss() { return world.nearMiss; },
    get nearMissTimer() { return world.nearMissTimer; },
    get scroll() { return world.scroll; },
    get escaped() { return world.escaped; },
    get caught() { return world.caught; },

    // Stage a scene from outside (screenshots, tests): apply a patch of
    // state onto the closure. The public face is getters-only on purpose,
    // so this is the one sanctioned way in.
    applyStage(patch) {
      for (const [key, value] of Object.entries(patch)) {
        if (key in world) world[key] = value;
      }
      // A patched distance re-derives the stage.
      world.stageIndex = stageFor(world.distance);
    },

    reset() {
      world.distance = 0;
      world.speed = RUN.baseSpeed;
      world.score = 0;
      world.lives = RUN.lives;
      world.farmerGap = RUN.farmerGapStart;
      world.obstacles.length = 0;
      world.corns.length = 0;
      world.spawnTimer = 1.1;
      world.cornTimer = 2.2;
      world.shake = 0;
      world.stageIndex = 0;
      world.stageFlash = 0;
      world.stageFlashText = '';
      world.nearMiss = 0;
      world.nearMissTimer = 0;
      world.scroll = 0;
      world.escaped = false;
      world.caught = false;
    },

    get stage() { return STAGES[world.stageIndex]; },
    get farmerX() { return 300 - world.farmerGap; },

    update(dt, turkey, audio) {
      const speed = world.speed;
      world.scroll += speed * dt;
      world.distance += (speed * dt) / 34; // ~34 px per metre
      world.score += (speed * dt) / 34 * RUN.distanceScorePerMetre;

      // Speed rises with distance; the farmer keeps pace behind.
      world.speed = Math.min(RUN.maxSpeed, RUN.baseSpeed + world.distance * RUN.speedPerMetre);

      // Stage changes flash a banner and a sound.
      const si = stageFor(world.distance);
      if (si !== world.stageIndex) {
        world.stageIndex = si;
        world.stageFlash = 2.2;
        world.stageFlashText = STAGES[si].name;
        audio.stage();
      }
      if (world.stageFlash > 0) world.stageFlash -= dt;
      if (world.nearMissTimer > 0) world.nearMissTimer -= dt;

      // The farmer falls back a little while the turkey runs clean.
      if (!turkey.isStumbling) {
        world.farmerGap = Math.min(RUN.farmerGapMax, world.farmerGap + RUN.cleanGapGain * dt * 10);
      }
      if (world.farmerGap <= 130 && Math.random() < dt * 0.5) audio.farmerShout();

      // Spawning.
      world.spawnTimer -= dt;
      if (world.spawnTimer <= 0) {
        spawnObstacle();
        const gap = SPAWN.gapMin + random() * (SPAWN.gapMax - SPAWN.gapMin);
        world.spawnTimer = Math.max(0.55, gap - world.distance * SPAWN.gapShrinkPerMetre);
      }
      world.cornTimer -= dt;
      if (world.cornTimer <= 0) {
        spawnCornArc();
        world.cornTimer = 2.6 + random() * 2.2;
      }

      // Move and cull obstacles; score a clean pass.
      const tBox = turkey.box();
      for (const o of world.obstacles) {
        o.x -= speed * dt;
        if (o.kind === 'knife') o.swing += o.swingSpeed * dt;
        if (!o.passed && o.x + o.w / 2 < turkey.x - 40) {
          o.passed = true;
          world.score += 10;
          // A close jump over an obstacle is a near-miss: bonus + juice.
          const ob = obstacleBox(o);
          const clearance = tBox.y + tBox.h - (ob.y + ob.h);
          if (clearance > -26 && clearance < 26) {
            world.score += 25;
            world.nearMiss++;
            world.nearMissTimer = 1.2;
          }
        }
      }
      world.obstacles = world.obstacles.filter((o) => o.x > -160);

      for (const c of world.corns) {
        c.x -= speed * dt;
        c.bob += dt * 5;
      }
      world.corns = world.corns.filter((c) => c.x > -60 && !c.taken);

      // Corn pickup.
      for (const c of world.corns) {
        if (!c.taken && boxesOverlap(tBox, { x: c.x - 16, y: c.y - 16, w: 32, h: 32 })) {
          c.taken = true;
          world.score += RUN.cornScore;
          world.farmerGap = Math.min(RUN.farmerGapMax, world.farmerGap + RUN.cornGapGain);
          audio.corn();
        }
      }

      // Hazard collision (not while invulnerable after a hit).
      if (!turkey.isInvulnerable) {
        for (const o of world.obstacles) {
          if (boxesOverlap(tBox, obstacleBox(o))) {
            world.lives -= 1;
            world.farmerGap = Math.max(RUN.farmerCatchGap + 10, world.farmerGap - RUN.stumbleGapLoss);
            world.shake = 0.45;
            turkey.stumble();
            break;
          }
        }
      }

      if (world.shake > 0) world.shake -= dt;

      // Caught: no lives left, or the farmer closed the gap.
      if (world.lives <= 0 || world.farmerGap <= RUN.farmerCatchGap) {
        world.caught = true;
      }
      // Escaped: the forest gate at the end of the run.
      if (world.distance >= RUN.escapeDistance) {
        world.escaped = true;
      }
    },

    obstacleBox,
    boxesOverlap,
  };
}
