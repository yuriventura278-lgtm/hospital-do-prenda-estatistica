// ── ZELO — Registo de VIH (Laboratório e Hemoterapia) ──
// Motor comum às páginas registo_vih_laboratorio.html e
// registo_vih_hemoterapia.html. Os campos são os do "Registo VIH · Geral"
// (Serviço de Estatística): Formação Sanitária, Fonte, Testados / Positivos /
// Indeterminados por faixa etária e sexo (F/M) e Observações — aqui com
// registo diário, como no Laboratório, e relatórios semanal, mensal,
// trimestral, semestral e anual (com PDF).
//
// Dados: registos_sistemas_locais/<mod>/<AAAA-MM-DD> = {savedAt, snapshot,
// criadoPor}. Nada é apagado: não há botão de apagar, e ao gravar os
// campos alterados noutro computador entretanto são mesclados (ganha só o
// que cada um mudou). Poupança do Firebase gratuito: o histórico é lido com
// zeloLerHistorico (a 1.ª vez tudo, depois só os últimos 60 dias) e fica
// guardado neste computador; só o dia aberto fica "a ouvir" alterações.
(function () {
  'use strict';
  var C = window.VIH_CFG || {};
  var MOD = C.mod;
  var FB = 'registos_sistemas_locais/' + MOD;
  var FAIXAS = ['<1 ano', '1 - 4 anos', '5 - 9 anos', '10 - 14 anos', '15 - 19 anos', '20 - 24 anos', '25 - 29 anos',
    '30 - 34 anos', '35 - 39 anos', '40 - 44 anos', '45 - 49 anos', '50 - 54 anos', '55 - 59 anos', '60 - 64 anos', '65 ou mais anos'];
  var IND = [
    { id: 'testados', nome: 'Testados', cor: '#0e7490', g: 'gT' },
    { id: 'positivos', nome: 'Positivos', cor: '#b91c1c', g: 'gP' },
    { id: 'indeterminados', nome: 'Indeterminados', cor: '#6d28d9', g: 'gI' }
  ];
  var MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  var LS_DIAS = 'zeloVih_' + MOD + '_dias';
  var LS_RASC = 'zeloVih_' + MOD + '_rasc_';

  // ── utilitários ──
  function $(id) { return document.getElementById(id); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function hoje() { return iso(new Date()); }
  function dt(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function fmtD(s) { try { return dt(s).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch (e) { return s; } }
  function fmtDL(s) { try { return dt(s).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return s; } }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function clone(o) { return o ? JSON.parse(JSON.stringify(o)) : o; }
  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function pct(a, b) { return b ? (a * 100 / b).toFixed(1).replace('.', ',') + '%' : '—'; }
  function toast(m) { var t = $('toast'); if (!t) return; t.textContent = m; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('show'); }, 2600); }
  var ICON = {
    dash: '<path d="M3 12h4v9H3zM10 6h4v15h-4zM17 3h4v18h-4z"/>',
    reg: '<path d="M9 2v6.4a2 2 0 0 1-.3 1L3.6 18a2 2 0 0 0 1.7 3h13.4a2 2 0 0 0 1.7-3l-5.1-8.6A2 2 0 0 1 15 8.4V2"/><path d="M7 2h10M6.5 14h11"/>',
    sem: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M7 14h10"/>',
    mes: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3M8 12h8M8 16h5"/>',
    tri: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
    ano: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
    hist: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
    pdf: '<path d="M12 3v12"/><polyline points="7 10 12 15 17 10"/><path d="M4 21h16"/>',
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M9 22V12h6v10"/>',
    back: '<polyline points="15 18 9 12 15 6"/>',
    ref: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M8 16H3v5"/>',
    json: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M12 18v-6M9 15l3 3 3-3"/>',
    gota: '<path d="M12 2s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"/>',
    play: '<polygon points="6 4 20 12 6 20 6 4"/>'
  };
  function ic(n) { return '<span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (ICON[n] || '') + '</svg></span>'; }

  // ── dados ──
  function vazio() { return { formacao: 'Hospital do Prenda', fonte: C.fonte || '', obs: '', dados: { testados: {}, positivos: {}, indeterminados: {} } }; }
  function val(s, ind, i, sx) { var v = s && s.dados && s.dados[ind] ? s.dados[ind][i + '_' + sx] : 0; return +v || 0; }
  function setVal(s, ind, i, sx, v) { s.dados = s.dados || {}; s.dados[ind] = s.dados[ind] || {}; if (v) s.dados[ind][i + '_' + sx] = v; else delete s.dados[ind][i + '_' + sx]; }
  function soma(s, ind, sx) { var t = 0; FAIXAS.forEach(function (_, i) { if (!sx || sx === 'f') t += val(s, ind, i, 'f'); if (!sx || sx === 'm') t += val(s, ind, i, 'm'); }); return t; }
  function agregar(lista) {
    var a = vazio(); a.dias = lista.length;
    lista.forEach(function (s) { IND.forEach(function (I) { FAIXAS.forEach(function (_, i) { ['f', 'm'].forEach(function (sx) { var v = val(s, I.id, i, sx); if (v) setVal(a, I.id, i, sx, val(a, I.id, i, sx) + v); }); }); }); });
    return a;
  }
  // Ganha o que cada lado mudou em relação à base comum (nada se perde).
  function mesclar(base, local, remoto) {
    var r = clone(remoto) || vazio(), b = base || vazio();
    ['formacao', 'fonte', 'obs'].forEach(function (k) { if ((local[k] || '') !== (b[k] || '')) r[k] = local[k]; });
    IND.forEach(function (I) { FAIXAS.forEach(function (_, i) { ['f', 'm'].forEach(function (sx) { var lv = val(local, I.id, i, sx); if (lv !== val(b, I.id, i, sx)) setVal(r, I.id, i, sx, lv); }); }); });
    return r;
  }
  function inconsistencias(s) {
    var out = [];
    FAIXAS.forEach(function (nome, i) { ['f', 'm'].forEach(function (sx) {
      var t = val(s, 'testados', i, sx), p = val(s, 'positivos', i, sx), n = val(s, 'indeterminados', i, sx);
      if (p + n > t) out.push({ i: i, sx: sx, txt: nome + ' (' + (sx === 'f' ? 'F' : 'M') + '): positivos + indeterminados (' + (p + n) + ') > testados (' + t + ')' });
    }); });
    return out;
  }
  function dias() { return lsGet(LS_DIAS, {}); }
  function guardarCache(d, rec) { var t = dias(); t[d] = rec; lsSet(LS_DIAS, t); }
  function registosEntre(de, ate) {
    var t = dias(), out = [];
    Object.keys(t).sort().forEach(function (d) { if (d >= de && d <= ate && t[d] && t[d].snapshot) out.push({ data: d, s: t[d].snapshot, rec: t[d] }); });
    return out;
  }

  // ── estado do registo diário ──
  var data = hoje(), cur = vazio(), base = null, baseSavedAt = null, sujo = false, pararEscuta = null;

  function fbPronto() { return window.__fbReady && typeof window.__fbGet === 'function'; }
  function esperarFb(ms) {
    return new Promise(function (res) { var t0 = Date.now(); (function v() { if (fbPronto()) return res(true); if (Date.now() - t0 > (ms || 10000)) return res(false); setTimeout(v, 200); })(); });
  }

  function mostrarAutor(rec) {
    var w = $('last-saved-status');
    if (!w) return;
    if (rec && rec.criadoPor && rec.criadoPor.nome) {
      var d = new Date(rec.savedAt);
      $('last-saved-name').textContent = rec.criadoPor.nome;
      $('last-saved-time').textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + (iso(d) !== hoje() ? ' de ' + fmtD(iso(d)) : '');
      w.style.display = 'inline';
    } else w.style.display = 'none';
  }
  function estadoGravacao() {
    var e = $('saveStatus'); if (!e) return;
    e.classList.toggle('pend', sujo);
    e.innerHTML = sujo ? 'Dia <strong>' + fmtD(data) + '</strong> · <strong>alterações por guardar</strong> (ficam guardadas neste computador até carregar em Guardar)'
      : (baseSavedAt ? 'Dia <strong>' + fmtD(data) + '</strong> · guardado' : 'Dia <strong>' + fmtD(data) + '</strong> · ainda sem registo');
  }

  function renderRegisto() {
    $('vihFormacao').value = cur.formacao || '';
    $('vihFonte').value = cur.fonte || '';
    $('vihObs').value = cur.obs || '';
    $('vihDiaTxt').textContent = fmtDL(data);
    var html = '';
    IND.forEach(function (I) {
      html += '<div class="card vih-card" style="--k:' + I.cor + '"><div class="card-label">' + I.nome + '<span class="bdg" id="bdg-' + I.id + '">0</span></div>' +
        '<div class="v-thead"><span>Faixa etária</span><span class="f">Fem</span><span class="m">Masc</span><span>Total</span></div>';
      FAIXAS.forEach(function (nome, i) {
        html += '<div class="v-row" id="row-' + I.id + '-' + i + '"><div class="v-name">' + esc(nome) + '</div>' +
          ['f', 'm'].map(function (sx) { return '<div class="v-cell"><input class="' + sx + '" type="number" min="0" inputmode="numeric" placeholder="0" data-ind="' + I.id + '" data-i="' + i + '" data-sx="' + sx + '" aria-label="' + I.nome + ' ' + esc(nome) + ' ' + (sx === 'f' ? 'feminino' : 'masculino') + '"></div>'; }).join('') +
          '<div class="v-tot" id="tot-' + I.id + '-' + i + '">—</div></div>';
      });
      html += '<div class="v-grand"><span>Total</span><span id="gf-' + I.id + '">0</span><span id="gm-' + I.id + '">0</span><span id="gt-' + I.id + '">0</span></div></div>';
    });
    $('vihCards').innerHTML = html;
    preencherValores();
  }
  // Actualiza os valores sem recriar as caixas (não tira o cursor a quem escreve).
  function preencherValores() {
    var foco = document.activeElement;
    ['vihFormacao', 'vihFonte', 'vihObs'].forEach(function (id, k) { var el = $(id); var v = cur[['formacao', 'fonte', 'obs'][k]] || ''; if (el && el !== foco && el.value !== v) el.value = v; });
    document.querySelectorAll('#vihCards input[data-ind]').forEach(function (inp) {
      if (inp === foco) return;
      var v = val(cur, inp.dataset.ind, +inp.dataset.i, inp.dataset.sx);
      inp.value = v ? v : '';
    });
    totais();
  }
  function totais() {
    IND.forEach(function (I) {
      FAIXAS.forEach(function (_, i) { var t = val(cur, I.id, i, 'f') + val(cur, I.id, i, 'm'); var e = $('tot-' + I.id + '-' + i); if (e) e.textContent = t || '—'; });
      var f = soma(cur, I.id, 'f'), m = soma(cur, I.id, 'm');
      if ($('gf-' + I.id)) { $('gf-' + I.id).textContent = f; $('gm-' + I.id).textContent = m; $('gt-' + I.id).textContent = f + m; $('bdg-' + I.id).textContent = f + m; }
    });
    var T = soma(cur, 'testados'), P = soma(cur, 'positivos'), N = soma(cur, 'indeterminados');
    $('vihResumo').innerHTML = kpis([
      ['Testados', T, '#0e7490', 'F <b class="f">' + soma(cur, 'testados', 'f') + '</b> · M <b class="m">' + soma(cur, 'testados', 'm') + '</b>'],
      ['Positivos', P, '#b91c1c', 'F <b class="f">' + soma(cur, 'positivos', 'f') + '</b> · M <b class="m">' + soma(cur, 'positivos', 'm') + '</b>'],
      ['Indeterminados', N, '#6d28d9', 'F <b class="f">' + soma(cur, 'indeterminados', 'f') + '</b> · M <b class="m">' + soma(cur, 'indeterminados', 'm') + '</b>'],
      ['Taxa de positividade', pct(P, T), '#b45309', 'positivos ÷ testados'],
      ['Negativos', Math.max(0, T - P - N), '#0a7a4e', 'testados − positivos − indeterm.']
    ]);
    document.querySelectorAll('.v-row.alerta').forEach(function (r) { r.classList.remove('alerta'); });
    var inc = inconsistencias(cur);
    inc.forEach(function (x) { ['positivos', 'indeterminados'].forEach(function (id) { var r = $('row-' + id + '-' + x.i); if (r) r.classList.add('alerta'); }); });
    var av = $('vihAviso');
    av.classList.toggle('on', inc.length > 0);
    av.innerHTML = inc.length ? '<b>Verifique:</b> ' + inc.map(function (x) { return esc(x.txt); }).join('; ') + '.' : '';
  }
  function kpis(l) {
    return l.map(function (k) { return '<div class="kpi" style="--k:' + k[2] + '"><div class="kpi-label">' + k[0] + '</div><div class="kpi-val">' + k[1] + '</div>' + (k[3] ? '<div class="kpi-sub">' + k[3] + '</div>' : '') + '</div>'; }).join('');
  }
  function aoEscrever(e) {
    var t = e.target;
    if (t.dataset && t.dataset.ind) {
      var v = Math.max(0, parseInt(t.value, 10) || 0);
      setVal(cur, t.dataset.ind, +t.dataset.i, t.dataset.sx, v);
    } else if (t.id === 'vihFormacao') cur.formacao = t.value;
    else if (t.id === 'vihFonte') cur.fonte = t.value;
    else if (t.id === 'vihObs') cur.obs = t.value;
    else return;
    sujo = true;
    lsSet(LS_RASC + data, cur);
    totais(); estadoGravacao();
  }

  function abrirDia(d) {
    if (!d) return;
    data = d;
    if ($('data-registo').value !== d) $('data-registo').value = d;
    var rec = dias()[d];
    base = rec ? clone(rec.snapshot) : null;
    baseSavedAt = rec ? rec.savedAt : null;
    var rasc = lsGet(LS_RASC + d, null);
    if (rasc) { cur = rasc; sujo = true; }
    else { cur = base ? clone(base) : vazio(); sujo = false; }
    renderRegisto(); mostrarAutor(rec); estadoGravacao();
    escutar(d);
  }
  function escutar(d) {
    if (pararEscuta) { try { pararEscuta(); } catch (e) {} pararEscuta = null; }
    esperarFb().then(function (ok) {
      if (!ok || d !== data || typeof window.__fbListen !== 'function') return;
      pararEscuta = window.__fbListen(FB + '/' + d, function (remoto) {
        if (d !== data || !remoto || !remoto.snapshot) return;
        var local = dias()[d];
        if (!local || !local.savedAt || remoto.savedAt > local.savedAt) guardarCache(d, remoto);
        if (remoto.savedAt === baseSavedAt) return;
        if (baseSavedAt && remoto.savedAt < baseSavedAt) return;
        if (sujo) { cur = mesclar(base, cur, remoto.snapshot); lsSet(LS_RASC + d, cur); }
        else cur = clone(remoto.snapshot);
        base = clone(remoto.snapshot); baseSavedAt = remoto.savedAt;
        preencherValores(); mostrarAutor(remoto); estadoGravacao();
      });
    });
  }

  // ── guardar ──
  function pedirGuardar() {
    var T = soma(cur, 'testados'), P = soma(cur, 'positivos'), N = soma(cur, 'indeterminados'), inc = inconsistencias(cur);
    $('mdlSub').textContent = fmtDL(data);
    $('mdlCorpo').innerHTML =
      '<div class="ln"><span>Testados</span><b style="color:#0e7490">' + T + ' (F ' + soma(cur, 'testados', 'f') + ' / M ' + soma(cur, 'testados', 'm') + ')</b></div>' +
      '<div class="ln"><span>Positivos</span><b style="color:#b91c1c">' + P + ' (F ' + soma(cur, 'positivos', 'f') + ' / M ' + soma(cur, 'positivos', 'm') + ')</b></div>' +
      '<div class="ln"><span>Indeterminados</span><b style="color:#6d28d9">' + N + ' (F ' + soma(cur, 'indeterminados', 'f') + ' / M ' + soma(cur, 'indeterminados', 'm') + ')</b></div>' +
      '<div class="ln"><span>Taxa de positividade</span><b>' + pct(P, T) + '</b></div>' +
      (inc.length ? '<div class="aviso-cons on">' + inc.map(function (x) { return esc(x.txt); }).join('<br>') + '</div>' : '') +
      (!T ? '<div class="aviso-cons on">Nenhum utente testado neste dia.</div>' : '') +
      '<div style="margin-top:4px;padding:10px 12px;border-radius:8px;background:#FFFBEB;border:1px solid #FCD34D;color:#92400E;"><b>Os dados estão correctos?</b></div>';
    $('ovGuardar').classList.add('open');
  }
  async function gravar() {
    $('ovGuardar').classList.remove('open');
    var d = data;
    if (fbPronto()) {
      try {
        var remoto = await window.__fbGet(FB + '/' + d);
        if (remoto && remoto.snapshot && remoto.savedAt !== baseSavedAt) cur = mesclar(base, cur, remoto.snapshot);
      } catch (e) {}
    }
    var rec = { savedAt: new Date().toISOString(), snapshot: clone(cur), criadoPor: { nome: sessionStorage.getItem('zeloNome') || null, email: sessionStorage.getItem('zeloEmail') || null } };
    guardarCache(d, rec);
    lsDel(LS_RASC + d);
    base = clone(cur); baseSavedAt = rec.savedAt; sujo = false;
    preencherValores(); mostrarAutor(rec); estadoGravacao();
    try {
      if (typeof window.zeloQueueWrite === 'function') {
        var r = await window.zeloQueueWrite(FB + '/' + d, rec);
        toast(r && r.queued ? 'Guardado neste computador — será enviado quando houver ligação' : 'Registo guardado!');
      } else if (typeof window.__fbSet === 'function') { await window.__fbSet(FB + '/' + d, rec); toast('Registo guardado!'); }
      else toast('Guardado neste computador');
    } catch (e) { toast('Guardado neste computador — será enviado mais tarde'); }
    atualizarVisiveis();
  }

  // ── sincronizar histórico (poucos downloads) ──
  async function sincronizar() {
    var ok = await esperarFb(15000);
    if (!ok) return;
    try {
      var v = typeof window.zeloLerHistorico === 'function' ? await window.zeloLerHistorico(FB) : await window.__fbGet(FB);
      if (!v) return;
      var t = dias(), mudou = false;
      Object.keys(v).forEach(function (d) {
        var r = v[d];
        if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !r || !r.snapshot) return;
        if (!t[d] || !t[d].savedAt || (r.savedAt && r.savedAt > t[d].savedAt)) { t[d] = r; mudou = true; }
      });
      if (mudou) { lsSet(LS_DIAS, t); atualizarVisiveis(); if (!sujo) abrirDia(data); }
    } catch (e) { console.warn('VIH: histórico não lido', e); }
  }

  // ── períodos e relatórios ──
  function intervalo(tipo) {
    var y, de, ate, rot;
    if (tipo === 'semanal') {
      var b = dt($('rs-data').value || hoje()); var dow = (b.getDay() + 6) % 7;
      var s = new Date(b); s.setDate(b.getDate() - dow); var e = new Date(s); e.setDate(s.getDate() + 6);
      de = iso(s); ate = iso(e); rot = 'Semana de ' + fmtD(de) + ' a ' + fmtD(ate);
    } else if (tipo === 'mensal') {
      var m = $('rm-mes').value || hoje().slice(0, 7); var p = m.split('-');
      de = m + '-01'; ate = m + '-' + pad(new Date(+p[0], +p[1], 0).getDate()); rot = MESES[+p[1] - 1] + ' de ' + p[0];
    } else if (tipo === 'trimestral') {
      y = +$('rt-ano').value; var q = +$('rt-q').value;
      de = y + '-' + pad(q * 3 - 2) + '-01'; ate = y + '-' + pad(q * 3) + '-' + pad(new Date(y, q * 3, 0).getDate()); rot = q + '.º Trimestre de ' + y;
    } else if (tipo === 'semestral') {
      y = +$('rsm-ano').value; var h = +$('rsm-s').value;
      de = y + (h === 1 ? '-01-01' : '-07-01'); ate = y + (h === 1 ? '-06-30' : '-12-31'); rot = h + '.º Semestre de ' + y;
    } else {
      y = +$('ra-ano').value; de = y + '-01-01'; ate = y + '-12-31'; rot = 'Ano de ' + y;
    }
    return { de: de, ate: ate, rot: rot, porDia: tipo === 'semanal' || tipo === 'mensal' };
  }
  function dadosPeriodo(tipo) {
    var I = intervalo(tipo), regs = registosEntre(I.de, I.ate), a = agregar(regs.map(function (r) { return r.s; }));
    var linhas = [];
    if (I.porDia) regs.forEach(function (r) { linhas.push({ rot: fmtD(r.data), s: r.s }); });
    else {
      var y = +I.de.slice(0, 4), m0 = +I.de.slice(5, 7), m1 = +I.ate.slice(5, 7);
      for (var m = m0; m <= m1; m++) {
        var pre = y + '-' + pad(m), doMes = regs.filter(function (r) { return r.data.slice(0, 7) === pre; });
        linhas.push({ rot: MESES[m - 1], s: agregar(doMes.map(function (r) { return r.s; })), n: doMes.length });
      }
    }
    var ult = regs.length ? regs[regs.length - 1].s : null;
    return { I: I, regs: regs, a: a, linhas: linhas, formacao: ult ? ult.formacao : 'Hospital do Prenda', fonte: ult ? ult.fonte : (C.fonte || '') };
  }
  function tabelaFaixas(a) {
    var h = '<div class="r-wrap"><table class="r-table"><thead><tr><th class="l" rowspan="2" style="background:var(--accent);color:#fff">Faixa etária</th>' +
      IND.map(function (I) { return '<th colspan="3" class="' + I.g + '">' + I.nome + '</th>'; }).join('') + '<th rowspan="2" style="background:#b45309;color:#fff">Taxa pos.</th></tr><tr>' +
      IND.map(function () { return '<th>F</th><th>M</th><th>Total</th>'; }).join('') + '</tr></thead><tbody>';
    function cel(v, cls) { return '<td class="' + (v ? '' : 'zero ') + (cls || '') + '">' + v + '</td>'; }
    FAIXAS.forEach(function (nome, i) {
      h += '<tr><td class="l">' + esc(nome) + '</td>';
      IND.forEach(function (I) { var f = val(a, I.id, i, 'f'), m = val(a, I.id, i, 'm'); h += cel(f) + cel(m) + cel(f + m, 'tt'); });
      h += '<td>' + pct(val(a, 'positivos', i, 'f') + val(a, 'positivos', i, 'm'), val(a, 'testados', i, 'f') + val(a, 'testados', i, 'm')) + '</td></tr>';
    });
    h += '<tr class="tot"><td class="l">TOTAL</td>';
    IND.forEach(function (I) { var f = soma(a, I.id, 'f'), m = soma(a, I.id, 'm'); h += '<td>' + f + '</td><td>' + m + '</td><td>' + (f + m) + '</td>'; });
    return h + '<td>' + pct(soma(a, 'positivos'), soma(a, 'testados')) + '</td></tr></tbody></table></div>';
  }
  function tabelaLinhas(P) {
    var h = '<div class="r-wrap"><table class="r-table"><thead><tr><th class="l">' + (P.I.porDia ? 'Dia' : 'Mês') + '</th>' + (P.I.porDia ? '' : '<th>Dias</th>') +
      '<th>Testados</th><th>Positivos</th><th>Indeterm.</th><th>Negativos</th><th>Taxa pos.</th></tr></thead><tbody>';
    if (!P.linhas.length) return h + '<tr><td colspan="7" class="l" style="color:var(--muted)">Sem registos no período.</td></tr></tbody></table></div>';
    P.linhas.forEach(function (l) {
      var T = soma(l.s, 'testados'), Po = soma(l.s, 'positivos'), N = soma(l.s, 'indeterminados');
      h += '<tr><td class="l">' + l.rot + '</td>' + (P.I.porDia ? '' : '<td>' + l.n + '</td>') + '<td>' + T + '</td><td>' + Po + '</td><td>' + N + '</td><td>' + Math.max(0, T - Po - N) + '</td><td>' + pct(Po, T) + '</td></tr>';
    });
    var T = soma(P.a, 'testados'), Po = soma(P.a, 'positivos'), N = soma(P.a, 'indeterminados');
    return h + '<tr class="tot"><td class="l">TOTAL</td>' + (P.I.porDia ? '' : '<td>' + P.regs.length + '</td>') + '<td>' + T + '</td><td>' + Po + '</td><td>' + N + '</td><td>' + Math.max(0, T - Po - N) + '</td><td>' + pct(Po, T) + '</td></tr></tbody></table></div>';
  }
  function barrasFaixas(a, ind) {
    var mx = 1;
    FAIXAS.forEach(function (_, i) { mx = Math.max(mx, val(a, ind, i, 'f') + val(a, ind, i, 'm')); });
    return '<div class="bars">' + FAIXAS.map(function (nome, i) {
      var f = val(a, ind, i, 'f'), m = val(a, ind, i, 'm');
      return '<div class="bar-row"><span class="lb">' + esc(nome) + '</span><div class="bar-track"><i style="width:' + (f * 100 / mx) + '%;background:#db2777"></i><i style="width:' + (m * 100 / mx) + '%;background:#2563eb"></i></div><span class="nm">' + (f + m) + '</span></div>';
    }).join('') + '</div><div class="legenda"><span><i style="background:#db2777"></i>Feminino</span><span><i style="background:#2563eb"></i>Masculino</span></div>';
  }
  function colunas(itens) {
    var mx = 1; itens.forEach(function (x) { mx = Math.max(mx, x.t); });
    return '<div class="cols">' + itens.map(function (x) {
      return '<div class="c" title="' + esc(x.rot) + ': ' + x.t + ' testados, ' + x.p + ' positivos"><span class="v">' + (x.t || '') + '</span><div class="b" style="height:' + Math.max(2, x.t * 100 / mx) + '%"><i style="height:' + (x.t ? x.p * 100 / x.t : 0) + '%;background:#b91c1c"></i><i style="flex:1;background:#0e7490"></i></div></div>';
    }).join('') + '</div><div class="cols-lb">' + itens.map(function (x) { return '<span>' + esc(x.cur) + '</span>'; }).join('') + '</div>' +
      '<div class="legenda"><span><i style="background:#0e7490"></i>Testados</span><span><i style="background:#b91c1c"></i>Positivos</span></div>';
  }
  function kpisPeriodo(a, n) {
    var T = soma(a, 'testados'), P = soma(a, 'positivos'), N = soma(a, 'indeterminados');
    return kpis([
      ['Testados', T, '#0e7490', 'F <b class="f">' + soma(a, 'testados', 'f') + '</b> · M <b class="m">' + soma(a, 'testados', 'm') + '</b>'],
      ['Positivos', P, '#b91c1c', 'F <b class="f">' + soma(a, 'positivos', 'f') + '</b> · M <b class="m">' + soma(a, 'positivos', 'm') + '</b>'],
      ['Indeterminados', N, '#6d28d9', 'F <b class="f">' + soma(a, 'indeterminados', 'f') + '</b> · M <b class="m">' + soma(a, 'indeterminados', 'm') + '</b>'],
      ['Taxa de positividade', pct(P, T), '#b45309', 'positivos ÷ testados'],
      ['Dias com registo', n, 'var(--accent)', '']
    ]);
  }
  function relatorio(tipo) {
    var P = dadosPeriodo(tipo), out = $('out-' + tipo);
    var obs = P.regs.filter(function (r) { return (r.s.obs || '').trim(); });
    out.innerHTML =
      '<div class="card" style="padding:14px 20px"><div style="display:flex;gap:18px;flex-wrap:wrap;font-size:.8rem"><span><b>Período:</b> ' + P.I.rot + '</span><span><b>Formação Sanitária:</b> ' + esc(P.formacao || '—') + '</span><span><b>Fonte:</b> ' + esc(P.fonte || '—') + '</span></div></div>' +
      '<div class="kpi-grid">' + kpisPeriodo(P.a, P.regs.length) + '</div>' +
      '<div class="card"><div class="card-label">Por faixa etária e sexo</div>' + tabelaFaixas(P.a) + '</div>' +
      '<div class="grid2"><div class="card"><div class="card-label">' + (P.I.porDia ? 'Por dia' : 'Por mês') + '</div>' + tabelaLinhas(P) + '</div>' +
      '<div class="card"><div class="card-label">Positivos por faixa etária</div>' + barrasFaixas(P.a, 'positivos') + '</div></div>' +
      (obs.length ? '<div class="card"><div class="card-label">Observações</div>' + obs.map(function (r) { return '<div style="font-size:.84rem;padding:6px 0;border-bottom:1px dashed var(--border)"><b>' + fmtD(r.data) + ':</b> ' + esc(r.s.obs) + '</div>'; }).join('') + '</div>' : '');
  }

  // ── PDF ──
  function pdf(tipo) {
    if (!(window.jspdf && window.jspdf.jsPDF) || !window.ZeloPDF) { toast('O gerador de PDF ainda está a carregar — tente de novo'); return; }
    var P;
    if (tipo === 'dia') P = { I: { rot: fmtDL(data), porDia: true }, regs: [{ data: data, s: cur }], a: agregar([cur]), linhas: [], formacao: cur.formacao, fonte: cur.fonte };
    else P = dadosPeriodo(tipo);
    var Z = ZeloPDF.criar(), d = Z.d, a = P.a;
    var nomeTipo = { dia: 'Registo Diário', semanal: 'Relatório Semanal', mensal: 'Relatório Mensal', trimestral: 'Relatório Trimestral', semestral: 'Relatório Semestral', anual: 'Relatório Anual' }[tipo];
    var y = Z.cab(C.titulo + ' · ' + nomeTipo, P.I.rot);
    y = Z.txt(y, 'Formação Sanitária', P.formacao || '—');
    y = Z.txt(y, 'Fonte', P.fonte || '—');
    var T = soma(a, 'testados'), Po = soma(a, 'positivos'), N = soma(a, 'indeterminados');
    y = Z.secT(y, '1. Resumo geral');
    y = Z.kv(y, [['Testados', String(T)], ['Positivos', String(Po)], ['Indeterminados', String(N)], ['Taxa de positividade', pct(Po, T)]]);
    y = Z.kv(y, [['Testados F / M', soma(a, 'testados', 'f') + ' / ' + soma(a, 'testados', 'm')], ['Positivos F / M', soma(a, 'positivos', 'f') + ' / ' + soma(a, 'positivos', 'm')], ['Indeterm. F / M', soma(a, 'indeterminados', 'f') + ' / ' + soma(a, 'indeterminados', 'm')], ['Dias com registo', String(P.regs.length)]]);
    y = Z.secT(y, '2. Por faixa etária e sexo');
    var head = [[{ content: 'Faixa etária', rowSpan: 2 }].concat(IND.map(function (I) { return { content: I.nome, colSpan: 3, styles: { halign: 'center' } }; })),
      ['F', 'M', 'Total', 'F', 'M', 'Total', 'F', 'M', 'Total']];
    var body = FAIXAS.map(function (nome, i) {
      var l = [nome]; IND.forEach(function (I) { var f = val(a, I.id, i, 'f'), m = val(a, I.id, i, 'm'); l.push(f, m, f + m); }); return l;
    });
    var tl = ['TOTAL']; IND.forEach(function (I) { var f = soma(a, I.id, 'f'), m = soma(a, I.id, 'm'); tl.push(f, m, f + m); }); body.push(tl);
    y = ZeloPDF.autoTable(d, { startY: y, head: head, body: body, styles: { fontSize: 10, halign: 'center' }, columnStyles: { 0: { halign: 'left' } } }) + 4;
    if (tipo !== 'dia') {
      y = Z.secT(y, '3. ' + (P.I.porDia ? 'Por dia' : 'Por mês'));
      var b2 = P.linhas.map(function (l) { var t = soma(l.s, 'testados'), p = soma(l.s, 'positivos'), n = soma(l.s, 'indeterminados'); return [l.rot].concat(P.I.porDia ? [] : [l.n]).concat([t, p, n, Math.max(0, t - p - n), pct(p, t)]); });
      b2.push(['TOTAL'].concat(P.I.porDia ? [] : [P.regs.length]).concat([T, Po, N, Math.max(0, T - Po - N), pct(Po, T)]));
      y = ZeloPDF.autoTable(d, { startY: y, head: [[P.I.porDia ? 'Dia' : 'Mês'].concat(P.I.porDia ? [] : ['Dias']).concat(['Testados', 'Positivos', 'Indeterm.', 'Negativos', 'Taxa pos.'])], body: b2, styles: { fontSize: 10, halign: 'center' }, columnStyles: { 0: { halign: 'left' } } }) + 4;
    }
    var obs = P.regs.filter(function (r) { return (r.s.obs || '').trim(); });
    if (obs.length) {
      y = Z.secT(y, (tipo === 'dia' ? '3' : '4') + '. Observações');
      obs.forEach(function (r) { y = Z.txt(y, fmtD(r.data), r.s.obs); });
    }
    Z.rodape();
    var nomeF = 'VIH_' + C.curto + '_' + (tipo === 'dia' ? data : P.I.de + '_' + P.I.ate) + '.pdf';
    d.save(nomeF);
  }

  // ── dashboard e histórico ──
  function dashboard() {
    var m = $('dash-mes').value || hoje().slice(0, 7), p = m.split('-');
    var de = m + '-01', ate = m + '-' + pad(new Date(+p[0], +p[1], 0).getDate());
    var regs = registosEntre(de, ate), a = agregar(regs.map(function (r) { return r.s; }));
    var T = soma(a, 'testados'), Po = soma(a, 'positivos'), N = soma(a, 'indeterminados');
    $('dashKpis').innerHTML =
      '<div class="dash-kpi teal"><span class="dk-label">Testados</span><span class="dk-val">' + T + '</span><span class="dk-sub">F ' + soma(a, 'testados', 'f') + ' · M ' + soma(a, 'testados', 'm') + '</span></div>' +
      '<div class="dash-kpi red"><span class="dk-label">Positivos</span><span class="dk-val">' + Po + '</span><span class="dk-sub">F ' + soma(a, 'positivos', 'f') + ' · M ' + soma(a, 'positivos', 'm') + '</span></div>' +
      '<div class="dash-kpi purple"><span class="dk-label">Indeterminados</span><span class="dk-val">' + N + '</span><span class="dk-sub">F ' + soma(a, 'indeterminados', 'f') + ' · M ' + soma(a, 'indeterminados', 'm') + '</span></div>' +
      '<div class="dash-kpi amber"><span class="dk-label">Taxa de positividade</span><span class="dk-val">' + pct(Po, T) + '</span><span class="dk-sub">positivos ÷ testados</span></div>' +
      '<div class="dash-kpi blue"><span class="dk-label">Dias com registo</span><span class="dk-val">' + regs.length + '</span><span class="dk-sub">' + MESES[+p[1] - 1] + ' de ' + p[0] + '</span></div>';
    var itens = [];
    for (var k = 1; k <= 12; k++) {
      var pre = p[0] + '-' + pad(k), rs = registosEntre(pre + '-01', pre + '-31'), ag = agregar(rs.map(function (r) { return r.s; }));
      itens.push({ rot: MESES[k - 1], cur: MESES[k - 1].slice(0, 3), t: soma(ag, 'testados'), p: soma(ag, 'positivos') });
    }
    $('dashAno').textContent = p[0];
    $('dashCols').innerHTML = colunas(itens);
    $('dashFaixas').innerHTML = barrasFaixas(a, 'testados');
    $('dashFaixasP').innerHTML = barrasFaixas(a, 'positivos');
  }
  function historico() {
    var m = $('hist-mes').value, t = dias();
    var ks = Object.keys(t).filter(function (d) { return t[d] && t[d].snapshot && (!m || d.slice(0, 7) === m); }).sort().reverse();
    Object.keys(localStorage).forEach(function (k) { if (k.indexOf(LS_RASC) === 0) { var d = k.slice(LS_RASC.length); if ((!m || d.slice(0, 7) === m) && ks.indexOf(d) < 0) ks.push(d); } });
    ks.sort().reverse();
    if (!ks.length) { $('histLista').innerHTML = '<div class="no-data">Nenhum registo' + (m ? ' neste mês' : '') + '</div>'; return; }
    $('histLista').innerHTML = ks.map(function (d) {
      var r = t[d], s = r ? r.snapshot : lsGet(LS_RASC + d, vazio()), rasc = !!lsGet(LS_RASC + d, null);
      var quem = r && r.criadoPor && r.criadoPor.nome ? 'Guardado por ' + esc(r.criadoPor.nome) + ' · ' + new Date(r.savedAt).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
      return '<div class="hist-item" data-dia="' + d + '"><div><div class="hist-date">' + fmtDL(d) + '</div><div class="hist-sub">' + (quem || '') + (rasc ? (quem ? ' · ' : '') + '<b style="color:var(--warn)">alterações por guardar neste computador</b>' : '') + '</div></div>' +
        '<div class="hist-nums"><span style="color:#0e7490">T <b>' + soma(s, 'testados') + '</b></span><span style="color:#b91c1c">P <b>' + soma(s, 'positivos') + '</b></span><span style="color:#6d28d9">I <b>' + soma(s, 'indeterminados') + '</b></span></div></div>';
    }).join('');
  }
  function exportarJSON() {
    var blob = new Blob([JSON.stringify({ modulo: MOD, exportadoEm: new Date().toISOString(), dias: dias() }, null, 1)], { type: 'application/json' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'backup_' + MOD + '_' + hoje() + '.json'; a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }

  var secAtual = 'sec-registo';
  function mostrar(id) {
    secAtual = id;
    document.querySelectorAll('.section').forEach(function (s) { s.classList.toggle('active', s.id === id); });
    document.querySelectorAll('.nav-item[data-sec]').forEach(function (n) { n.classList.toggle('active', n.dataset.sec === id); });
    atualizarVisiveis();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function atualizarVisiveis() {
    if (secAtual === 'sec-dashboard') dashboard();
    else if (secAtual === 'sec-historico') historico();
    else { var t = secAtual.replace('sec-', ''); if ($('out-' + t) && $('out-' + t).dataset.gerado) relatorio(t); }
  }

  // ── montagem ──
  function montar() {
    var agora = new Date(), ano = agora.getFullYear();
    document.body.classList.add(C.classe || '');
    $('data-registo').value = data;
    $('rs-data').value = data; $('rm-mes').value = data.slice(0, 7); $('dash-mes').value = data.slice(0, 7); $('hist-mes').value = data.slice(0, 7);
    ['rt-ano', 'rsm-ano', 'ra-ano'].forEach(function (id) { $(id).value = ano; });
    $('rt-q').value = Math.ceil((agora.getMonth() + 1) / 3); $('rsm-s').value = agora.getMonth() < 6 ? 1 : 2;
    document.querySelectorAll('[data-ic]').forEach(function (el) { el.innerHTML = ic(el.dataset.ic) + el.innerHTML; });
    document.querySelectorAll('.nav-item[data-sec]').forEach(function (n) { n.addEventListener('click', function () { mostrar(n.dataset.sec); }); });
    document.querySelectorAll('[data-gerar]').forEach(function (b) { b.addEventListener('click', function () { var t = b.dataset.gerar; $('out-' + t).dataset.gerado = '1'; relatorio(t); }); });
    document.querySelectorAll('[data-pdf]').forEach(function (b) { b.addEventListener('click', function () { pdf(b.dataset.pdf); }); });
    $('data-registo').addEventListener('change', function () { abrirDia(this.value || hoje()); });
    $('dash-mes').addEventListener('change', dashboard);
    $('hist-mes').addEventListener('change', historico);
    $('histTodos').addEventListener('click', function () { $('hist-mes').value = ''; historico(); });
    $('histLista').addEventListener('click', function (e) { var it = e.target.closest('.hist-item'); if (it) { abrirDia(it.dataset.dia); mostrar('sec-registo'); } });
    document.addEventListener('input', function (e) { if (e.target.closest('#sec-registo')) aoEscrever(e); });
    ['btnGuardar', 'btnGuardar2'].forEach(function (id) { $(id).addEventListener('click', pedirGuardar); });
    $('btnPdfDia').addEventListener('click', function () { pdf('dia'); });
    $('btnJson').addEventListener('click', exportarJSON);
    $('mdlNao').addEventListener('click', function () { $('ovGuardar').classList.remove('open'); });
    $('mdlSim').addEventListener('click', gravar);
    $('ovGuardar').addEventListener('click', function (e) { if (e.target === this) this.classList.remove('open'); });
    setInterval(function () { var n = new Date(); $('clock').textContent = pad(n.getHours()) + ':' + pad(n.getMinutes()) + ':' + pad(n.getSeconds()); }, 1000);
    abrirDia(data);
    sincronizar();
  }
  window.ZeloVIH = { abrirDia: abrirDia, mostrar: mostrar, relatorio: relatorio, pdf: pdf, sincronizar: sincronizar, _estado: function () { return { data: data, cur: cur, base: base, sujo: sujo }; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar); else montar();
})();
