"""Aulas de partilha de ficheiros e impressoras na rede."""

from .base import *

LICOES = {}


def reg(l):
    LICOES[l["id"]] = l
    return l


# ---------------------------------------------------------------------------
# 1. Conceitos
# ---------------------------------------------------------------------------
reg(licao(
    "n_part_conceitos", "Partilha de ficheiros na rede: conceitos", 25,
    [
        "Explicar o que é partilhar ficheiros na rede e porque as empresas o fazem",
        "Distinguir cliente/servidor, ponto a ponto e NAS, e conhecer os protocolos SMB, NFS, FTP/SFTP e WebDAV",
        "Ler um caminho UNC e saber o que é uma unidade de rede mapeada",
        "Aplicar a regra «a mais restritiva ganha» entre permissões de partilha e NTFS",
        "Conhecer os requisitos de rede (perfil, firewall, nomes, porta 445) para uma partilha funcionar",
    ],
    [
        texto("Porque partilhar ficheiros?", r"""
<p>Imagine uma clínica com 10 computadores. A rececionista guarda a lista de marcações no <b>seu</b> PC; o médico precisa dela no consultório; a contabilista precisa das faturas. Sem partilha, os ficheiros andam em pens USB e e-mails, aparecem várias versões do mesmo documento e, se um disco avariar, perde-se tudo.</p>
<p><b>Partilhar ficheiros na rede</b> é colocar uma pasta num computador (o <b>servidor</b>) e deixar que outros computadores (os <b>clientes</b>) a abram pela rede, como se estivesse no seu próprio disco. Assim:</p>
<ul>
<li>todos trabalham sobre <b>a mesma cópia</b> do ficheiro;</li>
<li>o administrador decide <b>quem pode ler ou alterar</b> cada pasta (permissões);</li>
<li>basta fazer <b>cópias de segurança (backups)</b> de um só sítio.</li>
</ul>"""),
        topologia(
            [("srv", "servidor", 50, 15, "FS01 192.168.1.10"),
             ("sw", "switch", 50, 50, "Switch"),
             ("pc1", "pc", 15, 85, "Receção"),
             ("pc2", "pc", 50, 85, "Consultório"),
             ("pc3", "portatil", 85, 85, "Contabilidade")],
            [("srv", "sw", "TCP 445"), ("sw", "pc1"), ("sw", "pc2"), ("sw", "pc3")],
            "Modelo cliente/servidor: os três clientes abrem a pasta Documentos do servidor FS01.",
        ),
        tabela(["Modelo", "Como funciona", "Quando usar"], [
            ["Cliente/servidor", "Um computador dedicado (servidor) guarda as pastas; os outros só acedem", "Empresas: gestão central, permissões e backups num só lugar"],
            ["Ponto a ponto (peer-to-peer)", "Cada PC partilha as suas pastas com os outros; não há servidor", "Casa ou escritório com 2–5 PCs; simples mas difícil de controlar"],
            ["NAS (Network Attached Storage)", "Caixa com discos ligada à rede, que só serve para guardar e partilhar ficheiros", "Pequenas empresas: barato, consome pouco, tem RAID e backups"],
        ], "Três formas de organizar a partilha"),
        tabela(["Protocolo", "Porta", "Onde se usa"], [
            ["SMB/CIFS (Server Message Block)", "TCP 445 (antigamente 137–139 com NetBIOS)", "Windows, Samba no Linux, macOS, NAS"],
            ["NFS (Network File System)", "TCP 2049", "Servidores Linux/Unix"],
            ["FTP / SFTP", "TCP 21 / TCP 22", "Enviar e receber ficheiros (sem abrir diretamente); SFTP é cifrado"],
            ["WebDAV", "TCP 443 (HTTPS)", "Nextcloud, SharePoint: pastas através da web"],
        ], "Protocolos de partilha de ficheiros"),
        texto("SMB: a língua das partilhas Windows", r"""
<p>O <b>SMB</b> é o protocolo (conjunto de regras de comunicação) que o Windows usa para pastas e impressoras partilhadas. <b>CIFS</b> é o nome de uma versão antiga do SMB. Hoje usa-se o <b>SMB 2 ou 3</b> diretamente sobre <b>TCP na porta 445</b>. Nas versões antigas o SMB viajava sobre <b>NetBIOS</b> (portas 137, 138 e 139), um sistema de nomes dos anos 80.</p>
<p>O <b>SMBv1</b> é inseguro (foi usado pelo vírus WannaCry em 2017) e deve estar <b>desativado</b>.</p>"""),
        texto("Nuvem ou partilha local?", r"""
<p>Serviços como <b>OneDrive</b>, <b>Google Drive</b> ou <b>Dropbox</b> guardam os ficheiros em servidores na Internet. Funcionam em qualquer lado, mas dependem da ligação à Internet e de uma assinatura.</p>
<p>A <b>partilha local</b> (SMB num servidor ou NAS) fica dentro da empresa: é mais rápida (1 Gbit/s na rede local contra poucos Mbit/s para a Internet), funciona mesmo sem Internet e os dados não saem do edifício — importante para dados clínicos. Muitas empresas usam as duas coisas: partilha local para o dia a dia e nuvem como cópia externa.</p>"""),
        exemplo("Ler um caminho UNC", r"""
<p>Para abrir uma pasta partilhada escreve-se um <b>caminho UNC</b> (Universal Naming Convention):</p>
<p><code>\\servidor\pasta</code> &nbsp;por exemplo&nbsp; <code>\\192.168.1.10\Documentos</code></p>
<ul>
<li><code>\\</code> — duas barras invertidas: «isto é um computador da rede, não um disco local».</li>
<li><code>192.168.1.10</code> — o servidor. Pode ser o IP ou o nome (<code>\\FS01\Documentos</code>).</li>
<li><code>\</code> — separador.</li>
<li><code>Documentos</code> — o <b>nome da partilha</b> (não é obrigatoriamente o nome da pasta no disco do servidor, que pode ser <code>C:\Dados\Docs2024</code>).</li>
<li>Pode continuar com subpastas: <code>\\192.168.1.10\Documentos\Faturas\2024</code>.</li>
</ul>"""),
        texto("Unidade mapeada, grupo de trabalho e domínio", r"""
<p>Uma <b>unidade de rede mapeada</b> é um atalho que dá uma letra a uma partilha: <code>\\192.168.1.10\Documentos</code> passa a aparecer em <b>Este PC</b> como <b>Z:</b>. Para o utilizador é como ter mais um disco.</p>
<p>Num <b>grupo de trabalho (workgroup)</b> cada PC tem as suas próprias contas: para entrar na partilha do servidor é preciso ter uma conta <b>nesse servidor</b>. Serve para redes pequenas.</p>
<p>Num <b>domínio (Active Directory)</b> há um servidor central, o <b>controlador de domínio</b>, com todas as contas e grupos. O utilizador entra uma vez no seu PC e acede a todas as partilhas a que tem direito. É o padrão em empresas com mais de 10–15 PCs.</p>"""),
        tabela(["", "Permissões de partilha", "Permissões NTFS (separador Segurança)"], [
            ["Onde se definem", "Propriedades › Partilha › Partilha avançada › Permissões", "Propriedades › Segurança"],
            ["Quando se aplicam", "Só a quem entra pela rede", "Sempre: pela rede e no próprio PC"],
            ["Níveis", "Leitura, Alteração, Controlo total", "Controlo total, Modificar, Ler e executar, Listar, Ler, Escrever"],
            ["Detalhe", "Para a partilha inteira", "Pasta a pasta e ficheiro a ficheiro"],
        ], "Dois tipos de permissões"),
        exemplo("A mais restritiva ganha", r"""
<p>Quem entra <b>pela rede</b> passa por duas portas: a da partilha e a do NTFS (o sistema de ficheiros do Windows). A permissão efetiva é a <b>mais restritiva</b> das duas.</p>
<ol>
<li>Partilha: <b>Controlo total</b> para Todos. NTFS: <b>Ler</b> para a Ana. → Pela rede a Ana só pode <b>ler</b>.</li>
<li>Partilha: <b>Leitura</b> para Todos. NTFS: <b>Modificar</b> para a Ana. → Pela rede a Ana só pode <b>ler</b>; sentada no servidor pode modificar (aí só conta o NTFS).</li>
<li>Partilha: <b>Alteração</b> para Contabilidade. NTFS: <b>Modificar</b> para Contabilidade. → Os contabilistas podem criar, alterar e apagar ficheiros.</li>
</ol>
<p>Dentro do mesmo tipo, as permissões dos vários grupos de um utilizador <b>somam-se</b>; uma <b>Negação</b> explícita vence sempre. Prática comum: na partilha dar <b>Alteração</b> a quem precisa e controlar o detalhe com NTFS.</p>"""),
        texto("A rede tem de deixar", r"""
<ul>
<li><b>Deteção de rede</b>: opção do Windows que faz o PC aparecer (e ver os outros) em <b>Rede</b> no Explorador de Ficheiros.</li>
<li><b>Perfil de rede</b>: <b>Privado</b> (casa/trabalho, confiável) permite deteção e partilha; <b>Público</b> (café, aeroporto) esconde o PC. O servidor tem de estar em Privado (ou Domínio).</li>
<li><b>Firewall</b>: a regra <b>«Partilha de ficheiros e impressoras»</b> da Firewall do Windows tem de estar ativa no servidor, senão a porta 445 fica bloqueada.</li>
<li><b>Resolução de nomes</b> (traduzir o nome FS01 para um IP): numa empresa faz-se por <b>DNS</b>; em redes pequenas por <b>NetBIOS</b>, LLMNR ou <b>mDNS</b> (nomes .local). Se o nome falhar, o IP funciona na mesma.</li>
</ul>"""),
        tabela(["Requisito", "Como verificar"], [
            ["Mesma rede, ou redes diferentes com encaminhamento entre elas", "ipconfig nos dois PCs; ver IP, máscara e gateway"],
            ["O ping funciona", "ping 192.168.1.10"],
            ["Porta TCP 445 permitida (firewall/ACL)", "Test-NetConnection 192.168.1.10 -Port 445"],
            ["Conta de utilizador e palavra-passe no servidor (ou no domínio)", "Tentar abrir \\\\192.168.1.10 e iniciar sessão"],
            ["Pasta partilhada com permissões corretas", "net share no servidor"],
        ], "Lista de verificação antes de partilhar"),
        dica(r"""Se <code>\\FS01</code> não abre mas <code>\\192.168.1.10</code> abre, a rede e a partilha estão bem: o problema é só a <b>resolução de nomes</b>."""),
    ],
    [
        mc("Que porta usa o SMB moderno?", ["TCP 139", "UDP 137", "TCP 445", "TCP 2049"], 2,
           "O SMB 2/3 corre diretamente sobre TCP 445. A 139 era usada pelo SMB sobre NetBIOS e a 2049 é do NFS."),
        mc(r"No caminho \\192.168.1.10\Documentos, o que é «Documentos»?",
           ["O nome da partilha", "O nome do servidor", "A letra da unidade", "O grupo de trabalho"], 0,
           "Depois do servidor vem o nome da partilha, que pode ser diferente do nome da pasta no disco."),
        mc("A partilha dá Controlo total a Todos e o NTFS dá apenas Ler à Ana. O que pode a Ana fazer pela rede?",
           ["Tudo", "Alterar ficheiros mas não apagar", "Nada", "Apenas ler"], 3,
           "A permissão mais restritiva ganha: Ler."),
        mc("Qual destes protocolos é o mais usado para partilhas entre servidores Linux?",
           ["RDP", "NFS", "SMTP", "SNMP"], 1, "O NFS (porta 2049) é o protocolo nativo de partilha em Linux/Unix."),
        vf("Com o perfil de rede Público o Windows esconde o PC e bloqueia a partilha de ficheiros por omissão.", True,
           "O perfil Público é para redes não confiáveis; para partilhar usa-se o perfil Privado."),
        vf("Num grupo de trabalho, as contas de utilizador estão centralizadas num controlador de domínio.", False,
           "Isso é um domínio (Active Directory). No grupo de trabalho cada PC tem as suas contas."),
        mc("Abre-se \\\\192.168.1.10 mas \\\\FS01 dá erro. Qual é a causa mais provável?",
           ["Firewall a bloquear a porta 445", "Cabo desligado", "Falha na resolução de nomes", "Permissões NTFS"], 2,
           "Pelo IP funciona, portanto rede, firewall e partilha estão bem; falha a tradução do nome."),
        valor("Que porta TCP usa o NFS?", ["2049"], "O NFS usa a porta 2049."),
        mc("O que é um NAS?", ["Um protocolo de nomes", "Um equipamento de armazenamento ligado à rede", "Um tipo de cabo", "Uma VLAN de servidores"], 1,
           "NAS = Network Attached Storage: uma caixa com discos que partilha ficheiros pela rede."),
    ],
    ["kurose", "netacad_itn", "comer"],
))


