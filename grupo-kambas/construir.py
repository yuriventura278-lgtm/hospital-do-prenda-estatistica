"""Monta a interface do Grupo Kambas a partir de web/template.html + web/app.js.

    python construir.py                       # gera index.html (sistema real, ligado ao Supabase)
    python construir.py --demo saida.html     # versão de demonstração (sem servidor, sem <html>/<head>)
    python construir.py --apk pasta/          # ficheiros da APK (index.html + vendor/ + static/)

O catálogo (kambas/catalogo.py) e os logótipos (static/) ficam embutidos na página.
"""

import base64
import json
import os
import shutil
import sys

from kambas import catalogo

PASTA = os.path.dirname(os.path.abspath(__file__))

# Projeto Supabase "Grupo Kambas". A chave anon é pública por natureza:
# o acesso aos dados é controlado pelas regras (RLS) e funções da base de dados.
SUPABASE = {
    "url": "https://dwrggcybmkcjdlgellya.supabase.co",
    "chave": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3cmdnY3libWtjamRsZ2VsbHlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzNTA3NTksImV4cCI6MjEwNzkyNjc1OX0.AYBuHyLGV24MoX5qR2R3MZkSue_ESoFah7SnaUoVrog",
}

CABECALHO = """<!doctype html>
<html lang="pt">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0A3D4C">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Kambas">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="apple-touch-icon" sizes="512x512" href="static/icone-512.png">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="static/icone-192.png">
<link rel="apple-touch-icon" href="static/icone-192.png">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}</style>
</head>
<body>
"""


def logo(nome):
    with open(os.path.join(PASTA, "static", nome), "rb") as f:
        return "data:image/png;base64," + base64.b64encode(f.read()).decode()


def montar(real):
    with open(os.path.join(PASTA, "web", "template.html"), encoding="utf-8") as f:
        html = f.read()
    with open(os.path.join(PASTA, "web", "app.js"), encoding="utf-8") as f:
        js = f.read()
    seed = {
        "empresa": catalogo.EMPRESA,
        "formas": catalogo.FORMAS_PAGAMENTO,
        "seccoes": [n for _, n in catalogo.SECCOES],
        "seccoes_cod": catalogo.SECCOES,
        # a demonstração usa as vendas e o stock de exemplo; o sistema real começa vazio
        "produtos": catalogo.PRODUTOS if not real else [],
        "clientes_exemplo": catalogo.CLIENTES_EXEMPLO if not real else [],
        "vendas_exemplo": catalogo.VENDAS_EXEMPLO if not real else [],
    }
    js = (js.replace("/*__SEED__*/null", json.dumps(seed, ensure_ascii=False).replace("</", "<\\/"))
            .replace('"__LOGO_AZUL__"', json.dumps(logo("logo_azul.png"))))
    ligacao = ""
    if real:
        ligacao = ("<script>window.KAMBAS_SUPABASE = " + json.dumps(SUPABASE) + ";</script>\n"
                   '<script src="vendor/supabase.js"></script>')
    return (html.replace("/*__APP_JS__*/", js)
                .replace("<!--KAMBAS_SUPABASE-->", ligacao)
                .replace("__LOGO_BRANCO__", logo("logo_branco.png")))


def pagina_real():
    return CABECALHO + montar(real=True) + "\n</body>\n</html>\n"


MANIFESTO = {
    "name": "Grupo Kambas",
    "short_name": "Kambas",
    "description": "Vendas, faturação, stock e relatórios do Grupo Kambas",
    "start_url": "./",
    "scope": "./",
    "display": "standalone",
    "background_color": "#0A3D4C",
    "theme_color": "#0A3D4C",
    "lang": "pt",
    "icons": [
        {"src": "static/icone-192.png", "sizes": "192x192", "type": "image/png"},
        {"src": "static/icone-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable"},
    ],
}


SW = """// Gerado por construir.py. Guarda a aplicação no aparelho para abrir sem internet.
const CACHE = "grupo-kambas-__VERSAO__";
const BASE = ["./", "index.html", "instalar.html", "manifest.webmanifest", "vendor/supabase.js",
  "vendor/jspdf.umd.min.js", "vendor/jspdf.plugin.autotable.min.js", "static/icone-192.png",
  "static/icone-512.png", "static/logo_azul.png", "static/logo_branco.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("grupo-kambas-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request, url = new URL(r.url);
  if (r.method !== "GET") return;
  const fontes = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (url.origin !== self.location.origin && !fontes) return;  // dados do Supabase: sempre pela rede
  if (r.mode === "navigate") {  // página: tenta a versão nova, senão a guardada
    e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(CACHE).then(k => k.put("index.html", c)); return res; })
      .catch(() => caches.match(r).then(x => x || caches.match("index.html"))));
    return;
  }
  e.respondWith(caches.match(r).then(x => x || fetch(r).then(res => {
    if (res.ok || res.type === "opaque") { const c = res.clone(); caches.open(CACHE).then(k => k.put(r, c)); }
    return res;
  })));
});
"""


def service_worker(pagina):
    import hashlib
    return SW.replace("__VERSAO__", hashlib.sha1(pagina.encode("utf-8")).hexdigest()[:10])


def escrever(caminho, texto):
    with open(caminho, "w", encoding="utf-8") as f:
        f.write(texto)
    print("Gerado:", caminho)


if __name__ == "__main__":
    args = sys.argv[1:]
    if "--demo" in args:
        escrever(args[args.index("--demo") + 1], montar(real=False))
    elif "--apk" in args:
        destino = args[args.index("--apk") + 1]
        os.makedirs(destino, exist_ok=True)
        escrever(os.path.join(destino, "index.html"), pagina_real())
        for pasta in ("vendor", "static"):
            shutil.copytree(os.path.join(PASTA, pasta), os.path.join(destino, pasta), dirs_exist_ok=True)
        escrever(os.path.join(destino, "manifest.webmanifest"), json.dumps(MANIFESTO, ensure_ascii=False, indent=2))
    else:
        pagina = pagina_real()
        escrever(os.path.join(PASTA, "index.html"), pagina)
        escrever(os.path.join(PASTA, "sw.js"), service_worker(pagina))
        escrever(os.path.join(PASTA, "manifest.webmanifest"), json.dumps(MANIFESTO, ensure_ascii=False, indent=2))
        escrever(os.path.join(PASTA, "demo.html"), "<!doctype html><html lang=\"pt\"><head><meta charset=\"utf-8\">"
                 "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">"
                 "<style>body{margin:0}img{max-width:100%}</style></head><body>\n" + montar(real=False) + "\n</body></html>\n")
