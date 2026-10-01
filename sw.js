// ── ZELO — Service worker: o sistema abre e funciona sem internet ──
// • Guarda em cache as páginas, os scripts, os ícones, as bibliotecas externas
//   (PDF, gráficos, Excel) e o SDK do Firebase. Na 1.ª vez que o sistema abre
//   num computador, descarrega tudo em segundo plano, aos poucos (uma só vez);
//   depois só o que muda.
// • Páginas e scripts do sistema: rede primeiro (nunca fica preso a uma
//   versão antiga), com limite de 3 s; sem rede ou rede lenta → cache.
//   Um script com versão nova (?v=…) ainda sem cópia usa a versão anterior.
// • Bibliotecas externas e letras: cache primeiro, atualizada em fundo.
// • Nunca guarda pedidos de autenticação nem da base de dados do Firebase —
//   os dados vivem no aparelho (localStorage/IndexedDB) e a fila de
//   sincronização (zelo_sync.js) envia-os quando a rede voltar.
const VERSAO = 'v4';
const SHELL_CACHE = 'zelo-shell-v4';
const SDK_CACHE = 'zelo-sdk-v3';
const NETWORK_TIMEOUT_MS = 3000;
const PRECACHE = ["Anatomia_Patologica.html", "Banco_Nefrologia_v2-1.html", "Bloco_Operatorio.html", "Centro_Hemodialise.html", "Cirurgia_Geral.html", "Cirurgia_Maxilo_Facial.html", "Consulta_Externa-2.html", "Dashboard.html", "Estatistica.html", "Estomatologia.html", "Hemoterapia.html", "Imagiologia.html", "Laboratório_Clínico.html", "Lavandaria_Esterilizacao.html", "Morgue.html", "Neurocirurgia.html", "Oftalmologia.html", "Ortopedia.html", "Otorrinolaringologia.html", "Supervisao_Hospital.html", "Supervisao_Maqueiros.html", "Supervisao_Serviclean.html", "admin_setup.html", "admin_utilizadores.html", "banco_fisioterapia_v1-1-1.html", "banco_medicina_interna_v2-2-1-2-1.html", "banco_uci_v1-3-1-1.html", "banco_urgencia.html", "bancos_index.html", "base_dados.html", "bloco_operatorio_ficha_operatoria.html", "bloco_operatorio_registo_diario.html", "cirurgia_geral_movimento.html", "consulta_externa_geral.html", "controlo_faltas_gepedema.html", "controlo_pacientes_cirurgia_geral.html", "controlo_pacientes_maxilo_facial.html", "controlo_pacientes_medicina_interna.html", "controlo_pacientes_nefrologia.html", "controlo_pacientes_neurocirurgia.html", "controlo_pacientes_ortopedia.html", "controlo_pacientes_uci.html", "controlo_pacientes_uci_intensivo.html", "controlo_pacientes_uci_intermedio.html", "farmacia_central.html", "fluxograma_relatorio.html", "hemoterapia.html", "imagiologia_radiologia_geral.html", "index.html", "informacoes_zelo.html", "laboratorio_geral.html", "maxilo_facial_movimento.html", "medicina_homem_movimento.html", "medicina_interna_movimento.html", "medicina_mulher_movimento.html", "movimento_hospitalar_geral.html", "movimento_mensal.html", "nefrologia_movimento.html", "neurocirurgia_movimento.html", "ortopedia_movimento.html", "perfil.html", "procedimentos_enfermagem_banco_urgencia.html", "procedimentos_enfermagem_bloco_operatorio.html", "procedimentos_enfermagem_cirurgia_geral.html", "procedimentos_enfermagem_consulta_externa.html", "procedimentos_enfermagem_geral.html", "procedimentos_enfermagem_hospital_dia.html", "procedimentos_enfermagem_index.html", "procedimentos_enfermagem_maxilo_facial.html", "procedimentos_enfermagem_medicina_homem.html", "procedimentos_enfermagem_medicina_mulher.html", "procedimentos_enfermagem_nefrologia.html", "procedimentos_enfermagem_neurocirurgia.html", "procedimentos_enfermagem_ortopedia.html", "procedimentos_enfermagem_uci_cuidados_intermedios.html", "psicologia_atendimento.html", "psicologia_clinica_hp-1-3-1.html", "registo_hiv.html", "registo_vih_hemoterapia.html", "registo_vih_laboratorio.html", "relatorios_anuais.html", "reprografia.html", "secretaria_geral.html", "servicos.html", "sistemas_independentes.html", "testagem_vih_estatistica.html", "uci_intensivo_movimento.html", "uci_intermedio_movimento.html", "uci_movimento.html", "zelo_assistente.js", "zelo_auditoria.js", "zelo_auth.js", "zelo_auto_backup.js", "zelo_bloco_layout.js", "zelo_bloco_v2.js", "zelo_cabecalho.js", "zelo_cid.js", "zelo_cid10.js", "zelo_cid_busca.js", "zelo_cp_fora.js", "zelo_cp_layout.js", "zelo_cp_listas.js", "zelo_cp_nup.js", "zelo_cp_alergias.js", "zelo_cp_dados_pessoais.js", "zelo_cp_arquivo.js", "zelo_fecho_mes.js", "zelo_cp_processo.js", "zelo_cp_relatorio.js", "zelo_cp_uci.js", "zelo_espera.js", "zelo_feriados.js", "zelo_firebase_config.js", "zelo_graficos.js", "zelo_icones.js", "zelo_indexeddb.js", "zelo_loading.js", "zelo_menu_flutuante.js", "zelo_menu_pagina.js", "zelo_merge.js", "zelo_mov_auto.js", "zelo_mov_v2.js", "zelo_movimento_grelha.js", "zelo_obrigatorios.js", "zelo_pagegate.js", "zelo_pagegate_watchdog.js", "zelo_pdf.js", "zelo_pdf_guardar.js", "jspdf.umd.min.js", "jspdf.plugin.autotable.min.js", "zelo_proc_layout.js", "zelo_protecao_ecra.js", "zelo_relatorios.js", "zelo_save_feedback.js", "zelo_service_nav.js", "zelo_servicos_menu.js", "zelo_sync.js", "zelo_sync_banco.js", "zelo_sync_objeto.js", "zelo_sync_registos.js", "zelo_theme.js", "zelo_ultima_alteracao.js", "zelo_video_cp.js", "zelo_video_movimento.js", "zelo_video_setores.js", "zelo_vih.js", "zelo_vih_monitor.js", "chart.umd.min.js", "zelo_tokens.css", "zelo_vih.css", "icons/apple-touch-icon.png", "icons/favicon-16.png", "icons/favicon-32.png", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-192.png", "icons/icon-maskable-512.png", "icons/login_bg.jpg", "icons/logo.png", "icons/yuri_matias.jpg", "icons/zelo.ico", "manifest.json"];
const PRECACHE_EXTERNO = ["https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js", "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js", "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js", "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js", "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js", "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js", "https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js", "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js", "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js", "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js", "https://unpkg.com/xlsx-js-style@1.2.0/dist/xlsx-js-style.min.js", "https://unpkg.com/xlsx@0.18.5/dist/xlsx.full.min.js", "https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx-js-style.min.js"];

self.addEventListener('install', () => { self.skipWaiting(); });

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== SHELL_CACHE && n !== SDK_CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
      .then(() => { preCarregar(); })
  );
});

