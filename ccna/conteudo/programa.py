"""Conteúdo programático: cursos e módulos.

Segue o documento “Conteúdo Programático — Redes de Computadores e CCNA”:
Parte A (fundamentos), CCNA 1 (ITN), CCNA 2 (SRWE), CCNA 3 (ENSA),
cursos complementares e projeto final.

Cada módulo indica:
- ``licoes``: ids das aulas (definidas nos ficheiros m0*.py … m9*.py,
  introducoes.py e licoes_novas.py);
- ``temas``: o conteúdo programático do módulo;
- ``ficha``: a ficha de trabalho (pergunta → resposta);
- ``comandos``: os comandos de referência;
- ``sim``: atividades do simulador de rede (simulador.py).
"""

CURSOS = [
    ("A", "Parte A — Fundamentos de informática e redes", "Do zero: o que é um computador até à primeira rede.", 30),
    ("B", "CCNA 1 — Introdução às Redes (ITN)", "Arquitetura, modelos, endereçamento e uma pequena rede completa.", 70),
    ("C", "CCNA 2 — Switching, Routing e Wireless (SRWE)", "VLANs, STP, EtherChannel, DHCP, FHRP, segurança de switch, Wi-Fi e rotas estáticas.", 70),
    ("D", "CCNA 3 — Redes Empresariais, Segurança e Automação (ENSA)", "OSPF, ACLs, NAT, WAN, VPN, QoS, gestão, desenho, virtualização e automação.", 70),
    ("E", "Cursos complementares", "Cabeamento estruturado, Linux, Wireshark, cibersegurança, IPv6 avançado e introdução ao CCNP.", 80),
    ("F", "Projeto final e exame 200-301", "Projeto integrado, simulados e plano para o exame.", 40),
]


def m(id, curso, codigo, titulo, horas, objetivos, temas, licoes, ficha, comandos="", sim=None, dominio=""):
    return {"id": id, "curso": curso, "codigo": codigo, "titulo": titulo, "horas": horas,
            "objetivos": objetivos, "temas": temas, "licoes_ids": licoes, "ficha": [{"p": p, "r": r} for p, r in ficha],
            "comandos": comandos.strip("\n"), "sim": sim or [], "dominio": dominio}


