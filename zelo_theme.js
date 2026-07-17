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
    .zelo-theme-btn{
      position:fixed;bottom:18px;right:18px;z-index:2147483000;
      width:46px;height:46px;border-radius:50%;border:1.5px solid rgba(255,255,255,.18);
      background:#0D1B3E;color:#fff;display:flex;align-items:center;justify-content:center;
      cursor:pointer;box-shadow:0 8px 24px rgba(13,27,62,.35);font-size:1.15rem;
      font-family:Inter,Arial,sans-serif;line-height:1;padding:0;
    }
    .zelo-theme-btn:active{transform:scale(.94);}
  `;
  document.head.appendChild(style);

  function aplicarTema(tema){
    document.documentElement.setAttribute('data-zelo-theme', tema);
    var btn = document.getElementById('zeloThemeBtn');
    if (btn) btn.textContent = tema === 'dark' ? '☀️' : '🌙';
  }

  function alternarTema(){
    var atual = document.documentElement.getAttribute('data-zelo-theme') === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEY, atual);
    aplicarTema(atual);
  }

  function criarBotao(){
    if (document.getElementById('zeloThemeBtn')) return;
    var btn = document.createElement('button');
    btn.id = 'zeloThemeBtn';
    btn.type = 'button';
    btn.className = 'zelo-theme-btn';
    btn.title = 'Alternar tema claro/escuro';
    btn.setAttribute('aria-label', 'Alternar tema claro/escuro');
    btn.addEventListener('click', alternarTema);
    document.body.appendChild(btn);
  }

  // Dentro de um iframe (ex: Dashboard.html embutido no index.html) o tema já
  // é controlado pela página-mãe — não faz sentido um segundo botão flutuante
  // ali dentro, só o da página principal. O iframe continua a aplicar o tema
  // (para o seu próprio conteúdo ficar com as cores certas), só não mostra
  // botão próprio.
  var embedded = window.self !== window.top;

  var guardado = localStorage.getItem(STORAGE_KEY) || 'light';
  aplicarTema(guardado);

  if (!embedded) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { criarBotao(); aplicarTema(guardado); });
    } else {
      criarBotao();
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
