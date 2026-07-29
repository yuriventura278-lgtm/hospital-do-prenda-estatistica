// ── ZELO — Tema claro/escuro ──
// Aplicado em todas as páginas por um único ficheiro partilhado. Em vez de
// inverter os pixels da página (efeito genérico e que quebra o azul-marinho
// da marca, que já é escuro no tema claro), redefine as mesmas variáveis de
// cor (--nv, --bl, --cy, --sf, --tx, ...) já usadas em todo o sistema, e
// escurece também os painéis/cartões que usam branco fixo.
(function () {
  var STORAGE_KEY = 'zeloTema';

  var style = document.createElement('style');
  style.textContent = `
    html{color-scheme:light;}
    html[data-zelo-theme="dark"]{color-scheme:dark;}
    :root[data-zelo-theme="dark"]{
      --bl:#3B82F6;--bl2:#60A5FA;--cy:#22D3EE;--cyl:#67E8F9;
      --blt:#1E3A5F;--blxt:#152A47;
      --gr:#34D399;--rd:#F87171;--am:#FBBF24;--or:#FB923C;--pu:#A78BFA;
      --sf:#0B1220;--br:#1E293B;--br2:#334155;
      --tx:#F1F5F9;--tx2:#CBD5E1;--tx3:#94A3B8;
      --s1:0 2px 10px rgba(0,0,0,.35);--s2:0 10px 32px rgba(0,0,0,.5);
    }
    html[data-zelo-theme="dark"] body{background:var(--sf);color:var(--tx);}
    html[data-zelo-theme="dark"] .panel,
    html[data-zelo-theme="dark"] .rc,
    html[data-zelo-theme="dark"] .st,
    html[data-zelo-theme="dark"] .ms,
    html[data-zelo-theme="dark"] .card,
    html[data-zelo-theme="dark"] table,
    html[data-zelo-theme="dark"] input,
    html[data-zelo-theme="dark"] select,
    html[data-zelo-theme="dark"] textarea{
      background:#111A2E !important;color:var(--tx) !important;border-color:var(--br) !important;
    }
    html[data-zelo-theme="dark"] input::placeholder,
    html[data-zelo-theme="dark"] textarea::placeholder{color:#64748B !important;}
    html[data-zelo-theme="dark"] th{color:var(--tx3) !important;border-color:var(--br) !important;}
    html[data-zelo-theme="dark"] td{border-color:var(--br) !important;}
    .zelo-theme-header-btn{
      display:inline-flex;align-items:center;gap:5px;flex-shrink:0;
      padding:6px 13px;border-radius:100px;cursor:pointer;white-space:nowrap;line-height:1;
      font-family:Inter,Arial,sans-serif;font-size:.68rem;font-weight:700;
      border:1px solid;background:transparent;transition:background .15s,border-color .15s,color .15s;
    }
    .zelo-theme-header-btn svg{width:12px;height:12px;flex-shrink:0;}
    .zelo-theme-header-btn.on-dark{border-color:rgba(255,255,255,.22);color:rgba(255,255,255,.85);background:rgba(255,255,255,.08);}
    .zelo-theme-header-btn.on-dark:hover{background:rgba(255,255,255,.16);border-color:rgba(255,255,255,.35);color:#fff;}
    .zelo-theme-header-btn.on-light{border-color:#E2E8F0;color:#64748B;background:transparent;}
    .zelo-theme-header-btn.on-light:hover{border-color:#1A56DB;color:#1A56DB;}
    html[data-zelo-theme="dark"] .zelo-theme-header-btn.on-light{border-color:#334155;color:#CBD5E1;}
  `;
  document.head.appendChild(style);

  var ICON_SUN = '<circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
  var ICON_MOON = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';

  function aplicarTema(tema){
    document.documentElement.setAttribute('data-zelo-theme', tema);
    var icon = tema === 'dark' ? ICON_SUN : ICON_MOON;
    document.querySelectorAll('.zelo-theme-header-icon').forEach(function(svg){ svg.innerHTML = icon; });
    document.querySelectorAll('.zelo-theme-header-btn').forEach(function(btn){
      btn.title = tema === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro';
    });
  }

  function alternarTema(){
    var atual = document.documentElement.getAttribute('data-zelo-theme') === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEY, atual);
    aplicarTema(atual);
  }
  // Exposta para os botões "Tema" já existentes no cabeçalho de algumas páginas
  // (ex. procedimentos_enfermagem_*.html) e para o botão inserido automaticamente
  // abaixo, sem cada página precisar de reimplementar o alternar de tema.
  window.zeloToggleTheme = alternarTema;

  // Escolhe o estilo (claro/escuro) do botão consoante a cor do cabeçalho onde
  // vai ser inserido — os cabeçalhos do ZELO tanto são de fundo claro (branco/
  // cinza-claro) como escuro (azul-marinho em gradiente), e um único estilo
  // fixo ficaria ilegível num dos dois casos.
  function fundoEscuro(el){
    // Sobe a árvore à procura de um fundo identificável: os cabeçalhos escuros
    // do ZELO usam quase sempre um gradiente (background-image), não uma cor
    // sólida, pelo que testar só background-color falharia em detectá-los.
    try{
      var no = el;
      for (var i = 0; no && i < 6; i++, no = no.parentElement){
        var cs = getComputedStyle(no);
        if (cs.backgroundImage && cs.backgroundImage !== 'none') return true;
        var m = cs.backgroundColor.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (m && (m[4] === undefined || +m[4] > 0.4)){
          return (0.299*(+m[1]) + 0.587*(+m[2]) + 0.114*(+m[3])) / 255 < 0.4;
        }
      }
    }catch(e){}
    // Sem fundo identificável: usar a cor do texto como última pista.
    try{
      var cor = getComputedStyle(el).color;
      var m2 = cor.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/);
      if (m2) return (0.299*(+m2[1]) + 0.587*(+m2[2]) + 0.114*(+m2[3])) / 255 > 0.6;
    }catch(e){}
    return false;
  }

  // Encontra onde inserir o botão "Tema" no cabeçalho de cada página. Em vez
  // de depender do nome exato das classes (que varia de página para página),
  // procura primeiro um grupo de ações de cabeçalho já conhecido e, na falta
  // dele, ancora-se ao lado do link "Início" — presente em praticamente todas
  // as páginas do sistema — para acabar sempre junto aos outros controlos do
  // cabeçalho, nunca solto no meio do conteúdo.
  function encontrarInsercao(){
    var grupo = document.querySelector('header .header-right, header .hdr-actions, header .header-actions, .zelo-topbar .tb-right');
    if (grupo) return { pai: grupo, depoisDe: null };
    var inicio = document.querySelector('header a[href="index.html"], .topbar a[href="index.html"], .hi a[href="index.html"], .top a[href="index.html"]');
    if (inicio && inicio.parentNode) return { pai: inicio.parentNode, depoisDe: inicio };
    var cabecalho = document.querySelector('header, .zelo-topbar, .topbar, .top');
    if (cabecalho) return { pai: cabecalho, depoisDe: null };
    return null;
  }

  function criarBotaoCabecalho(){
    // Páginas que já têm o seu próprio botão "Tema" no cabeçalho (ex. os
    // Procedimentos de Enfermagem) não precisam de um segundo.
    if (document.getElementById('theme-toggle') || document.querySelector('.zelo-theme-header-btn')) return;
    var local = encontrarInsercao();
    if (!local) return; // sem cabeçalho reconhecível (ex. ecrã de login) — não força a inserção
    var tema = document.documentElement.getAttribute('data-zelo-theme') || 'light';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'zelo-theme-header-btn ' + (fundoEscuro(local.pai) ? 'on-dark' : 'on-light');
    btn.title = tema === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro';
    btn.setAttribute('aria-label', 'Alternar tema claro/escuro');
    btn.innerHTML = '<svg class="zelo-theme-header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
      (tema === 'dark' ? ICON_SUN : ICON_MOON) + '</svg><span>Tema</span>';
    btn.addEventListener('click', alternarTema);
    if (local.depoisDe && local.depoisDe.nextSibling) local.pai.insertBefore(btn, local.depoisDe.nextSibling);
    else local.pai.appendChild(btn);
  }

  // Dentro de um iframe (ex: Dashboard.html embutido no index.html) o tema já
  // é controlado pela página-mãe — não faz sentido um segundo controlo ali
  // dentro, só o da página principal. O iframe continua a aplicar o tema
  // (para o seu próprio conteúdo ficar com as cores certas), só não mostra
  // botão próprio.
  var embedded = window.self !== window.top;

  var guardado = localStorage.getItem(STORAGE_KEY) || 'light';
  aplicarTema(guardado);

  if (!embedded) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { criarBotaoCabecalho(); aplicarTema(guardado); });
    } else {
      criarBotaoCabecalho();
    }
  }

  // Mantém os dois em sincronia: ao mudar o tema numa página, o 'storage'
  // event dispara automaticamente nas outras páginas/frames da mesma origem
  // (nunca na própria que fez a alteração), incluindo entre a página-mãe e o
  // iframe do Dashboard.
  window.addEventListener('storage', function (e) {
    if (e.key === STORAGE_KEY) aplicarTema(e.newValue || 'light');
  });
})();
