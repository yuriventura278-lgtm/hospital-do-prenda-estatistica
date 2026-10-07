// Testa o motor do simulador sem interface: resolve as atividades e confirma pings.
const fs = require("fs"), path = require("path"), vm = require("vm");
global.window = globalThis;
for (const f of ["conteudo.js", "ios.js", "simulador.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, "..", "www", "js", f), "utf8"));
const { Rede, verificar } = window.Simulador;
const A = Object.fromEntries(window.CCNA.atividades.map((a) => [a.id, a]));
let falhas = 0;
const ok = (cond, msg) => { if (!cond) { console.log("FALHA:", msg); falhas++; } };
const cli = (r, nome, cmds) => { const d = r.dev(nome); cmds.forEach((c) => { if (c === "enable" && d.eq.modo !== "user") return; const o = d.eq.executar(c); if (/% (Invalid|Incomplete)/.test(o)) { console.log(`  ${nome}: "${c}" → ${o}`); falhas++; } }); r.mudou(); };
const passos = (r, a) => a.passos.map((p) => verificar(r, p.check));

// s04: router com duas redes
let r = Rede.deAtividade(A.s04);
ok(!verificar(r, A.s04.passos[4].check), "s04: ping não devia funcionar antes de configurar");
cli(r, "R1", ["enable", "conf t", "int g0/0/0", "ip add 192.168.10.1 255.255.255.0", "no sh", "int g0/0/1", "ip add 192.168.11.1 255.255.255.0", "no sh", "end"]);
Object.assign(r.dev("PC1").pc, { ip: "192.168.10.10", mask: "255.255.255.0", gw: "192.168.10.1" });
Object.assign(r.dev("PC2").pc, { ip: "192.168.11.10", mask: "255.255.255.0", gw: "192.168.11.1" }); r.mudou();
ok(passos(r, A.s04).every(Boolean), "s04: todos os passos " + passos(r, A.s04));
console.log("s04 ping:", r.pingCompleto(r.dev("PC1"), "192.168.11.10").ok, "| sem gw:", (() => { r.dev("PC2").pc.gw = ""; r.mudou(); const x = r.pingCompleto(r.dev("PC1"), "192.168.11.10"); r.dev("PC2").pc.gw = "192.168.11.1"; r.mudou(); return x.motivo; })());

// s06 VLANs e s07 ROAS
r = Rede.deAtividade(A.s06);
["S1", "S2"].forEach((s) => cli(r, s, ["enable", "conf t", "vlan 10", "name VENDAS", "vlan 20", "name TI", "int fa0/1", "sw mo acc", "sw acc vlan 10", "int fa0/2", "sw mo acc", "sw acc vlan 20", "int g0/1", "sw mo trunk", "end"]));
ok(passos(r, A.s06).every(Boolean), "s06: " + passos(r, A.s06));
r = Rede.deAtividade(A.s07);
ok(!verificar(r, A.s07.passos[4].check), "s07: antes");
cli(r, "S1", ["enable", "conf t", "int g0/2", "sw mo trunk", "end"]);
cli(r, "R1", ["enable", "conf t", "int g0/0/0", "no sh", "int g0/0/0.10", "encapsulation dot1Q 10", "ip address 192.168.10.1 255.255.255.0", "int g0/0/0.20", "encapsulation dot1Q 20", "ip address 192.168.20.1 255.255.255.0", "end"]);
ok(passos(r, A.s07).every(Boolean), "s07: " + passos(r, A.s07));

// s08 DHCP
r = Rede.deAtividade(A.s08);
cli(r, "R1", ["enable", "conf t", "int g0/0/0", "ip add 192.168.1.1 255.255.255.0", "no sh", "exit", "ip dhcp excluded-address 192.168.1.1 192.168.1.9", "ip dhcp pool LAN", "network 192.168.1.0 255.255.255.0", "default-router 192.168.1.1", "end"]);
ok(passos(r, A.s08).every(Boolean), "s08: " + passos(r, A.s08) + " lease " + JSON.stringify(r.dev("PC1").pc.lease));

// s09 estáticas
r = Rede.deAtividade(A.s09);
cli(r, "R1", ["enable", "conf t", "ip route 0.0.0.0 0.0.0.0 10.0.12.2", "end"]);
cli(r, "R3", ["enable", "conf t", "ip route 0.0.0.0 0.0.0.0 10.0.23.1", "end"]);
cli(r, "R2", ["enable", "conf t", "ip route 192.168.1.0 255.255.255.0 10.0.12.1", "end"]);
ok(!verificar(r, A.s09.passos[4].check), "s09: sem rota para LAN3 ainda");
cli(r, "R2", ["enable", "conf t", "ip route 192.168.3.0 255.255.255.0 10.0.23.2", "end"]);
ok(passos(r, A.s09).every(Boolean), "s09: " + passos(r, A.s09));
console.log("tracert:", JSON.stringify(r.ir(r.dev("PC1"), "192.168.3.10").saltos));

// s10 OSPF
r = Rede.deAtividade(A.s10);
cli(r, "R1", ["enable", "conf t", "router ospf 1", "network 192.168.1.0 0.0.0.255 area 0", "network 10.0.12.0 0.0.0.3 area 0", "end"]);
cli(r, "R2", ["enable", "conf t", "router ospf 1", "network 192.168.2.0 0.0.0.255 area 0", "network 10.0.12.0 0.0.0.3 area 0", "network 10.0.23.0 0.0.0.3 area 0", "end"]);
cli(r, "R3", ["enable", "conf t", "router ospf 1", "network 192.168.3.0 0.0.0.255 area 0", "network 10.0.23.0 0.0.0.3 area 0", "end"]);
ok(passos(r, A.s10).every(Boolean), "s10: " + passos(r, A.s10));
console.log(r.dev("R1").eq.executar("show ip route").split("\n").filter((l) => /^O|^C/.test(l)).join("\n"));
console.log(r.dev("R2").eq.executar("show ip ospf neighbor"));

// s11 avaria
r = Rede.deAtividade(A.s11);
ok(!verificar(r, A.s11.passos[3].check), "s11: ping não devia funcionar");
r.dev("PC3").pc.gw = "192.168.3.1"; cli(r, "R2", ["enable", "conf t", "int g0/0/2", "no sh", "exit", "ip route 192.168.1.0 255.255.255.0 10.0.12.1", "end"]);
ok(passos(r, A.s11).every(Boolean), "s11: " + passos(r, A.s11));

// s12 servidor
r = Rede.deAtividade(A.s12);
Object.assign(r.dev("SRV1").pc, { ip: "192.168.1.5", mask: "255.255.255.0" });
Object.assign(r.dev("SRV1").srv.dhcp, { on: true, inicio: "192.168.1.100", mask: "255.255.255.0", gw: "", dns: "192.168.1.5" });
r.dev("SRV1").srv.dns.registos.push({ nome: "www.escola.local", ip: "192.168.1.5" }); r.mudou();
r.devs.filter((d) => d.pc && d.pc.dhcp).forEach((d) => r.pedirDhcp(d));
ok(passos(r, A.s12).every(Boolean), "s12: " + passos(r, A.s12));

// s02 cabos e s03 switch
r = Rede.deAtividade(A.s02);
const L = (a, pa, b, pb, c) => r.ligar(r.dev(a), pa, r.dev(b), pb, c);
L("PC1", "FastEthernet0", "S1", "FastEthernet0/1", "direto"); L("S1", "GigabitEthernet0/1", "S2", "GigabitEthernet0/1", "cruzado"); L("S2", "GigabitEthernet0/2", "R1", "GigabitEthernet0/0/0", "direto");
L("R1", "GigabitEthernet0/0/1", "R2", "GigabitEthernet0/0/1", "cruzado"); L("PC2", "FastEthernet0", "R2", "GigabitEthernet0/0/0", "cruzado"); L("PC1", "RS232", "R1", "Console", "consola");
ok(passos(r, A.s02).every(Boolean), "s02: " + passos(r, A.s02));
const errado = r.ligar(r.dev("S1"), "FastEthernet0/5", r.dev("S2"), "FastEthernet0/5", "direto");
ok(r.estadoLink(errado).estado === "errado", "s02: cabo direto switch-switch devia ficar vermelho");
r = Rede.deAtividade(A.s03);
cli(r, "S1", ["enable", "conf t", "hostname S1", "enable secret Class", "line con 0", "password Cisco", "login", "exit", "int vlan 1", "ip add 192.168.1.2 255.255.255.0", "no sh", "end", "copy run start"]);
Object.assign(r.dev("PC1").pc, { ip: "192.168.1.10", mask: "255.255.255.0" }); r.mudou();
ok(passos(r, A.s03).every(Boolean), "s03: " + passos(r, A.s03));
console.log(r.dev("S1").eq.executar("show ip interface brief").split("\n").slice(0, 3).join("\n"));
// exportar / importar
const r2 = Rede.importar(JSON.parse(JSON.stringify(r.exportar())));
ok(verificar(r2, A.s03.passos[5].check), "importar: ping depois de restaurar");
console.log(falhas ? falhas + " falha(s)" : "Motor do simulador: tudo certo.");
process.exit(falhas ? 1 : 0);
