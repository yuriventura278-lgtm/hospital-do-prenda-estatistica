"""Conteúdo do curso CCNA Passo a Passo.

Para acrescentar um módulo: crie ``mNN_nome.py`` com uma variável ``MODULO``
e junte-o à lista ``MODULOS`` abaixo. Depois corra ``python build.py``.
"""

from . import (m00_do_zero, m01_fundamentos, m02_modelos, m03_enderecamento, m04_ios,
               m05_switching, m06_routing, m07_servicos, m08_seguranca,
               m09_automacao)
from .guia import (DICAS_EXAME, DOMINIOS_EXAME, EXPERIENCIA, FERRAMENTAS,
                   GLOSSARIO, MOTIVOS, PLANO_SEMANAL, SIM_REAL_RESUMO)
from .casos import CASOS
from .introducoes import INTRODUCOES
from .labs import LABS
from .narracao import video_da_licao
from .referencias import REFERENCIAS

MODULOS = [
    m00_do_zero.MODULO,
    m01_fundamentos.MODULO,
    m02_modelos.MODULO,
    m03_enderecamento.MODULO,
    m04_ios.MODULO,
    m05_switching.MODULO,
    m06_routing.MODULO,
    m07_servicos.MODULO,
    m08_seguranca.MODULO,
    m09_automacao.MODULO,
]

# A aula “Comece por aqui” de cada módulo entra como primeira lição.
for _m in MODULOS:
    if _m["id"] in INTRODUCOES and _m["licoes"][0]["id"] != INTRODUCOES[_m["id"]]["id"]:
        _m["licoes"].insert(0, INTRODUCOES[_m["id"]])


def curso() -> dict:
    """Devolve todo o curso num único dicionário pronto a exportar."""
    # vídeo-aula de cada lição, gerada a partir de todo o conteúdo
    for m in MODULOS:
        for l in m["licoes"]:
            l["video"] = video_da_licao(l, m)
    return {
        "versao": 1,
        "titulo": "CCNA Passo a Passo",
        "modulos": MODULOS,
        "labs": LABS,
        "casos": CASOS,
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
