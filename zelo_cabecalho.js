// ── ZELO — Rodapé único em todas as páginas ──
// Mesmo modelo do cabeçalho: degradé azul com a linha de tendência e a linha
// ciano (aqui em cima); à esquerda o logótipo, ZELO e o nome do sistema; à
// direita a versão, os direitos e o suporte. Substitui o rodapé que a página
// já tinha (no mesmo sítio) ou, se não tinha, fica no fim da página.
(function () {
  if (window.__zeloRodape || window.self !== window.top) return;
  var ficheiro = decodeURIComponent((location.pathname.split('/').pop() || 'index.html'));
  if (/^Dashboard\.html$/i.test(ficheiro)) return;
  window.__zeloRodape = true;
  var VERSAO = '3.1';
  window.ZELO_VERSAO = VERSAO;
  var DECO = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 60' preserveAspectRatio='none'%3E%3Cpolyline points='0,46 40,50 80,38 120,42 160,26 200,32 240,16 280,22 320,10 360,15 400,6' fill='none' stroke='%237FD4FF' stroke-width='1.6' vector-effect='non-scaling-stroke'/%3E%3C/svg%3E\")";
  var css = [
    '.zr-rodape{position:relative;overflow:hidden;display:flex !important;align-items:center;justify-content:space-between;gap:14px 24px;flex-wrap:wrap;',
    '  background:linear-gradient(135deg,#111C2B 0%,#2B415E 55%,#3E5C87 100%) !important;border-top:1px solid rgba(34,211,238,.28) !important;',
    '  box-shadow:0 -4px 20px rgba(11,18,32,.18);color:#C7D2E8 !important;padding:16px 26px !important;margin:0 !important;border-radius:0 !important;',
    '  font-family:Inter,"Segoe UI",Arial,sans-serif !important;text-align:left !important;box-sizing:border-box;width:auto;max-width:none !important;flex:0 0 auto !important;min-height:60px;height:auto !important;}',
    '.zr-rodape::before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.3;background:' + DECO + ' center/100% 100% no-repeat;',
    '  -webkit-mask-image:linear-gradient(90deg,transparent 0,transparent 40%,#000 75%);mask-image:linear-gradient(90deg,transparent 0,transparent 40%,#000 75%);}',
    '.zr-rodape > *{position:relative;z-index:1;}',
    '.zr-id{display:flex;align-items:center;gap:11px;min-width:0;}',
    '.zr-id img{width:30px;height:30px;border-radius:8px;flex-shrink:0;box-shadow:0 0 0 1px rgba(255,255,255,.14);}',
    '.zr-zelo{padding-left:10px;border-left:3px solid #22D3EE;font-size:1.05rem;line-height:1;font-weight:900;letter-spacing:.22em;color:#fff;',
    '  text-shadow:0 0 10px rgba(34,211,238,.45);white-space:nowrap;}',
    '.zr-sep{width:1px;align-self:stretch;min-height:26px;background:rgba(255,255,255,.18);flex-shrink:0;}',
    '.zr-txt{display:flex;flex-direction:column;gap:2px;line-height:1.2;min-width:0;}',
    '.zr-txt small{font-size:.58rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#BFF3FF;}',
    '.zr-txt b{font-size:.84rem;font-weight:800;color:#fff;}',
    '.zr-meta{display:flex;align-items:center;gap:8px 16px;flex-wrap:wrap;font-size:.7rem;color:#AFC0DD;}',
    '.zr-meta span{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;}',
    '.zr-meta svg{width:13px;height:13px;flex-shrink:0;stroke:#7FD4FF;}',
    '.zr-versao{padding:3px 9px;border-radius:999px;background:rgba(34,211,238,.14);border:1px solid rgba(34,211,238,.35);color:#BFF3FF !important;',
    '  font-weight:800;font-size:.66rem;letter-spacing:.06em;}',
    '.zr-antigo{display:none !important;}',
    '@media(max-width:700px){.zr-rodape{padding:14px 16px !important;flex-direction:column;align-items:flex-start;}.zr-meta{gap:6px 12px;}.zr-meta span{white-space:normal;}}'
  ].join('\n');
  var ICO = {
    suporte: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M15 9.35a4 4 0 1 0 0 5.3"/></svg>',
    acesso: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
  };
  function montar() {
    var st = document.createElement('style'); st.id = 'zr-estilos'; st.textContent = css; document.head.appendChild(st);
    // <div> e não <footer>: as regras "footer{…}" de cada página não o afetam.
    var f = document.createElement('div');
    f.className = 'zr-rodape';
    f.setAttribute('role', 'contentinfo');
    f.innerHTML =
      '<div class="zr-id"><img alt="ZELO" src="icons/logo.png"><div class="zr-zelo">ZELO</div><div class="zr-sep"></div>' +
      '<div class="zr-txt"><small>Sistema Estatístico e Gestão de Ocorrências</small><b>Hospital do Prenda</b></div></div>' +
      '<div class="zr-meta"><span class="zr-versao">Versão ' + VERSAO + '</span>' +
      '<span>' + ICO.copy + new Date().getFullYear() + ' · Todos os direitos reservados</span>' +
      '<span>' + ICO.suporte + 'Suporte: contacte um Administrador do ZELO</span></div>';
    // Rodapé antigo da página: o novo fica no lugar dele (mantém o layout),
    // a não ser que esteja dentro de uma coluna estreita.
    var antigos = Array.prototype.filter.call(document.querySelectorAll('footer,.zelo-foot,.app-footer,.pagefoot,#rodape,#app-footer'), function (e) {
      return e !== f && !e.closest('.ze-camada,[role="dialog"],.modal,dialog') && !(e.parentElement && e.parentElement.closest('footer,.zelo-foot,.app-footer,.pagefoot'));
    });
    var alvo = antigos[0];
    // Página inicial: o último acesso continua no rodapé.
    var ultimo = document.getElementById('zeloUltimoAcessoFooter');
    if (ultimo) { var sp = document.createElement('span'); sp.innerHTML = ICO.acesso; sp.appendChild(ultimo); f.querySelector('.zr-meta').appendChild(sp); }
    var largo = alvo && alvo.getBoundingClientRect().width >= window.innerWidth * 0.9 - 300;
    antigos.forEach(function (e) { e.classList.add('zr-antigo'); });
    if (largo) {
      if (alvo.classList.contains('zelo-footer')) f.classList.add('zelo-footer');
      alvo.parentNode.insertBefore(f, alvo);
      // Dentro de um contentor com margens interiores: estica até às bordas.
      var pai = alvo.parentNode;
      if (pai && pai !== document.body) {
        var cp = getComputedStyle(pai);
        var pl = parseFloat(cp.paddingLeft) || 0, pr = parseFloat(cp.paddingRight) || 0;
        if (pl || pr) { f.style.setProperty('margin-left', -pl + 'px', 'important'); f.style.setProperty('margin-right', -pr + 'px', 'important'); f.style.setProperty('align-self', 'stretch', 'important'); f.style.setProperty('max-width', 'none', 'important'); }
      }
    } else {
      document.body.appendChild(f);
    }
    // Página curta: o rodapé desce até ao fundo do ecrã.
    var agendado = false;
    function encostar() {
      agendado = false;
      f.style.removeProperty('margin-top');
      var falta = window.innerHeight - (f.getBoundingClientRect().bottom + window.scrollY);
      var docH = document.documentElement.scrollHeight;
      if (falta > 0 && docH <= window.innerHeight + 1) f.style.setProperty('margin-top', Math.floor(falta) + 'px', 'important');
    }
    function pedir() { if (!agendado) { agendado = true; requestAnimationFrame(encostar); } }
    encostar();
    window.addEventListener('resize', pedir);
    if (window.ResizeObserver) new ResizeObserver(pedir).observe(document.body);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
  else montar();
})();

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
    '@media(max-width:600px){.zc-cab{flex-wrap:wrap !important;height:auto !important;row-gap:8px !important;}.zc-acoes{flex-wrap:wrap !important;justify-content:flex-end !important;max-width:100% !important;min-width:0 !important;row-gap:6px !important;margin-left:auto !important;}}',
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
    // Telemóvel: os botões do cabeçalho passam para a linha seguinte em vez
    // de saírem do ecrã.
    Array.prototype.forEach.call(h.children, function (c) {
      if (c === deco || c.contains(bloco)) return;
      if (getComputedStyle(c).display.indexOf('flex') >= 0 && c.querySelector('button,a')) c.classList.add('zc-acoes');
    });
    clarearTexto(h);
    return true;
  }

  function iniciar() {
    var st = document.createElement('style'); st.id = 'zc-estilos'; st.textContent = css;
    document.head.appendChild(st);
    // "Última alteração": sempre logo a seguir ao nome do serviço (nunca à
    // esquerda do logótipo). No telemóvel, zelo_menu_flutuante.js trata dela.
    function colocarEtiqueta() {
      var el = document.getElementById('last-saved-status'), id = document.querySelector('.zc-cab .zc-id');
      if (!el || !id || window.innerWidth <= 760) return;
      if (document.getElementById('zelo-ult-slot') && document.getElementById('zelo-ult-slot').contains(el)) return;
      if (el.parentNode === id && id.lastElementChild === el) return;
      id.appendChild(el);
      el.style.setProperty('margin-left', '14px', 'important');
      el.style.setProperty('flex-shrink', '0', 'important');
    }
    window.zeloColocarEtiqueta = colocarEtiqueta;
    // "Terminar sessão" é sempre o último botão do cabeçalho.
    function sairEmUltimo() {
      var cab = document.querySelector('.zc-cab'); if (!cab) return;
      var b = Array.prototype.filter.call(cab.querySelectorAll('button,a'), function (e) {
        return /terminar sess/i.test(e.textContent || '') || /terminar sess/i.test(e.getAttribute('title') || '') || /zeloLogout/.test(e.getAttribute('onclick') || '');
      })[0];
      if (!b) return;
      // Último botão/ligação visível do cabeçalho (pode estar noutro bloco).
      var todos = Array.prototype.filter.call(cab.querySelectorAll('button,a'), function (e) {
        return e.getClientRects().length && !e.closest('.zc-id') && !e.closest('#last-saved-status');
      });
      var ult = todos[todos.length - 1];
      if (!ult || ult === b) return;
      ult.parentNode.insertBefore(b, ult.nextSibling);
    }
    [300, 1500, 4000].forEach(function (ms) { setTimeout(sairEmUltimo, ms); });
    [400, 1500, 4000, 8000].forEach(function (ms) { setTimeout(colocarEtiqueta, ms); });
    if (aplicar()) return;
    // Cabeçalhos que só aparecem depois (ex.: após verificar a sessão).
    var n = 0, iv = setInterval(function () { if (aplicar() || ++n > 20) clearInterval(iv); }, 300);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
