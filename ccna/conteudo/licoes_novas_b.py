"""Aulas novas do conteúdo programático: CCNA 3 (ENSA), complementares e projeto final."""

from .base import *

L = {}


def reg(l):
    L[l["id"]] = l
    return l


reg(licao(
    "n_ensa1", "Como o OSPF funciona", 16,
    ["Explicar o funcionamento link-state do OSPF", "Conhecer pacotes, estados e o algoritmo SPF", "Explicar DR e BDR"],
    [
        texto("Cada router desenha o mapa", """
<p>No <b>OSPF</b> (Open Shortest Path First), cada router conta aos vizinhos que ligações tem e quanto custam. Todos juntam essa informação numa base de dados igual, a <b>LSDB</b> (o mapa da rede). Depois cada router corre o algoritmo <b>SPF de Dijkstra</b> e calcula o caminho mais curto para cada rede.</p>"""),
        tabela(["Pacote OSPF", "Para que serve"], [
            ["Hello", "Descobrir e manter vizinhos (10 s em Ethernet; dead 40 s)"],
            ["DBD", "Resumo da base de dados"], ["LSR", "Pedido de informação em falta"], ["LSU", "Envio das atualizações (LSAs)"], ["LSAck", "Confirmação"],
        ], "Os 5 tipos de pacote"),
        tabela(["Estado", "O que acontece"], [
            ["Down → Init", "Recebeu um Hello"], ["2-Way", "Vêem-se mutuamente; elegem DR/BDR"], ["ExStart → Exchange", "Trocam resumos (DBD)"],
            ["Loading", "Pedem o que falta"], ["Full", "Bases de dados iguais"],
        ], "Estados de vizinhança"),
        exemplo("Custo", """
<p>Custo = <b>100 Mbit/s ÷ largura de banda</b>. FastEthernet (100) = 1, 10 Mbit/s = 10. GigabitEthernet também dá 1 com a referência por defeito: por isso se usa <code>auto-cost reference-bandwidth 10000</code> em todos os routers.</p>"""),
        texto("DR e BDR", """
<p>Numa rede com vários routers no mesmo switch, todos falariam com todos. Para evitar isso elege-se um <b>Designated Router</b> e um <b>Backup</b>: os outros (DROther) só formam adjacência completa com eles (endereço 224.0.0.6) e ficam em 2-Way entre si.</p>"""),
    ],
    [
        mc("Que algoritmo calcula os caminhos no OSPF?", ["Bellman-Ford", "SPF de Dijkstra", "DUAL", "STP"], 1, "Dijkstra."),
        mc("Em que estado ficam dois DROther entre si?", ["Full", "2-Way", "Init", "Down"], 1, "2-Way."),
        mc("Custo OSPF de uma interface de 10 Mbit/s (referência 100)?", ["1", "10", "100", "1000"], 1, "100 ÷ 10 = 10."),
        vf("Todos os routers da mesma área têm a mesma LSDB.", True, "É isso que garante caminhos coerentes."),
    ],
    ["rfc2328", "odom2"],
    nivel="intermédio",
))

reg(licao(
    "n_ensa3", "Atores, ataques e criptografia", 18,
    ["Reconhecer atores de ameaça e ferramentas", "Descrever vulnerabilidades de IP, TCP e UDP", "Explicar hash, cifra simétrica e assimétrica"],
    [
        tabela(["Ator", "Motivação"], [["Cibercriminoso", "Dinheiro"], ["Hacktivista", "Causa política ou social"], ["Estado", "Espionagem, sabotagem"], ["Interno", "Vingança, descuido"], ["Script kiddie", "Curiosidade, fama"]], "Quem ataca"),
        tabela(["Vulnerabilidade", "Ataque"], [
            ["IP", "Spoofing de endereço, ataques ICMP, amplificação"], ["TCP", "SYN flood, reset, sequestro de sessão"], ["UDP", "Inundação UDP, ataques ao DNS"],
            ["Serviços", "ARP spoofing, envenenamento de DNS, DHCP falso"],
        ]),
        tabela(["Técnica", "Garante", "Exemplos"], [
            ["Hash", "Integridade", "SHA-256"], ["HMAC", "Integridade + autenticidade", "HMAC-SHA256"],
            ["Cifra simétrica (mesma chave)", "Confidencialidade, rápida", "AES"], ["Cifra assimétrica (par de chaves)", "Confidencialidade, assinatura, troca de chaves", "RSA, ECC"],
            ["Diffie-Hellman", "Troca segura de chaves", "DH, ECDH"], ["PKI e certificados", "Identidade", "Certificados X.509 (HTTPS)"],
        ], "Criptografia"),
        alerta("Ferramentas como Nmap, Wireshark ou Metasploit só podem ser usadas em redes próprias ou com <b>autorização escrita</b>. Usá-las em redes de terceiros é crime em muitos países."),
    ],
    [
        mc("O que garante integridade?", ["Hash", "Cifra simétrica", "NAT", "VLAN"], 0, "Hash."),
        mc("Que cifra usa a mesma chave dos dois lados?", ["Simétrica", "Assimétrica", "Hash", "PKI"], 0, "Simétrica (AES)."),
        mc("Um SYN flood ataca…", ["O handshake TCP", "O DNS", "O cabo", "O Wi-Fi"], 0, "Esgota as ligações meio abertas."),
        vf("Os certificados digitais ajudam a provar a identidade de um servidor.", True, "Assinados por uma autoridade (PKI)."),
    ],
    ["odom2", "nist", "rfc4301"],
))

