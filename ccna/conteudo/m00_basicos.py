"""Aulas de informática básica do Módulo 0 (antes de falar de redes)."""

from .base import *

INFORMATICA = licao(
    "m0l1", "O que é a informática", 15,
    ["Explicar o que é a informática e de onde vem a palavra",
     "Distinguir dados, informação e conhecimento",
     "Conhecer as partes de um sistema informático",
     "Reconhecer onde a informática está presente e que profissões existem"],
    [
        texto("Informação + automática", """
<p>A palavra <b>informática</b> junta <b>informação</b> e <b>automática</b>: é a ciência que estuda o <b>tratamento automático da informação</b> por meio de computadores. Em vez de uma pessoa fazer contas, arquivar papéis ou enviar cartas, uma máquina faz isso de forma rápida e sem cansar.</p>
<p>Também se usa a sigla <b>TIC</b>, Tecnologias da Informação e Comunicação, que junta a informática com as telecomunicações (telefone, rádio, Internet).</p>"""),
        tabela(["Nível", "O que é", "Exemplo num hospital"], [
            ["Dados", "Factos soltos, sem contexto", "38,9 · 120/80 · Maria · 14h"],
            ["Informação", "Dados organizados que têm significado", "A doente Maria tinha 38,9 °C de febre às 14h"],
            ["Conhecimento", "Informação interpretada que permite decidir", "A febre subiu desde ontem: o médico pede análises"],
        ], "Dados, informação e conhecimento"),
        texto("O sistema informático", """
<p>Um <b>sistema informático</b> é o conjunto de tudo o que é preciso para tratar informação:</p>
<ul>
<li><b>Hardware</b>: as peças físicas (computador, ecrã, impressora, cabos).</li>
<li><b>Software</b>: os programas (sistema operativo e aplicações).</li>
<li><b>Dados</b>: a informação que se guarda e trata.</li>
<li><b>Pessoas</b>: quem usa e quem mantém (utilizadores e técnicos).</li>
<li><b>Redes</b>: o que liga tudo para a informação circular. É aqui que este curso vai mais fundo.</li>
</ul>"""),
        topologia(
            [("pc", "pc", 12, 30, "Hardware"), ("srv", "servidor", 50, 12, "Dados"), ("p", "portatil", 88, 30, "Software"),
             ("sw", "switch", 50, 55, "Rede"), ("pes", "telefone_ip", 50, 92, "Pessoas")],
            [("pc", "sw"), ("srv", "sw"), ("p", "sw"), ("sw", "pes")],
            "As peças de um sistema informático: a rede é o que as liga."),
        tabela(["Área", "Como usa a informática"], [
            ["Saúde", "Processo clínico eletrónico, análises, imagiologia, farmácia"],
            ["Bancos", "Contas, transferências, multibanco, pagamentos por telemóvel"],
            ["Educação", "Plataformas de ensino, matrículas, bibliotecas digitais"],
            ["Comércio", "Caixas registadoras, stock, lojas online"],
            ["Transportes", "Bilhetes, GPS, controlo de tráfego aéreo"],
            ["Casa", "Telemóvel, televisão, câmaras, eletrodomésticos inteligentes"],
        ], "A informática está em todo o lado"),
        tabela(["Profissão", "O que faz"], [
            ["Técnico de suporte (helpdesk)", "Ajuda os utilizadores e resolve avarias"],
            ["Técnico / administrador de redes", "Instala e mantém a rede — o objetivo deste curso"],
            ["Administrador de sistemas", "Gere servidores e sistemas operativos"],
            ["Especialista em cibersegurança", "Protege sistemas e dados contra ataques"],
            ["Programador", "Cria software"],
            ["Engenheiro de cloud", "Gere serviços em centros de dados"],
        ], "Profissões da informática"),
        dica("Guarde esta ideia: a informática trata a informação; as <b>redes</b> fazem a informação chegar onde é precisa."),
    ],
    [
        mc("A palavra informática vem de…", ["Informação + automática", "Internet + matemática", "Informação + prática", "Inteligência + máquina"], 0, "Tratamento automático da informação."),
        mc("“38,9” sozinho é…", ["Conhecimento", "Informação", "Um dado", "Um programa"], 2, "Sem contexto é apenas um dado."),
        mc("Qual destes NÃO é hardware?", ["Teclado", "Sistema operativo", "Impressora", "Cabo de rede"], 1, "O sistema operativo é software."),
        vf("As pessoas fazem parte de um sistema informático.", True, "Utilizadores e técnicos são uma das partes do sistema."),
        mc("Que profissão instala e mantém redes de computadores?", ["Programador", "Técnico/administrador de redes", "Designer", "Contabilista"], 1, "É a profissão para que este curso prepara."),
    ],
    ["tanenbaum_org", "comer", "netacad_itn"],
)

