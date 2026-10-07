/* Sala de laboratório: bancadas com equipamento "físico".
   Aqui o aluno faz o que se faz com as mãos num laboratório real: escolher o
   cabo, ligá-lo na porta certa, ligar a alimentação, ver as luzes, ligar o cabo
   de consola e abrir o PuTTY, configurar a placa de rede no Windows, testar cabos
   com o testador, usar a tomada de parede e o patch panel e partilhar uma pasta.
   Cada bancada tem passos com verificação automática. */
(function () {
  "use strict";
  const F = window.Figuras, S = window.Simulador, IOS = window.IOS;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const W = 1000, H = 600;

  const CABOS = {
    direto: { nome: "Cabo direto (patch cord)", cor: "#2f6fd1", desc: "T568B nas duas pontas. Liga equipamentos diferentes: PC–switch, switch–router, tomada–PC." },
    cruzado: { nome: "Cabo cruzado", cor: "#e08a00", desc: "T568A numa ponta e T568B na outra. Liga equipamentos iguais: switch–switch, PC–PC, router–router." },
    consola: { nome: "Cabo de consola (USB ↔ RJ45)", cor: "#4fb3d9", desc: "Cabo azul e chato. USB no PC e RJ45 na porta CONSOLE do router ou switch, para configurar." },
    energia: { nome: "Cabo de alimentação", cor: "#222", desc: "Liga o equipamento à corrente elétrica." },
  };

  // ------------------------------------------------------------ desenho dos equipamentos e portas
  // Cada tipo devolve { w, h, svg, portas: [{ id, x, y, tipo, rotulo }], tinta? } em coordenadas locais.
  // Os desenhos imitam a frente/traseira dos equipamentos reais (Catalyst 2960, ISR 4331, torre de PC,
  // tomada de parede com keystone, patch panel de 1U). "tinta" é a cor dos rótulos das portas.
  const rep = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join("");
  // grelha de ventilação em favo (círculos)
  const favo = (x, y, w, h, passo, cor) => {
    let s = "";
    for (let j = 0, yy = y + passo / 2; yy < y + h; j++, yy += passo * 0.87)
      for (let xx = x + passo / 2 + (j % 2) * passo / 2; xx < x + w; xx += passo) s += `<circle cx="${xx.toFixed(1)}" cy="${yy.toFixed(1)}" r="${(passo * 0.32).toFixed(1)}"/>`;
    return `<g fill="${cor}">${s}</g>`;
  };
  const parafuso = (x, y) => `<circle cx="${x}" cy="${y}" r="4" fill="#aab2bb" stroke="#5d6672"/><path d="M${x - 2.4} ${y} h4.8 M${x} ${y - 2.4} v4.8" stroke="#5d6672" stroke-width="1.2"/>`;
  // ficha de alimentação IEC C14 (tomada do cabo de corrente)
  const iec = (x, y) => `<path d="M${x} ${y + 5} l5 -5 h22 l5 5 v16 h-32z" fill="#0b0d10" stroke="#59616b" stroke-width="1.5"/><g fill="#9aa3ad"><rect x="${x + 7}" y="${y + 8}" width="3" height="8"/><rect x="${x + 14.5}" y="${y + 5}" width="3" height="8"/><rect x="${x + 22}" y="${y + 8}" width="3" height="8"/></g>`;
  const DESENHO = {
    pc(d, st) {
      const on = st.energia[d.id];
      return { w: 150, h: 220, svg: `<rect width="150" height="220" rx="8" fill="#2f343b" stroke="#16191d" stroke-width="2"/><rect x="4" y="4" width="142" height="212" rx="6" fill="none" stroke="#454b54"/>
        <text x="75" y="22" class="lb-t"${d.nome.length > 10 ? ' style="font-size:11px"' : ""}>${esc(d.nome)} · traseira</text>
        <rect x="14" y="32" width="122" height="44" rx="4" fill="#1d2025" stroke="#4a5059"/>
        <circle cx="44" cy="54" r="17" fill="#121417"/>${favo(28, 38, 32, 32, 5, "#2f343b")}<circle cx="44" cy="54" r="17" fill="none" stroke="#5b626c" stroke-width="2"/>
        ${iec(78, 42)}<rect x="116" y="44" width="12" height="20" rx="2" fill="#111" stroke="#59616b"/><text x="122" y="58" class="lb-mini" style="font-size:9px">I/O</text>
        <text x="75" y="86" class="lb-mini">fonte de alimentação</text>
        <rect x="14" y="92" width="96" height="50" rx="3" fill="#b9c0c8" stroke="#7d8690"/>
        ${rep(4, (i) => `<rect x="${22 + (i % 2) * 18}" y="${100 + Math.floor(i / 2) * 12}" width="14" height="7" rx="1" fill="#2563c9" stroke="#0b0d10"/>`)}
        <rect x="62" y="98" width="30" height="12" rx="2" fill="#1f2328"/><text x="77" y="107" style="font:700 7px var(--f-mono);fill:#cfd6de;text-anchor:middle">HDMI</text>
        ${["#7ac943", "#f28cb1", "#4fb3d9"].map((c, i) => `<circle cx="${68 + i * 12}" cy="128" r="4.5" fill="${c}" stroke="#2a2e33" stroke-width="1.5"/>`).join("")}
        <rect x="14" y="148" width="122" height="60" rx="3" fill="#22262c" stroke="#4a5059"/>
        <rect x="30" y="152" width="44" height="34" rx="2" fill="#8f98a3"/><rect x="82" y="152" width="44" height="34" rx="2" fill="#8f98a3"/>
        ${rep(5, (i) => `<rect x="${18 + i * 24}" y="210" width="18" height="4" rx="1" fill="#454b54"/>`)}
        <g data-energia="${d.id}" style="cursor:pointer"><circle cx="128" cy="117" r="14" class="lb-botao ${on ? "on" : ""}"/><path d="M128 109 v8 M122 113 a8 8 0 1 0 12 0" class="lb-simb" pointer-events="none"/></g>`,
        portas: [{ id: "nic", x: 52, y: 170, tipo: "rj45", rotulo: "Rede" }, { id: "usb", x: 104, y: 170, tipo: "usb", rotulo: "USB" }] };
    },
    switch(d, st) {
      const n = d.portas || 8, portas = [], on = st.energia[d.id];
      for (let k = 1; k <= n; k++) portas.push({ id: "p" + k, x: 60 + (k - 1) * 52, y: 52, tipo: "rj45", rotulo: String(k), led: true });
      portas.push({ id: "con", x: 60 + n * 52 + 30, y: 52, tipo: "con", rotulo: "CON" });
      const w = 60 + n * 52 + 90, xf = 60 + (n - 1) * 52 + 22;
      return { w, h: 92, tinta: "#1d2733", svg: `<rect x="-14" y="2" width="18" height="88" rx="2" fill="#aab3bd" stroke="#6b7682"/><rect x="${w - 4}" y="2" width="18" height="88" rx="2" fill="#aab3bd" stroke="#6b7682"/>
        <ellipse cx="-5" cy="22" rx="3.5" ry="6" fill="#4a5360"/><ellipse cx="-5" cy="70" rx="3.5" ry="6" fill="#4a5360"/><ellipse cx="${w + 5}" cy="22" rx="3.5" ry="6" fill="#4a5360"/><ellipse cx="${w + 5}" cy="70" rx="3.5" ry="6" fill="#4a5360"/>
        <rect width="${w}" height="92" rx="4" fill="#c9d1d9" stroke="#6b7682" stroke-width="2"/><rect x="2" y="2" width="${w - 4}" height="5" fill="#e6ebf0"/><rect x="2" y="84" width="${w - 4}" height="6" fill="#aeb8c2"/>
        <text x="10" y="20" class="lb-t lb-esq" style="fill:#1d2733">${esc(d.nome)} · Catalyst 2960 (frente)</text>
        <rect x="4" y="28" width="30" height="52" rx="3" fill="#3e5a73"/>
        ${["SYST", "STAT", "DPLX", "SPD"].map((t, i) => `<circle cx="10" cy="${36 + i * 10}" r="3" class="lb-led ${on && i < 2 ? "verde" : ""}"/><text x="15" y="${38.5 + i * 10}" style="font:700 6px var(--f-mono);fill:#d6e2ee">${t}</text>`).join("")}
        <rect x="34" y="34" width="${xf - 34 + 6}" height="44" rx="3" fill="#8794a1"/>
        <rect x="${60 + n * 52 + 10}" y="34" width="40" height="44" rx="3" fill="#8794a1"/>
        <text x="${w - 22}" y="16" style="font:800 9px var(--f-body);fill:#1d2733;text-anchor:middle">cisco</text>
        <g data-energia="${d.id}" style="cursor:pointer"><rect x="${w - 40}" y="54" width="32" height="26" rx="3" class="lb-tomada-e ${on ? "on" : ""}"/><g pointer-events="none" transform="translate(${w - 40} 54) scale(1 1.15)">${iec(0, 0)}</g></g>
        <circle cx="${w - 22}" cy="34" r="5" class="lb-led ${on ? "verde" : ""}"/><text x="${w - 22}" y="48" style="font:700 8px var(--f-mono);fill:#1d2733;text-anchor:middle">PWR</text>`, portas };
    },
    router(d, st) {
      const on = st.energia[d.id];
      const portas = [{ id: "g0", x: 70, y: 56, tipo: "rj45", rotulo: "G0/0/0" }, { id: "g1", x: 140, y: 56, tipo: "rj45", rotulo: "G0/0/1" }, { id: "con", x: 230, y: 56, tipo: "con", rotulo: "CONSOLE" }, { id: "aux", x: 300, y: 56, tipo: "aux", rotulo: "AUX" }];
      return { w: 430, h: 96, svg: `<rect width="430" height="96" rx="5" fill="#25292f" stroke="#0f1114" stroke-width="2"/><rect x="2" y="2" width="426" height="5" fill="#3d434b"/>
        <text x="10" y="18" class="lb-t lb-esq">${esc(d.nome)} · ISR 4331 (traseira)</text>
        <rect x="8" y="26" width="34" height="62" rx="2" fill="#16181c"/>${favo(8, 26, 34, 62, 6, "#33383f")}
        <rect x="46" y="28" width="290" height="62" rx="3" fill="#2f343b" stroke="#454c55"/>
        <rect x="186" y="32" width="2" height="54" fill="#454c55"/>
        <text x="105" y="40" style="font:700 8px var(--f-mono);fill:#aab2bc;text-anchor:middle">GE 10/100/1000</text>
        <rect x="318" y="44" width="12" height="7" rx="1" fill="#9aa1aa"/><text x="324" y="40" style="font:700 7px var(--f-mono);fill:#aab2bc;text-anchor:middle">USB</text>
        <rect x="342" y="10" width="82" height="80" rx="3" fill="#1b1e22" stroke="#454c55"/>${favo(346, 14, 22, 72, 5, "#33383f")}
        <text x="400" y="26" style="font:700 8px var(--f-mono);fill:#aab2bc;text-anchor:middle">PSU</text>
        <g data-energia="${d.id}" style="cursor:pointer"><rect x="374" y="34" width="40" height="36" rx="4" class="lb-interruptor ${on ? "on" : ""}"/>
        <rect x="384" y="${on ? 39 : 51}" width="20" height="14" rx="2" fill="${on ? "#c8312f" : "#3a3f46"}" pointer-events="none"/><text x="394" y="${on ? 50 : 62}" class="lb-t" pointer-events="none" style="font-size:11px">${on ? "I" : "O"}</text></g>
        <text x="394" y="86" class="lb-mini">interruptor</text>
        <circle cx="200" cy="46" r="5" class="lb-led ${on ? "verde" : ""}"/><text x="200" y="62" style="font:700 8px var(--f-mono);fill:#aab2bc;text-anchor:middle">SYS</text>
        <text x="265" y="38" style="font:800 10px var(--f-body);fill:#cfd6de;text-anchor:middle">cisco</text>`, portas };
    },
    tomada(d) {
      const ts = d.tomadas || ["A-07"];
      return { w: 120, h: 130, tinta: "#333", svg: `<rect width="120" height="130" rx="10" class="lb-parede"/><rect x="2" y="2" width="116" height="6" rx="4" fill="#fff" opacity=".7"/><text x="60" y="20" class="lb-t">${esc(d.nome)}</text>
        ${ts.map((t, k) => `<rect x="30" y="${34 + k * 44}" width="60" height="40" rx="6" fill="#fbfaf6" stroke="#b9b4a3"/><rect x="40" y="${38 + k * 44}" width="40" height="32" rx="3" fill="#e8e5dc" stroke="#c7c2b2"/>`).join("")}
        ${parafuso(60, 28)}${parafuso(60, 34 + ts.length * 44 + 2)}`,
        portas: ts.map((t, k) => ({ id: t, x: 60, y: 54 + k * 44, tipo: "rj45", rotulo: t })) };
    },
    patch(d) {
      const n = 12, portas = [];
      for (let k = 1; k <= n; k++) portas.push({ id: "pp" + k, x: 40 + (k - 1) * 40, y: 46, tipo: "rj45", rotulo: String(k).padStart(2, "0") });
      const w = 40 + n * 40;
      return { w, h: 76, svg: `<rect x="-12" y="2" width="16" height="72" rx="2" fill="#3a3f46" stroke="#111"/><rect x="${w - 4}" y="2" width="16" height="72" rx="2" fill="#3a3f46" stroke="#111"/>
        <ellipse cx="-4" cy="38" rx="3" ry="6" fill="#0b0d10"/><ellipse cx="${w + 4}" cy="38" rx="3" ry="6" fill="#0b0d10"/>
        <rect width="${w}" height="76" rx="3" class="lb-patch"/><rect x="2" y="2" width="${w - 4}" height="4" fill="#454b54"/>
        <text x="10" y="16" class="lb-t lb-esq">${esc(d.nome)} · patch panel (as portas ligam às tomadas A-01…A-12)</text>
        ${rep(2, (g) => `<rect x="${22 + g * 240}" y="26" width="236" height="7" rx="1" fill="#f3f1ea"/>`)}`, portas };
    },
    testador(d, st) {
      const t = st.teste, leds = (lado) => [0, 1, 2, 3, 4, 5, 6, 7].map((k) => {
        const aceso = t && t.passo > k && (lado === "a" ? true : t.mapa[k] != null);
        return `<circle cx="${30 + k * 20}" cy="${lado === "a" ? 50 : 132}" r="7" class="lb-led ${aceso ? "verde" : ""}"/><text x="${30 + k * 20}" y="${lado === "a" ? 70 : 152}" class="lb-mini">${lado === "a" ? k + 1 : t && t.passo > k && t.mapa[k] != null ? t.mapa[k] + 1 : k + 1}</text>`;
      }).join("");
      const corpo = (y) => `<rect y="${y}" width="200" height="84" rx="12" fill="#f2c230" stroke="#8a6a00" stroke-width="2"/><rect x="8" y="${y + 26}" width="166" height="52" rx="6" fill="#2b2f36"/>`;
      return { w: 200, h: 180, svg: `${corpo(0)}<text x="88" y="19" class="lb-t" style="fill:#222;font-size:12px">Testador · unidade principal</text>${leds("a")}
        ${corpo(96)}<text x="100" y="114" class="lb-t" style="fill:#222">Unidade remota</text>${leds("b")}`,
        portas: [{ id: "a", x: 186, y: 30, tipo: "rj45", rotulo: "" }, { id: "b", x: 186, y: 150, tipo: "rj45", rotulo: "" }] };
    },
  };
  // interior da ficha (só decoração, não recebe toques): contactos do RJ45 e entalhe da patilha, ou a língua do USB
  function tomadaPorta(p) {
    const x = p.x, y = p.y;
    if (p.tipo === "usb") return `<rect x="${x - 10}" y="${y - 3}" width="20" height="6" rx="1" fill="#d7dce2" pointer-events="none"/>`;
    const fio = p.tipo === "con" ? "#0d3a4d" : "#c9a227";
    return `<path d="M${x - 5} ${y + 12} v-5 h-4 M${x + 5} ${y + 12} v-5 h4" fill="none" stroke="#8e9aa6" stroke-width="1.2" pointer-events="none"/>` +
      `<g fill="${fio}" pointer-events="none">${[0, 1, 2, 3, 4, 5, 6, 7].map((k) => `<rect x="${x - 10.5 + k * 3}" y="${y - 10}" width="1.6" height="5"/>`).join("")}</g>`;
  }
  const geo = (d, st) => DESENHO[d.tipo](d, st);
  function posPorta(bc, st, ref) {
    const [id, p] = ref.split("."), d = bc.devs.find((x) => x.id === id); if (!d) return null;
    const g = geo(d, st), q = g.portas.find((x) => x.id === p); if (!q) return null;
    return { x: d.x + q.x, y: d.y + q.y, tipo: q.tipo, dev: d, porta: q };
  }
  const cabosEm = (st, ref) => st.cabos.filter((c) => c.a === ref || c.b === ref);
  const ligados = (st, a, b, tipo) => st.cabos.some((c) => ((c.a.startsWith(a) && c.b.startsWith(b)) || (c.a.startsWith(b) && c.b.startsWith(a))) && (!tipo || c.tipo === tipo));
  const outraPonta = (st, ref) => { const c = cabosEm(st, ref)[0]; return c ? { ref: c.a === ref ? c.b : c.a, cabo: c } : null; };

  // Luz de uma porta do switch: apagada, laranja (a arrancar: STP ~ 30 s, aqui 3 s) ou verde.
  function chegaA(bc, st, ref, visto) {
    // segue cabo → (tomada ↔ patch panel pela cablagem estruturada) até um equipamento ligado
    visto = visto || new Set(); if (visto.has(ref)) return null; visto.add(ref);
    const o = outraPonta(st, ref); if (!o || o.cabo.tipo === "consola" || o.cabo.tipo === "energia") return null;
    const [id, p] = o.ref.split("."), d = bc.devs.find((x) => x.id === id);
    if (d.tipo === "patch") { const n = +p.slice(2), t = bc.devs.find((x) => x.tipo === "tomada"); if (!t) return null; const tom = (t.tomadas || []).find((x) => +x.split("-")[1] === n); return tom ? chegaA(bc, st, t.id + "." + tom, visto) : null; }
    if (d.tipo === "tomada") { const n = +p.split("-")[1], pp = bc.devs.find((x) => x.tipo === "patch"); return pp ? chegaA(bc, st, pp.id + ".pp" + n, visto) : null; }
    return { d, porta: p, cabo: o.cabo };
  }
  function luz(bc, st, swId, porta) {
    if (!st.energia[swId]) return "";
    const fim = chegaA(bc, st, swId + "." + porta);
    if (!fim || !st.energia[fim.d.id] || !["rj45"].includes(posPorta(bc, st, fim.d.id + "." + fim.porta).tipo)) return "";
    const k = swId + "." + porta, t0 = st.desde[k] || (st.desde[k] = Date.now());
    return Date.now() - t0 < 3000 ? "laranja" : "verde";
  }

  // ------------------------------------------------------------ bancadas
  const PC = (id, nome, x, y) => ({ id, tipo: "pc", nome, x, y });
  const BANCADAS = [
    { id: "b1", titulo: "Ligar dois PCs a um switch", nivel: "básico", modulo: "itn4",
      cenario: "Na bancada 1 há um switch e dois PCs desligados. Monte a pequena rede como faria na sala de aula de uma escola.",
      devs: [{ id: "sw", tipo: "switch", nome: "SW-LAB1", x: 200, y: 30 }, PC("pc1", "PC1", 150, 260), PC("pc2", "PC2", 650, 260)],
      passos: [
        { texto: "Escolha o cabo certo e ligue a placa de rede do PC1 a uma porta do switch", ajuda: "Toque em “Cabo direto”, depois na porta Rede do PC1 e numa porta numerada do switch. PC e switch são equipamentos diferentes → cabo direto.",
          check: (st) => ligados(st, "pc1.nic", "sw.p", "direto"), erro: (st) => ligados(st, "pc1.nic", "sw.p", "cruzado") ? "Usou um cabo cruzado. Muitos switches modernos corrigem sozinhos (Auto-MDIX), mas a regra é: equipamentos diferentes → cabo direto. Toque no cabo para o tirar." : "" },
        { texto: "Ligue o switch à corrente e carregue no botão de ligar do PC1", ajuda: "Toque na tomada “⏻ corrente” do switch e no botão redondo ⏻ do PC1.", check: (st) => st.energia.sw && st.energia.pc1 },
        { texto: "Espere pela luz verde na porta do switch", ajuda: "Primeiro fica laranja: o switch verifica se há ciclos (Spanning Tree) antes de deixar passar tráfego. Num switch real demora cerca de 30 segundos.",
          check: (st, bc) => Object.keys(st.cabos.reduce((a, c) => { [c.a, c.b].filter((r) => r.startsWith("sw.p")).forEach((r) => { a[r] = 1; }); return a; }, {})).some((r) => luz(bc, st, "sw", r.split(".")[1]) === "verde") },
        { texto: "Ligue o PC2 a outra porta do switch e ligue-o", ajuda: "Cabo direto da porta Rede do PC2 para outra porta do switch; botão ⏻ do PC2.", check: (st) => ligados(st, "pc2.nic", "sw.p", "direto") && st.energia.pc2 },
        { texto: "Pergunta do técnico: porque é que a luz da porta esteve laranja antes de ficar verde?", tipo: "escolha", opcoes: ["O cabo estava avariado", "O switch estava a verificar a porta (Spanning Tree) antes de a pôr a encaminhar", "Faltava configurar o IP no switch", "O PC estava sem Internet"], certa: 1,
          explica: "Laranja = a porta está nos estados de escuta/aprendizagem do STP. Com PortFast (spanning-tree portfast) as portas dos PCs ficam verdes logo." },
      ] },
    { id: "b2", titulo: "Cabo de consola e PuTTY", nivel: "básico", modulo: "itn2",
      cenario: "O router novo da bancada 2 ainda não tem configuração nenhuma. Só se entra pela porta de consola, com o cabo azul e um programa de terminal (PuTTY).",
      devs: [{ id: "r1", tipo: "router", nome: "R-LAB2", x: 150, y: 40 }, PC("pc1", "Portátil do técnico", 420, 300)],
      passos: [
        { texto: "Ligue o cabo de consola: USB no portátil e RJ45 na porta CONSOLE do router", ajuda: "Toque em “Cabo de consola”, depois na porta USB do portátil e na porta azul CONSOLE do router (não na AUX).",
          check: (st) => ligados(st, "pc1.usb", "r1.con", "consola"), erro: (st) => ligados(st, "pc1.usb", "r1.aux") ? "Ligou na porta AUX (auxiliar, para modem). A consola é a porta CONSOLE, normalmente azul-clara." : "" },
        { texto: "Ligue o router no interruptor e ligue o portátil", ajuda: "Interruptor I/O atrás do router e botão ⏻ do portátil.", check: (st) => st.energia.r1 && st.energia.pc1 },
        { texto: "Descubra em que porta COM ficou o cabo (Gestor de dispositivos)", tipo: "navegar", janela: "Windows",
          caminho: [["Iniciar", ["Definições", "Gestor de dispositivos", "Explorador de ficheiros", "Bloco de notas"], 1], ["Gestor de dispositivos", ["Adaptadores de rede", "Portas (COM e LPT)", "Teclados", "Monitores"], 1], ["Portas (COM e LPT)", ["USB Serial Port (COM3)", "Porta de comunicações (COM1)"], 0]],
          explica: "O cabo USB-consola cria uma porta série virtual. Neste portátil é a COM3 (no seu pode ser outra: veja sempre no Gestor de dispositivos)." },
        { texto: "Abra o PuTTY: ligação Serial, COM3, velocidade 9600", tipo: "putty",
          explica: "A consola Cisco usa 9600 bps, 8 bits de dados, sem paridade, 1 bit de paragem, sem controlo de fluxo (9600 8N1)." },
        { texto: "No terminal: entre no modo privilegiado, dê o nome LAB-R2 ao router e guarde a configuração", tipo: "ios",
          ajuda: "enable › configure terminal › hostname LAB-R2 › end › copy running-config startup-config",
          verificar: (eq) => eq.cfg.hostname === "LAB-R2" && !!eq.startup },
      ] },
    { id: "b3", titulo: "Configurar a placa de rede no Windows", nivel: "básico", modulo: "itn2",
      cenario: "O PC da receção foi formatado. Na etiqueta da bancada está a ficha de rede: IP 192.168.10.25, máscara 255.255.255.0, gateway 192.168.10.1, DNS 192.168.10.1.",
      devs: [{ id: "sw", tipo: "switch", nome: "SW-RECECAO", x: 200, y: 30 }, { id: "r1", tipo: "router", nome: "Router (gateway .1)", x: 560, y: 300 }, PC("pc1", "PC-RECECAO", 160, 260)],
      inicial: { cabos: [{ a: "r1.g0", b: "sw.p8", tipo: "direto" }], energia: { sw: true, r1: true } },
      passos: [
        { texto: "Ligue o PC ao switch com o cabo certo e ligue o PC", ajuda: "Cabo direto da porta Rede do PC para uma porta do switch; botão ⏻.", check: (st) => ligados(st, "pc1.nic", "sw.p", "direto") && st.energia.pc1 },
        { texto: "Abra as propriedades IPv4 da placa de rede", tipo: "navegar", janela: "Windows",
          caminho: [["Painel de Controlo", ["Sistema e Segurança", "Rede e Internet", "Hardware e Som", "Programas"], 1], ["Rede e Internet", ["Centro de Rede e Partilha", "Opções da Internet"], 0],
            ["Centro de Rede e Partilha", ["Configurar uma nova ligação", "Alterar definições do adaptador", "Resolução de problemas"], 1], ["Ligações de rede", ["Ethernet", "Wi-Fi", "Bluetooth"], 0],
            ["Propriedades de Ethernet", ["Cliente para Redes Microsoft", "Partilha de Ficheiros e Impressoras", "Protocolo IP Versão 6 (TCP/IPv6)", "Protocolo IP Versão 4 (TCP/IPv4)"], 3]],
          explica: "Atalho: Win+R e escreva ncpa.cpl para abrir logo as Ligações de rede." },
        { texto: "Preencha “Utilizar o seguinte endereço IP” com os dados da ficha", tipo: "ipv4", alvo: { ip: "192.168.10.25", mask: "255.255.255.0", gw: "192.168.10.1", dns: "192.168.10.1" } },
        { texto: "Na Linha de comandos confirme com ipconfig e faça ping ao gateway 192.168.10.1", tipo: "cmd", ajuda: "Escreva ipconfig e depois ping 192.168.10.1",
          verificar: (log) => log.some((l) => /^ping\s+192\.168\.10\.1$/i.test(l.c) && /Received = 4/.test(l.t)) },
      ] },
    { id: "b4", titulo: "Testar cabos com o testador", nivel: "básico", modulo: "itn4",
      cenario: "Chegaram três cabos crimpados pelos estagiários: A, B e C. Teste cada um e diga o que tem.",
      devs: [{ id: "t", tipo: "testador", nome: "Testador", x: 120, y: 60 }],
      passos: [
        { texto: "Teste o cabo A e classifique-o", tipo: "testar", cabo: "A" },
        { texto: "Teste o cabo B e classifique-o", tipo: "testar", cabo: "B" },
        { texto: "Teste o cabo C e classifique-o", tipo: "testar", cabo: "C" },
      ] },
    { id: "b5", titulo: "Tomada de parede e patch panel", nivel: "intermédio", modulo: "e1",
      cenario: "Num escritório os PCs não ligam direto ao switch: ligam à tomada da parede, que por dentro da parede vai até ao patch panel no bastidor. Ligue o PC da secretária A-07.",
      devs: [{ id: "pp", tipo: "patch", nome: "PP-1", x: 40, y: 30 }, { id: "sw", tipo: "switch", nome: "SW-PISO1", x: 40, y: 150, portas: 8 }, { id: "tm", tipo: "tomada", nome: "Parede", x: 760, y: 300, tomadas: ["A-07", "A-08"] }, PC("pc1", "PC-A07", 520, 330)],
      inicial: { energia: { sw: true } },
      passos: [
        { texto: "Ligue o PC à tomada de parede A-07 (cabo direto)", ajuda: "Cabo direto da porta Rede do PC à tomada A-07.", check: (st) => ligados(st, "pc1.nic", "tm.A-07", "direto") },
        { texto: "No bastidor ligue a porta 07 do patch panel à porta 7 do switch (patch cord)", ajuda: "Cabo direto entre a porta 07 do patch panel e a porta 7 do switch.", check: (st) => ligados(st, "pp.pp7", "sw.p7", "direto") },
        { texto: "Ligue o PC e confirme a luz verde na porta 7", ajuda: "Botão ⏻ do PC. A luz acende porque o sinal faz o caminho PC → tomada → cabo na parede → patch panel → switch.", check: (st, bc) => st.energia.pc1 && luz(bc, st, "sw", "p7") === "verde" },
        { texto: "Pergunta: o PC-A07 está em que porta do switch?", tipo: "escolha", opcoes: ["Porta 1", "Porta 7", "Porta 8", "Não dá para saber"], certa: 1, explica: "Tomada A-07 → patch panel 07 → porta 7 do switch. Por isso se etiqueta tudo: tomada, patch panel e porta." },
      ] },
    { id: "b6", titulo: "Partilhar uma pasta entre dois PCs", nivel: "intermédio", modulo: "e7",
      cenario: "Os dois PCs da bancada 6 (PC1 192.168.1.11 e PC2 192.168.1.12) precisam de trocar ficheiros por uma pasta partilhada “Lab” no PC1.",
      devs: [{ id: "sw", tipo: "switch", nome: "SW-LAB6", x: 200, y: 30 }, PC("pc1", "PC1", 150, 260), PC("pc2", "PC2", 650, 260)],
      inicial: { energia: { sw: true } },
      passos: [
        { texto: "Ligue os dois PCs ao switch e ligue-os", ajuda: "Cabos diretos e botões ⏻.", check: (st) => ligados(st, "pc1.nic", "sw.p", "direto") && ligados(st, "pc2.nic", "sw.p", "direto") && st.energia.pc1 && st.energia.pc2 },
        { texto: "No PC1 partilhe a pasta C:\\Lab com permissão Alterar para Todos", tipo: "navegar", janela: "PC1 · Explorador",
          caminho: [["Este PC › Disco local (C:)", ["Lab", "Programas", "Utilizadores", "Windows"], 0], ["Lab (botão direito)", ["Abrir", "Copiar", "Propriedades", "Eliminar"], 2],
            ["Propriedades de Lab", ["Geral", "Partilha", "Segurança", "Versões anteriores"], 1], ["Partilha", ["Partilhar…", "Partilha avançada…"], 1],
            ["Partilha avançada", ["☐ Partilhar esta pasta", "Permissões"], 0], ["Permissões para Lab — Todos", ["Ler", "Alterar e Ler", "Controlo total"], 1]],
          explica: "Partilha avançada › Partilhar esta pasta › Permissões. “Alterar” deixa ler e gravar; evite “Controlo total” para Todos." },
        { texto: "Abra a firewall do PC1 à partilha de ficheiros", tipo: "navegar", janela: "PC1 · Painel de Controlo",
          caminho: [["Painel de Controlo", ["Sistema e Segurança", "Rede e Internet", "Contas de utilizador"], 0], ["Sistema e Segurança", ["Firewall do Windows Defender", "Segurança e Manutenção", "Cópia de segurança"], 0],
            ["Firewall do Windows Defender", ["Permitir uma aplicação ou funcionalidade", "Definições avançadas", "Restaurar predefinições"], 0], ["Aplicações permitidas", ["Ambiente de Trabalho Remoto", "Partilha de Ficheiros e Impressoras (Privada)", "Partilha de Ficheiros e Impressoras (Pública)"], 1]],
          explica: "Permita só na rede Privada. Em redes Públicas (café, aeroporto) a partilha deve ficar fechada." },
        { texto: "No PC2 abra a pasta pela rede (Win+R)", tipo: "executar", aceita: ["\\\\pc1\\lab", "\\\\192.168.1.11\\lab"],
          explica: "\\\\PC1\\Lab é um caminho UNC: \\\\computador\\partilha. Na mesma rede o nome PC1 funciona; noutras redes use o IP ou DNS." },
        { texto: "No PC2 mapeie a pasta na letra Z: pela Linha de comandos", tipo: "cmdtexto", aceita: [/^net use z: \\\\(pc1|192\.168\.1\.11)\\lab( \/persistent:(yes|no))?$/i],
          ajuda: "net use Z: \\\\PC1\\Lab /persistent:yes", explica: "Com /persistent:yes a unidade Z: volta a ligar sempre que o utilizador inicia sessão." },
      ] },
  ];
  // Cabos para o testador (bancada 4): mapa do pino de cada lado
  const CABOS_TESTE = {
    A: { mapa: [0, 1, 2, 3, 4, 5, 6, 7], certo: "ok", nome: "Cabo A" },
    B: { mapa: [2, 5, 0, 3, 4, 1, 6, 7], certo: "cruzado", nome: "Cabo B" },
    C: { mapa: [0, 1, null, 3, 4, 5, 6, 7], certo: "aberto", nome: "Cabo C" },
  };
  const CLASSES = [["ok", "Direto, bom (1→1 … 8→8)"], ["cruzado", "Cruzado (1→3, 2→6)"], ["aberto", "Fio interrompido (um pino não acende)"], ["trocado", "Par trocado (ex.: 1→2, 2→1)"]];

  // ------------------------------------------------------------ montar uma bancada
  function montar(raiz, bc, op) {
    const st = Object.assign({ cabos: [], energia: {}, desde: {}, feitos: {}, teste: null, classes: {}, log: [], ios: null }, JSON.parse(JSON.stringify(bc.inicial || {})), op.estado || {});
    st.desde = {}; st.teste = null;
    let cabo = "direto", pontaA = null, msgTxt = "", msgTipo = "", nav = {}, timer = null;
    let eq = null;
    const guardar = () => { if (op.aoGuardar) op.aoGuardar({ cabos: st.cabos, energia: st.energia, feitos: st.feitos, classes: st.classes, ios: eq ? { cfg: eq.cfg, startup: eq.startup } : st.ios, putty: st.putty, ipv4: st.ipv4, log: st.log.slice(-30) }); };

    const passoAtual = () => bc.passos.findIndex((p, i) => !st.feitos[i]);
    function avaliar() {
      bc.passos.forEach((p, i) => {
        if (st.feitos[i] || i !== passoAtual()) return;
        if (p.check && p.check(st, bc)) { st.feitos[i] = true; msg(`Passo ${i + 1} feito.`, "ok"); avaliar(); }
      });
      if (passoAtual() === -1 && !st.concluida) { st.concluida = true; msg("<b>Bancada concluída!</b> Pode continuar a mexer à vontade.", "ok"); if (op.aoConcluir) op.aoConcluir(); }
      if (op.aoProgresso) op.aoProgresso(Object.keys(st.feitos).length);
      guardar();
    }
    function msg(t, tipo) { msgTxt = t; msgTipo = tipo || ""; const m = raiz.querySelector("#lb-msg"); if (m) { m.innerHTML = t; m.className = "sim-msg " + msgTipo; } }

    function desenhar() {
      let s = "";
      // cabos
      st.cabos.forEach((c, k) => {
        const a = posPorta(bc, st, c.a), b = posPorta(bc, st, c.b); if (!a || !b) return;
        const my = Math.max(a.y, b.y) + 60;
        s += `<path d="M${a.x} ${a.y} C${a.x} ${my} ${b.x} ${my} ${b.x} ${b.y}" class="lb-cabo" stroke="${CABOS[c.tipo].cor}" data-cabo="${k}" stroke-width="${c.tipo === "consola" ? 9 : 7}"/>`;
      });
      bc.devs.forEach((d) => {
        const g = geo(d, st);
        s += `<g transform="translate(${d.x},${d.y})">${g.svg}${g.portas.map((p) => {
          const ref = d.id + "." + p.id, usada = cabosEm(st, ref).length, l = p.led ? luz(bc, st, d.id, p.id) : "";
          return `${p.led ? `<circle cx="${p.x}" cy="${p.y - 26}" r="5" class="lb-led ${l}"/>` : ""}<rect x="${p.x - 15}" y="${p.y - 12}" width="30" height="24" rx="3" class="lb-porta ${p.tipo} ${usada ? "usada" : ""} ${pontaA === ref ? "sel" : ""}" data-porta="${ref}"/>${tomadaPorta(p)}
            <text x="${p.x}" y="${p.y + 26}" class="lb-mini"${g.tinta ? ` style="fill:${g.tinta}"` : ""}>${esc(p.rotulo)}</text>`;
        }).join("")}</g>`;
      });
      raiz.querySelector("#lb-svg").innerHTML = s;
      clearTimeout(timer);
      if (st.cabos.some(() => true) && raiz.querySelector(".lb-led.laranja")) timer = setTimeout(() => { desenhar(); const antes = Object.keys(st.feitos).length; avaliar(); if (Object.keys(st.feitos).length !== antes) pintar(); }, 700);
    }

    function compat(a, b, tipo) {
      const ta = posPorta(bc, st, a).tipo, tb = posPorta(bc, st, b).tipo;
      if (tipo === "consola") return (ta === "usb" && ["con", "aux"].includes(tb)) || (tb === "usb" && ["con", "aux"].includes(ta)) ? "" : "O cabo de consola vai da porta USB do PC à porta CONSOLE do equipamento.";
      if ([ta, tb].includes("usb")) return "A porta USB não é uma porta de rede: o cabo de rede vai na porta Rede (RJ45) do PC.";
      if ([ta, tb].includes("con") || [ta, tb].includes("aux")) return "As portas CONSOLE/AUX não são portas de rede. Para elas use o cabo de consola.";
      return "";
    }
    function tocarPorta(ref) {
      if (cabosEm(st, ref).length) { msg("Essa porta já tem um cabo. Toque no cabo para o tirar.", "erro"); return; }
      if (!pontaA) { pontaA = ref; msg(`Ponta 1 em <b>${esc(ref.replace(".", " · "))}</b>. Toque na porta onde liga a outra ponta.`); desenhar(); return; }
      if (pontaA === ref || pontaA.split(".")[0] === ref.split(".")[0]) { pontaA = null; desenhar(); msg("Escolha uma porta noutro equipamento."); return; }
      const e = compat(pontaA, ref, cabo); if (e) { msg(e, "erro"); pontaA = null; desenhar(); return; }
      st.cabos.push({ a: pontaA, b: ref, tipo: cabo }); pontaA = null;
      msg(`Ligado com ${CABOS[cabo].nome.toLowerCase()}.`, "ok");
      const i = passoAtual(), p = bc.passos[i];
      desenhar(); avaliar();
      if (p && p.erro && !st.feitos[i]) { const t = p.erro(st); if (t) msg(t, "erro"); }
    }

    // ------------------------------------------------------------ widgets dos passos
    function widget(p, i) {
      if (p.tipo === "escolha") return `<div class="opcoes">${p.opcoes.map((o, k) => `<button class="opcao" data-lb-esc="${k}"><span class="letra">${"ABCD"[k]}</span><span>${esc(o)}</span></button>`).join("")}</div>`;
      if (p.tipo === "navegar") {
        const n = nav[i] || 0, [titulo, itens] = p.caminho[n];
        return `<div class="lb-janela"><div class="lb-jan-barra"><span>${esc(p.janela)}</span><span>— ▢ ✕</span></div><div class="lb-jan-titulo">${esc(titulo)}</div>
          <div class="lb-jan-itens">${itens.map((x, k) => `<button data-lb-nav="${k}">${esc(x)}</button>`).join("")}</div><div class="peq suave">Passo ${n + 1} de ${p.caminho.length}</div></div>`;
      }
      if (p.tipo === "putty") {
        const v = st.putty || {};
        return `<form class="lb-janela sim-form" data-lb-form="putty"><div class="lb-jan-barra"><span>PuTTY Configuration</span><span>✕</span></div>
          <label>Connection type<select class="campo" name="tipo"><option>SSH</option><option>Telnet</option><option ${v.tipo === "Serial" ? "selected" : ""}>Serial</option><option>Raw</option></select></label>
          <label>Serial line<input class="campo mono" name="linha" value="${esc(v.linha || "COM1")}"></label>
          <label>Speed<input class="campo mono" name="vel" value="${esc(v.vel || "115200")}" inputmode="numeric"></label>
          <button class="btn prim">Open</button></form>${v.lixo ? `<div class="term"><pre>ÿ⸮⸮⸮ÿ⸮ ⸮⸮ÿ⸮⸮⸮ ⸮ÿ⸮⸮</pre></div><p class="peq">Caracteres estranhos = velocidade errada. A consola Cisco usa 9600.</p>` : ""}`;
      }
      if (p.tipo === "ipv4") {
        const v = st.ipv4 || {};
        return `<form class="lb-janela sim-form" data-lb-form="ipv4"><div class="lb-jan-barra"><span>Propriedades de Protocolo IP Versão 4 (TCP/IPv4)</span><span>✕</span></div>
          <label class="linha"><input type="radio" name="modo" value="auto"> Obter um endereço IP automaticamente</label><label class="linha"><input type="radio" name="modo" value="fixo" checked> Utilizar o seguinte endereço IP:</label>
          <label>Endereço IP<input class="campo mono" name="ip" value="${esc(v.ip || "")}" inputmode="decimal"></label><label>Máscara de sub-rede<input class="campo mono" name="mask" value="${esc(v.mask || "")}" inputmode="decimal"></label>
          <label>Gateway predefinido<input class="campo mono" name="gw" value="${esc(v.gw || "")}" inputmode="decimal"></label><label>Servidor DNS preferido<input class="campo mono" name="dns" value="${esc(v.dns || "")}" inputmode="decimal"></label>
          <button class="btn prim">OK</button></form>`;
      }
      if (p.tipo === "ios" || p.tipo === "cmd" || p.tipo === "cmdtexto") {
        const pr = p.tipo === "ios" ? (eq ? eq.prompt() : "") : "C:\\>";
        return `<div class="term"><div class="consola sim-consola" id="lb-cons">${st.log.map((l) => `<div><span class="pr">${esc(l.p)}</span><span class="in">${esc(l.c)}</span></div>${l.t ? `<div>${esc(l.t)}</div>` : ""}`).join("") || (p.tipo === "ios" ? "<div>Press RETURN to get started.</div>" : "<div>Microsoft Windows · Linha de comandos</div>")}</div>
          <form class="entrada" data-lb-form="term"><label for="lb-in">${esc(pr)}</label><input id="lb-in" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Comando"></form></div>`;
      }
      if (p.tipo === "executar") return `<form class="lb-janela sim-form" data-lb-form="executar"><div class="lb-jan-barra"><span>PC2 · Executar (Win+R)</span><span>✕</span></div><label>Abrir:<input class="campo mono" name="cam" placeholder="\\\\computador\\pasta" autocomplete="off"></label><button class="btn prim">OK</button></form>${st.explorador ? `<div class="lb-janela"><div class="lb-jan-barra"><span>${esc(st.explorador)}</span><span>✕</span></div><div class="lb-jan-itens"><button>📄 relatorio-lab.docx</button><button>📄 notas.txt</button></div></div>` : ""}`;
      if (p.tipo === "testar") {
        const t = st.teste;
        return `<p class="peq">Toque em <b>Ligar ao testador</b>: o cabo ${p.cabo} vai para as duas unidades e as luzes acendem pino a pino.</p><button class="btn" data-lb-testar="${p.cabo}">Ligar o cabo ${p.cabo} ao testador</button>
          ${t && t.cabo === p.cabo && t.passo >= 8 ? `<p class="peq">Leia as luzes da unidade remota: ${CABOS_TESTE[p.cabo].mapa.map((x, k) => `${k + 1}→${x == null ? "—" : x + 1}`).join(" ")}</p><div class="opcoes">${CLASSES.map(([k, n]) => `<button class="opcao" data-lb-classe="${k}"><span>${esc(n)}</span></button>`).join("")}</div>` : ""}`;
      }
      return "";
    }

    function pintar() {
      const i = passoAtual();
      raiz.querySelector("#lb-passos").innerHTML = bc.passos.map((p, k) => `<li class="${st.feitos[k] ? "feito" : k === i ? "atual" : ""}"><span class="cx">${st.feitos[k] ? "✓" : k + 1}</span><div><span>${esc(p.texto)}</span>
        ${k === i && p.ajuda ? `<details><summary>como fazer</summary><span class="peq">${esc(p.ajuda)}</span></details>` : ""}${k === i ? `<div class="lb-widget">${widget(p, k)}</div>` : ""}${st.feitos[k] && p.explica ? `<p class="peq suave">${esc(p.explica)}</p>` : ""}</div></li>`).join("");
      raiz.querySelector("#lb-prog").textContent = `${Object.keys(st.feitos).length}/${bc.passos.length} passos`;
      const cons = raiz.querySelector("#lb-cons"); if (cons) cons.scrollTop = cons.scrollHeight;
      raiz.querySelector(".lb-barra").hidden = bc.devs.every((d) => d.tipo === "testador");
    }
    function concluir(i, texto) { st.feitos[i] = true; msg(texto || `Passo ${i + 1} feito.`, "ok"); avaliar(); pintar(); desenhar(); }

    raiz.innerHTML = `<div class="sim lb"><div class="cartao sim-passos"><div class="linha entre"><span class="rotulo">Bancada · <span id="lb-prog"></span></span><button class="btn-copiar sim-btn-link" data-lb="reiniciar">Recomeçar</button></div>
        <p class="peq">${esc(bc.cenario)}</p><ol class="sim-lista" id="lb-passos"></ol></div>
      <div class="sim-barra lb-barra" role="toolbar" aria-label="Cabos">${["direto", "cruzado", "consola"].map((k) => `<button data-lb-cabo="${k}" aria-pressed="${k === cabo}"><i style="display:inline-block;width:18px;height:6px;border-radius:3px;background:${CABOS[k].cor};vertical-align:middle;margin-right:6px"></i>${esc(CABOS[k].nome)}</button>`).join("")}</div>
      <div class="sim-palco lb-palco"><svg id="lb-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Bancada do laboratório"></svg><div class="sim-msg" id="lb-msg">Escolha o cabo na barra e toque nas portas para ligar. Toque num cabo para o tirar.</div></div></div>`;

    if (bc.passos.some((p) => p.tipo === "ios")) {
      eq = new IOS.Equipamento("router", "Router", "4331");
      if (st.ios) { eq.cfg = st.ios.cfg; eq.startup = st.ios.startup || ""; }
    }

    raiz.addEventListener("click", (e) => {
      const i = passoAtual(), p = bc.passos[i];
      const t = e.target;
      const cb = t.closest("[data-lb-cabo]");
      if (cb) { cabo = cb.dataset.lbCabo; pontaA = null; raiz.querySelectorAll("[data-lb-cabo]").forEach((b) => b.setAttribute("aria-pressed", String(b === cb))); msg(`<b>${esc(CABOS[cabo].nome)}</b>: ${esc(CABOS[cabo].desc)}`); desenhar(); return; }
      const po = t.closest("[data-porta]"); if (po) { tocarPorta(po.dataset.porta); return; }
      const en = t.closest("[data-energia]"); if (en) { const id = en.dataset.energia; st.energia[id] = !st.energia[id]; Object.keys(st.desde).forEach((k) => delete st.desde[k]); msg(st.energia[id] ? "Ligado. Veja as luzes." : "Desligado."); desenhar(); avaliar(); pintar(); return; }
      const ca = t.closest("[data-cabo]"); if (ca) { const c = st.cabos.splice(+ca.dataset.cabo, 1)[0]; Object.keys(st.desde).forEach((k) => delete st.desde[k]); msg(`Cabo tirado (${esc(c.a)} ↔ ${esc(c.b)}).`); desenhar(); avaliar(); pintar(); return; }
      if (t.closest("[data-lb='reiniciar']")) {
        Object.assign(st, { cabos: [], energia: {}, desde: {}, feitos: {}, classes: {}, log: [], ipv4: null, putty: null, explorador: null, concluida: false }, JSON.parse(JSON.stringify(bc.inicial || {})));
        nav = {}; if (eq) eq = new IOS.Equipamento("router", "Router", "4331"); st.ios = null; msg("Bancada recomeçada."); desenhar(); pintar(); guardar(); return;
      }
      if (!p) return;
      const es = t.closest("[data-lb-esc]");
      if (es) { const k = +es.dataset.lbEsc; if (k === p.certa) concluir(i, "<b>Certo.</b> " + esc(p.explica)); else { es.classList.add("errada"); msg("Não. Pense outra vez.", "erro"); } return; }
      const nv = t.closest("[data-lb-nav]");
      if (nv) {
        const n = nav[i] || 0, [, itens, certo] = p.caminho[n], k = +nv.dataset.lbNav;
        if (k !== certo) { msg(`“${esc(itens[k])}” não é o caminho. Procure outra opção.`, "erro"); nv.classList.add("errada"); return; }
        nav[i] = n + 1; if (nav[i] >= p.caminho.length) { concluir(i, "<b>Feito.</b> " + esc(p.explica || "")); return; }
        msg(`Abriu “${esc(itens[k])}”.`); pintar(); return;
      }
      const ts = t.closest("[data-lb-testar]");
      if (ts) {
        const id = ts.dataset.lbTestar; st.teste = { cabo: id, passo: 0, mapa: CABOS_TESTE[id].mapa };
        const anda = () => { if (!st.teste || st.teste.cabo !== id) return; st.teste.passo++; desenhar(); if (st.teste.passo < 8) setTimeout(anda, 280); else pintar(); };
        msg(`A testar o ${CABOS_TESTE[id].nome}… veja a ordem em que as luzes da unidade remota acendem.`); setTimeout(anda, 200); return;
      }
      const cl = t.closest("[data-lb-classe]");
      if (cl) {
        const k = cl.dataset.lbClasse, certo = CABOS_TESTE[p.cabo].certo;
        if (k === certo) concluir(i, `<b>Certo.</b> ${esc(CLASSES.find((x) => x[0] === k)[1])}. ${k === "ok" ? "Pode usá-lo." : k === "cruzado" ? "Serve para ligar equipamentos iguais (switch–switch)." : "Corte a ficha e volte a crimpar."}`);
        else { cl.classList.add("errada"); msg("Olhe outra vez para a ordem das luzes na unidade remota.", "erro"); }
      }
    });
    raiz.addEventListener("submit", (e) => {
      const f = e.target.closest("[data-lb-form]"); if (!f) return; e.preventDefault();
      const i = passoAtual(), p = bc.passos[i], v = Object.fromEntries(new FormData(f).entries());
      const tipo = f.dataset.lbForm;
      if (tipo === "putty") {
        st.putty = { tipo: v.tipo, linha: v.linha.trim().toUpperCase(), vel: v.vel.trim(), lixo: false };
        if (v.tipo !== "Serial") { msg("Para a consola o tipo de ligação é <b>Serial</b> (SSH e Telnet são para ligações pela rede, que o router ainda não tem).", "erro"); return; }
        if (st.putty.linha !== "COM3") { msg(`Nada aparece: ${esc(st.putty.linha)} não é a porta do cabo. Era a COM3 (Gestor de dispositivos).`, "erro"); return; }
        if (st.putty.vel !== "9600") { st.putty.lixo = true; pintar(); msg("Aparecem caracteres estranhos: a velocidade está errada.", "erro"); return; }
        concluir(i, "<b>Ligado à consola!</b> O terminal mostra o router. " + esc(p.explica)); return;
      }
      if (tipo === "ipv4") {
        st.ipv4 = v; const a = p.alvo;
        const errado = ["ip", "mask", "gw", "dns"].filter((k) => (v[k] || "").trim() !== a[k]);
        if (v.modo === "auto") { msg("Nesta rede não há servidor DHCP: escolha “Utilizar o seguinte endereço IP”.", "erro"); return; }
        if (errado.length) { msg("Confira com a ficha de rede: " + errado.map((k) => ({ ip: "endereço IP", mask: "máscara", gw: "gateway", dns: "DNS" }[k])).join(", ") + ".", "erro"); pintar(); return; }
        concluir(i, "<b>Endereço aplicado.</b> O Windows guarda e a placa passa a usar este IP."); return;
      }
      if (tipo === "executar") {
        const cam = (v.cam || "").trim().toLowerCase().replace(/\\+$/, "");
        if (p.aceita.includes(cam)) { st.explorador = v.cam.trim(); concluir(i, "<b>A pasta abriu!</b> " + esc(p.explica)); }
        else msg(/^\\\\/.test(cam) ? "Não encontrado. Confirme o nome do computador (PC1 ou 192.168.1.11) e da pasta (Lab)." : "Um caminho de rede começa com duas barras: \\\\computador\\pasta", "erro");
        return;
      }
      if (tipo === "term") {
        const inp = raiz.querySelector("#lb-in"), linha = inp.value; inp.value = "";
        if (p.tipo === "ios") {
          const pr = eq.prompt(), out = eq.executar(linha);
          st.log.push({ p: pr, c: linha, t: out === "\f" ? "" : out });
          if (p.verificar(eq)) concluir(i, "<b>Configuração feita e guardada.</b> Num router real, sem <code>copy running-config startup-config</code> perdia tudo ao desligar.");
          else { pintar(); guardar(); }
          const inp2 = raiz.querySelector("#lb-in"); if (inp2) inp2.focus({ preventScroll: true }); return;
        }
        if (p.tipo === "cmdtexto") {
          st.log.push({ p: "C:\\>", c: linha, t: p.aceita.some((re) => re.test(linha.trim())) ? "O comando foi concluído com êxito." : "Erro de sintaxe. Exemplo: net use Z: \\\\PC1\\Lab /persistent:yes" });
          if (p.aceita.some((re) => re.test(linha.trim()))) concluir(i, "<b>Unidade Z: ligada.</b> " + esc(p.explica)); else pintar();
          return;
        }
        // Linha de comandos do Windows ligada ao motor do simulador
        const rede = redeDaBancada(st);
        const pc = rede.dev("PC1"), r = S.promptPC(rede, pc, linha);
        st.log.push({ p: "C:\\>", c: linha, t: r.txt || "" });
        if (p.verificar(st.log)) concluir(i, "<b>O PC chega ao gateway.</b> A placa de rede está bem configurada e o cabo funciona."); else { pintar(); guardar(); }
        raiz.querySelector("#lb-in") && raiz.querySelector("#lb-in").focus({ preventScroll: true });
      }
    });
    // Rede lógica equivalente à bancada 3, para o ping funcionar de verdade
    function redeDaBancada(st) {
      const rede = new S.Rede();
      const ip = st.ipv4 || {};
      const ligadoSw = ligados(st, "pc1.nic", "sw.p", "direto") && st.energia.pc1;
      rede.novoDev("switch", 50, 50, "S1");
      rede.novoDev("router", 50, 20, "R1");
      rede.novoDev("pc", 20, 80, "PC1", { ip: ip.ip || "", mask: ip.mask || "", gw: ip.gw || "", dns: ip.dns || "" });
      ["enable", "conf t", "int g0/0/0", "ip address 192.168.10.1 255.255.255.0", "no shutdown", "end"].forEach((c) => rede.dev("R1").eq.executar(c));
      const s1 = rede.dev("S1"), r1 = rede.dev("R1"), pc = rede.dev("PC1");
      rede.links.push({ id: "l1", a: r1.id, pa: "GigabitEthernet0/0/0", b: s1.id, pb: "GigabitEthernet0/1", cabo: "direto" });
      if (ligadoSw) rede.links.push({ id: "l2", a: pc.id, pa: "FastEthernet0", b: s1.id, pb: "FastEthernet0/1", cabo: "direto" });
      rede.mudou();
      return rede;
    }

    desenhar(); avaliar(); pintar();
    return { parar() { clearTimeout(timer); guardar(); } };
  }

  window.Laboratorio = { BANCADAS, montar };
})();
