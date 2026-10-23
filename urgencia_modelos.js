// Banco de Urgência — recolha de dados das 24 horas (formulário público).
// Um modelo por serviço. Só se recolhem TOTAIS do turno (sem nomes de doentes).
//
// Para mudar campos, edite só este ficheiro:
//  - O código de cada contagem (ex.: 'obs_m') é o que fica guardado. Se mudar o
//    sentido de um campo, use um código novo em vez de reaproveitar.
//  - Códigos: só letras minúsculas, números e "_".
// Serviços, sinistros e procedimentos iguais aos do módulo «Movimento do Banco
// de Urgência» (banco_urgencia.html).
(function () {
  const OBSERVADOS = {
    id: 'observados', titulo: 'Doentes observados', nota: 'Todos os doentes vistos pelo serviço nas 24 horas.',
    grupos: [
      { rotulo: 'Por sexo', soma: 'total', campos: [['obs_m', 'Masculino'], ['obs_f', 'Feminino']] },
      { rotulo: 'Por idade', soma: 'idade', campos: [['idade_men15', 'Menos de 15 anos'], ['idade_mai15', '15 anos ou mais']] },
    ],
  };
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
      ['s_agressao', 'Agressão física'],
      ['s_ac_trabalho', 'Acidente de trabalho'],
      ['s_ac_domestico', 'Acidente doméstico'],
      ['s_ac_desporto', 'Acidente desportivo'],
      ['s_ac_pessoal', 'Acidente pessoal'],
      ['s_atropela', 'Atropelamento'],
      ['s_queimadura', 'Queimadura'],
      ['s_fer_branca', 'Ferimentos por arma branca'],
      ['s_fer_fogo', 'Ferimentos por arma de fogo'],
      ['s_quedas', 'Quedas'],
      ['s_ac_viacao', 'Acidente de viação'],
    ] }],
  };
  const PROCEDIMENTOS = {
    id: 'procedimentos', titulo: 'Procedimentos realizados',
    grupos: [{ campos: [
      ['p_curativos', 'Curativos'],
      ['p_suturas', 'Suturas'],
      ['p_gessos', 'Gessos'],
      ['p_fer_paf', 'Ferimentos por projéctil de arma de fogo'],
      ['p_fer_ab', 'Ferimentos por arma branca'],
    ] }],
  };
  const ANESTESIA = [
    { id: 'cirurgias', titulo: 'Cirurgias', grupos: [{ soma: 'cirurgias', campos: [['an_cir_urg', 'Cirurgias de urgência'], ['an_cir_ele', 'Cirurgias electivas']] }] },
    { id: 'anestesias', titulo: 'Tipo de anestesia', grupos: [{ campos: [['an_geral', 'Anestesia geral'], ['an_regional', 'Anestesia regional (raqui / epidural)'], ['an_sedacao', 'Sedação / anestesia local']] }] },
    { id: 'reanimacao', titulo: 'Reanimação', grupos: [{ campos: [['an_reanimacoes', 'Reanimações'], ['an_obitos', 'Óbitos']] }] },
  ];

  const BANCO = [OBSERVADOS, DESTINO, SINISTROS, PROCEDIMENTOS];

  window.URG_SERVICOS = [
    { id: 'cirurgia_geral', nome: 'Cirurgia Geral', desc: 'Banco de cirurgia', secoes: BANCO },
    { id: 'ortopedia', nome: 'Ortopedia', desc: 'Traumatologia', secoes: BANCO },
    { id: 'neurocirurgia', nome: 'Neurocirurgia', desc: 'Trauma crânio-encefálico', secoes: BANCO },
    { id: 'maxilo_facial', nome: 'Cirurgia Maxilo-Facial', desc: 'Face e boca', secoes: BANCO },
    { id: 'oftalmologia', nome: 'Oftalmologia', desc: 'Olhos', secoes: BANCO },
    { id: 'otorrino', nome: 'Otorrinolaringologia', desc: 'Ouvidos, nariz e garganta', secoes: BANCO },
    { id: 'medicina_interna', nome: 'Medicina Interna', desc: 'Urgência médica', secoes: [OBSERVADOS, DESTINO] },
    { id: 'peq_cirurgia', nome: 'Pequena Cirurgia', desc: 'Curativos, suturas e gessos', secoes: BANCO },
    { id: 'anestesia', nome: 'Anestesia e Reanimação', desc: 'Bloco e reanimação', secoes: ANESTESIA },
  ];

  window.URG_CLASSIF = [['calmo', 'Calmo'], ['moderado', 'Moderado'], ['movimentado', 'Movimentado'], ['agitado', 'Agitado'], ['critico', 'Crítico']];
  window.URG_CATEGORIAS = [
    ['medico_especialista', 'Médico especialista'], ['medico_interno', 'Médico interno'], ['medico_estagiario', 'Médico estagiário'],
    ['enfermeiro', 'Enfermeiro'], ['outro', 'Outro'],
  ];

  // Todos os campos de um serviço, pela ordem: [[código, rótulo, secção], ...]
  window.urgCampos = function (s) {
    const out = [];
    s.secoes.forEach((sec) => sec.grupos.forEach((g) => g.campos.forEach((c) => out.push([c[0], c[1], sec.titulo]))));
    return out;
  };
})();
