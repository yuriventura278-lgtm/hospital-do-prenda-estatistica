/* Service worker da Organização Pessoal & Financeira: guarda a app no aparelho para abrir sem internet. */
const CACHE = 'financas-v17';
const FICHEIROS = ['./', './index.html', './instalar.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-180.png', './icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHEIROS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
function daCache(req) { return caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./index.html')); }
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (u.pathname.includes('/downloads/')) return; // instaladores: sempre pela rede
  const pagina = e.request.mode === 'navigate' || u.pathname.endsWith('/') || u.pathname.endsWith('.html');
  if (pagina) { // página: tenta a versão mais recente; sem internet (ou rede muito lenta) abre logo a guardada
    e.respondWith(new Promise(resolve => {
      let feito = false;
      const usarCache = () => { if (!feito) { feito = true; daCache(e.request).then(resolve); } };
      const t = setTimeout(usarCache, 4000);
      fetch(e.request).then(r => {
        if (r && r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); }
        clearTimeout(t); if (!feito) { feito = true; resolve(r); }
      }).catch(() => { clearTimeout(t); usarCache(); });
    }));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request).then(res => { const c = res.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return res; })));
});
