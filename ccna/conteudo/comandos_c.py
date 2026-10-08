"""Comandos (parte C): VLAN e trunks, STP, EtherChannel, segurança de camada 2, tabela MAC e SPAN."""

from .comandos import K

V = "VLAN e trunks"
K(V, "vlan <vlan>", "vlan 10", "config vlan",
  "Cria a VLAN (se não existir) e entra no seu submodo (SW1(config-vlan)#).",
  "Cada VLAN é uma rede/domínio de broadcast separado no mesmo switch.",
  "SW1(config)# vlan 10\nSW1(config-vlan)# name VENDAS",
  "A VLAN tem de existir em todos os switches por onde passa. As VLANs ficam no ficheiro vlan.dat, não na startup-config.", "no vlan <vlan>", "name <nome>; switchport access vlan <vlan>; show vlan brief")
K(V, "name <nome>", "name", "vlan",
  "Dá um nome à VLAN (ex.: VENDAS, TI, NATIVA).", "Documenta a função de cada VLAN.",
  "SW1(config-vlan)# name VENDAS", "Sem espaços no nome.", "no name", "vlan <vlan>")
K(V, "no vlan <vlan>", "no vlan", "config",
  "Apaga a VLAN.", "Limpar VLANs que já não se usam.",
  "SW1(config)# no vlan 30", "As portas que estavam nessa VLAN ficam inativas (não passam para a VLAN 1) até as mudar.", "vlan <vlan>", "show vlan brief")
K(V, "switchport mode access", "sw mo acc", "if",
  "Põe a porta em modo de acesso: pertence a uma única VLAN e não negoceia trunk (DTP).",
  "Portas ligadas a PCs, impressoras e APs leves devem ser access — mais seguro e previsível.",
  "SW1(config-if)# switchport mode access", "", "no switchport mode", "switchport access vlan <vlan>; spanning-tree portfast")
K(V, "switchport access vlan <vlan>", "sw acc vlan", "if",
  "Coloca a porta de acesso na VLAN indicada.",
  "É assim que se decide a que rede pertence o equipamento ligado nessa porta.",
  "SW1(config-if)# switchport access vlan 10", "Se a VLAN não existir, o switch cria-a (avisa com uma mensagem).", "no switchport access vlan (volta à VLAN 1)", "switchport mode access; show vlan brief")
K(V, "switchport mode trunk", "sw mo tr", "if",
  "Põe a porta em modo trunk: transporta várias VLANs com etiquetas 802.1Q.",
  "Ligações entre switches e para o router-on-a-stick precisam de levar todas as VLANs.",
  "SW1(config-if)# switchport mode trunk", "Em switches que suportam ISL (ex.: 3560) é preciso antes switchport trunk encapsulation dot1q.", "switchport mode access", "switchport trunk allowed vlan <lista>; switchport trunk native vlan <vlan>; show interfaces trunk")
K(V, "switchport mode dynamic desirable|auto", "sw mo dyn des", "if",
  "Põe a porta a negociar trunk por DTP: desirable pede trunk ativamente; auto só aceita se o outro pedir.",
  "Existe por compatibilidade; em redes reais fixa-se access ou trunk.",
  "SW1(config-if)# switchport mode dynamic desirable", "auto + auto fica access. DTP ligado facilita ataques de VLAN hopping.", "switchport mode access", "switchport nonegotiate")
K(V, "switchport trunk encapsulation dot1q", "sw tr enc dot", "if",
  "Escolhe o encapsulamento 802.1Q para o trunk, em switches que também suportam ISL.",
  "Sem isto, esses switches recusam switchport mode trunk.",
  "SW1(config-if)# switchport trunk encapsulation dot1q", "Nos 2960 não existe (só fazem 802.1Q).", "", "switchport mode trunk")
K(V, "switchport trunk allowed vlan <lista...>", "sw tr all vlan", "if",
  "Define as VLANs que podem atravessar o trunk. Com add/remove acrescenta ou retira à lista existente.",
  "Segurança e eficiência: só passam as VLANs necessárias.",
  "SW1(config-if)# switchport trunk allowed vlan 10,20,99\nSW1(config-if)# switchport trunk allowed vlan add 30",
  "Sem add, o comando substitui a lista inteira — erro clássico que corta VLANs em produção.", "switchport trunk allowed vlan all", "show interfaces trunk")
