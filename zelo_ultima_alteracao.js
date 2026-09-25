// ── ZELO — "Última alteração" nas páginas de registo que ainda não a tinham ──
// Movimento Hospitalar, Movimento do Banco de Urgência, Controlo de Pacientes,
// Reprografia, Psicologia, Ficha Operatória, Secretaria Geral e Controlo de
// Faltas passam a mostrar a mesma etiqueta das outras páginas de registo:
// "Última alteração: <nome> às <hora>" (mesmos ids, por isso fica com o mesmo
// aspeto e o mesmo comportamento no telemóvel — ver zelo_menu_flutuante.js).
//
// Quem e quando: cada gravação feita pela pessoa nesta página (envio para o
// servidor, ou gravação local nas páginas que só guardam no aparelho) regista
// { nome, ts } em ultimas_alteracoes/<página>, para todos os computadores
// verem a mesma informação. Gravações automáticas (sincronização ao abrir a
// página) não contam: só as que acontecem logo a seguir a um clique/tecla.
(function () {
  if (window.__zeloUltAlt || window.self !== window.top) return;
  var ficheiro = decodeURIComponent((location.pathname.split('/').pop() || ''));
  var PAGINAS = /^([a-z_]+_movimento|banco_urgencia|controlo_pacientes_[a-z_]+|reprografia|psicologia_atendimento|bloco_operatorio_ficha_operatoria|secretaria_geral|controlo_faltas_gepedema)\.html$/;
  if (!PAGINAS.test(ficheiro)) return;
  window.__zeloUltAlt = true;

  // Páginas que só guardam neste aparelho: conta a gravação destas chaves.
  var LOCAL = {
    'secretaria_geral.html': /^(hp_|sec_|secretaria)/i,
    'controlo_faltas_gepedema.html': /falt|feria/i
  };
  // Caminho já permitido pelas regras do Firebase (registos_sistemas_locais/$modulo/$data).
  var CHAVE = 'registos_sistemas_locais/ultimas_alteracoes/' + ficheiro.replace(/\.html$/, '').replace(/[.#$\[\]\/]/g, '_');
  var LS = 'zeloUltAlt_' + ficheiro;
  var IGNORAR = /^(registos_sistemas_locais\/ultimas_alteracoes|users|presenca|auditoria|audit|logs|sessoes|avisos)/;

  function doisNomes(n) {
    if (typeof window.zeloDoisNomes === 'function') return window.zeloDoisNomes(n);
    var p = String(n || '').trim().split(/\s+/);
    return p.length > 1 ? p[0] + ' ' + p[p.length - 1] : (p[0] || '');
  }
  function gesto() {
    return !window.ZeloEspera || !window.ZeloEspera.gestoRecente || window.ZeloEspera.gestoRecente(15000);
  }

  var el, nomeEl, horaEl, atual = null;
  function hora(ts) {
    var d = new Date(ts), h = new Date();
    var hh = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    if (d.toDateString() === h.toDateString()) return hh;
    return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + ' ' + hh;
  }
  function mostrar(info) {
    if (!info || !info.ts || !el) return;
    if (atual && atual.ts >= info.ts) return;
    atual = info;
    nomeEl.textContent = info.nome || '—';
    horaEl.textContent = hora(info.ts);
    el.style.display = 'inline-flex';
    try { localStorage.setItem(LS, JSON.stringify(info)); } catch (e) {}
  }

  function criarEtiqueta() {
    if (document.getElementById('last-saved-status')) return false;
    var cab = document.querySelector('.zc-cab');
    var id = cab && cab.querySelector('.zc-id');
    if (!cab || !id) return false;
    el = document.createElement('span');
    el.id = 'last-saved-status';
    el.style.display = 'none';
    el.innerHTML = 'Última alteração: <span id="last-saved-name">—</span> às <span id="last-saved-time">—</span>';
    nomeEl = el.querySelector('#last-saved-name'); horaEl = el.querySelector('#last-saved-time');
    // Lado direito do cabeçalho, antes dos botões: o último bloco com botões
    // que não seja o da identificação (logótipo + nome da página).
    var blocos = Array.prototype.filter.call(cab.querySelectorAll('*'), function (e) {
      return !e.contains(id) && !id.contains(e) && e.parentElement && e.parentElement.contains(id) &&
        e.querySelector('button,a') && !e.classList.contains('zc-deco');
    });
    var dir = cab.querySelector('.zc-acoes') || blocos[blocos.length - 1];
    if (dir) dir.insertBefore(el, dir.firstChild);
    else { el.style.marginLeft = 'auto'; id.parentNode.insertBefore(el, id.nextSibling); }
    try { mostrar(JSON.parse(localStorage.getItem(LS) || 'null')); } catch (e) {}
    if (typeof window.zeloColocarEtiqueta === 'function') window.zeloColocarEtiqueta();
    if (typeof window.zeloUltIniciar === 'function') window.zeloUltIniciar();
    return true;
  }

  // Regista uma alteração feita agora pela pessoa.
  var tRegisto = null, escrever = null;
  function registar() {
    if (!gesto()) return;
    var info = { nome: doisNomes(sessionStorage.getItem('zeloNome') || '') || 'Utilizador', ts: Date.now() };
    mostrar(info);
    clearTimeout(tRegisto);
    tRegisto = setTimeout(function () {
      if (escrever) escrever(CHAVE, info).catch(function () {});
    }, 1200);
  }

  // Envolve as funções de gravação da página (servidor e fila offline).
  function envolver(nome) {
    var f = window[nome];
    if (typeof f !== 'function' || f.__zeloUlt) return;
    var novo = function (path) {
      var r = f.apply(this, arguments);
      try { if (!IGNORAR.test(String(path || ''))) registar(); } catch (e) {}
      return r;
    };
    novo.__zeloUlt = true;
    window[nome] = novo;
    if (nome === 'zeloQueueWrite' && !escrever) escrever = function (p, v) { return Promise.resolve(f(p, v)); };
    if (nome === '__fbSet' && !escrever) escrever = function (p, v) { return Promise.resolve(f(p, v)); };
  }
  var regexLocal = LOCAL[ficheiro];
  if (regexLocal) {
    try {
      var setOrig = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k, v) {
        setOrig.apply(this, arguments);
        try { if (this === window.localStorage && regexLocal.test(String(k)) && k !== LS) registar(); } catch (e) {}
      };
    } catch (e) {}
  }

  var escutando = false;
  function ligar() {
    ['zeloQueueWrite', 'zeloQueueUpdate', '__fbSet', '__fbUpdate'].forEach(envolver);
    if (!escutando && window.__fbReady) {
      escutando = true;
      try {
        if (typeof window.__fbListen === 'function') window.__fbListen(CHAVE, function (v) { mostrar(v && typeof v.val === 'function' ? v.val() : v); });
        else if (typeof window.__fbGet === 'function') window.__fbGet(CHAVE).then(mostrar).catch(function () {});
      } catch (e) {}
    }
  }

  var n = 0;
  var iv = setInterval(function () {
    if (!el) criarEtiqueta();
    ligar();
    if ((el && escutando) || ++n > 60) clearInterval(iv);
  }, 500);
  // As funções podem ser (re)definidas mais tarde pelo módulo Firebase da página.
  setTimeout(ligar, 8000); setTimeout(ligar, 20000);
})();
