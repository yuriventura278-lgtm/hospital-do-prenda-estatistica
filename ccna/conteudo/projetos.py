"""Projetos reais (separador Jogar › Projetos reais).

Cada projeto é um pedido de um cliente real (um escritório, uma loja, um
hospital, uma escola…) resolvido do princípio ao fim, passo a passo, com todos
os comandos explicados: o que fazem e PORQUE se usam naquele projeto.

Os projetos vão do mais básico ao mais complexo. Cada um abre no Simulador de
rede como atividade guiada: a topologia inicial está em ``inicial`` e os passos
(``passos``) são gerados a partir das etapas, com a verificação automática
(``check``) de cada etapa. O teste ``tests/projetos.cjs`` resolve todos os
projetos sozinho, só com os comandos e ações aqui escritos.

Estrutura de uma etapa:
- titulo, o_que_fazer, porque
- comandos: [{em: equipamento, linhas: [{cmd, explica, porque}]}]   (terminal Cisco)
- acoes: [{t, txt, ...}]   ações fora do terminal (cabos, IP dos PCs, Wi-Fi, servidor…)
- verificar: [{como, esperado}]
- check: verificação do simulador (ver simulador.py e www/js/simulador.js)
"""

from __future__ import annotations

import re

G0, G1, G2 = "GigabitEthernet0/0/0", "GigabitEthernet0/0/1", "GigabitEthernet0/0/2"
GI1, GI2 = "GigabitEthernet0/1", "GigabitEthernet0/2"
FA0 = "FastEthernet0"
M24, M30, M29 = "255.255.255.0", "255.255.255.252", "255.255.255.248"


def fa(n):
    return f"FastEthernet0/{n}"


# ---------------------------------------------------------------- explicações automáticas dos comandos comuns
# (padrão, o que faz, porque se usa). Quando um comando de uma etapa não traz explicação, usa-se esta.
_AUTO = [
    (r"enable$", "Entra no modo privilegiado (o prompt passa de > para #).", "Só no modo privilegiado se pode ver toda a configuração e entrar no modo de configuração."),
    (r"configure terminal$", "Entra no modo de configuração global (config)#.", "Todas as alterações à configuração começam aqui."),
    (r"end$", "Sai de qualquer modo de configuração e volta ao modo privilegiado #.", "É daqui que se verifica (show) e se guarda o trabalho."),
    (r"exit$", "Sobe um nível (por exemplo, de (config-if)# para (config)#).", "Para sair do submodo atual e continuar noutro."),
    (r"hostname (\S+)$", "Dá o nome {1} ao equipamento (aparece no prompt).", "Com vários equipamentos é essencial saber, pelo prompt, em qual se está a escrever. O nome também identifica o equipamento no CDP, no SSH e nos registos."),
    (r"enable secret (\S+)$", "Protege o modo privilegiado com uma palavra-passe guardada cifrada (hash).", "Sem isto, quem chegar à consola ou à rede pode mudar tudo. O 'secret' é cifrado; o antigo 'enable password' não."),
    (r"service password-encryption$", "Cifra (de forma simples) as palavras-passe que aparecem em texto claro na configuração.", "Evita que alguém leia as palavras-passe por cima do ombro ou num backup da configuração."),
    (r"no ip domain-lookup$", "Desliga a tentativa de traduzir comandos mal escritos em nomes DNS.", "Poupa os 30 segundos de espera quando se escreve mal um comando."),
    (r"banner motd (.+)$", "Mostra um aviso legal a quem se liga ao equipamento.", "Avisa que o acesso não autorizado é proibido: em muitos países é necessário para se poder agir legalmente contra intrusos."),
    (r"line console 0$", "Entra na configuração da porta de consola (o cabo azul).", "A consola dá acesso total ao equipamento; tem de ser protegida."),
    (r"line vty 0 4$", "Entra na configuração das 5 linhas de acesso remoto (Telnet/SSH).", "É por aqui que os técnicos entram pela rede."),
    (r"password (\S+)$", "Define a palavra-passe da linha.", "Sem palavra-passe, a linha não pede nada a quem se liga."),
    (r"login$", "Obriga a pedir a palavra-passe da linha.", "A palavra-passe só é pedida com 'login'."),
    (r"login local$", "Pede utilizador e palavra-passe da base de dados local (comando username).", "Cada técnico entra com o seu nome: fica registado quem fez o quê."),
    (r"transport input ssh$", "Só aceita SSH nas linhas remotas (recusa Telnet).", "O Telnet envia tudo, incluindo palavras-passe, em texto claro. O SSH cifra a sessão."),
    (r"ip domain-name (\S+)$", "Define o domínio {1}.", "É obrigatório para gerar as chaves RSA do SSH (o nome da chave é hostname.domínio)."),
    (r"crypto key generate rsa.*$", "Gera o par de chaves RSA que o SSH usa para cifrar.", "Sem chaves não há SSH. 2048 bits é o mínimo recomendado hoje."),
    (r"username (\S+) secret (\S+)$", "Cria o utilizador {1} com palavra-passe cifrada.", "É com esta conta que se entra por SSH (login local)."),
    (r"ip ssh version 2$", "Aceita apenas a versão 2 do SSH.", "A versão 1 tem falhas de segurança conhecidas."),
    (r"interface range (.+)$", "Configura várias interfaces de uma vez ({1}).", "Poupa tempo e evita esquecer uma porta."),
    (r"interface (vlan|Vlan) ?(\d+)$", "Cria/entra na interface virtual (SVI) da VLAN {2}.", "A SVI é o 'cérebro' IP da VLAN dentro do switch: serve para gestão ou como gateway."),
    (r"interface (\S+)\.(\d+)$", "Cria a subinterface {1}.{2} (uma interface lógica dentro da física).", "Cada VLAN precisa do seu gateway; com subinterfaces, um único cabo serve todas as VLANs."),
    (r"interface port-channel (\d+)$", "Entra na interface lógica Port-channel {1} (o conjunto dos cabos do EtherChannel).", "A configuração de camada 2 (trunk, VLANs) faz-se no Port-channel e aplica-se a todos os membros."),
    (r"switchport trunk encapsulation dot1q$", "Escolhe o trunk 802.1Q (norma IEEE).", "No switch multicamada o modo trunk só é aceite depois de escolher o encapsulamento."),
    (r"interface (\S+)$", "Entra na configuração da interface {1}.", "As definições seguintes aplicam-se só a esta porta."),
    (r"description (.+)$", "Escreve uma descrição na interface: “{1}”.", "Daqui a um ano, quem abrir a configuração sabe logo para onde vai cada cabo."),
    (r"ip address (\S+) (\S+)$", "Dá o endereço {1} com a máscara {2} à interface.", "Sem IP a interface não comunica na camada 3; este IP é o que está no plano de endereçamento."),
    (r"no shutdown$", "Liga a interface (por defeito as portas de um router vêm desligadas).", "Sem isto a interface fica 'administratively down' e nada passa."),
    (r"shutdown$", "Desliga a interface.", "Uma porta desligada não pode ser usada por ninguém."),
    (r"vlan (\d+)$", "Cria a VLAN {1} e entra na sua configuração.", "Cada VLAN é uma rede separada dentro do mesmo switch: separa serviços e reduz broadcasts."),
    (r"name (\S+)$", "Dá o nome {1} à VLAN.", "O número sozinho não diz nada; o nome documenta para que serve."),
    (r"switchport mode access$", "Põe a porta em modo de acesso (pertence a uma só VLAN).", "As portas dos PCs, impressoras e servidores são de acesso: o equipamento final não percebe etiquetas 802.1Q."),
    (r"switchport access vlan (\d+)$", "Coloca a porta na VLAN {1}.", "É isto que decide a que rede o equipamento ligado pertence."),
    (r"switchport mode trunk$", "Põe a porta em modo trunk (leva várias VLANs, com etiqueta 802.1Q).", "Entre switches, e do switch para o router, o mesmo cabo tem de levar todas as VLANs."),
    (r"switchport trunk native vlan (\d+)$", "Define a VLAN nativa {1} (a que passa sem etiqueta no trunk).", "Usar uma VLAN nativa sem uso (em vez da VLAN 1) evita ataques de VLAN hopping. Tem de ser igual nos dois lados."),
    (r"switchport trunk allowed vlan (.+)$", "Só deixa passar no trunk as VLANs {1}.", "Princípio do mínimo necessário: VLANs que não precisam de passar não passam."),
    (r"switchport nonegotiate$", "Desliga o DTP (negociação automática de trunk).", "Impede que um equipamento ligado à porta negocie um trunk sem autorização."),
    (r"switchport port-security$", "Liga a segurança da porta (limita os endereços MAC aceites).", "Impede que alguém troque o PC por outro equipamento ou ligue um switch pirata à tomada."),
    (r"switchport port-security maximum (\d+)$", "Aceita no máximo {1} endereço(s) MAC nesta porta.", "Limita quantos equipamentos se podem ligar pela mesma tomada."),
    (r"switchport port-security mac-address sticky$", "Aprende sozinho o MAC do equipamento ligado e guarda-o na configuração.", "Não é preciso escrever o MAC à mão; o primeiro equipamento ligado fica 'colado' à porta."),
    (r"switchport port-security violation (\S+)$", "Em caso de violação faz: {1}.", "'shutdown' desliga a porta (err-disabled); 'restrict' só descarta e regista; 'protect' só descarta."),
    (r"spanning-tree portfast$", "A porta passa logo a encaminhar quando se liga um PC (salta os 30 s do STP).", "Os PCs recebem IP por DHCP mais depressa. Só em portas de equipamentos finais."),
    (r"spanning-tree bpduguard enable$", "Desliga a porta se receber BPDUs (sinal de que alguém ligou um switch).", "Protege a topologia do STP contra switches ligados por engano numa tomada de utilizador."),
    (r"spanning-tree mode rapid-pvst$", "Usa o Rapid PVST+ (convergência em 1 a 2 segundos).", "O STP clássico demora 30 a 50 s a recuperar de uma falha: numa rede crítica é demasiado."),
    (r"spanning-tree vlan (\S+) root primary$", "Torna este switch a raiz (root bridge) do STP na(s) VLAN(s) {1} (prioridade 24576).", "A raiz deve ser o switch central e mais robusto, não o que tiver o MAC mais baixo por acaso."),
    (r"spanning-tree vlan (\S+) root secondary$", "Torna este switch a raiz de reserva na(s) VLAN(s) {1} (prioridade 28672).", "Se a raiz falhar, sabe-se exatamente qual a substitui."),
    (r"channel-group (\d+) mode (\S+)$", "Junta a porta ao EtherChannel {1} em modo {2}.", "Vários cabos passam a funcionar como um só: soma a largura de banda e, se um cabo falhar, os outros continuam."),
    (r"encapsulation dot1Q (\d+) native$", "A subinterface trata a VLAN {1} como nativa (sem etiqueta).", "Tem de coincidir com a VLAN nativa do trunk do switch."),
    (r"encapsulation dot1Q (\d+)$", "Associa a subinterface à VLAN {1} (etiqueta 802.1Q).", "É assim que o router sabe que os pacotes com a etiqueta {1} pertencem a esta subinterface."),
    (r"ip dhcp excluded-address (\S+) (\S+)$", "Reserva os endereços de {1} a {2}: o DHCP nunca os dá.", "Ficam livres para o gateway, servidores e impressoras com IP fixo."),
    (r"ip dhcp excluded-address (\S+)$", "Reserva o endereço {1}: o DHCP nunca o dá.", "Fica livre para um equipamento com IP fixo."),
    (r"ip dhcp pool (\S+)$", "Cria o conjunto (pool) de endereços DHCP chamado {1}.", "Cada rede/VLAN precisa do seu pool."),
    (r"network (\S+) (\S+)$", "Define a rede {1} {2} de onde o DHCP tira os endereços.", "O router escolhe o pool cuja rede coincide com a interface onde chegou o pedido."),
    (r"default-router (\S+)$", "Diz aos clientes que o gateway é {1}.", "Sem gateway os PCs só falam com a própria rede."),
    (r"dns-server (.+)$", "Diz aos clientes que o servidor DNS é {1}.", "Sem DNS os utilizadores não conseguem usar nomes (www…, servidores internos)."),
    (r"domain-name (\S+)$", "Indica aos clientes o domínio {1}.", "Permite escrever só o nome curto dos servidores internos."),
    (r"ip helper-address (\S+)$", "Reencaminha os pedidos DHCP (broadcast) desta rede para o servidor {1} (DHCP relay).", "Os broadcasts não atravessam routers; o relay transforma o pedido num pacote dirigido ao servidor DHCP central."),
    (r"ip routing$", "Liga o encaminhamento IP no switch multicamada.", "Sem isto o switch L3 não encaminha entre VLANs, mesmo com SVIs."),
    (r"no switchport$", "Transforma a porta do switch L3 numa porta de router (routed port).", "Para a ligação ao router basta uma rede ponto a ponto, sem VLAN."),
    (r"ip default-gateway (\S+)$", "Gateway do próprio switch (para a gestão remota): {1}.", "Um switch de camada 2 precisa disto para responder a quem o gere a partir de outra rede."),
    (r"ip route 0\.0\.0\.0 0\.0\.0\.0 (\S+)$", "Rota por defeito: tudo o que não se conhece vai para {1}.", "Uma filial ou um router de saída não precisa de conhecer todas as redes: envia o resto para quem sabe."),
    (r"ip route (\S+) (\S+) (\S+) (\d+)$", "Rota estática para a rede {1} {2} via {3}, com distância administrativa {4} (rota flutuante).", "Só é usada se a rota principal desaparecer."),
    (r"ip route (\S+) (\S+) (\S+)$", "Rota estática: para chegar à rede {1} {2} envia para {3}.", "O router só conhece as redes ligadas diretamente; as outras têm de lhe ser ensinadas."),
    (r"router ospf (\d+)$", "Liga o OSPF com o número de processo {1} (local ao router).", "Com OSPF os routers trocam rotas sozinhos e recalculam o caminho se um cabo falhar."),
    (r"router-id (\S+)$", "Fixa o identificador OSPF {1}.", "Um router-id fixo e legível facilita ler as tabelas de vizinhos e não muda se uma interface cair. Se o OSPF já tinha escolhido outro, o IOS avisa: aplica-se com 'clear ip ospf process' ou no próximo arranque."),
    (r"network (\S+) (\S+) area (\d+)$", "Anuncia no OSPF as interfaces dentro de {1} (wildcard {2}) na área {3}.", "A wildcard é o inverso da máscara: 0.0.0.255 corresponde a /24, 0.0.0.3 a /30."),
    (r"passive-interface (\S+)$", "Não envia mensagens OSPF pela interface {1} (mas continua a anunciar a sua rede).", "Do lado dos PCs não há routers: enviar Hellos ali é inútil e inseguro."),
    (r"default-information originate$", "Anuncia a rota por defeito aos outros routers OSPF.", "Assim toda a rede aprende sozinha qual é a saída para a Internet."),
    (r"ip nat inside$", "Marca a interface como 'inside' (rede interna, endereços privados).", "O NAT precisa de saber de que lado está a rede interna."),
    (r"ip nat outside$", "Marca a interface como 'outside' (lado da Internet).", "Os pacotes que saem por aqui levam o endereço público."),
    (r"access-list (\d+) permit (\S+) (\S+)$", "Lista de acesso padrão {1}: permite a origem {2} {3}.", "As ACL padrão só olham para a origem; aqui servem para dizer quem pode usar o recurso."),
    (r"access-list (\d+) permit host (\S+)$", "Lista de acesso padrão {1}: permite só o equipamento {2}.", "Restringe ao mínimo necessário."),
    (r"ip nat inside source list (\S+) interface (\S+) overload$", "PAT: os endereços da lista {1} saem todos com o IP da interface {2}, distinguidos pela porta.", "Um único IP público serve centenas de equipamentos internos."),
    (r"ip nat inside source static (\S+) (\S+)$", "NAT estática: o servidor interno {1} fica sempre visível na Internet como {2}.", "Quem está fora precisa de um endereço público fixo para chegar ao servidor."),
    (r"ip access-list extended (\S+)$", "Cria a lista de acesso alargada com nome {1}.", "As ACL alargadas filtram por origem, destino, protocolo e porta; o nome documenta para que serve."),
    (r"(deny|permit) (.+)$", "Regra: {1} {2}.", "As regras são lidas de cima para baixo e no fim há um 'deny any' implícito."),
    (r"ip access-group (\S+) (in|out)$", "Aplica a lista {1} à interface, no sentido {2}.", "Uma ACL só funciona depois de aplicada. As alargadas aplicam-se perto da origem do tráfego."),
    (r"access-class (\S+) in$", "Aplica a lista {1} às linhas VTY: só esses endereços podem entrar por SSH.", "Mesmo com a palavra-passe certa, quem não estiver na lista nem chega a ver o pedido de login."),
    (r"standby (\d+) ip (\S+)$", "HSRP grupo {1}: o gateway virtual é {2}.", "Os PCs usam o IP virtual; se o router ativo falhar, o outro assume o mesmo IP."),
    (r"standby (\d+) priority (\d+)$", "Prioridade HSRP {2} no grupo {1} (a maior ganha; por defeito 100).", "Escolhe-se qual dos routers é o ativo em condições normais."),
    (r"standby (\d+) preempt$", "Preempt: quando volta a estar bem, este router recupera o papel de ativo.", "Sem preempt, depois de uma falha o tráfego fica no router de reserva."),
    (r"standby (\d+) track (\S+) (\d+)$", "Se a interface {2} cair, a prioridade baixa {3}.", "Se o router perde a ligação do outro lado, deixa de fazer sentido ser o gateway ativo."),
    (r"copy running-config startup-config$", "Guarda a configuração em uso na memória NVRAM.", "Sem isto, tudo se perde quando o equipamento reinicia ou falha a energia."),
]


def _auto(cmd: str) -> tuple[str, str]:
    for pad, ex, pq in _AUTO:
        m = re.match(pad, cmd)
        if m:
            g = [m.group(0)] + list(m.groups())
            fmt = lambda s: re.sub(r"\{(\d)\}", lambda k: g[int(k.group(1))] or "", s)
            return fmt(ex), fmt(pq)
    return "", ""


def c(cmd, explica="", porque=""):
    """Uma linha de comando. Sem explicação, usa a automática."""
    ae, ap = _auto(cmd)
    return {"cmd": cmd, "explica": explica or ae, "porque": porque or ap}


def em(dev, *linhas):
    """Bloco de comandos escritos no terminal de um equipamento."""
    return {"em": dev, "linhas": [c(x) if isinstance(x, str) else c(*x) for x in linhas]}


# ---------------------------------------------------------------- ações fora do terminal
def a_cabo(a, pa, b, pb, cabo="direto"):
    return {"t": "ligar", "a": a, "pa": pa, "b": b, "pb": pb, "cabo": cabo,
            "txt": f"Ferramenta Cabo › {cabo.capitalize()}: {a} ({pa}) → {b} ({pb})."}


def a_ip(nome, ip, mask=M24, gw="", dns=""):
    extra = (f", gateway {gw}" if gw else "") + (f", DNS {dns}" if dns else "")
    return {"t": "ip", "nome": nome, "ip": ip, "mask": mask, "gw": gw, "dns": dns,
            "txt": f"{nome} › Configuração IP › Estático: {ip}, máscara {mask}{extra}."}


def a_dhcp(nome):
    return {"t": "dhcp", "nome": nome, "txt": f"{nome} › Configuração IP › DHCP (ou Prompt › ipconfig /renew)."}


def a_wifi(nome, ssid, chave, seg="wpa2"):
    return {"t": "wifi", "nome": nome, "ssid": ssid, "seg": seg, "chave": chave,
            "txt": f"{nome} › Sem fios: SSID “{ssid}”, segurança WPA2-Pessoal, chave “{chave}”."}


def a_cliente(nome, ssid, chave):
    return {"t": "cliente", "nome": nome, "ssid": ssid, "chave": chave,
            "txt": f"{nome} › Sem fios: escolha a rede “{ssid}” e escreva a chave “{chave}”."}


def a_rw_lan(nome, ip, mask, inicio, maximo=50):
    return {"t": "rw_lan", "nome": nome, "ip": ip, "mask": mask, "inicio": inicio, "max": maximo,
            "txt": f"{nome} › Rede local: IP {ip}, máscara {mask}; DHCP ligado a começar em {inicio} ({maximo} endereços)."}


def a_dns(nome, registo, ip):
    return {"t": "dns", "nome": nome, "registo": registo, "ip": ip,
            "txt": f"{nome} › Serviços › DNS › Adicionar: {registo} → {ip}."}


def a_srv_dhcp(nome, inicio, mask, gw, dns, maximo=100):
    return {"t": "srv_dhcp", "nome": nome, "inicio": inicio, "mask": mask, "gw": gw, "dns": dns, "max": maximo,
            "txt": f"{nome} › Serviços › DHCP: ligado, início {inicio}, máscara {mask}, gateway {gw}, DNS {dns}, {maximo} endereços."}


def a_prompt(nome, linha):
    return {"t": "prompt", "nome": nome, "linha": linha, "txt": f"{nome} › Prompt › {linha}"}


