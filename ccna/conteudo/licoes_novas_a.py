"""Aulas novas do conteúdo programático: CCNA 1 (ITN) e CCNA 2 (SRWE)."""

from .base import *

L = {}


def reg(l):
    L[l["id"]] = l
    return l


reg(licao(
    "n_itn2", "Configurar o switch e os PCs", 16,
    ["Configurar o IP de gestão de um switch", "Configurar IP, máscara e gateway num PC", "Verificar a ligação com ping"],
    [
        texto("Porque é que um switch precisa de IP?", """
<p>Um switch de camada 2 encaminha tramas sem precisar de endereço IP. Mas para o <b>gerir à distância</b> (por SSH, por exemplo) precisa de um IP. Esse IP não fica numa porta física: fica numa interface virtual chamada <b>SVI</b> (Switch Virtual Interface), normalmente <code>interface vlan 1</code> ou uma VLAN de gestão própria.</p>
<p>Também precisa de saber o <b>gateway</b> para responder a quem está noutra rede: <code>ip default-gateway</code>.</p>"""),
        cli("IP de gestão no switch", [
            ("S1(config)#", "interface vlan 1", "Entra na SVI da VLAN 1."),
            ("S1(config-if)#", "ip address 192.168.1.2 255.255.255.0", "IP de gestão do switch."),
            ("S1(config-if)#", "no shutdown", "A SVI vem desligada por defeito."),
            ("S1(config-if)#", "exit", ""),
            ("S1(config)#", "ip default-gateway 192.168.1.1", "O router da rede."),
            ("S1#", "show ip interface brief", "A Vlan1 deve aparecer up/up."),
        ]),
        texto("Configurar o IP num PC", """
<p>Cada PC precisa de quatro dados: <b>endereço IP</b>, <b>máscara</b>, <b>gateway</b> e <b>servidor DNS</b>. Podem ser escritos à mão (estático) ou recebidos automaticamente (DHCP).</p>"""),
        tabela(["Sistema", "Onde configurar o IP estático"], [
            ["Windows", "Definições › Rede e Internet › Ethernet › Editar atribuição de IP › Manual"],
            ["Linux (Ubuntu)", "Definições › Rede, ou Netplan em /etc/netplan/"],
            ["Packet Tracer", "Clique no PC › Desktop › IP Configuration › Static"],
            ["Simulador desta app", "Toque no PC › separador Configuração IP"],
        ]),
        exemplo("Uma rede pequena", """
<p>Router 192.168.1.1, switch 192.168.1.2, PC1 192.168.1.10 e PC2 192.168.1.11, todos com máscara 255.255.255.0 e gateway 192.168.1.1. Do PC1: <code>ping 192.168.1.2</code> testa o switch; <code>ping 192.168.1.11</code> testa o PC2.</p>"""),
        sim_real(["No Packet Tracer a SVI fica up assim que há uma porta ativa na VLAN 1.", "O IP do PC configura-se num formulário."],
                 ["Em empresas usa-se uma VLAN de gestão própria (ex.: 99), não a VLAN 1.", "Reserve os IPs dos equipamentos de rede fora do intervalo do DHCP.", "Documente o IP de gestão na etiqueta do equipamento."]),
        dica("Faça a atividade <b>Configuração inicial do switch</b> no Simulador de rede (separador Jogar) para praticar tudo isto."),
    ],
    [
        mc("Onde se configura o IP de gestão de um switch de camada 2?", ["Na porta Fa0/1", "Na SVI (interface vlan)", "Na consola", "No PC"], 1, "Numa interface virtual de VLAN."),
        cmd("Que comando define o gateway do switch para 192.168.1.1?", ["ip default-gateway 192.168.1.1"], "ip default-gateway 192.168.1.1."),
        mc("Que quatro dados um PC precisa para navegar?", ["IP, máscara, gateway, DNS", "MAC, porta, cabo, VLAN", "SSID, canal, banda, potência", "Só o IP"], 0, "IP, máscara, gateway e DNS."),
        vf("A SVI vem ativa por defeito num switch Cisco.", False, "Precisa de no shutdown."),
    ],
    ["odom1", "netacad_itn", "cisco_ios"],
))

reg(licao(
    "n_conectores", "Conectores e ferramentas de rede", 14,
    ["Reconhecer os conectores de cobre, fibra e consola", "Conhecer as ferramentas de cabeamento e para que servem"],
    [
        texto("Cada cabo tem o seu conector", """
<p>O <b>conector</b> é a ficha na ponta do cabo. Reconhecê-los à primeira vista é essencial: num bastidor real há dezenas de cabos e cada um tem a sua função.</p>"""),
        figura("conectores", "Os conectores mais comuns numa rede."),
        tabela(["Conector", "Cabo", "Onde se usa"], [
            ["RJ45 (8P8C)", "UTP/STP, 8 fios", "PCs, switches, routers, APs, telefones IP"],
            ["RJ11", "Telefone, 4 fios", "Linha telefónica, DSL (não serve para rede)"],
            ["LC", "Fibra (duplex, pequeno)", "Módulos SFP de switches e routers"],
            ["SC", "Fibra (quadrado, de encaixe)", "Distribuidores óticos, fibra do operador (FTTH)"],
            ["ST", "Fibra (baioneta, redondo)", "Instalações antigas"],
            ["F / BNC", "Coaxial", "TV por cabo, modems de cabo, câmaras antigas"],
            ["RJ45 consola / DB9 / USB", "Cabo de consola", "Configurar routers e switches"],
            ["Keystone", "Tomada para UTP", "Tomadas de parede e patch panels"],
        ], "Conectores"),
        figura("ferramentas_cabo", "Ferramentas de cabeamento."),
        tabela(["Ferramenta", "Para que serve"], [
            ["Alicate de crimpar (cravar)", "Prende o conector RJ45 ao cabo"],
            ["Descarnador", "Retira a capa exterior sem cortar os fios"],
            ["Alicate de corte", "Corta o cabo e acerta os fios"],
            ["Ferramenta de impacto (punch-down)", "Liga os fios a tomadas keystone e patch panels"],
            ["Testador de cabos", "Confirma a ordem dos fios e a continuidade"],
            ["Certificador", "Mede comprimento, atenuação e diafonia (NEXT) segundo a norma"],
            ["Localizador de tom (toner)", "Encontra um cabo no meio de muitos"],
            ["Medidor de potência ótica / OTDR", "Testa fibras óticas"],
        ], "Ferramentas"),
        dica("Guarde conectores RJ45 de <b>Cat 6</b> para cabo Cat 6: são diferentes dos de Cat 5e (fios mais grossos, muitas vezes com guia interna)."),
    ],
    [
        mc("Que conector se usa num cabo de rede UTP?", ["RJ11", "RJ45", "SC", "BNC"], 1, "RJ45 (8P8C)."),
        mc("Que conector de fibra é usado nos módulos SFP?", ["ST", "LC", "F", "RJ45"], 1, "LC duplex."),
        mc("Que ferramenta liga os fios a uma tomada keystone?", ["Alicate de crimpar", "Ferramenta de impacto (punch-down)", "Testador", "Descarnador"], 1, "Punch-down."),
        vf("Um conector RJ11 serve para ligar um PC a um switch.", False, "RJ11 é de telefone, 4 fios; a rede usa RJ45."),
    ],
    ["tia568", "netacad_itn", "odom1"],
))

