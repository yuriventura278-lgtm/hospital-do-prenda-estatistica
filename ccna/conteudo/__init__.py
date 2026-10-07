"""Conteúdo do curso “Curso de Redes de Computadores — CCNA Passo a Passo”.

A estrutura segue o conteúdo programático (programa.py): cursos (Parte A,
CCNA 1, 2, 3, complementares, projeto final) → módulos → aulas.

As aulas estão escritas nos ficheiros m00*.py … m09*.py (primeira versão do
curso, organizada por domínio do exame), introducoes.py e licoes_novas_*.py.
Para acrescentar uma aula: escreva-a com licao(...) e ponha o id na lista
``licoes`` do módulo em programa.py. Depois corra ``python build.py``.
"""

from . import (m00_do_zero, m01_fundamentos, m02_modelos, m03_enderecamento, m04_ios,
               m05_switching, m06_routing, m07_servicos, m08_seguranca,
               m09_automacao)
from .casos import CASOS
from .guia import (DICAS_EXAME, DOMINIOS_EXAME, EXPERIENCIA, FERRAMENTAS,
                   GLOSSARIO, MOTIVOS, PLANO_SEMANAL, SIM_REAL_RESUMO)
from .introducoes import INTRODUCOES
from .labs import LABS
from .licoes_novas_a import LICOES as NOVAS_A
from .licoes_novas_b import LICOES as NOVAS_B
from .narracao import video_da_licao
from .programa import CASOS_MODULO, CURSOS, EXTRA_MODULO, LABS_MODULO, PROGRAMA
from .referencias import REFERENCIAS
from .simulador import ATIVIDADES

_ANTIGOS = [m00_do_zero.MODULO, m01_fundamentos.MODULO, m02_modelos.MODULO, m03_enderecamento.MODULO,
            m04_ios.MODULO, m05_switching.MODULO, m06_routing.MODULO, m07_servicos.MODULO,
            m08_seguranca.MODULO, m09_automacao.MODULO]

# Todas as aulas, por id
LICOES = {}
for _m in _ANTIGOS:
    for _l in _m["licoes"]:
        LICOES[_l["id"]] = _l
for _l in INTRODUCOES.values():
    LICOES[_l["id"]] = _l
LICOES.update(NOVAS_A)
LICOES.update(NOVAS_B)

_EXTRA = {}
for _m in _ANTIGOS:
    _EXTRA.setdefault(EXTRA_MODULO[_m["id"]], []).extend(_m["prova_extra"])

NOME_CURSO = {c[0]: c[1] for c in CURSOS}


def _modulos() -> list[dict]:
    mods = []
    for i, p in enumerate(PROGRAMA):
        mods.append({
            "id": p["id"], "numero": i, "codigo": p["codigo"], "curso": p["curso"], "titulo": p["titulo"],
            "descricao": " · ".join(p["temas"]), "dominio": NOME_CURSO[p["curso"]], "horas": p["horas"],
            "objetivos": p["objetivos"], "temas": p["temas"], "ficha": p["ficha"], "comandos": p["comandos"],
            "sim": p["sim"], "icone": "router",
            "licoes": [LICOES[x] for x in p["licoes_ids"]],
            "prova_extra": _EXTRA.get(p["id"], []),
        })
    return mods


MODULOS = _modulos()
for _lab in LABS:
    _lab["modulo"] = LABS_MODULO[_lab["id"]]
for _c in CASOS:
    _c["modulo"] = CASOS_MODULO[_c["id"]]


def curso() -> dict:
    """Devolve todo o curso num único dicionário pronto a exportar."""
    for m in MODULOS:
        for l in m["licoes"]:
            l["video"] = video_da_licao(l, m)
    return {
        "versao": 2,
        "titulo": "Curso de Redes de Computadores",
        "cursos": [{"id": c, "titulo": t, "descricao": d, "horas": h} for c, t, d, h in CURSOS],
        "modulos": MODULOS,
        "labs": LABS,
        "casos": CASOS,
        "atividades": ATIVIDADES,
        "referencias": REFERENCIAS,
        "guia": {
            "dominios": [{"nome": n, "peso": p, "modulos": m} for n, p, m in DOMINIOS_EXAME],
            "plano": [{"semana": s, "tema": t, "pratica": p} for s, t, p in PLANO_SEMANAL],
            "dicas": DICAS_EXAME,
            "ferramentas": [{"nome": n, "desc": d, "url": u} for n, d, u in FERRAMENTAS],
            "glossario": [{"termo": t, "def": d} for t, d in GLOSSARIO],
            "motivos": MOTIVOS,
            "experiencia": [{"id": i, "nome": n, "sugestao": s} for i, n, s in EXPERIENCIA],
            "sim_real": [{"tema": t, "sim": s, "real": r} for t, s, r in SIM_REAL_RESUMO],
        },
    }
