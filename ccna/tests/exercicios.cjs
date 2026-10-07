// Testa os geradores de exercícios: sem erros, respostas coerentes e verificadas de forma independente.
const fs = require("fs"), vm = require("vm"), path = require("path");
const ctx = { window: {}, console };
ctx.window.CCNA = { glossario: [], protocolos: [] };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, "../www/js/exercicios.js"), "utf8"), ctx);
const E = ctx.window.Exercicios, U = E.util;
let falhas = 0;
const falha = (m) => { falhas++; if (falhas < 20) console.log("FALHA:", m); };
const ip2 = (s) => s.split(".").map(Number);
for (const id of Object.keys(E.GERADORES)) {
  for (let s = 1; s <= 1500; s++) {
    let ex;
    try { ex = E.gerar([id], s * 7919 + id.length, {}); } catch (e) { falha(id + " " + s + " " + e.stack); break; }
    const txt = JSON.stringify(ex);
    if (/undefined|NaN/.test(txt)) { falha(id + " tem undefined/NaN: " + ex.p); break; }
    if (ex.tipo === "valor" && (!ex.respostas.length || ex.respostas.some((r) => !r))) falha(id + " sem resposta");
    if (ex.tipo === "mc" && (ex.correta < 0 || ex.opcoes.length < 2 || new Set(ex.opcoes).size !== ex.opcoes.length)) falha(id + " opções más: " + ex.p + JSON.stringify(ex.opcoes));
    if (!E.corrigir(ex, ex.tipo === "valor" ? ex.respostas[0] : ex.correta)) falha(id + " a resposta certa não é aceite");
    // verificação independente para sub-redes
    const m = ex.p.match(/<b class="mono">(\d+\.\d+\.\d+\.\d+)\/(\d+)<\/b>\. Qual é/);
    if (m && id.startsWith("sub_") && id !== "sub_n") {
      const ip = ip2(m[1]), p = +m[2], bits = Array.from({ length: 4 }, (_, i) => Math.max(0, Math.min(8, p - 8 * i)));
      const mask = bits.map((b) => 256 - 2 ** (8 - b)), rede = ip.map((o, i) => o & mask[i]), bc = rede.map((o, i) => o | (255 - mask[i]));
      const esperado = { sub_rede: rede.join("."), sub_broadcast: bc.join("."), sub_hosts: String(2 ** (32 - p) - 2),
        sub_primeiro: p < 31 ? [...rede.slice(0, 3), rede[3] + 1].join(".") : null, sub_ultimo: p < 31 ? [...bc.slice(0, 3), bc[3] - 1].join(".") : null }[id];
      if (esperado && ex.respostas[0] !== esperado) falha(`${id} ${m[1]}/${p}: ${ex.respostas[0]} ≠ ${esperado}`);
    }
    if (id === "dec_bin") { const x = +ex.p.match(/<b>(\d+)<\/b>/)[1]; if (parseInt(ex.respostas[0], 2) !== x) falha("dec_bin " + x); }
  }
}
// cadernos determinísticos
for (const c of E.CADERNOS) {
  const a = JSON.stringify(E.doCaderno(c, 5)), b = JSON.stringify(E.doCaderno(c, 5));
  if (a !== b) falha("caderno não determinístico " + c.id);
  const ps = new Set(Array.from({ length: c.total }, (_, i) => E.doCaderno(c, i + 1).p));
  if (ps.size < c.total * 0.9) falha(`caderno ${c.id} com muitas repetidas: ${ps.size}/${c.total}`);
}
if (falhas) { console.log(falhas + " falhas"); process.exit(1); }
console.log("Exercícios: todos os geradores certos.");
