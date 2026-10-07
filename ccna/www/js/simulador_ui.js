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
    ["Adicionar equipamentos", "Toque em <b>+ Equipamento</b> e escolha Router, Switch, PC, Portátil ou Servidor. Aparece na área de trabalho com um nome (R1, S1, PC1…)."],
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
    let modo = "mover", cabo = "auto", sel = null, caboA = null, menu = null, aba = null, feito = false;
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
      rede.devs.forEach((d) => {
        const p = pos(d), T = S.TIPOS[d.tipo];
        const ip = d.pc ? rede.ipEfetivo(d).ip : "";
        s += `<g data-dev="${d.id}" class="sim-dev ${sel === d.id ? "sel" : ""} ${caboA && caboA.d === d.id ? "origem" : ""}" transform="translate(${p.x},${p.y})">
          <circle r="40" class="sim-halo"/><g transform="translate(-30,-30)"><svg width="60" height="60" viewBox="0 0 64 64">${F.ICONES[T.icone]}</svg></g>
          <text y="48" class="sim-nome">${esc(d.nome)}</text>${ip ? `<text y="66" class="sim-ip">${esc(ip)}</text>` : ""}</g>`;
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
      if (menu === "add") { o.hidden = false; o.innerHTML = Object.entries(S.TIPOS).map(([k, T]) => `<button data-add="${k}">${F.icone(T.icone, 28)}<span>${esc(T.nome)}</span></button>`).join(""); }
      else if (menu === "cabo") { o.hidden = false; o.innerHTML = Object.entries(S.CABOS).map(([k, C]) => `<button data-cabo="${k}" aria-pressed="${cabo === k}"><i style="background:${C.cor};${C.tracejado ? "background-image:repeating-linear-gradient(90deg,transparent 0 4px,var(--surface) 4px 7px)" : ""}"></i><span>${esc(C.nome)}</span></button>`).join(""); }
      else o.hidden = true;
      raiz.querySelectorAll("[data-s]").forEach((b) => { if (["mover", "cabo", "apagar"].includes(b.dataset.s)) b.setAttribute("aria-pressed", String(modo === b.dataset.s)); if (b.dataset.s === "add") b.setAttribute("aria-pressed", String(menu === "add")); });
    }
    function lugarLivre() {
      for (let y = 20; y <= 85; y += 16) for (let x = 12; x <= 88; x += 14) if (!rede.devs.some((d) => Math.abs(d.x - x) < 9 && Math.abs(d.y - y) < 12)) return { x, y };
      return { x: 50, y: 50 };
    }

    function escolherPorta(d, outro, depois) {
      const ps = rede.portas(d);
      const compat = (p) => cabo === "consola" ? ["RS232", "Console"].includes(p) : cabo === "serial" ? /^Serial/.test(p) : cabo === "fibra" ? /^Gigabit/.test(p) : !["RS232", "Console"].includes(p) && !/^Serial/.test(p);
      const md = $("#sim-modal");
      md.hidden = false;
      md.innerHTML = `<div class="sim-caixa"><div class="linha entre"><b>Porta de ${esc(d.nome)}</b><button class="btn-copiar" data-fechar>Cancelar</button></div>
        <p class="peq suave">Cabo ${esc(S.CABOS[cabo].nome.toLowerCase())}${outro ? ` para ${esc(outro.nome)}` : ""}.</p>
        <div class="sim-portas">${ps.map((p) => { const l = rede.linkDe(d, p); const ok = !l && compat(p); const o2 = l ? rede.dev(l.a === d.id ? l.b : l.a) : null;
          return `<button data-porta="${esc(p)}" ${ok ? "" : "disabled"}><b>${esc(curto(p))}</b><span>${l ? "ligada a " + esc(o2.nome) : compat(p) ? "livre" : "não serve para este cabo"}</span></button>`; }).join("")}</div></div>`;
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
      const abas = d.eq ? [["cli", "CLI"], ["portas", "Portas"]] : d.srv ? [["ip", "Configuração IP"], ["servicos", "Serviços"], ["partilhas", "Partilhas"], ["prompt", "Prompt"]] : [["ip", "Configuração IP"], ["partilhas", "Partilhas"], ["prompt", "Prompt"]];
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
      insp.onclick = (e) => {
        if (e.target.closest("[data-fechar-insp]")) return fecharInsp();
        const b = e.target.closest("[data-aba]"); if (b) { aba = b.dataset.aba; abrirInsp(d); }
      };
      insp.scrollIntoView({ block: "nearest", behavior: "smooth" });
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
      const ad = e.target.closest("[data-add]");
      if (ad) { const p = lugarLivre(); const d = rede.novoDev(ad.dataset.add, p.x, p.y); rede.mudou(); menu = null; opcoes(); msg(`Adicionado <b>${esc(d.nome)}</b>. Arraste para mover ou toque para configurar.`, "ok"); atualizar(); return; }
      const cb = e.target.closest("[data-cabo]");
      if (cb) { cabo = cb.dataset.cabo; modo = "cabo"; caboA = null; opcoes(); msg(`Cabo <b>${esc(S.CABOS[cabo].nome)}</b>: toque no primeiro equipamento.`); }
    });

    opcoes(); atualizar();
    if (!ler("ccna-sim-ajuda")) setTimeout(ajuda, 200);
    return { parar() { clearTimeout(tGuardar); if (op.aoGuardar) op.aoGuardar(rede.exportar()); }, rede: () => rede };
  }

  window.SimUI = { montar };
})();
