from .base import *

MODULO = modulo(
    id="m7", numero=7, icone="servidor",
    titulo="Serviços IP",
    descricao="DHCP, DNS, NAT, NTP, SNMP, Syslog, transferência de ficheiros e QoS.",
    dominio="4.0 IP Services",
    licoes=[
        licao(
            "m7l1", "DHCP e DNS", 20,
            ["Descrever o processo DORA",
             "Configurar um router como servidor DHCP e como relay",
             "Explicar a resolução DNS"],
            [
                texto("DORA", """
<ol>
<li><b>Discover</b>: o cliente (sem IP, origem 0.0.0.0) envia broadcast a procurar servidores.</li>
<li><b>Offer</b>: o servidor oferece um endereço.</li>
<li><b>Request</b>: o cliente pede formalmente esse endereço (broadcast, para os outros servidores saberem).</li>
<li><b>Acknowledgment</b>: o servidor confirma e o empréstimo (lease) começa.</li>
</ol>"""),
                cli("Router como servidor DHCP", [
                    ("R1(config)#", "ip dhcp excluded-address 192.168.10.1 192.168.10.20", "Reserva endereços para gateway, servidores e impressoras."),
                    ("R1(config)#", "ip dhcp pool VLAN10", "Cria o conjunto (pool)."),
                    ("R1(dhcp-config)#", "network 192.168.10.0 255.255.255.0", ""),
                    ("R1(dhcp-config)#", "default-router 192.168.10.1", "Gateway entregue aos clientes."),
                    ("R1(dhcp-config)#", "dns-server 8.8.8.8 1.1.1.1", ""),
                    ("R1(dhcp-config)#", "domain-name empresa.local", ""),
                    ("R1(dhcp-config)#", "lease 7", "Duração em dias."),
                    ("R1#", "show ip dhcp binding", "Quem recebeu que IP."),
                    ("R1#", "show ip dhcp pool", "Utilização do pool."),
                ]),
                topologia(
                    [("pc", "pc", 10, 50, "PC VLAN 20"), ("r1", "router", 45, 50, "R1 relay"), ("srv", "servidor", 85, 50, "DHCP 10.0.0.10")],
                    [("pc", "r1", "broadcast"), ("r1", "srv", "unicast")],
                    "Broadcasts não atravessam routers: o relay converte o pedido em unicast."),
                cli("DHCP relay", [
                    ("R1(config)#", "interface g0/1", "Interface do lado dos clientes."),
                    ("R1(config-if)#", "ip helper-address 10.0.0.10", "Encaminha pedidos DHCP para o servidor central."),
                    ("R1(config-if)#", "ip address dhcp", "(Noutro cenário) o router é cliente DHCP, típico na ligação ao ISP."),
                ]),
                texto("DNS", """
<p>O <b>DNS</b> traduz nomes (<code>www.cisco.com</code>) em endereços IP. O PC pergunta ao seu servidor DNS (resolvedor), que consulta a raiz, depois o TLD (.com) e por fim o servidor autoritativo. Registos comuns: <b>A</b> (IPv4), <b>AAAA</b> (IPv6), <b>CNAME</b> (alias), <b>MX</b> (correio), <b>PTR</b> (inverso), <b>NS</b>.</p>"""),
                cli("DNS no IOS", [
                    ("R1(config)#", "ip name-server 8.8.8.8", "O router usa este DNS."),
                    ("R1(config)#", "ip domain-lookup", "Ativa a resolução (padrão)."),
                    ("R1(config)#", "ip host SRV1 10.0.0.10", "Entrada estática local."),
                ]),
                sim_real(
                    ["O Packet Tracer tem servidores DHCP e DNS prontos no separador Services.",
                     "Os PCs pedem IP ao mudar para 'DHCP' em IP Configuration."],
                    ["Use 'ipconfig /release' e '/renew' (Windows) ou 'dhclient' (Linux) para testar.",
                     "Em empresas o DHCP costuma ser um servidor Windows/Linux ou a firewall; o router faz só relay.",
                     "Ative DHCP snooping nos switches para evitar servidores DHCP falsos (módulo de segurança)."]),
                video("DHCP DORA e relay", "DHCP DORA ip helper-address configuração Cisco"),
            ],
            [
                mc("Qual a ordem do DHCP?", ["Discover, Request, Offer, Ack", "Discover, Offer, Request, Ack", "Offer, Discover, Ack, Request", "Request, Offer, Discover, Ack"], 1, "D-O-R-A."),
                cmd("Que comando de interface encaminha pedidos DHCP para 10.0.0.10?", ["ip helper-address 10.0.0.10"], "ip helper-address."),
                mc("Que registo DNS devolve um endereço IPv6?", ["A", "AAAA", "MX", "PTR"], 1, "AAAA."),
                vf("O comando 'ip dhcp excluded-address' é configurado dentro do pool.", False, "É um comando global."),
            ],
            ["rfc2131", "rfc1034", "odom2", "netacad_srwe"],
        ),

        licao(
            "m7l2", "NAT e PAT", 22,
            ["Usar a terminologia inside/outside local/global",
             "Configurar NAT estático, dinâmico e PAT (overload)",
             "Verificar traduções"],
            [
                figura("nat", "O router traduz o endereço privado de origem num endereço público."),
                tabela(["Termo", "Significado", "Exemplo"], [
                    ["Inside local", "IP do host interno, visto por dentro", "192.168.1.10"],
                    ["Inside global", "IP do host interno, visto por fora", "203.0.113.5"],
                    ["Outside global", "IP do host externo, visto por fora", "142.250.0.10"],
                    ["Outside local", "IP do host externo, visto por dentro", "142.250.0.10 (igual, salvo NAT duplo)"],
                ], "Terminologia NAT"),
                cli("NAT estático (servidor publicado)", [
                    ("R1(config)#", "ip nat inside source static 192.168.1.10 203.0.113.5", "O servidor interno é sempre visto como .5."),
                    ("R1(config)#", "interface g0/0", "LAN"),
                    ("R1(config-if)#", "ip nat inside", ""),
                    ("R1(config-if)#", "interface g0/1", "Lado do ISP"),
                    ("R1(config-if)#", "ip nat outside", ""),
                ]),
                cli("NAT dinâmico com pool", [
                    ("R1(config)#", "access-list 1 permit 192.168.1.0 0.0.0.255", "Quem pode ser traduzido."),
                    ("R1(config)#", "ip nat pool PUBLICOS 203.0.113.10 203.0.113.20 netmask 255.255.255.0", "Endereços públicos disponíveis."),
                    ("R1(config)#", "ip nat inside source list 1 pool PUBLICOS", "1 para 1 enquanto houver endereços livres."),
                ]),
                cli("PAT (NAT overload) — o mais comum", [
                    ("R1(config)#", "access-list 1 permit 192.168.0.0 0.0.255.255", ""),
                    ("R1(config)#", "ip nat inside source list 1 interface g0/1 overload", "Todos saem com o IP da interface; distingue-os pela porta."),
                    ("R1#", "show ip nat translations", "Tabela de traduções."),
                    ("R1#", "show ip nat statistics", "Contadores, hits e misses."),
                    ("R1#", "clear ip nat translation *", "Limpa traduções dinâmicas."),
                ]),
                saida("show ip nat translations (PAT)", """
Pro  Inside global         Inside local          Outside local         Outside global
tcp  203.0.113.2:1024      192.168.1.10:51344    142.250.0.10:443      142.250.0.10:443
tcp  203.0.113.2:1025      192.168.1.11:51344    142.250.0.10:443      142.250.0.10:443"""),
                dica("Erro nº1 em NAT: esquecer <code>ip nat inside</code>/<code>ip nat outside</code> nas interfaces ou trocar os lados."),
                video("NAT e PAT Cisco", "NAT PAT overload configuração Cisco inside local global"),
            ],
            [
                mc("O IP privado de um PC interno, do ponto de vista da LAN, é o…", ["Inside global", "Inside local", "Outside local", "Outside global"], 1, "Inside local."),
                mc("Que palavra-chave ativa o PAT?", ["static", "pool", "overload", "extendable"], 2, "overload."),
                cmd("Que comando mostra as traduções NAT ativas?", ["show ip nat translations", "sh ip nat translations", "sh ip nat tr", "sh ip nat trans"], "show ip nat translations."),
                vf("Com PAT, vários hosts internos partilham um único IP público, diferenciados pelas portas.", True, "Port Address Translation."),
            ],
            ["rfc3022", "rfc1918", "odom2"],
            nivel="intermédio",
        ),

        licao(
            "m7l3", "NTP, SNMP, Syslog, FTP e TFTP", 18,
            ["Sincronizar relógios com NTP",
             "Explicar SNMP e os níveis de Syslog",
             "Comparar FTP e TFTP"],
            [
                cli("NTP", [
                    ("R1(config)#", "ntp server 192.168.1.100", "R1 é cliente NTP."),
                    ("R1(config)#", "clock timezone WAT 1", "Fuso horário (ex.: WAT = UTC+1)."),
                    ("CORE(config)#", "ntp master 3", "Torna-se servidor com stratum 3 (laboratório)."),
                    ("R1#", "show ntp status", "Clock is synchronized, stratum…"),
                    ("R1#", "show ntp associations", ""),
                ], "Relógios certos são essenciais para logs, certificados e Kerberos. Stratum menor = mais próximo do relógio de referência."),
                tabela(["Nível", "Nome", "Exemplo"], [
                    ["0", "Emergency", "Sistema inutilizável"], ["1", "Alert", "Ação imediata"], ["2", "Critical", "Falha de hardware"],
                    ["3", "Error", "Erro"], ["4", "Warning", "Aviso"], ["5", "Notification", "Interface mudou de estado"],
                    ["6", "Informational", "Mensagens informativas (ACL)"], ["7", "Debugging", "Saída de debug"],
                ], "Níveis Syslog — “Every Awesome Cisco Engineer Will Need Ice cream Daily”"),
                cli("Syslog", [
                    ("R1(config)#", "logging host 192.168.1.50", "Envia logs para o servidor."),
                    ("R1(config)#", "logging trap warning", "Envia níveis 0 a 4."),
                    ("R1(config)#", "service timestamps log datetime msec", "Data/hora nos logs."),
                    ("R1#", "show logging", ""),
                ]),
                texto("SNMP", """
<p>O <b>SNMP</b> permite a um <b>NMS</b> (gestor) ler e alterar variáveis dos equipamentos (<b>agentes</b>), organizadas na <b>MIB</b> e identificadas por <b>OIDs</b>. Mensagens: <b>Get</b>, <b>Set</b>, <b>Trap</b> (alerta sem confirmação) e <b>Inform</b> (alerta com confirmação). Portas UDP 161 (consultas) e 162 (traps).</p>
<p>Versões: v1 e v2c usam <i>community strings</i> em texto claro; <b>v3</b> acrescenta autenticação e cifra — use sempre v3.</p>"""),
                cli("SNMPv3 (exemplo)", [
                    ("R1(config)#", "snmp-server group ADMINS v3 priv", ""),
                    ("R1(config)#", "snmp-server user nms ADMINS v3 auth sha Auth#Pass1 priv aes 128 Priv#Pass1", "Autenticação SHA e cifra AES."),
                    ("R1(config)#", "snmp-server host 192.168.1.60 version 3 priv nms", "Destino das traps."),
                ]),
                tabela(["", "FTP", "TFTP"], [
                    ["Transporte", "TCP 20/21", "UDP 69"], ["Autenticação", "Utilizador e palavra-passe", "Nenhuma"],
                    ["Funções", "Listar, apagar, renomear", "Só ler e escrever ficheiros"], ["Uso", "Transferências gerais", "Imagens IOS e configs em laboratório"],
                ]),
                cli("Copiar ficheiros com FTP", [
                    ("R1(config)#", "ip ftp username backup", ""),
                    ("R1(config)#", "ip ftp password Bkp#2026", ""),
                    ("R1#", "copy running-config ftp://192.168.1.70/r1-config.txt", ""),
                ]),
                video("NTP SNMP Syslog", "NTP SNMP Syslog CCNA explicado"),
            ],
            [
                mc("Que nível Syslog é 'Warning'?", ["2", "3", "4", "5"], 2, "4 = Warning."),
                mc("Que versão SNMP oferece cifra?", ["v1", "v2c", "v3", "Todas"], 2, "Só a v3 tem autenticação e privacidade."),
                mc("TFTP usa…", ["TCP 21", "UDP 69", "TCP 69", "UDP 161"], 1, "UDP 69, sem autenticação."),
                cmd("Que comando faz R1 sincronizar com o servidor NTP 10.1.1.1?", ["ntp server 10.1.1.1"], "ntp server 10.1.1.1."),
                vf("Uma trap SNMP é confirmada pelo gestor.", False, "Traps não são confirmadas; informs sim."),
            ],
            ["rfc5905", "rfc5424", "rfc3411", "odom2"],
        ),

        licao(
            "m7l4", "QoS: qualidade de serviço", 15,
            ["Explicar largura de banda, atraso, jitter e perda",
             "Descrever classificação, marcação, filas, policing e shaping"],
            [
                tabela(["Tráfego", "Atraso (sentido único)", "Jitter", "Perda"], [
                    ["Voz", "≤ 150 ms", "≤ 30 ms", "≤ 1%"], ["Vídeo interativo", "≤ 200–400 ms", "≤ 30–50 ms", "≤ 0,1–1%"], ["Dados", "Tolerante", "Tolerante", "Retransmite (TCP)"],
                ], "Requisitos típicos (orientações Cisco)"),
                texto("As ferramentas", """
<ul>
<li><b>Classificação e marcação</b>: identificar o tráfego (por ACL, NBAR) e marcá-lo — <b>DSCP</b> no cabeçalho IP (6 bits), <b>CoS</b> no 802.1Q (3 bits). Voz = <b>EF</b> (DSCP 46).</li>
<li><b>Fronteira de confiança</b> (trust boundary): até onde se confia nas marcações — normalmente no telefone IP ou no switch de acesso.</li>
<li><b>Filas</b>: <b>LLQ</b> (fila prioritária estrita para voz) + <b>CBWFQ</b> (largura de banda garantida por classe).</li>
<li><b>Policing</b>: descarta ou remarca o excesso (ISP na entrada). <b>Shaping</b>: guarda em buffer e atrasa o excesso (cliente na saída).</li>
<li><b>Evitar congestionamento</b>: <b>WRED</b> descarta aleatoriamente pacotes TCP de baixa prioridade antes de a fila encher, evitando a sincronização global do TCP.</li>
</ul>"""),
                tabela(["Classe", "DSCP", "Valor decimal"], [["Voz", "EF", "46"], ["Vídeo interativo", "AF41", "34"], ["Sinalização", "CS3", "24"], ["Dados críticos", "AF21–AF31", "18–26"], ["Best effort", "DF/BE", "0"], ["Scavenger", "CS1", "8"]]),
                cli("Exemplo MQC (Modular QoS CLI)", [
                    ("R1(config)#", "class-map match-any VOZ", ""),
                    ("R1(config-cmap)#", "match dscp ef", ""),
                    ("R1(config)#", "policy-map WAN-OUT", ""),
                    ("R1(config-pmap)#", "class VOZ", ""),
                    ("R1(config-pmap-c)#", "priority percent 30", "LLQ: até 30% com prioridade estrita."),
                    ("R1(config-pmap)#", "class class-default", ""),
                    ("R1(config-pmap-c)#", "fair-queue", ""),
                    ("R1(config)#", "interface g0/1", ""),
                    ("R1(config-if)#", "service-policy output WAN-OUT", "Aplica à saída."),
                ], "O CCNA exige perceber os conceitos; a configuração MQC aprofunda-se no CCNP."),
                video("QoS para CCNA", "QoS CCNA DSCP LLQ policing shaping explicado"),
            ],
            [
                mc("Que marcação DSCP se usa para voz?", ["AF41", "CS1", "EF", "BE"], 2, "EF = 46."),
                mc("Qual a diferença entre policing e shaping?", ["Policing atrasa, shaping descarta", "Policing descarta/remarca, shaping atrasa em buffer", "São iguais", "Shaping só funciona em IPv6"], 1, "Shaping suaviza; policing corta."),
                mc("Qual o atraso máximo recomendado para voz, num sentido?", ["50 ms", "150 ms", "400 ms", "1 s"], 1, "150 ms."),
                vf("O WRED ajuda a evitar a sincronização global do TCP.", True, "Descarta cedo e aleatoriamente."),
            ],
            ["rfc2474", "odom2", "netacad_ensa"],
            nivel="intermédio",
        ),
    ],
    prova_extra=[
        mc("PCs na VLAN 30 recebem 169.254.x.x. O servidor DHCP está noutra rede. O que falta provavelmente?",
           ["ip helper-address na SVI/subinterface da VLAN 30", "ip nat inside", "ntp server", "Um pool por defeito"], 0, "Sem relay, o broadcast DHCP não sai da VLAN."),
        mc("Que tipo de NAT permite que a Internet aceda a um servidor web interno sempre pelo mesmo IP?", ["PAT", "NAT dinâmico", "NAT estático", "NAT64"], 2, "Mapeamento fixo 1:1."),
        vf("O SNMP usa a porta UDP 162 para traps.", True, "161 consultas, 162 traps/informs."),
    ],
)
