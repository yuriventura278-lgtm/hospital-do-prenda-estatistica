"""Encontra, em cada aula, os termos técnicos do glossário que lá aparecem.

A app mostra-os no fim da aula ("Termos técnicos desta aula") com a explicação
simples de cada um, e usa-os para gerar exercícios de "o que significa…?".
"""

from __future__ import annotations

import html as _html
import re


def _texto_licao(l: dict) -> str:
    partes = [l["titulo"], " ".join(l["objetivos"])]
    for b in l["blocos"]:
        for k in ("titulo", "html", "legenda", "texto", "explica", "nota"):
            if isinstance(b.get(k), str):
                partes.append(b[k])
        if b["tipo"] == "tabela":
            partes += b["cabecalho"] + [c for linha in b["linhas"] for c in linha]
        if b["tipo"] == "cli":
            partes += [p["cmd"] + " " + p["explica"] for p in b["passos"]]
        if b["tipo"] == "sim_real":
            partes += b["simulador"] + b["real"]
    t = _html.unescape(re.sub(r"<[^>]+>", " ", " ".join(partes)))
    return re.sub(r"\s+", " ", t)


def _padrao(forma: str) -> re.Pattern | None:
    f = forma.strip()
    if len(f) < 3 and not f.isupper():
        return None
    sigla = f.isupper() or bool(re.fullmatch(r"[A-Z0-9][A-Za-z0-9./+-]*[A-Z0-9+]", f)) and sum(c.isupper() for c in f) >= 2
    corpo = re.escape(f)
    return re.compile(rf"(?<![\w-]){corpo}(?![\w-])", 0 if sigla else re.IGNORECASE)


def preparar(glossario: list[dict]) -> list[tuple[str, list[re.Pattern]]]:
    out = []
    for t in glossario:
        formas = [t["termo"]] + [v for v in t.get("variantes", []) if len(v) >= 4 or v.isupper()]
        pads = [p for p in (_padrao(f) for f in formas) if p]
        if pads:
            out.append((t["termo"], pads))
    return out


def termos_da_licao(l: dict, preparado: list[tuple[str, list[re.Pattern]]], maximo: int = 40) -> list[str]:
    texto = _texto_licao(l)
    achados = []
    for nome, pads in preparado:
        pos = min((m.start() for p in pads for m in [p.search(texto)] if m), default=None)
        if pos is not None:
            achados.append((pos, nome))
    achados.sort()
    return [n for _, n in achados[:maximo]]


def protocolos_da_licao(l: dict, protocolos: list[dict]) -> list[str]:
    texto = _texto_licao(l)
    ids = []
    for p in protocolos:
        siglas = [s.strip() for s in re.split(r"[/(),]| e ", p["sigla"]) if len(s.strip()) >= 2]
        if any(re.search(rf"(?<![\w-]){re.escape(s)}(?![\w-])", texto) for s in siglas):
            ids.append(p["id"])
    return ids
