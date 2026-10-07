// Testa o tráfego "a sério": ACL, NAT, Spanning Tree, EtherChannel, HSRP, BPDU Guard e debug.
const fs = require("fs"), path = require("path"), vm = require("vm");
global.window = globalThis;
for (const f of ["conteudo.js", "ios.js", "simulador.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, "..", "www", "js", f), "utf8"));
const { Rede } = window.Simulador;
let falhas = 0;
const ok = (cond, msg) => { if (!cond) { console.log("FALHA:", msg); falhas++; } };
const cli = (r, nome, cmds) => { const d = r.dev(nome); const outs = cmds.map((c) => { const o = d.eq.executar(c); if (/% (Invalid|Incomplete)/.test(o)) { console.log(`  ${nome}: "${c}" → ${o}`); falhas++; } r.mudou(); return o; }); return outs[outs.length - 1]; };
const pc = (r, nome, ip, gw, x, y) => { const d = r.novoDev("pc", x || 10, y || 50, nome); Object.assign(d.pc, { dhcp: false, ip, mask: "255.255.255.0", gw }); return d; };
const fio = (r, a, pa, b, pb) => r.ligar(r.dev(a), pa, r.dev(b), pb, "auto");

// ---------------------------------------------------------------- ACL
let r = new Rede();
r.novoDev("router", 50, 50, "R1");
pc(r, "PC1", "192.168.1.10", "192.168.1.1"); pc(r, "PC2", "192.168.1.11", "192.168.1.1");
r.novoDev("servidor", 90, 50, "SRV"); Object.assign(r.dev("SRV").pc, { dhcp: false, ip: "192.168.2.5", mask: "255.255.255.0", gw: "192.168.2.1" });
r.novoDev("switch", 30, 50, "S1");
fio(r, "PC1", "FastEthernet0", "S1", "FastEthernet0/1"); fio(r, "PC2", "FastEthernet0", "S1", "FastEthernet0/2");
fio(r, "S1", "GigabitEthernet0/1", "R1", "GigabitEthernet0/0/0"); fio(r, "SRV", "FastEthernet0", "R1", "GigabitEthernet0/0/1");
cli(r, "R1", ["enable", "conf t", "int g0/0/0", "ip add 192.168.1.1 255.255.255.0", "no sh", "int g0/0/1", "ip add 192.168.2.1 255.255.255.0", "no sh", "end"]);
const P1 = r.dev("PC1"), P2 = r.dev("PC2");
ok(r.pingCompleto(P1, "192.168.2.5").ok, "ACL: ping sem ACL");
cli(r, "R1", ["conf t", "access-list 110 deny icmp host 192.168.1.10 any", "access-list 110 permit ip any any", "int g0/0/0", "ip access-group 110 in", "end"]);
let x = r.pingCompleto(P1, "192.168.2.5");
ok(!x.ok && /ACL 110/.test(x.motivo) && /deny icmp host 192.168.1.10 any/.test(x.motivo), "ACL: PC1 bloqueado — " + x.motivo);
ok(r.pingCompleto(P2, "192.168.2.5").ok, "ACL: PC2 passa");
let out = cli(r, "R1", ["show access-lists"]);
ok(/10 deny icmp host 192.168.1.10 any \(4 matches\)/.test(out) && /20 permit ip any any \(\d+ matches\)/.test(out), "ACL: contadores\n" + out);
// telnet bloqueado por porta, http deixado
cli(r, "R1", ["conf t", "no access-list 110", "access-list 120 deny tcp any any eq 23", "access-list 120 permit ip any any", "int g0/0/0", "ip access-group 120 in", "end"]);
ok(!r.ligar4(P1, "192.168.2.5", "tcp", 23).ok, "ACL: telnet bloqueado");
ok(r.ligar4(P1, "192.168.2.5", "tcp", 80).ok, "ACL: http passa");
ok(r.pingCompleto(P1, "192.168.2.5").ok, "ACL: ping passa com a 120");
// standard de saída: só a rede 192.168.1.0 deixa de chegar ao servidor
cli(r, "R1", ["conf t", "int g0/0/0", "no ip access-group 120 in", "exit", "access-list 5 deny 192.168.1.0 0.0.0.255", "int g0/0/1", "ip access-group 5 out", "end"]);
x = r.pingCompleto(P1, "192.168.2.5");
ok(!x.ok && /implícito|deny 192.168.1.0/.test(x.motivo), "ACL std saída: " + x.motivo);
out = cli(r, "R1", ["show access-lists 5"]);
ok(/Standard IP access list 5/.test(out) && /deny 192.168.1.0, wildcard bits 0.0.0.255 \(4 matches\)/.test(out), "ACL std formato:\n" + out);
// ACL com nome
cli(r, "R1", ["conf t", "int g0/0/1", "no ip access-group 5 out", "exit", "ip access-list extended FILTRO", "permit icmp any any echo", "permit icmp any any echo-reply", "deny ip any any", "exit", "int g0/0/0", "ip access-group FILTRO in", "end"]);
ok(r.pingCompleto(P1, "192.168.2.5").ok, "ACL nome: ping passa");
ok(!r.ligar4(P1, "192.168.2.5", "tcp", 445).ok, "ACL nome: SMB bloqueado");

// ---------------------------------------------------------------- NAT/PAT e NAT estática
r = new Rede();
r.novoDev("router", 40, 50, "R1"); r.novoDev("router", 80, 50, "ISP");
pc(r, "PC1", "192.168.1.10", "192.168.1.1");
r.novoDev("servidor", 30, 80, "WEB"); Object.assign(r.dev("WEB").pc, { dhcp: false, ip: "192.168.1.5", mask: "255.255.255.0", gw: "192.168.1.1" });
r.novoDev("switch", 20, 50, "S1");
r.novoDev("servidor", 95, 50, "NET"); Object.assign(r.dev("NET").pc, { dhcp: false, ip: "8.8.8.8", mask: "255.255.255.0", gw: "8.8.8.1" });
fio(r, "PC1", "FastEthernet0", "S1", "FastEthernet0/1"); fio(r, "WEB", "FastEthernet0", "S1", "FastEthernet0/2");
fio(r, "S1", "GigabitEthernet0/1", "R1", "GigabitEthernet0/0/0"); fio(r, "R1", "GigabitEthernet0/0/1", "ISP", "GigabitEthernet0/0/0"); fio(r, "NET", "FastEthernet0", "ISP", "GigabitEthernet0/0/1");
cli(r, "R1", ["enable", "conf t", "int g0/0/0", "ip add 192.168.1.1 255.255.255.0", "ip nat inside", "no sh", "int g0/0/1", "ip add 209.165.200.226 255.255.255.248", "ip nat outside", "no sh", "exit", "ip route 0.0.0.0 0.0.0.0 209.165.200.225", "end"]);
cli(r, "ISP", ["enable", "conf t", "int g0/0/0", "ip add 209.165.200.225 255.255.255.248", "no sh", "int g0/0/1", "ip add 8.8.8.1 255.255.255.0", "no sh", "end"]);
ok(!r.pingCompleto(r.dev("PC1"), "8.8.8.8").ok, "NAT: sem NAT o ISP não conhece 192.168.1.0");
cli(r, "R1", ["conf t", "access-list 1 permit 192.168.1.0 0.0.0.255", "ip nat inside source list 1 interface g0/0/1 overload", "end"]);
x = r.pingCompleto(r.dev("PC1"), "8.8.8.8");
ok(x.ok && x.nat === "209.165.200.226", "NAT: PAT funciona " + x.motivo);
out = cli(r, "R1", ["show ip nat translations"]);
ok(/icmp 209.165.200.226:\d+\s+192.168.1.10:\d+\s+8.8.8.8/.test(out), "NAT: tabela\n" + out);
cli(r, "R1", ["clear ip nat translation *"]); ok(!/icmp/.test(cli(r, "R1", ["show ip nat translations"])), "NAT: clear");
// NAT estática: servidor web visível de fora
cli(r, "R1", ["conf t", "ip nat inside source static 192.168.1.5 209.165.200.229", "end"]);
x = r.pingCompleto(r.dev("NET"), "209.165.200.229");
ok(x.ok, "NAT estática de fora para dentro: " + x.motivo);
ok(/---\s+209.165.200.229\s+192.168.1.5/.test(cli(r, "R1", ["show ip nat translations"])), "NAT estática na tabela");
// debug ip nat e debug ip icmp
cli(r, "R1", ["debug ip nat"]); r.dev("R1").eq.pendentes = [];
r.pingCompleto(r.dev("PC1"), "8.8.8.8");
ok(r.dev("R1").eq.pendentes.some((m) => /^NAT: s=192.168.1.10->209.165.200.226, d=8.8.8.8/.test(m)), "debug ip nat: " + r.dev("R1").eq.pendentes.join(" | "));
cli(r, "ISP", ["debug ip icmp"]); r.pingCompleto(r.dev("PC1"), "209.165.200.225");
ok(r.dev("ISP").eq.pendentes.filter((m) => /^ICMP: echo reply sent, src 209.165.200.225, dst 209.165.200.226/.test(m)).length === 4, "debug ip icmp: " + r.dev("ISP").eq.pendentes.join(" | "));
cli(r, "ISP", ["undebug all"]); ok(!r.dev("ISP").eq.debugs.size, "undebug all");

// ---------------------------------------------------------------- Spanning Tree
r = new Rede();
["S1", "S2", "S3"].forEach((n, k) => r.novoDev("switch", 20 + k * 30, 30, n));
fio(r, "S1", "GigabitEthernet0/1", "S2", "GigabitEthernet0/1"); fio(r, "S2", "GigabitEthernet0/2", "S3", "GigabitEthernet0/1"); fio(r, "S3", "GigabitEthernet0/2", "S1", "GigabitEthernet0/2");
pc(r, "PC1", "192.168.1.10", ""); pc(r, "PC3", "192.168.1.30", "");
fio(r, "PC1", "FastEthernet0", "S1", "FastEthernet0/1"); fio(r, "PC3", "FastEthernet0", "S3", "FastEthernet0/1");
cli(r, "S2", ["enable", "conf t", "spanning-tree vlan 1 root primary", "end"]); cli(r, "S1", ["enable"]); cli(r, "S3", ["enable"]);
let st = r.stp();
ok(st.ledBloq.size === 1, "STP: uma porta bloqueada " + [...st.ledBloq]);
const bloqueada = [...st.ledBloq][0];
ok(bloqueada.startsWith(r.dev("S1").id) || bloqueada.startsWith(r.dev("S3").id), "STP: bloqueada fora da raiz " + bloqueada);
ok(r.pingCompleto(r.dev("PC1"), "192.168.1.30").ok, "STP: ping funciona com loop físico");
out = cli(r, "S2", ["show spanning-tree"]);
ok(/This bridge is the root/.test(out) && /Priority    24577/.test(out), "STP show na raiz\n" + out);
out = cli(r, "S1", ["show spanning-tree"]);
ok(/Root FWD/.test(out), "STP show S1 com porta raiz\n" + out);
ok(/Altn BLK/.test(cli(r, "S1", ["show spanning-tree"])) || /Altn BLK/.test(cli(r, "S3", ["show spanning-tree"])), "STP: Altn BLK aparece");
// sem STP → tempestade
["S1", "S2", "S3"].forEach((n) => cli(r, n, ["conf t", "no spanning-tree vlan 1", "end"]));
x = r.pingCompleto(r.dev("PC1"), "192.168.1.30");
ok(!x.ok && /tempestade de broadcast/.test(x.motivo), "STP desligado: tempestade " + x.motivo);
["S1", "S2", "S3"].forEach((n) => cli(r, n, ["conf t", "spanning-tree vlan 1", "end"]));
ok(r.pingCompleto(r.dev("PC1"), "192.168.1.30").ok, "STP ligado outra vez");
// cortar o cabo da raiz: a porta bloqueada passa a encaminhar
r.apagarLink(r.links.find((l) => l.a === r.dev("S1").id && l.b === r.dev("S2").id));
ok(r.stp().ledBloq.size === 0, "STP: sem loop não há bloqueio");
ok(r.pingCompleto(r.dev("PC1"), "192.168.1.30").ok, "STP: ping depois de cortar o cabo");

// ---------------------------------------------------------------- EtherChannel
r = new Rede();
r.novoDev("switch", 20, 30, "S1"); r.novoDev("switch", 60, 30, "S2");
fio(r, "S1", "GigabitEthernet0/1", "S2", "GigabitEthernet0/1"); fio(r, "S1", "GigabitEthernet0/2", "S2", "GigabitEthernet0/2");
ok(r.stp().ledBloq.size === 1, "EC: sem EtherChannel uma das duas ligações fica bloqueada");
cli(r, "S1", ["enable", "conf t", "int range g0/1 - 2", "channel-group 1 mode active", "end"]);
cli(r, "S2", ["enable", "conf t", "int range g0/1 - 2", "channel-group 1 mode passive", "end"]);
ok(r.stp().ledBloq.size === 0, "EC: com LACP as duas ligações encaminham " + [...r.stp().ledBloq]);
out = cli(r, "S1", ["show etherchannel summary"]);
ok(/Po1\(SU\)\s+LACP\s+Gi0\/1\(P\) Gi0\/2\(P\)/.test(out), "EC show\n" + out);
cli(r, "S2", ["conf t", "int range g0/1 - 2", "channel-group 1 mode on", "end"]);
ok(/Po1\(SD\)/.test(cli(r, "S1", ["show etherchannel summary"])) && r.stp().ledBloq.size === 1, "EC: on vs active não forma\n" + cli(r, "S1", ["show etherchannel summary"]));
ok(/channel-group 1 mode active/.test(cli(r, "S1", ["show running-config"])), "EC running-config");

// ---------------------------------------------------------------- HSRP
r = new Rede();
r.novoDev("router", 30, 20, "R1"); r.novoDev("router", 70, 20, "R2"); r.novoDev("switch", 50, 50, "S1");
pc(r, "PC1", "192.168.1.10", "192.168.1.254", 50, 80);
r.novoDev("servidor", 50, 5, "SRV"); Object.assign(r.dev("SRV").pc, { dhcp: false, ip: "10.0.0.5", mask: "255.255.255.0", gw: "10.0.0.254" });
r.novoDev("switch", 50, 10, "S2");
fio(r, "R1", "GigabitEthernet0/0/0", "S1", "GigabitEthernet0/1"); fio(r, "R2", "GigabitEthernet0/0/0", "S1", "GigabitEthernet0/2"); fio(r, "PC1", "FastEthernet0", "S1", "FastEthernet0/1");
fio(r, "R1", "GigabitEthernet0/0/1", "S2", "GigabitEthernet0/1"); fio(r, "R2", "GigabitEthernet0/0/1", "S2", "GigabitEthernet0/2"); fio(r, "SRV", "FastEthernet0", "S2", "FastEthernet0/1");
cli(r, "R1", ["enable", "conf t", "int g0/0/0", "ip add 192.168.1.1 255.255.255.0", "standby 1 ip 192.168.1.254", "standby 1 priority 110", "standby 1 preempt", "no sh", "int g0/0/1", "ip add 10.0.0.1 255.255.255.0", "standby 2 ip 10.0.0.254", "standby 2 priority 110", "standby 2 preempt", "standby 2 track g0/0/0 20", "no sh", "end"]);
cli(r, "R2", ["enable", "conf t", "int g0/0/0", "ip add 192.168.1.2 255.255.255.0", "standby 1 ip 192.168.1.254", "no sh", "int g0/0/1", "ip add 10.0.0.2 255.255.255.0", "standby 2 ip 10.0.0.254", "standby 2 preempt", "no sh", "end"]);
x = r.pingCompleto(r.dev("PC1"), "10.0.0.5");
ok(x.ok && x.devs.includes(r.dev("R1").id), "HSRP: R1 ativo encaminha " + x.motivo);
out = cli(r, "R1", ["show standby brief"]);
ok(/Gi0\/0\/0\s+1\s+110 P Active\s+local\s+192.168.1.2\s+192.168.1.254/.test(out), "HSRP show R1\n" + out);
ok(/Standby\s+192.168.1.1\s+local/.test(cli(r, "R2", ["show standby brief"])), "HSRP show R2\n" + cli(r, "R2", ["show standby brief"]));
r.dev("R2").eq.pendentes = [];
cli(r, "R1", ["conf t", "int g0/0/0", "shutdown", "end"]);
x = r.pingCompleto(r.dev("PC1"), "10.0.0.5");
ok(x.ok && x.devs.includes(r.dev("R2").id) && !x.devs.includes(r.dev("R1").id), "HSRP: failover para R2 " + x.motivo);
ok(r.dev("R2").eq.pendentes.some((m) => /%HSRP-6-STATECHANGE: GigabitEthernet0\/0\/0 Grp 1 state Standby -> Active/.test(m)), "HSRP: aviso de mudança " + r.dev("R2").eq.pendentes);
cli(r, "R1", ["conf t", "int g0/0/0", "no shutdown", "end"]);
ok(r.pingCompleto(r.dev("PC1"), "10.0.0.5").devs.includes(r.dev("R1").id), "HSRP: preempt devolve a R1");

// ---------------------------------------------------------------- BPDU Guard
r = new Rede();
r.novoDev("switch", 20, 30, "S1"); r.novoDev("switch", 60, 30, "S2");
fio(r, "S1", "FastEthernet0/1", "S2", "FastEthernet0/1");
cli(r, "S1", ["enable", "conf t", "int fa0/1", "spanning-tree portfast", "spanning-tree bpduguard enable", "end"]);
ok(r.estadoLink(r.links[0]).estado === "baixo", "BPDU Guard: porta err-disabled");
ok(r.dev("S1").eq.pendentes.some((m) => /BLOCK_BPDUGUARD/.test(m)), "BPDU Guard: aviso");

if (falhas) { console.log(falhas + " falha(s)."); process.exit(1); }
console.log("Tráfego (ACL, NAT, STP, EtherChannel, HSRP): tudo certo.");