K(V, "switchport trunk native vlan <vlan>", "sw tr nat vlan", "if",
  "Muda a VLAN nativa do trunk (a que passa sem etiqueta). Por defeito é a VLAN 1.",
  "Boa prática de segurança: usar uma VLAN nativa sem utilizadores (ex.: 99 ou 999).",
  "SW1(config-if)# switchport trunk native vlan 99", "Tem de ser igual nos dois lados (o CDP avisa “native VLAN mismatch”).", "no switchport trunk native vlan", "show interfaces trunk")
K(V, "switchport nonegotiate", "sw nonego", "if",
  "Desliga o DTP: a porta deixa de enviar mensagens de negociação de trunk.",
  "Evita que um atacante negoceie um trunk (VLAN hopping).",
  "SW1(config-if)# switchport nonegotiate", "Só funciona com a porta fixada em access ou trunk.", "no switchport nonegotiate", "switchport mode trunk")
K(V, "switchport voice vlan <vlan>", "sw voice vlan", "if",
  "Define a VLAN de voz numa porta de acesso: o telefone IP usa essa VLAN (com etiqueta) e o PC ligado atrás usa a de dados.",
  "Separa e prioriza a voz sem precisar de mais cabos.",
  "SW1(config-if)# switchport voice vlan 150", "", "no switchport voice vlan", "switchport access vlan <vlan>")
K(V, "switchport", "sw", "if",
  "Num switch multicamada, volta a pôr uma porta roteada em modo de camada 2.", "Desfaz o no switchport.",
  "DSW1(config-if)# switchport", "", "no switchport", "no switchport")
K(V, "no switchport", "no sw", "if",
  "Num switch multicamada, transforma a porta numa porta roteada (camada 3), que aceita ip address.",
  "Ligações ponto a ponto entre switches L3 e routers, sem STP nem VLANs.",
  "DSW1(config-if)# no switchport\nDSW1(config-if)# ip address 10.0.0.2 255.255.255.252", "Perde a configuração de VLAN da porta.", "switchport", "ip routing; ip address <ip> <mascara>")
K(V, "show vlan brief", "sh vlan br", "user priv",
  "Lista as VLANs (número, nome, estado) e as portas de acesso de cada uma.",
  "Confirma que a VLAN existe e que as portas estão nela.",
  "SW1# show vlan brief", "As portas trunk não aparecem aqui.", "", "show interfaces trunk; vlan <vlan>",
  "VLAN Name        Status    Ports\n1    default     active    Fa0/3, Fa0/4\n10   VENDAS      active    Fa0/1\n20   TI          active    Fa0/2")
K(V, "show vlan", "sh vlan", "user priv",
  "Versão longa do show vlan brief, com tipo e MTU de cada VLAN.", "Mais detalhe sobre as VLANs.",
  "SW1# show vlan", "", "", "show vlan brief")
K(V, "vtp mode <modo>", "vtp mode", "config",
  "Define o papel no VTP: server (cria VLANs e propaga), client (recebe) ou transparent (ignora e só reencaminha).",
  "O VTP propaga VLANs entre switches do mesmo domínio.",
  "SW1(config)# vtp mode transparent", "Um switch com número de revisão mais alto pode apagar as VLANs da rede inteira. Muitas empresas usam transparent ou off.", "", "vtp domain <nome>; show vtp status")
K(V, "vtp domain <nome>", "vtp dom", "config",
  "Define o domínio VTP do switch.", "Só switches do mesmo domínio trocam VLANs.",
  "SW1(config)# vtp domain EMPRESA", "", "", "vtp mode <modo>")
K(V, "vtp password <senha>", "vtp pass", "config",
  "Define a palavra-passe VTP do domínio.", "Impede que um switch estranho altere as VLANs.",
  "SW1(config)# vtp password Vtp#2026", "", "no vtp password", "vtp domain <nome>")
