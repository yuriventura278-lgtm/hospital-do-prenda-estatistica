from .base import *

MODULO = modulo(
    id="m8", numero=8, icone="firewall",
    titulo="Fundamentos de Segurança",
    descricao="Ameaças e defesas, AAA, ACLs, segurança de camada 2 e VPNs.",
    dominio="5.0 Security Fundamentals",
    licoes=[
        licao(
            "m8l1", "Conceitos de segurança e AAA", 18,
            ["Definir ameaça, vulnerabilidade, exploit e mitigação",
             "Reconhecer ataques comuns",
             "Explicar AAA, RADIUS, TACACS+ e 802.1X"],
            [
                tabela(["Termo", "Significado"], [
                    ["Vulnerabilidade", "Fraqueza que pode ser explorada"], ["Ameaça", "Perigo potencial que pode explorar a vulnerabilidade"],
                    ["Exploit", "Forma/ferramenta que aproveita a vulnerabilidade"], ["Mitigação", "Medida que reduz o risco"],
                ]),
                tabela(["Ataque", "Descrição"], [
                    ["Phishing / spear phishing / whaling", "E-mails falsos para roubar credenciais; dirigidos a uma pessoa / a executivos"],
                    ["DoS / DDoS", "Esgotar recursos para deixar o serviço indisponível"],
                    ["Spoofing", "Falsificar IP, MAC ou identidade"],
                    ["Man-in-the-middle", "Intercetar a comunicação (ex.: ARP spoofing)"],
                    ["Reconhecimento", "Recolher informação (scans, whois)"],
                    ["Malware", "Vírus, worms, trojans, ransomware"],
                    ["Engenharia social", "Manipular pessoas (tailgating, pretexting)"],
                    ["Ataques a palavras-passe", "Dicionário, força bruta"],
                ], "Ameaças comuns"),
                texto("Defesas", """
<ul>
<li><b>Programa de segurança</b>: consciencialização dos utilizadores, formação e controlo de acesso físico.</li>
<li><b>Palavras-passe</b>: preferir frases longas, MFA (algo que sabe + algo que tem + algo que é), certificados.</li>
<li><b>AAA</b>: <b>Autenticação</b> (quem é), <b>Autorização</b> (o que pode fazer), <b>Accounting</b> (registo do que fez).</li>
</ul>"""),
                tabela(["", "RADIUS", "TACACS+"], [
                    ["Transporte", "UDP 1812/1813", "TCP 49"], ["Cifra", "Só a palavra-passe", "Todo o payload"],
                    ["Separa autenticação e autorização", "Não", "Sim"], ["Uso típico", "Acesso à rede (802.1X, VPN, Wi-Fi)", "Administração de equipamentos"],
                ]),
                cli("AAA com servidor e fallback local", [
                    ("R1(config)#", "aaa new-model", "Ativa AAA (altera o login das linhas!)."),
                    ("R1(config)#", "tacacs server ISE", ""),
                    ("R1(config-server-tacacs)#", "address ipv4 10.0.0.20", ""),
                    ("R1(config-server-tacacs)#", "key Chave#Partilhada", ""),
                    ("R1(config)#", "aaa authentication login default group tacacs+ local", "Tenta TACACS+; se não responder, usa utilizadores locais."),
                ]),
                topologia(
                    [("pc", "portatil", 12, 50, "Suplicante"), ("sw", "switch", 50, 50, "Autenticador"), ("ise", "servidor", 88, 50, "Servidor RADIUS")],
                    [("pc", "sw", "EAPoL"), ("sw", "ise", "RADIUS")],
                    "802.1X: o switch só abre a porta depois de o servidor autenticar o utilizador."),
                video("AAA RADIUS TACACS+", "AAA RADIUS vs TACACS+ 802.1X CCNA"),
            ],
            [
                mc("Que protocolo AAA usa TCP 49 e cifra todo o pacote?", ["RADIUS", "TACACS+", "Kerberos", "LDAP"], 1, "TACACS+."),
                mc("No 802.1X, o switch tem o papel de…", ["Suplicante", "Autenticador", "Servidor de autenticação", "NMS"], 1, "Autenticador."),
                mc("Um e-mail falso dirigido especificamente ao diretor financeiro é…", ["Vishing", "Whaling", "Smishing", "Spam"], 1, "Whaling = phishing dirigido a executivos."),
                vf("Accounting regista o que o utilizador fez.", True, "É o terceiro A."),
            ],
            ["rfc2865", "rfc8907", "ieee8021x", "nist", "odom2"],
        ),

        licao(
            "m8l2", "Listas de controlo de acesso (ACL)", 28,
            ["Escrever ACLs standard e extended (numeradas e nomeadas)",
             "Calcular wildcards e escolher onde aplicar",
             "Lembrar o deny implícito"],
            [
                texto("Como uma ACL é lida", """
<ul>
<li>As linhas (ACEs) são verificadas <b>de cima para baixo</b>; a primeira que coincide decide e o resto é ignorado.</li>
<li>No fim existe sempre um <b>deny any implícito</b> (invisível).</li>
<li>Aplica-se <b>uma ACL por interface, por sentido (in/out), por protocolo</b>.</li>
</ul>"""),
                tabela(["Tipo", "Números", "Filtra por", "Onde aplicar"], [
                    ["Standard", "1–99, 1300–1999", "Só IP de origem", "O mais perto possível do destino"],
                    ["Extended", "100–199, 2000–2699", "Protocolo, origem, destino, portas", "O mais perto possível da origem"],
                ]),
                exemplo("Wildcards úteis", """
<ul>
<li><code>host 10.1.1.5</code> = <code>10.1.1.5 0.0.0.0</code></li>
<li><code>any</code> = <code>0.0.0.0 255.255.255.255</code></li>
<li>Rede /24: <code>192.168.1.0 0.0.0.255</code>; rede /27: <code>192.168.1.32 0.0.0.31</code></li>
</ul>"""),
                topologia(
                    [("conv", "switch", 10, 25, "Convidados 192.168.50.0/24"), ("users", "switch", 10, 80, "Utilizadores 192.168.10.0/24"), ("r1", "router", 50, 50, "R1"), ("srv", "servidor", 90, 50, "Servidores 10.0.0.0/24")],
                    [("conv", "r1", "g0/1"), ("users", "r1", "g0/0"), ("r1", "srv", "g0/2")],
                    "Objetivo: convidados não acedem aos servidores; utilizadores só por HTTPS e SSH ao 10.0.0.10."),
                cli("ACL standard numerada", [
                    ("R1(config)#", "access-list 10 deny 192.168.50.0 0.0.0.255", "Bloqueia convidados."),
                    ("R1(config)#", "access-list 10 permit any", "Sem isto, tudo seria bloqueado (deny implícito)!"),
                    ("R1(config)#", "interface g0/2", "Perto do destino (servidores)."),
                    ("R1(config-if)#", "ip access-group 10 out", ""),
                ]),
                cli("ACL extended nomeada", [
                    ("R1(config)#", "ip access-list extended UTIL-SERVIDORES", ""),
                    ("R1(config-ext-nacl)#", "permit tcp 192.168.10.0 0.0.0.255 host 10.0.0.10 eq 443", "HTTPS."),
                    ("R1(config-ext-nacl)#", "permit tcp 192.168.10.0 0.0.0.255 host 10.0.0.10 eq 22", "SSH."),
                    ("R1(config-ext-nacl)#", "deny ip 192.168.10.0 0.0.0.255 10.0.0.0 0.0.0.255", "Resto para servidores bloqueado."),
                    ("R1(config-ext-nacl)#", "permit ip any any", "Internet e outras redes permitidas."),
                    ("R1(config)#", "interface g0/0", "Perto da origem."),
                    ("R1(config-if)#", "ip access-group UTIL-SERVIDORES in", ""),
                    ("R1(config)#", "ip access-list extended UTIL-SERVIDORES", "Editar uma linha: as nomeadas têm números de sequência."),
                    ("R1(config-ext-nacl)#", "15 permit icmp 192.168.10.0 0.0.0.255 host 10.0.0.10 echo", "Insere entre a 10 e a 20."),
                    ("R1#", "show access-lists", "Linhas e contadores de matches."),
                ]),
                cli("Proteger o acesso remoto com ACL", [
                    ("R1(config)#", "access-list 5 permit 192.168.99.0 0.0.0.255", "Só a rede de gestão."),
                    ("R1(config)#", "line vty 0 4", ""),
                    ("R1(config-line)#", "access-class 5 in", "Em linhas usa-se access-class, não access-group."),
                ]),
                sim_real(
                    ["No Packet Tracer pode testar com o modo Simulation e ver onde o pacote é descartado.",
                     "Errar não tem consequências: apague e repita."],
                    ["Aplicar uma ACL errada via SSH pode cortar o seu próprio acesso! Use 'reload in 10' antes de alterar (e 'reload cancel' se tudo correr bem).",
                     "Comente as ACLs com 'remark' para quem vier depois.",
                     "Confirme os contadores (show access-lists) para ver se o tráfego bate na linha esperada."]),
                video("ACLs Cisco", "ACL standard extended Cisco configuração wildcard CCNA"),
            ],
            [
                mc("Onde deve aplicar uma ACL standard?", ["Perto da origem", "Perto do destino", "Em todas as interfaces", "Na linha de consola"], 1, "Filtra só pela origem; perto da origem bloquearia demasiado."),
                mc("O que acontece a um pacote que não coincide com nenhuma linha?", ["É permitido", "É descartado (deny implícito)", "É enviado ao CPU", "É registado e permitido"], 1, "Deny any implícito."),
                mc("Qual o wildcard para 172.16.0.0/20?", ["0.0.15.255", "0.0.16.255", "255.255.240.0", "0.0.0.15"], 0, "255.255.240.0 invertido = 0.0.15.255."),
                cmd("Que comando aplica a ACL 101 na entrada de uma interface?", ["ip access-group 101 in"], "ip access-group 101 in."),
                vf("Pode aplicar duas ACLs IPv4 na mesma interface e no mesmo sentido.", False, "Uma por interface, por sentido, por protocolo."),
                mc("Que número identifica uma ACL extended?", ["10", "99", "150", "1350"], 2, "100–199 e 2000–2699."),
            ],
            ["odom2", "netacad_ensa", "cisco_ios"],
            nivel="avançado",
        ),

        licao(
            "m8l3", "Segurança de camada 2", 20,
            ["Configurar port security",
             "Ativar DHCP snooping e Dynamic ARP Inspection",
             "Endurecer portas não usadas"],
            [
                cli("Port security", [
                    ("SW1(config)#", "interface fa0/5", ""),
                    ("SW1(config-if)#", "switchport mode access", "Port security exige porta access ou trunk estático."),
                    ("SW1(config-if)#", "switchport port-security", "Ativa (padrão: 1 MAC, violation shutdown)."),
                    ("SW1(config-if)#", "switchport port-security maximum 2", "PC + telefone IP."),
                    ("SW1(config-if)#", "switchport port-security mac-address sticky", "Aprende e grava os MACs na running-config."),
                    ("SW1(config-if)#", "switchport port-security violation restrict", "Descarta e regista, sem desligar."),
                    ("SW1#", "show port-security interface fa0/5", ""),
                ]),
                tabela(["Modo de violação", "Descarta", "Log/contador", "Desliga a porta"], [
                    ["protect", "Sim", "Não", "Não"], ["restrict", "Sim", "Sim", "Não"], ["shutdown (padrão)", "Sim", "Sim", "Sim (err-disabled)"],
                ]),
                topologia(
                    [("srv", "servidor", 50, 10, "DHCP legítimo"), ("sw", "switch", 50, 50, "SW1"), ("pc", "pc", 15, 90, "PC"), ("mau", "portatil", 85, 90, "DHCP falso")],
                    [("srv", "sw", "trusted"), ("sw", "pc", "untrusted"), ("sw", "mau", "untrusted")],
                    "DHCP snooping só aceita ofertas DHCP de portas confiáveis."),
                cli("DHCP snooping e DAI", [
                    ("SW1(config)#", "ip dhcp snooping", "Ativa globalmente."),
                    ("SW1(config)#", "ip dhcp snooping vlan 10,20", "Nas VLANs."),
                    ("SW1(config)#", "no ip dhcp snooping information option", "Desliga a opção 82 se o servidor não a suportar."),
                    ("SW1(config)#", "interface g0/1", "Uplink para o servidor/router."),
                    ("SW1(config-if)#", "ip dhcp snooping trust", ""),
                    ("SW1(config-if)#", "interface range fa0/1 - 24", ""),
                    ("SW1(config-if-range)#", "ip dhcp snooping limit rate 10", "Limita pedidos (evita esgotar o pool)."),
                    ("SW1(config)#", "ip arp inspection vlan 10,20", "DAI: valida ARP contra a tabela de snooping."),
                    ("SW1(config)#", "interface g0/1", ""),
                    ("SW1(config-if)#", "ip arp inspection trust", ""),
                    ("SW1#", "show ip dhcp snooping binding", "Tabela IP–MAC–porta–VLAN."),
                ]),
                cli("Boas práticas em portas não usadas", [
                    ("SW1(config)#", "interface range fa0/20 - 24", ""),
                    ("SW1(config-if-range)#", "switchport mode access", "Nunca deixar em dynamic."),
                    ("SW1(config-if-range)#", "switchport access vlan 999", "VLAN “parque” sem rota."),
                    ("SW1(config-if-range)#", "shutdown", ""),
                ]),
                sim_real(
                    ["O Packet Tracer suporta port security e DHCP snooping; o DAI tem suporte parcial.",
                     "Pode simular um servidor DHCP falso com outro servidor no separador Services."],
                    ["Com DHCP snooping ativo e o uplink esquecido como untrusted, NINGUÉM recebe IP — configure o trust primeiro.",
                     "Port security 'sticky' + mudança de secretária de um colaborador = porta desligada. Documente o processo.",
                     "Em redes grandes prefira 802.1X/ISE a manter listas de MACs à mão."]),
                video("Port security e DHCP snooping", "port security DHCP snooping dynamic ARP inspection CCNA"),
            ],
            [
                mc("Qual o modo de violação padrão do port security?", ["protect", "restrict", "shutdown", "drop"], 2, "shutdown → err-disabled."),
                mc("No DHCP snooping, as portas para o servidor DHCP legítimo devem ser…", ["untrusted", "trusted", "err-disabled", "trunk obrigatoriamente"], 1, "trusted."),
                mc("O DAI protege contra…", ["Servidores DHCP falsos", "ARP spoofing", "Loops STP", "VLAN hopping"], 1, "Valida mensagens ARP."),
                cmd("Que comando faz o switch aprender e gravar os MACs na porta?", ["switchport port-security mac-address sticky"], "switchport port-security mac-address sticky."),
                vf("No modo restrict a porta fica em err-disabled.", False, "restrict descarta e regista, mas a porta continua ativa."),
            ],
            ["ieee8021x", "odom2", "netacad_srwe"],
            nivel="intermédio",
        ),

        licao(
            "m8l4", "VPNs e IPsec", 15,
            ["Distinguir VPN site-to-site e acesso remoto",
             "Conhecer os componentes do IPsec"],
            [
                topologia(
                    [("sede", "router", 15, 50, "Sede"), ("net", "nuvem", 50, 50, "Internet"), ("fil", "router", 85, 50, "Filial"), ("rem", "portatil", 50, 90, "Teletrabalho")],
                    [("sede", "net", "túnel IPsec"), ("net", "fil", "túnel IPsec"), ("rem", "net", "VPN SSL/TLS")],
                    "Site-to-site liga redes; acesso remoto liga um utilizador."),
                tabela(["", "Site-to-site", "Acesso remoto"], [
                    ["Liga", "Rede ↔ rede", "Utilizador ↔ rede"], ["Cliente", "Nenhum nos PCs (routers/firewalls fazem tudo)", "Software (ex.: Cisco Secure Client) ou browser"],
                    ["Tecnologia", "IPsec (IKEv2), GRE sobre IPsec, DMVPN", "TLS/SSL ou IPsec"], ["Sempre ligado", "Sim", "Quando o utilizador liga"],
                ]),
                texto("IPsec em resumo", """
<ul>
<li><b>Confidencialidade</b>: cifra (AES).</li>
<li><b>Integridade</b>: hash (SHA-2).</li>
<li><b>Autenticação</b>: PSK ou certificados.</li>
<li><b>Troca de chaves</b>: Diffie-Hellman, via <b>IKE</b> (UDP 500; 4500 com NAT-T).</li>
<li>Protocolos: <b>ESP</b> (cifra + integridade, o habitual) e <b>AH</b> (só integridade, não funciona com NAT).</li>
<li>Modos: <b>túnel</b> (novo cabeçalho IP — VPN site-to-site) e <b>transporte</b>.</li>
</ul>
<p><b>GRE</b> sozinho não cifra, mas transporta multicast (útil para OSPF) — por isso usa-se GRE sobre IPsec.</p>"""),
                dica("Para o CCNA basta perceber os conceitos de VPN; a configuração completa de IPsec é tema do CCNP Security."),
                video("VPN IPsec explicada", "VPN IPsec site to site remote access CCNA explicado"),
            ],
            [
                mc("Que protocolo IPsec cifra os dados?", ["AH", "ESP", "GRE", "IKE"], 1, "ESP. O AH só autentica."),
                mc("Que tipo de VPN liga a sede à filial de forma permanente?", ["Acesso remoto", "Site-to-site", "Clientless", "SSL web"], 1, "Site-to-site."),
                vf("Um túnel GRE sem IPsec cifra o tráfego.", False, "GRE só encapsula."),
                mc("IKE usa a porta…", ["TCP 443", "UDP 500", "TCP 49", "UDP 69"], 1, "UDP 500 (e 4500 com NAT-T)."),
            ],
            ["rfc4301", "odom2", "netacad_ensa"],
        ),
    ],
    prova_extra=[
        mc("Uma ACL extended 'deny tcp any host 10.0.0.10 eq 80' sem mais linhas é aplicada. O que acontece ao resto do tráfego?", ["É permitido", "É bloqueado pelo deny implícito", "Só ICMP passa", "Depende do sentido"], 1, "Faltou 'permit ip any any'."),
        mc("Qual ferramenta impede que um utilizador ligue um router doméstico que distribua IPs na rede?", ["Port security", "DHCP snooping", "BPDU guard", "CDP"], 1, "Bloqueia DHCP Offers de portas untrusted."),
        cmd("Que comando de linha aplica a ACL 5 ao acesso vty?", ["access-class 5 in"], "access-class 5 in."),
    ],
)
