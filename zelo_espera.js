// ── ZELO — Ecrãs de espera (círculo de 0 a 100%) ──
// Um só aspeto para tudo o que obriga a esperar:
//   • abertura das páginas (por cima do ecrã de abertura de cada página);
//   • entrada no sistema (index.html, fases: sessão → ambiente → página);
//   • "A processar, aguarde" (gerar PDF, backup, importar…);
//   • ligação lenta, sem internet e ligação restabelecida.
// O círculo enche-se de 0 a 100% em degradé (âmbar se a ligação estiver
// lenta, cinzento sem internet, verde com um visto quando termina) e a
// percentagem aparece em números grandes no meio.
// Tem de ser carregado cedo, no <head>, antes do ecrã de abertura da página.
(function () {
  if (window.ZeloEspera) return;
  var NS = 'http://www.w3.org/2000/svg';
  var R = 62, C = 2 * Math.PI * R;
  var LENTO_MS = 8000;
  var MSG_OFF = 'Estás offline neste momento, quando tiver internet, irá restaurar a sincronização automaticamente.';
  var noIframe = window.self !== window.top;
  var ultimoGesto = 0;
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
    window.addEventListener(ev, function () { ultimoGesto = Date.now(); }, true);
  });

  // ── Estilos ───────────────────────────────────────────────────────────
  var css = [
    // o ecrã de abertura de cada página fica por baixo do nosso (a página continua a controlá-lo)
    'html:not(.zelo-espera-off) #splash{visibility:hidden !important;}',
    '.ze-camada{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;visibility:visible !important;',
    '  font-family:Inter,"Segoe UI",Arial,sans-serif;transition:opacity .35s ease;opacity:1;-webkit-font-smoothing:antialiased;}',
    '.ze-camada.ze-sai{opacity:0;pointer-events:none;}',
    // enquanto o ecrã escuro está aberto, os botões flutuantes (menu, assistente) não aparecem por cima
    'html.ze-ecra #zmf-btn,html.ze-ecra #zas-btn,html.ze-ecra #zub-sair-btn{visibility:hidden !important;}',
    // Opção A: azul-escuro com a fotografia do ecrã de entrada ao fundo, suave (desfocada e escurecida)
    '.ze-escura{background:#0B1522;color:#fff;isolation:isolate;overflow:hidden;}',
    '.ze-escura::before{content:"";position:absolute;inset:-12px;z-index:-2;background:url(icons/login_bg.jpg) center/cover no-repeat;filter:blur(3px) saturate(.9);opacity:.55;}',
    '.ze-escura::after{content:"";position:absolute;inset:0;z-index:-1;background:radial-gradient(ellipse at 50% 45%,rgba(20,40,75,.72) 0%,rgba(10,21,40,.9) 60%,rgba(6,13,26,.96) 100%);}',
    '.ze-veu{background:rgba(15,23,42,.5);-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);}',
    '.ze-centro{text-align:center;width:min(86vw,340px);}',
    '.ze-caixa{color:#fff;padding:10px;width:min(86vw,340px);text-align:center;}',
    '.ze-logo{width:40px;height:40px;border-radius:10px;display:block;margin:0 auto 14px;background:#fff;object-fit:contain;padding:3px;}',
    '.ze-anel{position:relative;width:160px;height:160px;margin:0 auto;}',
    '.ze-anel svg{width:100%;height:100%;transform:rotate(-90deg);display:block;}',
    '.ze-anel .ze-pista{fill:none;stroke-width:11;}',
    '.ze-escura .ze-pista{stroke:rgba(255,255,255,.14);}',
    '.ze-anel .ze-arco{fill:none;stroke-width:11;stroke-linecap:round;}',
    '.ze-anel .ze-brilho{position:absolute;inset:0;border-radius:50%;animation:zeGira 2.2s linear infinite;}',
    '.ze-anel .ze-brilho::after{content:"";position:absolute;top:3px;left:50%;width:8px;height:8px;margin-left:-4px;border-radius:50%;background:#fff;box-shadow:0 0 10px 3px rgba(255,255,255,.8);}',
    '.ze-ok .ze-brilho{display:none;}',
    '.ze-num{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;}',
    '.ze-num b{font-size:2.5rem;font-weight:800;letter-spacing:-1px;line-height:1;}',
    '.ze-num small{font-size:.6rem;letter-spacing:2px;opacity:.75;margin-top:5px;text-transform:uppercase;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    '.ze-msg{font-weight:700;margin-top:16px;font-size:1.02rem;}',
    '.ze-det{font-size:.8rem;opacity:.75;margin-top:4px;min-height:1em;}',
    '.ze-passos{display:flex;justify-content:center;gap:6px;margin-top:14px;}',
    '.ze-passos i{width:28px;height:4px;border-radius:3px;background:rgba(255,255,255,.18);transition:background .3s;}',
    '.ze-passos i.ok{background:#22D3EE;}',
    '.ze-tag{display:none;margin-top:12px;font-size:.74rem;font-weight:700;border-radius:20px;padding:4px 11px;}',
    '.ze-tag.lenta{display:inline-block;color:#FDE68A;background:rgba(245,158,11,.18);border:1px solid rgba(245,158,11,.6);}',
    '.ze-tag.off{display:inline-block;color:#E2E8F0;background:rgba(148,163,184,.18);border:1px solid rgba(148,163,184,.6);}',
    '.ze-botoes{display:flex;flex-direction:column;gap:8px;margin-top:14px;}',
    '.ze-btn{border:0;cursor:pointer;font:inherit;font-weight:700;font-size:.85rem;border-radius:22px;padding:9px 16px;}',
    '.ze-btn.pri{background:#fff;color:#0F172A;} .ze-btn.sec{background:transparent;color:rgba(255,255,255,.85);text-decoration:underline;}',
    '.ze-ok .ze-num b{color:#4ADE80;font-size:3.2rem;} .ze-ok .ze-num small{color:#4ADE80;opacity:1;}',
    '.ze-ok .ze-msg{color:#86EFAC;}',
    '@keyframes zeGira{to{transform:rotate(360deg);}}',
    // faixas pequenas no topo (ligação lenta / restabelecida / sem internet)
    '.ze-faixa{position:fixed;top:10px;left:50%;transform:translate(-50%,-140%);z-index:2147483001;display:flex;align-items:center;gap:10px;',
    '  max-width:min(94vw,560px);padding:9px 14px;border-radius:14px;font-family:Inter,"Segoe UI",Arial,sans-serif;font-size:.82rem;line-height:1.35;',
    '  box-shadow:0 6px 20px rgba(15,23,42,.18);transition:transform .35s ease;visibility:visible !important;}',
    '.ze-faixa.ze-ve{transform:translate(-50%,0);}',
    '.ze-faixa b{display:block;font-size:.86rem;}',
    '.ze-faixa .ze-fx-ic{width:30px;height:30px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1rem;}',
    '.ze-faixa.lenta{background:#FFFBEB;border:1px solid #F59E0B;color:#78350F;} .ze-faixa.lenta .ze-fx-ic{background:#FEF3C7;}',
    '.ze-faixa.off{background:#F8FAFC;border:1px solid #94A3B8;color:#1E293B;} .ze-faixa.off .ze-fx-ic{background:#E2E8F0;}',
    '.ze-faixa.volta{background:#F0FDF4;border:1px solid #22C55E;color:#14532D;} .ze-faixa.volta .ze-fx-ic{background:#DCFCE7;}',
    '.ze-faixa .ze-btn{padding:6px 12px;font-size:.76rem;margin-left:auto;white-space:nowrap;}',
    '.ze-faixa .ze-btn.pri{background:#1F2F45;color:#fff;}',
    '.ze-sinal{display:inline-flex;gap:2px;align-items:flex-end;height:15px;}',
    '.ze-sinal i{width:3px;background:#D97706;border-radius:1px;} .ze-sinal i:nth-child(1){height:5px} .ze-sinal i:nth-child(2){height:9px;opacity:.35} .ze-sinal i:nth-child(3){height:14px;opacity:.35}'
  ].join('\n');
  var st = document.createElement('style');
  st.id = 'ze-estilos';
  st.textContent = css;
  (document.head || document.documentElement).appendChild(st);

  function raiz() { return document.body || document.documentElement; }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  var idGrad = 0;
  var GRADS = {
    normal: [['0', '#22D3EE'], ['.55', '#3B82F6'], ['1', '#22C55E']],
    proc: [['0', '#3E5C87'], ['.5', '#22D3EE'], ['1', '#22C55E']],
    lenta: [['0', '#FBBF24'], ['1', '#F97316']],
    off: [['0', '#64748B'], ['1', '#94A3B8']],
    ok: [['0', '#22C55E'], ['1', '#16A34A']]
  };

  // ── Anel ──────────────────────────────────────────────────────────────
  function criarAnel(rotulo) {
    var wrap = el('div', 'ze-anel');
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 150 150');
    var defs = document.createElementNS(NS, 'defs');
    var ids = {};
    Object.keys(GRADS).forEach(function (k) {
      var g = document.createElementNS(NS, 'linearGradient');
      var id = 'zeg' + (++idGrad);
      ids[k] = id;
      g.setAttribute('id', id); g.setAttribute('x1', '0'); g.setAttribute('y1', '0'); g.setAttribute('x2', '1'); g.setAttribute('y2', '1');
      GRADS[k].forEach(function (s) { var p = document.createElementNS(NS, 'stop'); p.setAttribute('offset', s[0]); p.setAttribute('stop-color', s[1]); g.appendChild(p); });
      defs.appendChild(g);
    });
    svg.appendChild(defs);
    var pista = document.createElementNS(NS, 'circle');
    pista.setAttribute('class', 'ze-pista'); pista.setAttribute('cx', '75'); pista.setAttribute('cy', '75'); pista.setAttribute('r', R);
    var arco = document.createElementNS(NS, 'circle');
    arco.setAttribute('class', 'ze-arco'); arco.setAttribute('cx', '75'); arco.setAttribute('cy', '75'); arco.setAttribute('r', R);
    arco.setAttribute('stroke-dasharray', C); arco.setAttribute('stroke-dashoffset', C);
    svg.appendChild(pista); svg.appendChild(arco);
    wrap.appendChild(svg);
    wrap.appendChild(el('div', 'ze-brilho'));
    var num = el('div', 'ze-num', '<b>0%</b><small></small>');
    num.querySelector('small').textContent = rotulo || '';
    wrap.appendChild(num);
    var api = {
      el: wrap,
      cor: function (k) { arco.setAttribute('stroke', 'url(#' + ids[k] + ')'); },
      valor: function (v) { arco.setAttribute('stroke-dashoffset', C * (1 - Math.max(0, Math.min(100, v)) / 100)); },
      texto: function (t) { num.querySelector('b').textContent = t; },
      rotulo: function (t) { num.querySelector('small').textContent = t || ''; }
    };
    api.cor('normal');
    return api;
  }

  // Controlador comum: o número mostrado persegue o "alvo"; sem alvo novo
  // avança sozinho devagar até 90% (e só chega a 100% quando termina).
  function motor(anel, aoAtualizar) {
    var mostrado = 0, alvo = 8, auto = true, parado = false, t0 = Date.now(), ultimoAlvo = Date.now();
    var iv = setInterval(function () {
      if (parado) return;
      if (auto && Date.now() - ultimoAlvo > 600 && alvo < 90) alvo = Math.min(90, alvo + (alvo < 60 ? 0.6 : 0.25));
      if (mostrado < alvo) mostrado = Math.min(alvo, mostrado + Math.max(0.4, (alvo - mostrado) * 0.12));
      anel.valor(mostrado);
      anel.texto(Math.round(mostrado) + '%');
      if (aoAtualizar) aoAtualizar(mostrado, Date.now() - t0);
    }, 50);
    return {
      alvo: function (v) { if (v > alvo) { alvo = Math.min(100, v); ultimoAlvo = Date.now(); } },
      valor: function () { return mostrado; },
      decorrido: function () { return Date.now() - t0; },
      terminar: function (cb) {
        // anima até 100% em ~0,5 s, depois chama cb
        alvo = 100; auto = false;
        var passo = Math.max(2, (100 - mostrado) / 10);
        var iv2 = setInterval(function () {
          mostrado = Math.min(100, mostrado + passo);
          anel.valor(mostrado); anel.texto(Math.round(mostrado) + '%');
          if (mostrado >= 100) { clearInterval(iv2); if (cb) cb(); }
        }, 50);
      },
      parar: function () { parado = true; clearInterval(iv); }
    };
  }

  function sair(camada, cb) {
    camada.classList.add('ze-sai');
    setTimeout(function () { if (camada.parentNode) camada.parentNode.removeChild(camada); if (cb) cb(); }, 380);
  }

  function logoSrc() { return 'icons/logo.png'; }

  function semEcra() { document.documentElement.classList.remove('ze-ecra'); }

  // ── Ecrã escuro (entrada e abertura de páginas) ───────────────────────
  function ecra(opcoes) {
    opcoes = opcoes || {};
    var camada = el('div', 'ze-camada ze-escura');
    camada.setAttribute('role', 'status'); camada.setAttribute('aria-live', 'polite');
    var centro = el('div', 'ze-centro');
    var logo = el('img', 'ze-logo'); logo.src = logoSrc(); logo.alt = '';
    logo.onerror = function () { logo.style.display = 'none'; };
    var anel = criarAnel(opcoes.rotulo || 'ZELO');
    var msg = el('div', 'ze-msg'); msg.textContent = opcoes.mensagem || 'A carregar…';
    var det = el('div', 'ze-det'); det.textContent = opcoes.detalhe || 'Hospital do Prenda · ZELO';
    var passos = null;
    if (opcoes.passos) { passos = el('div', 'ze-passos'); for (var i = 0; i < opcoes.passos; i++) passos.appendChild(el('i')); }
    var tag = el('div', 'ze-tag');
    centro.appendChild(logo); centro.appendChild(anel.el); centro.appendChild(msg); centro.appendChild(det);
    if (passos) centro.appendChild(passos);
    centro.appendChild(tag);
    camada.appendChild(centro);
    raiz().appendChild(camada);
    document.documentElement.classList.add('ze-ecra');
    var fechado = false, lento = false;
    var m = motor(anel, function (v, ms) {
      if (passos) Array.prototype.forEach.call(passos.children, function (x, k) { x.className = v >= (k + 1) * (100 / opcoes.passos) - 0.5 ? 'ok' : ''; });
      if (opcoes.mensagens && !msgFixa) {
        var f = opcoes.mensagens, idx = Math.min(f.length - 1, Math.floor(v / (100 / f.length)));
        msg.textContent = f[idx];
      }
      if (!navigator.onLine) { tag.className = 'ze-tag off'; tag.textContent = MSG_OFF; anel.cor('off'); }
      else if (ms > LENTO_MS && v < 99 && !lento) { lento = true; anel.cor('lenta'); tag.className = 'ze-tag lenta'; tag.textContent = 'Ligação lenta: aguarde um momento…'; }
      else if (navigator.onLine && tag.className.indexOf('off') >= 0) { tag.className = 'ze-tag'; anel.cor(lento ? 'lenta' : 'normal'); }
    });
    var msgFixa = false;
    var api = {
      camada: camada,
      progresso: function (v, texto) { m.alvo(v); if (texto) { msg.textContent = texto; msgFixa = true; } },
      mensagem: function (t) { msg.textContent = t; msgFixa = true; },
      concluir: function (cb) {
        if (fechado) return; fechado = true;
        msgFixa = true;
        m.terminar(function () { m.parar(); msg.textContent = opcoes.mensagemFim || 'Pronto'; setTimeout(function () { semEcra(); sair(camada, cb); }, 250); });
      },
      fechar: function (cb) { if (fechado) return; fechado = true; m.parar(); semEcra(); sair(camada, cb); },
      aberto: function () { return !fechado; }
    };
    return api;
  }

  // ── "A processar, aguarde" ────────────────────────────────────────────
  var procAtual = null;
  function processar(opcoes) {
    opcoes = opcoes || {};
    if (procAtual && procAtual.aberto()) { procAtual.titulo(opcoes.titulo); return procAtual; }
    var camada = el('div', 'ze-camada ze-escura');
    camada.setAttribute('role', 'status'); camada.setAttribute('aria-live', 'polite');
    var caixa = el('div', 'ze-caixa');
    var anel = criarAnel(opcoes.rotulo || 'A PROCESSAR');
    anel.cor('proc');
    var msg = el('div', 'ze-msg'); msg.textContent = opcoes.titulo || 'A processar…';
    var det = el('div', 'ze-det'); det.textContent = opcoes.detalhe || 'Aguarde, pode demorar alguns segundos.';
    var tag = el('div', 'ze-tag');
    caixa.appendChild(anel.el); caixa.appendChild(msg); caixa.appendChild(det); caixa.appendChild(tag);
    camada.appendChild(caixa);
    raiz().appendChild(camada);
    var fechado = false, lento = false;
    var m = motor(anel, function (v, ms) {
      if (!navigator.onLine) { tag.className = 'ze-tag off'; tag.textContent = MSG_OFF; }
      else if (ms > LENTO_MS && !lento) { lento = true; anel.cor('lenta'); tag.className = 'ze-tag lenta'; tag.textContent = 'Está a demorar mais do que o normal. A ligação parece lenta.'; }
      else if (navigator.onLine && tag.className.indexOf('off') >= 0) tag.className = lento ? 'ze-tag lenta' : 'ze-tag';
    });
    var api = {
      aberto: function () { return !fechado; },
      titulo: function (t) { if (t) msg.textContent = t; },
      detalhe: function (t) { det.textContent = t || ''; },
      progresso: function (v, detalhe) { m.alvo(v); if (detalhe != null) det.textContent = detalhe; },
      concluir: function (titulo, detalhe) {
        if (fechado) return; fechado = true;
        m.terminar(function () {
          m.parar();
          caixa.classList.add('ze-ok'); anel.cor('ok'); anel.texto('✓'); anel.rotulo('100%');
          msg.textContent = titulo || 'Concluído'; det.textContent = detalhe || ''; tag.className = 'ze-tag';
          setTimeout(function () { sair(camada); }, 1100);
        });
        if (procAtual === api) procAtual = null;
      },
      erro: function (texto) {
        if (fechado) return; fechado = true; m.parar();
        msg.textContent = texto || 'Não foi possível concluir.'; det.textContent = '';
        setTimeout(function () { sair(camada); }, 2200);
        if (procAtual === api) procAtual = null;
      },
      fechar: function () { if (fechado) return; fechado = true; m.parar(); sair(camada); if (procAtual === api) procAtual = null; }
    };
    procAtual = api;
    return api;
  }

  // ── Faixas no topo ────────────────────────────────────────────────────
  var faixaAtual = null;
  function faixa(tipo, titulo, texto, opcoes) {
    opcoes = opcoes || {};
    if (faixaAtual) { var v = faixaAtual; faixaAtual = null; v.classList.remove('ze-ve'); setTimeout(function () { if (v.parentNode) v.parentNode.removeChild(v); }, 350); }
    var f = el('div', 'ze-faixa ' + tipo);
    f.setAttribute('role', 'status');
    var ic = tipo === 'lenta' ? '<span class="ze-sinal"><i></i><i></i><i></i></span>' : tipo === 'off' ? '📴' : '✓';
    f.innerHTML = '<div class="ze-fx-ic">' + ic + '</div><div><b class="ze-fx-t"></b><span class="ze-fx-txt"></span></div>';
    f.querySelector('.ze-fx-t').textContent = titulo;
    f.querySelector('.ze-fx-txt').textContent = texto;
    if (opcoes.botao) {
      var b = el('button', 'ze-btn pri'); b.type = 'button'; b.textContent = opcoes.botao.texto;
      b.addEventListener('click', opcoes.botao.acao); f.appendChild(b);
    }
    raiz().appendChild(f);
    faixaAtual = f;
    requestAnimationFrame(function () { requestAnimationFrame(function () { f.classList.add('ze-ve'); }); });
    if (opcoes.duracao) setTimeout(function () { if (faixaAtual === f) fecharFaixa(); }, opcoes.duracao);
    return f;
  }
  function fecharFaixa() {
    if (!faixaAtual) return;
    var f = faixaAtual; faixaAtual = null;
    f.classList.remove('ze-ve');
    setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 350);
  }

  // ── Ligação: lenta / sem internet / restabelecida ─────────────────────
  var ultimaLenta = 0, ultimaCaixaOff = 0, caixaOff = null;
  function pendentes() {
    return (typeof window.zeloPendingCount === 'function' ? window.zeloPendingCount() : Promise.resolve(0)).catch(function () { return 0; });
  }
  function avisarLenta() {
    if (noIframe || !navigator.onLine) return;
    if (Date.now() - ultimaLenta < 3 * 60 * 1000) return;
    ultimaLenta = Date.now();
    faixa('lenta', 'Ligação lenta', 'Pode continuar. As alterações estão guardadas neste aparelho e serão enviadas assim que possível.', { duracao: 7000 });
  }
  function faixaSemInternet() {
    if (document.getElementById('zelo-offline-banner')) return; // a página já mostra o seu aviso
    pendentes().then(function (n) {
      if (navigator.onLine) return;
      faixa('off', 'Sem internet', MSG_OFF + (n ? ' (' + n + (n === 1 ? ' alteração aguarda' : ' alterações aguardam') + ' envio.)' : ''),
        { botao: { texto: 'Tentar agora', acao: function () { tentarLigar(true); } } });
    });
  }
  function semInternet() {
    if (noIframe || navigator.onLine) return;
    if (caixaOff) return;
    if (Date.now() - ultimaCaixaOff < 5 * 60 * 1000) { faixaSemInternet(); return; }
    ultimaCaixaOff = Date.now();
    var camada = el('div', 'ze-camada ze-escura');
    var caixa = el('div', 'ze-caixa');
    var anel = criarAnel('NOVA TENTATIVA');
    anel.cor('off');
    var msg = el('div', 'ze-msg'); msg.textContent = 'Sem internet';
    var det = el('div', 'ze-det'); det.textContent = MSG_OFF;
    var bt = el('div', 'ze-botoes');
    var b1 = el('button', 'ze-btn pri'); b1.type = 'button'; b1.textContent = 'Tentar agora';
    var b2 = el('button', 'ze-btn sec'); b2.type = 'button'; b2.textContent = 'Continuar a trabalhar';
    bt.appendChild(b1); bt.appendChild(b2);
    caixa.appendChild(anel.el); caixa.appendChild(msg); caixa.appendChild(det); caixa.appendChild(bt);
    camada.appendChild(caixa);
    raiz().appendChild(camada);
    pendentes().then(function (n) { if (n) det.textContent = MSG_OFF + ' (' + n + (n === 1 ? ' alteração aguarda' : ' alterações aguardam') + ' envio.)'; });
    var TOTAL = 10, s = TOTAL;
    function mostrar() { anel.texto(s + ' s'); anel.valor(100 * s / TOTAL); }
    mostrar();
    var iv = setInterval(function () {
      s--;
      if (s <= 0) { s = TOTAL; if (tentarLigar(false)) return; }
      mostrar();
    }, 1000);
    caixaOff = {
      fechar: function (depois) { clearInterval(iv); caixaOff = null; sair(camada, depois); }
    };
    b1.addEventListener('click', function () { s = TOTAL; mostrar(); tentarLigar(true); });
    b2.addEventListener('click', function () { if (caixaOff) caixaOff.fechar(faixaSemInternet); });
  }
  function tentarLigar(manual) {
    if (navigator.onLine) { ligacaoVoltou(); return true; }
    if (manual && typeof window.zeloFlushQueue === 'function') window.zeloFlushQueue();
    return false;
  }
  function ligacaoVoltou() {
    if (noIframe) return;
    if (caixaOff) caixaOff.fechar();
    var enviar = typeof window.zeloFlushQueue === 'function' ? window.zeloFlushQueue() : Promise.resolve(0);
    Promise.resolve(enviar).catch(function () { return 0; }).then(function (n) {
      faixa('volta', 'Ligação restabelecida', n ? n + (n === 1 ? ' alteração enviada' : ' alterações enviadas') + ' com sucesso.' : 'Está tudo sincronizado.', { duracao: 4500 });
    });
  }
  // A reconexão é automática: quando a internet volta, a caixa/faixa fecha,
  // as alterações em fila são enviadas e aparece "Ligação restabelecida" —
  // sem ser preciso recarregar a página.
  var estavaOffline = !navigator.onLine;
  window.addEventListener('offline', function () { estavaOffline = true; setTimeout(semInternet, 600); });
  window.addEventListener('online', function () {
    setTimeout(function () { if (navigator.onLine && (estavaOffline || caixaOff || faixaAtual)) { estavaOffline = false; ligacaoVoltou(); } }, 400);
  });
  window.addEventListener('zelo-ligacao-lenta', avisarLenta);

  // ── Abertura das páginas: acompanha o #splash de cada página ──────────
  var abertura = null;
  function nomePagina() {
    var t = (document.title || '').split(/\s[·|—–-]\s/)[0].trim();
    return t.length > 22 ? t.slice(0, 21) + '…' : t;
  }
  function splashSumiu(sp, jaVisto) {
    if (!sp || !sp.isConnected) return true;
    var cs = getComputedStyle(sp);
    if (cs.display === 'none') return true;
    if (sp.style.opacity === '0') return true;
    if (/(^|\s)(hide|hidden|out|fade|fadeout|fade-out|gone|done|oculto)(\s|$)/.test(sp.className)) return true;
    if (jaVisto && parseFloat(cs.opacity) < 0.5) return true;
    return false;
  }
  function iniciarAbertura(sp) {
    if (abertura || window.ZELO_ESPERA_MODO === 'entrada' || noIframe) return;
    abertura = ecra({
      rotulo: nomePagina() || 'ZELO', mensagem: 'A abrir os dados deste aparelho…', detalhe: 'Hospital do Prenda · ZELO',
      mensagens: ['A abrir os dados deste aparelho…', 'A sincronizar com o servidor…', 'A preparar a página…']
    });
    var visto = false, inicio = Date.now();
    var iv = setInterval(function () {
      var s = document.getElementById('splash');
      if (s && !visto) visto = parseFloat(getComputedStyle(s).opacity) > 0.9;
      // percentagem que a própria página mostra (se mostrar)
      if (s) {
        var alvos = s.querySelectorAll('*');
        for (var i = 0; i < alvos.length; i++) {
          var tx = alvos[i].childElementCount === 0 ? (alvos[i].textContent || '').trim() : '';
          var mm = /^(\d{1,3})\s?%$/.exec(tx);
          if (mm) { abertura.progresso(Math.min(95, +mm[1])); break; }
        }
      }
      if (document.readyState !== 'loading') abertura.progresso(35);
      if (document.readyState === 'complete') abertura.progresso(60);
      if (window.__fbReady) abertura.progresso(80);
      var acabou = splashSumiu(s, visto || Date.now() - inicio > 1500) && (visto || Date.now() - inicio > 400);
      // Ecrã de abertura que pede um clique (ex.: mensagem de boas-vindas com
      // "Começar"): o círculo termina e o ecrã da página volta a ver-se.
      var pedeClique = s && Array.prototype.some.call(s.querySelectorAll('button,a[href],input,[onclick]'), function (b) { return b.getClientRects().length > 0; });
      if (acabou || pedeClique || Date.now() - inicio > 30000) {
        clearInterval(iv);
        abertura.concluir(function () {
          document.documentElement.classList.add('zelo-espera-off');
          abertura = null;
          if (!navigator.onLine) setTimeout(semInternet, 300);
        });
      }
    }, 120);
  }
  // O #splash é inserido pelo parser logo no início do <body>.
  function procurarSplash() {
    var s = document.getElementById('splash');
    if (s) { iniciarAbertura(s); return true; }
    return false;
  }
  if (!procurarSplash()) {
    var obs = new MutationObserver(function () { if (procurarSplash()) obs.disconnect(); });
    obs.observe(document.documentElement, { childList: true, subtree: true });
    document.addEventListener('DOMContentLoaded', function () {
      obs.disconnect();
      if (!procurarSplash() && !navigator.onLine) setTimeout(semInternet, 800);
    });
  }
  // Rede muito lenta (2G) logo ao abrir.
  try {
    var cx = navigator.connection;
    if (cx && /(^|-)2g$/.test(cx.effectiveType || '')) setTimeout(avisarLenta, 1500);
  } catch (e) {}

  // ── Entrada no sistema (index.html) ───────────────────────────────────
  // Fases reais: sessão 25% → permissões 50% → ambiente 75% → página 100%.
  var FASES = [
    [/sess/i, 25, 'A verificar a sessão…'],
    [/permiss/i, 50, 'A carregar as permissões…'],
    [/ambiente/i, 75, 'A preparar o ambiente…'],
    [/p[áa]gina/i, 90, 'A abrir a página inicial…']
  ];
  var entrada = null;
  function abrirEntrada(texto) {
    if (entrada && entrada.aberto()) return entrada;
    entrada = ecra({ rotulo: 'ZELO', mensagem: texto || 'A carregar…', detalhe: 'Hospital do Prenda', passos: 4, mensagemFim: 'Pronto' });
    return entrada;
  }
  function faseEntrada(texto) {
    var e = abrirEntrada(texto);
    for (var i = 0; i < FASES.length; i++) if (FASES[i][0].test(texto || '')) { e.progresso(FASES[i][1], FASES[i][2]); return; }
    if (texto) e.mensagem(texto);
  }
  if (window.ZELO_ESPERA_MODO === 'entrada' && !noIframe) abrirEntrada('A carregar…');

  window.ZeloEspera = {
    faseEntrada: faseEntrada,
    concluirEntrada: function (cb) { if (entrada && entrada.aberto()) entrada.concluir(cb); else if (cb) cb(); },
    fecharEntrada: function () { if (entrada && entrada.aberto()) entrada.fechar(); },
    ecra: ecra,
    processar: processar,
    faixa: faixa,
    fecharFaixa: fecharFaixa,
    semInternet: semInternet,
    avisarLenta: avisarLenta,
    gestoRecente: function (ms) { return Date.now() - ultimoGesto < (ms || 4000); }
  };
})();
