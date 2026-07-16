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

async function fetchUserProfile(uid) {
  try {
    const snap = await get(ref(db, 'users/' + uid));
    return snap.exists() ? snap.val() : null;
  } catch (e) {
    console.error('ZELO auth: falha ao ler perfil do utilizador', e);
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

/** Vigia inactividade global (rato, teclado, scroll, toque). Aos 13 minutos mostra um
 *  aviso com opção de continuar; sem resposta, aos 15 minutos chama onTimeout (logout).
 *  Uma vez mostrado o aviso, só o botão "Continuar" reinicia a contagem — actividade
 *  geral na página por trás do aviso não o dispensa sozinha. */
function startInactivityWatch(onTimeout) {
  let warnTimer, logoutTimer, avisoMostrado = false;

  function limparTimers() { clearTimeout(warnTimer); clearTimeout(logoutTimer); }

  function agendar() {
    limparTimers();
    avisoMostrado = false;
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
  agendar();
  return function stop() { limparTimers(); removeInactivityModal(); };
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
// permissoes[mod] pode ser: ausente/true/'editar'/'leitura' = módulo acessível;
// false = módulo todo bloqueado;
// objeto {itemSlug: false, ..., _nivel?: 'leitura'} = bloqueio item a item
// (ausência no objeto = permitido), com nível opcional (por omissão 'editar').
function hasModuleAccess(role, permissoes, mod, itemSlug) {
  if (role === 'admin') return true;
  const modPerm = permissoes ? permissoes[mod] : undefined;
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
  const modPerm = permissoes ? permissoes[mod] : undefined;
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
  hasModuleAccess, getModuleAccessLevel
};

window.ZeloAuth = {
  app, auth, db, ref, get, set, update, remove, onValue, query, orderByChild, limitToLast,
  signInWithEmailAndPassword, signOut, sendPasswordResetEmail,
  onAuthStateChanged, setPersistence, browserLocalPersistence, browserSessionPersistence,
  fetchUserProfile, isFirstAdminNeeded, startInactivityWatch, logAuditEvent,
  checkLoginLockout, registerFailedLogin, clearLoginAttempts, touchLastAccess, escapeHtml,
  hasModuleAccess, getModuleAccessLevel
};
