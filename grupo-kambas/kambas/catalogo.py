"""Catálogo oficial do Grupo Kambas (Catálogo de Produtos e Serviços, 14 secções).

Fonte única dos dados iniciais: a base de dados SQLite e a página web
(`construir.py`) são preenchidas a partir daqui. Preços em kwanzas (Kz).

modo:  "fixo"      preço normal
       "a_partir"  preço mínimo ("a partir de"), ajustável na venda
       "consulta"  sem preço fixo ("por consulta"), definido na venda
tipo:  "produto"   tem stock
       "servico"   não tem stock
tier:  (quantidade mínima, preço) para descontos por quantidade
"""

EMPRESA = {
    "nome": "Grupo Kambas",
    "slogan": "Crescendo juntos sempre!",
    "actividade": "Gráfica · Comunicação Visual · Brindes",
    "telefones": "951 332 741 · 949 512 673",
    "email": "grupokambas.info@gmail.com",
    "facebook": "Grupo Kambas",
    "tiktok": "grupo.kambas",
    "nif": "",
    "endereco": "",
    "titular": "Yuri Matias Alexandre Ventura",
    "contas": [
        {"banco": "BFA", "iban": "0006 0000 9197 3825 3016 7"},
        {"banco": "BAI", "iban": "0040 0000 7196 5393 1010 9"},
        {"banco": "Banco Atlântico", "iban": "0055 0000 7407 7083 1012 1"},
        {"banco": "Cartão Visa RedotPay (ID)", "iban": "1166390712"},
    ],
}

FORMAS_PAGAMENTO = ["Transferência bancária", "Numerário", "TPA / Multicaixa", "Visa RedotPay"]

SECCOES = [
    ("VB", "Vestuário & Brindes"),
    ("BV", "Bordados — Vestuário"),
    ("BC", "Bordados — Coletes & Emblemas"),
    ("GC", "Garrafas & Carteiras"),
    ("CI", "Carimbos & Identificação"),
    ("CV", "Comunicação Visual & Impressão"),
    ("PA", "Papéis — Formato A4"),
    ("QD", "Quadros Digitais Personalizados"),
    ("FP", "Foto Polaroid"),
    ("SC", "Sacolas Personalizadas"),
    ("DS", "Design & Serviços Digitais"),
    ("IC", "Importação, Câmbio & Formações"),
    ("TP", "Tráfego Pago"),
    ("EL", "Electrodomésticos"),
    ("CS", "CCTV & Segurança"),
    ("MP", "Material de Papelaria"),
]

P, S = "produto", "servico"

