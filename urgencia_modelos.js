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
  // Código a partir do nome (ex.: 'Tempo Coagulação' → 'tempo_coagulacao')
  const slug = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 28);
  const linhasDe = (nomes, grupo, pre) => nomes.map((n) => [(pre || '') + slug(n), n, grupo]);

  // ── Laboratório: os mesmos exames da página do Laboratório no ZELO (laboratorio_geral.html) ──
  const LAB = [
    ['hem', 'Hematologia', ['Hemograma', 'Tempo Coagulação', 'Tempo Hemorragia', 'Pesquisa de Plasmódio', 'Ag Malária', 'VS']],
    ['par', 'Parasitologia', ['Urina II']],
    ['imu', 'Imunologia', ['HIV 1/2', 'Chikungunya', 'Dengue', 'Ag HBS', 'Ac HVB', 'Ac HCV', 'TASO (título antiestreptolisina)', 'Factor Reumatóide', 'PCR', 'Widal', 'VDRL']],
    ['bio', 'Bioquímica', ['Ureia', 'Creatinina', 'TGO', 'TGP', 'Glicemia', 'Triglicérido', 'Albumina', 'Gama GT', 'Bilirrubina Total', 'Bilirrubina Direta', 'Colesterol', 'Colesterol HDL', 'Colesterol LDL', 'Ácido Úrico']],
    ['out', 'Outros exames', ['Hemoglobina', 'Coagulograma', 'P. Leptospirose', 'Lipidograma', 'Albumina LCR', 'Proteínas Totais', 'Amilase', 'Exame Citológico do LCR', 'Exame Citológico Líquido Pleural', 'Urinologia (EAS)']],
  ];
  const LAB_POSITIVOS = ['Pesquisa de Plasmódio', 'HIV 1/2', 'Hemograma', 'Ag HBS', 'Ac HVB', 'Ac HCV', 'VDRL', 'Chikungunya', 'Dengue'];
  const COL_BU_INT = [['bu', 'B. Urgência', 'n'], ['int', 'Internamento', 'n']];

  // ── Imagiologia: os mesmos exames da página de Imagiologia no ZELO (imagiologia_radiologia_geral.html) ──
  const TAC_EXAMES = ['TAC Coluna Lombosacra', 'TAC Coluna Cervical', 'TAC Coluna Dorsal', 'TAC Abdominal', 'TAC Crânio', 'TAC Fígado', 'TAC Fossa Posterior',
    'TAC Membros Superiores', 'TAC Membros Inferiores', 'TAC Ouvido', 'TAC Órbita', 'TAC Pâncreas', 'TAC Pelvis Óssea', 'TAC Rim', 'TAC Seios Perinasais',
    'TAC Sela Turca', 'TAC Testículo', 'TAC Tórax', 'TAC Hipogástrio', 'TAC Suprarrenal', 'AngioTAC', 'Radiografia Contrastada'];
  const ECO_EXAMES = ['Ecografia Abdominal', 'Ecografia Gineco-Pélvica', 'Ecografia Osteomioarticular', 'Ecografia Renal', 'Ecografia de Mamas', 'Ecografia Torácica',
    'Ecografia do Testículo', 'Ecografia da Próstata', 'Ecografia da Tiróide', 'Ecografia das Partes Moles', 'Doppler', 'Ecografia Obstétrica', 'Eco Fast Total'];
  const RX_PLACAS = ['Placas 8X10', 'Placas 18X24', 'Placas 20X40', 'Placas 24X30', 'Placas 30X40', 'Placas 35X35', 'Placas 35X43', 'Placas Outras'];
  const COL_IMG = [['bu', 'B. Urgência', 'n'], ['aut', 'Autorizados', 'n'], ['int', 'Internamento', 'n']];

  // ── Fisioterapia: as mesmas listas da página de Fisioterapia no ZELO (banco_fisioterapia_v1-1-1.html) ──
  const FIS_INT = ['Cirurgia Geral', 'Ortopedia', 'Medicina Interna', 'UCI / UTI', 'Neurocirurgia', 'Maternidade', 'Pediatria', 'Neurologia', 'Cardiologia'];
  const FIS_EXT = ['Consulta Externa', 'Banco de Urgência'];
  const FIS_MOD = ['Electroterapia (TENS/FES)', 'Termoterapia', 'Crioterapia', 'Massagem Terapêutica', 'Exercício Terapêutico', 'Hidroterapia', 'Mobilização Articular',
    'Cinesioterapia', 'Manipulação', 'Drenagem Linfática'];

  // ── Diagnósticos CID-10 recomendados por especialidade (intervalos de categorias) ──
  const CID = {
    medicina_interna: ['A00-B99', 'D50-D89', 'E00-E90', 'I00-I99', 'J00-J99', 'K20-K93', 'N00-N39', 'R00-R99'],
    ortopedia: ['M00-M99', 'S00-T14', 'T90-T98', 'Q65-Q79'],
    cirurgia_geral: ['K20-K93', 'S20-S39', 'T14-T14', 'R10-R19', 'C15-C26', 'L00-L08', 'I80-I89', 'K40-K46', 'N13-N23'],
    maxilo_facial: ['K00-K14', 'S00-S09', 'C00-C14', 'Q35-Q38', 'L00-L08', 'T90-T90'],
    neurocirurgia: ['S00-S19', 'G00-G99', 'I60-I69', 'C70-C72', 'D32-D33', 'T90-T91', 'Q00-Q07', 'M40-M54'],
    oftalmologia: ['H00-H59', 'S05-S05', 'T15-T15', 'T26-T26', 'C69-C69'],
    nefrologia: ['N00-N39', 'I10-I15', 'E10-E14', 'D63-D64', 'E87-E87', 'R30-R39'],
    uci: ['A00-B99', 'I00-I99', 'J00-J99', 'R00-R99', 'S00-T98', 'G00-G99', 'E00-E90', 'N17-N19', 'O00-O99', 'K20-K93'],
    bloco_operatorio: ['K00-K93', 'S00-T98', 'C00-D48', 'N00-N99', 'O00-O99', 'M00-M99', 'H00-H95', 'L00-L99', 'Q00-Q99'],
  };

  const camas = (de, ate, grupo) => { const o = []; for (let i = de; i <= ate; i++) o.push(['cama_' + i, 'Cama ' + i, grupo]); return o; };

  window.URG_GRUPOS = [
    ['clinico', 'Urgência e internamento'],
    ['apoio', 'Bloco e serviços de apoio'],
    ['ambulatorio', 'Ambulatório'],
    ['gestao', 'Gestão'],
  ];

  window.URG_SERVICOS = [
    // ───────── Urgência e internamento ─────────
    { id: 'medicina_interna', cid: CID.medicina_interna, grupo: 'clinico', clinico: true, nome: 'Medicina Interna', desc: 'Banco de urgência', secoes: [
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
    { id: 'ortopedia', cid: CID.ortopedia, grupo: 'clinico', clinico: true, nome: 'Ortopedia', desc: 'Banco de urgência', secoes: fichaCirurgica(false), resumo: RESUMO_CIR },
    { id: 'cirurgia_geral', cid: CID.cirurgia_geral, grupo: 'clinico', clinico: true, nome: 'Cirurgia Geral', desc: 'Banco de cirurgia', secoes: fichaCirurgica(false), resumo: RESUMO_CIR },
    { id: 'maxilo_facial', cid: CID.maxilo_facial, grupo: 'clinico', clinico: true, nome: 'Cirurgia Maxilo-Facial', desc: 'Banco de urgência', secoes: fichaCirurgica(true), resumo: RESUMO_CIR },
    { id: 'neurocirurgia', cid: CID.neurocirurgia, grupo: 'clinico', clinico: true, nome: 'Neurocirurgia', desc: 'Banco de urgência', secoes: [
      equipa(), observadosMF, diagnosticos,
      lista('internados', 'Internamento no serviço', 'doente', DOENTE, 'internados'),
    ].concat(transfs(true), bloco(), obitos('Óbito no banco', 'Óbito no serviço'), [verificacao('Verificações'), equipaEntra('Médicos que entram (turno seguinte)')]),
      resumo: [['obs_m', 'Obs. masc.'], ['obs_f', 'Obs. fem.'], ['observados', 'Total geral'], ['internados', 'Internam. no serviço'],
        ['cir_menores', 'Cirurg. menores'], ['cir_maiores', 'Cirurg. maiores'], ['transf_recebidas', 'Transf. recebidas'], ['transf_efetuadas', 'Transf. efectuadas'],
        ['obitos_banco', 'Óbitos no banco'], ['obitos_internamento', 'Óbitos no serviço'], ['verificacoes', 'Verificações']] },
    { id: 'oftalmologia', cid: CID.oftalmologia, grupo: 'clinico', clinico: true, nome: 'Oftalmologia', desc: 'Banco de urgência', secoes: [
      equipa(), observadosMF, diagnosticos,
    ].concat(transfs(true), [equipaEntra('Médicos que entram (turno seguinte)')]),
      resumo: [['obs_m', 'Observados masculino'], ['obs_f', 'Observados feminino'], ['observados', 'Total geral'], ['transf_recebidas', 'Transferências recebidas'], ['transf_efetuadas', 'Transferências efectuadas']] },
    { id: 'nefrologia', cid: CID.nefrologia, grupo: 'clinico', nome: 'Nefrologia', desc: 'Resumo médico de banco', secoes: [
      { id: 'equipa', titulo: 'Equipe médica', textos: [['med_saida', 'Médico/a de saída'], ['med_entrada', 'Médico/a de entrada']] },
      { id: 'dialise', titulo: 'Tratamentos dialíticos', grupos: [{ campos: [['hemodialise', 'Hemodiálise (sessões)'], ['dialise_peritoneal', 'Diálise peritoneal (sessões)']] }] },
      lista('entrados', 'Internamento — doentes entrados', 'doente', DOENTE, 'entrados'),
      { id: 'movimento', titulo: 'Movimento e ocupação do serviço', total: false, grupos: [{ campos: [['altas', 'Altas'], ['obitos', 'Óbitos'], ['leitos_ocupados', 'Leitos ocupados'], ['leitos_vagos', 'Vagas']] }] },
    ], resumo: [['hemodialise', 'Hemodiálise'], ['dialise_peritoneal', 'Diálise peritoneal'], ['entrados', 'Entrados'], ['altas', 'Altas'], ['obitos', 'Óbitos'], ['leitos_ocupados', 'Leitos ocupados'], ['leitos_vagos', 'Vagas']] },
    { id: 'uci', cid: CID.uci, grupo: 'clinico', nome: 'UCI', desc: 'Resumo de actividades de banco', secoes: [
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
    { id: 'bloco_operatorio', cid: CID.bloco_operatorio, grupo: 'apoio', nome: 'Bloco Operatório', desc: 'Entrega de banco', secoes: [
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
    { id: 'imagiologia', grupo: 'apoio', nome: 'Imagiologia', desc: 'TAC, ecografia e Raio X', secoes: [
      { id: 'pessoal', titulo: 'Pessoal de serviço', textos: [['med_especialista', 'Médico especialista'], ['med_interno_1', 'Médico interno'], ['tecnico_1', 'Técnico 1'], ['tecnico_2', 'Técnico 2'], ['tecnico_3', 'Técnico 3']] },
      { id: 'tac', titulo: 'TAC — exames', nota: 'Por exame: B. Urgência, Autorizados e Internamento (como na página da Imagiologia no ZELO).', grade: { totais: 'tac', linhas: linhasDe(TAC_EXAMES), colunas: COL_IMG } },
      { id: 'tac_cont', titulo: 'TAC — pacientes e qualidade', grade: { totais: 'tacq', linhas: linhasDe(['Pacientes Examinados', 'Exames Realizados', 'Corretas', 'Defeituosas', 'Placas 14X17'], null, 'tacq_'), colunas: COL_IMG } },
      { id: 'eco', titulo: 'Ecografia — exames', grade: { totais: 'eco', linhas: linhasDe(ECO_EXAMES), colunas: COL_IMG } },
      { id: 'eco_cont', titulo: 'Ecografia — pacientes', grade: { totais: 'ecoq', linhas: linhasDe(['Pacientes Examinados', 'Exames Realizados'], null, 'ecoq_'), colunas: COL_IMG } },
      { id: 'rx', titulo: 'Raio X — pacientes e qualidade', grade: { totais: 'rxq', linhas: linhasDe(['Pacientes Examinados', 'Exames Realizados', 'Corretas', 'Defeituosas'], null, 'rxq_'), colunas: COL_IMG } },
      { id: 'rx_placas', titulo: 'Raio X — placas', grade: { totais: 'rxp', linhas: linhasDe(RX_PLACAS, null, 'rxp_'), colunas: COL_IMG } },
      { id: 'exames', titulo: 'Exames realizados por serviço (ficha de banco)', nota: 'Ptes = pacientes. Preencha só o que houve.', grade: {
        linhas: IMAG_LINHAS,
        colunas: [['rx_p', 'Raio X · ptes', 'n'], ['rx_e', 'Raio X · exames', 'n'], ['eco_p', 'Ecografia · ptes', 'n'], ['eco_e', 'Ecografia · exames', 'n'], ['tc_p', 'TC · ptes', 'n'], ['tc_e', 'TC · exames', 'n']],
      } },
      { id: 'outros', titulo: 'Outros exames', grupos: [{ campos: [['ecg', 'Electrocardiograma (n.º de exames)']] }] },
      { id: 'outros_txt', titulo: 'Outros exames (especificar)', textos: [['outros_exames', 'Outros exames', 'Quais e quantos']] },
      { id: 'equipa_entra', titulo: 'Equipa que entra (turno seguinte)', textos: [['entra_medico_1', 'Médico 1'], ['entra_medico_2', 'Médico 2'], ['entra_tecnico', 'Técnico']] },
    ], somas: { tac_total: ['tac_bu', 'tac_aut', 'tac_int'], eco_total: ['eco_bu', 'eco_aut', 'eco_int'], rx_exames: ['rxq_exames_realizados_bu', 'rxq_exames_realizados_aut', 'rxq_exames_realizados_int'] },
    resumo: [['tac_total', 'Exames de TAC'], ['eco_total', 'Ecografias'], ['rx_exames', 'Exames de Raio X'], ['tac_bu', 'TAC · B. Urgência'], ['eco_bu', 'Eco · B. Urgência'], ['ecg', 'Electrocardiogramas']] },
    { id: 'laboratorio', grupo: 'apoio', nome: 'Laboratório', desc: 'Exames realizados e positivos', secoes: [
      { id: 'equipa', titulo: 'Técnicos de serviço', textos: [['chefe_equipa', 'Chefe de equipa'], ['tecnico_1', 'Técnico 1'], ['tecnico_2', 'Técnico 2'], ['tecnico_3', 'Técnico 3'], ['tecnico_4', 'Técnico 4']] },
    ].concat(LAB.map(([pre, titulo, exames], i) => ({ id: 'lab_' + pre, titulo: 'Exames realizados — ' + titulo,
      nota: i === 0 ? 'Por exame: B. Urgência e Internamento (como na página do Laboratório no ZELO). Preencha só o que houve.' : undefined,
      grade: { totais: pre, linhas: linhasDe(exames), colunas: COL_BU_INT } })), [
      { id: 'lab_pos', titulo: 'Exames positivos', grade: { totais: 'pos', linhas: LAB_POSITIVOS.map((n) => ['p_' + slug(n), n]), colunas: COL_BU_INT } },
    ]), somas: { ex_bu: ['hem_bu', 'par_bu', 'imu_bu', 'bio_bu', 'out_bu'], ex_int: ['hem_int', 'par_int', 'imu_int', 'bio_int', 'out_int'],
      ex_total: ['hem_bu', 'par_bu', 'imu_bu', 'bio_bu', 'out_bu', 'hem_int', 'par_int', 'imu_int', 'bio_int', 'out_int'], pos_total: ['pos_bu', 'pos_int'] },
    resumo: [['ex_total', 'Total de exames'], ['ex_bu', 'Exames B. Urgência'], ['ex_int', 'Exames internamento'], ['pos_total', 'Exames positivos'],
      ['hem_bu', 'Hematologia (BU)'], ['bio_bu', 'Bioquímica (BU)'], ['imu_bu', 'Imunologia (BU)']] },
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
    { id: 'fisioterapia', grupo: 'ambulatorio', nome: 'Fisioterapia', desc: 'Doentes, modalidades e equipa', diario: true, secoes: [
      { id: 'responsavel', titulo: 'Fisioterapeuta responsável', textos: [['responsavel', 'Fisioterapeuta responsável']] },
      { id: 'internos', titulo: 'Doentes internos atendidos', nota: 'Por especialidade de internamento.', grupos: [{ campos: FIS_INT.map((n) => ['int_' + slug(n), n]) }] },
      { id: 'externos', titulo: 'Doentes externos atendidos', nota: 'Atendimentos externos / ambulatório.', grupos: [{ campos: FIS_EXT.map((n) => ['ext_' + slug(n), n]) }] },
      { id: 'modalidades', titulo: 'Modalidades terapêuticas', nota: 'Técnicas e procedimentos aplicados (n.º de sessões).', grupos: [{ campos: FIS_MOD.map((n) => ['mod_' + slug(n), n]) }] },
      { id: 'equipa', titulo: 'Equipa de fisioterapia', nota: 'Profissionais que trabalharam no dia.', lista: { item: 'profissional', max: 15, conta: 'fisioterapeutas',
        colunas: [['nome', 'Nome do profissional', 'texto'], ['funcao', 'Função', 'escolha', [['fisioterapeuta', 'Fisioterapeuta'], ['tecnico', 'Técnico de Fisioterapia'], ['auxiliar', 'Auxiliar'], ['estagiario', 'Estagiário']]]] } },
    ], somas: { total_internos: FIS_INT.map((n) => 'int_' + slug(n)), total_externos: FIS_EXT.map((n) => 'ext_' + slug(n)),
      total_geral: FIS_INT.map((n) => 'int_' + slug(n)).concat(FIS_EXT.map((n) => 'ext_' + slug(n))), total_sessoes: FIS_MOD.map((n) => 'mod_' + slug(n)) },
    resumo: [['total_geral', 'Total geral'], ['total_internos', 'Internos'], ['total_externos', 'Externos'], ['total_sessoes', 'Sessões'], ['fisioterapeutas', 'Fisioterapeutas']] },

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
      if (sec.grade) {
        sec.grade.linhas.forEach((l) => sec.grade.colunas.forEach((col) => { if (col[2] === 'n' && col[0] !== 'idade') add(l[0] + '_' + col[0], l[1] + ' · ' + col[1], sec.titulo); }));
        sec.grade.colunas.forEach((col) => { if (col[2] === 'n' && col[0] !== 'idade') add((sec.grade.totais ? sec.grade.totais + '_' : '') + col[0], 'Total · ' + col[1], sec.titulo); });
      }
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
        nums.forEach((col) => { d[(sec.grade.totais ? sec.grade.totais + '_' : '') + col[0]] = sec.grade.linhas.reduce((a, l) => a + (Number(contagens[l[0] + '_' + col[0]]) || 0), 0); });
      }
    });
    if ('obs_m' in contagens || 'obs_f' in contagens) {
      if (window.urgCampos(s).some((c) => c[0] === 'obs_m') && !window.urgCampos(s).some((c) => c[0] === 'observados')) d.observados = (Number(contagens.obs_m) || 0) + (Number(contagens.obs_f) || 0);
    }
    Object.entries(s.somas || {}).forEach(([k, lista]) => { d[k] = lista.reduce((a, c) => a + (Number(d[c] ?? contagens[c]) || 0), 0); });
    if (s.id === 'consulta_externa') { d.total_m = d.m || 0; d.total_f = d.f || 0; d.total = (d.m || 0) + (d.f || 0); }
    return d;
  };
  // O código CID (ex.: 'S72.0') está nos intervalos recomendados do serviço?
  window.urgCidDoServico = function (s, cod) {
    if (!s || !s.cid) return true;
    const c3 = String(cod || '').slice(0, 3);
    return s.cid.some((r) => { const [a, b] = r.split('-'); return c3 >= a && c3 <= b; });
  };
  // Subtotal de uma secção de contadores (null se não tem)
  window.urgSubtotal = function (sec, val) {
    if (!sec.grupos || sec.total === false) return null;
    const grupos = sec.total === 'g0' ? [sec.grupos[0]] : sec.grupos;
    return grupos.reduce((a, g) => a + g.campos.reduce((b, c) => b + (val(c[0]) || 0), 0), 0);
  };
})();
