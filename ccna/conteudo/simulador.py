"""Atividades guiadas do Simulador de rede (separador Jogar › Simulador de rede).

Cada atividade tem uma topologia inicial (pode estar vazia), um cenário real e
passos com verificação automática feita pelo simulador (www/js/simulador.js).

Tipos de verificação (``check``):
- tem: {tipo, n}                     existem pelo menos n equipamentos desse tipo
- ligado_tipo: {a, b, n}             n ligações válidas entre tipos a e b
- cabo: {a, b, cabo}                 ligação entre os equipamentos a e b com esse cabo, válida
- cabos_ok: {}                       todas as ligações estão corretas (luz verde)
- pc_ip: {nome, ip, mask, gw?}       configuração IP de um PC/servidor
- pc_rede: {rede, n}                 n PCs com IP dentro da rede (ex.: 192.168.1.0/24)
- ping: {de, para, falha?}           ping de um PC (para = IP ou nome); falha=True exige que falhe
- ping_tipo: {}                      dois PCs quaisquer fazem ping um ao outro
- ios: {nome, check}                 verificação do terminal IOS (ver labs.py)
- dhcp: {nome}                       o PC recebeu IP por DHCP
- ospf_viz: {nome, n}                o router tem n vizinhos OSPF
- dns: {nome, registo}               o servidor tem o registo DNS
"""


def passo(texto, ajuda, check):
    return {"texto": texto, "ajuda": ajuda, "check": check}


def dev(nome, tipo, x, y, **extra):
    d = {"nome": nome, "tipo": tipo, "x": x, "y": y}
    d.update(extra)
    return d


def lig(a, pa, b, pb, cabo):
    return {"a": a, "pa": pa, "b": b, "pb": pb, "cabo": cabo}


def atividade(id, titulo, modulo, nivel, cenario, passos, dispositivos=None, ligacoes=None, livre=False):
    return {"id": id, "titulo": titulo, "modulo": modulo, "nivel": nivel, "cenario": cenario,
            "inicial": {"dispositivos": dispositivos or [], "ligacoes": ligacoes or []}, "passos": passos, "livre": livre}


G0, G1, G2 = "GigabitEthernet0/0/0", "GigabitEthernet0/0/1", "GigabitEthernet0/0/2"
M24 = "255.255.255.0"

# Configurações reutilizadas
VLANS_S = ["enable", "configure terminal", "vlan 10", "name VENDAS", "vlan 20", "name TI", "exit",
           "interface fa0/1", "switchport mode access", "switchport access vlan 10",
           "interface fa0/2", "switchport mode access", "switchport access vlan 20",
           "interface g0/1", "switchport mode trunk", "end"]
LINHA_R = {
    "R1": ["enable", "configure terminal", "hostname R1", f"interface {G0}", "ip address 192.168.1.1 255.255.255.0", "no shutdown",
           f"interface {G1}", "ip address 10.0.12.1 255.255.255.252", "no shutdown", "end"],
    "R2": ["enable", "configure terminal", "hostname R2", f"interface {G0}", "ip address 192.168.2.1 255.255.255.0", "no shutdown",
           f"interface {G1}", "ip address 10.0.12.2 255.255.255.252", "no shutdown",
           f"interface {G2}", "ip address 10.0.23.1 255.255.255.252", "no shutdown", "end"],
    "R3": ["enable", "configure terminal", "hostname R3", f"interface {G0}", "ip address 192.168.3.1 255.255.255.0", "no shutdown",
           f"interface {G1}", "ip address 10.0.23.2 255.255.255.252", "no shutdown", "end"],
}
TRES_ROUTERS = dict(
    dispositivos=[dev("R1", "router", 20, 40, cmds=LINHA_R["R1"]), dev("R2", "router", 50, 40, cmds=LINHA_R["R2"]), dev("R3", "router", 80, 40, cmds=LINHA_R["R3"]),
                  dev("S1", "switch", 20, 70), dev("S2", "switch", 50, 70), dev("S3", "switch", 80, 70),
                  dev("PC1", "pc", 20, 95, ip="192.168.1.10", mask=M24, gw="192.168.1.1"),
                  dev("PC2", "pc", 50, 95, ip="192.168.2.10", mask=M24, gw="192.168.2.1"),
                  dev("PC3", "pc", 80, 95, ip="192.168.3.10", mask=M24, gw="192.168.3.1")],
    ligacoes=[lig("R1", G1, "R2", G1, "cruzado"), lig("R2", G2, "R3", G1, "cruzado"),
              lig("R1", G0, "S1", "GigabitEthernet0/1", "direto"), lig("R2", G0, "S2", "GigabitEthernet0/1", "direto"), lig("R3", G0, "S3", "GigabitEthernet0/1", "direto"),
              lig("PC1", "FastEthernet0", "S1", "FastEthernet0/1", "direto"), lig("PC2", "FastEthernet0", "S2", "FastEthernet0/1", "direto"), lig("PC3", "FastEthernet0", "S3", "FastEthernet0/1", "direto")],
)

