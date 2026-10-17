# Key of the Fading Current

A turn-based pixel RPG for iPhone (and anything with a browser), built for GitHub Pages.
No build step, no libraries and no asset files. All pixel art, music and sound effects are
generated in code, and every file lives in the root folder.

**Act I: The Lantern Falls** is fully playable: the intro cutscene, Pennywhistle Harbor, the tap-station failure,
Pip and Cog joining, the Astral Conservatory, Aldrith's study, the Records Vault and the escape.

---

## Put it on GitHub Pages

1. Create a new repository on GitHub, for example `fading-current`.
2. Upload every file in this folder to the root of the repository.
3. In the repository, open **Settings → Pages**. Under *Build and deployment*, pick **Deploy from a branch**,
   then select `main` and `/ (root)`, and save.
4. After about a minute the game is live at `https://<your-username>.github.io/fading-current/`.

**On iPhone:** open the link in Safari, tap **Share → Add to Home Screen**, and launch it from the icon to play
full-screen like an app. It also works offline after the first visit.

> Opening `index.html` straight from your computer also works. For the best test, run a local server from this
> folder, for example `python3 -m http.server`, then visit `http://localhost:8000`.

**Sound:** iOS only allows audio after a tap, which is why the game opens with "Tap the lantern".
If you hear nothing, check the volume and the silent switch.

---

## Controls

| Action | Touch | Keyboard |
| --- | --- | --- |
| Move | D-pad (slide your thumb) | Arrow keys / WASD |
| Talk, open, confirm | **A** | Z / Enter / Space |
| Back, cancel | **B** | X / Esc |
| Menu | ☰ (top right) | M / Tab |

In battle and menus you can also tap options directly, and tap enemies to target them.

---

## Stats

| Stat | What it does |
| --- | --- |
| **HP** | Health. At 0 a fighter falls. |
| **MP** | Personal energy that pays for skills. |
| **STR** Strength | Physical damage. |
| **DEF** Defense | Reduces physical damage taken. |
| **RES** Resonance | How deeply a fighter is attuned to the Current. Powers spells and healing, and softens Surges. |
| **LUK** Luck | Critical hits, accuracy, dodging and stealing. |
| **SPD** Speed | Turn order and fleeing. |

### The Current Flow meter

The party shares one Flow meter, from 0 to 10, and it carries over between battles.

- Basic attacks, **Guard** and being hit each add **+1**.
- Each skill costs MP **and** spends Flow.
- **Dim** is 0–3, **Steady** is 4–9 and **Bright** is 10. At Bright the next skill hits 25% harder.
- **Overdraw:** casting a skill without enough Flow causes a **Surge**. It damages everyone, friend and foe, and
  opens a random rift effect.
- Resting at an inn settles the meter back to 0.

---

## How the code is organised

Scripts load in order from `index.html`. Each file adds itself to one global object, `G`.

| Group | Files |
| --- | --- |
| Engine | `core.js` (utilities, registry, scenes) · `gfx.js` (pixel-perfect canvas) · `font.js` · `input.js` · `audio.js` (synth + sound effects) · `ui.js` (dialog, lists, toasts) · `state.js` (stats, inventory, saving) |
| Art | `sprites-chars.js` (people generator) · `sprites-mobs.js` (monster pixel art) · `tiles.js` · `sky.js` |
| Data | `data-party.js` · `data-items.js` · `data-mobs.js` · `data-shops.js` · `music.js` |
| World | `map-*.js` (one file per map) · `story-act1.js` (cutscenes + journal) |
| Systems | `script.js` (cutscene API) · `world.js` · `battle.js` · `battle-ui.js` · `menu.js` |
| Scenes | `scene-boot.js` · `scene-intro.js` · `scene-title.js` · `scene-slots.js` · `scene-actend.js` · `main.js` |
| Styles | `style-base.css` · `style-ui.css` · `style-battle.css` |
| App | `manifest.json` · `sw.js` · icons |

### Adding content

**A new monster:** add a line to `data-mobs.js`.

```js
M('gleamfin', { name: 'Gleamfin', family: 'wildlife', art: 'fish', lvl: 7, hp: 90, str: 15, def: 9, res: 10, spd: 12,
  exp: 34, gold: 20, moves: [{ name: 'Fin Slice', kind: 'phys', mult: 1, w: 1 }] });
```

Use `art: 'look:<id>'` for a human-shaped foe, and `pal: {...}` to recolour existing art.

**A new map:** copy `map-study.js` to `map-hullhaven.js`, edit the ASCII `tiles`, then add a
`<script src="map-hullhaven.js">` line to `index.html` (and the file name to `sw.js`). Each character in the grid
is a tile from `tiles.js`, and a space is open sky. Islands get their cliffs automatically.

**A cutscene:** write an async function that receives `S`.

```js
async (S) => {
  await S.say('pip', 'Cog, NO.');
  await S.move('pip', 'LLU');
  await S.emote('wren', '!');
  const won = await S.battle({ mobs: ['mistfox', 'mistfox'] });
  S.give('honeyBun', 2);
  S.setStep(11);
  S.objective('Find Salvage-Mother Bilge.');
}
```

**A new person:** register a look in `sprites-chars.js` with colours and accessories (`goggles`, `beard`, `hat`,
`cap`, `apron`, `longhair`, `bun`, `robe`, `stars`, `scarf`, `belt`, `cord`), then add a speaker entry for dialog.

**A song:** add an entry to `music.js` with a chord progression and a melody. The engine writes the bass, arpeggios
and drums from pattern names.

**A boss mechanic:** add an entry to `G.BOSS_MECHANICS` in `battle.js`, and set `mechanic: '<name>'` on the mob.
The hooks are `onStart`, `chooseMove`, `onFlowSpent`, `onSurge`, `onRoundEnd` and `modifyDamageTaken`.

### Debug mode

Open `index.html?debug` to get helpers in the browser console, such as `G.debug.warp('vault', 11, 18)`,
`G.debug.lvl(8)`, `G.debug.gold(500)`, `G.debug.step(7)` and `G.debug.noEnc()`.
Add `&skipintro` to jump straight to the title screen.

### Saving

There are three save slots, stored in the browser's `localStorage`. You can save from the ☰ menu or at any inn,
and the game also saves automatically when you start a new journey and at the end of Act I.
