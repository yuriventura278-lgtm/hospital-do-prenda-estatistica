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
      .zmf-grp-link{font-weight:700;color:#334155;}
      .zmf-action-list.zmf-grp-list.open{max-height:900px;}
      .zmf-svc-nested .zmf-svc-link{padding-left:62px;}
      .zmf-svc-nested .zmf-action-link{padding-left:80px;}
      .zmf-sis-link{display:block;padding:8px 10px 8px 30px;font-size:.78rem;color:#334155;text-decoration:none;border-radius:9px;}
      .zmf-sis-link:hover{background:#F4F7FF;color:#1A56DB;}

      /* Botão "Terminar sessão" — sempre visível, sem precisar de abrir o
         menu. Canto superior direito, no cabeçalho da própria página. A
         posição exata (o "top") é calculada em JS, a partir da altura de um
         eventual cabeçalho fixo já existente na página, para nunca ficar
         por cima dele — ver posicionarBotaoSair(). Aqui só ficam
         left/right/z-index/aparência.
      */
      /* Só usado quando a página não tem cabeçalho nenhum onde o botão caiba. */
      #zub-sair-btn.zub-flutuante{position:fixed;top:10px;right:14px;z-index:2147483000;display:flex;align-items:center;gap:7px;
        background:#fff;border:1px solid #E2E8F0;border-radius:100px;padding:9px 16px 9px 14px;cursor:pointer;
        box-shadow:0 6px 18px rgba(13,27,62,.2);font-family:'Inter',Arial,sans-serif;font-size:.78rem;font-weight:700;
        color:#DC2626;transition:background .15s,box-shadow .15s;}
      #zub-sair-btn.zub-flutuante:hover{background:#FEF2F2;box-shadow:0 8px 22px rgba(13,27,62,.28);}
      /* Ao lado do botão "Início": herda a classe/estilo desse botão. */
      #zub-sair-btn.zub-inline{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;cursor:pointer;
        text-decoration:none;flex-shrink:0;}
      #zub-sair-btn.zub-inline svg{flex-shrink:0;}
      /* No fim de um cabeçalho sem botão "Início". */
      #zub-sair-btn.zub-cabecalho{display:inline-flex;align-items:center;gap:6px;margin-left:auto;white-space:nowrap;
        flex-shrink:0;cursor:pointer;background:rgba(255,255,255,.1);border:1px solid rgba(148,163,184,.45);
        border-radius:100px;padding:5px 12px;font-family:'Inter',Arial,sans-serif;font-size:.74rem;font-weight:600;color:inherit;}
      #zub-sair-btn.zub-cabecalho:hover{background:rgba(220,38,38,.1);border-color:#DC2626;color:#DC2626;}
      @media(max-width:480px){
        #zmf-btn{left:12px;bottom:12px;width:46px;height:46px;}
        #zub-sair-btn.zub-flutuante{right:10px;padding:9px;}
        #zub-sair-btn span{display:none;}
        #zub-sair-btn.zub-inline,#zub-sair-btn.zub-cabecalho{padding:6px 8px !important;margin-left:4px !important;min-width:0;}
      }
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
  var ICON_ZELO_ASSIST = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4M8 22h8"/></svg>';

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
        return (svc.movimento||[]).some(function(m){ return temAcesso(m.modulo, m.item); });
      });
      if(!visiveisCat.length) return;
      function acoesDoServico(svc){
        var acoes = [];
        (svc.relatorios||[]).forEach(function(r){ if(temAcesso(r.modulo, r.item)) acoes.push({ label: r.label, href: r.file }); });
        (svc.procedimentos||[]).forEach(function(p){ if(temAcesso(p.modulo, p.item)) acoes.push({ label: p.label, href: p.file }); });
        (svc.movimento||[]).forEach(function(m){ if(temAcesso(m.modulo, m.item)) acoes.push({ label: m.label, href: m.file }); });
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
        var svcItemHtml = function(svc, aninhado){
          var s = slug(svc.nome);
          var acoes = acoesDoServico(svc);
          var acoesHtml = acoes.map(function(a){
            return '<a class="zmf-action-link" href="' + a.href + '">' + a.label + '</a>';
          }).join('');
          var temAcoes = acoes.length > 0;
          return '<div class="zmf-svc' + (aninhado ? ' zmf-svc-nested' : '') + '" data-zmf-nome="' + svc.nome.toLowerCase() + '">' +
            '<div class="zmf-svc-row">' +
              '<button type="button" class="zmf-svc-link" data-zmf-svc-toggle="' + s + '">' + svc.nome + '</button>' +
              (temAcoes ? '<button type="button" class="zmf-svc-toggle" data-zmf-svc-toggle="' + s + '" aria-expanded="false">' + ICON_CHEV + '</button>' : '') +
            '</div>' +
            (temAcoes ? '<div class="zmf-action-list" data-zmf-svc-actions="' + s + '">' + acoesHtml + '</div>' : '') +
          '</div>';
        };
        // Serviços com "grupo" (ex.: Medicina Interna → Medicina Homem e
        // Medicina Mulher) ficam num nível intermédio dentro da categoria.
        var agrupar = window.zeloAgruparServicos || function(l){ return l.map(function(sv){ return { tipo:'svc', svc:sv }; }); };
        svcHtml = agrupar(visiveisCat).map(function(no){
          if(no.tipo === 'svc') return svcItemHtml(no.svc, false);
          var g = 'grp-' + slug(no.nome);
          return '<div class="zmf-svc zmf-grp">' +
            '<div class="zmf-svc-row">' +
              '<button type="button" class="zmf-svc-link zmf-grp-link" data-zmf-svc-toggle="' + g + '">' + no.nome + '</button>' +
              '<button type="button" class="zmf-svc-toggle" data-zmf-svc-toggle="' + g + '" aria-expanded="false">' + ICON_CHEV + '</button>' +
            '</div>' +
            '<div class="zmf-action-list zmf-grp-list" data-zmf-svc-actions="' + g + '">' + no.itens.map(function(sv){ return svcItemHtml(sv, true); }).join('') + '</div>' +
          '</div>';
        }).join('');
      }
      html += '<div class="zmf-cat" data-zmf-cat="' + cat.id + '">' +
        '<div class="zmf-cat-row">' +
          '<button type="button" class="zmf-cat-link" data-zmf-cat-toggle="' + cat.id + '"><svg class="zmf-cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + cat.icon + '</svg><span>' + cat.label + '</span><span class="zmf-cat-count">' + (window.zeloAgruparServicos ? window.zeloAgruparServicos(visiveisCat).length : visiveisCat.length) + '</span></button>' +
          '<button type="button" class="zmf-toggle" data-zmf-cat-toggle="' + cat.id + '" aria-expanded="false">' + ICON_CHEV + '</button>' +
        '</div>' +
        '<div class="zmf-subtree" data-zmf-cat-list="' + cat.id + '">' + svcHtml + '</div>' +
      '</div>';
    });
    return html;
  }

  function construirSistemasLocais(){
    var itens = (window.SISTEMAS_LOCAIS_MENU || []).filter(function(s){ return !s.destaque && temAcesso(s.modulo, s.item); });
    return itens.map(function(s){
      return '<a class="zmf-sis-link" href="' + s.file + '">' + s.nome + '</a>';
    }).join('');
  }

  // Itens de SISTEMAS_LOCAIS_MENU marcados "destaque" saem da árvore
  // colapsável e aparecem como atalho próprio no topo do menu.
  function construirDestaques(){
    var itens = (window.SISTEMAS_LOCAIS_MENU || []).filter(function(s){ return s.destaque && temAcesso(s.modulo, s.item); });
    return itens.map(function(s){
      return '<div class="zmf-group"><a class="zmf-link" href="' + s.file + '"><span class="zmf-ic">' + ICON_SIS + '</span>' + s.nome + '</a></div>';
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
    // Perfis sem nenhum "Sistema Local" acessível (a maioria — este acesso é
    // sempre concedido pelo admin por utilizador) não devem ver uma secção
    // que expande para uma lista vazia.
    var sistemasLocaisHtml = construirSistemasLocais();
    var temSistemasLocais = sistemasLocaisHtml.trim() !== '';
    var destaquesHtml = construirDestaques();
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
          <a class="zmf-link" href="index.html"><span class="zmf-ic">${ICON_DASH}</span>Página Inicial</a>
        </div>
        <div class="zmf-group">
          <button type="button" class="zmf-link" id="zmf-assistente-zelo"><span class="zmf-ic">${ICON_ZELO_ASSIST}</span>Assistente Zelo</button>
        </div>
        <div class="zmf-group">
          <div class="zmf-parent-row">
            <button type="button" class="zmf-link" id="zmf-servicos-label" style="flex:1;"><span class="zmf-ic">${ICON_SVC}</span>Serviços</button>
            <button type="button" class="zmf-toggle" id="zmf-servicos-toggle" aria-expanded="false">${ICON_CHEV}</button>
          </div>
          <div class="zmf-subtree" id="zmf-servicos-tree">${construirArvoreServicos()}</div>
        </div>
        ${temSistemasLocais ? `
        <div class="zmf-group">
          <div class="zmf-parent-row">
            <button type="button" class="zmf-link" id="zmf-sistemas-label" style="flex:1;"><span class="zmf-ic">${ICON_SIS}</span>Sistemas Locais</button>
            <button type="button" class="zmf-toggle" id="zmf-sistemas-toggle" aria-expanded="false">${ICON_CHEV}</button>
          </div>
          <div class="zmf-subtree" id="zmf-sistemas-tree">${sistemasLocaisHtml}</div>
        </div>` : ''}
        ${destaquesHtml}
        <div class="zmf-section-label">Análise</div>
        <div class="zmf-group">
          <a class="zmf-link" href="Estatistica.html"><span class="zmf-ic">${ICON_STATS}</span>Estatística</a>
        </div>
        <div class="zmf-section-label">Sistema</div>
        <div class="zmf-group">
          <a class="zmf-link" href="perfil.html"><span class="zmf-ic">${ICON_PERFIL}</span>O meu perfil</a>
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
    if (temSistemasLocais) alternarSubtree('zmf-sistemas-label', 'zmf-sistemas-toggle', 'zmf-sistemas-tree');

    ligarAlternador(panel, '[data-zmf-cat-toggle]', 'data-zmf-cat-toggle', 'data-zmf-cat-list');
    ligarAlternador(panel, '[data-zmf-svc-toggle]', 'data-zmf-svc-toggle', 'data-zmf-svc-actions');

    var sairBtn = panel.querySelector('#zmf-sair');
    if(sairBtn) sairBtn.addEventListener('click', function(){ window.zeloLogout(); });

    // "Assistente Zelo" — abre o painel do zelo_assistente.js (o botão
    // flutuante próprio dele continua a existir; este item é só mais um
    // caminho até ao mesmo painel, para quem prefira usar o menu).
    var assistenteBtn = panel.querySelector('#zmf-assistente-zelo');
    if(assistenteBtn) assistenteBtn.addEventListener('click', function(){
      fechar();
      if(typeof window.zeloAbrirAssistente === 'function') window.zeloAbrirAssistente();
    });
  }

  var ICON_PERFIL = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';

  // Botão "Terminar sessão" no cabeçalho de cada página, logo a seguir ao
  // botão "Início" (a pedido: nada flutuante no canto superior direito).
  // Ordem de preferência:
  //   1. a página já tem o seu próprio botão de sair no topo → não duplica;
  //   2. há um "Início"/"Voltar à central"/ícone de casa no topo → entra a
  //      seguir a ele, com a mesma classe (fica com o mesmo aspeto);
  //   3. há um cabeçalho mas sem "Início" → entra no fim desse cabeçalho;
  //   4. nenhum cabeçalho → último recurso, fixo no canto.
  // Muitas páginas montam o cabeçalho por JS depois do carregamento, por
  // isso tenta-se de novo durante uns segundos até ficar ao lado do Início.
  var ZONA_TOPO = 170; // px a partir do topo do documento

  function ehNosso(el){ return !!(el.closest && el.closest('#zmf-panel,#zmf-overlay,#zmf-btn,#zub-sair-btn')); }

  function visivelNoTopo(el){
    if (!el || ehNosso(el)) return false;
    var r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 16) return false;
    var st = window.getComputedStyle(el);
    if (st.visibility === 'hidden' || st.display === 'none' || Number(st.opacity) === 0) return false;
    if (r.left < -1 || r.right > window.innerWidth + 1) return false; // fora do ecrã (ex.: gaveta fechada)
    return (r.top + (window.scrollY || 0)) < ZONA_TOPO;
  }

  function paginaJaTemSair(){
    var els = document.querySelectorAll('[onclick]');
    for (var i = 0; i < els.length; i++){
      if (/zeloLogout|doLogout/.test(els[i].getAttribute('onclick') || '') && visivelNoTopo(els[i])) return true;
    }
    return false;
  }

  function encontrarBotaoInicio(){
    var melhor = null, melhorNota = 0, melhorTopo = Infinity;
    var els = document.querySelectorAll('a,button');
    for (var i = 0; i < els.length; i++){
      var el = els[i];
      if (!visivelNoTopo(el)) continue;
      var txt = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
      var alvo = (el.getAttribute('href') || '') + ' ' + (el.getAttribute('onclick') || '');
      var nota = 0;
      if (/^[^A-Za-zÀ-ÿ]*in[íi]cio$/i.test(txt)) nota = 3;
      else if (/voltar (à|a) central/i.test(txt)) nota = 2;
      else if (/(^|\/|\s)index\.html/i.test(alvo) && txt.length < 30) nota = 1;
      if (!nota) continue;
      var topo = el.getBoundingClientRect().top;
      if (nota > melhorNota || (nota === melhorNota && topo < melhorTopo)){ melhor = el; melhorNota = nota; melhorTopo = topo; }
    }
    return melhor;
  }

  function ehLinhaFlex(el){
    var st = window.getComputedStyle(el);
    return st.display.indexOf('flex') !== -1 && st.flexDirection.indexOf('column') === -1 && el.children.length >= 2;
  }

  // Devolve a linha (flex, horizontal) do cabeçalho onde o botão deve entrar.
  function encontrarCabecalho(){
    var els = document.querySelectorAll('header, body *');
    for (var i = 0; i < els.length; i++){
      var el = els[i];
      if (ehNosso(el)) continue;
      var st = window.getComputedStyle(el);
      var fixo = st.position === 'fixed' || st.position === 'sticky';
      if (!fixo && el.tagName !== 'HEADER') continue;
      if (st.display === 'none') continue;
      var r = el.getBoundingClientRect();
      if (r.top > 2 || r.width < window.innerWidth * 0.5 || r.height < 30 || r.height > 240) continue;
      if (ehLinhaFlex(el)) return el;
      // Cabeçalho em blocos (ex.: marca + ano + separadores): usa a primeira
      // linha horizontal lá dentro que ocupe a largura do cabeçalho.
      var filhos = el.querySelectorAll('*');
      for (var j = 0; j < filhos.length; j++){
        var f = filhos[j];
        if (ehNosso(f) || !ehLinhaFlex(f)) continue;
        var rf = f.getBoundingClientRect();
        if (rf.width >= r.width * 0.5 && rf.top - r.top < 100) return f;
      }
    }
    return null;
  }

  // Quando o "Início" é estilizado pelo id (ex.: #backBtn nas páginas de
  // Movimento), a classe não chega — copia-se o aspeto calculado.
  function copiarAspeto(de, para){
    var cs = window.getComputedStyle(de);
    ['backgroundColor','backgroundImage','color','borderTopWidth','borderTopStyle','borderTopColor',
     'borderRightWidth','borderRightStyle','borderRightColor','borderBottomWidth','borderBottomStyle','borderBottomColor',
     'borderLeftWidth','borderLeftStyle','borderLeftColor','fontFamily','fontSize','fontWeight','letterSpacing',
     'textTransform','boxShadow','height'].forEach(function(p){ para.style[p] = cs[p]; });
    var altura = parseFloat(cs.height) || 0;
    var raio = parseFloat(cs.borderTopLeftRadius) || 0;
    para.style.borderRadius = (altura && raio >= altura / 2 - 1) ? '999px' : cs.borderTopLeftRadius;
    para.style.textDecoration = 'none';
    para.style.boxSizing = 'border-box';
    para.style.width = 'auto';
    para.style.padding = '0 12px';
    if (!parseFloat(cs.fontSize) || parseFloat(cs.fontSize) < 12) para.style.fontSize = '13px';
  }

  function montarBotaoSair(){
    if (typeof window.zeloLogout !== 'function') return; // nada a mostrar sem logout definido

    var tentativas = 0;
    function colocar(){
      tentativas++;
      var atual = document.getElementById('zub-sair-btn');
      if (atual && atual.classList.contains('zub-inline')) return true; // já está ao lado do Início

      if (paginaJaTemSair()){
        if (atual) atual.remove();
        return true;
      }

      var inicio = encontrarBotaoInicio();
      var cabecalho = inicio ? null : encontrarCabecalho();
      var ultima = tentativas >= 6;
      if (!inicio && !cabecalho && !ultima && !atual) return false; // espera que o cabeçalho apareça

      if (inicio || cabecalho || !atual){
        if (atual) atual.remove();
        // Mesmo tipo de elemento do "Início" (a/button) para apanhar as
        // mesmas regras CSS da página (ex.: ".topbar a", "a.back").
        var el = document.createElement(inicio && inicio.tagName === 'A' ? 'a' : 'button');
        el.id = 'zub-sair-btn';
        el.title = 'Terminar sessão';
        el.setAttribute('aria-label', 'Terminar sessão');
        el.setAttribute('role', 'button');
        if (el.tagName === 'A') el.setAttribute('href', '#'); else el.type = 'button';
        el.innerHTML = ICON_SAIR + '<span>Terminar sessão</span>';
        el.addEventListener('click', function(e){ e.preventDefault(); window.zeloLogout(); });

        if (inicio){
          el.className = (inicio.className ? inicio.className + ' ' : '') + 'zub-inline';
          var estiloInline = inicio.getAttribute('style');
          if (estiloInline) el.setAttribute('style', estiloInline);
          // "Início" só com ícone (quadrado de largura fixa) → deixa crescer para o texto.
          if (!(inicio.innerText || '').trim()){ el.style.width = 'auto'; el.style.paddingLeft = '10px'; el.style.paddingRight = '10px'; }
          el.style.marginLeft = '6px';
          inicio.insertAdjacentElement('afterend', el);
          if (!inicio.className && inicio.id) copiarAspeto(inicio, el);
        } else if (cabecalho){
          el.className = 'zub-cabecalho';
          var ultimo = cabecalho.lastElementChild;
          if (window.getComputedStyle(cabecalho).justifyContent === 'space-between' && ultimo){
            // Mantém o último elemento encostado à direita, junto do botão
            // (as margens automáticas têm prioridade sobre o space-between).
            if (!ultimo.style.marginLeft) ultimo.style.marginLeft = 'auto';
            el.style.marginLeft = '8px';
          }
          cabecalho.appendChild(el);
        } else {
          el.className = 'zub-flutuante';
          document.body.appendChild(el);
        }
      }
      return !!inicio;
    }

    if (colocar()) return;
    var t = setInterval(function(){ if (colocar() || tentativas >= 8) clearInterval(t); }, 500);
  }

  function iniciar(){
    // Dentro de um iframe (hoje só o Dashboard, embutido na página inicial)
    // a página-mãe já tem a sua própria navegação completa (menu lateral +
    // topbar com sessão) — o botão/painel flutuante aqui só duplicava acesso
    // já visível, sem necessidade (a pedido: a página inicial não precisa
    // do menu flutuante).
    if (window.self !== window.top) return;
    injectarEstilos();
    montarPainel();
    montarBotaoSair();
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