# ---------------------------------------------------------------------------
# 2. Windows passo a passo
# ---------------------------------------------------------------------------
reg(licao(
    "n_part_windows", "Criar uma pasta partilhada no Windows, passo a passo", 30,
    [
        "Preparar o Windows 10/11 para partilhar (perfil Privado, deteção de rede, partilha de ficheiros)",
        "Partilhar uma pasta e definir permissões de partilha e NTFS",
        "Aceder à partilha a partir de outro PC e mapear uma unidade de rede",
        "Fazer o mesmo pela linha de comandos (net share, net use) e PowerShell",
        "Aplicar boas práticas de segurança e partilhar uma impressora",
    ],
    [
        texto("O cenário", r"""
<p>Vamos transformar o PC <b>FS01</b> (Windows 10 ou 11, IP <b>192.168.1.10</b>) num pequeno servidor de ficheiros. A pasta <code>C:\Documentos</code> vai ser partilhada com o nome <b>Documentos</b>. A rececionista, no PC <b>RECECAO</b> (192.168.1.25), vai abri-la e mapeá-la como <b>Z:</b>.</p>
<p>Tudo o que se segue é feito no <b>servidor</b> (FS01), exceto onde se diz «no cliente». É preciso uma conta de <b>administrador</b>.</p>"""),
        texto("Passo 1 — Pôr a rede em perfil Privado", r"""
<ol>
<li>Abra <b>Definições</b> (tecla Windows + I).</li>
<li>Vá a <b>Rede e Internet</b>.</li>
<li>Clique na ligação em uso (<b>Ethernet</b> ou <b>Wi-Fi</b>) ou em <b>Propriedades</b>.</li>
<li>Em <b>Tipo de perfil de rede</b>, escolha <b>Privado</b>.</li>
</ol>
<p>Num PC que pertence a um domínio o perfil aparece como <b>Domínio</b> e não é preciso mudar nada.</p>"""),
        texto("Passo 2 — Ativar a deteção de rede e a partilha", r"""
<ol>
<li>Abra o <b>Painel de Controlo</b> › <b>Rede e Internet</b> › <b>Centro de Rede e Partilha</b>.</li>
<li>À esquerda, clique em <b>Alterar definições de partilha avançadas</b> (no Windows 11 também em Definições › Rede e Internet › Definições de rede avançadas › <b>Definições de partilha avançadas</b>).</li>
<li>No perfil <b>Privado</b>: <b>Ativar a deteção de rede</b> e <b>Ativar a partilha de ficheiros e impressoras</b>.</li>
<li>Em <b>Todas as redes</b>, deixe ligada a <b>Partilha protegida por palavra-passe</b>: só entra quem tiver conta neste PC.</li>
<li>Clique em <b>Guardar alterações</b>.</li>
</ol>
<p>Isto ativa sozinho a regra <b>«Partilha de ficheiros e impressoras»</b> da Firewall do Windows (porta TCP 445).</p>"""),
        cli("Passo 3 — Criar a conta para quem vai aceder", [
            ("C:\\>", "net user rececao S3nha#Forte2024 /add", "Cria a conta local «rececao» com palavra-passe (consola como administrador)."),
            ("C:\\>", "net localgroup Contabilidade /add", "Cria um grupo local para juntar várias pessoas."),
            ("C:\\>", "net localgroup Contabilidade rececao /add", "Coloca a conta no grupo."),
        ], "Também se faz pelo ecrã: Definições › Contas › Outros utilizadores › Adicionar conta › «Não tenho as informações de início de sessão desta pessoa» › «Adicionar um utilizador sem uma conta Microsoft». Num grupo de trabalho, quem acede à partilha precisa de conta no servidor; num domínio usam-se as contas do Active Directory."),
        texto("Passo 4 — Partilhar a pasta", r"""
<ol>
<li>Crie a pasta <code>C:\Documentos</code>.</li>
<li>Clique com o <b>botão direito</b> na pasta › <b>Propriedades</b> › separador <b>Partilha</b>.</li>
<li>Clique em <b>Partilha avançada…</b> e marque <b>Partilhar esta pasta</b>.</li>
<li>Em <b>Nome da partilha</b> escreva <b>Documentos</b> (é o nome que aparece em <code>\\192.168.1.10\Documentos</code>).</li>
<li>Clique em <b>Permissões</b>: remova <b>Todos</b>, clique em <b>Adicionar</b>, escreva <b>Contabilidade</b> e dê <b>Alteração</b> e <b>Leitura</b>.</li>
<li><b>OK</b> › <b>Aplicar</b>.</li>
<li>Vá ao separador <b>Segurança</b> › <b>Editar</b> › <b>Adicionar</b> Contabilidade com <b>Modificar</b> (permissão NTFS).</li>
</ol>"""),
        tabela(["Grupo", "Permissão de partilha", "Permissão NTFS (Segurança)", "Resultado pela rede"], [
            ["Contabilidade", "Alteração", "Modificar", "Cria, altera e apaga ficheiros"],
            ["Receção", "Alteração", "Ler e executar", "Só lê (a mais restritiva ganha)"],
            ["Administradores", "Controlo total", "Controlo total", "Tudo, incluindo mudar permissões"],
            ["Todos", "— (removido)", "—", "Sem acesso"],
        ], "Permissões recomendadas para a pasta Documentos"),
        cli("Passo 5 — Descobrir o IP do servidor e testar no cliente", [
            ("C:\\>", "ipconfig", "No servidor: anote o «Endereço IPv4» (192.168.1.10)."),
            ("C:\\>", "ping 192.168.1.10", "No cliente: confirme que o servidor responde."),
            ("C:\\>", "net view \\\\192.168.1.10", "No cliente: lista as partilhas do servidor."),
        ], "Também pode testar com Win + R, escrever \\\\192.168.1.10 e Enter: abre uma janela com as partilhas. Quando pedir credenciais, use a conta criada no passo 3 (ex.: FS01\\rececao) e marque «Memorizar as minhas credenciais»."),
        texto("Passo 6 — Mapear a unidade Z: no cliente", r"""
<ol>
<li>Abra o <b>Explorador de Ficheiros</b> › <b>Este PC</b>.</li>
<li>No menu (Windows 11: <b>…</b> Ver mais) escolha <b>Mapear unidade de rede</b>.</li>
<li>Em <b>Unidade</b> escolha <b>Z:</b>.</li>
<li>Em <b>Pasta</b> escreva <code>\\192.168.1.10\Documentos</code>.</li>
<li>Marque <b>Ligar novamente ao iniciar sessão</b> (para a unidade voltar depois de reiniciar).</li>
<li>Se a conta do cliente for diferente, marque <b>Ligar utilizando credenciais diferentes</b>.</li>
<li><b>Concluir</b>. A pasta aparece em Este PC como <b>Documentos (\\192.168.1.10) (Z:)</b>.</li>
</ol>"""),
        cli("O mesmo pela linha de comandos", [
            ("C:\\>", "net share Documentos=C:\\Documentos /grant:Todos,READ", "No servidor: partilha a pasta com o nome Documentos, só de leitura para Todos (exemplo rápido)."),
            ("C:\\>", "net share", "Lista as partilhas deste PC (incluindo as administrativas C$, ADMIN$, IPC$)."),
            ("C:\\>", "net view \\\\192.168.1.10", "No cliente: mostra as partilhas visíveis do servidor."),
            ("C:\\>", "net use Z: \\\\192.168.1.10\\Documentos /persistent:yes", "No cliente: mapeia a partilha em Z: e volta a ligá-la em cada arranque."),
            ("C:\\>", "net use", "Lista as unidades de rede ligadas e o seu estado."),
            ("C:\\>", "net use Z: /delete", "Desliga a unidade Z:."),
        ], "Para entrar com outra conta: net use Z: \\\\192.168.1.10\\Documentos /user:FS01\\rececao * (o * pede a palavra-passe sem a mostrar)."),
        saida("Resultado de net share no servidor", r"""
C:\>net share

Nome partilha  Recurso                         Observação
-------------------------------------------------------------------------------
C$             C:\                             Partilha predefinida
IPC$                                           IPC remoto
ADMIN$         C:\Windows                      Admin remota
Documentos     C:\Documentos
O comando foi concluído com êxito.
""", "As partilhas com $ no fim são administrativas e ficam escondidas na rede. A nossa partilha Documentos aparece na última linha."),
        cli("Com PowerShell (como administrador)", [
            ("PS C:\\>", "New-SmbShare -Name Documentos -Path C:\\Documentos -FullAccess \"Contabilidade\"", "Cria a partilha e dá Controlo total (de partilha) ao grupo Contabilidade."),
            ("PS C:\\>", "Get-SmbShare", "Lista as partilhas."),
            ("PS C:\\>", "Get-SmbShareAccess -Name Documentos", "Mostra as permissões de partilha."),
            ("PS C:\\>", "Set-SmbServerConfiguration -EnableSMB1Protocol $false", "Garante que o SMBv1, inseguro, está desligado."),
        ]),
        texto("Partilhar uma impressora", r"""
<ol>
<li>No PC onde a impressora está instalada: <b>Definições</b> › <b>Bluetooth e dispositivos</b> (Windows 10: Dispositivos) › <b>Impressoras e scanners</b>.</li>
<li>Escolha a impressora › <b>Propriedades da impressora</b> › separador <b>Partilha</b>.</li>
<li>Marque <b>Partilhar esta impressora</b> e dê um nome curto, sem espaços (ex.: <b>Rececao-HP</b>).</li>
<li>No cliente: Win + R › <code>\\192.168.1.10</code> › duplo clique na impressora; o Windows instala o controlador (driver).</li>
</ol>
<p>O PC que partilha a impressora tem de estar <b>ligado</b> para os outros imprimirem.</p>"""),
        alerta(r"""
<b>Boas práticas de segurança</b>
<ul>
<li><b>Nunca</b> dê «Todos – Controlo total»: qualquer pessoa (ou vírus) na rede poderia apagar ou cifrar tudo (ransomware).</li>
<li>Mantenha a <b>Partilha protegida por palavra-passe</b> e use palavras-passe fortes.</li>
<li><b>Desative o SMBv1</b> e nunca abra a porta 445 para a Internet.</li>
<li>Faça <b>backups</b> regulares da pasta partilhada para outro disco ou para a nuvem.</li>
<li>Dê a cada grupo só o que precisa (princípio do menor privilégio).</li>
</ul>"""),
    ],
    [
        mc("Em que separador das Propriedades da pasta se definem as permissões NTFS?",
           ["Partilha", "Geral", "Personalizar", "Segurança"], 3, "As permissões NTFS estão no separador Segurança."),
        cmd(r"Que comando mapeia a pasta Documentos do servidor 192.168.1.10 na letra Z:?",
            [r"net use Z: \\192.168.1.10\Documentos", r"net use z: \\192.168.1.10\documentos",
             r"net use Z: \\192.168.1.10\Documentos /persistent:yes"],
            r"net use liga a partilha \\192.168.1.10\Documentos à letra Z:."),
        cmd("Que comando lista as pastas partilhadas no próprio PC?", ["net share"],
            "net share sem parâmetros mostra todas as partilhas, incluindo C$, ADMIN$ e IPC$."),
        cmd("Que cmdlet do PowerShell lista as partilhas SMB?", ["Get-SmbShare", "get-smbshare"],
            "Get-SmbShare mostra o nome, o caminho e a descrição de cada partilha."),
        mc("Que perfil de rede deve ter o servidor numa rede de escritório em grupo de trabalho?",
           ["Público", "Privado", "Convidado", "Visitante"], 1, "O perfil Privado permite deteção e partilha."),
        vf("A opção «Ligar novamente ao iniciar sessão» faz a unidade Z: voltar depois de reiniciar o PC.", True,
           "Equivale a /persistent:yes no comando net use."),
        mc("Qual destas configurações é a mais perigosa?",
           ["Contabilidade – Alteração", "Administradores – Controlo total", "Todos – Controlo total", "Receção – Leitura"], 2,
           "Todos – Controlo total deixa qualquer utilizador ou malware apagar e cifrar os ficheiros."),
        cmd("Que comando desliga a unidade de rede Z:?", ["net use Z: /delete", "net use z: /delete", "net use Z: /d"],
            "net use Z: /delete remove o mapeamento."),
        vf("Para outros PCs imprimirem numa impressora partilhada, o PC que a partilha tem de estar ligado.", True,
           "É esse PC que recebe os trabalhos e os envia à impressora."),
        valor("No comando net share Documentos=C:\\Documentos /grant:Todos,READ, que nível de acesso recebe «Todos»? (palavra em inglês)",
              ["READ", "read"], "READ = leitura. Outras opções: CHANGE (alteração) e FULL (controlo total)."),
    ],
    ["netacad_itn", "odom1"],
))


