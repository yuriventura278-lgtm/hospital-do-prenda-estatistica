// ── ZELO — Bloco Operatório (Registo Diário) com o visual da Consulta Externa ──
//   • menu lateral no modelo da Consulta Externa (título do serviço, itens
//     limpos com ícone simples, item atual realçado);
//   • faixa de saudação ("Boa noite" + data do registo) e indicadores do dia
//     (total, urgentes, eletivas, homens, mulheres), atualizados sozinhos;
//   • cartões como as secções numeradas da Consulta Externa;
//   • títulos sem letra serifada.
// Só muda o aspeto: não mexe nos dados nem nas funções da página.
(function () {
  if (window.__zeloBlocoLayout) return;
  window.__zeloBlocoLayout = true;

  var css = [
    ':root{--bx-accent:#3E5C87;--bx-tint:#E9EEF4;--bx-ring:#B9C6D9;--bx-br:#E3E8F0;--bx-tx:#1F2937;--bx-mut:#64748B}',
    // Menu lateral (Consulta Externa)
    '.sidebar{padding-top:0 !important}',
    '.bx-hdr{padding:14px 16px 11px;border-bottom:1px solid var(--bx-br);font:600 .66rem Georgia,"Times New Roman",serif;text-transform:uppercase;letter-spacing:2px;color:var(--bx-mut);margin-bottom:4px}',
    '.sidebar-section-label{padding:12px 16px 4px !important;font:800 .6rem Inter,"Segoe UI",Arial,sans-serif !important;letter-spacing:2px !important;color:var(--bx-mut) !important}',
    '.sidebar-divider{margin:8px 12px !important}',
    '.sidebar .nav-item{margin:1px 10px !important;padding:9px 12px !important;border-radius:9px !important;border:1px solid transparent !important;border-left-width:1px !important;gap:10px !important;font:500 .86rem Inter,"Segoe UI",Arial,sans-serif !important;color:var(--bx-tx) !important;letter-spacing:0 !important;background:none !important}',
    '.sidebar .nav-item .nav-ic{width:auto !important;height:auto !important;background:none !important;border-radius:0 !important}',
    '.sidebar .nav-item .nav-ic svg{width:16px !important;height:16px !important;stroke:var(--bx-mut) !important}',
    '.sidebar .nav-item:hover{background:var(--bx-tint) !important;color:var(--bx-accent) !important}',
    '.sidebar .nav-item:hover .nav-ic svg{stroke:var(--bx-accent) !important}',
    '.sidebar .nav-item.active{background:var(--bx-tint) !important;border-color:var(--bx-ring) !important;color:var(--bx-accent) !important;font-weight:700 !important}',
    '.sidebar .nav-item.active .nav-ic svg{stroke:var(--bx-accent) !important}',
    // Conteúdo
    '.main-content{padding:20px 22px 100px !important}',
    '.bx-faixa{background:linear-gradient(135deg,#2B415E 0%,#3E5C87 100%);border-radius:14px;color:#fff;padding:18px 22px;margin-bottom:14px;box-shadow:0 6px 18px rgba(43,65,94,.18);display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}',
    '.bx-faixa .s{font:800 1.15rem Inter,"Segoe UI",Arial,sans-serif}',
    '.bx-faixa .d{font:500 .8rem Inter,Arial,sans-serif;color:#DCE7F5;margin-top:3px}',
    '.bx-faixa .r{font:700 .78rem Inter,Arial,sans-serif;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.3);border-radius:10px;padding:8px 12px}',
    '.bx-kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:16px}',
    '.bx-kpi{background:var(--bx-tint);border:1px solid var(--bx-ring);border-radius:12px;padding:14px 10px 12px;text-align:center;position:relative;overflow:hidden}',
    '.bx-kpi::before{content:"";position:absolute;top:0;left:0;right:0;height:3px;background:var(--k,#3E5C87)}',
    '.bx-kpi b{display:block;font:600 1.55rem ui-monospace,Consolas,monospace;color:var(--k,#2B415E)}',
    '.bx-kpi span{font:700 .64rem Inter,Arial,sans-serif;letter-spacing:.5px;text-transform:uppercase;color:var(--bx-mut)}',
    // Cabeçalho das secções
    '.section-header{margin-bottom:14px !important}',
    '.section-badge{display:none !important}',
    '.section-title{font:800 1.15rem Inter,"Segoe UI",Arial,sans-serif !important;color:var(--bx-tx) !important;letter-spacing:0 !important}',
    // Cartões = secções numeradas da Consulta Externa
    '.main-content .card{border-radius:14px !important;border:1px solid var(--bx-br) !important;box-shadow:0 1px 2px rgba(15,23,42,.04) !important;margin-bottom:16px !important}',
    '.main-content .card::before{display:none !important}',
    '.main-content .card > .card-title{margin:-26px -28px 18px !important;padding:13px 16px !important;border-bottom:1px dashed var(--bx-br);font:800 .9rem Inter,"Segoe UI",Arial,sans-serif !important;text-transform:none !important;letter-spacing:0 !important;color:var(--bx-tx) !important;gap:10px !important}',
    '.bx-n{width:26px;height:26px;border-radius:8px;background:var(--bx-accent);color:#fff;display:inline-flex;align-items:center;justify-content:center;font:700 .78rem Inter,Arial,sans-serif;flex-shrink:0}',
    // Botões principais nas cores do sistema
    '.add-surgery-btn{border-radius:10px !important;font-weight:700 !important}',
    'html.dark .bx-kpi,html[data-zelo-theme="dark"] .bx-kpi{background:#1B2638;border-color:#33445E}',
    'html.dark .main-content .card > .card-title,html[data-zelo-theme="dark"] .main-content .card > .card-title{color:#E6ECF5 !important}',
    '@media(max-width:900px){.bx-kpis{grid-template-columns:repeat(2,1fr)}.bx-kpis .bx-kpi:last-child{grid-column:1/-1}.main-content .card > .card-title{margin:-18px -16px 14px !important}}'
  ].join('\n');

  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  var DIAS = ['Domingo', 'Segunda-Feira', 'Terça-Feira', 'Quarta-Feira', 'Quinta-Feira', 'Sexta-Feira', 'Sábado'];
  function saudacao() { var h = new Date().getHours(); return h >= 5 && h < 12 ? 'Bom dia' : (h >= 12 && h < 19 ? 'Boa tarde' : 'Boa noite'); }
  function dataLonga(iso) {
    var p = String(iso || '').split('-'); if (p.length !== 3) return '';
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return DIAS[d.getDay()] + ', ' + (+p[2]) + ' de ' + MESES[+p[1] - 1] + ' de ' + p[0];
  }

  var KPIS = [['cir-total-geral', 'Cirurgias do dia', '#3E5C87'], ['cir-count-urg', 'Urgentes', '#DC2626'], ['cir-count-elet', 'Eletivas', '#0891B2'], ['cir-homens', 'Homens', '#1D4ED8'], ['cir-mulheres', 'Mulheres', '#BE185D']];

  function montar() {
    var main = document.querySelector('.main-content');
    var side = document.getElementById('sidebar');
    if (!main || !side || document.getElementById('bx-estilos')) return;
    var st = document.createElement('style'); st.id = 'bx-estilos'; st.textContent = css; document.head.appendChild(st);

    // Menu: título do serviço no topo.
    var h = document.createElement('div'); h.className = 'bx-hdr'; h.textContent = 'Bloco Operatório';
    side.insertBefore(h, side.firstChild);

    // Faixa de saudação + indicadores.
    var faixa = document.createElement('div'); faixa.className = 'bx-faixa';
    faixa.innerHTML = '<div><div class="s">' + saudacao() + '</div><div class="d" id="bx-data"></div></div><div class="r">Registo diário · Bloco Operatório</div>';
    var kp = document.createElement('div'); kp.className = 'bx-kpis';
    kp.innerHTML = KPIS.map(function (k) { return '<div class="bx-kpi" style="--k:' + k[2] + '"><b data-src="' + k[0] + '">0</b><span>' + k[1] + '</span></div>'; }).join('');
    main.insertBefore(kp, main.firstChild);
    main.insertBefore(faixa, main.firstChild);

    function atualizar() {
      KPIS.forEach(function (k) {
        var src = document.getElementById(k[0]), dst = kp.querySelector('[data-src="' + k[0] + '"]');
        if (src && dst) dst.textContent = (src.textContent || '0').trim();
      });
      var inp = document.getElementById('regDate');
      var el = document.getElementById('bx-data');
      if (el) el.textContent = inp && inp.value ? dataLonga(inp.value) : '';
    }
    atualizar();
    if (window.MutationObserver) {
      KPIS.forEach(function (k) { var src = document.getElementById(k[0]); if (src) new MutationObserver(atualizar).observe(src, { childList: true, characterData: true, subtree: true }); });
    }
    var inp = document.getElementById('regDate');
    if (inp) { inp.addEventListener('change', atualizar); inp.addEventListener('input', atualizar); }
    setInterval(atualizar, 3000); // cobre alterações feitas por outras vias (data, sincronização)
    // Os indicadores do dia só aparecem no registo das cirurgias.
    function mostrarKpis() {
      var ativa = document.querySelector('.main-content .section.active');
      kp.style.display = !ativa || ativa.id === 'cirurgias' ? '' : 'none';
    }
    mostrarKpis();
    side.addEventListener('click', function () { setTimeout(mostrarKpis, 0); });
    if (window.MutationObserver) document.querySelectorAll('.main-content .section').forEach(function (sec) {
      new MutationObserver(mostrarKpis).observe(sec, { attributes: true, attributeFilter: ['class'] });
    });

    // Cartões numerados dentro de cada secção.
    document.querySelectorAll('.main-content .section').forEach(function (sec) {
      var n = 0;
      sec.querySelectorAll('.card > .card-title').forEach(function (t) {
        if (t.closest('.card').parentElement && t.closest('.card').style.display === 'none') return;
        if (t.querySelector('.bx-n')) return;
        n++; t.insertAdjacentHTML('afterbegin', '<span class="bx-n">' + n + '</span>');
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar); else montar();
})();
