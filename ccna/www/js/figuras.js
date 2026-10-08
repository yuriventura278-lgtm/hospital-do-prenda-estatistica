/* Ilustrações SVG: ícones de equipamentos, painéis e diagramas didáticos.
   Todas as cores vêm de variáveis CSS, por isso funcionam no tema claro e escuro. */
(function () {
  "use strict";

  // Ícones 64×64: ilustrações dos equipamentos reais vistos a 3/4 (como numa foto de catálogo).
  // Só cores sólidas e sobreposições translúcidas (sem ids/gradientes), por isso o mesmo ícone pode
  // aparecer muitas vezes no mesmo documento. A sombra (.i-sombra) e o aro (.i-aro) mudam com o tema
  // para que os equipamentos escuros não desapareçam no fundo escuro.
  const n2 = (v) => +v.toFixed(2);
  const sombra = (cx, cy, rx, ry) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry || 3}" class="i-sombra"/>`;
  // Caixa em perspetiva oblíqua: frente (x,y,w,h), profundidade d para cima/direita.
  function caixa(x, y, w, h, d, frente, topo, lado) {
    const dx = d, dy = n2(d * 0.55);
    return `<path d="M${x} ${y} l${dx} ${-dy} h${w} l${-dx} ${dy}z" fill="${topo}"/>` +
      `<path d="M${x + w} ${y} l${dx} ${-dy} v${h} l${-dx} ${dy}z" fill="${lado}"/>` +
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${frente}"/>` +
      `<path d="M${x} ${y} h${w} l${dx} ${-dy}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width=".6"/>` +
      `<path d="M${x} ${y + h} V${y} l${dx} ${-dy} h${w} v${h} l${-dx} ${dy}z" class="i-aro"/>`;
  }
  const rep = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join("");
  // ficha RJ45 vista de frente (buraco escuro com o entalhe da patilha)
  const rj = (x, y, w, h, cor) => `<rect x="${n2(x)}" y="${n2(y)}" width="${w}" height="${h}" rx=".25" fill="${cor || "#0b0d10"}"/><rect x="${n2(x + w * 0.3)}" y="${n2(y + h * 0.72)}" width="${n2(w * 0.4)}" height="${n2(h * 0.28)}" fill="#3a4049"/>`;
  const led = (cx, cy, r, cor) => `<circle cx="${n2(cx)}" cy="${n2(cy)}" r="${r}" fill="${cor || "#22c55e"}"/>`;
  // grelha de portas de um switch (2 filas, grupos de 6)
  function portasSwitch(x0, y0, cols, pw, ph, passo, porta, ledsOn) {
    let s = "";
    for (let c = 0; c < cols; c++) {
      const x = x0 + c * passo + Math.floor(c / 6) * 1.1;
      for (let l = 0; l < 2; l++) s += rj(x, y0 + l * (ph + 0.9), pw, ph, porta);
      s += `<rect x="${n2(x + 0.3)}" y="${n2(y0 - 1.3)}" width="${n2(pw - 0.6)}" height=".6" fill="${ledsOn.includes(c) ? "#22c55e" : "#5b636d"}"/>`;
    }
    return s;
  }
  // ecrã com "papel de parede" (céu e colina)
  const ecra = (x, y, w, h, rx) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx || 0}" fill="#2563c9"/>` +
    `<path d="M${x} ${n2(y + h * 0.7)} q${n2(w * 0.3)} ${n2(-h * 0.35)} ${n2(w * 0.6)} ${n2(-h * 0.05)} t${n2(w * 0.4)} ${n2(-h * 0.1)} V${y + h} H${x}z" fill="#5fa5ff" opacity=".7"/>` +
    `<path d="M${x} ${y} h${n2(w * 0.55)} l${n2(-w * 0.3)} ${h} H${x}z" fill="#fff" opacity=".1"/>`;

  // ponto num quadrilátero (u ao longo da base, v para cima), para desenhar faces inclinadas
  const quad = (A, B, C, D) => (u, v) => {
    const l = [A[0] + (D[0] - A[0]) * v, A[1] + (D[1] - A[1]) * v], r = [B[0] + (C[0] - B[0]) * v, B[1] + (C[1] - B[1]) * v];
    return [n2(l[0] + (r[0] - l[0]) * u), n2(l[1] + (r[1] - l[1]) * u)];
  };
  const poly = (pts, attrs) => `<path d="M${pts.map((p) => p.join(" ")).join(" L")}z" ${attrs}/>`;

  const ICONES = {
    // Hub Ethernet de secretária (caixa metálica azul, 5 portas, LEDs por porta)
    hub: sombra(32, 46, 24) + caixa(8, 33, 42, 11, 9, "#2f62a6", "#4f82c4", "#21497f") +
      `<rect x="10" y="35" width="7" height="1.4" fill="#d6e2f2"/>` + led(11, 40, 0.8) + led(14, 40, 0.8, "#f2a516") +
      rep(5, (i) => rj(19.5 + i * 5.8, 37.6, 4.4, 4, "#0b0d10") + led(21.7 + i * 5.8, 35.6, 0.55, i < 3 ? "#22c55e" : "#163a68")) +
      `<path d="M12 31.2 l6 -3.3 M16 31.2 l6 -3.3 M20 31.2 l6 -3.3" stroke="#21497f" stroke-width=".7"/>`,

    // Repetidor: caixa pequena com uma porta de entrada e uma de saída
    repetidor: sombra(31, 46, 19) + caixa(14, 33, 30, 11, 8, "#d9d4c7", "#ece8de", "#aaa496") +
      rj(16.5, 36.5, 5, 4.6) + rj(36.5, 36.5, 5, 4.6) +
      led(25.5, 38.8, 0.9) + led(29, 38.8, 0.9, "#f2a516") + led(32.5, 38.8, 0.9) +
      `<path d="M24 41.8 h10" stroke="#8a8476" stroke-width=".6"/>`,

    // Bridge de 2 segmentos (duas portas de cada lado, divisória ao centro)
    bridge: sombra(32, 47, 23) + caixa(9, 33, 40, 12, 9, "#4b525c", "#69717c", "#353a41") +
      rj(11.5, 37.5, 4.6, 4.4) + rj(17, 37.5, 4.6, 4.4) + rj(36.4, 37.5, 4.6, 4.4) + rj(41.9, 37.5, 4.6, 4.4) +
      led(13.8, 35.4, 0.6) + led(19.3, 35.4, 0.6) + led(38.7, 35.4, 0.6) + led(44.2, 35.4, 0.6, "#f2a516") +
      `<path d="M29 34.5 v9" stroke="#2a2e34" stroke-width=".8"/><rect x="24.5" y="35" width="3" height="1" fill="#c9ced6"/><rect x="30.5" y="35" width="3" height="1" fill="#c9ced6"/>` +
      led(29, 40.5, 0.8, "#22c55e"),

    // Router Wi-Fi doméstico (tipo Linksys WRT300N): caixa baixa preta, topo prateado, 3 antenas
    router_wifi: sombra(33, 49, 26) +
      rep(3, (i) => { const x = 24 + i * 14, a = [-8, 0, 8][i]; return `<g transform="rotate(${a} ${x} 33)"><rect x="${x - 1.6}" y="9" width="3.2" height="25" rx="1.6" fill="#1b1e22"/><rect x="${x - 0.9}" y="10.5" width="1" height="20" rx=".5" fill="#fff" opacity=".18"/><rect x="${x - 2.1}" y="30" width="4.2" height="3.5" rx="1" fill="#2c3036"/></g>`; }) +
      caixa(8, 41, 42, 7, 12, "#1f2227", "#33373e", "#15171a") +
      `<path d="M17 39.2 l9 -4.9 h20 l-9 4.9z" fill="#9aa3ae"/><path d="M17 39.2 l9 -4.9 h20" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width=".5"/>` +
      rep(6, (i) => led(13 + i * 3.4, 44.5, 0.7, i === 0 ? "#22c55e" : "#3aa0ff")) + `<rect x="38" y="43.8" width="9" height="1.4" rx=".5" fill="#9aa3ae"/>`,

    // Modem de cabo/DSL em pé (corpo branco, coluna de LEDs)
    modem: sombra(33, 54, 14, 2.6) +
      `<path d="M38 13 l6 -3.3 V48.2 l-6 3.3z" fill="#c4c9cf"/>` +
      `<path d="M25 11.3 l6 -3.3 h6 a3.4 3.4 0 0 1 3 1.4 l-6 3.3 a3.4 3.4 0 0 0 -3 -1.4z" fill="#f7f8f9"/>` +
      `<rect x="22" y="11" width="16" height="40.5" rx="4" fill="#eceef1"/>` +
      `<rect x="28.5" y="16" width="3" height="22" rx="1.5" fill="#2b2f36"/>` +
      led(30, 18.5, 0.95) + led(30, 23, 0.95) + led(30, 27.5, 0.95, "#3aa0ff") + led(30, 32, 0.95, "#3aa0ff") + led(30, 36, 0.95, "#f2a516") +
      `<rect x="26" y="44" width="8" height="1.2" fill="#b9bfc7"/>` +
      `<path d="M39.5 18 l3 -1.6 M39.5 21 l3 -1.6 M39.5 24 l3 -1.6 M39.5 27 l3 -1.6" stroke="#9aa1aa" stroke-width=".7"/>` +
      `<rect x="22" y="11" width="16" height="40.5" rx="4" class="i-aro"/>` +
      `<path d="M20 53 h20 l6 -3.3 v1.6 l-6 3.3 h-20z" fill="#3a3f46"/>`,

    // Impressora laser de rede: bandeja de saída no topo, folha, painel e gaveta de papel
    impressora: sombra(33, 53, 26) + caixa(8, 27, 40, 24, 12, "#e7e9ec", "#f6f7f8", "#c2c7ce") +
      `<path d="M13 25.2 l8 -4.4 h20 l-8 4.4z" fill="#4b5159"/>` +
      `<path d="M16 24.2 l6 -3.3 h14 l-2.5 6 h-14z" fill="#ffffff"/><path d="M18.5 25.4 h12 M20 24 h11" stroke="#9aa1aa" stroke-width=".45"/>` +
      `<rect x="11" y="31.5" width="22" height="1.4" rx=".6" fill="#3a3f46"/>` +
      `<rect x="35" y="29.5" width="10.5" height="5" rx=".8" fill="#3a4250"/><rect x="36" y="30.4" width="6" height="3.2" fill="#6fb2ff" opacity=".85"/>` + led(44.2, 32, 0.6) +
      `<rect x="10.5" y="40" width="35" height="8.5" rx="1" fill="#dadde1" stroke="#aeb4bc" stroke-width=".5"/><rect x="23" y="42.4" width="10" height="1.6" rx=".8" fill="#8a9099"/>` +
      `<rect x="10.5" y="37.6" width="35" height=".5" fill="#c4c9cf"/>`,

    // Smartphone (vista a 3/4: aro metálico de lado)
    smartphone: sombra(33, 57, 13, 2.4) +
      `<rect x="22.6" y="6" width="22" height="48" rx="4.5" fill="#6d747e"/>` +
      `<rect x="21" y="7" width="22" height="48" rx="4.5" fill="#15171b"/>` +
      `<rect x="21" y="7" width="22" height="48" rx="4.5" class="i-aro"/>` +
      ecra(22.6, 9.5, 18.8, 43, 3) +
      rep(12, (i) => `<rect x="${n2(24.6 + (i % 3) * 5.4)}" y="${n2(15 + Math.floor(i / 3) * 6)}" width="3.8" height="3.8" rx="1" fill="${["#22c55e", "#f2a516", "#ffffff", "#ef4444", "#a78bfa", "#38bdf8"][i % 6]}" opacity=".95"/>`) +
      `<rect x="24" y="46.5" width="16" height="4.6" rx="2" fill="#fff" opacity=".22"/>` +
      `<rect x="28.5" y="10.6" width="7" height="1.8" rx=".9" fill="#0b0c0e"/>`,

    // Tablet em modo paisagem
    tablet: sombra(32, 54, 25, 2.6) +
      `<rect x="7.8" y="11.8" width="50" height="38" rx="4" fill="#9aa1ab"/>` +
      `<rect x="6" y="13" width="50" height="38" rx="4" fill="#1a1c20"/>` +
      `<rect x="6" y="13" width="50" height="38" rx="4" class="i-aro"/>` +
      ecra(9.5, 16.2, 43, 31.6, 1.5) +
      rep(10, (i) => `<rect x="${n2(13 + (i % 5) * 7.6)}" y="${n2(20 + Math.floor(i / 5) * 7)}" width="4.6" height="4.6" rx="1.2" fill="${["#22c55e", "#f2a516", "#ffffff", "#ef4444", "#38bdf8"][i % 5]}" opacity=".92"/>`) +
      led(7.8, 32, 0.6, "#3a3f46"),

    // Smart TV num pedestal
    tv: sombra(32, 54, 18, 2.4) +
      `<path d="M20 52.5 h24 l3 -2.6 h-24z" fill="#3a3f46"/><path d="M20 52.5 h24 v1 h-24z" fill="#1f2226"/>` +
      `<rect x="29" y="43" width="7" height="8" fill="#2a2e33"/>` +
      `<path d="M58.5 9.4 l2.2 -1.4 v34 l-2.2 1.4z" fill="#4a5059"/>` +
      `<rect x="3.5" y="9.4" width="55" height="34" rx="1.2" fill="#101215"/>` +
      `<rect x="3.5" y="9.4" width="55" height="34" rx="1.2" class="i-aro"/>` +
      `<rect x="5" y="10.9" width="52" height="30.5" fill="#1e4f9a"/>` +
      `<path d="M5 33 q10 -9 20 -4 t18 -6 t14 3 V41.4 H5z" fill="#2f8f5b"/><path d="M5 37 q14 -6 26 -2 t26 -3 V41.4 H5z" fill="#21734a"/>` +
      `<circle cx="44" cy="18" r="3.2" fill="#ffd166"/>` +
      `<path d="M5 10.9 h26 l-14 30.5 H5z" fill="#fff" opacity=".08"/>` + led(31, 42.6, 0.4, "#ef4444"),

    // Câmara IP tipo "bullet" num suporte de parede
    camara: sombra(32, 52, 20, 2.4) +
      `<rect x="50" y="17" width="7.5" height="17" rx="1.5" fill="#d7dbe0"/><rect x="50" y="17" width="7.5" height="17" rx="1.5" class="i-aro"/>` +
      `<path d="M51 25.5 L41 31.5 L42.6 34 L52 28z" fill="#bfc5cc"/>` +
      `<g transform="translate(30 30) rotate(16)">` +
      `<rect x="-20" y="-7" width="34" height="14" rx="5.5" fill="#eef0f2"/>` +
      `<path d="M-20 1 h34 v1 a5.5 5.5 0 0 1 -5.5 5 h-23 a5.5 5.5 0 0 1 -5.5 -5z" fill="#c9ced5"/>` +
      `<rect x="-20" y="-7" width="34" height="14" rx="5.5" class="i-aro"/>` +
      `<rect x="-24" y="-9.4" width="36" height="4.2" rx="1.8" fill="#dfe3e7"/><rect x="-24" y="-9.4" width="36" height="4.2" rx="1.8" class="i-aro"/>` +
      `<ellipse cx="-19.5" cy="0.5" rx="2.6" ry="6" fill="#23272c"/><ellipse cx="-20.2" cy="0.5" rx="1.7" ry="3.8" fill="#07080a"/><ellipse cx="-20.6" cy="-0.8" rx=".5" ry="1" fill="#7fb2ff"/>` +
      `<circle cx="-18.9" cy="-3.7" r=".55" fill="#7a1f1f"/><circle cx="-18.9" cy="4.7" r=".55" fill="#7a1f1f"/>` +
      `<rect x="-14" y="-5.6" width="22" height="1.2" rx=".6" fill="#fff" opacity=".7"/></g>`,

    // Lâmpada inteligente (vidro aceso, corpo branco e casquilho E27)
    lampada: `<circle cx="32" cy="23" r="21" fill="#ffd25a" opacity=".22"/>` + sombra(32, 58, 9, 1.8) +
      `<path d="M24.5 41 C24.5 35.5 16.5 32.5 16.5 23 A15.5 15.5 0 1 1 47.5 23 C47.5 32.5 39.5 35.5 39.5 41z" fill="#fff1bf"/>` +
      `<path d="M24.5 41 C24.5 35.5 16.5 32.5 16.5 23 A15.5 15.5 0 1 1 47.5 23 C47.5 32.5 39.5 35.5 39.5 41z" class="i-aro"/>` +
      `<path d="M28 38 C28 30 24 27 24 22 a8 8 0 0 1 16 0 c0 5 -4 8 -4 16z" fill="#ffe08a" opacity=".7"/>` +
      `<ellipse cx="25" cy="17" rx="3.4" ry="5.5" transform="rotate(30 25 17)" fill="#fff" opacity=".75"/>` +
      `<path d="M24 41 h16 v3.4 a2 2 0 0 1 -2 2 h-12 a2 2 0 0 1 -2 -2z" fill="#eceef1"/><path d="M24 41 h16 v3.4 a2 2 0 0 1 -2 2 h-12 a2 2 0 0 1 -2 -2z" class="i-aro"/>` +
      `<rect x="25.5" y="46.4" width="13" height="7" rx="1" fill="#b9bfc6"/>` +
      `<path d="M25.5 48.2 l13 -1 M25.5 50.4 l13 -1 M25.5 52.6 l13 -1" stroke="#7c838c" stroke-width=".8"/>` +
      `<path d="M28 53.4 h8 l-1.5 3 h-5z" fill="#454a52"/>`,

    // Termóstato inteligente redondo (aro de aço, ecrã preto com escala)
    termostato: `<circle cx="33.4" cy="33.6" r="22" class="i-sombra"/>` +
      `<circle cx="32" cy="31.5" r="22" fill="#c3c9d0"/>` +
      `<path d="M13 23 A21 21 0 0 1 49 14" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2.5" stroke-linecap="round"/>` +
      `<circle cx="32" cy="31.5" r="22" class="i-aro"/>` +
      `<circle cx="32" cy="31.5" r="17.5" fill="#0f1215"/>` +
      rep(31, (i) => { const a = (-225 + i * 9) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), on = i >= 6 && i <= 19;
        return `<path d="M${n2(32 + c * 13)} ${n2(31.5 + s * 13)} L${n2(32 + c * 15.6)} ${n2(31.5 + s * 15.6)}" stroke="${on ? "#ff8a1f" : "#4b525c"}" stroke-width="${i === 19 ? 1.6 : 0.9}"/>`; }) +
      `<text x="32" y="36" text-anchor="middle" fill="#ffffff" style="font: 800 13px system-ui, sans-serif">21</text>` +
      `<text x="32" y="43.5" text-anchor="middle" fill="#ff8a1f" style="font: 700 4.5px system-ui, sans-serif">AQUECER</text>`,

    // Analisador de rede portátil (tipo Fluke): corpo amarelo, ecrã com forma de onda, cabo RJ45
    sniffer: sombra(32, 57, 17, 2.4) +
      `<path d="M28.5 8 C28.5 2.5 40 2 46 6 S56 14 57 22" fill="none" stroke="#2f6fd1" stroke-width="2.2" stroke-linecap="round"/>` +
      `<rect x="26.5" y="5.5" width="5" height="5" rx=".8" fill="#dfe6ee" stroke="#9aa6b3" stroke-width=".5"/>` +
      `<rect x="19.5" y="8" width="30" height="47" rx="5" fill="#b8860b"/>` +
      `<rect x="16.5" y="10" width="30" height="47" rx="5" fill="#f2b705"/>` +
      `<rect x="16.5" y="10" width="30" height="47" rx="5" class="i-aro"/>` +
      `<rect x="19.5" y="13.5" width="24" height="40" rx="3" fill="#3a3f46"/>` +
      `<rect x="21.5" y="16" width="20" height="16" rx="1" fill="#0e1813"/>` +
      `<path d="M22 27 l2 0 l1.5 -6 l2 9 l2 -7 l1.5 4 l2 -2 l1.5 3 l2 -6 l2 5 h2" fill="none" stroke="#3ee07f" stroke-width=".8"/>` +
      rep(5, (i) => `<rect x="${23 + i * 3.6}" y="${30.6 - [3, 1.6, 2.4, 1, 2][i]}" width="2" height="${[3, 1.6, 2.4, 1, 2][i]}" fill="#38bdf8"/>`) +
      rep(6, (i) => `<rect x="${n2(22.2 + (i % 3) * 6.4)}" y="${n2(36 + Math.floor(i / 3) * 4.6)}" width="5" height="3" rx=".8" fill="#8f98a3"/>`) +
      `<circle cx="31.5" cy="48.5" r="2.4" fill="#22c55e"/><circle cx="31.5" cy="48.5" r="1" fill="#e9fbe9"/>`,

    // Router Cisco ISR 4331: chassi preto, grelha de ventilação, NIM, portas GE, consola azul
    router: sombra(34, 47, 28, 3) + caixa(4, 27, 47, 17, 10, "#2b2f36", "#4a515b", "#1c1f24") +
      `<path d="M16 25.6 l6 -3.3 M20 25.6 l6 -3.3 M24 25.6 l6 -3.3 M28 25.6 l6 -3.3 M32 25.6 l6 -3.3" stroke="#2e333a" stroke-width=".7"/>` +
      `<rect x="5.6" y="28.6" width="9" height="13.8" rx=".6" fill="#1b1e23"/>` +
      rep(20, (i) => led(7 + (i % 4) * 2.1 + (Math.floor(i / 4) % 2) * 1.05, 30 + Math.floor(i / 4) * 2.6, 0.6, "#0a0b0d")) +
      `<rect x="16.5" y="29" width="6" height="1.1" fill="#b9c0c8"/>` +
      `<rect x="16.5" y="31.6" width="14" height="4.6" rx=".4" fill="#23272d" stroke="#454c55" stroke-width=".4"/>` +
      `<rect x="16.5" y="37.4" width="14" height="4.6" rx=".4" fill="#23272d" stroke="#454c55" stroke-width=".4"/>` +
      led(17.6, 33.9, 0.45, "#9aa3ad") + led(29.4, 33.9, 0.45, "#9aa3ad") + led(17.6, 39.7, 0.45, "#9aa3ad") + led(29.4, 39.7, 0.45, "#9aa3ad") +
      rep(3, (i) => rj(32.4 + i * 3.8, 32.8, 3.1, 2.9) + led(33.2 + i * 3.8, 31.6, 0.4, i < 2 ? "#22c55e" : "#4b525c")) +
      `<rect x="32.4" y="37.6" width="3.1" height="2.8" rx=".3" fill="#5cc3e8"/>` + rj(36.2, 37.6, 3.1, 2.8) +
      `<rect x="40.2" y="38.4" width="2.6" height="1.2" rx=".3" fill="#9aa1aa"/>` +
      `<rect x="44" y="32.6" width="5" height="3" rx=".3" fill="#6f7782"/><rect x="44.6" y="33.3" width="3.8" height="1.6" fill="#0b0d10"/>` +
      led(45, 39, 0.75) + led(47.6, 39, 0.75) + led(45, 41.4, 0.55, "#f2a516"),

    // Catalyst 2960: chassi 1U cinzento-claro, 24 portas RJ45 em 2 filas + 2 uplinks
    switch: sombra(34, 46, 29, 3) + caixa(3, 30, 50, 13, 10, "#c9d1d9", "#e4e9ee", "#9aa6b2") +
      `<rect x="4" y="31" width="8" height="11" rx=".5" fill="#3e5a73"/>` +
      `<rect x="5" y="32.2" width="5" height=".9" fill="#d6e2ee"/>` +
      led(5.8, 35.2, 0.6) + led(5.8, 37.4, 0.6) + led(5.8, 39.6, 0.6, "#f2a516") + `<rect x="8" y="38.6" width="2.6" height="2" rx=".4" fill="#20262d"/>` +
      `<rect x="13" y="33.4" width="33.5" height="7.6" rx=".4" fill="#8794a1"/>` +
      portasSwitch(13.5, 34.6, 12, 2.2, 2.4, 2.6, "#14181d", [0, 1, 2, 4, 5, 8, 9]) +
      `<rect x="47.4" y="33.4" width="5" height="7.6" rx=".4" fill="#8794a1"/>` + rj(47.9, 34.6, 1.9, 2.4) + rj(50, 34.6, 1.9, 2.4) +
      `<rect x="47.9" y="37.9" width="1.9" height="2.3" fill="#2a2f36"/><rect x="50" y="37.9" width="1.9" height="2.3" fill="#2a2f36"/>`,

    // Catalyst 3650 (multicamada): chassi escuro, portas PoE+, módulo de uplinks SFP, distintivo L3
    switch_l3: sombra(34, 47, 29, 3) + caixa(3, 29, 50, 15, 10, "#353b44", "#59616c", "#23272d") +
      `<rect x="4.6" y="30.6" width="7" height="4.2" rx=".6" fill="#1a56d6"/>` +
      `<text x="8.1" y="33.9" text-anchor="middle" fill="#fff" style="font: 800 3.6px system-ui, sans-serif">L3</text>` +
      led(5.6, 37.2, 0.6) + led(8, 37.2, 0.6) + led(10.4, 37.2, 0.6, "#f2a516") + `<rect x="5" y="39.4" width="5.8" height="1" fill="#aab2bc"/>` +
      `<rect x="13" y="32.6" width="33.5" height="8.4" rx=".4" fill="#262a30"/>` +
      portasSwitch(13.5, 34.4, 12, 2.2, 2.6, 2.6, "#08090b", [0, 1, 3, 4, 6, 7, 10]) +
      `<rect x="13.5" y="41.8" width="6" height=".8" fill="#f2a516"/>` +
      `<rect x="47.2" y="31" width="5.4" height="11.6" rx=".5" fill="#1d2025"/>` +
      rep(4, (i) => `<rect x="${n2(47.7 + (i % 2) * 2.5)}" y="${n2(32.4 + Math.floor(i / 2) * 4.6)}" width="2.1" height="3.4" fill="#a7b0ba"/><rect x="${n2(48.1 + (i % 2) * 2.5)}" y="${n2(32.9 + Math.floor(i / 2) * 4.6)}" width="1.3" height="2.4" fill="#0b0d10"/>`),

    // Firewall Cisco ASA 5506-X: caixa de secretária escura, faixa laranja, grelha no topo
    firewall: sombra(33, 49, 25, 3) + caixa(9, 33, 38, 14, 13, "#25282d", "#3b4048", "#191b1f") +
      rep(6, (i) => `<path d="M${n2(15 + i * 5.2)} ${31.6} l${7.4} -4.1" stroke="#262a30" stroke-width="1.2" stroke-linecap="round"/>`) +
      `<rect x="9" y="33" width="38" height="2.4" fill="#e2552d"/><rect x="9" y="35.4" width="38" height=".5" fill="#a83a1c"/>` +
      `<rect x="12" y="38" width="7" height="1.1" fill="#b9c0c8"/>` +
      led(13, 42.4, 0.75) + led(16, 42.4, 0.75) + led(19, 42.4, 0.75, "#f2a516") + led(22, 42.4, 0.75, "#3a4049") +
      `<path d="M38.5 37.6 l3.5 1.2 v3 c0 2.2 -1.6 3.4 -3.5 4.2 c-1.9 -0.8 -3.5 -2 -3.5 -4.2 v-3z" fill="#e2552d"/><path d="M38.5 39.6 v4.8" stroke="#fff" stroke-width=".7"/>`,

    // Ponto de acesso Cisco Aironet de teto (disco branco com LED de estado)
    ap: sombra(32, 46, 25, 3) +
      `<path d="M7 31 v4.5 a25 10.5 0 0 0 50 0 V31z" fill="#c6ccd3"/>` +
      `<ellipse cx="32" cy="31" rx="25" ry="10.5" fill="#f3f5f7"/>` +
      `<path d="M7 31 v4.5 a25 10.5 0 0 0 50 0 V31 a25 10.5 0 0 0 -50 0z" class="i-aro"/>` +
      `<ellipse cx="32" cy="31" rx="17" ry="7" fill="none" stroke="#d8dde3" stroke-width=".9"/>` +
      `<ellipse cx="32" cy="31.4" rx="4.4" ry="1.9" fill="#d3f5df"/><ellipse cx="32" cy="31.4" rx="2.6" ry="1.1" fill="#22c55e"/>` +
      `<rect x="28.5" y="36" width="7" height="1" rx=".5" fill="#b9c0c8"/>` +
      `<path d="M13 27 a25 10 0 0 1 22 -6" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`,

    // Controlador Wireless (WLC 2504) em 1U com orelhas de bastidor
    wlc: sombra(33, 47, 28, 3) + caixa(5, 30, 46, 13, 10, "#2d3239", "#4b525c", "#1d2025") +
      `<rect x="1.8" y="30" width="3.4" height="13" rx=".6" fill="#9aa3ad"/><circle cx="3.5" cy="33" r=".7" fill="#3a3f46"/><circle cx="3.5" cy="40" r=".7" fill="#3a3f46"/>` +
      `<rect x="7" y="32" width="12" height="9" rx=".8" fill="#c9ced6"/>` +
      `<g fill="none" stroke="#1a56d6" stroke-width=".9" stroke-linecap="round"><path d="M10.6 36.6 a4 4 0 0 1 4.8 0"/><path d="M9.2 35.2 a6 6 0 0 1 7.6 0"/></g>` + led(13, 38.3, 0.65, "#1a56d6") +
      rep(4, (i) => rj(21.5 + i * 4, 34.2, 3.2, 3) + led(22.3 + i * 4, 32.8, 0.4, i < 3 ? "#22c55e" : "#4b525c")) +
      `<rect x="38.4" y="34.2" width="3.2" height="3" rx=".3" fill="#5cc3e8"/>` +
      led(45, 34.4, 0.75) + led(47.6, 34.4, 0.75) + led(45, 37.4, 0.75, "#f2a516") + `<rect x="21.5" y="39.4" width="15" height=".8" fill="#5b636d"/>`,

    // PC de secretária: monitor, torre e teclado
    pc: sombra(33, 55, 28, 3) +
      caixa(43, 19, 12, 32, 6, "#2f343b", "#4a5059", "#1f2328") +
      `<rect x="45" y="22" width="8" height="1.8" rx=".3" fill="#15181c"/><rect x="45" y="25" width="8" height="1" rx=".3" fill="#15181c"/>` +
      `<circle cx="49" cy="31" r="1.6" fill="#9aa3ad"/><circle cx="49" cy="31" r="1.6" fill="none" stroke="#3aa0ff" stroke-width=".5"/>` +
      `<path d="M45 42 h8 M45 44 h8 M45 46 h8 M45 48 h8" stroke="#24282d" stroke-width=".8"/>` +
      `<path d="M18 41 h9 l1.5 3.4 h-12z" fill="#454b54"/><rect x="20.6" y="35" width="3.8" height="6.5" fill="#5b626c"/>` +
      `<path d="M39.5 9.6 l1.6 -1 v26.4 l-1.6 1z" fill="#4a5059"/>` +
      `<rect x="4" y="9.6" width="35.5" height="26" rx="1.2" fill="#15171b"/><rect x="4" y="9.6" width="35.5" height="26" rx="1.2" class="i-aro"/>` +
      ecra(5.6, 11.2, 32.3, 21.4) + `<rect x="20.4" y="33.4" width="2.6" height=".7" rx=".3" fill="#5b626c"/>` +
      `<path d="M5 53.4 h29 l4 -4.4 h-29z" fill="#d7dbe0"/><path d="M5 53.4 h29 v1.2 h-29z" fill="#9aa2ac"/><path d="M34 53.4 l4 -4.4 v1.2 l-4 4.4z" fill="#b5bcc4"/>` +
      `<path d="M5 53.4 h29 l4 -4.4 h-29z" class="i-aro"/>` +
      `<path d="M8.6 52.2 h25.6 M9.7 51 h25.6 M10.8 49.8 h25.6" stroke="#9aa2ac" stroke-width=".55" stroke-dasharray="1.4 .5"/>`,

    // Portátil aberto
    portatil: sombra(33, 53, 28, 3) +
      `<path d="M18 40 L58 40 L60.5 9 L21 9z" fill="#2a2e34"/>` +
      `<path d="M19.8 38.4 L56.4 38.4 L58.6 10.6 L22.7 10.6z" fill="#2563c9"/>` +
      `<path d="M19.8 38.4 L45 38.4 Q46 28 58 22 L58.6 10.6 L22.7 10.6z" fill="#5fa5ff" opacity=".35"/>` +
      `<path d="M22.7 10.6 h18 L30 38.4 h-10.2z" fill="#fff" opacity=".1"/>` +
      `<path d="M18 40 L58 40 L60.5 9 L21 9z" class="i-aro"/>` +
      `<path d="M6 48 h40 l12 -8 h-40z" fill="#c9ced5"/><path d="M6 48 h40 v2.4 h-40z" fill="#99a1ab"/><path d="M46 48 l12 -8 v2.4 l-12 8z" fill="#b0b7c0"/>` +
      `<path d="M15.4 45 h30.4 l6.2 -4.2 h-30.4z" fill="#2b2f35"/>` +
      `<path d="M17.5 44 h27 M19 43 h27 M20.5 42 h27" stroke="#59606a" stroke-width=".5" stroke-dasharray="1.6 .5"/>` +
      `<path d="M22.2 47.4 h9.6 l2.6 -1.8 h-9.6z" fill="#b3bac3"/>` +
      `<path d="M6 50.4 V48 l12 -8 h40 v2.4 l-12 8z" class="i-aro"/>`,

    // Servidor em torre com baías de discos hot-swap
    servidor: sombra(35, 55, 20, 3) + caixa(17, 17, 22, 37, 11, "#2b2f36", "#4a515b", "#1c1f24") +
      `<path d="M41 16 l6 -3.3 M41 22 l6 -3.3 M41 28 l6 -3.3 M41 34 l6 -3.3 M41 40 l6 -3.3 M41 46 l6 -3.3" stroke="#2a2e34" stroke-width="1"/>` +
      rep(8, (i) => { const x = 19 + (i % 2) * 9.4, y = 19.5 + Math.floor(i / 2) * 5.2;
        return `<rect x="${x}" y="${n2(y)}" width="8.6" height="4.4" rx=".4" fill="#454c56"/><rect x="${x + 0.6}" y="${n2(y + 0.7)}" width="5.6" height="1" fill="#b4bcc5"/>${led(x + 7.4, y + 3.2, 0.45, i === 5 ? "#f2a516" : "#22c55e")}`; }) +
      `<rect x="19" y="41.2" width="18" height="9.8" rx=".6" fill="#22262c"/>` +
      `<path d="M20.5 43 h15 M20.5 45 h15 M20.5 47 h15 M20.5 49 h15" stroke="#3a4049" stroke-width=".8"/>` +
      `<circle cx="34.8" cy="39.5" r=".9" fill="#3aa0ff"/>` + led(31.8, 39.5, 0.55),

    // Internet / operador: nuvem com globo
    nuvem: `<path d="M14 47 A9 9 0 0 1 12.6 29 A13.5 13.5 0 0 1 37.5 21.5 A10 10 0 0 1 52.5 31 A8 8 0 0 1 52 47z" fill="#e6edf5"/>` +
      `<path d="M10 41 A9 9 0 0 0 14 47 H52 A8 8 0 0 0 59.6 41z" fill="#c7d3e0"/>` +
      `<path d="M14 47 A9 9 0 0 1 12.6 29 A13.5 13.5 0 0 1 37.5 21.5 A10 10 0 0 1 52.5 31 A8 8 0 0 1 52 47z" fill="none" stroke="#8ea3b8" stroke-width="1.2"/>` +
      `<path d="M15 30 A12 12 0 0 1 31 19.5" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".9"/>` +
      `<circle cx="41" cy="42" r="11" fill="#2f7fd8"/>` +
      `<path d="M33.5 37 c3 1 4 4 2.5 6 s1 4 3.5 4.5 c1 2 -1 4 -2 4.5 M44 32 c-1 2 1 3 3 3 s3 2 2 4 c2 1 3 3 2.8 5" fill="none" stroke="#5fd18c" stroke-width="2.2" stroke-linecap="round" opacity=".85"/>` +
      `<g fill="none" stroke="#fff" stroke-width=".8" opacity=".9"><ellipse cx="41" cy="42" rx="4.6" ry="11"/><path d="M30 42 h22 M31.6 36.5 h18.8 M31.6 47.5 h18.8 M41 31 v22"/></g>` +
      `<circle cx="41" cy="42" r="11" fill="none" stroke="#fff" stroke-width="1.4"/>`,

    // Telefone IP Cisco 7960: corpo inclinado, auscultador à esquerda, ecrã LCD e teclado
    telefone_ip: (() => {
      const A = [9, 50], B = [52, 50], C = [56, 21], D = [16, 21], f = quad(A, B, C, D);
      let s = sombra(33, 52, 26, 2.6) +
        poly([B, [56, 47.6], [59.4, 19.2], C], 'fill="#23272c"') +
        poly([A, B, [56, 47.6], [56, 49.6], [52, 52], [9, 52]], 'fill="#1d2025"') +
        poly([A, B, C, D], 'fill="#3d434b"') + poly([A, B, C, D], 'class="i-aro"') +
        poly([f(0.3, 0.55), f(0.86, 0.55), f(0.86, 0.94), f(0.3, 0.94)], 'fill="#22262b"') +
        poly([f(0.33, 0.6), f(0.83, 0.6), f(0.83, 0.9), f(0.33, 0.9)], 'fill="#b9cba8"') +
        rep(3, (i) => poly([f(0.37, 0.84 - i * 0.07), f(0.7 - i * 0.1, 0.84 - i * 0.07), f(0.7 - i * 0.1, 0.81 - i * 0.07), f(0.37, 0.81 - i * 0.07)], 'fill="#55654a"')) +
        rep(4, (i) => poly([f(0.9, 0.62 + i * 0.08), f(0.96, 0.62 + i * 0.08), f(0.96, 0.67 + i * 0.08), f(0.9, 0.67 + i * 0.08)], 'fill="#c3cad2"'));
      for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
        const u = 0.36 + c * 0.1, v = 0.08 + (3 - r) * 0.1;
        s += poly([f(u, v), f(u + 0.075, v), f(u + 0.075, v + 0.07), f(u, v + 0.07)], 'fill="#c3cad2"');
      }
      s += poly([f(0.7, 0.1), f(0.85, 0.1), f(0.85, 0.17), f(0.7, 0.17)], 'fill="#e2552d"') +
        poly([f(0.7, 0.24), f(0.85, 0.24), f(0.85, 0.4), f(0.7, 0.4)], 'fill="#8f98a3"') +
        `<g transform="translate(15.6 34.6) rotate(-77)"><rect x="-15" y="-4.6" width="30" height="9.2" rx="4" fill="#2a2e34"/><rect x="-15" y="-4.6" width="30" height="9.2" rx="4" class="i-aro"/>` +
        `<rect x="-11" y="-3.6" width="22" height="2" rx="1" fill="#fff" opacity=".18"/><ellipse cx="-12" cy="0" rx="2.6" ry="4" fill="#1f2226"/><ellipse cx="12" cy="0" rx="2.6" ry="4" fill="#1f2226"/></g>`;
      return s;
    })(),
  };
  // Os equipamentos de bastidor (1U) são finos: em tamanho pequeno ficavam difíceis de ver.
  // Ampliam-se um pouco (mais na altura), mantendo o desenho dentro da caixa de 64×64.
  [["router", 1, 1.5, 36], ["switch", 1, 1.55, 37], ["switch_l3", 1, 1.5, 37], ["wlc", 1, 1.55, 37]].forEach(([k, sx, sy, cy]) => {
    ICONES[k] = `<g transform="translate(32 ${cy}) scale(${sx} ${sy}) translate(-32 -${cy})">${ICONES[k]}</g>`;
  });

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

  function computadorPartes() {
    const caixa = (x, y, w, h, txt, sub, cls) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" class="${cls}"/>${T(x + w / 2, y + h / 2 - 2, txt, "f-txt-claro", 'text-anchor="middle"')}${T(x + w / 2, y + h / 2 + 13, sub, "f-mini-claro", 'text-anchor="middle"')}`;
    const seta = (x1, y1, x2, y2) => `<path d="M${x1} ${y1} L${x2} ${y2}" class="f-seta-linha" marker-end="url(#ponta3)"/>`;
    return `<svg viewBox="0 0 520 250" class="fig"><defs><marker id="ponta3" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8z" class="f-seta"/></marker></defs>
      ${caixa(10, 95, 100, 56, "Entrada", "teclado, rato, rede", "f-h2")}
      ${caixa(190, 20, 140, 56, "Processador", "CPU: faz as contas", "f-h3")}
      ${caixa(190, 100, 140, 50, "Memória RAM", "trabalho do momento", "f-h4")}
      ${caixa(190, 172, 140, 50, "Armazenamento", "SSD / disco", "f-dados")}
      ${caixa(410, 95, 100, 56, "Saída", "ecrã, som, rede", "f-h2")}
      ${caixa(10, 190, 100, 50, "Placa de rede", "cabo ou Wi-Fi", "f-tag")}
      ${seta(110, 123, 188, 60)}${seta(332, 60, 408, 118)}${seta(260, 78, 260, 98)}${seta(260, 152, 260, 170)}${seta(110, 210, 188, 200)}
      ${T(260, 245, "entrada → processamento → saída", "f-mini", 'text-anchor="middle"')}
    </svg>`;
  }

  function linhaTempo() {
    const ev = [[1945, "ENIAC"], [1969, "ARPANET"], [1973, "Ethernet"], [1983, "TCP/IP"], [1984, "Cisco"], [1991, "Web"], [1997, "Wi-Fi"], [2007, "Smartphones"], [2011, "Fim IPv4"], [2020, "CCNA 200-301"]];
    const x = (a) => 20 + ((a - 1940) / 85) * 480;
    let s = `<path d="M15 70 H505" class="f-seta-linha"/>`;
    ev.forEach(([a, n], i) => {
      const cima = i % 2 === 0;
      s += `<circle cx="${x(a)}" cy="70" r="6" class="${i === ev.length - 1 ? "f-led-amb" : "f-h3"}"/>`;
      s += `<path d="M${x(a)} ${cima ? 64 : 76} V${cima ? 44 : 96}" class="f-linha-vida"/>`;
      s += T(x(a), cima ? 22 : 118, String(a), "f-label", 'text-anchor="middle"') + T(x(a), cima ? 36 : 132, n, "f-mini", 'text-anchor="middle"');
    });
    return `<svg viewBox="0 0 520 140" class="fig">${s}</svg>`;
  }

  function conectores() {
    const item = (x, nome, sub, desenho) => `<g transform="translate(${x},0)">${desenho}${T(50, 128, nome, "f-label", 'text-anchor="middle"')}${T(50, 143, sub, "f-mini", 'text-anchor="middle"')}</g>`;
    const rj = (larg, pinos, cls) => `<rect x="${50 - larg / 2}" y="30" width="${larg}" height="46" rx="4" class="${cls || "f-rj45"}"/>${Array.from({ length: pinos }, (_, k) => `<rect x="${50 - larg / 2 + 5 + k * ((larg - 10) / pinos)}" y="36" width="${(larg - 10) / pinos - 2}" height="14" class="f-pino"/>`).join("")}<path d="M${50 - larg / 4} 76 h${larg / 2} l-4 12 h-${larg / 2 - 8}z" class="${cls || "f-rj45"}"/><rect x="${50 - 8}" y="88" width="16" height="22" rx="3" class="f-capa"/>`;
    const lc = `<rect x="22" y="30" width="24" height="50" rx="3" class="f-lc"/><rect x="54" y="30" width="24" height="50" rx="3" class="f-lc"/><rect x="28" y="20" width="12" height="12" class="f-ferrule"/><rect x="60" y="20" width="12" height="12" class="f-ferrule"/><rect x="38" y="80" width="24" height="30" rx="4" class="f-fibra-capa"/>`;
    const sc = `<rect x="30" y="30" width="40" height="50" rx="2" class="f-sc"/><rect x="44" y="18" width="12" height="14" class="f-ferrule"/><rect x="42" y="80" width="16" height="30" rx="3" class="f-fibra-capa"/>`;
    const st = `<circle cx="50" cy="52" r="20" class="f-st"/><rect x="45" y="18" width="10" height="16" class="f-ferrule"/><rect x="42" y="72" width="16" height="38" rx="3" class="f-fibra-capa"/>`;
    const bnc = `<rect x="34" y="28" width="32" height="44" rx="8" class="f-metal"/><circle cx="50" cy="40" r="6" class="f-pino"/><rect x="44" y="72" width="12" height="38" rx="3" class="f-capa-preta"/>`;
    const db9 = `<path d="M22 34 h56 l-7 34 h-42z" class="f-db9"/>${[0, 1, 2, 3, 4].map((i) => `<circle cx="${30 + i * 10}" cy="44" r="2.5" class="f-pino"/>`).join("")}${[0, 1, 2, 3].map((i) => `<circle cx="${35 + i * 10}" cy="56" r="2.5" class="f-pino"/>`).join("")}<rect x="42" y="68" width="16" height="42" rx="3" class="f-consola"/>`;
    return `<svg viewBox="0 0 700 150" class="fig">${item(0, "RJ45", "UTP, 8 fios", rj(44, 8))}${item(100, "RJ11", "telefone, 4 fios", rj(30, 4))}${item(200, "LC", "fibra, SFP", lc)}${item(300, "SC", "fibra, FTTH", sc)}${item(400, "ST", "fibra, baioneta", st)}${item(500, "F / BNC", "coaxial", bnc)}${item(600, "DB9", "consola série", db9)}</svg>`;
  }
  function ferramentas() {
    const item = (x, nome, sub, d) => `<g transform="translate(${x},0)">${d}${T(70, 132, nome, "f-label", 'text-anchor="middle"')}${T(70, 147, sub, "f-mini", 'text-anchor="middle"')}</g>`;
    const alicate = `<path d="M30 30 L70 60 L110 30 L118 40 L80 70 L80 112 L66 112 L66 72 L22 40z" class="f-cabo-ferr"/><rect x="58" y="52" width="24" height="16" rx="2" class="f-metal"/><circle cx="70" cy="60" r="4" class="f-pino"/>`;
    const descarnador = `<rect x="40" y="24" width="60" height="70" rx="14" class="f-cabo-ferr"/><circle cx="70" cy="56" r="12" class="f-porta-in"/><rect x="62" y="50" width="16" height="4" class="f-metal"/>`;
    const testador = `<rect x="22" y="22" width="56" height="84" rx="6" class="f-testador"/>${[0, 1, 2, 3, 4, 5, 6, 7].map((k) => `<circle cx="${32 + (k % 4) * 12}" cy="${42 + Math.floor(k / 4) * 14}" r="4" class="f-led-on"/>`).join("")}<rect x="40" y="80" width="20" height="14" rx="2" class="f-porta"/><rect x="88" y="44" width="34" height="50" rx="5" class="f-testador"/><rect x="96" y="70" width="18" height="12" rx="2" class="f-porta"/>`;
    const impacto = `<rect x="58" y="22" width="24" height="64" rx="8" class="f-cabo-ferr"/><rect x="64" y="86" width="12" height="26" class="f-metal"/><path d="M60 112 h20 l-4 6 h-12z" class="f-metal"/>`;
    return `<svg viewBox="0 0 560 155" class="fig">${item(0, "Alicate de crimpar", "prende o RJ45", alicate)}${item(140, "Descarnador", "tira a capa", descarnador)}${item(280, "Testador de cabos", "luzes 1 a 8", testador)}${item(420, "Ferramenta de impacto", "keystone e patch panel", impacto)}</svg>`;
  }

  const FIGURAS = {
    conectores, ferramentas_cabo: ferramentas,
    computador_partes: computadorPartes, linha_tempo: linhaTempo,
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
