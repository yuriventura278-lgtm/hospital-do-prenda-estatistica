// ── ZELO — Pesquisa de diagnósticos com o CID-10 completo ──
// Liga-se sozinha aos campos de diagnóstico e de CID que usavam listas
// (datalist) curtas: Controlo de Pacientes (diagnosticosList,
// diagnosticosListEdit, cpDiagFinalList, cpCidList) e Bloco Operatório
// (b2-dl-diag, b2-dl-cid). Também serve qualquer campo com
// data-cid-busca="nome" ou data-cid-busca="codigo".
//
// Mostra primeiro os diagnósticos que o serviço já usa (as opções da lista
// da própria página) e depois os do catálogo CID-10 completo (ZeloCID, em
// zelo_cid10.js): por código ("K35", "s72.0") ou por palavras, sem acentos.
// Ao escolher, escreve o nome (campo de diagnóstico) ou o código (campo de
// CID) e dispara "input"/"change", para a página preencher o outro campo
// como já fazia.
(function () {
  if (window.ZeloCIDBusca) return;
  var MODOS = { diagnosticosList: 'nome', diagnosticosListEdit: 'nome', cpDiagFinalList: 'nome', cpCidList: 'codigo', 'b2-dl-diag': 'nome', 'b2-dl-cid': 'codigo' };

  var css = document.createElement('style');
  css.textContent =
    '.zcb-dd{position:fixed;z-index:2147483647;background:#fff;border:1px solid #D6E0EC;border-radius:12px;box-shadow:0 16px 40px rgba(15,23,42,.22);' +
    'max-height:320px;overflow:auto;font:500 .88rem Inter,"Segoe UI",Roboto,Arial,sans-serif;color:#0F172A;padding:4px}' +
    '.zcb-dd .it{display:flex;gap:10px;align-items:flex-start;padding:8px 10px;border-radius:9px;cursor:pointer;line-height:1.3}' +
    '.zcb-dd .it:hover,.zcb-dd .it.on{background:#EEF4FB}' +
    '.zcb-dd .cd{flex-shrink:0;min-width:52px;font:700 .78rem ui-monospace,Consolas,monospace;color:#1E3A5F;background:#EEF4FB;border:1px solid #D6E2F0;border-radius:6px;padding:1px 6px;text-align:center}' +
    '.zcb-dd .cd.v{background:#F1F5F9;color:#94A3B8;border-color:#E2E8F0}' +
    '.zcb-dd .gr{font:800 .66rem Inter,Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#64748B;padding:8px 10px 4px}' +
    '.zcb-dd .vz{padding:10px;color:#64748B;font-size:.82rem}' +
    'html[data-zelo-theme="dark"] .zcb-dd{background:#111A2B;border-color:#1F2A3D;color:#E6ECF5}' +
    'html[data-zelo-theme="dark"] .zcb-dd .it:hover,html[data-zelo-theme="dark"] .zcb-dd .it.on{background:#1B2A40}';
  (document.head || document.documentElement).appendChild(css);

  function n(t) { return window.ZeloCID ? window.ZeloCID.normalizar(t) : String(t || '').toLowerCase(); }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  var dd = null, alvo = null, itens = [], ativo = -1;
  function modoDe(inp) {
    if (!inp || inp.tagName !== 'INPUT') return null;
    if (inp.dataset.cidBusca) return inp.dataset.cidBusca;
    if (inp.dataset.zcbModo) return inp.dataset.zcbModo;
    var l = inp.getAttribute('list');
    if (l && MODOS[l]) {
      // Deixa de usar a lista do navegador (lenta e curta); guardamos o id
      // para continuar a mostrar primeiro as opções da própria página.
      inp.dataset.zcbLista = l; inp.dataset.zcbModo = MODOS[l]; inp.removeAttribute('list');
      return MODOS[l];
    }
    return null;
  }
  // Opções da própria página (diagnósticos já usados no serviço).
  function daPagina(inp, q, modo, max) {
    var dl = inp.dataset.zcbLista && document.getElementById(inp.dataset.zcbLista);
    if (!dl) return [];
    var qn = n(q), out = [];
    Array.prototype.some.call(dl.options, function (o) {
      var v = o.value, t = (o.textContent || o.label || '').trim();
      var cod = modo === 'codigo' ? v : ((t.match(/^([A-Z][0-9]{2}(?:\.[0-9A-Z]+)?)\b/) || [])[1] || '');
      var nome = modo === 'codigo' ? t : v;
      if (!qn || n(nome).indexOf(qn) >= 0 || n(cod).indexOf(qn) === 0) out.push([cod, nome]);
      return out.length >= max;
    });
    return out;
  }
  function posicionar() {
    if (!dd || !alvo) return;
    var r = alvo.getBoundingClientRect(), w = Math.max(r.width, Math.min(460, window.innerWidth - 16));
    var left = Math.min(r.left, window.innerWidth - w - 8), baixo = window.innerHeight - r.bottom;
    dd.style.left = Math.max(8, left) + 'px'; dd.style.width = w + 'px';
    if (baixo < 220 && r.top > baixo) { dd.style.top = ''; dd.style.bottom = (window.innerHeight - r.top + 4) + 'px'; dd.style.maxHeight = Math.min(320, r.top - 12) + 'px'; }
    else { dd.style.bottom = ''; dd.style.top = (r.bottom + 4) + 'px'; dd.style.maxHeight = Math.min(320, baixo - 12) + 'px'; }
  }
  function fechar() { if (dd) dd.style.display = 'none'; itens = []; ativo = -1; }
  function mostrar(inp) {
    var modo = modoDe(inp); if (!modo) return;
    alvo = inp;
    var q = inp.value.trim();
    var locais = daPagina(inp, q, modo, q ? 5 : 8);
    var cat = (q.length >= 2 && window.ZeloCID) ? window.ZeloCID.buscar(q, 25) : [];
    var vistos = {}; locais.forEach(function (x) { vistos[n(x[1])] = 1; });
    cat = cat.filter(function (x) { return !vistos[n(x[1])]; });
    itens = locais.concat(cat); ativo = -1;
    if (!dd) {
      dd = document.createElement('div'); dd.className = 'zcb-dd'; document.body.appendChild(dd);
      dd.addEventListener('mousedown', function (e) { e.preventDefault(); });
      dd.addEventListener('click', function (e) { var it = e.target.closest('.it'); if (it) escolher(+it.dataset.i); });
    }
    if (!itens.length) {
      if (q.length < 2) { fechar(); return; }
      dd.innerHTML = '<div class="vz">Nenhum diagnóstico CID-10 encontrado. Pode escrever o diagnóstico como quiser.</div>';
    } else {
      var h = '', i = 0;
      if (locais.length) h += '<div class="gr">Sugestões do serviço</div>';
      itens.forEach(function (x, k) {
        if (k === locais.length && cat.length) h += '<div class="gr">CID-10 · todos os diagnósticos</div>';
        h += '<div class="it" data-i="' + k + '"><span class="cd' + (x[0] ? '' : ' v') + '">' + esc(x[0] || '—') + '</span><span>' + esc(x[1]) + '</span></div>';
        i++;
      });
      dd.innerHTML = h;
    }
    dd.style.display = 'block'; posicionar();
  }
  function escolher(i) {
    var x = itens[i], inp = alvo; if (!x || !inp) return;
    var modo = modoDe(inp);
    inp.value = modo === 'codigo' ? (x[0] || inp.value) : x[1];
    if (modo === 'codigo') inp.dataset.manual = '1';
    fechar();
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    inp.dispatchEvent(new Event('change', { bubbles: true }));
    // Campo do par (CID ao lado do diagnóstico, ou vice-versa) ainda vazio:
    // preenche com o outro valor escolhido.
    var outroModo = modo === 'codigo' ? 'nome' : 'codigo', caixa = inp.parentElement, par = null;
    for (var k = 0; k < 4 && caixa && !par; k++, caixa = caixa.parentElement) {
      par = Array.prototype.filter.call(caixa.querySelectorAll('input'), function (o) { return o !== inp && modoDe(o) === outroModo; })[0] || null;
    }
    if (par && !par.value.trim() && (outroModo === 'codigo' ? x[0] : x[1])) {
      par.value = outroModo === 'codigo' ? x[0] : x[1];
      par.dispatchEvent(new Event('input', { bubbles: true }));
      par.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  document.addEventListener('focusin', function (e) { if (modoDe(e.target)) mostrar(e.target); });
  document.addEventListener('input', function (e) { if (e.target === alvo || modoDe(e.target)) mostrar(e.target); }, true);
  document.addEventListener('focusout', function (e) { if (e.target === alvo) setTimeout(function () { if (document.activeElement !== alvo) fechar(); }, 150); });
  document.addEventListener('keydown', function (e) {
    if (!dd || dd.style.display === 'none' || e.target !== alvo || !itens.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); ativo = (ativo + (e.key === 'ArrowDown' ? 1 : -1) + itens.length) % itens.length;
      Array.prototype.forEach.call(dd.querySelectorAll('.it'), function (el, k) { el.classList.toggle('on', k === ativo); if (k === ativo) el.scrollIntoView({ block: 'nearest' }); });
    } else if (e.key === 'Enter' && ativo >= 0) { e.preventDefault(); e.stopPropagation(); escolher(ativo); }
    else if (e.key === 'Escape') fechar();
  }, true);
  window.addEventListener('resize', posicionar);
  window.addEventListener('scroll', posicionar, true);

  window.ZeloCIDBusca = { mostrar: mostrar, fechar: fechar };
})();
