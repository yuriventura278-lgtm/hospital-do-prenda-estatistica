// ── ZELO — Menu da página ──
// Regra do sistema: no cabeçalho não há botões de Guardar/Registar, nem de
// Exportar, PDF, Backup, Restaurar ou Email. Estes botões passam para o menu
// da própria página:
//   • páginas com menu lateral: secção "Ações da página" no fim desse menu;
//   • páginas sem menu lateral (ou no telemóvel, quando o menu lateral está
//     escondido): botão "Menu da página" no cabeçalho, que abre a lista.
// O botão original da página continua a existir (escondido) e é ele que
// trabalha: o item do menu só o "carrega", por isso nada muda no que a página
// faz ao guardar/exportar. Botões que só aparecem a administradores continuam
// a aparecer só a administradores.
// Outros módulos juntam itens com ZeloMenuPagina.adicionar({...}) — ex.:
// "Histórico de registos" (zelo_auditoria.js).
(function () {
  'use strict';
  if (window.ZeloMenuPagina || window.self !== window.top) return;
  var ficheiro = decodeURIComponent((location.pathname.split('/').pop() || 'index.html'));
  // Páginas de entrada/navegação: sem menu da página.
  var SEM_MENU = /^(index|servicos|sistemas_independentes|bancos_index|informacoes_zelo|Dashboard|procedimentos_enfermagem_index)\.html$/i;

  var IC = {
    guardar: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
    pdf: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M12 18v-6M9 15l3 3 3-3"/>',
    backup: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    restaurar: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
    email: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>',
    historico: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    auditoria: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    menu: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>',
    item: '<circle cx="12" cy="12" r="3"/>'
  };
  function svg(n) { return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:-3px">' + (IC[n] || IC.item) + '</svg>'; }
  function norm(t) { return String(t || '').replace(/\s+/g, ' ').replace(/^[^A-Za-zÀ-ú0-9]+/, '').trim().toLowerCase(); }

  // Botões do cabeçalho que passam para o menu da página: [padrão, rótulo, ícone, ordem].
  var ACOES = [
    [/^(guardar|gravar|salvar|registar)( registo| dados| tudo)?$/, 'Guardar', 'guardar', 1],
    [/^(exportar pdf|exportar|pdf|gerar pdf|imprimir)$/, 'Exportar PDF', 'pdf', 2],
    [/^(email|enviar email|enviar por email)$/, 'Enviar por email', 'email', 3],
    [/^histórico$/, 'Histórico', 'historico', 4],
    [/^(backup|cópia de segurança|copia de seguranca)$/, 'Cópia de segurança', 'backup', 5],
    [/^backup automático$/, 'Cópia automática', 'backup', 6],
    [/^(restaurar|restaurar backup|importar)$/, 'Restaurar cópia', 'restaurar', 7]
  ];
  function acaoDe(el) {
    var t = norm(el.innerText || el.textContent || el.getAttribute('title') || el.getAttribute('aria-label'));
    if (!t) return null;
    for (var i = 0; i < ACOES.length; i++) if (ACOES[i][0].test(t)) return ACOES[i];
    return null;
  }

  var css =
    '.zmp-oculto{display:none!important}' +
    '.zmp-sec-t{padding:12px 14px 4px;font:800 .58rem Inter,"Segoe UI",Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#64748B}' +
    '.zmp-item-base{display:flex;align-items:center;gap:9px;width:100%;padding:9px 12px;border:1px solid transparent;border-radius:8px;background:none;cursor:pointer;text-align:left;font:600 .8rem Inter,"Segoe UI",Arial,sans-serif;color:inherit}' +
    '.zmp-item-base:hover{background:rgba(62,92,135,.1)}' +
    '.zmp-destaque{font-weight:800!important}' +
    '#zmp-btn{display:none}#zmp-btn.on{display:inline-flex!important;align-items:center;gap:7px;flex-shrink:0;white-space:nowrap;cursor:pointer;' +
    'padding:7px 13px;border-radius:999px;border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.1);color:#fff;font:700 .8rem Inter,"Segoe UI",Arial,sans-serif;line-height:1.2;margin:0 2px}' +
    '#zmp-btn.on:hover{background:rgba(255,255,255,.2)}' +
    '@media(max-width:760px){#zmp-btn.on span{display:none}#zmp-btn.on{padding:7px 9px}}' +
    '#zmp-pain{position:fixed;z-index:2147482000;min-width:240px;max-width:min(92vw,320px);max-height:70vh;overflow:auto;background:#fff;border:1px solid #DCE3EE;border-radius:12px;box-shadow:0 18px 44px rgba(15,23,42,.25);padding:8px;display:none;color:#0F172A}' +
    '#zmp-pain.on{display:block}' +
    '#zmp-pain .zmp-cab{padding:6px 10px 8px;font:800 .62rem Inter,Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#64748B;border-bottom:1px solid #EEF2F7;margin-bottom:4px}' +
    '#zmp-pain button{display:flex;align-items:center;gap:10px;width:100%;padding:10px 12px;border:none;border-radius:8px;background:none;cursor:pointer;text-align:left;font:600 .88rem Inter,"Segoe UI",Arial,sans-serif;color:#1E293B}' +
    '#zmp-pain button:hover{background:#EFF6FF;color:#1D4ED8}';

  var itens = [];          // {id, rotulo, icone, ordem, acao(), visivel(), destaque}
  var lateral = null, secLateral = null, botao = null, painel = null;

  function visivelProprio(el) {
    // Escondido pela própria página (não por nós nem por um menu fechado)?
    if (!el || !el.isConnected) return false;
    if (el.hidden || el.style.display === 'none' || el.style.visibility === 'hidden') return false;
    var d = el.ownerDocument.defaultView.getComputedStyle(el);
    if (!el.classList.contains('zmp-oculto') && d.display === 'none') return false;
    return true;
  }
  function acharLateral() {
    var cands = document.querySelectorAll('.cpx-side,nav.sidebar,aside.sidebar,.sidebar,#sidebar,aside');
    for (var i = 0; i < cands.length; i++) {
      var s = cands[i];
      if (s.closest('#zmf-panel,.zc-cab,header,#zpe,.modal,[role="dialog"]')) continue;
      if (s.querySelector('.nav-item,.menu-item,.cpx-item,button,a')) return s;
    }
    return null;
  }
  function lateralVisivel() { return !!(lateral && lateral.getClientRects().length && lateral.getBoundingClientRect().width > 80); }
  function modeloItem() {
    var l = Array.prototype.filter.call(lateral.querySelectorAll('.cpx-item,.nav-item,.menu-item'), function (e) { return !e.closest('.zmp-sec'); });
    return l[l.length - 1] || null;
  }
  function desenharLateral() {
    if (!lateral) return;
    if (!secLateral) {
      secLateral = document.createElement('div'); secLateral.className = 'zmp-sec';
      var modelo = modeloItem();
      var tit = lateral.querySelector('.cpx-sec,.sb-sec,.nav-section-lbl,.nav-section-title,.sb-section');
      var h = document.createElement('div'); h.className = tit ? tit.className : 'zmp-sec-t'; h.textContent = 'Ações da página';
      var lista = document.createElement('div');
      var pl = modelo && modelo.parentElement && modelo.parentElement !== lateral ? modelo.parentElement : null;
      lista.className = pl ? pl.className : ''; lista.classList.add('zmp-lista');
      var hr = lateral.querySelector('hr'); if (hr) secLateral.appendChild(hr.cloneNode());
      secLateral.appendChild(h); secLateral.appendChild(lista);
      (pl ? pl.parentElement : lateral).appendChild(secLateral);
      secLateral.__modelo = modelo;
    }
    var lista = secLateral.querySelector('.zmp-lista'), modelo = secLateral.__modelo;
    lista.innerHTML = '';
    var vis = itens.filter(function (it) { return !it.visivel || it.visivel(); }).sort(function (a, b) { return a.ordem - b.ordem; });
    vis.forEach(function (it) {
      var b = document.createElement(modelo && modelo.tagName === 'DIV' ? 'div' : 'button');
      if (b.tagName === 'BUTTON') b.type = 'button';
      b.className = modelo ? String(modelo.className).replace(/\b(active|ativo|on|selected|sel)\b/g, '').trim() : 'zmp-item-base';
      if (it.destaque) b.classList.add('zmp-destaque');
      b.setAttribute('role', 'button'); b.tabIndex = 0;
      b.innerHTML = svg(it.icone) + '<span>' + it.rotulo + '</span>';
      if (modelo && modelo.classList.contains('nav-item') && modelo.querySelector('.ni-label')) b.innerHTML = '<span class="ni-icon">' + svg(it.icone) + '</span><span class="ni-label">' + it.rotulo + '</span>';
      b.style.display = modelo ? '' : 'flex';
      b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); it.acao(); });
      b.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); it.acao(); } });
      lista.appendChild(b);
    });
    secLateral.style.display = vis.length ? '' : 'none';
  }
  function garantirBotao() {
    if (botao) return true;
    var cab = document.querySelector('.zc-cab'); if (!cab) return false;
    // Fica logo a seguir ao último de Início / Instruções (no mesmo grupo de botões).
    var refs = Array.prototype.filter.call(cab.querySelectorAll('button,a'), function (e) {
      return /^(início|inicio|instruções|tema)$/i.test((e.textContent || '').trim()) && e.getClientRects().length && !e.closest('#zmp-pain');
    });
    var ref = refs[refs.length - 1];
    botao = document.createElement('button'); botao.type = 'button'; botao.id = 'zmp-btn';
    botao.innerHTML = svg('menu') + '<span>Menu da página</span>';
    botao.setAttribute('aria-haspopup', 'true');
    if (ref && ref.parentNode) ref.parentNode.insertBefore(botao, ref.nextSibling);
    else (cab.querySelector('.zc-acoes') || cab).appendChild(botao);
    posicionar();
    painel = document.createElement('div'); painel.id = 'zmp-pain'; document.body.appendChild(painel);
    botao.addEventListener('click', function (e) {
      e.stopPropagation();
      if (painel.classList.contains('on')) { painel.classList.remove('on'); return; }
      desenharPainel();
      var r = botao.getBoundingClientRect();
      painel.classList.add('on');
      var w = painel.offsetWidth;
      painel.style.top = Math.round(r.bottom + 6) + 'px';
      painel.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, Math.round(r.right - w))) + 'px';
    });
    document.addEventListener('click', function (e) { if (painel && !painel.contains(e.target) && e.target !== botao) painel.classList.remove('on'); });
    return true;
  }
  // Outros módulos do cabeçalho mudam botões de sítio depois de a página abrir:
  // o botão fica sempre logo a seguir ao último botão da fila (antes de Terminar sessão).
  function posicionar() {
    var cab = document.querySelector('.zc-cab'); if (!cab || !botao) return;
    var bs = Array.prototype.filter.call(cab.querySelectorAll('button,a'), function (e) {
      return e !== botao && !botao.contains(e) && e.getClientRects().length && !e.closest('.zc-id,#last-saved-status,.b2-menu,#zmp-pain') &&
        !/terminar sess/i.test(e.textContent || '') && !/zeloLogout/.test(e.getAttribute('onclick') || '');
    });
    var ult = bs[bs.length - 1];
    if (ult && ult.parentNode && ult.nextElementSibling !== botao) ult.parentNode.insertBefore(botao, ult.nextSibling);
  }
  function desenharPainel() {
    var vis = itens.filter(function (it) { return !it.visivel || it.visivel(); }).sort(function (a, b) { return a.ordem - b.ordem; });
    painel.innerHTML = '<div class="zmp-cab">Menu da página</div>';
    vis.forEach(function (it) {
      var b = document.createElement('button'); b.type = 'button';
      b.innerHTML = svg(it.icone) + '<span>' + it.rotulo + '</span>';
      if (it.destaque) b.style.fontWeight = '800';
      b.addEventListener('click', function () { painel.classList.remove('on'); it.acao(); });
      painel.appendChild(b);
    });
  }
  function atualizar() {
    if (SEM_MENU.test(ficheiro)) return;
    if (!lateral || !lateral.isConnected) { lateral = acharLateral(); secLateral = null; }
    var algum = itens.some(function (it) { return !it.visivel || it.visivel(); });
    if (lateral) desenharLateral();
    var precisaBotao = algum && !lateralVisivel();
    if (precisaBotao) garantirBotao();
    if (botao) botao.classList.toggle('on', precisaBotao);
    if (precisaBotao) posicionar();
  }
  var tAtual = null;
  function agendar() { clearTimeout(tAtual); tAtual = setTimeout(atualizar, 120); }

  function adicionar(it) {
    if (!it || !it.id) return;
    itens = itens.filter(function (x) { return x.id !== it.id; });
    it.ordem = it.ordem || 50; it.icone = it.icone || 'item';
    itens.push(it); agendar();
  }

  // ── Botões do cabeçalho → menu da página ──
  var tratados = typeof WeakSet === 'function' ? new WeakSet() : null;
  function jaTem(rotulo, fora) {
    // Já existe o mesmo botão visível fora do cabeçalho (ex.: barra "Guardar" no fundo)?
    var r = norm(rotulo);
    return Array.prototype.some.call(document.querySelectorAll('button,a,[role="button"],.nav-item,.menu-item,.cpx-item'), function (e) {
      if (e.closest('.zc-cab,#zmp-pain,.zmp-sec,#zpe,#zmf-panel') || !e.getClientRects().length) return false;
      return e !== fora && norm(e.innerText || e.textContent) === r;
    });
  }
  function varrerCabecalho() {
    var cab = document.querySelector('.zc-cab'); if (!cab) return;
    Array.prototype.forEach.call(cab.querySelectorAll('button,a,label,[role="button"]'), function (el) {
      if (el.id === 'zmp-btn' || el.closest('.zc-id,#last-saved-status')) return;
      if (tratados && tratados.has(el)) return;
      var a = acaoDe(el); if (!a) return;
      if (tratados) tratados.add(el);
      var rotulo = a[1];
      var duplicado = jaTem(rotulo, el) || (a[2] === 'historico' && jaTem('Histórico', el)) || (a[2] === 'backup' && jaTem('Backup', el));
      el.classList.add('zmp-oculto');
      if (duplicado) return;
      var id = 'cab-' + rotulo + '-' + Math.random().toString(36).slice(2, 6);
      adicionar({
        id: id, rotulo: rotulo, icone: a[2], ordem: a[3], destaque: a[2] === 'guardar',
        acao: function () {
          // <label for=…> (ex.: Restaurar com ficheiro) e botões normais.
          if (el.tagName === 'LABEL' && el.htmlFor) { var i = document.getElementById(el.htmlFor); if (i) { i.click(); return; } }
          el.click();
        },
        visivel: function () { return visivelProprio(el); }
      });
      // Se a página mostrar/esconder o botão (ex.: só para administradores), o menu acompanha.
      if (window.MutationObserver) new MutationObserver(agendar).observe(el, { attributes: true, attributeFilter: ['style', 'hidden', 'class'] });
    });
  }

  function iniciar() {
    if (SEM_MENU.test(ficheiro)) return;
    var st = document.createElement('style'); st.id = 'zmp-css'; st.textContent = css; document.head.appendChild(st);
    [200, 800, 1600, 3000, 5000, 8000, 12000].forEach(function (ms) { setTimeout(function () { varrerCabecalho(); atualizar(); }, ms); });
    // Botões que as páginas juntam ao cabeçalho mais tarde (ex.: cópia de segurança).
    if (window.MutationObserver) {
      var obs = new MutationObserver(function () { varrerCabecalho(); agendar(); });
      var ligar = setInterval(function () { var cab = document.querySelector('.zc-cab'); if (cab) { clearInterval(ligar); obs.observe(cab, { childList: true, subtree: true }); } }, 400);
      setTimeout(function () { clearInterval(ligar); }, 20000);
    }
    window.addEventListener('resize', agendar);
    window.addEventListener('zelo-gate-ready', function () { setTimeout(atualizar, 300); });
  }
  window.ZeloMenuPagina = { adicionar: adicionar, atualizar: atualizar, svg: svg };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