reg(licao(
    "n_crimpar", "Crimpar cabos de rede passo a passo", 22,
    ["Crimpar um cabo direto T568B", "Fazer um cabo cruzado", "Testar o cabo e resolver erros"],
    [
        texto("O que é crimpar", """
<p><b>Crimpar</b> (ou cravar) é fixar o conector RJ45 na ponta do cabo UTP com um alicate próprio. Os 8 fios entram no conector numa ordem definida pela norma <b>T568B</b> (a mais usada) ou <b>T568A</b>. Se a ordem estiver errada, o cabo não funciona ou fica lento.</p>"""),
        figura("rj45_pinos", "As duas normas de cravação: T568A e T568B. O pino 1 fica à esquerda, com a patilha do conector virada para baixo."),
        tabela(["Pino", "T568B", "T568A"], [
            ["1", "Branco-laranja", "Branco-verde"], ["2", "Laranja", "Verde"], ["3", "Branco-verde", "Branco-laranja"], ["4", "Azul", "Azul"],
            ["5", "Branco-azul", "Branco-azul"], ["6", "Verde", "Laranja"], ["7", "Branco-castanho", "Branco-castanho"], ["8", "Castanho", "Castanho"],
        ], "Ordem dos fios"),
        cli("Crimpar um cabo direto (T568B nas duas pontas)", [
            ("1", "Medir e cortar o cabo", "Deixe 20 a 30 cm a mais. Máximo 100 m no total."),
            ("2", "Descarnar 3 cm da capa exterior", "Use o descarnador e rode uma vez; não corte os fios por dentro."),
            ("3", "Destrançar os pares e endireitar os fios", "Mantenha o entrançado até perto da capa: reduz interferências."),
            ("4", "Ordenar os fios em T568B", "Branco-laranja, laranja, branco-verde, azul, branco-azul, verde, branco-castanho, castanho."),
            ("5", "Cortar os fios a direito, com 1,2 a 1,5 cm", "Todos do mesmo tamanho; a capa tem de entrar no conector."),
            ("6", "Inserir no RJ45 com a patilha para baixo", "Empurre até cada fio tocar no fundo do conector; confira as cores pela frente."),
            ("7", "Crimpar com o alicate", "Aperte com firmeza até ao fim: os pinos dourados descem e cortam o isolamento."),
            ("8", "Repetir na outra ponta e testar", "No testador, as luzes 1 a 8 devem acender pela ordem nas duas pontas."),
        ], "Para um cabo <b>cruzado</b>, use T568A numa ponta e T568B na outra. Com Auto-MDIX quase não é preciso, mas o exame pergunta."),
        jogo_cabo("T568B"),
        tabela(["Problema no testador", "Causa", "Solução"], [
            ["Uma luz não acende", "Fio que não chegou ao fundo ou crimpagem fraca", "Corte o conector e repita"],
            ["Luzes trocadas (ex.: 3 com 6)", "Ordem errada, ou cabo cruzado sem querer", "Confira as cores e refaça"],
            ["Funciona a 100 Mbit/s mas não a 1 Gbit/s", "Pares 4-5 ou 7-8 mal ligados, ou destrançados demais", "Refaça com menos destrançado"],
            ["Cabo intermitente", "A capa não ficou presa no conector", "Refaça: a capa deve entrar no RJ45"],
        ], "Erros comuns"),
        sim_real(["No Packet Tracer escolhe o cabo (direto/cruzado) e ele já vem feito.", "Não há erros de cravação."],
                 ["Use cabo e conectores da mesma categoria (Cat 5e, 6, 6a).", "Treine com 1 m de cabo antes de fazer cabos longos.", "Use bota (capa) no conector para proteger a patilha.", "Teste SEMPRE antes de instalar; se puder, certifique."]),
        dica("Mnemónica T568B: <b>“laranja, verde, azul, castanho”</b> — sempre o branco primeiro, exceto no meio, onde o azul vem antes do branco-azul."),
    ],
    [
        mc("Qual é a cor do pino 1 em T568B?", ["Branco-verde", "Branco-laranja", "Laranja", "Azul"], 1, "Branco-laranja."),
        mc("Um cabo com T568A numa ponta e T568B na outra é…", ["Direto", "Cruzado", "De consola", "Coaxial"], 1, "Cruzado."),
        mc("Quanto deve ficar de fio destrançado dentro do conector?", ["5 cm", "Cerca de 1,2 a 1,5 cm", "Nenhum", "10 cm"], 1, "O mínimo possível, cerca de 1,2–1,5 cm."),
        vf("Os pinos 4 e 5 são azul e branco-azul nas duas normas.", True, "O par azul fica no meio em T568A e T568B."),
        mc("No testador, a luz 3 de uma ponta acende com a 6 da outra. O que se passa?", ["Cabo cruzado (ou fios trocados)", "Cabo perfeito", "Falta de energia", "Cabo de fibra"], 0, "Os pares laranja e verde estão trocados."),
    ],
    ["tia568", "ieee8023", "netacad_itn"],
))

