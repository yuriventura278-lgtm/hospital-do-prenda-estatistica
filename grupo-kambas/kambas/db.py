"""Base de dados SQLite do sistema Grupo Kambas e regras de negócio."""

import json
import sqlite3
from datetime import date, datetime, timedelta

from . import catalogo

ESQUEMA = """
CREATE TABLE IF NOT EXISTS config (
    chave TEXT PRIMARY KEY,
    valor TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT NOT NULL DEFAULT '',
    seccao TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('produto', 'servico')),
    preco INTEGER NOT NULL DEFAULT 0,
    modo TEXT NOT NULL DEFAULT 'fixo' CHECK (modo IN ('fixo', 'a_partir', 'consulta')),
    tier_qtd INTEGER,
    tier_preco INTEGER,
    stock INTEGER NOT NULL DEFAULT 0,
    stock_min INTEGER NOT NULL DEFAULT 0,
    ativo INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    nif TEXT NOT NULL DEFAULT '',
    endereco TEXT NOT NULL DEFAULT '',
    telefone TEXT NOT NULL DEFAULT '',
    exemplo INTEGER NOT NULL DEFAULT 0,
    ativo INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS faturas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero INTEGER UNIQUE NOT NULL,
    data TEXT NOT NULL,
    cliente_id INTEGER REFERENCES clientes(id),
    cliente_nome TEXT NOT NULL DEFAULT '',
    cliente_nif TEXT NOT NULL DEFAULT '',
    cliente_endereco TEXT NOT NULL DEFAULT '',
    cliente_telefone TEXT NOT NULL DEFAULT '',
    forma_pagamento TEXT NOT NULL,
    subtotal INTEGER NOT NULL,
    desconto INTEGER NOT NULL DEFAULT 0,
    total INTEGER NOT NULL,
    observacoes TEXT NOT NULL DEFAULT '',
    estado TEXT NOT NULL DEFAULT 'emitida' CHECK (estado IN ('emitida', 'anulada')),
    exemplo INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS fatura_itens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fatura_id INTEGER NOT NULL REFERENCES faturas(id) ON DELETE CASCADE,
    produto_id INTEGER REFERENCES produtos(id),
    descricao TEXT NOT NULL,
    qtd INTEGER NOT NULL,
    preco_unit INTEGER NOT NULL,
    total INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS movimentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data TEXT NOT NULL,
    produto_id INTEGER NOT NULL REFERENCES produtos(id),
    tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'ajuste')),
    qtd INTEGER NOT NULL,
    stock_final INTEGER NOT NULL,
    motivo TEXT NOT NULL DEFAULT '',
    ref TEXT NOT NULL DEFAULT ''
);
"""


class ErroNegocio(Exception):
    """Erro de validação mostrado ao utilizador."""


def ligar(caminho):
    con = sqlite3.connect(caminho)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys = ON")
    return con


def agora():
    return datetime.now().isoformat(timespec="seconds")


def _linhas(cur):
    return [dict(r) for r in cur.fetchall()]


# ---------------------------------------------------------------- inicialização

def inicializar(con, exemplos=True):
    """Cria as tabelas e, se a base estiver vazia, carrega o catálogo."""
    con.executescript(ESQUEMA)
    if con.execute("SELECT COUNT(*) FROM produtos").fetchone()[0]:
        return
    with con:
        _definir_config(con, {
            "empresa": catalogo.EMPRESA,
            "formas_pagamento": catalogo.FORMAS_PAGAMENTO,
            "seccoes": [nome for _, nome in catalogo.SECCOES],
            "proximo_numero": 1,
        })
        for p in catalogo.PRODUTOS:
            cur = con.execute(
                "INSERT INTO produtos (codigo, nome, descricao, seccao, tipo, preco, modo,"
                " tier_qtd, tier_preco, stock, stock_min) VALUES (?,?,?,?,?,?,?,?,?,0,?)",
                (p["codigo"], p["nome"], p["descricao"], p["seccao"], p["tipo"], p["preco"],
                 p["modo"], p["tier_qtd"], p["tier_preco"], p["stock_min"]))
            if p["tipo"] == "produto" and p["stock"] > 0:
                _mover(con, cur.lastrowid, "entrada", p["stock"], "Stock inicial",
                       data=_dia(7, "08:00"))
    if exemplos:
        carregar_exemplos(con)


def _dia(dias_atras, hora):
    return f"{(date.today() - timedelta(days=dias_atras)).isoformat()}T{hora}:00"


