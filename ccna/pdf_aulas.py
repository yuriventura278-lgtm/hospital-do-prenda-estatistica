"""PDF de cada aula e de cada módulo (A4), gerados no build com reportlab.

Saídas (pasta www/pdf/):
    <modulo_id>/<licao_id>.pdf             aula a cores
    <modulo_id>.pdf                        módulo inteiro (programa, resumo de comandos, todas as aulas)
    imprimir/<modulo_id>/<licao_id>.pdf    versão para imprimir (preto e branco, letra maior,
                                           mais espaço para responder à mão)
    indice.json                            páginas e caminhos de cada PDF (a app usa-o)

Os números de página do índice e da caixa “Como estudar esta aula” vêm de uma
primeira passagem: o documento é gerado, guardam-se as páginas de cada secção e
gera-se outra vez com os números certos (repete até as páginas estabilizarem).

Os 10 exercícios obrigatórios saem dos mesmos geradores da app
(www/js/exercicios.js, corridos com Node e uma semente fixa por aula). Sem Node,
usam-se exercícios sobre os termos técnicos da aula.

Uso direto:  python pdf_aulas.py [modulo_id ...]
"""

from __future__ import annotations

import json
import re
import shutil
import subprocess
import textwrap
import zlib
from dataclasses import dataclass
from html import escape as _esc
from html.parser import HTMLParser
from io import BytesIO
from pathlib import Path

from reportlab.graphics.shapes import Drawing, Line, Rect, String
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, CondPageBreak, Flowable, Frame, KeepTogether,
                                NextPageTemplate, PageBreak, PageTemplate, Paragraph, Spacer,
                                Table, TableStyle)

RAIZ = Path(__file__).parent
FONTES = RAIZ / "fontes"
JS_EXERCICIOS = RAIZ / "www" / "js" / "exercicios.js"
NOME_CURSO = "Curso de Redes de Computadores"

PAG_L, PAG_A = A4
MARGEM = 18 * mm
TOPO = 20 * mm          # cabeçalho das páginas normais
BASE = 18 * mm          # rodapé
LARGURA = PAG_L - 2 * MARGEM

CORES_CABO = ["#e9761b", "#1f5fe0", "#1c9a57", "#7a4fd6", "#9a6230", "#d43d4f"]


# ------------------------------------------------------------------ fontes
def registar_fontes() -> None:
    if "DejaVu" in pdfmetrics.getRegisteredFontNames():
        return
    for nome, ficheiro in [("DejaVu", "DejaVuSans.ttf"), ("DejaVu-Bold", "DejaVuSans-Bold.ttf"),
                           ("DejaVuMono", "DejaVuSansMono.ttf"), ("DejaVuMono-Bold", "DejaVuSansMono-Bold.ttf")]:
        pdfmetrics.registerFont(TTFont(nome, str(FONTES / ficheiro)))
    # A DejaVu Sans não tem itálico aqui: o itálico usa a letra normal (não se perde texto).
    pdfmetrics.registerFontFamily("DejaVu", normal="DejaVu", bold="DejaVu-Bold", italic="DejaVu", boldItalic="DejaVu-Bold")
    pdfmetrics.registerFontFamily("DejaVuMono", normal="DejaVuMono", bold="DejaVuMono-Bold",
                                  italic="DejaVuMono", boldItalic="DejaVuMono-Bold")


# ------------------------------------------------------------------ tema (cor ou impressão)
@dataclass(frozen=True)
class Tema:
    imprimir: bool
    corpo: float
    linha_resp: float     # distância entre linhas de resposta
    n_linhas: int         # linhas de resposta por exercício de cálculo
    navy: str
    acento: str
    tinta: str
    suave: str
    linha: str
    dica_fundo: str
    dica_borda: str
    ex_fundo: str
    ex_borda: str
    alerta_fundo: str
    alerta_borda: str
    term_fundo: str
    term_texto: str
    term_prompt: str
    term_dim: str
    code: str
    th_fundo: str
    zebra: str


COR = Tema(False, 10, 20, 3, "#0b1630", "#1a56d6", "#0d1925", "#536375", "#d3dbe3",
           "#e6effd", "#1f5fe0", "#e3f4ea", "#1c9a57", "#fdf1dc", "#d68a00",
           "#0b1218", "#d3ecd9", "#7ccfff", "#8aa0b2", "#8a3b12", "#eaf0f7", "#f6f8fa")
IMPRIMIR = Tema(True, 12, 30, 4, "#000000", "#000000", "#000000", "#333333", "#888888",
                "#ffffff", "#000000", "#ffffff", "#000000", "#ffffff", "#000000",
                "#ffffff", "#000000", "#000000", "#444444", "#000000", "#e6e6e6", "#ffffff")


class Estilos:
    def __init__(self, t: Tema):
        c = t.corpo
        base = dict(fontName="DejaVu", textColor=colors.HexColor(t.tinta))
        self.t = t
        self.corpo = ParagraphStyle("corpo", fontSize=c, leading=c * 1.45, spaceAfter=c * 0.5, **base)
        self.li = ParagraphStyle("li", parent=self.corpo, leftIndent=c * 1.6, bulletIndent=c * 0.4, spaceAfter=c * 0.25)
        self.peq = ParagraphStyle("peq", parent=self.corpo, fontSize=c * 0.85, leading=c * 1.2, spaceAfter=c * 0.3,
                                  textColor=colors.HexColor(t.suave))
        self.h1 = ParagraphStyle("h1", fontName="DejaVu-Bold", fontSize=c * 1.3, leading=c * 1.6,
                                 textColor=colors.HexColor(t.navy), spaceBefore=c * 1.2, spaceAfter=c * 0.6)
        self.h3 = ParagraphStyle("h3", fontName="DejaVu-Bold", fontSize=c * 1.12, leading=c * 1.4,
                                 textColor=colors.HexColor(t.tinta), spaceBefore=c * 0.6, spaceAfter=c * 0.4)
        self.rotulo = ParagraphStyle("rotulo", fontName="DejaVu-Bold", fontSize=c * 0.72, leading=c * 0.95,
                                     textColor=colors.HexColor(t.suave), spaceAfter=c * 0.3)
        self.cel = ParagraphStyle("cel", parent=self.corpo, fontSize=c * 0.86, leading=c * 1.18, spaceAfter=0)
        self.cel_cab = ParagraphStyle("celcab", parent=self.cel, fontName="DejaVu-Bold")
        self.mono = ParagraphStyle("mono", fontName="DejaVuMono", fontSize=c * 0.86, leading=c * 1.25,
                                   textColor=colors.HexColor(t.term_texto))
        self.mono_ex = ParagraphStyle("monoex", fontName="DejaVu", fontSize=c * 0.8, leading=c * 1.12,
                                      textColor=colors.HexColor(t.term_dim), leftIndent=c * 1.2, spaceAfter=c * 0.3)
        self.toc = ParagraphStyle("toc", parent=self.corpo, spaceAfter=0, leading=c * 1.3)
        self.toc_n = ParagraphStyle("tocn", parent=self.toc, alignment=TA_RIGHT)
        self.passo = ParagraphStyle("passo", parent=self.corpo, fontSize=c * 0.86, leading=c * 1.2, spaceAfter=0)
        self.num_passo = ParagraphStyle("npasso", fontName="DejaVu-Bold", fontSize=c * 1.7, leading=c * 2,
                                        textColor=colors.HexColor(t.acento), spaceAfter=2)
        self.centro = ParagraphStyle("centro", parent=self.peq, alignment=TA_CENTER)

    def code(self, txt: str) -> str:
        return f'<font face="DejaVuMono" color="{self.t.code}">{txt}</font>'


# ------------------------------------------------------------------ HTML simples → itens
def esc(s) -> str:
    return _esc(str(s if s is not None else ""), quote=False)


