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
    ["Adicionar equipamentos", "Toque em <b>+ Equipamento</b>. Como no Packet Tracer, escolha a categoria (Routers, Switches, Hubs, Sem fios, Segurança, WAN e Internet, Dispositivos finais, IoT) e depois o modelo: ISR 4331, 1941, Catalyst 2960, 3560, hub, access point, router Wi-Fi, ASA, PC de mesa, portátil, servidor, impressora, telefone IP, smartphone…"],
    ["Wi-Fi", "Os equipamentos sem fios não levam cabo: no access point ou no router Wi-Fi defina o SSID e a palavra-passe; no portátil, smartphone ou tablet (separador <b>Sem fios</b>) escreva o mesmo SSID e a mesma palavra-passe. A ligação aparece a tracejado roxo."],
    ["Mover", "Com a ferramenta <b>Mover</b>, arraste o equipamento. Um toque curto abre o painel de configuração."],
    ["Ligar cabos", "Toque em <b>Cabo</b> e escolha o tipo: <b>Automático</b> escolhe o cabo e a porta certos; <b>Direto</b> liga equipamentos diferentes (PC–switch, switch–router); <b>Cruzado</b> liga iguais (switch–switch, router–router, PC–router); <b>Consola</b> liga a porta RS232 do PC à porta Console. Toque no primeiro equipamento, escolha a porta, toque no segundo e escolha a porta."],
    ["Ler as luzes", "<span class='luz ok'></span> verde: ligação a funcionar. <span class='luz baixo'></span> laranja: a porta está desligada (falta <code>no shutdown</code> no router). <span class='luz errado'></span> vermelho: cabo errado ou portas incompatíveis — toque no cabo para ver a correção."],
    ["Configurar routers e switches", "Toque no equipamento › separador <b>CLI</b>. Escreva os comandos Cisco como no equipamento real: <code>enable</code>, <code>configure terminal</code>… Use <code>?</code> para ajuda e Tab para completar."],
    ["Configurar PCs e servidores", "Toque no PC › <b>Configuração IP</b>: escolha Estático (IP, máscara, gateway, DNS) ou DHCP. No servidor há também o separador <b>Serviços</b> (DHCP e DNS)."],
    ["Testar", "No PC › <b>Prompt</b>: <code>ping 192.168.1.1</code>, <code>tracert</code>, <code>ipconfig /all</code>, <code>ipconfig /renew</code>, <code>nslookup</code>. Veja o pacote a andar pelos cabos: verde chegou, vermelho falhou (e o motivo aparece no fim)."],
    ["Desfazer, zoom e deslocar", "<b>↶</b> desfaz e <b>↷</b> refaz (até 50 passos; no computador Ctrl+Z e Ctrl+Y). Afaste ou aproxime com dois dedos, com a roda do rato ou com <b>+</b> / <b>−</b>; arraste no vazio para deslocar o desenho. <b>Ajustar</b> mostra tudo."],
    ["Duplicar", "Com um equipamento aberto, toque em <b>Duplicar</b> (ou Ctrl+C e Ctrl+V): cria uma cópia com a mesma configuração, sem cabos. Num PC com IP estático o IP fica em branco para não repetir."],
    ["Colar configuração", "No separador <b>CLI</b> de routers e switches, <b>Colar configuração</b> executa vários comandos de uma vez, um por linha, como no PuTTY. As linhas com erro ficam a vermelho."],
    ["Áreas e notas", "Em <b>Mais</b>: <b>Área</b> desenha um retângulo com nome (Edifício A, Sala de servidores…); arraste-a pelo nome e mude o tamanho pelo canto. <b>Nota</b> põe um texto no desenho. Toque numa área ou nota para editar, mudar a cor ou apagar."],
    ["Vista física", "<b>Física</b> mostra a rede por locais: cada área é um edifício ou sala, com os routers e switches num bastidor e os PCs em secretárias. Os cabos mostram o comprimento estimado; um cabo de cobre com mais de 100 m fica a vermelho."],
    ["Imagem e relatório", "Em <b>Mais</b>: <b>Imagem</b> guarda a topologia em PNG; <b>Relatório</b> lista todos os equipamentos com interfaces, IP, VLANs, rotas e running-config, e pode ser baixado em .txt."],
    ["Apagar e recomeçar", "Ferramenta <b>Apagar</b> e toque no equipamento ou no cabo. <b>Reiniciar</b> volta ao início da atividade."],
  ];

  function montar(raiz, op) {
    const A = op.atividade;
    const larg = raiz.clientWidth || window.innerWidth || 400;
    W = larg < 600 ? 620 : 1000; H = larg < 600 ? 720 : 620;
    let rede = op.estado ? S.Rede.importar(op.estado) : (A ? S.Rede.deAtividade(A) : new S.Rede());
    let modo = "mover", cabo = "auto", sel = null, caboA = null, menu = null, aba = null, feito = false, categoria = 0;
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

    raiz.innerHTML = `<div class="sim">
      ${A ? `<div class="cartao sim-passos"><div class="linha entre"><span class="rotulo">Atividade · <span id="sim-prog"></span></span><button class="btn-copiar sim-btn-link" data-s="reiniciar">Reiniciar</button></div>
        <p class="peq">${esc(A.cenario)}</p><ol class="sim-lista" id="sim-lista"></ol></div>` : ""}
      <div class="sim-barra" role="toolbar" aria-label="Ferramentas do simulador">
        <button data-s="mover" aria-pressed="true">Mover</button>
        <button data-s="add">+ Equipamento</button>
        <button data-s="cabo">Cabo</button>
        <button data-s="apagar">Apagar</button>
        <span class="sim-grupo"><button data-s="desfazer" aria-label="Desfazer" title="Desfazer (Ctrl+Z)" disabled>↶</button><button data-s="refazer" aria-label="Refazer" title="Refazer (Ctrl+Y)" disabled>↷</button></span>
        <span class="sim-grupo sim-seg" role="group" aria-label="Vista"><button data-s="logica" aria-pressed="true">Lógica</button><button data-s="fisica" aria-pressed="false">Física</button></span>
        <button data-s="simul" aria-pressed="false" title="Ver cada pacote, passo a passo">▶ Simulação</button>
        <button data-s="mais" aria-pressed="false">Mais ▾</button>
        <button data-s="ajuda" aria-label="Como usar">?</button>
      </div>
      <div class="sim-opcoes" id="sim-opcoes" hidden></div>
      <div class="sim-palco"><svg id="sim-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Área de trabalho da rede"></svg>
        <div class="sim-zoom" id="sim-zoom"><button data-z="mais" aria-label="Aproximar">+</button><button data-z="menos" aria-label="Afastar">−</button><button data-z="ajustar">Ajustar</button></div>
        <div class="sim-msg" id="sim-msg" role="status">${A ? "Comece pelo primeiro passo. Toque em ? para ver como usar." : "Modo livre: monte a rede que quiser."}</div></div>
      <div class="sim-simul" id="sim-simul" hidden></div>
      <div class="sim-inspetor" id="sim-insp" hidden></div>
      <div class="sim-modal" id="sim-modal" hidden></div>
    </div>`;
    const $ = (s) => raiz.querySelector(s);
    const svg = $("#sim-svg");
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
    function desenhar() {
      if (vista === "fisica") return desenharFisica();
      let s = desenharAreas();
      rede.links.forEach((l) => {
        const a = pos(rede.dev(l.a)), b = pos(rede.dev(l.b)), est = rede.estadoLink(l), C = S.CABOS[l.cabo];
        s += `<g data-link="${l.id}"><line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="transparent" stroke-width="22"/>
          <line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="sim-cabo" stroke="${C.cor}" stroke-width="${l.cabo === "consola" ? 3 : 3.5}" ${C.tracejado || l.cabo === "consola" ? 'stroke-dasharray="9 6"' : ""}/>`;
        const stpL = est.estado === "ok" && rede.stpLed ? rede.stpLed(l) : {};
        if (l.cabo !== "consola") [[0.2, a, b, "A"], [0.8, a, b, "B"]].forEach(([t, p, q, lado]) => {
          const cx = p.x + (q.x - p.x) * t, cy = p.y + (q.y - p.y) * t;
          const cor = est.estado === "errado" ? "errado" : est.estado === "ok" ? ((lado === "A" ? stpL.a : stpL.b) ? "baixo stp" : "ok") : ((lado === "A" ? est.baixoA : est.baixoB) ? "errado" : "baixo");
          s += `<circle cx="${cx}" cy="${cy}" r="7" class="sim-luz ${cor}"/>`;
        });
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
        s += `<g data-dev="${d.id}" class="sim-dev ${sel === d.id ? "sel" : ""} ${caboA && caboA.d === d.id ? "origem" : ""}" transform="translate(${p.x},${p.y})">
          <circle r="40" class="sim-halo"/><g transform="translate(-30,-30)"><svg width="60" height="60" viewBox="0 0 64 64">${F.ICONES[T.icone]}</svg></g>
          <text y="48" class="sim-nome">${esc(d.nome)}</text>${d.modelo && d.eq ? `<text y="${ip ? 84 : 66}" class="sim-ip">${esc(d.modelo)}</text>` : ""}${ip ? `<text y="66" class="sim-ip">${esc(ip)}</text>` : ""}</g>`;
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
    function abrirSim(on) {
      sm.aberto = on; clearInterval(sm.auto); sm.auto = null;
      raiz.querySelector('[data-s="simul"]').setAttribute("aria-pressed", String(on));
      const p = $("#sim-simul"); p.hidden = !on;
      if (on) { if (!sm.pedido.de) { const h = rede.devs.find((d) => d.pc && rede.l3(d).length) || rede.devs.find((d) => d.eq); sm.pedido.de = h ? h.id : ""; } pintarSim(); msg("<b>Modo de simulação:</b> escolha a origem, o tipo e o destino e toque em Gerar. Depois avance mensagem a mensagem."); }
      else { sm.i = -1; msg("Tempo real."); }
      desenhar();
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
      p.innerHTML = `<div class="linha entre"><b>Modo de simulação</b><button class="btn-copiar" data-sm="fechar">Voltar ao tempo real</button></div>
        <form class="sim-sm-form" data-sm-form><label>Origem<select class="campo" name="de">${cand.map((d) => `<option value="${d.id}" ${sm.pedido.de === d.id ? "selected" : ""}>${esc(d.nome)}</option>`).join("")}</select></label>
          <label>O que fazer<select class="campo" name="tipo">${TIPOS_SIM.map(([k, n]) => `<option value="${k}" ${sm.pedido.tipo === k ? "selected" : ""}>${n}</option>`).join("")}</select></label>
          <label>Destino (IP, nome do equipamento ou nome DNS)<input class="campo mono" name="para" list="sim-sm-dest" value="${esc(sm.pedido.para)}" placeholder="ex.: 192.168.1.1 ou SRV" autocomplete="off" ${sm.pedido.tipo === "dhcp" ? "disabled" : ""}></label>
          <datalist id="sim-sm-dest">${rede.devs.filter((d) => rede.l3(d).length).map((d) => `<option value="${esc(d.nome)}">${esc(rede.l3(d)[0].ip)}</option>`).join("")}</datalist>
          <button class="btn prim">Gerar</button></form>
        <div class="chips sim-sm-filtro">${["ARP", "ICMP", "DHCP", "DNS", "TCP", "UDP"].map((t) => `<button class="chip-op" data-sm-f="${t}" aria-pressed="${sm.filtro.has(t)}" style="--c:${cor(t)}"><i></i>${t}</button>`).join("")}<button class="chip-op" data-sm="arp" title="Esquece os endereços MAC aprendidos (o próximo pacote começa com ARP)">Limpar ARP</button></div>
        ${sm.evs.length ? `<div class="sim-sm-ctl"><button class="btn" data-sm="inicio" aria-label="Recomeçar">⏮</button><button class="btn" data-sm="ant" aria-label="Mensagem anterior">◀</button><button class="btn prim" data-sm="seg">Passo seguinte ▶</button><button class="btn" data-sm="auto">${sm.auto ? "⏸ Pausa" : "⏩ Automático"}</button></div>
        <p class="peq ${sm.res && sm.res.ok ? "sim-ok-txt" : "sim-erro-txt"}">${sm.res ? (sm.res.ok ? "Resultado: chegou ao destino e a resposta voltou." : "Resultado: falhou — " + esc(sm.res.motivo || "")) : ""}</p>
        <div class="sim-sm-grid"><div class="sim-sm-lista" role="list">${vs.map(([e, k]) => `<button role="listitem" class="sim-sm-ev ${k === sm.i ? "atual" : ""}" data-sm-i="${k}"><span class="tab-num">${vs.findIndex(([, i]) => i === k) + 1}</span><span>${esc(nome(e.de))}</span><span>${e.de === e.para ? "—" : esc(nome(e.para))}</span><span class="sim-sm-tipo" style="background:${cor(e.tipo)}">${esc(e.tipo === "FALHA" ? "✗" : e.tipo)}</span></button>`).join("")}</div>
          <div class="sim-sm-pdu">${ev ? `<b>${esc(ev.resumo)}</b>${ev.falha ? `<p class="peq sim-erro-txt">${esc(ev.falha)}</p>` : ""}${ev.camadas.map(([c, t]) => `<div class="sim-sm-camada"><span class="rotulo">${esc(c)}</span><code>${esc(t)}</code></div>`).join("")}` : '<p class="peq suave">Toque em Passo seguinte para ver a primeira mensagem.</p>'}</div></div>` : `<p class="peq suave">${sm.res && !sm.res.ok ? esc(sm.res.motivo) : "Ainda não há mensagens. Em modo de simulação, um ping feito no Prompt de um PC também aparece aqui."}</p>`}`;
      const f = p.querySelector("[data-sm-form]");
      f.onchange = (e) => { if (e.target.name === "tipo") { sm.pedido.tipo = e.target.value; pintarSim(); } };
      f.onsubmit = (e) => { e.preventDefault(); const v = Object.fromEntries(new FormData(f).entries()); sm.pedido = { de: v.de, tipo: v.tipo, para: (v.para || "").trim() }; gerarSim(); };
      const at = p.querySelector(".sim-sm-ev.atual"); if (at) at.scrollIntoView({ block: "nearest" });
    }
    function cliqueSim(e) {
      const b = e.target.closest("[data-sm],[data-sm-f],[data-sm-i]"); if (!b) return;
      if (b.dataset.smF) { const t = b.dataset.smF; sm.filtro.has(t) ? sm.filtro.delete(t) : sm.filtro.add(t); pintarSim(); return; }
      if (b.dataset.smI) { sm.i = +b.dataset.smI; desenhar(); moverEnvelope(); pintarSim(); return; }
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
    function opcoes() {
      const o = $("#sim-opcoes");
      if (menu === "add") {
        o.hidden = false;
        const [, itens] = S.CATALOGO[categoria];
        o.innerHTML = `<div class="sim-cats">${S.CATALOGO.map(([c], i) => `<button data-cat="${i}" aria-pressed="${i === categoria}">${esc(c)}</button>`).join("")}</div>
          <div class="sim-modelos">${itens.map(([t, m, n, desc], i) => `<button data-add="${t}" data-modelo="${esc(m)}" title="${esc(desc)}">${F.icone(S.TIPOS[t].icone, 30)}<span>${esc(n)}</span></button>`).join("")}</div>
          <p class="peq suave sim-desc">${esc(itens.map((x) => x[2] + ": " + x[3]).join(" · "))}</p>`;
      }
      else if (menu === "cabo") { o.hidden = false; o.innerHTML = Object.entries(S.CABOS).map(([k, C]) => `<button data-cabo="${k}" aria-pressed="${cabo === k}"><i style="background:${C.cor};${C.tracejado ? "background-image:repeating-linear-gradient(90deg,transparent 0 4px,var(--surface) 4px 7px)" : ""}"></i><span>${esc(C.nome)}</span></button>`).join(""); }
      else if (menu === "mais") {
        o.hidden = false;
        o.innerHTML = [["area", "▭", "Área", "edifício, sala"], ["nota", "✎", "Nota", "texto no desenho"], ["imagem", "⤓", "Imagem", "guardar PNG"], ["relatorio", "≡", "Relatório", "todos os equipamentos"]]
          .map(([k, ic, n, d]) => `<button data-s="${k}" ${["area", "nota"].includes(k) ? `aria-pressed="${modo === k}"` : ""}><span class="sim-mais-ic" aria-hidden="true">${ic}</span><b>${n}</b><span class="suave">${d}</span></button>`).join("");
      }
      else o.hidden = true;
      o.classList.toggle("sim-mais", menu === "mais");
      raiz.querySelectorAll("[data-s]").forEach((b) => {
        const k = b.dataset.s;
        if (["mover", "cabo", "apagar", "area", "nota"].includes(k)) b.setAttribute("aria-pressed", String(modo === k && vista === "logica"));
        if (k === "add" || k === "mais") b.setAttribute("aria-pressed", String(menu === k));
        if (k === "logica" || k === "fisica") b.setAttribute("aria-pressed", String(vista === k));
      });
      $("#sim-zoom").hidden = vista === "fisica";
      svg.style.cursor = vista === "logica" && (modo === "area" || modo === "nota") ? "crosshair" : "";
      botoesHist();
    }
    function lugarLivre() {
      const dx = W < 800 ? 24 : 15, dy = W < 800 ? 17 : 16;
      for (let y = 14; y <= 88; y += dy) for (let x = 12; x <= 90; x += dx) if (!rede.devs.some((d) => Math.abs(d.x - x) < dx - 2 && Math.abs(d.y - y) < dy - 3)) return { x, y };
      return { x: 50, y: 50 };
    }

    function escolherPorta(d, outro, depois) {
      const ps = rede.portas(d);
      const tp = (p) => rede.tipoPorta(p);
      const compat = (p) => tp(p) === "wifi" ? false : cabo === "consola" ? tp(p) === "consola" : cabo === "serial" ? tp(p) === "serial" : cabo === "fibra" ? tp(p) === "giga" : cabo === "coaxial" ? tp(p) === "coax" : cabo === "telefone" ? tp(p) === "rj11" : cabo === "auto" ? !["consola", "wifi"].includes(tp(p)) : ["cobre", "giga"].includes(tp(p));
      const md = $("#sim-modal");
      md.hidden = false;
      md.innerHTML = `<div class="sim-caixa"><div class="linha entre"><b>Porta de ${esc(d.nome)}</b><button class="btn-copiar" data-fechar>Cancelar</button></div>
        <p class="peq suave">Cabo ${esc(S.CABOS[cabo].nome.toLowerCase())}${outro ? ` para ${esc(outro.nome)}` : ""}.</p>
        <div class="sim-portas">${ps.map((p) => { const l = rede.linkDe(d, p); const ok = !l && compat(p); const o2 = l ? rede.dev(l.a === d.id ? l.b : l.a) : null;
          return `<button data-porta="${esc(p)}" ${ok ? "" : "disabled"}><b>${esc(curto(p))}</b><span>${tp(p) === "wifi" ? "sem fios (configure o SSID)" : l ? "ligada a " + esc(o2.nome) : compat(p) ? "livre" : "não serve para este cabo"}</span></button>`; }).join("")}</div></div>`;
      md.onclick = (e) => {
        if (e.target.closest("[data-fechar]") || e.target === md) { md.hidden = true; caboA = null; desenhar(); return; }
        const b = e.target.closest("[data-porta]"); if (!b || b.disabled) return;
        md.hidden = true; depois(b.dataset.porta);
      };
    }

    function tocarDev(d) {
      if (vista === "fisica") return abrirInsp(d);
      if (modo === "apagar") { rede.apagarDev(d); if (sel === d.id) fecharInsp(); msg(`${esc(d.nome)} apagado.`); atualizar(); return; }
      if (modo === "cabo") {
        if (!caboA) {
          if (cabo === "auto") { caboA = { d: d.id, p: null }; msg(`Origem: <b>${esc(d.nome)}</b>. Toque no equipamento de destino.`); desenhar(); return; }
          escolherPorta(d, null, (p) => { caboA = { d: d.id, p }; msg(`Origem: <b>${esc(d.nome)} ${esc(curto(p))}</b>. Toque no equipamento de destino.`); desenhar(); });
          return;
        }
        const da = rede.dev(caboA.d);
        if (da === d) { caboA = null; msg("Escolha um equipamento diferente."); desenhar(); return; }
        const fim = (pa, pb) => {
          const l = rede.ligar(da, pa, d, pb, cabo);
          caboA = null;
          const e = rede.estadoLink(l);
          msg(e.estado === "errado" ? `<b>Luz vermelha:</b> cabo ${esc(S.CABOS[l.cabo].nome.toLowerCase())} entre ${esc(da.nome)} e ${esc(d.nome)} não funciona. Aqui o cabo certo é <b>${esc(e.certo)}</b>.` :
            e.estado === "baixo" ? `Ligado ${esc(da.nome)} ${esc(curto(pa))} ↔ ${esc(d.nome)} ${esc(curto(pb))}. <b>Luz laranja/vermelha</b> do lado do router: falta <code>no shutdown</code> na interface.` :
              `Ligado ${esc(da.nome)} ${esc(curto(pa))} ↔ ${esc(d.nome)} ${esc(curto(pb))} com cabo ${esc(S.CABOS[l.cabo].nome.toLowerCase())}.`, e.estado === "errado" ? "erro" : "ok");
          atualizar();
        };
        if (cabo === "auto") {
          const pa = rede.portaAuto(da, d), pb = rede.portaAuto(d, da);
          if (!pa || !pb) { caboA = null; msg("Não há portas livres compatíveis.", "erro"); desenhar(); return; }
          fim(pa, pb); return;
        }
        escolherPorta(d, da, (pb) => fim(caboA.p, pb));
        return;
      }
      abrirInsp(d);
    }
    function tocarLink(l) {
      const da = rede.dev(l.a), db = rede.dev(l.b), e = rede.estadoLink(l);
      if (modo === "apagar") { rede.apagarLink(l); msg("Cabo removido."); atualizar(); return; }
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
      const g = t.closest("[data-dev]");
      if (g) { arr = Object.assign(base, { tipo: "dev", d: rede.dev(g.dataset.dev) }); if (modo === "mover") prender(); return; }
      const ga = t.closest("[data-area]"), gn = t.closest("[data-nota]");
      if ((ga && t.closest(".sim-pega, [data-redim]")) || gn) {
        const o = ga ? rede.areas.find((a) => a.id === ga.dataset.area) : rede.notas.find((n) => n.id === gn.dataset.nota), redim = !!t.closest("[data-redim]");
        // ao mover uma área, leva também o que está lá dentro
        const leva = ga && !redim ? [].concat(rede.devs, rede.notas, rede.areas).filter((x) => dentro(o, x)).map((x) => [x, x.x, x.y]) : [];
        arr = Object.assign(base, { tipo: ga ? "area" : "nota", o, redim, orig: Object.assign({}, o), leva });
        if (modo === "mover") prender(); return;
      }
      arr = Object.assign(base, { tipo: "pan", vb0: Object.assign({}, vb) }); prender();
    });
    svg.addEventListener("pointermove", (ev) => {
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
      if (modo !== "mover" || arr.tipo === "toque") return;
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
        const n = { id: novoId("n"), texto: "", x: lim(a.p0.x, 0, 84), y: lim(a.p0.y, 0, 92), w: lim(220 / W * 100, 12, 60), cor: CORES_NOTA[0][0] };
        return editarObj("nota", n, true);
      }
      if (a.tipo === "desenho") {
        const r = svg.querySelector("#sim-rasc"), p = r ? { x: +r.getAttribute("x") / W * 100, y: +r.getAttribute("y") / H * 100, w: +r.getAttribute("width") / W * 100, h: +r.getAttribute("height") / H * 100 } : null;
        // um toque sem arrastar cria uma área de tamanho padrão
        const b = p && p.w >= 4 && p.h >= 4 ? p : { w: 40, h: 34, x: lim(a.p0.x - 20, 0, 60), y: lim(a.p0.y - 17, 0, 66) };
        const k = rede.areas.length;
        return editarObj("area", Object.assign({ id: novoId("a"), nome: "Edifício " + String.fromCharCode(65 + (k % 26)), cor: CORES_AREA[k % CORES_AREA.length][0] }, b), true);
      }
      if (a.tipo === "dev") { if (a.moveu) rede.aoMudar(); else tocarDev(a.d); return; }
      if (a.tipo === "area" || a.tipo === "nota") { if (a.moveu) { rede.aoMudar(); return; } if (modo === "apagar") apagarObj(a.tipo, a.o); else editarObj(a.tipo, a.o); return; }
      if (!a.moveu) { const lg = a.alvo.closest("[data-link]"); if (lg) tocarLink(rede.links.find((l) => l.id === lg.dataset.link)); }
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

    // ------------------------------------------------------------ painel do equipamento
    function fecharInsp() { sel = null; const i = $("#sim-insp"); i.hidden = true; i.innerHTML = ""; desenhar(); }
    function abrirInsp(d, abaPedida) {
      sel = d.id; desenhar();
      const T = S.TIPOS[d.tipo];
      const abas = abasDe(d);
      aba = abaPedida || (abas.find((a) => a[0] === aba) ? aba : abas[0][0]);
      const insp = $("#sim-insp");
      insp.hidden = false;
      insp.innerHTML = `<div class="linha entre sim-insp-cab"><div class="linha">${F.icone(T.icone, 30)}<div><b>${esc(d.nome)}</b><br><span class="suave peq">${esc(T.nome)}</span></div></div><span class="linha sim-insp-acoes"><button class="btn-copiar" data-duplicar title="Duplicar (Ctrl+C, Ctrl+V)">Duplicar</button><button class="btn-copiar" data-fechar-insp>Fechar</button></span></div>
        <div class="abas">${abas.map(([k, n]) => `<button aria-selected="${aba === k}" data-aba="${k}">${n}</button>`).join("")}</div><div id="sim-insp-corpo"></div>`;
      const corpo = $("#sim-insp-corpo");
      if (aba === "cli") terminal(corpo, d, "ios");
      if (aba === "prompt") terminal(corpo, d, "pc");
      if (aba === "portas") corpo.innerHTML = `<div class="tabela-caixa"><table><thead><tr><th>Porta</th><th>Ligada a</th><th>Estado</th><th>Config.</th></tr></thead><tbody>${rede.portas(d).map((p) => {
        const l = rede.linkDe(d, p), o = l ? rede.dev(l.a === d.id ? l.b : l.a) : null, est = estadoPorta(d, p), cf = cfgPorta(d, p);
        return `<tr><td>${esc(curto(p))}</td><td>${o ? esc(o.nome) + " " + esc(curto(l.a === d.id ? l.pb : l.pa)) : "—"}</td><td><span class="chip ${est === "ativa" ? "ok" : l ? "bad" : ""}">${est}</span></td><td>${esc(cf)}</td></tr>`; }).join("")}</tbody></table></div>`;
      if (aba === "ip") formIP(corpo, d);
      if (aba === "servicos") formServicos(corpo, d);
      if (aba === "partilhas") formPartilhas(corpo, d);
      if (aba === "wifi") formWifiCliente(corpo, d);
      if (aba === "wlans") formWlans(corpo, d);
      if (aba === "captura") captura(corpo, d);
      if (aba === "info") info(corpo, d);
      if (aba === "ap") formAP(corpo, d);
      if (aba === "rw") formRW(corpo, d);
      if (aba === "rwwifi") formAP(corpo, d, true);
      if (aba === "asa") formASA(corpo, d);
      if (aba === "nuvem") formNuvem(corpo, d);
      insp.onclick = (e) => {
        if (e.target.closest("[data-fechar-insp]")) return fecharInsp();
        if (e.target.closest("[data-duplicar]")) { copiar(d); return colar(); }
        const b = e.target.closest("[data-aba]"); if (b) { aba = b.dataset.aba; abrirInsp(d); }
      };
      insp.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }

    function estadoPorta(d, p) {
      const l = rede.linkDe(d, p), i = d.eq.cfg.interfaces[p] || {};
      return !l ? "sem cabo" : rede.estadoLink(l).estado === "errado" ? "cabo errado" : l.cabo === "consola" ? "consola" : i.shutdown ? "desligada" : rede.linkUp(l) ? "ativa" : "em baixo";
    }
    function cfgPorta(d, p) {
      const i = d.eq.cfg.interfaces[p] || {};
      return d.eq.tipo === "switch" && p !== "Console" && !/^(Vlan|Loopback)/.test(p) ? (i.routed ? (i.ip ? i.ip : "roteada") : i.mode === "trunk" ? "trunk" : "VLAN " + (i.accessVlan || 1)) : (i.ip && i.ip !== "dhcp" ? i.ip + "/" + window.IOS.prefixo(i.mask) : i.ip === "dhcp" ? "DHCP" : "");
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

    // Separadores do painel de cada equipamento
    function abasDe(d) {
      const T = S.TIPOS[d.tipo];
      if (d.eq) return [["cli", "CLI"], ["portas", "Portas"], ["info", "Físico"]];
      if (T.fim) {
        const a = [];
        if (T.semIp) return [["captura", "Captura"], ["info", "Informação"]];
        a.push(["ip", "Configuração IP"]);
        if (S.temWifi(d) || d.tipo === "pc") a.push(["wifi", d.tipo === "pc" ? "Placa e Wi-Fi" : "Sem fios"]);
        if (d.srv) a.push(["servicos", "Serviços"]);
        if (d.wlc) a.push(["wlans", "WLANs"]);
        if (["pc", "portatil", "servidor"].includes(d.tipo)) a.push(["partilhas", "Partilhas"]);
        if (!T.iot && d.tipo !== "wlc") a.push(["prompt", "Prompt"]);
        a.push(["info", "Informação"]);
        return a;
      }
      if (d.tipo === "ap") return [["ap", "Sem fios"], ["info", "Informação"]];
      if (d.tipo === "router_wifi") return [["rw", "Internet e LAN"], ["rwwifi", "Sem fios"], ["info", "Estado"]];
      if (d.tipo === "asa") return [["asa", "Configuração"], ["info", "Estado"]];
      if (d.tipo === "nuvem") return [["nuvem", "Operador"], ["info", "Internet"]];
      return [["info", "Informação"]];
    }
    const DESC = Object.fromEntries(S.CATALOGO.flatMap(([, it]) => it.map(([t, m, n, desc]) => [t + "|" + m, { n, desc }])));
    function info(corpo, d) {
      const x = DESC[d.tipo + "|" + (d.modelo || "")] || DESC[d.tipo + "|"] || { n: S.TIPOS[d.tipo].nome, desc: "" };
      const ls = rede.linksDe(d).map((l) => { const eu = l.a === d.id, o = rede.dev(eu ? l.b : l.a); return `<li><code>${esc(curto(eu ? l.pa : l.pb))}</code> → ${esc(o.nome)} <code>${esc(curto(eu ? l.pb : l.pa))}</code> (${esc(S.CABOS[l.cabo] ? S.CABOS[l.cabo].nome : "Wi-Fi")})</li>`; }).join("");
      let extra = "";
      if (d.tipo === "router_wifi") { const w = rede.wanRW(d); extra = `<p class="peq">Internet: <b>${esc(w.ip || "sem endereço")}</b>${w.gw ? ", gateway " + esc(w.gw) : ""}${w.dns ? ", DNS " + esc(w.dns) : ""}. LAN: <b>${esc(d.rw.lan.ip)}</b>. Clientes Wi-Fi: ${rede.wifi().links.filter((l) => l.b === d.id).length}.</p>`; }
      if (d.tipo === "asa") extra = `<ul class="sim-dns">${Object.entries(d.asa.ifs).filter(([, i]) => i.nome).map(([n, i]) => { const e = i.modo === "dhcp" ? (i.lease || {}) : i; return `<li><code>${esc(curto(n))}</code> ${esc(i.nome)} · nível ${i.nivel} · ${esc(e.ip || "sem IP")}</li>`; }).join("")}</ul>`;
      if (d.tipo === "nuvem") extra = `<p class="peq">Servidores na Internet simulada: ${Object.entries(S.INTERNET).map(([ip, n]) => `<code>${esc(n)}</code> (${ip})`).join(", ")}. DNS público: 8.8.8.8.</p>`;
      if (d.tipo === "lap") { const w = rede.wlcDe(d); extra = `<p class="peq">${w ? `Associado ao controlador <b>${esc(w.nome)}</b> (CAPWAP). Redes Wi-Fi: ${w.wlc.wlans.map((x) => esc(x.ssid)).join(", ")}.` : "Ainda não encontrou nenhum WLC: ligue-o por cabo à mesma rede do controlador."}</p>`; }
      if (S.TIPOS[d.tipo].poe) extra = `<p class="peq">Energia: <b>${rede.temEnergia(d) ? "sim" : "não"}</b> (PoE de um switch 3560/3650 ou transformador ligado).</p>`;
      corpo.innerHTML = `<div class="secao"><b>${esc(x.n)}</b><p class="peq">${esc(x.desc)}</p>${extra}<p class="peq"><b>Portas:</b> ${rede.portas(d).map((p) => `<code>${esc(curto(p))}</code>`).join(" ")}</p>
        <ul class="sim-dns">${ls || '<li class="suave peq">Sem ligações.</li>'}</ul></div>`;
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

    function formIP(corpo, d) {
      const c = d.pc, ef = rede.ipEfetivo(d);
      corpo.innerHTML = `<form class="secao sim-form" data-f="ip">
        <div class="chips"><button type="button" class="chip-op" aria-pressed="${c.dhcp}" data-modo="dhcp">DHCP</button><button type="button" class="chip-op" aria-pressed="${!c.dhcp}" data-modo="estatico">Estático</button></div>
        ${c.dhcp ? `<p class="peq">${ef.ip ? `Recebido por DHCP: <b>${esc(ef.ip)}</b> / ${esc(ef.mask)}, gateway ${esc(ef.gw || "—")}, DNS ${esc(ef.dns || "—")}${c.lease && c.lease.apipa ? " — <b>APIPA</b>: nenhum servidor DHCP respondeu." : ""}` : "À espera de servidor DHCP."}</p><button class="btn peq" type="button" data-renovar>Pedir IP de novo</button>` : `
        <label>Endereço IPv4<input class="campo mono" name="ip" value="${esc(c.ip)}" placeholder="192.168.1.10" inputmode="decimal" autocomplete="off"></label>
        <label>Máscara de sub-rede<input class="campo mono" name="mask" value="${esc(c.mask)}" placeholder="255.255.255.0" inputmode="decimal" autocomplete="off"></label>
        <label>Gateway por defeito<input class="campo mono" name="gw" value="${esc(c.gw)}" placeholder="192.168.1.1" inputmode="decimal" autocomplete="off"></label>
        <label>Servidor DNS<input class="campo mono" name="dns" value="${esc(c.dns)}" placeholder="opcional" inputmode="decimal" autocomplete="off"></label>
        <button class="btn prim" type="submit">Aplicar</button><p class="peq" id="sim-ip-erro"></p>`}</form>`;
      if (S.TIPOS[d.tipo].poe) {
        corpo.insertAdjacentHTML("afterbegin", `<label class="linha secao"><input type="checkbox" data-energia ${c.energia ? "checked" : ""}> Transformador ligado à tomada (sem ele precisa de PoE do switch 3560/3650) · energia: <b>${rede.temEnergia(d) ? "sim" : "não"}</b></label>`);
        corpo.querySelector("[data-energia]").onchange = (e) => { c.energia = e.target.checked; if (c.dhcp) rede.pedirDhcp(d); rede.mudou(); abrirInsp(d, "ip"); atualizar(); };
      }
      const f = corpo.querySelector("form");
      f.onclick = (e) => {
        const m = e.target.closest("[data-modo]");
        if (m) { c.dhcp = m.dataset.modo === "dhcp"; if (c.dhcp) rede.pedirDhcp(d); rede.mudou(); abrirInsp(d, "ip"); atualizar(); }
        if (e.target.closest("[data-renovar]")) { rede.pedirDhcp(d); rede.mudou(); abrirInsp(d, "ip"); atualizar(); }
      };
      f.onsubmit = (e) => {
        e.preventDefault();
        const v = Object.fromEntries(new FormData(f).entries()), erro = corpo.querySelector("#sim-ip-erro");
        if (!S.ehIP(v.ip)) { erro.textContent = "Endereço IPv4 inválido: são 4 números de 0 a 255 separados por pontos."; return; }
        if (!S.mascaraOk(v.mask)) { erro.textContent = "Máscara inválida (ex.: 255.255.255.0)."; return; }
        if (v.gw && !S.ehIP(v.gw)) { erro.textContent = "Gateway inválido."; return; }
        if (v.dns && !S.ehIP(v.dns)) { erro.textContent = "DNS inválido."; return; }
        Object.assign(c, { ip: v.ip.trim(), mask: v.mask.trim(), gw: v.gw.trim(), dns: v.dns.trim() });
        rede.mudou(); atualizar(); erro.textContent = "Guardado."; msg(`${esc(d.nome)}: ${esc(c.ip)}/${window.IOS.prefixo(c.mask)}${c.gw ? ", gateway " + esc(c.gw) : ""}.`, "ok");
      };
    }

    function formServicos(corpo, d) {
      const s = d.srv;
      corpo.innerHTML = `<form class="secao sim-form" data-f="srv"><b>DHCP</b>
        <label class="linha"><input type="checkbox" name="on" ${s.dhcp.on ? "checked" : ""}> Serviço DHCP ligado</label>
        <label>Primeiro endereço a atribuir<input class="campo mono" name="inicio" value="${esc(s.dhcp.inicio)}" placeholder="192.168.1.100"></label>
        <label>Máscara<input class="campo mono" name="mask" value="${esc(s.dhcp.mask)}"></label>
        <label>Gateway entregue<input class="campo mono" name="gw" value="${esc(s.dhcp.gw)}" placeholder="opcional"></label>
        <label>DNS entregue<input class="campo mono" name="dns" value="${esc(s.dhcp.dns)}" placeholder="opcional"></label>
        <button class="btn prim" type="submit">Guardar DHCP</button></form>
        <form class="secao sim-form" data-f="dns"><b>DNS</b>
        <ul class="sim-dns">${s.dns.registos.map((r, i) => `<li><code>${esc(r.nome)}</code> → <code>${esc(r.ip)}</code> <button type="button" class="btn-copiar" data-tirar="${i}">tirar</button></li>`).join("") || '<li class="suave peq">Sem registos.</li>'}</ul>
        <label>Nome<input class="campo mono" name="nome" placeholder="www.escola.local"></label>
        <label>Endereço<input class="campo mono" name="ip" placeholder="192.168.1.5"></label>
        <button class="btn" type="submit">Adicionar registo A</button><p class="peq" id="sim-srv-msg"></p></form>`;
      const [f1, f2] = corpo.querySelectorAll("form");
      f1.onsubmit = (e) => {
        e.preventDefault(); const v = Object.fromEntries(new FormData(f1).entries()), m = corpo.querySelector("#sim-srv-msg");
        if (v.inicio && !S.ehIP(v.inicio)) { m.textContent = "Primeiro endereço inválido."; return; }
        Object.assign(s.dhcp, { on: !!v.on, inicio: v.inicio.trim(), mask: v.mask.trim() || "255.255.255.0", gw: v.gw.trim(), dns: v.dns.trim() });
        rede.devs.filter((x) => x.pc && x.pc.dhcp).forEach((x) => { if (!x.pc.lease || x.pc.lease.apipa) rede.pedirDhcp(x); });
        rede.mudou(); atualizar(); m.textContent = "DHCP guardado."; msg("Servidor DHCP " + (s.dhcp.on ? "ligado" : "desligado") + ".", "ok");
      };
      f2.onsubmit = (e) => {
        e.preventDefault(); const v = Object.fromEntries(new FormData(f2).entries()), m = corpo.querySelector("#sim-srv-msg");
        if (!v.nome.trim() || !S.ehIP(v.ip.trim())) { m.textContent = "Escreva um nome e um endereço IP válido."; return; }
        s.dns.registos.push({ nome: v.nome.trim(), ip: v.ip.trim() }); rede.mudou(); formServicos(corpo, d); atualizar();
      };
      f2.onclick = (e) => { const b = e.target.closest("[data-tirar]"); if (b) { s.dns.registos.splice(+b.dataset.tirar, 1); rede.mudou(); formServicos(corpo, d); atualizar(); } };
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

    function terminal(corpo, d, tipo) {
      const id = d.id + tipo;
      if (!logs[id]) logs[id] = [{ t: tipo === "ios" ? `${d.eq.cfg.hostname} — consola. Escreva ? para ver os comandos.\n` : `Prompt de ${d.nome}. Escreva help para ver os comandos.\n` }];
      hist[id] = hist[id] || []; hIdx[id] = hist[id].length;
      const prompt = () => tipo === "ios" ? d.eq.prompt() : "C:\\>";
      corpo.innerHTML = `<div class="term"><div class="consola sim-consola" id="sim-cons"></div>
        <form class="entrada" data-f="t"><label for="sim-in" id="sim-pr">${esc(prompt())}</label><input id="sim-in" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="send" aria-label="Comando"></form>
        <div class="teclas">${tipo === "ios" ? '<button type="button" data-k="?">?</button><button type="button" data-k="tab">Tab</button>' : ""}<button type="button" data-k="up">↑</button><button type="button" data-k="down">↓</button>${tipo === "ios" ? '<button type="button" data-k="end">Ctrl+Z</button><button type="button" data-k="sh ip int br">sh ip int br</button><button type="button" data-k="sh run">show run</button>' : '<button type="button" data-k="ipconfig">ipconfig</button><button type="button" data-k="ipconfig /renew">/renew</button><button type="button" data-k="net use">net use</button><button type="button" data-k="help">help</button>'}</div></div>
        ${tipo === "ios" ? `<div class="sim-colar"><button type="button" class="btn peq" data-colar>Colar configuração</button>
          <form class="secao sim-form" data-colar-caixa hidden><label>Comandos, um por linha (como colar no PuTTY)<textarea class="campo mono" rows="7" spellcheck="false" autocapitalize="off" autocorrect="off" placeholder="enable&#10;configure terminal&#10;hostname R1&#10;interface g0/0/0&#10; ip address 192.168.1.1 255.255.255.0&#10; no shutdown&#10;end"></textarea></label>
          <div class="grelha-2"><button type="button" class="btn" data-colar-cancelar>Cancelar</button><button class="btn prim" type="submit">Executar</button></div><p class="peq" data-colar-msg></p></form></div>` : ""}`;
      const cons = corpo.querySelector("#sim-cons"), inp = corpo.querySelector("#sim-in");
      const pinta = () => { if (tipo === "ios" && d.eq.pendentes && d.eq.pendentes.length) { logs[id].push({ t: d.eq.pendentes.join("\n") }); d.eq.pendentes = []; } cons.innerHTML = logs[id].map((l) => l.c != null ? `<div><span class="pr">${esc(l.p)}</span><span class="in">${esc(l.c)}</span></div>${l.t ? `<div class="${l.erro ? "err" : ""}">${esc(l.t)}</div>` : ""}` : `<div>${esc(l.t)}</div>`).join(""); cons.scrollTop = cons.scrollHeight; corpo.querySelector("#sim-pr").textContent = prompt(); };
      const correr = (linha, manter, lote) => {
        const p = prompt();
        if (op.aoComando) op.aoComando(linha, d);
        if (tipo === "ios") {
          // ao colar, "enable" já em modo privilegiado não é erro (como no equipamento real)
          const out = lote && /^\s*en(a(b(le?)?)?)?\s*$/i.test(linha) && d.eq.modo !== "user" ? "" : d.eq.executar(linha);
          if (out === "\f") logs[id] = []; else logs[id].push({ p, c: linha, t: out, erro: /% (Invalid|Incomplete|Unrecognized|Ambiguous|Bad)/.test(out) });
          rede.mudou();
          const m = linha.trim().match(/^(?:do\s+)?(?:ping|traceroute|tr|tracert)\s+(\S+)/i);
          if (m && window.IOS) { const r = rede.pingCompleto(d, m[1]); animar(r.devs, r.ok); }
        } else {
          const r = S.promptPC(rede, d, linha);
          if (r.limpar) logs[id] = []; else logs[id].push({ p, c: linha, t: r.txt, erro: r.ok === false });
          if (r.mudou) rede.mudou();
          if (r.anim) animar(r.anim, r.ok);
          const pg = linha.trim().match(/^(ping|telnet|http|web|nslookup)\s+(\S+)/i);
          if (pg && sm.aberto) { sm.pedido = { de: d.id, tipo: { ping: "ping", telnet: "telnet", http: "http", web: "http", nslookup: "dns" }[pg[1].toLowerCase()], para: pg[2] }; gerarSim(); }
        }
        if (linha.trim() && !linha.endsWith("?")) { hist[id].push(linha); hIdx[id] = hist[id].length; }
        inp.value = manter ? linha.replace(/\?$/, "") : "";
        if (!lote) { pinta(); atualizar(); }
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
          pinta(); atualizar();
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

    function textoRelatorio() {
      const L = [], pre = (m) => (m && S.mascaraOk(m) ? "/" + window.IOS.prefixo(m) : ""), col = (t, n) => String(t).padEnd(n);
      const outro = (d, l) => { const eu = l.a === d.id; return `${rede.dev(eu ? l.b : l.a).nome} ${curto(eu ? l.pb : l.pa)}`; };
      L.push(`RELATÓRIO DA REDE — ${new Date().toLocaleString("pt-PT")}`);
      if (A) L.push("Atividade: " + (A.titulo || A.id));
      const nn = (n, a, b) => `${n} ${n === 1 ? a : b}`;
      L.push([nn(rede.devs.length, "equipamento", "equipamentos"), nn(rede.links.length, "cabo", "cabos"), nn(rede.areas.length, "área", "áreas"), nn(rede.notas.length, "nota", "notas")].join(" · "));
      rede.devs.forEach((d) => {
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
      const b = e.target.closest("[data-s]");
      if (b) {
        const a = b.dataset.s;
        // as ferramentas de desenho voltam à vista lógica
        if (["mover", "apagar", "add", "cabo", "area", "nota"].includes(a) && vista === "fisica") { vista = "logica"; aplicarVB(); }
        if (a === "mover" || a === "apagar") { modo = a; menu = null; caboA = null; msg(a === "apagar" ? "Toque num equipamento, cabo, área ou nota para apagar." : "Arraste para mover (no vazio desloca o desenho); toque para configurar."); }
        if (a === "add") { menu = menu === "add" ? null : "add"; }
        if (a === "cabo") { modo = "cabo"; menu = "cabo"; caboA = null; msg("Escolha o tipo de cabo e toque no primeiro equipamento."); }
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
            if (ev.target.closest("[data-confirmar]")) { md.hidden = true; rede = A ? S.Rede.deAtividade(A) : new S.Rede(); ligarRede(); rede.aoMudar(); feito = false; Object.keys(logs).forEach((k) => delete logs[k]); fecharInsp(); atualizar(); msg("Atividade recomeçada."); }
          };
        }
        opcoes(); desenhar(); return;
      }
      const z = e.target.closest("[data-z]");
      if (z) { if (z.dataset.z === "ajustar") ajustar(); else zoomEm(z.dataset.z === "mais" ? 1 / 1.3 : 1.3); return; }
      const ct = e.target.closest("[data-cat]");
      if (ct) { categoria = +ct.dataset.cat; opcoes(); return; }
      const ad = e.target.closest("[data-add]");
      if (ad) { const p = lugarLivre(); const d = rede.novoDev(ad.dataset.add, p.x, p.y, null, { modelo: ad.dataset.modelo || undefined }); rede.mudou(); menu = null; opcoes(); msg(`Adicionado <b>${esc(d.nome)}</b>. Arraste para mover ou toque para configurar.`, "ok"); atualizar(); return; }
      const cb = e.target.closest("[data-cabo]");
      if (cb) { cabo = cb.dataset.cabo; modo = "cabo"; caboA = null; opcoes(); msg(`Cabo <b>${esc(S.CABOS[cabo].nome)}</b>: toque no primeiro equipamento.`); }
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
    return { parar() { clearInterval(sm.auto); clearTimeout(tGuardar); clearTimeout(tFoto); document.removeEventListener("keydown", teclado); if (op.aoGuardar) op.aoGuardar(rede.exportar()); }, rede: () => rede };
  }

  window.SimUI = { montar };
})();
