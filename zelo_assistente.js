// ZELO — Assistente de voz/texto, 100% local e gratuito: sem servidor
// próprio, sem chamadas a APIs de IA pagas. Funciona por reconhecimento de
// comandos e perguntas de estrutura fixa (não é uma IA de conversação
// livre) — usa a Web Speech API do próprio navegador (grátis) para voz, e o
// conteúdo de zelo_servicos_menu.js como única fonte de verdade sobre onde
// cada serviço/relatório/procedimento vive no sistema. Nunca inventa dados:
// só sabe navegar e indicar "onde fica" cada coisa; para números/estatísticas
// reais continua a indicar ao utilizador a página certa em vez de adivinhar.
(function () {
  if (window.self !== window.top) return; // não duplicar dentro do iframe do Dashboard
  if (window.__zeloAssistenteIniciado) return;
  window.__zeloAssistenteIniciado = true;

  // ── Permissões (cópia local de zelo_auth.js: hasModuleAccess/ROLE_DEFAULT_PERMISSOES) ──
  // Cópia local porque zelo_auth.js é um módulo ES importado de forma diferente
  // em cada página (nem sempre expõe um global fiável a tempo de o Zelo correr).
  var ROLE_DEFAULT_PERMISSOES = {
    supervisor:       { estatistica:'leitura', servicos:'leitura', procedimentos_enfermagem:'leitura', movimento_mensal:'leitura', sistemas_independentes:false },
    chefe_servico:    { estatistica:'leitura', servicos:true, procedimentos_enfermagem:true, movimento_mensal:true, sistemas_independentes:false },
    enfermeiro_chefe: { estatistica:'leitura', servicos:true, procedimentos_enfermagem:true, movimento_mensal:true, sistemas_independentes:false },
    medico:           { estatistica:false, servicos:true, procedimentos_enfermagem:'leitura', movimento_mensal:false, sistemas_independentes:false },
    enfermeiro:       { estatistica:false, servicos:true, procedimentos_enfermagem:true, movimento_mensal:false, sistemas_independentes:false },
    tdt:              { estatistica:false, servicos:true, procedimentos_enfermagem:false, movimento_mensal:false, sistemas_independentes:false },
    secretario:       { estatistica:false, servicos:'leitura', procedimentos_enfermagem:false, movimento_mensal:true, sistemas_independentes:false },
    tecnico_farmacia: { estatistica:false, servicos:true, procedimentos_enfermagem:false, movimento_mensal:false, sistemas_independentes:false },
    psicologo:        { estatistica:false, servicos:true, procedimentos_enfermagem:false, movimento_mensal:false, sistemas_independentes:false },
    chefe_turno:      { estatistica:false, servicos:true, procedimentos_enfermagem:true, movimento_mensal:false, sistemas_independentes:false },
    funcionario:      { estatistica:true, servicos:true, procedimentos_enfermagem:true, movimento_mensal:true, sistemas_independentes:false },
  };
  function temAcessoModulo(role, permissoes, mod, itemSlug){
    if (role === 'admin') return true;
    var papeis = null;
    if (mod === 'movimento_mensal' && itemSlug !== 'banco_urgencia') papeis = ['chefe_servico', 'enfermeiro_chefe'];
    else if (mod === 'sistemas_independentes' && /^controlo_pacientes_/.test(itemSlug || '')) papeis = ['chefe_servico', 'enfermeiro_chefe', 'chefe_turno', 'enfermeiro', 'secretario'];
    if (papeis) {
      var explicito = permissoes && permissoes._paginas ? permissoes._paginas[mod + '|' + (itemSlug || '')] : undefined;
      if (explicito === true || explicito === false) return explicito;
      return papeis.indexOf(role) !== -1;
    }
    var modPerm = permissoes ? permissoes[mod] : undefined;
    if (modPerm === undefined) modPerm = (ROLE_DEFAULT_PERMISSOES[role] || ROLE_DEFAULT_PERMISSOES.funcionario)[mod];
    if (modPerm === false) return false;
    if (modPerm === true || modPerm === undefined || modPerm === null || modPerm === 'editar' || modPerm === 'leitura') return true;
    if (typeof modPerm === 'object') {
      if (!itemSlug) return true;
      return modPerm[itemSlug] !== false;
    }
    return true;
  }
  function estadoUtilizador(){
    var permissoes = {};
    try { permissoes = JSON.parse(sessionStorage.getItem('zeloPermissoes') || '{}'); } catch (e) {}
    return {
      role: sessionStorage.getItem('zeloRole') || 'funcionario',
      nome: _doisNomes(sessionStorage.getItem('zeloNome') || ''),
      permissoes: permissoes
    };
  }

  // ── Normalização de texto ──
  function normalizar(t){
    return String(t || '').toLowerCase()
      .normalize('NFD').replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function palavraInteira(txt, termo){
    if (!termo) return false;
    var re = new RegExp('(^|\\s)' + termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\s|$)');
    return re.test(txt);
  }

  // ── Apelidos comuns → nome exacto em SERVICOS_MENU / SISTEMAS_LOCAIS_MENU ──
  var APELIDOS = {
    'urgencia': 'Banco de Urgência', 'banco de urgencia': 'Banco de Urgência',
    'bloco operatorio': 'Bloco Operatório', 'bloco': 'Bloco Operatório', 'sala operatoria': 'Bloco Operatório',
    'cirurgia geral': 'Cirurgia Geral', 'cirurgia': 'Cirurgia Geral',
    'ortopedia': 'Orto-Traumatologia', 'orto traumatologia': 'Orto-Traumatologia', 'traumatologia': 'Orto-Traumatologia',
    'neurocirurgia': 'Neurocirurgia', 'neuro': 'Neurocirurgia',
    'maxilo facial': 'Maxilo-Facial', 'maxilo': 'Maxilo-Facial',
    'nefrologia': 'Nefrologia', 'renal': 'Nefrologia',
    'uci': 'UC Intermédio', 'cuidados intermedios': 'UC Intermédio', 'unidade de cuidados intermedios': 'UC Intermédio',
    'oftalmologia': 'Oftalmologia', 'olhos': 'Oftalmologia',
    'otorrinolaringologia': 'Otorrinolaringologia', 'otorrino': 'Otorrinolaringologia', 'ouvidos': 'Otorrinolaringologia',
    'consulta externa': 'Consulta Externa',
    'hospital de dia': 'Hospital de Dia',
    'imagiologia': 'Imagiologia', 'radiologia': 'Imagiologia', 'raio x': 'Imagiologia',
    'laboratorio': 'Laboratório', 'laboratorio clinico': 'Laboratório',
    'hemoterapia': 'Hemoterapia', 'banco de sangue': 'Hemoterapia', 'transfusoes': 'Hemoterapia', 'transfusao': 'Hemoterapia',
    'fisioterapia': 'Fisioterapia', 'fisio': 'Fisioterapia',
    'psicologia': 'Psicologia Clínica', 'psicologia clinica': 'Psicologia Clínica',
    'farmacia': 'Farmácia Central', 'farmacia central': 'Farmácia Central',
    'medicina homem': 'Medicina Homem', 'medicina mulher': 'Medicina Mulher',
    'medicina interna': ['Medicina Homem', 'Medicina Mulher'], 'medicina': ['Medicina Homem', 'Medicina Mulher'],
    'supervisao do hospital': 'Supervisão do Hospital',
    'supervisao serviclean': 'Supervisão Serviclean', 'serviclean': 'Supervisão Serviclean',
    'supervisao de maqueiros': 'Supervisão de Maqueiros', 'maqueiros': 'Supervisão de Maqueiros',
    'procedimentos de enfermagem geral': 'Procedimentos de Enfermagem · Geral',
    'controlo de faltas': 'Controlo de Faltas · GEPE/DEMA', 'gepe dema': 'Controlo de Faltas · GEPE/DEMA',
    'registo vih': 'Registo VIH · Geral', 'vih': 'Registo VIH · Geral', 'hiv': 'Registo VIH · Geral',
  };
  var APELIDOS_CHAVES = Object.keys(APELIDOS).sort(function (a, b) { return b.length - a.length; });

  function encontrarServicoPorNome(nomeExacto){
    var menu = window.SERVICOS_MENU || [];
    for (var i = 0; i < menu.length; i++) if (menu[i].nome === nomeExacto) return { tipo: 'servico', svc: menu[i] };
    var sis = window.SISTEMAS_LOCAIS_MENU || [];
    for (var j = 0; j < sis.length; j++) if (sis[j].nome === nomeExacto) return { tipo: 'sistema', sistema: sis[j] };
    return null;
  }

  // Devolve a lista de serviços encontrados no texto, com uma propriedade
  // extra .composto (true/false) para o motor de intenções distinguir dois
  // casos que ambos dão "mais do que um serviço encontrado":
  //  - ambiguidade genuína: 1 só apelido dito, mas que aponta para vários
  //    nomes (ex.: "medicina" → Medicina Homem OU Medicina Mulher) — não dá
  //    para adivinhar qual, tem de perguntar.
  //  - frase composta: vários apelidos DIFERENTES ditos na mesma frase (ex.:
  //    "abrir bloco operatório e depois farmácia") — sabe-se exactamente o
  //    que foi pedido, só não consegue tratar mais do que um de cada vez.
  // Cada apelido encontrado "consome" o trecho de texto correspondente (para
  // um apelido mais curto, ex. "medicina", não voltar a corresponder dentro
  // de um apelido mais específico já usado, ex. "medicina homem") — por isso
  // continua a percorrer as chaves da mais longa para a mais curta.
  function localizarServicos(textoNorm){
    var nomesEncontrados = [];
    var chavesEncontradas = 0;
    var restante = textoNorm;
    for (var k = 0; k < APELIDOS_CHAVES.length; k++) {
      var chave = APELIDOS_CHAVES[k];
      var re = new RegExp('(^|\\s)' + chave.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\s|$)');
      var m = re.exec(restante);
      if (!m) continue;
      chavesEncontradas++;
      var alvo = APELIDOS[chave];
      var nomes = Array.isArray(alvo) ? alvo : [alvo];
      nomes.forEach(function (n) { if (nomesEncontrados.indexOf(n) === -1) nomesEncontrados.push(n); });
      var inicio = m.index + m[1].length;
      restante = restante.slice(0, inicio) + ' '.repeat(chave.length) + restante.slice(inicio + chave.length);
    }
    if (!nomesEncontrados.length) {
      // rede de segurança: nome oficial completo mencionado por extenso
      (window.SERVICOS_MENU || []).forEach(function (svc) {
        if (palavraInteira(textoNorm, normalizar(svc.nome)) && nomesEncontrados.indexOf(svc.nome) === -1) { nomesEncontrados.push(svc.nome); chavesEncontradas++; }
      });
      (window.SISTEMAS_LOCAIS_MENU || []).forEach(function (s) {
        if (palavraInteira(textoNorm, normalizar(s.nome)) && nomesEncontrados.indexOf(s.nome) === -1) { nomesEncontrados.push(s.nome); chavesEncontradas++; }
      });
    }
    var resultado = nomesEncontrados.map(encontrarServicoPorNome).filter(Boolean);
    resultado.composto = chavesEncontradas > 1;
    return resultado;
  }

  // Detecta o tipo de acção pedido dentro de um serviço com várias opções.
  function tipoAcaoPedida(textoNorm){
    if (palavraInteira(textoNorm, 'estatistica') || palavraInteira(textoNorm, 'estatisticas')) return 'estatisticas';
    if (palavraInteira(textoNorm, 'movimento')) return 'movimento';
    if (textoNorm.indexOf('procedimento') !== -1 || textoNorm.indexOf('enfermagem') !== -1) return 'procedimentos';
    if (textoNorm.indexOf('registo diario') !== -1) return 'registo_diario';
    if (textoNorm.indexOf('processo operatorio') !== -1) return 'processo_operatorio';
    return null;
  }

  // A partir de um resultado de localizarServicos()[i] + tipo de acção pedido,
  // devolve a lista de {label, file, acessivel} respeitando permissões.
  function acoesDoServico(alvo, role, permissoes){
    if (alvo.tipo === 'sistema') {
      var s = alvo.sistema;
      return [{ label: s.nome, file: s.file, acessivel: temAcessoModulo(role, permissoes, s.modulo, s.item) }];
    }
    var svc = alvo.svc;
    var lista = [];
    (svc.relatorios || []).forEach(function (r) {
      lista.push({ label: r.label, file: r.file, acessivel: temAcessoModulo(role, permissoes, r.modulo, r.item), chave: normalizar(r.label) });
    });
    (svc.procedimentos || []).forEach(function (p) {
      lista.push({ label: p.label, file: p.file, acessivel: temAcessoModulo(role, permissoes, p.modulo, p.item), chave: 'procedimentos' });
    });
    (svc.movimento || []).forEach(function (m) {
      lista.push({ label: m.label, file: m.file, acessivel: temAcessoModulo(role, permissoes, m.modulo, m.item), chave: 'movimento' });
    });
    if (svc.temEstatisticas && svc.estatisticasFile) {
      var rel0 = (svc.relatorios || [])[0];
      lista.push({ label: 'Estatísticas', file: svc.estatisticasFile + '?abrir=estatisticas', acessivel: !rel0 || temAcessoModulo(role, permissoes, rel0.modulo, rel0.item), chave: 'estatisticas' });
    }
    return lista;
  }

  function chaveCorrespondeATipo(chave, tipoPedido){
    if (tipoPedido === 'estatisticas') return chave === 'estatisticas';
    if (tipoPedido === 'movimento') return chave === 'movimento';
    if (tipoPedido === 'procedimentos') return chave === 'procedimentos';
    if (tipoPedido === 'registo_diario') return chave === 'registo diario';
    if (tipoPedido === 'processo_operatorio') return chave === 'processo operatorio';
    return false;
  }
  // Devolve { acao, aviso } — "aviso" só vem preenchido quando foi pedida uma
  // opção específica (ex.: "estatísticas de X") que este serviço não tem, ou
  // que existe mas o utilizador não pode abrir, para nunca abrir outra coisa
  // sem dizer que a opção pedida não foi essa (ver instrução de nunca ocultar).
  function escolherAcao(lista, tipoPedido){
    var acessiveis = lista.filter(function (a) { return a.acessivel; });
    if (tipoPedido) {
      var existe = lista.some(function (a) { return chaveCorrespondeATipo(a.chave, tipoPedido); });
      var acessivel = acessiveis.find(function (a) { return chaveCorrespondeATipo(a.chave, tipoPedido); });
      if (acessivel) return { acao: acessivel };
      if (existe) return { acao: acessiveis[0] || null, aviso: 'não tem permissão para essa opção específica' };
      return { acao: acessiveis[0] || null, aviso: 'este serviço não tem essa opção' };
    }
    return { acao: acessiveis[0] || null };
  }

  function categoriaDoServico(svc){
    var cats = window.CATEGORIAS_SERVICOS || [];
    var c = cats.find(function (c) { return c.id === svc.categoria; });
    return c ? c.label : 'Outros';
  }

  // ── Consulta de números reais ──
  // Fase piloto: só para os serviços abaixo, cuja estrutura de dados já foi
  // confirmada ficheiro a ficheiro (cada serviço grava os seus campos de
  // forma diferente — não há um "número de pacientes" universal). Hoje/ontem
  // lê a Realtime Database (mesma base que as páginas já usam); meses
  // passados NÃO estão no Firebase nem no GitHub — o relatório mensal
  // (.github/workflows/relatorio-mensal.yml → scripts/monthly-report.mjs)
  // arquiva-os no Firebase Storage e depois apaga o histórico da Realtime
  // Database, precisamente para não ficarem num repositório público. Ler
  // isto não tem custo de IA nenhum, é só uma leitura normal da mesma conta.
  // "diario" extrai um objecto de números de UM dia (mesma forma quer o dia
  // venha da Realtime Database quer venha do arquivo mensal), "formatar"
  // transforma esse total (de um dia ou já somado de vários) nas linhas
  // mostradas ao utilizador — assim hoje/ontem e mês passado usam a mesma
  // lógica de contagem, sem duplicar regras.
  var RESUMOS_SERVICO = {
    'Bloco Operatório': {
      fbPath: function (data) { return 'registos/bloco_operatorio/' + data; },
      arquivoPath: function (ym) { return 'arquivo/' + ym + '/registos/bloco_operatorio.json'; },
      diario: function (rec) {
        var snap = rec && rec.snapshot;
        if (!snap) return null;
        return {
          urg: (snap.urgData || []).filter(function (x) { return x.saved; }).length,
          ele: (snap.eleData || []).filter(function (x) { return x.saved; }).length,
          sus: (snap.susData || []).filter(function (x) { return x.saved; }).length
        };
      },
      formatar: function (t) {
        return [['Cirurgias urgentes', t.urg], ['Cirurgias eletivas', t.ele], ['Total de cirurgias realizadas', t.urg + t.ele], ['Cirurgias suspensas', t.sus]];
      }
    },
    'Imagiologia': {
      fbPath: function (data) { return 'registos/imagiologia/' + data; },
      arquivoPath: function (ym) { return 'arquivo/' + ym + '/registos/imagiologia.json'; },
      diario: function (rec) {
        if (!rec) return null;
        function somaLinha(r) { return (Number(r.prx) || 0) + (Number(r.rx) || 0) + (Number(r.peco) || 0) + (Number(r.eco) || 0) + (Number(r.ptac) || 0) + (Number(r.tac) || 0); }
        var totalLinhas = (rec.bu || []).reduce(function (s, r) { return s + somaLinha(r); }, 0) + (rec.int || []).reduce(function (s, r) { return s + somaLinha(r); }, 0);
        var totalAut = (Number(rec.autPrx) || 0) + (Number(rec.autRx) || 0) + (Number(rec.autPeco) || 0) + (Number(rec.autEco) || 0) + (Number(rec.autPtac) || 0) + (Number(rec.autTac) || 0);
        return { exames: totalLinhas + totalAut, ecg: Number(rec.ecg) || 0 };
      },
      formatar: function (t) {
        return [['Total de exames de imagem', t.exames], ['ECGs realizados', t.ecg]];
      }
    },
    'Hemoterapia': {
      fbPath: function (data) { return 'registos_sistemas_locais/hemoterapia/' + data; },
      arquivoPath: function (ym) { return 'arquivo/' + ym + '/registos_sistemas_locais/hemoterapia.json'; },
      diario: function (rec) {
        var snap = rec && rec.snapshot;
        if (!snap) return null;
        var t = snap.transfusoes || {}, d = snap.doadores || {}, s = snap.serologia || {};
        return {
          transf: (Number(t.plaquetas) || 0) + (Number(t.plasmas) || 0) + (Number(t.globulos) || 0) + (Number(t.crio) || 0),
          doad: (Number(d.voluntarios) || 0) + (Number(d.familiares) || 0) + (Number(d.habituais) || 0),
          serol: (Number(s.vih) || 0) + (Number(s.hbs) || 0) + (Number(s.vdrl) || 0) + (Number(s.hcv) || 0)
        };
      },
      formatar: function (t) {
        return [['Unidades transfundidas', t.transf], ['Doadores', t.doad], ['Serologias realizadas', t.serol]];
      }
    },
    'Procedimentos de Enfermagem · Geral': {
      // Sem arquivoPath de propósito: o relatório mensal arquiva "Procedimentos
      // de Enfermagem" repartido por especialidade (registos_enf/<especialidade>),
      // não neste caminho agregado "geral" — ainda não confirmei ao certo como
      // juntar essas 12 partes sem risco de um total errado, por isso prefiro
      // dizer que não sei a arriscar um número que pareça certo e não seja.
      fbPath: function (data) { return 'registos_enf/geral/' + data; },
      diario: function (rec) {
        var raw = rec && rec.snapshot && rec.snapshot.raw;
        if (!raw || !raw.specs) return null;
        var total = 0;
        Object.keys(raw.specs).forEach(function (spId) {
          var sp = raw.specs[spId] || {};
          total += somaCampos(sp.dia) + somaCampos(sp.noite);
        });
        return { total: total };
      },
      formatar: function (t) {
        return [['Total de procedimentos de enfermagem registados', t.total]];
      }
    }
  };
  function somaCampos(obj){
    var t = 0;
    (Array.isArray(obj) ? obj : Object.values(obj || {})).forEach(function (v) { t += Number(v) || 0; });
    return t;
  }
  function somarContagens(lista){
    var total = {};
    lista.forEach(function (o) {
      if (!o) return;
      Object.keys(o).forEach(function (k) { total[k] = (total[k] || 0) + (Number(o[k]) || 0); });
    });
    return total;
  }

  function hojeISO(offsetDias){
    var d = new Date();
    d.setDate(d.getDate() + (offsetDias || 0));
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function extrairData(textoNorm){
    if (/ontem/.test(textoNorm)) return { data: hojeISO(-1), label: 'ontem' };
    return { data: hojeISO(0), label: 'hoje' };
  }

  var MESES = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  function labelMes(ano, mesIdx){
    return new Date(ano, mesIdx, 1).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
  }
  function extrairMesPassado(textoNorm){
    if (/mes passado/.test(textoNorm)) {
      var d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1);
      return { ym: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'), label: labelMes(d.getFullYear(), d.getMonth()) };
    }
    for (var i = 0; i < MESES.length; i++) {
      if (!palavraInteira(textoNorm, MESES[i])) continue;
      var anoMatch = textoNorm.match(/\b(20\d{2})\b/);
      var hoje = new Date();
      var ano = anoMatch ? parseInt(anoMatch[1], 10) : hoje.getFullYear();
      if (!anoMatch && i >= hoje.getMonth()) ano -= 1; // sem ano dado e o mês ainda não terminou este ano → assume o ano anterior
      return { ym: ano + '-' + String(i + 1).padStart(2, '0'), label: labelMes(ano, i) };
    }
    return null;
  }

  var _fbLeituraPromise = null;
  function obterFirebaseLeitura(){
    if (_fbLeituraPromise) return _fbLeituraPromise;
    var cfgUrl = new URL('zelo_firebase_config.js', document.baseURI).href;
    _fbLeituraPromise = Promise.all([
      import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js'),
      import(cfgUrl)
    ]).then(function (m) {
      var appMod = m[0], dbMod = m[1], cfgMod = m[2];
      var apps = appMod.getApps();
      var app = apps.length ? apps[0] : appMod.initializeApp(cfgMod.firebaseConfig);
      var db = dbMod.getDatabase(app);
      return function (path) {
        return dbMod.get(dbMod.ref(db, path)).then(function (snap) { return snap.exists() ? snap.val() : null; });
      };
    });
    return _fbLeituraPromise;
  }

  var _fbStoragePromise = null;
  function obterStorageLeitura(){
    if (_fbStoragePromise) return _fbStoragePromise;
    var cfgUrl = new URL('zelo_firebase_config.js', document.baseURI).href;
    _fbStoragePromise = Promise.all([
      import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js'),
      import(cfgUrl)
    ]).then(function (m) {
      var appMod = m[0], stMod = m[1], cfgMod = m[2];
      var apps = appMod.getApps();
      var app = apps.length ? apps[0] : appMod.initializeApp(cfgMod.firebaseConfig);
      var storage = stMod.getStorage(app);
      return function (path) {
        return stMod.getBytes(stMod.ref(storage, path)).then(function (buf) {
          return JSON.parse(new TextDecoder('utf-8').decode(buf));
        }).catch(function (e) {
          if (e && e.code === 'storage/object-not-found') return null; // sem arquivo para esse mês — não é falha de ligação
          throw e;
        });
      };
    });
    return _fbStoragePromise;
  }

  function consultarDadosDia(nomeCanonico, cfg, alvoData){
    return obterFirebaseLeitura().then(function (ler) {
      return ler(cfg.fbPath(alvoData.data));
    }).then(function (rec) {
      var t = rec ? cfg.diario(rec) : null;
      if (!t) return { texto: 'Não há registo guardado de ' + nomeCanonico + ' para ' + alvoData.label + ' (' + alvoData.data + ').' };
      var linhas = cfg.formatar(t);
      var texto = nomeCanonico + ' — ' + alvoData.label + ' (' + alvoData.data + '):\n' +
        linhas.map(function (l) { return '• ' + l[0] + ': ' + l[1]; }).join('\n');
      return { texto: texto };
    }).catch(function () {
      return { texto: 'Não consegui ligar ao Firebase agora para consultar ' + nomeCanonico + '. Tente de novo daqui a pouco.' };
    });
  }

  function consultarDadosMes(nomeCanonico, cfg, mesAlvo){
    if (!cfg.arquivoPath) {
      return Promise.resolve({ texto: 'Para meses passados ainda não tenho a leitura de ' + nomeCanonico + ' confirmada — prefiro não arriscar um número errado. Para hoje/ontem já consigo responder normalmente.' });
    }
    return obterStorageLeitura().then(function (ler) {
      return ler(cfg.arquivoPath(mesAlvo.ym));
    }).then(function (arquivo) {
      if (!arquivo) return { texto: 'Não há arquivo guardado de ' + nomeCanonico + ' para ' + mesAlvo.label + ' — ou porque ainda não passou o dia 2 do mês seguinte (quando o relatório mensal corre), ou porque não houve registos nesse mês.' };
      var diarios = Object.keys(arquivo).map(function (data) { return cfg.diario(arquivo[data]); }).filter(Boolean);
      if (!diarios.length) return { texto: 'Não há registos guardados de ' + nomeCanonico + ' em ' + mesAlvo.label + '.' };
      var linhas = cfg.formatar(somarContagens(diarios));
      var texto = nomeCanonico + ' — ' + mesAlvo.label + ' (' + diarios.length + ' dia(s) com registo):\n' +
        linhas.map(function (l) { return '• ' + l[0] + ': ' + l[1]; }).join('\n');
      return { texto: texto };
    }).catch(function () {
      return { texto: 'Não consegui ligar ao arquivo do Firebase Storage agora para consultar ' + nomeCanonico + '. Tente de novo daqui a pouco.' };
    });
  }

  function consultarDados(nomeCanonico, textoNorm){
    var cfg = RESUMOS_SERVICO[nomeCanonico];
    if (!cfg) {
      return { texto: 'Ainda não sei consultar números de ' + nomeCanonico + ' — por agora só consigo para Bloco Operatório, Imagiologia, Hemoterapia e Procedimentos de Enfermagem · Geral.' };
    }
    var u = estadoUtilizador();
    var slug = window.zeloSlugifyServico ? window.zeloSlugifyServico(nomeCanonico) : null;
    if (!temAcessoModulo(u.role, u.permissoes, 'estatistica', slug)) {
      return { texto: 'Não tem permissão para consultar números/estatísticas de ' + nomeCanonico + '.' };
    }
    var mesAlvo = extrairMesPassado(textoNorm);
    if (mesAlvo) return consultarDadosMes(nomeCanonico, cfg, mesAlvo);
    return consultarDadosDia(nomeCanonico, cfg, extrairData(textoNorm));
  }

  // ── Motor de intenções ──
  var pendente = null; // { tipo:'confirmar_abrir', file, label }

  // Sem IA nem ligação a servidores, o Zelo não "aprende" nem inventa piadas
  // novas — a única forma honesta de não soar sempre igual é escolher ao
  // acaso entre frases já escritas à mão, algumas mais leves/bem-humoradas,
  // mantendo sempre a mesma informação a seguir (para nunca confundir).
  // A frase-base ("O meu criador, Yuri Matias, ainda não me programou para
  // responder a isso.") mantém-se sempre igual (é a resposta certa e
  // directa); só a abertura varia, para não soar sempre em modo de
  // mensagem de erro.
  var ABERTURAS_NAO_SEI = [
    'Essa ainda não sei responder.',
    'Essa está fora do que já sei fazer.',
    'Ainda não tenho essa resposta pronta.'
  ];
  function respostaSaudacao(){
    var u = estadoUtilizador();
    var nome = u.nome ? (', ' + u.nome) : '';
    return 'Olá' + nome + '. Eu sou o assistente Zelo, o que posso fazer por você hoje?';
  }
  function respostaAjuda(){
    return 'Isto é o que sei fazer, sem precisar de ligação a servidores nem custos:\n' +
      '• Abrir um serviço: "abrir ortopedia", "ir para a farmácia"\n' +
      '• Indicar onde fica algo: "onde encontro o laboratório"\n' +
      '• Abrir uma acção específica: "abrir procedimentos de enfermagem do bloco operatório", "estatísticas de imagiologia"\n' +
      '• Dúvidas de uso do sistema: "como guardar em PDF", "como guardo os dados", ou contacto do Serviço de Estatística: "email do serviço de estatística", "extensão da estatística", "onde fica a estatística", "quem é o chefe de estatística"\n' +
      'Não dou números nem outros dados registados do hospital por voz (são informações sensíveis) — para isso, aceda à página do serviço. Também continuo sem preencher formulários por voz.';
  }
  function respostaIdentidade(){
    return 'Sou o Zelo, o assistente do sistema do Hospital do Prenda. Funciono inteiramente no seu navegador — não envio nada para fora, não tenho custos, e só reconheço comandos e perguntas de estrutura, não conversa livre.';
  }
  function respostaCriador(){
    return 'Fui criado pelo Yuri Matias. Antes, era só uma página web normal — mas oficialmente, em 10 de julho de 2026, fui anunciado formalmente numa reunião de conselho clínico.';
  }
  function respostaDadosSensiveis(){
    return 'Não posso dar números nem outros dados registados do hospital por voz — são informações sensíveis e não tenho acesso para as partilhar desta forma. Para consultar esses números, aceda à página do serviço correspondente no sistema.';
  }

  // ── Perguntas frequentes (sobre o Serviço de Estatística e uso do sistema) ──
  // Respostas fixas, verificadas por ordem — a primeira que corresponder ao
  // texto ganha. Para o que não está aqui nem é um serviço/comando
  // reconhecido, o Zelo diz que não tem acesso a essa informação (ver o
  // final de processar()), em vez de inventar uma resposta.
  var PERGUNTAS_FREQUENTES = [
    {
      re: /((email|correio electronico|correio eletronico|e mail).*estatistica|estatistica.*(email|correio electronico|correio eletronico|e mail))/,
      resposta: function () { return 'O email do Serviço de Estatística é estatisticahp@gmail.com.'; }
    },
    {
      re: /((extensao|ramal|numero de telefone|telefone|contacto).*estatistica|estatistica.*(extensao|ramal|numero de telefone|telefone|contacto))/,
      resposta: function () { return 'A extensão do Serviço de Estatística é 1403.'; }
    },
    {
      re: /(chefe (do |de )?servico de estatistica|chefe de estatistica medica|quem (e|dirige|chefia) (o )?servico de estatistica)/,
      resposta: function () { return 'O chefe do Serviço de Estatística Médica é o Yuri Matias.'; }
    },
    {
      re: /((onde fica|onde fica localizado|onde esta localizado|localizacao|onde fica situado|onde estamos localizados|onde encontro).*estatistica|estatistica.*(onde fica|localizacao|localizado))/,
      resposta: function () { return 'O Serviço de Estatística fica na Cave, no corredor dos departamentos, próximo à sala da Nutrição.'; }
    },
    {
      re: /(guardar (em )?pdf|exportar (em )?pdf|gerar (o )?pdf|salvar (em )?pdf|como (faco|tiro) (o |um )?pdf)/,
      resposta: function () { return 'Para guardar em PDF, procure o botão "Exportar PDF" ou "Gerar PDF" na página onde estiver a trabalhar — normalmente fica junto aos outros botões de ação, no topo ou no fundo da página.'; }
    },
    {
      re: /(como (guardo|salvo|gravo)|como guardar (o |os )?(registo|dados|documento)|como salvar (o |os )?(registo|dados|documento))/,
      resposta: function () { return 'Os dados ficam guardados à medida que preenche os campos. Para confirmar que foram enviados, procure o botão "Guardar" ou "Gravar" na página e espere pela confirmação de gravação.'; }
    }
  ];

  function processar(textoOriginal){
    var textoNorm = normalizar(textoOriginal);
    if (!textoNorm) return { texto: 'Não ouvi nada. Pode repetir?' };
    // "Zelo, abrir bloco operatório" / "ei Zelo, ajuda" — retira o endereçamento
    // pelo nome antes de tudo o resto, para uma frase curta destas não ser
    // confundida com uma saudação (ver regex de saudação abaixo). Só quando há
    // texto a seguir — "zelo" sozinho continua a cair na saudação normalmente.
    textoNorm = textoNorm.replace(/^(ei\s+)?zelo[,]?\s+/, '') || textoNorm;

    // Confirmação pendente — só interpreta como sim/não se a frase não nomear
    // logo um serviço novo (senão "abrir a farmácia" enquanto há uma pergunta
    // pendente sobre outro serviço acabava por abrir esse outro por engano,
    // só por conter a palavra "abrir").
    if (pendente) {
      var jaTemNovoAlvo = localizarServicos(textoNorm).length > 0;
      if (!jaTemNovoAlvo) {
        if (/(^| )(sim|pode|abre|abrir|confirmo|ok|vai)( |$)/.test(textoNorm)) {
          var p = pendente; pendente = null;
          return { texto: 'A abrir ' + p.label + '…', navegarPara: p.file };
        }
        if (/(^| )(nao|cancela|cancelar|deixa|esquece)( |$)/.test(textoNorm)) {
          pendente = null;
          return { texto: 'Ok, não abro.' };
        }
      }
      pendente = null; // um comando novo reconhecido, ou algo que não é nem sim nem não, cancela a pergunta pendente
    }

    // Estas perguntas específicas vêm antes da saudação genérica de propósito:
    // frases como "quem criou o zelo" acabam na palavra "zelo" e têm menos de
    // 20 caracteres, por isso cairiam na saudação abaixo (pensada só para
    // "zelo" dito sozinho ou "ei zelo") se fossem verificadas depois.
    if (/(ajuda|o que sabes fazer|que comandos|como funcionas|o que consegues fazer)/.test(textoNorm)) {
      return { texto: respostaAjuda() };
    }
    if (/(quem (te |o |vos )?criou|quem e o (teu |seu )?criador|quem criou o zelo|quem fez o zelo|quem desenvolveu o zelo|quem construiu o zelo|quando (foste|foi) criado)/.test(textoNorm)) {
      return { texto: respostaCriador() };
    }
    for (var pf = 0; pf < PERGUNTAS_FREQUENTES.length; pf++) {
      if (PERGUNTAS_FREQUENTES[pf].re.test(textoNorm)) {
        return { texto: PERGUNTAS_FREQUENTES[pf].resposta() };
      }
    }
    if (/(quem es tu|quem es|o que es|apresenta te)/.test(textoNorm)) {
      return { texto: respostaIdentidade() };
    }
    if (/(^| )(ola|ol[a]|oi|bom dia|boa tarde|boa noite|ei zelo|zelo)( |$)/.test(textoNorm) && textoNorm.length < 20) {
      return { texto: respostaSaudacao() };
    }

    var ondeQuer = /(onde (encontro|fica|esta|está|posso encontrar)|em que (sitio|pagina) (fica|encontro))/.test(textoNorm);
    var abrirQuer = /(abrir|abre|ir para|ir a|entrar em|entrar na|entrar no|mostrar|mostra|quero ver|leva me|vai para)/.test(textoNorm);
    var querNumeros = /(quantos|quantas|numero de|número de|quantidade de|total de)/.test(textoNorm) && !abrirQuer && !ondeQuer;

    var alvos = localizarServicos(textoNorm);
    if (!alvos.length) {
      var aberturaNaoSei = ABERTURAS_NAO_SEI[Math.floor(Math.random() * ABERTURAS_NAO_SEI.length)];
      return { texto: aberturaNaoSei + ' O meu criador, Yuri Matias, ainda não me programou para responder a isso.' };
    }
    // Aviso quando a frase pedia mais do que um serviço distinto (ex.: "abrir
    // bloco operatório e depois farmácia") — o Zelo só trata um pedido de
    // cada vez, mas em vez de ignorar o resto em silêncio, avisa quais ficam
    // por tratar para serem repetidos a seguir. Ambiguidade genuína (um só
    // apelido a apontar para vários nomes, ex.: "medicina") continua a
    // perguntar qual, porque aí não se sabe mesmo o que foi pedido.
    var avisoComposto = '';
    if (alvos.length > 1) {
      if (!alvos.composto) {
        return { texto: 'Está a falar de qual: ' + alvos.map(function (a) { return a.tipo === 'servico' ? a.svc.nome : a.sistema.nome; }).join(' ou ') + '?' };
      }
      var outros = alvos.slice(1).map(function (a) { return a.tipo === 'servico' ? a.svc.nome : a.sistema.nome; });
      avisoComposto = ' De cada vez só consigo tratar um pedido — diga-me depois separadamente sobre ' + outros.join(' e ') + '.';
      alvos = [alvos[0]];
    }
    var alvo = alvos[0];
    var nome = alvo.tipo === 'servico' ? alvo.svc.nome : alvo.sistema.nome;

    // Dados registados do hospital (números de cirurgias, exames, etc.) são
    // sensíveis — o Zelo já não os lê nem partilha por voz aqui. consultarDados()
    // e o que só ela usa (RESUMOS_SERVICO, obterStorageLeitura,
    // consultarDadosDia/Mes, extrairMesPassado/extrairData/hojeISO) ficam no
    // ficheiro, propositadamente sem serem chamados, só para o caso de um dia
    // isto vir a ser reactivado. obterFirebaseLeitura() continua activa — é
    // também usada por tentarAvisarPreenchimento() (dias em falta), que não
    // foi desligada por esta alteração (ver nota nessa função).
    if (querNumeros) {
      return { texto: respostaDadosSensiveis() + avisoComposto };
    }

    var u = estadoUtilizador();
    var lista = acoesDoServico(alvo, u.role, u.permissoes);
    var tipoPedido = tipoAcaoPedida(textoNorm);
    var escolha = escolherAcao(lista, tipoPedido);
    var acao = escolha.acao;
    var prefixoAviso = escolha.aviso ? ('Nota: ' + escolha.aviso + '. ') : '';

    if (ondeQuer) {
      if (alvo.tipo === 'servico') {
        var cat = categoriaDoServico(alvo.svc);
        if (!acao) return { texto: nome + ' está em Serviços → ' + cat + ', mas não tem permissão para abrir nenhuma das opções desse serviço.' + avisoComposto };
        pendente = { file: acao.file, label: nome + ' — ' + acao.label };
        return { texto: prefixoAviso + nome + ' está em Serviços → ' + cat + '. Quer que eu abra agora (' + acao.label + ')?' + avisoComposto };
      }
      var localizacao = alvo.sistema.destaque ? 'no menu, no atalho próprio' : 'no Serviço de Estatística (só administradores)';
      if (!acao) return { texto: nome + ' está ' + localizacao + ', mas não tem permissão para o abrir.' + avisoComposto };
      pendente = { file: acao.file, label: nome };
      return { texto: nome + ' está ' + localizacao + '. Quer que eu abra agora?' + avisoComposto };
    }

    // "abrir X" (verbo explícito) ou apenas o nome do serviço dito sozinho
    if (!acao) return { texto: 'Não tem permissão para aceder a ' + nome + '.' + avisoComposto };
    var extra = lista.filter(function (a) { return a.acessivel && a !== acao; }).map(function (a) { return a.label; });
    var texto = prefixoAviso + 'A abrir ' + nome + (acao.label && acao.label !== nome ? ' — ' + acao.label : '') + '…';
    if (extra.length) texto += ' (também disponível: ' + extra.join(', ') + ')';
    texto += avisoComposto;
    return { texto: texto, navegarPara: acao.file };
  }

  // ── Voz: Web Speech API (grátis, corre só no navegador) ──
  var SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  var vozDisponivel = !!SpeechRecognitionCtor && !!window.speechSynthesis;
  var recognition = null;
  var ouvindo = false;

  // Não há como testar reconhecimento de voz real sem utilizadores a falar —
  // em vez de fixar pt-PT ou pt-BR a adivinhar qual reconhece melhor o
  // sotaque local, fica à escolha de quem usa (ver botão "PT"/"BR" no
  // cabeçalho do painel), guardada em localStorage para as próximas vezes.
  function idiomaVoz(){
    return localStorage.getItem('zeloVozIdioma') || 'pt-PT';
  }
  // Em vários navegadores (Chrome incluído) getVoices() devolve uma lista
  // vazia na primeira chamada da página — só vem preenchida depois do evento
  // "voiceschanged". Sem isto, a primeira fala de cada página (normalmente a
  // saudação automática) arriscava sair sem escolher a voz certa em pt-PT/pt-BR.
  // Só espera uma vez por página — chamadas seguintes já têm a lista pronta.
  var _vozesJaEsperadas = false;
  function vozesProntas(cb){
    if (window.speechSynthesis.getVoices().length || _vozesJaEsperadas) { cb(); return; }
    _vozesJaEsperadas = true;
    var resolvido = false;
    function resolver(){
      if (resolvido) return;
      resolvido = true;
      window.speechSynthesis.removeEventListener('voiceschanged', resolver);
      cb();
    }
    window.speechSynthesis.addEventListener('voiceschanged', resolver);
    setTimeout(resolver, 400); // não bloqueia para sempre se o evento nunca disparar
  }
  // A Web Speech API não tem um campo fiável de género de voz (varia por
  // motor/sistema operativo), por isso a escolha da voz masculina é por
  // nomes conhecidos de vozes portuguesas masculinas nos motores mais comuns
  // (Windows/Edge, macOS/iOS, Google) — corre tudo local, sem custos.
  var NOMES_VOZ_MASCULINA = [
    'duarte', 'helder', 'diogo', 'bruno', 'joaquim', 'rui', 'miguel', 'fabio', 'fábio', 'daniel', 'ricardo',
    'antonio', 'antónio', 'felipe', 'male', 'masculino', 'homem'
  ];
  function ehVozMasculina(v){
    if (v.gender === 'male') return true; // alguns motores expõem isto, embora não seja padrão
    var nome = (v.name || '').toLowerCase();
    return NOMES_VOZ_MASCULINA.some(function (n) { return nome.indexOf(n) !== -1; });
  }
  // A detecção automática por nome não cobre todos os aparelhos (alguns
  // motores de voz não dão pistas nenhumas de género no nome) — por isso
  // quem usa pode escolher a voz exacta no painel (ver "escolher voz" no
  // cabeçalho), e essa escolha manual tem sempre prioridade sobre a
  // detecção automática.
  function vozEscolhidaManualmente(vozes){
    var nomeEscolhido = localStorage.getItem('zeloVozEscolhidaNome');
    if (!nomeEscolhido) return null;
    return vozes.find(function (v) { return v.name === nomeEscolhido; }) || null;
  }
  function escolherVoz(idioma, vozes){
    var manual = vozEscolhidaManualmente(vozes);
    if (manual) return manual;
    // Vozes em português, da melhor para a pior: as vozes "naturais"/neurais
    // (Edge "Online (Natural)", Google, "Premium"/"Enhanced" no iPhone/Mac)
    // pronunciam muito melhor do que as vozes básicas do sistema.
    var pt = vozes.filter(function (v) { return /^pt/i.test(v.lang || ''); });
    if (!pt.length) return null;
    function nota(v) {
      var n = 0, nome = v.name || '';
      if ((v.lang || '').replace('_', '-').toLowerCase() === idioma.toLowerCase()) n += 20;
      if (/natural|neural|online|premium|enhanced|melhorad/i.test(nome)) n += 12;
      if (/google/i.test(nome)) n += 8;
      if (ehVozMasculina(v)) n += 3;
      if (/compact|espeak|robot/i.test(nome)) n -= 10;
      return n;
    }
    return pt.slice().sort(function (a, b) { return nota(b) - nota(a); })[0];
  }
  // Fala calma e bem pronunciada: o texto é dividido em frases curtas, cada
  // uma dita por inteiro e com uma pequena pausa entre elas. Frases longas
  // numa só leitura eram cortadas por alguns navegadores (o Chrome pára a
  // meio ao fim de ~15 s) e soavam apressadas.
  var VELOCIDADE_FALA = 0.82;
  var MESES_FALA = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  // Siglas ditas letra a letra (senão a voz tenta lê-las como palavras).
  var SIGLAS_FALA = { UCI: 'U C I', PDF: 'P D F', NUP: 'N U P', VIH: 'V I H', HIV: 'H I V', HP: 'H P', RH: 'R H', TAC: 'T A C', RX: 'R X', ECG: 'E C G', GEPE: 'G E P E', DEMA: 'D E M A', ID: 'I D' };
  function _horaFalada(h, m){
    h = parseInt(h, 10); m = parseInt(m, 10);
    var hs = h === 1 ? 'uma hora' : (h === 0 ? 'zero horas' : h + ' horas');
    return m ? hs + ' e ' + m + (m === 1 ? ' minuto' : ' minutos') : hs;
  }
  function _prepararTexto(texto){
    return String(texto || '')
      // datas: 25/09/2026 → 25 de setembro de 2026; 25/09 → 25 de setembro
      .replace(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g, function (x, d, m, a) { return +m >= 1 && +m <= 12 ? (+d) + ' de ' + MESES_FALA[+m - 1] + ' de ' + a : x; })
      .replace(/\b(\d{1,2})\/(\d{1,2})\b/g, function (x, d, m) { return +m >= 1 && +m <= 12 && +d <= 31 ? (+d) + ' de ' + MESES_FALA[+m - 1] : x; })
      // horas: 05:20 → 5 horas e 20 minutos
      .replace(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g, function (x, h, m) { return _horaFalada(h, m); })
      // percentagens e decimais: 67,6% → 67 vírgula 6 por cento
      .replace(/(\d+),(\d+)\s?%/g, '$1 vírgula $2 por cento').replace(/(\d+)\s?%/g, '$1 por cento')
      .replace(/(\d+),(\d+)/g, '$1 vírgula $2')
      .replace(/\b([A-Z]{2,4})\b/g, function (x) { return SIGLAS_FALA[x] || x; })
      .replace(/\bZELO\b/g, 'Zelo')
      .replace(/\s*[·|]\s*/g, ', ')
      .replace(/[•\n]+/g, '. ')
      .replace(/\s+—\s+/g, ', ')
      .replace(/\bEnf\.\s/g, '')
      .replace(/\bDr\.\s/g, 'Doutor ').replace(/\bDra\.\s/g, 'Doutora ')
      .replace(/\bn\.º\s?/gi, 'número ')
      .replace(/\(a\)/g, '')
      .replace(/\s{2,}/g, ' ').trim();
  }
  function _frases(texto){
    var partes = _prepararTexto(texto).match(/[^.!?;:]+[.!?;:]*/g) || [];
    var out = [];
    partes.forEach(function (f) {
      f = f.trim(); if (!f) return;
      // frases longas: divide nas vírgulas (pausa breve), sem partir palavras
      while (f.length > 110) {
        var corte = f.lastIndexOf(',', 110);
        if (corte < 40) corte = f.lastIndexOf(' ', 170);
        if (corte < 40) break;
        out.push(f.slice(0, corte + 1).trim()); f = f.slice(corte + 1).trim();
      }
      if (f) out.push(f);
    });
    return out;
  }
  function _dizer(texto, imediato){
    window.speechSynthesis.cancel();
    var idioma = idiomaVoz();
    var voz = escolherVoz(idioma, window.speechSynthesis.getVoices());
    var frases = _frases(texto);
    // Pequena espera depois de cancelar: alguns navegadores perdiam a
    // primeira palavra quando a fala nova começava logo a seguir.
    var falarTudo = function () { frases.forEach(function (f) {
      var u = new SpeechSynthesisUtterance(f);
      u.lang = idioma;
      if (voz) u.voice = voz;
      u.rate = Number(localStorage.getItem('zeloVozVelocidade')) || VELOCIDADE_FALA;
      u.pitch = 1;
      u.volume = 1;
      window.speechSynthesis.speak(u);
    }); };
    if (imediato) falarTudo(); else setTimeout(falarTudo, 120);
  }
  function falar(texto){
    if (!window.speechSynthesis) return;
    if ((localStorage.getItem('zeloVoz') || 'on') === 'off') return;
    vozesProntas(function () {
      try { _dizer(texto); } catch (e) {}
    });
  }
  // Versão sem espera por vozesProntas() — precisa de falar já, de forma
  // síncrona, porque quem chama isto (a confirmação de eliminar, ver abaixo)
  // segue logo a seguir com um window.confirm() nativo, que bloqueia a
  // página; se ficasse à espera do evento "voiceschanged" (até 400ms), essa
  // espera nunca chegava a correr enquanto o confirm() estivesse aberto.
  function falarSincrono(texto){
    if (!window.speechSynthesis) return;
    if ((localStorage.getItem('zeloVoz') || 'on') === 'off') return;
    try { _dizer(texto, true); } catch (e) {}
  }

  // ── Ler em voz dados já visíveis no ecrã ──
  // Diferente da consulta de números por Firebase (desligada — dados
  // sensíveis, ver processar()): isto lê em voz alta dados que a própria
  // pessoa já tem no ecrã, depois de os ter carregado pelos botões normais
  // da página (o mesmo que já podia ver ou exportar em PDF) — o Zelo não vai
  // buscar nada por fora, só narra o que já está visível e permitido.
  // Reconhece os padrões de "cartão rótulo + valor" já usados em páginas de
  // estatísticas/painéis/KPIs (cada página do sistema tem o seu próprio, por
  // terem sido construídas em alturas diferentes); nos restantes casos lê o
  // texto visível do elemento tal como está.
  var PADROES_CARTAO = [
    { cartao: '.stat-summary-card', rotulo: '.stat-summary-label', valor: '.stat-summary-value' },
    { cartao: '.kpi', rotulo: '.kpi-lbl', valor: '.kpi-val' },
    { cartao: '.kpi', rotulo: '.kpi-label', valor: '.kpi-val' },
    { cartao: '.kpi-box', rotulo: '.kpi-label', valor: '.kpi-val' },
    { cartao: '.stat-box', rotulo: '.lbl', valor: '.num' },
    { cartao: '.kpi', rotulo: 'span', valor: 'b' },
    { cartao: '.emp-row', rotulo: '.name', valor: '.count' },
    { cartao: '.card', rotulo: '.lb', valor: '.vl' },
    { cartao: '.stat-tile', rotulo: '.l', valor: '.v' },
    { cartao: '.stat-mini', rotulo: '.l', valor: '.n' },
    { cartao: '.nd', rotulo: 'label', valor: '.val' }
  ];
  function textoDeElemento(el){
    if (!el) return '';
    for (var p = 0; p < PADROES_CARTAO.length; p++) {
      var padrao = PADROES_CARTAO[p];
      var cartoes = el.querySelectorAll(padrao.cartao);
      if (!cartoes.length) continue;
      var partes = [];
      cartoes.forEach(function (c) {
        var rotulo = c.querySelector(padrao.rotulo);
        var valor = c.querySelector(padrao.valor);
        var textoValor = null;
        if (valor) {
          textoValor = valor.textContent.trim();
        } else if (rotulo) {
          // Algumas páginas não dão uma classe própria ao valor. Campos
          // editáveis (input/select/textarea, ex.: um total preenchido à
          // mão) não têm o valor no textContent — é preciso ler .value; sem
          // isto, cartões com um campo destes liam antes o texto de dica a
          // seguir (ex.: "Manual") em vez do número. Sem nenhum dos dois, o
          // último elemento-filho que não é o rótulo costuma ser o valor.
          var campo = c.querySelector('input, select, textarea');
          if (campo) {
            textoValor = String(campo.value || '0').trim();
          } else {
            var filhos = Array.prototype.filter.call(c.children, function (f) { return f !== rotulo; });
            var ultimoFilho = filhos[filhos.length - 1];
            if (ultimoFilho) textoValor = ultimoFilho.textContent.trim();
          }
        }
        if (rotulo && textoValor !== null) partes.push(rotulo.textContent.trim() + ': ' + textoValor);
      });
      if (partes.length) return partes.join('. ');
    }
    // Tabelas: célula a célula ficam coladas sem espaço no innerText puro
    // (ex.: "Pensos12") — lê linha a linha, com vírgulas entre células.
    var tabela = el.querySelector('table');
    if (tabela) {
      var linhas = [];
      tabela.querySelectorAll('tr').forEach(function (tr) {
        var celulas = Array.prototype.map.call(tr.querySelectorAll('th,td'), function (c) { return c.textContent.trim(); }).filter(Boolean);
        if (celulas.length) linhas.push(celulas.join(', '));
      });
      if (linhas.length) return linhas.join('. ');
    }
    var texto = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
    // Quando o próprio botão "Ler em voz" está dentro do contentor lido
    // (ex.: um botão único no topo da página, a ler tudo o resto), o texto
    // desse botão não pode fazer parte da narração — sem isto lia-se a
    // ler-se a si próprio antes de chegar aos dados a sério.
    el.querySelectorAll('button').forEach(function (b) {
      var textoBotao = (b.innerText || b.textContent || '').replace(/\s+/g, ' ').trim();
      if (textoBotao) texto = texto.split(textoBotao).join(' ');
    });
    return texto.replace(/\s+/g, ' ').trim();
  }
  // Exposto para as páginas ligarem um botão "🔊 Ler em voz" a qualquer
  // contentor já carregado no ecrã (dia, mês, trimestre, semestre, ano).
  window.zeloLerElemento = function (seletor, titulo) {
    var el = typeof seletor === 'string' ? document.querySelector(seletor) : seletor;
    var corpo = textoDeElemento(el);
    if (!corpo) { falar('Ainda não há dados carregados para ler aqui.'); return; }
    falar((titulo ? titulo + '. ' : '') + corpo);
  };

  // ── Confirmação por voz antes de eliminar ──
  // Muitas páginas já pedem confirmação antes de eliminar dados (janela
  // confirm() nativa do navegador, com uma mensagem própria de cada página)
  // — isto não substitui esse clique, só acrescenta a mesma pergunta em voz
  // no preciso momento em que a janela aparece, para reforçar antes de uma
  // acção irreversível. O Zelo não ouve "sim"/"não" aqui de propósito — quem
  // decide continua a ser sempre um clique: um erro de reconhecimento de voz
  // a apagar um registo clínico seria demasiado arriscado.
  var PALAVRAS_ELIMINAR = /elimin|apag|remov|exclu|desativ/i;
  var confirmNativo = window.confirm;
  window.confirm = function (mensagem) {
    var texto = String(mensagem || '');
    if (PALAVRAS_ELIMINAR.test(texto)) {
      falarSincrono(texto.replace(/[⚠️]/g, '').replace(/\n+/g, '. '));
    }
    return confirmNativo.call(window, mensagem);
  };

  // ── Saudação automática de entrada no sistema (uma vez por dia, por voz) ──
  // Angola usa UTC+1 o ano inteiro (Africa/Luanda, sem hora de Verão), por
  // isso a escolha entre "bom dia"/"boa tarde"/"boa noite" usa sempre a hora
  // desse fuso, independentemente do fuso do dispositivo de quem acede.
  function dataHoraAngola(){
    var partes = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Luanda', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false, weekday: 'short'
    }).formatToParts(new Date());
    var obj = {};
    partes.forEach(function (p) { obj[p.type] = p.value; });
    return { data: obj.year + '-' + obj.month + '-' + obj.day, hora: parseInt(obj.hour, 10), diaSemana: obj.weekday };
  }
  function saudacaoPorHora(hora){
    if (hora >= 5 && hora < 12) return 'Bom dia';
    if (hora >= 12 && hora < 19) return 'Boa tarde';
    return 'Boa noite';
  }
  // Alguns turnos são de noite — "bom dia de trabalho" ficaria estranho a
  // seguir a "boa noite", por isso o desejo usa sempre "turno", que serve a
  // qualquer hora. A abertura (quem é o Zelo + desejo de bom turno) e a
  // recomendação variam cada uma entre várias frases escolhidas ao acaso,
  // para não soar sempre igual ao fim de semanas de uso diário — mas nunca
  // ao mesmo tempo que se repete a mesma combinação todos os dias.
  var ABERTURAS_ENTRADA_DIA = [
    'Eu sou o assistente Zelo. Desejo-te um bom turno de trabalho.',
    'Aqui é o Zelo. Espero que o turno corra bem.',
    'Sou o Zelo, sempre por perto. Bom turno de trabalho.',
    'O Zelo está por aqui, como sempre. Desejo-te um bom turno.'
  ];
  // Só na primeira entrada de uma segunda-feira: em vez da abertura normal,
  // pergunta pelo fim de semana e deseja uma boa semana de trabalho.
  var ABERTURAS_ENTRADA_SEGUNDA = [
    'Sou o Zelo. Espero que tenhas passado bem o fim de semana — desejo-te uma óptima semana de trabalho.',
    'Bom regresso! Espero que o fim de semana tenha corrido bem. Boa semana de trabalho.',
    'Sou o Zelo. Espero que tenhas descansado bem no fim de semana — vamos a uma boa semana!',
    'Nova semana a começar. Espero que o fim de semana tenha sido bom — desejo-te uma semana de trabalho produtiva.'
  ];
  var TRANSICOES_RECOMENDACAO = [
    'E uma recomendação:',
    'Já agora, uma dica:',
    'Um lembrete rápido:',
    'Deixo-te aqui uma sugestão:'
  ];
  var LEMBRETES_SAUDACAO = [
    'tenha sempre atenção ao escrever e ao guardar os registos — cada dado certo faz diferença para o doente e para a equipa.',
    'confirme bem os dados antes de guardar — um registo certo hoje poupa tempo e dúvidas mais tarde.',
    'escreva com calma e reveja antes de guardar — a qualidade dos registos começa em cada detalhe.',
    'antes de guardar, dê sempre uma segunda olhadela aos dados — vale a pena o cuidado extra.',
    'não deixe o registo do dia para depois — o que fica para trás é mais fácil de se esquecer.',
    'se algum campo ficar em dúvida, confirme com a equipa antes de guardar — é sempre melhor perguntar do que adivinhar.',
    'um registo bem preenchido hoje é um problema a menos amanhã — vale o minuto extra.',
    'dados incompletos contam metade da história — tente preencher tudo o que se aplica ao dia.'
  ];
  // Só sauda na página inicial (index.html) — é aí que se entra no sistema;
  // abrir directamente outra página (ex.: um separador deixado aberto, ou um
  // link partilhado) não conta como "entrar", por isso não sauda aí.
  function estaNaPaginaInicial(){
    var ficheiro = window.location.pathname.split('/').pop();
    return ficheiro === '' || ficheiro === 'index.html';
  }
  // Quando a pessoa já tinha entrado hoje, saiu (fechou o separador/sessão) e
  // está a voltar agora — não é a primeira entrada do dia, mas também não faz
  // sentido ficar em silêncio: uma saudação curta de boas-vindas, sem repetir
  // a recomendação (essa já foi dita na primeira entrada de hoje).
  // Saudações de regresso, conforme o tempo que a pessoa esteve fora
  // (última atividade guardada neste aparelho). Frases neutras, sem
  // "bem-vindo(a)", para soarem naturais em voz alta.
  var VOLTA_POUCO_TEMPO = [
    'Que bom ter-te de volta, NOME. Estiveste fora pouco tempo, podes continuar de onde paraste.',
    'Olá outra vez, NOME. Está tudo como deixaste, continua à vontade.',
    'De volta, NOME? Ótimo. O Zelo continua aqui contigo.'
  ];
  var VOLTA_PAUSA = [
    'SAUDACAO, NOME. Que bom ver-te de volta. Espero que a pausa tenha sido boa.',
    'SAUDACAO, NOME. De volta ao trabalho? Conta comigo para o que precisares.',
    'SAUDACAO, NOME. Bom regresso. Vamos continuar com calma e atenção aos registos.'
  ];
  var VOLTA_DEPOIS_DE_DIAS = [
    'Que bom ter-te de volta depois de uns dias.',
    'Há uns dias que não te via por aqui. Que bom ter-te de volta.',
    'Bom regresso ao ZELO depois destes dias.'
  ];
  function _escolher(lista){ return lista[Math.floor(Math.random() * lista.length)]; }
  function _chaveAtividade(){ return 'zeloUltimaAtividade_' + (sessionStorage.getItem('zeloEmail') || 'geral'); }
  function _ultimaAtividade(){ return Number(localStorage.getItem(_chaveAtividade())) || 0; }
  function _registarAtividade(){ try { if (sessionStorage.getItem('zeloNome')) localStorage.setItem(_chaveAtividade(), String(Date.now())); } catch (e) {} }
  // Nota do Serviço de Estatística, pedida para vir sempre no fim da
  // saudação completa (não na de "bem-vindo de volta", mais curta e que já
  // não repete a recomendação) — texto fixo, por ser uma instrução
  // operacional, não uma frase de cortesia a variar.
  var NOTA_ESTATISTICA = ' Nota importante: o Serviço de Estatística agradece se, antes das suas atividades, levar os dados produzidos do último turno. Não guarde registos estatísticos no departamento — peça ao secretário do serviço para os levar à Estatística.';
  // Só sauda quando já há sessão iniciada (sessionStorage.zeloNome) — não na
  // página de login. A saudação completa (com recomendação) só acontece uma
  // vez por dia, guardada em localStorage (vale para o dispositivo todo, não
  // por separador/página); uma nova entrada no mesmo dia — sessão nova neste
  // separador (sessionStorage próprio, que não sobrevive a fechar o
  // separador/browser) — recebe só as boas-vindas de volta, mais curtas. Uma
  // simples recarga da mesma página/sessão não repete nada.
  function tentarSaudarEntrada(){
    if (!estaNaPaginaInicial()) return;
    var nome = _doisNomes(sessionStorage.getItem('zeloNome') || '');
    if (!nome) return;
    if (sessionStorage.getItem('zeloSaudacaoSessao')) return;
    sessionStorage.setItem('zeloSaudacaoSessao', '1');
    var agora = dataHoraAngola();
    var ultima = _ultimaAtividade();
    var foraMin = ultima ? (Date.now() - ultima) / 60000 : Infinity;
    _registarAtividade();
    if (localStorage.getItem('zeloSaudacaoDia') === agora.data) {
      var lista = foraMin < 45 ? VOLTA_POUCO_TEMPO : VOLTA_PAUSA;
      falar(_escolher(lista).replace('SAUDACAO', saudacaoPorHora(agora.hora)).replace('NOME', nome));
      return;
    }
    localStorage.setItem('zeloSaudacaoDia', agora.data);
    var regressoDias = foraMin !== Infinity && foraMin > 2 * 24 * 60 ? ' ' + _escolher(VOLTA_DEPOIS_DE_DIAS).replace('NOME', nome) : '';
    var listaAberturas = agora.diaSemana === 'Mon' ? ABERTURAS_ENTRADA_SEGUNDA : ABERTURAS_ENTRADA_DIA;
    var abertura = listaAberturas[Math.floor(Math.random() * listaAberturas.length)];
    var transicao = TRANSICOES_RECOMENDACAO[Math.floor(Math.random() * TRANSICOES_RECOMENDACAO.length)];
    var lembrete = LEMBRETES_SAUDACAO[Math.floor(Math.random() * LEMBRETES_SAUDACAO.length)];
    var texto = saudacaoPorHora(agora.hora) + ', ' + nome + '.' + regressoDias + ' ' + abertura + ' ' + transicao + ' ' + lembrete + NOTA_ESTATISTICA;
    falar(texto);
  }
  // Exposto para o index.html chamar assim que o login terminar. É preciso
  // porque o index.html é uma SPA — o login acontece na mesma carga da
  // página (sem recarregar), por isso a tentativa automática 1200ms depois
  // de abrir a página corre ANTES de haver sessão (sessionStorage.zeloNome
  // ainda vazio) e nunca mais se repete sozinha.
  window.zeloTentarSaudarEntrada = tentarSaudarEntrada;

  // Exposto para páginas cuja lógica de dados vive num closure próprio (ex:
  // farmacia_central.html) poderem falar através da mesma fila/voz/mudo do
  // Zelo, em vez de cada página reimplementar a sua própria leitura de voz.
  window.zeloFalar = falar;

  // Exposto para páginas verificarem a data/hora de Angola de forma segura
  // (fuso fixo, sem depender do relógio/fuso local do aparelho) antes de
  // decidir se algo é cronologicamente estranho — ex.: preencher o turno
  // Noite de hoje quando ainda é de manhã.
  window.zeloDataHoraAngola = dataHoraAngola;

  // Primeiro nome para cumprimentar; títulos abreviados (ex.: "Enf.", "Dr.")
  // ficam juntos com o nome seguinte — "Enf. Ana", e não "Enf.".
  function _primeiroNome(n){
    var p = String(n || '').trim().split(/\s+/);
    if (p.length > 1 && /\.$/.test(p[0])) return p[0] + ' ' + p[1];
    return p[0] || '';
  }
  // Dois nomes de cada utilizador (primeiro e último — "Ana Silva", e não só
  // "Ana"); um título abreviado ("Enf.", "Dr.") fica à frente. Partículas
  // como "da", "de", "dos" nunca ficam sozinhas no fim.
  function _doisNomes(n){
    var p = String(n || '').trim().split(/\s+/).filter(Boolean);
    if (!p.length) return '';
    var titulo = '';
    if (p.length > 1 && /\.$/.test(p[0])) titulo = p.shift() + ' ';
    var primeiro = p[0];
    var resto = p.slice(1).filter(function (x) { return !/^(da|de|do|das|dos|e)$/i.test(x); });
    return titulo + primeiro + (resto.length ? ' ' + resto[resto.length - 1] : '');
  }
  window.zeloDoisNomes = _doisNomes;
  // ── Aviso de preenchimento em falta ──
  // Cada página com este aviso diz como encontrar os seus próprios dados no
  // Firebase (window.ZELO_MODULE/ZELO_ITEM, já definidos no topo de cada
  // página para as permissões) — começa em Procedimentos de Enfermagem (uma
  // configuração por especialidade) e Bloco Operatório; outros serviços
  // podem juntar-se aqui da mesma forma. O relatório mensal arquiva e limpa
  // a Realtime Database no dia 2 de cada mês, por isso cada caminho aqui só
  // tem os dias do mês corrente — uma única leitura já dá a lista toda de
  // dias preenchidos, sem precisar de até 30 pedidos separados.
  function labelEspecialidadeEnfermagem(slug){
    if (slug === 'geral') return 'Geral';
    var menu = window.SERVICOS_MENU || [];
    for (var i = 0; i < menu.length; i++) {
      var procs = menu[i].procedimentos || [];
      for (var j = 0; j < procs.length; j++) {
        if (procs[j].item === slug) return menu[i].nome;
      }
    }
    return slug;
  }
  // Tabela dos serviços "de página única" (não são por especialidade, como
  // Procedimentos de Enfermagem) — para juntar mais um basta acrescentar
  // aqui a linha com o caminho no Firebase e o nome a dizer.
  var TABELA_AVISO_PREENCHIMENTO = {
    'servicos|bloco_operatorio': { fbPathBase: 'registos/bloco_operatorio', servicoLabel: 'Bloco Operatório', itemPlural: 'registos' },
    'servicos|laboratorio_clinico': { fbPathBase: 'registos/laboratorio_clinico', servicoLabel: 'Laboratório', itemPlural: 'registos' },
    'servicos|consulta_externa': { fbPathBase: 'registos/consulta_externa', servicoLabel: 'Consulta Externa', itemPlural: 'registos' },
    'sistemas_independentes|hemoterapia': { fbPathBase: 'registos_sistemas_locais/hemoterapia', servicoLabel: 'Hemoterapia', itemPlural: 'registos' },
    'sistemas_independentes|bloco_operatorio_registo_diario': { fbPathBase: 'registos_sistemas_locais/bloco_operatorio', servicoLabel: 'Bloco Operatório — Registo Diário', itemPlural: 'registos' },
    'sistemas_independentes|bloco_operatorio_ficha_operatoria': { fbPathBase: 'registos_sistemas_locais/bloco_operatorio_ficha', servicoLabel: 'Bloco Operatório — Ficha Operatória', itemPlural: 'fichas' },
    'sistemas_independentes|consulta_externa_geral': { fbPathBase: 'registos_sistemas_locais/consulta_externa', servicoLabel: 'Consulta Externa', itemPlural: 'registos' },
    'sistemas_independentes|laboratorio_geral': { fbPathBase: 'registos_sistemas_locais/laboratorio', servicoLabel: 'Laboratório', itemPlural: 'registos' },
    'sistemas_independentes|imagiologia_radiologia_geral': { fbPathBase: 'registos_sistemas_locais/imagiologia', servicoLabel: 'Imagiologia', itemPlural: 'registos' },
    'servicos|fisioterapia': { fbPathBase: 'registos/fisioterapia', servicoLabel: 'Fisioterapia', itemPlural: 'registos' }
  };
  // Nome do serviço de uma página de Movimento Hospitalar (lido do menu).
  function labelMovimento(item){
    var menu = window.SERVICOS_MENU || [];
    for (var i = 0; i < menu.length; i++) {
      var mv = menu[i].movimento || [];
      for (var j = 0; j < mv.length; j++) if (mv[j].item === item) return (mv[j].label.split(' — ')[1]) || menu[i].nome;
    }
    return item;
  }
  function configAvisoPreenchimento(){
    if (window.ZELO_MODULE === 'procedimentos_enfermagem' && window.ZELO_ITEM) {
      return {
        fbPathBase: 'registos_enf/' + window.ZELO_ITEM,
        servicoLabel: window.ZELO_ITEM === 'geral' ? 'Procedimentos de Enfermagem' : 'Procedimentos de Enfermagem de ' + labelEspecialidadeEnfermagem(window.ZELO_ITEM),
        itemPlural: 'procedimentos',
        chaveAviso: 'enf_' + window.ZELO_ITEM
      };
    }
    // Movimento Hospitalar: os dias preenchidos vêm dos dados deste aparelho
    // (zeloDiasComRegistoLocal, em zelo_movimento_grelha.js); o nó do
    // Firebase guarda o mês inteiro de uma vez, sem chaves por dia.
    if (window.ZELO_MODULE === 'movimento_mensal' && window.ZELO_ITEM && window.ZELO_ITEM !== 'banco_urgencia') {
      return {
        movimento: true,
        fbPathBase: 'registos_movimento/' + window.ZELO_ITEM,
        servicoLabel: 'Movimento Hospitalar de ' + labelMovimento(window.ZELO_ITEM),
        itemPlural: 'registos',
        chaveAviso: 'mov_' + window.ZELO_ITEM
      };
    }
    // Movimento do Banco de Urgência: registos independentes (um por fecho de
    // turno, pequena cirurgia…), cada um com a sua data — um dia conta como
    // preenchido quando tem pelo menos um registo não eliminado.
    if (window.ZELO_MODULE === 'movimento_mensal' && window.ZELO_ITEM === 'banco_urgencia') {
      return {
        fbPathBase: 'registos_sistemas_locais/banco_urgencia',
        servicoLabel: 'Movimento do Banco de Urgência',
        itemPlural: 'registos',
        chaveAviso: 'mov_banco_urgencia',
        porRegistos: true
      };
    }
    var chave = window.ZELO_MODULE + '|' + window.ZELO_ITEM;
    var cfg = TABELA_AVISO_PREENCHIMENTO[chave];
    if (!cfg) return null;
    return {
      fbPathBase: cfg.fbPathBase,
      servicoLabel: cfg.servicoLabel,
      itemPlural: cfg.itemPlural,
      chaveAviso: chave
    };
  }
  // Quando há dias em falta, avisa uma vez por sessão (não a cada
  // navegação/recarregamento dentro da mesma entrada no sistema — só volta a
  // insistir se a pessoa sair e entrar de novo). Quando o mês está todo em
  // dia, os parabéns só soam 1x por dia — repeti-los a cada entrada na
  // página seria cansativo sem necessidade.
  //
  // Nota (dados sensíveis): isto lê o Firebase para saber SÓ quais dias têm
  // ou não um registo guardado — nunca o conteúdo desses registos (números,
  // dados clínicos). Ficou activo mesmo depois de "quantas cirurgias hoje"
  // etc. passarem a recusar (ver processar()), por ser informação de
  // acompanhamento de preenchimento, não dados clínicos. Se isto também
  // dever parar de ler o Firebase, é só comentar a chamada a
  // setTimeout(tentarAvisarPreenchimento,...) e o addEventListener
  // 'zelo-gate-ready' correspondente, lá em baixo em iniciar().
  //
  // zelo_pagegate.js só grava sessionStorage.zeloNome DEPOIS de confirmar a
  // sessão com o Firebase — numa ligação lenta isso pode demorar bem mais do
  // que os 1200ms fixos abaixo, fazendo esta função desistir cedo demais
  // (sem sessão ainda) e nunca mais tentar. Por isso corre tanto no timer
  // fixo (cobre o caso rápido) como no evento 'zelo-gate-ready' que essa
  // página já dispara mal a sessão fica confirmada (cobre o caso lento); a
  // flag abaixo impede que as duas tentativas falem por cima uma da outra.
  // Aberturas do aviso de dias em falta (parte fixa: "Em {serviço}, este mês:
  // {lista de dias}." nunca varia — é a informação em si, tem de chegar
  // sempre igual e sem ambiguidade).
  var ABERTURAS_AVISO_FALTA = [
    'Olá, NOME. Lema do Zelo: dados de qualidade geram decisão de qualidade.',
    'Olá, NOME. Aviso do Zelo — ainda há dias por preencher.',
    'Olá, NOME. Antes de continuares, uma nota sobre o preenchimento.',
    'Olá, NOME. Reparei que ainda faltam alguns dias este mês.'
  ];
  // Aberturas dos parabéns quando está tudo em dia (a parte "Em {serviço},
  // está tudo preenchido até ontem." também não varia, pelo mesmo motivo).
  var ABERTURAS_PARABENS_EM_DIA = [
    'Parabéns, NOME, pela dedicação em enviar os ITENS a tempo e horas.',
    'Muito bem, NOME! Continuas em dia com os ITENS.',
    'Boa, NOME — os ITENS estão todos a tempo este mês.',
    'NOME, os teus ITENS continuam impecáveis este mês. Parabéns pela dedicação.'
  ];
  // Aberturas para quando só falta o dia de ontem — caso especial: em vez do
  // aviso de "dias em falta", reconhece o comprometimento (é normal ainda
  // não ter dado tempo de preencher o dia anterior logo ao entrar).
  var ABERTURAS_QUASE_EM_DIA = [
    'Parabéns, NOME, pelo comprometimento — só falta o registo de ontem.',
    'Muito bem, NOME! Está quase tudo em dia, falta só preencher ontem.',
    'Boa, NOME — nota-se o comprometimento, só falta o dia de ontem.'
  ];
  // Fecho ("lembrete") de todas as mensagens de preenchimento — a extensão e
  // o serviço de contacto mantêm-se sempre iguais em cada variante.
  var LEMBRETES_FECHO_PREENCHIMENTO = [
    ' Lembre-se: os dados contam a história do hospital, e você também é responsável por transformar essa história em conhecimento para a tomada de decisão. Qualquer dúvida, ligue para a extensão 1403, Serviço de Estatística.',
    ' Um lembrete: cada registo é um pedaço da história do hospital — e essa história ajuda a decidir melhor. Dúvidas, ligue para a extensão 1403, Serviço de Estatística.',
    ' Vale sempre lembrar: dados bem guardados hoje tornam-se boas decisões amanhã. Qualquer dúvida, é só ligar para a extensão 1403, Serviço de Estatística.'
  ];
  var avisoPreenchimentoEmCurso = false;
  // Um dia só conta como preenchido se tiver dados a sério: um nó que só tem
  // o histórico de alterações, marcas de eliminação ou um formulário todo a
  // zeros (ex.: gravado automaticamente para as outras especialidades) NÃO
  // é um dia preenchido. Assim o Zelo nunca diz que um dia está feito quando
  // não está.
  var CHAVES_META = /^(savedAt|criadoPor|atualizadoPor|autor|autorNome|autorEmail|historico|tombstones|_?ts|updatedAt|uid|email|data|date|dia|mes|ano|id|versao|dispositivo|origem|slug|servico|turno|_nivel)$/i;
  var CHAVES_TEXTO_UTIL = /obs|nota|diagn|nome|paciente|descr|procedimento|exame|ocorr|motivo|causa/i;
  function _temConteudo(v, chave, prof){
    prof = prof || 0;
    if (v == null || prof > 12) return false;
    if (typeof v === 'number') return v > 0;
    if (typeof v === 'boolean') return false;
    if (typeof v === 'string') {
      var t = v.trim();
      if (!t) return false;
      if (/^-?\d+([.,]\d+)?$/.test(t)) return parseFloat(t.replace(',', '.')) > 0;
      if (t.charAt(0) === '{' || t.charAt(0) === '[') { try { return _temConteudo(JSON.parse(t), chave, prof + 1); } catch (e) {} }
      return CHAVES_TEXTO_UTIL.test(chave || '');
    }
    if (typeof v === 'object') {
      if (v.apagado === true || v.deleted === true || v._apagado === true) return false;
      return Object.keys(v).some(function (k) { return !CHAVES_META.test(k) && _temConteudo(v[k], k, prof + 1); });
    }
    return false;
  }
  // Dias (AAAA-MM-DD) com dados a sério, a partir do nó do Firebase.
  function _diasPreenchidos(cfg, mes, prefixoMes){
    var dias = {};
    if (!mes || typeof mes !== 'object') return dias;
    if (cfg.movimento) {
      // { savedAt, snapshot: { 'AAAA-MM': { campo: [valor do dia 1, dia 2, …] } } }
      var anoMes = prefixoMes.slice(0, 7);
      var m = (mes.snapshot || mes)[anoMes];
      if (!m || typeof m !== 'object') return dias;
      Object.keys(m).forEach(function (campo) {
        var arr = m[campo];
        if (!arr || typeof arr !== 'object') return;
        Object.keys(arr).forEach(function (i) {
          var v = arr[i];
          if (v !== null && v !== undefined && v !== '' && /^\d+$/.test(i)) dias[anoMes + '-' + String(Number(i) + 1).padStart(2, '0')] = true;
        });
      });
      return dias;
    }
    if (cfg.porRegistos) {
      Object.keys(mes).forEach(function (k) {
        var r = mes[k];
        if (!r || r.apagado) return;
        var reg = r;
        if (typeof r.json === 'string') { try { reg = JSON.parse(r.json); } catch (e) { return; } }
        var d = String(reg.data || '').slice(0, 10);
        if (d.indexOf(prefixoMes) === 0) dias[d] = true;
      });
      return dias;
    }
    Object.keys(mes).forEach(function (k) {
      if (k.indexOf(prefixoMes) === 0 && _temConteudo(mes[k], k)) dias[k.slice(0, 10)] = true;
    });
    return dias;
  }
  // Junta uma lista de itens em texto natural: "A", "A e B", "A, B e C" —
  // usado para não terminar frases com uma vírgula a mais antes do último.
  function _juntarComE(itens){
    if (itens.length === 0) return '';
    if (itens.length === 1) return itens[0];
    if (itens.length === 2) return itens[0] + ' e ' + itens[1];
    return itens.slice(0, -1).join(', ') + ' e ' + itens[itens.length - 1];
  }
  // Comprime uma lista de dias em falta (ex.: ['1','2','3','5','7','8','9'])
  // em intervalos por extenso ("os dias 1 até 3, o dia 5, os dias 7 até 9"),
  // em vez de dizer dia a dia — insuportável de ouvir quando faltam muitos
  // dias seguidos. `dias` já vem em ordem crescente (o loop que a monta
  // percorre de 1 até ontem).
  function _formatarDiasEmFalta(dias){
    var grupos = [];
    var inicio = null, anterior = null;
    dias.forEach(function (dStr) {
      var d = parseInt(dStr, 10);
      if (inicio === null) { inicio = d; anterior = d; return; }
      if (d === anterior + 1) { anterior = d; return; }
      grupos.push([inicio, anterior]);
      inicio = d; anterior = d;
    });
    if (inicio !== null) grupos.push([inicio, anterior]);
    var frases = grupos.map(function (g) {
      if (g[0] === g[1]) return 'o dia ' + g[0];
      if (g[1] === g[0] + 1) return 'os dias ' + g[0] + ' e ' + g[1];
      return 'os dias ' + g[0] + ' até ' + g[1];
    });
    return _juntarComE(frases);
  }
  function _diasNoMes(anoStr, mesStr){
    return new Date(Number(anoStr), Number(mesStr), 0).getDate();
  }
  // Fecho fixo de sexta-feira — substitui o pick aleatório de
  // LEMBRETES_FECHO_PREENCHIMENTO nesse dia específico: sem variedade aqui
  // de propósito, é um pedido concreto e igual todas as semanas.
  var LEMBRETE_SEXTA_FEIRA = ' Hoje é sexta-feira: tenha como meta do dia lançar ou entregar as folhas de procedimentos do serviço na Estatística — todos os pendentes desta semana, caso não tenha feito, por favor.';
  function tentarAvisarPreenchimento(){
    var cfg = configAvisoPreenchimento();
    if (!cfg) return;
    var nome = _doisNomes(sessionStorage.getItem('zeloNome') || '');
    if (!nome) return;
    var agora = dataHoraAngola();
    var partes = agora.data.split('-');
    var diaHoje = parseInt(partes[2], 10);
    if (diaHoje <= 1) return; // dia 1 do mês — ainda não há "até ontem" para avaliar
    if (avisoPreenchimentoEmCurso) return;
    avisoPreenchimentoEmCurso = true;
    var chaveOkHoje = 'zeloAvisoPreenchimentoOK_' + cfg.chaveAviso;
    obterFirebaseLeitura().then(function (ler) {
      return ler(cfg.fbPathBase);
    }).then(function (mes) {
      mes = mes || {};
      // Cruza com o que está guardado LOCALMENTE neste aparelho (quando a
      // página expõe isso) antes de considerar um dia em falta — só ler o
      // Firebase dava falsos avisos quando o dia foi gravado offline e a
      // sincronização (zeloQueueWrite) ainda não chegou lá, mesmo já
      // estando guardado. Um dia só conta como em falta se NÃO estiver nem
      // no Firebase nem localmente.
      var diasLocais = (typeof window.zeloDiasComRegistoLocal === 'function') ? (window.zeloDiasComRegistoLocal() || []) : [];
      var prefixoMes = partes[0] + '-' + partes[1] + '-';
      var feitos = _diasPreenchidos(cfg, mes, prefixoMes);
      // Escritas ainda em fila neste aparelho (sem internet) também contam.
      var fila = typeof window.zeloPendingItems === 'function' ? window.zeloPendingItems(cfg.fbPathBase + '/') : Promise.resolve([]);
      return Promise.resolve(fila).catch(function () { return []; }).then(function (pend) {
        (pend || []).forEach(function (it) {
          var resto = String(it.path).slice(cfg.fbPathBase.length + 1);
          if (cfg.movimento) {
            if (!resto) Object.assign(feitos, _diasPreenchidos(cfg, it.data, prefixoMes));
          } else if (cfg.porRegistos) {
            var o = {}; o[resto] = it.data;
            Object.assign(feitos, _diasPreenchidos(cfg, o, prefixoMes));
          } else {
            var dia = resto.slice(0, 10);
            if (dia.indexOf(prefixoMes) === 0 && resto.indexOf('/historico') === -1 && _temConteudo(it.data, dia)) feitos[dia] = true;
          }
        });
        return { feitos: feitos, diasLocais: diasLocais };
      });
    }).then(function (res) {
      if (!res) return;
      var feitos = res.feitos, diasLocais = res.diasLocais;
      var diasFalta = [];
      for (var d = 1; d < diaHoje; d++) {
        var chave = partes[0] + '-' + partes[1] + '-' + String(d).padStart(2, '0');
        if (!feitos[chave] && diasLocais.indexOf(chave) === -1) diasFalta.push(String(d));
      }
      var texto;
      var soFaltaOntem = diasFalta.length === 1 && diasFalta[0] === String(diaHoje - 1);
      var saud = saudacaoPorHora(agora.hora);
      if (diasFalta.length) {
        // Só volta a falar dos dias em falta uma vez por sessão (e de novo se
        // o mês mudar dentro da mesma sessão).
        var chaveFaltaSessao = 'zeloAvisoPreenchimentoFaltaSessao_' + cfg.chaveAviso + '_' + partes[0] + '-' + partes[1];
        if (sessionStorage.getItem(chaveFaltaSessao)) return;
        sessionStorage.setItem(chaveFaltaSessao, '1');
        if (soFaltaOntem) {
          texto = saud + ', ' + nome + '. Em ' + cfg.servicoLabel + ', falta apenas o registo de ontem. Aproveite para o preencher hoje, por favor.';
        } else {
          texto = saud + ', ' + nome + '. O seu serviço tem dados em falta por preencher de turnos passados. Em ' + cfg.servicoLabel +
            ', ainda não têm registo ' + _formatarDiasEmFalta(diasFalta) + '. Por favor, preencha assim que puder.';
        }
      } else {
        if (localStorage.getItem(chaveOkHoje) === agora.data) return;
        localStorage.setItem(chaveOkHoje, agora.data);
        texto = _escolher(ABERTURAS_PARABENS_EM_DIA).replace('NOME', nome).replace('ITENS', cfg.itemPlural) +
          ' Em ' + cfg.servicoLabel + ', está tudo preenchido até ontem.';
      }
      if (diasFalta.length) {
        texto += ' Qualquer dúvida, ligue para a extensão 1403, do Serviço de Estatística.';
      }
      // Sem acesso à página (ecrã de bloqueio visível): nem voz nem mensagem.
      if (window.__zeloAcessoBloqueado) return;
      if (window.ZELO_MODULE) {
        var eu = estadoUtilizador();
        if (!temAcessoModulo(eu.role, eu.permissoes, window.ZELO_MODULE, window.ZELO_ITEM || null)) return;
      }
      falar(texto);
      // No ecrã: só o nome e uma frase curta em letras grandes.
      if (window.ZeloEspera && window.ZeloEspera.mensagem) {
        window.ZeloEspera.mensagem({
          icone: diasFalta.length ? 'calendario' : 'ok',
          nome: 'Olá, ' + nome,
          grande: true,
          titulo: diasFalta.length
            ? (soFaltaOntem ? 'Falta apenas o registo de ontem por preencher.' : 'O seu serviço tem dados em falta por preencher de turnos passados.')
            : 'O seu serviço está com tudo em dia. Obrigado pela dedicação!',
          botoes: [{ texto: 'Entendido', principal: true }]
        });
      }
    }).catch(function () {}).then(function () { avisoPreenchimentoEmCurso = false; });
    // ^ reposto no fim (sucesso ou falha): sem isto, se a leitura ao
    // Firebase falhar/demorar na primeira tentativa (setTimeout de
    // 1200ms), a flag ficava presa em "true" para sempre nesta página, e a
    // segunda tentativa — disparada pelo evento 'zelo-gate-ready', pensada
    // justamente para cobrir ligações lentas — nunca chegava a correr,
    // fazendo o aviso de dias em falta simplesmente nunca soar.
  }

  // ── UI ──
  function injetarEstilos(){
    var style = document.createElement('style');
    style.id = 'zelo-assistente-style';
    style.textContent = `
      #zas-btn{position:fixed;right:16px;bottom:16px;z-index:2147483000;width:52px;height:52px;
        display:flex;align-items:center;justify-content:center;border-radius:50%;
        background:linear-gradient(135deg,#1A56DB,#0D1B3E);color:#fff;border:2px solid rgba(255,255,255,.18);cursor:pointer;
        box-shadow:0 8px 24px rgba(13,27,62,.42);transition:transform .15s,box-shadow .15s;}
      #zas-btn:hover{transform:translateY(-1px) scale(1.04);box-shadow:0 12px 30px rgba(13,27,62,.5);}
      #zas-btn:active{transform:scale(.94);}
      #zas-overlay{position:fixed;inset:0;background:rgba(8,14,32,.4);z-index:2147483003;opacity:0;pointer-events:none;transition:opacity .18s ease;}
      #zas-overlay.open{opacity:1;pointer-events:auto;}
      #zas-panel{position:fixed;right:16px;bottom:80px;width:340px;max-width:90vw;height:480px;max-height:76vh;
        background:#fff;z-index:2147483004;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.3);
        display:flex;flex-direction:column;overflow:hidden;font-family:'Inter',Arial,sans-serif;
        opacity:0;transform:translateY(10px) scale(.98);pointer-events:none;transition:opacity .16s ease,transform .16s ease;}
      #zas-panel.open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto;}
      .zas-head{display:flex;align-items:center;gap:10px;padding:14px;background:linear-gradient(135deg,#1A56DB,#0D1B3E);color:#fff;flex-shrink:0;}
      .zas-head .zas-title{font-weight:800;font-size:.86rem;flex:1;}
      .zas-head .zas-sub{font-size:.62rem;opacity:.8;font-weight:600;}
      .zas-icon-btn{width:26px;height:26px;border-radius:8px;background:rgba(255,255,255,.14);border:none;color:#fff;
        display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;}
      .zas-icon-btn:hover{background:rgba(255,255,255,.24);}
      .zas-icon-btn.muted{opacity:.5;}
      .zas-idioma-btn{font-size:.6rem;font-weight:800;letter-spacing:.02em;}
      #zas-voz-config{display:none;padding:8px 12px;background:#F1F5F9;border-bottom:1px solid #E2E8F0;flex-shrink:0;}
      #zas-voz-config.open{display:block;}
      #zas-voz-config label{font-size:.62rem;font-weight:700;color:#475569;display:block;margin-bottom:4px;}
      #zas-voz-select{width:100%;font-size:.72rem;padding:6px 8px;border-radius:8px;border:1px solid #CBD5E1;background:#fff;color:#0F172A;font-family:inherit;}
      #zas-log{flex:1;min-height:0;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;background:#F8FAFC;}
      .zas-msg{max-width:86%;padding:8px 11px;border-radius:11px;font-size:.78rem;line-height:1.4;white-space:pre-line;}
      .zas-msg.bot{background:#fff;border:1px solid #E2E8F0;color:#0F172A;align-self:flex-start;border-bottom-left-radius:3px;}
      .zas-msg.user{background:#1A56DB;color:#fff;align-self:flex-end;border-bottom-right-radius:3px;}
      .zas-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 12px 10px;flex-shrink:0;}
      .zas-chip{font-size:.66rem;font-weight:700;color:#1A56DB;background:#EFF6FF;border:1px solid #DBEAFE;border-radius:100px;
        padding:5px 10px;cursor:pointer;}
      .zas-chip:hover{background:#DBEAFE;}
      .zas-aviso-voz{display:flex;align-items:flex-start;gap:6px;margin:0 10px 8px;padding:7px 9px;border-radius:9px;
        background:#FFFBEB;border:1px solid #FDE68A;color:#92400E;font-size:.62rem;line-height:1.35;flex-shrink:0;}
      .zas-aviso-voz svg{flex-shrink:0;margin-top:1px;}
      .zas-input-row{display:flex;gap:6px;padding:10px;border-top:1px solid #E2E8F0;flex-shrink:0;background:#fff;}
      #zas-input{flex:1;min-width:0;border:1px solid #E2E8F0;border-radius:100px;padding:8px 13px;font-size:.78rem;font-family:inherit;outline:none;}
      #zas-input:focus{border-color:#93C5FD;}
      .zas-round-btn{width:34px;height:34px;border-radius:50%;border:none;flex-shrink:0;display:flex;align-items:center;justify-content:center;cursor:pointer;}
      #zas-mic{background:#F4F7FF;color:#1A56DB;}
      #zas-mic:hover{background:#EFF6FF;}
      #zas-mic.on{background:#DC2626;color:#fff;animation:zas-pulse 1.2s infinite;}
      #zas-send{background:#1A56DB;color:#fff;}
      #zas-send:hover{background:#164BC0;}
      @keyframes zas-pulse{0%{box-shadow:0 0 0 0 rgba(220,38,38,.5);}70%{box-shadow:0 0 0 8px rgba(220,38,38,0);}100%{box-shadow:0 0 0 0 rgba(220,38,38,0);}}
      @media(max-width:480px){#zas-panel{right:8px;left:8px;width:auto;bottom:74px;}#zas-btn{right:12px;bottom:12px;}}
      html[data-zelo-theme="dark"] #zas-panel{background:#111A2E;}
      html[data-zelo-theme="dark"] #zas-log{background:#0B1220;}
      html[data-zelo-theme="dark"] .zas-msg.bot{background:#111A2E;border-color:#1E293B;color:#F1F5F9;}
      html[data-zelo-theme="dark"] .zas-input-row{background:#111A2E;border-color:#1E293B;}
      html[data-zelo-theme="dark"] #zas-input{background:#0B1220;border-color:#1E293B;color:#F1F5F9;}
      html[data-zelo-theme="dark"] #zas-mic{background:#1E293B;color:#67E8F9;}
      html[data-zelo-theme="dark"] .zas-aviso-voz{background:#2A1F0A;border-color:#78350F;color:#FCD34D;}
      html[data-zelo-theme="dark"] #zas-voz-config{background:#0B1220;border-color:#1E293B;}
      html[data-zelo-theme="dark"] #zas-voz-config label{color:#94A3B8;}
      html[data-zelo-theme="dark"] #zas-voz-select{background:#111A2E;border-color:#1E293B;color:#F1F5F9;}
    `;
    document.head.appendChild(style);
  }

  var ICON_MIC = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4M8 22h8"/></svg>';
  var ICON_SEND = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>';
  var ICON_CLOSE = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  var ICON_SPEAKER_ON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>';
  var ICON_SPEAKER_OFF = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M23 9l-6 6M17 9l6 6"/></svg>';
  var ICON_GEAR = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';

  function montarPainel(){
    var btn = document.createElement('button');
    btn.id = 'zas-btn'; btn.type = 'button'; btn.title = 'Falar com o Zelo'; btn.setAttribute('aria-label', 'Abrir assistente Zelo');
    btn.innerHTML = ICON_MIC;

    var overlay = document.createElement('div'); overlay.id = 'zas-overlay';
    var panel = document.createElement('div'); panel.id = 'zas-panel';
    var vozLigada = (localStorage.getItem('zeloVoz') || 'on') !== 'off';
    var idiomaInicial = idiomaVoz();
    panel.innerHTML =
      '<div class="zas-head">' +
        '<div><div class="zas-title">Zelo</div><div class="zas-sub">Assistente local · grátis</div></div>' +
        '<button type="button" class="zas-icon-btn zas-idioma-btn" id="zas-idioma-toggle" title="Idioma da voz — clique para alternar entre Português de Portugal e do Brasil">' + (idiomaInicial === 'pt-BR' ? 'BR' : 'PT') + '</button>' +
        '<button type="button" class="zas-icon-btn' + (vozLigada ? '' : ' muted') + '" id="zas-voz-toggle" title="Ligar/desligar voz do Zelo">' + (vozLigada ? ICON_SPEAKER_ON : ICON_SPEAKER_OFF) + '</button>' +
        '<button type="button" class="zas-icon-btn" id="zas-voz-config-toggle" title="Escolher a voz exacta deste aparelho">' + ICON_GEAR + '</button>' +
        '<button type="button" class="zas-icon-btn" id="zas-close" title="Fechar">' + ICON_CLOSE + '</button>' +
      '</div>' +
      '<div id="zas-voz-config">' +
        '<label for="zas-voz-select">Voz do Zelo neste aparelho</label>' +
        '<select id="zas-voz-select"><option value="">A carregar vozes…</option></select>' +
      '</div>' +
      '<div id="zas-log"></div>' +
      '<div class="zas-chips">' +
        '<button type="button" class="zas-chip" data-msg="ajuda">Ajuda</button>' +
        '<button type="button" class="zas-chip" data-msg="abrir bloco operatório">Abrir Bloco Operatório</button>' +
        '<button type="button" class="zas-chip" data-msg="onde encontro a farmácia">Onde fica a Farmácia?</button>' +
      '</div>' +
      (vozDisponivel ? '<div class="zas-aviso-voz"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/></svg><span>Ao usar o microfone, o áudio é processado pelo reconhecimento de voz do navegador (fora deste dispositivo) para virar texto. Sem microfone, escrevendo, tudo fica só neste computador.</span></div>' : '') +
      '<div class="zas-input-row">' +
        (vozDisponivel ? '<button type="button" class="zas-round-btn" id="zas-mic" title="Falar (o áudio passa pelo reconhecimento de voz do navegador)">' + ICON_MIC + '</button>' : '') +
        '<input type="text" id="zas-input" placeholder="Escreva um comando…" autocomplete="off">' +
        '<button type="button" class="zas-round-btn" id="zas-send" title="Enviar">' + ICON_SEND + '</button>' +
      '</div>';

    document.body.appendChild(overlay);
    document.body.appendChild(panel);
    document.body.appendChild(btn);

    var log = panel.querySelector('#zas-log');
    var input = panel.querySelector('#zas-input');
    var jaCumprimentou = false;

    function adicionarMsg(texto, quem){
      var div = document.createElement('div');
      div.className = 'zas-msg ' + quem;
      div.textContent = texto;
      log.appendChild(div);
      log.scrollTop = log.scrollHeight;
      return div;
    }

    // Fila simples: se um segundo comando chegar (voz ou texto) enquanto uma
    // consulta assíncrona ao Firebase ainda está a decorrer, fica à espera
    // em vez de correr ao mesmo tempo — evita duas respostas a chegarem fora
    // de ordem ou a falarem por cima uma da outra.
    var filaEnviar = [];
    var aProcessar = false;
    function processarFila(){
      if (aProcessar || !filaEnviar.length) return;
      aProcessar = true;
      var texto = filaEnviar.shift();
      var r = processar(texto);
      function concluir(){ aProcessar = false; processarFila(); }
      if (r && typeof r.then === 'function') {
        var espera = adicionarMsg('A consultar dados…', 'bot');
        r.then(function (resultado) {
          espera.textContent = resultado.texto;
          log.scrollTop = log.scrollHeight;
          falar(resultado.texto);
          if (resultado.navegarPara) setTimeout(function () { window.location.href = resultado.navegarPara; }, 700);
          concluir();
        });
        return;
      }
      adicionarMsg(r.texto, 'bot');
      falar(r.texto);
      if (r.navegarPara) setTimeout(function () { window.location.href = r.navegarPara; }, 700);
      concluir();
    }

    function enviar(texto){
      texto = String(texto || '').trim();
      if (!texto) return;
      adicionarMsg(texto, 'user');
      input.value = '';
      filaEnviar.push(texto);
      processarFila();
    }

    function abrir(){
      overlay.classList.add('open');
      panel.classList.add('open');
      if (!jaCumprimentou) { jaCumprimentou = true; var r = respostaSaudacao(); adicionarMsg(r, 'bot'); falar(r); }
      input.focus();
    }
    // Exposto para outros pontos de entrada (ex.: item "Assistente Zelo" no
    // menu flutuante — zelo_menu_flutuante.js) poderem abrir o mesmo painel
    // sem duplicar o botão flutuante.
    window.zeloAbrirAssistente = abrir;
    function fechar(){
      overlay.classList.remove('open');
      panel.classList.remove('open');
      if (ouvindo && recognition) recognition.stop();
    }

    btn.addEventListener('click', function () {
      var aberto = panel.classList.contains('open');
      if (aberto) fechar(); else abrir();
    });
    overlay.addEventListener('click', fechar);
    panel.querySelector('#zas-close').addEventListener('click', fechar);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('open')) fechar(); });

    panel.querySelector('#zas-send').addEventListener('click', function () { enviar(input.value); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') enviar(input.value); });
    panel.querySelectorAll('.zas-chip').forEach(function (chip) {
      chip.addEventListener('click', function () { enviar(chip.getAttribute('data-msg')); });
    });

    panel.querySelector('#zas-voz-toggle').addEventListener('click', function () {
      var ligar = (localStorage.getItem('zeloVoz') || 'on') === 'off';
      localStorage.setItem('zeloVoz', ligar ? 'on' : 'off');
      this.classList.toggle('muted', !ligar);
      this.innerHTML = ligar ? ICON_SPEAKER_ON : ICON_SPEAKER_OFF;
      if (!ligar && window.speechSynthesis) window.speechSynthesis.cancel();
    });
    panel.querySelector('#zas-idioma-toggle').addEventListener('click', function () {
      var novo = idiomaVoz() === 'pt-PT' ? 'pt-BR' : 'pt-PT';
      localStorage.setItem('zeloVozIdioma', novo);
      this.textContent = novo === 'pt-BR' ? 'BR' : 'PT';
      if (recognition) recognition.lang = novo;
    });

    // Seletor manual de voz: a detecção automática (ehVozMasculina) não
    // reconhece o nome da voz em todos os aparelhos — isto dá uma garantia
    // sempre certa, escolhendo de entre as vozes portuguesas que o próprio
    // aparelho tem disponíveis.
    var vozConfigPainel = panel.querySelector('#zas-voz-config');
    var vozSelect = panel.querySelector('#zas-voz-select');
    function preencherSeletorVoz(){
      if (!window.speechSynthesis) return;
      var vozes = window.speechSynthesis.getVoices().filter(function (v) { return /pt/i.test(v.lang); });
      if (!vozes.length) return; // ainda não carregaram — o listener de voiceschanged tenta de novo
      var escolhidaAtual = localStorage.getItem('zeloVozEscolhidaNome') || '';
      vozSelect.innerHTML = '<option value="">Automática (tenta escolher uma voz masculina)</option>' +
        vozes.map(function (v) {
          return '<option value="' + v.name.replace(/"/g, '&quot;') + '"' + (v.name === escolhidaAtual ? ' selected' : '') + '>' + v.name + ' (' + v.lang + ')</option>';
        }).join('');
    }
    preencherSeletorVoz();
    if (window.speechSynthesis) window.speechSynthesis.addEventListener('voiceschanged', preencherSeletorVoz);
    panel.querySelector('#zas-voz-config-toggle').addEventListener('click', function () {
      vozConfigPainel.classList.toggle('open');
      if (vozConfigPainel.classList.contains('open')) preencherSeletorVoz();
    });
    vozSelect.addEventListener('change', function () {
      if (vozSelect.value) localStorage.setItem('zeloVozEscolhidaNome', vozSelect.value);
      else localStorage.removeItem('zeloVozEscolhidaNome');
      falar('Voz escolhida.');
    });

    if (vozDisponivel) {
      recognition = new SpeechRecognitionCtor();
      recognition.lang = idiomaVoz();
      recognition.continuous = false;
      recognition.interimResults = false;
      var micBtn = panel.querySelector('#zas-mic');
      recognition.onresult = function (e) {
        var texto = e.results[0][0].transcript;
        input.value = texto;
        enviar(texto);
      };
      recognition.onerror = function () { ouvindo = false; micBtn.classList.remove('on'); };
      recognition.onend = function () { ouvindo = false; micBtn.classList.remove('on'); };
      micBtn.addEventListener('click', function () {
        if (ouvindo) { recognition.stop(); return; }
        try { recognition.start(); ouvindo = true; micBtn.classList.add('on'); } catch (e) {}
      });
    }
  }

  function iniciar(){
    injetarEstilos();
    montarPainel();
    // Pequeno atraso: dá tempo à página para assentar e às vozes do
    // navegador (speechSynthesis.getVoices()) para carregarem.
    setTimeout(tentarSaudarEntrada, 1200);
    setTimeout(tentarAvisarPreenchimento, 1200);
    // Última atividade (para a saudação de regresso saber quanto tempo a
    // pessoa esteve fora). Só começa depois da saudação ter lido o valor.
    setTimeout(function () { _registarAtividade(); setInterval(_registarAtividade, 60000); }, 5000);
    window.addEventListener('pagehide', _registarAtividade);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') _registarAtividade(); });
    // Ver nota acima de tentarAvisarPreenchimento: cobre o caso de a sessão
    // só ficar confirmada depois dos 1200ms fixos.
    window.addEventListener('zelo-gate-ready', function () {
      tentarAvisarPreenchimento();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