def carregar_exemplos(con):
    codigos = {r["codigo"]: r["id"] for r in con.execute("SELECT id, codigo FROM produtos")}
    ids_clientes = []
    with con:
        for c in catalogo.CLIENTES_EXEMPLO:
            cur = con.execute(
                "INSERT INTO clientes (nome, nif, endereco, telefone, exemplo) VALUES (?,?,?,?,1)",
                (c["nome"], c["nif"], c["endereco"], c["telefone"]))
            ids_clientes.append(cur.lastrowid)
    for n, (dias, ci, itens, forma, desconto) in enumerate(catalogo.VENDAS_EXEMPLO):
        linhas = []
        for codigo, qtd, preco in itens:
            p = obter_produto(con, codigos[codigo])
            linhas.append({"produto_id": p["id"], "descricao": p["nome"], "qtd": qtd,
                           "preco_unit": preco if preco is not None else preco_para(p, qtd)})
        registar_venda(con, {
            "cliente_id": ids_clientes[ci] if ci is not None else None,
            "itens": linhas,
            "forma_pagamento": forma,
            "desconto": desconto,
            "observacoes": "",
        }, data=_dia(dias, f"{10 + n % 7:02d}:{(n * 13) % 60:02d}"), exemplo=True)


def apagar_exemplos(con):
    """Remove faturas e clientes de exemplo, repondo o stock que consumiram."""
    with con:
        for f in _linhas(con.execute("SELECT id, numero FROM faturas WHERE exemplo = 1")):
            con.execute("DELETE FROM movimentos WHERE ref = ?", (_ref(f["numero"]),))
            con.execute("DELETE FROM faturas WHERE id = ?", (f["id"],))
        con.execute("UPDATE faturas SET cliente_id = NULL WHERE cliente_id IN"
                    " (SELECT id FROM clientes WHERE exemplo = 1)")
        con.execute("DELETE FROM clientes WHERE exemplo = 1")
        # recalcula o stock a partir dos movimentos restantes
        for p in _linhas(con.execute("SELECT id FROM produtos WHERE tipo = 'produto'")):
            _recalcular_stock(con, p["id"])
        maior = con.execute("SELECT MAX(numero) FROM faturas").fetchone()[0] or 0
        cfg = obter_config(con)
        cfg["proximo_numero"] = maior + 1
        _definir_config(con, cfg)


def _recalcular_stock(con, produto_id):
    stock = 0
    for m in _linhas(con.execute(
            "SELECT id, tipo, qtd FROM movimentos WHERE produto_id = ? ORDER BY data, id", (produto_id,))):
        stock = m["qtd"] if m["tipo"] == "ajuste" else stock + (m["qtd"] if m["tipo"] == "entrada" else -m["qtd"])
        con.execute("UPDATE movimentos SET stock_final = ? WHERE id = ?", (stock, m["id"]))
    con.execute("UPDATE produtos SET stock = ? WHERE id = ?", (stock, produto_id))


# ---------------------------------------------------------------- configuração

def obter_config(con):
    return {r["chave"]: json.loads(r["valor"]) for r in con.execute("SELECT chave, valor FROM config")}


def _definir_config(con, dados):
    for chave, valor in dados.items():
        con.execute("INSERT OR REPLACE INTO config (chave, valor) VALUES (?, ?)",
                    (chave, json.dumps(valor, ensure_ascii=False)))


def guardar_config(con, dados):
    cfg = obter_config(con)
    if "empresa" in dados:
        cfg["empresa"] = {**cfg["empresa"], **dados["empresa"]}
    if "proximo_numero" in dados:
        n = int(dados["proximo_numero"])
        maior = con.execute("SELECT MAX(numero) FROM faturas").fetchone()[0] or 0
        if n <= maior:
            raise ErroNegocio(f"O próximo número tem de ser maior que {maior:04d} (última fatura emitida).")
        cfg["proximo_numero"] = n
    with con:
        _definir_config(con, cfg)
    return cfg


# ---------------------------------------------------------------- produtos

def preco_para(produto, qtd):
    if produto.get("tier_qtd") and qtd >= produto["tier_qtd"]:
        return produto["tier_preco"]
    return produto["preco"]


def obter_produto(con, pid):
    r = con.execute("SELECT * FROM produtos WHERE id = ?", (pid,)).fetchone()
    if not r:
        raise ErroNegocio("Produto não encontrado.")
    return dict(r)


