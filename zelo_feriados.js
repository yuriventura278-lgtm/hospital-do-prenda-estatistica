// zelo_feriados.js — Feriados nacionais de Angola + verificação de fim de
// semana, partilhado por todos os módulos que precisem de bloquear datas
// sem expediente (ex.: Bloco Op. Eletiva e Consulta Externa nos
// Procedimentos de Enfermagem).
//
// Datas móveis (Carnaval, Sexta-Feira Santa) são calculadas a partir da
// Páscoa (algoritmo de Meeus/Jones/Butcher) — a lista nunca precisa de
// atualização manual de ano para ano.
(function (global) {
  function calcularPascoa(ano) {
    var a = ano % 19;
    var b = Math.floor(ano / 100);
    var c = ano % 100;
    var d = Math.floor(b / 4);
    var e = b % 4;
    var f = Math.floor((b + 8) / 25);
    var g = Math.floor((b - f + 1) / 3);
    var h = (19 * a + b - d - g + 15) % 30;
    var i = Math.floor(c / 4);
    var k = c % 4;
    var l = (32 + 2 * e + 2 * i - h - k) % 7;
    var m = Math.floor((a + 11 * h + 22 * l) / 451);
    var mes = Math.floor((h + l - 7 * m + 114) / 31); // 3=Março, 4=Abril
    var dia = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(Date.UTC(ano, mes - 1, dia));
  }

  function _fmt(date) {
    return date.toISOString().slice(0, 10);
  }

  function _addDias(date, n) {
    var d = new Date(date.getTime());
    d.setUTCDate(d.getUTCDate() + n);
    return d;
  }

  function _pad2(n) { return String(n).padStart(2, '0'); }

  // Feriados nacionais fixos da República de Angola.
  var FERIADOS_FIXOS = [
    { mes: 1,  dia: 1,  nome: 'Ano Novo' },
    { mes: 2,  dia: 4,  nome: 'Início da Luta Armada de Libertação Nacional' },
    { mes: 3,  dia: 8,  nome: 'Dia Internacional da Mulher' },
    { mes: 4,  dia: 4,  nome: 'Dia da Paz e Reconciliação Nacional' },
    { mes: 5,  dia: 1,  nome: 'Dia Internacional do Trabalhador' },
    { mes: 9,  dia: 17, nome: 'Dia do Herói Nacional' },
    { mes: 11, dia: 2,  nome: 'Dia dos Finados' },
    { mes: 11, dia: 11, nome: 'Dia da Independência Nacional' },
    { mes: 12, dia: 25, nome: 'Natal' },
  ];

  var _cache = {};

  function getFeriados(ano) {
    if (_cache[ano]) return _cache[ano];
    var mapa = {};
    FERIADOS_FIXOS.forEach(function (f) {
      mapa[ano + '-' + _pad2(f.mes) + '-' + _pad2(f.dia)] = f.nome;
    });
    var pascoa = calcularPascoa(ano);
    mapa[_fmt(_addDias(pascoa, -47))] = 'Carnaval';       // Terça-feira de Carnaval
    mapa[_fmt(_addDias(pascoa, -2))]  = 'Sexta-Feira Santa';
    _cache[ano] = mapa;
    return mapa;
  }

  // dataStr: 'YYYY-MM-DD' → nome do feriado, ou null
  function nomeFeriado(dataStr) {
    var ano = Number(dataStr.slice(0, 4));
    return getFeriados(ano)[dataStr] || null;
  }

  function _diaSemanaIdx(dataStr) {
    var partes = dataStr.split('-').map(Number);
    return new Date(Date.UTC(partes[0], partes[1] - 1, partes[2])).getUTCDay();
  }

  function ehFimDeSemana(dataStr) {
    var dow = _diaSemanaIdx(dataStr);
    return dow === 0 || dow === 6;
  }

  var NOMES_DIA_SEMANA = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

  // dataStr: 'YYYY-MM-DD' → nome do dia da semana em português
  function nomeDiaSemana(dataStr) {
    return NOMES_DIA_SEMANA[_diaSemanaIdx(dataStr)];
  }

  // Verifica se uma data deve ficar bloqueada (feriado ou fim de semana).
  // Devolve { bloqueado, motivo: 'feriado'|'fim_de_semana', nome }
  function verificarBloqueio(dataStr) {
    var feriado = nomeFeriado(dataStr);
    if (feriado) return { bloqueado: true, motivo: 'feriado', nome: feriado };
    if (ehFimDeSemana(dataStr)) return { bloqueado: true, motivo: 'fim_de_semana', nome: 'Fim de semana' };
    return { bloqueado: false };
  }

  global.ZeloFeriados = {
    calcularPascoa: calcularPascoa,
    getFeriados: getFeriados,
    nomeFeriado: nomeFeriado,
    nomeDiaSemana: nomeDiaSemana,
    ehFimDeSemana: ehFimDeSemana,
    verificarBloqueio: verificarBloqueio,
  };
})(window);
