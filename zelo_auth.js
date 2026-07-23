// ── ZELO — Autenticação partilhada (Firebase Authentication) ──
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, sendPasswordResetEmail,
  onAuthStateChanged, setPersistence, browserLocalPersistence, browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getDatabase, ref, get, set, update, remove, onValue, query, orderByChild, limitToLast
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyB72sUTmo7x1gOiNQfn112Na2MvX82kZ4E",
  authDomain: "hospital-do-prenda-1de35.firebaseapp.com",
  databaseURL: "https://hospital-do-prenda-1de35-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "hospital-do-prenda-1de35",
  storageBucket: "hospital-do-prenda-1de35.firebasestorage.app",
  messagingSenderId: "991683012968",
  appId: "1:991683012968:web:f86ae42cd1cbe8bc71cedd"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const INACTIVITY_WARNING_MS = 13 * 60 * 1000; // 13 minutos — mostra aviso de expiração
const INACTIVITY_LIMIT_MS = 15 * 60 * 1000; // 15 minutos sem interação — logout automático
const MAX_SESSION_MS = 8 * 60 * 60 * 1000; // 8 horas — sessão máxima mesmo com atividade contínua (fim de turno)
const REVALIDATE_INTERVAL_MS = 2 * 60 * 1000; // 2 minutos — reconfirma em segundo plano que a conta continua activa

// Numa ligação muito lenta ou instável, get() pode ficar pendente por muito
// tempo (o SDK do Firebase não desiste sozinho). Sem um limite aqui, uma
// sessão já existente podia ficar "a carregar dados" indefinidamente e só
// resolver (com sucesso ou falha) muitos segundos depois — já com o
// formulário de login visível por causa da rede de segurança do ecrã de
// login — trocando de repente todo o ecrã a meio de o utilizador escrever.
// Com um limite, a falha/sucesso acontece sempre dentro de um tempo previsível.
const FETCH_PERFIL_TIMEOUT_MS = 10000;

async function fetchUserProfile(uid) {
  try {
    const snap = await Promise.race([
      get(ref(db, 'users/' + uid)),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), FETCH_PERFIL_TIMEOUT_MS))
    ]);
    return snap.exists() ? snap.val() : null;
  } catch (e) {
    console.error('ZELO auth: falha ao ler perfil do utilizador (ou tempo excedido)', e);
    return null;
  }
}

async function isFirstAdminNeeded() {
  try {
    const snap = await get(ref(db, 'users'));
    return !snap.exists();
  } catch (e) {
    console.error('ZELO auth: falha ao verificar utilizadores existentes', e);
    return false;
  }
}

function removeInactivityModal() {
  const el = document.getElementById('zeloInactModal');
  if (el) el.remove();
}

/** Cria (se ainda não existir) e mostra o aviso de sessão prestes a expirar.
 *  onContinuar é chamado ao clicar em "Continuar sessão", para reiniciar a contagem. */
function showInactivityModal(onContinuar) {
  removeInactivityModal();
  const overlay = document.createElement('div');
  overlay.id = 'zeloInactModal';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483600;background:rgba(13,27,62,.55);'
    + 'backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px;'
    + 'font-family:Inter,Arial,sans-serif;';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:16px;max-width:380px;width:100%;padding:28px 26px;box-shadow:0 20px 60px rgba(0,0,0,.35);text-align:center;">
      <div style="width:52px;height:52px;border-radius:50%;background:#FFFBEB;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </div>
      <div style="font-size:1.02rem;font-weight:800;color:#0F172A;margin-bottom:8px;">Sessão prestes a expirar</div>
      <p style="font-size:.85rem;color:#475569;line-height:1.55;margin:0 0 22px;">A sua sessão irá expirar em 2 minutos por inatividade. Deseja continuar?</p>
      <button type="button" id="zeloInactContinuar" style="width:100%;background:#1A56DB;color:#fff;border:none;border-radius:10px;padding:13px;font-size:.92rem;font-weight:700;cursor:pointer;font-family:inherit;">Continuar</button>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById('zeloInactContinuar').addEventListener('click', function () {
    removeInactivityModal();
    onContinuar();
  });
}

