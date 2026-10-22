// ── ZELO — Biblioteca de PDF carregada depois de a página abrir ──
// O jsPDF (+ autoTable) tem ~400 KB. Antes vinha logo ao abrir cada página,
// mesmo sem ninguém exportar. Agora a página abre primeiro e a biblioteca
// chega pouco depois, em segundo plano (quando o navegador está livre).
// Se alguém carregar num botão de PDF/Imprimir/Relatório antes de ela estar
// pronta, o clique espera pela biblioteca e repete-se sozinho — o resultado
// é o mesmo de sempre.
// Fontes: cdnjs; sem rede para o cdnjs, as cópias locais do sistema.
// Uso: <script src="zelo_pdf_tardio.js" data-at="3.8.2"></script>  (versão do autoTable)
(function () {
  'use strict';
  if (window.ZeloPdfTardio) return;
  window.__zeloPdfTardio = true;
  var eu = document.currentScript;
  var AT = (eu && eu.getAttribute('data-at')) || '3.8.2';
  var CDN_J = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  var CDN_A = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/' + AT + '/jspdf.plugin.autotable.min.js';
  var LOC_J = 'jspdf.umd.min.js', LOC_A = 'jspdf.plugin.autotable.min.js';

  function temJ() { return !!(window.jspdf && window.jspdf.jsPDF); }
  function temA() { return !AT || (temJ() && typeof window.jspdf.jsPDF.API.autoTable === 'function'); }
  function script(src) {
    return new Promise(function (ok, falha) {
      var s = document.createElement('script'); s.src = src; s.async = false;
      s.onload = ok; s.onerror = falha; document.head.appendChild(s);
    });
  }
  function umDe(cdn, local, pronto) { return pronto() ? Promise.resolve() : script(cdn).then(function () { if (!pronto()) throw 0; }).catch(function () { return pronto() ? null : script(local); }); }

  var promessa = null;
  function carregar() {
    if (temJ() && temA()) return Promise.resolve(true);
    if (!promessa) {
      promessa = umDe(CDN_J, LOC_J, temJ)
        .then(function () { return AT ? umDe(CDN_A, LOC_A, temA) : null; })
        .then(function () { return temJ() && temA(); })
        .catch(function () { return temJ() && temA(); })
        .then(function (ok) {
          if (!ok) promessa = null; // pode tentar outra vez mais tarde
          else try { window.dispatchEvent(new Event('zelo-pdf-pronto')); } catch (e) {}
          return ok;
        });
    }
    return promessa;
  }
  window.ZeloPdfTardio = { carregar: carregar, pronto: function () { return temJ() && temA(); } };

  // Botões que fazem PDF, imprimem ou exportam.
  var RE = /\bpdf\b|imprimir|relat[óo]rio|exportar|descarregar|baixar/i;
  document.addEventListener('click', function (ev) {
    if (temJ() && temA()) return;
    var b = ev.target && ev.target.closest && ev.target.closest('button,a,[role=button],[onclick],input[type=button],input[type=submit]');
    if (!b || b.__zeloPdfRepetir) return;
    var txt = (b.textContent || '') + ' ' + (b.value || '') + ' ' + (b.getAttribute('title') || '') + ' ' + (b.getAttribute('aria-label') || '') + ' ' + (b.getAttribute('onclick') || '') + ' ' + (b.id || '');
    if (!RE.test(txt) && !/jspdf/i.test(txt)) return;
    ev.preventDefault(); ev.stopImmediatePropagation();
    b.style.cursor = 'progress';
    carregar().then(function (ok) {
      b.style.cursor = '';
      if (!ok) { alert('Não foi possível preparar o PDF. Verifique a internet e tente outra vez.'); return; }
      b.__zeloPdfRepetir = true;
      try { b.click(); } finally { b.__zeloPdfRepetir = false; }
    });
  }, true);

  // Depois de a página abrir, quando o navegador estiver livre.
  function depois() {
    setTimeout(function () {
      if (window.requestIdleCallback) requestIdleCallback(function () { carregar(); }, { timeout: 4000 });
      else carregar();
    }, 1500);
  }
  if (document.readyState === 'complete') depois(); else window.addEventListener('load', depois);
})();