SURGIMENTO = licao(
    "m0l2", "Como surgiram os computadores", 20,
    ["Contar a evolução das máquinas de calcular até ao smartphone",
     "Conhecer as gerações dos computadores",
     "Perceber a Lei de Moore e porque os computadores ficaram pequenos e baratos"],
    [
        texto("Tudo começou com a necessidade de calcular", """
<p>Desde sempre as pessoas precisaram de contar e calcular: colheitas, comércio, impostos, navegação. O <b>ábaco</b>, usado há milhares de anos, é uma das primeiras ferramentas de cálculo. Com o tempo foram surgindo máquinas cada vez mais capazes.</p>"""),
        tabela(["Ano", "Invenção", "Porque importa"], [
            ["Antiguidade", "Ábaco", "Contas com contas de madeira: a primeira “calculadora”"],
            ["1642", "Pascalina, de Blaise Pascal", "Máquina mecânica que somava e subtraía"],
            ["1804", "Tear de Jacquard com cartões perfurados", "Uma máquina seguia “instruções” gravadas em cartões"],
            ["1837", "Máquina analítica de Charles Babbage (projeto)", "Primeiro desenho de um computador programável"],
            ["1843", "Ada Lovelace escreve o primeiro algoritmo", "Considerada a primeira programadora da história"],
            ["1890", "Máquina de Hollerith processa o censo dos EUA", "Cartões perfurados para tratar dados em massa (origem da IBM)"],
            ["1936", "Alan Turing descreve a “máquina de Turing”", "A base teórica de todos os computadores"],
            ["1943–45", "Colossus (Reino Unido) e ENIAC (EUA)", "Primeiros computadores eletrónicos"],
            ["1945", "Arquitetura de von Neumann", "Programa e dados guardados na mesma memória, como hoje"],
            ["1947", "Transístor (Bell Labs)", "Substitui as válvulas: mais pequeno, rápido e fiável"],
            ["1958", "Circuito integrado", "Muitos transístores num só chip"],
            ["1971", "Microprocessador Intel 4004", "Um processador inteiro num chip"],
            ["1977–81", "Apple II e IBM PC", "O computador pessoal chega a casas e escritórios"],
            ["1984", "Macintosh populariza a interface gráfica e o rato", "Computadores fáceis de usar para todos"],
            ["2007", "Smartphones com ecrã tátil e Internet", "Um computador no bolso"],
        ], "Da contagem ao bolso"),
        tabela(["Geração", "Período aproximado", "Tecnologia", "Como era"], [
            ["1.ª", "1940–1956", "Válvulas", "Ocupava salas, aquecia muito, avariava com frequência"],
            ["2.ª", "1956–1963", "Transístores", "Menor, mais fiável, linguagens como FORTRAN e COBOL"],
            ["3.ª", "1964–1971", "Circuitos integrados", "Sistemas operativos e utilizadores ao mesmo tempo"],
            ["4.ª", "1971–hoje", "Microprocessadores", "Computadores pessoais, portáteis, telemóveis"],
            ["5.ª", "Atual / futuro", "Processamento paralelo e IA", "Inteligência artificial, cloud, computação quântica em estudo"],
        ], "As gerações de computadores"),
        figura("computador_partes", "Desde a arquitetura de von Neumann, todos os computadores têm entrada, processamento, memória e saída."),
        exemplo("A Lei de Moore", """
<p>Em 1965, Gordon Moore (um dos fundadores da Intel) observou que o número de transístores num chip <b>duplicava aproximadamente a cada dois anos</b>. Durante décadas foi assim: o ENIAC tinha cerca de 18 000 válvulas; um processador de telemóvel atual tem milhares de milhões de transístores, num chip menor do que uma unha.</p>
<p>Resultado: computadores cada vez mais pequenos, rápidos e baratos — e cada vez mais deles, o que tornou indispensável ligá-los em <b>rede</b>.</p>"""),
        dica("Nomes que vale a pena lembrar: <b>Ada Lovelace</b> (primeiro algoritmo), <b>Alan Turing</b> (teoria da computação), <b>John von Neumann</b> (arquitetura dos computadores)."),
    ],
    [
        mc("Quem é considerada a primeira programadora da história?", ["Marie Curie", "Ada Lovelace", "Grace Kelly", "Rosalind Franklin"], 1, "Ada Lovelace escreveu o primeiro algoritmo para a máquina de Babbage."),
        mc("Que invenção de 1947 substituiu as válvulas?", ["O transístor", "O rato", "O disco rígido", "A fibra ótica"], 0, "O transístor, nos Bell Labs."),
        mc("A 4.ª geração de computadores é marcada pelo…", ["Ábaco", "Microprocessador", "Cartão perfurado", "Válvula"], 1, "Microprocessadores, desde 1971."),
        vf("A Lei de Moore diz que o número de transístores num chip duplica aproximadamente a cada dois anos.", True, "Observação de Gordon Moore em 1965."),
        mc("Na arquitetura de von Neumann…", ["Programa e dados ficam na mesma memória", "Não há memória", "Só existem cartões perfurados", "O computador não tem processador"], 0, "É o modelo de quase todos os computadores atuais."),
    ],
    ["isaacson", "tanenbaum_org", "patterson"],
)

