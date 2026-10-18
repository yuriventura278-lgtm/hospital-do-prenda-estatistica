"""Gera a fatura em PDF (A5) com o mesmo desenho do bloco de faturas do Grupo Kambas."""

import io
import os
from datetime import datetime

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A5
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

AZUL = HexColor("#0192B8")      # cor do logótipo
PETROLEO = HexColor("#0B6A80")  # barras do bloco
NEVOA = HexColor("#EAF5F8")     # caixas claras
LINHA = HexColor("#BFD6DE")
TINTA = HexColor("#0F2E3A")
CINZA = HexColor("#6B8792")

LOGO = os.path.join(os.path.dirname(__file__), "..", "static", "logo_azul.png")


def kz(valor):
    return f"{int(valor):,}".replace(",", ".") + " Kz"


def _rotulo(c, x, y, texto, cor=AZUL, tam=6.2, espaco=1.1):
    c.saveState()
    c.setFillColor(cor)
    t = c.beginText(x, y)
    t.setFont("Helvetica-Bold", tam)
    t.setCharSpace(espaco)
    t.textOut(texto.upper())
    c.drawText(t)
    c.restoreState()


def _rotulo_direita(c, x, y, texto, cor=AZUL, tam=6.2, espaco=1.1):
    largura = c.stringWidth(texto.upper(), "Helvetica-Bold", tam) + espaco * len(texto)
    _rotulo(c, x - largura, y, texto, cor, tam, espaco)


def _cortar(c, texto, fonte, tam, largura):
    if c.stringWidth(texto, fonte, tam) <= largura:
        return texto
    while texto and c.stringWidth(texto + "…", fonte, tam) > largura:
        texto = texto[:-1]
    return texto + "…"