reg(licao(
    "n_itn5", "Sistemas numéricos para IPv4 e IPv6", 18,
    ["Converter endereços IPv4 entre decimal e binário", "Converter hexadecimal para decimal e binário", "Perceber porque o IPv6 se escreve em hexadecimal"],
    [
        texto("Notação posicional", """
<p>Em decimal cada posição vale 10 vezes a anterior (1, 10, 100…). Em <b>binário</b> vale o dobro (1, 2, 4, 8, 16, 32, 64, 128). Em <b>hexadecimal</b> vale 16 vezes (1, 16, 256…). Um endereço IPv4 tem 32 bits: 4 octetos de 8 bits.</p>"""),
        tabela(["Decimal", "Binário", "Hexadecimal"], [
            ["0", "0000", "0"], ["5", "0101", "5"], ["9", "1001", "9"], ["10", "1010", "A"], ["11", "1011", "B"],
            ["12", "1100", "C"], ["13", "1101", "D"], ["14", "1110", "E"], ["15", "1111", "F"],
        ], "Os 16 símbolos do hexadecimal"),
        exemplo("Converter um IPv4 completo: 192.168.10.65", """
<ul>
<li>192 = 128 + 64 → <code>11000000</code></li>
<li>168 = 128 + 32 + 8 → <code>10101000</code></li>
<li>10 = 8 + 2 → <code>00001010</code></li>
<li>65 = 64 + 1 → <code>01000001</code></li>
</ul>
<p>Resultado: <code>11000000.10101000.00001010.01000001</code>.</p>"""),
        exemplo("Hexadecimal ↔ binário ↔ decimal", """
<p>Cada dígito hexadecimal = 4 bits. <code>A8</code> = <code>1010 1000</code> = 128 + 32 + 8 = <b>168</b>. Ao contrário: 255 = <code>1111 1111</code> = <b>FF</b>.</p>
<p>No IPv6, cada grupo tem 4 dígitos hexadecimais = 16 bits; 8 grupos = 128 bits.</p>"""),
        dica("Pratique no <b>Desafio sub-rede</b> e use a calculadora do Windows em modo Programador para conferir."),
    ],
    [
        mc("Quanto é 01000001 em decimal?", ["63", "65", "129", "33"], 1, "64 + 1 = 65."),
        mc("Quanto é 0xA8 em decimal?", ["158", "168", "178", "108"], 1, "A=10 → 10×16 + 8 = 168."),
        mc("Quantos bits representa um dígito hexadecimal?", ["2", "4", "8", "16"], 1, "4 bits."),
        vf("255 em hexadecimal é FF.", True, "15×16 + 15 = 255."),
        mc("10101100.00010000.00000001.11111110 em decimal é…", ["172.16.1.254", "172.16.1.255", "171.16.1.254", "172.32.1.254"], 0, "128+32+8+4 = 172; 16; 1; 254."),
    ],
    ["odom1", "netacad_itn", "tanenbaum_org"],
))

reg(licao(
    "n_itn6", "Camada de ligação de dados", 14,
    ["Descrever as subcamadas LLC e MAC", "Explicar half-duplex, full-duplex e acesso ao meio", "Descrever a trama e o FCS"],
    [
        texto("O que faz a camada 2", """
<p>A camada de <b>ligação de dados</b> leva a trama de um equipamento ao <b>seguinte</b> no mesmo meio (cabo ou rádio). Tem duas subcamadas: <b>LLC</b> (802.2), que fala com a camada de rede, e <b>MAC</b> (802.3 Ethernet, 802.11 Wi-Fi), que trata dos endereços físicos e do acesso ao meio.</p>"""),
        tabela(["Conceito", "Significado"], [
            ["Half-duplex", "Um de cada vez, como um walkie-talkie"],
            ["Full-duplex", "Os dois ao mesmo tempo, como um telefone"],
            ["CSMA/CD", "Escuta, transmite, deteta colisões (Ethernet antiga com hubs)"],
            ["CSMA/CA", "Escuta e evita colisões, com confirmações (Wi-Fi)"],
            ["Acesso controlado", "Cada um espera a sua vez (Token Ring, histórico)"],
        ], "Acesso ao meio"),
        figura("trama_ethernet", "A trama tem cabeçalho (endereços, tipo), dados e trailer (FCS)."),
        texto("O FCS", """
<p>O <b>FCS</b> (Frame Check Sequence) é um cálculo CRC feito pelo emissor. O recetor repete o cálculo: se der diferente, a trama chegou corrompida e é <b>descartada</b>. A camada 2 deteta erros, mas não os corrige.</p>"""),
        dica("Em redes modernas com switches e full-duplex, as colisões praticamente desapareceram. Se vir colisões numa porta, desconfie de duplex mismatch."),
    ],
    [
        mc("Que subcamada trata dos endereços físicos?", ["LLC", "MAC", "IP", "TCP"], 1, "MAC."),
        mc("Que método de acesso usa o Wi-Fi?", ["CSMA/CD", "CSMA/CA", "Token", "Nenhum"], 1, "CSMA/CA."),
        vf("O FCS corrige as tramas com erros.", False, "Só deteta; a trama é descartada."),
        mc("Comunicação em que os dois lados falam ao mesmo tempo é…", ["Half-duplex", "Full-duplex", "Simplex", "Broadcast"], 1, "Full-duplex."),
    ],
    ["ieee8023", "odom1", "netacad_itn"],
))

