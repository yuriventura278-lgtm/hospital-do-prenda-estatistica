"""Validação do conteúdo: apanha erros antes de chegarem à app."""

from __future__ import annotations

import re

TIPOS_BLOCO = {"texto", "figura", "topologia", "exemplo", "cli", "saida",
               "sim_real", "dica", "alerta", "tabela", "video", "jogo_cabo"}
FIGURAS = {"router", "switch", "switch_l3", "firewall", "ap", "wlc", "pc",
           "portatil", "servidor", "nuvem", "telefone_ip", "cabo_utp",
           "cabo_fibra", "cabo_consola", "rj45_pinos", "osi", "encapsulamento",
           "handshake", "painel_switch", "painel_router", "stp",
           "trama_ethernet", "cabecalho_ipv4", "cabecalho_ipv6", "nat", "sdn",
           "computador_partes", "linha_tempo", "conectores", "ferramentas_cabo"}
NOS_TOPOLOGIA = {"router", "switch", "switch_l3", "firewall", "ap", "wlc", "pc",
                 "portatil", "servidor", "nuvem", "telefone_ip"}
CHECKS = {"mode", "ran", "hostname", "iface_ip", "iface_up", "iface_desc",
          "enable_secret", "line_login", "vty_ssh", "domain", "rsa", "user",
          "banner", "no_domain_lookup", "pwd_enc", "saved", "vlan",
          "access_vlan", "access_mode", "trunk", "native", "nonegotiate",
          "route", "ospf", "ospf_net", "ospf_rid", "passive", "subif",
          "ip_routing", "svi", "dhcp_pool", "dhcp_excl", "dhcp_gw", "dhcp_dns",
          "portsec", "portsec_max", "portsec_sticky", "nat_inside",
          "nat_outside", "nat_overload", "acl_std", "ipv6_routing"}


def _pergunta(q: dict, onde: str, erros: list[str]) -> None:
    if not q.get("p") or not q.get("explica"):
        erros.append(f"{onde}: pergunta sem texto ou sem explicação")
    if q["tipo"] == "mc":
        if len(q["opcoes"]) < 2:
            erros.append(f"{onde}: menos de 2 opções")
        if not 0 <= q["correta"] < len(q["opcoes"]):
            erros.append(f"{onde}: índice da resposta correta fora do intervalo")
        if len(set(q["opcoes"])) != len(q["opcoes"]):
            erros.append(f"{onde}: opções repetidas")
    elif q["tipo"] == "vf":
        if not isinstance(q["correta"], bool):
            erros.append(f"{onde}: resposta V/F tem de ser True ou False")
    elif q["tipo"] in ("cmd", "valor"):
        if not q["respostas"]:
            erros.append(f"{onde}: pergunta de comando sem respostas aceites")
    else:
        erros.append(f"{onde}: tipo de pergunta desconhecido {q['tipo']!r}")


