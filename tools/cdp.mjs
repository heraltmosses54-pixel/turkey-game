// Gobble Run — headless-Chrome CDP driver, written for this repo.
// Launches Chrome through the hatch sandbox wrapper and speaks the
// DevTools protocol over file descriptors 3 (write) and 4 (read),
// messages as NUL-delimited JSON. Node 22, standard library only.
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function launchChrome(profile = '/tmp/chrome-turkey') {
  const args = [
    profile,
    '--headless=new',
    '--remote-debugging-pipe',
    '--window-size=1280,720',
    '--no-first-run',
    '--proxy-bypass-list=<-loopback>',
    '--allow-file-access-from-files',
  ];
  const child = spawn('/opt/hatch/bin/hatch-chromium-sandbox', args, {
    stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'],
    env: { ...process.env, DISPLAY: ':99' },
  });
  let buf = Buffer.alloc(0);
  const pending = new Map();
  const events = [];
  let nextId = 1;

  child.on('exit', (code, signal) => {
    for (const { reject } of pending.values()) {
      reject(new Error(`chrome exited (${code}/${signal})`));
    }
    pending.clear();
  });
  child.stdio[4].on('data', (chunk) => {
    buf = Buffer.concat([buf, chunk]);
    let idx;
    while ((idx = buf.indexOf(0)) !== -1) {
      let msg;
      try {
        msg = JSON.parse(buf.subarray(0, idx).toString('utf8'));
      } catch {
        buf = buf.subarray(idx + 1);
        continue;
      }
      buf = buf.subarray(idx + 1);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      } else if (msg.method) {
        events.push(msg);
      }
    }
  });

  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    child.stdio[3].write(JSON.stringify(payload) + '\0');
  });

  return { child, send, events };
}

export async function attachPage(send) {
  const { targetInfos } = await send('Target.getTargets');
  const page = targetInfos.find((t) => t.type === 'page');
  if (!page) throw new Error('no page target: ' + JSON.stringify(targetInfos));
  const { sessionId } = await send('Target.attachToTarget', { targetId: page.targetId, flatten: true });
  await send('Page.enable', {}, sessionId);
  await send('Runtime.enable', {}, sessionId);
  await send('Log.enable', {}, sessionId);
  return { targetId: page.targetId, sessionId };
}

export async function navigateAndWait(send, sessionId, url, waitMs = 3000) {
  await send('Page.navigate', { url }, sessionId);
  await sleep(waitMs);
}

export async function evaluate(send, sessionId, expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId);
  if (r.exceptionDetails) {
    throw new Error('eval failed: ' + JSON.stringify(r.exceptionDetails).slice(0, 600));
  }
  return r.result.value;
}

export async function screenshotJpeg(send, sessionId, path, quality = 85) {
  const { data } = await send('Page.captureScreenshot', { format: 'jpeg', quality }, sessionId);
  writeFileSync(path, Buffer.from(data, 'base64'));
  return path;
}

export async function tapKey(send, sessionId, code, key, holdMs = 90) {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', code, key }, sessionId);
  await sleep(holdMs);
  await send('Input.dispatchKeyEvent', { type: 'keyUp', code, key }, sessionId);
}

export async function clickAt(send, sessionId, x, y) {
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 }, sessionId);
  await sleep(60);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 }, sessionId);
}

export { sleep };
