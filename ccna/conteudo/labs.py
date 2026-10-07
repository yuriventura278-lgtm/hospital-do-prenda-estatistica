"""Laboratórios do terminal Cisco IOS simulado (separador Jogar › Laboratório CLI).

Cada tarefa tem uma verificação (``check``) que o simulador (www/js/ios.js)
avalia sobre o estado do equipamento. Tipos de verificação disponíveis:

hostname, iface_ip, iface_up, iface_desc, enable_secret, line_login,
vty_ssh, domain, rsa, user, banner, no_domain_lookup, pwd_enc, saved,
vlan, access_vlan, trunk, native, route, ospf_net, ospf_rid, passive,
subif, ip_routing, svi, dhcp_pool, dhcp_excl, portsec, portsec_max,
portsec_sticky, nat_inside, nat_outside, nat_overload, acl_std, ipv6_routing
"""


def tarefa(desc, comando, check):
    return {"desc": desc, "dica": comando, "check": check}


def lab(id, titulo, modulo, dispositivo, hostname, descricao, tarefas, nivel="básico"):
    return {"id": id, "titulo": titulo, "modulo": modulo, "dispositivo": dispositivo,
            "hostname": hostname, "descricao": descricao, "tarefas": tarefas, "nivel": nivel}


G00 = "GigabitEthernet0/0"
G01 = "GigabitEthernet0/1"

