"""Comandos (parte B): interfaces, verificação (show), diagnóstico, ficheiros e arranque."""

from .comandos import K

I = "Interfaces"
K(I, "interface <interface>", "int g0/0", "config if",
  "Entra na configuração de uma interface (R1(config-if)#). Aceita nomes completos ou abreviados: g0/0, fa0/1, s0/0/0, gigabitEthernet 0/0/1, loopback 0, port-channel 1.",
  "Tudo o que é específico de uma porta (IP, descrição, VLAN, ligar/desligar) configura-se aqui.",
  "R1(config)# interface g0/0\nR1(config-if)#", "Num router, com um ponto cria uma subinterface (g0/0.10).", "no interface <nome> (só para virtuais: loopback, subinterface, vlan)", "ip address <ip> <mascara>; no shutdown; description <texto>")
K(I, "interface range <intervalo...>", "int ra fa0/1 - 10", "config if",
  "Configura várias interfaces de uma vez (SW1(config-if-range)#). Ex.: interface range fa0/1 - 10 ou g0/1 - 2.",
  "Poupa tempo: a mesma VLAN ou o mesmo shutdown em 24 portas com um só comando.",
  "SW1(config)# interface range fa0/1 - 24\nSW1(config-if-range)#", "Deixe um espaço antes e depois do hífen.", "", "switchport access vlan <vlan>; shutdown")
K(I, "interface vlan <vlan>", "int vlan 1", "config if",
  "Cria/entra numa SVI — interface virtual de uma VLAN. Num switch L2 serve para o IP de gestão; num switch L3 é o gateway da VLAN.",
  "É assim que um switch ganha um IP.",
  "S1(config)# interface vlan 99\nS1(config-if)# ip address 192.168.99.11 255.255.255.0\nS1(config-if)# no shutdown",
  "A SVI só fica up/up se a VLAN existir e tiver uma porta ativa.", "no interface vlan <vlan>", "ip default-gateway <ip>; ip routing")
K(I, "interface port-channel <n>", "int po1", "config if",
  "Entra na interface lógica de um EtherChannel; o que aqui se configura aplica-se ao grupo.",
  "Configura trunk/VLANs do canal num único sítio.",
  "SW1(config)# interface port-channel 1", "", "no interface port-channel <n>", "channel-group <n> mode active; show etherchannel summary")
K(I, "ip address <ip> <mascara>", "ip add", "if",
  "Atribui um endereço IPv4 e a máscara à interface. O router cria logo as rotas C (rede) e L (/32).",
  "Sem IP a interface não comunica em camada 3; num router é normalmente o gateway da rede.",
  "R1(config-if)# ip address 192.168.1.1 255.255.255.0",
  "A máscara escreve-se em decimal com pontos, não /24. Não pode haver duas interfaces na mesma sub-rede.", "no ip address", "no shutdown; show ip interface brief")
K(I, "ip address dhcp", "ip add dhcp", "if",
  "A interface pede o endereço a um servidor DHCP (ex.: a interface virada para o operador).",
  "Ligações de Internet residenciais ou de operador costumam dar o IP por DHCP.",
  "R1(config-if)# ip address dhcp", "", "no ip address", "show ip interface brief")
K(I, "no ip address", "no ip add", "if",
  "Remove o endereço IP da interface.", "Necessário antes de usar a porta para outra função (ex.: só subinterfaces).",
  "R1(config-if)# no ip address", "", "ip address <ip> <mascara>", "ip address <ip> <mascara>")
K(I, "no shutdown", "no shut", "if",
  "Liga a interface (tira-a de “administratively down”).",
  "As interfaces dos routers vêm desligadas por defeito; sem no shutdown não passam tráfego.",
  "R1(config-if)# no shutdown\n%LINK-5-CHANGED: Interface GigabitEthernet0/0, changed state to up",
  "Se continuar down/down, o problema é físico (cabo, porta do outro lado).", "shutdown", "shutdown; show ip interface brief")
