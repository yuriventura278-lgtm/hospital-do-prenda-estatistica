// ZELO — lista partilhada dos serviços clínicos, usada por servicos.html.
// Lista única (sem categorias) — cada serviço junta, num só bloco, o(s)
// Relatório(s) Diário(s) + Procedimentos de Enfermagem + Movimento Hospitalar
// + Estatísticas que existirem para essa especialidade.
//
// "relatorios" é uma lista (normalmente 1, às vezes 2): alguns serviços têm
// dois sistemas de registo diário em paralelo — o banco antigo (dentro de
// servicos.html) e o sistema geral mais recente (dentro de
// sistemas_independentes.html) — e, por pedido explícito, aparecem os dois
// lado a lado no menu, em vez de esconder o antigo.
//
// modulo/item de cada ação corresponde exatamente ao que a própria página de
// destino já verifica (zelo_pagegate.js / zeloAuthGate / renderPicker), por
// isso escondemos um botão aqui sem nunca mudar o acesso real a essa página.
//
// temEstatisticas: só true quando o próprio ficheiro já tem uma aba/secção de
// Estatísticas construída (confirmado por grep — só Bloco Operatório e
// Imagiologia, por agora). Para os restantes, fica para uma fase seguinte.
const SERVICOS_MENU = [
  { nome: 'Medicina Homem', icon: 'heartbeat', cor: '#7C3AED',
    relatorios: [{ label: 'Relatório Diário (Homem + Mulher)', file: 'banco_medicina_interna_v2-2-1-2-1.html', modulo: 'servicos', item: 'medicina_interna' }],
    procedimentos: [{ label: 'Procedimentos de Enfermagem', file: 'procedimentos_enfermagem_medicina_homem.html', modulo: 'procedimentos_enfermagem', item: 'medicina_homem' }],
    movimento: [{ label: 'Movimento Hospitalar', slug: 'medicina_homem', modulo: 'movimento_mensal' }] },
  { nome: 'Medicina Mulher', icon: 'heartbeat', cor: '#7C3AED',
    relatorios: [{ label: 'Relatório Diário (Homem + Mulher)', file: 'banco_medicina_interna_v2-2-1-2-1.html', modulo: 'servicos', item: 'medicina_interna' }],
    procedimentos: [{ label: 'Procedimentos de Enfermagem', file: 'procedimentos_enfermagem_medicina_mulher.html', modulo: 'procedimentos_enfermagem', item: 'medicina_mulher' }],
    movimento: [{ label: 'Movimento Hospitalar', slug: 'medicina_mulher', modulo: 'movimento_mensal' }] },
  { nome: 'Cirurgia Geral', icon: 'stretcher', cor: '#DC2626',
    relatorios: [{ label: 'Relatório Diário', file: 'Cirurgia_Geral.html', modulo: 'servicos', item: 'cirurgia_geral' }],
    procedimentos: [{ label: 'Procedimentos de Enfermagem', file: 'procedimentos_enfermagem_cirurgia_geral.html', modulo: 'procedimentos_enfermagem', item: 'cirurgia_geral' }],
    movimento: [{ label: 'Movimento Hospitalar', slug: 'cirurgia_geral', modulo: 'movimento_mensal' }] },
  { nome: 'Orto-Traumatologia', icon: 'bone', cor: '#DC2626',
    relatorios: [{ label: 'Relatório Diário', file: 'Ortopedia.html', modulo: 'servicos', item: 'ortopedia' }],
    procedimentos: [{ label: 'Procedimentos de Enfermagem', file: 'procedimentos_enfermagem_ortopedia.html', modulo: 'procedimentos_enfermagem', item: 'ortopedia' }],
    movimento: [{ label: 'Movimento Hospitalar', slug: 'ortopedia', modulo: 'movimento_mensal' }] },
  { nome: 'Neurocirurgia', icon: 'brain', cor: '#DC2626',
    relatorios: [{ label: 'Relatório Diário', file: 'Neurocirurgia.html', modulo: 'servicos', item: 'neurocirurgia' }],
    procedimentos: [{ label: 'Procedimentos de Enfermagem', file: 'procedimentos_enfermagem_neurocirurgia.html', modulo: 'procedimentos_enfermagem', item: 'neurocirurgia' }],
    movimento: [{ label: 'Movimento Hospitalar', slug: 'neurocirurgia', modulo: 'movimento_mensal' }] },
  { nome: 'Maxilo-Facial', icon: 'jaw', cor: '#DC2626',
    relatorios: [{ label: 'Relatório Diário', file: 'Cirurgia_Maxilo_Facial.html', modulo: 'servicos', item: 'maxilo_facial' }],
    procedimentos: [{ label: 'Procedimentos de Enfermagem', file: 'procedimentos_enfermagem_maxilo_facial.html', modulo: 'procedimentos_enfermagem', item: 'maxilo_facial' }],
    movimento: [{ label: 'Movimento Hospitalar', slug: 'maxilo_facial', modulo: 'movimento_mensal' }] },
  { nome: 'Nefrologia', icon: 'droplet', cor: '#7C3AED',
    relatorios: [{ label: 'Relatório Diário', file: 'Banco_Nefrologia_v2-1.html', modulo: 'servicos', item: 'nefrologia' }],
    procedimentos: [{ label: 'Procedimentos de Enfermagem', file: 'procedimentos_enfermagem_nefrologia.html', modulo: 'procedimentos_enfermagem', item: 'nefrologia' }],
    movimento: [{ label: 'Movimento Hospitalar', slug: 'nefrologia', modulo: 'movimento_mensal' }] },
  { nome: 'UC Intermédio', icon: 'activity', cor: '#7C3AED',
    relatorios: [{ label: 'Relatório Diário', file: 'banco_uci_v1-3-1-1.html', modulo: 'servicos', item: 'uci_cuidados_intermedios' }],
    procedimentos: [{ label: 'Procedimentos de Enfermagem', file: 'procedimentos_enfermagem_uci_cuidados_intermedios.html', modulo: 'procedimentos_enfermagem', item: 'uci_cuidados_intermedios' }],
    movimento: [{ label: 'Movimento Hospitalar', slug: 'uci_cuidados_intermedios', modulo: 'movimento_mensal' }] },
  { nome: 'Banco de Urgência', icon: 'shield', cor: '#059669',
    procedimentos: [{ label: 'Procedimentos de Enfermagem', file: 'procedimentos_enfermagem_banco_urgencia.html', modulo: 'procedimentos_enfermagem', item: 'banco_urgencia' }] },
  { nome: 'Bloco Operatório', icon: 'scissors', cor: '#B91C1C',
    relatorios: [
      { label: 'Relatório Diário (antigo)', file: 'Bloco_Operatorio.html', modulo: 'servicos', item: 'bloco_operatorio' },
      { label: 'Registo Diário', file: 'bloco_operatorio_registo_diario.html', modulo: 'sistemas_independentes', item: 'bloco_operatorio_registo_diario' },
    ],
    temEstatisticas: true, estatisticasFile: 'bloco_operatorio_registo_diario.html' },
  { nome: 'Oftalmologia', icon: 'eye', cor: '#DC2626',
    relatorios: [{ label: 'Relatório Diário', file: 'Oftalmologia.html', modulo: 'servicos', item: 'oftalmologia' }] },
  { nome: 'Otorrinolaringologia', icon: 'ear', cor: '#DC2626',
    relatorios: [{ label: 'Relatório Diário', file: 'Otorrinolaringologia.html', modulo: 'servicos', item: 'otorrinolaringologia' }] },
  { nome: 'Consulta Externa', icon: 'door', cor: '#059669',
    relatorios: [
      { label: 'Relatório Diário', file: 'Consulta_Externa-2.html', modulo: 'servicos', item: 'consulta_externa' },
      { label: 'Consultas Externa', file: 'consulta_externa_geral.html', modulo: 'sistemas_independentes', item: 'consulta_externa_geral' },
    ] },
  { nome: 'Hospital de Dia', icon: 'clipboard', cor: '#059669',
    procedimentos: [{ label: 'Procedimentos de Enfermagem', file: 'procedimentos_enfermagem_hospital_dia.html', modulo: 'procedimentos_enfermagem', item: 'hospital_dia' }] },
  { nome: 'Imagiologia', icon: 'scan', cor: '#0EA5E9',
    relatorios: [
      { label: 'Relatório Diário', file: 'Imagiologia.html', modulo: 'servicos', item: 'imagiologia' },
      { label: 'Exames Realizados', file: 'imagiologia_radiologia_geral.html', modulo: 'sistemas_independentes', item: 'imagiologia_radiologia_geral' },
    ],
    temEstatisticas: true, estatisticasFile: 'imagiologia_radiologia_geral.html' },
  { nome: 'Laboratório', icon: 'flask', cor: '#0EA5E9',
    relatorios: [
      { label: 'Relatório Diário', file: 'Laboratório_Clínico.html', modulo: 'servicos', item: 'laboratorio_clinico' },
      { label: 'Exames Realizados', file: 'laboratorio_geral.html', modulo: 'sistemas_independentes', item: 'laboratorio_geral' },
    ] },
  { nome: 'Hemoterapia', icon: 'droplet', cor: '#BE123C',
    relatorios: [
      { label: 'Relatório Diário', file: 'Hemoterapia.html', modulo: 'servicos', item: 'hemoterapia' },
      { label: 'Transfusões', file: 'hemoterapia.html', modulo: 'sistemas_independentes', item: 'hemoterapia' },
    ] },
  { nome: 'Fisioterapia', icon: 'users', cor: '#059669',
    relatorios: [{ label: 'Relatório Diário', file: 'banco_fisioterapia_v1-1-1.html', modulo: 'servicos', item: 'fisioterapia' }] },
  { nome: 'Psicologia Clínica', icon: 'head', cor: '#059669',
    relatorios: [{ label: 'Relatório Diário', file: 'psicologia_clinica_hp-1-3-1.html', modulo: 'servicos', item: 'psicologia_clinica' }] },
  { nome: 'Farmácia', icon: 'bank', cor: '#0D9488',
    relatorios: [{ label: 'Movimentação de Medicamentos', file: 'farmacia_central.html', modulo: 'sistemas_independentes', item: 'farmacia_central' }] },
  { nome: 'Supervisão do Hospital', icon: 'shield', cor: '#334155', wip: true,
    relatorios: [{ label: 'Relatório Diário', file: 'Supervisao_Hospital.html', modulo: 'servicos', item: 'supervisao_hospital' }] },
  { nome: 'Supervisão Serviclean', icon: 'sparkles', cor: '#334155', wip: true,
    relatorios: [{ label: 'Relatório Diário', file: 'Supervisao_Serviclean.html', modulo: 'servicos', item: 'supervisao_serviclean' }] },
  { nome: 'Supervisão de Maqueiros', icon: 'move', cor: '#334155', wip: true,
    relatorios: [{ label: 'Relatório Diário', file: 'Supervisao_Maqueiros.html', modulo: 'servicos', item: 'supervisao_maqueiros' }] },
];

if (typeof window !== 'undefined') window.SERVICOS_MENU = SERVICOS_MENU;