def a_fw(nome):
    return {"t": "fw", "nome": nome, "txt": f"{nome} › Partilhas › ative “Partilha de ficheiros e impressoras na firewall”."}


def ver(como, esperado):
    return {"como": como, "esperado": esperado}


def etapa(titulo, o_que_fazer, porque, check, comandos=(), acoes=(), verificar=(), ajuda=""):
    return {"titulo": titulo, "o_que_fazer": o_que_fazer, "porque": porque, "comandos": list(comandos),
            "acoes": list(acoes), "verificar": list(verificar), "check": check, "ajuda": ajuda}


# ---------------------------------------------------------------- atalhos de verificações
def ios(nome, **chk):
    return {"t": "ios", "nome": nome, "check": chk}


def todos(*lista):
    return {"t": "e", "lista": list(lista)}


def ping(de, para, falha=False):
    d = {"t": "ping", "de": de, "para": para}
    if falha:
        d["falha"] = True
    return d


def dev(nome, tipo, x, y, **extra):
    d = {"nome": nome, "tipo": tipo, "x": x, "y": y}
    d.update(extra)
    return d


def lig(a, pa, b, pb, cabo="direto", rotulo="", por_ligar=False):
    d = {"a": a, "pa": pa, "b": b, "pb": pb, "cabo": cabo}
    if por_ligar:
        d["por_ligar"] = True
    if rotulo:
        d["rotulo"] = rotulo
    return d


def plano(rede, vlan, gateway, uso):
    return {"rede": rede, "vlan": vlan, "gateway": gateway, "uso": uso}


def equip(nome, tipo, papel):
    return {"nome": nome, "tipo": tipo, "papel": papel}


def erro(erro, solucao):
    return {"erro": erro, "solucao": solucao}


_FIG = {"router_wifi": "router_wifi", "smartphone": "smartphone", "portatil": "portatil", "impressora": "impressora",
        "switch_l3": "switch_l3", "nuvem": "nuvem", "servidor": "servidor", "ap": "ap", "router": "router", "switch": "switch", "pc": "pc"}


def projeto(id, ordem, titulo, nivel, local, icone, duracao, resumo, briefing, objetivos, conhecimentos,
            enderecos, equipamentos, dispositivos, ligacoes, etapas, desafio_extra, erros_comuns, modulo):
    passos = [{"texto": e["titulo"], "ajuda": e["ajuda"] or e["o_que_fazer"], "check": e["check"]} for e in etapas]
    topo = {"nos": [{"id": d["nome"], "tipo": _FIG.get(d["tipo"], "pc"), "x": d["x"], "y": d["y"], "rotulo": d["nome"]} for d in dispositivos],
            "ligacoes": [{"a": l["a"], "b": l["b"], **({"rotulo": l["rotulo"]} if l.get("rotulo") else {})} for l in ligacoes],
            "legenda": f"Topologia do projeto: {titulo}"}
    lig_sim = [{k: l[k] for k in ("a", "pa", "b", "pb", "cabo")} for l in ligacoes if not l.get("por_ligar")]
    return {
        "id": id, "ordem": ordem, "titulo": titulo, "nivel": nivel, "local": local, "icone": icone, "duracao": duracao,
        "resumo": resumo, "briefing": briefing, "objetivos": objetivos, "conhecimentos": conhecimentos,
        "enderecos": enderecos, "equipamentos": equipamentos, "etapas": etapas,
        "desafio_extra": desafio_extra, "erros_comuns": erros_comuns, "topologia": topo,
        "atividade": {"id": "proj:" + id, "projeto": id, "titulo": titulo, "modulo": modulo, "nivel": nivel.lower(),
                      "cenario": briefing, "inicial": {"dispositivos": dispositivos, "ligacoes": lig_sim}, "passos": passos, "livre": False},
    }


ENTRAR = ["enable", "configure terminal"]


# =================================================================================== 1. Escritório
P_ESCRITORIO = projeto(
    "escritorio", 1, "Escritório de contabilidade: a primeira rede", "Básico", "Escritório", "pc", "30 min",
    "Um switch, três PCs e uma impressora com IPs estáticos.",
    "A Contabilidade Silva & Filhos tem 3 funcionários (Ana, Rui e Sofia) e uma impressora de rede. Hoje trocam ficheiros por pen USB. "
    "Pedem uma rede simples: todos os PCs e a impressora ligados, com endereços fixos, e o switch protegido com palavra-passe.",
    ["Ligar 3 PCs e a impressora ao switch com o cabo certo", "Criar um plano de endereços 192.168.1.0/24 e aplicá-lo",
     "Confirmar a comunicação com ping", "Dar nome, palavra-passe e IP de gestão ao switch e guardar a configuração"],
    ["a7", "itn2", "itn4", "itn11", "itn13"],
    [plano("192.168.1.0/24", "1", "—", "Toda a rede do escritório (até 254 equipamentos)"),
     plano("192.168.1.2", "1", "—", "Gestão do switch SW-CONTAB"),
     plano("192.168.1.11 a .13", "1", "—", "PC-ANA, PC-RUI, PC-SOFIA"), plano("192.168.1.50", "1", "—", "Impressora")],
    [equip("SW-CONTAB", "Switch Catalyst 2960", "Liga todos os equipamentos"), equip("PC-ANA, PC-RUI, PC-SOFIA", "PC", "Postos de trabalho"),
     equip("IMPRESSORA", "Impressora de rede", "Impressão partilhada")],
    [dev("SW-CONTAB", "switch", 50, 30, nomeIos="Switch"), dev("PC-ANA", "pc", 15, 80), dev("PC-RUI", "pc", 38, 80),
     dev("PC-SOFIA", "pc", 62, 80), dev("IMPRESSORA", "impressora", 85, 80)],
    [lig("PC-ANA", FA0, "SW-CONTAB", fa(1), por_ligar=True), lig("PC-RUI", FA0, "SW-CONTAB", fa(2), por_ligar=True),
     lig("PC-SOFIA", FA0, "SW-CONTAB", fa(3), por_ligar=True), lig("IMPRESSORA", FA0, "SW-CONTAB", fa(10), por_ligar=True)],
    [
        etapa("Ligar os PCs e a impressora ao switch",
              "Use cabo direto (straight-through) de cada PC (FastEthernet0) a uma porta Fa0/x do switch. A impressora vai para a Fa0/10.",
              "PC e switch são equipamentos diferentes (um transmite nos pinos 1-2, o outro recebe nos 1-2), por isso o cabo é direto. "
              "Cabo cruzado só entre equipamentos iguais (switch-switch, PC-PC, router-router) ou PC-router.",
              todos({"t": "ligado_tipo", "a": "pc", "b": "switch", "n": 3}, {"t": "cabo", "a": "IMPRESSORA", "b": "SW-CONTAB", "cabo": "direto"}),
              acoes=[a_cabo("PC-ANA", FA0, "SW-CONTAB", fa(1)), a_cabo("PC-RUI", FA0, "SW-CONTAB", fa(2)),
                     a_cabo("PC-SOFIA", FA0, "SW-CONTAB", fa(3)), a_cabo("IMPRESSORA", FA0, "SW-CONTAB", fa(10))],
              verificar=[ver("Olhe para as luzes dos cabos", "Ficam verdes nas duas pontas (ligação correta). Vermelho = cabo errado.")]),
        etapa("Plano de endereços: IP fixo em cada PC",
              "Dê a cada PC um IP da rede 192.168.1.0/24 com a máscara 255.255.255.0: Ana .11, Rui .12, Sofia .13.",
              "Todos os equipamentos de uma rede local têm de estar na mesma rede IP para comunicar sem router. "
              "Com IPs fixos e um plano escrito, sabe-se sempre quem é quem (útil para a impressora e para resolver avarias).",
              todos({"t": "pc_ip", "nome": "PC-ANA", "ip": "192.168.1.11", "mask": M24}, {"t": "pc_ip", "nome": "PC-RUI", "ip": "192.168.1.12", "mask": M24},
                    {"t": "pc_ip", "nome": "PC-SOFIA", "ip": "192.168.1.13", "mask": M24}),
              acoes=[a_ip("PC-ANA", "192.168.1.11"), a_ip("PC-RUI", "192.168.1.12"), a_ip("PC-SOFIA", "192.168.1.13")],
              verificar=[ver("PC-ANA › Prompt › ipconfig", "Endereço IPv4 192.168.1.11, máscara 255.255.255.0")]),
        etapa("IP fixo na impressora",
              "Configure a impressora com 192.168.1.50/24 (fora da zona dos PCs).",
              "A impressora é usada por todos: se o IP mudasse, deixava de imprimir em todos os PCs. "
              "Reservar uma zona (.50) para impressoras torna o plano fácil de ler.",
              {"t": "pc_ip", "nome": "IMPRESSORA", "ip": "192.168.1.50", "mask": M24},
              acoes=[a_ip("IMPRESSORA", "192.168.1.50")]),
        etapa("Testar com ping",
              "Do PC da Ana faça ping ao PC da Sofia e à impressora.",
              "O ping (ICMP) confirma as camadas 1, 2 e 3 de uma só vez: cabo, switch e endereçamento. É o primeiro teste em qualquer rede.",
              todos(ping("PC-ANA", "192.168.1.13"), ping("PC-ANA", "192.168.1.50")),
              acoes=[a_prompt("PC-ANA", "ping 192.168.1.13"), a_prompt("PC-ANA", "ping 192.168.1.50")],
              verificar=[ver("PC-ANA › ping 192.168.1.13", "Reply from 192.168.1.13 … 4 respostas, 0% de perdas")]),
        etapa("Configuração básica e segura do switch",
              "No switch: nome SW-CONTAB, enable secret, palavra-passe na consola e IP de gestão 192.168.1.2 na interface VLAN 1.",
              "Um switch novo não tem palavra-passe nenhuma: qualquer pessoa com um cabo de consola o pode reconfigurar. "
              "O IP de gestão permite ao técnico verificar o switch pela rede (ping, SSH) sem ir ao armário.",
              todos(ios("SW-CONTAB", t="hostname", v="SW-CONTAB"), ios("SW-CONTAB", t="enable_secret"), ios("SW-CONTAB", t="line_login", line="con"),
                    ios("SW-CONTAB", t="iface_ip", **{"if": "Vlan1", "ip": "192.168.1.2", "mask": M24, "up": True})),
              comandos=[em("SW-CONTAB", *ENTRAR, "hostname SW-CONTAB", "enable secret Contab#2026", "no ip domain-lookup",
                           "line console 0", "password Consola#2026", "login", "exit",
                           "interface vlan 1", "ip address 192.168.1.2 255.255.255.0", "no shutdown", "end")],
              verificar=[ver("show running-config", "hostname SW-CONTAB, enable secret 5 …, line con 0 com password e login"),
                         ver("PC-RUI › ping 192.168.1.2", "O switch responde")]),
        etapa("Guardar a configuração",
              "Guarde a configuração do switch na NVRAM.",
              "A running-config vive na RAM. Se faltar a luz no escritório, sem guardar perdia-se o trabalho todo.",
              ios("SW-CONTAB", t="saved"),
              comandos=[em("SW-CONTAB", "copy running-config startup-config")],
              verificar=[ver("show startup-config", "Mostra a mesma configuração que a running-config")]),
    ],
    ["Ligue um quarto PC (estagiário) com o IP 192.168.1.14 e confirme o ping à impressora.",
     "Partilhe uma pasta num dos PCs para acabar com as pens USB (ver projeto da biblioteca).",
     "Mude a VLAN 1 de gestão para uma VLAN própria (VLAN 99) — boa prática que vai usar no projeto do hospital."],
    [erro("Usar cabo cruzado entre PC e switch", "A luz fica vermelha. PC↔switch é sempre cabo direto."),
     erro("Máscara diferente num dos PCs (ex.: 255.255.0.0)", "Todos na mesma rede devem ter a mesma máscara, senão alguns pings falham num sentido."),
     erro("Dar à impressora um IP repetido", "Dois equipamentos com o mesmo IP causam falhas intermitentes. Siga o plano de endereços."),
     erro("Esquecer o 'no shutdown' na interface vlan 1", "A SVI fica down e o switch não responde ao ping.")],
    "itn17")


# =================================================================================== 2. Loja com router Wi-Fi
P_LOJA = projeto(
    "loja_wifi", 2, "Loja de roupa: router Wi-Fi com WPA2 e DHCP", "Básico", "Loja", "router_wifi", "30 min",
    "Router Wi-Fi doméstico ligado ao operador, rede própria, Wi-Fi seguro e DHCP.",
    "A Boutique Maré abriu uma loja nova. O operador deixou a fibra ligada e a gerente comprou um router Wi-Fi. "
    "Quer: o PC da caixa por cabo, o portátil e o telemóvel por Wi-Fi seguro, e tudo com acesso à Internet. A rede da loja deve ser 192.168.10.0/24.",
    ["Ligar o router ao operador e receber IP público por DHCP", "Mudar a rede local para 192.168.10.0/24 com DHCP",
     "Criar um Wi-Fi com WPA2 e chave forte", "Ligar todos os clientes e testar a Internet"],
    ["a7", "itn1", "srwe7", "srwe12", "srwe13", "ensa6"],
    [plano("192.168.10.0/24", "—", "192.168.10.1", "Rede da loja (DHCP de .100 a .149)"),
     plano("Dada pelo operador", "—", "Do operador", "Porta Internet do router (WAN)")],
    [equip("WIFI-LOJA", "Router Wi-Fi doméstico", "Router + switch + ponto de acesso + DHCP + NAT"), equip("INTERNET", "Operador", "Fibra do operador"),
     equip("PC-CAIXA", "PC", "Caixa registadora (cabo)"), equip("PORTATIL-GERENTE", "Portátil", "Wi-Fi"), equip("TELEMOVEL", "Smartphone", "Wi-Fi (pagamentos)")],
    [dev("INTERNET", "nuvem", 50, 8), dev("WIFI-LOJA", "router_wifi", 50, 42), dev("PC-CAIXA", "pc", 15, 85),
     dev("PORTATIL-GERENTE", "portatil", 55, 85, nic="wifi", dhcp=True), dev("TELEMOVEL", "smartphone", 88, 85)],
    [lig("WIFI-LOJA", "Internet", "INTERNET", "Ethernet6", por_ligar=True), lig("PC-CAIXA", FA0, "WIFI-LOJA", "Ethernet1", por_ligar=True)],
    [
        etapa("Ligar o router ao operador (WAN)",
              "Ligue a porta Internet do router à fibra do operador (Ethernet6 da nuvem) com cabo direto. O router recebe IP por DHCP do operador.",
              "A porta Internet (WAN) é a única virada para fora; as portas Ethernet1-4 são a rede da loja (LAN). "
              "Os operadores dão normalmente o IP público por DHCP.",
              todos({"t": "cabo", "a": "WIFI-LOJA", "b": "INTERNET", "cabo": "direto"}, {"t": "rw_wan", "nome": "WIFI-LOJA"}),
              acoes=[a_cabo("WIFI-LOJA", "Internet", "INTERNET", "Ethernet6")],
              verificar=[ver("Toque no router › Internet", "Mostra o IP recebido do operador (203.0.113.x)")]),
        etapa("Rede da loja 192.168.10.0/24 com DHCP",
              "No router mude o IP da LAN para 192.168.10.1/24 e deixe o DHCP ligado a começar em 192.168.10.100.",
              "Mudar da rede de fábrica (192.168.0.0) evita conflitos com outros routers iguais e mostra que a rede foi pensada. "
              "O DHCP dá IP, máscara, gateway e DNS a cada cliente: na loja ninguém tem de saber configurar IPs.",
              {"t": "rw_lan", "nome": "WIFI-LOJA", "ip": "192.168.10.1", "mask": M24},
              acoes=[a_rw_lan("WIFI-LOJA", "192.168.10.1", M24, "192.168.10.100")]),
        etapa("Wi-Fi seguro: SSID e WPA2",
              "Crie a rede sem fios “Boutique-Mare” com segurança WPA2-Pessoal e uma chave com pelo menos 8 caracteres.",
              "Um Wi-Fi aberto deixa qualquer pessoa na rua usar a Internet da loja e ver os equipamentos internos. "
              "O WPA2 cifra o tráfego no ar e só entra quem souber a chave.",
              {"t": "wifi_rede", "nome": "WIFI-LOJA", "ssid": "Boutique-Mare", "seg": "wpa2"},
              acoes=[a_wifi("WIFI-LOJA", "Boutique-Mare", "Mare#Loja2026")]),
        etapa("Ligar o portátil e o telemóvel ao Wi-Fi",
              "Em cada um escolha a rede Boutique-Mare e escreva a chave. Ambos recebem IP por DHCP.",
              "O cliente associa-se ao SSID, autentica-se com a chave WPA2 e só depois pede IP por DHCP.",
              todos({"t": "wifi_ligado", "nome": "PORTATIL-GERENTE"}, {"t": "wifi_ligado", "nome": "TELEMOVEL"},
                    {"t": "dhcp", "nome": "PORTATIL-GERENTE"}, {"t": "dhcp", "nome": "TELEMOVEL"}),
              acoes=[a_cliente("PORTATIL-GERENTE", "Boutique-Mare", "Mare#Loja2026"), a_cliente("TELEMOVEL", "Boutique-Mare", "Mare#Loja2026")],
              verificar=[ver("PORTATIL-GERENTE › Prompt › ipconfig", "IP 192.168.10.10x, gateway 192.168.10.1")]),
        etapa("PC da caixa por cabo",
              "Ligue o PC da caixa à porta Ethernet1 do router com cabo direto; fica em DHCP.",
              "A caixa registadora precisa de uma ligação estável: o cabo não sofre interferências nem quedas como o Wi-Fi.",
              todos({"t": "cabo", "a": "PC-CAIXA", "b": "WIFI-LOJA", "cabo": "direto"}, {"t": "dhcp", "nome": "PC-CAIXA"}, {"t": "pc_rede", "rede": "192.168.10.0/24", "n": 2}),
              acoes=[a_cabo("PC-CAIXA", FA0, "WIFI-LOJA", "Ethernet1"), a_dhcp("PC-CAIXA")]),
        etapa("Testar a Internet",
              "Do telemóvel faça ping a 8.8.8.8 e a www.google.com.",
              "O ping ao IP testa o caminho (gateway e NAT do router); o ping ao nome testa também o DNS. Se o IP funciona e o nome não, o problema é DNS.",
              todos(ping("TELEMOVEL", "8.8.8.8"), ping("PC-CAIXA", "8.8.8.8")),
              acoes=[a_prompt("TELEMOVEL", "ping 8.8.8.8"), a_prompt("PC-CAIXA", "ping 8.8.8.8")],
              verificar=[ver("TELEMOVEL › ping 8.8.8.8", "Respostas de 8.8.8.8: o NAT do router traduziu o IP privado para o público")]),
    ],
    ["Crie um segundo SSID para clientes (num router com essa opção) ou um AP à parte — veja o projeto do hotel.",
     "Mude o início do DHCP para .50 e limite a 20 endereços: o que acontece ao 21.º cliente?"],
    [erro("Ligar a fibra a uma porta Ethernet1-4", "As portas LAN não falam com o operador. Use a porta Internet."),
     erro("Chave Wi-Fi com menos de 8 caracteres", "O WPA2 exige 8 a 63 caracteres; use uma frase longa."),
     erro("Escrever o SSID com espaço ou maiúsculas diferentes no cliente", "O SSID distingue maiúsculas de minúsculas; tem de ser igual.")],
    "srwe13")


