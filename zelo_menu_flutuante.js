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
      .zmf-cat-link > span:not(.zmf-cat-count){min-width:0;overflow-wrap:anywhere;-webkit-hyphens:auto;hyphens:auto;}
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
      #zmf-servicos-toggle{display:none;}
      #zmf-servicos-label,#zmf-servicos-label:hover,#zmf-servicos-label:active{cursor:default;background:none;box-shadow:none;color:#334155;transform:none;}
      #zmf-servicos-label:hover .zmf-ic,#zmf-servicos-label:active .zmf-ic{background:#F4F7FF;color:#64748B;}

      /* Menu v2: letras um pouco maiores, realce claro ao passar e ao clicar,
         ramo aberto destacado, árvore animada com linhas-guia, barra de
         rolagem fina. */
      .zmf-nav{overscroll-behavior:contain;}
      .zmf-nav::-webkit-scrollbar{width:10px;}
      .zmf-nav::-webkit-scrollbar-track{background:transparent;margin:6px 0;}
      .zmf-nav::-webkit-scrollbar-thumb{background-color:rgba(100,116,139,.22);border-radius:10px;border:3px solid transparent;background-clip:padding-box;}
      .zmf-nav:hover::-webkit-scrollbar-thumb{background-color:rgba(100,116,139,.45);}
      .zmf-nav::-webkit-scrollbar-thumb:hover{background-color:#1A56DB;}
      @supports not selector(::-webkit-scrollbar){ .zmf-nav{scrollbar-width:thin;scrollbar-color:rgba(100,116,139,.45) transparent;} }
      .zmf-link{font-size:.86rem;transition:background .15s,color .15s,box-shadow .15s,transform .12s;}
      .zmf-section-label{font-size:.66rem;}
      .zmf-cat-link{font-size:.82rem;transition:background .15s,color .15s,box-shadow .15s,transform .12s;}
      .zmf-svc-link{font-size:.8rem;font-weight:600;color:#475569;transition:background .15s,color .15s,box-shadow .15s,transform .12s;}
      .zmf-action-link{font-size:.78rem;padding-top:7px;padding-bottom:7px;transition:background .15s,color .15s,transform .12s;}
      .zmf-sis-link{font-size:.82rem;font-weight:600;transition:background .15s,color .15s,box-shadow .15s,transform .12s;}
      .zmf-link:hover,.zmf-cat-link:hover,.zmf-svc-link:hover,.zmf-sis-link:hover{background:rgba(26,86,219,.1);color:#1A56DB;box-shadow:inset 3px 0 0 #1A56DB;}
      .zmf-action-link:hover{background:rgba(26,86,219,.1);transform:translateX(3px);}
      .zmf-link:active,.zmf-cat-link:active,.zmf-svc-link:active,.zmf-sis-link:active,.zmf-action-link:active{background:#1A56DB;color:#fff;transform:scale(.985);}
      .zmf-link:active .zmf-ic{background:rgba(255,255,255,.2);color:#fff;}
      .zmf-toggle,.zmf-svc-toggle{transition:background .15s,color .15s;}
      .zmf-toggle.open,.zmf-svc-toggle.open{background:#1A56DB;color:#fff;}
      .zmf-toggle svg,.zmf-svc-toggle svg{transition:transform .25s cubic-bezier(.4,0,.2,1);}
      .zmf-cat-row:has(> .zmf-toggle.open) .zmf-cat-link{background:rgba(26,86,219,.1);color:#1A56DB;}
      .zmf-svc-row:has(> .zmf-svc-toggle.open) .zmf-svc-link{color:#1A56DB;font-weight:700;}
      .zmf-subtree,.zmf-action-list{opacity:0;transform:translateY(-4px);
        transition:max-height .34s cubic-bezier(.4,0,.2,1),opacity .24s ease,transform .24s ease;}
      .zmf-subtree.open,.zmf-action-list.open{opacity:1;transform:none;}
      .zmf-action-list{position:relative;}
      .zmf-action-list::before{content:'';position:absolute;top:4px;bottom:6px;left:54px;width:2px;border-radius:2px;background:#E2E8F0;}
      .zmf-svc-nested .zmf-action-list::before{left:70px;}
      .zmf-subtree[data-zmf-cat-list]{position:relative;}
      .zmf-subtree[data-zmf-cat-list]::before{content:'';position:absolute;top:4px;bottom:6px;left:36px;width:2px;border-radius:2px;background:#E2E8F0;}
      @media (prefers-reduced-motion:reduce){ .zmf-subtree,.zmf-action-list,.zmf-link,.zmf-cat-link,.zmf-svc-link,.zmf-action-link{transition:none;} }

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
      /* "Última alteração: <nome> às <hora>" — uma etiqueta amarela compacta,
         numa só linha (não empurra nem tapa os botões do cabeçalho); o nome e
         a hora a negrito. As páginas mostram/escondem o elemento com
         style.display — só o formato muda. */
      #last-saved-status:not([style*="display: none"]):not([style*="display:none"]){display:inline-flex !important;}
      /* Páginas que o mostram como bloco centrado (ex.: Consulta Externa): etiqueta ao centro. */
      #last-saved-status[style*="display: block"]:not([style*="display: none"]):not([style*="display:none"]),#last-saved-status[style*="display:block"]:not([style*="display: none"]):not([style*="display:none"]){display:flex !important;width:fit-content;margin-left:auto !important;margin-right:auto !important;}
      #last-saved-status{align-items:center;gap:5px;margin:0 6px;padding:2px 10px 2px 8px !important;
        background:#FEF3C7 !important;border:1px solid #F59E0B !important;border-radius:100px !important;
        color:#7C2D12 !important;font-family:'Inter',Arial,sans-serif !important;font-size:11px !important;
        font-weight:600 !important;letter-spacing:0;line-height:1.5;white-space:nowrap !important;flex-wrap:nowrap !important;
        max-width:100%;box-sizing:border-box;opacity:1 !important;}
      #last-saved-status::before{content:'';width:11px;height:11px;flex-shrink:0;background:#B45309;
        -webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpolyline points='12 6 12 12 16 14'/%3E%3C/svg%3E") center/contain no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpolyline points='12 6 12 12 16 14'/%3E%3C/svg%3E") center/contain no-repeat;}
      #last-saved-status > svg,#last-saved-status .svc-icon{display:none !important;}
      #last-saved-status .lsc-label{font-size:inherit !important;letter-spacing:0 !important;text-transform:none !important;font-weight:600 !important;font-family:inherit !important;}
      #last-saved-name{font-weight:800;color:#7C2D12;white-space:nowrap;}
      #last-saved-time{font-weight:800;color:#7C2D12;font-variant-numeric:tabular-nums;white-space:nowrap;}
      html[data-zelo-theme="dark"] #last-saved-status{background:#3B2A06 !important;border-color:#F59E0B !important;color:#FDE68A !important;}
      html[data-zelo-theme="dark"] #last-saved-name,html[data-zelo-theme="dark"] #last-saved-time{color:#FDE68A;}
      /* Telemóvel: etiqueta "Última alteração" numa faixa própria, logo abaixo do cabeçalho. */
      #zelo-ult-slot{display:flex;justify-content:center;padding:8px 10px 4px;box-sizing:border-box;width:100%;position:relative;z-index:5;}
      #zelo-ult-slot #last-saved-status{margin:0 !important;}
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
      // Tudo aparece a todos (para se saber que existe); quem não tem
      // permissão recebe uma mensagem ao clicar (zeloTentarAbrirLink).
      var visiveisCat = itens;
      function acoesDoServico(svc){
        var acoes = [];
        (svc.relatorios||[]).concat(svc.procedimentos||[], svc.movimento||[]).forEach(function(a){
          acoes.push({ label: a.label, href: a.file, modulo: a.modulo, item: a.item, soAdmin: a.soAdmin });
        });
        return acoes;
      }
      function attrsAcesso(a){ return (a.modulo ? ' data-modulo="' + a.modulo + '"' : '') + (a.item ? ' data-item="' + a.item + '"' : '') + (a.soAdmin ? ' data-so-admin="1"' : ''); }
      // Quando a categoria só tem um serviço, mostrar as suas ligações
      // directamente sob a categoria -- caso contrário fica um nível extra
      // ("Bloco Operatório" > "Bloco Operatório" > Relatório Diário) que
      // parece um beco sem saída em vez de mais um nível para abrir.
      var svcHtml;
      if(visiveisCat.length === 1){
        // Sem wrapper colapsável próprio -- a visibilidade já é controlada
        // pelo toggle da categoria (o único nível que existe aqui).
        svcHtml = acoesDoServico(visiveisCat[0]).map(function(a){
          return '<a class="zmf-action-link" href="' + a.href + '"' + attrsAcesso(a) + '>' + a.label + '</a>';
        }).join('');
      } else {
        var svcItemHtml = function(svc, aninhado){
          var s = slug(svc.nome);
          var acoes = acoesDoServico(svc);
          var acoesHtml = acoes.map(function(a){
            return '<a class="zmf-action-link" href="' + a.href + '"' + attrsAcesso(a) + '>' + a.label + '</a>';
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
          '<button type="button" class="zmf-cat-link" data-zmf-cat-toggle="' + cat.id + '"><svg class="zmf-cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + cat.icon + '</svg><span>' + cat.label + '</span>' + (function(n){ return n > 1 ? '<span class="zmf-cat-count">' + n + '</span>' : ''; })(window.zeloAgruparServicos ? window.zeloAgruparServicos(visiveisCat).length : visiveisCat.length) + '</button>' +
          '<button type="button" class="zmf-toggle" data-zmf-cat-toggle="' + cat.id + '" aria-expanded="false">' + ICON_CHEV + '</button>' +
        '</div>' +
        '<div class="zmf-subtree" data-zmf-cat-list="' + cat.id + '">' + svcHtml + '</div>' +
      '</div>';
    });
    return html;
  }

  // "Serviço de Estatística" (antes "Sistemas Locais"): aparece a todos, mas
  // só os administradores entram — os restantes recebem uma mensagem ao clicar.
  function construirSistemasLocais(){
    var itens = (window.SISTEMAS_LOCAIS_MENU || []).filter(function(s){ return !s.destaque; });
    return itens.map(function(s){
      return '<a class="zmf-sis-link" href="' + s.file + '" data-so-admin="1">' + s.nome + '</a>';
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
          <div class="zmf-parent-row">
            <button type="button" class="zmf-link" id="zmf-servicos-label" style="flex:1;"><span class="zmf-ic">${ICON_SVC}</span>Serviços</button>
            <button type="button" class="zmf-toggle" id="zmf-servicos-toggle" aria-expanded="false">${ICON_CHEV}</button>
          </div>
          <div class="zmf-subtree" id="zmf-servicos-tree">${construirArvoreServicos()}</div>
        </div>
        <!-- O Serviço de Estatística está dentro de Serviços, em último lugar. -->
        ${destaquesHtml}
        <div class="zmf-section-label">Sistema</div>
        <div class="zmf-group">
          <a class="zmf-link" href="perfil.html"><span class="zmf-ic">${ICON_PERFIL}</span>O meu perfil</a>
          <a class="zmf-link" href="informacoes_zelo.html"><span class="zmf-ic">${ICON_INFO}</span>Informações do ZELO</a>
          <button type="button" class="zmf-link" id="zmf-assistente-zelo"><span class="zmf-ic">${ICON_ZELO_ASSIST}</span>Assistente Zelo</button>
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
    // "Serviços" está sempre aberto (sem seta): todos os serviços à vista,
    // só se clica em cada um para expandir.
    panel.querySelector('#zmf-servicos-tree').classList.add('open');
    var tgSvc = panel.querySelector('#zmf-servicos-toggle');
    tgSvc.classList.add('open'); tgSvc.setAttribute('aria-expanded', 'true');


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

  // "· Última alteração:" → "Última alteração:" (a etiqueta já separa do resto).
  function limparPrefixoUltimaAlteracao(){
    var el = document.getElementById('last-saved-status');
    if (!el) return;
    for (var n = el.firstChild; n; n = n.nextSibling){
      if (n.nodeType === 3){
        if (!n.nodeValue.trim()) continue;
        n.nodeValue = n.nodeValue.replace(/^\s*[·•✓]\s*/, '');
        break;
      }
      if (n.nodeType === 1 && n.tagName !== 'svg' && !(n.classList && n.classList.contains('svc-icon'))) break;
    }
  }


  // ── "Última alteração" sempre visível no telemóvel ──
  // Em ecrãs estreitos a etiqueta ficava fora do ecrã (cabeçalhos com vários
  // botões), escondida (partes do cabeçalho ocultas no telemóvel) ou tapada
  // pelos botões flutuantes (barras fixas no fundo). Nesses casos passa para
  // uma faixa própria logo abaixo do cabeçalho; volta ao sítio original em
  // ecrãs largos. O elemento é o mesmo (mesmos ids), por isso a página
  // continua a atualizá-lo como sempre.
  var ULT_LARGURA = 760, ultOrigem = null;
  function ultCabecalho(el){
    var h = el.closest('header,.hdr,.header,.topbar,.top-bar,.app-header,.page-header');
    if (h) return h;
    var lista = document.querySelectorAll('header,.hdr,.header,.topbar,.top-bar,.app-header');
    for (var i = 0; i < lista.length; i++){
      var r = lista[i].getBoundingClientRect();
      if (r.height > 0 && r.top < 90 && !lista[i].closest('#zmf-panel')) return lista[i];
    }
    return null;
  }
  function ultPrecisaMover(el){
    if (!el.getClientRects().length) return true;               // escondido por um "pai"
    var r = el.getBoundingClientRect();
    if (r.right > window.innerWidth + 1 || r.left < -1) return true; // fora do ecrã
    for (var a = el.parentElement; a && a !== document.body; a = a.parentElement){
      if (getComputedStyle(a).position === 'fixed' && a.getBoundingClientRect().top > window.innerHeight / 2) return true; // barra fixa no fundo
    }
    return false;
  }
  function ultReposicionar(){
    var el = document.getElementById('last-saved-status');
    if (!el) return;
    var slot = document.getElementById('zelo-ult-slot');
    var estreito = window.innerWidth <= ULT_LARGURA;
    if (el.style.display === 'none') { if (slot && slot.contains(el)) slot.style.display = 'none'; return; }
    if (slot && slot.contains(el)){
      // Ecrã largo e só tinha saído do sítio por causa do telemóvel: volta.
      if (!estreito && ultOrigem && ultOrigem.motivo === 'movel'){
        ultOrigem.pai.insertBefore(el, ultOrigem.seguinte && ultOrigem.seguinte.parentNode === ultOrigem.pai ? ultOrigem.seguinte : null);
        slot.style.display = 'none';
        return;
      }
      slot.style.display = ''; ultLargura(slot); return;
    }
    // Ecrã largo: só sai do sítio se a própria página o estiver a esconder.
    var escondido = !el.getClientRects().length;
    if (!estreito && !escondido) return;
    if (!ultPrecisaMover(el)) return;
    var h = ultCabecalho(el);
    if (!h || !h.parentNode) return;
    if (!slot){ slot = document.createElement('div'); slot.id = 'zelo-ult-slot'; }
    // Cabeçalho fixo: a faixa vai para o início do conteúdo (logo abaixo dele).
    var pos = getComputedStyle(h).position;
    if (pos === 'fixed' || pos === 'sticky'){
      // Primeiro bloco de conteúdo logo abaixo do cabeçalho: a faixa entra no
      // início dele (dentro do espaço que já deixa para o cabeçalho).
      var fundo = h.getBoundingClientRect().bottom, alvo = null;
      var sy = window.scrollY; window.scrollTo(0, 0);
      var px = window.innerWidth / 2, py = Math.min(window.innerHeight - 5, fundo + 30);
      var pt = document.elementFromPoint(px, py);
      while (pt && pt.parentElement && pt.parentElement !== document.body && !pt.parentElement.contains(h)) pt = pt.parentElement;
      if (pt && pt !== h && !pt.contains(h) && !h.contains(pt) && pt !== document.body && pt !== document.documentElement) alvo = pt;
      // Contentor em linhas (flex/grelha): desce até ao bloco onde está o conteúdo.
      function emLinha(e){ var c = getComputedStyle(e); return c.display.indexOf('grid') >= 0 || (c.display.indexOf('flex') >= 0 && c.flexDirection.indexOf('column') < 0); }
      for (var g = 0; alvo && emLinha(alvo) && g < 6; g++){
        var prox = null;
        for (var k = 0; k < alvo.children.length; k++){
          var rc = alvo.children[k].getBoundingClientRect();
          if (rc.left <= px && rc.right >= px && rc.bottom > fundo){ prox = alvo.children[k]; break; }
        }
        alvo = prox;
      }
      window.scrollTo(0, sy);
      slot.style.marginTop = '';
      if (alvo) alvo.insertBefore(slot, alvo.firstChild);
      else h.parentNode.insertBefore(slot, h.nextSibling);
    } else {
      slot.style.marginTop = '';
      h.parentNode.insertBefore(slot, h.nextSibling);
    }
    ultOrigem = { pai: el.parentNode, seguinte: el.nextSibling, motivo: escondido ? 'oculto' : 'movel' };
    slot.style.display = '';
    slot.appendChild(el);
    ultLargura(slot);
    // Nunca fica por baixo de um cabeçalho fixo (seria tapada por ele).
    if (pos === 'fixed'){
      var topoAbs = slot.getBoundingClientRect().top + window.scrollY;
      var fundoCab = h.getBoundingClientRect().bottom;
      if (topoAbs < fundoCab + 2) slot.style.marginTop = Math.ceil(fundoCab - topoAbs + 4) + 'px';
    }
  }
  // A faixa ocupa só a parte visível do ecrã (há páginas mais largas do que
  // o ecrã), para a etiqueta ficar centrada à vista.
  function ultLargura(slot){
    slot.style.width = '';
    var r = slot.getBoundingClientRect();
    var visivel = window.innerWidth - Math.max(0, r.left + window.scrollX);
    if (r.width > visivel + 1) slot.style.width = Math.max(220, visivel) + 'px';
  }
  function ultIniciar(){
    var el = document.getElementById('last-saved-status');
    if (!el) return;
    ultReposicionar();
    try{ new MutationObserver(ultReposicionar).observe(el, { attributes: true, attributeFilter: ['style'] }); }catch(e){}
    window.addEventListener('resize', function(){ clearTimeout(ultIniciar._t); ultIniciar._t = setTimeout(ultReposicionar, 150); });
    [800, 2500, 6000].forEach(function(ms){ setTimeout(ultReposicionar, ms); });
  }

  // zelo_ultima_alteracao.js cria a etiqueta mais tarde nalgumas páginas.
  window.zeloUltIniciar = function(){ limparPrefixoUltimaAlteracao(); ultIniciar(); };
  function iniciar(){
    limparPrefixoUltimaAlteracao();
    ultIniciar();
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
