// ── ZELO — Dias de Cama e Dias de Doente (Serviço de Estatística) ──
// Registo das folhas de recolha entregues pelos serviços, com o mesmo
// desenho do Movimento Hospitalar: faixa com os totais, dias do mês,
// registo do dia, mapa do mês (igual à folha em papel), gráficos e resumo.
//
// Dados: registos_sistemas_locais/dias_cama/<AAAA-MM>/<serviço> =
//   { lotacao, cama:{dia:n}, doente:{dia:n}, responsavel, entrega, recebido, recebidoPor, em, por }
// Cada número grava-se sozinho no seu lugar (campo a campo): dois
// computadores podem registar ao mesmo tempo sem se apagarem. Sem internet,
// as alterações ficam neste computador e seguem quando a ligação voltar.
// Nada é apagado: só se grava o valor que a pessoa escreve.
//
// O Movimento Hospitalar de cada serviço (registos_movimento/<serviço>/snapshot/<mês>)
// é só LIDO, para comparar os dias de cama e de doente — nunca é alterado.
(function () {
  'use strict';
  var BASE = 'registos_sistemas_locais/dias_cama';
  var SERVICOS = [
    ['medicina_homem', 'Medicina Homem'], ['medicina_mulher', 'Medicina Mulher'], ['cirurgia_geral', 'Cirurgia Geral'],
    ['ortopedia', 'Orto-Traumatologia'], ['neurocirurgia', 'Neurocirurgia'], ['maxilo_facial', 'Maxilo-Facial'],
    ['nefrologia', 'Nefrologia'], ['uci_intensivo', 'UCI'], ['uci_intermedio', 'Cuidados Intermédios']
  ];
  var SEM = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  var SEM_L = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  var FD = window.ZeloFolhaDiasCama;
  var PEND_K = 'zeloDiasCamaPendentes', CACHE_K = 'zeloDiasCamaCache_';
  var ICO_OK = '<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>';
  var ICO_AV = '<svg viewBox="0 0 24 24"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>';
  var ICO_INFO = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>';

  function $(id) { return document.getElementById(id); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function num(v) { return v === null || v === undefined || v === '' || isNaN(v) ? null : Number(v); }
  function f1(v) { return v == null || !isFinite(v) ? '—' : v.toFixed(1).replace('.', ','); }
  function pct(v) { return v == null || !isFinite(v) ? '—' : f1(v) + '%'; }
  function hojeISO() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function utilizador() { try { return sessionStorage.getItem('zeloNome') || ''; } catch (e) { return ''; } }
  function lerLS(k, def) { try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? def : v; } catch (e) { return def; } }
  function gravarLS(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function nomeServ(slug) { var s = SERVICOS.filter(function (x) { return x[0] === slug; })[0]; return s ? s[1] : slug; }
  function nomeMes(ym) { var p = ym.split('-'); return FD.MESES[+p[1] - 1] + ' ' + p[0]; }
  function somarMes(ym, n) { var p = ym.split('-'), d = new Date(+p[0], +p[1] - 1 + n, 1); return d.getFullYear() + '-' + pad(d.getMonth() + 1); }
  function lerNum(v) { v = String(v == null ? '' : v).trim(); if (v === '') return null; if (!/^\d{1,4}$/.test(v)) return undefined; return Number(v); }
  function toast(t) { var e = $('dcToast'); e.textContent = t; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { e.classList.remove('on'); }, 2600); }

  var agora = new Date(), YM_HOJE = agora.getFullYear() + '-' + pad(agora.getMonth() + 1);
  var estado = {
    ym: lerLS('zeloDiasCamaMes', null) || YM_HOJE,
    serv: lerLS('zeloDiasCamaServ', SERVICOS[0][0]),
    per: 'mes', dia: null, diaAuto: true, mes: {}, parar: null, carregado: false,
    mov: {}, movYm: null, movPronto: false, perDados: {}, perPedidos: {}
  };
  if (!SERVICOS.some(function (s) { return s[0] === estado.serv; })) estado.serv = SERVICOS[0][0];

  // Último dia "devido" do mês: hoje no mês corrente, nenhum num mês futuro.
  function limite(ym) { if (ym === YM_HOJE) return agora.getDate(); return ym < YM_HOJE ? FD.diasNoMes(ym) : 0; }

  // ── alterações por enviar (sem internet ou à espera da resposta) ──
  var pend = lerLS(PEND_K, {});
  function caminho(ym, slug, campo) { return BASE + '/' + ym + '/' + slug + '/' + campo; }
  function aplicar(obj, campo, v) { var p = campo.split('/'); if (p.length === 2) { obj[p[0]] = obj[p[0]] || {}; if (v == null) delete obj[p[0]][p[1]]; else obj[p[0]][p[1]] = v; } else { if (v == null) delete obj[campo]; else obj[campo] = v; } }
  function comPendentes(ym, dadosMes) {
    var out = JSON.parse(JSON.stringify(dadosMes || {}));
    Object.keys(pend).forEach(function (k) {
      var pre = BASE + '/' + ym + '/'; if (k.indexOf(pre) !== 0) return;
      var r = k.slice(pre.length), i = r.indexOf('/'), slug = r.slice(0, i), campo = r.slice(i + 1);
      out[slug] = out[slug] || {}; aplicar(out[slug], campo, pend[k].v);
    });
    return out;
  }
  var enviando = false;
  function enviar() {
    if (enviando || !window.__fbReady || navigator.onLine === false) return;
    var ks = Object.keys(pend); if (!ks.length) { mostrarEstado(); return; }
    enviando = true;
    var lote = {}; ks.forEach(function (k) { lote[k] = pend[k]; });
    // Um update por mês: todas as alterações pendentes numa só escrita.
    var porMes = {};
    ks.forEach(function (k) { var r = k.slice(BASE.length + 1), ym = r.slice(0, 7); (porMes[ym] = porMes[ym] || {})[r.slice(8)] = pend[k].v; });
    Promise.all(Object.keys(porMes).map(function (ym) { return window.__fbUpdate(BASE + '/' + ym, porMes[ym]); }))
      .then(function () { ks.forEach(function (k) { if (pend[k] && pend[k].t === lote[k].t) delete pend[k]; }); gravarLS(PEND_K, pend); })
      .catch(function (e) { console.warn('ZELO dias de cama: envio adiado', e); })
      .then(function () { enviando = false; desenhar(); });
  }
  function guardar(slug, campos, ym) {
    ym = ym || estado.ym;
    var t = Date.now(), quem = utilizador();
    Object.keys(campos).forEach(function (c) { pend[caminho(ym, slug, c)] = { v: campos[c], t: t }; });
    pend[caminho(ym, slug, 'em')] = { v: t, t: t };
    if (quem) pend[caminho(ym, slug, 'por')] = { v: quem, t: t };
    // 1.º número da folha: regista a receção (hoje, por quem está a registar).
    var D = dadosServ(slug);
    if (!D.recebido && !('recebido' in campos)) pend[caminho(ym, slug, 'recebido')] = { v: hojeISO(), t: t };
    if (!D.recebidoPor && !('recebidoPor' in campos) && quem) pend[caminho(ym, slug, 'recebidoPor')] = { v: quem, t: t };
    gravarLS(PEND_K, pend);
    desenhar(); enviar();
  }
  window.addEventListener('online', enviar);
  setInterval(function () { if (!document.hidden && Object.keys(pend).length) enviar(); }, 15000);

  // ── leitura ao vivo (só o mês aberto) ──
  function escutar() {
    if (estado.parar) { try { estado.parar(); } catch (e) {} estado.parar = null; }
    var ym = estado.ym;
    estado.mes = lerLS(CACHE_K + ym, {});
    estado.carregado = false;
    carregarMov();
    desenhar();
    if (!window.__fbListen) return;
    estado.parar = window.__fbListen(BASE + '/' + ym, function (v) {
      if (ym !== estado.ym) return;
      estado.mes = v || {}; gravarLS(CACHE_K + ym, estado.mes); estado.carregado = true;
      desenhar();
    });
  }
  function dadosMes() { return comPendentes(estado.ym, estado.mes); }
  function dadosServ(slug) { return dadosMes()[slug] || {}; }
  function val(D, campo, d) { return num((D[campo] || {})[d]); }

  // ── Movimento Hospitalar (só leitura, uma vez por mês aberto) ──
  function carregarMov() {
    var ym = estado.ym;
    if (estado.movYm === ym) return;
    estado.movYm = ym; estado.mov = {}; estado.movPronto = false;
    if (!window.__fbGet) return;
    Promise.all(SERVICOS.map(function (s) {
      return window.__fbGet('registos_movimento/' + s[0] + '/snapshot/' + ym).then(function (v) { estado.mov[s[0]] = v || null; }).catch(function () { estado.mov[s[0]] = null; });
    })).then(function () { if (estado.movYm === ym) { estado.movPronto = true; desenhar(); } });
  }
  function movVal(slug, campo, d) {
    var m = estado.mov[slug], a = m && m[campo == 'cama' ? 'dia_cama' : 'dia_doente'];
    if (!a) return null;
    var v = a[d - 1]; if (v === null || v === undefined || v === '') return null;
    v = parseInt(v, 10); return isNaN(v) ? null : v;
  }
  // Dias em que os dois registos têm o número e não coincidem.
  function comparar(slug) {
    var D = dadosServ(slug), nd = FD.diasNoMes(estado.ym), dif = [], temMov = false, comparados = 0;
    for (var d = 1; d <= nd; d++) {
      var mc = movVal(slug, 'cama', d), md = movVal(slug, 'doente', d), c = val(D, 'cama', d), o = val(D, 'doente', d);
      if (mc != null || md != null) temMov = true;
      var x = false, comp = false;
      if (mc != null && c != null) { comp = true; if (mc !== c) x = true; }
      if (md != null && o != null) { comp = true; if (md !== o) x = true; }
      if (comp) comparados++;
      if (x) dif.push(d);
    }
    return { dif: dif, temMov: temMov, comparados: comparados };
  }

  // ── contas do mês ──
  function contasMes(D, ym) {
    var nd = FD.diasNoMes(ym), lim = limite(ym), T = FD.totais(D, ym), pc = 0, pd = 0, nPar = 0, sd = 0, nDo = 0, falta = [];
    for (var d = 1; d <= nd; d++) {
      var c = val(D, 'cama', d), o = val(D, 'doente', d);
      if (o != null) { sd += o; nDo++; }
      if (c != null && o != null) { pc += c; pd += o; nPar++; }
      else if (d <= lim) falta.push(d);
    }
    return { cama: T.cama, doente: T.doente, taxa: T.taxa, pc: pc, pd: pd, nPar: nPar, preenchidos: T.preenchidos, dias: nd,
      media: nDo ? sd / nDo : null, livres: nPar ? (pc - pd) / nPar : null, falta: falta, lotacao: num(D.lotacao) };
  }

  // ── períodos (trimestre, semestre, ano) ──
  function mesesPeriodo() {
    var p = estado.ym.split('-'), y = +p[0], m = +p[1], ini, n;
    if (estado.per === 'tri') { ini = Math.floor((m - 1) / 3) * 3 + 1; n = 3; }
    else if (estado.per === 'sem') { ini = m <= 6 ? 1 : 7; n = 6; }
    else { ini = 1; n = 12; }
    var out = []; for (var i = 0; i < n; i++) out.push(y + '-' + pad(ini + i)); return out;
  }
  function tituloPeriodo() {
    var ms = mesesPeriodo(), p = ms[0].split('-'), m = +p[1];
    if (estado.per === 'tri') return ((m - 1) / 3 + 1) + '.º trimestre de ' + p[0];
    if (estado.per === 'sem') return (m === 1 ? '1.º' : '2.º') + ' semestre de ' + p[0];
    return 'Ano de ' + p[0];
  }
  function dadosDoMes(ym) { return ym === estado.ym ? dadosMes() : comPendentes(ym, estado.perDados[ym] || lerLS(CACHE_K + ym, {})); }
  function carregarPeriodo() {
    if (!window.__fbGet) return;
    mesesPeriodo().forEach(function (ym) {
      if (ym === estado.ym || ym > YM_HOJE || estado.perPedidos[ym]) return;
      estado.perPedidos[ym] = true;
      window.__fbGet(BASE + '/' + ym).then(function (v) { estado.perDados[ym] = v || {}; gravarLS(CACHE_K + ym, estado.perDados[ym]); desenhar(); })
        .catch(function () { estado.perPedidos[ym] = false; });
    });
  }
  function contasPeriodo(slug) {
    var r = { cama: null, doente: null, pc: 0, pd: 0, nPar: 0, preenchidos: 0, dias: 0, sd: 0, nDo: 0, faltaN: 0, lotacao: null, meses: [] };
    mesesPeriodo().forEach(function (ym) {
      var D = dadosDoMes(ym)[slug] || {}, C = contasMes(D, ym);
      if (C.cama != null) r.cama = (r.cama || 0) + C.cama;
      if (C.doente != null) r.doente = (r.doente || 0) + C.doente;
      r.pc += C.pc; r.pd += C.pd; r.nPar += C.nPar; r.preenchidos += C.preenchidos; r.dias += C.dias; r.faltaN += C.falta.length;
      if (C.media != null) { var nDo = 0; for (var d = 1; d <= C.dias; d++) if (val(D, 'doente', d) != null) nDo++; r.sd += C.media * nDo; r.nDo += nDo; }
      if (C.lotacao != null) r.lotacao = C.lotacao;
      r.meses.push({ ym: ym, C: C });
    });
    r.taxa = r.pc ? r.pd / r.pc * 100 : null;
    r.media = r.nDo ? r.sd / r.nDo : null;
    r.livres = r.nPar ? (r.pc - r.pd) / r.nPar : null;
    return r;
  }
  function contas(slug) {
    if (estado.per === 'mes') { var C = contasMes(dadosServ(slug), estado.ym); C.faltaN = C.falta.length; return C; }
    return contasPeriodo(slug);
  }

  // ── desenho ──
  function setVal(el, v) { if (document.activeElement === el) return; el.value = v == null ? '' : v; }
  function resumirDias(l) { var out = [], i = 0; while (i < l.length) { var j = i; while (j + 1 < l.length && l[j + 1] === l[j] + 1) j++; out.push(j > i ? l[i] + '–' + l[j] : String(l[i])); i = j + 1; } return out.join(', '); }
  function corTaxa(t) { return t > 100 ? '#DC2626' : t >= 85 ? '#059669' : t >= 70 ? '#1A56DB' : '#F59E0B'; }

  function desenhar() {
    var mes = estado.per === 'mes';
    // faixa
    var tt = mes ? nomeMes(estado.ym) : tituloPeriodo(); $('mNome').textContent = tt.charAt(0).toUpperCase() + tt.slice(1);
    var sel = $('selServ');
    if (!sel.options.length) sel.innerHTML = SERVICOS.map(function (s) { return '<option value="' + s[0] + '">' + esc(s[1]) + '</option>'; }).join('');
    sel.value = estado.serv;
    Array.prototype.forEach.call(document.querySelectorAll('#per button'), function (b) { b.classList.toggle('on', b.dataset.p === estado.per); });
    var lot = $('lot'); lot.disabled = !mes;
    var C = contas(estado.serv);
    setVal(lot, mes ? C.lotacao : C.lotacao);
    $('mSub').textContent = mes ? (C.preenchidos + ' de ' + C.dias + ' dias registados') : (C.preenchidos + ' de ' + C.dias + ' dias registados · ' + nomeServ(estado.serv));
    $('nC').textContent = C.cama == null ? '—' : C.cama;
    $('nD').textContent = C.doente == null ? '—' : C.doente;
    $('nT').textContent = pct(C.taxa);
    $('nM').textContent = f1(C.media);
    $('nL').textContent = f1(C.livres);
    $('nF').textContent = C.faltaN;
    var fl = $('falta');
    if (mes) {
      if (limite(estado.ym) === 0) { fl.className = 'm2-falta'; fl.innerHTML = ICO_INFO + 'Mês ainda não começou'; }
      else if (C.falta.length) { fl.className = 'm2-falta'; fl.innerHTML = ICO_AV + C.falta.length + ' dia' + (C.falta.length > 1 ? 's' : '') + ' em falta: ' + resumirDias(C.falta); }
      else { fl.className = 'm2-falta ok'; fl.innerHTML = ICO_OK + 'Todos os dias registados'; }
    } else {
      fl.className = 'm2-falta' + (C.faltaN ? '' : ' ok');
      fl.innerHTML = (C.faltaN ? ICO_AV + C.faltaN + ' dias em falta no período' : ICO_OK + 'Período completo até hoje');
    }
    // serviços
    $('servs').innerHTML = SERVICOS.map(function (s) {
      var K = contas(s[0]), ok = K.preenchidos >= K.dias;
      return '<button type="button" class="sv' + (ok ? ' ok' : '') + (s[0] === estado.serv ? ' on' : '') + '" data-s="' + s[0] + '"><b>' + esc(s[1]) + '</b><div class="l"><span>' + K.preenchidos + '/' + K.dias + '</span><span class="tx">' + pct(K.taxa) + '</span></div><div class="bar"><i style="width:' + (K.dias ? K.preenchidos / K.dias * 100 : 0) + '%"></i></div></button>';
    }).join('');
    $('vMes').hidden = !mes; $('vPer').hidden = mes;
    $('nG1').textContent = mes ? 6 : 3; $('nG2').textContent = mes ? 7 : 4; $('nR').textContent = mes ? 8 : 5;
    if (mes) { desenharDias(); desenharRegisto(); desenharFolha(); desenharMapa(); }
    else desenharPeriodo();
    desenharGrafico(); desenharBarras(); desenharResumo();
    mostrarEstado();
  }

  function escolherDia() {
    var nd = FD.diasNoMes(estado.ym);
    // Abre no 1.º dia em falta, até a pessoa escolher outro dia.
    if (estado.dia && estado.dia <= nd && !estado.diaAuto) return;
    var D = dadosServ(estado.serv), lim = limite(estado.ym);
    for (var d = 1; d <= lim; d++) if (val(D, 'cama', d) == null || val(D, 'doente', d) == null) { estado.dia = d; return; }
    estado.dia = Math.max(1, Math.min(lim || 1, nd));
  }

  function desenharDias() {
    escolherDia();
    var D = dadosServ(estado.serv), nd = FD.diasNoMes(estado.ym), p = estado.ym.split('-'), lim = limite(estado.ym), h = '';
    for (var d = 1; d <= nd; d++) {
      var c = val(D, 'cama', d), o = val(D, 'doente', d), cl = 'm2-d';
      cl += (c != null && o != null) ? (o > c ? ' x' : ' ok') : ' fa';
      if (d > lim) cl += ' fut';
      if (estado.ym === YM_HOJE && d === agora.getDate()) cl += ' hj';
      if (d === estado.dia) cl += ' on';
      h += '<button type="button" class="' + cl + '" data-dia="' + d + '">' + d + '<small>' + SEM[new Date(+p[0], +p[1] - 1, d).getDay()] + '</small></button>';
    }
    $('dias').innerHTML = h;
  }

  function desenharRegisto() {
    var slug = estado.serv, D = dadosServ(slug), d = estado.dia, nd = FD.diasNoMes(estado.ym), p = estado.ym.split('-');
    var L = num(D.lotacao), c = val(D, 'cama', d), o = val(D, 'doente', d);
    $('rDia').textContent = SEM_L[new Date(+p[0], +p[1] - 1, d).getDay()] + ', ' + d + ' de ' + FD.MESES[+p[1] - 1];
    $('rSub').textContent = nomeServ(slug) + (L != null ? ' · lotação ' + L + ' camas' : ' · lotação por indicar');
    // Cada campo sabe a que dia pertence: ao mudar de dia, o valor é sempre trocado
    // (mesmo com o cursor lá), para não ir parar ao dia errado.
    [['rC', c], ['rD', o]].forEach(function (x) { var el = $(x[0]); if (+el.dataset.dia !== d) { el.value = x[1] == null ? '' : x[1]; el.dataset.dia = d; el.classList.remove('erro'); } else setVal(el, x[1]); });
    $('fC').textContent = c == null ? '—' : c;
    $('fD').textContent = o == null ? '—' : o;
    var tx = c && o != null ? o / c * 100 : null;
    $('fT').textContent = tx == null ? '—' : f1(tx) + '%';
    $('fTw').classList.toggle('x', tx != null && tx > 100);
    $('fL').textContent = c != null && o != null ? c - o : '—';
    $('stD').classList.toggle('x', c != null && o != null && o > c);
    var oc = d > 1 ? val(D, 'cama', d - 1) : null, od = d > 1 ? val(D, 'doente', d - 1) : null;
    var mc = movVal(slug, 'cama', d), md = movVal(slug, 'doente', d), dc = '', dd = '';
    if (L != null) dc += '<button type="button" data-por="cama" data-v="' + L + '">= lotação (' + L + ')</button>';
    if (oc != null) dc += '<button type="button" data-por="cama" data-v="' + oc + '">igual a ontem (' + oc + ')</button>';
    if (mc != null && mc !== c) dc += '<button type="button" data-por="cama" data-v="' + mc + '">do Movimento (' + mc + ')</button>';
    if (od != null) dd += '<button type="button" data-por="doente" data-v="' + od + '">igual a ontem (' + od + ')</button>';
    if (md != null && md !== o) dd += '<button type="button" data-por="doente" data-v="' + md + '">do Movimento (' + md + ')</button>';
    $('dC').innerHTML = dc; $('dD').innerHTML = dd;
    var av = '';
    if (c != null && o != null && o > c) av += '<div class="av mau"><b>Mais doentes do que camas</b> neste dia — confirme na folha.</div>';
    if (c != null && L != null && c !== L) av += '<div class="av am">Dias de cama (' + c + ') diferentes da lotação (' + L + ').</div>';
    $('rAv').innerHTML = av ? '<div class="avisos">' + av + '</div>' : '';
    var cz = $('cruz');
    if (!estado.movPronto) { cz.className = 'cruz nd'; cz.innerHTML = ICO_INFO + '<span>A consultar o Movimento Hospitalar…</span>'; }
    else if (mc == null && md == null) { cz.className = 'cruz nd'; cz.innerHTML = ICO_INFO + '<span>O Movimento Hospitalar ainda não tem este dia registado.</span>'; }
    else if (c == null && o == null) { cz.className = 'cruz av'; cz.innerHTML = ICO_INFO + '<span>O <b>Movimento Hospitalar</b> deste dia tem: cama ' + (mc == null ? '—' : mc) + ' · doente ' + (md == null ? '—' : md) + '.</span>'; }
    else if ((mc == null || c == null || mc === c) && (md == null || o == null || md === o)) { cz.className = 'cruz ok'; cz.innerHTML = ICO_OK + '<span><b>Igual ao Movimento Hospitalar</b> deste dia (cama ' + (mc == null ? '—' : mc) + ' · doente ' + (md == null ? '—' : md) + ').</span>'; }
    else { cz.className = 'cruz dif'; cz.innerHTML = ICO_AV + '<span><b>Diferente do Movimento Hospitalar:</b> lá está cama ' + (mc == null ? '—' : mc) + ' · doente ' + (md == null ? '—' : md) + '.</span>'; }
    // estado da gravação deste dia
    var pd = pend[caminho(estado.ym, slug, 'cama/' + d)] || pend[caminho(estado.ym, slug, 'doente/' + d)], ok = $('rOk');
    if (pd) { ok.className = 'm2-ok pend'; ok.textContent = navigator.onLine === false ? 'Sem internet — guardado neste computador' : 'A gravar…'; }
    else if (c != null || o != null) { var em = num(D.em); ok.className = 'm2-ok'; ok.textContent = '✓ Gravado' + (em ? ' às ' + new Date(em).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : ''); }
    else { ok.className = 'm2-ok'; ok.textContent = ''; }
    $('rAnt').textContent = '‹ Dia ' + (d - 1); $('rAnt').hidden = d <= 1;
    $('rSeg').textContent = d < nd ? 'Guardar e ir para o dia ' + (d + 1) : 'Guardar';
  }

  function desenharFolha() {
    var D = dadosServ(estado.serv);
    ['fResp', 'fEnt', 'fRecEm', 'fRecPor'].forEach(function (id) { setVal($(id), D[$(id).dataset.campo]); });
    var e = $('fEst').querySelector('span'), ent = D.entrega || D.recebido;
    if (!ent) { e.textContent = 'Folha ainda não registada como entregue.'; return; }
    var p = estado.ym.split('-'), fim = new Date(+p[0], +p[1], 0), q = String(ent).split('-'), dt = new Date(+q[0], +q[1] - 1, +q[2]);
    var dias = Math.round((dt - fim) / 86400000);
    e.textContent = dias > 0 ? 'Entregue ' + dias + ' dia' + (dias > 1 ? 's' : '') + ' depois do fim do mês' : dias === 0 ? 'Entregue no último dia do mês' : 'Entregue antes do fim do mês';
  }

  function desenharMapa() {
    var t = $('mapa'), foco = document.activeElement;
    if (foco && t.contains(foco)) return; // não redesenhar por baixo de quem está a escrever
    var slug = estado.serv, D = dadosServ(slug), nd = FD.diasNoMes(estado.ym), p = estado.ym.split('-'), L = num(D.lotacao), C = contasMes(D, estado.ym);
    var h = '<tr><th>Dia</th>';
    for (var d = 1; d <= nd; d++) h += '<th data-dia="' + d + '"' + (d === estado.dia ? ' class="on"' : '') + '>' + d + '<small>' + SEM[new Date(+p[0], +p[1] - 1, d).getDay()].charAt(0) + '</small></th>';
    h += '<th class="tot">Total</th></tr>';
    function linha(nome, campo, tot) {
      var s = '<tr><td class="r">' + nome + '</td>';
      for (var d = 1; d <= nd; d++) {
        var v = val(D, campo, d), c = val(D, 'cama', d), o = val(D, 'doente', d), cl = [];
        if (v == null) cl.push('v');
        if (campo === 'doente' && v != null && c != null && o > c) cl.push('x');
        if (campo === 'cama' && v != null && L != null && v !== L) cl.push('lt');
        if (pend[caminho(estado.ym, slug, campo + '/' + d)]) cl.push('pend');
        s += '<td><input data-k="' + campo + '/' + d + '" inputmode="numeric" autocomplete="off" aria-label="' + nome + ' dia ' + d + '" value="' + (v == null ? '' : v) + '" class="' + cl.join(' ') + '"></td>';
      }
      return s + '<td class="tot">' + tot + '</td></tr>';
    }
    h += linha('Dias de cama', 'cama', C.cama == null ? '—' : C.cama);
    h += linha('Dias de doente', 'doente', C.doente == null ? '—' : C.doente);
    h += '<tr><td class="r">Ocupação %</td>';
    for (d = 1; d <= nd; d++) {
      var c = val(D, 'cama', d), o = val(D, 'doente', d);
      if (!c || o == null) { h += '<td><span class="pc n">·</span></td>'; continue; }
      var x = Math.round(o / c * 100);
      h += '<td><span class="pc' + (x > 100 ? ' x' : x < 70 ? ' b' : '') + '">' + x + '</span></td>';
    }
    h += '<td class="tot">' + pct(C.taxa) + '</td></tr>';
    t.innerHTML = h;
    var acima = [];
    for (d = 1; d <= nd; d++) { var a = val(D, 'cama', d), b = val(D, 'doente', d); if (a != null && b != null && b > a) acima.push(d); }
    var av = '';
    if (acima.length) av += '<div class="av mau"><b>Mais doentes do que camas</b> no' + (acima.length > 1 ? 's dias ' : ' dia ') + resumirDias(acima) + ' — confirme na folha.</div>';
    if (estado.movPronto) { var K = comparar(slug); if (K.dif.length) av += '<div class="av am"><b>Diferente do Movimento Hospitalar</b> no' + (K.dif.length > 1 ? 's dias ' : ' dia ') + resumirDias(K.dif) + '.</div>'; }
    $('avisos').innerHTML = av;
    $('copiarMov').hidden = !(estado.movPronto && comparar(slug).temMov);
  }

  function desenharPeriodo() {
    var P = contasPeriodo(estado.serv);
    $('perTit').textContent = nomeServ(estado.serv) + ' — ' + tituloPeriodo();
    var h = '<tr><th>Mês</th><th>Lotação</th><th>Dias</th><th>Dias de cama</th><th>Dias de doente</th><th>Ocupação</th><th>Doentes por dia</th><th>Estado</th></tr>';
    P.meses.forEach(function (m) {
      var C = m.C, lim = limite(m.ym), est;
      if (lim === 0) est = '<span class="chip nd">—</span>';
      else if (!C.falta.length) est = '<span class="chip ok">Completo</span>';
      else if (C.preenchidos) est = '<span class="chip par">Faltam ' + C.falta.length + '</span>';
      else est = '<span class="chip nd">Sem dados</span>';
      h += '<tr class="l" data-ym="' + m.ym + '"><td><b style="text-transform:capitalize">' + nomeMes(m.ym) + '</b></td><td>' + (C.lotacao == null ? '—' : C.lotacao) + '</td><td>' + C.preenchidos + '/' + C.dias + '</td><td>' + (C.cama == null ? '—' : C.cama) + '</td><td>' + (C.doente == null ? '—' : C.doente) + '</td><td><b>' + pct(C.taxa) + '</b></td><td>' + f1(C.media) + '</td><td>' + est + '</td></tr>';
    });
    h += '<tr class="tot"><td>TOTAL DO PERÍODO</td><td>' + (P.lotacao == null ? '—' : P.lotacao) + '</td><td>' + P.preenchidos + '/' + P.dias + '</td><td>' + (P.cama == null ? '—' : P.cama) + '</td><td>' + (P.doente == null ? '—' : P.doente) + '</td><td>' + pct(P.taxa) + '</td><td>' + f1(P.media) + '</td><td></td></tr>';
    $('perTab').innerHTML = h;
  }

  // Gráfico de linha (SVG simples, sem bibliotecas).
  function linhaSVG(pontos, rotulos) {
    var W = 760, H = 230, L = 40, R = 12, T = 12, B = 28, n = rotulos.length;
    var maxV = Math.max(120, Math.ceil(Math.max.apply(null, pontos.filter(function (p) { return p != null; }).concat([0])) / 10) * 10 + 10);
    function x(i) { return L + (n > 1 ? i * (W - L - R) / (n - 1) : (W - L - R) / 2); }
    function y(v) { return T + (1 - v / maxV) * (H - T - B); }
    var g = '';
    [0, 50, 100].forEach(function (v) { g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="#E3E8F0"/><text x="' + (L - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end" font-size="11" fill="#94A3B8">' + v + '%</text>'; });
    g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(85) + '" y2="' + y(85) + '" stroke="#10B981" stroke-dasharray="5 4"/>';
    var seg = [], cur = [];
    pontos.forEach(function (v, i) { if (v == null) { if (cur.length) seg.push(cur); cur = []; } else cur.push([x(i), y(v)]); });
    if (cur.length) seg.push(cur);
    seg.forEach(function (s) {
      if (s.length > 1) g += '<path d="M' + s.map(function (p) { return p.join(','); }).join(' L') + ' L' + s[s.length - 1][0] + ',' + y(0) + ' L' + s[0][0] + ',' + y(0) + 'Z" fill="rgba(26,86,219,.10)"/>';
      g += '<polyline points="' + s.map(function (p) { return p.join(','); }).join(' ') + '" fill="none" stroke="#1A56DB" stroke-width="2.5" stroke-linejoin="round"/>';
    });
    pontos.forEach(function (v, i) { if (v != null) g += '<circle cx="' + x(i) + '" cy="' + y(v) + '" r="3.8" fill="' + (v > 100 ? '#DC2626' : '#1A56DB') + '"><title>' + rotulos[i] + ': ' + f1(v) + '%</title></circle>'; });
    var passo = n > 16 ? 2 : 1;
    rotulos.forEach(function (r, i) { if (i % passo === 0 || i === n - 1) g += '<text x="' + x(i) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="11" fill="#94A3B8">' + r + '</text>'; });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Taxa de ocupação">' + g + '</svg>';
  }
  function desenharGrafico() {
    var pontos = [], rot = [];
    if (estado.per === 'mes') {
      $('g1Tit').textContent = 'Ocupação por dia — ' + nomeServ(estado.serv);
      var D = dadosServ(estado.serv), nd = FD.diasNoMes(estado.ym);
      for (var d = 1; d <= nd; d++) { var c = val(D, 'cama', d), o = val(D, 'doente', d); pontos.push(c && o != null ? o / c * 100 : null); rot.push(d); }
    } else {
      $('g1Tit').textContent = 'Ocupação por mês — ' + nomeServ(estado.serv);
      contasPeriodo(estado.serv).meses.forEach(function (m) { pontos.push(m.C.pc ? m.C.pd / m.C.pc * 100 : null); rot.push(FD.MESES[+m.ym.slice(5) - 1].slice(0, 3)); });
    }
    $('graf').innerHTML = pontos.some(function (p) { return p != null; }) ? linhaSVG(pontos, rot) : '<div class="vazio">Ainda sem dias com os dois números registados.</div>';
  }
  function desenharBarras() {
    var l = SERVICOS.map(function (s) { return [s, contas(s[0]).taxa]; }).filter(function (x) { return x[1] != null; }).sort(function (a, b) { return b[1] - a[1]; });
    $('barras').innerHTML = l.length ? l.map(function (x) {
      return '<div class="ln" data-s="' + x[0][0] + '"><span>' + esc(x[0][1]) + '</span><em><i style="width:' + Math.min(100, x[1]) + '%;background:' + corTaxa(x[1]) + '"></i></em><b>' + pct(x[1]) + '</b></div>';
    }).join('') : '<div class="vazio">Sem dados neste ' + (estado.per === 'mes' ? 'mês' : 'período') + '.</div>';
  }
  function desenharResumo() {
    var mes = estado.per === 'mes';
    $('resTit').textContent = 'Resumo ' + (mes ? 'do mês' : 'do período') + ' — todos os serviços';
    var h = '<tr><th>Serviço</th><th>Lotação</th><th>Dias</th><th>Dias de cama</th><th>Dias de doente</th><th>Ocupação</th>' + (mes ? '<th>Movimento</th>' : '') + '<th>Estado</th></tr>';
    var TL = 0, TC = 0, TD = 0, PC = 0, PD = 0;
    SERVICOS.forEach(function (s) {
      var K = contas(s[0]);
      if (K.lotacao != null) TL += K.lotacao; if (K.cama != null) TC += K.cama; if (K.doente != null) TD += K.doente; PC += K.pc; PD += K.pd;
      var est = (mes && limite(estado.ym) === 0) ? '<span class="chip nd">—</span>' : !K.faltaN && K.preenchidos ? '<span class="chip ok">Completo</span>' : K.preenchidos ? '<span class="chip par">Faltam ' + K.faltaN + '</span>' : '<span class="chip nd">Sem dados</span>';
      var mv = '';
      if (mes) {
        if (!estado.movPronto) mv = '<td>…</td>';
        else { var Q = comparar(s[0]); mv = '<td>' + (Q.dif.length ? '<span class="chip dif">' + Q.dif.length + ' dia' + (Q.dif.length > 1 ? 's' : '') + ' diferente' + (Q.dif.length > 1 ? 's' : '') + '</span>' : Q.comparados ? '<span class="chip ok">igual</span>' : '<span class="chip nd">—</span>') + '</td>'; }
      }
      h += '<tr class="l' + (s[0] === estado.serv ? ' on' : '') + '" data-s="' + s[0] + '"><td><b>' + esc(s[1]) + '</b></td><td>' + (K.lotacao == null ? '—' : K.lotacao) + '</td><td>' + K.preenchidos + '/' + K.dias + '</td><td>' + (K.cama == null ? '—' : K.cama) + '</td><td>' + (K.doente == null ? '—' : K.doente) + '</td><td><b>' + pct(K.taxa) + '</b></td>' + mv + '<td>' + est + '</td></tr>';
    });
    h += '<tr class="tot"><td>TOTAL DO HOSPITAL</td><td>' + (TL || '—') + '</td><td></td><td>' + (TC || '—') + '</td><td>' + (TD || '—') + '</td><td>' + (PC ? pct(PD / PC * 100) : '—') + '</td>' + (mes ? '<td></td>' : '') + '<td></td></tr>';
    $('res').innerHTML = h;
  }
  function mostrarEstado() {
    var n = Object.keys(pend).filter(function (k) { return !/\/(em|por)$/.test(k); }).length;
    $('estado').textContent = n ? (navigator.onLine === false ? 'Sem internet — ' + n + ' alteração(ões) guardada(s) neste computador; seguem quando a ligação voltar.' : 'A gravar…')
      : (estado.carregado ? 'Tudo gravado.' : 'A carregar…');
  }

  // ── registo ──
  function gravarValor(campo, d, v) {
    var D = dadosServ(estado.serv);
    if (val(D, campo, d) === v) return false;
    var c = {}; c[campo + '/' + d] = v; guardar(estado.serv, c); return true;
  }
  function gravarDoInput(el, campo, d) {
    var v = lerNum(el.value);
    if (v === undefined) { el.classList.add('erro'); toast('Escreva só números inteiros.'); return false; }
    el.classList.remove('erro');
    gravarValor(campo, d, v); return true;
  }
  function gravarRegisto() { var a = gravarDoInput($('rC'), 'cama', estado.dia), b = gravarDoInput($('rD'), 'doente', estado.dia); return a && b; }
  function irDia(d) { estado.diaAuto = false; var nd = FD.diasNoMes(estado.ym); estado.dia = Math.max(1, Math.min(nd, d)); desenhar(); }
  function abrirMes(ym) { estado.ym = ym; estado.dia = null; estado.diaAuto = true; gravarLS('zeloDiasCamaMes', ym); escutar(); }
  function abrirServ(slug) { estado.serv = slug; estado.dia = null; estado.diaAuto = true; gravarLS('zeloDiasCamaServ', slug); desenhar(); }

  var tmpStep = null;
  document.addEventListener('click', function (e) {
    var b = e.target.closest('button,[data-s],[data-ym],th[data-dia]');
    if (!b) return;
    if (b.dataset.st) { // − / +
      var inp = $(b.dataset.st), campo = b.dataset.st === 'rC' ? 'cama' : 'doente', D = dadosServ(estado.serv), cur = lerNum(inp.value);
      if (cur == null || cur === undefined) cur = campo === 'cama' ? (num(D.lotacao) != null ? num(D.lotacao) - Number(b.dataset.n) : 0) : (estado.dia > 1 && val(D, 'doente', estado.dia - 1) != null ? val(D, 'doente', estado.dia - 1) - Number(b.dataset.n) : 0);
      inp.value = Math.max(0, cur + Number(b.dataset.n));
      clearTimeout(tmpStep); var dia = estado.dia;
      tmpStep = setTimeout(function () { if (dia === estado.dia) gravarDoInput(inp, campo, dia); }, 600);
      return;
    }
    if (b.dataset.por) { var id = b.dataset.por === 'cama' ? 'rC' : 'rD'; $(id).value = b.dataset.v; gravarValor(b.dataset.por, estado.dia, Number(b.dataset.v)); return; }
    if (b.dataset.dia) { clearTimeout(tmpStep); irDia(+b.dataset.dia); return; }
    if (b.closest('#servs') && b.dataset.s) { abrirServ(b.dataset.s); return; }
    if (b.closest('#barras,#res') && b.dataset.s) { abrirServ(b.dataset.s); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (b.dataset.ym) { estado.per = 'mes'; abrirMes(b.dataset.ym); return; }
    if (b.dataset.p) { estado.per = b.dataset.p; if (estado.per !== 'mes') carregarPeriodo(); desenhar(); return; }
  });
  $('rAnt').addEventListener('click', function () { clearTimeout(tmpStep); gravarRegisto(); irDia(estado.dia - 1); });
  $('rSeg').addEventListener('click', function () {
    clearTimeout(tmpStep);
    if (!gravarRegisto()) return;
    if (estado.dia < FD.diasNoMes(estado.ym)) { irDia(estado.dia + 1); $('rC').focus(); $('rC').select(); } else toast('Mês gravado.');
  });
  $('selServ').addEventListener('change', function () { abrirServ(this.value); });
  function mudar(n) {
    if (estado.per === 'mes') { abrirMes(somarMes(estado.ym, n)); return; }
    var passo = estado.per === 'tri' ? 3 : estado.per === 'sem' ? 6 : 12;
    abrirMes(somarMes(mesesPeriodo()[0], n * passo)); carregarPeriodo();
  }
  $('mAnt').addEventListener('click', function () { mudar(-1); });
  $('mSeg').addEventListener('click', function () { mudar(1); });
  $('btHoje').addEventListener('click', function () {
    estado.per = 'mes';
    if (estado.ym !== YM_HOJE) abrirMes(YM_HOJE);
    irDia(agora.getDate());
    $('cRegisto').scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(function () { $('rC').focus(); $('rC').select(); }, 350);
  });

  document.addEventListener('change', function (e) {
    var el = e.target;
    if (el.id === 'rC' || el.id === 'rD') { clearTimeout(tmpStep); if (+el.dataset.dia === estado.dia) gravarDoInput(el, el.id === 'rC' ? 'cama' : 'doente', estado.dia); return; }
    if (el.dataset && el.dataset.k) { var p = el.dataset.k.split('/'); gravarDoInput(el, p[0], +p[1]); return; }
    if (el.id === 'lot') { var v = lerNum(el.value); if (v === undefined) { toast('Escreva só números inteiros.'); return; } if (v !== num(dadosServ(estado.serv).lotacao)) guardar(estado.serv, { lotacao: v }); return; }
    if (el.dataset && el.dataset.campo) { var c = {}; c[el.dataset.campo] = el.value.trim() || null; guardar(estado.serv, c); }
  });
  document.addEventListener('keydown', function (e) {
    var el = e.target; if (e.key !== 'Enter') return;
    if (el.id === 'rC') { e.preventDefault(); gravarDoInput(el, 'cama', estado.dia); $('rD').focus(); $('rD').select(); return; }
    if (el.id === 'rD') { e.preventDefault(); $('rSeg').click(); return; }
    if (el.id === 'lot') { e.preventDefault(); el.blur(); return; }
    if (!el.dataset || !el.dataset.k) return;
    e.preventDefault();
    var p = el.dataset.k.split('/'); gravarDoInput(el, p[0], +p[1]);
    var nd = FD.diasNoMes(estado.ym), prox = +p[1] < nd ? p[0] + '/' + (+p[1] + 1) : (p[0] === 'cama' ? 'doente/1' : null);
    var nx = prox && document.querySelector('[data-k="' + prox + '"]'); if (nx) { nx.focus(); nx.select(); } else el.blur();
  });
  document.addEventListener('focusin', function (e) { var k = e.target.dataset && e.target.dataset.k; if (k) { var d = +k.split('/')[1]; if (d !== estado.dia) { estado.dia = d; estado.diaAuto = false; desenharDias(); desenharRegisto(); Array.prototype.forEach.call(document.querySelectorAll('#mapa th[data-dia]'), function (t) { t.classList.toggle('on', +t.dataset.dia === d); }); } } });
  document.addEventListener('focusout', function (e) { if (e.target.dataset && e.target.dataset.k) setTimeout(function () { if (!$('mapa').contains(document.activeElement)) desenhar(); }, 60); });

  $('encher').addEventListener('click', function () {
    var D = dadosServ(estado.serv), L = num(D.lotacao);
    if (L == null) { toast('Escreva primeiro o número de camas (lotação), na faixa azul.'); $('lot').focus(); return; }
    var c = {}, n = 0; for (var i = 1; i <= FD.diasNoMes(estado.ym); i++) if (val(D, 'cama', i) == null) { c['cama/' + i] = L; n++; }
    if (!n) { toast('Todos os dias já têm dias de cama.'); return; }
    if (!confirm('Escrever ' + L + ' dias de cama nos ' + n + ' dias vazios? Os dias já preenchidos não mudam.')) return;
    guardar(estado.serv, c); toast(n + ' dias preenchidos com a lotação.');
  });
  $('copiarMov').addEventListener('click', function () {
    var slug = estado.serv, D = dadosServ(slug), c = {}, n = 0;
    for (var i = 1; i <= FD.diasNoMes(estado.ym); i++) {
      var mc = movVal(slug, 'cama', i), md = movVal(slug, 'doente', i);
      if (mc != null && val(D, 'cama', i) == null) { c['cama/' + i] = mc; n++; }
      if (md != null && val(D, 'doente', i) == null) { c['doente/' + i] = md; n++; }
    }
    if (!n) { toast('Não há casas vazias que o Movimento possa preencher.'); return; }
    if (!confirm('Copiar ' + n + ' valor(es) do Movimento Hospitalar para as casas vazias? O que já está escrito não muda.')) return;
    guardar(slug, c); toast(n + ' valor(es) copiados do Movimento.');
  });

  // ── PDF ──
  function semPDF() { if (window.jspdf && window.jspdf.jsPDF && FD) return false; toast('A biblioteca de PDF ainda não carregou. Tente de novo dentro de alguns segundos.'); return true; }
  function linhasPeriodo() {
    return SERVICOS.map(function (s) { var P = contasPeriodo(s[0]); return { nome: s[1], lotacao: P.lotacao, cama: P.cama, doente: P.doente, taxa: P.taxa, pc: P.pc, pd: P.pd, preenchidos: P.preenchidos, dias: P.dias }; });
  }
  // Movimento Hospitalar no formato {cama:{dia:n}, doente:{dia:n}} (só o mês aberto).
  function movDoServ(slug) {
    if (!estado.movPronto) return null;
    var nd = FD.diasNoMes(estado.ym), c = {}, o = {}, tem = false;
    for (var d = 1; d <= nd; d++) { var a = movVal(slug, 'cama', d), b = movVal(slug, 'doente', d); if (a != null) { c[d] = a; tem = true; } if (b != null) { o[d] = b; tem = true; } }
    return tem ? { cama: c, doente: o } : null;
  }
  // Meses do relatório: o mês aberto, ou os meses do período já começados.
  function mesesRelatorio() { return estado.per === 'mes' ? [estado.ym] : mesesPeriodo().filter(function (ym) { return ym <= YM_HOJE; }); }
  function nomeFicheiro(t) { return t.replace(/[^\wÀ-ú]+/g, '_').replace(/^_|_$/g, ''); }
  var ICO_DOC = '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8M8 9h2"/></svg>';
  var ICO_GRADE = '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>';
  var ICO_FOLHA = '<svg viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>';
  function opcoesPDF() {
    var mes = estado.per === 'mes', n = esc(nomeServ(estado.serv)), quando = mes ? nomeMes(estado.ym) : tituloPeriodo(), h = '';
    h += '<button type="button" data-pdf="det-todos">' + ICO_GRADE + '<span><b>Detalhado dia a dia — todos os serviços</b><small>' + (mes ? 'Grelha diária do hospital + uma página por serviço com cada dia (' + quando + ')' : 'Grelha diária do hospital, um mês por página (' + quando + ')') + '</small></span></button>';
    h += '<button type="button" data-pdf="det-serv">' + ICO_DOC + '<span><b>Detalhado dia a dia — ' + n + '</b><small>Cada dia numa linha: cama, doente, ocupação, camas livres e observações' + (mes ? '' : ' (um mês por página)') + '</small></span></button>';
    h += '<hr>';
    if (mes) {
      h += '<button type="button" data-pdf="folhas">' + ICO_FOLHA + '<span><b>Folhas de recolha preenchidas</b><small>Igual ao papel, todos os serviços, com o resumo do mês</small></span></button>';
      h += '<button type="button" data-pdf="folha-serv">' + ICO_FOLHA + '<span><b>Folha de recolha — ' + n + '</b><small>Igual ao papel, só este serviço</small></span></button>';
    } else {
      h += '<button type="button" data-pdf="resumo">' + ICO_DOC + '<span><b>Resumo do período</b><small>Totais de cada serviço e do hospital (' + quando + ')</small></span></button>';
    }
    return h;
  }
  function fecharMenu() { $('pdfMenu').hidden = true; $('btPdf').setAttribute('aria-expanded', 'false'); }
  $('btPdf').addEventListener('click', function (e) {
    e.stopPropagation();
    var m = $('pdfMenu');
    if (!m.hidden) { fecharMenu(); return; }
    m.innerHTML = opcoesPDF(); m.hidden = false; this.setAttribute('aria-expanded', 'true');
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.pdfm')) fecharMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fecharMenu(); });
  $('pdfMenu').addEventListener('click', function (e) {
    var b = e.target.closest('[data-pdf]'); if (!b) return;
    fecharMenu();
    if (semPDF()) return;
    var tipo = b.dataset.pdf, mes = estado.per === 'mes', slug = estado.serv, n = nomeServ(slug);
    var quando = mes ? estado.ym : nomeFicheiro(tituloPeriodo());
    try {
      if (tipo === 'det-todos' || tipo === 'det-serv') {
        var meses = mesesRelatorio().map(function (ym) {
          var dados = dadosDoMes(ym);
          var lista = (tipo === 'det-serv' ? SERVICOS.filter(function (s) { return s[0] === slug; }) : SERVICOS).map(function (s) {
            return { nome: s[1], dados: dados[s[0]] || {}, mov: ym === estado.ym ? movDoServ(s[0]) : null };
          });
          return { ym: ym, servicos: lista };
        });
        var op = tipo === 'det-serv' ? { grelha: false } : (mes ? { soComDados: true } : { fichas: false });
        FD.detalhado(meses, op).save('Dias_Cama_Detalhado_' + (tipo === 'det-serv' ? nomeFicheiro(n) + '_' : 'Todos_') + quando + '.pdf');
      } else if (tipo === 'folhas') {
        var lista2 = SERVICOS.map(function (s) { return { nome: s[1], dados: dadosServ(s[0]) }; });
        var d = FD.pdf(lista2, estado.ym); FD.resumo(d, lista2, estado.ym);
        d.save('Dias_Cama_Folhas_' + estado.ym + '.pdf');
      } else if (tipo === 'folha-serv') {
        FD.pdf([{ nome: n, dados: dadosServ(slug) }], estado.ym).save('Dias_Cama_Folha_' + nomeFicheiro(n) + '_' + estado.ym + '.pdf');
      } else if (tipo === 'resumo') {
        FD.resumoPeriodo(linhasPeriodo(), tituloPeriodo()).save('Dias_Cama_Resumo_' + quando + '.pdf');
      }
      toast('PDF criado.');
    } catch (err) { console.error(err); toast('Não foi possível criar o PDF.'); }
  });

  // ── Excel (a biblioteca só carrega quando se carrega no botão) ──
  function carregarXLSX() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    return new Promise(function (ok, falha) {
      var s = document.createElement('script'); s.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
      s.onload = function () { window.XLSX ? ok(window.XLSX) : falha(); }; s.onerror = falha; document.head.appendChild(s);
    });
  }
  $('btXls').addEventListener('click', function () {
    var bt = this; bt.disabled = true;
    carregarXLSX().then(function (X) {
      var wb = X.utils.book_new(), mes = estado.per === 'mes';
      var res = [['Serviço', 'Lotação', 'Dias registados', 'Dias de cama', 'Dias de doente', 'Taxa de ocupação (%)']], TL = 0, TC = 0, TD = 0, PC = 0, PD = 0;
      SERVICOS.forEach(function (s) {
        var K = contas(s[0]);
        if (K.lotacao != null) TL += K.lotacao; if (K.cama != null) TC += K.cama; if (K.doente != null) TD += K.doente; PC += K.pc; PD += K.pd;
        res.push([s[1], K.lotacao, K.preenchidos + '/' + K.dias, K.cama, K.doente, K.taxa == null ? null : Math.round(K.taxa * 10) / 10]);
      });
      res.push(['TOTAL DO HOSPITAL', TL || null, '', TC || null, TD || null, PC ? Math.round(PD / PC * 1000) / 10 : null]);
      var titulo = mes ? nomeMes(estado.ym) : tituloPeriodo();
      var ws = X.utils.aoa_to_sheet([['Dias de Cama e Dias de Doente — ' + titulo], []].concat(res));
      ws['!cols'] = [{ wch: 24 }, { wch: 9 }, { wch: 15 }, { wch: 13 }, { wch: 15 }, { wch: 20 }];
      X.utils.book_append_sheet(wb, ws, 'Resumo');
      if (mes) {
        var p = estado.ym.split('-'), nd = FD.diasNoMes(estado.ym);
        SERVICOS.forEach(function (s) {
          var D = dadosServ(s[0]), linhas = [['Dia', 'Dia da semana', 'Dias de cama', 'Dias de doente', 'Ocupação (%)']];
          for (var d = 1; d <= nd; d++) { var c = val(D, 'cama', d), o = val(D, 'doente', d); linhas.push([d, SEM_L[new Date(+p[0], +p[1] - 1, d).getDay()], c, o, c && o != null ? Math.round(o / c * 1000) / 10 : null]); }
          var K = contasMes(D, estado.ym);
          linhas.push(['Total', '', K.cama, K.doente, K.taxa == null ? null : Math.round(K.taxa * 10) / 10]);
          var w = X.utils.aoa_to_sheet([[s[1] + ' — ' + nomeMes(estado.ym) + (K.lotacao != null ? ' · lotação ' + K.lotacao : '')], []].concat(linhas));
          w['!cols'] = [{ wch: 7 }, { wch: 15 }, { wch: 13 }, { wch: 15 }, { wch: 13 }];
          X.utils.book_append_sheet(wb, w, s[1].slice(0, 31));
        });
      } else {
        var lin = [['Serviço', 'Mês', 'Lotação', 'Dias registados', 'Dias de cama', 'Dias de doente', 'Taxa de ocupação (%)']];
        SERVICOS.forEach(function (s) { contasPeriodo(s[0]).meses.forEach(function (m) { var C = m.C; lin.push([s[1], nomeMes(m.ym), C.lotacao, C.preenchidos + '/' + C.dias, C.cama, C.doente, C.taxa == null ? null : Math.round(C.taxa * 10) / 10]); }); });
        var w2 = X.utils.aoa_to_sheet(lin); w2['!cols'] = [{ wch: 24 }, { wch: 16 }, { wch: 9 }, { wch: 15 }, { wch: 13 }, { wch: 15 }, { wch: 20 }];
        X.utils.book_append_sheet(wb, w2, 'Por mês');
      }
      X.writeFile(wb, 'Dias_Cama_' + (mes ? estado.ym : titulo.replace(/[^\wÀ-ú]+/g, '_')) + '.xlsx');
    }).catch(function () { toast('Não foi possível carregar o Excel. Verifique a internet e tente de novo.'); })
      .then(function () { bt.disabled = false; });
  });

  window.__diasCama = { estado: estado, dadosServ: dadosServ, pend: function () { return pend; }, contas: contas };

  var feito = false;
  function primeira() { if (feito) return; feito = true; (function v(n) { if (window.__fbReady && window.__fbListen) { escutar(); enviar(); } else if (n < 40) setTimeout(function () { v(n + 1); }, 250); else escutar(); })(0); }
  window.addEventListener('zelo-gate-ready', primeira);
  setTimeout(primeira, 1500);
  desenhar();
})();