reg(licao(
    "n_itn8", "A camada de rede e o gateway", 16,
    ["Descrever as características do IP", "Explicar como o host decide usar o gateway", "Ler as rotas de um PC e de um router"],
    [
        texto("O IP em três palavras", """
<p>O protocolo IP é <b>sem ligação</b> (não combina nada antes de enviar), de <b>melhor esforço</b> (não garante a entrega — isso é trabalho do TCP) e <b>independente do meio</b> (funciona por cabo, fibra ou rádio).</p>"""),
        figura("cabecalho_ipv4", "Campos do cabeçalho IPv4: o TTL diminui em cada router; o campo Protocolo indica TCP (6), UDP (17) ou ICMP (1)."),
        texto("Como o PC decide para onde enviar", """
<p>O PC compara a rede do destino com a sua (usando a máscara):</p>
<ol>
<li><b>Mesma rede</b> → envia diretamente ao destino (descobre o MAC por ARP).</li>
<li><b>Outra rede</b> → envia ao <b>gateway por defeito</b> (o router), que trata do resto.</li>
</ol>
<p>Sem gateway configurado, o PC só fala com a sua própria rede.</p>"""),
        exemplo("Decisão do PC 192.168.1.10/24", """
<ul>
<li>Destino 192.168.1.50 → mesma rede → direto.</li>
<li>Destino 10.0.0.5 → outra rede → gateway 192.168.1.1.</li>
<li>Destino 8.8.8.8 → outra rede → gateway.</li>
</ul>"""),
        saida("Tabela de encaminhamento do Windows (route print, resumida)", """
Destino de rede    Máscara de rede    Gateway         Interface      Métrica
0.0.0.0            0.0.0.0            192.168.1.1     192.168.1.10   25
192.168.1.0        255.255.255.0      No vínculo      192.168.1.10   281
127.0.0.0          255.0.0.0          No vínculo      127.0.0.1      331""", "A linha 0.0.0.0 é a rota por defeito: tudo o que não é local vai para 192.168.1.1."),
        tabela(["Código no router", "Significado"], [["C", "Rede ligada diretamente"], ["L", "IP da própria interface (/32)"], ["S", "Rota estática"], ["O", "Aprendida por OSPF"], ["S*", "Rota por defeito estática"]], "show ip route"),
    ],
    [
        mc("Um PC 192.168.1.10/24 envia para 10.0.0.5. Para onde vai o pacote?", ["Diretamente para 10.0.0.5", "Para o gateway por defeito", "Para o switch", "É descartado"], 1, "Outra rede → gateway."),
        vf("O IP garante que todos os pacotes chegam.", False, "É de melhor esforço; a fiabilidade é do TCP."),
        mc("O que acontece quando o TTL chega a 0?", ["O pacote é descartado e é enviado ICMP Time Exceeded", "O pacote acelera", "O router guarda-o", "Nada"], 0, "Evita loops infinitos."),
        mc("Na tabela de um router, a letra L significa…", ["Local: o IP da própria interface", "Loop", "LAN", "Link-state"], 0, "Rota local /32."),
    ],
    ["rfc791", "rfc8200", "odom1"],
))

reg(licao(
    "n_itn9", "ARP e Neighbor Discovery em detalhe", 14,
    ["Explicar o pedido e a resposta ARP", "Saber quando o PC pede o MAC do gateway", "Conhecer o Neighbor Discovery do IPv6 e o ARP spoofing"],
    [
        texto("De IP para MAC", """
<p>Para pôr um pacote numa trama Ethernet, o PC precisa do <b>MAC de destino</b>. Se o destino está na mesma rede, pede o MAC do destino; se está noutra rede, pede o MAC do <b>gateway</b>. O protocolo que descobre isso é o <b>ARP</b>.</p>"""),
        topologia([("pc", "pc", 12, 55, "PC1 192.168.1.10"), ("sw", "switch", 50, 55, "S1"), ("r", "router", 88, 55, "R1 .1"), ("pc2", "pc", 50, 12, "PC2 192.168.1.20")],
                  [("pc", "sw", "1. Quem tem .1? (broadcast)"), ("sw", "r", "2. Sou eu (unicast)"), ("sw", "pc2", "")], "O pedido chega a todos; só o dono do IP responde."),
        saida("Cache ARP (arp -a)", """
Interface: 192.168.1.10 --- 0x4
  Endereço Internet     Endereço físico       Tipo
  192.168.1.1           00-d0-ba-8e-7a-01     dinâmico
  192.168.1.20          00-50-79-66-68-01     dinâmico"""),
        tabela(["IPv4", "IPv6 (ICMPv6)"], [
            ["ARP Request (broadcast)", "Neighbor Solicitation (multicast solicited-node)"],
            ["ARP Reply", "Neighbor Advertisement"],
            ["—", "Router Solicitation / Router Advertisement (descobrir o router e o prefixo)"],
        ], "ARP × Neighbor Discovery"),
        alerta("<b>ARP spoofing:</b> um atacante responde a pedidos ARP com o seu MAC e passa a receber o tráfego (man-in-the-middle). Defesa: Dynamic ARP Inspection nos switches (SRWE 11)."),
    ],
    [
        mc("O PC quer falar com 8.8.8.8. De quem pede o MAC por ARP?", ["De 8.8.8.8", "Do gateway", "Do switch", "De ninguém"], 1, "Destino remoto → MAC do gateway."),
        mc("O ARP Request é enviado em…", ["Unicast", "Broadcast", "Anycast", "Multicast de grupo"], 1, "Broadcast FFFF.FFFF.FFFF."),
        mc("Que mensagem IPv6 substitui o ARP Request?", ["Router Advertisement", "Neighbor Solicitation", "Echo Request", "DHCP Discover"], 1, "Neighbor Solicitation."),
        cmd("Que comando mostra a tabela ARP de um router Cisco?", ["show ip arp", "sh ip arp", "show arp"], "show ip arp."),
    ],
    ["rfc826", "rfc4861", "odom1"],
))

