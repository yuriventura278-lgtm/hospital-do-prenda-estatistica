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
    caso: '<path d="M4 7h16v12H4zM9 7V5h6v2M4 12h16M11 12v2h2v-2"/>',
    calendario: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M8 14h2M14 14h2M8 18h2"/>',
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
    return completarPerfil({ id: "p" + Date.now().toString(36), nome, cor: CORES_AVATAR[Math.floor(Math.random() * CORES_AVATAR.length)], criado: Date.now() });
  }
  // Garante todos os campos (também em perfis guardados por versões anteriores).
  function completarPerfil(p) {
    const base = { xp: 0, licoes: {}, provas: {}, labs: {}, casos: {}, erros: [], dias: [], conquistas: {}, recordes: { subrede: 0, relampago: 0 },
      sims: {}, projetos: {}, exercicios: {}, estagios: {}, cadernos: {}, salaLab: {}, fichas: {}, caboJogo: 0, idade: null, genero: "", motivos: [], experiencia: "", onboard: false, tempo: {}, tempoLicao: {}, reforcos: {},
      plano: { min: 30, sessoes: 1, dias: [1, 2, 3, 4, 5] }, alvo: null };
    Object.keys(base).forEach((k) => { if (p[k] === undefined) p[k] = base[k]; });
    return p;
  }
  let S;
  const AR = window.Armazem;
  let localVazio = false;
  function carregar() {
    try { S = JSON.parse(AR.ler(CHAVE)); } catch (e) { S = null; }
    localVazio = !S || !S.perfis;
    if (!S || !S.perfis) {
      const p = novoPerfil("Estudante");
      S = { perfis: { [p.id]: p }, ativo: p.id, tema: "auto", livre: false };
    }
    Object.values(S.perfis).forEach(completarPerfil);
  }
  // Grava no localStorage e no IndexedDB (ver armazem.js): os dados nunca ficam só num sítio.
  function guardar() { S.atualizado = Date.now(); AR.gravar(CHAVE, JSON.stringify(S)); }
  // Ao abrir: se a cópia do IndexedDB for mais recente (ou o localStorage foi limpo), recupera-a.
  function conferirCopia() {
    AR.recuperar(CHAVE).then((r) => {
      if (!r || !r.valor) { guardar(); return; }
      let c = null; try { c = JSON.parse(r.valor); } catch (e) { return; }
      if (!c || !c.perfis) return;
      const copia = c.atualizado || r.quando || 0;
      // recupera só se o localStorage foi apagado/estragado, ou se a cópia é mais recente que a última gravação local
      if (localVazio || (S.atualizado && copia > S.atualizado)) {
        S = c; Object.values(S.perfis).forEach(completarPerfil); AR.gravar(CHAVE, JSON.stringify(S));
        aplicarTema(); render(); toast("Progresso recuperado da cópia de segurança");
      }
    });
    AR.persistir();
  }
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
  const exFeitos = (id) => (P().exercicios[id] || {}).feitos || 0;
  const exObrig = (id) => (LICOES[id] && LICOES[id].exercicios ? LICOES[id].exercicios.obrigatorios : 10);
  // Lição concluída: quiz com 70% ou mais E os exercícios obrigatórios feitos.
  const licaoFeita = (id) => (P().licoes[id] || {}).melhor >= 70 && exFeitos(id) >= exObrig(id);
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
    ["simulador", "Engenheiro do simulador", "Concluir 3 práticas no simulador", (p) => Object.values(p.sims || {}).filter((x) => x.feito).length >= 3],
    ["crimpador", "Mãos de técnico", "Montar um cabo RJ45 sem erros", (p) => (p.caboJogo || 0) >= 1],
    ["fichas", "Caderno em dia", "Fazer 10 fichas de trabalho", (p) => Object.keys(p.fichas || {}).length >= 10],
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
    if (!P().onboard) rota = { tela: "boasvindas" };
    document.body.classList.toggle("sem-nav", rota.tela === "boasvindas");
    const t = rota.tela, raiz = !!RAIZ[t];
    const n = nivel(P().xp);
    const titulo = TITULOS[t] ? TITULOS[t]() : "";
    $("#topo").innerHTML = t === "boasvindas" ? `<div class="marca"><img src="icons/icon-64.png" alt="" width="34" height="34"><b>REDES DE COMPUTADORES</b></div>` : raiz
      ? `<div class="marca"><img src="icons/icon-64.png" alt="" width="34" height="34"><b>REDES DE<br>COMPUTADORES</b></div><span style="flex:1"></span>
         <span class="xp-pilula tab-num" title="${esc(n.nome)}">${ic("estrela")} ${P().xp} XP</span>
         <button class="btn-icone" data-acao="perfil" aria-label="Perfil e definições">${ic("perfil")}</button>`
      : `<button class="btn-icone" data-acao="voltar" aria-label="Voltar">${ic("voltar")}</button><div class="titulo">${esc(titulo)}</div>`;
    const tab = { inicio: "inicio", trilha: "trilha", modulo: "trilha", licao: "trilha", quiz: "trilha", prova: "trilha", jogar: "jogar", relampago: "jogar", subrede: "jogar", labs: "jogar", lab: "jogar", revisao: "jogar", casos: "jogar", caso: "jogar", sims: "jogar", sim: "jogar", exercicios: "trilha", estagio: "trilha", cadernos: "jogar", caderno: "jogar", sala: "jogar", bancada: "jogar", glossario: "guia", protocolos: "guia", protocolo: "guia", plano: "inicio", ranking: "ranking", guia: "guia" }[t];
    document.querySelectorAll(".nav button").forEach((b) => b.setAttribute("aria-current", b.dataset.ir === tab ? "page" : "false"));
    $("#app").innerHTML = TELAS[t]();
    if (POS[t]) POS[t]();
  }
  const TITULOS = {
    modulo: () => mod(rota.mid).codigo, licao: () => LICOES[rota.lid].titulo, quiz: () => "Quiz · " + LICOES[rota.lid].titulo,
    prova: () => "Prova · " + mod(rota.mid).codigo, relampago: () => "Quiz relâmpago", subrede: () => "Desafio sub-rede",
    labs: () => "Laboratório CLI", lab: () => labPorId(rota.id).titulo, revisao: () => "Caderno de erros", perfil: () => "Perfil e definições",
    plano: () => "O meu plano", sims: () => "Simulador de rede", sim: () => rota.proj ? "Projeto" : rota.id === "livre" ? "Simulador · modo livre" : ativPorId(rota.id).titulo, casos: () => "Casos reais", caso: () => casoPorId(rota.id).titulo,
    exercicios: () => "Exercícios · " + LICOES[rota.lid].titulo, glossario: () => "Glossário", protocolos: () => "Protocolos", protocolo: () => PROT[rota.id].sigla,
    cadernos: () => "Cadernos de exercícios", caderno: () => window.Exercicios.CADERNOS.find((c) => c.id === rota.id).titulo, estagio: () => "Estágio · " + mod(rota.mid).codigo,
    sala: () => "Sala de laboratório", bancada: () => "Bancada",
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
        <div class="meio"><span class="rotulo">Continuar · ${prox.m.codigo}</span><b>${esc(prox.l.titulo)}</b><span class="suave peq">${prox.l.minutos} min · ${esc(prox.l.nivel)}</span></div>
        <span class="estado-ico atual">${ic("play")}</span></button>`;
    else continuar = `<button class="item" data-acao="prova" data-id="${prox.m.id}"><div class="ico-caixa">${ic("medalha")}</div>
        <div class="meio"><span class="rotulo">Pronto para a prova</span><b>Prova do ${prox.m.codigo}: ${esc(prox.m.titulo)}</b><span class="suave peq">Precisa de ${NOTA_APROVACAO}/1000</span></div><span class="estado-ico atual">${ic("play")}</span></button>`;
    const dica = D.guia.dicas[new Date().getDate() % D.guia.dicas.length];
    return `
      <section class="nivel">
        <span class="rotulo" style="color:inherit;opacity:.85">Olá, ${esc(p.nome)}</span>
        <h1>${esc(n.nome)}</h1>
        <div class="barra" role="progressbar" aria-valuenow="${Math.round(n.pct * 100)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${n.pct * 100}%"></i></div>
        <div class="meta tab-num"><span>${p.xp} XP${n.prox ? ` · faltam ${n.prox - p.xp} para ${esc(n.proxNome)}` : ""}</span><span>${feitas}/${totalLicoes} lições</span><span>${seq} dia${seq === 1 ? "" : "s"} seguidos</span></div>
        ${p.motivos.length ? `<span class="peq" style="opacity:.9">Objetivo: ${esc(p.motivos[0])}</span>` : ""}
      </section>
      ${cartaoHoje()}
      ${continuar}
      <section class="secao">
        <header><h2>O seu painel</h2><span class="rotulo">cada LED é um módulo</span></header>
        <div class="painel">${D.cursos.map((c) => { const ms = MODS.filter((m) => m.curso === c.id);
          return `<button class="fila" data-acao="trilha-curso" data-id="${c.id}" aria-label="${esc(c.titulo)}"><span class="num">${c.id === "B" ? "CCNA1" : c.id === "C" ? "CCNA2" : c.id === "D" ? "CCNA3" : c.id === "E" ? "EXTRA" : c.id === "F" ? "FINAL" : "BASE"}</span>
            <span class="leds">${ms.map((m) => `<i class="led ${progressoModulo(m) >= 1 ? "on" : progressoModulo(m) > 0 || (proximaLicao() && proximaLicao().m === m) ? "amb" : ""}" title="${esc(m.codigo)}"></i>`).join("")}</span>
            <span class="pct tab-num">${Math.round(ms.reduce((a, m) => a + progressoModulo(m), 0) / ms.length * 100)}%</span></button>`; }).join("")}</div>
      </section>
      <section class="secao">
        <h2>Praticar</h2>
        <div class="acoes">
          <button class="acao" data-acao="ir" data-tela="sims">${F.icone("switch", 28)}<b>Simulador de rede</b><span>${Object.values(p.sims).filter((x) => x.feito).length}/${D.atividades.length} práticas feitas</span></button>
          <button class="acao" data-acao="ir" data-tela="relampago">${ic("raio")}<b>Quiz relâmpago</b><span>60 segundos, recorde ${p.recordes.relampago}</span></button>
          <button class="acao" data-acao="ir" data-tela="subrede">${ic("calc")}<b>Desafio sub-rede</b><span>Melhor série: ${p.recordes.subrede}</span></button>
          <button class="acao" data-acao="ir" data-tela="labs">${ic("terminal")}<b>Laboratório CLI</b><span>${Object.keys(p.labs).length}/${D.labs.length} concluídos</span></button>
          <button class="acao" data-acao="ir" data-tela="revisao">${ic("caderno")}<b>Caderno de erros</b><span>${p.erros.length} pergunta${p.erros.length === 1 ? "" : "s"} para rever</span></button>
          <button class="acao" data-acao="ir" data-tela="casos">${ic("caso")}<b>Casos reais</b><span>${Object.keys(p.casos).length}/${D.casos.length} resolvidos</span></button>
          <button class="acao" data-acao="ir" data-tela="plano">${ic("calendario")}<b>O meu plano</b><span>${horas(p.plano.min)}/dia · ${p.plano.dias.length} dias/semana</span></button>
        </div>
      </section>
      <div class="dica">${ic("dica")}<div><b>Dica de exame.</b> ${esc(dica)}</div></div>`;
  };

  const CURSOS = D.cursos;
  const modsDoCurso = (c) => MODS.filter((m) => m.curso === c);
  const ativPorId = (id) => D.atividades.find((a) => a.id === id);
  const simFeito = (id) => !!(P().sims[id] && P().sims[id].feito);
  const fichaFeita = (mid) => !!P().fichas[mid];

  TELAS.trilha = function () {
    const prox = proximaLicao();
    return `<div class="secao"><h1>Conteúdo programático</h1><p class="suave">Do mais básico ao CCNA e além: ${CURSOS.length} partes, ${MODS.length} módulos, ${Object.keys(LICOES).length} aulas. Cada módulo termina com uma prova; passe com ${NOTA_APROVACAO}/1000 para desbloquear o seguinte${S.livre ? " (modo livre ativo: tudo desbloqueado)" : ""}.</p></div>
      ${CURSOS.map((c) => {
        const ms = modsDoCurso(c.id), pct = Math.round(ms.reduce((a, m) => a + progressoModulo(m), 0) / ms.length * 100);
        const aberto = (prox && prox.m.curso === c.id) || rota.curso === c.id;
        return `<details class="curso" ${aberto ? "open" : ""}><summary><div class="meio"><span class="rotulo">Parte ${c.id} · ${c.horas} h · ${ms.length} módulos</span><b>${esc(c.titulo)}</b><span class="suave peq">${esc(c.descricao)}</span>
          <div class="barra"><i style="width:${pct}%"></i></div></div><span class="chip ${pct === 100 ? "ok" : pct ? "acc" : ""} tab-num">${pct}%</span></summary>
          <div class="lista">${ms.map((m) => {
            const ab = moduloAberto(m), p = Math.round(progressoModulo(m) * 100);
            return `<button class="item" data-acao="modulo" data-id="${m.id}" ${ab ? "" : 'aria-disabled="true"'}>
              <span class="codigo-mod">${esc(m.codigo)}</span>
              <div class="meio"><b>${esc(m.titulo)}</b><span class="suave peq">${m.horas} h · ${m.licoes.length} aula${m.licoes.length > 1 ? "s" : ""}${m.sim.length ? " · simulador" : ""}</span><span class="leds">${leds(m)}</span></div>
              ${ab ? `<span class="chip ${p === 100 ? "ok" : p ? "acc" : ""} tab-num">${p}%</span>` : `<span class="estado-ico bloq">${ic("cadeado")}</span>`}</button>`;
          }).join("")}</div></details>`;
      }).join("")}`;
  };

  TELAS.modulo = function () {
    const m = mod(rota.mid), aberto = moduloAberto(m);
    const pr = P().provas[m.id];
    const labs = D.labs.filter((l) => l.modulo === m.id), casos = D.casos.filter((c) => c.modulo === m.id), sims = m.sim.map(ativPorId).filter(Boolean);
    const curso = CURSOS.find((c) => c.id === m.curso), ant = MODS[MODS.indexOf(m) - 1], seg = MODS[MODS.indexOf(m) + 1];
    return `<div class="secao"><span class="rotulo">${esc(curso.titulo)}</span><h1><span class="codigo-mod grande">${esc(m.codigo)}</span> ${esc(m.titulo)}</h1>
        <div class="linha"><span class="chip">${ic("relogio")} ${m.horas} h</span><span class="leds">${leds(m)}</span><span class="chip tab-num">${Math.round(progressoModulo(m) * 100)}% concluído</span></div></div>
      <section class="secao"><header><h2>Apresentação do módulo</h2><span class="rotulo">${Math.max(1, Math.round(m.apresentacao.video.segundos / 60))} min${ant ? " · inclui o resumo do " + esc(ant.codigo) : ""}</span></header><div id="video-modulo"></div></section>
      ${aberto ? "" : `<div class="alerta">${ic("cadeado")}<div>Passe a prova do módulo anterior (${esc(ant ? ant.codigo : "")}) para desbloquear, ou ative o <b>modo livre</b> no perfil.</div></div>`}
      <div class="cartao plano"><span class="rotulo">Objetivos</span><ul class="objetivos">${m.objetivos.map((o) => `<li>${esc(o)}</li>`).join("")}</ul>
        <span class="rotulo">Conteúdo programático</span><ul class="temas">${m.temas.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>
      ${grelhaAprender(m, labs, casos, sims)}
      <section class="secao"><h2>Aulas</h2><div class="lista">${m.licoes.map((l, i) => {
        const feita = licaoFeita(l.id), ab = licaoAberta(l), r = P().licoes[l.id];
        return `<button class="item" data-acao="licao" data-id="${l.id}" ${ab ? "" : 'aria-disabled="true"'}>
          <span class="estado-ico ${feita ? "ok" : ab ? "atual" : "bloq"}">${feita ? ic("check") : ab ? i + 1 : ic("cadeado")}</span>
          <div class="meio"><b>${esc(l.titulo)}</b><span class="suave peq">${l.minutos} min · vídeo-aula ${Math.round(l.video.segundos / 60)} min · ${l.quiz.length} perguntas · exercícios ${Math.min(exFeitos(l.id), exObrig(l.id))}/${exObrig(l.id)}${r && r.video ? " · vídeo visto ✓" : ""}</span></div>
          ${r && r.melhor != null ? `<span class="chip ${r.melhor >= 70 ? "ok" : "warn"} tab-num">${r.melhor}%</span>` : ""}</button>`;
      }).join("")}</div></section>
      ${sims.length ? `<section class="secao"><h2>Prática no simulador</h2><div class="lista">${sims.map(itemSim).join("")}</div></section>` : ""}
      ${labs.length ? `<section class="secao"><h2>Laboratórios CLI</h2><div class="lista">${labs.map(itemLab).join("")}</div></section>` : ""}
      ${casos.length ? `<section class="secao"><h2>Problemas reais</h2><div class="lista">${casos.map(itemCaso).join("")}</div></section>` : ""}
      <section class="secao" id="ficha"><header><h2>Ficha de trabalho</h2>${fichaFeita(m.id) ? '<span class="chip ok">Feita</span>' : ""}</header>
        <p class="suave peq">Responda no caderno e só depois toque em “ver resposta”.</p>
        <ol class="ficha">${m.ficha.map((q) => `<li><p>${esc(q.p)}</p><details><summary>ver resposta</summary><p class="resposta">${esc(q.r)}</p></details></li>`).join("")}</ol>
        ${fichaFeita(m.id) ? "" : `<button class="btn bloco" data-acao="ficha-feita" data-id="${m.id}">${ic("check")} Marcar ficha como feita</button>`}</section>
      ${m.comandos ? `<section class="secao"><h2>Comandos do módulo</h2><div class="term"><div class="barra-term"><span class="pontos"><i></i><i></i><i></i></span><span>referência</span></div><pre>${esc(m.comandos)}</pre></div></section>` : ""}
      ${m.estagio ? (() => { const emp = D.empresas[m.estagio.empresa], ne = notaEstagio(m.id); return `<section class="secao"><h2>Estágio profissional</h2><button class="item" data-acao="estagio" data-id="${m.id}" ${aberto ? "" : 'aria-disabled="true"'}>
          <div class="ico-caixa">${F.icone("servidor", 32)}</div><div class="meio"><b>${esc(emp.nome)}</b><span class="suave peq">${esc(emp.setor)} · o instrutor resolve um ticket real e depois faz ${m.estagio.tarefas.length} sozinho · nota 0–20</span></div>
          ${ne != null ? `<span class="chip ${ne >= 10 ? "ok" : "bad"} tab-num">${ne}/20</span>` : ""}</button></section>`; })() : ""}
      <section class="secao"><h2>Teste final do módulo</h2><button class="item" data-acao="prova" data-id="${m.id}" ${provaAberta(m) ? "" : 'aria-disabled="true"'}>
          <span class="estado-ico ${provaFeita(m.id) ? "ok" : provaAberta(m) ? "atual" : "bloq"}">${provaFeita(m.id) ? ic("check") : ic(provaAberta(m) ? "medalha" : "cadeado")}</span>
          <div class="meio"><b>Prova do módulo ${esc(m.codigo)}</b><span class="suave peq">${nProva(m)} perguntas · cronometrada · aprovação ${NOTA_APROVACAO}/1000</span></div>
          ${pr ? `<span class="chip ${pr.melhor >= NOTA_APROVACAO ? "ok" : "bad"} tab-num">${pr.melhor}</span>` : ""}</button></section>
      <div class="grelha-2">${ant ? `<button class="btn" data-acao="modulo" data-id="${ant.id}">← ${esc(ant.codigo)}</button>` : "<span></span>"}${seg ? `<button class="btn" data-acao="modulo" data-id="${seg.id}" ${moduloAberto(seg) ? "" : "disabled"}>${esc(seg.codigo)} →</button>` : "<span></span>"}</div>`;
  };
  POS.modulo = function () {
    const m = mod(rota.mid), caixa = $("#video-modulo");
    if (caixa && window.VideoAula && m.apresentacao) { const lt = window.VideoAula.montar(caixa, m.apresentacao, {}); limpar = () => lt.parar(); }
  };
  function grelhaAprender(m, labs, casos, sims) {
    const tempo = m.licoes.reduce((a, l) => a + Math.max(l.minutos, Math.ceil(l.video.segundos / 60)) + Math.ceil(l.quiz.length * 1.2), 0) + labs.length * 15 + casos.length * 10 + sims.length * 20 + 10 + 15;
    const pl = P().plano, diasMod = Math.max(1, Math.ceil(tempo / pl.min));
    return `<section class="secao"><header><h2>O que vai aprender</h2><span class="rotulo">${horas(tempo)} na app · ~${diasMod} dia${diasMod > 1 ? "s" : ""}</span></header>
      <div class="grelha-aprender">${m.licoes.map((l, i) => `<button class="tile ${licaoFeita(l.id) ? "feita" : ""}" data-acao="licao" data-id="${l.id}" ${licaoAberta(l) ? "" : 'aria-disabled="true"'}>
        <span class="rotulo">Aula ${i + 1}${licaoFeita(l.id) ? " ✓" : ""}</span><b>${esc(l.titulo.replace(/^Comece por aqui: /, ""))}</b>
        <ul>${l.objetivos.slice(0, 2).map((o) => `<li>${esc(o)}</li>`).join("")}</ul><span class="suave peq">${l.minutos} min + vídeo · ${esc(l.nivel)}</span></button>`).join("")}
        ${sims.length ? `<div class="tile extra"><span class="rotulo">Simulador</span><b>${sims.length} prática${sims.length > 1 ? "s" : ""} guiada${sims.length > 1 ? "s" : ""}</b><ul>${sims.map((a) => `<li>${esc(a.titulo)}</li>`).join("")}</ul></div>` : ""}
        ${labs.length ? `<div class="tile extra"><span class="rotulo">Laboratório</span><b>${labs.length} laboratório${labs.length > 1 ? "s" : ""} CLI</b><ul>${labs.map((l) => `<li>${esc(l.titulo)}</li>`).join("")}</ul></div>` : ""}
        ${casos.length ? `<div class="tile extra"><span class="rotulo">Problemas reais</span><b>${casos.length} caso${casos.length > 1 ? "s" : ""}</b><ul>${casos.map((c) => `<li>${esc(c.titulo)}</li>`).join("")}</ul></div>` : ""}
        <div class="tile extra"><span class="rotulo">Ficha e prova</span><b>${m.ficha.length} exercícios + prova</b><ul><li>${nProva(m)} perguntas cronometradas</li><li>Aprovação ${NOTA_APROVACAO}/1000</li></ul></div>
      </div></section>`;
  }
  const nProva = (m) => Math.min(15, totalPerguntas(m)) + 5;
  const totalPerguntas = (m) => m.licoes.reduce((a, l) => a + l.quiz.length, 0) + m.prova_extra.length;

  // ------------------------------------------------------------ lição
  TELAS.licao = function () {
    const l = LICOES[rota.lid], m = MOD_DA[l.id];
    if (!licaoAberta(l)) return `<div class="vazio">${ic("cadeado")}<p>Conclua a lição anterior para abrir esta.</p></div>`;
    const ant = m.licoes[l._i - 1], prox = m.licoes[l._i + 1];
    const r = P().licoes[l.id];
    return `<article class="cab-licao"><span class="rotulo">${m.codigo} · Lição ${l._i + 1} de ${m.licoes.length}</span><h1>${esc(l.titulo)}</h1>
        <div class="linha"><span class="chip">${ic("relogio")} ${l.minutos} min</span><span class="chip acc">${esc(l.nivel)}</span>${r && r.melhor != null ? `<span class="chip ${r.melhor >= 70 ? "ok" : "warn"}">Melhor quiz: ${r.melhor}%</span>` : ""}</div>
        <div class="cartao plano"><span class="rotulo">Objetivos</span><ul class="objetivos">${l.objetivos.map((o) => `<li>${esc(o)}</li>`).join("")}</ul></div></article>
      <section class="secao"><header><h2>Vídeo-aula</h2><span class="rotulo">${Math.round(l.video.segundos / 60)} min · narrada${r && r.video ? " · vista ✓" : ""}</span></header>
        <div id="videoaula"></div><p class="suave peq">A vídeo-aula explica todo o conteúdo desta lição, cena a cena, com legendas. Por baixo tem o texto completo para ler ao seu ritmo.</p></section>
      <h2>Conteúdo da lição</h2>
      <div class="conteudo">${l.blocos.map(bloco).join("")}</div>
      ${termosLicao(l)}
      <section class="secao"><h2>Referências bibliográficas</h2><ol class="refs">${l.referencias.map((k) => `<li>${linkar(D.referencias[k])}</li>`).join("")}</ol></section>
      ${cartaoExercicios(l)}
      <div class="cartao"><h3>Testar o que aprendeu</h3><p class="suave">${l.quiz.length} perguntas. Para concluir a aula: 70% no quiz e os ${exObrig(l.id)} exercícios obrigatórios.</p>
        <button class="btn prim bloco" data-acao="quiz" data-id="${l.id}">${ic("play")} Fazer o quiz</button>
        <button class="btn bloco" data-acao="repetir" data-id="${l.id}">${ic("repetir")} Repetir a aula desde o início</button></div>
      <div class="grelha-2">${ant ? `<button class="btn" data-acao="licao" data-id="${ant.id}">← Anterior</button>` : "<span></span>"}${prox ? `<button class="btn" data-acao="licao" data-id="${prox.id}" ${licaoAberta(prox) ? "" : "disabled"}>Seguinte →</button>` : `<button class="btn" data-acao="prova" data-id="${m.id}" ${provaAberta(m) ? "" : "disabled"}>Prova do módulo →</button>`}</div>`;
  };
  POS.licao = function () {
    const l = LICOES[rota.lid];
    const caixa = $("#videoaula");
    if (caixa && window.VideoAula) {
      const leitor = window.VideoAula.montar(caixa, l, {
        aoTerminar: () => { const r = P().licoes[l.id] || (P().licoes[l.id] = {}); if (!r.video) { r.video = Date.now(); guardar(); ganharXP(10, "vídeo-aula"); } },
        aoQuiz: () => { sessao = null; ir("quiz", { lid: l.id }); },
      });
      limpar = () => leitor.parar();
    }
    const r = P().licoes[l.id] || (P().licoes[l.id] = {});
    if (!r.lida) { r.lida = Date.now(); guardar(); setTimeout(() => ganharXP(10, "lição aberta"), 400); }
    else if (licaoFeita(l.id) && (r.melhor || 0) < 85 && !P().reforcos[l.id]) { P().reforcos[l.id] = Date.now(); guardar(); }
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
      case "jogo_cabo": return `<section class="bloco"><h3>${ic("jogo")} Prática: montar o cabo</h3>${htmlJogoCabo(b.norma)}</section>`;
      case "video": return b.arquivo ? `<figure class="fig-caixa" style="margin:0"><video src="${esc(b.arquivo)}" controls preload="metadata" style="width:100%;border-radius:10px"></video><figcaption>${esc(b.titulo)}</figcaption></figure>` : "";
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
    if (q.tipo === "valor") return window.Exercicios.corrigir(q, resp);
    return q.respostas.some((r) => normCmd(r) === normCmd(resp));
  }
  // Prompt do terminal da pergunta de comando: Windows, Linux ou Cisco, pela resposta esperada
  function promptDe(q) {
    const r = (q.respostas || [""])[0].trim().toLowerCase();
    if (/^(net |ipconfig|ping |tracert|nslookup|netsh|arp |test-netconnection|new-smbshare|get-smbshare|route print|hostname$|getmac)/.test(r)) return "C:\\>";
    if (/^(sudo |ip |ls|cat |nano |systemctl|smbclient|mount|ssh |chmod|chown|apt |ufw |testparm|exportfs)/.test(r)) return "$";
    if (/^(show|sh |enable|en$|conf|copy|wr|ping|traceroute|debug|undebug|clear|reload|dir)/.test(r)) return "Router#";
    if (/^(sw|switchport|ip address|ip add|shut|no shut|description|desc|spanning-tree (portfast|bpduguard|guard)|channel-group|standby|encapsulation|encap|ip helper|ip nat (inside|outside)|ip ospf|ip access-group|ipv6 address|duplex|speed|interface)/.test(r)) return "Router(config-if)#";
    if (/^(network|router-id|passive|default-information|auto-cost|default-router|dns-server|permit|deny|remark)/.test(r)) return "Router(config-…)#";
    return "Router(config)#";
  }
  const txtP = (q) => (q.html ? q.p : esc(q.p));
  const txtE = (q) => (q.html ? q.explica : esc(q.explica));
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
    else if (q.tipo === "valor") corpo = `<form data-form="cmd" class="secao"><label class="rotulo" for="resp-cmd">A sua resposta</label>
        <input class="campo mono" id="resp-cmd" autocomplete="off" autocapitalize="off" spellcheck="false" inputmode="text" placeholder="${esc(q.dica || "escreva a resposta")}" value="${esc(estado.resp || "")}" ${fixo ? "disabled" : ""}>
        ${fixo ? "" : `<button class="btn prim" type="submit">Responder</button>`}</form>`;
    else corpo = `<form data-form="cmd" class="secao"><div class="term" style="display:flex;align-items:center;gap:8px;padding:10px 12px"><span style="color:var(--term-prompt)">${promptDe(q)}</span>
        <input class="campo mono" id="resp-cmd" style="background:transparent;border:0;color:#fff;min-height:36px;padding:0" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="escreva o comando" value="${esc(estado.resp || "")}" ${fixo ? "disabled" : ""}></div>
        ${fixo ? "" : `<button class="btn prim" type="submit">Responder</button>`}</form>`;
    let fb = "";
    if (fixo && estado.feedback) {
      const ok = corrigir(q, estado.resp);
      fb = `<div class="feedback ${ok ? "ok" : "bad"}"><b>${ok ? "Certo!" : "Não é bem assim."}</b>${ok ? "" : `<span>Resposta: <b class="mono">${esc(respostaCerta(q))}</b></span>`}${q.html ? `<details class="resolucao" ${ok ? "" : "open"}><summary>Ver a resolução passo a passo</summary><div class="html">${q.explica}</div></details>` : `<span>${esc(q.explica)}</span>`}</div>`;
    }
    return `<div class="pergunta">${txtP(q)}</div>${q.fig ? `<div class="fig-caixa">${q.fig}</div>` : ""}${corpo}${fb}`;
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
    if (sessao.aoResponder) sessao.aoResponder(q, ok);
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
      return `<div class="cartao plano"><div class="linha"><span class="chip ${ok ? "ok" : "bad"}">${ok ? "Certa" : "Errada"}</span></div><div><b>${txtP(q)}</b></div>
        ${ok ? "" : `<p class="peq">A sua: ${esc(s.respostas[i] == null ? "sem resposta" : q.tipo === "mc" ? q.opcoes[s.respostas[i]] : q.tipo === "vf" ? (s.respostas[i] ? "Verdadeiro" : "Falso") : s.respostas[i])}</p>`}
        <p class="peq">Correta: <b>${esc(respostaCerta(q))}</b></p><div class="suave peq">${txtE(q)}</div></div>`;
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
        <p>${sessao.acertos} de ${sessao.perguntas.length} certas. ${pct >= 70 ? (exFeitos(l.id) >= exObrig(l.id) ? "Lição concluída!" : `Quiz aprovado! Faltam ${exObrig(l.id) - exFeitos(l.id)} exercícios obrigatórios para concluir a aula.`) : "Precisa de 70% para concluir. Reveja a aula e tente de novo."}</p>
        ${sessao.ganho ? `<span class="chip acc">+${sessao.ganho} XP</span>` : ""}</div>
      ${revisaoRespostas(sessao)}
      <div class="grelha-2"><button class="btn" data-acao="refazer-quiz" data-id="${l.id}">${ic("repetir")} Refazer quiz</button><button class="btn" data-acao="licao" data-id="${l.id}">Rever a aula</button></div>
      ${pct >= 70 && exFeitos(l.id) < exObrig(l.id) ? `<button class="btn prim bloco" data-acao="exercicios" data-id="${l.id}">${ic("calc")} Fazer os exercícios obrigatórios</button>` : ""}
      ${licaoFeita(l.id) ? (prox ? `<button class="btn prim bloco" data-acao="licao" data-id="${prox.id}">Próxima lição →</button>` : `<button class="btn prim bloco" data-acao="prova" data-id="${m.id}" ${provaAberta(m) ? "" : "disabled"}>Fazer a prova do módulo →</button>`) : ""}`;
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
      return `<div class="cartao"><span class="rotulo">Prova do ${m.codigo}</span><h1>${esc(m.titulo)}</h1>
        <ul class="objetivos"><li>${nProva(m)} perguntas sorteadas de todo o módulo.</li><li>${Math.min(15, totalPerguntas(m))} minutos no total; sem correção até ao fim, como no exame real.</li><li>Pontuação de 0 a 1000. Aprovação: <b>${NOTA_APROVACAO}</b>.</li><li>Pode repetir quantas vezes quiser; conta a melhor nota.</li></ul>
        <button class="btn prim bloco" data-acao="comecar-prova" data-id="${m.id}">${ic("relogio")} Começar a prova</button></div>`;
    }
    if (!sessao.fim) return telaPerguntas(`<span class="chip warn temporizador tab-num" id="tempo">--:--</span>`) + (["cmd", "valor"].includes(sessao.perguntas[sessao.i].tipo) ? "" : `<button class="btn bloco" data-acao="seguinte-prova" ${sessao.respostas[sessao.i] == null ? "disabled" : ""}>Confirmar e seguir</button>`);
    const nota = sessao.nota, ok = nota >= NOTA_APROVACAO;
    const clas = nota >= 950 ? "Excelente" : ok ? "Aprovado" : nota >= 700 ? "Quase lá" : "Precisa de rever";
    return `<div class="cartao resultado"><span class="rotulo">Prova do ${m.codigo}</span><span class="chip ${ok ? "ok" : "bad"}">${clas}</span>
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
        <button class="item" data-acao="ir" data-tela="sims"><div class="ico-caixa">${F.icone("switch", 34)}</div><div class="meio"><b>Simulador de rede</b><span class="suave peq">Monte e configure redes como no Packet Tracer, com atividades passo a passo.</span></div><span class="chip acc tab-num">${Object.values(p.sims).filter((x) => x.feito).length}/${D.atividades.length}</span></button>
        <button class="item" data-acao="ir" data-tela="sala"><div class="ico-caixa">${F.icone("pc", 34)}</div><div class="meio"><b>Sala de laboratório</b><span class="suave peq">Bancadas com equipamentos físicos: ligar cabos, cabo de consola, PuTTY, placa de rede, testador e partilha.</span></div><span class="chip acc tab-num">${Object.values(p.salaLab).filter((x) => x.feito).length}/${(window.Laboratorio ? window.Laboratorio.BANCADAS.length : 0)}</span></button>
        <button class="item" data-acao="ir" data-tela="cadernos"><div class="ico-caixa">${ic("calc")}</div><div class="meio"><b>Cadernos de exercícios</b><span class="suave peq">50 de conversão binária, 100 de sub-redes, classes e máscaras, VLSM com diagrama, OSI e portas.</span></div><span class="chip acc tab-num">${Object.values(p.cadernos).reduce((a, c) => a + Object.values(c).filter(Boolean).length, 0)}</span></button>
        <button class="item" data-acao="ir" data-tela="casos"><div class="ico-caixa">${ic("caso")}</div><div class="meio"><b>Casos reais</b><span class="suave peq">Um cliente liga com um problema: diagnostique e resolva, como no trabalho.</span></div><span class="chip acc tab-num">${Object.keys(p.casos).length}/${D.casos.length}</span></button>
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
  const CONTEXTOS_SUB = {
    rede: ["O PC da receção da clínica tem o IP {ip}. Para escrever a rota no router precisa do endereço da rede.", "Numa ACL vai bloquear a rede inteira onde está o servidor {ip}."],
    broadcast: ["No Wireshark de uma escola vê tráfego para todos os hosts da rede de {ip}. Para onde vai esse broadcast?", "Um utilizador configurou {ip} e diz que “não funciona”. Confirme se não escolheu o broadcast."],
    primeiro: ["Vai configurar o gateway de uma VLAN nova com o primeiro IP válido da rede de {ip}.", "O router do hotel deve ficar com o primeiro endereço da rede de {ip}."],
    ultimo: ["A impressora do escritório deve ficar com o último IP válido da rede de {ip}.", "O servidor de câmaras do armazém usa sempre o último host da rede de {ip}."],
    hosts: ["O armazém quer saber quantos equipamentos cabem na rede de {ip} antes de comprar mais leitores.", "A escola tem de ligar uma sala de informática à rede de {ip}. Quantos PCs (incluindo o gateway) cabem?"],
    mascara: ["O colega só lhe disse o prefixo. Para o comando ip address no router precisa da máscara de {ip}.", "O formulário do Windows pede a máscara em decimal para {ip}."],
  };
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
    const ctxs = CONTEXTOS_SUB[tipo[0]], contexto = ctxs[Math.floor(Math.random() * ctxs.length)].replace("{ip}", `${ip}/${pref}`);
    return { ip, pref, tipo: tipo[0], pergunta: tipo[1], contexto, resposta: sol[tipo[0]], explica, inicio: Date.now() };
  }
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  let sub = null;
  TELAS.subrede = function () {
    if (!sub) sub = { serie: 0, d: novoDesafio() };
    const d = sub.d;
    return `<div class="linha entre"><span class="chip acc tab-num">Série: ${sub.serie}</span><span class="chip tab-num">Recorde: ${P().recordes.subrede}</span></div>
      <div class="cartao"><span class="rotulo">Situação real · endereço</span><div style="font:800 1.9rem var(--f-mono);letter-spacing:-.02em" class="tab-num">${d.ip}/${d.pref}</div>
        <p class="contexto-sub">${esc(d.contexto)}</p><p class="pergunta">${d.pergunta}</p>
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
      <div class="meio"><span class="rotulo">${mod(lab.modulo).codigo} · ${esc(lab.nivel)}</span><b>${esc(lab.titulo)}</b><span class="suave peq">${esc(lab.cenario)}</span></div>
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
        <div class="cenario"><span class="rotulo">Cenário</span><p>${esc(lab.cenario)}</p></div>
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
        ${MODS.map((m) => { const r = p.provas[m.id]; return `<tr><td>${esc(m.codigo)} · ${esc(m.titulo)}</td><td class="tab-num">${r ? r.melhor : "—"}</td><td class="tab-num">${r ? r.tentativas : 0}</td><td>${r ? (r.melhor >= NOTA_APROVACAO ? '<span class="chip ok">Aprovado</span>' : '<span class="chip bad">Repetir</span>') : '<span class="chip">Por fazer</span>'}</td></tr>`; }).join("")}
      </tbody></table></div></section>
      <section class="secao"><h2>Conquistas</h2><div class="medalhas">${CONQUISTAS.map(([id, nome, desc]) => `<div class="medalha ${p.conquistas[id] ? "ganha" : ""}"><span class="m">${ic("medalha")}</span><b>${esc(nome)}</b><span class="suave">${esc(desc)}</span></div>`).join("")}</div></section>`;
  };

  // --- guia
  let abaGuia = "roteiro", filtroGloss = "";
  TELAS.guia = function () {
    const abas = [["roteiro", "Roteiro"], ["plano", "Plano 12 semanas"], ["exame", "Dicas de exame"], ["simreal", "Simulador × real"], ["ferramentas", "Ferramentas"], ["glossario", "Glossário e protocolos"], ["refs", "Referências"]];
    const G = D.guia;
    let corpo = "";
    if (abaGuia === "roteiro") corpo = `<p class="suave">Os 6 domínios do exame CCNA 200-301 v1.1, o peso de cada um e onde os estudar nesta app.</p>
      <div class="lista">${G.dominios.map((d) => { const ms = d.modulos.map(mod); const pct = Math.round(ms.reduce((a, m) => a + progressoModulo(m), 0) / ms.length * 100);
        return `<div class="cartao plano peso"><b>${esc(d.nome)}</b><span class="chip acc tab-num">${d.peso}% do exame</span><div class="barra"><i style="width:${pct}%"></i></div>
          <span class="suave peq">${ms.map((m) => `${m.codigo}`).join(", ")} · ${pct}% concluído</span></div>`; }).join("")}</div>
      <div class="cartao plano"><h3>Como usar a app</h3><ol class="objetivos"><li>Veja a vídeo-aula: explica todo o conteúdo, cena a cena, com voz e legendas.</li><li>Leia a lição com calma e reveja as figuras e os comandos.</li><li>Faça o quiz (70% para concluir). Errou? Use “Repetir a aula”.</li><li>Pratique o laboratório do módulo no terminal simulado e depois no Packet Tracer.</li><li>Passe a prova (${NOTA_APROVACAO}/1000) para desbloquear o próximo módulo.</li><li>Todos os dias: 5 min de desafio sub-rede e o caderno de erros.</li></ol></div>`;
    if (abaGuia === "plano") corpo = `<div class="tabela-caixa"><table><thead><tr><th>Semana</th><th>Estudar</th><th>Praticar</th></tr></thead><tbody>${G.plano.map((p) => `<tr><td><b>${esc(p.semana)}</b></td><td>${esc(p.tema)}</td><td>${esc(p.pratica)}</td></tr>`).join("")}</tbody></table></div>
      <p class="suave peq">Ritmo pensado para ~1 h por dia, 5 dias por semana. Ajuste ao seu tempo.</p>`;
    if (abaGuia === "exame") corpo = `<ol class="objetivos">${G.dicas.map((d) => `<li>${esc(d)}</li>`).join("")}</ol>`;
    if (abaGuia === "simreal") corpo = `<p class="suave">O simulador ensina a lógica; o equipamento real ensina o ofício. Diferenças que vai sentir:</p>
      <div class="tabela-caixa"><table><thead><tr><th>Tema</th><th>Simulador</th><th>Equipamento real</th></tr></thead><tbody>${G.sim_real.map((r) => `<tr><td><b>${esc(r.tema)}</b></td><td>${esc(r.sim)}</td><td>${esc(r.real)}</td></tr>`).join("")}</tbody></table></div>`;
    if (abaGuia === "ferramentas") corpo = `<div class="lista">${G.ferramentas.map((f) => `<a class="item" href="${esc(f.url)}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit"><div class="ico-caixa">${ic("terminal")}</div><div class="meio"><b>${esc(f.nome)}</b><span class="suave peq">${esc(f.desc)}</span></div><span class="suave">↗</span></a>`).join("")}</div>`;
    if (abaGuia === "glossario") {
      corpo = `<div class="lista"><button class="item" data-acao="ir" data-tela="glossario"><div class="ico-caixa">${ic("livro")}</div><div class="meio"><b>Glossário completo</b><span class="suave peq">${D.glossario.length} termos técnicos explicados, com exemplo e pesquisa.</span></div></button>
        <button class="item" data-acao="ir" data-tela="protocolos"><div class="ico-caixa">${ic("terminal")}</div><div class="meio"><b>Todos os protocolos</b><span class="suave peq">${D.protocolos.length} protocolos: para que servem, camada, portas, como funcionam e comandos.</span></div></button></div>`;
    }
    if (false) {
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

  // ------------------------------------------------------------ plano de estudo
  const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const DIAS_LONGOS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  const hojeISO = () => window.Plano.iso(new Date());
  const minutosHoje = () => Math.round(P().tempo[hojeISO()] || 0);
  const casoFeito = (id) => !!P().casos[id];
  const dataPT = (d) => d.toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" });
  const horas = (min) => min < 60 ? `${Math.round(min)} min` : `${Math.floor(min / 60)} h${Math.round(min % 60) ? " " + Math.round(min % 60) + " min" : ""}`;
  function ctxPlano(cfgMinHoje) {
    const p = P();
    return {
      modulos: MODS, labs: D.labs, casos: D.casos, licaoFeita, provaFeita, labFeito: (id) => !!p.labs[id], casoFeito,
      nota: (id) => (p.licoes[id] || {}).melhor || 0, reforcado: (id) => !!p.reforcos[id],
      tempoLicao: p.tempoLicao, erros: p.erros.length, atividades: D.atividades, simFeito, fichaFeita, exFeitos, estagioFeito: (mid) => notaEstagio(mid) >= 10, empresa: (m) => D.empresas[m.estagio.empresa].nome, minutosHoje: cfgMinHoje == null ? minutosHoje() : cfgMinHoje,
    };
  }
  const calcularPlano = (cfg) => window.Plano.calcular(ctxPlano(cfg ? 0 : null), cfg || P().plano);

  function acaoTarefa(t) {
    switch (t.tipo) {
      case "aula": case "rever": case "pratica": return `data-acao="licao" data-id="${t.l.id}"`;
      case "quiz": return `data-acao="quiz" data-id="${t.l.id}"`;
      case "lab": return `data-acao="lab" data-id="${t.lab.id}"`;
      case "caso": return `data-acao="caso" data-id="${t.caso.id}"`;
      case "sim": return `data-acao="sim" data-id="${t.sim.id}"`;
      case "exercicios": return `data-acao="exercicios" data-id="${t.l.id}"`;
      case "estagio": return `data-acao="estagio" data-id="${t.m.id}"`;
      case "ficha": return `data-acao="modulo" data-id="${t.m.id}"`;
      case "revmod": return `data-acao="modulo" data-id="${t.m.id}"`;
      case "prova": return `data-acao="prova" data-id="${t.m.id}"`;
      default: return `data-acao="ir" data-tela="revisao"`;
    }
  }
  const ICONE_TAREFA = { exercicios: "calc", estagio: "caso", sim: "jogo", ficha: "caderno", aula: "livro", rever: "repetir", pratica: "terminal", quiz: "estrela", lab: "terminal", caso: "caso", revmod: "repetir", prova: "medalha", erros: "caderno" };
  const NOME_TAREFA = { exercicios: "Exercícios", estagio: "Estágio", sim: "Simulador", ficha: "Ficha", aula: "Aula", rever: "Reforço", pratica: "Prática", quiz: "Quiz", lab: "Laboratório", caso: "Caso real", revmod: "Revisão", prova: "Prova", erros: "Revisão" };
  function itemTarefa(it, bloqueia) {
    const t = it.t;
    const aberto = !bloqueia || (t.l ? licaoAberta(t.l) : t.m ? moduloAberto(t.m) : true);
    return `<button class="tarefa" ${acaoTarefa(t)} ${aberto ? "" : 'aria-disabled="true"'}>${ic(ICONE_TAREFA[t.tipo])}<span class="meio"><span class="rotulo">${NOME_TAREFA[t.tipo]}${it.parte ? " · parte " + it.parte : ""}</span><b>${esc(t.tipo === "aula" ? t.titulo : t.titulo)}</b></span><span class="chip tab-num">${it.min} min</span></button>`;
  }
  function cartaoHoje() {
    const p = P(), cfg = p.plano, pl = calcularPlano();
    const feito = minutosHoje(), meta = cfg.min, diaEstudo = cfg.dias.includes(new Date().getDay());
    const hoje = pl.dias.find((d) => d.data === hojeISO());
    const prox = pl.dias.find((d) => d.data !== hojeISO() && d.total > 0);
    let corpo;
    if (!pl.lista.length) corpo = `<p>Concluiu todo o plano. Mantenha o treino com o quiz relâmpago.</p>`;
    else if (diaEstudo && hoje && hoje.total > 0) corpo = hoje.sessoes.filter((s) => s.itens.length).map((s) => `<div class="sessao"><span class="rotulo">${esc(s.nome)} · ${s.itens.reduce((a, i) => a + i.min, 0)} min</span>${s.itens.map((i) => itemTarefa(i, true)).join("")}</div>`).join("");
    else if (diaEstudo) corpo = `<p><b>Meta de hoje cumprida!</b> Descanse ou adiante o que vem a seguir:</p>${prox ? prox.sessoes.flatMap((s) => s.itens).slice(0, 2).map((i) => itemTarefa(i, true)).join("") : ""}`;
    else corpo = `<p>Hoje é dia de descanso no seu plano. Próximo estudo: <b>${prox ? DIAS_LONGOS[prox.date.getDay()] : "—"}</b>.</p>${prox ? `<details><summary>Quero estudar hoje na mesma</summary>${prox.sessoes.flatMap((s) => s.itens).slice(0, 3).map((i) => itemTarefa(i, true)).join("")}</details>` : ""}`;
    return `<section class="cartao hoje"><div class="linha entre"><div><span class="rotulo">${diaEstudo ? "Aulas de hoje" : "Hoje"} · ${DIAS_LONGOS[new Date().getDay()]}</span><h2>${diaEstudo ? `${feito} de ${meta} min estudados` : "Dia de descanso"}</h2></div><span class="chip acc">${cfg.sessoes}× ${Math.round(meta / cfg.sessoes)} min</span></div>
      ${diaEstudo ? `<div class="barra"><i style="width:${Math.min(100, (feito / meta) * 100)}%;${feito >= meta ? "background:var(--ok)" : ""}"></i></div>` : ""}
      ${corpo}
      <button class="btn bloco" data-acao="ir" data-tela="plano">${ic("calendario")} Ver o meu plano completo</button></section>`;
  }

  function avisosPlano(pl) {
    const p = P(), cfg = p.plano, av = [];
    const r = pl.ritmo;
    if (r.amostras >= 3 && Math.abs(r.fator - 1) > 0.15) av.push(["ritmo", r.fator > 1
      ? `Está a precisar de cerca de ${Math.round((r.fator - 1) * 100)}% mais tempo por aula do que o previsto. As aulas seguintes já têm mais tempo no plano — é normal, cada pessoa tem o seu ritmo.`
      : `Está a estudar cerca de ${Math.round((1 - r.fator) * 100)}% mais depressa do que o previsto. O plano encurtou o tempo das próximas aulas.`]);
    const reforcos = pl.lista.filter((t) => t.tipo === "rever").length;
    if (reforcos) av.push(["notas", `${reforcos} aula${reforcos > 1 ? "s" : ""} com nota abaixo de 85% ${reforcos > 1 ? "têm" : "tem"} uma revisão curta no plano, para consolidar.`]);
    if (p.erros.length >= 5) av.push(["erros", `Tem ${p.erros.length} perguntas no caderno de erros: o plano começa com 10 minutos de revisão.`]);
    const alvo = p.alvo ? new Date(p.alvo) : null;
    if (alvo && pl.lista.length) {
      const dif = Math.round((pl.fim - alvo) / 86400000);
      if (dif > 3) {
        const precisa = window.Plano.minutosParaAlvo(pl.totalMin, cfg, alvo);
        av.push(["atraso", `Ao ritmo atual termina a ${dataPT(pl.fim)}, ${dif} dias depois do seu objetivo (${dataPT(alvo)}).${precisa && precisa > cfg.min ? ` Para cumprir o objetivo precisa de ${precisa} min por dia.` : ""}`,
          precisa && precisa > cfg.min ? `<div class="grelha-2"><button class="btn peq prim" data-acao="ajustar-carga" data-id="${precisa}">Passar a ${precisa} min/dia</button><button class="btn peq" data-acao="novo-alvo">Mudar o objetivo</button></div>` : `<button class="btn peq" data-acao="novo-alvo">Aceitar a nova data</button>`]);
      } else if (dif < -7) av.push(["adiantado", `Vai terminar ${-dif} dias antes do objetivo (${dataPT(alvo)}). Excelente ritmo!`]);
    }
    // consistência nos últimos 7 dias
    let previsto = 0, real = 0;
    for (let i = 1; i <= 7; i++) { const d = new Date(Date.now() - i * 86400000); if (cfg.dias.includes(d.getDay())) previsto += cfg.min; real += p.tempo[window.Plano.iso(d)] || 0; }
    if (p.criado < Date.now() - 7 * 86400000 && previsto) {
      if (real > previsto * 1.3) { const sug = Math.min(240, Math.ceil(real / cfg.dias.length / 5) * 5); av.push(["mais", `Nos últimos 7 dias estudou ${horas(real)}, mais do que o plano (${horas(previsto)}).`, `<button class="btn peq prim" data-acao="ajustar-carga" data-id="${sug}">Atualizar para ${sug} min/dia</button>`]); }
      else if (real < previsto * 0.5) av.push(["menos", `Nos últimos 7 dias estudou ${horas(real)} de ${horas(previsto)} previstos. Se o plano está pesado, reduza os minutos ou os dias — mais vale pouco todos os dias do que muito de vez em quando.`]);
    }
    return av;
  }

  function formPlano(cfg, prefixo) {
    return `<div class="secao">
      <div><span class="rotulo">Quanto tempo por dia?</span><div class="chips">${[15, 20, 30, 45, 60, 90, 120].map((m) => `<button type="button" class="chip-op" aria-pressed="${cfg.min === m}" data-acao="${prefixo}-min" data-id="${m}">${horas(m)}</button>`).join("")}</div></div>
      <div><span class="rotulo">Quantas vezes por dia?</span><div class="chips">${[1, 2, 3].map((n) => `<button type="button" class="chip-op" aria-pressed="${cfg.sessoes === n}" data-acao="${prefixo}-ses" data-id="${n}">${n === 1 ? "1 sessão" : n + " sessões"}</button>`).join("")}</div>
        <p class="suave peq">${cfg.sessoes > 1 ? `${cfg.sessoes} sessões de ~${Math.round(cfg.min / cfg.sessoes)} min (${window.Plano.NOMES_SESSAO[cfg.sessoes].join(", ").toLowerCase()}).` : "Uma sessão seguida por dia."}</p></div>
      <div><span class="rotulo">Em que dias da semana? (${cfg.dias.length} por semana)</span><div class="chips">${[1, 2, 3, 4, 5, 6, 0].map((d) => `<button type="button" class="chip-op dia" aria-pressed="${cfg.dias.includes(d)}" data-acao="${prefixo}-dia" data-id="${d}">${DIAS_SEMANA[d]}</button>`).join("")}</div></div>
    </div>`;
  }
  function resumoPlano(cfg) {
    const pl = calcularPlano(cfg);
    const semanas = Math.max(1, Math.round((pl.fim - new Date()) / (7 * 86400000)));
    return `<div class="resumo-plano"><div><span class="rotulo">Por semana</span><b class="tab-num">${horas(pl.semanal)}</b></div><div><span class="rotulo">Curso que falta</span><b class="tab-num">${horas(pl.totalMin)}</b></div><div><span class="rotulo">Conclusão prevista</span><b>${dataPT(pl.fim)}</b><span class="suave peq">~${semanas} semana${semanas > 1 ? "s" : ""}</span></div></div>`;
  }
  function alternarPlano(cfg, tipo, v) {
    if (tipo === "min") cfg.min = +v;
    if (tipo === "ses") cfg.sessoes = +v;
    if (tipo === "dia") { v = +v; cfg.dias = cfg.dias.includes(v) ? cfg.dias.filter((x) => x !== v) : cfg.dias.concat(v).sort(); if (!cfg.dias.length) cfg.dias = [v]; }
  }

  TELAS.plano = function () {
    const p = P(), pl = calcularPlano(), av = avisosPlano(pl);
    const proximos = pl.dias.filter((d) => d.total > 0).slice(0, 14);
    return `<div class="secao"><h1>O meu plano de estudo</h1><p class="suave">Calculado a partir do seu progresso real. Muda sozinho quando estuda mais, menos, mais devagar ou quando as notas pedem revisão.</p></div>
      ${resumoPlano(p.plano)}
      ${p.alvo ? `<p class="suave peq">Objetivo definido: <b>${dataPT(new Date(p.alvo))}</b></p>` : ""}
      ${av.length ? `<section class="secao"><h2>Como o plano se adaptou a si</h2>${av.map(([k, t, b]) => `<div class="${k === "atraso" || k === "menos" ? "alerta" : "dica"}">${ic(k === "atraso" || k === "menos" ? "alerta" : "dica")}<div class="secao" style="gap:8px"><span>${t}</span>${b || ""}</div></div>`).join("")}</section>` : ""}
      <details class="cartao"><summary><b>Alterar tempo, sessões e dias</b></summary>${formPlano(p.plano, "pl")}</details>
      <section class="secao"><h2>Próximos dias</h2>${proximos.map((d) => `<div class="cartao plano dia-plano"><div class="linha entre"><b>${d.data === hojeISO() ? "Hoje" : DIAS_LONGOS[d.date.getDay()]}, ${d.date.toLocaleDateString("pt-PT", { day: "numeric", month: "short" })}</b><span class="chip tab-num">${Math.round(d.total)} min</span></div>
        ${d.sessoes.filter((s) => s.itens.length).map((s) => `<div class="sessao">${p.plano.sessoes > 1 ? `<span class="rotulo">${esc(s.nome)}</span>` : ""}${s.itens.map((i) => itemTarefa(i, true)).join("")}</div>`).join("")}</div>`).join("") || '<p class="suave">Nada pendente: concluiu tudo!</p>'}</section>`;
  };

  // ------------------------------------------------------------ primeiro acesso
  let ob = null;
  const GENEROS = ["Feminino", "Masculino", "Outro", "Prefiro não dizer"];
  const saudacao = (g) => g === "Feminino" ? "Bem-vinda" : g === "Masculino" ? "Bem-vindo" : "Boas-vindas";
  function iniciarOb() { const p = P(); ob = { passo: 1, nome: p.nome === "Estudante" ? "" : p.nome, idade: p.idade || "", genero: p.genero, motivos: p.motivos.slice(), experiencia: p.experiencia, plano: JSON.parse(JSON.stringify(p.plano)), livre: false, erro: "" }; }
  TELAS.boasvindas = function () {
    if (!ob) iniciarOb();
    const G = D.guia, passos = 5;
    const pontos = `<div class="passos-ob">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= ob.passo ? "on" : ""}"></i>`).join("")}</div>`;
    let c = "";
    if (ob.passo === 1) c = `<div class="ob-hero"><img class="logo" src="icons/logo.webp" alt="Curso de Redes de Computadores" width="260" height="260"><p>Aprenda redes de computadores do zero até à certificação Cisco CCNA, com aulas diárias ao seu ritmo.</p></div>
      <form data-form="ob" class="secao"><label class="rotulo" for="ob-nome">Como se chama?</label><input class="campo" id="ob-nome" maxlength="30" autocomplete="given-name" placeholder="O seu nome" value="${esc(ob.nome)}">`;
    if (ob.passo === 2) c = `<h2>${saudacao(ob.genero)}, ${esc(ob.nome)}!</h2><p class="suave">Estas informações ajudam a adaptar o curso. Ficam só neste dispositivo.</p>
      <form data-form="ob" class="secao"><label class="rotulo" for="ob-idade">Idade</label><input class="campo" id="ob-idade" type="number" inputmode="numeric" min="8" max="100" placeholder="Ex.: 22" value="${esc(ob.idade)}">
      <span class="rotulo">Género</span><div class="chips">${GENEROS.map((g) => `<button type="button" class="chip-op" aria-pressed="${ob.genero === g}" data-acao="ob-genero" data-id="${g}">${g}</button>`).join("")}</div>`;
    if (ob.passo === 3) c = `<h2>Porque quer estudar redes?</h2><p class="suave">Escolha todas as que se aplicam.</p>
      <form data-form="ob" class="secao"><div class="chips">${G.motivos.map((m, i) => `<button type="button" class="chip-op" aria-pressed="${ob.motivos.includes(m)}" data-acao="ob-motivo" data-id="${i}">${esc(m)}</button>`).join("")}</div>
      <span class="rotulo">O que já sabe?</span><div class="lista">${G.experiencia.map((e) => `<button type="button" class="item opcao-ob" aria-pressed="${ob.experiencia === e.id}" data-acao="ob-exp" data-id="${e.id}"><div class="meio"><b>${esc(e.nome)}</b><span class="suave peq">${esc(e.sugestao)}</span></div><span class="estado-ico ${ob.experiencia === e.id ? "ok" : "bloq"}">${ob.experiencia === e.id ? ic("check") : ""}</span></button>`).join("")}</div>`;
    if (ob.passo === 4) {
      const crianca = +ob.idade && +ob.idade < 15;
      c = `<h2>O seu horário de estudo</h2><p class="suave">A carga horária adapta-se a si: escolha o que consegue cumprir com regularidade.${crianca ? " Para a sua idade recomendamos sessões curtas (15–20 min)." : ""}</p>
      <form data-form="ob" class="secao">${formPlano(ob.plano, "ob")}${resumoPlano(ob.plano)}`;
    }
    if (ob.passo === 5) {
      const pl = calcularPlano(ob.plano);
      c = `<h2>Tudo pronto, ${esc(ob.nome)}!</h2>
      <div class="cartao plano"><ul class="objetivos">
        <li><b>${horas(ob.plano.min)}</b> por dia${ob.plano.sessoes > 1 ? ` em ${ob.plano.sessoes} sessões` : ""}, ${ob.plano.dias.length} dias por semana (${ob.plano.dias.map((d) => DIAS_SEMANA[d]).join(", ")}).</li>
        <li>Conclusão prevista: <b>${dataPT(pl.fim)}</b>. Fica como o seu objetivo; o plano avisa se se atrasar.</li>
        <li>Primeira aula: <b>${esc(MODS[0].licoes[0].titulo)}</b>.</li>
        <li>Motivo: ${ob.motivos.length ? esc(ob.motivos.join(", ")) : "—"}.</li></ul></div>
      <form data-form="ob" class="secao">${ob.experiencia === "algum" || ob.experiencia === "trabalho" ? `<label class="linha entre" for="ob-livre"><span><b>Modo livre</b><br><span class="suave peq">Abre todos os módulos para ir direto ao que precisa.</span></span><input type="checkbox" id="ob-livre" ${ob.livre || ob.experiencia === "trabalho" ? "checked" : ""} style="width:24px;height:24px"></label>` : ""}`;
    }
    return `<div class="onboarding">${pontos}${c}
      ${ob.erro ? `<p class="erro-campo" role="alert">${esc(ob.erro)}</p>` : ""}
      <div class="grelha-2">${ob.passo > 1 ? `<button type="button" class="btn" data-acao="ob-voltar">Voltar</button>` : "<span></span>"}<button class="btn prim" type="submit">${ob.passo === passos ? "Começar a estudar" : "Continuar"}</button></div></form></div>`;
  };
  // guarda o que já foi escrito antes de redesenhar o ecrã
  function capturarOb() { const i = $("#ob-idade"), n = $("#ob-nome"); if (i) ob.idade = i.value; if (n) ob.nome = n.value; }
  function obAvancar() {
    ob.erro = "";
    if (ob.passo === 1) { const v = $("#ob-nome").value.trim(); if (!v) { ob.erro = "Escreva o seu nome para continuar."; return render(); } ob.nome = v; }
    if (ob.passo === 2) { const v = +$("#ob-idade").value; if (!v || v < 8 || v > 100) { ob.erro = "Indique uma idade entre 8 e 100 anos."; return render(); } ob.idade = v; if (!ob.genero) { ob.erro = "Escolha uma opção de género (pode escolher “Prefiro não dizer”)."; return render(); }
      if (v < 15 && ob.plano.min > 20) ob.plano.min = 20; }
    if (ob.passo === 3) { if (!ob.motivos.length) { ob.erro = "Escolha pelo menos um motivo."; return render(); } if (!ob.experiencia) { ob.erro = "Diga-nos o que já sabe para ajustarmos o início."; return render(); } }
    if (ob.passo === 5) {
      const p = P(), lv = $("#ob-livre");
      Object.assign(p, { nome: ob.nome, idade: ob.idade, genero: ob.genero, motivos: ob.motivos, experiencia: ob.experiencia, plano: ob.plano, onboard: true });
      if (lv) S.livre = lv.checked;
      p.alvo = calcularPlano().fim.toISOString();
      guardar(); ob = null; pilha = []; rota = { tela: "inicio" }; render(); window.scrollTo(0, 0);
      toast(`${saudacao(p.genero)}, ${p.nome}!`);
      return;
    }
    ob.passo++; render(); window.scrollTo(0, 0);
  }

  // ------------------------------------------------------------ casos reais
  const casoPorId = (id) => D.casos.find((c) => c.id === id);
  function itemCaso(c) {
    const m = mod(c.modulo), aberto = moduloAberto(m), r = P().casos[c.id];
    return `<button class="item" data-acao="caso" data-id="${c.id}" ${aberto ? "" : 'aria-disabled="true"'}><div class="ico-caixa">${ic("caso")}</div>
      <div class="meio"><span class="rotulo">${esc(c.local)} · ${m.codigo}</span><b>${esc(c.titulo)}</b><span class="suave peq">Papel: ${esc(c.papel)} · ${c.etapas.length} etapas · ${esc(c.nivel)}</span></div>
      ${!aberto ? `<span class="estado-ico bloq">${ic("cadeado")}</span>` : r ? `<span class="chip ${r.melhor === 100 ? "ok" : "acc"} tab-num">${r.melhor}%</span>` : ""}</button>`;
  }
  TELAS.casos = function () {
    return `<div class="secao"><h1>Casos reais</h1><p class="suave">Situações do dia a dia de um técnico de redes: um cliente liga, há um problema, e é você quem decide. Ficam disponíveis à medida que desbloqueia os módulos.</p></div>
      <div class="lista">${D.casos.map(itemCaso).join("")}</div>`;
  };
  TELAS.caso = function () {
    const c = casoPorId(rota.id);
    const cab = `<div class="cartao caso-cab"><div class="linha"><span class="chip acc">${esc(c.local)}</span><span class="chip">Você é: ${esc(c.papel)}</span></div><h1>${esc(c.titulo)}</h1></div>`;
    if (!moduloAberto(mod(c.modulo))) return `<div class="vazio">${ic("cadeado")}<p>Desbloqueie o ${mod(c.modulo).codigo} para abrir este caso.</p></div>`;
    if (!sessao || sessao.tipo !== "caso" || sessao.origem !== c.id) {
      return `${cab}<section class="bloco"><span class="rotulo">A situação</span><div class="html">${c.historia}</div></section>
        <button class="btn prim bloco" data-acao="comecar-caso" data-id="${c.id}">${ic("play")} Resolver o caso</button>`;
    }
    if (!sessao.fim) return `${cab}<details class="cartao plano"><summary><b>Reler a situação</b></summary><div class="html" style="margin-top:8px">${c.historia}</div></details>` + telaPerguntas();
    const pct = Math.round(sessao.acertos / sessao.perguntas.length * 100);
    return `${cab}<div class="cartao resultado">${estrelas(pct)}<div class="grande tab-num">${sessao.acertos}/${sessao.perguntas.length}</div>
        ${sessao.ganho ? `<span class="chip acc">+${sessao.ganho} XP</span>` : ""}</div>
      <div class="exemplo"><span class="rotulo">Desfecho</span><p>${esc(c.desfecho)}</p></div>
      ${revisaoRespostas(sessao)}
      <div class="grelha-2"><button class="btn" data-acao="comecar-caso" data-id="${c.id}">${ic("repetir")} Repetir</button><button class="btn prim" data-acao="ir" data-tela="casos">Outros casos</button></div>`;
  };
  function fimCaso(s) {
    const r = P().casos[s.origem] || (P().casos[s.origem] = { melhor: 0 });
    const pct = Math.round(s.acertos / s.perguntas.length * 100);
    s.ganho = 0;
    if (!r.feito && pct >= 50) { s.ganho = 30; r.feito = Date.now(); }
    if (pct > r.melhor) r.melhor = pct;
    guardar();
    if (s.ganho) ganharXP(s.ganho, "caso real"); else verificarConquistas();
  }

  // ------------------------------------------------------------ glossário e protocolos
  const GLOS = {}; (D.glossario || []).forEach((t) => { GLOS[t.termo] = t; });
  const PROT = {}; (D.protocolos || []).forEach((p) => { PROT[p.id] = p; });
  const NOMES_OSI = ["", "Física", "Ligação de dados", "Rede", "Transporte", "Sessão", "Apresentação", "Aplicação"];
  function htmlTermo(t) {
    return `<dt>${esc(t.termo)}${t.extenso ? ` <span class="suave peq">— ${esc(t.extenso)}</span>` : ""}</dt><dd>${esc(t.def)}${t.exemplo ? `<br><span class="peq suave">Exemplo: ${esc(t.exemplo)}</span>` : ""}</dd>`;
  }
  function termosLicao(l) {
    const ts = (l.termos || []).map((n) => GLOS[n]).filter(Boolean);
    if (!ts.length) return "";
    return `<section class="secao" id="termos"><header><h2>Termos técnicos desta aula</h2><span class="rotulo">${ts.length} termos</span></header>
      <p class="suave peq">O que quer dizer cada palavra técnica que aparece na aula, em linguagem simples.</p>
      <details class="cartao plano"${ts.length <= 12 ? " open" : ""}><summary><b>Ver os ${ts.length} termos explicados</b></summary><dl class="gloss">${ts.map(htmlTermo).join("")}</dl></details>
      ${(l.protocolos || []).length ? `<p class="peq"><b>Protocolos desta aula:</b></p><div class="chips">${l.protocolos.map((id) => `<button class="chip-op" data-acao="protocolo" data-id="${id}">${esc(PROT[id].sigla)}</button>`).join("")}</div>` : ""}</section>`;
  }
  let filtroProt = "";
  TELAS.protocolos = function () {
    const f = filtroProt.toLowerCase();
    const lista = D.protocolos.filter((p) => !f || (p.sigla + " " + p.nome + " " + p.para_que + " " + p.portas).toLowerCase().includes(f));
    const cats = [...new Set(lista.map((p) => p.categoria))];
    return `<div class="secao"><h1>Protocolos de rede</h1><p class="suave">${D.protocolos.length} protocolos explicados: para que servem, em que camada trabalham, que portas usam, como funcionam passo a passo e os comandos para os ver ou configurar.</p></div>
      <input class="campo" id="filtro-prot" type="search" placeholder="Procurar (ex.: DHCP, 443, e-mail)" value="${esc(filtroProt)}">
      ${cats.map((c) => `<section class="secao"><h2>${esc(c)}</h2><div class="lista">${lista.filter((p) => p.categoria === c).map((p) => `<button class="item" data-acao="protocolo" data-id="${p.id}"><div class="ico-caixa mono" style="font-weight:800;font-size:.72rem">${esc(p.sigla.slice(0, 6))}</div>
        <div class="meio"><b>${esc(p.nome)}</b><span class="suave peq">Camada ${p.camada_osi} (${NOMES_OSI[p.camada_osi]}) · ${esc(p.transporte)}${p.portas && p.portas !== "—" ? " · porta " + esc(p.portas) : ""}</span></div></button>`).join("")}</div></section>`).join("") || '<p class="suave">Nenhum protocolo encontrado.</p>'}`;
  };
  POS.protocolos = function () { const f = $("#filtro-prot"); if (f) f.addEventListener("input", () => { filtroProt = f.value; const pos = f.selectionStart; render(); const n = $("#filtro-prot"); n.focus(); n.setSelectionRange(pos, pos); }); };
  TELAS.protocolo = function () {
    const p = PROT[rota.id];
    return `<article class="cab-licao"><span class="rotulo">${esc(p.categoria)}</span><h1>${esc(p.sigla)}</h1><p class="suave">${esc(p.nome)}</p>
      <div class="chips"><span class="chip">OSI ${p.camada_osi} · ${NOMES_OSI[p.camada_osi]}</span><span class="chip">TCP/IP · ${esc(p.camada_tcpip)}</span><span class="chip acc">${esc(p.transporte)}</span>${p.portas && p.portas !== "—" ? `<span class="chip">Porta ${esc(p.portas)}</span>` : ""}${p.norma ? `<span class="chip">${esc(p.norma)}</span>` : ""}</div></article>
      <section class="bloco"><h3>Para que serve</h3><p>${esc(p.para_que)}</p></section>
      <section class="bloco"><h3>Como funciona, passo a passo</h3><ol class="passos-res">${p.como_funciona.map((x) => `<li>${esc(x)}</li>`).join("")}</ol></section>
      <section class="bloco exemplo"><span class="rotulo">Exemplo real</span><p>${esc(p.exemplo)}</p></section>
      ${p.comandos.length ? `<section class="bloco"><h3>${ic("terminal")} Comandos</h3><div class="term"><ol class="passos">${p.comandos.map((c) => `<li><div class="cmdl"><span class="cm">${esc(c.cmd)}</span></div><div class="ex">${esc(c.explica)}</div></li>`).join("")}</ol></div></section>` : ""}
      ${p.seguranca ? `<div class="alerta">${ic("alerta")}<div class="html"><b>Segurança:</b> ${esc(p.seguranca)}</div></div>` : ""}`;
  };
  let filtroG = "", catG = "";
  TELAS.glossario = function () {
    const f = filtroG.toLowerCase();
    const cats = [...new Set(D.glossario.map((t) => t.categoria))].sort();
    const lista = D.glossario.filter((t) => (!catG || t.categoria === catG) && (!f || (t.termo + " " + t.extenso + " " + t.def + " " + t.variantes.join(" ")).toLowerCase().includes(f))).sort((a, b) => a.termo.localeCompare(b.termo, "pt"));
    return `<div class="secao"><h1>Glossário</h1><p class="suave">${D.glossario.length} termos técnicos explicados de forma simples, com exemplo.</p></div>
      <input class="campo" id="filtro-g" type="search" placeholder="Procurar termo (ex.: gateway, VLAN, máscara)" value="${esc(filtroG)}">
      <div class="chips" style="overflow-x:auto;flex-wrap:nowrap;padding-bottom:4px"><button class="chip-op" data-acao="cat-g" data-id="" aria-pressed="${!catG}">Todos</button>${cats.map((c) => `<button class="chip-op" data-acao="cat-g" data-id="${esc(c)}" aria-pressed="${catG === c}">${esc(c)}</button>`).join("")}</div>
      <p class="peq suave">${lista.length} termo(s)</p><dl class="gloss">${lista.map(htmlTermo).join("") || '<p class="suave">Nenhum termo encontrado.</p>'}</dl>`;
  };
  POS.glossario = function () { const f = $("#filtro-g"); if (f) f.addEventListener("input", () => { filtroG = f.value; const pos = f.selectionStart; render(); const n = $("#filtro-g"); n.focus(); n.setSelectionRange(pos, pos); }); };

  // ------------------------------------------------------------ exercícios da aula (10 obrigatórios + prática sem fim)
  function contextoEx(l) {
    return { quiz: l.quiz, termos: (l.termos || []).map((n) => GLOS[n]).filter(Boolean), protocolos: (l.protocolos || []).map((id) => PROT[id]).filter(Boolean) };
  }
  function gerarEx(l, n, vistos) {
    const ctx = contextoEx(l), out = [];
    for (let k = 0, tent = 0; k < n && tent < n * 8; tent++) {
      const ex = window.Exercicios.gerar(l.exercicios.geradores, Math.floor(Math.random() * 2 ** 31), ctx);
      if (!ex || vistos.has(ex.p)) continue;
      vistos.add(ex.p); ex.html = ex.gen !== "quiz"; out.push(ex); k++;
    }
    return out;
  }
  function iniciarExercicios(l) {
    const vistos = new Set();
    iniciarSessao({ tipo: "exercicios", origem: l.id, perguntas: gerarEx(l, 10, vistos), vistos, lote: 1,
      aoResponder: (q, ok) => {
        const r = P().exercicios[l.id] || (P().exercicios[l.id] = { feitos: 0, certos: 0 });
        const antes = r.feitos; r.feitos++; if (ok) r.certos++;
        guardar();
        if (ok) ganharXP(2, "exercício");
        if (antes < exObrig(l.id) && r.feitos >= exObrig(l.id)) { ganharXP(20, "exercícios obrigatórios"); toast("10 exercícios obrigatórios feitos!"); }
      },
      aoTerminar: () => {} });
  }
  TELAS.exercicios = function () {
    const l = LICOES[rota.lid];
    if (!sessao || sessao.tipo !== "exercicios" || sessao.origem !== l.id) iniciarExercicios(l);
    const r = P().exercicios[l.id] || { feitos: 0, certos: 0 }, ob = exObrig(l.id);
    const topo = `<span class="chip ${r.feitos >= ob ? "ok" : "warn"} tab-num">${Math.min(r.feitos, ob)}/${ob} obrigatórios</span>`;
    if (!sessao.fim) return telaPerguntas(topo);
    const ac = sessao.perguntas.slice(-10).filter((q, i) => corrigir(q, sessao.respostas[sessao.perguntas.length - 10 + i])).length;
    return `<div class="cartao resultado"><span class="rotulo">Série ${sessao.lote} concluída</span>${estrelas(ac * 10)}<div class="grande tab-num">${ac}/10</div>
        <p>${r.feitos >= ob ? "Exercícios obrigatórios desta aula: feitos ✓" : `Faltam ${ob - r.feitos} exercícios obrigatórios.`}</p>
        <p class="suave peq">Total nesta aula: ${r.feitos} exercícios, ${r.certos} certos (${r.feitos ? Math.round(r.certos / r.feitos * 100) : 0}%).</p></div>
      ${revisaoRespostas({ perguntas: sessao.perguntas.slice(-10), respostas: sessao.respostas.slice(-10) })}
      <button class="btn prim bloco" data-acao="mais-exercicios">${ic("repetir")} Continuar a praticar (+10 novos)</button>
      <div class="grelha-2"><button class="btn" data-acao="licao" data-id="${l.id}">Voltar à aula</button><button class="btn" data-acao="quiz" data-id="${l.id}">Fazer o quiz</button></div>`;
  };
  function cartaoExercicios(l) {
    const r = P().exercicios[l.id] || { feitos: 0, certos: 0 }, ob = exObrig(l.id), cad = window.Exercicios.CADERNOS.filter((c) => c.licao === l.id || l.exercicios.geradores.some((g) => c.geradores.includes(g)));
    return `<div class="cartao"><header class="linha entre"><h3>Exercícios da aula</h3><span class="chip ${r.feitos >= ob ? "ok" : "warn"} tab-num">${Math.min(r.feitos, ob)}/${ob}</span></header>
      <p class="suave peq">${ob} exercícios obrigatórios para concluir a aula. Depois pode continuar: há sempre exercícios novos, cada um com a resolução passo a passo.${r.feitos ? ` Já fez ${r.feitos} (${Math.round(r.certos / r.feitos * 100)}% certos).` : ""}</p>
      <button class="btn ${r.feitos >= ob ? "" : "prim"} bloco" data-acao="exercicios" data-id="${l.id}">${ic("calc")} ${r.feitos >= ob ? "Praticar mais" : r.feitos ? "Continuar os exercícios" : "Começar os exercícios"}</button>
      ${cad.length ? `<p class="peq">Cadernos de exercícios numerados:</p><div class="chips">${cad.slice(0, 3).map((c) => `<button class="chip-op" data-acao="caderno" data-id="${c.id}">${esc(c.titulo)} (${c.total})</button>`).join("")}</div>` : ""}</div>`;
  }

  // ------------------------------------------------------------ cadernos numerados (50 de binário, 100 de sub-redes…)
  const POR_PAG = 10;
  TELAS.cadernos = function () {
    return `<div class="secao"><h1>Cadernos de exercícios</h1><p class="suave">Exercícios numerados, sempre os mesmos para poder voltar e comparar. Cada um tem a resolução completa passo a passo. Aprenda primeiro nas aulas e depois pratique aqui.</p></div>
      <div class="lista">${window.Exercicios.CADERNOS.map((c) => { const feitos = Object.keys(P().cadernos[c.id] || {}).length, certos = Object.values(P().cadernos[c.id] || {}).filter(Boolean).length;
        return `<button class="item" data-acao="caderno" data-id="${c.id}"><div class="ico-caixa">${ic("calc")}</div><div class="meio"><b>${esc(c.titulo)} · ${c.total} exercícios</b><span class="suave peq">${esc(c.desc)}</span>
          <div class="barra"><i style="width:${feitos / c.total * 100}%"></i></div></div><span class="chip acc tab-num">${certos}/${c.total}</span></button>`; }).join("")}</div>`;
  };
  let cadEstado = {};
  TELAS.caderno = function () {
    const c = window.Exercicios.CADERNOS.find((x) => x.id === rota.id), pag = rota.pag || 0, res = P().cadernos[c.id] || {};
    const ini = pag * POR_PAG, fim = Math.min(c.total, ini + POR_PAG), npag = Math.ceil(c.total / POR_PAG);
    const certos = Object.values(res).filter(Boolean).length;
    const L = LICOES[c.licao];
    const itens = [];
    for (let n = ini + 1; n <= fim; n++) {
      const ex = window.Exercicios.doCaderno(c, n), st = cadEstado[c.id + n] || {}, feito = n in res;
      let corpo;
      if (ex.tipo === "mc") corpo = `<div class="opcoes">${ex.opcoes.map((o, i) => `<button class="opcao ${st.v != null ? (i === ex.correta ? "certa" : i === st.v ? "errada" : "") : ""}" data-acao="cad-resp" data-n="${n}" data-v="${i}" ${st.v != null ? "disabled" : ""}><span class="letra">${"ABCD"[i]}</span><span>${esc(o)}</span></button>`).join("")}</div>`;
      else if (ex.tipo === "vf") corpo = `<div class="opcoes">${[true, false].map((v) => `<button class="opcao ${st.v != null ? (v === ex.correta ? "certa" : v === st.v ? "errada" : "") : ""}" data-acao="cad-resp" data-n="${n}" data-v="${v}" ${st.v != null ? "disabled" : ""}><span class="letra">${v ? "V" : "F"}</span><span>${v ? "Verdadeiro" : "Falso"}</span></button>`).join("")}</div>`;
      else corpo = `<form data-form="cad" data-n="${n}" class="linha"><input class="campo mono" id="cad-${n}" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="resposta" value="${esc(st.v || "")}" ${st.v != null ? "disabled" : ""}>${st.v != null ? "" : '<button class="btn prim">Verificar</button>'}</form>`;
      const ok = st.v != null ? window.Exercicios.corrigir(ex, st.v) : null;
      itens.push(`<li class="cartao cad-item" id="cad-item-${n}"><div class="linha entre"><span class="rotulo tab-num">Exercício ${n}</span>${feito ? `<span class="chip ${res[n] ? "ok" : "bad"}">${res[n] ? "certo" : "errado"}</span>` : ""}</div>
        <div class="pergunta">${ex.p}</div>${ex.fig ? `<div class="fig-caixa">${ex.fig}</div>` : ""}${corpo}
        ${ok != null ? `<div class="feedback ${ok ? "ok" : "bad"}"><b>${ok ? "Certo!" : "Ainda não."}</b>${ok ? "" : `<span>Resposta: <b class="mono">${esc(ex.tipo === "mc" ? ex.opcoes[ex.correta] : ex.tipo === "vf" ? (ex.correta ? "Verdadeiro" : "Falso") : ex.respostas[0])}</b></span>`}</div>` : ""}
        <details class="resolucao" ${ok === false ? "open" : ""}><summary>Ver a resolução passo a passo</summary><div class="html">${ex.explica}</div></details></li>`);
    }
    return `<div class="secao"><h1>${esc(c.titulo)}</h1><p class="suave">${c.total} exercícios · ${certos} certos · página ${pag + 1} de ${npag}</p>
        ${L ? `<button class="btn" data-acao="licao" data-id="${L.id}">${ic("livro")} Aprender primeiro: ${esc(L.titulo)}</button>` : ""}</div>
      <ol class="lista cad-lista" start="${ini + 1}">${itens.join("")}</ol>
      <div class="grelha-2"><button class="btn" data-acao="cad-pag" data-id="${pag - 1}" ${pag ? "" : "disabled"}>← Anteriores</button><button class="btn" data-acao="cad-pag" data-id="${pag + 1}" ${pag + 1 < npag ? "" : "disabled"}>Seguintes →</button></div>
      <div class="chips">${Array.from({ length: npag }, (_, k) => `<button class="chip-op" data-acao="cad-pag" data-id="${k}" aria-pressed="${k === pag}">${k * POR_PAG + 1}–${Math.min(c.total, (k + 1) * POR_PAG)}</button>`).join("")}</div>`;
  };
  function respostaCaderno(n, v) {
    const c = window.Exercicios.CADERNOS.find((x) => x.id === rota.id), ex = window.Exercicios.doCaderno(c, n);
    cadEstado[c.id + n] = { v };
    const ok = window.Exercicios.corrigir(ex, v), res = P().cadernos[c.id] || (P().cadernos[c.id] = {});
    const primeira = !(n in res);
    if (primeira || ok) res[n] = ok;
    guardar();
    if (ok && primeira) ganharXP(3, "caderno"); else render();
    const el = $("#cad-item-" + n); if (el) el.scrollIntoView({ block: "nearest" });
  }

  // ------------------------------------------------------------ estágio profissional
  const notaEstagio = (mid) => (P().estagios[mid] || {}).melhor;
  TELAS.estagio = function () {
    const m = mod(rota.mid), e = m.estagio, emp = D.empresas[e.empresa], r = P().estagios[m.id] || {};
    const fase = rota.fase || "inicio";
    const cab = `<div class="cartao empresa"><span class="rotulo">Estágio profissional · ${esc(m.codigo)}</span><h1>${esc(emp.nome)}</h1>
      <p class="suave">${esc(emp.setor)} · ${emp.pessoas} pessoas</p><p>${esc(emp.descricao)}</p><p class="peq"><b>Rede:</b> ${esc(emp.rede)}</p></div>`;
    if (fase === "inicio") return cab + `<section class="secao"><h2>Como funciona</h2><ol class="passos-res"><li><b>Com o instrutor:</b> acompanha o técnico sénior a resolver um ticket real, passo a passo, e percebe porquê.</li><li><b>Sozinho:</b> recebe ${e.tarefas.length} tickets e resolve-os sem ajuda (há dicas se precisar).</li><li><b>Nota de estágio</b> de 0 a 20. Aprovado com 10 ou mais. Pode repetir para melhorar.</li></ol>
      ${r.melhor != null ? `<p>Melhor nota: <b class="tab-num">${r.melhor}/20</b> ${r.melhor >= 10 ? '<span class="chip ok">Aprovado</span>' : '<span class="chip bad">Repetir</span>'}</p>` : ""}</section>
      <button class="btn prim bloco" data-acao="estagio-fase" data-id="instrutor">${ic("play")} Começar com o instrutor</button>
      ${r.instrutor ? `<button class="btn bloco" data-acao="estagio-fase" data-id="tarefas">Ir direto às tarefas</button>` : ""}`;
    if (fase === "instrutor") {
      const k = rota.passo || 0, t = e.instrutor;
      return `<div class="cartao ticket"><span class="rotulo">Ticket aberto</span><h2>${esc(t.titulo)}</h2><p class="citacao">“${esc(t.pedido)}”</p></div>
        <section class="secao"><h2>O instrutor resolve, passo a passo</h2><ol class="instrutor">${t.passos.slice(0, k + 1).map((p, i) => `<li class="cartao ${i === k ? "atual" : ""}"><span class="rotulo">Passo ${i + 1} de ${t.passos.length}</span><b>${esc(p.acao)}</b>${p.cmd ? `<div class="term"><pre>${esc(p.cmd)}</pre></div>` : ""}<p class="suave">${esc(p.explica)}</p></li>`).join("")}</ol></section>
        ${k + 1 < t.passos.length ? `<button class="btn prim bloco" data-acao="estagio-passo" data-id="${k + 1}">Próximo passo →</button>` :
          `<div class="dica">${ic("dica")}<div class="html"><b>Lição do instrutor:</b> ${esc(t.licao)}</div></div><button class="btn prim bloco" data-acao="estagio-fase" data-id="tarefas">Agora é a sua vez: ${e.tarefas.length} tickets →</button>`}`;
    }
    if (!sessao || sessao.tipo !== "estagio" || sessao.origem !== m.id) {
      iniciarSessao({ tipo: "estagio", origem: m.id, perguntas: e.tarefas.map((t, i) => Object.assign({}, t.pergunta, { html: true,
        p: `<span class="rotulo">Ticket ${i + 1} de ${e.tarefas.length}</span><b>${esc(t.titulo)}</b><p class="citacao">${esc(t.pedido)}</p><p>${esc(t.pergunta.p)}</p>${t.dica ? `<details><summary class="peq">Pedir uma dica ao instrutor</summary><p class="peq">${esc(t.dica)}</p></details>` : ""}`,
        explica: esc(t.pergunta.explica) })), aoTerminar: fimEstagio });
    }
    if (!sessao.fim) return `<p class="peq suave">${esc(emp.nome)} · resolva sozinho</p>` + telaPerguntas();
    const nota = sessao.nota;
    return `<div class="cartao resultado"><span class="rotulo">Nota de estágio · ${esc(emp.nome)}</span><div class="grande tab-num">${nota}/20</div>
        <span class="chip ${nota >= 10 ? "ok" : "bad"}">${nota >= 18 ? "Excelente" : nota >= 14 ? "Muito bom" : nota >= 10 ? "Aprovado" : "Não aprovado"}</span>
        <p>${sessao.acertos} de ${sessao.perguntas.length} tickets resolvidos. ${nota >= 10 ? "O instrutor assinou a avaliação do estágio deste módulo." : "Reveja as aulas e repita: o instrutor dá-lhe outra oportunidade."}</p>${sessao.ganho ? `<span class="chip acc">+${sessao.ganho} XP</span>` : ""}</div>
      ${revisaoRespostas(sessao)}
      <div class="grelha-2"><button class="btn" data-acao="estagio-repetir" data-id="${m.id}">${ic("repetir")} Repetir tarefas</button><button class="btn" data-acao="modulo" data-id="${m.id}">Voltar ao módulo</button></div>`;
  };
  function fimEstagio(s) {
    const r = P().estagios[s.origem] || (P().estagios[s.origem] = {});
    s.nota = Math.round(s.acertos / s.perguntas.length * 20);
    const antes = r.melhor == null ? -1 : r.melhor;
    r.ultima = s.nota; r.quando = Date.now();
    s.ganho = 0;
    if (s.nota > antes) { r.melhor = s.nota; s.ganho = Math.max(0, s.nota - Math.max(0, antes)) * 3; }
    guardar(); if (s.ganho) ganharXP(s.ganho, "estágio"); else verificarConquistas();
  }

  // ------------------------------------------------------------ sala de laboratório (equipamento físico)
  TELAS.sala = function () {
    const L = window.Laboratorio;
    return `<div class="secao"><h1>Sala de laboratório</h1><p class="suave">Aqui está na sala com o equipamento à frente: escolhe o cabo, liga-o na porta certa, liga a corrente, olha para as luzes, liga o cabo de consola e abre o PuTTY, configura a placa de rede do Windows, testa cabos e partilha pastas. É a parte física que o simulador lógico não mostra.</p></div>
      <div class="lista">${L.BANCADAS.map((b, i) => { const r = P().salaLab[b.id] || {}, m = mod(b.modulo);
        return `<button class="item" data-acao="bancada" data-id="${b.id}"><span class="estado-ico ${r.feito ? "ok" : "atual"}">${r.feito ? ic("check") : i + 1}</span><div class="meio"><span class="rotulo">${m ? esc(m.codigo) + " · " : ""}${esc(b.nivel)} · ${b.passos.length} passos</span><b>${esc(b.titulo)}</b><span class="suave peq">${esc(b.cenario)}</span></div>${!r.feito && r.passos ? `<span class="chip acc tab-num">${r.passos}/${b.passos.length}</span>` : ""}</button>`; }).join("")}</div>`;
  };
  TELAS.bancada = function () { const b = window.Laboratorio.BANCADAS.find((x) => x.id === rota.id); return `<div class="secao"><span class="rotulo">Sala de laboratório</span><h1>${esc(b.titulo)}</h1></div><div id="lb-raiz"></div>`; };
  POS.bancada = function () {
    const b = window.Laboratorio.BANCADAS.find((x) => x.id === rota.id), reg = () => P().salaLab[b.id] || (P().salaLab[b.id] = {});
    const lb = window.Laboratorio.montar($("#lb-raiz"), b, {
      estado: reg().estado || null,
      aoGuardar: (e) => { reg().estado = e; guardar(); },
      aoProgresso: (n) => { if (n > (reg().passos || 0)) { reg().passos = n; guardar(); } },
      aoConcluir: () => { if (!reg().feito) { reg().feito = Date.now(); guardar(); ganharXP(40, "bancada do laboratório"); } },
    });
    limpar = () => lb.parar();
  };

  // ------------------------------------------------------------ simulador de rede
  function itemSim(a) {
    const m = mod(a.modulo), ab = moduloAberto(m), r = P().sims[a.id];
    return `<button class="item" data-acao="sim" data-id="${a.id}" ${ab ? "" : 'aria-disabled="true"'}><div class="ico-caixa">${F.icone("switch", 34)}</div>
      <div class="meio"><span class="rotulo">${esc(m.codigo)} · ${esc(a.nivel)} · ${a.passos.length} passos</span><b>${esc(a.titulo)}</b><span class="suave peq">${esc(a.cenario)}</span></div>
      ${!ab ? `<span class="estado-ico bloq">${ic("cadeado")}</span>` : r && r.feito ? `<span class="estado-ico ok">${ic("check")}</span>` : r && r.passos ? `<span class="chip acc tab-num">${r.passos}/${a.passos.length}</span>` : ""}</button>`;
  }
  TELAS.sims = function () {
    return `<div class="secao"><h1>Simulador de rede</h1><p class="suave">Monte redes como no Cisco Packet Tracer, aqui dentro: equipamentos, cabos, configuração no terminal Cisco, IP nos PCs, ping e tracert. Cada atividade tem passos guiados que se verificam sozinhos.</p></div>
      ${htmlProjetos()}
      <h2>Atividades guiadas</h2><div class="lista">${D.atividades.map(itemSim).join("")}</div>`;
  };
  // ------------------------------------------------------------ projetos do simulador (com nome, para continuar depois)
  let msgProj = "";
  const dataHora = (t) => new Date(t).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  function htmlProjetos() {
    const ps = Object.entries(P().projetos).sort((a, b) => b[1].alterado - a[1].alterado);
    return `<div class="cartao"><h2>Os meus projetos</h2><p class="peq suave">Cada projeto guarda a rede inteira (equipamentos, cabos e configurações) automaticamente, no telemóvel. Pode fechar a app e continuar depois.</p>
      <form data-form="novo-projeto" class="linha"><input class="campo" id="proj-nome" placeholder="Nome do projeto (ex.: Rede da escola)" maxlength="60" autocomplete="off" aria-label="Nome do projeto"><button class="btn prim">Criar</button></form>
      ${ps.length ? `<div class="lista">${ps.map(([id, x]) => `<div class="item proj"><div class="ico-caixa">${F.icone("switch", 30)}</div>
        <div class="meio"><b>${esc(x.nome)}</b><span class="suave peq">${x.estado ? x.estado.devs.length : 0} equipamentos · ${x.estado ? x.estado.links.length : 0} cabos · alterado ${dataHora(x.alterado)}</span>
        <div class="chips"><button class="chip-op" data-acao="proj-abrir" data-id="${id}">Abrir</button><button class="chip-op" data-acao="proj-renomear" data-id="${id}">Renomear</button><button class="chip-op" data-acao="proj-duplicar" data-id="${id}">Duplicar</button><button class="chip-op" data-acao="proj-exportar" data-id="${id}">Exportar</button><button class="chip-op" data-acao="proj-apagar" data-id="${id}">${projApagar === id ? "Confirmar apagar" : "Apagar"}</button></div></div></div>`).join("")}</div>` : '<p class="peq">Ainda não tem projetos.</p>'}
      <details><summary class="peq">Importar um projeto (código ou ficheiro)</summary><div class="secao"><textarea class="campo mono" id="proj-import" rows="3" placeholder="Cole aqui o código de um projeto exportado"></textarea>
        <div class="grelha-2"><button class="btn" data-acao="proj-importar">Importar código</button><label class="btn">Abrir ficheiro<input type="file" accept=".json,application/json" id="proj-ficheiro" hidden></label></div>${msgProj ? `<p class="peq">${esc(msgProj)}</p>` : ""}</div></details></div>`;
  }
  let projApagar = null;
  function novoProjeto(nome, estado) {
    const id = "pr" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
    P().projetos[id] = { nome: nome.slice(0, 60), criado: Date.now(), alterado: Date.now(), estado: estado || null };
    guardar(); return id;
  }
  function importarProjeto(txt) {
    try {
      let j; try { j = JSON.parse(txt); } catch (e) { j = JSON.parse(decodeURIComponent(escape(atob(txt.trim())))); }
      if (!j || !j.estado || !Array.isArray(j.estado.devs)) throw new Error("formato");
      window.Simulador.Rede.importar(j.estado);
      novoProjeto((j.nome || "Projeto importado") + "", j.estado); msgProj = "Projeto importado: " + (j.nome || ""); toast("Projeto importado");
    } catch (e) { msgProj = "Não foi possível importar: o código está incompleto ou não é de um projeto."; }
    render();
  }
  document.addEventListener("change", (e) => {
    if (e.target.id !== "proj-ficheiro" || !e.target.files[0]) return;
    const fr = new FileReader(); fr.onload = () => importarProjeto(String(fr.result)); fr.readAsText(e.target.files[0]);
  });

  let simLeitor = null;
  TELAS.sim = function () {
    if (rota.proj) { const x = P().projetos[rota.proj]; return `<div class="secao"><span class="rotulo">Projeto · guardado automaticamente</span><h1>${esc(x ? x.nome : "Projeto")}</h1><p class="peq suave" id="proj-guardado">${x ? "Última alteração: " + dataHora(x.alterado) : ""}</p></div><div id="sim-raiz"></div>`; }
    const a = rota.id === "livre" ? null : ativPorId(rota.id);
    return `${a ? `<div class="secao"><span class="rotulo">${esc(mod(a.modulo).codigo)} · prática guiada</span><h1>${esc(a.titulo)}</h1></div>` : '<div class="secao"><h1>Modo livre</h1></div>'}<div id="sim-raiz"></div>`;
  };
  POS.sim = function () {
    if (rota.proj) {
      const id = rota.proj, x = P().projetos[id]; if (!x) return;
      simLeitor = window.SimUI.montar($("#sim-raiz"), {
        atividade: null, estado: x.estado,
        aoGuardar: (e) => { const y = P().projetos[id]; if (!y) return; y.estado = e; y.alterado = Date.now(); guardar(); const el = $("#proj-guardado"); if (el) el.textContent = "Guardado às " + new Date(y.alterado).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit", second: "2-digit" }); },
      });
      limpar = () => { if (simLeitor) simLeitor.parar(); simLeitor = null; };
      return;
    }
    const a = rota.id === "livre" ? null : ativPorId(rota.id);
    const chave = a ? a.id : "livre", st = P().sims[chave] || {};
    simLeitor = window.SimUI.montar($("#sim-raiz"), {
      atividade: a, estado: st.estado || null,
      aoGuardar: (e) => { const r = P().sims[chave] || (P().sims[chave] = {}); r.estado = e; guardar(); },
      aoProgresso: (n) => { const r = P().sims[chave] || (P().sims[chave] = {}); if (n > (r.passos || 0)) { r.passos = n; guardar(); } },
      aoConcluir: () => { const r = P().sims[chave] || (P().sims[chave] = {}); if (!r.feito) { r.feito = Date.now(); guardar(); ganharXP(60, "simulador"); } },
    });
    limpar = () => { if (simLeitor) simLeitor.parar(); simLeitor = null; };
  };

  // ------------------------------------------------------------ jogo: montar o cabo
  const FIOS = { bl: "Branco-laranja", l: "Laranja", bv: "Branco-verde", v: "Verde", baz: "Branco-azul", az: "Azul", bc: "Branco-castanho", c: "Castanho" };
  const NORMAS = { T568B: ["bl", "l", "bv", "az", "baz", "v", "bc", "c"], T568A: ["bv", "v", "bl", "az", "baz", "l", "bc", "c"] };
  let jogoCabo = { norma: null, pinos: [], res: null };
  function htmlJogoCabo(norma) {
    if (jogoCabo.norma !== norma) jogoCabo = { norma, pinos: [], res: null };
    const usados = new Set(jogoCabo.pinos), certos = NORMAS[norma];
    return `<div class="jogo-cabo" data-norma="${norma}"><div class="linha entre"><b>Monte o conector ${norma}</b><span class="abas"><button data-acao="cabo-norma" data-id="T568B" aria-selected="${norma === "T568B"}">T568B</button><button data-acao="cabo-norma" data-id="T568A" aria-selected="${norma === "T568A"}">T568A</button></span></div>
      <p class="peq suave">Toque nos fios pela ordem do pino 1 ao 8 (patilha do conector para baixo). Toque num pino para o tirar.</p>
      <div class="rj45-jogo">${[0, 1, 2, 3, 4, 5, 6, 7].map((k) => { const f = jogoCabo.pinos[k]; const st = jogoCabo.res ? (f === certos[k] ? "certo" : "errado") : "";
        return `<button class="pino ${st}" data-acao="cabo-tirar" data-id="${k}" aria-label="Pino ${k + 1}: ${f ? FIOS[f] : "vazio"}"><span class="fio fio-${f || "vazio"}"></span><small>${k + 1}</small></button>`; }).join("")}</div>
      <div class="fios">${Object.keys(FIOS).map((f) => `<button class="fio-btn" data-acao="cabo-por" data-id="${f}" ${usados.has(f) || jogoCabo.pinos.length >= 8 ? "disabled" : ""}><span class="fio fio-${f}"></span>${FIOS[f]}</button>`).join("")}</div>
      ${jogoCabo.res ? `<div class="feedback ${jogoCabo.res === "ok" ? "ok" : "bad"}"><b>${jogoCabo.res === "ok" ? "Cabo perfeito! O testador acende 1 a 8 pela ordem." : "Há fios trocados (a vermelho)."}</b><span>${norma}: ${certos.map((f) => FIOS[f]).join(", ")}.</span></div>` : ""}
      <div class="grelha-2"><button class="btn" data-acao="cabo-limpar">Recomeçar</button><button class="btn prim" data-acao="cabo-testar" ${jogoCabo.pinos.length < 8 ? "disabled" : ""}>Testar o cabo</button></div></div>`;
  }
  function redesenharJogo() { const el = $(".jogo-cabo"); if (el) el.outerHTML = htmlJogoCabo(el.dataset.norma); }

  // ------------------------------------------------------------ tempo de estudo
  let ultimaInteracao = Date.now();
  ["click", "keydown", "scroll", "touchstart"].forEach((ev) => document.addEventListener(ev, () => { ultimaInteracao = Date.now(); }, { passive: true }));
  const TELAS_ESTUDO = ["exercicios", "estagio", "caderno", "bancada", "sim", "licao", "quiz", "prova", "lab", "caso", "revisao", "relampago", "subrede", "modulo"];
  setInterval(() => {
    if (document.visibilityState !== "visible" || Date.now() - ultimaInteracao > 120000 || !TELAS_ESTUDO.includes(rota.tela) || !P().onboard) return;
    const p = P(), h = hojeISO();
    p.tempo[h] = (p.tempo[h] || 0) + 0.25;
    if (rota.lid) p.tempoLicao[rota.lid] = (p.tempoLicao[rota.lid] || 0) + 0.25;
    if (Math.round(p.tempo[h] * 4) % 4 === 0) { marcarDia(); guardar(); }
  }, 15000);

  // --- perfil
  let confirmarApagar = false, msgImport = "";
  TELAS.perfil = function () {
    const p = P();
    return `<div class="cartao"><span class="rotulo">Perfil ativo</span>
        <form data-form="nome" class="linha"><span class="avatar" style="background:${p.cor}">${esc(p.nome.slice(0, 1).toUpperCase())}</span>
          <input class="campo" id="nome-perfil" style="flex:1;min-width:0" value="${esc(p.nome)}" maxlength="30" aria-label="Nome"><button class="btn" type="submit">Guardar</button></form>
        <p class="suave peq tab-num">${p.xp} XP · ${esc(nivel(p.xp).nome)} · desde ${new Date(p.criado).toLocaleDateString("pt-PT")}</p></div>
      <div class="cartao"><span class="rotulo">Os seus dados</span>
        <form data-form="dados" class="linha"><label for="p-idade" style="flex:1">Idade</label><input class="campo" id="p-idade" type="number" min="8" max="100" style="width:110px" value="${esc(p.idade || "")}"><button class="btn" type="submit">Guardar</button></form>
        <span class="rotulo">Género</span><div class="chips">${GENEROS.map((g) => `<button class="chip-op" aria-pressed="${p.genero === g}" data-acao="p-genero" data-id="${g}">${g}</button>`).join("")}</div>
        <span class="rotulo">Motivos para estudar</span><div class="chips">${D.guia.motivos.map((m, i) => `<button class="chip-op" aria-pressed="${p.motivos.includes(m)}" data-acao="p-motivo" data-id="${i}">${esc(m)}</button>`).join("")}</div>
        <div class="grelha-2"><button class="btn" data-acao="ir" data-tela="plano">${ic("calendario")} Plano de estudo</button><button class="btn" data-acao="ob-refazer">Refazer questionário</button></div></div>
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
      <div class="cartao plano"><span class="rotulo">Sobre</span><img class="logo" src="icons/logo.webp" alt="Curso de Redes de Computadores" width="160" height="160" style="justify-self:center"><p class="peq">${D.modulos.length} módulos, ${Object.keys(LICOES).length} lições, ${D.labs.length} laboratórios. Conteúdo escrito em Python (pasta <code>ccna/conteudo</code>) e gerado com <code>python build.py</code>. Cisco, CCNA, Catalyst e Packet Tracer são marcas da Cisco Systems; esta app é material de estudo independente.</p></div>`;
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
    bancada: (el) => ir("bancada", { id: el.dataset.id }),
    "proj-abrir": (el) => ir("sim", { proj: el.dataset.id }),
    exercicios: (el) => { if (!sessao || sessao.tipo !== "exercicios" || sessao.origem !== el.dataset.id) sessao = null; ir("exercicios", { lid: el.dataset.id }); },
    "mais-exercicios": () => { const l = LICOES[rota.lid]; const novos = gerarEx(l, 10, sessao.vistos).map(prepararPergunta); sessao.perguntas = sessao.perguntas.concat(novos); sessao.fim = false; sessao.lote++; render(); window.scrollTo(0, 0); },
    protocolo: (el) => ir("protocolo", { id: el.dataset.id }),
    "cat-g": (el) => { catG = el.dataset.id; render(); },
    caderno: (el) => ir("caderno", { id: el.dataset.id, pag: 0 }),
    "cad-pag": (el) => { rota.pag = +el.dataset.id; render(); window.scrollTo(0, 0); },
    "cad-resp": (el) => respostaCaderno(+el.dataset.n, el.dataset.v === "true" ? true : el.dataset.v === "false" ? false : +el.dataset.v),
    estagio: (el) => { sessao = null; ir("estagio", { mid: el.dataset.id, fase: "inicio" }); },
    "estagio-fase": (el) => { if (el.dataset.id === "tarefas") { sessao = null; const r = P().estagios[rota.mid] || (P().estagios[rota.mid] = {}); r.instrutor = true; guardar(); } rota.fase = el.dataset.id; rota.passo = 0; render(); window.scrollTo(0, 0); },
    "estagio-passo": (el) => { rota.passo = +el.dataset.id; render(); const li = document.querySelector(".instrutor li.atual"); if (li) li.scrollIntoView({ block: "start", behavior: "smooth" }); },
    "estagio-repetir": () => { sessao = null; render(); window.scrollTo(0, 0); },
    "proj-renomear": (el) => { const x = P().projetos[el.dataset.id]; const inp = $("#proj-nome"); if (inp && inp.value.trim()) { x.nome = inp.value.trim().slice(0, 60); inp.value = ""; guardar(); render(); toast("Projeto renomeado"); } else { toast("Escreva o novo nome na caixa de cima e toque em Renomear"); if (inp) { inp.value = x.nome; inp.focus(); } } },
    "proj-duplicar": (el) => { const x = P().projetos[el.dataset.id]; novoProjeto(x.nome + " (cópia)", x.estado ? JSON.parse(JSON.stringify(x.estado)) : null); render(); toast("Projeto duplicado"); },
    "proj-apagar": (el) => { const id = el.dataset.id; if (projApagar !== id) { projApagar = id; render(); return; } delete P().projetos[id]; projApagar = null; guardar(); render(); toast("Projeto apagado"); },
    "proj-exportar": (el) => {
      const x = P().projetos[el.dataset.id], txt = JSON.stringify({ tipo: "ccna-projeto", nome: x.nome, estado: x.estado });
      try { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([txt], { type: "application/json" })); a.download = x.nome.replace(/[^\w\- ]+/g, "_") + ".json"; document.body.appendChild(a); a.click(); a.remove(); } catch (e) { /* sem transferências */ }
      copiar(btoa(unescape(encodeURIComponent(txt))), $("#proj-import"));
    },
    "proj-importar": () => importarProjeto(($("#proj-import") || {}).value || ""),
    ir: (el) => { if (el.dataset.tela === "relampago" || el.dataset.tela === "revisao") sessao = null; if (el.dataset.tela === "subrede") sub = null; ir(el.dataset.tela); },
    modulo: (el) => { if (el.getAttribute("aria-disabled") === "true") return toast("Módulo bloqueado"); ir("modulo", { mid: el.dataset.id }); },
    licao: (el) => { if (el.getAttribute("aria-disabled") === "true") return toast("Conclua a lição anterior primeiro"); ir("licao", { lid: el.dataset.id }); },
    repetir: (el) => { const r = P().licoes[el.dataset.id]; if (r) r.repeticoes = (r.repeticoes || 0) + 1; P().reforcos[el.dataset.id] = Date.now(); guardar(); sessao = null; window.scrollTo({ top: 0, behavior: "smooth" }); toast("Boa revisão! Leia de novo e refaça o quiz."); },
    quiz: (el) => { sessao = null; ir("quiz", { lid: el.dataset.id }); },
    "refazer-quiz": (el) => { sessao = null; ir("quiz", { lid: el.dataset.id }, true); },
    prova: (el) => { if (el.getAttribute("aria-disabled") === "true") return toast("Conclua as lições do módulo primeiro"); sessao = null; ir("prova", { mid: el.dataset.id }); },
    "comecar-prova": (el) => {
      const m = mod(el.dataset.id);
      const todas = m.licoes.flatMap((l) => l.quiz).concat(m.prova_extra);
      const n = Math.min(15, todas.length);
      // + 5 exercícios gerados (cálculos, termos, protocolos) das aulas do módulo
      const vistos = new Set(), gerados = [];
      for (let k = 0; k < 40 && gerados.length < 5; k++) { const l = m.licoes[k % m.licoes.length]; const ex = gerarEx(l, 1, vistos).find((x) => x.gen !== "quiz"); if (ex) gerados.push(ex); }
      const lista = embaralhar(embaralhar(todas).slice(0, n).concat(gerados));
      iniciarSessao({ tipo: "prova", origem: m.id, perguntas: lista, feedback: false, limite: lista.length * 60000 + gerados.length * 60000, aoTerminar: fimProva });
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
    sim: (el) => { if (el.getAttribute("aria-disabled") === "true") return toast("Desbloqueie o módulo desta prática primeiro"); ir("sim", { id: el.dataset.id }); },
    "trilha-curso": (el) => ir("trilha", { curso: el.dataset.id }),
    "ficha-feita": (el) => { if (!P().fichas[el.dataset.id]) { P().fichas[el.dataset.id] = Date.now(); guardar(); ganharXP(15, "ficha de trabalho"); } render(); setTimeout(() => { const f = $("#ficha"); if (f) f.scrollIntoView(); }, 30); },
    "cabo-norma": (el) => { const j = $(".jogo-cabo"); jogoCabo = { norma: el.dataset.id, pinos: [], res: null }; if (j) j.outerHTML = htmlJogoCabo(el.dataset.id); },
    "cabo-por": (el) => { if (jogoCabo.pinos.length < 8 && !jogoCabo.pinos.includes(el.dataset.id)) jogoCabo.pinos.push(el.dataset.id); jogoCabo.res = null; redesenharJogo(); },
    "cabo-tirar": (el) => { jogoCabo.pinos.splice(+el.dataset.id, 1); jogoCabo.res = null; redesenharJogo(); },
    "cabo-limpar": () => { jogoCabo.pinos = []; jogoCabo.res = null; redesenharJogo(); },
    "cabo-testar": () => { const ok = jogoCabo.pinos.every((f, k) => f === NORMAS[jogoCabo.norma][k]); jogoCabo.res = ok ? "ok" : "mal"; redesenharJogo(); if (ok) { P().caboJogo = (P().caboJogo || 0) + 1; guardar(); if (P().caboJogo === 1) ganharXP(15, "cabo crimpado"); else verificarConquistas(); } },
    caso: (el) => { if (el.getAttribute("aria-disabled") === "true") return toast("Desbloqueie o módulo deste caso primeiro"); sessao = null; ir("caso", { id: el.dataset.id }); },
    "comecar-caso": (el) => { const c = casoPorId(el.dataset.id); iniciarSessao({ tipo: "caso", origem: c.id, perguntas: c.etapas, aoTerminar: fimCaso }); render(); window.scrollTo(0, 0); },
    "ob-voltar": () => { capturarOb(); ob.passo--; ob.erro = ""; render(); },
    "ob-genero": (el) => { capturarOb(); ob.genero = el.dataset.id; render(); },
    "ob-motivo": (el) => { const m = D.guia.motivos[+el.dataset.id]; ob.motivos = ob.motivos.includes(m) ? ob.motivos.filter((x) => x !== m) : ob.motivos.concat(m); render(); },
    "ob-exp": (el) => { ob.experiencia = el.dataset.id; render(); },
    "ob-min": (el) => { alternarPlano(ob.plano, "min", el.dataset.id); render(); },
    "ob-ses": (el) => { alternarPlano(ob.plano, "ses", el.dataset.id); render(); },
    "ob-dia": (el) => { alternarPlano(ob.plano, "dia", el.dataset.id); render(); },
    "pl-min": (el) => { alternarPlano(P().plano, "min", el.dataset.id); guardar(); render(); abrirDetalhes(); },
    "pl-ses": (el) => { alternarPlano(P().plano, "ses", el.dataset.id); guardar(); render(); abrirDetalhes(); },
    "pl-dia": (el) => { alternarPlano(P().plano, "dia", el.dataset.id); guardar(); render(); abrirDetalhes(); },
    "ajustar-carga": (el) => { P().plano.min = +el.dataset.id; guardar(); render(); toast(`Plano atualizado: ${horas(+el.dataset.id)} por dia`); },
    "novo-alvo": () => { P().alvo = calcularPlano().fim.toISOString(); guardar(); render(); toast("Novo objetivo definido"); },
    "p-genero": (el) => { P().genero = el.dataset.id; guardar(); render(); },
    "p-motivo": (el) => { const m = D.guia.motivos[+el.dataset.id], p = P(); p.motivos = p.motivos.includes(m) ? p.motivos.filter((x) => x !== m) : p.motivos.concat(m); guardar(); render(); },
    "ob-refazer": () => { P().onboard = false; ob = null; guardar(); render(); },
    "copiar-cli": (el) => { const cmds = [...el.closest(".term").querySelectorAll("li")].filter((li) => /[#>]$/.test(li.querySelector(".pr").textContent.trim())).map((li) => li.querySelector(".cm").textContent); copiar(cmds.join("\n")); },
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
  function abrirDetalhes() { const d = document.querySelector("details.cartao"); if (d) d.open = true; }
  document.addEventListener("submit", (e) => {
    const f = e.target.dataset.form; if (!f) return;
    e.preventDefault();
    if (f === "ob") return obAvancar();
    if (f === "dados") {
      const p = P(), idade = +$("#p-idade").value;
      if (idade >= 8 && idade <= 100) p.idade = idade;
      guardar(); render(); toast("Dados guardados"); return;
    }
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
    if (f === "cad") { const n = +e.target.dataset.n, v = $("#cad-" + n).value; if (!v.trim()) return; respostaCaderno(n, v); return; }
    if (f === "novo-projeto") { const v = $("#proj-nome").value.trim() || "Projeto " + (Object.keys(P().projetos).length + 1); const id = novoProjeto(v); ir("sim", { proj: id }); return; }
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
  conferirCopia();
  if ("serviceWorker" in navigator && location.protocol.startsWith("http") && !/claudeusercontent|claude\.ai/.test(location.host)) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
