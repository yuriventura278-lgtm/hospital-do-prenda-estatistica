// ZELO — menu flutuante: um botão fixo, presente em qualquer página do
// sistema, que abre um painel deslizante com o mesmo acesso rápido do menu
// lateral de index.html (Serviços + Sistemas Locais em árvore, Estatística,
// Informações do ZELO). Não empurra nem redimensiona o conteúdo da página —
// é sempre uma sobreposição (overlay), por isso pode ser adicionado a
// qualquer página sem risco de desalinhar formulários/tabelas já existentes.
//
// Só precisa que zelo_servicos_menu.js já tenha corrido antes (define
// window.SERVICOS_MENU / CATEGORIAS_SERVICOS / SISTEMAS_LOCAIS_MENU /
// zeloSlugifyServico). Permissões são aplicadas via window.hasModuleAccess
// quando existir (falha aberto — mostra tudo — se ainda não tiver carregado).
(function(){
  if (window.__zeloMenuFlutuanteIniciado) return; // nunca injectar duas vezes
  window.__zeloMenuFlutuanteIniciado = true;

  function injectarEstilos(){
    var style = document.createElement('style');
    style.id = 'zelo-menu-flutuante-style';
    style.textContent = `
      /* Botão flutuante compacto (círculo) — quanto menor a área ocupada,
         menos risco de sobrepor barras de acção/rodapés fixos que já existem
         em várias páginas (ex: barra "Guardar" fixa no fundo). Z-index muito
         alto garante que fica sempre por cima, mesmo que visualmente
         sobreponha algum canto dessas barras. */
      #zmf-btn{position:fixed;left:16px;bottom:16px;z-index:2147483000;width:50px;height:50px;
        display:flex;align-items:center;justify-content:center;border-radius:50%;
        background:#0D1B3E;color:#fff;border:2px solid rgba(255,255,255,.15);cursor:pointer;
        box-shadow:0 8px 24px rgba(13,27,62,.4);transition:transform .15s,box-shadow .15s;}
      #zmf-btn:hover{transform:translateY(-1px) scale(1.04);box-shadow:0 12px 30px rgba(13,27,62,.48);}
      #zmf-btn:active{transform:scale(.94);}
      #zmf-overlay{position:fixed;inset:0;background:rgba(8,14,32,.45);z-index:2147483001;opacity:0;pointer-events:none;
        transition:opacity .2s ease;}
      #zmf-overlay.open{opacity:1;pointer-events:auto;}
      #zmf-panel{position:fixed;top:0;left:0;bottom:0;width:290px;max-width:86vw;background:#fff;z-index:2147483002;
        box-shadow:6px 0 40px rgba(0,0,0,.25);transform:translateX(-100%);transition:transform .22s cubic-bezier(.2,.8,.2,1);
        display:flex;flex-direction:column;font-family:'Inter',Arial,sans-serif;}
      #zmf-panel.open{transform:translateX(0);}
      .zmf-head{display:flex;align-items:center;gap:10px;padding:16px 14px;border-bottom:1px solid #E2E8F0;flex-shrink:0;}
      .zmf-head img{width:30px;height:30px;border-radius:8px;flex-shrink:0;}
      .zmf-head .zmf-title{font-weight:800;color:#0D1B3E;font-size:.9rem;flex:1;min-width:0;}
      .zmf-close{flex-shrink:0;width:28px;height:28px;border-radius:8px;background:#F4F7FF;border:none;color:#64748B;
        display:flex;align-items:center;justify-content:center;cursor:pointer;}
      .zmf-close:hover{background:#E2E8F0;color:#0D1B3E;}
      .zmf-nav{flex:1;min-height:0;overflow-y:auto;padding:6px 10px 16px;}
      .zmf-group{margin-bottom:4px;}
      .zmf-section-label{font-size:.62rem;font-weight:800;color:#94A3B8;text-transform:uppercase;letter-spacing:.08em;
        padding:12px 10px 6px;}
      .zmf-link{display:flex;align-items:center;gap:10px;width:100%;padding:9px 10px;border-radius:9px;color:#334155;
        text-decoration:none;font-size:.8rem;font-weight:600;background:none;border:none;font-family:inherit;
        text-align:left;cursor:pointer;}
      .zmf-link:hover{background:#F4F7FF;color:#1A56DB;}
      .zmf-link .zmf-ic{width:26px;height:26px;border-radius:7px;background:#F4F7FF;color:#64748B;flex-shrink:0;
        display:flex;align-items:center;justify-content:center;}
      .zmf-link:hover .zmf-ic{background:#EFF6FF;color:#1A56DB;}
      .zmf-parent-row{display:flex;align-items:center;width:100%;}
      .zmf-toggle{flex-shrink:0;width:24px;height:24px;margin-right:4px;border-radius:7px;background:none;border:none;
        color:#94A3B8;display:flex;align-items:center;justify-content:center;cursor:pointer;}
      .zmf-toggle:hover{background:#F4F7FF;color:#1A56DB;}
      .zmf-toggle svg{transition:transform .18s ease;}
      .zmf-toggle.open svg{transform:rotate(90deg);}
      .zmf-subtree{max-height:0;overflow:hidden;transition:max-height .22s ease;}
      .zmf-subtree.open{max-height:2400px;}
      .zmf-cat-row{display:flex;align-items:center;width:100%;}
      .zmf-cat-link{display:flex;align-items:center;gap:8px;flex:1;min-width:0;padding:8px 8px 8px 30px;border-radius:9px;
        color:#334155;font-size:.76rem;font-weight:700;background:none;border:none;font-family:inherit;text-align:left;cursor:pointer;}
      .zmf-cat-link:hover{background:#F4F7FF;color:#1A56DB;}
      .zmf-cat-icon{width:14px;height:14px;flex-shrink:0;color:#1A56DB;}
      .zmf-cat-count{margin-left:auto;font-family:'DM Mono',monospace;font-size:.6rem;color:#94A3B8;}
      .zmf-svc-row{display:flex;align-items:center;width:100%;}
      .zmf-svc-link{display:block;flex:1;min-width:0;padding:7px 8px 7px 48px;font-size:.74rem;color:#64748B;
        background:none;border:none;font-family:inherit;text-align:left;cursor:pointer;border-radius:8px;}
      .zmf-svc-link:hover{background:#F4F7FF;color:#1A56DB;}
      .zmf-svc-toggle{flex-shrink:0;width:20px;height:20px;margin-right:6px;border-radius:6px;background:none;border:none;
        color:#94A3B8;display:flex;align-items:center;justify-content:center;cursor:pointer;}
      .zmf-svc-toggle:hover{background:#F4F7FF;color:#1A56DB;}
      .zmf-svc-toggle svg{transition:transform .18s ease;}
      .zmf-svc-toggle.open svg{transform:rotate(90deg);}
      .zmf-action-list{max-height:0;overflow:hidden;transition:max-height .2s ease;}
      .zmf-action-list.open{max-height:300px;}
      .zmf-action-link{display:flex;align-items:center;gap:6px;padding:6px 10px 6px 66px;font-size:.7rem;font-weight:600;
        color:#1A56DB;text-decoration:none;border-radius:8px;}
      .zmf-action-link::before{content:'';width:4px;height:4px;border-radius:50%;background:currentColor;flex-shrink:0;}
      .zmf-action-link:hover{background:#EFF6FF;}
      .zmf-sis-link{display:block;padding:8px 10px 8px 30px;font-size:.78rem;color:#334155;text-decoration:none;border-radius:9px;}
      .zmf-sis-link:hover{background:#F4F7FF;color:#1A56DB;}
      @media(max-width:480px){#zmf-btn{left:12px;bottom:12px;width:46px;height:46px;}}
    `;
    document.head.appendChild(style);
  }

  var ICON_MENU = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
  var ICON_CHEV = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
  var ICON_DASH = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>';
  var ICON_SVC = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>';
  var ICON_SIS = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>';
  var ICON_STATS = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
  var ICON_INFO = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
  var ICON_SAIR = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>';

  function temAcesso(modulo, item){
    // window.hasModuleAccess só existe nas 4 páginas-índice que a expõem
    // explicitamente (bancos_index.html, procedimentos_enfermagem_index.html,
    // servicos.html, sistemas_independentes.html). Em todas as outras páginas
    // (onde este menu também corre) a mesma função só está acessível via
    // window.ZeloAuth, que o zelo_pagegate.js/zelo_auth.js já garante em
    // qualquer página com sessão — sem este fallback, a verificação falhava
    // sempre em aberto e mostrava tudo a todos os perfis.
    var fn = window.hasModuleAccess || (window.ZeloAuth && window.ZeloAuth.hasModuleAccess);
    if (typeof fn !== 'function') return true; // ainda não carregou — não esconde nada
    var role = sessionStorage.getItem('zeloRole') || 'funcionario';
    var permissoes = {};
    try{ permissoes = JSON.parse(sessionStorage.getItem('zeloPermissoes') || '{}'); }catch(e){}
    return fn(role, permissoes, modulo, item);
  }

  function slug(nome){
    return (window.zeloSlugifyServico || function(n){ return String(n||'').toLowerCase(); })(nome);
  }

  function construirArvoreServicos(){
    var menu = window.SERVICOS_MENU || [];
    var cats = window.CATEGORIAS_SERVICOS || [];
    var porCategoria = {};
    menu.forEach(function(svc){
      var catId = cats.some(function(c){ return c.id === svc.categoria; }) ? svc.categoria : 'outros';
      (porCategoria[catId] = porCategoria[catId] || []).push(svc);
    });
    var html = '';
    cats.forEach(function(cat){
      var itens = porCategoria[cat.id];
      if(!itens || !itens.length) return;
      var visiveisCat = itens.filter(function(svc){
        function algum(lista){ return (lista||[]).some(function(a){ return temAcesso(a.modulo, a.item); }); }
        if(algum(svc.relatorios) || algum(svc.procedimentos)) return true;
        return (svc.movimento||[]).some(function(m){ return temAcesso(m.modulo); });
      });
      if(!visiveisCat.length) return;
      function acoesDoServico(svc){
        var acoes = [];
        (svc.relatorios||[]).forEach(function(r){ if(temAcesso(r.modulo, r.item)) acoes.push({ label: r.label, href: r.file }); });
        (svc.procedimentos||[]).forEach(function(p){ if(temAcesso(p.modulo, p.item)) acoes.push({ label: p.label, href: p.file }); });
        (svc.movimento||[]).forEach(function(m){ if(temAcesso(m.modulo)) acoes.push({ label: m.label, href: 'movimento_mensal.html?servico=' + m.slug }); });
        return acoes;
      }
      // Quando a categoria só tem um serviço, mostrar as suas ligações
      // directamente sob a categoria -- caso contrário fica um nível extra
      // ("Bloco Operatório" > "Bloco Operatório" > Relatório Diário) que
      // parece um beco sem saída em vez de mais um nível para abrir.
      var svcHtml;
      if(visiveisCat.length === 1){
        // Sem wrapper colapsável próprio -- a visibilidade já é controlada
        // pelo toggle da categoria (o único nível que existe aqui).
        svcHtml = acoesDoServico(visiveisCat[0]).map(function(a){
          return '<a class="zmf-action-link" href="' + a.href + '">' + a.label + '</a>';
        }).join('');
      } else {
        svcHtml = visiveisCat.map(function(svc){
          var s = slug(svc.nome);
          var acoes = acoesDoServico(svc);
          var acoesHtml = acoes.map(function(a){
            return '<a class="zmf-action-link" href="' + a.href + '">' + a.label + '</a>';
          }).join('');
          var temAcoes = acoes.length > 0;
          return '<div class="zmf-svc" data-zmf-nome="' + svc.nome.toLowerCase() + '">' +
            '<div class="zmf-svc-row">' +
              '<button type="button" class="zmf-svc-link" data-zmf-svc-toggle="' + s + '">' + svc.nome + '</button>' +
              (temAcoes ? '<button type="button" class="zmf-svc-toggle" data-zmf-svc-toggle="' + s + '" aria-expanded="false">' + ICON_CHEV + '</button>' : '') +
            '</div>' +
            (temAcoes ? '<div class="zmf-action-list" data-zmf-svc-actions="' + s + '">' + acoesHtml + '</div>' : '') +
          '</div>';
        }).join('');
      }
      html += '<div class="zmf-cat" data-zmf-cat="' + cat.id + '">' +
        '<div class="zmf-cat-row">' +
          '<button type="button" class="zmf-cat-link" data-zmf-cat-toggle="' + cat.id + '"><svg class="zmf-cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + cat.icon + '</svg><span>' + cat.label + '</span><span class="zmf-cat-count">' + visiveisCat.length + '</span></button>' +
          '<button type="button" class="zmf-toggle" data-zmf-cat-toggle="' + cat.id + '" aria-expanded="false">' + ICON_CHEV + '</button>' +
        '</div>' +
        '<div class="zmf-subtree" data-zmf-cat-list="' + cat.id + '">' + svcHtml + '</div>' +
      '</div>';
    });
    return html;
  }

  function construirSistemasLocais(){
    var itens = (window.SISTEMAS_LOCAIS_MENU || []).filter(function(s){ return temAcesso(s.modulo, s.item); });
    return itens.map(function(s){
      return '<a class="zmf-sis-link" href="' + s.file + '">' + s.nome + '</a>';
    }).join('');
  }

  function ligarAlternador(root, seletor, datasetAttr, listaAttr){
    root.querySelectorAll(seletor).forEach(function(btn){
      btn.addEventListener('click', function(){
        var id = btn.getAttribute(datasetAttr);
        var list = root.querySelector('[' + listaAttr + '="' + id + '"]');
        if(!list) return;
        var abrir = !list.classList.contains('open');
        list.classList.toggle('open', abrir);
        root.querySelectorAll('[' + datasetAttr + '="' + id + '"]').forEach(function(b){
          b.classList.toggle('open', abrir);
          b.setAttribute('aria-expanded', abrir ? 'true' : 'false');
        });
      });
    });
  }

  function montarPainel(){
    var overlay = document.createElement('div');
    overlay.id = 'zmf-overlay';
    document.body.appendChild(overlay);

    var panel = document.createElement('div');
    panel.id = 'zmf-panel';
    var temLogout = typeof window.zeloLogout === 'function';
    panel.innerHTML = `
      <div class="zmf-head">
        <img src="icons/logo.png" alt="ZELO"/>
        <div class="zmf-title">ZELO · Menu</div>
        <button type="button" class="zmf-close" id="zmf-close" title="Fechar">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <nav class="zmf-nav">
        <div class="zmf-group">
          <a class="zmf-link" href="index.html"><span class="zmf-ic">${ICON_DASH}</span>Dashboard</a>
        </div>
        <div class="zmf-group">
          <div class="zmf-parent-row">
            <button type="button" class="zmf-link" id="zmf-servicos-label" style="flex:1;"><span class="zmf-ic">${ICON_SVC}</span>Serviços</button>
            <button type="button" class="zmf-toggle" id="zmf-servicos-toggle" aria-expanded="false">${ICON_CHEV}</button>
          </div>
          <div class="zmf-subtree" id="zmf-servicos-tree">${construirArvoreServicos()}</div>
        </div>
        <div class="zmf-group">
          <div class="zmf-parent-row">
            <button type="button" class="zmf-link" id="zmf-sistemas-label" style="flex:1;"><span class="zmf-ic">${ICON_SIS}</span>Sistemas Locais</button>
            <button type="button" class="zmf-toggle" id="zmf-sistemas-toggle" aria-expanded="false">${ICON_CHEV}</button>
          </div>
          <div class="zmf-subtree" id="zmf-sistemas-tree">${construirSistemasLocais()}</div>
        </div>
        <div class="zmf-section-label">Análise</div>
        <div class="zmf-group">
          <a class="zmf-link" href="Estatistica.html"><span class="zmf-ic">${ICON_STATS}</span>Estatística</a>
        </div>
        <div class="zmf-section-label">Sistema</div>
        <div class="zmf-group">
          <a class="zmf-link" href="informacoes_zelo.html"><span class="zmf-ic">${ICON_INFO}</span>Informações do ZELO</a>
          ${temLogout ? '<button type="button" class="zmf-link" id="zmf-sair"><span class="zmf-ic">' + ICON_SAIR + '</span>Sair</button>' : ''}
        </div>
      </nav>
    `;
    document.body.appendChild(panel);

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'zmf-btn';
    btn.title = 'Abrir menu ZELO';
    btn.setAttribute('aria-label', 'Abrir menu ZELO');
    btn.innerHTML = ICON_MENU;
    document.body.appendChild(btn);

    function abrir(){
      overlay.classList.add('open');
      panel.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function fechar(){
      overlay.classList.remove('open');
      panel.classList.remove('open');
      document.body.style.overflow = '';
    }
    btn.addEventListener('click', abrir);
    overlay.addEventListener('click', fechar);
    panel.querySelector('#zmf-close').addEventListener('click', fechar);
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') fechar(); });

    function alternarSubtree(labelId, toggleId, treeId){
      var label = panel.querySelector('#' + labelId);
      var toggle = panel.querySelector('#' + toggleId);
      var tree = panel.querySelector('#' + treeId);
      function alternar(){
        var abrirTree = !tree.classList.contains('open');
        tree.classList.toggle('open', abrirTree);
        toggle.classList.toggle('open', abrirTree);
        toggle.setAttribute('aria-expanded', abrirTree ? 'true' : 'false');
      }
      label.addEventListener('click', alternar);
      toggle.addEventListener('click', alternar);
    }
    alternarSubtree('zmf-servicos-label', 'zmf-servicos-toggle', 'zmf-servicos-tree');
    alternarSubtree('zmf-sistemas-label', 'zmf-sistemas-toggle', 'zmf-sistemas-tree');

    ligarAlternador(panel, '[data-zmf-cat-toggle]', 'data-zmf-cat-toggle', 'data-zmf-cat-list');
    ligarAlternador(panel, '[data-zmf-svc-toggle]', 'data-zmf-svc-toggle', 'data-zmf-svc-actions');

    var sairBtn = panel.querySelector('#zmf-sair');
    if(sairBtn) sairBtn.addEventListener('click', function(){ window.zeloLogout(); });
  }

  function iniciar(){
    injectarEstilos();
    montarPainel();
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
