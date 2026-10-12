"""Módulo A1: a base das redes de computadores (conceitos, tipos, topologias e equipamentos).

Duas aulas que dão, logo no primeiro módulo, o vocabulário de redes usado em todo o curso.
"""

from .base import *

LICOES = {}


def reg(l):
    LICOES[l["id"]] = l
    return l


# ---------------------------------------------------------------------------
# 1. O que é uma rede de computadores
# ---------------------------------------------------------------------------
reg(licao(
    "a1_rede", "O que é uma rede de computadores", 25,
    [
        "Definir rede de computadores e dizer para que serve",
        "Identificar os 5 elementos de qualquer comunicação: emissor, recetor, mensagem, meio e protocolo",
        "Distinguir dispositivos finais, dispositivos intermédios e meios de transmissão",
        "Comparar o modelo cliente-servidor com o ponto a ponto",
        "Explicar endereço MAC, endereço IP e porta com uma analogia",
        "Conhecer os modos de transmissão e as medidas de uma rede: largura de banda, débito e latência",
    ],
    [
        texto("Uma rede é…", """
<p>Uma <b>rede de computadores</b> é um conjunto de dois ou mais equipamentos (computadores, telemóveis, impressoras, servidores…) <b>ligados entre si</b> — por cabo ou sem fios — para <b>trocar informação</b> e <b>partilhar recursos</b>.</p>
<p>Basta ligar dois computadores com um cabo para ter uma rede. A Internet é a maior de todas: uma <b>rede de redes</b> que liga milhares de milhões de equipamentos no mundo inteiro.</p>
<p>Para que serve? Para <b>comunicar</b> (e-mail, mensagens, videochamadas), <b>partilhar</b> (uma impressora para todo o escritório, uma pasta com os ficheiros da equipa, a ligação à Internet), <b>aceder a serviços</b> (o processo clínico, o banco, a plataforma da escola) e <b>trabalhar à distância</b>.</p>"""),
        tabela(["Elemento", "O que é", "Numa conversa", "Na rede"], [
            ["Emissor (origem)", "Quem envia", "A pessoa que fala", "O PC que envia um e-mail"],
            ["Recetor (destino)", "Quem recebe", "A pessoa que ouve", "O servidor de e-mail"],
            ["Mensagem", "O que se envia", "As palavras", "Os dados: texto, imagem, vídeo"],
            ["Meio (canal)", "Por onde passa", "O ar (o som)", "O cabo, a fibra ou o Wi-Fi"],
            ["Protocolo", "As regras combinadas", "Falar a mesma língua, esperar a vez", "Ethernet, IP, TCP, HTTP…"],
        ], "Os 5 elementos de qualquer comunicação"),
        texto("As três peças de uma rede", """
<p>Qualquer rede, da sua casa à de um hospital, é feita de três tipos de peças:</p>
<ul>
<li><b>Dispositivos finais</b> (hosts): onde a informação <b>começa ou acaba</b>. PCs, portáteis, telemóveis, impressoras, servidores, câmaras, telefones IP, televisões. Cada um tem um <b>endereço</b> para ser encontrado.</li>
<li><b>Dispositivos intermédios</b>: ligam os finais e <b>encaminham</b> a informação pelo caminho certo. Switch, router, access point (Wi-Fi), firewall, modem.</li>
<li><b>Meios de transmissão</b>: o caminho físico por onde passam os sinais. Cabo de cobre (UTP), fibra ótica e o ar (ondas de rádio do Wi-Fi e do 4G/5G).</li>
</ul>"""),
        topologia(
            [("pc1", "pc", 8, 20, "PC da receção"), ("imp", "impressora", 8, 80, "Impressora"), ("srv", "servidor", 30, 92, "Servidor"),
             ("sw", "switch", 35, 50, "Switch"), ("ap", "ap", 62, 82, "Access point"), ("tel", "smartphone", 88, 92, "Telemóvel"),
             ("r", "router", 65, 50, "Router"), ("fw", "firewall", 65, 15, "Firewall"), ("net", "nuvem", 92, 15, "Internet")],
            [("pc1", "sw", "cobre"), ("imp", "sw", "cobre"), ("srv", "sw"), ("sw", "r"), ("sw", "ap"), ("ap", "tel", "Wi-Fi"),
             ("r", "fw"), ("fw", "net", "fibra")],
            "A rede de uma clínica: dispositivos finais (PC, impressora, servidor, telemóvel), intermédios (switch, access point, router, firewall) e meios (cobre, fibra, Wi-Fi)."),
        tabela(["Meio", "Como transmite", "Distância típica", "Onde se usa"], [
            ["Cobre (UTP, RJ45)", "Impulsos elétricos", "Até 100 m", "Ligar PCs, impressoras e telefones ao switch"],
            ["Fibra ótica", "Impulsos de luz", "Centenas de metros a dezenas de km", "Ligações entre edifícios e à Internet (FTTH)"],
            ["Sem fios (Wi-Fi, 4G/5G)", "Ondas de rádio", "Dezenas de metros (Wi-Fi) a km (rede móvel)", "Portáteis e telemóveis"],
        ], "Meios de transmissão"),
        texto("Quem serve e quem pede: cliente-servidor e ponto a ponto", """
<p>Numa rede, uns equipamentos <b>pedem</b> serviços e outros <b>prestam</b> serviços:</p>
<ul>
<li><b>Cliente-servidor</b>: um <b>servidor</b> (um computador dedicado) guarda os dados e presta o serviço; muitos <b>clientes</b> fazem pedidos. Quando abre um site, o seu navegador é o cliente e o computador do site é o servidor. É o modelo das empresas: os dados estão num só sítio, com cópias de segurança e permissões.</li>
<li><b>Ponto a ponto</b> (P2P, peer-to-peer): todos os computadores são iguais e cada um é, ao mesmo tempo, cliente e servidor. Serve para redes pequenas (dois ou três PCs a partilhar uma pasta) mas fica difícil de gerir e de proteger quando cresce.</li>
</ul>"""),
        tabela(["", "Cliente-servidor", "Ponto a ponto"], [
            ["Quem guarda os dados", "O servidor", "Cada computador"],
            ["Gestão e segurança", "Centralizada, mais fácil", "Espalhada, mais difícil"],
            ["Custo", "Mais caro (servidor, administrador)", "Barato"],
            ["Tamanho ideal", "De pequena a muito grande", "Até cerca de 10 computadores"],
            ["Se um computador falha", "Só para se for o servidor", "Perdem-se os ficheiros que só ele tinha"],
        ], "Cliente-servidor × ponto a ponto"),
        texto("Endereços: como se encontra o destino", """
<p>Para a mensagem chegar ao sítio certo, cada equipamento tem endereços — como uma carta tem nome, rua e número da porta:</p>
<ul>
<li><b>Endereço MAC</b> (físico): vem gravado na placa de rede de fábrica, 48 bits escritos em hexadecimal, por exemplo <code>00:1A:2B:3C:4D:5E</code>. Serve para entregar dentro da <b>mesma rede local</b>. É como o nome da pessoa.</li>
<li><b>Endereço IP</b> (lógico): dado pelo administrador ou automaticamente (DHCP), por exemplo <code>192.168.1.10</code>. Diz <b>em que rede</b> está o equipamento e serve para chegar a redes diferentes, passando por routers. É como a morada.</li>
<li><b>Porta</b>: um número que indica <b>que programa</b> recebe os dados dentro do equipamento (80 = web, 443 = web segura, 25 = e-mail). É como o número do apartamento no prédio.</li>
</ul>"""),
        exemplo("Abrir um site, passo a passo", """
<p>Escreve <code>www.exemplo.pt</code> no navegador:</p>
<ol>
<li>O <b>DNS</b> traduz o nome para um endereço IP (como procurar o número na lista telefónica).</li>
<li>O seu PC envia o pedido ao <b>router</b> (o gateway), que o encaminha pela Internet, router a router, até ao servidor.</li>
<li>O servidor recebe o pedido na <b>porta 443</b> (HTTPS) e responde com a página.</li>
<li>A resposta volta, cortada em <b>pacotes</b>, e o navegador junta-os e mostra a página.</li>
</ol>
<p>Tudo isto acontece em menos de um segundo e envolve vários <b>protocolos</b> a trabalhar em conjunto.</p>"""),
        texto("Protocolos e normas: as regras comuns", """
<p>Um <b>protocolo</b> é um conjunto de regras que diz <b>como</b> se comunica: o formato das mensagens, a ordem, o que fazer se algo falhar. Sem protocolos, um computador de uma marca não entenderia o de outra.</p>
<p>Os protocolos são definidos por <b>organizações de normalização</b>, para que todos os fabricantes os sigam:</p>
<ul>
<li><b>IEEE</b>: redes locais — Ethernet (802.3) e Wi-Fi (802.11).</li>
<li><b>IETF</b>: protocolos da Internet, publicados em documentos chamados <b>RFC</b> — IP, TCP, UDP, HTTP, DNS, DHCP.</li>
<li><b>ISO</b>: o modelo de referência <b>OSI</b>, com 7 camadas, que organiza tudo isto.</li>
</ul>
<p>Os protocolos trabalham em <b>camadas</b>, cada uma com a sua tarefa: uns tratam do sinal no cabo, outros do endereço, outros de garantir que nada se perde, outros da aplicação. Vai estudá-las a fundo no ITN 3.</p>"""),
        tabela(["Modo", "Como funciona", "Exemplo"], [
            ["Simplex", "Só num sentido, sempre", "Rádio FM, televisão"],
            ["Half-duplex", "Nos dois sentidos, mas um de cada vez", "Walkie-talkie, hub antigo, Wi-Fi"],
            ["Full-duplex", "Nos dois sentidos ao mesmo tempo", "Telefone, ligação PC ↔ switch"],
        ], "Modos de transmissão"),
        tabela(["Medida", "O que mede", "Unidade", "Analogia da estrada"], [
            ["Largura de banda", "A capacidade máxima da ligação", "bit/s (Mbit/s, Gbit/s)", "Número de faixas da autoestrada"],
            ["Débito (throughput)", "O que passa de facto, num dado momento", "bit/s", "Carros que passam realmente por minuto"],
            ["Latência (atraso)", "Quanto tempo um pacote demora a chegar", "ms (milissegundos)", "Tempo da viagem"],
            ["Jitter", "Variação da latência", "ms", "Uns carros demoram 10 min, outros 30"],
            ["Perda de pacotes", "Pacotes que nunca chegam", "%", "Carros que se perdem pelo caminho"],
        ], "As medidas de uma rede"),
        alerta("Cuidado com as unidades: a velocidade da Internet mede-se em <b>bits</b> por segundo (Mbit/s), mas os ficheiros medem-se em <b>bytes</b> (MB). 1 byte = 8 bits, por isso uma ligação de 100 Mbit/s descarrega no máximo cerca de 12,5 MB por segundo."),
        dica("Resumo para levar: uma rede = <b>dispositivos finais</b> + <b>dispositivos intermédios</b> + <b>meios</b>, a falar com as mesmas <b>regras (protocolos)</b> e com <b>endereços</b> para encontrar o destino."),
    ],
    [
        mc("O que é uma rede de computadores?", ["Um computador muito potente", "Dois ou mais equipamentos ligados para trocar informação e partilhar recursos", "Apenas a Internet", "Um programa de mensagens"], 1, "Basta ligar dois equipamentos para haver uma rede."),
        mc("Qual destes é um dispositivo intermédio?", ["Impressora", "Servidor", "Switch", "Telemóvel"], 2, "O switch liga e encaminha; os outros são dispositivos finais."),
        mc("Nos 5 elementos da comunicação, o cabo ou o Wi-Fi são…", ["O emissor", "A mensagem", "O meio", "O protocolo"], 2, "É o canal por onde a mensagem passa."),
        mc("Que meio usa impulsos de luz?", ["Cabo UTP", "Fibra ótica", "Wi-Fi", "Cabo de consola"], 1, "A fibra transmite luz e alcança grandes distâncias."),
        mc("Que endereço vem gravado de fábrica na placa de rede?", ["Endereço IP", "Endereço MAC", "Porta", "Nome DNS"], 1, "O MAC é físico; o IP é lógico e configurável."),
        vf("No modelo ponto a ponto, cada computador pode ser cliente e servidor ao mesmo tempo.", True, "Todos os computadores são iguais e partilham recursos entre si."),
        mc("Um walkie-talkie, em que só um fala de cada vez, funciona em…", ["Simplex", "Half-duplex", "Full-duplex", "Multicast"], 1, "Nos dois sentidos, mas um de cada vez."),
        mc("Uma ligação de 100 Mbit/s descarrega, no máximo, cerca de…", ["100 MB por segundo", "12,5 MB por segundo", "800 MB por segundo", "1 MB por segundo"], 1, "100 ÷ 8 = 12,5 MB/s, porque 1 byte = 8 bits."),
    ],
    ["kurose", "tanenbaum", "comer", "netacad_itn"],
))


