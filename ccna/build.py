"""Gera os dados da app a partir do conteúdo em Python.

Uso:
    python build.py            # valida e gera www/js/conteudo.js, os PDFs das aulas e dist/
    python build.py --sem-pdf  # não gera os PDFs (usa os que já existirem em www/pdf)
    python build.py --check    # só valida

Saídas:
    www/js/conteudo.js         dados usados pela app (pasta www)
    dist/ccna-passo-a-passo.html   app inteira num único ficheiro HTML
                               (abre com duplo clique, funciona sem internet)
    www/pdf/                   PDF de cada aula (a cores e para imprimir) e de cada módulo
                               (ver pdf_aulas.py); copiado para dist/pdf/
"""

from __future__ import annotations

import base64
import json
import re
import shutil
import sys
import time
from pathlib import Path

from conteudo import curso
from conteudo.validar import validar
from pdf_aulas import anexar_indice, gerar_pdfs, ler_indice

RAIZ = Path(__file__).parent
WWW = RAIZ / "www"
DIST = RAIZ / "dist"


def estatisticas(c: dict) -> str:
    licoes = sum(len(m["licoes"]) for m in c["modulos"])
    perguntas = sum(len(l["quiz"]) for m in c["modulos"] for l in m["licoes"])
    perguntas += sum(len(m["prova_extra"]) for m in c["modulos"])
    return (f"{len(c['modulos'])} módulos, {licoes} lições, {perguntas} perguntas, "
            f"{len(c['labs'])} laboratórios, {len(c['referencias'])} referências")


def gerar_js(c: dict) -> str:
    dados = json.dumps(c, ensure_ascii=False, separators=(",", ":"))
    return f"/* Gerado por build.py — não editar à mão. */\nwindow.CCNA = {dados};\n"


def ficheiro_unico(js_conteudo: str) -> str:
    """Junta index.html, CSS e JS num único HTML autónomo."""
    html = (WWW / "index.html").read_text(encoding="utf-8")

    def css(m: re.Match) -> str:
        return "<style>\n" + (WWW / m.group(1)).read_text(encoding="utf-8") + "\n</style>"

    def js(m: re.Match) -> str:
        nome = m.group(1)
        codigo = js_conteudo if nome.endswith("conteudo.js") else (WWW / nome).read_text(encoding="utf-8")
        return "<script>\n" + codigo.replace("</script", "<\\/script") + "\n</script>"

    html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', css, html)
    html = re.sub(r'<script src="(js/[^"]+)"></script>', js, html)
    html = re.sub(r'\s*<link rel="manifest"[^>]*>', "", html)
    # imagens da pasta icons/ passam a data URIs (o ficheiro único não tem pasta ao lado)
    tipos = {".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml"}
    for f in (WWW / "icons").iterdir():
        if f.suffix in tipos and f"icons/{f.name}" in html:
            uri = f"data:{tipos[f.suffix]};base64," + base64.b64encode(f.read_bytes()).decode()
            html = html.replace(f"icons/{f.name}", uri)
    return html


def main() -> int:
    c = curso()
    erros = validar(c)
    if erros:
        print("Foram encontrados erros no conteúdo:")
        for e in erros:
            print("  -", e)
        return 1
    print("Conteúdo válido:", estatisticas(c))
    if "--check" in sys.argv:
        return 0

    pdf = WWW / "pdf"
    if "--sem-pdf" in sys.argv:
        indice = ler_indice(pdf)
        print("PDFs não gerados (--sem-pdf)" + ("; uso os que já existem em www/pdf" if indice else ""))
    else:
        t0 = time.time()
        indice = gerar_pdfs(c, pdf)
        tam = sum(f.stat().st_size for f in pdf.rglob("*.pdf"))
        n = sum(1 for _ in pdf.rglob("*.pdf"))
        print(f"Gerado: www/pdf/ ({n} PDFs, {tam / 1e6:.1f} MB, {time.time() - t0:.0f} s)")
    anexar_indice(c, indice)

    js = gerar_js(c)
    (WWW / "js" / "conteudo.js").write_text(js, encoding="utf-8")
    DIST.mkdir(exist_ok=True)
    unico = ficheiro_unico(js)
    (DIST / "ccna-passo-a-passo.html").write_text(unico, encoding="utf-8")
    if indice and pdf.exists():
        # o ficheiro único aponta para pdf/…: a pasta fica ao lado dele
        shutil.rmtree(DIST / "pdf", ignore_errors=True)
        shutil.copytree(pdf, DIST / "pdf")
    print("Gerado: www/js/conteudo.js")
    print("Gerado: dist/ccna-passo-a-passo.html")
    return 0


if __name__ == "__main__":
    sys.exit(main())
