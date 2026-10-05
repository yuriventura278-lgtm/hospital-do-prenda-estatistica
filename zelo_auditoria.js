// ── ZELO — Histórico de registos (quem registou / editou o quê, e quando) ──
// Em todas as páginas de registo: cada gravação feita por uma pessoa fica
// anotada — hora, nome, o que registou ou editou (campo: antes → depois) — em
//   auditoria_registos/<página>/<AAAA-MM-DD>/<id>
// As regras do Firebase só deixam CRIAR anotações novas: ninguém as pode
// alterar nem apagar (nem pelo sistema, nem por outro utilizador).
// No menu da página, "Histórico de registos" mostra, para o dia escolhido,
// todas as pessoas que registaram por ordem (da primeira à última) e cada
// alteração que fizeram.
// Poupança do Firebase: nada é descarregado para anotar (o "antes" vem dos
// dados que a página já leu); a consulta lê só o dia escolhido.
(function () {
  'use strict';
  if (window.__zeloAuditoria || window.self !== window.top) return;
  window.__zeloAuditoria = true;

  var ficheiro = decodeURIComponent((location.pathname.split('/').pop() || 'index.html'));
  var SEM_HIST = /^(index|servicos|sistemas_independentes|bancos_index|informacoes_zelo|Dashboard|procedimentos_enfermagem_index|perfil|fluxograma_relatorio|relatorios_anuais|testagem_vih_estatistica)\.html$/i;
  var RAIZ = 'auditoria_registos';
  // Caminhos que não são registos de dados (sessões, presenças, etiquetas…).
  var IGNORAR = /^(auditoria_registos|registos_sistemas_locais\/ultimas_alteracoes|users\/[^/]+\/(ultimo|last|online|sess|presen)|presenca|sessoes|logs|audit\/|avisos_lidos|zelo_presenca)/i;
  // Chaves técnicas que não interessam a quem lê o histórico.
  var TECNICAS = /^(savedAt|camposTs|updatedAt|ts|_ts|__ts|criadoPor|autor|ultimaAlteracao|lastModified|_meta|historico|__auto|__manual|__camasEmprestadas|__camasPredef|__fundido|nextN|v)$/;

  function paginaChave() {
    var p = window.CP_UCI ? 'controlo_pacientes_' + window.CP_UCI.slug : ficheiro.replace(/\.html$/i, '');
    return p.replace(/[.#$\[\]\/]/g, '_');
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  function diaDe(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function clone(v) { try { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); } catch (e) { return undefined; } }
  function vazio(v) { return v === null || v === undefined || v === ''; }

  // ── Cache do que a página leu/gravou (o "antes" de cada alteração) ──
  var cache = {};
  function limparCaminho(p) { return String(p || '').replace(/^\/+|\/+$/g, ''); }
  function guardarCache(path, v) {
    path = limparCaminho(path);
    try { if (JSON.stringify(v || null).length > 3000000) return; } catch (e) { return; }
    cache[path] = clone(v);
    // Mantém os antepassados já em cache coerentes.
    Object.keys(cache).forEach(function (k) {
      if (k !== path && path.indexOf(k + '/') === 0) {
        var resto = path.slice(k.length + 1).split('/'), o = cache[k];
        if (!o || typeof o !== 'object') return;
        for (var i = 0; i < resto.length - 1; i++) { if (!o[resto[i]] || typeof o[resto[i]] !== 'object') o[resto[i]] = {}; o = o[resto[i]]; }
        if (v === null || v === undefined) delete o[resto[resto.length - 1]]; else o[resto[resto.length - 1]] = clone(v);
      }
    });
  }
  function lerCache(path) {
    path = limparCaminho(path);
    if (path in cache) return { ok: true, v: cache[path] };
    var melhor = null;
    Object.keys(cache).forEach(function (k) { if (path.indexOf(k + '/') === 0 && (!melhor || k.length > melhor.length)) melhor = k; });
    if (!melhor) return { ok: false };
    var o = cache[melhor], resto = path.slice(melhor.length + 1).split('/');
    for (var i = 0; i < resto.length; i++) { if (!o || typeof o !== 'object') return { ok: true, v: undefined }; o = o[resto[i]]; }
    return { ok: true, v: o };
  }

  // ── Diferenças (só folhas: números, textos, verdadeiro/falso) ──
  function achatar(v, pref, out, prof) {
    out = out || {}; prof = prof || 0;
    if (v !== null && typeof v === 'object' && prof < 14) {
      Object.keys(v).forEach(function (k) { if (!TECNICAS.test(k)) achatar(v[k], pref ? pref + '/' + k : k, out, prof + 1); });
    } else if (pref && !vazio(v) && typeof v !== 'object') out[pref] = v;
    return out;
  }
  function diferencas(antes, depois) {
    var a = achatar(antes, ''), d = achatar(depois, ''), l = [];
    Object.keys(d).forEach(function (k) { if (String(a[k]) !== String(d[k])) l.push({ c: k, a: k in a ? a[k] : null, d: d[k] }); });
    Object.keys(a).forEach(function (k) { if (!(k in d)) l.push({ c: k, a: a[k], d: null }); });
    return l;
  }

  // ── Anotar ──
  var profundidade = 0, pendentes = [], tEnviar = null, feitos = {};
  function gestoRecente() { return !window.ZeloEspera || !window.ZeloEspera.gestoRecente || window.ZeloEspera.gestoRecente(30000); }
  function quem() {
    var s = sessionStorage;
    return { nome: s.getItem('zeloNome') || 'Utilizador', email: s.getItem('zeloEmail') || '', papel: s.getItem('zeloRole') || '' };
  }
  function anotar(path, alteracoes) {
    if (!alteracoes.length) return;
    var assin = path + '|' + JSON.stringify(alteracoes.slice(0, 20));
    if (feitos[assin] && Date.now() - feitos[assin] < 10 * 60000) return; // reenvio igual (fila offline): não repete
    feitos[assin] = Date.now();
    var registou = alteracoes.every(function (x) { return vazio(x.a); });
    var apagou = alteracoes.every(function (x) { return vazio(x.d); });
    pendentes.push({ path: path, alt: alteracoes, acao: registou ? 'registou' : apagou ? 'limpou' : 'editou' });
    clearTimeout(tEnviar); tEnviar = setTimeout(enviar, 1500);
  }
  // Várias gravações seguidas (ex.: um formulário com várias partes) numa só anotação.
  function enviar() {
    if (!pendentes.length) return;
    var lote = pendentes; pendentes = [];
    var q = quem(), agora = new Date(), alt = [], caminhos = [], acoes = {};
    lote.forEach(function (p) { caminhos.indexOf(p.path) < 0 && caminhos.push(p.path); acoes[p.acao] = 1; p.alt.forEach(function (x) { alt.push({ c: x.c, a: x.a, d: x.d, p: p.path }); }); });
    var MAX = 80;
    var reg = {
      ts: agora.getTime(), hora: pad(agora.getHours()) + ':' + pad(agora.getMinutes()) + ':' + pad(agora.getSeconds()),
      nome: q.nome, email: q.email, papel: q.papel, pagina: document.title.replace(/^ZELO\s*[—–-]\s*/i, ''),
      acao: acoes.editou || (acoes.registou && acoes.limpou) ? 'editou' : acoes.registou ? 'registou' : 'limpou',
      caminhos: caminhos.slice(0, 10), n: alt.length,
      alteracoes: alt.slice(0, MAX).map(function (x) { return { c: String(x.c).slice(0, 200), a: vazio(x.a) ? '' : String(x.a).slice(0, 300), d: vazio(x.d) ? '' : String(x.d).slice(0, 300), p: x.p }; })
    };
    var id = agora.getTime().toString(36) + Math.random().toString(36).slice(2, 7);
    var caminho = RAIZ + '/' + paginaChave() + '/' + diaDe(agora) + '/' + id;
    try {
      if (origQueue) origQueue(caminho, reg);
      else if (origSet) origSet(caminho, reg);
    } catch (e) {}
    // Cópia local (o histórico mostra-a enquanto não chega ao servidor).
    try {
      var k = 'zeloAud_' + paginaChave() + '_' + diaDe(agora), l = JSON.parse(localStorage.getItem(k) || '{}');
      l[id] = reg; localStorage.setItem(k, JSON.stringify(l));
    } catch (e) {}
  }
  function aoGravar(path, valor, parcial) {
    path = limparCaminho(path);
    if (!path || IGNORAR.test(path) || !gestoRecente()) return;
    var alts = [];
    if (parcial && valor && typeof valor === 'object') {
      Object.keys(valor).forEach(function (k) {
        var p = path + '/' + limparCaminho(k), antes = lerCache(p);
        diferencas(antes.ok ? antes.v : undefined, valor[k]).forEach(function (x) { alts.push({ c: (limparCaminho(k) + (x.c ? '/' + x.c : '')), a: antes.ok ? x.a : null, d: x.d }); });
      });
    } else {
      var antes = lerCache(path);
      diferencas(antes.ok ? antes.v : undefined, valor).forEach(function (x) { alts.push({ c: x.c || path.split('/').pop(), a: antes.ok ? x.a : null, d: x.d }); });
    }
    anotar(path, alts);
  }

  // ── Envolver as funções de leitura/gravação da página ──
  var origSet = null, origQueue = null;
  function embrulhar(nome, tipo) {
    var atual = window[nome];
    function envolver(f) {
      if (typeof f !== 'function' || f.__zaud) return f;
      var w = function (a, b) {
        var topo = profundidade === 0;
        if (tipo === 'escrita' || tipo === 'parcial') {
          if (topo) try { aoGravar(a, b, tipo === 'parcial'); } catch (e) {}
          try { if (tipo === 'escrita') guardarCache(a, b); else if (b && typeof b === 'object') Object.keys(b).forEach(function (k) { guardarCache(limparCaminho(a) + '/' + limparCaminho(k), b[k]); }); } catch (e) {}
        }
        profundidade++;
        var r;
        try { r = f.apply(this, arguments); } finally { profundidade--; }
        if (tipo === 'get' && r && typeof r.then === 'function') r.then(function (v) { try { if (!(limparCaminho(a) in cache)) guardarCache(a, v); } catch (e) {} }, function () {});
        return r;
      };
      if (tipo === 'escuta') {
        w = function (path, cb) {
          var args = Array.prototype.slice.call(arguments);
          if (typeof cb === 'function') args[1] = function (v) { try { guardarCache(path, v); } catch (e) {} return cb.apply(this, arguments); };
          return f.apply(this, args);
        };
      }
      w.__zaud = true;
      if (nome === '__fbSet') origSet = f;
      if (nome === 'zeloQueueWrite') origQueue = f;
      return w;
    }
    // Já há outro envoltório com get/set (ex.: zelo_consumo.js, medidor de
    // downloads): este fica por fora dele, sem o apagar.
    var ant = Object.getOwnPropertyDescriptor(window, nome);
    if (ant && typeof ant.get === 'function' && typeof ant.set === 'function') {
      var g2 = envolver(ant.get());
      try {
        Object.defineProperty(window, nome, {
          configurable: true, enumerable: true,
          get: function () { return g2; },
          set: function (v) { ant.set.call(window, v); g2 = envolver(ant.get()); }
        });
        return;
      } catch (e) {}
    }
    var guardado = envolver(atual);
    try {
      Object.defineProperty(window, nome, {
        configurable: true, enumerable: true,
        get: function () { return guardado; },
        set: function (v) { guardado = envolver(v); }
      });
    } catch (e) { window[nome] = guardado; }
  }
  embrulhar('__fbGet', 'get');
  embrulhar('__fbListen', 'escuta');
  embrulhar('__fbSet', 'escrita');
  embrulhar('zeloQueueWrite', 'escrita');
  embrulhar('__fbUpdate', 'parcial');
  embrulhar('zeloQueueUpdate', 'parcial');

  // ── Consulta: "Histórico de registos" ──
  function humano(c) {
    return String(c || '').split('/').filter(function (s) { return s && s !== 'snapshot'; }).map(function (s) {
      try { s = decodeURIComponent(s); } catch (e) {}
      return s.replace(/_/g, ' ').replace(/([a-zà-ú])([A-Z])/g, '$1 $2').replace(/^\w/, function (x) { return x.toUpperCase(); });
    }).join(' › ');
  }
  var css =
    '#zaud-ov{position:fixed;inset:0;z-index:2147482500;background:rgba(15,23,42,.55);backdrop-filter:blur(4px);display:flex;align-items:flex-start;justify-content:center;padding:4vh 14px;overflow:auto;font-family:Inter,"Segoe UI",Arial,sans-serif}' +
    '#zaud-ov .zb{background:#fff;border-radius:16px;width:100%;max-width:980px;box-shadow:0 24px 60px rgba(0,0,0,.3);overflow:hidden;color:#0F172A}' +
    '#zaud-ov .zh{background:linear-gradient(135deg,#111C2B,#2B415E 55%,#3E5C87);color:#fff;padding:16px 20px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}' +
    '#zaud-ov .zh b{font-size:1.05rem;display:block}#zaud-ov .zh small{font-size:.75rem;color:#BFF3FF}' +
    '#zaud-ov .zh input{margin-left:auto;padding:7px 10px;border-radius:8px;border:none;font:600 .9rem Inter,Arial,sans-serif}' +
    '#zaud-ov .zh button{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.3);color:#fff;border-radius:8px;padding:7px 12px;cursor:pointer;font:700 .8rem Inter,Arial,sans-serif}' +
    '#zaud-ov .zc{padding:16px 20px 20px}' +
    '#zaud-ov .zn{font-size:.78rem;color:#475569;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:10px 12px;margin-bottom:14px}' +
    '#zaud-ov .zp{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}' +
    '#zaud-ov .zp span{background:#EFF6FF;border:1px solid #BFDBFE;color:#1E3A8A;border-radius:999px;padding:5px 12px;font-size:.8rem;font-weight:700}' +
    '#zaud-ov .ze{border:1px solid #E2E8F0;border-radius:12px;margin-bottom:10px;overflow:hidden}' +
    '#zaud-ov .ze summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 14px;background:#F8FAFC}' +
    '#zaud-ov .ze summary::-webkit-details-marker{display:none}' +
    '#zaud-ov .zi{width:26px;height:26px;border-radius:50%;background:#1E3A5F;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:.75rem;flex-shrink:0}' +
    '#zaud-ov .zt{font-family:"JetBrains Mono",ui-monospace,monospace;font-weight:700;color:#334155}' +
    '#zaud-ov .zq{font-weight:800}' +
    '#zaud-ov .za{border-radius:999px;padding:2px 10px;font-size:.72rem;font-weight:800}' +
    '#zaud-ov .za.registou{background:#DCFCE7;color:#166534}#zaud-ov .za.editou{background:#FEF3C7;color:#92400E}#zaud-ov .za.limpou{background:#FEE2E2;color:#991B1B}' +
    '#zaud-ov .zd{padding:0 14px 12px;overflow-x:auto}' +
    '#zaud-ov table{width:100%;border-collapse:collapse;font-size:.82rem;margin-top:8px}' +
    '#zaud-ov th{text-align:left;font-size:.66rem;text-transform:uppercase;letter-spacing:.08em;color:#64748B;padding:6px 8px;border-bottom:2px solid #E2E8F0}' +
    '#zaud-ov td{padding:6px 8px;border-bottom:1px solid #F1F5F9;vertical-align:top}' +
    '#zaud-ov td.an{color:#991B1B;text-decoration:line-through;text-decoration-color:rgba(153,27,27,.4)}#zaud-ov td.de{color:#166534;font-weight:700}' +
    '#zaud-ov .zv{text-align:center;color:#64748B;padding:30px 10px}';
  function abrir(dia) {
    var pag = paginaChave(), ov = document.getElementById('zaud-ov');
    if (!document.getElementById('zaud-css')) { var st = document.createElement('style'); st.id = 'zaud-css'; st.textContent = css; document.head.appendChild(st); }
    if (!ov) {
      ov = document.createElement('div'); ov.id = 'zaud-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'Histórico de registos');
      ov.innerHTML = '<div class="zb"><div class="zh"><div><b>Histórico de registos</b><small>' + esc(document.title.replace(/^ZELO\s*[—–-]\s*/i, '')) + '</small></div>' +
        '<input type="date" id="zaud-dia" aria-label="Dia"><button type="button" id="zaud-fechar">Fechar</button></div><div class="zc" id="zaud-c"></div></div>';
      document.body.appendChild(ov);
      ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
      ov.querySelector('#zaud-fechar').onclick = function () { ov.remove(); };
      ov.querySelector('#zaud-dia').onchange = function () { carregar(this.value); };
      document.addEventListener('keydown', function esc2(e) { if (e.key === 'Escape' && document.getElementById('zaud-ov')) { ov.remove(); document.removeEventListener('keydown', esc2); } });
    }
    dia = dia || diaDe(new Date());
    ov.querySelector('#zaud-dia').value = dia;
    carregar(dia);
    function carregar(d) {
      var c = ov.querySelector('#zaud-c');
      c.innerHTML = '<div class="zv">A carregar…</div>';
      var local = {};
      try { local = JSON.parse(localStorage.getItem('zeloAud_' + pag + '_' + d) || '{}'); } catch (e) {}
      var ler = typeof window.__fbGet === 'function' ? window.__fbGet(RAIZ + '/' + pag + '/' + d).catch(function () { return null; }) : Promise.resolve(null);
      ler.then(function (v) {
        var todos = {}; Object.keys(local).forEach(function (k) { todos[k] = local[k]; }); Object.keys(v || {}).forEach(function (k) { todos[k] = v[k]; });
        var l = Object.keys(todos).map(function (k) { return todos[k]; }).filter(function (x) { return x && x.ts; }).sort(function (a, b) { return a.ts - b.ts; });
        l.forEach(function (x) { var al = x.alteracoes; if (al && !Array.isArray(al)) x.alteracoes = Object.keys(al).sort(function (a, b) { return a - b; }).map(function (k) { return al[k]; }); });
        var pessoas = [];
        l.forEach(function (x) { if (!pessoas.some(function (p) { return p.nome === x.nome; })) pessoas.push({ nome: x.nome, hora: x.hora }); });
        var h = '<div class="zn">Todas as gravações feitas nesta página no dia <b>' + d.split('-').reverse().join('/') + '</b>, da primeira à última: quem registou ou editou, a hora e o que mudou (antes → depois). ' +
          'Este histórico não pode ser alterado nem apagado por ninguém.</div>';
        if (!l.length) { c.innerHTML = h + '<div class="zv">Nenhum registo nesta página neste dia.</div>'; return; }
        h += '<div class="zp">' + pessoas.map(function (p, i) { return '<span>' + (i + 1) + '. ' + esc(p.nome) + ' · ' + esc(p.hora || '') + '</span>'; }).join('') + '</div>';
        h += l.map(function (x, i) {
          var lin = (x.alteracoes || []).map(function (a) {
            var reg = /\d{4}-\d{2}-\d{2}/.exec(a.p || '');
            return '<tr><td>' + esc(humano(a.c)) + (reg ? ' <small style="color:#64748B">(registo de ' + reg[0].split('-').reverse().join('/') + ')</small>' : '') + '</td><td class="an">' + esc(a.a === '' ? '—' : a.a) + '</td><td class="de">' + esc(a.d === '' ? '—' : a.d) + '</td></tr>';
          }).join('');
          return '<details class="ze"' + (i === l.length - 1 ? ' open' : '') + '><summary><span class="zi">' + (i + 1) + '</span><span class="zt">' + esc(x.hora || '') + '</span><span class="zq">' + esc(x.nome || '—') + '</span>' +
            '<span class="za ' + esc(x.acao) + '">' + esc(x.acao || '') + '</span><span style="color:#64748B;font-size:.8rem">' + (x.n || 0) + ' alteraç' + (x.n === 1 ? 'ão' : 'ões') + (x.n > (x.alteracoes || []).length ? ' (mostradas ' + (x.alteracoes || []).length + ')' : '') + '</span></summary>' +
            '<div class="zd"><table><thead><tr><th>Campo</th><th>Antes</th><th>Depois</th></tr></thead><tbody>' + lin + '</tbody></table></div></details>';
        }).join('');
        c.innerHTML = h;
      });
    }
  }
  window.ZeloAuditoria = { abrir: abrir, _cache: cache };

  function juntarAoMenu() {
    if (SEM_HIST.test(ficheiro) || !window.ZELO_MODULE) return;
    if (!window.ZeloMenuPagina) { setTimeout(juntarAoMenu, 400); return; }
    window.ZeloMenuPagina.adicionar({ id: 'auditoria', rotulo: 'Histórico de registos', icone: 'auditoria', ordem: 90, acao: function () { abrir(); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', juntarAoMenu); else juntarAoMenu();
})();
