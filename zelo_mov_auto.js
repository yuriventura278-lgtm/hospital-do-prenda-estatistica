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
// Serviços com um só Movimento a juntar vários Controlos de Pacientes:
//   Medicina Interna (homens e mulheres) → registos_movimento/medicina_interna
//   UCI + Cuidados Intermédios (2 Controlos de Pacientes, 8 camas cada,
//   16 no total) → registos_movimento/uci
// As páginas antigas (Medicina Homem/Mulher, UCI Intensivo/Intermédio) ficam
// com os seus dados no Firebase (nunca apagados); na 1.ª abertura do
// Movimento junto, os meses escritos à mão nelas são somados para lá.
//
// Usado pelas páginas de Movimento (preenchem sozinhas os meses em que o
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
    medicina_homem: ['medicina_interna', 'Masculino'], medicina_mulher: ['medicina_interna', 'Feminino'],
    medicina_interna: ['medicina_interna'], uci: ['uci_intensivo']
  };
  // Controlos de Pacientes de cada Movimento: [[serviço, género], …]
  var FONTES = { uci: [['uci_intensivo'], ['uci_intermedio']] };
  function fontes(item) { return FONTES[item] || (MAPA[item] ? [MAPA[item]] : []); }
  // Movimento junto ← Movimentos antigos (dados preservados, somados)
  var FUSAO = { medicina_interna: ['medicina_homem', 'medicina_mulher'], uci: ['uci_intensivo', 'uci_intermedio'] };
  // Camas de cada Controlo de Pacientes dentro de um Movimento junto
  var PARTES = { uci: { uci_intensivo: 8, uci_intermedio: 8 } };
  // Camas predefinidas de cada serviço (podem ser alteradas na página do
  // Movimento). Aplicadas uma vez (__camasPredef); depois vale o que lá se escrever.
  var PREDEF = { medicina_interna: 60, cirurgia_geral: 38, uci: 16, maxilo_facial: 12, nefrologia: 20, neurocirurgia: 14, ortopedia: 54 };
  var CAP_INICIAL = PREDEF;
  var CAMPOS = ['diretos', 'transferidos_adm', 'altas', 'menos_48', 'mais_48', 'transferidos_sai', 'dia_cama', 'dia_doente'];

  function dia(iso) { return String(iso || '').slice(0, 10); }
  function diasNoMes(ym) { var p = ym.split('-'); return new Date(+p[0], +p[1], 0).getDate(); }
  function isoDia(ym, d) { return ym + '-' + String(d).padStart(2, '0'); }
  function hoje() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function lista(pac) { if (!pac) return []; return (Array.isArray(pac) ? pac : Object.keys(pac).map(function (k) { return pac[k]; })).filter(function (p) { return p && typeof p === 'object' && p.dataEntrada; }); }
  function doServico(pac, item, genero) {
    var m = MAPA[item]; if (!m) return [];
    var g = arguments.length > 2 ? genero : m[1];
    return lista(pac).filter(function (p) { return !g || p.genero === g; });
  }
  function transferido(p) { return /^\s*transfer/i.test(String(p.proveniencia || '')); }
  function saiu(p) { return p.status !== 'internado' && p.dataSaida; }

  // Há doentes do Controlo de Pacientes neste mês?
  // Meses anteriores ao arquivo de saídas antigas do Controlo de Pacientes
  // (ps.arquivoAte = 1º dia a partir do qual o Controlo tem todos os doentes)
  // já não se recalculam: ficam com os números que o Movimento já tem.
  function ativoNoMes(ps, ym) {
    var ini = isoDia(ym, 1), fim = isoDia(ym, diasNoMes(ym));
    if (ps && ps.arquivoAte && ini < ps.arquivoAte) return false;
    return ps.some(function (p) { var e = dia(p.dataEntrada); return e <= fim && (!saiu(p) || dia(p.dataSaida) >= ini); });
  }
  // { campos: {campo: [dia1..diaN]}, existencia, ate }  — dias até hoje
  // Doentes internados fora do serviço (zelo_cp_fora.js): a cama é emprestada.
  //   Serviço de origem: +1 dia de cama por cada doente seu internado fora.
  //   Serviço que empresta: −1 dia de cama por cada doente de outro serviço.
  // A cama emprestada conta desde que o doente sobe (desde), também enquanto
  // aguarda a autorização no sistema, até regressar/sair (ate) — ou até à
  // recusa. Só um pedido cancelado (o doente não chegou a subir) não conta.
  function periodosFora(p) { try { var l = JSON.parse(p.foraServico || '[]'); return Array.isArray(l) ? l.filter(function (f) { return f.estado !== 'cancelado'; }) : []; } catch (e) { return []; } }
  function estadoExt(r) { return r.estado === 'cancelado' ? 'cancelado' : r.resposta && r.resposta.decisao ? r.resposta.decisao : (r.estado || 'autorizado'); }
  function cobre(desde, ate, dd) { return dia(desde) <= dd && (!ate || dia(ate) > dd); }
  // opts.foraUso: { dia: nº de camas fora de uso nesse dia } (avaria, obras…)
  // opts.existencia: existência anterior do mês (escrita à mão no 1º mês ou
  //   vinda do mês anterior) — os dias-doente seguem existência + entradas − saídas.
  function calcular(ps, ym, capacidade, externos, opts) {
    externos = externos || []; opts = opts || {};
    var fu = opts.foraUso || {}, corrente = opts.existencia != null && !isNaN(opts.existencia) ? Number(opts.existencia) : null;
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
        if (e <= dd && (!s || s > dd)) {
          c.dia_doente[i]++;
          if (periodosFora(p).some(function (f) { return f.servico && cobre(f.desde, f.ate, dd); })) c.dia_cama[i]++;
        }
      });
      externos.forEach(function (r) {
        var fim = [r.ate, r.dataSaida].filter(Boolean).map(dia).sort()[0] || null;
        if (dia(r.desde) <= dd && (!fim || fim > dd)) c.dia_cama[i]--;
      });
      c.dia_cama[i] -= Number(fu[d] || fu[String(d)] || 0);
      if (c.dia_cama[i] < 0) c.dia_cama[i] = 0;
      if (corrente != null) {
        corrente += c.diretos[i] + c.transferidos_adm[i] - c.altas[i] - c.menos_48[i] - c.mais_48[i] - c.transferidos_sai[i];
        if (corrente < 0) corrente = 0;
        c.dia_doente[i] = corrente;
      }
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
    var fs = fontes(item); if (!fs.length || typeof window.__fbGet !== 'function') return Promise.resolve(null);
    var ate = '';
    return Promise.all(fs.map(function (f) {
      var base = 'registos_sistemas_locais/controlo_pacientes/' + f[0] + '/snapshot/';
      return Promise.all([window.__fbGet(base + 'pacientes'), window.__fbGet(base + 'arquivoAte').catch(function () { return null; })]).then(function (r) {
        if (r[1] && String(r[1]) > ate) ate = String(r[1]);
        return r[0] ? doServico(r[0], item, f[1]) : [];
      });
    })).then(function (ls) { var l = [].concat.apply([], ls); if (ate) l.arquivoAte = ate; return l; }).catch(function () { return null; });
  }

  // Doentes do Controlo de Pacientes ao vivo: uma escuta por serviço — o
  // Firebase envia a lista uma vez e depois só o que muda (em vez de voltar a
  // descarregar a lista inteira sempre que alguém grava). Só entrega a lista
  // quando também já sabe o arquivoAte de cada serviço (meses que não se recalculam).
  var vivos = {};
  function pacientesVivos(item, aoMudar) {
    var fs = fontes(item);
    if (!fs.length || typeof window.__fbListen !== 'function') return lerPacientes(item);
    var v = vivos[item];
    if (!v) {
      v = vivos[item] = { ps: null, espera: [], cbs: [], por: {}, ate: {} };
      var montar = function () {
        for (var i = 0; i < fs.length; i++) if (!(i in v.por) || !(i in v.ate)) return;
        var l = [].concat.apply([], fs.map(function (f, i) { return v.por[i]; }));
        var a = Object.keys(v.ate).map(function (k) { return v.ate[k]; }).filter(Boolean).sort().pop();
        if (a) l.arquivoAte = String(a);
        var primeira = !v.ps; v.ps = l;
        v.espera.splice(0).forEach(function (r) { r(l); });
        if (!primeira) v.cbs.forEach(function (cb) { try { cb(l); } catch (e) {} });
      };
      fs.forEach(function (f, i) {
        var base = 'registos_sistemas_locais/controlo_pacientes/' + f[0] + '/snapshot/';
        window.__fbListen(base + 'arquivoAte', function (a) { v.ate[i] = a ? String(a) : ''; montar(); });
        window.__fbListen(base + 'pacientes', function (val) { v.por[i] = val ? doServico(val, item, f[1]) : []; montar(); });
      });
    }
    if (aoMudar) v.cbs.push(aoMudar);
    return v.ps ? Promise.resolve(v.ps) : new Promise(function (r) { v.espera.push(r); });
  }

  // Meses em que há camas emprestadas a doentes de outros serviços.
  function mesesExt(ext) {
    var h = hoje().slice(0, 7), set = {};
    (ext || []).forEach(function (r) {
      var ini = dia(r.desde).slice(0, 7), fim = ([r.ate, r.dataSaida].filter(Boolean).map(dia).sort()[0] || hoje()).slice(0, 7);
      if (!/^\d{4}-\d{2}$/.test(ini)) return;
      var y = +ini.slice(0, 4), mm = +ini.slice(5, 7), k;
      while ((k = y + '-' + String(mm).padStart(2, '0')) <= fim && k <= h) { set[k] = 1; mm++; if (mm > 12) { mm = 1; y++; } }
    });
    return Object.keys(set).sort();
  }
  // Doentes de outros serviços com cama emprestada por este serviço.
  // (Entre as partes de um Movimento junto — ex. doente da UCI numa cama dos
  // Cuidados Intermédios — o +1 e o −1 anulam-se: a unidade não ganha camas.)
  function lerExternos(item) {
    var fs = fontes(item); if (!fs.length || typeof window.__fbGet !== 'function') return Promise.resolve([]);
    return Promise.all(fs.map(function (m) {
      return window.__fbGet('registos_sistemas_locais/cp_fora/' + m[0]).then(function (v) {
        return Object.keys(v || {}).map(function (k) { return v[k]; }).filter(function (r) { return r && r.desde && estadoExt(r) !== 'cancelado' && (!m[1] || r.genero === m[1]); })
          .map(function (r) { return estadoExt(r) === 'recusado' && !r.ate && r.resposta && r.resposta.desde ? Object.assign({}, r, { ate: r.resposta.desde }) : r; });
      });
    })).then(function (ls) { return [].concat.apply([], ls); }).catch(function () { return []; });
  }
  // Soma campo a campo de meses de Movimento (arrays ou objetos do Firebase).
  function arr(v, n) { var a = []; for (var i = 0; i < n; i++) { var x = v ? v[i] : null; a.push(x === undefined || x === '' ? null : x); } return a; }
  function temValores(m) { return !!m && CAMPOS.some(function (k) { return arr(m[k], 31).some(function (x) { return x !== null && x !== undefined; }); }); }
  function somarMeses(ms, ym) {
    var n = diasNoMes(ym), out = {}, algum = false;
    CAMPOS.forEach(function (k) {
      out[k] = new Array(n).fill(null);
      ms.forEach(function (m) { if (!m) return; arr(m[k], n).forEach(function (x, i) { if (x !== null && !isNaN(parseInt(x, 10))) { out[k][i] = (out[k][i] || 0) + parseInt(x, 10); algum = true; } }); });
    });
    return algum ? out : null;
  }
  // ── Outros indicadores hospitalares (mesmas fórmulas em todas as páginas) ──
  // t: { dc: dias-cama, dd: dias-doente, dias: dias do período com dias-cama,
  //      saidos: saídos (altas + óbitos + transferidos), obitos: todos os óbitos,
  //      ob48: óbitos com menos de 48 h }
  //   Média de camas reais    = dias-cama ÷ dias do período
  //   Taxa de ocupação        = dias-doente ÷ dias-cama × 100
  //   Média de estadia        = dias-doente ÷ saídos
  //   Índice de rotação       = saídos ÷ média de camas reais (doentes por cama)
  //   Intervalo de substituição = (dias-cama − dias-doente) ÷ saídos (dias que a cama fica vazia entre dois doentes)
  //   Mortalidade bruta       = óbitos ÷ saídos × 100
  //   Mortalidade líquida     = óbitos ≥ 48 h ÷ (saídos − óbitos < 48 h) × 100
  function indicadores(t) {
    var dc = Number(t.dc) || 0, dd = Number(t.dd) || 0, sai = Number(t.saidos) || 0, ob = Number(t.obitos) || 0, ob48 = Number(t.ob48) || 0, dias = Number(t.dias) || 0;
    var cr = dias > 0 && dc > 0 ? dc / dias : null;
    return {
      camasReais: cr,
      taxa: dc > 0 ? dd / dc * 100 : null,
      estadia: sai > 0 ? dd / sai : null,
      rotacao: sai > 0 && cr ? sai / cr : null,
      intervalo: sai > 0 && dc > 0 ? Math.max(0, dc - dd) / sai : null,
      mortLiquida: sai - ob48 > 0 ? Math.max(0, ob - ob48) / (sai - ob48) * 100 : null,
      mortBruta: sai > 0 ? ob / sai * 100 : null
    };
  }
  var INDICADORES = [['camasReais', 'Média de camas reais', '', 'dias-cama ÷ dias'], ['taxa', 'Taxa de ocupação', '%', 'dias-doente ÷ dias-cama'], ['estadia', 'Média de estadia', ' dias', 'dias-doente ÷ saídos'],
    ['rotacao', 'Índice de rotação', '', 'saídos ÷ camas reais'], ['intervalo', 'Intervalo de substituição', ' dias', '(dias-cama − dias-doente) ÷ saídos'],
    ['mortLiquida', 'Mortalidade líquida', '%', 'óbitos ≥48 h ÷ (saídos − óbitos <48 h)'], ['mortBruta', 'Mortalidade bruta', '%', 'óbitos ÷ saídos']];
  function fmtInd(v, suf) { return v == null || !isFinite(v) ? '—' : v.toLocaleString('pt-PT', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + (suf === '%' ? '%' : ''); }
  window.ZeloMovAuto = { PREDEF: PREDEF, indicadores: indicadores, INDICADORES: INDICADORES, fmtInd: fmtInd, MAPA: MAPA, FONTES: FONTES, FUSAO: FUSAO, PARTES: PARTES, CAP_INICIAL: CAP_INICIAL, fontes: fontes, somarMeses: somarMeses, temValores: temValores,
    CAMPOS: CAMPOS, doServico: doServico, calcular: calcular, meses: meses, mesesExt: mesesExt, ativoNoMes: ativoNoMes, lerPacientes: lerPacientes, pacientesVivos: pacientesVivos, lerExternos: lerExternos };

  // ─────────────── Na página de Movimento de um serviço ───────────────
  function item() { try { return String(FB_MOVIMENTO_PATH).split('/').pop(); } catch (e) { return null; } }
  if (!/_movimento\.html$/.test(location.pathname)) return;

  var ps = null, ext = [], auto = {}, aplicando = false;
  window.ZeloMovAuto.mesAuto = function (m) { return !!auto[m]; };
  window.ZeloMovAuto.recalcular = function () { aplicar(); };

  function desligado() { try { return !!(data && data.__autoDesligado); } catch (e) { return false; } }
  function aplicar() {
    if (!ps || desligado() || typeof data === 'undefined' || typeof loadMonth !== 'function') return;
    var cap = getCapacity(), mudou = false, lm = meses(ps);
    auto = {}; lm.forEach(function (m) { auto[m] = true; });
    var fuTodos = data.__camasForaUso || {};
    lm.forEach(function (m, idx) {
      loadMonth(m);
      // Existência anterior: no 1º mês é escrita à mão; nos seguintes vem do
      // mês anterior (limpa a que o sistema tinha posto automaticamente).
      var ant = typeof getPrevMonthKey === 'function' ? getPrevMonthKey(m) : null;
      if (idx > 0 && data.__baselines && data.__baselines[m] !== undefined && ant && data[ant]) { delete data.__baselines[m]; mudou = true; }
      var r = calcular(ps, m, cap, ext, { foraUso: fuTodos[m], existencia: getExistencia(0, m) });
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
      data.__auto = data.__auto || {};
      if (!data.__auto[m]) { data.__auto[m] = true; mudou = true; }
    });
    // Meses sem doentes próprios no Controlo de Pacientes (preenchidos à mão),
    // mas com camas emprestadas a doentes de outros serviços: só os dias de
    // cama são acertados (camas − camas emprestadas); o resto fica como está.
    mesesExt(ext).forEach(function (m) {
      if (auto[m]) return;
      if (!(ext || []).length) return;
      var r = calcular([], m, cap, ext, { foraUso: (data.__camasForaUso || {})[m] });
      loadMonth(m);
      for (var i = 0; i < r.ate; i++) {
        var novo = r.campos.dia_cama[i], velho = data[m].dia_cama[i];
        if (velho === null || velho === undefined || velho === '' || parseInt(velho, 10) !== novo) { data[m].dia_cama[i] = novo; mudou = true; }
      }
      data.__camasEmprestadas = data.__camasEmprestadas || {};
      if (!data.__camasEmprestadas[m]) { data.__camasEmprestadas[m] = true; mudou = true; }
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
      if (inp.readOnly || inp.classList.contains('baseline-input')) return; // existência anterior: escrita à mão inp.readOnly = true; inp.tabIndex = -1; inp.title = 'Preenchido automaticamente a partir do Controlo de Pacientes';
      inp.style.background = '#F1F5F9'; inp.style.color = '#334155';
    });
  }
  function eAdmin() { try { return sessionStorage.getItem('zeloRole') === 'admin'; } catch (e) { return false; } }
  window.addEventListener('zelo-gate-ready', function () { try { faixa(); } catch (e) {} });
  function faixa() {
    var el = document.getElementById('mva-faixa');
    var sec = document.querySelector('.table-section'); if (!sec) return;
    if (!el) { el = document.createElement('div'); el.id = 'mva-faixa'; sec.parentNode.insertBefore(el, document.getElementById('m2') || sec); }
    var on = !desligado(), noMes = typeof currentMonth !== 'undefined' && auto[currentMonth];
    // Só os administradores veem esta faixa e podem desligar/ligar o
    // preenchimento automático (por omissão fica ligado). Os outros
    // utilizadores veem apenas o Movimento.
    if (!eAdmin()) { el.style.cssText = 'display:none'; el.innerHTML = ''; return; }
    el.style.cssText = 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;border-radius:12px;padding:10px 14px;margin-bottom:12px;font:600 .86rem Inter,"Segoe UI",Arial,sans-serif;' +
      (on ? 'background:#ECFDF5;border:1px solid #A7F3D0;color:#065F46' : 'background:#F1F5F9;border:1px solid #E2E8F0;color:#475569');
    el.innerHTML = on
      ? '<span style="font-size:1.1rem">⟳</span><span style="flex:1 1 300px;min-width:0">' + (noMes ? '<b>Preenchido automaticamente</b> a partir do Controlo de Pacientes (entradas, saídas, óbitos, dias-doente e dias de cama = camas × dias). Para corrigir um número, corrija o registo do doente no Controlo de Pacientes.' : '<b>Preenchimento automático ligado.</b> Este mês ainda não tem doentes no Controlo de Pacientes; os números aparecem sozinhos quando forem registados.') + '</span>' +
        '<button type="button" id="mva-off" style="margin-left:auto;flex-shrink:0;border:1px solid #A7F3D0;background:#fff;color:#065F46;border-radius:9px;padding:6px 10px;font:700 .78rem Inter,Arial,sans-serif;cursor:pointer">Desligar automático (preencher à mão)</button>'
      : '<span><b>Preenchimento automático desligado</b> neste serviço — os números do Movimento são escritos à mão. (Só administradores veem esta faixa.)</span><button type="button" id="mva-on" style="margin-left:auto;border:1px solid #CBD5E1;background:#fff;color:#1E3A5F;border-radius:9px;padding:6px 10px;font:700 .78rem Inter,Arial,sans-serif;cursor:pointer">Ligar preenchimento automático</button>';
    var off = document.getElementById('mva-off'), onb = document.getElementById('mva-on');
    if (off) off.onclick = function () { if (!eAdmin()) return; if (!confirm('Desligar o preenchimento automático neste serviço? Os números ficam como estão e passam a ser escritos à mão.')) return; data.__autoDesligado = true; auto = {}; persistData(); renderTable(); updateStats(); faixa(); };
    if (onb) onb.onclick = function () { if (!eAdmin()) return; data.__autoDesligado = false; persistData(); aplicar(); };
  }
  function envolver() {
    var r = window.renderTable; if (typeof r !== 'function' || r.__mva) return false;
    var novo = function () { var x = r.apply(this, arguments); try { soLeitura(); } catch (e) {} return x; };
    novo.__mva = true; window.renderTable = novo;
    // Existência anterior escrita à mão: dias-doente recalculados.
    var sb = window.setBaseline;
    if (typeof sb === 'function' && !sb.__mva) { var nb = function () { var x = sb.apply(this, arguments); aplicar(); return x; }; nb.__mva = true; window.setBaseline = nb; }
    // Camas alteradas: dias de cama recalculados.
    var u = window.updateCapacity;
    if (typeof u === 'function' && !u.__mva) { var nu = function () { var x = u.apply(this, arguments); aplicar(); return x; }; nu.__mva = true; window.updateCapacity = nu; }
    return true;
  }
  // Movimento junto: na 1.ª abertura soma os meses escritos à mão nas
  // páginas antigas (que ficam intactas no Firebase) e acerta as camas.
  function fundir() {
    var it = item(), velhos = FUSAO[it];
    if (!velhos || data.__fundido) return Promise.resolve();
    return Promise.all(velhos.map(function (v) { return window.__fbGet('registos_movimento/' + v + '/snapshot').catch(function () { return undefined; }); })).then(function (snaps) {
      if (snaps.some(function (x) { return x === undefined; })) return; // sem ligação: tenta noutra abertura
      if (data.__fundido) return;
      snaps = snaps.map(function (x) { return x || {}; });
      var meses = {};
      snaps.forEach(function (sn) { Object.keys(sn).forEach(function (k) { if (/^\d{4}-\d{2}$/.test(k)) meses[k] = 1; }); });
      Object.keys(meses).sort().forEach(function (ym) {
        if (temValores(data[ym])) return;
        var soma = somarMeses(snaps.map(function (sn) { return sn[ym]; }), ym);
        if (!soma) return;
        loadMonth(ym); CAMPOS.forEach(function (k) { data[ym][k] = soma[k]; });
      });
      var bl = {}, fu = {}, fum = {};
      snaps.forEach(function (sn) {
        Object.keys(sn.__baselines || {}).forEach(function (ym) { var x = parseInt(sn.__baselines[ym], 10); if (!isNaN(x)) bl[ym] = (bl[ym] || 0) + x; });
        Object.keys(sn.__camasForaUso || {}).forEach(function (ym) { var d = sn.__camasForaUso[ym] || {}; fu[ym] = fu[ym] || {}; Object.keys(d).forEach(function (dd) { var x = Number(d[dd]) || 0; if (x) fu[ym][dd] = (fu[ym][dd] || 0) + x; }); });
        Object.keys(sn.__camasForaUsoMotivo || {}).forEach(function (ym) { var d = sn.__camasForaUsoMotivo[ym] || {}; fum[ym] = fum[ym] || {}; Object.keys(d).forEach(function (dd) { if (d[dd]) fum[ym][dd] = fum[ym][dd] ? fum[ym][dd] + ' / ' + d[dd] : d[dd]; }); });
      });
      data.__baselines = data.__baselines || {};
      Object.keys(bl).forEach(function (ym) { if (data.__baselines[ym] === undefined) data.__baselines[ym] = bl[ym]; });
      data.__camasForaUso = data.__camasForaUso || {}; data.__camasForaUsoMotivo = data.__camasForaUsoMotivo || {};
      Object.keys(fu).forEach(function (ym) { if (!data.__camasForaUso[ym]) data.__camasForaUso[ym] = fu[ym]; });
      Object.keys(fum).forEach(function (ym) { if (!data.__camasForaUsoMotivo[ym]) data.__camasForaUsoMotivo[ym] = fum[ym]; });
      if (!(data.__capacity > 0)) {
        var caps = snaps.map(function (sn) { return Number(sn.__capacity) || 0; });
        data.__capacity = CAP_INICIAL[it] || (caps.every(function (c) { return c > 0; }) ? caps.reduce(function (a, c) { return a + c; }, 0) : 50);
      }
      if (PARTES[it] && !data.__capacidadePartes) data.__capacidadePartes = Object.assign({}, PARTES[it]);
      data.__fundido = { em: new Date().toISOString(), de: velhos };
      if (PREDEF[it]) { data.__capacity = PREDEF[it]; data.__camasPredef = 1; }
      aplicando = true;
      try { persistData(); } finally { aplicando = false; }
      try { renderTable(); updateStats(); } catch (e) {}
    });
  }
  function predefinir() {
    var it = item();
    if (!PREDEF[it] || data.__camasPredef) return;
    data.__capacity = PREDEF[it]; data.__camasPredef = 1;
    if (PARTES[it] && !data.__capacidadePartes) data.__capacidadePartes = Object.assign({}, PARTES[it]);
    aplicando = true;
    try { persistData(); } finally { aplicando = false; }
    try { renderTable(); updateStats(); } catch (e) {}
  }
  var tLer = null;
  function ler() {
    var it = item(); if (!MAPA[it]) return;
    // Primeira vez: começa a escuta ao vivo; depois, cada alteração do Controlo
    // de Pacientes chega sozinha (só a diferença) e volta a calcular.
    var cb = ler.__cb ? null : (ler.__cb = true, function (l) { ps = l; clearTimeout(tLer); tLer = setTimeout(function () { lerExternos(it).then(function (e) { ext = e || []; aplicar(); }); }, 400); });
    pacientesVivos(it, cb)
      .then(function (l) { return lerExternos(it).then(function (e) { if (l) { ps = l; ext = e || []; aplicar(); } }); });
  }
  var t = 0, iv = setInterval(function () {
    t++;
    if (window.__fbReady && typeof window.__fbGet === 'function' && typeof data !== 'undefined' && typeof currentMonth !== 'undefined' && currentMonth && envolver()) {
      clearInterval(iv); fundir().then(predefinir, predefinir).then(ler, ler);
      // Ao vivo: as alterações do Controlo de Pacientes chegam pela escuta de
      // pacientesVivos (ver ler()); camas emprestadas (cp_fora) também recalculam.
      if (typeof window.__fbListen === 'function') fontes(item()).forEach(function (m) {
        var primeiraF = true;
        window.__fbListen('registos_sistemas_locais/cp_fora/' + m[0], function () { if (primeiraF) { primeiraF = false; return; } ler(); });
      });
    } else if (t > 160) clearInterval(iv);
  }, 250);
})();
