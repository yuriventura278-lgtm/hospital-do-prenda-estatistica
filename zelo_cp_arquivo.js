// ── ZELO — Controlo de Pacientes: arquivo de saídas antigas ──
// Para poupar o limite de downloads do Firebase, os doentes que saíram há
// mais tempo saem do bloco que cada computador descarrega ao abrir a página e
// passam para um arquivo, lido só quando alguém precisa deles.
//
// • Arquivados: doentes com saída ANTES do 1.º dia do mês de há dois meses
//   (ex.: a 15 de novembro ficam na página as saídas de setembro, outubro e
//   novembro, e os internados). Internados nunca são arquivados.
// • Nada se apaga: primeiro grava-se a cópia completa no arquivo e confirma-se
//   no servidor (lendo-a de volta); só depois o doente sai do bloco da página.
//   registos_sistemas_locais/controlo_pacientes_saidas/<serviço>/<AAAA-MM>/<chave>
//   (+ índice por NUP e índice de nomes, para as pesquisas).
// • Lidos só quando é preciso: relatórios e Histórico Diário de meses
//   antigos, pesquisa por nome/NUP (Novo Paciente, Processo clínico) e o
//   processo de cada doente (internamentos anteriores).
// • Registos arquivados são só de consulta (a saída foi há mais de 2 meses).
// • O Movimento Hospitalar deixa de recalcular os meses anteriores ao arquivo
//   (ficam com os números que já tem) — ver zelo_mov_auto.js.
(function () {
  if (window.__zeloCpArquivo) return;
  window.__zeloCpArquivo = true;

  var BASE = 'registos_sistemas_locais/';
  var P_ARQ = BASE + 'controlo_pacientes_saidas/', P_NUP = BASE + 'controlo_pacientes_saidas_nup/', P_NOMES = BASE + 'controlo_pacientes_saidas_nomes';
  var POR_VEZ = 40, INTERVALO = 6 * 3600000;

  function pacientes() { try { return (typeof data !== 'undefined' && data && Array.isArray(data.patients)) ? data.patients : []; } catch (e) { return []; } }
  function slug() { try { return window.CP_UCI ? window.CP_UCI.slug : String(FB_PACIENTES_PATH).split('/').pop(); } catch (e) { return ''; } }
  function chave(p) { try { return _cpChave(p); } catch (e) { return p.nup ? 'nup_' + String(p.nup).trim() + (Number(p.episodio) > 1 ? '_e' + Number(p.episodio) : '') : 'n_' + p.n; } }
  function seguro(t) { return String(t).replace(/[.#$\[\]\/]/g, '_'); }
  function dia(iso) { return String(iso || '').slice(0, 10); }
  function norm(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  function quem() { try { return sessionStorage.getItem('zeloNome') || sessionStorage.getItem('zeloEmail') || ''; } catch (e) { return ''; } }
  function comLimite(p, ms) { return new Promise(function (res, rej) { var t = setTimeout(function () { rej(new Error('sem-resposta')); }, ms); Promise.resolve(p).then(function (v) { clearTimeout(t); res(v); }, function (e) { clearTimeout(t); rej(e); }); }); }
  function pronto() { return window.__fbReady && typeof window.__fbGet === 'function' && typeof window.__fbSet === 'function' && navigator.onLine !== false; }
  // 1.º dia do mês de há dois meses (as saídas antes desta data vão para o arquivo).
  function corte() { var d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 2); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-01'; }
  function arquivoAte() { try { return (data && data.arquivoAte) || ''; } catch (e) { return ''; } }
  function mesesEntre(de, ate) { // 'AAAA-MM' de..ate (inclusive)
    var l = [], y = +de.slice(0, 4), m = +de.slice(5, 7);
    while (true) { var k = y + '-' + String(m).padStart(2, '0'); if (k > ate) break; l.push(k); m++; if (m > 12) { m = 1; y++; } if (l.length > 240) break; }
    return l;
  }
  function mesAnterior(ym) { var y = +ym.slice(0, 4), m = +ym.slice(5, 7) - 1; if (!m) { m = 12; y--; } return y + '-' + String(m).padStart(2, '0'); }
  function redesenhar() { ['updateStats', 'renderInternados', 'updateDiagnosticsDatalist'].forEach(function (f) { try { if (typeof window[f] === 'function') window[f](); } catch (e) {} }); }

  // ── 1) Arquivar (só este serviço, com internet, de 6 em 6 horas por computador) ──
  var aArquivar = false;
  async function arquivar(forcar) {
    if (aArquivar || !pronto() || typeof data === 'undefined' || !data) return 0;
    var S = slug(), K = 'zeloCpArqUltimo_' + S;
    try { if (!forcar && Date.now() - Number(localStorage.getItem(K) || 0) < INTERVALO) return 0; } catch (e) {}
    aArquivar = true;
    var feitos = 0, c = corte();
    try {
      var cand = pacientes().filter(function (p) { return p && !p._arquivo && !p.anulado && p.status !== 'internado' && p.dataSaida && dia(p.dataSaida) < c; })
        .sort(function (a, b) { return String(a.dataSaida).localeCompare(String(b.dataSaida)); });
      for (var i = 0; i < cand.length && i < POR_VEZ; i++) {
        var p = cand[i], k = chave(p), mes = dia(p.dataSaida).slice(0, 7);
        var rec = JSON.parse(JSON.stringify(p));
        Object.assign(rec, { servico: rec.servico || S, arquivadoEm: new Date().toISOString(), arquivadoPor: quem(), mesSaida: mes });
        var caminho = P_ARQ + S + '/' + mes + '/' + k;
        // Cópia no arquivo, confirmada no servidor, antes de sair da página.
        await comLimite(window.__fbSet(caminho, rec), 15000);
        var volta = await comLimite(window.__fbGet(caminho), 15000);
        if (!volta || volta.nome !== rec.nome || volta.dataEntrada !== rec.dataEntrada || volta.dataSaida !== rec.dataSaida) throw new Error('cópia no arquivo não confirmada');
        if (p.nup) await comLimite(window.__fbSet(P_NUP + seguro(String(p.nup).trim()) + '/' + S + '__' + k, mes), 15000);
        var nn = norm(p.nome), partes = nn.split(' ');
        await comLimite(window.__fbSet(P_NOMES + '/' + S + '__' + k, { nome: p.nome || '', nomeNorm: nn, apelidoNorm: partes[partes.length - 1] || '', nup: p.nup || '', genero: p.genero || '', idade: p.idade == null ? '' : p.idade, dataEntrada: p.dataEntrada || '', dataSaida: p.dataSaida || '', servico: S, mes: mes, chave: k }), 15000);
        // Agora sim: sai do bloco da página (uma gravação por doente).
        data.arquivados = data.arquivados || {}; data.arquivados[k] = mes;
        var idx = data.patients.indexOf(p); if (idx >= 0) data.patients.splice(idx, 1);
        try { await saveData(); } catch (e) {}
        feitos++;
      }
      // Todas as saídas antes do corte já estão no arquivo: o Movimento deixa de recalcular esses meses.
      var resta = pacientes().some(function (p) { return p && !p._arquivo && !p.anulado && p.status !== 'internado' && p.dataSaida && dia(p.dataSaida) < c; });
      if (!resta && (!data.arquivoAte || data.arquivoAte < c)) { data.arquivoAte = c; try { await saveData(); } catch (e) {} }
      try { localStorage.setItem(K, String(resta ? 0 : Date.now())); } catch (e) {}
      if (feitos) redesenhar();
    } catch (e) {
      console.warn('ZELO arquivo: interrompido (tenta de novo mais tarde) —', e && e.message);
    } finally { aArquivar = false; }
    return feitos;
  }

  // ── 2) Ler o arquivo quando é preciso ──
  var mesesLidos = {};
  // Junta à página (só para consulta) os doentes arquivados com saída desde 'desde' (AAAA-MM-DD).
  function carregarDesde(desde) {
    var ate = arquivoAte(); if (!ate || !desde || desde >= ate) return Promise.resolve(0);
    if (typeof window.__fbGet !== 'function') return Promise.resolve(0);
    var S = slug(), ms = mesesEntre(desde.slice(0, 7), mesAnterior(ate.slice(0, 7))).filter(function (m) { return !mesesLidos[S + m]; });
    if (!ms.length) return Promise.resolve(0);
    if (typeof showFeedback === 'function') showFeedback('A ler o arquivo de saídas antigas (' + ms.length + ' mês/meses)…', 'info');
    return Promise.all(ms.map(function (m) {
      return comLimite(window.__fbGet(P_ARQ + S + '/' + m), 30000).then(function (v) { mesesLidos[S + m] = true; return v || {}; });
    })).then(function (ls) {
      var n = 0, lista = pacientes(), tem = {};
      lista.forEach(function (p) { tem[chave(p)] = 1; });
      ls.forEach(function (v) { Object.keys(v).forEach(function (k) { var p = v[k]; if (!p || tem[k] || p.anulado) return; p._arquivo = true; lista.push(p); tem[k] = 1; n++; }); });
      if (n) { lista.sort(function (a, b) { return (Number(a.n) || 0) - (Number(b.n) || 0); }); redesenhar(); }
      return n;
    }).catch(function (e) { if (typeof showFeedback === 'function') showFeedback('Não foi possível ler o arquivo — verifique a internet.', 'error'); throw e; });
  }
  window.zeloCpCarregarArquivo = carregarDesde;
  // Doentes arquivados de OUTRO serviço com saída desde 'desde' (ex.: vista UCI + CI).
  var cacheServ = {};
  window.zeloCpArquivoServico = function (S, desde) {
    if (!desde || typeof window.__fbGet !== 'function') return Promise.resolve([]);
    return comLimite(window.__fbGet(BASE + 'controlo_pacientes/' + S + '/snapshot/arquivoAte'), 15000).then(function (ate) {
      if (!ate || desde >= ate) return [];
      var ms = mesesEntre(desde.slice(0, 7), mesAnterior(String(ate).slice(0, 7)));
      return Promise.all(ms.map(function (m) {
        var k = S + m; if (cacheServ[k]) return cacheServ[k];
        return (cacheServ[k] = comLimite(window.__fbGet(P_ARQ + S + '/' + m), 30000).then(function (v) { return Object.keys(v || {}).map(function (x) { return v[x]; }).filter(function (p) { return p && !p.anulado; }); }, function () { delete cacheServ[k]; return []; }));
      })).then(function (ls) { return [].concat.apply([], ls); });
    }, function () { return []; });
  };

  // Internamentos arquivados de um NUP (todos os serviços) — para o processo clínico.
  window.zeloCpArquivoNUP = function (nup) {
    nup = String(nup == null ? '' : nup).trim(); if (!nup || typeof window.__fbGet !== 'function') return Promise.resolve([]);
    return comLimite(window.__fbGet(P_NUP + seguro(nup)), 20000).then(function (idx) {
      return Promise.all(Object.keys(idx || {}).map(function (id) {
        var i = id.indexOf('__'), S = id.slice(0, i), k = id.slice(i + 2), mes = idx[id];
        return window.__fbGet(P_ARQ + S + '/' + mes + '/' + k).then(function (p) {
          return p && String(p.nup || '').trim() === nup && !p.anulado ? Object.assign({}, p, { servico: S, _chave: k, _arquivo: true, _mes: mes }) : null;
        }, function () { return null; });
      }));
    }).then(function (l) { return (l || []).filter(Boolean); }, function () { return []; });
  };
  window.zeloCpArquivoCaminho = function (p) { return P_ARQ + (p.servico || slug()) + '/' + (p._mes || dia(p.dataSaida).slice(0, 7)) + '/' + (p._chave || chave(p)); };
  window.zeloCpArquivoIndices = function (p, nupNovo) {
    var S = p.servico || slug(), k = p._chave || chave(p), mes = p._mes || dia(p.dataSaida).slice(0, 7);
    return { nup: P_NUP + seguro(String(nupNovo || p.nup).trim()) + '/' + S + '__' + k, mes: mes, nomes: P_NOMES + '/' + S + '__' + k };
  };

  // Pesquisa por nome no arquivo (todos os serviços): começa pelo nome ou pelo apelido.
  var cacheNomes = {};
  window.zeloCpArquivoNomes = function (q) {
    q = norm(q); if (q.length < 3 || typeof window.__fbGetPorCampo !== 'function') return Promise.resolve([]);
    if (cacheNomes[q] && Date.now() - cacheNomes[q].ts < 10 * 60000) return Promise.resolve(cacheNomes[q].l);
    return Promise.all(['nomeNorm', 'apelidoNorm'].map(function (c) { return comLimite(window.__fbGetPorCampo(P_NOMES, c, q, q + '', 25), 20000).catch(function () { return null; }); }))
      .then(function (r) {
        var vistos = {}, l = [];
        r.forEach(function (v) { Object.keys(v || {}).forEach(function (id) { var x = v[id]; if (!x || vistos[id]) return; if (String(x.nomeNorm || '').indexOf(q) !== 0 && String(x.apelidoNorm || '').indexOf(q) !== 0) return; vistos[id] = 1; l.push(Object.assign({}, x, { _arquivo: true })); }); });
        cacheNomes[q] = { ts: Date.now(), l: l }; return l;
      });
  };

  // ── 3) Relatórios e Histórico Diário de meses antigos: lê o arquivo primeiro ──
  var ultimoBotao = null;
  document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('button'); if (b && !b.closest('.cpd-ov,.cpp-ov,.cpn-ov')) ultimoBotao = b; }, true);
  function envolver(nome, desdeDe, repetir) {
    var f = window[nome]; if (typeof f !== 'function' || f.__cpArq) return !!(f && f.__cpArq);
    var w = function () {
      var desde = null; try { desde = desdeDe.apply(this, arguments); } catch (e) {}
      var ate = arquivoAte();
      if (desde && ate && desde < ate) {
        var S = slug(), falta = mesesEntre(desde.slice(0, 7), mesAnterior(ate.slice(0, 7))).some(function (m) { return !mesesLidos[S + m]; });
        if (falta) { carregarDesde(desde).then(function () { repetir(); }, function () {}); }
      }
      return f.apply(this, arguments);
    };
    Object.keys(f).forEach(function (k) { w[k] = f[k]; }); w.__cpArq = true; window[nome] = w; return true;
  }
  function ligar() {
    // getRelatorioRange devolve {start,…}: lê o arquivo desde o início do período e repete.
    var g = window.getRelatorioRange, ok1 = true, ok2 = true;
    if (typeof g === 'function' && !g.__cpArq) {
      var w = function () {
        var r = g.apply(this, arguments), ate = arquivoAte();
        var ini = r && (r.start || r.inicio || r.de); ini = ini ? dia(ini instanceof Date ? ini.toISOString() : ini) : '';
        if (ini && ate && ini < ate) {
          var S = slug(), falta = mesesEntre(ini.slice(0, 7), mesAnterior(ate.slice(0, 7))).some(function (m) { return !mesesLidos[S + m]; });
          if (falta) {
            var bt = ultimoBotao;
            carregarDesde(ini).then(function () {
              try { if (typeof updateRelatorio === 'function') updateRelatorio(); } catch (e) {}
              if (bt && document.body.contains(bt) && !/relatorioTipo/.test(bt.id || '')) { try { bt.click(); } catch (e) {} }
            }, function () {});
          }
        }
        return r;
      };
      w.__cpArq = true; window.getRelatorioRange = w;
    } else ok1 = typeof g === 'function';
    ok2 = envolver('carregarHistoricoDiario', function () { var m = (document.getElementById('historicoMes') || {}).value; return m ? m + '-01' : null; }, function () { try { window.carregarHistoricoDiario(); } catch (e) {} });
    return ok1 && ok2;
  }

  // ── 4) Registos arquivados são só de consulta ──
  function soLeitura(nome, msg) {
    var f = window[nome]; if (typeof f !== 'function' || f.__cpArqRO) return !!(f && f.__cpArqRO);
    var w = function (n) {
      var p = pacientes().filter(function (q) { return String(q.n) === String(n); })[0];
      if (p && p._arquivo) { if (typeof showFeedback === 'function') showFeedback(msg, 'error'); return; }
      return f.apply(this, arguments);
    };
    Object.keys(f).forEach(function (k) { w[k] = f[k]; }); w.__cpArqRO = true; window[nome] = w; return true;
  }
  function ligarRO() {
    var m = 'Registo arquivado (saída há mais de 2 meses): só de consulta. Os dados pessoais podem ser corrigidos em «Editar dados pessoais».';
    return soLeitura('editPaciente', m) & soLeitura('deletePaciente', m) & soLeitura('cpRegistarSaidaDe', m);
  }

  var n = 0, iv = setInterval(function () {
    n++;
    var ok = ligar() & ligarRO();
    if (ok || n > 80) clearInterval(iv);
  }, 250);
  // Arquiva pouco depois de abrir (dá tempo à primeira sincronização) e quando a rede volta.
  setTimeout(function () { arquivar(false); }, 25000);
  window.addEventListener('online', function () { setTimeout(function () { arquivar(false); }, 15000); });
  window.ZeloCpArquivo = { arquivar: arquivar, carregarDesde: carregarDesde, corte: corte };
})();
