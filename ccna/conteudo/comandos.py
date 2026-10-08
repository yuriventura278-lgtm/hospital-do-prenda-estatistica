"""Dicionário de comandos: cada comando Cisco IOS (e de PC) usado no curso, explicado.

Exportado em ``curso()["comandos"]`` e usado pela app através de ``www/js/comandos.js``
(``window.Comandos.explicar(linha, modo)``), nas aulas (blocos ``cli``), no
Laboratório CLI, no terminal do simulador e no ecrã Guia › Comandos.

Sintaxe do campo ``padrao`` (é o que o motor de correspondência usa):

* palavras normais são palavras-chave do IOS e aceitam abreviaturas (``conf t``);
* ``a|b`` — uma das alternativas;
* ``<nome>`` — um argumento qualquer (um IP, um número, um nome);
* ``<nome...>`` — o resto da linha;
* ``[palavra]`` — palavra-chave opcional.

Campos: padrao, abrev, modo (texto), modos (chaves), o_que_faz, porque, exemplo,
saida (opcional), cuidado, desfazer, relacionados, categoria.

Chaves de modo: user (R1>), priv (R1#), config (R1(config)#), if (interface,
subinterface, intervalo), line, router, vlan, dhcp, acl, qos, outros (submodos raros),
rommon, win (Linha de Comandos do Windows), ps (PowerShell), linux.
"""

from __future__ import annotations

MODOS = {
    "user": "EXEC de utilizador (R1>)",
    "priv": "EXEC privilegiado (R1#)",
    "config": "Configuração global (R1(config)#)",
    "if": "Configuração de interface (R1(config-if)#)",
    "line": "Configuração de linha (R1(config-line)#)",
    "router": "Configuração do protocolo de routing (R1(config-router)#)",
    "vlan": "Configuração de VLAN (SW1(config-vlan)#)",
    "dhcp": "Configuração do pool DHCP (R1(dhcp-config)#)",
    "acl": "Configuração de ACL com nome (R1(config-ext-nacl)#)",
    "qos": "Configuração de QoS (class-map/policy-map)",
    "outros": "Submodo de configuração específico",
    "rommon": "ROMMON (rommon 1 >)",
    "win": "Linha de Comandos do Windows (C:\\>)",
    "ps": "PowerShell do Windows (PS C:\\>)",
    "linux": "Terminal Linux ($)",
}

COMANDOS: list[dict] = []


def K(categoria: str, padrao: str, abrev: str, modos: str, o_que_faz: str, porque: str,
      exemplo: str, cuidado: str = "", desfazer: str = "", rel: str = "", saida: str = "") -> None:
    chaves = modos.split()
    for m in chaves:
        assert m in MODOS, (padrao, m)
    COMANDOS.append({
        "padrao": padrao, "abrev": abrev, "modos": chaves,
        "modo": " ou ".join(MODOS[m] for m in chaves),
        "o_que_faz": o_que_faz, "porque": porque, "exemplo": exemplo, "saida": saida,
        "cuidado": cuidado, "desfazer": desfazer,
        "relacionados": [r.strip() for r in rel.split(";") if r.strip()],
        "categoria": categoria,
    })


CFG_TODOS = "config if line router vlan dhcp acl qos outros"

# ---------------------------------------------------------------------------
# Navegação e modos
# ---------------------------------------------------------------------------
N = "Navegação e modos"
K(N, "enable", "en", "user",
  "Passa do modo EXEC de utilizador (R1>) para o EXEC privilegiado (R1#), onde estão os comandos show completos, copy, debug e a entrada na configuração.",
  "Quase tudo o que um técnico faz começa no modo privilegiado; o modo de utilizador só permite consultas básicas.",
  "R1> enable\nPassword:\nR1#",
  "Se houver enable secret, pede a palavra-passe (não aparece enquanto escreve).", "disable", "disable; enable secret <senha>; configure terminal")
K(N, "disable", "disa", "priv",
  "Volta do modo EXEC privilegiado (R1#) para o EXEC de utilizador (R1>).",
  "Útil para deixar a sessão num modo com menos poderes, sem a fechar.",
  "R1# disable\nR1>", "", "enable", "enable; logout")
