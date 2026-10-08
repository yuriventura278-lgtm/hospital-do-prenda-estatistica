"""Explicações detalhadas das perguntas do quiz e das provas.

Os textos estão em ``explicacoes_1.py`` … ``explicacoes_N.py`` (uma lista
``ENTRADAS`` de tuplos ``(pergunta, explicação longa, {opção: porquê})``).
``aplicar(modulos)`` junta-os às perguntas:

* ``explica_longa`` — porque é que a resposta certa é a certa (conceito + exemplo/dica);
* ``porque`` — só nas de escolha múltipla: lista alinhada com ``opcoes``; para cada
  opção, porque está certa ou errada.

A chave é o texto exato da pergunta; nas de escolha múltipla, cada opção é
procurada pelo seu texto, por isso baralhar ou reordenar as opções não estraga nada.
"""

from __future__ import annotations

import importlib
import pkgutil
from pathlib import Path

EXPLICACOES: dict[str, dict] = {}


def _carregar() -> None:
    pasta = Path(__file__).parent
    for info in sorted(pkgutil.iter_modules([str(pasta)]), key=lambda i: i.name):
        if not info.name.startswith("explicacoes_"):
            continue
        mod = importlib.import_module(f"{__package__}.{info.name}")
        for e in mod.ENTRADAS:
            p, longa = e[0], e[1]
            ops = e[2] if len(e) > 2 else {}
            atual = EXPLICACOES.setdefault(p, {"longa": longa, "opcoes": {}})
            atual["opcoes"].update(ops)


_carregar()


def _aplicar_pergunta(q: dict) -> None:
    e = EXPLICACOES.get(q["p"])
    if not e:
        return
    q["explica_longa"] = e["longa"]
    if q["tipo"] == "mc":
        q["porque"] = [e["opcoes"].get(o, "") for o in q["opcoes"]]


def perguntas_de(modulos: list[dict]):
    for m in modulos:
        for l in m["licoes"]:
            yield from l["quiz"]
        yield from m["prova_extra"]


def aplicar(modulos: list[dict]) -> None:
    for q in perguntas_de(modulos):
        _aplicar_pergunta(q)
