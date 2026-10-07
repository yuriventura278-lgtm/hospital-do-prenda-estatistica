/* Ilustrações SVG: ícones de equipamentos, painéis e diagramas didáticos.
   Todas as cores vêm de variáveis CSS, por isso funcionam no tema claro e escuro. */
(function () {
  "use strict";

  // Ícones 64×64 desenhados no estilo dos diagramas de rede.
  const ICONES = {
    router: `
      <ellipse cx="32" cy="40" rx="26" ry="10" class="i-corpo-esc"/>
      <rect x="6" y="26" width="52" height="14" class="i-corpo-esc"/>
      <ellipse cx="32" cy="26" rx="26" ry="10" class="i-corpo"/>
      <g class="i-seta">
        <path d="M14 24 l8 -3 v2 h6 v2 h-6 v2z"/><path d="M50 28 l-8 3 v-2 h-6 v-2 h6 v-2z"/>
        <path d="M29 17 l3 -4 l3 4 h-2 v4 h-2 v-4z"/><path d="M35 35 l-3 4 l-3 -4 h2 v-4 h2 v4z"/>
      </g>`,
    switch: `
      <path d="M8 22 L16 14 H56 L56 42 L48 50 H8 Z" class="i-corpo-esc"/>
      <rect x="8" y="22" width="40" height="28" class="i-corpo"/>
      <path d="M8 22 L16 14 H56 L48 22 Z" class="i-topo"/>
      <g class="i-seta">
        <path d="M14 30 h16 v-3 l6 4 l-6 4 v-3 h-16z"/><path d="M42 42 h-16 v3 l-6 -4 l6 -4 v3 h16z"/>
      </g>`,
    switch_l3: `
      <path d="M8 22 L16 14 H56 L56 42 L48 50 H8 Z" class="i-corpo-esc"/>
      <rect x="8" y="22" width="40" height="28" class="i-corpo"/>
      <path d="M8 22 L16 14 H56 L48 22 Z" class="i-topo"/>
      <g class="i-seta">
        <path d="M13 30 h12 v-3 l5 4 l-5 4 v-3 h-12z"/><path d="M43 42 h-12 v3 l-5 -4 l5 -4 v3 h12z"/>
      </g>
      <circle cx="36" cy="18" r="4" class="i-seta"/>`,
    firewall: `
      <rect x="8" y="16" width="48" height="36" class="i-tijolo-base"/>
      <g class="i-tijolo">
        <rect x="9" y="17" width="14" height="7"/><rect x="25" y="17" width="14" height="7"/><rect x="41" y="17" width="14" height="7"/>
        <rect x="9" y="26" width="6" height="7"/><rect x="17" y="26" width="14" height="7"/><rect x="33" y="26" width="14" height="7"/><rect x="49" y="26" width="6" height="7"/>
        <rect x="9" y="35" width="14" height="7"/><rect x="25" y="35" width="14" height="7"/><rect x="41" y="35" width="14" height="7"/>
        <rect x="9" y="44" width="6" height="7"/><rect x="17" y="44" width="14" height="7"/><rect x="33" y="44" width="14" height="7"/><rect x="49" y="44" width="6" height="7"/>
      </g>`,
    ap: `
      <path d="M10 44 Q32 30 54 44 L54 48 Q32 56 10 48 Z" class="i-corpo"/>
      <circle cx="32" cy="45" r="2.5" class="i-led"/>
      <g class="i-onda" fill="none">
        <path d="M22 30 Q32 20 42 30"/><path d="M16 24 Q32 8 48 24"/>
      </g>`,
    wlc: `
      <rect x="6" y="30" width="52" height="18" rx="3" class="i-corpo"/>
      <g class="i-led"><circle cx="14" cy="39" r="2"/><circle cx="21" cy="39" r="2"/></g>
      <rect x="30" y="36" width="22" height="6" rx="1" class="i-corpo-esc"/>
      <g class="i-onda" fill="none"><path d="M24 22 Q32 14 40 22"/><path d="M18 17 Q32 4 46 17"/></g>`,
    pc: `
      <rect x="10" y="12" width="44" height="30" rx="3" class="i-corpo"/>
      <rect x="14" y="16" width="36" height="22" class="i-ecra"/>
      <path d="M26 42 h12 l3 8 h-18z" class="i-corpo-esc"/>
      <rect x="18" y="50" width="28" height="3" rx="1.5" class="i-corpo-esc"/>`,
    portatil: `
      <rect x="14" y="14" width="36" height="26" rx="2" class="i-corpo"/>
      <rect x="17" y="17" width="30" height="20" class="i-ecra"/>
      <path d="M6 42 h52 l-4 6 h-44z" class="i-corpo-esc"/>`,
    servidor: `
      <rect x="18" y="8" width="28" height="48" rx="3" class="i-corpo"/>
      <g class="i-corpo-esc"><rect x="22" y="14" width="20" height="5"/><rect x="22" y="23" width="20" height="5"/><rect x="22" y="32" width="20" height="5"/></g>
      <g class="i-led"><circle cx="38" cy="47" r="2"/></g>`,
    nuvem: `
      <path d="M18 46 Q6 46 8 36 Q10 28 19 29 Q20 16 33 16 Q44 16 46 26 Q57 25 57 36 Q57 46 46 46 Z" class="i-nuvem"/>`,
    telefone_ip: `
      <rect x="14" y="20" width="36" height="30" rx="4" class="i-corpo"/>
      <rect x="20" y="25" width="16" height="10" class="i-ecra"/>
      <path d="M10 18 Q12 10 20 12 L22 18 Q16 20 16 26 Z" class="i-corpo-esc"/>
      <g class="i-corpo-esc"><rect x="20" y="39" width="4" height="3"/><rect x="27" y="39" width="4" height="3"/><rect x="34" y="39" width="4" height="3"/><rect x="20" y="44" width="4" height="3"/><rect x="27" y="44" width="4" height="3"/><rect x="34" y="44" width="4" height="3"/></g>`,
  };

  function icone(tipo, tamanho) {
    const t = tamanho || 40;
    return `<svg class="ico" viewBox="0 0 64 64" width="${t}" height="${t}" aria-hidden="true">${ICONES[tipo] || ICONES.pc}</svg>`;
  }

  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const T = (x, y, txt, cls, extra) => `<text x="${x}" y="${y}" class="${cls || "f-txt"}" ${extra || ""}>${esc(txt)}</text>`;

  // ---------------------------------------------------------------- painéis
  function painelSwitch() {
    let portas = "";
    for (let i = 0; i < 24; i++) {
      const col = Math.floor(i / 2), linha = i % 2;
      const x = 60 + col * 26 + Math.floor(col / 6) * 10, y = 34 + linha * 30;
      const estado = [0, 1, 2, 4, 5, 9, 12, 13, 17].includes(i) ? "f-led-on" : (i === 7 ? "f-led-amb" : "f-led-off");
      portas += `<rect x="${x}" y="${y}" width="20" height="18" rx="2" class="f-porta"/><rect x="${x + 6}" y="${y + 13}" width="8" height="5" class="f-porta-in"/>`;
      portas += `<rect x="${x + 2}" y="${y - 6}" width="5" height="3" class="${estado}"/>`;
      portas += T(x + 10, linha ? y + 28 : y - 9, String(i + 1), "f-mini", 'text-anchor="middle"');
    }
    let sfp = "";
    for (let i = 0; i < 2; i++) sfp += `<rect x="${410 + i * 30}" y="44" width="24" height="16" rx="1" class="f-porta"/><rect x="${414 + i * 30}" y="50" width="16" height="4" class="f-porta-in"/>` + T(422 + i * 30, 76, "G0/" + (i + 1), "f-mini", 'text-anchor="middle"');
    return `<svg viewBox="0 0 520 120" class="fig">
      <rect x="4" y="10" width="512" height="96" rx="6" class="f-chassi"/>
      ${T(16, 28, "SW-24", "f-label")}
      <g class="f-led-on"><circle cx="24" cy="52" r="3"/></g>${T(32, 56, "SYST", "f-mini")}
      <g class="f-led-on"><circle cx="24" cy="68" r="3"/></g>${T(32, 72, "STAT", "f-mini")}
      <rect x="18" y="80" width="14" height="10" rx="2" class="f-btn"/>${T(36, 89, "MODE", "f-mini")}
      ${portas}${sfp}
      <rect x="474" y="44" width="22" height="18" rx="2" class="f-consola"/>${T(485, 76, "CON", "f-mini", 'text-anchor="middle"')}
      ${T(60, 102, "FastEthernet0/1–24 (RJ45, 10/100)", "f-mini")}${T(400, 102, "Uplinks SFP", "f-mini")}
    </svg>`;
  }

  function painelRouter() {
    const ge = [0, 1, 2].map((i) => `<rect x="${150 + i * 34}" y="40" width="26" height="22" rx="2" class="f-porta"/><rect x="${158 + i * 34}" y="56" width="10" height="6" class="f-porta-in"/>${T(163 + i * 34, 76, "G0/0/" + i, "f-mini", 'text-anchor="middle"')}<rect x="${152 + i * 34}" y="33" width="6" height="3" class="${i < 2 ? "f-led-on" : "f-led-off"}"/>`).join("");
    return `<svg viewBox="0 0 520 140" class="fig">
      <rect x="4" y="14" width="512" height="112" rx="6" class="f-chassi"/>
      <rect x="18" y="32" width="56" height="40" rx="3" class="f-slot"/>${T(46, 86, "Fonte", "f-mini", 'text-anchor="middle"')}
      <circle cx="46" cy="52" r="10" class="f-porta"/>
      ${T(100, 30, "ISR", "f-label")}
      ${ge}
      <rect x="270" y="38" width="22" height="18" rx="2" class="f-consola"/>${T(281, 70, "CON", "f-mini", 'text-anchor="middle"')}
      <rect x="300" y="38" width="22" height="18" rx="2" class="f-porta"/>${T(311, 70, "AUX", "f-mini", 'text-anchor="middle"')}
      <rect x="330" y="42" width="14" height="10" rx="2" class="f-consola"/>${T(337, 70, "USB", "f-mini", 'text-anchor="middle"')}
      <rect x="360" y="30" width="140" height="36" rx="3" class="f-slot"/>${T(430, 52, "NIM 1 (WAN/4G/serial)", "f-mini", 'text-anchor="middle"')}
      <rect x="360" y="76" width="140" height="36" rx="3" class="f-slot"/>${T(430, 98, "NIM 2", "f-mini", 'text-anchor="middle"')}
      ${T(150, 110, "Consola: RJ45 (cabo rollover) ou USB", "f-mini")}
    </svg>`;
  }

  // ---------------------------------------------------------------- cabos
  function caboUtp() {
    const cores = ["f-par1", "f-par2", "f-par3", "f-par4"];
    let pares = "";
    cores.forEach((c, i) => {
      const y = 34 + i * 16;
      pares += `<path d="M190 ${y} q10 -6 20 0 t20 0 t20 0 t20 0 t20 0 t20 0" class="${c}" fill="none" stroke-width="4"/>`;
      pares += `<path d="M190 ${y + 4} q10 6 20 0 t20 0 t20 0 t20 0 t20 0 t20 0" class="${c} f-tracejado" fill="none" stroke-width="4"/>`;
    });
    return `<svg viewBox="0 0 520 130" class="fig">
      <rect x="20" y="36" width="90" height="56" rx="4" class="f-rj45"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="${30 + i * 9}" y="42" width="5" height="16" class="f-pino"/>`).join("")}
      <path d="M40 92 h50 l-6 14 h-38z" class="f-rj45"/>
      <rect x="110" y="48" width="80" height="34" rx="10" class="f-capa"/>
      ${pares}
      <rect x="310" y="48" width="90" height="34" rx="10" class="f-capa"/>
      ${T(65, 28, "RJ45 (8P8C)", "f-label", 'text-anchor="middle"')}
      ${T(250, 120, "4 pares entrançados", "f-mini", 'text-anchor="middle"')}
      ${T(420, 60, "Cat 5e / 6 / 6a", "f-label")}${T(420, 78, "até 100 m", "f-mini")}
    </svg>`;
  }

  function caboFibra() {
    return `<svg viewBox="0 0 520 140" class="fig">
      <rect x="30" y="40" width="70" height="22" rx="3" class="f-lc"/><rect x="30" y="68" width="70" height="22" rx="3" class="f-lc"/>
      <rect x="100" y="46" width="30" height="10" class="f-ferrule"/><rect x="100" y="74" width="30" height="10" class="f-ferrule"/>
      <path d="M30 51 C -10 51, 0 120, 60 120 H 250" class="f-fibra" fill="none"/>
      <path d="M30 79 C 0 79, 10 110, 60 110 H 250" class="f-fibra" fill="none"/>
      ${T(65, 32, "LC duplex", "f-label", 'text-anchor="middle"')}
      <rect x="300" y="40" width="150" height="50" rx="4" class="f-sfp"/>
      <rect x="300" y="48" width="26" height="12" class="f-porta-in"/><rect x="300" y="70" width="26" height="12" class="f-porta-in"/>
      <rect x="440" y="52" width="26" height="26" class="f-pino"/>
      ${T(375, 110, "Módulo SFP (encaixa no switch)", "f-mini", 'text-anchor="middle"')}
      <circle cx="160" cy="40" r="18" class="f-capa"/><circle cx="160" cy="40" r="6" class="f-nucleo"/>
      ${T(186, 36, "núcleo", "f-mini")}${T(186, 50, "MMF 50 µm · SMF 9 µm", "f-mini")}
    </svg>`;
  }

  function caboConsola() {
    return `<svg viewBox="0 0 520 120" class="fig">
      <rect x="20" y="40" width="70" height="40" rx="4" class="f-rj45"/>
      <path d="M90 60 C 200 20, 300 100, 400 60" class="f-consola-cabo" fill="none"/>
      <path d="M400 40 h70 l-8 40 h-54z" class="f-db9"/>
      ${[0, 1, 2, 3, 4].map((i) => `<circle cx="${414 + i * 11}" cy="52" r="2.5" class="f-pino"/>`).join("")}
      ${[0, 1, 2, 3].map((i) => `<circle cx="${419 + i * 11}" cy="66" r="2.5" class="f-pino"/>`).join("")}
      ${T(55, 30, "RJ45 → porta CONSOLE", "f-label", 'text-anchor="middle"')}
      ${T(435, 30, "DB9 → PC (ou USB)", "f-label", 'text-anchor="middle"')}
      ${T(245, 110, "Cabo rollover: pino 1↔8, 2↔7 … · 9600 8N1", "f-mini", 'text-anchor="middle"')}
    </svg>`;
  }

  function rj45Pinos() {
    const a = [["bv", "Branco-verde"], ["v", "Verde"], ["bl", "Branco-laranja"], ["az", "Azul"], ["baz", "Branco-azul"], ["l", "Laranja"], ["bc", "Branco-castanho"], ["c", "Castanho"]];
    const b = [["bl", "Branco-laranja"], ["l", "Laranja"], ["bv", "Branco-verde"], ["az", "Azul"], ["baz", "Branco-azul"], ["v", "Verde"], ["bc", "Branco-castanho"], ["c", "Castanho"]];
    const fio = (lista, x0, titulo) => `${T(x0 + 70, 22, titulo, "f-label", 'text-anchor="middle"')}` + lista.map((f, i) => {
      const x = x0 + i * 18;
      return `<rect x="${x}" y="32" width="12" height="70" class="f-fio-${f[0]}"/>${T(x + 6, 116, String(i + 1), "f-mini", 'text-anchor="middle"')}`;
    }).join("");
    return `<svg viewBox="0 0 520 130" class="fig">${fio(a, 30, "T568A")}${fio(b, 300, "T568B")}
      ${T(260, 70, "direto = B↔B", "f-mini", 'text-anchor="middle"')}${T(260, 86, "cruzado = A↔B", "f-mini", 'text-anchor="middle"')}</svg>`;
  }

  // ---------------------------------------------------------------- diagramas
  function osi() {
    const camadas = ["Aplicação", "Apresentação", "Sessão", "Transporte", "Rede", "Ligação de dados", "Física"];
    let s = "";
    camadas.forEach((c, i) => {
      const y = 12 + i * 30;
      s += `<rect x="20" y="${y}" width="200" height="26" rx="4" class="f-camada f-c${i}"/>${T(34, y + 17, (7 - i) + "  " + c, "f-txt-claro")}`;
    });
    const tcp = [["Aplicação", 0, 3], ["Transporte", 3, 1], ["Internet", 4, 1], ["Acesso à rede", 5, 2]];
    tcp.forEach(([n, ini, qt], i) => {
      const y = 12 + ini * 30, h = qt * 30 - 4;
      s += `<rect x="290" y="${y}" width="200" height="${h}" rx="4" class="f-camada f-t${i}"/>${T(390, y + h / 2 + 5, n, "f-txt-claro", 'text-anchor="middle"')}`;
    });
    s += T(120, 232, "OSI", "f-label", 'text-anchor="middle"') + T(390, 232, "TCP/IP", "f-label", 'text-anchor="middle"');
    return `<svg viewBox="0 0 510 240" class="fig">${s}</svg>`;
  }

  function encapsulamento() {
    const linhas = [
      ["Dados", [["DADOS", 220, 120, "f-dados"]]],
      ["Segmento", [["TCP", 170, 50, "f-h4"], ["DADOS", 220, 120, "f-dados"]]],
      ["Pacote", [["IP", 120, 50, "f-h3"], ["TCP", 170, 50, "f-h4"], ["DADOS", 220, 120, "f-dados"]]],
      ["Trama", [["ETH", 70, 50, "f-h2"], ["IP", 120, 50, "f-h3"], ["TCP", 170, 50, "f-h4"], ["DADOS", 220, 120, "f-dados"], ["FCS", 340, 40, "f-h2"]]],
      ["Bits", [["0110100101110010101011100101011010101", 70, 310, "f-bits"]]],
    ];
    let s = "";
    linhas.forEach(([nome, partes], i) => {
      const y = 14 + i * 36;
      s += T(8, y + 18, nome, "f-label");
      partes.forEach(([t, x, w, c]) => { s += `<rect x="${x}" y="${y}" width="${w}" height="26" rx="3" class="${c}"/>${T(x + w / 2, y + 18, t, "f-txt-claro", 'text-anchor="middle"')}`; });
    });
    s += `<path d="M400 20 V180" class="f-seta-linha" marker-end="url(#ponta)"/>${T(408, 100, "envio", "f-mini")}`;
    return `<svg viewBox="0 0 460 200" class="fig"><defs><marker id="ponta" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8z" class="f-seta"/></marker></defs>${s}</svg>`;
  }

  function handshake() {
    const seta = (y, ida, txt) => {
      const [x1, x2] = ida ? [80, 380] : [380, 80];
      return `<path d="M${x1} ${y} L${x2} ${y + 26}" class="f-seta-linha" marker-end="url(#ponta2)"/>${T(230, y + 8, txt, "f-label", 'text-anchor="middle"')}`;
    };
    return `<svg viewBox="0 0 460 210" class="fig"><defs><marker id="ponta2" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8z" class="f-seta"/></marker></defs>
      ${T(80, 18, "Cliente", "f-label", 'text-anchor="middle"')}${T(380, 18, "Servidor :443", "f-label", 'text-anchor="middle"')}
      <path d="M80 26 V200 M380 26 V200" class="f-linha-vida"/>
      ${seta(40, true, "SYN  seq=100")}${seta(90, false, "SYN-ACK  seq=300 ack=101")}${seta(140, true, "ACK  ack=301")}
      ${T(230, 200, "Ligação estabelecida → dados", "f-mini", 'text-anchor="middle"')}</svg>`;
  }

  function trama() {
    const campos = [["Preâmbulo+SFD", 8, "f-h1"], ["MAC dest.", 6, "f-h2"], ["MAC orig.", 6, "f-h2"], ["802.1Q", 4, "f-tag"], ["Tipo", 2, "f-h3"], ["Dados 46–1500", 14, "f-dados"], ["FCS", 4, "f-h2"]];
    let x = 10, s = "";
    campos.forEach(([n, b, c]) => {
      const w = b * 11;
      s += `<rect x="${x}" y="30" width="${w - 2}" height="40" rx="3" class="${c}"/>${T(x + w / 2 - 1, 54, n, "f-mini-claro", 'text-anchor="middle"')}`;
      s += T(x + w / 2 - 1, 88, b === 14 ? "46–1500 B" : b + " B", "f-mini", 'text-anchor="middle"');
      x += w;
    });
    s += T(10, 20, "Trama Ethernet II (a etiqueta 802.1Q só existe em trunks)", "f-label");
    return `<svg viewBox="0 0 520 100" class="fig">${s}</svg>`;
  }

  function cabecalho(v6) {
    const campos = v6
      ? [[["Versão", 4], ["Classe de tráfego", 8], ["Etiqueta de fluxo", 20]], [["Comprimento do payload", 16], ["Próx. cabeçalho", 8], ["Limite de saltos", 8]], [["Endereço de origem (128 bits)", 32]], [["Endereço de destino (128 bits)", 32]]]
      : [[["Versão", 4], ["IHL", 4], ["DSCP/ECN", 8], ["Comprimento total", 16]], [["Identificação", 16], ["Flags", 3], ["Offset de fragmento", 13]], [["TTL", 8], ["Protocolo", 8], ["Checksum", 16]], [["Endereço IP de origem", 32]], [["Endereço IP de destino", 32]]];
    let s = "";
    campos.forEach((linha, i) => {
      let x = 10;
      linha.forEach(([n, bits]) => {
        const w = bits * 15;
        s += `<rect x="${x}" y="${20 + i * 34}" width="${w - 2}" height="30" rx="2" class="${/endere/i.test(n) ? "f-h3" : "f-h1"}"/>${T(x + w / 2, 40 + i * 34, n, "f-mini-claro", 'text-anchor="middle"')}`;
        x += w;
      });
    });
    s += T(10, 14, v6 ? "Cabeçalho IPv6 — 40 bytes fixos" : "Cabeçalho IPv4 — 20 bytes sem opções", "f-label");
    return `<svg viewBox="0 0 500 ${30 + campos.length * 34}" class="fig">${s}</svg>`;
  }

  function stp() {
    const no = (x, y, rot) => `<g transform="translate(${x - 24},${y - 24})"><svg width="48" height="48" viewBox="0 0 64 64">${ICONES.switch}</svg></g>${T(x, y + 36, rot, "f-label", 'text-anchor="middle"')}`;
    return `<svg viewBox="0 0 460 250" class="fig">
      <path d="M230 50 L90 190" class="f-lig"/><path d="M230 50 L370 190" class="f-lig"/><path d="M90 190 L370 190" class="f-lig"/>
      ${T(140, 110, "RP", "f-tag-txt")}${T(198, 80, "DP", "f-tag-txt")}${T(262, 80, "DP", "f-tag-txt")}${T(315, 110, "RP", "f-tag-txt")}
      ${T(120, 182, "DP", "f-tag-txt")}
      <rect x="320" y="172" width="22" height="18" rx="3" class="f-bloq"/>${T(331, 185, "✕", "f-txt-claro", 'text-anchor="middle"')}
      ${T(286, 214, "porta bloqueada (alternate)", "f-mini")}
      ${no(230, 46, "SW1 · ROOT (prio 24576)")}${no(90, 190, "SW2 (32768)")}${no(370, 190, "SW3 (32768)")}
      ${T(10, 244, "RP = root port · DP = designated port", "f-mini")}
    </svg>`;
  }

  function nat() {
    const ico = (x, y, t) => `<g transform="translate(${x},${y})"><svg width="56" height="56" viewBox="0 0 64 64">${ICONES[t]}</svg></g>`;
    return `<svg viewBox="0 0 520 170" class="fig">
      ${ico(10, 50, "pc")}${ico(232, 50, "router")}${ico(450, 50, "nuvem")}
      <path d="M70 78 H230 M290 78 H448" class="f-lig"/>
      <rect x="80" y="96" width="140" height="44" rx="4" class="f-dados"/>${T(150, 114, "orig 192.168.1.10", "f-mini-claro", 'text-anchor="middle"')}${T(150, 130, "dest 142.250.0.10", "f-mini-claro", 'text-anchor="middle"')}
      <rect x="300" y="96" width="140" height="44" rx="4" class="f-h3"/>${T(370, 114, "orig 203.0.113.2", "f-mini-claro", 'text-anchor="middle"')}${T(370, 130, "dest 142.250.0.10", "f-mini-claro", 'text-anchor="middle"')}
      ${T(150, 40, "inside (privado)", "f-label", 'text-anchor="middle"')}${T(370, 40, "outside (público)", "f-label", 'text-anchor="middle"')}
      ${T(260, 160, "R1 troca o endereço de origem e guarda a tradução", "f-mini", 'text-anchor="middle"')}
    </svg>`;
  }

  function sdn() {
    const caixa = (y, h, txt, cls) => `<rect x="60" y="${y}" width="400" height="${h}" rx="6" class="${cls}"/>${T(260, y + h / 2 + 5, txt, "f-txt-claro", 'text-anchor="middle"')}`;
    const ico = (x, t) => `<g transform="translate(${x},180)"><svg width="44" height="44" viewBox="0 0 64 64">${ICONES[t]}</svg></g>`;
    return `<svg viewBox="0 0 520 240" class="fig">
      ${caixa(10, 36, "Aplicações · scripts Python · Ansible", "f-h4")}
      <path d="M260 46 V76" class="f-seta-linha"/>${T(270, 66, "Northbound API (REST/JSON)", "f-mini")}
      ${caixa(78, 40, "Controlador (ex.: Catalyst Center)", "f-h3")}
      <path d="M260 118 V170" class="f-seta-linha"/>${T(270, 150, "Southbound (NETCONF, RESTCONF, SSH, OpenFlow)", "f-mini")}
      ${ico(110, "switch")}${ico(200, "router")}${ico(290, "switch_l3")}${ico(380, "ap")}
    </svg>`;
  }

  const FIGURAS = {
    painel_switch: painelSwitch, painel_router: painelRouter,
    cabo_utp: caboUtp, cabo_fibra: caboFibra, cabo_consola: caboConsola, rj45_pinos: rj45Pinos,
    osi, encapsulamento, handshake, trama_ethernet: trama,
    cabecalho_ipv4: () => cabecalho(false), cabecalho_ipv6: () => cabecalho(true),
    stp, nat, sdn,
  };

  function figura(nome) {
    if (FIGURAS[nome]) return FIGURAS[nome]();
    if (ICONES[nome]) return `<svg viewBox="0 0 64 64" class="fig fig-ico">${ICONES[nome]}</svg>`;
    return "";
  }

  // ---------------------------------------------------------------- topologia
  function topologia(t) {
    const W = 520, H = 280;
    const px = (n) => ({ x: 40 + (n.x / 100) * (W - 80), y: 30 + (n.y / 100) * (H - 80) });
    const pos = {};
    t.nos.forEach((n) => { pos[n.id] = px(n); });
    let lig = "", rot = "", nos = "";
    t.ligacoes.forEach((l) => {
      const a = pos[l.a], b = pos[l.b];
      lig += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="f-lig"/>`;
      if (l.rotulo) {
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, w = l.rotulo.length * 6.2 + 10;
        rot += `<rect x="${mx - w / 2}" y="${my - 10}" width="${w}" height="18" rx="4" class="f-rot-fundo"/>${T(mx, my + 3, l.rotulo, "f-mini", 'text-anchor="middle"')}`;
      }
    });
    t.nos.forEach((n) => {
      const p = pos[n.id];
      nos += `<g transform="translate(${p.x - 24},${p.y - 24})"><svg width="48" height="48" viewBox="0 0 64 64">${ICONES[n.tipo] || ICONES.pc}</svg></g>`;
      const partes = String(n.rotulo).split(" ");
      const l1 = partes.length > 2 ? partes.slice(0, Math.ceil(partes.length / 2)).join(" ") : n.rotulo;
      const l2 = partes.length > 2 ? partes.slice(Math.ceil(partes.length / 2)).join(" ") : "";
      nos += T(p.x, p.y + 36, l1, "f-label", 'text-anchor="middle"') + (l2 ? T(p.x, p.y + 50, l2, "f-mini", 'text-anchor="middle"') : "");
    });
    return `<svg viewBox="0 0 ${W} ${H}" class="fig">${lig}${rot}${nos}</svg>`;
  }

  window.Figuras = { icone, figura, topologia, ICONES };
})();
