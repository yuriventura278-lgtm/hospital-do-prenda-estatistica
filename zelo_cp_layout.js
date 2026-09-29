// ── ZELO — Controlo de Pacientes com a estrutura da Consulta Externa ──
// As 8 páginas de Controlo de Pacientes (UCI, Cuidados Intermédios,
// Medicina Interna, Cirurgia Geral, Ortopedia, Neurocirurgia, Maxilo-Facial
// e Nefrologia) passam a ter o mesmo esqueleto da Consulta Externa:
//   • menu lateral branco à esquerda (Controlo de Pacientes / Registos /
//     Backup), com o item atual realçado — sem links para outras páginas
//     (nem o menu flutuante geral);
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
    // ── Sem links para outras páginas: o menu flutuante geral não aparece aqui
    '#zmf-btn,#zmf-overlay,#zmf-panel{display:none !important}',
    // ── Janelas (Novo Paciente, Editar, Registar Saída) ──
    '.modal-overlay{backdrop-filter:blur(4px);background:rgba(15,23,42,.45) !important}',
    '.modal-card{max-width:780px !important;width:calc(100% - 32px) !important;border-radius:18px !important;border:1px solid var(--cpx-br) !important;box-shadow:0 24px 60px rgba(15,23,42,.28) !important;overflow:hidden;background:var(--cpx-sf) !important}',
    '.modal-header{padding:18px 24px !important;border:0 !important}',
    '.modal-header h2{font:800 1.05rem Inter,"Segoe UI",Arial,sans-serif !important;letter-spacing:.2px}',
    '.modal-header .icon{width:34px !important;height:34px !important;padding:8px;border-radius:10px;background:rgba(255,255,255,.16);box-sizing:border-box}',
    '.modal-close{width:34px !important;height:34px !important;border-radius:10px !important;background:rgba(255,255,255,.16) !important;border:1px solid rgba(255,255,255,.3) !important;color:#fff !important;font-size:20px !important}',
    '.modal-body{display:flex !important;flex-direction:column;gap:16px;padding:22px 24px 24px !important;background:var(--cpx-sf)}',
    '.modal-body .form-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr)) !important;gap:16px !important;margin:0 !important}',
    '.modal-body .form-row:has(#fNome),.modal-body .form-row:has(#eNome){grid-template-columns:2fr 1fr !important}',
    '@media(max-width:560px){.modal-body .form-row:has(#fNome),.modal-body .form-row:has(#eNome){grid-template-columns:1fr !important}}',
    '.btn-danger{text-transform:none !important;letter-spacing:0 !important}',
    '.field{display:flex;flex-direction:column;gap:7px}',
    '.field label{margin:0 !important;font:700 .7rem Inter,"Segoe UI",Arial,sans-serif !important;text-transform:uppercase;letter-spacing:.08em;color:var(--cpx-mut) !important}',
    '.field label .required{color:#DC2626 !important}',
    '.field input,.field select,.field textarea{height:46px;box-sizing:border-box;width:100%;border:1.5px solid #D5DEEA !important;border-radius:11px !important;background:#F8FAFC !important;padding:0 14px !important;font:500 .95rem Inter,"Segoe UI",Arial,sans-serif !important;color:var(--cpx-tx) !important;transition:border-color .15s,box-shadow .15s,background .15s}',
    '.field textarea{height:auto;min-height:90px;padding:12px 14px !important}',
    '.field input:hover,.field select:hover{border-color:var(--cpx-ring) !important}',
    '.field input:focus,.field select:focus,.field textarea:focus{outline:none;border-color:var(--cpx-accent) !important;background:#fff !important;box-shadow:0 0 0 4px rgba(62,92,135,.14) !important}',
    '.field input:valid{border-color:#D5DEEA !important}',
    '.field input::placeholder{color:#9AA8BC}',
    'html[data-zelo-theme="dark"] .field input,html[data-zelo-theme="dark"] .field select{background:#0F1828 !important;border-color:#2A3A52 !important}',
    '.modal-body .summary-card{background:var(--cpx-tint) !important;border:1px solid var(--cpx-ring) !important;border-radius:12px !important;padding:12px 14px !important;color:var(--cpx-tx) !important;font-size:.88rem}',
    '.modal-footer{padding:16px 24px !important;background:#F8FAFC;border-top:1px solid var(--cpx-br) !important}',
    'html[data-zelo-theme="dark"] .modal-footer{background:#0F1828}',
    '.modal-footer .btn{height:44px;padding:0 20px !important;font-size:.9rem !important}',
    // ── Cartões dos internados ──
    '.internados-list{display:grid !important;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}',
    '.internados-card{background:var(--cpx-sf) !important;border:1px solid var(--cpx-br) !important;border-left:4px solid var(--cpx-accent) !important;border-radius:14px !important;padding:14px 16px !important;box-shadow:0 1px 3px rgba(15,23,42,.05) !important;transition:transform .15s,box-shadow .15s;margin:0 !important}',
    '.internados-card:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(15,23,42,.08) !important}',
    '.internado-n{display:inline-block;font:700 .68rem ui-monospace,Consolas,monospace !important;color:var(--cpx-accent) !important;background:var(--cpx-tint);border-radius:6px;padding:3px 8px;margin-bottom:8px}',
    '.internado-nome{font:800 1rem Inter,"Segoe UI",Arial,sans-serif !important;color:var(--cpx-tx) !important;margin-bottom:8px}',
    '.internado-info{font-size:.82rem !important;color:var(--cpx-mut) !important;line-height:1.55}',
    '.internado-info strong{color:var(--cpx-tx) !important;font-weight:600}',
    // ── Tabela ──
    '.table-section table{border-collapse:separate !important;border-spacing:0}',
    '.table-section td{padding:11px 12px !important;border-bottom:1px solid var(--cpx-br) !important;font-size:.86rem}',
    '.table-section tbody tr:hover td{background:var(--cpx-tint) !important}',
    '.table-section code{background:var(--cpx-tint);border-radius:6px;padding:2px 7px;color:var(--cpx-accent)}',
    '.btn-small{border-radius:9px !important;height:32px;padding:0 12px !important}',
    // Botão Atualizar bem visível (tabela e cartões)
    '.cp-btn-atualizar{background:linear-gradient(135deg,#2B415E,#3E5C87) !important;color:#fff !important;border:0 !important;height:36px !important;padding:0 16px !important;font:700 .84rem Inter,Arial,sans-serif !important;box-shadow:0 3px 10px rgba(43,65,94,.28) !important;display:inline-flex !important;align-items:center;gap:7px}',
    '.cp-btn-atualizar:hover{filter:brightness(1.12);transform:translateY(-1px)}',
    '.cp-card-acoes{display:flex;gap:8px;margin-top:12px;padding-top:12px;border-top:1px dashed var(--cpx-br)}',
    '.cp-card-btn{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:7px;height:38px;border-radius:10px;font:700 .82rem Inter,Arial,sans-serif;cursor:pointer;transition:filter .15s,transform .15s}',
    '.cp-card-btn svg{width:15px;height:15px}',
    '.cp-card-btn-atualizar{background:linear-gradient(135deg,#2B415E,#3E5C87);color:#fff;border:0;box-shadow:0 3px 10px rgba(43,65,94,.25)}',
    '.cp-card-btn-saida{background:#fff;color:#B45309;border:1.5px solid #FCD34D}',
    '.cp-card-btn:hover{filter:brightness(1.08);transform:translateY(-1px)}',
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
      '</div>';

    // Movimento Hospitalar deste serviço (UCI e Cuidados Intermédios: um só Movimento).
    // O acesso continua a ser verificado (só chefes e administradores).
    var MOV = {
      medicina_interna: [['medicina_interna']],
      cirurgia_geral: [['cirurgia_geral']], ortopedia: [['ortopedia']], neurocirurgia: [['neurocirurgia']], maxilo_facial: [['maxilo_facial']],
      nefrologia: [['nefrologia']], uci: [['uci', 'UCI / Cuidados Intermédios']], uci_intensivo: [['uci', 'UCI / Cuidados Intermédios']], uci_intermedio: [['uci', 'UCI / Cuidados Intermédios']]
    };
    var mm = /controlo_pacientes_([a-z_]+)\.html/.exec(decodeURIComponent(location.pathname)), mov = mm && MOV[mm[1]];
    if (mov) {
      side.insertAdjacentHTML('beforeend', '<hr class="cpx-div"><div class="cpx-sec">Movimento Hospitalar</div><div class="cpx-lista">' + mov.map(function (m) {
        return '<a class="cpx-item" href="' + m[0] + '_movimento.html" data-modulo="movimento_mensal" data-item="' + m[0] + '" title="Abrir o Movimento Hospitalar' + (m[1] ? ' — ' + m[1] : '') + '">' + ic('grafico') + (m[1] ? 'Movimento — ' + m[1] : 'Movimento do serviço') + '</a>';
      }).join('') + '</div>');
      side.addEventListener('click', function (e) {
        var a = e.target.closest('a.cpx-item[data-modulo]');
        if (a && typeof window.zeloTentarAbrirLink === 'function' && !window.zeloTentarAbrirLink(a)) e.preventDefault();
      });
    }

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

    // (Sem saudação de boas-vindas na faixa do topo — pedido do serviço.)
    // Secções numeradas.
    var h2 = document.querySelector('.internados-header h2');
    if (h2 && !h2.querySelector('.cpx-n')) h2.insertAdjacentHTML('afterbegin', '<span class="cpx-n">1</span>');
    var th = document.querySelector('.table-section .table-header');
    if (th && !th.querySelector('.cpx-tit')) th.insertAdjacentHTML('afterbegin', '<div class="cpx-tit"><span class="cpx-n">2</span>Lista de Internados</div>');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
  else montar();
})();