# =================================================================================== 3. Biblioteca
SRV_B = "SRV-BIB"
P_BIBLIOTECA = projeto(
    "biblioteca", 3, "Biblioteca municipal: servidor DHCP, DNS e pasta partilhada", "Básico", "Biblioteca", "servidor", "40 min",
    "Um servidor que dá IPs, responde por nomes e partilha o catálogo.",
    "A Biblioteca Municipal tem um balcão e dois postos de leitura. Querem que os PCs se configurem sozinhos, que o catálogo se abra pelo nome "
    "catalogo.biblioteca.local e que a pasta do catálogo esteja partilhada só para leitura (ninguém a pode apagar por engano).",
    ["Servidor com IP fixo", "Serviço DHCP no servidor", "Registo DNS do catálogo", "Pasta partilhada só de leitura e mapeada no balcão"],
    ["itn15", "srwe7", "e7"],
    [plano("192.168.30.0/24", "1", "192.168.30.1 (router futuro)", "Rede da biblioteca"),
     plano("192.168.30.5", "1", "—", "SRV-BIB (DHCP, DNS, ficheiros)"), plano("192.168.30.100 a .199", "1", "—", "Endereços dados por DHCP")],
    [equip("SRV-BIB", "Servidor", "DHCP, DNS e ficheiros"), equip("SW-BIB", "Switch 2960", "Liga tudo"),
     equip("PC-BALCAO, PC-LEITURA1, PC-LEITURA2", "PC", "Balcão e postos de leitura")],
    [dev(SRV_B, "servidor", 50, 12), dev("SW-BIB", "switch", 50, 45), dev("PC-BALCAO", "pc", 15, 85, dhcp=True),
     dev("PC-LEITURA1", "pc", 50, 85, dhcp=True), dev("PC-LEITURA2", "pc", 85, 85, dhcp=True)],
    [lig(SRV_B, FA0, "SW-BIB", fa(24)), lig("PC-BALCAO", FA0, "SW-BIB", fa(1)), lig("PC-LEITURA1", FA0, "SW-BIB", fa(2)), lig("PC-LEITURA2", FA0, "SW-BIB", fa(3))],
    [
        etapa("IP fixo no servidor",
              "Configure o SRV-BIB com 192.168.30.5/24, gateway 192.168.30.1 e DNS 192.168.30.5 (ele próprio).",
              "Um servidor tem SEMPRE IP fixo: os clientes procuram-no por esse endereço (é o DHCP e o DNS da rede). Se mudasse, a rede parava.",
              {"t": "pc_ip", "nome": SRV_B, "ip": "192.168.30.5", "mask": M24, "gw": "192.168.30.1"},
              acoes=[a_ip(SRV_B, "192.168.30.5", M24, "192.168.30.1", "192.168.30.5")]),
        etapa("Ligar o serviço DHCP",
              "No servidor ligue o DHCP: início 192.168.30.100, máscara /24, gateway 192.168.30.1, DNS 192.168.30.5, 100 endereços.",
              "O DHCP poupa trabalho e evita erros: cada PC recebe IP, máscara, gateway e DNS certos. O DNS dado aos PCs é o do próprio servidor, para resolver os nomes internos.",
              {"t": "srv_dhcp", "nome": SRV_B},
              acoes=[a_srv_dhcp(SRV_B, "192.168.30.100", M24, "192.168.30.1", "192.168.30.5")]),
        etapa("Os PCs recebem IP",
              "Nos três PCs (já em modo DHCP) renove o IP.",
              "O PC envia DHCP Discover em broadcast; o servidor responde com Offer, o PC pede (Request) e o servidor confirma (Ack): o processo DORA.",
              todos({"t": "dhcp", "nome": "PC-BALCAO"}, {"t": "dhcp", "nome": "PC-LEITURA1"}, {"t": "dhcp", "nome": "PC-LEITURA2"}),
              acoes=[a_prompt("PC-BALCAO", "ipconfig /renew"), a_prompt("PC-LEITURA1", "ipconfig /renew"), a_prompt("PC-LEITURA2", "ipconfig /renew")],
              verificar=[ver("PC-LEITURA1 › ipconfig /all", "IP 192.168.30.10x, DNS 192.168.30.5, DHCP ativo: Sim")]),
        etapa("Nome para o catálogo (DNS)",
              "Crie no servidor o registo catalogo.biblioteca.local → 192.168.30.5.",
              "As pessoas lembram-se de nomes, não de números. Se um dia o catálogo mudar de servidor, basta mudar o registo DNS.",
              {"t": "dns", "nome": SRV_B, "registo": "catalogo.biblioteca.local"},
              acoes=[a_dns(SRV_B, "catalogo.biblioteca.local", "192.168.30.5"), a_prompt("PC-LEITURA1", "ping catalogo.biblioteca.local")],
              verificar=[ver("PC-LEITURA1 › nslookup catalogo.biblioteca.local", "Address: 192.168.30.5")]),
        etapa("Partilhar o catálogo só para leitura",
              "No servidor partilhe a pasta Catalogo com permissão de Leitura para Todos e abra a firewall à partilha (TCP 445).",
              "Leitura chega para consultar; assim um leitor não apaga nem altera ficheiros por engano. A firewall do Windows bloqueia o SMB até ser autorizado.",
              todos({"t": "partilha", "nome": SRV_B, "share": "Catalogo", "perm": "R"}, {"t": "fw_partilha", "nome": SRV_B}),
              acoes=[a_prompt(SRV_B, "net share Catalogo=C:\\Catalogo /grant:Todos,READ"), a_fw(SRV_B)]),
        etapa("Mapear a pasta no balcão pelo nome",
              "No PC-BALCAO mapeie a letra Z: para \\\\SRV-BIB\\Catalogo.",
              "Uma letra de unidade (Z:) é fácil para o funcionário: abre como se fosse um disco. Usar o nome do servidor em vez do IP aguenta mudanças de endereço.",
              {"t": "mapa", "pc": "PC-BALCAO", "share": "Catalogo", "letra": "Z:", "por": "nome"},
              acoes=[a_prompt("PC-BALCAO", "net use Z: \\\\SRV-BIB\\Catalogo")],
              verificar=[ver("PC-BALCAO › net use", "Z: \\\\SRV-BIB\\Catalogo  OK")]),
    ],
    ["Crie uma segunda partilha “Digitalizacoes” com permissão de Alteração só para o balcão.",
     "Reserve no DHCP um endereço fixo para uma impressora (pense em que intervalo o pôr)."],
    [erro("Servidor em DHCP", "O servidor de DHCP/DNS não pode depender de si próprio: IP fixo sempre."),
     erro("DNS dos PCs a apontar para 8.8.8.8", "O DNS público não conhece catalogo.biblioteca.local. Os PCs têm de usar o DNS interno."),
     erro("Erro 53 ao abrir a partilha", "A firewall do servidor está a bloquear o SMB (TCP 445).")],
    "e7")


# =================================================================================== 4. Clínica
P_CLINICA = projeto(
    "clinica", 4, "Clínica dentária: router com DHCP e servidor DNS/web", "Básico", "Clínica", "router", "45 min",
    "Primeiro router: gateway, DHCP no router e um servidor com a intranet.",
    "A Clínica Dentária Sorriso tem receção, dois gabinetes e um servidor com a agenda (intranet www.clinica.local). "
    "Querem que os PCs recebam IP sozinhos a partir do router e abram a agenda pelo nome. O router fica preparado para a ligação à Internet mais tarde.",
    ["Configurar o router como gateway", "DHCP no router com exclusões", "Servidor com IP fixo e registo DNS", "Abrir a intranet pelo nome e guardar"],
    ["itn10", "itn15", "srwe7", "itn11"],
    [plano("192.168.20.0/24", "1", "192.168.20.1", "Rede da clínica"),
     plano("192.168.20.1 a .20", "1", "—", "Reservados (router, servidor, impressoras)"),
     plano("192.168.20.10", "1", "192.168.20.1", "SRV-AGENDA (web e DNS)")],
    [equip("R-CLINICA", "Router ISR 4331", "Gateway e servidor DHCP"), equip("SW-CLINICA", "Switch 2960", "Liga tudo"),
     equip("SRV-AGENDA", "Servidor", "Intranet e DNS"), equip("PC-RECECAO, PC-GAB1, PC-GAB2", "PC", "Receção e gabinetes")],
    [dev("R-CLINICA", "router", 50, 10, nomeIos="Router"), dev("SW-CLINICA", "switch", 50, 42), dev("SRV-AGENDA", "servidor", 88, 42),
     dev("PC-RECECAO", "pc", 15, 85, dhcp=True), dev("PC-GAB1", "pc", 50, 85, dhcp=True), dev("PC-GAB2", "pc", 85, 85, dhcp=True)],
    [lig("R-CLINICA", G0, "SW-CLINICA", GI1), lig("SRV-AGENDA", FA0, "SW-CLINICA", fa(24)), lig("PC-RECECAO", FA0, "SW-CLINICA", fa(1)),
     lig("PC-GAB1", FA0, "SW-CLINICA", fa(2)), lig("PC-GAB2", FA0, "SW-CLINICA", fa(3))],
    [
        etapa("Router: nome, segurança e interface LAN",
              "Dê o nome R-CLINICA, enable secret, e configure G0/0/0 com 192.168.20.1/24 (o gateway da clínica). Ligue a interface.",
              "O router é a porta de saída da rede: o seu IP na LAN é o gateway que todos os PCs vão usar. Por convenção usa-se o primeiro IP da rede.",
              todos(ios("R-CLINICA", t="hostname", v="R-CLINICA"), ios("R-CLINICA", t="iface_ip", **{"if": G0, "ip": "192.168.20.1", "mask": M24, "up": True})),
              comandos=[em("R-CLINICA", *ENTRAR, "hostname R-CLINICA", "enable secret Sorriso#2026", f"interface {G0}",
                           "description LAN da clinica", "ip address 192.168.20.1 255.255.255.0", "no shutdown", "end")],
              verificar=[ver("show ip interface brief", "GigabitEthernet0/0/0 192.168.20.1 up up")]),
        etapa("Reservar endereços fixos",
              "Exclua do DHCP os endereços 192.168.20.1 a 192.168.20.20.",
              "O router, o servidor e futuras impressoras têm IP fixo nesta zona. Se o DHCP os desse a um PC haveria conflito de IP.",
              ios("R-CLINICA", t="dhcp_excl"),
              comandos=[em("R-CLINICA", "configure terminal", "ip dhcp excluded-address 192.168.20.1 192.168.20.20", "end")]),
        etapa("Pool DHCP com gateway e DNS",
              "Crie o pool CLINICA para 192.168.20.0/24, gateway 192.168.20.1 e DNS 192.168.20.10.",
              "Cada PC precisa de 4 coisas: IP, máscara, gateway e DNS. O DNS é o servidor interno, para resolver www.clinica.local.",
              todos(ios("R-CLINICA", t="dhcp_gw", name="CLINICA", v="192.168.20.1"), ios("R-CLINICA", t="dhcp_dns", name="CLINICA")),
              comandos=[em("R-CLINICA", "configure terminal", "ip dhcp pool CLINICA", "network 192.168.20.0 255.255.255.0",
                           "default-router 192.168.20.1", "dns-server 192.168.20.10", "domain-name clinica.local", "end")],
              verificar=[ver("show ip dhcp pool", "Pool CLINICA, rede 192.168.20.0/24")]),
        etapa("Servidor com IP fixo",
              "Configure o SRV-AGENDA com 192.168.20.10/24, gateway 192.168.20.1.",
              "O IP do servidor está escrito no DHCP (como DNS) e no registo da intranet; tem de ser fixo.",
              {"t": "pc_ip", "nome": "SRV-AGENDA", "ip": "192.168.20.10", "mask": M24, "gw": "192.168.20.1"},
              acoes=[a_ip("SRV-AGENDA", "192.168.20.10", M24, "192.168.20.1", "192.168.20.10")]),
        etapa("Os PCs recebem IP do router",
              "Renove o IP nos três PCs.",
              "O pedido DHCP chega ao router pela G0/0/0; o router escolhe o pool cuja rede coincide com essa interface.",
              todos({"t": "dhcp", "nome": "PC-RECECAO"}, {"t": "dhcp", "nome": "PC-GAB1"}, {"t": "dhcp", "nome": "PC-GAB2"}),
              acoes=[a_prompt("PC-RECECAO", "ipconfig /renew"), a_prompt("PC-GAB1", "ipconfig /renew"), a_prompt("PC-GAB2", "ipconfig /renew")],
              verificar=[ver("R-CLINICA › show ip dhcp binding", "Três endereços a partir de 192.168.20.21")]),
        etapa("Intranet pelo nome",
              "Crie no servidor o registo www.clinica.local → 192.168.20.10 e, da receção, faça ping a www.clinica.local.",
              "Os funcionários escrevem um nome fácil no navegador; o DNS traduz para o IP do servidor.",
              todos({"t": "dns", "nome": "SRV-AGENDA", "registo": "www.clinica.local"}, ping("PC-RECECAO", "www.clinica.local")),
              acoes=[a_dns("SRV-AGENDA", "www.clinica.local", "192.168.20.10"), a_prompt("PC-RECECAO", "ping www.clinica.local")]),
        etapa("Guardar a configuração do router",
              "Guarde a configuração do R-CLINICA.",
              "Um corte de energia não pode apagar o DHCP da clínica.",
              ios("R-CLINICA", t="saved"),
              comandos=[em("R-CLINICA", "copy running-config startup-config")]),
    ],
    ["Ligue a clínica à Internet: G0/0/1 ao operador, rota por defeito e NAT (veja o projeto do hotel).",
     "Acrescente uma impressora com o IP fixo 192.168.20.15 e confirme que o DHCP nunca o dá."],
    [erro("Esquecer o default-router no pool", "Os PCs recebem IP mas não saem da rede local."),
     erro("Não excluir o IP do servidor", "O DHCP pode dar 192.168.20.10 a um PC: conflito de IP com o servidor."),
     erro("Interface do router sem 'no shutdown'", "Os pedidos DHCP nunca chegam ao router.")],
    "itn17")


# =================================================================================== 5. Hospital (VLANs)
HV = [(10, "URGENCIA", "Urgência"), (20, "BLOCO_OPERATORIO", "Bloco operatório"), (30, "ADMINISTRACAO", "Administração"),
      (40, "LABORATORIO", "Laboratório"), (50, "SERVIDORES", "Servidores"), (99, "GESTAO", "Gestão dos equipamentos"), (999, "NATIVA", "VLAN nativa sem uso")]