K(I, "shutdown", "shut", "if",
  "Desliga administrativamente a interface (fica “administratively down”).",
  "Boa prática: desligar as portas que não estão a ser usadas, para ninguém se ligar sem autorização.",
  "SW1(config-if-range)# shutdown", "Desligar a interface por onde está ligado por SSH corta o seu acesso.", "no shutdown", "no shutdown; switchport access vlan <vlan>")
K(I, "description <texto...>", "desc", "if",
  "Escreve uma descrição na interface (ex.: “Ligação ao R2” ou “PC receção”).",
  "Documenta a rede no próprio equipamento: quem vier depois sabe o que está ligado em cada porta.",
  "R1(config-if)# description LAN dos utilizadores", "", "no description", "show interfaces description")
K(I, "speed <velocidade>", "spe", "if",
  "Fixa a velocidade da porta (10, 100, 1000) ou deixa em auto.",
  "Às vezes é preciso fixar para equipamentos antigos.",
  "SW1(config-if)# speed 100", "Fixar de um lado e deixar auto no outro pode causar duplex mismatch.", "speed auto", "duplex <modo>")
K(I, "duplex <modo>", "dup", "if",
  "Fixa o duplex da porta: full, half ou auto.",
  "Os dois lados têm de concordar; um lado half e outro full causa late collisions e lentidão.",
  "SW1(config-if)# duplex full", "Configure igual nos dois lados ou deixe ambos em auto.", "duplex auto", "speed <velocidade>; show interfaces <interface>")
K(I, "mdix auto", "mdix", "if",
  "Liga o Auto-MDIX: a porta deteta se o cabo é direto ou cruzado e adapta-se.", "Evita problemas com o tipo de cabo.",
  "SW1(config-if)# mdix auto", "Exige speed e duplex em auto em alguns modelos.", "no mdix auto", "")
K(I, "bandwidth <kbps>", "band", "if",
  "Indica a largura de banda da interface em kbit/s, usada por protocolos como OSPF e EIGRP para calcular métricas.",
  "Não muda a velocidade real; só informa os protocolos.",
  "R1(config-if)# bandwidth 10000", "Não limita o tráfego (para isso usa-se QoS).", "no bandwidth", "ip ospf cost <custo>")
K(I, "delay <dezenas-de-microsegundos>", "del", "if",
  "Indica o atraso da interface, usado pela métrica do EIGRP.", "Permite influenciar a escolha de caminho no EIGRP.",
  "R1(config-if)# delay 100", "", "no delay", "bandwidth <kbps>")
K(I, "mtu <bytes>", "mtu", "if",
  "Muda o MTU (tamanho máximo da trama/pacote) da interface.", "Necessário em túneis ou redes com jumbo frames.",
  "R1(config-if)# mtu 1500", "MTU diferente nas pontas prende o OSPF em EXSTART.", "no mtu", "ip mtu <bytes>")
K(I, "ip mtu <bytes>", "ip mtu", "if",
  "Muda o tamanho máximo dos pacotes IP enviados pela interface.", "Usado em túneis (GRE, IPsec) para evitar fragmentação.",
  "R1(config-if)# ip mtu 1400", "", "no ip mtu", "mtu <bytes>")
K(I, "clock rate <bps>", "clock r", "if",
  "Na interface série do lado DCE, define a velocidade do relógio da ligação (ex.: 64000).",
  "Sem clock rate do lado DCE a ligação série não sobe.",
  "R1(config-if)# clock rate 64000", "Só no lado DCE (veja com show controllers).", "no clock rate", "encapsulation ppp|hdlc; show controllers <interface>")
K(I, "encapsulation ppp|hdlc", "encap ppp", "if",
  "Escolhe o protocolo de camada 2 de uma interface série: HDLC (por defeito na Cisco) ou PPP.",
  "Os dois lados têm de usar o mesmo; se não, a interface fica up/down.",
  "R1(config-if)# encapsulation ppp", "", "encapsulation hdlc", "ppp authentication chap|pap")
K(I, "ppp authentication chap|pap", "ppp auth chap", "if",
  "Ativa autenticação PPP numa série: CHAP (desafio com hash) ou PAP (palavra-passe em claro).",
  "Garante que se liga ao router certo.",
  "R1(config-if)# ppp authentication chap", "Use CHAP; o PAP envia a palavra-passe em texto claro.", "no ppp authentication", "encapsulation ppp|hdlc")