# (secção, nome, descrição, preço, modo, tipo, tier, stock inicial, stock mínimo)
_ITENS = [
    # 01 Vestuário & Brindes
    ("VB", "T-shirt BUK Max", "", 3799, "fixo", P, None, 40, 10),
    ("VB", "T-shirt BUK Nova", "", 2999, "fixo", P, None, 55, 10),
    ("VB", "T-shirt BUK Max Walk original", "", 6599, "fixo", P, None, 18, 5),
    ("VB", "Lacoste (polo)", "", 6999, "fixo", P, None, 24, 6),
    ("VB", "Boné personalizado", "", 2999, "fixo", P, None, 30, 8),
    ("VB", "Chaves personalizadas", "", 3999, "fixo", P, None, 6, 10),
    ("VB", "Esferográfica personalizada", "", 2999, "fixo", P, None, 120, 30),
    ("VB", "Colete multiuso sem refletor", "", 12999, "fixo", P, None, 9, 4),
    ("VB", "Colete multibolso com refletor", "", 13999, "fixo", P, None, 3, 4),
    # 02 Bordados — Vestuário
    ("BV", "T-shirt BUK Max original bordada", "Bordado, com o nosso material", 9999, "fixo", S, None, 0, 0),
    ("BV", "T-shirt bordada", "Com material do cliente", 5999, "fixo", S, None, 0, 0),
    ("BV", "Batas bordadas", "Com material do cliente", 5999, "fixo", S, None, 0, 0),
    ("BV", "Camisola bordada", "Valor conforme o modelo", 0, "consulta", S, None, 0, 0),
    ("BV", "Lacoste (polo) bordada", "Mais de 10 unidades: 10.999 Kz", 11999, "fixo", S, (11, 10999), 0, 0),
    ("BV", "Boné / chapéu bordado", "Mais de 10 unidades: 6.999 Kz", 8999, "fixo", S, (11, 6999), 0, 0),
    # 03 Bordados — Coletes & Emblemas
    ("BC", "Colete multibolso com refletor bordado", "Bordado, com o nosso material", 29999, "fixo", S, None, 0, 0),
    ("BC", "Colete multibolso com refletor bordado (cliente)", "Bordado, com material do cliente", 10999, "fixo", S, None, 0, 0),
    ("BC", "Colete sem refletor bordado", "Bordado, com o nosso material", 27999, "fixo", S, None, 0, 0),
    ("BC", "Colete sem refletor bordado (cliente)", "Bordado, com material do cliente", 9999, "fixo", S, None, 0, 0),
    ("BC", "Emblemas já criados", "Aplicáveis a qualquer peça de vestuário", 3999, "fixo", P, None, 35, 10),
    ("BC", "Criação de emblema", "", 5999, "fixo", S, None, 0, 0),
    # 04 Garrafas & Carteiras
    ("GC", "Garrafa térmica personalizada", "Com o nosso material", 8999, "fixo", P, None, 14, 5),
    ("GC", "Garrafa térmica personalizada (cliente)", "Com material do cliente", 3999, "fixo", S, None, 0, 0),
    ("GC", "Carteira personalizada", "Com o nosso material", 5999, "fixo", P, None, 11, 5),
    ("GC", "Carteira personalizada (cliente)", "Com material do cliente", 3999, "fixo", S, None, 0, 0),
    # 05 Carimbos & Identificação
    ("CI", "Carimbo de bolso", "", 13999, "fixo", P, None, 8, 3),
    ("CI", "Carimbo automático", "Vários tamanhos disponíveis", 10299, "a_partir", P, None, 12, 4),
    ("CI", "Borracha para carimbo", "Substituição de placa", 5999, "fixo", P, None, 20, 5),
    ("CI", "Pass PVC", "Cartão de identificação", 1999, "fixo", P, None, 150, 40),
    ("CI", "Crachá personalizado a laser", "Mais de 1 unidade: 4.599 Kz", 5999, "fixo", P, (2, 4599), 25, 8),
    ("CI", "Abertura de conta VISA", "", 19999, "fixo", S, None, 0, 0),
    # 06 Comunicação Visual & Impressão
    ("CV", "Roll up 200 × 80 cm", "", 26999, "fixo", S, None, 0, 0),
    ("CV", "Banners publicitários", "Impressão conforme a medida", 299, "a_partir", S, None, 0, 0),
    ("CV", "Lona 1 × 1 m", "", 4999, "fixo", S, None, 0, 0),
    ("CV", "Vinil 1 × 1 m", "", 4999, "fixo", S, None, 0, 0),
    ("CV", "Impressão de capa dura", "", 6999, "fixo", S, None, 0, 0),
    ("CV", "Cartão de visita — 50 un.", "", 6999, "fixo", S, None, 0, 0),
    ("CV", "Cartão de visita — 100 un.", "", 10999, "fixo", S, None, 0, 0),
    ("CV", "Agendas personalizadas", "", 5999, "fixo", P, None, 16, 5),
    # 07 Papéis — Formato A4 (preço por folha)
    ("PA", "Cartolina dura A4", "Por folha", 599, "fixo", P, None, 300, 50),
    ("PA", "Cartolina normal A4", "Por folha", 499, "fixo", P, None, 420, 50),
    ("PA", "Papel couché A4", "Por folha", 499, "fixo", P, None, 38, 50),
    ("PA", "Papel colante A4", "Por folha", 1999, "fixo", P, None, 90, 20),
    # 08 Quadros Digitais Personalizados
    ("QD", "Quadro A6", "Entrega em 24 horas", 2999, "fixo", S, None, 0, 0),
    ("QD", "Quadro A5", "Entrega em 24 horas", 4999, "fixo", S, None, 0, 0),
    ("QD", "Quadro A4", "Entrega em 24 horas", 5999, "fixo", S, None, 0, 0),
    ("QD", "Quadro A3", "Entrega em 24 horas", 8999, "fixo", S, None, 0, 0),
    ("QD", "Quadro A2", "Entrega em 24 horas", 15999, "fixo", S, None, 0, 0),
    ("QD", "Quadro A1", "Entrega em 24 horas", 25999, "fixo", S, None, 0, 0),
    ("QD", "Quadro A0", "Entrega em 24 horas", 59999, "fixo", S, None, 0, 0),
    # 09 Foto Polaroid
    ("FP", "Foto Polaroid — 5 fotos", "Conjunto completo", 1299, "fixo", S, None, 0, 0),
    ("FP", "Foto Polaroid — 10 fotos", "Conjunto completo", 1999, "fixo", S, None, 0, 0),
    ("FP", "Foto Polaroid — 15 fotos", "Conjunto completo", 2999, "fixo", S, None, 0, 0),
    ("FP", "Foto Polaroid — 20 fotos", "Conjunto completo", 4999, "fixo", S, None, 0, 0),
    ("FP", "Foto Polaroid — 30 fotos", "Conjunto completo", 5999, "fixo", S, None, 0, 0),
    ("FP", "Foto Polaroid — 40 fotos", "Conjunto completo", 6999, "fixo", S, None, 0, 0),
    ("FP", "Foto Polaroid — 50 fotos", "Conjunto completo", 9999, "fixo", S, None, 0, 0),
    # 10 Sacolas Personalizadas (preço total da quantidade, com o logótipo do cliente)
    ("SC", "Sacola A5 — 100 un.", "Com o seu logótipo", 17999, "fixo", S, None, 0, 0),
    ("SC", "Sacola A4 — 100 un.", "Com o seu logótipo", 21999, "fixo", S, None, 0, 0),
    ("SC", "Sacola A3 — 100 un.", "Com o seu logótipo", 27999, "fixo", S, None, 0, 0),
    ("SC", "Sacola A5 — 50 un.", "Com o seu logótipo", 8999, "fixo", S, None, 0, 0),
    ("SC", "Sacola A4 — 50 un.", "Com o seu logótipo", 10999, "fixo", S, None, 0, 0),
    ("SC", "Sacola A3 — 50 un.", "Com o seu logótipo", 13999, "fixo", S, None, 0, 0),
    # 11 Design & Serviços Digitais
    ("DS", "Criação de flyer", "", 4999, "fixo", S, None, 0, 0),
    ("DS", "Criação de logótipo", "", 4999, "a_partir", S, None, 0, 0),
    ("DS", "Identidade visual", "Manual de marca completo", 10999, "fixo", S, None, 0, 0),
    ("DS", "Criação de website", "", 39999, "a_partir", S, None, 0, 0),
    ("DS", "Sistema de faturação", "Para estabelecimentos comerciais", 39999, "a_partir", S, None, 0, 0),
    ("DS", "Sistema de gestão de stock", "Para empresas", 40999, "a_partir", S, None, 0, 0),
    # 12 Importação, Câmbio & Formações
    ("IC", "Importação de produtos", "China e Estados Unidos", 0, "consulta", S, None, 0, 0),
    ("IC", "Venda de dólares", "De acordo com o câmbio do dia", 0, "consulta", S, None, 0, 0),
    ("IC", "Formação de abertura de conta VISA", "", 29999, "fixo", S, None, 0, 0),
    ("IC", "Formação para importação", "", 29999, "fixo", S, None, 0, 0),
    # 13 Tráfego Pago
    ("TP", "Tráfego pago — 1 dia", "Campanha nas redes sociais", 2999, "fixo", S, None, 0, 0),
    ("TP", "Tráfego pago — 3 dias", "Campanha nas redes sociais", 7999, "fixo", S, None, 0, 0),
    ("TP", "Tráfego pago — 4 dias", "Campanha nas redes sociais", 9999, "fixo", S, None, 0, 0),
    ("TP", "Tráfego pago — 5 dias", "Campanha nas redes sociais", 11999, "fixo", S, None, 0, 0),
    ("TP", "Tráfego pago — 1 semana", "Campanha nas redes sociais", 15999, "fixo", S, None, 0, 0),
    ("TP", "Tráfego pago — 1 mês", "Campanha nas redes sociais", 40999, "fixo", S, None, 0, 0),
]


