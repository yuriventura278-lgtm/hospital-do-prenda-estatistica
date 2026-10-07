"""Que exercícios gerados pertencem a cada aula.

Os geradores estão em www/js/exercicios.js (cada um cria exercícios novos sem
fim, com resolução passo a passo). Aqui escolhe-se, para cada aula, de que
geradores tiram os exercícios. Todas as aulas usam também as perguntas do quiz
("quiz"), os termos técnicos da aula ("termos", "siglas") e os protocolos que a
aula menciona ("protocolos").

Cada aula tem 10 exercícios obrigatórios; depois o aluno pode continuar a
praticar quanto quiser.
"""

OBRIGATORIOS = 10

BIN = ["dec_bin", "bin_dec", "ip_bin", "bin_ip"]
SUB = ["sub_rede", "sub_broadcast", "sub_primeiro", "sub_ultimo", "sub_hosts", "sub_mesma"]

POR_LICAO = {
    "m0l8": BIN + ["dec_hex"],
    "n_conv_bin": BIN + ["bits_mascara"],
    "n_conv_hex": ["dec_hex", "hex_bin", "dec_bin", "bin_dec"],
    "n_itn5": BIN + ["dec_hex", "hex_bin"],
    "m3l0": ["classe", "privado", "ip_bin"],
    "n_classes": ["classe", "privado", "mascara_defeito"],
    "m3l1": ["ip_bin", "bits_mascara", "prefixo_mascara", "mascara_prefixo", "classe"],
    "n_mascaras": ["prefixo_mascara", "mascara_prefixo", "wildcard", "hosts_prefixo", "bits_mascara"],
    "n_sub_passo": SUB,
    "m3l2": SUB + ["prefixo_hosts", "prefixo_redes"],
    "n_sub_dividir": ["prefixo_redes", "sub_n", "prefixo_hosts", "hosts_prefixo"],
    "m3l3": ["vlsm", "sub_n", "prefixo_hosts"],
    "n_vlsm_desenho": ["vlsm", "prefixo_hosts", "sub_n"],
    "m2l1": ["osi_camada", "pdu"],
    "n_osi_fundo": ["osi_camada", "pdu", "tcpip_camada"],
    "m2l2": ["tcpip_camada", "pdu"],
    "n_tcpip_fundo": ["tcpip_camada", "pdu", "porta", "tcp_udp"],
    "m2l3": ["porta", "tcp_udp"],
    "m2l4": ["osi_camada"],
    "n_itn8": ["sub_mesma", "sub_rede"],
    "n_itn15": ["porta", "tcp_udp"],
    "m7l0": ["porta"],
    "m7l1": ["porta"],
    "n_ensa4": ["wildcard"],
    "m8l2": ["wildcard", "porta"],
    "m6l1": ["sub_mesma", "sub_rede"],
    "m6l2": ["sub_rede", "prefixo_mascara"],
    "n_part_conceitos": ["porta"],
}


def exercicios_da_licao(l: dict, m: dict) -> dict:
    """Lista de geradores (com repetições = mais peso) e número obrigatório."""
    calc = POR_LICAO.get(l["id"], [])
    lista = calc * 3 + ["quiz", "quiz", "termos", "siglas"]
    if l.get("protocolos"):
        lista.append("protocolos")
    return {"geradores": lista, "obrigatorios": OBRIGATORIOS}
