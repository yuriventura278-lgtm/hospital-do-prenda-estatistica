// ── ZELO — Fecho do mês do Movimento Hospitalar (entrega à Estatística) ──
// Carregado no Controlo de Pacientes, no Movimento de cada serviço e no
// Movimento Hospitalar Geral.
//
// • Últimos 5 dias do mês: aviso para rever entradas e saídas (lista automática
//   do que parece errado + lembrete do livro de registo físico).
// • Prazos mostrados aos serviços: rever até dia 2, entregar até dia 3 do mês
//   seguinte. No dia 3 (e depois, se atrasado) o ZELO pede ao chefe: fechar e
//   entregar, baixar o PDF do Movimento mensal, imprimir e levar à Estatística.
//   «Fechar e entregar» (chefe de serviço / enfermeiro(a) chefe / administrador)
//   guarda uma CÓPIA FIXA dos números do mês.
// • Fecho automático real: dia 8 às 23:59 (margem não mostrada aos serviços) —
//   o primeiro computador que abrir o ZELO depois fecha sozinho.
// • Depois do fecho: registar/alterar/anular doentes com datas nesse mês é
//   uma RETIFICAÇÃO — só chefe de serviço, enfermeiro(a) chefe ou
//   administrador, com motivo obrigatório. Fica registada (quem, quando,
//   porquê, doente) e o Movimento recalcula; a cópia entregue nunca muda.
//   A «Nota de retificação» mostra entregue / atual / diferença.
// Firebase (nunca se apaga nada):
//   registos_sistemas_locais/fecho_mes/<movimento>/<AAAA-MM>           (só se cria)
//   registos_sistemas_locais/fecho_mes_retificacoes/<movimento>/<AAAA-MM>/<id> (só se cria)
(function () {
  if (window.__zeloFechoMes) return;
  window.__zeloFechoMes = true;

  // Prazos: o que os chefes veem (rever até dia 2, entregar até dia 3) e o fecho
  // automático real (dia 8 — margem que não é mostrada aos serviços).
  var REVER_DIA = 2, ENTREGA_DIA = 3, PRAZO_DIA = 8, AVISO_DIAS = 5;
  var BASE = 'registos_sistemas_locais/';
  var PODE = { admin: 1, chefe_servico: 1, enfermeiro_chefe: 1 };
  var FUNCOES = { admin: 'Administrador', chefe_servico: 'Chefe de Serviço', enfermeiro_chefe: 'Enfermeiro(a) Chefe', enfermeiro: 'Enfermeiro(a)', secretario: 'Secretário(a)', medico: 'Médico(a)' };
  var NOMES = { cirurgia_geral: 'Cirurgia Geral', maxilo_facial: 'Maxilo-Facial', medicina_interna: 'Medicina Interna', nefrologia: 'Nefrologia', neurocirurgia: 'Neurocirurgia', ortopedia: 'Ortopedia', uci: 'UCI e Cuidados Intermédios' };
  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  var CAMPOS = ['diretos', 'transferidos_adm', 'altas', 'menos_48', 'mais_48', 'transferidos_sai', 'dia_cama', 'dia_doente'];

  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function hojeISO() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function agoraLocal() { var d = new Date(); return hojeISO() + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()); }
  function mesDe(iso) { return String(iso || '').slice(0, 7); }
  function mesSeguinte(m) { var y = +m.slice(0, 4), mm = +m.slice(5, 7) + 1; if (mm > 12) { mm = 1; y++; } return y + '-' + pad(mm); }
  function mesAnterior(m) { var y = +m.slice(0, 4), mm = +m.slice(5, 7) - 1; if (!mm) { mm = 12; y--; } return y + '-' + pad(mm); }
  function nomeMes(m) { return MESES[+m.slice(5, 7) - 1] + ' de ' + m.slice(0, 4); }
  function nomeMesCurto(m) { return MESES[+m.slice(5, 7) - 1]; }
  function prazo(m) { return mesSeguinte(m) + '-' + pad(PRAZO_DIA) + 'T23:59:59'; }            // fecho automático (real)
  function prazoEntrega(m) { return mesSeguinte(m) + '-' + pad(ENTREGA_DIA) + 'T23:59:59'; }   // prazo mostrado
  function prazoRever(m) { return mesSeguinte(m) + '-' + pad(REVER_DIA); }
  function fmtDia(iso) { var s = String(iso || ''); return s.slice(8, 10) + '/' + s.slice(5, 7); }
  function fmtData(iso) { var s = String(iso || ''); return s.length >= 10 ? s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4) + (s.length >= 16 ? ' às ' + s.slice(11, 16) : '') : '—'; }
  function diasNoMes(m) { return new Date(+m.slice(0, 4), +m.slice(5, 7), 0).getDate(); }
  function quem() {
    var nome = '', role = '';
    try { nome = sessionStorage.getItem('zeloNome') || sessionStorage.getItem('zeloEmail') || ''; role = sessionStorage.getItem('zeloRole') || ''; } catch (e) {}
    return { nome: nome || 'Utilizador', role: role, funcao: FUNCOES[role] || role, pode: !!PODE[role] };
  }
  // Ler basta __fbGet; gravar (fechar) precisa também de __fbSet (o Movimento Geral só lê).
  function pronto() { return window.__fbReady && typeof window.__fbGet === 'function'; }
  function podeGravar() { return pronto() && typeof window.__fbSet === 'function'; }

  // ── Que página é esta e a que Movimento pertence ──
  function pagina() {
    var p = location.pathname.split('/').pop();
    if (/^controlo_pacientes_/.test(p)) return 'cp';
    if (/_movimento\.html$/.test(p)) return 'mov';
    if (/movimento_hospitalar_geral\.html$/.test(p)) return 'mhg';
    return '';
  }
  function itemCP() {
    var s = ''; try { s = window.CP_UCI ? window.CP_UCI.slug : String(FB_PACIENTES_PATH).split('/').pop(); } catch (e) {}
    return /^uci_/.test(s) ? 'uci' : s;
  }
  function itemMov() { try { return String(FB_MOVIMENTO_PATH).split('/').pop(); } catch (e) { return ''; } }
  function item() { var t = pagina(); return t === 'cp' ? itemCP() : t === 'mov' ? itemMov() : ''; }

  // ── Estado do fecho (cache curta) ──
  var cache = {};
  function lerFecho(it, m, forcar) {
    var k = it + '/' + m;
    if (!forcar && cache[k] && Date.now() - cache[k].ts < 5 * 60000) return Promise.resolve(cache[k].v);
    if (!pronto()) return Promise.resolve(cache[k] ? cache[k].v : null);
    return window.__fbGet(BASE + 'fecho_mes/' + k).then(function (v) { cache[k] = { ts: Date.now(), v: v || null }; return v || null; }, function () { return cache[k] ? cache[k].v : null; });
  }
  // Fechado = há cópia entregue, ou o prazo já passou (mesmo que ainda ninguém tenha aberto o ZELO para fechar).
  function fechadoSync(it, m) { var c = cache[it + '/' + m]; return !!(c && c.v) || agoraLocal() > prazo(m); }
  window.zeloMesFechado = function (m, it) { return fechadoSync(it || item(), m); };

  // ── Totais e indicadores de um mês de Movimento ──
  function arr(v, n) { var a = []; for (var i = 0; i < n; i++) { var x = v ? v[i] : null; a.push(x === undefined || x === '' || x === null ? null : Number(x)); } return a; }
  // Mesmas fórmulas de zelo_mov_auto.js (aqui também para o Controlo de Pacientes).
  function indicadores(t) {
    if (window.ZeloMovAuto && window.ZeloMovAuto.indicadores) return window.ZeloMovAuto.indicadores(t);
    var dc = Number(t.dc) || 0, dd = Number(t.dd) || 0, sai = Number(t.saidos) || 0, ob = Number(t.obitos) || 0, ob48 = Number(t.ob48) || 0, dias = Number(t.dias) || 0;
    var cr = dias > 0 && dc > 0 ? dc / dias : null;
    return { camasReais: cr, taxa: dc > 0 ? dd / dc * 100 : null, estadia: sai > 0 ? dd / sai : null, rotacao: sai > 0 && cr ? sai / cr : null,
      intervalo: sai > 0 && dc > 0 ? Math.max(0, dc - dd) / sai : null, mortLiquida: sai - ob48 > 0 ? Math.max(0, ob - ob48) / (sai - ob48) * 100 : null, mortBruta: sai > 0 ? ob / sai * 100 : null };
  }
  function totais(mesDados, m) {
    var n = diasNoMes(m), c = {}, t = {};
    CAMPOS.forEach(function (k) { c[k] = arr(mesDados && mesDados[k], n); t[k] = c[k].reduce(function (s, x) { return s + (x || 0); }, 0); });
    var dias = c.dia_cama.filter(function (x) { return x !== null; }).length;
    t.admitidos = t.diretos + t.transferidos_adm;
    t.saidos = t.altas + t.menos_48 + t.mais_48 + t.transferidos_sai;
    t.obitos = t.menos_48 + t.mais_48;
    var ind = indicadores({ dc: t.dia_cama, dd: t.dia_doente, dias: dias, saidos: t.saidos, obitos: t.obitos, ob48: t.menos_48 });
    var r = {}; Object.keys(ind).forEach(function (k) { r[k] = ind[k] == null || !isFinite(ind[k]) ? null : Math.round(ind[k] * 10) / 10; });
    return { campos: c, totais: t, indicadores: r };
  }
  var LINHAS = [['admitidos', 'Admitidos'], ['diretos', '  diretos'], ['transferidos_adm', '  transferidos (entrada)'], ['saidos', 'Saídos'], ['altas', '  altas'], ['obitos', '  óbitos'], ['transferidos_sai', '  transferidos (saída)'], ['dia_cama', 'Dias-cama'], ['dia_doente', 'Dias-doente']];
  var LINHAS_IND = [['taxa', 'Taxa de ocupação (%)'], ['estadia', 'Média de estadia (dias)'], ['mortBruta', 'Mortalidade bruta (%)']];

  // ── Fechar (entregar ou automático): cópia fixa dos números do Movimento ──
  // As fórmulas do Movimento (zelo_mov_auto.js) — carregadas se a página não as tiver.
  function movAuto() {
    if (window.ZeloMovAuto) return Promise.resolve(window.ZeloMovAuto);
    return new Promise(function (res) {
      var sc = document.createElement('script'); sc.src = 'zelo_mov_auto.js?v=16';
      sc.onload = function () { res(window.ZeloMovAuto || null); }; sc.onerror = function () { res(null); };
      document.head.appendChild(sc);
    });
  }
  // Números do mês a partir dos doentes do Controlo de Pacientes, contando SÓ o
  // que estava registado até 'ate' (ex.: o prazo): doentes registados depois não
  // entram, e saídas registadas depois contam como ainda internados.
  // Assim, o fecho automático tem sempre os números do prazo — seja quem for
  // que abra o ZELO, e mesmo que só abra dias depois.
  // Movimento escrito à mão (preenchimento automático desligado) ou sem doentes
  // no Controlo de Pacientes nesse mês: usa os números do Movimento.
  function numerosDoMes(it, m, ate) {
    var base = 'registos_movimento/' + it + '/snapshot/';
    var get = function (c) { return window.__fbGet(c).catch(function () { return null; }); };
    return Promise.all([movAuto(), get(base + m), get(base + '__autoDesligado'), get(base + '__capacity'), get(base + '__camasForaUso/' + m)]).then(function (r) {
      var A = r[0], md = r[1], manual = !!r[2], cap = Number(r[3]) || 0, fu = r[4] || {};
      var doMovimento = function (motivo) { return { campos: totais(md, m).campos, fonte: 'movimento', motivo: motivo }; };
      if (!A || manual) return doMovimento(manual ? 'Movimento preenchido à mão' : 'fórmulas indisponíveis');
      return Promise.all([A.lerPacientes(it), A.lerExternos(it)]).then(function (x) {
        var ps = (x[0] || []).filter(function (p) { return !(p.registadoEm && String(p.registadoEm) > ate) && !p.anulado; }).map(function (p) {
          if (p.status !== 'internado' && p.saidaRegistadaEm && String(p.saidaRegistadaEm) > ate) return Object.assign({}, p, { status: 'internado', dataSaida: null, tipoSaida: null, subtipo: null });
          return p;
        });
        if (!A.ativoNoMes(ps, m)) return doMovimento('sem doentes no Controlo de Pacientes');
        if (!cap && md && md.dia_cama) cap = Math.max.apply(null, arr(md.dia_cama, diasNoMes(m)).map(function (v) { return v || 0; }));
        var ex = A.calcular(ps, m, cap, x[1] || [], { foraUso: fu }).existencia;
        var rr = A.calcular(ps, m, cap, x[1] || [], { foraUso: fu, existencia: ex });
        var campos = {}; CAMPOS.forEach(function (k) { campos[k] = rr.campos[k]; });
        return { campos: campos, existencia: ex, fonte: 'controlo_pacientes', ate: ate };
      });
    });
  }
  function fechar(it, m, tipo, extra) {
    if (!podeGravar()) return Promise.reject(new Error('sem ligação'));
    return lerFecho(it, m, true).then(function (ja) {
      if (ja) return ja;
      // Automático: conta o registado até ao fecho automático (dia 8 às 23:59).
      // Entregue pelo chefe: conta o registado até agora.
      var ate = tipo === 'automatico' ? prazo(m) : agoraLocal();
      return numerosDoMes(it, m, ate).then(function (nm) {
        var q = quem(), t = totais(nm.campos, m);
        var rec = { mes: m, movimento: it, estado: tipo, em: agoraLocal(), prazo: prazoEntrega(m), fechoAutomatico: prazo(m), campos: t.campos, totais: t.totais, indicadores: t.indicadores,
          numerosAte: ate, fonte: nm.fonte };
        if (nm.existencia != null) rec.existencia = nm.existencia;
        if (nm.motivo) rec.fonteMotivo = nm.motivo;
        if (tipo === 'entregue') { rec.por = q.nome; rec.funcao = q.funcao; }
        else rec.nota = 'Fechado automaticamente: não foi entregue no prazo (' + fmtData(prazoEntrega(m)) + '). Números com o que estava registado até ao fecho automático.';
        if (extra && extra.existencia != null && rec.existencia == null) rec.existencia = extra.existencia;
        return window.__fbSet(BASE + 'fecho_mes/' + it + '/' + m, rec).then(function () {
          cache[it + '/' + m] = { ts: Date.now(), v: rec }; return rec;
        }, function () { return lerFecho(it, m, true); }); // outro computador fechou primeiro: fica a dele
      });
    });
  }
  window.zeloFecharMes = fechar;

  // Fecho automático: meses cujo prazo passou e ainda não foram fechados.
  function fechosAutomaticos(its) {
    if (!podeGravar()) return Promise.resolve();
    var h = mesDe(hojeISO()), ms = [mesAnterior(h), mesAnterior(mesAnterior(h))];
    return Promise.all(its.map(function (it) {
      return Promise.all(ms.map(function (m) {
        if (agoraLocal() <= prazo(m)) return null;
        return lerFecho(it, m).then(function (f) {
          if (f) return f;
          return window.__fbGet('registos_movimento/' + it + '/snapshot/' + m + '/dia_cama').then(function (dc) { return dc ? fechar(it, m, 'automatico') : null; }, function () { return null; });
        });
      }));
    }));
  }

  // ── Retificações ──
  function lerRetificacoes(it, m) {
    if (!pronto()) return Promise.resolve([]);
    return window.__fbGet(BASE + 'fecho_mes_retificacoes/' + it + '/' + m).then(function (v) {
      return Object.keys(v || {}).map(function (k) { return v[k]; }).filter(Boolean).sort(function (a, b) { return String(a.em).localeCompare(String(b.em)); });
    }, function () { return []; });
  }

  // ── Estilos ──
  var css = document.createElement('style');
  css.textContent = [
    '.zfm{margin:0 0 14px;border-radius:14px;padding:12px 16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;font:600 .9rem Inter,"Segoe UI",Arial,sans-serif;border:1px solid}',
    '.zfm b{font-weight:800}.zfm .t{flex:1;min-width:240px;line-height:1.45}.zfm small{display:block;font-weight:600;opacity:.85;margin-top:2px}',
    '.zfm.av{background:#FFFBEB;border-color:#FDE68A;color:#78350F}.zfm.rev{background:#EFF6FF;border-color:#BFDBFE;color:#1E3A8A}',
    '.zfm.ok{background:#ECFDF5;border-color:#A7F3D0;color:#065F46}.zfm.auto{background:#FEF2F2;border-color:#FECACA;color:#7F1D1D}.zfm.ret{background:#F5F3FF;border-color:#DDD6FE;color:#4C1D95}',
    '.zfm-bt{border:1px solid currentColor;background:#fff;color:inherit;border-radius:10px;padding:7px 13px;font:800 .82rem Inter,Arial,sans-serif;cursor:pointer;white-space:nowrap}',
    '.zfm-bt.p{background:#1E3A5F;border-color:#1E3A5F;color:#fff}',
    '.zfm-ov{position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:2147483645;display:flex;align-items:flex-start;justify-content:center;padding:24px 14px;overflow:auto}',
    '.zfm-card{background:#fff;border-radius:18px;width:min(860px,100%);box-shadow:0 24px 60px rgba(15,23,42,.35);overflow:hidden;font-family:Inter,"Segoe UI",Arial,sans-serif;color:#0F172A}',
    '.zfm-top{background:linear-gradient(90deg,#1E3A5F,#2B5A8A);color:#fff;padding:16px 20px;display:flex;gap:12px;align-items:center}.zfm-top h3{margin:0;font-size:1.1rem}.zfm-top small{display:block;opacity:.85}',
    '.zfm-top .x{margin-left:auto;width:36px;height:36px;border-radius:10px;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.1);color:#fff;font-size:1.2rem;cursor:pointer}',
    '.zfm-body{padding:16px 20px;max-height:calc(100vh - 200px);overflow:auto;font-size:.9rem}',
    '.zfm-body h4{margin:14px 0 8px;font:800 .74rem Inter,Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#1E3A5F}',
    '.zfm-it{border:1px solid #E3E8F0;border-left:4px solid #F59E0B;border-radius:10px;padding:8px 12px;margin:6px 0;display:flex;gap:10px;align-items:center;flex-wrap:wrap}.zfm-it .d{flex:1;min-width:220px}',
    '.zfm-it.okk{border-left-color:#10B981}',
    '.zfm-tab{width:100%;border-collapse:collapse;font-size:.88rem}.zfm-tab th,.zfm-tab td{padding:7px 10px;border-bottom:1px solid #EEF2F7;text-align:right}.zfm-tab th:first-child,.zfm-tab td:first-child{text-align:left;white-space:pre}',
    '.zfm-tab th{background:#F8FAFC;font:800 .7rem Inter,Arial,sans-serif;text-transform:uppercase;letter-spacing:.06em;color:#64748B}.zfm-tab .dif{font-weight:800;color:#6D28D9}',
    '.zfm-acoes{display:flex;gap:10px;justify-content:flex-end;padding:12px 20px;border-top:1px solid #E3E8F0;flex-wrap:wrap}',
    '.zfm-body textarea{width:100%;box-sizing:border-box;border:1.5px solid #D6E0EC;border-radius:10px;padding:9px 11px;font:500 .92rem Inter,Arial,sans-serif;min-height:90px}',
    '.zfm-err{color:#B91C1C;font-weight:700;margin-top:8px}',
    '.zfm-q{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}.zfm-q div{border:1px solid #E3E8F0;border-radius:12px;padding:10px 12px}.zfm-q b{display:block;margin-bottom:3px}'
  ].join('\n');
  document.head.appendChild(css);

  function janela(titulo, sub, corpo, acoes) {
    var ov = document.createElement('div'); ov.className = 'zfm-ov';
    ov.innerHTML = '<div class="zfm-card" role="dialog"><div class="zfm-top"><div><h3>' + titulo + '</h3>' + (sub ? '<small>' + sub + '</small>' : '') + '</div><button type="button" class="x" data-zfm-fechar>×</button></div><div class="zfm-body">' + corpo + '</div>' + (acoes ? '<div class="zfm-acoes">' + acoes + '</div>' : '') + '</div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) { if (e.target === ov || e.target.closest('[data-zfm-fechar]')) ov.remove(); });
    return ov;
  }

  // ── Revisão (lista automática do que parece errado) — no Controlo de Pacientes ──
  function pacientes() { try { return (typeof data !== 'undefined' && data && Array.isArray(data.patients)) ? data.patients.filter(function (p) { return p && !p._arquivo && !p.anulado; }) : []; } catch (e) { return []; } }
  function dia(iso) { return String(iso || '').slice(0, 10); }
  function problemas(m, cap) {
    var ps = pacientes(), l = [], hoje = hojeISO(), ini = m + '-01', fim = m + '-' + pad(diasNoMes(m));
    var h30 = new Date(); h30.setDate(h30.getDate() - 30); var lim30 = h30.getFullYear() + '-' + pad(h30.getMonth() + 1) + '-' + pad(h30.getDate());
    ps.forEach(function (p) {
      if (p.status === 'internado' && dia(p.dataEntrada) && dia(p.dataEntrada) <= lim30) l.push({ p: p, txt: 'Internado há mais de 30 dias (desde ' + fmtData(p.dataEntrada) + '). Confirme se ainda está no serviço ou se falta registar a saída.' });
      if (p.status !== 'internado' && p.dataSaida) {
        var s = String(p.dataSaida);
        if (dia(s) >= ini && dia(s) <= fim && (s.length < 16 || s.slice(11, 16) === '00:00')) l.push({ p: p, txt: 'Saída a ' + fmtData(s.slice(0, 10)) + ' sem hora registada.' });
        if (dia(s) > hoje) l.push({ p: p, txt: 'Saída com data futura (' + fmtData(s) + ').' });
      }
      if (dia(p.dataEntrada) > hoje) l.push({ p: p, txt: 'Entrada com data futura (' + fmtData(p.dataEntrada) + ').' });
      if (p.status === 'internado' && /"estado":"pendente"/.test(String(p.foraServico || ''))) l.push({ p: p, txt: 'Internado noutro serviço com pedido de autorização ainda sem resposta.' });
    });
    // Dias do mês: mais doentes do que camas / sem entradas nem saídas
    var ate = fim < hoje ? diasNoMes(m) : +hoje.slice(8, 10), mais = [], vazios = [];
    if (m <= mesDe(hoje)) for (var d = 1; d <= ate; d++) {
      var dd = m + '-' + pad(d), n = 0, mov = 0;
      ps.forEach(function (p) {
        var e = dia(p.dataEntrada), s = p.status !== 'internado' && p.dataSaida ? dia(p.dataSaida) : null;
        if (e <= dd && (!s || s > dd)) n++;
        if (e === dd || s === dd) mov++;
      });
      if (cap && n > cap) mais.push(d + ' (' + n + ' doentes, ' + cap + ' camas)');
      if (!mov) vazios.push(d);
    }
    return { doentes: l, mais: mais, vazios: vazios };
  }
  function abrirRevisao(m) {
    var it = item();
    var ler = pronto() ? window.__fbGet('registos_movimento/' + it + '/snapshot/__capacity').catch(function () { return null; }) : Promise.resolve(null);
    ler.then(function (cap) {
      cap = Number(cap) || 0;
      var r = problemas(m, cap), h = '';
      h += '<p>Antes de entregar o Movimento de <b>' + nomeMes(m) + '</b> à Estatística, confirme que as entradas e saídas estão certas. O sistema encontrou:</p>';
      h += '<h4>Doentes a confirmar (' + r.doentes.length + ')</h4>';
      h += r.doentes.length ? r.doentes.map(function (x) { return '<div class="zfm-it"><div class="d"><b>' + esc(x.p.nome) + '</b> · NUP ' + esc(x.p.nup || '—') + '<br>' + esc(x.txt) + '</div><button type="button" class="zfm-bt" data-zfm-abrir="' + x.p.n + '">Abrir</button></div>'; }).join('') : '<div class="zfm-it okk"><div class="d">Nada a assinalar.</div></div>';
      h += '<h4>Mais doentes do que camas</h4>' + (cap ? (r.mais.length ? '<div class="zfm-it"><div class="d">Dias: ' + esc(r.mais.join(', ')) + '. Verifique se falta registar saídas ou se há camas extra.</div></div>' : '<div class="zfm-it okk"><div class="d">Nenhum dia com mais doentes do que camas.</div></div>') : '<div class="zfm-it okk"><div class="d">Número de camas ainda não definido no Movimento.</div></div>');
      h += '<h4>Dias sem nenhuma entrada nem saída</h4>' + (r.vazios.length ? '<div class="zfm-it"><div class="d">Dias ' + esc(r.vazios.join(', ')) + '. Pode estar certo — mas confirme que não ficou nada por registar.</div></div>' : '<div class="zfm-it okk"><div class="d">Todos os dias têm movimento registado.</div></div>');
      h += '<h4>Livro de registo físico</h4><div class="zfm-it"><div class="d"><b>Confirme com o livro de registo que todas as entradas e saídas do mês estão no ZELO.</b> O sistema não consegue ver os doentes que não foram registados.</div></div>';
      var q = quem(), f = cache[it + '/' + m] && cache[it + '/' + m].v;
      var ac = '<button type="button" class="zfm-bt" data-zfm-fechar>Fechar</button>' + (q.pode && !f && agoraLocal() > m + '-' + pad(diasNoMes(m)) + 'T23:59:59' ? '<button type="button" class="zfm-bt p" data-zfm-entregar="' + m + '">Fechar e entregar ' + nomeMesCurto(m) + '</button>' : '');
      var ov = janela('Revisão do mês — ' + nomeMes(m), (NOMES[it] || it) + ' · rever até ' + fmtDia(prazoRever(m)) + ' · entregar até ' + fmtDia(prazoEntrega(m)), h, ac);
      ov.addEventListener('click', function (e) {
        var b = e.target.closest('[data-zfm-abrir]'); if (b) { ov.remove(); try { window.ZeloCpProcesso.abrir(+b.dataset.zfmAbrir); } catch (x) {} }
      });
    });
  }

  function confirmarEntrega(m) {
    var it = item(), q = quem();
    if (!q.pode) { if (typeof showFeedback === 'function') showFeedback('Só o chefe de serviço, o(a) enfermeiro(a) chefe ou o administrador podem fechar e entregar o mês.', 'error'); return; }
    var h = '<p>Vai <b>fechar e entregar o Movimento de ' + nomeMes(m) + '</b> (' + esc(NOMES[it] || it) + ') à Estatística. A seguir, baixe o PDF, imprima e leve à Estatística.</p><p>Fica guardada uma cópia fixa dos números, com o seu nome (' + esc(q.nome) + ') e a hora. Depois disto, qualquer registo com datas de ' + nomeMesCurto(m) + ' passa a ser uma <b>retificação</b> (com motivo) e fica documentado.</p><p>Já reviu as entradas e saídas com o livro de registo?</p>';
    var ov = janela('Fechar e entregar ' + nomeMes(m), NOMES[it] || it, h, '<button type="button" class="zfm-bt" data-zfm-fechar>Ainda não</button><button type="button" class="zfm-bt p" data-zfm-sim>Sim, fechar e entregar</button>');
    ov.querySelector('[data-zfm-sim]').addEventListener('click', function () {
      var extra = {}; try { if (pagina() === 'mov' && typeof getExistencia === 'function') extra.existencia = getExistencia(0, m); } catch (e) {}
      fechar(it, m, 'entregue', extra).then(function (rec) {
        ov.remove();
        if (typeof showFeedback === 'function') showFeedback(rec && rec.estado === 'entregue' ? 'Movimento de ' + nomeMes(m) + ' fechado e entregue no ZELO' : 'O mês já tinha sido fechado', 'success');
        mostrarFaixa(); passos(m, rec);
      }, function () { if (typeof showFeedback === 'function') showFeedback('Sem ligação ao servidor — tente de novo com internet.', 'error'); });
    });
  }

  // ── Nota de retificação ──
  function abrirRetificacoes(it, m) {
    Promise.all([lerFecho(it, m, true), lerRetificacoes(it, m), pronto() ? window.__fbGet('registos_movimento/' + it + '/snapshot/' + m).catch(function () { return null; }) : Promise.resolve(null)]).then(function (r) {
      var f = r[0], rets = r[1], atual = totais(r[2], m);
      if (!f) return;
      var linha = function (rot, a, b) { var d = (b || 0) - (a || 0); return '<tr><td>' + rot + '</td><td>' + (a == null ? '—' : a) + '</td><td>' + (b == null ? '—' : b) + '</td><td class="dif">' + (d ? (d > 0 ? '+' : '') + (Math.round(d * 10) / 10) : '') + '</td></tr>'; };
      var h = '<p>Movimento de <b>' + nomeMes(m) + '</b> — ' + esc(NOMES[it] || it) + '. ' + (f.estado === 'entregue' ? 'Entregue por <b>' + esc(f.por || '—') + '</b>' + (f.funcao ? ' (' + esc(f.funcao) + ')' : '') + ' em ' + fmtData(f.em) + '.' : 'Fechado automaticamente em ' + fmtData(f.em) + ' (prazo ' + fmtData(f.prazo) + ').') + '</p>';
      h += '<h4>Números: entregue · atual · diferença</h4><table class="zfm-tab"><thead><tr><th>Indicador</th><th>Entregue</th><th>Atual</th><th>Diferença</th></tr></thead><tbody>' +
        LINHAS.map(function (l) { return linha(l[1], (f.totais || {})[l[0]], atual.totais[l[0]]); }).join('') +
        LINHAS_IND.map(function (l) { return linha(l[1], (f.indicadores || {})[l[0]], atual.indicadores[l[0]]); }).join('') + '</tbody></table>';
      h += '<h4>Retificações (' + rets.length + ')</h4>' + (rets.length ? rets.map(function (x) {
        return '<div class="zfm-it"><div class="d"><b>' + esc(x.acao || 'Retificação') + '</b> — ' + esc((x.doente && x.doente.nome) || '') + (x.doente && x.doente.nup ? ' · NUP ' + esc(x.doente.nup) : '') +
          (x.doente ? '<br>Entrada ' + fmtData(x.doente.dataEntrada) + (x.doente.dataSaida ? ' · saída ' + fmtData(x.doente.dataSaida) : '') : '') +
          '<br>Por <b>' + esc(x.por || '—') + '</b>' + (x.funcao ? ' (' + esc(x.funcao) + ')' : '') + ' em ' + fmtData(x.em) + '<br>Motivo: ' + esc(x.motivo || '—') + '</div></div>';
      }).join('') : '<div class="zfm-it okk"><div class="d">Sem retificações.</div></div>');
      var ov = janela('Nota de retificação — ' + nomeMes(m), (NOMES[it] || it), h, '<button type="button" class="zfm-bt" data-zfm-fechar>Fechar</button><button type="button" class="zfm-bt p" data-zfm-pdf>Guardar em PDF</button>');
      ov.querySelector('[data-zfm-pdf]').addEventListener('click', function () { pdfRetificacao(it, m, f, atual, rets); });
    });
  }
  function pdfRetificacao(it, m, f, atual, rets) {
    if (!window.ZeloPDF || !window.jspdf) { if (typeof showFeedback === 'function') showFeedback('Não foi possível carregar o gerador de PDF', 'error'); return; }
    var pdf = ZeloPDF.criar(), CW = pdf.CW, y;
    y = pdf.cab('Nota de retificação — Movimento Hospitalar', (NOMES[it] || it) + ' · ' + nomeMes(m));
    y = pdf.txt(y, 'Fecho', f.estado === 'entregue' ? 'Entregue por ' + (f.por || '—') + (f.funcao ? ' (' + f.funcao + ')' : '') + ' em ' + fmtData(f.em) : 'Fechado automaticamente em ' + fmtData(f.em));
    y = pdf.secT(y, '1. Números entregues, atuais e diferença');
    var num = function (v) { return v == null ? '—' : String(v); };
    y = pdf.tabela(y, ['Indicador', 'Entregue', 'Atual', 'Diferença'], [70, 36, 36, CW - 142],
      LINHAS.map(function (l) { var a = (f.totais || {})[l[0]], b = atual.totais[l[0]], d = (b || 0) - (a || 0); return [l[1].trim(), num(a), num(b), d ? (d > 0 ? '+' : '') + d : '']; })
        .concat(LINHAS_IND.map(function (l) { var a = (f.indicadores || {})[l[0]], b = atual.indicadores[l[0]], d = Math.round(((b || 0) - (a || 0)) * 10) / 10; return [l[1], num(a), num(b), d ? (d > 0 ? '+' : '') + d : '']; })));
    y = pdf.secT(y, '2. Retificações (' + rets.length + ')');
    y = rets.length ? pdf.tabela(y, ['Data', 'Doente', 'Ação', 'Por', 'Motivo'], [26, 40, 30, 34, CW - 130], rets.map(function (x) {
      return [fmtData(x.em), ((x.doente && x.doente.nome) || '') + (x.doente && x.doente.nup ? ' (NUP ' + x.doente.nup + ')' : ''), x.acao || '', (x.por || '') + (x.funcao ? ' — ' + x.funcao : ''), x.motivo || ''];
    })) : pdf.txt(y, ' ', 'Sem retificações.');
    pdf.rodape();
    pdf.d.save(('Nota_retificacao_' + it + '_' + m).replace(/[^\w-]+/g, '_') + '.pdf');
  }
  window.zeloAbrirRetificacoes = abrirRetificacoes;

  // ── Faixa de aviso (Controlo de Pacientes e Movimento) ──
  var faixaEl = null;
  function onde() {
    var c = document.querySelector('.container'); if (!c) return null;
    return c;
  }
  function mesAlvo() {
    var h = hojeISO(), m = mesDe(h), d = +h.slice(8, 10), ult = diasNoMes(m);
    if (d > ult - AVISO_DIAS) return { m: m, fase: 'aviso', faltam: ult - d };
    var ant = mesAnterior(m);
    if (d <= REVER_DIA) return { m: ant, fase: 'revisao' };
    if (d === ENTREGA_DIA) return { m: ant, fase: 'entrega' };
    if (d <= PRAZO_DIA) return { m: ant, fase: 'atraso' };
    return { m: ant, fase: 'depois' };
  }
  function mostrarFaixa() {
    var t = pagina(); if (t !== 'cp' && t !== 'mov') return;
    var c = onde(); if (!c) return;
    var it = item(), a = mesAlvo(), q = quem();
    Promise.all([lerFecho(it, a.m), a.fase === 'depois' ? lerRetificacoes(it, a.m) : Promise.resolve([])]).then(function (r) {
      var f = r[0], rets = r[1], h = '', cls = '';
      var Mes = nomeMes(a.m).replace(/^./, function (x) { return x.toUpperCase(); });
      var baixar = '<button type="button" class="zfm-bt" data-zfm-pdf-mov="' + a.m + '">Baixar PDF do Movimento</button>';
      var entregar = q.pode ? '<button type="button" class="zfm-bt p" data-zfm-entregar="' + a.m + '">Fechar e entregar</button>' : '';
      var rever = t === 'cp' ? '<button type="button" class="zfm-bt" data-zfm-rever="' + a.m + '">Rever</button>' : '';
      if (a.fase === 'aviso') {
        cls = 'av';
        h = '<div class="t"><b>O mês de ' + nomeMesCurto(a.m) + ' ' + (a.faltam ? 'termina em ' + (a.faltam + 1) + ' dias' : 'termina hoje') + '.</b> Reveja as entradas e saídas com o livro de registo.' +
          '<small>Rever até ' + fmtDia(prazoRever(a.m)) + ' · entregar o Movimento à Estatística até ' + fmtDia(prazoEntrega(a.m)) + '.</small></div>' + (t === 'cp' ? rever.replace('>Rever<', '>Rever agora<') : '') + baixar;
      } else if (a.fase === 'revisao' && !f) {
        cls = 'rev';
        var ultimoRev = hojeISO() === prazoRever(a.m);
        h = '<div class="t"><b>' + Mes + ': ' + (ultimoRev ? 'hoje é o último dia para rever' : 'período de revisão') + '.</b> Corrija o que faltar até ' + fmtDia(prazoRever(a.m)) + '.' +
          '<small>Entrega à Estatística até ' + fmtDia(prazoEntrega(a.m)) + ': feche, baixe o PDF do Movimento, imprima e leve à Estatística.</small></div>' + rever + entregar + baixar;
      } else if (a.fase === 'entrega' && !f) {
        cls = 'auto';
        h = '<div class="t"><b>Hoje (' + fmtDia(prazoEntrega(a.m)) + ') é o prazo de entrega de ' + nomeMesCurto(a.m) + '.</b> Feche e entregue, baixe o PDF do Movimento mensal, imprima e leve à Estatística.</div>' + rever + entregar + baixar;
      } else if (a.fase === 'atraso' && !f) {
        cls = 'auto';
        h = '<div class="t"><b>O prazo de entrega de ' + nomeMesCurto(a.m) + ' terminou a ' + fmtDia(prazoEntrega(a.m)) + '.</b> Feche e entregue hoje, baixe o PDF do Movimento, imprima e leve à Estatística.</div>' + rever + entregar + baixar;
      } else if (f) {
        cls = rets.length ? 'ret' : (f.estado === 'automatico' ? 'auto' : 'ok');
        if (a.fase !== 'revisao' && !rets.length && Date.now() - new Date(f.em).getTime() > 7 * 86400000) { if (faixaEl) faixaEl.remove(); faixaEl = null; return; }
        h = '<div class="t"><b>' + nomeMes(a.m).replace(/^./, function (x) { return x.toUpperCase(); }) + (f.estado === 'entregue' ? ' entregue' : ' fechado automaticamente') + '</b>' +
          (f.estado === 'entregue' ? ' por ' + esc(f.por || '—') + ' em ' + fmtData(f.em) : ' em ' + fmtData(f.em) + ' (não foi entregue no prazo)') + '.' +
          (rets.length ? '<small>Desde então: ' + rets.length + ' retificação(ões).</small>' : '<small>Leve o Movimento impresso à Estatística, se ainda não levou.</small>') + '</div>' + baixar +
          '<button type="button" class="zfm-bt" data-zfm-ret="' + a.m + '">' + (rets.length ? 'Nota de retificação' : 'Ver números entregues') + '</button>';
      } else { if (faixaEl) faixaEl.remove(); faixaEl = null; return; }
      if (!faixaEl) { faixaEl = document.createElement('div'); c.insertBefore(faixaEl, c.firstChild); }
      faixaEl.className = 'zfm ' + cls; faixaEl.innerHTML = h;
    });
  }
  document.addEventListener('click', function (e) {
    var b;
    if ((b = e.target.closest('[data-zfm-rever]'))) abrirRevisao(b.dataset.zfmRever);
    else if ((b = e.target.closest('[data-zfm-entregar]'))) { var ov = b.closest('.zfm-ov'); if (ov) ov.remove(); confirmarEntrega(b.dataset.zfmEntregar); }
    else if ((b = e.target.closest('[data-zfm-ret]'))) abrirRetificacoes(item(), b.dataset.zfmRet);
    else if ((b = e.target.closest('[data-zfm-pdf-mov]'))) { var o2 = b.closest('.zfm-ov'); if (o2) o2.remove(); baixarMovimento(b.dataset.zfmPdfMov); }
  });

  // Avisos em voz (uma vez por dia neste computador): último dia do mês,
  // último dia de revisão e dia da entrega.
  function avisoVoz() {
    var a = mesAlvo(), h = hojeISO(), txt = '';
    if (a.fase === 'aviso' && !a.faltam) txt = 'Hoje é o último dia de ' + nomeMesCurto(a.m) + '. Reveja as entradas e as saídas do mês com o livro de registo.';
    else if (a.fase === 'revisao' && h === prazoRever(a.m)) txt = 'Hoje é o último dia para rever as entradas e saídas de ' + nomeMesCurto(a.m) + '. Amanhã é o prazo de entrega do Movimento à Estatística.';
    else if (a.fase === 'entrega') txt = 'Hoje é o prazo de entrega de ' + nomeMesCurto(a.m) + '. Feche o mês, baixe o PDF do Movimento, imprima e leve à Estatística.';
    if (!txt) return;
    var k = 'zeloFechoVoz_' + h; try { if (localStorage.getItem(k)) return; localStorage.setItem(k, '1'); } catch (e) { return; }
    var fl = window.zeloFalarEmFila || window.zeloFalar; if (typeof fl === 'function') setTimeout(function () { try { fl(txt); } catch (e) {} }, 6000);
  }

  // ── Baixar o PDF do Movimento mensal ──
  function pdfNoMovimento(m) {
    try { if (typeof currentView !== 'undefined' && currentView !== 'mensal' && typeof switchView === 'function') switchView('mensal'); } catch (e) {}
    try { currentMonth = m; } catch (e) {}
    try { loadMonth(m); updatePeriodDisplay(); renderTable(); updateStats(); } catch (e) {}
    setTimeout(function () {
      try { if (generateReportPDF() === false) return; if (typeof showFeedback === 'function') showFeedback('PDF do Movimento de ' + nomeMes(m) + ' gerado — imprima e leve à Estatística', 'success'); }
      catch (e) { if (typeof showFeedback === 'function') showFeedback('Não foi possível gerar o PDF agora', 'error'); }
    }, 500);
  }
  function baixarMovimento(m) {
    if (pagina() === 'mov') { pdfNoMovimento(m); return; }
    // No Controlo de Pacientes: abre o Movimento do serviço, que gera o PDF sozinho.
    window.open(item() + '_movimento.html?pdf=' + encodeURIComponent(m), '_blank');
  }
  window.zeloBaixarMovimento = baixarMovimento;

  // ── Prazo de entrega: pede ao chefe para fechar, baixar o PDF, imprimir e levar ──
  function passos(m, f) {
    var feito = function (ok) { return '<span style="display:inline-block;width:22px;height:22px;border-radius:50%;text-align:center;line-height:22px;margin-right:8px;font-weight:800;' + (ok ? 'background:#10B981;color:#fff">✓' : 'background:#E2E8F0;color:#475569">•') + '</span>'; };
    var h = '<p>' + (f ? 'O Movimento de <b>' + nomeMes(m) + '</b> está fechado. Falta levá-lo à Estatística:' : 'Chegou o prazo de entrega do Movimento de <b>' + nomeMes(m) + '</b> (' + fmtDia(prazoEntrega(m)) + '). Siga os passos:') + '</p>' +
      '<div class="zfm-it' + (f ? ' okk' : '') + '"><div class="d">' + feito(!!f) + '<b>1. Fechar e entregar no ZELO</b>' + (f ? ' — ' + (f.estado === 'entregue' ? 'feito por ' + esc(f.por || '') + ' em ' + fmtData(f.em) : 'fechado automaticamente') : '') + '</div>' + (f ? '' : '<button type="button" class="zfm-bt p" data-zfm-entregar="' + m + '">Fechar e entregar</button>') + '</div>' +
      '<div class="zfm-it"><div class="d">' + feito(false) + '<b>2. Baixar o PDF do Movimento mensal</b></div><button type="button" class="zfm-bt p" data-zfm-pdf-mov="' + m + '">Baixar PDF</button></div>' +
      '<div class="zfm-it"><div class="d">' + feito(false) + '<b>3. Imprimir o relatório do mês e levar à Estatística</b>, assinado, a tempo.</div></div>';
    janela('Entrega do Movimento — ' + nomeMes(m), NOMES[item()] || item(), h, '<button type="button" class="zfm-bt" data-zfm-fechar>Fechar</button>');
  }
  function pedidoDoPrazo() {
    var a = mesAlvo(), q = quem(); if (!q.pode || (a.fase !== 'entrega' && a.fase !== 'atraso')) return;
    var k = 'zeloFechoPassos_' + item() + '_' + hojeISO(); try { if (localStorage.getItem(k)) return; localStorage.setItem(k, '1'); } catch (e) { return; }
    lerFecho(item(), a.m).then(function (f) { setTimeout(function () { passos(a.m, f); }, 2500); });
  }

  // ── Retificações no Controlo de Pacientes (antes de gravar) ──
  var pend = null; // motivo já pedido (o registo pode ser repetido sozinho depois da verificação do NUP)
  function pedirMotivo(meses, acao, doente, continuar) {
    var q = quem(), it = item();
    var lista = meses.map(nomeMes).join(', ');
    if (!q.pode) {
      if (typeof showFeedback === 'function') showFeedback('O mês de ' + lista + ' já está fechado. Só o chefe de serviço, o(a) enfermeiro(a) chefe ou o administrador podem fazer retificações.', 'error');
      return;
    }
    var h = '<p>O Movimento de <b>' + esc(lista) + '</b> já foi fechado/entregue à Estatística. Esta alteração é uma <b>retificação</b>: os números do mês são recalculados, a cópia entregue fica igual e a diferença fica documentada na Nota de retificação.</p>' +
      '<p><b>Ação:</b> ' + esc(acao) + (doente && doente.nome ? ' — ' + esc(doente.nome) + (doente.nup ? ' (NUP ' + esc(doente.nup) + ')' : '') : '') + '</p>' +
      '<label for="zfm-motivo"><b>Motivo (obrigatório)</b></label><textarea id="zfm-motivo" placeholder="Ex.: doente não registado por esquecimento; confirmado no livro de registo."></textarea><div class="zfm-err" id="zfm-err"></div>';
    var ov = janela('Retificação de mês fechado', (NOMES[it] || it), h, '<button type="button" class="zfm-bt" data-zfm-fechar>Cancelar</button><button type="button" class="zfm-bt p" data-zfm-ok>Confirmar retificação</button>');
    setTimeout(function () { var t = ov.querySelector('#zfm-motivo'); if (t) t.focus(); }, 50);
    ov.querySelector('[data-zfm-ok]').addEventListener('click', function () {
      var mot = ov.querySelector('#zfm-motivo').value.trim();
      if (mot.length < 8) { ov.querySelector('#zfm-err').textContent = 'Escreva o motivo (pelo menos algumas palavras).'; return; }
      ov.remove(); continuar(mot);
    });
  }
  function registarRetificacao(meses, acao, p, motivo) {
    var q = quem(), it = item(), em = agoraLocal();
    var doente = { nome: p.nome || '', nup: p.nup || '', dataEntrada: p.dataEntrada || '', dataSaida: p.status !== 'internado' ? (p.dataSaida || '') : '' };
    var reg = { em: em, por: q.nome, funcao: q.funcao, motivo: motivo, acao: acao, doente: doente, controlo: (function () { try { return String(FB_PACIENTES_PATH).split('/').pop(); } catch (e) { return ''; } })() };
    meses.forEach(function (m) {
      if (typeof window.zeloQueueWrite === 'function') window.zeloQueueWrite(BASE + 'fecho_mes_retificacoes/' + it + '/' + m + '/' + Date.now() + '_' + Math.random().toString(36).slice(2, 6), reg);
    });
    // Fica também no próprio registo do doente (visível no processo).
    p.retificacoes = p.retificacoes || {};
    p.retificacoes['r' + Date.now().toString(36)] = { em: em, por: q.nome, funcao: q.funcao, motivo: motivo, acao: acao, meses: meses.join(',') };
    try { saveData(); } catch (e) {}
  }
  function mesesFechados(datas) {
    var it = item(), l = [];
    datas.forEach(function (d) { var m = mesDe(d); if (m && /^\d{4}-\d{2}$/.test(m) && m < mesDe(hojeISO()) && fechadoSync(it, m) && l.indexOf(m) < 0) l.push(m); });
    return l.sort();
  }
  function envolver(nome, fn) { var f = window[nome]; if (typeof f !== 'function' || f.__zfm) return !!(f && f.__zfm); var w = fn(f); Object.keys(f).forEach(function (k) { w[k] = f[k]; }); w.__zfm = true; window[nome] = w; return true; }
  function valor(id) { var e = document.getElementById(id); return e ? e.value : ''; }
  function porN(n) { return pacientes().filter(function (p) { return String(p.n) === String(n); })[0]; }
  function ligarCP() {
    var ok = true;
    ok = envolver('addPaciente', function (f) {
      return function () {
        var self = this, args = arguments, ent = valor('fDataEntrada'), nup = valor('fNUP').trim(), ms = mesesFechados([ent]);
        if (!ms.length) return f.apply(self, args);
        var chaveP = nup + '|' + ent;
        var correr = function (mot) {
          pend = { k: chaveP, mot: mot };
          var antes = pacientes().length, r = f.apply(self, args), l = pacientes();
          if (l.length > antes) { var p = l[l.length - 1]; registarRetificacao(ms, 'Registo tardio de doente', p, mot); pend = null; }
          return r;
        };
        if (pend && pend.k === chaveP) return correr(pend.mot);
        pedirMotivo(ms, 'Registo tardio de doente', { nome: valor('fNome'), nup: nup }, correr);
      };
    }) && ok;
    ok = envolver('addSaida', function (f) {
      return function () {
        var self = this, args = arguments, p = porN(valor('fSaidaPaciente')), sd = valor('fSaidaData'), ms = mesesFechados([sd]);
        if (!ms.length || !p) return f.apply(self, args);
        pedirMotivo(ms, 'Saída registada depois do fecho', p, function (mot) {
          var r = f.apply(self, args), q = porN(p.n);
          if (q && q.status !== 'internado') registarRetificacao(ms, 'Saída registada depois do fecho', q, mot);
          return r;
        });
      };
    }) && ok;
    ok = envolver('updatePaciente', function (f) {
      return function () {
        var self = this, args = arguments, n = null; try { n = editingPacienteN; } catch (e) {}
        var p = porN(n), novaEnt = valor('eDataEntrada');
        if (!p || dia(novaEnt) === dia(p.dataEntrada)) return f.apply(self, args);
        var ms = mesesFechados([p.dataEntrada, novaEnt]);
        if (!ms.length) return f.apply(self, args);
        pedirMotivo(ms, 'Data de entrada corrigida (' + fmtData(p.dataEntrada) + ' → ' + fmtData(novaEnt) + ')', p, function (mot) {
          var r = f.apply(self, args), q = porN(p.n);
          if (q && dia(q.dataEntrada) === dia(novaEnt)) registarRetificacao(ms, 'Data de entrada corrigida', q, mot);
          return r;
        });
      };
    }) && ok;
    ok = envolver('deletePaciente', function (f) {
      return function (n) {
        var self = this, args = arguments, p = porN(n);
        if (!p) return f.apply(self, args);
        var ms = mesesFechados([p.dataEntrada, p.status !== 'internado' ? p.dataSaida : null].filter(Boolean));
        if (!ms.length) return f.apply(self, args);
        pedirMotivo(ms, 'Registo anulado', p, function (mot) {
          var copia = JSON.parse(JSON.stringify(p));
          var r = f.apply(self, args);
          if (!porN(n)) {
            var q = quem(), it = item(), em = agoraLocal();
            ms.forEach(function (m) { if (typeof window.zeloQueueWrite === 'function') window.zeloQueueWrite(BASE + 'fecho_mes_retificacoes/' + it + '/' + m + '/' + Date.now() + '_' + Math.random().toString(36).slice(2, 6), { em: em, por: q.nome, funcao: q.funcao, motivo: mot, acao: 'Registo anulado', doente: { nome: copia.nome || '', nup: copia.nup || '', dataEntrada: copia.dataEntrada || '', dataSaida: copia.dataSaida || '' } }); });
          }
          return r;
        });
      };
    }) && ok;
    return ok;
  }

  // ── Movimento Hospitalar Geral: quadro do estado de entrega ──
  var SERV_MHG = ['cirurgia_geral', 'maxilo_facial', 'medicina_interna', 'nefrologia', 'neurocirurgia', 'ortopedia', 'uci'];
  function quadroMHG() {
    var alvo = document.querySelector('main'); if (!alvo || document.getElementById('zfm-quadro')) return;
    var box = document.createElement('section'); box.id = 'zfm-quadro'; box.style.cssText = 'margin:0 0 16px';
    alvo.insertBefore(box, alvo.firstChild);
    var m = mesAnterior(mesDe(hojeISO()));
    var desenhar = function () {
      Promise.all(SERV_MHG.map(function (it) { return Promise.all([lerFecho(it, m, true), lerRetificacoes(it, m)]); })).then(function (rs) {
        box.innerHTML = '<div class="zfm rev" style="display:block"><b>Entrega do Movimento de ' + nomeMes(m) + '</b> <small style="display:inline">· entrega até ' + fmtDia(prazoEntrega(m)) + '</small><div class="zfm-q" style="margin-top:10px">' + SERV_MHG.map(function (it, i) {
          var f = rs[i][0], n = rs[i][1].length, est, cor;
          if (!f) { var ag = agoraLocal(); est = ag > prazo(m) ? 'A fechar automaticamente' : ag > prazoEntrega(m) ? 'Atrasado (prazo ' + fmtDia(prazoEntrega(m)) + ')' : 'Em revisão · entrega até ' + fmtDia(prazoEntrega(m)); cor = ag > prazoEntrega(m) ? '#B91C1C' : '#B45309'; }
          else if (n) { est = n + ' retificação(ões)'; cor = '#6D28D9'; }
          else if (f.estado === 'entregue') { est = 'Entregue · ' + esc(f.por || '') + ' · ' + fmtData(f.em); cor = '#047857'; }
          else { est = 'Fechado automaticamente · ' + fmtData(f.em); cor = '#B91C1C'; }
          return '<div style="background:#fff;color:#0F172A"><b style="color:' + cor + '">● ' + esc(NOMES[it]) + '</b><span style="font-size:.82rem">' + est + '</span>' + (f ? '<br><button type="button" class="zfm-bt" style="margin-top:6px" data-zfm-ret-it="' + it + '" data-zfm-m="' + m + '">' + (n ? 'Nota de retificação' : 'Números entregues') + '</button>' : '') + '</div>';
        }).join('') + '</div></div>';
      });
    };
    box.addEventListener('click', function (e) { var b = e.target.closest('[data-zfm-ret-it]'); if (b) abrirRetificacoes(b.dataset.zfmRetIt, b.dataset.zfmM); });
    desenhar();
  }

  // ── Arranque ──
  var n = 0, iv = setInterval(function () {
    n++;
    var t = pagina(); if (!t) { clearInterval(iv); return; }
    if (!pronto() && n < 120) return;
    clearInterval(iv);
    var its = t === 'mhg' ? SERV_MHG : [item()];
    // O Movimento fecha primeiro (antes de recalcular com alterações feitas depois do prazo).
    fechosAutomaticos(its).then(function () {
      if (t === 'mhg') quadroMHG(); else { mostrarFaixa(); avisoVoz(); pedidoDoPrazo(); }
      // Aberto a partir do Controlo de Pacientes com ?pdf=AAAA-MM: gera o PDF do Movimento desse mês.
      var pm = (location.search.match(/[?&]pdf=(\d{4}-\d{2})/) || [])[1];
      if (t === 'mov' && pm) setTimeout(function () { pdfNoMovimento(pm); }, 2500);
      // meses fechados em cache para as verificações das retificações
      var h = mesDe(hojeISO()); [mesAnterior(h), mesAnterior(mesAnterior(h))].forEach(function (m) { its.forEach(function (it) { lerFecho(it, m); }); });
    });
    if (t === 'cp') { var k = 0, iv2 = setInterval(function () { k++; if (ligarCP() || k > 80) clearInterval(iv2); }, 250); }
  }, 250);
  window.ZeloFechoMes = { fechar: fechar, revisao: abrirRevisao, retificacoes: abrirRetificacoes, prazo: prazo, mesAlvo: mesAlvo };
})();