def gerar_pdf(fatura, empresa):
    buf = io.BytesIO()
    W, H = A5
    c = canvas.Canvas(buf, pagesize=A5)
    c.setTitle(f"Fatura {fatura['numero']:04d} — {empresa['nome']}")
    m = 12 * mm
    direita = W - m

    # cabeçalho: logótipo + contactos
    if os.path.exists(LOGO):
        c.drawImage(LOGO, m, H - 34 * mm, width=27 * mm, height=21 * mm, mask="auto")
    _rotulo(c, m, H - 38.5 * mm, empresa.get("actividade", ""), CINZA, 5.2, 0.6)
    c.setFillColor(TINTA)
    c.setFont("Helvetica", 6.6)
    c.drawString(m, H - 42 * mm, empresa.get("telefones", ""))
    c.drawString(m, H - 45.3 * mm, empresa.get("email", ""))
    if empresa.get("nif"):
        c.drawString(m, H - 48.6 * mm, f"NIF {empresa['nif']}")

    # título FATURA + número + data
    c.saveState()
    t = c.beginText()
    t.setFont("Helvetica-Bold", 17)
    t.setCharSpace(3)
    largura = c.stringWidth("FATURA", "Helvetica-Bold", 17) + 3 * 6
    t.setTextOrigin(direita - largura, H - 20 * mm)
    c.setFillColor(PETROLEO)
    t.textOut("FATURA")
    c.drawText(t)
    c.restoreState()
    c.setStrokeColor(AZUL)
    c.setLineWidth(1.4)
    c.line(direita - 36 * mm, H - 22.5 * mm, direita, H - 22.5 * mm)
    c.setFillColor(TINTA)
    c.setFont("Helvetica-Bold", 10)
    c.drawRightString(direita, H - 29 * mm, f"Nº {fatura['numero']:04d}")
    if fatura.get("estado") == "anulada":
        c.setFillColor(HexColor("#B42318"))
        c.setFont("Helvetica-Bold", 8)
        c.drawRightString(direita, H - 33.5 * mm, "ANULADA")
    _rotulo(c, direita - 52 * mm, H - 37.5 * mm, "Data")
    data = datetime.fromisoformat(fatura["data"])
    c.setFillColor(TINTA)
    c.setFont("Helvetica", 8)
    c.drawString(direita - 52 * mm, H - 42 * mm, data.strftime("%d/%m/%Y  %H:%M"))
    c.setStrokeColor(LINHA)
    c.setLineWidth(0.5)
    c.line(direita - 52 * mm, H - 43.5 * mm, direita, H - 43.5 * mm)

    # caixa do cliente
    y0 = H - 72 * mm
    c.setFillColor(NEVOA)
    c.roundRect(m, y0, W - 2 * m, 21 * mm, 2.5 * mm, stroke=0, fill=1)
    c.setFillColor(AZUL)
    c.rect(m, y0, 1.3 * mm, 21 * mm, stroke=0, fill=1)
    cx = m + 5 * mm
    col2 = direita - 36 * mm
    campos = [
        (cx, y0 + 16.5 * mm, "Cliente", fatura.get("cliente_nome", ""), col2 - cx - 5 * mm),
        (col2, y0 + 16.5 * mm, "NIF", fatura.get("cliente_nif", ""), 32 * mm),
        (cx, y0 + 6.5 * mm, "Endereço", fatura.get("cliente_endereco", ""), col2 - cx - 5 * mm),
        (col2, y0 + 6.5 * mm, "Telefone", fatura.get("cliente_telefone", ""), 32 * mm),
    ]
    for x, y, rot, val, larg in campos:
        _rotulo(c, x, y, rot)
        c.setFillColor(TINTA)
        c.setFont("Helvetica", 8)
        c.drawString(x, y - 4.3 * mm, _cortar(c, val or "", "Helvetica", 8, larg))
        c.setStrokeColor(LINHA)
        c.line(x, y - 5.5 * mm, x + larg, y - 5.5 * mm)

    # tabela de itens
    colunas = [m, m + 13 * mm, direita - 50 * mm, direita - 24 * mm, direita]
    ty = y0 - 7 * mm
    c.setFillColor(PETROLEO)
    c.roundRect(m, ty, W - 2 * m, 7 * mm, 1.5 * mm, stroke=0, fill=1)
    for texto, x, alinh in (("Qtd.", colunas[0] + 3 * mm, "e"), ("Descrição", colunas[1] + 2.5 * mm, "e"),
                            ("Preço unit.", colunas[3] - 2.5 * mm, "d"), ("Total", colunas[4] - 2.5 * mm, "d")):
        (_rotulo if alinh == "e" else _rotulo_direita)(c, x, ty + 2.5 * mm, texto, white, 6, 1)

    itens = fatura["itens"]
    n_linhas = max(8, len(itens))
    alt = 6.6 * mm if n_linhas <= 10 else max(3.9 * mm, 66 * mm / n_linhas)
    topo = ty
    fundo = topo - n_linhas * alt
    c.setStrokeColor(LINHA)
    c.setLineWidth(0.5)
    c.rect(m, fundo, W - 2 * m, topo - fundo, stroke=1, fill=0)
    for x in colunas[1:-1]:
        c.line(x, fundo, x, topo)
    tam = 7.6 if alt >= 6 * mm else 6.4
    for i in range(n_linhas):
        yl = topo - (i + 1) * alt
        if i:
            c.line(m, yl + alt, direita, yl + alt)
        if i < len(itens):
            it = itens[i]
            yt = yl + alt / 2 - tam / 3
            c.setFillColor(TINTA)
            c.setFont("Helvetica", tam)
            c.drawCentredString((colunas[0] + colunas[1]) / 2, yt, str(it["qtd"]))
            c.drawString(colunas[1] + 2.5 * mm, yt,
                         _cortar(c, it["descricao"], "Helvetica", tam, colunas[2] - colunas[1] - 5 * mm))
            c.drawRightString(colunas[3] - 2.5 * mm, yt, kz(it["preco_unit"]))
            c.setFont("Helvetica-Bold", tam)
            c.drawRightString(colunas[4] - 2.5 * mm, yt, kz(it["total"]))

    # forma de pagamento + totais
    by = fundo - 6 * mm
    _rotulo(c, m, by, "Forma de pagamento")
    formas = ["Transferência bancária", "Numerário", "TPA / Multicaixa", "Visa RedotPay"]
    for i, forma in enumerate(formas):
        yy = by - 5 * mm - i * 4.3 * mm
        c.setStrokeColor(CINZA)
        c.setFillColor(white)
        c.rect(m, yy - 0.6 * mm, 3 * mm, 3 * mm, stroke=1, fill=1)
        if forma == fatura.get("forma_pagamento"):
            c.setStrokeColor(PETROLEO)
            c.setLineWidth(1.2)
            c.line(m + 0.6 * mm, yy + 0.9 * mm, m + 1.3 * mm, yy)
            c.line(m + 1.3 * mm, yy, m + 2.6 * mm, yy + 2 * mm)
            c.setLineWidth(0.5)
        c.setFillColor(TINTA)
        c.setFont("Helvetica", 7)
        c.drawString(m + 5 * mm, yy, forma)

    bx = direita - 58 * mm
    c.setFillColor(NEVOA)
    c.roundRect(bx, by - 19 * mm, 58 * mm, 22 * mm, 2 * mm, stroke=0, fill=1)
    for i, (rot, val, forte) in enumerate((("Subtotal", fatura["subtotal"], False),
                                           ("Desconto", fatura["desconto"], False),
                                           ("Total a pagar", fatura["total"], True))):
        yy = by - 2.5 * mm - i * 6.5 * mm
        _rotulo(c, bx + 3.5 * mm, yy, rot, TINTA if forte else CINZA, 7 if forte else 6.2, 1)
        c.setFillColor(TINTA)
        c.setFont("Helvetica-Bold" if forte else "Helvetica", 9.5 if forte else 8)
        c.drawRightString(direita - 3.5 * mm, yy, kz(val))

    # observações
    oy = by - 24 * mm
    _rotulo(c, m, oy, "Observações")
    c.setFillColor(TINTA)
    c.setFont("Helvetica", 7)
    linhas_obs = (fatura.get("observacoes") or "").splitlines()[:2]
    for i in range(2):
        yy = oy - 5 * mm - i * 4.5 * mm
        if i < len(linhas_obs):
            c.drawString(m, yy + 1 * mm, _cortar(c, linhas_obs[i], "Helvetica", 7, W - 2 * m))
        c.setStrokeColor(LINHA)
        c.line(m, yy, direita, yy)

    # assinaturas
    sy = 21 * mm
    c.setStrokeColor(LINHA)
    c.line(m, sy, m + 48 * mm, sy)
    c.line(direita - 48 * mm, sy, direita, sy)
    _rotulo(c, m, sy - 3 * mm, "O vendedor / carimbo", CINZA, 5.4, 0.8)
    _rotulo_direita(c, direita, sy - 3 * mm, "O cliente", CINZA, 5.4, 0.8)

    # rodapé
    c.setFillColor(PETROLEO)
    c.roundRect(m, 8 * mm, W - 2 * m, 7 * mm, 1.5 * mm, stroke=0, fill=1)
    _rotulo(c, m + 4 * mm, 10.5 * mm, empresa.get("slogan", ""), white, 6.4, 1.4)
    conta = (empresa.get("contas") or [{}])[0]
    c.setFillColor(white)
    c.setFont("Helvetica", 6)
    c.drawRightString(direita - 4 * mm, 10.5 * mm, f"{conta.get('banco', '')}  {conta.get('iban', '')}")

    c.showPage()
    c.save()
    return buf.getvalue()
