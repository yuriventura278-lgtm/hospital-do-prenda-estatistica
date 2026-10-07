/* Simulador de rede (ao estilo do Cisco Packet Tracer), dentro da app.
   - Área de trabalho com routers, switches, PCs, portáteis e servidores.
   - Cabos: direto, cruzado, consola, fibra e serial, com regras reais e luzes nas portas.
   - Routers e switches usam o terminal Cisco IOS simulado (ios.js).
   - PCs e servidores: configuração IP, DHCP, prompt (ipconfig, ping, tracert, nslookup, arp).
   - O ping é calculado a partir da topologia e da configuração: camada 2 (VLANs, access,
     trunk 802.1Q, VLAN nativa), camada 3 (gateway, rotas ligadas, estáticas, por defeito,
     OSPF), router-on-a-stick, SVIs, DHCP (servidor no router, relay e servidor dedicado), DNS.
   Não simula (ainda): STP, ACL, NAT, HSRP, EtherChannel e Wi-Fi. */
(function () {
  "use strict";
  const IOS = window.IOS, F = window.Figuras;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const n2i = (ip) => ip.split(".").reduce((a, o) => (a * 256) + (+o), 0);
  const i2n = (n) => [16777216, 65536, 256, 1].map((d) => Math.floor(n / d) % 256).join(".");
  const ehIP = (s) => /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.test(s || "") && s.split(".").every((o) => +o <= 255);
  const mascaraOk = (m) => ehIP(m) && /^1*0*$/.test(n2i(m).toString(2).padStart(32, "0"));
  const redeDe = (ip, m) => i2n(Math.floor(n2i(ip) / (2 ** (32 - pref(m)))) * (2 ** (32 - pref(m))));
  const pref = (m) => n2i(m).toString(2).replace(/0/g, "").length;
  const mesmaRede = (a, b, m) => ehIP(a) && ehIP(b) && mascaraOk(m) && redeDe(a, m) === redeDe(b, m);

  const TIPOS = {
    router: { nome: "Router ISR4331", icone: "router", prefixo: "R", ios: true, host: "Router", classe: "dte" },
    switch: { nome: "Switch 2960", icone: "switch", prefixo: "S", ios: true, host: "Switch", classe: "dce" },
    switch_l3: { nome: "Switch L3 3650", icone: "switch_l3", prefixo: "D", ios: true, host: "Switch", classe: "dce" },
    pc: { nome: "PC", icone: "pc", prefixo: "PC", classe: "dte" },
    portatil: { nome: "Portátil", icone: "portatil", prefixo: "Portatil", classe: "dte" },
    servidor: { nome: "Servidor", icone: "servidor", prefixo: "SRV", classe: "dte" },
  };
  const CABOS = {
    auto: { nome: "Automático", cor: "#7a8796" }, direto: { nome: "Direto", cor: "#222f3b" }, cruzado: { nome: "Cruzado", cor: "#222f3b", tracejado: true },
    consola: { nome: "Consola", cor: "#4aa8e8" }, fibra: { nome: "Fibra", cor: "#ef8a1a" }, serial: { nome: "Serial", cor: "#d33a3a" },
  };
  const ehHost = (d) => ["pc", "portatil", "servidor"].includes(d.tipo);

  // ================================================================== modelo
  class Rede {
    constructor() { this.devs = []; this.links = []; this.seq = 1; this.cache = null; this.aoMudar = null; }

    novoDev(tipo, x, y, nome, opc) {
      const T = TIPOS[tipo];
      if (!nome) { let k = 0; do { nome = T.prefixo + (k || (T.prefixo.length > 2 ? 0 : 1)); k++; } while (this.devs.some((d) => d.nome === nome)); }
      const d = { id: "d" + (this.seq++), tipo, nome, x, y };
      if (T.ios) {
        d.eq = new IOS.Equipamento(tipo === "router" ? "router" : "switch", (opc && opc.nomeIos) || T.host, tipo === "router" ? "4331" : "2960");
        d.eq.sim = this.ganchos(d);
      } else {
        d.pc = { dhcp: !!(opc && opc.dhcp), ip: (opc && opc.ip) || "", mask: (opc && opc.mask) || "", gw: (opc && opc.gw) || "", dns: (opc && opc.dns) || "", lease: null, log: [], arp: {} };
        if (tipo === "servidor") d.srv = { dhcp: { on: false, inicio: "", mask: "255.255.255.0", gw: "", dns: "", max: 50 }, dns: { on: true, registos: [] }, http: true };
      }
      this.devs.push(d);
      return d;
    }
    dev(nomeOuId) { return this.devs.find((d) => d.id === nomeOuId || d.nome === nomeOuId); }

    portas(d) {
      if (ehHost(d)) return ["FastEthernet0", "RS232"];
      const fis = Object.keys(d.eq.cfg.interfaces).filter((n) => !/\.|^Vlan|^Loopback|^Port-channel/.test(n));
      return fis.concat("Console");
    }
    tipoPorta(p) { return p === "Console" || p === "RS232" ? "consola" : /^Serial/.test(p) ? "serial" : /^Gigabit/.test(p) ? "giga" : "cobre"; }
    linkDe(d, p) { return this.links.find((l) => (l.a === d.id && l.pa === p) || (l.b === d.id && l.pb === p)); }
    portaLivre(d, p) { return !this.linkDe(d, p); }

    caboCerto(da, pa, db, pb) {
      const ta = this.tipoPorta(pa), tb = this.tipoPorta(pb);
      if (ta === "consola" || tb === "consola") return (pa === "RS232" && pb === "Console") || (pb === "RS232" && pa === "Console") ? "consola" : null;
      if (ta === "serial" || tb === "serial") return ta === tb ? "serial" : null;
      return TIPOS[da.tipo].classe === TIPOS[db.tipo].classe ? "cruzado" : "direto";
    }
    // Estado de uma ligação: "ok" (verde), "baixo" (porta desligada, laranja), "errado" (cabo incorreto, vermelho)
    estadoLink(l) {
      const da = this.dev(l.a), db = this.dev(l.b);
      const certo = this.caboCerto(da, l.pa, db, l.pb);
      let valido;
      if (l.cabo === "fibra") valido = this.tipoPorta(l.pa) === "giga" && this.tipoPorta(l.pb) === "giga" && (certo === "direto" || certo === "cruzado");
      else valido = certo === l.cabo;
      if (!valido) return { estado: "errado", certo: certo === null ? "nenhum (portas incompatíveis)" : certo };
      if (l.cabo === "consola") return { estado: "consola" };
      const baixoA = this.adminDown(da, l.pa), baixoB = this.adminDown(db, l.pb);
      return { estado: baixoA || baixoB ? "baixo" : "ok", baixoA, baixoB };
    }
    adminDown(d, p) { if (ehHost(d)) return false; const i = d.eq.cfg.interfaces[p]; return !i || i.shutdown; }
    linkUp(l) { return this.estadoLink(l).estado === "ok"; }

    ligar(da, pa, db, pb, cabo) {
      if (cabo === "auto") {
        cabo = this.caboCerto(da, pa, db, pb) || "direto";
        if (this.tipoPorta(pa) === "giga" && this.tipoPorta(pb) === "giga" && da.tipo !== "pc" && db.tipo !== "pc" && (TIPOS[da.tipo].classe === "dce" && TIPOS[db.tipo].classe === "dce")) cabo = "cruzado";
      }
      const l = { id: "l" + (this.seq++), a: da.id, pa, b: db.id, pb, cabo };
      this.links.push(l);
      this.mudou();
      return l;
    }
    portaAuto(d, outro) {
      const ps = this.portas(d).filter((p) => this.portaLivre(d, p) && this.tipoPorta(p) !== "consola" && this.tipoPorta(p) !== "serial");
      if (!ps.length) return null;
      if (d.tipo === "switch" && outro && !ehHost(outro)) return ps.find((p) => /^Giga/.test(p)) || ps[0];
      return ps[0];
    }
    apagarDev(d) { this.links = this.links.filter((l) => l.a !== d.id && l.b !== d.id); this.devs = this.devs.filter((x) => x !== d); this.mudou(); }
    apagarLink(l) { this.links = this.links.filter((x) => x !== l); this.mudou(); }
    mudou() { this.cache = null; this.renovarDhcp(); if (this.aoMudar) this.aoMudar(); }

    // ---------------------------------------------------------------- ganchos para o IOS
    ganchos(d) {
      const rede = this;
      return {
        ligada(n) {
          if (/^Loopback/.test(n)) return true;
          if (/^Vlan/.test(n)) {
            const v = +n.slice(4);
            if (!d.eq.cfg.vlans[v]) return false;
            return Object.entries(d.eq.cfg.interfaces).some(([p, i]) => !/^Vlan/.test(p) && !i.routed && !i.shutdown && (i.mode === "trunk" ? rede.vlanPermitida(i, v) : i.accessVlan === v) && rede.portaUp(d, p));
          }
          const fis = n.split(".")[0];
          return rede.portaUp(d, fis);
        },
        ping: (ip) => rede.pingDe(d, ip),
        tracert: (ip) => rede.tracertDe(d, ip),
        rotasOspf: () => rede.ospf().rotas[d.id] || [],
        vizinhosOspf: () => rede.ospf().viz[d.id] || [],
        cdp: () => rede.links.filter((l) => (l.a === d.id || l.b === d.id) && rede.linkUp(l)).map((l) => {
          const eu = l.a === d.id, outro = rede.dev(eu ? l.b : l.a);
          if (!outro.eq) return null;
          return { nome: outro.eq.cfg.hostname, local: eu ? l.pa : l.pb, remota: eu ? l.pb : l.pa, cap: outro.tipo === "router" ? "R" : "S", plat: outro.tipo === "router" ? "ISR4300" : outro.tipo === "switch_l3" ? "3650" : "2960" };
        }).filter(Boolean),
      };
    }
    portaUp(d, p) { const l = this.linkDe(d, p); return !!l && l.cabo !== "consola" && this.linkUp(l); }
    vlanPermitida(i, v) {
      if (!i.allowed) return true;
      return String(i.allowed).split(",").some((x) => { const m = x.trim().match(/^(\d+)(?:-(\d+))?$/); return m && v >= +m[1] && v <= +(m[2] || m[1]); });
    }

    // ---------------------------------------------------------------- endereços de camada 3
    // Lista as interfaces L3 ativas de um equipamento: {iface, ip, mask, porta, vlan}
    l3(d) {
      if (ehHost(d)) { const c = this.ipEfetivo(d); return c.ip ? [{ iface: "FastEthernet0", ip: c.ip, mask: c.mask, porta: "FastEthernet0", vlan: null }] : []; }
      const out = [];
      Object.entries(d.eq.cfg.interfaces).forEach(([n, i]) => {
        if (!i.ip || i.ip === "dhcp" || i.shutdown) return;
        if (d.eq.tipo === "switch" && !/^Vlan|^Loopback/.test(n) && !i.routed) return;
        if (!d.eq.sim.ligada(n)) return;
        if (/^Vlan/.test(n)) out.push({ iface: n, ip: i.ip, mask: i.mask, svi: +n.slice(4) });
        else if (/^Loopback/.test(n)) out.push({ iface: n, ip: i.ip, mask: i.mask, loop: true });
        else if (n.includes(".")) { if (i.encap) out.push({ iface: n, ip: i.ip, mask: i.mask, porta: n.split(".")[0], vlan: i.encapNative ? null : i.encap }); }
        else out.push({ iface: n, ip: i.ip, mask: i.mask, porta: n, vlan: null });
      });
      return out;
    }
    ipEfetivo(d) { const c = d.pc; if (c.dhcp) return c.lease || { ip: "", mask: "", gw: "", dns: "" }; return { ip: ehIP(c.ip) ? c.ip : "", mask: c.mask, gw: c.gw, dns: c.dns }; }
    encaminha(d) { return d.tipo === "router" || (d.eq && d.eq.cfg.ipRouting && d.eq.tipo === "switch"); }

    // ---------------------------------------------------------------- camada 2: domínio de broadcast
    // A partir de uma interface L3, devolve os pontos L3 alcançáveis na mesma rede local e o caminho.
    dominio(d, l3) {
      const achados = [], visto = new Set(), pai = new Map();
      const chegaA = (dev, porta, vlan, de) => {
        const k = dev.id + "|" + porta + "|" + vlan; if (visto.has(k)) return; visto.add(k);
        if (!pai.has(dev.id)) pai.set(dev.id, de);
        if (ehHost(dev)) { if (vlan === null) this.l3(dev).forEach((e) => achados.push({ dev, e })); return; }
        const i = dev.eq.cfg.interfaces[porta]; if (!i || i.shutdown) return;
        if (dev.eq.tipo === "router" || i.routed) {
          this.l3(dev).filter((e) => e.porta === porta && (e.vlan === vlan || (vlan === null && e.vlan === null))).forEach((e) => achados.push({ dev, e }));
          return;
        }
        let v;
        if (i.mode === "trunk") { v = vlan === null ? (i.native || 1) : vlan; if (!this.vlanPermitida(i, v)) return; }
        else { if (vlan !== null) return; v = i.accessVlan || 1; }
        if (!dev.eq.cfg.vlans[v]) return;
        dentroSwitch(dev, v, porta);
      };
      const dentroSwitch = (sw, v, entrada) => {
        const k = sw.id + "|sw|" + v; if (visto.has(k)) return; visto.add(k);
        this.l3(sw).filter((e) => e.svi === v).forEach((e) => achados.push({ dev: sw, e }));
        Object.entries(sw.eq.cfg.interfaces).forEach(([p, i]) => {
          if (p === entrada || /^Vlan|\./.test(p) || i.routed || i.shutdown) return;
          let tag;
          if (i.mode === "trunk") { if (!this.vlanPermitida(i, v)) return; tag = v === (i.native || 1) ? null : v; }
          else { if ((i.accessVlan || 1) !== v) return; tag = null; }
          sair(sw, p, tag);
        });
      };
      const sair = (dev, porta, tag) => {
        const l = this.linkDe(dev, porta); if (!l || !this.linkUp(l)) return;
        const eu = l.a === dev.id, outro = this.dev(eu ? l.b : l.a), pOutro = eu ? l.pb : l.pa;
        chegaA(outro, pOutro, tag, dev.id);
      };
      visto.add(d.id + "|" + (l3.porta || "svi") + "|origem");
      pai.set(d.id, null);
      if (l3.svi) dentroSwitch(d, l3.svi, null);
      else if (l3.porta) sair(d, l3.porta, l3.vlan);
      return { achados: achados.filter((a) => !(a.dev === d && a.e.iface === l3.iface)), pai };
    }
    caminho(pai, ate) { const c = []; let x = ate; let n = 0; while (x && n++ < 50) { c.unshift(x); x = pai.get(x); } return c; }

    // ---------------------------------------------------------------- encaminhamento
    tabela(d) {
      const rotas = [];
      const l3 = this.l3(d);
      l3.forEach((e) => rotas.push({ net: redeDe(e.ip, e.mask), mask: e.mask, tipo: "C", iface: e, ad: 0 }));
      if (this.encaminha(d)) {
        (d.eq.cfg.routes || []).forEach((r) => {
          if (/^[A-Za-z]/.test(r.via)) { const e = l3.find((x) => x.iface === r.via); if (e) rotas.push({ net: r.net, mask: r.mask, tipo: "S", iface: e, via: null, ad: r.ad || 1 }); return; }
          const e = l3.find((x) => mesmaRede(x.ip, r.via, x.mask));
          if (e) rotas.push({ net: r.net, mask: r.mask, tipo: "S", iface: e, via: r.via, ad: r.ad || 1 });
        });
        (this.ospf().rotas[d.id] || []).forEach((r) => { const e = l3.find((x) => x.iface === r.iface); if (e) rotas.push({ net: r.net, mask: i2n(r.pref ? (2 ** 32 - 2 ** (32 - r.pref)) : 0), tipo: "O", iface: e, via: r.via, ad: 110 }); });
      }
      return rotas;
    }
    procurar(d, ip) {
      let melhor = null;
      this.tabela(d).forEach((r) => {
        if (!mascaraOk(r.mask) && r.mask !== "0.0.0.0") return;
        const p = r.mask === "0.0.0.0" ? 0 : pref(r.mask);
        if (p && redeDe(ip, r.mask) !== r.net) return;
        if (!p && r.net !== "0.0.0.0") return;
        if (!melhor || p > melhor.p || (p === melhor.p && r.ad < melhor.r.ad)) melhor = { r, p };
      });
      return melhor && melhor.r;
    }
    dono(ip) { for (const d of this.devs) if (this.l3(d).some((e) => e.ip === ip)) return d; return null; }

    // Vai de um equipamento até um IP; devolve {ok, saltos, devs, motivo}
    ir(d, ip, ttl) {
      const saltos = [], devs = [d.id];
      let atual = d;
      for (let n = 0; n < (ttl || 16); n++) {
        if (this.l3(atual).some((e) => e.ip === ip)) return { ok: true, saltos, devs, fim: atual };
        let saida, prox;
        if (this.encaminha(atual)) {
          const r = this.procurar(atual, ip);
          if (!r) return { ok: false, saltos, devs, motivo: `${atual.eq.cfg.hostname} não tem rota para ${ip}`, inalcancavel: true };
          saida = r.iface; prox = r.tipo === "C" || !r.via ? ip : r.via;
        } else {
          const l3 = this.l3(atual);
          if (!l3.length) return { ok: false, saltos, devs, motivo: `${atual.nome} não tem endereço IP` };
          saida = ehHost(atual) ? l3[0] : (l3.find((e) => mesmaRede(e.ip, ip, e.mask)) || l3[0]);
          if (mesmaRede(saida.ip, ip, saida.mask)) prox = ip;
          else {
            const gw = ehHost(atual) ? this.ipEfetivo(atual).gw : atual.eq.cfg.defaultGateway;
            if (!ehIP(gw)) return { ok: false, saltos, devs, motivo: `${atual.nome} não tem gateway configurado para chegar a outra rede` };
            prox = gw;
          }
        }
        const dom = this.dominio(atual, saida);
        const alvo = dom.achados.find((a) => a.e.ip === prox);
        if (!alvo) return { ok: false, saltos, devs, motivo: prox === ip ? `${ip} não respondeu ao ARP na rede local` : `o gateway/next hop ${prox} não foi encontrado na rede local de ${atual.nome}` };
        this.caminho(dom.pai, alvo.dev.id).slice(1).forEach((x) => devs.push(x));
        if (alvo.dev !== d) saltos.push(prox === ip ? ip : prox);
        if (ehHost(alvo.dev) || !this.encaminha(alvo.dev) || alvo.e.ip === ip) {
          if (alvo.e.ip === ip || this.l3(alvo.dev).some((e) => e.ip === ip)) { if (ehHost(alvo.dev) && alvo.e.ip !== ip) return { ok: false, saltos, devs, motivo: "destino inalcançável" }; return { ok: true, saltos, devs, fim: alvo.dev }; }
          return { ok: false, saltos, devs, motivo: `${alvo.dev.nome} não encaminha pacotes` };
        }
        atual = alvo.dev;
      }
      return { ok: false, saltos, devs, motivo: "TTL esgotado (loop de encaminhamento)" };
    }
    origemIp(d, ip) {
      if (ehHost(d)) return this.ipEfetivo(d).ip;
      const r = this.encaminha(d) ? this.procurar(d, ip) : null;
      if (r) return r.iface.ip;
      const l3 = this.l3(d); return l3.length ? l3[0].ip : "";
    }
    pingCompleto(d, ip) {
      const ida = this.ir(d, ip);
      if (!ida.ok) return ida;
      const src = this.origemIp(d, ip);
      if (!src) return { ok: false, saltos: [], devs: ida.devs, motivo: "sem IP de origem" };
      const volta = this.ir(ida.fim, src);
      if (!volta.ok) return { ok: false, saltos: ida.saltos, devs: ida.devs, motivo: `a resposta não consegue voltar: ${volta.motivo}` };
      return { ok: true, saltos: ida.saltos, devs: ida.devs.concat(volta.devs.slice(1)), ida: ida.devs };
    }
    pingDe(d, ip) { return this.pingCompleto(d, ip); }
    tracertDe(d, ip) { const r = this.ir(d, ip); return { ok: r.ok, saltos: r.saltos.length ? r.saltos : (r.ok ? [ip] : []) }; }

    // ---------------------------------------------------------------- OSPF
    ospf() {
      if (this.cache && this.cache.ospf) return this.cache.ospf;
      this.cache = this.cache || {};
      const res = { rotas: {}, viz: {} };
      this.cache.ospf = res;
      const routers = this.devs.filter((d) => d.eq && this.encaminha(d) && d.eq.cfg.ospf);
      const wcOk = (ip, net, wc) => { const w = n2i(wc); const m = 0xFFFFFFFF - w; return ((n2i(ip) & m) >>> 0) === ((n2i(net) & m) >>> 0); };
      const ifs = new Map();
      routers.forEach((r) => {
        const o = r.eq.cfg.ospf;
        const lst = this.l3(r).map((e) => { const nt = o.nets.find((n) => ehIP(n.net) && ehIP(n.wc) && wcOk(e.ip, n.net, n.wc)); return nt ? { e, area: String(nt.area), passiva: o.passive.includes(e.iface) } : null; }).filter(Boolean);
        ifs.set(r.id, lst);
      });
      const rid = (r) => { const o = r.eq.cfg.ospf; if (o.rid) return o.rid; const ips = this.l3(r).map((e) => e.ip); const loops = this.l3(r).filter((e) => e.loop).map((e) => e.ip); const lista = loops.length ? loops : ips; return lista.sort((a, b) => n2i(b) - n2i(a))[0] || "0.0.0.0"; };
      const adj = new Map();
      routers.forEach((r) => {
        adj.set(r.id, []); res.viz[r.id] = [];
        ifs.get(r.id).filter((x) => !x.passiva).forEach((x) => {
          this.dominio(r, x.e).achados.forEach((a) => {
            if (a.dev === r || !ifs.has(a.dev.id)) return;
            const y = ifs.get(a.dev.id).find((z) => z.e.iface === a.e.iface && !z.passiva && z.area === x.area && mesmaRede(z.e.ip, x.e.ip, x.e.mask) && z.e.mask === x.e.mask);
            if (!y) return;
            adj.get(r.id).push({ id: a.dev.id, via: a.e.ip, iface: x.e.iface });
            res.viz[r.id].push({ rid: rid(a.dev), ip: a.e.ip, iface: x.e.iface });
          });
        });
      });
      routers.forEach((r) => {
        const dist = new Map([[r.id, 0]]), prim = new Map(), fila = [r.id];
        while (fila.length) {
          const u = fila.shift();
          (adj.get(u) || []).forEach((v) => { if (!dist.has(v.id)) { dist.set(v.id, dist.get(u) + 1); prim.set(v.id, u === r.id ? v : prim.get(u)); fila.push(v.id); } });
        }
        const minhas = new Set(this.l3(r).map((e) => redeDe(e.ip, e.mask) + "/" + pref(e.mask)));
        const rotas = new Map();
        dist.forEach((c, id) => {
          if (id === r.id) return;
          const x = this.dev(id), p = prim.get(id);
          ifs.get(id).forEach((z) => {
            const k = redeDe(z.e.ip, z.e.mask) + "/" + pref(z.e.mask);
            if (minhas.has(k)) return;
            if (!rotas.has(k) || rotas.get(k).custo > c + 1) rotas.set(k, { net: redeDe(z.e.ip, z.e.mask), pref: pref(z.e.mask), custo: c + 1, via: p.via, iface: p.iface });
          });
          if (x.eq.cfg.ospf.defOrig && (x.eq.cfg.routes || []).some((s) => s.net === "0.0.0.0") && !(r.eq.cfg.routes || []).some((s) => s.net === "0.0.0.0"))
            if (!rotas.has("0.0.0.0/0") || rotas.get("0.0.0.0/0").custo > c + 1) rotas.set("0.0.0.0/0", { net: "0.0.0.0", pref: 0, custo: c + 1, via: p.via, iface: p.iface });
        });
        res.rotas[r.id] = [...rotas.values()];
      });
      return res;
    }

    // ---------------------------------------------------------------- DHCP
    renovarDhcp() {
      this.devs.filter((d) => ehHost(d) && d.pc.dhcp).forEach((d) => {
        const l = d.pc.lease;
        if (l && !/^169\.254/.test(l.ip) && this.leaseValido(d)) return;
        this.pedirDhcp(d);
      });
    }
    leaseValido(d) {
      const dom = this.dominio(d, { porta: "FastEthernet0", vlan: null, iface: "x" });
      return dom.achados.some((a) => mesmaRede(a.e.ip, d.pc.lease.ip, d.pc.lease.mask));
    }
    pedirDhcp(d) {
      d.pc.lease = null;
      const dom = this.dominio(d, { porta: "FastEthernet0", vlan: null, iface: "x" });
      const usados = new Set(this.devs.flatMap((x) => this.l3(x).map((e) => e.ip)));
      for (const a of dom.achados) {
        let fonte = null, rede = null, mask = null, gw = null, dns = "";
        if (a.dev.eq) {
          const pools = Object.values(a.dev.eq.cfg.dhcpPools || {});
          let p = pools.find((x) => x.net && x.mask && redeDe(a.e.ip, x.mask) === x.net);
          let excl = a.dev.eq.cfg.dhcpExcl;
          if (!p && a.dev.eq.cfg.interfaces[a.e.iface] && a.dev.eq.cfg.interfaces[a.e.iface].helper) {
            const h = this.dono(a.dev.eq.cfg.interfaces[a.e.iface].helper);
            if (h && this.ir(a.dev, a.dev.eq.cfg.interfaces[a.e.iface].helper).ok) {
              if (h.eq) { p = Object.values(h.eq.cfg.dhcpPools || {}).find((x) => x.net && x.mask && redeDe(a.e.ip, x.mask) === x.net); excl = h.eq.cfg.dhcpExcl; }
              else if (h.srv && h.srv.dhcp.on && mesmaRede(h.srv.dhcp.inicio, a.e.ip, h.srv.dhcp.mask)) fonte = { srv: h };
            }
          }
          if (p) { fonte = { pool: p, excl }; rede = p.net; mask = p.mask; gw = p.gw; dns = (p.dns || "").split(" ")[0]; }
        } else if (a.dev.srv && a.dev.srv.dhcp.on && ehIP(a.dev.srv.dhcp.inicio)) fonte = { srv: a.dev };
        if (fonte && fonte.srv) { const s = fonte.srv.srv.dhcp; mask = s.mask; gw = s.gw; dns = s.dns; const ini = n2i(s.inicio);
          for (let k = 0; k < (s.max || 50); k++) { const ip = i2n(ini + k); if (!usados.has(ip) && !this.leaseUsado(ip, d)) { d.pc.lease = { ip, mask, gw, dns, de: fonte.srv.nome }; return; } }
        }
        if (fonte && fonte.pool) {
          const base = n2i(rede), tam = 2 ** (32 - pref(mask));
          for (let k = 1; k < tam - 1; k++) {
            const ip = i2n(base + k);
            if (usados.has(ip) || this.leaseUsado(ip, d) || this.excluido(ip, fonte.excl)) continue;
            d.pc.lease = { ip, mask, gw, dns, de: a.dev.eq.cfg.hostname };
            return;
          }
        }
      }
      const k = this.devs.indexOf(d);
      d.pc.lease = { ip: `169.254.${10 + (k % 200)}.${2 + ((k * 37) % 250)}`, mask: "255.255.0.0", gw: "", dns: "", apipa: true };
    }
    leaseUsado(ip, eu) { return this.devs.some((x) => x !== eu && x.pc && x.pc.lease && x.pc.lease.ip === ip); }
    excluido(ip, excl) { const n = n2i(ip); return (excl || []).some((e) => { const a = n2i(e[0]), b = n2i(e[1] || e[0]); return n >= a && n <= b; }); }

    // ---------------------------------------------------------------- DNS
    resolver(d, nome) {
      if (ehIP(nome)) return { ip: nome };
      const porNome = this.devs.find((x) => x.nome.toLowerCase() === nome.toLowerCase());
      const dns = ehHost(d) ? this.ipEfetivo(d).dns : "";
      if (ehIP(dns)) {
        const srv = this.dono(dns);
        if (srv && srv.srv && srv.srv.dns.on && this.pingCompleto(d, dns).ok) {
          const r = srv.srv.dns.registos.find((x) => x.nome.toLowerCase() === nome.toLowerCase());
          if (r) return { ip: r.ip, servidor: dns };
          return { erro: `*** ${dns} não encontrou ${nome}: Non-existent domain` };
        }
        return { erro: `DNS request timed out. (servidor ${dns} inalcançável)` };
      }
      if (porNome) return { erro: `Ping request could not find host ${nome}. Configure um servidor DNS (o nome do equipamento não é um nome DNS).` };
      return { erro: `Ping request could not find host ${nome}. Please check the name and try again.` };
    }

    // ---------------------------------------------------------------- guardar / carregar
    exportar() {
      return { seq: this.seq, devs: this.devs.map((d) => ({ id: d.id, tipo: d.tipo, nome: d.nome, x: d.x, y: d.y, cfg: d.eq ? d.eq.cfg : null, startup: d.eq ? d.eq.startup : null, pc: d.pc ? Object.assign({}, d.pc, { log: [] }) : null, srv: d.srv || null })), links: this.links };
    }
    static importar(o) {
      const r = new Rede(); r.seq = o.seq || 1;
      o.devs.forEach((s) => {
        const d = r.novoDev(s.tipo, s.x, s.y, s.nome);
        d.id = s.id;
        if (d.eq && s.cfg) { d.eq.cfg = s.cfg; d.eq.startup = s.startup || ""; d.eq.sim = r.ganchos(d); }
        if (d.pc && s.pc) d.pc = Object.assign(d.pc, s.pc, { log: [] });
        if (s.srv) d.srv = s.srv;
      });
      r.links = o.links || [];
      r.seq = Math.max(r.seq, ...r.devs.map((d) => +d.id.slice(1) + 1), ...r.links.map((l) => +l.id.slice(1) + 1), 1);
      r.mudou();
      return r;
    }
    static deAtividade(a) {
      const r = new Rede();
      a.inicial.dispositivos.forEach((s) => {
        const d = r.novoDev(s.tipo, s.x, s.y, s.nome, s);
        if (d.eq) {
          d.eq.cfg.hostname = s.nomeIos || (s.cmds ? TIPOS[s.tipo].host : s.nome);
          (s.cmds || []).forEach((c) => d.eq.executar(c));
          d.eq.modo = "user"; d.eq.executados = new Set(); d.eq.startup = "";
        }
      });
      a.inicial.ligacoes.forEach((l) => { const da = r.dev(l.a), db = r.dev(l.b); r.links.push({ id: "l" + (r.seq++), a: da.id, pa: l.pa, b: db.id, pb: l.pb, cabo: l.cabo }); });
      r.mudou();
      return r;
    }
  }

  // ================================================================== verificações das atividades
  function verificar(rede, c) {
    const devsTipo = (t) => rede.devs.filter((d) => d.tipo === t || (t === "pc" && d.tipo === "portatil") || (t === "switch" && d.tipo === "switch_l3"));
    const valido = (l) => rede.estadoLink(l).estado !== "errado";
    switch (c.t) {
      case "e": return c.lista.every((x) => verificar(rede, x));
      case "tem": return devsTipo(c.tipo).length >= c.n;
      case "ligado_tipo": { const a = devsTipo(c.a).map((d) => d.id), b = devsTipo(c.b).map((d) => d.id); return rede.links.filter((l) => valido(l) && ((a.includes(l.a) && b.includes(l.b)) || (a.includes(l.b) && b.includes(l.a)))).length >= c.n; }
      case "cabo": { const a = rede.dev(c.a), b = rede.dev(c.b); if (!a || !b) return false; return rede.links.some((l) => ((l.a === a.id && l.b === b.id) || (l.a === b.id && l.b === a.id)) && l.cabo === c.cabo && valido(l)); }
      case "cabos_ok": return rede.links.length > 0 && rede.links.every(valido);
      case "pc_ip": { const d = rede.dev(c.nome); if (!d || !d.pc || d.pc.dhcp) return false; return d.pc.ip === c.ip && d.pc.mask === c.mask && (!c.gw || d.pc.gw === c.gw); }
      case "pc_rede": { const [net, p] = c.rede.split("/"); const m = i2n(2 ** 32 - 2 ** (32 - +p)); return devsTipo("pc").filter((d) => { const e = rede.ipEfetivo(d); return e.ip && e.mask === m && redeDe(e.ip, m) === net && e.ip !== net; }).length >= c.n; }
      case "ping": {
        const d = rede.dev(c.de); if (!d) return false;
        let ip = c.para; const alvo = rede.dev(c.para);
        if (alvo) { const l3 = rede.l3(alvo); if (!l3.length) return !!c.falha; ip = l3[0].ip; }
        else if (!ehIP(ip)) { const r = rede.resolver(d, ip); if (!r.ip) return !!c.falha; ip = r.ip; }
        const ok = rede.pingCompleto(d, ip).ok;
        return c.falha ? !ok : ok;
      }
      case "ping_tipo": { const pcs = devsTipo("pc"); for (const a of pcs) for (const b of pcs) { if (a === b) continue; const ip = rede.ipEfetivo(b).ip; if (ip && rede.pingCompleto(a, ip).ok) return true; } return false; }
      case "ios": { const d = rede.dev(c.nome); return !!(d && d.eq && d.eq.verificar(c.check)); }
      case "dhcp": { const d = rede.dev(c.nome); return !!(d && d.pc && d.pc.dhcp && d.pc.lease && !d.pc.lease.apipa); }
      case "ospf_viz": { const d = rede.dev(c.nome); return !!d && (rede.ospf().viz[d.id] || []).length >= c.n; }
      case "dns": { const d = rede.dev(c.nome); return !!(d && d.srv && d.srv.dns.registos.some((r) => r.nome.toLowerCase() === c.registo.toLowerCase() && ehIP(r.ip))); }
      case "srv_dhcp": { const d = rede.dev(c.nome); return !!(d && d.srv && d.srv.dhcp.on && ehIP(d.srv.dhcp.inicio)); }
      default: return false;
    }
  }

  // ================================================================== prompt dos PCs
  const this_eq = (rede, id) => { const d = rede.dev(id); return !!(d && d.eq); };
  function promptPC(rede, d, linha) {
    const t = linha.trim().split(/\s+/), c = (t[0] || "").toLowerCase();
    const cfg = rede.ipEfetivo(d);
    if (!c) return { txt: "" };
    if (c === "help" || c === "?") return { txt: "Comandos disponíveis:\n  ipconfig [/all | /release | /renew]\n  ping <IP ou nome>\n  tracert <IP ou nome>\n  nslookup <nome>\n  arp -a\n  cls" };
    if (c === "cls") return { limpar: true };
    if (c === "ipconfig") {
      const op = (t[1] || "").toLowerCase();
      if (op === "/release") { if (!d.pc.dhcp) return { txt: "O adaptador não está configurado para DHCP." }; d.pc.lease = null; d.pc.libertado = true; return { txt: "Endereço IP libertado.", mudou: true }; }
      if (op === "/renew") { if (!d.pc.dhcp) return { txt: "O adaptador não está configurado para DHCP. Mude para DHCP em Configuração IP." }; d.pc.libertado = false; rede.pedirDhcp(d); const l = d.pc.lease; return { txt: l.apipa ? "Não foi possível contactar o servidor DHCP.\nEndereço automático (APIPA): " + l.ip : `DHCP: recebido ${l.ip} de ${l.de}\n   Máscara . . . . : ${l.mask}\n   Gateway . . . . : ${l.gw || "-"}\n   DNS . . . . . . : ${l.dns || "-"}`, mudou: true }; }
      const mac = "00D0.BA" + String(d.id).padStart(2, "0").slice(-2) + ".1" + String(rede.devs.indexOf(d)).padStart(3, "0");
      return { txt: `FastEthernet0:\n   Endereço IPv4 . . . . . : ${cfg.ip || "0.0.0.0"}\n   Máscara de sub-rede . . : ${cfg.mask || "0.0.0.0"}\n   Gateway predefinido . . : ${cfg.gw || "0.0.0.0"}` + (op === "/all" ? `\n   Endereço físico . . . . : ${mac}\n   DHCP ativo  . . . . . . : ${d.pc.dhcp ? "Sim" : "Não"}\n   Servidor DNS  . . . . . : ${cfg.dns || "-"}` : "") };
    }
    if (c === "ping" || c === "tracert") {
      if (!t[1]) return { txt: `Uso: ${c} <IP ou nome>` };
      if (!cfg.ip) return { txt: "O PC não tem endereço IP. Configure em Configuração IP." };
      const r0 = rede.resolver(d, t[1]); if (!r0.ip) return { txt: r0.erro };
      const ip = r0.ip;
      if (c === "ping") {
        const r = rede.pingCompleto(d, ip);
        r.ok ? (d.pc.arp[ip] = true) : 0;
        const txt = `Pinging ${t[1]}${ip !== t[1] ? " [" + ip + "]" : ""} with 32 bytes of data:\n\n` + (r.ok ? [1, 2, 3, 4].map((k) => `Reply from ${ip}: bytes=32 time${k === 1 ? "=2ms" : "<1ms"} TTL=${(r.ida && this_eq(rede, r.ida[r.ida.length - 1]) ? 255 : 128) - r.saltos.filter((x) => x !== ip).length}`).join("\n") + `\n\nPing statistics for ${ip}:\n    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)` :
          (r.inalcancavel ? [1, 2, 3, 4].map(() => `Reply from ${r.saltos.length ? r.saltos[r.saltos.length - 1] : cfg.gw}: Destination host unreachable.`).join("\n") : "Request timed out.\nRequest timed out.\nRequest timed out.\nRequest timed out.") + `\n\nPing statistics for ${ip}:\n    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss)\n\n(motivo simulado: ${r.motivo})`);
        return { txt, anim: r.ok ? r.devs : r.devs, ok: r.ok };
      }
      const r = rede.ir(d, ip);
      const linhas = r.saltos.map((h, k) => `  ${k + 1}   ${k + 1} ms   ${k + 1} ms   ${k + 2} ms   ${h}`);
      if (!r.ok) linhas.push(`  ${r.saltos.length + 1}   *        *        *     Request timed out. (${r.motivo})`);
      return { txt: `Tracing route to ${t[1]}${ip !== t[1] ? " [" + ip + "]" : ""}\nover a maximum of 30 hops:\n\n` + linhas.join("\n") + (r.ok ? "\n\nTrace complete." : ""), anim: r.devs, ok: r.ok };
    }
    if (c === "nslookup") { if (!t[1]) return { txt: "Uso: nslookup <nome>" }; const r = rede.resolver(d, t[1]); return { txt: r.ip ? `Server:  ${r.servidor || cfg.dns}\nAddress: ${r.servidor || cfg.dns}\n\nName:    ${t[1]}\nAddress: ${r.ip}` : r.erro }; }
    if (c === "arp") { const ips = Object.keys(d.pc.arp); return { txt: ips.length ? "  Internet Address      Physical Address      Type\n" + ips.map((ip) => `  ${ip.padEnd(22)}00d0.ba${(n2i(ip) % 255).toString(16).padStart(2, "0")}.${(n2i(ip) % 9000 + 1000)}        dynamic`).join("\n") : "No ARP Entries Found" }; }
    return { txt: `'${t[0]}' não é reconhecido como comando. Escreva help para ver os comandos.` };
  }

  window.Simulador = { Rede, TIPOS, CABOS, verificar, promptPC, ehHost, ehIP, mascaraOk };
})();
