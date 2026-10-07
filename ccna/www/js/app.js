/* CCNA Passo a Passo — aplicação. Lê window.CCNA (gerado por build.py). */
(function () {
  "use strict";
  const D = window.CCNA, F = window.Figuras;
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const NOTA_APROVACAO = 825;
  const CHAVE = "ccna-passo-a-passo-v1";

  // ------------------------------------------------------------ índices
  const MODS = D.modulos;
  const LICOES = {}, MOD_DA = {};
  MODS.forEach((m) => m.licoes.forEach((l, i) => { LICOES[l.id] = l; MOD_DA[l.id] = m; l._i = i; }));

  // ------------------------------------------------------------ ícones da interface
  const IC = {
    casa: '<path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    trilha: '<path d="M4 6h10M4 12h16M4 18h7"/><circle cx="18" cy="6" r="2"/><circle cx="15" cy="18" r="2"/>',
    jogo: '<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 11v3M5.5 12.5h3"/><circle cx="16" cy="11.5" r="1"/><circle cx="18" cy="13.5" r="1"/>',
    trofeu: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8M9 17h6"/>',
    livro: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5M8 7h7"/>',
    voltar: '<path d="M15 5 8 12l7 7"/>',
    perfil: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    raio: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    calc: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8M8 11h2M14 11h2M8 15h2M14 15h2M8 19h2M14 19h2"/>',
    terminal: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m6 9 4 3-4 3M12 15h6"/>',
    caderno: '<path d="M6 3h12v18H6zM9 7h6M9 11h6M9 15h3"/><path d="M4 7h2M4 11h2M4 15h2"/>',
    dica: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>',
    alerta: '<path d="M12 3 2 20h20zM12 10v4M12 17v.5"/>',
    play: '<path d="M7 4v16l13-8z" fill="currentColor"/>',
    estrela: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill="currentColor" stroke="none"/>',
    cadeado: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
    repetir: '<path d="M4 12a8 8 0 0 1 14-5.3M20 4v5h-5M20 12a8 8 0 0 1-14 5.3M4 20v-5h5"/>',
    medalha: '<circle cx="12" cy="14" r="6"/><path d="M8 3l2 5M16 3l-2 5M12 11.5v5M10 13h4"/>',
    fogo: '<path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-4-1-6 1-9z"/>',
    relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    lua: '<path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5z"/>',
  };
  const ic = (n, cls) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${cls || ""}" aria-hidden="true">${IC[n]}</svg>`;

  // ------------------------------------------------------------ estado guardado
  const NIVEIS = [
    [0, "Estagiário de Redes"], [200, "Técnico Nível 1"], [600, "Técnico Nível 2"], [1200, "Administrador de Redes"],
    [2200, "Associado CCNA"], [3500, "Especialista em Redes"], [5000, "Arquiteto de Redes"],
  ];
  const CORES_AVATAR = ["#0a6c8c", "#2b8a6e", "#6a5acd", "#b5651d", "#8b3a62", "#3d6fb6"];

  function novoPerfil(nome) {
    return { id: "p" + Date.now().toString(36), nome, cor: CORES_AVATAR[Math.floor(Math.random() * CORES_AVATAR.length)], xp: 0, licoes: {}, provas: {}, labs: {}, erros: [], dias: [], conquistas: {}, recordes: { subrede: 0, relampago: 0 }, criado: Date.now() };
  }
  let S;
  function carregar() {
    try { S = JSON.parse(localStorage.getItem(CHAVE)); } catch (e) { S = null; }
    if (!S || !S.perfis) {
      const p = novoPerfil("Estudante");
      S = { perfis: { [p.id]: p }, ativo: p.id, tema: "auto", livre: false };
    }
  }
  function guardar() { try { localStorage.setItem(CHAVE, JSON.stringify(S)); } catch (e) { /* armazenamento indisponível: a app funciona na mesma */ } }
  const P = () => S.perfis[S.ativo];

  function nivel(xp) {
    let i = 0; while (i + 1 < NIVEIS.length && xp >= NIVEIS[i + 1][0]) i++;
    const atual = NIVEIS[i], prox = NIVEIS[i + 1];
    return { i, nome: atual[1], min: atual[0], prox: prox ? prox[0] : null, proxNome: prox ? prox[1] : null, pct: prox ? (xp - atual[0]) / (prox[0] - atual[0]) : 1 };
  }
  function ganharXP(n, motivo) {
    const antes = nivel(P().xp).i;
    P().xp += n;
    marcarDia();
    guardar();
    const depois = nivel(P().xp);
    toast(depois.i > antes ? `Subiu de nível: ${depois.nome}!` : `+${n} XP${motivo ? " · " + motivo : ""}`);
    verificarConquistas();
  }
  function marcarDia() {
    const hoje = new Date().toISOString().slice(0, 10);
    const d = P().dias; if (d[d.length - 1] !== hoje) { d.push(hoje); if (d.length > 400) d.shift(); }
  }
  function sequencia() {
    const d = new Set(P().dias); let n = 0; const dia = new Date();
    if (!d.has(dia.toISOString().slice(0, 10))) dia.setDate(dia.getDate() - 1);
    while (d.has(dia.toISOString().slice(0, 10))) { n++; dia.setDate(dia.getDate() - 1); }
    return n;
  }

  // ------------------------------------------------------------ progresso
  const licaoFeita = (id) => (P().licoes[id] || {}).melhor >= 70;
  const provaFeita = (mid) => (P().provas[mid] || {}).melhor >= NOTA_APROVACAO;
  function moduloAberto(m) { if (S.livre) return true; const i = MODS.indexOf(m); return i === 0 || provaFeita(MODS[i - 1].id); }
  function licaoAberta(l) { const m = MOD_DA[l.id]; if (S.livre) return true; if (!moduloAberto(m)) return false; return l._i === 0 || licaoFeita(m.licoes[l._i - 1].id); }
  const provaAberta = (m) => S.livre || (moduloAberto(m) && m.licoes.every((l) => licaoFeita(l.id)));
  function progressoModulo(m) { const feitas = m.licoes.filter((l) => licaoFeita(l.id)).length + (provaFeita(m.id) ? 1 : 0); return feitas / (m.licoes.length + 1); }
  function proximaLicao() {
    for (const m of MODS) {
      if (!moduloAberto(m)) return null;
      for (const l of m.licoes) if (!licaoFeita(l.id)) return { tipo: "licao", l, m };
      if (!provaFeita(m.id)) return { tipo: "prova", m };
    }
    return null;
  }
  function leds(m) {
    const prox = proximaLicao();
    let s = m.licoes.map((l) => {
      const c = licaoFeita(l.id) ? "on" : (prox && prox.l === l ? "amb" : "");
      return `<i class="led ${c}" title="${esc(l.titulo)}"></i>`;
    }).join("");
    const pe = provaFeita(m.id) ? "on" : (prox && prox.tipo === "prova" && prox.m === m ? "amb" : "");
    return s + `<i class="led exame ${pe}" title="Prova do módulo"></i>`;
  }

  // ------------------------------------------------------------ conquistas
  const CONQUISTAS = [
    ["primeira", "Primeira lição", "Concluir uma lição", (p) => Object.values(p.licoes).some((l) => l.melhor >= 70)],
    ["perfeito", "Nota máxima", "100% num quiz", (p) => Object.values(p.licoes).some((l) => l.melhor === 100)],
    ["prova", "Aprovado", "Passar uma prova de módulo", (p) => Object.values(p.provas).some((x) => x.melhor >= NOTA_APROVACAO)],
    ["metade", "Meio caminho", "Passar 5 provas", (p) => Object.values(p.provas).filter((x) => x.melhor >= NOTA_APROVACAO).length >= 5],
    ["ccna", "Pronto para o CCNA", "Passar todas as provas", (p) => MODS.every((m) => (p.provas[m.id] || {}).melhor >= NOTA_APROVACAO)],
    ["subrede", "Calculadora humana", "10 sub-redes seguidas", (p) => p.recordes.subrede >= 10],
    ["relampago", "Relâmpago", "15 pontos no quiz relâmpago", (p) => p.recordes.relampago >= 15],
    ["lab1", "Mãos no teclado", "Concluir um laboratório", (p) => Object.keys(p.labs).length >= 1],
    ["lab5", "Engenheiro de campo", "Concluir 5 laboratórios", (p) => Object.keys(p.labs).length >= 5],
    ["semana", "Disciplina", "Estudar 7 dias seguidos", () => sequencia() >= 7],
    ["revisor", "Sem erros pendentes", "Limpar o caderno de erros depois de errar", (p) => p.conquistas._errou && p.erros.length === 0],
  ];
  function verificarConquistas() {
    const p = P();
    CONQUISTAS.forEach(([id, nome, , fn]) => { if (!p.conquistas[id] && fn(p)) { p.conquistas[id] = Date.now(); setTimeout(() => toast("Conquista: " + nome), 1600); } });
    guardar();
  }

  // ------------------------------------------------------------ navegação
  let rota = { tela: "inicio" }, pilha = [];
  let limpar = null; // função para parar temporizadores da tela anterior
  function ir(tela, args, semHistorico) {
    if (limpar) { limpar(); limpar = null; }
    if (!semHistorico) pilha.push(rota);
    rota = Object.assign({ tela }, args || {});
    render();
    window.scrollTo(0, 0);
  }
  function voltar() { if (limpar) { limpar(); limpar = null; } rota = pilha.pop() || { tela: "inicio" }; render(); window.scrollTo(0, 0); }
  const RAIZ = { inicio: "Início", trilha: "Trilha", jogar: "Jogar", ranking: "Ranking", guia: "Guia" };

  function render() {
    if (limpar) { limpar(); limpar = null; }
    const t = rota.tela, raiz = !!RAIZ[t];
    const n = nivel(P().xp);
    const titulo = TITULOS[t] ? TITULOS[t]() : "";
    $("#topo").innerHTML = raiz
      ? `<div class="marca">${F.icone("router", 30)}<b>CCNA PASSO A PASSO</b></div><span style="flex:1"></span>
         <span class="xp-pilula tab-num" title="${esc(n.nome)}">${ic("estrela")} ${P().xp} XP</span>
         <button class="btn-icone" data-acao="perfil" aria-label="Perfil e definições">${ic("perfil")}</button>`
      : `<button class="btn-icone" data-acao="voltar" aria-label="Voltar">${ic("voltar")}</button><div class="titulo">${esc(titulo)}</div>`;
    const tab = { inicio: "inicio", trilha: "trilha", modulo: "trilha", licao: "trilha", quiz: "trilha", prova: "trilha", jogar: "jogar", relampago: "jogar", subrede: "jogar", labs: "jogar", lab: "jogar", revisao: "jogar", ranking: "ranking", guia: "guia" }[t];
    document.querySelectorAll(".nav button").forEach((b) => b.setAttribute("aria-current", b.dataset.ir === tab ? "page" : "false"));
    $("#app").innerHTML = TELAS[t]();
    if (POS[t]) POS[t]();
  }
  const TITULOS = {
    modulo: () => "Módulo " + mod(rota.mid).numero, licao: () => LICOES[rota.lid].titulo, quiz: () => "Quiz · " + LICOES[rota.lid].titulo,
    prova: () => "Prova · Módulo " + mod(rota.mid).numero, relampago: () => "Quiz relâmpago", subrede: () => "Desafio sub-rede",
    labs: () => "Laboratório CLI", lab: () => labPorId(rota.id).titulo, revisao: () => "Caderno de erros", perfil: () => "Perfil e definições",
  };
  const mod = (id) => MODS.find((m) => m.id === id);
  const labPorId = (id) => D.labs.find((l) => l.id === id);

  // ------------------------------------------------------------ ecrãs
  const TELAS = {};
  const POS = {};

  TELAS.inicio = function () {
    const p = P(), n = nivel(p.xp), prox = proximaLicao(), seq = sequencia();
    const totalLicoes = Object.keys(LICOES).length, feitas = Object.keys(LICOES).filter(licaoFeita).length;
    let continuar;
    if (!prox) continuar = `<div class="cartao"><span class="rotulo">Trilha concluída</span><h2>Passou todas as provas.</h2><p class="suave">Mantenha a forma no quiz relâmpago e marque o exame 200-301.</p></div>`;
    else if (prox.tipo === "licao") continuar = `<button class="item" data-acao="licao" data-id="${prox.l.id}">
        <div class="ico-caixa">${F.icone(prox.m.icone in F.ICONES ? prox.m.icone : "router", 34)}</div>
        <div class="meio"><span class="rotulo">Continuar · Módulo ${prox.m.numero}</span><b>${esc(prox.l.titulo)}</b><span class="suave peq">${prox.l.minutos} min · ${esc(prox.l.nivel)}</span></div>
        <span class="estado-ico atual">${ic("play")}</span></button>`;
    else continuar = `<button class="item" data-acao="prova" data-id="${prox.m.id}"><div class="ico-caixa">${ic("medalha")}</div>
        <div class="meio"><span class="rotulo">Pronto para a prova</span><b>Prova do Módulo ${prox.m.numero}: ${esc(prox.m.titulo)}</b><span class="suave peq">Precisa de ${NOTA_APROVACAO}/1000</span></div><span class="estado-ico atual">${ic("play")}</span></button>`;
    const dica = D.guia.dicas[new Date().getDate() % D.guia.dicas.length];
    return `
      <section class="nivel">
        <span class="rotulo" style="color:inherit;opacity:.85">Olá, ${esc(p.nome)}</span>
        <h1>${esc(n.nome)}</h1>
        <div class="barra" role="progressbar" aria-valuenow="${Math.round(n.pct * 100)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${n.pct * 100}%"></i></div>
        <div class="meta tab-num"><span>${p.xp} XP${n.prox ? ` · faltam ${n.prox - p.xp} para ${esc(n.proxNome)}` : ""}</span><span>${feitas}/${totalLicoes} lições</span><span>${seq} dia${seq === 1 ? "" : "s"} seguidos</span></div>
      </section>
      ${continuar}
      <section class="secao">
        <header><h2>O seu painel</h2><span class="rotulo">cada LED é uma lição</span></header>
        <div class="painel">${MODS.map((m) => `<button class="fila" data-acao="modulo" data-id="${m.id}" aria-label="Módulo ${m.numero}: ${esc(m.titulo)}">
          <span class="num">M${String(m.numero).padStart(2, "0")}</span><span class="leds">${leds(m)}</span><span class="pct tab-num">${moduloAberto(m) ? Math.round(progressoModulo(m) * 100) + "%" : "🔒"}</span></button>`).join("")}</div>
      </section>
      <section class="secao">
        <h2>Praticar</h2>
        <div class="acoes">
          <button class="acao" data-acao="ir" data-tela="relampago">${ic("raio")}<b>Quiz relâmpago</b><span>60 segundos, recorde ${p.recordes.relampago}</span></button>
          <button class="acao" data-acao="ir" data-tela="subrede">${ic("calc")}<b>Desafio sub-rede</b><span>Melhor série: ${p.recordes.subrede}</span></button>
          <button class="acao" data-acao="ir" data-tela="labs">${ic("terminal")}<b>Laboratório CLI</b><span>${Object.keys(p.labs).length}/${D.labs.length} concluídos</span></button>
          <button class="acao" data-acao="ir" data-tela="revisao">${ic("caderno")}<b>Caderno de erros</b><span>${p.erros.length} pergunta${p.erros.length === 1 ? "" : "s"} para rever</span></button>
        </div>
      </section>
      <div class="dica">${ic("dica")}<div><b>Dica de exame.</b> ${esc(dica)}</div></div>`;
  };

  TELAS.trilha = function () {
    return `<div class="secao"><h1>Trilha CCNA 200-301</h1><p class="suave">Do mais básico ao mais complexo. Cada módulo termina com uma prova; passe com ${NOTA_APROVACAO}/1000 para desbloquear o seguinte${S.livre ? " (modo livre ativo: tudo desbloqueado)" : ""}.</p></div>
      <div class="lista">${MODS.map((m) => {
        const aberto = moduloAberto(m), pct = Math.round(progressoModulo(m) * 100);
        return `<button class="item" data-acao="modulo" data-id="${m.id}" ${aberto ? "" : 'aria-disabled="true"'}>
          <div class="ico-caixa">${F.icone(m.icone in F.ICONES ? m.icone : "router", 34)}</div>
          <div class="meio"><span class="rotulo">Módulo ${m.numero} · ${esc(m.dominio)}</span><b>${esc(m.titulo)}</b>
            <span class="leds">${leds(m)}</span></div>
          ${aberto ? `<span class="chip ${pct === 100 ? "ok" : pct ? "acc" : ""} tab-num">${pct}%</span>` : `<span class="estado-ico bloq">${ic("cadeado")}</span>`}</button>`;
      }).join("")}</div>`;
  };

  TELAS.modulo = function () {
    const m = mod(rota.mid), aberto = moduloAberto(m);
    const pr = P().provas[m.id];
    const labs = D.labs.filter((l) => l.modulo === m.id);
    return `<div class="secao"><span class="rotulo">Módulo ${m.numero} · ${esc(m.dominio)}</span><h1>${esc(m.titulo)}</h1><p class="suave">${esc(m.descricao)}</p>
        <div class="linha"><span class="leds">${leds(m)}</span><span class="chip tab-num">${Math.round(progressoModulo(m) * 100)}% concluído</span></div></div>
      ${aberto ? "" : `<div class="alerta">${ic("cadeado")}<div>Passe a prova do Módulo ${m.numero - 1} para desbloquear, ou ative o <b>modo livre</b> no perfil.</div></div>`}
      <div class="lista">${m.licoes.map((l, i) => {
        const feita = licaoFeita(l.id), ab = licaoAberta(l), r = P().licoes[l.id];
        return `<button class="item" data-acao="licao" data-id="${l.id}" ${ab ? "" : 'aria-disabled="true"'}>
          <span class="estado-ico ${feita ? "ok" : ab ? "atual" : "bloq"}">${feita ? ic("check") : ab ? i + 1 : ic("cadeado")}</span>
          <div class="meio"><b>${esc(l.titulo)}</b><span class="suave peq">${l.minutos} min · ${esc(l.nivel)} · ${l.quiz.length} perguntas</span></div>
          ${r && r.melhor != null ? `<span class="chip ${r.melhor >= 70 ? "ok" : "warn"} tab-num">${r.melhor}%</span>` : ""}</button>`;
      }).join("")}
        <button class="item" data-acao="prova" data-id="${m.id}" ${provaAberta(m) ? "" : 'aria-disabled="true"'}>
          <span class="estado-ico ${provaFeita(m.id) ? "ok" : provaAberta(m) ? "atual" : "bloq"}">${provaFeita(m.id) ? ic("check") : ic(provaAberta(m) ? "medalha" : "cadeado")}</span>
          <div class="meio"><b>Prova do módulo</b><span class="suave peq">${Math.min(15, totalPerguntas(m))} perguntas · cronometrada · aprovação ${NOTA_APROVACAO}/1000</span></div>
          ${pr ? `<span class="chip ${pr.melhor >= NOTA_APROVACAO ? "ok" : "bad"} tab-num">${pr.melhor}</span>` : ""}</button>
      </div>
      ${labs.length ? `<section class="secao"><h2>Laboratórios deste módulo</h2><div class="lista">${labs.map(itemLab).join("")}</div></section>` : ""}`;
  };
  const totalPerguntas = (m) => m.licoes.reduce((a, l) => a + l.quiz.length, 0) + m.prova_extra.length;

  // ------------------------------------------------------------ lição
  TELAS.licao = function () {
    const l = LICOES[rota.lid], m = MOD_DA[l.id];
    if (!licaoAberta(l)) return `<div class="vazio">${ic("cadeado")}<p>Conclua a lição anterior para abrir esta.</p></div>`;
    const ant = m.licoes[l._i - 1], prox = m.licoes[l._i + 1];
    const r = P().licoes[l.id];
    return `<article class="cab-licao"><span class="rotulo">Módulo ${m.numero} · Lição ${l._i + 1} de ${m.licoes.length}</span><h1>${esc(l.titulo)}</h1>
        <div class="linha"><span class="chip">${ic("relogio")} ${l.minutos} min</span><span class="chip acc">${esc(l.nivel)}</span>${r && r.melhor != null ? `<span class="chip ${r.melhor >= 70 ? "ok" : "warn"}">Melhor quiz: ${r.melhor}%</span>` : ""}</div>
        <div class="cartao plano"><span class="rotulo">Objetivos</span><ul class="objetivos">${l.objetivos.map((o) => `<li>${esc(o)}</li>`).join("")}</ul></div></article>
      <div class="conteudo">${l.blocos.map(bloco).join("")}</div>
      <section class="secao"><h2>Referências bibliográficas</h2><ol class="refs">${l.referencias.map((k) => `<li>${linkar(D.referencias[k])}</li>`).join("")}</ol></section>
      <div class="cartao"><h3>Testar o que aprendeu</h3><p class="suave">${l.quiz.length} perguntas. Precisa de 70% para concluir a lição.</p>
        <button class="btn prim bloco" data-acao="quiz" data-id="${l.id}">${ic("play")} Fazer o quiz</button>
        <button class="btn bloco" data-acao="repetir" data-id="${l.id}">${ic("repetir")} Repetir a aula desde o início</button></div>
      <div class="grelha-2">${ant ? `<button class="btn" data-acao="licao" data-id="${ant.id}">← Anterior</button>` : "<span></span>"}${prox ? `<button class="btn" data-acao="licao" data-id="${prox.id}" ${licaoAberta(prox) ? "" : "disabled"}>Seguinte →</button>` : `<button class="btn" data-acao="prova" data-id="${m.id}" ${provaAberta(m) ? "" : "disabled"}>Prova do módulo →</button>`}</div>`;
  };
  POS.licao = function () {
    const l = LICOES[rota.lid];
    const r = P().licoes[l.id] || (P().licoes[l.id] = {});
    if (!r.lida) { r.lida = Date.now(); guardar(); setTimeout(() => ganharXP(10, "lição aberta"), 400); }
  };
  const linkar = (t) => esc(t).replace(/(https?:\/\/[^\s]+?)(\.?\s|\.?$)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>$2');

  function bloco(b) {
    switch (b.tipo) {
      case "texto": return `<section class="bloco"><h3>${esc(b.titulo)}</h3><div class="html">${b.html}</div></section>`;
      case "exemplo": return `<section class="bloco exemplo"><span class="rotulo">Exemplo</span><h3>${esc(b.titulo)}</h3><div class="html">${b.html}</div></section>`;
      case "figura": return `<figure class="fig-caixa" style="margin:0">${F.figura(b.nome)}<figcaption>${esc(b.legenda)}</figcaption></figure>`;
      case "topologia": return `<figure class="fig-caixa" style="margin:0">${F.topologia(b)}<figcaption>${esc(b.legenda)}</figcaption></figure>`;
      case "dica": return `<div class="dica">${ic("dica")}<div class="html">${b.html}</div></div>`;
      case "alerta": return `<div class="alerta">${ic("alerta")}<div class="html">${b.html}</div></div>`;
      case "tabela": return `<section class="bloco">${b.titulo ? `<h3>${esc(b.titulo)}</h3>` : ""}<div class="tabela-caixa"><table><thead><tr>${b.cabecalho.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${b.linhas.map((l) => `<tr>${l.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div></section>`;
      case "cli": return `<section class="bloco"><h3>${ic("terminal")} ${esc(b.titulo)}</h3><div class="term"><div class="barra-term"><span class="pontos"><i></i><i></i><i></i></span><span>passo a passo</span><button class="btn-copiar" data-acao="copiar-cli">copiar comandos</button></div>
          <ol class="passos">${b.passos.map((p) => `<li><div class="cmdl"><span class="pr">${esc(p.prompt)}</span><span class="cm">${esc(p.cmd)}</span></div>${p.explica ? `<div class="ex">${esc(p.explica)}</div>` : ""}</li>`).join("")}</ol></div>
          ${b.nota ? `<p class="suave peq">${b.nota}</p>` : ""}</section>`;
      case "saida": return `<section class="bloco"><h3>${esc(b.titulo)}</h3><div class="term"><pre>${esc(b.texto)}</pre></div>${b.explica ? `<p class="suave peq">${b.explica}</p>` : ""}</section>`;
      case "sim_real": return `<section class="bloco"><h3>${esc(b.titulo)}</h3><div class="simreal"><div class="sim"><span class="rotulo">No simulador</span><ul>${b.simulador.map((x) => `<li>${x}</li>`).join("")}</ul></div><div class="real"><span class="rotulo">No equipamento real</span><ul>${b.real.map((x) => `<li>${x}</li>`).join("")}</ul></div></div></section>`;
      case "video": {
        const url = b.youtube_id ? "https://www.youtube.com/watch?v=" + encodeURIComponent(b.youtube_id) : "https://www.youtube.com/results?search_query=" + encodeURIComponent(b.busca);
        return `<a class="video" href="${url}" target="_blank" rel="noopener"><span class="play">${ic("play")}</span><span><span class="rotulo">Vídeo de apoio</span><br><b>${esc(b.titulo)}</b><br><span class="suave peq">${b.youtube_id ? "Abrir no YouTube" : "Pesquisar no YouTube: “" + esc(b.busca) + "”"}</span></span></a>`;
      }
      default: return "";
    }
  }

  // ------------------------------------------------------------ motor de perguntas
  function embaralhar(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function prepararPergunta(q) {
    if (q.tipo !== "mc") return Object.assign({}, q);
    const ordem = embaralhar(q.opcoes.map((_, i) => i));
    return Object.assign({}, q, { opcoes: ordem.map((i) => q.opcoes[i]), correta: ordem.indexOf(q.correta), original: q });
  }
  const normCmd = (s) => String(s).toLowerCase().replace(/\s+/g, " ").trim();
  function corrigir(q, resp) {
    if (q.tipo === "mc") return resp === q.correta;
    if (q.tipo === "vf") return resp === q.correta;
    return q.respostas.some((r) => normCmd(r) === normCmd(resp));
  }
  function respostaCerta(q) { return q.tipo === "mc" ? q.opcoes[q.correta] : q.tipo === "vf" ? (q.correta ? "Verdadeiro" : "Falso") : q.respostas[0]; }

  function htmlPergunta(q, estado) {
    const fixo = estado.respondida;
    let corpo;
    if (q.tipo === "mc") corpo = `<div class="opcoes">${q.opcoes.map((o, i) => {
      let c = ""; if (fixo && estado.feedback) { if (i === q.correta) c = "certa"; else if (i === estado.resp) c = "errada"; } else if (estado.resp === i) c = "sel";
      return `<button class="opcao ${c}" data-acao="resp" data-v="${i}" ${fixo ? "disabled" : ""}><span class="letra">${"ABCDEF"[i]}</span><span>${esc(o)}</span></button>`;
    }).join("")}</div>`;
    else if (q.tipo === "vf") corpo = `<div class="opcoes">${[true, false].map((v) => {
      let c = ""; if (fixo && estado.feedback) { if (v === q.correta) c = "certa"; else if (v === estado.resp) c = "errada"; } else if (estado.resp === v) c = "sel";
      return `<button class="opcao ${c}" data-acao="resp" data-v="${v}" ${fixo ? "disabled" : ""}><span class="letra">${v ? "V" : "F"}</span><span>${v ? "Verdadeiro" : "Falso"}</span></button>`;
    }).join("")}</div>`;
    else corpo = `<form data-form="cmd" class="secao"><div class="term" style="display:flex;align-items:center;gap:8px;padding:10px 12px"><span style="color:var(--term-prompt)">Router#</span>
        <input class="campo mono" id="resp-cmd" style="background:transparent;border:0;color:#fff;min-height:36px;padding:0" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="escreva o comando" value="${esc(estado.resp || "")}" ${fixo ? "disabled" : ""}></div>
        ${fixo ? "" : `<button class="btn prim" type="submit">Responder</button>`}</form>`;
    let fb = "";
    if (fixo && estado.feedback) {
      const ok = corrigir(q, estado.resp);
      fb = `<div class="feedback ${ok ? "ok" : "bad"}"><b>${ok ? "Certo!" : "Não é bem assim."}</b>${ok ? "" : `<span>Resposta: <b>${esc(respostaCerta(q))}</b></span>`}<span>${esc(q.explica)}</span></div>`;
    }
    return `<p class="pergunta">${esc(q.p)}</p>${corpo}${fb}`;
  }

  // Sessão genérica de perguntas: usada no quiz, na prova, na revisão e no relâmpago
  let sessao = null;
  function iniciarSessao(cfg) {
    sessao = Object.assign({ i: 0, respostas: [], feedback: true, inicio: Date.now() }, cfg);
    sessao.perguntas = sessao.perguntas.map(prepararPergunta);
  }
  function responder(valor) {
    const q = sessao.perguntas[sessao.i];
    sessao.respostas[sessao.i] = valor;
    const ok = corrigir(q, valor);
    if (!ok) registarErro(q, sessao.origem);
    else if (sessao.tipo === "revisao") removerErro(q);
    if (sessao.feedback) { sessao.mostrar = true; render(); }
    else avancar();
  }
  function avancar() {
    sessao.mostrar = false; sessao.i++;
    if (sessao.i >= sessao.perguntas.length) terminarSessao(); else render();
  }
  function registarErro(q, origem) {
    const base = q.original || q, p = P();
    if (!p.erros.some((e) => e.q.p === base.p)) p.erros.push({ q: base, origem, quando: Date.now() });
    p.conquistas._errou = true; guardar();
  }
  function removerErro(q) { const base = q.original || q; P().erros = P().erros.filter((e) => e.q.p !== base.p); guardar(); }

  function telaPerguntas(extraTopo) {
    const s = sessao, q = s.perguntas[s.i];
    const est = { resp: s.respostas[s.i], respondida: s.mostrar, feedback: s.feedback };
    return `<div class="quiz-topo"><div class="linha entre"><span class="rotulo tab-num">Pergunta ${s.i + 1} de ${s.perguntas.length}</span>${extraTopo || ""}</div>
        <div class="barra"><i style="width:${(s.i / s.perguntas.length) * 100}%"></i></div></div>
      <div class="cartao">${htmlPergunta(q, est)}</div>
      ${s.mostrar ? `<button class="btn prim bloco" data-acao="seguinte">${s.i + 1 < s.perguntas.length ? "Seguinte" : "Ver resultado"}</button>` : ""}`;
  }

  function terminarSessao() {
    const s = sessao;
    s.acertos = s.perguntas.filter((q, i) => corrigir(q, s.respostas[i])).length;
    s.fim = true;
    if (s.aoTerminar) s.aoTerminar(s);
    render();
  }
  function estrelas(pct) { const n = pct >= 100 ? 3 : pct >= 85 ? 2 : pct >= 70 ? 1 : 0; return `<div class="estrelas">${[0, 1, 2].map((i) => `<span class="${i < n ? "on" : "off"}">${ic("estrela")}</span>`).join("")}</div>`; }
  function revisaoRespostas(s) {
    return `<details class="cartao plano"><summary><b>Rever todas as respostas</b></summary><div class="lista" style="margin-top:12px">${s.perguntas.map((q, i) => {
      const ok = corrigir(q, s.respostas[i]);
      return `<div class="cartao plano"><div class="linha"><span class="chip ${ok ? "ok" : "bad"}">${ok ? "Certa" : "Errada"}</span></div><p><b>${esc(q.p)}</b></p>
        ${ok ? "" : `<p class="peq">A sua: ${esc(s.respostas[i] == null ? "sem resposta" : q.tipo === "mc" ? q.opcoes[s.respostas[i]] : q.tipo === "vf" ? (s.respostas[i] ? "Verdadeiro" : "Falso") : s.respostas[i])}</p>`}
        <p class="peq">Correta: <b>${esc(respostaCerta(q))}</b></p><p class="suave peq">${esc(q.explica)}</p></div>`;
    }).join("")}</div></details>`;
  }

  // --- quiz de lição
  TELAS.quiz = function () {
    const l = LICOES[rota.lid];
    if (!sessao || sessao.origem !== l.id || sessao.tipo !== "quiz") {
      iniciarSessao({ tipo: "quiz", origem: l.id, perguntas: l.quiz, aoTerminar: fimQuiz });
    }
    if (!sessao.fim) return telaPerguntas();
    const pct = Math.round((sessao.acertos / sessao.perguntas.length) * 100), m = MOD_DA[l.id], prox = m.licoes[l._i + 1];
    return `<div class="cartao resultado"><span class="rotulo">Resultado</span>${estrelas(pct)}<div class="grande tab-num">${pct}%</div>
        <p>${sessao.acertos} de ${sessao.perguntas.length} certas. ${pct >= 70 ? "Lição concluída!" : "Precisa de 70% para concluir. Reveja a aula e tente de novo."}</p>
        ${sessao.ganho ? `<span class="chip acc">+${sessao.ganho} XP</span>` : ""}</div>
      ${revisaoRespostas(sessao)}
      <div class="grelha-2"><button class="btn" data-acao="refazer-quiz" data-id="${l.id}">${ic("repetir")} Refazer quiz</button><button class="btn" data-acao="licao" data-id="${l.id}">Rever a aula</button></div>
      ${pct >= 70 ? (prox ? `<button class="btn prim bloco" data-acao="licao" data-id="${prox.id}">Próxima lição →</button>` : `<button class="btn prim bloco" data-acao="prova" data-id="${m.id}" ${provaAberta(m) ? "" : "disabled"}>Fazer a prova do módulo →</button>`) : ""}`;
  };
  function fimQuiz(s) {
    const l = LICOES[s.origem], r = P().licoes[l.id] || (P().licoes[l.id] = {});
    const pct = Math.round((s.acertos / s.perguntas.length) * 100), antes = r.melhor || 0;
    r.tentativas = (r.tentativas || 0) + 1; r.ultima = pct;
    let ganho = 0;
    if (pct > antes) { ganho = Math.round((pct - antes) / 100 * l.quiz.length * 10); r.melhor = pct; }
    if (pct === 100 && antes < 100) ganho += 20;
    s.ganho = ganho; guardar();
    if (ganho) ganharXP(ganho, "quiz"); else { marcarDia(); guardar(); verificarConquistas(); }
  }

  // --- prova de módulo
  TELAS.prova = function () {
    const m = mod(rota.mid);
    if (!provaAberta(m)) return `<div class="vazio">${ic("cadeado")}<p>Conclua todas as lições deste módulo (70% em cada quiz) para fazer a prova.</p></div>`;
    if (!sessao || sessao.tipo !== "prova" || sessao.origem !== m.id) {
      return `<div class="cartao"><span class="rotulo">Prova do Módulo ${m.numero}</span><h1>${esc(m.titulo)}</h1>
        <ul class="objetivos"><li>${Math.min(15, totalPerguntas(m))} perguntas sorteadas de todo o módulo.</li><li>${Math.min(15, totalPerguntas(m))} minutos no total; sem correção até ao fim, como no exame real.</li><li>Pontuação de 0 a 1000. Aprovação: <b>${NOTA_APROVACAO}</b>.</li><li>Pode repetir quantas vezes quiser; conta a melhor nota.</li></ul>
        <button class="btn prim bloco" data-acao="comecar-prova" data-id="${m.id}">${ic("relogio")} Começar a prova</button></div>`;
    }
    if (!sessao.fim) return telaPerguntas(`<span class="chip warn temporizador tab-num" id="tempo">--:--</span>`) + (sessao.perguntas[sessao.i].tipo === "cmd" ? "" : `<button class="btn bloco" data-acao="seguinte-prova" ${sessao.respostas[sessao.i] == null ? "disabled" : ""}>Confirmar e seguir</button>`);
    const nota = sessao.nota, ok = nota >= NOTA_APROVACAO;
    const clas = nota >= 950 ? "Excelente" : ok ? "Aprovado" : nota >= 700 ? "Quase lá" : "Precisa de rever";
    return `<div class="cartao resultado"><span class="rotulo">Prova do Módulo ${m.numero}</span><span class="chip ${ok ? "ok" : "bad"}">${clas}</span>
        <div class="grande tab-num">${nota}</div><p class="suave">de 1000 · aprovação ${NOTA_APROVACAO} · ${sessao.acertos}/${sessao.perguntas.length} certas${sessao.esgotou ? " · tempo esgotado" : ""}</p>
        ${sessao.ganho ? `<span class="chip acc">+${sessao.ganho} XP</span>` : ""}
        ${ok ? `<p>${MODS[MODS.indexOf(m) + 1] ? "Módulo seguinte desbloqueado." : "Concluiu a trilha completa!"}</p>` : "<p>As perguntas erradas foram para o caderno de erros.</p>"}</div>
      ${revisaoRespostas(sessao)}
      <div class="grelha-2"><button class="btn" data-acao="comecar-prova" data-id="${m.id}">${ic("repetir")} Repetir prova</button>
      ${ok && MODS[MODS.indexOf(m) + 1] ? `<button class="btn prim" data-acao="modulo" data-id="${MODS[MODS.indexOf(m) + 1].id}">Próximo módulo →</button>` : `<button class="btn" data-acao="modulo" data-id="${m.id}">Voltar ao módulo</button>`}</div>`;
  };
  POS.prova = function () {
    if (!sessao || sessao.tipo !== "prova" || sessao.fim) return;
    const el = () => $("#tempo");
    const tick = () => {
      const rest = Math.max(0, sessao.limite - (Date.now() - sessao.inicio));
      const e = el(); if (e) e.textContent = `${String(Math.floor(rest / 60000)).padStart(2, "0")}:${String(Math.floor(rest / 1000) % 60).padStart(2, "0")}`;
      if (rest <= 0) { clearInterval(t); sessao.esgotou = true; terminarSessao(); }
    };
    const t = setInterval(tick, 500); tick();
    limpar = () => clearInterval(t);
  };
  function fimProva(s) {
    if (limpar) { limpar(); limpar = null; }
    const m = mod(s.origem), pr = P().provas[m.id] || (P().provas[m.id] = { tentativas: 0, melhor: 0 });
    s.nota = Math.round((s.acertos / s.perguntas.length) * 1000);
    const passouAntes = pr.melhor >= NOTA_APROVACAO;
    pr.tentativas++; pr.ultima = s.nota; pr.data = Date.now();
    let ganho = 0;
    if (s.nota > pr.melhor) { ganho += Math.round((s.nota - pr.melhor) / 10); pr.melhor = s.nota; }
    if (s.nota >= NOTA_APROVACAO && !passouAntes) ganho += 150;
    s.ganho = ganho; guardar();
    if (ganho) ganharXP(ganho, "prova"); else verificarConquistas();
  }

  // --- caderno de erros
  TELAS.revisao = function () {
    const p = P();
    if (sessao && sessao.tipo === "revisao" && !sessao.fim) return telaPerguntas();
    if (sessao && sessao.tipo === "revisao" && sessao.fim) {
      const s = sessao; sessao = null;
      return `<div class="cartao resultado"><span class="rotulo">Revisão terminada</span><div class="grande tab-num">${s.acertos}/${s.perguntas.length}</div><p>As que acertou saíram do caderno.</p></div>
        <button class="btn prim bloco" data-acao="ir" data-tela="revisao">Continuar</button>`;
    }
    if (!p.erros.length) return `<div class="vazio">${ic("caderno")}<h2>Caderno vazio</h2><p>Quando errar uma pergunta num quiz ou prova, ela aparece aqui para rever. Acertou, sai do caderno.</p></div>`;
    return `<div class="secao"><h1>Caderno de erros</h1><p class="suave">${p.erros.length} pergunta${p.erros.length === 1 ? "" : "s"} que errou. Responda de novo: as certas saem do caderno.</p>
      <button class="btn prim bloco" data-acao="comecar-revisao">${ic("repetir")} Rever ${Math.min(10, p.erros.length)} perguntas</button></div>
      <div class="lista">${p.erros.slice(-30).reverse().map((e) => `<div class="cartao plano"><span class="rotulo">${esc(origemNome(e.origem))}</span><p>${esc(e.q.p)}</p></div>`).join("")}</div>`;
  };
  const origemNome = (o) => LICOES[o] ? LICOES[o].titulo : mod(o) ? "Prova · " + mod(o).titulo : o === "relampago" ? "Quiz relâmpago" : "Revisão";

  // --- jogar
  TELAS.jogar = function () {
    const p = P();
    return `<div class="secao"><h1>Jogar e praticar</h1><p class="suave">Aprender a fazer, não só a ler. Cada jogo dá XP.</p></div>
      <div class="lista">
        <button class="item" data-acao="ir" data-tela="relampago"><div class="ico-caixa">${ic("raio")}</div><div class="meio"><b>Quiz relâmpago</b><span class="suave peq">Quantas acerta em 60 segundos? Perguntas dos módulos desbloqueados.</span></div><span class="chip acc tab-num">${p.recordes.relampago}</span></button>
        <button class="item" data-acao="ir" data-tela="subrede"><div class="ico-caixa">${ic("calc")}</div><div class="meio"><b>Desafio sub-rede</b><span class="suave peq">Rede, broadcast, hosts e máscaras de cabeça.</span></div><span class="chip acc tab-num">${p.recordes.subrede}</span></button>
        <button class="item" data-acao="ir" data-tela="labs"><div class="ico-caixa">${ic("terminal")}</div><div class="meio"><b>Laboratório CLI</b><span class="suave peq">Terminal Cisco IOS simulado com tarefas guiadas.</span></div><span class="chip acc tab-num">${Object.keys(p.labs).length}/${D.labs.length}</span></button>
        <button class="item" data-acao="ir" data-tela="revisao"><div class="ico-caixa">${ic("caderno")}</div><div class="meio"><b>Caderno de erros</b><span class="suave peq">Volte às perguntas que errou.</span></div><span class="chip ${p.erros.length ? "warn" : "ok"} tab-num">${p.erros.length}</span></button>
      </div>`;
  };

  // --- relâmpago
  TELAS.relampago = function () {
    const s = sessao && sessao.tipo === "relampago" ? sessao : null;
    if (!s) return `<div class="cartao resultado">${ic("raio")}<h1>Quiz relâmpago</h1><p class="suave">60 segundos. Escolha múltipla e verdadeiro/falso dos módulos que já desbloqueou. Cada certa vale 1 ponto e 3 XP; erros vão para o caderno.</p>
        <p>Recorde: <b class="tab-num">${P().recordes.relampago}</b></p><button class="btn prim bloco" data-acao="comecar-relampago">Começar</button></div>`;
    if (s.fim) {
      const rec = s.acertos > s.recordeAntes;
      return `<div class="cartao resultado"><span class="rotulo">Tempo!</span><div class="grande tab-num">${s.acertos}</div><p>${s.acertos} certas em ${s.i} respondidas.${rec ? " Novo recorde!" : ""}</p></div>
        <button class="btn prim bloco" data-acao="comecar-relampago">${ic("repetir")} Jogar outra vez</button>`;
    }
    const q = s.perguntas[s.i];
    return `<div class="linha entre"><span class="chip acc tab-num">${s.acertos} ponto${s.acertos === 1 ? "" : "s"}</span><span class="chip warn temporizador tab-num" id="tempo">60s</span></div>
      <div class="cartao">${htmlPergunta(q, { resp: undefined, respondida: false })}</div>`;
  };
  POS.relampago = function () {
    if (!sessao || sessao.tipo !== "relampago" || sessao.fim || sessao.relogio) return;
    const t = setInterval(() => {
      const rest = Math.max(0, 60 - Math.floor((Date.now() - sessao.inicio) / 1000));
      const e = $("#tempo"); if (e) e.textContent = rest + "s";
      if (rest <= 0) { clearInterval(t); sessao.relogio = null; acabarRelampago(); }
    }, 250);
    sessao.relogio = t;
    limpar = () => { clearInterval(t); if (sessao) sessao.relogio = null; };
  };
  function acabarRelampago() {
    const s = sessao; s.fim = true;
    s.recordeAntes = P().recordes.relampago;
    if (s.acertos > P().recordes.relampago) P().recordes.relampago = s.acertos;
    guardar(); render();
    if (s.acertos) ganharXP(s.acertos * 3, "relâmpago"); else verificarConquistas();
  }
  function poolRelampago() {
    const ms = MODS.filter(moduloAberto);
    return embaralhar(ms.flatMap((m) => m.licoes.flatMap((l) => l.quiz.map((q) => Object.assign({ _o: l.id }, q))).concat(m.prova_extra)).filter((q) => q.tipo !== "cmd"));
  }

  // --- sub-redes
  const PERG_SUB = [
    ["rede", "Qual é o endereço de rede?"], ["broadcast", "Qual é o endereço de broadcast?"], ["primeiro", "Qual é o primeiro host válido?"],
    ["ultimo", "Qual é o último host válido?"], ["hosts", "Quantos hosts válidos tem a sub-rede?"], ["mascara", "Qual é a máscara em decimal?"],
  ];
  const n2i = (ip) => ip.split(".").reduce((a, o) => (a * 256) + (+o), 0);
  const i2n = (n) => [16777216, 65536, 256, 1].map((d) => Math.floor(n / d) % 256).join(".");
  function novoDesafio() {
    const pref = 16 + Math.floor(Math.random() * 15);
    const bases = [[10, rnd(0, 255)], [172, rnd(16, 31)], [192, 168]];
    const b = bases[Math.floor(Math.random() * 3)];
    const ip = [b[0], b[1], rnd(0, 255), rnd(1, 254)].join(".");
    const bloco = Math.pow(2, 32 - pref), num = n2i(ip), rede = Math.floor(num / bloco) * bloco, bc = rede + bloco - 1;
    const mascara = i2n(Math.pow(2, 32) - bloco);
    const tipo = PERG_SUB[Math.floor(Math.random() * PERG_SUB.length)];
    const sol = { rede: i2n(rede), broadcast: i2n(bc), primeiro: i2n(rede + 1), ultimo: i2n(bc - 1), hosts: String(bloco - 2), mascara };
    const oct = Math.floor(pref / 8), interessante = oct < 4 ? +mascara.split(".")[oct] : 255, magico = 256 - interessante;
    const explica = `/${pref} = ${mascara}. Octeto interessante: ${oct + 1}.º, número mágico 256 − ${interessante} = ${magico}. Rede ${sol.rede}, broadcast ${sol.broadcast}, hosts ${sol.primeiro} a ${sol.ultimo} (2^${32 - pref} − 2 = ${bloco - 2}).`;
    return { ip, pref, tipo: tipo[0], pergunta: tipo[1], resposta: sol[tipo[0]], explica, inicio: Date.now() };
  }
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  let sub = null;
  TELAS.subrede = function () {
    if (!sub) sub = { serie: 0, d: novoDesafio() };
    const d = sub.d;
    return `<div class="linha entre"><span class="chip acc tab-num">Série: ${sub.serie}</span><span class="chip tab-num">Recorde: ${P().recordes.subrede}</span></div>
      <div class="cartao"><span class="rotulo">Endereço</span><div style="font:800 1.9rem var(--f-mono);letter-spacing:-.02em" class="tab-num">${d.ip}/${d.pref}</div>
        <p class="pergunta">${d.pergunta}</p>
        <form data-form="sub" class="secao"><input class="campo mono" id="resp-sub" inputmode="decimal" autocomplete="off" placeholder="${d.tipo === "hosts" ? "ex.: 62" : "ex.: 192.168.1.64"}" ${sub.feito ? "disabled" : ""} value="${esc(sub.resp || "")}">
        ${sub.feito ? "" : `<button class="btn prim" type="submit">Verificar</button>`}</form>
        ${sub.feito ? `<div class="feedback ${sub.ok ? "ok" : "bad"}"><b>${sub.ok ? "Certo!" : "Resposta: " + d.resposta}</b><span>${esc(d.explica)}</span><span class="suave peq">${Math.round(sub.tempo / 1000)} s</span></div>
          <button class="btn prim bloco" data-acao="sub-seguinte">Seguinte</button>` : ""}
      </div>
      <details class="cartao plano"><summary><b>Tabela de ajuda</b></summary><div class="tabela-caixa" style="margin-top:10px"><table><thead><tr><th>Prefixo</th><th>Máscara</th><th>Bloco</th><th>Hosts</th></tr></thead><tbody>
        ${[24, 25, 26, 27, 28, 29, 30].map((p) => `<tr><td>/${p} (/${p - 8}, /${p - 16})</td><td>255.255.255.${256 - Math.pow(2, 32 - p)}</td><td>${Math.pow(2, 32 - p)}</td><td>${Math.pow(2, 32 - p) - 2}</td></tr>`).join("")}</tbody></table></div></details>`;
  };

  // --- laboratórios
  function itemLab(lab) {
    const feito = !!P().labs[lab.id];
    return `<button class="item" data-acao="lab" data-id="${lab.id}"><div class="ico-caixa">${F.icone(lab.dispositivo, 34)}</div>
      <div class="meio"><span class="rotulo">Módulo ${mod(lab.modulo).numero} · ${esc(lab.nivel)}</span><b>${esc(lab.titulo)}</b><span class="suave peq">${esc(lab.descricao)}</span></div>
      <span class="estado-ico ${feito ? "ok" : "bloq"}">${feito ? ic("check") : lab.tarefas.length}</span></button>`;
  }
  TELAS.labs = function () {
    return `<div class="secao"><h1>Laboratório CLI</h1><p class="suave">Um terminal Cisco IOS simulado. Escreva os comandos como num equipamento real: aceita abreviações (<code>conf t</code>, <code>int g0/0</code>), <code>?</code> para ajuda, Tab para completar e <code>do</code> nos modos de configuração.</p></div>
      <div class="lista">${D.labs.map(itemLab).join("")}</div>`;
  };
  let eq = null, historico = [], hIdx = 0;
  TELAS.lab = function () {
    const lab = labPorId(rota.id);
    if (!eq || eq._lab !== lab.id) {
      eq = new window.IOS.Equipamento(lab.dispositivo, lab.hostname); eq._lab = lab.id; eq._log = [];
      eq._log.push({ t: `${lab.dispositivo === "router" ? "Router Cisco (simulado)" : "Switch Catalyst (simulado)"} — escreva ? a qualquer momento para ver os comandos.\n\nPress RETURN to get started.\n`, c: "" });
    }
    const feitas = lab.tarefas.map((t) => eq.verificar(t.check));
    return `<div class="cartao"><div class="linha entre"><span class="rotulo">Tarefas · ${feitas.filter(Boolean).length}/${lab.tarefas.length}</span>${P().labs[lab.id] ? '<span class="chip ok">Concluído</span>' : ""}</div>
        <p class="peq">${esc(lab.descricao)}</p>
        <ul class="lab-tarefas" id="tarefas">${tarefasHTML(lab, feitas)}</ul></div>
      <div class="term"><div class="barra-term"><span class="pontos"><i></i><i></i><i></i></span><span>${esc(lab.dispositivo === "router" ? "consola · router" : "consola · switch")}</span><button class="btn-copiar" data-acao="reiniciar-lab">reiniciar</button></div>
        <div class="consola" id="consola" aria-live="polite">${eq._log.map(linhaLog).join("")}</div>
        <form class="entrada" data-form="ios"><label for="ios-in" id="ios-prompt">${esc(eq.prompt())}</label><input id="ios-in" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="send" aria-label="Comando"></form>
        <div class="teclas"><button type="button" data-tecla="?">?</button><button type="button" data-tecla="tab">Tab</button><button type="button" data-tecla="up">↑</button><button type="button" data-tecla="down">↓</button><button type="button" data-tecla="end">Ctrl+Z</button><button type="button" data-tecla="sh run">show run</button></div></div>`;
  };
  function tarefasHTML(lab, feitas) {
    return lab.tarefas.map((t, i) => `<li class="${feitas[i] ? "feita" : ""}"><span class="cx">${feitas[i] ? "✓" : ""}</span><div><span>${esc(t.desc)}</span><details><summary>ver dica</summary><code>${esc(t.dica)}</code></details></div></li>`).join("");
  }
  const linhaLog = (l) => l.c ? `<div><span class="pr">${esc(l.p)}</span><span class="in">${esc(l.c)}</span></div>${l.t ? `<div class="${/% (Invalid|Incomplete|Unrecognized|Ambiguous|Bad|Please|Login disabled)|Command rejected/.test(l.t) ? "err" : ""}">${esc(l.t)}</div>` : ""}` : `<div>${esc(l.t)}</div>`;
  POS.lab = function () {
    const c = $("#consola"); c.scrollTop = c.scrollHeight;
    const inp = $("#ios-in");
    if (window.matchMedia("(min-width: 700px)").matches) inp.focus({ preventScroll: true });
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Tab") { e.preventDefault(); inp.value = eq.completar(inp.value); }
      else if (e.key === "ArrowUp") { e.preventDefault(); hist(-1); }
      else if (e.key === "ArrowDown") { e.preventDefault(); hist(1); }
      else if (e.key === "z" && e.ctrlKey) { e.preventDefault(); executarIOS("end"); }
      else if (e.key === "?") { e.preventDefault(); executarIOS(inp.value + "?", true); }
    });
  };
  function hist(d) { const inp = $("#ios-in"); hIdx = Math.max(0, Math.min(historico.length, hIdx + d)); inp.value = historico[hIdx] || ""; }
  function executarIOS(cmd, manter) {
    const lab = labPorId(rota.id), prompt = eq.prompt();
    const saida = eq.executar(cmd);
    if (saida === "\f") eq._log = [];
    else eq._log.push({ p: prompt, c: cmd, t: saida });
    if (cmd.trim() && !cmd.endsWith("?")) { historico.push(cmd); hIdx = historico.length; }
    const c = $("#consola"); c.innerHTML = eq._log.map(linhaLog).join(""); c.scrollTop = c.scrollHeight;
    $("#ios-prompt").textContent = eq.prompt();
    const inp = $("#ios-in"); inp.value = manter ? cmd.replace(/\?$/, "") : "";
    const feitas = lab.tarefas.map((t) => eq.verificar(t.check));
    $("#tarefas").innerHTML = tarefasHTML(lab, feitas);
    if (feitas.every(Boolean) && !P().labs[lab.id]) { P().labs[lab.id] = Date.now(); guardar(); ganharXP(50, "laboratório"); setTimeout(() => render(), 50); }
  }

  // --- ranking
  TELAS.ranking = function () {
    const lista = Object.values(S.perfis).sort((a, b) => b.xp - a.xp);
    const p = P(), n = nivel(p.xp);
    return `<div class="secao"><h1>Classificação</h1><p class="suave">Ranking dos perfis neste dispositivo — ideal para uma turma ou família a estudar no mesmo telemóvel ou computador.</p></div>
      <ol class="ranking">${lista.map((x, i) => `<li class="${x.id === p.id ? "eu" : ""}"><span class="pos tab-num">${i + 1}</span><span class="avatar" style="background:${x.cor}">${esc(x.nome.slice(0, 1).toUpperCase())}</span>
        <span><b>${esc(x.nome)}</b><br><span class="suave peq">${esc(nivel(x.xp).nome)} · ${Object.values(x.provas).filter((v) => v.melhor >= NOTA_APROVACAO).length}/${MODS.length} provas</span></span><b class="tab-num">${x.xp} XP</b></li>`).join("")}</ol>
      <button class="btn bloco" data-acao="perfil">Adicionar ou trocar de perfil</button>
      <section class="secao"><h2>Níveis</h2><div class="tabela-caixa"><table><tbody>${NIVEIS.map(([xp, nome], i) => `<tr${i === n.i ? ' style="background:var(--accent-soft)"' : ""}><td>${i + 1}</td><td><b>${esc(nome)}</b></td><td class="tab-num">${xp} XP</td></tr>`).join("")}</tbody></table></div></section>
      <section class="secao"><h2>Notas das provas</h2><div class="tabela-caixa"><table><thead><tr><th>Módulo</th><th>Melhor</th><th>Tentativas</th><th>Estado</th></tr></thead><tbody>
        ${MODS.map((m) => { const r = p.provas[m.id]; return `<tr><td>${m.numero}. ${esc(m.titulo)}</td><td class="tab-num">${r ? r.melhor : "—"}</td><td class="tab-num">${r ? r.tentativas : 0}</td><td>${r ? (r.melhor >= NOTA_APROVACAO ? '<span class="chip ok">Aprovado</span>' : '<span class="chip bad">Repetir</span>') : '<span class="chip">Por fazer</span>'}</td></tr>`; }).join("")}
      </tbody></table></div></section>
      <section class="secao"><h2>Conquistas</h2><div class="medalhas">${CONQUISTAS.map(([id, nome, desc]) => `<div class="medalha ${p.conquistas[id] ? "ganha" : ""}"><span class="m">${ic("medalha")}</span><b>${esc(nome)}</b><span class="suave">${esc(desc)}</span></div>`).join("")}</div></section>`;
  };

  // --- guia
  let abaGuia = "roteiro", filtroGloss = "";
  TELAS.guia = function () {
    const abas = [["roteiro", "Roteiro"], ["plano", "Plano 12 semanas"], ["exame", "Dicas de exame"], ["simreal", "Simulador × real"], ["ferramentas", "Ferramentas"], ["glossario", "Glossário"], ["refs", "Referências"]];
    const G = D.guia;
    let corpo = "";
    if (abaGuia === "roteiro") corpo = `<p class="suave">Os 6 domínios do exame CCNA 200-301 v1.1, o peso de cada um e onde os estudar nesta app.</p>
      <div class="lista">${G.dominios.map((d) => { const ms = d.modulos.map(mod); const pct = Math.round(ms.reduce((a, m) => a + progressoModulo(m), 0) / ms.length * 100);
        return `<div class="cartao plano peso"><b>${esc(d.nome)}</b><span class="chip acc tab-num">${d.peso}% do exame</span><div class="barra"><i style="width:${pct}%"></i></div>
          <span class="suave peq">${ms.map((m) => `Módulo ${m.numero}`).join(", ")} · ${pct}% concluído</span></div>`; }).join("")}</div>
      <div class="cartao plano"><h3>Como usar a app</h3><ol class="objetivos"><li>Leia a lição com calma e veja as figuras e os comandos.</li><li>Abra o vídeo de apoio para ver o tema explicado de outra forma.</li><li>Faça o quiz (70% para concluir). Errou? Use “Repetir a aula”.</li><li>Pratique o laboratório do módulo no terminal simulado e depois no Packet Tracer.</li><li>Passe a prova (${NOTA_APROVACAO}/1000) para desbloquear o próximo módulo.</li><li>Todos os dias: 5 min de desafio sub-rede e o caderno de erros.</li></ol></div>`;
    if (abaGuia === "plano") corpo = `<div class="tabela-caixa"><table><thead><tr><th>Semana</th><th>Estudar</th><th>Praticar</th></tr></thead><tbody>${G.plano.map((p) => `<tr><td><b>${esc(p.semana)}</b></td><td>${esc(p.tema)}</td><td>${esc(p.pratica)}</td></tr>`).join("")}</tbody></table></div>
      <p class="suave peq">Ritmo pensado para ~1 h por dia, 5 dias por semana. Ajuste ao seu tempo.</p>`;
    if (abaGuia === "exame") corpo = `<ol class="objetivos">${G.dicas.map((d) => `<li>${esc(d)}</li>`).join("")}</ol>`;
    if (abaGuia === "simreal") corpo = `<p class="suave">O simulador ensina a lógica; o equipamento real ensina o ofício. Diferenças que vai sentir:</p>
      <div class="tabela-caixa"><table><thead><tr><th>Tema</th><th>Simulador</th><th>Equipamento real</th></tr></thead><tbody>${G.sim_real.map((r) => `<tr><td><b>${esc(r.tema)}</b></td><td>${esc(r.sim)}</td><td>${esc(r.real)}</td></tr>`).join("")}</tbody></table></div>`;
    if (abaGuia === "ferramentas") corpo = `<div class="lista">${G.ferramentas.map((f) => `<a class="item" href="${esc(f.url)}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit"><div class="ico-caixa">${ic("terminal")}</div><div class="meio"><b>${esc(f.nome)}</b><span class="suave peq">${esc(f.desc)}</span></div><span class="suave">↗</span></a>`).join("")}</div>`;
    if (abaGuia === "glossario") {
      const f = filtroGloss.toLowerCase();
      const itens = G.glossario.filter((g) => !f || (g.termo + " " + g.def).toLowerCase().includes(f));
      corpo = `<input class="campo" id="filtro-gloss" type="search" placeholder="Procurar termo (ex.: VLAN)" value="${esc(filtroGloss)}">
        <dl class="gloss">${itens.map((g) => `<dt>${esc(g.termo)}</dt><dd>${esc(g.def)}</dd>`).join("") || '<p class="suave">Nenhum termo encontrado.</p>'}</dl>`;
    }
    if (abaGuia === "refs") corpo = `<p class="suave">Todas as obras, normas e RFCs citadas nas lições.</p><ol class="refs">${Object.values(D.referencias).sort().map((r) => `<li>${linkar(r)}</li>`).join("")}</ol>`;
    return `<div class="secao"><h1>Guia de estudo</h1></div>
      <div class="abas" role="tablist">${abas.map(([k, n]) => `<button role="tab" aria-selected="${abaGuia === k}" data-acao="aba-guia" data-id="${k}">${n}</button>`).join("")}</div>
      <section class="secao">${corpo}</section>`;
  };
  POS.guia = function () {
    const f = $("#filtro-gloss");
    if (f) f.addEventListener("input", () => { filtroGloss = f.value; const pos = f.selectionStart; render(); const n = $("#filtro-gloss"); n.focus(); n.setSelectionRange(pos, pos); });
  };

  // --- perfil
  let confirmarApagar = false, msgImport = "";
  TELAS.perfil = function () {
    const p = P();
    return `<div class="cartao"><span class="rotulo">Perfil ativo</span>
        <form data-form="nome" class="linha"><span class="avatar" style="background:${p.cor}">${esc(p.nome.slice(0, 1).toUpperCase())}</span>
          <input class="campo" id="nome-perfil" style="flex:1;min-width:0" value="${esc(p.nome)}" maxlength="30" aria-label="Nome"><button class="btn" type="submit">Guardar</button></form>
        <p class="suave peq tab-num">${p.xp} XP · ${esc(nivel(p.xp).nome)} · desde ${new Date(p.criado).toLocaleDateString("pt-PT")}</p></div>
      <div class="cartao"><span class="rotulo">Perfis neste dispositivo</span>
        <div class="lista">${Object.values(S.perfis).map((x) => `<button class="item" data-acao="trocar-perfil" data-id="${x.id}"><span class="avatar" style="background:${x.cor}">${esc(x.nome.slice(0, 1).toUpperCase())}</span><div class="meio"><b>${esc(x.nome)}</b><span class="suave peq tab-num">${x.xp} XP</span></div>${x.id === p.id ? '<span class="chip ok">ativo</span>' : ""}</button>`).join("")}</div>
        <form data-form="novo-perfil" class="linha"><input class="campo" id="novo-nome" style="flex:1;min-width:0" placeholder="Nome do novo perfil" maxlength="30"><button class="btn" type="submit">Adicionar</button></form></div>
      <div class="cartao"><span class="rotulo">Definições</span>
        <div class="linha entre"><span>Tema</span><span class="abas">${[["auto", "Sistema"], ["light", "Claro"], ["dark", "Escuro"]].map(([k, n]) => `<button aria-selected="${S.tema === k}" data-acao="tema" data-id="${k}">${n}</button>`).join("")}</span></div>
        <label class="linha entre" for="livre"><span><b>Modo livre</b><br><span class="suave peq">Desbloqueia todos os módulos e lições, para quem já sabe o básico ou quer rever.</span></span><input type="checkbox" id="livre" ${S.livre ? "checked" : ""} style="width:24px;height:24px"></label></div>
      <div class="cartao"><span class="rotulo">Cópia de segurança do progresso</span>
        <p class="suave peq">O progresso fica guardado neste navegador. Para passar para outro dispositivo, copie o código e cole-o lá.</p>
        <button class="btn" data-acao="exportar">Copiar código de progresso</button>
        <textarea class="campo" id="import-txt" placeholder="Cole aqui um código de progresso"></textarea>
        <button class="btn" data-acao="importar">Importar</button>${msgImport ? `<p class="peq">${esc(msgImport)}</p>` : ""}</div>
      <div class="cartao ${confirmarApagar ? "confirmar" : ""}"><span class="rotulo">Recomeçar</span>
        ${confirmarApagar ? `<p><b>Apagar todo o progresso de ${esc(p.nome)}?</b> XP, notas e laboratórios voltam a zero. Não dá para desfazer.</p><div class="grelha-2"><button class="btn" data-acao="cancelar-apagar">Cancelar</button><button class="btn" style="border-color:var(--bad);color:var(--bad)" data-acao="apagar-sim">Apagar</button></div>`
          : `<button class="btn" data-acao="apagar">Apagar o progresso deste perfil</button>`}</div>
      <div class="cartao plano"><span class="rotulo">Sobre</span><p class="peq">${D.modulos.length} módulos, ${Object.keys(LICOES).length} lições, ${D.labs.length} laboratórios. Conteúdo escrito em Python (pasta <code>ccna/conteudo</code>) e gerado com <code>python build.py</code>. Cisco, CCNA, Catalyst e Packet Tracer são marcas da Cisco Systems; esta app é material de estudo independente.</p></div>`;
  };
  POS.perfil = function () {
    $("#livre").addEventListener("change", (e) => { S.livre = e.target.checked; guardar(); toast(S.livre ? "Modo livre ativo" : "Modo livre desligado"); });
  };

  // ------------------------------------------------------------ eventos
  function toast(msg) {
    const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; t.setAttribute("role", "status");
    document.body.appendChild(t); setTimeout(() => t.remove(), 2200);
  }
  function aplicarTema() { if (S.tema === "auto") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", S.tema); }
  async function copiar(texto, el) {
    try { await navigator.clipboard.writeText(texto); toast("Copiado"); }
    catch (e) { if (el) { el.value = texto; el.select(); } toast("Selecione e copie manualmente"); }
  }

  const ACOES = {
    voltar, perfil: () => ir("perfil"),
    ir: (el) => { if (el.dataset.tela === "relampago" || el.dataset.tela === "revisao") sessao = null; if (el.dataset.tela === "subrede") sub = null; ir(el.dataset.tela); },
    modulo: (el) => { if (el.getAttribute("aria-disabled") === "true") return toast("Módulo bloqueado"); ir("modulo", { mid: el.dataset.id }); },
    licao: (el) => { if (el.getAttribute("aria-disabled") === "true") return toast("Conclua a lição anterior primeiro"); ir("licao", { lid: el.dataset.id }); },
    repetir: (el) => { const r = P().licoes[el.dataset.id]; if (r) r.repeticoes = (r.repeticoes || 0) + 1; guardar(); sessao = null; window.scrollTo({ top: 0, behavior: "smooth" }); toast("Boa revisão! Leia de novo e refaça o quiz."); },
    quiz: (el) => { sessao = null; ir("quiz", { lid: el.dataset.id }); },
    "refazer-quiz": (el) => { sessao = null; ir("quiz", { lid: el.dataset.id }, true); },
    prova: (el) => { if (el.getAttribute("aria-disabled") === "true") return toast("Conclua as lições do módulo primeiro"); sessao = null; ir("prova", { mid: el.dataset.id }); },
    "comecar-prova": (el) => {
      const m = mod(el.dataset.id);
      const todas = m.licoes.flatMap((l) => l.quiz).concat(m.prova_extra);
      const n = Math.min(15, todas.length);
      iniciarSessao({ tipo: "prova", origem: m.id, perguntas: embaralhar(todas).slice(0, n), feedback: false, limite: n * 60000, aoTerminar: fimProva });
      render();
    },
    "comecar-revisao": () => { const e = embaralhar(P().erros).slice(0, 10); iniciarSessao({ tipo: "revisao", origem: "revisao", perguntas: e.map((x) => x.q) }); render(); },
    "comecar-relampago": () => { if (limpar) { limpar(); limpar = null; } iniciarSessao({ tipo: "relampago", origem: "relampago", perguntas: poolRelampago(), acertos: 0 }); render(); },
    resp: (el) => {
      const v = el.dataset.v === "true" ? true : el.dataset.v === "false" ? false : +el.dataset.v;
      if (sessao.tipo === "prova") { sessao.respostas[sessao.i] = v; render(); return; }
      if (sessao.tipo === "relampago") {
        const q = sessao.perguntas[sessao.i]; const ok = corrigir(q, v);
        if (ok) sessao.acertos++; else registarErro(q, q._o || "relampago");
        el.classList.add(ok ? "certa" : "errada");
        setTimeout(() => { if (!sessao || sessao.fim) return; sessao.i++; if (sessao.i >= sessao.perguntas.length) sessao.perguntas = sessao.perguntas.concat(poolRelampago().map(prepararPergunta)); render(); }, ok ? 250 : 700);
        return;
      }
      responder(v);
    },
    seguinte: avancar,
    "seguinte-prova": () => {
      const q = sessao.perguntas[sessao.i];
      if (!corrigir(q, sessao.respostas[sessao.i])) registarErro(q, sessao.origem);
      sessao.i++;
      if (sessao.i >= sessao.perguntas.length) terminarSessao(); else render();
    },
    "sub-seguinte": () => { sub.d = novoDesafio(); sub.feito = false; sub.resp = ""; render(); setTimeout(() => { const i = $("#resp-sub"); if (i) i.focus(); }, 30); },
    lab: (el) => { if (eq && eq._lab !== el.dataset.id) eq = null; ir("lab", { id: el.dataset.id }); },
    "reiniciar-lab": () => { eq = null; render(); },
    "aba-guia": (el) => { abaGuia = el.dataset.id; render(); },
    tema: (el) => { S.tema = el.dataset.id; guardar(); aplicarTema(); render(); },
    "trocar-perfil": (el) => { S.ativo = el.dataset.id; guardar(); sessao = null; eq = null; render(); toast("Perfil: " + P().nome); },
    exportar: () => copiar(btoa(unescape(encodeURIComponent(JSON.stringify(P())))), $("#import-txt")),
    importar: () => {
      try {
        const obj = JSON.parse(decodeURIComponent(escape(atob($("#import-txt").value.trim()))));
        if (!obj || typeof obj.xp !== "number" || !obj.licoes) throw new Error();
        obj.id = obj.id || "p" + Date.now().toString(36); S.perfis[obj.id] = obj; S.ativo = obj.id; guardar(); msgImport = "Progresso importado para o perfil " + obj.nome + ".";
      } catch (e) { msgImport = "Código inválido. Copie o código completo no outro dispositivo e cole-o aqui."; }
      render();
    },
    apagar: () => { confirmarApagar = true; render(); },
    "cancelar-apagar": () => { confirmarApagar = false; render(); },
    "apagar-sim": () => { const p = P(); const novo = novoPerfil(p.nome); novo.id = p.id; novo.cor = p.cor; S.perfis[p.id] = novo; confirmarApagar = false; guardar(); render(); toast("Progresso apagado"); },
    "copiar-cli": (el) => { const cmds = [...el.closest(".term").querySelectorAll(".cm")].map((c) => c.textContent).filter((c) => !/^(Ligar|Abrir|Enviar|WLANs|General|Security|QoS|Apply)/.test(c)); copiar(cmds.join("\n")); },
  };

  document.addEventListener("click", (e) => {
    const nav = e.target.closest(".nav button");
    if (nav) { pilha = []; sessao = null; sub = null; ir(nav.dataset.ir, null, true); return; }
    const tecla = e.target.closest("[data-tecla]");
    if (tecla) {
      const inp = $("#ios-in"), k = tecla.dataset.tecla;
      if (k === "?") executarIOS(inp.value + "?", true);
      else if (k === "tab") inp.value = eq.completar(inp.value);
      else if (k === "up") hist(-1); else if (k === "down") hist(1);
      else if (k === "end") executarIOS("end");
      else executarIOS(k === "sh run" ? (["user", "priv"].includes(eq.modo) ? "show running-config" : "do show running-config") : k);
      inp.focus({ preventScroll: true });
      return;
    }
    const el = e.target.closest("[data-acao]");
    if (el && ACOES[el.dataset.acao]) { e.preventDefault(); ACOES[el.dataset.acao](el); }
  });
  document.addEventListener("submit", (e) => {
    const f = e.target.dataset.form; if (!f) return;
    e.preventDefault();
    if (f === "cmd") { const v = $("#resp-cmd").value; if (!v.trim()) return; responder(v); }
    if (f === "ios") executarIOS($("#ios-in").value);
    if (f === "sub") {
      const v = $("#resp-sub").value.trim(); if (!v) return;
      sub.resp = v; sub.feito = true; sub.tempo = Date.now() - sub.d.inicio;
      sub.ok = v.replace(/\s/g, "") === sub.d.resposta;
      if (sub.ok) { sub.serie++; if (sub.serie > P().recordes.subrede) P().recordes.subrede = sub.serie; guardar(); ganharXP(5, "sub-rede"); }
      else sub.serie = 0;
      render();
    }
    if (f === "nome") { const v = $("#nome-perfil").value.trim(); if (v) { P().nome = v; guardar(); render(); toast("Nome guardado"); } }
    if (f === "novo-perfil") { const v = $("#novo-nome").value.trim(); if (!v) return; const p = novoPerfil(v); S.perfis[p.id] = p; S.ativo = p.id; guardar(); render(); toast("Perfil criado: " + v); }
  });

  // ------------------------------------------------------------ arranque
  carregar(); aplicarTema();
  document.querySelector(".nav").innerHTML = [["inicio", "casa", "Início"], ["trilha", "trilha", "Trilha"], ["jogar", "jogo", "Jogar"], ["ranking", "trofeu", "Ranking"], ["guia", "livro", "Guia"]]
    .map(([k, i, n]) => `<button data-ir="${k}">${ic(i)}<span>${n}</span></button>`).join("");
  const inicial = (location.hash || "").replace("#", "");
  rota = { tela: RAIZ[inicial] ? inicial : "inicio" };
  render();
  if ("serviceWorker" in navigator && location.protocol.startsWith("http") && !/claudeusercontent|claude\.ai/.test(location.host)) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
