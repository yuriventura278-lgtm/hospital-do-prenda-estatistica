// ── ZELO — Vídeos de instruções dos setores ──
// Procedimentos de Enfermagem · Bloco Operatório · Imagiologia · Hemoterapia ·
// Laboratório · Consulta Externa. Usa o leitor de zelo_video_movimento.js (carregado antes):
// botão "Instruções" no cabeçalho, cenas animadas, narração em português com a
// voz do aparelho e legendas. Não usa o Firebase nem descarrega ficheiros.
(function () {
  var V = window.ZeloVideoMov; if (!V || !V.h || window.ZELO_VIDEO_DEF) return;
  var a = V.h.a, t = V.h.t, svg = V.h.svg;
  var pagina = decodeURIComponent(location.pathname.split('/').pop() || '').toLowerCase();

  // ── Peças de desenho reutilizadas ──
  function titulo(txt, cor) { return a(0.1, t(24, 34, txt, { s: 17, w: 800, c: cor })); }
  function abertura(l1, l2, sub, icone) {
    return function () {
      return svg('#12243B', a(0.2, '<g transform="translate(58,62)"><rect width="150" height="168" rx="22" fill="#F8FAFC"/>' + icone + '</g>') +
        a(1.4, t(250, 112, 'ZELO · HOSPITAL DO PRENDA', { s: 13, w: 700, c: '#7DD3FC' })) +
        a(1.8, t(250, 150, l1, { s: 29, w: 800, c: '#fff' }) + t(250, 184, l2, { s: 29, w: 800, c: '#fff' })) +
        a(2.4, t(250, 214, sub, { s: 13.5, c: '#CBD5E1' })));
    };
  }
  function cartao(x, y, w, h, fundo, borda, t1, t2, d, cor) {
    return a(d, '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="12" fill="' + fundo + '" stroke="' + borda + '"/>' +
      t(x + 14, y + (t2 ? 24 : h / 2 + 5), t1, { s: 13, w: 800, c: cor || '#0F172A' }) + (t2 ? t(x + 14, y + 44, t2, { s: 11, c: '#475569' }) : ''));
  }
  function campo(x, y, w, rot, val, d, obrig) {
    return a(d, '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="36" rx="8" fill="#fff" stroke="#CBD5E1" stroke-width="1.5"/>' +
      t(x + 10, y - 6, rot + (obrig ? ' <tspan fill="#DC2626">*</tspan>' : ''), { s: 10.5, w: 700, c: '#475569' }) + t(x + 12, y + 23, val, { s: 12.5 }));
  }
  function contador(x, y, w, rot, dia, noite, d) {
    return a(d, '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="40" rx="10" fill="#fff" stroke="#E3E8F0"/>' + t(x + 12, y + 25, rot, { s: 12, w: 700 }) +
      '<rect x="' + (x + w - 122) + '" y="' + (y + 7) + '" width="36" height="26" rx="6" fill="#FFFBEB" stroke="#FDE68A"/>' + t(x + w - 104, y + 25, dia, { s: 12, w: 800, c: '#92400E', m: 1 }) +
      '<rect x="' + (x + w - 80) + '" y="' + (y + 7) + '" width="36" height="26" rx="6" fill="#EEF2FF" stroke="#C7D2FE"/>' + t(x + w - 62, y + 25, noite, { s: 12, w: 800, c: '#3730A3', m: 1 }) +
      t(x + w - 20, y + 25, String((+dia || 0) + (+noite || 0)), { s: 13, w: 800, c: '#1E3A5F', m: 1 }));
  }
  function relatorios(tit, cor, abas, nota) {
    return function () {
      return svg('#F8FAFC', titulo(tit, cor) +
        abas.map(function (x, i) { var col = i % 3, lin = Math.floor(i / 3); return a(0.6 + i * 0.5, '<rect x="' + (24 + col * 160) + '" y="' + (54 + lin * 52) + '" width="148" height="40" rx="10" fill="#fff" stroke="#E3E8F0"/>' + t(98 + col * 160, 79 + lin * 52, x, { s: 12.5, w: 700, c: '#1E3A5F', m: 1 })); }).join('') +
        a(5, '<g transform="translate(24,176)"><rect width="300" height="92" rx="12" fill="#fff" stroke="#E3E8F0"/>' + [34, 52, 26, 60, 44, 70, 38].map(function (h, i) { return '<rect x="' + (18 + i * 38) + '" y="' + (80 - h) + '" width="24" height="' + h + '" rx="4" fill="' + cor + '" opacity=".75"/>'; }).join('') + '</g>') +
        a(7, '<rect x="340" y="176" width="156" height="92" rx="12" fill="#FEF2F2" stroke="#FECACA"/><rect x="360" y="192" width="40" height="52" rx="4" fill="#fff" stroke="#DC2626"/>' + t(380, 222, 'PDF', { s: 11, w: 800, c: '#DC2626', m: 1 }) + t(412, 214, nota[0], { s: 11.5, w: 700, c: '#991B1B' }) + t(412, 232, nota[1], { s: 11.5, w: 700, c: '#991B1B' })));
    };
  }
  function regras(r1, r2, r3) {
    return function () {
      var r = function (y, n, cor, x, d) { return a(d, '<circle cx="50" cy="' + y + '" r="18" fill="' + cor + '"/>' + t(50, y + 6, n, { s: 16, w: 800, c: '#fff', m: 1 }) + t(80, y - 4, x[0], { s: 14, w: 700, c: '#fff' }) + t(80, y + 14, x[1], { s: 12, c: '#94A3B8' })); };
      return svg('#0E1A2B', a(0.1, t(260, 44, '3 regras de ouro', { s: 18, w: 800, c: '#fff', m: 1 })) +
        r(96, '1', '#16A34A', r1, 1.0) + r(156, '2', '#0891B2', r2, 4.5) + r(216, '3', '#D97706', r3, 8.0) +
        a(11, t(260, 272, 'ZELO — Serviço de Admissão e Arquivo Médico e Estatístico', { s: 12, c: '#7DD3FC', m: 1 })));
    };
  }
  var ICO_PRANCHETA = '<rect x="30" y="26" width="90" height="120" rx="10" fill="#E9EEF4"/><rect x="52" y="16" width="46" height="20" rx="6" fill="#94A3B8"/><rect x="44" y="56" width="62" height="8" rx="4" fill="#CBD5E1"/><rect x="44" y="76" width="50" height="8" rx="4" fill="#CBD5E1"/><rect x="44" y="96" width="58" height="8" rx="4" fill="#CBD5E1"/><path d="M48 124 l10 10 20 -22" stroke="#16A34A" stroke-width="6" fill="none" stroke-linecap="round"/>';

  var DEFS = {
    // ── Procedimentos de Enfermagem ──
    procedimentos: { titulo: 'Como registar os Procedimentos de Enfermagem', cenas: [
      { dur: 11, cor: '#1E3A5F', titulo: 'Abertura', falas: ['Olá! Neste vídeo vamos ver como registar os Procedimentos de Enfermagem: tudo o que a equipa faz em cada turno, todos os dias.'],
        svg: abertura('Procedimentos', 'de Enfermagem', 'Registo diário por turno: Dia e Noite', '<g transform="translate(20,30)"><rect x="20" y="0" width="70" height="110" rx="12" fill="#E0F2FE"/><rect x="45" y="-10" width="20" height="130" rx="6" fill="#0891B2" opacity=".25"/><circle cx="55" cy="40" r="18" fill="#0891B2"/><path d="M47 40h16M55 32v16" stroke="#fff" stroke-width="5" stroke-linecap="round"/><rect x="30" y="72" width="50" height="8" rx="4" fill="#7DD3FC"/><rect x="30" y="88" width="36" height="8" rx="4" fill="#7DD3FC"/></g>') },
      { dur: 18, cor: '#0891B2', titulo: 'Escolher o dia e o serviço', falas: ['No topo, confirme a data do registo. Pode escolher um dia anterior para corrigir ou completar.', 'No menu à esquerda escolha o serviço. O número ao lado de cada serviço mostra o total já registado nesse dia.'],
        svg: function () { return svg('#F8FAFC', titulo('Escolher o dia e o serviço', '#0891B2') +
          a(0.6, '<rect x="24" y="52" width="472" height="44" rx="12" fill="#fff" stroke="#BAE6FD" stroke-width="2"/>' + t(40, 79, 'DATA DO REGISTO', { s: 11, w: 800, c: '#64748B' }) + '<rect x="170" y="62" width="110" height="26" rx="7" fill="#F1F5F9"/>' + t(225, 80, '29 Set 2026', { s: 12, w: 700, m: 1 }) + t(300, 80, 'Terça-feira', { s: 13, w: 700, c: '#1E3A5F' })) +
          ['Cuidados Intermédios', 'UCI', 'Nefrologia'].map(function (x, i) { return a(5 + i * 0.6, '<rect x="24" y="' + (112 + i * 50) + '" width="220" height="40" rx="10" fill="' + (i === 0 ? '#E0F2FE' : '#fff') + '" stroke="' + (i === 0 ? '#0891B2' : '#E3E8F0') + '"/>' + t(40, 137 + i * 50, x, { s: 12.5, w: 700, c: '#0F172A' }) + '<rect x="200" y="' + (121 + i * 50) + '" width="32" height="22" rx="11" fill="#1E3A5F"/>' + t(216, 137 + i * 50, String([14, 9, 21][i]), { s: 11, w: 800, c: '#fff', m: 1 })); }).join('') +
          a(9, '<path d="M252 132 h40" stroke="#0891B2" stroke-width="3"/>' + t(300, 136, 'total do dia no serviço', { s: 12, w: 700, c: '#0891B2' }))); } },
      { dur: 22, cor: '#7C3AED', titulo: 'Preencher Dia e Noite', falas: ['Cada procedimento tem duas caixas: turno do dia e turno da noite. O total soma sozinho.', 'Escreva só números. O ZELO grava automaticamente enquanto escreve, e aparece Guardado no cabeçalho.', 'Pode deixar vazio o que não foi feito.'],
        svg: function () { return svg('#F8FAFC', titulo('Preencher Dia e Noite', '#7C3AED') +
          a(0.5, t(340, 64, 'DIA', { s: 10.5, w: 800, c: '#92400E', m: 1 }) + t(382, 64, 'NOITE', { s: 10.5, w: 800, c: '#3730A3', m: 1 }) + t(420, 64, 'TOTAL', { s: 10.5, w: 800, c: '#1E3A5F', m: 1 })) +
          contador(24, 72, 440, '1. Medicação Oral', '12', '8', 1.2) + contador(24, 120, 440, '2. Injecção EV', '6', '4', 2.4) + contador(24, 168, 440, '3. Avaliação da TA', '18', '16', 3.6) + contador(24, 216, 440, '4. Pensos', '3', '', 4.8) +
          a(9, '<rect x="380" y="16" width="116" height="26" rx="13" fill="#ECFDF5" stroke="#A7F3D0"/>' + t(438, 33, '✓ Guardado', { s: 11.5, w: 800, c: '#047857', m: 1 }))); } },
      { dur: 18, cor: '#059669', titulo: 'Guardar e Editar', falas: ['No fim do turno carregue em Guardar: o serviço fica Concluído, com um visto verde, e as caixas ficam protegidas.', 'Para corrigir depois, carregue em Editar. Durante o preenchimento nada é bloqueado sozinho, e dois serviços podem registar ao mesmo tempo.'],
        svg: function () { return svg('#F8FAFC', titulo('Guardar e Editar', '#059669') +
          cartao(24, 60, 226, 96, '#ECFDF5', '#A7F3D0', 'Guardar', 'conclui o serviço (visto verde)', 0.8, '#065F46') +
          cartao(270, 60, 226, 96, '#EEF4FB', '#BFD3EA', 'Editar', 'volta a abrir para corrigir', 5.5, '#1E3A5F') +
          a(9, '<rect x="24" y="176" width="472" height="86" rx="12" fill="#fff" stroke="#E3E8F0"/>' + t(40, 206, 'Durante o preenchimento nada bloqueia sozinho', { s: 13, w: 800 }) + t(40, 232, 'dois serviços na mesma página podem escrever ao mesmo tempo', { s: 12, c: '#475569' }))); } },
      { dur: 18, cor: '#D97706', titulo: 'Relatórios', falas: ['No menu tem o Resumo diário e os relatórios semanal, mensal, trimestral, semestral e anual, a comparação entre períodos e a Tabela 13.', 'Cada relatório pode ser exportado em PDF ou enviado por email.'],
        svg: relatorios('Relatórios', '#D97706', ['Resumo diário', 'Semanal', 'Mensal', 'Trimestral', 'Semestral', 'Anual'], ['Exportar PDF', 'e enviar por email']) },
      { dur: 16, cor: '#64748B', titulo: 'Regras de ouro', falas: ['Três regras de ouro. Registe no fim de cada turno. Confirme a data antes de escrever. E carregue em Guardar quando o serviço estiver completo. Obrigado!'],
        svg: regras(['Registe no fim de cada turno', 'Dia e Noite, só números'], ['Confirme a data antes de escrever', 'no topo da página'], ['Guardar quando estiver completo', 'Editar para corrigir depois']) }
    ] },

    // ── Bloco Operatório ──
    bloco: { titulo: 'Como registar no Bloco Operatório', cenas: [
      { dur: 11, cor: '#1E3A5F', titulo: 'Abertura', falas: ['Olá! Neste vídeo vamos ver como registar as cirurgias do Bloco Operatório, dia a dia.'],
        svg: abertura('Bloco', 'Operatório', 'Registo diário das cirurgias', '<g transform="translate(20,34)"><circle cx="55" cy="36" r="30" fill="#FDE68A"/><path d="M25 36h60" stroke="#F59E0B" stroke-width="4"/><rect x="10" y="80" width="90" height="16" rx="6" fill="#0891B2"/><rect x="18" y="96" width="6" height="30" fill="#94A3B8"/><rect x="86" y="96" width="6" height="30" fill="#94A3B8"/></g>') },
      { dur: 24, cor: '#0891B2', titulo: 'Registar uma cirurgia', falas: ['Para registar, abra uma nova ficha de cirurgia. O formulário está dividido em secções numeradas.', 'São obrigatórios a especialidade, o género e o tipo de anestesia. Indique também se a cirurgia foi eletiva ou urgente.', 'A idade e o diagnóstico são opcionais; pode juntar vários diagnósticos, e o CID também é opcional.'],
        svg: function () { return svg('#F8FAFC', titulo('Registar uma cirurgia', '#0891B2') +
          campo(24, 70, 230, 'ESPECIALIDADE', 'Cirurgia Geral', 2.5, 1) + campo(266, 70, 110, 'GÉNERO', 'Masculino', 3.0, 1) + campo(388, 70, 108, 'TIPO', 'Urgente', 4.0, 0) +
          campo(24, 132, 230, 'ANESTESIA', 'Raquidiana', 3.5, 1) + campo(266, 132, 110, 'IDADE', '34', 9, 0) +
          campo(24, 194, 352, 'DIAGNÓSTICO (opcional)', 'Apendicite aguda', 10, 0) + campo(388, 194, 108, 'CID', 'K35', 11, 0) +
          a(12, '<rect x="24" y="244" width="200" height="24" rx="12" fill="#ECFEFF" stroke="#A5F3FC"/>' + t(36, 261, '+ juntar outro diagnóstico', { s: 11, w: 700, c: '#0E7490' }))); } },
      { dur: 16, cor: '#7C3AED', titulo: 'Guardar', falas: ['Em baixo vê sempre o resumo da ficha e o que ainda falta preencher. O botão Guardar está sempre visível.', 'Guarde cada cirurgia logo que termina.'],
        svg: function () { return svg('#F8FAFC', titulo('Resumo e Guardar', '#7C3AED') +
          a(0.8, '<rect x="24" y="60" width="472" height="120" rx="14" fill="#fff" stroke="#E3E8F0"/>' + t(40, 90, 'Cirurgia Geral · Masculino · Raquidiana · Urgente', { s: 13, w: 700 }) + t(40, 116, 'Diagnóstico: Apendicite aguda (K35)', { s: 12, c: '#475569' })) +
          a(3, '<rect x="40" y="134" width="170" height="30" rx="15" fill="#ECFDF5" stroke="#A7F3D0"/>' + t(125, 154, '✓ Obrigatórios completos', { s: 11.5, w: 800, c: '#047857', m: 1 })) +
          a(6, '<rect x="24" y="200" width="472" height="56" rx="14" fill="#1E3A5F"/>' + t(40, 233, 'Resumo sempre visível', { s: 12.5, w: 700, c: '#CBD5E1' }) + '<rect x="386" y="212" width="98" height="32" rx="10" fill="#059669"/>' + t(435, 233, '✓ Guardar', { s: 13, w: 800, c: '#fff', m: 1 }))); } },
      { dur: 18, cor: '#D97706', titulo: 'Relatórios', falas: ['Nos relatórios vê as cirurgias por especialidade, eletivas e urgentes, e por anestesia e sexo, no mês, trimestre, semestre ou ano.', 'Tudo pode ser exportado em PDF.'],
        svg: relatorios('Relatórios do Bloco', '#D97706', ['Por especialidade', 'Eletivas · Urgentes', 'Anestesia e sexo', 'Mensal', 'Trimestral', 'Anual'], ['Exportar PDF', 'para a direção']) },
      { dur: 15, cor: '#64748B', titulo: 'Regras de ouro', falas: ['Três regras de ouro. Registe cada cirurgia no próprio dia. Preencha sempre especialidade, género e anestesia. E confira o resumo antes de guardar. Obrigado!'],
        svg: regras(['Registe cada cirurgia no próprio dia', 'uma ficha por cirurgia'], ['Especialidade, género e anestesia', 'são obrigatórios'], ['Confira o resumo antes de guardar', 'e corrija se faltar algo']) }
    ] },

    // ── Imagiologia ──
    imagiologia: { titulo: 'Como registar na Imagiologia', cenas: [
      { dur: 11, cor: '#1E3A5F', titulo: 'Abertura', falas: ['Olá! Neste vídeo vamos ver como registar os exames da Imagiologia: Raio X, Ecografia e TAC.'],
        svg: abertura('Imagiologia', '/ Radiologia', 'Registo diário de exames', '<g transform="translate(24,30)"><rect x="6" y="6" width="96" height="120" rx="10" fill="#0F172A"/><path d="M54 20 v90 M34 36 h40 M30 54 h48 M30 72 h48 M34 90 h40" stroke="#E2E8F0" stroke-width="5" stroke-linecap="round" opacity=".85"/></g>') },
      { dur: 22, cor: '#0891B2', titulo: 'Registo diário de exames', falas: ['Escolha a data e registe quantos exames fez de cada tipo.', 'O Raio X, as Ecografias — abdominal, obstétrica, renal e outras — e as TAC, por região.', 'Os contadores somam sozinhos o total do dia.'],
        svg: function () { return svg('#F8FAFC', titulo('Registo diário de exames', '#0891B2') +
          ['Raio X', 'Ecografia', 'TAC'].map(function (x, k) { var X = [24, 186, 348][k], cor = ['#1E3A5F', '#0E7490', '#6D28D9'][k], f = ['#EEF4FB', '#ECFEFF', '#F5F3FF'][k], b = ['#BFD3EA', '#A5F3FC', '#DDD6FE'][k];
            return a([2.5, 4, 7][k], '<rect x="' + X + '" y="56" width="' + (k === 2 ? 148 : 150) + '" height="150" rx="14" fill="' + f + '" stroke="' + b + '"/>' + t(X + 16, 84, x, { s: 15, w: 800, c: cor })); }).join('') +
          a(3, t(99, 160, '38', { s: 44, w: 800, c: '#1E3A5F', m: 1 })) +
          a(5, t(202, 116, 'Abdominal 9', { s: 12, c: '#0E7490' }) + t(202, 138, 'Obstétrica 7', { s: 12, c: '#0E7490' }) + t(202, 160, 'Renal 4', { s: 12, c: '#0E7490' }) + t(202, 182, 'e outras…', { s: 12, c: '#0E7490' })) +
          a(8, t(364, 116, 'Crânio 3', { s: 12, c: '#6D28D9' }) + t(364, 138, 'Abdominal 2', { s: 12, c: '#6D28D9' }) + t(364, 160, 'Coluna 1', { s: 12, c: '#6D28D9' })) +
          a(12, '<rect x="24" y="222" width="472" height="42" rx="12" fill="#1E3A5F"/>' + t(260, 248, '∑ Total do dia: 64 exames', { s: 14, w: 800, c: '#fff', m: 1 }))); } },
      { dur: 18, cor: '#D97706', titulo: 'Análise e relatórios', falas: ['Na Análise Estatística escolha o mês, o trimestre, o semestre ou o ano, e veja o total geral do período.', 'Nos Relatórios PDF pode pré-visualizar e descarregar o relatório.'],
        svg: relatorios('Análise estatística e relatórios', '#D97706', ['Mês', 'Trimestre', 'Semestre', 'Ano', 'Registos anteriores', 'Total do período'], ['Pré-visualizar', 'e descarregar']) },
      { dur: 15, cor: '#64748B', titulo: 'Regras de ouro', falas: ['Três regras de ouro. Registe os exames no próprio dia. Confirme a data antes de escrever. E faça cópias de segurança com regularidade. Obrigado!'],
        svg: regras(['Registe os exames no próprio dia', 'por tipo de exame'], ['Confirme a data antes de escrever', 'para não trocar dias'], ['Faça cópias de segurança', 'no menu Backup / Exportar']) }
    ] },

    // ── Hemoterapia ──
    hemoterapia: { titulo: 'Como registar na Hemoterapia', cenas: [
      { dur: 11, cor: '#1E3A5F', titulo: 'Abertura', falas: ['Olá! Neste vídeo vamos ver como registar a atividade da Hemoterapia: colheitas, transfusões, provas e reagentes.'],
        svg: abertura('Hemoterapia', '', 'Registo por turno', '<g transform="translate(36,26)"><path d="M40 0 C40 0 0 50 0 76 a40 40 0 0 0 80 0 C80 50 40 0 40 0z" fill="#DC2626"/><path d="M22 80 a18 18 0 0 0 18 18" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".7"/></g>') },
      { dur: 20, cor: '#DC2626', titulo: 'Colheitas e transfusões', falas: ['Escolha a data e o turno.', 'Registe o sangue colhido, consumido e perdido, em centímetros cúbicos.', 'E as transfusões por componente: glóbulos, plasmas, plaquetas e crioprecipitado.'],
        svg: function () { return svg('#F8FAFC', titulo('Colheitas e transfusões', '#DC2626') +
          campo(24, 70, 150, 'DATA', '29/09/2026', 0.8, 1) + campo(186, 70, 150, 'TURNO', 'Manhã', 1.4, 1) +
          cartao(24, 124, 150, 58, '#FEF2F2', '#FECACA', 'Colhido', '4 500 cc', 3, '#991B1B') + cartao(186, 124, 150, 58, '#FFFBEB', '#FDE68A', 'Consumido', '3 900 cc', 3.6, '#92400E') + cartao(348, 124, 148, 58, '#F1F5F9', '#CBD5E1', 'Perdido', '0 cc', 4.2, '#334155') +
          ['Glóbulos', 'Plasmas', 'Plaquetas', 'Crio'].map(function (x, i) { return a(8 + i * 0.6, '<rect x="' + (24 + i * 119) + '" y="200" width="109" height="60" rx="12" fill="#fff" stroke="#E3E8F0"/>' + t(78 + i * 119, 224, x, { s: 12, w: 700, c: '#475569', m: 1 }) + t(78 + i * 119, 248, String([12, 6, 3, 1][i]), { s: 18, w: 800, c: '#DC2626', m: 1 })); }).join('')); } },
      { dur: 18, cor: '#7C3AED', titulo: 'Provas e reagentes', falas: ['Registe também o número de provas de compatibilidade.', 'E os reagentes de serologia usados: VIH, hepatite B, hepatite C e VDRL. O total de reagentes soma sozinho.'],
        svg: function () { return svg('#F8FAFC', titulo('Provas e reagentes', '#7C3AED') +
          cartao(24, 60, 472, 56, '#F5F3FF', '#DDD6FE', 'Provas de compatibilidade: 18', '', 0.8, '#4C1D95') +
          ['VIH', 'HBs', 'HCV', 'VDRL'].map(function (x, i) { return a(4 + i * 0.6, '<rect x="' + (24 + i * 119) + '" y="136" width="109" height="70" rx="12" fill="#fff" stroke="#E3E8F0"/>' + t(78 + i * 119, 162, x, { s: 13, w: 800, c: '#6D28D9', m: 1 }) + t(78 + i * 119, 190, String([24, 20, 20, 16][i]), { s: 20, w: 800, c: '#0F172A', m: 1 })); }).join('') +
          a(10, '<rect x="24" y="222" width="472" height="40" rx="12" fill="#1E3A5F"/>' + t(260, 247, 'Total de reagentes de serologia: 80', { s: 13.5, w: 800, c: '#fff', m: 1 }))); } },
      { dur: 16, cor: '#D97706', titulo: 'Relatórios', falas: ['No menu tem os relatórios semanal, mensal, trimestral, semestral e anual, o histórico e as cópias de segurança.', 'Tudo pode ser exportado em PDF.'],
        svg: relatorios('Relatórios da Hemoterapia', '#D97706', ['Semanal', 'Mensal', 'Trimestral', 'Semestral', 'Anual', 'Histórico'], ['Exportar PDF', 'e cópias de segurança']) },
      { dur: 15, cor: '#64748B', titulo: 'Regras de ouro', falas: ['Três regras de ouro. Registe no fim de cada turno. Escreva as quantidades em centímetros cúbicos. E confira os totais antes de sair. Obrigado!'],
        svg: regras(['Registe no fim de cada turno', 'com a data e o turno certos'], ['Quantidades de sangue em cc', 'colhido, consumido e perdido'], ['Confira os totais antes de sair', 'transfusões e reagentes']) }
    ] },

    // ── Consulta Externa ──
    consulta: { titulo: 'Como registar na Consulta Externa', cenas: [
      { dur: 11, cor: '#1E3A5F', titulo: 'Abertura', falas: ['Olá! Neste vídeo vamos ver como registar as consultas da Consulta Externa: cada especialidade, cada dia, médico a médico.'],
        svg: abertura('Consulta', 'Externa', 'Registo diário por especialidade e por médico', '<g transform="translate(30,24)"><rect x="6" y="10" width="78" height="104" rx="8" fill="#DCFCE7" stroke="#059669" stroke-width="4"/><rect x="30" y="0" width="30" height="18" rx="5" fill="#059669"/><circle cx="45" cy="52" r="15" fill="#059669"/><path d="M38 52h14M45 45v14" stroke="#fff" stroke-width="4" stroke-linecap="round"/><rect x="22" y="80" width="46" height="7" rx="3.5" fill="#86EFAC"/><rect x="22" y="94" width="34" height="7" rx="3.5" fill="#86EFAC"/></g>') },
      { dur: 18, cor: '#059669', titulo: 'Identificação da consulta', falas: ['Abra o Registo e comece pela identificação da consulta: a especialidade, a data e o turno.', 'Se foi atendimento à tarde ou em horas extra, marque essa opção. Os campos com asterisco vermelho são obrigatórios.'],
        svg: function () { return svg('#F8FAFC', titulo('1. Identificação da consulta', '#059669') +
          campo(24, 72, 220, 'ESPECIALIDADE', 'Cardiologia', 0.8, 1) + campo(262, 72, 234, 'DATA', '29/09/2026', 1.6, 1) +
          campo(24, 138, 220, 'TURNO', 'Manhã', 3, 0) +
          a(8, '<rect x="262" y="138" width="234" height="36" rx="8" fill="#FFFBEB" stroke="#FDE68A" stroke-width="1.5"/><rect x="274" y="148" width="16" height="16" rx="4" fill="#D97706"/><path d="M277 156l4 4 6-8" stroke="#fff" stroke-width="2.5" fill="none"/>' + t(298, 161, 'Tarde / Horas extra', { s: 12.5, w: 700, c: '#92400E' })) +
          campo(24, 206, 472, 'OBSERVAÇÕES', 'Opcional', 5, 0) +
          a(10, t(412, 272, '* obrigatório', { s: 11, w: 700, c: '#DC2626' }))); } },
      { dur: 22, cor: '#0891B2', titulo: 'O médico e a equipa', falas: ['Depois preencha o formulário do médico: o nome, o consultório ou sala, as consultas agendadas e as consultas realizadas.', 'Os ausentes são calculados sozinhos: agendadas menos realizadas.', 'Junte também as enfermeiras deste turno. Na Estomatologia, a equipa de apoio chama-se técnico.'],
        svg: function () { return svg('#F8FAFC', titulo('2. Médico 1 — dados das consultas', '#0891B2') +
          campo(24, 72, 300, 'MÉDICO(A)', 'Dra. Maria Santos', 0.8, 1) + campo(340, 72, 156, 'CONSULTÓRIO / SALA', '3', 1.6, 0) +
          cartao(24, 128, 150, 60, '#EFF6FF', '#BFDBFE', 'Agendadas', '20', 3, '#1E40AF') +
          cartao(186, 128, 150, 60, '#ECFDF5', '#A7F3D0', 'Realizadas', '17', 4, '#065F46') +
          a(7, '<rect x="348" y="128" width="148" height="60" rx="12" fill="#FEF2F2" stroke="#FECACA"/>' + t(362, 152, 'Ausentes', { s: 13, w: 800, c: '#991B1B' }) + t(362, 172, '3  · automático', { s: 11, c: '#475569' })) +
          a(7.6, t(260, 208, '20 agendadas − 17 realizadas = 3 ausentes', { s: 12.5, w: 700, c: '#334155', m: 1 })) +
          a(12, '<rect x="24" y="224" width="472" height="42" rx="12" fill="#fff" stroke="#E3E8F0"/>' + t(38, 250, 'Enfermeiras do turno:', { s: 12, w: 700, c: '#475569' }) +
            '<rect x="186" y="233" width="116" height="24" rx="12" fill="#E0F2FE"/>' + t(244, 250, 'Enf. Joana', { s: 11.5, w: 700, c: '#0369A1', m: 1 }) +
            '<rect x="310" y="233" width="116" height="24" rx="12" fill="#E0F2FE"/>' + t(368, 250, 'Enf. Paula', { s: 11.5, w: 700, c: '#0369A1', m: 1 }))); } },
      { dur: 26, cor: '#7C3AED', titulo: 'Doentes, proveniência e diagnóstico', falas: ['Registe os doentes observados por faixa etária e género, a proveniência, isto é, o município de onde vêm, e os diagnósticos com as quantidades.', 'Atenção: a soma da proveniência e a soma dos diagnósticos têm de ser iguais às consultas realizadas. Se não forem, o sistema avisa e não deixa gravar.'],
        svg: function () { return svg('#F8FAFC', titulo('3. Doentes, proveniência e diagnóstico', '#7C3AED') +
          a(0.8, '<rect x="24" y="56" width="150" height="150" rx="12" fill="#fff" stroke="#E3E8F0"/>' + t(99, 78, 'Faixa etária', { s: 12, w: 800, c: '#6D28D9', m: 1 }) +
            [['0–14', 3], ['15–24', 4], ['25–44', 6], ['45–64', 3], ['65+', 1]].map(function (x, i) { return t(40, 102 + i * 20, x[0], { s: 11.5, c: '#475569' }) + t(146, 102 + i * 20, String(x[1]), { s: 12, w: 800 }); }).join('')) +
          a(2.4, '<rect x="186" y="56" width="150" height="150" rx="12" fill="#fff" stroke="#E3E8F0"/>' + t(261, 78, 'Proveniência', { s: 12, w: 800, c: '#6D28D9', m: 1 }) +
            [['Lubango', 10], ['Humpata', 4], ['Chibia', 3]].map(function (x, i) { return t(200, 106 + i * 24, x[0], { s: 11.5, c: '#475569' }) + t(308, 106 + i * 24, String(x[1]), { s: 12, w: 800 }); }).join('') + t(261, 190, 'Soma = 17', { s: 12.5, w: 800, c: '#059669', m: 1 })) +
          a(4.2, '<rect x="348" y="56" width="148" height="150" rx="12" fill="#fff" stroke="#E3E8F0"/>' + t(422, 78, 'Diagnóstico', { s: 12, w: 800, c: '#6D28D9', m: 1 }) +
            [['HTA', 9], ['Insuf. cardíaca', 5], ['Arritmia', 3]].map(function (x, i) { return t(360, 106 + i * 24, x[0], { s: 11.5, c: '#475569' }) + t(470, 106 + i * 24, String(x[1]), { s: 12, w: 800 }); }).join('') + t(422, 190, 'Soma = 17', { s: 12.5, w: 800, c: '#059669', m: 1 })) +
          a(12, '<rect x="24" y="220" width="472" height="46" rx="12" fill="#ECFDF5" stroke="#6EE7B7"/>' + t(260, 249, 'Proveniência 17 = Diagnóstico 17 = Realizadas 17  ✓', { s: 13.5, w: 800, c: '#065F46', m: 1 }))); } },
      { dur: 14, cor: '#D97706', titulo: 'Procedimentos e material', falas: ['Se houve procedimentos ou material gasto, junte-os com o botão Adicionar e escreva a quantidade.'],
        svg: function () { return svg('#F8FAFC', titulo('4. Procedimentos e material', '#D97706') +
          cartao(24, 64, 230, 96, '#FFFBEB', '#FDE68A', 'Procedimentos', 'ECG · 4    Pensos · 6', 0.8, '#92400E') +
          cartao(266, 64, 230, 96, '#FFF7ED', '#FED7AA', 'Material', 'Luvas · 30    Seringas · 12', 2, '#9A3412') +
          a(4, '<rect x="24" y="180" width="170" height="40" rx="10" fill="#D97706"/>' + t(109, 205, '+ Adicionar', { s: 13, w: 800, c: '#fff', m: 1 })) +
          a(5, t(210, 205, 'escolha o item e escreva a quantidade', { s: 12.5, c: '#475569' }))); } },
      { dur: 20, cor: '#1E3A5F', titulo: 'Vários médicos no mesmo dia', falas: ['Se na mesma especialidade trabalharam vários médicos, carregue em Adicionar Médico: o formulário atual é guardado e abre-se o seguinte.', 'No fim, Ver Resumo da Especialidade do Dia mostra os totais de todos os médicos somados. Cada médico tem também o seu próprio PDF.'],
        svg: function () { return svg('#F8FAFC', titulo('5. Vários médicos no mesmo dia', '#1E3A5F') +
          [['Médico 1', '17'], ['Médico 2', '12'], ['Médico 3', '9']].map(function (x, i) { return a(0.8 + i * 1.6, '<rect x="' + (24 + i * 124) + '" y="64" width="112" height="70" rx="12" fill="#fff" stroke="#CBD5E1"/>' + t(80 + i * 124, 90, x[0], { s: 12, w: 700, c: '#475569', m: 1 }) + t(80 + i * 124, 118, x[1], { s: 20, w: 800, c: '#1E3A5F', m: 1 })); }).join('') +
          a(1.2, '<rect x="396" y="64" width="100" height="70" rx="12" fill="#1E3A5F"/>' + t(446, 94, '+ Adicionar', { s: 11.5, w: 800, c: '#fff', m: 1 }) + t(446, 112, 'Médico', { s: 11.5, w: 800, c: '#fff', m: 1 })) +
          a(10, '<rect x="24" y="156" width="472" height="56" rx="12" fill="#ECFDF5" stroke="#6EE7B7"/>' + t(40, 180, 'Resumo da Especialidade do Dia', { s: 13, w: 800, c: '#065F46' }) + t(40, 200, 'Realizadas: 17 + 12 + 9 = 38', { s: 12.5, c: '#065F46' })) +
          a(14, '<rect x="24" y="226" width="160" height="40" rx="10" fill="#FEF2F2" stroke="#FECACA"/>' + t(104, 251, 'PDF deste Médico', { s: 12, w: 800, c: '#B91C1C', m: 1 }))); } },
      { dur: 18, cor: '#0F766E', titulo: 'Dashboard, histórico e relatórios', falas: ['O Dashboard mostra as especialidades atendidas hoje, a produtividade do mês e as patologias mais frequentes.', 'No Histórico encontra as sessões registadas. Nos Relatórios escolhe o período, diário, semanal, mensal, trimestral, semestral ou anual, e exporta em PDF.'],
        svg: relatorios('6. Dashboard, histórico e relatórios', '#0F766E', ['Diário', 'Semanal', 'Mensal', 'Trimestral', 'Semestral', 'Anual'], ['Exportar PDF', 'por período']) },
      { dur: 15, cor: '#64748B', titulo: 'Regras de ouro', falas: ['Três regras de ouro. Registe no próprio dia, especialidade a especialidade. Confirme que as somas batem certo com as consultas realizadas. E um formulário por cada médico. Obrigado!'],
        svg: regras(['Registe no próprio dia', 'especialidade a especialidade'], ['As somas batem com as realizadas', 'proveniência e diagnóstico'], ['Um formulário por cada médico', 'o resumo soma todos']) }
    ] },

    // ── Laboratório ──
    laboratorio: { titulo: 'Como registar no Laboratório', cenas: [
      { dur: 11, cor: '#1E3A5F', titulo: 'Abertura', falas: ['Olá! Neste vídeo vamos ver como registar os exames do Laboratório, todos os dias.'],
        svg: abertura('Laboratório', '', 'Registo diário de exames', '<g transform="translate(36,26)"><path d="M26 0 h28 v44 l26 60 a10 10 0 0 1 -9 14 h-62 a10 10 0 0 1 -9 -14 l26 -60z" fill="#E0F2FE" stroke="#0891B2" stroke-width="4"/><path d="M6 96 h68 l6 14 h-80z" fill="#0891B2"/></g>') },
      { dur: 22, cor: '#0891B2', titulo: 'Registo diário de exames', falas: ['No Registo Diário escolha a data e registe o número de exames de cada área.', 'Hematologia, Bioquímica, Parasitologia, Urina e Imunologia. Os totais somam sozinhos.'],
        svg: function () { return svg('#F8FAFC', titulo('Registo diário de exames', '#0891B2') +
          campo(24, 66, 170, 'DATA', '29/09/2026', 0.8, 1) +
          ['Hematologia', 'Bioquímica', 'Parasitologia', 'Urina', 'Imunologia'].map(function (x, i) { var col = i % 3, lin = Math.floor(i / 3); return a(3 + i * 0.8, '<rect x="' + (24 + col * 160) + '" y="' + (118 + lin * 70) + '" width="148" height="60" rx="12" fill="#fff" stroke="#E3E8F0"/>' + t(98 + col * 160, 140 + lin * 70, x, { s: 12, w: 700, c: '#475569', m: 1 }) + t(98 + col * 160, 166 + lin * 70, String([46, 38, 22, 30, 12][i]), { s: 18, w: 800, c: '#0891B2', m: 1 })); }).join('') +
          a(10, '<rect x="344" y="188" width="152" height="60" rx="12" fill="#1E3A5F"/>' + t(420, 212, 'Total do dia', { s: 11.5, w: 700, c: '#CBD5E1', m: 1 }) + t(420, 238, '148', { s: 20, w: 800, c: '#fff', m: 1 }))); } },
      { dur: 18, cor: '#D97706', titulo: 'Dashboard e relatórios', falas: ['O Dashboard mostra a evolução dos exames. Nos relatórios semanal, mensal, trimestral, semestral e anual pode comparar períodos.', 'No Histórico estão todos os registos, e tudo pode ser exportado em PDF.'],
        svg: relatorios('Dashboard e relatórios', '#D97706', ['Dashboard', 'Semanal', 'Mensal', 'Trimestral', 'Anual', 'Comparar com'], ['Exportar PDF', 'e Histórico']) },
      { dur: 15, cor: '#64748B', titulo: 'Regras de ouro', falas: ['Três regras de ouro. Registe os exames no próprio dia. Confirme a data antes de escrever. E faça cópias de segurança com regularidade. Obrigado!'],
        svg: regras(['Registe os exames no próprio dia', 'por área do laboratório'], ['Confirme a data antes de escrever', 'para não trocar dias'], ['Faça cópias de segurança', 'dia, semana, mês ou geral']) }
    ] }
  };

  var def = /^procedimentos_enfermagem_/.test(pagina) && !/index/.test(pagina) ? DEFS.procedimentos :
    /bloco_operatorio_registo/.test(pagina) ? DEFS.bloco :
    /imagiologia/.test(pagina) ? DEFS.imagiologia :
    /hemoterapia/.test(pagina) ? DEFS.hemoterapia :
    /^consulta_externa_geral/.test(pagina) ? DEFS.consulta :
    /laborat/.test(pagina) ? DEFS.laboratorio : null;
  if (def) window.ZELO_VIDEO_DEF = def;
})();
