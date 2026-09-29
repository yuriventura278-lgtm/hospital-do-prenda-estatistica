// ── ZELO — Controlo de Pacientes: processo do paciente, pesquisa e histórico ──
// Partilhado pelas 8 páginas de Controlo de Pacientes.
// • Quem registou: ao registar um paciente, a saída ou uma atualização, fica
//   guardado o nome e a função de quem o fez (utilizador com sessão
//   iniciada) e a data/hora. Registos antigos mostram "não registado".
// • Processo do paciente: janela com toda a informação — identificação,
//   entrada (dia e hora), cama, proveniência, diagnóstico e CID, saída, dias
//   internado e os profissionais que registaram cada passo.
// • Pesquisa por nome ou NUP: na lista (procura em todos os processos,
//   internados e saídos) e na janela Registar Saída (mostra a ficha do
//   paciente encontrado; se já saiu, avisa).
// • Histórico Diário: mais claro, por dia, com hora, dados do paciente e
//   quem registou; pesquisa dentro do mês; cada linha abre o processo.
// Nunca apaga dados: só acrescenta os campos de autoria aos registos.
(function () {
  if (window.__zeloCpProcesso) return;
  window.__zeloCpProcesso = true;

  var FUNCOES = { admin: 'Administrador', chefe_servico: 'Chefe de Serviço', enfermeiro_chefe: 'Enfermeiro(a) Chefe', enfermeiro: 'Enfermeiro(a)', secretario: 'Secretário(a)', medico: 'Médico(a)' };
  var TIPO_COR = { 'Alta Vivo': '#059669', 'Óbito': '#475569', 'Transferência': '#7C3AED' };

  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pacientes() { try { return (typeof data !== 'undefined' && data && Array.isArray(data.patients)) ? data.patients : []; } catch (e) { return []; } }
  function porN(n) { return pacientes().filter(function (p) { return String(p.n) === String(n); })[0]; }
  function dia(iso) { return String(iso || '').slice(0, 10); }
  function fmt(iso) { var p = dia(iso).split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : '—'; }
  function hora(iso) { var s = String(iso || ''); return s.length >= 16 ? s.slice(11, 16) : ''; }
  function fmtDH(iso) { if (!iso) return '—'; var h = hora(iso); return fmt(iso) + (h ? ' às ' + h : ''); }
  function dias(a, b) { var d = Math.floor((new Date(dia(b)) - new Date(dia(a))) / 86400000); return isNaN(d) ? null : Math.max(0, d); }
  function hojeISO() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function agoraISO() { var d = new Date(); return hojeISO() + 'T' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  function faixa(idade) { var i = parseInt(idade, 10); if (isNaN(i)) return '—'; return i <= 14 ? '0–14' : i <= 24 ? '15–24' : i <= 44 ? '25–44' : i <= 64 ? '45–64' : '65 ou mais'; }
  function diags(p) { return window.zeloCpDiagnosticos ? window.zeloCpDiagnosticos(p) : (p.diagnostico ? [{ nome: p.diagnostico, cid: p.cid, principal: true }] : []); }
  function diagsHTML(p) {
    var l = diags(p); if (!l.length) return '—';
    return l.map(function (x, i) { return (i ? '<br>' : '') + esc(x.nome) + (x.cid ? ' <small style="display:inline">(' + esc(x.cid) + ')</small>' : '') + (l.length > 1 ? ' <small style="display:inline">· ' + (x.principal ? 'principal' : 'secundário') + '</small>' : ''); }).join('');
  }
  function diagsTxt(p) { var l = diags(p); return l.length ? l.map(function (x) { return x.nome + (x.cid ? ' (' + x.cid + ')' : ''); }).join('; ') : '—'; }
  function norm(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  // ── Quem está a registar ──
  function autor() {
    var nome = '', email = '', role = '';
    try { nome = sessionStorage.getItem('zeloNome') || ''; email = sessionStorage.getItem('zeloEmail') || ''; role = sessionStorage.getItem('zeloRole') || ''; } catch (e) {}
    return { nome: nome || email || 'Utilizador sem nome', funcao: FUNCOES[role] || (role ? role.replace(/_/g, ' ') : '') };
  }
  function autorTxt(nome, funcao, quando) {
    if (!nome) return '<span class="cpp-nd">Não registado (registo anterior a esta funcionalidade)</span>';
    return '<b>' + esc(nome) + '</b>' + (funcao ? ' <span class="cpp-fun">' + esc(funcao) + '</span>' : '') + (quando ? '<small>' + fmtDH(quando) + '</small>' : '');
  }
  function gravar() { try { saveData(); } catch (e) {} }

  // Envolve funções da página: guarda antes o que é preciso e, depois, marca a autoria.
  function envolver(nome, antes, depois) {
    var f = window[nome];
    if (typeof f !== 'function' || f.__cpProc) return;
    var novo = function () {
      var ctx = null; try { ctx = antes ? antes() : null; } catch (e) {}
      var r = f.apply(this, arguments);
      try { depois(ctx); } catch (e) { console.warn(e); }
      return r;
    };
    novo.__cpProc = true; window[nome] = novo;
  }
  function ligarAutoria() {
    envolver('addPaciente', function () { return { nup: (document.getElementById('fNUP') || {}).value, total: pacientes().length }; }, function (c) {
      if (!c || pacientes().length <= c.total) return;          // não foi registado (erro de validação)
      var p = pacientes().filter(function (x) { return String(x.nup).trim() === String(c.nup || '').trim(); })[0];
      if (!p || p.registadoPor) return;
      var a = autor(); p.registadoPor = a.nome; p.registadoFuncao = a.funcao; p.registadoEm = agoraISO(); gravar();
    });
    envolver('addSaida', function () { var n = (document.getElementById('fSaidaPaciente') || {}).value; var p = porN(n); return p ? { n: p.n, antes: p.status } : null; }, function (c) {
      if (!c) return; var p = porN(c.n);
      if (!p || p.status === 'internado' || c.antes !== 'internado') return;
      var a = autor(); p.saidaRegistadaPor = a.nome; p.saidaRegistadaFuncao = a.funcao; p.saidaRegistadaEm = agoraISO(); gravar();
    });
    envolver('updatePaciente', function () { try { return { n: editingPacienteN }; } catch (e) { return null; } }, function (c) {
      if (!c || c.n == null) return; var p = porN(c.n); if (!p) return;
      var a = autor(); p.atualizadoPor = a.nome; p.atualizadoFuncao = a.funcao; p.atualizadoEm = agoraISO(); gravar();
    });
  }

  // ── Estilos ──
  var css = [
    '.cpp-ov{position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:10050;display:none;align-items:flex-start;justify-content:center;padding:28px 14px;overflow:auto}',
    '.cpp-ov.on{display:flex}',
    '.cpp-card{background:#fff;border-radius:18px;max-width:760px;width:100%;box-shadow:0 24px 60px rgba(15,23,42,.35);overflow:hidden;font-family:Inter,"Segoe UI",Arial,sans-serif;color:#0F172A}',
    '.cpp-top{background:linear-gradient(90deg,#1E3A5F,#2B5A8A);color:#fff;padding:18px 20px;display:flex;gap:14px;align-items:flex-start}',
    '.cpp-top .av{width:48px;height:48px;border-radius:14px;background:rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center;font:800 1.2rem Inter,Arial;flex-shrink:0}',
    '.cpp-top h3{margin:0;font-size:1.2rem}.cpp-top .sub{font-size:.8rem;opacity:.85;margin-top:3px}',
    '.cpp-top .x{margin-left:auto;border:0;background:rgba(255,255,255,.14);color:#fff;width:34px;height:34px;border-radius:10px;font-size:1.2rem;cursor:pointer}',
    '.cpp-estado{display:inline-block;margin-top:8px;border-radius:999px;padding:3px 11px;font:800 .7rem Inter,Arial;letter-spacing:.05em;text-transform:uppercase}',
    '.cpp-estado.int{background:#DCFCE7;color:#166534}.cpp-estado.sai{background:#FEF3C7;color:#92400E}',
    '.cpp-body{padding:16px 20px 6px}',
    '.cpp-sec{margin-bottom:16px}',
    '.cpp-sec h4{margin:0 0 8px;font:800 .66rem Inter,Arial;letter-spacing:.1em;text-transform:uppercase;color:#64748B}',
    '.cpp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:8px}',
    '.cpp-f{background:#F8FAFC;border:1px solid #E3E8F0;border-radius:10px;padding:8px 11px;min-width:0}',
    '.cpp-f > span{display:block;font:700 .6rem Inter,Arial;letter-spacing:.08em;text-transform:uppercase;color:#64748B}',
    '.cpp-f b{display:block;font-size:.92rem;margin-top:2px;word-break:break-word}',
    '.cpp-f.largo{grid-column:1/-1}',
    '.cpp-tl{position:relative;padding-left:22px}',
    '.cpp-tl:before{content:"";position:absolute;left:7px;top:6px;bottom:6px;width:2px;background:#E3E8F0}',
    '.cpp-ev{position:relative;margin-bottom:10px;background:#fff;border:1px solid #E3E8F0;border-radius:12px;padding:9px 12px}',
    '.cpp-ev:before{content:"";position:absolute;left:-20px;top:13px;width:12px;height:12px;border-radius:50%;background:var(--c);box-shadow:0 0 0 3px #fff}',
    '.cpp-ev .t{font:800 .78rem Inter,Arial;color:var(--c)}.cpp-ev .d{font-size:.84rem;margin-top:3px;color:#334155}',
    '.cpp-ev .p{font-size:.82rem;margin-top:5px;color:#0F172A}.cpp-ev .p small,.cpp-f small{display:block;color:#64748B;font-size:.74rem;margin-top:1px}',
    '.cpp-fun{display:inline-block;background:#EEF2FF;color:#3730A3;border-radius:6px;padding:1px 7px;font:700 .68rem Inter,Arial;margin-left:4px}',
    '.cpp-nd{color:#94A3B8;font-style:italic;font-weight:500}',
    '.cpp-acoes{display:flex;gap:8px;justify-content:flex-end;padding:12px 20px 18px;flex-wrap:wrap;border-top:1px solid #EEF2F7}',
    '.cpp-bt{border:1px solid #CBD5E1;background:#fff;color:#1E3A5F;border-radius:10px;padding:9px 16px;font:700 .85rem Inter,Arial;cursor:pointer}',
    '.cpp-bt.p{background:#1E3A5F;border-color:#1E3A5F;color:#fff}.cpp-bt.s{background:#D97706;border-color:#D97706;color:#fff}',
    '.cpp-eliminar{margin-right:auto !important;text-transform:none !important;letter-spacing:0 !important;background:#fff !important;color:#B91C1C !important;border:1.5px solid #FCA5A5 !important}',
    '.cpp-eliminar:hover{background:#FEF2F2 !important}',
    '.cpp-tag{display:inline-block;border-radius:7px;padding:3px 9px;font:700 .72rem Inter,Arial;color:#fff;background:var(--t)}',
    // Resultados da pesquisa na lista
    '.cpp-res{margin:0 16px 12px;border:1px solid #BFDBFE;background:#F5F9FF;border-radius:12px;overflow:hidden}',
    '.cpp-res-h{padding:8px 12px;font:800 .7rem Inter,Arial;letter-spacing:.07em;text-transform:uppercase;color:#1D4ED8;display:flex;gap:8px}',
    '.cpp-res-h small{margin-left:auto;text-transform:none;letter-spacing:0;font-weight:600;color:#64748B}',
    '.cpp-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-top:1px solid #DBEAFE;cursor:pointer;background:#fff}',
    '.cpp-item:hover{background:#EFF6FF}',
    '.cpp-item .t{flex:1;min-width:0}.cpp-item b{font-size:.9rem}.cpp-item .l2{font-size:.76rem;color:#64748B;margin-top:2px}',
    '.cpp-item .ver{font:700 .76rem Inter,Arial;color:#1D4ED8;white-space:nowrap}',
    '.cpg-nome b.cpp-link{cursor:pointer;text-decoration:underline;text-decoration-color:#CBD5E1;text-underline-offset:3px}',
    '.cpg-nome b.cpp-link:hover{color:#1D4ED8;text-decoration-color:#1D4ED8}',
    // Ficha na janela Registar Saída
    '.cpp-mini{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px 12px;font-size:.82rem;margin-top:6px}',
    '.cpp-mini span{color:#64748B;font-size:.68rem;text-transform:uppercase;letter-spacing:.06em;font-weight:700;display:block}',
    '.cpp-mini b{font-weight:700;color:#0F172A}',
    '.cpp-aviso{margin-top:8px;padding:9px 12px;border-radius:10px;background:#FEF3C7;color:#92400E;font-size:.84rem}',
    '.cpp-aviso a,.cpp-link2{color:#1D4ED8;font-weight:700;cursor:pointer;text-decoration:underline}',
    // Histórico
    '#historicoModal .modal-card{max-width:980px !important}',
    '.cph-top{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;margin-bottom:12px}',
    '.cph-top input[type=text]{flex:1;min-width:200px;height:46px !important;box-sizing:border-box}',
    '.cph-res{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}',
    '.cph-res div{flex:1;min-width:110px;background:#F8FAFC;border:1px solid #E3E8F0;border-radius:12px;padding:8px 12px}',
    '.cph-res b{display:block;font:800 1.3rem ui-monospace,Consolas,monospace;color:#1E3A5F}.cph-res span{font:700 .6rem Inter,Arial;letter-spacing:.08em;text-transform:uppercase;color:#64748B}',
    '.cph-dia{border:1px solid #E3E8F0;border-radius:14px;margin-bottom:12px;overflow:hidden}',
    '.cph-dia-h{display:flex;align-items:center;gap:10px;padding:9px 14px;background:#F8FAFC;border-bottom:1px solid #E3E8F0;font:800 .84rem Inter,Arial;color:#1E3A5F}',
    '.cph-dia-h small{margin-left:auto;text-transform:none;font-weight:700;color:#64748B;display:flex;gap:6px}',
    '.cph-q{border-radius:999px;padding:2px 9px;font:800 .68rem Inter,Arial}.cph-q.e{background:#DCFCE7;color:#166534}.cph-q.s{background:#FEF3C7;color:#92400E}',
    '.cph-l{display:grid;grid-template-columns:62px 92px 1fr auto;gap:10px;align-items:center;padding:9px 14px;border-bottom:1px solid #EEF2F7;cursor:pointer}',
    '.cph-l:last-child{border-bottom:0}.cph-l:hover{background:#F5F9FF}',
    '.cph-h{font:800 .82rem ui-monospace,Consolas,monospace;color:#334155}',
    '.cph-t{border-radius:7px;padding:3px 8px;font:800 .66rem Inter,Arial;letter-spacing:.04em;text-transform:uppercase;text-align:center}',
    '.cph-t.e{background:#DCFCE7;color:#166534}.cph-t.s{background:var(--t);color:#fff}',
    '.cph-l .n b{font-size:.9rem}.cph-l .n .l2{font-size:.76rem;color:#64748B;margin-top:2px}.cph-l .n .l3{font-size:.74rem;color:#334155;margin-top:3px}',
    '.cph-l .ver{font:700 .76rem Inter,Arial;color:#1D4ED8;white-space:nowrap}',
    '@media(max-width:640px){.cph-l{grid-template-columns:52px 1fr;}.cph-l .cph-t{grid-column:2;justify-self:start}.cph-l .n{grid-column:1/-1}.cph-l .ver{display:none}}',
    'html[data-zelo-theme="dark"] .cpp-card,html.dark .cpp-card{background:#111A2B;color:#E6ECF5}',
    'html[data-zelo-theme="dark"] .cpp-f,html[data-zelo-theme="dark"] .cpp-ev,html[data-zelo-theme="dark"] .cph-dia-h,html[data-zelo-theme="dark"] .cph-res div,html[data-zelo-theme="dark"] .cpp-item{background:#0F1828;border-color:#1F2A3D;color:#E6ECF5}',
    'html[data-zelo-theme="dark"] .cpp-f b,html[data-zelo-theme="dark"] .cpp-ev .p,html[data-zelo-theme="dark"] .cpp-ev .d{color:#E6ECF5}'
  ].join('\n');

  // ── Janela do processo ──
  var ov;
  function campo(rot, val, largo) { return '<div class="cpp-f' + (largo ? ' largo' : '') + '"><span>' + rot + '</span><b>' + (val == null || val === '' ? '—' : val) + '</b></div>'; }
  function tipoTag(p) {
    var t = p.tipoSaida || 'Saída';
    return '<span class="cpp-tag" style="--t:' + (TIPO_COR[t] || '#D97706') + '">' + esc(t === 'Alta Vivo' ? 'Alta' : t) + (p.subtipo && p.subtipo !== '—' ? ' · ' + esc(p.subtipo) : '') + '</span>';
  }
  function abrir(n) {
    var p = porN(n); if (!p) return;
    if (!ov) {
      ov = document.createElement('div'); ov.className = 'cpp-ov'; ov.id = 'cpp-processo';
      document.body.appendChild(ov);
      ov.addEventListener('click', function (e) { if (e.target === ov || e.target.closest('[data-fechar]')) fechar(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ov.classList.contains('on')) fechar(); });
    }
    var internado = p.status === 'internado';
    var nDias = internado ? dias(p.dataEntrada, hojeISO()) : dias(p.dataEntrada, p.dataSaida);
    var iniciais = String(p.nome || '?').trim().split(/\s+/).map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase();
    var tl = '<div class="cpp-ev" style="--c:#16A34A"><div class="t">Entrada no serviço</div><div class="d">' + fmtDH(p.dataEntrada) + (p.proveniencia ? ' · Proveniência: ' + esc(p.proveniencia) : '') + '</div>' +
      '<div class="p">Registado por: ' + autorTxt(p.registadoPor, p.registadoFuncao, p.registadoEm) + '</div></div>';
    if (p.atualizadoPor) tl += '<div class="cpp-ev" style="--c:#2563EB"><div class="t">Última atualização dos dados</div><div class="p">Por: ' + autorTxt(p.atualizadoPor, p.atualizadoFuncao, p.atualizadoEm) + '</div></div>';
    if (!internado && p.dataSaida) tl += '<div class="cpp-ev" style="--c:' + (TIPO_COR[p.tipoSaida] || '#D97706') + '"><div class="t">Saída do serviço</div><div class="d">' + fmtDH(p.dataSaida) + ' · ' + tipoTag(p) + '</div>' +
      '<div class="p">Saída registada por: ' + autorTxt(p.saidaRegistadaPor, p.saidaRegistadaFuncao, p.saidaRegistadaEm) + '</div></div>';
    else tl += '<div class="cpp-ev" style="--c:#94A3B8"><div class="t">Ainda internado</div><div class="d">' + (nDias == null ? '' : nDias + ' dia(s) desde a entrada') + '</div></div>';

    ov.innerHTML = '<div class="cpp-card" role="dialog" aria-label="Processo do paciente">' +
      '<div class="cpp-top"><div class="av">' + esc(iniciais) + '</div><div><h3>' + esc(p.nome) + '</h3><div class="sub">Processo nº ' + p.n + ' · NUP ' + esc(p.nup || '—') + '</div>' +
        '<span class="cpp-estado ' + (internado ? 'int' : 'sai') + '">' + (internado ? 'Internado' : 'Saiu do serviço') + '</span></div><button type="button" class="x" data-fechar aria-label="Fechar">×</button></div>' +
      '<div class="cpp-body">' +
        '<div class="cpp-sec"><h4>Identificação</h4><div class="cpp-grid">' +
          campo('Nome', esc(p.nome), true) + campo('NUP', esc(p.nup)) + campo('Idade', p.idade != null && p.idade !== '' ? esc(p.idade) + ' anos' : '') + campo('Faixa etária', faixa(p.idade)) + campo('Género', esc(p.genero)) +
        '</div></div>' +
        (function () {
          var outros = pacientes().filter(function (q) { return q !== p && p.nup && String(q.nup).trim() === String(p.nup).trim(); })
            .sort(function (a, b) { return String(a.dataEntrada || '').localeCompare(String(b.dataEntrada || '')); });
          if (!outros.length) return '';
          return '<div class="cpp-sec"><h4>Outros internamentos deste processo (' + outros.length + ')</h4><div class="cpp-grid">' + outros.map(function (q) {
            return '<div class="cpp-f largo"><span>' + fmt(q.dataEntrada) + (q.status === 'internado' ? ' · internado' : ' → ' + fmt(q.dataSaida) + (q.tipoSaida ? ' · ' + esc(q.tipoSaida) : '')) + '</span><b><button type="button" class="cpp-bt" data-outro="' + q.n + '" style="padding:4px 10px">Ver este internamento</button></b></div>';
          }).join('') + '</div></div>';
        })() +
        '<div class="cpp-sec"><h4>Internamento' + (Number(p.episodio) > 1 ? ' (' + p.episodio + 'º do processo)' : '') + '</h4><div class="cpp-grid">' +
          campo('Data e hora de entrada', fmtDH(p.dataEntrada)) + campo('Cama / Sala', esc(p.cama)) + campo('Proveniência', esc(p.proveniencia)) + campo('Dias internado', nDias == null ? '' : nDias + ' dia(s)') +
          campo(diags(p).length > 1 ? 'Diagnósticos de entrada (' + diags(p).length + ')' : 'Diagnóstico de entrada', diagsHTML(p), true) +
          campo('Registado por', autorTxt(p.registadoPor, p.registadoFuncao, p.registadoEm), true) +
        '</div></div>' +
        (!internado ? '<div class="cpp-sec"><h4>Saída</h4><div class="cpp-grid">' +
          campo('Data e hora de saída', fmtDH(p.dataSaida)) + campo('Tipo de saída', tipoTag(p)) +
          (p.diagnosticoFinal ? campo('Diagnóstico final', esc(p.diagnosticoFinal) + (p.cidFinal ? ' <small>CID-10: ' + esc(p.cidFinal) + '</small>' : ''), true) : '') +
          campo('Saída registada por', autorTxt(p.saidaRegistadaPor, p.saidaRegistadaFuncao, p.saidaRegistadaEm), true) +
        '</div></div>' : '') +
        '<div class="cpp-sec"><h4>Percurso</h4><div class="cpp-tl">' + tl + '</div></div>' +
      '</div>' +
      '<div class="cpp-acoes"><button type="button" class="cpp-bt" data-fechar>Fechar</button>' +
        '<button type="button" class="cpp-bt" data-pdf>Guardar em PDF</button>' +
        '<button type="button" class="cpp-bt p" data-acao="atu">Atualizar dados</button>' +
        (internado ? '<button type="button" class="cpp-bt s" data-acao="sai">Registar saída</button>' : '') + '</div></div>';
    ov.querySelector('[data-pdf]').addEventListener('click', function () { pdfProcesso(p.n); });
    ov.querySelectorAll('[data-outro]').forEach(function (b) { b.addEventListener('click', function () { abrir(+b.dataset.outro); }); });
    ov.querySelectorAll('[data-acao]').forEach(function (b) {
      b.addEventListener('click', function () {
        fechar();
        ['historicoModal', 'saidaModal'].forEach(function (m) { try { if (b.dataset.acao !== 'sai' || m !== 'saidaModal') closeModal(m); } catch (e) {} });
        if (b.dataset.acao === 'atu') editPaciente(p.n); else cpRegistarSaidaDe(p.n);
      });
    });
    ov.classList.add('on');
  }
  function fechar() { if (ov) ov.classList.remove('on'); }

  // ── Processo em PDF (modelo geral dos PDF do ZELO) ──
  function servico() { var t = document.title.split('—'); return t[t.length - 1].trim(); }
  function quemTxt(nome, funcao, quando) { return nome ? nome + (funcao ? ' (' + funcao + ')' : '') + (quando ? ' — ' + fmtDH(quando) : '') : 'Não registado (registo anterior)'; }
  function pdfProcesso(n) {
    var p = porN(n); if (!p) return;
    if (!window.ZeloPDF || !window.jspdf) { if (typeof showFeedback === 'function') showFeedback('Não foi possível carregar o gerador de PDF', 'error'); return; }
    var internado = p.status === 'internado';
    var nD = internado ? dias(p.dataEntrada, hojeISO()) : dias(p.dataEntrada, p.dataSaida);
    var pdf = ZeloPDF.criar(), CW = pdf.CW, y;
    y = pdf.cab('Processo do Paciente — ' + servico(), p.nome + ' · NUP ' + (p.nup || '—') + ' · ' + (internado ? 'Internado' : 'Saiu do serviço'));
    var tab = function (y, linhas) { return pdf.tabela(y, ['Campo', 'Informação'], [55, CW - 55], linhas.map(function (l) { return [l[0], String(l[1] == null || l[1] === '' ? '—' : l[1])]; })); };
    y = pdf.secT(y, '1. Identificação');
    y = tab(y, [['Nome', p.nome], ['NUP', p.nup], ['Nº do processo', p.n], ['Idade', p.idade !== '' && p.idade != null ? p.idade + ' anos' : ''], ['Faixa etária', faixa(p.idade)], ['Género', p.genero]]);
    y = pdf.secT(y, '2. Internamento');
    var ds = diags(p);
    y = tab(y, [['Data e hora de entrada', fmtDH(p.dataEntrada)], ['Cama / Sala', p.cama], ['Proveniência', p.proveniencia], ['Dias internado', nD == null ? '' : nD + ' dia(s)' + (internado ? ' (até hoje)' : '')]]
      .concat(ds.length ? ds.map(function (x, i) { return [ds.length > 1 ? (x.principal ? 'Diagnóstico principal' : 'Diagnóstico secundário ' + i) : 'Diagnóstico de entrada', x.nome + (x.cid ? '  ·  CID-10 ' + x.cid : '')]; }) : [['Diagnóstico de entrada', '']])
      .concat([['Registado por', quemTxt(p.registadoPor, p.registadoFuncao, p.registadoEm)]]));
    y = pdf.secT(y, '3. Saída');
    y = internado ? pdf.txt(y, ' ', 'O paciente continua internado.')
      : tab(y, [['Data e hora de saída', fmtDH(p.dataSaida)], ['Tipo de saída', (p.tipoSaida === 'Alta Vivo' ? 'Alta' : p.tipoSaida || '') + (p.subtipo && p.subtipo !== '—' ? ' · ' + p.subtipo : '')]]
          .concat(p.diagnosticoFinal ? [['Diagnóstico final', p.diagnosticoFinal + (p.cidFinal ? '  ·  CID-10 ' + p.cidFinal : '')]] : [])
          .concat([['Saída registada por', quemTxt(p.saidaRegistadaPor, p.saidaRegistadaFuncao, p.saidaRegistadaEm)]]));
    y = pdf.secT(y, '4. Percurso');
    var perc = [['Entrada', fmtDH(p.dataEntrada), quemTxt(p.registadoPor, p.registadoFuncao, p.registadoEm)]];
    if (p.atualizadoPor) perc.push(['Última atualização', fmtDH(p.atualizadoEm), quemTxt(p.atualizadoPor, p.atualizadoFuncao)]);
    if (!internado) perc.push(['Saída', fmtDH(p.dataSaida), quemTxt(p.saidaRegistadaPor, p.saidaRegistadaFuncao, p.saidaRegistadaEm)]);
    y = pdf.tabela(y, ['Passo', 'Data e hora', 'Profissional'], [38, 42, CW - 80], perc);
    pdf.rodape();
    pdf.d.save(('Processo_' + p.nome + '_NUP_' + (p.nup || p.n)).replace(/[^\wÀ-ÿ]+/g, '_') + '.pdf');
    if (typeof showFeedback === 'function') showFeedback('PDF do processo gerado', 'success');
  }

  // ── Atualizar: botão para eliminar o registo (pede confirmação) ──
  function eliminarNaEdicao() {
    var modal = document.getElementById('editModal'); if (!modal || document.getElementById('cpp-eliminar')) return;
    var foot = modal.querySelector('.modal-footer'); if (!foot) return;
    var b = document.createElement('button'); b.type = 'button'; b.id = 'cpp-eliminar'; b.className = 'btn cpp-eliminar';
    b.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> Anular registo';
    foot.insertBefore(b, foot.firstChild);
    b.addEventListener('click', function () {
      var n; try { n = editingPacienteN; } catch (e) { n = null; }
      var p = porN(n); if (!p) return;
      if (!confirm('Anular o registo de ' + p.nome + ' (NUP ' + (p.nup || '—') + ')?\n\nSai da lista e das estatísticas deste serviço, mas o processo NÃO é apagado: fica guardado no arquivo do Processo clínico e pode ser restaurado.')) return;
      var orig = window.confirm; window.confirm = function () { return true; };   // já confirmou acima
      try { deletePaciente(p.n); } finally { window.confirm = orig; }
      if (!porN(p.n)) { try { closeModal('editModal'); } catch (e) {} try { editingPacienteN = null; } catch (e) {} }
    });
  }

  // ── Pesquisa em todos os processos (nome, NUP ou nº) ──
  function procurar(q) {
    q = norm(q).trim(); if (q.length < 2) return [];
    return pacientes().filter(function (p) { return norm([p.nome, p.nup, p.n].join(' ')).indexOf(q) >= 0; })
      .sort(function (a, b) { return (a.status === 'internado' ? 0 : 1) - (b.status === 'internado' ? 0 : 1) || b.n - a.n; });
  }
  function linhaRes(p) {
    var est = p.status === 'internado' ? '<span class="cph-q e">Internado</span>' : '<span class="cph-q s">Saiu ' + fmt(p.dataSaida) + '</span>';
    return '<div class="cpp-item" data-proc="' + p.n + '"><div class="t"><b>' + esc(p.nome) + '</b> ' + est +
      '<div class="l2">NUP ' + esc(p.nup || '—') + ' · ' + esc(p.idade) + ' anos · ' + esc(p.genero || '—') + ' · Entrada ' + fmtDH(p.dataEntrada) + (p.registadoPor ? ' · Registado por ' + esc(p.registadoPor) : '') + '</div></div><span class="ver">Ver processo ›</span></div>';
  }
  // HTML do bloco "Processos encontrados" (usado pela lista).
  function resultados(q) {
    var r = procurar(q); if (!String(q || '').trim() || String(q).trim().length < 2) return '';
    return '<div class="cpp-res"><div class="cpp-res-h">Processos encontrados: ' + r.length + '<small>internados e saídos · toque para ver o processo completo</small></div>' +
      (r.length ? r.slice(0, 12).map(linhaRes).join('') + (r.length > 12 ? '<div class="cpp-item" style="cursor:default"><div class="t l2">… e mais ' + (r.length - 12) + '. Escreva mais letras do nome ou o NUP completo.</div></div>' : '')
        : '<div class="cpp-item" style="cursor:default"><div class="t"><div class="l2">Nenhum paciente com este nome ou NUP neste serviço.</div></div></div>') + '</div>';
  }

  // ── Registar Saída: ficha do paciente encontrado ──
  function melhorarSaida() {
    var origInfo = window.updateSaidaInfo;
    if (typeof origInfo === 'function' && !origInfo.__cpProc) {
      var novo = function () {
        var r = origInfo.apply(this, arguments);
        try {
          var sel = document.getElementById('fSaidaPaciente'), p = sel && porN(sel.value), box = document.getElementById('saidaInfo');
          if (p && box) {
            var nD = dias(p.dataEntrada, hojeISO());
            box.innerHTML = '<b style="font-size:1rem">' + esc(p.nome) + '</b> <span class="cpp-link2" data-proc="' + p.n + '">Ver processo completo ›</span>' +
              '<div class="cpp-mini">' +
                '<div><span>NUP</span><b>' + esc(p.nup || '—') + '</b></div><div><span>Idade · Género</span><b>' + esc(p.idade) + ' anos · ' + esc(p.genero || '—') + '</b></div>' +
                '<div><span>Cama / Sala</span><b>' + esc(p.cama || '—') + '</b></div><div><span>Entrada</span><b>' + fmtDH(p.dataEntrada) + '</b></div>' +
                '<div><span>Dias internado</span><b>' + (nD == null ? '—' : nD) + '</b></div><div><span>Proveniência</span><b>' + esc(p.proveniencia || '—') + '</b></div>' +
                '<div style="grid-column:1/-1"><span>Diagnóstico' + (diags(p).length > 1 ? 's' : '') + '</span><b>' + esc(diagsTxt(p)) + '</b></div>' +
                '<div style="grid-column:1/-1"><span>Registado por</span><b>' + (p.registadoPor ? esc(p.registadoPor) + (p.registadoFuncao ? ' · ' + esc(p.registadoFuncao) : '') + (p.registadoEm ? ' — ' + fmtDH(p.registadoEm) : '') : '<span class="cpp-nd">Não registado (registo anterior)</span>') + '</b></div>' +
              '</div>';
          }
        } catch (e) { console.warn(e); }
        return r;
      };
      novo.__cpProc = true; window.updateSaidaInfo = novo;
    }
    var origFiltro = window.filterSaidaPacienteOptions;
    if (typeof origFiltro === 'function' && !origFiltro.__cpProc) {
      var nf = function () {
        var r = origFiltro.apply(this, arguments);
        try {
          var inp = document.getElementById('searchSaidaPaciente'), sel = document.getElementById('fSaidaPaciente');
          var q = inp ? inp.value.trim() : '';
          var aviso = document.getElementById('cpp-saida-aviso');
          if (!aviso && inp) { aviso = document.createElement('div'); aviso.id = 'cpp-saida-aviso'; inp.parentNode.appendChild(aviso); }
          if (aviso) aviso.innerHTML = '';
          if (sel && q.length >= 2) {
            var opts = Array.prototype.filter.call(sel.options, function (o) { return o.value; });
            // Um só internado encontrado: fica logo escolhido e a ficha aparece.
            if (opts.length === 1 && sel.value !== opts[0].value) { sel.value = opts[0].value; window.updateSaidaInfo(); }
            if (!opts.length && aviso) {
              var saidos = procurar(q).filter(function (p) { return p.status !== 'internado'; });
              aviso.innerHTML = saidos.length
                ? '<div class="cpp-aviso">' + saidos.slice(0, 3).map(function (p) { return '<b>' + esc(p.nome) + '</b> (NUP ' + esc(p.nup) + ') já saiu em ' + fmtDH(p.dataSaida) + ' — <a data-proc="' + p.n + '">ver processo</a>'; }).join('<br>') + '</div>'
                : '<div class="cpp-aviso">Nenhum paciente internado com este nome ou NUP.</div>';
            }
          }
        } catch (e) { console.warn(e); }
        return r;
      };
      nf.__cpProc = true; window.filterSaidaPacienteOptions = nf;
    }
  }

  // ── Histórico Diário ──
  var qHist = '';
  function historico() {
    var mesEl = document.getElementById('historicoMes'), alvo = document.getElementById('historicoConteudo');
    if (!mesEl || !alvo) return;
    if (!mesEl.value) mesEl.value = hojeISO().slice(0, 7);
    var ym = mesEl.value;
    var ev = [];
    pacientes().forEach(function (p) {
      if (dia(p.dataEntrada).slice(0, 7) === ym) ev.push({ t: 'e', quando: p.dataEntrada, p: p });
      if (p.status !== 'internado' && p.dataSaida && dia(p.dataSaida).slice(0, 7) === ym) ev.push({ t: 's', quando: p.dataSaida, p: p });
    });
    var nE = ev.filter(function (e) { return e.t === 'e'; }).length, nS = ev.length - nE;
    var nOb = ev.filter(function (e) { return e.t === 's' && e.p.tipoSaida === 'Óbito'; }).length;
    var q = norm(qHist).trim();
    if (q) ev = ev.filter(function (e) { return norm([e.p.nome, e.p.nup, e.p.n, e.p.diagnostico, e.p.outrosDiagnosticos, e.p.cama, e.p.registadoPor, e.p.saidaRegistadaPor].join(' ')).indexOf(q) >= 0; });
    ev.sort(function (a, b) { return String(b.quando).localeCompare(String(a.quando)); });
    var porDia = {}; ev.forEach(function (e) { (porDia[dia(e.quando)] = porDia[dia(e.quando)] || []).push(e); });
    var html = '<div class="cph-res"><div><b>' + nE + '</b><span>Entradas no mês</span></div><div><b>' + nS + '</b><span>Saídas no mês</span></div><div><b>' + nOb + '</b><span>Óbitos</span></div><div><b>' + Object.keys(porDia).length + '</b><span>Dias com registos' + (q ? ' (pesquisa)' : '') + '</span></div></div>';
    var chaves = Object.keys(porDia).sort().reverse();
    if (!chaves.length) html += '<div class="cpg-vazio" style="padding:18px 4px">' + (q ? 'Nada encontrado para esta pesquisa neste mês.' : 'Sem registos neste mês.') + '</div>';
    chaves.forEach(function (d) {
      var l = porDia[d], e = l.filter(function (x) { return x.t === 'e'; }).length, s = l.length - e;
      var titulo = new Date(d + 'T00:00:00').toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }); titulo = titulo.charAt(0).toUpperCase() + titulo.slice(1);
      html += '<div class="cph-dia"><div class="cph-dia-h">' + titulo + '<small>' + (e ? '<span class="cph-q e">' + e + ' entrada(s)</span>' : '') + (s ? '<span class="cph-q s">' + s + ' saída(s)</span>' : '') + '</small></div>' +
        l.map(function (x) {
          var p = x.p, ent = x.t === 'e';
          var quem = ent ? (p.registadoPor ? 'Registado por <b>' + esc(p.registadoPor) + '</b>' + (p.registadoFuncao ? ' · ' + esc(p.registadoFuncao) : '') : '<span class="cpp-nd">Quem registou: não registado</span>')
                         : (p.saidaRegistadaPor ? 'Saída registada por <b>' + esc(p.saidaRegistadaPor) + '</b>' + (p.saidaRegistadaFuncao ? ' · ' + esc(p.saidaRegistadaFuncao) : '') : '<span class="cpp-nd">Quem registou a saída: não registado</span>');
          var t = p.tipoSaida || 'Saída';
          return '<div class="cph-l" data-proc="' + p.n + '"><span class="cph-h">' + (hora(x.quando) || '—') + '</span>' +
            (ent ? '<span class="cph-t e">Entrada</span>' : '<span class="cph-t s" style="--t:' + (TIPO_COR[t] || '#D97706') + '">' + esc(t === 'Alta Vivo' ? 'Alta' : t) + '</span>') +
            '<div class="n"><b>' + esc(p.nome) + '</b><div class="l2">NUP ' + esc(p.nup || '—') + ' · ' + esc(p.idade) + ' anos · ' + esc(p.genero || '—') + ' · ' + esc(p.cama || 'sem cama') +
              (ent ? ' · ' + esc(diagsTxt(p)) : ' · Entrou ' + fmtDH(p.dataEntrada) + ' · ' + (dias(p.dataEntrada, p.dataSaida) == null ? '' : dias(p.dataEntrada, p.dataSaida) + ' dia(s)') + (p.subtipo && p.subtipo !== '—' ? ' · ' + esc(p.subtipo) : '')) +
              '</div><div class="l3">' + quem + '</div></div><span class="ver">Ver processo ›</span></div>';
        }).join('') + '</div>';
    });
    alvo.innerHTML = html;
  }
  function melhorarHistorico() {
    var modal = document.getElementById('historicoModal'); if (!modal) return;
    var h2 = modal.querySelector('.modal-title h2'); if (h2) h2.textContent = 'Histórico do Serviço';
    var mes = document.getElementById('historicoMes');
    var row = mes && mes.closest('.form-row');
    if (row && !document.getElementById('cph-busca')) {
      row.classList.add('cph-top');
      row.insertAdjacentHTML('beforeend', '<div class="field" style="flex:1"><label>Procurar no mês</label><input type="text" id="cph-busca" placeholder="Nome, NUP, diagnóstico, cama ou profissional…" autocomplete="off"></div>');
      document.getElementById('cph-busca').addEventListener('input', function () { qHist = this.value; historico(); });
    }
    var alvo = document.getElementById('historicoConteudo'); if (alvo) alvo.style.maxHeight = '60vh';
    window.carregarHistoricoDiario = historico;
    // Ao abrir, mostra logo o mês corrente.
    var om = window.openModal;
    if (typeof om === 'function' && !om.__cpProc) {
      var nom = function (id) { var r = om.apply(this, arguments); if (id === 'historicoModal') { try { historico(); } catch (e) {} } return r; };
      nom.__cpProc = true; window.openModal = nom;
    }
  }

  function montar() {
    if (document.getElementById('cpp-estilos')) return;
    var st = document.createElement('style'); st.id = 'cpp-estilos'; st.textContent = css; document.head.appendChild(st);
    ligarAutoria(); melhorarSaida(); melhorarHistorico(); eliminarNaEdicao();
    // Qualquer elemento com data-proc abre o processo desse paciente.
    document.addEventListener('click', function (e) {
      var el = e.target.closest('[data-proc]'); if (!el) return;
      e.preventDefault(); abrir(el.getAttribute('data-proc'));
    });
  }

  window.ZeloCpProcesso = { abrir: abrir, procurar: procurar, resultados: resultados };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(montar, 0); });
  else setTimeout(montar, 0);
})();
