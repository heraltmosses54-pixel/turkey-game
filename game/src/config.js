// Gobble Run — tuning constants. One place for every number the game
// balances on, so the feel can be tuned without touching the logic.

export const VIEW = {
  width: 1280,
  height: 720,
  groundY: 600,
};

export const RUN = {
  // Distance in metres the turkey must cover to reach the forest and escape.
  escapeDistance: 1200,
  // Base scroll speed (px/s) and how much faster the run gets per metre.
  baseSpeed: 320,
  speedPerMetre: 0.16,
  maxSpeed: 640,
  // The farmer starts this far behind the turkey (px) and closes in when
  // the turkey stumbles; he falls back when the turkey runs clean.
  farmerGapStart: 260,
  farmerGapMax: 420,
  farmerCatchGap: 46,
  stumbleGapLoss: 120,
  cleanGapGain: 0.6,
  // Gravity and jump feel.
  gravity: 2600,
  jumpVelocity: -920,
  doubleJumpVelocity: -780,
  slideTime: 0.55,
  // Lives and mercy.
  lives: 3,
  invulnerableSeconds: 1.6,
  // Corn: score per cob and the small gap it buys back.
  cornScore: 50,
  cornGapGain: 14,
  distanceScorePerMetre: 1,
};

export const STAGES = [
  { from: 0, to: 400, name: 'THE FARMYARD', sky: ['#ffd9a0', '#ff9e5e'], ground: '#c98f4e', groundDark: '#a96f35', accent: '#7a4a21' },
  { from: 400, to: 800, name: 'BARN LANE', sky: ['#ffc98f', '#f07f4e'], ground: '#b97f45', groundDark: '#96602e', accent: '#6b3f1c' },
  { from: 800, to: 1200, name: 'THE KITCHEN', sky: ['#ffb27d', '#d95f3d'], ground: '#8a5a3b', groundDark: '#6e452c', accent: '#4e2c17' },
  { from: 1200, to: Infinity, name: 'THE FOREST', sky: ['#bfe8a8', '#5da85c'], ground: '#5d7a3a', groundDark: '#47602c', accent: '#2f4a1e' },
];

export const SPAWN = {
  // Seconds between obstacle spawns; shrinks as the run gets faster.
  gapMin: 0.85,
  gapMax: 1.5,
  gapShrinkPerMetre: 0.00045,
  // Corn appears in arcs of this many cobs.
  cornArcMin: 3,
  cornArcMax: 6,
};
