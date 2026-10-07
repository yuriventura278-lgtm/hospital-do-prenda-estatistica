from .base import *

MODULO = modulo(
    id="m5", numero=5, icone="switch",
    titulo="Acesso à Rede: Switching e Wi-Fi",
    descricao="Como os switches aprendem, VLANs, trunks, encaminhamento entre VLANs, Spanning Tree, EtherChannel e redes sem fios.",
    dominio="2.0 Network Access",
    licoes=[
        licao(
            "m5l1", "Como um switch funciona", 12,
            ["Descrever aprendizagem, encaminhamento, inundação e filtragem",
             "Distinguir domínio de colisão e de broadcast"],
            [
                texto("As quatro ações do switch", """
<ol>
<li><b>Aprender</b>: lê o MAC de <i>origem</i> de cada trama e regista “este MAC está na porta X” (envelhece após 300 s sem tráfego).</li>
<li><b>Encaminhar</b>: se conhece o MAC de <i>destino</i>, envia só para essa porta.</li>
<li><b>Inundar (flood)</b>: destino desconhecido, broadcast ou multicast → envia por todas as portas da VLAN, menos a de entrada.</li>
<li><b>Filtrar</b>: se o destino está na mesma porta de entrada, descarta.</li>
</ol>"""),
                topologia(
                    [("a", "pc", 10, 20, "PC A Fa0/1"), ("b", "pc", 10, 80, "PC B Fa0/2"), ("sw", "switch", 50, 50, "SW1"), ("c", "pc", 90, 20, "PC C Fa0/3"), ("d", "pc", 90, 80, "PC D Fa0/4")],
                    [("a", "sw"), ("b", "sw"), ("sw", "c"), ("sw", "d")],
                    "Cada porta do switch é um domínio de colisão; todas juntas (na mesma VLAN) são um domínio de broadcast."),
                tabela(["Equipamento", "Domínios de colisão", "Domínios de broadcast"], [
                    ["Hub", "1 para todas as portas", "1"], ["Switch (1 VLAN)", "1 por porta", "1"], ["Router", "1 por interface", "1 por interface"],
                ]),
                saida("show mac address-table", """
SW1#show mac address-table
          Mac Address Table
-------------------------------------------
Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
   1    0050.7966.6800    DYNAMIC     Fa0/1
   1    0050.7966.6801    DYNAMIC     Fa0/2
  10    00d0.ba8e.7a01    STATIC      Fa0/3"""),
                texto("Métodos de comutação", """
<ul>
<li><b>Store-and-forward</b>: recebe a trama inteira e verifica o FCS. Padrão na maioria dos switches Cisco.</li>
<li><b>Cut-through</b>: começa a enviar logo que lê o MAC de destino. Menor latência, mas propaga tramas com erros.</li>
</ul>"""),
                video("Como funciona um switch", "como funciona switch tabela MAC CCNA"),
            ],
            [
                mc("O switch aprende endereços a partir do…", ["MAC de destino", "MAC de origem", "IP de origem", "FCS"], 1, "Lê sempre o MAC de origem."),
                mc("O que faz o switch com uma trama para um MAC desconhecido?", ["Descarta", "Inunda pela VLAN", "Envia ao router", "Responde com ARP"], 1, "Unknown unicast flooding."),
                mc("Quantos domínios de broadcast tem um switch de 24 portas, todas na VLAN 1?", ["1", "2", "24", "48"], 0, "Uma VLAN = um domínio de broadcast."),
                vf("O tempo padrão de envelhecimento da tabela MAC nos switches Cisco é 300 segundos.", True, "5 minutos."),
            ],
            ["ieee8021d", "odom1", "netacad_srwe"],
        ),

        licao(
            "m5l2", "VLANs e trunks 802.1Q", 22,
            ["Criar VLANs e atribuir portas de acesso",
             "Configurar trunks 802.1Q e a VLAN nativa",
             "Conhecer DTP e VTP e porque se desligam"],
            [
                texto("O que é uma VLAN", """
<p>Uma <b>VLAN</b> divide um switch físico em várias redes lógicas. Cada VLAN é um <b>domínio de broadcast</b> separado e, normalmente, uma <b>sub-rede IP</b> própria. Vantagens: segurança, menos broadcast e organização por função (Vendas, TI, Voz, Convidados) em vez de por localização.</p>"""),
                topologia(
                    [("sw1", "switch", 25, 50, "SW1"), ("sw2", "switch", 75, 50, "SW2"),
                     ("v1", "pc", 8, 15, "Vendas V10"), ("t1", "pc", 8, 85, "TI V20"),
                     ("v2", "pc", 92, 15, "Vendas V10"), ("t2", "pc", 92, 85, "TI V20")],
                    [("v1", "sw1", "access"), ("t1", "sw1", "access"), ("sw1", "sw2", "trunk 802.1Q"), ("sw2", "v2", "access"), ("sw2", "t2", "access")],
                    "O trunk transporta várias VLANs no mesmo cabo, marcando cada trama com a etiqueta (tag) da VLAN."),
                cli("Criar VLANs e portas de acesso", [
                    ("SW1(config)#", "vlan 10", "Cria a VLAN 10."),
                    ("SW1(config-vlan)#", "name VENDAS", ""),
                    ("SW1(config-vlan)#", "vlan 20", ""),
                    ("SW1(config-vlan)#", "name TI", ""),
                    ("SW1(config-vlan)#", "exit", ""),
                    ("SW1(config)#", "interface range fa0/1 - 10", "Configura várias portas de uma vez."),
                    ("SW1(config-if-range)#", "switchport mode access", "Porta de acesso (uma VLAN, sem tag)."),
                    ("SW1(config-if-range)#", "switchport access vlan 10", ""),
                    ("SW1(config-if-range)#", "interface fa0/11", ""),
                    ("SW1(config-if)#", "switchport mode access", ""),
                    ("SW1(config-if)#", "switchport access vlan 20", ""),
                    ("SW1(config-if)#", "switchport voice vlan 150", "Telefone IP marca a voz na VLAN 150; o PC atrás dele fica na VLAN de dados."),
                    ("SW1#", "show vlan brief", "Confirma VLANs e portas."),
                ]),
                figura("trama_ethernet", "No trunk, o 802.1Q insere uma etiqueta de 4 bytes (TPID 0x8100 + PCP + VLAN ID de 12 bits) entre o MAC de origem e o campo Tipo."),
                cli("Configurar um trunk", [
                    ("SW1(config)#", "interface g0/1", ""),
                    ("SW1(config-if)#", "switchport trunk encapsulation dot1q", "Só em switches que também suportam ISL (ex.: 3560). Nos 2960 não existe."),
                    ("SW1(config-if)#", "switchport mode trunk", "Trunk fixo."),
                    ("SW1(config-if)#", "switchport trunk native vlan 99", "VLAN nativa (vai sem tag). Tem de coincidir nas duas pontas!"),
                    ("SW1(config-if)#", "switchport trunk allowed vlan 10,20,99", "Só deixa passar estas VLANs."),
                    ("SW1(config-if)#", "switchport nonegotiate", "Desliga o DTP."),
                    ("SW1#", "show interfaces trunk", "Estado, VLAN nativa e VLANs permitidas."),
                ]),
                tabela(["Modo DTP (SW1 \\ SW2)", "dynamic auto", "dynamic desirable", "trunk", "access"], [
                    ["dynamic auto", "access", "trunk", "trunk", "access"],
                    ["dynamic desirable", "trunk", "trunk", "trunk", "access"],
                    ["trunk", "trunk", "trunk", "trunk", "(erro)"],
                ], "Resultado da negociação DTP"),
                texto("VLANs especiais", """
<ul>
<li><b>VLAN 1</b>: por defeito todas as portas estão nela; não a use para utilizadores.</li>
<li><b>VLAN nativa</b>: tráfego sem tag no trunk (padrão VLAN 1). Mude para uma VLAN não usada (ataques de <i>VLAN hopping</i> com dupla etiqueta).</li>
<li><b>VLANs de intervalo normal</b>: 1–1005 (guardadas no vlan.dat). <b>Estendido</b>: 1006–4094.</li>
<li><b>VTP</b> (proprietário Cisco) propaga VLANs entre switches. Um switch com número de revisão maior pode apagar as VLANs de toda a rede — muitas empresas usam <code>vtp mode transparent</code> ou <code>off</code>.</li>
</ul>"""),
                sim_real(
                    ["No Packet Tracer o 2960 negocia trunk facilmente com DTP.",
                     "Mensagens de 'native VLAN mismatch' aparecem como no IOS real (via CDP)."],
                    ["Em produção, configure sempre trunks estáticos e <code>switchport nonegotiate</code>.",
                     "Num trunk com outro fabricante, o DTP não existe: configure trunk manualmente dos dois lados.",
                     "Ao adicionar uma VLAN a um trunk use <code>switchport trunk allowed vlan <b>add</b> 30</code> — sem 'add' substitui a lista e pode cortar a rede!"]),
                video("VLANs e trunks", "VLAN trunk 802.1Q configuração Cisco CCNA"),
            ],
            [
                cmd("Que comando atribui a porta à VLAN 10 (no modo interface)?", ["switchport access vlan 10"], "switchport access vlan 10."),
                mc("Quantos bits tem o VLAN ID na etiqueta 802.1Q?", ["8", "10", "12", "16"], 2, "12 bits → 4096 valores (0 e 4095 reservados)."),
                mc("Dois switches com 'dynamic auto' nas duas pontas formam…", ["Trunk", "Access", "EtherChannel", "Erro"], 1, "Ambos esperam que o outro peça: fica access."),
                vf("O tráfego da VLAN nativa atravessa o trunk sem etiqueta.", True, "Por isso tem de coincidir nos dois lados."),
                cmd("Que comando mostra as VLANs e as portas atribuídas?", ["show vlan brief", "sh vlan brief", "sh vlan br", "show vlan"], "show vlan brief."),
                mc("Para adicionar a VLAN 30 a um trunk sem remover as outras:", ["switchport trunk allowed vlan 30", "switchport trunk allowed vlan add 30", "vlan 30 trunk", "switchport access vlan 30"], 1, "O 'add' acrescenta à lista existente."),
            ],
            ["ieee8021q", "odom1", "netacad_srwe"],
            nivel="intermédio",
        ),

        licao(
            "m5l3", "Encaminhamento entre VLANs", 18,
            ["Configurar router-on-a-stick com subinterfaces",
             "Configurar SVIs num switch multicamada"],
            [
                texto("Porque é preciso", """
<p>VLANs diferentes são redes IP diferentes: para comunicarem precisam de um <b>router</b> ou de um <b>switch L3</b>. Existem três formas: um router com uma interface por VLAN (antiquado), <b>router-on-a-stick</b> e <b>SVIs em switch L3</b> (a mais usada nas empresas).</p>"""),
                topologia(
                    [("r1", "router", 50, 12, "R1"), ("sw", "switch", 50, 55, "SW1"), ("a", "pc", 20, 90, "PC VLAN10 192.168.10.10"), ("b", "pc", 80, 90, "PC VLAN20 192.168.20.10")],
                    [("r1", "sw", "trunk (g0/0.10 e .20)"), ("sw", "a"), ("sw", "b")],
                    "Router-on-a-stick: uma única ligação física em trunk com subinterfaces."),
                cli("Router-on-a-stick", [
                    ("R1(config)#", "interface g0/0", ""),
                    ("R1(config-if)#", "no shutdown", "Liga a interface física."),
                    ("R1(config-if)#", "interface g0/0.10", "Subinterface para a VLAN 10."),
                    ("R1(config-subif)#", "encapsulation dot1Q 10", "Associa à VLAN 10 (tem de vir antes do IP)."),
                    ("R1(config-subif)#", "ip address 192.168.10.1 255.255.255.0", "Gateway da VLAN 10."),
                    ("R1(config-subif)#", "interface g0/0.20", ""),
                    ("R1(config-subif)#", "encapsulation dot1Q 20", ""),
                    ("R1(config-subif)#", "ip address 192.168.20.1 255.255.255.0", ""),
                    ("R1(config-subif)#", "interface g0/0.99", ""),
                    ("R1(config-subif)#", "encapsulation dot1Q 99 native", "Se usar VLAN nativa no trunk."),
                    ("SW1(config-if)#", "switchport mode trunk", "Do lado do switch a porta é trunk."),
                ]),
                cli("SVIs num switch multicamada", [
                    ("DSW1(config)#", "ip routing", "Ativa o encaminhamento IP (desligado por defeito)."),
                    ("DSW1(config)#", "interface vlan 10", "Cria a SVI da VLAN 10."),
                    ("DSW1(config-if)#", "ip address 192.168.10.1 255.255.255.0", ""),
                    ("DSW1(config-if)#", "no shutdown", ""),
                    ("DSW1(config-if)#", "interface vlan 20", ""),
                    ("DSW1(config-if)#", "ip address 192.168.20.1 255.255.255.0", ""),
                    ("DSW1(config-if)#", "interface g1/0/24", ""),
                    ("DSW1(config-if)#", "no switchport", "Porta roteada (L3) para ligar ao router de Internet."),
                    ("DSW1(config-if)#", "ip address 10.0.0.2 255.255.255.252", ""),
                ], "Uma SVI só fica up/up se a VLAN existir e houver pelo menos uma porta ativa nessa VLAN (ou trunk que a transporte)."),
                tabela(["", "Router-on-a-stick", "Switch L3 (SVI)"], [
                    ["Custo", "Baixo (usa router existente)", "Maior"], ["Desempenho", "Limitado a 1 ligação", "Velocidade de hardware (ASIC)"],
                    ["Escala", "Poucas VLANs/tráfego", "Campus empresarial"], ["Ponto de falha", "Uma ligação", "Pode ter redundância (HSRP)"],
                ]),
                dica("Erro clássico: PC sem acesso a outras VLANs porque o <b>gateway</b> configurado no PC não é o IP da subinterface/SVI da sua VLAN."),
                video("Inter-VLAN routing", "inter VLAN routing router on a stick SVI configuração"),
            ],
            [
                cmd("Que comando associa uma subinterface à VLAN 30?", ["encapsulation dot1q 30", "encapsulation dot1Q 30"], "encapsulation dot1Q 30."),
                cmd("Que comando ativa o encaminhamento IP num switch multicamada?", ["ip routing"], "ip routing."),
                vf("Uma SVI pode ficar up/up mesmo sem nenhuma porta ativa na sua VLAN.", False, "Precisa de pelo menos uma porta ativa (access ou trunk) nessa VLAN."),
                mc("No router-on-a-stick, a porta do switch ligada ao router deve estar em modo…", ["access", "trunk", "routed", "voice"], 1, "Trunk, para levar todas as VLANs."),
                cmd("Que comando transforma uma porta de switch L3 numa porta roteada?", ["no switchport"], "no switchport."),
            ],
            ["odom1", "netacad_srwe", "lammle"],
            nivel="intermédio",
        ),

        licao(
            "m5l4", "Spanning Tree (STP e RSTP)", 25,
            ["Explicar porque os loops de camada 2 são graves",
             "Eleger root bridge, root ports e designated ports",
             "Configurar PortFast, BPDU Guard e prioridades"],
            [
                texto("O problema", """
<p>Ligações redundantes entre switches criam <b>loops</b>. Como as tramas Ethernet não têm TTL, um broadcast circula para sempre: <b>tempestade de broadcast</b>, tabelas MAC instáveis e tramas duplicadas. A rede para em segundos.</p>
<p>O <b>Spanning Tree Protocol</b> (802.1D) bloqueia logicamente algumas portas para formar uma árvore sem loops, mantendo a redundância disponível caso uma ligação falhe.</p>"""),
                figura("stp", "Três switches em triângulo: o STP elege a root bridge e bloqueia uma porta."),
                texto("O algoritmo em 3 passos", """
<ol>
<li><b>Eleger a root bridge</b>: menor <b>Bridge ID</b> = prioridade (padrão 32768 + VLAN ID, no PVST+) + MAC. Empate na prioridade → menor MAC ganha.</li>
<li><b>Root port</b> em cada switch não-root: a porta com menor <b>custo</b> até à root. Desempates: menor Bridge ID do vizinho, depois menor Port ID.</li>
<li><b>Designated port</b> em cada segmento: a do switch com menor custo até à root. As portas restantes ficam <b>bloqueadas</b> (alternate).</li>
</ol>"""),
                tabela(["Velocidade", "Custo STP (curto)"], [["10 Mbit/s", "100"], ["100 Mbit/s", "19"], ["1 Gbit/s", "4"], ["10 Gbit/s", "2"]], "Custos de porta (802.1D)"),
                tabela(["802.1D (STP)", "802.1w (RSTP)", "Função"], [
                    ["Blocking", "Discarding", "Não encaminha, só ouve BPDUs"],
                    ["Listening", "Discarding", "Participa na eleição (15 s)"],
                    ["Learning", "Learning", "Aprende MACs (15 s)"],
                    ["Forwarding", "Forwarding", "Encaminha"],
                    ["Disabled", "Discarding", "Desligada"],
                ], "Estados de porta"),
                texto("RSTP e variantes Cisco", """
<p>O <b>RSTP</b> (802.1w) converge em ~1–2 s em vez de 30–50 s, graças a handshakes (proposal/agreement) e às funções <i>alternate</i> (cópia de segurança da root port) e <i>backup</i>. A Cisco usa <b>PVST+</b> (uma instância por VLAN) e <b>Rapid PVST+</b>.</p>"""),
                cli("Controlar o STP", [
                    ("SW1(config)#", "spanning-tree mode rapid-pvst", "Ativa Rapid PVST+."),
                    ("SW1(config)#", "spanning-tree vlan 10 root primary", "Torna-se root da VLAN 10 (ajusta a prioridade para 24576 ou menos)."),
                    ("SW2(config)#", "spanning-tree vlan 10 priority 28672", "Alternativa: definir a prioridade (múltiplo de 4096)."),
                    ("SW1(config)#", "interface fa0/5", "Porta de um PC."),
                    ("SW1(config-if)#", "spanning-tree portfast", "Passa logo a forwarding (só em portas de host!)."),
                    ("SW1(config-if)#", "spanning-tree bpduguard enable", "Desliga a porta (err-disabled) se receber BPDU."),
                    ("SW1(config)#", "spanning-tree portfast default", "Ativa PortFast em todas as portas access."),
                    ("SW1#", "show spanning-tree vlan 10", "Root, custos, papéis e estados das portas."),
                ]),
                saida("show spanning-tree vlan 10 (resumido)", """
VLAN0010
  Spanning tree enabled protocol rstp
  Root ID    Priority    24586
             Address     0011.2233.4401
             This bridge is the root
Interface           Role Sts Cost      Prio.Nbr Type
------------------- ---- --- --------- -------- -----------
Gi0/1               Desg FWD 4         128.25   P2p
Gi0/2               Desg FWD 4         128.26   P2p
Fa0/5               Desg FWD 19        128.5    P2p Edge""", "Prioridade 24586 = 24576 + VLAN 10. 'Edge' indica PortFast."),
                sim_real(
                    ["No Packet Tracer as portas ficam âmbar durante a convergência, como na realidade.",
                     "Um loop no simulador apenas deixa o modo Simulation cheio de pacotes."],
                    ["Um loop real derruba a rede inteira em segundos: CPU a 100%, LEDs a piscar todos ao mesmo tempo.",
                     "Defina SEMPRE a root bridge manualmente (no núcleo/distribuição); não deixe que um switch velho com MAC baixo ganhe.",
                     "Use BPDU Guard em todas as portas de utilizador: evita que alguém ligue um switch doméstico e crie loops.",
                     "Para recuperar uma porta err-disabled: shutdown + no shutdown (ou errdisable recovery)."]),
                video("Spanning Tree explicado", "spanning tree protocol STP eleição root bridge CCNA"),
            ],
            [
                mc("Que switch se torna root bridge?", ["O de maior MAC", "O de menor Bridge ID", "O mais rápido", "O que tem mais portas"], 1, "Menor prioridade + MAC."),
                mc("Qual o custo STP de uma ligação de 1 Gbit/s?", ["19", "4", "2", "100"], 1, "1 Gbit/s = 4."),
                mc("Que funcionalidade desliga uma porta PortFast que recebe uma BPDU?", ["Root Guard", "BPDU Guard", "Loop Guard", "Port Security"], 1, "BPDU Guard põe a porta em err-disabled."),
                vf("A prioridade STP tem de ser um múltiplo de 4096.", True, "Os 12 bits baixos estão reservados ao ID estendido (VLAN)."),
                mc("Em quanto tempo converge normalmente o RSTP?", ["50 s", "30 s", "1–2 s", "5 min"], 2, "O RSTP converge em poucos segundos ou menos."),
                cmd("Que comando ativa PortFast numa interface?", ["spanning-tree portfast"], "spanning-tree portfast."),
            ],
            ["ieee8021d", "ieee8021w", "odom1", "netacad_srwe"],
            nivel="avançado",
        ),

        licao(
            "m5l5", "EtherChannel (LACP e PAgP)", 15,
            ["Agregar várias ligações físicas numa lógica",
             "Configurar LACP e verificar o resultado"],
            [
                texto("Para que serve", """
<p>Duas ligações de 1 Gbit/s entre switches: o STP bloquearia uma. Com <b>EtherChannel</b>, até 8 ligações físicas ativas tornam-se <b>uma única ligação lógica</b> (Port-channel): mais largura de banda, redundância e o STP vê apenas uma porta.</p>"""),
                topologia([("s1", "switch", 25, 50, "SW1"), ("s2", "switch", 75, 50, "SW2")], [("s1", "s2", "Po1 = Gi0/1 + Gi0/2")],
                          "Duas ligações físicas, uma lógica."),
                tabela(["Protocolo", "Modos", "Forma canal quando"], [
                    ["LACP (802.3ad / 802.1AX, aberto)", "active / passive", "active+active ou active+passive"],
                    ["PAgP (Cisco)", "desirable / auto", "desirable+desirable ou desirable+auto"],
                    ["Estático", "on", "on+on (sem negociação)"],
                ]),
                cli("Configurar LACP", [
                    ("SW1(config)#", "interface range g0/1 - 2", ""),
                    ("SW1(config-if-range)#", "channel-group 1 mode active", "LACP ativo; cria a interface Port-channel1."),
                    ("SW1(config-if-range)#", "interface port-channel 1", "Configurações lógicas vão aqui."),
                    ("SW1(config-if)#", "switchport mode trunk", ""),
                    ("SW1#", "show etherchannel summary", "Procure (SU) no port-channel e (P) nas portas."),
                ]),
                saida("show etherchannel summary", """
Flags:  D - down        P - bundled in port-channel
        S - Layer2      U - in use       s - suspended
Group  Port-channel  Protocol    Ports
------+-------------+-----------+-------------------------
1      Po1(SU)         LACP      Gi0/1(P)    Gi0/2(P)"""),
                alerta("Todas as portas do grupo têm de ter a mesma velocidade, duplex, modo (access/trunk), VLANs permitidas e VLAN nativa. Uma diferença deixa a porta em estado <b>(s) suspended</b>."),
                video("EtherChannel LACP", "EtherChannel LACP PAgP configuração Cisco"),
            ],
            [
                mc("Que combinação LACP NÃO forma EtherChannel?", ["active / active", "active / passive", "passive / passive", "Todas formam"], 2, "Dois passivos esperam um pelo outro."),
                mc("Qual o protocolo aberto de agregação?", ["PAgP", "LACP", "DTP", "VTP"], 1, "LACP — IEEE 802.3ad / 802.1AX."),
                cmd("Que comando mostra o estado dos EtherChannels?", ["show etherchannel summary", "sh etherchannel summary", "sh eth sum", "sh etherchannel sum"], "show etherchannel summary."),
                vf("Com EtherChannel o STP trata as ligações agregadas como uma só.", True, "Nenhuma das ligações do grupo é bloqueada."),
            ],
            ["ieee8021ax", "odom1", "netacad_srwe"],
            nivel="intermédio",
        ),

        licao(
            "m5l6", "Redes sem fios (WLAN)", 22,
            ["Conhecer as normas 802.11, bandas e canais",
             "Comparar AP autónomo, AP leve com WLC e cloud",
             "Configurar uma WLAN WPA2/WPA3 numa WLC"],
            [
                figura("ap", "Access point de teto: emite um ou mais SSIDs em 2,4, 5 e 6 GHz."),
                tabela(["Norma", "Nome Wi-Fi", "Banda", "Velocidade máx. teórica"], [
                    ["802.11b/g", "—", "2,4 GHz", "11 / 54 Mbit/s"], ["802.11n", "Wi-Fi 4", "2,4 e 5 GHz", "600 Mbit/s"],
                    ["802.11ac", "Wi-Fi 5", "5 GHz", "~6,9 Gbit/s"], ["802.11ax", "Wi-Fi 6 / 6E", "2,4, 5 (e 6) GHz", "~9,6 Gbit/s"],
                    ["802.11be", "Wi-Fi 7", "2,4, 5 e 6 GHz", "~46 Gbit/s"],
                ], "Normas Wi-Fi"),
                texto("Canais", """
<p>Em <b>2,4 GHz</b> só os canais <b>1, 6 e 11</b> não se sobrepõem: use-os em APs vizinhos. Em <b>5 GHz</b> há muitos mais canais e menos interferência, mas menor alcance.</p>
<p>Termos: <b>SSID</b> (nome da rede), <b>BSS</b> (um AP e os seus clientes), <b>BSSID</b> (MAC do rádio do AP), <b>ESS</b> (vários APs com o mesmo SSID, permitindo roaming).</p>"""),
                topologia(
                    [("wlc", "wlc", 50, 12, "WLC"), ("sw", "switch", 50, 48, "SW acesso"), ("ap1", "ap", 20, 85, "AP leve 1"), ("ap2", "ap", 80, 85, "AP leve 2")],
                    [("wlc", "sw", "trunk"), ("sw", "ap1", "access (gestão)"), ("sw", "ap2", "access (gestão)")],
                    "APs leves falam com a WLC por túneis CAPWAP (UDP 5246 controlo, 5247 dados)."),
                tabela(["Arquitetura", "Como funciona"], [
                    ["Autónoma", "Cada AP configurado individualmente; liga a portas trunk se tiver vários SSIDs"],
                    ["Leve + WLC (split-MAC)", "AP trata funções em tempo real; WLC gere o resto via CAPWAP. Porta do AP em modo access"],
                    ["Cloud (ex.: Meraki)", "Gestão por portal na cloud; dados ficam na rede local"],
                    ["FlexConnect", "AP numa filial comuta tráfego localmente mesmo se perder a WLC"],
                ], "Arquiteturas"),
                tabela(["Segurança", "Estado"], [
                    ["WEP", "Quebrado — nunca usar"], ["WPA (TKIP)", "Obsoleto"], ["WPA2 (AES-CCMP)", "Aceitável"],
                    ["WPA3 (SAE, GCMP)", "Recomendado"], ["Personal (PSK/SAE)", "Uma palavra-passe partilhada"], ["Enterprise (802.1X + RADIUS)", "Credenciais por utilizador"],
                ], "Segurança Wi-Fi"),
                cli("Criar uma WLAN numa WLC (interface web/GUI)", [
                    ("GUI", "WLANs › Create New › Go", "Tipo WLAN, nome do perfil e SSID (ex.: EMPRESA)."),
                    ("GUI", "General: Status = Enabled; Interface = vlan-dados", "Associa a WLAN a uma interface dinâmica (VLAN)."),
                    ("GUI", "Security › Layer 2: WPA2/WPA3 + AES", "Escolha PSK ou 802.1X."),
                    ("GUI", "Security › AAA Servers: servidor RADIUS", "Para WPA2/3-Enterprise."),
                    ("GUI", "QoS: Silver (best effort) / Platinum (voz)", ""),
                    ("GUI", "Apply", "Os APs começam a emitir o SSID."),
                ], "O exame CCNA mostra estes ecrãs da GUI da WLC (AireOS) — conheça os separadores General, Security, QoS e Advanced."),
                sim_real(
                    ["O Packet Tracer tem WLC-2504 e APs leves, mas a GUI é simplificada.",
                     "Não há interferência, paredes nem vizinhos no mesmo canal."],
                    ["Faça um site survey (mapa de calor) antes de instalar APs.",
                     "Paredes, metal, água e micro-ondas reduzem o sinal; 5 GHz atravessa menos paredes.",
                     "Use PoE (802.3af/at/bt) para alimentar APs pelo cabo de rede — confirme o orçamento de potência do switch.",
                     "Separe a rede de convidados numa VLAN própria com isolamento e portal cativo."]),
                video("Wireless para CCNA", "wireless LAN controller CAPWAP WPA3 CCNA aula"),
            ],
            [
                mc("Quais os canais de 2,4 GHz que não se sobrepõem?", ["1, 5, 9", "1, 6, 11", "2, 7, 12", "1, 7, 13"], 1, "1, 6 e 11."),
                mc("Que protocolo liga APs leves à WLC?", ["LWAPP antigo apenas", "CAPWAP", "CDP", "SNMP"], 1, "CAPWAP: UDP 5246 (controlo) e 5247 (dados)."),
                mc("Qual a opção de segurança mais forte?", ["WEP", "WPA-TKIP", "WPA2-AES", "WPA3-SAE"], 3, "WPA3 com SAE substitui o PSK."),
                vf("A porta do switch ligada a um AP leve (modo local) é normalmente access.", True, "O tráfego dos SSIDs vai no túnel CAPWAP até à WLC."),
                mc("Vários APs com o mesmo SSID formam um…", ["BSS", "IBSS", "ESS", "BSSID"], 2, "Extended Service Set — permite roaming."),
            ],
            ["ieee80211", "wifi_alliance", "odom1", "netacad_srwe"],
            nivel="intermédio",
        ),
    ],
    prova_extra=[
        mc("PCs na VLAN 10 de SW1 não falam com PCs na VLAN 10 de SW2. As VLANs existem nos dois. Verificação a fazer primeiro?",
           ["show interfaces trunk", "show ip route", "show cdp neighbors", "show version"], 0, "Confirme se o trunk está ativo e se a VLAN 10 é permitida."),
        mc("Que estado STP existe no 802.1D mas não no RSTP?", ["Forwarding", "Learning", "Listening", "Discarding"], 2, "RSTP junta blocking, listening e disabled em discarding."),
        vf("PAgP e LACP podem ser misturados no mesmo EtherChannel.", False, "As duas pontas têm de usar o mesmo protocolo."),
        mc("Root bridge da VLAN 1 tem prioridade 32769. Que prioridade configurada tem?", ["32769", "32768", "4096", "1"], 1, "32768 + ID da VLAN (1) = 32769."),
    ],
)