/** Instante em que a sessão actual começou, persistido em sessionStorage para
 *  sobreviver a um simples refresh da página (mas não a fechar o separador —
 *  fechar o separador já termina a sessão por si só). Só é gravado uma vez. */
function marcarInicioSessao() {
  try {
    if (!sessionStorage.getItem('zeloLoginAt')) {
      sessionStorage.setItem('zeloLoginAt', String(Date.now()));
    }
    return parseInt(sessionStorage.getItem('zeloLoginAt'), 10) || Date.now();
  } catch (e) {
    return Date.now();
  }
}

/** Vigia inactividade global (rato, teclado, scroll, toque). Aos 13 minutos mostra um
 *  aviso com opção de continuar; sem resposta, aos 15 minutos chama onTimeout (logout).
 *  Uma vez mostrado o aviso, só o botão "Continuar" reinicia a contagem — actividade
 *  geral na página por trás do aviso não o dispensa sozinha.
 *
 *  Também aplica dois limites adicionais recomendados para sistemas hospitalares:
 *  - Sessão máxima de 8h, mesmo com atividade contínua (fim de turno).
 *  - Reconfirmação periódica (a cada 2min) de que a conta continua activa — para o
 *    caso de um administrador desactivar o utilizador enquanto a sessão está aberta.
 *  - Ao voltar a ficar visível (ecrã bloqueado, separador em segundo plano,
 *    computador em suspensão), recalcula a inactividade pelo tempo real decorrido
 *    em vez de confiar apenas no temporizador, que pode atrasar-se nesses casos. */
function startInactivityWatch(onTimeout, uid) {
  let warnTimer, logoutTimer, avisoMostrado = false, lastActivityAt = Date.now();
  const loginAt = marcarInicioSessao();

  function limparTimers() { clearTimeout(warnTimer); clearTimeout(logoutTimer); }

  function agendar() {
    limparTimers();
    avisoMostrado = false;
    lastActivityAt = Date.now();
    removeInactivityModal();
    warnTimer = setTimeout(function () {
      avisoMostrado = true;
      showInactivityModal(agendar);
    }, INACTIVITY_WARNING_MS);
    logoutTimer = setTimeout(function () {
      removeInactivityModal();
      onTimeout();
    }, INACTIVITY_LIMIT_MS);
  }

  function reset() {
    if (avisoMostrado) return; // só o botão "Continuar" do aviso reinicia a partir daqui
    agendar();
  }

  ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, reset, { passive: true });
  });

  const revalidateTimer = setInterval(async function () {
    if (Date.now() - loginAt >= MAX_SESSION_MS) {
      clearInterval(revalidateTimer);
      removeInactivityModal();
      onTimeout();
      return;
    }
    if (uid) {
      const perfil = await fetchUserProfile(uid);
      if (!perfil || perfil.ativo === false) {
        clearInterval(revalidateTimer);
        removeInactivityModal();
        onTimeout();
      }
    }
  }, REVALIDATE_INTERVAL_MS);

  function aoFicarVisivel() {
    if (document.visibilityState !== 'visible') return;
    if (Date.now() - loginAt >= MAX_SESSION_MS) { removeInactivityModal(); onTimeout(); return; }
    const inactivoMs = Date.now() - lastActivityAt;
    if (inactivoMs >= INACTIVITY_LIMIT_MS) { removeInactivityModal(); onTimeout(); }
    else if (inactivoMs >= INACTIVITY_WARNING_MS && !avisoMostrado) { avisoMostrado = true; showInactivityModal(agendar); }
  }
  document.addEventListener('visibilitychange', aoFicarVisivel);

  agendar();
  return function stop() {
    limparTimers();
    clearInterval(revalidateTimer);
    document.removeEventListener('visibilitychange', aoFicarVisivel);
    removeInactivityModal();
    try { sessionStorage.removeItem('zeloLoginAt'); } catch (e) {}
  };
}

