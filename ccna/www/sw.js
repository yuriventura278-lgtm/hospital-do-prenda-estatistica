/* Service worker: guarda a app para funcionar sem internet.
   A cópia offline fica em dois sítios: na Cache Storage e também no IndexedDB ("ccna-offline").
   Assim, se outra app servida no mesmo endereço apagar as caches, a app continua a abrir sem internet. */
const CACHE = "ccna-passo-a-passo-v9";
const FICHEIROS = ["./", "index.html", "css/app.css", "js/abertura.js", "js/armazem.js", "js/conteudo.js", "js/figuras.js", "js/ios.js", "js/plano.js", "js/videoaula.js", "js/leitor.js", "js/lembretes.js", "js/simulador.js", "js/simulacao.js", "js/desafios.js", "js/simulador_ui.js", "js/exercicios.js", "js/laboratorio.js", "js/nativo.js", "js/app.js", "manifest.webmanifest", "icons/icon-64.png", "icons/icon-192.png", "icons/logo.webp", "icons/abertura.webp"];

// ------------------------------------------------------------ cópia de reserva no IndexedDB
function bd() {
  return new Promise((ok, falha) => {
    const r = indexedDB.open("ccna-offline", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("f");
    r.onsuccess = () => ok(r.result); r.onerror = () => falha(r.error);
  });
}
const chave = (url) => { const u = new URL(url, self.registration.scope); u.hash = ""; u.search = ""; return u.href; };
async function guardarIdb(url, res) {
  try {
    const corpo = await res.blob(), db = await bd();
    await new Promise((ok) => { const t = db.transaction("f", "readwrite"); t.objectStore("f").put({ corpo, tipo: res.headers.get("content-type") || "" }, chave(url)); t.oncomplete = ok; t.onerror = ok; });
  } catch (e) { /* sem IndexedDB */ }
}
async function lerIdb(url) {
  try {
    const db = await bd();
    const x = await new Promise((ok) => { const r = db.transaction("f").objectStore("f").get(chave(url)); r.onsuccess = () => ok(r.result); r.onerror = () => ok(null); });
    return x ? new Response(x.corpo, { headers: { "content-type": x.tipo } }) : null;
  } catch (e) { return null; }
}
async function guardarTudo() {
  const c = await caches.open(CACHE);
  await Promise.all(FICHEIROS.map(async (f) => {
    try { const r = await fetch(f, { cache: "no-cache" }); if (r.ok) { await c.put(f, r.clone()); await guardarIdb(f, r); } } catch (e) { /* sem rede */ }
  }));
}

self.addEventListener("install", (e) => { e.waitUntil(guardarTudo().then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("ccna-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
let jaVerificado = false;
// Rede primeiro (para ver logo as novidades); sem ligação, a cache e depois a cópia do IndexedDB.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const mesma = new URL(e.request.url).origin === location.origin;
  e.respondWith(
    fetch(e.request).then((r) => {
      if (e.request.mode === "navigate" && !jaVerificado) { jaVerificado = true; caches.open(CACHE).then((c) => c.match("index.html").then((m) => m || guardarTudo())).catch(() => {}); }
      if (r.ok && mesma) {
        const copia = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copia));
        if (FICHEIROS.some((f) => chave(f) === chave(e.request.url))) guardarIdb(e.request.url, r.clone());
      }
      return r;
    }).catch(async () => (await caches.match(e.request)) || (mesma ? (await lerIdb(e.request.url)) || (e.request.mode === "navigate" ? lerIdb("index.html") : null) : null) || Response.error())
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