K(I, "keepalive <segundos>", "keep", "if",
  "Intervalo das mensagens keepalive que verificam se a ligação está viva.", "Deteta falhas de camada 2.",
  "R1(config-if)# keepalive 10", "", "no keepalive", "")
K(I, "load-interval <segundos>", "load-int", "if",
  "Período usado para calcular as taxas (bits/s) mostradas em show interfaces.", "Com 30 s vê picos de tráfego mais depressa.",
  "R1(config-if)# load-interval 30", "", "no load-interval", "show interfaces <interface>")
K(I, "negotiation auto", "nego auto", "if",
  "Liga a autonegociação numa interface de fibra/Gigabit.", "As duas pontas têm de concordar.",
  "R1(config-if)# negotiation auto", "", "no negotiation auto", "speed <velocidade>")
K(I, "default interface <interface>", "def int", "config",
  "Apaga toda a configuração de uma interface, deixando-a como de fábrica.", "Mais rápido do que remover comando a comando.",
  "SW1(config)# default interface fa0/5", "Apaga tudo, incluindo a VLAN e a descrição.", "", "interface <interface>")
K(I, "ip proxy-arp", "ip proxy", "if",
  "Liga o proxy ARP: o router responde a ARP em nome de hosts noutras redes.", "Por defeito está ligado; ajuda hosts mal configurados.",
  "R1(config-if)# ip proxy-arp", "Esconde erros de configuração; muitos desligam por segurança.", "no ip proxy-arp", "")
K(I, "no ip redirects", "no ip red", "if",
  "Deixa de enviar mensagens ICMP Redirect.", "Hardening: evita dar informação sobre a rede.",
  "R1(config-if)# no ip redirects", "", "ip redirects", "")
K(I, "no ip unreachables", "no ip unr", "if",
  "Deixa de enviar ICMP Destination Unreachable.", "Hardening contra reconhecimento.",
  "R1(config-if)# no ip unreachables", "O ping passa a mostrar timeout (.) em vez de U.", "ip unreachables", "")

V = "Verificação (show)"
K(V, "show running-config", "sh run", "priv",
  "Mostra a configuração ativa, que está na RAM.",
  "É a forma de ver tudo o que está configurado agora.",
  "R1# show running-config", "Inclui alterações ainda não guardadas.", "", "show startup-config; copy running-config startup-config",
  "Building configuration...\nhostname R1\n!\ninterface GigabitEthernet0/0\n ip address 192.168.1.1 255.255.255.0")
K(V, "show running-config interface <interface>", "sh run int g0/0", "priv",
  "Mostra só a configuração de uma interface.", "Mais rápido do que procurar no show run inteiro.",
  "R1# show running-config interface g0/0", "", "", "show running-config")
K(V, "show startup-config", "sh start", "priv",
  "Mostra a configuração guardada na NVRAM, que será carregada no próximo arranque.",
  "Comparar com o show run diz se há alterações por guardar.",
  "R1# show startup-config", "Num equipamento novo diz “startup-config is not present”.", "", "copy running-config startup-config")
K(V, "show ip interface brief", "sh ip int br", "user priv",
  "Resumo de todas as interfaces: IP, se está configurada, estado (Status = camada 1) e protocolo (camada 2).",
  "É o primeiro comando de diagnóstico: mostra numa linha se cada porta está up e com o IP certo.",
  "R1# show ip interface brief",
  "“administratively down” = falta no shutdown; down/down = problema físico; up/down = camada 2 (encapsulamento, keepalives).", "", "show interfaces <interface>; no shutdown",
  "Interface              IP-Address      OK? Method Status                Protocol\nGigabitEthernet0/0     192.168.1.1     YES manual up                    up\nGigabitEthernet0/1     unassigned      YES unset  administratively down down")
