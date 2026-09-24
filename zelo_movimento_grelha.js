// ZELO — Movimento Hospitalar: grelha mensal ao estilo dos Procedimentos de
// Enfermagem. Partilhado pelas 9 páginas *_movimento.html.
//
// O que faz:
//  • Caixas de preenchimento com o mesmo aspeto dos Procedimentos.
//  • Editar uma caixa já não redesenha a tabela inteira: só os valores
//    calculados (Admitidos, Saídos, Ficam Existindo, totais…) são
//    atualizados. Assim o foco e o cursor ficam onde estão.
//  • Teclado estilo folha de cálculo: ↑ ↓ ← →, Enter / Shift+Enter,
//    Home / End, Ctrl+Home / Ctrl+End, Shift+setas (estender seleção),
//    Esc (limpar seleção), Ctrl+A (selecionar a grelha toda).
//  • Rato: arrastar ou Shift+clique seleciona um bloco de caixas.
//  • Ctrl+C / Ctrl+V de blocos (também de/para o Excel), Delete apaga o
//    bloco selecionado, Ctrl+Z desfaz e Ctrl+Y (ou Ctrl+Shift+Z) refaz.
//  • Barra "Selecionar" (como nos Procedimentos): caixas por linha,
//    Selecionar tudo / preenchidos, Copiar, Colar (noutro mês) e Eliminar.
//
// Usa as funções/variáveis globais da própria página (data, currentView,
// STRUCTURE, getPeriodMonths, loadMonth, resolveValue, getFieldMonthValue,
// sumCategoryInMonth, getDaysInMonth, persistData, updateStats, renderTable).
(function(){
  if (window.__zeloMovGrelha) return;
  window.__zeloMovGrelha = true;

  // ─────────────────────────── ESTILO ───────────────────────────
  var css = `
  .table-section{border:1px solid #E2E8F0;border-radius:12px;box-shadow:0 1px 3px rgba(15,23,42,.05);background:#fff;}
  .table-section .table-header{background:#fff;border-bottom:1px solid #E2E8F0;font-size:13px;font-weight:700;
    text-transform:uppercase;letter-spacing:1.2px;color:#334155;}
  .table-section .table-header svg{color:#3E5C87;}
  #dataTable th{background:#F8FAFC;color:#64748B;font-size:12px;font-weight:600;border-bottom:1px solid #E2E8F0;padding:9px 4px;}
  #dataTable td{padding:5px 3px;border-bottom:1px solid #EEF2F6;}
  /* "Dias do mês" fica fixo à esquerda, como a coluna dos nomes */
  #dataTable tr:first-child th:first-child{position:sticky;left:0;z-index:3;background:#F8FAFC;border-right:1px solid #E2E8F0;text-align:left;padding-left:14px;}
  html[data-zelo-theme="dark"] #dataTable tr:first-child th:first-child{background:#0F172A;}
  #dataTable tr:hover td:not(.label-col){background:#FAFBFD;}
  #dataTable .label-col{background:#fff;font-size:14.5px;font-weight:500;color:#1E293B;border-right:1px solid #E2E8F0;
    min-width:230px;user-select:none;}
  #dataTable td.label-col{padding:9px 14px;}
  #dataTable .parent-row .label-col{background:#EEF3F9;color:#2B415E;font-weight:700;}
  #dataTable .child-row .label-col{background:#fff;padding-left:32px;}
  #dataTable .deep-row .label-col,#dataTable .child-row.deep .label-col{background:#fff;padding-left:50px;color:#475569;}
  #dataTable .cell-input{width:54px;height:34px;padding:4px 2px;background:#fff;border:1px solid #E2E8F0;border-radius:4px;
    color:#0F172A;font-family:'IBM Plex Mono',ui-monospace,SFMono-Regular,Menlo,monospace;font-size:15px;text-align:center;
    -moz-appearance:textfield;transition:border-color .12s,box-shadow .12s;}
  #dataTable .cell-input::-webkit-outer-spin-button,#dataTable .cell-input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}
  #dataTable .cell-input:hover{border-color:#CBD5E1;}
  #dataTable .cell-input:focus{outline:none;border-color:#3E5C87;background:#fff;box-shadow:0 0 0 2px rgba(62,92,135,.16);}
  #dataTable .cell-input.cell-selected{background:#E9EEF4 !important;border-color:#3E5C87 !important;box-shadow:inset 0 0 0 1px #3E5C87;}
  #dataTable input.baseline-input{border-color:#f59e0b;background:#fffbeb;}
  #dataTable .readonly,#dataTable .auto-value{min-width:40px;box-sizing:border-box;padding:6px 5px;border-radius:6px;font-size:14px;
    font-family:'IBM Plex Mono',ui-monospace,SFMono-Regular,Menlo,monospace;}
  #dataTable .readonly{background:#F1F5F9;border:1px solid #E2E8F0;color:#475569;font-weight:500;}
  #dataTable .auto-value{background:#E9EEF4;border:1px solid #B9C6D9;color:#3E5C87;font-weight:600;}
  #dataTable td[data-total]{font-family:'IBM Plex Mono',ui-monospace,monospace;color:#3E5C87;}

  /* Barra "Selecionar" — igual aos Procedimentos de Enfermagem */
  .mov-sel-toolbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:10px 14px;padding:8px 12px;
    background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;transition:background .15s,border-color .15s;}
  .mov-sel-toolbar.has-selection{background:#E9EEF4;border-color:#B9C6D9;}
  .mov-sel-toolbar .mov-sel-only{display:none;}
  .table-section.mov-sel-mode .mov-sel-toolbar .mov-sel-only{display:inline-flex;}
  .mov-sel-all{align-items:center;gap:6px;font-size:12px;font-weight:700;color:#1E293B;cursor:pointer;}
  .mov-sel-count{color:#64748B;font-weight:700;background:#fff;border:1px solid #E2E8F0;border-radius:100px;padding:2px 9px;font-size:11.5px;}
  .mov-sel-toolbar.has-selection .mov-sel-count{color:#3E5C87;border-color:#B9C6D9;}
  .mov-btn-sel{background:#fff;border:1px solid #E2E8F0;color:#1E293B;font-size:11.5px;font-weight:700;text-transform:uppercase;
    letter-spacing:.4px;padding:6px 12px;border-radius:6px;cursor:pointer;display:inline-flex;align-items:center;gap:5px;font-family:inherit;}
  .mov-btn-sel:hover{border-color:#3E5C87;color:#3E5C87;}
  .mov-btn-sel.danger:hover{border-color:#c0392b;color:#c0392b;}
  .mov-btn-sel[disabled]{opacity:.45;cursor:default;pointer-events:none;}
  .mov-sel-hint{margin-left:auto;font-size:11.5px;color:#64748B;}
  .mov-row-chk,.mov-sel-all-chk{width:18px;height:18px;accent-color:#3E5C87;cursor:pointer;vertical-align:-3px;}
  .mov-row-chk{display:none;margin:0 10px 0 0;}
  .table-section.mov-sel-mode .mov-row-chk{display:inline-block;}
  .table-section.mov-sel-mode tr:has(.mov-row-chk:checked) .label-col{background:#E9EEF4;}
  .table-section.mov-sel-mode tr:has(.mov-row-chk:checked) .cell-input{border-color:#B9C6D9;}

  /* Barra de deslocamento horizontal (os dias do mês) */
  .table-section .table-wrapper{scrollbar-width:auto;scrollbar-color:#9FB2CC #EEF2F6;}
  .table-section .table-wrapper::-webkit-scrollbar,.mov-scroll-top-track::-webkit-scrollbar{height:14px;}
  .table-section .table-wrapper::-webkit-scrollbar-track,.mov-scroll-top-track::-webkit-scrollbar-track{background:#EEF2F6;border-radius:100px;}
  .table-section .table-wrapper::-webkit-scrollbar-thumb,.mov-scroll-top-track::-webkit-scrollbar-thumb{background:#9FB2CC;border-radius:100px;border:3px solid #EEF2F6;}
  .table-section .table-wrapper::-webkit-scrollbar-thumb:hover,.mov-scroll-top-track::-webkit-scrollbar-thumb:hover{background:#3E5C87;}
  .table-section .table-wrapper::-webkit-scrollbar-thumb:active,.mov-scroll-top-track::-webkit-scrollbar-thumb:active{background:#2B415E;}
  .table-section .table-wrapper::-webkit-scrollbar-button,.mov-scroll-top-track::-webkit-scrollbar-button{display:none;width:0;height:0;}
  .mov-scroll-top{display:flex;align-items:center;gap:8px;margin:0 14px 8px;}
  .mov-scroll-top[hidden]{display:none;}
  .mov-scroll-top-track{flex:1;overflow-x:auto;overflow-y:hidden;height:16px;scrollbar-width:auto;scrollbar-color:#9FB2CC #EEF2F6;}
  .mov-scroll-top-inner{height:1px;}
  .mov-scroll-btn{flex-shrink:0;width:30px;height:30px;border-radius:50%;border:1px solid #E2E8F0;background:#fff;color:#3E5C87;
    display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .12s,border-color .12s;}
  .mov-scroll-btn:hover:not([disabled]){background:#E9EEF4;border-color:#3E5C87;}
  .mov-scroll-btn[disabled]{opacity:.35;cursor:default;}
  .mov-scroll-dias{flex-shrink:0;min-width:92px;text-align:center;font-size:12px;font-weight:700;color:#3E5C87;
    background:#E9EEF4;border:1px solid #B9C6D9;border-radius:100px;padding:4px 10px;font-family:'IBM Plex Mono',ui-monospace,monospace;}
  html[data-zelo-theme="dark"] .mov-scroll-btn{background:#0F172A;border-color:#334155;color:#BFD0E6;}
  html[data-zelo-theme="dark"] .mov-scroll-dias{background:#16233A;border-color:#334155;color:#BFD0E6;}

  /* Aviso rápido (toast) */
  #mov-toast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%) translateY(20px);opacity:0;z-index:2147483100;
    background:#1E293B;color:#fff;font-size:13.5px;font-weight:600;padding:10px 18px;border-radius:10px;
    box-shadow:0 10px 30px rgba(15,23,42,.3);transition:opacity .18s,transform .18s;pointer-events:none;max-width:90vw;text-align:center;}
  #mov-toast.show{opacity:1;transform:translateX(-50%) translateY(0);}

  html[data-zelo-theme="dark"] .table-section,html[data-zelo-theme="dark"] .table-section .table-header{background:#0F172A;border-color:#1E293B;color:#CBD5E1;}
  html[data-zelo-theme="dark"] #dataTable .label-col{background:#0F172A;color:#E2E8F0;}
  html[data-zelo-theme="dark"] #dataTable .parent-row .label-col{background:#16233A;color:#BFD0E6;}
  html[data-zelo-theme="dark"] #dataTable .cell-input.cell-selected{background:#1E3A5F !important;}
  html[data-zelo-theme="dark"] .mov-sel-toolbar{background:#111A2E;border-color:#1E293B;}
  html[data-zelo-theme="dark"] .mov-btn-sel{background:#0F172A;color:#E2E8F0;border-color:#334155;}
  `;
  var st = document.createElement('style');
  st.id = 'zelo-movimento-grelha-style';
  st.textContent = css;
  document.head.appendChild(st);

  // ─────────────────────────── UTILITÁRIOS ───────────────────────────
  function tabela(){ return document.getElementById('dataTable'); }
  function mensal(){ return typeof currentView !== 'undefined' && currentView === 'mensal'; }
  function mesAtual(){ return getPeriodMonths()[0]; }
  function ehCelula(el){ return !!(el && el.classList && el.classList.contains('cell-input') && tabela() && tabela().contains(el)); }
  function nomeMes(m){ var p = m.split('-'); return (window.MONTHS_NAMES || [])[parseInt(p[1],10)-1] + ' ' + p[0]; }

  var toastTimer = null;
  function toast(msg){
    var t = document.getElementById('mov-toast');
    if (!t){ t = document.createElement('div'); t.id = 'mov-toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function(){ t.classList.remove('show'); }, 2600);
  }

  // Valor guardado de uma caixa (id + dia + mês); '__baseline' é a
  // Existência Anterior de partida (só no 1.º dia do histórico).
  function lerValor(id, day, month){
    if (id === '__baseline'){
      if (data.__baselines && data.__baselines[month] != null) return data.__baselines[month];
      if (data.__baseline && data.__baseline.month === month) return parseInt(data.__baseline.value) || 0;
      return 0;
    }
    var arr = data[month] && data[month][id];
    var v = arr ? arr[day] : null;
    return (v === undefined) ? null : v;
  }
  function gravarValor(id, day, month, v){
    if (id === '__baseline'){
      if (!data.__baselines) data.__baselines = {};
      data.__baselines[month] = Math.max(0, parseInt(v) || 0);
      return;
    }
    loadMonth(month);
    data[month][id][day] = (v === null || v === '' || v === undefined) ? null : Math.max(0, parseInt(v) || 0);
  }
  function valorDaCaixa(inp){
    var s = String(inp.value).replace(/[^0-9]/g, '');
    return s === '' ? null : parseInt(s, 10);
  }
  function mostrar(v){ return (v === null || v === undefined) ? '' : String(v); }

  // Atualiza só o que é calculado (sem redesenhar a tabela).
  function refrescarCalculados(){
    var t = tabela(); if (!t || !mensal()) return;
    var month = mesAtual();
    t.querySelectorAll('[data-calc]').forEach(function(s){
      s.textContent = resolveValue(s.dataset.calc, +s.dataset.day, month);
    });
    t.querySelectorAll('[data-total]').forEach(function(td){
      var cfg = STRUCTURE.find(function(c){ return c.id === td.dataset.total; });
      if (!cfg) return;
      td.textContent = cfg.auto ? getFieldMonthValue(cfg, month) : sumCategoryInMonth(cfg.id, month);
    });
  }
  var tStats = null, tGravar = null;
  function agendarStats(){ clearTimeout(tStats); tStats = setTimeout(function(){ try{ updateStats(); }catch(e){} }, 250); }
  function agendarGravar(){ clearTimeout(tGravar); tGravar = setTimeout(gravarJa, 700); }
  function gravarJa(){ clearTimeout(tGravar); tGravar = null; try{ persistData(); }catch(e){ console.warn('ZELO movimento: falha ao gravar', e); } }
  window.addEventListener('beforeunload', function(){ if (tGravar) gravarJa(); });

  // ─────────────────────────── DESFAZER / REFAZER ───────────────────────────
  var pilhaDesfazer = [], pilhaRefazer = [], LIMITE = 100;
  function registar(alteracoes){
    alteracoes = alteracoes.filter(function(a){ return mostrar(a.antes) !== mostrar(a.depois); });
    if (!alteracoes.length) return;
    pilhaDesfazer.push(alteracoes);
    if (pilhaDesfazer.length > LIMITE) pilhaDesfazer.shift();
    pilhaRefazer = [];
  }
  function aplicar(alteracoes, campo){
    var outroMes = null;
    alteracoes.forEach(function(a){
      gravarValor(a.id, a.day, a.month, a[campo]);
      if (a.month !== mesAtual() || !mensal()) { outroMes = a.month; return; }
      var inp = caixa(a.id, a.day);
      if (inp){ inp.value = mostrar(a[campo]); inp.dataset.antes = inp.value; }
    });
    if (outroMes){ renderTable(); } else { refrescarCalculados(); }
    agendarStats(); gravarJa();
    return outroMes;
  }
  function desfazer(){
    var inp = document.activeElement;
    // Edição ainda por confirmar na caixa atual → volta ao valor anterior dela.
    if (ehCelula(inp) && inp.dataset.antes !== undefined && inp.value !== inp.dataset.antes){
      var depois = valorDaCaixa(inp);
      inp.value = inp.dataset.antes;
      gravarValor(inp.dataset.id, +inp.dataset.day, mesAtual(), valorDaCaixa(inp));
      pilhaRefazer.push([{ id: inp.dataset.id, day: +inp.dataset.day, month: mesAtual(), antes: valorDaCaixa(inp), depois: depois }]);
      refrescarCalculados(); agendarStats(); gravarJa();
      inp.select();
      return;
    }
    var alt = pilhaDesfazer.pop();
    if (!alt){ toast('Nada para desfazer.'); return; }
    pilhaRefazer.push(alt);
    var m = aplicar(alt, 'antes');
    toast('Desfeito' + (alt.length > 1 ? ' (' + alt.length + ' caixas)' : '') + (m ? ' — ' + nomeMes(m) : '') + '. Ctrl+Y para refazer.');
  }
  function refazer(){
    var alt = pilhaRefazer.pop();
    if (!alt){ toast('Nada para refazer.'); return; }
    pilhaDesfazer.push(alt);
    var m = aplicar(alt, 'depois');
    toast('Refeito' + (alt.length > 1 ? ' (' + alt.length + ' caixas)' : '') + (m ? ' — ' + nomeMes(m) : '') + '.');
  }

  // ─────────────────────────── GRELHA (matriz de caixas) ───────────────────────────
  var grelha = null; // [{ tr, cells: [input|null por dia] }]
  function construirGrelha(){
    var t = tabela(); grelha = [];
    if (!t || !mensal()) return grelha;
    var dias = getDaysInMonth(mesAtual());
    Array.prototype.forEach.call(t.querySelectorAll('tr'), function(tr){
      var caixas = tr.querySelectorAll('.cell-input');
      if (!caixas.length) return;
      var cells = new Array(dias).fill(null);
      Array.prototype.forEach.call(caixas, function(inp){ var d = +inp.dataset.day; if (d >= 0 && d < dias) cells[d] = inp; });
      grelha.push({ tr: tr, cells: cells });
    });
    return grelha;
  }
  function g(){ return grelha || construirGrelha(); }
  function posicao(inp){
    var G = g();
    for (var r = 0; r < G.length; r++){ var c = G[r].cells.indexOf(inp); if (c !== -1) return { r: r, c: c }; }
    return null;
  }
  function caixa(id, day){
    var t = tabela(); return t ? t.querySelector('.cell-input[data-id="' + id + '"][data-day="' + day + '"]') : null;
  }

  // ─────────────────────────── SELEÇÃO DE BLOCO ───────────────────────────
  var ancora = null, foco = null, aArrastar = false;
  function limparRealce(){ var t = tabela(); if (t) t.querySelectorAll('.cell-input.cell-selected').forEach(function(el){ el.classList.remove('cell-selected'); }); }
  function caixasNaSelecao(){
    if (!ancora || !foco) return [];
    var G = g(), out = [];
    var r0 = Math.min(ancora.r, foco.r), r1 = Math.max(ancora.r, foco.r);
    var c0 = Math.min(ancora.c, foco.c), c1 = Math.max(ancora.c, foco.c);
    for (var r = r0; r <= r1; r++) for (var c = c0; c <= c1; c++){ var el = G[r] && G[r].cells[c]; if (el) out.push(el); }
    return out;
  }
  function selecionar(a, f){
    ancora = a; foco = f; limparRealce();
    var cx = caixasNaSelecao();
    if (cx.length > 1) cx.forEach(function(el){ el.classList.add('cell-selected'); });
  }
  function selecaoMultipla(){ return caixasNaSelecao().length > 1; }

  // ─────────────────────────── EDIÇÃO ───────────────────────────
  document.addEventListener('focusin', function(e){
    var inp = e.target;
    if (!ehCelula(inp)) return;
    inp.dataset.antes = inp.value;
  });
  // Cada tecla: grava no mês e recalcula já os totais (sem redesenhar).
  document.addEventListener('input', function(e){
    var inp = e.target;
    if (!ehCelula(inp)) return;
    var limpo = String(inp.value).replace(/[^0-9]/g, '');
    if (limpo !== inp.value) inp.value = limpo;
    gravarValor(inp.dataset.id, +inp.dataset.day, mesAtual(), valorDaCaixa(inp));
    refrescarCalculados(); agendarStats(); agendarGravar();
  }, true);
  // Ao sair da caixa: fica registado para o Ctrl+Z e grava de imediato.
  document.addEventListener('change', function(e){
    var inp = e.target;
    if (!ehCelula(inp)) return;
    var antes = inp.dataset.antes, depois = inp.value;
    if (antes !== undefined && antes !== depois){
      registar([{ id: inp.dataset.id, day: +inp.dataset.day, month: mesAtual(),
                  antes: antes === '' ? null : parseInt(antes, 10), depois: valorDaCaixa(inp) }]);
    }
    inp.dataset.antes = inp.value;
    gravarJa();
  }, true);

  function aplicarEmBloco(pares, mensagem){
    // pares: [{ inp, valor }]
    var month = mesAtual(), alt = [];
    pares.forEach(function(p){
      var antes = lerValor(p.inp.dataset.id, +p.inp.dataset.day, month);
      p.inp.value = mostrar(p.valor);
      gravarValor(p.inp.dataset.id, +p.inp.dataset.day, month, p.valor);
      alt.push({ id: p.inp.dataset.id, day: +p.inp.dataset.day, month: month, antes: antes, depois: p.valor });
      p.inp.dataset.antes = p.inp.value;
    });
    registar(alt);
    refrescarCalculados(); agendarStats(); gravarJa();
    if (mensagem) toast(mensagem);
  }

  // ─────────────────────────── RATO ───────────────────────────
  document.addEventListener('mousedown', function(e){
    var inp = e.target;
    if (!ehCelula(inp)){
      if (!(e.target.closest && e.target.closest('.mov-sel-toolbar'))){ limparRealce(); ancora = foco = null; }
      return;
    }
    var p = posicao(inp); if (!p) return;
    if (e.shiftKey && ancora){ e.preventDefault(); selecionar(ancora, p); inp.focus(); }
    else { selecionar(p, p); aArrastar = true; }
  });
  document.addEventListener('mouseover', function(e){
    if (!aArrastar || !ancora) return;
    var inp = e.target; if (!ehCelula(inp)) return;
    var p = posicao(inp); if (p) selecionar(ancora, p);
  });
  document.addEventListener('mouseup', function(){ aArrastar = false; });

  // ─────────────────────────── TECLADO ───────────────────────────
  function irPara(r, c, extender){
    var G = g(); if (!G.length) return false;
    r = Math.max(0, Math.min(G.length - 1, r));
    var alvo = G[r].cells[c];
    if (!alvo){
      // procura a caixa mais próxima nessa linha (ex.: linha de partida só tem o dia 1)
      var melhor = null, dist = Infinity;
      G[r].cells.forEach(function(el, i){ if (el && Math.abs(i - c) < dist){ dist = Math.abs(i - c); melhor = i; } });
      if (melhor === null) return false;
      c = melhor; alvo = G[r].cells[c];
    }
    if (extender && ancora){ selecionar(ancora, { r: r, c: c }); alvo.focus(); }
    else { selecionar({ r: r, c: c }, { r: r, c: c }); alvo.focus(); alvo.select(); }
    mostrarCaixa(alvo);
    return true;
  }
  // Garante que a caixa fica visível, também na horizontal — descontando a
  // coluna fixa dos nomes (senão a caixa ficava escondida por baixo dela).
  function mostrarCaixa(el){
    el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    var w = el.closest('.table-wrapper'); if (!w) return;
    var lbl = w.querySelector('.label-col');
    var fixa = lbl ? lbl.getBoundingClientRect().width : 0;
    var rw = w.getBoundingClientRect(), rc = el.closest('td').getBoundingClientRect();
    if (rc.left < rw.left + fixa) w.scrollLeft -= (rw.left + fixa - rc.left) + 4;
    else if (rc.right > rw.right) w.scrollLeft += (rc.right - rw.right) + 4;
  }
  function vizinhoNaLinha(r, c, passo){
    var cells = g()[r].cells;
    for (var i = c + passo; i >= 0 && i < cells.length; i += passo) if (cells[i]) return i;
    return null;
  }
  function vizinhoNaColuna(r, c, passo){
    var G = g();
    for (var i = r + passo; i >= 0 && i < G.length; i += passo) if (G[i].cells[c]) return i;
    return null;
  }

  document.addEventListener('keydown', function(e){
    var mod = e.ctrlKey || e.metaKey;
    var ativo = document.activeElement;
    var naGrelha = ehCelula(ativo);
    var campoTexto = ativo && (ativo.tagName === 'TEXTAREA' || (ativo.tagName === 'INPUT' && !naGrelha && ativo.type !== 'checkbox'));

    // Ctrl+Z / Ctrl+Y funcionam em toda a página (menos noutros campos de texto).
    if (mod && !e.altKey && (e.key === 'z' || e.key === 'Z') && !campoTexto && mensal()){
      e.preventDefault(); if (e.shiftKey) refazer(); else desfazer(); return;
    }
    if (mod && !e.altKey && (e.key === 'y' || e.key === 'Y') && !campoTexto && mensal()){
      e.preventDefault(); refazer(); return;
    }
    if (!naGrelha) return;
    var p = posicao(ativo); if (!p) return;

    if (mod && (e.key === 'a' || e.key === 'A')){
      e.preventDefault();
      var G = g(), ultima = G.length - 1;
      selecionar({ r: 0, c: 0 }, { r: ultima, c: G[ultima].cells.length - 1 });
      toast(caixasNaSelecao().length + ' caixas selecionadas');
      return;
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && selecaoMultipla()){
      e.preventDefault();
      var cx = caixasNaSelecao().filter(function(el){ return el.value !== ''; });
      if (!cx.length) return;
      aplicarEmBloco(cx.map(function(el){ return { inp: el, valor: null }; }), cx.length + ' caixas apagadas. Ctrl+Z para desfazer.');
      return;
    }

    var ext = e.shiftKey, n;
    switch (e.key){
      case 'ArrowRight': n = vizinhoNaLinha(p.r, p.c, 1);  if (n !== null){ e.preventDefault(); irPara(p.r, n, ext); } else e.preventDefault(); return;
      case 'ArrowLeft':  n = vizinhoNaLinha(p.r, p.c, -1); if (n !== null){ e.preventDefault(); irPara(p.r, n, ext); } else e.preventDefault(); return;
      case 'ArrowDown':  e.preventDefault(); n = vizinhoNaColuna(p.r, p.c, 1);  irPara(n !== null ? n : Math.min(p.r + 1, g().length - 1), p.c, ext); return;
      case 'ArrowUp':    e.preventDefault(); n = vizinhoNaColuna(p.r, p.c, -1); irPara(n !== null ? n : Math.max(p.r - 1, 0), p.c, ext); return;
      case 'Enter':      e.preventDefault(); ativo.dispatchEvent(new Event('change', { bubbles: true }));
                         n = vizinhoNaColuna(p.r, p.c, e.shiftKey ? -1 : 1); if (n !== null) irPara(n, p.c); return;
      case 'Home':       e.preventDefault(); if (mod) irPara(0, 0); else { n = vizinhoNaLinha(p.r, -1, 1); if (n !== null) irPara(p.r, n, ext); } return;
      case 'End':        e.preventDefault(); if (mod){ var G2 = g(); irPara(G2.length - 1, G2[G2.length - 1].cells.length - 1); }
                         else { n = vizinhoNaLinha(p.r, g()[p.r].cells.length, -1); if (n !== null) irPara(p.r, n, ext); } return;
      case 'Escape':     selecionar(p, p); return;
    }
  });

  // ─────────────────────────── COPIAR / COLAR (blocos) ───────────────────────────
  document.addEventListener('copy', function(e){
    if (!ehCelula(document.activeElement) || !selecaoMultipla()) return;
    var G = g();
    var r0 = Math.min(ancora.r, foco.r), r1 = Math.max(ancora.r, foco.r);
    var c0 = Math.min(ancora.c, foco.c), c1 = Math.max(ancora.c, foco.c);
    var linhas = [];
    for (var r = r0; r <= r1; r++){
      var v = [];
      for (var c = c0; c <= c1; c++){ var el = G[r].cells[c]; v.push(el ? el.value : ''); }
      linhas.push(v.join('\t'));
    }
    e.preventDefault();
    e.clipboardData.setData('text/plain', linhas.join('\n'));
    toast(caixasNaSelecao().length + ' caixas copiadas');
  });
  document.addEventListener('paste', function(e){
    var ativo = document.activeElement;
    if (!ehCelula(ativo)) return;
    var texto = (e.clipboardData || window.clipboardData).getData('text');
    if (!texto) return;
    var linhas = texto.replace(/\r/g, '').split('\n');
    while (linhas.length && linhas[linhas.length - 1] === '') linhas.pop();
    var bloco = linhas.map(function(l){ return l.split('\t'); });
    if (bloco.length === 1 && bloco[0].length === 1 && !selecaoMultipla()) return; // valor simples: colar normal
    e.preventDefault();
    var G = g(), inicio = posicao(ativo);
    if (selecaoMultipla()) inicio = { r: Math.min(ancora.r, foco.r), c: Math.min(ancora.c, foco.c) };
    var pares = [], fim = inicio;
    bloco.forEach(function(vals, i){
      vals.forEach(function(val, j){
        var r = inicio.r + i, c = inicio.c + j;
        var el = G[r] && G[r].cells[c];
        if (!el) return;
        var limpo = String(val).trim().replace(/[^0-9]/g, '');
        pares.push({ inp: el, valor: limpo === '' ? null : parseInt(limpo, 10) });
        fim = { r: r, c: c };
      });
    });
    if (!pares.length) return;
    aplicarEmBloco(pares, pares.length + ' caixas coladas. Ctrl+Z para desfazer.');
    selecionar(inicio, fim);
  });

  // ─────────────────────────── BARRA "SELECIONAR" (linhas) ───────────────────────────
  var CLIP_KEY = 'zeloMovClipboard';
  function secao(){ var t = tabela(); return t ? t.closest('.table-section') : null; }
  function checks(){ var t = tabela(); return t ? Array.prototype.slice.call(t.querySelectorAll('.mov-row-chk')) : []; }
  function marcados(){ return checks().filter(function(c){ return c.checked; }); }
  function caixasDaLinha(id){ var t = tabela(); return t ? Array.prototype.slice.call(t.querySelectorAll('.cell-input[data-id="' + id + '"]')) : []; }
  function rotulo(id){ var c = STRUCTURE.find(function(x){ return x.id === id; }); return c ? c.label : id; }

  function atualizarContagem(){
    var n = marcados().length, total = checks().length;
    var cnt = document.getElementById('mov-sel-count'); if (cnt) cnt.textContent = n + (n === 1 ? ' linha selecionada' : ' linhas selecionadas');
    var bar = document.getElementById('mov-sel-toolbar'); if (bar) bar.classList.toggle('has-selection', n > 0);
    ['copiar', 'colar', 'eliminar'].forEach(function(a){ var b = document.getElementById('mov-sel-' + a); if (b) b.disabled = n === 0; });
    var all = document.getElementById('mov-sel-all'); if (all){ all.checked = total > 0 && n === total; all.indeterminate = n > 0 && n < total; }
  }
  function montarBarra(){
    var s = secao(); if (!s || document.getElementById('mov-sel-toolbar')) return;
    var bar = document.createElement('div');
    bar.className = 'mov-sel-toolbar'; bar.id = 'mov-sel-toolbar';
    bar.innerHTML =
      '<button type="button" class="mov-btn-sel" data-mov="modo" id="mov-sel-modo">Selecionar</button>' +
      '<label class="mov-sel-all mov-sel-only"><input type="checkbox" class="mov-sel-all-chk" id="mov-sel-all"> <span class="mov-sel-count" id="mov-sel-count">0 linhas selecionadas</span></label>' +
      '<button type="button" class="mov-btn-sel mov-sel-only" data-mov="tudo">Selecionar tudo</button>' +
      '<button type="button" class="mov-btn-sel mov-sel-only" data-mov="preenchidos">Selecionar preenchidos</button>' +
      '<button type="button" class="mov-btn-sel mov-sel-only" data-mov="copiar" id="mov-sel-copiar" disabled>Copiar</button>' +
      '<button type="button" class="mov-btn-sel mov-sel-only" data-mov="colar" id="mov-sel-colar" disabled>Colar</button>' +
      '<button type="button" class="mov-btn-sel danger mov-sel-only" data-mov="eliminar" id="mov-sel-eliminar" disabled>Eliminar</button>' +
      '<span class="mov-sel-hint">Setas para navegar · Shift+setas ou arrastar para selecionar · Ctrl+C / Ctrl+V · Delete · Ctrl+Z</span>';
    var header = s.querySelector('.table-header');
    if (header && header.nextSibling) s.insertBefore(bar, header.nextSibling); else s.insertBefore(bar, s.firstChild);
    bar.addEventListener('click', function(e){
      var b = e.target.closest('[data-mov]'); if (!b || b.disabled) return;
      var a = b.dataset.mov;
      if (a === 'modo') alternarModo();
      else if (a === 'tudo'){ checks().forEach(function(c){ c.checked = true; }); atualizarContagem(); toast(checks().length + ' linhas selecionadas (preenchidas e não preenchidas)'); }
      else if (a === 'preenchidos') selPreenchidos();
      else if (a === 'copiar') copiarLinhas();
      else if (a === 'colar') colarLinhas();
      else if (a === 'eliminar') eliminarLinhas();
    });
    bar.querySelector('#mov-sel-all').addEventListener('change', function(){
      var v = this.checked; checks().forEach(function(c){ c.checked = v; }); atualizarContagem();
    });
  }
  function alternarModo(forcarDesligar){
    var s = secao(); if (!s) return;
    var ativo = forcarDesligar ? false : !s.classList.contains('mov-sel-mode');
    s.classList.toggle('mov-sel-mode', ativo);
    var b = document.getElementById('mov-sel-modo'); if (b) b.textContent = ativo ? 'Cancelar seleção' : 'Selecionar';
    if (!ativo) checks().forEach(function(c){ c.checked = false; });
    atualizarContagem();
  }
  function selPreenchidos(){
    var n = 0;
    checks().forEach(function(c){
      var p = caixasDaLinha(c.dataset.row).some(function(el){ return el.value !== ''; });
      c.checked = p; if (p) n++;
    });
    atualizarContagem();
    toast(n ? n + (n === 1 ? ' linha preenchida selecionada' : ' linhas preenchidas selecionadas') : 'Nenhuma linha preenchida neste mês');
  }
  async function copiarLinhas(){
    var sel = marcados(); if (!sel.length) return;
    var month = mesAtual(), linhas = {}, texto = [];
    sel.forEach(function(c){
      var id = c.dataset.row;
      var vals = caixasDaLinha(id).map(function(el){ return el.value; });
      linhas[id] = vals;
      texto.push(rotulo(id) + '\t' + vals.join('\t'));
    });
    try{ sessionStorage.setItem(CLIP_KEY, JSON.stringify({ month: month, linhas: linhas })); }catch(e){}
    try{ if (navigator.clipboard) await navigator.clipboard.writeText('Movimento — ' + nomeMes(month) + '\n' + texto.join('\n')); }catch(e){}
    toast('Copiadas ' + sel.length + (sel.length === 1 ? ' linha' : ' linhas') + ' de ' + nomeMes(month) + ' — pronto para colar noutro mês');
  }
  function colarLinhas(){
    var sel = marcados(); if (!sel.length) return;
    var clip = null; try{ clip = JSON.parse(sessionStorage.getItem(CLIP_KEY) || 'null'); }catch(e){}
    if (!clip || !clip.linhas){ toast('Nada copiado ainda — use "Copiar" primeiro'); return; }
    var pares = [], n = 0;
    sel.forEach(function(c){
      var vals = clip.linhas[c.dataset.row]; if (!vals) return;
      n++;
      caixasDaLinha(c.dataset.row).forEach(function(el){
        var v = vals[+el.dataset.day];
        v = (v === undefined || v === '') ? null : parseInt(v, 10);
        pares.push({ inp: el, valor: v });
      });
    });
    if (!n){ toast('Nenhuma das linhas selecionadas corresponde ao que foi copiado'); return; }
    aplicarEmBloco(pares, 'Coladas ' + n + (n === 1 ? ' linha' : ' linhas') + ' (de ' + nomeMes(clip.month) + '). Ctrl+Z para desfazer.');
  }
  function eliminarLinhas(){
    var sel = marcados(); if (!sel.length) return;
    var nomes = sel.map(function(c){ return rotulo(c.dataset.row); }).join(', ');
    if (!confirm('Apagar os valores de ' + nomes + ' em ' + nomeMes(mesAtual()) + '?\n\nPode desfazer com Ctrl+Z.')) return;
    var pares = [];
    sel.forEach(function(c){ caixasDaLinha(c.dataset.row).forEach(function(el){ if (el.value !== '') pares.push({ inp: el, valor: null }); }); c.checked = false; });
    aplicarEmBloco(pares, 'Valores apagados em ' + sel.length + (sel.length === 1 ? ' linha' : ' linhas') + '. Ctrl+Z para desfazer.');
    atualizarContagem();
  }
  document.addEventListener('change', function(e){ if (e.target.classList && e.target.classList.contains('mov-row-chk')) atualizarContagem(); });

  // ─────────────────────────── BARRA DE DESLOCAMENTO (topo) ───────────────────────────
  // Uma segunda barra por cima da tabela, sincronizada com a de baixo, com
  // botões ‹ › (uma semana de cada vez) e a indicação dos dias à vista —
  // para não ter de descer até ao fim da tabela para ver os últimos dias.
  var ICON_ESQ = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
  var ICON_DIR = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
  function wrapper(){ var t = tabela(); return t ? t.closest('.table-wrapper') : null; }
  function montarBarraTopo(){
    var w = wrapper(); if (!w || document.getElementById('mov-scroll-top')) return;
    var bar = document.createElement('div');
    bar.className = 'mov-scroll-top'; bar.id = 'mov-scroll-top';
    bar.innerHTML = '<button type="button" class="mov-scroll-btn" id="mov-scroll-esq" title="Dias anteriores" aria-label="Dias anteriores">' + ICON_ESQ + '</button>' +
      '<div class="mov-scroll-top-track" id="mov-scroll-track"><div class="mov-scroll-top-inner" id="mov-scroll-inner"></div></div>' +
      '<span class="mov-scroll-dias" id="mov-scroll-dias">—</span>' +
      '<button type="button" class="mov-scroll-btn" id="mov-scroll-dir" title="Dias seguintes" aria-label="Dias seguintes">' + ICON_DIR + '</button>';
    w.parentNode.insertBefore(bar, w);
    var track = bar.querySelector('#mov-scroll-track');
    // As duas barras têm larguras diferentes: converte-se a posição pela
    // proporção. Só se mexe na outra quando a diferença é real (> 1px),
    // o que evita que uma empurre a outra em ciclo.
    track.addEventListener('scroll', function(){
      var alvo = track.scrollLeft / razao();
      if (Math.abs(w.scrollLeft - alvo) > 1) w.scrollLeft = alvo;
    });
    w.addEventListener('scroll', function(){
      var alvo = w.scrollLeft * razao();
      if (Math.abs(track.scrollLeft - alvo) > 1) track.scrollLeft = alvo;
      atualizarDias();
    });
    function semana(){ var th = tabela().querySelectorAll('tr:first-child th')[1]; return th ? th.getBoundingClientRect().width * 7 : 300; }
    bar.querySelector('#mov-scroll-esq').addEventListener('click', function(){ w.scrollBy({ left: -semana(), behavior: 'smooth' }); });
    bar.querySelector('#mov-scroll-dir').addEventListener('click', function(){ w.scrollBy({ left: semana(), behavior: 'smooth' }); });
    window.addEventListener('resize', atualizarBarraTopo);
  }
  function razao(){
    var w = wrapper(), track = document.getElementById('mov-scroll-track');
    if (!w || !track) return 1;
    var a = w.scrollWidth - w.clientWidth, b = track.scrollWidth - track.clientWidth;
    return a > 0 && b > 0 ? b / a : 1;
  }
  function atualizarBarraTopo(){
    var w = wrapper(), bar = document.getElementById('mov-scroll-top'); if (!w || !bar) return;
    var inner = document.getElementById('mov-scroll-inner'), track = document.getElementById('mov-scroll-track');
    var excede = w.scrollWidth > w.clientWidth + 2;
    bar.hidden = !excede;
    if (!excede) return;
    // A barra de cima tem os botões ao lado, por isso é mais estreita: a
    // proporção mantém-se para o polegar ter o mesmo tamanho relativo.
    inner.style.width = Math.round(w.scrollWidth * (track.clientWidth / w.clientWidth)) + 'px';
    track.scrollLeft = w.scrollLeft * razao();
    atualizarDias();
  }
  function atualizarDias(){
    var w = wrapper(), el = document.getElementById('mov-scroll-dias'); if (!w || !el) return;
    var ths = tabela().querySelectorAll('tr:first-child th');
    var lbl = w.querySelector('.label-col');
    var rw = w.getBoundingClientRect(), esq = rw.left + (lbl ? lbl.getBoundingClientRect().width : 0);
    var primeiro = null, ultimo = null;
    for (var i = 1; i < ths.length; i++){
      var n = parseInt(ths[i].textContent, 10); if (isNaN(n)) continue;
      var r = ths[i].getBoundingClientRect();
      if (r.right > esq + 8 && r.left < rw.right - 8){ if (primeiro === null) primeiro = n; ultimo = n; }
    }
    el.textContent = primeiro === null ? '—' : ('Dias ' + primeiro + '–' + ultimo);
    var e = document.getElementById('mov-scroll-esq'), d = document.getElementById('mov-scroll-dir');
    if (e) e.disabled = w.scrollLeft <= 1;
    if (d) d.disabled = w.scrollLeft >= w.scrollWidth - w.clientWidth - 1;
  }
  // ─────────────────────────── LIGAÇÃO À PÁGINA ───────────────────────────
  // Sempre que a tabela é redesenhada (mudar de mês/vista, dados do
  // Firebase…), a grelha e a seleção são recalculadas.
  function depoisDeDesenhar(){
    grelha = null; ancora = foco = null;
    montarBarra();
    montarBarraTopo();
    setTimeout(atualizarBarraTopo, 0);
    var bar = document.getElementById('mov-sel-toolbar');
    if (bar) bar.style.display = mensal() ? '' : 'none';
    if (!mensal()) alternarModo(true); else atualizarContagem();
  }
  function ligar(){
    if (typeof window.renderTable !== 'function') return false;
    var original = window.renderTable;
    window.renderTable = function(){ var r = original.apply(this, arguments); try{ depoisDeDesenhar(); }catch(e){ console.warn(e); } return r; };
    depoisDeDesenhar();
    return true;
  }
  if (!ligar()) document.addEventListener('DOMContentLoaded', ligar);

  window.zeloMovimentoGrelha = { desfazer: desfazer, refazer: refazer, refrescar: refrescarCalculados };
})();
