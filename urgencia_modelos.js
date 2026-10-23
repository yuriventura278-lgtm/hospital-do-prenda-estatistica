// Banco de Urgência — recolha de dados das 24 horas (formulário público).
// Um modelo por serviço. Só se recolhem TOTAIS do turno (sem nomes de doentes).
//
// Para mudar campos, edite só este ficheiro:
//  - O código de cada contagem (ex.: 'obs_m') é o que fica guardado. Se mudar o
//    sentido de um campo, use um código novo em vez de reaproveitar.
//  - Códigos: só letras minúsculas, números e "_" (únicos dentro de cada serviço).
//  - Secção: { id, titulo, nota?, total?, grupos: [{ rotulo?, soma?, campos }] }
//      total: 'g0' = o subtotal da secção é a soma do 1.º grupo (ex.: doentes
//             por sexo, sem somar outra vez por idade); false = sem subtotal
//             (campos que não se somam, ex.: leitos); omitido = soma de tudo.
//      soma:  true mostra a soma do grupo ao lado do rótulo.
// Campos e categorias tirados das páginas de cada serviço no ZELO.
(function () {
  // ── Blocos reutilizados ──
  const doentes = (titulo, nota) => ({
    id: 'doentes', titulo: titulo || 'Doentes atendidos', nota, total: 'g0',
    grupos: [
      { rotulo: 'Por sexo', soma: true, campos: [['obs_m', 'Masculino'], ['obs_f', 'Feminino']] },
      { rotulo: 'Por idade', soma: true, campos: [['idade_men15', 'Menos de 15 anos'], ['idade_mai15', '15 anos ou mais']] },
    ],
  });
  const DESTINO = {
    id: 'destino', titulo: 'Destino dos doentes',
    grupos: [{ campos: [
      ['altas', 'Altas'],
      ['internados', 'Internados'],
      ['transf_recebidas', 'Transferências recebidas'],
      ['transf_efetuadas', 'Transferências efectuadas (para outros hospitais)'],
      ['obitos', 'Óbitos'],
    ] }],
  };
  const SINISTROS = {
    id: 'sinistros', titulo: 'Sinistros', nota: 'Doentes que chegaram por cada tipo de sinistro.',
    grupos: [{ campos: [
      ['s_agressao', 'Agressão física'], ['s_ac_trabalho', 'Acidente de trabalho'], ['s_ac_domestico', 'Acidente doméstico'],
      ['s_ac_desporto', 'Acidente desportivo'], ['s_ac_pessoal', 'Acidente pessoal'], ['s_atropela', 'Atropelamento'],
      ['s_queimadura', 'Queimadura'], ['s_fer_branca', 'Ferimentos por arma branca'], ['s_fer_fogo', 'Ferimentos por arma de fogo'],
      ['s_quedas', 'Quedas'], ['s_ac_viacao', 'Acidente de viação'],
    ] }],
  };
  const PROCEDIMENTOS = {
    id: 'procedimentos', titulo: 'Procedimentos realizados',
    grupos: [{ campos: [
      ['p_curativos', 'Curativos'], ['p_suturas', 'Suturas'], ['p_gessos', 'Gessos'],
      ['p_fer_paf', 'Ferimentos por projéctil de arma de fogo'], ['p_fer_ab', 'Ferimentos por arma branca'],
    ] }],
  };
  const leitos = (extra) => ({
    id: 'leitos', titulo: 'Leitos no fim do turno', total: false,
    grupos: [{ campos: [['leitos_ocupados', 'Leitos ocupados'], ['leitos_vagos', 'Leitos vagos']].concat(extra || []) }],
  });
  const CIRURGICO = [doentes('Doentes observados', 'Todos os doentes vistos pelo serviço nas 24 horas.'), DESTINO, SINISTROS, PROCEDIMENTOS];

  window.URG_GRUPOS = [
    ['clinico', 'Urgência e internamento'],
    ['apoio', 'Bloco e serviços de apoio'],
    ['ambulatorio', 'Ambulatório'],
    ['gestao', 'Gestão'],
  ];

  window.URG_SERVICOS = [
    // ───────── Urgência e internamento ─────────
    { id: 'medicina_interna', grupo: 'clinico', nome: 'Medicina Interna', desc: 'Urgência médica',
      secoes: [doentes('Doentes observados', 'Todos os doentes vistos pelo serviço nas 24 horas.'), DESTINO] },
    { id: 'ortopedia', grupo: 'clinico', nome: 'Ortopedia', desc: 'Traumatologia', secoes: CIRURGICO },
    { id: 'cirurgia_geral', grupo: 'clinico', nome: 'Cirurgia Geral', desc: 'Banco de cirurgia', secoes: CIRURGICO },
    { id: 'maxilo_facial', grupo: 'clinico', nome: 'Cirurgia Maxilo-Facial', desc: 'Face e boca', secoes: CIRURGICO },
    { id: 'neurocirurgia', grupo: 'clinico', nome: 'Neurocirurgia', desc: 'Trauma crânio-encefálico', secoes: CIRURGICO },
    { id: 'nefrologia', grupo: 'clinico', nome: 'Nefrologia', desc: 'Hemodiálise e internamento', secoes: [
      { id: 'sessoes', titulo: 'Sessões de diálise', grupos: [{ campos: [['hemodialise', 'Hemodiálise'], ['dialise_peritoneal', 'Diálise peritoneal']] }] },
      doentes('Doentes entrados'),
      { id: 'movimento', titulo: 'Movimento', grupos: [{ campos: [['altas', 'Altas'], ['transf_efetuadas', 'Transferidos'], ['obitos', 'Óbitos']] }] },
      leitos(),
    ] },
    { id: 'uci', grupo: 'clinico', nome: 'UCI', desc: 'Cuidados intensivos', secoes: [
      { id: 'doentes_uci', titulo: 'Doentes internados', total: 'g0', grupos: [
        { rotulo: 'Internados no fim do turno', soma: true, campos: [['obs_m', 'Masculino'], ['obs_f', 'Feminino']] },
        { campos: [['ventilados', 'Ventilados']] },
      ] },
      { id: 'movimento', titulo: 'Movimento', grupos: [{ campos: [
        ['admissoes', 'Admissões'], ['transf_enfermaria', 'Altas / transferidos para a enfermaria'],
        ['transf_efetuadas', 'Transferidos para outro hospital'], ['obitos', 'Óbitos'],
      ] }] },
      leitos([['pendentes_uci', 'Doentes à espera de vaga na UCI'], ['pendentes_enfermaria', 'Doentes à espera de vaga na enfermaria']]),
    ] },

    // ───────── Bloco e serviços de apoio ─────────
    { id: 'bloco_operatorio', grupo: 'apoio', nome: 'Bloco Operatório', desc: 'Cirurgias e anestesias', secoes: [
      { id: 'cirurgias', titulo: 'Cirurgias', total: 'g0', grupos: [
        { rotulo: 'Realizadas', soma: true, campos: [['cir_urgentes', 'Cirurgias urgentes'], ['cir_eletivas', 'Cirurgias electivas']] },
        { campos: [['cir_suspensas', 'Cirurgias suspensas']] },
      ] },
      { id: 'operados', titulo: 'Doentes operados', grupos: [{ campos: [['obs_m', 'Homens'], ['obs_f', 'Mulheres']] }] },
      { id: 'anestesia', titulo: 'Tipo de anestesia', grupos: [{ campos: [
        ['an_endotraqueal', 'Geral endotraqueal'], ['an_endovenosa', 'Geral endovenosa'], ['an_raquidiana', 'Raquidiana'],
        ['an_epidural', 'Epidural'], ['an_bloqueio', 'Bloqueio nervoso'], ['an_local', 'Local'],
      ] }] },
      { id: 'destino', titulo: 'Destino após a cirurgia', grupos: [{ campos: [
        ['transf_sala', 'Transferidos para a sala / enfermaria'], ['transf_uci', 'Transferidos para a UCI'], ['obitos', 'Óbitos'],
      ] }] },
    ] },
    { id: 'laboratorio', grupo: 'apoio', nome: 'Laboratório', desc: 'Análises clínicas', secoes: [
      { id: 'exames', titulo: 'Exames realizados', grupos: [{ campos: [
        ['ex_hematologia', 'Hematologia'], ['ex_bioquimica', 'Bioquímica'], ['ex_parasitologia', 'Parasitologia'],
        ['ex_imunologia', 'Imunologia'], ['ex_outros', 'Outros exames'],
      ] }] },
      { id: 'origem', titulo: 'Origem dos pedidos', nota: 'Número de doentes atendidos por origem.', grupos: [{ campos: [
        ['or_urgencia', 'Banco de Urgência'], ['or_internamento', 'Internamento'], ['or_externos', 'Consulta externa / externos'],
      ] }] },
      { id: 'positivos', titulo: 'Resultados positivos', grupos: [{ campos: [['pos_malaria', 'Malária (gota espessa / teste rápido)'], ['pos_vih', 'VIH'], ['pos_outros', 'Outros positivos']] }] },
    ] },
    { id: 'imagiologia', grupo: 'apoio', nome: 'Imagiologia', desc: 'Raio X, ecografia e TAC', secoes: [
      { id: 'exames', titulo: 'Exames realizados', grupos: [{ campos: [
        ['im_raiox', 'Raio X'], ['im_ecografia', 'Ecografia'], ['im_tac', 'TAC'], ['im_doppler', 'Doppler'], ['im_outros', 'Outros exames'],
      ] }] },
      { id: 'origem', titulo: 'Origem dos pedidos', grupos: [{ campos: [
        ['or_urgencia', 'Banco de Urgência'], ['or_internamento', 'Internamento'], ['or_externos', 'Consulta externa / externos'],
      ] }] },
    ] },
    { id: 'hemoterapia', grupo: 'apoio', nome: 'Hemoterapia', desc: 'Banco de sangue', secoes: [
      { id: 'transfusoes', titulo: 'Transfusões', grupos: [{ campos: [
        ['tr_globulos', 'Concentrado de glóbulos'], ['tr_plasma', 'Plasma'], ['tr_plaquetas', 'Plaquetas'], ['tr_crio', 'Crioprecipitado'],
      ] }] },
      { id: 'banco_sangue', titulo: 'Banco de sangue', total: false, grupos: [{ campos: [
        ['provas_compat', 'Provas de compatibilidade'], ['dadores', 'Dadores'], ['unidades_colhidas', 'Unidades colhidas'], ['unidades_perdidas', 'Unidades perdidas / inutilizadas'],
      ] }] },
      { id: 'serologia', titulo: 'Serologia — reagentes', grupos: [{ campos: [['sr_vih', 'VIH'], ['sr_hbs', 'HBs (hepatite B)'], ['sr_vdrl', 'VDRL (sífilis)'], ['sr_hcv', 'HCV (hepatite C)']] }] },
    ] },
    { id: 'esterilizacao', grupo: 'apoio', nome: 'Esterilização', desc: 'Material esterilizado', secoes: [
      { id: 'material', titulo: 'Material', total: false, grupos: [{ campos: [
        ['mat_recebido', 'Caixas / kits recebidos dos serviços'], ['mat_esterilizado', 'Caixas / kits esterilizados'],
        ['mat_pacotes', 'Pacotes / embalagens avulsas'], ['mat_entregue', 'Caixas / kits entregues aos serviços'],
      ] }] },
      { id: 'ciclos', titulo: 'Ciclos de autoclave', total: false, grupos: [{ campos: [['ciclos', 'Ciclos realizados'], ['ciclos_falha', 'Ciclos com falha / repetidos']] }] },
    ] },

    // ───────── Ambulatório ─────────
    { id: 'consulta_externa', grupo: 'ambulatorio', nome: 'Consulta Externa', desc: 'Consultas do dia', secoes: [
      { id: 'consultas', titulo: 'Consultas', total: false, grupos: [{ campos: [
        ['cons_agendadas', 'Consultas agendadas'], ['cons_realizadas', 'Consultas realizadas'], ['cons_ausentes', 'Doentes ausentes'],
      ] }, { rotulo: 'Das realizadas', soma: true, campos: [['cons_primeira', 'Primeira consulta'], ['cons_retorno', 'Consulta de retorno']] }] },
      doentes('Doentes atendidos'),
    ] },
    { id: 'fisioterapia', grupo: 'ambulatorio', nome: 'Fisioterapia', desc: 'Sessões e modalidades', secoes: [
      { id: 'doentes_fisio', titulo: 'Doentes', total: 'g0', grupos: [
        { rotulo: 'Por origem', soma: true, campos: [['fis_internos', 'Doentes internados'], ['fis_externos', 'Doentes externos']] },
        { rotulo: 'Por sexo', soma: true, campos: [['obs_m', 'Masculino'], ['obs_f', 'Feminino']] },
      ] },
      { id: 'sessoes', titulo: 'Sessões por modalidade', grupos: [{ campos: [
        ['mod_eletroterapia', 'Electroterapia (TENS / FES)'], ['mod_termoterapia', 'Termoterapia'], ['mod_crioterapia', 'Crioterapia'],
        ['mod_massagem', 'Massagem terapêutica'], ['mod_exercicio', 'Exercício terapêutico'], ['mod_mobilizacao', 'Mobilização articular'],
        ['mod_cinesioterapia', 'Cinesioterapia'], ['mod_drenagem', 'Drenagem linfática'], ['mod_outras', 'Outras'],
      ] }] },
    ] },

    // ───────── Gestão ─────────
    { id: 'supervisao', grupo: 'gestao', nome: 'Supervisão', desc: 'Supervisão do dia', secoes: [
      { id: 'hospital', titulo: 'Movimento do hospital nas 24 horas', total: false, grupos: [{ campos: [
        ['hosp_internados', 'Doentes internados no hospital'], ['admissoes', 'Admissões'], ['altas', 'Altas'],
        ['transf_recebidas', 'Transferências recebidas'], ['transf_efetuadas', 'Transferências efectuadas'], ['obitos', 'Óbitos'],
        ['leitos_vagos', 'Leitos vagos no hospital'],
      ] }] },
      { id: 'ocorrencias', titulo: 'Ocorrências', grupos: [{ campos: [
        ['oc_faltas_pessoal', 'Faltas de pessoal'], ['oc_material', 'Falta de material / medicamentos'], ['oc_equipamento', 'Avarias de equipamento'],
        ['oc_seguranca', 'Ocorrências de segurança'], ['oc_reclamacoes', 'Reclamações recebidas'], ['oc_outras', 'Outras ocorrências'],
      ] }] },
    ] },
  ];

  window.URG_CLASSIF = [['calmo', 'Calmo'], ['moderado', 'Moderado'], ['movimentado', 'Movimentado'], ['agitado', 'Agitado'], ['critico', 'Crítico']];
  window.URG_CATEGORIAS = [
    ['medico_especialista', 'Médico especialista'], ['medico_interno', 'Médico interno'], ['medico_estagiario', 'Médico estagiário'],
    ['enfermeiro', 'Enfermeiro'], ['tecnico', 'Técnico'], ['supervisor', 'Supervisor'], ['outro', 'Outro'],
  ];

  // Todos os campos de um serviço, pela ordem: [[código, rótulo, título da secção], ...]
  window.urgCampos = function (s) {
    const out = [];
    s.secoes.forEach((sec) => sec.grupos.forEach((g) => g.campos.forEach((c) => out.push([c[0], c[1], sec.titulo]))));
    return out;
  };
  // Subtotal de uma secção a partir de uma função val(código) → número (null se a secção não tem subtotal)
  window.urgSubtotal = function (sec, val) {
    if (sec.total === false) return null;
    const grupos = sec.total === 'g0' ? [sec.grupos[0]] : sec.grupos;
    return grupos.reduce((a, g) => a + g.campos.reduce((b, c) => b + (val(c[0]) || 0), 0), 0);
  };
})();
