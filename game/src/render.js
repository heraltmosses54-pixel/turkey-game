// Gobble Run — every pixel is drawn on canvas: the turkey, the farmer,
// the farm, the kitchen and the menus. Original art, autumn palette,
// no image files anywhere.

import { VIEW } from './config.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function drawBackground(ctx, stage, scroll, time, width) {
  // Sky.
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW.groundY);
  sky.addColorStop(0, stage.sky[0]);
  sky.addColorStop(1, stage.sky[1]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, VIEW.groundY);

  // Sun with a warm halo.
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(1080, 110, 58, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffdf6b';
  ctx.beginPath();
  ctx.arc(1080, 110, 42, 0, Math.PI * 2);
  ctx.fill();

  // Drifting clouds.
  ctx.fillStyle = 'rgba(255, 250, 235, 0.85)';
  for (let i = 0; i < 4; i++) {
    const cx = ((i * 397 + 120 - scroll * 0.12) % (width + 320) + width + 320) % (width + 320) - 160;
    const cy = 70 + i * 46;
    ellipse(ctx, cx, cy, 62, 20);
    ellipse(ctx, cx + 44, cy + 8, 46, 16);
    ellipse(ctx, cx - 46, cy + 9, 40, 14);
  }

  // Distant hills.
  ctx.fillStyle = stage.accent;
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.moveTo(0, VIEW.groundY);
  for (let x = 0; x <= width; x += 40) {
    ctx.lineTo(x, VIEW.groundY - 60 - Math.sin((x + scroll * 0.3) / 260) * 34);
  }
  ctx.lineTo(width, VIEW.groundY);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  // Farm props scrolling at world speed: fences, trees, a barn, pumpkins.
  drawFarmProps(ctx, stage, scroll, time);

  // Ground.
  ctx.fillStyle = stage.ground;
  ctx.fillRect(0, VIEW.groundY, width, VIEW.height - VIEW.groundY);
  ctx.fillStyle = stage.groundDark;
  ctx.fillRect(0, VIEW.groundY, width, 10);
  // Dirt speckles.
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  for (let i = 0; i < 26; i++) {
    const px = ((i * 173 - scroll * 1.0) % (width + 80) + width + 80) % (width + 80) - 40;
    ctx.fillRect(px, VIEW.groundY + 24 + ((i * 37) % 84), 14, 5);
  }
}

function drawFarmProps(ctx, stage, scroll, time) {
  const spacing = 420;
  for (let i = -1; i < 5; i++) {
    const base = i * spacing - (scroll % spacing);
    const kind = ((Math.floor(scroll / spacing) + i) % 4 + 4) % 4;
    if (kind === 0) {
      // Pumpkin patch.
      ctx.fillStyle = '#e8722a';
      ellipse(ctx, base + 60, VIEW.groundY - 14, 26, 20);
      ellipse(ctx, base + 110, VIEW.groundY - 11, 20, 15);
      ctx.fillStyle = '#4a7a2e';
      ctx.fillRect(base + 56, VIEW.groundY - 38, 6, 12);
    } else if (kind === 1) {
      // Oak tree.
      ctx.fillStyle = '#6b4423';
      ctx.fillRect(base + 52, VIEW.groundY - 110, 16, 110);
      ctx.fillStyle = '#c96a1e';
      ellipse(ctx, base + 60, VIEW.groundY - 140, 52, 40);
      ellipse(ctx, base + 22, VIEW.groundY - 118, 34, 26);
      ellipse(ctx, base + 98, VIEW.groundY - 118, 34, 26);
    } else if (kind === 2) {
      // Little red barn.
      ctx.fillStyle = '#a83c2a';
      ctx.fillRect(base + 10, VIEW.groundY - 120, 130, 120);
      ctx.fillStyle = '#7e2b1d';
      ctx.beginPath();
      ctx.moveTo(base - 6, VIEW.groundY - 118);
      ctx.lineTo(base + 75, VIEW.groundY - 168);
      ctx.lineTo(base + 156, VIEW.groundY - 118);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f5e6c8';
      ctx.fillRect(base + 58, VIEW.groundY - 78, 34, 78);
      ctx.strokeStyle = '#f5e6c8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(base + 58, VIEW.groundY - 78);
      ctx.lineTo(base + 92, VIEW.groundY);
      ctx.moveTo(base + 92, VIEW.groundY - 78);
      ctx.lineTo(base + 58, VIEW.groundY);
      ctx.stroke();
    } else {
      // Fence posts.
      ctx.fillStyle = '#8a5a2b';
      for (let p = 0; p < 3; p++) ctx.fillRect(base + p * 46, VIEW.groundY - 52, 10, 52);
      ctx.fillRect(base - 6, VIEW.groundY - 46, 150, 8);
      ctx.fillRect(base - 6, VIEW.groundY - 26, 150, 8);
    }
  }
}

