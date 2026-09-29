// ── ZELO — Bloco Operatório (Registo Diário): design novo (turno de 24 horas) ──
// • Monitor do bloco: relógio, gráfico urgentes/eletivas e números do dia.
// • Linha do tempo das 24 horas do turno, com cada cirurgia na sua hora.
// • "Nova cirurgia" com toques: ícone por especialidade, botões grandes para
//   sexo, caráter e desfecho, técnicas anestésicas em cartões com visto.
// • Cirurgias do dia em cartões (ordenadas pela hora), com filtros.
// • Resumo em gráficos (especialidades, técnicas, sexo) e um só aviso ao
//   guardar, com "Desfazer".
// • Telemóvel: botão fixo "+ Nova cirurgia" e formulário em ecrã inteiro.
// Os dados continuam a ser gravados pelas funções da página (addSurgery,
// updateSurgery, removeSurgery) através do formulário original, que fica
// escondido — a gravação, a sincronização, o PDF e o histórico não mudam.
(function () {
  if (window.__zeloBlocoV2) return;
  window.__zeloBlocoV2 = true;

  var URG = '#EF4444', ELT = '#06B6D4';
  var P = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; };
  var IC = {
    bisturi: P('<path d="M20 4 8.5 15.5M8.5 15.5 4 20l1-4.5L16.5 4zM14 6l4 4"/>'),
    osso: P('<path d="M17 3a3 3 0 0 0-2.8 4L7 14.2A3 3 0 1 0 9.8 17L17 9.8A3 3 0 1 0 17 3z"/>'),
    rosto: P('<circle cx="12" cy="10" r="7"/><path d="M9 20h6M9 13c1.5 1.3 4.5 1.3 6 0"/>'),
    gota: P('<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>'),
    cerebro: P('<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 3 5 3 3 0 0 0 5 1V5a3 3 0 0 0-3-1zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-3 5 3 3 0 0 1-5 1"/>'),
    ouvido: P('<path d="M6 9a6 6 0 1 1 12 0c0 3-2 4-3 5.5S14 18 12 20a3 3 0 0 1-4-1"/><path d="M10 9a2 2 0 1 1 4 0c0 1.5-2 2-2 3.5"/>'),
    seringa: P('<path d="m18 2 4 4M17 7l3-3M19 9 8.7 19.3a2 2 0 0 1-2.8 0l-1.2-1.2a2 2 0 0 1 0-2.8L15 5M9 11l4 4M5 19l-3 3M14 4l6 6"/>'),
    coracao: P('<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>'),
    olho: P('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    esteto: P('<path d="M5 3v6a5 5 0 0 0 10 0V3M5 3H3M15 3h2"/><path d="M10 14v2a5 5 0 0 0 10 0v-2"/><circle cx="20" cy="12" r="2"/>'),
    rim: P('<path d="M14 4c3 0 6 3 6 8s-3 8-6 8c-2 0-3-1-3-3 0-1.5 1-2.5 1-5s-1-3.5-1-5c0-2 1-3 3-3zM11 12H6"/>'),
    intestino: P('<path d="M4 8c0-2 2-4 4-4h8c2 0 4 2 4 4s-2 4-4 4H8c-2 0-4 2-4 4s2 4 4 4h8"/>'),
    mais: P('<path d="M12 5v14M5 12h14"/>'),
    cal: P('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
    alerta: P('<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/>'),
    uci: P('<path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/>'),
    sala: P('<path d="M9 18l6-6-6-6"/><path d="M3 12h12"/>'),
    pausa: P('<circle cx="12" cy="12" r="10"/><path d="M10 15V9M14 15V9"/>'),
    ok: P('<path d="M20 6 9 17l-5-5"/>'),
    relogio: P('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'),
    lista: P('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>')
  };
  var ESP = {
    'Cirurgia Geral': ['bisturi', '#CCFBF1', '#0F766E', 'C. Geral'],
    'Ortopedia': ['osso', '#DBEAFE', '#1D4ED8', 'Ortop.'],
    'Maxilo Facial': ['rosto', '#FCE7F3', '#BE185D', 'Maxilo'],
    'Urologia': ['gota', '#FEF3C7', '#B45309', 'Urol.'],
    'Proctologia': ['intestino', '#FFEDD5', '#C2410C', 'Proct.'],
    'Neurocirurgia': ['cerebro', '#EDE9FE', '#6D28D9', 'Neuro'],
    'Otorrinolaringologia': ['ouvido', '#E0F2FE', '#0369A1', 'ORL'],
    'Anestesiologia': ['seringa', '#F1F5F9', '#334155', 'Anest.'],
    'Angeologia': ['coracao', '#FFE4E6', '#BE123C', 'Angeol.'],
    'Oftalmologia': ['olho', '#E0F2FE', '#0E7490', 'Oftalm.'],
    'Medicina Interna': ['esteto', '#DCFCE7', '#15803D', 'Med. Int.'],
    'Nefrologia': ['rim', '#FEF9C3', '#A16207', 'Nefro']
  };
  var ANEST = [['got', 'GOT', 'Geral endotraqueal'], ['gev', 'GEV', 'Geral endovenosa'], ['diss', 'DISS', 'Dissociativa'], ['bal', 'BAL', 'Balanceada'], ['comb', 'COMB', 'Combinada'],
    ['reg', 'REG.', 'Raquidiana'], ['epi', 'EPI', 'Epidural'], ['bn', 'BN', 'Bloqueio nervoso'], ['loc', 'LOC', 'Local']];
  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  var DIAS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

  var css = `
  .bx-faixa,.bx-kpis,.bx-quadro{display:none !important}
  #cirurgias > .section-header,#cirurgias > .card{display:none !important}
  .b2-hero{position:relative;overflow:hidden;border-radius:22px;background:radial-gradient(1100px 280px at 18% -30%,#14B8A6 0%,transparent 60%),linear-gradient(120deg,#042F2E,#0F3B4C 55%,#0B1B2B);color:#fff;padding:20px 22px;display:grid;grid-template-columns:1.1fr 1fr 1.3fr;gap:20px;align-items:center;box-shadow:0 18px 40px rgba(4,47,46,.3);margin-bottom:14px;font-family:Inter,"Segoe UI",Arial,sans-serif}
  .b2-hero .b2-ecg{position:absolute;left:0;right:0;bottom:6px;height:46px;width:100%;opacity:.35;pointer-events:none}
  .b2-hero .b2-ecg path{fill:none;stroke:#5EEAD4;stroke-width:2;stroke-dasharray:1400;stroke-dashoffset:1400;animation:b2Ecg 5s linear infinite}
  @keyframes b2Ecg{to{stroke-dashoffset:0}}
  @media (prefers-reduced-motion:reduce){.b2-hero .b2-ecg path{animation:none;stroke-dashoffset:0}}
  .b2-hero h2{margin:0;font-size:1.35rem;font-weight:800}.b2-sub{opacity:.8;font-size:.82rem;margin-top:3px}
  .b2-clock{font:800 2.3rem ui-monospace,Consolas,monospace;letter-spacing:.04em;margin-top:8px}
  .b2-live{display:inline-flex;align-items:center;gap:8px;margin-top:10px;background:rgba(45,212,191,.14);border:1px solid rgba(94,234,212,.35);border-radius:999px;padding:6px 12px;font:700 .8rem Inter,Arial;color:#99F6E4}
  .b2-live i{width:9px;height:9px;border-radius:50%;background:#94A3B8}.b2-live i.on{background:#2DD4BF;box-shadow:0 0 0 5px rgba(45,212,191,.25)}
  .b2-donut{display:flex;align-items:center;gap:16px;position:relative}
  .b2-lgd div{display:flex;align-items:center;gap:8px;font:600 .82rem Inter,Arial;margin:6px 0}
  .b2-lgd i{width:10px;height:10px;border-radius:3px}.b2-lgd b{font:800 1.05rem ui-monospace,monospace;margin-left:auto;padding-left:14px}
  .b2-mini{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;position:relative}
  .b2-mk{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:10px 12px}
  .b2-mk span{display:flex;align-items:center;gap:6px;font:700 .58rem Inter,Arial;letter-spacing:.08em;text-transform:uppercase;opacity:.8}
  .b2-mk span svg{width:12px;height:12px}
  .b2-mk b{display:block;font:800 1.45rem ui-monospace,monospace;margin-top:4px}
  .b2-card{background:#fff;border:1px solid #E2E8F0;border-radius:18px;box-shadow:0 1px 2px rgba(15,23,42,.04);overflow:hidden;font-family:Inter,"Segoe UI",Arial,sans-serif;color:#0F172A}
  .b2-ch{display:flex;align-items:center;gap:10px;padding:14px 18px;font:800 .95rem Inter,Arial}
  .b2-ch .i{width:34px;height:34px;border-radius:11px;background:linear-gradient(135deg,#14B8A6,#0D9488);display:flex;align-items:center;justify-content:center;box-shadow:0 6px 14px rgba(13,148,136,.3);color:#fff;flex-shrink:0}
  .b2-ch .i svg{width:18px;height:18px}
  .b2-ch small{margin-left:auto;font:600 .72rem Inter,Arial;color:#64748B;text-align:right}
  .b2-tl{padding:0 18px 12px}
  .b2-track{position:relative;border-radius:12px;background:repeating-linear-gradient(90deg,#F8FAFC 0 calc(100%/24 - 1px),#EEF2F7 calc(100%/24 - 1px) calc(100%/24));overflow:hidden}
  .b2-blk{position:absolute;height:30px;border-radius:9px;color:#fff;font:700 .66rem Inter,Arial;padding:3px 6px;white-space:nowrap;overflow:hidden;box-shadow:0 4px 10px rgba(15,23,42,.18);cursor:pointer;line-height:1.15}
  .b2-blk small{display:block;font-weight:600;opacity:.92;font-size:.58rem}
  .b2-blk.u{background:linear-gradient(135deg,#F87171,#DC2626)}.b2-blk.e{background:linear-gradient(135deg,#22D3EE,#0891B2)}
  .b2-now{position:absolute;top:0;bottom:0;width:2px;background:#0F172A}
  .b2-now:after{content:"agora";position:absolute;top:2px;left:4px;font:800 .56rem Inter,Arial;color:#0F172A}
  .b2-ax{display:grid;grid-template-columns:repeat(24,1fr);font:600 .58rem ui-monospace,monospace;color:#94A3B8;margin-top:4px}
  .b2-ax span{text-align:left}
  .b2-sem{font:600 .72rem Inter,Arial;color:#64748B;margin-top:6px}
  .b2-grid{display:grid;grid-template-columns:440px 1fr;gap:16px;align-items:start;margin:14px 0}
  .b2-cb{padding:2px 18px 18px}
  .b2-lab{font:800 .6rem Inter,Arial;letter-spacing:.1em;text-transform:uppercase;color:#64748B;margin:14px 0 8px;display:flex;gap:6px;align-items:center}
  .b2-lab:first-child{margin-top:2px}
  .b2-lab.err{color:#DC2626}
  .b2-esp{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
  .b2-et{border:1.5px solid #E2E8F0;border-radius:14px;padding:9px 4px 7px;text-align:center;font:700 .64rem Inter,Arial;color:#334155;background:#fff;cursor:pointer;line-height:1.2}
  .b2-et .ico{width:32px;height:32px;border-radius:10px;margin:0 auto 5px;display:flex;align-items:center;justify-content:center}
  .b2-et .ico svg{width:17px;height:17px}
  .b2-et.on{border-color:#0D9488;background:#F0FDFA;box-shadow:0 0 0 3px rgba(13,148,136,.15);color:#115E59}
  .b2-pair{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .b2-big{display:grid;grid-template-columns:1fr 1fr;gap:6px}
  .b2-bt{border:1.5px solid #E2E8F0;border-radius:14px;padding:10px 6px;text-align:center;font:800 .86rem Inter,Arial;color:#475569;display:flex;flex-direction:column;align-items:center;gap:3px;background:#fff;cursor:pointer}
  .b2-bt small{font:600 .62rem Inter,Arial}.b2-bt svg{width:18px;height:18px}
  .b2-bt.m.on{background:linear-gradient(135deg,#3B82F6,#2563EB);color:#fff;border-color:transparent;box-shadow:0 8px 18px rgba(37,99,235,.28)}
  .b2-bt.f.on{background:linear-gradient(135deg,#F472B6,#DB2777);color:#fff;border-color:transparent;box-shadow:0 8px 18px rgba(219,39,119,.28)}
  .b2-bt.u.on{background:linear-gradient(135deg,#F87171,#DC2626);color:#fff;border-color:transparent;box-shadow:0 8px 18px rgba(220,38,38,.28)}
  .b2-bt.e.on{background:linear-gradient(135deg,#22D3EE,#0891B2);color:#fff;border-color:transparent;box-shadow:0 8px 18px rgba(8,145,178,.28)}
  .b2-inp{display:flex;align-items:center;gap:8px;border:1.5px solid #E2E8F0;border-radius:14px;padding:0 12px;background:#F8FAFC;height:46px}
  .b2-inp input{border:0 !important;background:transparent !important;outline:none;font:600 .95rem Inter,Arial;color:#0F172A;width:100%;min-width:0;padding:0 !important;box-shadow:none !important}
  .b2-inp span{color:#94A3B8;font-size:.82rem}
  .b2-agora{margin-left:auto;font:800 .64rem Inter,Arial;color:#fff;background:#0D9488;border:0;border-radius:7px;padding:5px 8px;cursor:pointer;white-space:nowrap}
  .b2-an{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
  .b2-at{border:1.5px solid #E2E8F0;border-radius:14px;padding:9px 8px;display:flex;flex-direction:column;gap:2px;font:700 .72rem Inter,Arial;color:#334155;position:relative;cursor:pointer;background:#fff}
  .b2-at i{font-style:normal;font:800 .62rem ui-monospace,monospace;color:#7C3AED}
  .b2-at.on{border-color:#8B5CF6;background:linear-gradient(135deg,#F5F3FF,#EDE9FE);box-shadow:0 0 0 3px rgba(139,92,246,.15)}
  .b2-at.on:after{content:"✓";position:absolute;top:6px;right:8px;width:18px;height:18px;border-radius:50%;background:#8B5CF6;color:#fff;font-size:.66rem;display:flex;align-items:center;justify-content:center}
  .b2-ds{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
  .b2-dt{border:1.5px solid #E2E8F0;border-radius:14px;padding:9px 4px;text-align:center;font:700 .66rem Inter,Arial;color:#334155;cursor:pointer;background:#fff;display:flex;flex-direction:column;align-items:center;gap:3px}
  .b2-dt svg{width:18px;height:18px}.b2-dt .x{font:800 1.05rem Inter,Arial;line-height:18px}
  .b2-dt.on{border-color:#10B981;background:#ECFDF5;color:#065F46}
  .b2-dt.on.ob{border-color:#0F172A;background:#0F172A;color:#fff}
  .b2-acts{display:grid;grid-template-columns:1fr 1.3fr;gap:10px;margin-top:16px}
  .b2-acts.ed{grid-template-columns:1fr 1.5fr}
  .b2-b{border:0;border-radius:14px;padding:14px;font:800 .9rem Inter,Arial;cursor:pointer}
  .b2-b.p{background:linear-gradient(135deg,#14B8A6,#0D9488);color:#fff;box-shadow:0 10px 22px rgba(13,148,136,.3)}
  .b2-b.o{background:#fff;color:#0F766E;border:1.5px solid #99F6E4}
  .b2-edit{display:flex;align-items:center;gap:8px;background:#FEF3C7;color:#92400E;border-radius:12px;padding:8px 12px;font:700 .8rem Inter,Arial;margin-bottom:6px}
  .b2-fil{display:flex;gap:6px;padding:0 18px 6px;flex-wrap:wrap}
  .b2-chip{border:0;border-radius:999px;padding:7px 13px;font:700 .76rem Inter,Arial;color:#475569;background:#F1F5F9;cursor:pointer}
  .b2-chip.on{background:#0B1B2B;color:#fff}.b2-chip b{font-family:ui-monospace,monospace;margin-left:3px}
  .b2-cx{display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center;margin:8px 18px;padding:12px 14px;border-radius:16px;background:#fff;border:1px solid #E2E8F0;box-shadow:0 2px 6px rgba(15,23,42,.04);position:relative}
  .b2-cx:before{content:"";position:absolute;left:0;top:12px;bottom:12px;width:4px;border-radius:0 4px 4px 0;background:var(--c)}
  .b2-cx.ed{outline:2px solid #F59E0B}
  .b2-av{width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center}
  .b2-av svg{width:22px;height:22px}
  .b2-cx .t{min-width:0}.b2-cx .t b{font-size:.95rem}
  .b2-cx .l2{font-size:.78rem;color:#64748B;margin-top:4px;display:flex;gap:6px;flex-wrap:wrap;align-items:center}
  .b2-cx .h{text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:6px}
  .b2-cx .h b{font:800 1.05rem ui-monospace,monospace}
  .b2-cx .ac{display:flex;gap:5px}
  .b2-cx .ac button{border:1px solid #E2E8F0;background:#fff;border-radius:8px;padding:4px 9px;font:700 .72rem Inter,Arial;color:#334155;cursor:pointer}
  .b2-cx .ac button.r{color:#DC2626;border-color:#FECACA}
  .b2-cx:hover .ac button.ed{background:#0B1B2B;color:#fff;border-color:#0B1B2B}
  .b2-tg{border-radius:7px;padding:2px 8px;font:800 .64rem Inter,Arial}
  .b2-tg.u{background:#FEE2E2;color:#B91C1C}.b2-tg.e{background:#CFFAFE;color:#0E7490}.b2-tg.a{background:#EDE9FE;color:#6D28D9}.b2-tg.d{background:#0F172A;color:#fff}.b2-tg.uci{background:#FEF3C7;color:#92400E}.b2-tg.sl{background:#E0F2FE;color:#0369A1}
  .b2-vazio{padding:18px;color:#94A3B8;font:500 .88rem Inter,Arial;text-align:center}
  .b2-grid2{display:grid;grid-template-columns:1.3fr 1fr;gap:16px;margin-bottom:16px}
  .b2-bars{padding:2px 18px 16px}
  .b2-br{display:grid;grid-template-columns:150px 1fr 40px;gap:10px;align-items:center;margin:9px 0;font:700 .8rem Inter,Arial}
  .b2-br .bb{height:14px;border-radius:7px;background:#F1F5F9;overflow:hidden;display:flex}.b2-br .bb i{display:block;height:100%}
  .b2-br b{font-family:ui-monospace,monospace;text-align:right}
  .b2-br.z{opacity:.45}
  .b2-link{border:0;background:none;color:#0F766E;font:700 .76rem Inter,Arial;cursor:pointer;text-decoration:underline;padding:0}
  .b2-anr{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:0 18px 12px}
  .b2-anr div{border-radius:14px;padding:10px;background:linear-gradient(135deg,#F5F3FF,#fff);border:1px solid #EDE9FE}
  .b2-anr b{display:block;font:800 1.3rem ui-monospace,monospace;color:#6D28D9}.b2-anr span{font:700 .64rem Inter,Arial;color:#6B7280}
  .b2-sx{display:flex;align-items:center;gap:18px;padding:4px 18px 18px}
  .b2-toast{position:fixed;left:50%;bottom:24px;transform:translate(-50%,20px);opacity:0;z-index:2147483600;display:flex;gap:12px;align-items:center;background:#0B1B2B;color:#fff;border-radius:14px;padding:12px 16px;font:600 .86rem Inter,Arial;box-shadow:0 14px 30px rgba(15,23,42,.3);transition:opacity .2s,transform .2s;pointer-events:none;max-width:92vw}
  .b2-toast.on{opacity:1;transform:translate(-50%,0);pointer-events:auto}
  .b2-toast .ok{background:#10B981;border-radius:50%;width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}
  .b2-toast .ok svg{width:13px;height:13px}
  .b2-toast .ok.w{background:#F59E0B}
  .b2-toast button{border:0;background:none;color:#5EEAD4;font:800 .84rem Inter,Arial;cursor:pointer}
  #toast-stack{display:none !important}
  .b2-fab{display:none}
  .b2-guard{display:inline-flex;align-items:center;gap:6px;font:600 .72rem Inter,Arial;color:#5EEAD4;white-space:nowrap}
  .b2-guard:before{content:"";width:7px;height:7px;border-radius:50%;background:#2DD4BF}
  .b2-mais{position:relative}
  .b2-menu{position:absolute;right:0;top:calc(100% + 6px);background:#fff;border-radius:12px;box-shadow:0 12px 30px rgba(15,23,42,.25);padding:6px;display:none;z-index:9999;min-width:190px}
  .b2-menu.on{display:flex;flex-direction:column;gap:2px}
  .b2-menu > *{justify-content:flex-start !important;width:100% !important;background:#fff !important;color:#0F172A !important;border:0 !important;box-shadow:none !important;margin:0 !important}
  .b2-menu > *:hover{background:#F1F5F9 !important}
  #b2-mais .b2-menu > *,#b2-mais .b2-menu > * *{color:#0F172A !important;opacity:1 !important;filter:none !important;-webkit-text-fill-color:#0F172A !important}
  html[data-zelo-theme="dark"] .b2-card,html[data-zelo-theme="dark"] .b2-cx,html[data-zelo-theme="dark"] .b2-et,html[data-zelo-theme="dark"] .b2-bt,html[data-zelo-theme="dark"] .b2-at,html[data-zelo-theme="dark"] .b2-dt{background:#111A2B;border-color:#1F2A3D;color:#E6ECF5}
  html[data-zelo-theme="dark"] .b2-inp{background:#0F1828;border-color:#1F2A3D}html[data-zelo-theme="dark"] .b2-inp input{color:#E6ECF5}
  @media (max-width:1100px){.b2-hero{grid-template-columns:1fr 1fr}.b2-hero .b2-mini{grid-column:1/-1;grid-template-columns:repeat(6,1fr)}.b2-grid{grid-template-columns:1fr}.b2-grid2{grid-template-columns:1fr}}
  @media (max-width:700px){
    .b2-hero{grid-template-columns:1fr;padding:16px;gap:12px;border-radius:18px}.b2-clock{font-size:1.7rem}
    .b2-hero .b2-mini{grid-template-columns:repeat(3,1fr);gap:6px}.b2-mk{padding:8px}.b2-mk b{font-size:1.15rem}
    .b2-donut svg{width:100px;height:100px}
    .b2-grid > .b2-form{display:none;position:fixed;inset:0;z-index:2147483646;border-radius:0;overflow:auto;margin:0;padding-bottom:30px}
    .b2-grid > .b2-form .b2-ch{position:sticky;top:0;background:#fff;z-index:2;border-bottom:1px solid #E2E8F0}
    html.b2-form-aberto .b2-fab{display:none}
    .b2-grid > .b2-form.aberto{display:block}
    .b2-fecharf{display:inline-flex !important}
    .b2-form.b2-folha{display:block;position:fixed;inset:0;z-index:2147483646;border-radius:0;overflow:auto;margin:0;padding-bottom:30px}
    .b2-form.b2-folha .b2-ch{position:sticky;top:0;background:#fff;z-index:2;border-bottom:1px solid #E2E8F0}
    .b2-blk small{display:none}.b2-blk{font-size:.56rem;padding:3px 3px}
    .b2-fab{display:block;position:fixed;left:16px;right:76px;bottom:calc(var(--b2-rod,64px) + 12px);z-index:2147483300;border:0;border-radius:18px;padding:15px;font:800 1rem Inter,Arial;color:#fff;background:linear-gradient(135deg,#14B8A6,#0D9488);box-shadow:0 14px 30px rgba(13,148,136,.45)}
    .b2-cx{margin:8px 10px;gap:10px;padding:10px 12px}.b2-av{width:38px;height:38px}
    .b2-esp{grid-template-columns:repeat(3,1fr)}
    .b2-br{grid-template-columns:110px 1fr 30px}
    .main-content{padding-bottom:110px !important}
  }
  .b2-fecharf{display:none;margin-left:auto;border:1px solid #E2E8F0;background:#fff;border-radius:10px;width:36px;height:36px;font-size:1.2rem;cursor:pointer}
  `;

  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(id) { return document.getElementById(id); }
  function lista() {
    try {
      if (typeof surgeries === 'undefined') return [];
      return [].concat((surgeries.urg || []).map(function (s, i) { return Object.assign({}, s, { _src: 'urg', _idx: i }); }),
        (surgeries.elet || []).map(function (s, i) { return Object.assign({}, s, { _src: 'elet', _idx: i }); }))
        .sort(function (a, b) { var x = hmin(a.hora), y = hmin(b.hora); return (x == null ? 9999 : x) - (y == null ? 9999 : y); });
    } catch (e) { return []; }
  }
  function hmin(h) { var m = /^(\d{1,2}):(\d{2})/.exec(String(h || '')); return m ? (+m[1]) * 60 + (+m[2]) : null; }
  function hojeISO() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function dataLonga(iso) { var p = String(iso || '').split('-'); if (p.length !== 3) return ''; var d = new Date(+p[0], +p[1] - 1, +p[2]); return DIAS[d.getDay()] + ', ' + (+p[2]) + ' de ' + MESES[+p[1] - 1]; }
  function espInfo(n) { return ESP[n] || ['bisturi', '#F1F5F9', '#475569', String(n || '—').slice(0, 8)]; }
  function nomeTec(tag) { for (var i = 0; i < ANEST.length; i++) if (ANEST[i][1] === tag) return ANEST[i][2]; return tag; }

  // ── Estado do formulário ──
  var F = null, edit = null, filtro = 'todas', verTodasEsp = false;
  function novoF(manter) {
    F = { esp: manter ? F.esp : '', sexo: '', carac: manter ? F.carac : 'Urgente', idade: '', hora: '', diag: '', anest: {}, desfecho: '' };
  }
  novoF();

  // ── Monitor, linha do tempo, lista e resumo ──
  function desenhar() {
    var ss = lista(), n = ss.length;
    var urg = ss.filter(function (s) { return s.carac === 'Urgente'; }).length, elt = n - urg;
    var mas = ss.filter(function (s) { return s.sexo === 'M'; }).length, fem = ss.filter(function (s) { return s.sexo === 'F'; }).length;
    var ob = ss.filter(function (s) { return s.deceased; }).length, uci = ss.filter(function (s) { return s.transfer === 'UCI'; }).length, sala = ss.filter(function (s) { return s.transfer === 'Sala'; }).length;
    var sus = 0; try { sus = parseInt(($('sus-total') || {}).textContent, 10) || (typeof suspList !== 'undefined' ? suspList.length : 0); } catch (e) {}
    var espN = {}; ss.forEach(function (s) { espN[s.esp] = (espN[s.esp] || 0) + 1; });
    var dataSel = ($('regDate') || {}).value || hojeISO();

    // Monitor
    var h = $('b2-hero');
    if (h) {
      $('b2-data').textContent = dataLonga(dataSel);
      var live = $('b2-live');
      live.innerHTML = '<i class="' + (n ? 'on' : '') + '"></i>' + (n ? 'Bloco em atividade — ' + n + (n === 1 ? ' cirurgia' : ' cirurgias') : 'Sem cirurgias registadas neste turno');
      var C = 2 * Math.PI * 15.9, pu = n ? urg / n : 0;
      $('b2-dn').innerHTML = '<circle cx="21" cy="21" r="15.9" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="5"/>' +
        (n ? '<circle cx="21" cy="21" r="15.9" fill="none" stroke="#F87171" stroke-width="5" stroke-dasharray="' + (pu * 100) + ' ' + (100 - pu * 100) + '" stroke-dashoffset="25" pathLength="100"/>' +
          '<circle cx="21" cy="21" r="15.9" fill="none" stroke="#22D3EE" stroke-width="5" stroke-dasharray="' + ((1 - pu) * 100) + ' ' + (pu * 100) + '" stroke-dashoffset="' + (25 - pu * 100) + '" pathLength="100"/>' : '') +
        '<text x="21" y="22" text-anchor="middle" fill="#fff" font-size="9" font-weight="800" font-family="ui-monospace,monospace">' + n + '</text><text x="21" y="28" text-anchor="middle" fill="#99F6E4" font-size="3" font-weight="700" font-family="Inter,Arial">CIRURGIAS</text>';
      $('b2-lgd').innerHTML = '<div><i style="background:#F87171"></i>Urgentes<b>' + urg + '</b></div><div><i style="background:#22D3EE"></i>Eletivas<b>' + elt + '</b></div><div><i style="background:#F9A8D4"></i>Mulheres<b>' + fem + '</b></div><div><i style="background:#93C5FD"></i>Homens<b>' + mas + '</b></div>';
      var mk = function (ic, rot, v, cor) { return '<div class="b2-mk"><span>' + IC[ic] + rot + '</span><b' + (cor ? ' style="color:' + cor + '"' : '') + '>' + v + '</b></div>'; };
      var ult = ss.filter(function (s) { return hmin(s.hora) != null; }).pop();
      $('b2-mini').innerHTML = mk('pausa', 'Suspensas', sus, '#FCD34D') + mk('alerta', 'Óbitos', ob) + mk('uci', 'Transf. UCI', uci, '#C4B5FD') +
        mk('sala', 'Transf. sala', sala, '#7DD3FC') + mk('lista', 'Especialidades', Object.keys(espN).length) + mk('relogio', 'Última cirurgia', ult ? esc(ult.hora) : '—');
    }

    // Linha do tempo (turno de 24 horas)
    var tr = $('b2-track');
    if (tr) {
      var com = ss.filter(function (s) { return hmin(s.hora) != null; }), sem = n - com.length;
      var lanes = [];
      var blocos = com.map(function (s) {
        var ini = hmin(s.hora), fim = ini + 60, l = 0;
        while (lanes[l] != null && lanes[l] > ini) l++;
        lanes[l] = fim;
        var e = espInfo(s.esp);
        return '<div class="b2-blk ' + (s.carac === 'Urgente' ? 'u' : 'e') + '" data-ed="' + s._src + ':' + s._idx + '" title="' + esc(s.hora + ' · ' + s.esp + ' · ' + s.carac) + '" style="left:calc(' + (ini / 1440 * 100) + '% + 2px);width:calc(' + (100 / 24) + '% * 1.1);top:' + (8 + l * 34) + 'px">' + esc(s.hora) + '<small>' + esc(e[3]) + '</small></div>';
      });
      var nl = Math.max(1, lanes.length);
      tr.style.height = (16 + nl * 34) + 'px';
      var agora = '';
      if (dataSel === hojeISO()) { var d = new Date(); agora = '<div class="b2-now" style="left:' + ((d.getHours() * 60 + d.getMinutes()) / 1440 * 100) + '%"></div>'; }
      tr.innerHTML = blocos.join('') + agora;
      $('b2-sem').textContent = sem ? sem + (sem === 1 ? ' cirurgia sem hora registada (não aparece na linha do tempo).' : ' cirurgias sem hora registada (não aparecem na linha do tempo).') : '';
      $('b2-tl-nota').textContent = com.length ? com.length + ' com hora · turno de 24 horas' : 'Turno de 24 horas';
    }

    // Lista
    var lst = $('b2-lista');
    if (lst) {
      var nInt = ss.filter(function (s) { return s.deceased || s.transfer; }).length;
      $('b2-fil').innerHTML = [['todas', 'Todas', n], ['urg', 'Urgentes', urg], ['elet', 'Eletivas', elt], ['int', 'Com intercorrência', nInt]].map(function (f) {
        return '<button type="button" class="b2-chip' + (filtro === f[0] ? ' on' : '') + '" data-f="' + f[0] + '">' + f[1] + '<b>' + f[2] + '</b></button>';
      }).join('');
      var vis = ss.filter(function (s) { return filtro === 'todas' || (filtro === 'urg' && s.carac === 'Urgente') || (filtro === 'elet' && s.carac !== 'Urgente') || (filtro === 'int' && (s.deceased || s.transfer)); });
      lst.innerHTML = vis.length ? vis.map(function (s) {
        var e = espInfo(s.esp), ed = edit && edit.src === s._src && edit.idx === s._idx;
        var sx = s.sexo === 'M' ? '♂' : s.sexo === 'F' ? '♀' : '';
        return '<div class="b2-cx' + (ed ? ' ed' : '') + '" style="--c:' + (s.carac === 'Urgente' ? URG : ELT) + '"><div class="b2-av" style="background:' + e[1] + ';color:' + e[2] + '">' + IC[e[0]] + '</div>' +
          '<div class="t"><b>' + esc(s.esp) + '</b><div class="l2"><span class="b2-tg ' + (s.carac === 'Urgente' ? 'u' : 'e') + '">' + esc(s.carac) + '</span>' +
          (sx || (s.idade && s.idade !== '—') ? '<span>' + sx + (s.idade && s.idade !== '—' ? ' ' + esc(s.idade) + ' anos' : '') + '</span>' : '') +
          (s.diag && s.diag !== '—' ? '<span>· ' + esc(s.diag) + '</span>' : '') +
          (s.anest || []).map(function (a) { return '<span class="b2-tg a" title="' + esc(nomeTec(a)) + '">' + esc(a) + '</span>'; }).join('') +
          (s.transfer === 'UCI' ? '<span class="b2-tg uci">→ UCI</span>' : s.transfer === 'Sala' ? '<span class="b2-tg sl">→ Sala</span>' : '') +
          (s.deceased ? '<span class="b2-tg d">† Óbito</span>' : '') + '</div></div>' +
          '<div class="h"><b>' + esc(s.hora && s.hora !== '—' ? s.hora : '--:--') + '</b><div class="ac"><button type="button" class="ed" data-ed="' + s._src + ':' + s._idx + '">Editar</button><button type="button" class="r" data-rm="' + s._src + ':' + s._idx + '" title="Remover">×</button></div></div></div>';
      }).join('') : '<div class="b2-vazio">' + (n ? 'Nenhuma cirurgia com este filtro.' : 'Ainda sem cirurgias neste turno. Registe a primeira à esquerda.') + '</div>';
      $('b2-lista-nota').textContent = n ? 'ordenadas pela hora · toque em Editar para corrigir' : '';
    }

    // Resumo
    var bars = $('b2-bars');
    if (bars) {
      var maxE = Math.max.apply(null, Object.keys(espN).map(function (k) { return espN[k]; }).concat([1]));
      var nomes = Object.keys(ESP).filter(function (k) { return verTodasEsp || espN[k]; }).sort(function (a, b) { return (espN[b] || 0) - (espN[a] || 0); });
      Object.keys(espN).forEach(function (k) { if (!ESP[k] && nomes.indexOf(k) < 0) nomes.push(k); });
      bars.innerHTML = (nomes.length ? nomes.map(function (k) {
        var u = ss.filter(function (s) { return s.esp === k && s.carac === 'Urgente'; }).length, t = espN[k] || 0;
        return '<div class="b2-br' + (t ? '' : ' z') + '"><span>' + esc(k) + '</span><div class="bb"><i style="width:' + (u / maxE * 100) + '%;background:linear-gradient(90deg,#F87171,#EF4444)"></i><i style="width:' + ((t - u) / maxE * 100) + '%;background:linear-gradient(90deg,#22D3EE,#06B6D4)"></i></div><b>' + t + '</b></div>';
      }).join('') : '<div class="b2-vazio">Sem cirurgias neste turno.</div>') +
        '<button type="button" class="b2-link" id="b2-vertodas">' + (verTodasEsp ? 'Mostrar só as especialidades com cirurgias' : 'Ver todas as ' + Object.keys(ESP).length + ' especialidades') + '</button>';
      var an = {}; ss.forEach(function (s) { (s.anest || []).forEach(function (a) { an[a] = (an[a] || 0) + 1; }); });
      var top = Object.keys(an).sort(function (a, b) { return an[b] - an[a]; }).slice(0, 3);
      $('b2-anr').innerHTML = top.length ? top.map(function (a) { return '<div><b>' + an[a] + '</b><span>' + esc(nomeTec(a)) + '</span></div>'; }).join('') : '<div style="grid-column:1/-1"><span>Sem técnicas registadas.</span></div>';
      var pm = n ? mas / n * 100 : 0, pf = n ? fem / n * 100 : 0;
      $('b2-sx').innerHTML = '<svg width="72" height="72" viewBox="0 0 42 42"><circle cx="21" cy="21" r="15.9" fill="none" stroke="#F1F5F9" stroke-width="7"/>' +
        (mas ? '<circle cx="21" cy="21" r="15.9" fill="none" stroke="#3B82F6" stroke-width="7" pathLength="100" stroke-dasharray="' + pm + ' ' + (100 - pm) + '" stroke-dashoffset="25"/>' : '') +
        (fem ? '<circle cx="21" cy="21" r="15.9" fill="none" stroke="#EC4899" stroke-width="7" pathLength="100" stroke-dasharray="' + pf + ' ' + (100 - pf) + '" stroke-dashoffset="' + (25 - pm) + '"/>' : '') + '</svg>' +
        '<div style="font:700 .86rem Inter,Arial;line-height:1.9"><span style="color:#2563EB">♂ Homens ' + mas + (n ? ' (' + Math.round(pm) + '%)' : '') + '</span><br><span style="color:#DB2777">♀ Mulheres ' + fem + (n ? ' (' + Math.round(pf) + '%)' : '') + '</span></div>';
    }
  }

  // ── Formulário ──
  function desenharForm() {
    var fm = $('b2-form-corpo'); if (!fm) return;
    var espHtml = Object.keys(ESP).map(function (k) {
      var e = ESP[k];
      return '<div class="b2-et' + (F.esp === k ? ' on' : '') + '" data-esp="' + esc(k) + '"><div class="ico" style="background:' + e[1] + ';color:' + e[2] + '">' + IC[e[0]] + '</div>' + esc(k === 'Otorrinolaringologia' ? 'Otorrino' : k) + '</div>';
    }).join('');
    fm.innerHTML = (edit ? '<div class="b2-edit">' + IC.alerta.replace('<svg ', '<svg width="16" height="16" ') + 'A editar a cirurgia das ' + esc(F.hora || '--:--') + '</div>' : '') +
      '<div class="b2-lab" data-l="esp">Especialidade *</div><div class="b2-esp">' + espHtml + '</div>' +
      '<div class="b2-pair"><div><div class="b2-lab" data-l="sexo">Sexo *</div><div class="b2-big"><div class="b2-bt m' + (F.sexo === 'M' ? ' on' : '') + '" data-sexo="M">♂<small>Masculino</small></div><div class="b2-bt f' + (F.sexo === 'F' ? ' on' : '') + '" data-sexo="F">♀<small>Feminino</small></div></div></div>' +
      '<div><div class="b2-lab">Caráter *</div><div class="b2-big"><div class="b2-bt u' + (F.carac === 'Urgente' ? ' on' : '') + '" data-carac="Urgente">' + IC.alerta + '<small>Urgente</small></div><div class="b2-bt e' + (F.carac === 'Eletiva' ? ' on' : '') + '" data-carac="Eletiva">' + IC.cal + '<small>Eletiva</small></div></div></div></div>' +
      '<div class="b2-pair"><div><div class="b2-lab">Idade</div><div class="b2-inp"><input type="number" min="0" max="120" id="b2-idade" value="' + esc(F.idade) + '" placeholder="—"><span>anos</span></div></div>' +
      '<div><div class="b2-lab">Hora</div><div class="b2-inp"><input type="time" id="b2-hora" value="' + esc(F.hora) + '"><button type="button" class="b2-agora" id="b2-agora">AGORA</button></div></div></div>' +
      '<div class="b2-lab">Diagnóstico</div><div class="b2-inp"><input type="text" id="b2-diag" value="' + esc(F.diag) + '" placeholder="Diagnóstico principal"></div>' +
      '<div class="b2-lab" data-l="anest">Técnica anestésica * <span style="text-transform:none;letter-spacing:0;font-weight:600">— pode escolher várias</span></div><div class="b2-an">' +
      ANEST.map(function (a) { return '<div class="b2-at' + (F.anest[a[0]] ? ' on' : '') + '" data-an="' + a[0] + '"><i>' + a[1] + '</i>' + a[2] + '</div>'; }).join('') + '</div>' +
      '<div class="b2-lab">Desfecho</div><div class="b2-ds">' +
      [['', IC.ok, 'Sem intercorr.'], ['uci', IC.uci, 'Transf. UCI'], ['sala', IC.sala, 'Transf. sala'], ['obito', '<span class="x">†</span>', 'Óbito']].map(function (d) {
        return '<div class="b2-dt' + (F.desfecho === d[0] ? ' on' : '') + (d[0] === 'obito' ? ' ob' : '') + '" data-ds="' + d[0] + '">' + d[1] + d[2] + '</div>';
      }).join('') + '</div>' +
      (edit ? '<div class="b2-acts ed"><button type="button" class="b2-b o" id="b2-cancelar">Cancelar</button><button type="button" class="b2-b p" id="b2-guardar">✓ Atualizar cirurgia</button></div>'
            : '<div class="b2-acts"><button type="button" class="b2-b o" id="b2-outra">Guardar + outra</button><button type="button" class="b2-b p" id="b2-guardar">✓ Guardar cirurgia</button></div>');
  }
  function lerCampos() {
    var i = $('b2-idade'), h = $('b2-hora'), d = $('b2-diag');
    if (i) F.idade = i.value; if (h) F.hora = h.value; if (d) F.diag = d.value;
  }
  function validar() {
    var falta = [];
    if (!F.esp) falta.push('esp'); if (!F.sexo) falta.push('sexo');
    if (!Object.keys(F.anest).some(function (k) { return F.anest[k]; })) falta.push('anest');
    document.querySelectorAll('#b2-form-corpo .b2-lab[data-l]').forEach(function (l) { l.classList.toggle('err', falta.indexOf(l.dataset.l) >= 0); });
    if (falta.length) aviso('Falta escolher: ' + falta.map(function (f) { return { esp: 'especialidade', sexo: 'sexo', anest: 'técnica anestésica' }[f]; }).join(', '), true);
    return !falta.length;
  }
  // Passa os valores para o formulário original (escondido) da página.
  function paraOriginal() {
    var set = function (id, v) { var e = $(id); if (e) e.value = v; };
    set('cir-s-esp', F.esp); set('cir-s-idade', F.idade); set('cir-s-sexo', F.sexo); set('cir-s-diag', F.diag); set('cir-s-carac', F.carac); set('cir-s-hora', F.hora);
    ANEST.forEach(function (a) { var ck = $('cir-ck-' + a[0]); if (ck) ck.checked = !!F.anest[a[0]]; });
    var dec = $('cir-ck-dec'), sa = $('cir-ck-sala'), uc = $('cir-ck-uci');
    if (dec) dec.checked = F.desfecho === 'obito'; if (sa) sa.checked = F.desfecho === 'sala'; if (uc) uc.checked = F.desfecho === 'uci';
  }
  function guardar(outra) {
    lerCampos();
    if (!validar()) return;
    paraOriginal();
    if (edit) {
      if (typeof updateSurgery !== 'function') return;
      updateSurgery(edit.src, edit.idx);
      edit = null; novoF(); desenharForm(); fecharFormMob();
      aviso('Cirurgia atualizada');
    } else {
      if (typeof addSurgery !== 'function') return;
      var antes = {}; lista().forEach(function (s) { if (s.id) antes[s.id] = 1; });
      addSurgery('cir');
      var nova = lista().filter(function (s) { return s.id && !antes[s.id]; })[0];
      if (!nova) return;
      var horaTxt = nova.hora && nova.hora !== '—' ? 'das ' + nova.hora : 'de ' + nova.esp;
      novoF(outra); desenharForm();
      if (!outra) fecharFormMob();
      aviso('Cirurgia ' + horaTxt + ' guardada', false, function () {
        var s = lista().filter(function (x) { return x.id === nova.id; })[0];
        if (s && typeof removeSurgery === 'function') { removeSurgery(s._src, s._idx); aviso('Registo desfeito'); desenhar(); }
      });
    }
    desenhar();
  }
  function editar(src, idx) {
    var s; try { s = surgeries[src][idx]; } catch (e) {} if (!s) return;
    edit = { src: src, idx: idx };
    var an = {}; ANEST.forEach(function (a) { if ((s.anest || []).indexOf(a[1]) >= 0) an[a[0]] = true; });
    F = { esp: s.esp === '—' ? '' : s.esp, sexo: s.sexo === '—' ? '' : s.sexo, carac: s.carac || 'Urgente', idade: s.idade === '—' ? '' : s.idade, hora: s.hora === '—' ? '' : s.hora,
      diag: s.diag === '—' ? '' : s.diag, anest: an, desfecho: s.deceased ? 'obito' : s.transfer === 'UCI' ? 'uci' : s.transfer === 'Sala' ? 'sala' : '' };
    desenharForm(); desenhar(); abrirFormMob();
    var f = $('b2-form'); if (f && window.innerWidth > 700) f.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function remover(src, idx) {
    var s; try { s = surgeries[src][idx]; } catch (e) {} if (!s) return;
    if (!confirm('Remover a cirurgia ' + (s.hora && s.hora !== '—' ? 'das ' + s.hora + ' ' : '') + '(' + s.esp + ')?')) return;
    if (edit && edit.src === src && edit.idx === idx) { edit = null; novoF(); desenharForm(); }
    removeSurgery(src, idx); desenhar(); aviso('Cirurgia removida');
  }
  // Altura da barra "Guardar Registo" do rodapé, para o botão ficar por cima dela.
  function medirRodape() { var sb = document.querySelector('.save-bar'); if (sb) document.documentElement.style.setProperty('--b2-rod', (sb.getBoundingClientRect().height || 60) + 'px'); }
  // No telemóvel o formulário abre em ecrã inteiro: passa para o <body> (fora
  // de contentores que o limitariam) e volta ao seu lugar ao fechar.
  var lugarForm = null;
  function abrirFormMob() {
    var f = $('b2-form'); if (!f) return;
    f.classList.add('aberto');
    if (window.innerWidth <= 700) {
      if (!lugarForm) { lugarForm = document.createComment('b2-form'); f.parentNode.insertBefore(lugarForm, f); }
      document.body.appendChild(f); f.classList.add('b2-folha');
      document.documentElement.classList.add('b2-form-aberto'); f.scrollTop = 0;
    }
  }
  function fecharFormMob() {
    var f = $('b2-form'); if (!f) return;
    f.classList.remove('aberto', 'b2-folha');
    if (lugarForm && lugarForm.parentNode) { lugarForm.parentNode.insertBefore(f, lugarForm); lugarForm.parentNode.removeChild(lugarForm); lugarForm = null; }
    document.documentElement.classList.remove('b2-form-aberto');
  }

  // ── Um só aviso, discreto ──
  var tEl, tT;
  function aviso(txt, alerta, desfazer) {
    if (!tEl) { tEl = document.createElement('div'); tEl.className = 'b2-toast'; tEl.setAttribute('role', 'status'); document.body.appendChild(tEl); }
    tEl.innerHTML = '<span class="ok' + (alerta ? ' w' : '') + '">' + (alerta ? '!' : IC.ok) + '</span><span>' + esc(txt) + '</span>' + (desfazer ? '<button type="button">Desfazer</button>' : '');
    if (desfazer) tEl.querySelector('button').onclick = function () { tEl.classList.remove('on'); desfazer(); };
    tEl.classList.add('on'); clearTimeout(tT); tT = setTimeout(function () { tEl.classList.remove('on'); }, desfazer ? 5000 : 3000);
  }
  function limparTexto(m) { var d = document.createElement('div'); d.innerHTML = String(m || ''); return (d.textContent || '').replace(/^[✓⚠✔\s]+/, '').trim(); }

  // ── Cabeçalho: "⋯ Mais" com Início, Cópia de segurança e Tema; indicador "Guardado" ──
  function cabecalho() {
    var cab = document.querySelector('.zc-cab'); if (!cab || $('b2-mais')) return;
    var bts = Array.prototype.filter.call(cab.querySelectorAll('button,a'), function (b) { return /^(Início|Backup|Tema)$/i.test((b.textContent || '').trim()); });
    if (!bts.length) return;
    var w = document.createElement('div'); w.className = 'b2-mais'; w.id = 'b2-mais';
    var t = document.createElement('button'); t.type = 'button'; t.className = bts[0].className; t.textContent = '⋯ Mais'; t.setAttribute('aria-haspopup', 'true');
    var m = document.createElement('div'); m.className = 'b2-menu';
    bts[0].parentNode.insertBefore(w, bts[0]);
    w.appendChild(t); w.appendChild(m);
    bts.forEach(function (b) { m.appendChild(b); if (/Backup/i.test(b.textContent)) b.lastChild && (b.lastChild.textContent = ' Cópia de segurança'); });
    t.addEventListener('click', function (e) { e.stopPropagation(); m.classList.toggle('on'); });
    document.addEventListener('click', function (e) { if (!w.contains(e.target)) m.classList.remove('on'); });
    m.addEventListener('click', function () { setTimeout(function () { m.classList.remove('on'); }, 0); });
    var g = document.createElement('span'); g.className = 'b2-guard'; g.id = 'b2-guard'; g.style.display = 'none';
    w.parentNode.insertBefore(g, w);
  }
  var ultGuardado = 0;
  function guardado() {
    var g = $('b2-guard'); if (!g || !ultGuardado) return;
    var s = Math.round((Date.now() - ultGuardado) / 1000);
    g.textContent = 'Guardado · ' + (s < 10 ? 'agora' : s < 60 ? 'há ' + s + ' s' : 'há ' + Math.round(s / 60) + ' min');
    g.style.display = '';
  }

  // ── Montagem ──
  function montar() {
    var sec = $('cirurgias');
    if (!sec || $('b2-hero') || typeof addSurgery !== 'function') return false;
    var st = document.createElement('style'); st.id = 'b2-estilos'; st.textContent = css; document.head.appendChild(st);
    var raiz = document.createElement('div'); raiz.id = 'b2-raiz';
    raiz.innerHTML =
      '<div class="b2-hero" id="b2-hero"><svg class="b2-ecg" viewBox="0 0 1200 46" preserveAspectRatio="none" aria-hidden="true"><path d="M0 30 H180 l10 0 8 -16 8 30 8 -22 6 8 H420 l10 0 8 -16 8 30 8 -22 6 8 H660 l10 0 8 -16 8 30 8 -22 6 8 H900 l10 0 8 -16 8 30 8 -22 6 8 H1200"/></svg>' +
        '<div style="position:relative"><h2 id="b2-data"></h2><div class="b2-sub">Registo diário do Bloco Operatório · turno de 24 horas</div><div class="b2-clock" id="b2-clock">--:--</div><span class="b2-live" id="b2-live"></span></div>' +
        '<div class="b2-donut"><svg id="b2-dn" width="126" height="126" viewBox="0 0 42 42" style="transform:none"></svg><div class="b2-lgd" id="b2-lgd"></div></div>' +
        '<div class="b2-mini" id="b2-mini"></div></div>' +
      '<div class="b2-card"><div class="b2-ch"><span class="i">' + IC.relogio + '</span>Linha do tempo do turno (24 horas)<small><span id="b2-tl-nota"></span><br><span style="color:#EF4444">■</span> Urgente &nbsp;<span style="color:#06B6D4">■</span> Eletiva</small></div>' +
        '<div class="b2-tl"><div class="b2-track" id="b2-track"></div><div class="b2-ax">' + Array.apply(null, Array(24)).map(function (x, i) { return '<span>' + (i % 3 === 0 ? String(i).padStart(2, '0') + 'h' : '') + '</span>'; }).join('') + '</div><div class="b2-sem" id="b2-sem"></div></div></div>' +
      '<div class="b2-grid"><div class="b2-card b2-form" id="b2-form"><div class="b2-ch"><span class="i">' + IC.mais + '</span>Nova cirurgia<small>campos grandes, toques rápidos</small><button type="button" class="b2-fecharf" id="b2-fecharf" aria-label="Fechar">×</button></div><div class="b2-cb" id="b2-form-corpo"></div></div>' +
        '<div class="b2-card"><div class="b2-ch"><span class="i" style="background:linear-gradient(135deg,#0EA5E9,#2563EB);box-shadow:0 6px 14px rgba(37,99,235,.3)">' + IC.cal + '</span>Cirurgias do turno<small id="b2-lista-nota"></small></div><div class="b2-fil" id="b2-fil"></div><div id="b2-lista"></div><div style="height:12px"></div></div></div>' +
      '<div class="b2-grid2"><div class="b2-card"><div class="b2-ch"><span class="i" style="background:linear-gradient(135deg,#F59E0B,#EA580C);box-shadow:0 6px 14px rgba(234,88,12,.3)">' + IC.osso + '</span>Especialidades do turno<small>urgente · eletiva</small></div><div class="b2-bars" id="b2-bars"></div></div>' +
        '<div class="b2-card"><div class="b2-ch"><span class="i" style="background:linear-gradient(135deg,#8B5CF6,#6D28D9);box-shadow:0 6px 14px rgba(109,40,217,.3)">' + IC.gota + '</span>Anestesia e sexo<small>técnicas mais usadas</small></div><div class="b2-anr" id="b2-anr"></div><div class="b2-sx" id="b2-sx"></div></div></div>' +
      '<button type="button" class="b2-fab" id="b2-fab">＋ Nova cirurgia</button>';
    sec.insertBefore(raiz, sec.firstChild);

    document.addEventListener('click', function (e) {
      if (!e.target.closest || !e.target.closest('#b2-raiz,#b2-form')) return;
      var t;
      if ((t = e.target.closest('[data-esp]'))) { lerCampos(); F.esp = t.dataset.esp; desenharForm(); return; }
      if ((t = e.target.closest('[data-sexo]'))) { lerCampos(); F.sexo = t.dataset.sexo; desenharForm(); return; }
      if ((t = e.target.closest('[data-carac]'))) { lerCampos(); F.carac = t.dataset.carac; desenharForm(); return; }
      if ((t = e.target.closest('[data-an]'))) { lerCampos(); F.anest[t.dataset.an] = !F.anest[t.dataset.an]; desenharForm(); return; }
      if ((t = e.target.closest('[data-ds]'))) { lerCampos(); F.desfecho = t.dataset.ds; desenharForm(); return; }
      if (e.target.closest('#b2-agora')) { var d = new Date(); var h = $('b2-hora'); if (h) h.value = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); lerCampos(); return; }
      if (e.target.closest('#b2-guardar')) { guardar(false); return; }
      if (e.target.closest('#b2-outra')) { guardar(true); return; }
      if (e.target.closest('#b2-cancelar')) { edit = null; novoF(); desenharForm(); desenhar(); fecharFormMob(); return; }
      if (e.target.closest('#b2-fecharf')) { fecharFormMob(); return; }
      if (e.target.closest('#b2-fab')) { abrirFormMob(); return; }
      if ((t = e.target.closest('[data-f]'))) { filtro = t.dataset.f; desenhar(); return; }
      if (e.target.closest('#b2-vertodas')) { verTodasEsp = !verTodasEsp; desenhar(); return; }
      if ((t = e.target.closest('[data-ed]'))) { var p = t.dataset.ed.split(':'); editar(p[0], +p[1]); return; }
      if ((t = e.target.closest('[data-rm]'))) { var q = t.dataset.rm.split(':'); remover(q[0], +q[1]); return; }
    });

    desenharForm(); desenhar(); cabecalho();
    medirRodape(); window.addEventListener('resize', medirRodape);

    // Avisos da página: um só, discreto (os da página empilhavam-se).
    var tipos = { error: 1, err: 1, warn: 1, warning: 1 };
    var novoToast = function (msg, type) { var t = limparTexto(msg); if (/^Cirurgia registada|^Cirurgia actualizada|^Cirurgia atualizada/i.test(t)) return; aviso(t, !!tipos[type] || /^Preencha|Não é possível/i.test(t)); };
    window.toast = novoToast; window.showToast = function (m, t) { novoToast(m, t); };

    // Redesenha quando os dados mudam (troca de dia, sincronização…).
    ['renderSurgeriesCombined', 'renderSuspensas', 'loadFromStorage'].forEach(function (nome) {
      var f = window[nome]; if (typeof f !== 'function' || f.__b2) return;
      var nf = function () { var r = f.apply(this, arguments); try { desenhar(); } catch (e) {} return r; }; nf.__b2 = true; window[nome] = nf;
    });
    var ps = window.persist;
    if (typeof ps === 'function' && !ps.__b2) { var np = function () { var r = ps.apply(this, arguments); ultGuardado = Date.now(); guardado(); return r; }; np.__b2 = true; window.persist = np; }
    var dt = $('regDate'); if (dt) dt.addEventListener('change', function () { edit = null; novoF(); desenharForm(); setTimeout(desenhar, 400); });
    var relogio = function () { var c = $('b2-clock'); if (c) { var d = new Date(); c.textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); } guardado(); };
    relogio(); setInterval(relogio, 15000);
    setInterval(desenhar, 5000);
    return true;
  }
  var n = 0, iv = setInterval(function () { if (montar() || ++n > 40) clearInterval(iv); }, 250);
})();