reg(licao(
    "n_itn13", "ICMP: ping e traceroute para testar a rede", 14,
    ["Conhecer as mensagens ICMP mais usadas", "Testar a rede por etapas", "Interpretar ping e traceroute no Windows e no IOS"],
    [
        tabela(["Mensagem ICMP", "Quando aparece"], [
            ["Echo Request / Echo Reply", "O ping: pergunta e resposta"],
            ["Destination Unreachable", "Não há rota, porta fechada ou bloqueado por ACL"],
            ["Time Exceeded", "TTL chegou a 0 (usado pelo traceroute)"],
            ["Redirect", "O router indica um caminho melhor"],
        ], "ICMPv4"),
        texto("Testar por etapas", """
<ol>
<li><code>ping 127.0.0.1</code> — a pilha TCP/IP do PC funciona?</li>
<li><code>ping</code> ao próprio IP — a placa de rede está configurada?</li>
<li><code>ping</code> ao <b>gateway</b> — a rede local funciona?</li>
<li><code>ping</code> a um host remoto — o encaminhamento funciona?</li>
<li><code>ping</code> a um nome (www.cisco.com) — o DNS funciona?</li>
</ol>"""),
        tabela(["Símbolo (IOS)", "Significado"], [["!", "Resposta recebida"], [".", "Sem resposta no tempo (timeout)"], ["U", "Destino inalcançável"], ["Q", "Origem com congestionamento"], ["M", "Não pôde fragmentar"]], "Ping no router"),
        saida("tracert no Windows", """
C:\\> tracert 192.168.11.10
  1    <1 ms    <1 ms    <1 ms  192.168.10.1
  2     1 ms     1 ms     1 ms  10.0.0.2
  3     2 ms     1 ms     2 ms  192.168.11.10
Rastreio concluído.""", "Cada linha é um router (salto). Asteriscos * * * mostram onde o caminho para."),
        dica("No simulador desta app pode fazer ping e tracert de qualquer PC e ver o pacote a andar pelos cabos."),
    ],
    [
        mc("O ping a 127.0.0.1 falha. Onde está o problema?", ["No router", "Na pilha TCP/IP do próprio PC", "No DNS", "No cabo"], 1, "O loopback não sai do PC."),
        mc("Que mensagem ICMP o traceroute usa para descobrir cada salto?", ["Echo Reply", "Time Exceeded", "Redirect", "Source Quench"], 1, "Time Exceeded quando o TTL expira."),
        mc("No ping do IOS, “U” significa…", ["Sucesso", "Timeout", "Destino inalcançável", "Desconhecido"], 2, "Unreachable."),
        vf("Se o ping ao gateway funciona mas o ping a um nome falha, pode ser um problema de DNS.", True, "Teste o ping ao IP do destino para confirmar."),
    ],
    ["rfc792", "odom1", "netacad_itn"],
))

reg(licao(
    "n_itn15", "Camada de aplicação: web, e-mail, DNS e ficheiros", 15,
    ["Descrever HTTP/HTTPS, e-mail, DNS, DHCP e FTP", "Comparar cliente-servidor e peer-to-peer"],
    [
        texto("Cliente-servidor e P2P", """
<p>No modelo <b>cliente-servidor</b>, o cliente pede e o servidor responde (o browser pede a página ao servidor web). No <b>peer-to-peer</b> (P2P) cada equipamento é cliente e servidor ao mesmo tempo (partilha de ficheiros entre PCs).</p>"""),
        tabela(["Serviço", "Protocolo", "Porta", "Como funciona"], [
            ["Web", "HTTP / HTTPS", "80 / 443", "O browser pede uma página por um URL (https://site.ao/pagina)"],
            ["Enviar e-mail", "SMTP", "25 (587)", "O cliente envia ao servidor de correio"],
            ["Receber e-mail", "POP3 / IMAP", "110 / 143", "POP3 descarrega; IMAP mantém no servidor e sincroniza"],
            ["Nomes", "DNS", "53", "Traduz nomes em IP; registos A, AAAA, CNAME, MX, NS, PTR"],
            ["Endereços", "DHCP", "67/68", "Dá IP automaticamente (DORA)"],
            ["Ficheiros", "FTP / SMB", "20-21 / 445", "Transferir e partilhar ficheiros"],
        ], "Serviços da camada de aplicação"),
        exemplo("O que acontece ao abrir https://www.cisco.com", """
<ol><li>DNS: o PC pergunta o IP de www.cisco.com.</li><li>TCP: handshake com o servidor na porta 443.</li><li>TLS: combina a cifra e verifica o certificado.</li><li>HTTP: pede a página (GET) e recebe a resposta (200 OK).</li></ol>"""),
        cli("Comandos úteis no PC", [
            ("C:\\>", "nslookup www.cisco.com", "Pergunta ao DNS."),
            ("C:\\>", "ipconfig /displaydns", "Mostra a cache DNS do PC."),
            ("C:\\>", "ipconfig /flushdns", "Limpa a cache DNS."),
            ("C:\\>", "ipconfig /release", "Liberta o IP do DHCP."),
            ("C:\\>", "ipconfig /renew", "Pede novo IP ao DHCP."),
        ]),
    ],
    [
        mc("Que registo DNS indica o servidor de correio?", ["A", "MX", "CNAME", "PTR"], 1, "MX = Mail Exchanger."),
        mc("Que protocolo mantém o e-mail no servidor e sincroniza vários dispositivos?", ["POP3", "IMAP", "SMTP", "FTP"], 1, "IMAP."),
        mc("Porta do HTTPS?", ["80", "443", "21", "53"], 1, "443."),
        vf("No modelo P2P um equipamento pode ser cliente e servidor ao mesmo tempo.", True, "Cada par partilha e pede."),
    ],
    ["kurose", "rfc1034", "rfc2131"],
))

