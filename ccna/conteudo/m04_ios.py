from .base import *

MODULO = modulo(
    id="m4", numero=4, icone="terminal",
    titulo="Primeiros passos no Cisco IOS",
    descricao="A linha de comandos Cisco do zero: modos, configuração base, SSH, verificação e o que muda entre simulador e equipamento real.",
    dominio="1.0 / 4.0 / 5.0",
    licoes=[
        licao(
            "m4l1", "Modos da CLI e navegação", 15,
            ["Navegar entre os modos do IOS",
             "Usar abreviações, ? e Tab",
             "Perceber running-config e startup-config"],
            [
                texto("Os modos", """
<p>O prompt diz-lhe sempre em que modo está:</p>
<ul>
<li><code>R1&gt;</code> <b>EXEC de utilizador</b>: só comandos básicos de consulta.</li>
<li><code>R1#</code> <b>EXEC privilegiado</b>: todos os <code>show</code>, <code>debug</code>, <code>copy</code>, <code>reload</code>.</li>
<li><code>R1(config)#</code> <b>Configuração global</b>: alterações que afetam todo o equipamento.</li>
<li><code>R1(config-if)#</code>, <code>(config-line)#</code>, <code>(config-router)#</code>, <code>(config-vlan)#</code>: <b>submodos</b>.</li>
</ul>"""),
                cli("Andar entre modos", [
                    ("R1>", "enable", "Sobe para EXEC privilegiado (abreviação: en)."),
                    ("R1#", "configure terminal", "Entra em configuração global (conf t)."),
                    ("R1(config)#", "interface gigabitEthernet 0/0", "Submodo de interface (int g0/0)."),
                    ("R1(config-if)#", "exit", "Volta um nível."),
                    ("R1(config)#", "end", "Volta direto ao modo privilegiado (ou Ctrl+Z)."),
                    ("R1#", "disable", "Volta ao EXEC de utilizador."),
                ]),
                tabela(["Atalho", "Efeito"], [
                    ["?", "Lista comandos ou opções disponíveis"],
                    ["Tab", "Completa o comando"],
                    ["Seta ↑ / Ctrl+P", "Comando anterior (histórico)"],
                    ["Ctrl+A / Ctrl+E", "Início / fim da linha"],
                    ["Ctrl+Shift+6", "Interrompe ping/traceroute ou pesquisa DNS"],
                    ["Ctrl+Z", "Sai para o modo privilegiado"],
                    ["do <comando>", "Executa um comando EXEC dentro do modo de configuração"],
                ], "Atalhos que poupam tempo"),
                texto("Onde fica a configuração", """
<ul>
<li><b>running-config</b>: a configuração ativa, em <b>RAM</b>. Perde-se ao desligar.</li>
<li><b>startup-config</b>: guardada na <b>NVRAM</b>. É carregada no arranque.</li>
</ul>
<p>Para guardar: <code>copy running-config startup-config</code> (ou <code>write memory</code> / <code>wr</code>).</p>"""),
                alerta("Escreveu um nome errado e o equipamento ficou parado a “Translating…”? Ele pensou que era um nome de host e tentou DNS. Use <b>Ctrl+Shift+6</b> e configure <code>no ip domain-lookup</code>."),
                dica("Experimente já no <b>Laboratório CLI</b> (separador Jogar): o terminal simulado aceita abreviações, <code>?</code> e <code>do</code>."),
                video("Cisco IOS CLI básico", "Cisco IOS CLI modos de configuração básico aula"),
            ],
            [
                mc("Que prompt indica o modo de configuração global?", ["R1>", "R1#", "R1(config)#", "R1(config-if)#"], 2, "(config)# = configuração global."),
                cmd("Que comando passa de R1> para R1#?", ["enable", "en", "ena"], "enable (pode abreviar)."),
                mc("Onde fica a running-config?", ["NVRAM", "RAM", "Flash", "ROM"], 1, "RAM: perde-se se o equipamento reiniciar sem guardar."),
                cmd("Que comando guarda a configuração ativa no arranque?", ["copy running-config startup-config", "copy run start", "write memory", "wr", "write", "wr mem"], "copy running-config startup-config ou write memory."),
                vf("No modo de configuração pode usar 'do show ip interface brief'.", True, "O prefixo do executa comandos EXEC."),
            ],
            ["cisco_ios", "odom1", "netacad_itn"],
        ),

        licao(
            "m4l2", "Configuração base e acesso seguro (SSH)", 20,
            ["Fazer a configuração inicial de um router ou switch",
             "Proteger o acesso com palavras-passe e utilizadores locais",
             "Ativar SSH e desativar Telnet"],
            [
                cli("Configuração inicial de um router", [
                    ("Router>", "enable", ""),
                    ("Router#", "configure terminal", ""),
                    ("Router(config)#", "hostname R1", "Dá nome ao equipamento: o prompt muda logo."),
                    ("R1(config)#", "no ip domain-lookup", "Evita esperas quando se escreve um comando errado."),
                    ("R1(config)#", "enable secret Cisco#2026", "Palavra-passe do modo privilegiado, guardada com hash."),
                    ("R1(config)#", "service password-encryption", "Esconde (cifra fraca, tipo 7) as palavras-passe em texto simples."),
                    ("R1(config)#", "banner motd #Acesso restrito a pessoal autorizado#", "Mensagem legal mostrada no login."),
                    ("R1(config)#", "line console 0", "Configura a consola."),
                    ("R1(config-line)#", "password ConsolaSegura", ""),
                    ("R1(config-line)#", "login", "Pede a palavra-passe da linha."),
                    ("R1(config-line)#", "logging synchronous", "Mensagens de log não cortam o que está a escrever."),
                    ("R1(config-line)#", "exec-timeout 10 0", "Termina a sessão após 10 min inativo."),
                    ("R1(config-line)#", "exit", ""),
                    ("R1(config)#", "interface g0/0", ""),
                    ("R1(config-if)#", "description LAN dos utilizadores", "Documenta a interface."),
                    ("R1(config-if)#", "ip address 192.168.1.1 255.255.255.0", "IP do gateway da LAN."),
                    ("R1(config-if)#", "no shutdown", "As interfaces de router vêm desligadas por defeito!"),
                    ("R1(config-if)#", "end", ""),
                    ("R1#", "copy running-config startup-config", "Guardar sempre no fim."),
                ]),
                cli("Ativar SSH versão 2", [
                    ("R1(config)#", "ip domain-name empresa.local", "Necessário para gerar as chaves RSA."),
                    ("R1(config)#", "username admin secret Adm!n2026", "Utilizador local com hash."),
                    ("R1(config)#", "crypto key generate rsa modulus 2048", "Gera as chaves (o SSH só arranca com chaves; mínimo 768 para SSHv2)."),
                    ("R1(config)#", "ip ssh version 2", "Força a versão 2."),
                    ("R1(config)#", "line vty 0 4", "Linhas de acesso remoto (em muitos IOS existem 0 15)."),
                    ("R1(config-line)#", "login local", "Usa os utilizadores locais."),
                    ("R1(config-line)#", "transport input ssh", "Só SSH: Telnet fica bloqueado."),
                    ("R1#", "show ip ssh", "Confirma: SSH Enabled - version 2.0."),
                ], "Num switch L2, para gerir remotamente, configure também um IP na SVI (<code>interface vlan 1</code>) e o <code>ip default-gateway</code>."),
                tabela(["Comando", "Como guarda"], [
                    ["enable password", "Texto simples (tipo 0) — evite"],
                    ["service password-encryption", "Tipo 7 — reversível, só evita olhares por cima do ombro"],
                    ["enable secret / username … secret", "Hash (tipo 5 MD5, 8 PBKDF2 ou 9 scrypt, conforme versão)"],
                ], "Tipos de palavra-passe"),
                sim_real(
                    ["No Packet Tracer o 'crypto key generate rsa' pergunta o tamanho e conclui instantaneamente.",
                     "Testa SSH no PC simulado: Desktop › Command Prompt › ssh -l admin 192.168.1.1.",
                     "Algumas opções (algorithm-type scrypt, ip ssh time-out) podem não existir."],
                    ["Gerar chaves de 2048/4096 bits demora alguns segundos.",
                     "Clientes SSH modernos (OpenSSH recente) podem recusar algoritmos antigos de IOS velhos: pode ser preciso -oKexAlgorithms=+diffie-hellman-group14-sha1.",
                     "Antes de 'transport input ssh' confirme que consegue entrar por SSH, ou fica trancado fora (só resta a consola).",
                     "Em produção use AAA com TACACS+/RADIUS, não só utilizadores locais."]),
                alerta("Nunca use Telnet em produção: tudo, incluindo palavras-passe, passa em texto claro e qualquer analisador (Wireshark) lê."),
                video("Configurar SSH em router Cisco", "configurar SSH router switch Cisco passo a passo"),
            ],
            [
                cmd("Que comando dá ao router o nome R1?", ["hostname R1"], "hostname R1 no modo de configuração global."),
                mc("Qual a forma mais segura de proteger o modo privilegiado?", ["enable password", "enable secret", "service password-encryption", "login"], 1, "enable secret guarda um hash."),
                mc("O que é obrigatório para gerar chaves RSA?", ["hostname e ip domain-name", "Um servidor TACACS+", "Interface loopback", "Um servidor NTP"], 0, "O nome das chaves usa hostname.domínio."),
                cmd("Na linha vty, que comando permite apenas SSH?", ["transport input ssh"], "transport input ssh."),
                vf("As interfaces dos routers Cisco vêm ativas por defeito.", False, "Vêm em shutdown (administratively down). Nos switches estão ativas."),
            ],
            ["cisco_ios", "rfc4253", "odom1", "nist"],
        ),

        licao(
            "m4l3", "Verificar e resolver problemas", 18,
            ["Ler show ip interface brief e show interfaces",
             "Usar ping, traceroute, CDP e LLDP",
             "Interpretar estados up/down e contadores de erro"],
            [
                saida("show ip interface brief", """
R1#show ip interface brief
Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0     192.168.1.1     YES manual up                    up
GigabitEthernet0/1     10.0.0.1        YES manual up                    down
GigabitEthernet0/2     unassigned      YES unset  administratively down down
Loopback0              1.1.1.1         YES manual up                    up""",
                      "Leia as duas colunas finais: Status (camada 1) e Protocol (camada 2)."),
                tabela(["Status / Protocol", "Significado", "Causa provável"], [
                    ["up / up", "Tudo bem", "—"],
                    ["administratively down / down", "Desligada por configuração", "Falta no shutdown"],
                    ["down / down", "Sem sinal físico", "Cabo desligado/avariado, outra ponta desligada"],
                    ["up / down", "Camada 1 ok, camada 2 não", "Encapsulamento diferente, clock rate, keepalives"],
                    ["down / down (err-disabled)", "Desligada por proteção", "Port security, BPDU guard"],
                ], "Os estados das interfaces"),
                saida("Contadores em show interfaces g0/0", """
  5 minute input rate 2000 bits/sec, 3 packets/sec
     12045 packets input, 1544320 bytes, 0 no buffer
     0 runts, 0 giants, 0 throttles
     157 input errors, 157 CRC, 0 frame, 0 overrun, 0 ignored
     0 output errors, 34 collisions, 2 interface resets
     12 late collision, 0 deferred""",
                      "CRC a subir = problema físico (cabo, interferência). Late collisions = quase sempre duplex mismatch."),
                cli("Ferramentas de teste", [
                    ("R1#", "ping 192.168.1.10", "!!!!! = sucesso; . = timeout; U = destino inalcançável."),
                    ("R1#", "ping 8.8.8.8 source g0/0", "Ping estendido escolhendo a origem."),
                    ("R1#", "traceroute 10.2.2.2", "Mostra cada salto até ao destino."),
                    ("R1#", "show cdp neighbors", "Vizinhos Cisco diretamente ligados (CDP, ativo por defeito)."),
                    ("R1#", "show cdp neighbors detail", "Inclui IP e versão de IOS do vizinho."),
                    ("R1(config)#", "lldp run", "Ativa LLDP (norma aberta, IEEE 802.1AB) — desligado por defeito no IOS."),
                    ("R1#", "show lldp neighbors", "Vizinhos LLDP, incluindo outros fabricantes."),
                    ("R1#", "show running-config | include hostname", "Filtra a saída (também section, begin, exclude)."),
                ]),
                tabela(["SO", "Ver IP", "Ping", "Traçar rota", "DNS"], [
                    ["Windows", "ipconfig /all", "ping", "tracert", "nslookup"],
                    ["Linux", "ip addr", "ping", "traceroute", "dig / nslookup"],
                    ["macOS", "ifconfig", "ping", "traceroute", "dig / nslookup"],
                ], "Comandos nos hosts"),
                exemplo("Metodologia", """
<p>1) Definir o problema → 2) recolher informação (<code>show</code>, perguntar ao utilizador) → 3) analisar → 4) eliminar causas (OSI de baixo para cima, de cima para baixo ou “dividir para conquistar”) → 5) testar a solução → 6) <b>documentar</b>.</p>"""),
                sim_real(
                    ["O modo Simulation do Packet Tracer mostra cada pacote a andar, ótimo para perceber ARP e ICMP.",
                     "Contadores de erro quase sempre a zero."],
                    ["Use Wireshark num port mirror (SPAN) para ver os pacotes reais.",
                     "Contadores com CRC, input errors e drops são comuns e são a primeira pista.",
                     "Por segurança, CDP/LLDP costumam estar desligados em portas viradas para fora (no cdp enable).",
                     "O primeiro ping costuma perder 1 resposta (.!!!!) enquanto o ARP resolve — é normal."]),
                video("Troubleshooting Cisco show commands", "Cisco show ip interface brief troubleshooting CCNA"),
            ],
            [
                mc("Uma interface mostra 'administratively down'. O que fazer?", ["Trocar o cabo", "Executar no shutdown", "Mudar o duplex", "Reiniciar"], 1, "Foi desligada por configuração."),
                mc("Muitos 'late collisions' indicam normalmente…", ["Cabo cruzado", "Duplex mismatch", "VLAN errada", "Falta de rota"], 1, "Um lado em half-duplex e outro em full."),
                cmd("Que comando mostra os vizinhos Cisco diretamente ligados?", ["show cdp neighbors", "sh cdp nei", "show cdp neighbors detail", "sh cdp neighbors"], "show cdp neighbors."),
                vf("LLDP é um protocolo proprietário da Cisco.", False, "LLDP é norma IEEE 802.1AB. O proprietário é o CDP."),
                mc("No resultado de um ping Cisco, '.' significa…", ["Sucesso", "Timeout", "Destino inalcançável", "TTL expirado"], 1, "Ponto = sem resposta dentro do tempo."),
            ],
            ["cisco_ios", "odom1", "netacad_srwe"],
        ),

        licao(
            "m4l4", "Simulador × equipamento real", 18,
            ["Escolher entre Packet Tracer, GNS3, EVE-NG e CML",
             "Conhecer o arranque do IOS, a flash e o ROMMON",
             "Fazer backup, atualizar IOS e recuperar palavra-passe"],
            [
                tabela(["Ferramenta", "O que é", "Prós", "Contras"], [
                    ["Cisco Packet Tracer", "Simulador gratuito (NetAcad)", "Leve, corre em qualquer PC, ideal para CCNA", "IOS simulado: comandos limitados"],
                    ["Cisco CML", "Emulação com imagens Cisco oficiais", "IOS real (IOSv, IOS-XE, NX-OS)", "Pago; exige muita RAM"],
                    ["GNS3", "Emulador gratuito", "Mistura imagens reais, VMs e PCs", "Precisa de imagens próprias"],
                    ["EVE-NG", "Plataforma web de emulação", "Multi-fabricante, labs grandes", "Instalação mais técnica"],
                    ["Equipamento usado", "Switches/routers reais", "Experiência física: cabos, consola, LEDs, ruído", "Custo, espaço, consumo"],
                ], "Onde praticar"),
                figura("painel_router", "Num equipamento real vai ligar a consola, ver LEDs e ouvir as ventoinhas."),
                texto("O arranque de um equipamento Cisco", """
<ol>
<li><b>POST</b> (teste do hardware) e carregamento do <b>bootstrap</b> a partir da ROM.</li>
<li>Localiza e carrega o <b>IOS</b> (normalmente da <b>flash</b>; pode vir de TFTP).</li>
<li>Carrega a <b>startup-config</b> da NVRAM. Se não existir, abre o <i>setup mode</i> (“Would you like to enter the initial configuration dialog?” — responda <b>no</b>).</li>
</ol>
<p>O <b>configuration register</b> (normalmente <code>0x2102</code>) controla isto. Com <code>0x2142</code> o router ignora a startup-config: é a base da recuperação de palavra-passe.</p>"""),
                cli("Backup e atualização via TFTP", [
                    ("R1#", "show version", "Modelo, versão do IOS, uptime, config register."),
                    ("R1#", "show flash:", "Ficheiros na flash e espaço livre."),
                    ("R1#", "copy running-config tftp:", "Pede o IP do servidor TFTP e o nome do ficheiro."),
                    ("R1#", "copy tftp: flash:", "Copia uma nova imagem IOS para a flash."),
                    ("R1(config)#", "boot system flash:isr4300-universalk9.17.09.04a.SPA.bin", "Indica que imagem arrancar (exemplo de nome)."),
                    ("R1#", "verify /md5 flash:isr4300-universalk9.17.09.04a.SPA.bin", "Confirma a integridade antes de reiniciar."),
                    ("R1#", "reload", "Reinicia. Guarde a configuração antes!"),
                ]),
                cli("Recuperar a palavra-passe de um router (com acesso físico)", [
                    ("—", "Ligar à consola e reiniciar o router", ""),
                    ("—", "Enviar Break nos primeiros 60 s (Ctrl+Break no PuTTY)", "Entra em ROMMON."),
                    ("rommon 1 >", "confreg 0x2142", "Arranque a ignorar a startup-config."),
                    ("rommon 2 >", "reset", "Reinicia."),
                    ("Router#", "copy startup-config running-config", "Recupera a configuração antiga para a RAM (responda no ao setup antes)."),
                    ("R1(config)#", "enable secret NovaPass#1", "Define nova palavra-passe."),
                    ("R1(config)#", "config-register 0x2102", "Repõe o arranque normal!"),
                    ("R1#", "copy running-config startup-config", "Guardar."),
                ], "Em switches Catalyst o processo é diferente (botão MODE ao ligar)."),
                sim_real(
                    ["Equipamentos ligam em segundos; reload é quase instantâneo.",
                     "Pode apagar tudo sem riscos e recomeçar o laboratório.",
                     "Não existe ROMMON real nem imagens IOS para atualizar (na maioria dos casos)."],
                    ["Um reload de um switch empresarial pode demorar vários minutos — planeie janelas de manutenção.",
                     "Uma imagem IOS errada ou corrompida pode deixar o equipamento em ROMMON: tenha sempre um plano de reversão.",
                     "Licenças (ex.: DNA/Network Advantage) podem limitar funcionalidades.",
                     "Documente tudo, use controlo de alterações e guarde backups fora do equipamento.",
                     "Equipamentos usados podem vir com configuração antiga: <code>write erase</code> + <code>delete vlan.dat</code> (switch) + <code>reload</code>."]),
                dica("Para o exame, o Packet Tracer chega para quase tudo. Para a vida real, ganhe experiência física com 2 switches e 1 router usados — é barato e ensina muito."),
                video("Packet Tracer vs GNS3 vs equipamento real", "Packet Tracer vs GNS3 vs EVE-NG vs CML lab CCNA"),
            ],
            [
                mc("Onde fica guardado normalmente o ficheiro do IOS?", ["NVRAM", "RAM", "Flash", "ROM"], 2, "A imagem IOS está na flash."),
                mc("Que valor do configuration register ignora a startup-config?", ["0x2102", "0x2142", "0x2100", "0x0000"], 1, "0x2142 é usado na recuperação de palavra-passe."),
                cmd("Que comando mostra a versão do IOS, uptime e o configuration register?", ["show version", "sh ver", "sh version", "show ver"], "show version."),
                vf("O Packet Tracer usa as imagens IOS reais da Cisco.", False, "É um simulador: o IOS é reproduzido e tem comandos limitados. O CML usa imagens reais."),
                mc("Para limpar a configuração de um switch usado deve…", ["Só reload", "write erase, delete vlan.dat e reload", "copy run start", "no shutdown"], 1, "A base de dados de VLANs fica no vlan.dat, separada da config."),
            ],
            ["cisco_ios", "cisco_pt", "odom1", "lammle"],
            nivel="intermédio",
        ),
    ],
    prova_extra=[
        mc("Um técnico configura 'transport input ssh' mas o SSH não funciona. A causa mais provável é…",
           ["Faltam as chaves RSA", "Falta o comando no shutdown na vty", "O CDP está ativo", "A consola tem palavra-passe"], 0,
           "Sem 'crypto key generate rsa' (e domain-name) o servidor SSH não arranca."),
        mc("Interface up/down numa ligação serial. Suspeita principal?", ["Cabo desligado", "Encapsulamento diferente nas pontas", "Falta no shutdown", "IP duplicado"], 1, "Camada 1 ok, camada 2 falha: HDLC vs PPP, por exemplo."),
        cmd("Escreva o comando para gerar chaves RSA de 2048 bits.", ["crypto key generate rsa modulus 2048", "crypto key generate rsa general-keys modulus 2048"], "crypto key generate rsa modulus 2048."),
    ],
)
