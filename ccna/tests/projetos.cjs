// Resolve cada projeto real sozinho, só com os comandos e ações escritos em conteudo/projetos.py,
// e confirma que cada etapa fica verificada pela ordem (e que nenhuma está feita no início).
const fs = require("fs"), path = require("path"), vm = require("vm");
global.window = globalThis;
for (const f of ["conteudo.js", "ios.js", "simulador.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, "..", "www", "js", f), "utf8"));
const { Rede, verificar, promptPC } = window.Simulador;
let falhas = 0;
const falha = (msg) => { console.log("FALHA:", msg); falhas++; };

function acao(r, a, onde) {
  const d = r.dev(a.nome || a.a);
  if (!d) return falha(`${onde}: equipamento ${a.nome || a.a} não existe`);
  switch (a.t) {
    case "ligar": r.ligar(d, a.pa, r.dev(a.b), a.pb, a.cabo); break;
    case "ip": Object.assign(d.pc, { dhcp: false, ip: a.ip, mask: a.mask, gw: a.gw || "", dns: a.dns || "", lease: null }); break;
    case "dhcp": d.pc.dhcp = true; r.pedirDhcp(d); break;
    case "wifi": Object.assign(d.ap || (d.rw && d.rw.wifi), { ssid: a.ssid, seguranca: a.seg, chave: a.chave }); break;
    case "cliente": d.pc.wifi = { ssid: a.ssid, chave: a.chave }; break;
    case "rw_lan": d.rw.lan = { ip: a.ip, mask: a.mask, dhcp: { on: true, inicio: a.inicio, max: a.max } }; break;
    case "dns": d.srv.dns.registos.push({ nome: a.registo, tipo: "A", ip: a.ip }); break;
    case "srv_dhcp": d.srv.dhcp = { on: true, inicio: a.inicio, mask: a.mask, gw: a.gw, dns: a.dns, max: a.max }; break;
    case "fw": d.pc.fwPartilha = true; break;
    case "prompt": { r.mudou(); const o = promptPC(r, d, a.linha); const txt = (o && (o.txt || o.erro)) || ""; if (/não é reconhecido|inválid|Sintaxe|erro de sistema/i.test(txt)) falha(`${onde}: "${a.linha}" → ${txt.slice(0, 160)}`); break; }
    default: falha(`${onde}: ação desconhecida ${a.t}`);
  }
  r.mudou();
}

for (const p of window.CCNA.projetos) {
  const r = Rede.deAtividade(p.atividade);
  p.atividade.passos.forEach((ps, i) => { if (verificar(r, ps.check)) falha(`${p.id}: a etapa ${i + 1} já está feita no início (${ps.texto})`); });
  p.etapas.forEach((e, i) => {
    const onde = `${p.id} etapa ${i + 1}`;
    for (const b of e.comandos) {
      const d = r.dev(b.em);
      if (!d || !d.eq) { falha(`${onde}: ${b.em} não tem terminal`); continue; }
      for (const ln of b.linhas) {
        if (ln.cmd === "enable" && d.eq.modo !== "user") continue;
        if (/^(copy|show)/.test(ln.cmd) && !["user", "priv"].includes(d.eq.modo)) d.eq.executar("end");
        if (d.eq.modo === "user" && ln.cmd !== "enable") d.eq.executar("enable");
        const out = d.eq.executar(ln.cmd) || "";
        if (/% (Invalid|Incomplete|Ambiguous|Unknown|Unrecognized)|% \(/.test(out)) falha(`${onde}: ${b.em} recusou "${ln.cmd}" (${d.eq.prompt()}): ${out.trim().split("\n").slice(0, 3).join(" | ")}`);
        r.mudou();
      }
    }
    for (const a of e.acoes) acao(r, a, onde);
    r.mudou();
    if (!verificar(r, e.check)) {
      const det = (e.check.lista || [e.check]).filter((c) => !verificar(r, c)).map((c) => JSON.stringify(c)).join("\n    ");
      falha(`${onde} não verificada: ${e.titulo}\n    ${det}`);
    }
  });
  console.log(`${p.id}: ${p.etapas.length} etapas`);
}
console.log(falhas ? `${falhas} falha(s)` : "Todos os projetos resolvidos.");
process.exit(falhas ? 1 : 0);
