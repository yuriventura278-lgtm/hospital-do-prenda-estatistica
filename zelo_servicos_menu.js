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
  // Medicina Homem e Medicina Mulher partilham UMA só página de Controlo de
  // Pacientes (a da Medicina Interna): os dois links abrem o mesmo registo.
  { nome: 'Medicina Homem', categoria: 'internamento', grupo: 'Medicina Interna', icon: 'heartbeat', cor: '#7C3AED',
    relatorios: [{ label: 'Controlo de Pacientes', file: 'controlo_pacientes_medicina_interna.html', modulo: 'sistemas_independentes', item: 'controlo_pacientes_medicina_interna' }], // oculto a pedido: { label: 'Relatório Diário (Homem + Mulher)', file: 'banco_medicina_interna_v2-2-1-2-1.html', modulo: 'servicos', item: 'medicina_interna' } — sistema antigo do "banco", descomentar para restaurar
    procedimentos: [{ label: 'Procedimentos de Enfermagem', file: 'procedimentos_enfermagem_medicina_homem.html', modulo: 'procedimentos_enfermagem', item: 'medicina_homem' }],
    movimento: [{ label: 'Movimento Hospitalar', file: 'medicina_homem_movimento.html', modulo: 'movimento_mensal', item: 'medicina_homem' }] },
  { nome: 'Medicina Mulher', categoria: 'internamento', grupo: 'Medicina Interna', icon: 'heartbeat', cor: '#7C3AED',
    relatorios: [{ label: 'Controlo de Pacientes', file: 'controlo_pacientes_medicina_interna.html', modulo: 'sistemas_independentes', item: 'controlo_pacientes_medicina_interna' }], // oculto a pedido: { label: 'Relatório Diário (Homem + Mulher)', file: 'banco_medicina_interna_v2-2-1-2-1.html', modulo: 'servicos', item: 'medicina_interna' } — sistema antigo do "banco", descomentar para restaurar
    procedimentos: [{ label: 'Procedimentos de Enfermagem', file: 'procedimentos_enfermagem_medicina_mulher.html', modulo: 'procedimentos_enfermagem', item: 'medicina_mulher' }],
    movimento: [{ label: 'Movimento Hospitalar', file: 'medicina_mulher_movimento.html', modulo: 'movimento_mensal', item: 'medicina_mulher' }] },
  { nome: 'Cirurgia Geral', categoria: 'internamento', icon: 'stretcher', cor: '#DC2626',
    relatorios: [{ label: 'Controlo de Pacientes', file: 'controlo_pacientes_cirurgia_geral.html', modulo: 'sistemas_independentes', item: 'controlo_pacientes_cirurgia_geral' }], // oculto a pedido: { label: 'Relatório Diário', file: 'Cirurgia_Geral.html', modulo: 'servicos', item: 'cirurgia_geral' } — sistema antigo do "banco", descomentar para restaurar
    procedimentos: [{ label: 'Procedimentos de Enfermagem', file: 'procedimentos_enfermagem_cirurgia_geral.html', modulo: 'procedimentos_enfermagem', item: 'cirurgia_geral' }],
    movimento: [{ label: 'Movimento Hospitalar', file: 'cirurgia_geral_movimento.html', modulo: 'movimento_mensal', item: 'cirurgia_geral' }] },
  { nome: 'Orto-Traumatologia', categoria: 'internamento', icon: 'bone', cor: '#DC2626',
    relatorios: [{ label: 'Controlo de Pacientes', file: 'controlo_pacientes_ortopedia.html', modulo: 'sistemas_independentes', item: 'controlo_pacientes_ortopedia' }], // oculto a pedido: { label: 'Relatório Diário', file: 'Ortopedia.html', modulo: 'servicos', item: 'ortopedia' } — sistema antigo do "banco", descomentar para restaurar
    procedimentos: [{ label: 'Procedimentos de Enfermagem', file: 'procedimentos_enfermagem_ortopedia.html', modulo: 'procedimentos_enfermagem', item: 'ortopedia' }],
    movimento: [{ label: 'Movimento Hospitalar', file: 'ortopedia_movimento.html', modulo: 'movimento_mensal', item: 'ortopedia' }] },
  { nome: 'Neurocirurgia', categoria: 'internamento', icon: 'brain', cor: '#DC2626',
    relatorios: [{ label: 'Controlo de Pacientes', file: 'controlo_pacientes_neurocirurgia.html', modulo: 'sistemas_independentes', item: 'controlo_pacientes_neurocirurgia' }], // oculto a pedido: { label: 'Relatório Diário', file: 'Neurocirurgia.html', modulo: 'servicos', item: 'neurocirurgia' } — sistema antigo do "banco", descomentar para restaurar
    procedimentos: [{ label: 'Procedimentos de Enfermagem', file: 'procedimentos_enfermagem_neurocirurgia.html', modulo: 'procedimentos_enfermagem', item: 'neurocirurgia' }],
    movimento: [{ label: 'Movimento Hospitalar', file: 'neurocirurgia_movimento.html', modulo: 'movimento_mensal', item: 'neurocirurgia' }] },
  { nome: 'Maxilo-Facial', categoria: 'internamento', icon: 'jaw', cor: '#DC2626',
    relatorios: [{ label: 'Controlo de Pacientes', file: 'controlo_pacientes_maxilo_facial.html', modulo: 'sistemas_independentes', item: 'controlo_pacientes_maxilo_facial' }], // oculto a pedido: { label: 'Relatório Diário', file: 'Cirurgia_Maxilo_Facial.html', modulo: 'servicos', item: 'maxilo_facial' } — sistema antigo do "banco", descomentar para restaurar
    procedimentos: [{ label: 'Procedimentos de Enfermagem', file: 'procedimentos_enfermagem_maxilo_facial.html', modulo: 'procedimentos_enfermagem', item: 'maxilo_facial' }],
    movimento: [{ label: 'Movimento Hospitalar', file: 'maxilo_facial_movimento.html', modulo: 'movimento_mensal', item: 'maxilo_facial' }] },
  { nome: 'Nefrologia', categoria: 'internamento', icon: 'droplet', cor: '#7C3AED',
    relatorios: [{ label: 'Controlo de Pacientes', file: 'controlo_pacientes_nefrologia.html', modulo: 'sistemas_independentes', item: 'controlo_pacientes_nefrologia' }], // oculto a pedido: { label: 'Relatório Diário', file: 'Banco_Nefrologia_v2-1.html', modulo: 'servicos', item: 'nefrologia' } — sistema antigo do "banco", descomentar para restaurar
    procedimentos: [{ label: 'Procedimentos de Enfermagem', file: 'procedimentos_enfermagem_nefrologia.html', modulo: 'procedimentos_enfermagem', item: 'nefrologia' }],
    movimento: [{ label: 'Movimento Hospitalar', file: 'nefrologia_movimento.html', modulo: 'movimento_mensal', item: 'nefrologia' }] },
  { nome: 'UC Intermédio', categoria: 'internamento', icon: 'activity', cor: '#7C3AED',
    relatorios: [
      { label: 'Controlo de Pacientes — UCI', file: 'controlo_pacientes_uci_intensivo.html', modulo: 'sistemas_independentes', item: 'controlo_pacientes_uci_intensivo' },
      { label: 'Controlo de Pacientes — Cuidados Intermédios', file: 'controlo_pacientes_uci_intermedio.html', modulo: 'sistemas_independentes', item: 'controlo_pacientes_uci_intermedio' },
    ], // oculto a pedido: { label: 'Relatório Diário', file: 'banco_uci_v1-3-1-1.html', modulo: 'servicos', item: 'uci_cuidados_intermedios' } — sistema antigo do "banco", descomentar para restaurar
    procedimentos: [{ label: 'Procedimentos de Enfermagem', file: 'procedimentos_enfermagem_uci_cuidados_intermedios.html', modulo: 'procedimentos_enfermagem', item: 'uci_cuidados_intermedios' }],
    // Movimento Hospitalar tem dois botões aqui (a pedido): UCI (cuidados
    // intensivos) e Cuidados Intermédios são unidades distintas, cada uma
    // com o seu próprio registo mensal de movimento.
    movimento: [
      { label: 'Movimento — UCI', file: 'uci_intensivo_movimento.html', modulo: 'movimento_mensal', item: 'uci_intensivo' },
      { label: 'Movimento — Cuidados Intermédios', file: 'uci_intermedio_movimento.html', modulo: 'movimento_mensal', item: 'uci_intermedio' },
    ] },
  { nome: 'Banco de Urgência', categoria: 'urgencia', icon: 'shield', cor: '#059669',
    procedimentos: [{ label: 'Procedimentos de Enfermagem', file: 'procedimentos_enfermagem_banco_urgencia.html', modulo: 'procedimentos_enfermagem', item: 'banco_urgencia' }],
    movimento: [{ label: 'Movimento do Banco de Urgência', file: 'banco_urgencia.html', modulo: 'movimento_mensal', item: 'banco_urgencia' }] },
  { nome: 'Bloco Operatório', categoria: 'bloco_operatorio', icon: 'scissors', cor: '#B91C1C',
    relatorios: [
      // oculto a pedido: { label: 'Relatório Diário', file: 'Bloco_Operatorio.html', modulo: 'servicos', item: 'bloco_operatorio' } — sistema antigo do "banco", descomentar para restaurar
      { label: 'Registo Diário', file: 'bloco_operatorio_registo_diario.html', modulo: 'sistemas_independentes', item: 'bloco_operatorio_registo_diario' },
      { label: 'Processo Operatório', file: 'bloco_operatorio_ficha_operatoria.html', modulo: 'sistemas_independentes', item: 'bloco_operatorio_ficha_operatoria' },
    ],
    procedimentos: [{ label: 'Procedimentos de Enfermagem', file: 'procedimentos_enfermagem_bloco_operatorio.html', modulo: 'procedimentos_enfermagem', item: 'bloco_operatorio' }],
    temEstatisticas: true, estatisticasFile: 'bloco_operatorio_registo_diario.html' },
  { nome: 'Oftalmologia', categoria: 'oftalmologia', icon: 'eye', cor: '#DC2626',
    relatorios: [{ label: 'Relatório Diário', file: 'Oftalmologia.html', modulo: 'servicos', item: 'oftalmologia' }] },
  { nome: 'Otorrinolaringologia', categoria: 'otorrinolaringologia', icon: 'ear', cor: '#DC2626',
    relatorios: [{ label: 'Relatório Diário', file: 'Otorrinolaringologia.html', modulo: 'servicos', item: 'otorrinolaringologia' }] },
  // Em construção (como a Supervisão): a página mostra "Em construção".
  { nome: 'Estomatologia', categoria: 'estomatologia', icon: 'tooth', cor: '#0891B2', wip: true,
    relatorios: [{ label: 'Relatório Diário', file: 'Estomatologia.html', modulo: 'servicos', item: 'estomatologia' }] },
  // Também em construção (como a Supervisão e a Estomatologia).
  { nome: 'Centro de Hemodiálise', categoria: 'centro_hemodialise', icon: 'kidney', cor: '#0284C7', wip: true,
    relatorios: [{ label: 'Relatório Diário', file: 'Centro_Hemodialise.html', modulo: 'servicos', item: 'centro_hemodialise' }] },
  { nome: 'Anatomia Patológica', categoria: 'anatomia_patologica', icon: 'microscope', cor: '#9333EA', wip: true,
    relatorios: [{ label: 'Relatório Diário', file: 'Anatomia_Patologica.html', modulo: 'servicos', item: 'anatomia_patologica' }] },
  { nome: 'Morgue', categoria: 'morgue', icon: 'cross', cor: '#475569', wip: true,
    relatorios: [{ label: 'Relatório Diário', file: 'Morgue.html', modulo: 'servicos', item: 'morgue' }] },
  { nome: 'Lavandaria e Esterilização', categoria: 'lavandaria_esterilizacao', icon: 'washer', cor: '#0D9488', wip: true,
    relatorios: [{ label: 'Relatório Diário', file: 'Lavandaria_Esterilizacao.html', modulo: 'servicos', item: 'lavandaria_esterilizacao' }] },
  { nome: 'Consulta Externa', categoria: 'consulta_externa', icon: 'door', cor: '#059669',
    relatorios: [
      // oculto a pedido: { label: 'Relatório Diário', file: 'Consulta_Externa-2.html', modulo: 'servicos', item: 'consulta_externa' } — sistema antigo do "banco", descomentar para restaurar
      { label: 'Consulta Externa', file: 'consulta_externa_geral.html', modulo: 'sistemas_independentes', item: 'consulta_externa_geral' },
    ],
    procedimentos: [{ label: 'Procedimentos de Enfermagem', file: 'procedimentos_enfermagem_consulta_externa.html', modulo: 'procedimentos_enfermagem', item: 'consulta_externa' }] },
  { nome: 'Hospital de Dia', categoria: 'hospital_dia', icon: 'clipboard', cor: '#059669',
    procedimentos: [{ label: 'Procedimentos de Enfermagem', file: 'procedimentos_enfermagem_hospital_dia.html', modulo: 'procedimentos_enfermagem', item: 'hospital_dia' }] },
  { nome: 'Imagiologia', categoria: 'imagiologia', icon: 'scan', cor: '#0EA5E9',
    relatorios: [
      // oculto a pedido: { label: 'Relatório Diário', file: 'Imagiologia.html', modulo: 'servicos', item: 'imagiologia' } — sistema antigo do "banco", descomentar para restaurar
      { label: 'Exames Realizados', file: 'imagiologia_radiologia_geral.html', modulo: 'sistemas_independentes', item: 'imagiologia_radiologia_geral' },
    ],
    temEstatisticas: true, estatisticasFile: 'imagiologia_radiologia_geral.html' },
  { nome: 'Laboratório', categoria: 'laboratorio', icon: 'flask', cor: '#0EA5E9',
    relatorios: [
      // oculto a pedido: { label: 'Relatório Diário', file: 'Laboratório_Clínico.html', modulo: 'servicos', item: 'laboratorio_clinico' } — sistema antigo do "banco", descomentar para restaurar
      { label: 'Exames Realizados', file: 'laboratorio_geral.html', modulo: 'sistemas_independentes', item: 'laboratorio_geral' },
    ] },
  { nome: 'Hemoterapia', categoria: 'hemoterapia', icon: 'droplet', cor: '#BE123C',
    relatorios: [
      { label: 'Saúde Pública', file: 'hemoterapia.html', modulo: 'sistemas_independentes', item: 'hemoterapia' },
    ] },
  { nome: 'Fisioterapia', categoria: 'fisioterapia', icon: 'users', cor: '#059669',
    relatorios: [{ label: 'Relatório Diário', file: 'banco_fisioterapia_v1-1-1.html', modulo: 'servicos', item: 'fisioterapia' }] },
  { nome: 'Psicologia Clínica', categoria: 'psicologia_clinica', icon: 'head', cor: '#059669',
    relatorios: [
      // oculto a pedido: { label: 'Relatório Diário', file: 'psicologia_clinica_hp-1-3-1.html', modulo: 'servicos', item: 'psicologia_clinica' } — sistema antigo do "banco", descomentar para restaurar
      { label: 'Atendimento & Estatística', file: 'psicologia_atendimento.html', modulo: 'sistemas_independentes', item: 'psicologia_atendimento' },
    ] },
  { nome: 'Farmácia Central', categoria: 'farmacia', icon: 'bank', cor: '#0D9488',
    relatorios: [{ label: 'Movimentação de Medicamentos', file: 'farmacia_central.html', modulo: 'sistemas_independentes', item: 'farmacia_central' }] },
  { nome: 'Supervisão do Hospital', categoria: 'supervisao', icon: 'shield', cor: '#334155', wip: true,
    relatorios: [{ label: 'Relatório Diário', file: 'Supervisao_Hospital.html', modulo: 'servicos', item: 'supervisao_hospital' }] },
  { nome: 'Supervisão Serviclean', categoria: 'supervisao', icon: 'sparkles', cor: '#334155', wip: true,
    relatorios: [{ label: 'Relatório Diário', file: 'Supervisao_Serviclean.html', modulo: 'servicos', item: 'supervisao_serviclean' }] },
  { nome: 'Supervisão de Maqueiros', categoria: 'supervisao', icon: 'move', cor: '#334155', wip: true,
    relatorios: [{ label: 'Relatório Diário', file: 'Supervisao_Maqueiros.html', modulo: 'servicos', item: 'supervisao_maqueiros' }] },
  { nome: 'Secretaria Geral', categoria: 'secretaria_geral', icon: 'clipboard', cor: '#1E3A8A',
    relatorios: [{ label: 'Secretaria Geral', file: 'secretaria_geral.html', modulo: 'sistemas_independentes', item: 'secretaria_geral' }] },
  { nome: 'Reprografia', categoria: 'reprografia', icon: 'printer', cor: '#1F5FA8',
    relatorios: [{ label: 'Controlo de Formulários Impressos', file: 'reprografia.html', modulo: 'sistemas_independentes', item: 'reprografia' }] },
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
  { id: 'urgencia', label: 'Banco de Urgência',
    icon: '<circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>' },
  // Cada serviço de consulta / diagnóstico tem a sua própria entrada no menu
  // (como a Farmácia e o Bloco Operatório), em vez de uma categoria comum.
  { id: 'consulta_externa', label: 'Consulta Externa',
    icon: '<path d="M14 22V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16M2 22h20M14 12v.01"/>' },
  { id: 'oftalmologia', label: 'Oftalmologia',
    icon: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>' },
  { id: 'otorrinolaringologia', label: 'Otorrinolaringologia',
    icon: '<path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0"/><path d="M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 1 0 0 4"/>' },
  { id: 'estomatologia', label: 'Estomatologia',
    icon: '<path d="M7 3c-2.2 0-3.5 1.9-3.5 4.5 0 3 1 6 2 9.5.4 1.4 1 2 1.7 2s1-1.3 1.3-3c.3-1.6.7-2.5 1.5-2.5s1.2.9 1.5 2.5c.3 1.7.6 3 1.3 3s1.3-.6 1.7-2c1-3.5 2-6.5 2-9.5C17.5 4.9 16.2 3 14 3c-1.4 0-2.2.8-3.5.8S8.4 3 7 3z"/>' },
  { id: 'hospital_dia', label: 'Hospital de Dia',
    icon: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6M9 16h6"/>' },
  { id: 'centro_hemodialise', label: 'Centro de Hemodiálise',
    icon: '<path d="M12 2s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"/><path d="M9 14h6M12 11v6"/>' },
  { id: 'fisioterapia', label: 'Fisioterapia',
    icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>' },
  { id: 'psicologia_clinica', label: 'Psicologia Clínica',
    icon: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-7 7c0 3 2 4 2 7h10c0-3 2-4 2-7a7 7 0 0 0-7-7Z"/>' },
  { id: 'imagiologia', label: 'Imagiologia',
    icon: '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="4"/>' },
  { id: 'laboratorio', label: 'Laboratório',
    icon: '<path d="M9 2v6.3a2 2 0 0 1-.3 1L4 18a2 2 0 0 0 1.7 3h12.6a2 2 0 0 0 1.7-3l-4.7-8.7a2 2 0 0 1-.3-1V2"/><path d="M6 9h12"/>' },
  { id: 'hemoterapia', label: 'Hemoterapia',
    icon: '<path d="M12 2s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"/>' },
  { id: 'anatomia_patologica', label: 'Anatomia Patológica',
    icon: '<path d="M6 18h8M3 22h18M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14h2M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/>' },
  { id: 'bloco_operatorio', label: 'Bloco Operatório',
    icon: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12"/>' },
  { id: 'farmacia', label: 'Farmácia Central',
    icon: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>' },
  { id: 'lavandaria_esterilizacao', label: 'Lavandaria e Esterilização',
    icon: '<rect x="3" y="2" width="18" height="20" rx="2"/><circle cx="12" cy="13" r="5"/><path d="M7 6h.01M11 6h2"/>' },
  { id: 'morgue', label: 'Morgue',
    icon: '<path d="M12 2v20M7 7h10"/>' },
  { id: 'supervisao', label: 'Supervisão',
    icon: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>' },
  { id: 'secretaria_geral', label: 'Secretaria Geral',
    icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>' },
  { id: 'reprografia', label: 'Reprografia',
    icon: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>' },
  // Último dentro de Serviços (só administradores — ver SISTEMAS_LOCAIS_MENU).
  { id: 'servico_estatistica', label: 'Serviço de Estatística',
    icon: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>' },
  { id: 'outros', label: 'Outros',
    icon: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6M9 16h6"/>' },
];

// "Serviço de Estatística" (antes "Sistemas Locais") — cada item é um só
// acesso directo, sem sub-acções como os serviços clínicos acima. A secção
// aparece no menu a TODOS os utilizadores, mas só os administradores entram:
// para os restantes, clicar mostra uma mensagem (zeloAvisoSoAdmin), e as
// próprias páginas também o verificam
// (window.ZELO_SO_ADMIN, em zelo_pagegate.js).
const ZELO_SERVICO_ESTATISTICA = 'Serviço de Estatística';
const SISTEMAS_LOCAIS_MENU = [
  { nome: 'Estatística', file: 'Estatistica.html', modulo: 'estatistica', item: null },
  { nome: 'Procedimentos de Enfermagem · Geral', file: 'procedimentos_enfermagem_geral.html', modulo: 'procedimentos_enfermagem', item: 'geral' },
  { nome: 'Controlo de Faltas · GEPE/DEMA', file: 'controlo_faltas_gepedema.html', modulo: 'sistemas_independentes', item: 'controlo_faltas_gepedema' },
  { nome: 'Registo VIH · Geral', file: 'registo_hiv.html', modulo: 'sistemas_independentes', item: 'registo_hiv' },
  // Secretaria Geral e Reprografia estão agora em Serviços (SERVICOS_MENU),
  // cada uma com a sua entrada, a seguir à Supervisão.
];

// O Serviço de Estatística aparece dentro de Serviços, em último lugar, com
// estas páginas como links directos. soAdmin: quem não é administrador vê o
// link mas, ao clicar, recebe a mensagem de sem permissão.
SERVICOS_MENU.push({ nome: ZELO_SERVICO_ESTATISTICA, categoria: 'servico_estatistica', icon: 'chart', cor: '#1E3A8A',
  relatorios: SISTEMAS_LOCAIS_MENU.map(function(s){
    return { label: s.nome, file: s.file, modulo: s.modulo, item: s.item, soAdmin: true };
  }) });

// Agrupa os serviços de uma categoria para os menus em árvore: serviços com
// o mesmo "grupo" (ex.: Medicina Homem + Medicina Mulher → "Medicina Interna")
// ficam num nó próprio, no lugar do primeiro deles, pela ordem da lista.
// Devolve [{ tipo:'svc', svc }, { tipo:'grupo', nome, itens:[svc, ...] }, ...].
function zeloAgruparServicos(itens){
  var nos = [], grupos = {};
  (itens || []).forEach(function(svc){
    if (!svc.grupo){ nos.push({ tipo: 'svc', svc: svc }); return; }
    if (!grupos[svc.grupo]){
      grupos[svc.grupo] = { tipo: 'grupo', nome: svc.grupo, itens: [] };
      nos.push(grupos[svc.grupo]);
    }
    grupos[svc.grupo].itens.push(svc);
  });
  return nos;
}

// Slug estável a partir do nome do serviço — usado como id do cartão em
// servicos.html e como âncora (#svc-...) pelos atalhos do menu lateral em
// index.html. Tem de ser a MESMA função nos dois ficheiros, daqui partilhada.
function zeloSlugifyServico(nome){
  return String(nome || '').toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ── Menus: tudo aparece a todos; a permissão só é verificada no clique ──
// Quem não tem acesso a uma página continua a vê-la no menu (para saber que
// existe), mas ao clicar recebe uma mensagem em vez de abrir a página.
function zeloAvisoSemPermissao(texto){
  if (typeof document === 'undefined') return;
  var antigo = document.getElementById('zelo-aviso-admin');
  if (antigo) antigo.remove();
  // Mesmo design dos ecrãs de espera (zelo_espera.js), quando disponível.
  if (window.ZeloEspera && window.ZeloEspera.mensagem) {
    var soAdmin = /administradores/i.test(texto || '');
    window.ZeloEspera.mensagem({
      icone: soAdmin ? 'admin' : 'info',
      titulo: soAdmin ? 'Acesso só para administradores' : 'Sem permissão de acesso',
      texto: (texto || 'Não tem permissão para aceder a esta página.') + ' Contacte um dos administradores do ZELO.',
      botoes: [{ texto: 'Entendi', principal: true }]
    });
    return;
  }
  var fundo = document.createElement('div');
  fundo.id = 'zelo-aviso-admin';
  fundo.setAttribute('role', 'alertdialog');
  fundo.setAttribute('aria-modal', 'true');
  fundo.style.cssText = 'position:fixed;inset:0;z-index:2147483600;background:rgba(8,14,32,.5);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,Arial,sans-serif;';
  fundo.innerHTML =
    '<div style="max-width:380px;width:100%;background:#fff;border-radius:16px;padding:28px 24px 22px;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.35);">' +
      '<div style="width:54px;height:54px;border-radius:50%;background:#EFF6FF;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;">' +
        '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1A56DB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>' +
      '</div>' +
      '<div style="font-size:1.05rem;font-weight:800;color:#0D1B3E;margin-bottom:6px;">Sem permissão de acesso</div>' +
      '<div style="font-size:.88rem;color:#475569;line-height:1.5;margin-bottom:18px;">' +
        (texto || 'Não tem permissão para aceder a esta página.') + '<br>Contacte um dos administradores do ZELO.</div>' +
      '<button type="button" style="padding:10px 26px;border-radius:10px;background:#0D1B3E;color:#fff;border:none;font-weight:700;font-size:.88rem;cursor:pointer;">Entendi</button>' +
    '</div>';
  function fechar(){ fundo.remove(); document.removeEventListener('keydown', tecla, true); }
  function tecla(e){ if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); fechar(); } }
  fundo.addEventListener('click', function(e){ if (e.target === fundo) fechar(); });
  fundo.querySelector('button').addEventListener('click', fechar);
  document.addEventListener('keydown', tecla, true);
  document.body.appendChild(fundo);
  fundo.querySelector('button').focus();
}
function zeloAvisoSoAdmin(){
  zeloAvisoSemPermissao('O ' + ZELO_SERVICO_ESTATISTICA + ' é só para administradores.');
}
// Pode abrir? (papel/permissões da sessão actual, lidos no momento do clique)
function zeloPodeAbrirLink(a){
  var role = 'funcionario', permissoes = {};
  try {
    role = sessionStorage.getItem('zeloRole') || 'funcionario';
    permissoes = JSON.parse(sessionStorage.getItem('zeloPermissoes') || '{}') || {};
  } catch (e) {}
  if (a.dataset.soAdmin) return role === 'admin';
  var modulo = a.dataset.modulo || a.dataset.module;
  if (!modulo) return true;
  var fn = window.__zeloHasModuleAccess || window.hasModuleAccess || (window.ZeloAuth && window.ZeloAuth.hasModuleAccess);
  if (typeof fn !== 'function') return true; // a própria página volta a verificar
  return fn(role, permissoes, modulo, a.dataset.item || null);
}
function zeloTentarAbrirLink(a){
  if (zeloPodeAbrirLink(a)) return true;
  if (a.dataset.soAdmin) zeloAvisoSoAdmin(); else zeloAvisoSemPermissao();
  return false;
}
if (typeof document !== 'undefined') {
  document.addEventListener('click', function(e){
    var a = e.target && e.target.closest && e.target.closest('a[data-modulo],a[data-module],a[data-so-admin]');
    if (!a || !a.closest('#zeloSidebarNav,#zmf-panel,#zeloSearchResults')) return;
    if (zeloTentarAbrirLink(a)) return;
    e.preventDefault();
    e.stopPropagation();
  }, true);
}

if (typeof window !== 'undefined') {
  window.ZELO_SERVICO_ESTATISTICA = ZELO_SERVICO_ESTATISTICA;
  window.zeloAvisoSoAdmin = zeloAvisoSoAdmin;
  window.zeloAvisoSemPermissao = zeloAvisoSemPermissao;
  window.zeloTentarAbrirLink = zeloTentarAbrirLink;
  window.SERVICOS_MENU = SERVICOS_MENU;
  window.CATEGORIAS_SERVICOS = CATEGORIAS_SERVICOS;
  window.zeloSlugifyServico = zeloSlugifyServico;
  window.zeloAgruparServicos = zeloAgruparServicos;
  window.SISTEMAS_LOCAIS_MENU = SISTEMAS_LOCAIS_MENU;
}
