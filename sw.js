// Este service worker guarda em cache o "shell" estático do sistema (páginas,
// CSS/JS próprios, e o SDK do Firebase — que é imutável para uma versão fixa
// como a 10.14.1) para que, numa ligação muito lenta/instável, ou quando o
// telemóvel descarta a aba em segundo plano e a tem de recarregar ao voltar a
// tocar nela, a página abra quase de imediato a partir da cache em vez de
// esperar (por vezes vários minutos) pela rede lenta outra vez.
//
// Nunca guarda em cache pedidos de autenticação/base de dados do Firebase —
// esses vão sempre diretos à rede, para nunca mostrar dados desatualizados.
//
// Para as próprias páginas do sistema: tenta sempre a rede primeiro (para
// nunca ficar preso numa versão antiga depois de uma atualização), mas com um
// limite de 3s — se a rede não responder a tempo, usa a cache imediatamente
// e continua a atualização em fundo para a próxima vez.
const SHELL_CACHE = 'zelo-shell-v2';
const SDK_CACHE = 'zelo-sdk-v2';
const NETWORK_TIMEOUT_MS = 3000;

self.addEventListener('install', () => { self.skipWaiting(); });

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((n) => n !== SHELL_CACHE && n !== SDK_CACHE).map((n) => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

function ehSdkFirebaseImutavel(url) {
  return url.hostname === 'www.gstatic.com' && url.pathname.includes('/firebasejs/');
}

function ehPedidoDeDadosFirebase(url) {
  return /firebaseio\.com$|firebasedatabase\.app$|googleapis\.com$|identitytoolkit/.test(url.hostname);
}

function comLimiteDeTempo(promessa, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promessa.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (ehPedidoDeDadosFirebase(url)) return;

  if (ehSdkFirebaseImutavel(url)) {
    event.respondWith(
      caches.open(SDK_CACHE).then((cache) =>
        cache.match(req).then((cached) => cached || fetch(req).then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        }))
      )
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      const cache = await caches.open(SHELL_CACHE);
      const cached = await cache.match(req);
      const pedidoDeRede = fetch(req).then((res) => {
        if (res.ok) cache.put(req, res.clone());
        return res;
      });
      try {
        return await comLimiteDeTempo(pedidoDeRede, NETWORK_TIMEOUT_MS);
      } catch (e) {
        if (cached) return cached;
        return pedidoDeRede; // sem cache disponível — espera pela rede, por mais lenta que seja
      }
    })());
  }
});