VLAN_CMDS = [x for v, n, _ in HV for x in (f"vlan {v}", f"name {n}")]
ALLOWED = "switchport trunk allowed vlan 10,20,30,40,50,99,999"
POOLS_H = [("URGENCIA", 10), ("BLOCO", 20), ("ADMIN", 30), ("LAB", 40)]
HPC = ["PC-URG1", "PC-LAB", "PC-URG2", "PC-BLOCO", "PC-ADMIN"]
P_HOSPITAL = projeto(
    "hospital", 5, "Hospital de Santa Luzia: VLANs por serviço", "Intermédio", "Hospital", "servidor", "2 h",
    "VLANs por serviço, trunks, router-on-a-stick, DHCP por VLAN, servidor do processo clínico, ACL e segurança das portas.",
    "O Hospital de Santa Luzia tem tudo na mesma rede: um vírus num PC da Administração chegou aos computadores do Bloco Operatório. "
    "A Direção pede uma rede separada por serviço — Urgência, Bloco Operatório, Administração e Laboratório — com o servidor do processo clínico numa rede própria, "
    "endereços automáticos em cada serviço, a Administração impedida de chegar ao Bloco Operatório e as tomadas protegidas contra equipamentos estranhos.",
    ["Uma VLAN (com nome) por serviço, nos dois switches", "Trunks 802.1Q com VLAN nativa sem uso", "Encaminhamento entre VLANs no router (router-on-a-stick)",
     "DHCP por VLAN e DNS interno do processo clínico", "Administração isolada do Bloco Operatório (ACL)", "Port-security, portas não usadas desligadas e VLAN de gestão"],
    ["srwe1", "srwe3", "srwe4", "srwe7", "srwe11", "ensa5", "itn15"],
    [plano(f"172.16.{v}.0/24" if v != 999 else "—", str(v), f"172.16.{v}.1" if v != 999 else "—", u) for v, _, u in HV],
    [equip("R-HOSP", "Router ISR 4331", "Gateway de todas as VLANs (subinterfaces) e DHCP"),
     equip("SW-CORE", "Switch 2960 (piso 0)", "Urgência, Laboratório e sala de servidores"), equip("SW-PISO1", "Switch 2960 (piso 1)", "Bloco operatório, Administração e Urgência (pediátrica)"),
     equip("SRV-PROCESSO", "Servidor", "Processo clínico eletrónico + DNS interno"), equip("PC-URG1, PC-URG2, PC-BLOCO, PC-ADMIN, PC-LAB", "PC", "Postos de trabalho por serviço")],
    [dev("R-HOSP", "router", 50, 6, nomeIos="Router"), dev("SW-CORE", "switch", 35, 40, nomeIos="Switch"), dev("SW-PISO1", "switch", 75, 40, nomeIos="Switch"),
     dev("SRV-PROCESSO", "servidor", 8, 40), dev("PC-URG1", "pc", 15, 88, dhcp=True), dev("PC-LAB", "pc", 35, 88, dhcp=True),
     dev("PC-URG2", "pc", 57, 88, dhcp=True), dev("PC-BLOCO", "pc", 75, 88, dhcp=True), dev("PC-ADMIN", "pc", 93, 88, dhcp=True)],
    [lig("R-HOSP", G0, "SW-CORE", GI1, rotulo="trunk"), lig("SW-CORE", GI2, "SW-PISO1", GI1, "cruzado", rotulo="trunk"),
     lig("SRV-PROCESSO", FA0, "SW-CORE", fa(24), rotulo="V50"), lig("PC-URG1", FA0, "SW-CORE", fa(1), rotulo="V10"), lig("PC-LAB", FA0, "SW-CORE", fa(2), rotulo="V40"),
     lig("PC-URG2", FA0, "SW-PISO1", fa(3), rotulo="V10"), lig("PC-BLOCO", FA0, "SW-PISO1", fa(1), rotulo="V20"), lig("PC-ADMIN", FA0, "SW-PISO1", fa(2), rotulo="V30")],
    [
        etapa("Nome e palavra-passe nos switches",
              "Nos dois switches: hostname (SW-CORE e SW-PISO1), enable secret e no ip domain-lookup.",
              "Num hospital há vários armários de rede; o nome no prompt evita configurar o switch errado. A palavra-passe impede alterações não autorizadas.",
              todos(ios("SW-CORE", t="hostname", v="SW-CORE"), ios("SW-PISO1", t="hostname", v="SW-PISO1"),
                    ios("SW-CORE", t="enable_secret"), ios("SW-PISO1", t="enable_secret")),
              comandos=[em("SW-CORE", *ENTRAR, "hostname SW-CORE", "enable secret Hosp#Core2026", "no ip domain-lookup", "end"),
                        em("SW-PISO1", *ENTRAR, "hostname SW-PISO1", "enable secret Hosp#Piso2026", "no ip domain-lookup", "end")]),
        etapa("Criar as VLANs com nomes (nos dois switches)",
              "Crie em cada switch as VLANs 10 URGENCIA, 20 BLOCO_OPERATORIO, 30 ADMINISTRACAO, 40 LABORATORIO, 50 SERVIDORES, 99 GESTAO e 999 NATIVA.",
              "Cada VLAN é um domínio de broadcast separado: um vírus ou uma tempestade de broadcast na Administração já não chega ao Bloco. "
              "As VLANs têm de existir em todos os switches por onde passam (aqui não usamos VTP, criamos à mão). O nome documenta a rede.",
              todos(*[ios(s, t="vlan", id=v, name=n) for s in ("SW-CORE", "SW-PISO1") for v, n, _ in HV]),
              comandos=[em("SW-CORE", "configure terminal", *VLAN_CMDS, "end"), em("SW-PISO1", "configure terminal", *VLAN_CMDS, "end")],
              verificar=[ver("show vlan brief", "As 7 VLANs aparecem com o nome, ainda sem portas")]),
        etapa("Portas de acesso por serviço",
              "SW-CORE: Fa0/1 → VLAN 10 (Urgência), Fa0/2 → VLAN 40 (Laboratório), Fa0/24 → VLAN 50 (servidor). "
              "SW-PISO1: Fa0/1 → VLAN 20 (Bloco), Fa0/2 → VLAN 30 (Administração), Fa0/3 → VLAN 10 (Urgência pediátrica).",
              "A porta onde o PC está ligado decide a VLAN, e portanto a rede e as regras que se lhe aplicam. 'switchport mode access' impede que a porta vire trunk. "
              "O portfast acelera o arranque dos PCs.",
              todos(ios("SW-CORE", t="access_vlan", **{"if": fa(1), "vlan": 10}), ios("SW-CORE", t="access_vlan", **{"if": fa(2), "vlan": 40}),
                    ios("SW-CORE", t="access_vlan", **{"if": fa(24), "vlan": 50}), ios("SW-PISO1", t="access_vlan", **{"if": fa(1), "vlan": 20}),
                    ios("SW-PISO1", t="access_vlan", **{"if": fa(2), "vlan": 30}), ios("SW-PISO1", t="access_vlan", **{"if": fa(3), "vlan": 10})),
              comandos=[em("SW-CORE", "configure terminal",
                           "interface fa0/1", "description Urgencia - balcao", "switchport mode access", "switchport access vlan 10", "spanning-tree portfast",
                           "interface fa0/2", "description Laboratorio", "switchport mode access", "switchport access vlan 40", "spanning-tree portfast",
                           "interface fa0/24", "description SRV-PROCESSO", "switchport mode access", "switchport access vlan 50", "end"),
                        em("SW-PISO1", "configure terminal",
                           "interface fa0/1", "description Bloco operatorio", "switchport mode access", "switchport access vlan 20", "spanning-tree portfast",
                           "interface fa0/2", "description Administracao", "switchport mode access", "switchport access vlan 30", "spanning-tree portfast",
                           "interface fa0/3", "description Urgencia pediatrica", "switchport mode access", "switchport access vlan 10", "spanning-tree portfast", "end")],
              verificar=[ver("show vlan brief", "Fa0/1 na URGENCIA, Fa0/2 no LABORATORIO, Fa0/24 em SERVIDORES (SW-CORE)")]),
        etapa("Trunk entre os dois switches",
              "Ligação SW-CORE Gi0/2 ↔ SW-PISO1 Gi0/1 em trunk, com VLAN nativa 999, só as VLANs do hospital e sem DTP.",
              "O mesmo cabo entre pisos tem de levar todas as VLANs; o 802.1Q põe uma etiqueta com o número da VLAN em cada trama. "
              "A VLAN nativa vai sem etiqueta: usar uma VLAN sem equipamentos (999) e desligar o DTP protege contra VLAN hopping.",
              todos(ios("SW-CORE", t="trunk", **{"if": GI2}), ios("SW-PISO1", t="trunk", **{"if": GI1}),
                    ios("SW-CORE", t="native", **{"if": GI2, "vlan": 999}), ios("SW-PISO1", t="native", **{"if": GI1, "vlan": 999})),
              comandos=[em("SW-CORE", "configure terminal", "interface g0/2", "description Trunk para SW-PISO1", "switchport mode trunk",
                           "switchport trunk native vlan 999", ALLOWED, "switchport nonegotiate", "end"),
                        em("SW-PISO1", "configure terminal", "interface g0/1", "description Trunk para SW-CORE", "switchport mode trunk",
                           "switchport trunk native vlan 999", ALLOWED, "switchport nonegotiate", "end")],
              verificar=[ver("show interfaces trunk", "Gi0/2 trunking, native vlan 999, VLANs 10,20,30,40,50,99,999")]),
        etapa("Trunk para o router",
              "SW-CORE Gi0/1 (cabo para o R-HOSP) em trunk, nativa 999, mesmas VLANs.",
              "No router-on-a-stick o router recebe todas as VLANs por um só cabo; por isso a porta do switch tem de ser trunk.",
              todos(ios("SW-CORE", t="trunk", **{"if": GI1}), ios("SW-CORE", t="native", **{"if": GI1, "vlan": 999})),
              comandos=[em("SW-CORE", "configure terminal", "interface g0/1", "description Trunk para R-HOSP", "switchport mode trunk",
                           "switchport trunk native vlan 999", ALLOWED, "end")]),
        etapa("Router-on-a-stick: um gateway por VLAN",
              "No R-HOSP ligue a G0/0/0 e crie as subinterfaces .10, .20, .30, .40, .50 e .99, cada uma com encapsulation dot1Q e o IP .1 da sua rede. A .999 é a nativa (sem IP).",
              "PCs de VLANs diferentes estão em redes diferentes: só um equipamento de camada 3 os liga. Cada subinterface é o gateway de uma VLAN; "
              "a etiqueta 802.1Q diz ao router a que subinterface pertence cada trama.",
              todos(ios("R-HOSP", t="iface_up", **{"if": G0}), *[ios("R-HOSP", t="subif", **{"if": f"{G0}.{v}", "vlan": v, "ip": f"172.16.{v}.1"}) for v in (10, 20, 30, 40, 50, 99)]),
              comandos=[em("R-HOSP", *ENTRAR, "hostname R-HOSP", "enable secret Hosp#Router2026", f"interface {G0}", "description Trunk para SW-CORE", "no shutdown",
                           *[x for v, n, _ in HV if v != 999 for x in (f"interface {G0}.{v}", f"description Gateway {n}", f"encapsulation dot1Q {v}", f"ip address 172.16.{v}.1 255.255.255.0")],
                           f"interface {G0}.999", "encapsulation dot1Q 999 native", "end")],
              verificar=[ver("show ip interface brief", "G0/0/0.10 … G0/0/0.99 up up com os IPs .1")]),
        etapa("Servidor do processo clínico e DNS interno",
              "SRV-PROCESSO com 172.16.50.10/24, gateway 172.16.50.1. Registo DNS processo.hospital.local → 172.16.50.10.",
              "O processo clínico é o sistema mais crítico: fica numa VLAN só de servidores, com IP fixo, e os médicos abrem-no por um nome que não muda.",
              todos({"t": "pc_ip", "nome": "SRV-PROCESSO", "ip": "172.16.50.10", "mask": M24, "gw": "172.16.50.1"}, {"t": "dns", "nome": "SRV-PROCESSO", "registo": "processo.hospital.local"}),
              acoes=[a_ip("SRV-PROCESSO", "172.16.50.10", M24, "172.16.50.1", "172.16.50.10"), a_dns("SRV-PROCESSO", "processo.hospital.local", "172.16.50.10")]),
        etapa("DHCP por VLAN no router",
              "Exclua os endereços .1 a .20 de cada rede e crie os pools URGENCIA, BLOCO, ADMIN e LAB, cada um com o seu gateway e o DNS 172.16.50.10.",
              "Um pool por VLAN: o router sabe de que VLAN vem o pedido pela subinterface onde chega e escolhe o pool com essa rede. "
              "Assim cada PC recebe o gateway certo do seu serviço.",
              todos(*[ios("R-HOSP", t="dhcp_gw", name=n, v=f"172.16.{v}.1") for n, v in POOLS_H]),
              comandos=[em("R-HOSP", "configure terminal", *[f"ip dhcp excluded-address 172.16.{v}.1 172.16.{v}.20" for _, v in POOLS_H],
                           *[x for n, v in POOLS_H for x in (f"ip dhcp pool {n}", f"network 172.16.{v}.0 255.255.255.0", f"default-router 172.16.{v}.1",
                                                              "dns-server 172.16.50.10", "domain-name hospital.local")], "end")],
              verificar=[ver("show ip dhcp pool", "Quatro pools, um por serviço")]),
        etapa("Os PCs de cada serviço recebem IP",
              "Renove o IP em todos os PCs.",
              "Se um PC recebe 169.254.x.x (APIPA), o pedido não chegou ao router: verifique a VLAN da porta, o trunk e a subinterface.",
              todos(*[{"t": "dhcp", "nome": p} for p in HPC]),
              acoes=[a_prompt(p, "ipconfig /renew") for p in HPC],
              verificar=[ver("PC-BLOCO › ipconfig", "172.16.20.21, gateway 172.16.20.1"), ver("R-HOSP › show ip dhcp binding", "Um endereço em cada rede")]),
        etapa("Testar: mesma VLAN em pisos diferentes e acesso ao processo clínico",
              "PC-URG1 (piso 0) faz ping ao PC-URG2 (piso 1): mesma VLAN, atravessa o trunk. PC-BLOCO faz ping a processo.hospital.local.",
              "O primeiro teste prova que o trunk leva a VLAN 10 entre pisos; o segundo prova o encaminhamento entre VLANs e o DNS.",
              todos(ping("PC-URG1", "PC-URG2"), ping("PC-BLOCO", "processo.hospital.local"), ping("PC-ADMIN", "PC-BLOCO")),
              acoes=[a_prompt("PC-URG1", "ping 172.16.10.22"), a_prompt("PC-BLOCO", "ping processo.hospital.local")],
              verificar=[ver("PC-BLOCO › tracert 172.16.50.10", "1.º salto 172.16.20.1 (o router), depois o servidor")]),
        etapa("ACL: a Administração não entra no Bloco Operatório",
              "Crie a ACL alargada ADMIN-SEM-BLOCO: nega da rede 172.16.30.0/24 para 172.16.20.0/24 e permite o resto. Aplique-a na entrada da G0/0/0.30.",
              "Era este o pedido da Direção: os equipamentos médicos do Bloco não devem ser alcançáveis a partir da rede administrativa (onde se abre e-mail e Internet). "
              "A ACL alargada aplica-se perto da origem, na subinterface da Administração, e deixa a Administração continuar a usar o processo clínico.",
              todos({"t": "acl_bloqueia", "de": "PC-ADMIN", "para": "PC-BLOCO"}, ping("PC-ADMIN", "172.16.50.10"), ping("PC-URG1", "PC-BLOCO")),
              comandos=[em("R-HOSP", "configure terminal", "ip access-list extended ADMIN-SEM-BLOCO",
                           ("deny ip 172.16.30.0 0.0.0.255 172.16.20.0 0.0.0.255", "Nega tudo o que sai da Administração para o Bloco Operatório.", "É exatamente o tráfego que a Direção quer impedir."),
                           ("permit ip any any", "Permite todo o resto.", "Sem esta linha o 'deny any' implícito cortava também o processo clínico e a Internet."),
                           "exit", f"interface {G0}.30", "ip access-group ADMIN-SEM-BLOCO in", "end")],
              verificar=[ver("PC-ADMIN › ping 172.16.20.21", "Destination host unreachable / falha"), ver("R-HOSP › show access-lists", "Contadores (matches) a subir na linha deny")]),
        etapa("Segurança das portas",
              "No SW-PISO1: port-security nas portas Fa0/1-3 (máximo 2 MAC, sticky, violation restrict) e desligue as portas não usadas Fa0/4-24 e Gi0/2.",
              "Uma tomada no corredor é uma porta aberta para a rede clínica. Com port-security só o equipamento aprendido (e um telefone) funciona; "
              "portas sem uso desligadas não podem ser usadas por ninguém.",
              todos(ios("SW-PISO1", t="portsec", **{"if": fa(1)}), ios("SW-PISO1", t="portsec_sticky", **{"if": fa(2)}), ios("SW-PISO1", t="portsec_max", **{"if": fa(3), "v": 2}),
                    {"t": "nao", "c": ios("SW-PISO1", t="iface_up", **{"if": fa(10)})}),
              comandos=[em("SW-PISO1", "configure terminal", "interface range fa0/1 - 3", "switchport port-security", "switchport port-security maximum 2",
                           "switchport port-security mac-address sticky", "switchport port-security violation restrict",
                           "interface range fa0/4 - 24", "description Sem uso", "shutdown", "interface g0/2", "shutdown", "end")],
              verificar=[ver("show port-security interface fa0/1", "Port Security: Enabled, Maximum MAC Addresses: 2, Sticky")]),
        etapa("VLAN de gestão e guardar tudo",
              "Dê IP de gestão aos switches na VLAN 99 (SW-CORE 172.16.99.2, SW-PISO1 172.16.99.3) com gateway 172.16.99.1 e guarde a configuração dos 3 equipamentos.",
              "A gestão fica separada dos utilizadores (VLAN 99, não a VLAN 1). Guardar é o último passo de qualquer intervenção.",
              todos(ios("SW-CORE", t="svi", **{"if": "Vlan99", "ip": "172.16.99.2"}), ios("SW-PISO1", t="svi", **{"if": "Vlan99", "ip": "172.16.99.3"}),
                    ios("SW-CORE", t="saved"), ios("SW-PISO1", t="saved"), ios("R-HOSP", t="saved")),
              comandos=[em("SW-CORE", "configure terminal", "interface vlan 99", "ip address 172.16.99.2 255.255.255.0", "no shutdown", "exit",
                           "ip default-gateway 172.16.99.1", "end", "copy running-config startup-config"),
                        em("SW-PISO1", "configure terminal", "interface vlan 99", "ip address 172.16.99.3 255.255.255.0", "no shutdown", "exit",
                           "ip default-gateway 172.16.99.1", "end", "copy running-config startup-config"),
                        em("R-HOSP", "copy running-config startup-config")]),
    ],
    ["Acrescente a VLAN 60 CONVIDADOS (Wi-Fi da sala de espera) só com acesso à Internet.",
     "Crie uma ACL que deixe só o Laboratório e a Urgência escrever no processo clínico (porta 443) e a Administração só ler relatórios (porta 80).",
     "Configure SSH nos switches para os gerir a partir da VLAN 99.", "Substitua o router-on-a-stick por um switch multicamada (veja o projeto da escola)."],
    [erro("VLAN criada só num switch", "As tramas dessa VLAN são descartadas no outro switch: crie a VLAN em todos os switches do caminho."),
     erro("VLAN nativa diferente nos dois lados do trunk", "Aparece 'native VLAN mismatch' no CDP e as tramas sem etiqueta vão para a VLAN errada."),
     erro("Subinterface sem 'encapsulation dot1Q'", "O IOS nem deixa pôr o IP; e sem etiqueta o router não sabe a VLAN."),
     erro("Esquecer o 'no shutdown' na interface física G0/0/0", "As subinterfaces dependem da física: todas ficam down."),
     erro("ACL sem 'permit ip any any' no fim", "O 'deny any' implícito corta todo o tráfego da Administração, incluindo o processo clínico.")],
    "srwe4")


# =================================================================================== 6. Escola (switch L3)
EV = [(10, "PROFESSORES"), (20, "ALUNOS"), (30, "SECRETARIA")]
EPC = ["PC-PROF", "PC-ALUNO1", "PC-ALUNO2", "PC-SECRET"]
P_ESCOLA = projeto(
    "escola", 6, "Escola secundária: switch multicamada e DHCP relay", "Intermédio", "Escola", "switch_l3", "1 h 30",
    "VLANs encaminhadas por um switch L3 (SVIs e ip routing) e DHCP central com ip helper-address.",
    "A Escola Secundária do Vale quer separar Professores, Alunos e Secretaria. Com centenas de alunos, o router-on-a-stick seria um gargalo: "
    "o encaminhamento entre VLANs vai ser feito no switch central multicamada (D-CORE) e o DHCP fica centralizado no router de saída R-EDGE.",
    ["VLANs e trunk entre o switch de piso e o switch central", "Encaminhamento entre VLANs no switch L3 (SVIs)", "Ligação L3 ponto a ponto ao router",
     "DHCP centralizado com DHCP relay", "Testes entre VLANs"],
    ["srwe3", "srwe4", "srwe7", "srwe15"],
    [plano("10.10.10.0/24", "10", "10.10.10.1 (SVI)", "Professores"), plano("10.10.20.0/24", "20", "10.10.20.1 (SVI)", "Alunos"),
     plano("10.10.30.0/24", "30", "10.10.30.1 (SVI)", "Secretaria"), plano("10.10.0.0/30", "—", "D-CORE .1 / R-EDGE .2", "Ligação ponto a ponto ao router")],
    [equip("D-CORE", "Switch multicamada 3650", "Gateway de todas as VLANs (SVIs)"), equip("SW-BLOCOA", "Switch 2960", "Salas do bloco A"),
     equip("R-EDGE", "Router ISR 4331", "Servidor DHCP central e saída"), equip("PC-PROF, PC-ALUNO1, PC-ALUNO2, PC-SECRET", "PC", "Postos")],
    [dev("R-EDGE", "router", 80, 10, nomeIos="Router"), dev("D-CORE", "switch_l3", 55, 40, nomeIos="Switch"), dev("SW-BLOCOA", "switch", 22, 40, nomeIos="Switch"),
     dev("PC-PROF", "pc", 8, 85, dhcp=True), dev("PC-ALUNO1", "pc", 28, 85, dhcp=True), dev("PC-ALUNO2", "pc", 46, 85, dhcp=True), dev("PC-SECRET", "pc", 75, 85, dhcp=True)],
    [lig("SW-BLOCOA", GI1, "D-CORE", GI1, "cruzado", "trunk"), lig("D-CORE", GI2, "R-EDGE", G0, rotulo="10.10.0.0/30"),
     lig("PC-PROF", FA0, "SW-BLOCOA", fa(1), rotulo="V10"), lig("PC-ALUNO1", FA0, "SW-BLOCOA", fa(2), rotulo="V20"), lig("PC-ALUNO2", FA0, "SW-BLOCOA", fa(3), rotulo="V20"),
     lig("PC-SECRET", FA0, "D-CORE", fa(1), rotulo="V30")],
    [
        etapa("Criar as VLANs nos dois switches",
              "No D-CORE e no SW-BLOCOA: hostname, VLAN 10 PROFESSORES, 20 ALUNOS, 30 SECRETARIA.",
              "Separar alunos de professores e da secretaria protege as notas e os dados pessoais, e limita os broadcasts de centenas de portáteis.",
              todos(*[ios(s, t="vlan", id=v, name=n) for s in ("D-CORE", "SW-BLOCOA") for v, n in EV]),
              comandos=[em(s, *ENTRAR, f"hostname {s}", *[x for v, n in EV for x in (f"vlan {v}", f"name {n}")], "end") for s in ("D-CORE", "SW-BLOCOA")]),
        etapa("Portas de acesso",
              "SW-BLOCOA: Fa0/1 → 10, Fa0/2 e Fa0/3 → 20. D-CORE: Fa0/1 → 30 (secretaria, ao lado do armário).",
              "Cada sala liga à VLAN do seu tipo de utilizador.",
              todos(ios("SW-BLOCOA", t="access_vlan", **{"if": fa(1), "vlan": 10}), ios("SW-BLOCOA", t="access_vlan", **{"if": fa(2), "vlan": 20}),
                    ios("SW-BLOCOA", t="access_vlan", **{"if": fa(3), "vlan": 20}), ios("D-CORE", t="access_vlan", **{"if": fa(1), "vlan": 30})),
              comandos=[em("SW-BLOCOA", "configure terminal", "interface fa0/1", "switchport mode access", "switchport access vlan 10",
                           "interface range fa0/2 - 3", "switchport mode access", "switchport access vlan 20", "end"),
                        em("D-CORE", "configure terminal", "interface fa0/1", "switchport mode access", "switchport access vlan 30", "end")]),
        etapa("Trunk entre o bloco A e o switch central",
              "Gi0/1 em trunk nos dois switches.",
              "O trunk leva as três VLANs entre o bloco A e o núcleo. O 3650 só conhece 802.1Q, por isso basta 'switchport mode trunk' "
              "(nos antigos 3560, que também falavam ISL, era preciso escrever antes 'switchport trunk encapsulation dot1q').",
              todos(ios("D-CORE", t="trunk", **{"if": GI1}), ios("SW-BLOCOA", t="trunk", **{"if": GI1})),
              comandos=[em("D-CORE", "configure terminal", "interface g0/1", "switchport mode trunk", "end"),
                        em("SW-BLOCOA", "configure terminal", "interface g0/1", "switchport mode trunk", "end")]),
        etapa("Encaminhamento entre VLANs no D-CORE",
              "Ligue ip routing e crie as SVIs: Vlan10 10.10.10.1, Vlan20 10.10.20.1, Vlan30 10.10.30.1.",
              "Um switch multicamada encaminha em hardware, à velocidade das portas: muito mais rápido que um único cabo para o router. "
              "Cada SVI é o gateway da sua VLAN.",
              todos(ios("D-CORE", t="ip_routing"), *[ios("D-CORE", t="svi", **{"if": f"Vlan{v}", "ip": f"10.10.{v}.1"}) for v, _ in EV]),
              comandos=[em("D-CORE", "configure terminal", "ip routing",
                           *[x for v, n in EV for x in (f"interface vlan {v}", f"description Gateway {n}", f"ip address 10.10.{v}.1 255.255.255.0", "no shutdown")], "end")],
              verificar=[ver("show ip route", "Três redes C (conectadas): 10.10.10.0, 10.10.20.0, 10.10.30.0")]),
        etapa("Ligação ponto a ponto ao router",
              "No D-CORE a Gi0/2 vira porta de router (no switchport) com 10.10.0.1/30 e rota por defeito para 10.10.0.2. "
              "No R-EDGE: G0/0/0 10.10.0.2/30 e rota de regresso para 10.10.0.0/16 via 10.10.0.1.",
              "Entre o switch e o router só há dois equipamentos: uma /30 chega (2 IPs úteis) e não desperdiça endereços. "
              "O router tem de saber voltar às redes da escola, que estão atrás do D-CORE.",
              todos(ios("D-CORE", t="iface_ip", **{"if": GI2, "ip": "10.10.0.1", "mask": M30}), ios("D-CORE", t="route", net="0.0.0.0", mask="0.0.0.0", via="10.10.0.2"),
                    ios("R-EDGE", t="iface_ip", **{"if": G0, "ip": "10.10.0.2", "mask": M30, "up": True}), ios("R-EDGE", t="route", net="10.10.0.0", mask="255.255.0.0", via="10.10.0.1")),
              comandos=[em("D-CORE", "configure terminal", "interface g0/2", "description Ligacao a R-EDGE", "no switchport", "ip address 10.10.0.1 255.255.255.252", "no shutdown", "exit",
                           "ip route 0.0.0.0 0.0.0.0 10.10.0.2", "end"),
                        em("R-EDGE", *ENTRAR, "hostname R-EDGE", f"interface {G0}", "description Ligacao a D-CORE", "ip address 10.10.0.2 255.255.255.252", "no shutdown", "exit",
                           ("ip route 10.10.0.0 255.255.0.0 10.10.0.1", "Uma só rota (resumida, /16) para todas as redes da escola via D-CORE.", "Em vez de três rotas /24, uma rota resumida: menos trabalho e cabe nela qualquer VLAN nova 10.10.x.0."), "end")]),
        etapa("Pools DHCP no router central",
              "No R-EDGE: exclua .1 a .10 de cada rede e crie os pools PROFESSORES, ALUNOS e SECRETARIA (gateway = SVI de cada VLAN, DNS 8.8.8.8).",
              "Centralizar o DHCP num equipamento facilita a gestão: um só sítio para ver quem tem que IP. O gateway de cada pool é a SVI do D-CORE, não o router.",
              todos(*[ios("R-EDGE", t="dhcp_gw", name=n, v=f"10.10.{v}.1") for v, n in EV]),
              comandos=[em("R-EDGE", "configure terminal", *[f"ip dhcp excluded-address 10.10.{v}.1 10.10.{v}.10" for v, _ in EV],
                           *[x for v, n in EV for x in (f"ip dhcp pool {n}", f"network 10.10.{v}.0 255.255.255.0", f"default-router 10.10.{v}.1", "dns-server 8.8.8.8")], "end")]),
        etapa("DHCP relay nas SVIs",
              "Em cada SVI do D-CORE: ip helper-address 10.10.0.2. Depois renove o IP de todos os PCs.",
              "O pedido DHCP é um broadcast e os broadcasts não passam de uma VLAN para outra. O helper-address apanha-o na SVI e envia-o, dirigido, ao router. "
              "Pela rede da SVI (o 'giaddr'), o router sabe de que pool tirar o endereço.",
              todos(*[{"t": "dhcp", "nome": p} for p in EPC]),
              comandos=[em("D-CORE", "configure terminal", *[x for v, _ in EV for x in (f"interface vlan {v}", "ip helper-address 10.10.0.2")], "end")],
              acoes=[a_prompt(p, "ipconfig /renew") for p in EPC],
              verificar=[ver("PC-ALUNO1 › ipconfig", "10.10.20.11, gateway 10.10.20.1"), ver("R-EDGE › show ip dhcp binding", "Endereços nas três redes")]),
        etapa("Testes entre VLANs e até ao router",
              "PC-ALUNO1 faz ping ao PC-SECRET (outra VLAN) e ao R-EDGE (10.10.0.2).",
              "Confirma o encaminhamento no D-CORE e as rotas nos dois sentidos.",
              todos(ping("PC-ALUNO1", "PC-SECRET"), ping("PC-PROF", "10.10.0.2")),
              acoes=[a_prompt("PC-ALUNO1", "ping 10.10.30.11"), a_prompt("PC-PROF", "ping 10.10.0.2")]),
        etapa("Guardar", "Guarde a configuração dos três equipamentos.", "As VLANs ficam no ficheiro vlan.dat, mas as SVIs, o DHCP, as rotas e o trunk vivem na running-config: sem guardar, perdem-se no próximo corte de energia.",
              todos(ios("D-CORE", t="saved"), ios("SW-BLOCOA", t="saved"), ios("R-EDGE", t="saved")),
              comandos=[em(s, "copy running-config startup-config") for s in ("D-CORE", "SW-BLOCOA", "R-EDGE")]),
    ],
    ["Crie uma ACL que impeça os Alunos de chegar à rede da Secretaria (aplique-a na SVI 20, sentido in).",
     "Junte um segundo switch de piso (bloco B) com trunk para o D-CORE Gi0/… e as mesmas VLANs."],
    [erro("Esquecer 'ip routing' no switch L3", "As SVIs têm IP mas não há encaminhamento entre VLANs."),
     erro("SVI down", "Uma SVI só fica up se a VLAN existir e houver pelo menos uma porta ativa nessa VLAN (ou trunk que a leve)."),
     erro("Faltar a rota de regresso no router", "O pedido DHCP chega ao router mas a resposta não sabe voltar para 10.10.x.0."),
     erro("Gateway do pool = IP do router", "O gateway dos PCs é a SVI da sua VLAN no D-CORE, não o R-EDGE.")],
    "srwe4")