K(N, "configure terminal", "conf t", "priv",
  "Entra no modo de configuração global (R1(config)#). A partir daqui cada comando altera logo a running-config (na RAM).",
  "É a porta de entrada de toda a configuração: nome, interfaces, routing, segurança.",
  "R1# configure terminal\nEnter configuration commands, one per line.  End with CNTL/Z.\nR1(config)#",
  "As alterações têm efeito imediato mas perdem-se num reinício se não fizer copy running-config startup-config.", "end ou Ctrl+Z", "end; exit; copy running-config startup-config")
K(N, "end", "end", CFG_TODOS,
  "Sai de qualquer modo de configuração e volta diretamente ao EXEC privilegiado (R1#). Equivale a Ctrl+Z.",
  "Poupa vários exit seguidos e deixa-o pronto para verificar (show) e guardar (copy run start).",
  "R1(config-if)# end\nR1#", "", "", "exit; configure terminal")
K(N, "exit", "exi", CFG_TODOS + " priv user",
  "Sobe um nível: de um submodo (interface, linha, router) para a configuração global; da global para o EXEC privilegiado; no EXEC fecha a sessão.",
  "Permite mudar de submodo sem sair da configuração.",
  "R1(config-if)# exit\nR1(config)#", "No modo EXEC termina a sessão (numa consola volta ao “Press RETURN”).", "", "end; logout")
K(N, "logout", "logo", "user priv",
  "Termina a sessão atual (consola, SSH ou Telnet).",
  "Boa prática de segurança: nunca deixar uma sessão aberta numa consola.",
  "R1# logout", "", "", "exit")
K(N, "do <comando...>", "do", CFG_TODOS,
  "Executa um comando do modo EXEC privilegiado (show, ping, copy) sem sair do modo de configuração em que está.",
  "Verifica o resultado de uma alteração no próprio momento, sem perder o sítio onde estava.",
  "R1(config-if)# do show ip interface brief", "Sem o “do”, um show dentro de (config)# dá “% Invalid input”.", "", "show running-config; show ip interface brief")
K(N, "terminal length <linhas>", "term len 0", "user priv",
  "Define quantas linhas aparecem antes do “--More--”. Com 0 a saída sai toda seguida.",
  "Útil para copiar saídas longas (show run) ou em scripts de automação.",
  "R1# terminal length 0", "Só vale para a sessão atual.", "terminal length 24", "show running-config")
K(N, "terminal monitor", "term mon", "priv",
  "Mostra numa sessão SSH/Telnet as mensagens de log e de debug, que por defeito só aparecem na consola.",
  "Sem isto, ao fazer debug por SSH não vê nada.",
  "R1# terminal monitor", "Só vale para a sessão atual.", "terminal no monitor", "debug <...>; logging synchronous")
K(N, "terminal no monitor", "term no mon", "priv",
  "Deixa de mostrar mensagens de log e debug na sessão remota atual.",
  "Para parar o “ruído” de mensagens enquanto trabalha.",
  "R1# terminal no monitor", "", "terminal monitor", "terminal monitor")
K(N, "terminal history size <n>", "term hist size", "user priv",
  "Muda quantos comandos ficam guardados no histórico da sessão (seta para cima).",
  "Com um histórico maior repete comandos longos sem os reescrever.",
  "S1# terminal history size 200", "", "", "show history")
K(N, "history size <n>", "hist size", "line",
  "Define o tamanho do histórico de comandos para todas as sessões dessa linha (consola ou vty).",
  "Torna permanente o tamanho do histórico.",
  "R1(config-line)# history size 100", "", "no history size", "show history")
K(N, "show history", "sh hist", "user priv",
  "Lista os últimos comandos escritos nesta sessão.",
  "Ajuda a lembrar o que já fez e a documentar.",
  "R1# show history", "", "", "terminal history size <n>")
K(N, "clear", "", "user priv",
  "Comando do terminal simulado da app: limpa o ecrã.", "Arruma o ecrã quando está cheio.", "R1# clear",
  "Num IOS real, clear sozinho espera um argumento (clear counters, clear arp-cache…).", "", "clear counters")

# ---------------------------------------------------------------------------
# Configuração básica
# ---------------------------------------------------------------------------
B = "Configuração básica"
K(B, "hostname <nome>", "host", "config",
  "Dá um nome ao equipamento; o prompt muda logo (ex.: Router → R1).",
  "Identifica o equipamento em prompts, logs e CDP, e é obrigatório para gerar as chaves RSA do SSH.",
  "Router(config)# hostname R1\nR1(config)#", "O nome não pode ter espaços.", "no hostname (volta a Router/Switch)", "ip domain-name <dominio>; crypto key generate rsa")
