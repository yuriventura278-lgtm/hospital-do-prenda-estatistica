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

  // Envio que demora mais de 3 s → aviso "Ligação lenta" (zelo_espera.js).
  function avisarSeLento(t0) {
    if (Date.now() - t0 > 3000) {
      try { window.dispatchEvent(new Event('zelo-ligacao-lenta')); } catch (e) {}
    }
  }

  function novoId() {
    return Date.now() + '_' + Math.random().toString(36).slice(2, 9);
  }

  // ── Fila sempre primeiro (funciona sem internet como com internet) ──
  // Cada gravação é guardada PRIMEIRO na fila local (IndexedDB, sobrevive a
  // fechar a página, mudar de página ou desligar o computador) e só sai da
  // fila quando o Firebase confirma. Sem internet, o Firebase não responde
  // nem dá erro (fica à espera) — antes a gravação ficava presa nessa espera
  // e perdia-se se a pessoa fechasse ou mudasse de página. Agora espera-se
  // no máximo ESPERA_MS; o que não for confirmado fica na fila e é enviado
  // sozinho quando a rede voltar (evento "online", ao abrir qualquer página
  // e de minuto a minuto).
  var ESPERA_MS = 12000;
  function comLimite(promessa, ms) {
    return new Promise(function (res, rej) {
      var t = setTimeout(function () { rej(new Error('sem-resposta')); }, ms);
      Promise.resolve(promessa).then(function (v) { clearTimeout(t); res(v); }, function (e) { clearTimeout(t); rej(e); });
    });
  }
  async function zeloQueueWrite(path, data, op) {
    op = op === 'update' ? 'update' : 'set';
    var item = { id: novoId(), path: path, data: data, op: op, ts: Date.now() };
    var naFila = false;
    try { await QUEUE_DB.put('pending', item); naFila = true; }
    catch (e) { console.error('ZELO sync: não foi possível gravar a fila local de sincronização.', e); }
    var fbFn = op === 'update' ? window.__fbUpdate : window.__fbSet;
    if (window.__fbReady && fbFn && navigator.onLine !== false) {
      var t0 = Date.now();
      try {
        await comLimite(fbFn(path, data), ESPERA_MS);
        avisarSeLento(t0);
        if (naFila) { try { await QUEUE_DB.delete('pending', item.id); } catch (e) {} }
        return { ok: true, queued: false };
      } catch (e) {
        if (String(e && e.message) !== 'sem-resposta') console.warn('ZELO sync: falha ao enviar para o Firebase — fica na fila para reenvio automático.', e);
      }
    } else if (window.__fbReady && fbFn) {
      // Sem internet: entrega também ao Firebase (envia sozinho se a página
      // ficar aberta até a rede voltar); a fila garante o envio se não ficar.
      try { fbFn(path, data).then(function () { if (naFila) QUEUE_DB.delete('pending', item.id).catch(function () {}); }, function () {}); } catch (e) {}
    }
    try { window.dispatchEvent(new CustomEvent('zelo-fila', { detail: { pendente: true } })); } catch (e) {}
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

  // ── Junção campo a campo (objetos com hora por campo: {savedAt, snapshot, camposTs}) ──
  // Mesmo formato de zelo_sync_objeto.js: um envio antigo que ficou na fila
  // nunca apaga o que outro computador gravou depois — cada valor fica com a
  // versão alterada mais recentemente.
  var SEP = '|';
  function codificar(k) { return String(k).replace(/%/g, '%25').replace(/\|/g, '%7C').replace(/\./g, '%2E').replace(/\//g, '%2F').replace(/#/g, '%23').replace(/\$/g, '%24').replace(/\[/g, '%5B').replace(/\]/g, '%5D'); }
  function descodificar(k) { try { return decodeURIComponent(k); } catch (e) { return k; } }
  function vazio(v) { return v === null || v === undefined || v === ''; }
  function achatar(obj) {
    var out = {};
    (function andar(v, pref) {
      if (v !== null && typeof v === 'object') { Object.keys(v).forEach(function (k) { andar(v[k], pref ? pref + SEP + codificar(k) : codificar(k)); }); return; }
      if (pref) out[pref] = (v === undefined ? null : v);
    })(obj, '');
    return out;
  }
  function reconstruir(plano) {
    var raiz = {};
    Object.keys(plano).sort().forEach(function (c) {
      var ps = c.split(SEP).map(descodificar), n = raiz;
      for (var i = 0; i < ps.length - 1; i++) { if (n[ps[i]] === null || typeof n[ps[i]] !== 'object') n[ps[i]] = {}; n = n[ps[i]]; }
      n[ps[ps.length - 1]] = plano[c];
    });
    return (function listas(v) {
      if (v === null || typeof v !== 'object') return v;
      var ks = Object.keys(v); ks.forEach(function (k) { v[k] = listas(v[k]); });
      if (ks.length && ks.every(function (k) { return /^\d+$/.test(k); })) { var a = [], max = Math.max.apply(null, ks.map(Number)); for (var i = 0; i <= max; i++) a.push(v[i] === undefined ? null : v[i]); return a; }
      return v;
    })(raiz);
  }
  function tsDe(o) { var t = {}; Object.keys(o || {}).forEach(function (k) { t[descodificar(k)] = Number(o[k]) || 0; }); return t; }
  function tsPara(t) { var o = {}; Object.keys(t).forEach(function (k) { o[codificar(k)] = t[k]; }); return o; }
  function ehObjetoJuntavel(d) { return d && typeof d === 'object' && d.snapshot && d.camposTs && typeof d.camposTs === 'object'; }
  function juntarComServidor(local, remoto) {
    var lS = achatar(local.snapshot), lT = tsDe(local.camposTs), rS = achatar(remoto.snapshot || {}), rT = tsDe(remoto.camposTs), ch = {}, plano = {}, ts = {};
    [lS, lT, rS, rT].forEach(function (o) { Object.keys(o).forEach(function (k) { ch[k] = 1; }); });
    Object.keys(ch).forEach(function (k) {
      var lv = k in lS ? lS[k] : null, rv = k in rS ? rS[k] : null, lt = lT[k] || 0, rt = rT[k] || 0;
      var v = rt > lt ? rv : lt > rt ? lv : (vazio(lv) ? rv : lv);
      if (!vazio(v)) plano[k] = v; ts[k] = Math.max(lt, rt);
    });
    return { savedAt: Math.max(Number(remoto.savedAt) || 0, Number(local.savedAt) || 0, Date.now()), snapshot: reconstruir(plano), camposTs: tsPara(ts) };
  }
  function horaRegisto(d) {
    if (!d || typeof d !== 'object') return 0;
    var v = d.savedAt || d.ts || d.atualizadoEm || d.updatedAt;
    if (typeof v === 'number') return v;
    var t = Date.parse(v || ''); return isNaN(t) ? 0 : t;
  }

  // Percorre a fila e envia o que ficou por enviar. Cuidados:
  //  • do mesmo caminho só segue a gravação completa mais recente;
  //  • objetos com hora por campo são juntados com o que está no servidor;
  //  • um envio antigo não substitui um registo mais recente que outro
  //    computador já tenha gravado no servidor;
  //  • anotações do Histórico de registos que já lá estão não se repetem.
  async function zeloFlushQueue() {
    if (aEnviar) return 0;
    if (!window.__fbReady || !window.__fbSet || navigator.onLine === false) return 0;
    aEnviar = true;
    let enviados = 0;
    try {
      const pendentes = (await QUEUE_DB.getAll('pending')).sort(function (a, b) { return (a.ts || 0) - (b.ts || 0); });
      // Gravações completas repetidas no mesmo caminho: só a última conta.
      const ultimoSet = {};
      pendentes.forEach(function (it) { if ((it.op || 'set') === 'set') ultimoSet[it.path] = it.id; });
      for (const item of pendentes) {
        try {
          if ((item.op || 'set') === 'set' && ultimoSet[item.path] !== item.id) { await QUEUE_DB.delete('pending', item.id); continue; }
          let dados = item.data;
          if ((item.op || 'set') === 'set' && typeof window.__fbGet === 'function') {
            let remoto = null, lido = false;
            try { remoto = await comLimite(window.__fbGet(item.path), ESPERA_MS); lido = true; } catch (e) { lido = false; }
            if (!lido) continue; // sem resposta: fica para a próxima
            if (ehObjetoJuntavel(dados) && ehObjetoJuntavel(remoto)) dados = juntarComServidor(dados, remoto);
            else if (remoto && horaRegisto(remoto) > Math.max(horaRegisto(dados), item.ts || 0)) {
              // O servidor já tem uma versão mais recente (de outro computador): não a
              // substitui — e esta cópia também não se perde: fica guardada à parte.
              const chave = String(item.path).replace(/[.#$\[\]\/]/g, '_') + '_' + (item.ts || Date.now());
              let quem = ''; try { quem = sessionStorage.getItem('zeloNome') || ''; } catch (x) {}
              await comLimite(window.__fbSet('registos_sistemas_locais/conflitos_offline/' + chave, { caminho: item.path, dados: dados, gravadoEm: item.ts || 0, por: quem, pagina: location.pathname.split('/').pop() }), ESPERA_MS);
              await QUEUE_DB.delete('pending', item.id); continue;
            } else if (remoto && JSON.stringify(remoto) === JSON.stringify(dados)) {
              await QUEUE_DB.delete('pending', item.id); continue; // já lá está
            } else if (remoto !== null && remoto !== undefined && !ehObjetoJuntavel(dados)) {
              // Vai substituir uma versão diferente que está no servidor: essa
              // versão fica guardada à parte antes (nenhum dado se perde).
              const chaveAnt = String(item.path).replace(/[.#$\[\]\/]/g, '_') + '_' + (item.ts || Date.now()) + '_servidor';
              let quemA = ''; try { quemA = sessionStorage.getItem('zeloNome') || ''; } catch (x) {}
              await comLimite(window.__fbSet('registos_sistemas_locais/conflitos_offline/' + chaveAnt, { caminho: item.path, dados: remoto, substituidoEm: Date.now(), por: quemA, pagina: location.pathname.split('/').pop(), nota: 'versão do servidor substituída por um envio feito sem internet' }), ESPERA_MS);
            }
          }
          const fbFn = item.op === 'update' && window.__fbUpdate ? window.__fbUpdate : window.__fbSet;
          await comLimite(fbFn(item.path, dados), ESPERA_MS);
          await QUEUE_DB.delete('pending', item.id);
          enviados++;
        } catch (e) {
          // Anotação do Histórico de registos já existente (regra "só criar"): não se repete.
          if (/^auditoria_registos\//.test(item.path) && /permission|denied/i.test(String(e && (e.code || e.message)))) {
            try { await QUEUE_DB.delete('pending', item.id); } catch (x) {}
          }
          // os restantes ficam em fila — tenta de novo na próxima chamada
        }
      }
    } catch (e) {
      console.warn('ZELO sync: não foi possível ler a fila local — tenta de novo na próxima chamada.', e);
    } finally {
      aEnviar = false;
    }
    if (enviados) { try { window.dispatchEvent(new CustomEvent('zelo-fila', { detail: { enviados: enviados } })); } catch (e) {} }
    return enviados;
  }

  window.zeloQueueWrite = zeloQueueWrite;

  // Leitura incremental de um histórico por datas (<caminho>/<AAAA-MM-DD>):
  // descarrega tudo só na primeira vez neste computador e depois uma vez por
  // mês; nas outras vezes só os últimos 60 dias (o resto já está guardado
  // aqui). Pedidos repetidos em menos de 10 minutos não voltam a descarregar.
  // Poupa o limite gratuito de downloads do Firebase (10 GB/mês).
  var _ultimaLeitura = {};
  window.zeloLerHistorico = async function (caminho) {
    var agora = Date.now();
    if (_ultimaLeitura[caminho] && agora - _ultimaLeitura[caminho].ts < 10 * 60 * 1000) return _ultimaLeitura[caminho].v;
    var chave = 'zeloLeituraTotal_' + caminho, total = 0;
    try { total = Number(localStorage.getItem(chave)) || 0; } catch (e) {}
    var v;
    if (total && agora - total < 30 * 86400000 && typeof window.__fbGetRange === 'function') {
      var desde = new Date(agora - 60 * 86400000).toISOString().slice(0, 10);
      v = await comLimite(window.__fbGetRange(caminho, desde, '9999'), 20000);
    } else {
      v = await comLimite(window.__fbGet(caminho), 30000);
      try { localStorage.setItem(chave, String(agora)); } catch (e) {}
    }
    _ultimaLeitura[caminho] = { ts: agora, v: v };
    return v;
  };
  window.zeloQueueUpdate = zeloQueueUpdate;
  window.zeloPendingCount = zeloPendingCount;
  // Escritas ainda em fila (gravadas sem internet) cujo caminho começa por
  // "prefixo" — usado pelo assistente para não dar como em falta um dia que
  // já foi guardado neste aparelho mas ainda não chegou ao servidor.
  window.zeloPendingItems = async function (prefixo) {
    try {
      const todos = await QUEUE_DB.getAll('pending');
      return todos.filter(function (i) { return !prefixo || String(i.path).indexOf(prefixo) === 0; });
    } catch (e) { return []; }
  };
  window.zeloFlushQueue = zeloFlushQueue;

  window.addEventListener('online', function () { zeloFlushQueue(); });
  window.addEventListener('DOMContentLoaded', function () {
    zeloFlushQueue();
    // O Firebase da página liga-se um pouco depois: envia a fila logo que estiver pronto.
    var n = 0, iv = setInterval(function () { if (window.__fbReady && window.__fbSet) { clearInterval(iv); zeloFlushQueue(); } else if (++n > 40) clearInterval(iv); }, 750);
    // Tenta periodicamente também — redes instáveis nem sempre disparam o evento 'online'.
    setInterval(zeloFlushQueue, 60000);
  });
})();