K(V, "show ip interface <interface>", "sh ip int g0/0", "user priv",
  "Detalhe de camada 3 de uma interface: IP, ACLs aplicadas (in/out), helper-address, proxy ARP…",
  "Confirma que ACL está aplicada e em que sentido.",
  "R1# show ip interface g0/0", "", "", "show ip interface brief; ip access-group <acl> in|out")
K(V, "show interfaces <interface>", "sh int g0/0", "user priv",
  "Detalhe de uma interface: estado, MAC, MTU, velocidade/duplex, taxas, e contadores de erros (CRC, colisões, late collisions).",
  "Os contadores de erros revelam cabos maus e duplex mismatch.",
  "R1# show interfaces g0/0", "Muitos CRC = problema físico; late collisions = duplex mismatch.", "", "clear counters; duplex <modo>")
K(V, "show interfaces description", "sh int desc", "user priv",
  "Lista as interfaces com o estado e a descrição configurada.", "Mostra rapidamente o que está ligado a cada porta.",
  "R1# show interfaces description", "", "", "description <texto>")
K(V, "show interfaces status", "sh int status", "user priv",
  "Num switch, lista cada porta com estado (connected/notconnect/err-disabled), VLAN, duplex, velocidade e tipo.",
  "Encontra portas em err-disabled ou na VLAN errada.",
  "SW1# show interfaces status", "", "", "show vlan brief")
K(V, "show interfaces switchport", "sh int sw", "priv",
  "Num switch, mostra o modo de cada porta (access/trunk), a VLAN de acesso, a nativa, a de voz e o estado do DTP.",
  "Confirma se uma porta ficou mesmo em access ou trunk.",
  "SW1# show interfaces fa0/1 switchport", "", "", "switchport mode access; show interfaces trunk")
K(V, "show interfaces trunk", "sh int tr", "priv",
  "Lista as portas trunk: modo, encapsulamento, VLAN nativa, VLANs permitidas e VLANs em forwarding.",
  "Primeiro comando quando duas pontas da mesma VLAN não se falam entre switches.",
  "SW1# show interfaces trunk", "Uma VLAN que não aparece em “allowed and active” não atravessa o trunk.", "", "switchport mode trunk; switchport trunk allowed vlan <lista>",
  "Port        Mode         Encapsulation  Status        Native vlan\nGi0/1       on           802.1q         trunking      99")
K(V, "show controllers <interface>", "sh controllers s0/0/0", "priv",
  "Informação de hardware da interface; numa série mostra se o cabo é DCE ou DTE e o clock rate.",
  "Descobre de que lado tem de configurar o clock rate.",
  "R1# show controllers s0/0/0", "", "", "clock rate <bps>")
K(V, "show version", "sh ver", "user priv",
  "Versão do IOS, tempo ligado (uptime), modelo, memória, número de interfaces, licença e configuration register.",
  "Informação essencial para suporte, atualizações e inventário.",
  "R1# show version", "", "", "show inventory; config-register <valor>",
  "Cisco IOS XE Software, Version 17.09.04a\nR1 uptime is 3 days, 2 hours\nConfiguration register is 0x2102")
K(V, "show inventory", "sh inv", "user priv",
  "Lista o hardware com números de série (chassis, módulos, fontes).", "Usado no inventário e nos pedidos de garantia.",
  "R1# show inventory", "", "", "show version")
K(V, "show license", "sh lic", "priv",
  "Mostra as licenças do IOS ativas.", "Algumas funcionalidades exigem licença.",
  "R1# show license", "", "", "show version")
K(V, "show processes cpu", "sh proc cpu", "priv",
  "Mostra o uso de CPU por processo.", "CPU a 100% explica lentidão e perda de vizinhos.",
  "R1# show processes cpu sorted", "", "", "show version")
K(V, "show users", "sh users", "user priv",
  "Mostra quem está ligado ao equipamento (consola, vty) e de onde.", "Saber se há alguém a configurar ao mesmo tempo.",
  "R1# show users", "", "", "show sessions")
K(V, "show sessions", "sh sess", "user priv",
  "Lista as sessões Telnet/SSH abertas a partir deste equipamento.", "Para voltar a uma sessão suspensa.",
  "R1# show sessions", "", "", "telnet <ip>")