K(B, "no ip domain-lookup", "no ip domain-lo", "config",
  "Desliga a resolução de nomes por DNS na CLI. Assim um comando mal escrito não fica ~30 s a tentar “traduzir” a palavra num IP.",
  "Poupa tempo nos laboratórios: sem isto, “shwo run” bloqueia a consola à procura de um servidor DNS.",
  "R1(config)# no ip domain-lookup", "Se precisar de ping por nomes no router, terá de ligar de novo e configurar ip name-server.", "ip domain-lookup", "ip name-server <ip>; ip host <nome> <ip>")
K(B, "ip domain-lookup", "ip domain-lo", "config",
  "Liga a resolução de nomes DNS no próprio equipamento (é o valor por defeito).",
  "Permite ping ou traceroute para nomes, com um ip name-server configurado.",
  "R1(config)# ip domain-lookup", "", "no ip domain-lookup", "ip name-server <ip>")
K(B, "ip domain-name <dominio>", "ip domain-n", "config",
  "Define o domínio DNS do equipamento (ex.: empresa.local).",
  "Obrigatório para gerar as chaves RSA do SSH (o nome das chaves é hostname.domínio).",
  "R1(config)# ip domain-name empresa.local", "", "no ip domain-name", "hostname <nome>; crypto key generate rsa")
K(B, "ip name-server <ip...>", "ip name", "config",
  "Indica o(s) servidor(es) DNS que o router usa para resolver nomes.",
  "Necessário para o router fazer ping/traceroute/copy para nomes.",
  "R1(config)# ip name-server 8.8.8.8", "", "no ip name-server <ip>", "ip domain-lookup")
K(B, "ip host <nome> <ip>", "ip host", "config",
  "Cria um nome local (tabela de hosts do router), como o ficheiro hosts de um PC.",
  "Permite usar nomes sem servidor DNS, ex.: ping SRV1.",
  "R1(config)# ip host SRV1 10.0.0.10", "", "no ip host <nome>", "ip name-server <ip>")
K(B, "banner motd <texto...>", "banner motd", "config",
  "Define a mensagem do dia, mostrada a quem se liga antes do login. O texto fica entre dois delimitadores iguais (ex.: #).",
  "Aviso legal: “Acesso restrito a pessoal autorizado” — em muitos países é necessário para poder processar intrusos.",
  "R1(config)# banner motd #Acesso restrito a pessoal autorizado#",
  "O delimitador não pode aparecer dentro do texto. Nunca escreva “Bem-vindo”.", "no banner motd", "")
K(B, "clock set <hora...>", "clock set", "priv",
  "Acerta à mão o relógio do equipamento (modo EXEC privilegiado). Ex.: clock set 14:30:00 8 October 2026.",
  "Logs e certificados precisam da hora certa; sem NTP é a forma de a acertar.",
  "R1# clock set 14:30:00 8 October 2026", "Perde-se num reinício na maioria dos routers sem relógio com bateria; prefira NTP.", "", "ntp server <ip>; show clock")
K(B, "clock timezone <zona> <horas>", "clock time", "config",
  "Define o fuso horário em relação ao UTC (ex.: WAT 1, WET 0).",
  "Para os logs mostrarem a hora local.",
  "R1(config)# clock timezone WAT 1", "", "no clock timezone", "clock summer-time <...>; show clock")
K(B, "clock summer-time <regra...>", "clock summer", "config",
  "Define as regras da hora de verão.", "Mantém a hora local certa ao longo do ano.",
  "R1(config)# clock summer-time WEST recurring last Sun Mar 1:00 last Sun Oct 2:00", "", "no clock summer-time", "clock timezone <zona> <horas>")
K(B, "show clock", "sh clock", "user priv",
  "Mostra a data e a hora do equipamento.", "Confirme a hora antes de analisar logs.",
  "R1# show clock\n*14:30:05.123 WAT Thu Oct 8 2026", "Um * no início indica que a hora não é fiável (não sincronizada).", "", "ntp server <ip>; show ntp status")
