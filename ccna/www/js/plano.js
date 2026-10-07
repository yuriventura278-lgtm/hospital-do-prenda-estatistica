/* Plano de estudo adaptativo.
   Gera a lista de tarefas que faltam (aulas, prática, quiz, laboratórios, casos,
   revisões e provas) e distribui-as pelos dias e sessões escolhidos pelo aluno.
   O plano é recalculado sempre a partir do progresso real, por isso adapta-se:
   - ao ritmo (tempo real gasto por aula),
   - às notas (aulas com nota fraca ganham revisão),
   - aos erros acumulados (revisão do caderno),
   - aos dias em que não estudou (tudo é empurrado e a data prevista é atualizada). */
(function () {
  "use strict";

  const DIA_MS = 86400000;
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const NOMES_SESSAO = { 1: ["Sessão do dia"], 2: ["Manhã", "Noite"], 3: ["Manhã", "Tarde", "Noite"] };

  // Ritmo pessoal: tempo real ÷ tempo previsto nas aulas já concluídas.
  function ritmo(ctx) {
    const amostras = [];
    ctx.modulos.forEach((m) => m.licoes.forEach((l) => {
      const t = ctx.tempoLicao[l.id];
      if (ctx.licaoFeita(l.id) && t >= 2) amostras.push(t / (l.minutos + l.quiz.length));
    }));
    const ult = amostras.slice(-8);
    if (ult.length < 3) return { fator: 1, amostras: ult.length };
    const media = ult.reduce((a, b) => a + b, 0) / ult.length;
    return { fator: Math.min(1.8, Math.max(0.6, media)), amostras: ult.length };
  }

  function tarefas(ctx, fator) {
    const lista = [];
    if (ctx.erros >= 5) lista.push({ tipo: "erros", titulo: `Caderno de erros (${ctx.erros} perguntas)`, min: 10 });
    ctx.modulos.forEach((m) => {
      m.licoes.forEach((l) => {
        if (!ctx.licaoFeita(l.id)) {
          lista.push({ tipo: "aula", l, m, titulo: "Vídeo-aula e leitura: " + l.titulo, min: Math.max(5, Math.round((Math.max(l.minutos, Math.ceil((l.video ? l.video.segundos : 0) / 60)) + 3) * fator)) });
          if (l.blocos.some((b) => b.tipo === "cli")) lista.push({ tipo: "pratica", l, m, titulo: "Praticar os comandos de “" + l.titulo + "”", min: 10 });
          lista.push({ tipo: "quiz", l, m, titulo: "Quiz: " + l.titulo, min: Math.ceil(l.quiz.length * 1.2) });
        } else if (ctx.nota(l.id) < 85 && !ctx.reforcado(l.id)) {
          lista.push({ tipo: "rever", l, m, titulo: "Rever: " + l.titulo + ` (nota ${ctx.nota(l.id)}%)`, min: Math.max(5, Math.round(l.minutos / 2)) });
        }
      });
      ctx.labs.filter((x) => x.modulo === m.id && !ctx.labFeito(x.id)).forEach((x) => lista.push({ tipo: "lab", lab: x, m, titulo: "Laboratório: " + x.titulo, min: 15 }));
      ctx.casos.filter((x) => x.modulo === m.id && !ctx.casoFeito(x.id)).forEach((x) => lista.push({ tipo: "caso", caso: x, m, titulo: "Caso real: " + x.titulo, min: 10 }));
      if (!ctx.provaFeita(m.id)) {
        lista.push({ tipo: "revmod", m, titulo: `Revisão do Módulo ${m.numero}`, min: 15 });
        lista.push({ tipo: "prova", m, titulo: `Prova do Módulo ${m.numero}`, min: 15 });
      }
    });
    return lista;
  }

  // Distribui as tarefas pelos dias de estudo, a partir de hoje.
  function distribuir(lista, cfg, minutosHoje, hoje) {
    const fila = lista.map((t) => Object.assign({ resta: t.min, partes: Math.ceil(t.min / Math.max(5, cfg.min)) || 1, parte: 0 }, t));
    const dias = [];
    const capSessao = cfg.min / cfg.sessoes;
    let d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    for (let n = 0; n < 1500 && fila.length; n++, d = new Date(d.getTime() + DIA_MS)) {
      if (!cfg.dias.includes(d.getDay())) continue;
      let usado = n === 0 ? Math.min(cfg.min, minutosHoje) : 0;
      const dia = { data: iso(d), date: new Date(d), sessoes: NOMES_SESSAO[cfg.sessoes].map((nome) => ({ nome, itens: [] })), total: 0 };
      while (fila.length && cfg.min - usado >= 5) {
        const t = fila[0], livre = cfg.min - usado;
        // não começar na sessão atual uma tarefa que só cabe na seguinte
        const sAtual = Math.min(cfg.sessoes - 1, Math.floor((usado + 0.01) / capSessao));
        const restoSessao = (sAtual + 1) * capSessao - usado;
        if (sAtual < cfg.sessoes - 1 && dia.sessoes[sAtual].itens.length && t.resta > restoSessao + 3 && t.resta <= cfg.min - (sAtual + 1) * capSessao) { usado = (sAtual + 1) * capSessao; continue; }
        const fatia = t.resta <= livre ? t.resta : (livre >= 8 || t.resta > cfg.min ? livre : 0);
        if (!fatia) break;
        const s = Math.min(cfg.sessoes - 1, Math.floor((usado + 0.01) / capSessao));
        t.parte++;
        dia.sessoes[s].itens.push({ t, min: Math.round(fatia), parte: t.resta > fatia || t.parte > 1 ? t.parte : 0 });
        t.resta -= fatia; usado += fatia; dia.total += fatia;
        if (t.resta <= 0.5) fila.shift();
      }
      if (dia.total > 0 || n === 0) dias.push(dia);
    }
    return dias;
  }

  function calcular(ctx, cfg, hoje) {
    hoje = hoje || new Date();
    const r = ritmo(ctx);
    const lista = tarefas(ctx, r.fator);
    const totalMin = lista.reduce((a, t) => a + t.min, 0);
    const dias = distribuir(lista, cfg, ctx.minutosHoje, hoje);
    const ultimo = dias.filter((x) => x.total > 0).pop();
    return {
      dias, lista, totalMin, ritmo: r,
      fim: ultimo ? ultimo.date : hoje,
      semanal: cfg.min * cfg.dias.length,
    };
  }

  // Minutos por dia necessários para acabar até à data alvo.
  function minutosParaAlvo(totalMin, cfg, alvo, hoje) {
    hoje = hoje || new Date();
    let dias = 0;
    for (let d = new Date(hoje); d <= alvo; d = new Date(d.getTime() + DIA_MS)) if (cfg.dias.includes(d.getDay())) dias++;
    if (!dias) return null;
    return Math.min(240, Math.max(10, Math.ceil(totalMin / dias / 5) * 5));
  }

  window.Plano = { calcular, minutosParaAlvo, iso, NOMES_SESSAO };
})();
