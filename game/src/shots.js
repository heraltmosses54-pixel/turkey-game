// Gobble Run — screenshot staging. The URL query ?shot= picks a scene
// and ?seed= fixes the randomness, so the four screenshots are real
// renders of the game itself, staged the same way every time:
//   ?shot=title   — the title screen over the farmyard
//   ?shot=play    — mid-run in the farmyard, farmer close, knife + corn
//   ?shot=kitchen — mid-run in the kitchen, oven and knife, HUD full
//   ?shot=caught  — the caught end screen
//   ?shot=escaped — the escaped end screen

import { VIEW } from './config.js';

export function applyShot(game, query) {
  const shot = query.get('shot');
  if (!shot) return false;
  const seed = Number(query.get('seed') || '1');
  game.setSeed(seed);

  if (shot === 'title') {
    game.toTitle();
    return true;
  }
  if (shot === 'play') {
    game.startRun();
    game.stagePlayScene();
    return true;
  }
  if (shot === 'kitchen') {
    game.startRun();
    game.stageKitchenScene();
    return true;
  }
  if (shot === 'caught') {
    game.startRun();
    game.stageCaughtScene();
    return true;
  }
  if (shot === 'escaped') {
    game.startRun();
    game.stageEscapedScene();
    return true;
  }
  return false;
}

// A tiny seeded random generator (mulberry32) so staged scenes are stable.
export function seededRandom(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function stageDistanceFor(shot) {
  return shot === 'kitchen' ? 860 : 120;
}

export { VIEW };
