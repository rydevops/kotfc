/* sw.js — offline support. Network first (so updates on GitHub Pages show
   up right away), falling back to the cache when offline.
   Bump CACHE when you release a new version. */
const CACHE = 'fading-current-v6';
const FILES = [
  './', 'index.html', 'style-base.css', 'style-ui.css', 'style-battle.css',
  'font-dotgothic.woff2',
  'core.js', 'gfx.js', 'pix.js', 'art.js', 'font.js', 'input.js', 'audio.js', 'music.js', 'music-more.js', 'ui.js', 'state.js',
  'sprites-chars.js', 'sprites-battle.js', 'sprites-mobs.js', 'tiles.js', 'tiles-more.js', 'sky.js', 'terrain.js', 'backdrops.js', 'backdrops-more.js', 'mode7.js',
  'data-party.js', 'data-items.js', 'data-mobs.js', 'data-shops.js', 'data-more.js', 'mapkit.js', 'travel.js',
  'map-ferry.js', 'map-harbor.js', 'map-conservatory.js', 'map-study.js', 'map-vault.js', 'map-hullhaven.js', 'map-tallow.js', 'map-dimmerrow.js', 'map-hushwell.js', 'map-aurelith.js', 'map-foundry.js', 'story-act1.js', 'story-act2.js', 'story-act2b.js', 'story-act2c.js', 'story-act3.js', 'story-act3b.js', 'story-act4.js', 'story-bonds.js',
  'script.js', 'world.js', 'fx.js', 'battle.js', 'bosses.js', 'battle-ui.js', 'menu.js',
  'scene-boot.js', 'scene-intro.js', 'scene-title.js', 'scene-slots.js', 'scene-actend.js', 'main.js',
  'manifest.json', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png',
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok && new URL(e.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('index.html')))
  );
});