LABS = [
    lab("lab1", "Primeiro contacto com o IOS", "m4", "router", "Router",
        "Navegue entre os modos, dê nome ao router e guarde a configuração.", [
            tarefa("Entre no modo privilegiado e depois na configuração global", "enable → configure terminal", {"t": "mode", "v": "config"}),
            tarefa("Dê o nome R1 ao router", "hostname R1", {"t": "hostname", "v": "R1"}),
            tarefa("Desative a pesquisa DNS de comandos errados", "no ip domain-lookup", {"t": "no_domain_lookup"}),
            tarefa("Volte ao modo privilegiado e guarde a configuração", "end → copy running-config startup-config", {"t": "saved"}),
        ]),

    lab("lab2", "Configuração base segura", "m4", "router", "R1",
        "Proteja o router como faria no primeiro dia de trabalho.", [
            tarefa("Palavra-passe do modo privilegiado com hash", "enable secret <senha>", {"t": "enable_secret"}),
            tarefa("Palavra-passe e login na consola", "line console 0 → password <senha> → login", {"t": "line_login", "line": "con"}),
            tarefa("Cifre as palavras-passe em texto simples", "service password-encryption", {"t": "pwd_enc"}),
            tarefa("Configure um banner MOTD", "banner motd #Acesso restrito#", {"t": "banner"}),
            tarefa("Guarde a configuração", "copy running-config startup-config", {"t": "saved"}),
        ]),

    lab("lab3", "Acesso remoto por SSH", "m4", "router", "R1",
        "Ative SSH versão 2 com utilizador local e bloqueie o Telnet.", [
            tarefa("Defina o domínio empresa.local", "ip domain-name empresa.local", {"t": "domain"}),
            tarefa("Crie o utilizador admin com secret", "username admin secret <senha>", {"t": "user", "v": "admin"}),
            tarefa("Gere as chaves RSA de 2048 bits", "crypto key generate rsa modulus 2048", {"t": "rsa"}),
            tarefa("Nas linhas vty use utilizadores locais", "line vty 0 4 → login local", {"t": "line_login", "line": "vty", "local": True}),
            tarefa("Permita apenas SSH nas vty", "transport input ssh", {"t": "vty_ssh"}),
        ], nivel="intermédio"),

    lab("lab4", "Interfaces do router", "m4", "router", "R1",
        "Ponha as interfaces LAN e WAN a funcionar.", [
            tarefa("G0/0: 192.168.1.1/24", "interface g0/0 → ip address 192.168.1.1 255.255.255.0", {"t": "iface_ip", "if": G00, "ip": "192.168.1.1", "mask": "255.255.255.0"}),
            tarefa("Descreva G0/0 como LAN", "description LAN", {"t": "iface_desc", "if": G00}),
            tarefa("Ative G0/0", "no shutdown", {"t": "iface_up", "if": G00}),
            tarefa("G0/1: 10.0.12.1/30 e ativa", "interface g0/1 → ip address 10.0.12.1 255.255.255.252 → no shutdown", {"t": "iface_ip", "if": G01, "ip": "10.0.12.1", "mask": "255.255.255.252", "up": True}),
            tarefa("Verifique com show ip interface brief", "do show ip interface brief", {"t": "ran", "v": "show ip interface brief"}),
        ]),

    lab("lab5", "VLANs e portas de acesso", "m5", "switch", "SW1",
        "Crie as VLANs da empresa e coloque as portas certas em cada uma.", [
            tarefa("Crie a VLAN 10 com o nome VENDAS", "vlan 10 → name VENDAS", {"t": "vlan", "id": 10, "name": "VENDAS"}),
            tarefa("Crie a VLAN 20 com o nome TI", "vlan 20 → name TI", {"t": "vlan", "id": 20, "name": "TI"}),
            tarefa("Fa0/1 em modo access na VLAN 10", "interface fa0/1 → switchport mode access → switchport access vlan 10", {"t": "access_vlan", "if": "FastEthernet0/1", "vlan": 10}),
            tarefa("Fa0/2 em modo access na VLAN 20", "interface fa0/2 → switchport mode access → switchport access vlan 20", {"t": "access_vlan", "if": "FastEthernet0/2", "vlan": 20}),
            tarefa("Confirme com show vlan brief", "do show vlan brief", {"t": "ran", "v": "show vlan brief"}),
        ], nivel="intermédio"),

    lab("lab6", "Trunk 802.1Q", "m5", "switch", "SW1",
        "Ligue este switch ao SW2 por um trunk seguro.", [
            tarefa("Crie a VLAN 99 (NATIVA)", "vlan 99 → name NATIVA", {"t": "vlan", "id": 99, "name": "NATIVA"}),
            tarefa("G0/1 em modo trunk", "interface g0/1 → switchport mode trunk", {"t": "trunk", "if": G01}),
            tarefa("VLAN nativa 99 em G0/1", "switchport trunk native vlan 99", {"t": "native", "if": G01, "vlan": 99}),
            tarefa("Desative o DTP em G0/1", "switchport nonegotiate", {"t": "nonegotiate", "if": G01}),
            tarefa("Verifique com show interfaces trunk", "do show interfaces trunk", {"t": "ran", "v": "show interfaces trunk"}),
        ], nivel="intermédio"),

    lab("lab7", "Router-on-a-stick", "m5", "router", "R1",
        "Encaminhe entre as VLANs 10 e 20 por uma só interface.", [
            tarefa("Ative a interface física G0/0", "interface g0/0 → no shutdown", {"t": "iface_up", "if": G00}),
            tarefa("Subinterface G0/0.10: VLAN 10, 192.168.10.1/24", "interface g0/0.10 → encapsulation dot1Q 10 → ip address 192.168.10.1 255.255.255.0",
                   {"t": "subif", "if": "GigabitEthernet0/0.10", "vlan": 10, "ip": "192.168.10.1"}),
            tarefa("Subinterface G0/0.20: VLAN 20, 192.168.20.1/24", "interface g0/0.20 → encapsulation dot1Q 20 → ip address 192.168.20.1 255.255.255.0",
                   {"t": "subif", "if": "GigabitEthernet0/0.20", "vlan": 20, "ip": "192.168.20.1"}),
        ], nivel="intermédio"),

    lab("lab8", "Rotas estáticas", "m6", "router", "R1",
        "R1 liga à LAN 192.168.2.0/24 através de R2 (10.0.12.2) e à Internet via 203.0.113.1.", [
            tarefa("G0/1 com 10.0.12.1/30 e ativa", "interface g0/1 → ip address 10.0.12.1 255.255.255.252 → no shutdown", {"t": "iface_ip", "if": G01, "ip": "10.0.12.1", "mask": "255.255.255.252", "up": True}),
            tarefa("Rota para 192.168.2.0/24 via 10.0.12.2", "ip route 192.168.2.0 255.255.255.0 10.0.12.2", {"t": "route", "net": "192.168.2.0", "mask": "255.255.255.0", "via": "10.0.12.2"}),
            tarefa("Rota por defeito via 203.0.113.1", "ip route 0.0.0.0 0.0.0.0 203.0.113.1", {"t": "route", "net": "0.0.0.0", "mask": "0.0.0.0", "via": "203.0.113.1"}),
            tarefa("Veja a tabela de encaminhamento", "do show ip route", {"t": "ran", "v": "show ip route"}),
        ], nivel="intermédio"),

    lab("lab9", "OSPF de área única", "m6", "router", "R1",
        "Ative OSPF na área 0 com router ID manual e LAN passiva.", [
            tarefa("Inicie o processo OSPF 1", "router ospf 1", {"t": "ospf"}),
            tarefa("Router ID 1.1.1.1", "router-id 1.1.1.1", {"t": "ospf_rid", "v": "1.1.1.1"}),
            tarefa("Anuncie 10.0.12.0/30 na área 0", "network 10.0.12.0 0.0.0.3 area 0", {"t": "ospf_net", "net": "10.0.12.0", "wc": "0.0.0.3", "area": "0"}),
            tarefa("Anuncie 192.168.1.0/24 na área 0", "network 192.168.1.0 0.0.0.255 area 0", {"t": "ospf_net", "net": "192.168.1.0", "wc": "0.0.0.255", "area": "0"}),
            tarefa("G0/0 (LAN) passiva", "passive-interface g0/0", {"t": "passive", "if": G00}),
        ], nivel="avançado"),

    lab("lab10", "Servidor DHCP no router", "m7", "router", "R1",
        "Distribua endereços na LAN 192.168.1.0/24.", [
            tarefa("Exclua 192.168.1.1 a 192.168.1.10", "ip dhcp excluded-address 192.168.1.1 192.168.1.10", {"t": "dhcp_excl"}),
            tarefa("Crie o pool LAN com a rede 192.168.1.0/24", "ip dhcp pool LAN → network 192.168.1.0 255.255.255.0", {"t": "dhcp_pool", "name": "LAN", "net": "192.168.1.0"}),
            tarefa("Gateway 192.168.1.1 no pool", "default-router 192.168.1.1", {"t": "dhcp_gw", "name": "LAN", "v": "192.168.1.1"}),
            tarefa("DNS 8.8.8.8 no pool", "dns-server 8.8.8.8", {"t": "dhcp_dns", "name": "LAN"}),
        ], nivel="intermédio"),

    lab("lab11", "PAT para a Internet", "m7", "router", "R1",
        "Toda a LAN 192.168.1.0/24 sai para a Internet com o IP de G0/1.", [
            tarefa("ACL 1 a permitir 192.168.1.0/24", "access-list 1 permit 192.168.1.0 0.0.0.255", {"t": "acl_std", "n": 1}),
            tarefa("G0/0 como ip nat inside", "interface g0/0 → ip nat inside", {"t": "nat_inside", "if": G00}),
            tarefa("G0/1 como ip nat outside", "interface g0/1 → ip nat outside", {"t": "nat_outside", "if": G01}),
            tarefa("Ative o PAT com a interface G0/1", "ip nat inside source list 1 interface g0/1 overload", {"t": "nat_overload"}),
        ], nivel="intermédio"),

    lab("lab12", "Port security", "m8", "switch", "SW1",
        "Proteja a porta Fa0/5 de um posto de trabalho com PC e telefone IP.", [
            tarefa("Fa0/5 em modo access", "interface fa0/5 → switchport mode access", {"t": "access_mode", "if": "FastEthernet0/5"}),
            tarefa("Ative port security", "switchport port-security", {"t": "portsec", "if": "FastEthernet0/5"}),
            tarefa("Máximo de 2 MACs", "switchport port-security maximum 2", {"t": "portsec_max", "if": "FastEthernet0/5", "v": 2}),
            tarefa("Aprenda os MACs com sticky", "switchport port-security mac-address sticky", {"t": "portsec_sticky", "if": "FastEthernet0/5"}),
        ], nivel="intermédio"),
]