reg(licao(
    "n_ensa4", "ACLs e máscaras wildcard", 16,
    ["Explicar como uma ACL é lida", "Calcular wildcards", "Escolher entre ACL standard e extended e onde aplicar"],
    [
        texto("Uma lista de regras lida de cima para baixo", """
<p>Uma <b>ACL</b> é uma lista de regras (ACE) que permitem ou negam pacotes. O router lê de cima para baixo e para na <b>primeira</b> que coincide. No fim há sempre um <b>deny any</b> invisível.</p>"""),
        exemplo("Calcular a wildcard", """
<p>Wildcard = 255.255.255.255 − máscara. Para /24: 0.0.0.255. Para /20 (255.255.240.0): <b>0.0.15.255</b>. Um 0 na wildcard = “este bit tem de ser igual”; 1 = “tanto faz”.</p>
<ul><li><code>host 10.1.1.5</code> = <code>10.1.1.5 0.0.0.0</code></li><li><code>any</code> = <code>0.0.0.0 255.255.255.255</code></li><li>Só os hosts ímpares de 192.168.1.0/24: <code>192.168.1.1 0.0.0.254</code></li></ul>"""),
        tabela(["", "Standard", "Extended"], [
            ["Números", "1–99, 1300–1999", "100–199, 2000–2699"], ["Filtra por", "Só IP de origem", "Protocolo, origem, destino, portas"],
            ["Onde aplicar", "Perto do destino", "Perto da origem"],
        ]),
        dica("Uma ACL por interface, por sentido (in/out), por protocolo (IPv4/IPv6)."),
    ],
    [
        mc("Wildcard para 172.16.32.0/20?", ["0.0.15.255", "0.0.31.255", "255.255.240.0", "0.0.0.15"], 0, "255 − 240 = 15."),
        mc("Uma ACL só com deny ip host 10.1.1.5 any. O que acontece ao resto do tráfego?", ["Passa", "É bloqueado pelo deny implícito", "É registado", "Vai para o CPU"], 1, "Deny implícito."),
        mc("Onde aplicar uma ACL extended?", ["Perto da origem", "Perto do destino", "Na consola", "Em todas as interfaces"], 0, "Evita tráfego inútil na rede."),
        vf("A ordem das regras numa ACL é importante.", True, "Para na primeira que coincide."),
    ],
    ["odom2", "netacad_ensa"],
))

reg(licao(
    "n_ensa7", "Redes de longa distância (WAN)", 16,
    ["Comparar topologias WAN", "Conhecer a terminologia e as tecnologias WAN", "Escolher uma ligação WAN"],
    [
        texto("Para que serve uma WAN", """
<p>Uma <b>WAN</b> liga redes distantes: a sede às filiais, a empresa à Internet, um banco às suas agências. Normalmente usa infraestrutura de um <b>operador</b>.</p>"""),
        topologia([("sede", "router", 50, 15, "Sede (hub)"), ("f1", "router", 15, 80, "Filial 1"), ("f2", "router", 50, 85, "Filial 2"), ("f3", "router", 85, 80, "Filial 3")],
                  [("sede", "f1"), ("sede", "f2"), ("sede", "f3")], "Hub-and-spoke: as filiais falam entre si através da sede."),
        tabela(["Topologia", "Descrição"], [["Ponto a ponto", "Ligação dedicada entre dois locais"], ["Hub-and-spoke", "Sede central e filiais"], ["Dual-homed", "Duas ligações à sede ou a dois operadores"], ["Malha completa / parcial", "Todos ligados a todos / só os importantes"]]),
        tabela(["Termo", "Significado"], [["CPE", "Equipamento no cliente"], ["DCE / DTE", "Equipamento do operador / do cliente"], ["Ponto de demarcação", "Onde acaba a responsabilidade do operador"], ["POP / CO", "Instalações do operador"]]),
        tabela(["Tecnologia", "Características"], [
            ["Linha dedicada", "Exclusiva, cara, estável"], ["MPLS", "Rede privada do operador com SLA e QoS"], ["Metro Ethernet", "Ethernet entre locais da mesma cidade"],
            ["Fibra (FTTH), DSL, cabo", "Acesso à Internet de banda larga"], ["4G/5G", "Móvel, rápida instalação, reserva"], ["Satélite (VSAT)", "Zonas remotas, latência alta"],
            ["Internet + VPN", "Barata, cifrada, sem garantias"], ["SD-WAN", "Usa várias ligações e escolhe a melhor por aplicação"],
        ], "Tecnologias WAN"),
    ],
    [
        mc("Topologia em que as filiais falam através da sede?", ["Malha completa", "Hub-and-spoke", "Ponto a ponto", "Anel"], 1, "Hub-and-spoke."),
        mc("Que tecnologia é uma rede privada do operador com SLA?", ["MPLS", "Wi-Fi", "Bluetooth", "Hub"], 0, "MPLS."),
        mc("Para uma aldeia sem cabo nem fibra, a opção típica é…", ["Satélite ou 4G/5G", "MPLS", "Cabo coaxial", "Ethernet"], 0, "Sem fios."),
        vf("O SD-WAN pode usar várias ligações e escolher a melhor por aplicação.", True, "Controlo centralizado."),
    ],
    ["odom2", "netacad_ensa"],
))