class _ConversorHtml(HTMLParser):
    """Converte o pouco HTML usado nas aulas (p, ul/ol/li, b, i, code, sup, pre, table, span.mono)
    em itens: ('p', markup) · ('li', markup, nível, marcador) · ('pre', texto) ·
    ('tabela', linhas, n_linhas_cabeçalho) · ('fig',)."""

    INLINE = {"b": "<b>", "strong": "<b>", "i": "<i>", "em": "<i>", "sup": "<super>", "sub": "<sub>", "u": "<u>"}

    def __init__(self, est: Estilos):
        super().__init__(convert_charrefs=True)
        self.est = est
        self.itens: list = []
        self.buf: list[str] = []
        self.pilha_inline: list[str] = []
        self.listas: list[dict] = []
        self.li_marca: str | None = None
        self.tabela = None
        self.cel = None
        self.pre = None
        self.svg = 0

    # -- utilitários
    def _flush(self):
        txt = re.sub(r"\s+", " ", "".join(self.buf)).strip()
        self.buf = []
        if txt.replace("<br/>", "").strip():
            txt = re.sub(r"^(<br/>\s*)+|(\s*<br/>)+$", "", txt)
            if self.li_marca is not None:
                self.itens.append(("li", txt, max(1, len(self.listas)), self.li_marca))
                self.li_marca = ""
            else:
                self.itens.append(("p", txt))

    def _alvo(self) -> list[str]:
        return self.cel if self.cel is not None else self.buf

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if self.svg or tag == "svg":
            if tag == "svg":
                self.svg += 1
            return
        if self.pre is not None:
            return
        mono = "mono" in (a.get("class") or "")
        if tag in self.INLINE or tag in ("code", "span", "a", "small", "kbd"):
            abre, fecha = "", ""
            if tag in self.INLINE:
                abre = self.INLINE[tag]
                fecha = abre.replace("<", "</")
            if tag in ("code", "kbd") or mono:
                abre += f'<font face="DejaVuMono" color="{self.est.t.code}">'
                fecha = "</font>" + fecha
            self._alvo().append(abre)
            self.pilha_inline.append(fecha)
            return
        if tag == "br":
            self._alvo().append("<br/>")
            return
        if self.tabela is not None:
            if tag == "tr":
                self.tabela["linhas"].append([])
                self.tabela["cab"].append(self.tabela["em_thead"])
            elif tag in ("td", "th"):
                self.cel = []
                if tag == "th":
                    self.cel.append("<b>")
                    self.tabela["th"] = True
            elif tag == "thead":
                self.tabela["em_thead"] = True
            return
        if tag == "table":
            self._flush()
            self.tabela = {"linhas": [], "cab": [], "em_thead": False, "th": False}
            return
        if tag == "pre":
            self._flush()
            self.pre = []
            return
        if tag in ("ul", "ol"):
            self._flush()
            self.listas.append({"ord": tag == "ol", "n": int(a.get("start") or 1)})
            return
        if tag == "li":
            self._flush()
            lst = self.listas[-1] if self.listas else {"ord": False, "n": 1}
            if lst["ord"]:
                self.li_marca = f"{lst['n']}."
                lst["n"] += 1
            else:
                self.li_marca = "•" if len(self.listas) <= 1 else "–"
            return
        if tag in ("p", "div", "h3", "h4", "h2", "figure", "section", "dl", "dt", "dd"):
            if self.li_marca is not None and self.buf:
                self.buf.append("<br/>")
            else:
                self._flush()
            if tag in ("h2", "h3", "h4", "dt"):
                self.buf.append("<b>")
                self.pilha_inline.append("</b>")
                self.pilha_inline.append("@bloco")

    def handle_endtag(self, tag):
        if self.svg:
            if tag == "svg":
                self.svg -= 1
                if not self.svg:
                    self._flush()
                    self.itens.append(("fig",))
            return
        if tag == "pre" and self.pre is not None:
            self.itens.append(("pre", "".join(self.pre).strip("\n")))
            self.pre = None
            return
        if self.pre is not None:
            return
        if tag in self.INLINE or tag in ("code", "span", "a", "small", "kbd"):
            if self.pilha_inline:
                self._alvo().append(self.pilha_inline.pop())
            return
        if self.tabela is not None:
            if tag in ("td", "th") and self.cel is not None:
                if tag == "th":
                    self.cel.append("</b>")
                txt = re.sub(r"\s+", " ", "".join(self.cel)).strip()
                self.tabela["linhas"][-1].append(txt)
                self.cel = None
            elif tag == "thead":
                self.tabela["em_thead"] = False
            elif tag == "table":
                t = self.tabela
                self.tabela = None
                ncab = 0
                for e in t["cab"]:
                    if not e:
                        break
                    ncab += 1
                linhas = [l for l in t["linhas"] if l]
                if linhas:
                    self.itens.append(("tabela", linhas, ncab))
            return
        if tag in ("ul", "ol"):
            self._flush()
            if self.listas:
                self.listas.pop()
            self.li_marca = None if not self.listas else ""
            return
        if tag == "li":
            self._flush()
            self.li_marca = "" if self.listas else None
            if self.li_marca == "":
                self.li_marca = None
            return
        if tag in ("h2", "h3", "h4", "dt") and self.pilha_inline and self.pilha_inline[-1] == "@bloco":
            self.pilha_inline.pop()
            self.buf.append(self.pilha_inline.pop())
        if tag in ("p", "div", "h3", "h4", "h2", "figure", "section", "dt", "dd"):
            if self.li_marca is None:
                self._flush()

    def handle_data(self, data):
        if self.svg:
            return
        if self.pre is not None:
            self.pre.append(data)
            return
        self._alvo().append(esc(data))

    def resultado(self) -> list:
        self._flush()
        return self.itens


def html_itens(html: str, est: Estilos) -> list:
    p = _ConversorHtml(est)
    p.feed(html or "")
    p.close()
    return p.resultado()


# ------------------------------------------------------------------ flowables próprios
class Marca(Flowable):
    """Ponto invisível: regista a página onde fica (para o índice) e cria o marcador do PDF."""

    def __init__(self, chave: str, titulo: str | None = None, nivel: int = 0, licao: str | None = None):
        super().__init__()
        self.chave, self.titulo, self.nivel, self.licao = chave, titulo, nivel, licao
        self.width = self.height = 0

    def wrap(self, aw, ah):
        return 0, 0

    def draw(self):
        cv = self.canv
        cv.bookmarkPage(self.chave)
        if self.titulo:
            cv.addOutlineEntry(self.titulo, self.chave, level=self.nivel, closed=False)


class LinhasResposta(Flowable):
    def __init__(self, n: int, passo: float, cor: str, rotulo: str = "", cor_rotulo: str = "#536375"):
        super().__init__()
        self.n, self.passo, self.cor, self.rotulo, self.cor_rotulo = n, passo, cor, rotulo, cor_rotulo

    def wrap(self, aw, ah):
        self.largura = aw
        return aw, self.n * self.passo + 4

    def draw(self):
        c = self.canv
        c.setStrokeColor(colors.HexColor(self.cor))
        c.setLineWidth(0.6)
        for k in range(self.n):
            y = (self.n - k - 1) * self.passo + 4
            x0 = 0
            if k == 0 and self.rotulo:
                c.setFont("DejaVu", 8.5)
                c.setFillColor(colors.HexColor(self.cor_rotulo))
                c.drawString(0, y + 2, self.rotulo)
                x0 = stringWidth(self.rotulo, "DejaVu", 8.5) + 4
            c.line(x0, y, self.largura, y)


class Faixa(Flowable):
    """Faixa azul-escura (compacta) do topo da capa, com a risca de 6 cores dos pares do cabo:
    1.ª linha: curso + código da aula; título; uma linha com o módulo e a duração."""

    def __init__(self, t: Tema, rotulo: str, sub: str, chip: str, titulo: str, meta: str):
        super().__init__()
        self.t = t
        claro = colors.HexColor(t.tinta) if t.imprimir else colors.white
        sua = colors.HexColor(t.suave) if t.imprimir else colors.HexColor("#a9b8d6")
        self.rotulo = rotulo.upper()
        self.cor_sua = sua
        self.chip = chip
        self.p_tit = Paragraph(esc(titulo), ParagraphStyle("ft", fontName="DejaVu-Bold", fontSize=16, leading=19.5,
                                                            textColor=claro))
        linha = esc(sub) + (" · " + meta if meta else "")
        self.p_meta = Paragraph(linha, ParagraphStyle("fm", fontName="DejaVu", fontSize=8.5, leading=11, textColor=sua))

    def wrap(self, aw, ah):
        self.aw = aw
        self.h_tit = self.p_tit.wrap(aw, ah)[1]
        self.h_meta = self.p_meta.wrap(aw, ah)[1]
        self.h = 6 * mm + 14 + 5 + self.h_tit + 3 + self.h_meta + 5 * mm
        return aw, self.h

    def draw(self):
        c, t = self.canv, self.t
        x0, larg = -MARGEM, PAG_L
        if t.imprimir:
            c.setStrokeColor(colors.black)
            c.setLineWidth(2)
            c.line(x0 + MARGEM, 4, x0 + MARGEM + LARGURA, 4)
        else:
            c.setFillColor(colors.HexColor(t.navy))
            c.rect(x0, 4, larg, self.h + 40, stroke=0, fill=1)
            w = larg / 6
            for k, cor in enumerate(CORES_CABO):
                c.setFillColor(colors.HexColor(cor))
                c.rect(x0 + k * w, 0, w + 0.5, 4, stroke=0, fill=1)
        y = self.h - 6 * mm - 14
        # 1.ª linha: curso à esquerda, chip com o código à direita
        fs = 8
        wch = stringWidth(self.chip, "DejaVu-Bold", fs) + 14
        if t.imprimir:
            c.setStrokeColor(colors.black); c.setLineWidth(0.7)
            c.roundRect(self.aw - wch, y, wch, 14, 7, stroke=1, fill=0)
            c.setFillColor(colors.black)
        else:
            c.setFillColor(colors.HexColor("#1f5fe0"))
            c.roundRect(self.aw - wch, y, wch, 14, 7, stroke=0, fill=1)
            c.setFillColor(colors.white)
        c.setFont("DejaVu-Bold", fs)
        c.drawString(self.aw - wch + 7, y + 4.2, self.chip)
        rot = self.rotulo
        maxw = self.aw - wch - 12
        while stringWidth(rot, "DejaVu-Bold", 7) > maxw and len(rot) > 4:
            rot = rot[:-2] + "…"
        c.setFillColor(self.cor_sua)
        c.setFont("DejaVu-Bold", 7)
        c.drawString(0, y + 4.4, rot)
        y -= 5 + self.h_tit
        self.p_tit.drawOn(c, 0, y)
        y -= 3 + self.h_meta
        self.p_meta.drawOn(c, 0, y)


