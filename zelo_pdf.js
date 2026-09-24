// ── ZELO — Modelo geral de documento PDF ──
// Um único tipo de PDF para todo o sistema (a pedido), com base no modelo da
// Consulta Externa e o cabeçalho melhorado:
//   • cabeçalho em degradé azul com o logótipo, "HOSPITAL DO PRENDA", o
//     título, "Serviço de Admissão e Arquivo Médico Estatístico" e o período;
//   • secções numeradas, caixas de indicadores, tabelas com cabeçalho
//     repetido em cada página e linhas "TOTAL" em destaque;
//   • rodapé com o serviço, data, quem exportou e "Pág. X/Y";
//   • letra 12 (as tabelas só descem até 10 se uma palavra não couber).
// Duas formas de usar:
//   1) ZeloPDF.criar() → {d, cab, secT, kv, tabela, txt, quebra, rodape, …}
//      (mesma forma que CE.criarPDF, usada pela Consulta Externa);
//   2) funções soltas com o documento como 1.º argumento, para páginas que
//      usam jsPDF-AutoTable: ZeloPDF.cabecalho(d, …), ZeloPDF.autoTable(d, {…}),
//      ZeloPDF.rodape(d, …).
(function(){
  var LOGO = "data:image/jpeg;base64,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";
  var NAVY='#1F2F45', NAVY3='#2B415E', CYAN='#22D3EE', AZUL='#3E5C87', CINZA='#475569',
      LINHA='#CBD5E1', PRETO='#0F172A', FUNDO='#F1F5F9', TOTAL_BG='#E0F2FE';
  var SERVICO = 'Serviço de Admissão e Arquivo Médico Estatístico';
  var FIM_Y = 276;          // limite do conteúdo (antes do rodapé), em A4 retrato
  var TOPO_CONTINUACAO = 16; // início do conteúdo nas páginas seguintes

  function dims(d){
    var ps = d.internal.pageSize;
    var W = ps.getWidth ? ps.getWidth() : ps.width, H = ps.getHeight ? ps.getHeight() : ps.height;
    return { W: W, H: H, M: 14, CW: W - 28, FIM: H - 21 };
  }
  // O tipo de letra do PDF não tem "≥"/"≤" (saíam estragados).
  function limpar(t){ return String(t == null ? '' : t).replace(/≥\s*/g, '>= ').replace(/≤\s*/g, '<= ').replace(/[‐-–]/g, '-'); }
  function autorAtual(){
    try{ var n = sessionStorage.getItem('zeloNome') || sessionStorage.getItem('zeloEmail'); return n ? 'Documento exportado por: ' + n : ''; }
    catch(e){ return ''; }
  }

  function cabecalho(d, titulo, sub){
    var g = dims(d), W = g.W, M = g.M, passos = 36;
    for (var i = 0; i < passos; i++){
      var t = i / (passos - 1);
      d.setFillColor(Math.round(0x11 + (0x3E - 0x11) * t), Math.round(0x1C + (0x5C - 0x1C) * t), Math.round(0x2B + (0x87 - 0x2B) * t));
      d.rect(W * i / passos, 0, W / passos + 0.4, 40, 'F');
    }
    d.setFillColor(CYAN); d.rect(0, 40, W, 1.4, 'F');
    try{ d.addImage(LOGO, 'JPEG', M, 8, 24, 24); }catch(e){}
    var x = M + 30;
    d.setTextColor('#BFF3FF'); d.setFont('helvetica', 'bold'); d.setFontSize(12);
    d.text('HOSPITAL DO PRENDA', x, 12.5);
    d.setTextColor('#FFFFFF');
    var tituloTxt = limpar(titulo), tamTitulo = 18;
    d.setFontSize(tamTitulo);
    while (tamTitulo > 13 && d.getTextWidth(tituloTxt) > W - M - x){ tamTitulo -= 0.5; d.setFontSize(tamTitulo); }
    d.text(tituloTxt, x, 20.5, { maxWidth: W - M - x });
    d.setFont('helvetica', 'normal'); d.setFontSize(12); d.setTextColor('#FFFFFF');
    d.text(SERVICO, x, 27.5);
    if (sub){
      d.setTextColor('#E2E8F0');
      var subTxt = limpar(sub), tamSub = 12;
      while (tamSub > 9 && d.getTextWidth(subTxt) > W - M - x){ tamSub -= 0.5; d.setFontSize(tamSub); }
      var subLinhas = d.splitTextToSize(subTxt, W - M - x);
      if (subLinhas.length > 1){ d.setFontSize(9); subLinhas = d.splitTextToSize(subTxt, W - M - x).slice(0, 2); d.text(subLinhas, x, 32.8); }
      else d.text(subLinhas, x, 34);
    }
    d.setFontSize(10); d.setTextColor('#BFF3FF');
    d.text('Emitido em ' + new Date().toLocaleDateString('pt-PT'), W - M, 12.5, { align: 'right' });
    d.setTextColor(PRETO); d.setFont('helvetica', 'normal');
    return 50;
  }
  function rodape(d, autorTxt){
    if (autorTxt === undefined) autorTxt = autorAtual();
    var n = d.getNumberOfPages();
    for (var i = 1; i <= n; i++){
      d.setPage(i);
      var g = dims(d), W = g.W, H = g.H, M = g.M;
      d.setFillColor(NAVY3); d.rect(0, H - 15, W, 0.8, 'F');
      d.setFont('helvetica', 'bold'); d.setFontSize(9); d.setTextColor(NAVY3);
      d.text(SERVICO, M, H - 9.5);
      d.setFont('helvetica', 'normal'); d.setFontSize(8.5); d.setTextColor(CINZA);
      d.text('Hospital do Prenda · Gerado em ' + new Date().toLocaleString('pt-PT'), M, H - 5);
      if (autorTxt) d.text(limpar(autorTxt), W - M, H - 5, { align: 'right' });
      d.setFont('helvetica', 'bold'); d.setFontSize(9); d.setTextColor(NAVY3);
      d.text('Pág. ' + i + '/' + n, W - M, H - 9.5, { align: 'right' });
    }
  }
  // Rodapé baixo para folhas de posição fixa (acompanha o cabeçalho compacto).
  function rodapeCompacto(d, autorTxt){
    if (autorTxt === undefined) autorTxt = autorAtual();
    var n = d.getNumberOfPages();
    for (var i = 1; i <= n; i++){
      d.setPage(i);
      var g = dims(d), W = g.W, H = g.H, M = g.M;
      d.setFillColor(NAVY3); d.rect(0, H - 7, W, 0.5, 'F');
      d.setFont('helvetica', 'normal'); d.setFontSize(7); d.setTextColor(CINZA);
      d.text(SERVICO + ' · Hospital do Prenda · Gerado em ' + new Date().toLocaleString('pt-PT') + (autorTxt ? ' · ' + limpar(autorTxt) : ''), M, H - 3);
      d.setFont('helvetica', 'bold'); d.setTextColor(NAVY3);
      d.text('Pág. ' + i + '/' + n, W - M, H - 3, { align: 'right' });
    }
  }
  function quebra(d, y, alt){ var g = dims(d); if (y + (alt || 10) > g.FIM){ d.addPage(); return TOPO_CONTINUACAO; } return y; }
  function secao(d, y, txt){
    var g = dims(d);
    y = quebra(d, y, 36); // o título nunca fica sozinho no fundo da página (fica com o início do conteúdo)
    d.setFillColor(NAVY3); d.roundedRect(g.M, y, g.CW, 9, 1.8, 1.8, 'F');
    d.setFillColor(CYAN); d.rect(g.M, y, 1.6, 9, 'F');
    d.setTextColor('#FFFFFF'); d.setFont('helvetica', 'bold'); d.setFontSize(12);
    d.text(limpar(txt), g.M + 5, y + 6.2);
    d.setTextColor(PRETO); d.setFont('helvetica', 'normal');
    return y + 13;
  }
  function indicadores(d, y, pares){
    var g = dims(d), col = g.CW / pares.length;
    d.setFontSize(9); d.setFont('helvetica', 'bold');
    var rot = pares.map(function(p){ return d.splitTextToSize(limpar(p[0]).toUpperCase(), col - 6); });
    var linhasRot = Math.max.apply(null, rot.map(function(r){ return r.length; }));
    var alt = 15 + (linhasRot - 1) * 3.8;
    y = quebra(d, y, alt + 3);
    pares.forEach(function(p, i){
      d.setFillColor(FUNDO); d.setDrawColor(LINHA);
      d.roundedRect(g.M + col * i + (i ? 1 : 0), y, col - (i < pares.length - 1 ? 1 : 0), alt, 1.8, 1.8, 'FD');
      d.setTextColor(CINZA); d.setFontSize(9); d.setFont('helvetica', 'bold');
      d.text(rot[i], g.M + col * i + 3.5, y + 5.2);
      d.setTextColor(NAVY); d.setFontSize(14);
      d.text(limpar(p[1]), g.M + col * i + 3.5, y + alt - 3);
    });
    d.setTextColor(PRETO); d.setFont('helvetica', 'normal');
    return y + alt + 3;
  }
  function cabTabela(d, y, cols, larg){
    var g = dims(d), x = g.M;
    d.setFontSize(11.5); d.setFont('helvetica', 'bold');
    var partes = cols.map(function(c, i){ return d.splitTextToSize(limpar(c), larg[i] - 3.4); });
    var h = Math.max.apply(null, partes.map(function(p){ return p.length; })) * 4.6 + 4;
    d.setFillColor(NAVY); d.roundedRect(g.M, y, g.CW, h, 1.4, 1.4, 'F');
    d.setTextColor('#FFFFFF');
    partes.forEach(function(p, i){ d.text(p, x + 2.2, y + 5.8); x += larg[i]; });
    return y + h;
  }
  // Ajusta as larguras (soma = largura útil) para nenhuma palavra ser cortada.
  function larguras(d, cols, larg, linhas, tam){
    var g = dims(d), soma = larg.reduce(function(a, b){ return a + b; }, 0);
    larg = larg.map(function(w){ return w * g.CW / (soma || 1); });
    d.setFontSize(tam);
    var precisa = larg.map(function(w, i){
      var maior = 0;
      d.setFont('helvetica', 'bold'); d.setFontSize(Math.min(tam, 11.5));
      limpar(cols[i]).split(/\s+/).forEach(function(p){ maior = Math.max(maior, d.getTextWidth(p)); });
      d.setFont('helvetica', 'normal'); d.setFontSize(tam);
      linhas.forEach(function(ln){ limpar(ln[i]).split(/\s+/).forEach(function(p){ maior = Math.max(maior, d.getTextWidth(p)); }); });
      return maior + 4.6;
    });
    var falta = 0;
    larg.forEach(function(w, i){ if (w < precisa[i]){ falta += precisa[i] - w; larg[i] = precisa[i]; } });
    if (falta > 0){
      var folgas = larg.map(function(w, i){ return Math.max(0, w - precisa[i]); });
      var tf = folgas.reduce(function(a, b){ return a + b; }, 0);
      if (tf > 0){ var tirar = Math.min(falta, tf); larg = larg.map(function(w, i){ return w - tirar * folgas[i] / tf; }); }
    }
    return larg;
  }
  function tabela(d, y, cols, larg, linhas){
    if (!linhas || !linhas.length) return y;
    var tam = 11.5;
    function cabeTudo(t){
      d.setFontSize(t);
      var l = larguras(d, cols, larg, linhas, t);
      return l.reduce(function(a, b){ return a + b; }, 0) <= dims(d).CW + 0.5;
    }
    while (tam > 10 && !cabeTudo(tam)) tam -= 0.5;
    var L = larguras(d, cols, larg, linhas, tam), lh = tam * 0.42, g = dims(d);
    y = quebra(d, y, 20); y = cabTabela(d, y, cols, L);
    linhas.forEach(function(ln, ri){
      d.setFont('helvetica', 'normal'); d.setFontSize(tam);
      var partes = ln.map(function(cel, i){ return d.splitTextToSize(limpar(cel), L[i] - 4.4); });
      var h = Math.max.apply(null, partes.map(function(p){ return p.length; })) * lh + 3.2;
      if (y + h > g.FIM){ d.addPage(); y = TOPO_CONTINUACAO; y = cabTabela(d, y, cols, L); d.setFont('helvetica', 'normal'); d.setFontSize(tam); }
      var total = /^TOTAL/i.test(String(ln[0]));
      if (total){ d.setFillColor(TOTAL_BG); d.rect(g.M, y, g.CW, h, 'F'); d.setFont('helvetica', 'bold'); }
      else if (ri % 2 === 0){ d.setFillColor(FUNDO); d.rect(g.M, y, g.CW, h, 'F'); }
      d.setTextColor(PRETO);
      var x = g.M; partes.forEach(function(p, i){ d.text(p, x + 2.2, y + lh + 1); x += L[i]; });
      d.setDrawColor(LINHA); d.setLineWidth(0.2); d.line(g.M, y + h, g.M + g.CW, y + h);
      y += h;
    });
    d.setFont('helvetica', 'normal');
    return y + 5;
  }
  function texto(d, y, rotulo, valor){
    if (!valor) return y;
    var g = dims(d);
    y = quebra(d, y, 16);
    if (String(rotulo || '').trim()){
      d.setTextColor(NAVY3); d.setFontSize(11); d.setFont('helvetica', 'bold');
      d.text(limpar(rotulo).toUpperCase(), g.M, y); y += 5.5;
    }
    d.setTextColor(PRETO); d.setFontSize(12); d.setFont('helvetica', 'normal');
    var ls = d.splitTextToSize(limpar(valor), g.CW);
    ls.forEach(function(l){ y = quebra(d, y, 6); d.text(l, g.M, y); y += 5.2; });
    return y + 4;
  }
  // Opções do modelo para jsPDF-AutoTable (juntar às opções da própria tabela).
  function opcoesAutoTable(d, extra){
    var g = dims(d);
    var base = {
      theme: 'grid',
      margin: { left: g.M, right: g.M, top: TOPO_CONTINUACAO, bottom: 21 },
      styles: { font: 'helvetica', fontSize: 11.5, cellPadding: 2, textColor: PRETO, lineColor: LINHA, lineWidth: 0.2, overflow: 'linebreak', valign: 'middle' },
      headStyles: { fillColor: NAVY, textColor: '#FFFFFF', fontStyle: 'bold', fontSize: 11.5, halign: 'left' },
      footStyles: { fillColor: TOTAL_BG, textColor: PRETO, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: FUNDO },
      didParseCell: function(data){
        if (typeof data.cell.text === 'object' && data.cell.text.map) data.cell.text = data.cell.text.map(limpar);
        if (data.section === 'body' && /^TOTAL/i.test(String((data.row.raw && (data.row.raw[0] && data.row.raw[0].content != null ? data.row.raw[0].content : data.row.raw[0])) || ''))){
          data.cell.styles.fillColor = TOTAL_BG; data.cell.styles.fontStyle = 'bold';
        }
      }
    };
    extra = extra || {};
    var out = {};
    Object.keys(base).forEach(function(k){ out[k] = base[k]; });
    Object.keys(extra).forEach(function(k){
      if (['styles', 'headStyles', 'footStyles', 'alternateRowStyles', 'margin', 'bodyStyles', 'columnStyles'].indexOf(k) !== -1 && typeof extra[k] === 'object' && out[k]){
        var m = {}; Object.keys(out[k]).forEach(function(a){ m[a] = out[k][a]; }); Object.keys(extra[k]).forEach(function(a){ m[a] = extra[k][a]; }); out[k] = m;
      } else if (k === 'didParseCell' && typeof extra[k] === 'function'){
        var f1 = base.didParseCell, f2 = extra[k]; out[k] = function(data){ f1(data); f2(data); };
      } else out[k] = extra[k];
    });
    return out;
  }
  function autoTable(d, opts){
    padronizar(d);
    var o = opcoesAutoTable(d, opts);
    // Cabeçalho da tabela nunca fica sozinho no fundo da página.
    if (o.startY != null && o.startY + 22 > dims(d).FIM){ d.addPage(); o.startY = TOPO_CONTINUACAO; }
    if (typeof d.autoTable === 'function') d.autoTable(o);
    else if (window.jspdf && typeof window.jspdf.autoTable === 'function') window.jspdf.autoTable(d, o);
    return (d.lastAutoTable && d.lastAutoTable.finalY != null) ? d.lastAutoTable.finalY + 5 : (o.startY || 50);
  }
  // Cabeçalho baixo (15 mm) para folhas de posição fixa (ex.: tabelas de
  // supervisão numa só página horizontal) — mesmo aspeto, menos altura.
  function cabecalhoCompacto(d, titulo, sub){
    var g = dims(d), W = g.W, M = g.M, passos = 36;
    for (var i = 0; i < passos; i++){
      var t = i / (passos - 1);
      d.setFillColor(Math.round(0x11 + (0x3E - 0x11) * t), Math.round(0x1C + (0x5C - 0x1C) * t), Math.round(0x2B + (0x87 - 0x2B) * t));
      d.rect(W * i / passos, 0, W / passos + 0.4, 15, 'F');
    }
    d.setFillColor(CYAN); d.rect(0, 15, W, 0.8, 'F');
    try{ d.addImage(LOGO, 'JPEG', M, 2, 11, 11); }catch(e){}
    d.setTextColor('#FFFFFF'); d.setFont('helvetica', 'bold'); d.setFontSize(11);
    d.text('HOSPITAL DO PRENDA · ' + limpar(titulo), M + 14, 7);
    d.setFont('helvetica', 'normal'); d.setFontSize(8.5); d.setTextColor('#BFF3FF');
    d.text(SERVICO + (sub ? ' · ' + limpar(sub) : ''), M + 14, 12);
    d.setTextColor(PRETO);
    return 19;
  }
  // Faixa de título de secção do modelo (substitui barras coloridas antigas).
  function barra(d, x, y, w, h){
    d.setFillColor(NAVY3); d.roundedRect(x, y, w, h, 1.6, 1.6, 'F');
    d.setFillColor(CYAN); d.rect(x, y, 1.4, h, 'F');
    d.setFillColor(NAVY3);
  }
  // Aplica o estilo do modelo a TODAS as tabelas (jsPDF-AutoTable) deste
  // documento, mantendo as larguras/alinhamentos/cores de significado de
  // cada página; as linhas "TOTAL…" ficam sempre em destaque.
  function padronizar(d){
    if (!d || d.__zeloPadronizado) return d;
    d.__zeloPadronizado = true;
    var original = d.autoTable;
    if (typeof original !== 'function') return d;
    d.autoTable = function(opts){
      opts = opts || {};
      var o = {}; Object.keys(opts).forEach(function(k){ o[k] = opts[k]; });
      function juntar(a, b){ var m = {}; Object.keys(a || {}).forEach(function(k){ m[k] = a[k]; }); Object.keys(b || {}).forEach(function(k){ m[k] = b[k]; }); return m; }
      var tamPedido = (opts.styles && opts.styles.fontSize) || 10;
      // Tabelas normais sobem para 10–12; folhas muito densas (letra < 7,
      // pensadas para caber numa página) só sobem meio ponto.
      var denso = tamPedido < 7;
      var tam = denso ? tamPedido + 0.5 : Math.max(tamPedido, 11.5);
      o.styles = juntar(opts.styles, { font: 'helvetica', fontSize: tam, textColor: PRETO, lineColor: LINHA, lineWidth: 0.2 });
      if (!opts.styles || opts.styles.cellPadding == null) o.styles.cellPadding = 2;
      o.headStyles = juntar(opts.headStyles, { fillColor: NAVY, textColor: '#FFFFFF', fontStyle: 'bold', fontSize: tam });
      o.alternateRowStyles = juntar(opts.alternateRowStyles, { fillColor: FUNDO });
      var mg = opts.margin || {};
      o.margin = juntar({ top: TOPO_CONTINUACAO, bottom: 21 }, typeof mg === 'number' ? { left: mg, right: mg } : mg);
      if (!denso && o.margin.bottom < 21) o.margin.bottom = 21;
      if (denso && o.margin.bottom < 9) o.margin.bottom = 9;
      // Nenhuma coluna fica mais estreita do que a sua palavra mais comprida
      // (título ou dados) — assim nunca se parte uma palavra a meio.
      try{
        var linhasCab = (opts.head || []), linhasCorpo = (opts.body || []);
        var nCols = 0;
        linhasCab.concat(linhasCorpo).forEach(function(l){ if (Array.isArray(l)) nCols = Math.max(nCols, l.length); });
        var cst = {}; Object.keys(opts.columnStyles || {}).forEach(function(k){ cst[k] = juntar(opts.columnStyles[k], {}); });
        function txtCel(c){ return String(c && typeof c === 'object' && c.content != null ? c.content : (c == null ? '' : c)); }
        for (var ci = 0; ci < nCols; ci++){
          if (cst[ci] && typeof cst[ci].cellWidth === 'number') continue;
          var maior = 0;
          d.setFont('helvetica', 'bold'); d.setFontSize(tam);
          linhasCab.forEach(function(l){ if (Array.isArray(l) && l[ci] != null) limpar(txtCel(l[ci])).split(/\s+/).forEach(function(pw){ maior = Math.max(maior, d.getTextWidth(pw)); }); });
          d.setFont('helvetica', 'normal');
          linhasCorpo.forEach(function(l){ if (Array.isArray(l) && l[ci] != null) limpar(txtCel(l[ci])).split(/\s+/).forEach(function(pw){ maior = Math.max(maior, d.getTextWidth(pw)); }); });
          if (maior > 0){ cst[ci] = juntar(cst[ci], {}); cst[ci].minCellWidth = Math.max(cst[ci].minCellWidth || 0, maior + 4.6); }
        }
        o.columnStyles = cst;
      }catch(e){}
      var dpc = opts.didParseCell;
      o.didParseCell = function(data){
        if (typeof dpc === 'function') dpc.call(this, data);
        if (typeof data.cell.text === 'object' && data.cell.text.map) data.cell.text = data.cell.text.map(limpar);
        var cs = opts.columnStyles && (opts.columnStyles[data.column.index] || opts.columnStyles[data.column.dataKey]);
        var largura = cs && typeof cs.cellWidth === 'number' ? cs.cellWidth : null;
        if (largura){
          var pad = 4.4, fs = data.cell.styles.fontSize || tam;
          d.setFont('helvetica', data.cell.styles.fontStyle === 'bold' || data.section === 'head' ? 'bold' : 'normal');
          var palavras = [].concat(data.cell.text || []).join(' ').split(/\s+/);
          d.setFontSize(fs);
          while (fs > 7 && palavras.some(function(pw){ return d.getTextWidth(pw) > largura - pad; })){ fs -= 0.5; d.setFontSize(fs); }
          data.cell.styles.fontSize = fs;
        }
        var raw = data.row && data.row.raw, c0 = raw && (Array.isArray(raw) ? raw[0] : raw[Object.keys(raw)[0]]);
        if (c0 && typeof c0 === 'object' && c0.content != null) c0 = c0.content;
        if (data.section === 'body' && /^\s*TOTAL/i.test(String(c0 == null ? '' : c0))){
          data.cell.styles.fillColor = TOTAL_BG; data.cell.styles.fontStyle = 'bold'; data.cell.styles.textColor = PRETO;
        }
      };
      if (o.startY != null && o.startY + 22 > dims(d).FIM){ d.addPage(); o.startY = TOPO_CONTINUACAO; }
      return original.call(d, o);
    };
    return d;
  }
  function novo(opts){
    var J = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    return new J(Object.assign({ unit: 'mm', format: 'a4' }, opts || {}));
  }
  // Forma "construtor", compatível com CE.criarPDF (Consulta Externa).
  function criar(opts){
    var d = novo(opts), g = dims(d);
    return {
      d: d,
      cab: function(t, s){ return cabecalho(d, t, s); },
      rodape: function(a){ rodape(d, a); },
      quebra: function(y, alt){ return quebra(d, y, alt); },
      secT: function(y, t){ return secao(d, y, t); },
      kv: function(y, p){ return indicadores(d, y, p); },
      tabela: function(y, c, l, ln){ return tabela(d, y, c, l, ln); },
      txt: function(y, r, v){ return texto(d, y, r, v); },
      NAVY: NAVY, NAVY3: NAVY3, CYAN: AZUL, CINZA: CINZA, LINHA: LINHA, PRETO: PRETO, FUNDO: FUNDO,
      M: g.M, W: g.W, CW: g.CW
    };
  }

  window.ZeloPDF = {
    SERVICO: SERVICO, LOGO: LOGO, cores: { NAVY: NAVY, NAVY3: NAVY3, CYAN: CYAN, CINZA: CINZA, LINHA: LINHA, PRETO: PRETO, FUNDO: FUNDO },
    novo: novo, criar: criar, cabecalho: cabecalho, cabecalhoCompacto: cabecalhoCompacto, rodape: rodape, quebra: quebra, secao: secao,
    barra: barra, padronizar: padronizar, rodapeCompacto: rodapeCompacto,
    indicadores: indicadores, tabela: tabela, texto: texto, autoTable: autoTable, opcoesAutoTable: opcoesAutoTable,
    limpar: limpar, TOPO_CONTINUACAO: TOPO_CONTINUACAO
  };
})();