reg(licao(
    "n_ensa11", "Desenho de redes escaláveis", 14,
    ["Desenhar redes hierárquicas", "Escolher switches e routers", "Planear redundância"],
    [
        topologia(
            [("c1", "switch_l3", 35, 10, "Núcleo 1"), ("c2", "switch_l3", 65, 10, "Núcleo 2"), ("d1", "switch_l3", 20, 45, "Distrib. 1"), ("d2", "switch_l3", 80, 45, "Distrib. 2"),
             ("a1", "switch", 8, 85, "Acesso"), ("a2", "switch", 36, 85, "Acesso"), ("a3", "switch", 64, 85, "Acesso"), ("a4", "switch", 92, 85, "Acesso")],
            [("c1", "c2"), ("c1", "d1"), ("c1", "d2"), ("c2", "d1"), ("c2", "d2"), ("d1", "a1"), ("d1", "a2"), ("d2", "a3"), ("d2", "a4")],
            "Hierarquia de 3 camadas com redundância."),
        tabela(["Camada", "Função", "Equipamento típico"], [
            ["Acesso", "Liga utilizadores, PoE, port security", "Switch L2 com PoE"], ["Distribuição", "SVIs, políticas, HSRP, agregação", "Switch L3"],
            ["Núcleo", "Transporte muito rápido entre distribuições", "Switch L3 de alto desempenho"],
        ]),
        tabela(["Escolher switch", "Pergunte"], [
            ["Fixo × modular × empilhável", "Vou crescer? Preciso de redundância de fontes?"], ["Densidade de portas", "Quantas portas por bastidor?"],
            ["Velocidade e uplinks", "1 G, 10 G, SFP?"], ["PoE", "Há telefones, câmaras, APs?"], ["Camada 3", "Vou encaminhar entre VLANs?"],
        ]),
        exemplo("Escola com 3 edifícios e 400 PCs", """
<p>Um par de switches de distribuição/núcleo colapsado no edifício principal, fibra multimodo ou monomodo para cada edifício, switches de acesso com PoE para APs, VLANs por função, SVIs e HSRP na distribuição, ligação à Internet com firewall.</p>"""),
    ],
    [
        mc("Que camada liga os utilizadores?", ["Acesso", "Distribuição", "Núcleo", "WAN"], 0, "Acesso."),
        mc("Onde ficam normalmente as SVIs e o HSRP?", ["Acesso", "Distribuição", "Núcleo", "No PC"], 1, "Distribuição."),
        vf("Entre edifícios usa-se normalmente fibra ótica.", True, "Distância e isolamento elétrico."),
    ],
    ["odom1", "netacad_ensa"],
))

reg(licao(
    "n_ensa12", "Resolver problemas de rede com método", 18,
    ["Documentar a rede e criar uma linha de base", "Aplicar os métodos de resolução", "Associar sintomas às camadas"],
    [
        texto("Documentação primeiro", """
<p>Sem documentação, cada avaria é um mistério. Mantenha: topologia física e lógica, tabela de endereçamento, configurações guardadas e uma <b>linha de base</b> (o desempenho normal: CPU, tráfego, erros) para saber o que é anormal.</p>"""),
        tabela(["Passo", "O que fazer"], [
            ["1. Definir o problema", "O quê, quem, desde quando, o que mudou"], ["2. Recolher informação", "show, logs, utilizador"], ["3. Analisar", "Comparar com a linha de base"],
            ["4. Eliminar causas", "Testar teorias"], ["5. Propor hipótese", "A causa mais provável"], ["6. Testar a solução", "Com plano de reversão"], ["7. Documentar", "Causa e solução"],
        ], "Processo"),
        tabela(["Método", "Quando usar"], [
            ["De baixo para cima", "Suspeita de problema físico"], ["De cima para baixo", "Problema numa aplicação"], ["Dividir para conquistar", "Começar pela camada 3 (ping) e subir ou descer"],
            ["Seguir o caminho", "Hop a hop com traceroute"], ["Substituição", "Trocar por um equipamento que funciona"], ["Comparação", "Comparar com uma configuração boa"],
        ], "Métodos"),
        tabela(["Camada", "Sintomas"], [["1", "Sem luz, CRC, cabo"], ["2", "VLAN errada, STP, duplex"], ["3", "Sem rota, IP errado, ACL"], ["4", "Porta bloqueada"], ["7", "DNS, aplicação"]]),
        dica("Pratique com <b>Encontre a avaria</b> no Simulador de rede."),
    ],
    [
        mc("Que método começa pelo cabo e pela luz da porta?", ["De baixo para cima", "De cima para baixo", "Comparação", "Substituição"], 0, "Bottom-up."),
        mc("O que é a linha de base?", ["O desempenho normal da rede", "O primeiro cabo", "A VLAN 1", "O router principal"], 0, "Serve para comparar."),
        vf("O último passo da resolução é documentar.", True, "Para a próxima vez."),
    ],
    ["odom2", "netacad_ensa"],
))

