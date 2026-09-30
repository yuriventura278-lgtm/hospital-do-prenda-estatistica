// ── ZELO — Guardar PDF sempre que se clica em «PDF» ──
// Movimento Hospitalar e Controlo de Pacientes.
// 1. Biblioteca garantida: se o jsPDF/autoTable do cdnjs não carregou (sem
//    internet, cdnjs bloqueado na rede do hospital, cache vazia), usa as
//    cópias locais do próprio sistema (jspdf.umd.min.js e
//    jspdf.plugin.autotable.min.js), que o service worker também guarda.
// 2. Guardar seguro: o ficheiro é gravado com um nome limpo; no iPhone/iPad
//    com o ZELO instalado usa «Partilhar → Guardar em Ficheiros»; e aparece
//    sempre um aviso com «Abrir PDF» caso o navegador não o descarregue.
// Tem de ser carregado logo depois das etiquetas <script> do jsPDF.
(function () {
  'use strict';
  var LOCAL_JSPDF = 'jspdf.umd.min.js', LOCAL_AT = 'jspdf.plugin.autotable.min.js';
  function temJspdf() { return !!(window.jspdf && window.jspdf.jsPDF); }
  function temAt() { return temJspdf() && typeof window.jspdf.jsPDF.API.autoTable === 'function'; }

  // Ainda durante a leitura da página: os scripts escritos correm já a seguir,
  // antes do código da página (que só usa o jsPDF ao clicar).
  if (document.readyState === 'loading') {
    try {
      if (!temJspdf()) document.write('<script src="' + LOCAL_JSPDF + '"><\/script><script src="' + LOCAL_AT + '"><\/script>');
      else if (!temAt()) document.write('<script src="' + LOCAL_AT + '"><\/script>');
    } catch (e) { /* carregar() trata disto ao clicar */ }
  }

  function script(src) {
    return new Promise(function (ok, falha) {
      var s = document.createElement('script'); s.src = src;
      s.onload = ok; s.onerror = falha; document.head.appendChild(s);
    });
  }
  var aCarregar = null;
  function carregar() {
    if (temAt()) { corrigirSave(); return Promise.resolve(true); }
    if (!aCarregar) {
      aCarregar = (temJspdf() ? Promise.resolve() : script(LOCAL_JSPDF))
        .then(function () { return temAt() ? null : script(LOCAL_AT); })
        .then(function () { corrigirSave(); return temAt(); })
        .catch(function () { return false; })
        .then(function (r) { aCarregar = null; return r; });
    }
    return aCarregar;
  }

  // ── Aviso no ecrã ──
  function aviso(nome, url) {
    var id = 'zeloPdfAviso', el = document.getElementById(id);
    if (el) el.remove();
    el = document.createElement('div'); el.id = id;
    el.setAttribute('role', 'status');
    el.style.cssText = 'position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:2147483000;' +
      'background:#0F172A;color:#fff;border-radius:12px;padding:12px 16px;box-shadow:0 10px 30px rgba(0,0,0,.3);' +
      'font:600 13px Inter,"Segoe UI",Arial,sans-serif;display:flex;gap:12px;align-items:center;max-width:calc(100vw - 32px);flex-wrap:wrap';
    var txt = document.createElement('span');
    txt.textContent = 'PDF guardado: ' + nome;
    txt.style.cssText = 'overflow-wrap:anywhere';
    el.appendChild(txt);
    if (url) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = 'Abrir PDF';
      b.style.cssText = 'background:#38BDF8;color:#0F172A;border:0;border-radius:8px;padding:6px 12px;font:700 12px inherit;cursor:pointer';
      b.onclick = function () { window.open(url, '_blank'); };
      el.appendChild(b);
    }
    var x = document.createElement('button'); x.type = 'button'; x.textContent = '×'; x.setAttribute('aria-label', 'Fechar aviso');
    x.style.cssText = 'background:none;border:0;color:#94A3B8;font:700 18px inherit;cursor:pointer;padding:0 2px';
    x.onclick = function () { el.remove(); };
    el.appendChild(x);
    document.body.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.remove(); }, 12000);
  }
  function erro(msg) {
    if (typeof window.showFeedback === 'function') { try { window.showFeedback(msg, 'error'); return; } catch (e) {} }
    alert(msg);
  }

  function nomeLimpo(n) {
    // Só letras simples: acentos, travessões e parênteses fazem alguns
    // navegadores trocar o nome por «download».
    n = String(n || 'documento.pdf').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[–—]/g, '-').replace(/[^\w.\-]+/g, '_').replace(/_+/g, '_').replace(/_(\.pdf)$/i, '$1').replace(/^_+/, '');
    if (!/\.pdf$/i.test(n)) n += '.pdf';
    return n;
  }
  var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var instalado = navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);

  function guardarBlob(blob, nome) {
    var url = URL.createObjectURL(blob);
    setTimeout(function () { URL.revokeObjectURL(url); }, 180000);
    // iPhone/iPad com o ZELO instalado: o atributo download não funciona.
    if (iOS && instalado && navigator.canShare) {
      try {
        var f = new File([blob], nome, { type: 'application/pdf' });
        if (navigator.canShare({ files: [f] })) {
          navigator.share({ files: [f], title: nome }).catch(function () {});
          aviso(nome, url); return;
        }
      } catch (e) {}
    }
    if (window.navigator.msSaveOrOpenBlob) { window.navigator.msSaveOrOpenBlob(blob, nome); aviso(nome, null); return; }
    var a = document.createElement('a');
    a.href = url; a.download = nome; a.rel = 'noopener'; a.style.display = 'none';
    document.body.appendChild(a); a.click();
    setTimeout(function () { a.remove(); }, 1000);
    aviso(nome, url);
  }

  var corrigido = false;
  function corrigirSave() {
    if (corrigido || !temJspdf()) return;
    // O jsPDF cria o save() em cada documento, por isso envolve-se o construtor.
    var Orig = window.jspdf.jsPDF;
    function ZeloJsPDF() {
      var args = [null].concat(Array.prototype.slice.call(arguments));
      var doc = new (Function.prototype.bind.apply(Orig, args))();
      var original = doc.save;
      if (typeof original === 'function') doc.save = function (nome, opcoes) {
        if (opcoes && opcoes.returnPromise) return original.apply(this, arguments);
        var n = nomeLimpo(nome);
        try { guardarBlob(this.output('blob'), n); }
        catch (e) { return original.call(this, n); }
        return this;
      };
      return doc;
    }
    Object.keys(Orig).forEach(function (k) { ZeloJsPDF[k] = Orig[k]; });
    ZeloJsPDF.API = Orig.API; ZeloJsPDF.prototype = Orig.prototype;
    window.jspdf.jsPDF = ZeloJsPDF;
    if (window.jsPDF === Orig) window.jsPDF = ZeloJsPDF;
    corrigido = true;
  }
  window.ZeloPdfGuardar = { carregar: carregar, guardarBlob: guardarBlob };

  // Clique num botão «PDF» antes de a biblioteca estar pronta: carrega a
  // cópia local e repete o clique (em vez de não acontecer nada).
  document.addEventListener('click', function (ev) {
    var b = ev.target && ev.target.closest && ev.target.closest('button,a,[role=button]');
    if (!b || b.__zeloPdfRepetir || !/\bPDF\b/i.test(b.textContent || '')) return;
    if (temAt()) { corrigirSave(); return; }
    ev.preventDefault(); ev.stopImmediatePropagation();
    carregar().then(function (ok) {
      if (!ok) { erro('Não foi possível preparar o PDF. Verifique a internet e tente outra vez.'); return; }
      b.__zeloPdfRepetir = true;
      try { b.click(); } finally { b.__zeloPdfRepetir = false; }
    });
  }, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { carregar(); });
  else carregar();
})();