# ------------------------------------------------------------------ peças de layout
def larguras(linhas: list[list[str]], total: float, fonte_px: float) -> list[float]:
    """Larguras das colunas proporcionais ao texto (sem partir palavras, se couber), somando `total`."""
    ncol = max(len(l) for l in linhas)
    plano = [[re.sub(r"<[^>]+>", "", c or "").replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&")
              for c in l] + [""] * (ncol - len(l)) for l in linhas]
    sw = lambda x: stringWidth(x, "DejaVu-Bold", fonte_px)
    pref = [min(max(sw(l[k]) for l in plano) + 12, total * 0.6) for k in range(ncol)]
    minimo = [min(max((sw(w) for l in plano for w in l[k].split()), default=10) + 12, total * 0.4) for k in range(ncol)]
    if sum(pref) <= total:
        extra = (total - sum(pref)) / ncol
        return [p + extra for p in pref]
    base = sum(minimo)
    if base >= total:
        return [total * m / base for m in minimo]
    folga = total - base
    resto = [max(p - m, 0) for p, m in zip(pref, minimo)]
    sr = sum(resto) or 1
    return [m + folga * r / sr for m, r in zip(minimo, resto)]


def tabela(linhas: list[list[str]], ncab: int, est: Estilos, largura: float = LARGURA, ws=None) -> Table:
    t = est.t
    ncol = max(len(l) for l in linhas)
    linhas = [l + [""] * (ncol - len(l)) for l in linhas]
    ws = ws or larguras(linhas, largura, est.cel.fontSize)
    dados = [[Paragraph(c, est.cel_cab if i < ncab else est.cel) for c in l] for i, l in enumerate(linhas)]
    tb = Table(dados, colWidths=ws, repeatRows=ncab, hAlign="LEFT")
    st = [("VALIGN", (0, 0), (-1, -1), "TOP"),
          ("LINEBELOW", (0, 0), (-1, -1), 0.4, colors.HexColor(t.linha)),
          ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor(t.linha)),
          ("TOPPADDING", (0, 0), (-1, -1), 3.5), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
          ("LEFTPADDING", (0, 0), (-1, -1), 5), ("RIGHTPADDING", (0, 0), (-1, -1), 5)]
    if ncab:
        st += [("BACKGROUND", (0, 0), (-1, ncab - 1), colors.HexColor(t.th_fundo)),
               ("LINEBELOW", (0, ncab - 1), (-1, ncab - 1), 1, colors.HexColor(t.tinta if t.imprimir else t.navy))]
    for i in range(ncab + 1, len(linhas), 2):
        st.append(("BACKGROUND", (0, i), (-1, i), colors.HexColor(t.zebra)))
    tb.setStyle(TableStyle(st))
    return tb


def caixa(conteudo: list, est: Estilos, fundo: str, borda: str, rotulo: str | None = None) -> Table:
    """Caixa colorida com barra à esquerda; uma linha por flowable para poder partir entre páginas."""
    t = est.t
    linhas = []
    if rotulo:
        linhas.append([Paragraph(esc(rotulo.upper()), ParagraphStyle("cr", parent=est.rotulo,
                                                                     textColor=colors.HexColor(borda)))])
    linhas += [[f] for f in conteudo]
    tb = Table(linhas, colWidths=[LARGURA], hAlign="LEFT")
    st = [("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(fundo)),
          ("LINEBEFORE", (0, 0), (0, -1), 3, colors.HexColor(borda)),
          ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 9),
          ("TOPPADDING", (0, 0), (-1, -1), 1), ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
          ("TOPPADDING", (0, 0), (-1, 0), 7), ("BOTTOMPADDING", (0, -1), (-1, -1), 6)]
    if t.imprimir:
        st.append(("BOX", (0, 0), (-1, -1), 0.6, colors.black))
    tb.setStyle(TableStyle(st))
    return tb


def _quebrar_mono(txt: str, n: int, recuo: str = "  ") -> list[str]:
    out = []
    for linha in txt.split("\n"):
        if len(linha) <= n:
            out.append(linha)
        else:
            partes = textwrap.wrap(linha, n, subsequent_indent=recuo, drop_whitespace=False,
                                   break_on_hyphens=False) or [linha]
            out += partes
    return out


def _mono_markup(linha: str) -> str:
    return esc(linha).replace(" ", "&nbsp;") or "&nbsp;"


def caixa_terminal(linhas: list, est: Estilos, rotulo: str) -> Table:
    t = est.t
    cab = Paragraph(esc(rotulo), ParagraphStyle("tr", parent=est.rotulo, textColor=colors.HexColor(t.term_dim)))
    tb = Table([[cab]] + [[f] for f in linhas], colWidths=[LARGURA], hAlign="LEFT")
    st = [("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(t.term_fundo)),
          ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
          ("TOPPADDING", (0, 0), (-1, -1), 1), ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
          ("TOPPADDING", (0, 0), (-1, 0), 6), ("BOTTOMPADDING", (0, -1), (-1, -1), 7)]
    if t.imprimir:
        st.append(("BOX", (0, 0), (-1, -1), 0.8, colors.black))
    tb.setStyle(TableStyle(st))
    return tb


def _cars_por_linha(est: Estilos) -> int:
    return int((LARGURA - 20) / stringWidth("M", "DejaVuMono", est.mono.fontSize)) - 1


def bloco_pre(texto: str, est: Estilos, rotulo: str = "saída") -> Table:
    n = _cars_por_linha(est)
    ps = [Paragraph(_mono_markup(l), est.mono) for l in _quebrar_mono(texto, n)]
    return caixa_terminal(ps, est, rotulo)


def itens_para_flowables(itens: list, est: Estilos, largura: float = LARGURA, estilo=None) -> list:
    estilo = estilo or est.corpo
    out = []
    for it in itens:
        k = it[0]
        if k == "p":
            out.append(Paragraph(it[1], estilo))
        elif k == "li":
            _, txt, nivel, marca = it
            st = ParagraphStyle("li%d" % nivel, parent=est.li, fontSize=estilo.fontSize, leading=estilo.leading,
                                leftIndent=est.li.leftIndent * nivel, bulletIndent=est.li.leftIndent * (nivel - 1) + 2)
            out.append(Paragraph(txt, st, bulletText=marca or None))
        elif k == "pre":
            out.append(bloco_pre(it[1], est))
        elif k == "tabela":
            out.append(tabela(it[1], it[2], est, largura - 24 if largura < LARGURA else largura))
            out.append(Spacer(1, 4))
        elif k == "fig":
            out.append(Paragraph("<i>[Diagrama: veja-o na app.]</i>", est.peq))
    return out


def inline(htmls: str, est: Estilos) -> str:
    """HTML curto (um item de lista) → markup de um só parágrafo."""
    return "<br/>".join(it[1] for it in html_itens(htmls, est) if it[0] in ("p", "li")) or esc(htmls)


def html(htmls: str, est: Estilos, estilo=None, largura: float = LARGURA) -> list:
    return itens_para_flowables(html_itens(htmls, est), est, largura, estilo)


def nota_figura(texto: str, est: Estilos) -> Table:
    t = est.t
    p = Paragraph(f"<b>Figura:</b> {esc(texto)} <font color='{t.suave}'>(veja a figura animada na app)</font>", est.corpo)
    tb = Table([[p]], colWidths=[LARGURA])
    tb.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor(t.linha)),
                            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#ffffff" if t.imprimir else t.zebra)),
                            ("LEFTPADDING", (0, 0), (-1, -1), 10), ("TOPPADDING", (0, 0), (-1, -1), 7),
                            ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]))
    return tb


