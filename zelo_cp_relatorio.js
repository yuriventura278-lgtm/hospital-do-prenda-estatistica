// ── ZELO — Controlo de Pacientes: CID-10, diagnósticos e relatório estruturado ──
// Partilhado pelas 8 páginas de Controlo de Pacientes.
//
// 1) CID-10 junto ao diagnóstico (registo, edição e diagnóstico final do
//    óbito). O sistema lembra os diagnósticos já usados (com o seu CID) e tem
//    um catálogo de códigos CID-10 comuns: escolher um diagnóstico preenche o
//    CID; escrever o CID preenche o diagnóstico.
// 2) Diagnósticos identificados: o mesmo diagnóstico escrito de maneiras
//    diferentes (maiúsculas, acentos, espaços) conta como um só; com CID, conta
//    pelo código.
// 3) Relatório no ecrã e PDF com a estrutura da Consulta Externa: indicadores,
//    saídas por tipo, diagnósticos das entradas e dos óbitos por frequência,
//    resumo por género (entradas, altas, óbitos, transferências), faixa etária
//    (0–14, 15–24, 25–44, 45–64, 65 ou mais) por género e por tipo de saída,
//    proveniência e as listas de doentes.
(function () {
  if (window.__zeloCpRelatorio) return;
  window.__zeloCpRelatorio = true;

  // ── Catálogo CID-10 (códigos comuns nos serviços de internamento) ──
  var CID = [
    ['A09', 'Diarreia e gastroenterite de origem infecciosa presumível'], ['A01.0', 'Febre tifoide'],
    ['A16', 'Tuberculose respiratória sem confirmação bacteriológica'], ['A15', 'Tuberculose respiratória com confirmação bacteriológica'],
    ['A41.9', 'Sepsis não especificada'], ['A35', 'Tétano'], ['A06', 'Amebíase'], ['A00', 'Cólera'],
    ['B50.9', 'Malária por Plasmodium falciparum'], ['B54', 'Malária não especificada'], ['B20', 'Doença pelo VIH'], ['B05', 'Sarampo'],
    ['D50', 'Anemia por deficiência de ferro'], ['D57.0', 'Anemia falciforme com crise'], ['D64.9', 'Anemia não especificada'],
    ['E11', 'Diabetes mellitus tipo 2'], ['E10', 'Diabetes mellitus tipo 1'], ['E14', 'Diabetes mellitus não especificada'],
    ['E43', 'Desnutrição proteico-calórica grave'], ['E86', 'Desidratação'],
    ['G40', 'Epilepsia'], ['G41', 'Estado de mal epiléptico'], ['G03.9', 'Meningite não especificada'], ['G93.4', 'Encefalopatia não especificada'],
    ['G06.0', 'Abscesso intracraniano'], ['G91', 'Hidrocefalia'],
    ['I10', 'Hipertensão arterial essencial'], ['I11', 'Cardiopatia hipertensiva'], ['I50', 'Insuficiência cardíaca'],
    ['I21', 'Enfarte agudo do miocárdio'], ['I26', 'Embolia pulmonar'], ['I48', 'Fibrilhação auricular'],
    ['I60', 'Hemorragia subaracnoideia'], ['I61', 'Hemorragia intracerebral'], ['I63', 'Enfarte cerebral (AVC isquémico)'],
    ['I64', 'AVC não especificado como hemorrágico ou isquémico'], ['I80', 'Flebite e tromboflebite'], ['I83', 'Varizes dos membros inferiores'],
    ['J06.9', 'Infecção aguda das vias aéreas superiores'], ['J18', 'Pneumonia, organismo não especificado'], ['J15', 'Pneumonia bacteriana'],
    ['J20', 'Bronquite aguda'], ['J44', 'Doença pulmonar obstrutiva crónica (DPOC)'], ['J45', 'Asma'],
    ['J90', 'Derrame pleural'], ['J93', 'Pneumotórax'], ['J96', 'Insuficiência respiratória'],
    ['K04', 'Doença da polpa e dos tecidos periapicais'], ['K12.2', 'Celulite e abscesso da boca'],
    ['K25', 'Úlcera gástrica'], ['K26', 'Úlcera duodenal'], ['K35', 'Apendicite aguda'], ['K40', 'Hérnia inguinal'],
    ['K42', 'Hérnia umbilical'], ['K43', 'Hérnia ventral'], ['K56', 'Obstrução intestinal'], ['K61', 'Abscesso anal e rectal'],
    ['K65', 'Peritonite'], ['K70', 'Doença alcoólica do fígado'], ['K74', 'Fibrose e cirrose hepática'], ['K80', 'Colelitíase'],
    ['K81', 'Colecistite'], ['K85', 'Pancreatite aguda'], ['K92.2', 'Hemorragia gastrointestinal não especificada'],
    ['L02', 'Abscesso cutâneo, furúnculo e antraz'], ['L03', 'Celulite'], ['L89', 'Úlcera de pressão'], ['L97', 'Úlcera do membro inferior'],
    ['M00', 'Artrite piogénica'], ['M10', 'Gota'], ['M16', 'Coxartrose'], ['M17', 'Gonartrose'], ['M50', 'Hérnia discal cervical'],
    ['M51', 'Hérnia discal lombar / torácica'], ['M54.5', 'Lombalgia'], ['M86', 'Osteomielite'],
    ['N04', 'Síndrome nefrótica'], ['N10', 'Pielonefrite aguda'], ['N17', 'Insuficiência renal aguda'], ['N18', 'Doença renal crónica'],
    ['N19', 'Insuficiência renal não especificada'], ['N20', 'Litíase renal e ureteral'], ['N39.0', 'Infecção do trato urinário'],
    ['N40', 'Hiperplasia da próstata'], ['N45', 'Orquite e epididimite'],
    ['C16', 'Neoplasia maligna do estômago'], ['C18', 'Neoplasia maligna do cólon'], ['C22', 'Neoplasia maligna do fígado'],
    ['C50', 'Neoplasia maligna da mama'], ['C53', 'Neoplasia maligna do colo do útero'], ['C61', 'Neoplasia maligna da próstata'],
    ['C71', 'Neoplasia maligna do encéfalo'], ['D33', 'Neoplasia benigna do encéfalo'],
    ['S00', 'Traumatismo superficial da cabeça'], ['S02', 'Fractura do crânio e dos ossos da face'], ['S02.4', 'Fractura do malar e do maxilar'],
    ['S02.6', 'Fractura da mandíbula'], ['S06.0', 'Concussão cerebral'], ['S06.5', 'Hemorragia subdural traumática'],
    ['S06.9', 'Traumatismo crânio-encefálico (TCE)'], ['S12', 'Fractura da coluna cervical'], ['S14', 'Traumatismo da medula cervical'],
    ['S22', 'Fractura das costelas, esterno e coluna torácica'], ['S24', 'Traumatismo da medula torácica'], ['S27', 'Traumatismo de órgãos intratorácicos'],
    ['S32', 'Fractura da coluna lombar e da pelve'], ['S34', 'Traumatismo da medula lombar'], ['S36', 'Traumatismo de órgãos intra-abdominais'],
    ['S42.0', 'Fractura da clavícula'], ['S42.3', 'Fractura da diáfise do úmero'], ['S42', 'Fractura do ombro e do braço'],
    ['S43.0', 'Luxação do ombro'], ['S52.5', 'Fractura da extremidade distal do rádio'], ['S52', 'Fractura do antebraço'],
    ['S62', 'Fractura do punho e da mão'], ['S72.0', 'Fractura do colo do fémur'], ['S72.3', 'Fractura da diáfise do fémur'],
    ['S72', 'Fractura do fémur'], ['S73', 'Luxação da anca'], ['S82.2', 'Fractura da diáfise da tíbia'], ['S82', 'Fractura da perna, incluindo o tornozelo'],
    ['S83', 'Luxação do joelho'], ['S92', 'Fractura do pé'], ['T07', 'Traumatismos múltiplos'], ['T14', 'Traumatismo de região não especificada'],
    ['T30', 'Queimadura'], ['T31', 'Queimaduras segundo a extensão da superfície corporal'], ['T63.0', 'Mordedura de serpente (veneno)'],
    ['T79.3', 'Infecção pós-traumática de ferida'], ['T81.4', 'Infecção após procedimento'], ['T84', 'Complicação de dispositivo ortopédico'],
    ['R10', 'Dor abdominal'], ['R40.2', 'Coma'], ['R50.9', 'Febre de origem desconhecida'], ['R56', 'Convulsões'], ['R57', 'Choque']
  ];

  function norm(t) {
    return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }
  function normCid(c) { return String(c || '').toUpperCase().replace(/[^A-Z0-9.]/g, ''); }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function lista() { try { return (typeof data !== 'undefined' && data && data.patients) ? data.patients : []; } catch (e) { return []; } }

  // Memória: diagnósticos já usados (neste serviço e nos outros Controlos de
  // Pacientes deste computador) + catálogo. { chave: { nome, cid, usos } }
  var MEM_LS = 'zelo_cp_diag_memoria';
  // Outros diagnósticos do paciente: guardados num só campo de texto (JSON),
  // para a sincronização tratar a lista como um valor só.
  function outros(p) {
    try { var a = JSON.parse(p && p.outrosDiagnosticos || '[]'); return Array.isArray(a) ? a.filter(function (x) { return x && String(x.nome || '').trim(); }) : []; } catch (e) { return []; }
  }
  // Todos os diagnósticos de entrada: o principal e os outros.
  function diagnosticos(p) {
    var l = [];
    if (p && String(p.diagnostico || '').trim()) l.push({ nome: String(p.diagnostico).trim(), cid: p.cid || '', principal: true });
    outros(p).forEach(function (x) { l.push({ nome: String(x.nome).trim(), cid: normCid(x.cid) || '', principal: false }); });
    return l;
  }
  window.zeloCpDiagnosticos = diagnosticos;
  function lerMemoria() { try { return JSON.parse(localStorage.getItem(MEM_LS) || '{}') || {}; } catch (e) { return {}; } }
  function lembrar(nome, cid) {
    nome = String(nome || '').trim(); cid = normCid(cid);
    if (!nome) return;
    var m = lerMemoria(), k = norm(nome);
    var e = m[k] || { nome: nome, cid: '', usos: 0 };
    e.nome = nome; if (cid) e.cid = cid; e.usos = (e.usos || 0) + 1;
    m[k] = e;
    try { localStorage.setItem(MEM_LS, JSON.stringify(m)); } catch (err) {}
  }
  function conhecidos() {
    var porChave = {};
    CID.forEach(function (c) { porChave[norm(c[1])] = { nome: c[1], cid: c[0], usos: 0 }; });
    var m = lerMemoria();
    Object.keys(m).forEach(function (k) { porChave[k] = Object.assign({}, porChave[k] || {}, m[k], { usos: (m[k].usos || 0) + 1000 }); });
    lista().forEach(function (p) {
      [[p.diagnostico, p.cid], [p.diagnosticoFinal, p.cidFinal]].concat(outros(p).map(function (x) { return [x.nome, x.cid]; })).forEach(function (par) {
        if (!par[0]) return;
        var k = norm(par[0]), e = porChave[k] || { nome: String(par[0]).trim(), cid: '', usos: 0 };
        if (par[1]) e.cid = normCid(par[1]);
        e.usos = (e.usos || 0) + 1000; porChave[k] = e;
      });
    });
    return Object.keys(porChave).map(function (k) { return porChave[k]; }).sort(function (a, b) { return (b.usos || 0) - (a.usos || 0) || a.nome.localeCompare(b.nome); });
  }
  function cidDe(nome) {
    var k = norm(nome); if (!k) return '';
    var e = conhecidos().filter(function (x) { return norm(x.nome) === k; })[0];
    return e ? e.cid || '' : '';
  }
  function nomeDe(cid) {
    cid = normCid(cid); if (!cid) return '';
    var e = conhecidos().filter(function (x) { return normCid(x.cid) === cid; })[0];
    return e ? e.nome : '';
  }

  // ── Campos CID nos formulários ──
  function preencherListas() {
    var todos = conhecidos();
    var opDiag = todos.map(function (e) { return '<option value="' + esc(e.nome) + '">' + esc(e.cid ? e.cid + ' · ' + e.nome : e.nome) + '</option>'; }).join('');
    var opCid = todos.filter(function (e) { return e.cid; }).map(function (e) { return '<option value="' + esc(e.cid) + '">' + esc(e.nome) + '</option>'; }).join('');
    ['diagnosticosList', 'diagnosticosListEdit', 'cpDiagFinalList'].forEach(function (id) { var dl = document.getElementById(id); if (dl) dl.innerHTML = opDiag; });
    var dc = document.getElementById('cpCidList'); if (dc) dc.innerHTML = opCid;
  }
  function ligarPar(diagId, cidId) {
    var d = document.getElementById(diagId), c = document.getElementById(cidId);
    if (!d || !c) return;
    d.addEventListener('change', function () { if (!c.value.trim()) { var x = cidDe(d.value); if (x) c.value = x; } });
    d.addEventListener('input', function () { var x = cidDe(d.value); if (x && !c.dataset.manual) c.value = x; });
    c.addEventListener('input', function () {
      c.dataset.manual = c.value ? '1' : '';
      var up = normCid(c.value); if (c.value !== up && /[a-z]/.test(c.value)) c.value = up;
      if (!d.value.trim()) { var n = nomeDe(up); if (n) d.value = n; }
    });
    c.addEventListener('change', function () { c.value = normCid(c.value); if (!d.value.trim()) { var n = nomeDe(c.value); if (n) d.value = n; } });
  }
  function campoCid(id, rotulo) {
    var f = document.createElement('div'); f.className = 'field cp-cid-field';
    f.innerHTML = '<label>' + rotulo + '</label><input type="text" id="' + id + '" list="cpCidList" placeholder="Ex.: S72.0" autocomplete="off" maxlength="8">';
    return f;
  }
  // ── Outros diagnósticos (formulários Novo e Atualizar) ──
  var extras = { f: [], e: [] };
  function desenharExtras(k) {
    var box = document.getElementById(k + 'DiagExtraLista'); if (!box) return;
    box.innerHTML = extras[k].length ? extras[k].map(function (x, i) {
      return '<span class="cp-dx">' + esc(x.nome) + (x.cid ? ' <code>' + esc(x.cid) + '</code>' : '') + '<button type="button" data-k="' + k + '" data-i="' + i + '" title="Retirar este diagnóstico">×</button></span>';
    }).join('') : '<span class="cp-dx-vazio">Sem outros diagnósticos.</span>';
  }
  function juntarExtra(k) {
    var d = document.getElementById(k + 'DiagExtra'), c = document.getElementById(k + 'CidExtra');
    var nome = String(d && d.value || '').trim(); if (!nome) return false;
    var cid = normCid(c && c.value) || cidDe(nome) || '';
    var principal = String((document.getElementById(k + 'Diagnostico') || {}).value || '').trim();
    var repetido = norm(nome) === norm(principal) || extras[k].some(function (x) { return norm(x.nome) === norm(nome); });
    if (!repetido) extras[k].push({ nome: nome, cid: cid });
    d.value = ''; if (c) { c.value = ''; c.dataset.manual = ''; }
    desenharExtras(k); return true;
  }
  function blocoExtras(k) {
    var inp = document.getElementById(k + 'Diagnostico'); if (!inp || document.getElementById(k + 'DiagExtra')) return;
    var linha = inp.closest('.form-row'); if (!linha) return;
    var dica = document.createElement('div'); dica.className = 'cp-dx-dica';
    dica.textContent = 'Não encontra o diagnóstico na lista? Escreva-o como quiser: fica guardado e passa a aparecer na lista, e conta na estatística.';
    linha.parentNode.insertBefore(dica, linha.nextSibling);
    var bloco = document.createElement('div'); bloco.className = 'cp-dx-bloco';
    bloco.innerHTML = '<label>Outros diagnósticos (opcional)</label><div class="cp-dx-lista" id="' + k + 'DiagExtraLista"></div>' +
      '<div class="cp-dx-add"><input type="text" id="' + k + 'DiagExtra" list="diagnosticosList" placeholder="Outro diagnóstico" autocomplete="off">' +
      '<input type="text" id="' + k + 'CidExtra" list="cpCidList" placeholder="CID-10" maxlength="8" autocomplete="off" class="cp-dx-cid">' +
      '<button type="button" class="btn btn-secondary" data-add="' + k + '">+ Adicionar</button></div>';
    dica.parentNode.insertBefore(bloco, dica.nextSibling);
    ligarPar(k + 'DiagExtra', k + 'CidExtra');
    bloco.addEventListener('click', function (e) {
      var a = e.target.closest('[data-add]'); if (a) { juntarExtra(k); return; }
      var r = e.target.closest('button[data-i]'); if (r) { extras[k].splice(+r.dataset.i, 1); desenharExtras(k); }
    });
    document.getElementById(k + 'DiagExtra').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); juntarExtra(k); } });
    desenharExtras(k);
  }
  function inserirCampos() {
    if (document.getElementById('fCid')) return;
    var dl = document.createElement('datalist'); dl.id = 'cpCidList'; document.body.appendChild(dl);
    var dl2 = document.createElement('datalist'); dl2.id = 'cpDiagFinalList'; document.body.appendChild(dl2);
    [['fDiagnostico', 'fCid', 'CID-10'], ['eDiagnostico', 'eCid', 'CID-10'], ['fDiagnosticoFinal', 'fCidFinal', 'CID-10 (óbito)'], ['eDiagnosticoFinal', 'eCidFinal', 'CID-10 (óbito)']].forEach(function (t) {
      var inp = document.getElementById(t[0]); if (!inp) return;
      var campo = inp.closest('.field'), linha = campo && campo.parentNode;
      if (!linha) return;
      linha.appendChild(campoCid(t[1], t[2]));
      linha.classList.add('cp-linha-diag');
      if (/Final/.test(t[0])) { inp.setAttribute('list', 'cpDiagFinalList'); inp.placeholder = 'Causa / diagnóstico final'; }
      ligarPar(t[0], t[1]);
    });
    blocoExtras('f'); blocoExtras('e');
    var st = document.createElement('style');
    st.textContent = '.cp-dx-dica{font-size:.76rem;color:#64748B;margin:-6px 0 10px}.cp-dx-bloco{margin:0 0 14px;padding:10px 12px;border:1px dashed #CBD5E1;border-radius:12px;background:#F8FAFC}.cp-dx-bloco>label{display:block;font:700 .7rem Inter,Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#64748B;margin-bottom:6px}.cp-dx-lista{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}.cp-dx{display:inline-flex;align-items:center;gap:6px;background:#fff;border:1px solid #CBD5E1;border-radius:999px;padding:4px 6px 4px 11px;font:600 .8rem Inter,Arial,sans-serif;color:#1E293B}.cp-dx code{background:#E9EEF4;color:#3E5C87;border-radius:5px;padding:0 5px;font-size:.72rem}.cp-dx button{border:0;background:#FEE2E2;color:#B91C1C;width:20px;height:20px;border-radius:50%;cursor:pointer;font-weight:800;line-height:1}.cp-dx-vazio{font-size:.78rem;color:#94A3B8}.cp-dx-add{display:grid;grid-template-columns:1fr 110px auto;gap:8px}.cp-dx-add input{height:44px;border:1.5px solid #D5DEEA !important;border-radius:10px !important;background:#fff !important;padding:0 12px !important;font:500 .9rem Inter,Arial,sans-serif !important;box-sizing:border-box;width:100%}.cp-dx-add input:focus{outline:none;border-color:#3E5C87 !important;box-shadow:0 0 0 3px rgba(62,92,135,.15)}.cp-dx-add .btn{height:44px}.cp-dx-add .btn{white-space:nowrap}.cp-dx-cid{text-transform:uppercase;font-family:ui-monospace,Consolas,monospace !important}@media(max-width:560px){.cp-dx-add{grid-template-columns:1fr 90px}.cp-dx-add .btn{grid-column:1/-1}}' + '.modal-body .form-row.cp-linha-diag{grid-template-columns:3fr 1fr !important}@media(max-width:560px){.modal-body .form-row.cp-linha-diag{grid-template-columns:1fr !important}}.cp-cid-field input{text-transform:uppercase;font-family:ui-monospace,Consolas,monospace !important;letter-spacing:.04em}';
    document.head.appendChild(st);
    preencherListas();
  }

  // Grava o CID junto do paciente, sem mexer nas funções da página.
  function envolver(nome, antes, depois) {
    var f = window[nome];
    if (typeof f !== 'function' || f.__cpRel) return;
    var novo = function () { var ctx = antes ? antes() : null; var r = f.apply(this, arguments); try { if (depois) depois(ctx); } catch (e) { console.warn(e); } return r; };
    novo.__cpRel = true; window[nome] = novo;
  }
  function gravar() { try { saveData(); } catch (e) {} preencherListas(); }
  function ligarFuncoes() {
    envolver('addPaciente', function () {
      juntarExtra('f'); // um diagnóstico escrito mas não adicionado também conta
      return { nup: (document.getElementById('fNUP') || {}).value, cid: normCid((document.getElementById('fCid') || {}).value), diag: (document.getElementById('fDiagnostico') || {}).value, n: lista().length, extras: extras.f.slice() };
    }, function (c) {
      if (lista().length <= c.n) return; // não foi registado (faltava algo)
      var p = lista().filter(function (x) { return String(x.nup).trim() === String(c.nup).trim(); })[0];
      if (p) {
        p.cid = c.cid || cidDe(p.diagnostico) || ''; lembrar(p.diagnostico, p.cid);
        if (c.extras.length) p.outrosDiagnosticos = JSON.stringify(c.extras);
        c.extras.forEach(function (x) { lembrar(x.nome, x.cid); });
        gravar();
      }
      extras.f = []; desenharExtras('f');
      var ci = document.getElementById('fCid'); if (ci) { ci.value = ''; ci.dataset.manual = ''; }
    });
    envolver('editPaciente', null, function () {
      var p = lista().filter(function (x) { return x.n === editingPacienteN; })[0];
      var ci = document.getElementById('eCid'); if (ci) { ci.value = p ? (p.cid || '') : ''; ci.dataset.manual = p && p.cid ? '1' : ''; }
      var cf = document.getElementById('eCidFinal'); if (cf) { cf.value = p ? (p.cidFinal || '') : ''; cf.closest('.field').style.display = p && p.tipoSaida === 'Óbito' ? '' : 'none'; }
      extras.e = p ? outros(p).map(function (x) { return { nome: x.nome, cid: normCid(x.cid) }; }) : []; desenharExtras('e');
      var de = document.getElementById('eDiagExtra'); if (de) de.value = '';
    });
    envolver('updatePaciente', function () {
      juntarExtra('e');
      return { n: editingPacienteN, cid: normCid((document.getElementById('eCid') || {}).value), cidF: normCid((document.getElementById('eCidFinal') || {}).value), extras: extras.e.slice() };
    }, function (c) {
      if (editingPacienteN !== null) return; // não gravou
      var p = lista().filter(function (x) { return x.n === c.n; })[0];
      if (!p) return;
      p.cid = c.cid || cidDe(p.diagnostico) || '';
      if (p.tipoSaida === 'Óbito') p.cidFinal = c.cidF || cidDe(p.diagnosticoFinal) || '';
      lembrar(p.diagnostico, p.cid); if (p.diagnosticoFinal) lembrar(p.diagnosticoFinal, p.cidFinal);
      var novo = c.extras.length ? JSON.stringify(c.extras) : '';
      if (novo || p.outrosDiagnosticos) p.outrosDiagnosticos = novo;
      c.extras.forEach(function (x) { lembrar(x.nome, x.cid); });
      gravar();
    });
    envolver('addSaida', function () {
      return { n: parseInt((document.getElementById('fSaidaPaciente') || {}).value, 10), cidF: normCid((document.getElementById('fCidFinal') || {}).value) };
    }, function (c) {
      var p = lista().filter(function (x) { return x.n === c.n; })[0];
      if (!p || p.status !== 'saido' || p.tipoSaida !== 'Óbito') return;
      p.cidFinal = c.cidF || cidDe(p.diagnosticoFinal) || '';
      if (p.diagnosticoFinal) lembrar(p.diagnosticoFinal, p.cidFinal);
      gravar();
      var cf = document.getElementById('fCidFinal'); if (cf) cf.value = '';
    });
    envolver('openModal', null, function () { preencherListas(); });
  }

  // ── Análise do período ──
  var FAIXAS = ['0–14 anos', '15–24 anos', '25–44 anos', '45–64 anos', '65 ou mais'];
  function faixa(idade) {
    if (idade === null || idade === undefined || idade === '') return null;
    idade = Number(idade);
    if (isNaN(idade)) return null;
    if (idade <= 14) return '0–14 anos'; if (idade <= 24) return '15–24 anos'; if (idade <= 44) return '25–44 anos';
    if (idade <= 64) return '45–64 anos';
    return '65 ou mais';
  }
  // Resumo por género: entradas, altas, óbitos, transferências, saídas e internados no fim.
  function resumoGenero(a) {
    var c = function (l) { var r = { F: 0, M: 0, N: 0 }; l.forEach(function (p) { r[genero(p)]++; }); r.T = l.length; return r; };
    return [['Entradas', c(a.entradas)], ['Altas', c(a.altas)], ['Óbitos', c(a.obitos)], ['Transferências', c(a.transf)], ['Total de saídas', c(a.saidas)], ['Internados no fim do período', c(a.internados)]];
  }
  // Saídas por faixa etária e tipo.
  function saidasFaixa(saidas) {
    var t = {};
    FAIXAS.concat(['Não especificado']).forEach(function (f) { t[f] = { alta: 0, obito: 0, transf: 0, total: 0 }; });
    saidas.forEach(function (p) {
      var f = faixa(p.idade) || 'Não especificado';
      if (p.tipoSaida === 'Alta Vivo') t[f].alta++; else if (p.tipoSaida === 'Óbito') t[f].obito++; else if (p.tipoSaida === 'Transferência') t[f].transf++;
      t[f].total++;
    });
    return t;
  }
  function genero(p) { var g = norm(p.genero); return g.indexOf('mas') === 0 ? 'M' : (g.indexOf('fem') === 0 ? 'F' : 'N'); }
  function frequencia(pacientes, campoDiag, campoCid) {
    var grupos = {};
    pacientes.forEach(function (p) {
      var nome = String(p[campoDiag] || '').trim();
      var cid = normCid(p[campoCid]) || cidDe(nome);
      if (!nome && !cid) { nome = 'Não especificado'; }
      var k = cid ? 'cid:' + cid : 'txt:' + norm(nome);
      var g = grupos[k] || (grupos[k] = { cid: cid, nomes: {}, n: 0, M: 0, F: 0 });
      g.n++; g.nomes[nome] = (g.nomes[nome] || 0) + 1;
      var ge = genero(p); if (ge === 'M') g.M++; else if (ge === 'F') g.F++;
    });
    var total = pacientes.length || 1;
    return Object.keys(grupos).map(function (k) {
      var g = grupos[k];
      var nome = Object.keys(g.nomes).sort(function (a, b) { return g.nomes[b] - g.nomes[a]; })[0] || '';
      if (g.cid && !nome) nome = nomeDe(g.cid);
      return { diag: nome || nomeDe(g.cid) || 'Não especificado', cid: g.cid || '—', n: g.n, M: g.M, F: g.F, pct: g.n / total * 100 };
    }).sort(function (a, b) { return b.n - a.n || a.diag.localeCompare(b.diag); });
  }
  function faixaGenero(pacientes, extra) {
    var t = {};
    FAIXAS.concat(['Não especificado']).forEach(function (f) { t[f] = { M: 0, F: 0, N: 0, total: 0, a48: 0, d48: 0 }; });
    pacientes.forEach(function (p) {
      var f = faixa(p.idade) || 'Não especificado', g = genero(p);
      t[f][g]++; t[f].total++;
      if (extra) { if (p.subtipo === 'Óbito <48h') t[f].a48++; else if (p.subtipo === 'Óbito >48h') t[f].d48++; }
    });
    return t;
  }
  function periodo() {
    var r = typeof getRelatorioRange === 'function' ? getRelatorioRange() : null;
    if (!r) return null;
    var dia = function (v) { return String(v || '').slice(0, 10); };
    var P = lista();
    var entradas = P.filter(function (p) { return p.dataEntrada && dia(p.dataEntrada) >= r.start && dia(p.dataEntrada) <= r.end; });
    var saidas = P.filter(function (p) { return p.status === 'saido' && p.dataSaida && dia(p.dataSaida) >= r.start && dia(p.dataSaida) <= r.end; });
    var internados = P.filter(function (p) { return p.dataEntrada && dia(p.dataEntrada) <= r.end && (p.status === 'internado' || (p.dataSaida && dia(p.dataSaida) > r.end)); });
    var obitos = saidas.filter(function (p) { return p.tipoSaida === 'Óbito'; });
    var altas = saidas.filter(function (p) { return p.tipoSaida === 'Alta Vivo'; });
    var transf = saidas.filter(function (p) { return p.tipoSaida === 'Transferência'; });
    var perm = saidas.length ? saidas.reduce(function (s, p) { return s + (typeof daysBetween === 'function' ? daysBetween(p.dataEntrada, p.dataSaida) : 0); }, 0) / saidas.length : null;
    var tiposSaida = {};
    saidas.forEach(function (p) {
      var tipo = p.tipoSaida === 'Alta Vivo' ? 'Alta' : (p.tipoSaida || '—');
      var k = tipo + '|' + (p.subtipo || '—');
      tiposSaida[k] = (tiposSaida[k] || 0) + 1;
    });
    var prov = {};
    entradas.forEach(function (p) { var k = p.proveniencia || 'Não especificada'; prov[k] = (prov[k] || 0) + 1; });
    var gen = function (l) { return { M: l.filter(function (p) { return genero(p) === 'M'; }).length, F: l.filter(function (p) { return genero(p) === 'F'; }).length }; };
    return {
      r: r, entradas: entradas, saidas: saidas, internados: internados, obitos: obitos, altas: altas, transf: transf, perm: perm,
      obitos48: obitos.filter(function (p) { return p.subtipo === 'Óbito <48h'; }).length,
      obitosMais48: obitos.filter(function (p) { return p.subtipo === 'Óbito >48h'; }).length,
      tiposSaida: Object.keys(tiposSaida).map(function (k) { var a = k.split('|'); return { tipo: a[0], det: a[1], n: tiposSaida[k] }; })
        .sort(function (a, b) { return a.tipo.localeCompare(b.tipo) || b.n - a.n; }),
      diagEntradas: frequencia([].concat.apply([], entradas.map(function (p) { return diagnosticos(p).map(function (x) { return Object.assign({}, p, { diagnostico: x.nome, cid: x.cid }); }); })), 'diagnostico', 'cid'),
      nDiagEntradas: entradas.reduce(function (s, p) { return s + diagnosticos(p).length; }, 0),
      diagObitos: frequencia(obitos, 'diagnosticoFinal', 'cidFinal').map(function (x, i, arr) { return x; }),
      faixaEntradas: faixaGenero(entradas), faixaObitos: faixaGenero(obitos, true),
      proveniencia: Object.keys(prov).map(function (k) { return [k, prov[k]]; }).sort(function (a, b) { return b[1] - a[1]; }),
      genEntradas: gen(entradas), genObitos: gen(obitos), genSaidas: gen(saidas)
    };
  }
  // Óbitos: sem diagnóstico final, conta o diagnóstico de entrada.
  function diagObitos(obitos) {
    return frequencia(obitos.map(function (p) {
      return p.diagnosticoFinal ? p : Object.assign({}, p, { diagnosticoFinal: p.diagnostico, cidFinal: p.cid });
    }), 'diagnosticoFinal', 'cidFinal');
  }
  function pct(v) { return (v || 0).toFixed(1).replace('.', ',') + '%'; }

  // ── Relatório no ecrã ──
  var CSS = [
    '#relatorioView .form-card{background:var(--cpx-sf,#fff) !important;border:1px solid var(--cpx-br,#E3E8F0) !important;border-radius:14px !important;box-shadow:0 1px 2px rgba(15,23,42,.04) !important;padding:16px 18px !important}',
    '#relatorioView .form-card label{font:700 .68rem Inter,Arial,sans-serif !important;letter-spacing:.08em !important;color:#64748B !important}',
    '#relatorioView .form-card select,#relatorioView .form-card input{height:42px;border:1.5px solid #D5DEEA !important;border-radius:10px !important;background:#F8FAFC !important;padding:0 12px !important;font:600 .9rem Inter,Arial,sans-serif !important}',
    '#relatorioView .form-card .btn{height:42px;border-radius:10px !important;padding:0 18px !important;font:700 .88rem Inter,Arial,sans-serif !important;text-transform:none !important;letter-spacing:0 !important;display:inline-flex;align-items:center;gap:8px}',
    '#relatorioView .form-card .btn-secondary{background:#fff !important;color:#B91C1C !important;border:1.5px solid #FCA5A5 !important}',
    '#relatorioView .form-card .btn-secondary:hover{background:#FEF2F2 !important}',
    '#relatorioPeriodoLabel{color:#2B415E !important;font:800 .95rem Inter,Arial,sans-serif !important;text-transform:none !important;margin-top:14px !important}',
    '.cprel{display:grid;grid-template-columns:repeat(auto-fit,minmax(380px,1fr));gap:14px;margin:16px 0}',
    '.cprel-sec{background:var(--cpx-sf,#fff);border:1px solid var(--cpx-br,#E3E8F0);border-radius:14px;overflow:hidden;box-shadow:0 1px 2px rgba(15,23,42,.04)}',
    '.cprel-sec.largo{grid-column:1/-1}',
    '.cprel-h{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px dashed var(--cpx-br,#E3E8F0);font:800 .9rem Inter,Arial,sans-serif;color:var(--cpx-tx,#1F2937)}',
    '.cprel-h .n{width:26px;height:26px;border-radius:8px;background:#3E5C87;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:.78rem}',
    '.cprel-h .n.vermelho{background:#B91C1C}',
    '.cprel-h small{margin-left:auto;font:600 .72rem Inter,Arial,sans-serif;color:#64748B}',
    '.cprel table{width:100%;border-collapse:collapse;font:500 .84rem Inter,Arial,sans-serif}',
    '.cprel th{background:#E9EEF4;color:#3E5C87;text-align:left;padding:8px 12px;font-size:.66rem;letter-spacing:.06em;text-transform:uppercase}',
    '.cprel td{padding:8px 12px;border-bottom:1px solid #EEF2F7;color:#1F2937}',
    '.cprel td.num,.cprel th.num{text-align:center;font-family:ui-monospace,Consolas,monospace}',
    '.cprel tr.tot td{background:#F1F5F9;font-weight:800}',
    '.cprel code{background:#E9EEF4;color:#3E5C87;border-radius:6px;padding:1px 6px;font-size:.78rem}',
    '.cprel .barra{height:6px;border-radius:4px;background:#E9EEF4;overflow:hidden;min-width:60px}.cprel .barra i{display:block;height:100%;background:#3E5C87}',
    '.cprel .vazio{padding:16px;color:#64748B;font-size:.85rem}',
    '.cprel-gen{display:flex;gap:10px;padding:12px 16px;flex-wrap:wrap}',
    '.cprel-gen div{flex:1;min-width:120px;border-radius:12px;padding:10px 12px;background:#F8FAFC;border:1px solid #E3E8F0}',
    '.cprel-gen b{display:block;font:700 1.35rem ui-monospace,Consolas,monospace;color:#2B415E}',
    '.cprel-gen span{font:700 .64rem Inter,Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#64748B}',
    'html[data-zelo-theme="dark"] .cprel th{background:#1B2638;color:#BFD3EE}html[data-zelo-theme="dark"] .cprel td{color:#E6ECF5;border-color:#1F2A3D}',
    'html[data-zelo-theme="dark"] .cprel tr.tot td,html[data-zelo-theme="dark"] .cprel-gen div{background:#0F1828;border-color:#1F2A3D}',
    '.cprel-graf{padding:14px 16px}',
    '.cprel-bar{display:grid;grid-template-columns:92px 1fr 40px;align-items:center;gap:10px;margin:9px 0;font:600 .8rem Inter,Arial,sans-serif;color:#334155}',
    '.cprel-bb{display:flex;height:18px;border-radius:5px;overflow:hidden;background:#F1F5F9}.cprel-bb i{display:block;height:100%}',
    '.cprel-bar b{font-family:ui-monospace,Consolas,monospace;text-align:right}',
    '.cprel-lg{display:flex;gap:14px;font:600 .72rem Inter,Arial,sans-serif;color:#64748B;margin-top:10px}',
    '.cprel-lg span::before{content:"";display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px;vertical-align:-1px;background:var(--c)}',
    'html[data-zelo-theme="dark"] .cprel-bar{color:#E6ECF5}html[data-zelo-theme="dark"] .cprel-bb{background:#0F1828}',
    '@media(max-width:560px){.cprel{grid-template-columns:1fr}}'
  ].join('\n');

  function sec(n, titulo, corpo, opts) {
    opts = opts || {};
    return '<section class="cprel-sec' + (opts.largo ? ' largo' : '') + '"><div class="cprel-h"><span class="n' + (opts.vermelho ? ' vermelho' : '') + '">' + n + '</span>' + titulo + (opts.nota ? '<small>' + opts.nota + '</small>' : '') + '</div>' + corpo + '</section>';
  }
  function tabelaDiag(linhas) {
    if (!linhas.length) return '<div class="vazio">Sem registos neste período.</div>';
    var max = linhas[0].n || 1;
    return '<table><thead><tr><th>Diagnóstico</th><th>CID-10</th><th class="num">Nº</th><th class="num">M</th><th class="num">F</th><th class="num">%</th><th></th></tr></thead><tbody>' +
      linhas.map(function (l) {
        return '<tr><td>' + esc(l.diag) + '</td><td>' + (l.cid !== '—' ? '<code>' + esc(l.cid) + '</code>' : '—') + '</td><td class="num"><b>' + l.n + '</b></td><td class="num">' + l.M + '</td><td class="num">' + l.F + '</td><td class="num">' + pct(l.pct) + '</td><td><div class="barra"><i style="width:' + Math.round(l.n / max * 100) + '%"></i></div></td></tr>';
      }).join('') + '</tbody></table>';
  }
  function tabelaFaixa(t, obitos) {
    var linhas = FAIXAS.concat(['Não especificado']).filter(function (f) { return f !== 'Não especificado' || t[f].total; });
    var tot = { M: 0, F: 0, N: 0, total: 0, a48: 0, d48: 0 };
    linhas.forEach(function (f) { Object.keys(tot).forEach(function (k) { tot[k] += t[f][k]; }); });
    var cab = '<tr><th>Faixa etária</th><th class="num">Masculino</th><th class="num">Feminino</th>' + (tot.N ? '<th class="num">Não esp.</th>' : '') + '<th class="num">Total</th>' + (obitos ? '<th class="num">&lt;48h</th><th class="num">&gt;48h</th>' : '') + '</tr>';
    var lin = function (nome, v, classe) {
      return '<tr' + (classe ? ' class="' + classe + '"' : '') + '><td>' + nome + '</td><td class="num">' + v.M + '</td><td class="num">' + v.F + '</td>' + (tot.N ? '<td class="num">' + v.N + '</td>' : '') + '<td class="num"><b>' + v.total + '</b></td>' + (obitos ? '<td class="num">' + v.a48 + '</td><td class="num">' + v.d48 + '</td>' : '') + '</tr>';
    };
    return '<table><thead>' + cab + '</thead><tbody>' + linhas.map(function (f) { return lin(f, t[f]); }).join('') + lin('TOTAL', tot, 'tot') + '</tbody></table>';
  }
  // Gráfico de barras mulheres / homens por faixa etária.
  function graficoFaixa(t) {
    var fx = FAIXAS.concat(['Não especificado']).filter(function (f) { return f !== 'Não especificado' || t[f].total; });
    var max = Math.max.apply(null, fx.map(function (f) { return t[f].total; }).concat([1]));
    return '<div class="cprel-graf">' + fx.map(function (f) {
      var v = t[f];
      return '<div class="cprel-bar"><span>' + f + '</span><div class="cprel-bb"><i style="width:' + (v.F / max * 100) + '%;background:#DB2777" title="Mulheres: ' + v.F + '"></i><i style="width:' + (v.M / max * 100) + '%;background:#2563EB" title="Homens: ' + v.M + '"></i></div><b>' + v.total + '</b></div>';
    }).join('') + '<div class="cprel-lg"><span style="--c:#DB2777">Mulheres</span><span style="--c:#2563EB">Homens</span></div></div>';
  }
  function renderAnalise() {
    var a = periodo(); if (!a) return;
    var alvo = document.getElementById('cpRelAnalise');
    if (!alvo) {
      alvo = document.createElement('div'); alvo.id = 'cpRelAnalise'; alvo.className = 'cprel';
      var grid = document.querySelector('#relatorioView .stats-grid');
      if (grid && grid.parentNode) grid.parentNode.insertBefore(alvo, grid.nextSibling);
      else { var v = document.getElementById('relatorioView'); if (!v) return; v.appendChild(alvo); }
    }
    var dObitos = diagObitos(a.obitos);
    var rg = resumoGenero(a), temN = rg.some(function (l) { return l[1].N; });
    var gen = '<table><thead><tr><th>Movimento</th><th class="num">Mulheres</th><th class="num">Homens</th>' + (temN ? '<th class="num">Não esp.</th>' : '') + '<th class="num">Total</th></tr></thead><tbody>' +
      rg.map(function (l, i) { return '<tr' + (i === 4 ? ' class="tot"' : '') + '><td>' + l[0] + '</td><td class="num">' + l[1].F + '</td><td class="num">' + l[1].M + '</td>' + (temN ? '<td class="num">' + l[1].N + '</td>' : '') + '<td class="num"><b>' + l[1].T + '</b></td></tr>'; }).join('') + '</tbody></table>';
    var sf = saidasFaixa(a.saidas);
    var sfl = FAIXAS.concat(['Não especificado']).filter(function (f) { return f !== 'Não especificado' || sf[f].total; });
    var sft = { alta: 0, obito: 0, transf: 0, total: 0 }; sfl.forEach(function (f) { Object.keys(sft).forEach(function (k) { sft[k] += sf[f][k]; }); });
    var tabSf = a.saidas.length ? '<table><thead><tr><th>Faixa etária</th><th class="num">Altas</th><th class="num">Óbitos</th><th class="num">Transf.</th><th class="num">Total</th></tr></thead><tbody>' +
      sfl.map(function (f) { var v = sf[f]; return '<tr><td>' + f + '</td><td class="num">' + v.alta + '</td><td class="num">' + v.obito + '</td><td class="num">' + v.transf + '</td><td class="num"><b>' + v.total + '</b></td></tr>'; }).join('') +
      '<tr class="tot"><td>TOTAL</td><td class="num">' + sft.alta + '</td><td class="num">' + sft.obito + '</td><td class="num">' + sft.transf + '</td><td class="num">' + sft.total + '</td></tr></tbody></table>' : '<div class="vazio">Sem saídas neste período.</div>';
    var tipos = a.tiposSaida.length ? '<table><thead><tr><th>Tipo de saída</th><th>Detalhe</th><th class="num">Nº</th><th class="num">%</th></tr></thead><tbody>' +
      a.tiposSaida.map(function (t) { return '<tr><td>' + esc(t.tipo) + '</td><td>' + esc(t.det) + '</td><td class="num"><b>' + t.n + '</b></td><td class="num">' + pct(t.n / (a.saidas.length || 1) * 100) + '</td></tr>'; }).join('') +
      '<tr class="tot"><td>TOTAL</td><td></td><td class="num">' + a.saidas.length + '</td><td class="num">100%</td></tr></tbody></table>' : '<div class="vazio">Sem saídas neste período.</div>';
    var prov = a.proveniencia.length ? '<table><thead><tr><th>Proveniência</th><th class="num">Nº</th></tr></thead><tbody>' +
      a.proveniencia.map(function (p) { return '<tr><td>' + esc(p[0]) + '</td><td class="num"><b>' + p[1] + '</b></td></tr>'; }).join('') + '</tbody></table>' : '<div class="vazio">Sem entradas neste período.</div>';
    alvo.innerHTML =
      sec(1, 'Resumo por género', gen, { nota: 'Mulheres e homens' }) +
      sec('▮', 'Entradas por faixa etária e género', a.entradas.length ? graficoFaixa(a.faixaEntradas) : '<div class="vazio">Sem entradas neste período.</div>', { nota: a.entradas.length + ' entrada(s)' }) +
      sec(2, 'Diagnósticos das entradas — por frequência', tabelaDiag(a.diagEntradas), { largo: true, nota: a.entradas.length + ' entrada(s) · ' + a.nDiagEntradas + ' diagnóstico(s), incluindo os secundários' }) +
      sec(3, 'Óbitos por diagnóstico — por frequência', tabelaDiag(dObitos), { largo: true, vermelho: true, nota: a.obitos.length + ' óbito(s)' }) +
      sec(4, 'Entradas por faixa etária e género', tabelaFaixa(a.faixaEntradas)) +
      sec(5, 'Óbitos por faixa etária e género', a.obitos.length ? tabelaFaixa(a.faixaObitos, true) : '<div class="vazio">Sem óbitos neste período.</div>', { vermelho: true }) +
      sec(6, 'Saídas por faixa etária e tipo', tabSf) +
      sec(7, 'Saídas por tipo', tipos) +
      sec(8, 'Proveniência das entradas', prov);
  }

  // ── PDF (estrutura da Consulta Externa) ──
  function servico() { var t = document.title.split('—'); return t[t.length - 1].trim(); }
  // Barras mulheres (rosa) / homens (azul) por faixa etária, desenhadas no PDF.
  function graficoPDF(y, t) {
    var fx = FAIXAS.concat(['Não especificado']).filter(function (f) { return f !== 'Não especificado' || t[f].total; });
    var d = pdf_.d, M = pdf_.M, CW = pdf_.CW;
    y = pdf_.quebra(y, fx.length * 7 + 14);
    var max = Math.max.apply(null, fx.map(function (f) { return t[f].total; }).concat([1]));
    var x0 = M + 26, w = CW - 40;
    d.setFontSize(8);
    fx.forEach(function (f) {
      var v = t[f];
      d.setTextColor(51, 65, 85); d.setFont('helvetica', 'normal'); d.text(f.replace(/–/g, '-'), M, y + 3.6);
      d.setFillColor(241, 245, 249); d.rect(x0, y, w, 5, 'F');
      var wf = v.F / max * w, wm = v.M / max * w;
      if (wf) { d.setFillColor(219, 39, 119); d.rect(x0, y, wf, 5, 'F'); }
      if (wm) { d.setFillColor(37, 99, 235); d.rect(x0 + wf, y, wm, 5, 'F'); }
      d.setFont('helvetica', 'bold'); d.text(String(v.total), M + CW, y + 3.6, { align: 'right' });
      y += 7;
    });
    d.setFont('helvetica', 'normal'); d.setFontSize(7.5);
    d.setFillColor(219, 39, 119); d.rect(x0, y + 1, 3, 3, 'F'); d.setTextColor(71, 85, 105); d.text('Mulheres', x0 + 4.5, y + 3.6);
    d.setFillColor(37, 99, 235); d.rect(x0 + 24, y + 1, 3, 3, 'F'); d.text('Homens', x0 + 28.5, y + 3.6);
    d.setTextColor(0, 0, 0);
    return y + 10;
  }
  var pdf_;
  function exportarPDF() {
    var a = periodo(); if (!a) return;
    if (!window.ZeloPDF || !window.jspdf) { if (typeof showFeedback === 'function') showFeedback('Não foi possível carregar o gerador de PDF', 'error'); return; }
    var TIPOS = { diario: 'Diário', semanal: 'Semanal', mensal: 'Mensal', trimestral: 'Trimestral', semestral: 'Semestral', anual: 'Anual' };
    var tipo = TIPOS[(document.getElementById('relatorioTipo') || {}).value] || '';
    var pdf = ZeloPDF.criar(), CW = pdf.CW, y; pdf_ = pdf;
    var fd = function (v) { return typeof formatDate === 'function' ? formatDate(v) : String(v || '').slice(0, 10); };
    var dias = function (p) { return typeof daysBetween === 'function' ? daysBetween(p.dataEntrada, p.dataSaida) + ' d' : ''; };
    y = pdf.cab('Controlo de Pacientes — ' + servico(), 'Relatório ' + tipo + ' · Período: ' + a.r.display);

    y = pdf.secT(y, '1. Indicadores Gerais');
    y = pdf.kv(y, [['Entradas', a.entradas.length], ['Saídas', a.saidas.length], ['Internados no fim', a.internados.length]]);
    y = pdf.kv(y, [['Altas', a.altas.length], ['Óbitos', a.obitos.length], ['Transferências', a.transf.length], ['Permanência média', a.perm == null ? '—' : a.perm.toFixed(1).replace('.', ',') + ' dias']]);
    var taxa = a.saidas.length ? a.obitos.length / a.saidas.length * 100 : 0;
    y = pdf.txt(y, 'Resumo', 'No período, entraram ' + a.entradas.length + ' doente(s) (' + a.genEntradas.M + ' do sexo masculino e ' + a.genEntradas.F + ' do feminino) e saíram ' + a.saidas.length +
      ': ' + a.altas.length + ' alta(s), ' + a.transf.length + ' transferência(s) e ' + a.obitos.length + ' óbito(s) (' + a.obitos48 + ' com menos de 48 h e ' + a.obitosMais48 + ' com mais de 48 h)' +
      (a.saidas.length ? ', uma taxa de mortalidade de ' + pct(taxa) + ' das saídas.' : '.'));

    y = pdf.secT(y, '2. Resumo por Género');
    (function () {
      var rg = resumoGenero(a), temN = rg.some(function (l) { return l[1].N; });
      var cols = ['Movimento', 'Mulheres', 'Homens'].concat(temN ? ['Não esp.'] : []).concat(['Total']);
      var larg = cols.map(function (c, i) { return i === 0 ? CW - (cols.length - 1) * 26 : 26; });
      y = pdf.tabela(y, cols, larg, rg.map(function (l) { return [l[0], String(l[1].F), String(l[1].M)].concat(temN ? [String(l[1].N)] : []).concat([String(l[1].T)]); }));
    })();

    y = pdf.secT(y, '3. Saídas por Tipo');
    if (a.tiposSaida.length) y = pdf.tabela(y, ['Tipo de saída', 'Detalhe', 'Nº', '%'], [45, CW - 95, 25, 25],
      a.tiposSaida.map(function (t) { return [t.tipo, t.det, String(t.n), pct(t.n / a.saidas.length * 100)]; }).concat([['TOTAL', '', String(a.saidas.length), '100%']]));
    else y = pdf.txt(y, ' ', 'Sem saídas registadas neste período.');

    var tabDiag = function (y, linhas, vazio) {
      if (!linhas.length) return pdf.txt(y, ' ', vazio);
      var tot = linhas.reduce(function (s, l) { return s + l.n; }, 0);
      return pdf.tabela(y, ['Diagnóstico', 'CID-10', 'Nº', 'M', 'F', '%'], [CW - 90, 22, 17, 17, 17, 17],
        linhas.map(function (l) { return [l.diag, l.cid, String(l.n), String(l.M), String(l.F), pct(l.pct)]; })
          .concat([['TOTAL', '', String(tot), String(linhas.reduce(function (s, l) { return s + l.M; }, 0)), String(linhas.reduce(function (s, l) { return s + l.F; }, 0)), '100%']]));
    };
    y = pdf.secT(y, '4. Diagnósticos das Entradas — por Frequência');
    y = tabDiag(y, a.diagEntradas, 'Sem entradas neste período.');
    y = pdf.secT(y, '5. Óbitos por Diagnóstico — por Frequência');
    y = tabDiag(y, diagObitos(a.obitos), 'Sem óbitos neste período.');

    var tabFaixa = function (y, t, obitos) {
      var fx = FAIXAS.concat(['Não especificado']).filter(function (f) { return f !== 'Não especificado' || t[f].total; });
      var tot = { M: 0, F: 0, N: 0, total: 0, a48: 0, d48: 0 };
      fx.forEach(function (f) { Object.keys(tot).forEach(function (k) { tot[k] += t[f][k]; }); });
      var cols = ['Faixa Etária', 'Masculino', 'Feminino'].concat(tot.N ? ['Não Especif.'] : []).concat(['Total']).concat(obitos ? ['<48h', '>48h'] : []);
      var larg = cols.map(function (c, i) { return i === 0 ? 50 : 25; });
      var lin = function (nome, v) { return [nome, String(v.M), String(v.F)].concat(tot.N ? [String(v.N)] : []).concat([String(v.total)]).concat(obitos ? [String(v.a48), String(v.d48)] : []); };
      return pdf.tabela(y, cols, larg, fx.map(function (f) { return lin(f, t[f]); }).concat([lin('TOTAL GERAL', tot)]));
    };
    y = pdf.secT(y, '6. Entradas por Faixa Etária e Género');
    y = a.entradas.length ? tabFaixa(y, a.faixaEntradas) : pdf.txt(y, ' ', 'Sem entradas neste período.');
    if (a.entradas.length) y = graficoPDF(y, a.faixaEntradas);
    y = pdf.secT(y, '7. Óbitos por Faixa Etária e Género');
    y = a.obitos.length ? tabFaixa(y, a.faixaObitos, true) : pdf.txt(y, ' ', 'Sem óbitos neste período.');

    y = pdf.secT(y, '8. Saídas por Faixa Etária e Tipo');
    if (a.saidas.length) {
      var sf = saidasFaixa(a.saidas);
      var sfl = FAIXAS.concat(['Não especificado']).filter(function (f) { return f !== 'Não especificado' || sf[f].total; });
      var sft = { alta: 0, obito: 0, transf: 0, total: 0 }; sfl.forEach(function (f) { Object.keys(sft).forEach(function (k) { sft[k] += sf[f][k]; }); });
      var lf = function (n, v) { return [n, String(v.alta), String(v.obito), String(v.transf), String(v.total)]; };
      y = pdf.tabela(y, ['Faixa Etária', 'Altas', 'Óbitos', 'Transferências', 'Total'], [CW - 104, 26, 26, 26, 26], sfl.map(function (f) { return lf(f, sf[f]); }).concat([lf('TOTAL', sft)]));
    } else y = pdf.txt(y, ' ', 'Sem saídas neste período.');

    y = pdf.secT(y, '9. Proveniência das Entradas');
    y = a.proveniencia.length ? pdf.tabela(y, ['Proveniência', 'Nº'], [CW - 30, 30], a.proveniencia.map(function (p) { return [p[0], String(p[1])]; })) : pdf.txt(y, ' ', 'Sem entradas neste período.');

    y = pdf.secT(y, '10. Entradas no Período (' + a.entradas.length + ')');
    if (a.entradas.length) y = pdf.tabela(y, ['Nº', 'Nome', 'Idade', 'Género', 'Entrada', 'Diagnóstico', 'CID-10'], [10, 45, 14, 20, 24, CW - 135, 22],
      a.entradas.slice().sort(function (x, z) { return String(x.dataEntrada).localeCompare(String(z.dataEntrada)); })
        .map(function (p) { var ds = diagnosticos(p); return [String(p.n), p.nome, String(p.idade), p.genero || '—', fd(p.dataEntrada), ds.length ? ds.map(function (x) { return x.nome; }).join('; ') : '—', ds.filter(function (x) { return x.cid; }).map(function (x) { return x.cid; }).join('; ') || '—']; }));
    else y = pdf.txt(y, ' ', 'Sem entradas neste período.');

    y = pdf.secT(y, '11. Saídas no Período (' + a.saidas.length + ')');
    if (a.saidas.length) y = pdf.tabela(y, ['Nº', 'Nome', 'Idade', 'Género', 'Entrada', 'Saída', 'Tipo', 'Detalhe', 'Dias'], [9, 38, 12, 19, 21, 21, 22, CW - 157, 15],
      a.saidas.slice().sort(function (x, z) { return String(x.dataSaida).localeCompare(String(z.dataSaida)); })
        .map(function (p) { return [String(p.n), p.nome, String(p.idade), p.genero || '—', fd(p.dataEntrada), fd(p.dataSaida), p.tipoSaida === 'Alta Vivo' ? 'Alta' : p.tipoSaida, p.subtipo || '—', dias(p)]; }));
    else y = pdf.txt(y, ' ', 'Sem saídas neste período.');

    y = pdf.secT(y, '12. Doentes que ficam internados (' + a.internados.length + ')');
    if (a.internados.length) y = pdf.tabela(y, ['Nº', 'Nome', 'Idade', 'Género', 'Cama/Sala', 'Entrada', 'Diagnóstico'], [10, 45, 14, 20, 24, 24, CW - 137],
      a.internados.map(function (p) { return [String(p.n), p.nome, String(p.idade), p.genero || '—', p.cama || '—', fd(p.dataEntrada), p.diagnostico || '—']; }));
    else y = pdf.txt(y, ' ', 'Nenhum doente internado no fim deste período.');

    pdf.rodape();
    pdf.d.save(('Controlo_Pacientes_' + servico() + '_' + tipo + '_' + a.r.display).replace(/[^\wÀ-ÿ]+/g, '_') + '.pdf');
    if (typeof showFeedback === 'function') showFeedback('Relatório PDF gerado — ' + a.r.display, 'success');
  }

  function montarRelatorio() {
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    // Botões: "Carregar" → "Gerar relatório"; o relatório atualiza sozinho ao mudar o período.
    var bar = document.querySelector('#relatorioView .form-card');
    if (bar) {
      bar.querySelectorAll('button').forEach(function (b) {
        if (/updateRelatorio/.test(b.getAttribute('onclick') || '')) b.lastChild.textContent = ' Gerar relatório';
        if (/exportRelatorioPDF/.test(b.getAttribute('onclick') || '')) b.lastChild.textContent = ' Descarregar PDF';
      });
      bar.addEventListener('change', function (e) {
        if (e.target && e.target.id !== 'relatorioTipo') { try { updateRelatorio(); } catch (err) {} }
      });
    }
    var orig = window.updateRelatorio;
    if (typeof orig === 'function' && !orig.__cpRel) {
      var novo = function () { var r = orig.apply(this, arguments); try { renderAnalise(); } catch (e) { console.warn(e); } return r; };
      novo.__cpRel = true; window.updateRelatorio = novo;
    }
    window.exportRelatorioPDF = exportarPDF;
    var tipoSel = document.getElementById('relatorioTipo');
    if (tipoSel) tipoSel.addEventListener('change', function () { setTimeout(function () { try { updateRelatorio(); } catch (e) {} }, 0); });
    // Ao abrir a vista do relatório, gera logo.
    var sw = window.switchView;
    if (typeof sw === 'function' && !sw.__cpRel) {
      var nsw = function (v) { var r = sw.apply(this, arguments); if (v === 'relatorio') setTimeout(function () { try { updateRelatorio(); } catch (e) {} }, 0); return r; };
      nsw.__cpRel = true; window.switchView = nsw;
    }
  }

  function iniciar() { inserirCampos(); ligarFuncoes(); montarRelatorio(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
  window.ZeloCpRelatorio = { cidDe: cidDe, nomeDe: nomeDe, frequencia: frequencia, periodo: periodo, exportarPDF: exportarPDF };
})();
