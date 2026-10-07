/* Desafio de avarias (troubleshooting, como no exame).
   A app monta uma rede de uma empresa a funcionar e estraga algumas coisas às escondidas.
   O aluno vê só os sintomas (as queixas dos utilizadores), tem tempo limite para encontrar e
   corrigir as avarias e recebe uma nota de 0 a 20. Cada desafio tem avarias diferentes (semente).
   As verificações aceitam qualquer correção válida (não exigem os mesmos comandos). */
(function () {
  "use strict";
  const S = window.Simulador;

  // gerador pseudoaleatório com semente (o mesmo desafio pode ser recriado)
  function rng(seed) { let x = (seed >>> 0) || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
  const run = (r, nome, cmds) => { const d = r.dev(nome); cmds.forEach((c) => d.eq.executar(c)); d.eq.modo = "user"; d.eq.executados = new Set(); d.eq.startup = d.eq.estado(); r.mudou(); };
  const pcIp = (d, ip, gw, dns) => Object.assign(d.pc, { dhcp: false, ip, mask: "255.255.255.0", gw, dns: dns || "" });
  const lig = (r, a, pa, b, pb) => r.ligar(r.dev(a), pa, r.dev(b), pb, "auto");
  const I = (r, dev, n) => r.dev(dev).eq.cfg.interfaces[n];
  const pingOk = (r, de, ip) => { const d = r.dev(de); return !!d && r.pingCalc(d, ip).ok; };
  const renovar = (r, nome) => { const d = r.dev(nome); if (d && d.pc && d.pc.dhcp) r.pedirDhcp(d); };

  // ------------------------------------------------------------------ cenários (redes a funcionar)
  const CENARIOS = {
    clinica: {
      nome: "Clínica Sorriso", nivel: "Fácil a médio",
      texto: "Receção (VLAN 10) e consultórios (VLAN 20) num switch, router-on-a-stick, DHCP no router e um servidor com o site interno.",
      servidor: "192.168.30.5", site: "www.clinica.local",
      construir() {
        const r = new S.Rede();
        r.novoDev("router", 50, 12, "R1", { modelo: "4331" }); r.novoDev("switch", 50, 45, "S1", { modelo: "2960" });
        const srv = r.novoDev("servidor", 85, 12, "SRV"); pcIp(srv, "192.168.30.5", "192.168.30.1"); srv.srv.dns.registos.push({ nome: "www.clinica.local", ip: "192.168.30.5" });
        r.novoDev("pc", 15, 80, "Rececao", { dhcp: true }); r.novoDev("impressora", 37, 82, "Impressora");
        pcIp(r.novoDev("pc", 63, 82, "Sala1"), "192.168.20.11", "192.168.20.1", "192.168.30.5"); r.novoDev("portatil", 86, 80, "Sala2", { dhcp: true });
        lig(r, "R1", "GigabitEthernet0/0/0", "S1", "GigabitEthernet0/1"); lig(r, "R1", "GigabitEthernet0/0/1", "SRV", "FastEthernet0");
        lig(r, "Rececao", "FastEthernet0", "S1", "FastEthernet0/1"); lig(r, "Impressora", "FastEthernet0", "S1", "FastEthernet0/2");
        lig(r, "Sala1", "FastEthernet0", "S1", "FastEthernet0/3"); lig(r, "Sala2", "FastEthernet0", "S1", "FastEthernet0/4");
        run(r, "S1", ["enable", "conf t", "hostname S1", "vlan 10", "name RECECAO", "vlan 20", "name CONSULTORIOS", "int range fa0/1 - 2", "switchport mode access", "switchport access vlan 10", "int range fa0/3 - 4", "switchport mode access", "switchport access vlan 20", "int g0/1", "switchport mode trunk", "end"]);
        run(r, "R1", ["enable", "conf t", "hostname R1", "int g0/0/0", "no shutdown", "int g0/0/0.10", "encapsulation dot1Q 10", "ip address 192.168.10.1 255.255.255.0", "int g0/0/0.20", "encapsulation dot1Q 20", "ip address 192.168.20.1 255.255.255.0",
          "int g0/0/1", "ip address 192.168.30.1 255.255.255.0", "no shutdown", "exit", "ip dhcp excluded-address 192.168.10.1 192.168.10.9", "ip dhcp excluded-address 192.168.20.1 192.168.20.19",
          "ip dhcp pool RECECAO", "network 192.168.10.0 255.255.255.0", "default-router 192.168.10.1", "dns-server 192.168.30.5", "ip dhcp pool CONSULTORIOS", "network 192.168.20.0 255.255.255.0", "default-router 192.168.20.1", "dns-server 192.168.30.5", "end"]);
        r.devs.filter((d) => d.pc && d.pc.dhcp).forEach((d) => r.pedirDhcp(d)); r.mudou();
        return r;
      },
      clientes: ["Rececao", "Sala1", "Sala2"],
    },
    escola: {
      nome: "Escola Horizonte", nivel: "Médio",
      texto: "Dois edifícios ligados por dois routers com rotas estáticas. O servidor do edifício B dá IP ao edifício A (ip helper-address) e tem o DNS.",
      servidor: "192.168.2.10", site: "www.escola.local",
      construir() {
        const r = new S.Rede();
        r.novoDev("router", 30, 15, "R1", { modelo: "2911" }); r.novoDev("router", 70, 15, "R2", { modelo: "2911" });
        r.novoDev("switch", 30, 50, "S1"); r.novoDev("switch", 70, 50, "S2");
        pcIp(r.novoDev("pc", 12, 82, "PC-A1"), "192.168.1.11", "192.168.1.1", "192.168.2.10"); r.novoDev("portatil", 40, 84, "PC-A2", { dhcp: true });
        pcIp(r.novoDev("pc", 60, 84, "PC-B1"), "192.168.2.21", "192.168.2.1", "192.168.2.10");
        const srv = r.novoDev("servidor", 88, 82, "SRV"); pcIp(srv, "192.168.2.10", "192.168.2.1", "192.168.2.10");
        Object.assign(srv.srv.dhcp, { on: true, inicio: "192.168.1.100", mask: "255.255.255.0", gw: "192.168.1.1", dns: "192.168.2.10", max: 50 });
        srv.srv.dns.registos.push({ nome: "www.escola.local", ip: "192.168.2.10" });
        lig(r, "R1", "GigabitEthernet0/1", "R2", "GigabitEthernet0/1");
        lig(r, "R1", "GigabitEthernet0/0", "S1", "GigabitEthernet0/1"); lig(r, "R2", "GigabitEthernet0/0", "S2", "GigabitEthernet0/1");
        lig(r, "PC-A1", "FastEthernet0", "S1", "FastEthernet0/1"); lig(r, "PC-A2", "FastEthernet0", "S1", "FastEthernet0/2");
        lig(r, "PC-B1", "FastEthernet0", "S2", "FastEthernet0/1"); lig(r, "SRV", "FastEthernet0", "S2", "FastEthernet0/2");
        run(r, "R1", ["enable", "conf t", "hostname R1", "int g0/0", "ip address 192.168.1.1 255.255.255.0", "ip helper-address 192.168.2.10", "no shutdown", "int g0/1", "ip address 10.0.12.1 255.255.255.252", "no shutdown", "exit", "ip route 192.168.2.0 255.255.255.0 10.0.12.2", "end"]);
        run(r, "R2", ["enable", "conf t", "hostname R2", "int g0/0", "ip address 192.168.2.1 255.255.255.0", "no shutdown", "int g0/1", "ip address 10.0.12.2 255.255.255.252", "no shutdown", "exit", "ip route 192.168.1.0 255.255.255.0 10.0.12.1", "end"]);
        r.devs.filter((d) => d.pc && d.pc.dhcp).forEach((d) => r.pedirDhcp(d)); r.mudou();
        return r;
      },
      clientes: ["PC-A1", "PC-A2", "PC-B1"],
    },
    atlantico: {
      nome: "Escritório Atlântico", nivel: "Difícil",
      texto: "Três routers em triângulo com OSPF (área 0), uma rede local em cada router e um servidor na rede do R3.",
      servidor: "192.168.3.10", site: "www.atlantico.local",
      construir() {
        const r = new S.Rede();
        r.novoDev("router", 20, 18, "R1"); r.novoDev("router", 80, 18, "R2"); r.novoDev("router", 50, 55, "R3");
        pcIp(r.novoDev("pc", 8, 50, "PC1"), "192.168.1.10", "192.168.1.1", "192.168.3.10"); pcIp(r.novoDev("pc", 92, 50, "PC2"), "192.168.2.10", "192.168.2.1", "192.168.3.10");
        const srv = r.novoDev("servidor", 50, 88, "SRV"); pcIp(srv, "192.168.3.10", "192.168.3.1", "192.168.3.10"); srv.srv.dns.registos.push({ nome: "www.atlantico.local", ip: "192.168.3.10" });
        lig(r, "R1", "GigabitEthernet0/0/1", "R2", "GigabitEthernet0/0/1"); lig(r, "R1", "GigabitEthernet0/0/2", "R3", "GigabitEthernet0/0/1"); lig(r, "R2", "GigabitEthernet0/0/2", "R3", "GigabitEthernet0/0/2");
        lig(r, "PC1", "FastEthernet0", "R1", "GigabitEthernet0/0/0"); lig(r, "PC2", "FastEthernet0", "R2", "GigabitEthernet0/0/0"); lig(r, "SRV", "FastEthernet0", "R3", "GigabitEthernet0/0/0");
        const ospf = (h, lan, a, b, rid) => ["enable", "conf t", "hostname " + h, "int g0/0/0", `ip address ${lan} 255.255.255.0`, "no shutdown", "int g0/0/1", `ip address ${a} 255.255.255.252`, "no shutdown", "int g0/0/2", `ip address ${b} 255.255.255.252`, "no shutdown", "exit",
          "router ospf 1", "router-id " + rid, `network ${lan.replace(/\.1$/, ".0")} 0.0.0.255 area 0`, `network ${a.replace(/\.\d+$/, ".0")} 0.0.0.3 area 0`, `network ${b.replace(/\.\d+$/, ".0")} 0.0.0.3 area 0`, "passive-interface g0/0/0", "end"];
        run(r, "R1", ospf("R1", "192.168.1.1", "10.0.12.1", "10.0.13.1", "1.1.1.1"));
        run(r, "R2", ospf("R2", "192.168.2.1", "10.0.12.2", "10.0.23.2", "2.2.2.2"));
        run(r, "R3", ospf("R3", "192.168.3.1", "10.0.13.2", "10.0.23.1", "3.3.3.3"));
        r.mudou();
        return r;
      },
      clientes: ["PC1", "PC2"],
    },
  };

  // ------------------------------------------------------------------ avarias
  // Cada avaria: cenários onde existe, objeto que estraga (duas avarias nunca mexem no mesmo),
  // aplicar(rede) e resolvida(rede) — que aceita qualquer correção válida —, a queixa do utilizador e a explicação.
  const AV = [
    { id: "gw", em: ["clinica"], obj: "Sala1", queixa: "“No consultório 1 o computador não abre o site interno, mas a impressora do consultório funciona.”",
      aplicar: (r) => { r.dev("Sala1").pc.gw = "192.168.20.254"; }, resolvida: (r) => r.dev("Sala1").pc.gw === "192.168.20.1" || (r.dev("Sala1").pc.dhcp && pingOk(r, "Sala1", "192.168.30.5")),
      solucao: "O PC Sala1 tinha o gateway errado (192.168.20.254). O gateway tem de ser o IP do router na rede dele: 192.168.20.1." },
    { id: "gw", em: ["escola"], obj: "PC-A1", queixa: "“O PC-A1 do edifício A não chega a nada do edifício B.”",
      aplicar: (r) => { r.dev("PC-A1").pc.gw = "192.168.1.254"; }, resolvida: (r) => pingOk(r, "PC-A1", "192.168.2.10"),
      solucao: "O PC-A1 tinha o gateway 192.168.1.254, que não existe. Correto: 192.168.1.1 (G0/0 do R1)." },
    { id: "gw", em: ["atlantico"], obj: "PC2", queixa: "“O PC2 não chega ao servidor, e o PC1 chega.”",
      aplicar: (r) => { r.dev("PC2").pc.gw = "192.168.2.100"; }, resolvida: (r) => pingOk(r, "PC2", "192.168.3.10"),
      solucao: "O PC2 tinha o gateway errado. Correto: 192.168.2.1 (G0/0/0 do R2)." },
    { id: "mascara", em: ["clinica"], obj: "Sala1m", queixa: "“O PC do consultório 1 diz que o servidor 192.168.30.5 não responde ao ARP.”",
      aplicar: (r) => { r.dev("Sala1").pc.mask = "255.255.0.0"; }, resolvida: (r) => { const p = r.ipEfetivo(r.dev("Sala1")); return !S.mesmaRede(p.ip, "192.168.30.5", p.mask) && pingOk(r, "Sala1", "192.168.30.5"); },
      solucao: "A máscara do Sala1 era 255.255.0.0 (/16): o PC achava que 192.168.30.5 estava na rede local e não usava o gateway. Correto: 255.255.255.0." },
    { id: "mascara", em: ["escola"], obj: "PC-B1", queixa: "“O PC-B1 chega ao servidor mas não chega ao edifício A.”",
      aplicar: (r) => { r.dev("PC-B1").pc.mask = "255.255.0.0"; }, resolvida: (r) => pingOk(r, "PC-B1", "192.168.1.11"),
      solucao: "O PC-B1 tinha máscara /16: tratava 192.168.1.x como local. Correto: 255.255.255.0." },
    { id: "vlan", em: ["clinica"], obj: "S1fa04", queixa: "“O portátil da sala 2 recebe um endereço 192.168.10.x, da receção, em vez de um da rede dos consultórios.”",
      aplicar: (r) => { I(r, "S1", "FastEthernet0/4").accessVlan = 10; renovar(r, "Sala2"); },
      resolvida: (r) => { const l = r.linkDe(r.dev("Sala2"), "FastEthernet0"); if (!l) return false; const p = l.a === r.dev("S1").id ? l.pa : l.pb; return I(r, "S1", p) && I(r, "S1", p).accessVlan === 20 && /^192\.168\.20\./.test(r.ipEfetivo(r.dev("Sala2")).ip || ""); },
      solucao: "A porta Fa0/4 do S1 estava na VLAN 10. Corrigir: interface fa0/4 › switchport access vlan 20, e no portátil ipconfig /renew." },
    { id: "shutdown", em: ["clinica"], obj: "R1g001", queixa: "“Ninguém consegue abrir o site interno nem chegar ao servidor.”",
      aplicar: (r) => { I(r, "R1", "GigabitEthernet0/0/1").shutdown = true; }, resolvida: (r) => !I(r, "R1", "GigabitEthernet0/0/1").shutdown && pingOk(r, "Sala1", "192.168.30.5"),
      solucao: "A interface G0/0/1 do R1 (para o servidor) estava desligada (shutdown). Correção: interface g0/0/1 › no shutdown." },
    { id: "shutdown", em: ["escola"], obj: "R2g01", queixa: "“O edifício A não chega ao edifício B, e o edifício B também não chega ao A.”",
      aplicar: (r) => { I(r, "R2", "GigabitEthernet0/1").shutdown = true; }, resolvida: (r) => pingOk(r, "PC-A1", "192.168.2.21"),
      solucao: "A interface G0/1 do R2 (ligação ao R1) estava em shutdown." },
    { id: "shutdown", em: ["atlantico"], obj: "R3g000", queixa: "“Ninguém chega ao servidor, mas o PC1 e o PC2 falam um com o outro.”",
      aplicar: (r) => { I(r, "R3", "GigabitEthernet0/0/0").shutdown = true; }, resolvida: (r) => pingOk(r, "PC1", "192.168.3.10"),
      solucao: "A G0/0/0 do R3 (rede do servidor) estava em shutdown." },
    { id: "trunk", em: ["clinica"], obj: "S1g01", queixa: "“Os consultórios ficaram sem rede: nem recebem IP. A receção funciona.”",
      aplicar: (r) => { I(r, "S1", "GigabitEthernet0/1").allowed = "10"; renovar(r, "Sala2"); },
      resolvida: (r) => { const i = I(r, "S1", "GigabitEthernet0/1"); return i.mode === "trunk" && r.vlanPermitida(i, 20) && pingOk(r, "Sala1", "192.168.20.1"); },
      solucao: "O trunk G0/1 do S1 só deixava passar a VLAN 10 (switchport trunk allowed vlan 10). Correção: switchport trunk allowed vlan 10,20 (ou add 20)." },
    { id: "encap", em: ["clinica"], obj: "R1sub20", queixa: "“Os consultórios recebem IP mas não chegam ao gateway 192.168.20.1.”",
      aplicar: (r) => { I(r, "R1", "GigabitEthernet0/0/0.20").encap = 30; },
      resolvida: (r) => Object.entries(r.dev("R1").eq.cfg.interfaces).some(([n, i]) => n.includes(".") && i.encap === 20 && i.ip === "192.168.20.1") && pingOk(r, "Sala1", "192.168.20.1"),
      solucao: "A subinterface G0/0/0.20 tinha encapsulation dot1Q 30. Tem de ser o número da VLAN: encapsulation dot1Q 20." },
    { id: "dhcpgw", em: ["clinica"], obj: "poolRec", queixa: "“O PC da receção recebe IP, mas não sai da rede dele.”",
      aplicar: (r) => { r.dev("R1").eq.cfg.dhcpPools.RECECAO.gw = "192.168.10.254"; renovar(r, "Rececao"); },
      resolvida: (r) => Object.values(r.dev("R1").eq.cfg.dhcpPools).some((p) => p.net === "192.168.10.0" && p.gw === "192.168.10.1") && pingOk(r, "Rececao", "192.168.30.5"),
      solucao: "O pool DHCP RECECAO entregava o gateway 192.168.10.254. Correção: ip dhcp pool RECECAO › default-router 192.168.10.1 e, no PC, ipconfig /renew." },
    { id: "dns", em: ["clinica", "escola", "atlantico"], obj: "dns", queixa: (c) => `“O site ${c.site} não abre, mas se escrevermos o endereço IP do servidor já funciona.”`,
      aplicar: (r, c) => { r.devs.find((d) => d.srv && d.srv.dns.registos.length).srv.dns.registos[0].ip = c.servidor.replace(/\d+$/, "250"); },
      resolvida: (r, c) => { const cl = r.dev(c.clientes[0]); return r.resolver(cl, c.site).ip === c.servidor; },
      solucao: (c) => `O registo DNS ${c.site} apontava para o endereço errado. No servidor › Serviços › DNS, o registo A tem de ser ${c.servidor}.` },
    { id: "cabo", em: ["clinica"], obj: "caboRec", queixa: "“O computador da receção diz que o cabo de rede está desligado.”",
      aplicar: (r) => { const l = r.linkDe(r.dev("Rececao"), "FastEthernet0"); if (l) l.cabo = "cruzado"; },
      resolvida: (r) => { const l = r.linkDe(r.dev("Rececao"), "FastEthernet0"); return !!l && r.estadoLink(l).estado === "ok"; },
      solucao: "O PC da receção estava ligado ao switch com um cabo cruzado. PC ↔ switch leva cabo direto." },
    { id: "rota", em: ["escola"], obj: "R2rota", queixa: "“Do edifício B não se chega ao edifício A. O contrário também falha nas respostas.”",
      aplicar: (r) => { r.dev("R2").eq.cfg.routes = []; }, resolvida: (r) => pingOk(r, "PC-B1", "192.168.1.11"),
      solucao: "O R2 não tinha rota para 192.168.1.0/24. Correção: ip route 192.168.1.0 255.255.255.0 10.0.12.1 (ou uma rota por defeito)." },
    { id: "helper", em: ["escola"], obj: "R1helper", queixa: "“O portátil PC-A2 fica com um endereço 169.254.x.x.”",
      aplicar: (r) => { I(r, "R1", "GigabitEthernet0/0").helper = "192.168.2.100"; renovar(r, "PC-A2"); },
      resolvida: (r) => { const l = r.dev("PC-A2").pc.lease; return I(r, "R1", "GigabitEthernet0/0").helper === "192.168.2.10" && !!l && !l.apipa; },
      solucao: "O ip helper-address do R1 apontava para 192.168.2.100. O DHCP está no servidor 192.168.2.10. Depois de corrigir, ipconfig /renew no PC-A2." },
    { id: "ospfnet", em: ["atlantico"], obj: "R3ospf", queixa: "“O R1 e o R2 não conhecem a rede do servidor (192.168.3.0).”",
      aplicar: (r) => { const o = r.dev("R3").eq.cfg.ospf; o.nets = o.nets.filter((n) => n.net !== "192.168.3.0"); },
      resolvida: (r) => pingOk(r, "PC1", "192.168.3.10") && pingOk(r, "PC2", "192.168.3.10"),
      solucao: "O R3 não anunciava a rede 192.168.3.0 no OSPF. Correção: router ospf 1 › network 192.168.3.0 0.0.0.255 area 0." },
    { id: "ospfarea", em: ["atlantico"], obj: "R2ospf", queixa: "“O R2 e o R3 não são vizinhos OSPF (show ip ospf neighbor só mostra o R1).”",
      aplicar: (r) => { const n = r.dev("R2").eq.cfg.ospf.nets.find((x) => x.net === "10.0.23.0"); if (n) n.area = "1"; },
      resolvida: (r) => (r.ospf().viz[r.dev("R2").id] || []).some((v) => v.rid === "3.3.3.3"),
      solucao: "No R2 a ligação 10.0.23.0/30 estava na área 1 e no R3 na área 0: as áreas têm de ser iguais nos dois lados para serem vizinhos." },
    { id: "ospfpass", em: ["atlantico"], obj: "R1ospf", queixa: "“O R1 e o R2 deixaram de ser vizinhos OSPF.”",
      aplicar: (r) => { r.dev("R1").eq.cfg.ospf.passive.push("GigabitEthernet0/0/1"); },
      resolvida: (r) => (r.ospf().viz[r.dev("R1").id] || []).some((v) => v.rid === "2.2.2.2"),
      solucao: "A G0/0/1 do R1 estava como passive-interface: não envia Hellos OSPF e não forma vizinhança. Correção: router ospf 1 › no passive-interface g0/0/1." },
  ];
  const txt = (x, c) => (typeof x === "function" ? x(c) : x);

  const NIVEIS = { facil: { n: 2, min: 12, nome: "Fácil" }, medio: { n: 3, min: 18, nome: "Médio" }, dificil: { n: 4, min: 25, nome: "Difícil" } };

  // Cria um desafio: {id, cenario, nivel, seed, avarias:[índices em AV], inicio, limite, rede (estado exportado)}
  function criar(cenario, nivel, seed) {
    const C = CENARIOS[cenario], N = NIVEIS[nivel] || NIVEIS.medio;
    seed = seed || (Date.now() % 1e9);
    for (let tent = 0; tent < 30; tent++) {
      const rnd = rng(seed + tent * 7919);
      const poss = AV.map((a, k) => k).filter((k) => AV[k].em.includes(cenario));
      const esc = [], objs = new Set();
      while (poss.length && esc.length < N.n) {
        const k = poss.splice(Math.floor(rnd() * poss.length), 1)[0];
        if (objs.has(AV[k].obj)) continue;
        objs.add(AV[k].obj); esc.push(k);
      }
      const r = C.construir();
      esc.forEach((k) => AV[k].aplicar(r, C));
      r.mudou();
      // cada avaria tem de estar mesmo por resolver no início
      if (esc.every((k) => !AV[k].resolvida(r, C))) return { id: "dz" + seed.toString(36), cenario, nivel, seed: seed + tent * 7919, avarias: esc, inicio: Date.now(), limite: N.min * 60, rede: r.exportar(), diag: 0 };
    }
    throw new Error("Não foi possível criar o desafio");
  }
  // Estado do desafio na rede atual: lista de {queixa, ok}, nota 0–20 e se tudo funciona
  function avaliar(rede, dz, agora) {
    const C = CENARIOS[dz.cenario];
    const lista = dz.avarias.map((k) => { let ok = false; try { ok = !!AV[k].resolvida(rede, C); } catch (e) { ok = false; } return { queixa: txt(AV[k].queixa, C), ok, solucao: txt(AV[k].solucao, C) }; });
    const feitas = lista.filter((x) => x.ok).length, total = lista.length;
    const gasto = Math.max(0, Math.round(((agora || Date.now()) - dz.inicio) / 1000));
    const base = (feitas / total) * 15;
    const tempo = feitas === total ? Math.max(0, 3 * (1 - gasto / dz.limite)) : 0;  // até 3 valores pela rapidez
    const metodo = Math.min(2, (dz.diag || 0) / Math.max(1, total * 2) * 2);       // até 2 valores por diagnosticar (show, ping, ipconfig…)
    const nota = Math.round(Math.min(20, base + tempo + metodo) * 10) / 10;
    return { lista, feitas, total, gasto, nota, acabou: feitas === total || gasto >= dz.limite };
  }
  // Comandos de diagnóstico contam para a nota (verificar antes de mudar)
  const ehDiagnostico = (linha) => /^\s*(do\s+)?(sh(ow)?|ping|tracert|traceroute|ipconfig|nslookup|arp|debug)\b/i.test(linha || "");

  // ------------------------------------------------------------------ atividades criadas pelo professor
  // Compara a rede inicial com a solução e propõe o que pode contar para a nota (o professor escolhe).
  function candidatos(inicial, solucao) {
    const A = S.Rede.importar(JSON.parse(JSON.stringify(inicial))), B = S.Rede.importar(JSON.parse(JSON.stringify(solucao)));
    const out = [], add = (texto, check, grupo) => out.push({ texto, check, grupo });
    B.devs.forEach((d) => {
      const a = A.devs.find((x) => x.id === d.id);
      if (d.eq) {
        const c = d.eq.cfg, ca = a && a.eq ? a.eq.cfg : null, nome = d.nome;
        if (!ca || ca.hostname !== c.hostname) add(`${nome}: hostname ${c.hostname}`, { t: "ios", nome, check: { t: "hostname", v: c.hostname } }, "Configuração");
        if (c.enableSecret && (!ca || !ca.enableSecret)) add(`${nome}: enable secret configurado`, { t: "ios", nome, check: { t: "enable_secret" } }, "Segurança");
        if (c.lines.vty.transport === "ssh" && (!ca || ca.lines.vty.transport !== "ssh")) add(`${nome}: acesso remoto só por SSH`, { t: "ios", nome, check: { t: "vty_ssh" } }, "Segurança");
        Object.entries(c.interfaces).forEach(([n, i]) => {
          const ia = ca && ca.interfaces[n];
          if (i.ip && i.ip !== "dhcp" && (!ia || ia.ip !== i.ip || ia.mask !== i.mask || ia.shutdown !== i.shutdown) && !i.shutdown)
            add(`${nome} ${n}: ${i.ip}/${IOS.prefixo(i.mask)} e ativa`, { t: "ios", nome, check: n.includes(".") ? { t: "subif", if: n, vlan: i.encap, ip: i.ip } : { t: "iface_ip", if: n, ip: i.ip, mask: i.mask, up: true } }, "Interfaces");
          if (d.eq.tipo === "switch" && !i.routed && !/^Vlan|^Port-channel/.test(n)) {
            if (i.mode === "access" && i.accessVlan !== 1 && (!ia || ia.accessVlan !== i.accessVlan)) add(`${nome} ${n}: porta de acesso na VLAN ${i.accessVlan}`, { t: "ios", nome, check: { t: "access_vlan", if: n, vlan: i.accessVlan } }, "VLAN");
            if (i.mode === "trunk" && (!ia || ia.mode !== "trunk")) add(`${nome} ${n}: trunk 802.1Q`, { t: "ios", nome, check: { t: "trunk", if: n } }, "VLAN");
          }
        });
        Object.entries(c.vlans).forEach(([v, nm]) => { if (v !== "1" && (!ca || ca.vlans[v] === undefined)) add(`${nome}: VLAN ${v} (${nm})`, { t: "ios", nome, check: { t: "vlan", id: v, name: nm } }, "VLAN"); });
        (c.routes || []).forEach((r) => { if (!ca || !(ca.routes || []).some((x) => x.net === r.net && x.via === r.via)) add(`${nome}: rota ${r.net}/${IOS.prefixo(r.mask)} via ${r.via}`, { t: "ios", nome, check: { t: "route", net: r.net, mask: r.mask, via: r.via } }, "Encaminhamento"); });
        if (c.ospf && (!ca || !ca.ospf)) add(`${nome}: OSPF configurado`, { t: "ios", nome, check: { t: "ospf" } }, "Encaminhamento");
        Object.entries(c.dhcpPools || {}).forEach(([n, p]) => { if (p.net && (!ca || !ca.dhcpPools[n])) add(`${nome}: pool DHCP ${n} (${p.net})`, { t: "ios", nome, check: { t: "dhcp_pool", name: n, net: p.net } }, "Serviços"); });
        if ((c.natRules || []).some((x) => /overload/.test(x)) && (!ca || !(ca.natRules || []).length)) add(`${nome}: NAT com overload (PAT)`, { t: "ios", nome, check: { t: "nat_overload" } }, "Serviços");
        if (d.eq.startup && d.eq.startup === d.eq.estado() && (!a || !a.eq || a.eq.startup !== d.eq.startup)) add(`${nome}: configuração guardada (copy run start)`, { t: "ios", nome, check: { t: "saved" } }, "Configuração");
      }
      if (d.pc && !S.TIPOS[d.tipo].semIp) {
        const pa = a && a.pc;
        if (!d.pc.dhcp && d.pc.ip && (!pa || pa.ip !== d.pc.ip || pa.mask !== d.pc.mask || pa.gw !== d.pc.gw)) add(`${d.nome}: IP ${d.pc.ip}/${IOS.prefixo(d.pc.mask)}${d.pc.gw ? ", gateway " + d.pc.gw : ""}`, { t: "pc_ip", nome: d.nome, ip: d.pc.ip, mask: d.pc.mask, gw: d.pc.gw }, "Computadores");
        if (d.pc.dhcp && d.pc.lease && !d.pc.lease.apipa && (!pa || !pa.dhcp || !pa.lease || pa.lease.apipa)) add(`${d.nome}: recebe IP por DHCP`, { t: "dhcp", nome: d.nome }, "Computadores");
      }
      if (d.srv && d.srv.dns.registos.length) d.srv.dns.registos.forEach((r) => { if (!a || !a.srv || !a.srv.dns.registos.some((x) => x.nome === r.nome)) add(`${d.nome}: registo DNS ${r.nome}`, { t: "dns", nome: d.nome, registo: r.nome }, "Serviços"); });
    });
    B.links.forEach((l) => { if (!A.links.some((x) => (x.a === l.a && x.b === l.b) || (x.a === l.b && x.b === l.a)) && B.estadoLink(l).estado !== "errado") { const da = B.dev(l.a), db = B.dev(l.b); add(`Cabo ${S.CABOS[l.cabo] ? S.CABOS[l.cabo].nome.toLowerCase() : l.cabo} entre ${da.nome} e ${db.nome}`, { t: "cabo", a: da.nome, b: db.nome, cabo: l.cabo }, "Cabos"); } });
    // pings que passam a funcionar (até 8 pares)
    const hosts = B.devs.filter((d) => d.pc && B.l3(d).length);
    let n = 0;
    hosts.forEach((x) => hosts.forEach((y) => {
      if (x === y || n >= 8) return;
      const ip = B.l3(y)[0].ip, ax = A.dev(x.id);
      if (B.pingCalc(x, ip).ok && !(ax && A.l3(ax).length && A.pingCalc(ax, ip).ok)) { n++; add(`${x.nome} faz ping a ${y.nome}`, { t: "ping", de: x.nome, para: y.nome }, "Testes"); }
    }));
    return out;
  }
  // Código para partilhar a atividade (os alunos colam-no na app)
  const codificar = (o) => btoa(unescape(encodeURIComponent(JSON.stringify(o))));
  const descodificar = (t) => JSON.parse(decodeURIComponent(escape(atob(String(t).trim()))));
  function atividadeDe(x) {
    return { id: x.id, titulo: x.titulo, cenario: x.instrucoes, nivel: "Professor", modulo: null, prof: true, estadoInicial: x.inicial, passos: x.passos.map((p) => ({ texto: p.texto, check: p.check })) };
  }

  window.Desafios = { CENARIOS, NIVEIS, AVARIAS: AV, criar, avaliar, ehDiagnostico, candidatos, codificar, descodificar, atividadeDe };
})();
