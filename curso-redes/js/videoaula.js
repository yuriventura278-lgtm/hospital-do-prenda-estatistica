/* Leitor de vídeo-aulas.
   Cada lição tem um guião (gerado por conteudo/narracao.py) com cenas e falas:
   { t: legenda, f: texto falado, item?: elemento do ecrã que acende, junta?: encadeia
     com a fala seguinte sem pausa, pausa?: segundos de silêncio depois, espera?: segundos
     para o aluno pensar (“Pare e pense”) }.
   Voz contínua: dentro da mesma ideia (junta) a fala seguinte entra na fila da voz antes
   de a atual acabar, como no assistente de leitura (leitor.js); só há silêncio onde o
   guião pede uma pausa. Um vigia retoma a voz se o navegador a deixar parada.
   O ecrã acompanha a voz: a legenda pinta a palavra dita (onboundary, ou estimativa pelo
   tempo) e o elemento da fala (linha da tabela, comando, passo, item) acende com um
   realce amarelo que se desloca. Sem voz portuguesa, avança sozinho ao ritmo de leitura. */
(function () {
  "use strict";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const CHAVE_VOZ = "ccna-voz", CHAVE_VEL = "ccna-velocidade", CHAVE_POS = "ccna-va-pos-";
  const ler = (k, d) => { try { return localStorage.getItem(k) || d; } catch (e) { return d; } };
  const gravar = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* sem armazenamento */ } };
  const temVoz = typeof window.speechSynthesis !== "undefined" && typeof window.SpeechSynthesisUtterance !== "undefined";
  const VELS = [0.85, 1, 1.25, 1.5];
  const PALAVRAS_SEG = 2.5; // ritmo médio da voz a 1× (igual ao de narracao.py)
  const fmtVel = (v) => String(v).replace(".", ",") + "×";
  const fmtTempo = (s) => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

  function vozesPT() {
    if (!temVoz) return [];
    return speechSynthesis.getVoices().filter((v) => /^pt/i.test(v.lang)).sort((a, b) => pontuar(b) - pontuar(a));
  }
  // Preferir vozes neurais/naturais e português europeu.
  function pontuar(v) {
    let p = 0;
    if (/natural|neural|online|premium|enhanced|google/i.test(v.name)) p += 4;
    if (/pt[-_]PT/i.test(v.lang)) p += 3;
    if (v.localService) p += 1;
    return p;
  }
  // Género da voz pelo nome (as vozes portuguesas mais comuns), quando se consegue saber.
  function genero(v) {
    if (/female|feminin|joana|catarina|fernanda|raquel|helena|h[eé]lia|francisca|in[eê]s|luciana|maria|brenda|camila|vit[oó]ria|thalita|leila|yara|giovanna|manuela|elza|let[ií]cia|beatriz|amália|amalia/i.test(v.name)) return "f";
    if (/\bmale|masculin|duarte|cristiano|ant[oó]nio|daniel|ricardo|felipe|f[aá]bio|humberto|j[uú]lio|nicolau|val[eé]rio|donato|tiago|diogo|jorge/i.test(v.name)) return "m";
    return "";
  }

  const TIPOS = { abertura: "Abertura", texto: "Explicação", exemplo: "Exemplo", dica: "Dica", alerta: "Atenção", figura: "Ilustração", topologia: "Diagrama", tabela: "Tabela", cli: "Configuração passo a passo", saida: "Saída do comando", sim_real: "Simulador × real", jogo_cabo: "Prática", pense: "Pare e pense", fecho: "Resumo" };
  const REVELAR = { cli: 1, exemplo: 1, jogo_cabo: 1 }; // elementos aparecem à medida que são falados
  const duracao = (f) => f.f.split(/\s+/).length / PALAVRAS_SEG + (f.junta ? 0 : f.pausa == null ? 0.35 : f.pausa) + (f.espera || 0);

  // Áudio silencioso em ciclo: mantém a sessão multimédia ativa (controlos no ecrã de bloqueio).
  let silencio = null;
  function audioSilencioso() {
    if (silencio) return silencio;
    const n = 8000, buf = new Uint8Array(44 + n), dv = new DataView(buf.buffer);
    const txt = (o, s) => { for (let i = 0; i < s.length; i++) buf[o + i] = s.charCodeAt(i); };
    txt(0, "RIFF"); dv.setUint32(4, 36 + n, true); txt(8, "WAVE"); txt(12, "fmt "); dv.setUint32(16, 16, true);
    dv.setUint16(20, 1, true); dv.setUint16(22, 1, true); dv.setUint32(24, 8000, true); dv.setUint32(28, 8000, true);
    dv.setUint16(32, 1, true); dv.setUint16(34, 8, true); txt(36, "data"); dv.setUint32(40, n, true); buf.fill(128, 44);
    let bin = ""; buf.forEach((b) => { bin += String.fromCharCode(b); });
    silencio = new Audio("data:audio/wav;base64," + btoa(bin)); silencio.loop = true; silencio.volume = 0.01;
    return silencio;
  }

  function montar(raiz, licao, opcoes) {
    const F = window.Figuras, cenas = licao.video.cenas, op = opcoes || {};
    const total = cenas.reduce((a, c) => a + c.falas.reduce((b, f) => b + duracao(f), 0), 0);
    let ci = 0, fi = 0, aTocar = false, vel = +ler(CHAVE_VEL, "1"), legendas = true, terminado = false, modoAudio = false;
    if (VELS.indexOf(vel) < 0) vel = 1;
    let vozNome = ler(CHAVE_VOZ, ""), geracao = 0, ultima = -1, painel = "";
    let tPausa = null, tVigia = null, tArranque = null, tProg = null, tEspera = null, wake = null;
    let progresso = 0, fronteira = false, inicioFala = 0, durFala = 1, semVoz = false, escolha = {};
    const pos = (() => { try { return JSON.parse(ler(CHAVE_POS + licao.id, "null")); } catch (e) { return null; } })();
    if (pos && pos.c > 0 && pos.c < cenas.length) { ci = pos.c; fi = Math.min(pos.f || 0, cenas[ci].falas.length - 1); }

    raiz.innerHTML = `<div class="va" tabindex="0" aria-label="Vídeo-aula: ${esc(licao.titulo)}">
      <div class="va-palco" id="va-palco"></div>
      <div class="va-legenda" id="va-legenda"></div>
      <div class="va-capitulos" id="va-capitulos">${cenas.map((c, i) => `<button style="flex:${Math.max(1, c.falas.length)}" data-cap="${i}" aria-label="Capítulo ${i + 1}: ${esc(c.titulo || TIPOS[c.tipo])}"><i></i></button>`).join("")}</div>
      <div class="va-controlos">
        <button data-va="ant" aria-label="Cena anterior">${svg("M6 5v14M18 5 9 12l9 7z")}</button>
        <button data-va="tocar" class="va-tocar" aria-label="Reproduzir">${svg("M7 4v16l13-8z", true)}</button>
        <button data-va="seg" aria-label="Cena seguinte">${svg("M18 5v14M6 5l9 7-9 7z")}</button>
        <button data-va="frase" aria-label="Repetir a frase" title="Repetir a frase">${svg("M3 12a9 9 0 1 0 3-6.7M3 4v5h5")}</button>
        <span class="va-tempo tab-num" id="va-tempo"></span>
        <button data-va="vel" class="va-texto" aria-label="Velocidade">${fmtVel(vel)}</button>
        <button data-va="cc" class="va-texto" aria-pressed="true" aria-label="Legendas">CC</button>
        <button data-va="ecra" aria-label="Ecrã inteiro">${svg("M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5")}</button>
      </div>
      <div class="va-extra">
        <button data-va="cap" aria-pressed="false">Capítulos</button>
        <button data-va="txt" aria-pressed="false">Transcrição</button>
        <button data-va="audio" aria-pressed="false" title="Ouvir como um podcast, com o ecrã desligado">Modo áudio</button>
      </div>
      <div class="va-painel" id="va-painel" hidden></div>
      <div class="va-voz" id="va-voz"></div>
      ${pos && pos.c > 0 ? `<div class="va-retomar" id="va-retomar"><span>Retoma onde parou: capítulo ${ci + 1} de ${cenas.length}.</span><button data-va="inicio">Começar do início</button></div>` : ""}
    </div>`;
    const $ = (s) => raiz.querySelector(s);
    const va = $(".va"), palco = $("#va-palco"), leg = $("#va-legenda");

    function svg(d, cheio) { return `<svg viewBox="0 0 24 24" width="22" height="22" fill="${cheio ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`; }

    // ------------------------------------------------------------ voz
    function vozAtual() { const vs = vozesPT(); return vs.find((v) => v.name === vozNome) || vs[0] || null; }
    function painelVoz() {
      const vs = vozesPT(), el = $("#va-voz");
      if (!temVoz || !vs.length) {
        el.innerHTML = `<p class="va-aviso">Este dispositivo não tem voz em português instalada: a aula avança sozinha com legendas. Para ouvir a narração, instale uma voz portuguesa nas definições do telemóvel (Android: Definições › Sistema › Idioma › Conversão de texto em voz; iPhone: Acessibilidade › Conteúdo falado › Vozes).</p>`;
        return;
      }
      if (!vs.some((v) => v.name === vozNome)) vozNome = vs[0].name;
      const g = { f: vs.find((v) => genero(v) === "f"), m: vs.find((v) => genero(v) === "m") };
      el.innerHTML = `<label for="va-sel-voz">Voz</label><select id="va-sel-voz">${vs.map((v) => `<option value="${esc(v.name)}" ${v.name === vozNome ? "selected" : ""}>${esc(v.name.replace(/Microsoft |Google /, ""))} (${esc(v.lang)})</option>`).join("")}</select>`
        + (g.f && g.m ? `<button data-voz="${esc(g.f.name)}" aria-pressed="${genero(vozAtual()) === "f"}">Feminina</button><button data-voz="${esc(g.m.name)}" aria-pressed="${genero(vozAtual()) === "m"}">Masculina</button>` : "");
      $("#va-sel-voz").addEventListener("change", (e) => mudarVoz(e.target.value));
    }
    function mudarVoz(nome) { vozNome = nome; gravar(CHAVE_VOZ, nome); semVoz = false; painelVoz(); if (aTocar) comecar(ci, fi); }
    if (temVoz) { if (speechSynthesis.addEventListener) speechSynthesis.addEventListener("voiceschanged", painelVoz); else speechSynthesis.onvoiceschanged = painelVoz; }
    painelVoz();

    // ------------------------------------------------------------ desenho das cenas
    const itensLista = (xs, cls) => xs.map((x, k) => `<p data-item="${k}" class="${cls || ""}">${esc(x)}</p>`).join("");
    function desenharCena() {
      const c = cenas[ci], b = c.bloco >= 0 && licao.blocos ? licao.blocos[c.bloco] : null;
      let corpo = "";
      if (c.tipo === "abertura") corpo = `<div class="va-abertura"><span class="va-modulo">${/^apresentacao_/.test(licao.id || "") ? "Apresentação do módulo" : "Vídeo-aula"}</span><h2>${esc(licao.titulo)}</h2><ul>${licao.objetivos.map((o, k) => `<li data-item="${k}">${esc(o)}</li>`).join("")}</ul></div>`;
      else if (c.tipo === "fecho") corpo = `<div class="va-abertura"><span class="va-modulo">${c.titulo === "Resumo" ? "Resumo" : "Apresentação"}</span><h2>${c.titulo === "Resumo" ? "Agora já sabe" : esc(c.titulo)}</h2><ul class="check">${licao.objetivos.map((o, k) => `<li data-item="${k}">${esc(o)}</li>`).join("")}</ul></div>`;
      else if (c.tipo === "pense") corpo = `<div class="va-pense"><p class="va-pergunta">${esc(c.pergunta)}</p><div class="va-opcoes">${c.opcoes.map((o, k) => `<button data-item="${k}" data-op="${k}">${esc(o)}</button>`).join("")}</div><div class="va-conta" id="va-conta" hidden></div></div>`;
      else if (c.tipo === "figura") corpo = `<div class="va-fig" data-item="0">${F.figura(b.nome)}</div>`;
      else if (c.tipo === "topologia") corpo = `<div class="va-fig" data-item="0">${F.topologia(b)}</div>${c.itens && c.itens.length ? `<div class="va-ligacoes">${c.itens.map((x, k) => `<span data-item="${k + 1}">${esc(x)}</span>`).join("")}</div>` : ""}`;
      else if (c.tipo === "tabela") corpo = `<div class="va-tabela"><table><thead><tr>${b.cabecalho.map((x) => `<th>${esc(x)}</th>`).join("")}</tr></thead><tbody>${b.linhas.map((l, r) => `<tr data-item="${r}">${l.map((x) => `<td>${esc(x)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
      else if (c.tipo === "cli") corpo = `<div class="va-term">${b.passos.map((p, k) => `<div class="va-passo" data-item="${k}"><span class="pr">${esc(p.prompt)}</span> <span class="cm">${esc(p.cmd)}</span>${p.explica ? `<div class="ex">${esc(p.explica)}</div>` : ""}</div>`).join("")}</div>`;
      else if (c.tipo === "saida") corpo = `<div class="va-term" data-item="0"><pre>${esc(b.texto)}</pre></div>`;
      else if (c.tipo === "sim_real") corpo = `<div class="va-simreal"><div><b>No simulador</b><ul>${b.simulador.map((x, k) => `<li data-item="${k}">${x}</li>`).join("")}</ul></div><div><b>No equipamento real</b><ul>${b.real.map((x, k) => `<li data-item="${b.simulador.length + k}">${x}</li>`).join("")}</ul></div></div>`;
      else if (c.tipo === "jogo_cabo") corpo = `<ol class="va-pinos">${(c.itens || []).map((x, k) => `<li data-item="${k}"><i class="fio-${esc(x)}"></i>${esc(x)}</li>`).join("")}</ol>`;
      else if (c.itens) {
        const codigo = b && b.html && b.html.includes("<pre>") ? (b.html.match(/<pre>[\s\S]*?<\/pre>/g) || []).join("") : "";
        corpo = `<div class="va-frases">${itensLista(c.itens)}</div>${codigo ? `<div class="va-codigo" data-item="${c.codigo}">${codigo}</div>` : ""}${c.resumo ? `<p class="va-resumo" data-item="${c.resumo.item}">${esc(c.resumo.t)}</p>` : ""}`;
      } else corpo = `<div class="va-frases">${c.falas.map((f, k) => `<p data-fala="${k}">${esc(f.t)}</p>`).join("")}</div>`;
      palco.className = "va-palco va-" + c.tipo + (REVELAR[c.tipo] ? " va-revelar" : "");
      palco.innerHTML = `<div class="va-cab"><span class="va-chip">${esc(TIPOS[c.tipo] || "")}</span><span class="va-n tab-num">${ci + 1}/${cenas.length}</span></div>${c.titulo && !["abertura", "fecho", "pense"].includes(c.tipo) ? `<h3>${esc(c.titulo)}</h3>` : ""}<div class="va-corpo">${corpo}</div><div class="va-ponteiro" aria-hidden="true"></div>`;
      palco.scrollTop = 0;
      if (c.tipo === "pense" && escolha[ci] != null) palco.querySelector(`[data-op="${escolha[ci]}"]`).classList.add("escolhida");
      realcar();
    }

    // legenda com a palavra dita realçada (karaoke)
    function desenharLegenda() {
      const f = cenas[ci].falas[fi] || { t: "" };
      leg.hidden = !legendas;
      leg.innerHTML = f.t.split(/(\s+)/).map((w) => (/^\s+$/.test(w) || !w ? w : `<span>${esc(w)}</span>`)).join("");
      pintar();
    }
    function pintar() {
      const sp = leg.querySelectorAll("span"), t = (cenas[ci].falas[fi] || { t: "" }).t;
      if (!sp.length) return;
      const alvo = progresso * t.length;
      let pos = 0, k = 0;
      for (let i = 0; i < sp.length; i++) { const ini = t.indexOf(sp[i].textContent, pos); if (ini <= alvo) k = i; pos = ini + sp[i].textContent.length; }
      sp.forEach((s, i) => { s.className = progresso <= 0 ? "" : i < k ? "dito" : i === k ? "agora" : ""; });
    }

    function realcar() {
      const c = cenas[ci], f = c.falas[fi] || {}, it = f.item != null ? f.item : null;
      let maxItem = -1;
      c.falas.slice(0, fi + 1).forEach((x) => { if (x.item != null && x.item > maxItem) maxItem = x.item; });
      palco.querySelectorAll("[data-item]").forEach((el) => {
        const k = +el.dataset.item;
        el.classList.toggle("agora", k === it);
        el.classList.toggle("dito", it != null ? k < it && k <= maxItem : k <= maxItem);
        el.classList.toggle("por-vir", !!REVELAR[c.tipo] && k > maxItem);
      });
      palco.querySelectorAll("[data-fala]").forEach((p) => { const k = +p.dataset.fala; p.className = k === fi ? "agora" : k < fi ? "dito" : ""; });
      if (c.tipo === "pense") {
        const resolvido = fi >= 1 || terminado;
        palco.querySelectorAll("[data-op]").forEach((b) => {
          const k = +b.dataset.op;
          b.classList.toggle("certa", resolvido && k === c.certa);
          b.classList.toggle("errada", resolvido && k === escolha[ci] && k !== c.certa);
          b.classList.toggle("agora", resolvido && k === c.certa);
        });
      }
      ponteiro();
      desenharLegenda();
      raiz.querySelectorAll("[data-cap]").forEach((b, i) => { b.classList.toggle("vista", i < ci); b.classList.toggle("atual", i === ci); b.querySelector("i").style.width = i === ci ? `${(fi / Math.max(1, c.falas.length)) * 100}%` : ""; });
      const feito = (c.inicio != null ? c.inicio : 0) + c.falas.slice(0, fi).reduce((a, x) => a + duracao(x), 0);
      $("#va-tempo").textContent = `${fmtTempo(feito / vel)} / ${fmtTempo(total / vel)}`;
      if (painel) marcarPainel();
      if (op.aoPosicao) op.aoPosicao(ci, fi);
    }
    // realce amarelo que se desloca até ao elemento da fala
    function ponteiro() {
      const p = palco.querySelector(".va-ponteiro"); if (!p) return;
      const el = palco.querySelector("[data-item].agora, [data-fala].agora");
      if (!el) { p.classList.remove("visivel"); return; }
      const rp = palco.getBoundingClientRect(), re = el.getBoundingClientRect();
      if (!re.width && !re.height) { p.classList.remove("visivel"); return; }
      const top = re.top - rp.top + palco.scrollTop, left = re.left - rp.left + palco.scrollLeft;
      p.style.transform = `translate(${left - 5}px, ${top - 4}px)`;
      p.style.width = `${re.width + 10}px`; p.style.height = `${re.height + 8}px`;
      p.classList.add("visivel");
      const vis = top - palco.scrollTop;
      if (vis < 40 || vis + re.height > palco.clientHeight - 10) {
        const alvo = Math.max(0, top - Math.max(40, (palco.clientHeight - re.height) / 3));
        try { palco.scrollTo({ top: alvo, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); } catch (e) { palco.scrollTop = alvo; }
      }
    }

    // ------------------------------------------------------------ narração
    function limparTempos() { [tPausa, tVigia, tArranque, tEspera].forEach(clearTimeout); clearInterval(tProg); clearInterval(tEspera); tPausa = tVigia = tArranque = tProg = tEspera = null; }
    function pararVoz() { limparTempos(); geracao++; ultima = -1; if (temVoz && (speechSynthesis.speaking || speechSynthesis.pending)) speechSynthesis.cancel(); const ct = $("#va-conta"); if (ct) ct.hidden = true; }
    const estimar = (f) => Math.max(900, (f.f.split(/\s+/).length / (PALAVRAS_SEG * vel)) * 1000 + 200);

    function iniciarProgresso(f) {
      progresso = 0; fronteira = false; inicioFala = performance.now(); durFala = estimar(f);
      clearInterval(tProg);
      tProg = setInterval(() => { if (fronteira) return; progresso = Math.min(0.97, (performance.now() - inicioFala) / durFala); pintar(); }, 120);
    }
    function guardarPosicao() { gravar(CHAVE_POS + licao.id, ci > 0 || fi > 0 ? JSON.stringify({ c: ci, f: fi }) : null); }

    // (re)começa a narrar a partir da fala f da cena c
    function comecar(c, f) {
      pararVoz();
      const mudou = c !== ci || !palco.firstChild;
      ci = Math.max(0, Math.min(cenas.length - 1, c)); fi = Math.max(0, Math.min(cenas[ci].falas.length - 1, f || 0));
      if (mudou) desenharCena(); else realcar();
      if (!aTocar) return;
      const g = geracao;
      if (!temVoz || semVoz || !vozAtual()) return dizerTempo(fi, g);
      enfileirar(fi, g);
      // se a voz nunca começar (navegador bloqueado), segue ao ritmo de leitura
      tArranque = setTimeout(() => { if (g === geracao && aTocar && !speechSynthesis.speaking) { semVoz = true; comecar(ci, fi); } }, 3000);
    }
    function enfileirar(k, g, primeira = true) {
      const fs = cenas[ci].falas, f = fs[k], voz = vozAtual();
      const u = new SpeechSynthesisUtterance(f.f);
      if (voz) { u.voice = voz; u.lang = voz.lang; } else u.lang = "pt-PT";
      u.rate = Math.min(2, 0.95 * vel); u.pitch = 1;
      u.onstart = () => { if (g !== geracao) return; clearTimeout(tArranque); fi = k; realcar(); iniciarProgresso(f); vigiar(k, g); guardarPosicao(); };
      u.onboundary = (e) => { if (g !== geracao || fi !== k || e.name === "sentence") return; fronteira = true; progresso = Math.min(1, (e.charIndex || 0) / Math.max(1, f.f.length)); pintar(); vigiar(k, g); };
      u.onend = () => { if (g === geracao) terminou(k, g); };
      u.onerror = (e) => { if (g === geracao && e.error !== "interrupted" && e.error !== "canceled") terminou(k, g); };
      speechSynthesis.speak(u);
      ultima = k;
      // mesma ideia: a fala seguinte vai já para a fila (a voz encadeia-as sem silêncio)
      if (primeira && f.junta && fs[k + 1]) enfileirar(k + 1, g, false);
    }
    function terminou(k, g) {
      const fs = cenas[ci].falas, f = fs[k];
      progresso = 1; fronteira = true; pintar();
      if (f.junta && ultima > k) { // a seguinte já está na fila: mantém sempre uma à frente
        if (fs[k + 1].junta && fs[k + 2] && ultima === k + 1) enfileirar(k + 2, g);
        return;
      }
      depois(f, g);
    }
    // vigia: se a voz ficou parada (Chrome/Android), retoma; se ficou muda, repete a fala
    function vigiar(k, g) {
      clearTimeout(tVigia);
      tVigia = setTimeout(() => {
        if (g !== geracao || !aTocar || fi !== k) return;
        if (speechSynthesis.paused) { speechSynthesis.resume(); vigiar(k, g); return; }
        if (!speechSynthesis.speaking) terminou(k, g); else comecar(ci, k);
      }, estimar(cenas[ci].falas[k]) * 1.6 + 4000);
    }
    // sem voz: avança ao ritmo de leitura, com a mesma legenda e o mesmo realce
    function dizerTempo(k, g) {
      fi = k; realcar(); guardarPosicao();
      const f = cenas[ci].falas[k];
      iniciarProgresso(f);
      tPausa = setTimeout(() => { if (g !== geracao) return; progresso = 1; fronteira = true; pintar(); if (f.junta) avancar(g); else depois(f, g); }, estimar(f));
    }
    function depois(f, g) {
      clearInterval(tProg);
      if (f.espera) return esperar(f.espera, g);
      const s = f.junta ? 0 : f.pausa == null ? 0.35 : f.pausa;
      tPausa = setTimeout(() => { if (g === geracao) avancar(g); }, (s * 1000) / Math.min(1, vel));
    }
    // “Pare e pense”: espera uns segundos ou até o aluno escolher
    function esperar(seg, g) {
      const ct = $("#va-conta"); let r = seg;
      if (ct) { ct.hidden = false; ct.textContent = r; }
      tEspera = setInterval(() => {
        if (g !== geracao) return clearInterval(tEspera);
        r--; if (ct) ct.textContent = r;
        if (r <= 0) { clearInterval(tEspera); if (ct) ct.hidden = true; avancar(g); }
      }, 1000);
    }
    function avancar(g) {
      if (!aTocar || g !== geracao) return;
      if (fi + 1 < cenas[ci].falas.length) return comecar(ci, fi + 1);
      if (ci + 1 >= cenas.length) return fim();
      comecar(ci + 1, 0);
    }

    function fim() {
      aTocar = false; terminado = true; pararVoz(); botao(); guardarFim();
      palco.insertAdjacentHTML("beforeend", `<div class="va-fim"><b>Vídeo-aula concluída</b><div><button data-va="repetir">Ver de novo</button>${op.aoQuiz ? '<button data-va="quiz" class="prim">Fazer o quiz</button>' : ""}</div></div>`);
      sessao(false);
      if (op.aoTerminar) op.aoTerminar();
    }
    function guardarFim() { gravar(CHAVE_POS + licao.id, null); }
    function irPara(c, f) { terminado = false; const r = $("#va-retomar"); if (r) r.remove(); const fimEl = palco.querySelector(".va-fim"); if (fimEl) fimEl.remove(); comecar(c, f || 0); if (!aTocar) guardarPosicao(); }
    function tocar() {
      if (terminado) { terminado = false; ci = 0; fi = 0; desenharCena(); }
      const r = $("#va-retomar"); if (r) r.remove();
      aTocar = true; botao(); comecar(ci, fi); sessao(true);
    }
    function pausar() { aTocar = false; pararVoz(); botao(); sessao(true); }
    function botao() {
      const b = raiz.querySelector('[data-va="tocar"]');
      b.innerHTML = aTocar ? svg("M8 5v14M16 5v14") : svg("M7 4v16l13-8z", true);
      b.setAttribute("aria-label", aTocar ? "Pausa" : "Reproduzir");
      va.classList.toggle("a-tocar", aTocar);
    }

    // ------------------------------------------------------------ modo áudio e ecrã de bloqueio
    function sessao(ativa) {
      const ms = navigator.mediaSession;
      if (ativa && aTocar && !modoAudio) {
        try { if (navigator.wakeLock && !wake) navigator.wakeLock.request("screen").then((w) => { wake = w; w.addEventListener("release", () => { wake = null; }); }).catch(() => {}); } catch (e) { /* opcional */ }
      } else if (wake) { try { wake.release(); } catch (e) { /* já libertado */ } wake = null; }
      if (modoAudio && aTocar) { try { const a = audioSilencioso(); const p = a.play(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* sem áudio */ } }
      else if (silencio) silencio.pause();
      if (!ms) return;
      try {
        if (!ativa) { ms.playbackState = "none"; return; }
        if (typeof MediaMetadata !== "undefined") ms.metadata = new MediaMetadata({ title: licao.titulo, artist: "Curso de Redes — vídeo-aula", album: cenas[ci] ? (cenas[ci].titulo || TIPOS[cenas[ci].tipo]) : "", artwork: [{ src: "icons/icon-192.png", sizes: "192x192", type: "image/png" }] });
        ms.playbackState = aTocar ? "playing" : "paused";
        ms.setActionHandler("play", () => { if (!aTocar) tocar(); });
        ms.setActionHandler("pause", () => { if (aTocar) pausar(); });
        ms.setActionHandler("previoustrack", () => irPara(ci - 1, 0));
        ms.setActionHandler("nexttrack", () => irPara(ci + 1, 0));
        try { ms.setActionHandler("seekbackward", () => irPara(ci, fi)); } catch (e) { /* não suportado */ }
      } catch (e) { /* sessão multimédia não suportada */ }
    }

    // ------------------------------------------------------------ capítulos e transcrição
    function abrirPainel(qual) {
      painel = painel === qual ? "" : qual;
      const el = $("#va-painel");
      raiz.querySelectorAll('[data-va="cap"],[data-va="txt"]').forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.va === painel)));
      el.hidden = !painel;
      if (painel === "cap") el.innerHTML = `<ol class="va-caps">${cenas.map((c, i) => `<li><button data-ir="${i}"><span class="tab-num">${fmtTempo((c.inicio || 0) / vel)}</span><b>${esc(c.titulo || TIPOS[c.tipo])}</b><small>${esc(TIPOS[c.tipo] || "")}</small></button></li>`).join("")}</ol>`;
      if (painel === "txt") el.innerHTML = `<div class="va-transc">${cenas.map((c, i) => `<h4>${i + 1}. ${esc(c.titulo || TIPOS[c.tipo])}</h4>${c.falas.map((f, k) => `<p data-ir="${i}" data-irf="${k}">${esc(f.t)}</p>`).join("")}`).join("")}</div>`;
      if (painel) marcarPainel(true);
    }
    function marcarPainel(rolar) {
      const el = $("#va-painel"); let atual = null;
      if (painel === "cap") el.querySelectorAll("[data-ir]").forEach((b) => { const s = +b.dataset.ir === ci; b.classList.toggle("atual", s); if (s) atual = b; });
      if (painel === "txt") el.querySelectorAll("[data-irf]").forEach((p) => { const s = +p.dataset.ir === ci && +p.dataset.irf === fi; p.classList.toggle("atual", s); if (s) atual = p; });
      if (atual) { const t = atual.offsetTop - el.offsetTop - el.clientHeight / 3; if (rolar || Math.abs(el.scrollTop - t) > el.clientHeight / 3) el.scrollTop = Math.max(0, t); }
    }

    // ------------------------------------------------------------ interação
    raiz.addEventListener("click", (e) => {
      const cap = e.target.closest("[data-cap]");
      if (cap) return irPara(+cap.dataset.cap, 0);
      const ir = e.target.closest("[data-ir]");
      if (ir) return irPara(+ir.dataset.ir, ir.dataset.irf ? +ir.dataset.irf : 0);
      const opc = e.target.closest("[data-op]");
      if (opc && cenas[ci].tipo === "pense") {
        if (escolha[ci] != null && fi >= 1) return;
        escolha[ci] = +opc.dataset.op;
        palco.querySelectorAll("[data-op]").forEach((b) => b.classList.toggle("escolhida", b === opc));
        return irPara(ci, 1); // diz já a resposta certa e a explicação
      }
      const fl = e.target.closest("[data-fala]");
      if (fl) return irPara(ci, +fl.dataset.fala);
      const vz = e.target.closest("[data-voz]");
      if (vz) return mudarVoz(vz.dataset.voz);
      const b = e.target.closest("[data-va]"); if (!b) return;
      const a = b.dataset.va;
      if (a === "tocar") aTocar ? pausar() : tocar();
      if (a === "ant") irPara(fi > 0 ? ci : ci - 1, 0);
      if (a === "seg") irPara(ci + 1, 0);
      if (a === "frase") { if (!aTocar) { aTocar = true; botao(); sessao(true); } irPara(ci, fi); }
      if (a === "vel") { vel = VELS[(VELS.indexOf(vel) + 1) % VELS.length]; b.textContent = fmtVel(vel); gravar(CHAVE_VEL, String(vel)); if (aTocar) comecar(ci, fi); else realcar(); if (painel === "cap") { painel = ""; abrirPainel("cap"); } }
      if (a === "cc") { legendas = !legendas; b.setAttribute("aria-pressed", String(legendas)); desenharLegenda(); }
      if (a === "ecra") { va.classList.toggle("cheio"); document.body.classList.toggle("va-aberto"); setTimeout(ponteiro, 50); }
      if (a === "cap" || a === "txt") abrirPainel(a);
      if (a === "audio") { modoAudio = !modoAudio; b.setAttribute("aria-pressed", String(modoAudio)); va.classList.toggle("modo-audio", modoAudio); sessao(true); }
      if (a === "inicio") { const r = $("#va-retomar"); if (r) r.remove(); gravar(CHAVE_POS + licao.id, null); irPara(0, 0); }
      if (a === "repetir") { irPara(0, 0); tocar(); }
      if (a === "quiz" && op.aoQuiz) { parar(); op.aoQuiz(); }
    });
    va.addEventListener("keydown", (e) => {
      if (e.target.tagName === "SELECT" || (e.target.tagName === "BUTTON" && e.key === " ")) return;
      if (e.key === " ") { e.preventDefault(); aTocar ? pausar() : tocar(); }
      if (e.key === "ArrowRight") irPara(ci + 1, 0);
      if (e.key === "ArrowLeft") irPara(ci - 1, 0);
      if (e.key === "r" || e.key === "R") irPara(ci, fi);
      if (e.key === "Escape") { va.classList.remove("cheio"); document.body.classList.remove("va-aberto"); }
    });
    const aoRedimensionar = () => ponteiro();
    window.addEventListener("resize", aoRedimensionar);
    function parar() { aTocar = false; pararVoz(); botao(); sessao(false); window.removeEventListener("resize", aoRedimensionar); document.body.classList.remove("va-aberto"); }
    desenharCena();
    return { parar, tocar, estado: () => ({ cena: ci, fala: fi, aTocar, semVoz: semVoz || !vozAtual() }) };
  }

  window.VideoAula = { montar, temVoz, vozesPT, genero };
})();
