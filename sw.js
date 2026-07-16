// Este service worker existe apenas para o sistema poder ser "instalado" como app
// (o Chrome/Edge exigem um service worker com fetch handler para isso). Não faz
// cache de nada — a página de login precisa sempre de rede para autenticar com o
// Firebase, por isso um "shell" em cache só arriscava servir versões antigas do
// sistema mesmo depois de uma atualização no servidor. Limpa também qualquer cache
// deixada pela versão anterior deste ficheiro (que guardava index.html em cache).
self.addEventListener('install', () => { self.skipWaiting(); });

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