reg(licao(
    "n_itn16", "Ataques comuns e como endurecer os equipamentos", 16,
    ["Reconhecer ataques de reconhecimento, acesso e DoS", "Aplicar as boas práticas de segurança num router e num switch"],
    [
        tabela(["Tipo de ataque", "Exemplo", "Defesa"], [
            ["Reconhecimento", "Varrimento de portas (Nmap), consultas whois", "Firewall, desligar serviços não usados"],
            ["Acesso", "Adivinhar palavras-passe, man-in-the-middle", "Palavras-passe fortes, SSH, bloqueio de tentativas"],
            ["Negação de serviço (DoS/DDoS)", "Inundar um servidor com tráfego", "Filtros no operador, IPS, capacidade de reserva"],
            ["Malware", "Vírus, worms, trojans, ransomware", "Antivírus, atualizações, backups"],
            ["Engenharia social", "Phishing, alguém a fingir ser técnico", "Formação dos utilizadores"],
        ], "Ataques e defesas"),
        texto("Defesa em profundidade", """
<p>Nenhuma medida sozinha chega. Usam-se várias camadas: segurança física (bastidor fechado), palavras-passe e AAA, SSH, firewalls, atualizações, backups e formação das pessoas.</p>"""),
        cli("Endurecer um router", [
            ("R1(config)#", "security passwords min-length 10", "Palavras-passe com pelo menos 10 caracteres."),
            ("R1(config)#", "login block-for 120 attempts 3 within 60", "Bloqueia 120 s após 3 falhas em 60 s."),
            ("R1(config)#", "service password-encryption", ""),
            ("R1(config)#", "ip domain-name escola.local", ""),
            ("R1(config)#", "username admin secret Adm!n#2026", ""),
            ("R1(config)#", "crypto key generate rsa modulus 2048", ""),
            ("R1(config)#", "ip ssh version 2", ""),
            ("R1(config)#", "line vty 0 4", ""),
            ("R1(config-line)#", "login local", ""),
            ("R1(config-line)#", "transport input ssh", "Só SSH."),
            ("R1(config-line)#", "exec-timeout 5 0", "Fecha sessões inativas ao fim de 5 min."),
            ("R1(config)#", "no ip http server", "Desliga serviços que não usa."),
        ]),
        sim_real(["No Packet Tracer alguns comandos (login block-for) podem não existir.", "Os ataques não são simulados."],
                 ["Mude SEMPRE as palavras-passe de fábrica.", "Guarde as configurações e as palavras-passe num cofre seguro.", "Atualize o IOS quando a Cisco publica falhas de segurança."]),
    ],
    [
        mc("Que ataque procura portas abertas num servidor?", ["Reconhecimento", "DoS", "Ransomware", "Phishing"], 0, "Varrimento de portas."),
        cmd("Que comando obriga palavras-passe com pelo menos 10 caracteres?", ["security passwords min-length 10"], "security passwords min-length 10."),
        vf("Defesa em profundidade significa usar várias camadas de proteção.", True, "Nenhuma medida sozinha chega."),
        mc("Porque se desliga o Telnet?", ["É lento", "Envia palavras-passe em texto claro", "Não funciona em IPv6", "É caro"], 1, "Sem cifra."),
    ],
    ["odom2", "nist", "netacad_itn"],
))

reg(licao(
    "n_srwe1", "Gestão remota e problemas de interface", 15,
    ["Configurar uma VLAN de gestão com SSH", "Ler os contadores de erro das interfaces", "Filtrar a saída dos comandos show"],
    [
        texto("Arranque e gestão do switch", """
<p>Ao ligar, o switch faz o <b>POST</b>, carrega o <b>boot loader</b>, o IOS da flash (variável <code>BOOT</code>) e a configuração. A gestão remota usa uma SVI numa <b>VLAN de gestão</b> (ex.: 99) com <b>SSH</b>.</p>"""),
        cli("VLAN de gestão com IPv4 e IPv6", [
            ("S1(config)#", "interface vlan 99", ""),
            ("S1(config-if)#", "ip address 172.17.99.11 255.255.255.0", ""),
            ("S1(config-if)#", "ipv6 address 2001:db8:acad:99::11/64", ""),
            ("S1(config-if)#", "no shutdown", ""),
            ("S1(config)#", "ip default-gateway 172.17.99.1", ""),
        ]),
        tabela(["Contador", "Significa", "Causa provável"], [
            ["Input errors / CRC", "Tramas corrompidas", "Cabo danificado, interferência, conector mal crimpado"],
            ["Runts", "Tramas menores que 64 bytes", "Colisões, placa avariada"],
            ["Giants", "Tramas maiores que o permitido", "MTU diferente, placa avariada"],
            ["Late collisions", "Colisões tardias", "Duplex mismatch ou cabo longo demais"],
            ["Output errors", "Erros ao enviar", "Congestionamento, problemas de duplex"],
        ], "show interfaces"),
        cli("Filtrar saídas", [
            ("S1#", "show running-config | include hostname", "Só as linhas com a palavra."),
            ("S1#", "show running-config | section line vty", "Só uma secção."),
            ("S1#", "show running-config | begin interface", "A partir da primeira ocorrência."),
            ("S1#", "show ip interface brief | exclude unassigned", "Esconde as linhas com a palavra."),
            ("S1#", "terminal history size 200", "Aumenta o histórico."),
        ]),
    ],
    [
        mc("Muitos CRC numa porta indicam normalmente…", ["Problema físico (cabo/interferência)", "Falta de VLAN", "Senha errada", "DHCP"], 0, "Camada 1."),
        mc("Late collisions indicam normalmente…", ["Duplex mismatch", "VLAN errada", "Falta de rota", "Senha errada"], 0, "Um lado half, outro full."),
        cmd("Que filtro mostra só as linhas que contêm uma palavra?", ["| include", "include"], "| include palavra."),
        vf("A gestão remota do switch usa uma SVI.", True, "Ex.: interface vlan 99."),
    ],
    ["odom1", "netacad_srwe", "cisco_ios"],
))

