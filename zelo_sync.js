// ── ZELO — Fila de sincronização offline-first ──
// O Firebase é só o serviço de partilha/sincronização entre dispositivos —
// os dados guardados localmente (localStorage/IndexedDB) são sempre a cópia
// que manda. Quando uma escrita no Firebase falha (sem ligação à internet,
// por exemplo), em vez de se perder ou ficar só num aviso na consola, fica
// guardada nesta fila local e é reenviada automaticamente assim que a
// ligação voltar — nenhuma alteração feita offline se perde.
// Depende de zelo_indexeddb.js já estar carregado antes (define window.ZeloDB).

(function () {
  if (typeof ZeloDB === 'undefined') {
    console.error('ZELO sync: zelo_indexeddb.js tem de ser carregado antes de zelo_sync.js.');
    return;
  }

  const QUEUE_DB = new ZeloDB('zelo_sync_queue_db', 1, [
    { name: 'pending', keyPath: 'id', indexes: [
      { name: 'byPath', keyPath: 'path' },
    ]},
  ]);

  let aEnviar = false;

  function novoId() {
    return Date.now() + '_' + Math.random().toString(36).slice(2, 9);
  }

  // Tenta escrever imediatamente no Firebase; se falhar (ou estiver offline),
  // guarda em fila local para reenviar mais tarde — a escrita nunca se perde.
  // op='set' (omisso) substitui tudo o que estiver nesse caminho — é o que
  // sempre foi. op='update' só mexe nas chaves indicadas em "data", sem
  // apagar outras chaves-irmãs já lá guardadas (ex.: um nó do dia que também
  // tem um "historico" ao lado dos campos principais).
  async function zeloQueueWrite(path, data, op) {
    op = op === 'update' ? 'update' : 'set';
    var fbFn = op === 'update' ? window.__fbUpdate : window.__fbSet;
    if (window.__fbReady && fbFn) {
      try {
        await fbFn(path, data);
        return { ok: true, queued: false };
      } catch (e) {
        console.warn('ZELO sync: falha ao enviar para o Firebase — colocado em fila para reenvio automático.', e);
      }
    }
    try {
      await QUEUE_DB.put('pending', { id: novoId(), path: path, data: data, op: op, ts: Date.now() });
    } catch (e) {
      console.error('ZELO sync: não foi possível gravar nem sequer a fila local de sincronização.', e);
    }
    return { ok: false, queued: true };
  }
  // Atalho para a escrita parcial — ver nota acima sobre op='update'.
  function zeloQueueUpdate(path, data) {
    return zeloQueueWrite(path, data, 'update');
  }

  async function zeloPendingCount() {
    try { return await QUEUE_DB.count('pending'); }
    catch (e) { return 0; }
  }

  // Percorre a fila e tenta reenviar cada item pendente; mantém em fila o que
  // continuar a falhar, para tentar de novo na próxima vez.
  async function zeloFlushQueue() {
    if (aEnviar) return 0;
    if (!window.__fbReady || !window.__fbSet) return 0;
    aEnviar = true;
    let enviados = 0;
    try {
      const pendentes = await QUEUE_DB.getAll('pending');
      for (const item of pendentes) {
        try {
          // Itens gravados antes desta distinção existir não têm "op" — eram
          // sempre set(), por isso omisso continua a significar 'set'.
          const fbFn = item.op === 'update' && window.__fbUpdate ? window.__fbUpdate : window.__fbSet;
          await fbFn(item.path, item.data);
          await QUEUE_DB.delete('pending', item.id);
          enviados++;
        } catch (e) {
          // fica em fila — tenta os restantes agora, e este de novo na próxima chamada
        }
      }
    } catch (e) {
      console.warn('ZELO sync: não foi possível ler a fila local — tenta de novo na próxima chamada.', e);
    } finally {
      aEnviar = false;
    }
    return enviados;
  }

  window.zeloQueueWrite = zeloQueueWrite;
  window.zeloQueueUpdate = zeloQueueUpdate;
  window.zeloPendingCount = zeloPendingCount;
  window.zeloFlushQueue = zeloFlushQueue;

  window.addEventListener('online', function () { zeloFlushQueue(); });
  window.addEventListener('DOMContentLoaded', function () {
    zeloFlushQueue();
    // Tenta periodicamente também — redes instáveis nem sempre disparam o evento 'online'.
    setInterval(zeloFlushQueue, 60000);
  });
})();
