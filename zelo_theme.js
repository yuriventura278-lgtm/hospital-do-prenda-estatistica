// ── ZELO — Tema claro/escuro ──
// Funciona em qualquer página do sistema sem precisar de tocar no CSS de
// cada uma: em vez de reescrever as cores de cada painel/badge/formulário
// (impraticável em ~65 páginas com estilos próprios), inverte a luminosidade
// da página inteira e depois reverte imagens/fotos para não ficarem como
// "negativos". O resultado é um modo escuro consistente em todo o sistema,
// com um único ficheiro partilhado.
(function () {
  var STORAGE_KEY = 'zeloTema';

  var style = document.createElement('style');
  style.textContent = `
    html{transition:filter .25s ease;}
    html[data-zelo-theme="dark"]{filter:invert(1) hue-rotate(180deg);background:#fff;}
    html[data-zelo-theme="dark"] img,
    html[data-zelo-theme="dark"] video,
    html[data-zelo-theme="dark"] iframe,
    html[data-zelo-theme="dark"] canvas{filter:invert(1) hue-rotate(180deg);}
    .zelo-theme-btn{
      position:fixed;bottom:18px;right:18px;z-index:2147483000;
      width:46px;height:46px;border-radius:50%;border:1.5px solid rgba(255,255,255,.18);
      background:#0D1B3E;color:#fff;display:flex;align-items:center;justify-content:center;
      cursor:pointer;box-shadow:0 8px 24px rgba(13,27,62,.35);font-size:1.15rem;
      font-family:Inter,Arial,sans-serif;line-height:1;padding:0;
    }
    .zelo-theme-btn:active{transform:scale(.94);}
    html[data-zelo-theme="dark"] .zelo-theme-btn{filter:invert(1) hue-rotate(180deg);}
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

  var guardado = localStorage.getItem(STORAGE_KEY) || 'light';
  aplicarTema(guardado);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { criarBotao(); aplicarTema(guardado); });
  } else {
    criarBotao();
  }
})();
