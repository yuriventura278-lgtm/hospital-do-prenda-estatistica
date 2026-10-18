"""Grupo Kambas — sistema de gestão (vendas, faturação e stock).

Executar:
    pip install -r requirements.txt
    python app.py            # abre em http://127.0.0.1:5000

A base de dados fica em `kambas.db` (SQLite), criada na primeira execução
com todo o catálogo. Use `python app.py --sem-exemplos` para começar sem
as vendas de demonstração.
"""

import os
import sys

from flask import Flask, Response, g, jsonify, request, send_from_directory

from kambas import db
from kambas.pdf_fatura import gerar_pdf

PASTA = os.path.dirname(os.path.abspath(__file__))
CAMINHO_DB = os.environ.get("KAMBAS_DB", os.path.join(PASTA, "kambas.db"))

app = Flask(__name__, static_folder=os.path.join(PASTA, "static"))


def con():
    if "con" not in g:
        g.con = db.ligar(CAMINHO_DB)
    return g.con


@app.teardown_appcontext
def fechar(_erro):
    c = g.pop("con", None)
    if c is not None:
        c.close()


@app.errorhandler(db.ErroNegocio)
def erro_negocio(e):
    return jsonify({"erro": str(e)}), 400


def dados():
    return request.get_json(silent=True) or {}


# ---------------------------------------------------------------- páginas

@app.get("/")
def inicio():
    with open(os.path.join(PASTA, "index.html"), encoding="utf-8") as f:
        html = f.read()
    # Diz à interface que há servidor: os dados passam a viver na base SQLite.
    html = html.replace("<!--KAMBAS_API-->", '<script>window.KAMBAS_API = "/api";</script>', 1)
    return Response(html, mimetype="text/html")


@app.get("/static/<path:nome>")
def estaticos(nome):
    return send_from_directory(app.static_folder, nome)


@app.get("/fatura/<int:fid>.pdf")
def fatura_pdf(fid):
    f = db.obter_fatura(con(), fid)
    pdf = gerar_pdf(f, db.obter_config(con())["empresa"])
    return Response(pdf, mimetype="application/pdf", headers={
        "Content-Disposition": f'inline; filename="Fatura_{f["numero"]:04d}_Grupo_Kambas.pdf"'})


# ---------------------------------------------------------------- API

@app.get("/api/estado")
def api_estado():
    return jsonify(db.estado(con()))


@app.post("/api/produtos")
def api_criar_produto():
    return jsonify(db.criar_produto(con(), dados()))


@app.put("/api/produtos/<int:pid>")
def api_atualizar_produto(pid):
    return jsonify(db.atualizar_produto(con(), pid, dados()))


@app.delete("/api/produtos/<int:pid>")
def api_remover_produto(pid):
    db.remover_produto(con(), pid)
    return jsonify({"ok": True})


@app.post("/api/stock")
def api_movimento():
    return jsonify(db.movimento_stock(con(), dados()))


@app.post("/api/clientes")
def api_criar_cliente():
    return jsonify(db.guardar_cliente(con(), dados()))


@app.put("/api/clientes/<int:cid>")
def api_atualizar_cliente(cid):
    return jsonify(db.guardar_cliente(con(), dados(), cid))


@app.delete("/api/clientes/<int:cid>")
def api_remover_cliente(cid):
    db.remover_cliente(con(), cid)
    return jsonify({"ok": True})


@app.post("/api/vendas")
def api_venda():
    return jsonify(db.registar_venda(con(), dados()))


@app.post("/api/faturas/<int:fid>/anular")
def api_anular(fid):
    return jsonify(db.anular_fatura(con(), fid, dados().get("motivo", "")))


@app.put("/api/config")
def api_config():
    return jsonify(db.guardar_config(con(), dados()))


@app.post("/api/exemplos/apagar")
def api_apagar_exemplos():
    db.apagar_exemplos(con())
    return jsonify({"ok": True})


def preparar(exemplos=True):
    c = db.ligar(CAMINHO_DB)
    db.inicializar(c, exemplos=exemplos)
    c.close()


if __name__ == "__main__":
    preparar(exemplos="--sem-exemplos" not in sys.argv)
    print("Grupo Kambas a correr em http://127.0.0.1:5000")
    app.run(host=os.environ.get("KAMBAS_HOST", "127.0.0.1"), port=int(os.environ.get("PORT", 5000)))
