/* Assistente de leitura: lê a aula inteira em voz alta, de forma contínua.
   O texto vem de conteudo/narracao.py (leitura_da_licao): trechos de algumas frases,
   já preparados para a voz pronunciar bem (siglas, IPs, comandos Cisco).
   Para não haver pausas entre trechos, o trecho seguinte é posto na fila da voz
   antes de o atual acabar (a voz encadeia-os sem silêncio). */
(function () {
  "use strict";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const CHAVE_VOZ = "ccna-voz", CHAVE_VEL = "ccna-leitor-vel";
  const ler = (k, d) => { try { return localStorage.getItem(k) || d; } catch (e) { return d; } };
  const gravar = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* sem armazenamento */ } };
  const temVoz = typeof window.speechSynthesis !== "undefined" && typeof window.SpeechSynthesisUtterance !== "undefined";
  const VELS = [0.85, 1, 1.15, 1.3, 1.5];

  function vozesPT() {
    if (!temVoz) return [];
    const p = (v) => (/natural|neural|online|premium|enhanced|google/i.test(v.name) ? 4 : 0) + (/pt[-_]PT/i.test(v.lang) ? 2 : 0) + (v.localService ? 1 : 0);
    return speechSynthesis.getVoices().filter((v) => /^pt/i.test(v.lang)).sort((a, b) => p(b) - p(a));
  }

  // barra: elemento onde se desenha o leitor; opcoes.aoTrecho(trecho) para realçar o bloco
  function montar(barra, licao, opcoes) {
    const T = licao.leitura || [], op = opcoes || {};
    let i = 0, aTocar = false, vel = +ler(CHAVE_VEL, "1"), vozNome = ler(CHAVE_VOZ, ""), fila = 0, geracao = 0, vigia = null;

    barra.innerHTML = `<div class="leitor" role="region" aria-label="Assistente de leitura">
      <div class="leitor-topo"><b>Assistente de leitura</b><span class="peq suave tab-num" id="lt-pos"></span><button class="btn-copiar" data-lt="fechar" aria-label="Fechar o assistente">Fechar</button></div>
      <p class="leitor-txt" id="lt-txt" aria-live="off"></p>
      <div class="leitor-ctl">
        <button data-lt="ant" aria-label="Trecho anterior">⏮</button>
        <button data-lt="tocar" class="leitor-play" aria-label="Ler">▶</button>
        <button data-lt="seg" aria-label="Trecho seguinte">⏭</button>
        <button data-lt="vel" class="leitor-vel" aria-label="Velocidade">${vel}×</button>
        <select id="lt-voz" aria-label="Voz"></select>
      </div>
      <div class="barra"><i id="lt-barra"></i></div>
      <p class="peq suave" id="lt-aviso"></p></div>`;
    const $ = (s) => barra.querySelector(s);

    function preencherVozes() {
      const vs = vozesPT(), sel = $("#lt-voz");
      if (!vs.length) { sel.hidden = true; $("#lt-aviso").textContent = temVoz ? "Este dispositivo não tem voz portuguesa instalada. Instale-a nas definições (Android: Sistema › Idioma › Conversão de texto em voz; iPhone: Acessibilidade › Conteúdo falado › Vozes)." : "Este navegador não tem síntese de voz."; return; }
      if (!vs.some((v) => v.name === vozNome)) vozNome = vs[0].name;
      sel.hidden = false; $("#lt-aviso").textContent = "";
      sel.innerHTML = vs.map((v) => `<option value="${esc(v.name)}" ${v.name === vozNome ? "selected" : ""}>${esc(v.name.replace(/Microsoft |Google /, ""))} (${esc(v.lang)})</option>`).join("");
    }
    if (temVoz) { if (speechSynthesis.addEventListener) speechSynthesis.addEventListener("voiceschanged", preencherVozes); else speechSynthesis.onvoiceschanged = preencherVozes; }
    preencherVozes();

    function mostrar() {
      const t = T[i];
      $("#lt-txt").textContent = t ? t.t : "Fim da aula.";
      $("#lt-pos").textContent = `${Math.min(i + 1, T.length)}/${T.length}`;
      $("#lt-barra").style.width = (T.length ? (i / T.length) * 100 : 0) + "%";
      $("[data-lt=tocar]").textContent = aTocar ? "⏸" : "▶";
      $("[data-lt=tocar]").setAttribute("aria-label", aTocar ? "Pausa" : "Ler");
      if (t && op.aoTrecho) op.aoTrecho(t);
    }
    function utter(k, g) {
      const voz = vozesPT().find((v) => v.name === vozNome) || vozesPT()[0];
      const u = new SpeechSynthesisUtterance(T[k].f);
      if (voz) { u.voice = voz; u.lang = voz.lang; } else u.lang = "pt-PT";
      u.rate = vel; u.pitch = 1;
      u.onstart = () => { if (g !== geracao) return; i = k; mostrar(); vigiar(k, g); };
      u.onend = () => { if (g !== geracao) return; fila--; if (k === T.length - 1) { aTocar = false; i = T.length; mostrar(); if (op.aoFim) op.aoFim(); return; } encher(g); };
      u.onerror = (e) => { if (g !== geracao || e.error === "interrupted" || e.error === "canceled") return; fila--; encher(g); };
      return u;
    }
    // mantém 2 trechos na fila: o que está a ser lido e o seguinte (sem silêncio entre eles)
    let proximo = 0;
    function encher(g) {
      while (aTocar && g === geracao && fila < 2 && proximo < T.length) { speechSynthesis.speak(utter(proximo, g)); proximo++; fila++; }
    }
    // alguns navegadores param sem avisar: se a voz ficou calada, retoma no trecho atual
    function vigiar(k, g) {
      clearTimeout(vigia);
      vigia = setTimeout(() => { if (aTocar && g === geracao && !speechSynthesis.speaking && i === k) tocar(k); }, (T[k].f.split(/\s+/).length / 2.2) * 1000 / vel + 5000);
    }
    function tocar(desde) {
      if (!temVoz || !vozesPT().length && !speechSynthesis.getVoices().length) { aTocar = false; mostrar(); return; }
      speechSynthesis.cancel();
      geracao++; fila = 0; aTocar = true;
      i = Math.max(0, Math.min(T.length - 1, desde)); proximo = i;
      mostrar(); encher(geracao);
    }
    function parar() { aTocar = false; geracao++; clearTimeout(vigia); if (temVoz) speechSynthesis.cancel(); mostrar(); }

    barra.addEventListener("click", (e) => {
      const b = e.target.closest("[data-lt]"); if (!b) return;
      const a = b.dataset.lt;
      if (a === "tocar") { if (aTocar) parar(); else tocar(i >= T.length ? 0 : i); }
      if (a === "ant") { const k = Math.max(0, i - 1); aTocar ? tocar(k) : (i = k, mostrar()); }
      if (a === "seg") { const k = Math.min(T.length - 1, i + 1); aTocar ? tocar(k) : (i = k, mostrar()); }
      if (a === "vel") { vel = VELS[(VELS.indexOf(vel) + 1) % VELS.length] || 1; gravar(CHAVE_VEL, String(vel)); b.textContent = vel + "×"; if (aTocar) tocar(i); }
      if (a === "fechar") { parar(); if (op.aoFechar) op.aoFechar(); }
    });
    $("#lt-voz").addEventListener("change", (e) => { vozNome = e.target.value; gravar(CHAVE_VOZ, vozNome); if (aTocar) tocar(i); });
    mostrar();
    return {
      // começa a ler a partir do primeiro trecho de um bloco
      lerBloco(b) { const k = T.findIndex((t) => t.b === b); if (k >= 0) tocar(k); },
      tocar: () => tocar(i), parar,
    };
  }

  window.Leitor = { montar, temVoz };
})();
