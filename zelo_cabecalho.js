// ── ZELO — Cabeçalho único em todas as páginas ──
// Aplica às páginas o cabeçalho da página inicial: fundo em degradé azul com
// a linha de tendência e a linha ciano em baixo; à esquerda o logótipo, ZELO
// e, depois de uma linha fina, o nome da página (ex.: "MOVIMENTO HOSPITALAR"
// pequeno e "Cirurgia Geral" a negrito); à direita a data/hora e os botões
// que a página já tinha.
// Não substitui o cabeçalho de cada página: veste-o. Os botões, campos e
// indicadores (guardado, sincronização, última alteração…) ficam onde estão;
// só o logótipo e o título antigos dão lugar à identificação nova.
(function () {
  if (window.__zeloCabecalho || window.self !== window.top) return;
  window.__zeloCabecalho = true;
  var ficheiro = decodeURIComponent((location.pathname.split('/').pop() || 'index.html'));
  if (/^(index|Dashboard)\.html$/i.test(ficheiro)) return;

  // Páginas que não estão no menu de serviços.
  var EXTRA = {
    'servicos.html': ['Serviços', 'Todos os Serviços'],
    'sistemas_independentes.html': ['Serviço de Estatística', 'Sistemas Locais'],
    'bancos_index.html': ['Serviços', 'Relatório Diário'],
    'procedimentos_enfermagem_index.html': ['Serviços', 'Procedimentos de Enfermagem'],
    'movimento_mensal.html': ['Serviços', 'Movimento Hospitalar'],
    'admin_utilizadores.html': ['Administração', 'Utilizadores e Permissões'],
    'admin_setup.html': ['Administração', 'Configuração Inicial'],
    'perfil.html': ['A Minha Conta', 'O Meu Perfil'],
    'base_dados.html': ['Administração', 'Base de Dados'],
    'informacoes_zelo.html': ['Sobre o sistema', 'Informações'],
    'relatorios_anuais.html': ['Serviço de Estatística', 'Relatórios Anuais'],
    'bloco_operatorio_ficha_operatoria.html': ['Bloco Operatório', 'Ficha Operatória'],
    'psicologia_atendimento.html': ['Psicologia', 'Atendimento'],
    'Estatistica.html': ['Serviço de Estatística', 'Estatística']
  };

  function nomePagina() {
    var menu = window.SERVICOS_MENU || [];
    var achados = [];
    menu.forEach(function (svc) {
      Object.keys(svc).forEach(function (k) {
        if (!Array.isArray(svc[k])) return;
        svc[k].forEach(function (it) { if (it && it.file === ficheiro) achados.push([svc, it]); });
      });
    });
    var achado = null;
    if (achados.length) {
      var svc = achados[0][0], it = achados[0][1];
      var partes = String(it.label).split(/\s+—\s+/);
      if (svc.categoria === 'servico_estatistica') achado = [svc.nome, it.label.replace(/\s*·\s*(Geral|GEPE\/DEMA)$/, '')];
      // "Controlo de Pacientes — UCI" → pequeno "Controlo de Pacientes", grande "UCI"
      else if (partes.length > 1) achado = [partes[0] === 'Movimento' ? 'Movimento Hospitalar' : partes[0], partes.slice(1).join(' — ')];
      // página partilhada por dois serviços (ex.: Medicina Homem e Mulher) → nome do grupo
      else achado = [it.label, achados.length > 1 && svc.grupo ? svc.grupo : svc.nome];
    }
    if (achado) return achado;
    if (EXTRA[ficheiro]) return EXTRA[ficheiro];
    var t = (document.title || '').split(/\s[·|—–-]\s/);
    return ['', (t[0] || 'ZELO').trim()];
  }

  var LOGO = 'icons/logo.png';
  var DECO = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 60' preserveAspectRatio='none'%3E%3Cpolyline points='0,46 40,50 80,38 120,42 160,26 200,32 240,16 280,22 320,10 360,15 400,6' fill='none' stroke='%237FD4FF' stroke-width='1.6' vector-effect='non-scaling-stroke'/%3E%3C/svg%3E\")";
  var css = [
    '.zc-cab{background:linear-gradient(135deg,#111C2B 0%,#2B415E 55%,#3E5C87 100%) !important;background-color:#1B2A3D !important;',
    '  border-bottom:1px solid rgba(34,211,238,.28) !important;box-shadow:0 4px 20px rgba(11,18,32,.35) !important;border-radius:0 !important;',
    '  color:#E7ECFA !important;margin-top:0 !important;-webkit-backdrop-filter:none !important;backdrop-filter:none !important;}',
    '.zc-cab::before,.zc-cab::after{background-image:none !important;}',
    '.zc-deco{position:absolute;inset:0;pointer-events:none;opacity:.35;z-index:0;background:' + DECO + ' center/100% 100% no-repeat;',
    '  -webkit-mask-image:linear-gradient(90deg,transparent 0,transparent 35%,#000 65%);mask-image:linear-gradient(90deg,transparent 0,transparent 35%,#000 65%);}',
    '.zc-id{display:flex;align-items:center;gap:12px;min-width:0;flex:0 0 auto;position:relative;z-index:1;}',
    '.zc-logo{width:34px;height:34px;border-radius:9px;flex-shrink:0;box-shadow:0 0 0 1px rgba(255,255,255,.14);display:block;}',
    '.zc-zelo{padding-left:12px;border-left:3px solid #22D3EE;font-family:Inter,"Segoe UI",Arial,sans-serif;font-size:1.35rem;line-height:1;font-weight:900;',
    '  letter-spacing:.22em;color:#fff !important;text-shadow:0 0 12px rgba(34,211,238,.55),0 1px 6px rgba(0,0,0,.3);white-space:nowrap;}',
    '.zc-sep{width:1px;align-self:stretch;min-height:30px;background:rgba(255,255,255,.18);flex-shrink:0;}',
    '.zc-pag{display:flex;flex-direction:column;gap:2px;min-width:0;font-family:Inter,"Segoe UI",Arial,sans-serif;line-height:1.15;}',
    '.zc-pag small{font-size:.62rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#BFF3FF !important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.zc-pag b{font-size:1rem;font-weight:800;color:#fff !important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.zc-relogio{display:flex;align-items:center;gap:7px;font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:.72rem;color:rgba(255,255,255,.85) !important;white-space:nowrap;padding:0 6px;}',
    '.zc-relogio i{width:7px;height:7px;border-radius:50%;background:#4ADE80;box-shadow:0 0 6px #4ADE80;flex-shrink:0;animation:zcPulso 2.4s ease-in-out infinite;}',
    '@keyframes zcPulso{0%,100%{opacity:1}50%{opacity:.35}}',
    '.zc-oculto{display:none !important;}',
    '@media(max-width:1180px){.zc-relogio{display:none;}}',
    '@media(max-width:1100px){.zc-id{flex:0 1 auto;}}',
    '@media(max-width:760px){.zc-zelo,.zc-sep{display:none;}.zc-id{gap:9px;}.zc-logo{width:30px;height:30px;}.zc-pag b{font-size:.9rem;}.zc-pag small{font-size:.56rem;}}'
  ].join('\n');

  // Elementos que nunca se escondem (indicadores que a página actualiza).
  var PROTEGIDO = '#last-saved-status,[id*="sync"],[class*="sync"],[id*="status"],[class*="status"],[id*="relog"],[id*="clock"],[class*="clock"],[id*="hora"],[id*="Hora"]';
  function interactivo(e) { return !!e.querySelector('button,input,select,textarea,a[href],[onclick]') || /^(BUTTON|INPUT|SELECT|TEXTAREA|A)$/.test(e.tagName) || e.hasAttribute('onclick'); }
  function protegido(e) { return e.matches(PROTEGIDO) || !!e.querySelector(PROTEGIDO); }
  function seguro(e) { return !interactivo(e) && !protegido(e); }

  function acharCabecalho() {
    var sel = ['header', '#topbar', '.topbar', '.top', '.header', '.app-header', '.top-bar'];
    for (var i = 0; i < sel.length; i++) {
      var lista = document.querySelectorAll(sel[i]);
      for (var j = 0; j < lista.length; j++) {
        var e = lista[j], r = e.getBoundingClientRect();
        if (e.closest('#zmf-panel,.ze-camada,#splash,[role="dialog"],.modal')) continue;
        if (r.width >= window.innerWidth * 0.6 && r.height >= 30 && r.height <= 220 && r.top <= 70 && e.querySelector('img')) return e;
      }
    }
    return null;
  }

  function luminancia(cor) {
    var m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/.exec(cor || '');
    if (!m) return { l: 1, a: 1 };
    return { l: (0.299 * m[1] + 0.587 * m[2] + 0.114 * m[3]) / 255, a: m[4] == null ? 1 : +m[4] };
  }
  // Texto escuro sobre fundo transparente passa a claro (fica legível no degradé).
  function clarearTexto(h) {
    var todos = [h].concat(Array.prototype.slice.call(h.querySelectorAll('*')));
    todos.forEach(function (e) {
      if (e.closest('.zc-id,#last-saved-status,input,select,textarea,.zc-fundo-claro')) return;
      var cs = getComputedStyle(e);
      // com fundo próprio claro (botões brancos, pílulas) fica como está
      var bg = luminancia(cs.backgroundColor);
      // botões com fundo branco translúcido: fundo e contorno claros no degradé
      if ((e.tagName === 'BUTTON' || e.tagName === 'A') && bg.a > 0 && bg.a <= 0.35 && bg.l > 0.7) {
        e.style.setProperty('background', 'rgba(255,255,255,.1)', 'important');
        e.style.setProperty('border-color', 'rgba(255,255,255,.22)', 'important');
        e.style.setProperty('color', '#E7ECFA', 'important');
        e.style.setProperty('opacity', '1', 'important');
        return;
      }
      var temFundo = bg.a > 0.35 || (cs.backgroundImage && cs.backgroundImage !== 'none' && e !== h);
      // fundo próprio claro (botão/pílula branca): o texto de dentro fica como está
      if (temFundo && e !== h && bg.a > 0.35 && bg.l > 0.6) { e.classList.add('zc-fundo-claro'); return; }
      if (temFundo) return;
      var c = luminancia(cs.color);
      if (c.l < 0.55) e.style.setProperty('color', '#E7ECFA', 'important');
      var bc = luminancia(cs.borderTopColor);
      if (parseFloat(cs.borderTopWidth) > 0 && bc.l < 0.5 && (e.tagName === 'BUTTON' || e.tagName === 'A')) e.style.setProperty('border-color', 'rgba(255,255,255,.22)', 'important');
    });
  }

  function aplicar() {
    var h = acharCabecalho();
    if (!h || h.classList.contains('zc-cab')) return false;
    var img = null;
    Array.prototype.some.call(h.querySelectorAll('img'), function (i) { var r = i.getBoundingClientRect(); if (r.width <= 90 && r.height <= 90) { img = i; return true; } return false; });
    if (!img) return false;

    // Bloco de identificação antigo: o maior "pai" do logótipo sem botões nem indicadores…
    var id = img;
    var largCab = h.getBoundingClientRect().width;
    // sobe enquanto o "pai" for só identificação — pára numa barra em linha
    // (flex/grid com o conteúdo espalhado), onde depois entram os botões
    function barra(e) {
      var c = getComputedStyle(e);
      return (c.display.indexOf('flex') >= 0 && c.flexDirection.indexOf('column') < 0 && /space|end/.test(c.justifyContent)) ||
             c.display.indexOf('grid') >= 0;
    }
    while (id.parentElement && id.parentElement !== h && seguro(id.parentElement) && !barra(id.parentElement) &&
           id.parentElement.getBoundingClientRect().width < largCab * 0.9) id = id.parentElement;
    var pai = id.parentElement;
    // …e o título que vem logo a seguir (textos sem botões).
    var esconder = [id];
    for (var s = id.nextElementSibling; s; s = s.nextElementSibling) {
      if (!seguro(s) || s.matches('script,style')) break;
      if (!(s.textContent || '').trim() && !s.querySelector('img')) continue;
      esconder.push(s);
    }

    var nome = nomePagina();
    var bloco = document.createElement('div');
    bloco.className = 'zc-id';
    bloco.innerHTML = '<img class="zc-logo" alt="ZELO"><div class="zc-zelo">ZELO</div><div class="zc-sep"></div><div class="zc-pag"><small></small><b></b></div>';
    bloco.querySelector('img').src = LOGO;
    bloco.querySelector('small').textContent = nome[0] || '';
    if (!nome[0]) bloco.querySelector('small').style.display = 'none';
    bloco.querySelector('b').textContent = nome[1] || '';
    pai.insertBefore(bloco, id);
    esconder.forEach(function (e) { e.classList.add('zc-oculto'); });

    // Degradé + linha de tendência
    h.classList.add('zc-cab');
    var pos = getComputedStyle(h).position;
    if (pos === 'static') h.style.position = 'relative';
    var deco = document.createElement('div'); deco.className = 'zc-deco'; deco.setAttribute('aria-hidden', 'true');
    h.insertBefore(deco, h.firstChild);
    Array.prototype.forEach.call(h.children, function (c) {
      if (c === deco) return;
      if (getComputedStyle(c).position === 'static') { c.style.position = 'relative'; c.style.zIndex = '1'; }
    });

    // Data e hora (se o cabeçalho ainda não tiver uma hora).
    if (!/\b\d{1,2}:\d{2}\b|\d{2}\/\d{2}\/\d{4}|\d{1,2} \w{3} \d{4}/.test(h.textContent) && !h.querySelector('input,[id*="relog"],[id*="clock"],[id*="hora"],[id*="time"],[id*="Time"]')) {
      var ultimo = h.lastElementChild;
      if (ultimo && ultimo !== pai && ultimo !== deco && getComputedStyle(ultimo).display.indexOf('flex') >= 0) {
        var rel = document.createElement('div'); rel.className = 'zc-relogio'; rel.innerHTML = '<i></i><span></span>';
        ultimo.insertBefore(rel, ultimo.firstChild);
        var DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'], MES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        var tick = function () { var d = new Date(); rel.querySelector('span').textContent = d.getDate() + ' ' + MES[d.getMonth()] + ' · ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
        tick(); setInterval(tick, 20000);
      }
    }
    // Cabeçalhos altos (ex.: Controlo de Pacientes, Movimento): mais baixos.
    if (h.getBoundingClientRect().height > 90 && /static|relative/.test(pos)) {
      h.style.setProperty('padding-top', '12px', 'important');
      h.style.setProperty('padding-bottom', '12px', 'important');
      Array.prototype.forEach.call(h.children, function (c) { if (c !== deco) { c.style.marginTop = '0'; c.style.marginBottom = '0'; } });
    }
    clarearTexto(h);
    return true;
  }

  function iniciar() {
    var st = document.createElement('style'); st.id = 'zc-estilos'; st.textContent = css;
    document.head.appendChild(st);
    if (aplicar()) return;
    // Cabeçalhos que só aparecem depois (ex.: após verificar a sessão).
    var n = 0, iv = setInterval(function () { if (aplicar() || ++n > 20) clearInterval(iv); }, 300);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
