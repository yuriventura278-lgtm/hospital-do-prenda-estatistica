from .base import *

MODULO = modulo(
    id="m6", numero=6, icone="router",
    titulo="Conectividade IP: Encaminhamento",
    descricao="Tabela de encaminhamento, rotas estáticas, OSPF e redundância de gateway (FHRP). O domínio com mais peso no exame.",
    dominio="3.0 IP Connectivity",
    licoes=[
        licao(
            "m6l1", "A tabela de encaminhamento", 18,
            ["Ler cada campo de show ip route",
             "Aplicar a regra do prefixo mais longo",
             "Comparar distância administrativa e métrica"],
            [
                saida("show ip route", """
R1#show ip route
Codes: L - local, C - connected, S - static, O - OSPF, * - candidate default
Gateway of last resort is 203.0.113.1 to network 0.0.0.0

S*    0.0.0.0/0 [1/0] via 203.0.113.1
      10.0.0.0/8 is variably subnetted, 4 subnets, 3 masks
C        10.1.1.0/24 is directly connected, GigabitEthernet0/0
L        10.1.1.1/32 is directly connected, GigabitEthernet0/0
O        10.2.0.0/16 [110/2] via 10.0.12.2, 00:12:41, GigabitEthernet0/1
S        10.2.5.0/24 [1/0] via 10.0.13.3""",
                      "[110/2] = [distância administrativa / métrica]."),
                tabela(["Campo", "Exemplo", "Significado"], [
                    ["Código", "O", "Origem da rota (OSPF)"], ["Prefixo", "10.2.0.0/16", "Rede de destino"],
                    ["AD", "110", "Confiança na origem (menor = melhor)"], ["Métrica", "2", "Custo dentro do protocolo"],
                    ["Next hop", "via 10.0.12.2", "Próximo router"], ["Interface", "Gi0/1", "Por onde sai"],
                ]),
                texto("Como o router escolhe", """
<ol>
<li><b>Prefixo mais longo</b> (longest match) vence sempre. Para 10.2.5.9, a rota 10.2.5.0/24 ganha à 10.2.0.0/16, mesmo sendo estática vs OSPF.</li>
<li>Se houver o <b>mesmo prefixo</b> de várias origens, ganha a menor <b>distância administrativa</b>.</li>
<li>Mesmo prefixo e mesma origem: ganha a menor <b>métrica</b>. Empate → balanceamento (ECMP).</li>
</ol>"""),
                tabela(["Origem", "AD"], [
                    ["Ligada diretamente", "0"], ["Estática", "1"], ["eBGP", "20"], ["EIGRP (interno)", "90"],
                    ["OSPF", "110"], ["IS-IS", "115"], ["RIP", "120"], ["EIGRP (externo)", "170"], ["iBGP", "200"], ["Inutilizável", "255"],
                ], "Distâncias administrativas (decore!)"),
                exemplo("Qual rota é usada para 172.16.10.5?", """
<p>Tabela: <code>172.16.0.0/16 via A</code> (OSPF), <code>172.16.10.0/24 via B</code> (RIP), <code>172.16.10.0/28 via C</code> (estática), <code>0.0.0.0/0 via D</code>.</p>
<p>172.16.10.5 cabe em /16, /24 e /28 (.0–.15). O mais longo é <b>/28 → via C</b>. A AD só desempata prefixos iguais.</p>"""),
                video("Tabela de roteamento Cisco", "show ip route explicado longest prefix match distância administrativa"),
            ],
            [
                mc("Qual a distância administrativa do OSPF?", ["90", "110", "120", "1"], 1, "OSPF = 110."),
                mc("Que critério é aplicado primeiro na escolha de rota?", ["Menor AD", "Menor métrica", "Prefixo mais longo", "Rota mais antiga"], 2, "Longest prefix match sempre primeiro."),
                mc("Em [120/3], o que significa o 3?", ["AD", "Métrica", "Saltos de TTL", "Número de rotas"], 1, "[AD/métrica]."),
                vf("Uma rota com código L é uma rota /32 do próprio IP da interface.", True, "Local route, criada automaticamente."),
                mc("Tráfego para 10.2.5.9 com as rotas 10.2.0.0/16 (OSPF) e 10.2.5.0/24 (estática). Qual é usada?", ["OSPF, porque é dinâmica", "Estática /24, prefixo mais longo", "As duas em balanceamento", "Nenhuma"], 1, "/24 é mais específico."),
            ],
            ["odom2", "odom1", "netacad_srwe"],
            nivel="intermédio",
        ),

        licao(
            "m6l2", "Rotas estáticas IPv4 e IPv6", 18,
            ["Configurar rotas estáticas, por defeito, de host e flutuantes",
             "Distinguir next hop, interface de saída e rota totalmente especificada"],
            [
                topologia(
                    [("lan1", "switch", 8, 50, "192.168.1.0/24"), ("r1", "router", 32, 50, "R1"), ("r2", "router", 68, 50, "R2"), ("lan2", "switch", 92, 50, "192.168.2.0/24"), ("isp", "nuvem", 32, 10, "ISP 203.0.113.1")],
                    [("lan1", "r1"), ("r1", "r2", "10.0.12.0/30"), ("r2", "lan2"), ("r1", "isp")],
                    "R1 (.1) e R2 (.2) na ligação 10.0.12.0/30."),
                cli("Rotas estáticas", [
                    ("R1(config)#", "ip route 192.168.2.0 255.255.255.0 10.0.12.2", "Next hop: chegar à LAN2 via R2."),
                    ("R2(config)#", "ip route 192.168.1.0 255.255.255.0 g0/1", "Interface de saída (bom em ligações ponto a ponto)."),
                    ("R2(config)#", "ip route 192.168.1.0 255.255.255.0 g0/1 10.0.12.1", "Totalmente especificada: interface + next hop."),
                    ("R1(config)#", "ip route 0.0.0.0 0.0.0.0 203.0.113.1", "Rota por defeito (gateway of last resort)."),
                    ("R1(config)#", "ip route 10.9.9.9 255.255.255.255 10.0.12.2", "Rota de host /32."),
                    ("R1(config)#", "ip route 192.168.2.0 255.255.255.0 10.0.13.3 5", "Rota flutuante: AD 5, só entra se a principal falhar."),
                    ("R1(config)#", "ipv6 route 2001:db8:2::/64 2001:db8:12::2", "Estática IPv6."),
                    ("R1(config)#", "ipv6 route ::/0 g0/2 fe80::1", "Por defeito IPv6 com next hop link-local (obriga a indicar a interface)."),
                    ("R1#", "show ip route static", "Só as estáticas."),
                ]),
                alerta("Não esqueça o <b>caminho de volta</b>! Configurar só R1 → LAN2 faz o ping sair, mas a resposta não regressa se R2 não souber chegar à LAN1."),
                dica("Uma rota estática com next hop só entra na tabela se o next hop for alcançável. Com interface de saída, entra se a interface estiver up."),
                sim_real(
                    ["Topologias pequenas: rotas estáticas são perfeitas para treinar.",
                     "Pode usar só interface de saída em Ethernet sem problemas visíveis."],
                    ["Rota estática só com interface de saída em Ethernet obriga o router a fazer ARP para cada destino (proxy ARP) — use next hop.",
                     "Em produção, as estáticas servem para rotas por defeito, filiais pequenas e rotas flutuantes de reserva (ex.: 4G).",
                     "Combine rotas flutuantes com IP SLA para detetar falhas além da própria ligação."]),
                video("Rotas estáticas Cisco", "rota estática Cisco configuração flutuante default route"),
            ],
            [
                cmd("Escreva a rota por defeito via 203.0.113.1.", ["ip route 0.0.0.0 0.0.0.0 203.0.113.1"], "ip route 0.0.0.0 0.0.0.0 203.0.113.1."),
                mc("O que é uma rota estática flutuante?", ["Rota com AD maior que a principal, usada como reserva", "Rota sem máscara", "Rota aprendida por OSPF", "Rota /32"], 0, "Fica escondida até a principal desaparecer."),
                vf("Uma rota estática IPv6 com next hop link-local precisa da interface de saída.", True, "Link-locals repetem-se em várias ligações."),
                mc("Qual a AD por defeito de uma rota estática?", ["0", "1", "5", "110"], 1, "1."),
            ],
            ["odom2", "netacad_srwe", "rfc4632"],
            nivel="intermédio",
        ),

        licao(
            "m6l3", "OSPFv2 de área única", 28,
            ["Explicar vizinhança, LSDB e SPF",
             "Configurar OSPF por network e por interface",
             "Eleger DR/BDR e escolher o router ID"],
            [
                texto("Como o OSPF trabalha", """
<p>O <b>OSPF</b> é um protocolo de <b>estado de ligação</b>. Cada router:</p>
<ol>
<li>Descobre vizinhos com <b>Hello</b> (multicast 224.0.0.5, a cada 10 s em Ethernet; dead 40 s).</li>
<li>Troca <b>LSAs</b> e constrói a mesma base de dados (<b>LSDB</b>) que os vizinhos da área.</li>
<li>Corre o algoritmo <b>SPF (Dijkstra)</b> e calcula o melhor caminho para cada rede.</li>
</ol>
<p>Métrica = <b>custo</b> = largura de banda de referência ÷ largura de banda da interface (referência padrão 100 Mbit/s → FastEthernet = 1, e GigabitEthernet também = 1!).</p>"""),
                tabela(["Estado", "O que acontece"], [
                    ["Down", "Sem Hellos"], ["Init", "Recebeu Hello, mas o seu RID ainda não aparece nele"],
                    ["2-Way", "Vêem-se mutuamente (estado final entre DROthers)"], ["ExStart / Exchange", "Escolhem mestre e trocam resumos (DBD)"],
                    ["Loading", "Pedem LSAs em falta (LSR/LSU)"], ["Full", "LSDB sincronizada — adjacência completa"],
                ], "Estados de vizinhança"),
                texto("Para formar vizinhança têm de coincidir", """
<ul><li>Área, sub-rede e máscara</li><li>Temporizadores Hello e Dead</li><li>Autenticação</li><li>Tipo de stub da área</li><li>MTU (senão fica preso em ExStart)</li></ul>
<p>E têm de ter <b>router ID</b> diferentes. O RID é escolhido assim: 1) <code>router-id</code> manual; 2) maior IP de loopback ativa; 3) maior IP de interface física ativa.</p>"""),
                topologia(
                    [("r1", "router", 20, 25, "R1 RID 1.1.1.1"), ("r2", "router", 80, 25, "R2 RID 2.2.2.2"), ("r3", "router", 50, 85, "R3 RID 3.3.3.3")],
                    [("r1", "r2", "10.0.12.0/30"), ("r1", "r3", "10.0.13.0/30"), ("r2", "r3", "10.0.23.0/30")],
                    "Três routers na área 0."),
                cli("Configurar OSPF em R1", [
                    ("R1(config)#", "router ospf 1", "Process ID: só tem significado local."),
                    ("R1(config-router)#", "router-id 1.1.1.1", "Define o RID (boa prática)."),
                    ("R1(config-router)#", "network 10.0.12.0 0.0.0.3 area 0", "Ativa OSPF nas interfaces dentro desta rede (wildcard!)."),
                    ("R1(config-router)#", "network 10.0.13.0 0.0.0.3 area 0", ""),
                    ("R1(config-router)#", "network 192.168.1.0 0.0.0.255 area 0", ""),
                    ("R1(config-router)#", "passive-interface g0/0", "Anuncia a LAN mas não envia Hellos para os PCs."),
                    ("R1(config-router)#", "auto-cost reference-bandwidth 10000", "Referência 10 Gbit/s — faça igual em todos os routers."),
                    ("R1(config-router)#", "default-information originate", "Anuncia a rota por defeito aos vizinhos."),
                    ("R1(config)#", "interface g0/2", "Alternativa: ativar na interface."),
                    ("R1(config-if)#", "ip ospf 1 area 0", ""),
                    ("R1(config-if)#", "ip ospf cost 50", "Altera o custo manualmente."),
                    ("R1(config-if)#", "ip ospf network point-to-point", "Em ligações /30 entre 2 routers: sem eleição DR/BDR."),
                ]),
                exemplo("Wildcard mask = inverso da máscara", """
<p>255.255.255.0 → <b>0.0.0.255</b>. 255.255.255.252 → <b>0.0.0.3</b>. Regra: 255 − cada octeto da máscara. Um wildcard <code>0.0.0.0</code> com o IP da interface ativa exatamente essa interface.</p>"""),
                texto("DR e BDR", """
<p>Em redes multiacesso (Ethernet com vários routers) elege-se um <b>Designated Router</b> e um <b>Backup</b> para reduzir adjacências: todos ficam Full com o DR/BDR e 2-Way entre si. Ganha a maior <b>prioridade</b> de interface (padrão 1; 0 = nunca é DR), depois o maior RID. A eleição <b>não é preemptiva</b>.</p>"""),
                saida("show ip ospf neighbor", """
Neighbor ID     Pri   State           Dead Time   Address         Interface
2.2.2.2           0   FULL/  -        00:00:35    10.0.12.2       Gi0/0
3.3.3.3           1   FULL/DR         00:00:38    10.0.13.2       Gi0/1"""),
                cli("Verificar", [
                    ("R1#", "show ip ospf neighbor", "Vizinhos e estado."),
                    ("R1#", "show ip ospf interface brief", "Interfaces, área, custo, estado DR/BDR."),
                    ("R1#", "show ip protocols", "RID, redes anunciadas, passive interfaces."),
                    ("R1#", "show ip route ospf", "Rotas aprendidas (O)."),
                ]),
                sim_real(
                    ["O Packet Tracer suporta OSPF de área única e multiárea muito bem.",
                     "Mudar o router-id exige 'clear ip ospf process' tal como no real."],
                    ["Em produção, use sempre interfaces loopback e router-id manual.",
                     "MTU diferente entre fabricantes (ou túneis) deixa vizinhos presos em EXSTART/EXCHANGE.",
                     "Ative autenticação OSPF (MD5/SHA) para evitar routers intrusos.",
                     "Ajuste a reference-bandwidth em TODOS os routers, senão os custos ficam incoerentes."]),
                video("OSPF single area", "OSPF configuração single area CCNA DR BDR"),
            ],
            [
                mc("Qual o endereço multicast dos Hellos OSPF para todos os routers?", ["224.0.0.2", "224.0.0.5", "224.0.0.6", "224.0.0.10"], 1, "224.0.0.5 todos os OSPF; 224.0.0.6 DR/BDR."),
                mc("Qual o wildcard de 255.255.255.248?", ["0.0.0.7", "0.0.0.8", "0.0.0.248", "255.255.255.7"], 0, "255 − 248 = 7."),
                mc("Como é escolhido o router ID sem configuração manual?", ["Menor IP de interface", "Maior IP de loopback ativa", "MAC mais baixo", "Process ID"], 1, "Loopback mais alta; depois a maior interface física."),
                vf("O process ID do OSPF tem de coincidir entre vizinhos.", False, "Só tem significado local. A área sim tem de coincidir."),
                mc("Dois routers ficam presos em EXSTART. Causa mais provável?", ["Área diferente", "MTU diferente", "Process ID diferente", "Router ID igual a 0"], 1, "MTU diferente impede a troca de DBD."),
                cmd("Que comando impede o envio de Hellos para a LAN g0/0 mantendo a rede anunciada (dentro de router ospf)?", ["passive-interface g0/0", "passive-interface gigabitethernet0/0"], "passive-interface g0/0."),
            ],
            ["rfc2328", "odom2", "netacad_ensa"],
            nivel="avançado",
        ),

        licao(
            "m6l4", "Redundância de gateway (FHRP: HSRP)", 15,
            ["Explicar o problema do gateway único",
             "Configurar HSRP com prioridade e preempção",
             "Comparar HSRP, VRRP e GLBP"],
            [
                texto("O problema", """
<p>Os PCs só conhecem <b>um</b> gateway. Se esse router falhar, perdem acesso a outras redes mesmo havendo um segundo router. Os <b>FHRP</b> criam um <b>IP virtual</b> (e MAC virtual) partilhado por dois ou mais routers: um está <b>ativo</b>, o outro em <b>standby</b> assume em segundos.</p>"""),
                topologia(
                    [("r1", "router", 25, 20, "R1 .2 Active"), ("r2", "router", 75, 20, "R2 .3 Standby"), ("sw", "switch", 50, 55, "SW"), ("pc", "pc", 50, 90, "PC gw 192.168.1.1")],
                    [("r1", "sw"), ("r2", "sw"), ("sw", "pc")],
                    "O PC usa o IP virtual 192.168.1.1."),
                cli("HSRPv2", [
                    ("R1(config)#", "interface g0/0", ""),
                    ("R1(config-if)#", "ip address 192.168.1.2 255.255.255.0", ""),
                    ("R1(config-if)#", "standby version 2", ""),
                    ("R1(config-if)#", "standby 1 ip 192.168.1.1", "IP virtual do grupo 1."),
                    ("R1(config-if)#", "standby 1 priority 110", "Maior prioridade (padrão 100) → Active."),
                    ("R1(config-if)#", "standby 1 preempt", "Recupera o papel de Active quando volta."),
                    ("R2(config-if)#", "standby 1 ip 192.168.1.1", "Em R2 (IP .3), prioridade padrão 100."),
                    ("R1#", "show standby brief", "Estado Active/Standby, IP virtual."),
                ]),
                tabela(["", "HSRP", "VRRP", "GLBP"], [
                    ["Dono", "Cisco", "Norma aberta (RFC 5798)", "Cisco"],
                    ["Papéis", "Active / Standby", "Master / Backup", "AVG / AVF"],
                    ["Balanceamento", "Por grupo/VLAN", "Por grupo/VLAN", "Sim, no mesmo grupo"],
                    ["MAC virtual", "0000.0c07.acXX (v1) / 0000.0c9f.fXXX (v2)", "0000.5e00.01XX", "0007.b400.XXYY"],
                    ["Preempção", "Desligada por defeito", "Ligada por defeito", "Desligada (AVG)"],
                ]),
                dica("Para balancear com HSRP use dois grupos: R1 Active na VLAN 10 e R2 Active na VLAN 20."),
                video("HSRP", "HSRP configuração Cisco CCNA FHRP"),
            ],
            [
                mc("Qual a prioridade HSRP por defeito?", ["0", "50", "100", "255"], 2, "100."),
                mc("Qual FHRP é uma norma aberta?", ["HSRP", "GLBP", "VRRP", "CDP"], 2, "VRRP — RFC 5798."),
                vf("Sem 'preempt', um router HSRP com maior prioridade que arranca depois não toma o papel de Active.", True, "A preempção está desligada por defeito no HSRP."),
                mc("O que configuram os PCs como gateway?", ["IP real do router Active", "IP virtual do grupo", "IP do switch", "Nada"], 1, "Sempre o IP virtual."),
            ],
            ["rfc2281", "rfc5798", "odom2"],
            nivel="intermédio",
        ),
    ],
    prova_extra=[
        mc("Um router aprende 10.10.0.0/16 por OSPF e por RIP. Qual entra na tabela?", ["RIP, menor métrica", "OSPF, menor AD", "Ambas", "A mais recente"], 1, "Mesmo prefixo: AD 110 vence 120."),
        mc("GigabitEthernet e FastEthernet com reference-bandwidth padrão têm custo OSPF…", ["1 e 1", "1 e 10", "4 e 19", "10 e 100"], 0, "100/1000 e 100/100 → custo mínimo 1 para ambas."),
        cmd("Escreva a rota estática para 10.5.0.0/16 via 172.16.1.2 com AD 200.", ["ip route 10.5.0.0 255.255.0.0 172.16.1.2 200"], "ip route 10.5.0.0 255.255.0.0 172.16.1.2 200."),
        vf("Entre dois routers DROther numa rede Ethernet a vizinhança fica em 2-WAY.", True, "Só formam Full com o DR e o BDR."),
    ],
)
