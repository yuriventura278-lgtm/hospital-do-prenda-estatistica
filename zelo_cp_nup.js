// ── ZELO — Controlo de Pacientes: Processo clínico, NUP único e regressos ──
// Partilhado pelas 8 páginas de Controlo de Pacientes.
// • Um NUP = um só doente (um processo). O mesmo doente pode voltar: cada
//   regresso é um novo internamento do MESMO processo (episodio 2, 3, …),
//   guardado à parte (chave nup_<NUP>_e2 …) — nada do anterior é alterado.
// • Não deixa registar: o NUP de outro doente (nome diferente), nem um
//   doente que já está internado — neste serviço ou em QUALQUER outro (um
//   doente só pode estar internado num serviço de cada vez; para mudar de
//   serviço, o serviço onde está regista primeiro a saída/transferência).
// • Cada internamento guarda o serviço onde foi feito. Se o doente sai e
//   volta, pode ser internado noutro serviço, e o processo mostra todos os
//   internamentos anteriores, de todos os serviços.
// • Registos eliminados (anulados) não aparecem em lado nenhum — ficam só
//   guardados no arquivo (nunca se apagam do servidor).
// • Processos nunca se apagam: "Anular registo" guarda uma cópia no arquivo
//   (registos_sistemas_locais/controlo_pacientes_arquivo/<serviço>) antes de
//   o tirar das listas e estatísticas; pode ser restaurado.
// • Menu "Processo clínico": pesquisa por nome ou NUP, neste serviço ou em
//   todos os serviços, com todos os internamentos de cada doente.
// • Novo Paciente: pesquisa por nome ou NUP para reutilizar o processo de
//   quem volta (preenche nome, NUP, género e idade).
(function () {
  if (window.__zeloCpNup) return;
  window.__zeloCpNup = true;

  var SERVICOS = [['medicina_interna', 'Medicina Interna'], ['cirurgia_geral', 'Cirurgia Geral'], ['ortopedia', 'Ortopedia'], ['neurocirurgia', 'Neurocirurgia'],
    ['maxilo_facial', 'Maxilo-Facial'], ['nefrologia', 'Nefrologia'], ['uci_intensivo', 'UCI — Intensivos'], ['uci_intermedio', 'Cuidados Intermédios']];
  var FUNCOES = { admin: 'Administrador', chefe_servico: 'Chefe de Serviço', enfermeiro_chefe: 'Enfermeiro(a) Chefe', enfermeiro: 'Enfermeiro(a)', secretario: 'Secretário(a)', medico: 'Médico(a)' };

  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function norm(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  function nupN(v) { return String(v == null ? '' : v).trim(); }
  function mesmoNome(a, b) {
    a = norm(a); b = norm(b); if (!a || !b) return true; if (a === b) return true;
    var x = a.split(' '), y = b.split(' ');
    return x[0] === y[0] && x[x.length - 1] === y[y.length - 1];
  }
  function pacientes() { try { return (typeof data !== 'undefined' && data && Array.isArray(data.patients)) ? data.patients : []; } catch (e) { return []; } }
  function slug() { try { return String(FB_PACIENTES_PATH).split('/').pop(); } catch (e) { return ''; } }
  function nomeServ(s) { var r = SERVICOS.filter(function (x) { return x[0] === s; })[0]; return r ? r[1] : s; }
  function fmt(iso) { var p = String(iso || '').slice(0, 10).split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : '—'; }
  function hora(iso) { var s = String(iso || ''); return s.length >= 16 ? ' ' + s.slice(11, 16) : ''; }
  function dias(a, b) { var d = Math.floor((new Date(String(b || '').slice(0, 10)) - new Date(String(a || '').slice(0, 10))) / 86400000); return isNaN(d) ? null : Math.max(0, d); }
  function hoje() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function chaveSegura(t) { return String(t).replace(/[.#$\[\]\/]/g, '_'); }

  // ── Arquivo (registos anulados) ──
  var LS_ARQ = function () { return 'cp_arquivo_' + slug(); };
  function arquivoLocal() { try { return JSON.parse(localStorage.getItem(LS_ARQ()) || '{}') || {}; } catch (e) { return {}; } }
  var arquivoRemoto = {};
  function arquivo() { var a = arquivoLocal(); Object.keys(arquivoRemoto).forEach(function (k) { if (!a[k]) a[k] = arquivoRemoto[k]; }); return a; }
  function quem() {
    var nome = '', role = '';
    try { nome = sessionStorage.getItem('zeloNome') || sessionStorage.getItem('zeloEmail') || ''; role = sessionStorage.getItem('zeloRole') || ''; } catch (e) {}
    return { nome: nome || 'Utilizador', funcao: FUNCOES[role] || role };
  }
  window.zeloCpArquivar = function (p) {
    if (!p) return;
    var q = quem(), agora = new Date(), iso = agora.toISOString();
    var copia = JSON.parse(JSON.stringify(p));
    copia.anuladoPor = q.nome; copia.anuladoFuncao = q.funcao; copia.anuladoEm = iso; copia.servico = slug();
    var chave = chaveSegura((p.nup ? 'nup_' + nupN(p.nup) : 'n_' + p.n) + '_ep' + (p.episodio || 1) + '_' + agora.getTime());
    var a = arquivoLocal(); a[chave] = copia;
    try { localStorage.setItem(LS_ARQ(), JSON.stringify(a)); } catch (e) {}
    try { if (typeof window.zeloQueueWrite === 'function') window.zeloQueueWrite('registos_sistemas_locais/controlo_pacientes_arquivo/' + slug() + '/' + chave, copia); } catch (e) {}
  };

  // ── Índice do hospital (todos os serviços), lido só quando é preciso ──
  var indice = null, indiceTs = 0, aCarregar = null;
  function lerIndice(forcar) {
    if (!forcar && indice && Date.now() - indiceTs < 10 * 60000) return Promise.resolve(indice);
    if (aCarregar) return aCarregar;
    if (typeof window.__fbGet !== 'function') return Promise.resolve(indice || []);
    aCarregar = Promise.all(SERVICOS.map(function (s) {
      return Promise.all([
        window.__fbGet('registos_sistemas_locais/controlo_pacientes/' + s[0] + '/snapshot/pacientes').catch(function () { return null; }),
        window.__fbGet('registos_sistemas_locais/controlo_pacientes_arquivo/' + s[0]).catch(function () { return null; })
      ]).then(function (r) {
        var l = [];
        Object.keys(r[0] || {}).forEach(function (k) { var p = r[0][k]; if (p && typeof p === 'object') l.push(Object.assign({}, p, { servico: s[0] })); });
        // Eliminados: não entram no índice (não aparecem); só contam para a numeração deste serviço.
        Object.keys(r[1] || {}).forEach(function (k) { var p = r[1][k]; if (p && typeof p === 'object' && s[0] === slug()) arquivoRemoto[k] = p; });
        return l;
      });
    })).then(function (ls) { indice = [].concat.apply([], ls); indiceTs = Date.now(); aCarregar = null; return indice; })
      .catch(function () { aCarregar = null; return indice || []; });
    return aCarregar;
  }
  // Todos os episódios conhecidos: os deste serviço (dados atuais, sempre
  // frescos) + os dos outros serviços (índice) + arquivo.
  function todos(incluirOutros) {
    var s = slug(), l = pacientes().map(function (p) { return Object.assign({}, p, { servico: s, _local: true }); });
    if (incluirOutros && indice) indice.forEach(function (p) { if (p.servico !== s) l.push(p); });
    return l;
  }

  // ── Internamentos deste NUP em todos os serviços (só as chaves desse NUP) ──
  // Lê em cada serviço só os registos nup_<NUP>, nup_<NUP>_e2… (poucos bytes).
  var porNUP = {};
  function internamentosNUP(nup, forcar) {
    nup = nupN(nup); if (!nup) return Promise.resolve([]);
    var c = porNUP[nup];
    if (c && !forcar && (c.p || Date.now() - c.ts < 60000)) return c.p || Promise.resolve(c.eps);
    var k = chaveSegura('nup_' + nup);
    var ler = function (s) {
      var base = 'registos_sistemas_locais/controlo_pacientes/' + s + '/snapshot/pacientes';
      if (typeof window.__fbGetRange === 'function') return window.__fbGetRange(base, k, k + '_e\uf8ff').catch(function () { return null; });
      return window.__fbGet(base + '/' + k).then(function (v) { var o = {}; if (v) o[k] = v; return o; }).catch(function () { return null; });
    };
    if (typeof window.__fbGet !== 'function') return Promise.resolve([]);
    var pr = Promise.all(SERVICOS.map(function (s) {
      return ler(s[0]).then(function (v) {
        return Object.keys(v || {}).map(function (kk) { return v[kk]; }).filter(function (p) { return p && typeof p === 'object' && nupN(p.nup) === nup && !p.anulado; })
          .map(function (p) { return Object.assign({}, p, { servico: s[0] }); });
      });
    })).then(function (ls) { var eps = [].concat.apply([], ls); porNUP[nup] = { ts: Date.now(), eps: eps }; return eps; })
      .catch(function () { porNUP[nup] = { ts: Date.now(), eps: [] }; return []; });
    porNUP[nup] = { ts: Date.now(), eps: (c && c.eps) || [], p: pr };
    pr.then(function () { if (porNUP[nup]) delete porNUP[nup].p; });
    return pr;
  }
  window.zeloCpInternamentosNUP = internamentosNUP;

  // Volta a tentar registar sozinho depois de uma verificação — uma só vez, e só
  // se a janela Novo Paciente continuar aberta com o mesmo NUP (evita repetições).
  var repetirPendente = null;
  function repetirDepois(promessa, nup) {
    if (repetirPendente === nup) return;
    repetirPendente = nup;
    promessa.then(function () {
      repetirPendente = null;
      var m = document.getElementById('novoModal'), f = document.getElementById('fNUP');
      if (!m || !m.classList.contains('active') || !f || nupN(f.value) !== nup) return;
      try { if (typeof addPaciente === 'function') addPaciente(); } catch (e) {}
    });
  }

  // ── Validação do NUP ──
  // Devolve { ok, msg, episodio, processo } — episodio > 1 = regresso.
  window.zeloCpValidarNUP = function (nup, nome, excluirN, soVerificar) {
    // soVerificar: chamada pelo aviso enquanto se escreve — nunca regista sozinha.
    nup = nupN(nup); if (!nup) return { ok: false, msg: 'Indique o NUP do doente.' };
    var mesmos = pacientes().filter(function (p) { return nupN(p.nup) === nup && (excluirN == null || p.n !== excluirN); });
    var outroNome = mesmos.filter(function (p) { return !mesmoNome(p.nome, nome); })[0];
    if (outroNome) return { ok: false, msg: 'O NUP ' + nup + ' pertence a ' + outroNome.nome + '. Cada NUP é de um só doente — verifique o número ou pesquise o doente pelo nome.' };
    // Os outros serviços ainda estão a ser lidos: espera e volta a tentar
    // sozinho (não deixa passar um NUP de outro doente por falta de dados).
    if (!indice && aCarregar && excluirN == null && !mesmos.length) {
      if (!soVerificar) repetirDepois(aCarregar, nup);
      return { ok: false, msg: 'A verificar o NUP ' + nup + ' nos outros serviços… o registo continua sozinho dentro de instantes.' };
    }
    var internado = mesmos.filter(function (p) { return p.status === 'internado'; })[0];
    if (internado) return { ok: false, msg: internado.nome + ' (NUP ' + nup + ') já está internado neste serviço desde ' + fmt(internado.dataEntrada) + '. Registe primeiro a saída.' };
    // Internado noutro serviço? Verifica sempre no servidor (dados frescos) antes de registar.
    if (excluirN == null) {
      var c = porNUP[nup];
      // Ao registar, a verificação tem de ser recente (o outro serviço pode ter
      // acabado de registar a saída); durante a escrita basta a do último minuto.
      if (!c || c.p || Date.now() - c.ts > (soVerificar ? 60000 : 5000)) {
        if (!soVerificar) repetirDepois(c && c.p ? c.p : internamentosNUP(nup, true), nup);
        else if (!(c && c.p)) internamentosNUP(nup, true);
        return { ok: false, msg: 'A verificar o NUP ' + nup + ' em todos os serviços… o registo continua sozinho dentro de instantes.' };
      }
      var outroDono = c.eps.filter(function (p) { return p.servico !== slug() && !mesmoNome(p.nome, nome); })[0];
      if (outroDono) return { ok: false, msg: 'O NUP ' + nup + ' pertence a ' + outroDono.nome + ' (' + nomeServ(outroDono.servico) + '). Cada NUP é de um só doente.' };
      var noutro = c.eps.filter(function (p) { return p.servico !== slug() && p.status === 'internado'; })[0];
      if (noutro) return { ok: false, msg: noutro.nome + ' (NUP ' + nup + ') está internado em ' + nomeServ(noutro.servico) + ' desde ' + fmt(noutro.dataEntrada) +
        '. Um doente não pode estar internado em dois serviços. Para o internar aqui, ' + nomeServ(noutro.servico) + ' tem de registar primeiro a saída (transferência).' };
    }
    // Ao alterar o NUP de um registo existente: também não pode ser o NUP de outro doente noutro serviço.
    if (excluirN != null) {
      var atual = pacientes().filter(function (p) { return p.n === excluirN; })[0];
      if (!atual || nupN(atual.nup) !== nup) {
        var cx = porNUP[nup];
        if (!cx || cx.p || Date.now() - cx.ts > 60000) { if (!(cx && cx.p)) internamentosNUP(nup, true); return { ok: false, msg: 'A verificar o NUP ' + nup + ' em todos os serviços… carregue em Guardar outra vez dentro de instantes.' }; }
        var od = cx.eps.filter(function (p) { return p.servico !== slug() && !mesmoNome(p.nome, nome); })[0];
        if (od) return { ok: false, msg: 'O NUP ' + nup + ' pertence a ' + od.nome + ' (' + nomeServ(od.servico) + '). Cada NUP é de um só doente.' };
        var oi = cx.eps.filter(function (p) { return p.servico !== slug() && p.status === 'internado'; })[0];
        if (oi && atual && atual.status === 'internado') return { ok: false, msg: oi.nome + ' (NUP ' + nup + ') está internado em ' + nomeServ(oi.servico) + '. Um doente não pode estar internado em dois serviços.' };
      }
    }
    if (indice) {
      var fora = indice.filter(function (p) { return p.servico !== slug() && !p.anulado && nupN(p.nup) === nup && !mesmoNome(p.nome, nome); })[0];
      if (fora) return { ok: false, msg: 'O NUP ' + nup + ' pertence a ' + fora.nome + ' (' + nomeServ(fora.servico) + '). Cada NUP é de um só doente.' };
    }
    var arq = arquivo(), maxEp = 0;
    mesmos.forEach(function (p) { maxEp = Math.max(maxEp, Number(p.episodio) || 1); });
    ((porNUP[nup] && porNUP[nup].eps) || []).forEach(function (p) { maxEp = Math.max(maxEp, Number(p.episodio) || 1); });
    Object.keys(arq).forEach(function (k) { var p = arq[k]; if (nupN(p.nup) === nup) maxEp = Math.max(maxEp, Number(p.episodio) || 1); });
    return { ok: true, episodio: maxEp ? maxEp + 1 : 1, processo: mesmos.length > 0 };
  };

  // ── Processos (agrupados por NUP) ──
  function processos(lista) {
    var g = {};
    lista.forEach(function (p) {
      if (p.anulado) return; // eliminados não aparecem
      var k = p.nup ? 'nup:' + nupN(p.nup) : 'n:' + p.servico + ':' + p.n;
      (g[k] = g[k] || { nup: nupN(p.nup), eps: [] }).eps.push(p);
    });
    return Object.keys(g).map(function (k) {
      var x = g[k];
      x.eps.sort(function (a, b) { return String(b.dataEntrada || '').localeCompare(String(a.dataEntrada || '')); });
      var ativo = x.eps.filter(function (p) { return !p.anulado; });
      x.ult = ativo[0] || x.eps[0];
      x.nome = x.ult.nome; x.genero = x.ult.genero; x.idade = x.ult.idade;
      x.internado = ativo.filter(function (p) { return p.status === 'internado'; })[0] || null;
      x.servicos = ativo.map(function (p) { return p.servico; }).filter(function (s, i, a) { return a.indexOf(s) === i; });
      return x;
    });
  }
  function procurar(q, incluirOutros) {
    var qn = norm(q), l = processos(todos(incluirOutros));
    if (qn) l = l.filter(function (x) { return norm(x.nome + ' ' + x.nup).indexOf(qn) >= 0 || x.eps.some(function (p) { return norm(p.nome).indexOf(qn) >= 0; }); });
    return l.sort(function (a, b) { return (b.internado ? 1 : 0) - (a.internado ? 1 : 0) || String(b.ult.dataEntrada || '').localeCompare(String(a.ult.dataEntrada || '')); });
  }
  function estadoTxt(x) {
    if (x.internado) return '<span class="cpn-e int">Internado · ' + esc(nomeServ(x.internado.servico)) + '</span>';
    var u = x.eps.filter(function (p) { return !p.anulado; })[0];
    if (!u) return '<span class="cpn-e anu">Só registos anulados</span>';
    return '<span class="cpn-e sai">Saiu ' + fmt(u.dataSaida) + (u.tipoSaida ? ' · ' + esc(u.tipoSaida) : '') + '</span>';
  }

  var css = document.createElement('style');
  css.textContent = [
    '.cpn-ov{position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:2147483600;display:none;align-items:flex-start;justify-content:center;padding:24px 14px;overflow:auto}',
    '.cpn-ov.on{display:flex}',
    '.cpn-card{background:#fff;border-radius:18px;width:min(1100px,100%);box-shadow:0 24px 60px rgba(15,23,42,.35);overflow:hidden;font-family:Inter,"Segoe UI",Arial,sans-serif;color:#0F172A}',
    '.cpn-top{background:linear-gradient(90deg,#1E3A5F,#2B5A8A);color:#fff;padding:16px 20px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}',
    '.cpn-top h3{margin:0;font-size:1.15rem;font-weight:800}.cpn-top small{display:block;opacity:.8;font-size:.8rem;margin-top:2px}',
    '.cpn-top .x{margin-left:auto;width:36px;height:36px;border-radius:10px;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.1);color:#fff;font-size:1.2rem;cursor:pointer}',
    '.cpn-barra{display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:14px 20px;border-bottom:1px solid #E3E8F0}',
    '.cpn-q{flex:1;min-width:220px;display:flex;align-items:center;gap:8px;border:1.5px solid #D6E0EC;border-radius:12px;padding:0 12px;height:44px;background:#F8FAFC}',
    '.cpn-q input{border:0;background:transparent;outline:none;font:600 .95rem Inter,Arial,sans-serif;width:100%;color:#0F172A}',
    '.cpn-seg{display:flex;background:#F1F5F9;border-radius:11px;padding:3px}.cpn-seg button{border:0;background:transparent;border-radius:8px;padding:8px 12px;font:700 .8rem Inter,Arial,sans-serif;color:#475569;cursor:pointer}.cpn-seg button.on{background:#1E3A5F;color:#fff}',
    '.cpn-info{font:600 .8rem Inter,Arial,sans-serif;color:#64748B}',
    '.cpn-body{max-height:calc(100vh - 220px);overflow:auto}',
    '.cpn-t{width:100%;border-collapse:collapse;font-size:.88rem}',
    '.cpn-t th{position:sticky;top:0;background:#F8FAFC;text-align:left;font:800 .66rem Inter,Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#64748B;padding:10px 12px;border-bottom:1px solid #E3E8F0}',
    '.cpn-t td{padding:10px 12px;border-bottom:1px solid #EEF2F7;vertical-align:middle}',
    '.cpn-t tr:hover td{background:#F4F8FC}',
    '.cpn-nup{font:700 .84rem ui-monospace,Consolas,monospace;color:#1E3A5F;background:#EEF4FB;border-radius:6px;padding:2px 7px}',
    '.cpn-e{display:inline-block;font:800 .72rem Inter,Arial,sans-serif;border-radius:999px;padding:4px 10px;white-space:nowrap}',
    '.cpn-id .cpn-e{white-space:normal;line-height:1.3}',
    '.cpn-e.int{background:#ECFDF5;color:#047857}.cpn-e.sai{background:#F1F5F9;color:#475569}.cpn-e.anu{background:#FEF2F2;color:#B91C1C}',
    '.cpn-bt{border:1px solid #D6E0EC;background:#fff;color:#1E3A5F;border-radius:9px;padding:6px 11px;font:700 .8rem Inter,Arial,sans-serif;cursor:pointer;white-space:nowrap}',
    '.cpn-bt.p{background:#1E3A5F;color:#fff;border-color:#1E3A5F}.cpn-bt.v{color:#047857;border-color:#A7F3D0;background:#ECFDF5}',
    '.cpn-vazio{padding:30px;text-align:center;color:#64748B}',
    '.cpn-det{padding:16px 20px}',
    '.cpn-id{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:14px}',
    '.cpn-id div{background:#F4F7FB;border-radius:12px;padding:10px 12px}.cpn-id span{display:block;font:800 .64rem Inter,Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#64748B}.cpn-id b{font-size:.98rem}',
    '.cpn-ep{border:1px solid #E3E8F0;border-left:4px solid var(--c,#94A3B8);border-radius:12px;padding:10px 14px;margin-bottom:8px;display:flex;gap:12px;align-items:center;flex-wrap:wrap}',
    '.cpn-ep .t{flex:1;min-width:220px}.cpn-ep .t b{font-size:.94rem}.cpn-ep .t div{font-size:.82rem;color:#475569;margin-top:3px}',
    '.cpn-ep.anu{background:#FFF7F7}',
    // Novo Paciente: pesquisa e aviso do NUP
    '.cpn-procura{background:#F4F8FC;border:1px solid #D6E2F0;border-radius:12px;padding:10px 12px;margin-bottom:12px}',
    '.cpn-procura label{display:block;font:800 .7rem Inter,Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#1E3A5F;margin-bottom:6px}',
    '.cpn-procura input{width:100%;box-sizing:border-box;border:1.5px solid #D6E0EC;border-radius:10px;padding:9px 12px;font:600 .92rem Inter,Arial,sans-serif}',
    '.cpn-res{margin-top:6px;display:flex;flex-direction:column;gap:4px;max-height:220px;overflow:auto}',
    '.cpn-res button{display:flex;gap:10px;align-items:center;text-align:left;border:1px solid #E3E8F0;background:#fff;border-radius:10px;padding:8px 10px;cursor:pointer;font:500 .86rem Inter,Arial,sans-serif;color:#0F172A}',
    '.cpn-res button:hover{border-color:#2B5A8A;background:#EEF4FB}.cpn-res small{color:#64748B;display:block}',
    '.cpn-nupinfo{font:700 .78rem Inter,Arial,sans-serif;margin-top:5px;border-radius:8px;padding:6px 9px}',
    '.cpn-nupinfo.ok{background:#ECFDF5;color:#047857}.cpn-nupinfo.reg{background:#EEF4FB;color:#1E3A5F}.cpn-nupinfo.er{background:#FEF2F2;color:#B91C1C}',
    '.cpn-regresso{background:#EEF4FB;border:1px solid #BFD3EA;color:#1E3A5F;border-radius:10px;padding:8px 10px;font:700 .82rem Inter,Arial,sans-serif;margin-bottom:10px}',
    '@media(max-width:700px){.cpn-ov{padding:0}.cpn-card{border-radius:0;min-height:100vh}.cpn-body{max-height:none}.cpn-t thead{display:none}.cpn-t tr{display:block;border-bottom:1px solid #E3E8F0;padding:8px 4px}.cpn-t td{display:inline-block;border:0;padding:3px 8px}}'
  ].join('\n');
  document.head.appendChild(css);

  // ── Janela "Processo clínico" ──
  var ov = null, vista = { q: '', todos: false };
  function janela() {
    if (ov) return ov;
    ov = document.createElement('div'); ov.className = 'cpn-ov'; ov.id = 'cpn-processos';
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('[data-cpn-fechar]')) { ov.classList.remove('on'); return; }
      var b = e.target.closest('[data-cpn]'); if (!b) return;
      var a = b.dataset.cpn;
      if (a === 'este' || a === 'todos') { vista.todos = a === 'todos'; if (vista.todos) { lista(true); lerIndice().then(function () { lista(); }); } else lista(); }
      else if (a === 'abrir') detalhe(b.dataset.k);
      else if (a === 'voltar') lista();
      else if (a === 'ep') { ov.classList.remove('on'); if (window.ZeloCpProcesso) window.ZeloCpProcesso.abrir(+b.dataset.n); }
      else if (a === 'regresso') { ov.classList.remove('on'); regresso(b.dataset.k); }
      else if (a === 'restaurar') restaurar(b.dataset.arq);
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ov.classList.contains('on')) ov.classList.remove('on'); });
    return ov;
  }
  function abrirProcessos() {
    janela(); vista.q = ''; lista(); ov.classList.add('on');
    lerIndice().then(function () { if (ov.classList.contains('on') && vista.todos) lista(); });
    setTimeout(function () { var i = ov.querySelector('#cpn-q'); if (i) i.focus(); }, 50);
  }
  function topo(sub) {
    return '<div class="cpn-top"><div><h3>Processo clínico</h3><small>' + sub + '</small></div><button type="button" class="x" data-cpn-fechar aria-label="Fechar">×</button></div>';
  }
  var ultimaLista = [];
  function lista(aCarregarTodos) {
    var l = procurar(vista.q, vista.todos); ultimaLista = l;
    var h = topo('Todos os doentes — os processos nunca se apagam, mesmo depois da saída') +
      '<div class="cpn-barra"><label class="cpn-q"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><input id="cpn-q" type="text" placeholder="Pesquisar por nome ou NUP…" autocomplete="off" value="' + esc(vista.q) + '"></label>' +
      '<div class="cpn-seg"><button type="button" data-cpn="este" class="' + (vista.todos ? '' : 'on') + '">Este serviço</button><button type="button" data-cpn="todos" class="' + (vista.todos ? 'on' : '') + '">Todos os serviços</button></div>' +
      '<span class="cpn-info">' + (aCarregarTodos ? 'A ler os outros serviços…' : l.length + (l.length === 1 ? ' processo' : ' processos')) + '</span></div><div class="cpn-body">';
    if (!l.length) h += '<div class="cpn-vazio">' + (vista.q ? 'Nenhum processo encontrado para «' + esc(vista.q) + '».' : 'Ainda não há processos.') + '</div>';
    else {
      h += '<table class="cpn-t"><thead><tr><th>NUP</th><th>Nome</th><th>Género · Idade</th><th>Internamentos</th><th>Última entrada</th><th>Estado</th><th></th></tr></thead><tbody>';
      l.slice(0, 300).forEach(function (x, i) {
        var n = x.eps.filter(function (p) { return !p.anulado; }).length;
        h += '<tr><td><span class="cpn-nup">' + esc(x.nup || '—') + '</span></td><td><b>' + esc(x.nome) + '</b></td><td>' + esc(x.genero || '—') + (x.idade ? ' · ' + esc(x.idade) + ' anos' : '') + '</td>' +
          '<td>' + n + (x.servicos.length > 1 || (x.servicos[0] && x.servicos[0] !== slug()) ? ' <small style="color:#64748B">(' + x.servicos.map(nomeServ).join(', ') + ')</small>' : '') + '</td>' +
          '<td>' + fmt(x.ult.dataEntrada) + '</td><td>' + estadoTxt(x) + '</td><td><button type="button" class="cpn-bt p" data-cpn="abrir" data-k="' + i + '">Abrir processo</button></td></tr>';
      });
      h += '</tbody></table>';
    }
    ov.innerHTML = '<div class="cpn-card" role="dialog" aria-label="Processo clínico">' + h + '</div></div>';
    var q = ov.querySelector('#cpn-q');
    q.addEventListener('input', function () { vista.q = q.value; var pos = q.selectionStart; lista(); var n = ov.querySelector('#cpn-q'); n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} });
  }
  function detalhe(i) {
    var x = ultimaLista[+i]; if (!x) return;
    var eps = x.eps.slice().sort(function (a, b) { return String(a.dataEntrada || '').localeCompare(String(b.dataEntrada || '')); });
    var h = topo('NUP ' + esc(x.nup || '—') + ' · ' + esc(x.nome)) + '<div class="cpn-det">' +
      '<div class="cpn-id"><div><span>Nome</span><b>' + esc(x.nome) + '</b></div><div><span>NUP</span><b>' + esc(x.nup || '—') + '</b></div><div><span>Género</span><b>' + esc(x.genero || '—') + '</b></div>' +
      '<div><span>Idade (último registo)</span><b>' + (x.idade ? esc(x.idade) + ' anos' : '—') + '</b></div><div><span>Internamentos</span><b>' + eps.filter(function (p) { return !p.anulado; }).length + '</b></div><div><span>Estado</span><b>' + estadoTxt(x) + '</b></div></div>' +
      '<h4 style="margin:6px 0 10px;font:800 .8rem Inter,Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#1E3A5F">Todos os internamentos</h4>';
    eps.forEach(function (p, k) {
      var cor = p.anulado ? '#DC2626' : p.status === 'internado' ? '#16A34A' : p.tipoSaida === 'Óbito' ? '#475569' : p.tipoSaida === 'Transferência' ? '#7C3AED' : '#0891B2';
      var nd = p.status === 'internado' ? dias(p.dataEntrada, hoje()) : dias(p.dataEntrada, p.dataSaida);
      var dg = window.zeloCpDiagnosticos ? window.zeloCpDiagnosticos(p).map(function (d) { return d.nome + (d.cid ? ' (' + d.cid + ')' : ''); }).join('; ') : (p.diagnostico || '');
      h += '<div class="cpn-ep' + (p.anulado ? ' anu' : '') + '" style="--c:' + cor + '"><div class="t"><b>' + (k + 1) + 'º internamento · ' + esc(nomeServ(p.servico)) + '</b>' +
        '<div>Entrada ' + fmt(p.dataEntrada) + hora(p.dataEntrada) + (p.status === 'internado' ? ' · ainda internado' : ' · Saída ' + fmt(p.dataSaida) + hora(p.dataSaida) + (p.tipoSaida ? ' (' + esc(p.tipoSaida) + (p.subtipo ? ' — ' + esc(p.subtipo) : '') + ')' : '')) + (nd != null ? ' · ' + nd + ' dia(s)' : '') + '</div>' +
        (dg ? '<div>Diagnóstico: ' + esc(dg) + '</div>' : '') +
        (p.registadoPor ? '<div>Registado por ' + esc(p.registadoPor) + (p.saidaRegistadaPor ? ' · saída por ' + esc(p.saidaRegistadaPor) : '') + '</div>' : '') +
        (p.anulado ? '<div style="color:#B91C1C;font-weight:700">Registo anulado' + (p.anuladoPor ? ' por ' + esc(p.anuladoPor) : '') + (p.anuladoEm ? ' em ' + fmt(p.anuladoEm) : '') + ' — guardado no arquivo</div>' : '') + '</div>' +
        (p._local && !p.anulado ? '<button type="button" class="cpn-bt" data-cpn="ep" data-n="' + p.n + '">Ver ficha</button>' : '') +
        '</div>';
    });
    var aqui = x.eps.filter(function (p) { return p.servico === slug() && !p.anulado && p.status === 'internado'; })[0];
    h += '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end;margin-top:12px"><button type="button" class="cpn-bt" data-cpn="voltar">‹ Voltar à lista</button>' +
      (!aqui ? '<button type="button" class="cpn-bt p" data-cpn="regresso" data-k="' + i + '">＋ Novo internamento neste serviço (regresso)</button>' : '') + '</div></div>';
    ov.innerHTML = '<div class="cpn-card" role="dialog" aria-label="Processo clínico">' + h + '</div>';
  }
  function idadeAtual(p) {
    var i = parseInt(p.idade, 10); if (isNaN(i)) return '';
    var ano = parseInt(String(p.dataEntrada || '').slice(0, 4), 10);
    return ano ? i + Math.max(0, new Date().getFullYear() - ano) : i;
  }
  function preencherNovo(p) {
    var set = function (id, v) { var e = document.getElementById(id); if (e && v != null && v !== '') { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); } };
    set('fNome', p.nome); set('fNUP', nupN(p.nup)); set('fGenero', p.genero); set('fIdade', idadeAtual(p));
    // Saiu do último internamento por transferência: a proveniência é esse serviço
    // (confirmado no servidor — o índice pode ser de antes da saída).
    var provDe = function (u) {
      var prov = document.getElementById('fProveniencia');
      if (!prov || prov.value || !u || u.status === 'internado' || !/transfer/i.test(u.tipoSaida || '') || !u.servico || u.servico === slug()) return;
      var alvo = norm(nomeServ(u.servico).replace(/UCI — Intensivos/, 'UCI'));
      var op = [].slice.call(prov.options).filter(function (o) { return /^Transfer/.test(o.value) && norm(o.textContent) === alvo; })[0];
      if (op) set('fProveniencia', op.value);
    };
    if (p.nup) internamentosNUP(p.nup, true).then(function (eps) {
      var f = document.getElementById('fNUP'); if (!f || nupN(f.value) !== nupN(p.nup)) return;
      var u = eps.slice().sort(function (a, b) { return String(b.dataEntrada || '').localeCompare(String(a.dataEntrada || '')); })[0];
      provDe(u || p);
    });
    else provDe(p);
    verificarNUP();
  }
  function regresso(i) {
    var x = ultimaLista[+i]; if (!x) return;
    try { openModal('novoModal'); } catch (e) {}
    setTimeout(function () { preencherNovo(x.ult); }, 60);
  }
  function restaurar(k) {
    var a = arquivo(), p = a[k]; if (!p) return;
    if (!confirm('Restaurar este registo de ' + p.nome + ' para a lista do serviço?')) return;
    var copia = JSON.parse(JSON.stringify(p));
    ['anuladoPor', 'anuladoFuncao', 'anuladoEm', 'servico', 'anulado', '_arq', '_local'].forEach(function (c) { delete copia[c]; });
    var v = window.zeloCpValidarNUP(copia.nup, copia.nome, null);
    if (!v.ok && copia.status === 'internado') { alert(v.msg); return; }
    if (pacientes().some(function (q) { return nupN(q.nup) === nupN(copia.nup) && (Number(q.episodio) || 1) === (Number(copia.episodio) || 1); })) copia.episodio = v.episodio || 2;
    if (pacientes().some(function (q) { return q.n === copia.n; })) copia.n = data.nextN++;
    copia.restauradoPor = quem().nome; copia.restauradoEm = new Date().toISOString();
    data.patients.push(copia);
    var la = arquivoLocal(); if (la[k]) { la[k].restaurado = true; try { localStorage.setItem(LS_ARQ(), JSON.stringify(la)); } catch (e) {} }
    try { saveData(); updateStats(); renderInternados(); } catch (e) {}
    if (typeof showFeedback === 'function') showFeedback('Registo restaurado', 'success');
    lista();
  }

  // ── Menu lateral: "Processo clínico" ──
  function menu() {
    var l = document.querySelector('.cpx-side .cpx-lista');
    if (!l) return false;
    if (document.getElementById('cpn-menu')) return true;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'cpx-item'; b.id = 'cpn-menu';
    b.innerHTML = '<svg class="cpx-ic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><circle cx="11.5" cy="14.5" r="2.5"/><path d="m13.3 16.3 1.7 1.7"/></svg>Processo clínico';
    b.addEventListener('click', function (e) { e.stopPropagation(); abrirProcessos(); var side = document.querySelector('.cpx-side'); if (side) side.classList.remove('aberto'); var f = document.querySelector('.cpx-fundo'); if (f) f.classList.remove('aberto'); });
    var ref = l.children[1]; l.insertBefore(b, ref || null);
    return true;
  }

  // ── Novo Paciente: pesquisa por nome/NUP e verificação do NUP ──
  function novoModal() {
    var m = document.getElementById('novoModal'), corpo = m && m.querySelector('.modal-body');
    if (!corpo || document.getElementById('cpn-procura')) return !!corpo;
    var box = document.createElement('div'); box.className = 'cpn-procura'; box.id = 'cpn-procura';
    box.innerHTML = '<label for="cpn-procura-q">O doente já esteve internado? Procure o processo por nome ou NUP</label><input type="text" id="cpn-procura-q" placeholder="Nome ou NUP do doente…" autocomplete="off"><div class="cpn-res" id="cpn-res"></div>';
    corpo.insertBefore(box, corpo.firstChild);
    var q = box.querySelector('input'), res = box.querySelector('#cpn-res'), achados = [];
    q.addEventListener('input', function () {
      var t = q.value.trim(); if (t.length < 2) { res.innerHTML = ''; return; }
      achados = procurar(t, true).slice(0, 8);
      res.innerHTML = achados.length ? achados.map(function (x, i) {
        return '<button type="button" data-i="' + i + '"><span class="cpn-nup">' + esc(x.nup || '—') + '</span><span><b>' + esc(x.nome) + '</b><small>' + esc(x.genero || '') + (x.idade ? ' · ' + esc(x.idade) + ' anos' : '') + ' · ' + x.eps.filter(function (p) { return !p.anulado; }).length + ' internamento(s) · ' + (x.internado ? 'internado em ' + esc(nomeServ(x.internado.servico)) : 'última entrada ' + fmt(x.ult.dataEntrada)) + '</small></span></button>';
      }).join('') : '<div class="cpn-info" style="padding:4px 2px">Sem processo com esse nome ou NUP — é um doente novo.</div>';
    });
    res.addEventListener('click', function (e) { var b = e.target.closest('button[data-i]'); if (!b) return; preencherNovo(achados[+b.dataset.i].ult); res.innerHTML = ''; q.value = ''; });
    var nup = document.getElementById('fNUP'), nome = document.getElementById('fNome');
    if (nup) {
      var info = document.createElement('div'); info.id = 'cpn-nupinfo'; info.className = 'cpn-nupinfo'; info.style.display = 'none';
      nup.parentNode.appendChild(info);
      nup.addEventListener('input', verificarNUP); nup.addEventListener('blur', verificarNUP);
      if (nome) nome.addEventListener('blur', verificarNUP);
    }
    return true;
  }
  // Lista curta dos internamentos anteriores (todos os serviços) para o aviso do Novo Paciente.
  function resumoEps(eps) {
    eps = eps.slice().sort(function (a, b) { return String(a.dataEntrada || '').localeCompare(String(b.dataEntrada || '')); });
    return eps.map(function (p, i) {
      return (i + 1) + 'º ' + nomeServ(p.servico) + ': ' + fmt(p.dataEntrada) + (p.status === 'internado' ? ' — ainda internado' : ' → ' + fmt(p.dataSaida) + (p.tipoSaida ? ' (' + p.tipoSaida + ')' : '')) +
        (p.diagnostico ? ' · ' + p.diagnostico : '');
    });
  }
  var tVerif = null;
  function verificarNUP() {
    var nup = document.getElementById('fNUP'), nome = document.getElementById('fNome'), info = document.getElementById('cpn-nupinfo');
    if (!nup || !info) return;
    var v = nupN(nup.value); if (!v) { info.style.display = 'none'; return; }
    // Consulta os internamentos deste NUP em todos os serviços (dados frescos) e volta a mostrar.
    var c = porNUP[v];
    if (!c || (!c.p && Date.now() - c.ts > 60000)) { clearTimeout(tVerif); tVerif = setTimeout(function () { internamentosNUP(v, true).then(function () { if (nupN(nup.value) === v) verificarNUP(); }); }, 350); }
    var eps = (porNUP[v] && porNUP[v].eps) || [];
    var noutro = eps.filter(function (p) { return p.servico !== slug() && p.status === 'internado'; })[0];
    if (noutro && c && !c.p && Date.now() - c.ts > 5000) { clearTimeout(tVerif); tVerif = setTimeout(function () { internamentosNUP(v, true).then(function () { if (nupN(nup.value) === v) verificarNUP(); }); }, 350); }
    if (noutro) {
      info.style.display = 'block'; info.className = 'cpn-nupinfo er';
      info.innerHTML = esc(noutro.nome) + ' está internado em <b>' + esc(nomeServ(noutro.servico)) + '</b> desde ' + fmt(noutro.dataEntrada) + '. Não pode ser internado em dois serviços — ' + esc(nomeServ(noutro.servico)) + ' tem de registar primeiro a saída (transferência).';
      return;
    }
    var r = window.zeloCpValidarNUP(v, nome ? nome.value : '', null, true);
    var dono = procurar(v, true).filter(function (x) { return x.nup === v; })[0];
    info.style.display = 'block';
    if (!r.ok) { info.className = 'cpn-nupinfo er'; info.textContent = r.msg; }
    else if (dono || eps.length) {
      var todosEps = eps.slice(); pacientes().forEach(function (p) { if (nupN(p.nup) === v && !todosEps.some(function (q) { return q.servico === slug() && q.n === p.n; })) todosEps.push(Object.assign({}, p, { servico: slug() })); });
      var nm = dono ? dono.nome : (todosEps[0] && todosEps[0].nome);
      info.className = 'cpn-nupinfo reg';
      var l = resumoEps(todosEps);
      info.innerHTML = 'Processo existente: <b>' + esc(nm) + '</b> — será registado como novo internamento do mesmo processo clínico. Os dados do doente, os internamentos anteriores e as evoluções de todos os serviços ficam visíveis na ficha (só leitura); este serviço acrescenta os seus.' +
        (l.length ? '<div style="margin-top:6px;font-weight:600">Internamentos anteriores (' + l.length + '):<br>' + l.map(esc).join('<br>') + '</div>' : '');
      if (nome && !nome.value.trim() && nm) { nome.value = nm; }
    }
    else { info.className = 'cpn-nupinfo ok'; info.textContent = 'NUP novo — será aberto um processo clínico.'; }
  }

  // Dois serviços a internar o mesmo doente no mesmo instante (antes de um ver o
  // registo do outro): volta a verificar no servidor pouco depois de registar e
  // avisa, para o serviço que registou por último corrigir (nada se apaga).
  function confirmarUnico(p, S) {
    setTimeout(function () {
      internamentosNUP(p.nup, true).then(function (eps) {
        var outro = eps.filter(function (q) { return q.servico !== S && q.status === 'internado'; })[0];
        if (!outro || p.status !== 'internado') return;
        var ta = String(outro.registadoEm || outro.dataEntrada || ''), tb = String(p.registadoEm || p.dataEntrada || ''), primeiroOutro = ta < tb || (ta === tb && outro.servico < S);
        alert('Atenção: ' + (p.nome || 'o doente') + ' (NUP ' + nupN(p.nup) + ') também foi internado em ' + nomeServ(outro.servico) + ' (' + fmt(outro.dataEntrada) + ').\n\n' +
          'Um doente só pode estar internado num serviço de cada vez. ' + (primeiroOutro ? 'O outro serviço registou primeiro: anule este registo (Atualizar dados › Anular registo) ou peça a ' + nomeServ(outro.servico) + ' para registar a saída (transferência).' : 'Este serviço registou primeiro: ' + nomeServ(outro.servico) + ' tem de corrigir o registo dele.'));
      });
    }, 3000);
  }

  // Cada internamento guarda o serviço onde foi feito (fica no próprio registo).
  function ligarServico() {
    var f = window.addPaciente; if (typeof f !== 'function') return false; if (f.__cpnServ) return true;
    var novo = function () {
      var antes = pacientes().length, r = f.apply(this, arguments);
      try {
        var l = pacientes();
        if (l.length > antes) {
          var S = window.CP_UCI ? window.CP_UCI.slug : slug();
          l.slice(antes).forEach(function (p) { if (!p.servico) { p.servico = S; p.servicoNome = nomeServ(S); } });
          if (typeof saveData === 'function') saveData();
          l.slice(antes).forEach(function (p) { if (p.nup) confirmarUnico(p, S); });
        }
      } catch (e) {}
      return r;
    };
    novo.__cpnServ = true; Object.keys(f).forEach(function (k) { if (!(k in novo)) novo[k] = f[k]; });
    window.addPaciente = novo; return true;
  }

  // Ao abrir o Novo Paciente: lê os outros serviços (uma vez a cada 10 min) para validar o NUP.
  function ligarAbrir() {
    var f = window.openModal; if (typeof f !== 'function' || f.__cpn) return !!(f && f.__cpn);
    var novo = function (id) {
      var r = f.apply(this, arguments);
      if (id === 'novoModal') { novoModal(); var i = document.getElementById('cpn-nupinfo'); if (i) i.style.display = 'none'; lerIndice(); }
      return r;
    };
    novo.__cpn = true; novo.__cpProc = f.__cpProc; window.openModal = novo; return true;
  }

  var n = 0, iv = setInterval(function () {
    n++;
    var ok = menu() & novoModal() & ligarAbrir() & ligarServico();
    if (ok || n > 80) clearInterval(iv);
  }, 250);
  window.ZeloCpNup = { abrir: abrirProcessos, procurar: procurar, lerIndice: lerIndice };
})();
