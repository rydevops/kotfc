/* =========================================================================
   input.js — keyboard + touch (d-pad, A/B, menu) unified into one model.
   - held(dir/button) for continuous movement
   - a handler stack for UI: the top handler receives button presses first
   ========================================================================= */
(function () {
  'use strict';
  const held = { up: false, down: false, left: false, right: false, a: false, b: false };
  const stack = []; // UI handlers: fn(button) -> true if consumed
  const worldPresses = []; // presses not consumed by UI, read by the world each frame

  const KEYMAP = {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    KeyZ: 'a', Enter: 'a', Space: 'a', KeyX: 'b', Escape: 'b', Backspace: 'b',
    KeyM: 'menu', Tab: 'menu',
  };

  const input = (G.input = {
    held,
    dir() { // dominant held direction
      if (held.up) return 'up';
      if (held.down) return 'down';
      if (held.left) return 'left';
      if (held.right) return 'right';
      return null;
    },
    push(fn) { stack.push(fn); return fn; },
    pop(fn) { const i = stack.lastIndexOf(fn); if (i >= 0) stack.splice(i, 1); },
    get uiActive() { return stack.length > 0; },
    press(btn) {
      G.audio && G.audio.unlock();
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i](btn)) return;
        if (stack[i].modal) return; // modal handlers swallow everything
      }
      worldPresses.push(btn);
    },
    takePresses() { const p = worldPresses.splice(0); return p; },
    clearPresses() { worldPresses.length = 0; },
    showControls(on) { document.getElementById('controls').classList.toggle('hidden', !on); },

    init() {
      window.addEventListener('keydown', (e) => {
        const b = KEYMAP[e.code];
        if (!b) return;
        e.preventDefault();
        if (b in held) {
          if (!e.repeat) { held[b] = true; }
        }
        if (!e.repeat || ['up', 'down', 'left', 'right'].includes(b)) input.press(b);
      });
      window.addEventListener('keyup', (e) => {
        const b = KEYMAP[e.code];
        if (b && b in held) held[b] = false;
      });
      window.addEventListener('blur', () => Object.keys(held).forEach((k) => (held[k] = false)));

      // --- d-pad: slide your thumb around; direction = dominant axis from centre
      const pad = document.getElementById('dpad');
      const nub = document.getElementById('dpad-nub');
      let padId = null, lastDir = null;
      const setDir = (d) => {
        ['up', 'down', 'left', 'right'].forEach((k) => (held[k] = k === d));
        pad.dataset.dir = d || '';
        if (d && d !== lastDir) input.press(d);
        lastDir = d;
      };
      const padMove = (e) => {
        const r = pad.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        const dist = Math.hypot(dx, dy), max = r.width * 0.32;
        const k = dist > max ? max / dist : 1;
        nub.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
        if (dist < r.width * 0.12) return setDir(null);
        setDir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
      };
      pad.addEventListener('pointerdown', (e) => {
        e.preventDefault(); padId = e.pointerId; pad.setPointerCapture(padId);
        G.audio && G.audio.unlock(); padMove(e);
      });
      pad.addEventListener('pointermove', (e) => { if (e.pointerId === padId) padMove(e); });
      const padEnd = (e) => {
        if (e.pointerId !== padId) return;
        padId = null; setDir(null); nub.style.transform = '';
      };
      pad.addEventListener('pointerup', padEnd);
      pad.addEventListener('pointercancel', padEnd);

      // --- buttons
      const bindBtn = (id, btn) => {
        const el = document.getElementById(id);
        el.addEventListener('pointerdown', (e) => {
          e.preventDefault(); e.stopPropagation();
          el.classList.add('down');
          if (btn in held) held[btn] = true;
          input.press(btn);
        });
        const up = () => { el.classList.remove('down'); if (btn in held) held[btn] = false; };
        el.addEventListener('pointerup', up);
        el.addEventListener('pointercancel', up);
        el.addEventListener('pointerleave', up);
      };
      bindBtn('btn-a', 'a');
      bindBtn('btn-b', 'b');
      bindBtn('btn-menu', 'menu');

      // stop iOS rubber-banding / double-tap zoom / long-press menus
      document.addEventListener('touchmove', (e) => { if (!e.target.closest('.scroll')) e.preventDefault(); }, { passive: false });
      document.addEventListener('gesturestart', (e) => e.preventDefault());
      document.addEventListener('contextmenu', (e) => e.preventDefault());
      let lastTouch = 0;
      document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouch < 300 && !e.target.closest('button,.tap')) e.preventDefault();
        lastTouch = now;
      }, { passive: false });
    },
  });
})();
