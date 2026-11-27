// Gobble Run — the game loop, the states (title, running, paused, caught,
// escaped) and the HUD wiring. The world scrolls past a turkey that never
// leaves its spot; the farmer behind it is the clock.

import { RUN, VIEW } from './config.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { createTurkey } from './turkey.js';
import { createWorld } from './world.js';
import {
  drawBackground,
  drawCorn,
  drawEnd,
  drawFarmer,
  drawForestGate,
  drawHUD,
  drawObstacle,
  drawTitle,
  drawTurkey,
} from './render.js';
import { applyShot, seededRandom } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const audio = createAudio();
const input = createInput(canvas);
const turkey = createTurkey(audio);

let random = Math.random;
let world = createWorld(random);

let state = 'title'; // title | run | pause | caught | escaped
let time = 0;
let endAt = -10; // when the current end screen appeared (restart needs a beat)
let best = 0;
let staged = false;
let frozen = false; // staged play/kitchen shots: render, don't advance
try {
  best = Number(localStorage.getItem('gobble-run-best') || '0') || 0;
} catch {
  best = 0;
}

function saveBest(distance) {
  if (distance > best) {
    best = distance;
    try {
      localStorage.setItem('gobble-run-best', String(Math.floor(best)));
    } catch {
      // Storage may be unavailable; the best still shows this session.
    }
  }
}

function startRun() {
  random = Math.random;
  world = createWorld(random);
  turkey.reset();
  state = 'run';
  audio.unlock();
  audio.gobble();
}

function endRun(kind) {
  state = kind;
  endAt = time;
  saveBest(world.distance);
  if (kind === 'caught') audio.caught();
  else audio.escaped();
}

function toTitle() {
  world = createWorld(random);
  turkey.reset();
  state = 'title';
}

// --- Staged scenes for screenshots (?shot=...) ---------------------------
function stagePlayScene() {
  world.applyStage({ distance: 120, score: 1240, lives: 3, farmerGap: 150 });
  world.obstacles.push({ kind: 'knife', x: 760, w: 30, h: 150, y: VIEW.groundY, passed: false, swing: 1.1, swingSpeed: 2.6 });
  world.obstacles.push({ kind: 'hay', x: 1020, w: 74, h: 52, y: VIEW.groundY, passed: false });
  world.obstacles.push({ kind: 'fence', x: 560, w: 46, h: 78, y: VIEW.groundY, passed: false });
  world.corns.push({ x: 620, y: VIEW.groundY - 150, taken: false, bob: 0.4 });
  world.corns.push({ x: 664, y: VIEW.groundY - 170, taken: false, bob: 1.2 });
  world.corns.push({ x: 708, y: VIEW.groundY - 150, taken: false, bob: 2.1 });
  turkey.pose({ y: VIEW.groundY - 120, vy: -180, onGround: false, squash: 1.22, runCycle: 1.4 });
}

function stageKitchenScene() {
  world.applyStage({ distance: 860, score: 4860, lives: 2, farmerGap: 110, stageFlash: 0, nearMiss: 3, nearMissTimer: 1.0 });
  world.obstacles.push({ kind: 'oven', x: 780, w: 96, h: 118, y: VIEW.groundY, passed: false });
  world.obstacles.push({ kind: 'knife', x: 1010, w: 30, h: 150, y: VIEW.groundY, passed: false, swing: 2.4, swingSpeed: 3.1 });
  world.obstacles.push({ kind: 'fence', x: 560, w: 46, h: 78, y: VIEW.groundY, passed: false });
  world.corns.push({ x: 660, y: VIEW.groundY - 130, taken: false, bob: 0.9 });
  world.corns.push({ x: 704, y: VIEW.groundY - 150, taken: false, bob: 2.4 });
  turkey.pose({ y: VIEW.groundY - 60, vy: -320, onGround: false, squash: 1.25, runCycle: 2.2 });
}

function stageCaughtScene() {
  world.applyStage({ distance: 642, score: 3210, lives: 0, farmerGap: 46, nearMiss: 2 });
  state = 'caught';
  saveBest(world.distance);
}