K(V, "vtp version <n>", "vtp ver", "config",
  "Escolhe a versão do VTP (1, 2 ou 3).", "A versão 3 tem proteções contra apagar VLANs por engano.",
  "SW1(config)# vtp version 2", "", "", "vtp mode <modo>")
K(V, "show vtp status", "sh vtp st", "user priv",
  "Mostra o modo VTP, o domínio, a versão e o número de revisão.", "Verifique antes de ligar um switch novo à rede.",
  "SW1# show vtp status", "", "", "vtp mode <modo>")
K(V, "encapsulation dot1q <vlan> [native]", "encap dot1q", "if",
  "Numa subinterface de router, associa-a à VLAN indicada (802.1Q). Com native, é a VLAN nativa (sem etiqueta).",
  "Base do router-on-a-stick: uma subinterface por VLAN, cada uma com o gateway da sua rede.",
  "R1(config)# interface g0/0.10\nR1(config-subif)# encapsulation dot1Q 10\nR1(config-subif)# ip address 192.168.10.1 255.255.255.0",
  "Tem de vir antes do ip address. A porta do switch ligada ao router tem de ser trunk.", "no encapsulation dot1q", "interface <interface>; switchport mode trunk")
K(V, "ip routing", "ip routing", "config",
  "Liga o encaminhamento IPv4 num switch multicamada (vem desligado).",
  "Sem ele as SVIs têm IP mas o switch não encaminha entre VLANs.",
  "DSW1(config)# ip routing", "", "no ip routing", "interface vlan <vlan>; no switchport")

T = "STP e EtherChannel"
K(T, "spanning-tree mode <modo>", "span mode rapid", "config",
  "Escolhe a variante do STP: pvst (802.1D por VLAN), rapid-pvst (RSTP por VLAN) ou mst.",
  "O Rapid PVST+ converge em 1–2 s em vez de 30–50 s.",
  "SW1(config)# spanning-tree mode rapid-pvst", "", "spanning-tree mode pvst", "show spanning-tree")
K(T, "spanning-tree vlan <vlan> root primary", "span vlan 10 root pri", "config",
  "Baixa a prioridade do switch o suficiente para ser a root bridge dessa VLAN (normalmente 24576 ou menos).",
  "A root deve ser um switch central e potente, não um qualquer escolhido pelo MAC mais baixo.",
  "SW1(config)# spanning-tree vlan 10 root primary", "É calculado uma vez; se aparecer um switch com prioridade menor, perde.", "no spanning-tree vlan <vlan> root", "spanning-tree vlan <vlan> priority <n>; show spanning-tree")
K(T, "spanning-tree vlan <vlan> root secondary", "span vlan 10 root sec", "config",
  "Põe a prioridade em 28672, para ser a root de reserva.", "Se a root principal falhar, a escolha é previsível.",
  "SW2(config)# spanning-tree vlan 10 root secondary", "", "no spanning-tree vlan <vlan> root", "spanning-tree vlan <vlan> root primary")
K(T, "spanning-tree vlan <vlan> priority <n>", "span vlan 10 pri", "config",
  "Define a prioridade STP do switch nessa VLAN (0–61440, em múltiplos de 4096). Menor = mais hipóteses de ser root.",
  "Controlo exato de quem é root e root de reserva.",
  "SW2(config)# spanning-tree vlan 10 priority 28672", "Valores que não são múltiplos de 4096 são recusados.", "no spanning-tree vlan <vlan> priority", "show spanning-tree vlan <vlan>")
K(T, "spanning-tree portfast", "span portf", "if",
  "A porta de acesso passa logo a forwarding, sem esperar listening/learning (30 s).",
  "PCs ganham rede de imediato (e o DHCP não falha no arranque).",
  "SW1(config-if)# spanning-tree portfast", "Só em portas ligadas a PCs/servidores; numa porta entre switches pode criar loops. Combine com BPDU Guard.", "no spanning-tree portfast", "spanning-tree bpduguard enable; spanning-tree portfast default")