SOFTWARE = licao(
    "m0l4", "Software, sistemas operativos e ficheiros", 18,
    ["Explicar o que faz um sistema operativo",
     "Organizar ficheiros e pastas e reconhecer extensões",
     "Distinguir interface gráfica e linha de comandos",
     "Usar os primeiros comandos no Prompt do Windows"],
    [
        texto("O sistema operativo é o gestor do computador", """
<p>O <b>sistema operativo</b> (SO) é o primeiro programa que arranca e fica a trabalhar o tempo todo. Ele:</p>
<ul>
<li>gere o <b>processador</b> e a <b>memória</b>, repartindo-os entre as aplicações abertas;</li>
<li>guarda e encontra os <b>ficheiros</b> no armazenamento;</li>
<li>controla os <b>dispositivos</b> (teclado, ecrã, impressora) através de <b>drivers</b>;</li>
<li>gere os <b>utilizadores</b>, palavras-passe e permissões;</li>
<li>liga o computador à <b>rede</b>: é o SO que fala TCP/IP!</li>
</ul>"""),
        tabela(["Sistema operativo", "Onde se usa"], [
            ["Windows", "A maioria dos computadores de escritório"],
            ["macOS", "Computadores da Apple"],
            ["Linux", "Servidores, routers, supercomputadores, também em PCs"],
            ["Android / iOS", "Telemóveis e tablets"],
            ["Cisco IOS / IOS-XE", "Routers e switches Cisco"],
        ], "Sistemas operativos comuns"),
        texto("Ficheiros e pastas", """
<p>Um <b>ficheiro</b> guarda um conteúdo (um texto, uma foto, um programa). As <b>pastas</b> organizam os ficheiros, como gavetas. O fim do nome, a <b>extensão</b>, indica o tipo: <code>.docx</code> (Word), <code>.pdf</code>, <code>.jpg</code> (imagem), <code>.mp4</code> (vídeo), <code>.exe</code> (programa no Windows), <code>.txt</code> (texto simples). Uma configuração de router guardada é normalmente um ficheiro <code>.txt</code>.</p>"""),
        tabela(["", "Interface gráfica (GUI)", "Linha de comandos (CLI)"], [
            ["Como se usa", "Janelas, ícones, rato, toque", "Escrevendo comandos"],
            ["Vantagem", "Fácil de aprender", "Rápida, precisa, automatizável"],
            ["Exemplo", "Explorador de Ficheiros", "Prompt de Comando, PowerShell, terminal Linux, Cisco IOS"],
        ], "Duas formas de dar ordens ao computador"),
        cli("Primeiros comandos no Prompt do Windows", [
            ("C:\\>", "dir", "Lista os ficheiros e pastas da pasta atual."),
            ("C:\\>", "cd Documentos", "Entra na pasta Documentos (cd = change directory)."),
            ("C:\\>", "cd ..", "Volta à pasta anterior."),
            ("C:\\>", "ipconfig", "Mostra o endereço IP do computador — vai usá-lo muitas vezes!"),
            ("C:\\>", "ping 8.8.8.8", "Testa se o computador chega a um servidor na Internet."),
        ], "Abra-o escrevendo <b>cmd</b> na pesquisa do Windows. No Linux e macOS use a aplicação Terminal (<code>ls</code> em vez de <code>dir</code>)."),
        texto("Aplicações, atualizações e segurança", """
<p>As <b>aplicações</b> correm por cima do sistema operativo: browser, e-mail, Office, WhatsApp. Manter o SO e as aplicações <b>atualizados</b> corrige falhas de segurança. Um <b>antivírus</b> protege contra programas maliciosos, e as <b>contas de utilizador</b> com palavra-passe impedem que qualquer pessoa use o computador.</p>"""),
        dica("Um router é um computador com um sistema operativo próprio (o IOS) e quase só linha de comandos. Por isso treinar o Prompt do Windows já ajuda!"),
    ],
    [
        mc("Qual destas tarefas é do sistema operativo?", ["Escrever cartas", "Gerir memória, ficheiros e dispositivos", "Fazer café", "Desenhar logótipos"], 1, "O SO gere os recursos do computador."),
        mc("Que extensão indica um documento PDF?", [".exe", ".jpg", ".pdf", ".mp3"], 2, ".pdf."),
        mc("O programa que permite ao SO usar uma impressora chama-se…", ["Driver", "Vírus", "Pasta", "Browser"], 0, "Driver (controlador)."),
        cmd("Que comando do Windows mostra o endereço IP do computador?", ["ipconfig", "ipconfig /all"], "ipconfig."),
        vf("A linha de comandos permite automatizar tarefas mais facilmente do que a interface gráfica.", True, "Comandos podem ser repetidos e guardados em scripts."),
    ],
    ["tanenbaum_org", "comer", "netacad_itn"],
)