PROGRAMA = [
    # ------------------------------------------------------------------ Parte A
    m("a1", "A", "A1", "O que é a informática", 3, ["Explicar o que é a informática", "Distinguir dados, informação e conhecimento", "Nomear as partes de um sistema informático"],
      ["Informática = informação + automática; TIC", "Dados, informação e conhecimento", "Sistema informático: hardware, software, dados, pessoas, redes", "Onde se usa e profissões"],
      ["m0l1"], [("Dê um exemplo de dado e da informação que se obtém dele na sua escola.", "Resposta livre (ex.: “14” → “o João teve 14 valores a Matemática”)."),
                 ("O sistema operativo é hardware ou software?", "Software."), ("Nomeie as 5 partes de um sistema informático.", "Hardware, software, dados, pessoas, redes.")]),
    m("a2", "A", "A2", "Como surgiram os computadores", 4, ["Contar a evolução dos computadores", "Conhecer as gerações e a Lei de Moore"],
      ["Ábaco, Pascalina, tear de Jacquard", "Babbage, Ada Lovelace, Hollerith, Turing", "ENIAC, von Neumann, transístor, circuito integrado, microprocessador", "Gerações de computadores e Lei de Moore"],
      ["m0l2"], [("Que invenção substituiu as válvulas?", "O transístor (1947)."), ("Quem escreveu o primeiro algoritmo?", "Ada Lovelace."), ("Faça uma linha do tempo com 6 datas desta aula.", "Resposta livre.")]),
    m("a3", "A", "A3", "O computador por dentro", 4, ["Identificar CPU, RAM, armazenamento, placa-mãe, fonte e placa de rede", "Explicar entrada → processamento → saída"],
      ["Hardware e periféricos", "Tipos de computador", "O router também é um computador (flash, NVRAM)"],
      ["m0l3"], [("Que peça perde o conteúdo ao desligar?", "A RAM."), ("Onde fica a configuração guardada de um router Cisco?", "Na NVRAM."),
                 ("Abra o Gestor de Tarefas (Ctrl+Shift+Esc › Desempenho) e anote CPU, RAM, disco e placa de rede.", "Resposta prática.")]),
    m("a4", "A", "A4", "Software, sistemas operativos e ficheiros", 4, ["Explicar as funções do sistema operativo", "Organizar ficheiros", "Usar os primeiros comandos"],
      ["Funções do SO", "SO comuns, incluindo Cisco IOS", "Ficheiros, pastas e extensões", "GUI × CLI; Prompt do Windows"],
      ["m0l4"], [("Corra ipconfig /all e anote IPv4, máscara, gateway e endereço físico.", "Resposta prática."), ("Qual o equivalente de dir no Linux?", "ls.")],
      "C:\\> dir\nC:\\> cd Documentos\nC:\\> cd ..\nC:\\> ipconfig\nC:\\> ipconfig /all\nC:\\> ping 8.8.8.8"),
    m("a5", "A", "A5", "Porque os computadores precisam de comunicar", 3, ["Explicar os problemas dos computadores isolados", "Comparar comutação de circuitos e de pacotes"],
      ["Sneakernet", "Telégrafo, telefone, terminais, modems", "Comutação de circuitos × pacotes", "Vantagens das redes"],
      ["m0l5"], [("Porque é que a comutação de pacotes aproveita melhor as ligações?", "Os pacotes de muitos utilizadores partilham a mesma ligação, sem reservar caminho nos silêncios.")]),
    m("a6", "A", "A6", "História das redes e da Internet", 3, ["Situar os grandes marcos das redes"],
      ["ARPANET e RFC 1", "Ethernet, TCP/IP, DNS", "Cisco, Web, Wi-Fi, IPv6", "Exame CCNA 200-301"],
      ["m0l6"], [("O que é um RFC?", "Um documento público que define um protocolo ou prática da Internet."), ("Em que ano a ARPANET adotou o TCP/IP?", "1983.")]),
    m("a7", "A", "A7", "Como a informação viaja e a primeira rede", 5, ["Explicar IP, MAC, porta, router, switch e DNS com analogias", "Montar a primeira rede no simulador"],
      ["Analogia do correio", "Rede local e Internet", "Primeira rede: dois PCs e um switch"],
      ["m0l7"], [("Mude o PC2 para 192.168.2.20 e repita o ping. O que acontece?", "Falha: estão em redes diferentes e não há router.")], sim=["s01"]),
    m("a8", "A", "A8", "Os números das redes", 4, ["Converter decimal, binário e hexadecimal", "Distinguir bit e byte, Mbit/s e MB/s"],
      ["Bit e byte", "Pesos 128 a 1", "Hexadecimal", "Velocidades e tamanhos"],
      ["m0l8"], [("Converta 172 para binário.", "10101100."), ("Converta 00111111 para decimal.", "63."), ("Converta 0xC0 para decimal.", "192."), ("Quanto demora um ficheiro de 500 MB a 40 Mbit/s?", "4000 Mbit ÷ 40 = 100 s.")]),

    # ------------------------------------------------------------------ CCNA 1
    m("itn1", "B", "ITN 1", "As redes hoje", 3, ["Descrever componentes, tipos e topologias de rede", "Explicar as tendências atuais"],
      ["Dispositivos finais, intermédios e meios", "Topologia física × lógica", "LAN, WAN, MAN, WLAN, Internet, intranet, extranet", "Ligações à Internet", "Rede fiável: tolerância a falhas, escalabilidade, QoS, segurança", "Tendências: BYOD, cloud, IoT"],
      ["m1l0", "m1l1", "m1l3"], [("Classifique: impressora, switch, servidor, access point.", "Finais: impressora, servidor. Intermédios: switch, AP."),
                                 ("Que característica falta a uma rede com um único router e sem ligação de reserva?", "Tolerância a falhas.")], dominio="1.0"),
    m("itn2", "B", "ITN 2", "Configuração básica de switch e dispositivos finais", 6, ["Aceder ao IOS e navegar nos modos", "Configurar nome, palavras-passe, banner e IP de gestão", "Guardar a configuração"],
      ["Acesso: consola, SSH, Telnet", "Modos do IOS e ajuda", "running-config × startup-config", "IP de gestão na SVI (interface vlan 1)", "IP nos PCs"],
      ["m4l0", "m4l1", "n_itn2"], [("Que comando passa de S1> para S1#?", "enable."), ("Diferença entre enable password e enable secret?", "O secret guarda um hash; o password fica em texto (ou tipo 7, reversível)."),
                                   ("Configurou tudo e desligou o switch sem guardar. O que acontece?", "Perde a configuração: a running-config estava só na RAM.")],
      """Switch> enable
Switch# configure terminal
Switch(config)# hostname S1
S1(config)# enable secret Class#2026
S1(config)# line console 0
S1(config-line)# password Cisco#Con
S1(config-line)# login
S1(config)# line vty 0 15
S1(config-line)# password Cisco#Vty
S1(config-line)# login
S1(config)# service password-encryption
S1(config)# banner motd #Acesso apenas a pessoal autorizado#
S1(config)# interface vlan 1
S1(config-if)# ip address 192.168.1.2 255.255.255.0
S1(config-if)# no shutdown
S1(config)# ip default-gateway 192.168.1.1
S1# copy running-config startup-config""", sim=["s03"], dominio="1.0"),
    m("itn3", "B", "ITN 3", "Protocolos e modelos", 4, ["Explicar regras de comunicação e normas", "Comparar OSI e TCP/IP", "Descrever o encapsulamento"],
      ["Regras de comunicação", "Organismos de normalização", "Modelos OSI e TCP/IP", "PDUs e encapsulamento", "Endereços IP (fim a fim) × MAC (salto a salto)"],
      ["m2l0", "m2l1", "m2l2"], [("Ordene as PDUs do topo para baixo.", "Dados, segmento, pacote, trama, bits."), ("Em que camada OSI está o TCP? E o Ethernet?", "4 (transporte); 2 (ligação de dados) e 1.")], dominio="1.0"),
    m("itn4", "B", "ITN 4", "Camada física, cabos e crimpagem", 4, ["Escolher meios e conectores", "Explicar largura de banda e débito", "Crimpar e testar cabos"],
      ["Largura de banda, débito, latência", "UTP, STP, coaxial; categorias", "T568A/T568B; direto, cruzado, consola; Auto-MDIX", "Fibra monomodo e multimodo; LC, SC, ST; SFP", "Sem fios", "Crimpagem: ferramentas e passo a passo"],
      ["m1l2", "m1l4", "n_conectores", "n_crimpar"], [("Que cabo liga switch a switch sem Auto-MDIX?", "Cruzado."), ("Ligação de 2 km entre edifícios?", "Fibra monomodo."),
                                         ("Uma ligação de 1 Gbit/s transfere 400 Mbit/s. Qual é o débito?", "400 Mbit/s (a largura de banda é 1 Gbit/s)."),
                                         ("Escreva a ordem T568B dos pinos 1 a 8.", "Branco-laranja, laranja, branco-verde, azul, branco-azul, verde, branco-castanho, castanho.")], sim=["s02"], dominio="1.0"),
    m("itn5", "B", "ITN 5", "Sistemas numéricos", 4, ["Converter IPv4 entre decimal e binário", "Converter hexadecimal"],
      ["Notação posicional", "IPv4 em binário (32 bits)", "Hexadecimal e IPv6 (128 bits)"],
      ["n_itn5"], [("192.168.10.65 em binário.", "11000000.10101000.00001010.01000001"), ("10101100.00010000.00000001.11111110 em decimal.", "172.16.1.254"),
                   ("Hexadecimal 0xA8 em decimal.", "168."), ("255 em hexadecimal.", "FF.")], dominio="1.0"),
    m("itn6", "B", "ITN 6", "Camada de ligação de dados", 3, ["Descrever LLC e MAC", "Explicar topologias e controlo de acesso ao meio", "Descrever a trama"],
      ["Subcamadas LLC e MAC", "Half × full-duplex", "CSMA/CD e CSMA/CA", "Campos da trama e FCS"],
      ["n_itn6"], [("Que método de acesso usa o Wi-Fi?", "CSMA/CA."), ("Para que serve o FCS?", "Detetar tramas corrompidas, que são descartadas.")], dominio="1.0"),
    m("itn7", "B", "ITN 7", "Comutação Ethernet", 4, ["Descrever a trama Ethernet e o MAC", "Explicar como o switch aprende e encaminha"],
      ["Trama Ethernet II", "MAC unicast, broadcast, multicast", "Tabela MAC: aprender, encaminhar, inundar, filtrar", "Store-and-forward × cut-through; Auto-MDIX"],
      ["m2l4", "m5l1"], [("O switch recebe uma trama para um MAC que não está na tabela. O que faz?", "Inunda por todas as portas da VLAN, exceto a de entrada."), ("Qual o MAC de broadcast?", "FFFF.FFFF.FFFF.")],
      "S1# show mac address-table\nS1# show mac address-table dynamic interface fa0/1\nS1# clear mac address-table dynamic\nS1(config-if)# speed auto\nS1(config-if)# duplex auto\nS1(config-if)# mdix auto", dominio="2.0"),
    m("itn8", "B", "ITN 8", "Camada de rede", 4, ["Descrever IPv4 e IPv6", "Explicar como o host escolhe o gateway", "Ler a tabela de encaminhamento"],
      ["Características do IP", "Cabeçalhos IPv4 e IPv6", "Limitações do IPv4", "Decisão do host", "Tabela de encaminhamento"],
      ["n_itn8"], [("Um PC 192.168.1.10/24 quer chegar a 10.0.0.5. Para onde envia o pacote?", "Para o gateway por defeito."),
                   ("O que acontece a um pacote quando o TTL chega a 0?", "É descartado e o router envia ICMP Time Exceeded.")],
      "C:\\> route print\nR1# show ip route\nR1# show ipv6 route", dominio="3.0"),
    m("itn9", "B", "ITN 9", "Resolução de endereços (ARP e ND)", 3, ["Explicar ARP e Neighbor Discovery", "Ver e limpar as caches"],
      ["ARP Request e Reply", "Cache ARP e gateway", "ARP spoofing", "IPv6 Neighbor Discovery"],
      ["n_itn9"], [("O ARP Request vai em broadcast ou unicast?", "Broadcast. A resposta vai em unicast."), ("Que protocolo substitui o ARP no IPv6?", "Neighbor Discovery (ICMPv6).")],
      "C:\\> arp -a\nC:\\> arp -d *\nR1# show ip arp\nR1# show ipv6 neighbors", dominio="1.0"),
    m("itn10", "B", "ITN 10", "Configuração básica do router", 5, ["Configurar um router de raiz", "Configurar interfaces IPv4 e IPv6", "Configurar o gateway nos hosts"],
      ["Configuração inicial e segurança", "Interfaces IPv4 e IPv6", "Gateway por defeito nos hosts", "Verificação"],
      ["m4l2"], [("Porque é que uma interface de router aparece “administratively down”?", "Falta no shutdown."), ("Que gateway configura num PC da LAN G0/0/0 (192.168.10.1/24)?", "192.168.10.1.")],
      """R1(config)# hostname R1
R1(config)# no ip domain-lookup
R1(config)# enable secret Class#2026
R1(config)# interface g0/0/0
R1(config-if)# description LAN dos utilizadores
R1(config-if)# ip address 192.168.10.1 255.255.255.0
R1(config-if)# ipv6 address 2001:db8:acad:10::1/64
R1(config-if)# no shutdown
R1# show ip interface brief
R1# show ip route""", sim=["s04"], dominio="3.0"),
    m("itn11", "B", "ITN 11", "Endereçamento IPv4 e sub-redes", 8, ["Identificar rede, broadcast e hosts", "Criar sub-redes de tamanho fixo e VLSM", "Distinguir público, privado e especiais"],
      ["Rede e host; máscara e prefixo", "Privados, loopback, APIPA, classes", "Sub-redes e número mágico", "VLSM", "Planeamento"],
      ["m3l0", "m3l1", "m3l2", "m3l3"], [("Rede e broadcast de 172.16.45.10/20.", "Rede 172.16.32.0, broadcast 172.16.47.255."), ("Quantos hosts tem um /26?", "62."),
                                         ("Divida 192.168.1.0/24 em 4 sub-redes iguais.", ".0/26, .64/26, .128/26, .192/26."),
                                         ("VLSM para 10.1.0.0/24: Vendas 100, TI 50, Gestão 20, 2 WAN.", "10.1.0.0/25, 10.1.0.128/26, 10.1.0.192/27, 10.1.0.224/30, 10.1.0.228/30."),
                                         ("192.168.1.63/26 pode ser atribuído a um PC?", "Não, é o broadcast de 192.168.1.0/26.")], sim=["s05"], dominio="1.0"),
    m("itn12", "B", "ITN 12", "Endereçamento IPv6", 6, ["Escrever e abreviar IPv6", "Distinguir tipos de endereço", "Configurar estático, EUI-64 e SLAAC"],
      ["Transição: dual-stack, túneis, NAT64", "Formato e abreviação", "GUA, link-local, unique local, multicast", "SLAAC, DHCPv6, EUI-64, DAD", "Sub-redes IPv6"],
      ["m3l4"], [("Abrevie 2001:0db8:0000:0000:0000:00a0:0000:0001.", "2001:db8::a0:0:1."), ("Expanda fe80::12:34ff:fe56:7890.", "fe80:0000:0000:0000:0012:34ff:fe56:7890."),
                 ("ID EUI-64 do MAC 0012.34ab.cdef.", "0212:34ff:feab:cdef."), ("Quantas sub-redes /64 cabem num /48?", "65 536.")],
      "R1(config)# ipv6 unicast-routing\nR1(config-if)# ipv6 address 2001:db8:acad:1::/64 eui-64\nR1(config-if)# ipv6 address fe80::1 link-local\nR1# show ipv6 interface brief", dominio="1.0"),
    m("itn13", "B", "ITN 13", "ICMP: ping e traceroute", 3, ["Explicar as mensagens ICMP", "Testar com ping e traceroute"],
      ["Echo, Destination Unreachable, Time Exceeded", "ICMPv6 e ND", "Testar por etapas: loopback, gateway, remoto", "Símbolos do ping no IOS"],
      ["n_itn13"], [("O ping a 127.0.0.1 falha. Onde está o problema?", "Na pilha TCP/IP do próprio PC."), ("O ping ao gateway funciona mas a um host remoto não. Que comando ajuda?", "tracert / traceroute.")],
      "C:\\> ping 127.0.0.1\nC:\\> ping 192.168.10.1\nC:\\> tracert 192.168.11.10\nR1# ping 192.168.11.10\nR1# traceroute 192.168.11.10", dominio="1.0"),
    m("itn14", "B", "ITN 14", "Camada de transporte", 4, ["Comparar TCP e UDP", "Explicar portas, sockets e handshake"],
      ["TCP: fiável, ordenado, janela", "UDP: sem ligação", "Portas e sockets", "Handshake e controlo de fluxo"],
      ["m2l3"], [("Que protocolo usa uma chamada de voz sobre IP?", "UDP."), ("Porta do HTTPS?", "443 (TCP)."), ("Ordem do handshake?", "SYN, SYN-ACK, ACK.")], "C:\\> netstat -an", dominio="1.0"),
    m("itn15", "B", "ITN 15", "Camada de aplicação", 3, ["Descrever HTTP, e-mail, DNS, DHCP e partilha de ficheiros"],
      ["Cliente-servidor × P2P", "HTTP/HTTPS", "SMTP, POP3, IMAP", "DNS e registos", "DHCP", "FTP, SMB"],
      ["m7l0", "n_itn15"], [("Que registo DNS indica o servidor de correio?", "MX."), ("Diferença entre POP3 e IMAP?", "O POP3 descarrega e normalmente apaga do servidor; o IMAP mantém e sincroniza.")],
      "C:\\> nslookup www.cisco.com\nC:\\> ipconfig /displaydns\nC:\\> ipconfig /release\nC:\\> ipconfig /renew", sim=["s12"], dominio="4.0"),
    m("itn16", "B", "ITN 16", "Fundamentos de segurança de rede", 3, ["Reconhecer ameaças e ataques", "Endurecer os equipamentos"],
      ["Ameaças e vulnerabilidades", "Ataques: reconhecimento, acesso, DoS", "Mitigação e defesa em profundidade", "SSH e boas práticas"],
      ["m8l0", "n_itn16"], [("Porque se troca Telnet por SSH?", "O Telnet envia tudo, incluindo palavras-passe, em texto claro."),
                            ("O que faz login block-for 120 attempts 3 within 60?", "Bloqueia logins 120 s depois de 3 tentativas falhadas em 60 s.")],
      """R1(config)# security passwords min-length 10
R1(config)# login block-for 120 attempts 3 within 60
R1(config)# ip domain-name escola.local
R1(config)# username admin secret Adm!n#2026
R1(config)# crypto key generate rsa modulus 2048
R1(config)# ip ssh version 2
R1(config)# line vty 0 4
R1(config-line)# login local
R1(config-line)# transport input ssh""", dominio="5.0"),
    m("itn17", "B", "ITN 17", "Construir uma pequena rede", 6, ["Desenhar, endereçar, proteger e documentar uma rede", "Resolver problemas com método"],
      ["Escolha de equipamentos e endereçamento", "Verificação: ping, traceroute, show", "Metodologia de resolução de problemas", "Simulador × equipamento real", "Projeto: Clínica Boa Saúde"],
      ["m4l3", "m4l4"], [("Liste os 7 passos da metodologia de resolução de problemas.", "Identificar, teorizar, testar a teoria, planear, executar, verificar, documentar.")],
      "R1# show version\nR1# show cdp neighbors detail\nR1# show interfaces\nR1# terminal monitor\nR1# debug ip icmp\nR1# undebug all", sim=["s11"], dominio="1.0"),

    # ------------------------------------------------------------------ CCNA 2
    m("srwe1", "C", "SRWE 1", "Configuração básica de equipamentos", 3, ["Configurar gestão remota segura", "Verificar interfaces e resolver problemas de camada 1"],
      ["Arranque do switch e boot loader", "SVI de gestão", "Duplex, velocidade, Auto-MDIX", "Erros de interface", "Filtrar saídas show"],
      ["n_srwe1"], [("Uma porta mostra muitos CRC e late collisions. Causas prováveis?", "Cabo danificado ou interferência (CRC); duplex mismatch (late collisions)."),
                    ("Que filtro mostra só a secção das linhas vty?", "| section line vty.")],
      "S1(config)# interface vlan 99\nS1(config-if)# ip address 172.17.99.11 255.255.255.0\nS1(config)# ip default-gateway 172.17.99.1\nS1# show interfaces fa0/18\nS1# show running-config | section line vty\nS1# show ip interface brief | exclude unassigned", dominio="2.0"),
    m("srwe2", "C", "SRWE 2", "Conceitos de comutação", 3, ["Explicar encaminhamento de tramas", "Distinguir domínios de colisão e de broadcast"],
      ["Tabela MAC", "Store-and-forward, cut-through", "Domínios de colisão e de broadcast", "Redução de congestionamento"],
      ["n_srwe2"], [("Quantos domínios de colisão tem um switch de 24 portas com 24 PCs?", "24."), ("E de broadcast, com todas as portas na VLAN 1?", "1.")], dominio="2.0"),
    m("srwe3", "C", "SRWE 3", "VLANs", 6, ["Criar VLANs e atribuir portas", "Configurar trunks 802.1Q e DTP", "VLAN de voz"],
      ["Tipos de VLAN", "Gamas normal e estendida", "Trunk 802.1Q e VLAN nativa", "DTP"],
      ["m5l0", "m5l2"], [("Dois switches com dynamic auto formam trunk?", "Não, ficam em access."), ("Como acrescentar a VLAN 30 a um trunk sem apagar as outras?", "switchport trunk allowed vlan add 30."),
                         ("Apagou a VLAN 10 e as portas deixaram de funcionar. Porquê?", "Ficam associadas a uma VLAN inexistente.")],
      "S1(config)# vlan 10\nS1(config-vlan)# name VENDAS\nS1(config)# interface range fa0/1 - 10\nS1(config-if-range)# switchport mode access\nS1(config-if-range)# switchport access vlan 10\nS1(config)# interface g0/1\nS1(config-if)# switchport mode trunk\nS1(config-if)# switchport trunk native vlan 99\nS1# show vlan brief\nS1# show interfaces trunk", sim=["s06"], dominio="2.0"),
    m("srwe4", "C", "SRWE 4", "Encaminhamento entre VLANs", 5, ["Configurar router-on-a-stick", "Configurar SVIs num switch L3"],
      ["Router-on-a-stick", "Switch L3 com SVIs e portas roteadas", "Problemas típicos"],
      ["m5l3"], [("PC na VLAN 10 não chega à VLAN 20. Liste 3 causas.", "Trunk em baixo ou VLAN não permitida; encapsulation errada na subinterface; gateway errado no PC.")],
      "R1(config)# interface g0/0/1.10\nR1(config-subif)# encapsulation dot1Q 10\nR1(config-subif)# ip address 192.168.10.1 255.255.255.0\nD1(config)# ip routing\nD1(config)# interface vlan 10\nD1(config-if)# ip address 192.168.10.1 255.255.255.0", sim=["s07"], dominio="2.0"),
    m("srwe5", "C", "SRWE 5", "Conceitos de STP", 5, ["Explicar loops de camada 2", "Aplicar o algoritmo STP", "Comparar STP, RSTP e PVST+"],
      ["Tempestades de broadcast", "Bridge ID e root bridge", "Papéis e estados das portas", "RSTP e Rapid PVST+", "PortFast e BPDU Guard"],
      ["m5l4"], [("Três switches com prioridade 32768 e MAC ...0001, ...0002, ...0003. Qual é a root?", "O de MAC ...0001."), ("Valores válidos de prioridade?", "Múltiplos de 4096, de 0 a 61440.")],
      "S1(config)# spanning-tree mode rapid-pvst\nS1(config)# spanning-tree vlan 1,10,20 root primary\nS1(config-if)# spanning-tree portfast\nS1(config-if)# spanning-tree bpduguard enable\nS1# show spanning-tree", dominio="2.0"),
    m("srwe6", "C", "SRWE 6", "EtherChannel", 4, ["Agregar ligações com LACP e PAgP"],
      ["Vantagens", "LACP e PAgP", "Requisitos", "Verificação"],
      ["m5l5"], [("LACP passive + passive forma canal?", "Não."), ("Uma porta aparece com a flag (s). O que significa?", "Suspensa: configuração diferente das outras portas do grupo.")],
      "S1(config)# interface range g0/1 - 2\nS1(config-if-range)# channel-group 1 mode active\nS1(config)# interface port-channel 1\nS1(config-if)# switchport mode trunk\nS1# show etherchannel summary", dominio="2.0"),
    m("srwe7", "C", "SRWE 7", "DHCPv4", 4, ["Configurar o router como servidor, relay e cliente DHCP"],
      ["DORA", "Servidor DHCP no IOS", "Relay com ip helper-address", "Router cliente DHCP"],
      ["m7l1"], [("Os PCs de outra rede não recebem IP do servidor central. O que falta?", "ip helper-address na interface do router do lado dos clientes."), ("Porque se excluem endereços?", "Para gateway, servidores e impressoras com IP fixo.")],
      "R1(config)# ip dhcp excluded-address 192.168.10.1 192.168.10.9\nR1(config)# ip dhcp pool LAN\nR1(dhcp-config)# network 192.168.10.0 255.255.255.0\nR1(dhcp-config)# default-router 192.168.10.1\nR1(dhcp-config)# dns-server 192.168.11.5\nR2(config-if)# ip helper-address 10.1.1.1\nR1# show ip dhcp binding", sim=["s08"], dominio="4.0"),
    m("srwe8", "C", "SRWE 8", "SLAAC e DHCPv6", 4, ["Configurar SLAAC, DHCPv6 stateless e stateful"],
      ["Flags A, O, M do RA", "SLAAC", "DHCPv6 stateless e stateful", "Relay DHCPv6"],
      ["n_srwe8"], [("Que flag indica DHCPv6 stateful?", "M (managed)."), ("No DHCPv6 stateful, de onde vem o gateway?", "Do Router Advertisement.")],
      "R1(config)# ipv6 dhcp pool STATELESS\nR1(config-dhcpv6)# dns-server 2001:db8:acad:1::254\nR1(config-if)# ipv6 nd other-config-flag\nR1(config-if)# ipv6 dhcp server STATELESS\nR1(config-if)# ipv6 nd managed-config-flag", dominio="1.0"),
    m("srwe9", "C", "SRWE 9", "Conceitos de FHRP (HSRP)", 3, ["Explicar a redundância de gateway", "Configurar HSRP"],
      ["Gateway único", "Router virtual", "HSRP, VRRP, GLBP"],
      ["m6l4"], [("Que gateway configuram os PCs?", "O IP virtual."), ("R1 (prioridade 150) volta mas não retoma o papel de active. Porquê?", "Falta standby 1 preempt.")],
      "R1(config-if)# standby version 2\nR1(config-if)# standby 1 ip 192.168.1.1\nR1(config-if)# standby 1 priority 150\nR1(config-if)# standby 1 preempt\nR1# show standby brief", dominio="3.0"),
    m("srwe10", "C", "SRWE 10", "Conceitos de segurança na LAN", 3, ["Explicar AAA e 802.1X", "Reconhecer ataques de camada 2"],
      ["Segurança dos hosts", "AAA, RADIUS, TACACS+", "802.1X", "Ataques de camada 2"],
      ["m8l1"], [("Que ataque se faz ligando um switch que finge ser trunk?", "VLAN hopping por DTP (switch spoofing)."), ("Que ataque esgota o pool DHCP?", "DHCP starvation.")], dominio="5.0"),
    m("srwe11", "C", "SRWE 11", "Configuração de segurança do switch", 5, ["Configurar port security, DHCP snooping, DAI, PortFast e BPDU Guard"],
      ["Port security", "Mitigar VLAN hopping", "DHCP snooping", "Dynamic ARP Inspection", "PortFast e BPDU Guard"],
      ["m8l3"], [("Modo de violação que descarta e regista sem desligar?", "restrict."), ("Onde se configura ip dhcp snooping trust?", "Nas portas para o servidor DHCP legítimo.")],
      "S1(config-if)# switchport port-security\nS1(config-if)# switchport port-security maximum 2\nS1(config-if)# switchport port-security mac-address sticky\nS1(config)# ip dhcp snooping\nS1(config)# ip dhcp snooping vlan 10,20\nS1(config-if)# ip dhcp snooping trust\nS1(config)# ip arp inspection vlan 10,20", dominio="5.0"),
    m("srwe12", "C", "SRWE 12", "Conceitos de WLAN", 3, ["Conhecer normas, bandas e canais", "Comparar arquiteturas e segurança"],
      ["Normas 802.11", "2,4, 5 e 6 GHz", "BSS, ESS, SSID", "CAPWAP", "WPA2 e WPA3"],
      ["m5l6"], [("Canais de 2,4 GHz sem sobreposição?", "1, 6 e 11."), ("Que protocolo liga APs leves à WLC?", "CAPWAP.")], dominio="2.0"),
    m("srwe13", "C", "SRWE 13", "Configuração de WLAN", 5, ["Configurar router sem fios doméstico e WLC"],
      ["Router doméstico", "WLC e APs leves", "WPA2 Enterprise com RADIUS", "Problemas"],
      ["n_srwe13"], [("Que dados mínimos configura num router Wi-Fi doméstico?", "Palavra-passe de administração, SSID, segurança WPA2/WPA3 com palavra-passe forte, DHCP da LAN.")], dominio="2.0"),
    m("srwe14", "C", "SRWE 14", "Conceitos de encaminhamento", 4, ["Explicar como o router escolhe o caminho", "Ler a tabela de encaminhamento"],
      ["Longest match", "CEF", "Códigos e distância administrativa", "Estático × dinâmico"],
      ["m6l0", "m6l1"], [("Para 10.1.1.5 há 10.0.0.0/8 (OSPF) e 10.1.1.0/24 (estática). Qual é usada?", "10.1.1.0/24, o prefixo mais longo."), ("Mesma rede por OSPF e RIP. Qual entra?", "OSPF (AD 110 < 120).")], dominio="3.0"),
    m("srwe15", "C", "SRWE 15", "Encaminhamento IP estático", 5, ["Configurar rotas estáticas IPv4 e IPv6 de todos os tipos"],
      ["Next hop, interface, totalmente especificada", "Rota por defeito", "Rota flutuante", "Rota de host", "IPv6"],
      ["m6l2"], [("Escreva a rota por defeito via 203.0.113.1.", "ip route 0.0.0.0 0.0.0.0 203.0.113.1."), ("Para que serve o 5 em ip route 0.0.0.0 0.0.0.0 10.10.10.2 5?", "Distância administrativa 5: rota flutuante.")],
      "R1(config)# ip route 172.16.2.0 255.255.255.0 172.16.1.2\nR1(config)# ip route 0.0.0.0 0.0.0.0 209.165.200.226\nR1(config)# ip route 0.0.0.0 0.0.0.0 10.10.10.2 5\nR1(config)# ipv6 route ::/0 g0/0/1 fe80::2\nR1# show ip route static", sim=["s09"], dominio="3.0"),
    m("srwe16", "C", "SRWE 16", "Resolver problemas de rotas estáticas", 3, ["Diagnosticar e corrigir rotas estáticas e por defeito"],
      ["Mudanças que afetam rotas", "Erros comuns", "Ferramentas"],
      ["n_srwe16"], [("A ida chega mas a resposta não volta. Causa provável?", "Falta a rota de volta no router do outro lado.")], sim=["s11"], dominio="3.0"),

    # ------------------------------------------------------------------ CCNA 3
    m("ensa1", "D", "ENSA 1", "Conceitos de OSPFv2", 4, ["Explicar o funcionamento do OSPF"],
      ["Link-state", "Pacotes e estados", "SPF e custo", "DR e BDR"],
      ["n_ensa1"], [("Em que estado ficam dois DROther entre si?", "2-Way."), ("Custo OSPF de 10 Mbit/s com referência por defeito?", "10.")], dominio="3.0"),
    m("ensa2", "D", "ENSA 2", "Configuração de OSPFv2", 7, ["Configurar e verificar OSPF de área única"],
      ["network e por interface", "Router ID", "Passive interfaces", "Custos e prioridade DR", "Rota por defeito"],
      ["m6l3"], [("Wildcard de 255.255.255.252?", "0.0.0.3."), ("Dois routers não formam vizinhança: 4 causas.", "Áreas, sub-redes, hello/dead diferentes; router ID igual; MTU; interface passiva."),
                 ("Como se escolhe o router ID sem configuração?", "Maior IP de loopback ativa; senão, maior IP de interface ativa.")],
      "R1(config)# router ospf 10\nR1(config-router)# router-id 1.1.1.1\nR1(config-router)# network 10.10.1.0 0.0.0.255 area 0\nR1(config-router)# passive-interface g0/0/0\nR1(config-router)# default-information originate\nR1# show ip ospf neighbor\nR1# show ip route ospf", sim=["s10"], dominio="3.0"),
    m("ensa3", "D", "ENSA 3", "Conceitos de segurança de rede", 4, ["Descrever ataques e criptografia"],
      ["Atores e ferramentas", "Malware e ataques", "Vulnerabilidades IP, TCP, UDP", "Criptografia: hash, simétrica, assimétrica, PKI"],
      ["n_ensa3"], [("Qual garante integridade: hash ou cifra simétrica?", "Hash."), ("O que é um SYN flood?", "Muitos SYN sem completar o handshake para esgotar o servidor.")], dominio="5.0"),
    m("ensa4", "D", "ENSA 4", "Conceitos de ACL", 4, ["Explicar ACLs e máscaras wildcard"],
      ["Filtragem e ordem", "Deny implícito", "Wildcards", "Standard × extended; onde aplicar"],
      ["n_ensa4"], [("Wildcard para 172.16.32.0/20.", "0.0.15.255."), ("Uma ACL só com deny ip host 10.1.1.5 any. O que acontece ao resto?", "Também é bloqueado (deny implícito).")], dominio="5.0"),
    m("ensa5", "D", "ENSA 5", "Configurar ACLs IPv4", 7, ["Configurar ACLs standard e extended, numeradas e nomeadas"],
      ["ACL standard", "ACL extended", "Proteger vty", "Editar ACLs nomeadas"],
      ["m8l2"], [("ACL que impeça 192.168.20.0/24 de aceder a 10.0.0.10 por HTTP e permita o resto.", "deny tcp 192.168.20.0 0.0.0.255 host 10.0.0.10 eq 80 + permit ip any any."), ("Que comando aplica uma ACL às linhas vty?", "access-class.")],
      "R1(config)# ip access-list extended FILTRO-LAN\nR1(config-ext-nacl)# permit tcp 192.168.10.0 0.0.0.255 any eq 443\nR1(config-ext-nacl)# deny ip any any log\nR1(config-if)# ip access-group FILTRO-LAN in\nR1# show access-lists", dominio="5.0"),
    m("ensa6", "D", "ENSA 6", "NAT para IPv4", 6, ["Configurar NAT estático, dinâmico e PAT"],
      ["Terminologia", "NAT estático", "NAT dinâmico", "PAT", "Port forwarding"],
      ["m7l2"], [("Com PAT, como o router distingue 50 PCs?", "Pelas portas de origem traduzidas."), ("O NAT não traduz nada. Primeira verificação?", "ip nat inside/outside nas interfaces e a ACL.")],
      "R2(config)# access-list 1 permit 192.168.0.0 0.0.255.255\nR2(config)# ip nat inside source list 1 interface s0/1/1 overload\nR2(config-if)# ip nat inside\nR2(config-if)# ip nat outside\nR2# show ip nat translations", dominio="4.0"),
    m("ensa7", "D", "ENSA 7", "Conceitos de WAN", 4, ["Comparar topologias e tecnologias WAN"],
      ["Topologias WAN", "Terminologia", "MPLS e Metro Ethernet", "DSL, cabo, fibra, 4G/5G, satélite", "SD-WAN"],
      ["n_ensa7"], [("Diferença entre MPLS e VPN pela Internet?", "MPLS é privada do operador com SLA; a VPN pela Internet é mais barata sem garantias."), ("Topologia em que as filiais só falam através da sede?", "Hub-and-spoke.")], dominio="1.0"),
    m("ensa8", "D", "ENSA 8", "VPN e IPsec", 4, ["Distinguir tipos de VPN", "Conhecer os componentes do IPsec"],
      ["Site-to-site e acesso remoto", "GRE sobre IPsec, DMVPN", "AH, ESP, IKE"],
      ["m8l4"], [("Que protocolo IPsec cifra os dados?", "ESP."), ("Porque se combina GRE com IPsec?", "O GRE transporta multicast e o IPsec cifra.")],
      "R1(config)# interface tunnel 0\nR1(config-if)# ip address 172.16.0.1 255.255.255.252\nR1(config-if)# tunnel source g0/0/1\nR1(config-if)# tunnel destination 209.165.202.2", dominio="5.0"),
    m("ensa9", "D", "ENSA 9", "Conceitos de QoS", 4, ["Explicar as ferramentas de QoS"],
      ["Atraso, jitter, perda", "Filas", "DiffServ e marcação", "Policing e shaping"],
      ["m7l4"], [("Marcação DSCP da voz?", "EF (46)."), ("Que fila dá prioridade estrita à voz?", "LLQ.")], dominio="4.0"),
    m("ensa10", "D", "ENSA 10", "Gestão da rede", 6, ["Configurar CDP, LLDP, NTP, SNMP e Syslog", "Gerir ficheiros e imagens"],
      ["CDP e LLDP", "NTP", "SNMP", "Syslog", "Backups e imagens IOS; recuperação de palavra-passe"],
      ["m7l3"], [("Nível Syslog 4?", "Warning."), ("Que versão de SNMP tem cifra?", "SNMPv3."), ("O que faz o config register 0x2142?", "Ignora a startup-config no arranque.")],
      "R1(config)# ntp server 10.10.10.10\nR1(config)# logging host 10.10.10.30\nR1(config)# snmp-server community LEITURA ro\nR1# copy running-config tftp:", dominio="4.0"),
    m("ensa11", "D", "ENSA 11", "Desenho de redes", 3, ["Desenhar redes hierárquicas e escolher equipamentos"],
      ["Hierarquia de 3 camadas", "Spine-leaf", "Redundância", "Escolha de switches e routers"],
      ["n_ensa11"], [("Desenhe a rede de uma escola com 3 edifícios e 400 PCs.", "Resposta livre: camadas, fibra entre edifícios, redundância, SVIs na distribuição.")], dominio="1.0"),
    m("ensa12", "D", "ENSA 12", "Resolução de problemas de rede", 6, ["Documentar e resolver problemas com método"],
      ["Documentação e linha de base", "Métodos de resolução", "Ferramentas", "Sintomas por camada"],
      ["n_ensa12"], [("Que método começa pela camada física?", "De baixo para cima (bottom-up).")], sim=["s11"], dominio="1.0"),
    m("ensa13", "D", "ENSA 13", "Virtualização de redes", 3, ["Explicar cloud, virtualização e SDN"],
      ["Cloud", "Hipervisores", "SDN e controladores"],
      ["n_ensa13", "m9l1"], [("Em que plano está o OSPF?", "Controlo."), ("VMware ESXi é hipervisor de que tipo?", "Tipo 1.")], dominio="6.0"),
    m("ensa14", "D", "ENSA 14", "Automação de redes", 4, ["Usar JSON, APIs REST e ferramentas de automação"],
      ["JSON, XML, YAML", "APIs REST", "Ansible, Puppet, Chef, Terraform", "NETCONF/RESTCONF e YANG", "IA nas operações"],
      ["m9l0", "m9l2", "m9l3"], [("Que código HTTP indica falta de autenticação?", "401."), ("Converta para JSON: router R1 com G0/0/0 192.168.1.1.", "{\"hostname\": \"R1\", \"interfaces\": [{\"nome\": \"G0/0/0\", \"ip\": \"192.168.1.1\"}]}")], dominio="6.0"),

    # ------------------------------------------------------------------ Complementares
    m("e1", "E", "E1", "Cabeamento estruturado", 15, ["Planear e instalar cabeamento estruturado", "Certificar e etiquetar"],
      ["Subsistemas", "Normas TIA-568 e ISO/IEC 11801", "Bastidores e patch panels", "90 m + 10 m", "Etiquetagem TIA-606", "Certificação", "PoE"],
      ["n_e1"], [("Comprimento máximo do cabo horizontal permanente?", "90 m."), ("Potência PoE do 802.3at?", "Até 30 W por porta.")]),
    m("e2", "E", "E2", "Linux para redes", 15, ["Configurar rede e serviços em Linux"],
      ["Terminal e ficheiros", "Permissões e pacotes", "ip, Netplan", "SSH, DHCP, DNS", "Firewall"],
      ["n_e2"], [("Que comando mostra as portas abertas?", "ss -tulpn."), ("Como se ativa a firewall ufw?", "sudo ufw enable.")],
      "$ ip addr show\n$ ip route show\n$ ss -tulpn\n$ sudo ufw allow 22/tcp\n$ sudo ufw enable"),
    m("e3", "E", "E3", "Análise de protocolos com Wireshark", 10, ["Capturar e analisar tráfego"],
      ["Filtros", "ARP, DHCP, DNS, TCP, HTTP, TLS", "Estatísticas", "SPAN"],
      ["n_e3"], [("Filtro para ver só pacotes SYN?", "tcp.flags.syn == 1."), ("Como se espelha uma porta para capturar num switch?", "monitor session (SPAN).")],
      "S1(config)# monitor session 1 source interface fa0/1\nS1(config)# monitor session 1 destination interface fa0/24"),
    m("e4", "E", "E4", "Cibersegurança e operações de segurança", 15, ["Conhecer ameaças, defesas e resposta a incidentes"],
      ["Tríade CIA", "Firewalls, IDS, IPS, SIEM", "Backups 3-2-1", "Resposta a incidentes", "NIST CSF e ISO 27001"],
      ["n_e4"], [("Diferença entre IDS e IPS?", "O IDS deteta e alerta; o IPS bloqueia."), ("O que diz a regra 3-2-1?", "3 cópias, 2 suportes, 1 fora do local.")]),
    m("e5", "E", "E5", "IPv6 avançado e serviços", 10, ["Planear IPv6 e configurar OSPFv3 e ACLs IPv6"],
      ["Plano IPv6", "OSPFv3", "ACL IPv6", "RA Guard", "NAT64"],
      ["n_e5"], [("Que tamanho de prefixo se dá a cada VLAN em IPv6?", "/64.")],
      "R1(config)# ipv6 router ospf 10\nR1(config-rtr)# router-id 1.1.1.1\nR1(config-if)# ipv6 ospf 10 area 0\nR1(config-if)# ipv6 traffic-filter BLOQUEAR-TELNET in"),
    m("e6", "E", "E6", "Introdução ao CCNP Enterprise", 15, ["Conhecer OSPF multiárea, EIGRP e BGP"],
      ["OSPF multiárea", "EIGRP", "BGP", "Redistribuição e VRF", "SD-Access"],
      ["n_e6"], [("O que faz um ABR?", "Liga áreas OSPF à área 0."), ("Que protocolo liga uma empresa a dois operadores na Internet?", "BGP.")],
      "R1(config)# router bgp 65001\nR1(config-router)# neighbor 203.0.113.2 remote-as 65002\nR1# show ip bgp summary"),

    # ------------------------------------------------------------------ Projeto final
    m("f1", "F", "F1", "Projeto final integrado: Hospital Municipal", 20, ["Planear, configurar e documentar uma rede completa"],
      ["Endereçamento VLSM e IPv6", "Campus com HSRP e EtherChannel", "Serviços", "OSPF e rotas por defeito", "Segurança e Wi-Fi", "Documentação"],
      ["n_f1"], [("Que critérios pesam mais na avaliação do projeto?", "VLANs/STP/EtherChannel, encaminhamento e segurança (20% cada).")], sim=["s10"]),
    m("f2", "F", "F2", "Simulados e revisão", 15, ["Rever os seis domínios do exame"],
      ["Pesos dos domínios", "Mini-simulado", "Revisão dos projetos"],
      ["n_f2"], [("Qual o endereço de rede de 172.16.77.200/21?", "172.16.72.0."), ("Diferença entre access-group e access-class?", "access-group aplica a uma interface; access-class às linhas vty.")]),
    m("f3", "F", "F3", "Plano para o exame 200-301", 5, ["Preparar o dia do exame"],
      ["Lista de verificação", "Marcação na Pearson VUE", "Gestão do tempo", "Renovação"],
      ["n_f3"], [("Por quanto tempo é válida a certificação CCNA?", "3 anos.")]),
]

# Mapeamento antigo → novo (laboratórios, casos e perguntas extra das provas antigas)
LABS_MODULO = {"lab1": "itn2", "lab2": "itn10", "lab3": "itn16", "lab4": "itn10", "lab5": "srwe3", "lab6": "srwe3",
               "lab7": "srwe4", "lab8": "srwe15", "lab9": "ensa2", "lab10": "srwe7", "lab11": "ensa6", "lab12": "srwe11"}
CASOS_MODULO = {"c01": "itn1", "c02": "itn11", "c03": "itn11", "c04": "srwe1", "c05": "srwe5", "c06": "srwe12",
                "c07": "srwe15", "c08": "ensa6", "c09": "ensa5", "c10": "srwe11", "c11": "ensa14"}
EXTRA_MODULO = {"m0": "a8", "m1": "itn4", "m2": "itn3", "m3": "itn11", "m4": "itn17", "m5": "srwe5",
                "m6": "srwe15", "m7": "ensa6", "m8": "ensa5", "m9": "ensa14"}
