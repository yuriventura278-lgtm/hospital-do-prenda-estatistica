// Gerado por construir.py. Guarda a aplicação no aparelho para abrir sem internet.
const CACHE = "grupo-kambas-8a062627ed";
const BASE = ["./", "index.html", "instalar.html", "manifest.webmanifest", "vendor/supabase.js",
  "vendor/jspdf.umd.min.js", "vendor/jspdf.plugin.autotable.min.js", "static/icone-192.png",
  "static/icone-512.png", "static/logo_azul.png", "static/logo_branco.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("grupo-kambas-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request, url = new URL(r.url);
  if (r.method !== "GET") return;
  const fontes = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (url.origin !== self.location.origin && !fontes) return;  // dados do Supabase: sempre pela rede
  if (r.mode === "navigate") {  // página: tenta a versão nova, senão a guardada
    e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(CACHE).then(k => k.put("index.html", c)); return res; })
      .catch(() => caches.match(r).then(x => x || caches.match("index.html"))));
    return;
  }
  e.respondWith(caches.match(r).then(x => x || fetch(r).then(res => {
    if (res.ok || res.type === "opaque") { const c = res.clone(); caches.open(CACHE).then(k => k.put(r, c)); }
    return res;
  })));
});
