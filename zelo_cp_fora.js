// ── ZELO — Controlo de Pacientes: doentes internados fora do serviço ──
// Partilhado pelas 8 páginas de Controlo de Pacientes.
// • Nunca por decisão própria: só quando o serviço está cheio (doentes
//   internados ≥ camas do Movimento) o sistema pergunta em que serviço o
//   doente pode ficar. Serviços sem leitos livres não podem ser escolhidos
//   ("não é possível — o serviço X já não tem leitos disponíveis").
// • Escolher outro serviço NÃO interna logo: fica um PEDIDO à espera de
//   autorização. O serviço pedido é notificado e carrega em Autorizar ou
//   Recusar. Só depois de autorizado o doente passa a contar como internado
//   lá (cama emprestada: −1 dia de cama lá, +1 no serviço do doente).
// • Se em 24 horas o serviço pedido não responder, o pedido fica "sem
//   resposta" e o serviço de origem é notificado (pode pedir a outro serviço).
// • O doente continua a ser do seu serviço (admitidos, saídos, dias-doente).
// Guardado em:
//   doente.foraServico (texto JSON): [{ k, servico, estado, pedidoEm, desde, ate, por, funcao, em,
//     autorizadoPor/Funcao/Em, recusadoPor/Funcao/Em, regressoPor, regressoEm }]
//     estado: pendente | autorizado | recusado | sem_resposta | cancelado (sem estado = antigo, autorizado)
//   registos_sistemas_locais/cp_fora/<serviço pedido>/<k>: cópia resumida (+ resposta, escrita pelo serviço pedido)
//   registos_sistemas_locais/cp_fora_resposta/<serviço de origem>/<k>: a resposta, para a origem a aplicar.
// Nada é apagado: o regresso/recusa só fecham o período (ate).
(function () {
  if (window.__zeloCpFora) return;
  window.__zeloCpFora = true;

  var SERV = [['medicina_interna', 'Medicina Interna'], ['cirurgia_geral', 'Cirurgia Geral'], ['ortopedia', 'Ortopedia'], ['neurocirurgia', 'Neurocirurgia'],
    ['maxilo_facial', 'Maxilo-Facial'], ['nefrologia', 'Nefrologia'], ['uci_intensivo', 'UCI — Intensivos'], ['uci_intermedio', 'Cuidados Intermédios']];
  var FUNCOES = { admin: 'Administrador', chefe_servico: 'Chefe de Serviço', enfermeiro_chefe: 'Enfermeiro(a) Chefe', enfermeiro: 'Enfermeiro(a)', secretario: 'Secretário(a)', medico: 'Médico(a)' };
  var H24 = 24 * 3600 * 1000;
  function nomeServ(s) { var r = SERV.filter(function (x) { return x[0] === s; })[0]; return r ? r[1] : s; }
  function slug() { try { return String(FB_PACIENTES_PATH).split('/').pop(); } catch (e) { return ''; } }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pacientes() { try { return (typeof data !== 'undefined' && data && Array.isArray(data.patients)) ? data.patients : []; } catch (e) { return []; } }
  function agoraLocal() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + 'T' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  function fmtDH(iso) { var s = String(iso || ''); if (s.length < 10) return '—'; var p = s.slice(0, 10).split('-'); return p[2] + '/' + p[1] + '/' + p[0] + (s.length >= 16 ? ' às ' + s.slice(11, 16) : ''); }
  function fmtEm(iso) { return iso ? new Date(iso).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''; }
  function quem() {
    var nome = '', role = '';
    try { nome = sessionStorage.getItem('zeloNome') || sessionStorage.getItem('zeloEmail') || ''; role = sessionStorage.getItem('zeloRole') || ''; } catch (e) {}
    return { nome: nome || 'Utilizador', funcao: FUNCOES[role] || role };
  }
  function lista(p) { try { var l = JSON.parse(p.foraServico || '[]'); return Array.isArray(l) ? l : []; } catch (e) { return []; } }
  function est(f) { return (f && f.estado) || 'autorizado'; }
  function ultimo(p) { var l = lista(p); return l[l.length - 1] || null; }
  // Internado noutro serviço (autorizado e ainda lá)
  function ativo(p) { if (!p || p.status !== 'internado') return null; var u = ultimo(p); return u && !u.ate && est(u) === 'autorizado' ? u : null; }
  // Pedido à espera de autorização
  function pendente(p) { if (!p || p.status !== 'internado') return null; var u = ultimo(p); return u && !u.ate && est(u) === 'pendente' ? u : null; }
  function restante(pedidoEm) { var r = H24 - (Date.now() - Date.parse(pedidoEm || 0)); return r; }
  function fmtRest(ms) { if (ms <= 0) return 'prazo terminado'; var h = Math.floor(ms / 3600000), m = Math.floor(ms % 3600000 / 60000); return 'faltam ' + (h ? h + ' h ' : '') + m + ' min'; }
  window.zeloCpForaLista = lista;
  window.zeloCpForaAtivo = ativo;
  window.zeloCpForaTxt = function (p) {
    var f = ativo(p);
    if (f) return '<span class="cpf-tag" title="Internado fora do serviço desde ' + esc(fmtDH(f.desde)) + '">Internado em ' + esc(nomeServ(f.servico)) + '</span>';
    f = pendente(p);
    return f ? '<span class="cpf-tag e" title="Pedido enviado ' + esc(fmtEm(f.pedidoEm)) + '">A aguardar autorização de ' + esc(nomeServ(f.servico)) + '</span>' : '';
  };
  function aviso(titulo, texto, botoes, icone) {
    if (window.ZeloEspera && window.ZeloEspera.mensagem) {
      window.ZeloEspera.mensagem({ icone: icone || 'aviso', etiqueta: 'Internamento noutro serviço', titulo: titulo, texto: texto, botoes: botoes || [{ texto: 'OK', principal: true }] });
    } else {
      var b = (botoes || []).filter(function (x) { return x.principal; })[0];
      if (b && botoes.length > 1) { if (confirm(texto + '\n\n' + b.texto + '?')) { if (b.acao) b.acao(); } else { var o = botoes.filter(function (x) { return !x.principal; }).pop(); if (o && o.acao) o.acao(); } }
      else { alert(texto); if (b && b.acao) b.acao(); }
    }
  }

  // ── Camas do serviço (do Movimento) e ocupação ──
  // Camas de cada Controlo de Pacientes (do Movimento do serviço):
  //   Medicina Interna: as camas do Movimento da Medicina Interna (homens e mulheres juntos);
  //   UCI e Cuidados Intermédios: um só Movimento (16 camas), 8 camas cada.
  var PARTES_UCI = { uci_intensivo: 8, uci_intermedio: 8 };
  function itemDe(s) { return PARTES_UCI[s] ? 'uci' : s; }
  function itemMov() { return slug(); }
  function capDe(s) {
    var get = function (c) { return window.__fbGet(c).catch(function () { return null; }); };
    if (PARTES_UCI[s]) return get('registos_movimento/uci/snapshot/__capacidadePartes/' + s).then(function (v) { return Number(v) > 0 ? Number(v) : PARTES_UCI[s]; });
    return get('registos_movimento/' + s + '/snapshot/__capacity').then(function (v) {
      if (Number(v) > 0) return Number(v);
      if (s !== 'medicina_interna') return 50;
      // Movimento da Medicina Interna ainda não aberto: soma das páginas antigas (Homem + Mulher)
      return Promise.all([get('registos_movimento/medicina_homem/snapshot/__capacity'), get('registos_movimento/medicina_mulher/snapshot/__capacity')]).then(function (c) { return Number(c[0]) > 0 && Number(c[1]) > 0 ? Number(c[0]) + Number(c[1]) : 50; });
    });
  }
  var camas = {};
  function lerCamas() {
    if (typeof window.__fbGet !== 'function') return Promise.resolve();
    return capDe(slug()).then(function (c) { camas[slug()] = c; });
  }
  // Doentes que ocupam cama neste serviço: os seus (menos os que estão
  // noutro serviço) + os de outros serviços autorizados aqui.
  function ocupacao(genero) {
    return pacientes().filter(function (p) { return p.status === 'internado' && !ativo(p); }).length + ativosAqui().length;
  }

  // ── Disponibilidade nos outros serviços (lido só quando o serviço está cheio) ──
  function disponibilidade(g) {
    var outros = SERV.filter(function (s) { return s[0] !== slug(); });
    if (typeof window.__fbGet !== 'function') return Promise.resolve(outros.map(function (s) { return { s: s[0], livres: null }; }));
    var get = function (c) { return window.__fbGet(c).catch(function () { return null; }); };
    return Promise.all(outros.map(function (s) {
      var gf = null;
      return Promise.all([capDe(s[0]), get('registos_sistemas_locais/controlo_pacientes/' + s[0] + '/snapshot/pacientes'), get('registos_sistemas_locais/cp_fora/' + s[0])]).then(function (r) {
        var cap = r[0];
        var ps = r[1] && typeof r[1] === 'object' ? Object.keys(r[1]).map(function (k) { return r[1][k]; }) : [];
        var ex = r[2] && typeof r[2] === 'object' ? Object.keys(r[2]).map(function (k) { return r[2][k]; }) : [];
        var oc = ps.filter(function (p) { return p && p.status === 'internado' && !ativo(p) && (!gf || p.genero === gf); }).length +
          ex.filter(function (x) { return x && estR(x) === 'autorizado' && !x.ate && !x.dataSaida && x.status !== 'saido' && (!gf || x.genero === gf); }).length;
        return { s: s[0], cap: cap, oc: oc, livres: cap - oc };
      });
    }));
  }

  // ── Publicar (serviço pedido, Movimento e Movimento Geral leem daqui) ──
  function chaveF(p, f) { return f.k || (slug() + '_' + String(p.nup || ('n' + p.n)) + '_e' + (p.episodio || 1) + '_' + String(f.desde || '').replace(/\D/g, '')).replace(/[.#$\[\]\/]/g, '_'); }
  function publicar() {
    // Espera pelas respostas: o registo leva a resposta do serviço pedido
    // (senão a cópia apagava-a).
    if (typeof window.zeloQueueWrite !== 'function' || !respLidas) return;
    pacientes().forEach(function (p) {
      lista(p).forEach(function (f) {
        if (!f.servico) return;
        var r = { de: slug(), deNome: nomeServ(slug()), nome: p.nome || '', nup: p.nup || '', genero: p.genero || '', idade: p.idade == null ? '' : p.idade, diagnostico: p.diagnostico || '',
          estado: est(f), pedidoEm: f.pedidoEm || '', desde: f.desde || '', ate: f.ate || '', dataSaida: p.dataSaida || '', tipoSaida: p.tipoSaida || '', status: p.status || '', por: f.por || '', funcao: f.funcao || '', em: f.em || '',
          regressoPor: f.regressoPor || '', regressoEm: f.regressoEm || '' };
        var k = chaveF(p, f); if (respostas[k]) r.resposta = respostas[k];
        var j = JSON.stringify(r), lk = 'cpfora_pub_' + f.servico + '_' + k;
        var ant = null; try { ant = localStorage.getItem(lk); } catch (e) {}
        if (ant === j) return;
        try { window.zeloQueueWrite('registos_sistemas_locais/cp_fora/' + f.servico + '/' + k, r); localStorage.setItem(lk, j); } catch (e) {}
      });
    });
  }
  // Pedido de internamento noutro serviço (fica à espera de autorização)
  function pedir(p, servico) {
    var q = quem(), l = lista(p), em = new Date().toISOString();
    var k = (slug() + '_' + String(p.nup || ('n' + p.n)) + '_e' + (p.episodio || 1) + '_' + em.replace(/\D/g, '').slice(0, 14)).replace(/[.#$\[\]\/]/g, '_');
    l.push({ k: k, servico: servico, estado: 'pendente', pedidoEm: em, desde: agoraLocal(), ate: null, por: q.nome, funcao: q.funcao, em: em });
    p.foraServico = JSON.stringify(l);
  }
  function guardar() { try { saveData(); updateStats(); renderInternados(); } catch (e) {} desenhar(); }
  function porN(n) { return pacientes().filter(function (x) { return x.n === n; })[0]; }
  // Mover para o serviço: o doente volta a estar internado no seu serviço
  // como se sempre lá tivesse estado — mesmo registo, mesmo NUP e a data de
  // entrada real (não é uma nova entrada). Só fecha o período fora do serviço
  // (a cama emprestada fica livre); o serviço que emprestou é avisado.
  function regressou(n) {
    var p = porN(n); if (!p) return;
    var u = ativo(p); if (!u) return;
    var fazer = function () {
      var l = lista(p), f = l[l.length - 1], q = quem(); f.ate = agoraLocal(); f.regressoPor = q.nome; f.regressoFuncao = q.funcao; f.regressoEm = new Date().toISOString();
      p.foraServico = JSON.stringify(l); guardar();
      if (typeof showFeedback === 'function') showFeedback(p.nome + ' movido para ' + nomeServ(slug()) + ' — a cama em ' + nomeServ(u.servico) + ' ficou livre', 'success');
    };
    var cap = camas[itemMov()], oc = ocupacao();
    var texto = 'Mover ' + p.nome + ' (NUP ' + (p.nup || '—') + ') de ' + nomeServ(u.servico) + ' para ' + nomeServ(slug()) + '? ' +
      'O doente continua com o mesmo registo e a data de entrada real (' + fmtDH(p.dataEntrada) + ') — não conta como nova entrada. A cama em ' + nomeServ(u.servico) + ' fica livre a partir de agora.' +
      (cap && oc >= cap ? ' Atenção: o serviço já tem ' + oc + ' doentes para ' + cap + ' camas (fica com cama extra).' : '');
    aviso('Mover para o serviço', texto, [{ texto: 'Mover para o serviço', principal: true, acao: fazer }, { texto: 'Cancelar' }]);
  }
  function cancelar(n) {
    var p = porN(n); if (!p) return;
    var u = pendente(p); if (!u) return;
    if (!confirm('Cancelar o pedido de internamento de ' + p.nome + ' em ' + nomeServ(u.servico) + '? O doente continua neste serviço.')) return;
    var l = lista(p), f = l[l.length - 1], q = quem(); f.estado = 'cancelado'; f.ate = agoraLocal(); f.canceladoPor = q.nome; f.canceladoEm = new Date().toISOString();
    p.foraServico = JSON.stringify(l); guardar();
  }
  function fecharAviso(n) {
    var p = porN(n); if (!p) return;
    var l = lista(p), f = l[l.length - 1]; if (!f) return;
    f.visto = true; p.foraServico = JSON.stringify(l); guardar();
  }
  function pedirOutro(n) {
    var p = porN(n); if (!p || p.status !== 'internado' || ativo(p) || pendente(p)) return;
    var cap = camas[itemMov(p.genero)] || null;
    perguntar(p.genero, ocupacao(p.genero), cap, false, function (host) {
      if (!host) return;
      var l = lista(p), f = l[l.length - 1]; if (f && !f.visto && (est(f) === 'recusado' || est(f) === 'sem_resposta')) f.visto = true; p.foraServico = JSON.stringify(l);
      pedir(p, host); guardar();
      if (typeof showFeedback === 'function') showFeedback('Pedido enviado a ' + nomeServ(host) + ' — aguarda autorização (24 horas)', 'success');
    }, p.nome);
  }

  // ── Novo Paciente ──
  var confirmouAqui = false;
  function blocoNovo() {
    var m = document.getElementById('novoModal'), corpo = m && m.querySelector('.modal-body');
    if (!corpo || document.getElementById('cpf-novo')) return !!corpo;
    var b = document.createElement('div'); b.id = 'cpf-novo'; b.className = 'cpf-novo';
    b.innerHTML = '<label>Camas do serviço</label><div class="cpf-lot" id="cpf-lot"></div>';
    var diag = document.getElementById('fDiagnostico'), lin = diag && diag.closest('.form-row');
    if (lin && lin.parentNode === corpo) corpo.insertBefore(b, lin); else corpo.appendChild(b);
    var g = document.getElementById('fGenero'); if (g) g.addEventListener('change', lotacao);
    return true;
  }
  function lotacao() {
    var el = document.getElementById('cpf-lot'); if (!el) return;
    var g = (document.getElementById('fGenero') || {}).value || '', it = itemMov(g);
    if (!it || !camas[it]) { el.textContent = ''; return; }
    var oc = ocupacao(g), livres = camas[it] - oc;
    el.className = 'cpf-lot' + (livres <= 0 ? ' cheio' : '');
    el.textContent = camas[it] + ' camas · ' + oc + ' internados no serviço · ' + (livres > 0 ? livres + ' livre(s)' : 'sem camas livres');
  }
  var hostEscolhido = '';
  // Pergunta em que serviço pedir cama. cb(serviço) / cb('') = fica aqui (cama extra).
  function perguntar(g, oc, cap, comAqui, cb, nomeDoente) {
    var ov = document.createElement('div'); ov.className = 'cpf-ov';
    var intro = cap ? 'O serviço tem <b>' + cap + ' camas</b> e já estão <b>' + oc + ' doentes</b> internados. ' : '';
    ov.innerHTML = '<div class="cpf-card" role="dialog" aria-label="Sem camas livres"><div class="cpf-top"><b>' + (nomeDoente ? 'Pedir cama noutro serviço — ' + esc(nomeDoente) : 'Sem camas livres em ' + esc(nomeServ(slug()))) + '</b><button type="button" class="x" data-x aria-label="Fechar">×</button></div><div class="cpf-cb">' +
      '<div style="text-align:left">' + intro + 'Escolha o serviço a que vai <b>pedir</b> uma cama. O doente só fica internado lá depois de esse serviço <b>autorizar</b> (tem 24 horas para responder); até lá fica à espera neste serviço.</div>' +
      '<div class="cpf-lista" id="cpf-lista"><div class="cpf-vz" style="grid-column:1/-1">A verificar as camas livres em cada serviço…</div></div>' +
      (comAqui ? '<button type="button" class="cpf-aqui" data-aqui>Fica neste serviço mesmo assim (cama extra)</button>' : '') + '</div></div>';
    document.body.appendChild(ov);
    var disp = {};
    disponibilidade(g).then(function (l) {
      var box = ov.querySelector('#cpf-lista'); if (!box) return;
      box.innerHTML = l.map(function (d) {
        disp[d.s] = d;
        var cheio = d.livres != null && d.livres <= 0;
        return '<button type="button" class="cpf-sv' + (cheio ? ' cheio' : '') + '" data-s="' + d.s + '"' + (cheio ? ' aria-disabled="true"' : '') + '>' + esc(nomeServ(d.s)) +
          '<small>' + (d.livres == null ? 'camas não verificadas' : cheio ? 'Sem leitos disponíveis' : d.livres + ' cama(s) livre(s)') + '</small></button>';
      }).join('');
    });
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('[data-x]')) { ov.remove(); return; }
      var b = e.target.closest('[data-s]');
      if (b) {
        var d = disp[b.dataset.s];
        if (d && d.livres != null && d.livres <= 0) {
          aviso('Não é possível', 'Não é possível pedir cama em ' + nomeServ(d.s) + ': o serviço ' + nomeServ(d.s) + ' já não tem leitos disponíveis (' + d.cap + ' camas, ' + d.oc + ' doentes internados). Escolha outro serviço.', null, 'aviso');
          return;
        }
        ov.remove(); cb(b.dataset.s); return;
      }
      if (e.target.closest('[data-aqui]')) { ov.remove(); cb(''); }
    });
  }
  function envolverAdd() {
    var f = window.addPaciente; if (typeof f !== 'function' || f.__cpf) return !!(f && f.__cpf);
    var novo = function () {
      var self = this, args = arguments;
      var host = hostEscolhido;
      if (!host && !confirmouAqui) {
        var g = (document.getElementById('fGenero') || {}).value || '', it = itemMov(g), cap = it && camas[it];
        if (cap) { var oc = ocupacao(g); if (oc >= cap) { perguntar(g, oc, cap, true, function (s) { if (s) hostEscolhido = s; else confirmouAqui = true; window.addPaciente(); }); return; } }
      }
      var n = data.nextN;
      var r = f.apply(self, args);
      var p = pacientes().filter(function (x) { return x.n === n; })[0];
      if (p && host) {
        pedir(p, host);
        try { saveData(); renderInternados(); } catch (e) {}
        if (typeof showFeedback === 'function') showFeedback(p.nome + ' registado — pedido de cama enviado a ' + nomeServ(host) + '; aguarda autorização (24 horas)', 'success');
      }
      if (p) { confirmouAqui = false; hostEscolhido = ''; }
      desenhar();
      return r;
    };
    novo.__cpf = true; window.addPaciente = novo; return true;
  }
  function envolverSave() {
    var f = window.saveData; if (typeof f !== 'function' || f.__cpf) return !!(f && f.__cpf);
    var novo = function () { var r = f.apply(this, arguments); try { setTimeout(publicar, 0); setTimeout(desenhar, 0); } catch (e) {} return r; };
    novo.__cpf = true; window.saveData = novo; return true;
  }
  function envolverAbrir() {
    var f = window.openModal; if (typeof f !== 'function' || f.__cpf) return !!(f && f.__cpf);
    var novo = function (id) { var r = f.apply(this, arguments); if (id === 'novoModal') { blocoNovo(); confirmouAqui = false; hostEscolhido = ''; lerCamas().then(lotacao); } return r; };
    novo.__cpf = true; novo.__cpn = f.__cpn; novo.__cpProc = f.__cpProc; window.openModal = novo; return true;
  }

  // ── Serviço pedido: pedidos recebidos ──
  var recebidos = {};   // cp_fora/<este serviço>
  function estR(r) {
    if (!r) return '';
    if (r.estado === 'cancelado') return 'cancelado';
    if (r.resposta && r.resposta.decisao) return r.resposta.decisao;
    var e = r.estado || 'autorizado';
    if (e === 'pendente' && restante(r.pedidoEm) <= 0) return 'sem_resposta';
    return e;
  }
  function desdeR(r) { return (r.resposta && r.resposta.desde) || r.desde; }
  function todosR() { return Object.keys(recebidos).map(function (k) { var r = recebidos[k]; if (r) r._k = k; return r; }).filter(Boolean); }
  function ativosAqui() { return todosR().filter(function (r) { return estR(r) === 'autorizado' && !r.ate && !r.dataSaida && r.status !== 'saido'; }); }
  function pedidosAqui() { return todosR().filter(function (r) { return estR(r) === 'pendente' && r.status !== 'saido' && !r.dataSaida; }); }
  function decidir(k, decisao) {
    var r = recebidos[k]; if (!r || estR(r) !== 'pendente') return;
    if (decisao === 'autorizado') {
      var it = itemMov(r.genero), cap = it && camas[it];
      if (cap) {
        var oc = ocupacao(r.genero);
        if (oc >= cap) {
          aviso('Sem leitos disponíveis', 'Não é possível autorizar: o serviço ' + nomeServ(slug()) + ' já não tem leitos disponíveis (' + cap + ' camas, ' + oc + ' doentes internados). Pode recusar o pedido para o serviço de ' + (r.deNome || nomeServ(r.de)) + ' pedir noutro serviço.', null, 'aviso');
          return;
        }
      }
    }
    var q = quem(), res = { decisao: decisao, por: q.nome, funcao: q.funcao, em: new Date().toISOString(), desde: agoraLocal(), servico: slug() };
    r.resposta = res;
    try {
      window.zeloQueueWrite('registos_sistemas_locais/cp_fora/' + slug() + '/' + k + '/resposta', res);
      window.zeloQueueWrite('registos_sistemas_locais/cp_fora_resposta/' + r.de + '/' + k, res);
    } catch (e) {}
    var vv = vistos(); vv['p:' + k] = Date.now(); try { localStorage.setItem('cpfora_visto_' + slug(), JSON.stringify(vv)); } catch (e) {}
    desenhar();
    if (typeof showFeedback === 'function') showFeedback(decisao === 'autorizado' ? r.nome + ' autorizado — fica internado em ' + nomeServ(slug()) : 'Pedido de ' + r.nome + ' recusado — o serviço de ' + (r.deNome || nomeServ(r.de)) + ' foi avisado', 'success');
  }
  function pedirDecisao(k, decisao) {
    var r = recebidos[k]; if (!r) return;
    if (decisao === 'recusado') {
      aviso('Recusar o pedido?', 'Recusar o internamento de ' + r.nome + ' (serviço de ' + (r.deNome || nomeServ(r.de)) + ')? O serviço de origem é avisado.', [{ texto: 'Recusar', principal: true, acao: function () { decidir(k, 'recusado'); } }, { texto: 'Voltar' }]);
    } else decidir(k, decisao);
  }

  // ── Serviço de origem: aplicar respostas e prazo de 24 horas ──
  var respostas = {}, respLidas = false;
  function aplicarRespostas() {
    var mud = false;
    pacientes().forEach(function (p) {
      var l = lista(p), alt = false;
      l.forEach(function (f) {
        var r = respostas[chaveF(p, f)];
        if (!r || !r.decisao || est(f) !== 'pendente') return;
        if (r.decisao === 'autorizado') { f.estado = 'autorizado'; f.desde = r.desde || agoraLocal(); f.autorizadoPor = r.por || ''; f.autorizadoFuncao = r.funcao || ''; f.autorizadoEm = r.em || ''; }
        else { f.estado = 'recusado'; f.ate = r.desde || agoraLocal(); f.recusadoPor = r.por || ''; f.recusadoFuncao = r.funcao || ''; f.recusadoEm = r.em || ''; }
        alt = true;
      });
      if (alt) { p.foraServico = JSON.stringify(l); mud = true; }
    });
    return mud;
  }
  function verificarPrazos() {
    if (!respLidas) return false;
    var mud = false;
    pacientes().forEach(function (p) {
      var l = lista(p), u = l[l.length - 1];
      if (!u || u.ate || est(u) !== 'pendente') return;
      if (p.status !== 'internado') { u.estado = 'cancelado'; u.ate = p.dataSaida || agoraLocal(); u.visto = true; }
      else if (restante(u.pedidoEm) <= 0 && !respostas[chaveF(p, u)]) { u.estado = 'sem_resposta'; u.ate = agoraLocal(); u.expirouEm = new Date().toISOString(); }
      else return;
      p.foraServico = JSON.stringify(l); mud = true;
    });
    return mud;
  }
  function processarOrigem() {
    var a = aplicarRespostas(), b = verificarPrazos();
    if (a || b) { try { saveData(); updateStats(); renderInternados(); } catch (e) {} }
    publicar(); desenhar(); avisarOrigem();
  }
  // Avisos no serviço de origem (uma vez em cada computador)
  function avisarOrigem() {
    var v = vistos(), novos = [];
    pacientes().forEach(function (p) {
      var u = ultimo(p); if (!u || !u.estado || u.visto) return;
      var quando = u.estado === 'autorizado' ? u.autorizadoEm : u.estado === 'recusado' ? u.recusadoEm : u.estado === 'sem_resposta' ? u.expirouEm : null;
      if (!quando || Date.now() - Date.parse(quando) > 7 * 86400000) return;
      var kk = 'o:' + chaveF(p, u) + ':' + u.estado; if (v[kk]) return;
      novos.push({ p: p, u: u, kk: kk });
    });
    if (!novos.length) return;
    var x = novos[0], p = x.p, u = x.u, sv = nomeServ(u.servico);
    var marcar = function () { var vv = vistos(); vv[x.kk] = Date.now(); try { localStorage.setItem('cpfora_visto_' + slug(), JSON.stringify(vv)); } catch (e) {} setTimeout(avisarOrigem, 400); };
    if (u.estado === 'autorizado') {
      aviso('Pedido autorizado', 'O serviço de ' + sv + ' autorizou o internamento de ' + p.nome + ' (NUP ' + (p.nup || '—') + '). Autorizado por ' + (u.autorizadoPor || '—') + (u.autorizadoFuncao ? ' (' + u.autorizadoFuncao + ')' : '') + ' em ' + fmtEm(u.autorizadoEm) + '. O doente passa a estar internado em ' + sv + '.', [{ texto: 'OK', principal: true, acao: marcar }], 'ok');
    } else if (u.estado === 'recusado') {
      aviso('Pedido recusado', 'O serviço de ' + sv + ' recusou o internamento de ' + p.nome + ' (NUP ' + (p.nup || '—') + '). Recusado por ' + (u.recusadoPor || '—') + (u.recusadoFuncao ? ' (' + u.recusadoFuncao + ')' : '') + ' em ' + fmtEm(u.recusadoEm) + '. O doente continua neste serviço.',
        [{ texto: 'Pedir a outro serviço', principal: true, acao: function () { marcar(); pedirOutro(p.n); } }, { texto: 'Fechar', acao: marcar }]);
    } else {
      aviso('Sem resposta em 24 horas', 'O serviço de ' + sv + ' não autorizou em 24 horas o internamento de ' + p.nome + ' (NUP ' + (p.nup || '—') + '), pedido em ' + fmtEm(u.pedidoEm) + '. O doente continua neste serviço.',
        [{ texto: 'Pedir a outro serviço', principal: true, acao: function () { marcar(); pedirOutro(p.n); } }, { texto: 'Fechar', acao: marcar }]);
    }
  }

  // ── Quadros na página ──
  function desenhar() {
    var mv = document.getElementById('mainView'); if (!mv) return;
    var box = document.getElementById('cpf-quadros');
    if (!box) { box = document.createElement('div'); box.id = 'cpf-quadros'; var ref = mv.querySelector('.internados-panel'); mv.insertBefore(box, ref || mv.firstChild); }
    var h = '';
    // Pedidos recebidos (à espera da decisão deste serviço)
    var ped = pedidosAqui();
    if (ped.length) {
      h += '<div class="cpf-q cpf-pedidos"><div class="cpf-qh"><b>Pedidos de internamento no seu serviço — a aguardar autorização</b><span class="cpf-n on">' + ped.length + '</span></div><table class="cpf-t"><thead><tr><th>Doente</th><th>Serviço do doente</th><th>Pedido</th><th>Pedido por</th><th></th></tr></thead><tbody>' + ped.map(function (r) {
        return '<tr id="cpf-r-' + esc(r._k) + '"><td><b>' + esc(r.nome) + '</b><small>NUP ' + esc(r.nup || '—') + (r.genero ? ' · ' + esc(r.genero) : '') + (r.idade !== '' && r.idade != null ? ' · ' + esc(r.idade) + ' anos' : '') + '</small>' + (r.diagnostico ? '<small>' + esc(r.diagnostico) + '</small>' : '') + '</td>' +
          '<td><span class="cpf-tag o">' + esc(r.deNome || nomeServ(r.de)) + '</span></td><td>' + fmtEm(r.pedidoEm) + '<small>' + fmtRest(restante(r.pedidoEm)) + '</small></td>' +
          '<td>' + esc(r.por || '—') + (r.funcao ? ' <small>' + esc(r.funcao) + '</small>' : '') + '</td>' +
          '<td class="cpf-acs"><button type="button" class="cpf-bt p" data-autorizar="' + esc(r._k) + '">Autorizar</button><button type="button" class="cpf-bt r" data-recusar="' + esc(r._k) + '">Recusar</button></td></tr>';
      }).join('') + '</tbody></table></div>';
    }
    // Doentes deste serviço: noutros serviços, pedidos enviados, recusas/sem resposta
    var meus = pacientes().filter(function (p) { if (p.status !== 'internado') return false; var u = ultimo(p); if (!u) return false; if (ativo(p) || pendente(p)) return true; return (u.estado === 'recusado' || u.estado === 'sem_resposta') && !u.visto; });
    h += '<div class="cpf-q"><div class="cpf-qh"><b>Doentes do serviço internados noutros serviços</b><span class="cpf-n' + (meus.length ? ' on' : '') + '">' + meus.length + '</span></div>';
    h += meus.length ? '<table class="cpf-t"><thead><tr><th>Doente</th><th>Serviço</th><th>Situação</th><th>Registado por</th><th></th></tr></thead><tbody>' + meus.map(function (p) {
      var f = ultimo(p), sit, bt;
      if (ativo(p)) { sit = 'Internado desde ' + fmtDH(f.desde) + (f.autorizadoPor ? '<small>Autorizado por ' + esc(f.autorizadoPor) + '</small>' : ''); bt = '<button type="button" class="cpf-bt p" data-regresso="' + p.n + '" title="O doente volta para este serviço com a data de entrada real">Mover para o serviço</button>'; }
      else if (pendente(p)) { sit = '<span class="cpf-est e">A aguardar autorização</span><small>Pedido ' + fmtEm(f.pedidoEm) + ' · ' + fmtRest(restante(f.pedidoEm)) + '</small>'; bt = '<button type="button" class="cpf-bt" data-cancelar="' + p.n + '">Cancelar pedido</button>'; }
      else { sit = '<span class="cpf-est r">' + (f.estado === 'recusado' ? 'Recusado' : 'Sem resposta em 24 h') + '</span><small>' + (f.estado === 'recusado' ? 'por ' + esc(f.recusadoPor || '—') + ' · ' + fmtEm(f.recusadoEm) : 'pedido ' + fmtEm(f.pedidoEm)) + '</small>'; bt = '<button type="button" class="cpf-bt p" data-outro="' + p.n + '">Pedir a outro serviço</button><button type="button" class="cpf-bt" data-fica="' + p.n + '">Fica aqui</button>'; }
      return '<tr><td><b class="cpp-link" data-proc="' + p.n + '">' + esc(p.nome) + '</b><small>NUP ' + esc(p.nup || '—') + '</small></td><td><span class="cpf-tag">' + esc(nomeServ(f.servico)) + '</span></td><td>' + sit + '</td><td>' + esc(f.por || '—') + (f.funcao ? ' <small>' + esc(f.funcao) + '</small>' : '') + '<small>' + fmtEm(f.em) + '</small></td>' +
        '<td class="cpf-acs">' + bt + '</td></tr>';
    }).join('') + '</tbody></table>' : '<div class="cpf-vz">Nenhum doente deste serviço está internado noutro serviço.</div>';
    h += '</div>';
    var aqui = ativosAqui();
    h += '<div class="cpf-q"><div class="cpf-qh"><b>Doentes de outros serviços internados aqui</b><span class="cpf-n' + (aqui.length ? ' on' : '') + '">' + aqui.length + '</span></div>';
    h += aqui.length ? '<table class="cpf-t"><thead><tr><th>Doente</th><th>Serviço do doente</th><th>Desde</th><th>Registado por</th></tr></thead><tbody>' + aqui.map(function (r) {
      return '<tr id="cpf-r-' + esc(r._k) + '"><td><b>' + esc(r.nome) + '</b><small>NUP ' + esc(r.nup || '—') + (r.genero ? ' · ' + esc(r.genero) : '') + (r.idade !== '' && r.idade != null ? ' · ' + esc(r.idade) + ' anos' : '') + '</small>' + (r.diagnostico ? '<small>' + esc(r.diagnostico) + '</small>' : '') + '</td><td><span class="cpf-tag o">' + esc(r.deNome || nomeServ(r.de)) + '</span></td><td>' + fmtDH(desdeR(r)) + '</td>' +
        '<td>' + esc(r.por || '—') + (r.funcao ? ' <small>' + esc(r.funcao) + '</small>' : '') + '<small>' + fmtEm(r.em) + '</small>' + (r.resposta ? '<small>Autorizado por ' + esc(r.resposta.por || '—') + ' · ' + fmtEm(r.resposta.em) + '</small>' : '') + '</td></tr>';
    }).join('') + '</tbody></table><div class="cpf-nota">Camas emprestadas: no Movimento deste serviço os dias de cama descem 1 por cada doente e por cada dia, até à saída ou regresso do doente.</div>' : '<div class="cpf-vz">Nenhum doente de outro serviço está internado aqui.</div>';
    box.innerHTML = h + '</div>';
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target : null; if (!t) return;
    var b;
    if ((b = t.closest('[data-regresso]'))) { regressou(+b.dataset.regresso); return; }
    if ((b = t.closest('[data-cancelar]'))) { cancelar(+b.dataset.cancelar); return; }
    if ((b = t.closest('[data-outro]'))) { pedirOutro(+b.dataset.outro); return; }
    if ((b = t.closest('[data-fica]'))) { fecharAviso(+b.dataset.fica); return; }
    if ((b = t.closest('[data-autorizar]'))) { pedirDecisao(b.dataset.autorizar, 'autorizado'); return; }
    if ((b = t.closest('[data-recusar]'))) { pedirDecisao(b.dataset.recusar, 'recusado'); return; }
    var pr = t.closest('#cpf-quadros [data-proc]'); if (pr && window.ZeloCpProcesso) window.ZeloCpProcesso.abrir(+pr.dataset.proc);
  });

  // ── Notificação no serviço pedido ──
  function vistos() { try { return JSON.parse(localStorage.getItem('cpfora_visto_' + slug()) || '{}'); } catch (e) { return {}; } }
  function notificar() {
    var v = vistos();
    var ped = pedidosAqui().filter(function (r) { return !v['p:' + r._k]; });
    if (ped.length) {
      var r = ped[0];
      var marcar = function () { var vv = vistos(); vv['p:' + r._k] = Date.now(); try { localStorage.setItem('cpfora_visto_' + slug(), JSON.stringify(vv)); } catch (e) {} setTimeout(notificar, 400); };
      var texto = 'O serviço de ' + (r.deNome || nomeServ(r.de)) + ' pede autorização para internar no seu serviço: ' + r.nome + ' (NUP ' + (r.nup || '—') + (r.genero ? ', ' + r.genero : '') + (r.idade !== '' && r.idade != null ? ', ' + r.idade + ' anos' : '') + ')' + (r.diagnostico ? ' — ' + r.diagnostico : '') + '. Pedido por ' + (r.por || '—') + (r.funcao ? ' (' + r.funcao + ')' : '') + ' em ' + fmtEm(r.pedidoEm) + '. Tem 24 horas para responder (' + fmtRest(restante(r.pedidoEm)) + ').' + (ped.length > 1 ? ' E mais ' + (ped.length - 1) + ' pedido(s).' : '');
      aviso('Pedido de internamento', texto, [
        { texto: 'Autorizar', principal: true, acao: function () { decidir(r._k, 'autorizado'); setTimeout(notificar, 400); } },
        { texto: 'Recusar', acao: function () { decidir(r._k, 'recusado'); setTimeout(notificar, 400); } },
        { texto: 'Mais tarde', acao: function () { var vv = vistos(); vv['p:' + r._k] = Date.now(); try { localStorage.setItem('cpfora_visto_' + slug(), JSON.stringify(vv)); } catch (e) {} } }]);
      return;
    }
    // Doente que estava aqui voltou para o seu serviço (a cama ficou livre)
    var volt = todosR().filter(function (x) { return x.ate && x.regressoEm && Date.now() - Date.parse(x.regressoEm) < 3 * 86400000 && !v['r:' + x._k]; });
    if (volt.length) {
      var y = volt[0];
      var marcarR = function () { var vv = vistos(); volt.forEach(function (z) { vv['r:' + z._k] = Date.now(); }); try { localStorage.setItem('cpfora_visto_' + slug(), JSON.stringify(vv)); } catch (e) {} setTimeout(notificar, 400); };
      aviso('Cama livre', y.nome + ' (NUP ' + (y.nup || '—') + ') voltou para o serviço de ' + (y.deNome || nomeServ(y.de)) + ' em ' + fmtEm(y.regressoEm) + (y.regressoPor ? ' (movido por ' + y.regressoPor + ')' : '') + '. A cama no seu serviço ficou livre.' + (volt.length > 1 ? ' E mais ' + (volt.length - 1) + '.' : ''), [{ texto: 'OK', principal: true, acao: marcarR }], 'ok');
      return;
    }
    // Registos antigos (sem pedido): só aviso
    var novos = ativosAqui().filter(function (x) { return !x.resposta && !x.pedidoEm && !v[x._k]; });
    if (!novos.length) return;
    var x = novos[0];
    var marcarA = function () { var vv = vistos(); novos.forEach(function (y) { vv[y._k] = Date.now(); }); try { localStorage.setItem('cpfora_visto_' + slug(), JSON.stringify(vv)); } catch (e) {} };
    aviso('Doente internado no seu serviço', 'Um doente do serviço de ' + (x.deNome || nomeServ(x.de)) + ' foi internado no seu serviço: ' + x.nome + ' (NUP ' + (x.nup || '—') + '). Registado por ' + (x.por || '—') + (x.funcao ? ' (' + x.funcao + ')' : '') + (x.em ? ' em ' + fmtEm(x.em) : '') + '.' + (novos.length > 1 ? ' E mais ' + (novos.length - 1) + '.' : ''),
      [{ texto: 'Visualizar', principal: true, acao: function () { marcarA(); var row = document.getElementById('cpf-r-' + x._k); (row || document.getElementById('cpf-quadros') || document.body).scrollIntoView({ behavior: 'smooth', block: 'center' }); } }, { texto: 'Mais tarde', acao: marcarA }]);
  }
  var tN = null, tO = null;
  function escutar() {
    if (typeof window.__fbListen !== 'function') return false;
    window.__fbListen('registos_sistemas_locais/cp_fora/' + slug(), function (v) {
      recebidos = v && typeof v === 'object' ? v : {};
      desenhar(); clearTimeout(tN); tN = setTimeout(notificar, 800);
    });
    window.__fbListen('registos_sistemas_locais/cp_fora_resposta/' + slug(), function (v) {
      respostas = v && typeof v === 'object' ? v : {}; respLidas = true;
      clearTimeout(tO); tO = setTimeout(processarOrigem, 600);
    });
    return true;
  }
  // Prazos de 24 h e contagem do tempo em falta
  setInterval(function () { if (respLidas) processarOrigem(); else desenhar(); }, 60000);

  var css = document.createElement('style');
  css.textContent = [
    '.cpf-tag{display:inline-block;font:700 .7rem Inter,Arial,sans-serif;border-radius:999px;padding:2px 8px;background:#FEF3C7;color:#92400E;border:1px solid #FDE68A;margin-left:6px;white-space:nowrap}',
    '.cpf-tag.e{background:#EDE9FE;color:#5B21B6;border-color:#DDD6FE}',
    '.cpf-est{display:inline-block;font:800 .72rem Inter,Arial,sans-serif;border-radius:7px;padding:2px 7px}.cpf-est.e{background:#EDE9FE;color:#5B21B6}.cpf-est.r{background:#FEE2E2;color:#991B1B}',
    '.cpf-pedidos{grid-column:1/-1;border-color:#C4B5FD;box-shadow:0 0 0 3px rgba(139,92,246,.12)}.cpf-pedidos .cpf-qh{background:#F5F3FF}',
    '.cpf-acs{white-space:nowrap}.cpf-acs .cpf-bt+.cpf-bt{margin-left:6px}.cpf-bt.r{color:#B91C1C;border-color:#FECACA}',
    '.cpf-sv small{display:block;font:600 .72rem Inter,Arial,sans-serif;color:#047857;margin-top:3px}.cpf-sv.cheio{opacity:.65;background:#F8FAFC;cursor:not-allowed}.cpf-sv.cheio small{color:#B91C1C}',
    '.cpf-tag.o{background:#EEF4FB;color:#1E3A5F;border-color:#BFD3EA;margin-left:0}',
    '#cpf-quadros{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:0 0 16px}',
    '@media(max-width:1000px){#cpf-quadros{grid-template-columns:1fr}}',
    '.cpf-q{background:#fff;border:1px solid #E3E8F0;border-radius:14px;overflow:hidden;font-family:Inter,"Segoe UI",Arial,sans-serif}',
    '.cpf-qh{display:flex;align-items:center;gap:10px;padding:11px 14px;border-bottom:1px solid #E3E8F0;color:#1E3A5F;font-size:.9rem}',
    '.cpf-n{margin-left:auto;min-width:26px;text-align:center;border-radius:999px;padding:2px 8px;background:#F1F5F9;color:#64748B;font:800 .8rem ui-monospace,monospace}.cpf-n.on{background:#FEF3C7;color:#92400E}',
    '.cpf-t{width:100%;border-collapse:collapse;font-size:.84rem}.cpf-t th{text-align:left;font:800 .64rem Inter,Arial,sans-serif;letter-spacing:.07em;text-transform:uppercase;color:#64748B;padding:8px 12px;background:#F8FAFC}',
    '.cpf-t td{padding:8px 12px;border-top:1px solid #EEF2F7;vertical-align:top}.cpf-t small{display:block;color:#64748B;font-size:.74rem;margin-top:2px}',
    '.cpf-t tr.cpf-real td{background:#FEF3C7;transition:background .3s}',
    '.cpf-vz{padding:12px 14px;color:#64748B;font-size:.84rem}',
    '.cpf-nota{padding:8px 14px;color:#64748B;font-size:.76rem;border-top:1px solid #EEF2F7}',
    '.cpf-passar{display:flex;gap:6px;flex-wrap:wrap;padding:10px 14px;border-top:1px solid #EEF2F7;background:#FAFBFD}',
    '.cpf-passar select{flex:1;min-width:150px;border:1px solid #D6E0EC;border-radius:9px;padding:7px 9px;font:500 .82rem Inter,Arial,sans-serif;background:#fff}',
    '.cpf-bt{border:1px solid #D6E0EC;background:#fff;color:#1E3A5F;border-radius:9px;padding:6px 10px;font:700 .78rem Inter,Arial,sans-serif;cursor:pointer;white-space:nowrap}.cpf-bt.p{background:#1E3A5F;color:#fff;border-color:#1E3A5F}',
    '.cpf-novo{background:#F4F8FC;border:1px solid #D6E2F0;border-radius:12px;padding:10px 12px;margin:10px 0}',
    '.cpf-novo>label{display:block;font:800 .7rem Inter,Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#1E3A5F;margin-bottom:6px}',
    '.cpf-op{display:flex;gap:10px 16px;flex-wrap:wrap;align-items:center;font-size:.88rem}.cpf-op label{display:flex;gap:6px;align-items:center;cursor:pointer}',
    '.cpf-op select{flex:1;min-width:220px;border:1.5px solid #D6E0EC;border-radius:9px;padding:7px 9px;font:600 .86rem Inter,Arial,sans-serif}',
    '.cpf-lot{margin-top:6px;font:600 .78rem Inter,Arial,sans-serif;color:#047857}.cpf-lot.cheio{color:#B91C1C}',
    '.cpf-ov{position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:2147482900;display:flex;align-items:center;justify-content:center;padding:16px}',
    '.cpf-card{background:#fff;border-radius:16px;width:min(560px,100%);overflow:hidden;box-shadow:0 24px 60px rgba(15,23,42,.35);font-family:Inter,"Segoe UI",Arial,sans-serif}',
    '.cpf-top{display:flex;align-items:center;gap:10px;padding:14px 16px;background:linear-gradient(90deg,#B45309,#D97706);color:#fff}.cpf-top .x{margin-left:auto;width:32px;height:32px;border-radius:9px;border:1px solid rgba(255,255,255,.4);background:rgba(255,255,255,.12);color:#fff;font-size:1.1rem;cursor:pointer}',
    '.cpf-cb{padding:14px 16px;font-size:.9rem;color:#0F172A}',
    '.cpf-lista{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0}',
    '.cpf-sv{border:1.5px solid #D6E0EC;background:#fff;border-radius:11px;padding:10px;font:700 .86rem Inter,Arial,sans-serif;color:#1E3A5F;cursor:pointer;text-align:left}.cpf-sv:hover{border-color:#1E3A5F;background:#EEF4FB}',
    '.cpf-aqui{width:100%;border:1px dashed #CBD5E1;background:#F8FAFC;border-radius:11px;padding:9px;font:600 .82rem Inter,Arial,sans-serif;color:#475569;cursor:pointer}'
  ].join('\n');
  document.head.appendChild(css);

  var t = 0, esc_ok = false, iv = setInterval(function () {
    t++;
    var a = envolverAdd(), s = envolverSave(), o = envolverAbrir();
    if (!esc_ok && window.__fbReady) esc_ok = escutar();
    if (document.getElementById('mainView') && typeof data !== 'undefined' && !document.getElementById('cpf-quadros')) desenhar();
    if ((a && s && o && esc_ok) || t > 120) { clearInterval(iv); lerCamas(); publicar(); }
  }, 250);
})();