NOMES_NO = {"pc": "PC", "portatil": "Portátil", "servidor": "Servidor", "switch": "Switch", "router": "Router",
            "telefone_ip": "Telefone IP", "nuvem": "Internet", "internet": "Internet", "ap": "Access point",
            "firewall": "Firewall", "impressora": "Impressora", "telemovel": "Telemóvel", "smartphone": "Smartphone",
            "hub": "Hub", "switch_l3": "Switch L3", "wlc": "WLC", "modem": "Modem", "tablet": "Tablet"}


def desenho_topologia(b: dict, est: Estilos) -> Drawing:
    """Desenho simples da topologia (nós e ligações) com as coordenadas do bloco (0–100)."""
    t = est.t
    nos = {n["id"]: n for n in b.get("nos", [])}
    w, h = LARGURA, 150 if len(nos) <= 6 else 180
    bh = 30
    larg = {i: min(max(stringWidth(n.get("rotulo") or i, "DejaVu-Bold", 7) + 12, 64), 130) for i, n in nos.items()}
    bw = max(larg.values(), default=64)
    d = Drawing(w, h)
    pos = {i: (bw / 2 + 4 + (n["x"] / 100) * (w - bw - 8), h - (bh / 2 + 4) - (n["y"] / 100) * (h - bh - 8))
           for i, n in nos.items()}
    linha = colors.HexColor(t.suave)
    for l in b.get("ligacoes", []):
        if l["a"] in pos and l["b"] in pos:
            (x1, y1), (x2, y2) = pos[l["a"]], pos[l["b"]]
            d.add(Line(x1, y1, x2, y2, strokeColor=linha, strokeWidth=1.2))
            if l.get("rotulo"):
                d.add(String((x1 + x2) / 2 + 3, (y1 + y2) / 2 + 3, l["rotulo"], fontName="DejaVu", fontSize=6.5,
                             fillColor=colors.HexColor(t.suave)))
    for i, n in nos.items():
        x, y = pos[i]
        fundo = colors.white if t.imprimir else colors.HexColor("#e6effd")
        borda = colors.black if t.imprimir else colors.HexColor("#1f5fe0")
        bwi = larg[i]
        d.add(Rect(x - bwi / 2, y - bh / 2, bwi, bh, rx=6, ry=6, fillColor=fundo, strokeColor=borda, strokeWidth=0.9))
        rot = n.get("rotulo") or n["id"]
        while stringWidth(rot, "DejaVu-Bold", 7) > bwi - 6 and len(rot) > 3:
            rot = rot[:-2] + "…"
        d.add(String(x, y + 1.5, rot, fontName="DejaVu-Bold", fontSize=7, textAnchor="middle",
                     fillColor=colors.HexColor(t.tinta)))
        tipo = NOMES_NO.get(n.get("tipo"), (n.get("tipo") or "").replace("_", " "))
        d.add(String(x, y - 8.5, tipo, fontName="DejaVu", fontSize=6, textAnchor="middle",
                     fillColor=colors.HexColor(t.suave)))
    return d


FIOS_NORMA = {
    "T568B": ["branco-laranja", "laranja", "branco-verde", "azul", "branco-azul", "verde", "branco-castanho", "castanho"],
    "T568A": ["branco-verde", "verde", "branco-laranja", "azul", "branco-azul", "laranja", "branco-castanho", "castanho"],
}


# ------------------------------------------------------------------ comandos Cisco
PROMPT_CISCO = re.compile(r"^[A-Za-z][\w.-]*(\([\w-]+\))?[#>]$")


def comandos_cisco(licoes: list[dict]) -> list[dict]:
    vistos, out = set(), []
    for i, l in enumerate(licoes):
        for b in l["blocos"]:
            if b["tipo"] != "cli":
                continue
            for p in b["passos"]:
                pr = (p.get("prompt") or "").strip()
                if not PROMPT_CISCO.match(pr) or pr.startswith("PS"):
                    continue
                chave = (pr.split("(")[-1] if "(" in pr else pr[-1], p["cmd"].strip())
                if chave in vistos:
                    continue
                vistos.add(chave)
                out.append({"prompt": pr, "cmd": p["cmd"].strip(), "explica": p.get("explica", ""), "aula": i + 1})
    return out


def _modo(prompt: str) -> str:
    m = re.search(r"\(([\w-]+)\)", prompt)
    if m:
        return {"config": "configuração global", "config-if": "interface", "config-line": "linha",
                "config-router": "router (encaminhamento)", "config-vlan": "VLAN", "config-if-range": "várias interfaces",
                "config-subif": "subinterface", "dhcp-config": "pool DHCP"}.get(m.group(1), m.group(1))
    return "EXEC privilegiado" if prompt.endswith("#") else "EXEC utilizador"


# ------------------------------------------------------------------ exercícios (geradores da app via Node)
_NODE_JS = r"""
const fs = require("fs"), vm = require("vm");
const d = JSON.parse(fs.readFileSync(0, "utf8"));
const ctx = { window: {}, console }; vm.createContext(ctx);
ctx.window.CCNA = { glossario: d.glossario, protocolos: d.protocolos };
vm.runInContext(fs.readFileSync(d.js, "utf8"), ctx);
const E = ctx.window.Exercicios, out = {};
const GL = {}; d.glossario.forEach((t) => GL[t.termo] = t);
const PR = {}; d.protocolos.forEach((p) => PR[p.id] = p);
for (const l of d.licoes) {
  const c = { quiz: l.quiz, termos: l.termos.map((n) => GL[n]).filter(Boolean), protocolos: l.protocolos.map((i) => PR[i]).filter(Boolean) };
  const res = [], vistos = new Set();
  for (const lista of [l.geradores.filter((g) => g !== "quiz"), l.geradores]) {
    for (let k = 0; res.length < l.n && k < l.n * 30; k++) {
      const ex = E.gerar(lista, (l.semente + k * 7919) >>> 0, c);
      if (!ex || vistos.has(ex.p)) continue;
      vistos.add(ex.p);
      if (ex.gen === "quiz") ex.p = ex.p.replace(/[&<>]/g, (x) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[x]));
      res.push(ex);
    }
  }
  out[l.id] = res;
}
process.stdout.write(JSON.stringify(out));
"""


def _semente(lid: str) -> int:
    return zlib.crc32(lid.encode()) & 0x7FFFFFFF


def gerar_exercicios(c: dict) -> dict[str, list]:
    licoes = [{"id": l["id"], "quiz": l["quiz"], "termos": l["termos"], "protocolos": l["protocolos"],
               "geradores": l["exercicios"]["geradores"], "n": l["exercicios"]["obrigatorios"], "semente": _semente(l["id"])}
              for m in c["modulos"] for l in m["licoes"]]
    node = shutil.which("node")
    if node and JS_EXERCICIOS.exists():
        entrada = json.dumps({"js": str(JS_EXERCICIOS), "glossario": c["glossario"], "protocolos": c["protocolos"],
                              "licoes": licoes}, ensure_ascii=False)
        try:
            r = subprocess.run([node, "-e", _NODE_JS], input=entrada.encode(), capture_output=True, timeout=300, check=True)
            out = json.loads(r.stdout)
            # aulas com poucos termos/perguntas: completa com exercícios sobre os termos do glossário
            extra = _exercicios_sem_node(c, [l for l in licoes if len(out.get(l["id"], [])) < l["n"]])
            for lid, xs in extra.items():
                vistos = {e["p"] for e in out.get(lid, [])}
                n = next(l["n"] for l in licoes if l["id"] == lid)
                out[lid] = out.get(lid, []) + [e for e in xs if e["p"] not in vistos][:n - len(out.get(lid, []))]
            return out
        except (subprocess.SubprocessError, ValueError) as e:  # pragma: no cover - depende do sistema
            print("Aviso: geradores de exercícios (Node) falharam; uso exercícios sobre os termos.", e)
    return _exercicios_sem_node(c, licoes)