def _limpar_produto(d):
    nome = (d.get("nome") or "").strip()
    if not nome:
        raise ErroNegocio("Indique o nome do produto ou serviço.")
    tipo = d.get("tipo", "produto")
    if tipo not in ("produto", "servico"):
        raise ErroNegocio("Tipo inválido.")
    modo = d.get("modo", "fixo")
    if modo not in ("fixo", "a_partir", "consulta"):
        raise ErroNegocio("Modo de preço inválido.")
    try:
        preco = int(d.get("preco") or 0)
        stock_min = int(d.get("stock_min") or 0)
        tier_qtd = int(d["tier_qtd"]) if d.get("tier_qtd") else None
        tier_preco = int(d["tier_preco"]) if d.get("tier_preco") else None
    except (TypeError, ValueError):
        raise ErroNegocio("Preços e quantidades têm de ser números inteiros (Kz).")
    if preco < 0 or stock_min < 0:
        raise ErroNegocio("Valores não podem ser negativos.")
    if modo != "consulta" and preco == 0:
        raise ErroNegocio("Indique o preço em Kz (ou escolha 'por consulta').")
    if (tier_qtd is None) != (tier_preco is None):
        raise ErroNegocio("Para preço por quantidade, indique a quantidade mínima e o preço.")
    return {
        "nome": nome,
        "descricao": (d.get("descricao") or "").strip(),
        "seccao": (d.get("seccao") or "Outros").strip(),
        "tipo": tipo, "modo": modo, "preco": preco,
        "tier_qtd": tier_qtd, "tier_preco": tier_preco,
        "stock_min": stock_min if tipo == "produto" else 0,
    }


def _novo_codigo(con, seccao):
    sec = next((c for c, n in catalogo.SECCOES if n == seccao), "GK")
    usados = {r[0] for r in con.execute("SELECT codigo FROM produtos WHERE codigo LIKE ?", (sec + "%",))}
    n = 1
    while f"{sec}{n:02d}" in usados:
        n += 1
    return f"{sec}{n:02d}"


def criar_produto(con, d):
    p = _limpar_produto(d)
    stock_inicial = int(d.get("stock") or 0) if p["tipo"] == "produto" else 0
    if stock_inicial < 0:
        raise ErroNegocio("O stock inicial não pode ser negativo.")
    with con:
        cur = con.execute(
            "INSERT INTO produtos (codigo, nome, descricao, seccao, tipo, preco, modo, tier_qtd,"
            " tier_preco, stock, stock_min) VALUES (?,?,?,?,?,?,?,?,?,0,?)",
            (_novo_codigo(con, p["seccao"]), p["nome"], p["descricao"], p["seccao"], p["tipo"],
             p["preco"], p["modo"], p["tier_qtd"], p["tier_preco"], p["stock_min"]))
        if stock_inicial:
            _mover(con, cur.lastrowid, "entrada", stock_inicial, "Stock inicial")
    return obter_produto(con, cur.lastrowid)


def atualizar_produto(con, pid, d):
    atual = obter_produto(con, pid)
    p = _limpar_produto(d)
    if atual["tipo"] == "produto" and p["tipo"] == "servico" and atual["stock"] > 0:
        raise ErroNegocio("Este produto ainda tem stock. Faça um ajuste para 0 antes de o mudar para serviço.")
    with con:
        con.execute(
            "UPDATE produtos SET nome=?, descricao=?, seccao=?, tipo=?, preco=?, modo=?, tier_qtd=?,"
            " tier_preco=?, stock_min=? WHERE id=?",
            (p["nome"], p["descricao"], p["seccao"], p["tipo"], p["preco"], p["modo"],
             p["tier_qtd"], p["tier_preco"], p["stock_min"], pid))
    return obter_produto(con, pid)


def remover_produto(con, pid):
    obter_produto(con, pid)
    with con:
        con.execute("UPDATE produtos SET ativo = 0 WHERE id = ?", (pid,))


# ---------------------------------------------------------------- stock

def _mover(con, pid, tipo, qtd, motivo, ref="", data=None):
    p = obter_produto(con, pid)
    if tipo == "entrada":
        novo = p["stock"] + qtd
    elif tipo == "saida":
        novo = p["stock"] - qtd
    else:
        novo = qtd
    con.execute("UPDATE produtos SET stock = ? WHERE id = ?", (novo, pid))
    con.execute(
        "INSERT INTO movimentos (data, produto_id, tipo, qtd, stock_final, motivo, ref) VALUES (?,?,?,?,?,?,?)",
        (data or agora(), pid, tipo, qtd, novo, motivo, ref))
    return novo


