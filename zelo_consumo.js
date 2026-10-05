// ── ZELO — Medidor do consumo do Firebase (downloads) ──
// O plano gratuito (Spark) do Realtime Database tem por mês: 10 GB de
// downloads, 1 GB guardado e 100 ligações simultâneas. O Firebase não diz à
// aplicação quanto cada página gasta, por isso este ficheiro mede-o aqui:
// envolve __fbGet / __fbGetRange / __fbListen (no momento em que cada página
// os cria) e soma o tamanho dos dados recebidos — sem mudar nada no que as
// páginas fazem.
//   • Numa escuta ao vivo conta a 1.ª leitura inteira e, depois, só o que
//     mudou (é isso que o Firebase envia pela rede).
//   • Guarda neste computador o total do dia por página e envia um resumo
//     pequeno (1 nó por computador e por dia) a cada 3 minutos e ao sair:
//     registos_sistemas_locais/consumo_firebase/<AAAA-MM-DD>/<computador>
//   • É uma estimativa: não inclui a consola do Firebase nem o protocolo.
// O painel «Consumo do Firebase» (Serviço de Estatística) mostra o total do
// mês, a previsão até ao fim do período e as páginas que mais gastam.
(function () {
  'use strict';
  if (window.__zeloConsumo) return;
  var BASE = 'registos_sistemas_locais/consumo_firebase';
  var pagina = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/i, '') || 'index';
  var reais = {}, pendente = 0, ultimoEnvio = 0;

  function hoje() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function dispositivo() {
    try {
      var id = localStorage.getItem('zeloDispositivo');
      if (!id) { id = 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); localStorage.setItem('zeloDispositivo', id); }
      return id;
    } catch (e) { return 'sem_id'; }
  }
  // Tamanho aproximado (bytes) do que o Firebase enviou: o JSON do valor.
  function tamanho(v) {
    if (v === null || v === undefined) return 4;
    try { var s = JSON.stringify(v); return s ? s.length + (s.match(/[^\x00-\x7F]/g) || []).length : 4; } catch (e) { return 0; }
  }
  // Escuta: depois da 1.ª vez, só as partes que mudaram (1.º nível).
  function diferenca(antes, depois) {
    if (!antes || !depois || typeof antes !== 'object' || typeof depois !== 'object') return tamanho(depois);
    var t = 0;
    Object.keys(depois).forEach(function (k) {
      var a = antes[k], b = depois[k];
      if (a === b) return;
      var sa, sb; try { sa = JSON.stringify(a); sb = JSON.stringify(b); } catch (e) { sa = 1; sb = 2; }
      if (sa !== sb) t += k.length + tamanho(b);
    });
    Object.keys(antes).forEach(function (k) { if (!(k in depois)) t += k.length + 4; });
    return t;
  }

  // ── contagem local (por dia e por página) ──
  function chaveLocal(d) { return 'zeloConsumo_' + d; }
  function lerDia(d) { try { return JSON.parse(localStorage.getItem(chaveLocal(d)) || 'null') || { total: 0, pag: {}, aberturas: {} }; } catch (e) { return { total: 0, pag: {}, aberturas: {} }; } }
  function gravarDia(d, o) { try { localStorage.setItem(chaveLocal(d), JSON.stringify(o)); } catch (e) {} }
  function somar(bytes) {
    if (!(bytes > 0)) return;
    var d = hoje(), o = lerDia(d);
    o.total = (o.total || 0) + bytes;
    o.pag = o.pag || {}; o.pag[pagina] = (o.pag[pagina] || 0) + bytes;
    gravarDia(d, o);
    pendente += bytes;
    if (Date.now() - ultimoEnvio > 180000) enviar();
  }
  (function abertura() {
    var d = hoje(), o = lerDia(d);
    o.aberturas = o.aberturas || {}; o.aberturas[pagina] = (o.aberturas[pagina] || 0) + 1;
    gravarDia(d, o);
    // Limpa contagens com mais de 40 dias (só estatística local).
    try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf('zeloConsumo_') === 0 && k.slice(12) < new Date(Date.now() - 40 * 864e5).toISOString().slice(0, 10)) localStorage.removeItem(k); }); } catch (e) {}
  })();

  // ── envio do resumo (1 nó pequeno por computador e por dia) ──
  function nomeUtilizador() { try { return sessionStorage.getItem('zeloNome') || ''; } catch (e) { return ''; } }
  function enviar() {
    var set = reais.__fbSet;
    if (typeof set !== 'function' || !window.__fbReady || navigator.onLine === false) return;
    ultimoEnvio = Date.now();
    var d = hoje(), o = lerDia(d);
    if (!o.total) return;
    var limpo = {};
    Object.keys(o.pag || {}).forEach(function (k) { limpo[k.replace(/[.#$\[\]\/]/g, '_')] = o.pag[k]; });
    var ab = {};
    Object.keys(o.aberturas || {}).forEach(function (k) { ab[k.replace(/[.#$\[\]\/]/g, '_')] = o.aberturas[k]; });
    var rec = { total: o.total, pag: limpo, aberturas: ab, quem: nomeUtilizador() || null, em: Date.now() };
    pendente = 0;
    try { Promise.resolve(set(BASE + '/' + d + '/' + dispositivo(), rec)).catch(function () {}); } catch (e) {}
  }
  setInterval(function () { if (pendente) enviar(); }, 180000);
  window.addEventListener('pagehide', function () { if (pendente) enviar(); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden' && pendente) enviar(); });

  // ── envolver as funções de leitura das páginas ──
  function envGet(fn) {
    if (typeof fn !== 'function' || fn.__zc) return fn;
    var w = function () { return Promise.resolve(fn.apply(this, arguments)).then(function (v) { somar(tamanho(v)); return v; }); };
    w.__zc = true; return w;
  }
  function envListen(fn) {
    if (typeof fn !== 'function' || fn.__zc) return fn;
    var w = function (caminho, cb) {
      var anterior, primeira = true;
      var args = Array.prototype.slice.call(arguments);
      args[1] = function (v) {
        try { somar(primeira ? tamanho(v) : diferenca(anterior, v)); } catch (e) {}
        primeira = false;
        try { anterior = v && typeof v === 'object' ? JSON.parse(JSON.stringify(v)) : v; } catch (e) { anterior = v; }
        return cb.apply(this, arguments);
      };
      return fn.apply(this, args);
    };
    w.__zc = true; return w;
  }
  function propriedade(nome, envolver) {
    try {
      var atual = window[nome];
      Object.defineProperty(window, nome, {
        configurable: true, enumerable: true,
        get: function () { return reais[nome]; },
        set: function (v) { reais[nome] = envolver ? envolver(v) : v; }
      });
      if (atual) window[nome] = atual;
    } catch (e) {}
  }
  propriedade('__fbGet', envGet);
  propriedade('__fbGetRange', envGet);
  propriedade('__fbListen', envListen);
  propriedade('__fbSet', null); // só guardado (para o envio do resumo)

  window.__zeloConsumo = { hoje: function () { return lerDia(hoje()); }, enviar: enviar, pagina: pagina, dispositivo: dispositivo };
})();
