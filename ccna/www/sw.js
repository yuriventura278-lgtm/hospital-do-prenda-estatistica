/* Service worker: guarda a app para funcionar sem internet. */
const CACHE = "ccna-passo-a-passo-v8";
const FICHEIROS = ["./", "index.html", "css/app.css", "js/armazem.js", "js/conteudo.js", "js/figuras.js", "js/ios.js", "js/plano.js", "js/videoaula.js", "js/leitor.js", "js/lembretes.js", "js/simulador.js", "js/simulacao.js", "js/desafios.js", "js/simulador_ui.js", "js/exercicios.js", "js/laboratorio.js", "js/app.js", "manifest.webmanifest", "icons/icon-64.png", "icons/icon-192.png", "icons/logo.webp"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FICHEIROS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("ccna-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
let jaVerificado = false;
// Rede primeiro (para ver logo as novidades), cache quando não há ligação.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request).then((r) => {
      // outra app no mesmo endereço pode ter apagado a nossa cache: volta a guardar a app inteira
      if (e.request.mode === "navigate" && !jaVerificado) { jaVerificado = true; caches.open(CACHE).then((c) => c.match("index.html").then((m) => m || c.addAll(FICHEIROS))).catch(() => {}); }
      if (r.ok && new URL(e.request.url).origin === location.origin) {
        const copia = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copia));
      }
      return r;
    }).catch(() => caches.match(e.request))
  );
});

// Toque na notificação de estudo: abre (ou traz para a frente) a app
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => {
    for (const c of cs) if ("focus" in c) return c.focus();
    return self.clients.openWindow ? self.clients.openWindow("./#inicio") : null;
  }));
});
