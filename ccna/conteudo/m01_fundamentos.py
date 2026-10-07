from .base import *

MODULO = modulo(
    id="m1", numero=1, icone="nuvem",
    titulo="Fundamentos de Redes",
    descricao="O ponto de partida: o que é uma rede, que equipamentos existem, como se ligam e que cabos usam.",
    dominio="1.0 Network Fundamentals",
    licoes=[
        licao(
            "m1l1", "O que é uma rede de computadores", 12,
            ["Explicar o que é uma rede e para que serve",
             "Distinguir cliente, servidor e dispositivo intermediário",
             "Reconhecer LAN, WAN, MAN, WLAN e a Internet"],
            [
                texto("A ideia central", """
<p>Uma <b>rede de computadores</b> é um conjunto de dispositivos ligados entre si para <b>partilhar informação e recursos</b>: ficheiros, impressoras, acesso à Internet, aplicações, voz e vídeo.</p>
<p>Toda a rede tem sempre três ingredientes:</p>
<ul>
<li><b>Dispositivos finais</b> (hosts): onde a informação nasce ou termina — PCs, portáteis, telemóveis, servidores, câmaras IP, impressoras.</li>
<li><b>Dispositivos intermediários</b>: encaminham a informação — switches, routers, access points, firewalls.</li>
<li><b>Meios</b>: o caminho físico — cabo de cobre, fibra ótica ou ondas de rádio (Wi-Fi).</li>
</ul>
<p>E há sempre <b>regras</b> combinadas, os <b>protocolos</b>, que definem como falar: formato das mensagens, endereços, ordem, tempos e o que fazer quando algo falha.</p>"""),
                topologia(
                    [("pc1", "pc", 10, 30, "PC"), ("pc2", "portatil", 10, 75, "Portátil"),
                     ("sw", "switch", 40, 52, "Switch"), ("r", "router", 68, 52, "Router"),
                     ("net", "nuvem", 92, 52, "Internet"), ("srv", "servidor", 40, 10, "Servidor")],
                    [("pc1", "sw"), ("pc2", "sw"), ("srv", "sw"), ("sw", "r"), ("r", "net", "WAN")],
                    "Uma pequena rede de escritório: hosts ligados a um switch (LAN) e um router que dá saída para a Internet (WAN)."),
                texto("Cliente e servidor", """
<p>Um <b>servidor</b> é um host que oferece um serviço (páginas web, e-mail, ficheiros). Um <b>cliente</b> é quem pede esse serviço. O mesmo computador pode ser cliente e servidor ao mesmo tempo.</p>
<p>Numa rede <b>peer-to-peer</b> (P2P) todos partilham diretamente uns com os outros, sem servidor dedicado. É simples para casa, mas difícil de gerir e proteger numa empresa.</p>"""),
                tabela(["Tipo", "Alcance", "Exemplo"], [
                    ["LAN", "Um edifício ou piso", "A rede do escritório ou da escola"],
                    ["WLAN", "Igual à LAN, sem fios", "O Wi-Fi da empresa"],
                    ["MAN", "Uma cidade", "Fibra que liga os campus de uma universidade"],
                    ["WAN", "Países e continentes", "Ligação entre a sede e as filiais"],
                    ["Internet", "Mundial", "A rede de redes que liga milhões de WANs e LANs"],
                ], "Tipos de rede por alcance"),
                exemplo("No dia a dia", """
<p>Quando abre o YouTube no telemóvel em casa: o telemóvel (host) fala por Wi-Fi (meio) com o router doméstico (intermediário), que encaminha os pedidos para o operador (WAN) e daí pela Internet até aos servidores do YouTube. Dezenas de protocolos trabalham juntos: Wi-Fi, IP, TCP/QUIC, DNS, HTTPS.</p>"""),
                texto("Características de uma boa rede", """
<ul>
<li><b>Tolerância a falhas</b>: caminhos redundantes para que uma avaria não pare tudo.</li>
<li><b>Escalabilidade</b>: crescer sem refazer a rede.</li>
<li><b>Qualidade de serviço (QoS)</b>: dar prioridade a voz e vídeo.</li>
<li><b>Segurança</b>: confidencialidade, integridade e disponibilidade (a tríade CIA).</li>
</ul>"""),
                dica("No exame CCNA, “host” e “dispositivo final” querem dizer a mesma coisa. Switches e routers <b>não</b> são hosts."),
            ],
            [
                mc("Qual destes é um dispositivo intermediário?", ["Impressora de rede", "Switch", "Servidor web", "Telemóvel"], 1,
                   "Switches, routers, APs e firewalls encaminham tráfego: são intermediários. Os outros são dispositivos finais."),
                mc("Uma rede que cobre apenas um edifício chama-se…", ["WAN", "MAN", "LAN", "PAN"], 2,
                   "LAN = Local Area Network, uma rede local de alcance limitado (sala, piso, edifício)."),
                vf("Um computador pode ser cliente e servidor ao mesmo tempo.", True,
                   "Sim. Um PC pode partilhar uma pasta (servidor) enquanto navega na web (cliente)."),
                mc("O conjunto de regras que define como os dispositivos comunicam chama-se…", ["Topologia", "Protocolo", "Meio", "Largura de banda"], 1,
                   "Protocolos definem formato, ordem e significado das mensagens."),
                vf("Fibra ótica, cobre e Wi-Fi são exemplos de meios de transmissão.", True,
                   "São os três grandes tipos de meio: elétrico (cobre), luz (fibra) e rádio (sem fios)."),
            ],
            ["netacad_itn", "kurose", "tanenbaum", "odom1"],
        ),

        licao(
            "m1l2", "Equipamentos de rede: conheça cada um", 15,
            ["Identificar router, switch, AP, WLC e firewall pelo aspeto e função",
             "Reconhecer as portas de um switch e de um router Cisco",
             "Saber em que camada trabalha cada equipamento"],
            [
                figura("painel_switch", "Frente de um switch de acesso de 24 portas (estilo Catalyst): portas RJ45 com LEDs, portas uplink SFP e porta de consola."),
                texto("Switch", """
<p>O <b>switch</b> liga os dispositivos <b>dentro da mesma LAN</b>. Aprende o endereço <b>MAC</b> de quem está ligado em cada porta e envia cada trama apenas para a porta certa. Trabalha na <b>camada 2</b> (ligação de dados).</p>
<p>Um <b>switch multicamada (L3)</b> também consegue encaminhar entre redes IP, como um router — muito usado no núcleo das redes empresariais.</p>"""),
                figura("painel_router", "Traseira de um router de filial (estilo ISR): portas GigabitEthernet, slots para módulos WAN, consola RJ45, consola USB e AUX."),
                texto("Router", """
<p>O <b>router</b> liga <b>redes diferentes</b> entre si (por exemplo a LAN à Internet) e escolhe o melhor caminho para cada pacote com base no endereço <b>IP</b> de destino e na <b>tabela de encaminhamento</b>. Trabalha na <b>camada 3</b> (rede).</p>"""),
                tabela(["Equipamento", "Camada OSI", "Decide com base em", "Símbolo"], [
                    ["Hub (obsoleto)", "1", "Nada — repete para todas as portas", "—"],
                    ["Switch", "2", "Endereço MAC", "Quadrado com setas"],
                    ["Router", "3", "Endereço IP", "Círculo com setas"],
                    ["Switch L3", "2 e 3", "MAC e IP", "Quadrado com setas e círculo"],
                    ["Firewall", "3 a 7", "Regras e estado das ligações", "Muro de tijolos"],
                    ["Access Point", "1 e 2", "Liga clientes Wi-Fi à rede com fios", "Antena/ondas"],
                ], "Resumo dos equipamentos"),
                topologia(
                    [("r", "router", 15, 50, "Router"), ("sw", "switch", 38, 50, "Switch"), ("l3", "switch_l3", 62, 50, "Switch L3"),
                     ("fw", "firewall", 85, 50, "Firewall"), ("ap", "ap", 38, 12, "AP"), ("wlc", "wlc", 62, 12, "WLC")],
                    [],
                    "Os ícones usados nos diagramas de rede (e nesta app)."),
                texto("Access Point, WLC e firewall", """
<ul>
<li><b>Access Point (AP)</b>: liga clientes sem fios à rede cabeada. Pode ser <i>autónomo</i> (configurado um a um) ou <i>leve</i> (lightweight), gerido por um controlador.</li>
<li><b>WLC (Wireless LAN Controller)</b>: gere centenas de APs de forma centralizada: SSIDs, segurança, canais e potência.</li>
<li><b>Firewall</b>: filtra o tráfego segundo regras e acompanha o estado das ligações. Os <b>NGFW</b> (next-generation) também inspecionam aplicações e bloqueiam ameaças (IPS).</li>
</ul>"""),
                sim_real(
                    ["No Packet Tracer arrasta o equipamento e liga cabos com um clique.",
                     "Os módulos (placas) adicionam-se com o equipamento desligado, no separador Physical.",
                     "As luzes das portas ficam verdes quase de imediato."],
                    ["Equipamentos reais vão num bastidor (rack) de 19 polegadas, com parafusos e calhas.",
                     "Precisa de alimentação adequada, ventilação e, idealmente, UPS.",
                     "Os LEDs das portas ficam âmbar ~30 s enquanto o STP verifica a porta, antes de ficarem verdes.",
                     "Módulos SFP têm de ser compatíveis com o modelo (algumas plataformas recusam SFP de terceiros)."]),
                dica("Pelo símbolo: <b>router = círculo</b>, <b>switch = quadrado</b>. É assim em quase todos os diagramas do exame."),
            ],
            [
                mc("Que equipamento decide o encaminhamento com base no endereço IP?", ["Switch L2", "Hub", "Router", "Access Point"], 2,
                   "O router trabalha na camada 3 e usa a tabela de encaminhamento com endereços IP."),
                mc("O switch aprende e usa qual endereço?", ["IP", "MAC", "Porta TCP", "URL"], 1,
                   "O switch constrói a tabela de endereços MAC e encaminha tramas pela porta certa."),
                mc("Que equipamento gere muitos APs de forma centralizada?", ["WLC", "NGFW", "Hub", "Modem"], 0,
                   "O Wireless LAN Controller gere APs leves (lightweight) de forma central."),
                vf("Um switch multicamada consegue encaminhar tráfego entre redes IP.", True,
                   "O switch L3 combina comutação (L2) e encaminhamento (L3)."),
                vf("Em equipamentos reais as portas de um switch Cisco ficam verdes imediatamente ao ligar um PC.", False,
                   "Com STP normal a porta passa por listening/learning (~30 s) e fica âmbar até ir para forwarding."),
            ],
            ["odom1", "netacad_itn", "lammle"],
        ),

        licao(
            "m1l3", "Topologias e arquiteturas", 12,
            ["Desenhar topologias física e lógica",
             "Comparar estrela, malha, barramento e anel",
             "Conhecer as arquiteturas de 2 e 3 camadas, spine-leaf, SOHO e WAN"],
            [
                texto("Topologia física e lógica", """
<p>A <b>topologia física</b> mostra onde estão os equipamentos e por onde passam os cabos. A <b>topologia lógica</b> mostra como os dados circulam: redes IP, VLANs, rotas.</p>"""),
                tabela(["Topologia", "Como é", "Vantagem", "Desvantagem"], [
                    ["Estrela", "Todos ligados a um ponto central (switch)", "Simples; um cabo avariado afeta só um host", "O ponto central é crítico"],
                    ["Estrela estendida", "Várias estrelas ligadas entre si", "Escala bem", "Mais equipamentos"],
                    ["Malha completa", "Todos ligados a todos", "Máxima redundância", "Cara: n(n-1)/2 ligações"],
                    ["Malha parcial", "Só os caminhos críticos são redundantes", "Equilíbrio custo/redundância", "Mais complexa"],
                    ["Barramento / Anel", "Cabo partilhado / círculo", "Históricas", "Uma falha pode parar tudo"],
                ], "Topologias clássicas"),
                exemplo("Quantas ligações tem uma malha completa?", """
<p>Fórmula: <code>n × (n − 1) / 2</code>. Com 5 routers: 5 × 4 / 2 = <b>10 ligações</b>. Com 10 routers: <b>45</b>. Por isso a malha completa só se usa onde a redundância vale o custo (núcleo, WAN crítica).</p>"""),
                topologia(
                    [("c1", "switch_l3", 35, 10, "Núcleo 1"), ("c2", "switch_l3", 65, 10, "Núcleo 2"),
                     ("d1", "switch_l3", 20, 45, "Distrib. 1"), ("d2", "switch_l3", 80, 45, "Distrib. 2"),
                     ("a1", "switch", 8, 85, "Acesso"), ("a2", "switch", 36, 85, "Acesso"), ("a3", "switch", 64, 85, "Acesso"), ("a4", "switch", 92, 85, "Acesso")],
                    [("c1", "c2"), ("c1", "d1"), ("c1", "d2"), ("c2", "d1"), ("c2", "d2"),
                     ("d1", "a1"), ("d1", "a2"), ("d2", "a3"), ("d2", "a4"), ("d1", "d2")],
                    "Arquitetura hierárquica de 3 camadas: núcleo (core), distribuição e acesso."),
                texto("Arquiteturas do exame CCNA", """
<ul>
<li><b>3 camadas</b>: <i>acesso</i> (onde ligam os utilizadores), <i>distribuição</i> (políticas, encaminhamento entre VLANs) e <i>núcleo</i> (transporte rápido). Para campus grandes.</li>
<li><b>2 camadas / núcleo colapsado</b>: distribuição e núcleo no mesmo par de switches. Para campus médios.</li>
<li><b>Spine-leaf</b>: centros de dados. Cada <i>leaf</i> liga-se a <b>todos</b> os <i>spines</i>; leaf nunca liga a leaf, spine nunca liga a spine. Latência previsível: sempre 2 saltos.</li>
<li><b>SOHO</b> (Small Office/Home Office): um único equipamento faz de router, switch, AP e firewall.</li>
<li><b>WAN</b>: ligações entre locais — MPLS, Internet com VPN, SD-WAN, fibra dedicada.</li>
<li><b>On-premises vs cloud</b>: servidores na própria empresa ou em fornecedores (IaaS, PaaS, SaaS).</li>
</ul>"""),
                topologia(
                    [("s1", "switch_l3", 30, 12, "Spine 1"), ("s2", "switch_l3", 70, 12, "Spine 2"),
                     ("l1", "switch", 12, 75, "Leaf 1"), ("l2", "switch", 37, 75, "Leaf 2"), ("l3", "switch", 63, 75, "Leaf 3"), ("l4", "switch", 88, 75, "Leaf 4")],
                    [("s1", "l1"), ("s1", "l2"), ("s1", "l3"), ("s1", "l4"), ("s2", "l1"), ("s2", "l2"), ("s2", "l3"), ("s2", "l4")],
                    "Spine-leaf: todos os leaf ligados a todos os spine."),
                dica("Pergunta frequente: “numa arquitetura spine-leaf, um leaf liga-se a outro leaf?” — <b>Não</b>."),
            ],
            [
                mc("Quantas ligações tem uma malha completa com 6 routers?", ["12", "15", "30", "36"], 1,
                   "6 × 5 / 2 = 15."),
                mc("Em spine-leaf, cada leaf liga-se a…", ["Outro leaf", "Todos os spines", "Apenas um spine", "Ao router de Internet"], 1,
                   "Cada leaf liga-se a todos os spines; nunca leaf-leaf nem spine-spine."),
                mc("Que camada da arquitetura hierárquica liga os utilizadores finais?", ["Núcleo", "Distribuição", "Acesso", "Spine"], 2,
                   "A camada de acesso é onde se ligam PCs, telefones IP e APs."),
                vf("No núcleo colapsado, distribuição e núcleo estão nos mesmos equipamentos.", True,
                   "É a arquitetura de 2 camadas, típica de campus médios."),
                mc("Na topologia em estrela, se o cabo de um PC avariar…", ["Toda a rede para", "Só esse PC fica sem rede", "O switch reinicia", "Formam-se loops"], 1,
                   "Cada host tem o seu próprio cabo até ao ponto central."),
            ],
            ["odom1", "netacad_itn", "cisco_exam"],
        ),

        licao(
            "m1l4", "Cabos, conectores e meios", 15,
            ["Escolher entre UTP, fibra monomodo e multimodo",
             "Saber quando usar cabo direto ou cruzado e o papel do Auto-MDIX",
             "Ligar-se a um equipamento Cisco pela consola"],
            [
                figura("cabo_utp", "Cabo UTP com conector RJ45: 4 pares de fios entrançados."),
                texto("Cobre: UTP", """
<p>O cabo <b>UTP</b> (par entrançado não blindado) tem 4 pares de fios. O entrançado reduz interferências (crosstalk). Distância máxima típica: <b>100 m</b>.</p>"""),
                tabela(["Categoria", "Velocidade típica", "Norma Ethernet"], [
                    ["Cat 5e", "1 Gbit/s", "1000BASE-T"],
                    ["Cat 6", "1 Gbit/s (10 Gbit/s até ~55 m)", "1000BASE-T / 10GBASE-T"],
                    ["Cat 6a", "10 Gbit/s até 100 m", "10GBASE-T"],
                    ["Cat 8", "25/40 Gbit/s até 30 m", "25G/40GBASE-T (centros de dados)"],
                ], "Categorias de cabo UTP"),
                figura("rj45_pinos", "Esquemas de cravação T568A e T568B."),
                texto("Direto, cruzado e Auto-MDIX", """
<p>Em 10/100 Mbit/s o PC transmite nos pinos 1-2 e o switch recebe nesses pinos. Por isso:</p>
<ul>
<li><b>Cabo direto</b> (B-B): equipamentos <i>diferentes</i> — PC↔switch, router↔switch.</li>
<li><b>Cabo cruzado</b> (A-B): equipamentos <i>iguais</i> — switch↔switch, PC↔PC, router↔PC.</li>
</ul>
<p>Hoje quase todas as portas têm <b>Auto-MDIX</b>, que deteta e corrige automaticamente. Ainda assim, o exame pergunta a regra.</p>"""),
                figura("cabo_fibra", "Fibra ótica com conectores LC duplex e um módulo SFP."),
                tabela(["", "Multimodo (MMF)", "Monomodo (SMF)"], [
                    ["Núcleo", "50 ou 62,5 µm", "~9 µm"],
                    ["Fonte de luz", "LED / VCSEL", "Laser"],
                    ["Distância", "Centenas de metros", "Dezenas de km"],
                    ["Custo", "Mais barato", "Mais caro"],
                    ["Uso típico", "Dentro do edifício", "Entre edifícios, WAN, operadores"],
                ], "Fibra ótica"),
                figura("cabo_consola", "Cabo de consola (rollover) RJ45 ↔ DB9 e a alternativa USB."),
                cli("Aceder pela consola (primeira configuração)", [
                    ("PC", "Ligar o cabo de consola à porta CONSOLE", "Use rollover RJ45-DB9 + adaptador USB-série, ou cabo USB mini-B/USB-C."),
                    ("PC", "Abrir PuTTY/Tera Term na porta COMx (ou /dev/ttyUSB0)", "Velocidade 9600, 8 bits de dados, sem paridade, 1 stop bit, sem controlo de fluxo (9600 8N1)."),
                    ("Switch>", "enable", "Entra no modo privilegiado."),
                ], "No Packet Tracer basta escolher o cabo azul claro <i>Console</i> e abrir Desktop › Terminal."),
                sim_real(
                    ["Cabo errado (direto vs cruzado) muitas vezes funciona na mesma ou a ligação fica vermelha — corrige com um clique.",
                     "A consola abre com um clique no separador CLI.",
                     "Não existem problemas de cabo mal cravado ou interferências."],
                    ["Precisa de adaptador USB-série e do driver correto (veja o Gestor de Dispositivos para saber o número COM).",
                     "Velocidade errada mostra caracteres estranhos no terminal: confirme 9600 8N1.",
                     "Cabos mal cravados causam erros CRC e ligações instáveis: teste com um testador de cabos.",
                     "Fibra: nunca olhe diretamente para o conector (laser invisível) e mantenha as pontas limpas."]),
                alerta("A velocidade e o duplex têm de coincidir nas duas pontas. <i>Duplex mismatch</i> (um lado full, outro half) causa colisões tardias e lentidão — prefira <code>auto</code> nos dois lados."),
            ],
            [
                mc("Qual a distância máxima típica de um cabo UTP Ethernet?", ["10 m", "55 m", "100 m", "2 km"], 2,
                   "As normas 10/100/1000BASE-T definem 100 m por segmento."),
                mc("Para ligar dois switches antigos sem Auto-MDIX deve usar…", ["Cabo direto", "Cabo cruzado", "Cabo de consola", "Cabo serial"], 1,
                   "Equipamentos iguais usam cabo cruzado."),
                mc("Que fibra é usada para ligar edifícios a vários km de distância?", ["Multimodo", "Monomodo", "UTP Cat 6", "Coaxial"], 1,
                   "A fibra monomodo usa laser e núcleo fino, alcançando dezenas de km."),
                mc("Configuração padrão da porta de consola Cisco:", ["115200 8N1", "9600 8N1", "9600 7E1", "57600 8N2"], 1,
                   "9600 bit/s, 8 bits de dados, sem paridade, 1 stop bit."),
                vf("Auto-MDIX permite usar cabo direto entre dois switches.", True,
                   "A porta deteta e troca os pares de transmissão/receção automaticamente."),
            ],
            ["tia568", "ieee8023", "odom1", "netacad_itn"],
        ),
    ],
    prova_extra=[
        mc("Um portátil está a 140 m do switch mais próximo, num armazém. Qual a melhor solução cabeada?",
           ["UTP Cat 6 direto", "Fibra multimodo ou um switch intermédio", "Cabo de consola", "UTP Cat 5e cruzado"], 1,
           "UTP só garante 100 m. Use fibra ou coloque um switch a meio caminho."),
        vf("Uma firewall de próxima geração (NGFW) pode identificar aplicações e funcionar como IPS.", True,
           "É o que distingue uma NGFW de uma firewall tradicional de portas/endereços."),
        mc("Qual destes é um exemplo de SaaS?", ["Uma VM numa cloud pública", "Office 365 / Gmail", "Uma plataforma para fazer deploy de código", "Um switch físico"], 1,
           "SaaS é software pronto a usar; IaaS dá VMs; PaaS dá plataforma de desenvolvimento."),
    ],
)