K(T, "spanning-tree portfast default", "span portf def", "config",
  "Ativa o PortFast em todas as portas de acesso do switch.", "Poupa configurar porta a porta.",
  "SW1(config)# spanning-tree portfast default", "Não afeta trunks.", "no spanning-tree portfast default", "spanning-tree portfast bpduguard default")
K(T, "spanning-tree bpduguard enable", "span bpdug en", "if",
  "Se a porta receber uma BPDU (sinal de que alguém ligou um switch), vai para err-disabled.",
  "Protege contra loops e contra switches não autorizados ligados em portas de utilizadores.",
  "SW1(config-if)# spanning-tree bpduguard enable", "A porta só volta com shutdown/no shutdown ou errdisable recovery.", "no spanning-tree bpduguard", "spanning-tree portfast; errdisable recovery cause <causa>")
K(T, "spanning-tree portfast bpduguard default", "span portf bpdug def", "config",
  "Ativa o BPDU Guard em todas as portas com PortFast.", "Proteção global, com um só comando.",
  "SW1(config)# spanning-tree portfast bpduguard default", "", "no spanning-tree portfast bpduguard default", "spanning-tree bpduguard enable")
K(T, "spanning-tree guard root", "span guard root", "if",
  "Root Guard: a porta nunca pode levar a um switch root; se receber BPDUs superiores, fica em root-inconsistent.",
  "Protege a escolha da root contra switches ligados nas pontas.",
  "SW1(config-if)# spanning-tree guard root", "", "no spanning-tree guard", "spanning-tree vlan <vlan> root primary")
K(T, "spanning-tree cost <custo>", "span cost", "if",
  "Altera o custo STP da porta.", "Influencia que porta fica root port ou bloqueada.",
  "SW1(config-if)# spanning-tree cost 10", "", "no spanning-tree cost", "show spanning-tree")
K(T, "spanning-tree port-priority <n>", "span port-pri", "if",
  "Altera a prioridade da porta (0–240, múltiplos de 16) no desempate do STP.", "Escolher que ligação fica ativa entre duas iguais.",
  "SW1(config-if)# spanning-tree port-priority 64", "", "no spanning-tree port-priority", "spanning-tree cost <custo>")
K(T, "spanning-tree link-type point-to-point", "span link p", "if",
  "Indica ao RSTP que a ligação é ponto a ponto (full-duplex entre dois switches), permitindo transição rápida.", "Acelera a convergência do RSTP.",
  "SW1(config-if)# spanning-tree link-type point-to-point", "", "no spanning-tree link-type", "spanning-tree mode <modo>")
K(T, "show spanning-tree [vlan] [<vlan>]", "sh span", "user priv",
  "Mostra o STP: root bridge, prioridade e MAC, e o papel (Root/Desg/Altn) e estado (FWD/BLK) de cada porta.",
  "Perceber que porta está bloqueada e porquê.",
  "SW1# show spanning-tree vlan 10", "", "", "spanning-tree vlan <vlan> root primary",
  "VLAN0010\n  Root ID    Priority    24586\n             This bridge is the root\nInterface   Role Sts Cost  Prio.Nbr Type\nGi0/1       Desg FWD 4     128.25   P2p")
K(T, "channel-group <n> mode <modo>", "channel-g 1 mo act", "if",
  "Junta a interface ao EtherChannel n. Modos: active/passive (LACP), desirable/auto (PAgP) ou on (sem negociação).",
  "Soma a largura de banda de várias ligações e dá redundância, sem o STP bloquear nenhuma.",
  "SW1(config)# interface range g0/1 - 2\nSW1(config-if-range)# channel-group 1 mode active",
  "As portas têm de ter a mesma velocidade, duplex e configuração de VLAN. passive+passive e auto+auto não formam canal.", "no channel-group", "interface port-channel <n>; show etherchannel summary")
K(T, "channel-protocol lacp|pagp", "channel-p lacp", "if",
  "Fixa o protocolo de negociação do EtherChannel.", "Evita misturas de protocolos.",
  "SW1(config-if)# channel-protocol lacp", "", "no channel-protocol", "channel-group <n> mode <modo>")
