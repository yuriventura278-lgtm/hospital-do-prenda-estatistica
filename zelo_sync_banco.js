// ── ZELO — «Bancos» (uma folha por dia): sincronizar sem perder nem esconder dados ──
// Os bancos gravam o dia inteiro em registos/<serviço>/<AAAA-MM-DD> =
// { savedAt, snapshot, criadoPor }. Antes, cada gravação SUBSTITUÍA o dia no
// servidor: se dois computadores preenchiam o mesmo dia, o último apagava o
// que o outro tinha escrito.
//
// Agora (sem mudar as páginas): cada gravação envia só os campos que mudaram
// neste aparelho desde a última vez (atualização parcial), com a hora de cada
// campo em camposTs. Os campos preenchidos noutro computador ficam intactos.
//   • 1.ª gravação de um dia neste aparelho: nunca apaga campos (só envia o
//     que está preenchido).
//   • Esvaziar muitos campos de uma vez (ex. formulário limpo, ou sem data)
//     não apaga nada no servidor (proteção).
//   • Listas (equipas, óbitos…) contam como um só campo.
// ZeloSyncBanco.sincronizarDias(): para bancos que guardam cada dia numa
// chave própria (ex. nefro_v1_<data>), traz para este aparelho os dias
// gravados noutros computadores (para aparecerem no histórico e relatórios).
(function () {
  if (window.ZeloSyncBanco) return;
  var RE_DIA = /^registos\/[^\/]+\/\d{4}-\d{2}-\d{2}$/;
  var CHAVE_OK = /^[^.#$\[\]\/]+$/;
  var MAX_APAGAR = 8;
  var SEP = '|';
  function codificar(k) { return String(k).replace(/%/g, '%25').replace(/\|/g, '%7C').replace(/\./g, '%2E').replace(/\//g, '%2F').replace(/#/g, '%23').replace(/\$/g, '%24').replace(/\[/g, '%5B').replace(/\]/g, '%5D'); }
  function vazio(v) { return v === null || v === undefined || v === '' || (Array.isArray(v) && !v.length); }
  function objetoSimples(v) { return v && typeof v === 'object' && !Array.isArray(v); }
  // { "a/b": valor } — folhas; listas e objetos com chaves inválidas contam como uma folha.
  function achatar(obj) {
    var out = {};
    (function andar(v, pref) {
      if (objetoSimples(v)) {
        var ks = Object.keys(v);
        if (ks.length && ks.every(function (k) { return CHAVE_OK.test(k); })) { ks.forEach(function (k) { andar(v[k], pref ? pref + '/' + k : k); }); return; }
        if (!ks.length) { if (pref) out[pref] = null; return; }
      }
      if (pref) out[pref] = v === undefined ? null : v;
    })(obj, '');
    return out;
  }
  function igual(a, b) { return JSON.stringify(a === undefined ? null : a) === JSON.stringify(b === undefined ? null : b); }
  function chaveBase(caminho) { return 'zsb_base|' + caminho; }
  function lerBase(caminho) { try { var r = localStorage.getItem(chaveBase(caminho)); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
  function gravarBase(caminho, plano) {
    try { localStorage.setItem(chaveBase(caminho), JSON.stringify({ plano: plano, em: Date.now() })); }
    catch (e) { limparBasesAntigas(30); try { localStorage.setItem(chaveBase(caminho), JSON.stringify({ plano: plano, em: Date.now() })); } catch (e2) {} }
  }
  // As «bases» são só a memória do que este aparelho enviou (não são dados):
  // as de dias antigos podem sair para libertar espaço.
  function limparBasesAntigas(dias) {
    try {
      var lim = Date.now() - dias * 86400000;
      Object.keys(localStorage).forEach(function (k) {
        if (k.indexOf('zsb_base|') !== 0) return;
        try { var o = JSON.parse(localStorage.getItem(k)); if (!o || (o.em || 0) < lim) localStorage.removeItem(k); } catch (e) { localStorage.removeItem(k); }
      });
    } catch (e) {}
  }
  function comLimite(p, ms) { return new Promise(function (res, rej) { var t = setTimeout(function () { rej(new Error('timeout')); }, ms); Promise.resolve(p).then(function (v) { clearTimeout(t); res(v); }, function (e) { clearTimeout(t); rej(e); }); }); }

  function instalar() {
    var original = window.zeloQueueWrite, atualizar = window.zeloQueueUpdate;
    if (typeof original !== 'function' || typeof atualizar !== 'function' || original.__banco) return false;
    var novo = async function (caminho, dados, op) {
      if (op === 'update' || !RE_DIA.test(String(caminho)) || !dados || !objetoSimples(dados.snapshot) || dados.camposTs || typeof window.__fbUpdate !== 'function') return original.apply(this, arguments);
      var agora = Date.now(), plano = achatar(dados.snapshot), base = lerBase(caminho), primeira = !base, antes = base ? base.plano : {};
      if (primeira && window.__fbReady && typeof window.__fbGet === 'function' && navigator.onLine !== false) {
        try { var rem = await comLimite(window.__fbGet(caminho), 10000); if (rem && objetoSimples(rem.snapshot)) antes = achatar(rem.snapshot); } catch (e) {}
      }
      var upd = {};
      Object.keys(dados).forEach(function (k) { if (k !== 'snapshot' && k !== 'camposTs') upd[k] = dados[k]; });
      if (!upd.savedAt) upd.savedAt = new Date(agora).toISOString();
      // Gravar um dia que tinha sido eliminado volta a ativá-lo (a ação mais recente vale).
      if (!dados.deleted) { upd.deleted = null; upd.deletedAt = null; upd.deletedBy = null; }
      var mudou = [], apagar = [];
      Object.keys(plano).forEach(function (k) {
        if (vazio(plano[k])) { if (!vazio(antes[k])) apagar.push(k); return; }
        if (!igual(plano[k], antes[k])) mudou.push(k);
      });
      Object.keys(antes).forEach(function (k) { if (!(k in plano) && !vazio(antes[k])) apagar.push(k); });
      // Proteção: nunca apagar na 1.ª gravação nem muitos campos de uma vez.
      var preenchidos = Object.keys(antes).filter(function (k) { return !vazio(antes[k]); }).length;
      var semData = ('data' in dados.snapshot) && vazio(dados.snapshot.data);
      if (primeira || semData || apagar.length > MAX_APAGAR || (apagar.length >= 2 && apagar.length >= preenchidos * 0.4)) apagar = [];
      mudou.forEach(function (k) { upd['snapshot/' + k] = plano[k]; upd['camposTs/' + codificar(k.split('/').join(SEP))] = agora; });
      apagar.forEach(function (k) { upd['snapshot/' + k] = null; upd['camposTs/' + codificar(k.split('/').join(SEP))] = agora; });
      // Um caminho não pode ser, ao mesmo tempo, pai de outro na mesma atualização.
      var ks = Object.keys(upd).filter(function (k) { return k.indexOf('snapshot/') === 0; }).sort();
      for (var i = 0; i < ks.length - 1; i++) if (ks[i + 1].indexOf(ks[i] + '/') === 0) { if (upd[ks[i]] === null) delete upd[ks[i]]; else delete upd[ks[i + 1]]; }
      var guardar = {}; Object.keys(antes).forEach(function (k) { guardar[k] = antes[k]; }); Object.keys(plano).forEach(function (k) { guardar[k] = plano[k]; });
      apagar.forEach(function (k) { delete guardar[k]; });
      gravarBase(caminho, primeira ? plano : guardar);
      if (!mudou.length && !apagar.length) return { ok: true, queued: false, semAlteracoes: true };
      return atualizar(caminho, upd);
    };
    novo.__banco = true;
    window.zeloQueueWrite = novo;
    return true;
  }
  if (!instalar()) { var n = 0, iv = setInterval(function () { if (instalar() || ++n > 40) clearInterval(iv); }, 100); }

  // Dias gravados noutros computadores → chaves locais por dia (histórico e relatórios completos).
  // opts: { caminho:'registos/nefrologia', prefixo:'nefro_v1_', prefixoSavedAt:'nefro_v1_savedAt_', depois:fn }
  async function sincronizarDias(opts) {
    var espera = 0;
    while (!(window.__fbReady && window.__fbGet) && espera++ < 60) await new Promise(function (r) { setTimeout(r, 250); });
    if (!window.__fbGet) return 0;
    var tudo;
    try { tudo = await (window.zeloLerHistorico ? window.zeloLerHistorico(opts.caminho) : window.__fbGet(opts.caminho)); } catch (e) { return 0; }
    var n = 0;
    Object.keys(tudo || {}).forEach(function (d) {
      var r = tudo[d]; if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !r || (!r.snapshot && !r.deleted)) return;
      var localSA = null; try { localSA = localStorage.getItem(opts.prefixoSavedAt + d); } catch (e) {}
      // Eliminado noutro computador: elimina também aqui (se a eliminação for mais recente).
      if (r.deleted) {
        var quando = r.deletedAt || r.savedAt;
        if (localSA && quando && new Date(localSA) > new Date(quando)) return; // regravado aqui depois
        try {
          if (typeof opts.apagar === 'function') opts.apagar(d, r); else localStorage.removeItem(opts.prefixo + d);
          if (quando) localStorage.setItem(opts.prefixoSavedAt + d, quando);
          n++;
        } catch (e) {}
        return;
      }
      var temLocal = false;
      try { temLocal = typeof opts.temLocal === 'function' ? !!opts.temLocal(d) : !!localStorage.getItem(opts.prefixo + d); } catch (e) {}
      if (temLocal && localSA && r.savedAt && new Date(localSA) >= new Date(r.savedAt)) return;
      if (temLocal && !r.savedAt) return;
      try {
        if (typeof opts.gravar === 'function') opts.gravar(d, r.snapshot, r.savedAt);
        else localStorage.setItem(opts.prefixo + d, JSON.stringify(r.snapshot));
        if (r.savedAt) localStorage.setItem(opts.prefixoSavedAt + d, r.savedAt);
        n++;
      } catch (e) {}
    });
    if (n && typeof opts.depois === 'function') { try { opts.depois(n); } catch (e) {} }
    return n;
  }

  // Eliminar um dia: marca-o como eliminado no servidor (em fila — também sem
  // internet) com a hora da eliminação como hora de gravação, para os outros
  // computadores perceberem que é mais recente e o eliminarem também.
  function marcarApagado(caminho, quando, autor) {
    quando = quando || new Date().toISOString();
    var dados = { deleted: true, deletedAt: quando, deletedBy: autor || null, savedAt: quando };
    try { localStorage.removeItem(chaveBase(caminho)); } catch (e) {}
    if (typeof window.zeloQueueUpdate === 'function') return window.zeloQueueUpdate(caminho, dados);
    if (typeof window.__fbUpdate === 'function') return window.__fbUpdate(caminho, dados);
    return Promise.resolve();
  }
  window.ZeloSyncBanco = { sincronizarDias: sincronizarDias, marcarApagado: marcarApagado, _achatar: achatar };
})();
