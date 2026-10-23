// Modelos do Inquérito de Satisfação — um por área do hospital.
//
// Para mudar perguntas, edite só este ficheiro. Regras:
//  - O código de cada pergunta (q1, q2, ...) é o que fica guardado. Se mudar
//    o sentido de uma pergunta, use um código novo em vez de reaproveitar.
//  - Cada campo de escolha guarda o código da opção (à esquerda).
//  - Códigos: só letras minúsculas, números, "_" ou "-".
//
// Tipos de campo: 'opcoes' (botões), 'lista' (menu) e 'texto' (campo livre,
// guardado em "especialidade" — só um campo de texto por modelo).
//
// Pergunta só para alguns casos: um 3.º elemento com a condição, ex.
//   ['q10', 'Prazo de entrega do relatório', { assunto: ['relatorio_medico'] }]
// aparece só quando o campo "assunto" tem uma dessas opções.
(function () {
  const SEXO = { id: 'sexo', rotulo: 'Sexo', tipo: 'opcoes', opcoes: [['m', 'Masculino'], ['f', 'Feminino']] };
  const IDADE = { id: 'idade', rotulo: 'Idade', tipo: 'opcoes', opcoes: [['menos18', 'Menos de 18'], ['18-39', '18 a 39'], ['40-59', '40 a 59'], ['60mais', '60 ou mais']] };
  const RESOLVIDO = { id: 'resolvido', rotulo: 'O seu assunto ficou resolvido?', tipo: 'opcoes', opcoes: [['sim', 'Sim'], ['parcial', 'Em parte'], ['nao', 'Não'], ['aguarda', 'Ainda aguardo']] };
  const UTENTE_ACOMP = { id: 'respondente', rotulo: 'Quem está a responder?', tipo: 'opcoes', opcoes: [['utente', 'O próprio utente'], ['acompanhante', 'Familiar / acompanhante']] };

  const RECOMENDA_HOSPITAL = 'Recomendaria este hospital a familiares e amigos?';
  const RECOMENDA_SERVICO = 'Recomendaria este serviço a colegas ou outras pessoas?';

  const MODELOS = [
    // ───────────── Atendimento ao utente ─────────────
    {
      id: 'consulta_externa', grupo: 'utente', nome: 'Consultas Externas',
      desc: 'Consulta com médico de especialidade',
      campos: [
        { id: 'especialidade', rotulo: 'Especialidade / Consultório', tipo: 'texto', dica: 'Ex.: Cardiologia, Consultório 3' },
        { id: 'tipo_consulta', rotulo: 'Consulta', tipo: 'opcoes', opcoes: [['primeira', 'Primeira consulta'], ['retorno', 'Consulta de retorno']] },
        UTENTE_ACOMP, SEXO, IDADE,
      ],
      perguntas: [
        ['q1', 'Acolhimento / recepção'],
        ['q2', 'Tempo de espera'],
        ['q3', 'Organização do Serviço'],
        ['q4', 'Atendimento médico'],
        ['q5', 'Clareza das informações fornecidas'],
        ['q6', 'Privacidade durante a consulta'],
        ['q7', 'Condições físicas do Serviço'],
        ['q8', 'Disponibilidade dos profissionais'],
        ['q9', 'Facilidade de marcação'],
      ],
      depois: [
        { id: 'hora_marcada', rotulo: 'A consulta começou perto da hora marcada?', tipo: 'opcoes', opcoes: [['sim', 'Sim'], ['nao', 'Não'], ['sem_hora', 'Não tinha hora marcada']] },
      ],
      recomenda: RECOMENDA_HOSPITAL,
    },
    {
      id: 'banco_urgencia', grupo: 'utente', nome: 'Banco de Urgência',
      desc: 'Atendimento urgente',
      campos: [
        UTENTE_ACOMP,
        { id: 'chegada', rotulo: 'Como chegou ao hospital?', tipo: 'opcoes', opcoes: [['proprio', 'Pelos próprios meios'], ['ambulancia', 'Ambulância'], ['transferido', 'Transferido de outra unidade']] },
        SEXO, IDADE,
      ],
      perguntas: [
        ['q1', 'Acolhimento à chegada'],
        ['q2', 'Tempo de espera até à triagem'],
        ['q3', 'Tempo de espera até ao atendimento médico'],
        ['q4', 'Atendimento médico'],
        ['q5', 'Cuidados de enfermagem'],
        ['q6', 'Informação sobre exames e tratamento'],
        ['q7', 'Privacidade'],
        ['q8', 'Limpeza e condições do espaço'],
        ['q9', 'Informação dada ao acompanhante'],
      ],
      depois: [
        { id: 'destino', rotulo: 'Qual foi o resultado do atendimento?', tipo: 'opcoes', opcoes: [['alta', 'Alta para casa'], ['internado', 'Ficou internado'], ['transferido', 'Transferido'], ['observacao', 'Ainda em observação']] },
      ],
      recomenda: RECOMENDA_HOSPITAL,
    },
    {
      id: 'triagem', grupo: 'utente', nome: 'Triagem',
      desc: 'Avaliação de prioridade à chegada',
      campos: [UTENTE_ACOMP, SEXO, IDADE],
      perguntas: [
        ['q1', 'Tempo até ser triado'],
        ['q2', 'Acolhimento pelo enfermeiro'],
        ['q3', 'Explicação da prioridade atribuída (cor / pulseira)'],
        ['q4', 'Atenção às suas queixas e sinais vitais'],
        ['q5', 'Privacidade durante a triagem'],
        ['q6', 'Informação sobre o tempo de espera seguinte'],
        ['q7', 'Conforto da sala de espera'],
        ['q8', 'Limpeza do espaço'],
      ],
      depois: [
        { id: 'informado', rotulo: 'Foi informado sobre o que fazer a seguir?', tipo: 'opcoes', opcoes: [['sim', 'Sim'], ['nao', 'Não']] },
      ],
      recomenda: RECOMENDA_HOSPITAL,
    },
    {
      id: 'internamento', grupo: 'utente', nome: 'Internamento',
      desc: 'Doentes internados e familiares',
      campos: [
        { id: 'servico', rotulo: 'Serviço de internamento', tipo: 'lista', obrig: true, opcoes: [
          ['cirurgia_geral', 'Cirurgia Geral'], ['maxilo_facial', 'Cirurgia Maxilo-Facial'],
          ['medicina_homem', 'Medicina Homem'], ['medicina_mulher', 'Medicina Mulher'],
          ['nefrologia', 'Nefrologia'], ['neurocirurgia', 'Neurocirurgia'],
          ['ortopedia', 'Orto-Traumatologia'], ['uci', 'UCI (Cuidados Intensivos)'],
          ['cuidados_intermedios', 'Cuidados Intermédios'], ['outro', 'Outro'],
        ] },
        { id: 'respondente', rotulo: 'Quem está a responder?', tipo: 'opcoes', opcoes: [['doente', 'O próprio doente'], ['acompanhante', 'Familiar / acompanhante']] },
        { id: 'duracao', rotulo: 'Tempo de internamento', tipo: 'opcoes', opcoes: [['ate3', 'Até 3 dias'], ['4-7', '4 a 7 dias'], ['8-14', '8 a 14 dias'], ['mais14', 'Mais de 14 dias']] },
        SEXO, IDADE,
      ],
      perguntas: [
        ['q1', 'Acolhimento na admissão'],
        ['q2', 'Cuidados de enfermagem'],
        ['q3', 'Atendimento médico'],
        ['q4', 'Informação sobre o estado de saúde e tratamento'],
        ['q5', 'Respeito pela privacidade e dignidade'],
        ['q6', 'Alívio da dor'],
        ['q7', 'Alimentação'],
        ['q8', 'Limpeza da enfermaria e casas de banho'],
        ['q9', 'Conforto da cama e da enfermaria'],
        ['q10', 'Silêncio e descanso durante a noite'],
        ['q11', 'Horário e regras das visitas'],
        ['q12', 'Preparação para a alta (explicações, receitas)'],
      ],
      recomenda: RECOMENDA_HOSPITAL,
    },
    {
      id: 'hospital_dia', grupo: 'utente', nome: 'Hospital de Dia',
      desc: 'Tratamentos em ambulatório',
      campos: [
        UTENTE_ACOMP,
        { id: 'frequencia', rotulo: 'É a primeira vez?', tipo: 'opcoes', opcoes: [['primeira', 'Primeira vez'], ['regular', 'Tratamento regular']] },
        SEXO, IDADE,
      ],
      perguntas: [
        ['q1', 'Marcação das sessões'],
        ['q2', 'Pontualidade no início do tratamento'],
        ['q3', 'Cuidados de enfermagem'],
        ['q4', 'Atendimento médico'],
        ['q5', 'Explicação do tratamento e possíveis efeitos'],
        ['q6', 'Conforto durante o tratamento (cadeira, temperatura)'],
        ['q7', 'Privacidade'],
        ['q8', 'Limpeza'],
        ['q9', 'Disponibilidade da medicação'],
      ],
      recomenda: RECOMENDA_HOSPITAL,
    },
    {
      id: 'nutricao', grupo: 'utente', nome: 'Nutrição',
      desc: 'Refeições e aconselhamento alimentar',
      campos: [
        { id: 'respondente', rotulo: 'Quem está a responder?', tipo: 'opcoes', opcoes: [['internado', 'Doente internado'], ['consulta', 'Utente da consulta de nutrição'], ['acompanhante', 'Acompanhante'], ['funcionario', 'Funcionário (refeitório)']] },
        SEXO, IDADE,
      ],
      perguntas: [
        ['q1', 'Sabor das refeições'],
        ['q2', 'Quantidade servida'],
        ['q3', 'Temperatura das refeições'],
        ['q4', 'Variedade das ementas'],
        ['q5', 'Cumprimento do horário das refeições'],
        ['q6', 'Higiene dos utensílios e da distribuição'],
        ['q7', 'Respeito pela dieta prescrita'],
        ['q8', 'Orientação / aconselhamento nutricional'],
        ['q9', 'Simpatia de quem serve'],
      ],
      recomenda: RECOMENDA_SERVICO,
    },
    {
      id: 'gabinete_utente', grupo: 'utente', nome: 'Gabinete do Utente',
      desc: 'Reclamações, sugestões e elogios',
      campos: [
        UTENTE_ACOMP,
        { id: 'motivo', rotulo: 'Motivo da ida ao Gabinete', tipo: 'opcoes', opcoes: [['reclamacao', 'Reclamação'], ['sugestao', 'Sugestão'], ['elogio', 'Elogio'], ['informacao', 'Pedido de informação'], ['outro', 'Outro']] },
        SEXO, IDADE,
      ],
      perguntas: [
        ['q1', 'Facilidade em encontrar o Gabinete'],
        ['q2', 'Acolhimento e atenção ao ouvir o seu caso'],
        ['q3', 'Tempo de espera'],
        ['q4', 'Clareza da resposta dada'],
        ['q5', 'Confidencialidade'],
        ['q6', 'Seguimento dado ao seu caso'],
        ['q7', 'Prazo de resposta'],
      ],
      depois: [RESOLVIDO],
      recomenda: RECOMENDA_HOSPITAL,
    },
    {
      id: 'secretaria_recepcao', grupo: 'utente', nome: 'Secretaria Geral / Recepção',
      desc: 'Relatórios médicos, documentos, informações e audiências',
      campos: [
        { id: 'respondente', rotulo: 'Quem está a responder?', tipo: 'opcoes', opcoes: [['utente', 'Utente'], ['acompanhante', 'Familiar / acompanhante'], ['visitante', 'Visitante'], ['outro', 'Outro']] },
        { id: 'assunto', rotulo: 'Assunto tratado na Secretaria', tipo: 'opcoes', obrig: true, opcoes: [
          ['relatorio_medico', 'Relatório médico'],
          ['documentos', 'Entrega de documentos'],
          ['informacao', 'Informações / orientações'],
          ['audiencia', 'Audiência com membros da direção'],
          ['outro', 'Outro'],
        ] },
        SEXO, IDADE,
      ],
      // Na Secretaria não se marcam consultas nem há filas/senhas ou sinalização:
      // q4 (marcação), q6 (filas/senhas) e q7 (sinalização) foram retiradas.
      perguntas: [
        ['q1', 'Acolhimento e simpatia'],
        ['q2', 'Tempo de espera para ser atendido'],
        ['q3', 'Clareza das informações e orientações'],
        ['q5', 'Rapidez do atendimento'],
        ['q10', 'Cumprimento do prazo de entrega do relatório médico', { assunto: ['relatorio_medico'] }],
        ['q11', 'Explicação sobre como e quando levantar o relatório', { assunto: ['relatorio_medico'] }],
        ['q12', 'Receção e registo dos documentos entregues', { assunto: ['documentos'] }],
        ['q13', 'Informação sobre o seguimento dos documentos', { assunto: ['documentos'] }],
        ['q14', 'Utilidade das informações / orientações recebidas', { assunto: ['informacao'] }],
        ['q15', 'Facilidade em conseguir a audiência', { assunto: ['audiencia'] }],
        ['q16', 'Tempo de espera pela audiência', { assunto: ['audiencia'] }],
        ['q17', 'Atenção dada ao seu assunto na audiência', { assunto: ['audiencia'] }],
        ['q8', 'Conforto da área de espera'],
        ['q9', 'Horário de funcionamento'],
      ],
      depois: [RESOLVIDO],
      recomenda: RECOMENDA_HOSPITAL,
    },

    // ───────────── Serviços administrativos e de apoio ─────────────
    {
      id: 'administrativa', grupo: 'admin', nome: 'Área Administrativa',
      desc: 'Documentos, processos e pedidos',
      campos: [
        { id: 'respondente', rotulo: 'Quem está a responder?', tipo: 'opcoes', opcoes: [['utente', 'Utente'], ['acompanhante', 'Familiar / acompanhante'], ['funcionario', 'Funcionário do hospital'], ['externo', 'Fornecedor / visitante']] },
        { id: 'assunto', rotulo: 'Assunto tratado', tipo: 'opcoes', opcoes: [['documentos', 'Declarações / documentos'], ['processo', 'Processo clínico'], ['pagamentos', 'Facturação / pagamentos'], ['reclamacao', 'Reclamação'], ['outro', 'Outro']] },
        SEXO, IDADE,
      ],
      perguntas: [
        ['q1', 'Acolhimento e cortesia'],
        ['q2', 'Tempo de espera para ser atendido'],
        ['q3', 'Clareza das informações'],
        ['q4', 'Rapidez na resolução do pedido'],
        ['q5', 'Competência dos funcionários'],
        ['q6', 'Organização dos documentos e processos'],
        ['q7', 'Condições do espaço (conforto, limpeza)'],
        ['q8', 'Horário de funcionamento'],
      ],
      depois: [RESOLVIDO],
      recomenda: RECOMENDA_SERVICO,
    },
    {
      id: 'contabilidade', grupo: 'admin', nome: 'Contabilidade',
      desc: 'Pagamentos, facturas e recibos',
      campos: [
        { id: 'respondente', rotulo: 'Quem está a responder?', tipo: 'opcoes', opcoes: [['utente', 'Utente'], ['funcionario', 'Funcionário do hospital'], ['fornecedor', 'Fornecedor'], ['outro', 'Outro']] },
        { id: 'assunto', rotulo: 'Assunto tratado', tipo: 'opcoes', opcoes: [['pagamento', 'Pagamento de serviços'], ['facturas', 'Facturas / recibos'], ['fornecedor', 'Pagamento a fornecedor'], ['salarios', 'Salários / abonos'], ['outro', 'Outro']] },
        SEXO, IDADE,
      ],
      perguntas: [
        ['q1', 'Acolhimento'],
        ['q2', 'Tempo de espera'],
        ['q3', 'Clareza das explicações sobre valores'],
        ['q4', 'Exactidão das facturas e recibos'],
        ['q5', 'Rapidez no tratamento do pedido'],
        ['q6', 'Cumprimento dos prazos de pagamento'],
        ['q7', 'Competência dos funcionários'],
        ['q8', 'Horário de atendimento'],
      ],
      depois: [RESOLVIDO],
      recomenda: RECOMENDA_SERVICO,
    },
    {
      id: 'recursos_humanos', grupo: 'admin', nome: 'Recursos Humanos',
      desc: 'Atendimento a funcionários e candidatos',
      campos: [
        { id: 'respondente', rotulo: 'Quem está a responder?', tipo: 'opcoes', opcoes: [['funcionario', 'Funcionário do hospital'], ['candidato', 'Candidato'], ['ex_funcionario', 'Ex-funcionário'], ['outro', 'Outro']] },
        { id: 'assunto', rotulo: 'Assunto tratado', tipo: 'opcoes', opcoes: [['documentos', 'Declarações / documentos'], ['ferias_faltas', 'Férias e faltas'], ['salarios', 'Salários'], ['recrutamento', 'Recrutamento'], ['processo', 'Processo individual'], ['outro', 'Outro']] },
        SEXO, IDADE,
      ],
      perguntas: [
        ['q1', 'Acolhimento'],
        ['q2', 'Tempo de espera'],
        ['q3', 'Clareza das informações'],
        ['q4', 'Rapidez na resolução'],
        ['q5', 'Confidencialidade'],
        ['q6', 'Competência dos funcionários'],
        ['q7', 'Divulgação de avisos e normas'],
        ['q8', 'Horário de atendimento'],
      ],
      depois: [RESOLVIDO],
      recomenda: RECOMENDA_SERVICO,
    },
    {
      id: 'supervisao', grupo: 'admin', nome: 'Supervisão',
      desc: 'Avaliação da supervisão pelos serviços',
      campos: [
        { id: 'respondente', rotulo: 'Quem está a responder?', tipo: 'opcoes', opcoes: [['funcionario', 'Funcionário'], ['chefe', 'Chefe de serviço / equipa'], ['outro', 'Outro']] },
        { id: 'especialidade', rotulo: 'Serviço onde trabalha', tipo: 'texto', dica: 'Ex.: Medicina Homem, Banco de Urgência' },
      ],
      perguntas: [
        ['q1', 'Presença regular da supervisão no serviço'],
        ['q2', 'Apoio na resolução de problemas'],
        ['q3', 'Clareza das orientações'],
        ['q4', 'Rapidez de resposta às ocorrências'],
        ['q5', 'Comunicação com as equipas'],
        ['q6', 'Justiça e imparcialidade'],
        ['q7', 'Acompanhamento da limpeza e manutenção'],
        ['q8', 'Acompanhamento dos maqueiros e apoio'],
      ],
      recomenda: RECOMENDA_SERVICO,
    },
    {
      id: 'pedagogica', grupo: 'admin', nome: 'Área Pedagógica',
      desc: 'Estágios, formação e internato',
      campos: [
        { id: 'respondente', rotulo: 'Quem está a responder?', tipo: 'opcoes', opcoes: [['estudante', 'Estudante / estagiário'], ['interno', 'Médico interno'], ['enfermeiro', 'Enfermeiro'], ['tecnico', 'Técnico'], ['outro', 'Outro funcionário']] },
        { id: 'tipo_formacao', rotulo: 'Tipo de formação', tipo: 'opcoes', opcoes: [['estagio', 'Estágio'], ['continua', 'Formação contínua'], ['internato', 'Internato médico'], ['palestra', 'Palestra / seminário']] },
        { id: 'especialidade', rotulo: 'Tema ou serviço da formação', tipo: 'texto', dica: 'Ex.: Estágio em Pediatria' },
      ],
      perguntas: [
        ['q1', 'Organização da formação / estágio'],
        ['q2', 'Domínio dos temas pelos formadores'],
        ['q3', 'Utilidade prática dos conteúdos'],
        ['q4', 'Acompanhamento pelos tutores / orientadores'],
        ['q5', 'Materiais e recursos didácticos'],
        ['q6', 'Condições das salas'],
        ['q7', 'Cumprimento do horário e do programa'],
        ['q8', 'Avaliação justa e clara'],
        ['q9', 'Integração nas equipas'],
      ],
      recomenda: 'Recomendaria esta formação / estágio a colegas?',
    },
  ];

  window.INQ_GRUPOS = [
    ['utente', 'Atendimento ao utente'],
    ['admin', 'Serviços administrativos e de apoio'],
  ];
  window.INQ_ESCALA = ['Muito mau', 'Mau', 'Razoável', 'Bom', 'Muito bom'];
  window.INQ_MODELOS = MODELOS;
})();
