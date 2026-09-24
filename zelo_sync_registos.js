// ── ZELO — sincronização registo-a-registo com o Firebase ──
// Para páginas que guardam uma lista de registos independentes (cada um com
// um "id" próprio) no IndexedDB/localStorage do aparelho — ex.: Banco de
// Urgência, Reprografia. Cada registo vai para o seu próprio nó:
//   <caminho>/<id>  →  { id, savedAt, json }        (registo guardado)
//                   →  { id, savedAt, apagado:true } (registo eliminado)
// O registo segue como texto JSON para o Firebase não lhe tirar listas vazias
// nem campos nulos. Uma eliminação fica marcada (em vez de apagar o nó) para
// que outro computador, que ainda tenha o registo, também o elimine.
// Vence sempre a versão gravada mais recentemente — e, como cada registo é
// independente, dois computadores a registar ao mesmo tempo não se apagam.
// Depende de zelo_sync.js (zeloQueueWrite) e do módulo Firebase da página
// (__fbReady / __fbGet / __fbListen).
(function () {
  function chaveFirebase(id) {
    return String(id).replace(/[.#$\[\]\/]/g, '_');
  }

  function zeloSyncRegistos(cfg) {
    // cfg: { caminho, chaveLocal, listarLocais(), gravarLocal(reg), apagarLocal(id), aoMudar() }
    var LS_APAGADOS = 'zelo_sync_apagados_' + cfg.chaveLocal;
    var aplicando = 0;

    function lerApagados() {
      try { return JSON.parse(localStorage.getItem(LS_APAGADOS) || '{}') || {}; } catch (e) { return {}; }
    }
    function marcarApagado(id, ts) {
      var m = lerApagados(); m[id] = ts;
      try { localStorage.setItem(LS_APAGADOS, JSON.stringify(m)); } catch (e) {}
    }
    function escrever(id, valor) {
      if (typeof window.zeloQueueWrite !== 'function') return;
      window.zeloQueueWrite(cfg.caminho + '/' + chaveFirebase(id), valor)
        .catch(function (e) { console.warn('ZELO: falha ao sincronizar registo', id, e); });
    }

    // Chamado depois de gravar um registo neste aparelho.
    function enviar(reg) {
      if (aplicando || !reg || reg.id == null) return;
      var ts = Number(reg._zeloSavedAt) || Date.now();
      var copia = {}; for (var k in reg) if (k !== '_zeloSavedAt') copia[k] = reg[k];
      escrever(reg.id, { id: String(reg.id), savedAt: ts, json: JSON.stringify(copia) });
    }
    // Chamado depois de eliminar um registo neste aparelho.
    function apagar(id) {
      if (aplicando || id == null) return;
      var ts = Date.now();
      marcarApagado(String(id), ts);
      escrever(id, { id: String(id), savedAt: ts, apagado: true });
    }

    async function juntar(remoto, enviarEmFalta) {
      remoto = remoto || {};
      var locais = await cfg.listarLocais();
      var porId = {};
      locais.forEach(function (r) { if (r && r.id != null) porId[String(r.id)] = r; });
      var apagados = lerApagados();
      var vistos = {};
      var mudou = false;
      aplicando++;
      try {
        for (var chave in remoto) {
          var e = remoto[chave];
          if (!e || e.id == null) continue;
          var id = String(e.id), ts = Number(e.savedAt) || 0;
          vistos[id] = true;
          var local = porId[id];
          var tsLocal = local ? (Number(local._zeloSavedAt) || 0) : 0;
          if (e.apagado) {
            if (local && tsLocal <= ts) { await cfg.apagarLocal(local.id); mudou = true; }
            if (!apagados[id] || apagados[id] < ts) marcarApagado(id, ts);
            continue;
          }
          if (apagados[id] && apagados[id] >= ts) continue;
          if (!local || tsLocal < ts) {
            var reg;
            try { reg = JSON.parse(e.json); } catch (err) { continue; }
            if (!reg) continue;
            reg._zeloSavedAt = ts;
            await cfg.gravarLocal(reg);
            mudou = true;
          }
        }
      } finally { aplicando--; }
      // Registos deste aparelho que o servidor ainda não tem (ex.: feitos sem
      // internet, ou antes desta página estar ligada ao ZELO) ou mais recentes.
      if (enviarEmFalta) {
        locais.forEach(function (r) {
          if (!r || r.id == null) return;
          var id = String(r.id), e = remoto[chaveFirebase(id)];
          if (!vistos[id] || (!e.apagado && (Number(r._zeloSavedAt) || 0) > (Number(e.savedAt) || 0))) enviar(r);
        });
      }
      if (mudou && typeof cfg.aoMudar === 'function') {
        try { await cfg.aoMudar(); } catch (err) { console.warn(err); }
      }
      return mudou;
    }

    function esperarPronto(timeoutMs) {
      var pronto = function () { return window.__fbReady && typeof window.__fbGet === 'function'; };
      return new Promise(function (resolve) {
        if (pronto()) { resolve(true); return; }
        var inicio = Date.now();
        var iv = setInterval(function () {
          if (pronto()) { clearInterval(iv); resolve(true); }
          else if (Date.now() - inicio > (timeoutMs || 30000)) { clearInterval(iv); resolve(false); }
        }, 150);
      });
    }

    async function iniciar() {
      if (!(await esperarPronto())) return;
      try { await juntar(await window.__fbGet(cfg.caminho), true); }
      catch (e) { console.warn('ZELO: falha ao ler os registos do servidor', e); }
      if (typeof window.__fbListen === 'function') {
        window.__fbListen(cfg.caminho, function (remoto) {
          juntar(remoto, false).catch(function (e) { console.warn(e); });
        });
      }
    }

    return { enviar: enviar, apagar: apagar, iniciar: iniciar, aplicando: function () { return aplicando > 0; } };
  }

  window.zeloSyncRegistos = zeloSyncRegistos;
})();