export function drawTurkey(ctx, turkey, time) {
  const x = turkey.x;
  const y = turkey.y;
  const squash = turkey.squashValue;
  const blink = turkey.isInvulnerable && Math.floor(time * 14) % 2 === 0;
  if (blink) ctx.globalAlpha = 0.35;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(2 - squash > 1.6 ? 1.6 : 2 - squash, squash);
  if (turkey.sliding) ctx.scale(1.25, 0.7);

  const legSwing = turkey.onGround ? Math.sin(turkey.runCycle * 2.4) * 12 : 4;
  const airTuck = turkey.onGround ? 0 : 8;

  // Tail fan: five feathers fanning out from ONE pivot at the rear of
  // the body, so the tail reads as part of the bird, not loose parts.
  // (The old fan rotated each feather around the ground point, which
  // threw feathers far from the body — the "mutilated" look.)
  const featherColors = ['#c0392b', '#e67e22', '#f1c40f', '#d35400', '#922b21'];
  ctx.save();
  ctx.translate(-22, -32); // pivot inside the body's rear edge
  for (let i = 0; i < 5; i++) {
    // Fan from slightly down-back to up-back; the feather is drawn
    // along the local -x axis, so a positive angle cocks it upward.
    const angle = 0.3 + (i - 2) * 0.3;
    ctx.save();
    ctx.rotate(angle);
    // Long ellipse: base (+2) sits inside the body, tip (-36) out back.
    ctx.fillStyle = featherColors[i];
    ctx.beginPath();
    ctx.ellipse(-17, 0, 19, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.ellipse(-28, 0, 7, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // Legs.
  ctx.strokeStyle = '#e8a33d';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-8, -8);
  ctx.lineTo(-8 + legSwing, 0 - airTuck);
  ctx.moveTo(8, -8);
  ctx.lineTo(8 - legSwing, 0 - airTuck);
  ctx.stroke();

  // Body: plump brown oval.
  ctx.fillStyle = '#8a5a2b';
  ellipse(ctx, 0, -30, 30, 26);
  ctx.fillStyle = '#a9713d';
  ellipse(ctx, 6, -26, 20, 18);

  // Wing.
  ctx.fillStyle = '#6e4520';
  ctx.beginPath();
  ctx.ellipse(2, -28, 16, 11, -0.5 + Math.sin(turkey.runCycle * 2.4) * 0.12, 0, Math.PI * 2);
  ctx.fill();

  // Head and neck.
  ctx.fillStyle = '#8a5a2b';
  ctx.fillRect(20, -58, 10, 26);
  ctx.fillStyle = '#d97b4f';
  ctx.beginPath();
  ctx.arc(26, -62, 13, 0, Math.PI * 2);
  ctx.fill();
  // Beak.
  ctx.fillStyle = '#f5b301';
  ctx.beginPath();
  ctx.moveTo(36, -64);
  ctx.lineTo(50, -60);
  ctx.lineTo(36, -56);
  ctx.closePath();
  ctx.fill();
  // Wattle.
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.ellipse(34, -52, 4, 8, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Eye: wide and panicked.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(29, -66, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(31, -66, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  ctx.globalAlpha = 1;
}

export function drawFarmer(ctx, x, y, time, speed) {
  const cycle = time * (speed / 26);
  const legSwing = Math.sin(cycle * 2.2) * 14;
  const bob = Math.abs(Math.sin(cycle * 2.2)) * 4;

  ctx.save();
  ctx.translate(x, y - bob);

  // Legs: blue overalls.
  ctx.strokeStyle = '#2c4a7a';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-6, -44);
  ctx.lineTo(-6 + legSwing, 0);
  ctx.moveTo(6, -44);
  ctx.lineTo(6 - legSwing, 0);
  ctx.stroke();

  // Body: red plaid shirt.
  ctx.fillStyle = '#b03a2e';
  roundRect(ctx, -24, -92, 48, 52, 10);
  ctx.fill();
  ctx.strokeStyle = '#7e2b1d';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-24, -76);
  ctx.lineTo(24, -76);
  ctx.moveTo(-24, -60);
  ctx.lineTo(24, -60);
  ctx.moveTo(0, -92);
  ctx.lineTo(0, -40);
  ctx.stroke();

  // Overalls straps.
  ctx.fillStyle = '#2c4a7a';
  ctx.fillRect(-14, -92, 7, 30);
  ctx.fillRect(7, -92, 7, 30);

  // Arm pumping, holding a pitchfork.
  ctx.strokeStyle = '#e8b48a';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(18, -84);
  ctx.lineTo(34, -58 - Math.sin(cycle * 2.2) * 8);
  ctx.stroke();
  // Pitchfork.
  ctx.strokeStyle = '#8a6d3b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(36, -110);
  ctx.lineTo(30, -30);
  ctx.stroke();
  ctx.strokeStyle = '#c0c0c0';
  ctx.lineWidth = 3;
  for (let t = -1; t <= 1; t++) {
    ctx.beginPath();
    ctx.moveTo(36 + t * 6, -110);
    ctx.lineTo(36 + t * 6, -128);
    ctx.stroke();
  }

  // Head: angry, mustached.
  ctx.fillStyle = '#e8b48a';
  ctx.beginPath();
  ctx.arc(0, -108, 17, 0, Math.PI * 2);
  ctx.fill();
  // Mustache.
  ctx.fillStyle = '#5d4037';
  ctx.beginPath();
  ctx.ellipse(-4, -100, 9, 4, -0.2, 0, Math.PI * 2);
  ctx.fill();
  // Angry eyebrows.
  ctx.strokeStyle = '#3e2723';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-12, -118);
  ctx.lineTo(-3, -114);
  ctx.moveTo(12, -118);
  ctx.lineTo(3, -114);
  ctx.stroke();
  // Eyes.
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(-6, -110, 2.4, 0, Math.PI * 2);
  ctx.arc(6, -110, 2.4, 0, Math.PI * 2);
  ctx.fill();
  // Straw hat.
  ctx.fillStyle = '#d9b45b';
  ctx.beginPath();
  ctx.ellipse(0, -122, 30, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, -128, 17, 12, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#a83c2a';
  ctx.fillRect(-17, -128, 34, 5);

  ctx.restore();
}

export function drawObstacle(ctx, o, time) {
  if (o.kind === 'hay') {
    // Hay bale: golden, banded, with loose straw.
    ctx.fillStyle = '#d9a441';
    ellipse(ctx, o.x, o.y - o.h / 2, o.w / 2, o.h / 2);
    ctx.fillStyle = '#b9822e';
    ctx.beginPath();
    ctx.ellipse(o.x, o.y - o.h / 2, o.w / 2 - 12, o.h / 2 - 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8a5a2b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(o.x - o.w / 2 + 4, o.y - o.h / 2);
    ctx.lineTo(o.x + o.w / 2 - 4, o.y - o.h / 2);
    ctx.stroke();
    ctx.strokeStyle = '#e8c25e';
    ctx.lineWidth = 2;
    for (let s = 0; s < 5; s++) {
      const sx = o.x - 28 + s * 12;
      ctx.beginPath();
      ctx.moveTo(sx, o.y - o.h - 2);
      ctx.lineTo(sx + 4, o.y - o.h - 12);
      ctx.stroke();
    }
  } else if (o.kind === 'fence') {
    // Wooden fence section.
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(o.x - o.w / 2, o.y - o.h, 9, o.h);
    ctx.fillRect(o.x + o.w / 2 - 9, o.y - o.h, 9, o.h);
    ctx.fillStyle = '#a9713d';
    ctx.fillRect(o.x - o.w / 2 - 6, o.y - o.h + 8, o.w + 12, 9);
    ctx.fillRect(o.x - o.w / 2 - 6, o.y - o.h + 34, o.w + 12, 9);
    ctx.fillStyle = '#e8b48a';
    ctx.beginPath();
    ctx.arc(o.x - o.w / 2 + 4, o.y - o.h - 4, 6, 0, Math.PI * 2);
    ctx.arc(o.x + o.w / 2 - 4, o.y - o.h - 4, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (o.kind === 'oven') {
    // The dreaded oven: black iron, glowing door, steam, "HOT" warning.
    const ox = o.x - o.w / 2;
    const oy = o.y - o.h;
    ctx.fillStyle = '#2b2b2b';
    roundRect(ctx, ox, oy, o.w, o.h, 8);
    ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(ox + 6, oy + 6, o.w - 12, 22);
    // Glowing oven window with fire inside.
    ctx.fillStyle = '#ff6b1a';
    roundRect(ctx, ox + 14, oy + 40, o.w - 28, 44, 6);
    ctx.fill();
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath();
    ctx.moveTo(ox + 26, oy + 78);
    ctx.quadraticCurveTo(ox + 34, oy + 52, ox + 48, oy + 60);
    ctx.quadraticCurveTo(ox + 62, oy + 52, ox + 70, oy + 78);
    ctx.closePath();
    ctx.fill();
    // Door handle and knobs.
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(ox + 12, oy + 92, o.w - 24, 6);
    ctx.beginPath();
    ctx.arc(ox + 22, oy + 18, 4, 0, Math.PI * 2);
    ctx.arc(ox + o.w - 22, oy + 18, 4, 0, Math.PI * 2);
    ctx.fill();
    // Heat shimmer: rising steam wisps.
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 3;
    for (let s = 0; s < 3; s++) {
      const sx = ox + 20 + s * 28;
      const wob = Math.sin(time * 3 + s * 2) * 5;
      ctx.beginPath();
      ctx.moveTo(sx, oy - 4);
      ctx.quadraticCurveTo(sx + wob, oy - 22, sx - wob, oy - 40);
      ctx.stroke();
    }
    // Warning sign.
    ctx.fillStyle = '#ffd23f';
    roundRect(ctx, ox + o.w / 2 - 22, oy - 30, 44, 22, 4);
    ctx.fill();
    ctx.fillStyle = '#b03a2e';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HOT!', ox + o.w / 2, oy - 14);
  } else if (o.kind === 'knife') {
    // The carving knife: swings down from above on a rope.
    const drop = Math.max(0, Math.sin(o.swing)) * 46;
    const topY = VIEW.groundY - 190 + drop;
    ctx.strokeStyle = '#6b4423';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(o.x, VIEW.groundY - 260);
    ctx.lineTo(o.x, topY + 6);
    ctx.stroke();
    // Handle.
    ctx.fillStyle = '#3e2723';
    roundRect(ctx, o.x - 8, topY, 16, 34, 4);
    ctx.fill();
    // Blade: long, silver, sharp.
    const grad = ctx.createLinearGradient(o.x - 12, topY, o.x + 12, topY);
    grad.addColorStop(0, '#9aa0a6');
    grad.addColorStop(0.5, '#e8eaed');
    grad.addColorStop(1, '#7a7f85');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(o.x - 11, topY + 34);
    ctx.lineTo(o.x + 11, topY + 34);
    ctx.lineTo(o.x, topY + 150);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(o.x - 7, topY + 40, 3, 90);
  }
}

export function drawCorn(ctx, c) {
  const bobY = Math.sin(c.bob) * 4;
  ctx.save();
  ctx.translate(c.x, c.y + bobY);
  // Husk leaves.
  ctx.fillStyle = '#4a7a2e';
  ctx.beginPath();
  ctx.moveTo(-12, 8);
  ctx.quadraticCurveTo(-22, -6, -8, -16);
  ctx.quadraticCurveTo(-4, -4, -12, 8);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(12, 8);
  ctx.quadraticCurveTo(22, -6, 8, -16);
  ctx.quadraticCurveTo(4, -4, 12, 8);
  ctx.fill();
  // The cob.
  ctx.fillStyle = '#f5b301';
  ctx.beginPath();
  ctx.ellipse(0, 0, 11, 17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d99a00';
  for (let r = -1; r <= 1; r++) {
    for (let k = -2; k <= 2; k++) {
      ctx.beginPath();
      ctx.arc(r * 6, k * 6, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

export function drawForestGate(ctx, x, time) {
  // The escape: two pine trees and a wooden arch with a banner.
  ctx.fillStyle = '#2f4a1e';
  for (const tx of [x - 90, x + 90]) {
    ctx.beginPath();
    ctx.moveTo(tx - 46, VIEW.groundY);
    ctx.lineTo(tx, VIEW.groundY - 190);
    ctx.lineTo(tx + 46, VIEW.groundY);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(tx - 36, VIEW.groundY - 80);
    ctx.lineTo(tx, VIEW.groundY - 230);
    ctx.lineTo(tx + 36, VIEW.groundY - 80);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#6b4423';
  ctx.fillRect(x - 110, VIEW.groundY - 150, 14, 150);
  ctx.fillRect(x + 96, VIEW.groundY - 150, 14, 150);
  ctx.fillStyle = '#8a5a2b';
  ctx.fillRect(x - 110, VIEW.groundY - 164, 234, 16);
  ctx.fillStyle = '#f5e6c8';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FREEDOM →', x + 6, VIEW.groundY - 176);
}

function drawHeart(ctx, x, y, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = filled ? '#e63946' : 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.bezierCurveTo(-14, -4, -8, -14, 0, -6);
  ctx.bezierCurveTo(8, -14, 14, -4, 0, 8);
  ctx.fill();
  ctx.restore();
}

export function drawHUD(ctx, world, turkey) {
  // Top bar.
  ctx.fillStyle = 'rgba(30, 18, 8, 0.55)';
  roundRect(ctx, 16, 14, 1248, 64, 12);
  ctx.fill();

  ctx.fillStyle = '#ffd23f';
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE ${Math.floor(world.score)}`, 34, 52);

  // Distance progress: farmyard → forest.
  const progress = Math.min(1, world.distance / 1200);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundRect(ctx, 330, 30, 420, 16, 8);
  ctx.fill();
  ctx.fillStyle = '#7ed957';
  roundRect(ctx, 330, 30, 420 * progress, 16, 8);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.floor(world.distance)}m / 1200m`, 540, 60);
  ctx.font = 'bold 15px sans-serif';
  ctx.fillStyle = '#ffe9b0';
  ctx.fillText(world.stage.name, 540, 26);

  // Lives as hearts.
  for (let i = 0; i < 3; i++) {
    drawHeart(ctx, 830 + i * 34, 44, i < world.lives);
  }

  // Farmer proximity: the red bar that fills as he closes in.
  const danger = 1 - Math.max(0, Math.min(1, (world.farmerGap - 46) / (420 - 46)));
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('FARMER', 940, 36);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundRect(ctx, 940, 42, 180, 12, 6);
  ctx.fill();
  ctx.fillStyle = danger > 0.7 ? '#e63946' : danger > 0.4 ? '#ff9e2c' : '#7ed957';
  roundRect(ctx, 940, 42, 180 * danger, 12, 6);
  ctx.fill();
  if (danger > 0.7) {
    ctx.fillStyle = '#ff5b5b';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('HE IS RIGHT BEHIND YOU!', 940, 72);
  }

  // Near-miss popup.
  if (world.nearMissTimer > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, world.nearMissTimer);
    ctx.fillStyle = '#ffd23f';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`CLOSE ONE! +25  (x${world.nearMiss})`, 640, 150);
    ctx.restore();
  }

  // Stage banner.
  if (world.stageFlash > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, world.stageFlash);
    ctx.fillStyle = '#fff3c4';
    ctx.font = 'bold 54px sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(60,30,5,0.8)';
    ctx.lineWidth = 8;
    ctx.strokeText(world.stageFlashText, 640, 300);
    ctx.fillText(world.stageFlashText, 640, 300);
    ctx.restore();
  }

  // Mute hint.
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('SPACE jump (x2) · ↓ slide · P pause · M mute', 1252, 706);
}

export function drawTitle(ctx, best, time) {
  ctx.fillStyle = 'rgba(30, 16, 4, 0.45)';
  ctx.fillRect(0, 0, 1280, 720);

  // Big title with a warm outline.
  ctx.textAlign = 'center';
  ctx.font = 'bold 96px sans-serif';
  ctx.lineWidth = 12;
  ctx.strokeStyle = '#5d2e0c';
  ctx.strokeText('GOBBLE RUN', 640, 210);
  ctx.fillStyle = '#ffd23f';
  ctx.fillText('GOBBLE RUN', 640, 210);

  ctx.font = 'bold 34px sans-serif';
  ctx.fillStyle = '#fff3c4';
  ctx.fillText('THE GREAT TURKEY ESCAPE', 640, 262);

  ctx.font = '20px sans-serif';
  ctx.fillStyle = '#ffe9b0';
  ctx.fillText('Thanksgiving is coming. The farmer is coming faster.', 640, 300);
  ctx.fillText('Outrun him 1200m to the forest — dodge the oven and the carving knife!', 640, 330);

  // Controls card.
  ctx.fillStyle = 'rgba(30, 18, 8, 0.6)';
  roundRect(ctx, 390, 372, 500, 118, 14);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('SPACE / ↑ / CLICK — jump (twice in the air)', 640, 408);
  ctx.fillText('↓ / S — slide under the knife', 640, 440);
  ctx.fillText('Grab corn for +50 — it slows the farmer down', 640, 472);

  // Pulsing start prompt.
  const pulse = 0.65 + Math.sin(time * 4) * 0.35;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#7ed957';
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText('PRESS SPACE OR CLICK TO RUN', 640, 556);
  ctx.restore();

  if (best > 0) {
    ctx.fillStyle = '#ffd23f';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`BEST ESCAPE: ${Math.floor(best)}m`, 640, 606);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '16px sans-serif';
  ctx.fillText('A turkey, a farmer, an oven and a very sharp knife. Good luck, bird.', 640, 668);
}

export function drawEnd(ctx, kind, world, best, time) {
  ctx.fillStyle = kind === 'caught' ? 'rgba(40, 8, 4, 0.62)' : 'rgba(8, 32, 8, 0.6)';
  ctx.fillRect(0, 0, 1280, 720);

  ctx.textAlign = 'center';
  if (kind === 'caught') {
    ctx.font = 'bold 88px sans-serif';
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#3d0a06';
    ctx.strokeText('CAUGHT!', 640, 220);
    ctx.fillStyle = '#ff5b5b';
    ctx.fillText('CAUGHT!', 640, 220);
    ctx.fillStyle = '#fff3c4';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('The farmer got his Thanksgiving dinner after all...', 640, 272);
  } else {
    ctx.font = 'bold 88px sans-serif';
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#0d3312';
    ctx.strokeText('ESCAPED!', 640, 220);
    ctx.fillStyle = '#7ed957';
    ctx.fillText('ESCAPED!', 640, 220);
    ctx.fillStyle = '#fff3c4';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('Into the forest — no Thanksgiving dinner today!', 640, 272);
  }

  // Stats card.
  ctx.fillStyle = 'rgba(30, 18, 8, 0.65)';
  roundRect(ctx, 440, 310, 400, 150, 14);
  ctx.fill();
  ctx.fillStyle = '#ffd23f';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText(`SCORE  ${Math.floor(world.score)}`, 640, 352);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(`DISTANCE  ${Math.floor(world.distance)}m`, 640, 392);
  ctx.fillText(`CLOSE CALLS  ${world.nearMiss}`, 640, 430);
  if (Math.floor(world.distance) >= Math.floor(best) && world.distance > 0) {
    ctx.fillStyle = '#7ed957';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('★ NEW BEST DISTANCE ★', 640, 486);
  }

  // Restart button (also clickable).
  const pulse = 0.65 + Math.sin(time * 4) * 0.35;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#7ed957';
  roundRect(ctx, 490, 530, 300, 64, 14);
  ctx.fill();
  ctx.fillStyle = '#12330f';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText('RUN AGAIN', 640, 572);
  ctx.restore();

  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '18px sans-serif';
  ctx.fillText('Press SPACE or click RUN AGAIN', 640, 640);
}