K(V, "show terminal", "sh term", "user priv",
  "Mostra as definições da sessão (comprimento, histórico, tempo limite).", "Confirma o tamanho do histórico e do ecrã.",
  "R1# show terminal", "", "", "terminal length <linhas>")
K(V, "show <...>", "sh", "user priv",
  "Família de comandos de consulta: mostra estado e configuração sem alterar nada.",
  "Verificar é metade do trabalho: depois de configurar, confirme sempre com um show.",
  "R1# show ip interface brief", "Dentro de (config)# use do show.", "", "do <comando...>")
K(V, "| include <texto...>", "| i", "priv user",
  "Filtro de saída: depois de um show, mostra só as linhas que contêm o texto.",
  "Encontra numa saída enorme exatamente o que procura.",
  "R1# show running-config | include hostname", "Distingue maiúsculas de minúsculas.", "", "| exclude <texto>; | begin <texto>; | section <texto>")
K(V, "| exclude <texto...>", "| e", "priv user",
  "Filtro de saída: esconde as linhas que contêm o texto.", "Ex.: esconder as interfaces sem IP.",
  "S1# show ip interface brief | exclude unassigned", "", "", "| include <texto>")
K(V, "| begin <texto...>", "| b", "priv user",
  "Filtro de saída: começa a mostrar a partir da primeira linha que contém o texto.", "Salta diretamente para a parte que interessa.",
  "S1# show running-config | begin interface", "", "", "| include <texto>")
K(V, "| section <texto...>", "| s", "priv user",
  "Filtro de saída: mostra o bloco de configuração (a linha e as indentadas por baixo) que contém o texto.",
  "Ver só a configuração das linhas vty ou do router ospf.",
  "S1# show running-config | section line vty", "", "", "| include <texto>")

D = "Diagnóstico"
K(D, "ping <destino...>", "ping", "user priv",
  "Envia ICMP Echo Request ao destino e espera os Echo Reply. ! = resposta, . = sem resposta (timeout), U = inalcançável.",
  "Testa a conectividade de camada 3 de ponta a ponta.",
  "R1# ping 192.168.1.10\n!!!!!\nSuccess rate is 100 percent (5/5)",
  "O primeiro ponto (.!!!!) costuma ser o tempo do ARP — é normal. No modo privilegiado pode usar ping … source <interface>.", "", "traceroute <destino>; show ip route",
  "Type escape sequence to abort.\nSending 5, 100-byte ICMP Echos to 192.168.1.10, timeout is 2 seconds:\n!!!!!")
K(D, "traceroute <destino...>", "trace", "user priv",
  "Mostra os routers (saltos) até ao destino, usando o TTL e as respostas ICMP Time Exceeded.",
  "Descobre em que salto o caminho para.",
  "R1# traceroute 10.2.2.2", "Asteriscos (* * *) num salto podem ser ACLs que bloqueiam ICMP, não necessariamente avaria.", "", "ping <destino>; show ip route")
K(D, "telnet <ip>", "telnet", "user priv",
  "Abre uma sessão Telnet (TCP 23) para outro equipamento. Também serve para testar se uma porta TCP está aberta (telnet IP porta).",
  "Útil em laboratório e para testar portas.",
  "R1# telnet 10.0.12.2", "Tudo vai em texto simples, incluindo palavras-passe. Em produção use SSH.", "", "ssh -l <utilizador> <ip>")
K(D, "ssh -l <utilizador> <ip>", "ssh -l", "user priv",
  "Abre uma sessão SSH (TCP 22, cifrada) a partir do router para outro equipamento.",
  "Gerir equipamentos em saltos sem expor palavras-passe.",
  "R1# ssh -l admin 10.0.12.2", "", "", "telnet <ip>; transport input ssh")
K(D, "debug <tipo...>", "deb", "priv",
  "Mostra em tempo real os eventos de um protocolo (ex.: debug ip ospf adj, debug ip icmp).",
  "Vê exatamente o que o equipamento está a fazer quando o show não chega.",
  "R1# debug ip icmp", "Pode sobrecarregar a CPU num equipamento em produção. Desligue logo a seguir (undebug all). Por SSH precisa de terminal monitor.", "undebug all ou no debug all", "undebug <...>; terminal monitor")
