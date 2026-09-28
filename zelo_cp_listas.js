// ── ZELO — Controlo de Pacientes: listas por género, pacientes do dia e saídos ──
// • "Pacientes no Serviço": separados em Mulheres e Homens, com o total.
// • "Pacientes do Dia": em cartões iguais aos do serviço (em vez da tabela),
//   também por género. Mostra quem estava no serviço no dia escolhido no
//   painel de data (hoje = os mesmos pacientes do serviço).
// • "Pacientes Saídos": saídos no dia escolhido e no mês desse dia, por género.
// Só muda a forma de mostrar: lê `data.patients` da página e não altera nem
// apaga nenhum registo.
(function () {
  if (window.__zeloCpListas) return;
  window.__zeloCpListas = true;

  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  var GRUPOS = [
    { k: 'F', nome: 'Mulheres', cor: '#DB2777', fundo: '#FDF2F8' },
    { k: 'M', nome: 'Homens', cor: '#2563EB', fundo: '#EFF6FF' },
    { k: '?', nome: 'Género não indicado', cor: '#64748B', fundo: '#F1F5F9' }
  ];
  var TIPO_COR = { 'Alta Vivo': '#059669', 'Óbito': '#475569', 'Transferência': '#7C3AED' };

  var css = [
    '.cpg-resumo{display:flex;gap:6px;flex-wrap:wrap;margin-left:auto;align-items:center}',
    '.cpg-chip{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:4px 11px;font:700 .74rem Inter,Arial,sans-serif;border:1px solid var(--cpx-br,#E3E8F0);background:#fff;color:#334155;white-space:nowrap}',
    '.cpg-chip b{font-family:ui-monospace,Consolas,monospace;font-size:.86rem}',
    '.cpg-chip.f{color:#BE185D;background:#FDF2F8;border-color:#FBCFE8}',
    '.cpg-chip.m{color:#1D4ED8;background:#EFF6FF;border-color:#BFDBFE}',
    '.cpg-chip.t{color:#fff;background:var(--cpx-accent,#1E3A5F);border-color:transparent}',
    '#panelCountInternados{display:none !important}',
    '.cpg-grupo{grid-column:1/-1;min-width:0}',
    '.cpg-grupo + .cpg-grupo{margin-top:6px}',
    '.cpg-gh{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:10px;margin-bottom:10px;font:800 .8rem Inter,Arial,sans-serif;letter-spacing:.04em;text-transform:uppercase;color:var(--g);background:var(--gf)}',
    '.cpg-gh .cpg-ic{width:24px;height:24px;border-radius:7px;background:var(--g);color:#fff;display:inline-flex;align-items:center;justify-content:center;font:800 .8rem Inter,Arial,sans-serif}',
    '.cpg-gh b{margin-left:auto;font:800 .95rem ui-monospace,Consolas,monospace}',
    '.cpg-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}',
    '.cpg-cards .internados-card{border-left-color:var(--g) !important}',
    '.cpg-vazio{grid-column:1/-1;font:500 .85rem Inter,Arial,sans-serif;color:#94A3B8;padding:6px 4px 10px}',
    '.cpg-total{grid-column:1/-1;display:flex;justify-content:flex-end;gap:6px;flex-wrap:wrap;border-top:1px dashed var(--cpx-br,#E3E8F0);padding-top:12px;margin-top:4px}',
    '.cpg-tag{display:inline-block;border-radius:6px;padding:2px 8px;font:700 .66rem Inter,Arial,sans-serif;letter-spacing:.04em;text-transform:uppercase;margin-left:6px;vertical-align:middle}',
    '.cpg-tag.novo{background:#ECFDF5;color:#047857}',
    '.cpg-tag.saiu{background:#FEF3C7;color:#92400E}',
    '.cpg-saida{display:inline-block;border-radius:8px;padding:3px 10px;font:700 .72rem Inter,Arial,sans-serif;color:#fff;background:var(--t);margin:2px 0 6px}',
    '.cp-card-btn-remover{flex:0 0 auto !important;background:#fff !important;color:#DC2626 !important;border:1px solid #FECACA !important}',
    '.cpg-sec{margin-bottom:16px}',
    '.cpg-sec-h{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 16px;border-bottom:1px dashed var(--cpx-br,#E3E8F0)}',
    '.cpg-sec-h .cpx-tit{font:800 .95rem Inter,Arial,sans-serif;color:var(--cpx-tx,#0F172A);display:flex;align-items:center;gap:10px}',
    '.cpg-sec-b{padding:14px 16px 16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}',
    '.cpg-tabs{display:flex;gap:6px;margin-left:auto}',
    '.cpg-tab{border:1px solid var(--cpx-br,#E3E8F0);background:#fff;border-radius:999px;padding:6px 14px;font:700 .8rem Inter,Arial,sans-serif;color:#475569;cursor:pointer}',
    '.cpg-tab.on{background:var(--cpx-accent,#1E3A5F);border-color:transparent;color:#fff}',
    '.cpg-porTipo{grid-column:1/-1;display:flex;gap:6px;flex-wrap:wrap;margin-bottom:2px}',
    'html.dark .cpg-chip,html.dark .cpg-tab,html[data-zelo-theme="dark"] .cpg-chip,html[data-zelo-theme="dark"] .cpg-tab{background:#111A2B;border-color:#1F2A3D;color:#CBD5E1}',
    'html.dark .cpg-gh,html[data-zelo-theme="dark"] .cpg-gh{background:#0F1828}',
    '@media(max-width:700px){.cpg-resumo{margin-left:0;width:100%}.cpg-tabs{margin-left:0}}'
  ].join('\n');

  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function dia(iso) { return String(iso || '').slice(0, 10); }
  function fmt(iso) { var p = dia(iso).split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : '—'; }
  function dias(a, b) { var d = Math.ceil((new Date(b) - new Date(a)) / 86400000); return isNaN(d) ? '—' : Math.max(0, d); }
  function genero(p) { var g = String(p.genero || ''); return /^f/i.test(g) ? 'F' : (/^m/i.test(g) ? 'M' : '?'); }
  function pacientes() { try { return (typeof data !== 'undefined' && data && Array.isArray(data.patients)) ? data.patients : []; } catch (e) { return []; } }
  function hojeISO() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function diaVisto() { try { if (typeof selectedViewDate !== 'undefined' && selectedViewDate) return selectedViewDate; } catch (e) {} return hojeISO(); }
  function contar(lista) { var c = { F: 0, M: 0, '?': 0 }; lista.forEach(function (p) { c[genero(p)]++; }); return c; }

  var SVG_ATUALIZAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
  var SVG_SAIDA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>';
  var SVG_REMOVER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';

  // Cartão igual ao de "Pacientes no Serviço".
  function cartao(p, op) {
    op = op || {};
    var tags = '';
    if (op.dia && dia(p.dataEntrada) === op.dia) tags += '<span class="cpg-tag novo">Entrou neste dia</span>';
    var saida = '';
    if (op.saida) {
      var t = p.tipoSaida || 'Saída';
      saida = '<div class="cpg-saida" style="--t:' + (TIPO_COR[t] || '#D97706') + '">' + esc(t === 'Alta Vivo' ? 'Alta' : t) + (p.subtipo && p.subtipo !== '—' ? ' · ' + esc(p.subtipo) : '') + '</div>';
    }
    var acoes = '<button type="button" class="cp-card-btn cp-card-btn-atualizar" onclick="editPaciente(' + p.n + ')">' + SVG_ATUALIZAR + 'Atualizar</button>';
    if (p.status === 'internado' && !op.saida) acoes += '<button type="button" class="cp-card-btn cp-card-btn-saida" onclick="cpRegistarSaidaDe(' + p.n + ')">' + SVG_SAIDA + 'Registar saída</button>';
    if (op.remover) acoes += '<button type="button" class="cp-card-btn cp-card-btn-remover" title="Remover este registo (pede confirmação)" onclick="deletePaciente(' + p.n + ')">' + SVG_REMOVER + '</button>';
    return '<div class="internados-card" data-busca="' + esc([p.nome, p.nup, p.idade, p.genero, p.cama, p.diagnostico].join(' ').toLowerCase()) + '">' +
      '<div class="internado-n">Paciente #' + p.n + tags + '</div>' +
      '<div class="internado-nome">' + esc(p.nome) + '</div>' + saida +
      '<div class="internado-info"><strong>NUP:</strong> <code>' + esc(p.nup) + '</code></div>' +
      '<div class="internado-info"><strong>Idade:</strong> ' + esc(p.idade) + ' anos' + (p.genero ? ' · ' + esc(p.genero) : '') + '</div>' +
      (p.cama ? '<div class="internado-info"><strong>Cama / Sala:</strong> ' + esc(p.cama) + '</div>' : '') +
      '<div class="internado-info"><strong>Entrada:</strong> ' + fmt(p.dataEntrada) + '</div>' +
      (op.saida ? '<div class="internado-info"><strong>Saída:</strong> ' + fmt(p.dataSaida) + ' · ' + dias(p.dataEntrada, p.dataSaida) + ' dia(s)</div>' : '') +
      '<div class="internado-info"><strong>Diagnóstico:</strong> ' + esc(p.diagnosticoFinal && op.saida ? p.diagnosticoFinal : p.diagnostico) + '</div>' +
      '<div class="cp-card-acoes">' + acoes + '</div></div>';
  }

  // Lista dividida em Mulheres / Homens (+ sem género, se houver) com totais.
  function grupos(lista, op, vazio) {
    if (!lista.length) return '<div class="cpg-vazio">' + vazio + '</div>';
    var c = contar(lista);
    return GRUPOS.filter(function (g) { return g.k !== '?' || c['?']; }).map(function (g) {
      var sub = lista.filter(function (p) { return genero(p) === g.k; });
      return '<div class="cpg-grupo" style="--g:' + g.cor + ';--gf:' + g.fundo + '">' +
        '<div class="cpg-gh"><span class="cpg-ic">' + (g.k === '?' ? '?' : g.k) + '</span>' + g.nome + '<b>' + sub.length + '</b></div>' +
        (sub.length ? '<div class="cpg-cards">' + sub.map(function (p) { return cartao(p, op); }).join('') + '</div>' : '<div class="cpg-vazio">Nenhum paciente.</div>') +
        '</div>';
    }).join('') + '<div class="cpg-total">' + chips(lista) + '</div>';
  }
  function chips(lista) {
    var c = contar(lista);
    return '<span class="cpg-chip f">Mulheres <b>' + c.F + '</b></span><span class="cpg-chip m">Homens <b>' + c.M + '</b></span>' +
      (c['?'] ? '<span class="cpg-chip">Sem género <b>' + c['?'] + '</b></span>' : '') +
      '<span class="cpg-chip t">Total <b>' + lista.length + '</b></span>';
  }
  function porNumero(a, b) { return b.n - a.n; }

  // ── Secção 1: Pacientes no Serviço ──
  function renderServico() {
    var el = document.getElementById('internados-lista'); if (!el) return;
    var lista = pacientes().filter(function (p) { return p.status === 'internado'; }).sort(porNumero);
    var cnt = document.getElementById('panelCountInternados'); if (cnt) cnt.textContent = lista.length;
    var r = document.getElementById('cpg-resumo-servico'); if (r) r.innerHTML = chips(lista);
    el.innerHTML = grupos(lista, {}, 'Nenhum paciente internado.');
  }

  // ── Secção 2: Pacientes do Dia (quem estava no serviço no fim do dia escolhido) ──
  function renderDia() {
    var el = document.getElementById('cpg-dia'); if (!el) return;
    var d = diaVisto();
    var lista = pacientes().filter(function (p) {
      var e = dia(p.dataEntrada); if (!e || e > d) return false;
      if (p.status === 'internado') return true;
      var s = dia(p.dataSaida); return !!s && s > d;
    }).sort(porNumero);
    var t = document.getElementById('cpg-dia-tit'); if (t) t.textContent = 'Pacientes do Dia — ' + fmt(d);
    var r = document.getElementById('cpg-resumo-dia'); if (r) r.innerHTML = chips(lista);
    var cnt = document.getElementById('countInternados'); if (cnt) cnt.textContent = lista.length + ' paciente(s)';
    el.innerHTML = grupos(lista, { dia: d, remover: true }, 'Nenhum paciente no serviço neste dia.');
    filtrar();
  }

  // ── Secção 3: Pacientes Saídos (no dia e no mês) ──
  var modoSaidos = 'dia';
  function renderSaidos() {
    var el = document.getElementById('cpg-saidos'); if (!el) return;
    var d = diaVisto(), ym = d.slice(0, 7);
    var todos = pacientes().filter(function (p) { return p.dataSaida && p.status !== 'internado'; });
    var noDia = todos.filter(function (p) { return dia(p.dataSaida) === d; });
    var noMes = todos.filter(function (p) { return dia(p.dataSaida).slice(0, 7) === ym; });
    var mesTxt = MESES[+ym.slice(5, 7) - 1] + ' de ' + ym.slice(0, 4);
    var bDia = document.getElementById('cpg-tab-dia'), bMes = document.getElementById('cpg-tab-mes');
    if (bDia) { bDia.textContent = 'No dia ' + fmt(d) + ' (' + noDia.length + ')'; bDia.classList.toggle('on', modoSaidos === 'dia'); }
    if (bMes) { bMes.textContent = 'No mês de ' + mesTxt + ' (' + noMes.length + ')'; bMes.classList.toggle('on', modoSaidos === 'mes'); }
    var lista = (modoSaidos === 'dia' ? noDia : noMes).slice().sort(function (a, b) { return String(b.dataSaida).localeCompare(String(a.dataSaida)) || b.n - a.n; });
    var tipos = {}; lista.forEach(function (p) { var k = p.tipoSaida || 'Saída'; tipos[k] = (tipos[k] || 0) + 1; });
    var porTipo = Object.keys(tipos).map(function (k) { return '<span class="cpg-chip" style="color:' + (TIPO_COR[k] || '#B45309') + '">' + esc(k === 'Alta Vivo' ? 'Altas' : k) + ' <b>' + tipos[k] + '</b></span>'; }).join('');
    el.innerHTML = (porTipo ? '<div class="cpg-porTipo">' + porTipo + '</div>' : '') +
      grupos(lista, { saida: true }, modoSaidos === 'dia' ? 'Nenhuma saída neste dia.' : 'Nenhuma saída neste mês.');
  }

  function filtrar() {
    var inp = document.getElementById('searchInternados');
    var q = inp ? inp.value.trim().toLowerCase() : '';
    document.querySelectorAll('#cpg-dia .internados-card').forEach(function (c) {
      c.style.display = !q || (c.getAttribute('data-busca') || '').indexOf(q) >= 0 ? '' : 'none';
    });
  }

  function tudo() { renderServico(); renderDia(); renderSaidos(); }

  function montar() {
    var painel = document.querySelector('.internados-panel');
    var tab = document.querySelector('#mainView .table-section');
    if (!painel || !tab || document.getElementById('cpg-estilos')) return;
    var st = document.createElement('style'); st.id = 'cpg-estilos'; st.textContent = css; document.head.appendChild(st);

    // Secção 1: totais por género no cabeçalho.
    var hdr = painel.querySelector('.internados-header');
    if (hdr) hdr.insertAdjacentHTML('beforeend', '<div class="cpg-resumo" id="cpg-resumo-servico"></div>');

    // Secção 2: a tabela passa a cartões iguais aos do serviço.
    var th = tab.querySelector('.table-header');
    var tit = th && th.querySelector('.cpx-tit');
    if (tit) tit.innerHTML = '<span class="cpx-n">2</span><span id="cpg-dia-tit">Pacientes do Dia</span>';
    else if (th) th.insertAdjacentHTML('afterbegin', '<div class="cpx-tit"><span class="cpx-n">2</span><span id="cpg-dia-tit">Pacientes do Dia</span></div>');
    if (th) th.insertAdjacentHTML('beforeend', '<div class="cpg-resumo" id="cpg-resumo-dia"></div>');
    var cnt = document.getElementById('countInternados'); if (cnt) cnt.style.display = 'none';
    var wrap = tab.querySelector('.table-wrapper'); if (wrap) wrap.style.display = 'none';
    tab.insertAdjacentHTML('beforeend', '<div class="cpg-sec-b" id="cpg-dia"></div>');

    // Secção 3: saídos no dia e no mês.
    var sec = document.createElement('div');
    sec.className = 'table-section cpg-sec';
    sec.innerHTML = '<div class="cpg-sec-h"><div class="cpx-tit"><span class="cpx-n">3</span>Pacientes Saídos</div>' +
      '<div class="cpg-tabs"><button type="button" class="cpg-tab on" id="cpg-tab-dia">No dia</button><button type="button" class="cpg-tab" id="cpg-tab-mes">No mês</button></div></div>' +
      '<div class="cpg-sec-b" id="cpg-saidos"></div>';
    tab.parentNode.insertBefore(sec, tab.nextSibling);
    sec.querySelector('#cpg-tab-dia').addEventListener('click', function () { modoSaidos = 'dia'; renderSaidos(); });
    sec.querySelector('#cpg-tab-mes').addEventListener('click', function () { modoSaidos = 'mes'; renderSaidos(); });

    // Pesquisa filtra os cartões do dia.
    window.filterTable = filtrar;
    // Sempre que a página redesenha os internados, redesenha as três listas.
    window.renderInternadosPanel = tudo;
    tudo();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(montar, 0); });
  else setTimeout(montar, 0);
})();
