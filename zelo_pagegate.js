// ZELO — proteção de página com sessão Firebase real (verifica módulo + item específico)
import { auth, fetchUserProfile, onAuthStateChanged, hasModuleAccess, getModuleAccessLevel, startInactivityWatch, signOut } from './zelo_auth.js';

var moduleKey = window.ZELO_MODULE || null;
var itemKey = window.ZELO_ITEM || null;
var embedded = window.self !== window.top;
var resolvido = false;
var stopInactivityWatch = null;

// Bloqueia a edição da página inteira quando o utilizador só tem permissão de leitura
// naquele módulo — evita ter de alterar cada página de banco/procedimento uma a uma.
function aplicarModoLeitura(){
  function bloquear(){
    var banner = document.createElement('div');
    banner.textContent = '🔒 Modo só de leitura — não é possível guardar alterações neste módulo.';
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:999997;background:#92400E;color:#fff;text-align:center;font-family:Inter,Arial,sans-serif;font-size:.8rem;font-weight:700;padding:9px 12px;';
    document.body.insertBefore(banner, document.body.firstChild);
    // Sair (zeloLogout) nunca deve ficar bloqueado — ficar só de leitura num módulo
    // não pode impedir o utilizador de terminar a sessão.
    document.querySelectorAll('input, select, textarea, button').forEach(function(el){
      var onclick = el.getAttribute('onclick') || '';
      if (onclick.indexOf('zeloLogout') !== -1) return;
      el.disabled = true;
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bloquear);
  } else {
    bloquear();
  }
}

function aplicarAcesso(role, permissoes, uid){
  resolvido = true;
  if (moduleKey && !hasModuleAccess(role, permissoes || {}, moduleKey, itemKey)) {
    showBlockedScreen();
    return;
  }
  document.documentElement.style.visibility = 'visible';
  if (moduleKey && getModuleAccessLevel(role, permissoes || {}, moduleKey) === 'leitura') {
    aplicarModoLeitura();
  }
  // Só na sessão real desta página (não na embutida em iframe, que já depende da
  // página-mãe): vigia inatividade/sessão máxima/8h e, a cada 2min, reconfirma que a
  // conta continua activa — sem isto, estas ~50 páginas de registo (onde os
  // profissionais passam a maior parte do tempo) nunca tinham qualquer limite de
  // sessão, ao contrário do ecrã de login principal. Também reage caso o
  // administrador altere o papel/permissões enquanto a página está aberta,
  // recarregando para aplicar de imediato o novo nível de acesso.
  if (!embedded && uid && !stopInactivityWatch) {
    stopInactivityWatch = startInactivityWatch(async function(){
      try { await signOut(auth); } catch (e) {}
      window.location.replace('index.html');
    }, uid, { role: role, permissoes: permissoes || {} }, function(){
      window.location.reload();
    });
  }
  window.dispatchEvent(new CustomEvent('zelo-gate-ready', {
    detail: { role: role, permissoes: permissoes || {} }
  }));
}

// Quando esta página está embutida num iframe (ex: Dashboard.html dentro do index.html),
// a sessão do Firebase Auth por vezes não é detetada de imediato no contexto isolado do
// iframe — reencaminhar nesse caso mostrava um ecrã de login duplicado dentro do próprio
// painel. Em vez disso, esperamos que a página-mãe (já autenticada) confirme a sessão.
if (embedded) {
  window.addEventListener('message', function (ev) {
    if (ev.source !== window.parent || ev.origin !== window.location.origin) return;
    if (!ev.data || ev.data.type !== 'zelo-parent-auth' || resolvido) return;
    sessionStorage.setItem('zeloRole', ev.data.role || 'funcionario');
    sessionStorage.setItem('zeloNome', ev.data.nome || '');
    sessionStorage.setItem('zeloEmail', ev.data.email || '');
    sessionStorage.setItem('zeloPermissoes', JSON.stringify(ev.data.permissoes || {}));
    aplicarAcesso(ev.data.role || 'funcionario', ev.data.permissoes || {});
  });
  try { window.parent.postMessage({ type: 'zelo-child-ready' }, window.location.origin); } catch (e) {}
}

function showBlockedScreen(){
  document.documentElement.style.visibility = 'visible';
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:999999;background:#0D1B3E;display:flex;align-items:center;justify-content:center;padding:24px;font-family:Inter,Arial,sans-serif;';
  overlay.innerHTML =
    '<div style="max-width:420px;width:100%;background:#fff;border-radius:16px;padding:32px 28px;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.35);">' +
      '<div style="width:56px;height:56px;border-radius:50%;background:#FEF2F2;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">' +
        '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
      '</div>' +
      '<div style="font-size:1.05rem;font-weight:700;color:#0D1B3E;margin-bottom:8px;">Sem permissão de acesso</div>' +
      '<div style="font-size:.88rem;color:#475569;line-height:1.5;margin-bottom:22px;">Não tem permissão para entrar neste serviço ou página. Contacte os administradores do ZELO.</div>' +
      '<a href="index.html" style="display:inline-block;padding:11px 22px;border-radius:10px;background:#0D1B3E;color:#fff;text-decoration:none;font-weight:600;font-size:.86rem;">Voltar ao Início</a>' +
    '</div>';
  document.body.appendChild(overlay);
}

onAuthStateChanged(auth, async function (user) {
  if (resolvido) return;
  if (!user) {
    if (embedded) {
      // Dá tempo à página-mãe para responder com 'zelo-parent-auth' antes de desistir.
      setTimeout(function () { if (!resolvido) window.top.location.href = 'index.html'; }, 4000);
      return;
    }
    window.location.replace('index.html');
    return;
  }
  var perfil = await fetchUserProfile(user.uid);
  if (resolvido) return;
  if (!perfil || perfil.ativo === false) {
    if (embedded) { window.top.location.href = 'index.html'; return; }
    window.location.replace('index.html');
    return;
  }
  sessionStorage.setItem('zeloRole', perfil.role || 'funcionario');
  sessionStorage.setItem('zeloNome', perfil.nome || user.email);
  sessionStorage.setItem('zeloEmail', user.email || '');
  sessionStorage.setItem('zeloPermissoes', JSON.stringify(perfil.permissoes || {}));
  aplicarAcesso(perfil.role || 'funcionario', perfil.permissoes || {}, user.uid);
});

window.ZeloShowBlocked = showBlockedScreen;