def validar(curso: dict) -> list[str]:
    erros: list[str] = []
    refs = curso["referencias"]
    ids: set[str] = set()
    for m in curso["modulos"]:
        if m["id"] in ids:
            erros.append(f"id repetido {m['id']}")
        ids.add(m["id"])
        if not m["licoes"]:
            erros.append(f"{m['id']}: módulo sem lições")
        for i, q in enumerate(m["prova_extra"]):
            _pergunta(q, f"{m['id']} prova #{i + 1}", erros)
        for l in m["licoes"]:
            onde = l["id"]
            if l["id"] in ids:
                erros.append(f"id repetido {l['id']}")
            ids.add(l["id"])
            if len(l["quiz"]) < 3:
                erros.append(f"{onde}: o quiz precisa de pelo menos 3 perguntas")
            if not l["referencias"]:
                erros.append(f"{onde}: lição sem referências bibliográficas")
            for r in l["referencias"]:
                if r not in refs:
                    erros.append(f"{onde}: referência desconhecida {r!r}")
            for b in l["blocos"]:
                if b["tipo"] not in TIPOS_BLOCO:
                    erros.append(f"{onde}: bloco desconhecido {b['tipo']!r}")
                if b["tipo"] == "figura" and b["nome"] not in FIGURAS:
                    erros.append(f"{onde}: figura desconhecida {b['nome']!r}")
                if b["tipo"] == "topologia":
                    nos = {n["id"] for n in b["nos"]}
                    for n in b["nos"]:
                        if n["tipo"] not in NOS_TOPOLOGIA:
                            erros.append(f"{onde}: nó de topologia desconhecido {n['tipo']!r}")
                    for lg in b["ligacoes"]:
                        if lg["a"] not in nos or lg["b"] not in nos:
                            erros.append(f"{onde}: ligação para nó inexistente {lg}")
            if "video" in l:
                cobertos = {c["bloco"] for c in l["video"]["cenas"]}
                for i, b in enumerate(l["blocos"]):
                    if b["tipo"] != "video" and i not in cobertos:
                        erros.append(f"{onde}: o bloco {i + 1} ({b['tipo']}) não aparece na vídeo-aula")
                for c in l["video"]["cenas"]:
                    for f in c["falas"]:
                        if re.search(r"</?(p|b|i|li|ul|ol|code|pre|br|sup)>", f["f"] + f["t"]):
                            erros.append(f"{onde}: fala com HTML por limpar: {f['t'][:40]}")
            for i, q in enumerate(l["quiz"]):
                _pergunta(q, f"{onde} quiz #{i + 1}", erros)
    for lab in curso["labs"]:
        if lab["modulo"] not in ids:
            erros.append(f"{lab['id']}: módulo {lab['modulo']!r} não existe")
        for t in lab["tarefas"]:
            if t["check"]["t"] not in CHECKS:
                erros.append(f"{lab['id']}: verificação desconhecida {t['check']['t']!r}")
    for c in curso.get("casos", []):
        if c["modulo"] not in ids:
            erros.append(f"{c['id']}: módulo {c['modulo']!r} não existe")
        if len(c["etapas"]) < 3:
            erros.append(f"{c['id']}: um caso precisa de pelo menos 3 etapas")
        for i, q in enumerate(c["etapas"]):
            _pergunta(q, f"{c['id']} etapa #{i + 1}", erros)
    usadas: dict[str, str] = {}
    for m in curso["modulos"]:
        for l in m["licoes"]:
            if l["id"] in usadas:
                erros.append(f"aula {l['id']} aparece em {usadas[l['id']]} e em {m['id']}")
            usadas[l["id"]] = m["id"]
        total = sum(len(l["quiz"]) for l in m["licoes"]) + len(m["prova_extra"])
        if total < 3:
            erros.append(f"{m['id']}: a prova do módulo precisa de pelo menos 3 perguntas")
        if not m["ficha"]:
            erros.append(f"{m['id']}: módulo sem ficha de trabalho")
    ativ = {a["id"] for a in curso.get("atividades", [])}
    for m in curso["modulos"]:
        for s_id in m["sim"]:
            if s_id not in ativ:
                erros.append(f"{m['id']}: atividade de simulador inexistente {s_id!r}")
    CHECKS_SIM = {"tem", "ligado_tipo", "cabo", "cabos_ok", "pc_ip", "pc_rede", "ping", "ping_tipo", "ios", "dhcp", "ospf_viz", "dns", "srv_dhcp", "e", "partilha", "fw_partilha", "mapa", "ficheiro_partilha"}
    def _chk(c, onde):
        if c["t"] not in CHECKS_SIM:
            erros.append(f"{onde}: verificação de simulador desconhecida {c['t']!r}")
        if c["t"] == "ios" and c["check"]["t"] not in CHECKS:
            erros.append(f"{onde}: verificação IOS desconhecida {c['check']['t']!r}")
        for x in c.get("lista", []):
            _chk(x, onde)
    for a in curso.get("atividades", []):
        if a["modulo"] not in ids:
            erros.append(f"{a['id']}: módulo {a['modulo']!r} não existe")
        nomes = {d["nome"] for d in a["inicial"]["dispositivos"]}
        for lg in a["inicial"]["ligacoes"]:
            if lg["a"] not in nomes or lg["b"] not in nomes:
                erros.append(f"{a['id']}: ligação com equipamento inexistente")
        for p in a["passos"]:
            _chk(p["check"], a["id"])
    for lab in curso["labs"]:
        if not lab.get("cenario"):
            erros.append(f"{lab['id']}: laboratório sem cenário real")
    from .projetos import validar_projetos
    erros += validar_projetos(curso, CHECKS_SIM, CHECKS)
    from .explicacoes import validar_explicacoes
    erros += validar_explicacoes(curso)
    return erros
