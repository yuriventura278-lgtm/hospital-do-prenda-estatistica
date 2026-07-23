// ZELO — breadcrumb + atalho anterior/seguinte entre serviços do mesmo grupo.
// Fonte de verdade: a mesma ordem/agrupamento usado em servicos.html.
(function(){
  const GRUPOS = [
    { label: 'Especialidades Cirúrgicas', itens: [
      { nome: 'Cirurgia Geral', file: 'Cirurgia_Geral.html' },
      { nome: 'Ortopedia', file: 'Ortopedia.html' },
      { nome: 'Neurocirurgia', file: 'Neurocirurgia.html' },
      { nome: 'Maxilo Facial', file: 'Cirurgia_Maxilo_Facial.html' },
      { nome: 'Oftalmologia', file: 'Oftalmologia.html' },
      { nome: 'Otorrinolaringologia', file: 'Otorrinolaringologia.html' },
      { nome: 'Bloco Operatório', file: 'Bloco_Operatorio.html' },
    ]},
    { label: 'Internamento & Cuidados', itens: [
      { nome: 'Medicina Interna', file: 'banco_medicina_interna_v2-2-1-2-1.html' },
      { nome: 'Nefrologia', file: 'Banco_Nefrologia_v2-1.html' },
      { nome: 'UCI / Cuidados Intermédios', file: 'banco_uci_v1-3-1-1.html' },
      { nome: 'Fisioterapia', file: 'banco_fisioterapia_v1-1-1.html' },
    ]},
    { label: 'Diagnóstico & Laboratório', itens: [
      { nome: 'Laboratório Clínico', file: 'Laboratório_Clínico.html' },
      { nome: 'Imagiologia', file: 'Imagiologia.html' },
    ]},
    { label: 'Urgência & Ambulatório', itens: [
      { nome: 'Consulta Externa', file: 'Consulta_Externa-2.html' },
      { nome: 'Psicologia Clínica', file: 'psicologia_clinica_hp-1-3-1.html' },
    ]},
  ];

  function nomeFicheiroAtual(){
    const partes = window.location.pathname.split('/');
    return decodeURIComponent(partes[partes.length - 1]);
  }

  function encontrarPosicao(){
    const atual = nomeFicheiroAtual();
    for (const g of GRUPOS){
      const i = g.itens.findIndex(it => it.file === atual);
      if (i !== -1) return { grupo: g, indice: i };
    }
    return null;
  }

  function montarHtml(pos){
    const { grupo, indice } = pos;
    const atual = grupo.itens[indice];
    const anterior = grupo.itens[indice - 1] || null;
    const seguinte = grupo.itens[indice + 1] || null;

    const crumb = `
      <a href="index.html">Início</a>
      <span class="znav-sep">›</span>
      <a href="servicos.html">${grupo.label}</a>
      <span class="znav-sep">›</span>
      <span class="znav-atual">${atual.nome}</span>
    `;

    const btnAnterior = anterior
      ? `<a class="znav-btn" href="${anterior.file}" title="${anterior.nome}"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg><span>${anterior.nome}</span></a>`
      : `<span class="znav-btn znav-btn-disabled"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg><span>—</span></span>`;

    const btnSeguinte = seguinte
      ? `<a class="znav-btn" href="${seguinte.file}" title="${seguinte.nome}"><span>${seguinte.nome}</span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></a>`
      : `<span class="znav-btn znav-btn-disabled"><span>—</span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></span>`;

    return `<div class="znav-crumb">${crumb}</div><div class="znav-arrows">${btnAnterior}${btnSeguinte}</div>`;
  }

  function montarEstilos(){
    if (document.getElementById('zelo-service-nav-style')) return;
    const style = document.createElement('style');
    style.id = 'zelo-service-nav-style';
    style.textContent = `
      .zelo-service-nav{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;
        background:#fff;border-bottom:1px solid #E2E8F0;padding:8px 16px;font-family:'Inter',sans-serif;}
      .znav-crumb{font-size:.72rem;color:#64748B;display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
      .znav-crumb a{color:#64748B;text-decoration:none;font-weight:600;}
      .znav-crumb a:hover{color:#1A56DB;text-decoration:underline;}
      .znav-sep{color:#CBD5E1;}
      .znav-atual{color:#0F172A;font-weight:700;}
      .znav-arrows{display:flex;gap:6px;}
      .znav-btn{display:flex;align-items:center;gap:5px;font-size:.68rem;font-weight:600;color:#334155;
        background:#F4F7FF;border:1px solid #E2E8F0;border-radius:100px;padding:5px 11px;text-decoration:none;
        white-space:nowrap;max-width:170px;overflow:hidden;text-overflow:ellipsis;transition:background .13s,border-color .13s;}
      .znav-btn:hover{background:#EFF6FF;border-color:#93C5FD;color:#1A56DB;}
      .znav-btn span{overflow:hidden;text-overflow:ellipsis;}
      .znav-btn-disabled{opacity:.35;cursor:default;}
      .znav-btn-disabled:hover{background:#F4F7FF;border-color:#E2E8F0;color:#334155;}
      @media (max-width:640px){
        .znav-btn span{display:none;}
        .znav-crumb{font-size:.66rem;}
      }
    `;
    document.head.appendChild(style);
  }

  function iniciar(){
    const pos = encontrarPosicao();
    if (!pos) return;
    const alvo = document.getElementById('zelo-nav-slot');
    if (!alvo) return;
    montarEstilos();
    alvo.className = 'zelo-service-nav';
    alvo.innerHTML = montarHtml(pos);
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
