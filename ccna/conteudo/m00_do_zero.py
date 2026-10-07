from .base import *

MODULO = modulo(
    id="m0", numero=0, icone="pc",
    titulo="Do zero: informática, computadores e redes",
    descricao="Para quem nunca estudou informática: o que é a informática, como surgiram os computadores, o que há dentro deles, o software, porque precisaram de comunicar, a história das redes e da Internet, e os números que as redes usam.",
    dominio="Base (antes do exame)",
    licoes=[
        licao(
            "m0l3", "O que é um computador por dentro", 15,
            ["Explicar o que é um computador com palavras simples",
             "Distinguir hardware e software",
             "Conhecer as peças principais: processador, memória, armazenamento e placa de rede",
             "Perceber que routers e switches também são computadores"],
            [
                texto("Uma máquina que segue instruções", """
<p>Um <b>computador</b> é uma máquina que <b>recebe dados</b>, <b>processa-os</b> seguindo instruções e <b>devolve um resultado</b>. Este ciclo chama-se <b>entrada → processamento → saída</b>.</p>
<p>Exemplo: escreve <code>2+2</code> na calculadora do telemóvel (entrada), o processador faz a conta (processamento) e o ecrã mostra <code>4</code> (saída).</p>
<p>O telemóvel, o portátil, a caixa multibanco (ATM), a consola de jogos, a televisão inteligente e até o router de casa são computadores.</p>"""),
                figura("computador_partes", "As peças principais de um computador e o caminho dos dados."),
                tabela(["Peça", "O que faz", "Comparação do dia a dia"], [
                    ["Processador (CPU)", "Executa as instruções e faz os cálculos", "O cozinheiro que prepara a comida"],
                    ["Memória RAM", "Guarda o que está a ser usado agora; apaga-se ao desligar", "A bancada da cozinha: rápida, mas limpa-se no fim do dia"],
                    ["Armazenamento (SSD/HD)", "Guarda ficheiros e programas de forma permanente", "O armário da despensa"],
                    ["Placa de rede (NIC)", "Liga o computador à rede, por cabo ou Wi-Fi", "A porta da casa para a rua"],
                    ["Placa-mãe", "Liga todas as peças entre si", "A cozinha onde tudo acontece"],
                    ["Fonte de alimentação", "Fornece energia", "O gás/eletricidade do fogão"],
                ], "Hardware: as peças que se podem tocar"),
                texto("Software: as instruções", """
<ul>
<li><b>Sistema operativo</b> (SO): gere o hardware e as aplicações — Windows, Linux, macOS, Android, iOS. Nos equipamentos Cisco, o SO chama-se <b>IOS</b> (não confundir com o iOS do iPhone).</li>
<li><b>Aplicações</b>: o browser, o WhatsApp, o Excel, os jogos.</li>
<li><b>Firmware</b>: software gravado no próprio hardware, que arranca o equipamento.</li>
</ul>"""),
                exemplo("Um router também é um computador", """
<p>Um router Cisco tem processador, memória RAM, memória <b>flash</b> (onde fica o sistema operativo IOS), <b>NVRAM</b> (onde fica a configuração guardada) e várias placas de rede (as portas). Não tem ecrã nem teclado: configura-se ligando um portátil ao cabo de consola ou por rede (SSH). Vai fazer isto no Módulo 4!</p>"""),
                tabela(["Tipo", "Para quê", "Exemplo"], [
                    ["Pessoal (PC/portátil)", "Uso individual", "O computador de casa"],
                    ["Móvel", "Uso pessoal em movimento", "Telemóvel, tablet"],
                    ["Servidor", "Presta serviços a muitos utilizadores, 24 h", "O servidor de e-mail da empresa"],
                    ["Embebido", "Computador dentro de outro aparelho", "Router, câmara IP, impressora"],
                    ["Supercomputador / cloud", "Cálculos enormes, milhares de máquinas", "Centros de dados das grandes empresas"],
                ], "Tipos de computadores"),
                dica("Quando um técnico diz <i>host</i>, quer dizer qualquer computador que usa a rede: PC, telemóvel, servidor, impressora."),
            ],
            [
                mc("Qual a ordem do funcionamento de um computador?", ["Saída → entrada → processamento", "Entrada → processamento → saída", "Processamento → saída → entrada", "Entrada → saída → processamento"], 1,
                   "Recebe dados, processa e devolve o resultado."),
                mc("Que peça perde o conteúdo quando o computador é desligado?", ["SSD", "Disco rígido", "Memória RAM", "Flash"], 2, "A RAM é volátil."),
                mc("Que peça liga o computador à rede?", ["Placa de rede (NIC)", "Fonte de alimentação", "Processador", "Placa gráfica"], 0, "NIC = Network Interface Card."),
                vf("Um router é um tipo de computador.", True, "Tem processador, memória, sistema operativo e interfaces de rede."),
                mc("Como se chama o sistema operativo dos routers e switches Cisco?", ["Android", "Windows", "IOS", "Linux Mint"], 2, "Cisco IOS (Internetwork Operating System)."),
            ],
            ["tanenbaum_org", "patterson", "netacad_itn"],
        ),

        licao(
            "m0l6", "A história das redes e da Internet", 18,
            ["Situar no tempo as grandes invenções da informática e das redes",
             "Conhecer a ARPANET, o TCP/IP, a Ethernet e a Web",
             "Perceber porque a Internet funciona como funciona hoje"],
            [
                texto("Dos cálculos de guerra ao bolso de todos", """
<p>Os primeiros computadores eletrónicos surgiram nos anos 1940 e ocupavam salas inteiras. O <b>ENIAC</b> (1945, EUA) pesava cerca de 27 toneladas. Nas décadas seguintes, o <b>transístor</b> e o <b>circuito integrado</b> tornaram os computadores mais pequenos, baratos e rápidos. Em 1981 o <b>IBM PC</b> levou o computador pessoal aos escritórios; em 2007 os smartphones puseram um computador ligado à Internet no bolso.</p>"""),
                figura("linha_tempo", "Linha do tempo das redes de computadores."),
                tabela(["Ano", "Acontecimento", "Porque importa"], [
                    ["1945", "ENIAC, um dos primeiros computadores eletrónicos", "Início da computação eletrónica"],
                    ["1961–64", "Kleinrock e Baran estudam a comutação de pacotes", "Dividir mensagens em pacotes que seguem caminhos diferentes"],
                    ["1969", "ARPANET liga 4 universidades nos EUA; publicado o RFC 1", "A avó da Internet; os RFC ainda hoje definem os protocolos"],
                    ["1971", "Ray Tomlinson envia o primeiro e-mail em rede e usa o @", "A primeira “aplicação de sucesso” das redes"],
                    ["1973", "Bob Metcalfe cria a Ethernet na Xerox PARC", "A tecnologia das redes locais (LAN) que usamos hoje"],
                    ["1974", "Vint Cerf e Bob Kahn publicam o desenho do TCP", "Regras para ligar redes diferentes: inter-net"],
                    ["1983", "A ARPANET passa a usar TCP/IP; nasce o DNS", "Data de nascimento técnica da Internet"],
                    ["1984", "Fundação da Cisco Systems", "Routers comerciais para ligar redes"],
                    ["1989–91", "Tim Berners-Lee cria a World Wide Web no CERN", "Páginas, links e browsers: a Internet para todos"],
                    ["1995", "A Internet torna-se comercial", "Empresas e operadoras levam a Internet às casas"],
                    ["1997", "Primeira norma Wi-Fi (IEEE 802.11)", "Redes sem fios"],
                    ["1998", "Especificação do IPv6 (RFC 2460)", "A resposta ao fim dos endereços IPv4"],
                    ["2007", "Smartphones com Internet móvel", "Milhares de milhões de novos dispositivos ligados"],
                    ["2011", "A IANA distribui os últimos blocos IPv4", "NAT e IPv6 tornam-se obrigatórios"],
                    ["2020", "Novo exame CCNA 200-301 unificado", "A certificação que este curso prepara"],
                ], "Marcos que vale a pena conhecer"),
                texto("Porque foi desenhada assim", """
<p>A ARPANET foi pensada para continuar a funcionar mesmo que partes da rede falhassem. Por isso:</p>
<ul>
<li>Não há um computador central que controla tudo: a rede é <b>distribuída</b>.</li>
<li>A informação é dividida em <b>pacotes</b>, e cada pacote pode seguir um caminho diferente.</li>
<li>Os protocolos são <b>abertos</b> (RFC), para que qualquer fabricante os possa implementar.</li>
</ul>
<p>Estas três ideias explicam quase tudo o que vai estudar: routers, protocolos de encaminhamento, TCP/IP e normas.</p>"""),
                exemplo("A Internet hoje", """
<p>Hoje a Internet liga milhares de milhões de dispositivos. É uma <b>rede de redes</b>: a rede da sua casa liga ao seu operador, que liga a outros operadores, a cabos submarinos de fibra ótica entre continentes e aos centros de dados das empresas. Ninguém é “dono” da Internet inteira; há organizações que coordenam as regras (IETF) e a distribuição de endereços (IANA e os registos regionais, como o AFRINIC em África).</p>"""),
                dica("Não precisa de decorar datas para o exame CCNA. Mas conhecer a história ajuda a perceber <b>porque</b> as coisas são como são."),
            ],
            [
                mc("Como se chamava a rede que deu origem à Internet?", ["Ethernet", "ARPANET", "Wi-Fi", "NSFNET"], 1, "ARPANET, 1969."),
                mc("Quem criou a World Wide Web?", ["Bill Gates", "Tim Berners-Lee", "Bob Metcalfe", "Vint Cerf"], 1, "Tim Berners-Lee, no CERN, em 1989–91."),
                mc("Que tecnologia de redes locais foi criada por Bob Metcalfe em 1973?", ["Wi-Fi", "Bluetooth", "Ethernet", "Fibra ótica"], 2, "Ethernet, na Xerox PARC."),
                vf("A Internet foi desenhada com um computador central que controla todos os outros.", False, "Foi desenhada distribuída, sem ponto central."),
                mc("Em que ano a ARPANET adotou o TCP/IP?", ["1969", "1983", "1991", "2007"], 1, "1 de janeiro de 1983."),
            ],
            ["leiner", "isaacson", "kurose", "cerf_kahn", "metcalfe", "berners_lee", "rfc1"],
        ),

        licao(
            "m0l7", "Como a informação viaja numa rede", 18,
            ["Explicar com analogias o que é endereço IP, MAC, porta e protocolo",
             "Acompanhar uma mensagem do telemóvel até ao destino",
             "Perceber o papel do router, do switch e do DNS"],
            [
                texto("A rede é como o correio", """
<p>Imagine que quer enviar uma carta a um amigo noutra cidade. Precisa de:</p>
<ul>
<li>uma <b>morada</b> de destino e uma de remetente;</li>
<li>um <b>carteiro</b> que leve a carta dentro do bairro;</li>
<li>uma <b>central de correios</b> que decide para que cidade a carta segue;</li>
<li><b>regras</b> comuns: onde se escreve a morada, onde vai o selo.</li>
</ul>
<p>Uma rede de computadores funciona da mesma maneira.</p>"""),
                tabela(["Na rede", "No correio", "Exemplo real"], [
                    ["Endereço IP", "A morada (cidade, rua, número)", "192.168.1.25"],
                    ["Endereço MAC", "O nome gravado na caixa de correio, que nunca muda", "A4:5E:60:12:9B:3C"],
                    ["Porta (TCP/UDP)", "O apartamento ou a pessoa dentro da casa", "443 = sites seguros (HTTPS)"],
                    ["Protocolo", "As regras de como escrever e enviar a carta", "HTTP, TCP, IP, Wi-Fi"],
                    ["Pacote", "Uma carta (as mensagens grandes vão em várias)", "Uma foto do WhatsApp parte-se em centenas de pacotes"],
                    ["Switch", "O carteiro do bairro: entrega dentro da mesma rede", "O switch do escritório"],
                    ["Router", "A central de correios: envia para outras cidades (redes)", "O router de casa ou do operador"],
                    ["DNS", "A lista telefónica: nome → morada", "google.com → 142.250.x.x"],
                ], "A analogia completa"),
                topologia(
                    [("tel", "telefone_ip", 8, 50, "Telemóvel"), ("ap", "ap", 30, 50, "Wi-Fi de casa"), ("r", "router", 52, 50, "Router"),
                     ("op", "nuvem", 74, 50, "Operador / Internet"), ("srv", "servidor", 94, 50, "Servidor")],
                    [("tel", "ap", "rádio"), ("ap", "r"), ("r", "op", "fibra"), ("op", "srv")],
                    "O caminho de uma mensagem enviada pelo telemóvel."),
                exemplo("Passo a passo: enviar uma mensagem no WhatsApp", """
<ol>
<li>O telemóvel pergunta ao <b>DNS</b> qual é o endereço IP do servidor do WhatsApp.</li>
<li>A mensagem é dividida em <b>pacotes</b>. Cada um leva o IP de origem (o telemóvel) e o de destino (o servidor).</li>
<li>Os pacotes vão por <b>Wi-Fi</b> até ao router de casa.</li>
<li>O <b>router</b> vê que o destino está fora de casa e envia-os para o operador.</li>
<li>Vários routers da Internet passam os pacotes de mão em mão até ao servidor.</li>
<li>O servidor junta os pacotes, lê a mensagem e envia-a para o telemóvel do seu amigo pelo mesmo processo.</li>
</ol>
<p>Tudo isto demora menos de um segundo!</p>"""),
                texto("Rede local e Internet", """
<p>A <b>rede local (LAN)</b> é a rede da sua casa, escola ou escritório. A <b>Internet</b> é a ligação entre milhões de redes locais. O router é a fronteira entre as duas: por isso se chama <b>gateway</b> (porta de saída).</p>"""),
                dica("Experimente: no Windows abra o <i>Prompt de Comando</i> e escreva <code>ipconfig</code>. No Android: Definições › Wi-Fi › (a sua rede) › Avançado. Vai ver o seu endereço IP e o do gateway."),
            ],
            [
                mc("Na analogia do correio, o endereço IP é…", ["O selo", "A morada", "O carteiro", "A lista telefónica"], 1, "O IP indica onde está o destino."),
                mc("Que serviço traduz nomes como google.com em endereços IP?", ["DHCP", "DNS", "Wi-Fi", "MAC"], 1, "O DNS é a lista telefónica da Internet."),
                mc("Que equipamento envia os pacotes para outras redes?", ["Switch", "Router", "Cabo", "Impressora"], 1, "O router liga redes diferentes."),
                vf("Uma foto grande é enviada pela rede num único pacote.", False, "É dividida em muitos pacotes e reconstruída no destino."),
                mc("O que é o gateway?", ["O nome do Wi-Fi", "O router que dá saída para fora da rede local", "O cabo de rede", "A palavra-passe do Wi-Fi"], 1, "Gateway = porta de saída da rede local."),
            ],
            ["kurose", "tanenbaum", "netacad_itn"],
        ),

        licao(
            "m0l8", "Os números das redes: binário, hexadecimal e velocidades", 20,
            ["Perceber porque os computadores usam binário",
             "Converter números pequenos entre decimal, binário e hexadecimal",
             "Distinguir bit de byte e Mbit/s de MB/s"],
            [
                texto("Porquê zeros e uns", """
<p>Dentro de um computador tudo é eletricidade: há sinal (<b>1</b>) ou não há (<b>0</b>). Cada 0 ou 1 é um <b>bit</b>. Um conjunto de 8 bits é um <b>byte</b>. Com 8 bits podemos representar 256 valores (0 a 255) — por isso cada parte de um endereço IPv4 vai de 0 a 255!</p>"""),
                tabela(["Bit", "128", "64", "32", "16", "8", "4", "2", "1"], [
                    ["5 =", "0", "0", "0", "0", "0", "1", "0", "1"],
                    ["10 =", "0", "0", "0", "0", "1", "0", "1", "0"],
                    ["100 =", "0", "1", "1", "0", "0", "1", "0", "0"],
                    ["255 =", "1", "1", "1", "1", "1", "1", "1", "1"],
                ], "Cada posição vale o dobro da anterior"),
                exemplo("Converter 13 para binário", """
<p>Procure da esquerda para a direita os valores que cabem: 13 = <b>8</b> + <b>4</b> + <b>1</b>. Marque 1 nessas posições e 0 nas outras: <code>00001101</code>.</p>
<p>Ao contrário: <code>00010010</code> = 16 + 2 = <b>18</b>.</p>"""),
                texto("Hexadecimal: base 16", """
<p>O hexadecimal usa 16 símbolos: 0–9 e <b>A=10, B=11, C=12, D=13, E=14, F=15</b>. Cada dígito hexadecimal representa exatamente 4 bits, por isso é uma forma curta de escrever binário. Vai encontrá-lo nos endereços <b>MAC</b> (<code>00:1A:2B:…</code>) e no <b>IPv6</b> (<code>2001:db8::1</code>).</p>
<p>Exemplo: <code>1111 1010</code> = F A = <b>FA</b> = 250 em decimal.</p>"""),
                tabela(["Unidade", "Valor", "Onde aparece"], [
                    ["bit (b)", "0 ou 1", "Velocidades: Mbit/s, Gbit/s"],
                    ["byte (B)", "8 bits", "Tamanho de ficheiros: MB, GB"],
                    ["kbit/s, Mbit/s, Gbit/s", "mil, milhão, mil milhões de bits por segundo", "Velocidade da Internet e das portas"],
                    ["KB, MB, GB, TB", "Mil, milhão, mil milhões, bilião de bytes", "Disco, fotos, vídeos"],
                ], "Bits e bytes"),
                exemplo("Quanto tempo demora a descarregar um filme?", """
<p>Um filme de <b>1 GB</b> = 1000 MB = <b>8000 Mbit</b>. Com uma Internet de <b>100 Mbit/s</b>: 8000 ÷ 100 = <b>80 segundos</b> (na prática um pouco mais, por causa dos cabeçalhos e de outros utilizadores).</p>
<p>Atenção: os operadores anunciam velocidades em <b>bits</b>; o computador mostra downloads em <b>bytes</b>. 100 Mbit/s ≈ 12,5 MB/s.</p>"""),
                dica("Use a calculadora do Windows em modo <i>Programador</i> para conferir as conversões enquanto pratica."),
            ],
            [
                mc("Quantos bits tem um byte?", ["4", "8", "16", "32"], 1, "1 byte = 8 bits."),
                mc("Quanto é 00001010 em decimal?", ["8", "10", "12", "20"], 1, "8 + 2 = 10."),
                mc("Qual o maior valor que cabe em 8 bits?", ["128", "200", "255", "256"], 2, "11111111 = 255 (são 256 valores contando o 0)."),
                mc("Quanto vale F em hexadecimal?", ["10", "14", "15", "16"], 2, "A=10 … F=15."),
                mc("Uma Internet de 80 Mbit/s descarrega aproximadamente quantos MB por segundo?", ["80", "10", "640", "8"], 1, "80 ÷ 8 = 10 MB/s."),
            ],
            ["tanenbaum_org", "odom1", "netacad_itn"],
        ),
    ],
    prova_extra=[
        mc("Um colega diz que o router da empresa “não é um computador porque não tem ecrã”. O que responde?",
           ["Tem razão", "É um computador embebido: tem CPU, memória e sistema operativo", "É apenas um cabo inteligente", "Só os servidores são computadores"], 1,
           "Ter ecrã não é requisito; routers são computadores especializados."),
        mc("Qual destas ideias faz parte do desenho original da Internet?", ["Um controlador central único", "Comutação de pacotes e rede distribuída", "Só cabos de cobre", "Endereços com nomes, sem números"], 1,
           "Pacotes que podem seguir caminhos diferentes numa rede distribuída."),
        vf("O endereço MAC é escrito em hexadecimal.", True, "Ex.: 00:1A:2B:3C:4D:5E."),
    ],
)

# Ordem do módulo: primeiro a informática básica, depois as redes.
from .m00_basicos import COMUNICAR, INFORMATICA, SOFTWARE, SURGIMENTO  # noqa: E402

_comp, _hist, _viagem, _numeros = MODULO["licoes"]
MODULO["licoes"] = [INFORMATICA, SURGIMENTO, _comp, SOFTWARE, COMUNICAR, _hist, _viagem, _numeros]
