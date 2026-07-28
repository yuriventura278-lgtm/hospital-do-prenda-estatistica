// Rede de segurança do zelo_pagegate.js — corre FORA do módulo, de propósito.
// Se o import do Firebase falhar (bloqueador de anúncios, firewall, CDN em
// baixo, falha de rede), o módulo aborta em silêncio e a página fica
// escondida (visibility:hidden) para sempre, sem qualquer aviso ao
// utilizador. Este script, por ser um <script> normal (não type="module"),
// corre sempre, mesmo quando o módulo falha, e mostra um aviso claro em vez
// de deixar o ecrã em branco.
(function () {
  var overlayEl = null;

  function remover() {
    if (overlayEl && overlayEl.parentNode) overlayEl.parentNode.removeChild(overlayEl);
    overlayEl = null;
  }

  // Em ligações lentas o SDK do Firebase (carregado via CDN gstatic.com) pode
  // demorar bem mais que o aviso inicial a responder — se isso acontecer
  // depois de já termos mostrado o ecrã de erro, remove-lo assim que a sessão
  // afinal resolver, em vez de deixar o aviso preso por cima da página já
  // carregada (era isto que fazia parecer que "não é possível entrar").
  window.addEventListener('zelo-gate-ready', remover);

  setTimeout(function () {
    function mostrar() {
      // Em ligações muito lentas o <body> pode ainda não existir aos 15s
      // (o parser ainda está bloqueado a carregar scripts do <head>) —
      // esperar que fique disponível em vez de rebentar.
      if (!document.body) { document.addEventListener('DOMContentLoaded', mostrar, { once: true }); return; }
      if (getComputedStyle(document.documentElement).visibility !== 'hidden') return;
      document.documentElement.style.visibility = 'visible';
      overlayEl = document.createElement('div');
      overlayEl.style.cssText = 'position:fixed;inset:0;z-index:999999;background:#0D1B3E;display:flex;align-items:center;justify-content:center;padding:24px;font-family:Inter,Arial,sans-serif;';
      overlayEl.innerHTML =
        '<div style="max-width:420px;width:100%;background:#fff;border-radius:16px;padding:32px 28px;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.35);">' +
          '<div style="width:56px;height:56px;border-radius:50%;background:#FFFBEB;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">' +
            '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01M10.29 3.86l-8.18 14.18A2 2 0 0 0 3.82 21h16.36a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>' +
          '</div>' +
          '<div style="font-size:1.05rem;font-weight:700;color:#0D1B3E;margin-bottom:8px;">A sessão está a demorar mais que o normal</div>' +
          '<div style="font-size:.88rem;color:#475569;line-height:1.5;margin-bottom:22px;">Isto costuma resolver-se sozinho em ligações mais lentas — esta página continua a tentar em segundo plano. Se não entrar sozinho em breve, verifique a ligação à internet e desative bloqueadores de anúncios para este site.</div>' +
          '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">' +
            '<a href="index.html" style="display:inline-block;padding:11px 22px;border-radius:10px;background:#F1F5F9;color:#0D1B3E;text-decoration:none;font-weight:600;font-size:.86rem;">Voltar ao Início</a>' +
          '</div>' +
        '</div>';
      document.body.appendChild(overlayEl);
    }
    mostrar();
  }, 15000);
})();
