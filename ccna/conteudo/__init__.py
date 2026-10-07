"""Conteúdo do curso CCNA Passo a Passo.

Para acrescentar um módulo: crie ``mNN_nome.py`` com uma variável ``MODULO``
e junte-o à lista ``MODULOS`` abaixo. Depois corra ``python build.py``.
"""

from . import (m01_fundamentos, m02_modelos, m03_enderecamento, m04_ios,
               m05_switching, m06_routing, m07_servicos, m08_seguranca,
               m09_automacao)
from .guia import (DICAS_EXAME, DOMINIOS_EXAME, FERRAMENTAS, GLOSSARIO,
                   PLANO_SEMANAL, SIM_REAL_RESUMO)
from .labs import LABS
from .referencias import REFERENCIAS

MODULOS = [
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


def curso() -> dict:
    """Devolve todo o curso num único dicionário pronto a exportar."""
    return {
        "versao": 1,
        "titulo": "CCNA Passo a Passo",
        "modulos": MODULOS,
        "labs": LABS,
        "referencias": REFERENCIAS,
        "guia": {
            "dominios": [{"nome": n, "peso": p, "modulos": m} for n, p, m in DOMINIOS_EXAME],
            "plano": [{"semana": s, "tema": t, "pratica": p} for s, t, p in PLANO_SEMANAL],
            "dicas": DICAS_EXAME,
            "ferramentas": [{"nome": n, "desc": d, "url": u} for n, d, u in FERRAMENTAS],
            "glossario": [{"termo": t, "def": d} for t, d in GLOSSARIO],
            "sim_real": [{"tema": t, "sim": s, "real": r} for t, s, r in SIM_REAL_RESUMO],
        },
    }