# ---------------------------------------------------------------------------
# 3. Linux (Samba), macOS e resolução de problemas
# ---------------------------------------------------------------------------
reg(licao(
    "n_part_linux", "Partilhar com Linux (Samba) e macOS, e resolver problemas", 28,
    [
        "Instalar e configurar o Samba para partilhar uma pasta com clientes Windows",
        "Aceder a partilhas SMB a partir de Windows, Linux e macOS",
        "Configurar uma partilha NFS simples",
        "Diagnosticar os erros mais comuns de partilha com um método passo a passo",
    ],
    [
        texto("Samba: SMB no Linux", r"""
<p>O <b>Samba</b> é um programa gratuito que faz um servidor Linux «falar» SMB. Assim, PCs Windows e Macs abrem as pastas do Linux como se fosse um servidor Windows. Muitos NAS usam Samba por dentro.</p>
<p>No exemplo, o servidor Linux <b>srv01</b> tem o IP <b>192.168.1.20</b> e vai partilhar a pasta <code>/srv/partilhas/documentos</code> com o nome <b>Documentos</b> para a utilizadora <b>ana</b>.</p>"""),
        cli("Instalar o Samba e preparar a pasta", [
            ("ana@srv01:~$", "sudo apt update && sudo apt install samba", "Instala o Samba (Debian/Ubuntu). O serviço chama-se smbd."),
            ("ana@srv01:~$", "sudo mkdir -p /srv/partilhas/documentos", "Cria a pasta a partilhar."),
            ("ana@srv01:~$", "sudo chown ana:ana /srv/partilhas/documentos", "Dá à ana a posse da pasta (permissões do Linux)."),
            ("ana@srv01:~$", "sudo nano /etc/samba/smb.conf", "Abre o ficheiro de configuração do Samba para editar."),
        ]),
        saida("Secção a acrescentar ao fim de /etc/samba/smb.conf", """
[global]
   workgroup = WORKGROUP
   server min protocol = SMB2

[Documentos]
   comment = Documentos da clinica
   path = /srv/partilhas/documentos
   browseable = yes
   read only = no
   valid users = ana, @contabilidade
   create mask = 0660
   directory mask = 0770
""", "[Documentos] é o nome da partilha. path = pasta real; browseable = aparece na lista; read only = no permite escrever; valid users = só estes utilizadores (o @ indica um grupo Linux). server min protocol = SMB2 recusa o SMBv1."),
        cli("Criar a palavra-passe Samba, verificar e arrancar", [
            ("ana@srv01:~$", "sudo smbpasswd -a ana", "Cria a palavra-passe SMB da ana (a conta Linux tem de existir; a senha Samba é separada)."),
            ("ana@srv01:~$", "testparm", "Verifica se o smb.conf tem erros e mostra a configuração final."),
            ("ana@srv01:~$", "sudo systemctl restart smbd", "Reinicia o Samba para aplicar as alterações."),
            ("ana@srv01:~$", "sudo ufw allow samba", "Abre na firewall do Ubuntu as portas do Samba (445 e 137–139)."),
        ]),
        texto("Aceder à partilha Samba", r"""
<ul>
<li><b>Windows</b>: Win + R › <code>\\192.168.1.20\Documentos</code>, utilizador <b>ana</b> e a senha do smbpasswd. Ou <code>net use Z: \\192.168.1.20\Documentos /user:ana *</code>.</li>
<li><b>Linux com ambiente gráfico</b>: no gestor de ficheiros, «Outras localizações» › <code>smb://192.168.1.20/Documentos</code>.</li>
<li><b>Linux na consola</b>: com <code>smbclient</code> (tipo FTP) ou montando a partilha com <code>mount -t cifs</code>.</li>
</ul>"""),
        cli("Clientes Linux na consola", [
            ("joao@pc02:~$", "smbclient -L //192.168.1.20 -U ana", "Lista as partilhas do servidor."),
            ("joao@pc02:~$", "smbclient //192.168.1.20/Documentos -U ana", "Abre a partilha; depois use ls, get ficheiro, put ficheiro, exit."),
            ("joao@pc02:~$", "sudo apt install cifs-utils", "Instala o suporte para montar partilhas SMB."),
            ("joao@pc02:~$", "sudo mount -t cifs //192.168.1.20/Documentos /mnt/documentos -o username=ana,vers=3.0", "Monta a partilha na pasta /mnt/documentos (cria-a antes com mkdir)."),
        ], "Para montar sempre no arranque acrescenta-se uma linha em /etc/fstab com um ficheiro de credenciais protegido (chmod 600)."),
        cli("NFS: partilha rápida entre Linux", [
            ("ana@srv01:~$", "sudo apt install nfs-kernel-server", "Instala o servidor NFS."),
            ("ana@srv01:~$", "echo \"/srv/nfs/dados 192.168.1.0/24(rw,sync,no_subtree_check)\" | sudo tee -a /etc/exports", "Exporta a pasta, com leitura e escrita, só para a rede 192.168.1.0/24."),
            ("ana@srv01:~$", "sudo exportfs -a", "Aplica as exportações."),
            ("joao@pc02:~$", "sudo mount -t nfs 192.168.1.20:/srv/nfs/dados /mnt/dados", "No cliente (com nfs-common instalado): monta a pasta remota."),
        ], "O NFS usa a porta TCP 2049 e as permissões baseiam-se nos números de utilizador (UID) do Linux."),
        texto("macOS: partilhar e ligar", r"""
<p><b>Partilhar uma pasta no Mac</b>:</p>
<ol>
<li><b>Definições do Sistema</b> › <b>Geral</b> › <b>Partilha</b>.</li>
<li>Ative <b>Partilha de ficheiros</b> e clique no botão <b>(i)</b>.</li>
<li>Em Pastas partilhadas clique em <b>+</b> e escolha a pasta; defina os utilizadores e o acesso (Ler e escrever / Só leitura).</li>
<li>Em <b>Opções…</b> confirme <b>Partilhar ficheiros e pastas usando SMB</b>.</li>
</ol>
<p><b>Ligar a uma partilha a partir do Mac</b>: no <b>Finder</b> › menu <b>Ir</b> › <b>Ligar ao servidor…</b> (Cmd + K) › <code>smb://192.168.1.20/Documentos</code> › Ligar.</p>"""),
        tabela(["Sintoma", "Causa provável", "Solução"], [
            ["«O caminho de rede não foi encontrado» (erro 0x80070035)", "IP errado, firewall a bloquear a porta 445, deteção/partilha desligada ou serviço parado", "ping ao servidor; Test-NetConnection -Port 445; ativar «Partilha de ficheiros e impressoras»; ver perfil Privado"],
            ["«Acesso negado»", "Permissões de partilha ou NTFS insuficientes, ou conta errada", "Rever Partilha e Segurança; entrar com a conta certa (net use … /user:)"],
            ["Funciona pelo IP mas não pelo nome", "Falha na resolução de nomes (DNS/NetBIOS)", "nslookup FS01; criar registo no DNS; usar o IP"],
            ["A unidade Z: desaparece ou fica com X vermelho", "Mapeamento não persistente ou credenciais não guardadas", "net use … /persistent:yes; guardar credenciais no Gestor de Credenciais"],
            ["Pede sempre a palavra-passe", "Conta do cliente não existe no servidor (grupo de trabalho)", "Criar conta igual no servidor ou usar um domínio"],
            ["Não aparece em Rede, mas abre por \\\\IP", "Deteção de rede desligada (só afeta a lista)", "Ativar a deteção de rede; usar o caminho UNC diretamente"],
        ], "Problemas comuns"),
        cli("Método de diagnóstico, da camada mais baixa para a mais alta", [
            ("C:\\>", "ping 192.168.1.10", "1. Há ligação IP ao servidor?"),
            ("PS C:\\>", "Test-NetConnection 192.168.1.10 -Port 445", "2. A porta SMB responde? (TcpTestSucceeded : True)"),
            ("PS C:\\>", "Get-Service LanmanServer", "3. No servidor Windows: o serviço «Servidor» (que partilha) está Running?"),
            ("ana@srv01:~$", "systemctl status smbd", "3. No servidor Linux: o Samba está active (running)?"),
            ("C:\\>", "nslookup FS01", "4. O nome resolve para o IP certo?"),
        ], "Só depois de tudo isto estar bem é que vale a pena olhar para as permissões."),
        saida("Teste bem-sucedido à porta 445", """
PS C:\\> Test-NetConnection 192.168.1.10 -Port 445

ComputerName     : 192.168.1.10
RemoteAddress    : 192.168.1.10
RemotePort       : 445
InterfaceAlias   : Ethernet
SourceAddress    : 192.168.1.25
TcpTestSucceeded : True
""", "Se TcpTestSucceeded for False mas o ping funcionar, o problema é a firewall ou o serviço de partilha parado."),
        dica("No Samba, depois de cada alteração ao smb.conf, corra sempre <code>testparm</code> e reinicie o <code>smbd</code>. Um erro de escrita no ficheiro é a causa mais comum de «a partilha não aparece»."),
    ],
    [
        cmd("Que comando cria a palavra-passe Samba para a utilizadora ana?", ["sudo smbpasswd -a ana", "smbpasswd -a ana"],
            "smbpasswd -a adiciona o utilizador à base de dados do Samba."),
        cmd("Que comando verifica se o ficheiro smb.conf tem erros?", ["testparm", "sudo testparm"],
            "testparm lê o smb.conf e indica erros de sintaxe."),
        mc("Na secção [Documentos] do smb.conf, que linha permite escrever na partilha?",
           ["browseable = yes", "read only = no", "valid users = ana", "path = /srv"], 1,
           "read only = no torna a partilha de leitura e escrita."),
        mc("No macOS, onde se escreve smb://192.168.1.20/Documentos para ligar a uma partilha?",
           ["Terminal › ssh", "Safari › Endereço", "Finder › Ir › Ligar ao servidor", "Definições do Sistema › Rede"], 2,
           "Finder › Ir › Ligar ao servidor (Cmd + K)."),
        mc("O ping ao servidor funciona mas Test-NetConnection -Port 445 dá False. Causa mais provável?",
           ["Cabo de rede avariado", "Endereço IP errado", "DNS em baixo", "Firewall ou serviço de partilha parado"], 3,
           "Há ligação IP; o que falha é a porta 445: firewall ou serviço."),
        mc("Que erro aparece normalmente quando a conta não tem permissões suficientes?",
           ["Acesso negado", "O caminho de rede não foi encontrado", "Tempo limite esgotado", "Nome não resolvido"], 0,
           "Acesso negado indica que se chegou ao servidor mas as permissões não deixam."),
        cmd("Que cmdlet testa se a porta 445 do servidor 192.168.1.10 está acessível?",
            ["Test-NetConnection 192.168.1.10 -Port 445", "tnc 192.168.1.10 -Port 445"],
            "Test-NetConnection (alias tnc) tenta abrir uma ligação TCP à porta indicada."),
        vf("O NFS usa as contas e palavras-passe do Samba para decidir o acesso.", False,
           "O NFS clássico baseia-se nos UID/GID do Linux e na rede indicada em /etc/exports; o Samba é outra coisa."),
        cmd("Que comando aplica as exportações do ficheiro /etc/exports?", ["sudo exportfs -a", "exportfs -a"],
            "exportfs -a exporta todas as pastas listadas em /etc/exports."),
    ],
    ["tanenbaum", "netacad_itn"],
    nivel="intermédio",
))