def _exercicios_sem_node(c: dict, licoes: list[dict]) -> dict[str, list]:
    import random
    gl = {t["termo"]: t for t in c["glossario"]}
    todos = [t for t in c["glossario"] if t.get("def")]
    out = {}
    for l in licoes:
        r = random.Random(l["semente"])
        termos = [gl[n] for n in l["termos"] if n in gl and gl[n].get("def")]
        if len(termos) < l["n"]:
            termos += r.sample([t for t in todos if t not in termos], l["n"] - len(termos))
        res = []
        for t in r.sample(termos, min(l["n"], len(termos))):
            outros = r.sample([x["def"] for x in todos if x["termo"] != t["termo"]], 3)
            ops = outros + [t["def"]]
            r.shuffle(ops)
            res.append({"tipo": "mc", "gen": "termos", "p": f"O que significa <b>{esc(t['termo'])}</b>?",
                        "opcoes": ops, "correta": ops.index(t["def"]), "explica": f"<p><b>{esc(t['termo'])}</b>: {esc(t['def'])}</p>"})
        out[l["id"]] = res
    return out


# ------------------------------------------------------------------ documento
class Documento(BaseDocTemplate):
    def __init__(self, destino, t: Tema, codigo: str, cabecalho: str, total: int, modulo: bool, licao: str):
        super().__init__(destino, pagesize=A4, leftMargin=MARGEM, rightMargin=MARGEM, topMargin=TOPO,
                         bottomMargin=BASE, title=cabecalho if modulo else f"{licao} ({codigo})", author=NOME_CURSO, subject=codigo, creator=NOME_CURSO,
                         invariant=1)
        self.t, self.codigo, self.cabecalho, self.total, self.modulo = t, codigo, cabecalho, total, modulo
        self.paginas: dict[str, int] = {}
        self.licao_atual = licao
        capa = Frame(MARGEM, BASE, LARGURA, PAG_A - BASE, leftPadding=0, rightPadding=0, topPadding=0,
                     bottomPadding=0, id="capa")
        normal = Frame(MARGEM, BASE, LARGURA, PAG_A - BASE - TOPO, leftPadding=0, rightPadding=0, topPadding=0,
                       bottomPadding=0, id="normal")
        self.addPageTemplates([PageTemplate("capa", [capa], onPageEnd=self._rodape),
                               PageTemplate("normal", [normal], onPageEnd=self._cab_rodape)])

    def afterFlowable(self, f):
        if isinstance(f, Marca):
            self.paginas[f.chave] = self.page
            if f.licao is not None:
                self.licao_atual = f.licao

    def _rodape(self, c, doc):
        t = self.t
        c.saveState()
        c.setStrokeColor(colors.HexColor(t.linha))
        c.setLineWidth(0.5)
        c.line(MARGEM, BASE - 6 * mm, PAG_L - MARGEM, BASE - 6 * mm)
        c.setFont("DejaVu", 8)
        c.setFillColor(colors.HexColor(t.suave))
        dir_ = f"página {c.getPageNumber()} / {self.total or '?'}"
        c.drawRightString(PAG_L - MARGEM, BASE - 10.5 * mm, dir_)
        esq = f"{self.codigo} · {self.licao_atual}"
        maxw = LARGURA - stringWidth(dir_, "DejaVu", 8) - 20
        if stringWidth(esq, "DejaVu", 8) > maxw:
            while stringWidth(esq + "…", "DejaVu", 8) > maxw:
                esq = esq[:-1]
            esq = esq.rstrip() + "…"
        c.drawString(MARGEM, BASE - 10.5 * mm, esq)
        c.restoreState()

    def _cab_rodape(self, c, doc):
        t = self.t
        self._rodape(c, doc)
        c.saveState()
        y = PAG_A - TOPO + 6 * mm
        c.setFont("DejaVu-Bold", 7.5)
        c.setFillColor(colors.HexColor(t.navy))
        c.drawString(MARGEM, y + 2, NOME_CURSO.upper())
        c.setFont("DejaVu", 7.5)
        c.setFillColor(colors.HexColor(t.suave))
        txt = self.cabecalho
        maxw = LARGURA - stringWidth(NOME_CURSO.upper(), "DejaVu-Bold", 7.5) - 20
        while stringWidth(txt, "DejaVu", 7.5) > maxw:
            txt = txt[:-2] + "…"
        c.drawRightString(PAG_L - MARGEM, y + 2, txt)
        if t.imprimir:
            c.setStrokeColor(colors.black)
            c.setLineWidth(0.6)
            c.line(MARGEM, y - 3, PAG_L - MARGEM, y - 3)
        else:
            w = LARGURA / 6
            for k, cor in enumerate(CORES_CABO):
                c.setStrokeColor(colors.HexColor(cor))
                c.setLineWidth(1.4)
                c.line(MARGEM + k * w, y - 3, MARGEM + (k + 1) * w, y - 3)
        c.restoreState()


class Contexto:
    """Dados partilhados por todos os PDFs: curso, exercícios e números de página da passagem anterior."""

    def __init__(self, c: dict, exercicios: dict[str, list]):
        self.c = c
        self.ex = exercicios
        self.glos = {t["termo"]: t for t in c["glossario"]}
        self.prot = {p["id"]: p for p in c["protocolos"]}
        self.mod_de: dict[str, dict] = {}
        self.ordem: list[tuple[dict, dict]] = []
        for m in c["modulos"]:
            for l in m["licoes"]:
                self.mod_de[l["id"]] = m
                self.ordem.append((m, l))

    def anterior(self, lid: str):
        for k, (m, l) in enumerate(self.ordem):
            if l["id"] == lid:
                return self.ordem[k - 1] if k else None
        return None


def _pg(pags: dict, chave: str) -> str:
    return str(pags.get(chave, "00"))


def _secao(n: int, titulo: str, chave: str, est: Estilos, toc: list, nivel: int = 1) -> list:
    toc.append((chave, f"{n}. {titulo}", nivel))
    return [CondPageBreak(60 * mm), Marca(chave, f"{n}. {titulo}", nivel),
            Paragraph(f"<font color='{est.t.acento}'>{n}.</font> {esc(titulo)}", est.h1)]


def _rotulo_aula(m: dict, l: dict) -> str:
    i = [x["id"] for x in m["licoes"]].index(l["id"])
    return f"{m['codigo']} · Aula {i + 1} de {len(m['licoes'])}"