# =================================================================================== 7. Hotel (Wi-Fi hóspedes + NAT)
P_HOTEL = projeto(
    "hotel", 7, "Hotel Atlântico: Wi-Fi de hóspedes separado e NAT/PAT", "Intermédio", "Hotel", "ap", "1 h 30",
    "Duas VLANs (staff e hóspedes), Wi-Fi WPA2, DHCP, acesso à Internet com PAT e hóspedes isolados.",
    "O Hotel Atlântico quer Wi-Fi para os hóspedes sem que estes vejam o PC da receção (com reservas e dados de cartões). "
    "Há um só endereço público do operador (203.0.113.2). Todos — staff e hóspedes — têm de ter Internet.",
    ["VLAN 10 STAFF e VLAN 20 HOSPEDES com router-on-a-stick", "Ligação ao operador e rota por defeito", "DHCP para as duas redes",
     "Wi-Fi dos hóspedes com WPA2", "PAT: todos saem com um IP público", "ACL: hóspedes não chegam à rede do staff"],
    ["srwe3", "srwe4", "srwe7", "srwe13", "ensa6", "ensa5"],
    [plano("192.168.10.0/24", "10", "192.168.10.1", "STAFF (receção, escritório)"), plano("192.168.20.0/24", "20", "192.168.20.1", "HOSPEDES (Wi-Fi)"),
     plano("203.0.113.0/24", "—", "203.0.113.1 (operador)", "WAN: R-HOTEL G0/0/1 = 203.0.113.2")],
    [equip("R-HOTEL", "Router ISR 4331", "Gateway, DHCP, NAT e ACL"), equip("SW-HOTEL", "Switch 2960", "VLANs"), equip("AP-HOSPEDES", "Access point", "Wi-Fi dos hóspedes"),
     equip("INTERNET", "Operador", "Saída para a Internet"), equip("PC-RECECAO", "PC", "Receção (VLAN 10)"), equip("HOSPEDE1, HOSPEDE2", "Portátil e smartphone", "Clientes Wi-Fi")],
    [dev("INTERNET", "nuvem", 85, 8), dev("R-HOTEL", "router", 50, 10, nomeIos="Router"), dev("SW-HOTEL", "switch", 50, 45, nomeIos="Switch"),
     dev("PC-RECECAO", "pc", 15, 85, dhcp=True), dev("AP-HOSPEDES", "ap", 80, 55), dev("HOSPEDE1", "portatil", 65, 90, nic="wifi", dhcp=True), dev("HOSPEDE2", "smartphone", 92, 90)],
    [lig("R-HOTEL", G1, "INTERNET", "Ethernet6", rotulo="WAN"), lig("R-HOTEL", G0, "SW-HOTEL", GI1, rotulo="trunk"),
     lig("PC-RECECAO", FA0, "SW-HOTEL", fa(1), rotulo="V10"), lig("AP-HOSPEDES", "Port0", "SW-HOTEL", fa(2), rotulo="V20")],
    [
        etapa("VLANs, portas e trunk no switch",
              "No SW-HOTEL: VLAN 10 STAFF e 20 HOSPEDES; Fa0/1 (receção) na 10, Fa0/2 (AP) na 20; Gi0/1 (router) em trunk.",
              "O AP está numa porta de acesso da VLAN 20: tudo o que entra pelo Wi-Fi dos hóspedes cai automaticamente na rede dos hóspedes.",
              todos(ios("SW-HOTEL", t="vlan", id=10, name="STAFF"), ios("SW-HOTEL", t="vlan", id=20, name="HOSPEDES"),
                    ios("SW-HOTEL", t="access_vlan", **{"if": fa(1), "vlan": 10}), ios("SW-HOTEL", t="access_vlan", **{"if": fa(2), "vlan": 20}), ios("SW-HOTEL", t="trunk", **{"if": GI1})),
              comandos=[em("SW-HOTEL", *ENTRAR, "hostname SW-HOTEL", "vlan 10", "name STAFF", "vlan 20", "name HOSPEDES", "exit",
                           "interface fa0/1", "description Rececao", "switchport mode access", "switchport access vlan 10",
                           "interface fa0/2", "description AP hospedes", "switchport mode access", "switchport access vlan 20",
                           "interface g0/1", "description Trunk para R-HOTEL", "switchport mode trunk", "end")]),
        etapa("Gateways das duas VLANs no router",
              "No R-HOTEL: G0/0/0 ligada, subinterfaces .10 (192.168.10.1) e .20 (192.168.20.1).",
              "Router-on-a-stick: um único cabo leva as duas VLANs ao router, que é o gateway de ambas (e onde vamos pôr o NAT e a ACL).",
              todos(*[ios("R-HOTEL", t="subif", **{"if": f"{G0}.{v}", "vlan": v, "ip": f"192.168.{v}.1"}) for v in (10, 20)]),
              comandos=[em("R-HOTEL", *ENTRAR, "hostname R-HOTEL", "enable secret Hotel#2026", f"interface {G0}", "no shutdown",
                           f"interface {G0}.10", "description STAFF", "encapsulation dot1Q 10", "ip address 192.168.10.1 255.255.255.0",
                           f"interface {G0}.20", "description HOSPEDES", "encapsulation dot1Q 20", "ip address 192.168.20.1 255.255.255.0", "end")]),
        etapa("Ligação ao operador",
              "G0/0/1 com o IP público 203.0.113.2/24 e rota por defeito para o operador 203.0.113.1.",
              "O router só conhece as redes do hotel; para tudo o resto (a Internet) envia para o operador: é a rota por defeito.",
              todos(ios("R-HOTEL", t="iface_ip", **{"if": G1, "ip": "203.0.113.2", "mask": M24, "up": True}), ios("R-HOTEL", t="route", net="0.0.0.0", mask="0.0.0.0", via="203.0.113.1")),
              comandos=[em("R-HOTEL", "configure terminal", f"interface {G1}", "description WAN operador", "ip address 203.0.113.2 255.255.255.0", "no shutdown", "exit",
                           "ip route 0.0.0.0 0.0.0.0 203.0.113.1", "end")]),
        etapa("DHCP para staff e hóspedes",
              "Exclua .1 a .9 de cada rede e crie os pools STAFF e HOSPEDES (gateway .1, DNS 8.8.8.8).",
              "Os hóspedes nunca configurariam IPs à mão. O DNS público basta, porque não há servidores internos para os hóspedes.",
              todos(ios("R-HOTEL", t="dhcp_gw", name="STAFF", v="192.168.10.1"), ios("R-HOTEL", t="dhcp_gw", name="HOSPEDES", v="192.168.20.1")),
              comandos=[em("R-HOTEL", "configure terminal", "ip dhcp excluded-address 192.168.10.1 192.168.10.9", "ip dhcp excluded-address 192.168.20.1 192.168.20.9",
                           "ip dhcp pool STAFF", "network 192.168.10.0 255.255.255.0", "default-router 192.168.10.1", "dns-server 8.8.8.8",
                           "ip dhcp pool HOSPEDES", "network 192.168.20.0 255.255.255.0", "default-router 192.168.20.1", "dns-server 8.8.8.8", "end")]),
        etapa("Wi-Fi dos hóspedes",
              "No AP-HOSPEDES: SSID “Hotel-Atlantico-Hospedes”, WPA2-Pessoal, chave dada no check-in.",
              "Com WPA2 o tráfego no ar vai cifrado e só entra quem está hospedado. A chave pode mudar todas as semanas.",
              {"t": "wifi_rede", "nome": "AP-HOSPEDES", "ssid": "Hotel-Atlantico-Hospedes", "seg": "wpa2"},
              acoes=[a_wifi("AP-HOSPEDES", "Hotel-Atlantico-Hospedes", "Atlantico2026!")]),
        etapa("Hóspedes e receção recebem IP",
              "Ligue o HOSPEDE1 e o HOSPEDE2 ao Wi-Fi e renove o IP da receção.",
              "Os hóspedes ficam em 192.168.20.x (VLAN 20, através do AP); a receção em 192.168.10.x.",
              todos({"t": "wifi_ligado", "nome": "HOSPEDE1"}, {"t": "wifi_ligado", "nome": "HOSPEDE2"}, {"t": "dhcp", "nome": "HOSPEDE1"}, {"t": "dhcp", "nome": "HOSPEDE2"}, {"t": "dhcp", "nome": "PC-RECECAO"}),
              acoes=[a_cliente("HOSPEDE1", "Hotel-Atlantico-Hospedes", "Atlantico2026!"), a_cliente("HOSPEDE2", "Hotel-Atlantico-Hospedes", "Atlantico2026!"), a_prompt("PC-RECECAO", "ipconfig /renew")]),
        etapa("NAT/PAT para a Internet",
              "Marque as subinterfaces como inside e a G0/0/1 como outside; ACL 1 com as duas redes; NAT com overload na G0/0/1.",
              "Os endereços 192.168.x.x são privados: a Internet não sabe voltar a eles. O PAT troca a origem pelo IP público do router e usa as portas para distinguir cada ligação. "
              "Um único IP público serve o hotel inteiro.",
              todos({"t": "nat_ok", "de": "HOSPEDE2", "para": "8.8.8.8", "global": "203.0.113.2"}, {"t": "nat_ok", "de": "PC-RECECAO", "para": "8.8.8.8"}),
              comandos=[em("R-HOTEL", "configure terminal", f"interface {G0}.10", "ip nat inside", f"interface {G0}.20", "ip nat inside", f"interface {G1}", "ip nat outside", "exit",
                           "access-list 1 permit 192.168.10.0 0.0.0.255", "access-list 1 permit 192.168.20.0 0.0.0.255",
                           f"ip nat inside source list 1 interface {G1} overload", "end")],
              acoes=[a_prompt("HOSPEDE2", "ping 8.8.8.8")],
              verificar=[ver("R-HOTEL › show ip nat translations", "icmp 203.0.113.2:x  192.168.20.x:x  8.8.8.8")]),
        etapa("Isolar os hóspedes",
              "ACL alargada HOSPEDES-ISOLADOS na entrada da G0/0/0.20: nega 192.168.20.0/24 → 192.168.10.0/24 e permite o resto.",
              "Um hóspede mal-intencionado (ou com o portátil infetado) não pode chegar ao PC da receção. Continua a ter Internet.",
              todos({"t": "acl_bloqueia", "de": "HOSPEDE1", "para": "PC-RECECAO"}, {"t": "nat_ok", "de": "HOSPEDE1", "para": "8.8.8.8"}),
              comandos=[em("R-HOTEL", "configure terminal", "ip access-list extended HOSPEDES-ISOLADOS", "deny ip 192.168.20.0 0.0.0.255 192.168.10.0 0.0.0.255",
                           "permit ip any any", "exit", f"interface {G0}.20", "ip access-group HOSPEDES-ISOLADOS in", "end", "copy running-config startup-config")]),
    ],
    ["Limite o Wi-Fi dos hóspedes a 50 endereços (pool com rede /26) e veja o que acontece quando se esgota.",
     "Crie uma terceira VLAN para as câmaras de vigilância sem acesso à Internet."],
    [erro("Esquecer 'ip nat inside' numa das subinterfaces", "Só uma das redes tem Internet."),
     erro("ACL do NAT só com uma rede", "A rede que falta na access-list 1 não é traduzida e não sai."),
     erro("ACL de isolamento aplicada na G0/0/0.10 'in'", "Bloquearia a receção em vez dos hóspedes. Aplica-se na entrada da rede de onde vem o tráfego a bloquear.")],
    "ensa6")


# =================================================================================== 8. Filiais (rotas estáticas)
FILIAIS = [("R-LISBOA", "SW-LISBOA", "PC-LISBOA", 1, 50, 10), ("R-PORTO", "SW-PORTO", "PC-PORTO", 2, 15, 45), ("R-FARO", "SW-FARO", "PC-FARO", 3, 85, 45)]
P_FILIAIS = projeto(
    "filiais", 8, "Cadeia de farmácias: sede e filiais com rotas estáticas", "Intermédio", "Empresa com filiais", "router", "1 h 15",
    "Três routers, ligações ponto a ponto /30, rotas por defeito nas filiais e rotas estáticas na sede.",
    "A Farmácias Vida tem a sede em Lisboa e lojas no Porto e em Faro, ligadas à sede por circuitos do operador. "
    "As lojas têm de chegar ao servidor de stock da sede e falar entre si (passando pela sede). A rede é pequena e estável: rotas estáticas chegam.",
    ["Endereçar as LANs e as ligações WAN (/30)", "Configurar os três routers", "Rotas por defeito nas filiais", "Rotas estáticas na sede", "Testar de ponta a ponta"],
    ["itn10", "itn11", "srwe14", "srwe15", "srwe16"],
    [plano("10.1.0.0/24", "—", "10.1.0.1", "LAN Lisboa (sede)"), plano("10.2.0.0/24", "—", "10.2.0.1", "LAN Porto"), plano("10.3.0.0/24", "—", "10.3.0.1", "LAN Faro"),
     plano("10.255.0.0/30", "—", "Lisboa .1 / Porto .2", "WAN Lisboa–Porto"), plano("10.255.0.4/30", "—", "Lisboa .5 / Faro .6", "WAN Lisboa–Faro")],
    [equip("R-LISBOA, R-PORTO, R-FARO", "Router ISR 4331", "Um por local"), equip("SW-*", "Switch 2960", "LAN de cada local"), equip("PC-*", "PC", "Um posto por local")],
    [d for r, s, p, n, x, y in FILIAIS for d in (dev(r, "router", x, y, nomeIos="Router"), dev(s, "switch", x, y + 28), dev(p, "pc", x, y + 50 if y > 20 else y + 52))],
    [lig("R-LISBOA", G1, "R-PORTO", G1, "cruzado", "10.255.0.0/30"), lig("R-LISBOA", G2, "R-FARO", G1, "cruzado", "10.255.0.4/30")]
    + [l for r, s, p, n, x, y in FILIAIS for l in (lig(r, G0, s, GI1), lig(p, FA0, s, fa(1)))],
    [
        etapa("Router da sede (Lisboa)",
              "Hostname R-LISBOA; G0/0/0 10.1.0.1/24 (LAN); G0/0/1 10.255.0.1/30 (Porto); G0/0/2 10.255.0.5/30 (Faro). Todas ligadas e com descrição.",
              "Numa ligação entre dois routers só são precisos 2 endereços: a /30 tem exatamente 2 úteis. As descrições dizem que circuito é cada interface (útil quando se liga ao operador por avaria).",
              todos(ios("R-LISBOA", t="iface_ip", **{"if": G0, "ip": "10.1.0.1", "mask": M24, "up": True}), ios("R-LISBOA", t="iface_ip", **{"if": G1, "ip": "10.255.0.1", "mask": M30, "up": True}),
                    ios("R-LISBOA", t="iface_ip", **{"if": G2, "ip": "10.255.0.5", "mask": M30, "up": True})),
              comandos=[em("R-LISBOA", *ENTRAR, "hostname R-LISBOA", f"interface {G0}", "description LAN sede", "ip address 10.1.0.1 255.255.255.0", "no shutdown",
                           f"interface {G1}", "description WAN para Porto", "ip address 10.255.0.1 255.255.255.252", "no shutdown",
                           f"interface {G2}", "description WAN para Faro", "ip address 10.255.0.5 255.255.255.252", "no shutdown", "end")],
              verificar=[ver("show ip interface brief", "Três interfaces up/up")]),
        etapa("Router do Porto",
              "Hostname R-PORTO; G0/0/0 10.2.0.1/24; G0/0/1 10.255.0.2/30.",
              "O IP WAN do Porto é o outro endereço útil da mesma /30 da sede.",
              todos(ios("R-PORTO", t="iface_ip", **{"if": G0, "ip": "10.2.0.1", "mask": M24, "up": True}), ios("R-PORTO", t="iface_ip", **{"if": G1, "ip": "10.255.0.2", "mask": M30, "up": True})),
              comandos=[em("R-PORTO", *ENTRAR, "hostname R-PORTO", f"interface {G0}", "description LAN Porto", "ip address 10.2.0.1 255.255.255.0", "no shutdown",
                           f"interface {G1}", "description WAN para Lisboa", "ip address 10.255.0.2 255.255.255.252", "no shutdown", "end")]),
        etapa("Router de Faro",
              "Hostname R-FARO; G0/0/0 10.3.0.1/24; G0/0/1 10.255.0.6/30.",
              "Mesma lógica: .6 é o par de .5 na rede 10.255.0.4/30.",
              todos(ios("R-FARO", t="iface_ip", **{"if": G0, "ip": "10.3.0.1", "mask": M24, "up": True}), ios("R-FARO", t="iface_ip", **{"if": G1, "ip": "10.255.0.6", "mask": M30, "up": True})),
              comandos=[em("R-FARO", *ENTRAR, "hostname R-FARO", f"interface {G0}", "description LAN Faro", "ip address 10.3.0.1 255.255.255.0", "no shutdown",
                           f"interface {G1}", "description WAN para Lisboa", "ip address 10.255.0.6 255.255.255.252", "no shutdown", "end")]),
        etapa("IP dos PCs",
              "PC-LISBOA 10.1.0.10, PC-PORTO 10.2.0.10, PC-FARO 10.3.0.10 (máscara /24, gateway .1 do seu router).",
              "O gateway é o router do próprio local: é para lá que o PC envia tudo o que não é da sua rede.",
              todos(*[{"t": "pc_ip", "nome": p, "ip": f"10.{n}.0.10", "mask": M24, "gw": f"10.{n}.0.1"} for r, s, p, n, x, y in FILIAIS]),
              acoes=[a_ip(p, f"10.{n}.0.10", M24, f"10.{n}.0.1") for r, s, p, n, x, y in FILIAIS],
              verificar=[ver("PC-PORTO › ping 10.1.0.10", "Falha! O R-PORTO ainda não conhece a rede 10.1.0.0 — é o que resolvemos a seguir.")]),
        etapa("Rotas por defeito nas filiais",
              "No R-PORTO e no R-FARO: rota por defeito para o IP da sede na sua ligação.",
              "Uma filial só tem uma saída (a sede). Em vez de uma rota por rede, basta dizer: 'tudo o que não conheço vai para Lisboa'. Se a empresa abrir mais lojas, as filiais não precisam de mudar.",
              todos(ios("R-PORTO", t="route", net="0.0.0.0", mask="0.0.0.0", via="10.255.0.1"), ios("R-FARO", t="route", net="0.0.0.0", mask="0.0.0.0", via="10.255.0.5")),
              comandos=[em("R-PORTO", "configure terminal", "ip route 0.0.0.0 0.0.0.0 10.255.0.1", "end"), em("R-FARO", "configure terminal", "ip route 0.0.0.0 0.0.0.0 10.255.0.5", "end")]),
        etapa("Rotas estáticas na sede",
              "No R-LISBOA: rota para 10.2.0.0/24 via 10.255.0.2 e para 10.3.0.0/24 via 10.255.0.6.",
              "A sede está no centro e tem de saber exatamente onde está cada loja. Sem estas rotas os pacotes chegam a Lisboa mas não sabem continuar.",
              todos(ios("R-LISBOA", t="route", net="10.2.0.0", mask=M24, via="10.255.0.2"), ios("R-LISBOA", t="route", net="10.3.0.0", mask=M24, via="10.255.0.6")),
              comandos=[em("R-LISBOA", "configure terminal", "ip route 10.2.0.0 255.255.255.0 10.255.0.2", "ip route 10.3.0.0 255.255.255.0 10.255.0.6", "end")],
              verificar=[ver("R-LISBOA › show ip route", "Duas rotas S e três redes C")]),
        etapa("Testar de ponta a ponta",
              "PC-PORTO faz ping ao PC-LISBOA e ao PC-FARO; veja o caminho com tracert.",
              "O ping Porto→Faro prova as três peças: rota por defeito no Porto, rota estática em Lisboa e rota por defeito de regresso em Faro.",
              todos(ping("PC-PORTO", "10.1.0.10"), ping("PC-PORTO", "10.3.0.10"), ping("PC-FARO", "10.1.0.10")),
              acoes=[a_prompt("PC-PORTO", "tracert 10.3.0.10")],
              verificar=[ver("PC-PORTO › tracert 10.3.0.10", "10.2.0.1 → 10.255.0.1 → 10.255.0.6 → 10.3.0.10")]),
        etapa("Guardar", "Guarde a configuração dos três routers.", "Rotas estáticas perdidas num reinício = lojas sem sistema de stock.",
              todos(*[ios(r, t="saved") for r, *_ in FILIAIS]), comandos=[em(r, "copy running-config startup-config") for r, *_ in FILIAIS]),
    ],
    ["Ligue diretamente Porto e Faro (G0/0/2, 10.255.0.8/30) e crie rotas flutuantes (distância 200) como reserva.",
     "Substitua as rotas estáticas por OSPF (veja o projeto do campus) e compare o trabalho."],
    [erro("Rota com o próximo salto errado (IP do próprio router)", "O próximo salto é o IP do router vizinho na mesma /30."),
     erro("Esquecer a rota de regresso", "O ping vai mas a resposta não volta: as rotas têm de existir nos dois sentidos."),
     erro("Máscara /24 numa ligação /30", "As duas pontas ficam em redes diferentes e não comunicam.")],
    "srwe15")