# ---------------------------------------------------------------------------
# 2. Tipos, topologias e equipamentos
# ---------------------------------------------------------------------------
reg(licao(
    "a1_tipos", "Tipos, topologias e equipamentos de rede", 25,
    [
        "Classificar redes pela dimensão: PAN, LAN, WLAN, MAN, WAN e Internet",
        "Distinguir Internet, intranet e extranet",
        "Reconhecer as topologias barramento, estrela, anel, malha e híbrida e distinguir topologia física de lógica",
        "Saber o que faz cada equipamento: hub, switch, router, access point, modem e firewall",
        "Conhecer as formas de ligação à Internet e as quatro características de uma rede fiável",
    ],
    [
        texto("As redes classificam-se pelo tamanho", """
<p>A forma mais comum de classificar uma rede é pela <b>área que cobre</b>. Quanto maior a área, mais equipamentos, mais distância e, normalmente, mais caro.</p>"""),
        tabela(["Tipo", "Nome completo", "Área", "Exemplo"], [
            ["PAN", "Personal Area Network", "Alguns metros, à volta de uma pessoa", "Telemóvel ligado aos auscultadores por Bluetooth"],
            ["LAN", "Local Area Network", "Uma casa, um piso, um edifício", "Os PCs de uma escola ligados ao mesmo switch"],
            ["WLAN", "Wireless LAN", "Igual à LAN, mas sem fios", "O Wi-Fi de um café"],
            ["CAN", "Campus Area Network", "Vários edifícios próximos", "Os edifícios de uma universidade ou de um hospital"],
            ["MAN", "Metropolitan Area Network", "Uma cidade", "A rede que liga as escolas de um município"],
            ["WAN", "Wide Area Network", "Países e continentes", "A rede de um banco que liga todas as agências"],
            ["Internet", "Rede de redes", "O mundo inteiro", "Milhões de redes ligadas por fornecedores (ISP)"],
        ], "Tipos de rede pela dimensão"),
        topologia(
            [("pa", "pc", 8, 25, "PC"), ("sa", "switch", 22, 50, "LAN Lisboa"), ("pb", "portatil", 8, 75, "Portátil"), ("ra", "router", 38, 50, "R Lisboa"),
             ("wan", "nuvem", 55, 50, "WAN do ISP"),
             ("rb", "router", 72, 50, "R Porto"), ("sb", "switch", 86, 50, "LAN Porto"), ("pc", "pc", 96, 25, "PC"), ("pd", "servidor", 96, 75, "Servidor")],
            [("pa", "sa"), ("pb", "sa"), ("sa", "ra"), ("ra", "wan"), ("wan", "rb"), ("rb", "sb"), ("sb", "pc"), ("sb", "pd")],
            "Duas LAN (Lisboa e Porto), cada uma com o seu switch, ligadas por routers através de uma WAN."),
        tabela(["", "Quem acede", "Exemplo"], [
            ["Internet", "Qualquer pessoa", "Sites públicos, redes sociais"],
            ["Intranet", "Só quem é da organização", "O portal interno do hospital com escalas e procedimentos"],
            ["Extranet", "A organização e parceiros autorizados", "Os laboratórios externos que enviam análises ao hospital"],
        ], "Internet, intranet e extranet"),
        texto("Topologias: o desenho da rede", """
<p>A <b>topologia</b> é a forma como os equipamentos estão ligados. Há duas maneiras de a ver:</p>
<ul>
<li><b>Topologia física</b>: onde estão os equipamentos e os cabos de verdade (em que sala, em que bastidor).</li>
<li><b>Topologia lógica</b>: por onde a informação circula e como estão organizados os endereços (redes, VLANs).</li>
</ul>
<p>Uma rede pode ter uma topologia física em estrela e uma topologia lógica diferente — por exemplo, um hub antigo era uma estrela física mas funcionava como um barramento lógico.</p>"""),
        tabela(["Topologia", "Como é", "Vantagem", "Desvantagem"], [
            ["Barramento (bus)", "Todos ligados a um único cabo", "Barata e simples", "Se o cabo parte, cai tudo; colisões"],
            ["Estrela", "Todos ligados a um ponto central (switch)", "Fácil de gerir; um cabo partido só afeta um PC", "Se o switch central falha, cai a rede"],
            ["Estrela estendida", "Várias estrelas ligadas entre si", "Cresce facilmente (um switch por piso)", "Depende dos switches de ligação"],
            ["Anel", "Cada um ligado ao seguinte, em círculo", "Ordem de acesso previsível", "Uma falha pode cortar o anel"],
            ["Malha (mesh)", "Muitas ligações entre todos", "Muitos caminhos alternativos: tolera falhas", "Muitos cabos, cara"],
            ["Híbrida", "Mistura das anteriores", "Adapta-se a cada local", "Mais complexa de desenhar"],
        ], "Topologias físicas"),
        topologia(
            [("c", "switch", 25, 50, "Estrela"), ("e1", "pc", 8, 20, ""), ("e2", "pc", 42, 20, ""), ("e3", "pc", 8, 80, ""), ("e4", "impressora", 42, 80, ""),
             ("m1", "router", 62, 20, "R1"), ("m2", "router", 92, 20, "R2"), ("m3", "router", 62, 80, "R3"), ("m4", "router", 92, 80, "R4")],
            [("c", "e1"), ("c", "e2"), ("c", "e3"), ("c", "e4"),
             ("m1", "m2"), ("m1", "m3"), ("m1", "m4"), ("m2", "m3"), ("m2", "m4"), ("m3", "m4")],
            "À esquerda uma estrela (a das LAN de hoje); à direita uma malha total entre 4 routers (cada um ligado a todos)."),
        tabela(["Equipamento", "O que faz", "Camada OSI", "Analogia"], [
            ["Hub (antigo)", "Repete o sinal para todas as portas", "1 — física", "Gritar numa sala: todos ouvem"],
            ["Switch", "Liga equipamentos da mesma rede; envia só para a porta certa, pelo endereço MAC", "2 — ligação de dados", "Carteiro do prédio, que sabe a porta de cada apartamento"],
            ["Router", "Liga redes diferentes e escolhe o caminho pelo endereço IP", "3 — rede", "Correios entre cidades"],
            ["Access point (AP)", "Liga equipamentos sem fios à rede com fios", "2", "Uma porta de entrada sem cabo"],
            ["Modem", "Converte o sinal do fornecedor (fibra, cabo, telefone) para a rede", "1", "Tradutor entre duas línguas"],
            ["Firewall", "Deixa passar ou bloqueia tráfego segundo regras", "3 a 7", "Segurança à porta do edifício"],
            ["Servidor", "Presta serviços: ficheiros, web, e-mail, DHCP, DNS", "7 — aplicação", "O balcão que atende pedidos"],
        ], "Os equipamentos de uma rede"),
        dica("O <b>router Wi-Fi</b> que tem em casa é vários equipamentos numa só caixa: modem + router + switch (as portas amarelas) + access point + firewall. Numa empresa cada um destes é um aparelho separado."),
        tabela(["Ligação", "Meio", "Características"], [
            ["Fibra (FTTH)", "Fibra até casa", "Muito rápida e estável; a mais comum hoje em Portugal"],
            ["DSL (ADSL/VDSL)", "Par de cobre do telefone", "Mais lenta, depende da distância à central"],
            ["Cabo", "Cabo coaxial da TV", "Rápida, partilhada pelos vizinhos"],
            ["Rede móvel (4G/5G)", "Rádio", "Em qualquer lado; o débito varia com o sinal"],
            ["Satélite", "Rádio para o espaço", "Chega a zonas remotas; latência mais alta"],
            ["Linha dedicada / Metro Ethernet", "Fibra do operador", "Para empresas: débito garantido e SLA"],
        ], "Como se liga uma rede à Internet (através de um ISP)"),
        texto("Uma rede fiável", """
<p>Uma boa rede não é só rápida. Tem de ter quatro características:</p>
<ul>
<li><b>Tolerância a falhas</b>: se um cabo ou equipamento falha, há outro caminho (redundância). No hospital, a rede do bloco operatório não pode parar.</li>
<li><b>Escalabilidade</b>: cresce sem ter de refazer tudo (mais um piso, mais 50 PCs).</li>
<li><b>Qualidade de serviço (QoS)</b>: dá prioridade ao que é urgente — a voz e o vídeo passam à frente de um download.</li>
<li><b>Segurança</b>: protege a <b>confidencialidade</b> (só quem pode lê), a <b>integridade</b> (ninguém altera) e a <b>disponibilidade</b> (está sempre a funcionar).</li>
</ul>"""),
        alerta("Confusões comuns: <b>Internet</b> não é o mesmo que <b>Web</b> (a Web — os sites — é só um dos serviços da Internet, ao lado do e-mail ou das videochamadas). <b>Wi-Fi</b> não é Internet: é só a forma sem fios de entrar na rede local. E o <b>switch</b> liga equipamentos da mesma rede; para sair para outra rede é preciso um <b>router</b>."),
        dica("A seguir: no ITN 1 volta a estes temas com mais detalhe, e no módulo A4 monta a sua primeira rede no simulador — dois PCs e um switch, numa topologia em estrela."),
    ],
    [
        mc("A rede dos PCs de uma escola, ligados ao mesmo switch, é uma…", ["PAN", "LAN", "MAN", "WAN"], 1, "Uma área pequena (um edifício): rede local."),
        mc("Um banco que liga todas as agências do país usa uma…", ["PAN", "LAN", "WAN", "WLAN"], 2, "Grandes distâncias: rede alargada (WAN)."),
        mc("O portal interno do hospital, só para funcionários, é uma…", ["Internet", "Intranet", "Extranet", "PAN"], 1, "Só quem é da organização acede."),
        mc("Em que topologia todos os equipamentos ligam a um ponto central?", ["Barramento", "Anel", "Estrela", "Malha"], 2, "É a topologia das LAN atuais, com um switch ao centro."),
        mc("Que topologia tem mais caminhos alternativos e tolera melhor as falhas?", ["Barramento", "Estrela", "Anel", "Malha"], 3, "Na malha há várias ligações entre os equipamentos."),
        mc("Que equipamento liga redes diferentes e escolhe o caminho pelo endereço IP?", ["Hub", "Switch", "Router", "Access point"], 2, "O router trabalha na camada 3, com endereços IP."),
        vf("O switch envia cada trama só para a porta onde está o destino, pelo endereço MAC.", True, "Ao contrário do hub, que repete para todas as portas."),
        mc("Dar prioridade às videochamadas sobre os downloads é…", ["Escalabilidade", "Tolerância a falhas", "Qualidade de serviço (QoS)", "Topologia lógica"], 2, "A QoS trata primeiro o tráfego urgente."),
    ],
    ["kurose", "tanenbaum", "comer", "netacad_itn"],
))
