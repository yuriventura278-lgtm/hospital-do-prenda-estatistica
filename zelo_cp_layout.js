// ── ZELO — Controlo de Pacientes: design profissional ──
// As 8 páginas de Controlo de Pacientes (UCI, Cuidados Intermédios,
// Medicina Interna, Cirurgia Geral, Ortopedia, Neurocirurgia, Maxilo-Facial
// e Nefrologia) ficam com:
//   • o menu lateral da Consulta Externa (Controlo de Pacientes, Registos,
//     Backup — Histórico e Cópia de Segurança — e Serviços);
//   • uma faixa do serviço com o nome em grande, a data e o tempo de
//     internamento dos doentes;
//   • indicadores em cartões, barra de ações, lista de internados com
//     iniciais, dias de internamento e filtros;
//   • à direita, o formulário "Novo paciente" sempre à mão e os
//     "Movimentos do dia".
// Não altera os dados nem a lógica da página: usa os mesmos campos (ids) e
// chama as funções que já existem (switchView, openModal, addPaciente…).
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
    menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
    pessoas: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    ok: '<path d="m5 12 5 5L20 7"/>',
    lapis: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    lixo: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    calendario: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>'
  };
  function ic(n) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + I[n] + '</svg>'; }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  var css = [
    ':root{--cpx-accent:#3E5C87;--cpx-tint:#E9EEF4;--cpx-ring:#B9C6D9;--cpx-sf:#fff;--cpx-br:#E3E8F0;--cpx-tx:#132033;--cpx-tx2:#4B5B70;--cpx-mut:#8B98AA;--cpx-bg:#F2F5FA;--cpx-side:236px;--cpx-cy:#22D3EE}',
    'html[data-zelo-theme="dark"]{--cpx-tint:#1B2638;--cpx-ring:#33445E;--cpx-sf:#111A2B;--cpx-br:#1F2A3D;--cpx-tx:#E6ECF5;--cpx-tx2:#AAB6C8;--cpx-mut:#7C8AA0;--cpx-bg:#0B1220}',
    'body{background:var(--cpx-bg) !important;}',
    // Estrutura: menu lateral + conteúdo
    '.cpx-shell{display:flex;align-items:stretch;width:100%;min-height:calc(100vh - 70px)}',
    '.cpx-side{width:var(--cpx-side);flex-shrink:0;background:var(--cpx-sf);border-right:1px solid var(--cpx-br);position:sticky;top:0;align-self:flex-start;height:100vh;overflow-y:auto;padding-bottom:24px;z-index:5}',
    '.cpx-side::-webkit-scrollbar{width:3px}.cpx-side::-webkit-scrollbar-thumb{background:var(--cpx-br)}',
    '.cpx-hdr{padding:14px 16px 11px;border-bottom:1px solid var(--cpx-br);font:600 .66rem Georgia,"Times New Roman",serif;text-transform:uppercase;letter-spacing:2px;color:var(--cpx-mut)}',
    '.cpx-sec{padding:12px 16px 4px;font-size:.6rem;text-transform:uppercase;letter-spacing:2px;font-weight:800;color:var(--cpx-mut)}',
    '.cpx-div{margin:8px 12px;border:none;border-top:1px solid var(--cpx-br)}',
    '.cpx-lista{padding:6px 10px;display:flex;flex-direction:column;gap:2px}',
    '.cpx-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:9px;border:1px solid transparent;color:var(--cpx-tx);font:500 .86rem Inter,"Segoe UI",Arial,sans-serif;text-decoration:none;cursor:pointer;background:none;width:100%;text-align:left}',
    '.cpx-item svg{width:16px;height:16px;flex-shrink:0;color:var(--cpx-mut)}',
    '.cpx-item:hover{background:var(--cpx-tint);color:var(--cpx-accent)}.cpx-item:hover svg{color:var(--cpx-accent)}',
    '.cpx-item.ativo{background:var(--cpx-tint);border-color:var(--cpx-ring);color:var(--cpx-accent);font-weight:700}.cpx-item.ativo svg{color:var(--cpx-accent)}',
    '.cpx-item .cpx-sig{margin-left:auto;font:600 .58rem ui-monospace,Consolas,monospace;color:#CBD5E1}',
    '.cpx-main{flex:1;min-width:0}',
    '.cpx-main > .container{max-width:none !important;width:100% !important;padding:0 24px 40px !important;margin:0 !important}',
    '.view-selector,.date-panel,.internados-panel,#mainView > .controls{display:none !important}',
    // Faixa do serviço
    '.cpx-hero{margin:0 -24px;padding:22px 24px 74px;background:linear-gradient(135deg,#0E1826 0%,#223550 50%,#34507A 100%);color:#fff;position:relative;overflow:hidden;display:grid;grid-template-columns:auto 1fr auto;gap:20px;align-items:center}',
    '.cpx-hero:after{content:"";position:absolute;inset:0;pointer-events:none;opacity:.28;background:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 400 60\' preserveAspectRatio=\'none\'%3E%3Cpolyline points=\'0,46 40,50 80,38 120,42 160,26 200,32 240,16 280,22 320,10 360,15 400,6\' fill=\'none\' stroke=\'%237FD4FF\' stroke-width=\'1.4\' vector-effect=\'non-scaling-stroke\'/%3E%3C/svg%3E") center 30%/100% 60% no-repeat;-webkit-mask-image:linear-gradient(90deg,transparent 30%,#000 70%);mask-image:linear-gradient(90deg,transparent 30%,#000 70%)}',
    '.cpx-hero > *{position:relative;z-index:1}',
    '.cpx-sv{width:58px;height:58px;border-radius:16px;background:rgba(34,211,238,.12);border:1px solid rgba(34,211,238,.35);display:flex;align-items:center;justify-content:center;color:var(--cpx-cy)}.cpx-sv svg{width:28px;height:28px}',
    '.cpx-hero small{font-size:.64rem;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#BFF3FF}',
    '.cpx-hero h1{margin:4px 0 4px;font:800 1.7rem Inter,"Segoe UI",Arial,sans-serif;letter-spacing:-.01em;color:#fff}',
    '.cpx-hero p{margin:0;color:#B7C5DA;font-size:.86rem}',
    '.cpx-hero p b{color:#fff;font-family:ui-monospace,Consolas,monospace;font-weight:600}',
    '.cpx-tempo{min-width:300px}',
    '.cpx-tempo .l{display:flex;justify-content:space-between;font-size:.74rem;color:#C9D6E8;margin-bottom:7px}.cpx-tempo .l b{font:700 .8rem ui-monospace,Consolas,monospace;color:#fff}',
    '.cpx-trilho{height:10px;border-radius:99px;background:rgba(255,255,255,.12);overflow:hidden;display:flex}',
    '.cpx-trilho i{display:block;height:100%}',
    '.cpx-leg{display:flex;gap:14px;margin-top:9px;font-size:.7rem;color:#B7C5DA;flex-wrap:wrap}.cpx-leg span:before{content:"";display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;background:var(--c)}',
    // Indicadores sobre a faixa
    '.cpx-main > .container > .stats-grid{grid-template-columns:repeat(5,1fr) !important;gap:14px !important;margin:-50px 0 18px !important;position:relative;z-index:2}',
    '.cpx-main > .container > .stats-grid .stat-card{background:var(--cpx-sf) !important;border:1px solid rgba(227,232,240,.9) !important;border-radius:16px !important;padding:16px 18px !important;box-shadow:0 10px 30px rgba(15,30,55,.10) !important;display:grid !important;grid-template-columns:1fr auto;grid-template-areas:"l i" "v v" "d d";align-items:center;row-gap:4px;border-left:none !important}',
    'html[data-zelo-theme="dark"] .cpx-main > .container > .stats-grid .stat-card{border-color:var(--cpx-br) !important}',
    '.stat-card::before{top:0 !important;left:0 !important;bottom:0 !important;right:auto !important;width:4px !important;height:auto !important;border-radius:0 !important;opacity:1 !important;background:var(--k,#3E5C87) !important}',
    '.stat-card:hover{transform:translateY(-2px) !important}',
    '.cpx-main > .container > .stats-grid .stat-icon{grid-area:i;display:flex !important;width:30px;height:30px;border-radius:9px;align-items:center;justify-content:center;margin:0 !important;color:var(--k);background:color-mix(in srgb,var(--k) 12%,transparent);opacity:1 !important}',
    '.cpx-main > .container > .stats-grid .stat-icon svg{width:16px !important;height:16px !important;stroke:var(--k) !important}',
    '.stat-label{grid-area:l;margin:0 !important;font-size:.64rem !important;color:var(--cpx-mut) !important;letter-spacing:.09em !important;font-weight:800 !important}',
    '.stat-value{grid-area:v;font:800 1.85rem Inter,"Segoe UI",Arial,sans-serif !important;color:var(--cpx-tx) !important;letter-spacing:-.02em}',
    '.cpx-det{grid-area:d;font-size:.72rem;color:var(--cpx-tx2)}',
    '.stats-grid .stat-card:nth-child(1){--k:#1A56DB}.stats-grid .stat-card:nth-child(2){--k:#0891B2}.stats-grid .stat-card:nth-child(3){--k:#DC2626}.stats-grid .stat-card:nth-child(4){--k:#16A34A}.stats-grid .stat-card:nth-child(5){--k:#D97706}.stats-grid .stat-card:nth-child(6){--k:#7C3AED}',
    '#relatorioView .stat-card{background:var(--cpx-sf) !important;border:1px solid var(--cpx-br) !important;border-radius:14px !important;box-shadow:none !important;border-left:none !important}',
    '#relatorioView .stat-icon{display:none !important}',
    // Barra de ações
    '.cpx-barra{display:flex;align-items:center;gap:10px;margin:0 0 14px;flex-wrap:wrap}',
    '.cpx-tabs{display:inline-flex;gap:4px;background:#E6EBF3;border-radius:12px;padding:4px}',
    'html[data-zelo-theme="dark"] .cpx-tabs{background:#16233A}',
    '.cpx-tabs button{border:0;background:none;border-radius:9px;padding:9px 16px;font:600 .84rem Inter,Arial,sans-serif;color:var(--cpx-tx2);display:flex;gap:7px;align-items:center;cursor:pointer}.cpx-tabs button svg{width:16px;height:16px}',
    '.cpx-tabs .on{background:var(--cpx-sf);color:var(--cpx-tx);box-shadow:0 1px 3px rgba(15,23,42,.12)}',
    '.cpx-esp{flex:1}',
    '.cpx-data{display:flex;align-items:center;gap:8px;background:var(--cpx-sf);border:1px solid var(--cpx-br);border-radius:10px;padding:5px 10px;color:var(--cpx-tx)}.cpx-data > svg{width:16px;height:16px;color:var(--cpx-mut)}',
    '.cpx-data input{border:0 !important;background:transparent !important;font:600 .84rem ui-monospace,Consolas,monospace !important;color:var(--cpx-tx) !important;padding:4px 0 !important;box-shadow:none !important}',
    '.cpx-data .btn{padding:5px 10px !important;font-size:.74rem !important}',
    '.cpx-btn{border:1px solid var(--cpx-br);background:var(--cpx-sf);color:var(--cpx-tx);border-radius:10px;padding:10px 16px;font:700 .83rem Inter,Arial,sans-serif;display:inline-flex;gap:8px;align-items:center;white-space:nowrap;cursor:pointer}.cpx-btn svg{width:16px;height:16px}',
    '.cpx-btn.pri{background:linear-gradient(135deg,#1E3350,#34507A);color:#fff;border-color:transparent;box-shadow:0 6px 16px rgba(30,51,80,.28)}.cpx-btn.pri svg{color:var(--cpx-cy)}',
    // Grelha principal
    '.cpx-grade{display:grid;grid-template-columns:minmax(0,1fr) 350px;gap:16px;align-items:start}',
    '.cpx-lado{display:flex;flex-direction:column;gap:16px;position:sticky;top:16px}',
    '.cpx-card{background:var(--cpx-sf);border:1px solid var(--cpx-br);border-radius:16px;overflow:hidden}',
    '.cpx-ch{display:flex;align-items:center;gap:12px;padding:14px 18px;border-bottom:1px solid var(--cpx-br)}',
    '.cpx-ch h3{margin:0;font-size:.95rem;font-weight:800;display:flex;align-items:center;gap:9px;color:var(--cpx-tx)}.cpx-ch h3:before{content:"";width:4px;height:18px;border-radius:2px;background:var(--cpx-cy)}',
    '.cpx-pill{margin-left:auto;font:600 .72rem ui-monospace,Consolas,monospace;background:var(--cpx-tint);color:var(--cpx-tx2);border-radius:999px;padding:4px 10px;white-space:nowrap}',
    // Lista de internados (a tabela da página)
    '#mainView .table-section{background:var(--cpx-sf) !important;border:1px solid var(--cpx-br) !important;border-radius:16px !important;padding:0 !important;margin:0 !important;box-shadow:none !important;overflow:hidden}',
    '#mainView .table-section .table-header{padding:12px 18px !important;border-bottom:1px solid var(--cpx-br);display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 !important;background:none !important}',
    '#mainView .table-section .search-box{margin:0 !important}',
    '#searchInternados{border:1px solid var(--cpx-br) !important;background:var(--cpx-bg) !important;border-radius:10px !important;font:500 .85rem Inter,Arial,sans-serif !important;color:var(--cpx-tx) !important;box-shadow:none !important}',
    '#countInternados{display:none}',
    '.cpx-chip{border:1px solid var(--cpx-br);background:var(--cpx-sf);border-radius:999px;padding:6px 12px;font:700 .75rem Inter,Arial,sans-serif;color:var(--cpx-tx2);cursor:pointer;white-space:nowrap}.cpx-chip.on{background:#2B415E;border-color:#2B415E;color:#fff}',
    '#mainView .table-section th{background:var(--cpx-bg) !important;color:var(--cpx-mut) !important;font-size:.63rem !important;letter-spacing:.1em !important;text-transform:uppercase;font-weight:800 !important;padding:11px 12px !important;border-bottom:1px solid var(--cpx-br) !important;white-space:nowrap}',
    '#mainView .table-section td{padding:11px 12px !important;border-bottom:1px solid var(--cpx-br) !important;vertical-align:middle;white-space:nowrap;color:var(--cpx-tx);font-size:.85rem}',
    '#mainView .table-section td.cpx-quebra{white-space:normal;min-width:110px}',
    '#mainView .table-section td[data-c="prov"] .cpx-tag{white-space:normal;max-width:130px}',
    '#mainView .table-section .table-wrapper{overflow-x:auto !important}',
    '#mainView .table-section td[data-c="nup"],#mainView .table-section th.cpx-nup{display:none !important}',
    '#mainView .table-section td[data-c="nome"]{min-width:190px;white-space:normal}',
    '#mainView .table-section td,#mainView .table-section th{padding-left:10px !important;padding-right:10px !important}',
    '#mainView .table-section tr:hover td{background:rgba(34,211,238,.04)}',
    '.cpx-num{font:700 .76rem ui-monospace,Consolas,monospace;background:#EEF4FF;color:#1D4ED8;border-radius:8px;padding:5px 8px;display:inline-block}',
    'html[data-zelo-theme="dark"] .cpx-num{background:#172A4A;color:#93C5FD}',
    '.cpx-pac{display:flex;align-items:center;gap:10px}.cpx-ini{width:34px;height:34px;border-radius:50%;background:var(--c);color:#fff;font:800 .74rem Inter,Arial,sans-serif;display:flex;align-items:center;justify-content:center;flex-shrink:0}',
    '.cpx-pac b{display:block;font-weight:700;white-space:normal}.cpx-pac small{color:var(--cpx-mut);font-size:.72rem}',
    '.cpx-m{font:500 .8rem ui-monospace,Consolas,monospace;color:var(--cpx-tx2)}',
    '.cpx-dias{display:flex;align-items:center;gap:8px;font:700 .78rem ui-monospace,Consolas,monospace}.cpx-bar{width:40px;height:6px;border-radius:9px;background:#EEF2F7;overflow:hidden}.cpx-bar i{display:block;height:100%;background:var(--c)}',
    '.cpx-tag{display:inline-flex;align-items:center;padding:4px 9px;border-radius:999px;font-size:.7rem;font-weight:700;background:var(--b);color:var(--c);white-space:nowrap}',
    '.cpx-ac{display:flex;gap:6px;justify-content:flex-end}',
    '.cpx-ac .btn{width:32px;height:32px;padding:0 !important;border-radius:9px !important;display:inline-flex !important;align-items:center;justify-content:center;font-size:0 !important;background:var(--cpx-sf) !important;color:var(--cpx-tx2) !important;border:1px solid var(--cpx-br) !important;box-shadow:none !important}',
    '.cpx-ac .btn svg{width:15px !important;height:15px !important;margin:0 !important}',
    '.cpx-ac .btn-danger{color:#DC2626 !important;border-color:#FAD4D4 !important;background:#FFF7F7 !important}',
    'tr.cpx-fora{display:none !important}',
    // Formulário "Novo paciente" (os campos da janela da página)
    '.cpx-form .modal-body{padding:16px 18px !important;display:grid !important;grid-template-columns:1fr 1fr;gap:12px;max-height:none !important;overflow:visible !important}',
    '.cpx-form .form-row{display:contents !important}',
    '.cpx-form .field{margin:0 !important;display:flex;flex-direction:column;gap:6px;min-width:0}',
    '.cpx-form .field.cpx-largo{grid-column:1/-1}',
    '.cpx-form label{font-size:.64rem !important;font-weight:800 !important;letter-spacing:.09em !important;text-transform:uppercase;color:var(--cpx-tx2) !important;margin:0 !important}',
    '.cpx-form input,.cpx-form select{border:1px solid var(--cpx-br) !important;background:var(--cpx-bg) !important;border-radius:10px !important;padding:10px 12px !important;font:500 .86rem Inter,Arial,sans-serif !important;color:var(--cpx-tx) !important;width:100%;box-sizing:border-box}',
    '.cpx-form input:focus,.cpx-form select:focus{background:var(--cpx-sf) !important;border-color:#7DD3FC !important;box-shadow:0 0 0 3px rgba(34,211,238,.18) !important;outline:none}',
    '.cpx-form .modal-footer{margin:0 18px;padding:12px 0 16px !important;border:0 !important;border-top:1px dashed var(--cpx-br) !important;display:flex;justify-content:flex-end;gap:10px;background:none !important}',
    '.cpx-form .btn-primary{background:linear-gradient(135deg,#1E3350,#34507A) !important;box-shadow:0 6px 16px rgba(30,51,80,.28) !important}',
    // Movimentos do dia
    '.cpx-movs{padding:6px 18px 14px}.cpx-mov{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--cpx-br);font-size:.82rem;color:var(--cpx-tx)}.cpx-mov:last-child{border:0}',
    '.cpx-mov i{width:30px;height:30px;border-radius:9px;display:flex;align-items:center;justify-content:center;background:var(--b);color:var(--c);flex-shrink:0}.cpx-mov i svg{width:15px;height:15px}',
    '.cpx-mov b{font-weight:700}.cpx-mov small{display:block;color:var(--cpx-mut);font-size:.72rem}.cpx-mov .h{margin-left:auto;font:600 .72rem ui-monospace,Consolas,monospace;color:var(--cpx-mut)}',
    '.cpx-vazio{padding:18px 0;text-align:center;color:var(--cpx-mut);font-size:.84rem}',
    // Relatório e janelas nas cores do sistema
    '#relatorioView{padding-top:4px}',
    '.btn-primary{background:var(--cpx-accent) !important;background-image:none !important;color:#fff !important;border:1px solid var(--cpx-accent) !important;box-shadow:0 2px 8px rgba(43,65,94,.2) !important;text-transform:none !important;letter-spacing:0 !important;border-radius:10px !important}',
    '.btn-primary:hover{background:#2B415E !important;transform:none !important}',
    '.btn-secondary{background:var(--cpx-sf) !important;color:var(--cpx-accent) !important;border:1px solid var(--cpx-ring) !important;text-transform:none !important;letter-spacing:0 !important;border-radius:10px !important;box-shadow:none !important}',
    '.cpx-main select,.cpx-main input[type=month]{border:1px solid var(--cpx-ring);border-radius:9px;padding:8px 10px;font:600 .84rem Inter,Arial,sans-serif;background:var(--cpx-sf);color:var(--cpx-tx)}',
    '.modal-header{background:linear-gradient(135deg,#1E3350,#34507A) !important;color:#fff !important}.modal-header *{color:inherit}',
    // Telemóvel e ecrãs médios
    '.cpx-abrir{display:none}',
    '@media(max-width:1180px){.cpx-grade{grid-template-columns:1fr}.cpx-lado{position:static;order:-1}.cpx-main > .container > .stats-grid{grid-template-columns:repeat(3,1fr) !important}}',
    '@media(max-width:900px){',
    '  .cpx-shell{display:block}',
    '  .cpx-side{position:fixed;left:calc(-1 * var(--cpx-side) - 10px);top:0;height:100vh;transition:left .22s;z-index:2147483000}',
    '  .cpx-side.aberto{left:0;box-shadow:8px 0 24px rgba(0,0,0,.18)}',
    '  .cpx-fundo{position:fixed;inset:0;background:rgba(8,14,32,.35);z-index:2147482999;display:none}.cpx-fundo.aberto{display:block}',
    '  .cpx-abrir{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.1);color:#fff;border-radius:10px;padding:8px 12px;font:700 .8rem Inter,Arial,sans-serif;grid-column:1/-1;justify-self:start;cursor:pointer}',
    '  .cpx-abrir svg{width:16px;height:16px}',
    '  .cpx-main > .container{padding:0 14px 30px !important}',
    '  .cpx-hero{margin:0 -14px;padding:14px 14px 66px;grid-template-columns:auto 1fr}.cpx-tempo{grid-column:1/-1;min-width:0}.cpx-hero h1{font-size:1.35rem}.cpx-sv{width:46px;height:46px}',
    '  .cpx-main > .container > .stats-grid{grid-template-columns:1fr 1fr !important;gap:10px !important}.cpx-main > .container > .stats-grid .stat-card:last-child{grid-column:1/-1}.stat-value{font-size:1.5rem !important}',
    '  .cpx-esp{display:none}.cpx-data{flex:1}.cpx-barra .cpx-btn{flex:1;justify-content:center}.cpx-barra .cpx-btn.pri{flex-basis:100%}',
    '  #mainView .table-section thead{display:none}#mainView .table-section table,#mainView .table-section tbody,#mainView .table-section tr,#mainView .table-section td{display:block;width:100%}',
    '  #mainView .table-section tr[data-cpx]{display:grid !important;grid-template-columns:auto 1fr auto;gap:6px 10px;padding:12px 14px;border-bottom:1px solid var(--cpx-br)}',
    '  #mainView .table-section td{padding:0 !important;border:0 !important;white-space:normal}',
    '  #mainView td[data-c="n"]{grid-row:1/span 3}#mainView td[data-c="nome"]{grid-column:2}#mainView td[data-c="ac"]{grid-column:3;grid-row:1/span 2}',
    '  #mainView td[data-c="nup"],#mainView td[data-c="ent"],#mainView td[data-c="dias"],#mainView td[data-c="diag"],#mainView td[data-c="prov"]{grid-column:2/span 2;font-size:.8rem}',
    '}'
  ].join('\n');

  function saudacao() { var h = new Date().getHours(); return h >= 5 && h < 12 ? 'Bom dia' : (h >= 12 && h < 19 ? 'Boa tarde' : 'Boa noite'); }
  function dadosPagina() { try { return (typeof data !== 'undefined' && data && data.patients) ? data : null; } catch (e) { return null; } }
  function diaVista() {
    try { if (typeof selectedViewDate !== 'undefined' && selectedViewDate) return selectedViewDate; } catch (e) {}
    var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function diasInternado(p) { var d = Math.floor((Date.now() - new Date(p.dataEntrada).getTime()) / 86400000); return d < 0 || isNaN(d) ? 0 : d; }
  var CORES_INI = ['#7C3AED', '#0891B2', '#16A34A', '#DB2777', '#1A56DB', '#D97706', '#0D9488', '#9333EA'];
  function iniciais(n) { var p = String(n || '').trim().split(/\s+/).filter(function (w) { return !/^(de|da|do|das|dos|e)$/i.test(w); }); return ((p[0] || '?')[0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase(); }
  function tagProv(t) {
    t = String(t || '').trim();
    if (!t) return '<span class="cpx-m">—</span>';
    var curto = t.replace(/^Transferência\s*-\s*/i, '');
    var cor = /urg/i.test(t) ? ['#FEF2F2', '#B91C1C'] : /uci|intermédio|intermedio/i.test(t) ? ['#F5F3FF', '#6D28D9'] : /bloco/i.test(t) ? ['#FFF7ED', '#C2410C'] : ['#EFF6FF', '#1D4ED8'];
    return '<span class="cpx-tag" style="--b:' + cor[0] + ';--c:' + cor[1] + '">' + esc(curto) + '</span>';
  }
  function hora(d) { var x = new Date(d); return isNaN(x) ? '' : String(x.getHours()).padStart(2, '0') + ':' + String(x.getMinutes()).padStart(2, '0'); }

  var filtro = 'todos';

  function montar() {
    var cont = document.querySelector('body > .container') || document.querySelector('.container');
    var mainView = document.getElementById('mainView');
    if (!cont || !mainView || document.querySelector('.cpx-shell')) return;
    var st = document.createElement('style'); st.id = 'cpx-estilos'; st.textContent = css; document.head.appendChild(st);

    // ── Menu lateral ──
    var shell = document.createElement('div'); shell.className = 'cpx-shell';
    var side = document.createElement('nav'); side.className = 'cpx-side'; side.setAttribute('aria-label', 'Menu do Controlo de Pacientes');
    var main = document.createElement('div'); main.className = 'cpx-main';
    cont.parentNode.insertBefore(shell, cont);
    shell.appendChild(side); shell.appendChild(main); main.appendChild(cont);
    var fundo = document.createElement('div'); fundo.className = 'cpx-fundo'; document.body.appendChild(fundo);

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
    var atual = servicos.filter(function (s) { return s.file === ficheiro; })[0];
    var nomeServico = atual ? atual.nome : (document.title.split(/\s[·|—-]\s/)[0] || 'Serviço');

    side.innerHTML =
      '<div class="cpx-hdr">Controlo de Pacientes</div>' +
      '<div class="cpx-lista">' +
        '<button type="button" class="cpx-item ativo" data-vista="main">' + ic('cama') + 'Internados</button>' +
        '<button type="button" class="cpx-item" data-vista="relatorio">' + ic('grafico') + 'Relatório Mensal</button>' +
      '</div>' +
      '<hr class="cpx-div"><div class="cpx-sec">Registos</div>' +
      '<div class="cpx-lista">' +
        '<button type="button" class="cpx-item" data-acao="novo">' + ic('mais') + 'Novo Paciente</button>' +
        '<button type="button" class="cpx-item" data-modal="saidaModal">' + ic('saida') + 'Registar Saída</button>' +
      '</div>' +
      '<hr class="cpx-div"><div class="cpx-sec">Backup</div>' +
      '<div class="cpx-lista">' +
        '<button type="button" class="cpx-item" data-modal="historicoModal">' + ic('relogio') + 'Histórico Diário</button>' +
        '<button type="button" class="cpx-item" data-modal="backupModal">' + ic('copia') + 'Cópia de Segurança</button>' +
      '</div>' +
      (servicos.length ? '<hr class="cpx-div"><div class="cpx-sec">Serviços</div><div class="cpx-lista">' +
        servicos.map(function (s) {
          return '<a class="cpx-item' + (s.file === ficheiro ? ' ativo' : '') + '" href="' + s.file + '">' + ic('servico') + esc(s.nome) + '<span class="cpx-sig">' + sig(s.nome) + '</span></a>';
        }).join('') + '</div>' : '');

    function fecharMenu() { side.classList.remove('aberto'); fundo.classList.remove('aberto'); }
    fundo.addEventListener('click', fecharMenu);

    // ── Faixa do serviço ──
    var hero = document.createElement('div'); hero.className = 'cpx-hero';
    hero.innerHTML =
      '<button type="button" class="cpx-abrir">' + ic('menu') + 'Menu do serviço</button>' +
      '<div class="cpx-sv">' + ic('cama') + '</div>' +
      '<div><small>Controlo de pacientes · Internamento</small><h1>' + esc(nomeServico) + '</h1>' +
      '<p><span class="cpx-saud"></span> · <b id="cpxRelogio"></b></p></div>' +
      '<div class="cpx-tempo"><div class="l">Tempo de internamento <b id="cpxTempoTot"></b></div><div class="cpx-trilho" id="cpxTrilho"></div><div class="cpx-leg" id="cpxLeg"></div></div>';
    cont.insertBefore(hero, cont.firstChild);
    hero.querySelector('.cpx-abrir').addEventListener('click', function () { side.classList.add('aberto'); fundo.classList.add('aberto'); });
    function relogio() {
      var d = new Date();
      hero.querySelector('.cpx-saud').textContent = saudacao();
      hero.querySelector('#cpxRelogio').textContent = d.toLocaleDateString('pt-PT', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }) + ' · ' + hora(d);
    }
    relogio(); setInterval(relogio, 20000);

    // ── Indicadores (sobre a faixa) ──
    var ICONES_K = ['pessoas', 'mais', 'saida', 'ok', 'relogio'];
    var stats = mainView.querySelector('.stats-grid');
    if (stats) {
      Array.prototype.forEach.call(stats.querySelectorAll('.stat-card'), function (c, i) {
        var icEl = c.querySelector('.stat-icon'); if (icEl) icEl.innerHTML = ic(ICONES_K[i] || 'pessoas');
        if (!c.querySelector('.cpx-det')) { var d = document.createElement('div'); d.className = 'cpx-det'; c.appendChild(d); }
      });
      cont.insertBefore(stats, hero.nextSibling);
    }

    // ── Barra de ações (Histórico e Cópia de Segurança ficam no menu, em "Backup") ──
    var barra = document.createElement('div'); barra.className = 'cpx-barra';
    barra.innerHTML =
      '<div class="cpx-tabs"><button type="button" class="on" data-vista="main">' + ic('cama') + 'Internados</button><button type="button" data-vista="relatorio">' + ic('grafico') + 'Relatório mensal</button></div>' +
      '<div class="cpx-esp"></div>' +
      '<div class="cpx-data" title="A ver registos do dia">' + ic('calendario') + '</div>' +
      '<button type="button" class="cpx-btn" data-modal="saidaModal">' + ic('saida') + 'Registar saída</button>' +
      '<button type="button" class="cpx-btn pri" data-acao="novo">' + ic('mais') + 'Novo paciente</button>';
    var caixaData = barra.querySelector('.cpx-data');
    ['viewDate', 'btnVoltarHoje'].forEach(function (id) { var e = document.getElementById(id); if (e) caixaData.appendChild(e); });
    cont.insertBefore(barra, (stats || hero).nextSibling);

    // ── Grelha: lista + coluna lateral ──
    var tabela = mainView.querySelector('.table-section');
    var grade = document.createElement('div'); grade.className = 'cpx-grade';
    var lado = document.createElement('div'); lado.className = 'cpx-lado';
    mainView.appendChild(grade);
    if (tabela) grade.appendChild(tabela);
    grade.appendChild(lado);
    var th = tabela && tabela.querySelector('.table-header');
    if (th) {
      var tit = document.createElement('div'); tit.className = 'cpx-ch';
      tit.innerHTML = '<h3>Pacientes internados</h3><span class="cpx-pill" id="cpxConta">0 pacientes</span>';
      tabela.insertBefore(tit, th);
      var chips = document.createElement('div'); chips.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
      chips.innerHTML = '<button type="button" class="cpx-chip on" data-f="todos">Todos</button><button type="button" class="cpx-chip" data-f="hoje">Entraram neste dia</button><button type="button" class="cpx-chip" data-f="7">Mais de 7 dias</button>';
      th.appendChild(chips);
      chips.addEventListener('click', function (e) {
        var b = e.target.closest('.cpx-chip'); if (!b) return;
        filtro = b.dataset.f;
        chips.querySelectorAll('.cpx-chip').forEach(function (x) { x.classList.toggle('on', x === b); });
        aplicarFiltro();
      });
    }
    // Formulário "Novo paciente": os campos da janela da página, sempre visíveis.
    var novo = document.getElementById('novoModal');
    var corpo = novo && novo.querySelector('.modal-body'), rodape = novo && novo.querySelector('.modal-footer');
    if (corpo) {
      var cf = document.createElement('div'); cf.className = 'cpx-card cpx-form'; cf.id = 'cpxNovo';
      cf.innerHTML = '<div class="cpx-ch"><h3>Novo paciente</h3><span class="cpx-pill">* obrigatório</span></div>';
      cf.appendChild(corpo);
      // A página ainda procura ".modal-body" dentro da janela original (para limpar os campos).
      var marca = document.createElement('div'); marca.className = 'modal-body'; marca.style.display = 'none'; novo.querySelector('.modal-card') ? novo.querySelector('.modal-card').appendChild(marca) : novo.appendChild(marca);
      ['fNome', 'fDataEntrada', 'fDiagnostico', 'fProveniencia'].forEach(function (id) {
        var e = document.getElementById(id), f = e && e.closest('.field'); if (f) f.classList.add('cpx-largo');
      });
      if (rodape) {
        cf.appendChild(rodape);
        var cancelar = rodape.querySelector('.btn-secondary');
        if (cancelar) { cancelar.textContent = 'Limpar'; cancelar.removeAttribute('onclick'); cancelar.addEventListener('click', limparForm); }
        var criar = rodape.querySelector('.btn-primary');
        if (criar) { var svg = criar.querySelector('svg'); criar.textContent = ' Guardar paciente'; if (svg) criar.insertBefore(svg, criar.firstChild); }
      }
      lado.appendChild(cf);
    }
    function limparForm() {
      ['fNome', 'fIdade', 'fNUP', 'fDiagnostico', 'fProveniencia'].forEach(function (id) { var e = document.getElementById(id); if (e) e.value = ''; });
      var de = document.getElementById('fDataEntrada'); if (de && typeof window.todayISO === 'function') de.value = window.todayISO();
    }
    limparForm();
    var cm = document.createElement('div'); cm.className = 'cpx-card';
    cm.innerHTML = '<div class="cpx-ch"><h3>Movimentos do dia</h3></div><div class="cpx-movs" id="cpxMovs"></div>';
    lado.appendChild(cm);

    // "Novo paciente" (menu, botões) leva ao formulário ao lado, em vez da janela.
    var abrirOrig = window.openModal;
    window.openModal = function (id) {
      if (id === 'novoModal' && document.getElementById('cpxNovo')) { irParaFormulario(); return; }
      return abrirOrig.apply(this, arguments);
    };
    var fecharOrig = window.closeModal;
    window.closeModal = function (id) { if (id === 'novoModal') { limparForm(); return; } return fecharOrig.apply(this, arguments); };
    function irParaFormulario() {
      mudarVista('main');
      var f = document.getElementById('cpxNovo'), n = document.getElementById('fNome');
      if (f) f.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (n) setTimeout(function () { try { n.focus({ preventScroll: true }); } catch (e) { n.focus(); } }, 350);
    }
    function mudarVista(v) {
      if (typeof window.switchView === 'function') window.switchView(v);
      document.querySelectorAll('[data-vista]').forEach(function (x) {
        if (x.classList.contains('cpx-item')) x.classList.toggle('ativo', x.dataset.vista === v);
        else x.classList.toggle('on', x.dataset.vista === v);
      });
      caixaData.style.display = v === 'main' ? '' : 'none';
      if (stats) stats.style.display = v === 'main' ? '' : 'none';
      hero.style.paddingBottom = v === 'main' ? '' : '26px';
      barra.style.marginTop = v === 'main' ? '' : '18px';
    }
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-vista],[data-modal],[data-acao]');
      if (!b || !(side.contains(b) || barra.contains(b))) return;
      if (b.dataset.vista) { mudarVista(b.dataset.vista); window.scrollTo({ top: 0, behavior: 'smooth' }); }
      if (b.dataset.modal) window.openModal(b.dataset.modal);
      if (b.dataset.acao === 'novo') irParaFormulario();
      fecharMenu();
    });

    // ── Atualiza sempre que a página atualiza os seus dados ──
    ['updateStats', 'renderInternados'].forEach(function (nome) {
      var f = window[nome];
      if (typeof f !== 'function' || f.__cpx) return;
      var novoF = function () { var r = f.apply(this, arguments); try { atualizar(); } catch (e) {} return r; };
      novoF.__cpx = true; window[nome] = novoF;
    });
    var tbody = document.getElementById('tabelaInternados');
    if (tbody && window.MutationObserver) new MutationObserver(decorarTabela).observe(tbody, { childList: true });
    atualizar();
  }

  // Lista: número, iniciais + idade, NUP, entrada, dias, diagnóstico, proveniência, ações
  function decorarTabela() {
    var tbody = document.getElementById('tabelaInternados'); if (!tbody) return;
    var cab = tbody.closest('table') && tbody.closest('table').querySelector('thead tr');
    if (cab && !cab.dataset.cpx) {
      cab.dataset.cpx = '1';
      cab.innerHTML = '<th>N.º</th><th>Paciente</th><th class="cpx-nup">NUP</th><th>Entrada</th><th>Internado há</th><th>Diagnóstico</th><th>Proveniência</th><th></th>';
    }
    var d = dadosPagina(), porN = {};
    if (d) d.patients.forEach(function (p) { porN[p.n] = p; });
    Array.prototype.forEach.call(tbody.rows, function (tr) {
      if (tr.dataset.cpx || tr.classList.contains('empty-state-row') || tr.cells.length < 8) return;
      var p = porN[parseInt(tr.cells[0].textContent, 10)];
      if (!p) return;
      tr.dataset.cpx = '1';
      var dias = diasInternado(p);
      tr.dataset.hoje = String(p.dataEntrada || '').slice(0, 10) === diaVista() ? '1' : '';
      tr.dataset.dias = dias;
      var corDias = dias > 7 ? '#DC2626' : dias >= 4 ? '#D97706' : dias >= 1 ? '#1A56DB' : '#16A34A';
      var ac = tr.cells[7];
      ac.style.display = ''; ac.innerHTML = '<div class="cpx-ac">' + ac.innerHTML + '</div>';
      ac.querySelectorAll('.btn').forEach(function (b) {
        var remover = /remov/i.test(b.textContent);
        b.title = remover ? 'Remover' : 'Editar'; b.setAttribute('aria-label', b.title);
        b.innerHTML = remover ? ic('lixo') : ic('lapis');
      });
      tr.cells[0].innerHTML = '<span class="cpx-num">' + String(p.n).padStart(2, '0') + '</span>';
      tr.cells[1].innerHTML = '<div class="cpx-pac"><div class="cpx-ini" style="--c:' + CORES_INI[p.n % CORES_INI.length] + '">' + esc(iniciais(p.nome)) + '</div><div><b>' + esc(p.nome) + '</b><small>' + esc(p.idade) + ' anos · <span class="cpx-m" style="font-size:.7rem">' + esc(p.nup) + '</span></small></div></div>';
      tr.cells[2].innerHTML = '<span class="cpx-m">' + esc(p.nup) + '</span>';
      tr.cells[3].innerHTML = '<span class="cpx-m">' + new Date(p.dataEntrada).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }) + ' · ' + hora(p.dataEntrada) + '</span>';
      tr.cells[4].innerHTML = '<div class="cpx-dias" style="--c:' + corDias + '"><div class="cpx-bar"><i style="width:' + Math.min(100, Math.max(6, dias / 14 * 100)) + '%"></i></div>' + (dias === 0 ? 'hoje' : dias + (dias === 1 ? ' dia' : ' dias')) + '</div>';
      tr.cells[5].className = 'cpx-quebra';
      tr.cells[6].innerHTML = tagProv(p.proveniencia);
      ['n', 'nome', 'nup', 'ent', 'dias', 'diag', 'prov', 'ac'].forEach(function (k, i) { tr.cells[i].dataset.c = k; });
    });
    aplicarFiltro();
  }
  function aplicarFiltro() {
    var tbody = document.getElementById('tabelaInternados'); if (!tbody) return;
    Array.prototype.forEach.call(tbody.rows, function (tr) {
      if (tr.classList.contains('empty-state-row')) return;
      tr.classList.toggle('cpx-fora', (filtro === 'hoje' && tr.dataset.hoje !== '1') || (filtro === '7' && !(Number(tr.dataset.dias) > 7)));
    });
  }

  function atualizar() {
    decorarTabela();
    var d = dadosPagina(); if (!d) return;
    var internados = d.patients.filter(function (p) { return p.status === 'internado'; });
    var dia = diaVista();
    var entradas = d.patients.filter(function (p) { return String(p.dataEntrada || '').slice(0, 10) === dia; });
    var saidas = d.patients.filter(function (p) { return p.dataSaida && String(p.dataSaida).slice(0, 10) === dia; });
    var conta = document.getElementById('cpxConta'); if (conta) conta.textContent = internados.length + (internados.length === 1 ? ' paciente' : ' pacientes');
    // Tempo de internamento (faixa do serviço)
    var g = [0, 0, 0];
    internados.forEach(function (p) { var x = diasInternado(p); g[x <= 3 ? 0 : x <= 7 ? 1 : 2]++; });
    var tot = internados.length || 1, cores = ['#22D3EE', '#FBBF24', '#F87171'];
    var trilho = document.getElementById('cpxTrilho');
    if (trilho) trilho.innerHTML = internados.length ? g.map(function (v, i) { return '<i style="width:' + (v / tot * 100) + '%;background:' + cores[i] + '"></i>'; }).join('') : '';
    var leg = document.getElementById('cpxLeg');
    if (leg) leg.innerHTML = '<span style="--c:#22D3EE">Até 3 dias ' + g[0] + '</span><span style="--c:#FBBF24">4 a 7 dias ' + g[1] + '</span><span style="--c:#F87171">Mais de 7 dias ' + g[2] + '</span>';
    var tt = document.getElementById('cpxTempoTot'); if (tt) tt.textContent = internados.length + (internados.length === 1 ? ' internado' : ' internados');
    // Detalhe dos indicadores
    var urg = entradas.filter(function (p) { return /urg/i.test(p.proveniencia || ''); }).length;
    var altas = saidas.filter(function (p) { return p.tipoSaida === 'Alta Vivo'; }).length;
    var obitos = saidas.filter(function (p) { return p.tipoSaida === 'Óbito'; }).length;
    var transf = saidas.filter(function (p) { return p.tipoSaida === 'Transferência'; }).length;
    var textos = [
      g[2] ? g[2] + ' há mais de 7 dias' : 'nenhum há mais de 7 dias',
      entradas.length ? urg + ' do Banco de Urgência' : 'sem entradas neste dia',
      saidas.length ? [altas && altas + (altas > 1 ? ' altas' : ' alta'), obitos && obitos + (obitos > 1 ? ' óbitos' : ' óbito'), transf && transf + ' transf.'].filter(Boolean).join(' · ') : 'sem saídas neste dia',
      'altas vivas registadas',
      'média das saídas do dia'
    ];
    Array.prototype.forEach.call(document.querySelectorAll('.cpx-main > .container > .stats-grid .cpx-det'), function (el, i) { if (textos[i] != null) el.textContent = textos[i]; });
    // Movimentos do dia
    var movs = [];
    entradas.forEach(function (p) { movs.push({ t: p.dataEntrada, tipo: 'Entrada', nome: p.nome, det: (p.proveniencia || 'Admissão').replace(/^Transferência\s*-\s*/i, 'Transferido de '), ic: 'mais', b: '#ECFEFF', c: '#0891B2' }); });
    saidas.forEach(function (p) {
      var o = p.tipoSaida === 'Óbito', a = p.tipoSaida === 'Alta Vivo';
      var dd = Math.max(0, Math.ceil((new Date(p.dataSaida) - new Date(p.dataEntrada)) / 86400000));
      movs.push({ t: p.dataSaida, tipo: o ? 'Óbito' : a ? 'Alta' : (p.tipoSaida || 'Saída'), nome: p.nome, det: dd + (dd === 1 ? ' dia internado' : ' dias internado'), ic: a ? 'ok' : 'saida', b: o ? '#F5F3FF' : a ? '#F0FDF4' : '#FEF2F2', c: o ? '#6D28D9' : a ? '#16A34A' : '#DC2626' });
    });
    movs.sort(function (x, y) { return new Date(x.t) - new Date(y.t); });
    var cx = document.getElementById('cpxMovs');
    if (cx) cx.innerHTML = movs.length ? movs.map(function (m) {
      return '<div class="cpx-mov"><i style="--b:' + m.b + ';--c:' + m.c + '">' + ic(m.ic) + '</i><span><b>' + esc(m.tipo) + '</b> · ' + esc(m.nome) + '<small>' + esc(m.det) + '</small></span><span class="h">' + hora(m.t) + '</span></div>';
    }).join('') : '<div class="cpx-vazio">Sem entradas nem saídas neste dia.</div>';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
  else montar();
})();
