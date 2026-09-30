// ── ZELO — Vídeo de instruções: "Como funciona o Controlo de Pacientes" ──
// Usa o leitor de zelo_video_movimento.js (carregado antes). O botão de ajuda
// do cabeçalho passa a "Instruções" e abre este vídeo (9 cenas, cerca de 4 minutos — cada cena dura o tempo da narração,
// narração em português com a voz do aparelho e legendas).
// Não usa o Firebase nem descarrega ficheiros.
(function () {
  var V = window.ZeloVideoMov; if (!V || !V.h || window.ZELO_VIDEO_DEF) return;
  var a = V.h.a, t = V.h.t, svg = V.h.svg, camas = V.h.camas;

  function campo(x, y, w, rot, val, d, obrig, cor) {
    return a(d, '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="38" rx="8" fill="#fff" stroke="' + (cor || '#CBD5E1') + '" stroke-width="1.5"/>' +
      t(x + 10, y - 6, rot + (obrig ? ' <tspan fill="#DC2626">*</tspan>' : ''), { s: 10.5, w: 700, c: '#475569' }) + t(x + 12, y + 24, val, { s: 12.5, c: '#0F172A' }));
  }
  function botao(x, y, w, txt, fundo, cor, d) { return a(d, '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="32" rx="9" fill="' + fundo + '"/>' + t(x + w / 2, y + 21, txt, { s: 12, w: 700, c: cor, m: 1 })); }

  var CENAS = [
    { dur: 17, cor: '#1E3A5F', titulo: 'Abertura',
      falas: ['Olá! Neste vídeo vamos ver como funciona o Controlo de Pacientes: o registo de cada doente internado no serviço, da entrada até à saída.', 'É daqui que sai, sozinho, o Movimento Hospitalar.'],
      svg: function () {
        return svg('#12243B',
          a(0.2, '<g transform="translate(70,70)"><rect x="0" y="0" width="130" height="160" rx="12" fill="#F8FAFC"/><rect x="40" y="-12" width="50" height="24" rx="6" fill="#94A3B8"/>' +
            '<rect x="18" y="34" width="94" height="8" rx="4" fill="#CBD5E1"/><rect x="18" y="56" width="70" height="8" rx="4" fill="#CBD5E1"/><rect x="18" y="78" width="84" height="8" rx="4" fill="#CBD5E1"/>' +
            '<path d="M20 112 l12 12 24 -26" stroke="#16A34A" stroke-width="6" fill="none" stroke-linecap="round"/></g>') +
          camas([[88, 238, 'd', 0.8], [150, 238, 'd', 1.0]]) +
          a(1.4, t(250, 112, 'ZELO · HOSPITAL DO PRENDA', { s: 13, w: 700, c: '#7DD3FC' })) +
          a(1.8, t(250, 150, 'Controlo de', { s: 30, w: 800, c: '#fff' }) + t(250, 184, 'Pacientes', { s: 30, w: 800, c: '#fff' })) +
          a(2.4, t(250, 214, 'Do registo de entrada à saída do doente', { s: 14, c: '#CBD5E1' })));
      } },
    { dur: 30, cor: '#0891B2', titulo: 'Registar um doente novo',
      falas: ['Para registar um doente, carregue em Novo Paciente.', 'Preencha o nome, o NUP, a idade, o género, a data e hora de entrada e o diagnóstico. Os campos com asterisco são obrigatórios.', 'O CID é opcional, e pode juntar vários diagnósticos. Indique também a proveniência: Banco de Urgência ou transferência de outro serviço.', 'No fim, carregue em Criar.'],
      svg: function () {
        return svg('#F8FAFC',
          a(0.1, t(24, 34, 'Novo Paciente', { s: 17, w: 800, c: '#0891B2' })) + botao(380, 16, 120, '＋ Novo Paciente', '#1E3A5F', '#fff', 0.4) +
          campo(24, 70, 300, 'NOME', 'Maria dos Santos', 2.0, 1) + campo(336, 70, 160, 'NUP', '104 522', 2.4, 1) +
          campo(24, 128, 90, 'IDADE', '47', 3.0, 1) + campo(124, 128, 140, 'GÉNERO', 'Feminino', 3.4, 1) + campo(274, 128, 222, 'DATA DE ENTRADA', '29/09/2026 08:30', 3.8, 1) +
          campo(24, 186, 350, 'DIAGNÓSTICO', 'Pneumonia', 5.0, 1) + campo(384, 186, 112, 'CID-10', 'J18', 6.0, 0, '#A5F3FC') +
          a(10, '<rect x="24" y="236" width="240" height="26" rx="13" fill="#ECFEFF" stroke="#A5F3FC"/>' + t(36, 253, '+ Hipertensão   + Diabetes', { s: 11.5, w: 700, c: '#0E7490' })) +
          a(13, '<rect x="274" y="236" width="140" height="26" rx="8" fill="#fff" stroke="#CBD5E1"/>' + t(284, 253, 'Banco de Urgência', { s: 11.5, c: '#0F172A' })) +
          botao(424, 234, 72, '✓ Criar', '#059669', '#fff', 18));
      } },
    { dur: 27, cor: '#7C3AED', titulo: 'Processo clínico e NUP',
      falas: ['Cada doente tem um só NUP, e o sistema não deixa repetir o mesmo número em doentes diferentes.', 'No Processo clínico pode procurar por nome ou por NUP, em todos os serviços.', 'Se o doente voltar, fica registado como novo internamento do mesmo processo. E nada é apagado: um registo anulado vai para o arquivo.'],
      svg: function () {
        return svg('#F8FAFC',
          a(0.1, t(24, 34, 'Processo clínico e NUP', { s: 17, w: 800, c: '#7C3AED' })) +
          a(0.6, '<rect x="24" y="52" width="472" height="40" rx="20" fill="#fff" stroke="#DDD6FE" stroke-width="2"/><circle cx="48" cy="72" r="8" fill="none" stroke="#7C3AED" stroke-width="2.5"/><path d="M54 78 l8 8" stroke="#7C3AED" stroke-width="2.5"/>' + t(70, 77, 'Nome ou NUP…  ex.: 104 522', { s: 13, c: '#64748B' })) +
          a(6.5, '<g transform="translate(24,110)"><path d="M0 12 h70 l12 -12 h118 v150 h-200z" fill="#EDE9FE"/><rect x="0" y="12" width="200" height="138" rx="6" fill="#F5F3FF" stroke="#DDD6FE"/>' +
            t(14, 40, 'Maria dos Santos', { s: 13.5, w: 800, c: '#4C1D95' }) + t(14, 58, 'NUP 104 522', { s: 11.5, c: '#6D28D9' }) +
            '<rect x="14" y="72" width="172" height="28" rx="7" fill="#fff"/>' + t(24, 91, '1.º internamento · Alta', { s: 11, c: '#334155' }) +
            '<rect x="14" y="106" width="172" height="28" rx="7" fill="#fff" stroke="#7C3AED"/>' + t(24, 125, '2.º internamento · Internado', { s: 11, w: 700, c: '#4C1D95' }) + '</g>') +
          a(3.0, '<rect x="250" y="110" width="246" height="46" rx="12" fill="#fff" stroke="#E3E8F0"/>' + t(264, 138, 'NUP único — sem repetições', { s: 13, w: 700, c: '#0F172A' })) +
          a(11, '<rect x="250" y="166" width="246" height="46" rx="12" fill="#fff" stroke="#E3E8F0"/>' + t(264, 194, 'Voltou? Novo internamento', { s: 13, w: 700, c: '#0F172A' })) +
          a(14, '<rect x="250" y="222" width="246" height="46" rx="12" fill="#FEF2F2" stroke="#FECACA"/>' + t(264, 250, 'Anular = arquivar, nunca apagar', { s: 13, w: 700, c: '#991B1B' })));
      } },
    { dur: 21, cor: '#059669', titulo: 'Doentes no serviço',
      falas: ['A lista Internados mostra os doentes no serviço, com a cama, os dias de internamento e o diagnóstico.', 'Em cada doente pode Atualizar os dados ou Registar a saída.', 'Use os filtros por idade e a pesquisa para encontrar alguém depressa.'],
      svg: function () {
        var linha = function (y, nome, cama, dias, d) {
          return a(d, '<rect x="24" y="' + y + '" width="472" height="42" rx="10" fill="#fff" stroke="#E3E8F0"/>' + t(40, y + 26, nome, { s: 13, w: 700 }) + t(210, y + 26, cama, { s: 12, c: '#475569' }) + t(290, y + 26, dias, { s: 12, c: '#475569' }) +
            '<rect x="350" y="' + (y + 8) + '" width="70" height="26" rx="8" fill="#EEF4FB"/>' + t(385, y + 25, 'Atualizar', { s: 11, w: 700, c: '#1E3A5F', m: 1 }) + '<rect x="428" y="' + (y + 8) + '" width="58" height="26" rx="8" fill="#F5F3FF"/>' + t(457, y + 25, 'Saída', { s: 11, w: 700, c: '#7C3AED', m: 1 }));
        };
        return svg('#F8FAFC',
          a(0.1, t(24, 34, 'Doentes no serviço', { s: 17, w: 800, c: '#059669' })) +
          a(0.5, '<rect x="24" y="48" width="130" height="28" rx="14" fill="#1E3A5F"/>' + t(89, 67, 'No serviço · 18', { s: 11.5, w: 700, c: '#fff', m: 1 }) + ['0–14', '15–24', '25–44', '45–64', '65+'].map(function (f, i) { return '<rect x="' + (170 + i * 66) + '" y="48" width="58" height="28" rx="14" fill="#fff" stroke="#E3E8F0"/>' + t(199 + i * 66, 67, f, { s: 11, w: 700, c: '#334155', m: 1 }); }).join('')) +
          linha(90, 'Maria dos Santos', 'Cama 4', '2 dias', 1.2) + linha(140, 'João Miguel', 'Cama 7', '5 dias', 1.6) + linha(190, 'Ana Pereira', 'Cama 12', '1 dia', 2.0) +
          a(6, '<rect x="344" y="94" width="152" height="86" rx="12" fill="none" stroke="#F59E0B" stroke-width="3" stroke-dasharray="6 5"/>') +
          a(10, t(24, 262, 'Pesquisa por nome, NUP, cama ou diagnóstico', { s: 12, w: 700, c: '#059669' })));
      } },
    { dur: 24, cor: '#D97706', titulo: 'Registar a saída',
      falas: ['Quando o doente sai, carregue em Saída e escolha o tipo.', 'Alta, para os doentes que saem vivos. Óbito, com a causa, e o sistema separa os de menos de 48 horas e de 48 horas ou mais. Ou transferência, para outro serviço.', 'Registe sempre a data e a hora reais da saída.'],
      svg: function () {
        var op = function (x, fundo, cor, tit, sub, d) { return a(d, '<rect x="' + x + '" y="70" width="148" height="150" rx="16" fill="' + fundo + '"/>' + t(x + 74, 118, tit, { s: 19, w: 800, c: cor, m: 1 }) + sub.map(function (l, i) { return t(x + 74, 146 + i * 20, l, { s: 11.5, c: '#475569', m: 1 }); }).join('')); };
        return svg('#F8FAFC',
          a(0.1, t(24, 34, 'Registar a saída', { s: 17, w: 800, c: '#D97706' })) +
          op(24, '#ECFDF5', '#059669', 'Alta', ['saiu vivo', 'para casa'], 3.5) +
          op(186, '#FEF2F2', '#DC2626', 'Óbito', ['causa + CID', '< 48 h  ·  ≥ 48 h'], 6.5) +
          op(348, '#F5F3FF', '#7C3AED', 'Transferência', ['para outro serviço', 'do hospital'], 11) +
          a(14, '<rect x="24" y="236" width="472" height="36" rx="10" fill="#1E3A5F"/>' + t(260, 259, 'Data e hora de saída = as reais', { s: 13, w: 700, c: '#fff', m: 1 })));
      } },
    { dur: 33, cor: '#DC2626', titulo: 'Sem camas: internar noutro serviço',
      falas: ['Se o serviço não tiver camas livres, o sistema pergunta em que serviço o doente vai ficar, e mostra quantas camas livres tem cada um.', 'O doente fica internado nesse serviço, mas continua a ser do seu serviço de origem: conta nos dias-doente, e nesses dias a cama também conta na origem, mais uma cama nos dias-cama.', 'Quando voltar, carregue em Mover para o serviço: fica com a data de entrada real.'],
      svg: function () {
        var serv = function (x, nome, cor, lot, d) { return a(d, '<rect x="' + x + '" y="60" width="190" height="130" rx="16" fill="#fff" stroke="' + cor + '" stroke-width="2"/>' + t(x + 95, 86, nome, { s: 14, w: 800, c: cor, m: 1 }) + t(x + 95, 176, lot, { s: 11.5, w: 700, c: '#475569', m: 1 })); };
        return svg('#F8FAFC',
          a(0.1, t(24, 34, 'Sem camas: internar noutro serviço', { s: 17, w: 800, c: '#DC2626' })) +
          serv(24, 'Maxilo-Facial', '#DC2626', '12 de 12 camas ocupadas', 0.5) + serv(306, 'Cirurgia Geral', '#059669', '5 camas livres', 2.5) +
          camas([[40, 100, 'd', 0.8], [92, 100, 'd', 0.9], [144, 100, 'd', 1.0], [322, 100, 'c', 2.8], [374, 100, 'c', 2.9], [426, 100, 'd', 7.5]]) +
          a(6.5, '<path d="M220 125 C260 95 280 95 300 125" stroke="#F59E0B" stroke-width="4" fill="none" stroke-dasharray="7 6"/><path d="M296 114 l8 12 -14 2z" fill="#F59E0B"/>') +
          a(9, '<rect x="24" y="204" width="226" height="64" rx="12" fill="#FFFBEB" stroke="#FDE68A"/>' + t(36, 228, 'Pedido de autorização', { s: 12.5, w: 800, c: '#92400E' }) + t(36, 248, 'lembrado até autorizar · 24 h', { s: 11, c: '#92400E' })) +
          a(18, '<rect x="270" y="204" width="226" height="64" rx="12" fill="#ECFDF5" stroke="#A7F3D0"/>' + t(282, 228, '↩ Mover para o serviço', { s: 12.5, w: 800, c: '#065F46' }) + t(282, 248, 'mantém a data de entrada real', { s: 11, c: '#065F46' })));
      } },
    { dur: 45, cor: '#B45309', titulo: 'Doente fora do serviço: o outro serviço autoriza',
      falas: ['Atenção: quando um doente do seu serviço fica internado noutro serviço, esse serviço tem de autorizar no sistema.', 'O pedido aparece logo no outro serviço, com dois botões: Autorizar ou Recusar. Enquanto não responder, o pedido fica pendente e o serviço é lembrado.', 'Se autorizar, a cama passa a contar nesse serviço, e o doente continua a ser do serviço de origem.', 'Se recusar, o serviço de origem é avisado: pode pedir a outro serviço, ou o doente fica no seu serviço. E se passarem 24 horas sem resposta, o serviço de origem também é avisado.'],
      svg: function () {
        var caixa = function (x, y, w, h, fundo, borda, d, c) { return a(d, '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="12" fill="' + fundo + '" stroke="' + borda + '" stroke-width="1.5"/>' + c); };
        return svg('#F8FAFC',
          a(0.1, t(24, 34, 'O outro serviço tem de autorizar', { s: 17, w: 800, c: '#B45309' })) +
          // serviço de origem
          caixa(24, 52, 180, 92, '#fff', '#DC2626', 0.6, t(114, 76, 'Maxilo-Facial', { s: 13.5, w: 800, c: '#DC2626', m: 1 }) + t(114, 98, 'serviço de origem', { s: 11, c: '#64748B', m: 1 }) + t(114, 124, 'Doente: J. Silva', { s: 12, w: 700, c: '#0F172A', m: 1 })) +
          a(3, '<path d="M210 98 H292" stroke="#F59E0B" stroke-width="4" stroke-dasharray="7 6"/><path d="M290 88 l12 10 -12 10z" fill="#F59E0B"/>' + t(251, 88, 'pedido', { s: 10.5, w: 700, c: '#B45309', m: 1 })) +
          // serviço que recebe: pedido com Autorizar / Recusar
          caixa(306, 52, 190, 92, '#FFFBEB', '#F59E0B', 4, t(401, 74, 'Cirurgia Geral', { s: 13.5, w: 800, c: '#92400E', m: 1 }) + t(401, 94, 'Pedido pendente', { s: 11, w: 700, c: '#B45309', m: 1 })) +
          botao(318, 104, 80, 'Autorizar', '#059669', '#fff', 6) + botao(406, 104, 78, 'Recusar', '#DC2626', '#fff', 6.3) +
          // resultados
          caixa(24, 164, 150, 104, '#ECFDF5', '#A7F3D0', 14, t(99, 188, '✓ Autorizado', { s: 13, w: 800, c: '#065F46', m: 1 }) + t(99, 210, 'a cama conta', { s: 11, c: '#065F46', m: 1 }) + t(99, 226, 'na Cirurgia Geral', { s: 11, c: '#065F46', m: 1 }) + t(99, 250, 'doente continua da origem', { s: 10, c: '#065F46', m: 1 })) +
          caixa(185, 164, 150, 104, '#FEF2F2', '#FECACA', 20, t(260, 188, '✕ Recusado', { s: 13, w: 800, c: '#991B1B', m: 1 }) + t(260, 210, 'origem é avisada', { s: 11, c: '#991B1B', m: 1 }) + t(260, 226, 'pede a outro serviço', { s: 11, c: '#991B1B', m: 1 }) + t(260, 250, 'ou o doente fica', { s: 10, c: '#991B1B', m: 1 })) +
          caixa(346, 164, 150, 104, '#FFF7ED', '#FED7AA', 25, t(421, 188, '⏱ Sem resposta', { s: 13, w: 800, c: '#9A3412', m: 1 }) + t(421, 210, 'passadas 24 horas', { s: 11, c: '#9A3412', m: 1 }) + t(421, 226, 'a origem também', { s: 11, c: '#9A3412', m: 1 }) + t(421, 250, 'é avisada', { s: 10, c: '#9A3412', m: 1 })));
      } },
    { dur: 25, cor: '#2B5A8A', titulo: 'Ligação ao Movimento Hospitalar',
      falas: ['Tudo o que regista aqui preenche sozinho o Movimento Hospitalar do serviço.', 'As entradas, as saídas, os óbitos, os dias-doente e os dias-cama são calculados a partir dos doentes.', 'Por isso, para corrigir um número do Movimento, corrija o registo do doente no Controlo de Pacientes.'],
      svg: function () {
        return svg('#F8FAFC',
          a(0.1, t(24, 34, 'Ligação ao Movimento Hospitalar', { s: 17, w: 800, c: '#2B5A8A' })) +
          a(0.6, '<rect x="24" y="64" width="180" height="180" rx="18" fill="#EEF4FB"/>' + t(114, 96, 'Controlo de', { s: 14, w: 800, c: '#1E3A5F', m: 1 }) + t(114, 116, 'Pacientes', { s: 14, w: 800, c: '#1E3A5F', m: 1 }) +
            '<rect x="48" y="136" width="132" height="14" rx="7" fill="#fff"/><rect x="48" y="160" width="132" height="14" rx="7" fill="#fff"/><rect x="48" y="184" width="132" height="14" rx="7" fill="#fff"/><rect x="48" y="208" width="132" height="14" rx="7" fill="#fff"/>') +
          a(2.5, '<path d="M214 154 h60" stroke="#1E3A5F" stroke-width="5"/><path d="M270 140 l18 14 -18 14z" fill="#1E3A5F"/>' + t(250, 138, 'sozinho', { s: 11, w: 700, c: '#1E3A5F', m: 1 })) +
          a(3.2, '<rect x="300" y="64" width="196" height="180" rx="18" fill="#1E3A5F"/>' + t(398, 94, 'Movimento', { s: 15, w: 800, c: '#fff', m: 1 })) +
          ['Entradas', 'Saídas e óbitos', 'Dias-doente', 'Dias-cama'].map(function (x, i) { return a(4 + i * 0.7, '<rect x="318" y="' + (110 + i * 32) + '" width="160" height="24" rx="7" fill="rgba(255,255,255,.12)"/>' + t(330, 127 + i * 32, '✓ ' + x, { s: 12, w: 700, c: '#E2E8F0' })); }).join('') +
          a(12, t(260, 272, 'Corrigir um número = corrigir o registo do doente', { s: 12.5, w: 700, c: '#2B5A8A', m: 1 })));
      } },
    { dur: 24, cor: '#64748B', titulo: 'Relatórios e regras de ouro',
      falas: ['No menu tem ainda o Relatório mensal, com gráficos e PDF, o Histórico diário e a Cópia de segurança.', 'Três regras de ouro: registe cada entrada e saída no próprio dia, com a hora real; confirme o NUP antes de criar; e nunca deixe um doente sem saída registada. Obrigado!'],
      svg: function () {
        var r = function (y, n, cor, t1, t2, d) { return a(d, '<circle cx="46" cy="' + y + '" r="16" fill="' + cor + '"/>' + t(46, y + 5, n, { s: 14, w: 800, c: '#fff', m: 1 }) + t(72, y - 3, t1, { s: 13, w: 700, c: '#fff' }) + t(72, y + 14, t2, { s: 11, c: '#94A3B8' })); };
        return svg('#0E1A2B',
          a(0.2, ['Relatório mensal', 'Histórico diário', 'Cópia de segurança'].map(function (x, i) { return '<rect x="' + (24 + i * 160) + '" y="22" width="148" height="40" rx="10" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.18)"/>' + t(98 + i * 160, 47, x, { s: 12, w: 700, c: '#E2E8F0', m: 1 }); }).join('')) +
          a(7, t(260, 96, '3 regras de ouro', { s: 17, w: 800, c: '#fff', m: 1 })) +
          r(132, '1', '#16A34A', 'Registe entradas e saídas no próprio dia', 'sempre com a data e a hora reais', 8.5) +
          r(186, '2', '#0891B2', 'Confirme o NUP antes de criar', 'procure o processo por nome ou NUP', 12) +
          r(240, '3', '#D97706', 'Nenhum doente sem saída registada', 'alta, óbito ou transferência', 15));
      } }
  ];

  window.ZELO_VIDEO_DEF = {
    titulo: 'Como funciona o Controlo de Pacientes', cenas: CENAS,
    escritas: function () { if (typeof window.openModal === 'function') window.openModal('welcomeModal'); }
  };
})();
