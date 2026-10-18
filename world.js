/* =========================================================================
   world.js — the exploration scene.
   Grid movement, NPCs, followers (party walks behind Wren), interactions,
   warps, triggers, random encounters, dynamic lantern lighting and HUD.
   ========================================================================= */
(function () {
  'use strict';
  const U = G.util, TS = G.TILE;
  const MOVE_MS = 165;
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

  function makeEntity(o) {
    return Object.assign({ x: 0, y: 0, px: 0, py: 0, dir: 'down', moving: false, fromX: 0, fromY: 0, t: 0, frame: 0, walkT: 0, solid: true, speed: MOVE_MS }, o, {
      px: o.x * TS, py: o.y * TS,
    });
  }

  const world = (G.world = {
    map: null, def: null, grid: [], W: 0, H: 0, layer: null,
    player: null, followers: [], npcs: [], chests: [],
    lights: [], lightOverride: {}, env: {}, envOverride: {},
    busy: 0, cam: { x: 0, y: 0 }, t: 0, frameN: 0, stepsSinceBattle: 0,
    pendingEnter: false,

    get st() { return G.game.state; },

    /* ---------------- map loading ---------------- */
    load(mapId, x, y, dir) {
      const def = G.data.maps[mapId];
      if (!def) throw new Error('Unknown map ' + mapId);
      const st = this.st;
      this.def = def; this.map = mapId;
      this.lightOverride = {}; this.envOverride = {};
      this.grid = def.tiles.map((r) => r.split(''));
      this.H = this.grid.length;
      this.W = Math.max(...def.tiles.map((r) => r.length));
      this.grid.forEach((r) => { while (r.length < this.W) r.push(' '); });
      if (def.setup) def.setup(st, this.grid);
      st.map = mapId; st.x = x; st.y = y; st.dir = dir || st.dir;
      this.refreshEnv();
      this.buildLayer();
      this.collectLights();
      // player and followers
      this.player = makeEntity({ id: 'player', look: 'wren', x, y, dir: st.dir, solid: false });
      this.followers = st.party.slice(1).map((m) => makeEntity({ id: 'f_' + m.id, member: m.id, look: G.data.chars[m.id].look, x, y, dir: st.dir, solid: false }));
      this.spawnNpcs();
      this.chests = (def.chests || []).map((c) => Object.assign({}, c));
      // line followers up behind the leader where there is room
      const back = { up: [0, 1], down: [0, -1], left: [1, 0], right: [-1, 0] }[st.dir] || [0, 1];
      let fx = x, fy = y;
      this.followers.forEach((f) => {
        const nx = fx + back[0], ny = fy + back[1];
        if (this.passable(nx, ny, f)) { fx = nx; fy = ny; }
        f.x = fx; f.y = fy; f.px = fx * TS; f.py = fy * TS;
      });
      this.stepsSinceBattle = 0;
      this.snapCamera();
      this.updateHud(true);
      G.audio.music(this.env.music);
    },

    refreshEnv() {
      const base = { sky: 'dusk', ambient: 0, ambientColor: '#0a0820', music: null, lights: true, sink: 0, weather: null };
      this.env = Object.assign(base, this.def.env ? this.def.env(this.st) : {}, this.envOverride);
    },

    spawnNpcs() {
      const st = this.st;
      this.npcs = (this.def.npcs || [])
        .filter((n) => !n.cond || n.cond(st))
        .map((n) => makeEntity(Object.assign({}, n, { home: { x: n.x, y: n.y }, wanderT: U.rand(1000, 3000) })));
    },

    tileAt(x, y) { return (this.grid[y] && this.grid[y][x]) || ' '; },
    tileDef(x, y) { return G.TILES[this.tileAt(x, y)] || G.TILES[' ']; },

    buildLayer() {
      const interior = !!this.def.interior, floating = !interior && !this.def.noCliffs;
      const { c, x } = G.gfx.makeCanvas(this.W * TS, this.H * TS + (floating ? G.terrain.EXTRA : 2 * TS));
      this.talls = [];
      for (let ty = 0; ty < this.H + 1; ty++) {
        for (let tx = 0; tx < this.W; tx++) {
          const ch = this.tileAt(tx, ty);
          const t = G.TILES[ch];
          if (!t || t.void) {
            if (interior || this.def.noCliffs) continue;
            const above = G.TILES[this.tileAt(tx, ty - 1)];
            if (above && above.pier) drawPosts(x, tx * TS, ty * TS, tx);
            continue;
          }
          if (t.tall) this.talls.push({ tx, ty, t });
          if (t.anim && !t.tall) continue;
          const d = G.makeTileDrawer(x, tx * TS, ty * TS);
          if (t.under) this.paintUnder(d, tx, ty);
          if (!t.tall || t.base) (t.base || t.paint)(d, tx, ty, 0, x);
        }
      }
      // roof ridges and eaves
      for (let ty = 0; ty < this.H; ty++) for (let tx = 0; tx < this.W; tx++) {
        const ch = this.tileAt(tx, ty);
        if (ch !== '^' && ch !== 'R') continue;
        const up = this.tileAt(tx, ty - 1), dn = this.tileAt(tx, ty + 1);
        if (up !== ch) { x.fillStyle = ch === '^' ? '#f08a6a' : '#6a7ac0'; x.fillRect(tx * TS, ty * TS, TS, 2); x.fillStyle = ch === '^' ? '#5a1e18' : '#141832'; x.fillRect(tx * TS, ty * TS, TS, 1); }
        if (dn !== ch) { x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(tx * TS, ty * TS + 12, TS, 4); x.fillStyle = ch === '^' ? '#5a1e18' : '#141832'; x.fillRect(tx * TS, ty * TS + 15, TS, 1); }
      }
      // the island itself: rounded edges and a sculpted rocky underside
      this.debris = []; this.terrainLights = [];
      if (floating) {
        G.terrain.edges(this, x);
        const tr = G.terrain.build(this, this.map.length * 31);
        x.drawImage(tr.canvas, 0, 0);
        this.debris = tr.debris;
        this.terrainLights = tr.lights;
      }
      this.layer = c;
      this.animTiles = [];
      for (let ty = 0; ty < this.H; ty++) for (let tx = 0; tx < this.W; tx++) {
        const t = G.TILES[this.tileAt(tx, ty)];
        if (t && t.anim && !t.tall) this.animTiles.push({ tx, ty, t, ch: this.tileAt(tx, ty) });
      }
    },
    // ground painted beneath objects (crates, lanterns...) = nearest walkable neighbour
    paintUnder(d, tx, ty) {
      for (const [dx, dy] of [[-1, 0], [0, 1], [1, 0], [0, -1]]) {
        const ch = this.tileAt(tx + dx, ty + dy), t = G.TILES[ch];
        if (t && !t.solid && !t.void && !t.anim && !t.bridge) { t.paint(d, tx, ty, 0); return; }
      }
      G.TILES[this.def.interior ? 'n' : '='].paint(d, tx, ty, 0);
    },

    collectLights() {
      this.lights = [];
      for (let ty = 0; ty < this.H; ty++) for (let tx = 0; tx < this.W; tx++) {
        const t = G.TILES[this.tileAt(tx, ty)];
        if (t && t.light) this.lights.push({ key: tx + ',' + ty, x: tx * TS + 8, y: ty * TS + (t.name === 'lantern' ? -6 : 8), r: t.light.r, color: t.light.color, glow: t.light.glow, lamp: !!t.lightKey, tile: t.name });
      }
      for (const L of this.terrainLights || []) this.lights.push(Object.assign({}, L));
      for (const L of this.def.lights || []) this.lights.push(Object.assign({ key: 'x' + L.x + ',' + L.y, glow: 0.5, lamp: true }, L, { x: L.x * TS + 8, y: L.y * TS + 8 }));
    },
    isLit(light) {
      if (light.key in this.lightOverride) return this.lightOverride[light.key];
      if (!light.lamp) return true;
      return this.env.lights !== false;
    },
    tileLit(tx, ty) {
      const k = tx + ',' + ty;
      if (k in this.lightOverride) return this.lightOverride[k];
      return this.env.lights !== false;
    },

    bridgeFlicker(tx, ty, f) {
      const n = (this.st && this.st.bridgeCrossings) || 0;
      const amt = Math.min(0.75, 0.1 + n * 0.012 + (this.env.bridgeFlicker || 0));
      const v = Math.sin(f * 0.07 + tx * 0.7) * Math.sin(f * 0.031 + ty);
      const drop = U.hash(tx, ty, Math.floor(f / 8)) < amt * 0.25 ? 0.5 : 0;
      return U.clamp(1 - amt * 0.5 * (v + 1) * 0.5 - drop, 0.15, 1);
    },

    /* ---------------- collision ---------------- */
    entityAt(x, y, except) {
      for (const n of this.npcs) if (n !== except && !n.hidden && n.solid && ((n.x === x && n.y === y) || (n.moving && n.toX === x && n.toY === y))) return n;
      return null;
    },
    chestAt(x, y) { return this.chests.find((c) => c.x === x && c.y === y); },
    passable(x, y, mover) {
      if (x < 0 || y < 0 || x >= this.W || y >= this.H) return false;
      const t = this.tileDef(x, y);
      if (t.solid) return false;
      if (this.chestAt(x, y)) return false;
      if (this.entityAt(x, y, mover)) return false;
      if (mover !== this.player && this.player && this.player.x === x && this.player.y === y) return false;
      return true;
    },

    /* ---------------- movement ---------------- */
    startMove(e, dir, force) {
      e.dir = dir;
      const [dx, dy] = DIRS[dir];
      const nx = e.x + dx, ny = e.y + dy;
      if (!force && !this.passable(nx, ny, e)) return false;
      e.moving = true; e.fromX = e.x; e.fromY = e.y; e.toX = nx; e.toY = ny; e.t = 0;
      return true;
    },
    stepEntity(e, dt) {
      if (!e.moving) return false;
      e.t += dt;
      const k = Math.min(1, e.t / e.speed);
      e.px = U.lerp(e.fromX, e.toX, k) * TS;
      e.py = U.lerp(e.fromY, e.toY, k) * TS;
      e.walkT += dt;
      e.frame = Math.floor(e.walkT / (e.speed / 2)) % 4;
      if (k >= 1) {
        e.moving = false; e.x = e.toX; e.y = e.toY; e.px = e.x * TS; e.py = e.y * TS;
        return true;
      }
      return false;
    },

    /* move an entity along a path string like "UULLD" (used by scripts) */
    walkPath(e, path, speed) {
      return new Promise((resolve) => {
        const steps = path.toUpperCase().split('').map((c) => ({ U: 'up', D: 'down', L: 'left', R: 'right' }[c])).filter(Boolean);
        e.queue = steps; e.speed = speed || e.speed; e.onQueueDone = resolve;
        if (!steps.length) resolve();
      });
    },

    /* ---------------- per-frame ---------------- */
    update(dt) {
      this.t += dt; this.frameN++;
      const st = this.st;
      if (!st) return;
      const p = this.player;
      const ents = [p, ...this.followers, ...this.npcs];

      // scripted queues (cutscenes)
      for (const e of ents) {
        if (!e.moving && e.queue && e.queue.length) {
          const d = e.queue.shift();
          this.startMove(e, d, true);
          if (e === p) this.followStep();
        }
        const arrived = this.stepEntity(e, dt);
        // the player's arrival is handled the instant a step completes, before the next
        // step can start — otherwise holding the d-pad would skip triggers and encounters
        if (arrived && e === p) {
          st.x = p.x; st.y = p.y; st.dir = p.dir;
          if (!this.busy && !(p.queue && p.queue.length)) this.onArrive();
        }
        if (arrived && e.queue && !e.queue.length && e.onQueueDone) { const cb = e.onQueueDone; e.onQueueDone = null; e.speed = MOVE_MS; cb(); }
        if (!e.moving && !(e.queue && e.queue.length)) { e.walkT = 0; e.frame = 0; }
      }

      // NPC wandering
      if (!this.busy) for (const n of this.npcs) {
        if (!n.wander || n.moving) continue;
        n.wanderT -= dt;
        if (n.wanderT <= 0) {
          n.wanderT = U.rand(1500, 4000);
          const d = U.pick(Object.keys(DIRS));
          const [dx, dy] = DIRS[d];
          if (Math.abs(n.x + dx - n.home.x) <= (n.wander === true ? 2 : n.wander) && Math.abs(n.y + dy - n.home.y) <= (n.wander === true ? 2 : n.wander)) this.startMove(n, d);
          else n.dir = d;
        }
      }

      // player control
      const presses = G.input.takePresses();
      const canControl = !this.busy && !G.input.uiActive && G.scenes.name === 'world';
      if (canControl) {
        if (presses.includes('menu')) { G.menu.open(); return; }
        if (presses.includes('a') && !p.moving) { this.interact(); }
        else if (!p.moving) {
          const d = G.input.dir() || presses.find((b) => b === 'up' || b === 'down' || b === 'left' || b === 'right');
          if (d) {
            if (this.startMove(p, d)) {
              this.followStep();
              p.blocked = null;
            } else {
              p.dir = d;
              if (p.blocked !== d) { p.blocked = d; this.bump(); }
            }
          } else p.blocked = null;
        }
      }
      this.updateCamera(dt);
    },

    // followers trail behind the leader
    followStep() {
      const p = this.player;
      let tx = p.fromX, ty = p.fromY;
      for (const f of this.followers) {
        const ox = f.x, oy = f.y;
        if (ox !== tx || oy !== ty) {
          const dir = tx > ox ? 'right' : tx < ox ? 'left' : ty > oy ? 'down' : 'up';
          f.dir = dir; f.moving = true; f.fromX = ox; f.fromY = oy; f.toX = tx; f.toY = ty; f.t = 0; f.speed = p.speed;
        }
        tx = ox; ty = oy;
      }
    },

    async onArrive() {
      const p = this.player, st = this.st, def = this.def;
      if (this.tileDef(p.x, p.y).bridge) st.bridgeCrossings = (st.bridgeCrossings || 0) + 0.25;
      // warps
      for (const w of def.warps || []) {
        if (w.x === p.x && w.y === p.y && (!w.cond || w.cond(st))) {
          G.audio.sfx(w.sfx || 'door');
          return G.script.run((S) => S.warp(w.to, w.tx, w.ty, w.dir || p.dir));
        }
      }
      // triggers
      for (const tr of def.triggers || []) {
        const inside = p.x >= tr.x && p.x < tr.x + (tr.w || 1) && p.y >= tr.y && p.y < tr.y + (tr.h || 1);
        if (inside && (!tr.cond || tr.cond(st)) && !(tr.once && st.flags[tr.once])) {
          if (tr.once) st.flags[tr.once] = true;
          return G.script.run((S) => tr.run(S, st));
        }
      }
      // encounters
      const enc = def.encounters;
      this.stepsSinceBattle++;
      if (enc && (!enc.cond || enc.cond(st)) && !G.DEBUG_NOENC) {
        const grass = this.tileDef(p.x, p.y).encounter;
        const onZone = enc.where === 'all' || grass;
        const rate = grass && enc.grassRate ? enc.grassRate : enc.rate || 0.08;
        if (onZone && this.stepsSinceBattle > 5 && Math.random() < rate) {
          this.stepsSinceBattle = 0;
          const troop = U.weighted(enc.troops);
          G.script.run((S) => S.battle({ mobs: troop.mobs, bg: enc.bg || def.battleBg, music: enc.music }));
        }
      }
    },

    // walking into a door (or anything flagged bump) opens it
    bump() {
      const { x, y } = this.facingTile();
      const st = this.st, def = this.def;
      for (const w of def.warps || []) {
        if (w.x === x && w.y === y && (!w.cond || w.cond(st))) {
          G.audio.sfx(w.sfx || 'door');
          return G.script.run((S) => S.warp(w.to, w.tx, w.ty, w.dir || this.player.dir));
        }
      }
      for (const it of def.interact || []) {
        if (it.bump && it.x === x && it.y === y && (!it.cond || it.cond(st))) return G.script.run((S) => it.run(S, st));
      }
    },

    facingTile() {
      const p = this.player, [dx, dy] = DIRS[p.dir];
      return { x: p.x + dx, y: p.y + dy };
    },

    interact() {
      let { x, y } = this.facingTile();
      // talk across shop counters and desks
      const ft = this.tileAt(x, y);
      if ((ft === 's' || ft === 'd') && !(this.def.interact || []).some((i) => i.x === x && i.y === y && (!i.cond || i.cond(this.st)))) {
        const [dx, dy] = DIRS[this.player.dir];
        if (this.npcs.some((n) => n.x === x + dx && n.y === y + dy)) { x += dx; y += dy; }
      }
      const st = this.st, def = this.def, p = this.player;
      // NPCs
      const n = this.npcs.find((e) => !e.hidden && ((e.x === x && e.y === y) || (e.moving && e.toX === x && e.toY === y)));
      if (n && n.talk) {
        return G.script.run(async (S) => {
          const prev = n.dir;
          if (n.face !== false) n.dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[p.dir];
          await n.talk(S, n, st);
          if (n.face !== false && !n.keepFacing) n.dir = n.wander ? n.dir : prev;
        });
      }
      // chests
      const c = this.chestAt(x, y);
      if (c) {
        return G.script.run(async (S) => {
          if (st.opened[def.id + ':' + c.id]) return S.narrate('It\'s empty.');
          st.opened[def.id + ':' + c.id] = true;
          G.audio.sfx('chest');
          if (c.gold) { st.gold += c.gold; await S.narrate(`Found *${c.gold} gold*!`); }
          if (c.item) { G.game.addItem(c.item, c.qty || 1); await S.narrate(`Found *${G.data.items[c.item].name}*${(c.qty || 1) > 1 ? ' ×' + c.qty : ''}!`); }
        });
      }
      // map interactables (signs, desks, doors...)
      for (const it of def.interact || []) {
        if (it.x === x && it.y === y && (!it.cond || it.cond(st))) return G.script.run((S) => it.run(S, st));
      }
      for (const w of def.warps || []) {
        if (w.x === x && w.y === y && (!w.cond || w.cond(st))) { this.bump(); return; }
      }
      if (this.tileDef(x, y).door) {
        return G.script.run((S) => S.narrate(U.pick(['Locked. Someone inside is humming.', 'The door\'s locked. It smells like cinnamon.', 'Locked tight.', 'No answer.'])));
      }
    },

    /* ---------------- camera ---------------- */
    snapCamera() { this.updateCamera(0, true); },
    updateCamera(dt, snap) {
      if (this.camTarget) {
        const tg = this.camTarget;
        this.cam.x = U.lerp(this.cam.x, tg.x - G.gfx.W / 2, snap ? 1 : 0.08);
        this.cam.y = U.lerp(this.cam.y, tg.y - G.gfx.H * 0.45, snap ? 1 : 0.08);
        return;
      }
      const p = this.player;
      const focusY = G.gfx.portrait ? 0.42 : 0.5;
      let cx = p.px + 8 - G.gfx.W / 2, cy = p.py + 8 - G.gfx.H * focusY;
      if (this.def.interior) { // keep interiors framed
        const mw = this.W * TS, mh = this.H * TS;
        cx = mw < G.gfx.W ? (mw - G.gfx.W) / 2 : U.clamp(cx, 0, mw - G.gfx.W);
        cy = mh < G.gfx.H * 0.7 ? (mh - G.gfx.H * focusY * 2) / 2 : U.clamp(cy, -40, mh - G.gfx.H + 120);
      }
      this.cam.x = cx; this.cam.y = cy;
    },

    /* ---------------- rendering ---------------- */
    render(ctx) {
      if (!this.def) return;
      const W = G.gfx.W, Hh = G.gfx.H;
      const cx = Math.round(this.cam.x), cy = Math.round(this.cam.y);
      const env = this.env;
      G.sky.draw(ctx, this.def.interior ? 'none' : env.sky, cx + (env.travel ? this.t * env.travel : 0), cy, this.t, { sink: env.sink });
      if (env.ribbons) G.sky.ribbons(ctx, this.t, env.ribbons, 0.2);
      ctx.save();
      ctx.translate(-cx, -cy + (env.sinkOffset || 0));
      for (const d of this.debris || []) ctx.drawImage(d.img, d.x, Math.round(d.y + Math.sin(this.t / 1500 + d.ph) * 3));
      ctx.drawImage(this.layer, 0, 0);
      // animated tiles
      for (const a of this.animTiles) {
        const px = a.tx * TS, py = a.ty * TS;
        if (px + TS < cx || px > cx + W || py + TS < cy - 20 || py > cy + Hh) continue;
        const d = G.makeTileDrawer(ctx, px, py);
        if (a.t.under) this.paintUnder(d, a.tx, a.ty);
        a.t.paint(d, a.tx, a.ty, this.frameN, ctx, this.tileLit(a.tx, a.ty));
      }
      // objects (big drawn things)
      for (const o of this.def.objects || []) if (!o.over && (!o.cond || o.cond(this.st))) o.draw(ctx, o.x * TS, o.y * TS, this.t, this);
      // chests
      for (const c of this.chests) drawChest(ctx, c.x * TS, c.y * TS, this.st.opened[this.def.id + ':' + c.id]);
      // entities, sorted by y
      const ents = [...this.npcs.filter((n) => !n.hidden), ...this.followers.slice().reverse(), this.player];
      const drawList = ents.map((e) => ({ y: e.py + 1, e }));
      for (const tl of this.talls || []) {
        const px = tl.tx * TS, py = tl.ty * TS;
        if (px + 48 < cx || px - 32 > cx + W || py + 32 < cy || py - 48 > cy + Hh) continue;
        drawList.push({ y: py, tl });
      }
      drawList.sort((a, b) => a.y - b.y);
      for (const it of drawList) {
        if (it.e) this.drawEntity(ctx, it.e);
        else it.tl.t.tall(ctx, it.tl.tx * TS, it.tl.ty * TS, it.tl.tx, it.tl.ty, this.frameN, this.tileLit(it.tl.tx, it.tl.ty), this.t);
      }
      // Cog hovers near Pip
      const pipE = this.followers.find((f) => f.member === 'pip') || (this.npcs.find((n) => n.id === 'pip' && !n.hidden));
      if (pipE && !this.hideCog) {
        const bob = Math.sin(this.t / 300) * 2;
        const cog = G.sprites.char(this.st.flags.cogDim ? 'cogDim' : 'cog').down[0];
        ctx.drawImage(cog, Math.round(pipE.px + 11), Math.round(pipE.py - 14 + bob));
      }
      // overhead objects (sails, awnings) draw above characters
      for (const o of this.def.objects || []) if (o.over && (!o.cond || o.cond(this.st))) o.draw(ctx, o.x * TS, o.y * TS, this.t, this);
      // emotes
      for (const e of ents) if (e.emote && e.emote.until > this.t) drawEmote(ctx, e);
      ctx.restore();
      this.renderLighting(ctx, cx, cy - (env.sinkOffset || 0));
      this.renderWeather(ctx);
    },

    drawEntity(ctx, e) {
      const spr = G.sprites.char(e.look);
      const frames = spr[e.dir] || spr.down;
      const img = frames[e.moving || (e.queue && e.queue.length) ? e.frame : 0];
      // sprites stand on the bottom of their tile, centred
      const x = Math.round(e.px + 8 - img.width / 2) + (e.ox || 0), y = Math.round(e.py + 15 - img.height) + (e.oy || 0);
      const sw = Math.min(14, Math.max(10, img.width * 0.6));
      ctx.fillStyle = 'rgba(10,6,20,0.3)';
      ctx.fillRect(Math.round(e.px + 8 - sw / 2), Math.round(e.py) + 13, Math.round(sw), 2);
      ctx.fillRect(Math.round(e.px + 8 - sw / 2 + 1), Math.round(e.py) + 15, Math.round(sw - 2), 1);
      ctx.drawImage(img, x, y);
    },

    renderLighting(ctx, cx, cy) {
      const env = this.env;
      const amb = env.ambient || 0;
      if (amb <= 0.01) return;
      const W = G.gfx.W, Hh = G.gfx.H;
      if (!this.lc || this.lc.c.width !== W || this.lc.c.height !== Hh) this.lc = G.gfx.makeCanvas(W, Hh);
      const lx = this.lc.x;
      lx.globalCompositeOperation = 'source-over';
      lx.clearRect(0, 0, W, Hh);
      lx.globalAlpha = amb;
      lx.fillStyle = env.ambientColor;
      lx.fillRect(0, 0, W, Hh);
      lx.globalAlpha = 1;
      lx.globalCompositeOperation = 'destination-out';
      const glows = [];
      const t = this.t;
      const addLight = (x, y, r, color, glow, seed) => {
        const sx = x - cx, sy = y - cy;
        if (sx < -r || sy < -r || sx > W + r || sy > Hh + r) return;
        const fr = r * (1 + Math.sin(t / 130 + seed) * 0.03 + Math.sin(t / 47 + seed * 3) * 0.015);
        const g = lx.createRadialGradient(sx, sy, 0, sx, sy, fr);
        g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.5, 'rgba(0,0,0,0.75)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        lx.fillStyle = g;
        lx.fillRect(sx - fr, sy - fr, fr * 2, fr * 2);
        glows.push({ sx, sy, fr, color, glow });
      };
      this.lights.forEach((L, i) => { if (this.isLit(L)) addLight(L.x, L.y, L.r, L.color, L.glow, i); });
      // the pendant glows once it has awakened
      if (this.st.flags.pendantWarm) addLight(this.player.px + 8, this.player.py + 6, 44, '#ffd27a', 0.35, 99);
      // Cog is a lantern, after all
      const pipE = this.followers.find((f) => f.member === 'pip');
      if (pipE) addLight(pipE.px + 16, pipE.py - 4, this.st.flags.cogDim ? 14 : 26, '#ffc060', 0.4, 7);
      for (const ex of this.extraLights || []) addLight(ex.x, ex.y, ex.r, ex.color, ex.glow || 0.4, 3);
      lx.globalCompositeOperation = 'source-over';
      ctx.drawImage(this.lc.c, 0, 0);
      // additive warm glow
      ctx.globalCompositeOperation = 'lighter';
      for (const g of glows) {
        const gr = ctx.createRadialGradient(g.sx, g.sy, 0, g.sx, g.sy, g.fr * 0.8);
        const [r, gg, b] = U.hexToRgb(g.color);
        gr.addColorStop(0, `rgba(${r},${gg},${b},${0.32 * g.glow * amb + 0.06})`);
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gr;
        ctx.fillRect(g.sx - g.fr, g.sy - g.fr, g.fr * 2, g.fr * 2);
      }
      ctx.globalCompositeOperation = 'source-over';
    },

    renderWeather(ctx) {
      const w = this.env.weather;
      if (!w) return;
      const W = G.gfx.W, Hh = G.gfx.H, t = this.t;
      for (let i = 0; i < 26; i++) {
        const sp = 0.01 + U.hash(i, 1) * 0.02;
        if (w === 'embers') {
          const x = ((U.hash(i, 2) * W + Math.sin(t / 900 + i) * 12) % W + W) % W;
          const y = Hh - ((t * sp + U.hash(i, 3) * Hh) % (Hh + 20));
          ctx.fillStyle = i % 3 ? '#ffb050' : '#ffe08a';
          ctx.globalAlpha = 0.6; ctx.fillRect(x, y, 1, 1);
        } else if (w === 'motes') {
          const x = ((U.hash(i, 2) * W + t * sp * 0.4) % W + W) % W;
          const y = ((U.hash(i, 3) * Hh + Math.sin(t / 1200 + i) * 20) % Hh + Hh) % Hh;
          ctx.fillStyle = '#9ae8ff'; ctx.globalAlpha = 0.35 + 0.35 * Math.sin(t / 400 + i); ctx.fillRect(x, y, 1, 1);
        } else if (w === 'fog') {
          const x = ((U.hash(i, 2) * (W + 80) + t * sp * 0.5) % (W + 80) + W + 80) % (W + 80) - 40;
          const y = (U.hash(i, 3) * Hh + Math.sin(t / 2500 + i) * 10 + Hh) % Hh;
          ctx.fillStyle = '#c8d0cc'; ctx.globalAlpha = 0.07 + 0.05 * Math.sin(t / 900 + i);
          ctx.fillRect(x, y, 34 + (i % 4) * 12, 5 + (i % 3) * 2);
        } else if (w === 'petals') {
          const x = ((U.hash(i, 2) * W + t * sp * 0.35 + Math.sin(t / 700 + i) * 10) % W + W) % W;
          const y = ((t * sp * 0.45 + U.hash(i, 3) * Hh) % Hh);
          ctx.fillStyle = i % 2 ? '#ffc0d4' : '#ffe8f0'; ctx.globalAlpha = 0.8; ctx.fillRect(x, y, 2, 1);
        } else if (w === 'bubbles') {
          const x = ((U.hash(i, 2) * W + Math.sin(t / 600 + i) * 5) % W + W) % W;
          const y = Hh - ((t * sp * 0.4 + U.hash(i, 3) * Hh) % Hh);
          ctx.fillStyle = '#bff8f0'; ctx.globalAlpha = 0.5; ctx.fillRect(x, y, 1, 1); ctx.fillRect(x - 1, y + 1, 1, 1); ctx.fillRect(x + 1, y + 1, 1, 1); ctx.fillRect(x, y + 2, 1, 1);
        } else if (w === 'sparks') {
          const x = ((U.hash(i, 2) * W + Math.sin(t / 300 + i) * 6) % W + W) % W;
          const y = Hh - ((t * sp * 1.4 + U.hash(i, 3) * Hh) % Hh);
          ctx.fillStyle = i % 3 ? '#ff9a30' : '#ffe080'; ctx.globalAlpha = 0.8; ctx.fillRect(x, y, 1, 1);
        } else if (w === 'ash') {
          const x = ((U.hash(i, 2) * W - t * sp * 0.6) % W + W) % W;
          const y = ((t * sp * 0.5 + U.hash(i, 3) * Hh) % Hh);
          ctx.fillStyle = '#a0a8b8'; ctx.globalAlpha = 0.45; ctx.fillRect(x, y, 1, 1);
        }
      }
      ctx.globalAlpha = 1;
    },

    /* ---------------- HUD ---------------- */
    updateHud(showPlace) {
      const st = this.st;
      document.getElementById('hud-flow').innerHTML = G.ui.flowHTML(st.flow, false);
      const obj = document.getElementById('hud-objective');
      obj.textContent = st.objective ? '◆ ' + st.objective : '';
      obj.classList.toggle('hidden', !st.objective);
      if (showPlace) {
        const pl = document.getElementById('hud-place');
        pl.textContent = this.def.name;
        pl.classList.remove('show');
        void pl.offsetWidth;
        pl.classList.add('show');
      }
    },
    npc(id) { return this.npcs.find((n) => n.id === id); },
    setTile(x, y, ch) {
      if (!this.grid[y]) return;
      this.grid[y][x] = ch;
      this.buildLayer();
      this.collectLights();
    },
  });

  // wooden pier posts under docks, with cross-braces
  function drawPosts(ctx, x, y, tx) {
    ctx.fillStyle = '#2a1a10'; ctx.fillRect(x + 2, y, 4, 18 + (tx % 3) * 4); ctx.fillRect(x + 11, y, 4, 12 + (tx % 2) * 6);
    ctx.fillStyle = '#6a4424'; ctx.fillRect(x + 3, y, 2, 17 + (tx % 3) * 4); ctx.fillRect(x + 12, y, 2, 11 + (tx % 2) * 6);
    ctx.fillStyle = '#8a5a30'; ctx.fillRect(x + 3, y, 1, 17 + (tx % 3) * 4); ctx.fillRect(x + 12, y, 1, 11 + (tx % 2) * 6);
    ctx.fillStyle = '#4a2e18'; for (let i = 0; i < 8; i++) ctx.fillRect(x + 4 + i, y + 3 + i, 2, 1);
  }

  function drawChest(ctx, x, y, open) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x + 2, y + 14, 12, 2);
    ctx.fillStyle = '#3a2010'; ctx.fillRect(x + 2, y + 5, 12, 10);
    ctx.fillStyle = '#9a5a2a'; ctx.fillRect(x + 3, y + 6, 10, 8);
    ctx.fillStyle = '#d9a441'; ctx.fillRect(x + 2, y + 9, 12, 1); ctx.fillRect(x + 7, y + 8, 2, 3);
    if (open) { ctx.fillStyle = '#1a0c06'; ctx.fillRect(x + 3, y + 3, 10, 3); ctx.fillStyle = '#9a5a2a'; ctx.fillRect(x + 3, y + 1, 10, 2); }
    else { ctx.fillStyle = '#b06a32'; ctx.fillRect(x + 3, y + 5, 10, 3); ctx.fillStyle = '#3a2010'; ctx.fillRect(x + 2, y + 4, 12, 1); }
  }

  function drawEmote(ctx, e) {
    const txt = e.emote.text;
    const w = G.font.measure(txt) + 5;
    const x = Math.round(e.px + 8 - w / 2), y = Math.round(e.py - 22 + Math.sin(world.t / 120) * 0.8);
    ctx.fillStyle = '#1a1226'; ctx.fillRect(x - 1, y - 1, w + 2, 10);
    ctx.fillStyle = '#fffbe8'; ctx.fillRect(x, y, w, 8);
    ctx.fillRect(x + w / 2 - 1, y + 8, 2, 2);
    G.font.draw(ctx, txt, x + 3, y + 2, e.emote.color || '#1a1226', 1, null);
  }

  /* ---------------- scene wrapper ---------------- */
  G.scenes.register('world', {
    async enter(p) {
      document.getElementById('hud').classList.remove('hidden');
      G.input.showControls(true);
      if (p && p.resume) { world.updateHud(false); G.audio.music(world.env.music); return; }
      const st = G.game.state;
      world.load(st.map, st.x, st.y, st.dir);
      world.pendingEnter = true;
    },
    exit() {
      document.getElementById('hud').classList.add('hidden');
      G.input.showControls(false);
    },
    update(dt) {
      world.update(dt);
      if (world.pendingEnter && G.scenes.name === 'world') {
        world.pendingEnter = false;
        const onEnter = world.def.onEnter;
        // Saves made at the end of Act I (before Act II existed) sit at step 10: carry on to Hullhaven.
        if (G.game.state.step === 10 && G.story && G.story.hullArrive) G.script.run((S) => G.story.hullArrive(S));
        else if (onEnter) G.script.run((S) => onEnter(S, G.game.state));
      }
    },
    render(ctx) { world.render(ctx); },
  });
})();