K(B, "alias <modo> <atalho> <comando...>", "alias", "config",
  "Cria um atalho para um comando (ex.: alias exec s show ip interface brief).",
  "Poupa escrita em comandos que usa muitas vezes.",
  "R1(config)# alias exec sib show ip interface brief", "", "no alias <modo> <atalho>", "")
K(B, "service timestamps <opcoes...>", "service timest", "config",
  "Acrescenta data e hora a cada mensagem de log ou debug (ex.: log datetime msec).",
  "Sem hora nos logs é impossível reconstruir o que aconteceu e quando.",
  "R1(config)# service timestamps log datetime msec", "", "no service timestamps", "logging host <ip>; ntp server <ip>")

# ---------------------------------------------------------------------------
# Segurança e acessos
# ---------------------------------------------------------------------------
S = "Segurança e acessos"
K(S, "enable secret <senha>", "ena sec", "config",
  "Define a palavra-passe do modo privilegiado, guardada como hash forte (tipo 5, 8 ou 9).",
  "Sem ela qualquer pessoa com acesso à consola chega ao modo privilegiado e muda tudo.",
  "R1(config)# enable secret Cisco#2026",
  "Se também existir enable password, o enable secret ganha. Guarde a palavra-passe num cofre: perdê-la obriga à recuperação de palavra-passe.",
  "no enable secret", "enable password <senha>; service password-encryption")
K(S, "enable password <senha>", "ena pass", "config",
  "Define a palavra-passe do modo privilegiado em texto simples (ou com cifra fraca tipo 7).",
  "Só existe por compatibilidade; use enable secret.",
  "R1(config)# enable password antiga123", "Aparece legível no show running-config. Não use.", "no enable password", "enable secret <senha>")
K(S, "service password-encryption", "service pass", "config",
  "Cifra (tipo 7) as palavras-passe que estavam em texto simples na configuração: consola, vty, username … password.",
  "Evita que alguém leia as palavras-passe por cima do ombro num show run.",
  "R1(config)# service password-encryption",
  "O tipo 7 decifra-se em segundos na Internet: protege contra olhares, não contra ataques. Use secret sempre que possível.",
  "no service password-encryption (as já cifradas ficam cifradas)", "enable secret <senha>; username <nome> secret <senha>")
K(S, "security passwords min-length <n>", "security pass min", "config",
  "Obriga as novas palavras-passe do equipamento a ter pelo menos n caracteres.",
  "Impede palavras-passe curtas e fáceis de adivinhar.",
  "R1(config)# security passwords min-length 10", "Não altera as palavras-passe já existentes.", "no security passwords min-length", "enable secret <senha>")
K(S, "username <nome> secret <senha>", "usern", "config",
  "Cria uma conta local com palavra-passe guardada em hash.",
  "Permite login com utilizador e palavra-passe (login local), obrigatório para SSH.",
  "R1(config)# username admin secret Adm!n#2026", "", "no username <nome>", "login local; transport input ssh")
K(S, "username <nome> privilege <nivel> secret <senha>", "usern … priv 15", "config",
  "Cria uma conta local com um nível de privilégio (15 = entra logo no modo privilegiado).",
  "Dá aos administradores acesso direto ao R1# após o login.",
  "R1(config)# username admin privilege 15 secret Adm!n#2026", "Dê nível 15 só a quem precisa.", "no username <nome>", "username <nome> secret <senha>")
K(S, "username <nome> password <senha>", "usern … pass", "config",
  "Cria uma conta local com palavra-passe em texto simples.",
  "Versão antiga; prefira username … secret.",
  "R1(config)# username tecnico password abc123", "Fica legível na configuração (ou com cifra fraca tipo 7).", "no username <nome>", "username <nome> secret <senha>")
K(S, "line console <n>", "line con 0", "config",
  "Entra na configuração da porta de consola (R1(config-line)#).",
  "É aí que se protege o acesso físico ao equipamento.",
  "R1(config)# line console 0\nR1(config-line)#", "", "", "password <senha>; login; logging synchronous; exec-timeout <min> <seg>")
K(S, "line vty <primeira> <ultima>", "line vty 0 4", "config",
  "Entra na configuração das linhas virtuais (acesso remoto por SSH/Telnet). 0 4 = 5 sessões; 0 15 = 16 sessões.",
  "É aí que se define como se entra remotamente: login, protocolo e ACL.",
  "R1(config)# line vty 0 4\nR1(config-line)#", "Configure todas as linhas que existem (0 4 ou 0 15), senão algumas ficam abertas.", "", "transport input ssh; login local; access-class <n> in")
