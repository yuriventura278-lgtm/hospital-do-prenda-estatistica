// ── ZELO — Controlo de Pacientes com a estrutura da Consulta Externa ──
// As 8 páginas de Controlo de Pacientes (UCI, Cuidados Intermédios,
// Medicina Interna, Cirurgia Geral, Ortopedia, Neurocirurgia, Maxilo-Facial
// e Nefrologia) passam a ter o mesmo esqueleto da Consulta Externa:
//   • menu lateral branco à esquerda (Controlo de Pacientes / Registos /
//     Serviços), com o item atual realçado;
//   • faixa de saudação ("Bom dia" + data e hora) no topo do conteúdo;
//   • indicadores e secções no mesmo estilo (cartões com barra de cor,
//     secções numeradas), a toda a largura.
// Não mexe nos dados nem nas funções da página: o menu só chama as que já
// existem (switchView, openModal).
(function () {
  if (window.__zeloCpLayout) return;
  window.__zeloCpLayout = true;
  var ficheiro = decodeURIComponent((location.pathname.split('/').pop() || ''));

  var I = {
    cama: '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>',
    grafico: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-6"/>',
    relogio: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    copia: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    mais: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    saida: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    servico: '<path d="M12 6v4"/><path d="M14 8h-4"/><path d="M18 12h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2"/><path d="M18 22V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v18"/>',
    menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>'
  };
  function ic(n) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + I[n] + '</svg>'; }

  var css = [
    ':root{--cpx-accent:#3E5C87;--cpx-tint:#E9EEF4;--cpx-ring:#B9C6D9;--cpx-sf:#fff;--cpx-br:#E3E8F0;--cpx-tx:#1F2937;--cpx-mut:#64748B;--cpx-bg:#F3F5F9;--cpx-side:236px}',
    'html[data-zelo-theme="dark"]{--cpx-tint:#1B2638;--cpx-ring:#33445E;--cpx-sf:#111A2B;--cpx-br:#1F2A3D;--cpx-tx:#E6ECF5;--cpx-mut:#9AA8BC;--cpx-bg:#0B1220}',
    'body{background:var(--cpx-bg) !important;}',
    '.cpx-shell{display:flex;align-items:stretch;width:100%;min-height:calc(100vh - 70px)}',
    '.cpx-side{width:var(--cpx-side);flex-shrink:0;background:var(--cpx-sf);border-right:1px solid var(--cpx-br);position:sticky;top:0;align-self:flex-start;height:100vh;overflow-y:auto;padding-bottom:24px;z-index:5}',
    '.cpx-side::-webkit-scrollbar{width:3px}.cpx-side::-webkit-scrollbar-thumb{background:var(--cpx-br)}',
    '.cpx-hdr{padding:14px 16px 11px;border-bottom:1px solid var(--cpx-br);font:600 .66rem Georgia,"Times New Roman",serif;text-transform:uppercase;letter-spacing:2px;color:var(--cpx-mut)}',
    '.cpx-sec{padding:12px 16px 4px;font-size:.6rem;text-transform:uppercase;letter-spacing:2px;font-weight:800;color:var(--cpx-mut)}',
    '.cpx-div{margin:8px 12px;border:none;border-top:1px solid var(--cpx-br)}',
    '.cpx-lista{padding:6px 10px;display:flex;flex-direction:column;gap:2px}',
    '.cpx-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:9px;border:1px solid transparent;color:var(--cpx-tx);font:500 .86rem Inter,"Segoe UI",Arial,sans-serif;text-decoration:none;cursor:pointer;background:none;width:100%;text-align:left}',
    '.cpx-item svg{width:16px;height:16px;flex-shrink:0;color:var(--cpx-mut)}',
    '.cpx-item:hover{background:var(--cpx-tint)}.cpx-item:hover svg,.cpx-item:hover{color:var(--cpx-accent)}',
    '.cpx-item.ativo{background:var(--cpx-tint);border-color:var(--cpx-ring);color:var(--cpx-accent);font-weight:700}.cpx-item.ativo svg{color:var(--cpx-accent)}',
    '.cpx-item .cpx-sig{margin-left:auto;font:600 .58rem ui-monospace,Consolas,monospace;color:#CBD5E1}',
    '.cpx-main{flex:1;min-width:0}',
    '.cpx-main > .container{max-width:none !important;width:100% !important;padding:20px 22px 40px !important;margin:0 !important}',
    '.view-selector{display:none !important}',
    // Faixa de saudação (como o "Bom dia" da Consulta Externa)
    '.date-panel{background:linear-gradient(135deg,#2B415E 0%,#3E5C87 100%) !important;border:none !important;border-radius:14px !important;color:#fff !important;padding:18px 22px !important;margin-bottom:16px !important;box-shadow:0 6px 18px rgba(43,65,94,.18)}',
    '.date-panel *{color:inherit}',
    '.date-panel .cpx-saud{font-size:1.15rem;font-weight:800;margin-bottom:3px}',
    '.date-panel-label{color:#BFD3EE !important;font-size:.72rem !important}',
    '.date-panel-time{color:#fff !important;font-family:ui-monospace,Consolas,monospace !important;font-size:1rem !important;font-weight:600 !important}',
    '.date-panel-selector label{color:#DCE7F5 !important}',
    '.date-panel-selector input{background:rgba(255,255,255,.95) !important;color:#1F2937 !important;border:0 !important;border-radius:9px !important}',
    '.date-panel .btn-secondary{background:rgba(255,255,255,.14) !important;color:#fff !important;border:1px solid rgba(255,255,255,.35) !important}',
    // Indicadores (kpi da Consulta Externa)
    '.stats-grid{grid-template-columns:repeat(5,1fr) !important;gap:10px !important;margin-bottom:16px !important}',
    '.stat-card{background:var(--cpx-tint) !important;border:1px solid var(--cpx-ring) !important;border-radius:12px !important;padding:14px 10px 12px !important;text-align:center;box-shadow:none !important}',
    '.stat-card::before{top:0 !important;left:0 !important;right:0 !important;width:auto !important;height:3px !important;border-radius:0 !important;opacity:1 !important;background:var(--k,#3E5C87) !important}',
    '.stat-card:hover{transform:translateY(-1px) !important;box-shadow:0 2px 8px rgba(15,23,42,.08) !important}',
    '.stat-icon{display:none !important}',
    '.stat-value{font-family:ui-monospace,Consolas,monospace !important;font-size:1.55rem !important;font-weight:600 !important;color:var(--k,#2B415E) !important;order:-1}',
    '.stat-card{display:flex;flex-direction:column;gap:4px}',
    '.stat-label{margin:0 !important;font-size:.64rem !important;color:var(--cpx-mut) !important;letter-spacing:.5px !important;font-weight:700 !important}',
    '.stats-grid .stat-card:nth-child(1){--k:#3E5C87}.stats-grid .stat-card:nth-child(2){--k:#0891B2}.stats-grid .stat-card:nth-child(3){--k:#DC2626}.stats-grid .stat-card:nth-child(4){--k:#16A34A}.stats-grid .stat-card:nth-child(5){--k:#B45309}',
    // Botões de ação
    '.controls{display:flex !important;gap:8px !important;flex-wrap:wrap;margin-bottom:16px !important}',
    '.controls .btn{background:var(--cpx-sf) !important;color:var(--cpx-accent) !important;border:1px solid var(--cpx-ring) !important;box-shadow:none !important;border-radius:10px !important;text-transform:none !important;letter-spacing:0 !important;font-weight:700 !important}',
    '.controls .btn:first-child{background:var(--cpx-accent) !important;color:#fff !important;border-color:var(--cpx-accent) !important}',
    '.controls .btn:hover{background:var(--cpx-tint) !important}.controls .btn:first-child:hover{background:#2B415E !important}',
    '.controls .btn[onclick*="historicoModal"],.controls .btn[onclick*="backupModal"]{display:none !important}',
    // Secções numeradas
    '.internados-panel,.table-section{background:var(--cpx-sf) !important;border:1px solid var(--cpx-br) !important;border-radius:14px !important;padding:0 !important;margin-bottom:16px !important;box-shadow:0 1px 2px rgba(15,23,42,.04) !important;overflow:hidden}',
    '.internados-header{padding:13px 16px !important;margin:0 !important;border-bottom:1px dashed var(--cpx-br)}',
    '.internados-header h2{font-size:.9rem !important;display:flex;align-items:center;gap:10px;color:var(--cpx-tx) !important}',
    '.cpx-n{width:26px;height:26px;border-radius:8px;background:var(--cpx-accent);color:#fff;display:inline-flex;align-items:center;justify-content:center;font:700 .78rem Inter,Arial,sans-serif;flex-shrink:0}',
    '.internados-count{background:var(--cpx-accent) !important;font-family:ui-monospace,Consolas,monospace;font-size:.78rem !important;padding:4px 10px !important}',
    '.internados-list{padding:14px 16px 16px}',
    '.internados-card{border-left-color:var(--cpx-accent) !important;border:1px solid var(--cpx-br);border-left-width:4px}',
    '.table-section .table-header{padding:12px 16px !important;border-bottom:1px dashed var(--cpx-br);display:flex;align-items:center;gap:12px}',
    '.cpx-tit{font-weight:800;font-size:.9rem;display:flex;align-items:center;gap:10px;white-space:nowrap;color:var(--cpx-tx)}',
    '.table-section th{background:var(--cpx-tint) !important;color:var(--cpx-accent) !important;font-size:.66rem !important;letter-spacing:.06em}',
    // Botões e campos da página (relatório, janelas) nas cores do sistema
    '.btn-primary{background:var(--cpx-accent) !important;background-image:none !important;color:#fff !important;border:1px solid var(--cpx-accent) !important;box-shadow:0 2px 8px rgba(43,65,94,.2) !important;text-transform:none !important;letter-spacing:0 !important;border-radius:10px !important}',
    '.btn-primary:hover{background:#2B415E !important;transform:none !important}',
    '.btn-secondary{background:var(--cpx-sf) !important;color:var(--cpx-accent) !important;border:1px solid var(--cpx-ring) !important;text-transform:none !important;letter-spacing:0 !important;border-radius:10px !important;box-shadow:none !important}',
    '.cpx-main select,.cpx-main input[type=month],.cpx-main input[type=date]{border:1px solid var(--cpx-ring);border-radius:9px;padding:8px 10px;font:600 .84rem Inter,Arial,sans-serif;background:var(--cpx-sf);color:var(--cpx-tx)}',
    '.modal-header{background:linear-gradient(135deg,#2B415E,#3E5C87) !important;color:#fff !important}',
    '.modal-header *{color:inherit}',
    // Menu no telemóvel: botão que abre o menu lateral por cima
    '.cpx-abrir{display:none}',
    '@media(max-width:900px){',
    '  .cpx-shell{display:block}',
    '  .cpx-side{position:fixed;left:calc(-1 * var(--cpx-side) - 10px);top:0;height:100vh;transition:left .22s;box-shadow:none;z-index:2147483000}',
    '  .cpx-side.aberto{left:0;box-shadow:8px 0 24px rgba(0,0,0,.18)}',
    '  .cpx-fundo{position:fixed;inset:0;background:rgba(8,14,32,.35);z-index:2147482999;display:none}.cpx-fundo.aberto{display:block}',
    '  .cpx-abrir{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--cpx-ring);background:var(--cpx-sf);color:var(--cpx-accent);border-radius:10px;padding:9px 14px;font:700 .82rem Inter,Arial,sans-serif;margin-bottom:12px}',
    '  .cpx-abrir svg{width:16px;height:16px}',
    '  .cpx-main > .container{padding:14px 14px 30px !important}',
    '  .table-section .table-header{flex-wrap:wrap}.table-section .table-header > div:not(.cpx-tit){flex:1 1 100% !important;min-width:0}',
    '  .stats-grid{grid-template-columns:repeat(2,1fr) !important}.stats-grid .stat-card:last-child{grid-column:1/-1}',
    '}'
  ].join('\n');

  function saudacao() {
    var h = new Date().getHours();
    return h >= 5 && h < 12 ? 'Bom dia' : (h >= 12 && h < 19 ? 'Boa tarde' : 'Boa noite');
  }

  function montar() {
    var cont = document.querySelector('body > .container') || document.querySelector('.container');
    if (!cont || document.querySelector('.cpx-shell')) return;
    var st = document.createElement('style'); st.id = 'cpx-estilos'; st.textContent = css; document.head.appendChild(st);

    var shell = document.createElement('div'); shell.className = 'cpx-shell';
    var side = document.createElement('nav'); side.className = 'cpx-side'; side.setAttribute('aria-label', 'Menu do Controlo de Pacientes');
    var main = document.createElement('div'); main.className = 'cpx-main';
    cont.parentNode.insertBefore(shell, cont);
    shell.appendChild(side); shell.appendChild(main); main.appendChild(cont);
    var fundo = document.createElement('div'); fundo.className = 'cpx-fundo'; document.body.appendChild(fundo);

    // Serviços com Controlo de Pacientes (do menu partilhado).
    var servicos = [];
    (window.SERVICOS_MENU || []).forEach(function (s) {
      (s.relatorios || []).forEach(function (r) {
        if (/^controlo_pacientes_/.test(r.file) && !servicos.some(function (x) { return x.file === r.file; })) {
          var p = String(r.label).split(/\s+—\s+/);
          servicos.push({ file: r.file, nome: p.length > 1 ? p[1] : (s.grupo || s.nome) });
        }
      });
    });
    function sig(n) { var p = String(n).replace(/[^A-Za-zÀ-ú ]/g, ' ').trim().split(/\s+/).filter(function (w) { return !/^(de|da|do|e)$/i.test(w); }); return (p.length > 1 ? p[0][0] + p[1][0] : (p[0] || '').slice(0, 2)).toUpperCase(); }

    side.innerHTML =
      '<div class="cpx-hdr">Controlo de Pacientes</div>' +
      '<div class="cpx-lista">' +
        '<button type="button" class="cpx-item ativo" data-vista="main">' + ic('cama') + 'Internados</button>' +
        '<button type="button" class="cpx-item" data-vista="relatorio">' + ic('grafico') + 'Relatório Mensal</button>' +
      '</div>' +
      '<hr class="cpx-div"><div class="cpx-sec">Registos</div>' +
      '<div class="cpx-lista">' +
        '<button type="button" class="cpx-item" data-modal="novoModal">' + ic('mais') + 'Novo Paciente</button>' +
        '<button type="button" class="cpx-item" data-modal="saidaModal">' + ic('saida') + 'Registar Saída</button>' +
      '</div>' +
      '<hr class="cpx-div"><div class="cpx-sec">Backup</div>' +
      '<div class="cpx-lista">' +
        '<button type="button" class="cpx-item" data-modal="historicoModal">' + ic('relogio') + 'Histórico Diário</button>' +
        '<button type="button" class="cpx-item" data-modal="backupModal">' + ic('copia') + 'Cópia de Segurança</button>' +
      '</div>' +
      (servicos.length ? '<hr class="cpx-div"><div class="cpx-sec">Serviços</div><div class="cpx-lista">' +
        servicos.map(function (s) {
          return '<a class="cpx-item' + (s.file === ficheiro ? ' ativo' : '') + '" href="' + s.file + '">' + ic('servico') + s.nome + '<span class="cpx-sig">' + sig(s.nome) + '</span></a>';
        }).join('') + '</div>' : '');

    function fecharMenu() { side.classList.remove('aberto'); fundo.classList.remove('aberto'); }
    fundo.addEventListener('click', fecharMenu);
    side.addEventListener('click', function (e) {
      var b = e.target.closest('.cpx-item');
      if (!b || b.tagName === 'A') return;
      if (b.dataset.vista && typeof window.switchView === 'function') {
        window.switchView(b.dataset.vista);
        side.querySelectorAll('[data-vista]').forEach(function (x) { x.classList.toggle('ativo', x === b); });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      if (b.dataset.modal && typeof window.openModal === 'function') window.openModal(b.dataset.modal);
      fecharMenu();
    });

    // Telemóvel: botão "Menu" no início do conteúdo.
    var abrir = document.createElement('button');
    abrir.type = 'button'; abrir.className = 'cpx-abrir'; abrir.innerHTML = ic('menu') + 'Menu do serviço';
    abrir.addEventListener('click', function () { side.classList.add('aberto'); fundo.classList.add('aberto'); });
    cont.insertBefore(abrir, cont.firstChild);

    // Saudação na faixa do topo.
    var dp = document.querySelector('.date-panel-clock');
    if (dp && !dp.querySelector('.cpx-saud')) {
      var s = document.createElement('div'); s.className = 'cpx-saud'; s.textContent = saudacao();
      dp.insertBefore(s, dp.firstChild);
    }
    // Secções numeradas.
    var h2 = document.querySelector('.internados-header h2');
    if (h2 && !h2.querySelector('.cpx-n')) h2.insertAdjacentHTML('afterbegin', '<span class="cpx-n">1</span>');
    var th = document.querySelector('.table-section .table-header');
    if (th && !th.querySelector('.cpx-tit')) th.insertAdjacentHTML('afterbegin', '<div class="cpx-tit"><span class="cpx-n">2</span>Lista de Internados</div>');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
  else montar();
})();
