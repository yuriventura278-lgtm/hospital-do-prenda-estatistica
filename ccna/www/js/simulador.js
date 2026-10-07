/* Simulador de rede (ao estilo do Cisco Packet Tracer), dentro da app.
   - Área de trabalho com routers, switches, PCs, portáteis e servidores.
   - Cabos: direto, cruzado, consola, fibra e serial, com regras reais e luzes nas portas.
   - Routers e switches usam o terminal Cisco IOS simulado (ios.js).
   - PCs e servidores: configuração IP, DHCP, prompt (ipconfig, ping, tracert, nslookup, arp).
   - O ping é calculado a partir da topologia e da configuração: camada 2 (VLANs, access,
     trunk 802.1Q, VLAN nativa), camada 3 (gateway, rotas ligadas, estáticas, por defeito,
     OSPF), router-on-a-stick, SVIs, DHCP (servidor no router, relay e servidor dedicado), DNS.
   Também: hub/repetidor/bridge, Wi-Fi (AP, router doméstico, WLC/LAP), NAT/PAT, firewall ASA
   (níveis de segurança e inspeção de ICMP), operador/Internet com DHCP e DNS, modems, PoE.
   Não simula (ainda): STP, ACL, HSRP e EtherChannel no tráfego. */
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

  // Tipos de equipamento (comportamento). "classe" decide o cabo: dte↔dce = direto, iguais = cruzado.
  const TIPOS = {
    router: { nome: "Router", icone: "router", prefixo: "R", ios: true, host: "Router", classe: "dte" },
    switch: { nome: "Switch", icone: "switch", prefixo: "S", ios: true, host: "Switch", classe: "dce" },
    switch_l3: { nome: "Switch multicamada", icone: "switch_l3", prefixo: "D", ios: true, host: "Switch", classe: "dce" },
    hub: { nome: "Hub", icone: "hub", prefixo: "Hub", classe: "dce", ponte: true },
    repetidor: { nome: "Repetidor", icone: "repetidor", prefixo: "Rep", classe: "dce", ponte: true },
    bridge: { nome: "Bridge", icone: "bridge", prefixo: "Bridge", classe: "dce", ponte: true },
    ap: { nome: "Access point", icone: "ap", prefixo: "AP", classe: "dte", ponte: true },
    lap: { nome: "Access point leve (LAP)", icone: "ap", prefixo: "LAP", classe: "dte", ponte: true },
    wlc: { nome: "Controlador WLC", icone: "wlc", prefixo: "WLC", classe: "dte", fim: true },
    router_wifi: { nome: "Router Wi-Fi doméstico", icone: "router_wifi", prefixo: "Wireless Router", classe: "dce" },
    asa: { nome: "Firewall ASA", icone: "firewall", prefixo: "ASA", classe: "dte" },
    nuvem: { nome: "Internet (operador)", icone: "nuvem", prefixo: "Internet", classe: "dce" },
    modem_dsl: { nome: "Modem DSL", icone: "modem", prefixo: "DSL Modem", classe: "dce", ponte: true },
    modem_cabo: { nome: "Modem de cabo", icone: "modem", prefixo: "Cable Modem", classe: "dce", ponte: true },
    pc: { nome: "PC de mesa", icone: "pc", prefixo: "PC", classe: "dte", fim: true, nic: "ethernet", consola: true },
    portatil: { nome: "Portátil", icone: "portatil", prefixo: "Portatil", classe: "dte", fim: true, nic: "ambos", consola: true },
    servidor: { nome: "Servidor", icone: "servidor", prefixo: "SRV", classe: "dte", fim: true, nic: "ethernet" },
    impressora: { nome: "Impressora de rede", icone: "impressora", prefixo: "Impressora", classe: "dte", fim: true, nic: "ethernet" },
    telefone_ip: { nome: "Telefone IP", icone: "telefone_ip", prefixo: "IP Phone", classe: "dte", fim: true, nic: "ethernet", poe: true },
    smartphone: { nome: "Smartphone", icone: "smartphone", prefixo: "Smartphone", classe: "dte", fim: true, nic: "wifi" },
    tablet: { nome: "Tablet", icone: "tablet", prefixo: "Tablet", classe: "dte", fim: true, nic: "wifi" },
    tv: { nome: "Smart TV", icone: "tv", prefixo: "TV", classe: "dte", fim: true, nic: "ambos" },
    camara: { nome: "Câmara IP", icone: "camara", prefixo: "Camara", classe: "dte", fim: true, nic: "ambos", iot: true },
    lampada: { nome: "Lâmpada inteligente", icone: "lampada", prefixo: "Lampada", classe: "dte", fim: true, nic: "wifi", iot: true },
    termostato: { nome: "Termóstato inteligente", icone: "termostato", prefixo: "Termostato", classe: "dte", fim: true, nic: "wifi", iot: true },
    sniffer: { nome: "Sniffer (analisador)", icone: "sniffer", prefixo: "Sniffer", classe: "dte", fim: true, nic: "ethernet", semIp: true },
  };
  // Catálogo como no Packet Tracer: categoria › modelos
  const CATALOGO = [
    ["Routers", [["router", "4331", "ISR 4331", "3 portas Gigabit, 2 série. O router das aulas."], ["router", "4321", "ISR 4321", "2 Gigabit + 2 série."], ["router", "2911", "Router 2911", "3 Gigabit + 1 série (G0/0, G0/1, G0/2)."],
      ["router", "2901", "Router 2901", "2 Gigabit + 2 série (S0/0/0)."], ["router", "1941", "Router 1941", "2 Gigabit + 2 série, pequenos escritórios."]]],
    ["Switches", [["switch", "2960", "Catalyst 2960-24TT", "24 FastEthernet + 2 Gigabit. O switch das aulas."], ["switch", "2950T", "Catalyst 2950T-24", "24 FastEthernet + 2 Gigabit (antigo)."],
      ["switch", "2950", "Catalyst 2950-24", "Só 24 FastEthernet."], ["switch_l3", "3650", "Catalyst 3650-24PS (L3, PoE)", "Switch multicamada: encaminha entre VLANs (ip routing). Dá energia PoE."],
      ["switch_l3", "3560", "Catalyst 3560-24PS (L3, PoE)", "Multicamada com PoE para telefones e AP."]]],
    ["Hubs e ligações", [["hub", "", "Hub", "Repete tudo para todas as portas (camada 1): um só domínio de colisão."], ["repetidor", "", "Repetidor", "Regenera o sinal para chegar mais longe (camada 1)."],
      ["bridge", "", "Bridge (ponte)", "Liga dois segmentos e aprende MAC (camada 2), como um switch de 2 portas."]]],
    ["Sem fios", [["router_wifi", "", "Router Wi-Fi doméstico (WRT300N)", "Router + switch de 4 portas + Wi-Fi + DHCP + NAT, como o de casa."], ["ap", "", "Access point", "Liga os clientes Wi-Fi à rede com fios."],
      ["wlc", "", "Controlador WLC 2504", "Gere os LAP: cria as redes Wi-Fi (WLAN) num só sítio."], ["lap", "", "Access point leve (LAP)", "Recebe a configuração do WLC (CAPWAP)."]]],
    ["Segurança", [["asa", "5506", "Firewall ASA 5506-X", "inside (nível 100) e outside (nível 0); bloqueia o que vem de fora."]]],
    ["WAN e Internet", [["nuvem", "", "Internet / operador (Cloud)", "Simula o operador: dá IP público por DHCP e tem servidores na Internet."], ["modem_dsl", "", "Modem DSL", "Liga pela linha telefónica (cabo de telefone RJ11)."],
      ["modem_cabo", "", "Modem de cabo", "Liga pelo cabo coaxial da TV."]]],
    ["Dispositivos finais", [["pc", "", "PC de mesa", "Com placa de rede com fios (pode trocar para Wi-Fi)."], ["portatil", "", "Portátil", "Placa com fios e Wi-Fi."], ["servidor", "", "Servidor", "DHCP, DNS e partilha de pastas."],
      ["impressora", "", "Impressora de rede", "Recebe IP e imprime pela rede."], ["telefone_ip", "", "Telefone IP 7960", "Voz sobre IP; precisa de energia PoE do switch ou do transformador."],
      ["smartphone", "", "Smartphone", "Só Wi-Fi."], ["tablet", "", "Tablet", "Só Wi-Fi."], ["tv", "", "Smart TV", "Com fios ou Wi-Fi."], ["sniffer", "", "Sniffer", "Capta o tráfego que passa (ligue-o a um hub)."]]],
    ["Casa inteligente (IoT)", [["camara", "", "Câmara IP", "Videovigilância pela rede."], ["lampada", "", "Lâmpada inteligente", "Wi-Fi."], ["termostato", "", "Termóstato", "Wi-Fi."]]],
  ];
  const CABOS = {
    auto: { nome: "Automático", cor: "#7a8796" }, direto: { nome: "Direto", cor: "#222f3b" }, cruzado: { nome: "Cruzado", cor: "#222f3b", tracejado: true },
    consola: { nome: "Consola", cor: "#4aa8e8" }, fibra: { nome: "Fibra", cor: "#ef8a1a" }, serial: { nome: "Serial", cor: "#d33a3a" },
    coaxial: { nome: "Coaxial", cor: "#7a5a3a" }, telefone: { nome: "Telefone (RJ11)", cor: "#5b8f3a" },
  };
  const ehHost = (d) => !!(TIPOS[d.tipo] && TIPOS[d.tipo].fim);
  const ehPonte = (d) => !!(TIPOS[d.tipo] && TIPOS[d.tipo].ponte);
  const nicDe = (d) => (d.pc && d.pc.nic) || (TIPOS[d.tipo] && TIPOS[d.tipo].nic) || "ethernet";
  const temWifi = (d) => ehHost(d) && nicDe(d) !== "ethernet";
  const nomeDe = (d) => (d.eq ? d.eq.cfg.hostname : d.nome);
  const POE = ["3650", "3560"];
  // Servidores "na Internet" que a nuvem do operador tem (para testar a saída para a Internet)
  const INTERNET = { "8.8.8.8": "dns.google", "93.184.216.34": "www.exemplo.com", "142.250.184.4": "www.google.com" };

  // ================================================================== modelo
  class Rede {
    constructor() { this.devs = []; this.links = []; this.seq = 1; this.cache = null; this.aoMudar = null; }

    novoDev(tipo, x, y, nome, opc) {
      const T = TIPOS[tipo]; opc = opc || {};
      if (!nome) { let k = 0; do { nome = T.prefixo + (k || (T.prefixo.length > 2 ? 0 : 1)); k++; } while (this.devs.some((d) => d.nome === nome)); }
      const d = { id: "d" + (this.seq++), tipo, nome, x, y, modelo: opc.modelo || (tipo === "router" ? "4331" : tipo === "switch" ? "2960" : tipo === "switch_l3" ? "3650" : tipo === "asa" ? "5506" : "") };
      if (T.ios) {
        d.eq = new IOS.Equipamento(tipo === "router" ? "router" : "switch", opc.nomeIos || T.host, d.modelo);
        d.eq.sim = this.ganchos(d);
      } else if (T.fim) {
        d.pc = { dhcp: opc.dhcp != null ? !!opc.dhcp : opc.ip ? false : !!(T.iot || ["smartphone", "tablet", "tv", "telefone_ip", "impressora"].includes(tipo)), ip: opc.ip || "", mask: opc.mask || "", gw: opc.gw || "", dns: opc.dns || "", lease: null, log: [], arp: {},
          partilhas: [], fwPartilha: false, mapas: {}, ficheiros: ["relatorio.docx", "orcamento.xlsx", "foto.jpg"], nic: T.nic || "ethernet", wifi: { ssid: "", chave: "" }, energia: false };
        if (tipo === "servidor") d.srv = { dhcp: { on: false, inicio: "", mask: "255.255.255.0", gw: "", dns: "", max: 50 }, dns: { on: true, registos: [] }, http: true };
        if (tipo === "wlc") d.wlc = { wlans: [{ ssid: "Empresa", seguranca: "wpa2", chave: "cisco12345" }] };
      } else if (tipo === "ap") d.ap = { ssid: "Default", seguranca: "aberta", chave: "", canal: 6 };
      else if (tipo === "router_wifi") d.rw = { wan: { modo: "dhcp", ip: "", mask: "", gw: "", dns: "", lease: null }, lan: { ip: "192.168.0.1", mask: "255.255.255.0", dhcp: { on: true, inicio: "192.168.0.100", max: 50 } }, wifi: { ssid: "Default", seguranca: "aberta", chave: "" } };
      else if (tipo === "asa") d.asa = { ifs: Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8].map((k) => ["GigabitEthernet1/" + k, k === 1 ? { nome: "outside", nivel: 0, modo: "dhcp", ip: "", mask: "", lease: null } : k === 2 ? { nome: "inside", nivel: 100, modo: "estatico", ip: "192.168.1.1", mask: "255.255.255.0" } : { nome: "", nivel: 0, modo: "estatico", ip: "", mask: "" }])),
        gw: "", nat: true, icmp: false, dhcp: { on: true, inicio: "192.168.1.5", max: 50 } };
      else if (tipo === "nuvem") d.nuvem = { portas: { Ethernet6: { ip: "203.0.113.1", mask: "255.255.255.0", dhcp: true }, Ethernet7: { ip: "198.51.100.1", mask: "255.255.255.0", dhcp: true },
        Coaxial7: { ip: "100.64.10.1", mask: "255.255.255.0", dhcp: true }, Modem4: { ip: "100.64.20.1", mask: "255.255.255.0", dhcp: true } } };
      ["ap", "rw", "asa", "nuvem", "wlc"].forEach((k) => { if (opc[k]) d[k] = JSON.parse(JSON.stringify(opc[k])); });
      if (d.pc && opc.nic) d.pc.nic = opc.nic;
      if (d.pc && opc.wifi) d.pc.wifi = Object.assign({}, opc.wifi);
      this.devs.push(d);
      return d;
    }
    dev(nomeOuId) { return this.devs.find((d) => d.id === nomeOuId || d.nome === nomeOuId); }

    portas(d) {
      if (ehHost(d)) { const n = nicDe(d), T = TIPOS[d.tipo]; return [].concat(n !== "wifi" ? ["FastEthernet0"] : [], n !== "ethernet" ? ["Wireless0"] : [], T.consola ? ["RS232"] : []); }
      if (d.eq) { const fis = Object.keys(d.eq.cfg.interfaces).filter((n) => !/\.|^Vlan|^Loopback|^Port-channel/.test(n)); return fis.concat("Console"); }
      return {
        hub: ["Port0", "Port1", "Port2", "Port3", "Port4", "Port5"], repetidor: ["Port0", "Port1"], bridge: ["Port0", "Port1"],
        ap: ["Port0", "Wireless"], lap: ["GigabitEthernet0", "Wireless"], router_wifi: ["Internet", "Ethernet1", "Ethernet2", "Ethernet3", "Ethernet4", "Wireless"],
        asa: d.asa ? Object.keys(d.asa.ifs).concat("Console") : [], nuvem: ["Ethernet6", "Ethernet7", "Coaxial7", "Modem4"],
        modem_dsl: ["Port0 (linha)", "Port1"], modem_cabo: ["Port0 (coaxial)", "Port1"],
      }[d.tipo] || [];
    }
    tipoPorta(p) { return p === "Console" || p === "RS232" ? "consola" : /^Wireless/.test(p) ? "wifi" : /^Serial/.test(p) ? "serial" : /^Coaxial|coaxial\)$/.test(p) ? "coax" : /^Modem|linha\)$/.test(p) ? "rj11" : /^Gigabit/.test(p) ? "giga" : "cobre"; }
    classe(d, p) { if (d.tipo === "router_wifi") return p === "Internet" ? "dte" : "dce"; return TIPOS[d.tipo].classe; }
    // Ligações sem fios: cada cliente Wi-Fi associa-se ao AP com o mesmo SSID e a chave certa.
    wifi() {
      if (this.cache && this.cache.wifi) return this.cache.wifi;
      this.cache = this.cache || {};
      const res = { links: [], estado: {} };
      this.cache.wifi = res;
      const aps = this.devs.map((a) => {
        if (a.tipo === "ap") return { a, redes: [a.ap] };
        if (a.tipo === "router_wifi") return { a, redes: [a.rw.wifi] };
        if (a.tipo === "lap") { const w = this.wlcDe(a); return w ? { a, redes: w.wlc.wlans } : null; }
        return null;
      }).filter(Boolean);
      this.devs.filter(temWifi).forEach((h) => {
        const w = h.pc.wifi || {};
        if (!w.ssid) { res.estado[h.id] = "sem rede escolhida"; return; }
        let auth = false;
        const ap = aps.find((x) => x.redes.some((r) => r.ssid === w.ssid && ((auth = true), r.seguranca === "aberta" || r.chave === w.chave)));
        if (!ap) { res.estado[h.id] = auth ? "falha de autenticação (chave errada)" : `rede “${w.ssid}” não encontrada`; return; }
        res.estado[h.id] = "ligado a " + ap.a.nome;
        res.links.push({ id: "w-" + h.id, a: h.id, pa: "Wireless0", b: ap.a.id, pb: "Wireless", cabo: "wifi" });
      });
      return res;
    }
    // LAP: procura um WLC pela rede com fios (como o CAPWAP descobre o controlador)
    wlcDe(lap) {
      const visto = new Set([lap.id]), fila = [lap];
      while (fila.length) {
        const x = fila.shift();
        for (const l of this.links) {
          if ((l.a !== x.id && l.b !== x.id) || !this.linkUp(l)) continue;
          const o = this.dev(l.a === x.id ? l.b : l.a);
          if (visto.has(o.id)) continue; visto.add(o.id);
          if (o.tipo === "wlc") return o;
          if (!ehHost(o) && o.tipo !== "router" && o.tipo !== "asa" && o.tipo !== "nuvem") fila.push(o);
        }
      }
      return null;
    }
    todosLinks() { return this.links.concat(this.wifi().links); }
    linkDe(d, p) { return this.todosLinks().find((l) => (l.a === d.id && l.pa === p) || (l.b === d.id && l.pb === p)); }
    linksDe(d) { return this.todosLinks().filter((l) => l.a === d.id || l.b === d.id); }
    portaLivre(d, p) { return !this.links.some((l) => (l.a === d.id && l.pa === p) || (l.b === d.id && l.pb === p)); }

    caboCerto(da, pa, db, pb) {
      const ta = this.tipoPorta(pa), tb = this.tipoPorta(pb);
      if (ta === "wifi" || tb === "wifi") return null;
      if (ta === "consola" || tb === "consola") return (pa === "RS232" && pb === "Console") || (pb === "RS232" && pa === "Console") ? "consola" : null;
      if (ta === "serial" || tb === "serial") return ta === tb ? "serial" : null;
      if (ta === "coax" || tb === "coax") return ta === tb ? "coaxial" : null;
      if (ta === "rj11" || tb === "rj11") return ta === tb ? "telefone" : null;
      return this.classe(da, pa) === this.classe(db, pb) ? "cruzado" : "direto";
    }
    // Estado de uma ligação: "ok" (verde), "baixo" (porta desligada, laranja), "errado" (cabo incorreto, vermelho)
    estadoLink(l) {
      if (l.cabo === "wifi") return { estado: "ok" };
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
    adminDown(d, p) { if (!d.eq) return false; const i = d.eq.cfg.interfaces[p]; return !i || i.shutdown; }
    linkUp(l) { return this.estadoLink(l).estado === "ok"; }

    ligar(da, pa, db, pb, cabo) {
      if (cabo === "auto") {
        cabo = this.caboCerto(da, pa, db, pb) || "direto";
        if (this.tipoPorta(pa) === "giga" && this.tipoPorta(pb) === "giga" && !ehHost(da) && !ehHost(db) && this.classe(da, pa) === "dce" && this.classe(db, pb) === "dce") cabo = "cruzado";
      }
      const l = { id: "l" + (this.seq++), a: da.id, pa, b: db.id, pb, cabo };
      this.links.push(l);
      this.mudou();
      return l;
    }
    portaAuto(d, outro) {
      const ps = this.portas(d).filter((p) => this.portaLivre(d, p) && !["consola", "serial", "wifi", "coax", "rj11"].includes(this.tipoPorta(p)));
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
      if (ehHost(d)) {
        if (TIPOS[d.tipo].semIp || (TIPOS[d.tipo].poe && !this.temEnergia(d))) return [];
        const c = this.ipEfetivo(d), porta = this.portaAtiva(d);
        return c.ip ? [{ iface: porta, ip: c.ip, mask: c.mask, porta, vlan: null }] : [];
      }
      if (d.tipo === "router_wifi") {
        const out = [{ iface: "LAN", ip: d.rw.lan.ip, mask: d.rw.lan.mask, lanbox: true }], w = this.wanRW(d);
        if (w.ip && this.portaUp(d, "Internet")) out.push({ iface: "Internet", ip: w.ip, mask: w.mask, porta: "Internet", vlan: null });
        return out.filter((e) => ehIP(e.ip) && mascaraOk(e.mask));
      }
      if (d.tipo === "asa") return Object.entries(d.asa.ifs).map(([n, i]) => { const e = i.modo === "dhcp" ? (i.lease || {}) : i; return e.ip && i.nome && this.portaUp(d, n) ? { iface: n, ip: e.ip, mask: e.mask, porta: n, vlan: null } : null; }).filter(Boolean);
      if (d.tipo === "nuvem") return Object.entries(d.nuvem.portas).filter(([n, p]) => ehIP(p.ip) && this.portaUp(d, n)).map(([n, p]) => ({ iface: n, ip: p.ip, mask: p.mask, porta: n, vlan: null }))
        .concat(Object.entries(INTERNET).map(([ip]) => ({ iface: "Internet", ip, mask: "255.255.255.255", loop: true })));
      if (!d.eq) return [];
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
    // Porta que o PC usa: a com fios se tiver cabo, senão o Wi-Fi.
    portaAtiva(d) {
      const ps = this.portas(d).filter((p) => p !== "RS232");
      if (ps.includes("FastEthernet0") && this.portaUp(d, "FastEthernet0")) return "FastEthernet0";
      if (ps.includes("Wireless0") && this.linkDe(d, "Wireless0")) return "Wireless0";
      return ps[0] || "FastEthernet0";
    }
    // Telefone IP: precisa de PoE (switch 3560/3650) ou do transformador
    temEnergia(d) {
      if (d.pc.energia) return true;
      const l = this.linkDe(d, "FastEthernet0"); if (!l || l.cabo === "wifi") return false;
      const o = this.dev(l.a === d.id ? l.b : l.a);
      return !!(o.eq && POE.includes(o.modelo));
    }
    wanRW(d) { const w = d.rw.wan; return w.modo === "dhcp" ? (w.lease || {}) : w; }
    ipEfetivo(d) { const c = d.pc; if (c.dhcp) return c.lease || { ip: "", mask: "", gw: "", dns: "" }; return { ip: ehIP(c.ip) ? c.ip : "", mask: c.mask, gw: c.gw, dns: c.dns }; }
    encaminha(d) { return d.tipo === "router" || ["router_wifi", "asa", "nuvem"].includes(d.tipo) || (d.eq && d.eq.cfg.ipRouting && d.eq.tipo === "switch"); }
    // Nível de segurança da interface de uma ASA
    nivelAsa(d, iface) { const i = d.asa.ifs[iface]; return i ? +i.nivel : 0; }

    // ---------------------------------------------------------------- camada 2: domínio de broadcast
    // A partir de uma interface L3, devolve os pontos L3 alcançáveis na mesma rede local e o caminho.
    dominio(d, l3) {
      const achados = [], visto = new Set(), pai = new Map();
      const chegaA = (dev, porta, vlan, de) => {
        const k = dev.id + "|" + porta + "|" + vlan; if (visto.has(k)) return; visto.add(k);
        if (!pai.has(dev.id)) pai.set(dev.id, de);
        if (ehHost(dev)) { if (vlan === null) this.l3(dev).filter((e) => e.porta === porta).forEach((e) => achados.push({ dev, e })); return; }
        if (ehPonte(dev)) { ponte(dev, vlan); return; }
        if (dev.tipo === "router_wifi") { if (vlan !== null) return; if (porta === "Internet") this.l3(dev).filter((e) => e.porta === "Internet").forEach((e) => achados.push({ dev, e })); else caixaLan(dev); return; }
        if (!dev.eq) { if (vlan === null) this.l3(dev).filter((e) => e.porta === porta).forEach((e) => achados.push({ dev, e })); return; }
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
      const sair = (dev, porta, tag) => { const l = this.linkDe(dev, porta); if (l) sairLink(dev, l, tag); };
      const sairLink = (dev, l, tag) => {
        if (!this.linkUp(l)) return;
        const eu = l.a === dev.id, outro = this.dev(eu ? l.b : l.a), pOutro = eu ? l.pb : l.pa;
        chegaA(outro, pOutro, tag, dev.id);
      };
      // hub, repetidor, bridge, AP, modem: tudo o que entra sai por todas as outras ligações
      const ponte = (dev, vlan) => { const k = dev.id + "|ponte|" + vlan; if (visto.has(k)) return; visto.add(k); this.linksDe(dev).forEach((l) => sairLink(dev, l, vlan)); };
      // router Wi-Fi: as portas Ethernet1-4 e o Wi-Fi formam um switch interno com o IP da LAN
      const caixaLan = (dev) => {
        const k = dev.id + "|lan"; if (visto.has(k)) return; visto.add(k);
        this.l3(dev).filter((e) => e.lanbox).forEach((e) => achados.push({ dev, e }));
        this.linksDe(dev).forEach((l) => { if ((l.a === dev.id ? l.pa : l.pb) !== "Internet") sairLink(dev, l, null); });
      };
      visto.add(d.id + "|" + (l3.porta || "svi") + "|origem");
      pai.set(d.id, null);
      if (l3.svi) dentroSwitch(d, l3.svi, null);
      else if (l3.lanbox) caixaLan(d);
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
        this.estaticas(d).forEach((r) => {
          if (/^[A-Za-z]/.test(r.via)) { const e = l3.find((x) => x.iface === r.via); if (e) rotas.push({ net: r.net, mask: r.mask, tipo: "S", iface: e, via: null, ad: r.ad || 1 }); return; }
          const e = l3.find((x) => mesmaRede(x.ip, r.via, x.mask));
          if (e) rotas.push({ net: r.net, mask: r.mask, tipo: "S", iface: e, via: r.via, ad: r.ad || 1 });
        });
        if (d.eq) (this.ospf().rotas[d.id] || []).forEach((r) => { const e = l3.find((x) => x.iface === r.iface); if (e) rotas.push({ net: r.net, mask: i2n(r.pref ? (2 ** 32 - 2 ** (32 - r.pref)) : 0), tipo: "O", iface: e, via: r.via, ad: 110 }); });
      }
      return rotas;
    }
    estaticas(d) {
      if (d.eq) return d.eq.cfg.routes || [];
      if (d.tipo === "router_wifi") { const w = this.wanRW(d); return ehIP(w.gw) ? [{ net: "0.0.0.0", mask: "0.0.0.0", via: w.gw }] : []; }
      if (d.tipo === "asa") { const o = Object.values(d.asa.ifs).find((i) => i.nome === "outside"); const gw = (o && o.modo === "dhcp" && o.lease ? o.lease.gw : "") || d.asa.gw; return ehIP(gw) ? [{ net: "0.0.0.0", mask: "0.0.0.0", via: gw }] : []; }
      return [];
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

    // Vai de um equipamento até um IP; devolve {ok, saltos, devs, motivo, nat}
    // retorno: é a resposta de uma ligação já aberta (a firewall deixa passar se inspecionar).
    // entrada0: interface por onde o pacote entrou no primeiro equipamento (para a ASA).
    ir(d, ip, ttl, retorno, entrada0) {
      const saltos = [], devs = [d.id];
      let atual = d, entrada = entrada0 || null, nat = null;
      for (let n = 0; n < (ttl || 16); n++) {
        if (this.l3(atual).some((e) => e.ip === ip)) return { ok: true, saltos, devs, fim: atual, nat };
        let saida, prox;
        if (this.encaminha(atual)) {
          const r = this.procurar(atual, ip);
          if (!r) return { ok: false, saltos, devs, motivo: `${nomeDe(atual)} não tem rota para ${ip}${atual.tipo === "router_wifi" || atual.tipo === "asa" ? " (falta o gateway da Internet: ligue a porta Internet/outside ao operador)" : ""}`, inalcancavel: true };
          saida = r.iface; prox = r.tipo === "C" || !r.via ? ip : r.via;
          if (atual.tipo === "asa" && entrada && saida.iface !== entrada.iface) {
            const ni = this.nivelAsa(atual, entrada.iface), ns = this.nivelAsa(atual, saida.iface);
            if (ns > ni && !retorno) return { ok: false, saltos, devs, motivo: `a firewall ${atual.nome} bloqueou: tráfego de ${atual.asa.ifs[entrada.iface].nome} (nível ${ni}) para ${atual.asa.ifs[saida.iface].nome} (nível ${ns}) só passa com uma regra de acesso` };
            if (ns > ni && retorno && !atual.asa.icmp) return { ok: false, saltos, devs, motivo: `a firewall ${atual.nome} deixou sair o ping mas bloqueou a resposta: por defeito a ASA não inspeciona ICMP (ative “Inspecionar ICMP”)` };
          }
          if (!nat && entrada && this.fazNat(atual, entrada, saida)) nat = { dev: atual, ip: saida.ip, e: saida };
        } else {
          const l3 = this.l3(atual);
          if (!l3.length) return { ok: false, saltos, devs, motivo: `${atual.nome} não tem endereço IP${TIPOS[atual.tipo].poe && !this.temEnergia(atual) ? " (o telefone está sem energia: ligue-o a um switch PoE ou ao transformador)" : ""}` };
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
          if (alvo.e.ip === ip || this.l3(alvo.dev).some((e) => e.ip === ip)) { if (ehHost(alvo.dev) && alvo.e.ip !== ip) return { ok: false, saltos, devs, motivo: "destino inalcançável" }; return { ok: true, saltos, devs, fim: alvo.dev, nat }; }
          return { ok: false, saltos, devs, motivo: `${alvo.dev.nome} não encaminha pacotes` };
        }
        atual = alvo.dev; entrada = alvo.e;
      }
      return { ok: false, saltos, devs, motivo: "TTL esgotado (loop de encaminhamento)" };
    }
    // NAT/PAT: router Wi-Fi (LAN → Internet), router Cisco com ip nat inside/outside, ASA (inside → outside)
    fazNat(d, entrada, saida) {
      if (d.tipo === "router_wifi") return !!entrada.lanbox && saida.iface === "Internet";
      if (d.tipo === "asa") return d.asa.nat && this.nivelAsa(d, entrada.iface) > this.nivelAsa(d, saida.iface);
      if (d.eq && (d.eq.cfg.natRules || []).length) { const I = d.eq.cfg.interfaces; return (I[entrada.iface] || {}).nat === "inside" && (I[saida.iface] || {}).nat === "outside"; }
      return false;
    }
    origemIp(d, ip) {
      if (ehHost(d)) return this.ipEfetivo(d).ip;
      const r = this.encaminha(d) ? this.procurar(d, ip) : null;
      if (r) return r.iface.ip;
      const l3 = this.l3(d); return l3.length ? l3[0].ip : "";
    }
    pingCompleto(d, ip) {
      const r = this.pingCalc(d, ip);
      (this.trafego = this.trafego || []).push({ de: d.nome, para: ip, ok: r.ok, devs: r.devs || [], quando: Date.now() });
      if (this.trafego.length > 40) this.trafego.shift();
      return r;
    }
    pingCalc(d, ip) {
      const ida = this.ir(d, ip);
      if (!ida.ok) return ida;
      const src = this.origemIp(d, ip);
      if (!src) return { ok: false, saltos: [], devs: ida.devs, motivo: "sem IP de origem" };
      if (ida.nat) {
        // a resposta volta para o endereço público do NAT e depois o NAT entrega-a ao PC
        const v1 = this.ir(ida.fim, ida.nat.ip, 16, true);
        if (!v1.ok) return { ok: false, saltos: ida.saltos, devs: ida.devs, motivo: `a resposta não consegue voltar ao endereço público ${ida.nat.ip}: ${v1.motivo}` };
        const v2 = this.ir(ida.nat.dev, src, 16, true, ida.nat.e);
        if (!v2.ok) return { ok: false, saltos: ida.saltos, devs: ida.devs, motivo: `a resposta chegou ao NAT mas não volta para dentro: ${v2.motivo}` };
        return { ok: true, saltos: ida.saltos, devs: ida.devs.concat(v1.devs.slice(1), v2.devs.slice(1)), ida: ida.devs, nat: ida.nat.ip };
      }
      const volta = this.ir(ida.fim, src, 16, true);
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
      // primeiro as portas Internet/outside (recebem IP do operador), depois os PCs
      this.devs.forEach((d) => {
        const w = d.tipo === "router_wifi" ? d.rw.wan : d.tipo === "asa" ? Object.entries(d.asa.ifs).find(([, i]) => i.nome === "outside" && i.modo === "dhcp") : null;
        if (!w) return;
        const [porta, cfg] = d.tipo === "router_wifi" ? ["Internet", w] : w;
        if (cfg.modo !== "dhcp") return;
        if (!this.portaUp(d, porta)) { cfg.lease = null; return; }
        if (cfg.lease && this.leaseNaRede(d, porta, cfg.lease)) return;
        cfg.lease = this.leaseDe(d, porta);
      });
      this.devs.filter((d) => ehHost(d) && d.pc.dhcp && !TIPOS[d.tipo].semIp).forEach((d) => {
        const l = d.pc.lease;
        if (l && !/^169\.254/.test(l.ip) && this.leaseValido(d)) return;
        this.pedirDhcp(d);
      });
    }
    leaseNaRede(d, porta, lease) { return this.dominio(d, { porta, vlan: null, iface: "x" }).achados.some((a) => mesmaRede(a.e.ip, lease.ip, lease.mask)); }
    leaseValido(d) { return this.leaseNaRede(d, this.portaAtiva(d), d.pc.lease); }
    pedirDhcp(d) {
      d.pc.lease = null;
      const l = TIPOS[d.tipo].poe && !this.temEnergia(d) ? null : this.leaseDe(d, this.portaAtiva(d));
      if (l) { d.pc.lease = l; return; }
      const k = this.devs.indexOf(d);
      d.pc.lease = { ip: `169.254.${10 + (k % 200)}.${2 + ((k * 37) % 250)}`, mask: "255.255.0.0", gw: "", dns: "", apipa: true };
    }
    todasLeases(eu) {
      const out = [];
      this.devs.forEach((x) => {
        if (x === eu) return;
        if (x.pc && x.pc.lease) out.push(x.pc.lease.ip);
        if (x.rw && x.rw.wan.lease) out.push(x.rw.wan.lease.ip);
        if (x.asa) Object.values(x.asa.ifs).forEach((i) => { if (i.lease) out.push(i.lease.ip); });
      });
      return new Set(out);
    }
    // Pede um endereço por DHCP a partir de uma porta: devolve {ip, mask, gw, dns, de} ou null
    leaseDe(d, porta) {
      const dom = this.dominio(d, { porta, vlan: null, iface: "x" });
      const usados = new Set(this.devs.flatMap((x) => x === d ? [] : this.l3(x).map((e) => e.ip))), dados = this.todasLeases(d);
      const livre = (ip) => !usados.has(ip) && !dados.has(ip);
      const intervalo = (ini, max, mask, gw, dns, de, excl) => { const b = n2i(ini); for (let k = 0; k < max; k++) { const ip = i2n(b + k); if (livre(ip) && !this.excluido(ip, excl)) return { ip, mask, gw, dns, de }; } return null; };
      for (const a of dom.achados) {
        const x = a.dev;
        if (x.eq) {
          const pools = Object.values(x.eq.cfg.dhcpPools || {});
          let p = pools.find((q) => q.net && q.mask && redeDe(a.e.ip, q.mask) === q.net), excl = x.eq.cfg.dhcpExcl, quem = x.eq.cfg.hostname;
          const helper = x.eq.cfg.interfaces[a.e.iface] && x.eq.cfg.interfaces[a.e.iface].helper;
          if (!p && helper) {
            const h = this.dono(helper);
            if (h && this.ir(x, helper).ok) {
              if (h.eq) { p = Object.values(h.eq.cfg.dhcpPools || {}).find((q) => q.net && q.mask && redeDe(a.e.ip, q.mask) === q.net); excl = h.eq.cfg.dhcpExcl; quem = h.eq.cfg.hostname; }
              else if (h.srv && h.srv.dhcp.on && mesmaRede(h.srv.dhcp.inicio, a.e.ip, h.srv.dhcp.mask)) { const s2 = h.srv.dhcp; const r = intervalo(s2.inicio, s2.max || 50, s2.mask, s2.gw, s2.dns, h.nome); if (r) return r; }
            }
          }
          if (p) { const tam = 2 ** (32 - pref(p.mask)); const r = intervalo(i2n(n2i(p.net) + 1), tam - 2, p.mask, p.gw, (p.dns || "").split(" ")[0], quem, excl); if (r) return r; }
        } else if (x.srv && x.srv.dhcp.on && ehIP(x.srv.dhcp.inicio)) { const s2 = x.srv.dhcp; const r = intervalo(s2.inicio, s2.max || 50, s2.mask, s2.gw, s2.dns, x.nome); if (r) return r; }
        else if (x.tipo === "router_wifi" && a.e.lanbox && x.rw.lan.dhcp.on) { const r = intervalo(x.rw.lan.dhcp.inicio, x.rw.lan.dhcp.max || 50, x.rw.lan.mask, x.rw.lan.ip, x.rw.lan.ip, x.nome); if (r) return r; }
        else if (x.tipo === "asa" && x.asa.dhcp.on && (x.asa.ifs[a.e.iface] || {}).nome === "inside") { const r = intervalo(x.asa.dhcp.inicio, x.asa.dhcp.max || 50, a.e.mask, a.e.ip, "8.8.8.8", x.nome); if (r) return r; }
        else if (x.tipo === "nuvem" && (x.nuvem.portas[a.e.iface] || {}).dhcp) { const r = intervalo(i2n(n2i(redeDe(a.e.ip, a.e.mask)) + 10), 200, a.e.mask, a.e.ip, "8.8.8.8", "operador"); if (r) return r; }
      }
      return null;
    }
    leaseUsado(ip, eu) { return this.todasLeases(eu).has(ip); }
    excluido(ip, excl) { const n = n2i(ip); return (excl || []).some((e) => { const a = n2i(e[0]), b = n2i(e[1] || e[0]); return n >= a && n <= b; }); }

    // ---------------------------------------------------------------- DNS
    resolver(d, nome) {
      if (ehIP(nome)) return { ip: nome };
      const porNome = this.devs.find((x) => x.nome.toLowerCase() === nome.toLowerCase());
      const dns = ehHost(d) ? this.ipEfetivo(d).dns : "";
      if (ehIP(dns)) {
        let srv = this.dono(dns);
        if (!srv || !this.pingCalc(d, dns).ok) return { erro: `DNS request timed out. (servidor ${dns} inalcançável)` };
        // o router Wi-Fi reencaminha as perguntas DNS para o DNS do operador
        if (srv.tipo === "router_wifi") { const w = this.wanRW(srv); if (!ehIP(w.dns) || !this.pingCalc(srv, w.dns).ok) return { erro: `DNS request timed out. (${srv.nome} não chega ao DNS do operador)` }; srv = this.dono(w.dns); }
        const nm = nome.toLowerCase();
        if (srv && srv.tipo === "nuvem") { const ip = Object.keys(INTERNET).find((k) => INTERNET[k] === nm); return ip ? { ip, servidor: dns } : { erro: `*** ${dns} não encontrou ${nome}: Non-existent domain (na Internet simulada existem: ${Object.values(INTERNET).join(", ")})` }; }
        if (srv && srv.srv && srv.srv.dns.on) {
          const r = srv.srv.dns.registos.find((x) => x.nome.toLowerCase() === nm);
          if (r) return { ip: r.ip, servidor: dns };
          return { erro: `*** ${dns} não encontrou ${nome}: Non-existent domain` };
        }
        return { erro: `DNS request timed out. (${dns} não é um servidor DNS)` };
      }
      if (porNome) return { erro: `Ping request could not find host ${nome}. Configure um servidor DNS (o nome do equipamento não é um nome DNS).` };
      return { erro: `Ping request could not find host ${nome}. Please check the name and try again.` };
    }

    // ---------------------------------------------------------------- partilha de ficheiros (SMB, porta TCP 445)
    // Nome → IP: endereço, DNS, ou nome NetBIOS de um equipamento na mesma rede (difusão local).
    resolverSmb(d, nome) {
      if (ehIP(nome)) return { ip: nome };
      const r = this.resolver(d, nome); if (r.ip) return r;
      const alvo = this.devs.find((x) => x.nome.toLowerCase() === nome.toLowerCase() && ehHost(x));
      const a = this.ipEfetivo(d), b = alvo ? this.ipEfetivo(alvo) : {};
      if (alvo && b.ip && a.ip && redeDe(a.ip, a.mask) === redeDe(b.ip, a.mask)) return { ip: b.ip, netbios: true };
      return { erro: `O nome ${nome} não foi encontrado. Noutra rede use o endereço IP ou um registo DNS (o NetBIOS só funciona na mesma rede).` };
    }
    // Abre \\servidor\partilha a partir do PC d: { ok, p (partilha), alvo, ip } ou { erro }
    abrirPartilha(d, caminho) {
      const m = String(caminho).match(/^\\\\([^\\]+)(?:\\([^\\]+))?\\?$/);
      if (!m) return { erro: "Caminho inválido. Use o formato \\\\servidor\\pasta (ex.: \\\\192.168.1.10\\Documentos)." };
      if (!this.ipEfetivo(d).ip) return { erro: "Este PC não tem endereço IP." };
      const r = this.resolverSmb(d, m[1]); if (!r.ip) return { erro: "Erro de sistema 53.\n\nO caminho de rede não foi encontrado.\n(" + r.erro + ")" };
      const alvo = this.dono(r.ip);
      const ping = this.pingCompleto(d, r.ip);
      if (!ping.ok) return { erro: `Erro de sistema 53.\n\nO caminho de rede não foi encontrado.\n(motivo simulado: ${r.ip} não responde — ${ping.motivo})` };
      if (!alvo || !alvo.pc) return { erro: "Erro de sistema 53.\n\nO caminho de rede não foi encontrado.\n(motivo simulado: " + r.ip + " não é um computador com partilhas)" };
      if (!alvo.pc.fwPartilha) return { erro: `Erro de sistema 53.\n\nO caminho de rede não foi encontrado.\n(motivo simulado: a firewall de ${alvo.nome} bloqueia a porta TCP 445. Ative “Partilha de ficheiros e impressoras” nesse computador.)` };
      if (!m[2]) return { ok: true, alvo, ip: r.ip, lista: true };
      const p = alvo.pc.partilhas.find((x) => x.nome.toLowerCase() === m[2].toLowerCase());
      if (!p) return { erro: "Erro de sistema 67.\n\nNão foi possível encontrar o nome de rede.\n(a pasta " + m[2] + " não está partilhada em " + alvo.nome + ")" };
      return { ok: true, alvo, ip: r.ip, p, anim: ping.devs };
    }

    // ---------------------------------------------------------------- guardar / carregar
    exportar() {
      return { seq: this.seq, devs: this.devs.map((d) => ({ id: d.id, tipo: d.tipo, nome: d.nome, x: d.x, y: d.y, modelo: d.modelo, cfg: d.eq ? d.eq.cfg : null, startup: d.eq ? d.eq.startup : null, pc: d.pc ? Object.assign({}, d.pc, { log: [] }) : null, srv: d.srv || null,
        ap: d.ap, rw: d.rw, asa: d.asa, nuvem: d.nuvem, wlc: d.wlc })), links: this.links };
    }
    static importar(o) {
      const r = new Rede(); r.seq = o.seq || 1;
      o.devs.forEach((s) => {
        const d = r.novoDev(s.tipo, s.x, s.y, s.nome, { modelo: s.modelo, ap: s.ap, rw: s.rw, asa: s.asa, nuvem: s.nuvem, wlc: s.wlc });
        d.id = s.id;
        if (d.eq && s.cfg) { d.eq.cfg = s.cfg; d.eq.startup = s.startup || ""; d.eq.sim = r.ganchos(d); }
        if (d.pc && s.pc) d.pc = Object.assign(d.pc, s.pc, { log: [] }, { partilhas: s.pc.partilhas || [], mapas: s.pc.mapas || {}, ficheiros: s.pc.ficheiros || d.pc.ficheiros });
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
      case "partilha": { const d = rede.dev(c.nome); return !!(d && d.pc && d.pc.partilhas.some((p) => p.nome.toLowerCase() === c.share.toLowerCase() && (!c.perm || p.perm === c.perm))); }
      case "fw_partilha": { const d = rede.dev(c.nome); return !!(d && d.pc && d.pc.fwPartilha); }
      case "mapa": { const d = rede.dev(c.pc); if (!d || !d.pc) return false; return Object.entries(d.pc.mapas).some(([l, cam]) => (!c.letra || l.toUpperCase() === c.letra.toUpperCase()) && (!c.por || (c.por === "nome" ? !/\\\\\d/.test(cam) : true)) && rede.abrirPartilha(d, cam).p && rede.abrirPartilha(d, cam).p.nome.toLowerCase() === c.share.toLowerCase()); }
      case "ficheiro_partilha": { const d = rede.dev(c.nome); return !!(d && d.pc && d.pc.partilhas.some((p) => p.nome.toLowerCase() === c.share.toLowerCase() && (p.ficheiros || []).some((f) => f.de))); }
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
    if (c === "help" || c === "?") return { txt: "Comandos disponíveis:\n  ipconfig [/all | /release | /renew]\n  ping <IP ou nome>\n  tracert <IP ou nome>\n  nslookup <nome>\n  arp -a\n  hostname\n  net share [Nome=C:\\Pasta /grant:Todos,READ|CHANGE]\n  net view \\\\servidor\n  net use [Z: \\\\servidor\\pasta | Z: /delete]\n  dir [Z:]\n  copy <ficheiro> Z:\n  netsh advfirewall firewall set rule group=\"Partilha de ficheiros e impressoras\" new enable=Yes\n  cls" };
    if (c === "cls") return { limpar: true };
    if (c === "ipconfig") {
      const op = (t[1] || "").toLowerCase();
      if (op === "/release") { if (!d.pc.dhcp) return { txt: "O adaptador não está configurado para DHCP." }; d.pc.lease = null; d.pc.libertado = true; return { txt: "Endereço IP libertado.", mudou: true }; }
      if (op === "/renew") { if (!d.pc.dhcp) return { txt: "O adaptador não está configurado para DHCP. Mude para DHCP em Configuração IP." }; d.pc.libertado = false; rede.pedirDhcp(d); const l = d.pc.lease; return { txt: l.apipa ? "Não foi possível contactar o servidor DHCP.\nEndereço automático (APIPA): " + l.ip : `DHCP: recebido ${l.ip} de ${l.de}\n   Máscara . . . . : ${l.mask}\n   Gateway . . . . : ${l.gw || "-"}\n   DNS . . . . . . : ${l.dns || "-"}`, mudou: true }; }
      const mac = "00D0.BA" + String(d.id).padStart(2, "0").slice(-2) + ".1" + String(rede.devs.indexOf(d)).padStart(3, "0");
      const pa = rede.portaAtiva(d);
      return { txt: `${pa === "Wireless0" ? "Adaptador de rede sem fios Wi-Fi (" + (d.pc.wifi.ssid || "sem rede") + ")" : "Adaptador Ethernet FastEthernet0"}:\n   Endereço IPv4 . . . . . : ${cfg.ip || "0.0.0.0"}\n   Máscara de sub-rede . . : ${cfg.mask || "0.0.0.0"}\n   Gateway predefinido . . : ${cfg.gw || "0.0.0.0"}` + (op === "/all" ? `\n   Endereço físico . . . . : ${mac}\n   DHCP ativo  . . . . . . : ${d.pc.dhcp ? "Sim" : "Não"}\n   Servidor DNS  . . . . . : ${cfg.dns || "-"}` : "") };
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
    if (c === "hostname") return { txt: d.nome };
    if (c === "netsh" && /wlan/i.test(linha)) return { txt: temWifi(d) ? `Nome      : Wi-Fi\nEstado    : ${rede.wifi().estado[d.id] || "desligado"}\nSSID      : ${d.pc.wifi.ssid || "-"}\nAutenticação: WPA2-Pessoal` : "Este equipamento não tem placa sem fios." };
    if (c === "net") {
      const sub = (t[1] || "").toLowerCase(), resto = linha.trim().split(/\s+/).slice(2).join(" ");
      if (sub === "share") {
        if (!t[2]) return { txt: d.pc.partilhas.length ? "Nome da partilha   Recurso                         Observação\n" + "-".repeat(64) + "\n" + d.pc.partilhas.map((p) => p.nome.padEnd(19) + p.pasta.padEnd(32) + (p.perm === "W" ? "Todos: Alteração" : "Todos: Leitura")).join("\n") + "\nO comando foi concluído com êxito." : "Não existem entradas na lista." };
        const del = resto.match(/^(\S+)\s+\/delete$/i);
        if (del) { const n = d.pc.partilhas.length; d.pc.partilhas = d.pc.partilhas.filter((p) => p.nome.toLowerCase() !== del[1].toLowerCase()); return { txt: n !== d.pc.partilhas.length ? del[1] + " foi eliminado." : "O nome de partilha não existe.", mudou: true }; }
        const m = resto.match(/^([^=\s]+)=(\S+)(?:\s+\/grant:([^,]+),(read|change|full))?/i);
        if (!m) return { txt: "Sintaxe: net share Nome=C:\\Pasta /grant:Todos,READ   (READ = leitura, CHANGE = alteração, FULL = controlo total)" };
        if (d.pc.partilhas.some((p) => p.nome.toLowerCase() === m[1].toLowerCase())) return { txt: "Erro de sistema 2118: o nome já está partilhado." };
        d.pc.partilhas.push({ nome: m[1], pasta: m[2], perm: m[4] && /change|full/i.test(m[4]) ? "W" : "R", ficheiros: [{ nome: "LEIA-ME.txt" }] });
        return { txt: `${m[1]} foi partilhado com êxito.${!d.pc.fwPartilha ? "\n(atenção: a firewall deste computador ainda bloqueia a partilha — ative a regra “Partilha de ficheiros e impressoras”)" : ""}`, mudou: true };
      }
      if (sub === "view") {
        if (!t[2]) return { txt: "Uso: net view \\\\servidor" };
        const r = rede.abrirPartilha(d, t[2].replace(/\\+$/, ""));
        if (r.erro) return { txt: r.erro, ok: false };
        return { txt: `Recursos partilhados em ${t[2]}\n\nNome da partilha  Tipo   Usada como  Comentário\n${"-".repeat(56)}\n` + (r.alvo.pc.partilhas.map((p) => p.nome.padEnd(18) + "Disco").join("\n") || "(nenhuma pasta partilhada)") + "\nO comando foi concluído com êxito.", anim: rede.pingCompleto(d, r.ip).devs, ok: true };
      }
      if (sub === "use") {
        if (!t[2]) { const e = Object.entries(d.pc.mapas); return { txt: e.length ? "Estado       Local     Remoto\n" + "-".repeat(50) + "\n" + e.map(([l, cam]) => `${rede.abrirPartilha(d, cam).ok ? "OK" : "Indisponível"}`.padEnd(13) + l.padEnd(10) + cam).join("\n") : "Não há ligações à rede." }; }
        const del = resto.match(/^([a-z]:|\*)\s+\/delete/i);
        if (del) { if (del[1] === "*") d.pc.mapas = {}; else delete d.pc.mapas[del[1].toUpperCase()]; return { txt: del[1].toUpperCase() + " foi eliminado.", mudou: true }; }
        const m = resto.match(/^(?:([a-z]:)\s+)?(\\\\\S+)/i);
        if (!m) return { txt: "Sintaxe: net use Z: \\\\servidor\\pasta /persistent:yes" };
        const r = rede.abrirPartilha(d, m[2]);
        if (r.erro) return { txt: r.erro, ok: false };
        if (!r.p) return { txt: "Indique a pasta: \\\\servidor\\pasta" };
        const letra = (m[1] || "Z:").toUpperCase();
        d.pc.mapas[letra] = m[2];
        return { txt: (m[1] ? "" : `Unidade ${letra} está agora ligada a ${m[2]}.\n\n`) + "O comando foi concluído com êxito.", mudou: true, anim: r.anim, ok: true };
      }
      return { txt: "A sintaxe deste comando é:\nNET [ SHARE | USE | VIEW ]" };
    }
    if (c === "netsh") {
      if (/firewall/i.test(linha) && /(partilha de ficheiros|file and printer sharing)/i.test(linha)) { const on = /enable\s*=\s*(yes|sim)/i.test(linha); d.pc.fwPartilha = on; return { txt: `Atualizadas regras do grupo “Partilha de ficheiros e impressoras”: ${on ? "ativadas" : "desativadas"}.\nOk.`, mudou: true }; }
      return { txt: "Exemplo: netsh advfirewall firewall set rule group=\"Partilha de ficheiros e impressoras\" new enable=Yes" };
    }
    const unidade = (x) => { const k = (x || "").toUpperCase().replace(/\\$/, ""); if (/^[A-Z]:$/.test(k) && k !== "C:") { const cam = d.pc.mapas[k]; if (!cam) return { erro: "O sistema não consegue encontrar a unidade especificada." }; return rede.abrirPartilha(d, cam); } if (/^\\\\/.test(x || "")) return rede.abrirPartilha(d, x); return null; };
    if (c === "dir") {
      const u = unidade(t[1]);
      if (!u) return { txt: " Diretório de C:\\Users\\" + d.nome + "\\Documentos\n\n" + d.pc.ficheiros.map((f) => "  " + f).join("\n") + `\n        ${d.pc.ficheiros.length} ficheiro(s)` };
      if (u.erro) return { txt: u.erro, ok: false };
      if (!u.p) return { txt: "Indique a pasta partilhada." };
      return { txt: ` Diretório de ${t[1]} (${u.p.nome} em ${u.alvo.nome})\n\n` + u.p.ficheiros.map((f) => "  " + f.nome + (f.de ? "   (copiado de " + f.de + ")" : "")).join("\n") + `\n        ${u.p.ficheiros.length} ficheiro(s)`, anim: u.anim, ok: true };
    }
    if (c === "copy") {
      if (!t[1] || !t[2]) return { txt: "Uso: copy relatorio.docx Z:" };
      if (!d.pc.ficheiros.includes(t[1])) return { txt: "O sistema não consegue encontrar o ficheiro especificado. Ficheiros: " + d.pc.ficheiros.join(", ") };
      const u = unidade(t[2]); if (!u) return { txt: "Destino inválido. Use uma unidade de rede (ex.: Z:) ou \\\\servidor\\pasta." };
      if (u.erro) return { txt: u.erro, ok: false };
      if (u.p.perm !== "W") return { txt: "Acesso negado.\n(a partilha só dá permissão de Leitura a Todos. No servidor, mude a permissão para Alteração.)", ok: false };
      if (!u.p.ficheiros.some((f) => f.nome === t[1])) u.p.ficheiros.push({ nome: t[1], de: d.nome });
      return { txt: "        1 ficheiro(s) copiado(s).", mudou: true, anim: u.anim, ok: true };
    }
    if (c === "arp") { const ips = Object.keys(d.pc.arp); return { txt: ips.length ? "  Internet Address      Physical Address      Type\n" + ips.map((ip) => `  ${ip.padEnd(22)}00d0.ba${(n2i(ip) % 255).toString(16).padStart(2, "0")}.${(n2i(ip) % 9000 + 1000)}        dynamic`).join("\n") : "No ARP Entries Found" }; }
    return { txt: `'${t[0]}' não é reconhecido como comando. Escreva help para ver os comandos.` };
  }

  window.Simulador = { Rede, TIPOS, CABOS, CATALOGO, INTERNET, ehPonte, temWifi, nicDe, verificar, promptPC, ehHost, ehIP, mascaraOk };
})();