K(T, "port-channel load-balance <metodo>", "port-ch load", "config",
  "Escolhe como o tráfego é distribuído pelas ligações do EtherChannel (src-mac, dst-ip, src-dst-ip…).", "Distribuição mais equilibrada.",
  "SW1(config)# port-channel load-balance src-dst-ip", "", "", "show etherchannel summary")
K(T, "show etherchannel summary", "sh eth sum", "user priv",
  "Resumo dos EtherChannels: grupo, Port-channel, protocolo e estado das portas (P = agregada, I = individual, s = suspensa, D = em baixo).",
  "Confirma se o canal se formou.",
  "SW1# show etherchannel summary", "", "", "channel-group <n> mode <modo>",
  "Group  Port-channel  Protocol    Ports\n1      Po1(SU)         LACP      Gi0/1(P)    Gi0/2(P)")
K(T, "udld enable", "udld en", "config",
  "Ativa o UDLD, que deteta ligações de fibra unidirecionais (só um sentido funciona).", "Evita loops causados por fibras meio avariadas.",
  "SW1(config)# udld enable", "", "no udld enable", "")

L2 = "Segurança de camada 2"
K(L2, "switchport port-security", "sw port-sec", "if",
  "Ativa o port security na porta: limita os MAC que podem usar a porta (por defeito 1) e reage a violações.",
  "Impede que alguém ligue um equipamento não autorizado à tomada.",
  "SW1(config-if)# switchport mode access\nSW1(config-if)# switchport port-security", "Só funciona em portas access (ou trunk configurado). Por defeito a violação põe a porta em err-disabled.", "no switchport port-security", "switchport port-security maximum <n>; switchport port-security violation <modo>; show port-security interface <interface>")
K(L2, "switchport port-security maximum <n>", "sw port-sec max", "if",
  "Define quantos MAC diferentes podem usar a porta.", "Ex.: 2 para um telefone IP com um PC atrás.",
  "SW1(config-if)# switchport port-security maximum 2", "", "no switchport port-security maximum", "switchport port-security")
K(L2, "switchport port-security mac-address sticky", "sw port-sec mac sti", "if",
  "O switch aprende os MAC ligados e grava-os na running-config como seguros.",
  "Configura o port security sem escrever os MAC à mão.",
  "SW1(config-if)# switchport port-security mac-address sticky", "Guarde a configuração (copy run start) para os MAC aprendidos sobreviverem a um reinício.", "no switchport port-security mac-address sticky", "switchport port-security")
K(L2, "switchport port-security mac-address <mac>", "sw port-sec mac", "if",
  "Define à mão um MAC autorizado na porta.", "Controlo exato de que equipamento pode ligar-se.",
  "SW1(config-if)# switchport port-security mac-address 0050.7966.6800", "", "no switchport port-security mac-address <mac>", "switchport port-security mac-address sticky")
K(L2, "switchport port-security violation <modo>", "sw port-sec viol", "if",
  "Define a reação a um MAC não autorizado: shutdown (err-disabled, por defeito), restrict (descarta e regista) ou protect (descarta em silêncio).",
  "Escolhe entre segurança máxima e continuidade do serviço.",
  "SW1(config-if)# switchport port-security violation restrict", "Com protect não há qualquer alerta.", "no switchport port-security violation", "show port-security interface <interface>")
K(L2, "switchport port-security aging <opcoes...>", "sw port-sec ag", "if",
  "Define quanto tempo os MAC seguros dinâmicos ficam registados.", "Permite trocar de equipamento sem intervenção.",
  "SW1(config-if)# switchport port-security aging time 60", "", "no switchport port-security aging", "switchport port-security")
K(L2, "show port-security interface <interface>", "sh port-sec int", "priv",
  "Mostra o estado do port security da porta: ativo, modo de violação, máximo, MAC aprendidos e contador de violações.",
  "Perceber porque é que uma porta foi para err-disabled.",
  "SW1# show port-security interface fa0/5", "", "", "switchport port-security",
  "Port Security              : Enabled\nPort Status                : Secure-up\nViolation Mode             : Shutdown\nMaximum MAC Addresses      : 2\nSecurity Violation Count   : 0")
