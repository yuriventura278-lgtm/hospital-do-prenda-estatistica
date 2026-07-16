// ZELO — proteção de página com sessão Firebase real (verifica módulo + item específico)
import { auth, fetchUserProfile, onAuthStateChanged, hasModuleAccess } from './zelo_auth.js';

var moduleKey = window.ZELO_MODULE || null;
var itemKey = window.ZELO_ITEM || null;
var embedded = window.self !== window.top;
var resolvido = false;

function aplicarAcesso(role, permissoes){
  resolvido = true;
  if (moduleKey && !hasModuleAccess(role, permissoes || {}, moduleKey, itemKey)) {
    showBlockedScreen();
    return;
  }
  document.documentElement.style.visibility = 'visible';
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
  aplicarAcesso(perfil.role || 'funcionario', perfil.permissoes || {});
});

window.ZeloShowBlocked = showBlockedScreen;
