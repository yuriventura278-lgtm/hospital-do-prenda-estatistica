// ── ZELO — Catálogo CID-10 carregado depois de a página abrir ──
// O catálogo completo (zelo_cid10.js) tem quase 1 MB. Antes vinha logo ao
// abrir a página, mesmo sem ninguém escrever um diagnóstico. Agora a página
// abre primeiro e o catálogo chega pouco depois (2,5 s depois de a página
// estar pronta) — ou logo que se toca num campo de texto, o que vier primeiro.
// Quem usa o catálogo (pesquisa de diagnósticos, CID no relatório) já
// verificava se ele existe; quando chega, a pesquisa aberta atualiza-se.
(function () {
  'use strict';
  if (window.ZeloCIDCarregar) return;
  var eu = document.currentScript;
  var SRC = (eu && eu.getAttribute('data-src')) || 'zelo_cid10.js?v=1';
  var estado = 0, espera = [];
  function carregar(cb) {
    if (window.ZeloCID) { if (cb) cb(); return; }
    if (cb) espera.push(cb);
    if (estado) return;
    estado = 1;
    var s = document.createElement('script'); s.src = SRC; s.async = true;
    s.onload = function () {
      estado = 2;
      espera.splice(0).forEach(function (f) { try { f(); } catch (e) {} });
      // A pesquisa de diagnósticos que esteja aberta passa a mostrar o catálogo.
      var a = document.activeElement;
      if (a && a.tagName === 'INPUT' && window.ZeloCIDBusca && a.value.trim().length >= 2) { try { window.ZeloCIDBusca.mostrar(a); } catch (e) {} }
    };
    s.onerror = function () { estado = 0; };
    document.head.appendChild(s);
  }
  window.ZeloCIDCarregar = carregar;
  document.addEventListener('focusin', function (e) { var t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) carregar(); }, true);
  function depois() { setTimeout(function () { carregar(); }, 2500); }
  if (document.readyState === 'complete') depois(); else window.addEventListener('load', depois);
})();