function stageEscapedScene() {
  world.applyStage({ distance: 1200, score: 7340, lives: 2, nearMiss: 5 });
  state = 'escaped';
  saveBest(world.distance);
}

// The game object the screenshot stager drives.
const game = {
  setSeed(seed) { random = seededRandom(seed); },
  toTitle,
  startRun,
  stagePlayScene,
  stageKitchenScene,
  stageCaughtScene,
  stageEscapedScene,
  get state() { return state; },
  get world() { return world; },
  get turkey() { return turkey; },
  get best() { return best; },
};
window.__game = game;

// --- Main loop ------------------------------------------------------------
let last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  time += dt;

  if (input.mutePressed()) audio.toggleMute();

  if (state === 'title') {
    if (input.jumpPressed() || input.clickedIn(0, 0, VIEW.width, VIEW.height)) {
      audio.click();
      startRun();
    }
  } else if (state === 'run') {
    if (input.pausePressed()) {
      state = 'pause';
    } else if (!frozen) {
      if (input.jumpPressed()) turkey.jump();
      if (input.slideHeld()) turkey.slide();
      turkey.update(dt, world.speed);
      world.update(dt, turkey, audio);
      if (world.caught) endRun('caught');
      else if (world.escaped) endRun('escaped');
    }
  } else if (state === 'pause') {
    if (input.pausePressed() || input.jumpPressed()) state = 'run';
  } else if (state === 'caught' || state === 'escaped') {
    // A beat before restart counts, so a mashed jump key cannot skip the
    // end screen the instant it appears.
    if (time - endAt > 0.6 && (input.jumpPressed() || input.clickedIn(490, 530, 300, 64))) {
      audio.click();
      startRun();
    }
  }

  render();
  requestAnimationFrame(frame);
}

function render() {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  ctx.save();
  if (world.shake > 0) {
    const mag = world.shake * 22;
    ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
  }

  drawBackground(ctx, world.stage, world.scroll, time, VIEW.width);

  // The forest gate sits at the escape line in the final stage: it rolls
  // into view as the turkey nears 1200m.
  if (world.stageIndex === 3) {
    const gateX = 300 + (1200 - world.distance) * 34;
    if (gateX > -260 && gateX < VIEW.width + 260) drawForestGate(ctx, gateX, time);
  }

  for (const c of world.corns) drawCorn(ctx, c);
  for (const o of world.obstacles) drawObstacle(ctx, o, time);
  for (const p of turkey.particlesList) {
    ctx.globalAlpha = Math.max(0, 1 - p.age / p.life) * 0.7;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // The farmer chases from behind — always on screen while running.
  if (state === 'run' || state === 'pause') {
    drawFarmer(ctx, world.farmerX, VIEW.groundY, time, world.speed);
  }
  if (state === 'caught') {
    // He finally got his bird: the farmer stands over the turkey.
    drawFarmer(ctx, turkey.x - 30, VIEW.groundY, time, 0);
  }

  // The turkey is always on screen — on the title screen it stands ready
  // at the start line, so the cover shows the hero at once.
  drawTurkey(ctx, turkey, time);
  if (state === 'run' || state === 'pause') drawHUD(ctx, world, turkey);

  if (state === 'pause') {
    ctx.fillStyle = 'rgba(20, 12, 4, 0.5)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = '#fff3c4';
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', 640, 340);
    ctx.font = '24px sans-serif';
    ctx.fillText('Press P or SPACE to keep running', 640, 390);
  }

  if (state === 'title') drawTitle(ctx, best, time);
  if (state === 'caught') drawEnd(ctx, 'caught', world, best, time);
  if (state === 'escaped') drawEnd(ctx, 'escaped', world, best, time);

  ctx.restore();
}

// Stage a screenshot scene from the URL, then start the loop. Play and
// kitchen scenes stay frozen (the staged composition never advances),
// while title and end screens keep the loop alive so time — and the
// restart input on the end screens — still works.
const query = new URLSearchParams(window.location.search);
staged = applyShot(game, query);
if (staged) {
  const shot = query.get('shot');
  frozen = shot === 'play' || shot === 'kitchen';
}
requestAnimationFrame(frame);