def historia_licao(ctx: Contexto, m: dict, l: dict, est: Estilos, pags: dict, prefixo: str = "",
                   no_modulo: bool = False) -> list:
    """Todos os flowables de uma aula: capa, conteúdo, termos, exercícios, quiz, soluções e referências."""
    t = est.t
    P = prefixo
    s: list = []
    toc: list = []      # (chave, texto, nível) – preenchido ao montar o corpo
    corpo: list = []
    n = 0

    # ---------------- corpo
    def nova(titulo, chave):
        nonlocal n
        n += 1
        return _secao(n, titulo, P + chave, est, toc, 2 if no_modulo else 1)

    for i, b in enumerate(l["blocos"]):
        tp = b["tipo"]
        if tp == "texto":
            corpo += nova(b["titulo"], f"b{i}")
            corpo += html(b["html"], est)
        elif tp == "exemplo":
            corpo += nova("Exemplo resolvido: " + b["titulo"], f"b{i}")
            corpo.append(caixa(html(b["html"], est, largura=LARGURA - 20), est, t.ex_fundo, t.ex_borda, "Exemplo resolvido"))
            corpo.append(Spacer(1, 6))
        elif tp == "tabela":
            if b.get("titulo"):
                corpo += nova(b["titulo"], f"b{i}")
            linhas = [[esc(x) for x in b["cabecalho"]]] + [[esc(x) for x in r] for r in b["linhas"]]
            corpo.append(tabela(linhas, 1, est))
            corpo.append(Spacer(1, 8))
        elif tp == "cli":
            corpo += nova(b["titulo"], f"b{i}")
            nlin = _cars_por_linha(est)
            ps = []
            for p in b["passos"]:
                pr = p.get("prompt") or ""
                linhas = _quebrar_mono(f"{pr} {p['cmd']}" if pr else p["cmd"], nlin, "    ")
                txt = "<br/>".join(_mono_markup(x) for x in linhas)
                if pr and txt.startswith(_mono_markup(pr)):
                    txt = f"<font color='{t.term_prompt}'>{_mono_markup(pr)}</font>" + txt[len(_mono_markup(pr)):]
                ps.append(Paragraph(f"<b>{txt}</b>" if t.imprimir else txt, est.mono))
                if p.get("explica"):
                    ps.append(Paragraph(esc(p["explica"]), est.mono_ex))
            corpo.append(caixa_terminal(ps, est, "comandos · passo a passo"))
            if b.get("nota"):
                corpo += html(b["nota"], est, est.peq)
            corpo.append(Spacer(1, 6))
        elif tp == "saida":
            corpo += nova(b["titulo"], f"b{i}")
            corpo.append(bloco_pre(b["texto"], est, "saída do comando"))
            if b.get("explica"):
                corpo.append(Spacer(1, 3))
                corpo += html(b["explica"], est, est.peq)
            corpo.append(Spacer(1, 6))
        elif tp == "sim_real":
            corpo += nova(b["titulo"], f"b{i}")
            w = (LARGURA - 8) / 2
            def col(rot, xs):
                return [Paragraph(esc(rot.upper()), est.rotulo)] + [
                    Paragraph(inline(x, est), ParagraphStyle("sr", parent=est.li, fontSize=est.cel.fontSize, leading=est.cel.leading,
                                                leftIndent=10, bulletIndent=0), bulletText="•") for x in xs]
            tb = Table([[col("No simulador", b["simulador"]), col("No equipamento real", b["real"])]],
                       colWidths=[w, w], hAlign="LEFT")
            tb.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"),
                                    ("BACKGROUND", (0, 0), (0, 0), colors.HexColor(t.dica_fundo)),
                                    ("BACKGROUND", (1, 0), (1, 0), colors.HexColor(t.ex_fundo)),
                                    ("BOX", (0, 0), (0, 0), 0.6, colors.HexColor(t.linha)),
                                    ("BOX", (1, 0), (1, 0), 0.6, colors.HexColor(t.linha)),
                                    ("LEFTPADDING", (0, 0), (-1, -1), 8), ("TOPPADDING", (0, 0), (-1, -1), 7)]))
            corpo += [tb, Spacer(1, 6)]
        elif tp == "dica":
            plano = re.sub(r"<[^>]+>", "", b["html"]).lower()
            rot = "Dica de exame" if "exame" in plano or "ccna" in plano else "Dica"
            corpo.append(caixa(html(b["html"], est, largura=LARGURA - 20), est, t.dica_fundo, t.dica_borda, rot))
            corpo.append(Spacer(1, 6))
        elif tp == "alerta":
            corpo.append(caixa(html(b["html"], est, largura=LARGURA - 20), est, t.alerta_fundo, t.alerta_borda, "Atenção"))
            corpo.append(Spacer(1, 6))
        elif tp == "figura":
            corpo += [nota_figura(b.get("legenda") or b.get("nome", ""), est), Spacer(1, 6)]
        elif tp == "topologia":
            corpo.append(KeepTogether([desenho_topologia(b, est),
                                       Paragraph(f"<b>Figura:</b> {esc(b.get('legenda', ''))}", est.peq)]))
            corpo.append(Spacer(1, 6))
        elif tp == "jogo_cabo":
            corpo += nova("Prática: montar o cabo", f"b{i}")
            corpo.append(Paragraph(f"Ordem dos fios no conector RJ45 (patilha para baixo), norma <b>{esc(b['norma'])}</b> "
                                   "e a outra norma para comparar. Na app pode montar o conector fio a fio.", est.corpo))
            normas = [b["norma"]] + [x for x in FIOS_NORMA if x != b["norma"]]
            linhas = [["Pino"] + normas] + [[str(k + 1)] + [FIOS_NORMA[nm][k] for nm in normas] for k in range(8)]
            corpo += [tabela(linhas, 1, est, LARGURA * 0.7), Spacer(1, 6)]
        elif tp == "video":
            if b.get("titulo"):
                corpo += [nota_figura("Vídeo: " + b["titulo"], est), Spacer(1, 6)]
        else:  # tipo novo: não perder o texto
            txt = b.get("html") or b.get("texto") or b.get("legenda") or ""
            if b.get("titulo"):
                corpo += nova(b["titulo"], f"b{i}")
            if txt:
                corpo += html(txt, est)

    # ---------------- termos e protocolos
    termos = [ctx.glos[x] for x in l.get("termos", []) if x in ctx.glos]
    if termos:
        corpo += nova("Termos técnicos", "termos")
        corpo.append(Paragraph("O que quer dizer cada palavra técnica que aparece na aula, em linguagem simples.", est.peq))
        for tm in termos:
            ext = f" <font color='{t.suave}'>({esc(tm['extenso'])})</font>" if tm.get("extenso") else ""
            txt = f"<b>{esc(tm['termo'])}</b>{ext} — {esc(tm['def'])}"
            if tm.get("exemplo"):
                txt += f" <font color='{t.suave}'><i>Exemplo: {esc(tm['exemplo'])}</i></font>"
            corpo.append(Paragraph(txt, ParagraphStyle("tm", parent=est.corpo, spaceAfter=est.corpo.fontSize * 0.45)))
    prots = [ctx.prot[x] for x in l.get("protocolos", []) if x in ctx.prot]
    if prots:
        corpo += nova("Protocolos", "protocolos")
        for p in prots:
            meta = [f"camada OSI {p['camada_osi']}" if p.get("camada_osi") else "",
                    f"TCP/IP: {p['camada_tcpip']}" if p.get("camada_tcpip") else "",
                    f"transporte: {p['transporte']}" if p.get("transporte") not in (None, "", "—") else "",
                    f"portas: {p['portas']}" if p.get("portas") not in (None, "", "—") else ""]
            corpo.append(KeepTogether([
                Paragraph(f"<b>{esc(p['sigla'])}</b> — {esc(p['nome'])}", ParagraphStyle("ph", parent=est.corpo, spaceAfter=1)),
                Paragraph(esc(" · ".join(x for x in meta if x)), est.peq),
                Paragraph(esc(p.get("para_que", "")), est.corpo)]))

    # ---------------- exercícios
    exs = ctx.ex.get(l["id"], [])
    if exs:
        corpo.append(PageBreak())
        corpo += nova("Exercícios para fazer", "exercicios")
        corpo.append(Paragraph(f"Os {len(exs)} exercícios obrigatórios desta aula. Responda à mão nas linhas; "
                               "as soluções, com a resolução, estão no fim deste PDF. Na app pode fazer "
                               "exercícios novos sem fim.", est.peq))
        for k, ex in enumerate(exs):
            corpo.append(KeepTogether(_pergunta(k + 1, ex, est, exercicio=True)))
    if l["quiz"]:
        corpo += nova("Quiz", "quiz")
        corpo.append(Paragraph(f"{len(l['quiz'])} perguntas. Para concluir a aula na app precisa de 70% no quiz.", est.peq))
        for k, q in enumerate(l["quiz"]):
            qq = dict(q, p=esc(q["p"]))
            corpo.append(KeepTogether(_pergunta(k + 1, qq, est, exercicio=False)))

    # ---------------- soluções
    if exs or l["quiz"]:
        corpo.append(PageBreak())
        corpo += nova("Soluções", "solucoes")
        if exs:
            corpo.append(Paragraph("Exercícios", est.h3))
            for k, ex in enumerate(exs):
                corpo += _solucao(k + 1, ex, est)
        if l["quiz"]:
            corpo.append(Paragraph("Quiz — chave de respostas", est.h3))
            for k, q in enumerate(l["quiz"]):
                corpo += _solucao(k + 1, dict(q, explica=esc(q.get("explica", ""))), est, quiz=True)

    refs = [ctx.c["referencias"][k] for k in l.get("referencias", []) if k in ctx.c["referencias"]]
    if refs:
        corpo += nova("Referências bibliográficas", "refs")
        for k, r in enumerate(refs):
            corpo.append(Paragraph(esc(r), est.li, bulletText=f"{k + 1}."))

    # ---------------- capa (precisa do índice já montado)
    tit_curso = m["dominio"]
    meta = []
    if l.get("minutos"):
        meta.append(f"{l['minutos']} min de leitura")
    if l.get("video", {}).get("segundos"):
        meta.append(f"vídeo-aula {max(1, round(l['video']['segundos'] / 60))} min")
    if l.get("nivel"):
        meta.append(f"nível {esc(l['nivel'])}")
    s.append(NextPageTemplate("normal"))
    s.append(Marca(P + "inicio", l["titulo"], 1 if no_modulo else 0, licao=l["titulo"]))
    s.append(Faixa(t, NOME_CURSO + " · " + tit_curso, f"{m['codigo']} — {m['titulo']}", _rotulo_aula(m, l),
                   l["titulo"], " · ".join(meta)))
    s.append(Spacer(1, 12))
    if l.get("objetivos"):
        s.append(Paragraph("Nesta aula vai aprender a", est.h3))
        for o in l["objetivos"]:
            s.append(Paragraph(f"<font color='{t.ex_borda}'>✓</font> {esc(o)}",
                               ParagraphStyle("obj", parent=est.li, leftIndent=est.corpo.fontSize * 1.4, spaceAfter=2)))
        s.append(Spacer(1, 8))
    s.append(Paragraph("Como estudar esta aula", est.h3))
    passos = [("Veja a vídeo-aula", "na app (" + (f"{max(1, round(l['video']['segundos'] / 60))} min" if l.get("video") else "narrada") + ")."),
              ("Leia este PDF", "com calma e sublinhe o que é importante.")]
    passos.append(("Faça os exercícios", f"da pág. {_pg(pags, P + 'exercicios')}." if exs else "na app."))
    passos.append(("Confira as soluções", f"na pág. {_pg(pags, P + 'solucoes')}." if (exs or l['quiz']) else "na app."))
    cel = []
    for k, (a, b_) in enumerate(passos):
        cel.append([Paragraph(str(k + 1), est.num_passo), Paragraph(f"<b>{esc(a)}</b> {esc(b_)}", est.passo)])
    w4 = (LARGURA - 3 * 6) / 4
    fundos = ["#fdeedf", "#e3ecfd", "#e2f4ea", "#eee8fb"]
    # separação entre caixas: tabela de 7 colunas (caixa, espaço, caixa…)
    linha = []
    for k, cx in enumerate(cel):
        linha.append(cx)
        if k < 3:
            linha.append("")
    tb = Table([linha], colWidths=[w4, 6, w4, 6, w4, 6, w4], hAlign="LEFT")
    st2 = [("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 8),
           ("RIGHTPADDING", (0, 0), (-1, -1), 6), ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 8)]
    for k in range(4):
        col = k * 2
        if t.imprimir:
            st2.append(("BOX", (col, 0), (col, 0), 0.8, colors.black))
        else:
            st2 += [("BACKGROUND", (col, 0), (col, 0), colors.HexColor(fundos[k])),
                    ("LINEABOVE", (col, 0), (col, 0), 3, colors.HexColor(CORES_CABO[k]))]
    tb.setStyle(TableStyle(st2))
    s += [tb, Spacer(1, 10)]

    ant = ctx.anterior(l["id"])
    if ant:
        ma, la = ant
        onde = "a aula anterior deste módulo" if ma is m else f"a última aula do módulo anterior ({ma['codigo']})"
        txt = (f"Esta aula continua {onde}: <b>{esc(_rotulo_aula(ma, la))} — {esc(la['titulo'])}</b>. "
               "Se ainda não a fez, comece por lá; se já a fez, releia os objetivos dela e confirme que os domina.")
        s += [KeepTogether(caixa([Paragraph(txt, est.corpo)], est, "#f3f5f8" if not t.imprimir else "#ffffff",
                                    t.suave, "Antes desta aula")), Spacer(1, 10)]
    # índice
    s.append(Paragraph("Índice", est.h3))
    linhas = [[Paragraph(f'<a href="#{ch}">{esc(tx)}</a>', est.toc), Paragraph(_pg(pags, ch), est.toc_n)]
              for ch, tx, _ in toc]
    if linhas:
        ti = Table(linhas, colWidths=[LARGURA - 40, 40], hAlign="LEFT")
        ti.setStyle(TableStyle([("LINEBELOW", (0, 0), (-1, -1), 0.3, colors.HexColor(t.linha)),
                                ("TOPPADDING", (0, 0), (-1, -1), 1.5), ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
                                ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0)]))
        s += [ti, Spacer(1, 10)]

    s.append(PageBreak())
    return s + corpo


