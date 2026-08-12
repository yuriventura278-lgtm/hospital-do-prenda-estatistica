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
    chefe_servico:    { estatistica:'leitura', servicos:true, procedimentos_enfermagem:true, movimento_mensal:'leitura', sistemas_independentes:false },
    enfermeiro_chefe: { estatistica:'leitura', servicos:true, procedimentos_enfermagem:true, movimento_mensal:false, sistemas_independentes:false },
    medico:           { estatistica:false, servicos:true, procedimentos_enfermagem:'leitura', movimento_mensal:false, sistemas_independentes:false },
    enfermeiro:       { estatistica:false, servicos:true, procedimentos_enfermagem:true, movimento_mensal:false, sistemas_independentes:false },
    tdt:              { estatistica:false, servicos:true, procedimentos_enfermagem:false, movimento_mensal:false, sistemas_independentes:false },
    secretario:       { estatistica:false, servicos:'leitura', procedimentos_enfermagem:false, movimento_mensal:true, sistemas_independentes:false },
    tecnico_farmacia: { estatistica:false, servicos:true, procedimentos_enfermagem:false, movimento_mensal:false, sistemas_independentes:false },
    psicologo:        { estatistica:false, servicos:true, procedimentos_enfermagem:false, movimento_mensal:false, sistemas_independentes:false },
    funcionario:      { estatistica:true, servicos:true, procedimentos_enfermagem:true, movimento_mensal:true, sistemas_independentes:false },
  };
  function temAcessoModulo(role, permissoes, mod, itemSlug){
    if (role === 'admin') return true;
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
      nome: (sessionStorage.getItem('zeloNome') || '').split(' ')[0] || '',
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
    'hemoterapia': 'Hemoterapia', 'banco de sangue': 'Hemoterapia',
    'fisioterapia': 'Fisioterapia', 'fisio': 'Fisioterapia',
    'psicologia': 'Psicologia Clínica', 'psicologia clinica': 'Psicologia Clínica',
    'farmacia': 'Farmácia',
    'medicina homem': 'Medicina Homem', 'medicina mulher': 'Medicina Mulher',
    'medicina interna': ['Medicina Homem', 'Medicina Mulher'], 'medicina': ['Medicina Homem', 'Medicina Mulher'],
    'supervisao do hospital': 'Supervisão do Hospital',
    'supervisao serviclean': 'Supervisão Serviclean', 'serviclean': 'Supervisão Serviclean',
    'supervisao de maqueiros': 'Supervisão de Maqueiros', 'maqueiros': 'Supervisão de Maqueiros',
    'procedimentos de enfermagem geral': 'Procedimentos de Enfermagem · Geral',
    'controlo de faltas': 'Controlo de Faltas · GEPE/DEMA', 'gepe dema': 'Controlo de Faltas · GEPE/DEMA',
    'dias cama': 'Dias-Cama & Dias-Doente', 'dias doente': 'Dias-Cama & Dias-Doente',
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

  // Devolve: { encontrados: [...], ambiguo: bool } a partir do texto normalizado.
  function localizarServicos(textoNorm){
    var nomesEncontrados = [];
    for (var k = 0; k < APELIDOS_CHAVES.length; k++) {
      var chave = APELIDOS_CHAVES[k];
      if (palavraInteira(textoNorm, chave)) {
        var alvo = APELIDOS[chave];
        var nomes = Array.isArray(alvo) ? alvo : [alvo];
        nomes.forEach(function (n) { if (nomesEncontrados.indexOf(n) === -1) nomesEncontrados.push(n); });
        break; // apelido mais longo/específico já encontrado — não continuar a testar mais curtos
      }
    }
    if (!nomesEncontrados.length) {
      // rede de segurança: nome oficial completo mencionado por extenso
      (window.SERVICOS_MENU || []).forEach(function (svc) {
        if (palavraInteira(textoNorm, normalizar(svc.nome)) && nomesEncontrados.indexOf(svc.nome) === -1) nomesEncontrados.push(svc.nome);
      });
      (window.SISTEMAS_LOCAIS_MENU || []).forEach(function (s) {
        if (palavraInteira(textoNorm, normalizar(s.nome)) && nomesEncontrados.indexOf(s.nome) === -1) nomesEncontrados.push(s.nome);
      });
    }
    return nomesEncontrados.map(encontrarServicoPorNome).filter(Boolean);
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
      lista.push({ label: m.label, file: 'movimento_mensal.html?servico=' + m.slug, acessivel: temAcessoModulo(role, permissoes, m.modulo), chave: 'movimento' });
    });
    if (svc.temEstatisticas && svc.estatisticasFile) {
      var rel0 = (svc.relatorios || [])[0];
      lista.push({ label: 'Estatísticas', file: svc.estatisticasFile + '?abrir=estatisticas', acessivel: !rel0 || temAcessoModulo(role, permissoes, rel0.modulo, rel0.item), chave: 'estatisticas' });
    }
    return lista;
  }

  function escolherAcao(lista, tipoPedido){
    var acessiveis = lista.filter(function (a) { return a.acessivel; });
    if (!acessiveis.length) return null;
    if (tipoPedido) {
      var m = acessiveis.find(function (a) {
        if (tipoPedido === 'estatisticas') return a.chave === 'estatisticas';
        if (tipoPedido === 'movimento') return a.chave === 'movimento';
        if (tipoPedido === 'procedimentos') return a.chave === 'procedimentos';
        if (tipoPedido === 'registo_diario') return a.chave === 'registo diario';
        if (tipoPedido === 'processo_operatorio') return a.chave === 'processo operatorio';
        return false;
      });
      if (m) return m;
    }
    return acessiveis[0];
  }

  function categoriaDoServico(svc){
    var cats = window.CATEGORIAS_SERVICOS || [];
    var c = cats.find(function (c) { return c.id === svc.categoria; });
    return c ? c.label : 'Outros';
  }

  // ── Motor de intenções ──
  var pendente = null; // { tipo:'confirmar_abrir', file, label }
  var ultimoServico = null; // memória de curto prazo: último serviço mencionado, para "e as estatísticas disso?"

  function respostaSaudacao(){
    var u = estadoUtilizador();
    var ola = u.nome ? ('Olá, ' + u.nome + '! ') : 'Olá! ';
    return ola + 'Sou o Zelo. Posso ajudar a navegar pelo sistema — por exemplo, diga "abrir bloco operatório" ou "onde encontro a farmácia". Diga "ajuda" para ver mais.';
  }
  function respostaAjuda(){
    return 'Isto é o que sei fazer, sem precisar de ligação a servidores nem custos:\n' +
      '• Abrir um serviço: "abrir ortopedia", "ir para a farmácia"\n' +
      '• Indicar onde fica algo: "onde encontro o laboratório"\n' +
      '• Abrir uma acção específica: "abrir procedimentos de enfermagem do bloco operatório", "estatísticas de imagiologia"\n' +
      'Ainda não consigo responder a perguntas livres sobre números/estatísticas nem preencher formulários por voz — para isso é preciso abrir a página certa, que eu indico.';
  }
  function respostaIdentidade(){
    return 'Sou o Zelo, o assistente do sistema do Hospital do Prenda. Funciono inteiramente no seu navegador — não envio nada para fora, não tenho custos, e só reconheço comandos e perguntas de estrutura, não conversa livre.';
  }

  function processar(textoOriginal){
    var textoNorm = normalizar(textoOriginal);
    if (!textoNorm) return { texto: 'Não ouvi nada. Pode repetir?' };

    // Confirmação pendente
    if (pendente) {
      if (/(^| )(sim|pode|abre|abrir|confirmo|ok|vai)( |$)/.test(textoNorm)) {
        var p = pendente; pendente = null;
        return { texto: 'A abrir ' + p.label + '…', navegarPara: p.file };
      }
      if (/(^| )(nao|cancela|cancelar|deixa|esquece)( |$)/.test(textoNorm)) {
        pendente = null;
        return { texto: 'Ok, não abro.' };
      }
      pendente = null; // qualquer outra coisa cancela a pergunta pendente e segue o fluxo normal
    }

    if (/(^| )(ola|ol[a]|oi|bom dia|boa tarde|boa noite|ei zelo|zelo)( |$)/.test(textoNorm) && textoNorm.length < 20) {
      return { texto: respostaSaudacao() };
    }
    if (/(ajuda|o que sabes fazer|que comandos|como funcionas|o que consegues fazer)/.test(textoNorm)) {
      return { texto: respostaAjuda() };
    }
    if (/(quem es tu|quem es|o que es|apresenta te)/.test(textoNorm)) {
      return { texto: respostaIdentidade() };
    }

    var ondeQuer = /(onde (encontro|fica|esta|está|posso encontrar)|em que (sitio|pagina) (fica|encontro))/.test(textoNorm);
    var abrirQuer = /(abrir|abre|ir para|ir a|entrar em|entrar na|entrar no|mostrar|mostra|quero ver|leva me|vai para)/.test(textoNorm);

    var alvos = localizarServicos(textoNorm);
    if (!alvos.length) {
      return { texto: 'Ainda não tenho esse comando disponível. Este Zelo funciona por comandos reconhecidos (é gratuito e corre só no seu navegador). Diga "ajuda" para ver exemplos.' };
    }
    if (alvos.length > 1 && !ondeQuer) {
      return { texto: 'Está a falar de qual: ' + alvos.map(function (a) { return a.tipo === 'servico' ? a.svc.nome : a.sistema.nome; }).join(' ou ') + '?' };
    }
    var alvo = alvos[0];
    var nome = alvo.tipo === 'servico' ? alvo.svc.nome : alvo.sistema.nome;
    var u = estadoUtilizador();
    var lista = acoesDoServico(alvo, u.role, u.permissoes);
    var tipoPedido = tipoAcaoPedida(textoNorm);
    var acao = escolherAcao(lista, tipoPedido);
    ultimoServico = alvo;

    if (ondeQuer) {
      if (alvo.tipo === 'servico') {
        var cat = categoriaDoServico(alvo.svc);
        if (!acao) return { texto: nome + ' está em Serviços → ' + cat + ', mas não tem permissão para abrir nenhuma das opções desse serviço.' };
        pendente = { file: acao.file, label: nome + ' — ' + acao.label };
        return { texto: nome + ' está em Serviços → ' + cat + '. Quer que eu abra agora (' + acao.label + ')?' };
      }
      if (!acao) return { texto: nome + ' está em Sistemas Locais, mas não tem permissão para o abrir.' };
      pendente = { file: acao.file, label: nome };
      return { texto: nome + ' está em Sistemas Locais. Quer que eu abra agora?' };
    }

    // "abrir X" (verbo explícito) ou apenas o nome do serviço dito sozinho
    if (!acao) return { texto: 'Não tem permissão para aceder a ' + nome + '.' };
    var extra = lista.filter(function (a) { return a.acessivel && a !== acao; }).map(function (a) { return a.label; });
    var texto = 'A abrir ' + nome + (acao.label && acao.label !== nome ? ' — ' + acao.label : '') + '…';
    if (extra.length) texto += ' (também disponível: ' + extra.join(', ') + ')';
    return { texto: texto, navegarPara: acao.file };
  }

  // ── Voz: Web Speech API (grátis, corre só no navegador) ──
  var SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  var vozDisponivel = !!SpeechRecognitionCtor && !!window.speechSynthesis;
  var recognition = null;
  var ouvindo = false;

  function falar(texto){
    if (!window.speechSynthesis) return;
    if ((localStorage.getItem('zeloVoz') || 'on') === 'off') return;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(texto.replace(/[•\n]/g, '. '));
      u.lang = 'pt-PT';
      var vozes = window.speechSynthesis.getVoices();
      var pt = vozes.find(function (v) { return /pt/i.test(v.lang); });
      if (pt) u.voice = pt;
      window.speechSynthesis.speak(u);
    } catch (e) {}
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
      #zas-log{flex:1;min-height:0;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;background:#F8FAFC;}
      .zas-msg{max-width:86%;padding:8px 11px;border-radius:11px;font-size:.78rem;line-height:1.4;white-space:pre-line;}
      .zas-msg.bot{background:#fff;border:1px solid #E2E8F0;color:#0F172A;align-self:flex-start;border-bottom-left-radius:3px;}
      .zas-msg.user{background:#1A56DB;color:#fff;align-self:flex-end;border-bottom-right-radius:3px;}
      .zas-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 12px 10px;flex-shrink:0;}
      .zas-chip{font-size:.66rem;font-weight:700;color:#1A56DB;background:#EFF6FF;border:1px solid #DBEAFE;border-radius:100px;
        padding:5px 10px;cursor:pointer;}
      .zas-chip:hover{background:#DBEAFE;}
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
    `;
    document.head.appendChild(style);
  }

  var ICON_MIC = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4M8 22h8"/></svg>';
  var ICON_SEND = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>';
  var ICON_CLOSE = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  var ICON_SPEAKER_ON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>';
  var ICON_SPEAKER_OFF = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M23 9l-6 6M17 9l6 6"/></svg>';

  function montarPainel(){
    var btn = document.createElement('button');
    btn.id = 'zas-btn'; btn.type = 'button'; btn.title = 'Falar com o Zelo'; btn.setAttribute('aria-label', 'Abrir assistente Zelo');
    btn.innerHTML = ICON_MIC;

    var overlay = document.createElement('div'); overlay.id = 'zas-overlay';
    var panel = document.createElement('div'); panel.id = 'zas-panel';
    var vozLigada = (localStorage.getItem('zeloVoz') || 'on') !== 'off';
    panel.innerHTML =
      '<div class="zas-head">' +
        '<div><div class="zas-title">Zelo</div><div class="zas-sub">Assistente local · grátis</div></div>' +
        '<button type="button" class="zas-icon-btn' + (vozLigada ? '' : ' muted') + '" id="zas-voz-toggle" title="Ligar/desligar voz do Zelo">' + (vozLigada ? ICON_SPEAKER_ON : ICON_SPEAKER_OFF) + '</button>' +
        '<button type="button" class="zas-icon-btn" id="zas-close" title="Fechar">' + ICON_CLOSE + '</button>' +
      '</div>' +
      '<div id="zas-log"></div>' +
      '<div class="zas-chips">' +
        '<button type="button" class="zas-chip" data-msg="ajuda">Ajuda</button>' +
        '<button type="button" class="zas-chip" data-msg="abrir bloco operatório">Abrir Bloco Operatório</button>' +
        '<button type="button" class="zas-chip" data-msg="onde encontro a farmácia">Onde fica a Farmácia?</button>' +
      '</div>' +
      '<div class="zas-input-row">' +
        (vozDisponivel ? '<button type="button" class="zas-round-btn" id="zas-mic" title="Falar">' + ICON_MIC + '</button>' : '') +
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
    }

    function enviar(texto){
      texto = String(texto || '').trim();
      if (!texto) return;
      adicionarMsg(texto, 'user');
      input.value = '';
      var r = processar(texto);
      adicionarMsg(r.texto, 'bot');
      falar(r.texto);
      if (r.navegarPara) setTimeout(function () { window.location.href = r.navegarPara; }, 700);
    }

    function abrir(){
      overlay.classList.add('open');
      panel.classList.add('open');
      if (!jaCumprimentou) { jaCumprimentou = true; var r = respostaSaudacao(); adicionarMsg(r, 'bot'); falar(r); }
      input.focus();
    }
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

    if (vozDisponivel) {
      recognition = new SpeechRecognitionCtor();
      recognition.lang = 'pt-PT';
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