K(L2, "errdisable recovery cause <causa>", "errd rec cause", "config",
  "Faz o switch reativar sozinho as portas em err-disabled por essa causa (ex.: psecure-violation, bpduguard).", "Evita deslocações para fazer shutdown/no shutdown.",
  "SW1(config)# errdisable recovery cause psecure-violation", "Se a causa persistir, a porta volta a cair.", "no errdisable recovery cause <causa>", "errdisable recovery interval <segundos>")
K(L2, "errdisable recovery interval <segundos>", "errd rec int", "config",
  "Tempo até reativar portas em err-disabled (por defeito 300 s).", "Ajusta a recuperação automática.",
  "SW1(config)# errdisable recovery interval 120", "", "no errdisable recovery interval", "errdisable recovery cause <causa>")
K(L2, "ip dhcp snooping", "ip dhcp snoop", "config",
  "Liga o DHCP snooping globalmente. Todas as portas passam a untrusted: respostas DHCP só são aceites em portas trusted.",
  "Trava servidores DHCP falsos (por engano ou ataque) e cria a tabela de ligações usada pelo DAI.",
  "SW1(config)# ip dhcp snooping\nSW1(config)# ip dhcp snooping vlan 10,20", "Também é preciso indicar as VLANs e marcar as portas trusted.", "no ip dhcp snooping", "ip dhcp snooping vlan <lista>; ip dhcp snooping trust")
K(L2, "ip dhcp snooping vlan <lista...>", "ip dhcp snoop vlan", "config",
  "Ativa o DHCP snooping nas VLANs indicadas.", "Sem VLANs, o snooping fica ligado mas não protege nada.",
  "SW1(config)# ip dhcp snooping vlan 10,20", "", "no ip dhcp snooping vlan <lista>", "ip dhcp snooping")
K(L2, "ip dhcp snooping trust", "ip dhcp snoop tr", "if",
  "Marca a porta como trusted: por ela podem chegar respostas de servidor DHCP (Offer/Ack).",
  "Uplinks e a porta do servidor DHCP legítimo têm de ser trusted.",
  "SW1(config-if)# ip dhcp snooping trust", "Nunca marque portas de utilizadores como trusted.", "no ip dhcp snooping trust", "ip dhcp snooping")
K(L2, "ip dhcp snooping limit rate <pps>", "ip dhcp snoop lim", "if",
  "Limita os pacotes DHCP por segundo numa porta untrusted.", "Trava ataques de esgotamento do pool (DHCP starvation).",
  "SW1(config-if-range)# ip dhcp snooping limit rate 10", "Ultrapassar o limite põe a porta em err-disabled.", "no ip dhcp snooping limit rate", "ip dhcp snooping")
K(L2, "no ip dhcp snooping information option", "no ip dhcp snoop info opt", "config",
  "Deixa de inserir a opção 82 nos pedidos DHCP.", "Alguns servidores (ex.: router IOS) rejeitam pedidos com opção 82 vindos de portas não relay.",
  "SW1(config)# no ip dhcp snooping information option", "", "ip dhcp snooping information option", "ip dhcp snooping")
K(L2, "show ip dhcp snooping [binding]", "sh ip dhcp snoop", "priv",
  "Mostra o estado do DHCP snooping; com binding, a tabela MAC–IP–VLAN–porta aprendida.", "Confirma portas trusted e as ligações usadas pelo DAI.",
  "SW1# show ip dhcp snooping binding", "", "", "ip dhcp snooping")
K(L2, "ip arp inspection vlan <lista...>", "ip arp insp vlan", "config",
  "Ativa o DAI (Dynamic ARP Inspection) nas VLANs: cada ARP é comparado com a tabela do DHCP snooping.",
  "Trava ARP spoofing / man-in-the-middle.",
  "SW1(config)# ip arp inspection vlan 10,20", "Exige DHCP snooping ativo (ou ACLs ARP para IPs estáticos).", "no ip arp inspection vlan <lista>", "ip arp inspection trust; ip dhcp snooping")