def _construir_produtos():
    nomes_seccao = dict(SECCOES)
    contador = {}
    produtos = []
    for sec, nome, desc, preco, modo, tipo, tier, stock, stock_min in _ITENS:
        contador[sec] = contador.get(sec, 0) + 1
        produtos.append({
            "codigo": f"{sec}{contador[sec]:02d}",
            "nome": nome,
            "descricao": desc,
            "seccao": nomes_seccao[sec],
            "tipo": tipo,
            "preco": preco,
            "modo": modo,
            "tier_qtd": tier[0] if tier else None,
            "tier_preco": tier[1] if tier else None,
            "stock": stock if tipo == P else 0,
            "stock_min": stock_min if tipo == P else 0,
        })
    return produtos


PRODUTOS = _construir_produtos()

# Dados de demonstração (marcados como exemplo; podem ser apagados em Definições).
CLIENTES_EXEMPLO = [
    {"nome": "Ana Domingos", "nif": "005847120LA041", "endereco": "Luanda, Talatona", "telefone": "923 000 111"},
    {"nome": "Carlos Manuel", "nif": "", "endereco": "Luanda, Viana", "telefone": "912 000 222"},
    {"nome": "Loja Sol Nascente", "nif": "5417000123", "endereco": "Luanda, Maianga", "telefone": "934 000 333"},
]

# dias atrás, índice do cliente (None = consumidor final), [(código, qtd, preço opcional)], forma, desconto
VENDAS_EXEMPLO = [
    (6, 0, [("VB01", 5, None), ("BV05", 5, None)], "Transferência bancária", 0),
    (5, None, [("FP02", 1, None), ("QD03", 2, None)], "Numerário", 0),
    (4, 2, [("CV07", 1, None), ("DS01", 1, None), ("SC04", 1, None)], "TPA / Multicaixa", 1000),
    (3, 1, [("CI04", 10, None), ("CI05", 10, 4599)], "Numerário", 0),
    (2, None, [("TP05", 1, None)], "Visa RedotPay", 0),
    (1, 0, [("GC01", 2, None), ("VB07", 12, None)], "Transferência bancária", 2000),
    (0, 2, [("PA01", 50, None), ("PA03", 20, None), ("CV02", 1, 18000)], "Numerário", 0),
]