# Contexto real de cada laboratório: quem é o cliente e porque faz este trabalho.
CENARIOS = {
    "lab1": "Chegou um router novo para a Padaria Central. Antes de o instalar, ligue-se pela consola, dê-lhe um nome e guarde a configuração.",
    "lab2": "A auditoria da Clínica Boa Saúde detetou que o router não tem palavras-passe. Corrija antes da próxima visita do auditor.",
    "lab3": "O técnico da empresa trabalha à distância e precisa de gerir o router com segurança. O Telnet foi proibido pela política de segurança.",
    "lab4": "Vai ligar o router de uma escola: a G0/0 serve a rede dos professores e a G0/1 liga ao router do operador.",
    "lab5": "O escritório da Imobiliária Horizonte quer separar os computadores de Vendas e de TI no mesmo switch.",
    "lab6": "A imobiliária comprou um segundo switch para o primeiro andar. Ligue-os de forma que as VLANs passem entre os dois.",
    "lab7": "As VLANs de Vendas e TI precisam de partilhar a impressora e o servidor, mas só existe um router com uma porta livre.",
    "lab8": "A rede de farmácias abriu uma filial. R1 (sede) tem de chegar à LAN da filial através de R2 e à Internet pelo operador.",
    "lab9": "Com 10 filiais, as rotas estáticas tornaram-se difíceis de manter. Ative OSPF na sede.",
    "lab10": "A cafetaria não tem servidor. O próprio router vai distribuir IPs aos computadores e ao Wi-Fi.",
    "lab11": "O operador deu à loja um único IP público. Todos os computadores têm de sair para a Internet por ele.",
    "lab12": "No balcão de atendimento de um banco, cada posto tem um PC e um telefone IP. Ninguém pode ligar outro equipamento à tomada.",
}
for _l in LABS:
    _l["cenario"] = CENARIOS[_l["id"]]
