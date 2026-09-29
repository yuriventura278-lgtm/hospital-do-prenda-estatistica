// ── ZELO — Controlo de Pacientes: UCI e Cuidados Intermédios numa só página ──
// Só é carregado em controlo_pacientes_uci.html. Cada unidade continua com os
// seus registos no mesmo sítio de sempre
// (registos_sistemas_locais/controlo_pacientes/uci_intensivo e …/uci_intermedio),
// por isso o Movimento Hospitalar, os internamentos noutros serviços e as
// cópias de segurança continuam a funcionar sem mudar nada e nada é apagado.
//   • Barra "Unidade" no topo e no menu: UCI · Cuidados Intermédios · UCI + CI.
//     Os pacientes são registados na unidade escolhida.
//   • "UCI + CI (soma)": indicadores de cada unidade e a soma das duas, por
//     período, com a lista dos internados das duas unidades e PDF.
// Poupança do Firebase: a outra unidade só é lida quando se abre a soma
// (apenas a lista de pacientes, sem o histórico de alterações) e a leitura
// fica guardada 5 minutos.
(function () {
  'use strict';
  if (!window.CP_UCI || window.__zeloCpUci) return;
  window.__zeloCpUci = true;
  var U = window.CP_UCI_UNIDADES, AT = window.CP_UCI;
  var CAMAS = { intensivo: 8, intermedio: 8 };
  var ORDEM = ['intensivo', 'intermedio'];

  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function dia(v) { return String(v || '').slice(0, 10); }
  function fmtD(s) { var p = dia(s).split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : ''; }
  function num(v, c) { return v == null || isNaN(v) ? '—' : Number(v).toFixed(c || 0).replace('.', ','); }
  function irPara(u) { try { localStorage.setItem('zeloCpUciUnidade', u); } catch (e) {} location.href = 'controlo_pacientes_uci.html?u=' + u + (u === AT.u && location.hash ? location.hash : ''); }

  // ── estilos ──
  var css = document.createElement('style');
  css.textContent =
    '.cpu-bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 16px;padding:10px 12px;background:#fff;border:1px solid #DCE3EE;border-radius:12px;box-shadow:0 1px 3px rgba(15,23,42,.06)}' +
    '.cpu-bar .cpu-rot{font-size:.7rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#64748B;margin-right:2px}' +
    '.cpu-seg{display:flex;gap:6px;flex-wrap:wrap}' +
    '.cpu-seg button{display:inline-flex;align-items:center;gap:8px;padding:9px 14px;border-radius:10px;border:1.5px solid #CBD5E1;background:#F8FAFC;color:#334155;font:700 .86rem Inter,system-ui,sans-serif;cursor:pointer;transition:all .15s}' +
    '.cpu-seg button small{font-weight:600;color:#64748B;font-size:.72rem}' +
    '.cpu-seg button:hover{border-color:#1A56DB;color:#1A56DB}' +
    '.cpu-seg button.on{background:linear-gradient(135deg,#1A56DB,#0D1B3E);border-color:#1A56DB;color:#fff;box-shadow:0 3px 10px rgba(26,86,219,.3)}' +
    '.cpu-seg button.on small{color:#BFDBFE}' +
    '.cpu-seg button.soma.on{background:linear-gradient(135deg,#0F766E,#134E4A);border-color:#0F766E}' +
    '.cpu-aqui{margin-left:auto;font-size:.8rem;color:#475569}.cpu-aqui b{color:#0D1B3E}' +
    '.cpu-tag{display:inline-block;padding:2px 8px;border-radius:100px;font-size:.7rem;font-weight:800;letter-spacing:.02em}' +
    '.cpu-tag.intensivo{background:#DBEAFE;color:#1E40AF}.cpu-tag.intermedio{background:#FEF3C7;color:#92400E}' +
    '.cpu-modal-tag{margin:0 0 10px;padding:8px 12px;border-radius:8px;background:#EFF6FF;border:1px solid #BFDBFE;font-size:.85rem;color:#1E3A8A}' +
    '#somaView .cpu-per{display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;margin-bottom:14px;padding:12px 14px;background:#fff;border:1px solid #DCE3EE;border-radius:12px}' +
    '#somaView .cpu-per label{display:block;font-size:.66rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#64748B;margin-bottom:4px}' +
    '#somaView .cpu-per input{padding:8px 10px;border:1px solid #CBD5E1;border-radius:8px;font:600 .9rem Inter,system-ui,sans-serif}' +
    '#somaView .cpu-btn{padding:10px 16px;border:none;border-radius:9px;font:800 .78rem Inter,system-ui,sans-serif;letter-spacing:.04em;text-transform:uppercase;cursor:pointer;color:#fff;background:linear-gradient(135deg,#0a7a4e,#0c9560)}' +
    '#somaView .cpu-btn.pdf{background:linear-gradient(135deg,#b91c1c,#dc2626)}' +
    '#somaView .cpu-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:14px}' +
    '#somaView .cpu-kpi{border-radius:12px;padding:14px 16px;color:#fff}' +
    '#somaView .cpu-kpi .t{font-size:.66rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;opacity:.85}' +
    '#somaView .cpu-kpi .v{font-size:2rem;font-weight:300;line-height:1.1;font-family:"JetBrains Mono",ui-monospace,monospace}' +
    '#somaView .cpu-kpi .s{font-size:.74rem;opacity:.9}' +
    '#somaView .cpu-card{background:#fff;border:1px solid #DCE3EE;border-radius:12px;padding:16px;margin-bottom:14px;overflow-x:auto}' +
    '#somaView .cpu-card h3{font-size:.8rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#475569;margin:0 0 10px}' +
    '#somaView table{width:100%;border-collapse:collapse;font-size:.88rem}' +
    '#somaView th{padding:8px 10px;font-size:.7rem;text-transform:uppercase;letter-spacing:.06em;color:#fff;background:#1E3A5F;text-align:center}' +
    '#somaView th.l,#somaView td.l{text-align:left}' +
    '#somaView th.intensivo{background:#1E40AF}#somaView th.intermedio{background:#B45309}#somaView th.tot{background:#0F766E}' +
    '#somaView td{padding:7px 10px;border-bottom:1px solid #E2E8F0;text-align:center;font-variant-numeric:tabular-nums}' +
    '#somaView td.tot{font-weight:800;background:#F0FDFA;color:#0F766E}' +
    '#somaView tr.sub td.l{padding-left:26px;color:#475569}' +
    '#somaView tr:hover td{background:#F8FAFC}' +
    '#somaView .cpu-nota{font-size:.78rem;color:#64748B;margin-top:8px}' +
    '@media(max-width:700px){.cpu-aqui{margin-left:0;flex-basis:100%}.cpu-seg button{padding:8px 10px;font-size:.8rem}}';
  document.head.appendChild(css);

  // ── barra de unidades ──
  function botoes(ativo) {
    return ORDEM.map(function (u) {
      return '<button type="button" data-u="' + u + '" class="' + (ativo === u ? 'on' : '') + '">' + esc(U[u].nome) + ' <small>' + CAMAS[u] + ' camas</small></button>';
    }).join('') + '<button type="button" data-u="soma" class="soma' + (ativo === 'soma' ? ' on' : '') + '">UCI + CI <small>soma · 16 camas</small></button>';
  }
  var vistaSoma = false;
  function desenharBarra() {
    var b = $('cpuBar'); if (!b) return;
    b.querySelector('.cpu-seg').innerHTML = botoes(vistaSoma ? 'soma' : AT.u);
    b.querySelector('.cpu-aqui').innerHTML = vistaSoma ? 'A ver a <b>soma das duas unidades</b>' : 'A registar em: <b>' + esc(AT.longo) + '</b>';
  }
  function clicar(u) {
    if (u === 'soma') { mostrarSoma(); return; }
    if (u === AT.u) { if (vistaSoma) window.switchView('main'); return; }
    irPara(u);
  }

  // ── vista "UCI + CI (soma)" ──
  var cache = {};
  function pacientesDe(u) {
    if (u === AT.u) { try { return Promise.resolve((typeof data !== 'undefined' && data && data.patients) ? data.patients.slice() : []); } catch (e) { return Promise.resolve([]); } }
    var c = cache[u];
    if (c && Date.now() - c.ts < 5 * 60000) return Promise.resolve(c.v);
    function local() {
      try { var d = JSON.parse(localStorage.getItem('zelo_ctrl_pac_' + U[u].slug) || 'null'); var l = d && d.patients; return l ? (Array.isArray(l) ? l : Object.values(l)).filter(Boolean) : []; } catch (e) { return []; }
    }
    var pronto = window.__fbReady && typeof window.__fbGet === 'function';
    if (!pronto) return Promise.resolve(local());
    return window.__fbGet('registos_sistemas_locais/controlo_pacientes/' + U[u].slug + '/snapshot/pacientes').then(function (v) {
      var l = v ? Object.keys(v).map(function (k) { return v[k]; }).filter(function (p) { return p && p.dataEntrada; }) : local();
      cache[u] = { ts: Date.now(), v: l };
      return l;
    }).catch(local);
  }
  function genero(p) { var g = String(p.genero || '').toLowerCase(); return g.indexOf('mas') === 0 ? 'M' : (g.indexOf('fem') === 0 ? 'F' : 'N'); }
  function calcular(P, u, de, ate) {
    var dias = Math.round((new Date(ate) - new Date(de)) / 86400000) + 1;
    var ent = P.filter(function (p) { return p.dataEntrada && dia(p.dataEntrada) >= de && dia(p.dataEntrada) <= ate; });
    var sai = P.filter(function (p) { return p.status === 'saido' && p.dataSaida && dia(p.dataSaida) >= de && dia(p.dataSaida) <= ate; });
    var inicio = P.filter(function (p) { return p.dataEntrada && dia(p.dataEntrada) < de && (p.status === 'internado' || (p.dataSaida && dia(p.dataSaida) >= de)); });
    var fim = P.filter(function (p) { return p.dataEntrada && dia(p.dataEntrada) <= ate && (p.status === 'internado' || (p.dataSaida && dia(p.dataSaida) > ate)); });
    var ob = sai.filter(function (p) { return p.tipoSaida === 'Óbito'; });
    var outra = U[U[u].outro].nome;
    // Dias de internamento dentro do período (cada dia em que o doente esteve internado).
    var diasInt = 0;
    P.forEach(function (p) {
      if (!p.dataEntrada) return;
      var a = dia(p.dataEntrada) > de ? dia(p.dataEntrada) : de;
      var b = p.status === 'saido' && p.dataSaida ? dia(p.dataSaida) : ate;
      if (b > ate) b = ate;
      if (p.status === 'saido' && p.dataSaida && dia(p.dataSaida) < de) return;
      var n = Math.round((new Date(b) - new Date(a)) / 86400000) + (p.status === 'saido' && p.dataSaida && dia(p.dataSaida) <= ate ? 0 : 1);
      if (n > 0) diasInt += n;
    });
    var perm = sai.length ? sai.reduce(function (s, p) { return s + Math.max(0, Math.ceil((new Date(p.dataSaida) - new Date(p.dataEntrada)) / 86400000)); }, 0) / sai.length : null;
    return {
      camas: CAMAS[u], inicio: inicio.length, entradas: ent.length,
      entF: ent.filter(function (p) { return genero(p) === 'F'; }).length, entM: ent.filter(function (p) { return genero(p) === 'M'; }).length,
      daOutra: ent.filter(function (p) { return String(p.proveniencia || '').indexOf(outra) >= 0; }).length,
      saidas: sai.length, altas: sai.filter(function (p) { return p.tipoSaida === 'Alta Vivo'; }).length,
      obitos: ob.length, ob48: ob.filter(function (p) { return p.subtipo === 'Óbito <48h'; }).length, obM48: ob.filter(function (p) { return p.subtipo === 'Óbito >48h'; }).length,
      transf: sai.filter(function (p) { return p.tipoSaida === 'Transferência'; }).length,
      fim: fim.length, diasInt: diasInt, dias: dias, perm: perm,
      ocup: dias ? diasInt * 100 / (CAMAS[u] * dias) : null,
      internados: P.filter(function (p) { return p.status === 'internado'; })
    };
  }
  var LINHAS = [
    ['Camas', 'camas'], ['Internados no início do período', 'inicio'], ['Entradas', 'entradas'],
    ['Feminino', 'entF', 1], ['Masculino', 'entM', 1], ['Vindos da outra unidade', 'daOutra', 1],
    ['Saídas', 'saidas'], ['Altas', 'altas', 1], ['Óbitos', 'obitos', 1], ['Óbitos < 48h', 'ob48', 2], ['Óbitos > 48h', 'obM48', 2], ['Transferências', 'transf', 1],
    ['Internados no fim do período', 'fim'], ['Dias de internamento', 'diasInt'],
    ['Taxa de ocupação', 'ocup', 0, '%'], ['Permanência média (dias)', 'perm', 0, 'd']
  ];
  function totalDe(a, b) {
    var t = {};
    Object.keys(a).forEach(function (k) { if (typeof a[k] === 'number') t[k] = a[k] + (b[k] || 0); });
    t.dias = a.dias;
    t.ocup = t.dias ? t.diasInt * 100 / (t.camas * t.dias) : null;
    var nS = a.saidas + b.saidas;
    t.perm = nS ? ((a.perm || 0) * a.saidas + (b.perm || 0) * b.saidas) / nS : null;
    t.internados = a.internados.concat(b.internados);
    return t;
  }
  function valor(r, l) {
    var v = r[l[1]];
    if (l[3] === '%') return v == null ? '—' : num(v, 1) + '%';
    if (l[3] === 'd') return v == null ? '—' : num(v, 1);
    return v;
  }
  var ultimo = null;
  function periodo() {
    var de = $('cpuDe').value, ate = $('cpuAte').value;
    if (!de || !ate || de > ate) { var h = new Date(); de = iso(new Date(h.getFullYear(), h.getMonth(), 1)); ate = iso(h); $('cpuDe').value = de; $('cpuAte').value = ate; }
    return { de: de, ate: ate };
  }
  function calcularSoma() {
    var p = periodo();
    $('cpuOut').innerHTML = '<div class="cpu-card">A carregar as duas unidades…</div>';
    return Promise.all(ORDEM.map(pacientesDe)).then(function (listas) {
      var r = {}; ORDEM.forEach(function (u, i) { r[u] = calcular(listas[i], u, p.de, p.ate); });
      r.total = totalDe(r.intensivo, r.intermedio);
      ultimo = { p: p, r: r };
      desenharSoma();
    });
  }
  function desenharSoma() {
    var r = ultimo.r, p = ultimo.p, T = r.total;
    var h = '<div class="cpu-kpis">' +
      '<div class="cpu-kpi" style="background:linear-gradient(135deg,#1E40AF,#1E3A8A)"><div class="t">Internados agora · UCI</div><div class="v">' + r.intensivo.internados.length + '</div><div class="s">de ' + CAMAS.intensivo + ' camas</div></div>' +
      '<div class="cpu-kpi" style="background:linear-gradient(135deg,#D97706,#B45309)"><div class="t">Internados agora · Cuidados Intermédios</div><div class="v">' + r.intermedio.internados.length + '</div><div class="s">de ' + CAMAS.intermedio + ' camas</div></div>' +
      '<div class="cpu-kpi" style="background:linear-gradient(135deg,#0F766E,#134E4A)"><div class="t">Internados agora · UCI + CI</div><div class="v">' + T.internados.length + '</div><div class="s">de 16 camas</div></div>' +
      '<div class="cpu-kpi" style="background:linear-gradient(135deg,#475569,#1E293B)"><div class="t">Entradas no período · UCI + CI</div><div class="v">' + T.entradas + '</div><div class="s">' + fmtD(p.de) + ' a ' + fmtD(p.ate) + '</div></div>' +
      '</div>';
    h += '<div class="cpu-card"><h3>Indicadores por unidade e soma · ' + fmtD(p.de) + ' a ' + fmtD(p.ate) + '</h3><table><thead><tr><th class="l">Indicador</th><th class="intensivo">UCI</th><th class="intermedio">Cuidados Intermédios</th><th class="tot">UCI + CI</th></tr></thead><tbody>' +
      LINHAS.map(function (l) {
        return '<tr' + (l[2] ? ' class="sub"' : '') + '><td class="l"' + (l[2] === 2 ? ' style="padding-left:44px"' : '') + '>' + l[0] + '</td><td>' + valor(r.intensivo, l) + '</td><td>' + valor(r.intermedio, l) + '</td><td class="tot">' + valor(T, l) + '</td></tr>';
      }).join('') + '</tbody></table>' +
      '<div class="cpu-nota">A soma junta as duas unidades; as transferências entre a UCI e os Cuidados Intermédios aparecem em «Vindos da outra unidade».</div></div>';
    var lista = [];
    ORDEM.forEach(function (u) { r[u].internados.forEach(function (x) { lista.push({ u: u, p: x }); }); });
    lista.sort(function (a, b) { return String(a.p.dataEntrada || '').localeCompare(String(b.p.dataEntrada || '')); });
    h += '<div class="cpu-card"><h3>Internados agora nas duas unidades (' + lista.length + ')</h3>' + (lista.length ?
      '<table><thead><tr><th class="l">Unidade</th><th>Nº</th><th class="l">Nome</th><th>Cama</th><th>Entrada</th><th class="l">Diagnóstico</th></tr></thead><tbody>' +
      lista.map(function (x) { return '<tr><td class="l"><span class="cpu-tag ' + x.u + '">' + esc(U[x.u].nome) + '</span></td><td>' + esc(x.p.n) + '</td><td class="l">' + esc(x.p.nome) + '</td><td>' + esc(x.p.cama || '—') + '</td><td>' + fmtD(x.p.dataEntrada) + '</td><td class="l">' + esc(x.p.diagnostico || '—') + '</td></tr>'; }).join('') +
      '</tbody></table>' : '<div class="cpu-nota">Nenhum paciente internado.</div>') + '</div>';
    $('cpuOut').innerHTML = h;
  }
  function pdfSoma() {
    if (!ultimo) return;
    if (!(window.jspdf && window.jspdf.jsPDF) || !window.ZeloPDF) { if (typeof showFeedback === 'function') showFeedback('O gerador de PDF ainda está a carregar', 'error'); return; }
    var r = ultimo.r, p = ultimo.p, T = r.total;
    var d = ZeloPDF.novo();
    var y = ZeloPDF.cabecalho(d, 'Controlo de Pacientes — UCI + Cuidados Intermédios', 'Soma das duas unidades · ' + fmtD(p.de) + ' a ' + fmtD(p.ate));
    y = ZeloPDF.secao(d, y, '1. Internados agora');
    y = ZeloPDF.indicadores(d, y, [['UCI', r.intensivo.internados.length + ' / ' + CAMAS.intensivo], ['Cuidados Intermédios', r.intermedio.internados.length + ' / ' + CAMAS.intermedio], ['UCI + CI', T.internados.length + ' / 16']]);
    y = ZeloPDF.secao(d, y, '2. Indicadores por unidade e soma');
    y = ZeloPDF.autoTable(d, { startY: y, head: [['Indicador', 'UCI', 'Cuidados Intermédios', 'UCI + CI']],
      body: LINHAS.map(function (l) { return [(l[2] ? (l[2] === 2 ? '      ' : '   ') : '') + l[0], valor(r.intensivo, l), valor(r.intermedio, l), valor(T, l)]; }),
      columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center', fontStyle: 'bold' } } }) + 4;
    var lista = [];
    ORDEM.forEach(function (u) { r[u].internados.forEach(function (x) { lista.push([U[u].nome, String(x.n), x.nome || '', x.cama || '—', fmtD(x.dataEntrada), x.diagnostico || '—']); }); });
    y = ZeloPDF.secao(d, y, '3. Internados agora nas duas unidades (' + lista.length + ')');
    if (lista.length) ZeloPDF.autoTable(d, { startY: y, head: [['Unidade', 'Nº', 'Nome', 'Cama', 'Entrada', 'Diagnóstico']], body: lista });
    ZeloPDF.rodape(d);
    d.save('Controlo_Pacientes_UCI_CI_' + p.de + '_' + p.ate + '.pdf');
  }
  function mostrarSoma() {
    window.switchView('soma');
    document.querySelectorAll('.cpx-side [data-vista]').forEach(function (x) { x.classList.toggle('ativo', x.dataset.vista === 'soma'); });
  }

  function montar() {
    var cont = document.querySelector('.container'); if (!cont) return;
    // Barra de unidades no topo do conteúdo.
    var bar = document.createElement('div'); bar.className = 'cpu-bar'; bar.id = 'cpuBar';
    bar.innerHTML = '<span class="cpu-rot">Unidade</span><div class="cpu-seg"></div><span class="cpu-aqui"></span>';
    var ref = cont.querySelector('.view-selector');
    cont.insertBefore(bar, ref || cont.firstChild);
    bar.addEventListener('click', function (e) { var b = e.target.closest('button[data-u]'); if (b) clicar(b.dataset.u); });
    // Vista da soma, a seguir ao relatório.
    var rel = $('relatorioView');
    var v = document.createElement('div'); v.id = 'somaView'; v.style.display = 'none';
    v.innerHTML = '<div class="cpu-per"><div><label for="cpuDe">De</label><input type="date" id="cpuDe"></div><div><label for="cpuAte">Até</label><input type="date" id="cpuAte"></div>' +
      '<button type="button" class="cpu-btn" id="cpuCalc">Atualizar</button><button type="button" class="cpu-btn pdf" id="cpuPdf">PDF</button></div><div id="cpuOut"></div>';
    (rel && rel.parentNode ? rel.parentNode : cont).insertBefore(v, rel ? rel.nextSibling : null);
    $('cpuCalc').addEventListener('click', calcularSoma);
    $('cpuPdf').addEventListener('click', function () { (ultimo ? Promise.resolve() : calcularSoma()).then(pdfSoma); });
    $('cpuDe').addEventListener('change', calcularSoma); $('cpuAte').addEventListener('change', calcularSoma);
    // switchView passa a conhecer a vista "soma".
    var orig = window.switchView;
    window.switchView = function (view) {
      vistaSoma = view === 'soma';
      if (vistaSoma) { $('mainView').style.display = 'none'; $('relatorioView').style.display = 'none'; v.style.display = 'block'; calcularSoma(); }
      else { v.style.display = 'none'; orig(view); }
      document.querySelectorAll('.cpx-side [data-vista]').forEach(function (x) { x.classList.toggle('ativo', x.dataset.vista === (vistaSoma ? 'soma' : view)); });
      desenharBarra();
    };
    desenharBarra();
    // Menu lateral: secção "Unidade" (criada por zelo_cp_layout.js).
    var side = document.querySelector('.cpx-side');
    if (side) {
      var lst = side.querySelector('.cpx-lista');
      var sec = document.createElement('div');
      sec.innerHTML = '<div class="cpx-sec">Unidade</div><div class="cpx-lista">' + ORDEM.map(function (u) {
        return '<button type="button" class="cpx-item cpu-un' + (u === AT.u ? ' ativo' : '') + '" data-un="' + u + '">' + esc(U[u].nome) + '</button>';
      }).join('') + '<button type="button" class="cpx-item" data-vista="soma">UCI + CI (soma)</button></div><hr class="cpx-div">';
      // A seguir a Internados / Relatório Mensal (a 1.ª lista continua a ser a primeira).
      sec.innerHTML = '<hr class="cpx-div">' + sec.innerHTML.replace(/<hr class="cpx-div">$/, '');
      if (lst) side.insertBefore(sec, lst.nextSibling); else side.appendChild(sec);
      sec.addEventListener('click', function (e) { var b = e.target.closest('[data-un]'); if (b) { e.stopPropagation(); clicar(b.dataset.un); } });
    }
    // Janela "Novo Paciente": mostra em que unidade fica o registo.
    var mb = document.querySelector('#novoModal .modal-body');
    if (mb) mb.insertAdjacentHTML('afterbegin', '<div class="cpu-modal-tag">Unidade: <b>' + esc(AT.longo) + '</b> — para registar na outra unidade, escolha-a em «Unidade» no topo da página.</div>');
    if (location.hash === '#soma') mostrarSoma();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar); else montar();
})();
