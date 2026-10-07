/* Gerador de exercícios.
   Cada gerador cria um exercício novo (com números diferentes) e a resolução
   completa, passo a passo, para o aluno ver como se faz. Com uma "semente" o
   exercício é sempre o mesmo: é assim que os cadernos numerados (50 de binário,
   100 de sub-redes…) ficam iguais para todos.

   Formato de um exercício:
   { gen, tipo: "valor" | "mc" | "vf", p (HTML), respostas | opcoes+correta | correta,
     explica (HTML com a resolução), fig (HTML opcional, ex.: diagrama) } */
(function () {
  "use strict";

  // ------------------------------------------------------------ utilitários
  function rng(semente) {
    let a = (semente >>> 0) || 1;
    return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const int = (r, a, b) => a + Math.floor(r() * (b - a + 1));
  const um = (r, xs) => xs[Math.floor(r() * xs.length)];
  const baralhar = (r, xs) => { const a = xs.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const n2i = (n) => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
  const i2n = (s) => s.split(".").reduce((a, o) => (a * 256 + Number(o)) >>> 0, 0);
  const mascara = (p) => (p === 0 ? 0 : (0xffffffff << (32 - p)) >>> 0);
  const bin8 = (x) => x.toString(2).padStart(8, "0");
  const binIP = (n) => n2i(n).split(".").map((o) => bin8(+o)).join(".");
  const PESOS = [128, 64, 32, 16, 8, 4, 2, 1];
  const HEX = "0123456789ABCDEF";

  // Opções de escolha múltipla: a certa + distratores sem repetir.
  function opcoes(r, certa, distratores) {
    const ds = [...new Set(distratores.map(String))].filter((d) => d !== String(certa)).slice(0, 3);
    const todas = baralhar(r, [String(certa), ...ds]);
    return { opcoes: todas, correta: todas.indexOf(String(certa)) };
  }
  const tabela = (cab, linhas, cls) => `<div class="tabela-caixa"><table class="${cls || ""}"><thead><tr>${cab.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${linhas.map((l) => `<tr>${l.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;

  // ------------------------------------------------------------ explicações reutilizadas
  function passosDecBin(x) {
    let resto = x; const bits = [], linhas = [];
    PESOS.forEach((p) => {
      if (resto >= p) { linhas.push([p, `${resto} ≥ ${p}`, "<b>1</b>", `${resto} − ${p} = ${resto - p}`]); resto -= p; bits.push(1); }
      else { linhas.push([p, `${resto} &lt; ${p}`, "0", "—"]); bits.push(0); }
    });
    return `<p>Percorra os pesos de 128 até 1. Se o número que resta é maior ou igual ao peso, escreva <b>1</b> e subtraia; senão escreva <b>0</b>.</p>` +
      tabela(["Peso", "Cabe?", "Bit", "Resta"], linhas, "mono") + `<p>Leia os bits de cima para baixo: <b class="mono">${bits.join("")}</b>.</p>`;
  }
  function passosBinDec(b) {
    const soma = [...b].map((c, i) => (c === "1" ? PESOS[i] : 0));
    return `<p>Escreva os pesos por cima de cada bit e some os pesos onde há <b>1</b>:</p>` +
      tabela(PESOS.map(String), [[...b].map((c) => (c === "1" ? "<b>1</b>" : "0"))], "mono") +
      `<p>${soma.filter(Boolean).join(" + ") || "0"} = <b>${soma.reduce((a, c) => a + c, 0)}</b></p>`;
  }
  function passosSubrede(ip, p) {
    const m = mascara(p), rede = (i2n(ip) & m) >>> 0, bc = (rede | (~m >>> 0)) >>> 0, octs = n2i(m).split(".").map(Number);
    const k = octs.findIndex((o) => o !== 255);
    const hosts = p >= 31 ? (p === 31 ? 2 : 1) : 2 ** (32 - p) - 2;
    let txt = `<ol class="passos-res"><li>Prefixo /${p} → máscara <b class="mono">${n2i(m)}</b> (${p} bits a 1).</li>`;
    if (k === -1) txt += `<li>Máscara /32: é um único endereço (um host).</li>`;
    else {
      const ipOct = Number(ip.split(".")[k]), bloco = 256 - octs[k];
      const inicio = Math.floor(ipOct / bloco) * bloco;
      txt += `<li>O octeto “interessante” é o <b>${k + 1}.º</b> (o primeiro que não é 255): vale ${octs[k]}.</li>
        <li>Tamanho do bloco (número mágico): 256 − ${octs[k]} = <b>${bloco}</b>. As redes começam em múltiplos de ${bloco}: ${[0, 1, 2, 3].map((i) => i * bloco).filter((x) => x < 256).join(", ")}…</li>
        <li>${ipOct} está entre <b>${inicio}</b> e ${inicio + bloco} → a rede começa em ${inicio} nesse octeto; os octetos depois dele ficam a 0.</li>
        <li>Rede: <b class="mono">${n2i(rede)}</b>. Broadcast = início da rede seguinte − 1 → <b class="mono">${n2i(bc)}</b>.</li>`;
    }
    txt += `<li>Primeiro host = rede + 1 → <b class="mono">${p >= 31 ? n2i(rede) : n2i(rede + 1)}</b>; último host = broadcast − 1 → <b class="mono">${p >= 31 ? n2i(bc) : n2i(bc - 1)}</b>.</li>
      <li>Hosts úteis = 2<sup>${32 - p}</sup> − 2 = <b>${hosts}</b> (tiram-se o endereço de rede e o de broadcast).</li></ol>`;
    return { txt, rede: n2i(rede), bc: n2i(bc), primeiro: n2i(p >= 31 ? rede : rede + 1), ultimo: n2i(p >= 31 ? bc : bc - 1), hosts, mask: n2i(m) };
  }
  function passosBinario(ip, p) {
    const m = mascara(p), rede = (i2n(ip) & m) >>> 0;
    return `<p>Pelo método binário (operação AND bit a bit: 1 só quando os dois são 1):</p>` +
      tabela(["", "Binário"], [["IP " + ip, `<span class="mono">${binIP(i2n(ip))}</span>`], ["Máscara /" + p, `<span class="mono">${binIP(m)}</span>`], ["<b>AND = rede</b>", `<b class="mono">${binIP(rede)}</b>`]]);
  }
  function ipAleatorio(r, p) {
    const base = um(r, [[10, null], [172, int(r, 16, 31)], [192, 168], [int(r, 1, 223), null]]);
    const o = [base[0], base[1] == null ? int(r, 0, 255) : base[1], int(r, 0, 255), int(r, 1, 254)];
    if (o[0] === 127) o[0] = 126;
    return o.join(".");
  }
  const prefixoAleatorio = (r) => um(r, [8, 12, 16, 19, 20, 21, 22, 23, 24, 25, 25, 26, 26, 27, 27, 28, 28, 29, 29, 30, 30]);

  // ------------------------------------------------------------ dados para exercícios de conceitos
  const OSI = [
    ["Cabo UTP, sinais elétricos, conector RJ45", 1], ["Hub e repetidor", 1], ["Fibra ótica e luz", 1], ["Bits", 1],
    ["Endereço MAC", 2], ["Switch (camada 2)", 2], ["Trama (frame)", 2], ["Ethernet 802.3", 2], ["VLAN 802.1Q", 2], ["ARP", 2], ["STP", 2], ["Wi-Fi 802.11", 2],
    ["Endereço IP", 3], ["Router", 3], ["Pacote", 3], ["ICMP (ping)", 3], ["OSPF", 3], ["IPv6", 3],
    ["Segmento TCP", 4], ["Datagrama UDP", 4], ["Números de porta", 4], ["TCP", 4], ["UDP", 4], ["Controlo de fluxo e janelas", 4],
    ["Abrir e fechar sessões", 5], ["Sincronização de diálogo", 5], ["NetBIOS", 5],
    ["Cifrar e comprimir os dados", 6], ["Formatos JPEG, ASCII, MP4", 6], ["Conversão de formatos", 6],
    ["HTTP", 7], ["DNS", 7], ["DHCP", 7], ["SMTP", 7], ["FTP", 7], ["SSH", 7], ["SMB (partilha de ficheiros)", 7], ["Navegador web", 7],
  ];
  const NOMES_OSI = ["", "1 — Física", "2 — Ligação de dados", "3 — Rede", "4 — Transporte", "5 — Sessão", "6 — Apresentação", "7 — Aplicação"];
  const PDU = [["Física", "Bits"], ["Ligação de dados", "Trama"], ["Rede", "Pacote"], ["Transporte", "Segmento (TCP) / datagrama (UDP)"], ["Aplicação", "Dados"]];
  const TCPIP = { 1: "Acesso à rede", 2: "Acesso à rede", 3: "Internet", 4: "Transporte", 5: "Aplicação", 6: "Aplicação", 7: "Aplicação" };
  const PORTAS = [
    ["FTP (dados)", "20", "TCP"], ["FTP (controlo)", "21", "TCP"], ["SSH", "22", "TCP"], ["Telnet", "23", "TCP"], ["SMTP", "25", "TCP"], ["DNS", "53", "UDP e TCP"],
    ["DHCP servidor", "67", "UDP"], ["DHCP cliente", "68", "UDP"], ["TFTP", "69", "UDP"], ["HTTP", "80", "TCP"], ["POP3", "110", "TCP"], ["NTP", "123", "UDP"],
    ["IMAP", "143", "TCP"], ["SNMP", "161", "UDP"], ["SNMP trap", "162", "UDP"], ["LDAP", "389", "TCP"], ["HTTPS", "443", "TCP"], ["SMB", "445", "TCP"],
    ["Syslog", "514", "UDP"], ["RDP (ambiente de trabalho remoto)", "3389", "TCP"], ["NFS", "2049", "TCP e UDP"], ["Kerberos", "88", "TCP e UDP"],
  ];

  // ------------------------------------------------------------ geradores
  const G = {};
  const def = (id, nome, tema, fn) => { G[id] = { id, nome, tema, fn }; };

  // Binário e hexadecimal
  def("dec_bin", "Decimal → binário", "binario", (r) => {
    const x = r() < 0.35 ? um(r, [128, 192, 224, 240, 248, 252, 254, 255, 0, 1, 10, 172, 168]) : int(r, 0, 255);
    return { tipo: "valor", p: `Converta <b>${x}</b> para binário (8 bits).`, respostas: [bin8(x)], explica: passosDecBin(x), dica: "Use os pesos 128 64 32 16 8 4 2 1." };
  });
  def("bin_dec", "Binário → decimal", "binario", (r) => {
    const x = int(r, 0, 255), b = bin8(x);
    return { tipo: "valor", p: `Converta <b class="mono">${b}</b> para decimal.`, respostas: [String(x)], explica: passosBinDec(b) };
  });
  def("ip_bin", "Endereço IP → binário", "binario", (r) => {
    const ip = ipAleatorio(r, 24), b = binIP(i2n(ip));
    return { tipo: "valor", p: `Escreva o endereço <b class="mono">${ip}</b> em binário (4 octetos separados por pontos).`, respostas: [b, b.replace(/\./g, "")],
      explica: `<p>Converte-se cada octeto separadamente:</p>` + tabela(["Octeto", "Decimal", "Binário"], ip.split(".").map((o, i) => [i + 1 + ".º", o, `<b class="mono">${bin8(+o)}</b>`])) + `<p>Resultado: <b class="mono">${b}</b></p>` };
  });
  def("bin_ip", "Binário → endereço IP", "binario", (r) => {
    const ip = ipAleatorio(r, 24), b = binIP(i2n(ip));
    return { tipo: "valor", p: `Que endereço IPv4 é <b class="mono">${b}</b>?`, respostas: [ip],
      explica: tabela(["Binário", "Soma dos pesos", "Decimal"], b.split(".").map((o) => [`<span class="mono">${o}</span>`, [...o].map((c, i) => (c === "1" ? PESOS[i] : 0)).filter(Boolean).join("+") || "0", `<b>${parseInt(o, 2)}</b>`])) + `<p>Endereço: <b class="mono">${ip}</b></p>` };
  });
  def("dec_hex", "Decimal ↔ hexadecimal", "binario", (r) => {
    const x = int(r, 0, 255), h = x.toString(16).toUpperCase().padStart(2, "0"), b = bin8(x);
    const exp = `<ol class="passos-res"><li>Escreva ${x} em binário: <span class="mono">${b}</span>.</li><li>Separe em dois grupos de 4 bits (nibbles): <span class="mono">${b.slice(0, 4)} ${b.slice(4)}</span>.</li><li>Cada grupo vale de 0 a 15: ${parseInt(b.slice(0, 4), 2)} e ${parseInt(b.slice(4), 2)} → em hexadecimal <b>${h[0]}</b> e <b>${h[1]}</b> (A=10, B=11, C=12, D=13, E=14, F=15).</li></ol><p>Também: ${x} ÷ 16 = ${Math.floor(x / 16)} resto ${x % 16} → ${HEX[Math.floor(x / 16)]}${HEX[x % 16]}.</p>`;
    return r() < 0.5 ? { tipo: "valor", p: `Converta <b>${x}</b> para hexadecimal (2 dígitos).`, respostas: [h, "0x" + h], explica: exp }
      : { tipo: "valor", p: `Converta o hexadecimal <b class="mono">${h}</b> para decimal.`, respostas: [String(x)], explica: `<p>${HEX.indexOf(h[0])} × 16 + ${HEX.indexOf(h[1])} = <b>${x}</b></p>` + exp };
  });
  def("hex_bin", "Hexadecimal ↔ binário", "binario", (r) => {
    const x = int(r, 0, 255), h = x.toString(16).toUpperCase().padStart(2, "0"), b = bin8(x);
    return { tipo: "valor", p: `Converta o hexadecimal <b class="mono">${h}</b> para binário (8 bits).`, respostas: [b],
      explica: `<p>Cada dígito hexadecimal são 4 bits:</p>` + tabela(["Hex", "Valor", "4 bits"], [...h].map((c) => [c, HEX.indexOf(c), `<b class="mono">${HEX.indexOf(c).toString(2).padStart(4, "0")}</b>`])) + `<p>Junte: <b class="mono">${b}</b></p>` };
  });
  def("bits_mascara", "Bits de uma máscara", "binario", (r) => {
    const p = int(r, 8, 30), m = n2i(mascara(p));
    return { tipo: "valor", p: `Quantos bits a 1 tem a máscara <b class="mono">${m}</b>? (é o prefixo)`, respostas: [String(p), "/" + p],
      explica: `<p>Em binário: <span class="mono">${binIP(mascara(p))}</span>. Contam-se os 1: cada 255 são 8 bits; ${m.split(".").filter((o) => o !== "255" && o !== "0").map((o) => `${o} = <span class="mono">${bin8(+o)}</span> (${bin8(+o).replace(/0/g, "").length} bits)`).join(", ") || "sem octeto parcial"}. Total: <b>/${p}</b>.</p>` };
  });

  // Classes e endereços especiais
  function classe(o) { return o < 128 ? "A" : o < 192 ? "B" : o < 224 ? "C" : o < 240 ? "D" : "E"; }
  def("classe", "Classe do endereço", "classes", (r) => {
    const o = um(r, [int(r, 1, 126), int(r, 128, 191), int(r, 192, 223), int(r, 224, 239), int(r, 240, 254)]);
    const ip = [o, int(r, 0, 255), int(r, 0, 255), int(r, 1, 254)].join("."), c = classe(o);
    const op = opcoes(r, "Classe " + c, ["Classe A", "Classe B", "Classe C", "Classe D", "Classe E"]);
    return { tipo: "mc", p: `A que classe pertence <b class="mono">${ip}</b>?`, ...op,
      explica: `<p>Olha-se só para o <b>1.º octeto: ${o}</b>.</p>` + tabela(["Classe", "1.º octeto", "Bits iniciais", "Máscara por defeito"], [["A", "1–126", "0…", "255.0.0.0 (/8)"], ["B", "128–191", "10…", "255.255.0.0 (/16)"], ["C", "192–223", "110…", "255.255.255.0 (/24)"], ["D", "224–239", "1110…", "multicast"], ["E", "240–255", "1111…", "reservada"]]) + `<p>${o} → <b>classe ${c}</b>. Em binário ${o} = <span class="mono">${bin8(o)}</span>.</p>` };
  });
  def("privado", "Privado ou público?", "classes", (r) => {
    const casos = [[`10.${int(r, 0, 255)}.${int(r, 0, 255)}.${int(r, 1, 254)}`, "Privado (RFC 1918)"], [`172.${int(r, 16, 31)}.${int(r, 0, 255)}.${int(r, 1, 254)}`, "Privado (RFC 1918)"],
      [`192.168.${int(r, 0, 255)}.${int(r, 1, 254)}`, "Privado (RFC 1918)"], [`172.${um(r, [int(r, 1, 15), int(r, 32, 254)])}.${int(r, 0, 255)}.${int(r, 1, 254)}`, "Público"],
      [`${um(r, [8, 41, 102, 196, 197, 154, 105])}.${int(r, 0, 255)}.${int(r, 0, 255)}.${int(r, 1, 254)}`, "Público"], [`169.254.${int(r, 1, 254)}.${int(r, 1, 254)}`, "APIPA (link-local)"],
      [`127.0.0.${int(r, 1, 254)}`, "Loopback"], [`100.${int(r, 64, 127)}.${int(r, 0, 255)}.${int(r, 1, 254)}`, "Partilhado CGNAT (100.64.0.0/10)"]];
    const [ip, c] = um(r, casos);
    const op = opcoes(r, c, ["Privado (RFC 1918)", "Público", "APIPA (link-local)", "Loopback", "Partilhado CGNAT (100.64.0.0/10)"]);
    return { tipo: "mc", p: `O endereço <b class="mono">${ip}</b> é…`, ...op,
      explica: tabela(["Bloco", "Tipo"], [["10.0.0.0/8", "Privado"], ["172.16.0.0/12 (172.16 a 172.31)", "Privado"], ["192.168.0.0/16", "Privado"], ["127.0.0.0/8", "Loopback (o próprio PC)"], ["169.254.0.0/16", "APIPA: o PC não recebeu IP por DHCP"], ["100.64.0.0/10", "CGNAT dos operadores"], ["Outros (unicast)", "Público"]]) + `<p><b class="mono">${ip}</b> → <b>${c}</b>.</p>` };
  });
  def("mascara_defeito", "Máscara por defeito", "classes", (r) => {
    const o = um(r, [int(r, 1, 126), int(r, 128, 191), int(r, 192, 223)]), c = classe(o), m = { A: "255.0.0.0", B: "255.255.0.0", C: "255.255.255.0" }[c];
    return { tipo: "valor", p: `Qual é a máscara por defeito (classful) de <b class="mono">${o}.${int(r, 0, 255)}.${int(r, 0, 255)}.${int(r, 1, 254)}</b>?`, respostas: [m, "/" + { A: 8, B: 16, C: 24 }[c]],
      explica: `<p>1.º octeto ${o} → classe <b>${c}</b> → máscara <b class="mono">${m}</b> (/${{ A: 8, B: 16, C: 24 }[c]}).</p>` };
  });

  // Máscaras e prefixos
  def("prefixo_mascara", "Prefixo → máscara", "mascaras", (r) => {
    const p = int(r, 8, 30), m = n2i(mascara(p)), cheios = Math.floor(p / 8), resto = p % 8;
    return { tipo: "valor", p: `Escreva a máscara do prefixo <b>/${p}</b> em decimal.`, respostas: [m],
      explica: `<ol class="passos-res"><li>/${p} = ${p} bits a 1 seguidos de ${32 - p} bits a 0.</li><li>${cheios} octeto(s) completo(s) de 8 bits → ${"255.".repeat(cheios).slice(0, -1) || "nenhum"}.</li>${resto ? `<li>Sobram ${resto} bit(s) no octeto seguinte: <span class="mono">${"1".repeat(resto).padEnd(8, "0")}</span> = ${PESOS.slice(0, resto).join(" + ")} = <b>${256 - 2 ** (8 - resto)}</b>.</li>` : ""}<li>Resultado: <b class="mono">${m}</b></li></ol>` };
  });
  def("mascara_prefixo", "Máscara → prefixo", "mascaras", (r) => {
    const p = int(r, 8, 30), m = n2i(mascara(p));
    return { tipo: "valor", p: `Qual é o prefixo (CIDR) da máscara <b class="mono">${m}</b>?`, respostas: ["/" + p, String(p)],
      explica: `<p>Conte os bits a 1: <span class="mono">${binIP(mascara(p))}</span> → <b>/${p}</b>.</p>` };
  });
  def("wildcard", "Máscara wildcard", "mascaras", (r) => {
    const p = int(r, 8, 30), m = n2i(mascara(p)), w = n2i(~mascara(p) >>> 0);
    return { tipo: "valor", p: `Qual é a wildcard da máscara <b class="mono">${m}</b> (/${p})?`, respostas: [w],
      explica: `<p>Wildcard = 255.255.255.255 − máscara, octeto a octeto:</p>` + tabela(["", "1.º", "2.º", "3.º", "4.º"], [["255", 255, 255, 255, 255], ["− máscara", ...m.split(".")], ["<b>= wildcard</b>", ...w.split(".").map((x) => `<b>${x}</b>`)]]) };
  });
  def("hosts_prefixo", "Hosts de um prefixo", "mascaras", (r) => {
    const p = int(r, 16, 30), h = 2 ** (32 - p) - 2;
    return { tipo: "valor", p: `Quantos hosts úteis tem uma rede <b>/${p}</b>?`, respostas: [String(h)],
      explica: `<p>Bits de host = 32 − ${p} = <b>${32 - p}</b>. Endereços = 2<sup>${32 - p}</sup> = ${2 ** (32 - p)}. Úteis = ${2 ** (32 - p)} − 2 (rede e broadcast) = <b>${h}</b>.</p>` };
  });

  // Sub-redes
  function exSub(r, pergunta) {
    const p = prefixoAleatorio(r) === 8 ? 24 : prefixoAleatorio(r), ip = ipAleatorio(r, p);
    const s = passosSubrede(ip, p);
    const certa = { rede: s.rede, broadcast: s.bc, primeiro: s.primeiro, ultimo: s.ultimo, hosts: String(s.hosts) }[pergunta];
    const txt = { rede: "o <b>endereço de rede</b>", broadcast: "o <b>endereço de broadcast</b>", primeiro: "o <b>primeiro host</b> utilizável", ultimo: "o <b>último host</b> utilizável", hosts: "o número de <b>hosts úteis</b>" }[pergunta];
    return { tipo: "valor", p: `O PC tem o endereço <b class="mono">${ip}/${p}</b>. Qual é ${txt}?`, respostas: [certa],
      explica: s.txt + (pergunta === "rede" ? passosBinario(ip, p) : "") +
        tabela(["Rede", "Primeiro host", "Último host", "Broadcast", "Hosts"], [[s.rede, s.primeiro, s.ultimo, s.bc, s.hosts]].map((l) => l.map((x) => `<span class="mono">${x}</span>`))) };
  }
  def("sub_rede", "Endereço de rede", "subredes", (r) => exSub(r, "rede"));
  def("sub_broadcast", "Endereço de broadcast", "subredes", (r) => exSub(r, "broadcast"));
  def("sub_primeiro", "Primeiro host", "subredes", (r) => exSub(r, "primeiro"));
  def("sub_ultimo", "Último host", "subredes", (r) => exSub(r, "ultimo"));
  def("sub_hosts", "Hosts da sub-rede", "subredes", (r) => exSub(r, "hosts"));
  def("sub_mesma", "Mesma rede?", "subredes", (r) => {
    const p = int(r, 20, 29), a = ipAleatorio(r, p), m = mascara(p), ra = (i2n(a) & m) >>> 0;
    const mesma = r() < 0.5, bloco = 2 ** (32 - p);
    let b = mesma ? n2i(ra + int(r, 1, bloco - 2)) : n2i((ra + bloco * um(r, [1, -1, 2]) + int(r, 1, bloco - 2)) >>> 0);
    if (b === a) b = n2i(ra + (i2n(a) - ra === 1 ? 2 : 1));
    const rb = n2i((i2n(b) & m) >>> 0), igual = rb === n2i(ra);
    return { tipo: "vf", p: `Com máscara /${p}, os PCs <b class="mono">${a}</b> e <b class="mono">${b}</b> estão na <b>mesma rede</b> (comunicam sem router)?`, correta: igual,
      explica: `<p>Calcula-se a rede de cada um (IP AND máscara ${n2i(m)}):</p>` + tabela(["PC", "Rede"], [[a, n2i(ra)], [b, rb]].map((l) => l.map((x) => `<span class="mono">${x}</span>`))) + `<p>${igual ? "As redes são iguais → <b>mesma rede</b>." : "As redes são diferentes → precisam de um <b>router</b> (gateway) para comunicar."}</p>` };
  });
  def("prefixo_hosts", "Prefixo para N hosts", "subredes", (r) => {
    const h = um(r, [int(r, 2, 6), int(r, 7, 14), int(r, 15, 30), int(r, 31, 62), int(r, 63, 126), int(r, 127, 254), int(r, 255, 510), int(r, 511, 1000)]);
    let bits = 2; while (2 ** bits - 2 < h) bits++;
    const p = 32 - bits;
    return { tipo: "valor", p: `Uma sala precisa de <b>${h} hosts</b>. Qual é o <b>maior prefixo</b> (a rede mais pequena) que chega?`, respostas: ["/" + p, String(p), n2i(mascara(p))],
      explica: `<p>Procure o menor número de bits de host <i>h</i> com 2<sup>h</sup> − 2 ≥ ${h}:</p>` + tabela(["h", "2^h − 2", "Chega?"], [bits - 1, bits].filter((x) => x >= 2).map((x) => [x, 2 ** x - 2, 2 ** x - 2 >= h ? "<b>sim</b>" : "não"])) + `<p>h = ${bits} → prefixo = 32 − ${bits} = <b>/${p}</b> (máscara ${n2i(mascara(p))}, ${2 ** bits - 2} hosts).</p>` };
  });
  def("prefixo_redes", "Prefixo para N sub-redes", "subredes", (r) => {
    const base = um(r, [24, 24, 16, 20, 22]), n = int(r, 2, base === 16 ? 200 : 30);
    let b = 0; while (2 ** b < n) b++;
    const p = base + b;
    if (p > 30) return G.prefixo_redes.fn(r);
    return { tipo: "valor", p: `Tem a rede <b class="mono">${base === 16 ? "172.16.0.0" : base === 24 ? "192.168.10.0" : base === 20 ? "10.10.16.0" : "10.1.4.0"}/${base}</b> e precisa de <b>${n} sub-redes</b> do mesmo tamanho. Qual é o novo prefixo?`, respostas: ["/" + p, String(p), n2i(mascara(p))],
      explica: `<p>Pedem-se bits emprestados à parte de host: com <i>n</i> bits fazem-se 2<sup>n</sup> sub-redes.</p>` + tabela(["Bits", "Sub-redes"], [b - 1, b].filter((x) => x >= 1).map((x) => [x, 2 ** x + (2 ** x >= n ? " ✓" : "")])) + `<p>${b} bit(s) → /${base} + ${b} = <b>/${p}</b>. Cada sub-rede fica com ${2 ** (32 - p) - 2} hosts.</p>` };
  });
  def("sub_n", "A n-ésima sub-rede", "subredes", (r) => {
    const base = um(r, ["192.168.10.0/24", "192.168.1.0/24", "172.16.0.0/16", "10.0.0.0/16", "192.168.50.0/24"]);
    const [rede, bp] = base.split("/"), b0 = +bp, p = b0 + int(r, 2, b0 === 16 ? 8 : 5), total = 2 ** (p - b0), k = int(r, 2, Math.min(total, 12));
    const bloco = 2 ** (32 - p), alvo = i2n(rede) + (k - 1) * bloco;
    const lista = Array.from({ length: Math.min(k + 1, total) }, (_, i) => [i + 1 + ".ª", n2i(i2n(rede) + i * bloco) + "/" + p, n2i(i2n(rede) + (i + 1) * bloco - 1)]);
    return { tipo: "valor", p: `Dividiu <b class="mono">${base}</b> em sub-redes <b>/${p}</b>. Qual é o endereço da <b>${k}.ª</b> sub-rede?`, respostas: [n2i(alvo), n2i(alvo) + "/" + p],
      explica: `<p>Cada /${p} tem ${bloco} endereços (2<sup>${32 - p}</sup>). As sub-redes avançam de ${bloco} em ${bloco}${bloco >= 256 ? ` (de ${bloco / 256} em ${bloco / 256} no 3.º octeto)` : ""}:</p>` + tabela(["Sub-rede", "Rede", "Broadcast"], lista.map((l, i) => i === k - 1 ? l.map((x) => `<b class="mono">${x}</b>`) : l.map((x) => `<span class="mono">${x}</span>`))) };
  });

  // VLSM e desenho da rede lógica (com diagrama)
  const NOMES_LAN = ["Vendas", "Administração", "Armazém", "Receção", "Sala de aulas", "Laboratório", "Direção", "Contabilidade", "Wi-Fi visitantes", "Servidores", "Produção", "Urgência"];
  function planoVLSM(r) {
    const base = um(r, ["192.168.1.0", "192.168.10.0", "10.0.0.0", "172.16.0.0", "192.168.100.0"]);
    const n = int(r, 3, 5), nomes = baralhar(r, NOMES_LAN).slice(0, n);
    const lans = nomes.map((nm) => ({ nome: nm, hosts: um(r, [int(r, 50, 110), int(r, 20, 60), int(r, 10, 28), int(r, 3, 12)]) }));
    const wans = int(r, 0, 2);
    const pedidos = lans.map((l) => { let b = 2; while (2 ** b - 2 < l.hosts) b++; return Object.assign(l, { p: 32 - b, tam: 2 ** b }); })
      .sort((a, b) => b.tam - a.tam);
    for (let i = 0; i < wans; i++) pedidos.push({ nome: "WAN R1–R" + (i + 2), hosts: 2, p: 30, tam: 4, wan: true });
    const total = pedidos.reduce((a, x) => a + x.tam, 0);
    if (total > 256) return planoVLSM(r);
    let cur = i2n(base);
    pedidos.forEach((x) => { x.rede = n2i(cur); x.gw = n2i(cur + 1); x.ultimo = n2i(cur + x.tam - 2); x.bc = n2i(cur + x.tam - 1); x.mask = n2i(mascara(x.p)); cur += x.tam; });
    return { base: base + "/24", lista: pedidos };
  }
  function diagramaVLSM(pl, revelar) {
    const lans = pl.lista.filter((x) => !x.wan), wans = pl.lista.filter((x) => x.wan);
    const W = Math.max(640, lans.length * 170 + 40), H = 300, cx = W / 2, cy = 70;
    let s = `<svg viewBox="0 0 ${W} ${H}" class="fig diag-vlsm" role="img" aria-label="Diagrama da rede lógica">`;
    lans.forEach((l, i) => {
      const x = 20 + i * ((W - 40) / lans.length), w = (W - 40) / lans.length - 12, y = 180;
      s += `<line x1="${cx}" y1="${cy + 18}" x2="${x + w / 2}" y2="${y}" class="d-lig"/>`;
      s += `<rect x="${x}" y="${y}" width="${w}" height="${revelar ? 98 : 70}" rx="10" class="d-lan"/><text x="${x + w / 2}" y="${y + 22}" class="d-t1">${esc(l.nome)}</text><text x="${x + w / 2}" y="${y + 42}" class="d-t2">${l.hosts} hosts</text>`;
      s += revelar ? `<text x="${x + w / 2}" y="${y + 62}" class="d-t3">${l.rede}/${l.p}</text><text x="${x + w / 2}" y="${y + 82}" class="d-t4">gw ${l.gw}</text>` : `<text x="${x + w / 2}" y="${y + 60}" class="d-t3">?/?</text>`;
    });
    wans.forEach((w, i) => {
      const x = i === 0 ? 20 : W - 200;
      s += `<line x1="${cx}" y1="${cy}" x2="${x + 90}" y2="40" class="d-lig d-wan"/><rect x="${x}" y="18" width="180" height="${revelar ? 50 : 36}" rx="8" class="d-r"/><text x="${x + 90}" y="40" class="d-t2">${esc(w.nome)}</text>${revelar ? `<text x="${x + 90}" y="60" class="d-t3">${w.rede}/30</text>` : ""}`;
    });
    s += `<circle cx="${cx}" cy="${cy}" r="26" class="d-r"/><path d="M${cx - 12} ${cy - 4} h24 M${cx + 6} ${cy - 10} l6 6 -6 6 M${cx - 12} ${cy + 6} h24 M${cx - 6} ${cy} l-6 6 6 6" class="d-seta"/><text x="${cx}" y="${cy + 44}" class="d-t2">R1</text>`;
    return s + "</svg>";
  }
  function tabelaVLSM(pl) {
    return tabela(["Sub-rede", "Hosts pedidos", "Prefixo", "Rede", "Gateway (1.º)", "Último host", "Broadcast"], pl.lista.map((x) => [esc(x.nome), x.hosts, "/" + x.p, `<span class="mono">${x.rede}</span>`, `<span class="mono">${x.gw}</span>`, `<span class="mono">${x.ultimo}</span>`, `<span class="mono">${x.bc}</span>`]));
  }
  def("vlsm", "VLSM e desenho da rede", "vlsm", (r) => {
    const pl = planoVLSM(r), lans = pl.lista.filter((x) => !x.wan), alvo = um(r, lans);
    const q = um(r, ["rede", "gw", "bc"]);
    const certa = alvo[q === "rede" ? "rede" : q === "gw" ? "gw" : "bc"];
    return { tipo: "valor", fig: diagramaVLSM(pl, false),
      p: `Desenhe a rede lógica com VLSM a partir de <b class="mono">${pl.base}</b> (das maiores para as mais pequenas${pl.lista.some((x) => x.wan) ? "; as ligações WAN /30 ficam no fim" : ""}): ${lans.map((l) => `${esc(l.nome)} ${l.hosts} hosts`).join(", ")}. Qual é ${q === "rede" ? "o <b>endereço de rede</b>" : q === "gw" ? "o <b>gateway</b> (1.º endereço útil)" : "o <b>broadcast</b>"} de <b>${esc(alvo.nome)}</b>?`,
      respostas: [certa, q === "rede" ? certa + "/" + alvo.p : certa],
      explica: `<ol class="passos-res"><li>Ordene as sub-redes da maior para a mais pequena.</li><li>Para cada uma, escolha o prefixo com 2<sup>h</sup> − 2 ≥ hosts.</li><li>Atribua os blocos seguidos, sem buracos, a começar em ${pl.base.split("/")[0]}.</li></ol>` + tabelaVLSM(pl) + diagramaVLSM(pl, true) };
  });

  // Modelos OSI e TCP/IP
  def("osi_camada", "Camada OSI", "osi", (r) => {
    const [item, c] = um(r, OSI);
    const op = opcoes(r, NOMES_OSI[c], baralhar(r, NOMES_OSI.slice(1)));
    return { tipo: "mc", p: `Em que camada do modelo OSI trabalha: <b>${esc(item)}</b>?`, ...op,
      explica: `<p><b>${esc(item)}</b> → camada <b>${NOMES_OSI[c]}</b> (no TCP/IP: ${TCPIP[c]}).</p>` + tabela(["N.º", "Camada OSI", "PDU / exemplos"], [[7, "Aplicação", "HTTP, DNS, DHCP"], [6, "Apresentação", "cifra, formatos"], [5, "Sessão", "sessões"], [4, "Transporte", "segmento: TCP, UDP, portas"], [3, "Rede", "pacote: IP, router"], [2, "Ligação de dados", "trama: MAC, switch"], [1, "Física", "bits: cabos, sinais"]]) };
  });
  def("tcpip_camada", "Camada TCP/IP", "osi", (r) => {
    const [item, c] = um(r, OSI);
    const op = opcoes(r, TCPIP[c], ["Acesso à rede", "Internet", "Transporte", "Aplicação"]);
    return { tipo: "mc", p: `No modelo TCP/IP, em que camada fica <b>${esc(item)}</b>?`, ...op,
      explica: tabela(["TCP/IP", "OSI equivalente"], [["Aplicação", "7, 6 e 5"], ["Transporte", "4"], ["Internet", "3"], ["Acesso à rede", "2 e 1"]]) + `<p>${esc(item)} → OSI ${c} → <b>${TCPIP[c]}</b>.</p>` };
  });
  def("pdu", "Nome da PDU", "osi", (r) => {
    const [cam, pdu] = um(r, PDU);
    const op = opcoes(r, pdu, PDU.map((x) => x[1]));
    return { tipo: "mc", p: `Como se chama a unidade de dados (PDU) na camada <b>${cam}</b>?`, ...op,
      explica: `<p>Encapsulamento de cima para baixo: Dados → Segmento → Pacote → Trama → Bits.</p>` + tabela(["Camada", "PDU"], PDU) };
  });
  def("porta", "Portas dos protocolos", "portas", (r) => {
    const [nome, porta, tr] = um(r, PORTAS);
    if (r() < 0.5) return { tipo: "valor", p: `Que número de porta usa <b>${esc(nome)}</b>?`, respostas: [porta.split(" ")[0]], explica: `<p>${esc(nome)} → porta <b>${porta}</b> (${tr}).</p>` };
    const op = opcoes(r, nome, baralhar(r, PORTAS.map((x) => x[0])));
    return { tipo: "mc", p: `Um pacote vai para a porta <b>${porta.split(" ")[0]}</b>. Que serviço é?`, ...op, explica: `<p>Porta ${porta} → <b>${esc(nome)}</b> sobre ${tr}.</p>` };
  });
  def("tcp_udp", "TCP ou UDP?", "portas", (r) => {
    const [nome, porta, tr] = um(r, PORTAS.filter((x) => x[2] !== "TCP e UDP" && x[2] !== "UDP e TCP"));
    const op = opcoes(r, tr, ["TCP", "UDP"]);
    return { tipo: "mc", p: `<b>${esc(nome)}</b> (porta ${porta}) usa…`, ...op,
      explica: `<p><b>${tr}</b>. TCP = fiável, com ligação (handshake, confirmações): web, e-mail, SSH, ficheiros. UDP = rápido, sem ligação: DNS, DHCP, TFTP, voz, vídeo, SNMP.</p>` };
  });

  // ------------------------------------------------------------ geradores a partir de dados do curso
  // Termos do glossário (o que significa…?)
  function exTermo(r, termos, todos) {
    const t = um(r, termos), outros = baralhar(r, todos.filter((x) => x.termo !== t.termo)).slice(0, 3);
    const op = opcoes(r, t.def, outros.map((x) => x.def));
    return { tipo: "mc", p: `O que significa <b>${esc(t.termo)}</b>${t.extenso ? ` (${esc(t.extenso)})` : ""}?`, ...op,
      explica: `<p><b>${esc(t.termo)}</b>: ${esc(t.def)}</p>${t.exemplo ? `<p class="peq">Exemplo: ${esc(t.exemplo)}</p>` : ""}` };
  }
  function exSigla(r, termos) {
    const com = termos.filter((t) => t.extenso); if (!com.length) return null;
    const t = um(r, com);
    return { tipo: "mc", p: `O que quer dizer a sigla <b>${esc(t.termo)}</b>?`, ...opcoes(r, t.extenso, baralhar(r, (window.CCNA.glossario || []).filter((x) => x.extenso && x.termo !== t.termo)).slice(0, 3).map((x) => x.extenso)),
      explica: `<p><b>${esc(t.termo)}</b> = ${esc(t.extenso)}. ${esc(t.def)}</p>` };
  }
  function exProtocolo(r, ps) {
    const p = um(r, ps), todos = window.CCNA.protocolos || [];
    const tipo = um(r, ["para", "camada", "porta"]);
    if (tipo === "porta" && p.portas && p.portas !== "—") return { tipo: "mc", p: `Que porta usa <b>${esc(p.sigla)}</b>?`, ...opcoes(r, p.portas, baralhar(r, todos.filter((x) => x.portas && x.portas !== "—" && x.portas !== p.portas)).map((x) => x.portas)), explica: `<p>${esc(p.sigla)}: porta ${esc(p.portas)}, transporte ${esc(p.transporte)}.</p>` };
    if (tipo === "camada") return { tipo: "mc", p: `Em que camada OSI trabalha <b>${esc(p.sigla)}</b>?`, ...opcoes(r, NOMES_OSI[p.camada_osi], NOMES_OSI.slice(1)), explica: `<p>${esc(p.sigla)} → camada ${NOMES_OSI[p.camada_osi]} (TCP/IP: ${esc(p.camada_tcpip)}). ${esc(p.para_que)}</p>` };
    return { tipo: "mc", p: `Para que serve <b>${esc(p.sigla)}</b>?`, ...opcoes(r, p.para_que, baralhar(r, todos.filter((x) => x.id !== p.id)).slice(0, 3).map((x) => x.para_que)), explica: `<p><b>${esc(p.nome)}</b>. ${esc(p.para_que)}</p>` };
  }

  // ------------------------------------------------------------ API
  // Gera um exercício de um dos geradores da lista. ctx: { quiz: [...], termos: [...], protocolos: [...] }
  function gerar(lista, semente, ctx) {
    const r = rng(semente);
    ctx = ctx || {};
    const opc = lista.filter((g) => G[g] || (g === "quiz" && ctx.quiz && ctx.quiz.length) || (g === "termos" && ctx.termos && ctx.termos.length >= 2) || (g === "siglas" && ctx.termos && ctx.termos.some((t) => t.extenso)) || (g === "protocolos" && ctx.protocolos && ctx.protocolos.length));
    if (!opc.length) return null;
    const g = um(r, opc);
    let ex;
    if (G[g]) ex = G[g].fn(r);
    else if (g === "quiz") ex = Object.assign({}, um(r, ctx.quiz));
    else if (g === "termos") ex = exTermo(r, ctx.termos, (window.CCNA.glossario || []).length > 4 ? window.CCNA.glossario : ctx.termos);
    else if (g === "siglas") ex = exSigla(r, ctx.termos) || exTermo(r, ctx.termos, window.CCNA.glossario || ctx.termos);
    else if (g === "protocolos") ex = exProtocolo(r, ctx.protocolos);
    ex.gen = g;
    return ex;
  }
  // Exercício N do caderno (sempre igual para o mesmo N).
  // Os cadernos não repetem exercícios: salta-se uma semente quando sai um enunciado já visto.
  const sementesCad = {};
  function doCaderno(cad, n) {
    if (!sementesCad[cad.id]) {
      const vistos = new Set(), lista = [];
      for (let s = 1; lista.length < cad.total && s < cad.total * 40; s++) {
        const ex = gerar(cad.geradores, cad.semente * 100000 + s, {});
        if (!vistos.has(ex.p)) { vistos.add(ex.p); lista.push(s); }
      }
      sementesCad[cad.id] = lista;
    }
    const s = sementesCad[cad.id][n - 1] || n;
    return gerar(cad.geradores, cad.semente * 100000 + s, {});
  }

  const CADERNOS = [
    { id: "binario", titulo: "Conversão binária", total: 50, semente: 11, geradores: ["dec_bin", "bin_dec", "dec_bin", "bin_dec", "ip_bin", "bin_ip", "dec_hex", "hex_bin", "bits_mascara"],
      desc: "Decimal ↔ binário, endereços IP em binário, hexadecimal e bits das máscaras.", licao: "n_conv_bin" },
    { id: "subredes", titulo: "Cálculo de sub-redes", total: 100, semente: 23,
      geradores: ["sub_rede", "sub_broadcast", "sub_primeiro", "sub_ultimo", "sub_hosts", "sub_mesma", "prefixo_hosts", "prefixo_redes", "sub_n", "prefixo_mascara", "mascara_prefixo", "hosts_prefixo"],
      desc: "Rede, broadcast, intervalo de hosts, mesma rede, prefixo para N hosts ou N sub-redes, n-ésima sub-rede.", licao: "n_sub_passo" },
    { id: "classes", titulo: "Classes, máscaras e wildcard", total: 40, semente: 37, geradores: ["classe", "privado", "mascara_defeito", "prefixo_mascara", "mascara_prefixo", "wildcard", "hosts_prefixo"],
      desc: "Classe de um endereço, privados e especiais, máscara por defeito, prefixo ↔ máscara, wildcard.", licao: "n_classes" },
    { id: "vlsm", titulo: "VLSM e desenho da rede lógica", total: 20, semente: 41, geradores: ["vlsm"],
      desc: "Planos de endereçamento completos com diagrama da rede e tabela de endereçamento.", licao: "n_vlsm_desenho" },
    { id: "modelos", titulo: "OSI, TCP/IP e portas", total: 40, semente: 53, geradores: ["osi_camada", "tcpip_camada", "pdu", "porta", "tcp_udp"],
      desc: "Camadas, unidades de dados, portas e transporte dos protocolos.", licao: "n_osi_fundo" },
  ];

  // Correção de respostas escritas (ignora maiúsculas, espaços e um "/" inicial)
  const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, "").replace(/^\//, "").replace(/^0x/, "");
  function corrigir(ex, resposta) {
    if (ex.tipo === "valor" || ex.tipo === "cmd") {
      const r = norm(resposta), rs = (ex.respostas || []).map(norm);
      if (ex.tipo === "cmd") { const c = (s) => s.replace(/\\+/g, "\\"); return rs.map(c).includes(c(r)); }
      return rs.includes(r) || rs.includes(r.replace(/\./g, "")) && /^[01.]+$/.test(r);
    }
    if (ex.tipo === "vf") return resposta === ex.correta;
    return resposta === ex.correta;
  }

  window.Exercicios = { GERADORES: G, CADERNOS, gerar, doCaderno, corrigir, rng, util: { n2i, i2n, mascara, bin8, binIP, passosSubrede } };
})();
