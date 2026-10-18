"""Relatório em PDF (A4): faturação, vendas por produto/serviço e stock."""

import io
import os
from datetime import datetime

from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.shapes import Drawing, String
from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (KeepTogether, Paragraph, SimpleDocTemplate, Spacer, Table,
                                TableStyle)

from .pdf_fatura import AZUL, CINZA, LINHA, LOGO, NEVOA, PETROLEO, TINTA, kz

VERDE = HexColor("#1E8A5A")
VERMELHO = HexColor("#B42318")
LARANJA = HexColor("#A86400")

E_TXT = ParagraphStyle("txt", fontName="Helvetica", fontSize=8.5, leading=11, textColor=TINTA)
E_PEQ = ParagraphStyle("peq", parent=E_TXT, fontSize=7.5, leading=9.5, textColor=CINZA)
E_ROT = ParagraphStyle("rot", fontName="Helvetica-Bold", fontSize=7, leading=9, textColor=AZUL)
E_SEC = ParagraphStyle("sec", fontName="Helvetica-Bold", fontSize=11.5, leading=14, textColor=PETROLEO,
                       spaceBefore=4, spaceAfter=5)
E_KPI = ParagraphStyle("kpi", fontName="Helvetica-Bold", fontSize=13, leading=16, textColor=TINTA)
E_DIR = ParagraphStyle("dir", parent=E_TXT, alignment=TA_RIGHT)


def _data(iso):
    return datetime.fromisoformat(iso).strftime("%d/%m/%Y")


def _tabela(cab, linhas, larguras, direita=(), total=None):
    dados = [cab] + linhas + ([total] if total else [])
    t = Table(dados, colWidths=larguras, repeatRows=1)
    estilo = [
        ("BACKGROUND", (0, 0), (-1, 0), PETROLEO),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 7),
        ("FONT", (0, 1), (-1, -1), "Helvetica", 8),
        ("TEXTCOLOR", (0, 1), (-1, -1), TINTA),
        ("LINEBELOW", (0, 1), (-1, -1), 0.4, LINHA),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1 if not total else -2), [white, HexColor("#F5FAFC")]),
    ]
    for c in direita:
        estilo.append(("ALIGN", (c, 0), (c, -1), "RIGHT"))
    if total:
        estilo += [("BACKGROUND", (0, -1), (-1, -1), NEVOA), ("FONT", (0, -1), (-1, -1), "Helvetica-Bold", 8.5),
                   ("LINEABOVE", (0, -1), (-1, -1), 0.8, PETROLEO)]
    t.setStyle(TableStyle(estilo))
    return t


def _grafico(evolucao, largura):
    alt = 55 * mm
    d = Drawing(largura, alt)
    ch = VerticalBarChart()
    ch.x, ch.y, ch.width, ch.height = 34, 18, largura - 44, alt - 30
    valores = [e["valor"] for e in evolucao]
    ch.data = [valores]
    ch.categoryAxis.categoryNames = [e["rotulo"] if len(evolucao) <= 16 or i % 3 == 0 else ""
                                     for i, e in enumerate(evolucao)]
    ch.categoryAxis.labels.fontSize = 6.5
    ch.categoryAxis.labels.fillColor = CINZA
    ch.categoryAxis.strokeColor = LINHA
    ch.valueAxis.valueMin = 0
    topo = max(valores + [1])
    ch.valueAxis.valueMax = topo * 1.15
    ch.valueAxis.labels.fontSize = 6.5
    ch.valueAxis.labels.fillColor = CINZA
    ch.valueAxis.labelTextFormat = lambda v: f"{v / 1000:,.0f}k".replace(",", ".") if v >= 1000 else f"{v:.0f}"
    ch.valueAxis.strokeColor = LINHA
    ch.valueAxis.gridStrokeColor = LINHA
    ch.valueAxis.visibleGrid = True
    ch.bars[0].fillColor = AZUL
    ch.bars[0].strokeColor = None
    ch.barSpacing = 1
    d.add(ch)
    if not any(valores):
        d.add(String(largura / 2, alt / 2, "Sem vendas neste período", textAnchor="middle", fontSize=9, fillColor=CINZA))
    return d


