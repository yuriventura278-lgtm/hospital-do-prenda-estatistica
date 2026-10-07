/* Modo de simulação (como o "Simulation Mode" do Packet Tracer).
   Transforma uma ação (ping, DHCP, DNS, Telnet/SSH, HTTP, SMB) na lista de mensagens que passam
   em cada cabo, por ordem: primeiro o ARP, depois os pacotes. Cada evento traz o que vai em cada
   camada (física, ligação de dados, rede, transporte), para o aluno "abrir o envelope".
   Usa o motor de simulador.js (os mesmos cálculos do ping normal). */
(function () {
  "use strict";
  const S = window.Simulador;
  const NOMES_PORTA = { 20: "FTP dados", 21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP", 53: "DNS", 67: "DHCP servidor", 68: "DHCP cliente", 69: "TFTP", 80: "HTTP", 110: "POP3", 123: "NTP", 143: "IMAP", 161: "SNMP", 443: "HTTPS", 445: "SMB", 514: "Syslog" };
  const COR = { ARP: "#c48a12", ICMP: "#1c9a57", DHCP: "#7a4fd6", DNS: "#1f5fe0", TCP: "#d43d4f", UDP: "#0e8a8a", STP: "#5b6880" };
  const BROAD = "FFFF.FFFF.FFFF";
  const nomeP = (p) => (p ? `${p}${NOMES_PORTA[p] ? " (" + NOMES_PORTA[p] + ")" : ""}` : "");

  // ARP: o que cada equipamento já sabe (IP → MAC). Fica guardado na rede durante a sessão.
  function cacheArp(rede, d) { rede.arpSim = rede.arpSim || {}; return (rede.arpSim[d.id] = rede.arpSim[d.id] || new Set()); }
  function limparArp(rede) { rede.arpSim = {}; rede.devs.forEach((d) => { if (d.pc) d.pc.arp = {}; }); }

  // MAC de destino de um endereço L3 (o IP virtual do HSRP usa o MAC virtual 0000.0C07.ACxx)
  function macL3(rede, dev, e) {
    if (!e) return BROAD;
    if (e.hsrp) return ("0000.0C07.AC" + (+e.hsrp).toString(16).padStart(2, "0")).toUpperCase();
    return S.macDe(dev, e.porta || e.iface);
  }

  // Constrói os eventos de um segmento (de um equipamento L3 até ao próximo), cabo a cabo.
  function eventosSegmento(rede, seg, base, ev) {
    const de = rede.dev(seg.de), ate = rede.dev(seg.ate);
    const macSrc = macL3(rede, de, seg.saida), macDst = macL3(rede, ate, seg.alvo);
    const conhece = cacheArp(rede, de);
    if (!conhece.has(seg.prox) && !(de.pc && de.pc.arp && de.pc.arp[seg.prox])) {
      // ARP Request em difusão (todos na VLAN recebem; só o dono do IP responde) e ARP Reply direto
      percorrer(rede, seg, false, ev, { tipo: "ARP", resumo: `ARP Request: quem tem ${seg.prox}? Diga a ${seg.saida.ip}`, l2: (tag) => `Ethernet II · origem ${macSrc} → destino ${BROAD} (difusão)${tag ? " · 802.1Q VLAN " + tag : ""}`, l3: `ARP Request · IP do remetente ${seg.saida.ip} · IP procurado ${seg.prox}`, l4: "" });
      percorrer(rede, seg, true, ev, { tipo: "ARP", resumo: `ARP Reply: ${seg.prox} está em ${macDst}`, l2: (tag) => `Ethernet II · origem ${macDst} → destino ${macSrc}${tag ? " · 802.1Q VLAN " + tag : ""}`, l3: `ARP Reply · ${seg.prox} = ${macDst}`, l4: "" });
      conhece.add(seg.prox); cacheArp(rede, ate).add(seg.saida.ip);
      if (de.pc) de.pc.arp[seg.prox] = true;
    }
    const icmp = seg.proto === "icmp";
    const tipo = base.tipo || (icmp ? "ICMP" : seg.proto === "tcp" ? "TCP" : "UDP");
    const l4 = icmp ? (seg.icmp === "echo-reply" ? "ICMP Echo Reply (tipo 0)" : "ICMP Echo Request (tipo 8)") : `${seg.proto.toUpperCase()} · porta de origem ${nomeP(seg.sport)} → porta de destino ${nomeP(seg.dport)}${seg.proto === "tcp" ? " · flags " + (seg.icmp === "echo-reply" || seg.resposta ? "SYN+ACK" : "SYN") : ""}`;
    percorrer(rede, seg, false, ev, {
      tipo, resumo: base.resumo || (icmp ? `${seg.icmp === "echo-reply" ? "Echo Reply" : "Echo Request"} ${seg.src} → ${seg.dst}` : `${tipo} ${seg.src}:${seg.sport} → ${seg.dst}:${seg.dport}`),
      l2: (tag) => `Ethernet II · origem ${macSrc} → destino ${macDst}${tag ? " · 802.1Q VLAN " + tag : ""}`,
      l3: `IPv4 · origem ${seg.src} → destino ${seg.dst} · TTL ${base.ttl} · protocolo ${icmp ? "ICMP (1)" : seg.proto === "tcp" ? "TCP (6)" : "UDP (17)"}`,
      l4, l7: base.l7 || "",
    });
  }
  // Uma mensagem a passar cabo a cabo ao longo do caminho de camada 2 do segmento
  function percorrer(rede, seg, inverso, ev, m) {
    const passos = seg.caminho.slice(1).map((id, k) => ({ de: seg.caminho[k], para: id, via: seg.via[k] }));
    (inverso ? passos.reverse() : passos).forEach((p) => {
      const v = p.via || {};
      const [de, para, pS, pE] = inverso ? [p.para, p.de, v.entrada, v.saida] : [p.de, p.para, v.saida, v.entrada];
      const cabo = v.cabo && S.CABOS[v.cabo] ? S.CABOS[v.cabo].nome.toLowerCase() : v.cabo === "wifi" ? "sem fios (Wi-Fi)" : "cabo";
      const dP = rede.dev(para);
      ev.push({ tipo: m.tipo, de, para, resumo: m.resumo,
        camadas: [["Camada 1 · Física", `Sai pela porta ${pS || "?"} → ${cabo} → entra em ${dP ? dP.nome : "?"} ${pE || ""}`.trim()], ["Camada 2 · Ligação de dados", m.l2(v.tag)], ["Camada 3 · Rede", m.l3]].concat(m.l4 ? [["Camada 4 · Transporte", m.l4]] : []).concat(m.l7 ? [["Camada 7 · Aplicação", m.l7]] : []) });
    });
  }

  // TTL inicial: PCs/servidores 128, equipamentos Cisco 255; baixa 1 em cada router
  const ttlIni = (d) => (d && d.eq ? 255 : 128);

  // Eventos de uma ligação já calculada pelo motor (resultado de pingCalc)
  function eventosDe(rede, r, opc) {
    const ev = [];
    let ttl = null, origem = null;
    (r.segmentos || []).forEach((seg, k) => {
      const de = rede.dev(seg.de);
      if (k === 0 || seg.src !== origem) { ttl = ttlIni(de); origem = seg.src; } else ttl -= 1;
      eventosSegmento(rede, seg, Object.assign({ ttl }, opc && opc(seg, k)), ev);
    });
    if (!r.ok) {
      const ult = (r.trajeto || []).slice(-1)[0], ultSeg = (r.segmentos || []).slice(-1)[0];
      const onde = ult ? ult.dev : ultSeg ? ultSeg.ate : null;
      ev.push({ tipo: "FALHA", de: onde, para: onde, resumo: "O pacote foi descartado", falha: r.motivo, camadas: [["Porquê", r.motivo]] });
    }
    return ev;
  }

  // ------------------------------------------------------------------ ações
  function ping(rede, d, ip) {
    const r = rede.pingCalc(d, ip);
    return { ok: r.ok, motivo: r.motivo, eventos: eventosDe(rede, r) };
  }
  function tcp(rede, d, ip, proto, porta, l7) {
    const r = rede.ligar4(d, ip, proto, porta);
    return { ok: r.ok, motivo: r.motivo, eventos: eventosDe(rede, r, (seg) => ({ l7: seg.dport === porta ? l7.ida : l7.volta })) };
  }
  function dns(rede, d, nome) {
    const ef = rede.ipEfetivo(d);
    if (!S.ehIP(ef.dns)) return { ok: false, motivo: `${d.nome} não tem servidor DNS configurado`, eventos: [] };
    const res = rede.resolver(d, nome);
    const r = rede.ligar4(d, ef.dns, "udp", 53);
    const ev = eventosDe(rede, r, (seg) => ({ tipo: "DNS", resumo: seg.dport === 53 ? `DNS Query: qual é o IP de ${nome}?` : `DNS Response: ${nome} = ${res.ip || "não existe"}`, l7: seg.dport === 53 ? `DNS · pergunta tipo A para ${nome}` : `DNS · resposta ${res.ip ? "A " + res.ip : "NXDOMAIN (o nome não existe)"}` }));
    return { ok: !!res.ip && r.ok, motivo: res.erro || r.motivo, eventos: ev, ip: res.ip };
  }
  function dhcp(rede, d) {
    const porta = rede.portaAtiva(d);
    const lease = rede.leaseDe(d, porta);
    if (!lease) return { ok: false, motivo: "Nenhum servidor DHCP respondeu ao DHCP Discover: o PC fica com um endereço APIPA (169.254.x.x).", eventos: dhcpSemResposta(rede, d, porta) };
    const serv = rede.dev(lease.deId), relay = lease.relayId ? rede.dev(lease.relayId) : null;
    const local = relay || serv;
    const dom = rede.dominio(d, { porta, vlan: null, iface: "x" });
    const seg = { de: d.id, ate: local.id, caminho: rede.caminho(dom.pai, local.id), via: [] };
    seg.via = seg.caminho.slice(1).map((x) => dom.via.get(x));
    const macPC = S.macDe(d, porta), macSrv = S.macDe(local, "dhcp");
    const ev = [];
    const fase = (inverso, nome, l3, l7, dst) => percorrer(rede, seg, inverso, ev, { tipo: "DHCP", resumo: nome, l2: (tag) => `Ethernet II · origem ${inverso ? macSrv : macPC} → destino ${dst || BROAD}${tag ? " · 802.1Q VLAN " + tag : ""}`, l3, l4: inverso ? "UDP · porta 67 (servidor) → 68 (cliente)" : "UDP · porta 68 (cliente) → 67 (servidor)", l7 });
    const ofer = `endereço ${lease.ip}, máscara ${lease.mask}${lease.gw ? ", gateway " + lease.gw : ""}${lease.dns ? ", DNS " + lease.dns : ""}`;
    const pedeRelay = (nome, l7) => {
      if (!relay) return;
      const r = rede.ligar4(relay, lease.servIp, "udp", 67);
      eventosDe(rede, r, (s2) => ({ tipo: "DHCP", resumo: `${nome} reencaminhado pelo relay ${relay.nome} (ip helper-address)`, l7: l7 + " · unicast do relay para o servidor" })).forEach((x) => ev.push(x));
    };
    fase(false, "DHCP Discover (difusão): há algum servidor DHCP?", "IPv4 · origem 0.0.0.0 → destino 255.255.255.255 (difusão)", "DHCP Discover · o PC ainda não tem IP");
    pedeRelay("DHCP Discover", "DHCP Discover");
    fase(true, `DHCP Offer: ofereço ${lease.ip}`, `IPv4 · origem ${relay ? lease.relayIp : lease.servIp} → destino 255.255.255.255`, "DHCP Offer · " + ofer, macPC);
    fase(false, `DHCP Request: quero ${lease.ip}`, "IPv4 · origem 0.0.0.0 → destino 255.255.255.255 (difusão)", `DHCP Request · pede ${lease.ip} ao servidor ${serv.nome}`);
    pedeRelay("DHCP Request", "DHCP Request");
    fase(true, `DHCP Ack: ${lease.ip} é seu`, `IPv4 · origem ${relay ? lease.relayIp : lease.servIp} → destino 255.255.255.255`, "DHCP Ack · " + ofer + " · concessão de 1 dia", macPC);
    return { ok: true, eventos: ev, lease };
  }
  function dhcpSemResposta(rede, d, porta) {
    const dom = rede.dominio(d, { porta, vlan: null, iface: "x" }), ev = [];
    [...dom.via.entries()].forEach(([id, v]) => ev.push({ tipo: "DHCP", de: v.de, para: id, resumo: "DHCP Discover (difusão) — ninguém responde", camadas: [["Camada 2 · Ligação de dados", `Ethernet II · origem ${S.macDe(d, porta)} → destino ${BROAD}${v.tag ? " · 802.1Q VLAN " + v.tag : ""}`], ["Camada 3 · Rede", "IPv4 · 0.0.0.0 → 255.255.255.255"], ["Camada 4 · Transporte", "UDP 68 → 67"]] }));
    ev.push({ tipo: "FALHA", de: d.id, para: d.id, resumo: "Sem resposta DHCP", falha: "Não há servidor DHCP nesta rede (nem relay com ip helper-address). O PC usa APIPA 169.254.x.x.", camadas: [["Porquê", "Ninguém respondeu ao DHCP Discover."]] });
    return ev;
  }

  // Interpreta o pedido do painel: {tipo: ping|dhcp|dns|telnet|ssh|http|smb, de, para}
  function gerar(rede, pedido) {
    const d = rede.dev(pedido.de); if (!d) return { ok: false, motivo: "Escolha o equipamento de origem.", eventos: [] };
    const alvo = (pedido.para || "").trim();
    const ipDe = (txt) => { if (S.ehIP(txt)) return txt; const x = rede.dev(txt); if (x) { const e = rede.l3(x)[0]; return e ? e.ip : null; } return null; };
    if (pedido.tipo === "dhcp") { if (!d.pc) return { ok: false, motivo: "O DHCP é pedido por um PC/portátil/servidor.", eventos: [] }; return dhcp(rede, d); }
    if (pedido.tipo === "dns") return dns(rede, d, alvo || "www.exemplo.com");
    let ip = ipDe(alvo);
    let pre = [];
    if (!ip && alvo && d.pc) { const r = dns(rede, d, alvo); pre = r.eventos; if (!r.ip) return { ok: false, motivo: r.motivo, eventos: pre }; ip = r.ip; }
    if (!ip) return { ok: false, motivo: "Indique o destino: um IP ou o nome de um equipamento.", eventos: [] };
    let res;
    if (pedido.tipo === "telnet") res = tcp(rede, d, ip, "tcp", 23, { ida: "Telnet · pedido de sessão (texto simples)", volta: "Telnet · resposta do servidor" });
    else if (pedido.tipo === "ssh") res = tcp(rede, d, ip, "tcp", 22, { ida: "SSH · sessão cifrada", volta: "SSH · resposta cifrada" });
    else if (pedido.tipo === "http") res = tcp(rede, d, ip, "tcp", 80, { ida: "HTTP · GET / HTTP/1.1", volta: "HTTP/1.1 200 OK" });
    else if (pedido.tipo === "smb") res = tcp(rede, d, ip, "tcp", 445, { ida: "SMB · abrir a pasta partilhada", volta: "SMB · lista de ficheiros" });
    else res = ping(rede, d, ip);
    res.eventos = pre.concat(res.eventos);
    return res;
  }

  window.Simulacao = { gerar, limparArp, COR };
})();
