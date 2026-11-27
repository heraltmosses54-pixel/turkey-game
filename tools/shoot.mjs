// Gobble Run — capture the 4 screenshots at 1280x720 from the game's
// own staged scenes (?shot=).
// The sandboxed Chrome can only see files under /usr/local/share, so the
// tool first stages a fresh copy of game/ there (test staging only — the
// deliverable repo stays in ~/workspace/turkey-game/repo) and loads it
// over file://. Usage: node tools/shoot.mjs
// Writes screenshots/1-cover.jpg (title), 2-play.jpg, 3-kitchen.jpg,
// 4-end.jpg (caught). JPEG quality 85 keeps each file under 256 KiB.
import { cpSync, rmSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  attachPage, evaluate, launchChrome, navigateAndWait, screenshotJpeg, sleep,
} from './cdp.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..');
const outDir = join(repo, 'screenshots');
const STAGE_DIR = '/usr/local/share/turkey-game';
const GAME_URL = `file://${STAGE_DIR}/index.html`;

rmSync(STAGE_DIR, { recursive: true, force: true });
cpSync(join(repo, 'game'), STAGE_DIR, { recursive: true });

const SHOTS = [
  { name: '1-cover', query: 'shot=title&seed=1' },
  { name: '2-play', query: 'shot=play&seed=1' },
  { name: '3-kitchen', query: 'shot=kitchen&seed=1' },
  { name: '4-end', query: 'shot=caught&seed=1' },
];

let failures = 0;
const { child, send, events } = launchChrome('/tmp/chrome-turkey-shoot');
try {
  await sleep(3500);
  const { sessionId } = await attachPage(send);
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280, height: 720, deviceScaleFactor: 1, mobile: false,
  }, sessionId);

  for (const shot of SHOTS) {
    const url = `${GAME_URL}?${shot.query}`;
    await navigateAndWait(send, sessionId, url, 2500);
    const state = await evaluate(send, sessionId, `(() => {
      const g = window.__game;
      return g ? { state: g.state, score: Math.floor(g.world.score), dist: Math.floor(g.world.distance), lives: g.world.lives } : null;
    })()`);
    console.log(shot.name, JSON.stringify(state));
    const path = join(outDir, `${shot.name}.jpg`);
    await screenshotJpeg(send, sessionId, path, 85);
    const bytes = statSync(path).size;
    console.log('captured', shot.name, `${bytes} bytes`);
    if (bytes > 262144) {
      console.error(`OVER SIZE LIMIT: ${shot.name} is ${bytes} bytes (> 256 KiB)`);
      failures++;
    }
  }

  const errors = events.filter(
    (e) => (e.method === 'Runtime.exceptionThrown')
      || (e.method === 'Log.entryAdded' && e.params?.entry?.level === 'error')
      || (e.method === 'Runtime.consoleAPICalled' && e.params?.type === 'error'),
  );
  console.log('console errors across shots:', errors.length);
  for (const e of errors.slice(0, 5)) console.log(JSON.stringify(e).slice(0, 400));
  if (errors.length > 0) failures++;
} finally {
  child.kill('SIGKILL');
}

if (failures > 0) {
  console.error(`shoot FAILED (${failures} problems)`);
  process.exit(1);
}
console.log('shoot OK');
