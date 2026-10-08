// App de computador (Windows, macOS, Linux) do Curso de Redes de Computadores, feita com Electron.
// A app web (pasta www) é servida pelo protocolo app://curso/ para ter sempre o mesmo endereço:
// assim o progresso (localStorage e IndexedDB) fica guardado entre aberturas.
const { app, BrowserWindow, protocol, net, shell, Menu } = require("electron");
const path = require("path");
const { pathToFileURL } = require("url");

protocol.registerSchemesAsPrivileged([{ scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true, serviceWorkers: true, stream: true } }]);
const WWW = path.join(__dirname, "www");

function janela() {
  const w = new BrowserWindow({
    width: 1280, height: 860, minWidth: 360, minHeight: 560, backgroundColor: "#071233", show: false,
    title: "Curso de Redes de Computadores", icon: path.join(WWW, "icons", "icon-512.png"),
    webPreferences: { contextIsolation: true, sandbox: true },
  });
  Menu.setApplicationMenu(null);
  w.once("ready-to-show", () => w.show());
  // links externos (referências, documentação Cisco) abrem no navegador do sistema
  w.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: "deny" }; });
  w.webContents.on("will-navigate", (e, url) => { if (/^https?:/.test(url)) { e.preventDefault(); shell.openExternal(url); } });
  w.loadURL("app://curso/index.html");
}

app.whenReady().then(() => {
  protocol.handle("app", (req) => {
    const u = new URL(req.url);
    let f = path.normalize(path.join(WWW, decodeURIComponent(u.pathname)));
    if (!f.startsWith(WWW)) return new Response("Proibido", { status: 403 });
    if (u.pathname === "/" || u.pathname === "") f = path.join(WWW, "index.html");
    return net.fetch(pathToFileURL(f).toString());
  });
  janela();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) janela(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