K(L2, "ip arp inspection trust", "ip arp insp tr", "if",
  "Marca a porta como trusted para o DAI (não inspeciona ARP nela).", "Uplinks para outros switches/routers.",
  "SW1(config-if)# ip arp inspection trust", "", "no ip arp inspection trust", "ip arp inspection vlan <lista>")
K(L2, "storm-control <opcoes...>", "storm", "if",
  "Limita o tráfego broadcast/multicast/unicast desconhecido numa porta (ex.: storm-control broadcast level 20).", "Protege contra tempestades de broadcast.",
  "SW1(config-if)# storm-control broadcast level 20", "", "no storm-control <tipo>", "")
K(L2, "power inline <modo>", "power inl", "if",
  "Controla o PoE da porta: auto (fornece energia se o equipamento pedir) ou never.", "Desligar o PoE em portas que não precisam.",
  "SW1(config-if)# power inline never", "", "power inline auto", "")

M = "Tabela MAC e SPAN"
K(M, "show mac address-table [dynamic] [<opcoes...>]", "sh mac add", "user priv",
  "Mostra a tabela de endereços MAC do switch: VLAN, MAC, tipo (DYNAMIC/STATIC) e porta.",
  "Descobre em que porta está ligado um equipamento.",
  "SW1# show mac address-table dynamic interface g0/1", "Numa porta trunk/uplink aparecem muitos MAC (os dos outros switches).", "", "clear mac address-table dynamic; show ip arp",
  "Vlan    Mac Address       Type        Ports\n  10    0050.7966.6800    DYNAMIC     Fa0/1")
K(M, "show mac-address-table", "sh mac-add", "user priv",
  "Forma antiga (IOS mais velhos) de show mac address-table.", "Ainda aparece em equipamentos antigos.",
  "SW1# show mac-address-table", "", "", "show mac address-table [dynamic] [<opcoes...>]")
K(M, "clear mac address-table dynamic", "clear mac add dyn", "priv",
  "Apaga as entradas MAC dinâmicas; o switch volta a aprendê-las.", "Útil depois de mudar equipamentos de porta.",
  "SW1# clear mac address-table dynamic", "", "", "show mac address-table [dynamic] [<opcoes...>]")
K(M, "mac address-table aging-time <segundos>", "mac add ag", "config",
  "Muda o tempo de envelhecimento da tabela MAC (por defeito 300 s).", "Ajusta a rapidez com que o switch esquece MAC inativos.",
  "SW1(config)# mac address-table aging-time 600", "", "no mac address-table aging-time", "show mac address-table [dynamic] [<opcoes...>]")
K(M, "mac address-table static <opcoes...>", "mac add stat", "config",
  "Cria uma entrada MAC estática (MAC, VLAN, porta).", "Fixa um equipamento crítico a uma porta.",
  "SW1(config)# mac address-table static 0050.7966.6800 vlan 10 interface fa0/1", "", "no mac address-table static <...>", "")
K(M, "monitor session <n> source interface <interface...>", "mon sess 1 so int", "config",
  "SPAN: define a porta (ou VLAN) cujo tráfego vai ser copiado.", "Permite analisar com Wireshark o tráfego de outro equipamento.",
  "S1(config)# monitor session 1 source interface fa0/1", "", "no monitor session <n>", "monitor session <n> destination interface <interface>; show monitor")
K(M, "monitor session <n> destination interface <interface>", "mon sess 1 dest int", "config",
  "SPAN: define a porta onde está o PC com o Wireshark, que recebe a cópia do tráfego.", "Completa a sessão de espelhamento.",
  "S1(config)# monitor session 1 destination interface fa0/24", "A porta de destino deixa de funcionar como porta normal.", "no monitor session <n>", "show monitor")
K(M, "show monitor", "sh mon", "priv",
  "Mostra as sessões SPAN configuradas (origens e destino).", "Confirma o espelhamento.",
  "S1# show monitor", "", "", "monitor session <n> source interface <interface...>")
