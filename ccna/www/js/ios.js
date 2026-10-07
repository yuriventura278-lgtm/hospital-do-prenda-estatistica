/* Simulador didático do Cisco IOS.
   Não é um emulador completo: cobre os comandos do CCNA usados nos laboratórios,
   com abreviações, "?" para ajuda, "do" nos modos de configuração e mensagens
   de erro iguais às do IOS real. */
(function () {
  "use strict";

  const IFNOMES = [
    [/^(gigabitethernet|gigabit|gig|gi|g)$/i, "GigabitEthernet"],
    [/^(fastethernet|fast|fa|f)$/i, "FastEthernet"],
    [/^(serial|se|s)$/i, "Serial"],
    [/^(loopback|loop|lo)$/i, "Loopback"],
    [/^(vlan|vl)$/i, "Vlan"],
    [/^(port-channel|po)$/i, "Port-channel"],
  ];
  const ABREV = { GigabitEthernet: "Gi", FastEthernet: "Fa", Serial: "Se", Loopback: "Lo", Vlan: "Vlan", "Port-channel": "Po" };

  function normIf(txt) {
    const m = String(txt).trim().match(/^([a-z-]+)\s*([\d/.]+)$/i);
    if (!m) return null;
    for (const [re, nome] of IFNOMES) if (re.test(m[1])) return nome + m[2];
    return null;
  }
  const curto = (nome) => { const m = nome.match(/^([A-Za-z-]+)(.*)$/); return (ABREV[m[1]] || m[1]) + m[2]; };
  const ehIP = (s) => /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.test(s) && s.split(".").every((o) => +o <= 255);
  const pad = (s, n) => (String(s) + " ".repeat(n)).slice(0, n);

  // Junta "g 0/0" em "g0/0" e "fa0/1 - 5" mantém-se.
  function tokens(linha) {
    const t = linha.trim().split(/\s+/).filter(Boolean);
    const out = [];
    for (let i = 0; i < t.length; i++) {
      // "vlan 10" só é interface depois de "interface" (senão é o comando vlan)
      const ehVlan = /^(vlan|vl)$/i.test(t[i]);
      const aposInterface = i > 0 && /^int/i.test(t[i - 1]);
      if ((!ehVlan || aposInterface) && /^[a-z-]+$/i.test(t[i]) && t[i + 1] && /^\d+(\/\d+)*(\.\d+)?$/.test(t[i + 1]) && normIf(t[i] + t[i + 1]) && IFNOMES.some(([re]) => re.test(t[i]))) {
        out.push(t[i] + t[i + 1]); i++;
      } else out.push(t[i]);
    }
    return out;
  }

  class Equipamento {
    constructor(tipo, hostname) {
      this.tipo = tipo;
      this.modo = "user";
      this.ctx = null;
      this.executados = new Set();
      this.cfg = {
        hostname: hostname || (tipo === "switch" ? "Switch" : "Router"),
        domainLookup: true, domain: "", enableSecret: "", enablePassword: "", pwdEnc: false, banner: "",
        users: {}, rsa: false, sshV2: false, ipRouting: tipo === "router", ipv6Routing: false,
        lines: { con: { password: "", login: false, local: false }, vty: { password: "", login: false, local: false, transport: "all" } },
        interfaces: {}, vlans: tipo === "switch" ? { 1: "default" } : {}, routes: [], ospf: null,
        dhcpExcl: [], dhcpPools: {}, acls: {}, natRules: [], ntp: [], stpMode: "pvst",
      };
      const add = (n, extra) => { this.cfg.interfaces[n] = Object.assign({ ip: "", mask: "", shutdown: tipo === "router", desc: "", mode: "", accessVlan: 1, native: 1, nonegotiate: false, portsec: false, psMax: 1, psSticky: false, nat: "", helper: "", portfast: false, encap: null, routed: tipo === "router" }, extra || {}); };
      if (tipo === "router") ["GigabitEthernet0/0", "GigabitEthernet0/1", "GigabitEthernet0/2", "Serial0/1/0"].forEach((n) => add(n));
      else {
        for (let i = 1; i <= 24; i++) add("FastEthernet0/" + i);
        add("GigabitEthernet0/1"); add("GigabitEthernet0/2");
        add("Vlan1", { shutdown: true, routed: true });
      }
      this.startup = "";
    }

    prompt() {
      const h = this.cfg.hostname;
      return h + ({ user: ">", priv: "#", config: "(config)#", if: "(config-if)#", range: "(config-if-range)#", subif: "(config-subif)#", line: "(config-line)#", router: "(config-router)#", vlan: "(config-vlan)#", dhcp: "(dhcp-config)#" }[this.modo]);
    }

    // ------------------------------------------------------------ execução
    executar(linha) {
      const bruto = linha.replace(/\s+$/, "");
      if (!bruto.trim()) return "";
      if (bruto.trim().endsWith("?")) return this.ajuda(bruto.trim().slice(0, -1));
      let t = tokens(bruto);
      const emConfig = !["user", "priv"].includes(this.modo);
      if (emConfig && /^do$/i.test(t[0])) {
        const guardado = this.modo; this.modo = "priv";
        let r;
        try { r = this.correr(t.slice(1), bruto.replace(/^\s*do\s+/i, "")); } finally { this.modo = guardado; }
        return r;
      }
      return this.correr(t, bruto);
    }

    correr(t, bruto) {
      const defs = COMANDOS.filter((d) => d.modos.includes(this.modo) && (!d.so || d.so === this.tipo));
      let incompleto = false;
      for (const d of defs) {
        const r = casar(d.padrao, t);
        if (r === "incompleto") { incompleto = true; continue; }
        if (r) {
          this.executados.add(d.padrao.filter((p) => !p.startsWith("<")).join(" "));
          const saida = d.fn.call(this, r, t, bruto);
          return saida == null ? "" : saida;
        }
      }
      // comando válido noutro modo de configuração? (o IOS sai automaticamente do submodo)
      if (["if", "range", "subif", "line", "router", "vlan", "dhcp"].includes(this.modo)) {
        const glob = COMANDOS.filter((d) => d.modos.includes("config") && (!d.so || d.so === this.tipo));
        for (const d of glob) {
          const r = casar(d.padrao, t);
          if (r && r !== "incompleto") {
            this.modo = "config"; this.ctx = null;
            this.executados.add(d.padrao.filter((p) => !p.startsWith("<")).join(" "));
            const saida = d.fn.call(this, r, t, bruto);
            return saida == null ? "" : saida;
          }
        }
      }
      if (incompleto) return "% Incomplete command.";
      const recuo = " ".repeat(this.prompt().length + Math.max(0, posErro(bruto, t, defs)));
      return `${recuo}^\n% Invalid input detected at '^' marker.`;
    }

    ajuda(prefixo) {
      const t = tokens(prefixo);
      const acabaEspaco = /\s$/.test(prefixo) || prefixo === "";
      const defs = COMANDOS.filter((d) => d.modos.includes(this.modo) && (!d.so || d.so === this.tipo));
      const opcoes = new Map();
      defs.forEach((d) => {
        const n = acabaEspaco ? t.length : t.length - 1;
        for (let i = 0; i < n; i++) {
          if (!d.padrao[i] || !bate(d.padrao[i], t[i])) return;
        }
        const prox = d.padrao[n];
        if (!prox) { opcoes.set("<cr>", ""); return; }
        if (!acabaEspaco && !(prox.startsWith("<") || prox.toLowerCase().startsWith(t[n].toLowerCase()))) return;
        if (!opcoes.has(prox)) opcoes.set(prox, n === 0 ? d.ajuda || "" : "");
      });
      if (!opcoes.size) return "% Unrecognized command";
      const NOMES = { "<if>": "INTERFACE (ex.: g0/0, fa0/1)", "<ip>": "A.B.C.D", "<n>": "<número>", "<w>": "WORD", "<rest>": "LINE (texto)" };
      return [...opcoes].map(([k, v]) => "  " + pad(NOMES[k] || (k.includes("|") ? k.split("|").join(" | ") : k), 24) + v).join("\n");
    }

    // Tab: completa a última palavra quando só há uma hipótese
    completar(linha) {
      const t = tokens(linha);
      if (!t.length || /\s$/.test(linha)) return linha;
      const n = t.length - 1;
      const defs = COMANDOS.filter((d) => d.modos.includes(this.modo) && (!d.so || d.so === this.tipo));
      const hip = new Set();
      defs.forEach((d) => {
        for (let i = 0; i < n; i++) if (!d.padrao[i] || !bate(d.padrao[i], t[i])) return;
        const p = d.padrao[n];
        if (p && !p.startsWith("<")) p.split("|").forEach((o) => { if (o.toLowerCase().startsWith(t[n].toLowerCase())) hip.add(o); });
      });
      if (hip.size !== 1) return linha;
      const palavra = [...hip][0];
      return linha.replace(/\S+$/, palavra) + " ";
    }

    // ------------------------------------------------------------ utilidades
    iface(nome) {
      const n = normIf(nome);
      if (!n) return null;
      if (!this.cfg.interfaces[n]) {
        if (/^(Loopback|Vlan|Port-channel)/.test(n) || (/\./.test(n) && this.cfg.interfaces[n.split(".")[0]])) {
          this.cfg.interfaces[n] = { ip: "", mask: "", shutdown: false, desc: "", mode: "", accessVlan: 1, native: 1, nat: "", helper: "", encap: null, routed: true };
          if (/^Vlan/.test(n) && this.tipo === "switch") this.cfg.interfaces[n].shutdown = true;
        } else return null;
      }
      return n;
    }
    ifsAtuais() { return Array.isArray(this.ctx) ? this.ctx : [this.ctx]; }
    cadaIf(fn) { this.ifsAtuais().forEach((n) => fn(this.cfg.interfaces[n], n)); }

    estado() { return JSON.stringify(this.cfg); }
    guardar() { this.startup = this.estado(); return "Building configuration...\n[OK]"; }

    // ------------------------------------------------------------ show
    runningConfig() {
      const c = this.cfg, L = ["Building configuration...", "", "Current configuration : " + (1200 + Object.keys(c.interfaces).length * 40) + " bytes", "!", "version 15.2"];
      L.push(c.pwdEnc ? "service password-encryption" : "no service password-encryption", "!", "hostname " + c.hostname, "!");
      if (c.enableSecret) L.push("enable secret 9 $9$" + hash(c.enableSecret));
      if (c.enablePassword) L.push("enable password " + (c.pwdEnc ? "7 " + tipo7(c.enablePassword) : c.enablePassword));
      Object.entries(c.users).forEach(([u, s]) => L.push(`username ${u} secret 9 $9$${hash(s)}`));
      if (!c.domainLookup) L.push("no ip domain-lookup");
      if (c.domain) L.push("ip domain-name " + c.domain);
      if (c.sshV2) L.push("ip ssh version 2");
      if (c.ipRouting && this.tipo === "switch") L.push("ip routing");
      if (c.ipv6Routing) L.push("ipv6 unicast-routing");
      c.dhcpExcl.forEach((e) => L.push("ip dhcp excluded-address " + e.join(" ")));
      Object.entries(c.dhcpPools).forEach(([n, p]) => {
        L.push("!", "ip dhcp pool " + n);
        if (p.net) L.push(" network " + p.net + " " + p.mask);
        if (p.gw) L.push(" default-router " + p.gw);
        if (p.dns) L.push(" dns-server " + p.dns);
        if (p.domain) L.push(" domain-name " + p.domain);
      });
      if (this.tipo === "switch") L.push("!", "spanning-tree mode " + c.stpMode);
      Object.entries(c.vlans).filter(([id]) => id !== "1").forEach(([id, nome]) => L.push("!", "vlan " + id, " name " + nome));
      Object.entries(c.interfaces).forEach(([n, i]) => {
        L.push("!", "interface " + n);
        if (i.desc) L.push(" description " + i.desc);
        if (i.encap) L.push(" encapsulation dot1Q " + i.encap + (i.encapNative ? " native" : ""));
        if (this.tipo === "switch" && !/^(Vlan|Loopback)/.test(n)) {
          if (!i.routed) {
            if (i.mode === "access") L.push(" switchport mode access");
            if (i.accessVlan !== 1) L.push(" switchport access vlan " + i.accessVlan);
            if (i.native !== 1) L.push(" switchport trunk native vlan " + i.native);
            if (i.allowed) L.push(" switchport trunk allowed vlan " + i.allowed);
            if (i.mode === "trunk") L.push(" switchport mode trunk");
            if (i.nonegotiate) L.push(" switchport nonegotiate");
            if (i.portsec) L.push(" switchport port-security");
            if (i.psMax > 1) L.push(" switchport port-security maximum " + i.psMax);
            if (i.psSticky) L.push(" switchport port-security mac-address sticky");
            if (i.psViol) L.push(" switchport port-security violation " + i.psViol);
            if (i.portfast) L.push(" spanning-tree portfast");
            if (i.bpduguard) L.push(" spanning-tree bpduguard enable");
          } else L.push(" no switchport");
        }
        if (i.ip) L.push(" ip address " + (i.ip === "dhcp" ? "dhcp" : i.ip + " " + i.mask));
        else if (i.routed || /^Vlan/.test(n)) L.push(" no ip address");
        if (i.helper) L.push(" ip helper-address " + i.helper);
        if (i.nat) L.push(" ip nat " + i.nat);
        (i.ipv6 || []).forEach((a) => L.push(" ipv6 address " + a));
        if (i.shutdown) L.push(" shutdown");
      });
      if (c.ospf) {
        L.push("!", "router ospf " + c.ospf.pid);
        if (c.ospf.rid) L.push(" router-id " + c.ospf.rid);
        c.ospf.passive.forEach((p) => L.push(" passive-interface " + p));
        c.ospf.nets.forEach((n) => L.push(` network ${n.net} ${n.wc} area ${n.area}`));
        if (c.ospf.defOrig) L.push(" default-information originate");
      }
      c.natRules.forEach((r) => L.push(r));
      c.routes.forEach((r) => L.push(`ip route ${r.net} ${r.mask} ${r.via}${r.ad ? " " + r.ad : ""}`));
      Object.entries(c.acls).forEach(([n, linhas]) => linhas.forEach((l) => L.push(`access-list ${n} ${l}`)));
      c.ntp.forEach((s) => L.push("ntp server " + s));
      if (c.banner) L.push("!", "banner motd ^C" + c.banner + "^C");
      ["con", "vty"].forEach((k) => {
        const l = c.lines[k];
        L.push("!", k === "con" ? "line con 0" : "line vty 0 4");
        if (l.password) L.push(" password " + (c.pwdEnc ? "7 " + tipo7(l.password) : l.password));
        if (l.local) L.push(" login local"); else if (l.login) L.push(" login");
        if (k === "vty" && l.transport !== "all") L.push(" transport input " + l.transport);
      });
      L.push("!", "end");
      return L.join("\n");
    }

    ipIntBrief() {
      const L = ["Interface              IP-Address      OK? Method Status                Protocol"];
      Object.entries(this.cfg.interfaces).forEach(([n, i]) => {
        const up = !i.shutdown && (this.tipo === "router" ? !/^Serial/.test(n) : (/^Vlan/.test(n) ? true : /^Fast/.test(n) ? +n.split("/")[1] <= 4 : true));
        const st = i.shutdown ? "administratively down" : up ? "up" : "down";
        L.push(pad(n, 23) + pad(i.ip === "dhcp" ? "unassigned" : i.ip || "unassigned", 16) + "YES " + pad(i.ip ? (i.ip === "dhcp" ? "DHCP" : "manual") : "unset", 7) + pad(st, 22) + (up && !i.shutdown ? "up" : "down"));
      });
      return L.join("\n");
    }

    vlanBrief() {
      const L = ["", "VLAN Name                             Status    Ports", "---- -------------------------------- --------- -------------------------------"];
      Object.entries(this.cfg.vlans).forEach(([id, nome]) => {
        const portas = Object.entries(this.cfg.interfaces).filter(([n, i]) => !/^Vlan/.test(n) && !i.routed && i.mode !== "trunk" && i.accessVlan === +id).map(([n]) => curto(n));
        const linhas = [];
        for (let k = 0; k < Math.max(1, portas.length); k += 4) linhas.push(portas.slice(k, k + 4).join(", "));
        L.push(pad(id, 5) + pad(nome, 33) + pad("active", 10) + linhas[0]);
        linhas.slice(1).forEach((l) => L.push(" ".repeat(48) + l));
      });
      ["1002 fddi-default", "1003 token-ring-default", "1004 fddinet-default", "1005 trnet-default"].forEach((v) => L.push(pad(v.split(" ")[0], 5) + pad(v.split(" ")[1], 33) + "act/unsup"));
      return L.join("\n");
    }

    trunks() {
      const t = Object.entries(this.cfg.interfaces).filter(([, i]) => i.mode === "trunk");
      if (!t.length) return "";
      const L = ["Port        Mode             Encapsulation  Status        Native vlan"];
      t.forEach(([n, i]) => L.push(pad(curto(n), 12) + pad("on", 17) + pad("802.1q", 15) + pad("trunking", 14) + i.native));
      L.push("", "Port        Vlans allowed on trunk");
      t.forEach(([n, i]) => L.push(pad(curto(n), 12) + (i.allowed || "1-4094")));
      return L.join("\n");
    }

    ipRoute() {
      const L = ["Codes: L - local, C - connected, S - static, O - OSPF", "       * - candidate default", ""];
      const def = this.cfg.routes.find((r) => r.net === "0.0.0.0");
      L.push(def ? `Gateway of last resort is ${def.via} to network 0.0.0.0` : "Gateway of last resort is not set", "");
      if (def) L.push(`S*    0.0.0.0/0 [${def.ad || 1}/0] via ${def.via}`);
      Object.entries(this.cfg.interfaces).forEach(([n, i]) => {
        if (!i.ip || i.ip === "dhcp" || i.shutdown) return;
        const p = prefixo(i.mask);
        L.push(`C        ${rede(i.ip, i.mask)}/${p} is directly connected, ${n}`, `L        ${i.ip}/32 is directly connected, ${n}`);
      });
      this.cfg.routes.filter((r) => r.net !== "0.0.0.0").forEach((r) => L.push(`S        ${r.net}/${prefixo(r.mask)} [${r.ad || 1}/0] via ${r.via}`));
      return L.join("\n");
    }

    version() {
      const r = this.tipo === "router";
      return `Cisco IOS Software, ${r ? "C2900 Software (C2900-UNIVERSALK9-M)" : "C2960 Software (C2960-LANBASEK9-M)"}, Version 15.2(4)M, RELEASE SOFTWARE (fc1)
Technical Support: http://www.cisco.com/techsupport

ROM: System Bootstrap
${this.cfg.hostname} uptime is 12 minutes
System image file is "flash:${r ? "c2900-universalk9-mz.SPA.152-4.M.bin" : "c2960-lanbasek9-mz.152-2.E.bin"}"

cisco ${r ? "CISCO2911/K9" : "WS-C2960-24TT-L"} processor with 491520K/32768K bytes of memory.
${r ? "3 Gigabit Ethernet interfaces" : "24 FastEthernet interfaces\n2 Gigabit Ethernet interfaces"}
255K bytes of non-volatile configuration memory.

Configuration register is 0x2102
(simulador didático — a saída real tem mais linhas)`;
    }

    // ------------------------------------------------------------ verificações
    verificar(c) {
      const C = this.cfg, I = (n) => C.interfaces[n] || {};
      switch (c.t) {
        case "mode": return this.modo === c.v || (c.v === "config" && !["user", "priv"].includes(this.modo)) || this.executados.has("configure terminal");
        case "ran": return this.executados.has(c.v);
        case "hostname": return C.hostname === c.v;
        case "no_domain_lookup": return !C.domainLookup;
        case "saved": return this.startup !== "" && this.startup === this.estado();
        case "enable_secret": return !!C.enableSecret;
        case "pwd_enc": return C.pwdEnc;
        case "banner": return !!C.banner;
        case "line_login": { const l = C.lines[c.line]; return c.local ? l.local : (l.local || (l.login && !!l.password)); }
        case "vty_ssh": return C.lines.vty.transport === "ssh";
        case "domain": return !!C.domain;
        case "rsa": return C.rsa;
        case "user": return !!C.users[c.v];
        case "iface_ip": return I(c.if).ip === c.ip && I(c.if).mask === c.mask && (!c.up || !I(c.if).shutdown);
        case "iface_up": return C.interfaces[c.if] && !I(c.if).shutdown;
        case "iface_desc": return !!I(c.if).desc;
        case "vlan": return C.vlans[c.id] !== undefined && (!c.name || C.vlans[c.id].toUpperCase() === c.name.toUpperCase());
        case "access_vlan": return I(c.if).mode === "access" && I(c.if).accessVlan === c.vlan;
        case "access_mode": return I(c.if).mode === "access";
        case "trunk": return I(c.if).mode === "trunk";
        case "native": return I(c.if).native === c.vlan;
        case "nonegotiate": return !!I(c.if).nonegotiate;
        case "route": return C.routes.some((r) => r.net === c.net && r.mask === c.mask && r.via.toLowerCase() === c.via.toLowerCase());
        case "ospf": return !!C.ospf;
        case "ospf_rid": return C.ospf && C.ospf.rid === c.v;
        case "ospf_net": return C.ospf && C.ospf.nets.some((n) => n.net === c.net && n.wc === c.wc && String(n.area) === String(c.area));
        case "passive": return C.ospf && C.ospf.passive.includes(c.if);
        case "subif": return I(c.if).encap === c.vlan && I(c.if).ip === c.ip;
        case "ip_routing": return C.ipRouting;
        case "ipv6_routing": return C.ipv6Routing;
        case "svi": return I(c.if).ip === c.ip && !I(c.if).shutdown;
        case "dhcp_excl": return C.dhcpExcl.length > 0;
        case "dhcp_pool": return C.dhcpPools[c.name] && C.dhcpPools[c.name].net === c.net;
        case "dhcp_gw": return C.dhcpPools[c.name] && C.dhcpPools[c.name].gw === c.v;
        case "dhcp_dns": return C.dhcpPools[c.name] && !!C.dhcpPools[c.name].dns;
        case "portsec": return !!I(c.if).portsec;
        case "portsec_max": return I(c.if).psMax === c.v;
        case "portsec_sticky": return !!I(c.if).psSticky;
        case "nat_inside": return I(c.if).nat === "inside";
        case "nat_outside": return I(c.if).nat === "outside";
        case "nat_overload": return C.natRules.some((r) => /overload/.test(r));
        case "acl_std": return (C.acls[c.n] || []).some((l) => /^permit/.test(l));
        default: return false;
      }
    }
  }

  // ---------------------------------------------------------------- matching
  function bate(p, tok) {
    if (tok == null) return false;
    if (p === "<w>" || p === "<rest>") return true;
    if (p === "<n>") return /^\d+$/.test(tok);
    if (p === "<ip>") return ehIP(tok);
    if (p === "<if>") return !!normIf(tok);
    if (p.includes("|")) return p.split("|").some((o) => o.toLowerCase().startsWith(tok.toLowerCase()));
    return p.toLowerCase().startsWith(tok.toLowerCase());
  }
  function casar(padrao, t) {
    const args = [];
    for (let i = 0; i < padrao.length; i++) {
      const p = padrao[i];
      if (p === "<rest>") { if (t.length <= i) return "incompleto"; args.push(t.slice(i).join(" ")); return args; }
      if (t[i] == null) return i > 0 && bateTudo(padrao, t, i) ? "incompleto" : null;
      if (!bate(p, t[i])) return null;
      if (p.startsWith("<")) args.push(t[i]);
      else if (p.includes("|")) args.push(p.split("|").find((o) => o.toLowerCase().startsWith(t[i].toLowerCase())));
    }
    return t.length === padrao.length ? args : null;
  }
  function bateTudo(padrao, t, ate) { for (let i = 0; i < ate; i++) if (!bate(padrao[i], t[i])) return false; return true; }
  function posErro(bruto, t, defs) {
    let melhor = 0;
    defs.forEach((d) => { let i = 0; while (i < t.length && d.padrao[i] && bate(d.padrao[i], t[i])) i++; melhor = Math.max(melhor, i); });
    const partes = bruto.trimStart().split(/\s+/);
    let pos = bruto.length - bruto.trimStart().length;
    for (let i = 0; i < Math.min(melhor, partes.length); i++) pos += partes[i].length + 1;
    return pos;
  }

  // ---------------------------------------------------------------- auxiliares IP
  const n2i = (ip) => ip.split(".").reduce((a, o) => (a << 8) + (+o), 0) >>> 0;
  const i2n = (n) => [24, 16, 8, 0].map((s) => (n >>> s) & 255).join(".");
  const prefixo = (mask) => n2i(mask).toString(2).replace(/0/g, "").length;
  const rede = (ip, mask) => i2n((n2i(ip) & n2i(mask)) >>> 0);
  const mascaraValida = (m) => /^1*0*$/.test(n2i(m).toString(2).padStart(32, "0"));
  function hash(s) { let h = 5381; for (const c of s) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0; return h.toString(36) + "Xk2pQ" + (h * 7).toString(36); }
  function tipo7(s) { return "0" + [...s].map((c, i) => ((c.charCodeAt(0) ^ (0x64 + i)) & 255).toString(16).padStart(2, "0").toUpperCase()).join(""); }

  // ---------------------------------------------------------------- comandos
  const EXEC = ["user", "priv"], PRIV = ["priv"], CFG = ["config"], IFM = ["if", "range", "subif"], TODOS_CFG = ["config", "if", "range", "subif", "line", "router", "vlan", "dhcp"];
  const C = (modos, padrao, fn, ajuda, so) => ({ modos, padrao: padrao.split(" "), fn, ajuda, so });

  const COMANDOS = [
    // --- EXEC
    C(["user"], "enable", function () { this.modo = "priv"; }, "Entra no modo privilegiado"),
    C(PRIV, "disable", function () { this.modo = "user"; }, "Volta ao EXEC de utilizador"),
    C(EXEC, "exit", function () { this.modo = "user"; return "\n" + this.cfg.hostname + " con0 is now available\n\nPress RETURN to get started."; }, "Termina a sessão"),
    C(EXEC, "logout", function () { this.modo = "user"; return "Sessão terminada."; }, "Termina a sessão"),
    C(PRIV, "configure terminal", function () { this.modo = "config"; return "Enter configuration commands, one per line.  End with CNTL/Z."; }, "Modo de configuração global"),
    C(PRIV, "copy running-config startup-config", function () { return "Destination filename [startup-config]? \n" + this.guardar(); }, "Copia ficheiros/configurações"),
    C(PRIV, "write memory", function () { return this.guardar(); }, "Guarda a configuração"),
    C(PRIV, "write", function () { return this.guardar(); }, "Guarda a configuração"),
    C(PRIV, "reload", function () { if (this.startup) this.cfg = JSON.parse(this.startup); this.modo = "user"; return "Proceed with reload? [confirm]\n\n*** Reiniciado: a running-config foi substituída pela startup-config ***"; }, "Reinicia o equipamento"),
    C(PRIV, "erase startup-config", function () { this.startup = ""; return "Erasing the nvram filesystem will remove all configuration files! Continue? [confirm]\n[OK]\nErase of nvram: complete"; }),
    C(PRIV, "write erase", function () { this.startup = ""; return "[OK]\nErase of nvram: complete"; }),
    C(EXEC, "ping <ip>", function ([ip]) {
      const alcancavel = Object.values(this.cfg.interfaces).some((i) => i.ip && i.ip !== "dhcp" && !i.shutdown && rede(i.ip, i.mask) === rede(ip, i.mask));
      const viaRota = this.cfg.routes.length > 0;
      const ok = alcancavel || viaRota;
      return `Type escape sequence to abort.\nSending 5, 100-byte ICMP Echos to ${ip}, timeout is 2 seconds:\n${ok ? ".!!!!" : "....."}\nSuccess rate is ${ok ? "80 percent (4/5)" : "0 percent (0/5)"}` + (ok ? ", round-trip min/avg/max = 1/2/4 ms" : "") + "\n(simulado: o primeiro '.' é o tempo do ARP)";
    }, "Testa a conectividade"),
    C(EXEC, "traceroute <ip>", function ([ip]) { return `Type escape sequence to abort.\nTracing the route to ${ip}\n  1 10.0.12.2 4 msec 2 msec 2 msec\n  2 ${ip} 6 msec 4 msec 5 msec\n(simulado)`; }, "Mostra os saltos até ao destino"),
    C(PRIV, "show running-config", function () { return this.runningConfig(); }, "Mostra informação do sistema"),
    C(PRIV, "show startup-config", function () { if (!this.startup) return "startup-config is not present"; const atual = this.cfg; this.cfg = JSON.parse(this.startup); const r = this.runningConfig().replace("Current configuration", "Using"); this.cfg = atual; return r; }),
    C(EXEC, "show ip interface brief", function () { return this.ipIntBrief(); }),
    C(EXEC, "show ipv6 interface brief", function () { return Object.entries(this.cfg.interfaces).map(([n, i]) => `${n.padEnd(23)}[${i.shutdown ? "administratively down/down" : "up/up"}]\n    ${(i.ipv6 || ["unassigned"]).join("\n    ")}`).join("\n"); }),
    C(EXEC, "show ip route", function () { return this.ipRoute(); }),
    C(EXEC, "show ip route static", function () { return this.ipRoute().split("\n").filter((l) => /^S|Gateway|Codes|^\s*\*|^$/.test(l)).join("\n"); }),
    C(EXEC, "show version", function () { return this.version(); }),
    C(EXEC, "show vlan brief", function () { return this.vlanBrief(); }, "", "switch"),
    C(EXEC, "show vlan", function () { return this.vlanBrief(); }, "", "switch"),
    C(EXEC, "show interfaces trunk", function () { return this.trunks(); }, "", "switch"),
    C(EXEC, "show interfaces <if>", function ([n]) {
      const nome = normIf(n), i = this.cfg.interfaces[nome];
      if (!i) return "% Invalid input detected at '^' marker.";
      return `${nome} is ${i.shutdown ? "administratively down" : "up"}, line protocol is ${i.shutdown ? "down" : "up"}\n  Hardware is ${/Gig/.test(nome) ? "CN Gigabit Ethernet" : "Fast Ethernet"}, address is 0050.0f${Math.floor(Math.random() * 90 + 10)}.a${Math.floor(Math.random() * 900 + 100)}\n` +
        (i.desc ? `  Description: ${i.desc}\n` : "") + (i.ip && i.ip !== "dhcp" ? `  Internet address is ${i.ip}/${prefixo(i.mask)}\n` : "") +
        "  MTU 1500 bytes, BW 1000000 Kbit/sec, DLY 10 usec,\n  Full-duplex, 1000Mb/s, media type is RJ45\n     0 input errors, 0 CRC, 0 frame, 0 overrun, 0 ignored\n     0 output errors, 0 collisions, 0 interface resets";
    }),
    C(EXEC, "show mac address-table", function () { return "          Mac Address Table\n-------------------------------------------\nVlan    Mac Address       Type        Ports\n----    -----------       --------    -----\n   1    0050.7966.6800    DYNAMIC     Fa0/1\n   1    0050.7966.6801    DYNAMIC     Fa0/2\nTotal Mac Addresses for this criterion: 2"; }, "", "switch"),
    C(EXEC, "show ip protocols", function () { const o = this.cfg.ospf; if (!o) return ""; return `Routing Protocol is "ospf ${o.pid}"\n  Router ID ${o.rid || "1.1.1.1"}\n  Routing for Networks:\n${o.nets.map((n) => `    ${n.net} ${n.wc} area ${n.area}`).join("\n")}\n  Passive Interface(s):\n${o.passive.map((p) => "    " + p).join("\n")}\n  Distance: (default is 110)`; }),
    C(EXEC, "show ip ospf neighbor", function () { return this.cfg.ospf ? "Neighbor ID     Pri   State           Dead Time   Address         Interface\n(no simulador não há routers vizinhos ligados)" : ""; }),
    C(EXEC, "show ip dhcp pool", function () { return Object.entries(this.cfg.dhcpPools).map(([n, p]) => `Pool ${n} :\n Utilization mark (high/low)    : 100 / 0\n Total addresses                : ${p.mask ? Math.pow(2, 32 - prefixo(p.mask)) - 2 : 0}\n Network ${p.net || "-"} / ${p.mask || "-"}  Default router ${p.gw || "-"}`).join("\n\n"); }),
    C(EXEC, "show ip dhcp binding", function () { return "Bindings from all pools not associated with VRF:\nIP address      Client-ID/              Lease expiration        Type\n                Hardware address/\n(nenhum cliente no simulador)"; }),
    C(EXEC, "show ip nat translations", function () { return this.cfg.natRules.length ? "Pro  Inside global      Inside local       Outside local      Outside global\n(sem tráfego no simulador)" : ""; }),
    C(EXEC, "show access-lists", function () { return Object.entries(this.cfg.acls).map(([n, l]) => `Standard IP access list ${n}\n` + l.map((x, i) => `    ${(i + 1) * 10} ${x}`).join("\n")).join("\n"); }),
    C(EXEC, "show port-security interface <if>", function ([n]) { const i = this.cfg.interfaces[normIf(n)] || {}; return `Port Security              : ${i.portsec ? "Enabled" : "Disabled"}\nPort Status                : ${i.portsec ? "Secure-up" : "Secure-down"}\nViolation Mode             : ${i.psViol || "Shutdown"}\nMaximum MAC Addresses      : ${i.psMax || 1}\nSticky MAC Addresses       : ${i.psSticky ? 1 : 0}`; }, "", "switch"),
    C(EXEC, "show ip ssh", function () { return this.cfg.rsa ? `SSH Enabled - version ${this.cfg.sshV2 ? "2.0" : "1.99"}\nAuthentication timeout: 120 secs; Authentication retries: 3` : "SSH Disabled - version 1.99\n%Please create RSA keys to enable SSH (and of atleast 768 bits for SSH v2)."; }),
    C(EXEC, "show cdp neighbors", function () { return "Capability Codes: R - Router, S - Switch, H - Host\nDevice ID    Local Intrfce   Holdtme    Capability   Platform    Port ID\n" + (this.tipo === "router" ? "SW1          Gig 0/0         152            S          2960        Gig 0/1" : "R1           Gig 0/1         146            R          C2900       Gig 0/0"); }),
    C(EXEC, "show clock", function () { return "*" + new Date().toUTCString(); }),
    C(EXEC, "show flash:", function () { return "-#- --length-- -----date/time------ path\n1    33591768 Jan 01 2026 00:00:00 +00:00 " + (this.tipo === "router" ? "c2900-universalk9-mz.SPA.152-4.M.bin" : "c2960-lanbasek9-mz.152-2.E.bin"); }),
    C(EXEC, "show history", function () { return "(use as setas ↑ ↓ para navegar no histórico)"; }),
    C(EXEC, "show spanning-tree", function () { return "VLAN0001\n  Spanning tree enabled protocol " + (this.cfg.stpMode === "rapid-pvst" ? "rstp" : "ieee") + "\n  Root ID    Priority    32769\n             This bridge is the root"; }, "", "switch"),
    C(EXEC, "clear", function () { return "\f"; }),

    // --- configuração global
    C(TODOS_CFG, "end", function () { this.modo = "priv"; this.ctx = null; }, "Volta ao modo privilegiado"),
    C(TODOS_CFG, "exit", function () { this.modo = this.modo === "config" ? "priv" : "config"; this.ctx = null; }, "Sai do modo atual"),
    C(CFG, "hostname <w>", function ([h]) { this.cfg.hostname = h; }, "Nome do equipamento"),
    C(CFG, "no ip domain-lookup", function () { this.cfg.domainLookup = false; }, "Nega um comando"),
    C(CFG, "ip domain-lookup", function () { this.cfg.domainLookup = true; }),
    C(CFG, "ip domain-name <w>", function ([d]) { this.cfg.domain = d; }, "Comandos IP globais"),
    C(CFG, "ip name-server <rest>", function () {}),
    C(CFG, "ip routing", function () { this.cfg.ipRouting = true; }),
    C(CFG, "ipv6 unicast-routing", function () { this.cfg.ipv6Routing = true; }, "Comandos IPv6 globais"),
    C(CFG, "ip ssh version <n>", function ([v]) { this.cfg.sshV2 = v === "2"; }),
    C(CFG, "enable secret <rest>", function ([s]) { this.cfg.enableSecret = s; }, "Palavra-passe do modo privilegiado"),
    C(CFG, "enable password <rest>", function ([s]) { this.cfg.enablePassword = s; }),
    C(CFG, "service password-encryption", function () { this.cfg.pwdEnc = true; }, "Serviços do sistema"),
    C(CFG, "banner motd <rest>", function ([b]) { this.cfg.banner = b.replace(/^(.)(.*)\1$/, "$2"); }, "Mensagem de login"),
    C(CFG, "username <w> secret <rest>", function ([u, s]) { this.cfg.users[u] = s; }, "Utilizadores locais"),
    C(CFG, "username <w> password <rest>", function ([u, s]) { this.cfg.users[u] = s; }),
    C(CFG, "username <w> privilege <n> secret <rest>", function ([u, , s]) { this.cfg.users[u] = s; }),
    C(CFG, "crypto key generate rsa", function () { if (!this.cfg.domain) return "% Please define a domain-name first."; this.cfg.rsa = true; return `The name for the keys will be: ${this.cfg.hostname}.${this.cfg.domain}\nHow many bits in the modulus [512]: 2048\n% Generating 2048 bit RSA keys, keys will be non-exportable...[OK]\n*Mar 1 00:12:01: %SSH-5-ENABLED: SSH 1.99 has been enabled`; }, "Criptografia"),
    C(CFG, "crypto key generate rsa modulus <n>", function ([n]) { if (!this.cfg.domain) return "% Please define a domain-name first."; this.cfg.rsa = true; return `The name for the keys will be: ${this.cfg.hostname}.${this.cfg.domain}\n% Generating ${n} bit RSA keys, keys will be non-exportable...[OK]\n*Mar 1 00:12:01: %SSH-5-ENABLED: SSH 1.99 has been enabled`; }),
    C(CFG, "crypto key generate rsa general-keys modulus <n>", function ([n]) { if (!this.cfg.domain) return "% Please define a domain-name first."; this.cfg.rsa = true; return `% Generating ${n} bit RSA keys, keys will be non-exportable...[OK]`; }),
    C(CFG, "line console <n>", function () { this.modo = "line"; this.ctx = "con"; }, "Configura linhas de terminal"),
    C(CFG, "line vty <n> <n>", function () { this.modo = "line"; this.ctx = "vty"; }),
    C(CFG, "interface range <rest>", function ([r]) {
      const m = r.replace(/\s+/g, "").match(/^([a-z-]+)(\d+\/)(\d+)-(\d+)$/i);
      if (!m) return "% Invalid input detected at '^' marker.";
      const lista = [];
      for (let k = +m[3]; k <= +m[4]; k++) { const n = this.iface(m[1] + m[2] + k); if (!n) return "% Invalid interface range"; lista.push(n); }
      this.modo = "range"; this.ctx = lista;
    }, "Seleciona interfaces"),
    C(CFG, "interface <if>", function ([n]) {
      const nome = this.iface(n);
      if (!nome) return "% Invalid input detected at '^' marker.";
      this.modo = nome.includes(".") ? "subif" : "if"; this.ctx = nome;
    }),
    C(CFG, "vlan <n>", function ([v]) { if (!this.cfg.vlans[v]) this.cfg.vlans[v] = "VLAN" + String(v).padStart(4, "0"); this.modo = "vlan"; this.ctx = v; }, "Configura VLANs", "switch"),
    C(CFG, "no vlan <n>", function ([v]) { delete this.cfg.vlans[v]; }, "", "switch"),
    C(CFG, "router ospf <n>", function ([p]) { if (!this.cfg.ospf) this.cfg.ospf = { pid: p, rid: "", nets: [], passive: [], defOrig: false }; this.modo = "router"; this.ctx = "ospf"; }, "Protocolos de encaminhamento"),
    C(CFG, "ip route <ip> <ip> <w>", function ([n, m, v]) { if (!mascaraValida(m)) return "%Inconsistent address and mask"; this.cfg.routes.push({ net: n, mask: m, via: normIf(v) || v }); }),
    C(CFG, "ip route <ip> <ip> <w> <n>", function ([n, m, v, ad]) { this.cfg.routes.push({ net: n, mask: m, via: normIf(v) || v, ad: +ad }); }),
    C(CFG, "no ip route <ip> <ip> <w>", function ([n, m, v]) { this.cfg.routes = this.cfg.routes.filter((r) => !(r.net === n && r.mask === m && r.via === (normIf(v) || v))); }),
    C(CFG, "ip dhcp excluded-address <ip>", function ([a]) { this.cfg.dhcpExcl.push([a]); }),
    C(CFG, "ip dhcp excluded-address <ip> <ip>", function ([a, b]) { this.cfg.dhcpExcl.push([a, b]); }),
    C(CFG, "ip dhcp pool <w>", function ([n]) { if (!this.cfg.dhcpPools[n]) this.cfg.dhcpPools[n] = {}; this.modo = "dhcp"; this.ctx = n; }),
    C(CFG, "access-list <n> permit|deny <rest>", function ([n, acao, resto]) { (this.cfg.acls[n] = this.cfg.acls[n] || []).push(acao + " " + resto); }, "Listas de acesso"),
    C(CFG, "ip nat inside source list <n> interface <if> overload", function ([l, i]) { this.cfg.natRules.push(`ip nat inside source list ${l} interface ${normIf(i)} overload`); }),
    C(CFG, "ip nat inside source static <ip> <ip>", function ([a, b]) { this.cfg.natRules.push(`ip nat inside source static ${a} ${b}`); }),
    C(CFG, "ntp server <ip>", function ([s]) { this.cfg.ntp.push(s); }, "Relógio"),
    C(CFG, "spanning-tree mode <w>", function ([m]) { this.cfg.stpMode = m; }, "Spanning Tree", "switch"),
    C(CFG, "spanning-tree vlan <w> root primary", function () {}, "", "switch"),
    C(CFG, "spanning-tree vlan <w> priority <n>", function () {}, "", "switch"),
    C(CFG, "cdp run", function () {}),
    C(CFG, "lldp run", function () {}),
    C(CFG, "ip default-gateway <ip>", function () {}, "", "switch"),
    C(CFG, "logging host <ip>", function () {}),
    C(CFG, "logging trap <w>", function () {}),
    C(CFG, "clock timezone <w> <n>", function () {}),

    // --- linha
    C(["line"], "password <rest>", function ([p]) { this.cfg.lines[this.ctx].password = p; }, "Palavra-passe da linha"),
    C(["line"], "login local", function () { this.cfg.lines[this.ctx].local = true; this.cfg.lines[this.ctx].login = true; }),
    C(["line"], "login", function () { const l = this.cfg.lines[this.ctx]; l.login = true; l.local = false; if (!l.password) return "% Login disabled on line, until 'password' is set"; }, "Pede autenticação"),
    C(["line"], "no login", function () { this.cfg.lines[this.ctx].login = false; this.cfg.lines[this.ctx].local = false; }),
    C(["line"], "transport input <w>", function ([t]) { if (this.ctx !== "vty") return "% Invalid input detected at '^' marker."; this.cfg.lines.vty.transport = t.toLowerCase(); }, "Protocolos permitidos"),
    C(["line"], "exec-timeout <n> <n>", function () {}),
    C(["line"], "logging synchronous", function () {}),
    C(["line"], "access-class <n> in", function () {}),

    // --- interface
    C(IFM, "ip address <ip> <ip>", function ([ip, m]) {
      if (this.modo === "range") return "% Invalid input detected at '^' marker.";
      if (!mascaraValida(m)) return "% Bad mask 0x" + n2i(m).toString(16).toUpperCase() + " for address " + ip;
      const i = this.cfg.interfaces[this.ctx];
      if (this.tipo === "switch" && !i.routed && !/^Vlan/.test(this.ctx)) return "% Invalid input detected at '^' marker.\n(dica: num switch o IP vai na SVI — interface vlan 1)";
      if (this.modo === "subif" && !i.encap) return "% Configuring IP routing on a LAN subinterface is only allowed if that\nsubinterface is already configured as part of an IEEE 802.10, IEEE 802.1Q,\nor ISL vLAN.";
      if (rede(ip, m) === ip || (n2i(ip) | ~n2i(m)) >>> 0 === n2i(ip)) return "Bad mask /" + prefixo(m) + " for address " + ip;
      i.ip = ip; i.mask = m;
    }, "Configuração IP da interface"),
    C(IFM, "ip address dhcp", function () { this.cfg.interfaces[this.ctx].ip = "dhcp"; }),
    C(IFM, "no ip address", function () { this.cadaIf((i) => { i.ip = ""; i.mask = ""; }); }),
    C(IFM, "ipv6 address <rest>", function ([a]) { const i = this.cfg.interfaces[this.ctx]; (i.ipv6 = i.ipv6 || []).push(a); }),
    C(IFM, "shutdown", function () { this.cadaIf((i) => { i.shutdown = true; }); return this.ifsAtuais().map((n) => `%LINK-5-CHANGED: Interface ${n}, changed state to administratively down`).join("\n"); }, "Desliga a interface"),
    C(IFM, "no shutdown", function () {
      const msgs = [];
      this.cadaIf((i, n) => { if (i.shutdown) { i.shutdown = false; msgs.push(`%LINK-5-CHANGED: Interface ${n}, changed state to up`, `%LINEPROTO-5-UPDOWN: Line protocol on Interface ${n}, changed state to up`); } });
      return msgs.join("\n");
    }, "Nega um comando"),
    C(IFM, "description <rest>", function ([d]) { this.cadaIf((i) => { i.desc = d; }); }, "Descrição da interface"),
    C(IFM, "speed <w>", function () {}), C(IFM, "duplex <w>", function () {}),
    C(IFM, "switchport mode access|trunk", function ([m]) { this.cadaIf((i) => { i.mode = m; i.routed = false; }); }, "Configura a porta de switch", "switch"),
    C(IFM, "switchport access vlan <n>", function ([v]) {
      let msg = "";
      if (!this.cfg.vlans[v]) { this.cfg.vlans[v] = "VLAN" + String(v).padStart(4, "0"); msg = "% Access VLAN does not exist. Creating vlan " + v; }
      this.cadaIf((i) => { i.accessVlan = +v; }); return msg;
    }, "", "switch"),
    C(IFM, "switchport voice vlan <n>", function () {}, "", "switch"),
    C(IFM, "switchport trunk native vlan <n>", function ([v]) { this.cadaIf((i) => { i.native = +v; }); }, "", "switch"),
    C(IFM, "switchport trunk allowed vlan <rest>", function ([v]) { this.cadaIf((i) => { i.allowed = v.replace(/^add\s+/, (i.allowed ? i.allowed + "," : "")); }); }, "", "switch"),
    C(IFM, "switchport trunk encapsulation dot1q", function () { return "% (o 2960 só suporta 802.1Q: este comando não é necessário)"; }, "", "switch"),
    C(IFM, "switchport nonegotiate", function () { const i = this.cfg.interfaces[this.ifsAtuais()[0]]; if (i.mode !== "trunk" && i.mode !== "access") return "Command rejected: Conflict between 'nonegotiate' and 'dynamic' status."; this.cadaIf((x) => { x.nonegotiate = true; }); }, "", "switch"),
    C(IFM, "switchport port-security", function () { const i = this.cfg.interfaces[this.ifsAtuais()[0]]; if (i.mode !== "access" && i.mode !== "trunk") return "Command rejected: " + this.ifsAtuais()[0] + " is a dynamic port."; this.cadaIf((x) => { x.portsec = true; }); }, "", "switch"),
    C(IFM, "switchport port-security maximum <n>", function ([n]) { this.cadaIf((i) => { i.psMax = +n; }); }, "", "switch"),
    C(IFM, "switchport port-security mac-address sticky", function () { this.cadaIf((i) => { i.psSticky = true; }); }, "", "switch"),
    C(IFM, "switchport port-security violation <w>", function ([v]) { this.cadaIf((i) => { i.psViol = v; }); }, "", "switch"),
    C(IFM, "spanning-tree portfast", function () { this.cadaIf((i) => { i.portfast = true; }); return "%Warning: portfast should only be enabled on ports connected to a single\n host. Connecting hubs, concentrators, switches, bridges, etc... to this\n interface  when portfast is enabled, can cause temporary bridging loops."; }, "", "switch"),
    C(IFM, "spanning-tree bpduguard enable", function () { this.cadaIf((i) => { i.bpduguard = true; }); }, "", "switch"),
    C(IFM, "channel-group <n> mode <w>", function ([g]) { this.iface("Port-channel" + g); return "Creating a port-channel interface Port-channel " + g; }, "", "switch"),
    C(IFM, "no switchport", function () { this.cadaIf((i) => { i.routed = true; i.mode = ""; }); }, "", "switch"),
    C(["subif"], "encapsulation dot1q <n>", function ([v]) { this.cfg.interfaces[this.ctx].encap = +v; }, "Encapsulamento 802.1Q", "router"),
    C(["subif"], "encapsulation dot1q <n> native", function ([v]) { const i = this.cfg.interfaces[this.ctx]; i.encap = +v; i.encapNative = true; }, "", "router"),
    C(IFM, "ip nat inside|outside", function ([l]) { this.cadaIf((i) => { i.nat = l; }); }),
    C(IFM, "ip helper-address <ip>", function ([h]) { this.cadaIf((i) => { i.helper = h; }); }),
    C(IFM, "ip ospf <n> area <n>", function () {}),
    C(IFM, "ip ospf cost <n>", function () {}),
    C(IFM, "ip access-group <w> in|out", function () {}),
    C(IFM, "standby <n> ip <ip>", function () {}),
    C(IFM, "standby <n> priority <n>", function () {}),
    C(IFM, "standby <n> preempt", function () {}),
    C(IFM, "interface <if>", function ([n]) { const nome = this.iface(n); if (!nome) return "% Invalid input detected at '^' marker."; this.modo = nome.includes(".") ? "subif" : "if"; this.ctx = nome; }, "Muda de interface"),

    // --- vlan
    C(["vlan"], "name <w>", function ([n]) { this.cfg.vlans[this.ctx] = n; }, "Nome da VLAN"),
    C(["vlan"], "vlan <n>", function ([v]) { if (!this.cfg.vlans[v]) this.cfg.vlans[v] = "VLAN" + String(v).padStart(4, "0"); this.ctx = v; }),

    // --- router ospf
    C(["router"], "router-id <ip>", function ([r]) { this.cfg.ospf.rid = r; return "% OSPF: Reload or use \"clear ip ospf process\" command, for this to take effect"; }, "Router ID"),
    C(["router"], "network <ip> <ip> area <n>", function ([n, w, a]) { this.cfg.ospf.nets.push({ net: n, wc: w, area: a }); }, "Ativa OSPF nas interfaces"),
    C(["router"], "passive-interface <if>", function ([i]) { this.cfg.ospf.passive.push(normIf(i)); }),
    C(["router"], "default-information originate", function () { this.cfg.ospf.defOrig = true; }),
    C(["router"], "auto-cost reference-bandwidth <n>", function () { return "% OSPF: Reference bandwidth is changed.\n        Please ensure reference bandwidth is consistent across all routers."; }),

    // --- dhcp
    C(["dhcp"], "network <ip> <ip>", function ([n, m]) { Object.assign(this.cfg.dhcpPools[this.ctx], { net: n, mask: m }); }, "Rede do pool"),
    C(["dhcp"], "default-router <ip>", function ([g]) { this.cfg.dhcpPools[this.ctx].gw = g; }, "Gateway dos clientes"),
    C(["dhcp"], "dns-server <rest>", function ([d]) { this.cfg.dhcpPools[this.ctx].dns = d; }, "Servidores DNS"),
    C(["dhcp"], "domain-name <w>", function ([d]) { this.cfg.dhcpPools[this.ctx].domain = d; }),
    C(["dhcp"], "lease <rest>", function () {}),
  ];

  window.IOS = { Equipamento, normIf };
})();
