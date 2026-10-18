// Grupo Kambas para Windows: janela que abre o mesmo sistema da página web
// (ficheiros em www/, gerados por ../construir.py --apk www).
const { app, BrowserWindow, shell, Menu } = require("electron");
const path = require("path");

function criarJanela() {
  const janela = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 380,
    title: "Grupo Kambas",
    backgroundColor: "#0A3D4C",
    icon: path.join(__dirname, "www", "static", "icone-512.png"),
    webPreferences: { contextIsolation: true, sandbox: true },
  });
  Menu.setApplicationMenu(null);
  // Links externos (WhatsApp, etc.) abrem no navegador do Windows.
  janela.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  janela.webContents.on("will-navigate", (e, url) => {
    if (!url.startsWith("file://")) { e.preventDefault(); shell.openExternal(url); }
  });
  janela.loadFile(path.join(__dirname, "www", "index.html"));
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on("second-instance", () => { const j = BrowserWindow.getAllWindows()[0]; if (j) { if (j.isMinimized()) j.restore(); j.focus(); } });
  app.whenReady().then(criarJanela);
  app.on("window-all-closed", () => app.quit());
}
