// Gobble Run — keyboard and mouse input. One tiny state object the game
// loop reads: jump pressed (edge), slide held, and menu clicks.

export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  let clickX = null;
  let clickY = null;
  let clicked = false;

  function isJumpCode(code) {
    return code === 'Space' || code === 'ArrowUp' || code === 'KeyW';
  }
  function isSlideCode(code) {
    return code === 'ArrowDown' || code === 'KeyS';
  }

  window.addEventListener('keydown', (e) => {
    if (isJumpCode(e.code) || isSlideCode(e.code) || e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
      e.preventDefault();
    }
    if (!e.repeat) pressed.add(e.code);
    keys.add(e.code);
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => { keys.clear(); pressed.clear(); });

  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;
    clicked = true;
    pressed.add('PointerJump');
  });

  return {
    // Edge-triggered: true once per physical press, consumed by the loop.
    jumpPressed() {
      for (const code of pressed) {
        if (isJumpCode(code) || code === 'PointerJump') {
          pressed.delete(code);
          return true;
        }
      }
      return false;
    },
    slideHeld() {
      for (const code of keys) if (isSlideCode(code)) return true;
      return false;
    },
    pausePressed() {
      if (pressed.has('KeyP')) { pressed.delete('KeyP'); return true; }
      return false;
    },
    mutePressed() {
      if (pressed.has('KeyM')) { pressed.delete('KeyM'); return true; }
      return false;
    },
    anyKeyPressed() {
      if (pressed.size > 0) { pressed.clear(); return true; }
      return false;
    },
    // A click inside a rectangle, consumed once.
    clickedIn(x, y, w, h) {
      if (!clicked) return false;
      const hit = clickX >= x && clickX <= x + w && clickY >= y && clickY <= y + h;
      clicked = false;
      return hit;
    },
    consumeClick() { clicked = false; },
  };
}