ATIVIDADES = [
    atividade("s01", "A primeira rede", "a7", "básico",
              "Uma pequena papelaria quer ligar os seus dois computadores para partilhar a impressora. Monte a rede do zero.",
              [passo("Adicione 2 PCs à área de trabalho", "Botão + › PC (duas vezes).", {"t": "tem", "tipo": "pc", "n": 2}),
               passo("Adicione um switch", "Botão + › Switch 2960.", {"t": "tem", "tipo": "switch", "n": 1}),
               passo("Ligue cada PC ao switch com cabo direto", "Ferramenta Cabo › Direto › toque no PC › FastEthernet0 › toque no switch › uma porta Fa0/x.", {"t": "ligado_tipo", "a": "pc", "b": "switch", "n": 2}),
               passo("Dê aos PCs IPs da rede 192.168.1.0/24 (ex.: .10 e .11, máscara 255.255.255.0)", "Toque no PC › Configuração IP › Estático.", {"t": "pc_rede", "rede": "192.168.1.0/24", "n": 2}),
               passo("Faça ping de um PC para o outro", "Toque no PC › Prompt › ping 192.168.1.11", {"t": "ping_tipo"})],
              livre=True),

    atividade("s02", "O cabo certo", "itn4", "básico",
              "Chegou à sala de equipamentos de uma escola e os cabos foram todos desligados. Volte a ligar cada equipamento com o cabo correto.",
              [passo("Ligue PC1 a S1 (equipamentos diferentes)", "Cabo direto: PC1 FastEthernet0 → S1 Fa0/1.", {"t": "cabo", "a": "PC1", "b": "S1", "cabo": "direto"}),
               passo("Ligue S1 a S2 (switch com switch)", "Equipamentos iguais: cabo cruzado (Gi0/1 ↔ Gi0/1).", {"t": "cabo", "a": "S1", "b": "S2", "cabo": "cruzado"}),
               passo("Ligue S2 ao router R1", "Switch ↔ router: cabo direto (Gi0/2 → G0/0/0).", {"t": "cabo", "a": "S2", "b": "R1", "cabo": "direto"}),
               passo("Ligue R1 a R2 (router com router)", "Cabo cruzado entre G0/0/1 dos dois.", {"t": "cabo", "a": "R1", "b": "R2", "cabo": "cruzado"}),
               passo("Ligue o portátil PC2 diretamente ao R2", "PC ↔ router: cabo cruzado (FastEthernet0 → G0/0/0).", {"t": "cabo", "a": "PC2", "b": "R2", "cabo": "cruzado"}),
               passo("Ligue o cabo de consola do PC1 ao router R1", "Cabo Consola: PC1 RS232 → R1 Console.", {"t": "cabo", "a": "PC1", "b": "R1", "cabo": "consola"})],
              dispositivos=[dev("PC1", "pc", 12, 30), dev("S1", "switch", 35, 30), dev("S2", "switch", 58, 30), dev("R1", "router", 80, 30),
                            dev("R2", "router", 80, 80), dev("PC2", "portatil", 50, 80)]),

    atividade("s03", "Configuração inicial do switch", "itn2", "básico",
              "O switch novo da Clínica Boa Saúde está ligado ao PC do técnico pelo cabo de consola e por cabo de rede. Configure-o para gestão.",
              [passo("Dê o nome S1 ao switch", "Toque no switch › CLI: enable › configure terminal › hostname S1", {"t": "ios", "nome": "S1", "check": {"t": "hostname", "v": "S1"}}),
               passo("Proteja o modo privilegiado com enable secret", "enable secret Class#2026", {"t": "ios", "nome": "S1", "check": {"t": "enable_secret"}}),
               passo("Palavra-passe e login na consola", "line console 0 › password Cisco#Con › login", {"t": "ios", "nome": "S1", "check": {"t": "line_login", "line": "con"}}),
               passo("IP de gestão 192.168.1.2/24 na interface vlan 1, ativa", "interface vlan 1 › ip address 192.168.1.2 255.255.255.0 › no shutdown", {"t": "ios", "nome": "S1", "check": {"t": "iface_ip", "if": "Vlan1", "ip": "192.168.1.2", "mask": M24, "up": True}}),
               passo("Configure o PC1 com 192.168.1.10/24", "Toque no PC1 › Configuração IP.", {"t": "pc_ip", "nome": "PC1", "ip": "192.168.1.10", "mask": M24}),
               passo("Faça ping do PC1 ao switch", "PC1 › Prompt › ping 192.168.1.2", {"t": "ping", "de": "PC1", "para": "192.168.1.2"}),
               passo("Guarde a configuração do switch", "end › copy running-config startup-config", {"t": "ios", "nome": "S1", "check": {"t": "saved"}})],
              dispositivos=[dev("S1", "switch", 60, 40, nomeIos="Switch"), dev("PC1", "pc", 25, 40)],
              ligacoes=[lig("PC1", "FastEthernet0", "S1", "FastEthernet0/1", "direto"), lig("PC1", "RS232", "S1", "Console", "consola")]),

    atividade("s04", "Router com duas redes", "itn10", "básico",
              "Uma escola tem a sala dos professores (192.168.10.0/24) e a sala de alunos (192.168.11.0/24). Ligue-as pelo router.",
              [passo("Configure G0/0/0 do R1: 192.168.10.1/24 e ative", "interface g0/0/0 › ip address 192.168.10.1 255.255.255.0 › no shutdown", {"t": "ios", "nome": "R1", "check": {"t": "iface_ip", "if": G0, "ip": "192.168.10.1", "mask": M24, "up": True}}),
               passo("Configure G0/0/1 do R1: 192.168.11.1/24 e ative", "interface g0/0/1 › ip address 192.168.11.1 255.255.255.0 › no shutdown", {"t": "ios", "nome": "R1", "check": {"t": "iface_ip", "if": G1, "ip": "192.168.11.1", "mask": M24, "up": True}}),
               passo("PC1: 192.168.10.10/24, gateway 192.168.10.1", "PC1 › Configuração IP.", {"t": "pc_ip", "nome": "PC1", "ip": "192.168.10.10", "mask": M24, "gw": "192.168.10.1"}),
               passo("PC2: 192.168.11.10/24, gateway 192.168.11.1", "PC2 › Configuração IP.", {"t": "pc_ip", "nome": "PC2", "ip": "192.168.11.10", "mask": M24, "gw": "192.168.11.1"}),
               passo("Ping do PC1 ao PC2", "PC1 › Prompt › ping 192.168.11.10", {"t": "ping", "de": "PC1", "para": "192.168.11.10"})],
              dispositivos=[dev("R1", "router", 50, 20, nomeIos="Router"), dev("S1", "switch", 25, 50), dev("S2", "switch", 75, 50), dev("PC1", "pc", 25, 85), dev("PC2", "pc", 75, 85)],
              ligacoes=[lig("R1", G0, "S1", "GigabitEthernet0/1", "direto"), lig("R1", G1, "S2", "GigabitEthernet0/1", "direto"),
                        lig("PC1", "FastEthernet0", "S1", "FastEthernet0/1", "direto"), lig("PC2", "FastEthernet0", "S2", "FastEthernet0/1", "direto")]),

    atividade("s05", "Plano de sub-redes", "itn11", "intermédio",
              "A empresa recebeu 192.168.50.0/24 e quer 3 redes iguais (/26) para Vendas, TI e Gestão. O gateway é sempre o primeiro IP de cada rede.",
              [passo("G0/0/0: primeira sub-rede (192.168.50.1/26)", "ip address 192.168.50.1 255.255.255.192", {"t": "ios", "nome": "R1", "check": {"t": "iface_ip", "if": G0, "ip": "192.168.50.1", "mask": "255.255.255.192", "up": True}}),
               passo("G0/0/1: segunda sub-rede (gateway .65)", "ip address 192.168.50.65 255.255.255.192", {"t": "ios", "nome": "R1", "check": {"t": "iface_ip", "if": G1, "ip": "192.168.50.65", "mask": "255.255.255.192", "up": True}}),
               passo("G0/0/2: terceira sub-rede (gateway .129)", "ip address 192.168.50.129 255.255.255.192", {"t": "ios", "nome": "R1", "check": {"t": "iface_ip", "if": G2, "ip": "192.168.50.129", "mask": "255.255.255.192", "up": True}}),
               passo("PC1 com 192.168.50.10/26 e gateway .1", "Máscara 255.255.255.192.", {"t": "pc_ip", "nome": "PC1", "ip": "192.168.50.10", "mask": "255.255.255.192", "gw": "192.168.50.1"}),
               passo("PC2 com 192.168.50.70/26 e gateway .65", "", {"t": "pc_ip", "nome": "PC2", "ip": "192.168.50.70", "mask": "255.255.255.192", "gw": "192.168.50.65"}),
               passo("PC3 com 192.168.50.130/26 e gateway .129", "", {"t": "pc_ip", "nome": "PC3", "ip": "192.168.50.130", "mask": "255.255.255.192", "gw": "192.168.50.129"}),
               passo("Ping do PC1 ao PC3", "ping 192.168.50.130", {"t": "ping", "de": "PC1", "para": "192.168.50.130"})],
              dispositivos=[dev("R1", "router", 50, 18, cmds=["enable", "configure terminal", "hostname R1", "end"]), dev("S1", "switch", 18, 50), dev("S2", "switch", 50, 50), dev("S3", "switch", 82, 50),
                            dev("PC1", "pc", 18, 85), dev("PC2", "pc", 50, 85), dev("PC3", "pc", 82, 85)],
              ligacoes=[lig("R1", G0, "S1", "GigabitEthernet0/1", "direto"), lig("R1", G1, "S2", "GigabitEthernet0/1", "direto"), lig("R1", G2, "S3", "GigabitEthernet0/1", "direto"),
                        lig("PC1", "FastEthernet0", "S1", "FastEthernet0/1", "direto"), lig("PC2", "FastEthernet0", "S2", "FastEthernet0/1", "direto"), lig("PC3", "FastEthernet0", "S3", "FastEthernet0/1", "direto")]),

    atividade("s06", "VLANs e trunk entre dois switches", "srwe3", "intermédio",
              "A Imobiliária Horizonte tem Vendas (VLAN 10) e TI (VLAN 20) em dois andares. Separe-os por VLAN e ligue os andares por trunk.",
              [passo("Em S1 e S2 crie a VLAN 10 (VENDAS) e a VLAN 20 (TI)", "vlan 10 › name VENDAS › vlan 20 › name TI (nos dois switches).", {"t": "e", "lista": [
                  {"t": "ios", "nome": "S1", "check": {"t": "vlan", "id": 10}}, {"t": "ios", "nome": "S1", "check": {"t": "vlan", "id": 20}},
                  {"t": "ios", "nome": "S2", "check": {"t": "vlan", "id": 10}}, {"t": "ios", "nome": "S2", "check": {"t": "vlan", "id": 20}}]}),
               passo("Fa0/1 na VLAN 10 e Fa0/2 na VLAN 20, nos dois switches", "interface fa0/1 › switchport mode access › switchport access vlan 10 (e fa0/2 na 20).", {"t": "e", "lista": [
                  {"t": "ios", "nome": "S1", "check": {"t": "access_vlan", "if": "FastEthernet0/1", "vlan": 10}}, {"t": "ios", "nome": "S1", "check": {"t": "access_vlan", "if": "FastEthernet0/2", "vlan": 20}},
                  {"t": "ios", "nome": "S2", "check": {"t": "access_vlan", "if": "FastEthernet0/1", "vlan": 10}}, {"t": "ios", "nome": "S2", "check": {"t": "access_vlan", "if": "FastEthernet0/2", "vlan": 20}}]}),
               passo("G0/1 em modo trunk nos dois switches", "interface g0/1 › switchport mode trunk", {"t": "e", "lista": [
                  {"t": "ios", "nome": "S1", "check": {"t": "trunk", "if": "GigabitEthernet0/1"}}, {"t": "ios", "nome": "S2", "check": {"t": "trunk", "if": "GigabitEthernet0/1"}}]}),
               passo("PC1 (VLAN 10, S1) faz ping ao PC3 (VLAN 10, S2)", "PC1 › Prompt › ping 192.168.10.13", {"t": "ping", "de": "PC1", "para": "192.168.10.13"}),
               passo("Confirme que PC1 (VLAN 10) NÃO chega ao PC2 (VLAN 20)", "ping 192.168.20.12 tem de falhar: VLANs diferentes precisam de router.", {"t": "ping", "de": "PC1", "para": "192.168.20.12", "falha": True})],
              dispositivos=[dev("S1", "switch", 30, 35, cmds=["enable", "configure terminal", "hostname S1", "end"]), dev("S2", "switch", 70, 35, cmds=["enable", "configure terminal", "hostname S2", "end"]),
                            dev("PC1", "pc", 15, 80, ip="192.168.10.11", mask=M24), dev("PC2", "pc", 40, 80, ip="192.168.20.12", mask=M24),
                            dev("PC3", "pc", 60, 80, ip="192.168.10.13", mask=M24), dev("PC4", "pc", 85, 80, ip="192.168.20.14", mask=M24)],
              ligacoes=[lig("S1", "GigabitEthernet0/1", "S2", "GigabitEthernet0/1", "cruzado"), lig("PC1", "FastEthernet0", "S1", "FastEthernet0/1", "direto"),
                        lig("PC2", "FastEthernet0", "S1", "FastEthernet0/2", "direto"), lig("PC3", "FastEthernet0", "S2", "FastEthernet0/1", "direto"), lig("PC4", "FastEthernet0", "S2", "FastEthernet0/2", "direto")]),

    atividade("s07", "Router-on-a-stick", "srwe4", "intermédio",
              "As VLANs já estão criadas. Agora Vendas e TI precisam de partilhar a impressora: encaminhe entre VLANs com um único cabo até ao router.",
              [passo("Em S1, G0/2 (para o router) em modo trunk", "interface g0/2 › switchport mode trunk", {"t": "ios", "nome": "S1", "check": {"t": "trunk", "if": "GigabitEthernet0/2"}}),
               passo("No R1 ative a interface física G0/0/0", "interface g0/0/0 › no shutdown", {"t": "ios", "nome": "R1", "check": {"t": "iface_up", "if": G0}}),
               passo("Subinterface G0/0/0.10: VLAN 10, 192.168.10.1/24", "interface g0/0/0.10 › encapsulation dot1Q 10 › ip address 192.168.10.1 255.255.255.0", {"t": "ios", "nome": "R1", "check": {"t": "subif", "if": G0 + ".10", "vlan": 10, "ip": "192.168.10.1"}}),
               passo("Subinterface G0/0/0.20: VLAN 20, 192.168.20.1/24", "interface g0/0/0.20 › encapsulation dot1Q 20 › ip address 192.168.20.1 255.255.255.0", {"t": "ios", "nome": "R1", "check": {"t": "subif", "if": G0 + ".20", "vlan": 20, "ip": "192.168.20.1"}}),
               passo("Ping do PC1 (VLAN 10) ao PC2 (VLAN 20)", "ping 192.168.20.12", {"t": "ping", "de": "PC1", "para": "192.168.20.12"})],
              dispositivos=[dev("R1", "router", 50, 15, cmds=["enable", "configure terminal", "hostname R1", "end"]), dev("S1", "switch", 50, 50, cmds=VLANS_S),
                            dev("PC1", "pc", 25, 85, ip="192.168.10.11", mask=M24, gw="192.168.10.1"), dev("PC2", "pc", 75, 85, ip="192.168.20.12", mask=M24, gw="192.168.20.1")],
              ligacoes=[lig("R1", G0, "S1", "GigabitEthernet0/2", "direto"), lig("PC1", "FastEthernet0", "S1", "FastEthernet0/1", "direto"), lig("PC2", "FastEthernet0", "S1", "FastEthernet0/2", "direto")]),

    atividade("s08", "DHCP no router", "srwe7", "intermédio",
              "A cafetaria não tem servidor: o router vai distribuir IPs aos computadores. Os PCs já estão em modo DHCP.",
              [passo("R1 G0/0/0 com 192.168.1.1/24, ativa", "interface g0/0/0 › ip address 192.168.1.1 255.255.255.0 › no shutdown", {"t": "ios", "nome": "R1", "check": {"t": "iface_ip", "if": G0, "ip": "192.168.1.1", "mask": M24, "up": True}}),
               passo("Exclua 192.168.1.1 a 192.168.1.9", "ip dhcp excluded-address 192.168.1.1 192.168.1.9", {"t": "ios", "nome": "R1", "check": {"t": "dhcp_excl"}}),
               passo("Crie o pool LAN com a rede 192.168.1.0/24 e o gateway 192.168.1.1", "ip dhcp pool LAN › network 192.168.1.0 255.255.255.0 › default-router 192.168.1.1", {"t": "ios", "nome": "R1", "check": {"t": "dhcp_gw", "name": "LAN", "v": "192.168.1.1"}}),
               passo("O PC1 recebe IP por DHCP", "PC1 › Prompt › ipconfig /renew", {"t": "dhcp", "nome": "PC1"}),
               passo("O PC2 recebe IP e faz ping ao PC1", "PC2 › Prompt › ipconfig /renew › ping ao IP do PC1", {"t": "e", "lista": [{"t": "dhcp", "nome": "PC2"}, {"t": "ping", "de": "PC2", "para": "PC1"}]})],
              dispositivos=[dev("R1", "router", 50, 18, cmds=["enable", "configure terminal", "hostname R1", "end"]), dev("S1", "switch", 50, 50),
                            dev("PC1", "pc", 25, 85, dhcp=True), dev("PC2", "pc", 75, 85, dhcp=True)],
              ligacoes=[lig("R1", G0, "S1", "GigabitEthernet0/1", "direto"), lig("PC1", "FastEthernet0", "S1", "FastEthernet0/1", "direto"), lig("PC2", "FastEthernet0", "S1", "FastEthernet0/2", "direto")]),

    atividade("s09", "Rotas estáticas com três routers", "srwe15", "intermédio",
              "Uma rede de farmácias tem a sede (R1), um centro de distribuição (R2) e uma filial (R3). As interfaces já estão configuradas: falta o encaminhamento.",
              [passo("R1: rota por defeito via R2 (10.0.12.2)", "ip route 0.0.0.0 0.0.0.0 10.0.12.2", {"t": "ios", "nome": "R1", "check": {"t": "route", "net": "0.0.0.0", "mask": "0.0.0.0", "via": "10.0.12.2"}}),
               passo("R3: rota por defeito via R2 (10.0.23.1)", "ip route 0.0.0.0 0.0.0.0 10.0.23.1", {"t": "ios", "nome": "R3", "check": {"t": "route", "net": "0.0.0.0", "mask": "0.0.0.0", "via": "10.0.23.1"}}),
               passo("R2: rota para a LAN da sede (192.168.1.0/24 via 10.0.12.1)", "ip route 192.168.1.0 255.255.255.0 10.0.12.1", {"t": "ios", "nome": "R2", "check": {"t": "route", "net": "192.168.1.0", "mask": M24, "via": "10.0.12.1"}}),
               passo("R2: rota para a LAN da filial (192.168.3.0/24 via 10.0.23.2)", "ip route 192.168.3.0 255.255.255.0 10.0.23.2", {"t": "ios", "nome": "R2", "check": {"t": "route", "net": "192.168.3.0", "mask": M24, "via": "10.0.23.2"}}),
               passo("Ping do PC1 (sede) ao PC3 (filial)", "PC1 › Prompt › ping 192.168.3.10 (e veja o caminho com tracert)", {"t": "ping", "de": "PC1", "para": "192.168.3.10"})],
              **TRES_ROUTERS),

    atividade("s10", "OSPF com três routers", "ensa2", "avançado",
              "A rede de farmácias cresceu e as rotas estáticas tornaram-se difíceis de manter. Substitua-as por OSPF área 0.",
              [passo("R1: OSPF processo 1 com as redes 192.168.1.0/24 e 10.0.12.0/30 na área 0", "router ospf 1 › network 192.168.1.0 0.0.0.255 area 0 › network 10.0.12.0 0.0.0.3 area 0", {"t": "e", "lista": [
                  {"t": "ios", "nome": "R1", "check": {"t": "ospf_net", "net": "192.168.1.0", "wc": "0.0.0.255", "area": "0"}}, {"t": "ios", "nome": "R1", "check": {"t": "ospf_net", "net": "10.0.12.0", "wc": "0.0.0.3", "area": "0"}}]}),
               passo("R2: OSPF com 192.168.2.0/24, 10.0.12.0/30 e 10.0.23.0/30", "router ospf 1 › três comandos network … area 0", {"t": "ospf_viz", "nome": "R2", "n": 1}),
               passo("R3: OSPF com 192.168.3.0/24 e 10.0.23.0/30", "router ospf 1 › network 192.168.3.0 0.0.0.255 area 0 › network 10.0.23.0 0.0.0.3 area 0", {"t": "ospf_viz", "nome": "R2", "n": 2}),
               passo("Veja os vizinhos no R2 (show ip ospf neighbor) e as rotas O (show ip route)", "R2 › CLI › show ip ospf neighbor", {"t": "ospf_viz", "nome": "R1", "n": 1}),
               passo("Ping do PC1 ao PC3", "ping 192.168.3.10", {"t": "ping", "de": "PC1", "para": "192.168.3.10"})],
              **TRES_ROUTERS),

    atividade("s11", "Encontre a avaria", "itn17", "intermédio",
              "Chamada para o suporte: “O PC1 da sede não chega ao PC3 da filial.” A rede tinha rotas estáticas e funcionava ontem. Há 3 avarias: encontre e corrija.",
              [passo("Avaria 1: o PC3 não chega ao seu gateway", "Veja a configuração IP do PC3: o gateway tem de ser 192.168.3.1.", {"t": "pc_ip", "nome": "PC3", "ip": "192.168.3.10", "mask": M24, "gw": "192.168.3.1"}),
               passo("Avaria 2: uma interface entre routers está desligada", "No R2: show ip interface brief. Procure “administratively down”.", {"t": "ios", "nome": "R2", "check": {"t": "iface_up", "if": G2}}),
               passo("Avaria 3: falta uma rota de volta", "No R2: show ip route. Falta a rede 192.168.1.0/24?", {"t": "ios", "nome": "R2", "check": {"t": "route", "net": "192.168.1.0", "mask": M24, "via": "10.0.12.1"}}),
               passo("Confirme: ping do PC1 ao PC3", "ping 192.168.3.10", {"t": "ping", "de": "PC1", "para": "192.168.3.10"})],
              dispositivos=[dict(d, cmds=d.get("cmds", []) + ([] if d["nome"] != "R1" else ["configure terminal", "ip route 0.0.0.0 0.0.0.0 10.0.12.2", "end"])
                                 + ([] if d["nome"] != "R3" else ["configure terminal", "ip route 0.0.0.0 0.0.0.0 10.0.23.1", "end"])
                                 + ([] if d["nome"] != "R2" else ["configure terminal", "ip route 192.168.3.0 255.255.255.0 10.0.23.2", f"interface {G2}", "shutdown", "end"]))
                            if d["tipo"] == "router" else (dict(d, gw="192.168.3.254") if d["nome"] == "PC3" else d)
                            for d in TRES_ROUTERS["dispositivos"]],
              ligacoes=TRES_ROUTERS["ligacoes"]),

    atividade("s12", "Servidor de DHCP e DNS", "itn15", "intermédio",
              "A escola comprou um servidor para dar IPs aos PCs e responder pelo nome da intranet (www.escola.local).",
              [passo("Servidor SRV1 com IP fixo 192.168.1.5/24", "Toque no servidor › Configuração IP › Estático.", {"t": "pc_ip", "nome": "SRV1", "ip": "192.168.1.5", "mask": M24}),
               passo("Ligue o serviço DHCP no servidor (início 192.168.1.100, máscara /24, DNS 192.168.1.5)", "Servidor › Serviços › DHCP.", {"t": "srv_dhcp", "nome": "SRV1"}),
               passo("Os PCs recebem IP por DHCP", "PC › Prompt › ipconfig /renew", {"t": "e", "lista": [{"t": "dhcp", "nome": "PC1"}, {"t": "dhcp", "nome": "PC2"}]}),
               passo("Crie o registo DNS www.escola.local → 192.168.1.5", "Servidor › Serviços › DNS › Adicionar.", {"t": "dns", "nome": "SRV1", "registo": "www.escola.local"}),
               passo("Do PC1, faça ping a www.escola.local", "PC1 › Prompt › ping www.escola.local", {"t": "ping", "de": "PC1", "para": "www.escola.local"})],
              dispositivos=[dev("SRV1", "servidor", 50, 18), dev("S1", "switch", 50, 50), dev("PC1", "pc", 25, 85, dhcp=True), dev("PC2", "pc", 75, 85, dhcp=True)],
              ligacoes=[lig("SRV1", "FastEthernet0", "S1", "FastEthernet0/24", "direto"), lig("PC1", "FastEthernet0", "S1", "FastEthernet0/1", "direto"), lig("PC2", "FastEthernet0", "S1", "FastEthernet0/2", "direto")]),
]