# ---------------------------------------------------------------------------
# 4. Projeto numa rede de empresa
# ---------------------------------------------------------------------------
reg(licao(
    "n_part_rede", "Partilha numa rede de empresa: projeto completo", 30,
    [
        "Planear um servidor de ficheiros numa VLAN de servidores com endereçamento coerente",
        "Escrever e aplicar uma ACL estendida que só permite SMB (TCP 445) a partir das VLANs do pessoal",
        "Criar o registo DNS do servidor e organizar pastas, grupos e permissões",
        "Planear backups com a regra 3-2-1 e distinguir o laboratório da instalação real",
    ],
    [
        texto("O projeto", r"""
<p>A <b>Clínica Boa Saúde</b> tem receção, consultórios e administração. Hoje cada um guarda ficheiros no seu PC. A direção pediu um <b>servidor de ficheiros</b> central, <b>FS01</b>, com estas regras:</p>
<ul>
<li>o servidor fica numa <b>VLAN de Servidores</b> separada (uma <b>VLAN</b> é uma rede lógica separada dentro do mesmo switch);</li>
<li>só os PCs do pessoal (Receção, Médicos, Administração) podem abrir as partilhas; os <b>Convidados</b> (Wi-Fi da sala de espera) não;</li>
<li>cada departamento vê só as suas pastas;</li>
<li>há cópias de segurança diárias.</li>
</ul>"""),
        topologia(
            [("r1", "router", 50, 10, "R1"),
             ("sw", "switch", 50, 40, "SW-Central"),
             ("fs", "servidor", 85, 40, "FS01 .99.10"),
             ("dc", "servidor", 85, 70, "DC01 .99.5"),
             ("pc1", "pc", 10, 80, "Receção"),
             ("pc2", "pc", 35, 80, "Médicos"),
             ("pc3", "pc", 60, 80, "Administração"),
             ("ap", "ap", 15, 45, "AP Convidados")],
            [("r1", "sw", "trunk 802.1Q"), ("sw", "fs", "VLAN 99"), ("sw", "dc", "VLAN 99"),
             ("sw", "pc1", "VLAN 10"), ("sw", "pc2", "VLAN 20"), ("sw", "pc3", "VLAN 30"), ("sw", "ap", "VLAN 50")],
            "Router-on-a-stick: o R1 encaminha entre as VLANs e aplica a ACL que protege o FS01.",
        ),
        tabela(["VLAN", "Nome", "Rede", "Gateway (R1)", "Exemplos"], [
            ["10", "Receção", "192.168.10.0/24", "192.168.10.1", "PCs da receção, impressora"],
            ["20", "Médicos", "192.168.20.0/24", "192.168.20.1", "PCs dos consultórios"],
            ["30", "Administração", "192.168.30.0/24", "192.168.30.1", "Contabilidade, direção"],
            ["50", "Convidados", "192.168.50.0/24", "192.168.50.1", "Wi-Fi da sala de espera"],
            ["99", "Servidores", "192.168.99.0/24", "192.168.99.1", "DC01 .5 (DNS/AD), FS01 .10"],
        ], "Plano de endereçamento"),
        texto("Encaminhamento entre VLANs", r"""
<p>PCs em VLANs diferentes estão em redes IP diferentes, por isso <b>não se falam diretamente</b>: o tráfego da Receção (192.168.10.x) para o FS01 (192.168.99.10) tem de passar pelo <b>router</b> (ou por um switch de camada 3). Isto é o <b>encaminhamento entre VLANs</b>.</p>
<p>Esta passagem obrigatória é ótima para a segurança: é no router que se coloca uma <b>ACL</b> (lista de controlo de acessos — regras que permitem ou negam pacotes) a decidir quem chega à porta <b>TCP 445</b> do servidor.</p>"""),
        cli("ACL estendida que protege o servidor de ficheiros", [
            ("R1(config)#", "access-list 110 permit tcp 192.168.10.0 0.0.0.255 host 192.168.99.10 eq 445", "Receção pode usar SMB no FS01."),
            ("R1(config)#", "access-list 110 permit tcp 192.168.20.0 0.0.0.255 host 192.168.99.10 eq 445", "Médicos também."),
            ("R1(config)#", "access-list 110 permit tcp 192.168.30.0 0.0.0.255 host 192.168.99.10 eq 445", "Administração também."),
            ("R1(config)#", "access-list 110 deny tcp any host 192.168.99.10 eq 445 log", "Qualquer outra origem (ex.: Convidados) é recusada e registada."),
            ("R1(config)#", "access-list 110 deny ip 192.168.50.0 0.0.0.255 192.168.99.0 0.0.0.255", "Os convidados não chegam a nada na VLAN de servidores."),
            ("R1(config)#", "access-list 110 permit ip any any", "O restante tráfego (DNS, ping, login no domínio) passa."),
            ("R1(config)#", "interface gigabitEthernet0/0.99", "Subinterface do router para a VLAN 99 (Servidores)."),
            ("R1(config-subif)#", "ip access-group 110 out", "Aplica a ACL ao tráfego que SAI do router para a VLAN de servidores."),
        ], "Aplicada à saída da subinterface .99, uma só ACL protege o servidor do tráfego vindo de todas as VLANs. Lembre-se: as regras são lidas de cima para baixo e no fim há um deny any implícito — por isso a última linha permit ip any any."),
        saida("Verificar a ACL", """
R1# show access-lists 110
Extended IP access list 110
    10 permit tcp 192.168.10.0 0.0.0.255 host 192.168.99.10 eq 445 (152 matches)
    20 permit tcp 192.168.20.0 0.0.0.255 host 192.168.99.10 eq 445 (98 matches)
    30 permit tcp 192.168.30.0 0.0.0.255 host 192.168.99.10 eq 445 (61 matches)
    40 deny tcp any host 192.168.99.10 eq 445 log (7 matches)
    50 deny ip 192.168.50.0 0.0.0.255 192.168.99.0 0.0.0.255 (12 matches)
    60 permit ip any any (2310 matches)
""", "Os contadores (matches) mostram que regras estão a ser usadas. Os 7 pacotes recusados na linha 40 vieram de fora das VLANs do pessoal."),
        cli("Registo DNS para o servidor", [
            ("PS C:\\>", "Add-DnsServerResourceRecordA -ZoneName \"clinica.local\" -Name \"fs01\" -IPv4Address \"192.168.99.10\"", "No DC01: cria o registo A fs01.clinica.local → 192.168.99.10."),
            ("C:\\>", "nslookup fs01.clinica.local", "Em qualquer PC: confirma que o nome resolve."),
        ], "Com o registo DNS, toda a gente usa \\\\fs01\\Receção em vez do IP. Se um dia o servidor mudar de IP, basta alterar o registo."),
        tabela(["Pasta (partilha)", "Receção", "Médicos", "Administração"], [
            [r"\\fs01\Rececao", "Modificar", "Ler", "Ler"],
            [r"\\fs01\Clinico", "Sem acesso", "Modificar", "Sem acesso"],
            [r"\\fs01\Administracao", "Sem acesso", "Sem acesso", "Modificar"],
            [r"\\fs01\Comum", "Modificar", "Modificar", "Modificar"],
        ], "Pastas e permissões NTFS por grupo (na partilha: Alteração para os grupos do domínio)"),
        texto("Grupos, não pessoas", r"""
<p>No Active Directory criam-se os grupos <b>Receção</b>, <b>Médicos</b> e <b>Administração</b> e cada funcionário entra no seu grupo. As permissões dão-se sempre <b>a grupos</b>, nunca a pessoas: quando entra um médico novo, basta pô-lo no grupo Médicos e ele vê logo as pastas certas.</p>
<p>Para a pasta Clínico (dados de saúde), ative também a <b>cifra SMB</b> (<code>Set-SmbShare -Name Clinico -EncryptData $true</code>) e a <b>enumeração baseada no acesso</b>, que esconde as pastas a quem não tem permissão.</p>"""),
        texto("Backups: a regra 3-2-1", r"""
<p>Um servidor de ficheiros sem cópias de segurança é um risco enorme: um disco avariado, um incêndio ou um <b>ransomware</b> (vírus que cifra os ficheiros e pede resgate) e perde-se tudo. A regra <b>3-2-1</b>:</p>
<ul>
<li><b>3</b> cópias dos dados (o original + 2 cópias);</li>
<li>em <b>2</b> suportes diferentes (ex.: disco do servidor e NAS de backup);</li>
<li><b>1</b> cópia fora do edifício (nuvem ou disco levado para outro local), de preferência <b>offline</b> ou imutável, para o ransomware não lhe chegar.</li>
</ul>
<p>Ative também as <b>Cópias Sombra</b> (Versões anteriores) no FS01, para os utilizadores recuperarem sozinhos um ficheiro apagado, e <b>teste a reposição</b> regularmente.</p>"""),
        sim_real(
            [
                "No simulador da app, o «servidor» é um nó que responde a pings e à porta 445; a ACL e as VLANs comportam-se como num router real.",
                "Não existem contas, permissões NTFS nem ficheiros reais: o foco é a rede (VLANs, encaminhamento, ACL, DNS).",
                "Pode errar à vontade: apagar a ACL ou a VLAN não afeta ninguém.",
                "Os contadores de matches e os pings mostram logo se a ACL está bem.",
            ],
            [
                "No escritório real o FS01 é um Windows Server (ou NAS) com discos em RAID, UPS e domínio Active Directory.",
                "Uma ACL errada aplicada à pressa pode deixar a clínica inteira sem acesso aos ficheiros: planeie, teste numa hora calma e tenha acesso por consola.",
                "É preciso pensar em licenças, backups testados, cifra dos dados de saúde e quem pode ver o quê.",
                "Documente tudo: plano de endereçamento, ACLs, grupos e procedimento de reposição.",
            ],
        ),
        alerta("Antes de aplicar uma ACL num router em produção, confirme que não se bloqueia a si próprio (SSH de gestão) e guarde a configuração anterior: <code>copy running-config tftp:</code> ou uma cópia em texto."),
    ],
    [
        mc("Porque é que o tráfego da VLAN 10 para o FS01 passa pelo router?",
           ["Porque o SMB só funciona com routers", "Porque estão em redes IP diferentes", "Porque o switch não suporta TCP", "Porque o DNS assim o exige"], 1,
           "VLANs diferentes = redes IP diferentes; é preciso encaminhamento entre VLANs."),
        cmd("Escreva a linha da ACL 110 que permite à rede 192.168.20.0/24 usar SMB no host 192.168.99.10.",
            ["access-list 110 permit tcp 192.168.20.0 0.0.0.255 host 192.168.99.10 eq 445"],
            "Protocolo tcp, origem com wildcard 0.0.0.255, destino host e porta eq 445."),
        mc("Porque se acrescenta permit ip any any no fim da ACL?",
           ["Para permitir o SMB", "Para ativar o log", "Porque no fim há um deny any implícito", "Para criar a VLAN"], 2,
           "Sem essa linha, todo o restante tráfego para os servidores (DNS, login) seria bloqueado."),
        valor("Na regra 3-2-1, quantas cópias devem estar fora do edifício?", ["1", "uma"],
              "Pelo menos 1 cópia fora do local (offsite)."),
        mc("A quem se devem atribuir as permissões das pastas?",
           ["A cada pessoa individualmente", "Ao grupo Todos", "Ao administrador apenas", "A grupos (Receção, Médicos, Administração)"], 3,
           "Dar permissões a grupos facilita a gestão quando as pessoas entram ou saem."),
        vf("Com a ACL do exemplo, um portátil na VLAN 50 (Convidados) consegue abrir \\\\fs01\\Comum.", False,
           "A linha 40 nega TCP 445 de qualquer outra origem e a linha 50 nega todo o tráfego dos convidados para a VLAN 99."),
        cmd("Que comando do router mostra as regras da ACL 110 e os seus contadores?",
            ["show access-lists 110", "show access-list 110", "show ip access-lists 110"],
            "show access-lists mostra cada linha e quantos pacotes coincidiram."),
        mc("Que tipo de registo DNS faz fs01.clinica.local apontar para 192.168.99.10?",
           ["A", "MX", "PTR", "CNAME"], 0, "O registo A liga um nome a um endereço IPv4."),
        vf("A ACL foi aplicada com ip access-group 110 out na subinterface da VLAN 99.", True,
           "À saída da subinterface .99, filtra o tráfego que vai de todas as outras VLANs para os servidores."),
    ],
    ["odom2", "netacad_ensa", "rfc1034"],
    nivel="intermédio",
))
