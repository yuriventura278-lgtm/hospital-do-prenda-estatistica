from .base import *

MODULO = modulo(
    id="m3", numero=3, icone="calculadora",
    titulo="Endereçamento IPv4 e IPv6",
    descricao="Binário, máscaras, sub-redes, VLSM e IPv6. A base de tudo o que vem a seguir.",
    dominio="1.0 Network Fundamentals",
    licoes=[
        licao(
            "m3l1", "IPv4, binário e máscaras", 18,
            ["Converter entre decimal e binário",
             "Separar a parte de rede e a parte de host com a máscara",
             "Reconhecer endereços privados, loopback e APIPA"],
            [
                texto("Um endereço IPv4", """
<p>Um endereço IPv4 tem <b>32 bits</b>, escritos como 4 octetos em decimal: <code>192.168.10.25</code>. A <b>máscara</b> indica quantos bits pertencem à <b>rede</b>; os restantes identificam o <b>host</b>. <code>255.255.255.0</code> = <code>/24</code> (24 bits de rede, 8 de host).</p>"""),
                tabela(["Bit", "128", "64", "32", "16", "8", "4", "2", "1"], [
                    ["192 =", "1", "1", "0", "0", "0", "0", "0", "0"],
                    ["168 =", "1", "0", "1", "0", "1", "0", "0", "0"],
                    ["10 =", "0", "0", "0", "0", "1", "0", "1", "0"],
                    ["255 =", "1", "1", "1", "1", "1", "1", "1", "1"],
                ], "Os pesos de cada bit num octeto"),
                exemplo("Decimal → binário: 200", """
<p>200 ≥ 128? sim → 1, resta 72. 72 ≥ 64? sim → 1, resta 8. 32? não → 0. 16? não → 0. 8? sim → 1, resta 0. O resto é 0.</p>
<p>Resultado: <code>11001000</code>.</p>"""),
                tabela(["Máscara", "Prefixo", "Valores possíveis num octeto"], [
                    ["255.0.0.0", "/8", "Os valores válidos de um octeto de máscara:"],
                    ["255.255.0.0", "/16", "0, 128, 192, 224, 240, 248, 252, 254, 255"],
                    ["255.255.255.0", "/24", ""],
                    ["255.255.255.252", "/30", "Ligações ponto a ponto (2 hosts)"],
                ], "Máscaras comuns"),
                tabela(["Intervalo", "Uso"], [
                    ["10.0.0.0/8", "Privado (RFC 1918)"],
                    ["172.16.0.0/12 (172.16 a 172.31)", "Privado (RFC 1918)"],
                    ["192.168.0.0/16", "Privado (RFC 1918)"],
                    ["127.0.0.0/8", "Loopback (127.0.0.1 = a própria máquina)"],
                    ["169.254.0.0/16", "APIPA — o PC não recebeu IP do DHCP"],
                    ["224.0.0.0/4", "Multicast (antiga classe D)"],
                ], "Endereços especiais"),
                tabela(["Classe", "1.º octeto", "Máscara por defeito"], [
                    ["A", "1–126", "/8"], ["B", "128–191", "/16"], ["C", "192–223", "/24"], ["D", "224–239", "Multicast"], ["E", "240–255", "Experimental"],
                ], "Classes (histórico, ainda aparece no exame)"),
                dica("Se um PC mostra <code>169.254.x.x</code>, o problema é <b>DHCP</b>: o cliente não obteve resposta de nenhum servidor."),
                video("Binário e endereçamento IPv4", "endereçamento IPv4 binário máscara de rede aula"),
            ],
            [
                mc("Quanto é 11000000 em decimal?", ["128", "192", "224", "240"], 1, "128 + 64 = 192."),
                mc("Qual destes é um endereço privado?", ["172.32.1.1", "11.0.0.1", "172.20.5.9", "192.169.1.1"], 2, "172.16.0.0 a 172.31.255.255 é privado; 172.32 já não."),
                mc("/26 corresponde a que máscara?", ["255.255.255.128", "255.255.255.192", "255.255.255.224", "255.255.255.240"], 1, "26 = 24 + 2 bits → 128+64 = 192."),
                vf("Um PC com IP 169.254.20.7 provavelmente não recebeu endereço do servidor DHCP.", True, "É um endereço APIPA (link-local)."),
                mc("Quantos bits tem um endereço IPv4?", ["16", "32", "48", "128"], 1, "4 octetos × 8 bits."),
            ],
            ["rfc791", "rfc1918", "odom1", "netacad_itn"],
        ),

        licao(
            "m3l2", "Sub-redes (subnetting) sem medo", 25,
            ["Calcular endereço de rede, broadcast e intervalo de hosts",
             "Determinar quantas sub-redes e hosts um prefixo dá",
             "Usar o método do “número mágico”"],
            [
                texto("As duas fórmulas", """
<ul>
<li><b>Hosts por sub-rede</b> = 2<sup>h</sup> − 2 (h = bits de host). Tiram-se 2: o endereço de <b>rede</b> e o de <b>broadcast</b>.</li>
<li><b>Número de sub-redes</b> = 2<sup>s</sup> (s = bits emprestados ao host).</li>
</ul>"""),
                tabela(["Prefixo", "Máscara", "Bloco (nº mágico)", "Hosts úteis"], [
                    ["/24", "255.255.255.0", "256", "254"], ["/25", "255.255.255.128", "128", "126"],
                    ["/26", "255.255.255.192", "64", "62"], ["/27", "255.255.255.224", "32", "30"],
                    ["/28", "255.255.255.240", "16", "14"], ["/29", "255.255.255.248", "8", "6"],
                    ["/30", "255.255.255.252", "4", "2"], ["/31", "255.255.255.254", "2", "2 (ponto a ponto, RFC 3021)"],
                    ["/32", "255.255.255.255", "1", "1 (rota de host / loopback)"],
                ], "A tabela que vale ouro — decore-a"),
                exemplo("Método do número mágico: 192.168.10.77/27", """
<ol>
<li>Octeto “interessante”: o 4.º (onde a máscara não é 255 nem 0). Máscara = 224.</li>
<li>Número mágico = 256 − 224 = <b>32</b>. As redes andam de 32 em 32: 0, 32, 64, 96…</li>
<li>77 está entre 64 e 96 → <b>Rede: 192.168.10.64</b>.</li>
<li><b>Broadcast</b> = próxima rede − 1 = <b>192.168.10.95</b>.</li>
<li><b>Hosts</b>: 192.168.10.65 a 192.168.10.94 (30 hosts).</li>
</ol>"""),
                exemplo("Dividir 192.168.1.0/24 em 4 sub-redes iguais", """
<p>4 sub-redes → 2 bits emprestados (2² = 4) → /26, bloco 64:</p>
<ul>
<li>192.168.1.0/26 (hosts .1–.62, bc .63)</li>
<li>192.168.1.64/26 (hosts .65–.126, bc .127)</li>
<li>192.168.1.128/26 (hosts .129–.190, bc .191)</li>
<li>192.168.1.192/26 (hosts .193–.254, bc .255)</li>
</ul>"""),
                exemplo("Quando o octeto interessante é o 3.º: 172.16.45.10/20", """
<p>/20 → máscara 255.255.<b>240</b>.0. Mágico = 16 no 3.º octeto: 0, 16, 32, <b>48</b>… 45 está em 32–47.</p>
<p>Rede <b>172.16.32.0</b>, broadcast <b>172.16.47.255</b>, hosts 172.16.32.1 a 172.16.47.254 (2<sup>12</sup> − 2 = 4094).</p>"""),
                dica("Pratique todos os dias 10 minutos no <b>Desafio Sub-rede</b> (separador Jogar). No exame não há calculadora e a rapidez faz diferença."),
                video("Subnetting rápido", "subnetting fácil método número mágico CCNA"),
            ],
            [
                mc("Qual o endereço de rede de 10.1.1.130/25?", ["10.1.1.0", "10.1.1.128", "10.1.1.129", "10.1.1.255"], 1, "Bloco 128: 0 e 128. 130 está na rede .128."),
                mc("Qual o broadcast de 192.168.5.40/29?", ["192.168.5.47", "192.168.5.48", "192.168.5.39", "192.168.5.255"], 0, "Bloco 8: 40–47. Broadcast .47."),
                mc("Quantos hosts úteis tem um /28?", ["16", "14", "30", "12"], 1, "2⁴ − 2 = 14."),
                mc("Precisa de 50 hosts por sub-rede. Qual o prefixo mais eficiente?", ["/25", "/26", "/27", "/28"], 1, "/26 dá 62 hosts; /27 só dá 30."),
                vf("192.168.1.63/26 é um endereço válido para um host.", False, "É o broadcast da rede 192.168.1.0/26."),
                mc("Quantas sub-redes /27 cabem num /24?", ["4", "6", "8", "16"], 2, "3 bits emprestados → 2³ = 8."),
            ],
            ["rfc950", "rfc4632", "odom1", "lammle"],
            nivel="intermédio",
        ),

        licao(
            "m3l3", "VLSM e sumarização", 18,
            ["Planear endereçamento com máscaras de tamanho variável",
             "Evitar sobreposição de sub-redes",
             "Sumarizar rotas"],
            [
                texto("O que é VLSM", """
<p><b>VLSM</b> (Variable Length Subnet Mask) permite usar máscaras diferentes dentro do mesmo bloco, dando a cada rede apenas o tamanho de que precisa. Regra de ouro: <b>atribuir primeiro as redes maiores</b>.</p>"""),
                exemplo("Plano para 192.168.50.0/24", """
<p>Necessidades: Vendas 100 hosts, TI 50, Gestão 20, 2 ligações WAN de 2 hosts.</p>
<ol>
<li>Vendas (100) → /25 (126) → <b>192.168.50.0/25</b> (.1–.126)</li>
<li>TI (50) → /26 (62) → <b>192.168.50.128/26</b> (.129–.190)</li>
<li>Gestão (20) → /27 (30) → <b>192.168.50.192/27</b> (.193–.222)</li>
<li>WAN 1 → /30 → <b>192.168.50.224/30</b> (.225–.226)</li>
<li>WAN 2 → /30 → <b>192.168.50.228/30</b> (.229–.230)</li>
</ol>
<p>Sobra 192.168.50.232 a .255 para crescer.</p>"""),
                topologia(
                    [("r1", "router", 30, 30, "R1"), ("r2", "router", 70, 30, "R2"),
                     ("v", "switch", 12, 80, "Vendas /25"), ("t", "switch", 45, 80, "TI /26"), ("g", "switch", 85, 80, "Gestão /27")],
                    [("r1", "r2", "WAN /30"), ("r1", "v"), ("r1", "t"), ("r2", "g")],
                    "Cada rede recebe uma máscara à medida."),
                texto("Sumarização (supernetting)", """
<p>Juntar várias redes contíguas numa só rota reduz o tamanho das tabelas. Escreva as redes em binário e conte os bits iguais à esquerda.</p>
<p>Ex.: 172.16.0.0/24, 172.16.1.0/24, 172.16.2.0/24, 172.16.3.0/24 → o 3.º octeto vai de 000000<b>00</b> a 000000<b>11</b>: 22 bits iguais → <b>172.16.0.0/22</b>.</p>"""),
                alerta("Sobreposição: 10.0.0.0/25 e 10.0.0.64/26 sobrepõem-se (.64 a .127 pertencem às duas). O IOS recusa configurar sub-redes sobrepostas em interfaces diferentes do mesmo router (<i>% ... overlaps with ...</i>)."),
                video("VLSM passo a passo", "VLSM passo a passo exemplo CCNA"),
            ],
            [
                mc("Ao planear com VLSM, por onde começar?", ["Pelas redes menores", "Pelas ligações WAN", "Pelas redes maiores", "Por ordem alfabética"], 2, "Maiores primeiro evita fragmentar o espaço."),
                mc("Que prefixo é o ideal para uma ligação ponto a ponto entre dois routers (sem /31)?", ["/24", "/29", "/30", "/32"], 2, "/30 tem exatamente 2 hosts úteis."),
                mc("Sumarize 10.1.4.0/24, 10.1.5.0/24, 10.1.6.0/24 e 10.1.7.0/24.", ["10.1.4.0/22", "10.1.0.0/21", "10.1.4.0/23", "10.1.4.0/21"], 0, "4 a 7 = 000001xx → 22 bits iguais."),
                vf("192.168.1.0/26 e 192.168.1.32/27 sobrepõem-se.", True, "/26 vai de .0 a .63, que inclui .32–.63."),
            ],
            ["rfc4632", "odom1", "netacad_itn"],
            nivel="intermédio",
        ),

        licao(
            "m3l4", "IPv6 essencial", 22,
            ["Abreviar e expandir endereços IPv6",
             "Distinguir global unicast, link-local, unique local e multicast",
             "Configurar IPv6 num router, incluindo EUI-64 e SLAAC"],
            [
                figura("cabecalho_ipv6", "Cabeçalho IPv6: 40 bytes fixos, mais simples que o IPv4 (sem checksum nem fragmentação nos routers)."),
                texto("Porquê IPv6", """
<p>O IPv4 tem cerca de 4,3 mil milhões de endereços e esgotou-se. O IPv6 tem <b>128 bits</b> (3,4 × 10<sup>38</sup>), escritos em 8 grupos de 4 dígitos hexadecimais: <code>2001:0DB8:0000:0000:0000:0000:0000:0001</code>.</p>"""),
                exemplo("Regras de abreviação", """
<ol>
<li>Retirar zeros à esquerda de cada grupo: <code>0DB8</code> → <code>DB8</code>, <code>0001</code> → <code>1</code>.</li>
<li>Substituir <b>uma única</b> sequência de grupos só com zeros por <code>::</code>.</li>
</ol>
<p><code>2001:0DB8:0000:0000:0000:0000:0000:0001</code> → <b><code>2001:DB8::1</code></b></p>
<p><code>FE80:0000:0000:0000:0212:34FF:FE56:7890</code> → <b><code>FE80::212:34FF:FE56:7890</code></b></p>"""),
                tabela(["Tipo", "Prefixo", "Para que serve"], [
                    ["Global unicast", "2000::/3", "Público, encaminhável na Internet"],
                    ["Unique local", "FC00::/7 (na prática FD00::/8)", "Privado, como o RFC 1918"],
                    ["Link-local", "FE80::/10", "Só na ligação local; todas as interfaces IPv6 têm um"],
                    ["Multicast", "FF00::/8", "Grupos (FF02::1 todos os nós, FF02::2 todos os routers)"],
                    ["Loopback", "::1/128", "A própria máquina"],
                    ["Não especificado", "::/128", "Sem endereço ainda"],
                ], "Tipos de endereço IPv6 (não existe broadcast!)"),
                exemplo("EUI-64: criar o ID de interface a partir do MAC 0012.34AB.CDEF", """
<ol>
<li>Dividir o MAC ao meio e inserir <code>FFFE</code>: 0012:34<b>FF:FE</b>AB:CDEF.</li>
<li>Inverter o 7.º bit do 1.º byte: 00 = 0000 0000 → 0000 00<b>1</b>0 = 02.</li>
<li>ID de interface: <code>0212:34FF:FEAB:CDEF</code>.</li>
</ol>"""),
                cli("IPv6 num router Cisco", [
                    ("R1(config)#", "ipv6 unicast-routing", "Ativa o encaminhamento IPv6 (desligado por defeito!)."),
                    ("R1(config)#", "interface g0/0", "Entra na interface."),
                    ("R1(config-if)#", "ipv6 address 2001:db8:acad:1::1/64", "Endereço global estático."),
                    ("R1(config-if)#", "ipv6 address fe80::1 link-local", "Link-local fácil de ler (opcional)."),
                    ("R1(config-if)#", "no shutdown", "Liga a interface."),
                    ("R1(config-if)#", "interface g0/1", ""),
                    ("R1(config-if)#", "ipv6 address 2001:db8:acad:2::/64 eui-64", "O router gera o ID de interface a partir do MAC."),
                    ("R1#", "show ipv6 interface brief", "Verifica endereços e estado."),
                    ("R1(config)#", "ipv6 route ::/0 2001:db8:ffff::2", "Rota por defeito IPv6."),
                ]),
                texto("Como os PCs obtêm IPv6", """
<ul>
<li><b>SLAAC</b>: o router envia <i>Router Advertisements</i> (RA) com o prefixo; o PC cria o próprio endereço.</li>
<li><b>DHCPv6 stateless</b>: SLAAC para o endereço + DHCPv6 para DNS e outros dados.</li>
<li><b>DHCPv6 stateful</b>: o servidor DHCPv6 atribui o endereço (o gateway continua a vir do RA).</li>
</ul>
<p>Para evitar duplicados, o host faz <b>DAD</b> (Duplicate Address Detection) com mensagens NDP.</p>"""),
                sim_real(
                    ["O Packet Tracer suporta SLAAC, DHCPv6 e EUI-64, mas algumas mensagens debug não existem.",
                     "Os PCs simulados não usam endereços temporários de privacidade."],
                    ["Windows/macOS/Linux geram endereços aleatórios (privacidade, RFC 8981) em vez de EUI-64 — o endereço que vê no PC não bate com o MAC.",
                     "Em alguns switches é preciso ativar o modelo SDM para IPv6 antes de o configurar (ex.: Catalyst 2960: <code>sdm prefer dual-ipv4-and-ipv6 default</code> + reload)."]),
                video("IPv6 para CCNA", "IPv6 explicado CCNA tipos de endereço SLAAC EUI-64"),
            ],
            [
                mc("Qual é a forma abreviada correta de 2001:0DB8:0000:0000:0000:00A0:0000:0001?", ["2001:DB8::A0::1", "2001:DB8::A0:0:1", "2001:DB8:0:0:0:A:0:1", "2001:DB8::A:1"], 1, "Só se pode usar :: uma vez, e não se tiram zeros à direita (00A0 → A0)."),
                mc("Que prefixo identifica endereços link-local?", ["2000::/3", "FC00::/7", "FE80::/10", "FF00::/8"], 2, "FE80::/10."),
                vf("O IPv6 usa broadcast para descobrir vizinhos.", False, "IPv6 não tem broadcast; usa multicast (NDP)."),
                cmd("Que comando global ativa o encaminhamento IPv6 num router Cisco?", ["ipv6 unicast-routing"], "Sem ele o router não encaminha pacotes IPv6 nem envia RAs."),
                mc("No EUI-64, que valor é inserido no meio do MAC?", ["FFFF", "FFFE", "FE80", "0000"], 1, "FFFE no meio e inverte-se o 7.º bit."),
            ],
            ["rfc8200", "rfc4291", "rfc4861", "rfc4862", "odom1"],
            nivel="intermédio",
        ),
    ],
    prova_extra=[
        mc("Um host tem 172.16.18.200/21. Qual é o endereço de rede?", ["172.16.16.0", "172.16.18.0", "172.16.8.0", "172.16.0.0"], 0, "/21 → mágico 8 no 3.º octeto: 16–23. Rede 172.16.16.0."),
        mc("Qual o último host válido de 10.10.10.0/23?", ["10.10.10.254", "10.10.11.254", "10.10.11.255", "10.10.12.254"], 1, "/23 vai de 10.10.10.0 a 10.10.11.255; último host .11.254."),
        mc("Que endereço IPv6 é equivalente a um endereço privado RFC 1918?", ["Global unicast", "Unique local", "Link-local", "Multicast"], 1, "Unique local FC00::/7."),
        vf("Uma interface IPv6 pode ter vários endereços ao mesmo tempo.", True, "No mínimo um link-local, mais globais/unique local."),
    ],
)