K(S, "password <senha>", "pass", "line",
  "Define a palavra-passe da linha (consola ou vty).",
  "Protege o acesso pela consola ou pelo Telnet quando se usa login simples.",
  "R1(config-line)# password ConsolaSegura", "Sem o comando login a palavra-passe não é pedida. Fica em texto simples sem service password-encryption.", "no password", "login; service password-encryption")
K(S, "login", "login", "line",
  "Faz a linha pedir a palavra-passe definida com password.",
  "Sem login, a linha deixa entrar sem pedir nada.",
  "R1(config-line)# login", "", "no login", "password <senha>; login local")
K(S, "no login", "no login", "line",
  "Desliga a pedida de palavra-passe na linha.",
  "Só se usa em laboratório; numa rede real deixa o equipamento aberto.",
  "R1(config-line)# no login", "Perigoso: qualquer pessoa entra.", "login", "login")
K(S, "login local", "login loc", "line",
  "Faz a linha pedir utilizador e palavra-passe das contas locais (username …).",
  "Cada pessoa tem a sua conta e fica registado quem entrou; obrigatório para SSH.",
  "R1(config-line)# login local", "Crie primeiro pelo menos um username, ou fica sem acesso.", "no login local", "username <nome> secret <senha>; transport input ssh")
K(S, "transport input <protocolo...>", "transport in", "line",
  "Define que protocolos podem usar as linhas vty: ssh, telnet, all ou none.",
  "Com “ssh” recusa o Telnet, que envia palavras-passe em texto simples.",
  "R1(config-line)# transport input ssh", "Com ssh, sem chaves RSA ninguém consegue entrar remotamente.", "transport input all", "crypto key generate rsa; ip ssh version 2")
K(S, "exec-timeout <minutos> <segundos>", "exec-t", "line",
  "Desliga a sessão após o tempo de inatividade indicado (por defeito 10 min).",
  "Uma sessão esquecida aberta é um risco de segurança.",
  "R1(config-line)# exec-timeout 5 0", "exec-timeout 0 0 nunca desliga: evite fora do laboratório.", "no exec-timeout", "line vty <primeira> <ultima>")
K(S, "logging synchronous", "logg syn", "line",
  "As mensagens de log deixam de cortar o comando que está a escrever: o IOS volta a mostrar a sua linha depois da mensagem.",
  "Torna a consola muito mais confortável.",
  "R1(config-line)# logging synchronous", "", "no logging synchronous", "line console <n>")
K(S, "access-class <acl> in", "access-c", "line",
  "Aplica uma ACL às linhas vty: só os IPs permitidos podem abrir SSH/Telnet ao equipamento.",
  "Restringe a gestão remota à rede dos administradores.",
  "R1(config-line)# access-class 5 in", "Teste antes de sair: uma ACL errada corta o seu próprio acesso remoto.", "no access-class <acl> in", "access-list <n> permit <origem> <wildcard>; line vty <primeira> <ultima>")
K(S, "privilege level <n>", "priv lev", "line",
  "Define o nível de privilégio com que se entra por essa linha (15 = modo privilegiado).",
  "Controla o que cada acesso pode fazer.",
  "R1(config-line)# privilege level 15", "Dar nível 15 sem login é abrir a porta.", "no privilege level", "username <nome> privilege <nivel> secret <senha>")
K(S, "crypto key generate rsa [general-keys] [modulus] [<bits>]", "crypto key gen rsa", "config",
  "Gera o par de chaves RSA que o servidor SSH usa. Com modulus 2048 não pergunta o tamanho.",
  "Sem chaves RSA o SSH não arranca.",
  "R1(config)# crypto key generate rsa modulus 2048\nThe name for the keys will be: R1.empresa.local",
  "Exige hostname diferente de Router e ip domain-name. Para SSH v2 use pelo menos 768 bits (recomendado 2048).",
  "crypto key zeroize rsa", "ip ssh version 2; ip domain-name <dominio>; transport input ssh")
K(S, "ip ssh version <versao>", "ip ssh ver 2", "config",
  "Força a versão do SSH (use 2; a 1 tem falhas).",
  "O SSH v2 é seguro; o v1 não.",
  "R1(config)# ip ssh version 2", "Exige chaves RSA de pelo menos 768 bits.", "no ip ssh version", "crypto key generate rsa; show ip ssh")
