// ── ZELO — Movimento Hospitalar: novo design (partilhado pelas 9 páginas) ──
// • Faixa de números: mês/período, camas e o resumo (existência anterior,
//   admitidos, saídos, óbitos, ficam, ocupação, demora média).
// • Registo do dia: fita com os dias do mês (verde = registado, amarelo =
//   em falta) e só os campos desse dia, com botões − / +; a conta
//   "Existência + Entradas − Saídas = Ficam" aparece ao vivo.
// • "Guardar e seguir para o dia seguinte".
// • Resumo com gráficos próprios (não dependem da internet).
// • Mapa do mês = a grelha de sempre (zelo_movimento_grelha.js), por baixo.
//
// Não muda os dados: escreve em data[mês][campo][dia] e chama persistData()
// / updateStats() / renderTable() da própria página, como a grelha já fazia
// (mesma gravação, sincronização, "Última alteração" e PDF).
(function () {
  if (window.__zeloMovV2) return;
  window.__zeloMovV2 = true;

  var MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  var MES3 = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  var SEM = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  var SEM_LONGO = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  var EDIT = ['diretos', 'transferidos_adm', 'altas', 'transferidos_sai', 'menos_48', 'mais_48', 'dia_cama', 'dia_doente'];
  var GRUPOS = [
    ['e', 'Entradas', [['diretos', 'Diretos'], ['transferidos_adm', 'Transferidos de outro serviço']]],
    ['s', 'Saídas', [['altas', 'Altas / vivos'], ['transferidos_sai', 'Transferidos'], ['menos_48', 'Óbitos < 48 h'], ['mais_48', 'Óbitos > 48 h']]],
    ['c', 'Camas', [['dia_cama', 'Dias de cama'], ['dia_doente', 'Dias-doente']]]
  ];

  var css = `
  .view-selector,.period-nav,.capacity-box,.controls,.stats-grid,.charts-section{display:none !important}
  #viewNote.hidden,#viewNote:empty{display:none !important}
  .m2{font-family:Inter,"Segoe UI",Roboto,Arial,sans-serif;color:#0F172A;margin-bottom:16px}
  .m2 *{box-sizing:border-box}
  .m2-faixa{background:linear-gradient(135deg,#1E3A5F,#2B5A8A);color:#fff;border-radius:18px;padding:14px 18px;box-shadow:0 10px 24px rgba(30,58,95,.22)}
  .m2-f1{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
  .m2-mes{display:flex;align-items:center;gap:8px}
  .m2-mes button{width:36px;height:36px;border-radius:10px;border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.08);color:#fff;font-size:1.15rem;cursor:pointer}
  .m2-mes button:hover{background:rgba(255,255,255,.18)}
  .m2-mes b{display:block;font-size:1.22rem;font-weight:800}.m2-mes span{display:block;font-size:.78rem;opacity:.82}
  .m2-camas{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.1);border-radius:10px;padding:4px 5px 4px 10px;font:600 .82rem Inter,Arial,sans-serif}
  .m2-camas input{width:54px;border:0;border-radius:7px;padding:5px 4px;text-align:center;font:800 .92rem ui-monospace,Consolas,monospace;color:#0F172A}
  .m2-seg{display:flex;background:rgba(255,255,255,.1);border-radius:12px;padding:3px;margin-left:auto}
  .m2-seg button{border:0;background:transparent;padding:7px 13px;border-radius:9px;font:700 .82rem Inter,Arial,sans-serif;color:rgba(255,255,255,.82);cursor:pointer}
  .m2-seg button.on{background:#fff;color:#1E3A5F}
  .m2-nums{display:flex;margin-top:12px;border-top:1px solid rgba(255,255,255,.15);padding-top:10px}
  .m2-num{flex:1;text-align:center;border-left:1px solid rgba(255,255,255,.15);padding:0 6px;min-width:0}.m2-num:first-child{border-left:0}
  .m2-num b{display:block;font:800 1.55rem ui-monospace,Consolas,monospace}
  .m2-num span{display:block;font:700 .64rem Inter,Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;opacity:.86}
  .m2-num.e b{color:#67E8F9}.m2-num.s b{color:#C4B5FD}.m2-num.o b{color:#FCA5A5}.m2-num.p b{color:#6EE7B7}
  .m2-acoes{display:flex;gap:10px;align-items:center;margin:14px 0;flex-wrap:wrap}
  .m2-b{border:0;border-radius:12px;padding:11px 16px;font:700 .9rem Inter,Arial,sans-serif;display:inline-flex;gap:7px;align-items:center;cursor:pointer;white-space:nowrap}
  .m2-b.p{background:linear-gradient(135deg,#1E3A5F,#2B5A8A);color:#fff;box-shadow:0 8px 18px rgba(30,58,95,.25)}
  .m2-b.o{background:#fff;border:1px solid #E3E8F0;color:#1E3A5F}
  .m2-b:disabled{opacity:.5;cursor:default}
  .m2-falta{margin-left:auto;background:#FFFBEB;border:1px solid #FDE68A;color:#92400E;border-radius:999px;padding:7px 13px;font:700 .82rem Inter,Arial,sans-serif}
  .m2-falta.ok{background:#ECFDF5;border-color:#A7F3D0;color:#047857}
  .m2-g2{display:grid;grid-template-columns:1.15fr 1fr;gap:16px}
  .m2-card{background:#fff;border:1px solid #E3E8F0;border-radius:16px;overflow:hidden}
  .m2-ch{display:flex;align-items:center;gap:10px;padding:13px 18px;border-bottom:1px solid #E3E8F0;font:800 .98rem Inter,Arial,sans-serif;color:#1E3A5F}
  .m2-ch i{font-style:normal;width:24px;height:24px;border-radius:50%;background:#1E3A5F;color:#fff;font:800 .74rem Inter,Arial;display:flex;align-items:center;justify-content:center}
  .m2-ch small{margin-left:auto;color:#64748B;font:600 .8rem Inter,Arial,sans-serif}
  .m2-cb{padding:14px 18px}
  .m2-dias{display:grid;grid-template-columns:repeat(7,1fr);gap:10px}
  .m2-semcab{display:grid;grid-template-columns:repeat(7,1fr);gap:10px;margin-bottom:8px}
  .m2-semcab span{text-align:center;font:800 .7rem Inter,Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#64748B}
  .m2-dias .m2-d{min-height:66px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:1.3rem;border-radius:14px}
  .m2-dias .m2-d small{font-size:.66rem}
  .m2-g2.m2-g2d{grid-template-columns:1fr}
  .m2-g2d .m2-cal-card{order:-1}
  .m2-grps{display:grid;grid-template-columns:1fr 1.6fr 1.3fr;gap:12px;align-items:start}.m2-grps .m2-grp{margin-bottom:0}
  .m2-guard{margin-top:12px}
  @media (min-width:1100px){.m2-semcab{display:none}.m2-dias{grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:6px}.m2-dias>span{display:none}.m2-dias .m2-d{min-height:62px;font-size:1.15rem;border-radius:12px}}
  @media (max-width:1099px){.m2-grps{grid-template-columns:1fr}.m2-grps .m2-grp{margin-bottom:0}}
  #m2Resumo{margin:16px 0}
  .m2-grafs{display:grid;grid-template-columns:1.3fr 1.3fr 1fr;gap:16px;align-items:start}
  @media (max-width:980px){.m2-grafs{grid-template-columns:1fr}}
  #m2Resumo .m2-ind{grid-template-columns:repeat(4,1fr)}
  @media (max-width:980px){.m2-g2.m2-g2d{grid-template-columns:1fr}#m2Resumo .m2-ind{grid-template-columns:repeat(2,1fr)}.m2-g2 .m2-cal-card{order:-1}}
  .m2-d{border-radius:9px;text-align:center;padding:5px 0 4px;font:800 .84rem ui-monospace,Consolas,monospace;border:1.5px solid #E3E8F0;background:#fff;color:#0F172A;cursor:pointer}
  .m2-d small{display:block;font:600 .58rem Inter,Arial,sans-serif;color:#64748B}
  .m2-d.ok{background:#ECFDF5;border-color:#A7F3D0;color:#065F46}.m2-d.fa{background:#FFFBEB;border-color:#FDE68A;color:#92400E}
  .m2-d.fut{opacity:.45}.m2-d.hj{box-shadow:0 0 0 2px #93C5FD}
  .m2-d.on{background:#1E3A5F;border-color:#1E3A5F;color:#fff}.m2-d.on small{color:#CBD5E1}
  .m2-leg{display:flex;gap:14px;flex-wrap:wrap;margin-top:8px;font:600 .75rem Inter,Arial,sans-serif;color:#64748B}
  .m2-leg i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:4px;vertical-align:-1px}
  .m2-diah{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin:14px 0 10px}
  .m2-diah b{font-size:1.05rem}.m2-diah span{color:#64748B;font-size:.84rem}
  .m2-flux{display:grid;grid-template-columns:1fr auto 1fr auto 1fr auto 1fr;align-items:center;gap:6px;background:#F4F7FB;border-radius:14px;padding:10px 12px;margin-bottom:12px}
  .m2-fx{text-align:center}.m2-fx b{display:block;font:800 1.35rem ui-monospace,Consolas,monospace}
  .m2-fx span{font:700 .64rem Inter,Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#64748B}
  .m2-fx.e b{color:#0891B2}.m2-fx.s b{color:#7C3AED}.m2-fx.f b{color:#1E3A5F}
  .m2-fx input{width:70px;text-align:center;border:1.5px solid #F59E0B;background:#FFFBEB;border-radius:9px;font:800 1.15rem ui-monospace,monospace;padding:3px}
  .m2-op{font:800 1.1rem Inter,Arial;color:#94A3B8}
  .m2-grp{border:1px solid #E3E8F0;border-radius:14px;padding:10px 12px;margin-bottom:10px}
  .m2-grp h4{margin:0 0 8px;font:800 .78rem Inter,Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase}
  .m2-grp.e h4{color:#0891B2}.m2-grp.s h4{color:#7C3AED}.m2-grp.c h4{color:#64748B}
  .m2-campos{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.m2-grp.s .m2-campos{grid-template-columns:repeat(4,minmax(0,1fr))}
  .m2-cp{min-width:0}.m2-cp label{display:block;font:700 .76rem Inter,Arial,sans-serif;color:#334155;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .m2-st{display:flex;align-items:center;border:1.5px solid #E3E8F0;border-radius:12px;overflow:hidden;height:44px;background:#fff}
  .m2-st:focus-within{border-color:#2B5A8A;box-shadow:0 0 0 3px rgba(43,90,138,.14)}
  .m2-st button{width:40px;height:100%;border:0;background:#F1F5F9;font:800 1.15rem Inter,Arial;color:#1E3A5F;cursor:pointer;flex-shrink:0}
  .m2-st button:active{background:#E2E8F0}
  .m2-st input{flex:1;min-width:0;width:100%;border:0;text-align:center;font:800 1.08rem ui-monospace,Consolas,monospace;color:#0F172A;background:transparent;outline:none}
  .m2-st input::placeholder{color:#CBD5E1;font-weight:600}
  .m2-st.auto{background:#F1F5F9;border-style:dashed}.m2-st.auto input{color:#1E3A5F}
  .m2-fu{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px;padding-top:10px;border-top:1px dashed #E3E8F0}
  .m2-sel{width:100%;height:44px;border:1.5px solid #E3E8F0;border-radius:12px;padding:0 10px;font:600 .9rem Inter,Arial,sans-serif;background:#fff}
  .m2-funota{font:600 .74rem Inter,Arial,sans-serif;color:#64748B;margin-top:5px}
  .m2-autonota{background:#ECFDF5;border:1px solid #A7F3D0;color:#065F46;border-radius:10px;padding:8px 10px;font:600 .8rem Inter,Arial,sans-serif;margin-bottom:10px}
  .m2-st.x{border-color:#FCA5A5;background:#FEF2F2}.m2-st.x input{color:#B91C1C}
  .m2-dica{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
  .m2-dica button{border:1px dashed #BFD3EA;background:#F4F8FC;color:#1E3A5F;border-radius:9px;padding:6px 10px;font:700 .76rem Inter,Arial,sans-serif;cursor:pointer}
  .m2-aviso{background:#FEF2F2;color:#B91C1C;border-radius:10px;padding:8px 10px;font:700 .8rem Inter,Arial,sans-serif;margin-top:8px}
  .m2-guard{display:flex;justify-content:flex-end;gap:10px;align-items:center;margin-top:8px;flex-wrap:wrap}
  .m2-ok{margin-right:auto;font:700 .8rem Inter,Arial,sans-serif;color:#047857;opacity:0;transition:opacity .3s}.m2-ok.on{opacity:1}
  .m2-k3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px}
  .m2-k{background:#F4F7FB;border-radius:12px;padding:10px 12px}
  .m2-k span{font:700 .66rem Inter,Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#64748B}
  .m2-k b{display:block;font:800 1.3rem ui-monospace,Consolas,monospace;margin-top:3px}.m2-k small{font:600 .74rem Inter,Arial,sans-serif;color:#64748B}
  .m2-ind{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:8px;margin-bottom:12px}.m2-ind b i{font:600 .75rem Inter,Arial,sans-serif;color:#64748B;font-style:normal}
  .m2-tt{font:700 .8rem Inter,Arial,sans-serif;color:#334155;margin:10px 0 6px}
  .m2-sai{display:flex;height:16px;border-radius:8px;overflow:hidden;background:#F1F5F9}
  .m2 svg text{font-family:Inter,Arial,sans-serif}
  .m2-lista{display:none}
  .m2-lista .ln{display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid #EEF2F7;font-size:.86rem;cursor:pointer}
  .m2-lista .ln:last-child{border-bottom:0}.m2-lista .ln b{font-family:ui-monospace,monospace;width:30px}
  .m2-lista .ln .t{margin-left:auto;display:flex;gap:6px}
  .m2-lista .tg{font:700 .74rem ui-monospace,monospace;border-radius:6px;padding:2px 6px}
  .m2-lista .tg.e{background:#ECFEFF;color:#0891B2}.m2-lista .tg.s{background:#F5F3FF;color:#7C3AED}.m2-lista .tg.f{background:#EEF4FB;color:#1E3A5F}
  .m2-lista .ln.fa{background:#FFFBEB}.m2-lista .ln.fa .t{color:#92400E;font-weight:700}
  .m2-mapa-h{display:flex;align-items:center;gap:10px;margin:16px 0 8px;font:800 .98rem Inter,Arial,sans-serif;color:#1E3A5F}
  .m2-mapa-h i{font-style:normal;width:24px;height:24px;border-radius:50%;background:#1E3A5F;color:#fff;font:800 .74rem Inter,Arial;display:flex;align-items:center;justify-content:center}
  .m2-mapa-h small{margin-left:auto;color:#64748B;font:600 .8rem Inter,Arial,sans-serif}
  .m2-mapa-h button{border:1px solid #E3E8F0;background:#fff;color:#1E3A5F;border-radius:9px;padding:6px 10px;font:700 .78rem Inter,Arial,sans-serif;cursor:pointer;display:none}
  #dataTable th.m2-col-on,#dataTable td.m2-col-on{background:#EEF4FB !important}
  #dataTable tr:first-child th{cursor:pointer}
  html[data-zelo-theme="dark"] .m2{color:#E6ECF5}
  html[data-zelo-theme="dark"] .m2-card,html[data-zelo-theme="dark"] .m2-d,html[data-zelo-theme="dark"] .m2-st,html[data-zelo-theme="dark"] .m2-b.o{background:#111A2B;border-color:#1F2A3D;color:#E6ECF5}
  html[data-zelo-theme="dark"] .m2-flux,html[data-zelo-theme="dark"] .m2-k{background:#0F1726}
  html[data-zelo-theme="dark"] .m2-st input{color:#E6ECF5}
  @media (max-width:980px){.m2-g2{grid-template-columns:1fr}}
  @media (max-width:700px){
    .m2-faixa{padding:12px 14px;border-radius:16px}
    .m2-seg{margin-left:0;width:100%;overflow-x:auto}.m2-seg button{flex:1;padding:7px 8px}
    .m2-nums{display:grid;grid-template-columns:repeat(3,1fr);row-gap:10px}.m2-num{border-left:0}
    .m2-num b{font-size:1.25rem}.m2-num span{font-size:.58rem}
    .m2-num:nth-child(7){display:none}
    .m2-acoes .m2-b.o{padding:9px 12px;font-size:.84rem}
    .m2-dias,.m2-semcab{gap:6px}.m2-dias .m2-d{min-height:50px;font-size:1.05rem;border-radius:11px}
    .m2-flux{padding:8px}.m2-fx b{font-size:1.08rem}.m2-fx span{font-size:.54rem}
    .m2-grp.s .m2-campos{grid-template-columns:repeat(2,minmax(0,1fr))}
    .m2-cb{padding:12px}
    .m2-guard{position:sticky;bottom:0;background:#fff;margin:8px -12px -12px;padding:10px 12px;border-top:1px solid #E3E8F0;z-index:5}
    .m2-guard .m2-b{flex:1;justify-content:center}.m2-ok{display:none}
    .m2-falta{margin-left:0;width:100%;text-align:center}
    .m2-lista{display:block}
    body.m2-sem-tabela .table-section{display:none}
    .m2-mapa-h button{display:inline-block}
  }`;

  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pronto() { return typeof data !== 'undefined' && typeof currentMonth !== 'undefined' && currentMonth && typeof resolveValue === 'function'; }
  function hojeMes() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
  function raw(m, id, d) { var mm = peekMonth(m); var v = mm[id] ? mm[id][d] : null; return v === null || v === undefined || v === '' ? null : (parseInt(v, 10)); }
  function diaPreenchido(m, d) { return EDIT.some(function (id) { var v = raw(m, id, d); return v != null && !isNaN(v); }); }
  // Dias que já deviam estar feitos: mês passado = todos; mês atual = até ontem.
  function exigidos(m) { var h = hojeMes(); return m < h ? getDaysInMonth(m) : m === h ? new Date().getDate() - 1 : 0; }

  var dia = null, raiz = null, tOk = null;
  function diaInicial() {
    var m = currentMonth, n = getDaysInMonth(m), h = hojeMes();
    if (m === h) return new Date().getDate() - 1;
    for (var d = 0; d < n; d++) if (!diaPreenchido(m, d)) return d;
    return n - 1;
  }

  // ── Números do período (mesma conta de updateStats da página) ──
  function numeros() {
    var months = getPeriodMonths(), adm = 0, sai = 0, ob = 0, altas = 0, tra = 0, dc = 0, dd = 0, exist = 0, dias = 0, m48 = 0, diasDC = 0;
    months.forEach(function (m) {
      var n = getDaysInMonth(m); dias += n;
      for (var d = 0; d < n; d++) {
        adm += resolveValue('admitidos', d, m); sai += resolveValue('saidos', d, m);
        ob += resolveValue('menos_48', d, m) + resolveValue('mais_48', d, m); m48 += resolveValue('menos_48', d, m);
        var vdc = raw(m, 'dia_cama', d); if (vdc != null && !isNaN(vdc)) diasDC++;
        altas += resolveValue('altas', d, m); tra += resolveValue('transferidos_sai', d, m);
        dc += resolveValue('dia_cama', d, m); dd += resolveValue('dia_doente', d, m); exist += resolveValue('existindo', d, m);
      }
    });
    var ini = getExistencia(0, months[0]);
    var den = dc > 0 ? dc : dias * getCapacity(), num = dd > 0 ? dd : exist;
    return { months: months, ini: ini, adm: adm, sai: sai, ob: ob, altas: altas, tra: tra, dc: dc, dd: dd,
      ficam: Math.max(0, ini + adm - sai), ocup: den > 0 ? Math.min(100, Math.round(num / den * 100)) : 0,
      demora: sai ? (num / sai) : null, mort: sai ? ob / sai * 100 : null, m48: m48,
      ind: window.ZeloMovAuto && window.ZeloMovAuto.indicadores ? window.ZeloMovAuto.indicadores({ dc: den, dd: num, dias: diasDC || dias, saidos: sai, obitos: ob, ob48: m48 }) : null };
  }
  function f1(v) { return v == null ? '—' : v.toLocaleString('pt-PT', { maximumFractionDigits: 1 }); }

  function faixa(N) {
    var mensal = currentView === 'mensal', m = currentMonth, n = getDaysInMonth(m);
    var feitos = 0; if (mensal) for (var d = 0; d < n; d++) if (diaPreenchido(m, d)) feitos++;
    var p = m.split('-');
    var titulo = mensal ? MESES[+p[1] - 1] + ' ' + p[0] : getPeriodLabel();
    var sub = mensal ? feitos + ' de ' + n + ' dias registados' : getPeriodDateRange();
    var V = [['mensal', 'Mensal'], ['trimestral', 'Trimestral'], ['semestral', 'Semestral'], ['anual', 'Anual']];
    return '<div class="m2-faixa"><div class="m2-f1">' +
      '<div class="m2-mes"><button type="button" data-m2="ant" title="Período anterior" aria-label="Período anterior">‹</button><div><b>' + esc(titulo) + '</b><span>' + esc(sub) + '</span></div><button type="button" data-m2="seg" title="Período seguinte" aria-label="Período seguinte">›</button></div>' +
      (mensal ? '<label class="m2-camas">Camas <input type="text" inputmode="numeric" id="m2Camas" value="' + getCapacity() + '" title="Camas disponíveis no serviço (para a taxa de ocupação)"></label>' : '') +
      '<div class="m2-seg">' + V.map(function (v) { return '<button type="button" data-m2v="' + v[0] + '" class="' + (currentView === v[0] ? 'on' : '') + '">' + v[1] + '</button>'; }).join('') + '</div></div>' +
      '<div class="m2-nums">' +
      '<div class="m2-num"><b>' + N.ini + '</b><span>Existência anterior</span></div>' +
      '<div class="m2-num e"><b>' + N.adm + '</b><span>Admitidos</span></div>' +
      '<div class="m2-num s"><b>' + N.sai + '</b><span>Saídos</span></div>' +
      '<div class="m2-num o"><b>' + N.ob + '</b><span>Óbitos</span></div>' +
      '<div class="m2-num"><b>' + N.ficam + '</b><span>Ficam existindo</span></div>' +
      '<div class="m2-num p"><b>' + N.ocup + '%</b><span>Taxa de ocupação</span></div>' +
      '<div class="m2-num"><b>' + f1(N.demora) + '</b><span>Demora média (dias)</span></div></div></div>';
  }
  function acoes() {
    var m = currentMonth, ex = exigidos(m), falta = [];
    if (currentView === 'mensal') for (var d = 0; d < ex; d++) if (!diaPreenchido(m, d)) falta.push(d + 1);
    var txt = !ex || currentView !== 'mensal' ? '' : falta.length ? '⚠ ' + (falta.length === 1 ? 'Falta o dia ' + falta[0] : falta.length + ' dias em falta: ' + intervalos(falta)) : '✓ Todos os dias até ontem registados';
    return '<div class="m2-acoes">' +
      (currentView === 'mensal' && m === hojeMes() ? '<button type="button" class="m2-b p" data-m2="hoje">＋ Registar o dia de hoje</button>' : '') +
      '<button type="button" class="m2-b o" data-m2="pdf">Relatório PDF</button>' +
      '<button type="button" class="m2-b o" data-m2="csv">Exportar</button>' +
      (txt ? '<span class="m2-falta' + (falta.length ? '' : ' ok') + '"' + (falta.length ? ' data-m2d="' + (falta[0] - 1) + '" style="cursor:pointer" title="Abrir o primeiro dia em falta"' : '') + '>' + esc(txt) + '</span>' : '') + '</div>';
  }
  function intervalos(l) { var o = [], i = 0; while (i < l.length) { var j = i; while (j + 1 < l.length && l[j + 1] === l[j] + 1) j++; o.push(j > i ? l[i] + '–' + l[j] : String(l[i])); i = j + 1; } return o.join(', '); }

  function fita() {
    var m = currentMonth, n = getDaysInMonth(m), p = m.split('-'), ex = exigidos(m), h = '';
    var hj = m === hojeMes() ? new Date().getDate() - 1 : -1;
    for (var d = 0; d < n; d++) {
      var w = new Date(+p[0], +p[1] - 1, d + 1).getDay();
      var cls = diaPreenchido(m, d) ? 'ok' : d < ex ? 'fa' : (hj >= 0 && d > hj) || m > hojeMes() ? 'fut' : '';
      h += '<button type="button" class="m2-d ' + cls + (d === dia ? ' on' : '') + (d === hj ? ' hj' : '') + '" data-m2d="' + d + '">' + (d + 1) + '<small>' + SEM[w] + '</small></button>';
    }
    var vazio = (new Date(+p[0], +p[1] - 1, 1).getDay() + 6) % 7, pre = '';
    for (var v = 0; v < vazio; v++) pre += '<span></span>';
    return '<div id="m2Cal"><div class="m2-semcab"><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span><span>Dom</span></div><div class="m2-dias" id="m2Dias">' + pre + h + '</div><div class="m2-leg"><span><i style="background:#A7F3D0"></i>Registado</span><span><i style="background:#FDE68A"></i>Em falta</span><span><i style="background:#1E3A5F"></i>Aberto</span></div></div>';
  }
  // Camas fora de uso num dia (avaria, obras, isolamento…): os dias de cama
  // automáticos descem esse número nesse dia.
  var MOTIVOS = ['Avaria', 'Obras / manutenção', 'Isolamento', 'Limpeza / desinfeção', 'Outro'];
  function foraUsoHtml(m, d) {
    var fu = ((data.__camasForaUso || {})[m] || {})[d + 1] || 0, mo = ((data.__camasForaUsoMotivo || {})[m] || {})[d + 1] || '';
    return '<div class="m2-fu"><div class="m2-cp"><label>Camas fora de uso neste dia</label><div class="m2-st" data-st="fu"><button type="button" data-m2fu="-1" aria-label="Menos">−</button>' +
      '<input type="text" inputmode="numeric" data-m2fuv value="' + (fu || '') + '" placeholder="0" aria-label="Camas fora de uso"><button type="button" data-m2fu="1" aria-label="Mais">+</button></div></div>' +
      '<div class="m2-cp"><label>Motivo</label><select data-m2fum class="m2-sel"><option value="">—</option>' + MOTIVOS.map(function (x) { return '<option' + (x === mo ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="m2-funota">Estas camas não contam nos dias de cama deste dia.</div>';
  }
  function guardarForaUso(n, motivo) {
    var m = currentMonth, k = String(dia + 1);
    data.__camasForaUso = data.__camasForaUso || {}; data.__camasForaUso[m] = data.__camasForaUso[m] || {};
    if (n != null) data.__camasForaUso[m][k] = Math.max(0, Math.min(getCapacity(), parseInt(n, 10) || 0));
    if (motivo != null) { data.__camasForaUsoMotivo = data.__camasForaUsoMotivo || {}; data.__camasForaUsoMotivo[m] = data.__camasForaUsoMotivo[m] || {}; data.__camasForaUsoMotivo[m][k] = motivo; }
    persistData();
    if (window.ZeloMovAuto && window.ZeloMovAuto.recalcular) window.ZeloMovAuto.recalcular();
    var ok = $('m2Ok'); if (ok) { ok.classList.add('on'); clearTimeout(tOk); tOk = setTimeout(function () { ok.classList.remove('on'); }, 1500); }
  }
  // Mês preenchido automaticamente a partir do Controlo de Pacientes (zelo_mov_auto.js)
  function autoMes() { return !!(window.ZeloMovAuto && window.ZeloMovAuto.mesAuto && window.ZeloMovAuto.mesAuto(currentMonth)); }
  function formDia() {
    var m = currentMonth, d = dia, p = m.split('-'), au = autoMes();
    var w = new Date(+p[0], +p[1] - 1, d + 1).getDay();
    var base = isBaselineCell(d, m);
    var h = '<div class="m2-diah"><b>' + SEM_LONGO[w] + ', ' + (d + 1) + ' de ' + MESES[+p[1] - 1].toLowerCase() + '</b>' +
      (base ? '<span>· 1º dia: escreva quantos doentes estavam internados (existência anterior)</span>' : '') + '</div>' +
      (au ? '<div class="m2-autonota">⟳ Calculado automaticamente a partir do Controlo de Pacientes — para corrigir, corrija o registo do doente lá.</div>' : '');
    h += '<div class="m2-flux" id="m2Flux"></div><div class="m2-grps">';
    GRUPOS.forEach(function (g) {
      h += '<div class="m2-grp ' + g[0] + '"><h4>' + (g[0] === 'e' ? '↘ ' : g[0] === 's' ? '↗ ' : '') + g[1] + '</h4><div class="m2-campos">';
      g[2].forEach(function (c) {
        var v = raw(m, c[0], d);
        h += '<div class="m2-cp"><label title="' + esc(c[1]) + '">' + esc(c[1]) + '</label><div class="m2-st' + (au ? ' auto' : '') + '" data-st="' + c[0] + '">' + (au ? '' : '<button type="button" data-m2menos="' + c[0] + '" aria-label="Menos">−</button>') +
          '<input type="text" inputmode="numeric" autocomplete="off" data-m2c="' + c[0] + '" value="' + (v == null || isNaN(v) ? '' : v) + '" placeholder="0" aria-label="' + esc(c[1]) + '"' + (au ? ' readonly tabindex="-1"' : '') + '>' + (au ? '' : '<button type="button" data-m2mais="' + c[0] + '" aria-label="Mais">+</button>') + '</div></div>';
      });
      h += '</div>' + (g[0] === 'c' ? (au ? foraUsoHtml(m, d) : '') + '<div class="m2-dica" id="m2Dica"></div><div id="m2AvisoC"></div>' : '') + '</div>';
    });
    h += '</div>';
    var n = getDaysInMonth(m);
    h += '<div class="m2-guard"><span class="m2-ok" id="m2Ok">✓ Guardado</span>' +
      '<button type="button" class="m2-b o" data-m2="diaAnt"' + (d === 0 ? ' disabled' : '') + '>‹ Dia ' + (d === 0 ? '' : d) + '</button>' +
      (au ? '' : d < n - 1 ? '<button type="button" class="m2-b o m2-gd" data-m2="guardar">✓ Guardar</button>' : '') +
      (au ? (d < n - 1 ? '<button type="button" class="m2-b p" data-m2="diaSeg">Dia ' + (d + 2) + ' ›</button>' : '') : d < n - 1 ? '<button type="button" class="m2-b p" data-m2="diaSeg">✓ Guardar e ir para o dia ' + (d + 2) + '</button>' : '<button type="button" class="m2-b p" data-m2="fim">✓ Guardar — último dia do mês</button>') + '</div>';
    return h;
  }
  // Partes que mudam enquanto se escreve (sem redesenhar os campos).
  function vivo() {
    if (!raiz || currentView !== 'mensal') return;
    var m = currentMonth, d = dia, fl = $('m2Flux'); if (!fl) return;
    var ex = getExistencia(d, m), en = resolveValue('admitidos', d, m), sa = resolveValue('saidos', d, m), fi = getExistindo(d, m);
    var base = isBaselineCell(d, m); // existência anterior: sempre escrita à mão
    fl.innerHTML = '<div class="m2-fx">' + (base ? '<input type="text" inputmode="numeric" id="m2Base" value="' + ex + '" title="Existência anterior (doentes internados no início)">' : '<b>' + ex + '</b>') + '<span>Existência</span></div><span class="m2-op">+</span>' +
      '<div class="m2-fx e"><b>' + en + '</b><span>Entradas</span></div><span class="m2-op">−</span>' +
      '<div class="m2-fx s"><b>' + sa + '</b><span>Saídas</span></div><span class="m2-op">=</span>' +
      '<div class="m2-fx f"><b>' + fi + '</b><span>Ficam</span></div>';
    var dc = raw(m, 'dia_cama', d), dd = raw(m, 'dia_doente', d), cap = getCapacity(), dica = $('m2Dica'), av = $('m2AvisoC');
    if (dica) dica.innerHTML = autoMes() ? '' : (dc == null ? '<button type="button" data-m2fill="dia_cama" data-v="' + cap + '">Dias de cama = ' + cap + ' camas</button>' : '') +
      (dd == null || dd !== fi ? '<button type="button" data-m2fill="dia_doente" data-v="' + fi + '">Dias-doente = ' + fi + ' (ficam)</button>' : '');
    var erro = dc != null && dd != null && dd > dc;
    var st = raiz.querySelector('[data-st="dia_doente"]'); if (st) st.classList.toggle('x', erro);
    if (av) av.innerHTML = erro ? '<div class="m2-aviso">Dias-doente (' + dd + ') maior que dias de cama (' + dc + '): verifique os valores.</div>' : '';
  }

  // ── Resumo do período (por baixo do mapa, de lado a lado; sem gráficos) ──
  function resumo(N) {
    var A = window.ZeloMovAuto, h = '<div class="m2-ind">';
    h += '<div class="m2-k"><span>Altas</span><b>' + N.altas + '</b><small>' + (N.sai ? Math.round(N.altas / N.sai * 100) + '% das saídas · ' : '') + N.ob + (N.ob === 1 ? ' óbito' : ' óbitos') + ' · ' + N.tra + ' transferido(s)</small></div>';
    // Indicadores (zelo_mov_auto.js — as mesmas fórmulas do Movimento Geral)
    if (N.ind && A && A.INDICADORES) h += A.INDICADORES.map(function (x) {
      return '<div class="m2-k"><span>' + x[1] + '</span><b>' + A.fmtInd(N.ind[x[0]], x[2]) + (x[2] === ' dias' && N.ind[x[0]] != null ? '<i> dias</i>' : '') + '</b><small>' + x[3] + '</small></div>';
    }).join('');
    return h + '</div>';
  }
  function linha(vals, n, cap) {
    var W = 520, H = 150, x0 = 30, y0 = 128, max = Math.max(cap, 1, Math.max.apply(null, vals.concat([0])));
    var X = function (i) { return x0 + (W - x0 - 10) * (n > 1 ? i / (n - 1) : 0); }, Y = function (v) { return y0 - (y0 - 16) * v / max; };
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="Doentes internados por dia">';
    [0, 0.5, 1].forEach(function (f) { var y = Y(max * f); s += '<line x1="' + x0 + '" y1="' + y + '" x2="' + (W - 6) + '" y2="' + y + '" stroke="#EEF2F7"/><text x="' + (x0 - 5) + '" y="' + (y + 4) + '" font-size="10" fill="#94A3B8" text-anchor="end">' + Math.round(max * f) + '</text>'; });
    s += '<line x1="' + x0 + '" y1="' + Y(cap) + '" x2="' + (W - 6) + '" y2="' + Y(cap) + '" stroke="#DC2626" stroke-dasharray="4 4"/><text x="' + (W - 8) + '" y="' + (Y(cap) - 4) + '" font-size="10" fill="#DC2626" text-anchor="end">lotação ' + cap + '</text>';
    if (vals.length) {
      var pts = vals.map(function (v, i) { return X(i) + ' ' + Y(v); });
      s += '<path d="M' + pts.join(' L') + ' L' + X(vals.length - 1) + ' ' + y0 + ' L' + x0 + ' ' + y0 + 'Z" fill="#1E3A5F" opacity=".08"/>' +
        '<path d="M' + pts.join(' L') + '" fill="none" stroke="#1E3A5F" stroke-width="2.4" stroke-linejoin="round"/>' +
        '<circle cx="' + X(vals.length - 1) + '" cy="' + Y(vals[vals.length - 1]) + '" r="4" fill="#1E3A5F"><title>Dia ' + vals.length + ': ' + vals[vals.length - 1] + '</title></circle>';
    }
    [1, Math.ceil(n / 3), Math.ceil(2 * n / 3), n].forEach(function (d) { s += '<text x="' + X(d - 1) + '" y="' + (H - 4) + '" font-size="10" fill="#94A3B8" text-anchor="middle">' + d + '</text>'; });
    return s + '</svg>';
  }
  function barras(cats, v) {
    var W = 520, H = 130, y0 = 104, max = 1; v.forEach(function (p) { max = Math.max(max, p[0], p[1]); });
    var passo = (W - 20) / cats.length, bl = Math.min(30, passo / 3);
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%"><line x1="10" y1="' + y0 + '" x2="' + (W - 10) + '" y2="' + y0 + '" stroke="#CBD5E1"/>';
    cats.forEach(function (c, i) {
      var xc = 10 + passo * i + passo / 2;
      [0, 1].forEach(function (k) { var hh = 86 * v[i][k] / max; s += '<rect x="' + (xc - bl + k * bl + 1) + '" y="' + (y0 - hh) + '" width="' + (bl - 2) + '" height="' + hh + '" rx="4" fill="' + (k ? '#7C3AED' : '#0891B2') + '"><title>' + (k ? 'Saídas' : 'Entradas') + ': ' + v[i][k] + '</title></rect>'; if (v[i][k]) s += '<text x="' + (xc - bl / 2 + k * bl) + '" y="' + (y0 - hh - 3) + '" font-size="9.5" fill="#64748B" text-anchor="middle">' + v[i][k] + '</text>'; });
      s += '<text x="' + xc + '" y="' + (H - 8) + '" font-size="10" fill="#64748B" text-anchor="middle">' + c + '</text>';
    });
    return s + '</svg><div class="m2-leg"><span><i style="background:#0891B2"></i>Entradas</span><span><i style="background:#7C3AED"></i>Saídas</span></div>';
  }
  // ── Gráficos (no fim da página, de lado a lado) ──
  function graficos(N) {
    var h = '';
    if (currentView === 'mensal') {
      var m = currentMonth, n = getDaysInMonth(m), ex = exigidos(m), vals = [], ultimo = -1;
      for (var d = 0; d < n; d++) { vals.push(getExistindo(d, m)); if (diaPreenchido(m, d)) ultimo = d; }
      h += '<div class="m2-card"><div class="m2-cb"><div class="m2-tt">Doentes internados por dia</div>' + linha(vals.slice(0, Math.max(ultimo + 1, Math.min(ex, n), 1)), n, getCapacity()) + '</div></div>';
      var sem = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]];
      for (var e = 0; e < n; e++) { var k = Math.min(4, Math.floor(e / 7)); sem[k][0] += resolveValue('admitidos', e, m); sem[k][1] += resolveValue('saidos', e, m); }
      if (n <= 28) sem.pop();
      h += '<div class="m2-card"><div class="m2-cb"><div class="m2-tt">Entradas e saídas por semana</div>' + barras(sem.map(function (s, i) { return 'Sem. ' + (i + 1); }), sem) + '</div></div>';
    } else {
      var cats = N.months.map(function (x) { return MES3[+x.split('-')[1] - 1]; });
      var v = N.months.map(function (x) { return [sumCategoryInMonth('admitidos', x), sumCategoryInMonth('saidos', x)]; });
      h += '<div class="m2-card"><div class="m2-cb"><div class="m2-tt">Entradas e saídas por mês</div>' + barras(cats, v) + '</div></div>';
    }
    var t = N.altas + N.tra + N.ob || 1;
    h += '<div class="m2-card"><div class="m2-cb"><div class="m2-tt">Como saíram</div><div class="m2-sai"><div style="width:' + (N.altas / t * 100) + '%;background:#059669"></div><div style="width:' + (N.tra / t * 100) + '%;background:#7C3AED"></div><div style="width:' + (N.ob / t * 100) + '%;background:#0F172A"></div></div>' +
      '<div class="m2-leg"><span><i style="background:#059669"></i>Altas ' + N.altas + '</span><span><i style="background:#7C3AED"></i>Transferidos ' + N.tra + '</span><span><i style="background:#0F172A"></i>Óbitos ' + N.ob + '</span></div></div></div>';
    return '<div class="m2-grafs">' + h + '</div>';
  }
  // Telemóvel: lista de dias em vez da tabela a deslizar para o lado.
  function listaDias() {
    if (currentView !== 'mensal') return '';
    var m = currentMonth, n = getDaysInMonth(m), ex = exigidos(m), p = m.split('-'), h = '';
    for (var d = n - 1; d >= 0; d--) {
      var ok = diaPreenchido(m, d), w = new Date(+p[0], +p[1] - 1, d + 1).getDay();
      if (!ok && d >= ex) continue;
      h += '<div class="ln' + (ok ? '' : ' fa') + '" data-m2d="' + d + '"><b>' + (d + 1) + '</b>' + SEM[w] + '<span class="t">' +
        (ok ? '<span class="tg e">+' + resolveValue('admitidos', d, m) + '</span><span class="tg s">−' + resolveValue('saidos', d, m) + '</span><span class="tg f">' + getExistindo(d, m) + '</span>' : 'Em falta — registar') + '</span></div>';
    }
    return h ? '<div class="m2-card m2-lista">' + h + '</div>' : '';
  }

  // ── Montagem ──
  function desenhar() {
    if (!pronto()) return;
    if (!raiz) montar();
    if (!raiz) return;
    var mensal = currentView === 'mensal';
    if (mensal) { loadMonth(currentMonth); if (dia == null || dia >= getDaysInMonth(currentMonth) || raiz.dataset.mes !== currentMonth) dia = diaInicial(); }
    raiz.dataset.mes = currentMonth;
    var ativo = document.activeElement, idAtivo = ativo && ativo.dataset && ativo.dataset.m2c, pos = ativo && ativo.selectionStart;
    var N = numeros();
    raiz.innerHTML = faixa(N) + acoes() +
      (mensal ? '<div class="m2-g2 m2-g2d">' +
        '<div class="m2-card m2-cal-card"><div class="m2-ch"><i>1</i>Dias do mês<small>toque num dia para o abrir</small></div><div class="m2-cb">' + fita() + '</div></div>' +
        '<div class="m2-card"><div class="m2-ch"><i>2</i>Registo do dia<small>escolha o dia acima</small></div><div class="m2-cb">' + formDia() + '</div></div></div>' : '') +
      '<div class="m2-mapa-h"><i>' + (mensal ? 3 : 1) + '</i>' + (mensal ? 'Mapa do mês' : 'Somatório do período') + '<small>' + (mensal ? 'igual ao PDF · clique no número de um dia para o abrir' : 'por mês') + '</small><button type="button" data-m2="tabela">' + (document.body.classList.contains('m2-sem-tabela') ? 'Ver tabela completa' : 'Ver lista de dias') + '</button></div>' + listaDias();
    desenharResumo(N);
    vivo();
    marcarColuna();
    if (idAtivo) { var el = raiz.querySelector('[data-m2c="' + idAtivo + '"]'); if (el) { el.focus(); try { el.setSelectionRange(pos, pos); } catch (e) {} } }
  }
  // Resumo por baixo do Mapa do mês (a tabela da própria página), de lado a lado.
  function desenharResumo(N) {
    var ts = document.querySelector('.table-section'); if (!ts) return;
    var el = $('m2Resumo');
    if (!el) { el = document.createElement('div'); el.id = 'm2Resumo'; ts.parentNode.insertBefore(el, ts.nextSibling); }
    var mensal = currentView === 'mensal';
    el.innerHTML = '<div class="m2-mapa-h"><i>' + (mensal ? 4 : 2) + '</i>Resumo ' + (mensal ? 'do mês' : 'do período') + '<small>' + esc(mensal ? MESES[+currentMonth.split('-')[1] - 1] + ' ' + currentMonth.split('-')[0] : getPeriodLabel()) + '</small></div>' +
      '<div class="m2-card"><div class="m2-cb">' + resumo(N || numeros()) + '</div></div>' +
      '<div class="m2-mapa-h"><i>' + (mensal ? 5 : 3) + '</i>Gráficos<small>' + esc(mensal ? 'do mês' : 'do período') + '</small></div>' + graficos(N || numeros());
  }
  function marcarColuna() {
    var t = $('dataTable'); if (!t) return;
    Array.prototype.forEach.call(t.querySelectorAll('.m2-col-on'), function (c) { c.classList.remove('m2-col-on'); });
    if (currentView !== 'mensal' || dia == null) return;
    Array.prototype.forEach.call(t.rows, function (r) { var c = r.cells[dia + 1]; if (c) c.classList.add('m2-col-on'); });
  }
  function montar() {
    var cont = document.querySelector('.container'); var ts = document.querySelector('.table-section');
    if (!cont || !ts) return;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    raiz = document.createElement('div'); raiz.className = 'm2'; raiz.id = 'm2';
    ts.parentNode.insertBefore(raiz, ts);
    if (window.innerWidth <= 700) document.body.classList.add('m2-sem-tabela');
    raiz.addEventListener('click', clique);
    raiz.addEventListener('input', escrever);
    raiz.addEventListener('change', mudar);
    raiz.addEventListener('keydown', function (e) {
      var c = e.target.dataset && e.target.dataset.m2c;
      if (c && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) { e.preventDefault(); passo(c, e.key === 'ArrowUp' ? 1 : -1); }
      if (c && e.key === 'Enter') { e.preventDefault(); var l = Array.prototype.slice.call(raiz.querySelectorAll('[data-m2c]')), i = l.indexOf(e.target); if (l[i + 1]) l[i + 1].focus(); else irPara(dia + 1); }
    });
    // Mapa do mês: clicar no número de um dia abre esse dia.
    ts.addEventListener('click', function (e) {
      var th = e.target.closest && e.target.closest('#dataTable tr:first-child th');
      if (!th || currentView !== 'mensal') return;
      var n = parseInt(th.textContent, 10); if (n >= 1 && n <= getDaysInMonth(currentMonth)) { irPara(n - 1); raiz.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  }
  function guardarValor(id, v) {
    if (autoMes()) return; // calculado a partir do Controlo de Pacientes
    var m = currentMonth; loadMonth(m);
    data[m][id][dia] = v === '' || v == null ? null : Math.max(0, parseInt(v, 10) || 0);
    persistData();
    // A própria página redesenha a grelha e os totais (e a nossa camada, via updateStats).
    emCurso = true; try { renderTable(); updateStats(); } finally { emCurso = false; }
    vivoTudo();
    var ok = $('m2Ok'); if (ok) { ok.classList.add('on'); clearTimeout(tOk); tOk = setTimeout(function () { ok.classList.remove('on'); }, 1500); }
  }
  // «Guardar»: grava todos os campos do dia à vista e fica no mesmo dia.
  function guardarDia() {
    if (autoMes() || !raiz) return;
    clearTimeout(tEsc);
    var m = currentMonth; loadMonth(m);
    // Campo a campo (cada alteração é uma gravação): esvaziar vários campos do
    // dia também chega aos outros computadores (a proteção contra apagar em
    // massa só trava vários valores esvaziados numa MESMA gravação).
    Array.prototype.forEach.call(raiz.querySelectorAll('[data-m2c]'), function (inp) {
      var id = inp.dataset.m2c, v = inp.value; if (!data[m][id]) return;
      var novo = v === '' || v == null ? null : Math.max(0, parseInt(v, 10) || 0), velho = data[m][id][dia];
      if ((velho == null || velho === '' ? null : Number(velho)) === novo) return;
      data[m][id][dia] = novo; persistData();
    });
    emCurso = true; try { renderTable(); updateStats(); } finally { emCurso = false; }
    vivoTudo();
    var ok = $('m2Ok'); if (ok) { ok.textContent = '✓ Dia ' + (dia + 1) + ' guardado'; ok.classList.add('on'); clearTimeout(tOk); tOk = setTimeout(function () { ok.classList.remove('on'); ok.textContent = '✓ Guardado'; }, 2500); }
  }
  // Atualiza faixa, fita, resumo e lista sem mexer nos campos em edição.
  function vivoTudo() {
    var N = numeros(), tmp = document.createElement('div');
    tmp.innerHTML = faixa(N); var fx = raiz.querySelector('.m2-faixa'); if (fx) fx.replaceWith(tmp.firstChild);
    tmp.innerHTML = acoes(); var ac = raiz.querySelector('.m2-acoes'); if (ac) ac.replaceWith(tmp.firstChild);
    var cal = $('m2Cal'); if (cal) { tmp.innerHTML = fita(); cal.replaceWith(tmp.firstChild); }
    desenharResumo(N);
    var li = raiz.querySelector('.m2-lista'); if (li) { tmp.innerHTML = listaDias(); if (tmp.firstChild) li.replaceWith(tmp.firstChild); }
    vivo(); marcarColuna();
  }
  function passo(id, k) {
    var inp = raiz.querySelector('[data-m2c="' + id + '"]'); if (!inp) return;
    var v = Math.max(0, (parseInt(inp.value, 10) || 0) + k); inp.value = v; guardarValor(id, v);
  }
  var tEsc = null;
  function escrever(e) {
    var el = e.target;
    if (el.dataset && el.dataset.m2c) {
      var v = el.value.replace(/\D/g, '').slice(0, 4); if (v !== el.value) el.value = v;
      clearTimeout(tEsc); var id = el.dataset.m2c; tEsc = setTimeout(function () { guardarValor(id, v); }, 350);
    } else if (el.id === 'm2Base' || el.id === 'm2Camas') { var w = el.value.replace(/\D/g, '').slice(0, 4); if (w !== el.value) el.value = w; }
  }
  function mudar(e) {
    var el = e.target;
    if (el.dataset && el.dataset.m2c) { clearTimeout(tEsc); guardarValor(el.dataset.m2c, el.value); }
    else if (el.id === 'm2Base') { setBaseline(currentMonth, el.value); vivoTudo(); }
    else if (el.dataset && el.dataset.m2fuv != null) { guardarForaUso(el.value.replace(/\D/g, ''), null); }
    else if (el.dataset && el.dataset.m2fum != null) { guardarForaUso(null, el.value); }
    else if (el.id === 'm2Camas') { updateCapacity(el.value); var ci = $('capacityInput'); if (ci) ci.value = getCapacity(); }
  }
  function irPara(d) {
    var n = getDaysInMonth(currentMonth); if (d < 0 || d >= n) return;
    var ativo = document.activeElement; if (ativo && ativo.dataset && ativo.dataset.m2c) { clearTimeout(tEsc); guardarValor(ativo.dataset.m2c, ativo.value); }
    dia = d; desenhar();
    var prim = raiz.querySelector('[data-m2c]'); if (prim && window.innerWidth > 700) prim.focus();
  }
  function clique(e) {
    var t = e.target.closest('button, [data-m2d]'); if (!t) return;
    if (t.dataset.m2fu) { var fi = raiz.querySelector('[data-m2fuv]'); var nv = Math.max(0, (parseInt(fi.value, 10) || 0) + (+t.dataset.m2fu)); fi.value = nv || ''; guardarForaUso(nv, null); return; }
    if (t.dataset.m2menos) { passo(t.dataset.m2menos, -1); return; }
    if (t.dataset.m2mais) { passo(t.dataset.m2mais, 1); return; }
    if (t.dataset.m2fill) { var inp = raiz.querySelector('[data-m2c="' + t.dataset.m2fill + '"]'); if (inp) inp.value = t.dataset.v; guardarValor(t.dataset.m2fill, t.dataset.v); return; }
    if (t.dataset.m2d != null && t.dataset.m2d !== '') { if (currentView !== 'mensal') return; irPara(+t.dataset.m2d); if (!t.classList.contains('m2-d')) raiz.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    if (t.dataset.m2v) { switchView(t.dataset.m2v); return; }
    switch (t.dataset.m2) {
      case 'ant': prevPeriod(); break;
      case 'seg': nextPeriod(); break;
      case 'hoje': irPara(new Date().getDate() - 1); break;
      case 'pdf': generateReportPDF(); break;
      case 'csv': exportCSV(); break;
      case 'diaAnt': irPara(dia - 1); break;
      case 'diaSeg': irPara(dia + 1); break;
      case 'guardar': guardarDia(); break;
      case 'fim': { var a = document.activeElement; if (a && a.dataset && a.dataset.m2c) guardarValor(a.dataset.m2c, a.value); break; }
      case 'tabela': document.body.classList.toggle('m2-sem-tabela'); t.textContent = document.body.classList.contains('m2-sem-tabela') ? 'Ver tabela completa' : 'Ver lista de dias'; break;
    }
  }

  // Redesenha sempre que a página atualiza os números (mudança de mês ou de
  // vista, dados vindos de outro computador, edição na grelha, …).
  var emCurso = false;
  function envolver() {
    var orig = window.updateStats;
    if (typeof orig !== 'function' || orig.__m2) return false;
    var novo = function () {
      var r = orig.apply(this, arguments);
      if (!emCurso) { try { var a = document.activeElement; if (raiz && a && raiz.contains(a) && a.dataset && a.dataset.m2c) vivoTudo(); else desenhar(); } catch (e) { console.warn('ZELO m2', e); } }
      return r;
    };
    novo.__m2 = true; window.updateStats = novo; return true;
  }
  var tent = 0, iv = setInterval(function () {
    tent++;
    if (pronto() && envolver()) { clearInterval(iv); desenhar(); }
    else if (tent > 120) clearInterval(iv);
  }, 250);
})();
