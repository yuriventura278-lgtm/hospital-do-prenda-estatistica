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
      overlayEl.style.cssText = 'position:fixed;inset:0;z-index:999999;background:linear-gradient(145deg,#0E141C 0%,#16222F 45%,#2B415E 100%);display:flex;align-items:center;justify-content:center;padding:24px;font-family:Arial,sans-serif;';
      overlayEl.innerHTML =
        '<style>@keyframes zeloWatchdogSpin{0%{stroke-dashoffset:239}50%{stroke-dashoffset:55}100%{stroke-dashoffset:239}}</style>' +
        '<div style="display:flex;flex-direction:column;align-items:center;text-align:center;">' +
          '<svg width="88" height="88" style="transform:rotate(-90deg);margin-bottom:20px;">' +
            '<circle cx="44" cy="44" r="38" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="4"/>' +
            '<circle cx="44" cy="44" r="38" fill="none" stroke="url(#zeloWatchdogGrad)" stroke-width="4" stroke-linecap="round" stroke-dasharray="239" stroke-dashoffset="239" style="animation:zeloWatchdogSpin 1.8s ease-in-out infinite;"/>' +
            '<defs><linearGradient id="zeloWatchdogGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#7C9BC4"/><stop offset="100%" stop-color="#A8C0DE"/></linearGradient></defs>' +
          '</svg>' +
          '<div style="font-size:1rem;font-weight:700;color:#fff;">A carregar página…</div>' +
          '<div style="font-size:.82rem;color:rgba(199,210,232,.78);line-height:1.5;margin-top:8px;max-width:300px;">Ligação lenta — esta página continua a tentar em segundo plano.</div>' +
          '<a href="index.html" style="margin-top:22px;font-size:.76rem;color:rgba(168,192,222,.85);text-decoration:underline;">Problemas a entrar? Voltar ao Início</a>' +
        '</div>';
      document.body.appendChild(overlayEl);
    }
    mostrar();
  }, 15000);
})();
