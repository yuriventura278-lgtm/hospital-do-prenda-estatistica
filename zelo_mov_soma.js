// ── ZELO — Movimento «somatório» (só leitura) ──
// Medicina Interna = Medicina Homem + Medicina Mulher
// UCI / Cuidados Intermédios = UCI + Cuidados Intermédios
// A página do somatório não tem dados próprios: lê os Movimentos das partes
// (registos_movimento/<parte>/snapshot), soma-os dia a dia e mostra-os com as
// fórmulas de sempre. Não grava nada; para corrigir um número, corrige-se na
// página da parte. Atualiza sozinha quando uma parte grava (escuta só a hora
// de gravação de cada parte).
// Configuração na página: window.ZELO_MOV_SOMA = { partes:[...], nomes:[...],
//   limpar:'medicina_interna' } — «limpar»: os dados antigos do Movimento
// junto são copiados para registos_movimento/<limpar>_arquivo/<hora> e só
// depois retirados (nada se perde).
(function () {
  'use strict';
  var C = window.ZELO_MOV_SOMA; if (!C || !C.partes) return;
  var A = function () { return window.ZeloMovAuto; };
  var snaps = {}, aCarregar = false, prontoUmaVez = false;

  // ── só leitura ──
  var css = document.createElement('style');
  css.textContent =
    'body.mov-soma #dataTable input, body.mov-soma #m2 input, body.mov-soma .m2-cp input{pointer-events:none;background:#F8FAFC !important;color:#0F172A !important;border-color:#E2E8F0 !important}' +
    'body.mov-soma .m2-guard, body.mov-soma .m2-st button, body.mov-soma [data-m2fill], body.mov-soma #m2Dica, body.mov-soma .mov-row-chk, body.mov-soma #mov-sel-all, body.mov-soma #mva-faixa, body.mov-soma [data-m2="hoje"], body.mov-soma .m2-falta{display:none !important}' +
    '#mov-soma-aviso{display:flex;gap:12px;align-items:center;flex-wrap:wrap;background:#EFF6FF;border:1px solid #BFDBFE;color:#1E3A8A;border-radius:12px;padding:11px 14px;margin:0 0 14px;font:600 .86rem Inter,"Segoe UI",Arial,sans-serif}' +
    '#mov-soma-aviso a{display:inline-flex;align-items:center;gap:6px;background:#1E3A8A;color:#fff;text-decoration:none;border-radius:9px;padding:6px 12px;font-weight:700;font-size:.8rem}' +
    '#mov-soma-aviso .pt{display:flex;gap:8px;margin-left:auto;flex-wrap:wrap}';
  document.head.appendChild(css);
  function soLeitura() {
    document.body.classList.add('mov-soma');
    Array.prototype.forEach.call(document.querySelectorAll('#dataTable input, #m2 input, .m2-cp input, #capacityInput, #m2Camas, #m2Base'), function (i) {
      if (!i.readOnly) { i.readOnly = true; i.tabIndex = -1; i.title = 'Somatório automático — corrija na página da parte'; }
    });
  }
  function aviso() {
    if (document.getElementById('mov-soma-aviso')) return;
    var alvo = document.getElementById('m2') || document.querySelector('.table-section'); if (!alvo || !alvo.parentNode) return;
    var el = document.createElement('div'); el.id = 'mov-soma-aviso';
    el.innerHTML = '<span><b>Somatório automático</b> de ' + C.nomes.join(' + ') + ' (só leitura). Para corrigir um número, corrija na página da ' + C.nomes.join(' ou da ') + '.</span>' +
      '<span class="pt">' + C.partes.map(function (p, i) { return '<a href="' + p + '_movimento.html">' + C.nomes[i] + ' ›</a>'; }).join('') + '</span>';
    alvo.parentNode.insertBefore(el, alvo);
  }
  new MutationObserver(function () { soLeitura(); aviso(); }).observe(document.documentElement, { childList: true, subtree: true });

  function esperarFb() {
    return new Promise(function (r) { var n = 0; (function v() { if (window.__fbReady && window.__fbGet && A()) return r(true); if (++n > 80) return r(false); setTimeout(v, 150); })(); });
  }

  // Dados antigos do Movimento junto: cópia de segurança e depois retirados.
  function limparAntigo() {
    if (!C.limpar) return Promise.resolve();
    var cam = 'registos_movimento/' + C.limpar;
    return window.__fbGet(cam).then(function (v) {
      if (!v || !v.snapshot) return;
      var t = Date.now(), quem = null; try { quem = sessionStorage.getItem('zeloNome') || null; } catch (e) {}
      return window.__fbSet('registos_movimento/' + C.limpar + '_arquivo/' + t, { copia: v, arquivadoEm: new Date(t).toISOString(), por: quem, motivo: 'Movimento passou a ser o somatório de ' + C.nomes.join(' + ') })
        .then(function () { return window.__fbGet('registos_movimento/' + C.limpar + '_arquivo/' + t); })
        .then(function (copia) { if (copia && copia.copia && copia.copia.snapshot) return window.__fbSet(cam, null); });
    }).catch(function (e) { console.warn('ZELO: limpeza do Movimento antigo adiada', e); });
  }

  // Cópias do Movimento antigo guardadas neste computador (navegador): retiradas
  // uma vez. O Controlo de Pacientes não é tocado (tem chaves próprias).
  function limparLocal() {
    var L = C.limparLocal; if (!L) return;
    var flag = 'zeloMovSomaLimpo_' + (C.limpar || 'x');
    try { if (localStorage.getItem(flag)) return; } catch (e) { return; }
    try {
      (L.chaves || []).forEach(function (k) { localStorage.removeItem(k); });
      Object.keys(localStorage).forEach(function (k) { (L.contem || []).forEach(function (t) { if (k.indexOf(t) >= 0 && k.indexOf('controlo_pacientes') < 0) localStorage.removeItem(k); }); });
    } catch (e) {}
    try { (L.idb || []).forEach(function (n) { indexedDB.deleteDatabase(n); }); } catch (e) {}
    try { localStorage.setItem(flag, String(Date.now())); } catch (e) {}
  }
  function somar() {
    var Z = A(), lista = C.partes.map(function (p) { return snaps[p] || {}; }), out = {}, meses = {};
    lista.forEach(function (sn) { Object.keys(sn).forEach(function (k) { if (/^\d{4}-\d{2}$/.test(k)) meses[k] = 1; }); });
    Object.keys(meses).sort().forEach(function (ym) {
      var m = Z.somarMeses(lista.map(function (sn) { return sn[ym]; }), ym);
      if (m) out[ym] = m;
    });
    var bl = Z.baselinesJuntas(lista.map(function (sn) { return JSON.parse(JSON.stringify(sn)); })).certo;
    out.__baselines = {}; out.__baselinesManual = {};
    Object.keys(bl).forEach(function (ym) { out.__baselines[ym] = bl[ym]; out.__baselinesManual[ym] = true; });
    var cap = lista.reduce(function (a, sn) { return a + (Number(sn.__capacity) || 0); }, 0);
    if (cap > 0) out.__capacity = cap;
    var fu = {};
    lista.forEach(function (sn) { Object.keys(sn.__camasForaUso || {}).forEach(function (ym) { var d = sn.__camasForaUso[ym] || {}; fu[ym] = fu[ym] || {}; Object.keys(d).forEach(function (dd) { fu[ym][dd] = (fu[ym][dd] || 0) + (Number(d[dd]) || 0); }); }); });
    out.__camasForaUso = fu;
    return out;
  }
  function aplicar() {
    var obj = somar();
    try {
      data = obj; // eslint-disable-line no-global-assign
      Object.keys(data).filter(function (k) { return /^\d{4}-\d{2}$/.test(k); }).forEach(function (m) { loadMonth(m); });
      if (!currentMonth) currentMonth = getCurrentMonth();
      updatePeriodDisplay(); renderTable(); updateStats();
    } catch (e) { console.warn('ZELO soma', e); }
    soLeitura(); aviso();
  }
  function carregar() {
    if (aCarregar) return; aCarregar = true;
    Promise.all(C.partes.map(function (p) { return window.__fbGet('registos_movimento/' + p + '/snapshot').then(function (v) { snaps[p] = v || {}; }).catch(function () {}); }))
      .then(aplicar).catch(function () {}).then(function () { aCarregar = false; });
  }
  var iniciado = false;
  var ZeloMovSoma = {
    iniciar: function () {
      if (iniciado) return; iniciado = true;
      esperarFb().then(function (ok) {
        if (!ok) return;
        limparLocal();
        limparAntigo().then(function () {
          carregar();
          if (prontoUmaVez || typeof window.__fbListen !== 'function') return; prontoUmaVez = true;
          C.partes.forEach(function (p) {
            var primeira = true;
            window.__fbListen('registos_movimento/' + p + '/savedAt', function () { if (primeira) { primeira = false; return; } carregar(); });
          });
        });
      });
    }
  };
  window.ZeloMovSoma = ZeloMovSoma;
  // Arranca sozinho (a página pode ter pedido antes de este ficheiro carregar).
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(ZeloMovSoma.iniciar, 300); });
  else setTimeout(ZeloMovSoma.iniciar, 300);
})();
