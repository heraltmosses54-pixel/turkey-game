// Gobble Run — headless smoke test. Loads the real game in Chrome,
// plays it with synthetic keys, and checks the states, the HUD and the
// console. Usage: node tools/smoke.mjs
import { cpSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  attachPage, clickAt, evaluate, launchChrome, navigateAndWait, sleep, tapKey,
} from './cdp.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..');
// The sandboxed Chrome can only see files under /usr/local/share, so the
// tool first stages a fresh copy of game/ there (test staging only — the
// deliverable repo stays in ~/workspace/turkey-game/repo).
const STAGE_DIR = '/usr/local/share/turkey-game';
rmSync(STAGE_DIR, { recursive: true, force: true });
cpSync(join(repo, 'game'), STAGE_DIR, { recursive: true });
const GAME_URL = `file://${STAGE_DIR}/index.html`;

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

let exitCode = 0;
{
  const { child, send, events } = launchChrome('/tmp/chrome-turkey-smoke');
  try {
    await sleep(3500);
    const { sessionId } = await attachPage(send);
    await send('Network.enable', {}, sessionId);
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280, height: 720, deviceScaleFactor: 1, mobile: false,
    }, sessionId);

    // 1. Title screen loads.
    await navigateAndWait(send, sessionId, GAME_URL, 2000);
    let s = await evaluate(send, sessionId, `window.__game ? window.__game.state : 'NO GAME'`);
    check('title screen loads', s === 'title', `state=${s}`);

    // 2. Space starts the run.
    await tapKey(send, sessionId, 'Space', ' ');
    await sleep(600);
    s = await evaluate(send, sessionId, `window.__game.state`);
    check('space starts the run', s === 'run', `state=${s}`);

    // 3. Slide engages on the ground — tested right after the run starts,
    // before any obstacle can reach the turkey and stumble it.
    await send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'ArrowDown', key: 'ArrowDown' }, sessionId);
    await sleep(250);
    const sliding = await evaluate(send, sessionId, `window.__game.turkey.sliding`);
    await send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'ArrowDown', key: 'ArrowDown' }, sessionId);
    check('slide engages', sliding === true, `sliding=${sliding}`);

    // 4. The run advances: distance and score grow, HUD values are live.
    await sleep(3000);
    let hud = await evaluate(send, sessionId, `(() => {
      const w = window.__game.world;
      return { dist: w.distance, score: w.score, lives: w.lives, speed: w.speed };
    })()`);
    check('run advances (distance + score)', hud.dist > 5 && hud.score > 5, JSON.stringify(hud));

    // 5. Jump lifts the turkey off the ground.
    const before = await evaluate(send, sessionId, `window.__game.turkey.y`);
    await tapKey(send, sessionId, 'Space', ' ');
    await sleep(220);
    const midAir = await evaluate(send, sessionId, `window.__game.turkey.y`);
    check('jump lifts the turkey', midAir < before - 20, `y ${before} -> ${midAir}`);

    // 6. Pause and resume.
    await tapKey(send, sessionId, 'KeyP', 'p');
    await sleep(300);
    s = await evaluate(send, sessionId, `window.__game.state`);
    check('P pauses', s === 'pause', `state=${s}`);
    await tapKey(send, sessionId, 'KeyP', 'p');
    await sleep(300);
    s = await evaluate(send, sessionId, `window.__game.state`);
    check('P resumes', s === 'run', `state=${s}`);

    // 7. Mouse click also jumps (pointer path).
    await clickAt(send, sessionId, 640, 360);
    await sleep(200);
    const afterClick = await evaluate(send, sessionId, `window.__game.turkey.y`);
    check('click jumps', afterClick < 600, `y=${afterClick}`);

    // 8. Caught end screen renders (staged).
    await navigateAndWait(send, sessionId, `${GAME_URL}?shot=caught&seed=1`, 2000);
    s = await evaluate(send, sessionId, `window.__game.state`);
    check('caught end screen renders', s === 'caught', `state=${s}`);

    // 9. Escaped end screen renders (staged).
    await navigateAndWait(send, sessionId, `${GAME_URL}?shot=escaped&seed=1`, 2000);
    s = await evaluate(send, sessionId, `window.__game.state`);
    check('escaped end screen renders', s === 'escaped', `state=${s}`);

    // 10. Restart from the end screen.
    await sleep(800);
    await tapKey(send, sessionId, 'Space', ' ');
    await sleep(400);
    s = await evaluate(send, sessionId, `window.__game.state`);
    check('restart from end screen', s === 'run', `state=${s}`);

    // 11. No console errors anywhere in the session.
    const errors = events.filter(
      (e) => (e.method === 'Runtime.exceptionThrown')
        || (e.method === 'Log.entryAdded' && e.params?.entry?.level === 'error')
        || (e.method === 'Runtime.consoleAPICalled' && e.params?.type === 'error'),
    );
    check('zero console errors', errors.length === 0, `${errors.length} errors`);
    for (const e of errors.slice(0, 3)) console.log('  ', JSON.stringify(e).slice(0, 300));

    // 12. No network requests: every resource is a local file.
    const reqs = events
      .filter((e) => e.method === 'Network.requestWillBeSent')
      .map((e) => e.params.request.url);
    const external = reqs.filter((u) => !u.startsWith('file://'));
    check('no network requests (all local files)', external.length === 0, `${reqs.length} requests, external: ${external.join(', ') || 'none'}`);
  } finally {
    child.kill('SIGKILL');
  }
}

const failed = checks.filter((c) => !c.ok).length;
console.log(`\nsmoke: ${checks.length - failed}/${checks.length} passed`);
if (failed > 0) {
  console.error('smoke FAILED');
  exitCode = 1;
} else {
  console.log('smoke OK');
}
process.exit(exitCode);
