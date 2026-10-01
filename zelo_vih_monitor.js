// ── ZELO — Testagem de VIH · Serviço de Estatística (só monitorização) ──
// Lê as duas páginas de Testagem de VIH — Laboratório
// (registos_sistemas_locais/vih_laboratorio) e Hemoterapia
// (registos_sistemas_locais/vih_hemoterapia) — e mostra cada uma e a soma
// das duas. Não grava nada.
// Sincronização: o histórico é lido com zeloLerHistorico (1.ª vez tudo; depois
// só os últimos 60 dias; uma vez por mês tudo outra vez) e guardado neste
// computador; os últimos 40 dias ficam "a ouvir" ao vivo — quando o
// Laboratório ou a Hemoterapia gravam, esta página atualiza-se sozinha.
(function () {
  'use strict';
  var FONTES = [
    { id: 'lab', mod: 'vih_laboratorio', nome: 'Laboratório', cor: '#3E5C87' },
    { id: 'hemo', mod: 'vih_hemoterapia', nome: 'Hemoterapia', cor: '#9F1239' }
  ];
  var FAIXAS = ['<1 ano', '1 - 4 anos', '5 - 9 anos', '10 - 14 anos', '15 - 19 anos', '20 - 24 anos', '25 - 29 anos',
    '30 - 34 anos', '35 - 39 anos', '40 - 44 anos', '45 - 49 anos', '50 - 54 anos', '55 - 59 anos', '60 - 64 anos', '65 ou mais anos'];
  var IND = [{ id: 'testados', nome: 'Testados', g: 'gT' }, { id: 'positivos', nome: 'Positivos', g: 'gP' }, { id: 'indeterminados', nome: 'Indeterminados', g: 'gI' }];
  var MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  var LS = 'zeloVihMon_';

  function $(id) { return document.getElementById(id); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function hoje() { return iso(new Date()); }
  function dt(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function fmtD(s) { return s ? s.split('-').reverse().join('/') : ''; }
  function fmtDL(s) { try { var t = dt(s).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); return t.charAt(0).toUpperCase() + t.slice(1); } catch (e) { return s; } }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pct(a, b) { return b ? (a * 100 / b).toFixed(1).replace('.', ',') + '%' : '—'; }
  function lsGet(k) { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function toast(m) { var t = $('toast'); if (!t) return; t.textContent = m; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('show'); }, 2600); }
  function doisNomes(n) { var p = String(n || '').trim().split(/\s+/); return p.length > 1 ? p[0] + ' ' + p[p.length - 1] : (p[0] || ''); }

  // ── dados ──
  var dados = { lab: lsGet(LS + 'vih_laboratorio'), hemo: lsGet(LS + 'vih_hemoterapia') };
  function val(s, ind, i, sx) { var v = s && s.dados && s.dados[ind] ? s.dados[ind][i + '_' + sx] : 0; return +v || 0; }
  function soma(s, ind, sx) { var t = 0; FAIXAS.forEach(function (_, i) { if (!sx || sx === 'f') t += val(s, ind, i, 'f'); if (!sx || sx === 'm') t += val(s, ind, i, 'm'); }); return t; }
  function vazio() { return { dados: { testados: {}, positivos: {}, indeterminados: {} } }; }
  function agregar(lista) {
    var a = vazio();
    lista.forEach(function (s) { IND.forEach(function (I) { FAIXAS.forEach(function (_, i) { ['f', 'm'].forEach(function (sx) { var v = val(s, I.id, i, sx); if (v) a.dados[I.id][i + '_' + sx] = (a.dados[I.id][i + '_' + sx] || 0) + v; }); }); }); });
    return a;
  }
  function entre(fonte, de, ate) {
    var t = dados[fonte], out = [];
    Object.keys(t).sort().forEach(function (d) { if (d >= de && d <= ate && t[d] && t[d].snapshot) out.push({ data: d, s: t[d].snapshot, rec: t[d] }); });
    return out;
  }
  function juntar(fonte, v) {
    if (!v) return false;
    var t = dados[fonte], mudou = false;
    Object.keys(v).forEach(function (d) {
      var r = v[d];
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !r || !r.snapshot) return;
      if (!t[d] || !t[d].savedAt || (r.savedAt && r.savedAt > t[d].savedAt)) { t[d] = r; mudou = true; }
    });
    if (mudou) lsSet(LS + FONTES.filter(function (f) { return f.id === fonte; })[0].mod, t);
    return mudou;
  }

  // ── sincronização ──
  function esperarFb(ms) { return new Promise(function (res) { var t0 = Date.now(); (function v() { if (window.__fbReady && typeof window.__fbGet === 'function') return res(true); if (Date.now() - t0 > (ms || 15000)) return res(false); setTimeout(v, 200); })(); }); }
  function marcarSync(txt) { var e = $('syncEstado'); if (e) e.innerHTML = txt; }
  async function sincronizar() {
    marcarSync('A sincronizar…');
    var ok = await esperarFb();
    if (!ok) { marcarSync('<b style="color:#b45309">Sem ligação</b> — a mostrar os dados guardados neste computador'); return; }
    await Promise.all(FONTES.map(async function (f) {
      var caminho = 'registos_sistemas_locais/' + f.mod;
      try { var v = typeof window.zeloLerHistorico === 'function' ? await window.zeloLerHistorico(caminho) : await window.__fbGet(caminho); juntar(f.id, v); } catch (e) {}
      // Ao vivo: os últimos 40 dias (poucos dados; o que mudar chega sozinho).
      var desde = iso(new Date(Date.now() - 40 * 86400000));
      if (typeof window.__fbListenDesde === 'function') {
        window.__fbListenDesde(caminho, desde, function (v2) { if (juntar(f.id, v2)) { redesenhar(); toast('Novos dados do ' + f.nome); } marcarHora(); });
      }
    }));
    marcarHora(); redesenhar();
  }
  function marcarHora() { var n = new Date(); marcarSync('<span class="ponto-vivo"></span> Sincronizado ao vivo · ' + pad(n.getHours()) + ':' + pad(n.getMinutes()) + ':' + pad(n.getSeconds())); }

  // ── semanas (o Laboratório e a Hemoterapia registam por semana: segunda a
  // domingo, cortada no início e no fim do mês; a chave é o 1.º dia) ──
  function semanasDoMes(ym) {
    var p = ym.split('-'), y = +p[0], m = +p[1], n = new Date(y, m, 0).getDate(), out = [], d = 1;
    while (d <= n) { var dw = (new Date(y, m - 1, d).getDay() + 6) % 7, fim = Math.min(n, d + 6 - dw); out.push({ n: out.length + 1, de: ym + '-' + pad(d), ate: ym + '-' + pad(fim) }); d = fim + 1; }
    return out;
  }
  function rotulo(d, curto) {
    var sl = dados.lab[d] && dados.lab[d].snapshot, sh = dados.hemo[d] && dados.hemo[d].snapshot;
    var sem = (sl && sl.semana) || (sh && sh.semana);
    if (!sem) return curto ? fmtD(d) : fmtDL(d);
    var w = semanasDoMes(d.slice(0, 7)).filter(function (x) { return x.de === d; })[0]; if (!w) return curto ? fmtD(d) : fmtDL(d);
    var dd = w.de === w.ate ? 'dia ' + (+w.de.slice(8)) : (+w.de.slice(8)) + ' a ' + (+w.ate.slice(8));
    return curto ? 'Semana ' + w.n + ' (' + dd + ')' : 'Semana ' + w.n + ' de ' + MESES[+d.slice(5, 7) - 1].toLowerCase() + ' de ' + d.slice(0, 4) + ' · ' + dd;
  }

  // ── períodos ──
  function intervalo() {
    var tipo = $('perTipo').value, de, ate, rot, y;
    if (tipo === 'dia') { de = ate = $('perDia').value || hoje(); rot = fmtDL(de); }
    else if (tipo === 'semana') {
      var b = dt($('perDia').value || hoje()), dow = (b.getDay() + 6) % 7, s = new Date(b); s.setDate(b.getDate() - dow); var e = new Date(s); e.setDate(s.getDate() + 6);
      de = iso(s); ate = iso(e); rot = 'Semana de ' + fmtD(de) + ' a ' + fmtD(ate);
    } else if (tipo === 'mes') {
      var m = $('perMes').value || hoje().slice(0, 7), p = m.split('-');
      de = m + '-01'; ate = m + '-' + pad(new Date(+p[0], +p[1], 0).getDate()); rot = MESES[+p[1] - 1] + ' de ' + p[0];
    } else {
      y = +$('perAno').value; var n = +$('perParte').value;
      if (tipo === 'tri') { de = y + '-' + pad(n * 3 - 2) + '-01'; ate = y + '-' + pad(n * 3) + '-' + pad(new Date(y, n * 3, 0).getDate()); rot = n + '.º Trimestre de ' + y; }
      else if (tipo === 'sem') { de = y + (n === 1 ? '-01-01' : '-07-01'); ate = y + (n === 1 ? '-06-30' : '-12-31'); rot = n + '.º Semestre de ' + y; }
      else { de = y + '-01-01'; ate = y + '-12-31'; rot = 'Ano de ' + y; }
    }
    return { tipo: tipo, de: de, ate: ate, rot: rot, porDia: tipo === 'dia' || tipo === 'semana' || tipo === 'mes' };
  }
  function ajustarCampos() {
    var t = $('perTipo').value;
    $('wDia').style.display = t === 'dia' || t === 'semana' ? '' : 'none';
    $('wMes').style.display = t === 'mes' ? '' : 'none';
    $('wAno').style.display = t === 'tri' || t === 'sem' || t === 'ano' ? '' : 'none';
    $('wParte').style.display = t === 'tri' || t === 'sem' ? '' : 'none';
    var p = $('perParte'), m = new Date().getMonth();
    if (t === 'tri') { p.innerHTML = [1, 2, 3, 4].map(function (i) { return '<option value="' + i + '">' + i + '.º trimestre</option>'; }).join(''); p.value = String(Math.floor(m / 3) + 1); }
    if (t === 'sem') { p.innerHTML = '<option value="1">1.º semestre</option><option value="2">2.º semestre</option>'; p.value = m < 6 ? '1' : '2'; }
  }
  function calcular(I) {
    var r = {};
    FONTES.forEach(function (f) { var regs = entre(f.id, I.de, I.ate); r[f.id] = { regs: regs, a: agregar(regs.map(function (x) { return x.s; })) }; });
    r.soma = { regs: [], a: agregar([r.lab.a, r.hemo.a]) };
    return r;
  }

  // ── desenho ──
  var vistaFonte = 'soma';
  function kpiCol(a, titulo, cor, n) {
    var T = soma(a, 'testados'), P = soma(a, 'positivos'), N = soma(a, 'indeterminados');
    return '<div class="mon-col" style="--k:' + cor + '"><div class="mon-col-t">' + titulo + (n != null ? ' <small>' + n + ' dia' + (n === 1 ? '' : 's') + ' com registo</small>' : '') + '</div>' +
      '<div class="mon-kpis"><div><span>Testados</span><b>' + T + '</b><em>F ' + soma(a, 'testados', 'f') + ' · M ' + soma(a, 'testados', 'm') + '</em></div>' +
      '<div><span>Positivos</span><b style="color:#b91c1c">' + P + '</b><em>F ' + soma(a, 'positivos', 'f') + ' · M ' + soma(a, 'positivos', 'm') + '</em></div>' +
      '<div><span>Indeterm.</span><b style="color:#6d28d9">' + N + '</b><em>F ' + soma(a, 'indeterminados', 'f') + ' · M ' + soma(a, 'indeterminados', 'm') + '</em></div>' +
      '<div><span>Taxa pos.</span><b style="color:#b45309">' + pct(P, T) + '</b><em>positivos ÷ testados</em></div></div></div>';
  }
  function tabelaFaixas(a) {
    var h = '<div class="r-wrap"><table class="r-table"><thead><tr><th class="l" rowspan="2" style="background:var(--accent);color:#fff">Faixa etária</th>' +
      IND.map(function (I) { return '<th colspan="3" class="' + I.g + '">' + I.nome + '</th>'; }).join('') + '<th rowspan="2" style="background:#b45309;color:#fff">Taxa pos.</th></tr><tr>' +
      IND.map(function () { return '<th>F</th><th>M</th><th>Total</th>'; }).join('') + '</tr></thead><tbody>';
    function cel(v, c) { return '<td class="' + (v ? '' : 'zero ') + (c || '') + '">' + v + '</td>'; }
    FAIXAS.forEach(function (nome, i) {
      h += '<tr><td class="l">' + esc(nome) + '</td>';
      IND.forEach(function (I) { var f = val(a, I.id, i, 'f'), m = val(a, I.id, i, 'm'); h += cel(f) + cel(m) + cel(f + m, 'tt'); });
      h += '<td>' + pct(val(a, 'positivos', i, 'f') + val(a, 'positivos', i, 'm'), val(a, 'testados', i, 'f') + val(a, 'testados', i, 'm')) + '</td></tr>';
    });
    h += '<tr class="tot"><td class="l">TOTAL</td>';
    IND.forEach(function (I) { var f = soma(a, I.id, 'f'), m = soma(a, I.id, 'm'); h += '<td>' + f + '</td><td>' + m + '</td><td>' + (f + m) + '</td>'; });
    return h + '<td>' + pct(soma(a, 'positivos'), soma(a, 'testados')) + '</td></tr></tbody></table></div>';
  }
  function linhasPeriodo(I, R) {
    var linhas = [];
    if (I.porDia) {
      for (var d = dt(I.de); iso(d) <= I.ate; d.setDate(d.getDate() + 1)) {
        var k = iso(d), l = dados.lab[k] && dados.lab[k].snapshot, h = dados.hemo[k] && dados.hemo[k].snapshot;
        if (l || h) linhas.push({ rot: rotulo(k, true), dia: k, lab: l || vazio(), hemo: h || vazio(), temL: !!l, temH: !!h });
      }
    } else {
      var y = +I.de.slice(0, 4);
      for (var m = +I.de.slice(5, 7); m <= +I.ate.slice(5, 7); m++) {
        var pre = y + '-' + pad(m), a = pre + '-01', b = pre + '-31';
        var L = entre('lab', a, b), Hh = entre('hemo', a, b);
        linhas.push({ rot: MESES[m - 1], lab: agregar(L.map(function (x) { return x.s; })), hemo: agregar(Hh.map(function (x) { return x.s; })), nL: L.length, nH: Hh.length });
      }
    }
    return linhas;
  }
  function tabelaLinhas(I, linhas) {
    var h = '<div class="r-wrap"><table class="r-table"><thead><tr><th class="l" rowspan="2" style="background:var(--accent);color:#fff">' + (I.porDia ? 'Semana' : 'Mês') + '</th>' +
      '<th colspan="3" style="background:#3E5C87;color:#fff">Laboratório</th><th colspan="3" style="background:#9F1239;color:#fff">Hemoterapia</th><th colspan="4" style="background:#0F766E;color:#fff">Soma</th></tr><tr>' +
      '<th>Test.</th><th>Pos.</th><th>Ind.</th><th>Test.</th><th>Pos.</th><th>Ind.</th><th>Test.</th><th>Pos.</th><th>Ind.</th><th>Taxa</th></tr></thead><tbody>';
    if (!linhas.length) return h + '<tr><td colspan="11" class="l" style="color:var(--muted)">Sem registos no período.</td></tr></tbody></table></div>';
    var tot = { lt: 0, lp: 0, li: 0, ht: 0, hp: 0, hi: 0 };
    linhas.forEach(function (x) {
      var lt = soma(x.lab, 'testados'), lp = soma(x.lab, 'positivos'), li = soma(x.lab, 'indeterminados'), ht = soma(x.hemo, 'testados'), hp = soma(x.hemo, 'positivos'), hi = soma(x.hemo, 'indeterminados');
      tot.lt += lt; tot.lp += lp; tot.li += li; tot.ht += ht; tot.hp += hp; tot.hi += hi;
      var semL = I.porDia && !x.temL, semH = I.porDia && !x.temH;
      h += '<tr' + (x.dia ? ' class="mon-dia" data-dia="' + x.dia + '" title="Ver os registos individuais deste dia"' : '') + '><td class="l">' + x.rot + '</td>' +
        (semL ? '<td colspan="3" class="zero">sem registo</td>' : '<td>' + lt + '</td><td>' + lp + '</td><td>' + li + '</td>') +
        (semH ? '<td colspan="3" class="zero">sem registo</td>' : '<td>' + ht + '</td><td>' + hp + '</td><td>' + hi + '</td>') +
        '<td class="tt">' + (lt + ht) + '</td><td class="tt">' + (lp + hp) + '</td><td class="tt">' + (li + hi) + '</td><td>' + pct(lp + hp, lt + ht) + '</td></tr>';
    });
    return h + '<tr class="tot"><td class="l">TOTAL</td><td>' + tot.lt + '</td><td>' + tot.lp + '</td><td>' + tot.li + '</td><td>' + tot.ht + '</td><td>' + tot.hp + '</td><td>' + tot.hi + '</td><td>' +
      (tot.lt + tot.ht) + '</td><td>' + (tot.lp + tot.hp) + '</td><td>' + (tot.li + tot.hi) + '</td><td>' + pct(tot.lp + tot.hp, tot.lt + tot.ht) + '</td></tr></tbody></table></div>';
  }
  // ── Período anterior (para comparar) ──
  function fimMes(y, m) { return y + '-' + pad(m) + '-' + pad(new Date(y, m, 0).getDate()); }
  function anterior(I) {
    var y = +I.de.slice(0, 4), m = +I.de.slice(5, 7), meses = { mes: 1, tri: 3, sem: 6, ano: 12 }[I.tipo];
    if (meses) {
      var d0 = new Date(y, m - 1 - meses, 1), d1 = new Date(y, m - 1 - 1, 1);
      return { de: iso(d0), ate: fimMes(d1.getFullYear(), d1.getMonth() + 1) };
    }
    var n = I.tipo === 'semana' ? 7 : 1, a = dt(I.de), b = dt(I.ate); a.setDate(a.getDate() - n); b.setDate(b.getDate() - n);
    return { de: iso(a), ate: iso(b) };
  }
  function variacao(a, b, taxa) {
    if (taxa) { if (a == null || b == null) return '<span class="var-eq">—</span>'; var d = a - b; return '<span class="' + (d > 0 ? 'var-up' : d < 0 ? 'var-dn' : 'var-eq') + '">' + (d > 0 ? '+' : '') + d.toFixed(1).replace('.', ',') + ' p.p.</span>'; }
    if (!b) return a ? '<span class="var-up">novo</span>' : '<span class="var-eq">—</span>';
    var v = (a - b) * 100 / b; return '<span class="' + (v > 0 ? 'var-up' : v < 0 ? 'var-dn' : 'var-eq') + '">' + (v > 0 ? '+' : '') + v.toFixed(1).replace('.', ',') + '%</span>';
  }
  function comparacao(I, R) {
    var A = anterior(I), RA = calcular(A);
    $('monCompPer').textContent = '(' + fmtD(A.de) + ' a ' + fmtD(A.ate) + ')';
    var h = '<div class="r-wrap"><table class="r-table"><thead><tr><th class="l" style="background:var(--accent);color:#fff">Indicador</th><th style="background:var(--accent);color:#fff">Período atual</th><th style="background:var(--accent);color:#fff">Período anterior</th><th style="background:var(--accent);color:#fff">Variação</th></tr></thead><tbody>';
    function taxa(a) { var t = soma(a, 'testados'); return t ? soma(a, 'positivos') * 100 / t : null; }
    [['soma', 'Soma'], ['lab', 'Laboratório'], ['hemo', 'Hemoterapia']].forEach(function (f, k) {
      var a = R[f[0]].a, b = RA[f[0]].a;
      h += '<tr class="' + (k ? '' : '') + '"><td class="l" colspan="4" style="background:var(--surface2);font-weight:800">' + f[1] + '</td></tr>';
      IND.forEach(function (x) { var va = soma(a, x.id), vb = soma(b, x.id); h += '<tr><td class="l">' + x.nome + '</td><td>' + va + '</td><td>' + vb + '</td><td>' + variacao(va, vb) + '</td></tr>'; });
      var ta = taxa(a), tb = taxa(b);
      h += '<tr><td class="l">Taxa de positividade</td><td>' + pct(soma(a, 'positivos'), soma(a, 'testados')) + '</td><td>' + pct(soma(b, 'positivos'), soma(b, 'testados')) + '</td><td>' + variacao(ta, tb, true) + '</td></tr>';
    });
    $('monComp').innerHTML = h + '</tbody></table></div><div class="legenda" style="margin-top:6px">Variação: <span class="var-up">subiu</span> · <span class="var-dn">desceu</span> · p.p. = pontos percentuais</div>';
    return { A: A, RA: RA };
  }
  function evolucao(I) {
    var itens = [];
    if (I.tipo === 'mes' || I.tipo === 'semana' || I.tipo === 'dia') {
      for (var d = dt(I.de); iso(d) <= I.ate; d.setDate(d.getDate() + 1)) {
        var k = iso(d), l = dados.lab[k] && dados.lab[k].snapshot, h = dados.hemo[k] && dados.hemo[k].snapshot;
        itens.push({ m: String(d.getDate()), lt: l ? soma(l, 'testados') : 0, ht: h ? soma(h, 'testados') : 0, p: (l ? soma(l, 'positivos') : 0) + (h ? soma(h, 'positivos') : 0) });
      }
      $('monEvolTit').textContent = 'Evolução por dia — testados (Laboratório + Hemoterapia)';
    } else {
      var y = +I.de.slice(0, 4);
      for (var m = +I.de.slice(5, 7); m <= +I.ate.slice(5, 7); m++) {
        var a = y + '-' + pad(m) + '-01', b = y + '-' + pad(m) + '-31';
        var L = agregar(entre('lab', a, b).map(function (x) { return x.s; })), H = agregar(entre('hemo', a, b).map(function (x) { return x.s; }));
        itens.push({ m: MESES[m - 1].slice(0, 3), lt: soma(L, 'testados'), ht: soma(H, 'testados'), p: soma(L, 'positivos') + soma(H, 'positivos') });
      }
      $('monEvolTit').textContent = 'Evolução por mês — testados (Laboratório + Hemoterapia)';
    }
    var mx = 1; itens.forEach(function (x) { mx = Math.max(mx, x.lt + x.ht); });
    $('monEvol').innerHTML = '<div class="cols">' + itens.map(function (x) {
      return '<div class="c" title="' + x.m + ': Laboratório ' + x.lt + ', Hemoterapia ' + x.ht + ' testados; ' + x.p + ' positivos"><span class="v">' + ((x.lt + x.ht) || '') + '</span><div class="b" style="height:' + Math.max(2, (x.lt + x.ht) * 100 / mx) + '%"><i style="height:' + ((x.lt + x.ht) ? x.lt * 100 / (x.lt + x.ht) : 0) + '%;background:#3E5C87"></i><i style="flex:1;background:#9F1239"></i></div></div>';
    }).join('') + '</div><div class="cols-lb">' + itens.map(function (x) { return '<span>' + x.m + '</span>'; }).join('') + '</div>' +
      '<div class="legenda"><span><i style="background:#3E5C87"></i>Laboratório</span><span><i style="background:#9F1239"></i>Hemoterapia</span></div>';
  }
  function porSexo(a) {
    var h = '<div class="r-wrap"><table class="r-table"><thead><tr><th class="l" style="background:var(--accent);color:#fff">Sexo</th><th class="gT">Testados</th><th class="gP">Positivos</th><th class="gI">Indeterm.</th><th style="background:#b45309;color:#fff">Taxa pos.</th></tr></thead><tbody>';
    [['f', 'Feminino'], ['m', 'Masculino']].forEach(function (x) { var t = soma(a, 'testados', x[0]), p = soma(a, 'positivos', x[0]); h += '<tr><td class="l">' + x[1] + '</td><td>' + t + '</td><td>' + p + '</td><td>' + soma(a, 'indeterminados', x[0]) + '</td><td>' + pct(p, t) + '</td></tr>'; });
    h += '</tbody></table></div>';
    var top = FAIXAS.map(function (n, i) { return { n: n, p: val(a, 'positivos', i, 'f') + val(a, 'positivos', i, 'm'), t: val(a, 'testados', i, 'f') + val(a, 'testados', i, 'm') }; })
      .filter(function (x) { return x.p; }).sort(function (x, y) { return y.p - x.p; }).slice(0, 5);
    h += '<div style="margin-top:12px;font-size:11.5px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--muted)">Faixas etárias com mais positivos</div>';
    h += top.length ? '<div class="bars" style="margin-top:8px">' + top.map(function (x) { return '<div class="bar-row"><span class="lb">' + esc(x.n) + '</span><div class="bar-track"><i style="width:' + (x.p * 100 / top[0].p) + '%;background:#b91c1c"></i></div><span class="nm">' + x.p + ' <small style="color:var(--muted)">(' + pct(x.p, x.t) + ')</small></span></div>'; }).join('') + '</div>'
      : '<div class="no-data" style="padding:14px">Sem positivos no período</div>';
    $('monSexo').innerHTML = h;
  }
  function relatorio() {
    var I = intervalo(), R = calcular(I), linhas = linhasPeriodo(I, R), a = R[vistaFonte].a;
    $('monTit').textContent = I.rot;
    comparacao(I, R); evolucao(I); porSexo(R.soma.a);
    $('monKpis').innerHTML = kpiCol(R.lab.a, 'Laboratório', '#3E5C87', R.lab.regs.length) + kpiCol(R.hemo.a, 'Hemoterapia', '#9F1239', R.hemo.regs.length) + kpiCol(R.soma.a, 'Soma (Laboratório + Hemoterapia)', '#0F766E');
    document.querySelectorAll('#monFontes button').forEach(function (b) { b.classList.toggle('on', b.dataset.f === vistaFonte); });
    $('monFaixas').innerHTML = tabelaFaixas(a);
    $('monLinhas').innerHTML = tabelaLinhas(I, linhas);
    $('monLinhasTit').textContent = I.porDia ? 'Por dia — Laboratório, Hemoterapia e soma (clique num dia para ver os registos)' : 'Por mês — Laboratório, Hemoterapia e soma';
  }
  function registos() {
    var m = $('regMes').value || hoje().slice(0, 7), dias = {};
    ['lab', 'hemo'].forEach(function (f) { Object.keys(dados[f]).forEach(function (d) { if (d.slice(0, 7) === m && dados[f][d] && dados[f][d].snapshot) dias[d] = 1; }); });
    var ks = Object.keys(dias).sort().reverse();
    if (!ks.length) { $('regLista').innerHTML = '<div class="no-data">Nenhum registo neste mês</div>'; return; }
    $('regLista').innerHTML = ks.map(function (d) {
      function lado(f, nome, cor) {
        var r = dados[f][d];
        if (!r || !r.snapshot) return '<div class="mon-lado vazio"><b style="color:' + cor + '">' + nome + '</b><span>sem registo</span></div>';
        var s = r.snapshot, q = r.criadoPor && r.criadoPor.nome ? doisNomes(r.criadoPor.nome) : '—', h = r.savedAt ? new Date(r.savedAt) : null;
        return '<div class="mon-lado"><b style="color:' + cor + '">' + nome + '</b><span>T <b>' + soma(s, 'testados') + '</b> · P <b style="color:#b91c1c">' + soma(s, 'positivos') + '</b> · I <b style="color:#6d28d9">' + soma(s, 'indeterminados') + '</b></span>' +
          '<small>' + esc(q) + (h ? ' · ' + pad(h.getHours()) + ':' + pad(h.getMinutes()) : '') + '</small></div>';
      }
      var L = dados.lab[d] && dados.lab[d].snapshot, H = dados.hemo[d] && dados.hemo[d].snapshot, S = agregar([L || vazio(), H || vazio()]);
      return '<div class="hist-item mon-dia" data-dia="' + d + '"><div class="hist-date">' + esc(rotulo(d)) + '</div><div class="mon-lados">' + lado('lab', 'Laboratório', '#3E5C87') + lado('hemo', 'Hemoterapia', '#9F1239') +
        '<div class="mon-lado soma"><b style="color:#0F766E">Soma</b><span>T <b>' + soma(S, 'testados') + '</b> · P <b style="color:#b91c1c">' + soma(S, 'positivos') + '</b> · I <b style="color:#6d28d9">' + soma(S, 'indeterminados') + '</b></span><small>taxa ' + pct(soma(S, 'positivos'), soma(S, 'testados')) + '</small></div></div></div>';
    }).join('');
  }
  function abrirDia(d) {
    var L = dados.lab[d], H = dados.hemo[d];
    function bloco(r, nome, cor) {
      if (!r || !r.snapshot) return '<div class="card" style="border-top:4px solid ' + cor + '"><div class="card-label" style="color:' + cor + '">' + nome + '</div><div class="no-data" style="padding:18px">Sem registo neste dia</div></div>';
      var q = r.criadoPor && r.criadoPor.nome ? r.criadoPor.nome : '—', h = r.savedAt ? new Date(r.savedAt).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
      return '<div class="card" style="border-top:4px solid ' + cor + '"><div class="card-label" style="color:' + cor + '">' + nome + '<span style="margin-left:auto;text-transform:none;letter-spacing:0;color:var(--muted);font-weight:600">Guardado por ' + esc(q) + (h ? ' · ' + h : '') + '</span></div>' +
        '<div style="font-size:11.5px;color:var(--muted);margin:-6px 0 10px">Formação Sanitária: <b>' + esc(r.snapshot.formacao || '—') + '</b> · Fonte: <b>' + esc(r.snapshot.fonte || '—') + '</b></div>' +
        tabelaFaixas(r.snapshot) + (r.snapshot.obs ? '<div style="margin-top:10px;font-size:.85rem"><b>Observações:</b> ' + esc(r.snapshot.obs) + '</div>' : '') + '</div>';
    }
    $('mdlDiaTit').textContent = rotulo(d);
    $('mdlDiaCorpo').innerHTML = bloco(L, 'Laboratório', '#3E5C87') + bloco(H, 'Hemoterapia', '#9F1239') +
      '<div class="card" style="border-top:4px solid #0F766E"><div class="card-label" style="color:#0F766E">Soma (Laboratório + Hemoterapia)</div>' + tabelaFaixas(agregar([L && L.snapshot || vazio(), H && H.snapshot || vazio()])) + '</div>';
    $('ovDia').classList.add('open');
  }
  function painel() {
    var m = $('dashMes').value || hoje().slice(0, 7), p = m.split('-');
    var I = { de: m + '-01', ate: m + '-' + pad(new Date(+p[0], +p[1], 0).getDate()) }, R = calcular(I);
    $('dashCols').innerHTML = kpiCol(R.lab.a, 'Laboratório', '#3E5C87', R.lab.regs.length) + kpiCol(R.hemo.a, 'Hemoterapia', '#9F1239', R.hemo.regs.length) + kpiCol(R.soma.a, 'Soma', '#0F766E');
    var mx = 1, itens = [];
    for (var k = 1; k <= 12; k++) {
      var pre = p[0] + '-' + pad(k), a = pre + '-01', b = pre + '-31';
      var lt = soma(agregar(entre('lab', a, b).map(function (x) { return x.s; })), 'testados'), ht = soma(agregar(entre('hemo', a, b).map(function (x) { return x.s; })), 'testados');
      var lp = soma(agregar(entre('lab', a, b).map(function (x) { return x.s; })), 'positivos'), hp = soma(agregar(entre('hemo', a, b).map(function (x) { return x.s; })), 'positivos');
      itens.push({ m: MESES[k - 1].slice(0, 3), lt: lt, ht: ht, p: lp + hp }); mx = Math.max(mx, lt + ht);
    }
    $('dashAno').textContent = p[0];
    $('dashGraf').innerHTML = '<div class="cols">' + itens.map(function (x) {
      return '<div class="c" title="' + x.m + ': Laboratório ' + x.lt + ', Hemoterapia ' + x.ht + ' testados; ' + x.p + ' positivos"><span class="v">' + ((x.lt + x.ht) || '') + '</span><div class="b" style="height:' + Math.max(2, (x.lt + x.ht) * 100 / mx) + '%"><i style="height:' + ((x.lt + x.ht) ? x.lt * 100 / (x.lt + x.ht) : 0) + '%;background:#3E5C87"></i><i style="flex:1;background:#9F1239"></i></div></div>';
    }).join('') + '</div><div class="cols-lb">' + itens.map(function (x) { return '<span>' + x.m + '</span>'; }).join('') + '</div>' +
      '<div class="legenda"><span><i style="background:#3E5C87"></i>Laboratório</span><span><i style="background:#9F1239"></i>Hemoterapia</span></div>';
  }
  var sec = 'sec-painel';
  function redesenhar() { if (sec === 'sec-painel') painel(); else if (sec === 'sec-relatorio') relatorio(); else registos(); }
  var TIT = { mes: 'Estatística Mensal', tri: 'Estatística Trimestral', sem: 'Estatística Semestral', ano: 'Estatística Anual' };
  function estatistica(tipo) {
    $('perTipo').value = tipo; ajustarCampos();
    $('monH2').textContent = TIT[tipo];
    mostrar('sec-relatorio');
    document.querySelectorAll('.nav-item[data-sec],.nav-item[data-est]').forEach(function (n) { n.classList.toggle('active', n.dataset.est === tipo); });
  }
  function mostrar(id) {
    sec = id;
    document.querySelectorAll('.section').forEach(function (s) { s.classList.toggle('active', s.id === id); });
    document.querySelectorAll('.nav-item[data-sec]').forEach(function (n) { n.classList.toggle('active', n.dataset.sec === id); });
    redesenhar();
  }

  // ── PDF (três colunas: Laboratório, Hemoterapia e soma) ──
  function pdf() {
    if (!(window.jspdf && window.jspdf.jsPDF) || !window.ZeloPDF) { toast('O gerador de PDF ainda está a carregar — tente de novo'); return; }
    var I = intervalo(), R = calcular(I), linhas = linhasPeriodo(I, R), Z = ZeloPDF.criar(), d = Z.d;
    var y = Z.cab('Testagem de VIH · ' + (TIT[I.tipo] || 'Relatório') + ' · Laboratório + Hemoterapia', I.rot);
    function tri(a) { var T = soma(a, 'testados'), P = soma(a, 'positivos'); return [String(T), String(P), String(soma(a, 'indeterminados')), pct(P, T)]; }
    y = Z.secT(y, '1. Resumo por serviço e soma');
    y = ZeloPDF.autoTable(d, { startY: y, head: [['', 'Testados', 'Positivos', 'Indeterminados', 'Taxa pos.']],
      body: [['Laboratório'].concat(tri(R.lab.a)), ['Hemoterapia'].concat(tri(R.hemo.a)), ['TOTAL (soma)'].concat(tri(R.soma.a))], styles: { fontSize: 11.5, halign: 'center' }, columnStyles: { 0: { halign: 'left' } } }) + 4;
    function faixas(t, a) {
      y = Z.secT(y, t);
      var body = FAIXAS.map(function (n, i) { var l = [n]; IND.forEach(function (Ix) { var f = val(a, Ix.id, i, 'f'), m = val(a, Ix.id, i, 'm'); l.push(f, m, f + m); }); return l; });
      var tl = ['TOTAL']; IND.forEach(function (Ix) { var f = soma(a, Ix.id, 'f'), m = soma(a, Ix.id, 'm'); tl.push(f, m, f + m); }); body.push(tl);
      y = ZeloPDF.autoTable(d, { startY: y, head: [[{ content: 'Faixa etária', rowSpan: 2 }].concat(IND.map(function (Ix) { return { content: Ix.nome, colSpan: 3, styles: { halign: 'center' } }; })), ['F', 'M', 'Total', 'F', 'M', 'Total', 'F', 'M', 'Total']],
        body: body, styles: { fontSize: 10, halign: 'center' }, columnStyles: { 0: { halign: 'left' } } }) + 4;
    }
    if (I.tipo !== 'dia') {
      var A = anterior(I), RA = calcular(A);
      y = Z.secT(y, 'Comparação com o período anterior (' + fmtD(A.de) + ' a ' + fmtD(A.ate) + ')');
      var bc = [];
      [['soma', 'Soma'], ['lab', 'Laboratório'], ['hemo', 'Hemoterapia']].forEach(function (f) {
        var a = R[f[0]].a, b = RA[f[0]].a;
        IND.forEach(function (x) { var va = soma(a, x.id), vb = soma(b, x.id); bc.push([f[1] + ' · ' + x.nome, va, vb, vb ? ((va - vb) * 100 / vb).toFixed(1).replace('.', ',') + '%' : (va ? 'novo' : '—')]); });
        bc.push([f[1] + ' · Taxa de positividade', pct(soma(a, 'positivos'), soma(a, 'testados')), pct(soma(b, 'positivos'), soma(b, 'testados')), '']);
      });
      y = ZeloPDF.autoTable(d, { startY: y, head: [['Indicador', 'Período atual', 'Período anterior', 'Variação']], body: bc, styles: { fontSize: 10, halign: 'center' }, columnStyles: { 0: { halign: 'left' } } }) + 4;
    }
    faixas('2. Soma — por faixa etária e sexo', R.soma.a);
    faixas('3. Laboratório — por faixa etária e sexo', R.lab.a);
    faixas('4. Hemoterapia — por faixa etária e sexo', R.hemo.a);
    y = Z.secT(y, '5. ' + (I.porDia ? 'Por dia' : 'Por mês'));
    var b2 = linhas.map(function (x) { var lt = soma(x.lab, 'testados'), lp = soma(x.lab, 'positivos'), ht = soma(x.hemo, 'testados'), hp = soma(x.hemo, 'positivos'); return [x.rot, lt, lp, ht, hp, lt + ht, lp + hp, pct(lp + hp, lt + ht)]; });
    ZeloPDF.autoTable(d, { startY: y, head: [['', 'Lab. test.', 'Lab. pos.', 'Hemo. test.', 'Hemo. pos.', 'Soma test.', 'Soma pos.', 'Taxa']], body: b2.length ? b2 : [['Sem registos', '', '', '', '', '', '', '']], styles: { fontSize: 10, halign: 'center' }, columnStyles: { 0: { halign: 'left' } } });
    Z.rodape();
    d.save('Testagem_VIH_Lab_Hemo_' + I.de + '_' + I.ate + '.pdf');
  }

  function montar() {
    var ag = new Date();
    $('perDia').value = hoje(); $('perMes').value = hoje().slice(0, 7); $('perAno').value = ag.getFullYear(); $('regMes').value = hoje().slice(0, 7); $('dashMes').value = hoje().slice(0, 7);
    $('perTipo').value = 'mes'; ajustarCampos();
    document.querySelectorAll('.nav-item[data-sec]').forEach(function (n) { n.addEventListener('click', function () {
      if (n.dataset.sec === 'sec-relatorio') $('monH2').textContent = 'Relatório por período';
      mostrar(n.dataset.sec); document.querySelectorAll('.nav-item[data-est]').forEach(function (e) { e.classList.remove('active'); });
    }); });
    document.querySelectorAll('.nav-item[data-est]').forEach(function (n) { n.addEventListener('click', function () { estatistica(n.dataset.est); }); });
    ['perTipo'].forEach(function (id) { $(id).addEventListener('change', function () { ajustarCampos(); var t = $('perTipo').value; $('monH2').textContent = TIT[t] || 'Relatório por período'; document.querySelectorAll('.nav-item[data-est]').forEach(function (e) { e.classList.toggle('active', e.dataset.est === t); }); relatorio(); }); });
    ['perDia', 'perMes', 'perAno', 'perParte'].forEach(function (id) { $(id).addEventListener('change', relatorio); });
    $('regMes').addEventListener('change', registos); $('dashMes').addEventListener('change', painel);
    $('monFontes').addEventListener('click', function (e) { var b = e.target.closest('button[data-f]'); if (b) { vistaFonte = b.dataset.f; relatorio(); } });
    $('btnPdf').addEventListener('click', pdf);
    document.addEventListener('click', function (e) { var r = e.target.closest('.mon-dia[data-dia]'); if (r) abrirDia(r.dataset.dia); });
    $('mdlDiaFechar').addEventListener('click', function () { $('ovDia').classList.remove('open'); });
    $('ovDia').addEventListener('click', function (e) { if (e.target === this) this.classList.remove('open'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') $('ovDia').classList.remove('open'); });
    setInterval(function () { var n = new Date(); $('clock').textContent = pad(n.getHours()) + ':' + pad(n.getMinutes()) + ':' + pad(n.getSeconds()); }, 1000);
    mostrar('sec-painel');
    sincronizar();
  }
  window.ZeloVihMonitor = { sincronizar: sincronizar, redesenhar: redesenhar, _dados: dados };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar); else montar();
})();
