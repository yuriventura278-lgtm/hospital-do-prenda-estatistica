// ZELO — proteção de página com sessão Firebase real (verifica módulo + item específico)
import { auth, fetchUserProfileOuFalhar, onAuthStateChanged, hasModuleAccess, getModuleAccessLevel, startInactivityWatch, signOut } from './zelo_auth.js';

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

function aplicarAcesso(role, permissoes, uid, offline){
  resolvido = true;
  if (moduleKey && !hasModuleAccess(role, permissoes || {}, moduleKey, itemKey)) {
    showBlockedScreen(role, permissoes);
    return;
  }
  document.documentElement.style.visibility = 'visible';
  if (offline) mostrarAvisoOffline();
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

// Lê o perfil com até 2 tentativas antes de desistir — uma leitura lenta
// (rede instável, ou uma página pesada como o Bloco Operatório a competir
// pelo processador enquanto o Firebase responde) nunca deve ser tratada
// como "conta inexistente"; só uma leitura que TERMINE com sucesso e
// confirme perfil ausente/inactivo é motivo para reencaminhar ao login.
async function _obterPerfilComRetentativa(uid, tentativas){
  var ultimoErro;
  for (var i = 0; i < tentativas; i++) {
    try { return await fetchUserProfileOuFalhar(uid); }
    catch (e) { ultimoErro = e; console.warn('ZELO: falha momentânea ao ler o perfil (tentativa ' + (i + 1) + '/' + tentativas + ')', e); }
  }
  throw ultimoErro;
}

// ── Acesso sem internet (perfil em cache) ──
// Sem isto, qualquer falha de rede ao confirmar as permissões (mesmo já
// tendo entrado antes neste aparelho) bloqueava a página inteira atrás do
// ecrã "Não foi possível confirmar a sessão" — o utilizador ficava sem
// conseguir sequer ABRIR a página, mesmo offline-first sendo o resto do
// sistema (dados locais, fila de sincronização). Guarda-se aqui, em
// localStorage (sobrevive a fechar o browser, ao contrário do
// sessionStorage), o último perfil confirmado com sucesso; se uma leitura
// nova falhar por causa da rede, usa-se este perfil para deixar entrar na
// mesma — mostrando um aviso — em vez de bloquear. Não há prazo de validade:
// o objetivo aqui é nunca impedir o acesso, e assim que a rede voltar (na
// reconfirmação periódica de startInactivityWatch, a cada 2min) o perfil
// mais recente é lido e o cache actualizado sozinho.
function _chaveCachePerfil(uid){ return 'zeloPerfilCache_' + uid; }
function _guardarPerfilCache(uid, perfil){
  try { localStorage.setItem(_chaveCachePerfil(uid), JSON.stringify({ perfil: perfil, ts: Date.now() })); }
  catch (e) {}
}
function _lerPerfilCache(uid){
  try {
    var raw = localStorage.getItem(_chaveCachePerfil(uid));
    if (!raw) return null;
    var obj = JSON.parse(raw);
    return (obj && obj.perfil) ? obj.perfil : null;
  } catch (e) { return null; }
}
function mostrarAvisoOffline(){
  if (document.getElementById('zelo-offline-banner')) return;
  var banner = document.createElement('div');
  banner.id = 'zelo-offline-banner';
  banner.textContent = '📴 Sem ligação à internet — a usar as últimas permissões guardadas neste aparelho. Os dados continuam a ser guardados aqui e sincronizam automaticamente quando a ligação voltar.';
  banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:999996;background:#334155;color:#fff;text-align:center;font-family:Inter,Arial,sans-serif;font-size:.76rem;font-weight:600;padding:8px 12px;';
  document.body.insertBefore(banner, document.body.firstChild);
}

function showSlowConnectionScreen(){
  document.documentElement.style.visibility = 'visible';
  if (document.getElementById('zelo-gate-slow')) return;
  var overlay = document.createElement('div');
  overlay.id = 'zelo-gate-slow';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:999999;background:#0D1B3E;display:flex;align-items:center;justify-content:center;padding:24px;font-family:Inter,Arial,sans-serif;';
  overlay.innerHTML =
    '<div style="max-width:420px;width:100%;background:#fff;border-radius:16px;padding:32px 28px;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.35);">' +
      '<div style="width:56px;height:56px;border-radius:50%;background:#FFFBEB;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">' +
        '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01M10.29 3.86l-8.18 14.18A2 2 0 0 0 3.82 21h16.36a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>' +
      '</div>' +
      '<div style="font-size:1.05rem;font-weight:700;color:#0D1B3E;margin-bottom:8px;">Não foi possível confirmar a sessão</div>' +
      '<div style="font-size:.88rem;color:#475569;line-height:1.5;margin-bottom:22px;">A ligação à internet está lenta ou instável — a sua conta e os seus dados de acesso continuam intactos. Tente novamente.</div>' +
      '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">' +
        '<button id="zelo-gate-retry" style="padding:11px 22px;border-radius:10px;background:#0D1B3E;color:#fff;border:none;font-weight:600;font-size:.86rem;cursor:pointer;">Tentar novamente</button>' +
        '<a href="index.html" style="display:inline-block;padding:11px 22px;border-radius:10px;background:#F1F5F9;color:#0D1B3E;text-decoration:none;font-weight:600;font-size:.86rem;">Voltar ao Início</a>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);
  document.getElementById('zelo-gate-retry').addEventListener('click', function(){ window.location.reload(); });
}

function showBlockedScreen(role, permissoes){
  document.documentElement.style.visibility = 'visible';
  // Diagnóstico temporário (visível só neste ecrã de bloqueio, não afeta o
  // resto da app): mostra exatamente o que foi lido do perfil, para se
  // conseguir confirmar rapidamente se o problema é o papel gravado na
  // conta ou as permissões do módulo, sem precisar de abrir a consola.
  console.warn('[ZELO] Acesso bloqueado — módulo:', moduleKey, '· item:', itemKey, '· papel:', role, '· permissões:', permissoes);
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:999999;background:#0D1B3E;display:flex;align-items:center;justify-content:center;padding:24px;font-family:Inter,Arial,sans-serif;';
  overlay.innerHTML =
    '<div style="max-width:420px;width:100%;background:#fff;border-radius:16px;padding:32px 28px;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.35);">' +
      '<div style="width:56px;height:56px;border-radius:50%;background:#FEF2F2;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">' +
        '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
      '</div>' +
      '<div style="font-size:1.05rem;font-weight:700;color:#0D1B3E;margin-bottom:8px;">Sem permissão de acesso</div>' +
      '<div style="font-size:.88rem;color:#475569;line-height:1.5;margin-bottom:22px;">Não tem permissão para entrar neste serviço ou página. Contacte os administradores do ZELO.</div>' +
      '<div style="font-size:.68rem;color:#94A3B8;line-height:1.5;margin-bottom:18px;padding:8px 10px;background:#F8FAFC;border-radius:8px;">Papel detetado: <strong>' + (role || '—') + '</strong> · Módulo: <strong>' + (moduleKey || '—') + '</strong>' + (itemKey ? (' · Item: <strong>' + itemKey + '</strong>') : '') + '</div>' +
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
  var perfil;
  var offline = false;
  try {
    perfil = await _obterPerfilComRetentativa(user.uid, 2);
  } catch (e) {
    if (resolvido) return;
    var cache = _lerPerfilCache(user.uid);
    if (cache) {
      console.warn('ZELO: sem ligação para confirmar o perfil — a usar o último guardado neste aparelho.', e);
      perfil = cache;
      offline = true;
    } else {
      console.error('ZELO: não foi possível ler o perfil do utilizador após várias tentativas — a sessão não foi terminada.', e);
      showSlowConnectionScreen();
      return;
    }
  }
  if (resolvido) return;
  if (!perfil || perfil.ativo === false) {
    if (embedded) { window.top.location.href = 'index.html'; return; }
    window.location.replace('index.html');
    return;
  }
  if (!offline) _guardarPerfilCache(user.uid, perfil);
  sessionStorage.setItem('zeloRole', perfil.role || 'funcionario');
  sessionStorage.setItem('zeloNome', perfil.nome || user.email);
  sessionStorage.setItem('zeloEmail', user.email || '');
  sessionStorage.setItem('zeloPermissoes', JSON.stringify(perfil.permissoes || {}));
  aplicarAcesso(perfil.role || 'funcionario', perfil.permissoes || {}, user.uid, offline);
});

window.ZeloShowBlocked = showBlockedScreen;
