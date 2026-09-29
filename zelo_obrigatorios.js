// ── ZELO — Idade, género e diagnóstico obrigatórios ──
// Para as páginas de banco/atendimento com fichas de doentes (vítimas,
// óbitos, consultas, casos…). Sem mexer nas funções de cada página:
// • marca os campos de idade, género e diagnóstico com * (tira "opcional");
// • nas fichas novas o género deixa de vir já escolhido (Masculino) — tem de
//   ser escolhido;
// • ao carregar num botão de gravar (Guardar, Registar, Adicionar, Criar,
//   Confirmar…) de uma ficha que tenha estes campos, se algum estiver vazio
//   não grava, destaca o campo e diz o que falta. No diagnóstico conta o CID
//   ou o texto escrito (basta um).
(function () {
  if (window.__zeloObrig) return;
  window.__zeloObrig = true;

  // "Adicionar …" cria uma ficha nova (vazia) — não conta como gravar.
  var BOTAO = /\b(guardar|salvar|gravar|registar|registrar|criar|confirmar|submeter|concluir)\b/i;
  var NAO_BOTAO = /\b(adicionar|cancelar|remover|eliminar|apagar|limpar|editar|fechar|exportar|pdf|imprimir|pesquisar|filtrar|mesmo assim)\b/i;
  // Campos de filtros/pesquisa das listas e painéis (não são fichas de doentes).
  var FILTRO = /fdiag|filtro|filter|filtr|pesq|busca|search|dash|(^|[-_])flt[-_]/i;

  function tipo(el) {
    if (!el || !el.id || !/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) return null;
    var id = el.id;
    if (FILTRO.test(id)) return null;
    if (/(^|[-_])idade($|[-_])/i.test(id) && !/idade[-_](men|mai|menor|maior)/i.test(id) && !/pm-/i.test(id)) return 'idade';
    if (/(^|[-_])(gen|genero|género|sexo)($|[-_])/i.test(id)) return 'genero';
    // Diagnóstico escrito, ou CID (Banco de Urgência: …-c0-code / …-c0-srch; …-dman = manual)
    if (/diag|dman|(^|[-_])(cid|causa)($|[-_])/i.test(id) || /-c\d*-(code|srch|desc)$/i.test(id)) return 'diag';
    return null;
  }
  function visivel(el) { return !!(el.offsetParent || (el.getClientRects && el.getClientRects().length)); }
  function campos(raiz) { return Array.prototype.filter.call(raiz.querySelectorAll('input,select,textarea'), function (e) { return !!tipo(e); }); }
  function rotulo(el) {
    var f = el.closest('.f,.field,.form-group,.fg,.campo,label,div');
    var l = f && f.querySelector('label');
    if (l && !l.contains(el)) return l;
    var prev = el.previousElementSibling; return prev && prev.tagName === 'LABEL' ? prev : null;
  }

  // ── Marcar os campos (asterisco, "opcional" fora, género por escolher) ──
  function marcar(el) {
    if (el.dataset.zobMarcado) return; el.dataset.zobMarcado = '1';
    var t = tipo(el);
    if (el.type !== 'hidden') {
      var l = rotulo(el);
      if (l && !l.dataset.zob) {
        l.dataset.zob = '1';
        Array.prototype.forEach.call(l.querySelectorAll('span'), function (s) { if (/opcional/i.test(s.textContent)) s.remove(); });
        l.childNodes.forEach(function (n) { if (n.nodeType === 3 && /\(opcional\)/i.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(/\s*\(opcional\)/i, ''); });
        if (!/\*/.test(l.textContent)) l.insertAdjacentHTML('beforeend', '<span class="zob-ast" aria-hidden="true"> *</span>');
      }
    }
    // Ficha nova (nada escolhido no HTML, ou a idade da ficha ainda vazia —
    // várias páginas põem "Masculino" por omissão): o género fica por escolher.
    var novaFicha = function () {
      if (!Array.prototype.some.call(el.options, function (o) { return o.defaultSelected; })) return true;
      var c = el.parentElement;
      for (var i = 0; i < 5 && c; i++, c = c.parentElement) {
        var id = Array.prototype.filter.call(c.querySelectorAll('input,select'), function (x) { return tipo(x) === 'idade'; })[0];
        if (id) return !String(id.value || '').trim();
      }
      return false;
    };
    if (t === 'genero' && el.tagName === 'SELECT' && !Array.prototype.some.call(el.options, function (o) { return o.value === ''; }) && novaFicha()) {
      var o = document.createElement('option'); o.value = ''; o.textContent = '— Escolher —';
      el.insertBefore(o, el.firstChild); el.value = '';
    }
  }
  function varrer(raiz) { campos(raiz || document).forEach(marcar); }

  var css = document.createElement('style');
  css.textContent = '.zob-ast{color:#DC2626;font-weight:800}' +
    '.zob-err{border-color:#DC2626 !important;box-shadow:0 0 0 3px rgba(220,38,38,.16) !important;background:#FEF2F2 !important}' +
    '.zob-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483647;background:#0F172A;color:#fff;border-radius:12px;padding:12px 18px;font:700 .92rem Inter,"Segoe UI",Arial,sans-serif;box-shadow:0 14px 34px rgba(15,23,42,.35);display:flex;gap:10px;align-items:center;max-width:92vw}' +
    '.zob-toast i{font-style:normal;width:22px;height:22px;border-radius:50%;background:#F59E0B;color:#0F172A;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}';
  document.head.appendChild(css);
  var tEl = null, tT = null;
  function aviso(txt) {
    if (!tEl) { tEl = document.createElement('div'); tEl.className = 'zob-toast'; tEl.setAttribute('role', 'alert'); document.body.appendChild(tEl); }
    tEl.innerHTML = '<i>!</i><span></span>'; tEl.lastChild.textContent = txt; tEl.style.display = 'flex';
    clearTimeout(tT); tT = setTimeout(function () { tEl.style.display = 'none'; }, 4000);
  }

  // ── Bloquear a gravação com campos em falta ──
  // A ficha do botão: o primeiro contentor acima dele que tem campos; contam
  // só os campos que vêm ANTES do botão (o botão de gravar fica no fim da
  // ficha). Um botão no topo de uma lista não é travado pelas fichas abaixo.
  function contentor(btn) {
    var el = btn.parentElement;
    for (var i = 0; i < 8 && el && el !== document.body; i++, el = el.parentElement) {
      var c = campos(el).filter(function (x) { return x.type === 'hidden' || visivel(x); });
      if (!c.length) continue;
      c = c.filter(function (x) { return !!(x.compareDocumentPosition(btn) & Node.DOCUMENT_POSITION_FOLLOWING); });
      return c.length ? { el: el, campos: c } : null;
    }
    return null;
  }
  function vazio(el) { return !String(el.value == null ? '' : el.value).trim(); }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('button,input[type=button],input[type=submit],a.btn,.btn');
    if (!btn) return;
    var txt = (btn.innerText || btn.value || btn.title || '').trim();
    if (!BOTAO.test(txt) || NAO_BOTAO.test(txt)) return;
    var c = contentor(btn); if (!c) return;
    var grupos = {};
    c.campos.forEach(function (f) { var t = tipo(f); (grupos[t] = grupos[t] || []).push(f); });
    var falta = [];
    Object.keys(grupos).forEach(function (t) {
      var ok = grupos[t].some(function (f) { return !vazio(f); });
      if (!ok) {
        falta.push(t);
        grupos[t].forEach(function (f) { if (f.type !== 'hidden' && visivel(f)) { f.classList.add('zob-err'); var off = function () { f.classList.remove('zob-err'); f.removeEventListener('input', off); f.removeEventListener('change', off); }; f.addEventListener('input', off); f.addEventListener('change', off); } });
      }
    });
    if (!falta.length) return;
    e.preventDefault(); e.stopImmediatePropagation(); e.stopPropagation();
    var nomes = { idade: 'idade', genero: 'género', diag: 'diagnóstico / causa' };
    aviso('Falta preencher: ' + falta.map(function (t) { return nomes[t]; }).join(', ') + ' (campos obrigatórios).');
    var prim = c.campos.filter(function (f) { return f.classList.contains('zob-err'); })[0];
    if (prim) { try { prim.scrollIntoView({ behavior: 'smooth', block: 'center' }); prim.focus(); } catch (er) {} }
  }, true);

  // Fichas desenhadas mais tarde (listas que se redesenham, janelas…)
  function iniciar() {
    varrer(document);
    new MutationObserver(function (ms) {
      ms.forEach(function (m) { m.addedNodes && Array.prototype.forEach.call(m.addedNodes, function (n) { if (n.nodeType === 1) { if (tipo(n)) marcar(n); else varrer(n); } }); });
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