reg(licao(
    "n_ensa13", "Cloud e virtualização", 14,
    ["Distinguir IaaS, PaaS e SaaS e tipos de cloud", "Explicar hipervisores e virtualização de servidores"],
    [
        tabela(["Serviço", "O cliente recebe", "Exemplo"], [["IaaS", "Máquinas virtuais, rede, armazenamento", "Uma VM numa cloud pública"], ["PaaS", "Plataforma para correr aplicações", "Serviço de alojamento de aplicações"], ["SaaS", "A aplicação pronta", "E-mail na web, Office online"]], "Modelos de serviço"),
        tabela(["Tipo de cloud", "Para quem"], [["Pública", "Qualquer cliente"], ["Privada", "Uma organização"], ["Híbrida", "Mistura das duas"], ["Comunitária", "Grupo com necessidades comuns"]]),
        tabela(["Hipervisor", "Corre sobre", "Exemplos"], [["Tipo 1 (bare metal)", "O hardware diretamente", "VMware ESXi, Microsoft Hyper-V, KVM"], ["Tipo 2 (hosted)", "Um sistema operativo", "VirtualBox, VMware Workstation"]]),
        texto("Virtualizar a rede", """
<p>Em servidores virtuais, a rede também é virtual: switches virtuais dentro do hipervisor, VLANs e redes overlay. A <b>SDN</b> separa o plano de controlo (decisões, num controlador) do plano de dados (encaminhamento, nos equipamentos).</p>"""),
    ],
    [
        mc("Office online é um exemplo de…", ["IaaS", "PaaS", "SaaS", "Hipervisor"], 2, "SaaS."),
        mc("VirtualBox é um hipervisor de tipo…", ["1", "2", "3", "0"], 1, "Corre sobre um sistema operativo."),
        vf("Uma cloud híbrida mistura cloud privada e pública.", True, "Exato."),
    ],
    ["odom2", "netacad_ensa"],
))

reg(licao(
    "n_e1", "Cabeamento estruturado", 22,
    ["Conhecer os subsistemas do cabeamento estruturado", "Planear bastidores, patch panels e tomadas", "Certificar e etiquetar a instalação"],
    [
        texto("Porquê cabeamento estruturado", """
<p>Em vez de cabos pendurados de qualquer maneira, o <b>cabeamento estruturado</b> segue normas (ANSI/TIA-568, ISO/IEC 11801) para que a rede seja organizada, fácil de mudar e dure 15 anos ou mais.</p>"""),
        tabela(["Subsistema", "O que é"], [
            ["Entrada do edifício", "Onde chegam os cabos do operador"], ["Sala de equipamentos", "Servidores, routers, switches principais"], ["Backbone (vertical)", "Liga os pisos e edifícios, normalmente fibra"],
            ["Bastidor de piso (sala de telecomunicações)", "Patch panels e switches de acesso"], ["Horizontal", "Do patch panel até à tomada (máx. 90 m)"], ["Área de trabalho", "Da tomada ao PC (cordão até 5 m)"],
        ], "Os subsistemas"),
        topologia([("op", "nuvem", 8, 50, "Operador"), ("se", "router", 30, 50, "Sala de equipamentos"), ("b1", "switch", 58, 20, "Bastidor piso 1"), ("b2", "switch", 58, 80, "Bastidor piso 2"),
                   ("t1", "pc", 90, 20, "Tomadas piso 1"), ("t2", "pc", 90, 80, "Tomadas piso 2")],
                  [("op", "se", "entrada"), ("se", "b1", "backbone fibra"), ("se", "b2", "backbone fibra"), ("b1", "t1", "horizontal ≤ 90 m"), ("b2", "t2", "horizontal ≤ 90 m")], "Do operador à secretária."),
        tabela(["Elemento", "Detalhe"], [
            ["Bastidor (rack) 19\"", "Altura em U (1 U = 4,45 cm): 12 U, 24 U, 42 U"], ["Patch panel", "24 ou 48 portas, com fios ligados por punch-down"],
            ["Organizadores de cabos", "Horizontais e verticais"], ["Cordões (patch cords)", "Do patch panel ao switch, curtos e etiquetados"],
            ["Tomadas keystone", "RJ45 na parede, T568B"], ["Calhas e esteiras", "Caminho dos cabos, longe de cabos elétricos"],
        ]),
        tabela(["Norma PoE", "Potência por porta", "Alimenta"], [["802.3af", "15,4 W", "Telefones IP, APs simples"], ["802.3at (PoE+)", "30 W", "APs Wi-Fi 5/6, câmaras PTZ"], ["802.3bt (PoE++)", "60–90 W", "APs Wi-Fi 6E/7, ecrãs, iluminação"]], "PoE"),
        cli("Etiquetagem e certificação", [
            ("1", "Atribuir um código a cada tomada (ex.: P1-B01-24 = piso 1, bastidor 01, porta 24)", "Segue a TIA-606."),
            ("2", "Etiquetar as duas pontas: tomada e patch panel", ""),
            ("3", "Registar numa folha: código, sala, porta do switch, VLAN", ""),
            ("4", "Certificar cada ligação com certificador", "Mapa de fios, comprimento, atenuação, NEXT."),
            ("5", "Guardar os relatórios de certificação", "São a garantia da instalação."),
        ]),
        sim_real(["O simulador não mostra bastidores, calhas nem etiquetas.", "Qualquer cabo funciona até 100 m."],
                 ["Mantenha distância de cabos elétricos e lâmpadas fluorescentes (interferência).", "Respeite o raio de curvatura dos cabos.", "Não aperte as braçadeiras demasiado: deforma o cabo e piora o desempenho.", "Deixe folga e documente tudo."]),
    ],
    [
        mc("Comprimento máximo do cabo horizontal permanente?", ["50 m", "90 m", "100 m", "300 m"], 1, "90 m + 10 m de cordões."),
        mc("Que norma define a identificação e etiquetagem?", ["TIA-606", "802.11", "RFC 1918", "802.3at"], 0, "TIA-606."),
        mc("Potência do PoE+ (802.3at)?", ["15,4 W", "30 W", "90 W", "5 W"], 1, "Até 30 W."),
        vf("O backbone entre pisos usa normalmente fibra ótica.", True, "Distância e largura de banda."),
        mc("Quantos centímetros tem 1 U num bastidor?", ["1 cm", "4,45 cm", "10 cm", "19 cm"], 1, "1,75 polegadas."),
    ],
    ["tia568", "netacad_itn"],
))