# =================================================================================== 9. Campus OSPF
CAMPUS = [("R-REITORIA", 1, 50, 10, [(G1, "10.0.0.1"), (G2, "10.0.0.5")]), ("R-ENG", 2, 15, 45, [(G1, "10.0.0.2"), (G2, "10.0.0.9")]),
          ("R-MED", 3, 85, 45, [(G1, "10.0.0.6"), (G2, "10.0.0.10")])]
CPC = {1: "PC-REITORIA", 2: "PC-ENG", 3: "PC-MED"}


def _ospf_cmds(r, n, links):
    return em(r, *ENTRAR, f"hostname {r}", f"interface {G0}", "description LAN", f"ip address 172.20.{n}.1 255.255.255.0", "no shutdown",
              *[x for i, ip in links for x in (f"interface {i}", "description Ligacao entre edificios", f"ip address {ip} 255.255.255.252", "no shutdown")], "end")


P_CAMPUS = projeto(
    "campus", 9, "Campus universitário: OSPF entre três edifícios", "Avançado", "Campus", "router", "1 h 30",
    "Três routers em triângulo com OSPF área 0, router-id, interfaces passivas e recuperação automática de falhas.",
    "A Universidade do Mondego tem Reitoria, Engenharia e Medicina, ligados em triângulo por fibra. "
    "Querem que, se uma fibra for cortada nas obras, o tráfego passe automaticamente pelo outro edifício, sem ninguém mexer nos routers.",
    ["Endereçar as LANs e as três ligações /30", "OSPF área 0 com router-id fixo", "Interfaces passivas do lado dos utilizadores",
     "Ver vizinhos e rotas aprendidas", "Testar a recuperação automática quando uma fibra é cortada"],
    ["ensa1", "ensa2", "itn11", "srwe14"],
    [plano("172.20.1.0/24", "—", "172.20.1.1", "LAN Reitoria"), plano("172.20.2.0/24", "—", "172.20.2.1", "LAN Engenharia"), plano("172.20.3.0/24", "—", "172.20.3.1", "LAN Medicina"),
     plano("10.0.0.0/30", "—", ".1 REI / .2 ENG", "Fibra Reitoria–Engenharia"), plano("10.0.0.4/30", "—", ".5 REI / .6 MED", "Fibra Reitoria–Medicina"),
     plano("10.0.0.8/30", "—", ".9 ENG / .10 MED", "Fibra Engenharia–Medicina")],
    [equip("R-REITORIA, R-ENG, R-MED", "Router ISR 4331", "Um por edifício (router-id 1.1.1.1, 2.2.2.2, 3.3.3.3)"), equip("SW-*", "Switch 2960", "LAN"),
     equip("PC-REITORIA, PC-ENG, PC-MED", "PC", "Já configurados")],
    [d for r, n, x, y, _ in CAMPUS for d in (dev(r, "router", x, y, nomeIos="Router"), dev(f"SW-{r[2:]}", "switch", x, y + 28),
                                               dev(CPC[n], "pc", x, min(y + 50, 95), ip=f"172.20.{n}.10", mask=M24, gw=f"172.20.{n}.1"))],
    [lig("R-REITORIA", G1, "R-ENG", G1, "cruzado", "10.0.0.0/30"), lig("R-REITORIA", G2, "R-MED", G1, "cruzado", "10.0.0.4/30"), lig("R-ENG", G2, "R-MED", G2, "cruzado", "10.0.0.8/30")]
    + [l for r, n, *_ in CAMPUS for l in (lig(r, G0, f"SW-{r[2:]}", GI1), lig(CPC[n], FA0, f"SW-{r[2:]}", fa(1)))],
    [
        etapa("Interfaces dos três routers",
              "Configure em cada router o hostname, a LAN (172.20.N.1/24) e as duas ligações /30 do plano.",
              "Antes de qualquer protocolo de encaminhamento, as ligações diretas têm de funcionar: o OSPF só forma vizinhança em interfaces up com IP na mesma rede.",
              todos(*[ios(r, t="iface_ip", **{"if": i, "ip": ip, "mask": M30, "up": True}) for r, n, x, y, ls in CAMPUS for i, ip in ls],
                    *[ios(r, t="iface_ip", **{"if": G0, "ip": f"172.20.{n}.1", "mask": M24, "up": True}) for r, n, *_ in CAMPUS]),
              comandos=[_ospf_cmds(r, n, ls) for r, n, x, y, ls in CAMPUS],
              verificar=[ver("R-ENG › ping 10.0.0.1", "Os vizinhos diretos respondem"), ver("PC-ENG › ping 172.20.3.10", "Ainda falha: os routers não conhecem as LANs uns dos outros")]),
        etapa("OSPF na Reitoria",
              "router ospf 1, router-id 1.1.1.1, anuncie a LAN e as duas /30 na área 0 e ponha a G0/0/0 passiva.",
              "O OSPF descobre vizinhos com Hellos, troca o mapa da rede (LSAs) e calcula o caminho mais curto (algoritmo SPF de Dijkstra). "
              "O router-id identifica o router; fixá-lo evita que mude sozinho.",
              todos(ios("R-REITORIA", t="ospf_rid", v="1.1.1.1"), ios("R-REITORIA", t="ospf_net", net="172.20.1.0", wc="0.0.0.255", area="0"),
                    ios("R-REITORIA", t="ospf_net", net="10.0.0.0", wc="0.0.0.3", area="0"), ios("R-REITORIA", t="passive", **{"if": G0})),
              comandos=[em("R-REITORIA", "configure terminal", "router ospf 1", "router-id 1.1.1.1", "network 172.20.1.0 0.0.0.255 area 0",
                           "network 10.0.0.0 0.0.0.3 area 0", "network 10.0.0.4 0.0.0.3 area 0", f"passive-interface {G0}", "end")]),
        etapa("OSPF na Engenharia",
              "Mesma configuração no R-ENG com router-id 2.2.2.2 e as suas redes.",
              "Assim que as duas pontas de uma ligação têm OSPF na mesma área, formam vizinhança (estado FULL).",
              todos({"t": "ospf_viz", "nome": "R-ENG", "n": 1}, ios("R-ENG", t="ospf_rid", v="2.2.2.2")),
              comandos=[em("R-ENG", "configure terminal", "router ospf 1", "router-id 2.2.2.2", "network 172.20.2.0 0.0.0.255 area 0",
                           "network 10.0.0.0 0.0.0.3 area 0", "network 10.0.0.8 0.0.0.3 area 0", f"passive-interface {G0}", "end")],
              verificar=[ver("R-ENG › show ip ospf neighbor", "1.1.1.1 FULL")]),
        etapa("OSPF na Medicina",
              "R-MED com router-id 3.3.3.3 e as suas redes.",
              "Fechado o triângulo, cada router tem 2 vizinhos e aprende as três LANs.",
              todos({"t": "ospf_viz", "nome": "R-REITORIA", "n": 2}, {"t": "ospf_viz", "nome": "R-MED", "n": 2}, {"t": "ospf_viz", "nome": "R-ENG", "n": 2}),
              comandos=[em("R-MED", "configure terminal", "router ospf 1", "router-id 3.3.3.3", "network 172.20.3.0 0.0.0.255 area 0",
                           "network 10.0.0.4 0.0.0.3 area 0", "network 10.0.0.8 0.0.0.3 area 0", f"passive-interface {G0}", "end")],
              verificar=[ver("R-MED › show ip route ospf", "O 172.20.1.0 e O 172.20.2.0 (rotas aprendidas por OSPF)")]),
        etapa("Testar entre edifícios",
              "PC-ENG faz ping ao PC-MED e ao PC-REITORIA.",
              "Os PCs já têm IP; agora os routers conhecem todas as redes.",
              todos(ping("PC-ENG", "172.20.3.10"), ping("PC-ENG", "172.20.1.10")),
              acoes=[a_prompt("PC-ENG", "tracert 172.20.3.10")],
              verificar=[ver("PC-ENG › tracert 172.20.3.10", "Vai direto pela fibra ENG–MED (custo menor)")]),
        etapa("Cortar uma fibra: recuperação automática",
              "Simule o corte da fibra Engenharia–Medicina: shutdown na G0/0/2 do R-ENG. Volte a fazer ping do PC-ENG ao PC-MED.",
              "É a razão de ser do OSPF: perdida a vizinhança, os routers recalculam e o tráfego passa pela Reitoria, sem intervenção humana.",
              todos({"t": "nao", "c": ios("R-ENG", t="iface_up", **{"if": G2})}, ping("PC-ENG", "172.20.3.10")),
              comandos=[em("R-ENG", "configure terminal", f"interface {G2}", "shutdown", "end")],
              verificar=[ver("PC-ENG › tracert 172.20.3.10", "Agora passa por 10.0.0.1 (Reitoria)"), ver("R-ENG › show ip ospf neighbor", "Só 1.1.1.1")]),
        etapa("Repor a fibra e guardar",
              "no shutdown na G0/0/2 do R-ENG e guarde os três routers.",
              "Reposta a fibra, a vizinhança volta e o caminho direto é de novo o preferido.",
              todos(ios("R-ENG", t="iface_up", **{"if": G2}), {"t": "ospf_viz", "nome": "R-ENG", "n": 2}, *[ios(r, t="saved") for r, *_ in CAMPUS]),
              comandos=[em("R-ENG", "configure terminal", f"interface {G2}", "no shutdown", "end", "copy running-config startup-config"),
                        em("R-REITORIA", "copy running-config startup-config"), em("R-MED", "copy running-config startup-config")]),
    ],
    ["Ligue a Reitoria à Internet e use 'default-information originate' para todos aprenderem a rota por defeito.",
     "Mude o custo de uma ligação (ip ospf cost) e veja o caminho escolhido mudar."],
    [erro("Wildcard errada (ex.: 255.255.255.0)", "A wildcard é o inverso da máscara: /24 → 0.0.0.255, /30 → 0.0.0.3."),
     erro("Áreas diferentes nas duas pontas", "Os vizinhos nunca chegam a FULL."),
     erro("Passive-interface na ligação entre routers", "Deixam de se enviar Hellos e a vizinhança cai.")],
    "ensa2")


# =================================================================================== 10. Internet: NAT/PAT e NAT estática
ISP_CMDS = ["enable", "configure terminal", "hostname ISP", f"interface {G0}", "ip address 209.165.200.225 255.255.255.248", "no shutdown",
            f"interface {G1}", "ip address 198.51.100.1 255.255.255.0", "no shutdown", "end"]
P_INTERNET = projeto(
    "internet", 10, "Loja online: Internet com PAT e servidor web com NAT estática", "Avançado", "Empresa", "nuvem", "1 h 15",
    "Bloco público /29, rota por defeito, PAT para os PCs e NAT estática para publicar o servidor web.",
    "A startup Cortiça & Companhia vende online. O operador atribuiu o bloco público 209.165.200.224/29. "
    "Os funcionários precisam de Internet e o servidor web (interno, 192.168.1.10) tem de ser visível na Internet no endereço 209.165.200.229.",
    ["LAN com DHCP", "Ligação ao operador com o bloco /29", "PAT para os funcionários", "NAT estática para o servidor web", "Testar a partir de um cliente na Internet"],
    ["ensa6", "srwe7", "srwe15", "itn11"],
    [plano("192.168.1.0/24", "—", "192.168.1.1", "LAN da empresa (DHCP a partir de .21)"), plano("192.168.1.10", "—", "192.168.1.1", "SRV-WEB (interno)"),
     plano("209.165.200.224/29", "—", "ISP .225", "Bloco público: R-LOJA .226, servidor web .229"), plano("198.51.100.0/24", "—", "198.51.100.1", "Um cliente na Internet (simulação)")],
    [equip("R-LOJA", "Router ISR 4331", "Gateway, DHCP e NAT"), equip("ISP", "Router do operador", "Já configurado"), equip("SRV-WEB", "Servidor", "Loja online"),
     equip("PC-1, PC-2", "PC", "Funcionários"), equip("CLIENTE-NET", "PC", "Um cliente qualquer na Internet")],
    [dev("R-LOJA", "router", 40, 12, nomeIos="Router"), dev("ISP", "router", 78, 12, cmds=ISP_CMDS), dev("SW-LOJA", "switch", 25, 50),
     dev("PC-1", "pc", 8, 88, dhcp=True), dev("PC-2", "pc", 28, 88, dhcp=True), dev("SRV-WEB", "servidor", 50, 88, ip="192.168.1.10", mask=M24, gw="192.168.1.1"),
     dev("CLIENTE-NET", "pc", 88, 70, ip="198.51.100.20", mask=M24, gw="198.51.100.1")],
    [lig("R-LOJA", G0, "SW-LOJA", GI1), lig("R-LOJA", G1, "ISP", G0, "cruzado", "209.165.200.224/29"), lig("PC-1", FA0, "SW-LOJA", fa(1)), lig("PC-2", FA0, "SW-LOJA", fa(2)),
     lig("SRV-WEB", FA0, "SW-LOJA", fa(24)), lig("CLIENTE-NET", FA0, "ISP", G1, "cruzado")],
    [
        etapa("LAN e DHCP",
              "R-LOJA: G0/0/0 192.168.1.1/24; exclusões .1-.20; pool LAN com gateway .1 e DNS 8.8.8.8. Renove os PCs.",
              "Os funcionários recebem IP automático; o servidor tem IP fixo dentro da zona excluída.",
              todos(ios("R-LOJA", t="iface_ip", **{"if": G0, "ip": "192.168.1.1", "mask": M24, "up": True}), {"t": "dhcp", "nome": "PC-1"}, {"t": "dhcp", "nome": "PC-2"}),
              comandos=[em("R-LOJA", *ENTRAR, "hostname R-LOJA", "enable secret Cortica#2026", f"interface {G0}", "description LAN", "ip address 192.168.1.1 255.255.255.0", "no shutdown", "exit",
                           "ip dhcp excluded-address 192.168.1.1 192.168.1.20", "ip dhcp pool LAN", "network 192.168.1.0 255.255.255.0", "default-router 192.168.1.1", "dns-server 8.8.8.8", "end")],
              acoes=[a_prompt("PC-1", "ipconfig /renew"), a_prompt("PC-2", "ipconfig /renew")]),
        etapa("Ligação ao operador",
              "G0/0/1 com 209.165.200.226/29 e rota por defeito para o ISP (209.165.200.225).",
              "Uma /29 tem 6 endereços úteis (.225 a .230): o operador fica com .225, o router com .226 e sobram endereços para publicar servidores.",
              todos(ios("R-LOJA", t="iface_ip", **{"if": G1, "ip": "209.165.200.226", "mask": M29, "up": True}), ios("R-LOJA", t="route", net="0.0.0.0", mask="0.0.0.0", via="209.165.200.225")),
              comandos=[em("R-LOJA", "configure terminal", f"interface {G1}", "description WAN operador", "ip address 209.165.200.226 255.255.255.248", "no shutdown", "exit",
                           "ip route 0.0.0.0 0.0.0.0 209.165.200.225", "end")],
              verificar=[ver("PC-1 › ping 198.51.100.20", "Falha: o pacote sai com origem 192.168.1.x e a Internet não sabe responder a endereços privados")]),
        etapa("Dentro e fora",
              "Marque G0/0/0 como ip nat inside e G0/0/1 como ip nat outside.",
              "O NAT só traduz pacotes que passam de uma interface inside para uma outside (e o regresso).",
              todos(ios("R-LOJA", t="nat_inside", **{"if": G0}), ios("R-LOJA", t="nat_outside", **{"if": G1})),
              comandos=[em("R-LOJA", "configure terminal", f"interface {G0}", "ip nat inside", f"interface {G1}", "ip nat outside", "end")]),
        etapa("PAT para os funcionários",
              "ACL 1 com a rede 192.168.1.0/24 e ip nat inside source list 1 interface G0/0/1 overload.",
              "Com PAT todos os PCs partilham o endereço .226; o router distingue as ligações pelo número de porta. Poupa endereços públicos (são caros e escassos).",
              {"t": "nat_ok", "de": "PC-1", "para": "198.51.100.20", "global": "209.165.200.226"},
              comandos=[em("R-LOJA", "configure terminal", "access-list 1 permit 192.168.1.0 0.0.0.255", f"ip nat inside source list 1 interface {G1} overload", "end")],
              acoes=[a_prompt("PC-1", "ping 198.51.100.20")],
              verificar=[ver("show ip nat translations", "icmp 209.165.200.226:x  192.168.1.21:x  198.51.100.20")]),
        etapa("Publicar o servidor web (NAT estática)",
              "ip nat inside source static 192.168.1.10 209.165.200.229.",
              "Os clientes na Internet precisam de um endereço público FIXO para chegar à loja. A NAT estática liga para sempre o IP interno ao público, nos dois sentidos.",
              todos(ping("CLIENTE-NET", "209.165.200.229"), {"t": "ligacao", "de": "CLIENTE-NET", "para": "209.165.200.229", "proto": "tcp", "porta": 80}),
              comandos=[em("R-LOJA", "configure terminal", "ip nat inside source static 192.168.1.10 209.165.200.229", "end")],
              acoes=[a_prompt("CLIENTE-NET", "ping 209.165.200.229")],
              verificar=[ver("show ip nat translations", "---  209.165.200.229  192.168.1.10  (entrada estática permanente)")]),
        etapa("Guardar", "Guarde a configuração do R-LOJA.", "A loja online não pode desaparecer da Internet depois de um reinício.",
              ios("R-LOJA", t="saved"), comandos=[em("R-LOJA", "copy running-config startup-config")]),
    ],
    ["Publique só a porta 443 do servidor (NAT estática com porta) em vez do IP inteiro.",
     "Proteja o servidor com uma ACL na G0/0/1 que só deixe entrar TCP 80 e 443 para .229."],
    [erro("Trocar inside e outside", "Nada é traduzido: confirme com show ip nat statistics."),
     erro("ACL do NAT com a máscara em vez da wildcard", "access-list 1 permit 192.168.1.0 0.0.0.255 (wildcard)."),
     erro("Esquecer a rota por defeito", "Os pacotes nem saem do router: 'no route to host'.")],
    "ensa6")