def gerar_pdf(rel, empresa):
    buf = io.BytesIO()
    W, H = A4
    m = 15 * mm
    larg = W - 2 * m
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=m, rightMargin=m, topMargin=40 * mm, bottomMargin=18 * mm,
                            title=f"Relatório {rel['nome']} — {rel['titulo']} — {empresa['nome']}")

    def moldura(c, d):
        c.saveState()
        c.setFillColor(PETROLEO)
        c.rect(0, H - 4 * mm, W, 4 * mm, stroke=0, fill=1)
        if os.path.exists(LOGO):
            c.drawImage(LOGO, m, H - 31 * mm, width=28 * mm, height=22 * mm, mask="auto")
        c.setFillColor(PETROLEO)
        c.setFont("Helvetica-Bold", 16)
        c.drawRightString(W - m, H - 16 * mm, f"RELATÓRIO {rel['nome'].upper()}")
        c.setFillColor(TINTA)
        c.setFont("Helvetica-Bold", 10.5)
        c.drawRightString(W - m, H - 22 * mm, rel["titulo"])
        c.setFillColor(CINZA)
        c.setFont("Helvetica", 7.5)
        c.drawRightString(W - m, H - 27 * mm, f"De {_data(rel['inicio'])} a {_data(rel['fim'])}  ·  "
                                              f"Gerado em {datetime.fromisoformat(rel['gerado_em']).strftime('%d/%m/%Y %H:%M')}")
        c.setStrokeColor(AZUL)
        c.setLineWidth(1.2)
        c.line(m, H - 34 * mm, W - m, H - 34 * mm)
        # rodapé
        c.setFillColor(CINZA)
        c.setFont("Helvetica", 7)
        c.drawString(m, 10 * mm, f"{empresa['nome']}  ·  {empresa.get('telefones', '')}  ·  {empresa.get('email', '')}")
        c.drawRightString(W - m, 10 * mm, f"Página {d.page}")
        c.restoreState()

    r = rel["resumo"]
    hist = []
    var = r["variacao"]
    if var is None:
        txt_var = f"Sem vendas em {rel['anterior_titulo']}"
    else:
        cor = "#1E8A5A" if var >= 0 else "#B42318"
        txt_var = f"<font color='{cor}'><b>{'+' if var >= 0 else ''}{var:.1f}%</b></font> face a {rel['anterior_titulo']} ({kz(r['anterior'])})"

    def caixa(rot, val, sub):
        return [Paragraph(rot.upper(), E_ROT), Paragraph(val, E_KPI), Paragraph(sub, E_PEQ)]

    kpis = Table([[
        caixa("Faturação", kz(r["faturacao"]), txt_var),
        caixa("Faturas emitidas", str(r["n_faturas"]), f"Valor médio {kz(r['media'])}"),
        caixa("Itens vendidos", str(r["itens_qtd"]), f"Descontos {kz(r['descontos'])}"),
        caixa("Anuladas", str(r["anuladas_n"]), f"Valor {kz(r['anuladas_valor'])}"),
    ]], colWidths=[larg * .34, larg * .22, larg * .22, larg * .22])
    kpis.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NEVOA), ("BACKGROUND", (0, 0), (0, 0), HexColor("#D5EEF5")),
        ("LINEBEFORE", (1, 0), (-1, 0), 2, white), ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ]))
    hist += [Paragraph("Resumo da faturação", E_SEC), kpis, Spacer(1, 4 * mm)]

    tot = r["produtos_valor"] + r["servicos_valor"] or 1
    hist.append(Paragraph(
        f"Produtos: <b>{kz(r['produtos_valor'])}</b> ({r['produtos_valor'] / tot * 100:.0f}%)  ·  "
        f"Serviços: <b>{kz(r['servicos_valor'])}</b> ({r['servicos_valor'] / tot * 100:.0f}%)  ·  "
        f"Subtotal antes de descontos: {kz(r['subtotal'])}", E_TXT))
    hist += [Spacer(1, 3 * mm), Paragraph("Evolução da faturação", E_SEC), _grafico(rel["evolucao"], larg)]

    # pagamentos e secções lado a lado
    pg = _tabela(["FORMA DE PAGAMENTO", "Nº", "VALOR"],
                 [[p["forma"], p["n"], kz(p["valor"])] for p in rel["pagamentos"]] or [["Sem vendas", "", ""]],
                 [larg * .27, larg * .06, larg * .15], direita=(1, 2))
    sc = _tabela(["SECÇÃO", "QTD.", "VALOR"],
                 [[Paragraph(s["seccao"], E_TXT), s["qtd"], kz(s["valor"])] for s in rel["seccoes"]] or [["Sem vendas", "", ""]],
                 [larg * .29, larg * .07, larg * .14], direita=(1, 2))
    lado = Table([[pg, sc]], colWidths=[larg * .49, larg * .51])
    lado.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0),
                              ("RIGHTPADDING", (0, 0), (-1, -1), 0)]))
    hist += [Spacer(1, 2 * mm), Paragraph("Pagamentos e secções", E_SEC), lado]

    # produtos e serviços vendidos
    fat = r["faturacao"] + r["descontos"] or 1
    linhas = [[it["codigo"], Paragraph(it["descricao"], E_TXT), "Produto" if it["tipo"] == "produto" else "Serviço",
               it["qtd"], kz(it["valor"]), f"{it['valor'] / fat * 100:.1f}%"] for it in rel["itens"]]
    hist += [Paragraph("Vendas por produto e serviço", E_SEC),
             _tabela(["CÓD.", "DESCRIÇÃO", "TIPO", "QTD.", "VALOR", "%"], linhas or [["", "Sem vendas neste período", "", "", "", ""]],
                     [larg * .08, larg * .44, larg * .12, larg * .09, larg * .17, larg * .10], direita=(3, 4, 5),
                     total=["", "Total (antes de descontos)", "", r["itens_qtd"], kz(r["subtotal"]), "100%"] if linhas else None)]

    # stock
    sr = rel["stock_resumo"]
    linhas = []
    for s in rel["stock"]:
        cor = VERMELHO if s["final"] <= 0 else LARANJA if s["final"] <= s["stock_min"] else TINTA
        linhas.append([s["codigo"], Paragraph(s["nome"], E_TXT), s["inicial"], f"+{s['entradas']}" if s["entradas"] else "0",
                       f"−{s['saidas']}" if s["saidas"] else "0", f"{s['ajustes']:+d}" if s["ajustes"] else "0",
                       Paragraph(f"<font color='{cor.hexval().replace('0x', '#')}'><b>{s['final']}</b></font>", E_DIR),
                       kz(s["valor_final"])])
    hist += [Spacer(1, 2 * mm), Paragraph("Stock de produtos", E_SEC),
             Paragraph(f"No fim do período: <b>{sr['unidades']}</b> unidades, valor <b>{kz(sr['valor'])}</b> a preço de venda  ·  "
                       f"Entradas {sr['entradas']}  ·  Saídas {sr['saidas']}  ·  <font color='#A86400'>{sr['alertas']} no mínimo ou abaixo</font>", E_TXT),
             Spacer(1, 2 * mm),
             _tabela(["CÓD.", "PRODUTO", "INÍCIO", "ENTR.", "SAÍDAS", "AJUSTE", "FIM", "VALOR"], linhas or [["", "Sem produtos", "", "", "", "", "", ""]],
                     [larg * .08, larg * .36, larg * .08, larg * .08, larg * .09, larg * .09, larg * .07, larg * .15],
                     direita=(2, 3, 4, 5, 6, 7))]

    # clientes
    if rel["clientes"]:
        hist += [Spacer(1, 2 * mm), KeepTogether([Paragraph("Principais clientes", E_SEC),
                 _tabela(["CLIENTE", "FATURAS", "VALOR"], [[c["nome"], c["n"], kz(c["valor"])] for c in rel["clientes"]],
                         [larg * .6, larg * .15, larg * .25], direita=(1, 2))])]

    # faturas
    linhas = [[f"{f['numero']:04d}", datetime.fromisoformat(f["data"]).strftime("%d/%m/%Y %H:%M"), Paragraph(f["cliente"], E_TXT),
               f["forma"], kz(f["total"]), "Anulada" if f["estado"] == "anulada" else "Emitida"] for f in rel["faturas"]]
    hist += [Spacer(1, 2 * mm), Paragraph("Faturas do período", E_SEC),
             _tabela(["Nº", "DATA", "CLIENTE", "PAGAMENTO", "TOTAL", "ESTADO"], linhas or [["", "", "Nenhuma fatura", "", "", ""]],
                     [larg * .08, larg * .17, larg * .30, larg * .18, larg * .15, larg * .12], direita=(4,),
                     total=["", "", "Faturação (emitidas)", "", kz(r["faturacao"]), ""] if linhas else None)]

    doc.build(hist, onFirstPage=moldura, onLaterPages=moldura)
    return buf.getvalue()
