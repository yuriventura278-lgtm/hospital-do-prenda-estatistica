// ── ZELO — Gestor genérico de IndexedDB ──
// Ligação única reutilizável por base de dados (nunca abre/fecha repetidamente),
// operações assíncronas em lote, paginação por cursor e apoio a backup/restauro em JSON.
// Usado pelas páginas que guardam dados localmente para nunca perder informação,
// mesmo sem ligação à internet.

class ZeloDB {
  constructor(dbName, version, storesConfig) {
    this.dbName = dbName;
    this.version = version;
    this.storesConfig = storesConfig; // [{ name, keyPath, indexes:[{name,keyPath,options}] }]
    this._dbPromise = null;
  }

  open() {
    if (this._dbPromise) return this._dbPromise;
    this._dbPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB não está disponível neste navegador (pode estar em modo privado).'));
        return;
      }
      const req = indexedDB.open(this.dbName, this.version);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        const tx = e.target.transaction;
        this.storesConfig.forEach((cfg) => {
          const store = db.objectStoreNames.contains(cfg.name)
            ? tx.objectStore(cfg.name)
            : db.createObjectStore(cfg.name, { keyPath: cfg.keyPath });
          (cfg.indexes || []).forEach((idx) => {
            if (!store.indexNames.contains(idx.name)) {
              store.createIndex(idx.name, idx.keyPath, idx.options || { unique: false });
            }
          });
        });
      };
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = () => { this._dbPromise = null; reject(req.error); };
      req.onblocked = () => reject(new Error('A base de dados local está bloqueada — feche outras abas do ZELO abertas e recarregue a página.'));
    });
    return this._dbPromise;
  }

  async put(storeName, record) {
    return this.putAll(storeName, [record]);
  }

  async putAll(storeName, records) {
    if (!records || !records.length) return;
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      records.forEach((r) => store.put(r));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  async get(storeName, key) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const req = db.transaction(storeName, 'readonly').objectStore(storeName).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async delete(storeName, key) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async count(storeName) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const req = db.transaction(storeName, 'readonly').objectStore(storeName).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async getAll(storeName) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const req = db.transaction(storeName, 'readonly').objectStore(storeName).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  // Percorre um índice por blocos (evita carregar tudo de uma vez quando a store cresce muito).
  async queryByIndex(storeName, indexName, range, { limit = 200, offset = 0 } = {}) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const idx = db.transaction(storeName, 'readonly').objectStore(storeName).index(indexName);
      const out = [];
      let skipped = 0;
      const req = idx.openCursor(range || null);
      req.onsuccess = (e) => {
        const cur = e.target.result;
        if (!cur || out.length >= limit) { resolve(out); return; }
        if (skipped < offset) { skipped++; cur.continue(); return; }
        out.push(cur.value);
        cur.continue();
      };
      req.onerror = () => reject(req.error);
    });
  }

  // Exporta uma ou mais stores para um objeto simples, pronto para JSON.stringify (backup).
  async exportAll(storeNames) {
    const out = {};
    for (const name of storeNames) out[name] = await this.getAll(name);
    return out;
  }

  // Restaura um backup gerado por exportAll (substitui registos com a mesma chave).
  async importAll(data) {
    for (const [storeName, records] of Object.entries(data || {})) {
      if (this.storesConfig.some((c) => c.name === storeName) && Array.isArray(records)) {
        await this.putAll(storeName, records);
      }
    }
  }
}

// Pede ao browser para nunca apagar automaticamente os dados locais sob pressão de espaço
// (sem isto, o navegador pode limpar o IndexedDB de sites pouco usados para libertar espaço).
async function zeloRequestPersistentStorage() {
  if (!(navigator.storage && navigator.storage.persist)) return { supported: false };
  try {
    const jaPersistido = await navigator.storage.persisted();
    const concedido = jaPersistido || await navigator.storage.persist();
    return { supported: true, persisted: concedido };
  } catch (e) {
    return { supported: true, persisted: false, error: e };
  }
}

// Devolve uma estimativa do espaço usado/disponível, quando o browser suporta a API.
async function zeloStorageEstimate() {
  if (!(navigator.storage && navigator.storage.estimate)) return null;
  try {
    const { usage, quota } = await navigator.storage.estimate();
    return { usage, quota, pct: quota ? (usage / quota) * 100 : null };
  } catch (e) {
    return null;
  }
}

window.ZeloDB = ZeloDB;
window.zeloRequestPersistentStorage = zeloRequestPersistentStorage;
window.zeloStorageEstimate = zeloStorageEstimate;
