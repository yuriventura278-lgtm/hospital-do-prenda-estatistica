// ── ZELO — Controlo de Pacientes: listas (design novo) ──
// Partilhado pelas 8 páginas de Controlo de Pacientes.
// • Faixa do topo com os números do dia: no serviço, mulheres, homens,
//   entradas e saídas do dia escolhido e permanência média do mês.
// • Uma só caixa com separadores: "No Serviço", "Do Dia" (quem estava no
//   serviço no fim do dia escolhido) e "Saídos" (no dia ou no mês).
// • Em cada separador: pesquisa, filtro por faixa etária (0–14, 15–24, 25–44,
//   45–64, 65 ou mais) e a lista em tabela separada em Mulheres e Homens, com
//   o total. Coluna "Dias" com cor (até 7 · 8 a 14 · mais de 14).
// • No telemóvel cada paciente ocupa uma linha de duas alturas; o botão ⋯
//   abre as ações.
// • Registar Saída mostra a data de entrada ao lado da data de saída.
// Só muda a forma de mostrar: lê `data.patients` da página e não altera nem
// apaga nenhum registo (o botão Remover usa a função da página, que pede
// confirmação).
(function () {
  if (window.__zeloCpListas) return;
  window.__zeloCpListas = true;

  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  var GRUPOS = [
    { k: 'F', nome: 'Mulheres', sim: '♀', cor: '#DB2777', fundo: '#FDF2F8' },
    { k: 'M', nome: 'Homens', sim: '♂', cor: '#2563EB', fundo: '#EFF6FF' },
    { k: '?', nome: 'Género não indicado', sim: '?', cor: '#64748B', fundo: '#F1F5F9' }
  ];
  var TIPO_COR = { 'Alta Vivo': '#059669', 'Óbito': '#475569', 'Transferência': '#7C3AED' };
  var FAIXAS = ['0–14', '15–24', '25–44', '45–64', '65+'];
  var LS_TAB = 'zelo_cp_separador';

  var css = [
    // 1) Faixa de números (dentro do painel de data)
    '#mainView > .stats-grid{display:none !important}',
    '#mainView > .internados-panel,#mainView > .table-section{display:none !important}',
    '.date-panel{flex-wrap:wrap;gap:14px !important}',
    '.cpg-nums{display:flex;align-items:stretch;flex-wrap:wrap;margin-left:auto}',
    '.cpg-num{display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:84px;padding:2px 12px;border-left:1px solid rgba(255,255,255,.18)}',
    '.cpg-num b{font:800 1.55rem ui-monospace,Consolas,monospace;color:#fff;line-height:1.1}',
    '.cpg-num span{font:700 .58rem Inter,Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.82);white-space:nowrap}',
    '.cpg-num.f b{color:#F9A8D4}.cpg-num.m b{color:#93C5FD}.cpg-num.e b{color:#6EE7B7}.cpg-num.s b{color:#FCD34D}',
    // 2) Caixa com separadores
    '.cpg-card{background:var(--cpx-sf,#fff);border:1px solid var(--cpx-br,#E3E8F0);border-radius:16px;overflow:hidden;box-shadow:0 1px 2px rgba(15,23,42,.04);margin-bottom:16px}',
    '.cpg-tabs{display:flex;gap:4px;padding:10px 12px 0;border-bottom:1px solid var(--cpx-br,#E3E8F0);background:#FAFBFD;overflow-x:auto}',
    '.cpg-tab{border:1px solid transparent;border-bottom:0;margin-bottom:-1px;background:transparent;padding:10px 16px;border-radius:10px 10px 0 0;font:700 .86rem Inter,Arial,sans-serif;color:#64748B;display:flex;align-items:center;gap:8px;cursor:pointer;white-space:nowrap}',
    '.cpg-tab i{font-style:normal;background:#F1F5F9;border-radius:999px;padding:1px 8px;font:800 .74rem ui-monospace,Consolas,monospace;color:#475569}',
    '.cpg-tab.on{background:var(--cpx-sf,#fff);color:var(--cpx-accent,#1E3A5F);border-color:var(--cpx-br,#E3E8F0)}',
    '.cpg-tab.on i{background:var(--cpx-accent,#1E3A5F);color:#fff}',
    '.cpg-barra{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:12px 16px}',
    '.cpg-barra .search-box{flex:1 1 260px;margin:0 !important;min-width:200px}',
    '.cpg-fxs{display:flex;align-items:center;gap:6px;flex-wrap:wrap}',
    '.cpg-fx{border:1px solid var(--cpx-br,#E3E8F0);background:#fff;border-radius:999px;padding:5px 11px;font:700 .74rem Inter,Arial,sans-serif;color:#475569;cursor:pointer;white-space:nowrap}',
    '.cpg-fx b{font-family:ui-monospace,Consolas,monospace;margin-left:3px}',
    '.cpg-fx.on{background:#0F766E;border-color:#0F766E;color:#fff}',
    '.cpg-seg{display:inline-flex;border:1px solid var(--cpx-br,#E3E8F0);border-radius:10px;overflow:hidden}',
    '.cpg-seg button{border:0;background:#fff;padding:7px 12px;font:700 .78rem Inter,Arial,sans-serif;color:#475569;cursor:pointer;white-space:nowrap}',
    '.cpg-seg button.on{background:var(--cpx-accent,#1E3A5F);color:#fff}',
    '.cpg-porTipo{display:flex;gap:6px;flex-wrap:wrap;padding:0 16px 8px}',
    '.cpg-corpo{padding:0 0 4px}',
    // Grupos por género
    '.cpg-gh{display:flex;align-items:center;gap:10px;margin:6px 16px 0;padding:7px 12px;border-radius:10px;font:800 .76rem Inter,Arial,sans-serif;letter-spacing:.05em;text-transform:uppercase;color:var(--g);background:var(--gf)}',
    '.cpg-gh b{margin-left:auto;font:800 .95rem ui-monospace,Consolas,monospace}',
    '.cpg-vazio{font:500 .85rem Inter,Arial,sans-serif;color:#94A3B8;padding:10px 20px}',
    '.cpg-total{display:flex;justify-content:flex-end;gap:6px;flex-wrap:wrap;padding:10px 16px 12px}',
    '.cpg-chip{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:4px 11px;font:700 .74rem Inter,Arial,sans-serif;border:1px solid var(--cpx-br,#E3E8F0);background:#fff;color:#334155;white-space:nowrap}',
    '.cpg-chip b{font-family:ui-monospace,Consolas,monospace;font-size:.86rem}',
    '.cpg-chip.f{color:#BE185D;background:#FDF2F8;border-color:#FBCFE8}',
    '.cpg-chip.m{color:#1D4ED8;background:#EFF6FF;border-color:#BFDBFE}',
    '.cpg-chip.t{color:#fff;background:var(--cpx-accent,#1E3A5F);border-color:transparent}',
    '.cpg-legenda{font:500 .72rem Inter,Arial,sans-serif;color:#64748B;padding:0 16px 12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}',
    // 3) Tabela
    '.cpg-tw{overflow-x:auto;padding:0 16px}',
    '.cpg-tw table{width:100%;border-collapse:separate;border-spacing:0;font:500 .86rem Inter,Arial,sans-serif;margin:4px 0 6px}',
    '.cpg-tw th{font:800 .64rem Inter,Arial,sans-serif;letter-spacing:.07em;text-transform:uppercase;color:#64748B;text-align:left;padding:9px 10px;border-bottom:1px solid var(--cpx-br,#E3E8F0);white-space:nowrap;background:transparent}',
    '.cpg-tw td{padding:9px 10px;border-bottom:1px solid #EEF2F7;vertical-align:middle;white-space:nowrap;color:var(--cpx-tx,#0F172A)}',
    '.cpg-tw tbody tr:nth-child(even) td{background:#FAFBFD}',
    '.cpg-tw tbody tr:hover td{background:#EEF4FB}',
    '.cpg-tw tbody tr td:first-child{box-shadow:inset 3px 0 0 var(--g)}',
    '.cpg-tw td.cpg-nome{white-space:normal;min-width:170px}',
    '.cpg-nome b{font-weight:700}.cpg-nome small{display:block;color:#64748B;font-size:.74rem;margin-top:1px}',
    '.cpg-tag{display:inline-block;border-radius:5px;padding:1px 6px;font:700 .6rem Inter,Arial,sans-serif;letter-spacing:.05em;text-transform:uppercase;margin-left:6px;vertical-align:middle;background:#ECFDF5;color:#047857}',
    '.cpg-fxc{display:inline-block;border-radius:6px;padding:2px 7px;background:#F0FDFA;color:#0F766E;font:700 .72rem Inter,Arial,sans-serif;white-space:nowrap}',
    '.cpg-dias{display:inline-block;font:800 .78rem ui-monospace,Consolas,monospace;border-radius:6px;padding:3px 8px;background:#ECFDF5;color:#059669;white-space:nowrap}',
    '.cpg-dias.a{background:#FFFBEB;color:#D97706}.cpg-dias.v{background:#FEF2F2;color:#DC2626}',
    '.cpg-saida{display:inline-block;border-radius:7px;padding:3px 9px;font:700 .72rem Inter,Arial,sans-serif;color:#fff;background:var(--t);white-space:nowrap}',
    // 4) Ações discretas
    '.cpg-acoes{display:flex;gap:5px}',
    '.cpg-ac{display:inline-flex;align-items:center;gap:5px;border:1px solid var(--cpx-br,#E3E8F0);background:#fff;border-radius:8px;padding:5px 9px;font:700 .74rem Inter,Arial,sans-serif;color:#334155;cursor:pointer;white-space:nowrap;transition:background .12s,color .12s,border-color .12s}',
    '.cpg-ac svg{width:14px;height:14px}',
    '.cpg-ac.sai{color:#B45309;border-color:#FDE68A;background:#FFFBEB}',
    '.cpg-ac.rem{color:#DC2626;border-color:#FECACA;padding:5px 7px}',
    '.cpg-tw tr:hover .cpg-ac.atu{background:var(--cpx-accent,#1E3A5F);border-color:var(--cpx-accent,#1E3A5F);color:#fff}',
    '.cpg-tw tr:hover .cpg-ac.sai{background:#D97706;border-color:#D97706;color:#fff}',
    '.cpg-tw tr:hover .cpg-ac.rem{background:#DC2626;border-color:#DC2626;color:#fff}',
    // 5) Telemóvel: linhas de duas alturas
    '.cpg-mob{display:none}',
    '.cpg-lin{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid #EEF2F7;box-shadow:inset 3px 0 0 var(--g)}',
    '.cpg-lin .t{flex:1;min-width:0}.cpg-lin .t b{font-size:.92rem}',
    '.cpg-lin .l2{font-size:.74rem;color:#64748B;margin-top:3px;display:flex;flex-wrap:wrap;gap:4px 6px;align-items:center}',
    '.cpg-mais{width:36px;height:36px;border-radius:10px;border:1px solid var(--cpx-br,#E3E8F0);background:#fff;color:var(--cpx-accent,#1E3A5F);font:900 1rem Inter,Arial,sans-serif;cursor:pointer;flex-shrink:0}',
    '.cpg-menu{position:fixed;z-index:9999;background:#fff;border:1px solid #E3E8F0;border-radius:12px;box-shadow:0 12px 32px rgba(15,23,42,.18);padding:6px;min-width:190px;display:none}',
    '.cpg-menu.on{display:block}',
    '.cpg-menu button{display:flex;width:100%;align-items:center;gap:8px;border:0;background:none;padding:10px 12px;border-radius:8px;font:700 .86rem Inter,Arial,sans-serif;color:#1F2937;cursor:pointer;text-align:left}',
    '.cpg-menu button:hover{background:#F1F5F9}.cpg-menu button svg{width:16px;height:16px}',
    '.cpg-menu .sai{color:#B45309}.cpg-menu .rem{color:#DC2626}',
    '@media(max-width:700px){',
    '  .cpg-tw{display:none}.cpg-mob{display:block}',
    '  .cpg-nums{width:100%;margin-left:0}.cpg-num{flex:1;min-width:0;padding:2px 4px}.cpg-num:first-child{border-left:0}.cpg-num b{font-size:1.15rem}.cpg-num span{font-size:.5rem;letter-spacing:.04em;white-space:normal;text-align:center}',
    '  .cpg-lg{display:none}.cpg-tabs{padding:8px 6px 0;gap:2px}.cpg-tab{padding:8px 9px;font-size:.78rem;gap:5px}.cpg-gh{margin:8px 10px 4px}',
    '  .cpg-barra{padding:10px}.cpg-fxs{overflow-x:auto;flex-wrap:nowrap;width:100%;padding-bottom:2px}',
    '}',
    // Escuro
    'html.dark .cpg-tabs,html[data-zelo-theme="dark"] .cpg-tabs{background:#0F1828}',
    'html.dark .cpg-fx,html.dark .cpg-chip,html.dark .cpg-ac,html.dark .cpg-seg button,html.dark .cpg-mais,html[data-zelo-theme="dark"] .cpg-fx,html[data-zelo-theme="dark"] .cpg-chip,html[data-zelo-theme="dark"] .cpg-ac,html[data-zelo-theme="dark"] .cpg-seg button,html[data-zelo-theme="dark"] .cpg-mais{background:#111A2B;border-color:#1F2A3D;color:#CBD5E1}',
    'html.dark .cpg-tw tbody tr:nth-child(even) td,html[data-zelo-theme="dark"] .cpg-tw tbody tr:nth-child(even) td{background:#0F1828}',
    'html.dark .cpg-tw td,html[data-zelo-theme="dark"] .cpg-tw td{color:#E6ECF5;border-color:#1F2A3D}',
    'html.dark .cpg-gh,html[data-zelo-theme="dark"] .cpg-gh{background:#0F1828}',
    'html.dark .cpg-menu,html[data-zelo-theme="dark"] .cpg-menu{background:#111A2B;border-color:#1F2A3D}html.dark .cpg-menu button,html[data-zelo-theme="dark"] .cpg-menu button{color:#E6ECF5}'
  ].join('\n');

  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function dia(iso) { return String(iso || '').slice(0, 10); }
  function fmt(iso) { var p = dia(iso).split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : '—'; }
  function diasEntre(a, b) { var d = Math.floor((new Date(dia(b)) - new Date(dia(a))) / 86400000); return isNaN(d) ? null : Math.max(0, d); }
  function genero(p) { var g = String(p.genero || ''); return /^f/i.test(g) ? 'F' : (/^m/i.test(g) ? 'M' : '?'); }
  function pacientes() { try { return (typeof data !== 'undefined' && data && Array.isArray(data.patients)) ? data.patients : []; } catch (e) { return []; } }
  function hojeISO() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function diaVisto() { try { if (typeof selectedViewDate !== 'undefined' && selectedViewDate) return selectedViewDate; } catch (e) {} return hojeISO(); }
  function faixa(p) {
    var i = parseInt(p.idade, 10); if (isNaN(i)) return null;
    return i <= 14 ? '0–14' : i <= 24 ? '15–24' : i <= 44 ? '25–44' : i <= 64 ? '45–64' : '65+';
  }
  function contar(lista) { var c = { F: 0, M: 0, '?': 0 }; lista.forEach(function (p) { c[genero(p)]++; }); return c; }
  function porNumero(a, b) { return b.n - a.n; }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  var SVG = {
    atu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    sai: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>',
    rem: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>'
  };

  // ── Estado ──
  var sep = lsGet(LS_TAB) || 'servico';       // servico | dia | saidos
  if (['servico', 'dia', 'saidos'].indexOf(sep) < 0) sep = 'servico';
  var modoSaidos = 'dia';                      // dia | mes
  var filtroFaixa = '';
  var busca = '';

  // ── Listas ──
  function listaServico() { return pacientes().filter(function (p) { return p.status === 'internado'; }).sort(porNumero); }
  function listaDia(d) {
    return pacientes().filter(function (p) {
      var e = dia(p.dataEntrada); if (!e || e > d) return false;
      if (p.status === 'internado') return true;
      var s = dia(p.dataSaida); return !!s && s > d;
    }).sort(porNumero);
  }
  function saidos() { return pacientes().filter(function (p) { return p.dataSaida && p.status !== 'internado'; }); }
  function saidosDia(d) { return saidos().filter(function (p) { return dia(p.dataSaida) === d; }); }
  function saidosMes(d) { var ym = d.slice(0, 7); return saidos().filter(function (p) { return dia(p.dataSaida).slice(0, 7) === ym; }); }
  function ordemSaida(a, b) { return String(b.dataSaida).localeCompare(String(a.dataSaida)) || b.n - a.n; }

  function diasDe(p, ateDia) {
    var n = p.dataSaida && p.status !== 'internado' ? diasEntre(p.dataEntrada, p.dataSaida) : diasEntre(p.dataEntrada, ateDia);
    if (n == null) return '—';
    return '<span class="cpg-dias' + (n > 14 ? ' v' : n > 7 ? ' a' : '') + '">' + n + ' d</span>';
  }
  function tipoSaida(p) {
    var t = p.tipoSaida || 'Saída';
    return '<span class="cpg-saida" style="--t:' + (TIPO_COR[t] || '#D97706') + '">' + esc(t === 'Alta Vivo' ? 'Alta' : t) + (p.subtipo && p.subtipo !== '—' ? ' · ' + esc(p.subtipo) : '') + '</span>';
  }
  function acoes(p, op) {
    var h = '<button type="button" class="cpg-ac atu" title="Atualizar os dados deste paciente" onclick="editPaciente(' + p.n + ')">' + SVG.atu + 'Atualizar</button>';
    if (p.status === 'internado' && !op.saida) h += '<button type="button" class="cpg-ac sai" title="Registar a saída deste paciente" onclick="cpRegistarSaidaDe(' + p.n + ')">' + SVG.sai + 'Saída</button>';
    if (op.remover) h += '<button type="button" class="cpg-ac rem" title="Remover este registo (pede confirmação)" onclick="deletePaciente(' + p.n + ')">' + SVG.rem + '</button>';
    return h;
  }
  function linha(p, op) {
    var novo = op.dia && dia(p.dataEntrada) === op.dia ? '<span class="cpg-tag">Entrou ' + (op.dia === hojeISO() ? 'hoje' : 'neste dia') + '</span>' : '';
    var c = '<td>' + p.n + '</td><td class="cpg-nome"><b>' + esc(p.nome) + '</b>' + novo + '<small>NUP ' + esc(p.nup || '—') + '</small></td>' +
      '<td>' + esc(p.idade) + '</td><td><span class="cpg-fxc">' + (faixa(p) || '—') + '</span></td><td>' + esc(p.cama || '—') + '</td><td>' + fmt(p.dataEntrada) + '</td>';
    if (op.saida) c += '<td>' + fmt(p.dataSaida) + '</td><td>' + tipoSaida(p) + '</td><td>' + diasDe(p) + '</td><td>' + esc(p.diagnosticoFinal || p.diagnostico || '—') + '</td>';
    else c += '<td>' + diasDe(p, op.ate) + '</td><td>' + esc(p.diagnostico || '—') + '</td><td>' + esc(p.proveniencia || '—') + '</td>';
    return '<tr>' + c + '<td><div class="cpg-acoes">' + acoes(p, op) + '</div></td></tr>';
  }
  function linhaMob(p, op) {
    var novo = op.dia && dia(p.dataEntrada) === op.dia ? '<span class="cpg-tag">' + (op.dia === hojeISO() ? 'Hoje' : 'Entrou') + '</span>' : '';
    var l2 = [esc(p.cama || 'Sem cama'), esc(p.idade) + ' anos', faixa(p) || '—'];
    if (op.saida) l2.push('Entrada ' + fmt(p.dataEntrada), 'Saída ' + fmt(p.dataSaida));
    var extra = op.saida ? tipoSaida(p) + diasDe(p) : diasDe(p, op.ate);
    return '<div class="cpg-lin"><div class="t"><b>' + esc(p.nome) + '</b>' + novo + '<div class="l2">' + l2.join(' · ') + ' ' + extra + '</div></div>' +
      '<button type="button" class="cpg-mais" data-n="' + p.n + '" data-saida="' + (op.saida ? 1 : 0) + '" data-rem="' + (op.remover ? 1 : 0) + '" aria-label="Ações">⋯</button></div>';
  }
  function grupos(lista, op, vazio) {
    if (!lista.length) return '<div class="cpg-vazio">' + vazio + '</div>';
    var c = contar(lista);
    var cab = '<th>N</th><th>Nome</th><th>Idade</th><th>Faixa</th><th>Cama / Sala</th><th>Entrada</th>' +
      (op.saida ? '<th>Saída</th><th>Tipo de saída</th><th>Dias</th><th>Diagnóstico</th>' : '<th>Dias</th><th>Diagnóstico</th><th>Proveniência</th>') + '<th>Ações</th>';
    return GRUPOS.filter(function (g) { return g.k !== '?' || c['?']; }).map(function (g) {
      var sub = lista.filter(function (p) { return genero(p) === g.k; });
      return '<div style="--g:' + g.cor + ';--gf:' + g.fundo + '"><div class="cpg-gh">' + g.sim + ' ' + g.nome + '<b>' + sub.length + '</b></div>' +
        (sub.length
          ? '<div class="cpg-tw"><table><thead><tr>' + cab + '</tr></thead><tbody>' + sub.map(function (p) { return linha(p, op); }).join('') + '</tbody></table></div>' +
            '<div class="cpg-mob">' + sub.map(function (p) { return linhaMob(p, op); }).join('') + '</div>'
          : '<div class="cpg-vazio">Nenhum paciente.</div>') + '</div>';
    }).join('') + '<div class="cpg-total">' + chips(lista) + '</div>';
  }
  function chips(lista) {
    var c = contar(lista);
    return '<span class="cpg-chip f">Mulheres <b>' + c.F + '</b></span><span class="cpg-chip m">Homens <b>' + c.M + '</b></span>' +
      (c['?'] ? '<span class="cpg-chip">Sem género <b>' + c['?'] + '</b></span>' : '') +
      '<span class="cpg-chip t">Total <b>' + lista.length + '</b></span>';
  }
  function barraFaixas(lista) {
    var n = {}; lista.forEach(function (p) { var f = faixa(p) || '?'; n[f] = (n[f] || 0) + 1; });
    var b = function (f, rot, v) { return '<button type="button" class="cpg-fx' + (filtroFaixa === f ? ' on' : '') + '" data-fx="' + f + '">' + rot + '<b>' + v + '</b></button>'; };
    return b('', 'Todas', lista.length) + FAIXAS.map(function (f) { return b(f, f, n[f] || 0); }).join('') + (n['?'] ? b('?', 'Sem idade', n['?']) : '');
  }
  function filtrar(lista) {
    var q = busca.trim().toLowerCase();
    return lista.filter(function (p) {
      if (filtroFaixa && (faixa(p) || '?') !== filtroFaixa) return false;
      if (!q) return true;
      return [p.n, p.nome, p.nup, p.idade, p.cama, p.diagnostico, p.diagnosticoFinal].join(' ').toLowerCase().indexOf(q) >= 0;
    });
  }

  // ── Desenho ──
  function numeros() {
    var el = document.getElementById('cpg-nums'); if (!el) return;
    var d = diaVisto(), hoje = d === hojeISO(), serv = listaServico(), c = contar(serv);
    var ent = pacientes().filter(function (p) { return dia(p.dataEntrada) === d; }).length;
    var sm = saidosMes(d), perm = sm.length ? sm.reduce(function (s, p) { return s + (diasEntre(p.dataEntrada, p.dataSaida) || 0); }, 0) / sm.length : null;
    var n = function (cls, v, rot) { return '<div class="cpg-num ' + cls + '"><b>' + v + '</b><span>' + rot + '</span></div>'; };
    el.innerHTML = n('', serv.length, 'No serviço') + n('f', c.F, 'Mulheres') + n('m', c.M, 'Homens') +
      n('e', ent, hoje ? 'Entradas hoje' : 'Entradas no dia') + n('s', saidosDia(d).length, hoje ? 'Saídas hoje' : 'Saídas no dia') +
      n('', perm == null ? '—' : perm.toFixed(1).replace('.', ','), 'Perm. média mês (d)');
  }
  function tudo() {
    numeros();
    var card = document.getElementById('cpg-card'); if (!card) return;
    var d = diaVisto(), hoje = d === hojeISO();
    var lServ = listaServico(), lDia = listaDia(d), sDia = saidosDia(d), sMes = saidosMes(d);
    var mesTxt = MESES[+d.slice(5, 7) - 1] + ' ' + d.slice(0, 4);
    var tabs = [
      ['servico', 'No Serviço', lServ.length],
      ['dia', hoje ? 'Do Dia' : 'Do Dia ' + fmt(d).slice(0, 5), lDia.length],
      ['saidos', 'Saídos', sDia.length + (hoje ? ' hoje' : ' no dia') + '<span class="cpg-lg"> · ' + sMes.length + ' no mês</span>']
    ];
    card.querySelector('.cpg-tabs').innerHTML = tabs.map(function (t) { return '<button type="button" class="cpg-tab' + (sep === t[0] ? ' on' : '') + '" data-sep="' + t[0] + '">' + t[1] + ' <i>' + t[2] + '</i></button>'; }).join('');

    var base, op, vazio, extra = '';
    if (sep === 'servico') { base = lServ; op = { ate: hojeISO() }; vazio = 'Nenhum paciente internado.'; }
    else if (sep === 'dia') { base = lDia; op = { dia: d, ate: d, remover: true }; vazio = 'Nenhum paciente no serviço neste dia.'; }
    else {
      base = (modoSaidos === 'dia' ? sDia : sMes).slice().sort(ordemSaida); op = { saida: true };
      vazio = modoSaidos === 'dia' ? 'Nenhuma saída neste dia.' : 'Nenhuma saída neste mês.';
      var tipos = {}; base.forEach(function (p) { var k = p.tipoSaida || 'Saída'; tipos[k] = (tipos[k] || 0) + 1; });
      extra = Object.keys(tipos).length ? '<div class="cpg-porTipo">' + Object.keys(tipos).map(function (k) { return '<span class="cpg-chip" style="color:' + (TIPO_COR[k] || '#B45309') + '">' + esc(k === 'Alta Vivo' ? 'Altas' : k) + ' <b>' + tipos[k] + '</b></span>'; }).join('') + '</div>' : '';
    }
    var seg = document.getElementById('cpg-seg');
    seg.style.display = sep === 'saidos' ? '' : 'none';
    seg.innerHTML = '<button type="button" data-modo="dia" class="' + (modoSaidos === 'dia' ? 'on' : '') + '">No dia ' + fmt(d).slice(0, 5) + ' (' + sDia.length + ')</button>' +
      '<button type="button" data-modo="mes" class="' + (modoSaidos === 'mes' ? 'on' : '') + '">No mês de ' + mesTxt + ' (' + sMes.length + ')</button>';
    document.getElementById('cpg-fxs').innerHTML = barraFaixas(base);
    var vis = filtrar(base);
    document.getElementById('cpg-corpo').innerHTML = extra +
      grupos(vis, op, base.length ? 'Nenhum paciente com este filtro.' : vazio) +
      (sep !== 'saidos' && vis.length ? '<div class="cpg-legenda">Dias internado: <span class="cpg-dias">até 7</span><span class="cpg-dias a">8 a 14</span><span class="cpg-dias v">mais de 14</span></div>' : '');
  }

  // ── Menu ⋯ (telemóvel) ──
  var menu;
  function abrirMenu(btn) {
    if (!menu) {
      menu = document.createElement('div'); menu.className = 'cpg-menu'; document.body.appendChild(menu);
      document.addEventListener('click', function (e) { if (!e.target.closest('.cpg-menu') && !e.target.closest('.cpg-mais')) menu.classList.remove('on'); });
      window.addEventListener('scroll', function () { menu.classList.remove('on'); }, true);
    }
    var n = btn.dataset.n, p = pacientes().filter(function (x) { return String(x.n) === String(n); })[0]; if (!p) return;
    var h = '<button type="button" onclick="editPaciente(' + n + ')">' + SVG.atu + 'Atualizar</button>';
    if (p.status === 'internado' && btn.dataset.saida !== '1') h += '<button type="button" class="sai" onclick="cpRegistarSaidaDe(' + n + ')">' + SVG.sai + 'Registar saída</button>';
    if (btn.dataset.rem === '1') h += '<button type="button" class="rem" onclick="deletePaciente(' + n + ')">' + SVG.rem + 'Remover</button>';
    menu.innerHTML = h;
    menu.classList.add('on');
    var r = btn.getBoundingClientRect(), w = menu.offsetWidth, hh = menu.offsetHeight;
    menu.style.left = Math.max(8, r.right - w) + 'px';
    menu.style.top = (r.bottom + hh + 8 > window.innerHeight ? r.top - hh - 6 : r.bottom + 6) + 'px';
    menu.onclick = function () { menu.classList.remove('on'); };
  }

  function montar() {
    var main = document.getElementById('mainView');
    var controls = main && main.querySelector('.controls');
    if (!main || !controls || document.getElementById('cpg-estilos')) return;
    var st = document.createElement('style'); st.id = 'cpg-estilos'; st.textContent = css; document.head.appendChild(st);

    // 1) Números no painel de data.
    var dp = main.querySelector('.date-panel');
    if (dp) {
      var nums = document.createElement('div'); nums.className = 'cpg-nums'; nums.id = 'cpg-nums';
      var selc = dp.querySelector('.date-panel-selector');
      if (selc) dp.insertBefore(nums, selc); else dp.appendChild(nums);
    }

    // 2) Caixa com separadores, depois dos botões Novo Paciente / Registar Saída.
    var card = document.createElement('div'); card.className = 'cpg-card'; card.id = 'cpg-card';
    card.innerHTML = '<div class="cpg-tabs"></div><div class="cpg-barra" id="cpg-barra"><div class="cpg-seg" id="cpg-seg"></div><div class="cpg-fxs" id="cpg-fxs"></div></div><div class="cpg-corpo" id="cpg-corpo"></div>';
    controls.parentNode.insertBefore(card, controls.nextSibling);
    // A caixa de pesquisa da página passa para a barra (continua a mesma).
    var sb = main.querySelector('.table-section .search-box');
    if (sb) card.querySelector('#cpg-barra').insertBefore(sb, card.querySelector('#cpg-seg'));
    var inp = document.getElementById('searchInternados');
    if (inp) {
      inp.placeholder = 'Procurar por nome, NUP, cama ou diagnóstico…';
      inp.removeAttribute('onkeyup');
      inp.addEventListener('input', function () { busca = inp.value; tudo(); });
    }

    card.addEventListener('click', function (e) {
      var t = e.target.closest('.cpg-tab'); if (t) { sep = t.dataset.sep; lsSet(LS_TAB, sep); filtroFaixa = ''; tudo(); return; }
      var f = e.target.closest('.cpg-fx'); if (f) { filtroFaixa = f.dataset.fx; tudo(); return; }
      var m = e.target.closest('#cpg-seg button'); if (m) { modoSaidos = m.dataset.modo; tudo(); return; }
      var mais = e.target.closest('.cpg-mais'); if (mais) { e.stopPropagation(); abrirMenu(mais); }
    });

    // Registar Saída: mostra a data de entrada junto à data de saída (e não deixa sair antes de entrar).
    var ds = document.getElementById('fSaidaData');
    if (ds && !document.getElementById('cpg-entrada-saida')) {
      var campo = ds.closest('.field');
      if (campo) {
        campo.insertAdjacentHTML('beforebegin', '<div class="field"><label>Data de Entrada</label><input type="text" id="cpg-entrada-saida" readonly placeholder="Escolha o paciente" style="background:#F1F5F9;cursor:default"></div>');
        var sincEntrada = function () {
          var sel = document.getElementById('fSaidaPaciente');
          var p = sel && pacientes().filter(function (x) { return String(x.n) === String(sel.value); })[0];
          var e = document.getElementById('cpg-entrada-saida');
          e.value = p && p.dataEntrada ? fmt(p.dataEntrada) + (String(p.dataEntrada).length > 10 ? ' às ' + String(p.dataEntrada).slice(11, 16) : '') : '';
          if (p && p.dataEntrada) ds.min = String(p.dataEntrada).slice(0, 16); else ds.removeAttribute('min');
        };
        var orig = window.updateSaidaInfo;
        if (typeof orig === 'function') window.updateSaidaInfo = function () { var r = orig.apply(this, arguments); try { sincEntrada(); } catch (er) {} return r; };
        var sel = document.getElementById('fSaidaPaciente'); if (sel) sel.addEventListener('change', sincEntrada);
      }
    }

    // A página chama estas funções sempre que os dados mudam: redesenha tudo.
    window.filterTable = function () { var i = document.getElementById('searchInternados'); busca = i ? i.value : ''; tudo(); };
    window.renderInternadosPanel = tudo;
    tudo();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(montar, 0); });
  else setTimeout(montar, 0);
})();