reg(licao(
    "n_e2", "Linux para técnicos de redes", 22,
    ["Usar o terminal Linux", "Configurar rede e serviços", "Proteger com firewall"],
    [
        texto("Porquê Linux", """
<p>A maioria dos servidores, firewalls, routers domésticos e equipamentos de rede corre Linux. Saber usá-lo é obrigatório para um técnico de redes. Distribuições comuns: Ubuntu, Debian, Rocky Linux.</p>"""),
        cli("Rede no Linux", [
            ("$", "ip addr show", "Interfaces e IPs (antigo: ifconfig)."),
            ("$", "ip route show", "Tabela de encaminhamento."),
            ("$", "sudo ip addr add 192.168.1.50/24 dev eth0", "IP temporário."),
            ("$", "ping -c 4 192.168.1.1", "4 pings."),
            ("$", "traceroute 8.8.8.8", ""),
            ("$", "ss -tulpn", "Portas abertas e programas."),
            ("$", "dig www.cisco.com", "Consulta DNS."),
            ("$", "sudo nano /etc/netplan/01-rede.yaml", "IP fixo permanente no Ubuntu."),
            ("$", "sudo netplan apply", ""),
        ]),
        cli("Serviços e firewall", [
            ("$", "sudo apt update && sudo apt install openssh-server", "Instalar o servidor SSH."),
            ("$", "sudo systemctl status ssh", "Estado do serviço."),
            ("$", "sudo ufw allow 22/tcp", "Permitir SSH."),
            ("$", "sudo ufw enable", "Ligar a firewall."),
            ("$", "sudo tcpdump -i eth0 icmp", "Capturar pings."),
            ("$", "journalctl -u ssh", "Logs do serviço."),
        ]),
        tabela(["Permissão", "Significa"], [["r (4)", "Ler"], ["w (2)", "Escrever"], ["x (1)", "Executar"], ["chmod 644 ficheiro", "Dono lê e escreve; outros só leem"], ["sudo", "Executar como administrador"]]),
        dica("Pratique numa máquina virtual (VirtualBox com Ubuntu Server) antes de mexer num servidor real."),
    ],
    [
        cmd("Que comando mostra os IPs das interfaces no Linux?", ["ip addr show", "ip addr", "ip a", "ifconfig"], "ip addr show."),
        mc("Que comando mostra as portas abertas?", ["ss -tulpn", "ls -l", "cd /", "pwd"], 0, "ss -tulpn."),
        mc("Que comando liga a firewall ufw?", ["sudo ufw enable", "ufw start", "firewall on", "ip ufw"], 0, "sudo ufw enable."),
        vf("sudo executa um comando com privilégios de administrador.", True, "Superuser do."),
    ],
    ["comer", "netacad_itn"],
))

reg(licao(
    "n_e3", "Analisar tráfego com o Wireshark", 18,
    ["Capturar tráfego e usar filtros", "Analisar ARP, DHCP, DNS, TCP e HTTP", "Capturar num switch com SPAN"],
    [
        texto("O que é o Wireshark", """
<p>O <b>Wireshark</b> é um analisador de protocolos gratuito: captura os pacotes que passam pela placa de rede e mostra cada campo, camada a camada. É a melhor forma de “ver” os protocolos que estudou.</p>"""),
        tabela(["Filtro de visualização", "Mostra"], [
            ["arp", "Pedidos e respostas ARP"], ["dhcp", "O DORA"], ["dns", "Consultas DNS"], ["icmp", "Pings"],
            ["tcp.flags.syn == 1", "Inícios de ligação TCP"], ["ip.addr == 192.168.1.10", "Tudo de/para esse IP"], ["tcp.port == 443", "HTTPS"], ["tcp.analysis.retransmission", "Retransmissões (problemas)"],
        ], "Filtros úteis"),
        cli("Capturar num switch (SPAN)", [
            ("S1(config)#", "monitor session 1 source interface fa0/1", "Porta a observar."),
            ("S1(config)#", "monitor session 1 destination interface fa0/24", "Porta onde liga o PC com Wireshark."),
            ("S1#", "show monitor", ""),
        ], "Num switch, o seu PC só vê o seu tráfego e os broadcasts: para ver o de outro, use SPAN."),
        exemplo("Exercício guiado", """
<ol><li>Comece a captura na placa de rede.</li><li>No Prompt: <code>ipconfig /release</code> e <code>ipconfig /renew</code>.</li><li>Filtre <code>dhcp</code>: identifique Discover, Offer, Request e Ack.</li><li>Abra um site e filtre <code>dns</code> e depois <code>tcp.flags.syn == 1</code>.</li><li>Em Statistics › Protocol Hierarchy veja que protocolos dominam.</li></ol>"""),
    ],
    [
        mc("Que filtro mostra só o DHCP?", ["dhcp", "ip", "tcp", "arp"], 0, "dhcp (ou bootp em versões antigas)."),
        mc("Para capturar o tráfego de outro PC num switch usa-se…", ["SPAN (port mirroring)", "VLAN 1", "NAT", "STP"], 0, "monitor session."),
        vf("O filtro tcp.analysis.retransmission ajuda a encontrar problemas de rede.", True, "Retransmissões indicam perdas."),
    ],
    ["kurose", "odom1"],
))

