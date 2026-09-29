// ── ZELO — Vídeo de instruções: "Como se calcula o Movimento Hospitalar" ──
// Botão "▶ Instruções" no cabeçalho das páginas de Movimento (substitui o
// botão de ajuda) e do Movimento Hospitalar Geral. Abre um leitor com 8 cenas
// animadas (desenhos SVG), narração em português (voz do próprio aparelho) e
// legendas. Cerca de 2 min 30 s.
// Não usa o Firebase nem descarrega nada: tudo é desenhado e narrado aqui
// (não gasta a quota gratuita nem dados móveis).
(function () {
  if (window.ZeloVideoMov) return;

  // ── Desenhos ──
  var CAMA = '<g id="vmCama"><rect x="0" y="10" width="46" height="26" rx="5" fill="#E9EEF4" stroke="#94A3B8"/><rect x="3" y="13" width="12" height="10" rx="3" fill="#fff" stroke="#CBD5E1"/><rect x="0" y="34" width="4" height="8" fill="#94A3B8"/><rect x="42" y="34" width="4" height="8" fill="#94A3B8"/></g>';
  var DOENTE = '<g id="vmDoente"><use href="#vmCama"/><circle cx="12" cy="14" r="7" fill="#F59E0B"/><rect x="18" y="14" width="26" height="14" rx="5" fill="#0891B2"/></g>';
  function a(d, conteudo, extra) { return '<g class="vm-a' + (extra ? ' ' + extra : '') + '" style="--d:' + d + 's">' + conteudo + '</g>'; }
  function t(x, y, txt, o) { o = o || {}; return '<text x="' + x + '" y="' + y + '" font-family="Inter,Arial,sans-serif" font-size="' + (o.s || 13) + '" font-weight="' + (o.w || 400) + '" fill="' + (o.c || '#0F172A') + '"' + (o.m ? ' text-anchor="middle"' : '') + '>' + txt + '</text>'; }
  function svg(fundo, corpo) { return '<svg viewBox="0 0 520 292" xmlns="http://www.w3.org/2000/svg"><defs>' + CAMA + DOENTE + '</defs><rect width="520" height="292" fill="' + fundo + '"/>' + corpo + '</svg>'; }
  function camas(lista) { // lista: [x, y, tipo] tipo: c=cama, d=doente, x=fora de uso
    return lista.map(function (c, i) {
      var g = c[2] === 'd' ? '<use href="#vmDoente"/>' : '<use href="#vmCama"/>';
      if (c[2] === 'x') g += '<path d="M8 14 L38 38 M38 14 L8 38" stroke="#DC2626" stroke-width="4"/>';
      return a(c[3] || (0.3 + i * 0.12), '<g transform="translate(' + c[0] + ',' + c[1] + ')">' + g + '</g>');
    }).join('');
  }

  var CENAS_MOV = [
    { dur: 12, cor: '#1E3A5F', titulo: 'Abertura',
      falas: ['Olá! Neste vídeo vamos ver, passo a passo, como se calcula o Movimento Hospitalar de um serviço.', 'Que dados registar, o que são os dias-cama e os dias-doente, e porque são tão importantes.'],
      svg: function () {
        return svg('#12243B',
          a(0.2, '<g transform="translate(60,70)"><rect x="0" y="40" width="150" height="120" rx="6" fill="#E9EEF4"/><rect x="45" y="0" width="60" height="160" rx="6" fill="#F8FAFC"/><rect x="66" y="14" width="18" height="44" rx="3" fill="#DC2626"/><rect x="53" y="27" width="44" height="18" rx="3" fill="#DC2626"/><rect x="62" y="122" width="26" height="38" rx="3" fill="#1E3A5F"/></g>') +
          [[72, 130], [72, 162], [176, 130], [176, 162], [118, 146]].map(function (w, i) { return a(0.8 + i * 0.25, '<rect x="' + w[0] + '" y="' + w[1] + '" width="' + (i === 4 ? 34 : 22) + '" height="18" rx="3" fill="#FDE68A"/>'); }).join('') +
          a(1.6, t(250, 112, 'ZELO · HOSPITAL DO PRENDA', { s: 13, w: 700, c: '#7DD3FC' })) +
          a(2.0, t(250, 150, 'Movimento', { s: 30, w: 800, c: '#fff' }) + t(250, 184, 'Hospitalar', { s: 30, w: 800, c: '#fff' })) +
          a(2.6, t(250, 214, 'Como se calcula, em 2 minutos', { s: 14, c: '#CBD5E1' })));
      } },
    { dur: 22, cor: '#0891B2', titulo: 'Como achar o "Ficam existindo"',
      falas: ['Todos os dias o serviço faz uma conta simples.', 'Existência anterior, que são os doentes que já estavam, mais as entradas, menos as saídas, é igual a ficam existindo.', 'Por exemplo: 20 mais 3, menos 2, ficam existindo 21.', 'E os 21 que ficam hoje são a existência anterior de amanhã.'],
      svg: function () {
        var cx = function (x, w, fundo, num, cor, rot, sub, d) { return a(d, '<rect x="' + x + '" y="72" width="' + w + '" height="104" rx="14" fill="' + fundo + '"/>' + t(x + w / 2, 122, num, { s: 34, w: 800, c: cor, m: 1 }) + t(x + w / 2, 148, rot, { s: 10.5, w: 800, c: cor === '#fff' ? '#CBD5E1' : cor, m: 1 }) + (sub ? t(x + w / 2, 163, sub, { s: 9.5, c: '#64748B', m: 1 }) : '')); };
        return svg('#F8FAFC',
          a(0.1, t(24, 36, 'Como achar o "Ficam existindo"', { s: 17, w: 800, c: '#1E3A5F' })) +
          cx(16, 104, '#E9EEF4', '20', '#1E3A5F', 'EXISTÊNCIA', '(já estavam)', 0.6) +
          a(1.4, t(138, 132, '+', { s: 30, w: 800, c: '#94A3B8', m: 1 })) + cx(156, 100, '#ECFEFF', '3', '#0891B2', 'ENTRADAS', '', 1.6) +
          a(2.4, t(274, 132, '−', { s: 30, w: 800, c: '#94A3B8', m: 1 })) + cx(292, 100, '#F5F3FF', '2', '#7C3AED', 'SAÍDAS', '', 2.6) +
          a(3.4, t(410, 132, '=', { s: 30, w: 800, c: '#94A3B8', m: 1 })) + cx(428, 80, '#1E3A5F', '21', '#fff', 'FICAM', 'existindo', 3.6) +
          a(2.0, '<g fill="#0891B2"><circle cx="184" cy="204" r="7"/><circle cx="206" cy="204" r="7"/><circle cx="228" cy="204" r="7"/></g>', 'vm-entra') +
          a(3.0, '<g fill="#7C3AED"><circle cx="331" cy="204" r="7"/><circle cx="353" cy="204" r="7"/></g>', 'vm-sai') +
          a(5.0, '<rect x="60" y="232" width="400" height="36" rx="10" fill="#1E3A5F"/>' + t(260, 255, 'Ficam existindo = Existência + Entradas − Saídas', { s: 13, w: 700, c: '#fff', m: 1 })));
      } },
    { dur: 20, cor: '#7C3AED', titulo: 'Os dados a registar',
      falas: ['As entradas dividem-se em diretos, que chegam do Banco de Urgência ou da consulta, e transferidos de outro serviço.', 'As saídas são as altas, os óbitos, separados em menos de 48 horas e 48 horas ou mais, e as transferências.', 'No ZELO, tudo isto é preenchido sozinho a partir do Controlo de Pacientes.'],
      svg: function () {
        var c = function (x, y, w, h, t1, t2, d, c2) { return a(d, '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="10" fill="#fff"/>' + t(x + 12, y + 22, t1, { s: 12.5, w: 700 }) + (t2 ? t(x + 12, y + 38, t2, { s: 10.5, c: c2 || '#64748B' }) : '')); };
        return svg('#F8FAFC',
          a(0.1, t(24, 36, 'Os dados a registar', { s: 17, w: 800, c: '#1E3A5F' })) +
          a(0.4, '<rect x="20" y="56" width="230" height="210" rx="14" fill="#ECFEFF" stroke="#A5F3FC"/>' + t(36, 84, '↘ ENTRADAS', { s: 14, w: 800, c: '#0891B2' })) +
          c(36, 100, 198, 54, 'Diretos', 'Banco de Urgência, consulta…', 0.9) + c(36, 164, 198, 54, 'Transferidos', 'vêm de outro serviço', 1.6) +
          a(5.5, '<rect x="270" y="56" width="230" height="210" rx="14" fill="#F5F3FF" stroke="#DDD6FE"/>' + t(286, 84, '↗ SAÍDAS', { s: 14, w: 800, c: '#7C3AED' })) +
          c(286, 98, 198, 34, 'Altas (vivos)', '', 6.2) + c(286, 140, 96, 48, 'Óbito', '< 48 horas', 7.2, '#DC2626') + c(388, 140, 96, 48, 'Óbito', '≥ 48 horas', 7.6, '#DC2626') +
          c(286, 196, 198, 34, 'Transferidos', '', 8.4) + a(12, t(286, 254, 'Tudo vem do Controlo de Pacientes.', { s: 11, w: 700, c: '#059669' })));
      } },
    { dur: 22, cor: '#059669', titulo: 'Dias-cama',
      falas: ['Os dias-cama são as camas disponíveis e prontas a usar, em cada dia.', 'Se o serviço tem 12 camas e 2 estão avariadas, nesse dia há 10 dias-cama.', 'No mês somam-se todos os dias: 12 camas vezes 30 dias dá 360 dias-cama.', 'As camas fora de uso não contam. E se o serviço empresta uma cama a outro serviço, perde esse dia-cama, e o outro ganha-o.'],
      svg: function () {
        var l = []; for (var i = 0; i < 6; i++) l.push([24 + i * 56, 72, 'c']); for (i = 0; i < 6; i++) l.push([24 + i * 56, 128, i >= 4 ? 'x' : 'c', i >= 4 ? 5.2 + (i - 4) * 0.4 : null]);
        return svg('#F8FAFC',
          a(0.1, t(24, 36, 'Dias-cama (DC)', { s: 17, w: 800, c: '#059669' }) + t(24, 56, 'Camas disponíveis e prontas a usar, em cada dia', { s: 12, c: '#475569' })) +
          camas(l) + a(2.5, t(372, 95, '12 camas', { s: 13, c: '#475569' })) + a(5.4, t(372, 118, '− 2 avariadas', { s: 13, c: '#DC2626' })) +
          a(6.4, t(372, 152, '= 10 DC', { s: 24, w: 800, c: '#059669' }) + t(372, 170, 'neste dia', { s: 11, c: '#64748B' })) +
          a(10, '<rect x="24" y="200" width="472" height="70" rx="12" fill="#ECFDF5"/>' + t(40, 228, 'No mês: soma de todos os dias', { s: 14, w: 800, c: '#065F46' }) + t(40, 254, '12 camas × 30 dias = 360 DC  (menos as camas fora de uso)', { s: 13, c: '#065F46' })));
      } },
    { dur: 21, cor: '#D97706', titulo: 'Dias-doente',
      falas: ['Os dias-doente são os doentes internados em cada dia. É o ficam existindo da conta de cada dia.', 'Se hoje ficaram 9 doentes, são 9 dias-doente.', 'No mês somam-se os de todos os dias: por exemplo, 270 dias-doente.', 'Normalmente, os dias-doente não podem ser maiores do que os dias-cama.'],
      svg: function () {
        var l = []; for (var i = 0; i < 6; i++) l.push([24 + i * 56, 72, i === 4 ? 'c' : 'd', 0.5 + i * 0.35]); for (i = 0; i < 4; i++) l.push([24 + i * 56, 128, 'd', 2.6 + i * 0.35]);
        return svg('#F8FAFC',
          a(0.1, t(24, 36, 'Dias-doente (DD)', { s: 17, w: 800, c: '#D97706' }) + t(24, 56, 'Doentes internados em cada dia = o "ficam existindo" do dia', { s: 12, c: '#475569' })) +
          camas(l) + a(4.2, t(372, 110, '9 camas ocupadas', { s: 13, c: '#475569' })) + a(5.0, t(372, 142, '= 9 DD', { s: 24, w: 800, c: '#D97706' }) + t(372, 160, 'neste dia', { s: 11, c: '#64748B' })) +
          a(9, '<rect x="24" y="200" width="472" height="70" rx="12" fill="#FFFBEB"/>' + t(40, 228, 'No mês: soma dos doentes de cada dia', { s: 14, w: 800, c: '#92400E' }) + t(40, 254, 'Ex.: 9 + 10 + 8 + … (30 dias) = 270 DD', { s: 13, c: '#92400E' })));
      } },
    { dur: 21, cor: '#DC2626', titulo: 'Taxa de ocupação',
      falas: ['Com estes dois números sabemos se o serviço está bem aproveitado.', 'Dias-doente a dividir por dias-cama, vezes 100, dá a taxa de ocupação: 270 a dividir por 360 são 75 por cento.', 'Abaixo de 85 por cento há folga. Acima, o serviço está sobrelotado e é preciso agir.'],
      svg: function () {
        return svg('#F8FAFC',
          a(0.1, t(24, 36, 'Porque são importantes: a Taxa de Ocupação', { s: 17, w: 800, c: '#DC2626' })) +
          a(1.5, t(130, 100, '270 DD', { s: 30, w: 800, c: '#D97706', m: 1 })) + a(2.3, '<line x1="60" y1="114" x2="200" y2="114" stroke="#0F172A" stroke-width="3"/>') +
          a(2.8, t(130, 148, '360 DC', { s: 30, w: 800, c: '#059669', m: 1 })) + a(3.6, t(130, 188, '× 100', { s: 16, c: '#475569', m: 1 })) + a(6.0, t(130, 240, '= 75 %', { s: 36, w: 800, c: '#1E3A5F', m: 1 })) +
          a(0.6, '<g transform="translate(370,175)"><path d="M-110 0 A110 110 0 0 1 110 0" fill="none" stroke="#E2E8F0" stroke-width="22"/><path d="M-110 0 A110 110 0 0 1 -34 -104.6" fill="none" stroke="#16A34A" stroke-width="22"/><path d="M-34 -104.6 A110 110 0 0 1 78 -77.8" fill="none" stroke="#F59E0B" stroke-width="22"/><path d="M78 -77.8 A110 110 0 0 1 110 0" fill="none" stroke="#DC2626" stroke-width="22" class="vm-pisca"/>' +
            '<g class="vm-ponteiro"><line x1="0" y1="0" x2="34" y2="-78" stroke="#0F172A" stroke-width="5" stroke-linecap="round"/></g><circle r="9" fill="#0F172A"/>' +
            t(-112, 26, '0%', { s: 11, c: '#64748B', m: 1 }) + t(84, -92, '85%', { s: 11, c: '#DC2626' }) + t(112, 26, '100%', { s: 11, c: '#64748B', m: 1 }) + t(0, 46, 'acima de 85%: sobrelotado', { s: 12, c: '#475569', m: 1 }) + '</g>'));
      } },
    { dur: 16, cor: '#2B5A8A', titulo: 'Outros indicadores',
      falas: ['A partir daqui, o ZELO calcula sozinho os outros indicadores.', 'A média de estadia: quantos dias cada doente fica. A média de camas reais. O índice de rotação: quantos doentes passam por cada cama.', 'O intervalo de substituição: quantos dias a cama fica vazia entre dois doentes. E a mortalidade bruta e líquida.'],
      svg: function () {
        var k = function (x, y, w, t1, t2, d, f, cor) { return a(d, '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="62" rx="12" fill="' + (f || '#fff') + '" stroke="#E3E8F0"/>' + t(x + 14, y + 24, t1, { s: 13, w: 800, c: cor || '#1E3A5F' }) + t(x + 14, y + 46, t2, { s: 11.5, c: '#475569' })); };
        return svg('#F8FAFC',
          a(0.1, t(24, 36, 'Outros indicadores (calculados sozinhos)', { s: 17, w: 800, c: '#2B5A8A' })) +
          k(20, 54, 232, 'Média de estadia', 'DD ÷ saídos → 270 ÷ 30 = 9 dias', 3.0) + k(268, 54, 232, 'Média de camas reais', 'DC ÷ dias → 360 ÷ 30 = 12', 5.2) +
          k(20, 128, 232, 'Índice de rotação', 'saídos ÷ camas reais → 30 ÷ 12 = 2,5', 7.0) + k(268, 128, 232, 'Intervalo de substituição', '(DC − DD) ÷ saídos → 90 ÷ 30 = 3', 10.0) +
          k(20, 202, 480, 'Mortalidade bruta · líquida', 'óbitos ÷ saídos × 100  ·  óbitos ≥48 h ÷ (saídos − óbitos <48 h) × 100', 13.5, '#FEF2F2', '#991B1B'));
      } },
    { dur: 16, cor: '#64748B', titulo: 'Regras de ouro',
      falas: ['Três regras de ouro. Registe todos os dias no Controlo de Pacientes.', 'Para corrigir um número, corrija o registo do doente.', 'E marque as camas fora de uso. Assim o Movimento fica sempre certo. Obrigado!'],
      svg: function () {
        var r = function (y, n, cor, t1, t2, d) { return a(d, '<circle cx="50" cy="' + y + '" r="18" fill="' + cor + '"/>' + t(50, y + 6, n, { s: 16, w: 800, c: '#fff', m: 1 }) + t(80, y - 4, t1, { s: 14, w: 700, c: '#fff' }) + t(80, y + 14, t2, { s: 12, c: '#94A3B8' })); };
        return svg('#0E1A2B', a(0.1, t(260, 44, '3 regras de ouro', { s: 18, w: 800, c: '#fff', m: 1 })) +
          r(92, '1', '#16A34A', 'Registe todos os dias no Controlo de Pacientes', 'entradas e saídas com a data e hora certas', 0.8) +
          r(152, '2', '#0891B2', 'Para corrigir um número, corrija o doente', 'o Movimento recalcula sozinho', 4.5) +
          r(212, '3', '#D97706', 'Marque as camas fora de uso e confirme as camas', 'no topo da página do Movimento', 8.0) +
          a(11, t(260, 272, 'ZELO — Serviço de Admissão e Arquivo Médico e Estatístico', { s: 12, c: '#7DD3FC', m: 1 })));
      } }
  ];
  // O mesmo leitor serve outros vídeos (ex.: Controlo de Pacientes — zelo_video_cp.js):
  // window.ZELO_VIDEO_DEF = { titulo, cenas, escritas() }.
  var DEF_MOV = { titulo: 'Como se calcula o Movimento Hospitalar', cenas: CENAS_MOV, escritas: function () { if (typeof window.showWelcomeModal === 'function') window.showWelcomeModal(); } };
  var CENAS = CENAS_MOV, DEF = DEF_MOV;
  function total() { return CENAS.reduce(function (s, c) { return s + c.dur; }, 0); }
  var TOTAL = total();

  // ── Voz ──
  var voz = null, comVoz = true;
  function escolherVoz() {
    if (!('speechSynthesis' in window)) return;
    var v = speechSynthesis.getVoices() || [];
    voz = v.filter(function (x) { return /^pt(-|_)PT/i.test(x.lang); })[0] || v.filter(function (x) { return /^pt/i.test(x.lang); })[0] || null;
  }
  if ('speechSynthesis' in window) { escolherVoz(); try { speechSynthesis.addEventListener('voiceschanged', escolherVoz); } catch (e) {} }

  // ── Leitor ──
  var ov = null, cena = 0, fala = 0, t0 = 0, decorrido = 0, tocar = false, raf = 0, falaAtiva = false, falaFim = 0;
  function css() {
    if (document.getElementById('vm-css')) return;
    var s = document.createElement('style'); s.id = 'vm-css';
    s.textContent = [
      '.vm-ov{position:fixed;inset:0;z-index:2147483000;background:rgba(6,13,26,.86);display:flex;align-items:center;justify-content:center;padding:16px;font-family:Inter,"Segoe UI",Arial,sans-serif}',
      '.vm-box{width:min(960px,100%);background:#0B1524;border-radius:18px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.5);color:#fff}',
      '.vm-top{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.1)}',
      '.vm-top b{font-size:.98rem}.vm-top small{color:#94A3B8;font-size:.8rem}.vm-top .x{margin-left:auto;width:34px;height:34px;border-radius:10px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff;font-size:1.1rem;cursor:pointer}',
      '.vm-palco{position:relative;background:#000;aspect-ratio:520/292}.vm-palco svg{width:100%;height:100%;display:block}',
      '.vm-leg{min-height:3.4em;display:flex;align-items:center;justify-content:center;background:#060D1A;color:#fff;padding:8px 18px;font-size:clamp(.84rem,1.9vw,1.05rem);line-height:1.4;text-align:center;border-top:1px solid rgba(255,255,255,.08)}',
      '.vm-inicio{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(6,13,26,.45);cursor:pointer}.vm-inicio span{width:78px;height:78px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 30px rgba(0,0,0,.4)}',
      '.vm-ctl{display:flex;align-items:center;gap:8px;padding:10px 14px;flex-wrap:wrap}',
      '.vm-ctl button{border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.08);color:#fff;border-radius:10px;height:36px;min-width:36px;padding:0 10px;font:700 .82rem Inter,Arial,sans-serif;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px}',
      '.vm-ctl button.p{background:#fff;color:#0F172A;border-color:#fff}',
      '.vm-barra{flex:1 1 200px;height:8px;background:rgba(255,255,255,.14);border-radius:6px;position:relative;cursor:pointer;display:flex;gap:2px;overflow:hidden}',
      '.vm-barra i{display:block;height:100%;background:rgba(255,255,255,.18)}.vm-barra i b{display:block;height:100%;width:0}',
      '.vm-tempo{font:700 .78rem ui-monospace,Consolas,monospace;color:#CBD5E1;min-width:92px;text-align:right}',
      '.vm-cenas{display:flex;gap:6px;flex-wrap:wrap;padding:0 14px 12px}.vm-cenas button{border:1px solid rgba(255,255,255,.14);background:transparent;color:#CBD5E1;border-radius:999px;padding:4px 10px;font:600 .72rem Inter,Arial,sans-serif;cursor:pointer}.vm-cenas button.on{background:#fff;color:#0F172A}',
      '.vm-escrito{color:#93C5FD;font-size:.78rem;margin-left:auto;background:none;border:0;text-decoration:underline;cursor:pointer}',
      '.vm-a{opacity:0;animation:vmEntra .6s ease-out forwards;animation-delay:var(--d)}',
      '@keyframes vmEntra{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}',
      '.vm-ponteiro{transform-origin:0 0;animation:vmPonteiro 2.4s ease-out 4.2s both}@keyframes vmPonteiro{from{transform:rotate(-120deg)}to{transform:rotate(0)}}',
      '.vm-pisca{animation:vmPisca 1s ease-in-out 8s 4 both}@keyframes vmPisca{50%{opacity:.35}}',
      '.vm-palco.pausa *{animation-play-state:paused !important}',
      '@media(max-width:600px){.vm-ov{padding:0}.vm-box{border-radius:0;height:100%;display:flex;flex-direction:column;justify-content:center}.vm-tempo{min-width:0}}'
    ].join('\n');
    document.head.appendChild(s);
  }
  function fmt(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
  function inicioCena(i) { var s = 0; for (var k = 0; k < i; k++) s += CENAS[k].dur; return s; }
  function $(sel) { return ov && ov.querySelector(sel); }

  function mostrarCena(i) {
    cena = Math.max(0, Math.min(CENAS.length - 1, i)); fala = 0; decorrido = 0; t0 = performance.now(); falaFim = 0;
    var c = CENAS[cena];
    $('.vm-palco').innerHTML = c.svg(); $('.vm-leg').textContent = '';
    $('.vm-top small').textContent = 'Cena ' + (cena + 1) + ' de ' + CENAS.length + ' · ' + c.titulo;
    Array.prototype.forEach.call(ov.querySelectorAll('.vm-cenas button'), function (b, k) { b.classList.toggle('on', k === cena); });
    pararVoz();
    if (!tocar) $('.vm-palco').classList.add('pausa'); else { $('.vm-palco').classList.remove('pausa'); falar(); }
    atualizarBarra();
  }
  function pararVoz() { falaAtiva = false; try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (e) {} }
  // Diz as falas da cena uma a uma; sem voz, a legenda muda ao ritmo da leitura.
  function falar() {
    var c = CENAS[cena]; if (fala >= c.falas.length) { $('.vm-leg').textContent = ''; return; }
    var txt = c.falas[fala], leg = $('.vm-leg'); if (leg) leg.textContent = txt;
    var seguinte = function () { if (!tocar || !falaAtiva) return; falaAtiva = false; fala++; setTimeout(function () { if (tocar) falar(); }, 250); };
    falaAtiva = true;
    if (comVoz && 'speechSynthesis' in window && window.SpeechSynthesisUtterance) {
      var u = new SpeechSynthesisUtterance(txt); u.lang = voz ? voz.lang : 'pt-PT'; if (voz) u.voice = voz; u.rate = 1; u.pitch = 1;
      u.onend = seguinte; u.onerror = function () { falaFim = performance.now() + txt.length * 60; };
      try { speechSynthesis.speak(u); } catch (e) { falaFim = performance.now() + txt.length * 60; }
    } else falaFim = performance.now() + txt.length * 62; // leitura ≈ 16 carateres/s
  }
  function ciclo(agora) {
    if (!ov) return;
    if (tocar) {
      decorrido = (agora - t0) / 1000;
      // sem voz (ou erro): avança a legenda pelo tempo de leitura
      if (falaAtiva && falaFim && agora >= falaFim) { falaFim = 0; falaAtiva = false; fala++; falar(); }
      var c = CENAS[cena], acabouFala = fala >= c.falas.length;
      if (decorrido >= c.dur && acabouFala || decorrido >= c.dur + 12) {
        if (cena < CENAS.length - 1) mostrarCena(cena + 1);
        else { tocar = false; pararVoz(); botaoPlay(); $('.vm-palco').insertAdjacentHTML('beforeend', '<div class="vm-inicio" data-vm="rever"><span><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#0F172A" stroke-width="2.4" stroke-linecap="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg></span></div>'); }
      }
      atualizarBarra();
    }
    raf = requestAnimationFrame(ciclo);
  }
  function atualizarBarra() {
    var d = Math.min(decorrido, CENAS[cena].dur);
    Array.prototype.forEach.call(ov.querySelectorAll('.vm-barra i b'), function (b, k) { b.style.width = (k < cena ? 100 : k > cena ? 0 : d / CENAS[cena].dur * 100) + '%'; });
    $('.vm-tempo').textContent = fmt(inicioCena(cena) + d) + ' / ' + fmt(TOTAL);
  }
  function botaoPlay() {
    var b = $('[data-vm="play"]'); if (!b) return;
    b.innerHTML = tocar ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>Pausa' : '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4l13 8-13 8z"/></svg>Reproduzir';
  }
  function play() {
    var ini = $('.vm-inicio'); if (ini) { if (ini.dataset.vm === 'rever') { ini.remove(); tocar = true; botaoPlay(); mostrarCena(0); return; } ini.remove(); }
    tocar = true; t0 = performance.now() - decorrido * 1000; $('.vm-palco').classList.remove('pausa'); botaoPlay();
    if (fala < CENAS[cena].falas.length) { pararVoz(); falar(); }
  }
  function pausa() { tocar = false; pararVoz(); $('.vm-palco').classList.add('pausa'); botaoPlay(); }
  function fechar() { tocar = false; pararVoz(); cancelAnimationFrame(raf); if (ov) ov.remove(); ov = null; document.removeEventListener('keydown', teclas, true); }
  function teclas(e) {
    if (!ov) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); fechar(); }
    else if (e.key === ' ') { e.preventDefault(); tocar ? pausa() : play(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); mostrarCena(cena + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); mostrarCena(cena - 1); }
  }
  function abrir(def) {
    if (ov) return; css();
    DEF = (def && def.cenas) ? def : (window.ZELO_VIDEO_DEF || DEF_MOV); CENAS = DEF.cenas; TOTAL = total();
    ov = document.createElement('div'); ov.className = 'vm-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'Vídeo de instruções: ' + DEF.titulo);
    ov.innerHTML = '<div class="vm-box"><div class="vm-top"><div><b>' + DEF.titulo + '</b><br><small></small></div><button type="button" class="x" data-vm="fechar" aria-label="Fechar">×</button></div>' +
      '<div class="vm-palco pausa"></div><div class="vm-leg" aria-live="polite"></div>' +
      '<div class="vm-ctl"><button type="button" class="p" data-vm="play"></button><button type="button" data-vm="ant" title="Cena anterior" aria-label="Cena anterior">‹</button><button type="button" data-vm="seg" title="Cena seguinte" aria-label="Cena seguinte">›</button>' +
      '<div class="vm-barra" title="Ir para uma cena">' + CENAS.map(function (c) { return '<i style="flex:' + c.dur + '"><b style="background:' + c.cor + '"></b></i>'; }).join('') + '</div><span class="vm-tempo"></span>' +
      '<button type="button" data-vm="voz" title="Ligar/desligar a voz">Voz: ligada</button><button type="button" data-vm="ecra" title="Ecrã inteiro" aria-label="Ecrã inteiro">⤢</button></div>' +
      '<div class="vm-cenas">' + CENAS.map(function (c, i) { return '<button type="button" data-vm-cena="' + i + '">' + (i + 1) + '. ' + c.titulo + '</button>'; }).join('') +
      (typeof DEF.escritas === 'function' ? '<button type="button" class="vm-escrito" data-vm="escrito">Ver instruções escritas</button>' : '') + '</div></div>';
    document.body.appendChild(ov);
    tocar = false; botaoPlay(); mostrarCena(0);
    $('.vm-palco').insertAdjacentHTML('beforeend', '<div class="vm-inicio" data-vm="iniciar"><span><svg width="34" height="34" viewBox="0 0 24 24" fill="#0F172A"><path d="M8 5l12 7-12 7z"/></svg></span></div>');
    ov.addEventListener('click', function (e) {
      if (e.target === ov) { fechar(); return; }
      var b = e.target.closest('[data-vm],[data-vm-cena]'); if (!b) { var br = e.target.closest('.vm-barra'); if (br) irPara(e, br); return; }
      var k = b.dataset.vm;
      if (b.dataset.vmCena != null) { mostrarCena(+b.dataset.vmCena); return; }
      if (k === 'fechar') fechar();
      else if (k === 'play' || k === 'iniciar' || k === 'rever') { tocar && k === 'play' ? pausa() : play(); }
      else if (k === 'ant') mostrarCena(cena - 1);
      else if (k === 'seg') mostrarCena(cena + 1);
      else if (k === 'voz') { comVoz = !comVoz; b.textContent = 'Voz: ' + (comVoz ? 'ligada' : 'desligada'); if (tocar) { pararVoz(); falar(); } }
      else if (k === 'ecra') { var bx = $('.vm-box'); try { if (document.fullscreenElement) document.exitFullscreen(); else bx.requestFullscreen(); } catch (er) {} }
      else if (k === 'escrito') { fechar(); try { DEF.escritas(); } catch (er) {} }
    });
    document.addEventListener('keydown', teclas, true);
    raf = requestAnimationFrame(ciclo);
  }
  function irPara(e, br) {
    var r = br.getBoundingClientRect(), s = (e.clientX - r.left) / r.width * TOTAL, i = 0;
    while (i < CENAS.length - 1 && s >= inicioCena(i + 1)) i++;
    mostrarCena(i);
  }

  // ── Botão "▶ Instruções" no cabeçalho ──
  var ICONE = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M10 8l6 4-6 4z" fill="currentColor"/></svg>';
  function botao() {
    var b = document.getElementById('helpBtn');
    if (b && !b.dataset.vm) {
      b.dataset.vm = '1'; b.removeAttribute('onclick'); b.onclick = null;
      b.innerHTML = ICONE + '<span class="vm-lbl">Instruções</span>';
      b.title = 'Vídeo de instruções'; b.setAttribute('aria-label', 'Instruções (vídeo)');
      b.style.width = 'auto'; b.style.padding = '0 12px'; b.style.gap = '6px'; b.style.borderRadius = '999px'; b.style.display = 'inline-flex'; b.style.alignItems = 'center'; b.style.flexDirection = 'row'; b.style.justifyContent = 'center'; b.style.whiteSpace = 'nowrap'; b.style.height = b.offsetHeight > 30 ? b.offsetHeight + 'px' : '40px'; b.style.font = '700 .8rem Inter,Arial,sans-serif';
      b.addEventListener('click', function (e) { e.preventDefault(); e.stopImmediatePropagation(); abrir(); }, true);
      return true;
    }
    var mhg = document.querySelector('header.mhg-top .acoes');
    if (mhg && !document.getElementById('vmBtnMhg')) {
      var n = document.createElement('button'); n.type = 'button'; n.id = 'vmBtnMhg'; n.innerHTML = ICONE + 'Instruções'; n.title = 'Vídeo: como se calcula o Movimento Hospitalar';
      n.addEventListener('click', function () { abrir(); }); mhg.insertBefore(n, mhg.firstChild); return true;
    }
    return !!(b && b.dataset.vm) || !!document.getElementById('vmBtnMhg');
  }
  var tent = 0, iv = setInterval(function () { tent++; if (botao() || tent > 60) clearInterval(iv); }, 250);

  window.ZeloVideoMov = { abrir: abrir, CENAS: CENAS_MOV, TOTAL: TOTAL, h: { a: a, t: t, svg: svg, camas: camas } };
})();
