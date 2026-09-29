// ── ZELO — Ecrã de espera (inatividade) ──
// Se ninguém mexer no sistema durante 5 minutos (ou 10, 15, 20, 25 — cada
// computador escolhe no próprio ecrã de espera), aparece um ecrã de espera:
// a fotografia do ecrã de entrada ao fundo e, ao centro, o logótipo do ZELO a
// montar-se peça a peça, como um puzzle. No fim de cada montagem aparece o
// nome do serviço da página (não "ZELO"), com a data e a hora.
// Basta mexer o rato, tocar no ecrã ou carregar numa tecla para voltar — a
// sessão continua aberta e nada do que estava no ecrã se perde.
// Não usa o Firebase (não gasta downloads nem gravações).
(function () {
  'use strict';
  if (window.__zeloProtecaoEcra || window.self !== window.top) return;
  window.__zeloProtecaoEcra = true;

  var OPCOES = [5, 10, 15, 20, 25];
  var LS = 'zeloEsperaMin';
  var N = 4;               // puzzle 4 × 4 = 16 peças
  var ultimo = Date.now(), aberto = null, ciclo = null, relogio = null, aSair = false;

  function minutos() { var v = 5; try { v = parseInt(localStorage.getItem(LS), 10); } catch (e) {} return OPCOES.indexOf(v) >= 0 ? v : 5; }
  function logado() { try { return !!sessionStorage.getItem('zeloNome'); } catch (e) { return false; } }
  function ocupado() {
    // Não interrompe: ecrã de entrada, vídeo de instruções ou voz do assistente a falar.
    var gate = document.getElementById('zeloAuthGate');
    if (gate && gate.offsetParent !== null && getComputedStyle(gate).display !== 'none') return true;
    if (document.querySelector('.vm-ov')) return true;
    try { if (window.speechSynthesis && speechSynthesis.speaking) return true; } catch (e) {}
    return false;
  }
  function servico() {
    var b = document.querySelector('.zc-cab .zc-pag b');
    var t = b && b.textContent.trim();
    if (!t) { var p = document.title.split(/\s+[—–-]\s+/); t = p.length > 1 ? p[p.length - 1].trim() : ''; }
    if (!t || /^zelo$/i.test(t)) t = 'Hospital do Prenda';
    return t;
  }
  function logo() { return fundo().replace(/login_bg\.jpg$/, 'logo.png'); }
  function fundo() {
    var s = document.querySelector('script[src*="zelo_protecao_ecra.js"]');
    return s ? s.src.replace(/zelo_protecao_ecra\.js.*$/, 'icons/login_bg.jpg') : 'icons/login_bg.jpg';
  }

  var css =
    '#zpe{position:fixed;inset:0;z-index:2147483600;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;opacity:0;transition:opacity .6s ease;' +
    'font-family:Inter,"Segoe UI",Arial,sans-serif;color:#fff;overflow:hidden;cursor:none;user-select:none;-webkit-user-select:none}' +
    '#zpe.on{opacity:1}' +
    '#zpe .zpe-bg{position:absolute;inset:-30px;background-size:cover;background-position:right center;filter:blur(3px) saturate(1.05);transform:scale(1.04);animation:zpeZoom 40s ease-in-out infinite alternate}' +
    '#zpe .zpe-veu{position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(13,27,46,.55) 0%,rgba(8,15,28,.86) 70%,rgba(5,10,20,.95) 100%)}' +
    '#zpe .zpe-cont{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;padding:20px;text-align:center}' +
    '#zpe .zpe-puz{position:relative;width:min(46vmin,260px);height:min(46vmin,260px);margin-bottom:26px}' +
    '#zpe .zpe-halo{position:absolute;inset:-18%;border-radius:50%;background:radial-gradient(circle,rgba(34,211,238,.35) 0%,rgba(34,211,238,0) 65%);opacity:0;transition:opacity 1.2s ease}' +
    '#zpe.montado .zpe-halo{opacity:1;animation:zpePulso 3s ease-in-out infinite}' +
    '#zpe .zpe-p{position:absolute;background-repeat:no-repeat;border-radius:6px;box-shadow:0 6px 18px rgba(0,0,0,.45),inset 0 0 0 1px rgba(255,255,255,.18);' +
    'transition:transform 1.1s cubic-bezier(.2,.8,.2,1),opacity .9s ease,border-radius .6s ease,box-shadow .6s ease;will-change:transform,opacity}' +
    '#zpe.montado .zpe-p{border-radius:0;box-shadow:none}#zpe.montado .zpe-p:not(.tl):not(.tr):not(.bl):not(.br){border-radius:0}' +
    '#zpe .zpe-p.tl{border-top-left-radius:75%!important}#zpe .zpe-p.tr{border-top-right-radius:75%!important}#zpe .zpe-p.bl{border-bottom-left-radius:75%!important}#zpe .zpe-p.br{border-bottom-right-radius:75%!important}' +
    '#zpe.montado .zpe-puz{filter:drop-shadow(0 10px 30px rgba(0,0,0,.5))}' +
    '#zpe .zpe-serv{font-size:clamp(1.7rem,4.6vw,3.2rem);font-weight:900;letter-spacing:-.01em;line-height:1.1;text-shadow:0 4px 24px rgba(0,0,0,.7);opacity:0;transform:translateY(14px);transition:opacity .8s ease,transform .8s ease;max-width:90vw}' +
    '#zpe.montado .zpe-serv{opacity:1;transform:none}' +
    '#zpe .zpe-linha{width:0;height:3px;border-radius:3px;background:linear-gradient(90deg,transparent,#22D3EE,transparent);margin:14px auto 12px;transition:width 1s ease .2s}' +
    '#zpe.montado .zpe-linha{width:min(60vw,320px)}' +
    '#zpe .zpe-hora{font-size:clamp(2.2rem,6vw,3.6rem);font-weight:300;font-variant-numeric:tabular-nums;letter-spacing:.04em;text-shadow:0 2px 16px rgba(0,0,0,.6)}' +
    '#zpe .zpe-data{font-size:.95rem;color:#BFF3FF;margin-top:4px}' +
    '#zpe .zpe-dica{position:absolute;bottom:34px;left:0;right:0;z-index:1;text-align:center;font-size:.85rem;color:rgba(255,255,255,.75);animation:zpeDica 2.8s ease-in-out infinite}' +
    '#zpe .zpe-min{position:absolute;top:18px;right:18px;z-index:2;display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end;font-size:.72rem;color:rgba(255,255,255,.7);cursor:default}' +
    '#zpe .zpe-min button{cursor:pointer;border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.08);color:#fff;border-radius:999px;padding:4px 10px;font:700 .72rem Inter,Arial,sans-serif}' +
    '#zpe .zpe-min button.on{background:#22D3EE;border-color:#22D3EE;color:#0B1220}' +
    '@keyframes zpeZoom{from{transform:scale(1.04)}to{transform:scale(1.12)}}' +
    '@keyframes zpePulso{0%,100%{transform:scale(1);opacity:.75}50%{transform:scale(1.08);opacity:1}}' +
    '@keyframes zpeDica{0%,100%{opacity:.45}50%{opacity:.9}}' +
    '@media(prefers-reduced-motion:reduce){#zpe .zpe-bg{animation:none}#zpe .zpe-p{transition:opacity .4s ease}}';

  function montarDOM() {
    if (!document.getElementById('zpe-css')) { var st = document.createElement('style'); st.id = 'zpe-css'; st.textContent = css; document.head.appendChild(st); }
    var el = document.createElement('div'); el.id = 'zpe'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Ecrã de espera');
    el.innerHTML = '<div class="zpe-bg"></div><div class="zpe-veu"></div>' +
      '<div class="zpe-min" title="Tempo sem atividade até aparecer o ecrã de espera neste computador"><span>Ecrã de espera após</span>' +
      OPCOES.map(function (m) { return '<button type="button" data-min="' + m + '">' + m + ' min</button>'; }).join('') + '</div>' +
      '<div class="zpe-cont"><div class="zpe-puz"><div class="zpe-halo"></div></div><div class="zpe-serv"></div><div class="zpe-linha"></div>' +
      '<div class="zpe-hora"></div><div class="zpe-data"></div></div>' +
      '<div class="zpe-dica">Mova o rato, toque no ecrã ou carregue numa tecla para continuar</div>';
    el.querySelector('.zpe-bg').style.backgroundImage = 'url("' + fundo() + '")';
    el.querySelector('.zpe-serv').textContent = servico();
    var puz = el.querySelector('.zpe-puz'), src = logo();
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
      var p = document.createElement('div'); p.className = 'zpe-p';
      p.style.left = (c * 100 / N) + '%'; p.style.top = (r * 100 / N) + '%';
      p.style.width = 'calc(' + (100 / N) + '% + 1px)'; p.style.height = 'calc(' + (100 / N) + '% + 1px)'; // +1px: sem riscas entre peças
      p.style.backgroundImage = 'url("' + src + '")';
      // O logótipo tem uma margem branca: amplia-se um pouco para as peças
      // mostrarem só o quadrado azul, e as 4 peças dos cantos ficam redondas.
      var K = 1 / 0.9, M = 0.05, B = K * N;
      p.style.backgroundSize = (B * 100) + '% ' + (B * 100) + '%';
      p.style.backgroundPosition = ((M * B + c) / (B - 1) * 100) + '% ' + ((M * B + r) / (B - 1) * 100) + '%';
      if (r === 0 && c === 0) p.classList.add('tl'); if (r === 0 && c === N - 1) p.classList.add('tr');
      if (r === N - 1 && c === 0) p.classList.add('bl'); if (r === N - 1 && c === N - 1) p.classList.add('br');
      puz.appendChild(p);
    }
    marcarMin(el);
    el.querySelector('.zpe-min').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-min]'); if (!b) return;
      e.stopPropagation();
      try { localStorage.setItem(LS, b.dataset.min); } catch (x) {}
      marcarMin(el);
    });
    return el;
  }
  function marcarMin(el) {
    var m = minutos();
    Array.prototype.forEach.call(el.querySelectorAll('.zpe-min button'), function (b) { b.classList.toggle('on', +b.dataset.min === m); });
  }
  function espalhar(el, instantaneo) {
    el.classList.remove('montado');
    Array.prototype.forEach.call(el.querySelectorAll('.zpe-p'), function (p) {
      var ang = Math.random() * Math.PI * 2, dist = 180 + Math.random() * 260;
      if (instantaneo) p.style.transition = 'none';
      p.style.transform = 'translate(' + Math.round(Math.cos(ang) * dist) + 'px,' + Math.round(Math.sin(ang) * dist) + 'px) rotate(' + Math.round(Math.random() * 540 - 270) + 'deg) scale(.55)';
      p.style.opacity = '0';
      if (instantaneo) { void p.offsetWidth; p.style.transition = ''; }
    });
  }
  function montar(el) {
    var ps = Array.prototype.slice.call(el.querySelectorAll('.zpe-p'));
    // Ordem aleatória: cada peça encaixa no seu lugar, uma a seguir à outra.
    ps.sort(function () { return Math.random() - 0.5; }).forEach(function (p, i) {
      setTimeout(function () { if (aberto !== el) return; p.style.opacity = '1'; p.style.transform = 'none'; }, 250 + i * 150);
    });
    setTimeout(function () { if (aberto === el) el.classList.add('montado'); }, 250 + ps.length * 150 + 900);
  }
  function tic(el) {
    var d = new Date();
    el.querySelector('.zpe-hora').textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    var tx = d.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    el.querySelector('.zpe-data').textContent = tx.charAt(0).toUpperCase() + tx.slice(1);
  }
  function abrir() {
    if (aberto || !logado() || ocupado() || !document.body) return;
    var el = montarDOM(); aberto = el; aSair = false;
    document.body.appendChild(el);
    tic(el); relogio = setInterval(function () { tic(el); }, 5000);
    espalhar(el, true);
    requestAnimationFrame(function () { el.classList.add('on'); montar(el); });
    // Monta, fica montado uns segundos com o nome do serviço, desmonta e volta a montar.
    ciclo = setInterval(function () {
      if (aberto !== el) return;
      espalhar(el, false);
      setTimeout(function () { if (aberto === el) montar(el); }, 1300);
    }, 12000);
  }
  function fechar() {
    var el = aberto; if (!el || aSair) return;
    aSair = true;
    clearInterval(ciclo); clearInterval(relogio);
    el.classList.remove('on');
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); if (aberto === el) aberto = null; aSair = false; }, 600);
  }
  function atividade(e) {
    ultimo = Date.now();
    if (!aberto) return;
    // Escolher os minutos no próprio ecrã não o fecha.
    if (e && e.target && e.target.closest && e.target.closest('.zpe-min')) return;
    // Pequenos tremores do rato não fecham (só um movimento a sério).
    if (e && e.type === 'mousemove') {
      var mv = Math.abs(e.movementX || 0) + Math.abs(e.movementY || 0);
      if (mv < 4) return;
    }
    // O clique que acorda o ecrã não carrega em nada por baixo.
    if (e && (e.type === 'mousedown' || e.type === 'click' || e.type === 'touchstart' || e.type === 'pointerdown')) { e.preventDefault(); e.stopPropagation(); }
    fechar();
  }
  ['mousemove', 'mousedown', 'pointerdown', 'click', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach(function (t) {
    window.addEventListener(t, atividade, { capture: true, passive: t !== 'mousedown' && t !== 'click' && t !== 'touchstart' && t !== 'pointerdown' });
  });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) ultimo = Math.min(ultimo, Date.now()); });
  setInterval(function () {
    if (aberto || document.hidden) return;
    if (ocupado()) { ultimo = Date.now(); return; }
    if (Date.now() - ultimo >= minutos() * 60000) abrir();
  }, 10000);
  window.ZeloProtecaoEcra = { abrir: abrir, fechar: fechar, minutos: minutos };
})();
