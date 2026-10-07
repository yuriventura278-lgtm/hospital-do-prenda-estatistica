// Testa os equipamentos novos do simulador: hub, Wi-Fi, router doméstico com NAT e DNS,
// operador (nuvem), modem, ASA, NAT no router Cisco, telefone IP com PoE e WLC/LAP.
const fs = require("fs"), path = require("path"), vm = require("vm");
global.window = globalThis;
for (const f of ["ios.js", "simulador.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, "..", "www", "js", f), "utf8"));
const { Rede, promptPC } = window.Simulador;
let falhas = 0;
const ok = (c, m) => { if (!c) { console.log("FALHA:", m); falhas++; } };
const M = "255.255.255.0";

// 1) Hub: dois PCs e o sniffer
let r = new Rede();
const hub = r.novoDev("hub", 50, 50), a = r.novoDev("pc", 20, 80, "A", { ip: "10.0.0.1", mask: M }), b = r.novoDev("pc", 80, 80, "B", { ip: "10.0.0.2", mask: M }), sn = r.novoDev("sniffer", 50, 90);
r.ligar(a, "FastEthernet0", hub, "Port0", "auto"); r.ligar(b, "FastEthernet0", hub, "Port1", "auto"); r.ligar(sn, "FastEthernet0", hub, "Port2", "auto");
ok(r.links.every((l) => r.estadoLink(l).estado === "ok"), "hub: cabos diretos verdes");
ok(r.pingCompleto(a, "10.0.0.2").ok, "hub: ping A→B");
ok(r.trafego.length === 1, "hub: tráfego registado");

// 2) Casa: PC (cabo) + portátil e smartphone (Wi-Fi) → router Wi-Fi → modem de cabo → operador
r = new Rede();
const isp = r.novoDev("nuvem", 50, 10), modem = r.novoDev("modem_cabo", 50, 30), rw = r.novoDev("router_wifi", 50, 50);
const pc = r.novoDev("pc", 20, 80, "PC1", { dhcp: true }), port = r.novoDev("portatil", 50, 80, "Port1", { dhcp: true }), tel = r.novoDev("smartphone", 80, 80, "Tel");
r.ligar(isp, "Coaxial7", modem, "Port0 (coaxial)", "coaxial"); r.ligar(modem, "Port1", rw, "Internet", "auto"); r.ligar(pc, "FastEthernet0", rw, "Ethernet1", "auto");
ok(r.links.every((l) => r.estadoLink(l).estado === "ok"), "casa: cabos verdes " + JSON.stringify(r.links.map((l) => [l.pa, l.pb, l.cabo, r.estadoLink(l)])));
ok(rw.rw.wan.lease && /^100\.64\.10\./.test(rw.rw.wan.lease.ip), "casa: router recebe IP do operador " + JSON.stringify(rw.rw.wan.lease));
ok(pc.pc.lease && /^192\.168\.0\.1\d\d$/.test(pc.pc.lease.ip), "casa: PC recebe IP do router " + JSON.stringify(pc.pc.lease));
let p = r.pingCompleto(pc, "8.8.8.8"); ok(p.ok && p.nat, "casa: PC chega à Internet com NAT " + p.motivo);
ok(/Reply from 93\.184\.216\.34/.test(promptPC(r, pc, "ping www.exemplo.com").txt), "casa: DNS pela Internet");
rw.rw.wifi = { ssid: "CasaKianda", seguranca: "wpa2", chave: "segredo123" }; r.mudou();
port.pc.wifi = { ssid: "CasaKianda", chave: "errada" }; tel.pc.wifi = { ssid: "CasaKianda", chave: "segredo123" }; r.mudou();
ok(/autenticação/.test(r.wifi().estado[port.id]), "wifi: chave errada não liga");
ok(tel.pc.lease && !tel.pc.lease.apipa && r.pingCompleto(tel, "8.8.8.8").ok, "wifi: smartphone liga e sai para a Internet " + JSON.stringify(tel.pc.lease));
port.pc.wifi.chave = "segredo123"; r.mudou(); r.pedirDhcp(port);
ok(r.pingCompleto(port, pc.pc.lease.ip).ok, "wifi: portátil sem fios chega ao PC com fios");
ok(!r.pingCompleto(r.devs.find((d) => d.tipo === "nuvem"), pc.pc.lease.ip).ok, "casa: a Internet não entra na rede privada");

// 3) ASA: inside 192.168.1.0/24, outside DHCP do operador
r = new Rede();
const n2 = r.novoDev("nuvem", 50, 10), asa = r.novoDev("asa", 50, 40), pcA = r.novoDev("pc", 50, 80, "PCA", { dhcp: true });
r.ligar(n2, "Ethernet6", asa, "GigabitEthernet1/1", "auto"); r.ligar(pcA, "FastEthernet0", asa, "GigabitEthernet1/2", "auto");
ok(r.links.every((l) => r.estadoLink(l).estado === "ok"), "asa: cabos " + JSON.stringify(r.links.map((l) => [l.cabo, r.estadoLink(l)])));
ok(pcA.pc.lease && /^192\.168\.1\./.test(pcA.pc.lease.ip), "asa: DHCP inside " + JSON.stringify(pcA.pc.lease));
p = r.pingCompleto(pcA, "8.8.8.8"); ok(!p.ok && /inspeciona ICMP/.test(p.motivo), "asa: sem inspeção ICMP a resposta é bloqueada: " + p.motivo);
asa.asa.icmp = true; r.mudou(); ok(r.pingCompleto(pcA, "8.8.8.8").ok, "asa: com inspeção ICMP o ping passa");
asa.asa.nat = false; r.mudou(); p = r.pingCompleto(pcA, "8.8.8.8"); ok(!p.ok, "asa: sem NAT o operador não sabe voltar");

// 4) Router Cisco com NAT/PAT
r = new Rede();
const n3 = r.novoDev("nuvem", 50, 10), r1 = r.novoDev("router", 50, 40, "R1", { modelo: "1941" }), s1 = r.novoDev("switch", 50, 60, "S1", { modelo: "2950" }), pcN = r.novoDev("pc", 50, 80, "PCN", { ip: "192.168.10.10", mask: M, gw: "192.168.10.1" });
ok(Object.keys(r1.eq.cfg.interfaces).includes("GigabitEthernet0/0") && !Object.keys(s1.eq.cfg.interfaces).includes("GigabitEthernet0/1"), "modelos: portas do 1941 e do 2950");
r.ligar(n3, "Ethernet6", r1, "GigabitEthernet0/0", "auto"); r.ligar(r1, "GigabitEthernet0/1", s1, "FastEthernet0/24", "auto"); r.ligar(pcN, "FastEthernet0", s1, "FastEthernet0/1", "auto");
["enable", "conf t", "int g0/0", "ip address 203.0.113.2 255.255.255.0", "ip nat outside", "no shut", "int g0/1", "ip address 192.168.10.1 255.255.255.0", "ip nat inside", "no shut", "exit", "ip route 0.0.0.0 0.0.0.0 203.0.113.1", "access-list 1 permit 192.168.10.0 0.0.0.255", "end"].forEach((c) => r1.eq.executar(c)); r.mudou();
p = r.pingCompleto(pcN, "8.8.8.8"); ok(!p.ok, "nat: sem regra de NAT não volta");
["conf t", "ip nat inside source list 1 interface g0/0 overload", "end"].forEach((c) => r1.eq.executar(c)); r.mudou();
p = r.pingCompleto(pcN, "8.8.8.8"); ok(p.ok && p.nat === "203.0.113.2", "nat: com PAT chega à Internet " + p.motivo);

// 5) Telefone IP: PoE e WLC/LAP
r = new Rede();
const s3 = r.novoDev("switch_l3", 50, 40, "S3", { modelo: "3560" }), s2 = r.novoDev("switch", 20, 40, "S2"), t1 = r.novoDev("telefone_ip", 50, 80, "Tel1", { ip: "10.1.1.5", mask: M }), t2 = r.novoDev("telefone_ip", 20, 80, "Tel2", { ip: "10.1.1.6", mask: M });
r.ligar(t1, "FastEthernet0", s3, "FastEthernet0/1", "auto"); r.ligar(t2, "FastEthernet0", s2, "FastEthernet0/1", "auto"); r.ligar(s2, "GigabitEthernet0/1", s3, "GigabitEthernet0/1", "auto");
ok(r.l3(t1).length === 1 && r.l3(t2).length === 0, "poe: telefone no 3560 tem energia, no 2960 não");
t2.pc.energia = true; r.mudou(); ok(r.pingCompleto(t2, "10.1.1.5").ok, "poe: com transformador funciona");
const wlc = r.novoDev("wlc", 80, 20, "WLC1", { ip: "10.1.1.2", mask: M }), lap = r.novoDev("lap", 80, 60), tab = r.novoDev("tablet", 90, 90, "Tab", { ip: "10.1.1.50", mask: M });
r.ligar(wlc, "FastEthernet0", s3, "FastEthernet0/2", "auto"); r.ligar(lap, "GigabitEthernet0", s3, "FastEthernet0/3", "auto");
tab.pc.wifi = { ssid: "Empresa", chave: "cisco12345" }; r.mudou();
ok(r.pingCompleto(tab, "10.1.1.5").ok, "wlc: tablet liga-se pelo LAP com a WLAN do WLC " + JSON.stringify(r.wifi().estado));

if (falhas) { console.log(falhas + " falhas"); process.exit(1); }
console.log("Equipamentos novos: tudo certo.");