def movimento_stock(con, d):
    pid = int(d.get("produto_id") or 0)
    p = obter_produto(con, pid)
    if p["tipo"] != "produto":
        raise ErroNegocio("Serviços não têm stock.")
    tipo = d.get("tipo")
    if tipo not in ("entrada", "saida", "ajuste"):
        raise ErroNegocio("Escolha entrada, saída ou ajuste.")
    try:
        qtd = int(d.get("qtd"))
    except (TypeError, ValueError):
        raise ErroNegocio("Indique uma quantidade válida.")
    if qtd < 0 or (qtd == 0 and tipo != "ajuste"):
        raise ErroNegocio("A quantidade tem de ser maior que zero.")
    if tipo == "saida" and qtd > p["stock"]:
        raise ErroNegocio(f"Só há {p['stock']} em stock de {p['nome']}.")
    motivo = (d.get("motivo") or "").strip() or {
        "entrada": "Compra / reposição", "saida": "Saída manual", "ajuste": "Contagem de stock"}[tipo]
    with con:
        _mover(con, pid, tipo, qtd, motivo)
    return obter_produto(con, pid)


# ---------------------------------------------------------------- clientes

def guardar_cliente(con, d, cid=None):
    nome = (d.get("nome") or "").strip()
    if not nome:
        raise ErroNegocio("Indique o nome do cliente.")
    campos = (nome, (d.get("nif") or "").strip(), (d.get("endereco") or "").strip(),
              (d.get("telefone") or "").strip())
    with con:
        if cid:
            con.execute("UPDATE clientes SET nome=?, nif=?, endereco=?, telefone=? WHERE id=?", campos + (cid,))
        else:
            cid = con.execute(
                "INSERT INTO clientes (nome, nif, endereco, telefone) VALUES (?,?,?,?)", campos).lastrowid
    return dict(con.execute("SELECT * FROM clientes WHERE id = ?", (cid,)).fetchone())


def remover_cliente(con, cid):
    with con:
        con.execute("UPDATE clientes SET ativo = 0 WHERE id = ?", (cid,))


# ---------------------------------------------------------------- vendas e faturas

def _ref(numero):
    return f"Fatura {numero:04d}"


def registar_venda(con, d, data=None, exemplo=False):
    """Emite uma fatura e dá saída do stock dos produtos vendidos."""
    itens = d.get("itens") or []
    if not itens:
        raise ErroNegocio("Adicione pelo menos um produto ou serviço.")
    cfg = obter_config(con)
    forma = d.get("forma_pagamento")
    if forma not in cfg["formas_pagamento"]:
        raise ErroNegocio("Escolha a forma de pagamento.")

    linhas, precisa = [], {}
    for it in itens:
        p = obter_produto(con, int(it.get("produto_id") or 0)) if it.get("produto_id") else None
        try:
            qtd, preco = int(it.get("qtd")), int(it.get("preco_unit"))
        except (TypeError, ValueError):
            raise ErroNegocio("Quantidade e preço têm de ser números inteiros.")
        descricao = (it.get("descricao") or (p["nome"] if p else "")).strip()
        if qtd <= 0:
            raise ErroNegocio(f"Quantidade inválida em '{descricao}'.")
        if preco <= 0:
            raise ErroNegocio(f"Indique o preço de '{descricao}'.")
        if p and p["modo"] == "a_partir" and preco < p["preco"]:
            raise ErroNegocio(f"'{p['nome']}' custa a partir de {p['preco']} Kz.")
        if p and p["tipo"] == "produto":
            precisa[p["id"]] = precisa.get(p["id"], 0) + qtd
        linhas.append({"produto_id": p["id"] if p else None, "descricao": descricao,
                       "qtd": qtd, "preco_unit": preco, "total": qtd * preco})
    for pid, qtd in precisa.items():
        p = obter_produto(con, pid)
        if qtd > p["stock"]:
            raise ErroNegocio(f"Stock insuficiente de {p['nome']}: pediu {qtd}, há {p['stock']}.")

    subtotal = sum(l["total"] for l in linhas)
    try:
        desconto = int(d.get("desconto") or 0)
    except (TypeError, ValueError):
        raise ErroNegocio("Desconto inválido.")
    if desconto < 0 or desconto > subtotal:
        raise ErroNegocio("O desconto tem de estar entre 0 e o subtotal.")

    cliente = {"nome": "Consumidor final", "nif": "", "endereco": "", "telefone": ""}
    cid = d.get("cliente_id")
    if cid:
        r = con.execute("SELECT * FROM clientes WHERE id = ?", (cid,)).fetchone()
        if not r:
            raise ErroNegocio("Cliente não encontrado.")
        cliente = dict(r)
    elif d.get("cliente_nome"):
        cliente = {"nome": d["cliente_nome"].strip(), "nif": (d.get("cliente_nif") or "").strip(),
                   "endereco": "", "telefone": (d.get("cliente_telefone") or "").strip()}

    with con:
        numero = max(cfg["proximo_numero"],
                     (con.execute("SELECT MAX(numero) FROM faturas").fetchone()[0] or 0) + 1)
        fid = con.execute(
            "INSERT INTO faturas (numero, data, cliente_id, cliente_nome, cliente_nif, cliente_endereco,"
            " cliente_telefone, forma_pagamento, subtotal, desconto, total, observacoes, exemplo)"
            " VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (numero, data or agora(), cid or None, cliente["nome"], cliente["nif"], cliente["endereco"],
             cliente["telefone"], forma, subtotal, desconto, subtotal - desconto,
             (d.get("observacoes") or "").strip(), 1 if exemplo else 0)).lastrowid
        for l in linhas:
            con.execute(
                "INSERT INTO fatura_itens (fatura_id, produto_id, descricao, qtd, preco_unit, total)"
                " VALUES (?,?,?,?,?,?)",
                (fid, l["produto_id"], l["descricao"], l["qtd"], l["preco_unit"], l["total"]))
            if l["produto_id"] in precisa:
                _mover(con, l["produto_id"], "saida", l["qtd"], "Venda", _ref(numero), data=data)
        cfg["proximo_numero"] = numero + 1
        _definir_config(con, {"proximo_numero": cfg["proximo_numero"]})
    return obter_fatura(con, fid)


