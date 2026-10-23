// Banco de Urgência — recolha de dados das 24 horas (formulário público).
// Um modelo por serviço, igual às fichas de recolha de dados do Serviço de
// Estatística (Medicina Interna, Ortopedia, Cirurgia, Maxilo-Facial,
// Neurocirurgia, Oftalmologia, UCI, Bloco Operatório, Imagiologia, Nefrologia
// e Consulta Externa). O link é aberto: NÃO se pedem nomes de doentes — nas
// listas ficam só idade, género, diagnóstico, unidade e hora.
//
// Cada secção tem UM destes conteúdos:
//   grupos: [{ rotulo?, soma?, campos: [[código, rótulo], ...] }]   → contadores − / +
//   textos: [[código, rótulo, dica?], ...]                          → campos de texto (ex.: equipa)
//   lista:  { item, colunas, conta?, somar?, contarEscolha?, max? }   → linhas "Adicionar"
//   grade:  { linhas: [[código, rótulo, grupo?]], colunas: [[código, rótulo, 'n'|'t']] }
// Códigos: só letras minúsculas, números e "_" (únicos dentro de cada serviço).
// Listas: conta → guarda o n.º de linhas na contagem indicada; somar → soma uma
// coluna numérica; contarEscolha → conta valores de uma escolha.
(function () {
  // ── Colunas das listas ──
  const C = {
    idade: ['idade', 'Idade', 'idade'],
    genero: ['genero', 'Género', 'genero'],
    diag: ['diag', 'Diagnóstico', 'texto'],
    diagOp: ['diag', 'Diagnóstico operatório', 'texto'],
    unidade: ['unidade', 'Unidade', 'texto'],
    causa: ['causa', 'Causa', 'texto'],
    hora: ['hora', 'Hora', 'hora'],
    desc: ['desc', 'Descrição da cirurgia', 'texto'],
    casos: ['casos', 'Casos', 'numero'],
  };
  const DOENTE = [C.idade, C.genero, C.diag];
  const TRANSF = [C.idade, C.genero, C.diag, C.unidade];
  const OBITO = [C.idade, C.genero, C.causa, C.hora];
  const VERIF = [C.idade, C.genero, C.diag, C.hora];

  // ── Blocos comuns ──
  const equipa = (comEstagiarios) => ({
    id: 'equipa', titulo: 'Equipe médica em serviço', textos: [
      ['med_especialista', 'Médico especialista'],
      ['med_interno_1', 'Médico interno 1'], ['med_interno_2', 'Médico interno 2'], ['med_interno_3', 'Médico interno 3'],
    ].concat(comEstagiarios === false ? [] : [['med_estagiario_1', 'Médico estagiário 1'], ['med_estagiario_2', 'Médico estagiário 2'], ['med_estagiario_3', 'Médico estagiário 3']]),
  });
  const equipaEntra = (titulo) => ({
    id: 'equipa_entra', titulo: titulo || 'Equipe que entra (turno seguinte)', textos: [
      ['entra_especialista', 'Médico especialista'],
      ['entra_interno_1', 'Médico interno 1'], ['entra_interno_2', 'Médico interno 2'], ['entra_interno_3', 'Médico interno 3'],
    ],
  });
  const lista = (id, titulo, item, colunas, conta, nota) => ({ id, titulo, nota, lista: { item, colunas, conta, max: 40 } });
  const observadosMF = { id: 'observados', titulo: 'Pacientes observados', grupos: [{ soma: true, campos: [['obs_m', 'Masculino'], ['obs_f', 'Feminino']] }] };
  const observadosTotal = { id: 'observados', titulo: 'Total de pacientes observados', grupos: [{ campos: [['observados', 'Pacientes observados nas 24 horas']] }] };
  const diagnosticos = { id: 'diagnosticos', titulo: 'Principais diagnósticos', nota: 'Diagnóstico e número de casos.', lista: { item: 'diagnóstico', colunas: [C.diag, C.casos], max: 10 } };
  const bloco = (n) => [
    { id: 'bloco', titulo: 'Bloco operatório', grupos: [{ campos: [['cir_menores', 'Cirurgias menores'], ['cir_maiores', 'Cirurgias maiores']] }] },
    lista('cir_maiores_desc', 'Descrição das cirurgias maiores', 'cirurgia', [C.idade, C.diag, C.desc]),
  ];
  const obitos = (tBanco, tInt) => [
    lista('obitos_banco', tBanco || 'Óbitos no Banco de Urgência', 'óbito', OBITO, 'obitos_banco'),
    lista('obitos_internamento', tInt || 'Óbitos no internamento', 'óbito', OBITO, 'obitos_internamento'),
  ];
  const verificacao = (t) => lista('verificacoes', t || 'Verificação', 'verificação', VERIF, 'verificacoes');
  const transfs = (recebidasPrimeiro) => {
    const ef = lista('transf_efetuadas', 'Transferências efectuadas', 'transferência', TRANSF, 'transf_efetuadas');
    const rc = lista('transf_recebidas', 'Transferências recebidas', 'transferência', TRANSF, 'transf_recebidas');
    return recebidasPrimeiro ? [rc, ef] : [ef, rc];
  };
  const SINISTROS = {
    id: 'sinistros', titulo: 'Dados de sinistralidade', grupos: [{ campos: [
      ['s_agressao', 'Agressão física'], ['s_ac_trabalho', 'Acidente de trabalho'], ['s_ac_domestico', 'Acidente doméstico'],
      ['s_ac_desporto', 'Acidente desportivo'], ['s_ac_escolar', 'Acidente escolar'], ['s_ac_pessoal', 'Acidente pessoal'],
      ['s_queimadura', 'Queimadura'], ['s_violacao', 'Violação'], ['s_fer_branca', 'Ferimentos por arma branca'],
      ['s_fer_fogo', 'Ferimentos por arma de fogo'], ['s_afogamento', 'Afogamento'], ['s_quedas', 'Quedas de altura'], ['s_ac_viacao', 'Acidente de viação'],
    ] }],
  };
  const actos = (maxilo) => ({
    id: 'actos', titulo: 'Actos e procedimentos', grupos: [{ campos: maxilo
      ? [['p_curativos', 'Curativos'], ['p_suturas', 'Suturas'], ['p_drenagem', 'Drenagem de abcessos'], ['p_fer_paf', 'Ferimentos por projéctil de arma de fogo'], ['p_fer_ab', 'Ferimentos por arma branca'], ['p_reducao_fract', 'Redução de fracturas']]
      : [['p_curativos', 'Curativos'], ['p_suturas', 'Suturas'], ['p_gessos', 'Gessos'], ['p_fer_paf', 'Ferimentos por projéctil de arma de fogo'], ['p_fer_ab', 'Ferimentos por arma branca']] }],
  });
  const PROCESSOS = {
    id: 'processos', titulo: 'Processos clínicos', grupos: [{ campos: [
      ['pc_infeccioso', 'Processo infeccioso'], ['pc_tumoral', 'Processo tumoral'], ['pc_degenerativo', 'Processo degenerativo'], ['pc_congenito', 'Processo congénito'],
    ] }],
  };
  // Ortopedia e Cirurgia têm a mesma ficha (só muda o título)
  const fichaCirurgica = (maxilo) => [
    observadosTotal, equipa(),
    lista('internados', 'Pacientes a internar', 'doente', DOENTE, 'internados'),
  ].concat(maxilo
    ? transfs(false).concat(obitos(), [verificacao()], bloco())
    : transfs(false).concat(bloco(), obitos(), [verificacao()])
  ).concat([SINISTROS, actos(maxilo), PROCESSOS, equipaEntra()]);

  // Resumo do turno (o mesmo que a ficha tem «para uso do Serviço de Estatística»)
  const RESUMO_CIR = [['observados', 'Pacientes observados'], ['internados', 'Pacientes internados'], ['transf_efetuadas', 'Transf. efectuadas'],
    ['transf_recebidas', 'Transf. recebidas'], ['cir_menores', 'Cirurgias menores'], ['cir_maiores', 'Cirurgias maiores'],
    ['obitos_banco', 'Óbitos no banco'], ['obitos_internamento', 'Óbitos no internamento'], ['verificacoes', 'Verificações']];

  // Imagiologia: exames por serviço
  const IMAG_LINHAS = [
    ['bu_medicina', 'Medicina', 'Banco de Urgência'], ['bu_cirurgia', 'Cirurgia', 'Banco de Urgência'], ['bu_ortopedia', 'Ortopedia', 'Banco de Urgência'],
    ['bu_neuro', 'Neurocirurgia', 'Banco de Urgência'], ['bu_hemodialise', 'Hemodiálise', 'Banco de Urgência'], ['bu_maxilo', 'Maxilo-facial', 'Banco de Urgência'],
    ['pi_medicina', 'Medicina', 'Pisos'], ['pi_cirurgia', 'Cirurgia', 'Pisos'], ['pi_ortopedia', 'Ortopedia', 'Pisos'], ['pi_nefrologia', 'Nefrologia', 'Pisos'],
    ['pi_neuro', 'Neurocirurgia', 'Pisos'], ['pi_uci', 'UCI', 'Pisos'], ['pi_maxilo', 'Maxilo-facial', 'Pisos'],
    ['autorizados', 'Casos autorizados', 'Outros'],
  ];
  const CE_ESP = [
    ['medicina', 'Medicina'], ['neurologia', 'Neurologia'], ['cardiologia', 'Cardiologia'], ['cirurgia_geral', 'Cirurgia Geral'],
    ['ortopedia', 'Ortopedia'], ['neurocirurgia', 'Neurocirurgia'], ['reumatologia', 'Reumatologia'], ['maxilofacial', 'C. Maxilofacial'],
    ['anestesiologia', 'Anestesiologia'], ['urologia', 'Urologia'], ['coloproctologia', 'Coloproctologia'], ['estomatologia', 'Estomatologia'],
    ['optometria', 'Optometria'], ['oftalmologia', 'Oftalmologia'], ['neuropsicologia', 'Neuropsicologia'], ['otorrino', 'Otorrinolaringologia'],
    ['gastro', 'Gastroenterologia'], ['hospital_dia', 'Hospital de Dia'],
  ];
  const camas = (de, ate, grupo) => { const o = []; for (let i = de; i <= ate; i++) o.push(['cama_' + i, 'Cama ' + i, grupo]); return o; };

  window.URG_GRUPOS = [
    ['clinico', 'Urgência e internamento'],
    ['apoio', 'Bloco e serviços de apoio'],
    ['ambulatorio', 'Ambulatório'],
    ['gestao', 'Gestão'],
  ];

  window.URG_SERVICOS = [
    // ───────── Urgência e internamento ─────────
    { id: 'medicina_interna', grupo: 'clinico', clinico: true, nome: 'Medicina Interna', desc: 'Banco de urgência', secoes: [
      equipa(),
      lista('so_homem', 'Pacientes em observação — SO Homem', 'doente', DOENTE, 'obs_so_homem'),
      lista('so_mulher', 'Pacientes em observação — SO Mulher', 'doente', DOENTE, 'obs_so_mulher'),
      lista('internados', 'Internamento de Medicina', 'doente', DOENTE, 'internados'),
    ].concat(obitos('Óbitos no banco'), [verificacao()], transfs(false), [
      { id: 'hospital_dia', titulo: 'Asseguramento no Hospital de Dia', lista: { item: 'médico', colunas: [['medico', 'Médico', 'texto'], ['doentes', 'Total de doentes atendidos', 'numero']], somar: { doentes: 'hospital_dia' }, max: 10 } },
      equipaEntra(),
    ]), resumo: [['obs_so_homem', 'Observação medicina homem'], ['obs_so_mulher', 'Observação medicina mulher'], ['internados', 'Internamentos de medicina'],
      ['obitos_banco', 'Óbitos no banco'], ['obitos_internamento', 'Óbitos no internamento'], ['verificacoes', 'Verificações'],
      ['transf_efetuadas', 'Transf. efectuadas'], ['transf_recebidas', 'Transf. recebidas'], ['hospital_dia', 'Hospital de dia']] },
    { id: 'ortopedia', grupo: 'clinico', clinico: true, nome: 'Ortopedia', desc: 'Banco de urgência', secoes: fichaCirurgica(false), resumo: RESUMO_CIR },
    { id: 'cirurgia_geral', grupo: 'clinico', clinico: true, nome: 'Cirurgia Geral', desc: 'Banco de cirurgia', secoes: fichaCirurgica(false), resumo: RESUMO_CIR },
    { id: 'maxilo_facial', grupo: 'clinico', clinico: true, nome: 'Cirurgia Maxilo-Facial', desc: 'Banco de urgência', secoes: fichaCirurgica(true), resumo: RESUMO_CIR },
    { id: 'neurocirurgia', grupo: 'clinico', clinico: true, nome: 'Neurocirurgia', desc: 'Banco de urgência', secoes: [
      equipa(), observadosMF, diagnosticos,
      lista('internados', 'Internamento no serviço', 'doente', DOENTE, 'internados'),
    ].concat(transfs(true), bloco(), obitos('Óbito no banco', 'Óbito no serviço'), [verificacao('Verificações'), equipaEntra('Médicos que entram (turno seguinte)')]),
      resumo: [['obs_m', 'Obs. masc.'], ['obs_f', 'Obs. fem.'], ['observados', 'Total geral'], ['internados', 'Internam. no serviço'],
        ['cir_menores', 'Cirurg. menores'], ['cir_maiores', 'Cirurg. maiores'], ['transf_recebidas', 'Transf. recebidas'], ['transf_efetuadas', 'Transf. efectuadas'],
        ['obitos_banco', 'Óbitos no banco'], ['obitos_internamento', 'Óbitos no serviço'], ['verificacoes', 'Verificações']] },
    { id: 'oftalmologia', grupo: 'clinico', clinico: true, nome: 'Oftalmologia', desc: 'Banco de urgência', secoes: [
      equipa(), observadosMF, diagnosticos,
    ].concat(transfs(true), [equipaEntra('Médicos que entram (turno seguinte)')]),
      resumo: [['obs_m', 'Observados masculino'], ['obs_f', 'Observados feminino'], ['observados', 'Total geral'], ['transf_recebidas', 'Transferências recebidas'], ['transf_efetuadas', 'Transferências efectuadas']] },
    { id: 'nefrologia', grupo: 'clinico', nome: 'Nefrologia', desc: 'Resumo médico de banco', secoes: [
      { id: 'equipa', titulo: 'Equipe médica', textos: [['med_saida', 'Médico/a de saída'], ['med_entrada', 'Médico/a de entrada']] },
      { id: 'dialise', titulo: 'Tratamentos dialíticos', grupos: [{ campos: [['hemodialise', 'Hemodiálise (sessões)'], ['dialise_peritoneal', 'Diálise peritoneal (sessões)']] }] },
      lista('entrados', 'Internamento — doentes entrados', 'doente', DOENTE, 'entrados'),
      { id: 'movimento', titulo: 'Movimento e ocupação do serviço', total: false, grupos: [{ campos: [['altas', 'Altas'], ['obitos', 'Óbitos'], ['leitos_ocupados', 'Leitos ocupados'], ['leitos_vagos', 'Vagas']] }] },
    ], resumo: [['hemodialise', 'Hemodiálise'], ['dialise_peritoneal', 'Diálise peritoneal'], ['entrados', 'Entrados'], ['altas', 'Altas'], ['obitos', 'Óbitos'], ['leitos_ocupados', 'Leitos ocupados'], ['leitos_vagos', 'Vagas']] },
    { id: 'uci', grupo: 'clinico', nome: 'UCI', desc: 'Resumo de actividades de banco', secoes: [
      { id: 'equipa', titulo: 'Equipe médica', textos: [['med_especialista', 'Médico especialista'], ['med_interno_1', 'Médico interno']] },
      { id: 'movimento', titulo: 'Movimento da unidade', total: false, grupos: [{ campos: [
        ['camas_ocupadas', 'Camas ocupadas'], ['ventilados', 'Doentes ventilados'], ['internados', 'Internados'], ['transferidos', 'Transferidos (total)'],
        ['falecidos', 'Falecidos'], ['pendentes_uci', 'Doentes pendentes de vaga na UCI'], ['pendentes_enfermaria', 'Doentes pendentes de vaga na enfermaria'],
      ] }] },
      { id: 'transf_destino', titulo: 'Transferidos — por serviço de destino', lista: { item: 'serviço', colunas: [['unidade', 'Serviço de destino', 'texto'], C.casos], max: 10 } },
      { id: 'avaliacoes', titulo: 'Avaliações realizadas', grupos: [{ campos: [
        ['av_bu', 'Banco de Urgência (B.U.)'], ['av_bo', 'Bloco Operatório (B.O.)'], ['av_medicina', 'Sala de Medicina'], ['av_cirurgia', 'Sala de Cirurgia'], ['av_ortopedia', 'Sala de Ortopedia'],
      ] }] },
      { id: 'camas', titulo: 'Doentes por cama', nota: 'UCI principal (camas 1 a 8) e UCI intermédia (camas 9 a 16). Sem nomes.', grade: {
        linhas: camas(1, 8, 'UCI principal').concat(camas(9, 16, 'UCI intermédia')), colunas: [['idade', 'Idade', 'n'], ['diag', 'Diagnóstico', 't']] } },
      { id: 'ocorrencias', titulo: 'Ocorrências', textos: [['ocorrencias', 'Ocorrências do turno', 'Descreva as ocorrências (sem nomes de doentes)']] },
      { id: 'equipa_entra', titulo: 'Equipe que entra (turno seguinte)', textos: [['entra_especialista', 'Médico especialista'], ['entra_interno_1', 'Médico interno']] },
    ], resumo: [['camas_ocupadas', 'Camas ocupadas'], ['ventilados', 'Ventilados'], ['internados', 'Internados'], ['transferidos', 'Transferidos'],
      ['falecidos', 'Falecidos'], ['pendentes_uci', 'Pendentes vaga UCI'], ['pendentes_enfermaria', 'Pendentes vaga enfermaria']] },

    // ───────── Bloco e serviços de apoio ─────────
    { id: 'bloco_operatorio', grupo: 'apoio', nome: 'Bloco Operatório', desc: 'Entrega de banco', secoes: [
      { id: 'equipa', titulo: 'Identificação do turno e equipe', textos: [['equipe_n', 'Equipe n.º'], ['med_especialista', 'Médico especialista'], ['medico_2', 'Médico 2'], ['medico_3', 'Médico 3']] },
      { id: 'casos', titulo: 'Registo de casos operados', nota: 'Um registo por doente operado (sem nome).', lista: {
        item: 'caso operado', max: 40, conta: 'casos',
        colunas: [C.idade, C.genero, C.diagOp,
          ['carater', 'Carácter', 'escolha', [['urg', 'Urgente'], ['ele', 'Electivo']]],
          ['tecnica', 'Técnica anestésica', 'escolha', [['got', 'Geral orotraqueal'], ['gev', 'Geral endovenosa'], ['reg', 'Regional']]],
          ['especialidade', 'Especialidade', 'texto'],
          ['destino', 'Destino', 'escolha', [['sala', 'Transf. sala'], ['uci', 'Transf. UCI'], ['falecido', 'Falecido']]]],
        contarEscolha: { carater: { urg: 'cir_urgentes', ele: 'cir_eletivas' }, tecnica: { got: 'an_got', gev: 'an_gev', reg: 'an_reg' }, destino: { sala: 'transf_sala', uci: 'transf_uci', falecido: 'falecidos' } },
      } },
      { id: 'totais', titulo: 'Total', grupos: [{ campos: [['procedimentos', 'Procedimentos n.º']] }] },
    ], resumo: [['casos', 'Casos operados'], ['cir_urgentes', 'Urgentes'], ['cir_eletivas', 'Electivos'], ['procedimentos', 'Procedimentos'],
      ['an_got', 'Geral orotraqueal'], ['an_gev', 'Geral endovenosa'], ['an_reg', 'Regional'], ['transf_sala', 'Transf. sala'], ['transf_uci', 'Transf. UCI'], ['falecidos', 'Falecidos']] },
    { id: 'imagiologia', grupo: 'apoio', nome: 'Imagiologia', desc: 'Resumo de actividades de banco', secoes: [
      { id: 'pessoal', titulo: 'Pessoal de serviço', textos: [['med_especialista', 'Médico especialista'], ['med_interno_1', 'Médico interno'], ['tecnico_1', 'Técnico 1'], ['tecnico_2', 'Técnico 2']] },
      { id: 'exames', titulo: 'Exames realizados por serviço', nota: 'Ptes = pacientes. Preencha só o que houve.', grade: {
        linhas: IMAG_LINHAS,
        colunas: [['rx_p', 'Raio X · ptes', 'n'], ['rx_e', 'Raio X · exames', 'n'], ['eco_p', 'Ecografia · ptes', 'n'], ['eco_e', 'Ecografia · exames', 'n'], ['tc_p', 'TC · ptes', 'n'], ['tc_e', 'TC · exames', 'n']],
      } },
      { id: 'outros', titulo: 'Outros exames', grupos: [{ campos: [['ecg', 'Electrocardiograma (n.º de exames)']] }] },
      { id: 'outros_txt', titulo: 'Outros exames (especificar)', textos: [['outros_exames', 'Outros exames', 'Quais e quantos']] },
      { id: 'equipa_entra', titulo: 'Equipa que entra (turno seguinte)', textos: [['entra_medico_1', 'Médico 1'], ['entra_medico_2', 'Médico 2'], ['entra_tecnico', 'Técnico']] },
    ], resumo: [['rx_e', 'Raio X (exames)'], ['eco_e', 'Ecografias'], ['tc_e', 'TC (exames)'], ['ecg', 'Electrocardiogramas']] },
    { id: 'laboratorio', grupo: 'apoio', nome: 'Laboratório', desc: 'Análises clínicas', secoes: [
      { id: 'exames', titulo: 'Exames realizados', grupos: [{ campos: [
        ['ex_hematologia', 'Hematologia'], ['ex_bioquimica', 'Bioquímica'], ['ex_parasitologia', 'Parasitologia'], ['ex_imunologia', 'Imunologia'], ['ex_outros', 'Outros exames'],
      ] }] },
      { id: 'origem', titulo: 'Origem dos pedidos', nota: 'Número de doentes atendidos por origem.', grupos: [{ campos: [
        ['or_urgencia', 'Banco de Urgência'], ['or_internamento', 'Internamento'], ['or_externos', 'Consulta externa / externos'],
      ] }] },
      { id: 'positivos', titulo: 'Resultados positivos', grupos: [{ campos: [['pos_malaria', 'Malária (gota espessa / teste rápido)'], ['pos_vih', 'VIH'], ['pos_outros', 'Outros positivos']] }] },
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
    { id: 'consulta_externa', grupo: 'ambulatorio', nome: 'Consulta Externa', desc: 'Movimento diário das consultas', diario: true, secoes: [
      { id: 'especialidades', titulo: 'Movimento por especialidade', nota: 'Médico e doentes atendidos (M / F) em cada especialidade. Preencha só as que tiveram consulta.', grade: {
        linhas: CE_ESP, colunas: [['medico', 'Médico', 't'], ['m', 'M', 'n'], ['f', 'F', 'n']],
      } },
    ], resumo: [['total', 'Total geral'], ['total_m', 'Masculino'], ['total_f', 'Feminino']] },
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

  // ── Funções comuns à página pública e à do administrador ──
  // Contadores que o utilizador preenche (secções "grupos"): [[código, rótulo, secção], ...]
  window.urgCampos = function (s) {
    const out = [];
    s.secoes.forEach((sec) => (sec.grupos || []).forEach((g) => g.campos.forEach((c) => out.push([c[0], c[1], sec.titulo]))));
    return out;
  };
  // Todas as contagens guardadas (contadores, grelhas e as calculadas das listas)
  window.urgTodasContagens = function (s) {
    const out = window.urgCampos(s).slice(), tem = (c) => out.some((x) => x[0] === c);
    const add = (c, t, sec) => { if (!tem(c)) out.push([c, t, sec]); };
    s.secoes.forEach((sec) => {
      if (sec.lista) {
        const L = sec.lista;
        if (L.conta) add(L.conta, sec.titulo, sec.titulo);
        Object.values(L.somar || {}).forEach((c) => add(c, sec.titulo, sec.titulo));
        Object.entries(L.contarEscolha || {}).forEach(([col, mapa]) => {
          const def = L.colunas.find((x) => x[0] === col);
          Object.entries(mapa).forEach(([v, c]) => { const o = def && def[3].find((x) => x[0] === v); add(c, (def ? def[1] + ': ' : '') + (o ? o[1] : v), sec.titulo); });
        });
      }
      if (sec.grade) sec.grade.linhas.forEach((l) => sec.grade.colunas.forEach((col) => { if (col[2] === 'n' && col[0] !== 'idade') add(l[0] + '_' + col[0], l[1] + ' · ' + col[1], sec.titulo); }));
    });
    (s.resumo || []).forEach(([c, t]) => add(c, t, 'Resumo'));
    return out;
  };
  // Contagens calculadas a partir de listas e grelhas (e totais) — usadas ao enviar
  window.urgDerivadas = function (s, contagens, listas, textos) {
    const d = {};
    s.secoes.forEach((sec) => {
      const L = sec.lista;
      if (L) {
        const rows = (listas && listas[sec.id]) || [];
        if (L.conta) d[L.conta] = rows.length;
        Object.entries(L.somar || {}).forEach(([col, c]) => { d[c] = rows.reduce((a, r) => a + (Number(r[col]) || 0), 0); });
        Object.entries(L.contarEscolha || {}).forEach(([col, mapa]) => Object.entries(mapa).forEach(([v, c]) => { d[c] = rows.filter((r) => r[col] === v).length; }));
      }
      if (sec.grade) {
        const nums = sec.grade.colunas.filter((c) => c[2] === 'n' && c[0] !== 'idade');
        nums.forEach((col) => { d[col[0]] = sec.grade.linhas.reduce((a, l) => a + (Number(contagens[l[0] + '_' + col[0]]) || 0), 0); });
      }
    });
    if ('obs_m' in contagens || 'obs_f' in contagens) {
      if (window.urgCampos(s).some((c) => c[0] === 'obs_m') && !window.urgCampos(s).some((c) => c[0] === 'observados')) d.observados = (Number(contagens.obs_m) || 0) + (Number(contagens.obs_f) || 0);
    }
    if (s.id === 'consulta_externa') { d.total_m = d.m || 0; d.total_f = d.f || 0; d.total = (d.m || 0) + (d.f || 0); }
    return d;
  };
  // Subtotal de uma secção de contadores (null se não tem)
  window.urgSubtotal = function (sec, val) {
    if (!sec.grupos || sec.total === false) return null;
    const grupos = sec.total === 'g0' ? [sec.grupos[0]] : sec.grupos;
    return grupos.reduce((a, g) => a + g.campos.reduce((b, c) => b + (val(c[0]) || 0), 0), 0);
  };
})();
