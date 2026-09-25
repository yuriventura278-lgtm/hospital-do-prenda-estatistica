// ── ZELO — Emojis → ícones SVG ──
// Em todo o sistema, os emojis que aparecem no ecrã (botões, etiquetas,
// avisos, toasts…) passam a ser ícones SVG de linha, iguais aos do resto da
// interface, em vez de dependerem da fonte de emojis de cada aparelho.
// Funciona sobre o texto já na página e sobre o que for acrescentado depois
// (MutationObserver). Em campos de texto, opções de listas, títulos e
// alertas do navegador, onde não cabe um SVG, o emoji é apenas retirado.
(function () {
  if (window.__zeloIcones) return;
  window.__zeloIcones = true;

  var P = {
    som: '<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
    aviso: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    ok: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    erro: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
    pasta: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
    ficheiro: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    grafico: '<path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="5"/><rect x="12" y="8" width="3" height="9"/><rect x="17" y="5" width="3" height="12"/>',
    subir: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-6"/>',
    descer: '<path d="M3 3v18h18"/><path d="m7 8 4 4 3-3 6 6"/>',
    calendario: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
    cadeado: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    casa: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    relogio: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    atualizar: '<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/>',
    guardar: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/>',
    base: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>',
    lixo: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    obito: '<circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M8 20v2h8v-2"/><path d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20"/>',
    hospital: '<path d="M12 6v4"/><path d="M14 8h-4"/><path d="M14 14h-4"/><path d="M14 18h-4"/><path d="M18 12h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2"/><path d="M18 22V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v18"/>',
    ambulancia: '<path d="M10 10H6"/><path d="M8 8v4"/><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.68-.95l-1.9-.64a1 1 0 0 1-.66-.71l-.54-2.16A1 1 0 0 0 17.26 9H14"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><path d="M9 18h6"/>',
    sirene: '<path d="M7 18v-6a5 5 0 1 1 10 0v6"/><path d="M5 21a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v1H5z"/><path d="M21 12h1"/><path d="M18.5 4.5 18 5"/><path d="M2 12h1"/><path d="M12 2v1"/><path d="m4.93 4.93.71.71"/>',
    cama: '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>',
    lista: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
    vazio: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    comparar: '<path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3a4 4 0 0 0-1.17-2.83L3 3"/><path d="m15 9 6-6"/>',
    baixar: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    carregar: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    estrela: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
    offline: '<path d="M12 20h.01"/><path d="M8.5 16.43a5 5 0 0 1 7 0"/><path d="M5 12.86a10 10 0 0 1 5.17-2.69"/><path d="M19 12.86a10 10 0 0 0-2-1.5"/><path d="M2 8.82a15 15 0 0 1 4.18-2.65"/><path d="M22 8.82a15 15 0 0 0-11.29-3.76"/><path d="m2 2 20 20"/>',
    lua: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    masculino: '<path d="M16 3h5v5"/><path d="m21 3-6.75 6.75"/><circle cx="10" cy="14" r="6"/>',
    feminino: '<path d="M12 15v7"/><path d="M9 19h6"/><circle cx="12" cy="9" r="6"/>',
    pesquisa: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    pin: '<path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    utilizador: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    telefone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
    email: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/>',
    imprimir: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    lampada: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
    alvo: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    ponto: null
  };
  // emoji → [ícone, cor opcional]
  var MAPA = {
    '🔊': ['som'], '🔈': ['som'], '🔉': ['som'],
    '⚠': ['aviso', '#D97706'], '🚫': ['erro', '#DC2626'],
    '✅': ['ok', '#16A34A'], '✔': ['ok', '#16A34A'], '☑': ['ok', '#16A34A'],
    '❌': ['erro', '#DC2626'], '❎': ['erro', '#DC2626'],
    '📁': ['pasta'], '📂': ['pasta'], '🗂': ['pasta'],
    '📄': ['ficheiro'], '📃': ['ficheiro'], '📑': ['ficheiro'], '📝': ['ficheiro'],
    '📊': ['grafico'], '📈': ['subir'], '📉': ['descer'],
    '📅': ['calendario'], '📆': ['calendario'], '🗓': ['calendario'],
    '🔒': ['cadeado'], '🔐': ['cadeado'], '🔓': ['cadeado'],
    '🏠': ['casa'], '🏡': ['casa'],
    '🕘': ['relogio'], '🕐': ['relogio'], '⏰': ['relogio'], '⏱': ['relogio'], '⏳': ['relogio'], '⌛': ['relogio'],
    '🔄': ['atualizar'], '🔁': ['atualizar'], '♻': ['atualizar'],
    '💾': ['guardar'], '🗄': ['base'],
    '🗑': ['lixo'],
    '💀': ['obito'], '☠': ['obito'], '⚰': ['obito'],
    '🏥': ['hospital'], '🚑': ['ambulancia'], '🚨': ['sirene', '#DC2626'],
    '🛏': ['cama'], '📋': ['lista'], '📭': ['vazio'], '📬': ['vazio'], '📥': ['vazio'],
    '🔀': ['comparar'],
    '⬇': ['baixar'], '📤': ['carregar'], '⬆': ['carregar'],
    '⭐': ['estrela', '#F59E0B'], '🌟': ['estrela', '#F59E0B'],
    '📴': ['offline'], '🌙': ['lua'], '☀': ['sol'],
    '♂': ['masculino', '#2563EB'], '♀': ['feminino', '#DB2777'],
    '🔍': ['pesquisa'], '🔎': ['pesquisa'], '📌': ['pin'], '📍': ['pin'],
    'ℹ': ['info'], '💡': ['lampada'], '🎯': ['alvo'],
    '👤': ['utilizador'], '👥': ['utilizador'], '📞': ['telefone'], '☎': ['telefone'],
    '📧': ['email'], '✉': ['email'], '🖨': ['imprimir'],
    '🟢': ['ponto', '#16A34A'], '🔵': ['ponto', '#2563EB'], '🟠': ['ponto', '#EA580C'],
    '🔴': ['ponto', '#DC2626'], '🟡': ['ponto', '#EAB308'], '🟣': ['ponto', '#7C3AED'], '⚪': ['ponto', '#94A3B8'], '⚫': ['ponto', '#334155']
  };
  // Qualquer outro emoji pictográfico: retirado (sem ícone próprio).
  var RE = /(?:[\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F2FF}]|[☀-⛿✀-➿⬆⬇⭐⏰-⏺⌚⌛ℹ])️?⃣?|️/gu;
  // Caracteres tipográficos que NÃO são emojis (setas, ✓, ✕, ★…) ficam.
  var MANTER = /^[←-⇿✓✕✗★☆•·]$/;

  function svg(nome, cor) {
    var inner = P[nome];
    if (nome === 'ponto') return '<svg class="zi zi-ponto" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7" fill="' + (cor || 'currentColor') + '"/></svg>';
    return '<svg class="zi" viewBox="0 0 24 24" fill="none" stroke="' + (cor || 'currentColor') + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
  }
  function base(e) { return e.replace(/[️⃣]/g, ''); }
  function limpar(txt) {
    return txt.replace(RE, function (m) { var b = base(m); return MANTER.test(b) ? m : ''; }).replace(/^\s+(?=\S)/, function (s) { return s; });
  }
  function temEmoji(txt) {
    RE.lastIndex = 0;
    var m, r = false;
    while ((m = RE.exec(txt))) { if (!MANTER.test(base(m[0]))) { r = true; break; } }
    RE.lastIndex = 0;
    return r;
  }

  var PROIBIDO = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, NOSCRIPT: 1, TITLE: 1, OPTION: 1, CODE: 1, PRE: 1 };
  function trocarTexto(no) {
    var pai = no.parentNode;
    if (!pai || pai.nodeType !== 1) return;
    var txt = no.nodeValue;
    if (!txt || !temEmoji(txt)) return;
    if (PROIBIDO[pai.nodeName] || pai.closest('svg,[contenteditable="true"]')) {
      if (pai.nodeName === 'OPTION' || pai.nodeName === 'TITLE') no.nodeValue = limpar(txt).trim();
      return;
    }
    var frag = document.createDocumentFragment();
    var ultimo = 0, m;
    RE.lastIndex = 0;
    while ((m = RE.exec(txt))) {
      var b = base(m[0]);
      if (MANTER.test(b)) continue;
      if (m.index > ultimo) frag.appendChild(document.createTextNode(txt.slice(ultimo, m.index)));
      var def = MAPA[b];
      if (def) {
        var s = document.createElement('span');
        s.className = 'zi-w';
        s.innerHTML = svg(def[0], def[1]);
        frag.appendChild(s.firstChild);
      }
      ultimo = m.index + m[0].length;
    }
    RE.lastIndex = 0;
    if (ultimo < txt.length) frag.appendChild(document.createTextNode(txt.slice(ultimo)));
    pai.replaceChild(frag, no);
  }
  function trocarAtributos(el) {
    ['placeholder', 'title', 'aria-label', 'value'].forEach(function (a) {
      if (a === 'value' && !(el.nodeName === 'INPUT' && /^(button|submit|reset)$/i.test(el.type))) return;
      var v = el.getAttribute && el.getAttribute(a);
      if (v && temEmoji(v)) el.setAttribute(a, limpar(v).replace(/^\s+/, ''));
    });
  }
  function percorrer(raiz) {
    if (!raiz) return;
    if (raiz.nodeType === 3) { trocarTexto(raiz); return; }
    if (raiz.nodeType !== 1 && raiz.nodeType !== 11) return;
    if (raiz.nodeType === 1) {
      if (raiz.nodeName === 'SCRIPT' || raiz.nodeName === 'STYLE') return;
      trocarAtributos(raiz);
    }
    if (raiz.querySelectorAll) Array.prototype.forEach.call(raiz.querySelectorAll('[placeholder],[title],[aria-label],input[type=button],input[type=submit]'), trocarAtributos);
    var w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, null), n, lista = [];
    while ((n = w.nextNode())) if (n.nodeValue && temEmoji(n.nodeValue)) lista.push(n);
    lista.forEach(trocarTexto);
  }

  // Alertas e confirmações do navegador não mostram SVG: só retira o emoji.
  ['alert', 'confirm', 'prompt'].forEach(function (f) {
    var orig = window[f];
    if (typeof orig !== 'function') return;
    window[f] = function (msg) {
      var args = Array.prototype.slice.call(arguments);
      if (typeof msg === 'string') args[0] = limpar(msg).replace(/^\s+/, '');
      return orig.apply(window, args);
    };
  });
  try {
    var dt = Object.getOwnPropertyDescriptor(Document.prototype, 'title');
    if (dt && dt.set) Object.defineProperty(document, 'title', { configurable: true, get: function () { return dt.get.call(document); }, set: function (v) { dt.set.call(document, typeof v === 'string' ? limpar(v).trim() : v); } });
  } catch (e) {}

  function iniciar() {
    var st = document.createElement('style');
    st.textContent = 'svg.zi{width:1.05em;height:1.05em;vertical-align:-0.16em;flex-shrink:0;display:inline-block;margin:0 .1em;overflow:visible;}' +
      'svg.zi-ponto{width:.8em;height:.8em;vertical-align:-0.05em;}';
    document.head.appendChild(st);
    if (document.title && temEmoji(document.title)) document.title = document.title;
    percorrer(document.body);
    var pendentes = [], agendado = false;
    function processar() {
      agendado = false;
      var l = pendentes; pendentes = [];
      l.forEach(function (n) { if (n.isConnected) percorrer(n); });
    }
    new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        if (m.type === 'characterData') pendentes.push(m.target);
        else if (m.type === 'attributes') pendentes.push(m.target);
        else Array.prototype.forEach.call(m.addedNodes, function (n) { pendentes.push(n); });
      });
      if (pendentes.length && !agendado) { agendado = true; (window.queueMicrotask || setTimeout)(processar); }
    }).observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title', 'aria-label'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
