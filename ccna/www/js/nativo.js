/* Ponte para a app instalada (Android/iPhone, feita com Capacitor).
   No navegador este ficheiro não faz nada. Na app instalada, o WebView não sabe "descarregar"
   ficheiros: os links <a download> (PDF das aulas, calendário .ics, projetos, imagens, relatórios)
   passam a gravar o ficheiro no telemóvel e a abrir o menu Partilhar/Abrir com do sistema. */
(function () {
  "use strict";
  const C = window.Capacitor;
  const nativo = !!(C && C.isNativePlatform && C.isNativePlatform());
  window.Nativo = { ativo: nativo, plataforma: nativo ? C.getPlatform() : "web" };
  if (!nativo) return;
  const P = C.Plugins || {};
  const base64 = (blob) => new Promise((ok, falha) => { const fr = new FileReader(); fr.onload = () => ok(String(fr.result).split(",")[1]); fr.onerror = falha; fr.readAsDataURL(blob); });
  async function guardarEPartilhar(href, nome) {
    const blob = await (await fetch(href)).blob();
    const r = await P.Filesystem.writeFile({ path: nome, data: await base64(blob), directory: "CACHE" });
    await P.Share.share({ title: nome, url: r.uri, dialogTitle: "Abrir ou guardar " + nome });
  }
  // Apanha os cliques em links de transferência (também os criados por código e clicados com a.click())
  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest("a[download]");
    if (!a || !P.Filesystem || !P.Share) return;
    e.preventDefault();
    const nome = (a.getAttribute("download") || a.href.split("/").pop() || "ficheiro").replace(/[\\/:*?"<>|]+/g, "_");
    guardarEPartilhar(a.href, nome).catch(() => { if (P.Browser && /^https?:/.test(a.href)) P.Browser.open({ url: a.href }); });
  }, true);
  // Botão "voltar" do Android: volta ao ecrã anterior da app em vez de a fechar
  if (P.App) P.App.addListener("backButton", () => { const b = document.querySelector('[data-acao="voltar"]'); if (b) b.click(); else P.App.minimizeApp(); });
})();
