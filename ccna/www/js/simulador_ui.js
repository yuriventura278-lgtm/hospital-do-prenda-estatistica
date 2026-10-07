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
    ["Apagar e recomeçar", "Ferramenta <b>Apagar</b> e toque no equipamento ou no cabo. <b>Reiniciar</b> volta ao início da atividade."],
  ];

  function montar(raiz, op) {
    const A = op.atividade;
    const larg = raiz.clientWidth || window.innerWidth || 400;
    W = larg < 600 ? 620 : 1000; H = larg < 600 ? 720 : 620;
    let rede = op.estado ? S.Rede.importar(op.estado) : (A ? S.Rede.deAtividade(A) : new S.Rede());
    let modo = "mover", cabo = "auto", sel = null, caboA = null, menu = null, aba = null, feito = false, categoria = 0;
    const logs = {}, hist = {}, hIdx = {};
    let tGuardar = null;
    rede.aoMudar = () => { clearTimeout(tGuardar); tGuardar = setTimeout(() => op.aoGuardar && op.aoGuardar(rede.exportar()), 300); };

    raiz.innerHTML = `<div class="sim">
      ${A ? `<div class="cartao sim-passos"><div class="linha entre"><span class="rotulo">Atividade · <span id="sim-prog"></span></span><button class="btn-copiar sim-btn-link" data-s="reiniciar">Reiniciar</button></div>
        <p class="peq">${esc(A.cenario)}</p><ol class="sim-lista" id="sim-lista"></ol></div>` : ""}
      <div class="sim-barra" role="toolbar" aria-label="Ferramentas do simulador">
        <button data-s="mover" aria-pressed="true">Mover</button>
        <button data-s="add">+ Equipamento</button>
        <button data-s="cabo">Cabo</button>
        <button data-s="apagar">Apagar</button>
        <button data-s="ajuda" aria-label="Como usar">?</button>
      </div>
      <div class="sim-opcoes" id="sim-opcoes" hidden></div>
      <div class="sim-palco"><svg id="sim-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Área de trabalho da rede"></svg>
        <div class="sim-msg" id="sim-msg" role="status">${A ? "Comece pelo primeiro passo. Toque em ? para ver como usar." : "Modo livre: monte a rede que quiser."}</div></div>
      <div class="sim-inspetor" id="sim-insp" hidden></div>
      <div class="sim-modal" id="sim-modal" hidden></div>
    </div>`;
    const $ = (s) => raiz.querySelector(s);
    const svg = $("#sim-svg");
    const msg = (t, tipo) => { const m = $("#sim-msg"); m.innerHTML = t; m.className = "sim-msg " + (tipo || ""); };

    // ------------------------------------------------------------ desenho
    const pos = (d) => ({ x: d.x / 100 * W, y: d.y / 100 * H });
    function desenhar() {
      let s = "";
      rede.links.forEach((l) => {
        const a = pos(rede.dev(l.a)), b = pos(rede.dev(l.b)), est = rede.estadoLink(l), C = S.CABOS[l.cabo];
        s += `<g data-link="${l.id}"><line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="transparent" stroke-width="22"/>
          <line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="sim-cabo" stroke="${C.cor}" stroke-width="${l.cabo === "consola" ? 3 : 3.5}" ${C.tracejado || l.cabo === "consola" ? 'stroke-dasharray="9 6"' : ""}/>`;
        if (l.cabo !== "consola") [[0.2, a, b, "A"], [0.8, a, b, "B"]].forEach(([t, p, q, lado]) => {
          const cx = p.x + (q.x - p.x) * t, cy = p.y + (q.y - p.y) * t;
          const cor = est.estado === "errado" ? "errado" : est.estado === "ok" ? "ok" : ((lado === "A" ? est.baixoA : est.baixoB) ? "errado" : "baixo");
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
      svg.innerHTML = s;
    }

    function animar(devs, ok) {
      if (!devs || devs.length < 2 || reduzido()) return;
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
      else o.hidden = true;
      raiz.querySelectorAll("[data-s]").forEach((b) => { if (["mover", "cabo", "apagar"].includes(b.dataset.s)) b.setAttribute("aria-pressed", String(modo === b.dataset.s)); if (b.dataset.s === "add") b.setAttribute("aria-pressed", String(menu === "add")); });
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

    // ------------------------------------------------------------ arrastar
    let arr = null;
    const ponto = (ev) => { const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY; const p = pt.matrixTransform(svg.getScreenCTM().inverse()); return { x: p.x / W * 100, y: p.y / H * 100 }; };
    svg.addEventListener("pointerdown", (ev) => {
      const g = ev.target.closest("[data-dev]"); if (!g) return;
      const d = rede.dev(g.dataset.dev); arr = { d, x0: ev.clientX, y0: ev.clientY, moveu: false, id: ev.pointerId };
      if (modo === "mover") svg.setPointerCapture(ev.pointerId);
    });
    svg.addEventListener("pointermove", (ev) => {
      if (!arr || modo !== "mover") return;
      if (Math.abs(ev.clientX - arr.x0) + Math.abs(ev.clientY - arr.y0) > 6) arr.moveu = true;
      if (!arr.moveu) return;
      const p = ponto(ev); arr.d.x = Math.max(5, Math.min(95, p.x)); arr.d.y = Math.max(8, Math.min(90, p.y)); desenhar();
    });
    svg.addEventListener("pointerup", (ev) => {
      if (arr) { const a = arr; arr = null; if (a.moveu) { rede.aoMudar(); return; } tocarDev(a.d); return; }
      const lg = ev.target.closest("[data-link]"); if (lg) tocarLink(rede.links.find((l) => l.id === lg.dataset.link));
    });

    // ------------------------------------------------------------ painel do equipamento
    function fecharInsp() { sel = null; const i = $("#sim-insp"); i.hidden = true; i.innerHTML = ""; desenhar(); }
    function abrirInsp(d, abaPedida) {
      sel = d.id; desenhar();
      const T = S.TIPOS[d.tipo];
      const abas = abasDe(d);
      aba = abaPedida || (abas.find((a) => a[0] === aba) ? aba : abas[0][0]);
      const insp = $("#sim-insp");
      insp.hidden = false;
      insp.innerHTML = `<div class="linha entre sim-insp-cab"><div class="linha">${F.icone(T.icone, 30)}<div><b>${esc(d.nome)}</b><br><span class="suave peq">${esc(T.nome)}</span></div></div><button class="btn-copiar" data-fechar-insp>Fechar</button></div>
        <div class="abas">${abas.map(([k, n]) => `<button aria-selected="${aba === k}" data-aba="${k}">${n}</button>`).join("")}</div><div id="sim-insp-corpo"></div>`;
      const corpo = $("#sim-insp-corpo");
      if (aba === "cli") terminal(corpo, d, "ios");
      if (aba === "prompt") terminal(corpo, d, "pc");
      if (aba === "portas") corpo.innerHTML = `<div class="tabela-caixa"><table><thead><tr><th>Porta</th><th>Ligada a</th><th>Estado</th><th>Config.</th></tr></thead><tbody>${rede.portas(d).map((p) => {
        const l = rede.linkDe(d, p), o = l ? rede.dev(l.a === d.id ? l.b : l.a) : null, i = d.eq.cfg.interfaces[p] || {};
        const est = !l ? "sem cabo" : rede.estadoLink(l).estado === "errado" ? "cabo errado" : l.cabo === "consola" ? "consola" : i.shutdown ? "desligada" : rede.linkUp(l) ? "ativa" : "em baixo";
        const cf = d.eq.tipo === "switch" && p !== "Console" ? (i.routed ? (i.ip ? i.ip : "roteada") : i.mode === "trunk" ? "trunk" : "VLAN " + (i.accessVlan || 1)) : (i.ip && i.ip !== "dhcp" ? i.ip + "/" + window.IOS.prefixo(i.mask) : "");
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
        const b = e.target.closest("[data-aba]"); if (b) { aba = b.dataset.aba; abrirInsp(d); }
      };
      insp.scrollIntoView({ block: "nearest", behavior: "smooth" });
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
        <div class="teclas">${tipo === "ios" ? '<button type="button" data-k="?">?</button><button type="button" data-k="tab">Tab</button>' : ""}<button type="button" data-k="up">↑</button><button type="button" data-k="down">↓</button>${tipo === "ios" ? '<button type="button" data-k="end">Ctrl+Z</button><button type="button" data-k="sh ip int br">sh ip int br</button><button type="button" data-k="sh run">show run</button>' : '<button type="button" data-k="ipconfig">ipconfig</button><button type="button" data-k="ipconfig /renew">/renew</button><button type="button" data-k="net use">net use</button><button type="button" data-k="help">help</button>'}</div></div>`;
      const cons = corpo.querySelector("#sim-cons"), inp = corpo.querySelector("#sim-in");
      const pinta = () => { cons.innerHTML = logs[id].map((l) => l.c != null ? `<div><span class="pr">${esc(l.p)}</span><span class="in">${esc(l.c)}</span></div>${l.t ? `<div class="${l.erro ? "err" : ""}">${esc(l.t)}</div>` : ""}` : `<div>${esc(l.t)}</div>`).join(""); cons.scrollTop = cons.scrollHeight; corpo.querySelector("#sim-pr").textContent = prompt(); };
      const correr = (linha, manter) => {
        const p = prompt();
        if (tipo === "ios") {
          const out = d.eq.executar(linha);
          if (out === "\f") logs[id] = []; else logs[id].push({ p, c: linha, t: out, erro: /% (Invalid|Incomplete|Unrecognized|Ambiguous|Bad)/.test(out) });
          rede.mudou();
          const m = linha.trim().match(/^(?:do\s+)?(?:ping|traceroute|tr|tracert)\s+(\S+)/i);
          if (m && window.IOS) { const r = rede.pingCompleto(d, m[1]); animar(r.devs, r.ok); }
        } else {
          const r = S.promptPC(rede, d, linha);
          if (r.limpar) logs[id] = []; else logs[id].push({ p, c: linha, t: r.txt, erro: r.ok === false });
          if (r.mudou) rede.mudou();
          if (r.anim) animar(r.anim, r.ok);
        }
        if (linha.trim() && !linha.endsWith("?")) { hist[id].push(linha); hIdx[id] = hist[id].length; }
        inp.value = manter ? linha.replace(/\?$/, "") : "";
        pinta(); atualizar();
      };
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

    function ajuda() {
      const md = $("#sim-modal"); md.hidden = false;
      md.innerHTML = `<div class="sim-caixa"><div class="linha entre"><b>Como usar o simulador</b><button class="btn-copiar" data-fechar>Fechar</button></div>
        <ol class="sim-ajuda">${AJUDA.map(([t, d]) => `<li><b>${t}.</b> ${d}</li>`).join("")}</ol>
        <p class="peq suave">O simulador calcula a camada 2 (VLANs, access, trunk, VLAN nativa), a camada 3 (gateway, rotas ligadas, estáticas, por defeito, OSPF), router-on-a-stick, SVIs, DHCP e DNS. Também simula a partilha de pastas (SMB: net share, net view, net use, firewall). O terminal aceita os comandos Cisco do CCNA (show, debug, ACL, NAT, HSRP, EtherChannel, SNMP…) e guarda-os na configuração, mas ainda não calcula o efeito de STP, ACL, NAT, HSRP nem Wi-Fi no tráfego: para isso use também o Packet Tracer.</p>
        <button class="btn prim bloco" data-fechar>Começar</button></div>`;
      md.onclick = (e) => { if (e.target.closest("[data-fechar]") || e.target === md) md.hidden = true; };
      gravar("ccna-sim-ajuda", "1");
    }

    raiz.querySelector(".sim").addEventListener("click", (e) => {
      const b = e.target.closest("[data-s]");
      if (b) {
        const a = b.dataset.s;
        if (a === "mover" || a === "apagar") { modo = a; menu = null; caboA = null; msg(a === "apagar" ? "Toque num equipamento ou cabo para apagar." : "Arraste para mover; toque para configurar."); }
        if (a === "add") { menu = menu === "add" ? null : "add"; }
        if (a === "cabo") { modo = "cabo"; menu = "cabo"; caboA = null; msg("Escolha o tipo de cabo e toque no primeiro equipamento."); }
        if (a === "ajuda") ajuda();
        if (a === "reiniciar") {
          const md = $("#sim-modal"); md.hidden = false;
          md.innerHTML = `<div class="sim-caixa"><b>Recomeçar a atividade?</b><p class="peq">Volta à rede inicial e perde as configurações feitas.</p><div class="grelha-2"><button class="btn" data-fechar>Cancelar</button><button class="btn prim" data-confirmar>Recomeçar</button></div></div>`;
          md.onclick = (ev) => {
            if (ev.target.closest("[data-fechar]") || ev.target === md) { md.hidden = true; return; }
            if (ev.target.closest("[data-confirmar]")) { md.hidden = true; rede = A ? S.Rede.deAtividade(A) : new S.Rede(); rede.aoMudar = () => { clearTimeout(tGuardar); tGuardar = setTimeout(() => op.aoGuardar && op.aoGuardar(rede.exportar()), 300); }; rede.aoMudar(); feito = false; Object.keys(logs).forEach((k) => delete logs[k]); fecharInsp(); atualizar(); msg("Atividade recomeçada."); }
          };
        }
        opcoes(); desenhar(); return;
      }
      const ct = e.target.closest("[data-cat]");
      if (ct) { categoria = +ct.dataset.cat; opcoes(); return; }
      const ad = e.target.closest("[data-add]");
      if (ad) { const p = lugarLivre(); const d = rede.novoDev(ad.dataset.add, p.x, p.y, null, { modelo: ad.dataset.modelo || undefined }); rede.mudou(); menu = null; opcoes(); msg(`Adicionado <b>${esc(d.nome)}</b>. Arraste para mover ou toque para configurar.`, "ok"); atualizar(); return; }
      const cb = e.target.closest("[data-cabo]");
      if (cb) { cabo = cb.dataset.cabo; modo = "cabo"; caboA = null; opcoes(); msg(`Cabo <b>${esc(S.CABOS[cabo].nome)}</b>: toque no primeiro equipamento.`); }
    });

    opcoes(); atualizar();
    if (!ler("ccna-sim-ajuda")) setTimeout(ajuda, 200);
    return { parar() { clearTimeout(tGuardar); if (op.aoGuardar) op.aoGuardar(rede.exportar()); }, rede: () => rede };
  }

  window.SimUI = { montar };
})();
