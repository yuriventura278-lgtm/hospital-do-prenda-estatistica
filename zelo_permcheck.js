// ZELO — verificação de acesso ao módulo (baseada na sessão já autenticada)
(function () {
  var scriptEl = document.currentScript;
  var moduleKey = scriptEl ? scriptEl.getAttribute('data-module') : null;
  var role = sessionStorage.getItem('zeloRole');

  if (!role) {
    window.location.replace('index.html');
    return;
  }
  if (role === 'admin') return;

  var permissoes = {};
  try { permissoes = JSON.parse(sessionStorage.getItem('zeloPermissoes') || '{}'); } catch (e) {}

  if (moduleKey && permissoes[moduleKey] === false) {
    window.location.replace('index.html');
  }
})();