# =================================================================================== 11. Segurança
R_ESC_CMDS = ["enable", "configure terminal", "hostname R-ESC", f"interface {G0}", "ip address 192.168.1.1 255.255.255.0", "no shutdown",
              f"interface {G1}", "ip address 192.168.2.1 255.255.255.0", "no shutdown", "end"]
EPCS = [("PC-TI", "192.168.1.5", 1), ("PC-SOCIO", "192.168.1.10", 2), ("PC-ESTAG", "192.168.1.20", 3)]
P_SEGURANCA = projeto(
    "seguranca", 11, "Escritório de advogados: proteger a rede", "Avançado", "Escritório", "firewall", "1 h 30",
    "Palavras-passe cifradas, banner, SSH, ACL padrão nas VTY, ACL alargada, port-security e portas desligadas.",
    "A sociedade de advogados Pereira & Associados guarda processos confidenciais no servidor SRV-ARQUIVO. Uma auditoria encontrou: routers sem palavra-passe, "
    "Telnet aberto, tomadas livres na sala de reuniões e um estagiário a copiar pastas do arquivo. Pedem que corrija tudo, sem impedir o trabalho normal.",
    ["Palavras-passe cifradas e aviso legal", "Gestão só por SSH e só a partir do PC do técnico", "Port-security e portas não usadas desligadas",
     "ACL alargada: o estagiário não acede às pastas do arquivo (SMB), mas usa a intranet (web)"],
    ["srwe1", "srwe10", "srwe11", "ensa3", "ensa4", "ensa5", "itn16"],
    [plano("192.168.1.0/24", "1", "192.168.1.1", "Escritório: PC-TI .5, PC-SOCIO .10, PC-ESTAG .20"), plano("192.168.2.0/24", "—", "192.168.2.1", "Servidores: SRV-ARQUIVO .10")],
    [equip("R-ESC", "Router ISR 4331", "Gateway e filtragem (já com IPs)"), equip("SW-ESC", "Switch 2960", "Tomadas do escritório"),
     equip("SRV-ARQUIVO", "Servidor", "Ficheiros (SMB) e intranet (web)"), equip("PC-TI, PC-SOCIO, PC-ESTAG", "PC", "Técnico, sócio e estagiário")],
    [dev("R-ESC", "router", 50, 10, cmds=R_ESC_CMDS), dev("SW-ESC", "switch", 50, 45, cmds=["enable", "configure terminal", "hostname SW-ESC", "end"]),
     dev("SRV-ARQUIVO", "servidor", 88, 30, ip="192.168.2.10", mask=M24, gw="192.168.2.1")]
    + [dev(p, "pc", 15 + 35 * (k - 1), 88, ip=ip, mask=M24, gw="192.168.1.1") for p, ip, k in EPCS],
    [lig("R-ESC", G0, "SW-ESC", GI1), lig("SRV-ARQUIVO", FA0, "R-ESC", G1, "cruzado")] + [lig(p, FA0, "SW-ESC", fa(k)) for p, ip, k in EPCS],
    [
        etapa("Palavras-passe e aviso legal no router",
              "No R-ESC: enable secret, service password-encryption, banner motd e palavra-passe na consola.",
              "A auditoria encontrou o router sem palavra-passe. O 'secret' guarda um hash; o password-encryption esconde as restantes; o banner avisa que o acesso é só para pessoal autorizado.",
              todos(ios("R-ESC", t="enable_secret"), ios("R-ESC", t="pwd_enc"), ios("R-ESC", t="banner"), ios("R-ESC", t="line_login", line="con")),
              comandos=[em("R-ESC", *ENTRAR, "enable secret Pereira#Adv2026", "service password-encryption", "banner motd #Acesso restrito a pessoal autorizado da Pereira & Associados#",
                           "line console 0", "password Consola#2026", "login", "end")]),
        etapa("O mesmo no switch",
              "No SW-ESC: enable secret, service password-encryption, banner e consola.",
              "Um switch sem palavra-passe é tão perigoso como o router: quem o controla pode espiar o tráfego (porta espelho) ou mudar VLANs.",
              todos(ios("SW-ESC", t="enable_secret"), ios("SW-ESC", t="pwd_enc"), ios("SW-ESC", t="banner"), ios("SW-ESC", t="line_login", line="con")),
              comandos=[em("SW-ESC", *ENTRAR, "enable secret Pereira#Sw2026", "service password-encryption", "banner motd #Acesso restrito#",
                           "line console 0", "password Consola#2026", "login", "end")]),
        etapa("SSH em vez de Telnet",
              "No R-ESC: domínio, chaves RSA de 2048 bits, utilizador admin, SSH versão 2 e linhas VTY só com SSH e login local.",
              "O Telnet envia a palavra-passe em texto claro: qualquer pessoa com o Wireshark na rede a lia. O SSH cifra a sessão inteira.",
              todos(ios("R-ESC", t="domain"), ios("R-ESC", t="rsa"), ios("R-ESC", t="user", v="admin"), ios("R-ESC", t="vty_ssh"), ios("R-ESC", t="line_login", line="vty", local=True)),
              comandos=[em("R-ESC", "configure terminal", "ip domain-name pereira.local", "crypto key generate rsa general-keys modulus 2048",
                           "username admin secret Admin#Ssh2026", "ip ssh version 2", "line vty 0 4", "login local", "transport input ssh", "end")],
              verificar=[ver("PC-TI › ssh -l admin 192.168.1.1", "Pede a palavra-passe e entra no R-ESC")]),
        etapa("Só o PC do técnico pode gerir o router (ACL padrão)",
              "ACL 10 a permitir só o host 192.168.1.5 e access-class 10 in nas linhas VTY.",
              "Mesmo que alguém descubra a palavra-passe, só o PC do técnico chega ao pedido de login. As ACL padrão filtram pela origem: é exatamente o que aqui se quer.",
              ios("R-ESC", t="acl_std", n="10"),
              comandos=[em("R-ESC", "configure terminal", "access-list 10 permit host 192.168.1.5", "line vty 0 4", "access-class 10 in", "end")]),
        etapa("Port-security nas tomadas dos PCs",
              "No SW-ESC, Fa0/1-3: modo acesso, port-security, máximo 1 MAC, sticky, violation shutdown.",
              "Se alguém desligar um PC e ligar o portátil pessoal (ou um switch), a porta desliga-se e o técnico é avisado.",
              todos(*[ios("SW-ESC", t="portsec", **{"if": fa(k)}) for k in (1, 2, 3)], ios("SW-ESC", t="portsec_sticky", **{"if": fa(2)})),
              comandos=[em("SW-ESC", "configure terminal", "interface range fa0/1 - 3", "switchport mode access", "switchport port-security", "switchport port-security maximum 1",
                           "switchport port-security mac-address sticky", "switchport port-security violation shutdown", "end")],
              verificar=[ver("show port-security", "Fa0/1-3 com MaxSecureAddr 1 e ação Shutdown")]),
        etapa("Desligar as tomadas sem uso",
              "Fa0/4 a Fa0/24 e Gi0/2: descrição 'Sem uso' e shutdown.",
              "As tomadas da sala de reuniões estavam ativas: qualquer visita entrava na rede. Uma porta desligada é a defesa mais simples.",
              todos({"t": "nao", "c": ios("SW-ESC", t="iface_up", **{"if": fa(10)})}, {"t": "nao", "c": ios("SW-ESC", t="iface_up", **{"if": fa(24)})}),
              comandos=[em("SW-ESC", "configure terminal", "interface range fa0/4 - 24", "description Sem uso", "shutdown", "interface g0/2", "shutdown", "end")]),
        etapa("ACL alargada: proteger o arquivo",
              "ACL PROTEGE-ARQUIVO: nega TCP do estagiário (192.168.1.20) para o servidor na porta 445 (SMB), permite o resto. Aplique na entrada da G0/0/0.",
              "O estagiário continua a usar a intranet (porta 80) mas deixa de abrir as pastas partilhadas. As ACL alargadas ficam perto da origem para o tráfego ser cortado logo à entrada.",
              todos({"t": "acl_bloqueia", "de": "PC-ESTAG", "para": "SRV-ARQUIVO", "proto": "tcp", "porta": 445},
                    {"t": "ligacao", "de": "PC-ESTAG", "para": "SRV-ARQUIVO", "proto": "tcp", "porta": 80},
                    {"t": "ligacao", "de": "PC-SOCIO", "para": "SRV-ARQUIVO", "proto": "tcp", "porta": 445}),
              comandos=[em("R-ESC", "configure terminal", "ip access-list extended PROTEGE-ARQUIVO",
                           ("deny tcp host 192.168.1.20 host 192.168.2.10 eq 445", "Nega SMB (partilha de ficheiros, TCP 445) do estagiário para o arquivo.", "É precisamente o acesso que a auditoria quer cortar."),
                           ("permit ip any any", "Permite todo o resto (web, ping, os outros PCs).", "Sem esta linha o 'deny any' implícito bloqueava o escritório inteiro."),
                           "exit", f"interface {G0}", "ip access-group PROTEGE-ARQUIVO in", "end")],
              verificar=[ver("show access-lists PROTEGE-ARQUIVO", "Contadores na linha deny quando o estagiário tenta abrir \\\\192.168.2.10")]),
        etapa("Guardar", "Guarde o router e o switch.", "A segurança tem de sobreviver a um reinício.",
              todos(ios("R-ESC", t="saved"), ios("SW-ESC", t="saved")), comandos=[em("R-ESC", "copy running-config startup-config"), em("SW-ESC", "copy running-config startup-config")]),
    ],
    ["Ative o 'login block-for 120 attempts 3 within 60' contra ataques de força bruta.",
     "Configure SSH também no switch (precisa de IP de gestão e default-gateway)."],
    [erro("transport input ssh sem chaves RSA", "O SSH não arranca e, sem Telnet, fica sem acesso remoto."),
     erro("ACL alargada com 'deny' mas sem 'permit ip any any'", "Bloqueia tudo: lembre-se do deny implícito."),
     erro("Aplicar a ACL padrão de gestão numa interface", "Nas linhas VTY usa-se 'access-class', não 'ip access-group'.")],
    "ensa5")


# =================================================================================== 12. Alta disponibilidade
R_HA = {"R1": ("192.168.10.2", "10.0.0.2"), "R2": ("192.168.10.3", "10.0.0.3")}
P_ALTA = projeto(
    "alta_disponibilidade", 12, "Banco: agência sempre ligada (HSRP, EtherChannel, STP)", "Avançado", "Banco", "switch", "2 h",
    "Gateway redundante com HSRP e track, EtherChannel LACP entre switches e raiz do STP escolhida.",
    "O Banco Lusitano não pode ter a agência parada: se um router ou um cabo falhar, os balcões têm de continuar a chegar ao servidor central. "
    "Há dois routers (R1 e R2), dois switches de acesso ligados por dois cabos e um servidor central na rede 10.0.0.0/24.",
    ["Juntar os dois cabos entre switches num EtherChannel LACP", "Escolher a raiz do STP", "Gateway virtual HSRP nos dois lados, com preempt e track",
     "Testar a falha de um router e o regresso automático"],
    ["srwe5", "srwe6", "srwe9", "ensa11"],
    [plano("192.168.10.0/24", "1", "192.168.10.1 (virtual HSRP)", "Balcões. R1 .2, R2 .3"), plano("10.0.0.0/24", "—", "10.0.0.1 (virtual HSRP)", "Servidores. R1 .2, R2 .3, SRV-CENTRAL .10")],
    [equip("R1, R2", "Router ISR 4331", "Gateways redundantes (HSRP)"), equip("SW-A, SW-B", "Switch 2960", "Acesso dos balcões (EtherChannel entre eles)"),
     equip("SW-DC", "Switch 2960", "Rede dos servidores"), equip("SRV-CENTRAL", "Servidor", "Sistema central (já configurado)"), equip("PC-BALCAO1, PC-BALCAO2", "PC", "Balcões")],
    [dev("SRV-CENTRAL", "servidor", 50, 6, ip="10.0.0.10", mask=M24, gw="10.0.0.1"), dev("SW-DC", "switch", 50, 25),
     dev("R1", "router", 25, 42, nomeIos="Router"), dev("R2", "router", 75, 42, nomeIos="Router"),
     dev("SW-A", "switch", 25, 68, cmds=["enable", "configure terminal", "hostname SW-A", "end"]), dev("SW-B", "switch", 75, 68, cmds=["enable", "configure terminal", "hostname SW-B", "end"]),
     dev("PC-BALCAO1", "pc", 25, 95), dev("PC-BALCAO2", "pc", 75, 95)],
    [lig("SRV-CENTRAL", FA0, "SW-DC", fa(3)), lig("R1", G1, "SW-DC", fa(1)), lig("R2", G1, "SW-DC", fa(2)),
     lig("R1", G0, "SW-A", fa(24)), lig("R2", G0, "SW-B", fa(24)),
     lig("SW-A", GI1, "SW-B", GI1, "cruzado", "Po1"), lig("SW-A", GI2, "SW-B", GI2, "cruzado"),
     lig("PC-BALCAO1", FA0, "SW-A", fa(1)), lig("PC-BALCAO2", FA0, "SW-B", fa(1))],
    [
        etapa("EtherChannel LACP entre SW-A e SW-B",
              "Gi0/1 e Gi0/2 nos dois switches: channel-group 1 (SW-A active, SW-B passive); a Port-channel 1 em trunk.",
              "Com dois cabos soltos o STP bloqueia um deles (evita o loop) e só se usa metade. Num EtherChannel os dois cabos são uma ligação lógica: o dobro da capacidade e, se um cabo falhar, o outro continua sem esperar pelo STP. "
              "O LACP (norma 802.3ad) negocia o canal; 'active' inicia e 'passive' responde.",
              {"t": "ec", "a": "SW-A", "b": "SW-B", "n": 2},
              comandos=[em("SW-A", "configure terminal", "interface range g0/1 - 2", "channel-group 1 mode active", "exit", "interface port-channel 1", "switchport mode trunk", "end"),
                        em("SW-B", "configure terminal", "interface range g0/1 - 2", "channel-group 1 mode passive", "exit", "interface port-channel 1", "switchport mode trunk", "end")],
              verificar=[ver("show etherchannel summary", "Po1(SU) LACP Gi0/1(P) Gi0/2(P)")]),
        etapa("Raiz do STP",
              "Rapid PVST+ nos dois; SW-A root primary e SW-B root secondary na VLAN 1.",
              "Deixado ao acaso, a raiz seria o switch com o MAC mais baixo — talvez o pior colocado. Escolhendo-a, sabe-se por onde passa o tráfego e que porta bloqueia. "
              "O Rapid PVST+ recupera de uma falha em 1-2 s em vez de 30-50 s.",
              {"t": "stp_raiz", "nome": "SW-A", "vlan": 1, "com": ["SW-B"], "pri": 24576},
              comandos=[em("SW-A", "configure terminal", "spanning-tree mode rapid-pvst", "spanning-tree vlan 1 root primary", "end"),
                        em("SW-B", "configure terminal", "spanning-tree mode rapid-pvst", "spanning-tree vlan 1 root secondary", "end")],
              verificar=[ver("SW-A › show spanning-tree", "This bridge is the root, Priority 24577")]),
        etapa("Interfaces dos routers",
              "R1: G0/0/0 192.168.10.2/24, G0/0/1 10.0.0.2/24. R2: .3 e .3. Todas ligadas.",
              "Cada router tem o seu IP real; o gateway dos PCs vai ser um IP virtual partilhado.",
              todos(*[ios(r, t="iface_ip", **{"if": i, "ip": ip, "mask": M24, "up": True}) for r, (a, b) in R_HA.items() for i, ip in ((G0, a), (G1, b))]),
              comandos=[em(r, *ENTRAR, f"hostname {r}", f"interface {G0}", "description LAN balcoes", f"ip address {a} 255.255.255.0", "no shutdown",
                           f"interface {G1}", "description Rede servidores", f"ip address {b} 255.255.255.0", "no shutdown", "end") for r, (a, b) in R_HA.items()]),
        etapa("HSRP do lado dos balcões",
              "Grupo 10, IP virtual 192.168.10.1. R1 prioridade 110 com preempt; R2 com preempt (prioridade 100).",
              "Os PCs só conhecem um gateway. Com HSRP os dois routers partilham o IP virtual .1: o ativo responde e o standby está pronto a assumir. "
              "R1 é o preferido (110 > 100) e o preempt devolve-lhe o papel quando recupera.",
              todos({"t": "hsrp", "nome": "R1", "vip": "192.168.10.1", "estado": "Active"}, {"t": "hsrp", "nome": "R2", "vip": "192.168.10.1", "estado": "Standby"}),
              comandos=[em("R1", "configure terminal", f"interface {G0}", "standby 10 ip 192.168.10.1", "standby 10 priority 110", "standby 10 preempt", "end"),
                        em("R2", "configure terminal", f"interface {G0}", "standby 10 ip 192.168.10.1", "standby 10 preempt", "end")],
              verificar=[ver("R1 › show standby brief", "Gi0/0/0 10 110 P Active local 192.168.10.3 192.168.10.1")]),
        etapa("HSRP do lado dos servidores, com track",
              "Grupo 20, IP virtual 10.0.0.1. R1 prioridade 110, preempt e track G0/0/0 com decremento 20; R2 preempt.",
              "O servidor também precisa de um gateway redundante para responder aos balcões. O track faz o R1 desistir de ser ativo do lado dos servidores se perder a LAN dos balcões "
              "(110 − 20 = 90 < 100): assim o tráfego de ida e de volta passa pelo mesmo router.",
              todos({"t": "hsrp", "nome": "R1", "vip": "10.0.0.1", "estado": "Active"}, {"t": "hsrp", "nome": "R2", "vip": "10.0.0.1", "estado": "Standby"}),
              comandos=[em("R1", "configure terminal", f"interface {G1}", "standby 20 ip 10.0.0.1", "standby 20 priority 110", "standby 20 preempt", "standby 20 track g0/0/0 20", "end"),
                        em("R2", "configure terminal", f"interface {G1}", "standby 20 ip 10.0.0.1", "standby 20 preempt", "end")]),
        etapa("Balcões com o gateway virtual",
              "PC-BALCAO1 192.168.10.11 e PC-BALCAO2 192.168.10.12, gateway 192.168.10.1 (o virtual). Teste o ping ao SRV-CENTRAL.",
              "O gateway configurado nos PCs é o IP virtual, nunca o IP real de um router: é isso que permite a troca transparente.",
              todos({"t": "pc_ip", "nome": "PC-BALCAO1", "ip": "192.168.10.11", "mask": M24, "gw": "192.168.10.1"}, {"t": "pc_ip", "nome": "PC-BALCAO2", "ip": "192.168.10.12", "mask": M24, "gw": "192.168.10.1"},
                    ping("PC-BALCAO1", "10.0.0.10"), ping("PC-BALCAO2", "10.0.0.10")),
              acoes=[a_ip("PC-BALCAO1", "192.168.10.11", M24, "192.168.10.1"), a_ip("PC-BALCAO2", "192.168.10.12", M24, "192.168.10.1")]),
        etapa("Simular a falha do R1",
              "Desligue a G0/0/0 do R1 (shutdown). Volte a fazer ping do PC-BALCAO1 ao servidor.",
              "O R2 deixa de ouvir os Hellos do R1 e passa a Active nos dois grupos (no grupo 20 graças ao track). Os balcões continuam a trabalhar com o mesmo gateway.",
              todos({"t": "nao", "c": ios("R1", t="iface_up", **{"if": G0})}, {"t": "hsrp", "nome": "R2", "vip": "192.168.10.1", "estado": "Active"},
                    {"t": "hsrp", "nome": "R2", "vip": "10.0.0.1", "estado": "Active"}, ping("PC-BALCAO1", "10.0.0.10")),
              comandos=[em("R1", "configure terminal", f"interface {G0}", "shutdown", "end")],
              verificar=[ver("R2 › show standby brief", "Os dois grupos em Active"), ver("PC-BALCAO1 › tracert 10.0.0.10", "Passa agora por 192.168.10.3 (R2)")]),
        etapa("Recuperação e guardar",
              "no shutdown na G0/0/0 do R1: com preempt volta a Active. Guarde os quatro equipamentos.",
              "Depois da reparação a rede volta sozinha ao desenho normal.",
              todos({"t": "hsrp", "nome": "R1", "vip": "192.168.10.1", "estado": "Active"}, {"t": "hsrp", "nome": "R1", "vip": "10.0.0.1", "estado": "Active"},
                    *[ios(x, t="saved") for x in ("R1", "R2", "SW-A", "SW-B")]),
              comandos=[em("R1", "configure terminal", f"interface {G0}", "no shutdown", "end", "copy running-config startup-config"),
                        *[em(x, "copy running-config startup-config") for x in ("R2", "SW-A", "SW-B")]]),
    ],
    ["Desligue um dos cabos do EtherChannel e confirme que o ping continua (Po1 com um só membro).",
     "Crie VLAN 10 e 20 e faça balanceamento: R1 ativo na VLAN 10 e R2 ativo na VLAN 20."],
    [erro("LACP passive nos dois lados", "Ninguém inicia a negociação: o canal não se forma."),
     erro("Configurar 'on' num lado e LACP no outro", "Modos incompatíveis: Po1 fica down (SD)."),
     erro("Gateway dos PCs = IP real do R1", "Se o R1 falhar, os PCs ficam sem gateway: use o IP virtual."),
     erro("Sem preempt no R1", "Depois de recuperar, o R1 fica em standby e o tráfego continua no R2.")],
    "srwe9")