K(D, "undebug <tipo...>", "u all", "priv",
  "Desliga debugs (undebug all desliga todos).", "Nunca deixe debugs ligados.",
  "R1# undebug all", "", "", "debug <tipo...>")
K(D, "no debug all", "no deb all", "priv",
  "Desliga todos os debugs (igual a undebug all).", "Primeira coisa a fazer se a consola encher de mensagens.",
  "R1# no debug all", "", "", "debug <tipo...>")
K(D, "show debugging", "sh debug", "priv",
  "Mostra que debugs estão ligados.", "Confirma que não ficou nenhum ativo.",
  "R1# show debugging", "", "", "undebug <tipo...>")
K(D, "clear counters [<interface>]", "clear count", "priv",
  "Põe a zero os contadores de tráfego e erros das interfaces.",
  "Depois de trocar um cabo, limpa os contadores para ver se os erros voltam a subir.",
  "R1# clear counters g0/0", "Pede confirmação.", "", "show interfaces <interface>")
K(D, "clear arp-cache", "clear arp", "priv",
  "Apaga as entradas dinâmicas da tabela ARP do router.", "Força a reaprender MACs depois de trocar um equipamento.",
  "R1# clear arp-cache", "", "", "show ip arp")
K(D, "show ip arp", "sh ip arp", "user priv",
  "Tabela ARP do router: IP, idade, MAC e interface de cada vizinho.", "Confirma se o router consegue falar em camada 2 com um host.",
  "R1# show ip arp", "", "", "clear arp-cache; show mac address-table",
  "Protocol  Address          Age (min)  Hardware Addr   Type   Interface\nInternet  192.168.1.10           3   0050.7966.6800  ARPA   GigabitEthernet0/0")
K(D, "show arp", "sh arp", "user priv",
  "Igual a show ip arp: tabela de correspondência IP → MAC.", "Diagnóstico de camada 2/3.",
  "R1# show arp", "", "", "show ip arp")
K(D, "show cdp neighbors [detail]", "sh cdp nei", "user priv",
  "Lista os vizinhos Cisco diretamente ligados (CDP): nome, interface local, modelo e porta remota. Com detail mostra também o IP e a versão do IOS.",
  "Mapeia a rede sem plantas e confirma em que porta está ligado cada cabo.",
  "R1# show cdp neighbors", "O CDP revela informação: desligue-o em portas viradas para fora (no cdp enable).", "", "cdp run; show lldp neighbors",
  "Device ID   Local Intrfce   Holdtme  Capability  Platform  Port ID\nS1          Gig 0/0         152      S I         WS-C2960  Gig 0/1")
K(D, "show cdp", "sh cdp", "user priv",
  "Mostra se o CDP está ativo e os seus temporizadores.", "Confirma o estado global do CDP.",
  "R1# show cdp", "", "", "cdp run")
K(D, "cdp run", "cdp run", "config",
  "Liga o CDP globalmente (vem ligado por defeito).", "Para descobrir vizinhos Cisco.",
  "R1(config)# cdp run", "", "no cdp run", "show cdp neighbors [detail]")
K(D, "no cdp run", "no cdp run", "config",
  "Desliga o CDP em todo o equipamento.", "Hardening: o CDP anuncia modelo, IOS e IPs a quem estiver ligado.",
  "R1(config)# no cdp run", "", "cdp run", "cdp run")
K(D, "cdp enable", "cdp en", "if",
  "Liga o CDP numa interface.", "Volta a anunciar-se nessa porta.",
  "R1(config-if)# cdp enable", "", "no cdp enable", "cdp run")
K(D, "no cdp enable", "no cdp en", "if",
  "Desliga o CDP só nessa interface.", "Boa prática nas portas viradas para o operador ou para utilizadores.",
  "R1(config-if)# no cdp enable", "", "cdp enable", "cdp run")
