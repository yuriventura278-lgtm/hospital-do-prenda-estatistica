// ── ZELO — Feedback visual do botão Guardar (partilhado) ──
// Reproduz, em qualquer página, o mesmo comportamento já usado no Bloco
// Operatório: ao gravar com sucesso, o botão de Guardar pisca a verde por
// instantes (com o ícone a mudar para um visto) e aparece um aviso no canto
// com uma barra a esgotar o tempo — em vez de cada módulo reinventar este
// efeito, ou de ficar só com um "toast" de texto simples.
(function () {
  if (window.zeloFlashSaveButton) return; // já carregado nesta página

  var style = document.createElement('style');
  style.textContent = `
    @keyframes zeloSaveFlashPulse{0%{transform:scale(1);}35%{transform:scale(1.045);}100%{transform:scale(1);}}
    .zelo-save-flash{animation:zeloSaveFlashPulse .5s ease;box-shadow:0 4px 18px rgba(20,158,108,.45) !important;}
    #zelo-toast-stack{position:fixed;top:20px;right:20px;z-index:2147483600;display:flex;flex-direction:column-reverse;gap:8px;pointer-events:none;}
    #zelo-toast-stack .zt{
      display:flex;align-items:flex-start;gap:10px;padding:11px 14px 8px;border-radius:10px;
      background:#fff;border:1px solid rgba(0,0,0,.08);box-shadow:0 4px 20px rgba(0,0,0,.14);
      overflow:hidden;position:relative;min-width:220px;max-width:320px;pointer-events:all;cursor:pointer;
      animation:zeloToastIn .22s ease;font-family:Inter,Arial,sans-serif;
    }
    @keyframes zeloToastIn{from{opacity:0;transform:translateX(28px)}to{opacity:1;transform:translateX(0)}}
    #zelo-toast-stack .zt-icon{font-size:17px;line-height:1;flex-shrink:0;margin-top:1px;}
    #zelo-toast-stack .zt-title{font-size:12px;font-weight:700;line-height:1.2;color:#2154D9;}
    #zelo-toast-stack .zt-msg{font-size:11px;font-weight:400;color:#6B7280;margin-top:2px;line-height:1.3;}
    #zelo-toast-stack .zt-bar{position:absolute;bottom:0;left:0;height:3px;background:#2154D9;border-radius:0 0 10px 10px;animation:zeloToastBar var(--zt-dur,3000ms) linear forwards;}
    @keyframes zeloToastBar{from{width:100%}to{width:0%}}
    html[data-zelo-theme="dark"] #zelo-toast-stack .zt{background:#111A2E;border-color:#1E293B;}
    html[data-zelo-theme="dark"] #zelo-toast-stack .zt-msg{color:#94A3B8;}
  `;
  document.head.appendChild(style);

  var ICON_CHECK = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

  // Faz um botão (ex. "Guardar") piscar a verde com um visto por instantes e
  // depois voltar ao normal — igual ao botão principal do Bloco Operatório.
  // btn: elemento ou seletor CSS. Se o botão tiver um <svg> e um elemento de
  // texto próprios, são trocados temporariamente; senão só a cor pisca.
  window.zeloFlashSaveButton = function (btn, opts) {
    opts = opts || {};
    if (typeof btn === 'string') btn = document.querySelector(btn);
    if (!btn) return;
    if (btn._zeloFlashTimer) clearTimeout(btn._zeloFlashTimer);

    var icon = btn.querySelector('svg');
    var textoOrig = null, noSpanTexto = null;
    // Se o botão tiver um ou mais <span>, o rótulo é sempre o último (o ícone,
    // quando também é um <span> em vez de <svg>, vem sempre antes do texto).
    var spans = btn.querySelectorAll('span:not(.zelo-theme-header-icon)');
    noSpanTexto = spans.length ? spans[spans.length - 1] : null;
    var origBg = btn.style.background;
    var origIconHtml = icon ? icon.outerHTML : null;

    if (icon) icon.outerHTML = ICON_CHECK.replace('<svg ', '<svg class="' + (icon.getAttribute('class') || '') + '" ');
    if (noSpanTexto) { textoOrig = noSpanTexto.textContent; noSpanTexto.textContent = opts.textoOk || 'Guardado!'; }

    btn.classList.add('zelo-save-flash');
    btn.style.background = '#149e6c';

    btn._zeloFlashTimer = setTimeout(function () {
      var iconAgora = btn.querySelector('svg');
      if (iconAgora && origIconHtml) iconAgora.outerHTML = origIconHtml;
      if (noSpanTexto && textoOrig !== null) noSpanTexto.textContent = textoOrig;
      btn.classList.remove('zelo-save-flash');
      btn.style.background = origBg;
    }, opts.duracao || 1800);
  };

  // Mostra um aviso no canto (título + mensagem + barra a esgotar o tempo),
  // sem depender do sistema de toast que cada página já possa ter.
  window.zeloSavedToast = function (mensagem, opts) {
    opts = opts || {};
    var dur = opts.duracao || 3000;
    var stack = document.getElementById('zelo-toast-stack');
    if (!stack) { stack = document.createElement('div'); stack.id = 'zelo-toast-stack'; document.body.appendChild(stack); }
    var existentes = stack.querySelectorAll('.zt');
    if (existentes.length >= 4) existentes[existentes.length - 1].remove();
    var el = document.createElement('div');
    el.className = 'zt';
    el.style.setProperty('--zt-dur', dur + 'ms');
    el.innerHTML = '<span class="zt-icon">' + (opts.icone || '💾') + '</span>' +
      '<div><div class="zt-title">' + (opts.titulo || 'Guardado') + '</div><div class="zt-msg">' + mensagem + '</div></div>' +
      '<div class="zt-bar"></div>';
    el.addEventListener('click', function () { remover(); });
    stack.prepend(el);
    var removido = false;
    function remover() {
      if (removido) return; removido = true;
      el.style.transition = 'opacity .2s ease'; el.style.opacity = '0';
      setTimeout(function () { el.remove(); }, 200);
    }
    setTimeout(remover, dur + 200);
  };

  // Atalho: faz as duas coisas de uma vez, como no Bloco Operatório.
  window.zeloGuardarComFeedback = function (btn, mensagem, opts) {
    window.zeloFlashSaveButton(btn, opts);
    window.zeloSavedToast(mensagem, opts);
  };
})();