# =================================================================================== 13. Final: Hospital Regional
FV = [(10, "URGENCIA"), (20, "CONSULTAS"), (30, "ADMINISTRACAO"), (50, "SERVIDORES"), (60, "CONVIDADOS")]
FV_CMDS = [x for v, n in FV for x in (f"vlan {v}", f"name {n}")]
FPC = ["PC-URG", "PC-CONS", "PC-ADM", "CONVIDADO"]
P_FINAL = projeto(
    "hospital_regional", 13, "Projeto final: Hospital Regional do Interior", "Final", "Hospital", "nuvem", "3 h",
    "Integra tudo: VLANs, switch L3, DHCP, DNS, Wi-Fi de convidados, OSPF, NAT/PAT, ACL, SSH e port-security.",
    "O novo Hospital Regional do Interior abre daqui a um mês e a rede é sua. Requisitos da Administração: Urgência, Consultas e Administração separadas; "
    "servidor do processo clínico numa rede de servidores; Wi-Fi para os doentes e visitas (convidados) só com Internet; um router de saída com NAT; "
    "encaminhamento dinâmico entre o núcleo e o router (para crescer no futuro); gestão segura por SSH e tomadas protegidas.",
    ["Desenhar e aplicar o plano de VLANs", "Encaminhamento entre VLANs no switch L3", "DHCP para cada serviço", "Servidor e DNS do processo clínico",
     "Wi-Fi de convidados", "OSPF entre o núcleo e o router de saída", "Internet com PAT", "Convidados isolados com ACL", "SSH e port-security"],
    ["srwe3", "srwe4", "srwe7", "srwe11", "srwe13", "ensa2", "ensa5", "ensa6", "f1"],
    [plano(f"172.30.{v}.0/24", str(v), f"172.30.{v}.1 (SVI no D-CORE)", n.capitalize()) for v, n in FV]
    + [plano("10.255.255.0/30", "—", "D-CORE .1 / R-EDGE .2", "Ligação OSPF núcleo–router"), plano("203.0.113.0/24", "—", "203.0.113.1 (operador)", "WAN: R-EDGE .2")],
    [equip("D-CORE", "Switch multicamada 3650", "Núcleo: VLANs, SVIs, DHCP, OSPF"), equip("SW-PISO", "Switch 2960", "Acesso no piso de consultas"),
     equip("R-EDGE", "Router ISR 4331", "Saída: OSPF, NAT/PAT, SSH"), equip("AP-CONVIDADOS", "Access point", "Wi-Fi de doentes e visitas"),
     equip("SRV-PROC", "Servidor", "Processo clínico + DNS"), equip("PC-URG, PC-CONS, PC-ADM", "PC", "Serviços"), equip("CONVIDADO", "Smartphone", "Visita na sala de espera")],
    [dev("INTERNET", "nuvem", 88, 6), dev("R-EDGE", "router", 60, 8, nomeIos="Router"), dev("D-CORE", "switch_l3", 40, 35, nomeIos="Switch"),
     dev("SW-PISO", "switch", 75, 55, nomeIos="Switch"), dev("SRV-PROC", "servidor", 8, 35), dev("PC-ADM", "pc", 20, 72, dhcp=True),
     dev("PC-URG", "pc", 55, 90, dhcp=True), dev("PC-CONS", "pc", 75, 90, dhcp=True), dev("AP-CONVIDADOS", "ap", 93, 72), dev("CONVIDADO", "smartphone", 93, 95)],
    [lig("R-EDGE", G1, "INTERNET", "Ethernet6", rotulo="WAN"), lig("D-CORE", GI2, "R-EDGE", G0, rotulo="OSPF /30"), lig("D-CORE", GI1, "SW-PISO", GI1, "cruzado", "trunk"),
     lig("SRV-PROC", FA0, "D-CORE", fa(24), rotulo="V50"), lig("PC-ADM", FA0, "D-CORE", fa(1), rotulo="V30"),
     lig("PC-URG", FA0, "SW-PISO", fa(1), rotulo="V10"), lig("PC-CONS", FA0, "SW-PISO", fa(2), rotulo="V20"), lig("AP-CONVIDADOS", "Port0", "SW-PISO", fa(3), rotulo="V60")],
    [
        etapa("Base: nomes, palavras-passe e VLANs",
              "D-CORE e SW-PISO: hostname, enable secret e as VLANs 10 URGENCIA, 20 CONSULTAS, 30 ADMINISTRACAO, 50 SERVIDORES, 60 CONVIDADOS.",
              "Primeiro a identidade e a proteção dos equipamentos, depois a estrutura lógica: as VLANs têm de existir nos dois switches.",
              todos(ios("D-CORE", t="hostname", v="D-CORE"), ios("SW-PISO", t="hostname", v="SW-PISO"), ios("D-CORE", t="enable_secret"), ios("SW-PISO", t="enable_secret"),
                    *[ios(s, t="vlan", id=v, name=n) for s in ("D-CORE", "SW-PISO") for v, n in FV]),
              comandos=[em(s, *ENTRAR, f"hostname {s}", "enable secret Regional#2026", "no ip domain-lookup", *FV_CMDS, "end") for s in ("D-CORE", "SW-PISO")]),
        etapa("Portas de acesso e trunk",
              "SW-PISO: Fa0/1 → 10, Fa0/2 → 20, Fa0/3 (AP) → 60; Gi0/1 trunk. D-CORE: Fa0/1 → 30, Fa0/24 → 50; Gi0/1 trunk.",
              "O AP dos convidados numa porta da VLAN 60 põe todo o Wi-Fi de visitas na rede isolada.",
              todos(ios("SW-PISO", t="access_vlan", **{"if": fa(1), "vlan": 10}), ios("SW-PISO", t="access_vlan", **{"if": fa(2), "vlan": 20}), ios("SW-PISO", t="access_vlan", **{"if": fa(3), "vlan": 60}),
                    ios("D-CORE", t="access_vlan", **{"if": fa(1), "vlan": 30}), ios("D-CORE", t="access_vlan", **{"if": fa(24), "vlan": 50}),
                    ios("D-CORE", t="trunk", **{"if": GI1}), ios("SW-PISO", t="trunk", **{"if": GI1})),
              comandos=[em("SW-PISO", "configure terminal", "interface fa0/1", "switchport mode access", "switchport access vlan 10", "spanning-tree portfast",
                           "interface fa0/2", "switchport mode access", "switchport access vlan 20", "spanning-tree portfast",
                           "interface fa0/3", "description AP convidados", "switchport mode access", "switchport access vlan 60",
                           "interface g0/1", "switchport mode trunk", "end"),
                        em("D-CORE", "configure terminal", "interface fa0/1", "switchport mode access", "switchport access vlan 30",
                           "interface fa0/24", "description SRV-PROC", "switchport mode access", "switchport access vlan 50",
                           "interface g0/1", "switchport mode trunk", "end")]),
        etapa("Encaminhamento entre VLANs no núcleo",
              "D-CORE: ip routing e SVIs 172.30.V.1/24 para as cinco VLANs.",
              "O núcleo encaminha entre serviços à velocidade das portas; cada SVI é o gateway do seu serviço.",
              todos(ios("D-CORE", t="ip_routing"), *[ios("D-CORE", t="svi", **{"if": f"Vlan{v}", "ip": f"172.30.{v}.1"}) for v, _ in FV]),
              comandos=[em("D-CORE", "configure terminal", "ip routing", *[x for v, n in FV for x in (f"interface vlan {v}", f"description Gateway {n}", f"ip address 172.30.{v}.1 255.255.255.0", "no shutdown")], "end")]),
        etapa("Servidor do processo clínico e DNS",
              "SRV-PROC 172.30.50.10/24, gateway 172.30.50.1; registo processo.hregional.local.",
              "O servidor tem IP fixo na rede dos servidores e é também o DNS interno dos serviços clínicos.",
              todos({"t": "pc_ip", "nome": "SRV-PROC", "ip": "172.30.50.10", "mask": M24, "gw": "172.30.50.1"}, {"t": "dns", "nome": "SRV-PROC", "registo": "processo.hregional.local"}),
              acoes=[a_ip("SRV-PROC", "172.30.50.10", M24, "172.30.50.1", "172.30.50.10"), a_dns("SRV-PROC", "processo.hregional.local", "172.30.50.10")]),
        etapa("DHCP no núcleo",
              "No D-CORE: exclua .1-.20 e crie pools URGENCIA, CONSULTAS, ADMINISTRACAO (DNS 172.30.50.10) e CONVIDADOS (DNS 8.8.8.8).",
              "O switch L3 recebe os pedidos diretamente em cada SVI, por isso aqui não é preciso relay. Os convidados usam DNS público: não precisam de conhecer nomes internos.",
              todos(*[ios("D-CORE", t="dhcp_gw", name=n, v=f"172.30.{v}.1") for v, n in FV if v != 50]),
              comandos=[em("D-CORE", "configure terminal", *[f"ip dhcp excluded-address 172.30.{v}.1 172.30.{v}.20" for v, _ in FV if v != 50],
                           *[x for v, n in FV if v != 50 for x in (f"ip dhcp pool {n}", f"network 172.30.{v}.0 255.255.255.0", f"default-router 172.30.{v}.1",
                                                                     "dns-server " + ("8.8.8.8" if v == 60 else "172.30.50.10"))], "end")]),
        etapa("Wi-Fi de convidados",
              "AP-CONVIDADOS: SSID “HRI-Convidados”, WPA2, chave afixada na sala de espera. Ligue o CONVIDADO.",
              "Mesmo sendo para o público, o WPA2 cifra o tráfego no ar entre cada visita e o AP.",
              todos({"t": "wifi_rede", "nome": "AP-CONVIDADOS", "ssid": "HRI-Convidados", "seg": "wpa2"}, {"t": "wifi_ligado", "nome": "CONVIDADO"}),
              acoes=[a_wifi("AP-CONVIDADOS", "HRI-Convidados", "BemVindo2026"), a_cliente("CONVIDADO", "HRI-Convidados", "BemVindo2026")]),
        etapa("Todos recebem IP",
              "Renove os PCs; o convidado recebe IP pelo Wi-Fi. Teste PC-URG → processo.hregional.local.",
              "Prova a cadeia inteira: porta de acesso → VLAN → trunk → SVI → pool DHCP → DNS.",
              todos(*[{"t": "dhcp", "nome": p} for p in FPC], ping("PC-URG", "processo.hregional.local")),
              acoes=[a_prompt(p, "ipconfig /renew") for p in FPC if p != "CONVIDADO"] + [a_prompt("PC-URG", "ping processo.hregional.local")]),
        etapa("Ligação OSPF ao router de saída",
              "D-CORE Gi0/2: no switchport, 10.255.255.1/30. R-EDGE G0/0/0: 10.255.255.2/30. OSPF 1 área 0 nos dois (D-CORE anuncia 172.30.0.0/16 e a /30).",
              "Com OSPF, cada VLAN nova no núcleo é anunciada sozinha ao router de saída; e se um dia houver um segundo router, a rede escolhe o caminho.",
              {"t": "ospf_viz", "nome": "R-EDGE", "n": 1},
              comandos=[em("D-CORE", "configure terminal", "interface g0/2", "no switchport", "ip address 10.255.255.1 255.255.255.252", "no shutdown", "exit",
                           "router ospf 1", "router-id 1.1.1.1", "network 172.30.0.0 0.0.255.255 area 0", "network 10.255.255.0 0.0.0.3 area 0", "end"),
                        em("R-EDGE", *ENTRAR, "hostname R-EDGE", "enable secret Regional#Edge2026", f"interface {G0}", "description Ligacao a D-CORE", "ip address 10.255.255.2 255.255.255.252", "no shutdown", "exit",
                           "router ospf 1", "router-id 2.2.2.2", "network 10.255.255.0 0.0.0.3 area 0", "end")],
              verificar=[ver("R-EDGE › show ip route ospf", "O 172.30.10.0, 172.30.20.0 … aprendidas do D-CORE")]),
        etapa("Saída para a Internet",
              "R-EDGE G0/0/1 203.0.113.2/24, rota por defeito para 203.0.113.1 e default-information originate no OSPF.",
              "O router de saída anuncia a rota por defeito ao núcleo: o D-CORE aprende sozinho por onde fica a Internet (rota O*E2).",
              todos(ios("R-EDGE", t="route", net="0.0.0.0", mask="0.0.0.0", via="203.0.113.1"), ios("R-EDGE", t="iface_ip", **{"if": G1, "ip": "203.0.113.2", "mask": M24, "up": True})),
              comandos=[em("R-EDGE", "configure terminal", f"interface {G1}", "description WAN operador", "ip address 203.0.113.2 255.255.255.0", "no shutdown", "exit",
                           "ip route 0.0.0.0 0.0.0.0 203.0.113.1", "router ospf 1", "default-information originate", "end")]),
        etapa("NAT/PAT",
              "R-EDGE: G0/0/0 inside, G0/0/1 outside, ACL 1 permit 172.30.0.0 0.0.255.255, overload na G0/0/1.",
              "Todo o hospital sai com o único IP público, traduzido pelo router de saída.",
              todos({"t": "nat_ok", "de": "PC-URG", "para": "8.8.8.8", "global": "203.0.113.2"}, {"t": "nat_ok", "de": "CONVIDADO", "para": "8.8.8.8"}),
              comandos=[em("R-EDGE", "configure terminal", f"interface {G0}", "ip nat inside", f"interface {G1}", "ip nat outside", "exit",
                           "access-list 1 permit 172.30.0.0 0.0.255.255", f"ip nat inside source list 1 interface {G1} overload", "end")]),
        etapa("Convidados só com Internet",
              "ACL CONVIDADOS-SO-NET na entrada da SVI 60: permite DHCP, nega o resto das redes internas 172.30.0.0/16, permite a Internet.",
              "Um telemóvel de uma visita não pode chegar ao processo clínico. A ACL fica na SVI dos convidados (perto da origem); o DHCP tem de passar antes do deny.",
              todos({"t": "acl_bloqueia", "de": "CONVIDADO", "para": "SRV-PROC"}, {"t": "nat_ok", "de": "CONVIDADO", "para": "8.8.8.8"}, ping("PC-CONS", "172.30.50.10")),
              comandos=[em("D-CORE", "configure terminal", "ip access-list extended CONVIDADOS-SO-NET",
                           ("permit udp any any eq 67", "Deixa passar os pedidos DHCP.", "Sem isto os convidados nem recebiam IP."),
                           ("deny ip 172.30.60.0 0.0.0.255 172.30.0.0 0.0.255.255", "Nega dos convidados para todas as redes internas do hospital.", "É o isolamento pedido pela Administração."),
                           ("permit ip any any", "Permite o resto (a Internet).", "Os convidados têm de navegar."),
                           "exit", "interface vlan 60", "ip access-group CONVIDADOS-SO-NET in", "end")]),
        etapa("Gestão segura, tomadas protegidas e guardar",
              "R-EDGE: SSH (domínio, RSA 2048, utilizador, vty só SSH). SW-PISO: port-security nas Fa0/1-2. Guarde os três equipamentos.",
              "Fecha o projeto com as boas práticas de segurança e com a configuração guardada.",
              todos(ios("R-EDGE", t="vty_ssh"), ios("R-EDGE", t="rsa"), ios("SW-PISO", t="portsec", **{"if": fa(1)}), ios("SW-PISO", t="portsec", **{"if": fa(2)}),
                    *[ios(x, t="saved") for x in ("D-CORE", "SW-PISO", "R-EDGE")]),
              comandos=[em("R-EDGE", "configure terminal", "ip domain-name hregional.local", "crypto key generate rsa general-keys modulus 2048", "username admin secret Admin#2026",
                           "line vty 0 4", "login local", "transport input ssh", "end", "copy running-config startup-config"),
                        em("SW-PISO", "configure terminal", "interface range fa0/1 - 2", "switchport port-security", "switchport port-security maximum 2",
                           "switchport port-security mac-address sticky", "end", "copy running-config startup-config"),
                        em("D-CORE", "copy running-config startup-config")]),
    ],
    ["Acrescente um segundo router de saída com HSRP do lado do núcleo (veja o projeto do banco).",
     "Separe os dispositivos médicos (monitores, bombas) numa VLAN 70 sem Internet.",
     "Escreva a documentação final: plano de endereços, diagrama e as configurações (show running-config) de cada equipamento."],
    [erro("ACL dos convidados sem permitir o DHCP antes do deny", "Os convidados ficam com 169.254.x.x."),
     erro("Esquecer 'default-information originate'", "O D-CORE não sabe sair para a Internet."),
     erro("ACL do NAT só com uma VLAN", "Use a wildcard 0.0.255.255 para cobrir todas as redes 172.30.x.0."),
     erro("SVI sem 'no shutdown' ou VLAN sem portas", "O gateway dessa VLAN fica down.")],
    "f1")


PROJETOS = [P_ESCRITORIO, P_LOJA, P_BIBLIOTECA, P_CLINICA, P_HOSPITAL, P_ESCOLA, P_HOTEL, P_FILIAIS, P_CAMPUS, P_INTERNET, P_SEGURANCA, P_ALTA, P_FINAL]

NIVEIS = ["Básico", "Intermédio", "Avançado", "Final"]
CHECKS_PROJ = {"nao", "wifi_rede", "wifi_ligado", "rw_lan", "rw_wan", "hsrp", "ec", "stp_raiz", "nat_ok", "ligacao", "acl_bloqueia"}


def validar_projetos(curso: dict, checks_sim: set, checks_ios: set) -> list[str]:
    """Valida os projetos (ids únicos, módulos, equipamentos e verificações)."""
    erros: list[str] = []
    ids_mod = {m["id"] for m in curso["modulos"]}
    vistos: set[str] = set()
    tipos = checks_sim | CHECKS_PROJ
    for p in curso.get("projetos", []):
        onde = "projeto " + p["id"]
        if p["id"] in vistos:
            erros.append(f"{onde}: id repetido")
        vistos.add(p["id"])
        if p["nivel"] not in NIVEIS:
            erros.append(f"{onde}: nível desconhecido {p['nivel']!r}")
        for k in p["conhecimentos"] + [p["atividade"]["modulo"]]:
            if k not in ids_mod:
                erros.append(f"{onde}: módulo {k!r} não existe")
        nomes = {d["nome"] for d in p["atividade"]["inicial"]["dispositivos"]}
        if len(nomes) != len(p["atividade"]["inicial"]["dispositivos"]):
            erros.append(f"{onde}: equipamentos com nome repetido")
        for lg in p["topologia"]["ligacoes"]:
            if lg["a"] not in nomes or lg["b"] not in nomes:
                erros.append(f"{onde}: ligação com equipamento inexistente {lg}")
        if len(p["etapas"]) < 5:
            erros.append(f"{onde}: um projeto precisa de pelo menos 5 etapas")
        if not p["briefing"] or not p["objetivos"] or not p["enderecos"] or not p["erros_comuns"] or not p["desafio_extra"]:
            erros.append(f"{onde}: falta briefing, objetivos, plano de endereços, erros comuns ou desafio extra")

        def chk(c, o):
            if c["t"] not in tipos:
                erros.append(f"{o}: verificação desconhecida {c['t']!r}")
            if c["t"] == "ios" and c["check"]["t"] not in checks_ios:
                erros.append(f"{o}: verificação IOS desconhecida {c['check']['t']!r}")
            for campo in ("nome", "de", "a", "b", "pc"):
                v = c.get(campo)
                if isinstance(v, str) and v not in nomes and not (campo == "a" and c["t"] == "ligado_tipo") and not (campo == "b" and c["t"] == "ligado_tipo"):
                    erros.append(f"{o}: equipamento {v!r} não existe")
            for x in c.get("lista", []):
                chk(x, o)
            if c.get("c"):
                chk(c["c"], o)

        for i, e in enumerate(p["etapas"]):
            o = f"{onde} etapa {i + 1}"
            if not e["o_que_fazer"] or not e["porque"]:
                erros.append(f"{o}: falta 'o que fazer' ou 'porquê'")
            chk(e["check"], o)
            for b in e["comandos"]:
                if b["em"] not in nomes:
                    erros.append(f"{o}: comandos para equipamento inexistente {b['em']!r}")
                for ln in b["linhas"]:
                    if not ln["explica"]:
                        erros.append(f"{o}: comando sem explicação {ln['cmd']!r}")
            for a in e["acoes"]:
                for campo in ("nome", "a", "b"):
                    if a.get(campo) and a[campo] not in nomes:
                        erros.append(f"{o}: ação para equipamento inexistente {a[campo]!r}")
    return erros
