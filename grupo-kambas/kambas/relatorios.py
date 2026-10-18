"""Relatórios de faturação, vendas e stock por período.

Períodos: diario, semanal (segunda a domingo), mensal, trimestral,
semestral e anual. A interface web tem a mesma lógica em JavaScript
(função `calcularRelatorio` em web/template.html); mantenha as duas iguais.
"""

from datetime import date, datetime, timedelta

from . import db

TIPOS = ["diario", "semanal", "mensal", "trimestral", "semestral", "anual"]
NOMES = {"diario": "Diário", "semanal": "Semanal", "mensal": "Mensal",
         "trimestral": "Trimestral", "semestral": "Semestral", "anual": "Anual"}
MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho",
         "agosto", "setembro", "outubro", "novembro", "dezembro"]
MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]


def _somar_meses(d, n):
    m = d.month - 1 + n
    return date(d.year + m // 12, m % 12 + 1, 1)


def _dm(d):
    return d.strftime("%d/%m")


def periodo(tipo, ref):
    """Devolve (início, fim exclusivo, título) do período que contém `ref`."""
    if tipo not in TIPOS:
        raise db.ErroNegocio("Período inválido.")
    if tipo == "diario":
        ini, fim = ref, ref + timedelta(days=1)
        titulo = ref.strftime("%d/%m/%Y")
    elif tipo == "semanal":
        ini = ref - timedelta(days=ref.weekday())
        fim = ini + timedelta(days=7)
        titulo = f"{_dm(ini)} a {_dm(fim - timedelta(days=1))}/{(fim - timedelta(days=1)).year}"
    elif tipo == "mensal":
        ini = ref.replace(day=1)
        fim = _somar_meses(ini, 1)
        titulo = f"{MESES[ini.month - 1].capitalize()} de {ini.year}"
    elif tipo == "trimestral":
        q = (ref.month - 1) // 3
        ini = date(ref.year, 3 * q + 1, 1)
        fim = _somar_meses(ini, 3)
        titulo = f"{q + 1}.º trimestre de {ini.year}"
    elif tipo == "semestral":
        s = (ref.month - 1) // 6
        ini = date(ref.year, 6 * s + 1, 1)
        fim = _somar_meses(ini, 6)
        titulo = f"{s + 1}.º semestre de {ini.year}"
    else:
        ini, fim = date(ref.year, 1, 1), date(ref.year + 1, 1, 1)
        titulo = str(ref.year)
    return ini, fim, titulo


def _baldes(tipo, ini, fim):
    """Intervalos do gráfico de evolução: horas (diário), dias ou meses."""
    if tipo == "diario":
        return [(f"{h:02d}h", f"{ini.isoformat()}T{h:02d}", f"{ini.isoformat()}T{h + 1:02d}") for h in range(7, 22)]
    if tipo in ("semanal", "mensal"):
        out, d = [], ini
        while d < fim:
            out.append((_dm(d), d.isoformat(), (d + timedelta(days=1)).isoformat()))
            d += timedelta(days=1)
        return out
    out, d = [], ini
    while d < fim:
        nxt = _somar_meses(d, 1)
        out.append((MESES_CURTOS[d.month - 1], d.isoformat(), nxt.isoformat()))
        d = nxt
    return out


def calcular(estado, tipo, ref):
    """Calcula o relatório a partir do estado completo (db.estado)."""
    ini, fim, titulo = periodo(tipo, ref)
    a_ini, a_fim, a_titulo = periodo(tipo, ini - timedelta(days=1))
    si, sf = ini.isoformat(), fim.isoformat()
    produtos = {p["id"]: p for p in estado["produtos"]}
    produtos.update({p["id"]: p for p in estado.get("produtos_inativos", [])})

    def no_periodo(f, a, b):
        return a <= f["data"] < b

    todas = [f for f in estado["faturas"] if no_periodo(f, si, sf)]
    emitidas = [f for f in todas if f["estado"] == "emitida"]
    anuladas = [f for f in todas if f["estado"] == "anulada"]
    anterior = sum(f["total"] for f in estado["faturas"]
                   if f["estado"] == "emitida" and no_periodo(f, a_ini.isoformat(), a_fim.isoformat()))
    faturacao = sum(f["total"] for f in emitidas)

    itens, seccoes, pagamentos, clientes = {}, {}, {}, {}
    v_prod = v_serv = qtd_total = 0
    for f in emitidas:
        pg = pagamentos.setdefault(f["forma_pagamento"], {"forma": f["forma_pagamento"], "n": 0, "valor": 0})
        pg["n"] += 1
        pg["valor"] += f["total"]
        cl = clientes.setdefault(f["cliente_nome"], {"nome": f["cliente_nome"], "n": 0, "valor": 0})
        cl["n"] += 1
        cl["valor"] += f["total"]
        for it in f["itens"]:
            p = produtos.get(it["produto_id"])
            chave = p["codigo"] if p else it["descricao"]
            linha = itens.setdefault(chave, {
                "codigo": p["codigo"] if p else "", "descricao": p["nome"] if p else it["descricao"],
                "tipo": p["tipo"] if p else "servico", "qtd": 0, "valor": 0})
            linha["qtd"] += it["qtd"]
            linha["valor"] += it["total"]
            sec = p["seccao"] if p else "Outros"
            s = seccoes.setdefault(sec, {"seccao": sec, "qtd": 0, "valor": 0})
            s["qtd"] += it["qtd"]
            s["valor"] += it["total"]
            qtd_total += it["qtd"]
            if p and p["tipo"] == "produto":
                v_prod += it["total"]
            else:
                v_serv += it["total"]

    evolucao = []
    for rot, a, b in _baldes(tipo, ini, fim):
        fs = [f for f in emitidas if a <= f["data"] < b]
        evolucao.append({"rotulo": rot, "valor": sum(f["total"] for f in fs), "n": len(fs)})

    # stock: situação no início e no fim do período, e movimentos pelo meio
    movs = sorted(estado["movimentos"], key=lambda m: (m["data"], m["id"]))
    stock = []
    for p in estado["produtos"]:
        if p["tipo"] != "produto":
            continue
        inicial = final = 0
        entradas = saidas = 0
        teve = False
        for m in movs:
            if m["produto_id"] != p["id"]:
                continue
            if m["data"] < si:
                inicial = final = m["stock_final"]
            elif m["data"] < sf:
                teve = True
                final = m["stock_final"]
                if m["tipo"] == "entrada":
                    entradas += m["qtd"]
                elif m["tipo"] == "saida":
                    saidas += m["qtd"]
        if not teve and inicial == 0:
            continue
        stock.append({"codigo": p["codigo"], "nome": p["nome"], "inicial": inicial, "entradas": entradas,
                      "saidas": saidas, "ajustes": final - inicial - entradas + saidas, "final": final,
                      "stock_min": p["stock_min"], "preco": p["preco"], "valor_final": final * p["preco"]})
    stock.sort(key=lambda s: (-s["saidas"], s["codigo"]))

    return {
        "tipo": tipo, "nome": NOMES[tipo], "titulo": titulo,
        "inicio": si, "fim": (fim - timedelta(days=1)).isoformat(),
        "anterior_titulo": a_titulo,
        "gerado_em": datetime.now().isoformat(timespec="minutes"),
        "resumo": {
            "faturacao": faturacao, "n_faturas": len(emitidas),
            "media": round(faturacao / len(emitidas)) if emitidas else 0,
            "subtotal": sum(f["subtotal"] for f in emitidas),
            "descontos": sum(f["desconto"] for f in emitidas),
            "anuladas_n": len(anuladas), "anuladas_valor": sum(f["total"] for f in anuladas),
            "itens_qtd": qtd_total, "produtos_valor": v_prod, "servicos_valor": v_serv,
            "anterior": anterior,
            "variacao": round((faturacao - anterior) / anterior * 100, 1) if anterior else None,
        },
        "evolucao": evolucao,
        "pagamentos": sorted(pagamentos.values(), key=lambda x: -x["valor"]),
        "seccoes": sorted(seccoes.values(), key=lambda x: -x["valor"]),
        "itens": sorted(itens.values(), key=lambda x: (-x["valor"], x["descricao"])),
        "clientes": sorted(clientes.values(), key=lambda x: -x["valor"])[:10],
        "stock": stock,
        "stock_resumo": {
            "valor": sum(s["valor_final"] for s in stock),
            "unidades": sum(s["final"] for s in stock),
            "entradas": sum(s["entradas"] for s in stock),
            "saidas": sum(s["saidas"] for s in stock),
            "alertas": sum(1 for s in stock if s["final"] <= s["stock_min"]),
        },
        "faturas": [{"numero": f["numero"], "data": f["data"], "cliente": f["cliente_nome"],
                     "forma": f["forma_pagamento"], "total": f["total"], "estado": f["estado"]}
                    for f in sorted(todas, key=lambda f: f["numero"])],
    }


def relatorio(con, tipo, ref=None):
    est = db.estado(con, movimentos_todos=True)
    est["produtos_inativos"] = [dict(r) for r in con.execute("SELECT * FROM produtos WHERE ativo = 0")]
    if isinstance(ref, str):
        try:
            ref = date.fromisoformat(ref)
        except ValueError:
            raise db.ErroNegocio("Data inválida.")
    return calcular(est, tipo, ref or date.today())
