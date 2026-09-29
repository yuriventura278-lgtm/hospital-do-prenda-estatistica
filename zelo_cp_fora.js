// ── ZELO — Controlo de Pacientes: doentes internados fora do serviço ──
// Partilhado pelas 8 páginas de Controlo de Pacientes.
// • Novo Paciente: nunca por decisão própria — só quando o serviço está cheio
//   (doentes internados ≥ camas do Movimento) o sistema pergunta em que
//   serviço o doente fica internado (ou cama extra).
// • O doente continua a ser do seu serviço (conta nos seus admitidos,
//   saídos e dias-doente); o serviço que empresta a cama perde 1 dia de cama
//   por cada dia (zelo_mov_auto.js) e o serviço de origem ganha essa cama.
// • Cada página mostra: "Doentes do serviço internados noutros serviços"
//   (com "Regressou ao serviço") e "Doentes de outros serviços internados
//   aqui"; o serviço que recebe é notificado (quem registou e a que horas).
// Guardado em:
//   doente.foraServico (texto JSON): [{ servico, desde, ate, por, funcao, em, regressoPor, regressoEm }]
//   registos_sistemas_locais/cp_fora/<serviço que recebe>/<chave>: cópia resumida
//   (lida pelo serviço que recebe, pelo Movimento e pelo Movimento Geral).
// Nada é apagado: o regresso só fecha o período (ate).
(function () {
  if (window.__zeloCpFora) return;
  window.__zeloCpFora = true;

  var SERV = [['medicina_interna', 'Medicina Interna'], ['cirurgia_geral', 'Cirurgia Geral'], ['ortopedia', 'Ortopedia'], ['neurocirurgia', 'Neurocirurgia'],
    ['maxilo_facial', 'Maxilo-Facial'], ['nefrologia', 'Nefrologia'], ['uci_intensivo', 'UCI — Intensivos'], ['uci_intermedio', 'Cuidados Intermédios']];
  var FUNCOES = { admin: 'Administrador', chefe_servico: 'Chefe de Serviço', enfermeiro_chefe: 'Enfermeiro(a) Chefe', enfermeiro: 'Enfermeiro(a)', secretario: 'Secretário(a)', medico: 'Médico(a)' };
  function nomeServ(s) { var r = SERV.filter(function (x) { return x[0] === s; })[0]; return r ? r[1] : s; }
  function slug() { try { return String(FB_PACIENTES_PATH).split('/').pop(); } catch (e) { return ''; } }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pacientes() { try { return (typeof data !== 'undefined' && data && Array.isArray(data.patients)) ? data.patients : []; } catch (e) { return []; } }
  function agoraLocal() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + 'T' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  function fmtDH(iso) { var s = String(iso || ''); if (s.length < 10) return '—'; var p = s.slice(0, 10).split('-'); return p[2] + '/' + p[1] + '/' + p[0] + (s.length >= 16 ? ' às ' + s.slice(11, 16) : ''); }
  function quem() {
    var nome = '', role = '';
    try { nome = sessionStorage.getItem('zeloNome') || sessionStorage.getItem('zeloEmail') || ''; role = sessionStorage.getItem('zeloRole') || ''; } catch (e) {}
    return { nome: nome || 'Utilizador', funcao: FUNCOES[role] || role };
  }
  function lista(p) { try { var l = JSON.parse(p.foraServico || '[]'); return Array.isArray(l) ? l : []; } catch (e) { return []; } }
  function ativo(p) { if (!p || p.status !== 'internado') return null; var l = lista(p); var u = l[l.length - 1]; return u && !u.ate ? u : null; }
  window.zeloCpForaLista = lista;
  window.zeloCpForaAtivo = ativo;
  window.zeloCpForaTxt = function (p) { var f = ativo(p); return f ? '<span class="cpf-tag" title="Internado fora do serviço desde ' + esc(fmtDH(f.desde)) + '">Internado em ' + esc(nomeServ(f.servico)) + '</span>' : ''; };

  // ── Camas do serviço (do Movimento) e ocupação ──
  function itemMov(genero) { var s = slug(); if (s === 'medicina_interna') return genero === 'Feminino' ? 'medicina_mulher' : genero === 'Masculino' ? 'medicina_homem' : null; return s; }
  var camas = {};
  function lerCamas() {
    if (typeof window.__fbGet !== 'function') return Promise.resolve();
    var itens = slug() === 'medicina_interna' ? ['medicina_homem', 'medicina_mulher'] : [slug()];
    return Promise.all(itens.map(function (it) {
      return window.__fbGet('registos_movimento/' + it + '/snapshot/__capacity').then(function (v) { camas[it] = Number(v) > 0 ? Number(v) : 50; }).catch(function () {});
    }));
  }
  function ocupacao(genero) {
    var med = slug() === 'medicina_interna';
    return pacientes().filter(function (p) { return p.status === 'internado' && !ativo(p) && (!med || p.genero === genero); }).length;
  }

  // ── Publicar (serviço que recebe, Movimento e Movimento Geral leem daqui) ──
  function chave(p, f) { return (slug() + '_' + String(p.nup || ('n' + p.n)) + '_e' + (p.episodio || 1) + '_' + String(f.desde || '').replace(/\D/g, '')).replace(/[.#$\[\]\/]/g, '_'); }
  function publicar() {
    if (typeof window.zeloQueueWrite !== 'function') return;
    pacientes().forEach(function (p) {
      lista(p).forEach(function (f) {
        if (!f.servico) return;
        var r = { de: slug(), deNome: nomeServ(slug()), nome: p.nome || '', nup: p.nup || '', genero: p.genero || '', idade: p.idade == null ? '' : p.idade, diagnostico: p.diagnostico || '',
          desde: f.desde || '', ate: f.ate || '', dataSaida: p.dataSaida || '', tipoSaida: p.tipoSaida || '', status: p.status || '', por: f.por || '', funcao: f.funcao || '', em: f.em || '',
          regressoPor: f.regressoPor || '', regressoEm: f.regressoEm || '' };
        var k = chave(p, f), j = JSON.stringify(r), lk = 'cpfora_pub_' + f.servico + '_' + k;
        var ant = null; try { ant = localStorage.getItem(lk); } catch (e) {}
        if (ant === j) return;
        try { window.zeloQueueWrite('registos_sistemas_locais/cp_fora/' + f.servico + '/' + k, r); localStorage.setItem(lk, j); } catch (e) {}
      });
    });
  }
  // desde: no registo = a entrada do doente; ao passar mais tarde = agora.
  function marcarFora(p, servico, desde) {
    var q = quem(), l = lista(p);
    l.push({ servico: servico, desde: desde || agoraLocal(), ate: null, por: q.nome, funcao: q.funcao, em: new Date().toISOString() });
    p.foraServico = JSON.stringify(l);
  }
  function regressou(n) {
    var p = pacientes().filter(function (x) { return x.n === n; })[0]; if (!p) return;
    var l = lista(p), u = l[l.length - 1]; if (!u || u.ate) return;
    if (!confirm(p.nome + ' regressou ao serviço (' + nomeServ(slug()) + ')? A cama em ' + nomeServ(u.servico) + ' fica livre a partir de agora.')) return;
    var q = quem(); u.ate = agoraLocal(); u.regressoPor = q.nome; u.regressoEm = new Date().toISOString();
    p.foraServico = JSON.stringify(l);
    try { saveData(); updateStats(); renderInternados(); } catch (e) {}
    desenhar();
  }


  // ── Novo Paciente: onde fica internado ──
  var confirmouAqui = false;
  function blocoNovo() {
    var m = document.getElementById('novoModal'), corpo = m && m.querySelector('.modal-body');
    if (!corpo || document.getElementById('cpf-novo')) return !!corpo;
    var b = document.createElement('div'); b.id = 'cpf-novo'; b.className = 'cpf-novo';
    // Sem escolha manual: internar fora só quando o serviço não tem camas livres
    // (o sistema pergunta no momento do registo).
    b.innerHTML = '<label>Camas do serviço</label><div class="cpf-lot" id="cpf-lot"></div>';
    var ref = corpo.querySelector('.cp-dx-dica') || null;
    var diag = document.getElementById('fDiagnostico'), lin = diag && diag.closest('.form-row');
    if (lin && lin.parentNode === corpo) corpo.insertBefore(b, lin); else corpo.appendChild(b);
    var g = document.getElementById('fGenero'); if (g) g.addEventListener('change', lotacao);
    return true;
  }
  function lotacao() {
    var el = document.getElementById('cpf-lot'); if (!el) return;
    var g = (document.getElementById('fGenero') || {}).value || '', it = itemMov(g);
    if (!it || !camas[it]) { el.textContent = slug() === 'medicina_interna' && !g ? 'Escolha o género para ver as camas livres (Medicina Homem / Mulher).' : ''; return; }
    var oc = ocupacao(g), livres = camas[it] - oc;
    el.className = 'cpf-lot' + (livres <= 0 ? ' cheio' : '');
    el.textContent = (slug() === 'medicina_interna' ? (g === 'Feminino' ? 'Medicina Mulher' : 'Medicina Homem') + ': ' : '') + camas[it] + ' camas · ' + oc + ' internados no serviço · ' + (livres > 0 ? livres + ' livre(s)' : 'sem camas livres');
  }
  var hostEscolhido = '';   // escolhido na pergunta "Sem camas livres"
  function escolhido() { return hostEscolhido; }
  function perguntar(g, oc, cap, continuar) {
    var livres = {};
    var html = '<div style="text-align:left">O serviço tem <b>' + cap + ' camas</b> e já estão <b>' + oc + ' doentes</b> internados. Em que serviço o doente vai ficar internado?</div>' +
      '<div class="cpf-lista">' + SERV.filter(function (s) { return s[0] !== slug(); }).map(function (s) { return '<button type="button" class="cpf-sv" data-s="' + s[0] + '">' + esc(s[1]) + '</button>'; }).join('') + '</div>';
    var ov = document.createElement('div'); ov.className = 'cpf-ov';
    ov.innerHTML = '<div class="cpf-card" role="dialog" aria-label="Sem camas livres"><div class="cpf-top"><b>Sem camas livres em ' + esc(nomeServ(slug())) + '</b><button type="button" class="x" data-x aria-label="Fechar">×</button></div><div class="cpf-cb">' + html +
      '<button type="button" class="cpf-aqui" data-aqui>Fica neste serviço mesmo assim (cama extra)</button></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('[data-x]')) { ov.remove(); return; }
      var b = e.target.closest('[data-s]');
      if (b) { ov.remove(); hostEscolhido = b.dataset.s; continuar(); return; }
      if (e.target.closest('[data-aqui]')) { ov.remove(); confirmouAqui = true; continuar(); }
    });
  }
  function envolverAdd() {
    var f = window.addPaciente; if (typeof f !== 'function' || f.__cpf) return !!(f && f.__cpf);
    var novo = function () {
      var self = this, args = arguments;
      var host = escolhido();
      if (!host && !confirmouAqui) {
        var g = (document.getElementById('fGenero') || {}).value || '', it = itemMov(g), cap = it && camas[it];
        if (cap) { var oc = ocupacao(g); if (oc >= cap) { perguntar(g, oc, cap, function () { window.addPaciente(); }); return; } }
      }
      var n = data.nextN;
      var r = f.apply(self, args);
      var p = pacientes().filter(function (x) { return x.n === n; })[0];
      if (p && host) {
        marcarFora(p, host, p.dataEntrada);
        try { saveData(); renderInternados(); } catch (e) {}
        if (typeof showFeedback === 'function') showFeedback(p.nome + ' registado — internado em ' + nomeServ(host) + ' (fora do serviço)', 'success');
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

  // ── Quadros na página ──
  var recebidos = {};   // entradas de cp_fora/<este serviço>
  function ativosAqui() { return Object.keys(recebidos).map(function (k) { var r = recebidos[k]; r._k = k; return r; }).filter(function (r) { return r && !r.ate && !r.dataSaida && r.status !== 'saido'; }); }
  function desenhar() {
    var mv = document.getElementById('mainView'); if (!mv) return;
    var box = document.getElementById('cpf-quadros');
    if (!box) { box = document.createElement('div'); box.id = 'cpf-quadros'; var ref = mv.querySelector('.internados-panel'); mv.insertBefore(box, ref || mv.firstChild); }
    var meus = pacientes().filter(function (p) { return ativo(p); }), aqui = ativosAqui();
    var internados = pacientes().filter(function (p) { return p.status === 'internado' && !ativo(p); });
    var h = '<div class="cpf-q"><div class="cpf-qh"><b>Doentes do serviço internados noutros serviços</b><span class="cpf-n' + (meus.length ? ' on' : '') + '">' + meus.length + '</span></div>';
    h += meus.length ? '<table class="cpf-t"><thead><tr><th>Doente</th><th>Internado em</th><th>Desde</th><th>Registado por</th><th></th></tr></thead><tbody>' + meus.map(function (p) {
      var f = ativo(p);
      return '<tr><td><b class="cpp-link" data-proc="' + p.n + '">' + esc(p.nome) + '</b><small>NUP ' + esc(p.nup || '—') + '</small></td><td><span class="cpf-tag">' + esc(nomeServ(f.servico)) + '</span></td><td>' + fmtDH(f.desde) + '</td><td>' + esc(f.por || '—') + (f.funcao ? ' <small>' + esc(f.funcao) + '</small>' : '') + '<small>' + (f.em ? new Date(f.em).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '') + '</small></td>' +
        '<td><button type="button" class="cpf-bt" data-regresso="' + p.n + '">Regressou ao serviço</button></td></tr>';
    // (A cama conta para este serviço — dia de cama e dia-doente — até ao regresso ou à saída do doente.)
    }).join('') + '</tbody></table>' : '<div class="cpf-vz">Nenhum doente deste serviço está internado noutro serviço.</div>';
    h += '</div>';
    h += '<div class="cpf-q"><div class="cpf-qh"><b>Doentes de outros serviços internados aqui</b><span class="cpf-n' + (aqui.length ? ' on' : '') + '">' + aqui.length + '</span></div>';
    h += aqui.length ? '<table class="cpf-t"><thead><tr><th>Doente</th><th>Serviço do doente</th><th>Desde</th><th>Registado por</th></tr></thead><tbody>' + aqui.map(function (r) {
      return '<tr id="cpf-r-' + esc(r._k) + '"><td><b>' + esc(r.nome) + '</b><small>NUP ' + esc(r.nup || '—') + (r.genero ? ' · ' + esc(r.genero) : '') + (r.idade !== '' ? ' · ' + esc(r.idade) + ' anos' : '') + '</small>' + (r.diagnostico ? '<small>' + esc(r.diagnostico) + '</small>' : '') + '</td><td><span class="cpf-tag o">' + esc(r.deNome || nomeServ(r.de)) + '</span></td><td>' + fmtDH(r.desde) + '</td>' +
        '<td>' + esc(r.por || '—') + (r.funcao ? ' <small>' + esc(r.funcao) + '</small>' : '') + '<small>' + (r.em ? new Date(r.em).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '') + '</small></td></tr>';
    }).join('') + '</tbody></table><div class="cpf-nota">Camas emprestadas: no Movimento deste serviço os dias de cama descem 1 por cada doente e por cada dia, até à saída ou regresso do doente.</div>' : '<div class="cpf-vz">Nenhum doente de outro serviço está internado aqui.</div>';
    box.innerHTML = h + '</div>';
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-regresso]'); if (b) { regressou(+b.dataset.regresso); return; }
    var pr = e.target.closest && e.target.closest('#cpf-quadros [data-proc]'); if (pr && window.ZeloCpProcesso) window.ZeloCpProcesso.abrir(+pr.dataset.proc);
  });

  // ── Notificação no serviço que recebe ──
  function vistos() { try { return JSON.parse(localStorage.getItem('cpfora_visto_' + slug()) || '{}'); } catch (e) { return {}; } }
  function notificar() {
    var v = vistos(), novos = ativosAqui().filter(function (r) { return !v[r._k]; });
    if (!novos.length) return;
    var r = novos[0];
    var marcar = function () { var vv = vistos(); novos.forEach(function (x) { vv[x._k] = Date.now(); }); try { localStorage.setItem('cpfora_visto_' + slug(), JSON.stringify(vv)); } catch (e) {} };
    var ver = function () { marcar(); var row = document.getElementById('cpf-r-' + r._k); var box = document.getElementById('cpf-quadros'); (row || box || document.body).scrollIntoView({ behavior: 'smooth', block: 'center' }); if (row) { row.classList.add('cpf-real'); setTimeout(function () { row.classList.remove('cpf-real'); }, 4000); } };
    var quando = r.em ? new Date(r.em).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
    var texto = 'Um doente do serviço de ' + (r.deNome || nomeServ(r.de)) + ' foi internado no seu serviço: ' + r.nome + ' (NUP ' + (r.nup || '—') + '). Registado por ' + (r.por || '—') + (r.funcao ? ' (' + r.funcao + ')' : '') + (quando ? ' em ' + quando : '') + '.' + (novos.length > 1 ? ' E mais ' + (novos.length - 1) + '.' : '');
    if (window.ZeloEspera && window.ZeloEspera.mensagem) {
      window.ZeloEspera.mensagem({ icone: 'aviso', etiqueta: 'Doente de outro serviço', titulo: 'Doente internado no seu serviço', texto: texto,
        botoes: [{ texto: 'Visualizar', principal: true, acao: ver }, { texto: 'Mais tarde', acao: marcar }] });
    } else if (confirm(texto + '\n\nVisualizar agora?')) ver(); else marcar();
  }
  var tN = null;
  function escutar() {
    if (typeof window.__fbListen !== 'function') return false;
    window.__fbListen('registos_sistemas_locais/cp_fora/' + slug(), function (v) {
      recebidos = v && typeof v === 'object' ? v : {};
      desenhar(); clearTimeout(tN); tN = setTimeout(notificar, 800);
    });
    return true;
  }

  var css = document.createElement('style');
  css.textContent = [
    '.cpf-tag{display:inline-block;font:700 .7rem Inter,Arial,sans-serif;border-radius:999px;padding:2px 8px;background:#FEF3C7;color:#92400E;border:1px solid #FDE68A;margin-left:6px;white-space:nowrap}',
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
    '.cpf-ov{position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:2147483600;display:flex;align-items:center;justify-content:center;padding:16px}',
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