reg(licao(
    "n_srwe2", "Conceitos de comutação", 12,
    ["Explicar como o switch encaminha tramas", "Comparar store-and-forward e cut-through", "Contar domínios de colisão e de broadcast"],
    [
        texto("Do hub ao switch", """
<p>O <b>hub</b> repetia tudo para todas as portas: um único domínio de colisão. O <b>switch</b> aprende os MAC e envia só para a porta certa: cada porta é um domínio de colisão, e com full-duplex as colisões desaparecem.</p>"""),
        tabela(["Método", "Como funciona", "Vantagem", "Desvantagem"], [
            ["Store-and-forward", "Recebe a trama inteira e verifica o FCS", "Não propaga erros", "Mais latência"],
            ["Cut-through (fast-forward)", "Envia logo após ler o MAC de destino", "Latência mínima", "Propaga tramas com erros"],
            ["Fragment-free", "Envia após os primeiros 64 bytes", "Filtra a maioria das colisões", "Intermédio"],
        ], "Métodos de comutação"),
        tabela(["Equipamento", "Domínios de colisão", "Domínios de broadcast"], [
            ["Hub de 8 portas", "1", "1"], ["Switch de 24 portas (1 VLAN)", "24", "1"], ["Switch com 3 VLANs", "1 por porta", "3"], ["Router com 4 interfaces", "4", "4"],
        ], "Contar domínios"),
        texto("Como o switch alivia o congestionamento", """
<ul><li>Full-duplex em cada porta.</li><li>Buffers por porta ou partilhados.</li><li>Muitas portas e uplinks rápidos (1/10 Gbit/s).</li><li>Comutação em hardware (ASIC).</li></ul>"""),
    ],
    [
        mc("Quantos domínios de broadcast tem um switch com 3 VLANs?", ["1", "3", "24", "0"], 1, "Uma VLAN = um domínio de broadcast."),
        mc("Que método verifica o FCS antes de encaminhar?", ["Cut-through", "Store-and-forward", "Fragment-free", "Flooding"], 1, "Store-and-forward."),
        mc("Quantos domínios de colisão tem um hub de 8 portas?", ["1", "8", "16", "0"], 0, "Todas as portas partilham o meio."),
        vf("Cada porta de um switch é um domínio de colisão separado.", True, "E com full-duplex não há colisões."),
    ],
    ["odom1", "netacad_srwe"],
))

reg(licao(
    "n_srwe8", "SLAAC e DHCPv6", 16,
    ["Explicar as flags do Router Advertisement", "Configurar SLAAC, DHCPv6 stateless e stateful", "Configurar relay DHCPv6"],
    [
        texto("Como um PC obtém IPv6", """
<p>O router envia periodicamente <b>Router Advertisements</b> (RA) com o prefixo da rede e três flags que dizem ao PC o que fazer:</p>
<ul><li><b>A</b> (autonomous): crie o seu próprio endereço com o prefixo (SLAAC).</li><li><b>O</b> (other): peça outras informações (DNS) a um servidor DHCPv6.</li><li><b>M</b> (managed): peça o endereço a um servidor DHCPv6.</li></ul>
<p>O <b>gateway</b> vem sempre do RA: é o endereço link-local do router.</p>"""),
        tabela(["Método", "Flags", "Endereço vem de", "DNS vem de"], [
            ["SLAAC", "A=1, O=0, M=0", "O próprio PC (prefixo + ID)", "RA (RDNSS) ou manual"],
            ["SLAAC + DHCPv6 stateless", "A=1, O=1", "O próprio PC", "Servidor DHCPv6"],
            ["DHCPv6 stateful", "M=1 (A=0)", "Servidor DHCPv6", "Servidor DHCPv6"],
        ], "Três métodos"),
        cli("DHCPv6 stateless", [
            ("R1(config)#", "ipv6 unicast-routing", ""),
            ("R1(config)#", "ipv6 dhcp pool STATELESS", ""),
            ("R1(config-dhcpv6)#", "dns-server 2001:db8:acad:1::254", ""),
            ("R1(config-dhcpv6)#", "domain-name empresa.local", ""),
            ("R1(config)#", "interface g0/0/1", ""),
            ("R1(config-if)#", "ipv6 nd other-config-flag", "O=1."),
            ("R1(config-if)#", "ipv6 dhcp server STATELESS", ""),
        ]),
        cli("DHCPv6 stateful e relay", [
            ("R1(config)#", "ipv6 dhcp pool STATEFUL", ""),
            ("R1(config-dhcpv6)#", "address prefix 2001:db8:acad:2::/64", ""),
            ("R1(config-dhcpv6)#", "dns-server 2001:db8:acad:1::254", ""),
            ("R1(config)#", "interface g0/0/0", ""),
            ("R1(config-if)#", "ipv6 nd managed-config-flag", "M=1."),
            ("R1(config-if)#", "ipv6 nd prefix default no-autoconfig", "A=0."),
            ("R1(config-if)#", "ipv6 dhcp server STATEFUL", ""),
            ("R2(config-if)#", "ipv6 dhcp relay destination 2001:db8:acad:1::1 g0/0/0", "Relay noutra rede."),
            ("R1#", "show ipv6 dhcp binding", ""),
        ]),
    ],
    [
        mc("Que flag do RA indica DHCPv6 stateful?", ["A", "O", "M", "R"], 2, "M = managed."),
        mc("No DHCPv6 stateful, de onde vem o gateway?", ["Do servidor DHCPv6", "Do Router Advertisement", "Do DNS", "Manual"], 1, "Sempre do RA."),
        mc("Em SLAAC + stateless, o DNS vem de…", ["Um servidor DHCPv6", "O PC inventa", "O switch", "ARP"], 0, "O=1: outras informações por DHCPv6."),
        vf("Com SLAAC o PC cria o seu próprio endereço a partir do prefixo anunciado.", True, "Prefixo + ID de interface (EUI-64 ou aleatório)."),
    ],
    ["rfc4862", "rfc4861", "odom1"],
    nivel="intermédio",
))