COMUNICAR = licao(
    "m0l5", "Porque os computadores precisam de comunicar", 18,
    ["Explicar os problemas dos computadores isolados",
     "Conhecer os meios de comunicação que antecederam as redes",
     "Comparar comutação de circuitos e comutação de pacotes",
     "Enumerar as vantagens de ligar computadores em rede"],
    [
        texto("O tempo dos computadores isolados", """
<p>Nos primeiros tempos, cada computador vivia sozinho. Para levar dados de um para outro era preciso gravá-los em <b>fita</b>, <b>cartões perfurados</b> ou, mais tarde, <b>disquetes</b>, e transportá-los à mão. Os técnicos chamavam-lhe, a brincar, <i>sneakernet</i> — a “rede de sapatilhas”.</p>
<p>Isto trazia problemas sérios:</p>
<ul>
<li>informação <b>duplicada e desatualizada</b> em cada máquina;</li>
<li><b>recursos caros</b> (impressoras, discos, computadores potentes) que não se podiam partilhar;</li>
<li>comunicação <b>lenta</b>: dias ou semanas para enviar dados a outra cidade.</li>
</ul>"""),
        tabela(["Época", "Meio de comunicação", "Ideia que deixou às redes"], [
            ["Década de 1840", "Telégrafo (código Morse)", "Transformar mensagens em sinais elétricos: pontos e traços"],
            ["1876", "Telefone", "Uma rede mundial de cabos e centrais que liga qualquer pessoa"],
            ["Anos 1950–60", "Terminais ligados a um computador central (mainframe)", "Várias pessoas a usar o mesmo computador à distância"],
            ["Anos 1960", "Modems", "Computadores a “falar” pela linha telefónica"],
            ["1969", "ARPANET", "Computadores de várias universidades ligados numa rede de pacotes"],
        ], "Antes das redes de computadores"),
        texto("Circuitos ou pacotes?", """
<p>A rede telefónica antiga usava <b>comutação de circuitos</b>: durante a chamada, um caminho inteiro fica reservado só para si, mesmo nos silêncios. Os computadores comunicam aos “arranques”: enviam muito de uma vez e depois nada. Reservar um caminho era um desperdício.</p>
<p>A solução foi a <b>comutação de pacotes</b>: a mensagem é cortada em pequenos <b>pacotes</b>, cada um com a morada de destino, e todos partilham as mesmas ligações. Se um caminho falhar, os pacotes seguem por outro.</p>"""),
        tabela(["", "Comutação de circuitos", "Comutação de pacotes"], [
            ["Caminho", "Reservado do início ao fim", "Partilhado por todos"],
            ["Aproveitamento", "Desperdiça nos silêncios", "Usa a ligação ao máximo"],
            ["Se uma ligação falha", "A chamada cai", "Os pacotes procuram outro caminho"],
            ["Exemplo", "Telefone fixo antigo", "Internet, redes de computadores"],
        ]),
        topologia(
            [("a", "pc", 8, 50, "Computador A"), ("r1", "router", 32, 50, "R1"), ("r2", "router", 60, 15, "R2"), ("r3", "router", 60, 85, "R3"), ("b", "servidor", 92, 50, "Computador B")],
            [("a", "r1"), ("r1", "r2", "pacotes 1 e 3"), ("r1", "r3", "pacote 2"), ("r2", "b"), ("r3", "b")],
            "Comutação de pacotes: cada pacote pode seguir um caminho diferente e no destino a mensagem é montada de novo."),
        tabela(["Vantagem", "Exemplo"], [
            ["Partilhar recursos", "Uma impressora para todo o escritório"],
            ["Partilhar informação", "O processo do doente aparece no consultório e na farmácia"],
            ["Comunicar", "E-mail, mensagens, videochamadas"],
            ["Trabalhar em conjunto", "Documentos editados por várias pessoas ao mesmo tempo"],
            ["Aceder de longe", "Ver as notas da escola ou a conta bancária a partir de casa"],
            ["Segurança das cópias", "Backups guardados noutro edifício"],
        ], "Porque ligamos computadores"),
        dica("Sempre que ouvir “pacote” neste curso, lembre-se: é um pedaço da mensagem com a morada de destino escrita nele."),
    ],
    [
        mc("Antes das redes, como se levavam dados de um computador para outro?", ["Por Wi-Fi", "Gravando em fita, cartões ou disquetes e levando à mão", "Por e-mail", "Pela cloud"], 1, "A chamada sneakernet."),
        mc("Na comutação de pacotes…", ["Um caminho fica reservado durante toda a comunicação", "A mensagem é dividida em pacotes que partilham as ligações", "Só pode haver dois computadores", "Não há endereços"], 1, "Os pacotes partilham as ligações e podem seguir caminhos diferentes."),
        vf("A rede telefónica antiga usava comutação de circuitos.", True, "Reservava um circuito por chamada."),
        mc("Qual NÃO é uma vantagem das redes?", ["Partilhar impressoras", "Comunicar por e-mail", "Obrigar a copiar ficheiros à mão", "Aceder a dados à distância"], 2, "As redes eliminaram a cópia manual."),
        mc("Que aparelho permitiu aos computadores comunicarem pela linha telefónica?", ["Modem", "Ábaco", "Telégrafo", "Monitor"], 0, "Modem = modulador/desmodulador."),
    ],
    ["kurose", "tanenbaum", "leiner", "comer"],
)
