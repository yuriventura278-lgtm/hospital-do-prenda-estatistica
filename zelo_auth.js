// ── ZELO — Autenticação partilhada (Firebase Authentication) ──
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, sendPasswordResetEmail,
  onAuthStateChanged, setPersistence, browserLocalPersistence, browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getDatabase, ref, get, set, update, remove, onValue
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

const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 minutos sem interação

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

function startInactivityWatch(onTimeout) {
  let timer;
  function reset() { clearTimeout(timer); timer = setTimeout(onTimeout, INACTIVITY_LIMIT_MS); }
  ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, reset, { passive: true });
  });
  reset();
  return () => clearTimeout(timer);
}

async function logAuditEvent(uid, email, action, extra) {
  try {
    const key = Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    await set(ref(db, 'audit_log/' + key), {
      uid: uid || null,
      email: email || null,
      action,
      ts: Date.now(),
      dataHora: new Date().toISOString(),
      ...(extra || {})
    });
  } catch (e) {
    console.warn('ZELO auth: falha ao registar auditoria (não bloqueante)', e);
  }
}

export {
  app, auth, db, ref, get, set, update, remove, onValue,
  signInWithEmailAndPassword, signOut, sendPasswordResetEmail,
  onAuthStateChanged, setPersistence, browserLocalPersistence, browserSessionPersistence,
  fetchUserProfile, isFirstAdminNeeded, startInactivityWatch, logAuditEvent
};

window.ZeloAuth = {
  app, auth, db, ref, get, set, update, remove, onValue,
  signInWithEmailAndPassword, signOut, sendPasswordResetEmail,
  onAuthStateChanged, setPersistence, browserLocalPersistence, browserSessionPersistence,
  fetchUserProfile, isFirstAdminNeeded, startInactivityWatch, logAuditEvent
};