def _repor_stock(con, fid, motivo):
    numero = con.execute("SELECT numero FROM faturas WHERE id = ?", (fid,)).fetchone()[0]
    for it in _linhas(con.execute(
            "SELECT i.produto_id, i.qtd FROM fatura_itens i JOIN produtos p ON p.id = i.produto_id"
            " WHERE i.fatura_id = ? AND p.tipo = 'produto'", (fid,))):
        _mover(con, it["produto_id"], "entrada", it["qtd"], motivo, _ref(numero))


def anular_fatura(con, fid, motivo=""):
    f = obter_fatura(con, fid)
    if f["estado"] == "anulada":
        raise ErroNegocio("Esta fatura já está anulada.")
    with con:
        _repor_stock(con, fid, "Fatura anulada")
        nota = f"ANULADA: {motivo.strip()}" if motivo.strip() else "ANULADA"
        obs = f"{f['observacoes']}\n{nota}".strip()
        con.execute("UPDATE faturas SET estado = 'anulada', observacoes = ? WHERE id = ?", (obs, fid))
    return obter_fatura(con, fid)


def obter_fatura(con, fid):
    r = con.execute("SELECT * FROM faturas WHERE id = ?", (fid,)).fetchone()
    if not r:
        raise ErroNegocio("Fatura não encontrada.")
    f = dict(r)
    f["itens"] = _linhas(con.execute("SELECT * FROM fatura_itens WHERE fatura_id = ? ORDER BY id", (fid,)))
    return f


# ---------------------------------------------------------------- estado completo

def estado(con):
    """Tudo o que a interface precisa, num único objeto."""
    faturas = _linhas(con.execute("SELECT * FROM faturas ORDER BY numero DESC"))
    itens = {}
    for it in _linhas(con.execute("SELECT * FROM fatura_itens ORDER BY id")):
        itens.setdefault(it["fatura_id"], []).append(it)
    for f in faturas:
        f["itens"] = itens.get(f["id"], [])
    return {
        "config": obter_config(con),
        "produtos": _linhas(con.execute("SELECT * FROM produtos WHERE ativo = 1 ORDER BY codigo")),
        "clientes": _linhas(con.execute("SELECT * FROM clientes WHERE ativo = 1 ORDER BY nome")),
        "faturas": faturas,
        "movimentos": _linhas(con.execute("SELECT * FROM movimentos ORDER BY data DESC, id DESC LIMIT 500")),
    }