reg(licao(
    "n_e4", "Operações de cibersegurança", 20,
    ["Conhecer firewalls, IDS, IPS e SIEM", "Aplicar backups e resposta a incidentes", "Conhecer enquadramentos de segurança"],
    [
        tabela(["Defesa", "O que faz"], [
            ["Firewall stateless", "Filtra cada pacote isolado (como uma ACL)"], ["Firewall stateful", "Lembra-se das ligações e só deixa voltar as respostas"],
            ["NGFW", "Identifica aplicações e utilizadores; inclui IPS"], ["IDS", "Deteta e alerta"], ["IPS", "Deteta e bloqueia"], ["SIEM", "Junta e correlaciona logs de toda a rede"], ["EDR", "Proteção avançada nos PCs e servidores"],
        ], "Ferramentas de defesa"),
        tabela(["Fase", "Ações"], [["Preparação", "Planos, contactos, ferramentas"], ["Deteção e análise", "Alertas, confirmar o incidente"], ["Contenção", "Isolar o equipamento afetado"], ["Erradicação", "Remover a causa"], ["Recuperação", "Repor serviços e dados"], ["Lições aprendidas", "Melhorar"]], "Resposta a incidentes"),
        texto("Backups 3-2-1 e boas práticas", """
<p><b>3</b> cópias dos dados, em <b>2</b> tipos de suporte, <b>1</b> fora do local (ou offline, contra ransomware). Junte palavras-passe fortes, <b>MFA</b>, atualizações e formação. Enquadramentos: <b>NIST CSF</b> (Identificar, Proteger, Detetar, Responder, Recuperar, Governar) e <b>ISO/IEC 27001</b>.</p>"""),
        sim_real(["No Packet Tracer pode configurar uma ASA 5506-X com zonas inside/outside e DMZ."],
                 ["Teste os backups: um backup que nunca foi restaurado não é um backup.", "Tenha os contactos de emergência fora dos sistemas que podem ser cifrados."]),
    ],
    [
        mc("Diferença entre IDS e IPS?", ["O IDS bloqueia, o IPS só alerta", "O IDS alerta, o IPS bloqueia", "São iguais", "Nenhum vê tráfego"], 1, "IPS está no caminho."),
        mc("O que diz a regra 3-2-1?", ["3 cópias, 2 suportes, 1 fora do local", "3 firewalls, 2 routers, 1 switch", "3 senhas por pessoa", "Nada"], 0, "Backups."),
        mc("Primeira ação ao detetar um PC com ransomware?", ["Isolar o PC da rede", "Pagar", "Reiniciar o servidor", "Apagar os logs"], 0, "Contenção."),
        vf("Uma firewall stateful lembra-se das ligações iniciadas.", True, "E deixa voltar as respostas."),
    ],
    ["nist", "odom2"],
))

reg(licao(
    "n_e5", "IPv6 avançado: OSPFv3 e ACLs IPv6", 16,
    ["Planear endereçamento IPv6 de uma empresa", "Configurar OSPFv3 e ACLs IPv6", "Conhecer mecanismos de transição e segurança IPv6"],
    [
        exemplo("Plano IPv6", """
<p>Com o prefixo 2001:db8:20::/48: cada VLAN recebe um /64 usando os 16 bits do ID de sub-rede — VLAN 10 = 2001:db8:20:10::/64, VLAN 20 = 2001:db8:20:20::/64. Usar o número da VLAN no endereço facilita a leitura.</p>"""),
        cli("OSPFv3", [
            ("R1(config)#", "ipv6 unicast-routing", ""),
            ("R1(config)#", "ipv6 router ospf 10", ""),
            ("R1(config-rtr)#", "router-id 1.1.1.1", "O router ID continua a ser um número de 32 bits."),
            ("R1(config)#", "interface g0/0/0", ""),
            ("R1(config-if)#", "ipv6 ospf 10 area 0", "OSPFv3 ativa-se na interface."),
            ("R1#", "show ipv6 ospf neighbor", ""),
            ("R1#", "show ipv6 route ospf", ""),
        ]),
        cli("ACL IPv6", [
            ("R1(config)#", "ipv6 access-list BLOQUEAR-TELNET", "As ACL IPv6 são sempre nomeadas."),
            ("R1(config-ipv6-acl)#", "deny tcp any any eq telnet", ""),
            ("R1(config-ipv6-acl)#", "permit ipv6 any any", "Atenção: o deny implícito também bloquearia o ND, que precisa de ICMPv6."),
            ("R1(config)#", "interface g0/0/0", ""),
            ("R1(config-if)#", "ipv6 traffic-filter BLOQUEAR-TELNET in", "Em IPv6 usa-se traffic-filter."),
        ]),
        tabela(["Mecanismo", "Para quê"], [["Dual-stack", "IPv4 e IPv6 ao mesmo tempo"], ["Túneis", "IPv6 dentro de IPv4"], ["NAT64/DNS64", "Clientes só IPv6 a aceder a servidores IPv4"], ["RA Guard", "Bloqueia Router Advertisements falsos"], ["DHCPv6 Guard", "Bloqueia servidores DHCPv6 falsos"]]),
    ],
    [
        mc("Que tamanho de prefixo se dá a cada VLAN em IPv6?", ["/48", "/56", "/64", "/128"], 2, "/64."),
        mc("Como se aplica uma ACL IPv6 a uma interface?", ["ip access-group", "ipv6 traffic-filter", "access-class", "ipv6 acl"], 1, "ipv6 traffic-filter."),
        vf("No OSPFv3 ativa-se o protocolo na interface.", True, "ipv6 ospf <processo> area <n>."),
        mc("O que bloqueia o RA Guard?", ["Router Advertisements falsos", "ARP", "DNS", "HTTP"], 0, "RAs não autorizados."),
    ],
    ["rfc8200", "rfc4291", "odom1"],
    nivel="avançado",
))

