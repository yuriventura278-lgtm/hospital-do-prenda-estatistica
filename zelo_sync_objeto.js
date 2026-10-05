// ── ZELO — sincronização campo a campo, sem perda de dados ──
// Para páginas que guardam um objeto inteiro de uma vez (Movimento
// Hospitalar, Controlo de Pacientes, Secretaria Geral…). Antes, cada
// computador enviava o bloco completo e o último a gravar substituía o que
// os outros tinham registado entretanto — dados perdidos.
//
// Agora cada valor (cada "folha" do objeto: um dia de um campo, um campo de
// um paciente…) tem a sua própria hora de alteração, guardada neste aparelho
// e no servidor (camposTs). Ao juntar duas versões, cada valor fica com a
// versão alterada mais recentemente; valores que só existem de um lado nunca
// se perdem. O que chega de outro computador é aplicado sozinho (sem aviso),
// porque juntar nunca estraga o que a pessoa tem no ecrã.
//
// Proteção contra apagar: se uma gravação esvaziar de uma vez muitos valores
// (ex.: importar uma cópia antiga, limpar a página, um erro), esses
// "apagamentos" não são enviados — os dados voltam do servidor.
//
// No servidor: <caminho> = { savedAt, snapshot, camposTs }  (a mesma forma
// { savedAt, snapshot } que as páginas já usavam, mais camposTs).
//
// Uso:
//   var s = ZeloSyncObjeto.criar({
//     caminho: 'registos_movimento/cirurgia_geral',
//     chaveLocal: 'mov_cirurgia_geral',          // identifica o aparelho/página
//     obter:  function () { return objetoAtual; }, // forma "para juntar"
//     aplicar: function (obj) { … grava localmente e redesenha … },
//     ajustar: function (obj) { return obj; },    // opcional, depois de juntar
//     grupo: function (chave) { … },              // opcional: a que registo pertence
//     maxApagar: 1,                               // registos que se podem esvaziar por gravação
//     esquecer: function (chave, plano) { … }      // opcional: valores que saíram para um arquivo
//                                                 // (não se enviam, não voltam, e saem do servidor)
//   });
//   s.iniciar();          // ao abrir a página
//   s.guardou();          // sempre que a página grava localmente
(function () {
  if (window.ZeloSyncObjeto) return;

  var SEP = '|';
  function codificar(k) { return String(k).replace(/%/g, '%25').replace(/\|/g, '%7C').replace(/\./g, '%2E').replace(/\//g, '%2F').replace(/#/g, '%23').replace(/\$/g, '%24').replace(/\[/g, '%5B').replace(/\]/g, '%5D'); }
  function descodificar(k) { try { return decodeURIComponent(k); } catch (e) { return k; } }
  function vazio(v) { return v === null || v === undefined || v === ''; }

  // { "a|b|0": valor } — só folhas (números, texto, booleanos).
  function achatar(obj) {
    var out = {};
    (function andar(v, pref) {
      if (v !== null && typeof v === 'object') {
        var ks = Object.keys(v);
        if (!ks.length && pref) return;
        ks.forEach(function (k) { andar(v[k], pref ? pref + SEP + codificar(k) : codificar(k)); });
        return;
      }
      if (pref) out[pref] = (v === undefined ? null : v);
    })(obj, '');
    return out;
  }
  // Reconstrói o objeto; nós só com chaves 0..n voltam a ser listas.
  function reconstruir(plano) {
    var raiz = {};
    Object.keys(plano).sort().forEach(function (caminho) {
      var v = plano[caminho];
      if (v === undefined) return;
      var ps = caminho.split(SEP).map(descodificar), n = raiz;
      for (var i = 0; i < ps.length - 1; i++) {
        if (n[ps[i]] === null || typeof n[ps[i]] !== 'object') n[ps[i]] = {};
        n = n[ps[i]];
      }
      n[ps[ps.length - 1]] = v;
    });
    return (function listas(v) {
      if (v === null || typeof v !== 'object') return v;
      var ks = Object.keys(v);
      ks.forEach(function (k) { v[k] = listas(v[k]); });
      if (ks.length && ks.every(function (k) { return /^\d+$/.test(k); })) {
        var max = Math.max.apply(null, ks.map(Number));
        var a = [];
        for (var i = 0; i <= max; i++) a.push(v[i] === undefined ? null : v[i]);
        return a;
      }
      return v;
    })(raiz);
  }
  function tsParaServidor(ts) { var o = {}; Object.keys(ts).forEach(function (k) { o[codificar(k)] = ts[k]; }); return o; }
  function tsDoServidor(o) { var t = {}; Object.keys(o || {}).forEach(function (k) { t[descodificar(k)] = Number(o[k]) || 0; }); return t; }

  function lerLS(k, def) { try { var r = localStorage.getItem(k); return r ? JSON.parse(r) : def; } catch (e) { return def; } }
  function gravarLS(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  function criar(cfg) {
    // Valores arquivados noutro sítio (cfg.esquecer): tirados do plano e das horas.
    function esquecido(k, plano) { try { return typeof cfg.esquecer === 'function' && !!cfg.esquecer(k, plano); } catch (e) { return false; } }
    function limparPlano(pl) { if (typeof cfg.esquecer !== 'function') return pl; Object.keys(pl).forEach(function (k) { if (esquecido(k, pl)) delete pl[k]; }); return pl; }
    var K_TS = 'zeloSO_ts_' + cfg.chaveLocal, K_ANT = 'zeloSO_ant_' + cfg.chaveLocal;
    var meusTs = lerLS(K_TS, {});        // hora de alteração de cada valor, neste aparelho
    var anterior = lerLS(K_ANT, null);   // último estado conhecido (para ver o que mudou)
    var ultimoEnvio = 0, aplicando = false, emCurso = null, pendente = false;
    // Com a escuta em tempo real ativa, o último valor do servidor já está
    // aqui — não é preciso descarregar o bloco outra vez a cada gravação.
    var ouvindo = false, ultimoRemoto = null;
    // Limpeza pedida pelo sistema (ex.: retirar um campo em todos os meses): pode esvaziar muitos de uma vez.
    var permitirMassa = false, fimPrimeira, primeiraFeita = new Promise(function (r) { fimPrimeira = r; });

    // Marca com a hora atual os valores que a pessoa mudou desde a última vez.
    function registarAlteracoes() {
      var agora = Date.now();
      var atual = achatar(cfg.obter());
      if (typeof cfg.esquecer === 'function') {
        var marca = Object.assign({}, anterior || {}, atual);
        Object.keys(meusTs).forEach(function (k) { if (esquecido(k, marca)) delete meusTs[k]; });
        if (anterior) Object.keys(anterior).forEach(function (k) { if (esquecido(k, marca)) delete anterior[k]; });
        limparPlano(atual);
      }
      if (!anterior) {
        // Primeira vez neste aparelho: o que já existia conta como antigo (0),
        // para nunca se sobrepor a alterações mais recentes de outro lado.
        Object.keys(atual).forEach(function (k) { if (meusTs[k] == null) meusTs[k] = 0; });
      } else {
        var esvaziados = [];
        Object.keys(atual).forEach(function (k) {
          if (JSON.stringify(atual[k]) !== JSON.stringify(anterior[k] === undefined ? null : anterior[k])) {
            if (vazio(atual[k]) && !vazio(anterior[k])) esvaziados.push(k);
            else meusTs[k] = agora;
          }
        });
        Object.keys(anterior).forEach(function (k) { if (!(k in atual) && !vazio(anterior[k])) esvaziados.push(k); });
        // Conta por registo (um paciente, uma célula…): cfg.grupo(chave).
        var grupo = typeof cfg.grupo === 'function' ? cfg.grupo : function (k) { return k; };
        var gCheios = {}, gVazios = {};
        Object.keys(anterior).forEach(function (k) { if (!vazio(anterior[k])) gCheios[grupo(k)] = 1; });
        esvaziados.forEach(function (k) { gVazios[grupo(k)] = 1; });
        var nV = Object.keys(gVazios).length;
        // Apagar um registo (corrigir um engano) é normal; esvaziar vários de
        // uma vez (mais do que cfg.maxApagar) não é enviado — os dados voltam
        // do servidor.
        var emMassa = !permitirMassa && nV > (cfg.maxApagar || 1);
        if (emMassa) console.warn('ZELO: ' + esvaziados.length + ' valores esvaziados de uma vez — não enviados (proteção contra perda de dados).');
        else esvaziados.forEach(function (k) { meusTs[k] = agora; });
        // Houve alteração de dados feita NESTE aparelho (não a junção com o
        // que veio de outro computador): avisa a etiqueta "Última alteração".
        var mudouAqui = Object.keys(meusTs).some(function (k) { return meusTs[k] === agora; });
        if (mudouAqui) { try { window.dispatchEvent(new CustomEvent('zelo:alteracao-local', { detail: { caminho: cfg.caminho } })); } catch (e) {} }
      }
      anterior = atual;
      gravarLS(K_TS, meusTs); gravarLS(K_ANT, anterior);
    }

    // Junta o estado local com o do servidor, valor a valor.
    function juntar(remoto) {
      var local = achatar(cfg.obter());
      Object.keys(anterior || {}).forEach(function (k) { if (!(k in local)) local[k] = null; });
      var rSnap = remoto && remoto.snapshot ? achatar(remoto.snapshot) : {};
      var rTs = tsDoServidor(remoto && remoto.camposTs);
      var rSavedAt = Number(remoto && remoto.savedAt) || 0;
      var chaves = {}, plano = {}, ts = {}, mudouLocal = false, mudouRemoto = false;
      Object.keys(local).forEach(function (k) { chaves[k] = 1; });
      Object.keys(rSnap).forEach(function (k) { chaves[k] = 1; });
      Object.keys(rTs).forEach(function (k) { chaves[k] = 1; });
      Object.keys(chaves).forEach(function (k) {
        var lv = k in local ? local[k] : null, rv = k in rSnap ? rSnap[k] : null;
        var lt = meusTs[k] != null ? meusTs[k] : 0;
        // Servidor antigo (sem camposTs): os valores contam com a hora do bloco.
        var rt = rTs[k] != null ? rTs[k] : (k in rSnap ? Math.min(rSavedAt, 1) : 0);
        var usarRemoto;
        if (rt > lt) usarRemoto = true;
        else if (lt > rt) usarRemoto = false;
        else usarRemoto = vazio(lv) && !vazio(rv); // empate: nunca trocar um valor por vazio
        var v = usarRemoto ? rv : lv;
        plano[k] = v; ts[k] = Math.max(lt, rt);
        if (JSON.stringify(v) !== JSON.stringify(lv)) mudouLocal = true;
        // Só é preciso enviar se o valor for diferente do servidor ou se aqui
        // houver uma alteração mais recente (nunca por "sem hora" vs "hora 0",
        // senão os computadores reenviavam uns aos outros sem parar).
        if (JSON.stringify(vazio(v) ? null : v) !== JSON.stringify(vazio(rv) ? null : rv) || (ts[k] || 0) > (rTs[k] || 0)) mudouRemoto = true;
      });
      if (typeof cfg.esquecer === 'function') Object.keys(plano).forEach(function (k) { if (esquecido(k, plano)) { delete plano[k]; delete ts[k]; } });
      var obj = reconstruir(Object.keys(plano).reduce(function (o, k) { if (!vazio(plano[k])) o[k] = plano[k]; return o; }, {}));
      if (typeof cfg.ajustar === 'function') obj = cfg.ajustar(obj) || obj;
      // Mudou aqui? (compara só valores com conteúdo, já depois do ajuste)
      var cheio = function (pl) { var o = {}; Object.keys(pl).sort().forEach(function (k) { if (!vazio(pl[k])) o[k] = pl[k]; }); return JSON.stringify(o); };
      mudouLocal = cheio(achatar(obj)) !== cheio(achatar(cfg.obter()));
      return { obj: obj, ts: ts, mudouLocal: mudouLocal, mudouRemoto: mudouRemoto };
    }

    function aplicarLocal(res) {
      meusTs = res.ts; gravarLS(K_TS, meusTs);
      if (res.mudouLocal) {
        aplicando = true;
        try { cfg.aplicar(res.obj); } catch (e) { console.warn('ZELO: falha ao aplicar dados sincronizados', e); }
        aplicando = false;
      }
      // O que veio de fora não é alteração deste aparelho: passa a ser o
      // "último estado conhecido" sem ganhar hora nova.
      anterior = achatar(cfg.obter());
      gravarLS(K_ANT, anterior);
    }

    // Envia só o que mudou em relação ao que o servidor já tem (um paciente,
    // um campo…), numa só escrita parcial — poupa o limite de downloads do
    // Firebase: os outros computadores recebem só essa diferença, não o bloco
    // inteiro. Envia o bloco completo só se ainda não se conhece o servidor
    // (primeira gravação) ou se a diferença não puder ser escrita por partes.
    var servidor = null; // último estado conhecido do servidor
    function caminhoDe(k) { return k.split(SEP).map(descodificar).join('/'); }
    function diferenca(valor) {
      if (!servidor || !servidor.snapshot || typeof window.__fbUpdate !== 'function') return null;
      var sP = achatar(servidor.snapshot), nP = achatar(valor.snapshot), sT = servidor.camposTs || {}, nT = valor.camposTs || {};
      var patch = {}, n = 0, chaves = {};
      Object.keys(sP).forEach(function (k) { chaves[k] = 1; }); Object.keys(nP).forEach(function (k) { chaves[k] = 1; });
      Object.keys(chaves).forEach(function (k) {
        var a = vazio(sP[k]) ? null : sP[k], b = vazio(nP[k]) ? null : nP[k];
        if (JSON.stringify(a) !== JSON.stringify(b)) { patch['snapshot/' + caminhoDe(k)] = b; n++; }
      });
      Object.keys(nT).forEach(function (k) { if (sT[k] !== nT[k] && (nT[k] || sT[k])) { patch['camposTs/' + k] = nT[k]; n++; } });
      // Horas de valores já arquivados: saem do servidor (o registo está no arquivo).
      if (typeof cfg.esquecer === 'function') Object.keys(sT).forEach(function (k) { if (!(k in nT) && esquecido(descodificar(k), nP)) { patch['camposTs/' + k] = null; n++; } });
      if (!n) return {};
      // Um caminho dentro de outro (ex.: valor que passou a lista) não se pode
      // escrever por partes — envia o bloco completo.
      var cs = Object.keys(patch).sort();
      for (var i = 1; i < cs.length; i++) if (cs[i].indexOf(cs[i - 1] + '/') === 0) return null;
      patch.savedAt = valor.savedAt;
      return patch;
    }
    function escrever(obj) {
      if (typeof window.zeloQueueWrite !== 'function') return Promise.resolve();
      var savedAt = Date.now();
      // Só valores com conteúdo (ou apagados de propósito) seguem com hora.
      var tsEnv = {};
      Object.keys(meusTs).forEach(function (k) { tsEnv[k] = meusTs[k]; });
      var valor = { savedAt: savedAt, snapshot: obj, camposTs: tsParaServidor(tsEnv) };
      var patch = diferenca(valor);
      if (patch && !Object.keys(patch).length) return Promise.resolve(); // o servidor já tem tudo
      ultimoEnvio = savedAt;
      ultimoRemoto = JSON.parse(JSON.stringify(valor)); servidor = ultimoRemoto;
      var p = patch ? window.zeloQueueWrite(cfg.caminho, patch, 'update') : window.zeloQueueWrite(cfg.caminho, valor);
      return p.catch(function (e) { console.warn('ZELO: falha ao sincronizar', cfg.caminho, e); });
    }

    function pronto() { return window.__fbReady && typeof window.__fbGet === 'function'; }

    // Ler o servidor → juntar → aplicar aqui → enviar a versão junta.
    function sincronizar() {
      if (emCurso) { pendente = true; return emCurso; }
      emCurso = (async function () {
        // Garante que "emCurso" já está atribuído antes de o "finally" o
        // limpar (sem isto, uma sincronização sem esperas ficava presa).
        await Promise.resolve();
        try {
          var remoto = null;
          if (ouvindo) remoto = ultimoRemoto;
          else if (pronto()) { try { remoto = await window.__fbGet(cfg.caminho); servidor = remoto; } catch (e) { remoto = null; } }
          var res = juntar(remoto);
          aplicarLocal(res);
          if (res.mudouRemoto || !remoto) await escrever(cfg.obter());
        } finally {
          emCurso = null;
          if (pendente) { pendente = false; sincronizar(); }
        }
      })();
      return emCurso;
    }

    function guardou() {
      if (aplicando) return;
      registarAlteracoes();
      sincronizar();
    }

    async function iniciar() {
      registarAlteracoes();
      var inicio = Date.now();
      while (!pronto() && Date.now() - inicio < 30000) await new Promise(function (r) { setTimeout(r, 200); });
      if (!pronto()) return;
      if (typeof window.__fbListen !== 'function') { await sincronizar(); fimPrimeira(); return; }
      // Uma só leitura: a escuta em tempo real traz o valor atual logo ao
      // início e depois só as alterações.
      var primeira = true;
      window.__fbListen(cfg.caminho, function (remoto) {
        ultimoRemoto = remoto; servidor = remoto; ouvindo = true;
        if (primeira) { primeira = false; Promise.resolve(sincronizar()).then(fimPrimeira, fimPrimeira); return; }
        if (!remoto || Number(remoto.savedAt) === ultimoEnvio) return;
        var res = juntar(remoto);
        aplicarLocal(res);
        if (res.mudouRemoto) escrever(cfg.obter());
      });
    }

    // Grava uma limpeza autorizada (vários valores esvaziados de uma vez).
    function limpar() { permitirMassa = true; try { registarAlteracoes(); } finally { permitirMassa = false; } return sincronizar(); }
    return { iniciar: iniciar, guardou: guardou, sincronizar: sincronizar, limpar: limpar, primeiraSincronizacao: function () { return primeiraFeita; }, aplicando: function () { return aplicando; } };
  }

  window.ZeloSyncObjeto = { criar: criar, _achatar: achatar, _reconstruir: reconstruir };
})();
