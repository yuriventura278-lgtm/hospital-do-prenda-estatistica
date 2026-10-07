/* Leitor de vídeo-aulas.
   Cada lição tem um guião (gerado por conteudo/narracao.py) com cenas e falas.
   O leitor mostra as cenas animadas (texto, figuras, tabelas, terminal) e narra cada
   fala com a voz portuguesa do dispositivo (Web Speech API), com legendas sempre
   visíveis. Sem voz disponível, avança sozinho ao ritmo de leitura, só com legendas. */
(function () {
  "use strict";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const CHAVE_VOZ = "ccna-voz", CHAVE_VEL = "ccna-velocidade";
  const ler = (k, d) => { try { return localStorage.getItem(k) || d; } catch (e) { return d; } };
  const gravar = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* sem armazenamento */ } };
  const temVoz = typeof window.speechSynthesis !== "undefined" && typeof window.SpeechSynthesisUtterance !== "undefined";

  function vozesPT() {
    if (!temVoz) return [];
    return speechSynthesis.getVoices().filter((v) => /^pt/i.test(v.lang))
      .sort((a, b) => pontuar(b) - pontuar(a));
  }
  // Preferir vozes neurais/naturais e português europeu (mais próximo do falado em Angola e Moçambique).
  function pontuar(v) {
    let p = 0;
    if (/natural|neural|online|premium|enhanced|google/i.test(v.name)) p += 4;
    if (/pt[-_]PT/i.test(v.lang)) p += 2;
    if (v.localService) p += 1;
    return p;
  }

  const TIPOS = { abertura: "Abertura", texto: "Explicação", exemplo: "Exemplo", dica: "Dica", alerta: "Atenção", figura: "Ilustração", topologia: "Diagrama", tabela: "Tabela", cli: "Configuração passo a passo", saida: "Saída do comando", sim_real: "Simulador × real", fecho: "Resumo" };

  function montar(raiz, licao, opcoes) {
    const F = window.Figuras, cenas = licao.video.cenas, op = opcoes || {};
    let ci = 0, fi = 0, aTocar = false, vel = +ler(CHAVE_VEL, "1"), legendas = true, temporizador = null, vigia = null, utter = null, terminado = false;
    let vozNome = ler(CHAVE_VOZ, "");

    raiz.innerHTML = `<div class="va" tabindex="0" aria-label="Vídeo-aula: ${esc(licao.titulo)}">
      <div class="va-palco" id="va-palco"></div>
      <div class="va-legenda" id="va-legenda" aria-live="polite"></div>
      <div class="va-capitulos" id="va-capitulos">${cenas.map((c, i) => `<button style="flex:${Math.max(1, c.falas.length)}" data-cap="${i}" aria-label="Cena ${i + 1}: ${esc(TIPOS[c.tipo])}"><i></i></button>`).join("")}</div>
      <div class="va-controlos">
        <button data-va="ant" aria-label="Cena anterior">${svg("M6 5v14M18 5 9 12l9 7z")}</button>
        <button data-va="tocar" class="va-tocar" aria-label="Reproduzir">${svg("M7 4v16l13-8z", true)}</button>
        <button data-va="seg" aria-label="Cena seguinte">${svg("M18 5v14M6 5l9 7-9 7z")}</button>
        <span class="va-tempo tab-num" id="va-tempo"></span>
        <button data-va="vel" class="va-texto" aria-label="Velocidade">${vel}×</button>
        <button data-va="cc" class="va-texto" aria-pressed="true" aria-label="Legendas">CC</button>
        <button data-va="ecra" aria-label="Ecrã inteiro">${svg("M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5")}</button>
      </div>
      <div class="va-voz" id="va-voz"></div>
    </div>`;
    const $ = (s) => raiz.querySelector(s);
    const palco = $("#va-palco"), leg = $("#va-legenda");

    function svg(d, cheio) { return `<svg viewBox="0 0 24 24" width="22" height="22" fill="${cheio ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`; }

    function painelVoz() {
      const vs = vozesPT(), el = $("#va-voz");
      if (!temVoz || !vs.length) {
        el.innerHTML = `<p class="va-aviso">Este dispositivo não tem voz em português instalada: a aula avança sozinha com legendas. Para ouvir a narração, instale uma voz portuguesa nas definições do telemóvel (Android: Definições › Sistema › Idioma › Conversão de texto em voz; iPhone: Acessibilidade › Conteúdo falado › Vozes).</p>`;
        return;
      }
      if (!vs.some((v) => v.name === vozNome)) vozNome = vs[0].name;
      el.innerHTML = `<label for="va-sel-voz">Voz</label><select id="va-sel-voz">${vs.map((v) => `<option value="${esc(v.name)}" ${v.name === vozNome ? "selected" : ""}>${esc(v.name)} (${esc(v.lang)})</option>`).join("")}</select>`;
      $("#va-sel-voz").addEventListener("change", (e) => { vozNome = e.target.value; gravar(CHAVE_VOZ, vozNome); if (aTocar) falarAtual(); });
    }
    if (temVoz) { speechSynthesis.addEventListener ? speechSynthesis.addEventListener("voiceschanged", painelVoz) : (speechSynthesis.onvoiceschanged = painelVoz); }
    painelVoz();

    // ------------------------------------------------------------ desenho das cenas
    function desenharCena() {
      const c = cenas[ci], b = c.bloco >= 0 ? licao.blocos[c.bloco] : null;
      let corpo = "";
      const listaFalas = (cls) => `<div class="va-frases ${cls || ""}">${c.falas.map((f, k) => `<p data-fala="${k}" class="${k === fi ? "agora" : k < fi ? "dita" : ""}">${esc(f.t)}</p>`).join("")}</div>`;
      if (c.tipo === "abertura") corpo = `<div class="va-abertura"><span class="va-modulo">Vídeo-aula</span><h2>${esc(licao.titulo)}</h2><ul>${licao.objetivos.map((o, k) => `<li data-item="${k}">${esc(o)}</li>`).join("")}</ul></div>`;
      else if (c.tipo === "fecho") corpo = `<div class="va-abertura"><span class="va-modulo">Resumo</span><h2>Agora já sabe</h2><ul class="check">${licao.objetivos.map((o, k) => `<li data-item="${k}">${esc(o)}</li>`).join("")}</ul></div>`;
      else if (c.tipo === "figura") corpo = `<div class="va-fig">${F.figura(b.nome)}</div>`;
      else if (c.tipo === "topologia") corpo = `<div class="va-fig">${F.topologia(b)}</div>`;
      else if (c.tipo === "tabela") corpo = `<div class="va-tabela"><table><thead><tr>${b.cabecalho.map((x) => `<th>${esc(x)}</th>`).join("")}</tr></thead><tbody>${b.linhas.map((l, r) => `<tr data-linha="${r}">${l.map((x) => `<td>${esc(x)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
      else if (c.tipo === "cli") corpo = `<div class="va-term">${b.passos.map((p, k) => `<div class="va-passo" data-passo="${k}"><span class="pr">${esc(p.prompt)}</span> <span class="cm">${esc(p.cmd)}</span>${p.explica ? `<div class="ex">${esc(p.explica)}</div>` : ""}</div>`).join("")}</div>`;
      else if (c.tipo === "saida") corpo = `<div class="va-term"><pre>${esc(b.texto)}</pre></div>`;
      else if (c.tipo === "sim_real") corpo = `<div class="va-simreal"><div><b>No simulador</b><ul>${b.simulador.map((x, k) => `<li data-lado="sim" data-item="${k}">${x}</li>`).join("")}</ul></div><div><b>No equipamento real</b><ul>${b.real.map((x, k) => `<li data-lado="real" data-item="${k}">${x}</li>`).join("")}</ul></div></div>`;
      else {
        const codigo = b && b.html && b.html.includes("<pre>") ? (b.html.match(/<pre>[\s\S]*?<\/pre>/g) || []).join("") : "";
        corpo = listaFalas() + (codigo ? `<div class="va-codigo">${codigo}</div>` : "");
      }
      palco.className = "va-palco va-" + c.tipo;
      palco.innerHTML = `<div class="va-cab"><span class="va-chip">${esc(TIPOS[c.tipo])}</span><span class="va-n tab-num">${ci + 1}/${cenas.length}</span></div>${c.titulo && !["abertura", "fecho"].includes(c.tipo) ? `<h3>${esc(c.titulo)}</h3>` : ""}<div class="va-corpo">${corpo}</div>`;
      palco.querySelectorAll("[data-fala]").forEach((p) => p.addEventListener("click", () => irPara(ci, +p.dataset.fala)));
      realcar();
    }

    function realcar() {
      const c = cenas[ci], f = c.falas[fi] || {};
      leg.textContent = legendas ? (f.t || "") : "";
      leg.hidden = !legendas;
      palco.querySelectorAll("[data-fala]").forEach((p) => { const k = +p.dataset.fala; p.className = k === fi ? "agora" : k < fi ? "dita" : ""; });
      palco.querySelectorAll("[data-linha]").forEach((tr) => tr.classList.toggle("agora", +tr.dataset.linha === f.linha));
      palco.querySelectorAll("[data-passo]").forEach((d) => { const k = +d.dataset.passo; d.classList.toggle("agora", k === f.passo); d.classList.toggle("oculto", f.passo == null ? false : k > f.passo); });
      palco.querySelectorAll("[data-item]").forEach((li) => {
        const k = +li.dataset.item, mesmoLado = !li.dataset.lado || li.dataset.lado === f.lado;
        li.classList.toggle("agora", mesmoLado && k === f.item);
      });
      const atual = palco.querySelector(".agora");
      if (atual) atual.scrollIntoView({ block: "nearest", behavior: "smooth" });
      raiz.querySelectorAll("[data-cap]").forEach((b, i) => { b.classList.toggle("vista", i < ci); b.classList.toggle("atual", i === ci); b.querySelector("i").style.width = i === ci ? `${(fi / Math.max(1, c.falas.length)) * 100}%` : ""; });
      const total = cenas.reduce((a, x) => a + x.falas.length, 0), feitas = cenas.slice(0, ci).reduce((a, x) => a + x.falas.length, 0) + fi;
      const restam = Math.round(licao.video.segundos * (1 - feitas / total) / vel);
      $("#va-tempo").textContent = `${Math.floor(restam / 60)}:${String(restam % 60).padStart(2, "0")} restantes`;
    }

    // ------------------------------------------------------------ narração
    function limparTempos() { clearTimeout(temporizador); clearTimeout(vigia); temporizador = vigia = null; }
    function pararVoz() { limparTempos(); if (temVoz) { if (utter) utter.onend = utter.onerror = null; speechSynthesis.cancel(); } utter = null; }

    function falarAtual() {
      pararVoz();
      const f = cenas[ci].falas[fi];
      if (!f) return avancar();
      const pausa = (f.pausa || 0) * 1000 / vel;
      const voz = vozesPT().find((v) => v.name === vozNome) || vozesPT()[0];
      const seguir = () => { limparTempos(); temporizador = setTimeout(avancar, 350 / vel + pausa); };
      if (!voz) { // sem voz: tempo de leitura
        temporizador = setTimeout(avancar, (f.f.split(/\s+/).length / 2.4) * 1000 / vel + 600 + pausa);
        return;
      }
      utter = new SpeechSynthesisUtterance(f.f);
      utter.voice = voz; utter.lang = voz.lang; utter.rate = Math.min(2, 0.95 * vel); utter.pitch = 1;
      utter.onend = seguir; utter.onerror = (e) => { if (e.error !== "interrupted" && e.error !== "canceled") seguir(); };
      speechSynthesis.speak(utter);
      // alguns browsers não disparam "end": avança na mesma
      vigia = setTimeout(() => { if (aTocar && !speechSynthesis.speaking) seguir(); }, (f.f.split(/\s+/).length / 1.6) * 1000 / vel + 4000);
    }

    function avancar() {
      if (!aTocar) return;
      fi++;
      if (fi >= cenas[ci].falas.length) {
        if (ci + 1 >= cenas.length) return fim();
        ci++; fi = 0; desenharCena();
      } else realcar();
      falarAtual();
    }
    function fim() {
      aTocar = false; terminado = true; pararVoz(); botao();
      palco.insertAdjacentHTML("beforeend", `<div class="va-fim"><b>Vídeo-aula concluída</b><div><button data-va="repetir">Ver de novo</button>${op.aoQuiz ? '<button data-va="quiz" class="prim">Fazer o quiz</button>' : ""}</div></div>`);
      if (op.aoTerminar) op.aoTerminar();
    }
    function irPara(c, f) { ci = Math.max(0, Math.min(cenas.length - 1, c)); fi = f || 0; terminado = false; desenharCena(); if (aTocar) falarAtual(); }
    function tocar() {
      if (terminado) { ci = 0; fi = 0; terminado = false; desenharCena(); }
      aTocar = true; botao(); falarAtual();
      try { if (navigator.wakeLock) navigator.wakeLock.request("screen").catch(() => {}); } catch (e) { /* opcional */ }
    }
    function pausar() { aTocar = false; pararVoz(); botao(); }
    function botao() {
      const b = raiz.querySelector('[data-va="tocar"]');
      b.innerHTML = aTocar ? svg("M8 5v14M16 5v14") : svg("M7 4v16l13-8z", true);
      b.setAttribute("aria-label", aTocar ? "Pausa" : "Reproduzir");
      raiz.querySelector(".va").classList.toggle("a-tocar", aTocar);
    }

    raiz.addEventListener("click", (e) => {
      const cap = e.target.closest("[data-cap]");
      if (cap) return irPara(+cap.dataset.cap, 0);
      const b = e.target.closest("[data-va]"); if (!b) return;
      const a = b.dataset.va;
      if (a === "tocar") aTocar ? pausar() : tocar();
      if (a === "ant") irPara(fi > 0 ? ci : ci - 1, 0);
      if (a === "seg") irPara(ci + 1, 0);
      if (a === "vel") { vel = vel === 1 ? 1.25 : vel === 1.25 ? 1.5 : vel === 1.5 ? 0.8 : 1; b.textContent = vel + "×"; gravar(CHAVE_VEL, String(vel)); if (aTocar) falarAtual(); realcar(); }
      if (a === "cc") { legendas = !legendas; b.setAttribute("aria-pressed", String(legendas)); realcar(); }
      if (a === "ecra") { raiz.querySelector(".va").classList.toggle("cheio"); document.body.classList.toggle("va-aberto"); }
      if (a === "repetir") { irPara(0, 0); tocar(); }
      if (a === "quiz" && op.aoQuiz) { parar(); op.aoQuiz(); }
    });
    raiz.querySelector(".va").addEventListener("keydown", (e) => {
      if (e.target.tagName === "SELECT") return;
      if (e.key === " ") { e.preventDefault(); aTocar ? pausar() : tocar(); }
      if (e.key === "ArrowRight") irPara(ci + 1, 0);
      if (e.key === "ArrowLeft") irPara(ci - 1, 0);
      if (e.key === "Escape") { raiz.querySelector(".va").classList.remove("cheio"); document.body.classList.remove("va-aberto"); }
    });
    function parar() { aTocar = false; pararVoz(); document.body.classList.remove("va-aberto"); }
    desenharCena();
    return { parar, tocar };
  }

  window.VideoAula = { montar, temVoz };
})();