reg(licao(
    "n_e6", "Introdução ao CCNP: OSPF multiárea, EIGRP e BGP", 22,
    ["Conhecer OSPF multiárea", "Conhecer EIGRP e BGP", "Saber o que estuda o CCNP Enterprise"],
    [
        texto("O passo seguinte ao CCNA", """
<p>O <b>CCNP Enterprise</b> (exame ENCOR 350-401 + um exame de especialização) aprofunda o encaminhamento, o campus, o wireless, a segurança e a automação. Aqui fica a primeira visão dos protocolos principais.</p>"""),
        tabela(["Protocolo", "Tipo", "Uso"], [
            ["OSPF multiárea", "Link-state", "Redes grandes divididas em áreas ligadas à área 0 por ABRs"], ["EIGRP", "Vetor de distância avançado (DUAL)", "Redes Cisco; convergência muito rápida (feasible successor)"],
            ["BGP", "Vetor de caminho", "Entre sistemas autónomos: liga empresas a operadores e os operadores entre si — é o protocolo da Internet"],
        ]),
        cli("Exemplos de configuração", [
            ("R1(config)#", "router ospf 1", ""),
            ("R1(config-router)#", "network 10.0.0.0 0.0.0.255 area 0", "Interfaces na área 0."),
            ("R1(config-router)#", "network 10.1.0.0 0.0.255.255 area 1", "Interfaces na área 1: R1 é ABR."),
            ("R1(config-router)#", "area 1 range 10.1.0.0 255.255.0.0", "Sumarização no ABR."),
            ("R1(config)#", "router eigrp 100", ""),
            ("R1(config-router)#", "network 172.16.0.0 0.0.255.255", ""),
            ("R1(config)#", "router bgp 65001", "AS da empresa."),
            ("R1(config-router)#", "neighbor 203.0.113.2 remote-as 65002", "Vizinho eBGP do operador."),
            ("R1(config-router)#", "network 198.51.100.0 mask 255.255.255.0", "Rede anunciada."),
            ("R1#", "show ip bgp summary", ""),
        ]),
        dica("Para laboratórios de CCNP, use o Cisco Modeling Labs (CML) ou o EVE-NG: o Packet Tracer tem suporte limitado a BGP e IS-IS."),
    ],
    [
        mc("O que faz um ABR no OSPF?", ["Liga áreas à área 0", "Atribui IPs", "Bloqueia BPDUs", "Cria VLANs"], 0, "Area Border Router."),
        mc("Que protocolo liga uma empresa a dois operadores na Internet?", ["RIP", "BGP", "STP", "HSRP"], 1, "BGP."),
        mc("Que algoritmo usa o EIGRP?", ["DUAL", "SPF", "STP", "Bellman-Ford puro"], 0, "Diffusing Update Algorithm."),
        vf("O BGP é o protocolo de encaminhamento entre sistemas autónomos da Internet.", True, "EGP da Internet."),
    ],
    ["edgeworth", "odom2"],
    nivel="avançado",
))

