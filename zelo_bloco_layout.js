// ── ZELO — Bloco Operatório (Registo Diário): visual próprio de bloco operatório ──
// Mantém a estrutura da Consulta Externa (menu lateral, secções numeradas) e
// acrescenta o carácter de um bloco operatório:
//   • faixa do topo em verde-cirúrgico, com linha de monitor cardíaco animada,
//     relógio e estado do bloco ("Bloco em atividade — N cirurgias hoje");
//   • indicadores com ícones: cirurgias, urgentes, eletivas, suspensas,
//     óbitos e transferências para a UCI (com homens/mulheres);
//   • "Quadro do Bloco": linha do tempo das cirurgias por hora (urgente /
//     eletiva) com os turnos, especialidades em destaque, técnicas
//     anestésicas usadas e desfechos;
//   • especialidades com cirurgias realçadas.
// Só lê os dados da página (surgeries, totais) — não altera nada.
(function () {
  if (window.__zeloBlocoLayout) return;
  window.__zeloBlocoLayout = true;

  var VERDE = '#0F766E', VERDE_ESC = '#0B3B46', URG = '#DC2626', ELET = '#0891B2';
  var css = [
    ':root{--bx-accent:#0F766E;--bx-accent2:#3E5C87;--bx-tint:#E6F4F1;--bx-ring:#A7D7CE;--bx-br:#E3E8F0;--bx-tx:#1F2937;--bx-mut:#64748B}',
    // ── Menu lateral (Consulta Externa, com o verde do bloco)
    '.sidebar{padding-top:0 !important}',
    '.bx-hdr{display:flex;align-items:center;gap:10px;padding:14px 16px 12px;border-bottom:1px solid var(--bx-br);margin-bottom:4px}',
    '.bx-hdr i{width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,' + VERDE_ESC + ',' + VERDE + ');display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}',
    '.bx-hdr i svg{width:16px;height:16px;stroke:#fff}',
    '.bx-hdr b{display:block;font:600 .66rem Georgia,"Times New Roman",serif;text-transform:uppercase;letter-spacing:2px;color:var(--bx-mut)}',
    '.bx-hdr small{display:block;font:700 .78rem Inter,Arial,sans-serif;color:var(--bx-tx);margin-top:1px}',
    '.sidebar-section-label{padding:12px 16px 4px !important;font:800 .6rem Inter,"Segoe UI",Arial,sans-serif !important;letter-spacing:2px !important;color:var(--bx-mut) !important}',
    '.sidebar-divider{margin:8px 12px !important}',
    '.sidebar .nav-item{margin:1px 10px !important;padding:9px 12px !important;border-radius:9px !important;border:1px solid transparent !important;border-left-width:1px !important;gap:10px !important;font:500 .86rem Inter,"Segoe UI",Arial,sans-serif !important;color:var(--bx-tx) !important;letter-spacing:0 !important;background:none !important}',
    '.sidebar .nav-item .nav-ic{width:auto !important;height:auto !important;background:none !important;border-radius:0 !important}',
    '.sidebar .nav-item .nav-ic svg{width:16px !important;height:16px !important;stroke:var(--bx-mut) !important}',
    '.sidebar .nav-item:hover{background:var(--bx-tint) !important;color:var(--bx-accent) !important}',
    '.sidebar .nav-item:hover .nav-ic svg{stroke:var(--bx-accent) !important}',
    '.sidebar .nav-item.active{background:var(--bx-tint) !important;border-color:var(--bx-ring) !important;color:var(--bx-accent) !important;font-weight:700 !important}',
    '.sidebar .nav-item.active .nav-ic svg{stroke:var(--bx-accent) !important}',
    // ── Conteúdo
    '.main-content{padding:20px 22px 100px !important}',
    // Faixa (monitor do bloco)
    '.bx-faixa{position:relative;overflow:hidden;background:radial-gradient(120% 140% at 100% 0%,#14867c 0%,' + VERDE + ' 35%,' + VERDE_ESC + ' 100%);border-radius:16px;color:#fff;padding:20px 24px;margin-bottom:14px;box-shadow:0 10px 26px rgba(11,59,70,.25);display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}',
    '.bx-faixa::before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);background-size:22px 22px;pointer-events:none}',
    '.bx-ecg{position:absolute;left:0;right:0;bottom:6px;height:46px;width:100%;opacity:.55;pointer-events:none}',
    '.bx-ecg path{fill:none;stroke:#5EEAD4;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1400;stroke-dashoffset:1400;animation:bxEcg 5s linear infinite;filter:drop-shadow(0 0 3px rgba(94,234,212,.8))}',
    '@keyframes bxEcg{to{stroke-dashoffset:0}}',
    '@media (prefers-reduced-motion:reduce){.bx-ecg path{animation:none;stroke-dashoffset:0}}',
    '.bx-f-esq{display:flex;align-items:center;gap:14px;position:relative}',
    '.bx-f-ic{width:52px;height:52px;border-radius:14px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.28);display:flex;align-items:center;justify-content:center;flex-shrink:0}',
    '.bx-f-ic svg{width:26px;height:26px;stroke:#fff}',
    '.bx-faixa .s{font:800 1.2rem Inter,"Segoe UI",Arial,sans-serif}',
    '.bx-faixa .d{font:500 .8rem Inter,Arial,sans-serif;color:#CCFBF1;margin-top:3px}',
    '.bx-f-dir{display:flex;gap:10px;align-items:center;flex-wrap:wrap;position:relative}',
    '.bx-chip{display:inline-flex;align-items:center;gap:8px;font:700 .78rem Inter,Arial,sans-serif;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.3);border-radius:999px;padding:8px 14px;white-space:nowrap}',
    '.bx-dot{width:9px;height:9px;border-radius:50%;background:#94A3B8;box-shadow:0 0 0 0 rgba(94,234,212,.7)}',
    '.bx-dot.on{background:#5EEAD4;animation:bxPulso 1.6s infinite}',
    '@keyframes bxPulso{0%{box-shadow:0 0 0 0 rgba(94,234,212,.7)}70%{box-shadow:0 0 0 9px rgba(94,234,212,0)}100%{box-shadow:0 0 0 0 rgba(94,234,212,0)}}',
    '.bx-relogio{font:700 1.05rem ui-monospace,Consolas,monospace;letter-spacing:.06em;background:rgba(0,0,0,.18);border-radius:10px;padding:7px 12px;border:1px solid rgba(255,255,255,.18)}',
    // Indicadores
    '.bx-kpis{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:16px}',
    '.bx-kpi{background:#fff;border:1px solid var(--bx-br);border-radius:14px;padding:12px 14px;position:relative;overflow:hidden;box-shadow:0 1px 2px rgba(15,23,42,.04);display:flex;gap:12px;align-items:center}',
    '.bx-kpi::after{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--k)}',
    '.bx-kpi i{width:38px;height:38px;border-radius:11px;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,var(--k) 12%,#fff);flex-shrink:0}',
    '.bx-kpi i svg{width:19px;height:19px;stroke:var(--k)}',
    '.bx-kpi b{display:block;font:700 1.5rem ui-monospace,Consolas,monospace;color:var(--k);line-height:1.05}',
    '.bx-kpi span{display:block;font:700 .62rem Inter,Arial,sans-serif;letter-spacing:.5px;text-transform:uppercase;color:var(--bx-mut);margin-top:3px}',
    '.bx-kpi em{display:block;font:600 .66rem Inter,Arial,sans-serif;font-style:normal;color:#94A3B8;margin-top:2px}',
    // Quadro do Bloco
    '.bx-quadro{background:#fff;border:1px solid var(--bx-br);border-radius:14px;margin-bottom:16px;overflow:hidden;box-shadow:0 1px 2px rgba(15,23,42,.04)}',
    '.bx-q-h{display:flex;align-items:center;gap:10px;padding:13px 16px;border-bottom:1px dashed var(--bx-br);font:800 .9rem Inter,Arial,sans-serif;color:var(--bx-tx)}',
    '.bx-q-h small{margin-left:auto;font:600 .72rem Inter,Arial,sans-serif;color:var(--bx-mut)}',
    '.bx-q-grid{display:grid;grid-template-columns:1.6fr 1fr 1fr;gap:0}',
    '.bx-q-col{padding:14px 16px;border-right:1px solid #EEF2F7;min-width:0}',
    '.bx-q-col:last-child{border-right:0}',
    '.bx-q-t{font:800 .64rem Inter,Arial,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--bx-mut);margin-bottom:10px;display:flex;align-items:center;gap:8px}',
    '.bx-leg{margin-left:auto;display:flex;gap:10px;font:600 .64rem Inter,Arial,sans-serif;text-transform:none;letter-spacing:0}',
    '.bx-leg span::before{content:"";display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:4px;background:var(--c)}',
    '.bx-horas{display:grid;grid-template-columns:repeat(24,1fr);gap:3px;align-items:end;height:110px;padding:0 2px;background:linear-gradient(transparent 49.5%,#EEF2F7 50%,transparent 50.5%)}',
    '.bx-h{display:flex;flex-direction:column-reverse;height:100%;border-radius:4px 4px 0 0;overflow:hidden;background:#F1F5F9;position:relative;cursor:default}',
    '.bx-h i{display:block;width:100%}',
    '.bx-h.agora{outline:2px solid #5EEAD4;outline-offset:1px}',
    '.bx-eixo{display:grid;grid-template-columns:repeat(24,1fr);gap:3px;padding:4px 2px 0;font:600 .58rem ui-monospace,Consolas,monospace;color:#94A3B8;text-align:center}',
    '.bx-turnos{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}',
    '.bx-turno{flex:1;min-width:90px;border:1px solid #E3E8F0;border-radius:10px;padding:7px 10px;background:#F8FAFC}',
    '.bx-turno b{font:700 1rem ui-monospace,Consolas,monospace;color:var(--bx-tx)}',
    '.bx-turno span{display:block;font:700 .6rem Inter,Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--bx-mut)}',
    '.bx-top{display:flex;flex-direction:column;gap:9px}',
    '.bx-top-l{display:grid;grid-template-columns:1fr auto;gap:4px 8px;font:600 .8rem Inter,Arial,sans-serif;color:var(--bx-tx)}',
    '.bx-top-l b{font-family:ui-monospace,Consolas,monospace}',
    '.bx-top-l div{grid-column:1/-1;height:6px;border-radius:4px;background:#EEF2F7;overflow:hidden;display:flex}',
    '.bx-top-l div i{display:block;height:100%}',
    '.bx-anest{display:flex;flex-wrap:wrap;gap:6px}',
    '.bx-anest span{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:5px 10px;font:600 .74rem Inter,Arial,sans-serif;background:#F1F5F9;color:#475569;border:1px solid #E3E8F0}',
    '.bx-anest span.on{background:#F3E8FF;color:#6D28D9;border-color:#DDD6FE}',
    '.bx-anest span b{font-family:ui-monospace,Consolas,monospace}',
    '.bx-desf{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:14px}',
    '.bx-desf div{border-radius:10px;padding:8px;text-align:center;border:1px solid #E3E8F0;background:#F8FAFC}',
    '.bx-desf b{display:block;font:700 1.1rem ui-monospace,Consolas,monospace}',
    '.bx-desf span{font:700 .58rem Inter,Arial,sans-serif;letter-spacing:.05em;text-transform:uppercase;color:var(--bx-mut)}',
    '.bx-vazio{font:500 .82rem Inter,Arial,sans-serif;color:#94A3B8;padding:6px 0}',
    // Secções e cartões
    '.section-header{margin-bottom:14px !important}',
    '.section-badge{display:none !important}',
    '.section-title{font:800 1.15rem Inter,"Segoe UI",Arial,sans-serif !important;color:var(--bx-tx) !important;letter-spacing:0 !important}',
    '.main-content .card{border-radius:14px !important;border:1px solid var(--bx-br) !important;box-shadow:0 1px 2px rgba(15,23,42,.04) !important;margin-bottom:16px !important}',
    '.main-content .card::before{display:none !important}',
    '.main-content .card > .card-title{margin:-26px -28px 18px !important;padding:13px 16px !important;border-bottom:1px dashed var(--bx-br);font:800 .9rem Inter,"Segoe UI",Arial,sans-serif !important;text-transform:none !important;letter-spacing:0 !important;color:var(--bx-tx) !important;gap:10px !important}',
    '.bx-n{width:26px;height:26px;border-radius:8px;background:var(--bx-accent);color:#fff;display:inline-flex;align-items:center;justify-content:center;font:700 .78rem Inter,Arial,sans-serif;flex-shrink:0}',
    // Especialidades: com cirurgias ficam realçadas
    '.spec-dash-card{transition:transform .15s,box-shadow .15s,border-color .15s;opacity:.72}',
    '.spec-dash-card.bx-ativo{opacity:1;background:#fff !important;border-color:var(--bx-ring) !important;border-left:4px solid var(--bx-accent) !important;box-shadow:0 6px 16px rgba(15,118,110,.10) !important}',
    '.spec-dash-card.bx-ativo .sdc-val{color:var(--bx-accent) !important}',
    '.spec-dash-card.bx-ativo .sdc-name{color:var(--bx-tx) !important}',
    '.add-surgery-btn{border-radius:10px !important;font-weight:700 !important;background:var(--bx-accent) !important;border-color:var(--bx-accent) !important;color:#fff !important}',
    // Escuro
    'html.dark .bx-kpi,html.dark .bx-quadro,html[data-zelo-theme="dark"] .bx-kpi,html[data-zelo-theme="dark"] .bx-quadro{background:#111A2B;border-color:#1F2A3D}',
    'html.dark .bx-q-h,html.dark .bx-top-l,html[data-zelo-theme="dark"] .bx-q-h,html[data-zelo-theme="dark"] .bx-top-l{color:#E6ECF5}',
    'html.dark .bx-turno,html.dark .bx-desf div,html.dark .bx-h,html[data-zelo-theme="dark"] .bx-turno,html[data-zelo-theme="dark"] .bx-desf div,html[data-zelo-theme="dark"] .bx-h{background:#0F1828;border-color:#1F2A3D}',
    'html.dark .main-content .card > .card-title,html[data-zelo-theme="dark"] .main-content .card > .card-title{color:#E6ECF5 !important}',
    '@media(max-width:1100px){.bx-kpis{grid-template-columns:repeat(3,1fr)}.bx-q-grid{grid-template-columns:1fr 1fr}.bx-q-col:first-child{grid-column:1/-1;border-right:0;border-bottom:1px solid #EEF2F7}}',
    '@media(max-width:700px){.bx-kpis{grid-template-columns:repeat(2,1fr)}.bx-q-grid{grid-template-columns:1fr}.bx-q-col{border-right:0;border-bottom:1px solid #EEF2F7}.main-content .card > .card-title{margin:-18px -16px 14px !important}.bx-eixo span:nth-child(odd){visibility:hidden}}'
  ].join('\n');

  function ic(d) { return '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; }
  var I = {
    bisturi: '<path d="M20 4 8.5 15.5"/><path d="M8.5 15.5 4 20l1-4.5L16.5 4z"/><path d="M14 6l4 4"/>',
    alerta: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    agenda: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="m9 16 2 2 4-4"/>',
    pausa: '<circle cx="12" cy="12" r="10"/><path d="M10 15V9M14 15V9"/>',
    obito: '<path d="M12 2v20"/><path d="M6 8h12"/>',
    uci: '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>',
    monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M5 11h3l2-4 3 8 2-4h4"/>'
  };
  var ANEST = [['GOT', 'Geral endotraqueal'], ['GEV', 'Geral endovenosa'], ['DISS', 'Dissociativa'], ['BAL', 'Balanceada'], ['COMB', 'Combinada'], ['REG.', 'Raquidiana'], ['EPI', 'Epidural'], ['BN', 'Bloqueio nervoso'], ['LOC', 'Local']];
  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  var DIAS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  function saudacao() { var h = new Date().getHours(); return h >= 5 && h < 12 ? 'Bom dia' : (h >= 12 && h < 19 ? 'Boa tarde' : 'Boa noite'); }
  function dataLonga(iso) {
    var p = String(iso || '').split('-'); if (p.length !== 3) return '';
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return DIAS[d.getDay()] + ', ' + (+p[2]) + ' de ' + MESES[+p[1] - 1] + ' de ' + p[0];
  }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function txt(id) { var e = document.getElementById(id); return e ? (e.textContent || '0').trim() : '0'; }
  function lista() {
    try { return (typeof surgeries !== 'undefined' && surgeries) ? [].concat(surgeries.urg || [], surgeries.elet || []) : []; } catch (e) { return []; }
  }
  function hora(s) { var m = /^(\d{1,2})/.exec(String(s.hora || '')); var h = m ? +m[1] : NaN; return h >= 0 && h < 24 ? h : null; }

  var KPIS = [
    ['total', 'Cirurgias do dia', '#0F766E', I.bisturi],
    ['urg', 'Urgentes', URG, I.alerta],
    ['elet', 'Eletivas', ELET, I.agenda],
    ['sus', 'Suspensas', '#D97706', I.pausa],
    ['obito', 'Óbitos', '#475569', I.obito],
    ['uci', 'Transf. UCI', '#7C3AED', I.uci]
  ];

  function montar() {
    var main = document.querySelector('.main-content');
    var side = document.getElementById('sidebar');
    if (!main || !side || document.getElementById('bx-estilos')) return;
    var st = document.createElement('style'); st.id = 'bx-estilos'; st.textContent = css; document.head.appendChild(st);

    // Menu: identificação do serviço no topo.
    var h = document.createElement('div'); h.className = 'bx-hdr';
    h.innerHTML = '<i>' + ic(I.bisturi) + '</i><div><b>Bloco Operatório</b><small>Registo diário</small></div>';
    side.insertBefore(h, side.firstChild);

    // Faixa do topo (monitor do bloco).
    var faixa = document.createElement('div'); faixa.className = 'bx-faixa';
    faixa.innerHTML =
      '<svg class="bx-ecg" viewBox="0 0 1200 46" preserveAspectRatio="none" aria-hidden="true"><path d="M0 30 H180 l10 0 8 -16 8 30 8 -22 6 8 H420 l10 0 8 -16 8 30 8 -22 6 8 H660 l10 0 8 -16 8 30 8 -22 6 8 H900 l10 0 8 -16 8 30 8 -22 6 8 H1200"/></svg>' +
      '<div class="bx-f-esq"><div class="bx-f-ic">' + ic(I.monitor) + '</div><div><div class="s">' + saudacao() + '</div><div class="d" id="bx-data"></div></div></div>' +
      '<div class="bx-f-dir"><span class="bx-chip"><span class="bx-dot" id="bx-dot"></span><span id="bx-estado">A carregar…</span></span><span class="bx-relogio" id="bx-relogio">--:--</span></div>';
    var kp = document.createElement('div'); kp.className = 'bx-kpis';
    kp.innerHTML = KPIS.map(function (k) {
      return '<div class="bx-kpi" style="--k:' + k[2] + '"><i>' + ic(k[3]) + '</i><div><b data-k="' + k[0] + '">0</b><span>' + k[1] + '</span><em data-g="' + k[0] + '"></em></div></div>';
    }).join('');
    main.insertBefore(kp, main.firstChild);
    main.insertBefore(faixa, main.firstChild);

    // Quadro do Bloco, no início da secção das cirurgias.
    var quadro = document.createElement('div'); quadro.className = 'bx-quadro';
    quadro.innerHTML = '<div class="bx-q-h"><span class="bx-n" style="background:' + VERDE_ESC + '">' + ic(I.monitor).replace('<svg ', '<svg style="width:15px;height:15px;stroke:#fff" ') + '</span>Quadro do Bloco<small id="bx-q-nota"></small></div>' +
      '<div class="bx-q-grid"><div class="bx-q-col" id="bx-col-horas"></div><div class="bx-q-col" id="bx-col-esp"></div><div class="bx-q-col" id="bx-col-anest"></div></div>';
    var secCir = document.getElementById('cirurgias');
    var hdrCir = secCir && secCir.querySelector('.section-header');
    if (hdrCir) hdrCir.parentNode.insertBefore(quadro, hdrCir.nextSibling);

    var ultimo = '';
    function atualizar() {
      var ss = lista();
      var n = ss.length;
      var urg = ss.filter(function (s) { return s.carac === 'Urgente'; }).length;
      var elet = n - urg;
      var mas = ss.filter(function (s) { return /^m/i.test(s.sexo || ''); }).length;
      var fem = ss.filter(function (s) { return /^f/i.test(s.sexo || ''); }).length;
      var obitos = ss.filter(function (s) { return s.deceased; }).length;
      var uci = ss.filter(function (s) { return s.transfer === 'UCI'; }).length;
      var sala = ss.filter(function (s) { return s.transfer === 'Sala'; }).length;
      var sus = parseInt(txt('sus-total'), 10) || 0;
      // Se a lista não estiver acessível, usa os totais que a página mostra.
      if (!n && (parseInt(txt('cir-total-geral'), 10) || 0) > 0) { n = +txt('cir-total-geral'); urg = +txt('cir-count-urg'); elet = +txt('cir-count-elet'); mas = +txt('cir-homens'); fem = +txt('cir-mulheres'); }
      var v = { total: n, urg: urg, elet: elet, sus: sus, obito: obitos, uci: uci };
      var g = { total: '♂ ' + mas + ' · ♀ ' + fem, urg: n ? Math.round(urg / n * 100) + '% do dia' : '', elet: n ? Math.round(elet / n * 100) + '% do dia' : '', sus: '', obito: obitos && n ? Math.round(obitos / n * 100) + '% das cirurgias' : '', uci: sala ? sala + ' para a sala' : '' };
      Object.keys(v).forEach(function (k) {
        var b = kp.querySelector('[data-k="' + k + '"]'); if (b) b.textContent = v[k];
        var e = kp.querySelector('[data-g="' + k + '"]'); if (e) e.textContent = g[k];
      });
      var inp = document.getElementById('regDate');
      var elD = document.getElementById('bx-data'); if (elD) elD.textContent = (inp && inp.value ? dataLonga(inp.value) : '') + ' · Registo diário do Bloco Operatório';
      var dot = document.getElementById('bx-dot'), est = document.getElementById('bx-estado');
      if (dot) dot.classList.toggle('on', n > 0);
      if (est) est.textContent = n ? 'Bloco em atividade — ' + n + (n === 1 ? ' cirurgia' : ' cirurgias') : 'Sem cirurgias registadas neste dia';

      // Quadro (só redesenha quando os dados mudam).
      var chave = JSON.stringify([ss.map(function (s) { return [s.id, s.hora, s.carac, s.esp, s.anest, s.deceased, s.transfer]; }), sus]);
      if (chave === ultimo) return;
      ultimo = chave;
      var nota = document.getElementById('bx-q-nota'); if (nota) nota.textContent = n ? n + ' cirurgia(s) · ' + urg + ' urgente(s) · ' + elet + ' eletiva(s)' : '';

      // 1) Linha do tempo por hora
      var porHora = []; for (var i = 0; i < 24; i++) porHora.push({ u: 0, e: 0 });
      var semHora = 0;
      ss.forEach(function (s) { var hh = hora(s); if (hh === null) { semHora++; return; } if (s.carac === 'Urgente') porHora[hh].u++; else porHora[hh].e++; });
      var max = Math.max.apply(null, porHora.map(function (x) { return x.u + x.e; }).concat([1]));
      var agora = new Date().getHours();
      var turno = function (a, b) { var t = 0; for (var i2 = a; i2 < b; i2++) t += porHora[i2].u + porHora[i2].e; return t; };
      document.getElementById('bx-col-horas').innerHTML =
        '<div class="bx-q-t">Cirurgias por hora<span class="bx-leg"><span style="--c:' + URG + '">Urgente</span><span style="--c:' + ELET + '">Eletiva</span></span></div>' +
        '<div class="bx-horas">' + porHora.map(function (x, hh) {
          var t = x.u + x.e;
          return '<div class="bx-h' + (hh === agora ? ' agora' : '') + '" title="' + String(hh).padStart(2, '0') + 'h — ' + t + ' cirurgia(s)">' +
            '<i style="height:' + (x.e / max * 100) + '%;background:' + ELET + '"></i><i style="height:' + (x.u / max * 100) + '%;background:' + URG + '"></i></div>';
        }).join('') + '</div>' +
        '<div class="bx-eixo">' + porHora.map(function (x, hh) { return '<span>' + (hh % 3 === 0 ? String(hh).padStart(2, '0') : '') + '</span>'; }).join('') + '</div>' +
        '<div class="bx-turnos"><div class="bx-turno"><span>Manhã 07–13h</span><b>' + turno(7, 13) + '</b></div><div class="bx-turno"><span>Tarde 13–19h</span><b>' + turno(13, 19) + '</b></div><div class="bx-turno"><span>Noite 19–07h</span><b>' + (turno(19, 24) + turno(0, 7)) + '</b></div>' +
        (semHora ? '<div class="bx-turno"><span>Sem hora</span><b>' + semHora + '</b></div>' : '') + '</div>';

      // 2) Especialidades em destaque
      var esp = {};
      ss.forEach(function (s) { var k = s.esp && s.esp !== '—' ? s.esp : 'Não indicada'; var e = esp[k] || (esp[k] = { u: 0, e: 0 }); if (s.carac === 'Urgente') e.u++; else e.e++; });
      var top = Object.keys(esp).map(function (k) { return { n: k, u: esp[k].u, e: esp[k].e, t: esp[k].u + esp[k].e }; }).sort(function (a, b) { return b.t - a.t; }).slice(0, 6);
      var maxE = top.length ? top[0].t : 1;
      document.getElementById('bx-col-esp').innerHTML = '<div class="bx-q-t">Especialidades em destaque</div>' +
        (top.length ? '<div class="bx-top">' + top.map(function (x) {
          return '<div class="bx-top-l"><span>' + esc(x.n) + '</span><b>' + x.t + '</b><div><i style="width:' + (x.u / maxE * 100) + '%;background:' + URG + '"></i><i style="width:' + (x.e / maxE * 100) + '%;background:' + ELET + '"></i></div></div>';
        }).join('') + '</div>' : '<div class="bx-vazio">Ainda sem cirurgias registadas neste dia.</div>');

      // 3) Anestesia e desfechos
      var an = {}; ss.forEach(function (s) { (s.anest || []).forEach(function (t) { an[t] = (an[t] || 0) + 1; }); });
      document.getElementById('bx-col-anest').innerHTML = '<div class="bx-q-t">Técnicas anestésicas</div>' +
        '<div class="bx-anest">' + ANEST.map(function (a) { var c = an[a[0]] || 0; return '<span class="' + (c ? 'on' : '') + '" title="' + a[1] + '">' + a[1] + (c ? ' <b>' + c + '</b>' : '') + '</span>'; }).join('') + '</div>' +
        '<div class="bx-desf"><div><b style="color:#475569">' + obitos + '</b><span>Óbitos</span></div><div><b style="color:#7C3AED">' + uci + '</b><span>Transf. UCI</span></div><div><b style="color:#0891B2">' + sala + '</b><span>Transf. sala</span></div></div>';

      // Especialidades com cirurgias realçadas
      document.querySelectorAll('.spec-dash-card').forEach(function (c) {
        var val = c.querySelector('.sdc-val');
        c.classList.toggle('bx-ativo', !!val && (parseInt(val.textContent, 10) || 0) > 0);
      });
    }
    function relogio() {
      var r = document.getElementById('bx-relogio'); if (!r) return;
      var d = new Date(); r.textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    }
    atualizar(); relogio();
    ['cir-total-geral', 'cir-count-urg', 'cir-count-elet', 'sus-total'].forEach(function (id) {
      var src = document.getElementById(id);
      if (src && window.MutationObserver) new MutationObserver(function () { setTimeout(atualizar, 0); }).observe(src, { childList: true, characterData: true, subtree: true });
    });
    var inp = document.getElementById('regDate');
    if (inp) { inp.addEventListener('change', function () { setTimeout(atualizar, 300); }); }
    setInterval(atualizar, 2500);
    setInterval(relogio, 15000);

    // Os indicadores do dia só aparecem no registo das cirurgias.
    function mostrarKpis() {
      var ativa = document.querySelector('.main-content .section.active');
      kp.style.display = !ativa || ativa.id === 'cirurgias' ? '' : 'none';
    }
    mostrarKpis();
    side.addEventListener('click', function () { setTimeout(mostrarKpis, 0); });
    if (window.MutationObserver) document.querySelectorAll('.main-content .section').forEach(function (sec) {
      new MutationObserver(mostrarKpis).observe(sec, { attributes: true, attributeFilter: ['class'] });
    });

    // Cartões numerados dentro de cada secção (na das cirurgias, o Quadro é o 1).
    document.querySelectorAll('.main-content .section').forEach(function (sec) {
      var n = sec.id === 'cirurgias' ? 1 : 0;
      sec.querySelectorAll('.card > .card-title').forEach(function (t) {
        if (t.querySelector('.bx-n')) return;
        n++; t.insertAdjacentHTML('afterbegin', '<span class="bx-n">' + n + '</span>');
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar); else montar();
})();
