// Resolve cada laboratório só com os comandos das dicas e confirma que todas as tarefas ficam feitas.
const fs = require("fs"), path = require("path"), vm = require("vm");
global.window = globalThis;
for (const f of ["conteudo.js", "ios.js"]) vm.runInThisContext(fs.readFileSync(path.join(__dirname, "..", "www", "js", f), "utf8"));
let falhas = 0;
for (const lab of window.CCNA.labs) {
  const eq = new window.IOS.Equipamento(lab.dispositivo, lab.hostname);
  const exec = ["user", "priv"];
  for (const t of lab.tarefas) {
    for (let c of t.dica.split("→")) {
      c = c.trim().replace("<senha>", "Senha#2026");
      if (/^(copy|write)/.test(c)) { if (!exec.includes(eq.modo)) eq.executar("end"); }
      else if (eq.modo === "user" && c !== "enable") eq.executar("enable");
      if (eq.modo === "priv" && !/^(enable$|configure|copy|write|end|do |show)/.test(c)) eq.executar("configure terminal");
      if (eq.modo === "user" && c !== "enable") eq.executar("enable");
      const out = eq.executar(c);
      if (/% (Invalid|Incomplete)/.test(out)) { console.log(`${lab.id}: comando recusado "${c}" (${eq.prompt()})\n${out}`); falhas++; }
    }
  }
  if (eq.modo !== "priv" && eq.modo !== "user") { eq.executar("end"); }
  lab.tarefas.forEach((t, i) => { if (!eq.verificar(t.check)) { console.log(`${lab.id}: tarefa ${i + 1} não verificada: ${t.desc}`); falhas++; } });
}
console.log(falhas ? `${falhas} falha(s)` : "Todos os laboratórios resolvidos.");
process.exit(falhas ? 1 : 0);
