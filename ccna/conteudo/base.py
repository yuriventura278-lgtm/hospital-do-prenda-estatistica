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


def jogo_cabo(norma: str = "T568B") -> dict:
    """Jogo interativo: o aluno coloca os 8 fios pela ordem certa no conector RJ45."""
    return {"tipo": "jogo_cabo", "norma": norma}


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


def valor(pergunta: str, respostas: list[str], explica: str) -> dict:
    """Pergunta de resposta escrita (um número, um endereço, uma palavra).
    ``respostas`` são as formas aceites (a app ignora maiúsculas e espaços)."""
    return {"tipo": "valor", "p": pergunta, "respostas": respostas, "explica": explica}


# ---------------------------------------------------------------------------
# Glossário, protocolos e estágio profissional
# ---------------------------------------------------------------------------

def termo(nome: str, definicao: str, extenso: str = "", exemplo: str = "",
          categoria: str = "geral", variantes: list[str] | None = None) -> dict:
    """Termo técnico explicado em linguagem simples.

    ``nome``: como aparece no texto (ex.: "DHCP", "gateway", "máscara de sub-rede").
    ``extenso``: o que a sigla significa (ex.: "Dynamic Host Configuration Protocol").
    ``definicao``: 1 a 3 frases simples, sem jargão por explicar.
    ``exemplo``: uma situação do dia a dia ou um valor concreto.
    ``variantes``: outras formas que aparecem no texto (plural, sinónimos) para a app
    encontrar o termo nas aulas.
    """
    return {"termo": nome, "extenso": extenso, "def": definicao.strip(), "exemplo": exemplo.strip(),
            "categoria": categoria, "variantes": variantes or []}


def protocolo(id: str, sigla: str, nome: str, categoria: str, camada_osi: int, camada_tcpip: str,
              transporte: str, portas: str, para_que: str, como_funciona: list[str], exemplo: str,
              comandos: list[tuple] | None = None, seguranca: str = "", norma: str = "") -> dict:
    """Ficha de um protocolo de rede.

    ``camada_osi``: 1 a 7. ``camada_tcpip``: "Acesso à rede", "Internet", "Transporte" ou "Aplicação".
    ``transporte``: "TCP", "UDP", "TCP e UDP" ou "—" (não usa TCP/UDP).
    ``portas``: ex. "80" ou "67 (servidor), 68 (cliente)" ou "—".
    ``como_funciona``: passos curtos, pela ordem em que acontecem.
    ``comandos``: lista de (comando, explicação) para ver ou configurar (Cisco, Windows ou Linux).
    """
    return {"id": id, "sigla": sigla, "nome": nome, "categoria": categoria, "camada_osi": camada_osi,
            "camada_tcpip": camada_tcpip, "transporte": transporte, "portas": portas, "para_que": para_que.strip(),
            "como_funciona": como_funciona, "exemplo": exemplo.strip(),
            "comandos": [{"cmd": c[0], "explica": c[1]} for c in (comandos or [])],
            "seguranca": seguranca.strip(), "norma": norma}


def instrutor(titulo: str, pedido: str, passos: list[tuple], licao: str) -> dict:
    """Ticket resolvido pelo instrutor, passo a passo, à frente do estagiário.

    ``pedido``: o que o cliente/colega escreveu no ticket (linguagem real, com sintomas).
    ``passos``: lista de (o que o instrutor faz, porquê / o que observou, comando ou cálculo — pode ser "").
    ``licao``: a lição a reter, numa frase.
    """
    return {"titulo": titulo, "pedido": pedido.strip(),
            "passos": [{"acao": p[0], "explica": p[1], "cmd": p[2] if len(p) > 2 else ""} for p in passos],
            "licao": licao}


def tarefa(titulo: str, pedido: str, pergunta: dict, dica: str = "") -> dict:
    """Tarefa que o estagiário resolve sozinho. ``pergunta`` é mc(), vf(), cmd() ou valor()."""
    return {"titulo": titulo, "pedido": pedido.strip(), "pergunta": pergunta, "dica": dica}


def estagio(empresa: str, instrutor_: dict, tarefas: list[dict]) -> dict:
    """Estágio de um módulo: primeiro o instrutor resolve um caso, depois o estagiário faz as tarefas (nota 0-20)."""
    return {"empresa": empresa, "instrutor": instrutor_, "tarefas": tarefas}