K(S, "ip ssh time-out <segundos>", "ip ssh time", "config",
  "Tempo máximo para completar o login SSH.", "Limita ligações penduradas.",
  "R1(config)# ip ssh time-out 60", "", "no ip ssh time-out", "ip ssh authentication-retries <n>")
K(S, "ip ssh authentication-retries <n>", "ip ssh auth", "config",
  "Número de tentativas de login SSH antes de desligar.", "Dificulta adivinhar palavras-passe.",
  "R1(config)# ip ssh authentication-retries 3", "", "no ip ssh authentication-retries", "login block-for <...>")
K(S, "show ip ssh", "sh ip ssh", "priv",
  "Mostra se o SSH está ativo, a versão e os tempos.", "Confirma que as chaves foram geradas.",
  "R1# show ip ssh", "", "", "crypto key generate rsa; ip ssh version 2", "SSH Enabled - version 2.0\nAuthentication timeout: 120 secs; Authentication retries: 3")
K(S, "login block-for <segundos> attempts <n> within <segundos>", "login block", "config",
  "Bloqueia novos logins durante um tempo se houver n tentativas falhadas num intervalo.",
  "Trava ataques de força bruta às palavras-passe.",
  "R1(config)# login block-for 120 attempts 3 within 60", "Pode bloquear-se a si próprio: tenha a consola à mão.", "no login block-for", "ip ssh authentication-retries <n>")
K(S, "aaa new-model", "aaa new", "config",
  "Ativa o modelo AAA (autenticação, autorização, accounting) no equipamento.",
  "Necessário para usar TACACS+/RADIUS e listas de métodos.",
  "R1(config)# aaa new-model", "Muda logo a forma de login: configure as listas a seguir para não ficar fechado de fora.", "no aaa new-model", "aaa authentication login <...>; tacacs server <nome>")
K(S, "aaa authentication login <lista> <metodos...>", "aaa auth login", "config",
  "Define como se autenticam os logins: ex. default group tacacs+ local (primeiro o servidor TACACS+, se não responder as contas locais).",
  "Centraliza as contas dos administradores num servidor, com conta local de reserva.",
  "R1(config)# aaa authentication login default group tacacs+ local", "Inclua sempre local como reserva.", "no aaa authentication login <lista>", "aaa new-model; tacacs server <nome>")
K(S, "tacacs server <nome>", "tacacs serv", "config",
  "Cria a definição de um servidor TACACS+ e entra no seu submodo.",
  "Para autenticar administradores num servidor central (ex.: Cisco ISE).",
  "R1(config)# tacacs server ISE\nR1(config-server-tacacs)#", "", "no tacacs server <nome>", "address ipv4 <ip>; key <chave>")
K(S, "address ipv4 <ip>", "add ipv4", "outros",
  "No submodo do servidor TACACS+/RADIUS, indica o IP do servidor.", "O router precisa de saber onde está o servidor.",
  "R1(config-server-tacacs)# address ipv4 10.0.0.20", "", "no address ipv4", "tacacs server <nome>; key <chave>")
K(S, "key <chave>", "key", "outros",
  "No submodo do servidor TACACS+/RADIUS, define a chave partilhada com o servidor.", "Autentica e cifra a comunicação router–servidor.",
  "R1(config-server-tacacs)# key Chave#Partilhada", "Tem de ser igual à configurada no servidor.", "no key", "tacacs server <nome>")
K(S, "ip http server", "ip http serv", "config",
  "Liga o servidor web (HTTP) de gestão do equipamento.", "Algumas ferramentas gráficas precisam dele.",
  "R1(config)# ip http server", "HTTP não é cifrado; prefira ip http secure-server ou desligue.", "no ip http server", "ip http secure-server")
K(S, "no ip http server", "no ip http serv", "config",
  "Desliga o servidor web HTTP de gestão.", "Reduz a superfície de ataque (boa prática de hardening).",
  "R1(config)# no ip http server", "", "ip http server", "ip http secure-server")
K(S, "ip http secure-server", "ip http sec", "config",
  "Liga a gestão web por HTTPS (cifrada).", "Se precisar de interface web, que seja cifrada.",
  "R1(config)# ip http secure-server", "", "no ip http secure-server", "no ip http server")
