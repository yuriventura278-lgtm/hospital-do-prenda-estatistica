// ZELO — lista partilhada dos serviços clínicos, usada por servicos.html.
// Cada serviço junta, num só bloco, o(s) Relatório(s) Diário(s) +
// Procedimentos de Enfermagem + Movimento Hospitalar + Estatísticas que
// existirem para essa especialidade. "categoria" agrupa os cartões em
// servicos.html (ver CATEGORIAS_SERVICOS nesse ficheiro).
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
  { nome: 'Medicina Homem', categoria: 'internamento', icon: 'heartbeat', cor: '#7C3AED',
    relatorios: [{ label: 'Relatório Diário (Homem + Mulher)', file: 'banco_medicina_interna_v2-2-1-2-1.html', modulo: 'servicos', item: 'medicina_interna' }],
    procedimentos: [{ label: 'Procedimentos de Enfermagem', file: 'procedimentos_enfermagem_medicina_homem.html', modulo: 'procedimentos_enfermagem', item: 'medicina_homem' }],
    movimento: [{ label: 'Movimento Hospitalar', slug: 'medicina_homem', modulo: 'movimento_mensal' }] },
  { nome: 'Medicina Mulher', categoria: 'internamento', icon: 'heartbeat', cor: '#7C3AED',
    relatorios: [{ label: 'Relatório Diário (Homem + Mulher)', file: 'banco_medicina_interna_v2-2-1-2-1.html', modulo: 'servicos', item: 'medicina_interna' }],
    procedimentos: [{ label: 'Procedimentos de Enfermagem', file: 'procedimentos_enfermagem_medicina_mulher.html', modulo: 'procedimentos_enfermagem', item: 'medicina_mulher' }],
    movimento: [{ label: 'Movimento Hospitalar', slug: 'medicina_mulher', modulo: 'movimento_mensal' }] },
  { nome: 'Cirurgia Geral', categoria: 'internamento', icon: 'stretcher', cor: '#DC2626',
    relatorios: [{ label: 'Relatório Diário', file: 'Cirurgia_Geral.html', modulo: 'servicos', item: 'cirurgia_geral' }],
    procedimentos: [{ label: 'Procedimentos de Enfermagem', file: 'procedimentos_enfermagem_cirurgia_geral.html', modulo: 'procedimentos_enfermagem', item: 'cirurgia_geral' }],
    movimento: [{ label: 'Movimento Hospitalar', slug: 'cirurgia_geral', modulo: 'movimento_mensal' }] },
  { nome: 'Orto-Traumatologia', categoria: 'internamento', icon: 'bone', cor: '#DC2626',
    relatorios: [{ label: 'Relatório Diário', file: 'Ortopedia.html', modulo: 'servicos', item: 'ortopedia' }],
    procedimentos: [{ label: 'Procedimentos de Enfermagem', file: 'procedimentos_enfermagem_ortopedia.html', modulo: 'procedimentos_enfermagem', item: 'ortopedia' }],
    movimento: [{ label: 'Movimento Hospitalar', slug: 'ortopedia', modulo: 'movimento_mensal' }] },
  { nome: 'Neurocirurgia', categoria: 'internamento', icon: 'brain', cor: '#DC2626',
    relatorios: [{ label: 'Relatório Diário', file: 'Neurocirurgia.html', modulo: 'servicos', item: 'neurocirurgia' }],
    procedimentos: [{ label: 'Procedimentos de Enfermagem', file: 'procedimentos_enfermagem_neurocirurgia.html', modulo: 'procedimentos_enfermagem', item: 'neurocirurgia' }],
    movimento: [{ label: 'Movimento Hospitalar', slug: 'neurocirurgia', modulo: 'movimento_mensal' }] },
  { nome: 'Maxilo-Facial', categoria: 'internamento', icon: 'jaw', cor: '#DC2626',
    relatorios: [{ label: 'Relatório Diário', file: 'Cirurgia_Maxilo_Facial.html', modulo: 'servicos', item: 'maxilo_facial' }],
    procedimentos: [{ label: 'Procedimentos de Enfermagem', file: 'procedimentos_enfermagem_maxilo_facial.html', modulo: 'procedimentos_enfermagem', item: 'maxilo_facial' }],
    movimento: [{ label: 'Movimento Hospitalar', slug: 'maxilo_facial', modulo: 'movimento_mensal' }] },
  { nome: 'Nefrologia', categoria: 'internamento', icon: 'droplet', cor: '#7C3AED',
    relatorios: [{ label: 'Relatório Diário', file: 'Banco_Nefrologia_v2-1.html', modulo: 'servicos', item: 'nefrologia' }],
    procedimentos: [{ label: 'Procedimentos de Enfermagem', file: 'procedimentos_enfermagem_nefrologia.html', modulo: 'procedimentos_enfermagem', item: 'nefrologia' }],
    movimento: [{ label: 'Movimento Hospitalar', slug: 'nefrologia', modulo: 'movimento_mensal' }] },
  { nome: 'UC Intermédio', categoria: 'internamento', icon: 'activity', cor: '#7C3AED',
    relatorios: [{ label: 'Relatório Diário', file: 'banco_uci_v1-3-1-1.html', modulo: 'servicos', item: 'uci_cuidados_intermedios' }],
    procedimentos: [{ label: 'Procedimentos de Enfermagem', file: 'procedimentos_enfermagem_uci_cuidados_intermedios.html', modulo: 'procedimentos_enfermagem', item: 'uci_cuidados_intermedios' }],
    movimento: [{ label: 'Movimento Hospitalar', slug: 'uci_cuidados_intermedios', modulo: 'movimento_mensal' }] },
  { nome: 'Banco de Urgência', categoria: 'urgencia', icon: 'shield', cor: '#059669',
    procedimentos: [{ label: 'Procedimentos de Enfermagem', file: 'procedimentos_enfermagem_banco_urgencia.html', modulo: 'procedimentos_enfermagem', item: 'banco_urgencia' }] },
  { nome: 'Bloco Operatório', categoria: 'bloco_operatorio', icon: 'scissors', cor: '#B91C1C',
    relatorios: [
      { label: 'Relatório Diário (antigo)', file: 'Bloco_Operatorio.html', modulo: 'servicos', item: 'bloco_operatorio' },
      { label: 'Registo Diário', file: 'bloco_operatorio_registo_diario.html', modulo: 'sistemas_independentes', item: 'bloco_operatorio_registo_diario' },
    ],
    temEstatisticas: true, estatisticasFile: 'bloco_operatorio_registo_diario.html' },
  { nome: 'Oftalmologia', categoria: 'consultas', icon: 'eye', cor: '#DC2626',
    relatorios: [{ label: 'Relatório Diário', file: 'Oftalmologia.html', modulo: 'servicos', item: 'oftalmologia' }] },
  { nome: 'Otorrinolaringologia', categoria: 'consultas', icon: 'ear', cor: '#DC2626',
    relatorios: [{ label: 'Relatório Diário', file: 'Otorrinolaringologia.html', modulo: 'servicos', item: 'otorrinolaringologia' }] },
  { nome: 'Consulta Externa', categoria: 'consultas', icon: 'door', cor: '#059669',
    relatorios: [
      { label: 'Relatório Diário', file: 'Consulta_Externa-2.html', modulo: 'servicos', item: 'consulta_externa' },
      { label: 'Consultas Externa', file: 'consulta_externa_geral.html', modulo: 'sistemas_independentes', item: 'consulta_externa_geral' },
    ] },
  { nome: 'Hospital de Dia', categoria: 'consultas', icon: 'clipboard', cor: '#059669',
    procedimentos: [{ label: 'Procedimentos de Enfermagem', file: 'procedimentos_enfermagem_hospital_dia.html', modulo: 'procedimentos_enfermagem', item: 'hospital_dia' }] },
  { nome: 'Imagiologia', categoria: 'diagnostico', icon: 'scan', cor: '#0EA5E9',
    relatorios: [
      { label: 'Relatório Diário', file: 'Imagiologia.html', modulo: 'servicos', item: 'imagiologia' },
      { label: 'Exames Realizados', file: 'imagiologia_radiologia_geral.html', modulo: 'sistemas_independentes', item: 'imagiologia_radiologia_geral' },
    ],
    temEstatisticas: true, estatisticasFile: 'imagiologia_radiologia_geral.html' },
  { nome: 'Laboratório', categoria: 'diagnostico', icon: 'flask', cor: '#0EA5E9',
    relatorios: [
      { label: 'Relatório Diário', file: 'Laboratório_Clínico.html', modulo: 'servicos', item: 'laboratorio_clinico' },
      { label: 'Exames Realizados', file: 'laboratorio_geral.html', modulo: 'sistemas_independentes', item: 'laboratorio_geral' },
    ] },
  { nome: 'Hemoterapia', categoria: 'diagnostico', icon: 'droplet', cor: '#BE123C',
    relatorios: [
      { label: 'Relatório Diário', file: 'Hemoterapia.html', modulo: 'servicos', item: 'hemoterapia' },
      { label: 'Transfusões', file: 'hemoterapia.html', modulo: 'sistemas_independentes', item: 'hemoterapia' },
    ] },
  { nome: 'Fisioterapia', categoria: 'consultas', icon: 'users', cor: '#059669',
    relatorios: [{ label: 'Relatório Diário', file: 'banco_fisioterapia_v1-1-1.html', modulo: 'servicos', item: 'fisioterapia' }] },
  { nome: 'Psicologia Clínica', categoria: 'consultas', icon: 'head', cor: '#059669',
    relatorios: [{ label: 'Relatório Diário', file: 'psicologia_clinica_hp-1-3-1.html', modulo: 'servicos', item: 'psicologia_clinica' }] },
  { nome: 'Farmácia', categoria: 'farmacia', icon: 'bank', cor: '#0D9488',
    relatorios: [{ label: 'Movimentação de Medicamentos', file: 'farmacia_central.html', modulo: 'sistemas_independentes', item: 'farmacia_central' }] },
  { nome: 'Supervisão do Hospital', categoria: 'supervisao', icon: 'shield', cor: '#334155', wip: true,
    relatorios: [{ label: 'Relatório Diário', file: 'Supervisao_Hospital.html', modulo: 'servicos', item: 'supervisao_hospital' }] },
  { nome: 'Supervisão Serviclean', categoria: 'supervisao', icon: 'sparkles', cor: '#334155', wip: true,
    relatorios: [{ label: 'Relatório Diário', file: 'Supervisao_Serviclean.html', modulo: 'servicos', item: 'supervisao_serviclean' }] },
  { nome: 'Supervisão de Maqueiros', categoria: 'supervisao', icon: 'move', cor: '#334155', wip: true,
    relatorios: [{ label: 'Relatório Diário', file: 'Supervisao_Maqueiros.html', modulo: 'servicos', item: 'supervisao_maqueiros' }] },
];

