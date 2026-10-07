/* Service worker: guarda a app para funcionar sem internet. */
const CACHE = "ccna-passo-a-passo-v4";
const FICHEIROS = ["./", "index.html", "css/app.css", "js/conteudo.js", "js/figuras.js", "js/ios.js", "js/plano.js", "js/videoaula.js", "js/simulador.js", "js/simulador_ui.js", "js/app.js", "manifest.webmanifest", "icons/icon-64.png", "icons/icon-192.png", "icons/logo.webp"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FICHEIROS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Rede primeiro (para ver logo as novidades), cache quando não há ligação.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request).then((r) => {
      if (r.ok && new URL(e.request.url).origin === location.origin) {
        const copia = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copia));
      }
      return r;
    }).catch(() => caches.match(e.request))
  );
});
