/* Armazenamento que não perde dados.
   Cada gravação vai para o localStorage (rápido, síncrono) E para o IndexedDB
   (mais robusto e com mais espaço). Ao abrir, a app lê o localStorage e depois
   confere a cópia do IndexedDB: se o localStorage foi apagado ou ficou mais
   antigo, recupera-se a cópia. Guarda-se também uma cópia por dia (últimos 14
   dias) para poder voltar atrás. */
(function () {
  "use strict";
  const BD = "ccna-passo-a-passo", VERSAO = 1;
  const memoria = {};
  let bdPromessa = null;

  function abrir() {
    if (bdPromessa) return bdPromessa;
    bdPromessa = new Promise((ok, falha) => {
      try {
        if (!window.indexedDB) return falha(new Error("sem IndexedDB"));
        const r = indexedDB.open(BD, VERSAO);
        r.onupgradeneeded = () => {
          const db = r.result;
          if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv");
          if (!db.objectStoreNames.contains("copias")) db.createObjectStore("copias");
        };
        r.onsuccess = () => ok(r.result);
        r.onerror = () => falha(r.error);
        r.onblocked = () => falha(new Error("IndexedDB bloqueado"));
      } catch (e) { falha(e); }
    }).catch((e) => { bdPromessa = null; throw e; });
    return bdPromessa;
  }
  function pedido(loja, modo, fn) {
    return abrir().then((db) => new Promise((ok, falha) => {
      const tx = db.transaction(loja, modo), st = tx.objectStore(loja);
      const r = fn(st);
      tx.oncomplete = () => ok(r && "result" in r ? r.result : undefined);
      tx.onerror = () => falha(tx.error); tx.onabort = () => falha(tx.error);
    }));
  }

  const pendentes = {};
  let tEscrever = null;
  function escreverIDB() {
    const lote = Object.assign({}, pendentes);
    Object.keys(pendentes).forEach((k) => delete pendentes[k]);
    const dia = new Date().toISOString().slice(0, 10);
    pedido("kv", "readwrite", (st) => { Object.entries(lote).forEach(([k, v]) => st.put(v, k)); })
      .then(() => pedido("copias", "readwrite", (st) => { Object.entries(lote).forEach(([k, v]) => st.put(v, dia + "|" + k)); }))
      .then(() => limparCopias())
      .catch(() => { /* sem IndexedDB: fica o localStorage */ });
  }
  function limparCopias() {
    return pedido("copias", "readwrite", (st) => {
      const r = st.getAllKeys();
      r.onsuccess = () => {
        const dias = [...new Set(r.result.map((k) => String(k).split("|")[0]))].sort().reverse();
        const velhos = new Set(dias.slice(14));
        r.result.forEach((k) => { if (velhos.has(String(k).split("|")[0])) st.delete(k); });
      };
    });
  }

  const Armazem = {
    ler(chave) {
      try { const v = localStorage.getItem(chave); if (v != null) return v; } catch (e) { /* bloqueado */ }
      return chave in memoria ? memoria[chave] : null;
    },
    gravar(chave, texto) {
      memoria[chave] = texto;
      let ok = true;
      try { localStorage.setItem(chave, texto); } catch (e) { ok = false; }
      pendentes[chave] = { valor: texto, quando: Date.now() };
      clearTimeout(tEscrever); tEscrever = setTimeout(escreverIDB, 400);
      return ok;
    },
    // Grava já (ao fechar a página) sem esperar.
    despejar() { if (Object.keys(pendentes).length) { clearTimeout(tEscrever); escreverIDB(); } },
    // Lê a cópia do IndexedDB: { valor, quando } ou null.
    recuperar(chave) { return pedido("kv", "readonly", (st) => st.get(chave)).then((r) => r || null).catch(() => null); },
    copias(chave) {
      return pedido("copias", "readonly", (st) => st.getAllKeys()).then((ks) => ks.map(String).filter((k) => k.endsWith("|" + chave)).map((k) => k.split("|")[0]).sort().reverse()).catch(() => []);
    },
    copia(chave, dia) { return pedido("copias", "readonly", (st) => st.get(dia + "|" + chave)).then((r) => r || null).catch(() => null); },
    // Pede ao navegador para não apagar os dados quando falta espaço.
    persistir() {
      try { if (navigator.storage && navigator.storage.persist) return navigator.storage.persist().catch(() => false); } catch (e) { /* sem suporte */ }
      return Promise.resolve(false);
    },
    estado() {
      const r = { idb: false, persistente: false, usado: 0, quota: 0 };
      return abrir().then(() => { r.idb = true; }).catch(() => {})
        .then(() => navigator.storage && navigator.storage.persisted ? navigator.storage.persisted().then((p) => { r.persistente = p; }).catch(() => {}) : null)
        .then(() => navigator.storage && navigator.storage.estimate ? navigator.storage.estimate().then((e) => { r.usado = e.usage || 0; r.quota = e.quota || 0; }).catch(() => {}) : null)
        .then(() => r);
    },
  };
  window.addEventListener("pagehide", () => Armazem.despejar());
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") Armazem.despejar(); });
  window.Armazem = Armazem;
})();