async function logAuditEvent(uid, email, action, extra) {
  try {
    const key = Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const payload = {
      uid: uid || null,
      email: email || null,
      action,
      ts: Date.now(),
      dataHora: new Date().toISOString(),
      ...(extra || {})
    };
    await set(ref(db, 'audit_log/' + key), payload);
    if (uid) {
      set(ref(db, 'user_activity/' + uid + '/' + key), payload).catch(() => {});
    }
  } catch (e) {
    console.warn('ZELO auth: falha ao registar auditoria (não bloqueante)', e);
  }
}

async function touchLastAccess(uid) {
  try { await update(ref(db, 'users/' + uid), { ultimoAcesso: Date.now() }); }
  catch (e) { /* não bloqueante */ }
}

const LOCKOUT_MAX = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutos

function emailKey(email) {
  return (email || '').trim().toLowerCase().replace(/[.#$/\[\]]/g, '_');
}

async function checkLoginLockout(email) {
  try {
    const snap = await get(ref(db, 'login_attempts/' + emailKey(email)));
    if (!snap.exists()) return { blocked: false };
    const data = snap.val();
    const dentroDaJanela = (Date.now() - (data.firstAttempt || 0)) < LOCKOUT_WINDOW_MS;
    if (dentroDaJanela && (data.count || 0) >= LOCKOUT_MAX) {
      const remainingMs = LOCKOUT_WINDOW_MS - (Date.now() - data.lastAttempt);
      return { blocked: true, remainingMinutes: Math.max(1, Math.ceil(remainingMs / 60000)) };
    }
    return { blocked: false };
  } catch (e) {
    console.warn('ZELO auth: falha ao verificar bloqueio de tentativas', e);
    return { blocked: false };
  }
}

async function registerFailedLogin(email) {
  try {
    const key = emailKey(email);
    const r = ref(db, 'login_attempts/' + key);
    const snap = await get(r);
    const now = Date.now();
    let count = 1, firstAttempt = now;
    if (snap.exists()) {
      const data = snap.val();
      if ((now - (data.firstAttempt || 0)) < LOCKOUT_WINDOW_MS) {
        count = (data.count || 0) + 1;
        firstAttempt = data.firstAttempt;
      }
    }
    await set(r, { count, firstAttempt, lastAttempt: now });
    return count;
  } catch (e) {
    console.warn('ZELO auth: falha ao registar tentativa falhada', e);
    return 0;
  }
}

async function clearLoginAttempts(email) {
  try { await remove(ref(db, 'login_attempts/' + emailKey(email))); }
  catch (e) { /* não bloqueante */ }
}

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Verifica acesso a um módulo (ou a um item específico dentro dele).
// Acesso por omissão de cada perfil aos módulos, usado apenas quando o
// utilizador não tem uma permissão explícita configurada (em Permissões, no
// admin_utilizadores.html) para esse módulo — uma permissão explícita
// continua sempre a ganhar a este valor por omissão.
// Módulos existentes: estatistica, informacoes_zelo, movimento_mensal,
// procedimentos_enfermagem, servicos, sistemas_independentes.
const ROLE_DEFAULT_PERMISSOES = {
  direcao:          { estatistica:'leitura', servicos:'leitura', procedimentos_enfermagem:'leitura', movimento_mensal:'leitura', sistemas_independentes:'leitura', informacoes_zelo:true },
  supervisor:       { estatistica:'leitura', servicos:'leitura', procedimentos_enfermagem:'leitura', movimento_mensal:'leitura', sistemas_independentes:'leitura', informacoes_zelo:true },
  chefe_servico:    { estatistica:'leitura', servicos:true, procedimentos_enfermagem:true, movimento_mensal:'leitura', sistemas_independentes:'leitura', informacoes_zelo:true },
  enfermeiro_chefe: { estatistica:'leitura', servicos:true, procedimentos_enfermagem:true, movimento_mensal:false, sistemas_independentes:'leitura', informacoes_zelo:true },
  medico:           { estatistica:false, servicos:true, procedimentos_enfermagem:'leitura', movimento_mensal:false, sistemas_independentes:'leitura', informacoes_zelo:true },
  enfermeiro:       { estatistica:false, servicos:true, procedimentos_enfermagem:true, movimento_mensal:false, sistemas_independentes:false, informacoes_zelo:true },
  tdt:              { estatistica:false, servicos:false, procedimentos_enfermagem:false, movimento_mensal:false, sistemas_independentes:true, informacoes_zelo:true },
  secretario:       { estatistica:false, servicos:'leitura', procedimentos_enfermagem:false, movimento_mensal:true, sistemas_independentes:false, informacoes_zelo:true },
  funcionario:      { estatistica:true, servicos:true, procedimentos_enfermagem:true, movimento_mensal:true, sistemas_independentes:true, informacoes_zelo:true },
};

function roleDefaultPermForModule(role, mod) {
  const tabela = ROLE_DEFAULT_PERMISSOES[role] || ROLE_DEFAULT_PERMISSOES.funcionario;
  return tabela[mod];
}

// permissoes[mod] pode ser: ausente (usa a omissão do perfil, ver acima)/
// true/'editar'/'leitura' = módulo acessível; false = módulo todo bloqueado;
// objeto {itemSlug: false, ..., _nivel?: 'leitura'} = bloqueio item a item
// (ausência no objeto = permitido), com nível opcional (por omissão 'editar').
function hasModuleAccess(role, permissoes, mod, itemSlug) {
  if (role === 'admin') return true;
  let modPerm = permissoes ? permissoes[mod] : undefined;
  if (modPerm === undefined) modPerm = roleDefaultPermForModule(role, mod);
  if (modPerm === false) return false;
  if (modPerm === true || modPerm === undefined || modPerm === null || modPerm === 'editar' || modPerm === 'leitura') return true;
  if (typeof modPerm === 'object') {
    if (!itemSlug) return true;
    return modPerm[itemSlug] !== false;
  }
  return true;
}

// Devolve o nível de acesso ('editar' ou 'leitura') a um módulo já autorizado.
// Administradores têm sempre nível 'editar'.
function getModuleAccessLevel(role, permissoes, mod) {
  if (role === 'admin') return 'editar';
  let modPerm = permissoes ? permissoes[mod] : undefined;
  if (modPerm === undefined) modPerm = roleDefaultPermForModule(role, mod);
  if (modPerm === 'leitura') return 'leitura';
  if (modPerm && typeof modPerm === 'object' && modPerm._nivel === 'leitura') return 'leitura';
  return 'editar';
}

export {
  app, auth, db, ref, get, set, update, remove, onValue, query, orderByChild, limitToLast,
  signInWithEmailAndPassword, signOut, sendPasswordResetEmail,
  onAuthStateChanged, setPersistence, browserLocalPersistence, browserSessionPersistence,
  fetchUserProfile, isFirstAdminNeeded, startInactivityWatch, logAuditEvent,
  checkLoginLockout, registerFailedLogin, clearLoginAttempts, touchLastAccess, escapeHtml,
  hasModuleAccess, getModuleAccessLevel, ROLE_DEFAULT_PERMISSOES
};

window.ZeloAuth = {
  app, auth, db, ref, get, set, update, remove, onValue, query, orderByChild, limitToLast,
  signInWithEmailAndPassword, signOut, sendPasswordResetEmail,
  onAuthStateChanged, setPersistence, browserLocalPersistence, browserSessionPersistence,
  fetchUserProfile, isFirstAdminNeeded, startInactivityWatch, logAuditEvent,
  checkLoginLockout, registerFailedLogin, clearLoginAttempts, touchLastAccess, escapeHtml,
  hasModuleAccess, getModuleAccessLevel, ROLE_DEFAULT_PERMISSOES
};