K(D, "lldp run", "lldp run", "config",
  "Liga o LLDP (IEEE 802.1AB), o equivalente aberto do CDP, que funciona entre marcas diferentes.",
  "Descobrir vizinhos de outros fabricantes (telefones IP, switches de outras marcas).",
  "R1(config)# lldp run", "", "no lldp run", "show lldp neighbors")
K(D, "no lldp run", "no lldp run", "config",
  "Desliga o LLDP globalmente.", "Por segurança, quando não é necessário.",
  "R1(config)# no lldp run", "", "lldp run", "lldp run")
K(D, "lldp transmit|receive", "lldp tr", "if",
  "Liga o envio (transmit) ou a receção (receive) de LLDP numa interface.", "Controlo fino por porta.",
  "R1(config-if)# lldp transmit", "", "no lldp transmit|receive", "lldp run")
K(D, "show lldp neighbors", "sh lldp nei", "user priv",
  "Lista os vizinhos descobertos por LLDP.", "Como o show cdp neighbors, mas para qualquer fabricante.",
  "R1# show lldp neighbors", "", "", "lldp run")
K(D, "show logging", "sh log", "priv",
  "Mostra a configuração do registo e as mensagens guardadas em memória (buffer).", "Ver o que aconteceu: interfaces que caíram, vizinhos perdidos, logins.",
  "R1# show logging", "", "", "logging buffered <...>; logging host <ip>")

F = "Ficheiros e arranque"
K(F, "copy running-config startup-config", "copy run start", "priv",
  "Copia a configuração ativa (RAM) para a NVRAM, para sobreviver a um reinício.",
  "Sem isto, todo o trabalho desaparece no próximo reinício ou falha de energia.",
  "R1# copy running-config startup-config\nDestination filename [startup-config]?\n[OK]",
  "Guarde só quando tiver a certeza de que a configuração está certa.", "", "write memory; show startup-config")
K(F, "write [memory]", "wr", "priv",
  "Comando antigo equivalente a copy running-config startup-config: guarda a configuração na NVRAM.",
  "Mais rápido de escrever.",
  "R1# write memory\n[OK]", "", "", "copy running-config startup-config")
K(F, "copy startup-config running-config", "copy start run", "priv",
  "Junta (merge) a configuração guardada à configuração ativa.",
  "Recupera a configuração guardada, por exemplo na recuperação de palavra-passe.",
  "Router# copy startup-config running-config",
  "Não substitui: junta. As interfaces podem ficar em shutdown — confirme com show ip interface brief.", "", "copy running-config startup-config")
K(F, "copy running-config tftp:", "copy run tftp", "priv",
  "Envia uma cópia da configuração para um servidor TFTP (pede o IP e o nome do ficheiro).",
  "Backup da configuração fora do equipamento.",
  "R1# copy running-config tftp:\nAddress or name of remote host []? 192.168.1.70", "O TFTP não tem autenticação nem cifra.", "", "copy tftp: flash:")
K(F, "copy running-config ftp://<destino...>", "copy run ftp", "priv",
  "Envia a configuração para um servidor FTP, usando as credenciais de ip ftp username/password.",
  "Backup com autenticação.",
  "R1# copy running-config ftp://192.168.1.70/r1-config.txt", "", "", "ip ftp username <nome>")
K(F, "copy tftp: flash:", "copy tftp flash", "priv",
  "Copia um ficheiro (normalmente uma imagem IOS nova) de um servidor TFTP para a flash.",
  "É assim que se atualiza o IOS.",
  "R1# copy tftp: flash:", "Confirme que há espaço na flash (dir flash:) e verifique o ficheiro (verify /md5).", "delete flash:<ficheiro>", "verify /md5 <ficheiro>; boot system flash:<ficheiro>")
K(F, "ip ftp username <nome>", "ip ftp user", "config",
  "Define o utilizador usado pelo router nas cópias por FTP.", "O servidor FTP exige autenticação.",
  "R1(config)# ip ftp username backup", "", "no ip ftp username", "ip ftp password <senha>")