def _opcoes_markup(ops: list[str]) -> list[str]:
    return [f"<b>{chr(65 + k)})</b> {esc(o)}" for k, o in enumerate(ops)]


def _pergunta(n: int, q: dict, est: Estilos, exercicio: bool) -> list:
    t = est.t
    out = [Paragraph(f"<b>{n}.</b> {q['p']}", ParagraphStyle("q", parent=est.corpo, leftIndent=est.corpo.fontSize * 1.6,
                                                               firstLineIndent=-est.corpo.fontSize * 1.6, spaceAfter=3))]
    if q.get("fig"):
        out.append(Paragraph("<i>[Diagrama da rede: veja-o na app; os dados estão no enunciado.]</i>",
                             ParagraphStyle("qf", parent=est.peq, leftIndent=est.corpo.fontSize * 1.6)))
    ind = est.corpo.fontSize * 1.6
    op = ParagraphStyle("op", parent=est.corpo, leftIndent=ind + 14, firstLineIndent=-14, spaceAfter=2)
    if q["tipo"] == "mc":
        for o in _opcoes_markup(q["opcoes"]):
            out.append(Paragraph("☐ " + o, op))
        out.append(Spacer(1, est.corpo.fontSize * (1.2 if t.imprimir else 0.6)))
    elif q["tipo"] == "vf":
        out.append(Paragraph("☐ Verdadeiro      ☐ Falso", op))
        out += [_linhas(1, "Porquê?", est, ind), Spacer(1, 6)]
    else:
        calc = exercicio and q.get("gen", "") not in ("quiz", "porta", "termos", "siglas", "protocolos")
        nl = t.n_linhas if calc else (2 if t.imprimir else 1)
        rot = "Cálculos e resposta:" if calc else ("Comando:" if q["tipo"] == "cmd" else "Resposta:")
        out += [_linhas(nl, rot, est, ind), Spacer(1, 8)]
    return out


def _linhas(n: int, rotulo: str, est: Estilos, recuo: float) -> Table:
    t = est.t
    tb = Table([[LinhasResposta(n, t.linha_resp, t.linha, rotulo, t.suave)]], colWidths=[LARGURA - recuo])
    tb.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0)]))
    tb.hAlign = "RIGHT"
    return tb


def _solucao(n: int, q: dict, est: Estilos, quiz: bool = False) -> list:
    t = est.t
    if q["tipo"] == "mc":
        r = f"{chr(65 + q['correta'])}) {esc(q['opcoes'][q['correta']])}"
    elif q["tipo"] == "vf":
        r = "Verdadeiro" if q["correta"] else "Falso"
    else:
        r = " ou ".join(esc(x) for x in q.get("respostas", [])[:2])
        if q["tipo"] in ("cmd", "valor"):
            r = est.code(r) if q["tipo"] == "cmd" else f"<b>{r}</b>"
    ind = est.corpo.fontSize * 1.6
    cab = Paragraph(f"<b>{n}.</b> <font color='{t.ex_borda}'><b>Resposta:</b></font> {r}",
                    ParagraphStyle("sol", parent=est.corpo, leftIndent=ind, firstLineIndent=-ind, spaceAfter=2))
    exp = html(q.get("explica", ""), est, ParagraphStyle("solx", parent=est.peq, leftIndent=ind,
                                                         textColor=colors.HexColor(t.tinta)),
               largura=LARGURA - 24)
    # tabelas da explicação: recuadas
    for f in exp:
        if isinstance(f, Table):
            f.hAlign = "RIGHT"
    return [KeepTogether([cab] + exp[:2])] + exp[2:] + [Spacer(1, 4)]


# ------------------------------------------------------------------ montagem com duas passagens
def _construir(fazer_historia, destino_tmp, t: Tema, codigo: str, cabecalho: str, modulo: bool, licao: str):
    pags: dict = {}
    total = 0
    for _ in range(4):
        buf = BytesIO()
        doc = Documento(buf, t, codigo, cabecalho, total, modulo, licao)
        doc.build(fazer_historia(pags))
        novo_total = doc.page
        if doc.paginas == pags and novo_total == total:
            return buf.getvalue(), total
        pags, total = dict(doc.paginas), novo_total
    return buf.getvalue(), total


def pdf_licao(ctx: Contexto, m: dict, l: dict, t: Tema) -> tuple[bytes, int]:
    registar_fontes()
    est = Estilos(t)
    return _construir(lambda pags: historia_licao(ctx, m, l, est, pags), None, t, m["codigo"],
                      f"{m['codigo']} — {m['titulo']}", False, l["titulo"])