// Descarrega aos poucos (2 de cada vez) o que ainda não está em cache.
let aPreCarregar = false;
async function preCarregar() {
  if (aPreCarregar) return; aPreCarregar = true;
  try {
    const shell = await caches.open(SHELL_CACHE), sdk = await caches.open(SDK_CACHE);
    const tarefas = PRECACHE.map((f) => [shell, new URL(f, self.registration.scope).href])
      .concat(PRECACHE_EXTERNO.map((u) => [sdk, u]));
    let i = 0;
    async function trabalhador() {
      while (i < tarefas.length) {
        const [cache, url] = tarefas[i++];
        try {
          if (await cache.match(url, { ignoreSearch: true })) continue;
          const res = await fetch(url, { cache: 'no-cache' });
          if (res.ok || res.type === 'opaque') await cache.put(url, res);
        } catch (e) { /* sem rede: tenta noutra altura */ }
      }
    }
    await Promise.all([trabalhador(), trabalhador()]);
  } finally { aPreCarregar = false; }
}
self.addEventListener('message', (e) => { if (e.data === 'zelo-precarregar') preCarregar(); });

function ehExterno(url) {
  return (url.hostname === 'www.gstatic.com' && url.pathname.includes('/firebasejs/')) ||
    /(^|\.)cdnjs\.cloudflare\.com$|(^|\.)cdn\.jsdelivr\.net$|(^|\.)unpkg\.com$|^fonts\.googleapis\.com$|^fonts\.gstatic\.com$/.test(url.hostname);
}
function ehPedidoDeDadosFirebase(url) {
  return /firebaseio\.com$|firebasedatabase\.app$|identitytoolkit|securetoken|firebaseinstallations/.test(url.hostname) ||
    (/googleapis\.com$/.test(url.hostname) && url.hostname !== 'fonts.googleapis.com');
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

  // Bibliotecas externas e letras: cache primeiro, atualiza em fundo.
  if (ehExterno(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(SDK_CACHE);
      const cached = await cache.match(req);
      const rede = fetch(req).then((res) => { if (res.ok || res.type === 'opaque') cache.put(req, res.clone()); return res; });
      if (cached) { rede.catch(() => {}); return cached; }
      return rede;
    })());
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      const cache = await caches.open(SHELL_CACHE);
      const cached = await cache.match(req) || await cache.match(req, { ignoreSearch: true });
      const pedidoDeRede = fetch(req).then((res) => {
        if (res.ok) { cache.put(req, res.clone()); if (url.search) cache.put(url.origin + url.pathname, res.clone()); }
        return res;
      });
      try {
        return await comLimiteDeTempo(pedidoDeRede, NETWORK_TIMEOUT_MS);
      } catch (e) {
        pedidoDeRede.catch(() => {});
        if (cached) return cached;
        try { return await pedidoDeRede; }
        catch (e2) {
          // Página ainda nunca aberta neste computador e sem internet.
          if (req.mode === 'navigate') {
            const inicio = await cache.match('index.html', { ignoreSearch: true });
            return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ZELO — sem internet</title>' +
              '<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0D1B3E;font-family:Inter,Arial,sans-serif;color:#fff;text-align:center;padding:20px">' +
              '<div><h2>Sem internet</h2><p style="color:#CBD5E1;max-width:420px">Esta página ainda não foi guardada neste computador. As páginas já abertas antes funcionam sem internet.</p>' +
              (inicio ? '<a href="index.html" style="color:#7DD3FC;font-weight:700">Voltar ao Início</a>' : '') + '</div></body>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
          }
          throw e2;
        }
      }
    })());
  }
});
