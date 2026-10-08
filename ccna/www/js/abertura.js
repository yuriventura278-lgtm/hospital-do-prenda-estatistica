/* Ecrã de abertura: a imagem do curso monta-se como um puzzle de 16 peças e a barra de progresso é
   feita de 8 peças nas cores dos pares do cabo de rede.
   - Saudação com o nome e os dias seguidos de estudo; "Sabia que…?" diferente em cada abertura;
     rede animada no fundo; botão Saltar.
   - No fim mostra por instantes a aula de hoje, com o botão Continuar.
   - Animação completa só na 1.ª abertura do dia; nas outras é rápida (menos de 1 s).
   - Com "reduzir movimento" só aparece a imagem e a barra a encher. Som e vibração do encaixe opcionais.
   - Pode ser desligado nas Definições (ccna-abertura = "off"). */
(function () {
  "use strict";
  const ler = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const gravar = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* sem armazenamento */ } };
  const API = {
    fim() {}, ligar(on) { gravar("ccna-abertura", on ? "on" : "off"); }, ligado: () => ler("ccna-abertura") !== "off",
    som(on) { gravar("ccna-abertura-som", on ? "on" : "off"); }, temSom: () => ler("ccna-abertura-som") === "on",
  };
  if (ler("ccna-abertura") === "off") { window.Abertura = API; return; }
  const hoje = new Date().toISOString().slice(0, 10);
  const completa = ler("ccna-abertura-dia") !== hoje;      // 1.ª abertura do dia: animação completa
  const reduz = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const comSom = API.temSom();
  const CORES = ["#e9761b", "#1f5fe0", "#1c9a57", "#7a4fd6", "#9a6230", "#d43d4f", "#0e8a8a", "#c48a12"];
  const PASSOS = ["A abrir a app…", "A carregar as aulas…", "A recuperar o seu progresso…", "A preparar o simulador…", "A ligar os routers e switches…", "A gerar os exercícios…", "A calcular o seu plano de estudo…", "Pronto! Bons estudos."];
  const DICAS = [
    ["Sabia que…", "o endereço 127.0.0.1 é o próprio computador (loopback)?"],
    ["Dica de exame:", "uma /30 tem só 2 hosts — perfeita para ligações entre routers."],
    ["Sabia que…", "um switch aprende os MAC olhando para o endereço de ORIGEM de cada trama?"],
    ["Dica de exame:", "no fim de cada ACL há um “deny any” implícito: não aparece, mas existe."],
    ["Sabia que…", "um endereço 169.254.x.x (APIPA) quer dizer que o PC não encontrou servidor DHCP?"],
    ["Dica de exame:", "o OSPF usa a distância administrativa 110; uma rota estática usa 1."],
    ["Sabia que…", "o DHCP faz 4 passos: Discover, Offer, Request e Ack (DORA)?"],
    ["Dica de exame:", "a VLAN nativa de um trunk 802.1Q é a única que passa sem etiqueta."],
    ["Sabia que…", "o cabo de cobre UTP só garante 100 metros? Para mais, use fibra."],
    ["Dica de exame:", "número mágico = 256 − o octeto interessante da máscara."],
    ["Sabia que…", "o TTL de um pacote baixa 1 em cada router, para nunca andar em círculos para sempre?"],
    ["Dica de exame:", "com o STP, o switch com o menor Bridge ID é a root bridge."],
    ["Sabia que…", "o HTTP usa a porta 80, o HTTPS a 443, o SSH a 22 e o Telnet a 23?"],
    ["Dica de exame:", "o comando “copy running-config startup-config” guarda a configuração."],
    ["Sabia que…", "o ARP descobre o endereço MAC a partir do endereço IP, na mesma rede local?"],
    ["Dica de exame:", "privados: 10.0.0.0/8, 172.16.0.0/12 e 192.168.0.0/16 (RFC 1918)."],
    ["Sabia que…", "o NAT com overload (PAT) deixa centenas de PCs usarem um só IP público?"],
    ["Dica de exame:", "o HSRP usa um IP virtual: os PCs nem sabem qual router está ativo."],
    ["Sabia que…", "o ping usa ICMP: Echo Request (tipo 8) e Echo Reply (tipo 0)?"],
    ["Dica de exame:", "“no shutdown” liga a interface: os routers têm as portas desligadas por defeito."],
  ];
  const N = 8, W = 80, G = 4, T = 100, IMG = "icons/abertura.webp";

  // ---------------------------------------------------------------- dados do perfil (nome, dias seguidos)
  let perfil = null;
  try { const s = JSON.parse(ler("ccna-passo-a-passo-v1") || "null"); perfil = s && s.perfis && s.perfis[s.ativo]; } catch (e) { perfil = null; }
  function seguidos(dias) {
    const d = new Set(dias || []); let n = 0; const dia = new Date();
    if (!d.has(dia.toISOString().slice(0, 10))) dia.setDate(dia.getDate() - 1);
    while (d.has(dia.toISOString().slice(0, 10))) { n++; dia.setDate(dia.getDate() - 1); }
    return n;
  }
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const h = new Date().getHours(), cumprimento = h < 12 ? "Bom dia" : h < 19 ? "Boa tarde" : "Boa noite";
  const nome = perfil && perfil.onboard && perfil.nome && perfil.nome !== "Estudante" ? perfil.nome.split(" ")[0] : "";
  const serie = perfil ? seguidos(perfil.dias) : 0;
  const saudacao = nome ? `${cumprimento}, ${esc(nome)}${serie > 1 ? ` · 🔥 ${serie} dias seguidos` : ""}` : `${cumprimento}! Bem-vindo ao curso`;
  const nd = (+(ler("ccna-abertura-dica") || "0") + 1) % DICAS.length; gravar("ccna-abertura-dica", String(nd));

  // ---------------------------------------------------------------- desenho
  function aresta(x0, y0, x1, y1, s) {
    const ux = x1 - x0, uy = y1 - y0, nx = -uy, ny = ux;
    const p = (t, h2) => `${(x0 + ux * t + nx * h2).toFixed(1)} ${(y0 + uy * t + ny * h2).toFixed(1)}`;
    if (!s) return `L${p(1, 0)}`;
    return `L${p(.36, 0)} C${p(.42, s * .12)} ${p(.28, s * .32)} ${p(.5, s * .32)} C${p(.72, s * .32)} ${p(.58, s * .12)} ${p(.64, 0)} L${p(1, 0)}`;
  }
  const peca = (x, y, w, h2, t, r, b, l) => `M${x} ${y} ${aresta(x, y, x + w, y, t)} ${aresta(x + w, y, x + w, y + h2, r)} ${aresta(x + w, y + h2, x, y + h2, b)} ${aresta(x, y + h2, x, y, l)} Z`;
  let semente = 7; const rnd = () => (semente = (semente * 16807) % 2147483647) / 2147483647;
  const abas = []; for (let i = 0; i < G; i++) { abas[i] = []; for (let j = 0; j < G; j++) abas[i][j] = { d: rnd() > .5 ? 1 : -1, b: rnd() > .5 ? 1 : -1 }; }
  let defs = "", pecas = "";
  for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
    const t = i ? -abas[i - 1][j].b : 0, r = j < G - 1 ? abas[i][j].d : 0, b = i < G - 1 ? abas[i][j].b : 0, l = j ? -abas[i][j - 1].d : 0;
    const d = peca(j * T, i * T, T, T, t, r, b, l), k = i * G + j, ang = k * 2.4;
    defs += `<clipPath id="ab-pz${k}"><path d="${d}"/></clipPath>`;
    pecas += `<g class="ab-peca" data-k="${k}" style="opacity:0;transform:translate(${Math.cos(ang) * 260}px,${Math.sin(ang) * 320}px) rotate(${(k % 2 ? 1 : -1) * 40}deg)"><g clip-path="url(#ab-pz${k})"><image href="${IMG}" width="400" height="400"/></g><path d="${d}" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1.2"/></g>`;
  }
  let barra = "";
  for (let k = 0; k < N; k++) barra += `<path class="ab-vazia" d="${peca(k * W, 0, W, 60, 0, k < N - 1 ? -1 : 0, 0, k ? 1 : 0)}"/>`;
  for (let k = 0; k < N; k++) barra += `<path class="ab-cheia fora" data-k="${k}" fill="${CORES[k]}" d="${peca(k * W, 0, W, 60, 0, k < N - 1 ? -1 : 0, 0, k ? 1 : 0)}"/>`;
  // rede de fundo: nós e cabos, com pacotes a viajar
  const NOS = [[6, 12], [40, 7], [88, 14], [10, 90], [46, 95], [92, 86], [3, 50], [97, 52]], ARESTAS = [[0, 1], [1, 2], [3, 4], [4, 5], [0, 6], [6, 3], [2, 7], [7, 5]];
  const rede = ARESTAS.map(([a, b], k) => `<line x1="${NOS[a][0]}" y1="${NOS[a][1]}" x2="${NOS[b][0]}" y2="${NOS[b][1]}" stroke="${CORES[k % 6]}" stroke-width=".35" opacity=".75"/>`).join("") +
    NOS.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1" fill="#fff" opacity=".8"/>`).join("") + ARESTAS.map((_, k) => `<circle r=".8" fill="#ffd166" class="ab-pk" data-k="${k}"/>`).join("");

  const el = document.createElement("div");
  el.id = "abertura"; el.setAttribute("role", "progressbar"); el.setAttribute("aria-label", "A carregar o Curso de Redes de Computadores"); el.setAttribute("aria-valuemin", "0"); el.setAttribute("aria-valuemax", "100");
  el.innerHTML = `<svg class="ab-rede" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${rede}</svg>
    <button class="ab-saltar" type="button">Saltar ›</button>
    <div class="ab-saud">${saudacao}</div>
    <div class="ab-puzzle"><svg viewBox="0 0 400 400" aria-hidden="true"><defs>${defs}</defs>${pecas}</svg></div>
    <div class="ab-txt"><b>CURSO DE REDES DE COMPUTADORES</b><svg class="ab-barra" viewBox="-6 -6 652 72" aria-hidden="true">${barra}</svg>
      <span class="ab-passo"></span><span class="ab-pct">0%</span><p class="ab-dica"><i>${DICAS[nd][0]}</i> ${DICAS[nd][1]}</p></div>
    <div class="ab-final" hidden></div>`;
  document.body.prepend(el);

  // pacotes a andar nos cabos de fundo
  const t0 = performance.now();
  (function anima(t) {
    if (!el.isConnected) return;
    el.querySelectorAll(".ab-pk").forEach((c) => { const k = +c.dataset.k, [a, b] = ARESTAS[k], f = ((t - t0) / 1800 + k * 0.37) % 1; c.setAttribute("cx", NOS[a][0] + (NOS[b][0] - NOS[a][0]) * f); c.setAttribute("cy", NOS[a][1] + (NOS[b][1] - NOS[a][1]) * f); });
    if (!reduz) requestAnimationFrame(anima);
  })(t0);

  // som e vibração do encaixe (opcionais)
  let audio = null;
  function encaixe() {
    if (!comSom) return;
    try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) { /* sem vibração */ }
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = "triangle"; o.frequency.value = 520 + n * 40; g.gain.setValueAtTime(0.08, audio.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.09);
      o.connect(g).connect(audio.destination); o.start(); o.stop(audio.currentTime + 0.1);
    } catch (e) { /* sem som */ }
  }

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
    if (k > 0) encaixe();
  }
  function fechar() {
    if (acabou) return; acabou = true;
    clearInterval(relogio);
    gravar("ccna-abertura-dia", hoje);
    el.classList.add("sair");
    setTimeout(() => el.remove(), reduz ? 0 : 450);
  }
  // Próxima aula por fazer (a 1.ª do percurso ainda sem quiz ≥ 70 %)
  function aulaDeHoje() {
    const C = window.CCNA; if (!C || !perfil || !perfil.onboard) return null;
    const feitas = perfil.licoes || {};
    for (const m of C.modulos) for (const l of m.licoes) if (!((feitas[l.id] || {}).melhor >= 70)) return { m, l };
    return null;
  }
  function cartaoFinal() {
    const a = aulaDeHoje(), f = el.querySelector(".ab-final");
    if (!a || !completa) return false;
    f.innerHTML = `<div class="ab-cart"><span>Hoje no seu plano</span><b>${esc(a.m.codigo)} · ${esc(a.l.titulo)}</b><span>${esc(a.l.minutos || 20)} min${a.m.titulo !== a.l.titulo ? " · " + esc(a.m.titulo) : ""}</span></div><button class="ab-continuar" type="button">Continuar a estudar</button>`;
    f.hidden = false; el.classList.add("com-final"); requestAnimationFrame(() => f.classList.add("on"));
    f.querySelector(".ab-continuar").onclick = () => {
      const b = document.createElement("button"); b.hidden = true; b.dataset.acao = "licao"; b.dataset.id = a.l.id;
      document.body.appendChild(b); b.click(); b.remove(); fechar();
    };
    return true;
  }
  // avança as peças com o tempo; a última só encaixa quando a app está mesmo pronta
  const passo = reduz ? 60 : completa ? 300 : 80;
  const relogio = setInterval(() => {
    if (n < N - 1) mostrar(n + 1);
    else if (pronto) {
      clearInterval(relogio); mostrar(N);
      setTimeout(() => { if (cartaoFinal()) setTimeout(fechar, 1800); else fechar(); }, reduz ? 0 : completa ? 450 : 120);
    }
  }, passo);
  requestAnimationFrame(() => mostrar(1));
  el.querySelector(".ab-saltar").onclick = fechar;
  // segurança: nunca fica preso no ecrã de abertura
  setTimeout(() => { pronto = true; }, 8000);
  setTimeout(fechar, 14000);
  window.addEventListener("load", () => { pronto = true; });
  API.fim = () => { pronto = true; };
  window.Abertura = API;
})();
