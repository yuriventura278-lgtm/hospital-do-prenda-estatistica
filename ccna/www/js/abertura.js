/* Ecrã de abertura (proposta A): a imagem do curso monta-se como um puzzle de 16 peças e a barra
   de progresso é feita de 8 peças nas cores dos pares do cabo de rede. Corre enquanto a app carrega:
   na 1.ª abertura dura cerca de 2,5 s; depois, menos de 1 s. Com "reduzir movimento" só aparece a
   imagem e a barra a encher. Pode ser desligado nas Definições (ccna-abertura = "off"). */
(function () {
  "use strict";
  const ler = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const gravar = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* sem armazenamento */ } };
  const API = { fim() {}, ligar(on) { gravar("ccna-abertura", on ? "on" : "off"); }, ligado: () => ler("ccna-abertura") !== "off" };
  if (ler("ccna-abertura") === "off") { window.Abertura = API; return; }
  const primeira = !ler("ccna-abertura-vista");
  const reduz = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const CORES = ["#e9761b", "#1f5fe0", "#1c9a57", "#7a4fd6", "#9a6230", "#d43d4f", "#0e8a8a", "#c48a12"];
  const PASSOS = ["A abrir a app…", "A carregar as aulas…", "A recuperar o seu progresso…", "A preparar o simulador…", "A ligar os routers e switches…", "A gerar os exercícios…", "A calcular o seu plano de estudo…", "Pronto! Bons estudos."];
  const N = 8, W = 80, G = 4, T = 100, IMG = "icons/abertura.webp";

  // peça de puzzle: aresta reta (s = 0), com aba para fora (1) ou entalhe para dentro (-1)
  function aresta(x0, y0, x1, y1, s) {
    const ux = x1 - x0, uy = y1 - y0, nx = -uy, ny = ux;
    const p = (t, h) => `${(x0 + ux * t + nx * h).toFixed(1)} ${(y0 + uy * t + ny * h).toFixed(1)}`;
    if (!s) return `L${p(1, 0)}`;
    return `L${p(.36, 0)} C${p(.42, s * .12)} ${p(.28, s * .32)} ${p(.5, s * .32)} C${p(.72, s * .32)} ${p(.58, s * .12)} ${p(.64, 0)} L${p(1, 0)}`;
  }
  const peca = (x, y, w, h, t, r, b, l) => `M${x} ${y} ${aresta(x, y, x + w, y, t)} ${aresta(x + w, y, x + w, y + h, r)} ${aresta(x + w, y + h, x, y + h, b)} ${aresta(x, y + h, x, y, l)} Z`;

  let semente = 7; const rnd = () => (semente = (semente * 16807) % 2147483647) / 2147483647;
  const abas = []; for (let i = 0; i < G; i++) { abas[i] = []; for (let j = 0; j < G; j++) abas[i][j] = { d: rnd() > .5 ? 1 : -1, b: rnd() > .5 ? 1 : -1 }; }
  let defs = "", pecas = "";
  for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
    const t = i ? -abas[i - 1][j].b : 0, r = j < G - 1 ? abas[i][j].d : 0, b = i < G - 1 ? abas[i][j].b : 0, l = j ? -abas[i][j - 1].d : 0;
    const d = peca(j * T, i * T, T, T, t, r, b, l), k = i * G + j;
    defs += `<clipPath id="ab-pz${k}"><path d="${d}"/></clipPath>`;
    const ang = k * 2.4;
    pecas += `<g class="ab-peca" data-k="${k}" style="opacity:0;transform:translate(${Math.cos(ang) * 260}px,${Math.sin(ang) * 320}px) rotate(${(k % 2 ? 1 : -1) * 40}deg)"><g clip-path="url(#ab-pz${k})"><image href="${IMG}" width="400" height="400"/></g><path d="${d}" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1.2"/></g>`;
  }
  let barra = "";
  for (let k = 0; k < N; k++) barra += `<path class="ab-vazia" d="${peca(k * W, 0, W, 60, 0, k < N - 1 ? -1 : 0, 0, k ? 1 : 0)}"/>`;
  for (let k = 0; k < N; k++) barra += `<path class="ab-cheia fora" data-k="${k}" fill="${CORES[k]}" d="${peca(k * W, 0, W, 60, 0, k < N - 1 ? -1 : 0, 0, k ? 1 : 0)}"/>`;

  const el = document.createElement("div");
  el.id = "abertura"; el.setAttribute("role", "progressbar"); el.setAttribute("aria-label", "A carregar o Curso de Redes de Computadores"); el.setAttribute("aria-valuemin", "0"); el.setAttribute("aria-valuemax", "100");
  el.innerHTML = `<div class="ab-puzzle"><svg viewBox="0 0 400 400" aria-hidden="true"><defs>${defs}</defs>${pecas}</svg></div>
    <div class="ab-txt"><b>CURSO DE REDES DE COMPUTADORES</b><svg class="ab-barra" viewBox="-6 -6 652 72" aria-hidden="true">${barra}</svg><span class="ab-passo"></span><span class="ab-pct">0%</span></div>`;
  document.body.prepend(el);

  const ordem = [5, 0, 10, 15, 3, 12, 6, 9, 1, 14, 2, 13, 4, 11, 7, 8];
  let n = 0, pronto = false, acabou = false;
  function mostrar(k) {
    n = k;
    const pct = Math.round(k / N * 100);
    el.setAttribute("aria-valuenow", String(pct));
    el.querySelector(".ab-pct").textContent = pct + "%";
    el.querySelector(".ab-passo").textContent = PASSOS[Math.max(0, k - 1)];
    el.querySelectorAll(".ab-cheia").forEach((p) => p.classList.toggle("fora", +p.dataset.k >= k));
    const quantas = Math.round(k / N * 16);
    el.querySelectorAll(".ab-peca").forEach((p) => { if (ordem.indexOf(+p.dataset.k) < quantas) { p.style.opacity = "1"; p.style.transform = "none"; } });
  }
  function fechar() {
    if (acabou) return; acabou = true;
    gravar("ccna-abertura-vista", "1");
    el.classList.add("sair");
    setTimeout(() => el.remove(), reduz ? 0 : 450);
  }
  // avança as peças com o tempo; a última só encaixa quando a app está mesmo pronta
  const passo = reduz ? 60 : primeira ? 300 : 90;
  const relogio = setInterval(() => {
    if (n < N - 1) mostrar(n + 1);
    else if (pronto) { clearInterval(relogio); mostrar(N); setTimeout(fechar, reduz ? 0 : primeira ? 450 : 150); }
  }, passo);
  requestAnimationFrame(() => mostrar(1));
  // segurança: nunca fica preso no ecrã de abertura
  setTimeout(() => { pronto = true; }, 8000);
  setTimeout(fechar, 12000);

  // a app está pronta quando a página acabou de carregar (todos os scripts correram e o início foi desenhado)
  window.addEventListener("load", () => { pronto = true; });
  API.fim = () => { pronto = true; };
  window.Abertura = API;
})();
