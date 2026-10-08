/* Interface do Simulador de rede: área de trabalho, ferramentas, painéis dos
   equipamentos, passos guiados e ajuda. Usa o motor de simulador.js. */
(function () {
  "use strict";
  const S = window.Simulador, F = window.Figuras;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let W = 1000, H = 620; // no telemóvel a área é mais estreita para os ícones ficarem maiores
  const curto = (p) => p.replace("GigabitEthernet", "Gi").replace("FastEthernet", "Fa").replace("Serial", "Se");
  const ler = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const gravar = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* sem armazenamento */ } };
  const reduzido = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const AJUDA = [
    ["O ambiente", "Está organizado como o Cisco Packet Tracer: em cima as barras de ferramentas (passe o rato ou o dedo para ver o nome de cada botão), a barra <b>Lógico | Físico</b>, a área de trabalho, a barra do <b>Tempo</b> (Tempo real | Simulação) e, em baixo, a caixa dos equipamentos."],
    ["Adicionar equipamentos", "Na caixa de baixo, à esquerda, escolha o tipo (<b>Equipamentos de rede</b>, <b>Dispositivos finais</b>, <b>Componentes</b>, <b>Ligações</b>, <b>Diversos</b>) e a subcategoria (Routers, Switches, Hubs, Sem fios, Segurança, WAN…). À direita aparecem os modelos: toque num (ISR 4331, Catalyst 2960, PC…) e depois toque no sítio da área de trabalho onde o quer pôr. <b>Adicionar num lugar livre</b> põe-no sozinho."],
    ["Ligar cabos", "Em <b>Ligações</b> escolha o cabo: <b>Automático</b> escolhe o cabo certo; <b>Direto</b> liga equipamentos diferentes (PC–switch, switch–router); <b>Cruzado</b> liga iguais (switch–switch, router–router, PC–router); <b>Consola</b> liga a porta RS232 do PC à porta Console. Toque no primeiro equipamento e escolha a porta (as ocupadas aparecem desativadas, ou use <b>Escolher automaticamente</b>); depois toque no segundo e escolha a porta."],
    ["Ler as luzes", "Nas pontas de cada cabo há um triângulo, como no Packet Tracer: <span class='luz ok'></span> verde: ligação a funcionar. <span class='luz errado'></span> vermelho: porta desligada (<code>shutdown</code>), equipamento desligado ou cabo errado. <span class='luz baixo'></span> laranja: porta bloqueada pelo Spanning Tree ou a negociar. Toque numa luz para ver o motivo."],
    ["Selecionar, inspecionar e apagar", "<b>Selecionar</b>: arraste para mover; um toque abre a janela do equipamento. <b>Inspecionar</b> (lupa): mostra um resumo só de leitura (interfaces, rotas, running-config). <b>Apagar</b>: toque no equipamento, cabo, área ou nota."],
    ["Configurar routers e switches", "A janela tem os separadores do Packet Tracer — <b>Físico</b> (portas e botão de energia), <b>Configuração</b> (hostname, NVRAM, rotas estáticas, RIP, VLANs e cada interface; cada alteração mostra os <b>comandos IOS equivalentes</b>) e <b>CLI</b> (os comandos Cisco: <code>enable</code>, <code>configure terminal</code>…, com <code>?</code> e Tab). Mudar o hostname muda o nome no desenho (nas atividades guiadas o nome mantém-se e o hostname aparece por baixo)."],
    ["Configurar PCs e servidores", "PC › <b>Ambiente de trabalho</b> › <b>Configuração IP</b>: DHCP ou Estático (a máscara aparece sozinha pela classe do IP). No servidor, o separador <b>Serviços</b> tem HTTP, DHCP, DNS, TFTP, NTP, AAA, EMAIL, FTP…, cada um com uma linha a explicar o protocolo."],
    ["Testar", "<b>Enviar PDU simples</b> (envelope): toque na origem e no destino e é feito um ping. Ou PC › Ambiente de trabalho › <b>Prompt de comando</b>: <code>ping</code>, <code>tracert</code>, <code>ipconfig /all</code>, <code>nslookup</code>; ou <b>Navegador web</b> com o IP ou o nome DNS do servidor."],
    ["Tempo real e Simulação", "Na barra do Tempo, <b>Simulação</b> abre a <b>Lista de eventos</b>: cada mensagem (ARP, ICMP, DHCP, DNS, TCP) aparece cabo a cabo, com o que vai em cada camada. <b>Enviar PDU complexa</b> escolhe o tipo (ping, DHCP, DNS, HTTP, Telnet, SSH, SMB). <b>⏻</b> desliga e volta a ligar todos os equipamentos; <b>⏩</b> avança o tempo (renova o DHCP e termina a negociação das portas)."],
    ["Desfazer, zoom e deslocar", "Desfazer e Refazer (até 50 passos; no computador Ctrl+Z e Ctrl+Y). Aproxime ou afaste com os botões, com dois dedos ou com a roda do rato; arraste no vazio para deslocar o desenho. <b>Ajustar</b> mostra tudo."],
    ["Abrir, guardar e novo", "<b>Guardar</b> descarrega a rede num ficheiro .json; <b>Abrir</b> carrega um ficheiro desses (ou um projeto exportado). <b>Novo</b> começa uma rede vazia (pode desfazer). <b>Imagem</b> guarda um PNG e <b>Informação</b> mostra o relatório de todos os equipamentos."],
    ["Duplicar e colar configuração", "Com um equipamento aberto, toque em <b>Duplicar</b> (ou Ctrl+C e Ctrl+V). No separador <b>CLI</b>, <b>Colar configuração</b> executa vários comandos de uma vez, um por linha."],
    ["Áreas, notas e vista física", "<b>Desenhar retângulo</b> cria uma área (Edifício A, Sala de servidores…); <b>Nota</b> põe um texto; <b>Redimensionar</b> muda o tamanho arrastando; a <b>Paleta de desenho</b> escolhe as cores. <b>Físico</b> mostra a rede por locais, com bastidores, secretárias e o comprimento dos cabos."],
  ];

  const SV = (d) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const FERR1 = [["novo", "Novo", '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>'], ["abrir", "Abrir", '<path d="M3 7h6l2 2h10v10H3z"/>'], ["guardar", "Guardar", '<path d="M5 3h12l2 2v16H5z"/><path d="M8 3v6h8V3M8 21v-7h8v7"/>'],
    ["imagem", "Guardar imagem (PNG)", '<path d="M7 9V3h10v6M7 17H4V9h16v8h-3"/><rect x="7" y="14" width="10" height="7"/>'], ["relatorio", "Informação (relatório da rede)", '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>'],
    ["desfazer", "Desfazer (Ctrl+Z)", '<path d="M9 7 4 12l5 5"/><path d="M4 12h11a5 5 0 0 1 0 10h-3"/>'], ["refazer", "Refazer (Ctrl+Y)", '<path d="m15 7 5 5-5 5"/><path d="M20 12H9a5 5 0 0 0 0 10h3"/>'],
    ["zmais", "Aproximar", '<circle cx="11" cy="11" r="7"/><path d="M11 8v6M8 11h6M20 20l-4-4"/>'], ["zmenos", "Afastar", '<circle cx="11" cy="11" r="7"/><path d="M8 11h6M20 20l-4-4"/>'], ["ajustar", "Ajustar (mostrar tudo)", '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'],
    ["paleta", "Paleta de desenho", '<path d="M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.5-1.6 0-1.2 1-1.4 2-1.4H18a3 3 0 0 0 3-3A9 9 0 0 0 12 3z"/><circle cx="8" cy="10" r="1.2"/><circle cx="12" cy="7" r="1.2"/><circle cx="16" cy="10" r="1.2"/>'],
    ["ajuda", "Como usar", '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.7M12 17v.5"/>']];
  const FERR2 = [["mover", "Selecionar / mover", '<rect x="4" y="4" width="16" height="16" rx="1" stroke-dasharray="3 3"/>'], ["inspecionar", "Inspecionar", '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'],
    ["apagar", "Apagar", '<path d="M20 5H9l-6 7 6 7h11z"/><path d="m12 9 6 6M18 9l-6 6"/>'], ["redim", "Redimensionar áreas e notas", '<path d="M4 9V4h5M20 15v5h-5M4 4l7 7M20 20l-7-7"/>'],
    ["nota", "Nota", '<path d="M5 3h10l4 4v14H5z"/><path d="M8 10h8M8 14h8M8 18h5"/>'], ["area", "Desenhar retângulo (área)", '<rect x="4" y="6" width="16" height="12" rx="1"/>'],
    ["pdu", "Enviar PDU simples (ping)", '<rect x="3" y="6" width="18" height="12" rx="1.5"/><path d="m3 7 9 6 9-6"/>'], ["pduc", "Enviar PDU complexa", '<rect x="3" y="8" width="16" height="11" rx="1.5"/><path d="m3 9 8 5 8-5M7 5h14v11"/>']];
  const MENUS = [["Ficheiro", [["novo", "Novo"], ["abrir", "Abrir…"], ["guardar", "Guardar (.json)"], ["imagem", "Guardar imagem (PNG)"]]],
    ["Editar", [["desfazer", "Desfazer"], ["refazer", "Refazer"], ["duplicar", "Duplicar o equipamento aberto"], ["apagar", "Apagar"]]],
    ["Opções", [["paleta", "Paleta de desenho"], ["explicar", "Explicar os comandos (ℹ)"], ["legenda", "Legenda das luzes"]]],
    ["Ver", [["zmais", "Aproximar"], ["zmenos", "Afastar"], ["ajustar", "Ajustar (mostrar tudo)"], ["logica", "Vista lógica"], ["fisica", "Vista física"]]],
    ["Ferramentas", [["relatorio", "Relatório da rede"], ["pdu", "Enviar PDU simples"], ["pduc", "Enviar PDU complexa"], ["simul", "Modo de simulação"], ["ciclo", "Ligar/desligar todos"]]],
    ["Ajuda", [["ajuda", "Como usar o simulador"]]]];

  function montar(raiz, op) {
    const A = op.atividade;
    const larg = raiz.clientWidth || window.innerWidth || 400;
    W = larg < 600 ? 620 : 1000; H = larg < 600 ? 720 : 620;
    let rede = op.estado ? S.Rede.importar(op.estado) : (A ? S.Rede.deAtividade(A) : new S.Rede());
    let modo = "mover", cabo = "auto", sel = null, caboA = null, aba = null, feito = false;
    let pduA = null, colocar = null, corArea = null, corNota = null; // PDU simples (origem escolhida), modelo a colocar, cores da paleta de desenho
    const negoc = new Map(); // cabos acabados de ligar a um switch: luz laranja enquanto "negoceiam" (STP listening/learning)
    let vista = "logica", copiado = null; // vista lógica ou física; equipamento copiado (Ctrl+C)
    const vb = { x: 0, y: 0, w: W, h: H }; // zoom e deslocação: viewBox da vista lógica
    const logs = {}, hist = {}, hIdx = {};
    let tGuardar = null;
    const guardarDepois = () => { clearTimeout(tGuardar); tGuardar = setTimeout(() => op.aoGuardar && op.aoGuardar(rede.exportar()), 300); };

    // ------------------------------------------------------------ desfazer / refazer (fotografias da rede em JSON)
    const desf = [], refz = [];
    let tFoto = null, ultimo = null;
    const foto = () => JSON.stringify(rede.exportar());
    function registar() {
      clearTimeout(tFoto); tFoto = null;
      const s = foto(); if (s === ultimo) return;
      if (ultimo != null) { desf.push(ultimo); if (desf.length > 50) desf.shift(); }
      refz.length = 0; ultimo = s; botoesHist();
    }
    function ligarRede() { rede.aoMudar = () => { guardarDepois(); if (!tFoto) tFoto = setTimeout(registar, 0); }; }
    function restaurar(s) {
      // o modo do terminal (enable, conf t…) não vai na fotografia: mantém-se
      const modos = {}; rede.devs.forEach((d) => { if (d.eq) modos[d.id] = { modo: d.eq.modo, ctx: d.eq.ctx, executados: d.eq.executados }; });
      rede = S.Rede.importar(JSON.parse(s)); ligarRede();
      rede.devs.forEach((d) => { if (d.eq && modos[d.id]) Object.assign(d.eq, modos[d.id]); });
      ultimo = foto(); caboA = null; guardarDepois();
      const d = sel && rede.dev(sel);
      if (d) abrirInsp(d); else fecharInsp();
      atualizar(); botoesHist();
    }
    function historia(dir) {
      if (tFoto) registar();
      const de = dir < 0 ? desf : refz, para = dir < 0 ? refz : desf;
      if (!de.length) { msg(dir < 0 ? "Nada para desfazer." : "Nada para refazer."); return; }
      para.push(ultimo); restaurar(de.pop());
      msg(dir < 0 ? "Desfeito. <b>↷</b> volta a fazer." : "Refeito.");
    }
    function botoesHist() {
      const a = raiz.querySelector('[data-s="desfazer"]'), b = raiz.querySelector('[data-s="refazer"]');
      if (a) a.disabled = !desf.length && !tFoto; if (b) b.disabled = !refz.length;
    }
    ligarRede(); ultimo = foto();

    const ferr = (lista) => lista.map(([k, n, d]) => `<button type="button" data-s="${k}" data-dica="${esc(n)}" aria-label="${esc(n)}"${["desfazer", "refazer"].includes(k) ? " disabled" : ""}>${SV(d)}</button>`).join("");
    raiz.innerHTML = `<div class="sim sim-pt">
      ${A ? `<div class="cartao sim-passos"><div class="linha entre"><span class="rotulo">Atividade · <span id="sim-prog"></span></span><button class="btn-copiar sim-btn-link" data-s="reiniciar">Reiniciar</button></div>
        <p class="peq">${esc(A.cenario)}</p><ol class="sim-lista" id="sim-lista"></ol></div>` : ""}
      <div class="sim-amb">
      <div class="sim-menus" role="menubar" aria-label="Menus">${MENUS.map(([n, it], i) => `<div class="sim-menu"><button type="button" data-menu="${i}" aria-expanded="false" aria-haspopup="true">${esc(n)}</button><div class="sim-menu-lista" role="menu" hidden>${it.map(([k, t]) => `<button type="button" role="menuitem" data-s="${k}">${esc(t)}</button>`).join("")}</div></div>`).join("")}</div>
      <div class="sim-ferr" role="toolbar" aria-label="Ferramentas do simulador"><div class="sim-ferr-g">${ferr(FERR1)}</div><span class="sim-ferr-sep" aria-hidden="true"></span><div class="sim-ferr-g">${ferr(FERR2)}</div></div>
      <div class="sim-vista"><span class="sim-seg2" role="group" aria-label="Vista"><button type="button" data-s="logica" aria-pressed="true">◇ Lógico</button><button type="button" data-s="fisica" aria-pressed="false">▤ Físico</button></span><span class="sim-coord" id="sim-coord" aria-hidden="true">x: 0, y: 0</span><span class="sim-esp"></span><span class="sim-raiz-txt" title="Espaço de trabalho principal">Raiz</span></div>
      <div class="sim-trab" id="sim-trab"><div class="sim-esq">
      <div class="sim-palco"><svg id="sim-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Área de trabalho da rede"></svg>
        <details class="sim-legenda" id="sim-legenda" ${ler("ccna-sim-leg") === "0" ? "" : "open"}><summary>Luzes</summary><span><i class="ok"></i>ligado</span><span><i class="bad"></i>em baixo / cabo errado</span><span><i class="amb"></i>bloqueado (STP) / a negociar</span></details>
        <div class="sim-dica" id="sim-dica" hidden></div></div>
      <div class="sim-msg" id="sim-msg" role="status">${A ? "Comece pelo primeiro passo. Toque em ? para ver como usar." : "Modo livre: monte a rede que quiser. Escolha os equipamentos na caixa de baixo."}</div></div>
      <div class="sim-dir" id="sim-dir"><div class="sim-simul" id="sim-simul" hidden></div>
      <div class="sim-inspetor sim-jan" id="sim-insp" hidden></div></div></div>
      <div class="sim-tempo"><span>Tempo:</span><b class="sim-relogio tab-num" id="sim-relogio">00:00:00</b>
        <button type="button" data-s="ciclo" data-dica="Ligar/desligar todos os equipamentos" aria-label="Ligar/desligar todos os equipamentos">⏻</button><button type="button" data-s="avancar" data-dica="Avançar o tempo" aria-label="Avançar o tempo">⏩</button>
        <span class="sim-seg2 sim-modo" role="group" aria-label="Modo"><button type="button" data-s="real" aria-pressed="true">⏱ Tempo real</button><button type="button" data-s="sim" aria-pressed="false">✉ Simulação</button></span></div>
      <div class="sim-base" id="sim-base"></div>
      <input type="file" accept=".json,application/json" id="sim-abrir" hidden>
      </div>
      <div class="sim-modal" id="sim-modal" hidden></div>
    </div>`;
    const $ = (s) => raiz.querySelector(s);
    const svg = $("#sim-svg");
    // o simulador ocupa toda a largura do ecrã (sem a coluna estreita do resto da app)
    const mainEl = raiz.closest("main"); if (mainEl) mainEl.classList.add("main-sim");
    $("#sim-simul").addEventListener("click", (e) => cliqueSim(e));
    const msg = (t, tipo) => { const m = $("#sim-msg"); m.innerHTML = t; m.className = "sim-msg " + (tipo || ""); };

    // ------------------------------------------------------------ desenho
    const pos = (d) => ({ x: d.x / 100 * W, y: d.y / 100 * H });
    // Notas: quebra o texto em linhas que caibam na largura
    function linhasNota(n) {
      const max = Math.max(8, Math.floor((n.w / 100 * W - 24) / 8.6)), out = [];
      String(n.texto || "").split("\n").forEach((p) => {
        let l = "";
        p.split(/\s+/).forEach((w) => { while (w.length > max) { if (l) { out.push(l); l = ""; } out.push(w.slice(0, max)); w = w.slice(max); } if ((l + " " + w).trim().length > max) { out.push(l); l = w; } else l = (l ? l + " " : "") + w; });
        out.push(l);
      });
      return out.slice(0, 14);
    }
    function desenharAreas() {
      let s = "";
      rede.areas.forEach((a) => {
        const x = a.x / 100 * W, y = a.y / 100 * H, w = a.w / 100 * W, h = a.h / 100 * H, lw = Math.min(w, String(a.nome).length * 9.5 + 26);
        s += `<g data-area="${a.id}" class="sim-area"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" class="sim-area-corpo" fill="${a.cor}" stroke="${a.cor}"/>
          <g class="sim-pega"><rect x="${x - 6}" y="${y - 6}" width="${lw + 12}" height="44" fill="transparent"/><rect x="${x}" y="${y}" width="${lw}" height="30" rx="8" fill="${a.cor}"/><text x="${x + 12}" y="${y + 21}" class="sim-area-txt">${esc(a.nome)}</text></g>
          <g class="sim-redim" data-redim data-so-ecra><circle cx="${x + w - 12}" cy="${y + h - 12}" r="26" fill="transparent"/><path d="M${x + w - 6} ${y + h - 26} V${y + h - 6} H${x + w - 26} Z" fill="${a.cor}"/></g></g>`;
      });
      rede.notas.forEach((n) => {
        const x = n.x / 100 * W, y = n.y / 100 * H, w = n.w / 100 * W, ls = linhasNota(n), h = 20 + ls.length * 21;
        s += `<g data-nota="${n.id}" class="sim-nota"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${n.cor}" class="sim-nota-corpo"/>
          <text x="${x + 12}" y="${y + 8}" class="sim-nota-txt">${ls.map((l) => `<tspan x="${x + 12}" dy="21">${esc(l) || " "}</tspan>`).join("")}</text>
          <g class="sim-redim" data-redim data-so-ecra><circle cx="${x + w - 8}" cy="${y + h - 8}" r="22" fill="transparent"/><path d="M${x + w - 4} ${y + h - 18} V${y + h - 4} H${x + w - 18} Z" fill="rgba(0,0,0,.28)"/></g></g>`;
      });
      return s;
    }
    // luzes nas pontas dos cabos (como no Packet Tracer): verde, vermelho ou laranja
    const ehSwitch = (d) => d && (d.tipo === "switch" || d.tipo === "switch_l3");
    const aNegociar = (l, lado) => (negoc.get(l.id) || 0) > Date.now() && ehSwitch(rede.dev(lado === "A" ? l.a : l.b));
    function corLuz(l, lado, est) {
      est = est || rede.estadoLink(l);
      if (est.estado === "errado") return "errado";
      if (est.estado === "ok") { const st = rede.stpLed ? rede.stpLed(l) : {}; return (lado === "A" ? st.a : st.b) ? "baixo stp" : aNegociar(l, lado) ? "baixo" : "ok"; }
      return "errado";
    }
    function motivoLuz(l, lado) {
      const est = rede.estadoLink(l), d = rede.dev(lado === "A" ? l.a : l.b), o = rede.dev(lado === "A" ? l.b : l.a), p = lado === "A" ? l.pa : l.pb, po = lado === "A" ? l.pb : l.pa, c = corLuz(l, lado, est);
      const i = d.eq ? d.eq.cfg.interfaces[p] || {} : {}, io = o.eq ? o.eq.cfg.interfaces[po] || {} : {};
      const onde = `Luz de <b>${esc(d.nome)} ${esc(curto(p))}</b>: `;
      if (est.estado === "errado") return [onde + `<b>vermelha</b> — cabo ${esc(S.CABOS[l.cabo].nome.toLowerCase())} errado para estas portas. Use <b>${esc(est.certo)}</b>: apague o cabo e volte a ligar.`, "erro"];
      if (c === "baixo stp") return [onde + "<b>laranja</b> — a porta está bloqueada pelo Spanning Tree (STP) para não haver um loop entre switches. Não passa tráfego; se a outra ligação falhar, abre-se sozinha.", ""];
      if (c === "baixo") return [onde + "<b>laranja</b> — a porta do switch está a negociar (STP: listening → learning). Fica verde daqui a pouco, ou toque em ⏩ Avançar o tempo.", ""];
      if (c === "ok") return [onde + "<b>verde</b> — ligação a funcionar.", "ok"];
      const porque = d.desligado ? `${esc(d.nome)} está desligado (separador Físico).` : i.shutdown ? `a interface ${esc(curto(p))} está em <code>shutdown</code>: na CLI <code>interface ${esc(p)}</code> e <code>no shutdown</code>, ou Configuração › ${esc(curto(p))} › Porta ligada.`
        : o.desligado ? `do outro lado, ${esc(o.nome)} está desligado.` : io.shutdown ? `do outro lado, ${esc(o.nome)} ${esc(curto(po))} está em <code>shutdown</code> (falta <code>no shutdown</code>).` : "a ligação está em baixo.";
      return [onde + "<b>vermelha</b> — " + porque, "erro"];
    }
    function desenhar() {
      if (vista === "fisica") return desenharFisica();
      let s = desenharAreas();
      rede.links.forEach((l) => {
        const a = pos(rede.dev(l.a)), b = pos(rede.dev(l.b)), est = rede.estadoLink(l), C = S.CABOS[l.cabo];
        s += `<g data-link="${l.id}"><line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="transparent" stroke-width="22"/>
          <line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="sim-cabo" stroke="${C.cor}" stroke-width="${l.cabo === "consola" ? 3 : 3.5}" ${C.tracejado || l.cabo === "consola" ? 'stroke-dasharray="9 6"' : ""}/>`;
        if (l.cabo !== "consola") {
          const len = Math.hypot(b.x - a.x, b.y - a.y) || 1, ux = (b.x - a.x) / len, uy = (b.y - a.y) / len, dd = Math.min(56, len * 0.3);
          ["A", "B"].forEach((lado) => {
            const p = lado === "A" ? a : b, sx = lado === "A" ? ux : -ux, sy = lado === "A" ? uy : -uy, cx = p.x + sx * dd, cy = p.y + sy * dd;
            const pts = [[cx + sx * 9, cy + sy * 9], [cx - sx * 6 - sy * 8, cy - sy * 6 + sx * 8], [cx - sx * 6 + sy * 8, cy - sy * 6 - sx * 8]].map((q) => q.map((v) => v.toFixed(1)).join(",")).join(" ");
            s += `<polygon points="${pts}" class="sim-luz ${corLuz(l, lado, est)}" data-luz="${lado}"/>`;
          });
        }
        if (op.portas !== false) {
          const ta = 0.24, tb = 0.76;
          s += `<text x="${a.x + (b.x - a.x) * ta}" y="${a.y + (b.y - a.y) * ta - 12}" class="sim-porta-txt">${esc(curto(l.pa))}</text><text x="${a.x + (b.x - a.x) * tb}" y="${a.y + (b.y - a.y) * tb - 12}" class="sim-porta-txt">${esc(curto(l.pb))}</text>`;
        }
        s += "</g>";
      });
      rede.wifi().links.forEach((l) => {
        const a = pos(rede.dev(l.a)), b = pos(rede.dev(l.b));
        s += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="sim-wifi"/>`;
      });
      rede.devs.forEach((d) => {
        const p = pos(d), T = S.TIPOS[d.tipo];
        const ip = d.pc ? (rede.l3(d)[0] || {}).ip || "" : "";
        // hostname diferente do nome mostrado (atividades guiadas ou nome repetido): aparece por baixo
        const hn = d.eq && d.eq.cfg.hostname !== d.nome && d.eq.cfg.hostname !== T.host ? d.eq.cfg.hostname : "";
        const linhas = [hn ? [hn, "sim-host"] : null, ip ? [ip, "sim-ip"] : null, d.modelo && d.eq ? [d.modelo, "sim-ip"] : null].filter(Boolean);
        s += `<g data-dev="${d.id}" class="sim-dev ${sel === d.id ? "sel" : ""} ${(caboA && caboA.d === d.id) || pduA === d.id ? "origem" : ""} ${d.desligado ? "off" : ""}" transform="translate(${p.x},${p.y})">
          <circle r="40" class="sim-halo"/><g transform="translate(-30,-30)" class="sim-dev-ic"><svg width="60" height="60" viewBox="0 0 64 64">${F.ICONES[T.icone]}</svg></g>
          <text y="48" class="sim-nome">${esc(d.nome)}</text>${linhas.map(([t, c], k) => `<text y="${66 + k * 18}" class="${c}">${c === "sim-host" ? "hostname " : ""}${esc(t)}</text>`).join("")}${d.desligado ? '<text y="-44" class="sim-off-txt">desligado</text>' : ""}</g>`;
      });
      s += `<circle id="sim-pacote" r="10" class="sim-pacote" cx="-50" cy="-50"/>`;
      const ev = sm.evs[sm.i];
      if (sm.aberto && ev) s += envelope(ev);
      svg.innerHTML = s;
    }

    function animar(devs, ok) {
      if (!devs || devs.length < 2 || reduzido() || vista === "fisica") return;
      const pts = devs.map((id) => rede.dev(id)).filter(Boolean).map(pos);
      const bola = svg.querySelector("#sim-pacote"); if (!bola) return;
      bola.setAttribute("class", "sim-pacote" + (ok ? " ok" : " falha"));
      let k = 0, t0 = null; const dur = 260;
      const passo = (ts) => {
        if (!t0) t0 = ts; const f = Math.min(1, (ts - t0) / dur);
        const a = pts[k], b = pts[k + 1];
        bola.setAttribute("cx", a.x + (b.x - a.x) * f); bola.setAttribute("cy", a.y + (b.y - a.y) * f);
        if (f >= 1) { k++; t0 = null; if (k >= pts.length - 1) { setTimeout(() => { bola.setAttribute("cx", -50); bola.setAttribute("cy", -50); }, 500); return; } }
        requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    }

    // ------------------------------------------------------------ modo de simulação (passo a passo, como no Packet Tracer)
    const SM = window.Simulacao;
    const sm = { aberto: false, evs: [], i: -1, auto: null, filtro: new Set(["ARP", "ICMP", "DHCP", "DNS", "TCP", "UDP"]), pedido: { tipo: "ping", de: "", para: "" }, res: null };
    const TIPOS_SIM = [["ping", "Ping (ICMP)"], ["dhcp", "Pedir IP por DHCP"], ["dns", "DNS (nslookup)"], ["http", "Abrir página web (HTTP)"], ["telnet", "Telnet"], ["ssh", "SSH"], ["smb", "Pasta partilhada (SMB)"]];
    const visiveis = () => sm.evs.map((e, k) => [e, k]).filter(([e]) => e.tipo === "FALHA" || sm.filtro.has(e.tipo));
    function envelope(ev) {
      const a = rede.dev(ev.de), b = rede.dev(ev.para); if (!a || !b) return "";
      const p = pos(a), q = pos(b), cor = ev.tipo === "FALHA" ? "#c03a3a" : (SM.COR[ev.tipo] || "#5b6880");
      const x = a === b ? p.x : (p.x + q.x) / 2, y = a === b ? p.y - 52 : (p.y + q.y) / 2;
      return `<g id="sim-env" class="sim-env" transform="translate(${x - 17},${y - 12})" data-x0="${p.x - 17}" data-y0="${p.y - 12}" data-x1="${x - 17}" data-y1="${y - 12}">${ev.tipo === "FALHA" ? `<circle cx="17" cy="12" r="15" fill="${cor}"/><path d="M10 5 L24 19 M24 5 L10 19" stroke="#fff" stroke-width="4" stroke-linecap="round"/>` : `<rect width="34" height="24" rx="4" fill="#fff" stroke="${cor}" stroke-width="2.6"/><path d="M1 2 L17 14 L33 2" fill="none" stroke="${cor}" stroke-width="2.6"/><text x="17" y="38" class="sim-env-txt" fill="${cor}">${esc(ev.tipo)}</text>`}</g>`;
    }
    // o envelope sai do equipamento de origem e para a meio do cabo
    function moverEnvelope() {
      const g = svg.querySelector("#sim-env"); if (!g || reduzido()) return;
      const x0 = +g.dataset.x0, y0 = +g.dataset.y0, x1 = +g.dataset.x1, y1 = +g.dataset.y1; let t0 = null;
      const f = (ts) => { if (!t0) t0 = ts; const k = Math.min(1, (ts - t0) / 380), e = 1 - (1 - k) * (1 - k); g.setAttribute("transform", `translate(${x0 + (x1 - x0) * e},${y0 + (y1 - y0) * e})`); if (k < 1) requestAnimationFrame(f); };
      requestAnimationFrame(f);
    }
    function abrirSim(on, foco) {
      sm.aberto = on; clearInterval(sm.auto); sm.auto = null;
      const p = $("#sim-simul"); p.hidden = !on; sm.novo = !!foco || !sm.evs.length;
      if (on) { if (!sm.pedido.de) { const h = rede.devs.find((d) => d.pc && rede.l3(d).length) || rede.devs.find((d) => d.eq); sm.pedido.de = h ? h.id : ""; } pintarSim(); msg("<b>Modo de simulação:</b> use <b>Enviar PDU simples</b> (toque na origem e no destino) ou a PDU complexa, e avance mensagem a mensagem na Lista de eventos."); }
      else { sm.i = -1; msg("Tempo real."); }
      layoutDir(); opcoes(); desenhar();
      if (on && foco) { const f = p.querySelector('[name="para"]'); if (f && !f.disabled) f.focus({ preventScroll: true }); p.scrollIntoView({ block: "nearest", behavior: reduzido() ? "auto" : "smooth" }); }
    }
    function gerarSim() {
      if (!SM) return;
      clearInterval(sm.auto); sm.auto = null;
      sm.res = SM.gerar(rede, sm.pedido); sm.evs = sm.res.eventos; sm.i = -1;
      pintarSim(); passoSim(1);
    }
    function passoSim(k) {
      const vs = visiveis(); if (!vs.length) { sm.i = -1; pintarSim(); desenhar(); return; }
      const pos0 = vs.findIndex(([, i]) => i === sm.i);
      const n = Math.max(0, Math.min(vs.length - 1, pos0 + k));
      sm.i = vs[n][1]; desenhar(); moverEnvelope(); pintarSim();
      if (n >= vs.length - 1) { clearInterval(sm.auto); sm.auto = null; pintarSim(); }
    }
    function pintarSim() {
      const p = $("#sim-simul"); if (!p || p.hidden) return;
      const cand = rede.devs.filter((d) => d.pc || d.eq);
      const ev = sm.evs[sm.i], vs = visiveis(), nome = (id) => { const d = rede.dev(id); return d ? d.nome : "?"; };
      const cor = (t) => (t === "FALHA" ? "#c03a3a" : SM.COR[t] || "#5b6880");
      const posI = vs.findIndex(([, i]) => i === sm.i), ult = vs.length - 1;
      const estado = (e, n) => e.tipo === "FALHA" ? (n <= posI ? ["Falhou", "bad"] : ["À espera", ""]) : n < posI ? ["Concluído", "ok"] : n === posI ? (n === ult && sm.res && sm.res.ok ? ["Sucesso", "ok"] : ["Em curso", "acc"]) : ["À espera", ""];
      p.innerHTML = `<div class="sim-sm-cab"><b>Painel de simulação <small>Simulation Panel</small></b><button type="button" class="btn-copiar" data-sm="fechar">Tempo real</button></div>
        ${sm.evs.length ? `<div class="sim-sm-ctl" role="group" aria-label="Reprodução"><button type="button" class="btn" data-sm="inicio" aria-label="Recomeçar" title="Recomeçar">⏮</button><button type="button" class="btn" data-sm="ant" aria-label="Mensagem anterior" title="Anterior">◀</button><button type="button" class="btn" data-sm="auto" title="Reproduzir automaticamente">${sm.auto ? "⏸ Pausa" : "▶ Reproduzir"}</button><button type="button" class="btn prim" data-sm="seg" title="Passo seguinte (Capture / Forward)">Seguinte ⏭</button></div>` : ""}
        <div class="rotulo">Lista de eventos <small>Event List</small></div>
        <div class="sim-ev-tab"><table><thead><tr><th>Fire</th><th>Estado</th><th>Origem</th><th>Destino</th><th>Tipo</th><th>Cor</th><th>Tempo (s)</th></tr></thead><tbody>${vs.map(([e, k], n) => { const [et, ec] = estado(e, n); return `<tr data-sm-i="${k}" class="${k === sm.i ? "atual" : ""}" tabindex="0"><td><span class="sim-fire ${k === sm.i ? "on" : n < posI ? "feito" : ""}" aria-hidden="true">●</span></td><td><span class="sim-ev-est ${ec}">${et}</span></td><td>${esc(nome(e.de))}</td><td>${e.de === e.para ? "—" : esc(nome(e.para))}</td><td><b>${esc(e.tipo === "FALHA" ? "✗" : e.tipo)}</b></td><td><i class="sim-ev-cor" style="background:${cor(e.tipo)}"></i></td><td class="tab-num">${(n * 0.001).toFixed(3)}</td></tr>`; }).join("") || `<tr><td colspan="7" class="suave">${sm.res && !sm.res.ok ? esc(sm.res.motivo) : "Sem eventos. Toque em Enviar PDU simples (envelope) e depois na origem e no destino; um ping no Prompt de um PC também aparece aqui."}</td></tr>`}</tbody></table></div>
        ${sm.res ? `<p class="peq ${sm.res.ok ? "sim-ok-txt" : "sim-erro-txt"}">${sm.res.ok ? "Resultado: chegou ao destino e a resposta voltou." : "Resultado: falhou — " + esc(sm.res.motivo || "")}</p>` : ""}
        ${sm.evs.length ? `<div class="sim-sm-pdu"><span class="rotulo">Detalhes da PDU <small>PDU Information</small></span>${ev ? `<b>${esc(ev.resumo)}</b>${ev.falha ? `<p class="peq sim-erro-txt">${esc(ev.falha)}</p>` : ""}${ev.camadas.map(([c, t]) => `<div class="sim-sm-camada"><span class="rotulo">${esc(c)}</span><code>${esc(t)}</code></div>`).join("")}${cartaoProt(ev)}` : '<p class="peq suave">Toque em Seguinte para ver a primeira mensagem.</p>'}</div>` : ""}
        <details class="sim-sm-novo" ${sm.novo ? "open" : ""}><summary><b>Enviar PDU complexa</b> <small>Create Complex PDU</small></summary>
        <form class="sim-sm-form" data-sm-form><label>Origem<select class="campo" name="de">${cand.map((d) => `<option value="${d.id}" ${sm.pedido.de === d.id ? "selected" : ""}>${esc(d.nome)}</option>`).join("")}</select></label>
          <label>O que fazer<select class="campo" name="tipo">${TIPOS_SIM.map(([k, n]) => `<option value="${k}" ${sm.pedido.tipo === k ? "selected" : ""}>${n}</option>`).join("")}</select></label>
          <label>Destino (IP, nome do equipamento ou nome DNS)<input class="campo mono" name="para" list="sim-sm-dest" value="${esc(sm.pedido.para)}" placeholder="ex.: 192.168.1.1 ou SRV" autocomplete="off" ${sm.pedido.tipo === "dhcp" ? "disabled" : ""}></label>
          <datalist id="sim-sm-dest">${rede.devs.filter((d) => rede.l3(d).length).map((d) => `<option value="${esc(d.nome)}">${esc(rede.l3(d)[0].ip)}</option>`).join("")}</datalist>
          <button class="btn prim">Criar PDU</button></form></details>
        <div class="chips sim-sm-filtro"><span class="rotulo">Filtros</span>${["ARP", "ICMP", "DHCP", "DNS", "TCP", "UDP"].map((t) => `<button type="button" class="chip-op" data-sm-f="${t}" aria-pressed="${sm.filtro.has(t)}" style="--c:${cor(t)}"><i></i>${t}</button>`).join("")}<button type="button" class="chip-op" data-sm="arp" title="Esquece os endereços MAC aprendidos (o próximo pacote começa com ARP)">Limpar ARP</button></div>`;
      const f = p.querySelector("[data-sm-form]"), det = p.querySelector(".sim-sm-novo");
      det.ontoggle = () => { sm.novo = det.open; };
      f.onchange = (e) => { if (e.target.name === "tipo") { sm.pedido.tipo = e.target.value; pintarSim(); } };
      f.onsubmit = (e) => { e.preventDefault(); const v = Object.fromEntries(new FormData(f).entries()); sm.pedido = { de: v.de, tipo: v.tipo, para: (v.para || "").trim() }; sm.novo = false; gerarSim(); };
      const at = p.querySelector("tr.atual"), tb = p.querySelector(".sim-ev-tab");
      if (at && tb) tb.scrollTop = Math.max(0, at.offsetTop - tb.clientHeight / 2);
    }
    function cliqueSim(e) {
      const b = e.target.closest("[data-sm],[data-sm-f],[data-sm-i]"); if (!b) return;
      if (b.dataset.smF) { const t = b.dataset.smF; sm.filtro.has(t) ? sm.filtro.delete(t) : sm.filtro.add(t); pintarSim(); return; }
      if (b.dataset.smI != null) { sm.i = +b.dataset.smI; desenhar(); moverEnvelope(); pintarSim(); return; }
      const a = b.dataset.sm;
      if (a === "fechar") abrirSim(false);
      if (a === "seg") passoSim(1);
      if (a === "ant") passoSim(-1);
      if (a === "inicio") { sm.i = -1; passoSim(1); }
      if (a === "arp") { SM.limparArp(rede); msg("Tabelas ARP limpas: o próximo pacote começa com ARP."); }
      if (a === "auto") { if (sm.auto) { clearInterval(sm.auto); sm.auto = null; pintarSim(); } else { if (sm.i >= sm.evs.length - 1) sm.i = -1; sm.auto = setInterval(() => passoSim(1), 900); passoSim(1); } }
    }

    // ------------------------------------------------------------ vista física: locais, bastidores e secretárias
    const NO_BASTIDOR = ["router", "asa", "switch_l3", "switch", "wlc", "hub", "repetidor", "bridge", "modem_dsl", "modem_cabo", "servidor"];
    const COBRE = ["direto", "cruzado"];
    // comprimento estimado: 1 % do desenho = 1 m (mais 1 m de folga)
    const metros = (l) => { const a = rede.dev(l.a), b = rede.dev(l.b); return Math.max(1, Math.round(Math.hypot(a.x - b.x, (a.y - b.y) * H / W)) + 1); };
    const longoDemais = (l) => COBRE.includes(l.cabo) && metros(l) > 100;
    const corta = (t, n) => (t.length > n ? t.slice(0, n - 1) + "…" : t);
    const AVISO_100 = "acima de 100 m: use fibra ou um switch intermédio";
    function localDe(d) { let r = null; rede.areas.forEach((a) => { if (d.x >= a.x && d.x <= a.x + a.w && d.y >= a.y && d.y <= a.y + a.h && (!r || a.w * a.h < r.w * r.h)) r = a; }); return r; }
    function locais() {
      const ls = rede.areas.map((a) => ({ a, nome: a.nome, cor: a.cor, devs: [] })), sem = { a: null, nome: "Sem local", cor: "#7a8796", devs: [] };
      rede.devs.forEach((d) => { const a = localDe(d); (a ? ls.find((x) => x.a === a) : sem).devs.push(d); });
      if (sem.devs.length) ls.push(sem);
      return ls;
    }
    function desenharFisica() {
      // no telemóvel o desenho é mais estreito para o texto ficar legível
      const WF = W < 800 ? 470 : W, cols = WF >= 900 ? 2 : 1, M = 16, G = 20, pw = (WF - 2 * M - (cols - 1) * G) / cols, RW = WF < 800 ? 172 : 200, U = 32, CEL = WF < 800 ? 108 : 124, FILA = 136;
      const ancora = {}, uAlt = (d) => d.tipo === "servidor" ? 2 : 1;
      let fundo = "", cabos = "", devs = "", rot = "", y = M;
      const ls = locais().map((L) => {
        const rack = L.devs.filter((d) => NO_BASTIDOR.includes(d.tipo)).sort((a, b) => NO_BASTIDOR.indexOf(a.tipo) - NO_BASTIDOR.indexOf(b.tipo));
        const mesas = L.devs.filter((d) => !NO_BASTIDOR.includes(d.tipo));
        const rackH = rack.length ? 48 + (rack.reduce((t, d) => t + uAlt(d), 0) + 1) * U : 0, mx = rack.length ? RW + 28 : 0;
        const porLinha = Math.max(1, Math.floor((pw - 32 - mx) / CEL)), filas = Math.ceil(mesas.length / porLinha);
        return Object.assign(L, { rack, mesas, rackH, mx, porLinha, h: 60 + Math.max(rackH, filas * FILA, 50) + 14 });
      });
      for (let i = 0; i < ls.length; i += cols) {
        const linha = ls.slice(i, i + cols), alt = Math.max(...linha.map((L) => L.h));
        linha.forEach((L, k) => {
          const x = M + k * (pw + G), sem = !L.a;
          fundo += `<g class="sim-local"><rect x="${x}" y="${y}" width="${pw}" height="${alt}" rx="16" class="sim-local-corpo${sem ? " sem" : ""}" stroke="${L.cor}"/>
            <path d="M${x + 16} ${y + 34} v-12 l10 -8 l10 8 v12 z" fill="${L.cor}"/><text x="${x + 44}" y="${y + 33}" class="sim-local-txt">${esc(corta(L.nome, Math.floor((pw - 130) / 10.5)))}</text>
            <text x="${x + pw - 16}" y="${y + 33}" class="sim-local-info">${L.devs.length} equip.</text>`;
          const top = y + 52;
          if (L.rack.length) {
            const rx = x + 16;
            fundo += `<rect x="${rx}" y="${top}" width="${RW}" height="${L.rackH}" rx="8" class="sim-rack"/><rect x="${rx + 10}" y="${top + 20}" width="9" height="${L.rackH - 40}" class="sim-rack-calha"/><rect x="${rx + RW - 19}" y="${top + 20}" width="9" height="${L.rackH - 40}" class="sim-rack-calha"/>
              <text x="${rx + RW / 2}" y="${top + 15}" class="sim-rack-txt">Bastidor 19"</text>`;
            let u = 0;
            L.rack.forEach((d) => {
              const uy = top + 24 + u * U, uh = uAlt(d) * U - 4, ativo = rede.linksDe(d).some((l) => l.cabo === "wifi" || rede.linkUp(l));
              devs += `<g data-dev="${d.id}" class="sim-dev sim-unid ${sel === d.id ? "sel" : ""}"><rect x="${rx + 22}" y="${uy}" width="${RW - 44}" height="${uh}" rx="3" class="sim-unid-corpo"/>
                <g transform="translate(${rx + 26},${uy + uh / 2 - 11})"><svg width="22" height="22" viewBox="0 0 64 64">${F.ICONES[S.TIPOS[d.tipo].icone]}</svg></g>
                <text x="${rx + 52}" y="${uy + uh / 2 + 5}" class="sim-unid-txt">${esc(corta(d.nome + (d.modelo ? " · " + d.modelo : ""), RW < 200 ? 14 : 17))}</text><title>${esc(d.nome)}</title>
                <circle cx="${rx + RW - 32}" cy="${uy + uh / 2}" r="4" class="${ativo ? "sim-led-on" : "sim-led-off"}"/></g>`;
              ancora[d.id] = { x: rx + RW - 22, y: uy + uh / 2, dx: 1, dy: 0 }; u += uAlt(d);
            });
          }
          L.mesas.forEach((d, j) => {
            const cx = x + 16 + L.mx + (j % L.porLinha) * CEL + CEL / 2, my = top + Math.floor(j / L.porLinha) * FILA;
            fundo += `<rect x="${cx - 48}" y="${my + 78}" width="96" height="9" rx="2" class="sim-mesa"/><rect x="${cx - 42}" y="${my + 87}" width="6" height="26" class="sim-mesa"/><rect x="${cx + 36}" y="${my + 87}" width="6" height="26" class="sim-mesa"/>`;
            devs += `<g data-dev="${d.id}" class="sim-dev ${sel === d.id ? "sel" : ""}"><rect x="${cx - 44}" y="${my}" width="88" height="80" rx="10" class="sim-halo"/>
              <text x="${cx}" y="${my + 15}" class="sim-nome-p">${esc(corta(d.nome, 12))}</text><title>${esc(d.nome)}</title><g transform="translate(${cx - 30},${my + 18})"><svg width="60" height="60" viewBox="0 0 64 64">${F.ICONES[S.TIPOS[d.tipo].icone]}</svg></g></g>`;
            ancora[d.id] = { x: cx + 12, y: my + 74, dx: 0, dy: 1 }; // o cabo chega por baixo da secretária
          });
          if (!L.devs.length) fundo += `<text x="${x + pw / 2}" y="${top + 34}" class="sim-local-info meio">Vazio: arraste equipamentos para esta área.</text>`;
        });
        y += alt + G;
      }
      const avisos = [];
      rede.links.forEach((l) => {
        const a = ancora[l.a], b = ancora[l.b]; if (!a || !b) return;
        const C = S.CABOS[l.cabo] || S.CABOS.direto, k = Math.max(60, Math.hypot(b.x - a.x, b.y - a.y) / 3);
        const c1 = { x: a.x + a.dx * k, y: a.y + a.dy * k }, c2 = { x: b.x + b.dx * k, y: b.y + b.dy * k };
        cabos += `<path d="M${a.x} ${a.y} C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${b.x} ${b.y}" class="sim-cabo-f" stroke="${C.cor}" ${C.tracejado || l.cabo === "consola" ? 'stroke-dasharray="9 6"' : ""}/>`;
        const m = metros(l), longo = longoDemais(l), px = (a.x + 3 * c1.x + 3 * c2.x + b.x) / 8, py = (a.y + 3 * c1.y + 3 * c2.y + b.y) / 8;
        const tx = `${m} m${longo ? " ⚠" : ""}`, tw = tx.length * 7.6 + 12;
        rot += `<g class="sim-metros${longo ? " longo" : ""}"><rect x="${px - tw / 2}" y="${py - 10}" width="${tw}" height="20" rx="10" stroke="${C.cor}"/><text x="${px}" y="${py + 4.5}">${tx}</text></g>`;
        if (longo) avisos.push(`${rede.dev(l.a).nome} ↔ ${rede.dev(l.b).nome}: ${m} m de cobre — ${AVISO_100}`);
      });
      rede.wifi().links.forEach((l) => { const a = ancora[l.a], b = ancora[l.b]; if (a && b) cabos += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="sim-wifi"/>`; });
      if (!rede.devs.length) { rot += `<text x="${WF / 2}" y="${y + 20}" class="sim-local-info meio">Ainda não há equipamentos. Adicione-os e desenhe áreas (Mais › Área).</text>`; y += 50; }
      avisos.forEach((t) => {
        const max = Math.floor((WF - 2 * M) / 7.4), ls = []; let l = "";
        ("⚠ " + t).split(" ").forEach((w) => { if ((l + " " + w).length > max) { ls.push(l); l = w; } else l = l ? l + " " + w : w; }); ls.push(l);
        ls.forEach((x, i) => { rot += `<text x="${M + (i ? 18 : 0)}" y="${y + 14}" class="sim-aviso">${esc(x)}</text>`; y += 19; }); y += 6;
      });
      svg.setAttribute("viewBox", `0 0 ${WF} ${Math.max(y + 10, 200)}`);
      svg.innerHTML = fundo + cabos + devs + rot;
      return avisos;
    }
    function resumoFisica() {
      const ls = locais(), tot = rede.links.reduce((t, l) => t + metros(l), 0), longos = rede.links.filter(longoDemais).length;
      msg(`<b>Vista física</b>: ${ls.length} ${ls.length === 1 ? "local" : "locais"}, ${rede.links.length} cabos, cerca de ${tot} m de cabo (1 % do desenho ≈ 1 m).` +
        (longos ? ` <b>${longos} cabo(s) de cobre ${AVISO_100}.</b>` : rede.areas.length ? "" : " Desenhe áreas (Mais › Área) para separar edifícios e salas."), longos ? "erro" : "");
    }

    // ------------------------------------------------------------ passos da atividade
    function verificarPassos() {
      if (!A) return;
      // por ordem: um passo só conta depois dos anteriores (evita "feito" por acaso no início)
      let antes = true;
      const res = A.passos.map((p) => { let ok = false; if (antes) { try { ok = !!S.verificar(rede, p.check); } catch (e) { ok = false; } } antes = antes && ok; return ok; });
      const atual = res.indexOf(false);
      $("#sim-prog").textContent = `${res.filter(Boolean).length}/${A.passos.length} passos`;
      $("#sim-lista").innerHTML = A.passos.map((p, i) => `<li class="${res[i] ? "feito" : i === atual ? "atual" : ""}"><span class="cx">${res[i] ? "✓" : i + 1}</span><div><span>${esc(p.texto)}</span>${p.ajuda ? `<details ${i === atual ? "open" : ""}><summary>como fazer</summary><span class="peq">${esc(p.ajuda)}</span></details>` : ""}</div></li>`).join("");
      if (res.every(Boolean) && !feito) { feito = true; msg("<b>Atividade concluída!</b> Pode continuar a explorar a rede.", "ok"); if (op.aoConcluir) op.aoConcluir(); }
      if (op.aoProgresso) op.aoProgresso(res.filter(Boolean).length, A.passos.length);
    }
    function atualizar() { desenhar(); verificarPassos(); }

    // ------------------------------------------------------------ ferramentas
    // Caixa de equipamentos como a do Packet Tracer (em baixo): à esquerda o tipo (Device-Type Selection) e a subcategoria,
    // à direita os modelos ou os cabos (Device-Specific Selection), com o nome do escolhido por baixo.
    const CAT_CURTO = { "Routers": ["Routers", "router"], "Switches": ["Switches", "switch"], "Hubs e ligações": ["Hubs", "hub"], "Sem fios": ["Sem fios", "ap"], "Segurança": ["Segurança", "firewall"], "WAN e Internet": ["WAN", "nuvem"] };
    const FIM = "Dispositivos finais", IOT = "Casa inteligente (IoT)";
    const doCat = (nome) => (S.CATALOGO.find(([n]) => n === nome) || [nome, []])[1];
    const todosItens = () => S.CATALOGO.flatMap(([, it]) => it);
    const CATEG = [
      ["rede", "Equipamentos de rede", "Network Devices", "router", () => S.CATALOGO.filter(([n]) => n !== FIM && n !== IOT).map(([n, it]) => [(CAT_CURTO[n] || [n])[0], it])],
      ["fim", "Dispositivos finais", "End Devices", "pc", () => [["Finais", doCat(FIM).filter(([t]) => t !== "sniffer")], ["Casa inteligente", doCat(IOT)]]],
      ["comp", "Componentes", "Components", "sniffer", () => [["Componentes", todosItens().filter(([t]) => t === "sniffer")]]],
      ["lig", "Ligações", "Connections", null, () => [["Ligações", Object.keys(S.CABOS).map((k) => ["cabo:" + k, "", S.CABOS[k].nome, DESC_CABO[k] || ""])]]],
      ["div", "Diversos", "Miscellaneous", "nuvem", () => [["Diversos", todosItens().filter(([t]) => t === "nuvem").concat([["obj:area", "", "Área (edifício, sala)", "Retângulo com nome: um edifício, um piso ou uma sala."], ["obj:nota", "", "Nota", "Um texto no desenho."]])]]],
    ];
    const DESC_CABO = { auto: "Automático: a app escolhe o cabo e as portas certas (o raio do Packet Tracer).", direto: "Cobre direto: equipamentos diferentes — PC ↔ switch, switch ↔ router, router ↔ hub.", cruzado: "Cobre cruzado: equipamentos iguais — switch ↔ switch, router ↔ router, PC ↔ PC, PC ↔ router.", consola: "Consola: porta RS232 do PC → porta Console do router ou do switch (para configurar pela CLI).", fibra: "Fibra: portas Gigabit de fibra, para longas distâncias (mais de 100 m).", serial: "Série: liga dois routers pelas portas Serial (WAN). O lado DCE dá o relógio (clock rate).", coaxial: "Coaxial: modem de cabo ↔ operador (Internet por cabo).", telefone: "Telefone (RJ11): modem DSL ↔ linha telefónica do operador." };
    let cat = "rede", sub = 0, item = null;
    const icoCabo = (k, C, t) => `<svg viewBox="0 0 48 40" width="${t || 46}" height="${Math.round((t || 46) * 40 / 48)}" aria-hidden="true"><path d="M8 32 Q 24 4 40 32" fill="none" stroke="${k === "auto" ? "#c48a12" : C.cor}" class="sim-ic-cabo" stroke-width="3.5" stroke-linecap="round" ${C.tracejado ? 'stroke-dasharray="6 4"' : k === "consola" ? 'stroke-dasharray="2 4"' : ""}/>${k === "auto" ? '<path d="M27 4l-8 13h6l-3 13 10-16h-6z" fill="#f2a516"/>' : ""}</svg>`;
    const icoItem = (t, tam) => t.startsWith("cabo:") ? icoCabo(t.slice(5), S.CABOS[t.slice(5)], tam) : t === "obj:area" ? `<svg viewBox="0 0 48 40" width="${tam}" height="${Math.round(tam * 40 / 48)}" aria-hidden="true"><rect x="5" y="7" width="38" height="27" rx="5" fill="#2f6fdf22" stroke="#2f6fdf" stroke-width="2.5"/><rect x="5" y="7" width="20" height="9" rx="3" fill="#2f6fdf"/></svg>`
      : t === "obj:nota" ? `<svg viewBox="0 0 48 40" width="${tam}" height="${Math.round(tam * 40 / 48)}" aria-hidden="true"><rect x="9" y="4" width="30" height="32" rx="3" fill="#fde68a" stroke="#c9a227" stroke-width="1.5"/><path d="M14 14h20M14 20h20M14 26h13" stroke="#8a6d10" stroke-width="2"/></svg>` : F.icone(S.TIPOS[t].icone, tam);
    const curtoMod = (n) => n.replace(/^Catalyst /, "").replace(/ \(.*\)$/, "").replace(/^Router /, "");
    function htmlBase() {
      const C = CATEG.find((c) => c[0] === cat) || CATEG[0], subs = C[4](); if (sub >= subs.length) sub = 0;
      const its = subs[sub][1], chave = (x) => x[0] + "|" + x[1];
      const at = its.find((x) => chave(x) === item) || (cat === "lig" && its.find((x) => x[0] === "cabo:" + cabo));
      const nomeAt = at ? at[2] : "";
      return `<div class="sim-tipos"><div class="sim-cats2" role="tablist" aria-label="Tipo de equipamento">${CATEG.map(([k, n, en, ic]) => `<button type="button" role="tab" data-cat="${k}" aria-selected="${k === cat}" data-dica="${esc(n)}" aria-label="${esc(n)}">${ic ? F.icone(ic, 30) : icoCabo("auto", S.CABOS.auto, 32)}</button>`).join("")}</div>
          ${subs.length > 1 ? `<div class="sim-subs" role="group" aria-label="Subcategoria">${subs.map(([n], i) => `<button type="button" data-sub="${i}" aria-pressed="${i === sub}">${esc(n)}</button>`).join("")}</div>` : ""}
          <div class="sim-nome-cat">${esc(subs.length > 1 ? subs[sub][0] : C[1])} <small>${esc(C[2])}</small></div></div>
        <div class="sim-espec"><div class="sim-itens" role="listbox" aria-label="${esc(subs[sub][0])}">${its.map((x) => { const on = at === x && (x[0].startsWith("cabo:") ? modo === "cabo" : x[0].startsWith("obj:") ? modo === x[0].slice(4) : !!colocar); return `<button type="button" role="option" data-item="${esc(chave(x))}" aria-selected="${on}" title="${esc(x[3] || x[2])}">${icoItem(x[0], 46)}<span>${esc(curtoMod(x[2]))}</span></button>`; }).join("")}</div>
          <div class="sim-nome-item">${at ? `<b>${esc(nomeAt)}</b>${!at[0].includes(":") ? ` <button type="button" class="btn-copiar" data-s="addlivre">Adicionar num lugar livre</button>` : ""}` : `<span class="suave">${cat === "lig" ? "Escolha um cabo" : "Escolha um modelo e toque na área de trabalho"}</span>`}</div></div>`;
    }
    function escolherItem(k) {
      const C = CATEG.find((c) => c[0] === cat), x = C[4]()[sub][1].find((y) => y[0] + "|" + y[1] === k); if (!x) return;
      item = k; caboA = null; pduA = null;
      if (vista === "fisica") { vista = "logica"; aplicarVB(); }
      if (x[0].startsWith("cabo:")) { cabo = x[0].slice(5); modo = "cabo"; colocar = null; msg(`Cabo <b>${esc(S.CABOS[cabo].nome)}</b>: toque no primeiro equipamento e escolha a porta.`); }
      else if (x[0].startsWith("obj:")) { colocar = null; modo = x[0].slice(4); msg(modo === "area" ? "<b>Área:</b> arraste no desenho para criar um retângulo (ex.: Edifício A). Um toque cria uma área de tamanho padrão." : "<b>Nota:</b> toque no sítio do desenho onde quer a nota."); }
      else { colocar = { tipo: x[0], modelo: x[1], nome: x[2] }; modo = "colocar"; msg(`<b>${esc(x[2])}</b>: toque no sítio da área de trabalho onde o quer pôr (ou em <b>Adicionar num lugar livre</b>).`); }
      opcoes(); desenhar();
    }
    function por(x, y) {
      if (!colocar) return;
      const d = rede.novoDev(colocar.tipo, lim(x, 5, 95), lim(y, 8, 90), null, { modelo: colocar.modelo || undefined });
      rede.mudou(); colocar = null; item = null; modo = "mover";
      opcoes(); atualizar(); msg(`Adicionado <b>${esc(d.nome)}</b>. Arraste para mover ou toque para configurar.`, "ok");
    }
    function opcoes() {
      const base = $("#sim-base"), sc = base.querySelector(".sim-itens"), x0 = sc ? sc.scrollLeft : 0;
      base.innerHTML = htmlBase();
      const sc2 = base.querySelector(".sim-itens"); if (sc2) sc2.scrollLeft = x0;
      const MODOS = ["mover", "inspecionar", "apagar", "redim", "nota", "area", "pdu"];
      raiz.querySelectorAll(".sim-ferr [data-s], .sim-vista [data-s], .sim-tempo [data-s]").forEach((b) => {
        const k = b.dataset.s;
        if (MODOS.includes(k)) b.setAttribute("aria-pressed", String(modo === k && vista === "logica"));
        if (k === "logica" || k === "fisica") b.setAttribute("aria-pressed", String(vista === k));
        if (k === "real" || k === "sim") b.setAttribute("aria-pressed", String((k === "sim") === sm.aberto));
        if (k === "pduc") b.setAttribute("aria-pressed", String(sm.aberto));
      });
      ["zmais", "zmenos", "ajustar"].forEach((k) => { const b = raiz.querySelector(`.sim-ferr [data-s="${k}"]`); if (b) b.disabled = vista === "fisica"; });
      const dica = $("#sim-dica");
      dica.hidden = !(modo === "cabo" && vista === "logica");
      if (!dica.hidden) dica.innerHTML = `<span aria-hidden="true">💡</span> ${esc(DESC_CABO[cabo] || S.CABOS[cabo].nome)} ${caboA ? "Agora toque no segundo equipamento." : "Toque no primeiro equipamento e escolha a porta."}`;
      svg.style.cursor = vista === "logica" && ["area", "nota", "colocar", "pdu"].includes(modo) ? "crosshair" : modo === "inspecionar" ? "help" : "";
      raiz.querySelector(".sim-amb").dataset.modo = modo;
      botoesHist();
    }
    function lugarLivre() {
      const dx = W < 800 ? 24 : 15, dy = W < 800 ? 17 : 16;
      for (let y = 14; y <= 88; y += dy) for (let x = 12; x <= 90; x += dx) if (!rede.devs.some((d) => Math.abs(d.x - x) < dx - 2 && Math.abs(d.y - y) < dy - 3)) return { x, y };
      return { x: 50, y: 50 };
    }

    // portas que servem para o cabo escolhido
    const tpP = (p) => rede.tipoPorta(p);
    const compatCabo = (p) => tpP(p) === "wifi" ? false : cabo === "consola" ? tpP(p) === "consola" : cabo === "serial" ? tpP(p) === "serial" : cabo === "fibra" ? tpP(p) === "giga" : cabo === "coaxial" ? tpP(p) === "coax" : cabo === "telefone" ? tpP(p) === "rj11" : cabo === "auto" ? true : ["cobre", "giga"].includes(tpP(p));
    const familia = (p) => (["cobre", "giga"].includes(tpP(p)) ? "eth" : tpP(p));
    // escolha automática de uma porta livre (compatível com a porta já escolhida no outro lado)
    function portaAutomatica(d, outro, pOutro) {
      const livres = rede.portas(d).filter((p) => rede.portaLivre(d, p) && compatCabo(p));
      if (pOutro) { const c = livres.filter((p) => familia(p) === familia(pOutro)); const pa = rede.portaAuto(d, outro); return c.includes(pa) ? pa : c[0] || null; }
      if (cabo === "auto" || cabo === "direto" || cabo === "cruzado") { const pa = rede.portaAuto(d, outro); if (pa && compatCabo(pa)) return pa; }
      return livres.find((p) => familia(p) === "eth") || livres[0] || null;
    }
    // Como no Packet Tracer: depois de tocar no equipamento aparece a lista das portas (as ocupadas ficam desativadas)
    function escolherPorta(d, outro, pOutro, depois) {
      const ps = rede.portas(d), md = $("#sim-modal");
      md.hidden = false;
      md.innerHTML = `<div class="sim-caixa"><div class="linha entre"><b>Porta de ${esc(d.nome)}</b><button class="btn-copiar" data-fechar>Cancelar</button></div>
        <p class="peq suave">Cabo ${esc(S.CABOS[cabo].nome.toLowerCase())}${outro ? ` para ${esc(outro.nome)}${pOutro ? " " + esc(curto(pOutro)) : ""}` : ""}. ${outro ? "Escolha a porta de destino." : "Escolha a porta de origem."}</p>
        <div class="sim-portas"><button data-porta="" class="sim-porta-auto"><b>Escolher automaticamente</b><span>a primeira porta livre que sirva</span></button>${ps.map((p) => { const l = rede.linkDe(d, p); const ok = !l && compatCabo(p); const o2 = l ? rede.dev(l.a === d.id ? l.b : l.a) : null;
          return `<button data-porta="${esc(p)}" ${ok ? "" : "disabled"} title="${esc(p)}"><b>${esc(curto(p))}</b><span>${tpP(p) === "wifi" ? (l ? "sem fios: " + esc(o2.nome) : "sem fios (configure o SSID)") : l ? "ligada a " + esc(o2.nome) : compatCabo(p) ? ({ consola: "consola", serial: "série", giga: "Gigabit", coax: "coaxial", rj11: "telefone" }[tpP(p)] || "livre") : "não serve para este cabo"}</span></button>`; }).join("")}</div></div>`;
      md.onclick = (e) => {
        if (e.target.closest("[data-fechar]") || e.target === md) { md.hidden = true; caboA = null; desenhar(); msg("Ligação cancelada."); return; }
        const b = e.target.closest("[data-porta]"); if (!b || b.disabled) return;
        md.hidden = true; depois(b.dataset.porta || null);
      };
    }

    const ipDe = (d) => ((rede.l3(d) || [])[0] || {}).ip || "";
    // Enviar PDU simples (o envelope do Packet Tracer): origem e destino; faz um ping
    function tocarPdu(d) {
      if (!pduA) {
        if (!(d.pc || d.eq)) { msg(`${esc(d.nome)} não envia pacotes: escolha um PC, servidor, router ou switch como origem.`, "erro"); return; }
        if (!ipDe(d)) { msg(`<b>${esc(d.nome)}</b> ainda não tem endereço IP: configure-o primeiro (PC › Configuração IP, ou <code>ip address</code> no router).`, "erro"); return; }
        pduA = d.id; desenhar(); msg(`PDU simples: origem <b>${esc(d.nome)}</b> (${esc(ipDe(d))}). Agora toque no destino.`); return;
      }
      const da = rede.dev(pduA); pduA = null;
      if (!da || da === d) { desenhar(); msg("Escolha um destino diferente da origem."); return; }
      const ip = ipDe(d);
      if (!ip) { desenhar(); msg(`<b>${esc(d.nome)}</b> não tem endereço IP: não pode ser o destino de um ping.`, "erro"); return; }
      if (op.aoComando) op.aoComando("ping " + ip, da);
      if (sm.aberto) { sm.pedido = { de: da.id, tipo: "ping", para: ip }; sm.novo = false; gerarSim(); msg(`PDU simples <b>${esc(da.nome)} → ${esc(d.nome)}</b> (ICMP) criada: avance na Lista de eventos.`); return; }
      let ok, dv;
      if (da.pc) {
        const r = S.promptPC(rede, da, "ping " + ip); ok = r.ok; dv = r.anim;
        const id = da.id + "pc"; if (!logs[id]) logs[id] = [{ t: `Prompt de ${da.nome}. Escreva help para ver os comandos.\n` }];
        logs[id].push({ p: "C:\\>", c: "ping " + ip, t: r.txt, erro: r.ok === false }); if (r.mudou) rede.mudou();
      } else { const r = rede.pingCompleto(da, ip); ok = r.ok; dv = r.devs; }
      atualizar(); animar(dv, ok);
      msg(`PDU simples (ping) <b>${esc(da.nome)} → ${esc(d.nome)}</b> ${esc(ip)}: ${ok ? "<b>Sucesso</b> — a resposta voltou." : "<b>Falhou</b> — veja o caminho em Simulação ou faça <code>tracert</code>."}`, ok ? "ok" : "erro");
    }
    function inspecionar(d) {
      const md = $("#sim-modal"), t = textoRelatorio(d.id); md.hidden = false;
      md.innerHTML = `<div class="sim-caixa sim-rel-caixa"><div class="linha entre"><b>Inspecionar ${esc(d.nome)}</b><button class="btn-copiar" data-fechar>Fechar</button></div>
        <p class="peq suave">Só leitura: interfaces, endereços, VLANs, rotas e running-config.</p><pre class="sim-rel">${esc(t)}</pre>
        <div class="grelha-2"><button class="btn" data-fechar>Fechar</button><button class="btn prim" data-abrir-jan>Abrir a janela do equipamento</button></div></div>`;
      md.onclick = (e) => { if (e.target.closest("[data-fechar]") || e.target === md) { md.hidden = true; return; } if (e.target.closest("[data-abrir-jan]")) { md.hidden = true; abrirInsp(d); } };
    }
    function tocarDev(d) {
      if (vista === "fisica") return abrirInsp(d);
      if (modo === "pdu") return tocarPdu(d);
      if (modo === "inspecionar") return inspecionar(d);
      if (modo === "apagar") { rede.apagarDev(d); if (sel === d.id) fecharInsp(); msg(`${esc(d.nome)} apagado.`); atualizar(); return; }
      if (modo === "cabo") {
        if (!caboA) {
          escolherPorta(d, null, null, (p) => { caboA = { d: d.id, p }; opcoes(); msg(`Origem: <b>${esc(d.nome)} ${p ? esc(curto(p)) : "(porta automática)"}</b>. Toque no equipamento de destino.`); desenhar(); });
          return;
        }
        const da = rede.dev(caboA.d);
        if (!da || da === d) { caboA = null; msg("Escolha um equipamento diferente."); desenhar(); return; }
        const fim = (pa, pb) => {
          const l = rede.ligar(da, pa, d, pb, cabo);
          caboA = null;
          if (ehSwitch(da) || ehSwitch(d)) { negoc.set(l.id, Date.now() + 4000); setTimeout(() => { if (raiz.isConnected) desenhar(); }, 4100); }
          const e = rede.estadoLink(l);
          msg(e.estado === "errado" ? `<b>Luz vermelha:</b> cabo ${esc(S.CABOS[l.cabo].nome.toLowerCase())} entre ${esc(da.nome)} ${esc(curto(pa))} e ${esc(d.nome)} ${esc(curto(pb))} não funciona. Aqui o cabo certo é <b>${esc(e.certo)}</b>.` :
            e.estado === "baixo" ? `Ligado ${esc(da.nome)} ${esc(curto(pa))} ↔ ${esc(d.nome)} ${esc(curto(pb))}. <b>Luz laranja/vermelha</b>: ${da.desligado || d.desligado ? "um dos equipamentos está desligado." : "falta <code>no shutdown</code> na interface do router (ou Porta ligada em Configuração)."}` :
              `Ligado ${esc(da.nome)} ${esc(curto(pa))} ↔ ${esc(d.nome)} ${esc(curto(pb))} com cabo ${esc(S.CABOS[l.cabo].nome.toLowerCase())}.`, e.estado === "errado" ? "erro" : "ok");
          opcoes(); atualizar();
        };
        escolherPorta(d, da, caboA.p, (pb) => {
          let pa = caboA && caboA.p;
          if (!pa && !pb) { pa = portaAutomatica(da, d, null); pb = pa ? portaAutomatica(d, da, cabo === "auto" ? null : pa) : null; if (pa && pb && cabo === "auto" && familia(pa) !== familia(pb)) pb = portaAutomatica(d, da, pa); }
          else if (!pa) pa = portaAutomatica(da, d, pb);
          else if (!pb) pb = portaAutomatica(d, da, pa);
          if (!pa || !pb) { caboA = null; msg(`Não há portas livres compatíveis em ${esc(!pa ? da.nome : d.nome)} para este cabo.`, "erro"); desenhar(); return; }
          fim(pa, pb);
        });
        return;
      }
      abrirInsp(d);
    }
    function tocarLink(l, lado) {
      const da = rede.dev(l.a), db = rede.dev(l.b), e = rede.estadoLink(l);
      if (modo === "apagar") { rede.apagarLink(l); msg("Cabo removido."); atualizar(); return; }
      if (lado && l.cabo !== "consola") { const [t, c] = motivoLuz(l, lado); msg(t, c); return; }
      msg(`Cabo ${esc(S.CABOS[l.cabo].nome.toLowerCase())}: ${esc(da.nome)} ${esc(curto(l.pa))} ↔ ${esc(db.nome)} ${esc(curto(l.pb))}. ` +
        (e.estado === "errado" ? `<b>Errado</b> — use ${esc(e.certo)}. Apague-o e volte a ligar.` : e.estado === "baixo" ? "Uma das portas está desligada (shutdown)." : e.estado === "consola" ? "Ligação de consola para configurar." : "<b>A funcionar.</b>"), e.estado === "errado" ? "erro" : "");
    }

    // ------------------------------------------------------------ zoom e deslocação (muda o viewBox; as posições ficam em % de W×H)
    function aplicarVB() { if (vista === "logica") svg.setAttribute("viewBox", `${vb.x} ${vb.y} ${vb.w} ${vb.h}`); }
    const pSvg = (cx, cy) => { const pt = svg.createSVGPoint(); pt.x = cx; pt.y = cy; return pt.matrixTransform(svg.getScreenCTM().inverse()); };
    const lim = (v, a, b) => Math.max(a, Math.min(b, v));
    function limitarVB() { vb.x = lim(vb.x, -vb.w / 2, W - vb.w / 2); vb.y = lim(vb.y, -vb.h / 2, H - vb.h / 2); }
    function zoomEm(f, cx, cy) {
      const p = cx == null ? { x: vb.x + vb.w / 2, y: vb.y + vb.h / 2 } : pSvg(cx, cy);
      const nw = lim(vb.w * f, W / 5, W * 2), k = nw / vb.w;
      vb.x = p.x - (p.x - vb.x) * k; vb.y = p.y - (p.y - vb.y) * k; vb.w = nw; vb.h = nw * H / W;
      limitarVB(); aplicarVB();
    }
    // retângulo com tudo o que está desenhado (equipamentos, áreas e notas), em unidades do desenho
    function limites() {
      const xs = [], ys = [];
      rede.devs.forEach((d) => { const p = pos(d); xs.push(p.x - 46, p.x + 46); ys.push(p.y - 44, p.y + 90); });
      rede.areas.forEach((a) => { xs.push(a.x / 100 * W, (a.x + a.w) / 100 * W); ys.push(a.y / 100 * H, (a.y + a.h) / 100 * H); });
      rede.notas.forEach((n) => { xs.push(n.x / 100 * W, (n.x + n.w) / 100 * W); ys.push(n.y / 100 * H, n.y / 100 * H + 20 + linhasNota(n).length * 21); });
      if (!xs.length) return null;
      const x = Math.min(...xs), y = Math.min(...ys);
      return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
    }
    function ajustar() {
      const b = limites();
      if (!b) Object.assign(vb, { x: 0, y: 0, w: W, h: H });
      else {
        let w = Math.max(b.w + 60, W / 3), h = Math.max(b.h + 60, H / 3);
        if (w / h > W / H) h = w * H / W; else w = h * W / H;
        Object.assign(vb, { x: b.x + b.w / 2 - w / 2, y: b.y + b.h / 2 - h / 2, w, h });
      }
      aplicarVB();
    }

    // ------------------------------------------------------------ arrastar, tocar, pinça
    const toques = new Map();
    let arr = null;
    const ponto = (ev) => { const p = pSvg(ev.clientX, ev.clientY); return { x: p.x / W * 100, y: p.y / H * 100 }; };
    const dentro = (a, o) => o !== a && o.x >= a.x && o.x <= a.x + a.w && o.y >= a.y && o.y <= a.y + a.h;
    const tirarRasc = () => { const r = svg.querySelector("#sim-rasc"); if (r) r.remove(); };
    svg.addEventListener("pointerdown", (ev) => {
      toques.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      if (toques.size === 2 && vista === "logica") { // dois dedos: zoom
        const [p, q] = [...toques.values()]; tirarRasc();
        if (arr && arr.moveu && arr.tipo !== "pan") rede.aoMudar();
        arr = { tipo: "pinca", dist: Math.hypot(p.x - q.x, p.y - q.y), mx: (p.x + q.x) / 2, my: (p.y + q.y) / 2 }; return;
      }
      if (toques.size > 1) return;
      const t = ev.target, base = { x0: ev.clientX, y0: ev.clientY, p0: ponto(ev), moveu: false, alvo: t };
      const prender = () => { try { svg.setPointerCapture(ev.pointerId); } catch (e) { /* sem captura */ } };
      if (vista === "fisica") { arr = Object.assign(base, { tipo: "toque" }); return; }
      if (modo === "area" || modo === "nota") { arr = Object.assign(base, { tipo: modo === "area" ? "desenho" : "toque" }); prender(); return; }
      if (modo === "colocar") { arr = Object.assign(base, { tipo: "pan", vb0: Object.assign({}, vb), colocar: true }); prender(); return; }
      const g = t.closest("[data-dev]");
      if (g) { arr = Object.assign(base, { tipo: "dev", d: rede.dev(g.dataset.dev) }); if (modo === "mover") prender(); return; }
      const ga = t.closest("[data-area]"), gn = t.closest("[data-nota]");
      if ((ga && (t.closest(".sim-pega, [data-redim]") || modo === "redim")) || gn) {
        const o = ga ? rede.areas.find((a) => a.id === ga.dataset.area) : rede.notas.find((n) => n.id === gn.dataset.nota), redim = modo === "redim" || !!t.closest("[data-redim]");
        // ao mover uma área, leva também o que está lá dentro
        const leva = ga && !redim ? [].concat(rede.devs, rede.notas, rede.areas).filter((x) => dentro(o, x)).map((x) => [x, x.x, x.y]) : [];
        arr = Object.assign(base, { tipo: ga ? "area" : "nota", o, redim, orig: Object.assign({}, o), leva });
        if (modo === "mover" || modo === "redim") prender(); return;
      }
      arr = Object.assign(base, { tipo: "pan", vb0: Object.assign({}, vb) }); prender();
    });
    const coordEl = $("#sim-coord");
    svg.addEventListener("pointermove", (ev) => {
      if (vista === "logica" && coordEl) { const q = pSvg(ev.clientX, ev.clientY); coordEl.textContent = `x: ${Math.round(q.x)}, y: ${Math.round(q.y)}`; }
      if (toques.has(ev.pointerId)) toques.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      if (!arr) return;
      if (arr.tipo === "pinca") {
        if (toques.size < 2) return;
        const [p, q] = [...toques.values()], dist = Math.hypot(p.x - q.x, p.y - q.y), mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2, u = vb.w / svg.clientWidth;
        vb.x -= (mx - arr.mx) * u; vb.y -= (my - arr.my) * u; aplicarVB();
        zoomEm(arr.dist / Math.max(dist, 1), mx, my);
        Object.assign(arr, { dist, mx, my }); return;
      }
      if (!arr.moveu && Math.abs(ev.clientX - arr.x0) + Math.abs(ev.clientY - arr.y0) > 6) arr.moveu = true;
      if (!arr.moveu) return;
      if (arr.tipo === "pan") { const u = arr.vb0.w / svg.clientWidth; vb.x = arr.vb0.x - (ev.clientX - arr.x0) * u; vb.y = arr.vb0.y - (ev.clientY - arr.y0) * u; limitarVB(); aplicarVB(); return; }
      const p = ponto(ev), dx = p.x - arr.p0.x, dy = p.y - arr.p0.y;
      if (arr.tipo === "desenho") {
        let r = svg.querySelector("#sim-rasc");
        if (!r) { r = document.createElementNS("http://www.w3.org/2000/svg", "rect"); r.id = "sim-rasc"; r.setAttribute("class", "sim-rasc"); r.setAttribute("rx", "14"); svg.appendChild(r); }
        const x = lim(Math.min(p.x, arr.p0.x), 0, 100), y = lim(Math.min(p.y, arr.p0.y), 0, 100);
        r.setAttribute("x", x / 100 * W); r.setAttribute("y", y / 100 * H); r.setAttribute("width", (lim(Math.max(p.x, arr.p0.x), 0, 100) - x) / 100 * W); r.setAttribute("height", (lim(Math.max(p.y, arr.p0.y), 0, 100) - y) / 100 * H);
        return;
      }
      if ((modo !== "mover" && modo !== "redim") || arr.tipo === "toque") return;
      if (arr.tipo === "dev" && modo !== "mover") return;
      if (arr.tipo === "dev") { arr.d.x = lim(p.x, 5, 95); arr.d.y = lim(p.y, 8, 90); desenhar(); return; }
      const o = arr.o, g = arr.orig;
      if (arr.redim) { o.w = lim(g.w + dx, arr.tipo === "nota" ? 12 : 8, 100 - g.x); if (arr.tipo === "area") o.h = lim(g.h + dy, 8, 100 - g.y); }
      else {
        const mx = lim(dx, -g.x, 100 - g.x - g.w), my = lim(dy, -g.y, 100 - g.y - (g.h || 4));
        o.x = g.x + mx; o.y = g.y + my; arr.leva.forEach(([x, x0, y0]) => { x.x = x0 + mx; x.y = y0 + my; });
      }
      desenhar();
    });
    const fimToque = (ev) => {
      toques.delete(ev.pointerId);
      const a = arr; if (!a) return;
      if (a.tipo === "pinca") { if (toques.size < 2) arr = null; return; }
      arr = null;
      if (ev.type === "pointercancel") { tirarRasc(); if (a.moveu && a.tipo !== "pan") rede.aoMudar(); return; }
      if (a.tipo === "toque") {
        if (a.moveu) return;
        if (vista === "fisica") { const g = a.alvo.closest("[data-dev]"); if (g) abrirInsp(rede.dev(g.dataset.dev)); return; }
        const n = { id: novoId("n"), texto: "", x: lim(a.p0.x, 0, 84), y: lim(a.p0.y, 0, 92), w: lim(220 / W * 100, 12, 60), cor: corNota || CORES_NOTA[0][0] };
        return editarObj("nota", n, true);
      }
      if (a.tipo === "desenho") {
        const r = svg.querySelector("#sim-rasc"), p = r ? { x: +r.getAttribute("x") / W * 100, y: +r.getAttribute("y") / H * 100, w: +r.getAttribute("width") / W * 100, h: +r.getAttribute("height") / H * 100 } : null;
        // um toque sem arrastar cria uma área de tamanho padrão
        const b = p && p.w >= 4 && p.h >= 4 ? p : { w: 40, h: 34, x: lim(a.p0.x - 20, 0, 60), y: lim(a.p0.y - 17, 0, 66) };
        const k = rede.areas.length;
        return editarObj("area", Object.assign({ id: novoId("a"), nome: "Edifício " + String.fromCharCode(65 + (k % 26)), cor: corArea || CORES_AREA[k % CORES_AREA.length][0] }, b), true);
      }
      if (a.tipo === "dev") { if (a.moveu) rede.aoMudar(); else tocarDev(a.d); return; }
      if (a.tipo === "area" || a.tipo === "nota") { if (a.moveu) { rede.aoMudar(); return; } if (modo === "apagar") apagarObj(a.tipo, a.o); else editarObj(a.tipo, a.o); return; }
      if (a.colocar && !a.moveu) { por(a.p0.x, a.p0.y); return; }
      if (!a.moveu) { const lg = a.alvo.closest("[data-link]"), lz = a.alvo.closest("[data-luz]"); if (lg) tocarLink(rede.links.find((l) => l.id === lg.dataset.link), lz ? lz.dataset.luz : null); else if (modo === "pdu" && pduA) { pduA = null; desenhar(); msg("PDU cancelada. Toque na origem."); } }
    };
    svg.addEventListener("pointerup", fimToque);
    svg.addEventListener("pointercancel", fimToque);
    svg.addEventListener("wheel", (ev) => { if (vista !== "logica") return; ev.preventDefault(); zoomEm(Math.exp(ev.deltaY * (ev.deltaMode ? 0.05 : 0.0015)), ev.clientX, ev.clientY); }, { passive: false });

    // ------------------------------------------------------------ áreas e notas
    const CORES_AREA = [["#2f6fdf", "Azul"], ["#1b8d4c", "Verde"], ["#e08a12", "Laranja"], ["#8b5cf6", "Roxo"], ["#d33a3a", "Vermelho"], ["#64748b", "Cinzento"]];
    const CORES_NOTA = [["#fde68a", "Amarelo"], ["#bfdbfe", "Azul"], ["#bbf7d0", "Verde"], ["#fecdd3", "Rosa"], ["#e5e7eb", "Cinzento"]];
    const novoId = (p) => p + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
    function editarObj(tipo, o, nova) {
      const area = tipo === "area", cores = area ? CORES_AREA : CORES_NOTA, md = $("#sim-modal");
      md.hidden = false;
      md.innerHTML = `<form class="sim-caixa sim-form" data-f="obj"><div class="linha entre"><b>${nova ? (area ? "Nova área" : "Nova nota") : area ? "Editar área" : "Editar nota"}</b><button type="button" class="btn-copiar" data-fechar>Cancelar</button></div>
        ${area ? `<p class="peq suave">Um edifício, um piso ou uma sala. Os equipamentos dentro da área vão com ela quando a arrasta pelo nome; na vista física aparecem nesse local.</p>
          <label>Nome<input class="campo" name="t" value="${esc(o.nome)}" maxlength="40" list="sim-sug" autocomplete="off"></label><datalist id="sim-sug">${["Edifício A", "Edifício B", "Sala de servidores", "Sala de aula", "Receção", "Escritório", "Armazém", "Filial"].map((x) => `<option value="${x}">`).join("")}</datalist>`
          : `<label>Texto<textarea class="campo" name="t" rows="4" maxlength="400" placeholder="Ex.: VLAN 10 = Vendas, gateway 192.168.10.1">${esc(o.texto)}</textarea></label>`}
        <div class="sim-cores" role="radiogroup" aria-label="Cor">${cores.map(([c, n]) => `<label title="${n}"><input type="radio" name="cor" value="${c}" aria-label="${n}" ${o.cor === c ? "checked" : ""}><i style="background:${c}"></i></label>`).join("")}</div>
        <div class="grelha-2"><button type="button" class="btn" ${nova ? "data-fechar>Cancelar" : "data-apagar-obj>Apagar"}</button><button class="btn prim" type="submit">${nova ? "Criar" : "Guardar"}</button></div><p class="peq" data-erro></p></form>`;
      const f = md.querySelector("form"), campo = f.elements.t;
      setTimeout(() => { campo.focus({ preventScroll: true }); if (area) campo.select(); }, 30);
      md.onclick = (e) => {
        if (e.target.closest("[data-fechar]") || e.target === md) { md.hidden = true; desenhar(); return; }
        if (e.target.closest("[data-apagar-obj]")) { md.hidden = true; apagarObj(tipo, o); }
      };
      f.onsubmit = (e) => {
        e.preventDefault();
        const t = campo.value.trim();
        if (!t) { f.querySelector("[data-erro]").textContent = area ? "Escreva um nome (ex.: Edifício A)." : "Escreva o texto da nota."; return; }
        if (area) o.nome = t; else o.texto = t;
        o.cor = (f.elements.cor.value || o.cor);
        if (nova) (area ? rede.areas : rede.notas).push(o);
        md.hidden = true; if (nova) modo = "mover";
        opcoes(); rede.mudou(); atualizar();
        msg(nova ? (area ? `Área <b>${esc(o.nome)}</b> criada. Arraste-a pelo nome; o canto puxa para mudar o tamanho.` : "Nota criada. Arraste-a para mover; toque para editar.") : "Alteração guardada.", "ok");
      };
    }
    function apagarObj(tipo, o) {
      if (tipo === "area") rede.areas = rede.areas.filter((x) => x !== o); else rede.notas = rede.notas.filter((x) => x !== o);
      rede.mudou(); atualizar(); msg(tipo === "area" ? `Área ${esc(o.nome)} apagada (os equipamentos ficam).` : "Nota apagada.");
    }

    // ------------------------------------------------------------ janela do equipamento (como no Packet Tracer)
    // Separadores: Físico, Configuração (Config), CLI, Serviços (Services), Ambiente de trabalho (Desktop).
    // Na Configuração dos routers e switches cada alteração é feita com os comandos IOS equivalentes.
    const secCfg = {}, secSrv = {}, appDesk = {}, syncDN = {}, iosLog = {}, webEst = {}, dnsSel = {};
    // Nas atividades guiadas as verificações procuram os equipamentos pelo nome: o nome no desenho
    // não muda sozinho quando se muda o hostname (só se o aluno mudar o "Nome a mostrar").
    const sincroniza = op.sincronizarNome != null ? !!op.sincronizarNome : (!A && !op.aoComando);
    const trab = () => $("#sim-trab");
    function layoutDir() { trab().classList.toggle("com-dir", !$("#sim-insp").hidden || !$("#sim-simul").hidden); raiz.querySelector(".sim-amb").classList.toggle("com-jan", !$("#sim-insp").hidden); }
    function fecharInsp() { sel = null; const i = $("#sim-insp"); i.hidden = true; i.innerHTML = ""; layoutDir(); desenhar(); }

    // --- protocolos do curso (window.CCNA.protocolos): uma linha de explicação + "Saber mais"
    let protCache = null;
    const prot = (id) => { if (!protCache) { protCache = {}; ((window.CCNA && window.CCNA.protocolos) || []).forEach((p) => { protCache[p.id] = p; }); } return protCache[id]; };
    const frase1 = (t) => { const s = String(t || "").trim(), m = s.match(/^.{20,}?[.!?](?=\s|$)/); return m ? m[0] : s; };
    const PROT_CURTO = {
      arp: "ARP descobre o endereço MAC que corresponde a um IP da mesma rede (pergunta em difusão, resposta direta).",
      icmp: "ICMP leva as mensagens de controlo e de erro do IP: o ping usa Echo Request e Echo Reply.",
      dhcpv4: "DHCP dá automaticamente IP, máscara, gateway e DNS aos equipamentos (Discover, Offer, Request, Ack).",
      dns: "DNS traduz nomes (www.exemplo.com) em endereços IP. Usa a porta UDP 53.",
      http: "HTTP é o protocolo das páginas web: o navegador pede (GET) e o servidor responde. Porta TCP 80.",
      https: "HTTPS é HTTP cifrado com TLS. Porta TCP 443.",
      tcp: "TCP entrega os dados com fiabilidade: abre a ligação (SYN, SYN-ACK, ACK), numera e confirma.",
      udp: "UDP envia sem abrir ligação nem confirmar: é rápido e simples (DNS, DHCP, TFTP, voz).",
      ethernet: "Ethernet é a camada 2 das redes com fios: tramas com MAC de origem e de destino.",
      ieee8021q: "802.1Q põe uma etiqueta (tag) com o número da VLAN nas tramas que passam num trunk.",
      stp: "STP evita loops entre switches: bloqueia as ligações redundantes e reativa-as se uma falhar.",
      telnet: "Telnet dá acesso remoto à linha de comandos, mas tudo vai em texto simples. Porta TCP 23.",
      ssh: "SSH dá acesso remoto à linha de comandos com tudo cifrado. Porta TCP 22.",
      smb: "SMB partilha pastas e impressoras na rede (Windows). Porta TCP 445.",
      tftp: "TFTP copia ficheiros sem autenticação (imagens do IOS, configurações). Porta UDP 69.",
      ftp: "FTP transfere ficheiros com utilizador e palavra-passe. Portas TCP 20 e 21.",
      ntp: "NTP acerta o relógio dos equipamentos a partir de um servidor de tempo. Porta UDP 123.",
      syslog: "Syslog envia as mensagens de registo dos equipamentos para um servidor central. Porta UDP 514.",
      radius: "RADIUS centraliza a autenticação (AAA): o equipamento pergunta ao servidor se o utilizador pode entrar.",
      tacacs: "TACACS+ é o protocolo AAA da Cisco para autenticar quem administra os equipamentos.",
      smtp: "SMTP envia correio eletrónico entre clientes e servidores. Porta TCP 25.",
      pop3: "POP3 descarrega o correio do servidor para o cliente. Porta TCP 110.",
      rip: "RIP é um protocolo de encaminhamento dinâmico por vetor de distância (conta saltos, máximo 15).",
      ospf: "OSPF é um protocolo de encaminhamento por estado de ligação: cada router conhece o mapa da área.",
      dhcpv6: "DHCPv6 atribui endereços IPv6 e outros parâmetros (com estado ou sem estado).",
      dot1x: "802.1X/EAP autentica cada utilizador ou equipamento antes de abrir a porta ou o Wi-Fi.",
      ipv4: "IPv4 é o endereço de camada 3 (32 bits) que permite chegar a outras redes através de routers.",
    };
    const resumoProt = (id) => { const p = prot(id); return p ? frase1(p.para_que) : PROT_CURTO[id] || ""; };
    const siglaProt = (id) => { const p = prot(id); return p ? p.sigla : id.toUpperCase(); };
    function linhaProt(ids, txt) {
      ids = [].concat(ids || []).filter((id) => prot(id) || PROT_CURTO[id]);
      if (!ids.length && !txt) return "";
      return `<p class="sim-prot-linha"><span class="sim-prot-i" aria-hidden="true">i</span><span>${esc(txt || resumoProt(ids[0]))}</span>${ids.filter(prot).map((id) => `<button type="button" class="sim-saber" data-prot="${esc(id)}">Saber mais: ${esc(siglaProt(id))}</button>`).join("")}</p>`;
    }
    function irProtocolo(id) {
      if (!prot(id)) return;
      const b = document.createElement("button"); b.hidden = true; b.dataset.acao = "protocolo"; b.dataset.id = id;
      document.body.appendChild(b); b.click(); b.remove();
    }

    // --- máscara por defeito (classe do endereço), como no Packet Tracer
    const mascaraClasse = (ip) => { if (!S.ehIP(String(ip || "").trim())) return ""; const o = +String(ip).trim().split(".")[0]; return o >= 1 && o <= 126 ? "255.0.0.0" : o >= 128 && o <= 191 ? "255.255.0.0" : o >= 192 && o <= 223 ? "255.255.255.0" : ""; };
    function ligarMascara(ipEl, mEl) {
      if (!ipEl || !mEl) return;
      let auto = mEl.value && mEl.value === mascaraClasse(ipEl.value) ? mEl.value : null;
      const f = () => { const m = mascaraClasse(ipEl.value); if (m && (!mEl.value.trim() || mEl.value === auto)) { mEl.value = m; auto = m; } };
      ipEl.addEventListener("input", f); ipEl.addEventListener("blur", f);
    }
    const ligarMascaras = (raizF) => raizF.querySelectorAll("[data-masc]").forEach((m) => ligarMascara(raizF.querySelector(`[name="${m.dataset.masc}"]`), m));

    // --- comandos IOS equivalentes (o separador Config escreve os comandos, como o Packet Tracer)
    function logTerm(d) { const id = d.id + "ios"; if (!logs[id]) logs[id] = [{ t: `${d.eq.cfg.hostname} — consola. Escreva ? para ver os comandos.\n` }]; return logs[id]; }
    const ehErroIOS = (t) => /% ?(Invalid|Incomplete|Unrecognized|Ambiguous|Bad|Inconsistent)|^Bad mask|Command rejected/m.test(t || "");
    function iosAplicar(d, cmds) {
      const eq = d.eq; if (!eq) return [];
      const antes = { modo: eq.modo, ctx: eq.ctx }, h0 = eq.cfg.hostname, L = iosLog[d.id] = iosLog[d.id] || [], T = logTerm(d), erros = [];
      eq.modo = "config"; eq.ctx = null;
      cmds.forEach((c) => {
        const p = eq.prompt(); let r;
        try { r = eq.executar(c); } catch (e) { r = "% Erro: " + e.message; }
        const erro = ehErroIOS(r); if (erro) erros.push(c + ": " + String(r).trim().split("\n").pop());
        L.push({ p, c, t: r || "", erro }); T.push({ p, c, t: r || "", erro, cfg: true });
      });
      eq.modo = antes.modo; eq.ctx = antes.ctx;
      if (L.length > 120) L.splice(0, L.length - 120);
      aposHostname(d, h0);
      rede.mudou(); atualizar();
      if (erros.length) msg("<b>O IOS recusou:</b> " + esc(erros.join(" · ")), "erro");
      return erros;
    }
    function caixaEq(d) {
      const L = (iosLog[d.id] || []).slice(-30);
      return `<details class="sim-ios-eq" ${L.length ? "open" : ""}><summary>Comandos IOS equivalentes <small>Equivalent IOS Commands</small></summary>
        <pre class="sim-ios-eq-txt">${L.length ? L.map((l) => `<span class="pr">${esc(l.p)}</span>${esc(l.c)}${l.t ? `\n<span class="${l.erro ? "err" : "out"}">${esc(String(l.t).replace(/\n+$/, ""))}</span>` : ""}`).join("\n") : '<span class="out">Cada alteração feita aqui aparece como o comando que a CLI usaria.</span>'}</pre></details>`;
    }
    // hostname mudou (CLI, Config ou colar configuração): atualiza o nome no desenho
    function aposHostname(d, h0) {
      if (!d.eq) return;
      const h = d.eq.cfg.hostname; if (h === h0 || h === d.nome) return;
      if (!sincroniza) { msg(`Hostname de <b>${esc(d.nome)}</b> mudou para <b>${esc(h)}</b>. Nesta atividade o nome no desenho mantém-se (as verificações usam-no); o hostname aparece por baixo. Para mudar o nome mostrado use Configuração › Definições.`); return; }
      if (rede.devs.some((x) => x !== d && x.nome === h)) { msg(`Hostname <b>${esc(h)}</b> aplicado, mas já existe outro equipamento chamado “${esc(h)}” no desenho: o nome mostrado continua “${esc(d.nome)}” e o hostname aparece por baixo.`, "erro"); return; }
      const velho = d.nome; d.nome = h;
      msg(`Hostname <b>${esc(h)}</b>: o nome no desenho passou de “${esc(velho)}” para “${esc(h)}”.`, "ok");
    }
    function mudarNome(d, v, sync) {
      v = String(v || "").trim();
      if (!v) return "Escreva um nome.";
      if (v === d.nome) return "";
      if (rede.devs.some((x) => x !== d && x.nome.toLowerCase() === v.toLowerCase())) return `Já existe um equipamento chamado “${v}”.`;
      d.nome = v;
      if (d.eq && sync) { if (/^[A-Za-z][\w-]{0,62}$/.test(v)) { if (v !== d.eq.cfg.hostname) iosAplicar(d, ["hostname " + v]); } else { rede.mudou(); atualizar(); return "Nome mudado. O hostname não mudou: no IOS só pode ter letras, números, - e _ (sem espaços) e começar por uma letra."; } }
      else { rede.mudou(); atualizar(); }
      return "";
    }

    // --- abrir a janela
    const TABS = { fisico: ["Físico", "Physical"], config: ["Configuração", "Config"], cli: ["CLI", "CLI"], servicos: ["Serviços", "Services"], desktop: ["Ambiente de trabalho", "Desktop"], captura: ["Captura", "GUI"] };
    function abasDe(d) {
      const T = S.TIPOS[d.tipo], a = ["fisico", "config"];
      if (d.eq) a.push("cli");
      else if (T.semIp) a.push("captura");
      if (d.srv) a.push("servicos");
      if (T.fim && !T.semIp && !T.iot && d.tipo !== "wlc") a.push("desktop");
      return a;
    }
    const abaInicial = (d, abas) => (d.eq ? "cli" : d.srv ? "servicos" : abas.includes("desktop") ? "desktop" : "config");
    const DESC = Object.fromEntries(S.CATALOGO.flatMap(([, it]) => it.map(([t, m, n, desc]) => [t + "|" + m, { n, desc }])));
    const descDe = (d) => DESC[d.tipo + "|" + (d.modelo || "")] || DESC[d.tipo + "|"] || { n: S.TIPOS[d.tipo].nome, desc: "" };
    function abrirInsp(d, abaPedida, semScroll) {
      if (sel !== d.id) aba = null;
      sel = d.id; desenhar();
      const T = S.TIPOS[d.tipo], abas = abasDe(d);
      const LEG = { ip: ["desktop", "ip"], prompt: ["desktop", "prompt"], wifi: ["desktop", "wifi"], partilhas: ["desktop", "partilhas"], portas: ["fisico"], info: ["fisico"] };
      if (abaPedida && !abas.includes(abaPedida) && LEG[abaPedida]) { if (LEG[abaPedida][1]) appDesk[d.id] = LEG[abaPedida][1]; abaPedida = LEG[abaPedida][0]; }
      aba = abaPedida && abas.includes(abaPedida) ? abaPedida : abas.includes(aba) ? aba : abaInicial(d, abas);
      const insp = $("#sim-insp");
      insp.hidden = false; layoutDir();
      const host = d.eq && d.eq.cfg.hostname !== d.nome && d.eq.cfg.hostname !== T.host ? ` <span class="sim-jan-host">hostname ${esc(d.eq.cfg.hostname)}</span>` : "";
      insp.innerHTML = `<div class="sim-jan-tit"><span class="sim-jan-ic">${F.icone(T.icone, 28)}</span><div class="sim-jan-nome"><b>${esc(d.nome)}</b>${host}<span class="suave peq">${esc(descDe(d).n)}</span></div>
          <span class="linha sim-insp-acoes"><button class="btn-copiar" data-duplicar title="Duplicar (Ctrl+C, Ctrl+V)">Duplicar</button><button class="sim-jan-x" data-fechar-insp aria-label="Fechar" title="Fechar">×</button></span></div>
        <div class="sim-jan-abas" role="tablist">${abas.map((k) => `<button role="tab" aria-selected="${aba === k}" data-aba="${k}">${TABS[k][0]}<small>${TABS[k][1]}</small></button>`).join("")}</div>
        ${d.desligado && aba !== "fisico" ? '<p class="sim-desligado">Este equipamento está <b>desligado</b>. Ligue-o no separador Físico.</p>' : ""}
        <div class="sim-jan-corpo" id="sim-insp-corpo"></div>`;
      const corpo = $("#sim-insp-corpo");
      if (aba === "fisico") fisico(corpo, d);
      else if (aba === "config") (d.eq ? configIOS : T.fim ? configHost : configOutro)(corpo, d);
      else if (aba === "cli") { if (d.desligado) corpo.innerHTML = '<div class="consola sim-consola sim-consola-off"></div>'; else terminal(corpo, d, "ios"); }
      else if (aba === "servicos") servicos(corpo, d);
      else if (aba === "desktop") desktop(corpo, d);
      else if (aba === "captura") captura(corpo, d);
      insp.onclick = (e) => {
        if (e.target.closest("[data-fechar-insp]")) return fecharInsp();
        if (e.target.closest("[data-duplicar]")) { copiar(d); return colar(); }
        const b = e.target.closest("[data-aba]"); if (b) { aba = b.dataset.aba; abrirInsp(d, aba, true); }
      };
      if (!semScroll && getComputedStyle(insp).position !== "fixed") insp.scrollIntoView({ block: "nearest", behavior: reduzido() ? "auto" : "smooth" });
    }
    // volta a pintar a janela sem a deslocar e mantendo o foco no mesmo campo
    function repintar(d) {
      const a = document.activeElement, nome = a && a.name, pane = $("#sim-insp .sim-cfg-pane"), sc = pane ? pane.scrollTop : 0;
      abrirInsp(d, aba, true);
      const p2 = $("#sim-insp .sim-cfg-pane"); if (p2) p2.scrollTop = sc;
      if (nome) { const el = $("#sim-insp").querySelector(`[name="${nome}"]`); if (el && el.type !== "radio" && el.type !== "checkbox") el.focus({ preventScroll: true }); }
    }
    const depois = (d) => setTimeout(() => { if (sel === d.id && rede.dev(d.id) === d) repintar(d); }, 0);

    function estadoPorta(d, p) {
      const l = rede.linkDe(d, p), i = d.eq ? (d.eq.cfg.interfaces[p] || {}) : {};
      if (!l) return "sem cabo";
      if (l.cabo === "wifi") return "ativa";
      const e = rede.estadoLink(l);
      return e.estado === "errado" ? "cabo errado" : l.cabo === "consola" ? "consola" : d.desligado ? "sem energia" : i.shutdown ? "desligada" : e.estado === "ok" ? "ativa" : "em baixo";
    }
    function cfgPorta(d, p) {
      if (!d.eq) return "";
      const i = d.eq.cfg.interfaces[p] || {};
      return d.eq.tipo === "switch" && p !== "Console" && !/^(Vlan|Loopback)/.test(p) ? (i.routed ? (i.ip ? i.ip : "roteada") : i.mode === "trunk" ? "trunk" : "VLAN " + (i.accessVlan || 1)) : (i.ip && i.ip !== "dhcp" ? i.ip + "/" + window.IOS.prefixo(i.mask) : i.ip === "dhcp" ? "DHCP" : "");
    }

    // ------------------------------------------------------------ separador Físico
    function extraInfo(d) {
      let extra = "";
      if (d.tipo === "router_wifi") { const w = rede.wanRW(d); extra = `<p class="peq">Internet: <b>${esc(w.ip || "sem endereço")}</b>${w.gw ? ", gateway " + esc(w.gw) : ""}${w.dns ? ", DNS " + esc(w.dns) : ""}. LAN: <b>${esc(d.rw.lan.ip)}</b>. Clientes Wi-Fi: ${rede.wifi().links.filter((l) => l.b === d.id).length}.</p>`; }
      if (d.tipo === "asa") extra = `<ul class="sim-dns">${Object.entries(d.asa.ifs).filter(([, i]) => i.nome).map(([n, i]) => { const e = i.modo === "dhcp" ? (i.lease || {}) : i; return `<li><code>${esc(curto(n))}</code> ${esc(i.nome)} · nível ${i.nivel} · ${esc(e.ip || "sem IP")}</li>`; }).join("")}</ul>`;
      if (d.tipo === "nuvem") extra = `<p class="peq">Servidores na Internet simulada: ${Object.entries(S.INTERNET).map(([ip, n]) => `<code>${esc(n)}</code> (${ip})`).join(", ")}. DNS público: 8.8.8.8.</p>`;
      if (d.tipo === "lap") { const w = rede.wlcDe(d); extra = `<p class="peq">${w ? `Associado ao controlador <b>${esc(w.nome)}</b> (CAPWAP). Redes Wi-Fi: ${w.wlc.wlans.map((x) => esc(x.ssid)).join(", ")}.` : "Ainda não encontrou nenhum WLC: ligue-o por cabo à mesma rede do controlador."}</p>`; }
      if (S.TIPOS[d.tipo].poe) extra = `<label class="linha peq"><input type="checkbox" data-energia ${d.pc.energia ? "checked" : ""}> Transformador ligado à tomada (sem ele precisa de PoE de um switch 3560/3650) · energia: <b>${rede.temEnergia(d) ? "sim" : "não"}</b></label>`;
      return extra;
    }
    function fisico(corpo, d) {
      const x = descDe(d), T = S.TIPOS[d.tipo], ps = rede.portas(d);
      const led = (p) => { const l = rede.linkDe(d, p); if (!l) return "off"; if (l.cabo === "wifi") return "on"; const e = rede.estadoLink(l); return e.estado === "errado" ? "bad" : e.estado === "ok" || e.estado === "consola" ? "on" : "amb"; };
      const linhas = ps.map((p) => {
        const l = rede.linkDe(d, p), o = l ? rede.dev(l.a === d.id ? l.b : l.a) : null, est = estadoPorta(d, p), cf = cfgPorta(d, p);
        return `<tr><td><code>${esc(curto(p))}</code></td><td>${o ? esc(o.nome) + " " + esc(curto(l.a === d.id ? l.pb : l.pa)) : "—"}</td><td><span class="chip ${est === "ativa" ? "ok" : l ? "bad" : ""}">${esc(est)}</span></td>${d.eq ? `<td>${esc(cf)}</td>` : ""}</tr>`;
      }).join("");
      const notaEnergia = d.eq ? "Como no equipamento real, ao voltar a ligar arranca com a startup-config: o que não guardou (Configuração › NVRAM › Guardar, ou write memory) perde-se." : "Desligado, o equipamento não tem endereço nem ligações.";
      corpo.innerHTML = `<div class="sim-fis">
          <div class="sim-fis-img ${d.desligado ? "off" : ""}">${F.icone(T.icone, 120)}</div>
          <div class="sim-fis-info"><b>${esc(x.n)}</b><p class="peq">${esc(x.desc)}</p>${extraInfo(d)}
            <button type="button" class="sim-power ${d.desligado ? "off" : "on"}" data-power aria-pressed="${!d.desligado}"><span class="sim-power-ic" aria-hidden="true">⏻</span><span>${d.desligado ? "Desligado — toque para ligar" : "Ligado — toque para desligar"}</span></button>
            <p class="peq suave">${notaEnergia}</p></div></div>
        <div class="sim-chassi" aria-label="Painel de portas">${ps.map((p) => `<button type="button" class="sim-chassi-p" data-porta-cfg="${esc(p)}" title="${esc(p)} · ${esc(estadoPorta(d, p))}"><i class="led ${d.desligado ? "off" : led(p)}"></i><span>${esc(curto(p))}</span></button>`).join("")}</div>
        ${d.tipo === "pc" ? `<label class="sim-form-l">Módulo de rede (no Packet Tracer troca-se com o PC desligado)<select class="campo" data-nic><option value="ethernet" ${d.pc.nic === "ethernet" ? "selected" : ""}>Placa com fios (FastEthernet)</option><option value="wifi" ${d.pc.nic === "wifi" ? "selected" : ""}>Placa sem fios WMP300N</option><option value="ambos" ${d.pc.nic === "ambos" ? "selected" : ""}>As duas</option></select></label>` : ""}
        <div class="tabela-caixa"><table><thead><tr><th>Porta</th><th>Ligada a</th><th>Estado</th>${d.eq ? "<th>Config.</th>" : ""}</tr></thead><tbody>${linhas || `<tr><td colspan="4" class="suave">Sem portas.</td></tr>`}</tbody></table></div>`;
      corpo.querySelector("[data-power]").onclick = () => energia(d);
      const en = corpo.querySelector("[data-energia]"); if (en) en.onchange = (e) => { d.pc.energia = e.target.checked; if (d.pc.dhcp) rede.pedirDhcp(d); rede.mudou(); atualizar(); repintar(d); };
      const nic = corpo.querySelector("[data-nic]");
      if (nic) nic.onchange = (e) => { d.pc.nic = e.target.value; rede.links = rede.links.filter((l) => !((l.a === d.id && !rede.portas(d).includes(l.pa)) || (l.b === d.id && !rede.portas(d).includes(l.pb)))); if (d.pc.dhcp) rede.pedirDhcp(d); rede.mudou(); atualizar(); repintar(d); msg(`${esc(d.nome)}: módulo de rede trocado.`, "ok"); };
      corpo.querySelector(".sim-chassi").onclick = (e) => {
        const b = e.target.closest("[data-porta-cfg]"); if (!b) return; const p = b.dataset.portaCfg;
        if (d.eq && d.eq.cfg.interfaces[p]) { secCfg[d.id] = "if:" + p; abrirInsp(d, "config", true); }
        else if (d.pc && (p === "FastEthernet0" || p === "Wireless0")) { secCfg[d.id] = "if:" + p; abrirInsp(d, "config", true); }
      };
    }
    // arranque de um equipamento (como no real: os routers e switches carregam a startup-config da NVRAM)
    function arrancar(d) {
      d.desligado = false;
      if (d.eq) {
        const h0 = d.eq.cfg.hostname;
        if (d.eq.startup) { try { d.eq.cfg = JSON.parse(d.eq.startup); } catch (e) { /* mantém */ } }
        d.eq.modo = "user"; d.eq.ctx = null;
        logTerm(d).push({ t: `\nSystem Bootstrap, Version 15.1(4)M4\n${d.eq.startup ? "A carregar a startup-config da NVRAM... [OK]" : "Sem startup-config na NVRAM: mantém-se a configuração atual (no Packet Tracer perder-se-ia)."}\n\nPress RETURN to get started!\n` });
        aposHostname(d, h0);
      }
    }
    function energia(d) {
      if (!d.desligado) { d.desligado = true; msg(`<b>${esc(d.nome)}</b> desligado: as ligações caíram (luzes apagadas).`); }
      else {
        arrancar(d);
        if (d.pc && d.pc.dhcp) setTimeout(() => { rede.pedirDhcp(d); rede.mudou(); atualizar(); }, 0);
        msg(`<b>${esc(d.nome)}</b> ligado.`, "ok");
      }
      rede.mudou(); atualizar(); repintar(d);
    }
    // barra do Tempo: ligar/desligar todos (Power Cycle Devices) e avançar o tempo (Fast Forward Time)
    function renovarDhcp(todos) { rede.devs.filter((x) => x.pc && x.pc.dhcp && !x.desligado && (todos || !x.pc.lease || x.pc.lease.apipa)).forEach((x) => { x.pc.libertado = false; rede.pedirDhcp(x); }); }
    function cicloEnergia() {
      const md = $("#sim-modal"); md.hidden = false;
      md.innerHTML = `<div class="sim-caixa"><b>Desligar e voltar a ligar todos os equipamentos?</b><p class="peq">Como no Packet Tracer (Power Cycle Devices): os routers e switches arrancam com a <b>startup-config</b> — o que não foi guardado com <code>write memory</code> (ou Configuração › NVRAM › Guardar) perde-se nos que já tinham uma startup-config. Os PCs com DHCP voltam a pedir endereço.</p>
        <div class="grelha-2"><button class="btn" data-fechar>Cancelar</button><button class="btn prim" data-confirmar>Ligar/desligar todos</button></div></div>`;
      md.onclick = (ev) => {
        if (ev.target.closest("[data-fechar]") || ev.target === md) { md.hidden = true; return; }
        if (!ev.target.closest("[data-confirmar]")) return;
        md.hidden = true;
        const ligados = rede.devs.filter((d) => !d.desligado);
        ligados.forEach((d) => { d.desligado = true; });
        ligados.forEach(arrancar);
        if (SM && SM.limparArp) SM.limparArp(rede);
        rede.devs.forEach((x) => { if (x.pc && x.pc.dhcp) x.pc.lease = null; });
        renovarDhcp(true);
        rede.links.forEach((l) => { if (ehSwitch(rede.dev(l.a)) || ehSwitch(rede.dev(l.b))) negoc.set(l.id, Date.now() + 4000); });
        setTimeout(() => { if (raiz.isConnected) desenhar(); }, 4100);
        rede.mudou(); atualizar(); const d = sel && rede.dev(sel); if (d) repintar(d);
        msg(`<b>${ligados.length}</b> equipamento(s) reiniciado(s). As portas dos switches negoceiam uns segundos (luz laranja); ⏩ avança o tempo.`, "ok");
      };
    }
    function avancarTempo() {
      tempoExtra += 30; negoc.clear(); renovarDhcp(false);
      rede.mudou(); atualizar(); relogio();
      msg("Tempo avançado 30 s: as portas acabaram de negociar e os pedidos DHCP em falta foram repetidos.", "ok");
    }
    const t0Relogio = Date.now(); let tempoExtra = 0;
    function relogio() {
      const el = $("#sim-relogio"); if (!el) return;
      const t = Math.floor((Date.now() - t0Relogio) / 1000) + tempoExtra, z = (n) => String(n).padStart(2, "0");
      el.textContent = `${z(Math.floor(t / 3600))}:${z(Math.floor(t / 60) % 60)}:${z(t % 60)}`;
    }
    const tRelogio = setInterval(() => { if (raiz.isConnected) relogio(); else clearInterval(tRelogio); }, 1000);

    // ------------------------------------------------------------ navegação do separador Config/Serviços (lista à esquerda; no telemóvel vira uma lista de escolha)
    function navCfg(corpo, d, secs, mapa, pintar) {
      const todas = secs.flatMap(([, it]) => it);
      let atual = mapa[d.id]; if (!todas.some(([k]) => k === atual)) atual = mapa[d.id] = todas[0][0];
      corpo.innerHTML = `<div class="sim-cfg"><nav class="sim-cfg-nav" aria-label="Secções">${secs.map(([g, it]) => `<div class="sim-cfg-grupo">${esc(g)}</div>${it.map(([k, n]) => `<button type="button" data-sec="${esc(k)}" aria-current="${k === atual}">${esc(n)}</button>`).join("")}`).join("")}</nav>
        <label class="sim-cfg-sel"><span class="rotulo">Secção</span><select class="campo">${secs.map(([g, it]) => `<optgroup label="${esc(g)}">${it.map(([k, n]) => `<option value="${esc(k)}" ${k === atual ? "selected" : ""}>${esc(n)}</option>`).join("")}</optgroup>`).join("")}</select></label>
        <div class="sim-cfg-pane"></div></div>`;
      const ir = (k) => { mapa[d.id] = k; navCfg(corpo, d, secs, mapa, pintar); };
      corpo.querySelector(".sim-cfg-nav").onclick = (e) => { const b = e.target.closest("[data-sec]"); if (b) ir(b.dataset.sec); };
      corpo.querySelector(".sim-cfg-sel select").onchange = (e) => ir(e.target.value);
      pintar(corpo.querySelector(".sim-cfg-pane"), atual);
    }
    const tit = (pt, en) => `<h3 class="sim-pt-tit">${esc(pt)} <small>${esc(en)}</small></h3>`;
    const onOff = (nome, v, a, b) => `<div class="sim-onoff" role="radiogroup"><label><input type="radio" name="${nome}" value="1" ${v ? "checked" : ""}> ${a || "Ligado"} <small>${a ? "" : "On"}</small></label><label><input type="radio" name="${nome}" value="0" ${!v ? "checked" : ""}> ${b || "Desligado"} <small>${b ? "" : "Off"}</small></label></div>`;
    const campo = (nome, rot, v, extra) => `<label>${rot}<input class="campo mono" name="${nome}" value="${esc(v == null ? "" : v)}" autocomplete="off" autocapitalize="off" spellcheck="false" ${extra || ""}></label>`;
    // Nome a mostrar (comum a todos)
    function paneNome(pane, d, resto) {
      const sync = syncDN[d.id] != null ? syncDN[d.id] : sincroniza;
      pane.insertAdjacentHTML("beforeend", `<form class="sim-form sim-pt" data-dn>${tit("Definições globais", "Global Settings")}
        <label>Nome a mostrar <small>Display Name</small><input class="campo" name="dn" value="${esc(d.nome)}" maxlength="40" autocomplete="off"></label>
        ${d.eq ? `<label class="linha peq"><input type="checkbox" name="sync" ${sync ? "checked" : ""}> Mudar também o hostname (como escrever <code>hostname</code> na CLI)</label>` : ""}
        ${!sincroniza && d.eq ? '<p class="peq suave">Nesta atividade os passos procuram o equipamento pelo nome atual: mude-o só se o enunciado o pedir.</p>' : ""}
        <p class="peq" data-m-dn></p></form>${resto || ""}`);
      const f = pane.querySelector("[data-dn]");
      f.onsubmit = (e) => e.preventDefault();
      f.onchange = (e) => {
        if (e.target.name === "sync") { syncDN[d.id] = e.target.checked; return; }
        if (e.target.name !== "dn") return;
        const er = mudarNome(d, e.target.value, d.eq && (syncDN[d.id] != null ? syncDN[d.id] : sincroniza));
        f.querySelector("[data-m-dn]").textContent = er; if (er && !/^Nome mudado/.test(er)) return;
        depois(d);
      };
    }

    // ------------------------------------------------------------ Config: routers e switches (comandos IOS)
    function ifsDe(d) {
      const I = d.eq.cfg.interfaces, fis = rede.portas(d).filter((p) => p !== "Console" && I[p]);
      return fis.concat(Object.keys(I).filter((n) => !fis.includes(n) && /^(Vlan|Loopback)|\./.test(n)));
    }
    function configIOS(corpo, d) {
      const eq = d.eq, sw = eq.tipo === "switch", l3 = d.tipo === "router" || d.tipo === "switch_l3";
      const secs = [["GLOBAL", [["g", "Definições (Settings)"]]]];
      if (l3) secs.push(["ENCAMINHAMENTO (ROUTING)", [["static", "Estáticas (Static)"]].concat(d.tipo === "router" ? [["rip", "RIP"]] : [])]);
      if (sw) secs.push(["COMUTAÇÃO (SWITCHING)", [["vlan", "Base de dados de VLAN"]]]);
      secs.push(["INTERFACE", ifsDe(d).map((n) => ["if:" + n, n])]);
      navCfg(corpo, d, secs, secCfg, (pane, k) => {
        if (k === "g") cfgGlobalIOS(pane, d);
        else if (k === "static") cfgStatic(pane, d);
        else if (k === "rip") cfgRip(pane, d);
        else if (k === "vlan") cfgVlans(pane, d);
        else if (k.startsWith("if:")) cfgIfIOS(pane, d, k.slice(3));
        pane.insertAdjacentHTML("beforeend", caixaEq(d));
      });
    }
    function textoCfg(d, qual) {
      const eq = d.eq, m = { modo: eq.modo, ctx: eq.ctx }, atual = eq.cfg;
      try {
        if (qual === "startup") { if (!eq.startup) return "startup-config is not present"; eq.cfg = JSON.parse(eq.startup); }
        return eq.runningConfig();
      } catch (e) { return "(não foi possível gerar)"; } finally { eq.cfg = atual; Object.assign(eq, m); }
    }
    function cfgGlobalIOS(pane, d) {
      const eq = d.eq, sw = eq.tipo === "switch", guardado = eq.startup && eq.startup === eq.estado();
      paneNome(pane, d, `<form class="sim-form sim-pt" data-gl>
        ${campo("host", "Hostname", eq.cfg.hostname, 'maxlength="63"')}
        ${sw ? campo("gw", "Gateway por defeito <small>ip default-gateway</small>", eq.cfg.defaultGateway || "", 'inputmode="decimal" placeholder="ex.: 192.168.1.1"') : ""}
        <fieldset class="sim-pt-caixa"><legend>NVRAM</legend><div class="linha"><button type="button" class="btn" data-nv="save">Guardar <small>Save</small></button><button type="button" class="btn" data-nv="erase">Apagar <small>Erase</small></button></div>
          <p class="peq suave">${guardado ? "A startup-config é igual à running-config." : eq.startup ? "Há alterações por guardar na startup-config." : "Ainda não há startup-config guardada: se o equipamento reiniciar, perde a configuração."}</p></fieldset>
        <fieldset class="sim-pt-caixa"><legend>Ficheiros de configuração</legend><div class="linha"><button type="button" class="btn" data-ver="startup">Ver startup-config</button><button type="button" class="btn" data-ver="running">Ver running-config</button></div><pre class="sim-rel" data-cfg-txt hidden></pre></fieldset>
        ${sw ? linhaProt(["stp"], "O Spanning Tree (STP) está ligado por defeito nos switches: bloqueia as ligações redundantes para não haver loops (luz laranja).") : ""}
        <p class="peq" data-m></p></form>`);
      const f = pane.querySelector("[data-gl]"), m = f.querySelector("[data-m]");
      f.onsubmit = (e) => e.preventDefault();
      f.onchange = (e) => {
        const v = e.target.value.trim();
        if (e.target.name === "host") { if (!/^[A-Za-z][\w-]{0,62}$/.test(v)) { m.textContent = "Hostname inválido: só letras, números, - e _, sem espaços, a começar por uma letra."; return; } if (v !== eq.cfg.hostname) { iosAplicar(d, ["hostname " + v]); depois(d); } }
        if (e.target.name === "gw") { if (!S.ehIP(v)) { m.textContent = "Gateway inválido."; return; } iosAplicar(d, ["ip default-gateway " + v]); depois(d); }
      };
      f.onclick = (e) => {
        const nv = e.target.closest("[data-nv]"); if (nv) { iosAplicar(d, [nv.dataset.nv === "save" ? "do write memory" : "do write erase"]); msg(nv.dataset.nv === "save" ? `Configuração de ${esc(d.nome)} guardada na NVRAM (startup-config).` : `startup-config de ${esc(d.nome)} apagada.`, "ok"); depois(d); return; }
        const vr = e.target.closest("[data-ver]"); if (vr) { const pre = f.querySelector("[data-cfg-txt]"); pre.hidden = false; pre.textContent = textoCfg(d, vr.dataset.ver); }
      };
    }
    function cfgStatic(pane, d) {
      const rs = d.eq.cfg.routes || [];
      pane.innerHTML = `<form class="sim-form sim-pt" data-st>${tit("Rotas estáticas", "Static Routes")}
        ${campo("net", "Rede <small>Network</small>", "", 'inputmode="decimal" placeholder="192.168.2.0"')}${campo("mask", "Máscara <small>Mask</small>", "", 'inputmode="decimal" placeholder="255.255.255.0" data-masc="net"')}${campo("via", "Próximo salto <small>Next Hop</small>", "", 'placeholder="10.0.0.2 ou g0/0/1"')}
        <button class="btn prim" type="submit">Adicionar <small>Add</small></button><p class="peq" data-m></p>
        <div class="tabela-caixa"><table><thead><tr><th>Rede</th><th>Máscara</th><th>Próximo salto</th><th></th></tr></thead><tbody>${rs.map((r, k) => `<tr><td><code>${esc(r.net)}</code></td><td><code>${esc(r.mask)}</code></td><td><code>${esc(r.via)}</code>${r.ad ? " AD " + r.ad : ""}</td><td><button type="button" class="btn-copiar" data-tirar="${k}">Remover</button></td></tr>`).join("") || '<tr><td colspan="4" class="suave">Sem rotas estáticas.</td></tr>'}</tbody></table></div>
        ${linhaProt(["ipv4"], "Uma rota estática diz ao router por onde chegar a uma rede que não está ligada a ele. 0.0.0.0 0.0.0.0 é a rota por defeito.")}</form>`;
      const f = pane.querySelector("form"); ligarMascaras(f);
      f.onsubmit = (e) => {
        e.preventDefault(); const v = Object.fromEntries(new FormData(f).entries()), m = f.querySelector("[data-m]");
        if (!S.ehIP(v.net.trim()) || !(S.mascaraOk(v.mask.trim()) || v.mask.trim() === "0.0.0.0") || !v.via.trim()) { m.textContent = "Indique a rede, a máscara e o próximo salto (IP ou interface de saída)."; return; }
        if (!iosAplicar(d, [`ip route ${v.net.trim()} ${v.mask.trim()} ${v.via.trim()}`]).length) depois(d);
      };
      f.onclick = (e) => { const b = e.target.closest("[data-tirar]"); if (!b) return; const r = rs[+b.dataset.tirar]; iosAplicar(d, [`no ip route ${r.net} ${r.mask} ${r.via}`]); depois(d); };
    }
    function cfgRip(pane, d) {
      const nets = ((d.eq.cfg.rip && d.eq.cfg.rip.extra) || []).filter((x) => /^network /.test(x)).map((x) => x.split(" ")[1]);
      pane.innerHTML = `<form class="sim-form sim-pt" data-rip>${tit("Encaminhamento RIP", "RIP Routing")}
        ${campo("net", "Rede <small>Network</small>", "", 'inputmode="decimal" placeholder="192.168.1.0"')}<button class="btn prim" type="submit">Adicionar <small>Add</small></button><p class="peq" data-m></p>
        <div class="tabela-caixa"><table><thead><tr><th>Redes anunciadas <small>Network Address</small></th><th></th></tr></thead><tbody>${nets.map((n) => `<tr><td><code>${esc(n)}</code></td><td><button type="button" class="btn-copiar" data-tirar="${esc(n)}">Remover</button></td></tr>`).join("") || '<tr><td colspan="2" class="suave">Sem redes.</td></tr>'}</tbody></table></div>
        ${linhaProt(["rip"])}<p class="peq suave">Aqui o RIP fica na configuração (como no equipamento) mas o simulador não o usa para calcular o caminho dos pacotes: para encaminhamento dinâmico use OSPF na CLI (<code>router ospf 1</code>).</p>${linhaProt(["ospf"])}</form>`;
      const f = pane.querySelector("form");
      f.onsubmit = (e) => { e.preventDefault(); const v = f.elements.net.value.trim(); if (!S.ehIP(v)) { f.querySelector("[data-m]").textContent = "Endereço de rede inválido."; return; } iosAplicar(d, ["router rip", "network " + v]); depois(d); };
      f.onclick = (e) => { const b = e.target.closest("[data-tirar]"); if (!b) return; iosAplicar(d, ["router rip", "no network " + b.dataset.tirar]); depois(d); };
    }
    function cfgVlans(pane, d) {
      const V = d.eq.cfg.vlans || {};
      pane.innerHTML = `<form class="sim-form sim-pt" data-vl>${tit("Base de dados de VLAN", "VLAN Database")}
        <div class="grelha-2">${campo("num", "Número da VLAN <small>VLAN Number</small>", "", 'inputmode="numeric" placeholder="10"')}${campo("nome", "Nome da VLAN <small>VLAN Name</small>", "", 'placeholder="Vendas"')}</div>
        <button class="btn prim" type="submit">Adicionar <small>Add</small></button><p class="peq" data-m></p>
        <div class="tabela-caixa"><table><thead><tr><th>VLAN</th><th>Nome</th><th></th></tr></thead><tbody>${Object.entries(V).map(([n, nm]) => `<tr><td><code>${esc(n)}</code></td><td>${esc(nm)}</td><td>${+n === 1 ? '<span class="suave peq">por defeito</span>' : `<button type="button" class="btn-copiar" data-tirar="${esc(n)}">Remover</button>`}</td></tr>`).join("")}
          ${["1002 fddi-default", "1003 token-ring-default", "1004 fddinet-default", "1005 trnet-default"].map((x) => `<tr class="suave"><td><code>${x.split(" ")[0]}</code></td><td>${x.split(" ")[1]}</td><td></td></tr>`).join("")}</tbody></table></div>
        ${linhaProt(["ieee8021q"], "Cada VLAN é uma rede separada dentro do switch. Nos trunks as tramas levam a etiqueta 802.1Q com o número da VLAN.")}</form>`;
      const f = pane.querySelector("form");
      f.onsubmit = (e) => {
        e.preventDefault(); const n = f.elements.num.value.trim(), nm = f.elements.nome.value.trim().replace(/\s+/g, "_"), m = f.querySelector("[data-m]");
        if (!/^\d+$/.test(n) || +n < 2 || +n > 4094 || (+n >= 1002 && +n <= 1005)) { m.textContent = "Número de VLAN entre 2 e 4094 (as 1002–1005 são reservadas)."; return; }
        if (!iosAplicar(d, ["vlan " + n].concat(nm ? ["name " + nm] : [])).length) depois(d);
      };
      f.onclick = (e) => { const b = e.target.closest("[data-tirar]"); if (!b) return; iosAplicar(d, ["no vlan " + b.dataset.tirar]); depois(d); };
    }
    function cfgIfIOS(pane, d, n) {
      const eq = d.eq, i = eq.cfg.interfaces[n]; if (!i) { pane.innerHTML = '<p class="peq">Interface inexistente.</p>'; return; }
      const sw = eq.tipo === "switch", fis = !/^(Vlan|Loopback)/.test(n) && !n.includes("."), serie = /^Serial/.test(n), l2 = sw && fis && !i.routed;
      const ext = (k) => { const x = (i.extra || []).find((y) => y.startsWith(k + " ")); return x ? x.slice(k.length + 1) : ""; };
      const vl = Object.keys(eq.cfg.vlans || {}).map(Number).sort((a, b) => a - b);
      const opV = (sel0) => vl.map((v) => `<option value="${v}" ${+sel0 === v ? "selected" : ""}>${v}: ${esc(eq.cfg.vlans[v])}</option>`).join("") + (vl.includes(+sel0) ? "" : `<option value="${sel0}" selected>${sel0} (não existe)</option>`);
      const giga = /^Gigabit/.test(n), vel = ext("speed") || "auto", dup = ext("duplex") || "auto";
      const l = fis ? rede.linkDe(d, n) : null;
      pane.innerHTML = `<form class="sim-form sim-pt" data-if>${tit(n, "Interface")}
        <div class="linha entre"><label class="linha"><input type="checkbox" name="on" ${!i.shutdown ? "checked" : ""}> Porta ligada <small>Port Status On</small></label><span class="chip ${fis ? (estadoPorta(d, n) === "ativa" ? "ok" : l ? "bad" : "") : d.eq.sim.ligada(n) ? "ok" : ""}">${fis ? esc(estadoPorta(d, n)) : d.eq.sim.ligada(n) && !i.shutdown ? "up" : "down"}</span></div>
        ${fis && !serie ? `<div class="grelha-2"><label>Largura de banda <small>Bandwidth</small><select class="campo" name="speed">${["auto", "10", "100"].concat(giga ? ["1000"] : []).map((x) => `<option value="${x}" ${vel === x ? "selected" : ""}>${x === "auto" ? "Automática" : x + " Mbps"}</option>`).join("")}</select></label>
          <label>Duplex<select class="campo" name="duplex">${[["auto", "Automático"], ["full", "Full"], ["half", "Half"]].map(([k, t]) => `<option value="${k}" ${dup === k ? "selected" : ""}>${t}</option>`).join("")}</select></label></div>` : ""}
        ${serie ? `<label>Clock rate (só do lado DCE)<select class="campo" name="clock">${["", "64000", "128000", "2000000", "4000000"].map((x) => `<option value="${x}" ${ext("clock rate") === x ? "selected" : ""}>${x || "Não definido"}</option>`).join("")}</select></label>` : ""}
        ${fis ? `<label>Endereço MAC <small>MAC Address</small><input class="campo mono" value="${esc(S.macDe(d, n))}" readonly></label>` : ""}
        ${l2 ? `<label>Modo <small>${i.mode === "trunk" ? "Trunk" : "Access"}</small><select class="campo" name="mode"><option value="access" ${i.mode !== "trunk" ? "selected" : ""}>Access (uma VLAN)</option><option value="trunk" ${i.mode === "trunk" ? "selected" : ""}>Trunk (várias VLANs, 802.1Q)</option></select></label>
          ${i.mode === "trunk" ? `<label>VLAN nativa <small>Native VLAN</small><select class="campo" name="native">${opV(i.native || 1)}</select></label>${campo("allowed", "VLANs permitidas <small>vazio = todas</small>", i.allowed && i.allowed !== "1-4094" ? i.allowed : "", 'placeholder="1-4094 (todas)"')}`
            : `<label>VLAN<select class="campo" name="vlan">${opV(i.accessVlan || 1)}</select></label>`}
          ${linhaProt(i.mode === "trunk" ? ["ieee8021q", "stp"] : ["ethernet"], i.mode === "trunk" ? "Num trunk passam várias VLANs pelo mesmo cabo: cada trama leva a etiqueta 802.1Q (menos a VLAN nativa)." : "Uma porta access pertence a uma só VLAN: é onde se ligam os PCs, impressoras e servidores.")}`
          : `<div class="grelha-2">${campo("ip", "Endereço IP <small>IP Address</small>", i.ip === "dhcp" ? "" : i.ip, `inputmode="decimal" placeholder="${i.ip === "dhcp" ? "DHCP" : "192.168.1.1"}"`)}${campo("mask", "Máscara <small>Subnet Mask</small>", i.ip === "dhcp" ? "" : i.mask, 'inputmode="decimal" data-masc="ip" placeholder="255.255.255.0"')}</div>`}
        ${campo("desc", "Descrição <small>description</small>", i.desc || "", 'placeholder="Ligação ao Switch1" maxlength="80"')}
        <p class="peq" data-m></p></form>`;
      const f = pane.querySelector("form"), m = f.querySelector("[data-m]"); ligarMascaras(f);
      f.onsubmit = (e) => e.preventDefault();
      f.onchange = (e) => {
        const k = e.target.name, v = (e.target.value || "").trim(); let c = null;
        if (k === "on") c = e.target.checked ? "no shutdown" : "shutdown";
        else if (k === "speed") c = "speed " + v;
        else if (k === "duplex") c = "duplex " + v;
        else if (k === "clock") c = v ? "clock rate " + v : "no clock rate";
        else if (k === "mode") c = "switchport mode " + v;
        else if (k === "vlan") c = "switchport access vlan " + v;
        else if (k === "native") c = "switchport trunk native vlan " + v;
        else if (k === "allowed") { if (v && !/^[\d,\- ]+$/.test(v)) { m.textContent = "Lista de VLANs inválida (ex.: 10,20,30-40)."; return; } c = "switchport trunk allowed vlan " + (v.replace(/\s+/g, "") || "1-4094"); }
        else if (k === "desc") { if (!v) return; c = "description " + v; }
        else if (k === "ip" || k === "mask") {
          const ip = f.elements.ip.value.trim(), mk = f.elements.mask.value.trim();
          if (!ip && k === "ip") { if (i.ip) c = "no ip address"; else return; }
          else if (!S.ehIP(ip)) { m.textContent = "Endereço IP inválido: são 4 números de 0 a 255 separados por pontos."; return; }
          else if (!S.mascaraOk(mk)) { m.textContent = "Escreva a máscara (ex.: 255.255.255.0)."; return; }
          else if (ip === i.ip && mk === i.mask) return;
          else c = `ip address ${ip} ${mk}`;
        }
        if (!c) return;
        m.textContent = "";
        iosAplicar(d, ["interface " + n, c]); depois(d);
      };
    }

    // ------------------------------------------------------------ Config: PCs, portáteis, servidores, IoT
    function configHost(corpo, d) {
      const ps = rede.portas(d).filter((p) => p !== "RS232");
      const secs = [["GLOBAL", [["g", "Definições (Settings)"]]]];
      if (d.wlc) secs.push(["SEM FIOS", [["wlan", "WLANs"]]]);
      if (!S.TIPOS[d.tipo].semIp) secs.push(["INTERFACE", ps.map((p) => ["if:" + p, p])]);
      navCfg(corpo, d, secs, secCfg, (pane, k) => {
        const c = d.pc;
        if (k === "g") {
          paneNome(pane, d, S.TIPOS[d.tipo].semIp ? "" : `<form class="sim-form sim-pt" data-gw>${tit("Gateway e DNS IPv4", "Gateway/DNS IPv4")}
            ${onOff("modo", c.dhcp, "DHCP", "Estático <small>Static</small>")}
            ${campo("gw", "Gateway por defeito <small>Default Gateway</small>", c.dhcp ? (rede.ipEfetivo(d).gw || "") : c.gw, `inputmode="decimal" ${c.dhcp ? "readonly" : ""}`)}${campo("dns", "Servidor DNS <small>DNS Server</small>", c.dhcp ? (rede.ipEfetivo(d).dns || "") : c.dns, `inputmode="decimal" ${c.dhcp ? "readonly" : ""}`)}
            ${linhaProt(c.dhcp ? ["dhcpv4"] : ["dns"])}<p class="peq" data-m></p></form>`);
          const f = pane.querySelector("[data-gw]"); if (!f) return;
          f.onsubmit = (e) => e.preventDefault();
          f.onchange = (e) => {
            const nm = e.target.name, v = e.target.value.trim(), m = f.querySelector("[data-m]");
            if (nm === "modo") { c.dhcp = v === "1"; if (c.dhcp) rede.pedirDhcp(d); rede.mudou(); atualizar(); depois(d); return; }
            if (v && !S.ehIP(v)) { m.textContent = (nm === "gw" ? "Gateway" : "DNS") + " inválido."; return; }
            c[nm] = v; m.textContent = "Guardado."; rede.mudou(); atualizar();
          };
        } else if (k === "wlan") formWlans(pane, d);
        else if (k === "if:Wireless0") { formWifiCliente(pane, d); pane.insertAdjacentHTML("afterbegin", tit("Wireless0", "Interface") + `<label class="sim-form-l">Endereço MAC <small>MAC Address</small><input class="campo mono" value="${esc(S.macDe(d, "Wireless0"))}" readonly></label>`); pane.insertAdjacentHTML("beforeend", ipHostHtml(d, "Wireless0") + linhaProt(["wpa"])); ligarIpHost(pane, d); }
        else if (k.startsWith("if:")) {
          const p = k.slice(3);
          pane.innerHTML = `<div class="sim-form sim-pt">${tit(p, "Interface")}<p class="peq">Estado: <span class="chip ${estadoPorta(d, p) === "ativa" ? "ok" : ""}">${esc(estadoPorta(d, p))}</span></p>
            <div class="grelha-2"><label>Largura de banda <small>Bandwidth</small><select class="campo" disabled><option>Automática (100 Mbps)</option></select></label><label>Duplex<select class="campo" disabled><option>Automático (Full)</option></select></label></div>
            <label>Endereço MAC <small>MAC Address</small><input class="campo mono" value="${esc(S.macDe(d, p))}" readonly></label></div>${ipHostHtml(d, p)}`;
          ligarIpHost(pane, d);
        }
      });
    }
    // Configuração IP de um PC (usada na Config › interface e no Ambiente de trabalho › Configuração IP)
    function ipHostHtml(d) {
      const c = d.pc, ef = rede.ipEfetivo(d), ro = c.dhcp ? "readonly" : "";
      const est = c.dhcp ? (ef.ip && !(c.lease && c.lease.apipa) ? `<p class="peq sim-ok-txt">Pedido DHCP bem-sucedido${c.lease && c.lease.de ? " (servidor " + esc(c.lease.de) + ")" : ""}.</p>` : `<p class="peq sim-erro-txt">${c.lease && c.lease.apipa ? "O pedido DHCP falhou: nenhum servidor respondeu. A usar APIPA (169.254.x.x)." : "À espera de um servidor DHCP…"}</p>`) : "";
      return `<form class="sim-form sim-pt" data-iph>${tit("Configuração IP", "IP Configuration")}
        ${onOff("modo", c.dhcp, "DHCP", "Estático <small>Static</small>")}${est}
        <div class="grelha-2">${campo("ip", "Endereço IPv4 <small>IPv4 Address</small>", c.dhcp ? ef.ip : c.ip, `inputmode="decimal" placeholder="192.168.1.10" ${ro}`)}${campo("mask", "Máscara <small>Subnet Mask</small>", c.dhcp ? ef.mask : c.mask, `inputmode="decimal" placeholder="255.255.255.0" data-masc="ip" ${ro}`)}</div>
        <div class="grelha-2">${campo("gw", "Gateway por defeito <small>Default Gateway</small>", c.dhcp ? ef.gw : c.gw, `inputmode="decimal" placeholder="192.168.1.1" ${ro}`)}${campo("dns", "Servidor DNS <small>DNS Server</small>", c.dhcp ? ef.dns : c.dns, `inputmode="decimal" placeholder="opcional" ${ro}`)}</div>
        ${c.dhcp ? '<button type="button" class="btn peq" data-renovar>Pedir IP de novo (ipconfig /renew)</button>' : ""}
        ${linhaProt(c.dhcp ? ["dhcpv4"] : ["ipv4"], c.dhcp ? "" : "Endereço e máscara dizem a que rede o PC pertence; o gateway é o router que leva os pacotes para outras redes.")}<p class="peq" data-m></p></form>`;
    }
    function ligarIpHost(raizF, d) {
      const f = raizF.querySelector("[data-iph]"); if (!f) return;
      const c = d.pc, m = f.querySelector("[data-m]"); ligarMascaras(f);
      f.onsubmit = (e) => e.preventDefault();
      f.onclick = (e) => { if (e.target.closest("[data-renovar]")) { c.libertado = false; rede.pedirDhcp(d); rede.mudou(); atualizar(); depois(d); } };
      f.onchange = (e) => {
        const nm = e.target.name, v = (e.target.value || "").trim();
        if (nm === "modo") { c.dhcp = v === "1"; c.libertado = false; if (c.dhcp) rede.pedirDhcp(d); rede.mudou(); atualizar(); depois(d); return; }
        if (c.dhcp || !["ip", "mask", "gw", "dns"].includes(nm)) return;
        const vals = { ip: f.elements.ip.value.trim(), mask: f.elements.mask.value.trim(), gw: f.elements.gw.value.trim(), dns: f.elements.dns.value.trim() };
        const erros = [];
        if (vals.ip && !S.ehIP(vals.ip)) erros.push("Endereço IPv4 inválido: são 4 números de 0 a 255 separados por pontos.");
        if (vals.mask && !S.mascaraOk(vals.mask)) erros.push("Máscara inválida (ex.: 255.255.255.0).");
        if (vals.gw && !S.ehIP(vals.gw)) erros.push("Gateway inválido.");
        if (vals.dns && !S.ehIP(vals.dns)) erros.push("DNS inválido.");
        ["ip", "mask", "gw", "dns"].forEach((k) => { if (!vals[k] || (k === "mask" ? S.mascaraOk(vals[k]) : S.ehIP(vals[k]))) c[k] = vals[k]; });
        m.textContent = erros.join(" ");
        m.className = "peq" + (erros.length ? " sim-erro-txt" : "");
        rede.mudou(); atualizar();
        if (!erros.length && c.ip && c.mask) msg(`${esc(d.nome)}: ${esc(c.ip)}/${window.IOS.prefixo(c.mask)}${c.gw ? ", gateway " + esc(c.gw) : ""}.`, "ok");
      };
    }

    // ------------------------------------------------------------ Config: outros equipamentos (AP, router Wi-Fi, ASA, nuvem, hub…)
    function configOutro(corpo, d) {
      const extra = { ap: [["ap", "Sem fios (Wireless)"]], router_wifi: [["rw", "Internet e LAN"], ["rwwifi", "Sem fios (Wireless)"]], asa: [["asa", "Interfaces, NAT e DHCP"]], nuvem: [["nuvem", "Operador (portas)"]] }[d.tipo] || [];
      const secs = [["GLOBAL", [["g", "Definições (Settings)"]]]];
      if (extra.length) secs.push(["CONFIGURAÇÃO", extra]);
      navCfg(corpo, d, secs, secCfg, (pane, k) => {
        if (k === "g") { paneNome(pane, d, `<div class="sim-pt"><p class="peq">${esc(descDe(d).desc)}</p>${extraInfo(d)}</div>`); const en = pane.querySelector("[data-energia]"); if (en) en.onchange = (e) => { d.pc.energia = e.target.checked; rede.mudou(); atualizar(); depois(d); }; return; }
        const sub = document.createElement("div"); pane.appendChild(sub);
        if (k === "ap") formAP(sub, d); if (k === "rwwifi") formAP(sub, d, true); if (k === "rw") formRW(sub, d); if (k === "asa") formASA(sub, d); if (k === "nuvem") formNuvem(sub, d);
        pane.insertAdjacentHTML("beforeend", linhaProt(k === "ap" || k === "rwwifi" ? ["wpa", "wifi"] : k === "asa" ? ["nat"] : k === "rw" ? ["nat", "dhcpv4"] : ["dhcpv4"]));
      });
    }

    // ------------------------------------------------------------ copiar e colar equipamentos (sem cabos)
    function copiar(d) { const s = rede.exportar().devs.find((x) => x.id === d.id); copiado = s ? JSON.stringify(s) : null; }
    function colar() {
      if (!copiado) return;
      const s = JSON.parse(copiado), x = lim(s.x + 9, 5, 95), y = lim(s.y + 9, 8, 90);
      const d = rede.novoDev(s.tipo, x, y, null, { modelo: s.modelo || undefined, ap: s.ap, rw: s.rw, asa: s.asa, nuvem: s.nuvem, wlc: s.wlc });
      if (d.eq && s.cfg) { d.eq.cfg = s.cfg; d.eq.cfg.hostname = d.nome; d.eq.startup = ""; d.eq.sim = rede.ganchos(d); }
      if (d.pc && s.pc) {
        Object.assign(d.pc, s.pc, { log: [], lease: null, arp: {}, mapas: {}, libertado: false });
        if (!d.pc.dhcp) d.pc.ip = ""; // IP estático repetido daria conflito
      }
      if (s.srv) d.srv = s.srv;
      if (d.rw) d.rw.wan.lease = null;
      if (d.asa) Object.values(d.asa.ifs).forEach((i) => { i.lease = null; });
      rede.mudou(); copiado = JSON.stringify(Object.assign(s, { x, y })); // o próximo colar fica ao lado deste
      msg(`<b>${esc(d.nome)}</b> criado como cópia, com a mesma configuração${d.pc && !d.pc.dhcp ? " (o IP estático ficou em branco para não repetir)" : ""}. Os cabos não são copiados.`, "ok");
      abrirInsp(d); atualizar();
    }

    // Formulário genérico: campos [nome, rótulo, valor, tipo?, opções?]
    function formulario(corpo, titulo, campos, aoGuardar, nota) {
      corpo.innerHTML = `<form class="secao sim-form" data-f="gen"><b>${titulo}</b>${campos.map(([n, r, v, t, ops]) => t === "check" ? `<label class="linha"><input type="checkbox" name="${n}" ${v ? "checked" : ""}> ${r}</label>`
        : t === "select" ? `<label>${r}<select class="campo" name="${n}">${ops.map(([k, txt]) => `<option value="${esc(k)}" ${String(v) === String(k) ? "selected" : ""}>${esc(txt)}</option>`).join("")}</select></label>`
        : `<label>${r}<input class="campo mono" name="${n}" value="${esc(v == null ? "" : v)}" autocomplete="off"></label>`).join("")}
        <button class="btn prim" type="submit">Guardar</button><p class="peq" id="sim-gen-msg">${nota || ""}</p></form>`;
      const f = corpo.querySelector("form");
      f.onsubmit = (e) => {
        e.preventDefault();
        const v = {}; campos.forEach(([n, , , t]) => { v[n] = t === "check" ? f.elements[n].checked : (f.elements[n].value || "").trim(); });
        const erro = aoGuardar(v);
        corpo.querySelector("#sim-gen-msg").textContent = erro || "Guardado.";
        if (!erro) { rede.mudou(); atualizar(); }
      };
    }
    const ipOk = (x) => !x || S.ehIP(x);
    function formWifiCliente(corpo, d) {
      const c = d.pc, est = rede.wifi().estado[d.id] || "";
      const campos = [];
      if (d.tipo === "pc") campos.push(["nic", "Placa de rede (como trocar o módulo no Packet Tracer)", c.nic, "select", [["ethernet", "Com fios (FastEthernet)"], ["wifi", "Sem fios (WMP300N)"], ["ambos", "As duas"]]]);
      campos.push(["ssid", "Nome da rede Wi-Fi (SSID)", c.wifi.ssid], ["chave", "Palavra-passe (WPA2)", c.wifi.chave]);
      formulario(corpo, "Ligação sem fios", campos, (v) => {
        if (v.nic && v.nic !== c.nic) { c.nic = v.nic; rede.links = rede.links.filter((l) => !((l.a === d.id && !rede.portas(d).includes(l.pa)) || (l.b === d.id && !rede.portas(d).includes(l.pb)))); }
        c.wifi = { ssid: v.ssid, chave: v.chave };
        if (c.dhcp) setTimeout(() => { rede.pedirDhcp(d); rede.mudou(); atualizar(); }, 0);
        msg(`${esc(d.nome)}: Wi-Fi “${esc(v.ssid || "—")}”.`, "ok");
      }, est ? "Estado: " + est : "");
    }
    function formAP(corpo, d, rw) {
      const w = rw ? d.rw.wifi : d.ap;
      formulario(corpo, rw ? "Rede sem fios do router" : "Access point", [["ssid", "SSID (nome da rede)", w.ssid], ["seguranca", "Segurança", w.seguranca, "select", [["aberta", "Aberta (sem palavra-passe — inseguro)"], ["wpa2", "WPA2-Pessoal (PSK)"]]],
        ["chave", "Palavra-passe (8 caracteres ou mais)", w.chave], ["canal", "Canal (2,4 GHz: 1, 6 ou 11)", w.canal || 6, "select", [[1, "1"], [6, "6"], [11, "11"]]]], (v) => {
        if (!v.ssid) return "Escreva um SSID.";
        if (v.seguranca === "wpa2" && v.chave.length < 8) return "No WPA2 a palavra-passe tem pelo menos 8 caracteres.";
        Object.assign(w, { ssid: v.ssid, seguranca: v.seguranca, chave: v.chave, canal: +v.canal });
        msg(`Wi-Fi “${esc(v.ssid)}” ${v.seguranca === "wpa2" ? "com WPA2" : "aberta"}.`, "ok");
      }, `Clientes ligados: ${rede.wifi().links.filter((l) => l.b === d.id).length}`);
    }
    function formWlans(corpo, d) {
      const w = d.wlc.wlans[0];
      formulario(corpo, "WLAN do controlador (enviada para todos os LAP)", [["ssid", "SSID", w.ssid], ["seguranca", "Segurança", w.seguranca, "select", [["aberta", "Aberta"], ["wpa2", "WPA2-PSK"]]], ["chave", "Palavra-passe", w.chave]], (v) => {
        if (!v.ssid) return "Escreva um SSID."; if (v.seguranca === "wpa2" && v.chave.length < 8) return "Palavra-passe com 8 ou mais caracteres.";
        Object.assign(w, v); msg(`WLAN “${esc(v.ssid)}” criada no ${esc(d.nome)}.`, "ok");
      }, `LAP associados: ${rede.devs.filter((x) => x.tipo === "lap" && rede.wlcDe(x) === d).map((x) => esc(x.nome)).join(", ") || "nenhum"}`);
    }
    function formRW(corpo, d) {
      const w = d.rw.wan, l = d.rw.lan;
      formulario(corpo, "Router Wi-Fi: Internet e rede local", [["modo", "Ligação à Internet", w.modo, "select", [["dhcp", "Automática (DHCP do operador)"], ["estatico", "IP estático"]]], ["ip", "IP Internet (se estático)", w.ip], ["mask", "Máscara", w.mask], ["gw", "Gateway do operador", w.gw], ["dns", "DNS", w.dns],
        ["lip", "IP do router na LAN", l.ip], ["lmask", "Máscara da LAN", l.mask], ["dhcp", "Servidor DHCP para a LAN", l.dhcp.on, "check"], ["inicio", "Primeiro IP a dar", l.dhcp.inicio], ["max", "Máximo de clientes", l.dhcp.max]], (v) => {
        if (![v.ip, v.mask, v.gw, v.dns, v.lip, v.inicio].every(ipOk) || !S.ehIP(v.lip)) return "Há um endereço inválido.";
        if (v.modo === "estatico" && (!S.ehIP(v.ip) || !S.mascaraOk(v.mask))) return "No modo estático indique IP e máscara.";
        Object.assign(w, { modo: v.modo, ip: v.ip, mask: v.mask, gw: v.gw, dns: v.dns }); if (v.modo === "dhcp") w.lease = null;
        Object.assign(l, { ip: v.lip, mask: v.lmask || "255.255.255.0" }); Object.assign(l.dhcp, { on: v.dhcp, inicio: v.inicio, max: +v.max || 50 });
        rede.devs.filter((x) => x.pc && x.pc.dhcp).forEach((x) => rede.pedirDhcp(x));
        msg(`${esc(d.nome)} configurado.`, "ok");
      }, (() => { const e = rede.wanRW(d); return `Internet agora: ${e.ip ? e.ip + " via " + (e.gw || "?") : "sem endereço (ligue a porta Internet ao modem/operador)"}`; })());
    }
    function formASA(corpo, d) {
      const I = d.asa.ifs, o = I["GigabitEthernet1/1"], i = I["GigabitEthernet1/2"], z = I["GigabitEthernet1/3"];
      formulario(corpo, "Firewall ASA 5506-X", [["omodo", "G1/1 outside (nível 0)", o.modo, "select", [["dhcp", "DHCP do operador"], ["estatico", "Estático"]]], ["oip", "IP outside (estático)", o.ip], ["omask", "Máscara outside", o.mask], ["gw", "Rota por defeito (gateway)", d.asa.gw],
        ["iip", "G1/2 inside (nível 100): IP", i.ip], ["imask", "Máscara inside", i.mask], ["zip", "G1/3 dmz (nível 50): IP (opcional)", z.ip], ["zmask", "Máscara dmz", z.mask],
        ["nat", "NAT dinâmico (PAT) de dentro para fora", d.asa.nat, "check"], ["icmp", "Inspecionar ICMP (deixa voltar a resposta do ping)", d.asa.icmp, "check"], ["dhcp", "Servidor DHCP no inside", d.asa.dhcp.on, "check"], ["inicio", "Primeiro IP do DHCP", d.asa.dhcp.inicio]], (v) => {
        if (![v.oip, v.omask, v.gw, v.iip, v.imask, v.zip, v.zmask, v.inicio].every(ipOk)) return "Há um endereço inválido.";
        Object.assign(o, { modo: v.omodo, ip: v.oip, mask: v.omask }); if (v.omodo === "dhcp") o.lease = null;
        Object.assign(i, { ip: v.iip, mask: v.imask }); Object.assign(z, { nome: v.zip ? "dmz" : "", nivel: 50, ip: v.zip, mask: v.zmask || "255.255.255.0" });
        Object.assign(d.asa, { gw: v.gw, nat: v.nat, icmp: v.icmp }); Object.assign(d.asa.dhcp, { on: v.dhcp, inicio: v.inicio });
        msg(`${esc(d.nome)} configurada.`, "ok");
      }, "Regra da ASA: o tráfego de um nível mais alto para um mais baixo passa (inside → outside); de fora para dentro é bloqueado. Por defeito a ASA não inspeciona ICMP: o ping sai mas a resposta não volta.");
    }
    function formNuvem(corpo, d) {
      const P = d.nuvem.portas, ks = Object.keys(P);
      formulario(corpo, "Operador / Internet", ks.flatMap((k) => [[k + "_ip", `${k}: IP do operador`, P[k].ip], [k + "_dhcp", `${k}: dar IP aos clientes por DHCP`, P[k].dhcp, "check"]]), (v) => {
        if (!ks.every((k) => ipOk(v[k + "_ip"]))) return "Há um endereço inválido.";
        ks.forEach((k) => { P[k].ip = v[k + "_ip"]; P[k].dhcp = v[k + "_dhcp"]; });
        rede.devs.forEach((x) => { if (x.rw) x.rw.wan.lease = null; if (x.asa) Object.values(x.asa.ifs).forEach((y) => { y.lease = null; }); });
        msg("Operador configurado.", "ok");
      }, "Cada porta é uma ligação a um cliente (/24). Ethernet para routers e firewalls, Coaxial7 para o modem de cabo, Modem4 para o modem DSL.");
    }
    function captura(corpo, d) {
      const viz = new Set(rede.linksDe(d).map((l) => (l.a === d.id ? l.b : l.a)));
      const vistos = (rede.trafego || []).filter((t) => t.devs.some((x) => viz.has(x) && S.ehPonte(rede.dev(x) || {}) ) || t.devs.includes(d.id)).slice(-15).reverse();
      corpo.innerHTML = `<div class="secao"><p class="peq">O sniffer só vê o tráfego que lhe chega: ligue-o a um <b>hub</b> (que repete tudo para todas as portas). Ligado a um switch, só veria o tráfego dirigido a ele.</p>
        <div class="tabela-caixa"><table><thead><tr><th>Origem</th><th>Destino</th><th>Protocolo</th><th>Resultado</th></tr></thead><tbody>${vistos.map((t) => `<tr><td>${esc(t.de)}</td><td>${esc(t.para)}</td><td>ICMP echo</td><td>${t.ok ? "resposta" : "sem resposta"}</td></tr>`).join("") || '<tr><td colspan="4" class="suave">Ainda não passou nada. Faça um ping entre dois PCs ligados ao hub.</td></tr>'}</tbody></table></div>
        <button class="btn" type="button" data-atualizar-cap>Atualizar</button></div>`;
      corpo.querySelector("[data-atualizar-cap]").onclick = () => captura(corpo, d);
    }

    // ------------------------------------------------------------ Serviços do servidor (como no Packet Tracer)
    const paginaPadrao = (d) => `<html>\n<body>\n<h1>${d.nome}</h1>\n<p>Bem-vindo! Esta página está guardada no servidor web ${d.nome}.</p>\n<p>Foi pedida pelo navegador com HTTP (porta TCP 80).</p>\n<p>Edite este index.html em Serviços › HTTP.</p>\n</body>\n</html>`;
    const FICH_TFTP = ["c1841-advipservicesk9-mz.124-15.T1.bin", "c2960-lanbasek9-mz.150-2.SE4.bin", "c2900-universalk9-mz.SPA.155-3.M4a.bin", "isr4300-universalk9.16.06.04.SPA.bin", "pt1000-i-mz.122-28.bin"];
    function srvDe(d) {
      const s = d.srv;
      if (s.http == null) s.http = true; if (s.https == null) s.https = true;
      s.dhcp.nome = s.dhcp.nome || "serverPool"; if (s.dhcp.tftp == null) s.dhcp.tftp = ""; if (s.dhcp.max == null) s.dhcp.max = 50;
      s.tftp = s.tftp || { on: true, ficheiros: FICH_TFTP.slice() };
      s.syslog = s.syslog || { on: false, msgs: [] };
      s.aaa = s.aaa || { on: false, clientes: [], users: [] };
      s.ntp = s.ntp || { on: true, auth: false, chave: "", pass: "" };
      s.email = s.email || { smtp: true, pop3: true, dominio: "", users: [] };
      s.ftp = s.ftp || { on: true, users: [{ user: "cisco", pass: "cisco", perm: "RWDNL" }], ficheiros: FICH_TFTP.slice(0, 3) };
      return s;
    }
    const SERVICOS = [["http", "HTTP"], ["dhcp", "DHCP"], ["dhcpv6", "DHCPv6"], ["tftp", "TFTP"], ["dns", "DNS"], ["syslog", "SYSLOG"], ["aaa", "AAA"], ["ntp", "NTP"], ["email", "EMAIL"], ["ftp", "FTP"], ["iot", "IoT"], ["vm", "VM Management"], ["eap", "Radius EAP"]];
    const NAO_SIM = { dhcpv6: ["DHCPv6", "dhcpv6", "Atribui endereços IPv6 aos clientes."], iot: ["IoT", null, "Regista e controla equipamentos de casa inteligente (no Packet Tracer, pelo servidor de registo IoT)."], vm: ["VM Management", null, "Gere máquinas virtuais no servidor."], eap: ["Radius EAP", "dot1x", "Autenticação 802.1X com EAP para Wi-Fi empresarial e portas de switch."] };
    function servicos(corpo, d) {
      const s = srvDe(d);
      const ligado = { http: s.http, dhcp: s.dhcp.on, tftp: s.tftp.on, dns: s.dns.on, syslog: s.syslog.on, aaa: s.aaa.on, ntp: s.ntp.on, email: s.email.smtp || s.email.pop3, ftp: s.ftp.on };
      navCfg(corpo, d, [["SERVIÇOS (SERVICES)", SERVICOS.map(([k, n]) => [k, n + (NAO_SIM[k] ? " · não simulado" : ligado[k] ? " ●" : "")])]], secSrv, (pane, k) => {
        const guardar = () => { rede.mudou(); atualizar(); depois(d); };
        const radios = (f, nome, fn) => f.querySelectorAll(`[name="${nome}"]`).forEach((r) => { r.onchange = () => { fn(r.value === "1"); guardar(); }; });
        if (NAO_SIM[k]) { const [n, id, txt] = NAO_SIM[k]; pane.innerHTML = `<div class="sim-pt">${tit(n, "Service")}<p class="peq">${esc(txt)}</p><p class="peq suave">Este serviço existe no Packet Tracer mas ainda não é simulado aqui.</p>${id ? linhaProt([id]) : ""}</div>`; return; }
        if (k === "http") {
          pane.innerHTML = `<div class="sim-form sim-pt">${tit("HTTP", "Service")}<div class="grelha-2"><div><b class="peq">HTTP</b>${onOff("http", s.http)}</div><div><b class="peq">HTTPS</b>${onOff("https", s.https)}</div></div>
            <b class="peq">Gestor de ficheiros <small>File Manager</small></b><div class="tabela-caixa"><table><thead><tr><th>Ficheiro</th><th></th></tr></thead><tbody><tr><td><code>index.html</code></td><td><button type="button" class="btn-copiar" data-editar>Editar</button></td></tr></tbody></table></div>
            <form class="sim-form" data-html hidden><label>index.html<textarea class="campo mono" rows="9" spellcheck="false" name="html">${esc(s.html || paginaPadrao(d))}</textarea></label><div class="grelha-2"><button type="button" class="btn" data-repor>Repor a página padrão</button><button class="btn prim" type="submit">Guardar</button></div><p class="peq" data-m></p></form>
            ${linhaProt(["http", "https"])}<p class="peq suave">Para testar: noutro PC › Ambiente de trabalho › Navegador web › escreva o IP ou o nome DNS deste servidor.</p></div>`;
          radios(pane, "http", (v) => { s.http = v; }); radios(pane, "https", (v) => { s.https = v; });
          const f = pane.querySelector("[data-html]");
          pane.querySelector("[data-editar]").onclick = () => { f.hidden = !f.hidden; };
          f.querySelector("[data-repor]").onclick = () => { delete s.html; f.elements.html.value = paginaPadrao(d); rede.mudou(); f.querySelector("[data-m]").textContent = "Página padrão reposta."; };
          f.onsubmit = (e) => { e.preventDefault(); s.html = f.elements.html.value; rede.mudou(); f.querySelector("[data-m]").textContent = "index.html guardado."; msg(`Página web de ${esc(d.nome)} guardada.`, "ok"); };
          return;
        }
        if (k === "dhcp") {
          const p = s.dhcp;
          pane.innerHTML = `<form class="sim-form sim-pt" data-dhcp>${tit("DHCP", "Service")}
            <div class="grelha-2"><label>Interface<select class="campo" disabled><option>FastEthernet0</option></select></label><div><b class="peq">Serviço <small>Service</small></b>${onOff("on", p.on)}</div></div>
            <div class="grelha-2">${campo("nome", "Nome do pool <small>Pool Name</small>", p.nome, "readonly")}${campo("gw", "Gateway por defeito <small>Default Gateway</small>", p.gw, 'inputmode="decimal" placeholder="192.168.1.1"')}</div>
            <div class="grelha-2">${campo("dns", "Servidor DNS <small>DNS Server</small>", p.dns, 'inputmode="decimal" placeholder="192.168.1.5"')}${campo("inicio", "Primeiro IP <small>Start IP Address</small>", p.inicio, 'inputmode="decimal" placeholder="192.168.1.100"')}</div>
            <div class="grelha-2">${campo("mask", "Máscara <small>Subnet Mask</small>", p.mask, 'inputmode="decimal" data-masc="inicio"')}${campo("max", "Máximo de utilizadores <small>Maximum Number of Users</small>", p.max, 'inputmode="numeric"')}</div>
            ${campo("tftp", "Servidor TFTP <small>TFTP Server</small>", p.tftp, 'inputmode="decimal" placeholder="opcional"')}
            <div class="sim-pt-botoes"><button type="button" class="btn" data-add title="O servidor simulado tem um só pool">Adicionar <small>Add</small></button><button class="btn prim" type="submit">Guardar <small>Save</small></button><button type="button" class="btn" data-rem>Remover <small>Remove</small></button></div><p class="peq" data-m></p>
            <div class="tabela-caixa"><table><thead><tr><th>Pool</th><th>Gateway</th><th>DNS</th><th>Primeiro IP</th><th>Máscara</th><th>Máx.</th><th>TFTP</th></tr></thead><tbody><tr><td>${esc(p.nome)}</td><td>${esc(p.gw || "0.0.0.0")}</td><td>${esc(p.dns || "0.0.0.0")}</td><td>${esc(p.inicio || "0.0.0.0")}</td><td>${esc(p.mask)}</td><td>${esc(p.max)}</td><td>${esc(p.tftp || "0.0.0.0")}</td></tr></tbody></table></div>
            ${linhaProt(["dhcpv4"])}<p class="peq suave">Os clientes têm de estar na mesma rede (ou o router tem de ter <code>ip helper-address</code> com o IP deste servidor).</p></form>`;
          const f = pane.querySelector("form"), m = f.querySelector("[data-m]"); ligarMascaras(f);
          radios(f, "on", (v) => { p.on = v; rede.devs.filter((x) => x.pc && x.pc.dhcp).forEach((x) => { if (!x.pc.lease || x.pc.lease.apipa) rede.pedirDhcp(x); }); msg("Serviço DHCP " + (v ? "ligado" : "desligado") + ".", "ok"); });
          f.querySelector("[data-add]").onclick = () => { m.textContent = "Este servidor tem um só pool (serverPool): altere-o e toque em Guardar."; };
          f.querySelector("[data-rem]").onclick = () => { Object.assign(p, { inicio: "", gw: "", dns: "", tftp: "", mask: "255.255.255.0", max: 50 }); guardar(); };
          f.onsubmit = (e) => {
            e.preventDefault(); const v = Object.fromEntries(new FormData(f).entries());
            const ips = ["gw", "dns", "inicio", "tftp"].filter((x) => v[x].trim() && !S.ehIP(v[x].trim()));
            if (ips.length) { m.textContent = "Endereço inválido: " + ips.join(", ") + "."; return; }
            if (!S.mascaraOk(v.mask.trim())) { m.textContent = "Máscara inválida."; return; }
            const max = +v.max; if (!(max >= 1 && max <= 1000)) { m.textContent = "Máximo de utilizadores entre 1 e 1000."; return; }
            Object.assign(p, { gw: v.gw.trim(), dns: v.dns.trim(), inicio: v.inicio.trim(), mask: v.mask.trim(), max, tftp: v.tftp.trim() });
            rede.devs.filter((x) => x.pc && x.pc.dhcp).forEach((x) => { if (!x.pc.lease || x.pc.lease.apipa) rede.pedirDhcp(x); });
            msg(`Pool DHCP de ${esc(d.nome)} guardado${p.on ? "" : " (o serviço está desligado: ligue-o em On)"}.`, "ok"); guardar();
          };
          return;
        }
        if (k === "dns") {
          const R = s.dns.registos, i0 = dnsSel[d.id], r0 = R[i0] || { nome: "", ip: "" };
          pane.innerHTML = `<form class="sim-form sim-pt" data-dns>${tit("DNS", "Service")}<div><b class="peq">Serviço DNS <small>DNS Service</small></b>${onOff("on", s.dns.on)}</div>
            <b class="peq">Registos <small>Resource Records</small></b>
            <div class="grelha-2">${campo("nome", "Nome <small>Name</small>", r0.nome, 'placeholder="www.escola.local"')}<label>Tipo <small>Type</small><select class="campo" name="tipo"><option>Registo A (A Record)</option><option disabled>CNAME (não simulado)</option><option disabled>SOA (não simulado)</option><option disabled>NS (não simulado)</option></select></label></div>
            ${campo("ip", "Endereço <small>Address</small>", r0.ip, 'inputmode="decimal" placeholder="192.168.1.5"')}
            <div class="sim-pt-botoes"><button class="btn prim" type="submit">Adicionar <small>Add</small></button><button type="button" class="btn" data-save ${R[i0] ? "" : "disabled"}>Guardar <small>Save</small></button><button type="button" class="btn" data-rem ${R[i0] ? "" : "disabled"}>Remover <small>Remove</small></button></div><p class="peq" data-m></p>
            <div class="tabela-caixa"><table class="sim-tab-sel"><thead><tr><th>N.º</th><th>Nome</th><th>Tipo</th><th>Detalhe</th></tr></thead><tbody>${R.map((r, k2) => `<tr data-sel="${k2}" class="${k2 === i0 ? "sel" : ""}" tabindex="0"><td>${k2}</td><td><code>${esc(r.nome)}</code></td><td>A Record</td><td><code>${esc(r.ip)}</code></td></tr>`).join("") || '<tr><td colspan="4" class="suave">Sem registos.</td></tr>'}</tbody></table></div>
            ${linhaProt(["dns"])}<p class="peq suave">Nos PCs, o Servidor DNS tem de ser o IP deste servidor. Toque numa linha da tabela para a editar.</p></form>`;
          const f = pane.querySelector("form"), m = f.querySelector("[data-m]");
          radios(f, "on", (v) => { s.dns.on = v; });
          const ler2 = () => ({ nome: f.elements.nome.value.trim(), ip: f.elements.ip.value.trim() });
          const ok2 = (v) => { if (!v.nome || !S.ehIP(v.ip)) { m.textContent = "Escreva um nome e um endereço IP válido."; return false; } return true; };
          f.onsubmit = (e) => { e.preventDefault(); const v = ler2(); if (!ok2(v)) return; if (R.some((r) => r.nome.toLowerCase() === v.nome.toLowerCase())) { m.textContent = "Já existe um registo com esse nome: selecione-o e use Guardar."; return; } R.push(v); dnsSel[d.id] = null; msg(`Registo DNS <b>${esc(v.nome)}</b> → ${esc(v.ip)}.`, "ok"); guardar(); };
          f.onclick = (e) => {
            const tr = e.target.closest("[data-sel]"); if (tr) { dnsSel[d.id] = +tr.dataset.sel; depois(d); return; }
            if (e.target.closest("[data-save]") && R[i0]) { const v = ler2(); if (!ok2(v)) return; R[i0] = v; guardar(); }
            if (e.target.closest("[data-rem]") && R[i0]) { R.splice(i0, 1); dnsSel[d.id] = null; guardar(); }
          };
          return;
        }
        if (k === "tftp") {
          pane.innerHTML = `<div class="sim-form sim-pt">${tit("TFTP", "Service")}${onOff("on", s.tftp.on)}<div class="tabela-caixa"><table><thead><tr><th>Ficheiro</th><th></th></tr></thead><tbody>${s.tftp.ficheiros.map((x, k2) => `<tr><td><code>${esc(x)}</code></td><td><button type="button" class="btn-copiar" data-tirar="${k2}">Remover</button></td></tr>`).join("") || '<tr><td colspan="2" class="suave">Sem ficheiros.</td></tr>'}</tbody></table></div>
            ${linhaProt(["tftp"])}<p class="peq suave">Guarda imagens do IOS e cópias de configurações. Copiar para cá com <code>copy running-config tftp</code> ainda não é simulado.</p></div>`;
          radios(pane, "on", (v) => { s.tftp.on = v; });
          pane.onclick = (e) => { const b = e.target.closest("[data-tirar]"); if (b) { s.tftp.ficheiros.splice(+b.dataset.tirar, 1); guardar(); } };
          return;
        }
        if (k === "syslog") {
          pane.innerHTML = `<div class="sim-form sim-pt">${tit("SYSLOG", "Service")}${onOff("on", s.syslog.on)}<div class="tabela-caixa"><table><thead><tr><th>Hora</th><th>Equipamento</th><th>Mensagem</th></tr></thead><tbody>${s.syslog.msgs.map((x) => `<tr><td>${esc(x.hora)}</td><td>${esc(x.de)}</td><td>${esc(x.txt)}</td></tr>`).join("") || '<tr><td colspan="3" class="suave">Sem mensagens.</td></tr>'}</tbody></table></div>
            ${linhaProt(["syslog"])}<p class="peq suave">Nos routers: <code>logging host ${esc(rede.ipEfetivo(d).ip || "IP-do-servidor")}</code>. O comando fica na configuração; o envio das mensagens ainda não é simulado.</p></div>`;
          radios(pane, "on", (v) => { s.syslog.on = v; });
          return;
        }
        if (k === "aaa") {
          const A2 = s.aaa;
          pane.innerHTML = `<div class="sim-form sim-pt">${tit("AAA", "Service")}${onOff("on", A2.on)}
            <form class="sim-form" data-cli><b class="peq">Clientes da rede <small>Network Configuration</small></b><div class="grelha-2">${campo("nome", "Nome do cliente <small>Client Name</small>", "", 'placeholder="R1"')}${campo("ip", "IP do cliente <small>Client IP</small>", "", 'inputmode="decimal"')}</div>
              <div class="grelha-2">${campo("chave", "Chave <small>Secret</small>", "")}<label>Tipo de servidor <small>ServerType</small><select class="campo" name="tipo"><option>Radius</option><option>Tacacs</option></select></label></div><button class="btn" type="submit">Adicionar <small>Add</small></button>
              <div class="tabela-caixa"><table><thead><tr><th>Cliente</th><th>IP</th><th>Tipo</th><th>Chave</th><th></th></tr></thead><tbody>${A2.clientes.map((c, k2) => `<tr><td>${esc(c.nome)}</td><td>${esc(c.ip)}</td><td>${esc(c.tipo)}</td><td>${esc(c.chave)}</td><td><button type="button" class="btn-copiar" data-tc="${k2}">Remover</button></td></tr>`).join("") || '<tr><td colspan="5" class="suave">Sem clientes.</td></tr>'}</tbody></table></div></form>
            <form class="sim-form" data-usr><b class="peq">Utilizadores <small>User Setup</small></b><div class="grelha-2">${campo("user", "Utilizador <small>Username</small>", "")}${campo("pass", "Palavra-passe <small>Password</small>", "")}</div><button class="btn" type="submit">Adicionar <small>Add</small></button>
              <div class="tabela-caixa"><table><thead><tr><th>Utilizador</th><th>Palavra-passe</th><th></th></tr></thead><tbody>${A2.users.map((u, k2) => `<tr><td>${esc(u.user)}</td><td>${esc(u.pass)}</td><td><button type="button" class="btn-copiar" data-tu="${k2}">Remover</button></td></tr>`).join("") || '<tr><td colspan="3" class="suave">Sem utilizadores.</td></tr>'}</tbody></table></div></form>
            <p class="peq" data-m></p>${linhaProt(["radius", "tacacs"])}<p class="peq suave">Guarda os clientes e utilizadores como no Packet Tracer; o login dos routers por RADIUS/TACACS+ ainda não é simulado.</p></div>`;
          radios(pane, "on", (v) => { A2.on = v; });
          const m = pane.querySelector("[data-m]");
          pane.querySelector("[data-cli]").onsubmit = (e) => { e.preventDefault(); const v = Object.fromEntries(new FormData(e.target).entries()); if (!v.nome.trim() || !S.ehIP(v.ip.trim()) || !v.chave.trim()) { m.textContent = "Indique o nome, o IP e a chave do cliente."; return; } A2.clientes.push({ nome: v.nome.trim(), ip: v.ip.trim(), chave: v.chave.trim(), tipo: v.tipo }); guardar(); };
          pane.querySelector("[data-usr]").onsubmit = (e) => { e.preventDefault(); const v = Object.fromEntries(new FormData(e.target).entries()); if (!v.user.trim() || !v.pass) { m.textContent = "Indique o utilizador e a palavra-passe."; return; } A2.users.push({ user: v.user.trim(), pass: v.pass }); guardar(); };
          pane.onclick = (e) => { const a = e.target.closest("[data-tc]"), b = e.target.closest("[data-tu]"); if (a) { A2.clientes.splice(+a.dataset.tc, 1); guardar(); } if (b) { A2.users.splice(+b.dataset.tu, 1); guardar(); } };
          return;
        }
        if (k === "ntp") {
          const N = s.ntp;
          pane.innerHTML = `<form class="sim-form sim-pt" data-ntp>${tit("NTP", "Service")}${onOff("on", N.on)}<p class="peq">Data e hora do servidor: <b>${esc(new Date().toLocaleString("pt-PT"))}</b></p>
            <b class="peq">Autenticação <small>Authentication</small></b>${onOff("auth", N.auth, "Ativa <small>Enable</small>", "Inativa <small>Disable</small>")}
            <div class="grelha-2">${campo("chave", "Chave <small>Key</small>", N.chave, 'inputmode="numeric"')}${campo("pass", "Palavra-passe <small>Password</small>", N.pass)}</div><p class="peq" data-m></p>
            ${linhaProt(["ntp"])}<p class="peq suave">Nos routers: <code>ntp server ${esc(rede.ipEfetivo(d).ip || "IP-do-servidor")}</code>.</p></form>`;
          const f = pane.querySelector("form");
          radios(f, "on", (v) => { N.on = v; }); radios(f, "auth", (v) => { N.auth = v; });
          f.onsubmit = (e) => e.preventDefault();
          f.onchange = (e) => { if (e.target.name === "chave" || e.target.name === "pass") { N[e.target.name] = e.target.value.trim(); rede.mudou(); f.querySelector("[data-m]").textContent = "Guardado."; } };
          return;
        }
        if (k === "email") {
          const E = s.email;
          pane.innerHTML = `<div class="sim-form sim-pt">${tit("EMAIL", "Service")}<div class="grelha-2"><div><b class="peq">SMTP</b>${onOff("smtp", E.smtp)}</div><div><b class="peq">POP3</b>${onOff("pop3", E.pop3)}</div></div>
            <form class="sim-form" data-dom>${campo("dominio", "Nome de domínio <small>Domain Name</small>", E.dominio, 'placeholder="escola.local"')}<button class="btn" type="submit">Definir <small>Set</small></button></form>
            <form class="sim-form" data-usr><b class="peq">Utilizadores <small>User Setup</small></b><div class="grelha-2">${campo("user", "Utilizador", "")}${campo("pass", "Palavra-passe", "")}</div><button class="btn" type="submit">Adicionar <small>+</small></button>
              <div class="tabela-caixa"><table><thead><tr><th>Utilizador</th><th>Palavra-passe</th><th></th></tr></thead><tbody>${E.users.map((u, k2) => `<tr><td>${esc(u.user)}</td><td>${esc(u.pass)}</td><td><button type="button" class="btn-copiar" data-tu="${k2}">Remover</button></td></tr>`).join("") || '<tr><td colspan="3" class="suave">Sem utilizadores.</td></tr>'}</tbody></table></div></form>
            <p class="peq" data-m></p>${linhaProt(["smtp", "pop3"])}<p class="peq suave">As contas ficam guardadas; enviar e receber correio ainda não é simulado.</p></div>`;
          radios(pane, "smtp", (v) => { E.smtp = v; }); radios(pane, "pop3", (v) => { E.pop3 = v; });
          const m = pane.querySelector("[data-m]");
          pane.querySelector("[data-dom]").onsubmit = (e) => { e.preventDefault(); E.dominio = e.target.elements.dominio.value.trim(); guardar(); };
          pane.querySelector("[data-usr]").onsubmit = (e) => { e.preventDefault(); const v = Object.fromEntries(new FormData(e.target).entries()); if (!v.user.trim() || !v.pass) { m.textContent = "Indique o utilizador e a palavra-passe."; return; } E.users.push({ user: v.user.trim(), pass: v.pass }); guardar(); };
          pane.onclick = (e) => { const b = e.target.closest("[data-tu]"); if (b) { E.users.splice(+b.dataset.tu, 1); guardar(); } };
          return;
        }
        if (k === "ftp") {
          const P2 = s.ftp, PERM = [["W", "Escrita (Write)"], ["R", "Leitura (Read)"], ["D", "Apagar (Delete)"], ["N", "Renomear (Rename)"], ["L", "Listar (List)"]];
          pane.innerHTML = `<div class="sim-form sim-pt">${tit("FTP", "Service")}${onOff("on", P2.on)}
            <form class="sim-form" data-usr><b class="peq">Utilizadores <small>User Setup</small></b><div class="grelha-2">${campo("user", "Utilizador <small>Username</small>", "")}${campo("pass", "Palavra-passe <small>Password</small>", "")}</div>
              <div class="sim-perm">${PERM.map(([k2, t]) => `<label class="linha peq"><input type="checkbox" name="p${k2}" ${k2 === "R" || k2 === "L" ? "checked" : ""}> ${t}</label>`).join("")}</div><button class="btn" type="submit">Adicionar <small>Add</small></button>
              <div class="tabela-caixa"><table><thead><tr><th>Utilizador</th><th>Palavra-passe</th><th>Permissões</th><th></th></tr></thead><tbody>${P2.users.map((u, k2) => `<tr><td>${esc(u.user)}</td><td>${esc(u.pass)}</td><td><code>${esc(u.perm)}</code></td><td><button type="button" class="btn-copiar" data-tu="${k2}">Remover</button></td></tr>`).join("") || '<tr><td colspan="4" class="suave">Sem utilizadores.</td></tr>'}</tbody></table></div></form>
            <b class="peq">Ficheiros</b><ul class="sim-dns">${P2.ficheiros.map((x) => `<li><code>${esc(x)}</code></li>`).join("") || '<li class="suave">Sem ficheiros.</li>'}</ul>
            <p class="peq" data-m></p>${linhaProt(["ftp"])}<p class="peq suave">As contas ficam guardadas; o cliente <code>ftp</code> no Prompt ainda não é simulado.</p></div>`;
          radios(pane, "on", (v) => { P2.on = v; });
          pane.querySelector("[data-usr]").onsubmit = (e) => { e.preventDefault(); const f = e.target, v = Object.fromEntries(new FormData(f).entries()); if (!v.user.trim() || !v.pass) { pane.querySelector("[data-m]").textContent = "Indique o utilizador e a palavra-passe."; return; } P2.users.push({ user: v.user.trim(), pass: v.pass, perm: PERM.filter(([k2]) => f.elements["p" + k2].checked).map(([k2]) => k2).join("") }); guardar(); };
          pane.onclick = (e) => { const b = e.target.closest("[data-tu]"); if (b) { P2.users.splice(+b.dataset.tu, 1); guardar(); } };
        }
      });
    }

    // ------------------------------------------------------------ Ambiente de trabalho (Desktop): grelha de aplicações
    const ICON_APP = {
      ip: '<rect x="8" y="14" width="48" height="30" rx="4" fill="#2f6fdf"/><rect x="14" y="20" width="36" height="18" rx="2" fill="#dbe8ff"/><text x="32" y="34" font-size="12" font-weight="800" text-anchor="middle" fill="#123">IP</text><rect x="24" y="46" width="16" height="6" fill="#56637a"/><rect x="18" y="52" width="28" height="4" rx="2" fill="#56637a"/>',
      prompt: '<rect x="6" y="10" width="52" height="44" rx="5" fill="#0b1218"/><rect x="6" y="10" width="52" height="8" rx="4" fill="#3b4856"/><path d="M14 28 l8 6 -8 6" stroke="#7ccfff" stroke-width="3.5" fill="none" stroke-linecap="round"/><rect x="26" y="38" width="14" height="3.5" rx="1.5" fill="#d3ecd9"/>',
      web: '<circle cx="32" cy="32" r="23" fill="#1b8d4c"/><ellipse cx="32" cy="32" rx="10" ry="23" fill="none" stroke="#e7fff0" stroke-width="2.5"/><path d="M9 32 h46 M13 20 h38 M13 44 h38" stroke="#e7fff0" stroke-width="2.5"/>',
      wifi: '<circle cx="32" cy="46" r="5" fill="#8b5cf6"/><path d="M18 36 a20 20 0 0 1 28 0 M10 27 a31 31 0 0 1 44 0" stroke="#8b5cf6" stroke-width="5" fill="none" stroke-linecap="round"/>',
      partilhas: '<path d="M6 18 h18 l5 5 h29 v28 a3 3 0 0 1 -3 3 h-46 a3 3 0 0 1 -3 -3 z" fill="#e0a21a"/><rect x="6" y="26" width="52" height="28" rx="3" fill="#f5c04a"/><circle cx="40" cy="42" r="7" fill="#fff"/><path d="M36 42 h8 M40 38 v8" stroke="#e0a21a" stroke-width="2.5"/>',
    };
    const APPS = [["ip", "Configuração IP", "IP Configuration"], ["prompt", "Prompt de comando", "Command Prompt"], ["web", "Navegador web", "Web Browser"], ["wifi", "Sem fios", "PC Wireless"], ["partilhas", "Partilhas", "File Sharing"]];
    const appsDe = (d) => APPS.filter(([k]) => k !== "wifi" || S.temWifi(d)).filter(([k]) => k !== "partilhas" || ["pc", "portatil", "servidor"].includes(d.tipo));
    function desktop(corpo, d) {
      const apps = appsDe(d), a = apps.find(([k]) => k === appDesk[d.id]);
      if (d.desligado) { corpo.innerHTML = '<div class="sim-desk sim-desk-off"><p>Ecrã apagado.</p></div>'; return; }
      if (!a) {
        corpo.innerHTML = `<div class="sim-desk" role="list">${apps.map(([k, n, en]) => `<button type="button" role="listitem" class="sim-app" data-app="${k}"><svg viewBox="0 0 64 64" width="48" height="48" aria-hidden="true">${ICON_APP[k]}</svg><span>${esc(n)}</span><small>${esc(en)}</small></button>`).join("")}</div>`;
        corpo.querySelector(".sim-desk").onclick = (e) => { const b = e.target.closest("[data-app]"); if (b) { appDesk[d.id] = b.dataset.app; abrirInsp(d, "desktop", true); } };
        return;
      }
      corpo.innerHTML = `<div class="sim-app-jan"><div class="sim-app-tit"><svg viewBox="0 0 64 64" width="20" height="20" aria-hidden="true">${ICON_APP[a[0]]}</svg><b>${esc(a[1])}</b><small class="suave">${esc(a[2])}</small><button type="button" class="sim-jan-x" data-fechar-app aria-label="Fechar aplicação" title="Voltar ao ambiente de trabalho">×</button></div><div class="sim-app-corpo"></div></div>`;
      corpo.querySelector("[data-fechar-app]").onclick = () => { appDesk[d.id] = null; abrirInsp(d, "desktop", true); };
      const b = corpo.querySelector(".sim-app-corpo");
      if (a[0] === "ip") { b.innerHTML = ipHostHtml(d); ligarIpHost(b, d); }
      if (a[0] === "prompt") terminal(b, d, "pc");
      if (a[0] === "web") navegador(b, d);
      if (a[0] === "wifi") formWifiCliente(b, d);
      if (a[0] === "partilhas") formPartilhas(b, d);
    }
    function navegador(corpo, d) {
      const st = webEst[d.id] = webEst[d.id] || { url: "", html: null, erro: null };
      corpo.innerHTML = `<form class="sim-web-barra" data-web><span class="sim-web-url">URL</span><input class="campo mono" name="url" value="${esc(st.url)}" placeholder="http://www.escola.local" autocomplete="off" autocapitalize="off" spellcheck="false" inputmode="url"><button class="btn prim" type="submit">Ir <small>Go</small></button></form>
        <div class="sim-web-pag">${st.html != null ? `<iframe sandbox="" title="Página web" srcdoc="${esc(st.html)}"></iframe>` : st.erro ? `<div class="sim-web-erro"><b>${esc(st.erro[0])}</b><p class="peq">${esc(st.erro[1])}</p></div>` : '<div class="sim-web-erro"><p class="peq suave">Escreva o endereço IP ou o nome de um servidor web e toque em Ir.</p></div>'}</div>
        ${linhaProt(["http", "dns"], "O navegador pergunta o IP ao DNS (se escrever um nome), abre uma ligação TCP à porta 80 e pede a página com HTTP GET.")}`;
      corpo.querySelector("[data-web]").onsubmit = (e) => {
        e.preventDefault();
        const url = e.target.elements.url.value.trim(); st.url = url;
        const host = url.replace(/^[a-z]+:\/\//i, "").split(/[/:?#]/)[0];
        if (!host) return;
        st.html = null; st.erro = null;
        if (op.aoComando) op.aoComando("http " + host, d);
        if (!rede.ipEfetivo(d).ip) st.erro = ["Request Timeout", "Este equipamento não tem endereço IP (veja Configuração IP)."];
        else {
          const r0 = rede.resolver(d, host);
          if (!r0.ip) st.erro = ["Host Name Unresolved", r0.erro];
          else {
            const r = S.promptPC(rede, d, "http " + host);
            if (r.anim) animar(r.anim, r.ok);
            const alvo = rede.dono(r0.ip);
            if (r.ok && alvo && alvo.srv) st.html = srvDe(alvo).html || paginaPadrao(alvo);
            else st.erro = ["Request Timeout", String(r.txt || "").split("\n").filter(Boolean).pop() || "O servidor não respondeu."];
          }
        }
        if (sm.aberto) { sm.pedido = { de: d.id, tipo: "http", para: host }; gerarSim(); }
        navegador(corpo, d); atualizar();
      };
    }

    // ------------------------------------------------------------ cartão "Protocolo" do modo de simulação
    const PORTAS_PROT = { 80: "http", 443: "https", 23: "telnet", 22: "ssh", 445: "smb", 139: "smb", 53: "dns", 67: "dhcpv4", 68: "dhcpv4", 69: "tftp", 21: "ftp", 20: "ftp", 25: "smtp", 110: "pop3", 123: "ntp", 514: "syslog", 161: "snmp" };
    function protDoEvento(ev) {
      const txt = (ev.camadas || []).map((c) => c[1]).join(" "), ps = [/porta de destino (\d+)/, /porta de origem (\d+)/].map((re) => +((txt.match(re) || [])[1] || 0));
      const app = ps.map((p) => PORTAS_PROT[p]).find(Boolean);
      const base = { ARP: "arp", ICMP: "icmp", DHCP: "dhcpv4", DNS: "dns", STP: "stp", TCP: app || "tcp", UDP: app || "udp" }[ev.tipo];
      const extra = [];
      if (ev.tipo === "TCP" || ev.tipo === "UDP") extra.push(ev.tipo.toLowerCase());
      if (/IPv4/.test(txt)) extra.push("ipv4");
      if (/Ethernet II/.test(txt)) extra.push("ethernet");
      if (/802\.1Q/.test(txt)) extra.push("ieee8021q");
      return { id: base, extra: extra.filter((x) => x !== base) };
    }
    function cartaoProt(ev) {
      if (!ev || ev.tipo === "FALHA") return "";
      const { id, extra } = protDoEvento(ev); if (!id) return "";
      const p = prot(id);
      return `<div class="sim-prot-card"><span class="rotulo">Protocolo</span><b>${esc(p ? p.sigla : id.toUpperCase())}${p ? ` <span class="suave peq">${esc(p.nome)}</span>` : ""}</b>
        ${p ? `<span class="peq suave">Camada OSI ${esc(p.camada_osi)}${p.transporte && p.transporte !== "—" ? " · " + esc(p.transporte) : ""}${p.portas && p.portas !== "—" ? " · porta " + esc(p.portas) : ""}</span>` : ""}
        <p class="peq">${esc(resumoProt(id))}</p>
        ${extra.length ? `<p class="peq suave">Também nesta mensagem: ${extra.map((x) => `<button type="button" class="sim-saber" data-prot="${x}" title="${esc(resumoProt(x))}">${esc(siglaProt(x))}</button>`).join(" ")}</p>` : ""}
        ${p ? `<button type="button" class="btn peq" data-prot="${esc(id)}">Saber mais sobre ${esc(p.sigla)}</button>` : ""}</div>`;
    }

    // Pastas partilhadas (SMB): o equivalente a Propriedades › Partilha › Partilha avançada no Windows
    function formPartilhas(corpo, d) {
      const c = d.pc;
      corpo.innerHTML = `<div class="secao sim-form">
        <label class="linha"><input type="checkbox" data-fw ${c.fwPartilha ? "checked" : ""}> Firewall: permitir “Partilha de ficheiros e impressoras” (TCP 445)</label>
        <ul class="sim-dns">${c.partilhas.map((p, i) => `<li><b>\\\\${esc(d.nome)}\\${esc(p.nome)}</b> → <code>${esc(p.pasta)}</code> · Todos: ${p.perm === "W" ? "Alteração" : "Leitura"} · ${p.ficheiros.length} ficheiro(s) <button type="button" class="btn-copiar" data-tirar-p="${i}">deixar de partilhar</button></li>`).join("") || '<li class="suave peq">Nenhuma pasta partilhada.</li>'}</ul></div>
        <form class="secao sim-form" data-f="part"><b>Partilhar uma pasta</b>
        <label>Nome da partilha<input class="campo mono" name="nome" placeholder="Documentos" autocomplete="off"></label>
        <label>Pasta no disco<input class="campo mono" name="pasta" placeholder="C:\\Documentos" autocomplete="off"></label>
        <label>Permissão para Todos<select class="campo" name="perm"><option value="R">Leitura</option><option value="W">Alteração (ler e gravar)</option></select></label>
        <button class="btn prim" type="submit">Partilhar</button><p class="peq" id="sim-part-msg"></p>
        <p class="peq suave">Nos outros PCs: Prompt › <code>net view \\\\${esc(rede.ipEfetivo(d).ip || d.nome)}</code> e <code>net use Z: \\\\${esc(rede.ipEfetivo(d).ip || d.nome)}\\Nome</code></p></form>`;
      corpo.querySelector("[data-fw]").onchange = (e) => { c.fwPartilha = e.target.checked; rede.mudou(); atualizar(); msg(`Firewall de ${esc(d.nome)}: partilha ${c.fwPartilha ? "permitida" : "bloqueada"}.`, "ok"); };
      corpo.onclick = (e) => { const b = e.target.closest("[data-tirar-p]"); if (b) { c.partilhas.splice(+b.dataset.tirarP, 1); rede.mudou(); formPartilhas(corpo, d); atualizar(); } };
      const f = corpo.querySelector("form");
      f.onsubmit = (e) => {
        e.preventDefault(); const v = Object.fromEntries(new FormData(f).entries()), m = corpo.querySelector("#sim-part-msg");
        const nome = v.nome.trim();
        if (!/^[\w$-]{1,40}$/.test(nome)) { m.textContent = "Nome inválido: use letras, números, - ou _ (sem espaços)."; return; }
        if (c.partilhas.some((p) => p.nome.toLowerCase() === nome.toLowerCase())) { m.textContent = "Já existe uma partilha com esse nome."; return; }
        c.partilhas.push({ nome, pasta: v.pasta.trim() || "C:\\" + nome, perm: v.perm, ficheiros: [{ nome: "LEIA-ME.txt" }] });
        rede.mudou(); formPartilhas(corpo, d); atualizar(); msg(`Pasta <b>${esc(nome)}</b> partilhada em ${esc(d.nome)}.${c.fwPartilha ? "" : " Falta abrir a firewall (TCP 445)."}`, "ok");
      };
    }

    // Explicação de cada comando (window.Comandos.explicar, de comandos.js, se existir)
    const verEx = () => ler("ccna-sim-ex") !== "0";
    function explicarCmd(linha) {
      if (!window.Comandos || typeof window.Comandos.explicar !== "function" || !linha.trim() || /\?\s*$/.test(linha)) return null;
      try { const r = window.Comandos.explicar(linha); return r && r.o_que_faz ? r : null; } catch (e) { return null; }
    }
    function htmlEx(x) {
      const mais = [["porque", "Porquê"], ["modo", "Modo"], ["exemplo", "Exemplo"], ["cuidado", "Cuidado"], ["desfazer", "Para desfazer"]].filter(([k]) => x[k]).map(([k, n]) => `<p><b>${n}:</b> ${esc(x[k])}</p>`).join("");
      return `<details class="sim-cmd-ex"><summary>ℹ ${esc(x.o_que_faz)}</summary>${mais || "<p>Sem mais detalhes.</p>"}</details>`;
    }
    // o título da janela segue o nome do equipamento (o hostname pode ter mudado na CLI)
    function atualizarTitulo(d) { const t = $("#sim-insp .sim-jan-nome b"); if (t && sel === d.id && t.textContent !== d.nome) { t.textContent = d.nome; } }
    function terminal(corpo, d, tipo) {
      const id = d.id + tipo;
      if (tipo === "ios") logTerm(d);
      else if (!logs[id]) logs[id] = [{ t: `Prompt de ${d.nome}. Escreva help para ver os comandos.\n` }];
      hist[id] = hist[id] || []; hIdx[id] = hist[id].length;
      const prompt = () => tipo === "ios" ? d.eq.prompt() : "C:\\>";
      corpo.innerHTML = `<div class="term"><div class="consola sim-consola" id="sim-cons"></div>
        <form class="entrada" data-f="t"><label for="sim-in" id="sim-pr">${esc(prompt())}</label><input id="sim-in" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="send" aria-label="Comando"></form>
        <div class="teclas">${tipo === "ios" ? '<button type="button" data-k="?">?</button><button type="button" data-k="tab">Tab</button>' : ""}<button type="button" data-k="up">↑</button><button type="button" data-k="down">↓</button>${window.Comandos ? `<button type="button" data-k="ex" aria-pressed="${verEx()}" title="Mostrar o que faz cada comando">ℹ Explicar</button>` : ""}${tipo === "ios" ? '<button type="button" data-k="end">Ctrl+Z</button><button type="button" data-k="sh ip int br">sh ip int br</button><button type="button" data-k="sh run">show run</button>' : '<button type="button" data-k="ipconfig">ipconfig</button><button type="button" data-k="ipconfig /renew">/renew</button><button type="button" data-k="net use">net use</button><button type="button" data-k="help">help</button>'}</div></div>
        ${tipo === "ios" ? `<div class="sim-colar"><button type="button" class="btn peq" data-colar>Colar configuração</button>
          <form class="secao sim-form" data-colar-caixa hidden><label>Comandos, um por linha (como colar no PuTTY)<textarea class="campo mono" rows="7" spellcheck="false" autocapitalize="off" autocorrect="off" placeholder="enable&#10;configure terminal&#10;hostname R1&#10;interface g0/0/0&#10; ip address 192.168.1.1 255.255.255.0&#10; no shutdown&#10;end"></textarea></label>
          <div class="grelha-2"><button type="button" class="btn" data-colar-cancelar>Cancelar</button><button class="btn prim" type="submit">Executar</button></div><p class="peq" data-colar-msg></p></form></div>` : ""}`;
      const cons = corpo.querySelector("#sim-cons"), inp = corpo.querySelector("#sim-in");
      const pinta = () => { if (tipo === "ios" && d.eq.pendentes && d.eq.pendentes.length) { logs[id].push({ t: d.eq.pendentes.join("\n") }); d.eq.pendentes = []; } cons.innerHTML = logs[id].map((l) => l.c != null ? `<div${l.cfg ? ' class="sim-cfg-cmd" title="Feito no separador Configuração"' : ""}><span class="pr">${esc(l.p)}</span><span class="in">${esc(l.c)}</span></div>${l.t ? `<div class="${l.erro ? "err" : ""}">${esc(l.t)}</div>` : ""}${l.ex && verEx() ? htmlEx(l.ex) : ""}` : `<div>${esc(l.t)}</div>`).join(""); cons.scrollTop = cons.scrollHeight; corpo.querySelector("#sim-pr").textContent = prompt(); };
      const correr = (linha, manter, lote) => {
        const p = prompt();
        if (op.aoComando) op.aoComando(linha, d);
        const ex = explicarCmd(linha);
        if (tipo === "ios") {
          const h0 = d.eq.cfg.hostname;
          // ao colar, "enable" já em modo privilegiado não é erro (como no equipamento real)
          const out = lote && /^\s*en(a(b(le?)?)?)?\s*$/i.test(linha) && d.eq.modo !== "user" ? "" : d.eq.executar(linha);
          if (out === "\f") logs[id] = []; else logs[id].push({ p, c: linha, t: out, erro: /% (Invalid|Incomplete|Unrecognized|Ambiguous|Bad)/.test(out), ex });
          aposHostname(d, h0);
          rede.mudou();
          const m = linha.trim().match(/^(?:do\s+)?(?:ping|traceroute|tr|tracert)\s+(\S+)/i);
          if (m && window.IOS) { const r = rede.pingCompleto(d, m[1]); animar(r.devs, r.ok); }
        } else {
          const r = S.promptPC(rede, d, linha);
          if (r.limpar) logs[id] = []; else logs[id].push({ p, c: linha, t: r.txt, erro: r.ok === false, ex });
          if (r.mudou) rede.mudou();
          if (r.anim) animar(r.anim, r.ok);
          const pg = linha.trim().match(/^(ping|telnet|http|web|nslookup)\s+(\S+)/i);
          if (pg && sm.aberto) { sm.pedido = { de: d.id, tipo: { ping: "ping", telnet: "telnet", http: "http", web: "http", nslookup: "dns" }[pg[1].toLowerCase()], para: pg[2] }; gerarSim(); }
        }
        if (linha.trim() && !linha.endsWith("?")) { hist[id].push(linha); hIdx[id] = hist[id].length; }
        inp.value = manter ? linha.replace(/\?$/, "") : "";
        if (!lote) { pinta(); atualizar(); atualizarTitulo(d); }
      };
      const cx = corpo.querySelector("[data-colar-caixa]");
      if (cx) {
        const ta = cx.querySelector("textarea"), cm = cx.querySelector("[data-colar-msg]");
        corpo.querySelector("[data-colar]").onclick = () => { cx.hidden = !cx.hidden; if (!cx.hidden) ta.focus({ preventScroll: true }); };
        cx.querySelector("[data-colar-cancelar]").onclick = () => { cx.hidden = true; };
        cx.onsubmit = (e) => {
          e.preventDefault();
          const ls = ta.value.replace(/\r/g, "").split("\n").filter((l) => l.trim() && !/^\s*!/.test(l));
          if (!ls.length) { cm.textContent = "Cole ou escreva pelo menos um comando."; return; }
          const n0 = logs[id].length;
          ls.forEach((l) => correr(l.replace(/\s+$/, ""), false, true));
          const erros = logs[id].slice(n0).filter((l) => l.erro).length;
          pinta(); atualizar(); atualizarTitulo(d);
          cm.innerHTML = `${ls.length} linha(s) executada(s)${erros ? `, <b class="sim-erro-txt">${erros} com erro</b> (a vermelho no terminal)` : ", sem erros"}.`;
          if (!erros) ta.value = "";
        };
      }
      corpo.querySelector("form").onsubmit = (e) => { e.preventDefault(); correr(inp.value); };
      const hist1 = (k) => { hIdx[id] = Math.max(0, Math.min(hist[id].length, hIdx[id] + k)); inp.value = hist[id][hIdx[id]] || ""; };
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Tab" && tipo === "ios") { e.preventDefault(); inp.value = d.eq.completar(inp.value); }
        else if (e.key === "ArrowUp") { e.preventDefault(); hist1(-1); }
        else if (e.key === "ArrowDown") { e.preventDefault(); hist1(1); }
        else if (e.key === "?" && tipo === "ios") { e.preventDefault(); correr(inp.value + "?", true); }
        else if (e.key === "z" && e.ctrlKey && tipo === "ios") { e.preventDefault(); correr("end"); }
      });
      corpo.querySelector(".teclas").onclick = (e) => {
        const b = e.target.closest("[data-k]"); if (!b) return; const k = b.dataset.k;
        if (k === "ex") { gravar("ccna-sim-ex", verEx() ? "0" : "1"); b.setAttribute("aria-pressed", String(verEx())); pinta(); return; }
        if (k === "?") correr(inp.value + "?", true); else if (k === "tab") inp.value = d.eq.completar(inp.value);
        else if (k === "up") hist1(-1); else if (k === "down") hist1(1); else if (k === "end") correr("end");
        else if (tipo === "ios") correr(["user", "priv"].includes(d.eq.modo) ? (k === "sh run" ? "show running-config" : "show ip interface brief") : (k === "sh run" ? "do show running-config" : "do show ip interface brief"));
        else correr(k);
        inp.focus({ preventScroll: true });
      };
      pinta();
      if (window.matchMedia("(min-width: 700px)").matches) inp.focus({ preventScroll: true });
    }

    // ------------------------------------------------------------ guardar imagem (PNG) e relatório (.txt)
    const hoje = () => { const d = new Date(), z = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`; };
    function baixar(nome, blob) {
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nome;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    }
    // as cores vêm do CSS (variáveis do tema): copia os estilos calculados para cada elemento da cópia
    const PROPS = ["fill", "fill-opacity", "stroke", "stroke-width", "stroke-dasharray", "stroke-linecap", "stroke-linejoin", "stroke-opacity", "opacity", "font-family", "font-size", "font-weight", "text-anchor", "paint-order", "visibility"];
    function guardarImagem() {
      const sel0 = sel; sel = null; caboA = null; desenhar(); // sem marcas de seleção na imagem
      const cl = svg.cloneNode(true), orig = svg.querySelectorAll("*"), copia = cl.querySelectorAll("*");
      orig.forEach((el, i) => { const cs = getComputedStyle(el); copia[i].setAttribute("style", PROPS.map((p) => `${p}:${cs.getPropertyValue(p)}`).join(";")); });
      cl.querySelectorAll("[data-so-ecra], #sim-pacote, #sim-rasc").forEach((x) => x.remove());
      const b0 = vista === "logica" ? limites() : null, vbF = svg.viewBox.baseVal;
      const b = b0 ? { x: b0.x - 24, y: b0.y - 24, w: b0.w + 48, h: b0.h + 48 } : { x: vbF.x, y: vbF.y, w: vbF.width, h: vbF.height };
      const k = Math.min(2, 4000 / Math.max(b.w, b.h)), cw = Math.round(b.w * k), ch = Math.round(b.h * k);
      cl.setAttribute("viewBox", `${b.x} ${b.y} ${b.w} ${b.h}`); cl.setAttribute("width", cw); cl.setAttribute("height", ch); cl.removeAttribute("style");
      const fundo = getComputedStyle(svg.parentNode).backgroundColor || "#ffffff";
      cl.insertAdjacentHTML("afterbegin", `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="${fundo}"/>`);
      sel = sel0; desenhar();
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas"); c.width = cw; c.height = ch;
        c.getContext("2d").drawImage(img, 0, 0, cw, ch);
        c.toBlob((bl) => { if (!bl) { msg("Não foi possível criar a imagem.", "erro"); return; } baixar(`topologia-${hoje()}.png`, bl); msg(`Imagem <b>topologia-${hoje()}.png</b> guardada (${vista === "fisica" ? "vista física" : "vista lógica"}).`, "ok"); }, "image/png");
      };
      img.onerror = () => msg("Não foi possível criar a imagem.", "erro");
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(cl));
    }

    function textoRelatorio(so) {
      const L = [], pre = (m) => (m && S.mascaraOk(m) ? "/" + window.IOS.prefixo(m) : ""), col = (t, n) => String(t).padEnd(n);
      const outro = (d, l) => { const eu = l.a === d.id; return `${rede.dev(eu ? l.b : l.a).nome} ${curto(eu ? l.pb : l.pa)}`; };
      L.push(`RELATÓRIO DA REDE — ${new Date().toLocaleString("pt-PT")}`);
      if (A) L.push("Atividade: " + (A.titulo || A.id));
      const nn = (n, a, b) => `${n} ${n === 1 ? a : b}`;
      L.push([nn(rede.devs.length, "equipamento", "equipamentos"), nn(rede.links.length, "cabo", "cabos"), nn(rede.areas.length, "área", "áreas"), nn(rede.notas.length, "nota", "notas")].join(" · "));
      if (so) L.length = 0;
      rede.devs.filter((d) => !so || d.id === so).forEach((d) => {
        const loc = localDe(d), T = S.TIPOS[d.tipo];
        L.push("", `══ ${d.nome} — ${T.nome}${d.modelo ? " " + d.modelo : ""}${loc ? " · local: " + loc.nome : ""}`);
        if (d.eq) {
          const c = d.eq.cfg; let semUso = 0;
          L.push(`Hostname: ${c.hostname}`, "Interfaces:");
          [...new Set(rede.portas(d).filter((p) => p !== "Console").concat(Object.keys(c.interfaces)))].forEach((p) => {
            const i = c.interfaces[p] || {}, l = rede.linkDe(d, p), virt = /^(Vlan|Loopback)/.test(p) || p.includes("."), cf = cfgPorta(d, p);
            if (!l && !virt && (!cf || cf === "VLAN 1") && !i.desc) { semUso++; return; }
            const est = virt ? (i.shutdown ? "desligada" : d.eq.sim.ligada(p) ? "ativa" : "em baixo") : estadoPorta(d, p);
            L.push(`  ${col(curto(p), 12)} ${col(cf || "—", 20)} ${col(est, 11)}${l ? " → " + outro(d, l) : ""}${i.desc ? ` (${i.desc})` : ""}`);
          });
          if (semUso) L.push(`  (+ ${semUso} porta(s) sem cabo nem configuração)`);
          if (d.eq.tipo === "switch") L.push("VLANs: " + (Object.entries(c.vlans || {}).map(([v, n]) => `${v} ${n}`).join(", ") || "—"));
        } else if (d.pc) {
          const e = rede.ipEfetivo(d), c = d.pc;
          if (!T.semIp) L.push(`IP: ${e.ip || "sem endereço"}${pre(e.mask)}  máscara ${e.mask || "—"}`, `Gateway: ${e.gw || "—"}  ·  DNS: ${e.dns || "—"}`, `DHCP: ${c.dhcp ? "sim" + (c.lease && c.lease.apipa ? " (APIPA: nenhum servidor respondeu)" : c.lease ? " (recebido de " + (c.lease.de || "?") + ")" : " (à espera)") : "não (estático)"}`);
          if (S.temWifi(d) && c.wifi.ssid) L.push(`Wi-Fi: “${c.wifi.ssid}” — ${rede.wifi().estado[d.id] || ""}`);
          if (d.srv) { L.push(`Serviço DHCP: ${d.srv.dhcp.on ? `ligado, a partir de ${d.srv.dhcp.inicio} ${d.srv.dhcp.mask}, gateway ${d.srv.dhcp.gw || "—"}, DNS ${d.srv.dhcp.dns || "—"}` : "desligado"}`); if (d.srv.dns.registos.length) L.push("DNS: " + d.srv.dns.registos.map((r) => `${r.nome} → ${r.ip}`).join(", ")); }
          if (c.partilhas && c.partilhas.length) L.push("Partilhas: " + c.partilhas.map((p) => `\\\\${d.nome}\\${p.nome}`).join(", "));
          if (d.wlc) L.push("WLANs: " + d.wlc.wlans.map((w) => `${w.ssid} (${w.seguranca})`).join(", "));
        } else if (d.ap) L.push(`SSID: ${d.ap.ssid} · ${d.ap.seguranca === "wpa2" ? "WPA2" : "aberta"} · canal ${d.ap.canal}`);
        else if (d.rw) { const w = rede.wanRW(d); L.push(`Internet: ${w.ip || "sem endereço"}${pre(w.mask)} gateway ${w.gw || "—"}`, `LAN: ${d.rw.lan.ip}${pre(d.rw.lan.mask)} · DHCP ${d.rw.lan.dhcp.on ? "ligado" : "desligado"}`, `Wi-Fi: ${d.rw.wifi.ssid} (${d.rw.wifi.seguranca})`); }
        else if (d.asa) { Object.entries(d.asa.ifs).filter(([, i]) => i.nome).forEach(([n, i]) => { const e = i.modo === "dhcp" ? (i.lease || {}) : i; L.push(`  ${col(curto(n), 12)} ${col(i.nome + " (" + i.nivel + ")", 16)} ${e.ip ? e.ip + pre(e.mask) : "sem IP"}`); }); L.push(`NAT: ${d.asa.nat ? "sim" : "não"} · inspeção ICMP: ${d.asa.icmp ? "sim" : "não"}`); }
        else if (d.nuvem) Object.entries(d.nuvem.portas).forEach(([n, p]) => L.push(`  ${col(n, 12)} ${p.ip}${pre(p.mask)}${p.dhcp ? " · DHCP" : ""}`));
        // rotas (routers, switches L3, routers Wi-Fi e ASA)
        if (rede.encaminha(d)) {
          const rs = rede.tabela(d);
          L.push("Rotas:"); rs.forEach((r) => L.push(`  ${r.tipo} ${col(r.net + pre(r.mask), 19)} ${r.via ? "via " + r.via : "ligada"}, ${curto(r.iface.iface)}`));
          if (!rs.length) L.push("  (tabela vazia)");
        }
        if (d.eq) {
          const m = { modo: d.eq.modo, ctx: d.eq.ctx }; let rc;
          try { rc = d.eq.runningConfig(); } catch (e) { rc = "(não foi possível gerar)"; } finally { Object.assign(d.eq, m); }
          L.push("show running-config:"); rc.split("\n").forEach((x) => L.push("  " + x));
        }
      });
      if (so) return L.join("\n").replace(/^\n/, "");
      if (rede.links.length) {
        L.push("", "══ Cabos (comprimento estimado: 1 % do desenho ≈ 1 m)");
        rede.links.forEach((l) => { const e = rede.estadoLink(l), da = rede.dev(l.a), db = rede.dev(l.b); L.push(`  ${da.nome} ${curto(l.pa)} ↔ ${db.nome} ${curto(l.pb)} · ${(S.CABOS[l.cabo] || {}).nome || l.cabo} · ${metros(l)} m · ${e.estado}${longoDemais(l) ? " · ⚠ " + AVISO_100 : ""}`); });
      }
      if (rede.areas.length) { L.push("", "══ Locais"); locais().forEach((x) => L.push(`  ${x.nome}: ${x.devs.map((d) => d.nome).join(", ") || "vazio"}`)); }
      if (rede.notas.length) { L.push("", "══ Notas"); rede.notas.forEach((n) => L.push("  • " + n.texto.replace(/\n/g, " / "))); }
      return L.join("\n");
    }
    function relatorio() {
      const t = textoRelatorio(), md = $("#sim-modal"); md.hidden = false;
      md.innerHTML = `<div class="sim-caixa sim-rel-caixa"><div class="linha entre"><b>Relatório da rede</b><button class="btn-copiar" data-fechar>Fechar</button></div>
        <p class="peq suave">Todos os equipamentos com interfaces, endereços, VLANs, rotas e a running-config dos routers e switches.</p>
        <pre class="sim-rel">${esc(t)}</pre>
        <div class="grelha-2"><button class="btn" data-fechar>Fechar</button><button class="btn prim" data-baixar-rel>Baixar relatório (.txt)</button></div></div>`;
      md.onclick = (e) => {
        if (e.target.closest("[data-fechar]") || e.target === md) { md.hidden = true; return; }
        if (e.target.closest("[data-baixar-rel]")) baixar(`relatorio-rede-${hoje()}.txt`, new Blob(["﻿" + t.replace(/\n/g, "\r\n")], { type: "text/plain;charset=utf-8" }));
      };
    }

    function ajuda() {
      const md = $("#sim-modal"); md.hidden = false;
      md.innerHTML = `<div class="sim-caixa"><div class="linha entre"><b>Como usar o simulador</b><button class="btn-copiar" data-fechar>Fechar</button></div>
        <ol class="sim-ajuda">${AJUDA.map(([t, d]) => `<li><b>${t}.</b> ${d}</li>`).join("")}</ol>
        <p class="peq suave">O simulador calcula a camada 2 (VLANs, access, trunk, VLAN nativa), a camada 3 (gateway, rotas ligadas, estáticas, por defeito, OSPF), router-on-a-stick, SVIs, DHCP e DNS. Também simula a partilha de pastas (SMB: net share, net view, net use, firewall). Também calcula as ACL (o pacote é mesmo descartado e o show access-lists conta as linhas), a NAT/PAT e a NAT estática, o Spanning Tree (portas bloqueadas a laranja), o EtherChannel, o HSRP e as mensagens de debug. No modo <b>▶ Simulação</b> vê cada mensagem (ARP, ICMP, DHCP, DNS, TCP) a passar cabo a cabo, com o que vai em cada camada.</p>
        <button class="btn prim bloco" data-fechar>Começar</button></div>`;
      md.onclick = (e) => { if (e.target.closest("[data-fechar]") || e.target === md) md.hidden = true; };
      gravar("ccna-sim-ajuda", "1");
    }

    raiz.querySelector(".sim").addEventListener("click", (e) => {
      const pr = e.target.closest("[data-prot]");
      if (pr) { irProtocolo(pr.dataset.prot); return; }
      const b = e.target.closest("[data-s]");
      if (b) {
        const a = b.dataset.s;
        // as ferramentas de desenho voltam à vista lógica
        if (["mover", "apagar", "add", "cabo", "area", "nota"].includes(a) && vista === "fisica") { vista = "logica"; aplicarVB(); }
        if (a === "mover" || a === "apagar") { modo = a; menu = null; caboA = null; msg(a === "apagar" ? "Toque num equipamento, cabo, área ou nota para apagar." : "Arraste para mover (no vazio desloca o desenho); toque para configurar."); }
        if (a === "add") { menu = menu === "add" ? null : "add"; }
        if (a === "cabo") { modo = "cabo"; menu = "add"; grupo = "cabos"; caboA = null; msg(`Cabo <b>${esc(S.CABOS[cabo].nome)}</b>: toque no primeiro equipamento e escolha a porta (ou mude o tipo de cabo em Ligações).`); }
        if (a === "mais") menu = menu === "mais" ? null : "mais";
        if (a === "simul") { abrirSim(!sm.aberto); return; }
        if (a === "area") { modo = "area"; menu = null; caboA = null; msg("<b>Área:</b> arraste no desenho para criar um retângulo (ex.: Edifício A, Sala de servidores). Um toque cria uma área de tamanho padrão."); }
        if (a === "nota") { modo = "nota"; menu = null; caboA = null; msg("<b>Nota:</b> toque no sítio do desenho onde quer a nota."); }
        if (a === "desfazer" || a === "refazer") { historia(a === "desfazer" ? -1 : 1); opcoes(); return; }
        if (a === "logica" || a === "fisica") { vista = a; menu = null; caboA = null; if (a === "logica") { aplicarVB(); msg("Vista lógica: equipamentos, cabos e endereços."); } opcoes(); desenhar(); if (a === "fisica") resumoFisica(); return; }
        if (a === "imagem") { menu = null; opcoes(); guardarImagem(); return; }
        if (a === "relatorio") { menu = null; opcoes(); relatorio(); return; }
        if (a === "ajuda") ajuda();
        if (a === "reiniciar") {
          const md = $("#sim-modal"); md.hidden = false;
          md.innerHTML = `<div class="sim-caixa"><b>Recomeçar a atividade?</b><p class="peq">Volta à rede inicial e perde as configurações feitas.</p><div class="grelha-2"><button class="btn" data-fechar>Cancelar</button><button class="btn prim" data-confirmar>Recomeçar</button></div></div>`;
          md.onclick = (ev) => {
            if (ev.target.closest("[data-fechar]") || ev.target === md) { md.hidden = true; return; }
            if (ev.target.closest("[data-confirmar]")) { md.hidden = true; rede = A ? S.Rede.deAtividade(A) : new S.Rede(); ligarRede(); rede.aoMudar(); feito = false; Object.keys(logs).forEach((k) => delete logs[k]); Object.keys(iosLog).forEach((k) => delete iosLog[k]); fecharInsp(); atualizar(); msg("Atividade recomeçada."); }
          };
        }
        opcoes(); desenhar(); return;
      }
      const z = e.target.closest("[data-z]");
      if (z) { if (z.dataset.z === "ajustar") ajustar(); else zoomEm(z.dataset.z === "mais" ? 1 / 1.3 : 1.3); return; }
      const gr = e.target.closest("[data-grupo]");
      if (gr) { grupo = gr.dataset.grupo; opcoes(); return; }
      const ct = e.target.closest("[data-cat]");
      if (ct) { categoria = +ct.dataset.cat; opcoes(); return; }
      const ad = e.target.closest("[data-add]");
      if (ad) { const p = lugarLivre(); const d = rede.novoDev(ad.dataset.add, p.x, p.y, null, { modelo: ad.dataset.modelo || undefined }); rede.mudou(); if (modo === "cabo" || modo === "apagar") { modo = "mover"; caboA = null; } opcoes(); msg(`Adicionado <b>${esc(d.nome)}</b>. Arraste para mover ou toque para configurar.`, "ok"); atualizar(); return; }
      const cb = e.target.closest("[data-cabo]");
      if (cb) { cabo = cb.dataset.cabo; modo = "cabo"; caboA = null; opcoes(); desenhar(); msg(`Cabo <b>${esc(S.CABOS[cabo].nome)}</b>: toque no primeiro equipamento e escolha a porta.`); }
    });

    // atalhos de teclado (computador): Ctrl+Z / Ctrl+Y, Ctrl+C / Ctrl+V
    const teclado = (e) => {
      if (!raiz.isConnected || !(e.ctrlKey || e.metaKey) || e.altKey) return;
      if (e.target.closest && e.target.closest("input, textarea, select, [contenteditable]")) return;
      if (!$("#sim-modal").hidden) return;
      const k = e.key.toLowerCase();
      if (k === "z" || k === "y") { e.preventDefault(); historia(k === "y" || e.shiftKey ? 1 : -1); }
      else if (k === "c" && sel && !String(window.getSelection ? window.getSelection() : "")) { const d = rede.dev(sel); if (d) { copiar(d); msg(`<b>${esc(d.nome)}</b> copiado. Ctrl+V cria uma cópia.`); } }
      else if (k === "v" && copiado && vista === "logica") { e.preventDefault(); colar(); }
    };
    document.addEventListener("keydown", teclado);

    opcoes(); atualizar();
    if (!ler("ccna-sim-ajuda")) setTimeout(ajuda, 200);
    return { parar() { if (mainEl) mainEl.classList.remove("main-sim"); clearInterval(sm.auto); clearTimeout(tGuardar); clearTimeout(tFoto); document.removeEventListener("keydown", teclado); if (op.aoGuardar) op.aoGuardar(rede.exportar()); }, rede: () => rede };
  }

  window.SimUI = { montar };
})();
