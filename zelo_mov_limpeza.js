// ── ZELO — Limpeza pontual de campos do Movimento (pedida pelo serviço) ──
// Configuração na página: window.ZELO_MOV_LIMPEZA = { id, campos:[...],
//   existencia:true }. Corre UMA vez por serviço (a marca fica nos próprios
// dados: __limpezas[id]), depois de a página receber os dados do servidor:
//   • campos — esvaziados em todos os meses (ex.: dia_cama);
//   • existencia — retira a existência anterior escrita (todos os meses).
// A limpeza é enviada como alteração autorizada (ZeloSyncObjeto.limpar), por
// isso não volta a aparecer vinda de outro computador.
(function () {
  'use strict';
  var C = window.ZELO_MOV_LIMPEZA; if (!C || !C.id) return;
  function esperar(cond, ms) {
    return new Promise(function (r) { var t0 = Date.now(); (function v() { var x; try { x = cond(); } catch (e) {} if (x) return r(x); if (Date.now() - t0 > ms) return r(null); setTimeout(v, 300); })(); });
  }
  esperar(function () { return window.__movSync && window.__fbReady && typeof data !== 'undefined'; }, 60000).then(function (ok) {
    if (!ok) return;
    return window.__movSync.primeiraSincronizacao().then(function () {
      if (data.__limpezas && data.__limpezas[C.id]) return;
      var meses = Object.keys(data).filter(function (k) { return /^\d{4}-\d{2}$/.test(k); });
      meses.forEach(function (m) {
        loadMonth(m);
        (C.campos || []).forEach(function (c) { var n = getDaysInMonth(m); data[m][c] = new Array(n).fill(null); });
      });
      if (C.existencia) ['__baselines', '__baselinesManual', '__baselinesAntes', '__baseline'].forEach(function (k) { delete data[k]; });
      data.__limpezas = data.__limpezas || {}; data.__limpezas[C.id] = Date.now();
      try { persistRaw(data); } catch (e) {}
      try { window.__movSync.limpar(); } catch (e) {}
      try { renderTable(); updateStats(); } catch (e) {}
      console.info('ZELO: limpeza «' + C.id + '» aplicada (' + meses.length + ' meses).');
    });
  });
})();
