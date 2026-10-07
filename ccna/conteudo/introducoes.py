"""Aulas “Comece por aqui”: a primeira aula de cada módulo, em linguagem simples.

Cada uma explica o tema do zero, com analogias do dia a dia e exemplos reais,
antes de entrar nos detalhes técnicos. São inseridas automaticamente como
primeira lição do módulo (ver conteudo/__init__.py).
"""

from .base import *

INTRODUCOES = {
    "m1": licao(
        "m1l0", "Comece por aqui: redes à nossa volta", 10,
        ["Reconhecer redes no dia a dia", "Conhecer as palavras-chave do módulo"],
        [
            texto("Já usa redes todos os dias", """
<p>Quando paga com cartão numa loja, o terminal fala com o banco por uma rede. Quando vê uma série, o vídeo chega por uma rede. No hospital, o resultado da análise aparece no computador do médico porque o laboratório e o consultório estão na mesma rede.</p>
<p>Uma rede é simplesmente <b>equipamentos ligados para partilhar informação</b>. Neste módulo vai conhecer as peças: que equipamentos existem, como se ligam e que cabos usam.</p>"""),
            tabela(["Palavra", "Em linguagem simples"], [
                ["Rede", "Equipamentos ligados que trocam informação"],
                ["Host", "Qualquer equipamento do utilizador: PC, telemóvel, impressora"],
                ["Switch", "Caixa com muitas portas que liga os equipamentos do mesmo local"],
                ["Router", "Equipamento que liga uma rede a outra (por exemplo, à Internet)"],
                ["Access point", "Antena que cria o Wi-Fi"],
                ["Cabo UTP", "O cabo de rede “normal”, com ficha RJ45"],
                ["Fibra ótica", "Cabo que transporta luz, para longas distâncias"],
            ], "Palavras que vai encontrar"),
            topologia(
                [("pc", "pc", 10, 30, "Caixa"), ("imp", "pc", 10, 80, "Escritório"), ("sw", "switch", 42, 55, "Switch"),
                 ("ap", "ap", 42, 10, "Wi-Fi"), ("r", "router", 70, 55, "Router"), ("net", "nuvem", 92, 55, "Banco / Internet")],
                [("pc", "sw"), ("imp", "sw"), ("ap", "sw"), ("sw", "r"), ("r", "net")],
                "A rede de uma pequena loja: dois computadores, Wi-Fi para os clientes e ligação à Internet."),
            exemplo("Pense na sua casa", """
<p>A “caixa” que o operador instalou faz quase tudo: é <b>router</b> (liga à Internet), <b>switch</b> (tem 4 portas de cabo), <b>access point</b> (cria o Wi-Fi) e <b>firewall</b> (bloqueia acessos de fora). Numa empresa, cada uma destas funções é um equipamento separado e mais potente.</p>"""),
            video("Redes de computadores para iniciantes", "redes de computadores para iniciantes aula 1"),
        ],
        [
            mc("Na “caixa” de Internet de casa, que função cria o Wi-Fi?", ["Switch", "Access point", "Firewall", "Cabo"], 1, "O access point emite o sinal sem fios."),
            vf("Um switch serve para ligar equipamentos do mesmo local.", True, "Liga os equipamentos da rede local."),
            mc("Que equipamento liga a rede da loja à rede do banco?", ["Switch", "Impressora", "Router", "Monitor"], 2, "Ligar redes diferentes é o papel do router."),
        ],
        ["netacad_itn", "kurose"],
    ),

    "m2": licao(
        "m2l0", "Comece por aqui: porque a comunicação tem regras e camadas", 10,
        ["Perceber a ideia de camadas com uma analogia", "Saber o que é um protocolo"],
        [
            texto("Enviar uma encomenda", """
<p>Para enviar uma encomenda: <b>1)</b> escolhe o presente, <b>2)</b> embala-o, <b>3)</b> escreve a morada na etiqueta, <b>4)</b> a transportadora põe-no num camião, <b>5)</b> o camião anda pela estrada. Cada passo tem a sua tarefa e não precisa de saber como funcionam os outros: o motorista não abre a caixa.</p>
<p>Nas redes é igual. Cada <b>camada</b> trata de uma parte: a aplicação cria a mensagem, o transporte garante que chega inteira, a camada de rede põe a morada (IP), a ligação de dados entrega ao vizinho seguinte e a camada física transforma tudo em sinais.</p>"""),
            tabela(["Passo da encomenda", "Camada de rede"], [
                ["O presente", "Dados da aplicação (a mensagem)"],
                ["A caixa com nota “frágil, confirmar receção”", "Transporte (TCP): confirmações e ordem"],
                ["A etiqueta com a morada", "Rede (IP): endereço de origem e destino"],
                ["O camião entre dois armazéns", "Ligação de dados (Ethernet/Wi-Fi): de um equipamento ao seguinte"],
                ["A estrada", "Física: cabo, fibra, ondas de rádio"],
            ]),
            texto("O que é um protocolo", """
<p>Um <b>protocolo</b> é um conjunto de regras combinadas, como as regras de trânsito ou a forma de começar um telefonema (“Estou? / Sim, diga.”). Exemplos: <b>HTTP</b> (páginas web), <b>TCP</b> (entrega fiável), <b>IP</b> (endereços), <b>Ethernet</b> (rede com cabo).</p>"""),
            dica("Sempre que algo não funciona, os técnicos perguntam “em que camada está o problema?”. É o método que vai aprender aqui."),
            video("Camadas de rede explicadas", "camadas de rede explicação simples analogia"),
        ],
        [
            mc("Na analogia da encomenda, a etiqueta com a morada corresponde a…", ["Camada física", "Camada de rede (IP)", "Aplicação", "Cabo"], 1, "A morada = endereço IP."),
            vf("Um protocolo é um conjunto de regras de comunicação.", True, "Define formato, ordem e significado das mensagens."),
            mc("Que camada transforma os dados em sinais no cabo?", ["Física", "Transporte", "Aplicação", "Sessão"], 0, "A camada física."),
        ],
        ["kurose", "iso7498"],
    ),

    "m3": licao(
        "m3l0", "Comece por aqui: o que é um endereço IP?", 14,
        ["Explicar o que é um endereço IP com exemplos reais",
         "Distinguir IP público e privado",
         "Descobrir o IP do seu computador e telemóvel"],
        [
            texto("A morada de cada equipamento", """
<p>Um <b>endereço IP</b> (Internet Protocol) é o número que identifica um equipamento numa rede, tal como a morada identifica uma casa. Sem IP, os pacotes não sabem para onde ir.</p>
<p>Um endereço IPv4 tem <b>quatro números separados por pontos</b>, cada um de 0 a 255. Exemplos:</p>
<ul>
<li><code>192.168.1.1</code> — normalmente o router de casa;</li>
<li><code>192.168.1.23</code> — o seu telemóvel ligado ao Wi-Fi de casa;</li>
<li><code>8.8.8.8</code> — um servidor de DNS público na Internet.</li>
</ul>"""),
            exemplo("Rua e número da porta", """
<p>Num endereço como <code>192.168.1.23</code> com máscara <code>255.255.255.0</code>:</p>
<ul>
<li><code>192.168.1</code> é a <b>rede</b> — como o nome da <b>rua</b>. Todos os equipamentos da sua casa têm esta parte igual.</li>
<li><code>23</code> é o <b>host</b> — como o <b>número da porta</b>. Cada equipamento tem um número diferente.</li>
</ul>
<p>A <b>máscara</b> é o que diz onde acaba a rua e começa o número da porta. Vai aprender a lê-la nas próximas aulas.</p>"""),
            topologia(
                [("r", "router", 50, 15, "Router 192.168.1.1"), ("pc", "pc", 15, 80, "PC 192.168.1.10"),
                 ("tel", "telefone_ip", 50, 80, "Telemóvel 192.168.1.23"), ("tv", "portatil", 85, 80, "Smart TV 192.168.1.40")],
                [("r", "pc"), ("r", "tel"), ("r", "tv")],
                "Todos na mesma “rua” 192.168.1.x, cada um com o seu número."),
            tabela(["", "IP privado", "IP público"], [
                ["Onde se usa", "Dentro de casa ou da empresa", "Na Internet"],
                ["Exemplos", "192.168.x.x · 10.x.x.x · 172.16–31.x.x", "Atribuído pelo operador, ex. 102.x.x.x"],
                ["Repete-se?", "Sim, milhões de casas usam 192.168.1.x", "Não, é único no mundo"],
                ["Quem dá", "O router (DHCP)", "O operador de Internet"],
            ], "Privado e público"),
            texto("Como os equipamentos recebem o IP", """
<p>Quase sempre <b>automaticamente</b>: quando o telemóvel liga ao Wi-Fi, pede um IP ao router, que lho empresta por algum tempo. Este serviço chama-se <b>DHCP</b>. Servidores, impressoras e routers costumam ter IP <b>fixo</b> (estático), configurado à mão, para não mudar.</p>"""),
            tabela(["Equipamento", "Onde ver o IP"], [
                ["Windows", "Prompt de Comando › ipconfig"],
                ["macOS / Linux", "Terminal › ifconfig ou ip addr"],
                ["Android", "Definições › Wi-Fi › rede ligada › Avançado"],
                ["iPhone", "Definições › Wi-Fi › (i) ao lado da rede"],
                ["Router Cisco", "show ip interface brief"],
            ], "Descubra o seu"),
            dica("Há duas versões: <b>IPv4</b> (ex. 192.168.1.23) e <b>IPv6</b> (ex. 2001:db8::23), criado porque os endereços IPv4 acabaram. Estuda os dois neste módulo."),
            video("O que é um endereço IP", "o que é endereço IP explicado para iniciantes IP público privado"),
        ],
        [
            mc("Qual destes é um endereço IPv4 válido?", ["192.168.1.300", "192.168.1.30", "192.168.1", "192-168-1-30"], 1, "Quatro números de 0 a 255 separados por pontos."),
            mc("O telemóvel tem 192.168.1.23 e o router 192.168.1.1. Que parte é igual (a “rua”)?", ["192.168.1", "23", "1", ".1.23"], 0, "Com máscara 255.255.255.0, os três primeiros números são a rede."),
            vf("O endereço 192.168.1.10 pode existir em milhares de casas diferentes.", True, "É privado; repete-se em redes diferentes."),
            mc("Que serviço dá automaticamente um IP ao telemóvel quando liga ao Wi-Fi?", ["DNS", "DHCP", "HTTP", "SSH"], 1, "DHCP."),
        ],
        ["rfc791", "rfc1918", "netacad_itn"],
    ),

    "m4": licao(
        "m4l0", "Comece por aqui: o que é o Cisco IOS e a linha de comandos", 12,
        ["Perceber o que é uma CLI", "Instalar o Packet Tracer para praticar"],
        [
            texto("Escrever em vez de clicar", """
<p>No telemóvel usa ícones e botões: é uma <b>interface gráfica</b> (GUI). Os equipamentos de rede profissionais configuram-se sobretudo <b>escrevendo comandos</b> numa <b>linha de comandos</b> (CLI). Parece antiquado, mas é rápido, preciso, funciona por ligações lentas e permite copiar a mesma configuração para 100 equipamentos.</p>
<p>O sistema operativo dos equipamentos Cisco chama-se <b>IOS</b>. Um comando é uma frase curta em inglês: <code>show ip interface brief</code> significa “mostra, de forma resumida, as interfaces e os seus IP”.</p>"""),
            exemplo("Um primeiro olhar", """
<pre><code>Router&gt; enable
Router# configure terminal
Router(config)# hostname LOJA-R1
LOJA-R1(config)#</code></pre>
<p>O texto antes do cursor (<code>Router&gt;</code>) é o <b>prompt</b>: mostra o nome do equipamento e em que “sala” está. Ao mudar o nome, o prompt muda logo.</p>"""),
            cli("Instalar o Cisco Packet Tracer (gratuito)", [
                ("1", "Criar conta em netacad.com", "Inscreva-se no curso gratuito “Getting Started with Cisco Packet Tracer”."),
                ("2", "Descarregar o Packet Tracer", "Disponível para Windows, Linux e macOS."),
                ("3", "Instalar e entrar com a conta NetAcad", ""),
                ("4", "Arrastar um router e clicar nele › separador CLI", "Já pode escrever os primeiros comandos."),
            ], "Enquanto não instala, use o <b>Laboratório CLI</b> desta app (separador Jogar)."),
            dica("Não tenha medo de errar: no simulador nada se estraga. Se escrever algo errado, o IOS mostra <code>% Invalid input</code> e aponta o erro com <code>^</code>."),
            video("Instalar Packet Tracer e primeiros comandos", "instalar Cisco Packet Tracer primeiros comandos tutorial"),
        ],
        [
            mc("O que é uma CLI?", ["Um tipo de cabo", "Uma interface onde se escrevem comandos", "Um antivírus", "Uma placa de rede"], 1, "Command Line Interface."),
            mc("Como se chama o sistema operativo dos equipamentos Cisco?", ["IOS", "Windows Server", "Android", "Ubuntu"], 0, "Cisco IOS."),
            vf("O Packet Tracer é gratuito para quem cria conta na Cisco Networking Academy.", True, "Basta a conta NetAcad."),
        ],
        ["cisco_pt", "cisco_ios"],
    ),

    "m5": licao(
        "m5l0", "Comece por aqui: switches e VLANs sem complicações", 10,
        ["Perceber o que faz um switch", "Perceber para que serve uma VLAN"],
        [
            texto("O switch é o carteiro do edifício", """
<p>Num edifício, o carteiro conhece o nome de quem mora em cada apartamento e entrega cada carta na porta certa. O <b>switch</b> faz o mesmo: aprende que equipamento está ligado em cada porta e envia cada mensagem só para quem deve.</p>"""),
            texto("A VLAN separa departamentos", """
<p>Imagine que no mesmo edifício trabalham a Contabilidade, a Receção e os Convidados. Não quer que um convidado veja os ficheiros da Contabilidade. Uma <b>VLAN</b> divide o mesmo switch em várias redes separadas, como se cada departamento tivesse o seu próprio switch.</p>"""),
            topologia(
                [("sw", "switch", 50, 50, "Switch"), ("a", "pc", 12, 15, "Contabilidade VLAN 10"), ("b", "pc", 12, 85, "Receção VLAN 20"),
                 ("c", "portatil", 88, 15, "Convidados VLAN 30"), ("ap", "ap", 88, 85, "Wi-Fi")],
                [("a", "sw"), ("b", "sw"), ("c", "sw"), ("ap", "sw")],
                "Um só switch, três redes separadas."),
            exemplo("Num hospital", """
<p>Equipamentos médicos, computadores administrativos e Wi-Fi para visitantes ficam em VLANs diferentes. Se o portátil de um visitante tiver um vírus, não chega aos equipamentos médicos.</p>"""),
            video("O que é uma VLAN", "o que é VLAN explicação simples switch"),
        ],
        [
            mc("O que faz o switch com uma mensagem para um equipamento que conhece?", ["Envia para todas as portas", "Envia só para a porta desse equipamento", "Apaga-a", "Envia para a Internet"], 1, "Encaminha só para a porta certa."),
            mc("Para que serve uma VLAN?", ["Aumentar o Wi-Fi", "Separar redes no mesmo switch", "Carregar telemóveis", "Substituir o router"], 1, "Separa grupos em redes diferentes."),
            vf("Equipamentos em VLANs diferentes comunicam diretamente sem router.", False, "Precisam de um router ou switch L3."),
        ],
        ["netacad_srwe", "odom1"],
    ),

    "m6": licao(
        "m6l0", "Comece por aqui: o que é encaminhar (routing)?", 10,
        ["Perceber o que faz um router com cada pacote", "Saber o que é uma rota e uma tabela de encaminhamento"],
        [
            texto("O router é como o GPS", """
<p>Quando conduz até outra cidade, segue as placas: “Luanda →”, “Benguela ←”. O router tem uma lista de placas chamada <b>tabela de encaminhamento</b>: para cada rede de destino, diz por onde enviar o pacote.</p>
<p>Uma <b>rota</b> é uma linha dessa tabela: “para a rede 10.2.0.0, envia para o vizinho 10.0.0.2”. As rotas podem ser escritas à mão (<b>estáticas</b>) ou aprendidas automaticamente com outros routers (<b>dinâmicas</b>, como o OSPF).</p>"""),
            topologia(
                [("a", "switch", 8, 50, "Sede"), ("r1", "router", 32, 50, "R1"), ("r2", "router", 62, 20, "R2"), ("r3", "router", 62, 80, "R3"), ("b", "switch", 92, 50, "Filial")],
                [("a", "r1"), ("r1", "r2"), ("r1", "r3"), ("r2", "b"), ("r3", "b")],
                "Dois caminhos até à filial: o router escolhe o melhor e usa o outro se o primeiro falhar."),
            exemplo("A rota por defeito", """
<p>O router de casa só conhece a rede da casa. Para tudo o resto tem uma regra: “se não sabes, manda para o operador”. Chama-se <b>rota por defeito</b> (0.0.0.0/0), como a placa “todas as direções”.</p>"""),
            video("O que é roteamento", "o que é roteamento routing explicado simples"),
        ],
        [
            mc("Como se chama a lista de rotas de um router?", ["Tabela MAC", "Tabela de encaminhamento", "Lista de contactos", "VLAN"], 1, "Routing table."),
            mc("Uma rota escrita à mão pelo técnico é…", ["Dinâmica", "Estática", "Automática", "Wireless"], 1, "Estática."),
            vf("A rota por defeito é usada quando não existe uma rota mais específica.", True, "É o último recurso."),
        ],
        ["odom2", "kurose"],
    ),

    "m7": licao(
        "m7l0", "Comece por aqui: serviços que usa sem saber", 10,
        ["Reconhecer DHCP, DNS, NAT e NTP no dia a dia"],
        [
            tabela(["Serviço", "Comparação", "O que faz"], [
                ["DHCP", "A receção do hotel que entrega a chave do quarto", "Dá IP, gateway e DNS automaticamente"],
                ["DNS", "A lista de contactos do telemóvel", "Converte nomes (site.ao) em endereços IP"],
                ["NAT", "Uma família inteira com uma só morada para o correio", "Muitos equipamentos privados saem com um IP público"],
                ["NTP", "O relógio da estação a que todos acertam o seu", "Sincroniza a hora dos equipamentos"],
                ["Syslog", "O livro de ocorrências do porteiro", "Regista o que acontece nos equipamentos"],
                ["QoS", "A faixa de emergência na estrada", "Dá prioridade a chamadas de voz e vídeo"],
            ], "Os serviços deste módulo"),
            exemplo("Quando liga o portátil no café", """
<p>O <b>DHCP</b> do router do café dá-lhe um IP. Ao abrir um site, o <b>DNS</b> descobre o IP do servidor. Ao sair para a Internet, o <b>NAT</b> troca o seu IP privado pelo IP público do café. Tudo em milissegundos.</p>"""),
            video("DHCP DNS NAT explicados", "DHCP DNS NAT explicação simples"),
        ],
        [
            mc("Que serviço converte nomes de sites em IP?", ["DHCP", "DNS", "NAT", "NTP"], 1, "DNS."),
            mc("Que serviço permite que toda a casa use um único IP público?", ["NAT", "DNS", "Syslog", "QoS"], 0, "NAT/PAT."),
            vf("O NTP serve para sincronizar a hora.", True, "Network Time Protocol."),
        ],
        ["kurose", "odom2"],
    ),

    "m8": licao(
        "m8l0", "Comece por aqui: porque as redes são atacadas", 10,
        ["Perceber as ameaças mais comuns", "Relacionar defesas de rede com a segurança de uma casa"],
        [
            texto("Informação vale dinheiro", """
<p>Dados bancários, registos de doentes, segredos de empresas e até a simples capacidade de usar a sua Internet têm valor para criminosos. Por isso as redes são atacadas todos os dias, quase sempre de forma automática.</p>"""),
            tabela(["Numa casa", "Na rede"], [
                ["Fechadura na porta", "Palavras-passe fortes e autenticação"],
                ["Porteiro que só deixa entrar quem está na lista", "Firewall e listas de acesso (ACL)"],
                ["Câmaras de vigilância", "Registos (logs) e monitorização"],
                ["Cofre para os objetos de valor", "Cifra (encriptação) dos dados"],
                ["Não abrir a porta a desconhecidos", "Não clicar em links suspeitos (phishing)"],
            ], "Segurança por camadas"),
            exemplo("Casos reais comuns", """
<ul>
<li>SMS “o seu pacote está retido, clique aqui” — <b>phishing</b> para roubar dados.</li>
<li>Wi-Fi aberto com o mesmo nome do café — <b>falso access point</b> para espiar.</li>
<li>Ficheiros cifrados com pedido de resgate — <b>ransomware</b>.</li>
</ul>"""),
            video("Segurança de redes para iniciantes", "segurança de redes para iniciantes ameaças comuns"),
        ],
        [
            mc("Na comparação com uma casa, a firewall é…", ["O cofre", "O porteiro", "A janela", "O carteiro"], 1, "Decide quem pode entrar."),
            mc("Um SMS falso que pede para clicar num link é…", ["Phishing", "DHCP", "VLAN", "Backup"], 0, "Phishing (smishing quando é por SMS)."),
            vf("Cifrar dados protege-os mesmo que alguém os intercete.", True, "Sem a chave não se leem."),
        ],
        ["odom2", "nist"],
    ),

    "m9": licao(
        "m9l0", "Comece por aqui: deixar o computador fazer o trabalho repetitivo", 10,
        ["Perceber o que é automação de redes", "Ver porque Python é útil para técnicos de redes"],
        [
            texto("100 switches, a mesma alteração", """
<p>Imagine que tem de mudar o servidor de horas (NTP) em 100 switches. À mão: entrar em cada um, escrever os comandos, guardar — um dia inteiro e com risco de erro. Com <b>automação</b>, um pequeno programa faz o mesmo em minutos, sempre igual.</p>"""),
            exemplo("Um programa Python de 6 linhas", """
<pre><code>switches = ["10.0.0.11", "10.0.0.12", "10.0.0.13"]
for ip in switches:
    print("A configurar", ip)
    # ligar por SSH e enviar: ntp server 10.0.0.100
print("Concluído!")</code></pre>
<p>No módulo vai ver a versão completa com a biblioteca <b>Netmiko</b>, e também APIs, JSON e controladores.</p>"""),
            dica("Não precisa de ser programador para o CCNA: basta perceber os conceitos e ler exemplos simples."),
            video("Automação de redes para iniciantes", "automação de redes Python iniciantes"),
        ],
        [
            mc("Qual a principal vantagem da automação?", ["Gastar mais cabos", "Fazer tarefas repetitivas de forma rápida e consistente", "Desligar a firewall", "Eliminar o IP"], 1, "Rapidez e consistência."),
            vf("Python é muito usado na automação de redes.", True, "Com bibliotecas como Netmiko e Nornir."),
            mc("Com automação, uma alteração em 100 switches…", ["É impossível", "Pode ser feita por um script em minutos", "Exige trocar os switches", "Só funciona com Wi-Fi"], 1, "Um script repete a tarefa em todos."),
        ],
        ["edelman", "cisco_devnet"],
    ),
}
