"""Blocos de construção do conteúdo do curso CCNA.

Cada lição é um dicionário simples. Estas funções existem para que escrever
conteúdo novo seja rápido e legível: em vez de montar dicionários à mão,
chama-se ``texto(...)``, ``cli(...)``, ``mc(...)`` e assim por diante.

O ``build.py`` lê todos os módulos, valida-os e exporta-os para JSON, que é o
que a aplicação móvel (pasta ``www``) consome.
"""

from __future__ import annotations


# ---------------------------------------------------------------------------
# Blocos de conteúdo de uma lição
# ---------------------------------------------------------------------------

def texto(titulo: str, html: str) -> dict:
    """Parágrafos de explicação. Aceita HTML simples (<p>, <ul>, <b>, <code>)."""
    return {"tipo": "texto", "titulo": titulo, "html": html.strip()}


def figura(nome: str, legenda: str) -> dict:
    """Ilustração de um dispositivo ou conceito desenhada em SVG pela app.

    Nomes disponíveis (ver www/js/figuras.js): router, switch, switch_l3,
    firewall, ap, wlc, pc, portatil, servidor, nuvem, telefone_ip, cabo_utp,
    cabo_fibra, cabo_consola, rj45_pinos, osi, encapsulamento, handshake,
    painel_switch, painel_router, stp, trama_ethernet, cabecalho_ipv4,
    cabecalho_ipv6, nat, sdn.
    """
    return {"tipo": "figura", "nome": nome, "legenda": legenda}


def topologia(nos: list[tuple], ligacoes: list[tuple], legenda: str) -> dict:
    """Diagrama de rede.

    ``nos``: lista de (id, tipo, x, y, rótulo) com x/y numa grelha 0-100.
    ``ligacoes``: lista de (id_a, id_b, rótulo_opcional).
    """
    return {
        "tipo": "topologia",
        "nos": [
            {"id": n[0], "tipo": n[1], "x": n[2], "y": n[3], "rotulo": n[4]}
            for n in nos
        ],
        "ligacoes": [
            {"a": l[0], "b": l[1], "rotulo": l[2] if len(l) > 2 else ""}
            for l in ligacoes
        ],
        "legenda": legenda,
    }


def exemplo(titulo: str, html: str) -> dict:
    """Exemplo prático, situação do dia a dia ou cálculo resolvido."""
    return {"tipo": "exemplo", "titulo": titulo, "html": html.strip()}


def cli(titulo: str, passos: list[tuple], nota: str = "") -> dict:
    """Configuração passo a passo no Cisco IOS.

    ``passos``: lista de (prompt, comando, explicação). Ex.:
    ("R1(config)#", "hostname R1", "Dá nome ao equipamento").
    """
    return {
        "tipo": "cli",
        "titulo": titulo,
        "passos": [
            {"prompt": p[0], "cmd": p[1], "explica": p[2]} for p in passos
        ],
        "nota": nota,
    }


def saida(titulo: str, texto_saida: str, explica: str = "") -> dict:
    """Saída de um comando ``show`` tal como aparece no terminal."""
    return {
        "tipo": "saida",
        "titulo": titulo,
        "texto": texto_saida.strip("\n"),
        "explica": explica,
    }


def sim_real(simulador: list[str], real: list[str],
             titulo: str = "Simulador × Equipamento real") -> dict:
    """Diferenças entre fazer no Packet Tracer/GNS3 e num equipamento físico."""
    return {"tipo": "sim_real", "titulo": titulo,
            "simulador": simulador, "real": real}


def dica(html: str) -> dict:
    return {"tipo": "dica", "html": html.strip()}


def alerta(html: str) -> dict:
    return {"tipo": "alerta", "html": html.strip()}


def tabela(cabecalho: list[str], linhas: list[list[str]], titulo: str = "") -> dict:
    return {"tipo": "tabela", "titulo": titulo,
            "cabecalho": cabecalho, "linhas": linhas}


def video(titulo: str, arquivo: str) -> dict:
    """Vídeo gravado, guardado dentro da app (ex.: ``videos/m3l0.mp4`` na pasta www).

    Não é obrigatório: TODAS as lições já têm uma vídeo-aula narrada, gerada
    automaticamente a partir do conteúdo (ver conteudo/narracao.py). Use isto
    apenas para juntar um vídeo gravado por um professor.
    """
    return {"tipo": "video", "titulo": titulo, "arquivo": arquivo}


# ---------------------------------------------------------------------------
# Perguntas (quiz da lição e prova do módulo)
# ---------------------------------------------------------------------------

def mc(pergunta: str, opcoes: list[str], correta: int, explica: str) -> dict:
    """Escolha múltipla. ``correta`` é o índice (0 = primeira opção)."""
    return {"tipo": "mc", "p": pergunta, "opcoes": opcoes,
            "correta": correta, "explica": explica}


def vf(pergunta: str, correta: bool, explica: str) -> dict:
    """Verdadeiro ou falso."""
    return {"tipo": "vf", "p": pergunta, "correta": correta, "explica": explica}


def cmd(pergunta: str, respostas: list[str], explica: str) -> dict:
    """Pergunta de escrever o comando. ``respostas`` são as formas aceites
    (a app ignora maiúsculas e espaços repetidos)."""
    return {"tipo": "cmd", "p": pergunta, "respostas": respostas,
            "explica": explica}


# ---------------------------------------------------------------------------
# Lição e módulo
# ---------------------------------------------------------------------------

def licao(id: str, titulo: str, minutos: int, objetivos: list[str],
          blocos: list[dict], quiz: list[dict], referencias: list[str],
          nivel: str = "básico") -> dict:
    return {
        "id": id,
        "titulo": titulo,
        "minutos": minutos,
        "nivel": nivel,
        "objetivos": objetivos,
        "blocos": blocos,
        "quiz": quiz,
        "referencias": referencias,
    }


def modulo(id: str, numero: int, titulo: str, descricao: str, dominio: str,
           licoes: list[dict], prova_extra: list[dict] | None = None,
           icone: str = "router") -> dict:
    return {
        "id": id,
        "numero": numero,
        "titulo": titulo,
        "descricao": descricao,
        "dominio": dominio,
        "icone": icone,
        "licoes": licoes,
        "prova_extra": prova_extra or [],
    }