// Categorias usadas para agrupar SERVICOS_MENU — partilhadas entre
// servicos.html (secções da grelha) e o menu lateral em index.html (árvore
// de atalhos), para as duas nunca ficarem dessincronizadas. "outros" apanha
// qualquer serviço sem categoria (ou com uma categoria desconhecida).
// "icon" é o miolo (paths/rects) de um ícone SVG 24x24 — cada página envolve-o
// no seu próprio <svg ...>, sem depender de emojis (que rendem de forma
// inconsistente entre dispositivos/fontes).
const CATEGORIAS_SERVICOS = [
  { id: 'internamento', label: 'Internamento',
    icon: '<rect x="2" y="7" width="20" height="10" rx="2"/><path d="M6 7v10M18 7v10M2 12h20"/>' },
  { id: 'urgencia', label: 'Urgência',
    icon: '<circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>' },
  { id: 'consultas', label: 'Consultas e Especialidades',
    icon: '<path d="M14 22V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16M2 22h20M14 12v.01"/>' },
  { id: 'diagnostico', label: 'Diagnóstico e Terapêutica',
    icon: '<path d="M9 2v6.3a2 2 0 0 1-.3 1L4 18a2 2 0 0 0 1.7 3h12.6a2 2 0 0 0 1.7-3l-4.7-8.7a2 2 0 0 1-.3-1V2"/><path d="M6 9h12"/>' },
  { id: 'bloco_operatorio', label: 'Bloco Operatório',
    icon: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12"/>' },
  { id: 'farmacia', label: 'Farmácia',
    icon: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>' },
  { id: 'supervisao', label: 'Supervisão',
    icon: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>' },
  { id: 'outros', label: 'Outros',
    icon: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6M9 16h6"/>' },
];

// Lista partilhada dos 5 sistemas locais (sistemas_independentes.html) — cada
// um é um só acesso directo, sem sub-acções como os serviços clínicos acima.
const SISTEMAS_LOCAIS_MENU = [
  { nome: 'Procedimentos de Enfermagem · Geral', file: 'procedimentos_enfermagem_geral.html', modulo: 'procedimentos_enfermagem', item: 'geral' },
  { nome: 'Controlo de Enfermagem · Entregas Diárias', file: 'controlo_enfermagem.html', modulo: 'sistemas_independentes', item: 'controlo_enfermagem' },
  { nome: 'Controlo de Faltas · GEPE/DEMA', file: 'controlo_faltas_gepedema.html', modulo: 'sistemas_independentes', item: 'controlo_faltas_gepedema' },
  { nome: 'Dias-Cama & Dias-Doente', file: 'dias_cama_doente.html', modulo: 'sistemas_independentes', item: 'dias_cama_doente' },
  { nome: 'Registo VIH · Geral', file: 'registo_hiv.html', modulo: 'sistemas_independentes', item: 'registo_hiv' },
];

// Slug estável a partir do nome do serviço — usado como id do cartão em
// servicos.html e como âncora (#svc-...) pelos atalhos do menu lateral em
// index.html. Tem de ser a MESMA função nos dois ficheiros, daqui partilhada.
function zeloSlugifyServico(nome){
  return String(nome || '').toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

if (typeof window !== 'undefined') {
  window.SERVICOS_MENU = SERVICOS_MENU;
  window.CATEGORIAS_SERVICOS = CATEGORIAS_SERVICOS;
  window.zeloSlugifyServico = zeloSlugifyServico;
  window.SISTEMAS_LOCAIS_MENU = SISTEMAS_LOCAIS_MENU;
}
