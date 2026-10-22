// ── ZELO — Folha «Recolha de Dias de Cama e Dias de Doente» (PDF A4) ──
// Um só desenho para as duas páginas do Serviço de Estatística:
//   • recolha_dias_cama.html  → folha EM BRANCO, para preencher à mão;
//   • dias_cama_doente.html   → a mesma folha JÁ PREENCHIDA com o que foi
//     registado no sistema (mês marcado, lotação, cada dia e os totais).
// Desenhada só com contornos (pouca tinta, boa fotocópia). Os 31 dias vão em
// duas metades lado a lado (1–16 | 17–31) para as linhas serem altas o
// bastante para escrever; linha grossa no fim de cada semana (7, 14, 21, 28).
//
//   ZeloFolhaDiasCama.pdf(lista, ym?)  → documento jsPDF
//     lista: [{ nome, dados? }]  — dados = { lotacao, cama:{1..31}, doente:{1..31},
//            responsavel, entrega:'AAAA-MM-DD', recebido:'AAAA-MM-DD', recebidoPor }
//     ym: 'AAAA-MM' (só na folha preenchida)
//   ZeloFolhaDiasCama.resumo(doc, linhas, ym) → página final com todos os serviços.
//   ZeloFolhaDiasCama.totais(dados, ym) → { cama, doente, taxa, dias, preenchidos }
(function () {
  'use strict';
  var MESES_C = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  var NAVY = [31, 47, 69], CINZA = [100, 116, 139], LINHA = [148, 163, 184], SUAVE = [244, 247, 251], TINTA = [12, 46, 120];

  function num(v) { return v === null || v === undefined || v === '' || isNaN(v) ? null : Number(v); }
  function diasNoMes(ym) { var p = String(ym || '').split('-'); return p.length === 2 ? new Date(+p[0], +p[1], 0).getDate() : 31; }
  function dataPT(iso) { var p = String(iso || '').slice(0, 10).split('-'); return p.length === 3 && p[0] ? p[2] + '/' + p[1] + '/' + p[0] : ''; }
  function taxaTxt(t) { return t == null ? '' : t.toFixed(1).replace('.', ','); }

  function totais(dados, ym) {
    dados = dados || {};
    var n = diasNoMes(ym), c = 0, o = 0, pc = 0, po = 0, cheios = 0, pc2 = 0, po2 = 0;
    for (var i = 1; i <= n; i++) {
      var a = num((dados.cama || {})[i]), b = num((dados.doente || {})[i]);
      if (a != null) { c += a; pc++; }
      if (b != null) { o += b; po++; }
      if (a != null && b != null) { cheios++; pc2 += a; po2 += b; }
    }
    // A taxa usa só os dias com os dois números (mês incompleto não a falseia).
    return { cama: pc ? c : null, doente: po ? o : null, taxa: cheios && pc2 > 0 ? po2 / pc2 * 100 : null, dias: n, preenchidos: cheios };
  }

  function criar() { var J = window.jspdf.jsPDF; return new J({ unit: 'mm', format: 'a4' }); }
  function ferramentas(d) {
    function cor(c, tipo) { d['set' + tipo + 'Color'](c[0], c[1], c[2]); }
    function txt(t, x, y, o) { o = o || {}; d.setFont('helvetica', o.b ? 'bold' : (o.i ? 'italic' : 'normal')); d.setFontSize(o.s || 9); cor(o.c || NAVY, 'Text'); d.text(String(t), x, y, o.al ? { align: o.al } : undefined); }
    function caixa(x, y, w, h, rot) { cor(LINHA, 'Draw'); d.setLineWidth(0.3); d.roundedRect(x, y, w, h, 1.2, 1.2, 'S'); if (rot) txt(rot.toUpperCase(), x + 2, y + 3.4, { s: 6.3, b: 1, c: CINZA }); }
    return { cor: cor, txt: txt, caixa: caixa };
  }
  function cabecalho(d, F, W, M, CW, titulo) {
    var Z = window.ZeloPDF || {};
    F.cor(NAVY, 'Draw'); d.setLineWidth(0.6); d.roundedRect(M, 10, CW, 22, 2, 2, 'S');
    try { if (Z.LOGO) d.addImage(Z.LOGO, 'JPEG', M + 3, 12.5, 17, 17); } catch (e) {}
    F.txt('HOSPITAL DO PRENDA', M + 24, 16.2, { s: 7.5, b: 1, c: CINZA });
    F.txt(titulo || 'Recolha de Dias de Cama e Dias de Doente', M + 24, 22.6, { s: 14.5, b: 1 });
    F.txt('Serviço de Admissão e Arquivo Médico Estatístico', M + 24, 28, { s: 8.5, c: CINZA });
  }
  function rodape(d, F, W, M, dir, H) {
    var y = (H || 297) - 12;
    F.cor(NAVY, 'Draw'); d.setLineWidth(0.4); d.line(M, y, W - M, y);
    F.txt('Hospital do Prenda · Serviço de Admissão e Arquivo Médico Estatístico', M, y + 4.5, { s: 7.3, c: CINZA });
    F.txt(dir, W - M, y + 4.5, { s: 7.3, c: CINZA, al: 'right' });
  }

  function pdf(lista, ym) {
    var d = criar(), F = ferramentas(d), W = 210, M = 12, CW = W - 2 * M;
    var cheia = !!ym, nd = diasNoMes(ym), p = String(ym || '').split('-'), ano = p[0], mesI = +p[1] - 1;
    lista.forEach(function (s, idx) {
      if (idx) d.addPage();
      var D = s.dados || {}, T = totais(D, ym);
      cabecalho(d, F, W, M, CW);
      // Identificação em caixas.
      var y = 36;
      F.caixa(M, y, 98, 12, 'Serviço'); F.txt(s.nome, M + 2.5, y + 9.4, { s: 11, b: 1 });
      F.caixa(M + 101, y, 40, 12, 'Ano'); if (cheia) F.txt(ano, M + 103.5, y + 9.4, { s: 11, b: 1, c: TINTA });
      F.caixa(M + 144, y, CW - 144, 12, 'Lotação (n.º de camas)'); if (cheia && num(D.lotacao) != null) F.txt(num(D.lotacao), M + 146.5, y + 9.4, { s: 11, b: 1, c: TINTA });
      // Mês: marcar com X.
      y = 52;
      F.txt('MÊS', M, y + 4, { s: 6.3, b: 1, c: CINZA }); F.txt('(marque com X)', M, y + 7.4, { s: 6.3, c: CINZA });
      var bx = M + 22, passo = (CW - 22) / 12;
      MESES_C.forEach(function (m, i) {
        var x = bx + i * passo; F.cor(NAVY, 'Draw'); d.setLineWidth(0.35); d.rect(x, y + 1.6, 4.4, 4.4, 'S');
        if (cheia && i === mesI) { F.cor(TINTA, 'Draw'); d.setLineWidth(0.6); d.line(x + 0.8, y + 2.4, x + 3.6, y + 5.2); d.line(x + 3.6, y + 2.4, x + 0.8, y + 5.2); }
        F.txt(m, x + 5.6, y + 5.2, { s: 8.5, b: cheia && i === mesI });
      });
      // Instruções curtas.
      y = 62;
      F.cor(SUAVE, 'Fill'); F.cor(LINHA, 'Draw'); d.setLineWidth(0.25); d.roundedRect(M, y, CW, 11, 1.2, 1.2, 'FD');
      [['Dias de cama', 'camas disponíveis no serviço nesse dia.', 4.4], ['Dias de doente', 'doentes internados nesse dia (contagem à meia-noite).', 8.7]].forEach(function (l) {
        F.txt(l[0], M + 3, y + l[2], { s: 8, b: 1 }); var wl = d.getTextWidth(l[0]);
        F.txt('=  ' + l[1], M + 3 + wl + 1.5, y + l[2], { s: 8 });
      });
      F.txt('Escreva um número em cada dia;', W - M - 3, y + 4.4, { s: 7.5, c: CINZA, al: 'right' });
      F.txt('se não houver doentes, escreva 0.', W - M - 3, y + 8.7, { s: 7.5, c: CINZA, al: 'right' });
      // Tabela em duas metades.
      var ty = 77, hh = 8, rh = 8.4, gap = 6, hw = (CW - gap) / 2;
      var cols = [['Dia', 13], ['Dias de cama', 26], ['Dias de doente', 26], ['Rubrica', hw - 65]];
      [0, 1].forEach(function (lado) {
        var x0 = M + lado * (hw + gap), ini = lado ? 17 : 1, fim = lado ? 31 : 16;
        F.cor([226, 232, 240], 'Fill'); d.rect(x0, ty, hw, hh, 'F');
        var x = x0; cols.forEach(function (c) { F.txt(c[0], x + c[1] / 2, ty + 5.3, { s: 7.8, b: 1, al: 'center' }); x += c[1]; });
        for (var k = 0; k < 16; k++) {
          var dia = ini + k, ry = ty + hh + k * rh;
          if (dia > fim || (cheia && dia > nd)) { F.cor(SUAVE, 'Fill'); d.rect(x0, ry, hw, rh, 'F'); if (dia <= fim) F.txt(String(dia).padStart(2, '0'), x0 + 6.5, ry + 5.6, { s: 10, b: 1, al: 'center', c: LINHA }); F.txt('—', x0 + 13 + 26, ry + 5.5, { s: 8, c: LINHA, al: 'center' }); continue; }
          if (Math.floor((dia - 1) / 7) % 2 === 1) { F.cor(SUAVE, 'Fill'); d.rect(x0, ry, hw, rh, 'F'); }
          var opc = !cheia && dia >= 29;
          F.txt(String(dia).padStart(2, '0') + (opc ? '*' : ''), x0 + 6.5, ry + 5.6, { s: 10, b: 1, al: 'center', c: opc ? CINZA : NAVY });
          if (cheia) {
            var c1 = num((D.cama || {})[dia]), c2 = num((D.doente || {})[dia]);
            if (c1 != null) F.txt(c1, x0 + 13 + 13, ry + 5.7, { s: 10.5, b: 1, al: 'center', c: TINTA });
            if (c2 != null) F.txt(c2, x0 + 39 + 13, ry + 5.7, { s: 10.5, b: 1, al: 'center', c: c1 != null && c2 > c1 ? [185, 28, 28] : TINTA });
          }
        }
        F.cor(LINHA, 'Draw'); d.setLineWidth(0.2);
        for (var k2 = 1; k2 <= 16; k2++) { var ly = ty + hh + k2 * rh; d.line(x0, ly, x0 + hw, ly); }
        var xx = x0; cols.slice(0, -1).forEach(function (c) { xx += c[1]; d.line(xx, ty, xx, ty + hh + 16 * rh); });
        F.cor(NAVY, 'Draw'); d.setLineWidth(0.6);
        [7, 14, 21, 28].forEach(function (n) { if (n >= ini && n < fim) { var ly2 = ty + hh + (n - ini + 1) * rh; d.line(x0, ly2, x0 + hw, ly2); } });
        d.line(x0, ty + hh, x0 + hw, ty + hh);
        d.setLineWidth(0.5); d.rect(x0, ty, hw, hh + 16 * rh, 'S');
      });
      var fy = ty + hh + 16 * rh;
      F.txt(cheia ? 'Valores registados no sistema a partir da folha entregue pelo serviço. A linha grossa marca o fim de cada semana.'
        : '* Preencha os dias 29, 30 e 31 só se o mês tiver esse dia. A linha grossa marca o fim de cada semana.', M, fy + 4.6, { s: 7.3, i: 1, c: CINZA });
      // Totais e taxa de ocupação.
      y = fy + 8;
      var tw = (CW - 6) / 3;
      F.caixa(M, y, tw, 15, 'Total de dias de cama');
      F.caixa(M + tw + 3, y, tw, 15, 'Total de dias de doente');
      F.caixa(M + 2 * (tw + 3), y, tw, 15, 'Taxa de ocupação');
      if (cheia) {
        if (T.cama != null) F.txt(T.cama, M + tw / 2, y + 11.5, { s: 14, b: 1, al: 'center', c: TINTA });
        if (T.doente != null) F.txt(T.doente, M + tw + 3 + tw / 2, y + 11.5, { s: 14, b: 1, al: 'center', c: TINTA });
        if (T.taxa != null) F.txt(taxaTxt(T.taxa), M + 3 * tw + 6 - 6, y + 9.5, { s: 14, b: 1, al: 'right', c: TINTA });
      }
      F.txt('%', M + 3 * tw + 6 - 3, cheia ? y + 9.5 : y + 12, { s: 11, b: 1, al: 'right' });
      F.txt('dias de doente ÷ dias de cama × 100', M + 2 * (tw + 3) + 2, y + 13, { s: 6.3, c: CINZA });
      // Responsável e receção na Estatística.
      y += 20;
      var cw1 = CW * 0.62, cx2 = M + cw1 + 3, cw2 = CW * 0.38 - 3;
      F.caixa(M, y, cw1, 14, 'Responsável pelo registo (nome e assinatura)');
      if (cheia && D.responsavel) F.txt(D.responsavel, M + 2.5, y + 10.5, { s: 10.5, b: 1, c: TINTA });
      F.caixa(cx2, y, cw2, 14, 'Data de entrega');
      if (cheia && D.entrega) F.txt(dataPT(D.entrega), cx2 + cw2 / 2, y + 10.5, { s: 10.5, b: 1, al: 'center', c: TINTA });
      else F.txt('____ / ____ / ________', cx2 + cw2 / 2, y + 11, { s: 9, c: CINZA, al: 'center' });
      y += 17;
      F.cor(LINHA, 'Draw'); d.setLineDashPattern([1.2, 1], 0); d.setLineWidth(0.3); d.roundedRect(M, y, CW, 10, 1.2, 1.2, 'S'); d.setLineDashPattern([], 0);
      F.txt('RESERVADO À ESTATÍSTICA', M + 2, y + 4, { s: 6.3, b: 1, c: CINZA });
      if (cheia) {
        F.txt('Recebido em', M + 2, y + 8.2, { s: 8.3, c: CINZA });
        F.txt(dataPT(D.recebido) || '____ / ____ / ________', M + 20, y + 8.2, { s: 8.8, b: !!D.recebido, c: D.recebido ? TINTA : CINZA });
        F.txt('por', M + 52, y + 8.2, { s: 8.3, c: CINZA });
        F.txt(D.recebidoPor || '______________________________', M + 58, y + 8.2, { s: 8.8, b: !!D.recebidoPor, c: D.recebidoPor ? TINTA : CINZA });
      } else F.txt('Recebido em ____ / ____ / ________     por ______________________________________', M + 2, y + 8.2, { s: 8.3, c: CINZA });
      F.txt('Registado no sistema', W - M - 9, y + 8.2, { s: 8.3, c: CINZA, al: 'right' });
      F.cor(NAVY, 'Draw'); d.setLineWidth(0.35); d.rect(W - M - 7, y + 4.9, 4, 4, 'S');
      if (cheia && T.preenchidos) { F.cor(TINTA, 'Draw'); d.setLineWidth(0.6); d.line(W - M - 6.2, y + 5.7, W - M - 3.8, y + 8.1); d.line(W - M - 3.8, y + 5.7, W - M - 6.2, y + 8.1); }
      rodape(d, F, W, M, cheia ? MESES[mesI] + ' de ' + ano + ' · ' + T.preenchidos + '/' + nd + ' dias registados' : 'Uma folha por serviço e por mês');
    });
    return d;
  }

  // Página final: todos os serviços do mês e o total do hospital.
  function resumo(d, linhas, ym) {
    var F = ferramentas(d), W = 210, M = 12, CW = W - 2 * M, p = ym.split('-'), nd = diasNoMes(ym);
    d.addPage(); cabecalho(d, F, W, M, CW);
    F.txt('Resumo do mês — ' + MESES[+p[1] - 1] + ' de ' + p[0], M, 42, { s: 12, b: 1 });
    var cols = [['Serviço', 52, 'left'], ['Lotação', 20], ['Dias de cama', 28], ['Dias de doente', 28], ['Taxa de ocupação', 30], ['Dias registados', 28]];
    var y = 47, rh = 9;
    F.cor([226, 232, 240], 'Fill'); d.rect(M, y, CW, rh, 'F');
    var x = M; cols.forEach(function (c) { F.txt(c[0], c[2] ? x + 2.5 : x + c[1] / 2, y + 6, { s: 8, b: 1, al: c[2] ? undefined : 'center' }); x += c[1]; });
    var TL = 0, TC = 0, TD = 0, PC = 0, PD = 0;
    function linha(v, tot) {
      y += rh;
      if (tot) { F.cor([224, 231, 255], 'Fill'); d.rect(M, y, CW, rh, 'F'); }
      var xx = M;
      v.forEach(function (t, i) { var c = cols[i]; F.txt(t, c[2] ? xx + 2.5 : xx + c[1] / 2, y + 6, { s: tot ? 9.5 : 9.5, b: tot || i === 0, al: c[2] ? undefined : 'center', c: i && !tot ? TINTA : NAVY }); xx += c[1]; });
      F.cor(tot ? NAVY : LINHA, 'Draw'); d.setLineWidth(tot ? 0.6 : 0.2); d.line(M, y + (tot ? 0 : rh), M + CW, y + (tot ? 0 : rh));
    }
    linhas.forEach(function (s) {
      var T = totais(s.dados, ym), L = num((s.dados || {}).lotacao);
      if (L != null) TL += L; if (T.cama != null) TC += T.cama; if (T.doente != null) TD += T.doente;
      for (var i = 1; i <= nd; i++) { var a = num(((s.dados || {}).cama || {})[i]), b = num(((s.dados || {}).doente || {})[i]); if (a != null && b != null) { PC += a; PD += b; } }
      linha([s.nome, L == null ? '—' : L, T.cama == null ? '—' : T.cama, T.doente == null ? '—' : T.doente, T.taxa == null ? '—' : taxaTxt(T.taxa) + '%', T.preenchidos + ' / ' + nd]);
    });
    linha(['TOTAL DO HOSPITAL', TL || '—', TC || '—', TD || '—', PC ? taxaTxt(PD / PC * 100) + '%' : '—', ''], true);
    F.cor(NAVY, 'Draw'); d.setLineWidth(0.5); d.rect(M, 47, CW, y + rh - 47, 'S');
    F.txt('Taxa de ocupação = dias de doente ÷ dias de cama × 100 (só os dias com os dois números). «—» = sem valores registados.', M, y + rh + 6, { s: 7.5, i: 1, c: CINZA });
    rodape(d, F, W, M, MESES[+p[1] - 1] + ' de ' + p[0] + ' · resumo');
  }

  // Resumo de um período (trimestre, semestre, ano): uma página com todos os
  // serviços, já somados.  linhas: [{ nome, lotacao, cama, doente, taxa, preenchidos, dias }]
  function resumoPeriodo(linhas, titulo, rotulo) {
    var d = criar(), F = ferramentas(d), W = 210, M = 12, CW = W - 2 * M;
    cabecalho(d, F, W, M, CW);
    F.txt('Resumo — ' + titulo, M, 42, { s: 12, b: 1 });
    var cols = [['Serviço', 52, 'left'], ['Lotação', 20], ['Dias de cama', 28], ['Dias de doente', 28], ['Taxa de ocupação', 30], ['Dias registados', 28]];
    var y = 47, rh = 9, x = M;
    F.cor([226, 232, 240], 'Fill'); d.rect(M, y, CW, rh, 'F');
    cols.forEach(function (c) { F.txt(c[0], c[2] ? x + 2.5 : x + c[1] / 2, y + 6, { s: 8, b: 1, al: c[2] ? undefined : 'center' }); x += c[1]; });
    function linha(v, tot) {
      y += rh;
      if (tot) { F.cor([224, 231, 255], 'Fill'); d.rect(M, y, CW, rh, 'F'); }
      var xx = M;
      v.forEach(function (t, i) { var c = cols[i]; F.txt(t, c[2] ? xx + 2.5 : xx + c[1] / 2, y + 6, { s: 9.5, b: tot || i === 0, al: c[2] ? undefined : 'center', c: i && !tot ? TINTA : NAVY }); xx += c[1]; });
      F.cor(tot ? NAVY : LINHA, 'Draw'); d.setLineWidth(tot ? 0.6 : 0.2); d.line(M, y + (tot ? 0 : rh), M + CW, y + (tot ? 0 : rh));
    }
    var TL = 0, TC = 0, TD = 0, PC = 0, PD = 0;
    linhas.forEach(function (s) {
      if (s.lotacao != null) TL += s.lotacao; if (s.cama != null) TC += s.cama; if (s.doente != null) TD += s.doente;
      PC += s.pc || 0; PD += s.pd || 0;
      linha([s.nome, s.lotacao == null ? '—' : s.lotacao, s.cama == null ? '—' : s.cama, s.doente == null ? '—' : s.doente, s.taxa == null ? '—' : taxaTxt(s.taxa) + '%', s.preenchidos + ' / ' + s.dias]);
    });
    linha(['TOTAL DO HOSPITAL', TL || '—', TC || '—', TD || '—', PC ? taxaTxt(PD / PC * 100) + '%' : '—', ''], true);
    F.cor(NAVY, 'Draw'); d.setLineWidth(0.5); d.rect(M, 47, CW, y + rh - 47, 'S');
    F.txt('Taxa de ocupação = dias de doente ÷ dias de cama × 100 (só os dias com os dois números). «—» = sem valores registados.', M, y + rh + 6, { s: 7.5, i: 1, c: CINZA });
    rodape(d, F, W, M, rotulo || titulo);
    return d;
  }


  // ── Relatório DETALHADO: os números registados dia a dia ──
  //   meses: [{ ym, servicos: [{ nome, dados, mov? }] }]
  //     mov (opcional) = { cama:{dia:n}, doente:{dia:n} } do Movimento Hospitalar
  //   op.grelha: página horizontal com todos os serviços lado a lado (por mês)
  //   op.fichas: uma página por serviço com cada dia em linha (por mês)
  var SEM_L = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  var VERM = [185, 28, 28], VERDE = [5, 150, 105], LARANJA = [180, 83, 9];
  function detalhado(meses, op) {
    op = op || {};
    var d = null, paginas = 0;
    function nova(orient) {
      if (!d) { var J = window.jspdf.jsPDF; d = new J({ unit: 'mm', format: 'a4', orientation: orient }); }
      else d.addPage('a4', orient);
      paginas++;
      return ferramentas(d);
    }
    meses.forEach(function (m) {
      var p = m.ym.split('-'), nd = diasNoMes(m.ym), mesTxt = MESES[+p[1] - 1] + ' de ' + p[0];
      if (op.grelha !== false) grelha(m, p, nd, mesTxt);
      if (op.fichas !== false) m.servicos.forEach(function (s) {
        var T = totais(s.dados, m.ym);
        if (op.soComDados && !T.preenchidos && T.cama == null && T.doente == null) return;
        ficha(s, m.ym, p, nd, mesTxt, T);
      });
    });
    if (!d) { var F0 = nova('portrait'); cabecalho(d, F0, 210, 12, 186, 'Relatório Detalhado — Dias de Cama e Dias de Doente'); F0.txt('Sem dados registados no período escolhido.', 12, 45, { s: 11 }); }
    return d;

    // Página horizontal: dias em linhas, serviços em colunas (cama | doente) e o hospital.
    function grelha(m, p, nd, mesTxt) {
      var F = nova('landscape'), W = 297, H = 210, M = 10, CW = W - 2 * M, ns = m.servicos.length;
      cabecalho(d, F, W, M, CW, 'Registo diário — todos os serviços');
      F.txt(mesTxt.charAt(0).toUpperCase() + mesTxt.slice(1), W - M - 3, 22.6, { s: 12, b: 1, al: 'right' });
      var cDia = 17, cHosp = 15, cServ = (CW - cDia - 3 * cHosp) / ns, sub = cServ / 2;
      var y0 = 36, h1 = 9, h2 = 5, rh = Math.min(4.6, (H - 22 - y0 - h1 - h2 - 2 * 5.2) / nd);
      // cabeçalho da tabela
      F.cor([226, 232, 240], 'Fill'); d.rect(M, y0, CW, h1 + h2, 'F');
      F.txt('Dia', M + cDia / 2, y0 + 8, { s: 7.5, b: 1, al: 'center' });
      var x = M + cDia;
      m.servicos.forEach(function (s) {
        var nome = s.nome; d.setFontSize(6.6); while (d.getTextWidth(nome) > cServ - 1.5 && nome.length > 4) nome = nome.slice(0, -2) + '…';
        F.txt(nome, x + cServ / 2, y0 + 4.2, { s: 6.6, b: 1, al: 'center' });
        var L = num((s.dados || {}).lotacao); if (L != null) F.txt('lot. ' + L, x + cServ / 2, y0 + 7.6, { s: 5.6, c: CINZA, al: 'center' });
        F.txt('Cama', x + sub / 2, y0 + h1 + 3.6, { s: 5.8, b: 1, c: CINZA, al: 'center' });
        F.txt('Doente', x + sub * 1.5, y0 + h1 + 3.6, { s: 5.8, b: 1, c: CINZA, al: 'center' });
        x += cServ;
      });
      F.cor([224, 231, 255], 'Fill'); d.rect(x, y0, 3 * cHosp, h1 + h2, 'F');
      F.txt('HOSPITAL', x + 1.5 * cHosp, y0 + 5.5, { s: 7, b: 1, al: 'center' });
      ['Cama', 'Doente', 'Ocup. %'].forEach(function (t, i) { F.txt(t, x + cHosp * (i + .5), y0 + h1 + 3.6, { s: 5.8, b: 1, c: CINZA, al: 'center' }); });
      // linhas dos dias
      var y = y0 + h1 + h2, totC = {}, totD = {}, hc = 0, hd = 0, pc = 0, pdd = 0;
      for (var dia = 1; dia <= nd; dia++) {
        var w = new Date(+p[0], +p[1] - 1, dia).getDay();
        if (w === 0 || w === 6) { F.cor(SUAVE, 'Fill'); d.rect(M, y, CW, rh, 'F'); }
        F.txt(pad2(dia) + ' ' + SEM_L[w].slice(0, 3).toLowerCase(), M + 2, y + rh - 1.2, { s: 6.6, b: 1 });
        x = M + cDia; var sc = 0, sd = 0, temC = false, temD = false, pcd = 0, pdd2 = 0;
        m.servicos.forEach(function (s, i) {
          var a = num(((s.dados || {}).cama || {})[dia]), b = num(((s.dados || {}).doente || {})[dia]);
          if (a != null) { sc += a; temC = true; totC[i] = (totC[i] || 0) + a; }
          if (b != null) { sd += b; temD = true; totD[i] = (totD[i] || 0) + b; }
          if (a != null && b != null) { pcd += a; pdd2 += b; }
          F.txt(a == null ? '·' : a, x + sub / 2, y + rh - 1.2, { s: 6.8, c: a == null ? LINHA : TINTA, al: 'center' });
          F.txt(b == null ? '·' : b, x + sub * 1.5, y + rh - 1.2, { s: 6.8, b: a != null && b != null && b > a, c: b == null ? LINHA : (a != null && b > a ? VERM : TINTA), al: 'center' });
          x += cServ;
        });
        if (temC) hc += sc; if (temD) hd += sd; pc += pcd; pdd += pdd2;
        F.txt(temC ? sc : '·', x + cHosp / 2, y + rh - 1.2, { s: 6.8, b: 1, c: temC ? NAVY : LINHA, al: 'center' });
        F.txt(temD ? sd : '·', x + cHosp * 1.5, y + rh - 1.2, { s: 6.8, b: 1, c: temD ? NAVY : LINHA, al: 'center' });
        F.txt(pcd ? taxaTxt(pdd2 / pcd * 100) : '·', x + cHosp * 2.5, y + rh - 1.2, { s: 6.8, b: 1, c: pcd ? NAVY : LINHA, al: 'center' });
        F.cor(dia % 7 === 0 ? NAVY : [226, 232, 240], 'Draw'); d.setLineWidth(dia % 7 === 0 ? 0.35 : 0.15); d.line(M, y + rh, M + CW, y + rh);
        y += rh;
      }
      // totais e ocupação do mês
      var rt = 5.2;
      F.cor([224, 231, 255], 'Fill'); d.rect(M, y, CW, rt * 2, 'F');
      F.txt('Total', M + 2, y + rt - 1.4, { s: 7, b: 1 }); F.txt('Ocupação', M + 2, y + 2 * rt - 1.4, { s: 7, b: 1 });
      x = M + cDia;
      m.servicos.forEach(function (s, i) {
        var T = totais(s.dados, m.ym);
        F.txt(totC[i] == null ? '—' : totC[i], x + sub / 2, y + rt - 1.4, { s: 7, b: 1, al: 'center' });
        F.txt(totD[i] == null ? '—' : totD[i], x + sub * 1.5, y + rt - 1.4, { s: 7, b: 1, al: 'center' });
        F.txt(T.taxa == null ? '—' : taxaTxt(T.taxa) + '%', x + cServ / 2, y + 2 * rt - 1.4, { s: 7, b: 1, c: T.taxa != null && T.taxa > 100 ? VERM : NAVY, al: 'center' });
        x += cServ;
      });
      F.txt(hc || '—', x + cHosp / 2, y + rt - 1.4, { s: 7, b: 1, al: 'center' });
      F.txt(hd || '—', x + cHosp * 1.5, y + rt - 1.4, { s: 7, b: 1, al: 'center' });
      F.txt(pc ? taxaTxt(pdd / pc * 100) + '%' : '—', x + cHosp * 1.5, y + 2 * rt - 1.4, { s: 7.5, b: 1, al: 'center' });
      // grelha vertical
      F.cor(LINHA, 'Draw'); d.setLineWidth(0.2);
      x = M + cDia;
      for (var i = 0; i <= ns; i++) { d.setLineWidth(0.35); d.line(x, y0, x, y + 2 * rt); if (i < ns) { d.setLineWidth(0.12); d.line(x + sub, y0 + h1, x + sub, y); x += cServ; } }
      var hx = M + cDia + ns * cServ; d.setLineWidth(0.12); d.line(M + cDia, y0 + h1, M + CW, y0 + h1); d.line(hx + cHosp, y0 + h1, hx + cHosp, y); d.line(hx + 2 * cHosp, y0 + h1, hx + 2 * cHosp, y);
      F.cor(NAVY, 'Draw'); d.setLineWidth(0.5); d.rect(M, y0, CW, y + 2 * rt - y0, 'S'); d.line(M, y, M + CW, y);
      F.txt('Valores tal como registados em cada dia. «·» = dia sem registo. A vermelho: mais doentes do que camas. Ocupação = dias de doente ÷ dias de cama × 100 (só os dias com os dois números).', M, y + 2 * rt + 4.5, { s: 6.5, i: 1, c: CINZA });
      rodape(d, F, W, M, mesTxt + ' · registo diário', H);
    }

    // Página vertical de um serviço: cada dia numa linha, com totais e observações.
    function ficha(s, ym, p, nd, mesTxt, T) {
      var F = nova('portrait'), W = 210, H = 297, M = 12, CW = W - 2 * M, D = s.dados || {}, L = num(D.lotacao), mv = s.mov;
      cabecalho(d, F, W, M, CW, 'Registo diário — ' + s.nome);
      F.txt(mesTxt.charAt(0).toUpperCase() + mesTxt.slice(1), W - M - 3, 22.6, { s: 12, b: 1, al: 'right' });
      // quadro de identificação
      var yi = 35, iw = CW / 4;
      [['Lotação', L == null ? '—' : L + ' camas'], ['Dias registados', T.preenchidos + ' / ' + nd], ['Responsável', D.responsavel || '—'], ['Recebido em', dataPT(D.recebido) || '—']].forEach(function (c, i) {
        F.caixa(M + i * iw, yi, iw - 2, 11, c[0]); var t = String(c[1]); d.setFontSize(9); while (d.getTextWidth(t) > iw - 6 && t.length > 4) t = t.slice(0, -2) + '…';
        F.txt(t, M + i * iw + 2, yi + 8.6, { s: 9, b: 1, c: TINTA });
      });
      var cols = [['Dia', 11], ['Dia da semana', 22], ['Dias de cama', 21], ['Dias de doente', 22], ['Ocupação %', 20], ['Camas livres', 19]];
      if (mv) cols.push(['Movimento (C / D)', 25]);
      var resto = CW - cols.reduce(function (a, c) { return a + c[1]; }, 0); cols.push(['Observação', resto]);
      var y = 50, hh = 8, rh = Math.min(6.6, (H - 30 - y - hh - 8 - 14) / nd);
      F.cor([226, 232, 240], 'Fill'); d.rect(M, y, CW, hh, 'F');
      var x = M; cols.forEach(function (c) { F.txt(c[0], x + c[1] / 2, y + 5.3, { s: 7, b: 1, al: 'center' }); x += c[1]; });
      y += hh;
      var livres = 0, nl = 0;
      for (var dia = 1; dia <= nd; dia++) {
        var w = new Date(+p[0], +p[1] - 1, dia).getDay(), a = num((D.cama || {})[dia]), b = num((D.doente || {})[dia]);
        if (w === 0 || w === 6) { F.cor(SUAVE, 'Fill'); d.rect(M, y, CW, rh, 'F'); }
        var obs = [], mc = mv ? num((mv.cama || {})[dia]) : null, md = mv ? num((mv.doente || {})[dia]) : null;
        if (a == null && b == null) obs.push('Sem registo'); else if (a == null || b == null) obs.push('Incompleto');
        if (a != null && b != null && b > a) obs.push('Mais doentes que camas');
        if (a != null && L != null && a !== L) obs.push('Camas diferentes da lotação');
        if ((mc != null && a != null && mc !== a) || (md != null && b != null && md !== b)) obs.push('Diferente do Movimento');
        var tx = a && b != null ? b / a * 100 : null; if (a != null && b != null) { livres += a - b; nl++; }
        var v = [pad2(dia), SEM_L[w], a == null ? '' : a, b == null ? '' : b, tx == null ? '' : taxaTxt(tx), a != null && b != null ? a - b : ''];
        if (mv) v.push(mc == null && md == null ? '' : (mc == null ? '—' : mc) + ' / ' + (md == null ? '—' : md));
        v.push(obs.join(' · '));
        x = M; var ty = y + rh - 1.7;
        v.forEach(function (t, i) {
          var c = cols[i], obsCol = i === v.length - 1, cor = TINTA;
          if (i === 3 && a != null && b != null && b > a) cor = VERM;
          if (i === 4 && tx != null) cor = tx > 100 ? VERM : tx < 70 ? LARANJA : VERDE;
          if (i === 5 && a != null && b != null && a - b < 0) cor = VERM;
          if (obsCol) cor = /Sem registo|Incompleto/.test(t) ? CINZA : VERM;
          if (i <= 1) cor = NAVY;
          var tt = String(t); if (obsCol) { d.setFontSize(6.5); while (d.getTextWidth(tt) > c[1] - 3 && tt.length > 4) tt = tt.slice(0, -2) + '…'; }
          F.txt(tt, obsCol ? x + 1.8 : x + c[1] / 2, ty, { s: obsCol ? 6.5 : 8.2, b: i === 0 || (i >= 2 && i <= 4), c: cor, al: obsCol ? undefined : 'center' });
          x += c[1];
        });
        F.cor(dia % 7 === 0 ? NAVY : [226, 232, 240], 'Draw'); d.setLineWidth(dia % 7 === 0 ? 0.35 : 0.15); d.line(M, y + rh, M + CW, y + rh);
        y += rh;
      }
      // total
      F.cor([224, 231, 255], 'Fill'); d.rect(M, y, CW, 8, 'F');
      var tv = ['Total', '', T.cama == null ? '—' : T.cama, T.doente == null ? '—' : T.doente, T.taxa == null ? '—' : taxaTxt(T.taxa) + '%', nl ? taxaTxt(livres / nl) + '/dia' : '—'];
      x = M; tv.forEach(function (t, i) { F.txt(t, i === 0 ? x + 2 : x + cols[i][1] / 2, y + 5.4, { s: 8.6, b: 1, al: i === 0 ? undefined : 'center' }); x += cols[i][1]; });
      F.cor(LINHA, 'Draw'); d.setLineWidth(0.15); x = M; cols.forEach(function (c, i) { if (i) d.line(x, 50, x, y + 8); x += c[1]; });
      F.cor(NAVY, 'Draw'); d.setLineWidth(0.5); d.rect(M, 50, CW, y + 8 - 50, 'S'); d.line(M, y, M + CW, y);
      F.txt('Ocupação = dias de doente ÷ dias de cama × 100. Camas livres = dias de cama - dias de doente.' + (mv ? ' Movimento = valores do Movimento Hospitalar do serviço (cama / doente).' : ''), M, y + 13, { s: 6.8, i: 1, c: CINZA });
      rodape(d, F, W, M, s.nome + ' · ' + mesTxt, H);
    }
  }
  function pad2(n) { return String(n).padStart(2, '0'); }

  window.ZeloFolhaDiasCama = { pdf: pdf, resumo: resumo, resumoPeriodo: resumoPeriodo, detalhado: detalhado, totais: totais, diasNoMes: diasNoMes, MESES: MESES };
})();
