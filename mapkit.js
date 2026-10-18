/* =========================================================================
   mapkit.js — a tiny toolkit for laying out ASCII maps in code.
   Big islands are easier to draw with blobs, rectangles and house helpers
   than by typing out 1,500 characters. A map's `tiles` is just kit.rows(g).

     const g = kit.grid(36, 40);
     kit.blob(g, 18, 20, 12, 9, 'H');           // an island of hull plate
     kit.house(g, 4, 6, 7, { roof: 'J', wall: 'i', door: 'O' });
     kit.rect(g, 10, 2, 3, 6, '_');
     kit.scatter(g, 'x', 6, 7, 'H');            // crates on plates only
     tiles: kit.rows(g)
   ========================================================================= */
(function () {
  'use strict';
  const H = G.util.hash;

  const kit = (G.kit = {
    grid(w, h, fill = ' ') { return Array.from({ length: h }, () => Array(w).fill(fill)); },
    at(g, x, y) { return (g[y] && g[y][x]) || ' '; },
    set(g, x, y, ch) { if (g[y] && x >= 0 && x < g[0].length) g[y][x] = ch; },
    rect(g, x, y, w, h, ch) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) kit.set(g, x + i, y + j, ch); },
    // hollow frame
    frame(g, x, y, w, h, ch) { kit.rect(g, x, y, w, 1, ch); kit.rect(g, x, y + h - 1, w, 1, ch); kit.rect(g, x, y, 1, h, ch); kit.rect(g, x + w - 1, y, 1, h, ch); },
    hline(g, x0, x1, y, ch) { for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) kit.set(g, x, y, ch); },
    vline(g, x, y0, y1, ch) { for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) kit.set(g, x, y, ch); },
    // an organic filled ellipse; `rough` bites irregular chunks off the rim
    blob(g, cx, cy, rx, ry, ch, seed = 1, rough = 0.18) {
      for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
        const dx = (x - cx) / rx, dy = (y - cy) / ry;
        const d = dx * dx + dy * dy + (H(x, y, seed) - 0.5) * rough * 2;
        if (d <= 1) kit.set(g, x, y, ch);
      }
    },
    // a house: two roof rows over one wall row with windows and a centred door
    house(g, x, y, w, o = {}) {
      const roof = o.roof || '^', wall = o.wall || '#', win = o.win === undefined ? 'w' : o.win, door = o.door || 'D';
      const di = o.doorAt != null ? o.doorAt : Math.floor(w / 2);
      kit.rect(g, x, y, w, 2, roof);
      for (let i = 0; i < w; i++) kit.set(g, x + i, y + 2, i === di ? door : win && i % 2 === 1 ? win : wall);
      return { doorX: x + di, doorY: y + 2, frontY: y + 3 };
    },
    // scatter props over tiles of the allowed kinds, deterministically
    scatter(g, ch, n, seed, only, box) {
      const w = g[0].length, h = g.length;
      const b = box || { x: 0, y: 0, w, h };
      let placed = 0;
      for (let i = 0; i < n * 40 && placed < n; i++) {
        const x = b.x + Math.floor(H(i, seed, 71) * b.w), y = b.y + Math.floor(H(i, seed, 72) * b.h);
        if (only.includes(kit.at(g, x, y))) { kit.set(g, x, y, ch); placed++; }
      }
    },
    // fence the outer edge of a floor kind with rails (leaves gaps beside walkway '_' tiles)
    rail(g, floors, rail = 'q', open = '_') {
      const copy = g.map((r) => r.slice());
      for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) {
        if (!floors.includes(copy[y][x])) continue;
        const ns = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => (copy[y + dy] || [])[x + dx] || ' ');
        if (ns.includes(' ') && !ns.includes(open)) g[y][x] = rail;
      }
    },
    rows(g) { return g.map((r) => r.join('')); },

    /* Dev helper: BFS over a map definition from (sx, sy); returns the set of reachable tiles.
       Used by the test scripts to check that every NPC, chest and warp can be reached. */
    reach(def, sx, sy, extraOpen) {
      const rows = def.tiles, h = rows.length, w = Math.max(...rows.map((r) => r.length));
      const solid = (x, y) => { const t = G.TILES[(rows[y] || '')[x] || ' ']; return !t || t.solid || t.void; };
      const seen = new Set([sx + ',' + sy]), q = [[sx, sy]];
      while (q.length) {
        const [x, y] = q.shift();
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h || seen.has(nx + ',' + ny)) continue;
          if (solid(nx, ny) && !(extraOpen && extraOpen(nx, ny))) continue;
          seen.add(nx + ',' + ny); q.push([nx, ny]);
        }
      }
      return seen;
    },
  });
})();
