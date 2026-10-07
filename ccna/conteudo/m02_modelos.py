from .base import *

MODULO = modulo(
    id="m2", numero=2, icone="osi",
    titulo="Modelos OSI e TCP/IP",
    descricao="Como a comunicação se organiza em camadas: encapsulamento, TCP e UDP, Ethernet, MAC e ARP.",
    dominio="1.0 Network Fundamentals",
    licoes=[
        licao(
            "m2l1", "O modelo OSI em 7 camadas", 15,
            ["Nomear as 7 camadas e a função de cada uma",
             "Associar protocolos, equipamentos e PDUs às camadas",
             "Usar o modelo OSI para resolver problemas"],
            [
                texto("Porque usamos camadas", """
<p>O modelo <b>OSI</b> (ISO/IEC 7498-1) divide a comunicação em 7 camadas. Cada camada resolve um problema e presta serviço à camada de cima. Vantagens: fabricantes diferentes interoperam, ensina-se por partes e a resolução de problemas fica metódica.</p>
<p>Mnemónica (de cima para baixo): <b>A</b>prenda <b>A</b> <b>S</b>empre <b>T</b>udo <b>R</b>edes <b>E</b> <b>F</b>ísica — Aplicação, Apresentação, Sessão, Transporte, Rede, Enlace (ligação de dados), Física.</p>"""),
                figura("osi", "As 7 camadas do modelo OSI e o modelo TCP/IP lado a lado."),
                tabela(["#", "Camada", "Função", "PDU", "Exemplos"], [
                    ["7", "Aplicação", "Interface com as aplicações de rede", "Dados", "HTTP, DNS, SMTP, SSH"],
                    ["6", "Apresentação", "Formato, codificação, cifra", "Dados", "TLS, JPEG, ASCII"],
                    ["5", "Sessão", "Abrir, manter e fechar sessões", "Dados", "RPC, NetBIOS"],
                    ["4", "Transporte", "Entrega fim a fim, portas, fiabilidade", "Segmento / Datagrama", "TCP, UDP"],
                    ["3", "Rede", "Endereçamento lógico e encaminhamento", "Pacote", "IPv4, IPv6, ICMP, OSPF"],
                    ["2", "Ligação de dados", "Entrega no mesmo meio, MAC, deteção de erros", "Trama (frame)", "Ethernet, 802.11, PPP"],
                    ["1", "Física", "Bits em sinais elétricos, luz ou rádio", "Bits", "Cabos, conectores, hubs"],
                ]),
                exemplo("Resolução de problemas de baixo para cima", """
<p>Um utilizador diz “não tenho Internet”. Pelo modelo OSI:</p>
<ol>
<li><b>Física</b>: o cabo está ligado? A luz da porta acende?</li>
<li><b>Ligação</b>: a porta do switch está na VLAN certa? Está em err-disabled?</li>
<li><b>Rede</b>: o PC tem IP, máscara e gateway corretos? <code>ping</code> ao gateway responde?</li>
<li><b>Transporte/Aplicação</b>: o DNS resolve nomes? Uma firewall está a bloquear a porta 443?</li>
</ol>"""),
                dica("No dia a dia de redes diz-se “problema de camada 1” (cabo), “camada 2” (VLAN/MAC), “camada 3” (IP/rotas). Fale assim também."),
            ],
            [
                mc("Em que camada OSI trabalha o router?", ["2", "3", "4", "7"], 1, "Camada 3, rede: endereços IP e encaminhamento."),
                mc("A PDU da camada de ligação de dados chama-se…", ["Segmento", "Pacote", "Trama", "Bit"], 2, "Camada 2 = trama (frame)."),
                mc("TCP e UDP pertencem à camada…", ["Rede", "Transporte", "Sessão", "Aplicação"], 1, "Camada 4, transporte."),
                vf("A cifra de dados (por ex. TLS) é associada à camada de Apresentação no modelo OSI.", True,
                   "Formatos, compressão e cifra são funções da camada 6."),
                mc("Um cabo partido é um problema de que camada?", ["1", "2", "3", "7"], 0, "Camada física."),
            ],
            ["iso7498", "odom1", "kurose", "netacad_itn"],
        ),

        licao(
            "m2l2", "TCP/IP e encapsulamento", 12,
            ["Comparar o modelo TCP/IP com o OSI",
             "Descrever encapsulamento e desencapsulamento",
             "Perceber o que muda (e o que não muda) em cada salto"],
            [
                texto("O modelo que a Internet usa", """
<p>O modelo <b>TCP/IP</b> é o que realmente está implementado. Na versão de 4 camadas: <b>Aplicação</b> (OSI 5-7), <b>Transporte</b> (4), <b>Internet</b> (3) e <b>Acesso à rede</b> (1-2). Muitos livros, incluindo o guia oficial CCNA, usam a versão de <b>5 camadas</b>, que separa ligação de dados e física.</p>"""),
                figura("encapsulamento", "Encapsulamento: cada camada acrescenta o seu cabeçalho aos dados da camada de cima."),
                texto("Encapsulamento passo a passo", """
<ol>
<li>A aplicação gera os <b>dados</b> (ex.: pedido HTTP).</li>
<li>O transporte junta o cabeçalho TCP com as <b>portas</b> → <b>segmento</b>.</li>
<li>A camada de rede junta o cabeçalho IP com os <b>endereços IP</b> → <b>pacote</b>.</li>
<li>A ligação de dados junta cabeçalho e trailer Ethernet com os <b>MAC</b> e o <b>FCS</b> → <b>trama</b>.</li>
<li>A física converte em <b>bits</b> no fio.</li>
</ol>
<p>No destino faz-se o caminho inverso: <b>desencapsulamento</b>.</p>"""),
                topologia(
                    [("a", "pc", 8, 50, "PC A"), ("r1", "router", 36, 50, "R1"), ("r2", "router", 64, 50, "R2"), ("b", "servidor", 92, 50, "Servidor B")],
                    [("a", "r1", "MAC A→R1"), ("r1", "r2", "MAC R1→R2"), ("r2", "b", "MAC R2→B")],
                    "Em cada salto a trama é refeita com novos MAC; o IP de origem e destino mantém-se (sem NAT)."),
                exemplo("O que muda em cada salto?", """
<p>Quando o PC A envia um pacote ao servidor B através de R1 e R2:</p>
<ul>
<li><b>IP origem/destino</b>: <b>não mudam</b> (A → B) em todo o caminho, salvo NAT.</li>
<li><b>MAC origem/destino</b>: <b>mudam a cada salto</b> — cada router remove a trama antiga e cria uma nova para a ligação seguinte.</li>
<li><b>TTL</b> do IP: cada router diminui 1.</li>
</ul>"""),
                dica("Pergunta clássica do exame: “quando o pacote sai de R1 para R2, qual é o MAC de destino?” — o MAC da interface de <b>R2</b>, não o do servidor."),
            ],
            [
                mc("Quantas camadas tem o modelo TCP/IP original?", ["4", "5", "6", "7"], 0, "Aplicação, Transporte, Internet e Acesso à rede."),
                vf("O endereço IP de destino muda em cada router do caminho (sem NAT).", False, "Os IP mantêm-se; os MAC é que mudam a cada salto."),
                mc("Que informação é acrescentada na camada de transporte?", ["Endereços MAC", "Portas", "Endereços IP", "FCS"], 1, "TCP/UDP acrescentam portas de origem e destino."),
                mc("O processo de retirar cabeçalhos no destino chama-se…", ["Encapsulamento", "Desencapsulamento", "Fragmentação", "Multiplexagem"], 1, "Desencapsulamento."),
                vf("Cada router diminui o TTL do pacote IP em 1.", True, "Quando o TTL chega a 0 o pacote é descartado (evita loops infinitos)."),
            ],
            ["kurose", "odom1", "rfc791", "netacad_itn"],
        ),

        licao(
            "m2l3", "TCP, UDP e portas", 15,
            ["Comparar TCP e UDP",
             "Explicar o three-way handshake e o controlo de fluxo por janela",
             "Memorizar as portas mais conhecidas"],
            [
                tabela(["", "TCP", "UDP"], [
                    ["Ligação", "Orientado à ligação (handshake)", "Sem ligação"],
                    ["Fiabilidade", "Confirmações (ACK) e retransmissão", "Nenhuma — “envia e esquece”"],
                    ["Ordem", "Reordena por números de sequência", "Não garante ordem"],
                    ["Controlo de fluxo", "Janela deslizante (window)", "Não"],
                    ["Cabeçalho", "20 bytes (mínimo)", "8 bytes"],
                    ["Usos", "Web, e-mail, SSH, transferências", "Voz, vídeo em tempo real, DNS, DHCP, SNMP"],
                ], "TCP × UDP"),
                figura("handshake", "Three-way handshake do TCP: SYN, SYN-ACK, ACK. O fecho usa FIN/ACK."),
                texto("Handshake e janela", """
<p>Antes de enviar dados, o TCP faz o <b>three-way handshake</b>: o cliente envia <b>SYN</b>, o servidor responde <b>SYN-ACK</b>, o cliente confirma com <b>ACK</b>. Cada byte é numerado (<i>sequence number</i>) e o recetor confirma o que recebeu.</p>
<p>A <b>janela</b> (<i>window size</i>) diz quantos bytes podem ser enviados sem esperar confirmação. Se há perdas, a janela diminui; se corre bem, aumenta. Isto é o <b>controlo de fluxo</b>.</p>"""),
                tabela(["Porta", "Protocolo", "Transporte"], [
                    ["20/21", "FTP (dados/controlo)", "TCP"], ["22", "SSH / SCP / SFTP", "TCP"], ["23", "Telnet (inseguro)", "TCP"],
                    ["25", "SMTP", "TCP"], ["53", "DNS", "UDP e TCP"], ["67/68", "DHCP servidor/cliente", "UDP"],
                    ["69", "TFTP", "UDP"], ["80", "HTTP", "TCP"], ["110", "POP3", "TCP"], ["123", "NTP", "UDP"],
                    ["143", "IMAP", "TCP"], ["161/162", "SNMP / traps", "UDP"], ["443", "HTTPS", "TCP (e UDP no HTTP/3)"],
                    ["514", "Syslog", "UDP"], ["1812/1813", "RADIUS", "UDP"], ["49", "TACACS+", "TCP"],
                ], "Portas que tem de saber"),
                exemplo("Socket", """
<p>Uma ligação é identificada por <b>IP de origem + porta de origem + IP de destino + porta de destino + protocolo</b>. Por exemplo, o seu browser em 192.168.1.20:51344 liga a 142.250.0.10:443 (TCP). A porta de origem é <i>efémera</i> (aleatória, normalmente acima de 49152).</p>"""),
                dica("Truque: tudo o que é “tempo real” (voz, vídeo, jogos) ou “pergunta curta” (DNS, DHCP) prefere UDP."),
            ],
            [
                mc("Qual a sequência correta do handshake TCP?", ["SYN, ACK, SYN-ACK", "SYN, SYN-ACK, ACK", "ACK, SYN, FIN", "SYN, FIN, ACK"], 1, "SYN → SYN-ACK → ACK."),
                mc("Que protocolo de transporte usa normalmente a voz sobre IP?", ["TCP", "UDP", "ICMP", "ARP"], 1, "Voz tolera perdas mas não atrasos de retransmissão: UDP."),
                mc("Qual é a porta do SSH?", ["21", "22", "23", "443"], 1, "SSH = TCP 22. Telnet = 23."),
                mc("DHCP usa…", ["TCP 67/68", "UDP 67/68", "UDP 53", "TCP 80"], 1, "Servidor UDP 67, cliente UDP 68."),
                vf("O TCP usa a janela deslizante para controlo de fluxo.", True, "O window size limita o envio sem confirmação."),
            ],
            ["rfc9293", "rfc768", "kurose", "odom1"],
        ),

        licao(
            "m2l4", "Ethernet, endereços MAC e ARP", 15,
            ["Ler a estrutura de uma trama Ethernet",
             "Interpretar um endereço MAC (OUI)",
             "Explicar como o ARP descobre o MAC a partir do IP"],
            [
                figura("trama_ethernet", "Trama Ethernet II: preâmbulo, MAC destino, MAC origem, tipo, dados (46–1500 bytes) e FCS."),
                texto("Endereço MAC", """
<p>O <b>MAC</b> tem 48 bits (6 bytes), escrito em hexadecimal: <code>00:1A:2B:3C:4D:5E</code> ou, no formato Cisco, <code>001a.2b3c.4d5e</code>. Os primeiros 3 bytes são o <b>OUI</b>, que identifica o fabricante.</p>
<ul>
<li><b>Unicast</b>: um destino.</li>
<li><b>Broadcast</b>: <code>FFFF.FFFF.FFFF</code> — todos na LAN.</li>
<li><b>Multicast</b>: um grupo (ex.: <code>0100.5Exx.xxxx</code> para IPv4 multicast).</li>
</ul>
<p>O campo <b>FCS</b> (CRC) permite ao recetor detetar tramas corrompidas, que são descartadas.</p>"""),
                texto("ARP: de IP para MAC", """
<p>Para enviar um pacote na LAN o PC precisa do MAC do destino (ou do gateway, se o destino estiver noutra rede). O <b>ARP</b> resolve isso:</p>
<ol>
<li>O PC envia um <b>ARP Request</b> em broadcast: “Quem tem 192.168.1.1? Diga a 192.168.1.20”.</li>
<li>Só o dono desse IP responde com um <b>ARP Reply</b> em unicast com o seu MAC.</li>
<li>O PC guarda a resposta na <b>cache ARP</b> durante alguns minutos.</li>
</ol>"""),
                topologia(
                    [("pc", "pc", 12, 55, "PC 192.168.1.20"), ("sw", "switch", 50, 55, "SW1"), ("gw", "router", 88, 55, "GW 192.168.1.1"), ("pc2", "pc", 50, 12, "PC 192.168.1.30")],
                    [("pc", "sw", "ARP Request (broadcast)"), ("sw", "gw", ""), ("sw", "pc2", "")],
                    "O pedido ARP chega a todos; só o gateway responde."),
                saida("Cache ARP num PC Windows (arp -a)", """
Interface: 192.168.1.20 --- 0xb
  Endereço Internet     Endereço físico       Tipo
  192.168.1.1           00-1a-2b-3c-4d-5e     dinâmico
  192.168.1.255         ff-ff-ff-ff-ff-ff     estático""", "No router Cisco o equivalente é <code>show ip arp</code>."),
                cli("Ver ARP e MAC num equipamento Cisco", [
                    ("R1#", "show ip arp", "Tabela ARP do router."),
                    ("SW1#", "show mac address-table", "Tabela de endereços MAC aprendidos pelo switch."),
                    ("SW1#", "show mac address-table dynamic interface g0/1", "Filtra por porta."),
                ]),
                dica("Em IPv6 não há ARP: o mesmo papel é feito pelo <b>NDP</b> (Neighbor Solicitation / Neighbor Advertisement, em ICMPv6)."),
            ],
            [
                mc("Quantos bits tem um endereço MAC?", ["32", "48", "64", "128"], 1, "48 bits = 6 bytes."),
                mc("O MAC de broadcast é…", ["0000.0000.0000", "FFFF.FFFF.FFFF", "0100.5E00.0001", "FF00.0000.0000"], 1, "Todos os bits a 1."),
                mc("O ARP Request é enviado em…", ["Unicast", "Broadcast", "Multicast", "Anycast"], 1, "Não se sabe o MAC do destino, logo vai para todos."),
                cmd("Que comando mostra a tabela de endereços MAC num switch Cisco?", ["show mac address-table", "sh mac address-table", "show mac-address-table"],
                    "show mac address-table (em IOS antigos: show mac-address-table)."),
                vf("Os primeiros 24 bits do MAC identificam o fabricante (OUI).", True, "OUI = Organizationally Unique Identifier."),
            ],
            ["ieee8023", "rfc826", "odom1", "netacad_itn"],
        ),
    ],
    prova_extra=[
        mc("Um PC envia um pacote para um servidor noutra rede. Qual o MAC de destino na trama que sai do PC?",
           ["MAC do servidor", "MAC do gateway (router)", "FFFF.FFFF.FFFF", "MAC do switch"], 1,
           "Fora da rede local, a trama vai para o gateway; o IP de destino continua a ser o do servidor."),
        mc("Qual o tamanho mínimo do cabeçalho TCP?", ["8 bytes", "20 bytes", "40 bytes", "64 bytes"], 1, "TCP 20 bytes; UDP 8 bytes."),
        vf("O FCS de uma trama Ethernet serve para corrigir os erros detetados.", False, "Só deteta; tramas com erro são descartadas e cabe às camadas superiores (TCP) retransmitir."),
    ],
)