K(F, "ip ftp password <senha>", "ip ftp pass", "config",
  "Define a palavra-passe usada nas cópias por FTP.", "Acompanha o ip ftp username.",
  "R1(config)# ip ftp password Bkp#2026", "Fica na configuração; proteja o acesso ao show run.", "no ip ftp password", "ip ftp username <nome>")
K(F, "dir [<sistema>]", "dir", "priv",
  "Lista os ficheiros da flash (ou de outro sistema de ficheiros): imagem IOS, vlan.dat…",
  "Ver a imagem IOS e o espaço livre antes de uma atualização.",
  "R1# dir flash:", "", "", "show flash:; copy tftp: flash:")
K(F, "show flash:", "sh flash", "priv",
  "Mostra o conteúdo da memória flash e o espaço livre.", "Confirmar a imagem IOS presente.",
  "R1# show flash:", "", "", "dir [<sistema>]")
K(F, "verify /md5 <ficheiro>", "verify /md5", "priv",
  "Calcula o hash MD5 de um ficheiro (ex.: a imagem IOS) para comparar com o publicado pela Cisco.",
  "Garante que a imagem não ficou corrompida nem foi adulterada.",
  "R1# verify /md5 flash:isr4300-universalk9.17.09.04a.SPA.bin", "", "", "copy tftp: flash:")
K(F, "boot system flash:<ficheiro>", "boot sys", "config",
  "Indica que imagem IOS carregar no próximo arranque.", "Necessário quando há várias imagens na flash.",
  "R1(config)# boot system flash:isr4300-universalk9.17.09.04a.SPA.bin", "Guarde e confirme o nome do ficheiro, senão o router pode arrancar em ROMMON.", "no boot system", "show boot; dir [<sistema>]")
K(F, "show boot", "sh boot", "priv",
  "Mostra as variáveis de arranque (que imagem e configuração carregar).", "Confirmar o boot system.",
  "S1# show boot", "", "", "boot system flash:<ficheiro>")
K(F, "reload", "rel", "priv",
  "Reinicia o equipamento.", "Aplica uma imagem IOS nova ou volta à configuração guardada.",
  "R1# reload\nProceed with reload? [confirm]",
  "Se houver alterações não guardadas, pergunta se quer guardar. Em produção, avise primeiro: a rede para durante o arranque.", "", "copy running-config startup-config")
K(F, "erase startup-config", "erase start", "priv",
  "Apaga a configuração guardada na NVRAM.", "Primeiro passo para devolver o equipamento à configuração de fábrica.",
  "R1# erase startup-config", "A running-config continua até reiniciar. Num switch, apague também o vlan.dat.", "", "write erase; reload; delete flash:vlan.dat")
K(F, "write erase", "wr er", "priv",
  "Comando antigo equivalente a erase startup-config.", "Limpar um equipamento usado.",
  "S1# write erase", "Não apaga as VLANs (vlan.dat).", "", "erase startup-config; delete flash:vlan.dat")
K(F, "delete flash:<ficheiro>", "del flash:vlan.dat", "priv",
  "Apaga um ficheiro da flash (ex.: vlan.dat, a base de dados das VLANs).", "Completa a limpeza de um switch.",
  "S1# delete flash:vlan.dat", "Nunca apague a imagem IOS sem ter outra.", "", "write erase; reload")
K(F, "config-register <valor>", "config-reg 0x2102", "config",
  "Define o configuration register: 0x2102 arranque normal; 0x2142 ignora a startup-config (recuperação de palavra-passe).",
  "Controla como o router arranca.",
  "R1(config)# config-register 0x2102", "Depois da recuperação volte sempre a 0x2102, senão a configuração não é carregada no arranque seguinte.", "", "show version; confreg <valor>")
K(F, "confreg <valor>", "confreg", "rommon",
  "No ROMMON, muda o configuration register (ex.: confreg 0x2142 para arrancar sem a startup-config).",
  "Passo da recuperação de palavra-passe.",
  "rommon 1 > confreg 0x2142", "", "confreg 0x2102", "reset; config-register <valor>")
K(F, "reset", "reset", "rommon",
  "No ROMMON, reinicia o router.", "Arranca com o novo configuration register.",
  "rommon 2 > reset", "", "", "confreg <valor>")
