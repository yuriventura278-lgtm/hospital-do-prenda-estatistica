"""Monta a interface web a partir de web/template.html.

Insere o catálogo (kambas/catalogo.py) e os logótipos (static/) no HTML, para
que a página funcione sozinha (modo demonstração) ou servida pelo app.py.

    python construir.py                      # gera index.html
    python construir.py --artifact saida.html  # versão sem <html>/<head> (pré-visualização)
"""

import base64
import json
import os
import sys

from kambas import catalogo

PASTA = os.path.dirname(os.path.abspath(__file__))

CABECALHO = """<!doctype html>
<html lang="pt">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0A3D4C">
<link rel="icon" href="static/logo_azul.png">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}</style>
</head>
<body>
"""


def logo(nome):
    with open(os.path.join(PASTA, "static", nome), "rb") as f:
        return "data:image/png;base64," + base64.b64encode(f.read()).decode()


def montar():
    with open(os.path.join(PASTA, "web", "template.html"), encoding="utf-8") as f:
        html = f.read()
    seed = {
        "empresa": catalogo.EMPRESA,
        "formas": catalogo.FORMAS_PAGAMENTO,
        "seccoes": [n for _, n in catalogo.SECCOES],
        "seccoes_cod": catalogo.SECCOES,
        "produtos": catalogo.PRODUTOS,
        "clientes_exemplo": catalogo.CLIENTES_EXEMPLO,
        "vendas_exemplo": catalogo.VENDAS_EXEMPLO,
    }
    dados = json.dumps(seed, ensure_ascii=False).replace("</", "<\\/")
    return (html.replace("/*__SEED__*/null", dados)
                .replace("__LOGO_AZUL__", logo("logo_azul.png"))
                .replace("__LOGO_BRANCO__", logo("logo_branco.png")))


if __name__ == "__main__":
    corpo = montar()
    if "--artifact" in sys.argv:
        destino = sys.argv[sys.argv.index("--artifact") + 1]
        with open(destino, "w", encoding="utf-8") as f:
            f.write(corpo.replace("<!--KAMBAS_API-->", ""))
    else:
        destino = os.path.join(PASTA, "index.html")
        with open(destino, "w", encoding="utf-8") as f:
            f.write(CABECALHO + corpo + "\n</body>\n</html>\n")
    print("Gerado:", destino)