def historia_modulo(ctx: Contexto, m: dict, est: Estilos, pags: dict) -> list:
    t = est.t
    s: list = [NextPageTemplate("normal"), Marca("mod", f"{m['codigo']} — {m['titulo']}", 0, licao="Conteúdo programático")]
    meta = f"{m['horas']} h de estudo · {len(m['licoes'])} aula{'s' if len(m['licoes']) > 1 else ''}"
    s.append(Faixa(t, NOME_CURSO + " · " + m["dominio"], "Módulo completo: todas as aulas num só PDF",
                   f"{m['codigo']} · {len(m['licoes'])} aula{'s' if len(m['licoes']) > 1 else ''}", m["titulo"], meta))
    s.append(Spacer(1, 12))
    s.append(Paragraph("Conteúdo programático", est.h1))
    if m.get("objetivos"):
        s.append(Paragraph("Objetivos do módulo", est.h3))
        for o in m["objetivos"]:
            s.append(Paragraph(f"<font color='{t.ex_borda}'>✓</font> {esc(o)}",
                               ParagraphStyle("obj", parent=est.li, leftIndent=est.corpo.fontSize * 1.4, spaceAfter=2)))
    if m.get("temas"):
        s.append(Paragraph("Temas", est.h3))
        for x in m["temas"]:
            s.append(Paragraph(esc(x), est.li, bulletText="•"))
    s.append(Paragraph("Aulas deste módulo", est.h3))
    linhas = [[Paragraph(f"<b>{k + 1}</b>", est.toc),
               Paragraph(f'<a href="#l{k}inicio">{esc(l["titulo"])}</a> <font color="{t.suave}">· {l["minutos"]} min · {esc(l["nivel"])}</font>', est.toc),
               Paragraph(_pg(pags, f"l{k}inicio"), est.toc_n)] for k, l in enumerate(m["licoes"])]
    linhas.insert(0, [Paragraph("", est.toc), Paragraph('<a href="#cmds">Resumo dos comandos Cisco do módulo</a>', est.toc),
                      Paragraph(_pg(pags, "cmds"), est.toc_n)])
    ti = Table(linhas, colWidths=[18, LARGURA - 58, 40], hAlign="LEFT")
    ti.setStyle(TableStyle([("LINEBELOW", (0, 0), (-1, -1), 0.3, colors.HexColor(t.linha)), ("VALIGN", (0, 0), (-1, -1), "TOP"),
                            ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                            ("TOPPADDING", (0, 0), (-1, -1), 2), ("BOTTOMPADDING", (0, 0), (-1, -1), 3)]))
    s.append(ti)

    # resumo dos comandos Cisco
    cmds = comandos_cisco(m["licoes"])
    s += [CondPageBreak(80 * mm if cmds else 30 * mm), Marca("cmds", "Resumo dos comandos Cisco", 1),
          Paragraph("Resumo dos comandos Cisco do módulo", est.h1)]
    if cmds:
        s.append(Paragraph("Todos os comandos Cisco IOS que aparecem nas aulas deste módulo, pela ordem em que surgem.", est.peq))
        linhas = [["Comando", "Modo (prompt)", "Para que serve", "Aula"]]
        for x in cmds:
            linhas.append([est.code(esc(x["cmd"])), f"{esc(_modo(x['prompt']))}<br/>{est.code(esc(x['prompt']))}",
                           esc(x["explica"]), str(x["aula"])])
        s.append(tabela(linhas, 1, est, ws=[LARGURA * 0.32, LARGURA * 0.25, LARGURA * 0.35, LARGURA * 0.08]))
    else:
        s.append(Paragraph("As aulas deste módulo não têm comandos Cisco IOS.", est.corpo))
    if m.get("comandos"):
        s += [Spacer(1, 8), Paragraph("Comandos de referência do módulo", est.h3), bloco_pre(m["comandos"], est, "referência")]

    for k, l in enumerate(m["licoes"]):
        s += [NextPageTemplate("capa"), PageBreak()]
        s += historia_licao(ctx, m, l, est, pags, prefixo=f"l{k}", no_modulo=True)
    return s


def pdf_modulo(ctx: Contexto, m: dict, t: Tema) -> tuple[bytes, int]:
    registar_fontes()
    est = Estilos(t)
    return _construir(lambda pags: historia_modulo(ctx, m, est, pags), None, t, m["codigo"],
                      f"{m['codigo']} — {m['titulo']}", True, "Conteúdo programático")


# ------------------------------------------------------------------ geração de todos os PDFs
def nome_seguro(x: str) -> str:
    return re.sub(r"[^A-Za-z0-9_-]", "_", x)


_CTX: Contexto | None = None


def _init_trabalhador(c, ex):
    global _CTX
    registar_fontes()
    _CTX = Contexto(c, ex)


def _tarefa(args):
    tipo, mid, lid, destino = args
    ctx = _CTX
    m = next(x for x in ctx.c["modulos"] if x["id"] == mid)
    if tipo == "modulo":
        dados, n = pdf_modulo(ctx, m, COR)
    else:
        l = next(x for x in m["licoes"] if x["id"] == lid)
        dados, n = pdf_licao(ctx, m, l, IMPRIMIR if tipo == "imprimir" else COR)
    Path(destino).parent.mkdir(parents=True, exist_ok=True)
    Path(destino).write_bytes(dados)
    return tipo, mid, lid, n, len(dados)


def gerar_pdfs(c: dict, saida: Path, modulos: list[str] | None = None, processos: int | None = None) -> dict:
    """Gera os PDFs em `saida` e devolve o índice {licoes: {id: {...}}, modulos: {id: {...}}}."""
    import os
    from concurrent.futures import ProcessPoolExecutor

    saida = Path(saida)
    ex = gerar_exercicios(c)
    tarefas = []
    for m in c["modulos"]:
        if modulos and m["id"] not in modulos:
            continue
        mid = nome_seguro(m["id"])
        tarefas.append(("modulo", m["id"], None, str(saida / f"{mid}.pdf")))
        for l in m["licoes"]:
            lid = nome_seguro(l["id"])
            tarefas.append(("aula", m["id"], l["id"], str(saida / mid / f"{lid}.pdf")))
            tarefas.append(("imprimir", m["id"], l["id"], str(saida / "imprimir" / mid / f"{lid}.pdf")))
    indice_ant = {}
    f_ind = saida / "indice.json"
    if modulos and f_ind.exists():
        indice_ant = json.loads(f_ind.read_text(encoding="utf-8"))
    indice = {"licoes": dict(indice_ant.get("licoes", {})), "modulos": dict(indice_ant.get("modulos", {}))}
    processos = processos or min(8, os.cpu_count() or 1)
    if processos > 1 and len(tarefas) > 3:
        with ProcessPoolExecutor(processos, initializer=_init_trabalhador, initargs=(c, ex)) as pool:
            resultados = list(pool.map(_tarefa, tarefas, chunksize=2))
    else:
        _init_trabalhador(c, ex)
        resultados = [_tarefa(x) for x in tarefas]
    for tipo, mid, lid, n, tam in resultados:
        smid = nome_seguro(mid)
        if tipo == "modulo":
            indice["modulos"][mid] = {"arquivo": f"pdf/{smid}.pdf", "paginas": n, "bytes": tam}
        else:
            e = indice["licoes"].setdefault(lid, {})
            if tipo == "aula":
                e.update(arquivo=f"pdf/{smid}/{nome_seguro(lid)}.pdf", paginas=n, bytes=tam)
            else:
                e.update(imprimir=f"pdf/imprimir/{smid}/{nome_seguro(lid)}.pdf", paginas_imprimir=n)
    saida.mkdir(parents=True, exist_ok=True)
    f_ind.write_text(json.dumps(indice, ensure_ascii=False, indent=1), encoding="utf-8")
    return indice


def ler_indice(saida: Path) -> dict | None:
    f = Path(saida) / "indice.json"
    if f.exists():
        return json.loads(f.read_text(encoding="utf-8"))
    return None


def anexar_indice(c: dict, indice: dict | None) -> None:
    """Acrescenta ao curso (para a app) os caminhos e páginas dos PDFs."""
    if not indice:
        return
    for m in c["modulos"]:
        im = indice["modulos"].get(m["id"])
        if im:
            m["pdf"] = {"arquivo": im["arquivo"], "paginas": im["paginas"]}
        for l in m["licoes"]:
            il = indice["licoes"].get(l["id"])
            if il and "arquivo" in il:
                l["pdf"] = {"arquivo": il["arquivo"], "paginas": il["paginas"], "imprimir": il.get("imprimir")}


if __name__ == "__main__":
    import sys
    import time

    from conteudo import curso

    t0 = time.time()
    ind = gerar_pdfs(curso(), RAIZ / "www" / "pdf", sys.argv[1:] or None)
    print(f"{len(ind['licoes'])} aulas, {len(ind['modulos'])} módulos em {time.time() - t0:.1f} s")
