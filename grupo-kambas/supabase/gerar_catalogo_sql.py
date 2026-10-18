"""Gera supabase/catalogo.sql (configuração + catálogo) a partir de kambas/catalogo.py.

    python supabase/gerar_catalogo_sql.py

O stock começa a 0: faça a contagem inicial no ecrã Stock.
"""

import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from kambas import catalogo  # noqa: E402


def q(v):
    if v is None:
        return "null"
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def j(v):
    return q(json.dumps(v, ensure_ascii=False)) + "::jsonb"


def gerar():
    linhas = ["-- Gerado por gerar_catalogo_sql.py — não editar à mão.",
              "insert into public.config (chave, valor) values"]
    cfg = {
        "empresa": catalogo.EMPRESA,
        "formas_pagamento": catalogo.FORMAS_PAGAMENTO,
        "seccoes": [n for _, n in catalogo.SECCOES],
        "seccoes_cod": [list(s) for s in catalogo.SECCOES],
        "numeracao": {"FR": 1, "FT": 1, "PP": 1},
        "validade_proforma": 15,
    }
    linhas.append(",\n".join(f"  ({q(k)}, {j(v)})" for k, v in cfg.items()))
    linhas.append("on conflict (chave) do nothing;\n")
    linhas.append("insert into public.produtos (codigo, nome, descricao, seccao, tipo, preco, modo, tier_qtd, tier_preco, stock_min) values")
    linhas.append(",\n".join(
        f"  ({q(p['codigo'])}, {q(p['nome'])}, {q(p['descricao'])}, {q(p['seccao'])}, {q(p['tipo'])}, {p['preco']}, "
        f"{q(p['modo'])}, {q(p['tier_qtd'])}, {q(p['tier_preco'])}, {p['stock_min']})" for p in catalogo.PRODUTOS))
    linhas.append("on conflict (codigo) do nothing;")
    return "\n".join(linhas) + "\n"


if __name__ == "__main__":
    destino = os.path.join(os.path.dirname(__file__), "catalogo.sql")
    with open(destino, "w", encoding="utf-8") as f:
        f.write(gerar())
    print("Gerado:", destino)
