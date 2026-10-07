"""Gera os dados da app a partir do conteúdo em Python.

Uso:
    python build.py            # valida e gera www/js/conteudo.js e dist/
    python build.py --check    # só valida

Saídas:
    www/js/conteudo.js         dados usados pela app (pasta www)
    dist/ccna-passo-a-passo.html   app inteira num único ficheiro HTML
                               (abre com duplo clique, funciona sem internet)
"""

from __future__ import annotations

import base64
import json
import re
import sys
from pathlib import Path

from conteudo import curso
from conteudo.validar import validar

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
    icone = base64.b64encode((WWW / "icons" / "icon.svg").read_bytes()).decode()
    html = html.replace('href="icons/icon.svg"', f'href="data:image/svg+xml;base64,{icone}"')
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

    js = gerar_js(c)
    (WWW / "js" / "conteudo.js").write_text(js, encoding="utf-8")
    DIST.mkdir(exist_ok=True)
    unico = ficheiro_unico(js)
    (DIST / "ccna-passo-a-passo.html").write_text(unico, encoding="utf-8")
    print("Gerado: www/js/conteudo.js")
    print("Gerado: dist/ccna-passo-a-passo.html")
    return 0


if __name__ == "__main__":
    sys.exit(main())
