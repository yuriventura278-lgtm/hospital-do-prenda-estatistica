// ── ZELO — Inicialização partilhada do Firebase (sincronização entre dispositivos) ──
// Antes, este bloco (configuração + initializeApp + window.__fbGet/__fbSet) estava
// copiado tal e qual em ~28 páginas HTML. Passou para aqui, num único sítio:
// qualquer alteração à configuração do Firebase faz-se agora só neste ficheiro,
// em vez de ter de se editar página a página.
//
// Comportamento e variáveis globais mantêm-se EXACTAMENTE iguais aos que as
// páginas já esperam:
//   window.__fbReady          — true se o Firebase iniciou, false se falhou/indisponível
//   window.__fbGet(path)      — lê um caminho (devolve o valor ou null)
//   window.__fbSet(path, val) — escreve um valor num caminho
// e, no fim (com sucesso ou falha), dispara os eventos 'zelo-fb-ready' e
// 'zelo-dashboard-fb-ready' — este último já era escutado pelo Dashboard.
//
// Nota: nas páginas que também carregam zelo_pagegate.js/zelo_auth.js, a app
// "default" do Firebase já foi criada por esse módulo (que corre primeiro).
// Como a configuração aqui é idêntica, initializeApp devolve essa mesma app em
// vez de a duplicar — não há conflito.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyB72sUTmo7x1gOiNQfn112Na2MvX82kZ4E",
  authDomain: "hospital-do-prenda-1de35.firebaseapp.com",
  databaseURL: "https://hospital-do-prenda-1de35-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "hospital-do-prenda-1de35",
  storageBucket: "hospital-do-prenda-1de35.firebasestorage.app",
  messagingSenderId: "991683012968",
  appId: "1:991683012968:web:f86ae42cd1cbe8bc71cedd"
};

try {
  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);
  window.__fbSet = (path, val) => set(ref(db, path), val);
  window.__fbGet = (path) => get(ref(db, path)).then(snap => snap.exists() ? snap.val() : null);
  window.__fbReady = true;
} catch (e) {
  console.warn('Firebase indisponível — a sincronização entre dispositivos fica desactivada, mas o registo local continua a funcionar normalmente.', e);
  window.__fbReady = false;
}

// Sinaliza às páginas que a inicialização terminou (o Dashboard, por exemplo,
// só carrega os indicadores depois deste evento).
window.dispatchEvent(new CustomEvent('zelo-fb-ready'));
window.dispatchEvent(new CustomEvent('zelo-dashboard-fb-ready'));
