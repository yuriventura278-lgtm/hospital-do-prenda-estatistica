// ── ZELO — Movimento Hospitalar preenchido a partir do Controlo de Pacientes ──
// Cálculo (por dia do mês, a partir dos doentes do Controlo de Pacientes do
// mesmo serviço):
//   Admitidos: Diretos (proveniência que não é transferência) · Transferidos
//              (proveniência "Transferência - …")
//   Saídos:    Altas ("Alta Vivo") · Óbitos < 48 h · Óbitos ≥ 48 h ("Óbito >48h")
//              · Transferidos ("Transferência")
//   Dias-doente do dia = doentes no serviço nesse dia (entraram até esse dia e
//              ainda não saíram) — igual ao "Ficam existindo" do dia.
//   Dias de cama do dia = camas disponíveis no serviço (no mês: camas × dias).
//   Existência anterior (1º dia do mês) = doentes internados antes do dia 1.
// A Medicina Interna tem um só Controlo de Pacientes: Medicina Homem usa os
// doentes do género Masculino e Medicina Mulher os do Feminino.
//
// Usado pelas 9 páginas de Movimento (preenchem sozinhas os meses em que o
// Controlo de Pacientes tem doentes, e acompanham ao vivo) e pelo Movimento
// Hospitalar Geral. Meses sem dados no Controlo de Pacientes ficam como estão.
// Nada é apagado: antes de substituir números escritos à mão, é guardada uma
// cópia (data.__manual[mês]).
(function () {
  if (window.ZeloMovAuto) return;

  // item do Movimento → [serviço do Controlo de Pacientes, género]
  var MAPA = {
    cirurgia_geral: ['cirurgia_geral'], maxilo_facial: ['maxilo_facial'], nefrologia: ['nefrologia'], neurocirurgia: ['neurocirurgia'],
    ortopedia: ['ortopedia'], uci_intensivo: ['uci_intensivo'], uci_intermedio: ['uci_intermedio'],
    medicina_homem: ['medicina_interna', 'Masculino'], medicina_mulher: ['medicina_interna', 'Feminino']
  };
  var CAMPOS = ['diretos', 'transferidos_adm', 'altas', 'menos_48', 'mais_48', 'transferidos_sai', 'dia_cama', 'dia_doente'];

  function dia(iso) { return String(iso || '').slice(0, 10); }
  function diasNoMes(ym) { var p = ym.split('-'); return new Date(+p[0], +p[1], 0).getDate(); }
  function isoDia(ym, d) { return ym + '-' + String(d).padStart(2, '0'); }
  function hoje() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function lista(pac) { if (!pac) return []; return (Array.isArray(pac) ? pac : Object.keys(pac).map(function (k) { return pac[k]; })).filter(function (p) { return p && typeof p === 'object' && p.dataEntrada; }); }
  function doServico(pac, item) {
    var m = MAPA[item]; if (!m) return [];
    return lista(pac).filter(function (p) { return !m[1] || p.genero === m[1]; });
  }
  function transferido(p) { return /^\s*transfer/i.test(String(p.proveniencia || '')); }
  function saiu(p) { return p.status !== 'internado' && p.dataSaida; }

  // Há doentes do Controlo de Pacientes neste mês?
  function ativoNoMes(ps, ym) {
    var ini = isoDia(ym, 1), fim = isoDia(ym, diasNoMes(ym));
    return ps.some(function (p) { var e = dia(p.dataEntrada); return e <= fim && (!saiu(p) || dia(p.dataSaida) >= ini); });
  }
  // { campos: {campo: [dia1..diaN]}, existencia, ate }  — dias até hoje
  function calcular(ps, ym, capacidade) {
    var n = diasNoMes(ym), h = hoje(), ate = ym < h.slice(0, 7) ? n : ym === h.slice(0, 7) ? +h.slice(8, 10) : 0;
    var c = {}; CAMPOS.forEach(function (k) { c[k] = new Array(n).fill(null); });
    for (var d = 1; d <= ate; d++) {
      var dd = isoDia(ym, d), i = d - 1;
      CAMPOS.forEach(function (k) { c[k][i] = 0; });
      c.dia_cama[i] = capacidade || 0;
      ps.forEach(function (p) {
        var e = dia(p.dataEntrada), s = saiu(p) ? dia(p.dataSaida) : null;
        if (e === dd) { if (transferido(p)) c.transferidos_adm[i]++; else c.diretos[i]++; }
        if (s === dd) {
          if (p.tipoSaida === 'Óbito') { if (/<\s*48/.test(String(p.subtipo || ''))) c.menos_48[i]++; else c.mais_48[i]++; }
          else if (p.tipoSaida === 'Transferência') c.transferidos_sai[i]++;
          else c.altas[i]++;
        }
        if (e <= dd && (!s || s > dd)) c.dia_doente[i]++;
      });
    }
    var ini = isoDia(ym, 1);
    var existencia = ps.filter(function (p) { var e = dia(p.dataEntrada); return e < ini && (!saiu(p) || dia(p.dataSaida) >= ini); }).length;
    return { campos: c, existencia: existencia, ate: ate };
  }
  function meses(ps) {
    var h = hoje().slice(0, 7), min = null;
    ps.forEach(function (p) { var m = dia(p.dataEntrada).slice(0, 7); if (/^\d{4}-\d{2}$/.test(m) && (!min || m < min)) min = m; });
    if (!min || min > h) return [];
    var l = [], y = +min.slice(0, 4), mm = +min.slice(5, 7);
    while (true) { var k = y + '-' + String(mm).padStart(2, '0'); if (k > h) break; l.push(k); mm++; if (mm > 12) { mm = 1; y++; } }
    return l.filter(function (m) { return ativoNoMes(ps, m); });
  }
  function lerPacientes(item) {
    var m = MAPA[item]; if (!m || typeof window.__fbGet !== 'function') return Promise.resolve(null);
    return window.__fbGet('registos_sistemas_locais/controlo_pacientes/' + m[0] + '/snapshot/pacientes').then(function (v) { return v ? doServico(v, item) : []; }).catch(function () { return null; });
  }

  window.ZeloMovAuto = { MAPA: MAPA, CAMPOS: CAMPOS, doServico: doServico, calcular: calcular, meses: meses, ativoNoMes: ativoNoMes, lerPacientes: lerPacientes };

  // ─────────────── Na página de Movimento de um serviço ───────────────
  function item() { try { return String(FB_MOVIMENTO_PATH).split('/').pop(); } catch (e) { return null; } }
  if (!/_movimento\.html$/.test(location.pathname)) return;

  var ps = null, auto = {}, aplicando = false;
  window.ZeloMovAuto.mesAuto = function (m) { return !!auto[m]; };

  function desligado() { try { return !!(data && data.__autoDesligado); } catch (e) { return false; } }
  function aplicar() {
    if (!ps || desligado() || typeof data === 'undefined' || typeof loadMonth !== 'function') return;
    var cap = getCapacity(), mudou = false, lm = meses(ps);
    auto = {}; lm.forEach(function (m) { auto[m] = true; });
    lm.forEach(function (m) {
      var r = calcular(ps, m, cap);
      loadMonth(m);
      // Cópia do que estava escrito à mão, antes da 1ª substituição (nunca apagar).
      data.__manual = data.__manual || {};
      if (!data.__manual[m] && !(data.__auto && data.__auto[m])) {
        var tem = CAMPOS.some(function (k) { return (data[m][k] || []).some(function (v) { return v !== null && v !== undefined && v !== ''; }); });
        if (tem) { var copia = {}; CAMPOS.forEach(function (k) { copia[k] = (data[m][k] || []).slice(); }); data.__manual[m] = JSON.stringify(copia); mudou = true; }
      }
      CAMPOS.forEach(function (k) {
        for (var i = 0; i < r.ate; i++) {
          var novo = r.campos[k][i], velho = data[m][k][i];
          if (velho === null || velho === undefined || velho === '' || parseInt(velho, 10) !== novo) { data[m][k][i] = novo; mudou = true; }
        }
      });
      data.__baselines = data.__baselines || {};
      if (data.__baselines[m] !== r.existencia) { data.__baselines[m] = r.existencia; mudou = true; }
      data.__auto = data.__auto || {};
      if (!data.__auto[m]) { data.__auto[m] = true; mudou = true; }
    });
    if (mudou) {
      aplicando = true;
      try { persistData(); } finally { aplicando = false; }
    }
    try { renderTable(); updateStats(); } catch (e) {}
    faixa();
  }
  // Grelha: campos preenchidos automaticamente ficam só de leitura.
  function soLeitura() {
    var t = document.getElementById('dataTable'); if (!t || typeof currentView === 'undefined' || currentView !== 'mensal' || !auto[currentMonth]) return;
    Array.prototype.forEach.call(t.querySelectorAll('input'), function (inp) {
      if (inp.readOnly) return; inp.readOnly = true; inp.tabIndex = -1; inp.title = 'Preenchido automaticamente a partir do Controlo de Pacientes';
      inp.style.background = '#F1F5F9'; inp.style.color = '#334155';
    });
  }
  function faixa() {
    var el = document.getElementById('mva-faixa');
    var sec = document.querySelector('.table-section'); if (!sec) return;
    if (!el) { el = document.createElement('div'); el.id = 'mva-faixa'; sec.parentNode.insertBefore(el, document.getElementById('m2') || sec); }
    var on = !desligado(), noMes = typeof currentMonth !== 'undefined' && auto[currentMonth];
    el.style.cssText = 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;border-radius:12px;padding:10px 14px;margin-bottom:12px;font:600 .86rem Inter,"Segoe UI",Arial,sans-serif;' +
      (on ? 'background:#ECFDF5;border:1px solid #A7F3D0;color:#065F46' : 'background:#F1F5F9;border:1px solid #E2E8F0;color:#475569');
    el.innerHTML = on
      ? '<span style="font-size:1.1rem">⟳</span><span style="flex:1 1 300px;min-width:0">' + (noMes ? '<b>Preenchido automaticamente</b> a partir do Controlo de Pacientes (entradas, saídas, óbitos, dias-doente e dias de cama = camas × dias). Para corrigir um número, corrija o registo do doente no Controlo de Pacientes.' : 'Este mês não tem doentes no Controlo de Pacientes — preenchimento manual.') + '</span>' +
        '<button type="button" id="mva-off" style="margin-left:auto;flex-shrink:0;border:1px solid #A7F3D0;background:#fff;color:#065F46;border-radius:9px;padding:6px 10px;font:700 .78rem Inter,Arial,sans-serif;cursor:pointer">Preencher à mão</button>'
      : '<span>Preenchimento automático desligado neste serviço.</span><button type="button" id="mva-on" style="margin-left:auto;border:1px solid #CBD5E1;background:#fff;color:#1E3A5F;border-radius:9px;padding:6px 10px;font:700 .78rem Inter,Arial,sans-serif;cursor:pointer">Ligar preenchimento automático</button>';
    var off = document.getElementById('mva-off'), onb = document.getElementById('mva-on');
    if (off) off.onclick = function () { if (!confirm('Desligar o preenchimento automático neste serviço? Os números ficam como estão e passam a ser escritos à mão.')) return; data.__autoDesligado = true; auto = {}; persistData(); renderTable(); updateStats(); faixa(); };
    if (onb) onb.onclick = function () { data.__autoDesligado = false; persistData(); aplicar(); };
  }
  function envolver() {
    var r = window.renderTable; if (typeof r !== 'function' || r.__mva) return false;
    var novo = function () { var x = r.apply(this, arguments); try { soLeitura(); } catch (e) {} return x; };
    novo.__mva = true; window.renderTable = novo;
    // Camas alteradas: dias de cama recalculados.
    var u = window.updateCapacity;
    if (typeof u === 'function' && !u.__mva) { var nu = function () { var x = u.apply(this, arguments); aplicar(); return x; }; nu.__mva = true; window.updateCapacity = nu; }
    return true;
  }
  function ler() {
    var it = item(); if (!MAPA[it]) return;
    lerPacientes(it).then(function (l) { if (l) { ps = l; aplicar(); } });
  }
  var t = 0, iv = setInterval(function () {
    t++;
    if (window.__fbReady && typeof window.__fbGet === 'function' && typeof data !== 'undefined' && typeof currentMonth !== 'undefined' && currentMonth && envolver()) {
      clearInterval(iv); ler();
      // Ao vivo: quando o Controlo de Pacientes grava, volta a calcular.
      var m = MAPA[item()];
      if (m && typeof window.__fbListen === 'function') {
        var primeira = true;
        window.__fbListen('registos_sistemas_locais/controlo_pacientes/' + m[0] + '/savedAt', function () { if (primeira) { primeira = false; return; } ler(); });
      }
    } else if (t > 160) clearInterval(iv);
  }, 250);
})();
