// ── ZELO — Controlo de Pacientes: dados pessoais do doente (partilhados) ──
// Os dados pessoais pertencem ao doente, não a um internamento: qualquer
// utilizador, em qualquer serviço, pode atualizá-los (nome, idade, género e
// alergias). A alteração é aplicada a TODOS os internamentos desse NUP, em
// todos os serviços — os dados clínicos de cada internamento continuam a
// ser alterados só pelo serviço a que pertencem.
// • Nos outros serviços escreve-se só esses campos, com a hora de cada campo
//   (camposTs), no mesmo formato da sincronização campo a campo: quem tiver
//   a página aberta recebe a alteração sem perder nada do que está a fazer.
// • Nada se perde: cada alteração fica no histórico do processo
//   (controlo_pacientes_processos/<NUP>/historico) com os valores antes e
//   depois, quem alterou, a função, o serviço e a hora.
(function () {
  if (window.__zeloCpDadosPessoais) return;
  window.__zeloCpDadosPessoais = true;

  var BASE = 'registos_sistemas_locais/controlo_pacientes/';
  var FUNCOES = { admin: 'Administrador', chefe_servico: 'Chefe de Serviço', enfermeiro_chefe: 'Enfermeiro(a) Chefe', enfermeiro: 'Enfermeiro(a)', secretario: 'Secretário(a)', medico: 'Médico(a)' };
  var NOMES = { medicina_interna: 'Medicina Interna', cirurgia_geral: 'Cirurgia Geral', ortopedia: 'Ortopedia', neurocirurgia: 'Neurocirurgia', maxilo_facial: 'Maxilo-Facial', nefrologia: 'Nefrologia', uci_intensivo: 'UCI — Intensivos', uci_intermedio: 'Cuidados Intermédios' };

  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function nupN(v) { return String(v == null ? '' : v).trim(); }
  function pacientes() { try { return (typeof data !== 'undefined' && data && Array.isArray(data.patients)) ? data.patients : []; } catch (e) { return []; } }
  function slug() { try { return window.CP_UCI ? window.CP_UCI.slug : String(FB_PACIENTES_PATH).split('/').pop(); } catch (e) { return ''; } }
  function chaveSegura(t) { return String(t).replace(/[.#$\[\]\/]/g, '_'); }
  function codificar(k) { return String(k).replace(/%/g, '%25').replace(/\|/g, '%7C').replace(/\./g, '%2E').replace(/\//g, '%2F').replace(/#/g, '%23').replace(/\$/g, '%24').replace(/\[/g, '%5B').replace(/\]/g, '%5D'); }
  // Folhas de um objeto: { 'a|b': valor } (mesma forma de zelo_sync_objeto.js).
  function folhas(v, pref, out) {
    out = out || {};
    if (v !== null && typeof v === 'object') { Object.keys(v).forEach(function (k) { folhas(v[k], pref + '|' + codificar(k), out); }); return out; }
    if (v !== undefined && v !== null && v !== '') out[pref] = v;
    return out;
  }
  function quem() {
    var nome = '', role = '';
    try { nome = sessionStorage.getItem('zeloNome') || sessionStorage.getItem('zeloEmail') || ''; role = sessionStorage.getItem('zeloRole') || ''; } catch (e) {}
    return { nome: nome || 'Utilizador', funcao: FUNCOES[role] || role };
  }
  function norm(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  function mesmoNome(a, b) { a = norm(a); b = norm(b); if (!a || !b || a === b) return true; var x = a.split(' '), y = b.split(' '); return x[0] === y[0] && x[x.length - 1] === y[y.length - 1]; }
  function chaveEp(nup, ep) { return 'nup_' + nup + (Number(ep) > 1 ? '_e' + Number(ep) : ''); }
  // Internamento arquivado: atualiza o registo no arquivo e o índice de nomes.
  function escreverArquivo(ep, campos, nupNovo) {
    if (typeof window.zeloCpArquivoCaminho !== 'function') return [];
    var l = [window.zeloQueueWrite(window.zeloCpArquivoCaminho(ep), JSON.parse(JSON.stringify(campos)), 'update')];
    var ix = window.zeloCpArquivoIndices(ep, nupNovo), nn = norm(campos.nome || ep.nome), ps = nn.split(' ');
    l.push(window.zeloQueueWrite(ix.nomes, { nome: campos.nome || ep.nome, nomeNorm: nn, apelidoNorm: ps[ps.length - 1] || '', nup: nupNovo || ep.nup, genero: campos.genero || ep.genero || '', idade: campos.idade != null ? campos.idade : ep.idade }, 'update'));
    if (nupNovo) l.push(window.zeloQueueWrite(ix.nup, ix.mes));
    // Cópia já carregada nesta página (só consulta): mostra logo o valor novo.
    pacientes().forEach(function (p) { if (p._arquivo && (p.servico || '') === (ep.servico || '') && String(p.dataEntrada) === String(ep.dataEntrada) && nupN(p.nup) === nupN(ep.nup)) Object.assign(p, JSON.parse(JSON.stringify(campos))); });
    return l;
  }
  function pessoais(p) { return { nome: p.nome || '', idade: p.idade == null ? '' : p.idade, genero: p.genero || '', alergias: p.alergias || null }; }

  var css = document.createElement('style');
  css.textContent = [
    '.cpd-ov{position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:2147483640;display:none;align-items:flex-start;justify-content:center;padding:24px 14px;overflow:auto}',
    '.cpd-ov.on{display:flex}',
    '.cpd-card{background:#fff;border-radius:18px;width:min(820px,100%);box-shadow:0 24px 60px rgba(15,23,42,.35);overflow:hidden;font-family:Inter,"Segoe UI",Arial,sans-serif;color:#0F172A}',
    '.cpd-top{background:linear-gradient(90deg,#1E3A5F,#2B5A8A);color:#fff;padding:16px 20px;display:flex;align-items:center;gap:12px}',
    '.cpd-top h3{margin:0;font-size:1.1rem;font-weight:800}.cpd-top small{display:block;opacity:.85;font-size:.8rem;margin-top:2px}',
    '.cpd-top .x{margin-left:auto;width:36px;height:36px;border-radius:10px;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.1);color:#fff;font-size:1.2rem;cursor:pointer}',
    '.cpd-body{padding:16px 20px;max-height:calc(100vh - 200px);overflow:auto}',
    '.cpd-info{background:#EEF4FB;border:1px solid #BFD3EA;color:#1E3A5F;border-radius:10px;padding:9px 12px;font:600 .82rem Inter,Arial,sans-serif;margin-bottom:12px}',
    '.cpd-g{display:grid;grid-template-columns:2fr 1fr 1fr;gap:10px}',
    '.cpd-g label{display:block;font:800 .68rem Inter,Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#475569;margin-bottom:5px}',
    '.cpd-g input,.cpd-g select{width:100%;box-sizing:border-box;border:1.5px solid #D6E0EC;border-radius:10px;padding:9px 11px;font:600 .92rem Inter,Arial,sans-serif;background:#fff}',
    '.cpd-acoes{display:flex;gap:10px;justify-content:flex-end;padding:12px 20px;border-top:1px solid #E3E8F0;flex-wrap:wrap}',
    '.cpd-bt{border:1px solid #D6E0EC;background:#fff;color:#1E3A5F;border-radius:10px;padding:9px 16px;font:700 .86rem Inter,Arial,sans-serif;cursor:pointer}',
    '.cpd-bt.p{background:#1E3A5F;color:#fff;border-color:#1E3A5F}.cpd-bt:disabled{opacity:.6;cursor:wait}',
    '.cpd-erro{color:#B91C1C;font:700 .84rem Inter,Arial,sans-serif;margin-top:10px}',
    '@media(max-width:640px){.cpd-g{grid-template-columns:1fr}.cpd-ov{padding:0}.cpd-card{border-radius:0;min-height:100vh}}'
  ].join('\n');
  document.head.appendChild(css);

  var ov = null, comp = null, atualNup = '';
  function janela() {
    if (ov) return ov;
    ov = document.createElement('div'); ov.className = 'cpd-ov'; ov.id = 'cpd-dados';
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('[data-cpd-fechar]')) fechar();
      else if (e.target.closest('[data-cpd-guardar]')) guardar();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ov.classList.contains('on')) fechar(); });
    return ov;
  }
  function fechar() { if (ov) ov.classList.remove('on'); }

  // Todos os internamentos deste NUP: deste serviço (dados locais) + outros (servidor, dados frescos).
  function internamentos(nup) {
    var S = slug();
    var locais = pacientes().filter(function (p) { return nupN(p.nup) === nup && !p.anulado && !p._arquivo; });
    var ler = typeof window.zeloCpInternamentosNUP === 'function' ? window.zeloCpInternamentosNUP(nup, true) : Promise.resolve([]);
    // Remotos: os dos outros serviços e os arquivados (saídas antigas, de qualquer serviço).
    return ler.then(function (eps) { return { S: S, locais: locais, remotos: (eps || []).filter(function (q) { return q._chave && (q._arquivo || q.servico !== S); }) }; });
  }

  function abrir(nup) {
    nup = nupN(nup); if (!nup) return;
    atualNup = nup; janela();
    ov.innerHTML = '<div class="cpd-card"><div class="cpd-top"><div><h3>Dados pessoais do doente</h3><small>NUP ' + esc(nup) + ' · a carregar…</small></div><button type="button" class="x" data-cpd-fechar aria-label="Fechar">×</button></div><div class="cpd-body">A ler o processo em todos os serviços…</div></div>';
    ov.classList.add('on');
    internamentos(nup).then(function (r) {
      if (atualNup !== nup || !ov.classList.contains('on')) return;
      var todos = r.locais.map(function (p) { return Object.assign({}, p, { servico: r.S }); }).concat(r.remotos)
        .sort(function (a, b) { return String(b.dataEntrada || '').localeCompare(String(a.dataEntrada || '')); });
      var u = todos[0]; if (!u) { ov.querySelector('.cpd-body').textContent = 'Processo não encontrado.'; return; }
      var servs = todos.map(function (p) { return NOMES[p.servico] || p.servico; }).filter(function (s, i, a) { return a.indexOf(s) === i; });
      ov.innerHTML = '<div class="cpd-card" role="dialog" aria-label="Dados pessoais"><div class="cpd-top"><div><h3>Dados pessoais do doente</h3><small>NUP ' + esc(nup) + ' · ' + todos.length + ' internamento(s): ' + esc(servs.join(', ')) + '</small></div><button type="button" class="x" data-cpd-fechar aria-label="Fechar">×</button></div>' +
        '<div class="cpd-body"><div class="cpd-info">Os dados pessoais são do doente: qualquer utilizador os pode atualizar. A alteração passa para todos os internamentos deste NUP, em todos os serviços. Os dados de cada internamento (entrada, diagnóstico, saída, evolução) só são alterados pelo serviço respetivo. O NUP também pode ser corrigido (em todos os internamentos).</div>' +
        '<div class="cpd-g" style="grid-template-columns:1fr 2fr;margin-bottom:10px"><div><label for="cpd-nup">NUP *</label><input id="cpd-nup" type="text" value="' + esc(nup) + '"></div>' +
        '<div style="align-self:end;font:600 .78rem Inter,Arial,sans-serif;color:#64748B;padding-bottom:4px">Escrito por engano? Corrija aqui: o NUP muda em todos os internamentos deste doente, em todos os serviços (o anterior fica registado no histórico).</div></div>' +
        '<div class="cpd-g"><div><label for="cpd-nome">Nome completo *</label><input id="cpd-nome" type="text" value="' + esc(u.nome || '') + '"></div>' +
        '<div><label for="cpd-idade">Idade *</label><input id="cpd-idade" type="number" min="0" max="130" value="' + esc(u.idade == null ? '' : u.idade) + '"></div>' +
        '<div><label for="cpd-genero">Género *</label><select id="cpd-genero"><option value="">Selecionar…</option>' + ['Masculino', 'Feminino'].map(function (g) { return '<option' + (u.genero === g ? ' selected' : '') + '>' + g + '</option>'; }).join('') + '</select></div></div>' +
        '<div id="cpd-alergias"></div><div class="cpd-erro" id="cpd-erro"></div></div>' +
        '<div class="cpd-acoes"><button type="button" class="cpd-bt" data-cpd-fechar>Cancelar</button><button type="button" class="cpd-bt p" data-cpd-guardar>Guardar em todos os internamentos</button></div></div>';
      if (window.ZeloCpAlergiasComponente) {
        comp = window.ZeloCpAlergiasComponente('cpa-dp');
        ov.querySelector('#cpd-alergias').appendChild(comp.el);
        comp.definir(u.alergias, u.alergias && u.alergias.estado ? '' : 'Ainda sem alergias registadas — indique-as.');
      } else comp = null;
      ov.__dados = r; ov.__ultimo = u;
    });
  }

  function guardar() {
    var r = ov.__dados, u = ov.__ultimo; if (!r || !u) return;
    var erro = ov.querySelector('#cpd-erro'), bt = ov.querySelector('[data-cpd-guardar]');
    var nome = ov.querySelector('#cpd-nome').value.trim().replace(/\s+/g, ' '), idade = parseInt(ov.querySelector('#cpd-idade').value, 10), genero = ov.querySelector('#cpd-genero').value;
    if (!nome || isNaN(idade) || idade < 0 || !genero) { erro.textContent = 'Preencha o nome, a idade e o género.'; return; }
    var nupNovo = nupN(ov.querySelector('#cpd-nup').value);
    if (!nupNovo) { erro.textContent = 'Indique o NUP.'; return; }
    if (/[.#$\[\]\/]/.test(nupNovo)) { erro.textContent = 'O NUP não pode ter os caracteres . # $ [ ] /'; return; }
    var ea = comp ? comp.validar() : '';
    if (ea) { erro.textContent = ea; comp.assinalar(); return; }
    var q = quem(), agora = Date.now(), iso = new Date(agora).toISOString();
    var novos = { nome: nome, idade: idade, genero: genero };
    if (comp && comp.tocado()) novos.alergias = comp.valor();
    var antes = pessoais(u);
    var mudou = Object.keys(novos).some(function (k) { return JSON.stringify(k === 'alergias' ? { e: (antes.alergias || {}).estado, i: (antes.alergias || {}).itens || {} } : antes[k]) !== JSON.stringify(k === 'alergias' ? { e: novos.alergias.estado, i: novos.alergias.itens } : novos[k]); });
    if (nupNovo !== atualNup) { corrigirNup(r, u, nupNovo, novos, antes, q, agora, iso, bt, erro); return; }
    if (!mudou) { fechar(); if (typeof showFeedback === 'function') showFeedback('Sem alterações nos dados pessoais', 'info'); return; }
    bt.disabled = true; erro.textContent = '';
    var marca = { dadosPessoaisPor: q.nome, dadosPessoaisFuncao: q.funcao, dadosPessoaisEm: iso, dadosPessoaisServico: r.S };

    // 1) Internamentos deste serviço: pelos dados da página (sincronização normal).
    r.locais.forEach(function (p) { Object.keys(novos).forEach(function (k) { p[k] = k === 'alergias' ? JSON.parse(JSON.stringify(novos[k])) : novos[k]; }); Object.assign(p, marca); });
    if (r.locais.length) { try { saveData(); updateStats(); renderInternados(); } catch (e) {} }

    // 2) Internamentos dos outros serviços: só estes campos, com a hora de cada campo.
    var porServ = {};
    var extra = [];
    r.remotos.forEach(function (ep) { if (ep._arquivo) extra = extra.concat(escreverArquivo(ep, Object.assign({}, novos, marca))); else (porServ[ep.servico] = porServ[ep.servico] || []).push(ep); });
    var envios = Object.keys(porServ).map(function (serv) {
      var patch = { savedAt: agora };
      porServ[serv].forEach(function (ep) {
        var k = ep._chave, pref = 'pacientes|' + codificar(k);
        var campos = Object.assign({}, novos, marca);
        Object.keys(campos).forEach(function (c) {
          var v = campos[c];
          patch['snapshot/pacientes/' + k + '/' + c] = c === 'alergias' ? JSON.parse(JSON.stringify(v)) : v;
          if (c === 'alergias') {
            var velhas = folhas(ep.alergias || {}, pref + '|alergias'), novas = folhas(v, pref + '|alergias');
            Object.keys(velhas).concat(Object.keys(novas)).forEach(function (f) { patch['camposTs/' + codificar(f)] = agora; });
          } else patch['camposTs/' + codificar(pref + '|' + codificar(c))] = agora;
        });
      });
      return window.zeloQueueWrite(BASE + serv, patch, 'update');
    });
    envios = envios.concat(extra);

    // 3) Histórico do processo (nunca se apaga): antes e depois.
    var nk = chaveSegura(atualNup), id = agora + '_' + Math.random().toString(36).slice(2, 7);
    envios.push(window.zeloQueueWrite('registos_sistemas_locais/controlo_pacientes_processos/' + nk + '/historico/' + id,
      { em: iso, por: q.nome, funcao: q.funcao, servico: r.S, servicoNome: NOMES[r.S] || r.S, antes: antes, depois: novos, internamentos: r.locais.length + r.remotos.length }));
    envios.push(window.zeloQueueWrite('registos_sistemas_locais/controlo_pacientes_processos/' + nk + '/dados', Object.assign({ nup: atualNup }, novos, marca)));

    Promise.all(envios).then(function (res) {
      var fila = res.some(function (x) { return x && x.queued; });
      fechar();
      if (typeof showFeedback === 'function') showFeedback('Dados pessoais atualizados em ' + (r.locais.length + r.remotos.length) + ' internamento(s)' + (fila ? ' — serão enviados quando houver rede' : ''), 'success');
      try { if (window.ZeloCpProcesso && document.querySelector('#cpp-processo.on') && r.locais[0]) window.ZeloCpProcesso.abrir(r.locais[0].n); } catch (e) {}
      var cpn = document.getElementById('cpn-processos'); if (cpn && cpn.classList.contains('on')) cpn.classList.remove('on');
    }, function () { bt.disabled = false; erro.textContent = 'Não foi possível guardar. Tente outra vez.'; });
  }

  // ── Correção do NUP (escrito por engano) ──
  // Passa todos os internamentos do NUP antigo para o novo, em todos os
  // serviços. Não deixa usar o NUP de outro doente, nem juntar dois
  // internamentos ativos. Cópia completa de antes fica no histórico dos dois NUP.
  function corrigirNup(r, u, nupNovo, novos, antes, q, agora, iso, bt, erro) {
    bt.disabled = true; erro.textContent = 'A verificar o NUP ' + nupNovo + ' em todos os serviços…';
    var ler = typeof window.zeloCpInternamentosNUP === 'function' ? window.zeloCpInternamentosNUP(nupNovo, true) : Promise.resolve([]);
    ler.then(function (eps2) {
      var S = r.S, locais2 = pacientes().filter(function (p) { return nupN(p.nup) === nupNovo && !p.anulado; });
      var destino = locais2.map(function (p) { return Object.assign({}, p, { servico: S }); }).concat((eps2 || []).filter(function (q2) { return q2.servico !== S; }));
      var dono = destino.filter(function (p) { return !mesmoNome(p.nome, novos.nome); })[0];
      if (dono) { bt.disabled = false; erro.textContent = 'O NUP ' + nupNovo + ' pertence a ' + dono.nome + ' (' + (NOMES[dono.servico] || dono.servico) + '). Cada NUP é de um só doente.'; return; }
      var movidos = r.locais.map(function (p) { return { local: p, servico: S, ep: p }; })
        .concat(r.remotos.map(function (p) { return { local: null, servico: p.servico, ep: p }; }))
        .sort(function (a, b) { return String(a.ep.dataEntrada || '').localeCompare(String(b.ep.dataEntrada || '')); });
      if (destino.some(function (p) { return p.status === 'internado'; }) && movidos.some(function (m) { return m.ep.status === 'internado'; })) {
        bt.disabled = false; erro.textContent = 'O doente com o NUP ' + nupNovo + ' já está internado — não se podem juntar dois internamentos ativos. Registe primeiro a saída de um deles.'; return;
      }
      var maxEp = destino.reduce(function (m, p) { return Math.max(m, Number(p.episodio) || 1); }, 0);
      movidos.forEach(function (m, i) { m.novoEp = maxEp ? maxEp + 1 + i : (Number(m.ep.episodio) || 1); });
      var marca = { dadosPessoaisPor: q.nome, dadosPessoaisFuncao: q.funcao, dadosPessoaisEm: iso, dadosPessoaisServico: r.S, nupAnterior: atualNup, nupCorrigidoEm: iso, nupCorrigidoPor: q.nome };
      var nupVelho = atualNup, envios = [];
      var copias = movidos.map(function (m) { var c = JSON.parse(JSON.stringify(m.ep)); delete c._chave; delete c._local; c.servico = m.servico; return c; });

      // 1) Histórico nos dois processos (cópia completa de antes).
      var reg = { tipo: 'correcao_nup', em: iso, por: q.nome, funcao: q.funcao, servico: r.S, servicoNome: NOMES[r.S] || r.S, de: nupVelho, para: nupNovo, antes: antes, depois: novos, internamentos: copias };
      [nupVelho, nupNovo].forEach(function (n) { envios.push(window.zeloQueueWrite('registos_sistemas_locais/controlo_pacientes_processos/' + chaveSegura(n) + '/historico/' + agora + '_nup', reg)); });
      envios.push(window.zeloQueueWrite('registos_sistemas_locais/controlo_pacientes_processos/' + chaveSegura(nupNovo) + '/dados', Object.assign({ nup: nupNovo }, novos, marca)));

      // 2) Este serviço: um internamento de cada vez (a proteção contra
      //    apagar em massa só deixa mudar um registo por gravação).
      movidos.filter(function (m) { return m.local; }).forEach(function (m) {
        var p = m.local;
        Object.keys(novos).forEach(function (k) { p[k] = k === 'alergias' ? JSON.parse(JSON.stringify(novos[k])) : novos[k]; });
        Object.assign(p, marca); p.nup = nupNovo; p.episodio = m.novoEp;
        try { saveData(); } catch (e) {}
      });
      try { updateStats(); renderInternados(); } catch (e) {}

      // 3) Outros serviços: o registo passa para a chave nova (com hora em
      //    todos os campos) e sai da antiga (com hora, para não voltar).
      var porServ = {};
      movidos.filter(function (m) { return !m.local; }).forEach(function (m) {
        if (m.ep._arquivo) envios = envios.concat(escreverArquivo(m.ep, Object.assign({}, novos, marca, { nup: nupNovo, episodio: m.novoEp }), nupNovo));
        else (porServ[m.servico] = porServ[m.servico] || []).push(m);
      });
      Object.keys(porServ).forEach(function (serv) {
        var patch = { savedAt: agora };
        porServ[serv].forEach(function (m) {
          var velha = m.ep._chave, nova = chaveEp(nupNovo, m.novoEp);
          var obj = JSON.parse(JSON.stringify(m.ep)); delete obj._chave;
          Object.keys(novos).forEach(function (k) { obj[k] = novos[k]; });
          Object.assign(obj, marca); obj.nup = nupNovo; obj.episodio = m.novoEp;
          patch['snapshot/pacientes/' + nova] = obj;
          Object.keys(folhas(obj, 'pacientes|' + codificar(nova))).forEach(function (f) { patch['camposTs/' + codificar(f)] = agora; });
          patch['snapshot/pacientes/' + velha] = null;
          Object.keys(folhas(m.ep, 'pacientes|' + codificar(velha))).forEach(function (f) { if (!/\|_chave$/.test(f)) patch['camposTs/' + codificar(f)] = agora; });
        });
        envios.push(window.zeloQueueWrite(BASE + serv, patch, 'update'));
      });

      Promise.all(envios).then(function (res) {
        var fila = res.some(function (x) { return x && x.queued; });
        fechar();
        if (typeof showFeedback === 'function') showFeedback('NUP corrigido de ' + nupVelho + ' para ' + nupNovo + ' em ' + movidos.length + ' internamento(s)' + (fila ? ' — será enviado quando houver rede' : ''), 'success');
        var cpp = document.getElementById('cpp-processo'); if (cpp) cpp.classList.remove('on');
        var cpn = document.getElementById('cpn-processos'); if (cpn) cpn.classList.remove('on');
      }, function () { bt.disabled = false; erro.textContent = 'Não foi possível guardar. Tente outra vez.'; });
    }, function () { bt.disabled = false; erro.textContent = 'Sem ligação para verificar o NUP novo — tente quando houver rede.'; });
  }

  // "Atualizar dados": o NUP corrige-se na janela dos dados pessoais (muda em
  // todos os internamentos do doente, não só neste).
  function ligarEdicao() {
    var m = document.getElementById('editModal'), f = document.getElementById('eNUP');
    if (!m || !f) return false; if (f.__cpd) return true; f.__cpd = true;
    f.readOnly = true; f.style.background = '#F1F5F9'; f.title = 'Para corrigir o NUP use «Corrigir NUP»';
    var b = document.createElement('button'); b.type = 'button'; b.textContent = 'Corrigir NUP (em todos os internamentos)';
    b.style.cssText = 'margin-top:6px;border:1px solid #D6E0EC;background:#fff;color:#1E3A5F;border-radius:9px;padding:6px 11px;font:700 .8rem Inter,Arial,sans-serif;cursor:pointer';
    b.addEventListener('click', function (e) { e.preventDefault(); try { closeModal('editModal'); } catch (x) {} abrir(f.value); });
    f.parentNode.appendChild(b);
    return true;
  }
  var nL = 0, ivL = setInterval(function () { nL++; if (ligarEdicao() || nL > 80) clearInterval(ivL); }, 250);

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-dp-nup]'); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    abrir(b.getAttribute('data-dp-nup'));
  }, true);
  window.ZeloCpDadosPessoais = { abrir: abrir };
})();