reg(licao(
    "n_f1", "Projeto final: rede do Hospital Municipal", 30,
    ["Planear e implementar uma rede completa", "Documentar e testar"],
    [
        texto("O desafio", """
<p>Vai desenhar e configurar a rede de um hospital, juntando tudo o que aprendeu. Faça no Packet Tracer (ou, em partes, no Simulador desta app) e entregue o ficheiro e a documentação.</p>"""),
        tabela(["Requisito", "Detalhe"], [
            ["Endereçamento", "10.20.0.0/16 com VLSM: Urgência 120, Consultas 60, Administração 30, Farmácia 14, Servidores 10, Visitantes 200, Gestão 10; IPv6 2001:db8:20::/48"],
            ["Campus", "2 switches de distribuição L3 com HSRP, 4 de acesso com EtherChannel LACP, Rapid PVST+"],
            ["VLANs", "Uma por departamento, voz nos consultórios, nativa não usada, portas livres desligadas"],
            ["Serviços", "DHCP central com relay, DNS, NTP, Syslog, TFTP"],
            ["Encaminhamento", "OSPF área 0; rota por defeito para 2 operadores (principal + flutuante)"],
            ["Segurança", "SSH com AAA local, port security, DHCP snooping, DAI, ACL que isola Farmácia e visitantes, PAT, NAT estático do portal"],
            ["Wi-Fi", "WLC com STAFF (WPA2-Enterprise) e VISITANTES (WPA2-PSK, VLAN isolada)"],
            ["Documentação", "Topologias, tabela de endereçamento, configurações, plano de testes"],
        ], "Requisitos"),
        tabela(["Critério", "Peso"], [["Endereçamento", "15%"], ["VLANs, trunks, STP, EtherChannel", "20%"], ["Encaminhamento", "20%"], ["Serviços", "10%"], ["Segurança", "20%"], ["Wi-Fi", "5%"], ["Documentação e testes", "10%"]], "Avaliação"),
        dica("Comece pelo papel: tabela de endereçamento e desenho. Configure por camadas e teste cada uma antes de passar à seguinte."),
    ],
    [
        mc("Que prefixo serve a Urgência (120 hosts)?", ["/24", "/25", "/26", "/27"], 1, "/25 = 126 hosts."),
        mc("Que protocolo dá redundância de gateway na distribuição?", ["HSRP", "STP", "DTP", "CDP"], 0, "HSRP."),
        vf("A rede de visitantes deve ficar isolada numa VLAN própria.", True, "E com ACL."),
    ],
    ["odom1", "odom2", "netacad_ensa"],
    nivel="avançado",
))

reg(licao(
    "n_f2", "Simulados e revisão dos 6 domínios", 20,
    ["Rever os domínios do exame 200-301", "Treinar com simulados"],
    [
        tabela(["Domínio do exame", "Peso", "Onde estudar"], [
            ["1.0 Network Fundamentals", "20%", "Parte A; ITN 1–17"], ["2.0 Network Access", "20%", "SRWE 1–6, 10–13"], ["3.0 IP Connectivity", "25%", "SRWE 14–16; ENSA 1–2"],
            ["4.0 IP Services", "10%", "SRWE 7–9; ENSA 6, 9, 10"], ["5.0 Security Fundamentals", "15%", "ITN 16; SRWE 10–11; ENSA 3–5, 8"], ["6.0 Automation and Programmability", "10%", "ENSA 13–14"],
        ], "Pesos do exame"),
        texto("Como rever", """
<ol><li>Refaça os projetos do CCNA 1, 2 e 3 sem consultar notas.</li><li>Faça as provas de todos os módulos até ter 900 ou mais.</li><li>Limpe o caderno de erros.</li><li>Faça simulados completos de 120 minutos e reveja cada erro.</li><li>Treine sub-redes todos os dias (Desafio sub-rede).</li></ol>"""),
    ],
    [
        mc("Qual o endereço de rede de 172.16.77.200/21?", ["172.16.72.0", "172.16.76.0", "172.16.64.0", "172.16.77.0"], 0, "Bloco 8: 72–79."),
        mc("Que domínio tem mais peso no exame?", ["Network Fundamentals", "IP Connectivity", "Automation", "IP Services"], 1, "25%."),
        mc("Quantos hosts tem um /29?", ["6", "8", "14", "30"], 0, "2³ − 2 = 6."),
        vf("access-class aplica uma ACL às linhas vty.", True, "access-group é para interfaces."),
    ],
    ["cisco_exam", "odom1", "odom2"],
))

reg(licao(
    "n_f3", "O dia do exame CCNA 200-301", 12,
    ["Preparar a marcação e o dia do exame", "Gerir o tempo durante o exame"],
    [
        tabela(["Antes", "Detalhe"], [
            ["Marcar", "Pearson VUE: centro de testes ou online (OnVUE)"], ["Identificação", "Documento oficial válido com fotografia; o nome igual ao da conta Cisco"],
            ["Online", "Sala fechada, secretária limpa, câmara e microfone, teste do sistema antes"], ["Dia anterior", "Revisão leve e dormir bem"],
        ]),
        tabela(["Durante", "Dica"], [
            ["Tempo", "120 minutos, cerca de 1 minuto por pergunta"], ["Sem voltar atrás", "Responda antes de avançar"],
            ["Palavras-chave", "NOT, BEST, FIRST, “escolha duas”"], ["Simulações", "Leia todas as tarefas antes de configurar; verifique com show"],
            ["Não sabe", "Elimine opções, escolha e siga"],
        ]),
        texto("Depois", """
<p>O resultado aparece no fim. A certificação é válida por <b>3 anos</b> e renova-se com novo exame ou créditos de formação contínua (CE). Próximos passos: CCNP Enterprise, CyberOps ou DevNet.</p>"""),
    ],
    [
        mc("Por quanto tempo é válida a certificação CCNA?", ["1 ano", "2 anos", "3 anos", "Para sempre"], 2, "3 anos."),
        vf("No exame CCNA pode voltar atrás para mudar respostas.", False, "Não é possível voltar atrás."),
        mc("Quem aplica o exame?", ["Pearson VUE", "A escola", "O operador", "O Packet Tracer"], 0, "Pearson VUE."),
    ],
    ["cisco_exam"],
))

LICOES = L
