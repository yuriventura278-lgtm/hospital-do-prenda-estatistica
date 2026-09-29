// ── ZELO — Controlo de Pacientes: Alergias ──
// Partilhado pelas páginas de Controlo de Pacientes.
// • Campo obrigatório no registo do paciente (Novo Paciente) e na edição:
//   "Sem alergias conhecidas", "Tem alergias" ou "Desconhecido".
// • Catálogo completo por categorias (antibióticos, antimaláricos,
//   analgésicos, anestesia, outros medicamentos, alimentos, picadas e
//   animais, ambientais, contacto/materiais), com pesquisa, e "Outra" livre.
// • Para cada alergia: reação e gravidade.
// • É um dado do doente: no regresso (mesmo NUP) as alergias do último
//   internamento, de qualquer serviço, vêm preenchidas para confirmar.
// Guardado em p.alergias = { estado, itens: {<código>: {nome, categoria,
// reacao, gravidade}}, em, por }.
(function () {
  if (window.__zeloCpAlergias) return;
  window.__zeloCpAlergias = true;

  var CATALOGO = [
    ['Antibióticos', ['Penicilina (grupo)', 'Benzilpenicilina (Penicilina G)', 'Penicilina benzatina', 'Amoxicilina', 'Amoxicilina + ácido clavulânico', 'Ampicilina', 'Flucloxacilina / Cloxacilina',
      'Cefalosporinas (grupo)', 'Ceftriaxona', 'Cefazolina', 'Cefuroxima', 'Cefotaxima', 'Ceftazidima', 'Cefalexina', 'Carbapenemos (Imipenem, Meropenem)',
      'Sulfonamidas', 'Cotrimoxazol (Sulfametoxazol + Trimetoprim)', 'Quinolonas (grupo)', 'Ciprofloxacina', 'Levofloxacina', 'Macrólidos (grupo)', 'Eritromicina', 'Azitromicina', 'Claritromicina',
      'Tetraciclinas / Doxiciclina', 'Aminoglicosídeos (grupo)', 'Gentamicina', 'Amicacina', 'Vancomicina', 'Clindamicina', 'Metronidazol', 'Tinidazol', 'Cloranfenicol', 'Nitrofurantoína', 'Linezolida']],
    ['Antimaláricos, antituberculosos, antivirais, antifúngicos e antiparasitários', ['Quinino', 'Cloroquina', 'Artemeter + Lumefantrina (Coartem)', 'Artesunato', 'Sulfadoxina + Pirimetamina (Fansidar)', 'Primaquina', 'Mefloquina',
      'Isoniazida', 'Rifampicina', 'Pirazinamida', 'Etambutol', 'Estreptomicina', 'Nevirapina', 'Efavirenz', 'Abacavir', 'Zidovudina', 'Aciclovir',
      'Fluconazol', 'Cetoconazol', 'Nistatina', 'Anfotericina B', 'Griseofulvina', 'Albendazol', 'Mebendazol', 'Praziquantel', 'Ivermectina']],
    ['Analgésicos e anti-inflamatórios', ['Ácido acetilsalicílico (Aspirina)', 'Anti-inflamatórios não esteroides – AINEs (grupo)', 'Ibuprofeno', 'Diclofenac', 'Naproxeno', 'Cetoprofeno', 'Indometacina', 'Piroxicam', 'Meloxicam',
      'Metamizol (Dipirona)', 'Paracetamol', 'Opioides (grupo)', 'Morfina', 'Petidina', 'Tramadol', 'Codeína', 'Fentanil']],
    ['Anestesia e bloco operatório', ['Anestésicos locais (grupo)', 'Lidocaína', 'Bupivacaína', 'Propofol', 'Cetamina', 'Tiopental', 'Etomidato', 'Suxametónio', 'Rocurónio', 'Atracúrio', 'Vecurónio',
      'Anestésicos inalatórios (Halotano, Sevoflurano)', 'Midazolam', 'Neostigmina']],
    ['Outros medicamentos e produtos', ['Contraste iodado (radiologia)', 'Contraste de gadolínio (ressonância)', 'Insulina', 'Metformina', 'Sulfonilureias (Glibenclamida)', 'Corticoides',
      'IECA (Captopril, Enalapril)', 'Amiodarona', 'Heparina', 'Enoxaparina', 'Varfarina', 'Furosemida', 'Hidroclorotiazida', 'Nifedipina', 'Metildopa',
      'Carbamazepina', 'Fenitoína', 'Fenobarbital', 'Ácido valproico', 'Lamotrigina', 'Clorpromazina', 'Haloperidol', 'Diazepam', 'Metoclopramida', 'Prometazina',
      'Omeprazol', 'Ranitidina', 'Ferro injetável', 'Vitamina K', 'Alopurinol', 'Ocitocina', 'Sulfato de magnésio', 'Protamina',
      'Vacinas', 'Soro antiofídico', 'Soro / vacina antitetânica', 'Imunoglobulinas', 'Sangue e hemoderivados', 'Iodopovidona (Betadine)']],
    ['Alimentos', ['Amendoim (ginguba)', 'Frutos secos (caju, noz, amêndoa)', 'Leite de vaca / lacticínios', 'Ovo', 'Peixe', 'Marisco / crustáceos (camarão, lagosta, caranguejo)', 'Moluscos (lulas, mexilhão, ostras)',
      'Trigo / glúten', 'Soja', 'Sésamo', 'Milho', 'Mandioca', 'Feijão e leguminosas', 'Frutas cítricas', 'Morango', 'Banana', 'Kiwi', 'Ananás', 'Manga', 'Tomate', 'Chocolate / cacau', 'Mel',
      'Corantes alimentares', 'Conservantes (sulfitos)', 'Glutamato monossódico', 'Bebidas alcoólicas']],
    ['Picadas e animais', ['Picada de abelha', 'Picada de vespa', 'Picada de formiga', 'Picada de mosquito', 'Picada de aranha', 'Picada de escorpião', 'Veneno de serpente', 'Pelo de cão', 'Pelo de gato', 'Penas de aves', 'Baratas']],
    ['Ambientais e respiratórias', ['Pólen', 'Ácaros do pó', 'Pó doméstico', 'Fungos / bolor', 'Fumo', 'Produtos químicos / poluição', 'Frio', 'Sol (fotossensibilidade)']],
    ['Contacto e materiais', ['Látex (luvas, sondas, algálias)', 'Níquel / metais', 'Adesivos e pensos', 'Clorexidina', 'Iodo', 'Álcool (antisséptico)', 'Cosméticos', 'Perfumes', 'Tintas de cabelo', 'Detergentes / sabões', 'Borracha', 'Plásticos']]
  ];
  var REACOES = ['Não sabe', 'Erupção cutânea (manchas)', 'Urticária', 'Comichão', 'Inchaço (lábios, olhos, face)', 'Falta de ar / broncospasmo', 'Anafilaxia / choque', 'Náuseas / vómitos', 'Diarreia', 'Dor abdominal', 'Tensão baixa / desmaio', 'Febre', 'Síndrome de Stevens-Johnson', 'Outra'];
  var GRAVIDADE = ['Não sabe', 'Ligeira', 'Moderada', 'Grave (risco de vida)'];
  var ESTADOS = [['nenhuma', 'Sem alergias conhecidas'], ['sim', 'Tem alergias'], ['desconhecida', 'Desconhecido (não foi possível apurar)']];

  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function norm(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function codigo(nome) { return 'a_' + norm(nome).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 60); }
  function pacientes() { try { return (typeof data !== 'undefined' && data && Array.isArray(data.patients)) ? data.patients : []; } catch (e) { return []; } }
  function porN(n) { return pacientes().filter(function (p) { return String(p.n) === String(n); })[0]; }
  function fmt(iso) { var p = String(iso || '').slice(0, 10).split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : ''; }
  var NOMES_SERV = { medicina_interna: 'Medicina Interna', cirurgia_geral: 'Cirurgia Geral', ortopedia: 'Ortopedia', neurocirurgia: 'Neurocirurgia', maxilo_facial: 'Maxilo-Facial', nefrologia: 'Nefrologia', uci_intensivo: 'UCI — Intensivos', uci_intermedio: 'Cuidados Intermédios' };

  // ── Texto para a ficha, listas e PDF ──
  function itens(a) {
    var o = (a && a.itens) || {};
    return Object.keys(o).map(function (k) { return o[k]; }).filter(function (x) { return x && x.nome; });
  }
  function resumo(a) {
    if (!a || !a.estado) return '';
    if (a.estado === 'nenhuma') return 'Sem alergias conhecidas';
    if (a.estado === 'desconhecida') return 'Desconhecido (não foi possível apurar)';
    return itens(a).map(function (x) {
      var d = [x.reacao && x.reacao !== 'Não sabe' ? x.reacao : '', x.gravidade && x.gravidade !== 'Não sabe' ? x.gravidade : ''].filter(Boolean).join(', ');
      return x.nome + (d ? ' (' + d + ')' : '');
    }).join('; ') || 'Tem alergias (não especificadas)';
  }
  window.zeloCpAlergiasTxt = function (p) { return resumo(p && p.alergias) || 'Não registado'; };
  window.zeloCpAlergiasHTML = function (p) {
    var a = p && p.alergias;
    if (!a || !a.estado) return '<span style="color:#94A3B8">Não registado</span>';
    if (a.estado !== 'sim') return esc(resumo(a));
    return '<span class="cpa-alerta">' + itens(a).map(function (x) {
      var grave = /Grave|Anafilaxia/.test((x.gravidade || '') + (x.reacao || ''));
      return '<span class="cpa-chip' + (grave ? ' g' : '') + '">' + esc(x.nome) + (x.reacao && x.reacao !== 'Não sabe' ? ' · ' + esc(x.reacao) : '') + (x.gravidade && x.gravidade !== 'Não sabe' ? ' · ' + esc(x.gravidade) : '') + '</span>';
    }).join(' ') + '</span>';
  };

  var css = document.createElement('style');
  css.textContent = [
    '.cpa{grid-column:1/-1;margin-top:12px;display:block}',
    '.cpa>label{display:block;font-weight:700;margin-bottom:6px}',
    '.cpa-est{display:flex;gap:6px;flex-wrap:wrap}',
    '.cpa-est button{border:1.5px solid #D6E0EC;background:#fff;border-radius:10px;padding:8px 12px;font:700 .84rem Inter,Arial,sans-serif;color:#334155;cursor:pointer}',
    '.cpa-est button.on{background:#1E3A5F;border-color:#1E3A5F;color:#fff}.cpa-est button.on[data-e="sim"]{background:#B91C1C;border-color:#B91C1C}',
    '.cpa-painel{margin-top:10px;border:1px solid #E3E8F0;border-radius:12px;padding:10px;background:#F8FAFC}',
    '.cpa-q{width:100%;box-sizing:border-box;border:1.5px solid #D6E0EC;border-radius:10px;padding:9px 12px;font:600 .9rem Inter,Arial,sans-serif}',
    '.cpa-cat{max-height:230px;overflow:auto;margin-top:8px;background:#fff;border:1px solid #E3E8F0;border-radius:10px;padding:4px 10px}',
    '.cpa-cat h5{margin:8px 0 4px;font:800 .68rem Inter,Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#1E3A5F}',
    '.cpa-cat .ops{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:2px 10px}',
    '.cpa-cat label{display:flex;gap:7px;align-items:flex-start;font:500 .85rem Inter,Arial,sans-serif;color:#0F172A;cursor:pointer;padding:3px 0}',
    '.cpa-cat input{margin-top:2px;accent-color:#B91C1C}',
    '.cpa-outra{display:flex;gap:6px;margin-top:8px}.cpa-outra input{flex:1;border:1.5px solid #D6E0EC;border-radius:10px;padding:8px 11px;font:600 .88rem Inter,Arial,sans-serif}',
    '.cpa-outra button,.cpa-sel button{border:1px solid #D6E0EC;background:#fff;border-radius:9px;padding:6px 11px;font:700 .8rem Inter,Arial,sans-serif;color:#1E3A5F;cursor:pointer}',
    '.cpa-sel{margin-top:8px;display:flex;flex-direction:column;gap:6px}',
    '.cpa-sel .l{display:grid;grid-template-columns:1fr 190px 160px 32px;gap:6px;align-items:center;background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;padding:6px 8px}',
    '.cpa-sel .l b{font-size:.86rem;color:#991B1B}.cpa-sel select{border:1px solid #E3C1C1;border-radius:8px;padding:5px 6px;font:600 .8rem Inter,Arial,sans-serif;background:#fff;min-width:0}',
    '.cpa-sel .l button{padding:4px 0;color:#B91C1C}',
    '.cpa-nota{margin-top:8px;font:700 .78rem Inter,Arial,sans-serif;border-radius:8px;padding:6px 9px;background:#EEF4FB;color:#1E3A5F}',
    '.cpa-vazio{font:600 .8rem Inter,Arial,sans-serif;color:#64748B;padding:4px 2px}',
    '.cpa-chip{display:inline-block;background:#FEF2F2;color:#991B1B;border:1px solid #FECACA;border-radius:999px;padding:3px 10px;font:700 .8rem Inter,Arial,sans-serif;margin:2px 2px 2px 0}',
    '.cpa-chip.g{background:#B91C1C;color:#fff;border-color:#B91C1C}',
    '.cpa .cpa-cat label{text-transform:none!important;letter-spacing:normal!important;font:500 .85rem Inter,Arial,sans-serif!important;color:#0F172A!important;margin:0!important;display:flex!important}',
    '.cpa .cpa-cat input[type=checkbox]{width:16px!important;height:16px!important;min-width:16px!important;flex:0 0 16px!important;padding:0!important;margin:2px 0 0!important;box-shadow:none!important;border-radius:3px!important}',
    '.cpa .cpa-sel select{width:auto!important;height:auto!important;min-height:0!important;padding:5px 6px!important;font:600 .8rem Inter,Arial,sans-serif!important;margin:0!important}',
    '.cpa .cpa-outra input,.cpa .cpa-q{margin:0!important}',
    '.cpa-tab{display:inline-block;margin-left:6px;background:#FEF2F2;color:#991B1B;border:1px solid #FECACA;border-radius:999px;padding:1px 8px;font:800 .7rem Inter,Arial,sans-serif;vertical-align:middle}',
    '.cpa-falta{outline:2px solid #DC2626;outline-offset:3px;border-radius:10px}',
    '@media(max-width:700px){.cpa-sel .l{grid-template-columns:1fr 32px}.cpa-sel .l select{grid-column:1/2}}'
  ].join('\n');
  document.head.appendChild(css);

  // ── Componente (um no Novo Paciente, outro no Atualizar dados) ──
  function Componente(id) {
    var st = { estado: '', itens: {} }, tocado = false, nota = '';
    var box = document.createElement('div'); box.className = 'cpa field'; box.id = id;
    function selHTML() {
      var sel = Object.keys(st.itens);
      return sel.length ? sel.map(function (k) {
        var x = st.itens[k];
        return '<div class="l"><b>' + esc(x.nome) + '</b><select data-r="' + k + '" title="Reação">' + REACOES.map(function (r) { return '<option' + (x.reacao === r ? ' selected' : '') + '>' + r + '</option>'; }).join('') + '</select>' +
          '<select data-g="' + k + '" title="Gravidade">' + GRAVIDADE.map(function (g) { return '<option' + (x.gravidade === g ? ' selected' : '') + '>' + g + '</option>'; }).join('') + '</select><button type="button" data-tirar="' + k + '" title="Retirar">×</button></div>';
      }).join('') : '<div class="cpa-vazio">Selecione na lista acima as alergias do doente.</div>';
    }
    function desenharSel() { var el = box.querySelector('.cpa-sel'); if (el) el.innerHTML = selHTML(); }
    function desenhar() {
      var h = '<label>Alergias <span class="required" style="color:#DC2626">*</span></label><div class="cpa-est">' +
        ESTADOS.map(function (e) { return '<button type="button" data-e="' + e[0] + '" class="' + (st.estado === e[0] ? 'on' : '') + '">' + e[1] + '</button>'; }).join('') + '</div>';
      if (st.estado === 'sim') {
        h += '<div class="cpa-painel"><input type="text" class="cpa-q" placeholder="Procurar alergia: medicamento, alimento, picada, material…" autocomplete="off"><div class="cpa-cat"></div>' +
          '<div class="cpa-outra"><input type="text" class="cpa-outra-t" placeholder="Outra alergia não listada — escreva aqui"><button type="button" data-outra>Acrescentar</button></div>' +
          '<div class="cpa-sel">' + selHTML() + '</div></div>';
      }
      if (nota) h += '<div class="cpa-nota">' + nota + '</div>';
      box.innerHTML = h;
      if (st.estado === 'sim') lista('');
    }
    function lista(q) {
      var qn = norm(q).trim(), el = box.querySelector('.cpa-cat'); if (!el) return;
      var h = '';
      CATALOGO.forEach(function (c) {
        var ops = c[1].filter(function (n) { return !qn || norm(n + ' ' + c[0]).indexOf(qn) >= 0; });
        if (!ops.length) return;
        h += '<h5>' + esc(c[0]) + '</h5><div class="ops">' + ops.map(function (n) {
          var k = codigo(n);
          return '<label><input type="checkbox" data-k="' + k + '" data-nome="' + esc(n) + '" data-cat="' + esc(c[0]) + '"' + (st.itens[k] ? ' checked' : '') + '>' + esc(n) + '</label>';
        }).join('') + '</div>';
      });
      el.innerHTML = h || '<div class="cpa-vazio">Nada encontrado — escreva-a em «Outra alergia».</div>';
    }
    box.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      tocado = true;
      if (b.dataset.e) { st.estado = b.dataset.e; box.classList.remove('cpa-falta'); desenhar(); }
      else if (b.dataset.tirar) { var k = b.dataset.tirar; delete st.itens[k]; desenharSel(); var c = box.querySelector('.cpa-cat input[data-k="' + k + '"]'); if (c) c.checked = false; }
      else if (b.hasAttribute('data-outra')) {
        var t = box.querySelector('.cpa-outra-t'), v = t && t.value.trim(); if (!v) return;
        st.itens[codigo('outra ' + v)] = { nome: v, categoria: 'Outra', reacao: 'Não sabe', gravidade: 'Não sabe' }; t.value = ''; desenharSel();
      }
    });
    box.addEventListener('change', function (e) {
      var t = e.target; tocado = true;
      if (t.dataset.k) {
        if (t.checked) st.itens[t.dataset.k] = { nome: t.dataset.nome, categoria: t.dataset.cat, reacao: 'Não sabe', gravidade: 'Não sabe' };
        else delete st.itens[t.dataset.k];
        box.classList.remove('cpa-falta'); desenharSel();
      } else if (t.dataset.r && st.itens[t.dataset.r]) st.itens[t.dataset.r].reacao = t.value;
      else if (t.dataset.g && st.itens[t.dataset.g]) st.itens[t.dataset.g].gravidade = t.value;
    });
    box.addEventListener('input', function (e) { if (e.target.classList.contains('cpa-q')) lista(e.target.value); });
    box.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.classList.contains('cpa-outra-t')) { e.preventDefault(); var b = box.querySelector('[data-outra]'); if (b) b.click(); } });
    desenhar();
    return {
      el: box,
      tocado: function () { return tocado; },
      definir: function (a, n) { st = { estado: (a && a.estado) || '', itens: JSON.parse(JSON.stringify((a && a.itens) || {})) }; tocado = false; nota = n || ''; desenhar(); },
      valor: function () {
        var nome = '';
        try { nome = sessionStorage.getItem('zeloNome') || ''; } catch (e) {}
        return { estado: st.estado, itens: st.estado === 'sim' ? JSON.parse(JSON.stringify(st.itens)) : {}, em: new Date().toISOString(), por: nome };
      },
      // Devolve a mensagem de erro, ou '' se estiver bem preenchido.
      validar: function () {
        if (!st.estado) return 'Indique as alergias do doente: «Sem alergias conhecidas», «Tem alergias» ou «Desconhecido».';
        if (st.estado === 'sim' && !Object.keys(st.itens).length) return 'Selecione pelo menos uma alergia (ou escreva-a em «Outra alergia»).';
        return '';
      },
      assinalar: function () { box.classList.add('cpa-falta'); try { box.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {} }
    };
  }

  window.ZeloCpAlergiasComponente = Componente;
  var novo = null, edicao = null;
  function inserir(modalId, comp) {
    var m = document.getElementById(modalId), corpo = m && m.querySelector('.modal-body'); if (!corpo) return false;
    corpo.appendChild(comp.el); return true;
  }

  // ── Regresso: traz as alergias do último internamento (qualquer serviço) ──
  var tNup = null;
  function trazerDoProcesso() {
    var f = document.getElementById('fNUP'); if (!f || !novo || novo.tocado()) return;
    var nup = String(f.value || '').trim(); if (!nup) return;
    var escolher = function (eps) {
      if (novo.tocado() || String(f.value || '').trim() !== nup) return;
      var l = pacientes().filter(function (p) { return String(p.nup || '').trim() === nup; }).concat(eps || [])
        .filter(function (p) { return p.alergias && p.alergias.estado; })
        .sort(function (a, b) { return String(b.dataEntrada || '').localeCompare(String(a.dataEntrada || '')); });
      if (!l.length) return;
      var u = l[0];
      novo.definir(u.alergias, 'Alergias trazidas do processo clínico (internamento de ' + fmt(u.dataEntrada) + (u.servico && NOMES_SERV[u.servico] ? ' em ' + NOMES_SERV[u.servico] : '') + ') — confirme com o doente.');
    };
    if (typeof window.zeloCpInternamentosNUP === 'function') window.zeloCpInternamentosNUP(nup).then(escolher, function () { escolher([]); });
    else escolher([]);
  }

  // ── Ligações às funções da página ──
  function copiar(de, para) { Object.keys(de).forEach(function (k) { if (!(k in para)) para[k] = de[k]; }); }
  function ligarAdd() {
    var f = window.addPaciente; if (typeof f !== 'function') return false; if (f.__cpa) return true;
    var w = function () {
      var m = document.getElementById('novoModal');
      if (novo && m && m.classList.contains('active')) {
        var erro = novo.validar();
        if (erro) { if (typeof showFeedback === 'function') showFeedback(erro, 'error'); novo.assinalar(); return; }
      }
      var antes = pacientes().length, r = f.apply(this, arguments);
      try {
        var l = pacientes();
        if (novo && l.length > antes) { var v = novo.valor(); l.slice(antes).forEach(function (p) { if (!p.alergias) p.alergias = v; }); if (typeof saveData === 'function') saveData(); }
      } catch (e) {}
      return r;
    };
    copiar(f, w); w.__cpa = true; window.addPaciente = w; return true;
  }
  function ligarUpdate() {
    var f = window.updatePaciente; if (typeof f !== 'function') return false; if (f.__cpa) return true;
    var w = function () {
      var n = null; try { n = editingPacienteN; } catch (e) {}
      if (edicao && n != null) {
        var erro = edicao.validar();
        if (erro) { if (typeof showFeedback === 'function') showFeedback(erro, 'error'); edicao.assinalar(); return; }
      }
      var p = porN(n), antes = p ? JSON.stringify(p.alergias || null) : '';
      var r = f.apply(this, arguments);
      var ok = false; try { ok = editingPacienteN === null; } catch (e) {}
      if (ok && p && edicao && edicao.tocado()) {
        var v = edicao.valor();
        if (JSON.stringify({ e: v.estado, i: v.itens }) !== JSON.stringify({ e: (p.alergias || {}).estado, i: (p.alergias || {}).itens || {} })) { p.alergias = v; if (typeof saveData === 'function') saveData(); }
      }
      return r;
    };
    copiar(f, w); w.__cpa = true; window.updatePaciente = w; return true;
  }
  function observar(modalId, aoAbrir) {
    var m = document.getElementById(modalId); if (!m || m.__cpaObs) return !!m;
    m.__cpaObs = true;
    var ativo = m.classList.contains('active');
    new MutationObserver(function () { var a = m.classList.contains('active'); if (a && !ativo) aoAbrir(); ativo = a; }).observe(m, { attributes: true, attributeFilter: ['class'] });
    return true;
  }

  function iniciar() {
    var ok = true;
    if (!novo && document.getElementById('novoModal')) {
      novo = Componente('cpa-novo');
      if (!inserir('novoModal', novo)) novo = null;
      else {
        observar('novoModal', function () { novo.definir(null); setTimeout(trazerDoProcesso, 300); });
        var f = document.getElementById('fNUP');
        if (f) f.addEventListener('input', function () { clearTimeout(tNup); tNup = setTimeout(trazerDoProcesso, 500); });
      }
    }
    if (!edicao && document.getElementById('editModal')) {
      edicao = Componente('cpa-edit');
      if (!inserir('editModal', edicao)) edicao = null;
      else observar('editModal', function () {
        var n = null; try { n = editingPacienteN; } catch (e) {}
        var p = porN(n); edicao.definir(p && p.alergias, p && !(p.alergias && p.alergias.estado) ? 'Este registo ainda não tem as alergias — indique-as.' : '');
      });
    }
    ok = !!novo & !!edicao & ligarAdd() & ligarUpdate();
    return ok;
  }
  // Aviso nas listas (cartões e tabelas): quem tem alergias fica assinalado a vermelho.
  function marcarCartoes() {
    document.querySelectorAll('[onclick*="editPaciente("]').forEach(function (bt) {
      var m = /editPaciente\((\d+)\)/.exec(bt.getAttribute('onclick') || ''); if (!m) return;
      var cx = bt.closest('tr, .internados-card'); if (!cx || cx.closest('.modal-overlay, .cpp-ov, .cpn-ov')) return;
      var p = porN(m[1]), a = p && p.alergias, txt = a && a.estado === 'sim' ? itens(a).map(function (x) { return x.nome; }).join(', ') : '';
      var tag = cx.querySelector('.cpa-tab');
      if (!txt) { if (tag) tag.remove(); return; }
      if (tag && tag.dataset.t === txt) return;
      if (!tag) {
        var alvo = cx.querySelector('.internado-nome') || [].slice.call(cx.querySelectorAll('td')).filter(function (td) { return td.textContent.trim() === String(p.nome || '').trim(); })[0];
        if (!alvo) return;
        tag = document.createElement('span'); tag.className = 'cpa-tab'; alvo.appendChild(tag);
      }
      tag.dataset.t = txt; tag.textContent = 'Alergias'; tag.title = 'Alergias: ' + txt;
    });
  }
  var tCart = null;
  new MutationObserver(function () { clearTimeout(tCart); tCart = setTimeout(marcarCartoes, 120); }).observe(document.documentElement, { childList: true, subtree: true });

  var n = 0, iv = setInterval(function () { n++; if (iniciar() || n > 80) clearInterval(iv); }, 250);
})();
