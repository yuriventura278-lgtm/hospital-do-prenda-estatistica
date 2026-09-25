// ── ZELO — Gráficos no modelo da Consulta Externa ──
// Todos os gráficos Chart.js do sistema passam a ter o aspeto dos gráficos
// do painel da Consulta Externa (a referência): colunas arredondadas com o
// valor por cima e sem grelha, anel (donut) com o total ao centro, a mesma
// paleta de cores, letra Inter e legenda com pontos redondos.
// Os dados, os tipos de gráfico e o que cada página faz com eles (atualizar,
// exportar para PDF, destruir) não mudam: só o aspeto.
// Carregado de forma síncrona por zelo_espera.js, antes de o Chart.js da
// página existir; embrulha o construtor Chart no momento em que é definido.
(function () {
  if (window.__zeloGraficos) return;
  window.__zeloGraficos = true;

  var CORES = ['#4e79c7', '#d64550', '#2fa66a', '#8a5fc9', '#e0973a', '#3aa0c9', '#8a9a4b', '#c0587e'];
  var TEXTO = '#152238', SUAVE = '#647184', GRELHA = 'rgba(100,113,132,.12)';
  var FONTE = "Inter, 'Segoe UI', Arial, sans-serif";
  window.ZELO_CORES_GRAFICO = CORES;

  function hexRgba(hex, a) {
    var h = String(hex).replace('#', '');
    if (h.length === 3) h = h.replace(/(.)/g, '$1$1');
    var n = parseInt(h, 16);
    if (isNaN(n)) return hex;
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  function ehCircular(t) { return t === 'doughnut' || t === 'pie' || t === 'polarArea'; }
  function obj(o, k) { if (!o[k] || typeof o[k] !== 'object') o[k] = {}; return o[k]; }

  function estilizar(cfg) {
    if (!cfg || typeof cfg !== 'object' || cfg.zeloSemEstilo) return cfg;
    var tipo = cfg.type || 'bar';
    var data = cfg.data || {};
    var sets = data.datasets || [];
    var opt = obj(cfg, 'options');
    var plugins = obj(opt, 'plugins');
    var circular = ehCircular(tipo);

    sets.forEach(function (ds, i) {
      var t = ds.type || tipo;
      if (ehCircular(t)) {
        var n = (data.labels || ds.data || []).length;
        ds.backgroundColor = Array.from({ length: n }, function (_, k) { return CORES[k % CORES.length]; });
        ds.borderColor = '#ffffff';
        ds.borderWidth = 2;
        ds.hoverOffset = 6;
      } else if (t === 'line') {
        var c = CORES[i % CORES.length];
        ds.borderColor = c;
        ds.pointBackgroundColor = c;
        ds.pointBorderColor = '#ffffff';
        ds.pointBorderWidth = 1.5;
        if (ds.pointRadius == null || ds.pointRadius > 0) ds.pointRadius = 3;
        ds.pointHoverRadius = 5;
        ds.borderWidth = 2.5;
        if (ds.tension == null) ds.tension = 0.35;
        ds.cubicInterpolationMode = 'monotone';
        ds.backgroundColor = ds.fill ? hexRgba(c, 0.12) : c;
      } else {
        // Barras: uma cor por série (como as colunas da Consulta Externa).
        var cor = CORES[i % CORES.length];
        ds.backgroundColor = cor;
        ds.hoverBackgroundColor = hexRgba(cor, 0.85);
        ds.borderWidth = 0;
        ds.borderColor = cor;
        ds.borderRadius = 6;
        ds.borderSkipped = false;
        if (ds.maxBarThickness == null) ds.maxBarThickness = 46;
      }
    });

    // Legenda e dicas
    var leg = obj(plugins, 'legend');
    var lab = obj(leg, 'labels');
    lab.usePointStyle = true; lab.pointStyle = 'circle'; lab.boxWidth = 8; lab.boxHeight = 8;
    lab.padding = 14; lab.color = SUAVE;
    lab.font = { family: FONTE, size: 11, weight: '600' };
    if (leg.display === undefined && !circular && sets.length < 2) leg.display = false;
    if (!leg.position) leg.position = 'bottom';
    var tip = obj(plugins, 'tooltip');
    tip.backgroundColor = TEXTO; tip.titleColor = '#ffffff'; tip.bodyColor = '#E2E8F0';
    tip.cornerRadius = 8; tip.padding = 10; tip.boxPadding = 4; tip.usePointStyle = true;
    tip.titleFont = { family: FONTE, weight: '700', size: 12 };
    tip.bodyFont = { family: FONTE, size: 12 };
    var tit = plugins.title;
    if (tit && typeof tit === 'object') { tit.color = TEXTO; tit.font = { family: FONTE, size: 13, weight: '700' }; }

    if (circular) {
      if (tipo === 'doughnut' || tipo === 'pie') opt.cutout = '62%';
      if (tipo === 'pie') cfg.type = 'doughnut';
      delete opt.scales;
    } else {
      var scales = obj(opt, 'scales');
      var horizontal = opt.indexAxis === 'y';
      ['x', 'y'].forEach(function (eixo) {
        var s = obj(scales, eixo);
        var valores = horizontal ? eixo === 'x' : eixo === 'y';
        var g = obj(s, 'grid');
        g.display = valores; g.color = GRELHA; g.drawTicks = false;
        if (valores) g.borderDash = [4, 4];
        s.border = { display: false, dash: valores ? [4, 4] : undefined };
        var tk = obj(s, 'ticks');
        tk.color = SUAVE; tk.padding = 8;
        tk.font = { family: FONTE, size: 11, weight: valores ? '500' : '600' };
        if (s.title && typeof s.title === 'object') { s.title.color = SUAVE; s.title.font = { family: FONTE, size: 11, weight: '600' }; }
      });
      Object.keys(scales).forEach(function (k) {
        if (k === 'x' || k === 'y') return;
        var s = scales[k]; if (!s || typeof s !== 'object') return;
        var tk = obj(s, 'ticks'); tk.color = SUAVE; tk.font = { family: FONTE, size: 11 };
        var g = obj(s, 'grid'); g.color = GRELHA;
        s.border = { display: false };
      });
      var lay = obj(opt, 'layout');
      if (lay.padding == null) lay.padding = horizontal ? { right: 30 } : { top: 18 };
    }
    return cfg;
  }

  // Valor por cima das colunas e total no centro do anel.
  var plugin = {
    id: 'zeloCE',
    afterDatasetsDraw: function (chart) {
      var ctx = chart.ctx, tipo = chart.config.type;
      if (chart.config._config && chart.config._config.zeloSemEstilo) return;
      ctx.save();
      if (ehCircular(tipo)) {
        var ds = chart.data.datasets[0];
        var meta = chart.getDatasetMeta(0);
        if (!ds || !meta || !meta.data || !meta.data[0]) { ctx.restore(); return; }
        var total = 0;
        (ds.data || []).forEach(function (v, i) { if (chart.getDataVisibility(i)) total += Number(v) || 0; });
        var arc = meta.data[0];
        var r = arc.innerRadius;
        if (r > 22) {
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillStyle = TEXTO;
          ctx.font = '800 ' + Math.max(14, Math.min(30, r * 0.46)) + 'px ' + FONTE;
          ctx.fillText((Math.round(total * 10) / 10).toLocaleString('pt-PT'), arc.x, arc.y - r * 0.1);
          ctx.fillStyle = SUAVE;
          ctx.font = '600 ' + Math.max(9, Math.min(12, r * 0.2)) + 'px ' + FONTE;
          ctx.fillText('Total', arc.x, arc.y + r * 0.28);
        }
      } else {
        var horizontal = chart.options.indexAxis === 'y';
        chart.data.datasets.forEach(function (ds, i) {
          if ((ds.type || tipo) !== 'bar' || !chart.isDatasetVisible(i)) return;
          var meta = chart.getDatasetMeta(i);
          var sc = chart.options.scales || {};
          if ((sc.x && sc.x.stacked) || (sc.y && sc.y.stacked)) return;
          meta.data.forEach(function (bar, k) {
            var v = ds.data[k];
            if (v && typeof v === 'object') v = horizontal ? v.x : v.y;
            v = Number(v);
            if (!v) return;
            var larg = horizontal ? bar.height : bar.width;
            if (!larg || larg < 12) return;
            ctx.fillStyle = TEXTO;
            ctx.font = '700 ' + (larg < 22 ? 9 : 11) + 'px ' + FONTE;
            var txt = (Math.round(v * 10) / 10).toLocaleString('pt-PT');
            if (horizontal) { ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(txt, bar.x + 5, bar.y); }
            else { ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(txt, bar.x, bar.y - 4); }
          });
        });
      }
      ctx.restore();
    }
  };

  function embrulhar(Orig) {
    if (!Orig || Orig.__zelo || typeof Orig !== 'function') return Orig;
    try {
      Orig.defaults.font.family = FONTE;
      Orig.defaults.color = SUAVE;
      Orig.register(plugin);
    } catch (e) {}
    var Z;
    try {
      Z = class extends Orig { constructor(item, cfg) { super(item, estilizar(cfg)); } };
    } catch (e) { return Orig; }
    Z.__zelo = true;
    return Z;
  }

  var atual = window.Chart;
  if (atual) atual = embrulhar(atual);
  try {
    Object.defineProperty(window, 'Chart', {
      configurable: true, enumerable: true,
      get: function () { return atual; },
      set: function (v) { atual = embrulhar(v); }
    });
  } catch (e) { if (atual) window.Chart = atual; }
  window.ZeloGraficos = { estilizar: estilizar, CORES: CORES };
})();
