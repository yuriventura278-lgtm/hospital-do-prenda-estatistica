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
// Também carrega zelo_icones.js (emojis → ícones SVG) em todas as páginas.
// E zelo_graficos.js (gráficos no modelo da Consulta Externa), de forma
// síncrona, para estar pronto antes de o Chart.js da página ser carregado.
(function () {
  var eu = document.currentScript && document.currentScript.src;
  function url(f) { return eu ? eu.replace(/zelo_espera\.js(\?.*)?$/, f) : f; }
  if (!window.__zeloGraficos && !document.querySelector('script[src$="zelo_graficos.js"]')) {
    if (document.readyState === 'loading') document.write('<script src="' + url('zelo_graficos.js') + '"><\/script>');
    else { var g = document.createElement('script'); g.src = url('zelo_graficos.js'); document.head.appendChild(g); }
  }
  if (!document.querySelector('script[src$="zelo_ultima_alteracao.js"]')) {
    var ua = document.createElement('script'); ua.src = url('zelo_ultima_alteracao.js'); ua.defer = true;
    (document.head || document.documentElement).appendChild(ua);
  }
  if (window.__zeloIcones || document.querySelector('script[src$="zelo_icones.js"]')) return;
  var sc = document.createElement('script');
  sc.src = url('zelo_icones.js');
  (document.head || document.documentElement).appendChild(sc);
})();
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
    '.ze-logo{width:46px;height:46px;border-radius:12px;display:block;margin:0 auto 14px;object-fit:contain;box-shadow:0 6px 18px rgba(0,0,0,.35);}',
    '.ze-anel{position:relative;width:160px;height:160px;margin:0 auto;}',
    '.ze-anel > svg{width:100%;height:100%;transform:rotate(-90deg);display:block;}',
    '.ze-anel.ze-indet{width:96px;height:96px;}',
    '.ze-anel.ze-indet > svg{animation:zeGiraI 1s linear infinite;}',
    '.ze-anel.ze-indet .ze-num,.ze-anel.ze-indet .ze-brilho{display:none;}',
    '@keyframes zeGiraI{from{transform:rotate(-90deg);}to{transform:rotate(270deg);}}',
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
    // Janelas de boas-vindas / ajuda (#welcomeModal) e mensagens de boas-vindas
    // no ecrã de abertura: mesmo visual dos ecrãs de espera.
    '#welcomeModal,#splash.ze-splash-msg{background:linear-gradient(180deg,rgba(8,18,38,.84),rgba(6,13,26,.93)),url(icons/login_bg.jpg) center/cover no-repeat !important;}',
    '#welcomeModal > *{background:rgba(12,26,52,.62) !important;border:1px solid rgba(255,255,255,.16) !important;-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:0 20px 50px rgba(0,0,0,.45) !important;color:#E2E8F0 !important;}',
    '#welcomeModal > * *:not(svg):not(path):not(circle):not(line):not(polyline){color:#E2E8F0 !important;}',
    '#welcomeModal h2:not(#ze-x),#welcomeModal b:not(#ze-x),#welcomeModal strong:not(#ze-x){color:#fff !important;}',
    '#welcomeModal h3:not(#ze-x){color:#7DD3FC !important;}',
    '#welcomeModal svg{color:#7DD3FC;}',
    '#welcomeModal .modal-header{background:transparent !important;border-bottom:1px solid rgba(34,211,238,.35) !important;}',
    '#welcomeModal [class*="box"],#welcomeModal [class*="def"],#welcomeModal [class*="tip"]{background:rgba(255,255,255,.06) !important;border-color:rgba(255,255,255,.14) !important;}',
    '#welcomeModal button{background:rgba(255,255,255,.1) !important;border:1px solid rgba(255,255,255,.25) !important;color:#fff !important;}',
    '#welcomeModal .ze-logo-wm{display:block;width:46px;height:46px;margin:18px auto 2px;border-radius:12px;box-shadow:0 6px 18px rgba(0,0,0,.35);}',
    '#splash.ze-splash-msg #splash-msg{background:rgba(12,26,52,.62) !important;border:1px solid rgba(255,255,255,.16) !important;}',
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
      // Sem percentagem: um arco a girar (abertura das páginas).
      indeterminado: function () { wrap.classList.add('ze-indet'); arco.style.strokeDashoffset = (C * 0.72) + 'px'; },
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

  // Logótipo do ZELO (o mesmo em todos os ecrãs de espera) — embutido, para
  // aparecer mesmo sem internet.
  var LOGO_ZELO = 'data:image/png;base64,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';
  function logoZelo() {
    var logo = el('img', 'ze-logo'); logo.src = LOGO_ZELO; logo.alt = 'ZELO';
    logo.onerror = function () { logo.style.display = 'none'; };
    return logo;
  }

  function semEcra() { document.documentElement.classList.remove('ze-ecra'); }

  // ── Ecrã escuro (entrada e abertura de páginas) ───────────────────────
  function ecra(opcoes) {
    opcoes = opcoes || {};
    var camada = el('div', 'ze-camada ze-escura');
    camada.setAttribute('role', 'status'); camada.setAttribute('aria-live', 'polite');
    var centro = el('div', 'ze-centro');
    var logo = logoZelo();
    var anel = criarAnel(opcoes.rotulo || 'ZELO');
    if (opcoes.indeterminado) anel.indeterminado();
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
        if (opcoes.indeterminado) { m.parar(); semEcra(); sair(camada, cb); return; }
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
    caixa.appendChild(logoZelo());
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
    caixa.appendChild(logoZelo());
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
    // Só a informação de carregar a página: sem percentagem nem textos
    // próprios de cada página.
    abertura = ecra({ indeterminado: true, mensagem: 'A carregar a página…', detalhe: 'Aguarde um momento.' });
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
        if (pedeClique && s) s.classList.add('ze-splash-msg');
        abertura.concluir(function () {
          document.documentElement.classList.add('zelo-espera-off');
          abertura = null;
          if (!navigator.onLine) setTimeout(semInternet, 300);
        });
      }
    }, 120);
  }
  // Ao clicar num link para outra página do sistema: só "A carregar a página…".
  var navEcra = null;
  window.addEventListener('click', function (e) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target && e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    var href = a.getAttribute('href') || '';
    if (!href || href.charAt(0) === '#' || /^(javascript|mailto|tel|blob|data):/i.test(href)) return;
    var u; try { u = new URL(href, location.href); } catch (x) { return; }
    if (u.origin !== location.origin || !/\.html?$|\/$/.test(u.pathname)) return;
    if (u.pathname === location.pathname && u.search === location.search) return;
    setTimeout(function () {
      if (e.defaultPrevented || navEcra || noIframe) return;
      navEcra = ecra({ indeterminado: true, mensagem: 'A carregar a página…', detalhe: 'Aguarde um momento.' });
    }, 0);
  });
  window.addEventListener('pageshow', function (ev) {
    if (navEcra) { navEcra.fechar(); navEcra = null; }
  });
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

  // ── Mensagens em ecrã inteiro (sem permissão, só administradores…) ────
  // Mesmo design dos ecrãs de espera: fundo azul-escuro com a fotografia,
  // logótipo do ZELO, círculo com o ícone, título, texto e botões.
  var ICONES = {
    info: '<svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    aviso: '<svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    obra: '<svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
    calendario: '<svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="17"/><line x1="12" y1="19.5" x2="12.01" y2="19.5"/></svg>',
    ok: '<svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    admin: '<svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>'
  };
  var CORES_MSG = { info: 'normal', aviso: 'lenta', admin: 'proc', obra: 'lenta', calendario: 'lenta', ok: 'ok' };
  function mensagem(opcoes) {
    opcoes = opcoes || {};
    var tipo = opcoes.icone || 'info';
    var camada = el('div', 'ze-camada ze-escura');
    camada.setAttribute('role', 'alertdialog'); camada.setAttribute('aria-modal', 'true');
    camada.style.pointerEvents = 'auto';
    var caixa = el('div', 'ze-caixa');
    caixa.appendChild(logoZelo());
    var anel = criarAnel('');
    anel.cor(CORES_MSG[tipo] || 'normal'); anel.valor(100);
    anel.el.querySelector('.ze-brilho').style.display = 'none';
    var num = anel.el.querySelector('.ze-num');
    num.innerHTML = '<span style="color:' + (tipo === 'aviso' || tipo === 'obra' || tipo === 'calendario' ? '#FCD34D' : tipo === 'ok' ? '#4ADE80' : '#7DD3FC') + ';display:flex">' + (ICONES[tipo] || ICONES.info) + '</span>';
    var msg = el('div', 'ze-msg'); msg.textContent = opcoes.titulo || 'Aviso';
    msg.style.fontSize = '1.25rem';
    // Mensagem curta em letras grandes (ex.: lembrete de dados em falta).
    if (opcoes.grande) { msg.style.fontSize = 'clamp(1.45rem, 4.6vw, 2rem)'; msg.style.lineHeight = '1.25'; msg.style.fontWeight = '800'; msg.style.maxWidth = '560px'; msg.style.margin = '10px auto 0'; }
    var nomeEl = null;
    if (opcoes.nome) { nomeEl = el('div', 'ze-det'); nomeEl.textContent = opcoes.nome; nomeEl.style.cssText = 'margin-top:18px;font-size:1.05rem;font-weight:700;color:#BFF3FF;letter-spacing:.01em;opacity:1;'; }
    var etiqueta = null;
    if (opcoes.etiqueta) { etiqueta = el('div', 'ze-tag lenta'); etiqueta.textContent = opcoes.etiqueta; etiqueta.style.margin = '14px 0 0'; }
    var det = el('div', 'ze-det'); det.style.fontSize = '.9rem'; det.style.lineHeight = '1.5'; det.style.opacity = '.9';
    det.innerHTML = opcoes.html || '';
    if (!opcoes.html) det.textContent = opcoes.texto || '';
    var extra = el('div', 'ze-det'); extra.style.marginTop = '8px';
    if (opcoes.detalhe) extra.textContent = opcoes.detalhe;
    caixa.appendChild(anel.el);
    if (etiqueta) caixa.appendChild(etiqueta);
    if (nomeEl) caixa.appendChild(nomeEl);
    caixa.appendChild(msg); caixa.appendChild(det); caixa.appendChild(extra);
    var bt = el('div', 'ze-botoes');
    (opcoes.botoes || [{ texto: 'Entendi', principal: true }]).forEach(function (b) {
      var e;
      if (b.href) { e = el('a', 'ze-btn ' + (b.principal ? 'pri' : 'sec')); e.href = b.href; e.style.textDecoration = b.principal ? 'none' : 'underline'; e.style.display = 'block'; }
      else { e = el('button', 'ze-btn ' + (b.principal ? 'pri' : 'sec')); e.type = 'button'; }
      e.textContent = b.texto;
      e.addEventListener('click', function (ev) { if (b.acao) b.acao(ev); if (!b.href && !b.manter) fechar(); });
      bt.appendChild(e);
    });
    caixa.appendChild(bt);
    camada.appendChild(caixa);
    function fechar() { document.removeEventListener('keydown', tecla, true); semEcra(); sair(camada); }
    function tecla(e) { if (opcoes.fechavel !== false && e.key === 'Escape') { e.preventDefault(); fechar(); } }
    document.addEventListener('keydown', tecla, true);
    raiz().appendChild(camada);
    document.documentElement.classList.add('ze-ecra');
    var foco = bt.querySelector('button,a'); if (foco) try { foco.focus(); } catch (e) {}
    return { fechar: fechar, detalhe: function (t) { extra.textContent = t || ''; }, camada: camada };
  }

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

  function vestirBoasVindas() {
    var wm = document.getElementById('welcomeModal');
    if (wm && wm.firstElementChild && !wm.querySelector('.ze-logo-wm')) {
      var l = logoZelo(); l.className = 'ze-logo-wm';
      wm.firstElementChild.insertBefore(l, wm.firstElementChild.firstChild);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', vestirBoasVindas);
  else vestirBoasVindas();

  window.ZeloEspera = {
    mensagem: mensagem,
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