reg(licao(
    "n_srwe13", "Configurar Wi-Fi: router doméstico e WLC", 18,
    ["Configurar um router sem fios doméstico com segurança", "Criar WLANs numa WLC", "Resolver problemas de Wi-Fi"],
    [
        cli("Router Wi-Fi doméstico (interface web)", [
            ("1", "Entrar em 192.168.0.1 (ou o endereço da etiqueta)", "Use o cabo ou o Wi-Fi de fábrica."),
            ("2", "Mudar a palavra-passe de administração", "Nunca deixe a de fábrica."),
            ("3", "Definir o SSID e a segurança WPA2/WPA3-Personal com AES", "Palavra-passe com 12 ou mais caracteres."),
            ("4", "Escolher o canal (1, 6 ou 11 em 2,4 GHz) ou automático", ""),
            ("5", "Configurar o DHCP da LAN (intervalo e DNS)", ""),
            ("6", "Desligar o WPS e atualizar o firmware", "O WPS é vulnerável."),
        ]),
        cli("WLAN numa WLC (Packet Tracer: WLC-2504)", [
            ("GUI", "Configurar a interface de gestão da WLC e ligar os APs leves (LAP)", "Os LAP descobrem a WLC por DHCP/broadcast."),
            ("GUI", "WLANs › Create New: perfil, SSID e ID", ""),
            ("GUI", "General: Status Enabled; Interface = interface dinâmica da VLAN", ""),
            ("GUI", "Security › Layer 2: WPA2 + AES, PSK", "Para hóspedes ou alunos."),
            ("GUI", "Security › AAA Servers: servidor RADIUS", "Para WPA2-Enterprise (802.1X)."),
            ("GUI", "Apply e testar com um portátil", ""),
        ]),
        tabela(["Sintoma", "Causa provável"], [
            ["Não vê o SSID", "Fora de alcance, SSID oculto, AP desligado"],
            ["Vê, mas não liga", "Palavra-passe errada, segurança incompatível (WPA3 em placa antiga)"],
            ["Liga, mas sem IP", "DHCP da VLAN não funciona"],
            ["Lento", "Interferência de canal, muitos clientes, sinal fraco"],
        ], "Problemas de Wi-Fi"),
    ],
    [
        mc("Qual a primeira coisa a mudar num router Wi-Fi novo?", ["O canal", "A palavra-passe de administração", "A cor dos LEDs", "O DNS"], 1, "A palavra-passe de fábrica é pública."),
        mc("Que segurança escolher num router doméstico atual?", ["WEP", "WPA-TKIP", "WPA2/WPA3 com AES", "Aberta"], 2, "WPA2 ou WPA3 com AES."),
        vf("O WPS deve ficar desligado por ser vulnerável.", True, "O PIN do WPS pode ser descoberto."),
        mc("Para WPA2-Enterprise, a WLC precisa de…", ["Um servidor RADIUS", "Um servidor DNS", "Um hub", "IPv6"], 0, "802.1X com RADIUS."),
    ],
    ["ieee80211", "wifi_alliance", "netacad_srwe"],
))

reg(licao(
    "n_srwe16", "Resolver problemas de rotas estáticas", 14,
    ["Diagnosticar rotas estáticas e por defeito", "Corrigir os erros mais comuns"],
    [
        texto("O que faz uma rota estática desaparecer", """
<ul><li>A interface de saída foi desligada ou o cabo caiu.</li><li>O next hop deixou de ser alcançável.</li><li>A rota foi escrita com máscara ou next hop errados.</li></ul>"""),
        tabela(["Erro", "Sintoma", "Como detetar"], [
            ["Falta a rota de volta", "O pedido chega, a resposta não", "ping do router do outro lado para a origem falha"],
            ["Máscara errada", "Só parte da rede é alcançável", "show ip route mostra o prefixo errado"],
            ["Next hop errado", "Rota não entra na tabela ou envia para o sítio errado", "show ip route static; traceroute"],
            ["Interface em baixo", "Rota desaparece", "show ip interface brief"],
            ["Gateway errado no PC", "PC só fala com a própria rede", "ipconfig no PC"],
        ], "Erros comuns"),
        cli("Sequência de diagnóstico", [
            ("C:\\>", "tracert 192.168.3.10", "Onde para?"),
            ("R1#", "show ip route", "Existe rota para o destino?"),
            ("R1#", "show ip interface brief", "A interface de saída está up/up?"),
            ("R1#", "ping 10.0.12.2", "O next hop responde?"),
            ("R2#", "show ip route", "R2 sabe voltar à origem?"),
            ("R2#", "show running-config | include ip route", "As rotas estão bem escritas?"),
        ]),
        dica("Pratique com a atividade <b>Encontre a avaria</b> no Simulador de rede."),
    ],
    [
        mc("A ida chega mas a resposta não volta. Causa mais provável?", ["Falta a rota de volta", "Cabo errado", "DNS", "VLAN"], 0, "O tráfego tem dois sentidos."),
        cmd("Que comando mostra só as rotas estáticas?", ["show ip route static", "sh ip route static"], "show ip route static."),
        vf("Uma rota estática com next hop inalcançável não entra na tabela.", True, "O next hop tem de ser resolúvel."),
        mc("Que ferramenta mostra em que salto o caminho para?", ["traceroute", "ipconfig", "arp", "nslookup"], 0, "traceroute/tracert."),
    ],
    ["odom2", "netacad_srwe"],
))

LICOES = L
