"""Casos reais: desafios com contexto prático, como no dia a dia de um técnico.

Cada caso conta uma situação (cliente, sintomas, rede) e faz perguntas por etapas:
diagnosticar, decidir e configurar. Fica disponível quando o módulo indicado é
desbloqueado.
"""

from .base import cmd, mc, vf


def caso(id, titulo, modulo, local, papel, historia, etapas, desfecho, topo=None, nivel="básico"):
    return {"id": id, "titulo": titulo, "modulo": modulo, "local": local, "papel": papel,
            "historia": historia.strip(), "etapas": etapas, "desfecho": desfecho, "topologia": topo, "nivel": nivel}


CASOS = [
    caso("c01", "Primeiro dia no bastidor", "m1", "Escritório de advogados", "Técnico estagiário",
         """<p>É o seu primeiro dia numa empresa de suporte. O chefe leva-o ao bastidor (rack) de um escritório de advogados e pergunta: <i>“Sabes dizer o que é cada coisa?”</i> Vê uma caixa com 24 portas e muitos cabos azuis, uma caixa com poucas portas ligada à fibra do operador e uma antena no teto do corredor.</p>""",
         [
             mc("A caixa com 24 portas onde ligam os PCs é…", ["Um router", "Um switch", "Um access point", "Um servidor"], 1, "Muitas portas para ligar os equipamentos do local: switch."),
             mc("A caixa ligada à fibra do operador, que dá acesso à Internet, é…", ["Um switch", "Um router", "Um hub", "Uma impressora"], 1, "Liga a rede local à rede do operador: router."),
             mc("A antena no teto do corredor é…", ["Um access point (Wi-Fi)", "Um firewall", "Um switch L3", "Um modem de fax"], 0, "Cria a rede sem fios."),
             mc("Um advogado tem de ligar o portátil numa sala a 130 m do bastidor. O que recomenda?", ["Cabo UTP de 130 m", "Um switch a meio caminho ou fibra", "Cabo de consola", "Nada, chega"], 1, "O UTP só garante 100 m."),
         ],
         "O chefe ficou impressionado. Saber reconhecer os equipamentos é o primeiro passo de qualquer técnico."),

    caso("c02", "A impressora da receção", "m3", "Clínica Boa Saúde", "Técnico de suporte",
         """<p>A rececionista liga: <i>“O computador da receção não imprime nem abre o sistema de marcações. Os outros computadores estão bem.”</i> No PC da receção, o comando <code>ipconfig</code> mostra:</p>
<pre><code>Endereço IPv4 . . . : 169.254.83.12
Máscara de sub-rede : 255.255.0.0
Gateway predefinido :</code></pre>
<p>Os outros PCs têm endereços 192.168.10.x com gateway 192.168.10.1.</p>""",
         [
             mc("O que indica o endereço 169.254.83.12?", ["Um IP público", "O PC não recebeu IP do servidor DHCP (APIPA)", "Um IP de loopback", "Um endereço IPv6"], 1, "169.254.x.x é atribuído pelo próprio PC quando o DHCP não responde."),
             mc("Qual a primeira verificação a fazer?", ["Reinstalar o Windows", "Ver se o cabo de rede está ligado e a luz da porta acesa", "Trocar a impressora", "Desligar o servidor"], 1, "Começar pela camada física: cabo e porta."),
             mc("O cabo estava solto. Depois de o ligar, que comando faz o Windows pedir novo IP?", ["ipconfig /renew", "ping /dhcp", "tracert", "netstat"], 0, "ipconfig /release seguido de ipconfig /renew."),
             vf("Depois de receber 192.168.10.x com gateway 192.168.10.1, o PC deve voltar a imprimir.", True, "Fica na mesma rede que a impressora e o servidor."),
         ],
         "Problema resolvido em 5 minutos: cabo solto → sem DHCP → APIPA. Este padrão repete-se muito no suporte."),

    caso("c03", "A nova sala de informática", "m3", "Escola Secundária", "Técnico da escola",
         """<p>A escola recebeu a rede <code>192.168.20.0/24</code> para a área pedagógica e vai abrir salas novas. A direção pede: <b>Sala A com 50 PCs</b>, <b>Sala B com 25 PCs</b> e <b>uma rede para 10 impressoras e projetores</b>. Cada rede precisa de um endereço para o gateway.</p>""",
         [
             mc("Que prefixo usa para a Sala A (50 PCs + gateway)?", ["/25", "/26", "/27", "/28"], 1, "/26 dá 62 hosts úteis; /27 só 30."),
             mc("Começando em 192.168.20.0, qual é a rede da Sala A?", ["192.168.20.0/26", "192.168.20.64/26", "192.168.20.0/25", "192.168.20.128/26"], 0, "Maior rede primeiro, a partir do início do bloco."),
             mc("Qual a rede seguinte, para a Sala B (25 PCs)?", ["192.168.20.64/27", "192.168.20.64/26", "192.168.20.32/27", "192.168.20.96/28"], 0, "A seguir a .0/26 vem .64; /27 dá 30 hosts."),
             mc("Para as 10 impressoras/projetores, qual a rede mais económica a seguir?", ["192.168.20.96/28", "192.168.20.96/27", "192.168.20.100/28", "192.168.20.128/25"], 0, "/28 = 14 hosts, começa em .96."),
         ],
         "Plano VLSM feito sem desperdiçar endereços e com espaço livre (192.168.20.112 a .255) para crescer.",
         nivel="intermédio"),

    caso("c04", "Internet lenta no escritório de contabilidade", "m4", "Gabinete de contabilidade", "Técnico de redes",
         """<p>Desde que mudaram o switch, o servidor de ficheiros está muito lento. No router/switch, <code>show interfaces g0/1</code> (porta do servidor) mostra milhares de <b>late collisions</b> e <b>CRC</b> a subir. A porta está a <b>100 Mbit/s half-duplex</b>; o servidor está configurado fixo em <b>100 Mbit/s full-duplex</b>.</p>""",
         [
             mc("Qual é o problema mais provável?", ["Falta de memória no servidor", "Duplex mismatch", "Vírus", "DNS errado"], 1, "Um lado half e outro full = colisões tardias."),
             mc("Qual a melhor solução?", ["Pôr os dois lados em auto (ou ambos fixos iguais)", "Trocar o servidor", "Desligar o STP", "Mudar a VLAN"], 0, "As duas pontas devem coincidir; auto/auto é o recomendado."),
             cmd("Que comando de interface põe o duplex em automático?", ["duplex auto"], "duplex auto (e speed auto)."),
             vf("Depois de corrigir, deve limpar os contadores e confirmar que os erros deixaram de subir.", True, "clear counters e observar com show interfaces."),
         ],
         "Com duplex certo, as transferências passaram de 2 MB/s para mais de 11 MB/s."),

    caso("c05", "Loop no armazém", "m5", "Armazém de distribuição", "Técnico de serviço",
         """<p>Às 10h a rede do armazém inteiro parou. Os LEDs de todas as portas piscam ao mesmo tempo e o CPU do switch está a 100%. Descobre-se que um funcionário ligou um pequeno switch de secretária com <b>dois cabos</b> à mesma tomada de parede dupla, ligada a duas portas do switch principal.</p>""",
         [
             mc("O que aconteceu?", ["Um loop de camada 2 com tempestade de broadcast", "Falta de IP", "Ataque de phishing", "Cabo de fibra partido"], 0, "Dois caminhos entre switches sem STP a bloquear = loop."),
             mc("Qual a ação imediata para repor o serviço?", ["Desligar um dos cabos do switch de secretária", "Reiniciar todos os PCs", "Mudar o DNS", "Trocar o router"], 0, "Quebrar o loop fisicamente."),
             mc("Que funcionalidade evita isto no futuro nas portas de utilizador?", ["BPDU Guard (com PortFast)", "NAT", "DHCP", "HSRP"], 0, "Se chegar uma BPDU, a porta vai para err-disabled."),
             cmd("Escreva o comando de interface que ativa o BPDU Guard.", ["spanning-tree bpduguard enable"], "spanning-tree bpduguard enable."),
         ],
         "Rede reposta e protegida: agora, se alguém repetir o erro, só aquela porta é desligada.",
         nivel="intermédio"),

    caso("c06", "Wi-Fi para os hóspedes", "m5", "Hotel Miradouro", "Técnico de redes",
         """<p>O hotel quer oferecer Wi-Fi aos hóspedes, mas os computadores da receção e o sistema de reservas estão na mesma rede que o Wi-Fi atual, com a palavra-passe colada na parede. Pede-se uma solução segura.</p>""",
         [
             mc("Qual o primeiro passo de desenho?", ["Uma VLAN separada para hóspedes", "Desligar o Wi-Fi", "Usar a VLAN 1 para tudo", "Dar IP público a cada hóspede"], 0, "Separar o tráfego de hóspedes do tráfego interno."),
             mc("Que segurança deve ter a rede interna da receção?", ["WEP", "Aberta", "WPA3 (ou WPA2-AES) com palavra-passe forte ou 802.1X", "WPA-TKIP"], 2, "WEP e TKIP estão quebrados."),
             mc("Num hotel com 40 APs, que solução facilita a gestão?", ["Configurar AP a AP", "APs leves geridos por uma WLC ou cloud", "Um hub", "Cabos de consola"], 1, "Gestão centralizada."),
             vf("A porta do switch onde liga um AP leve gerido por WLC normalmente é access.", True, "O tráfego vai no túnel CAPWAP."),
         ],
         "Hóspedes isolados numa VLAN própria, rede interna com WPA3 e gestão central dos APs."),

    caso("c07", "A filial não chega à sede", "m6", "Rede de farmácias", "Técnico de redes",
         """<p>Abriu uma nova farmácia (filial, LAN <code>192.168.2.0/24</code>, router R2). A sede tem a LAN <code>192.168.1.0/24</code> e o router R1. Estão ligados por <code>10.0.12.0/30</code> (R1 = .1, R2 = .2). No R1 foi configurado <code>ip route 192.168.2.0 255.255.255.0 10.0.12.2</code>. Da sede, o ping para a filial falha.</p>""",
         [
             mc("O que falta mais provavelmente?", ["A rota de volta em R2 para 192.168.1.0/24", "Uma VLAN nova", "Um servidor DNS", "Mudar a máscara do /30"], 0, "O pedido chega, mas a resposta não sabe voltar."),
             cmd("Escreva a rota em R2 para a LAN da sede.", ["ip route 192.168.1.0 255.255.255.0 10.0.12.1"], "Next hop = IP de R1 na ligação."),
             mc("Que comando confirma a rota em R2?", ["show ip route", "show vlan", "show mac address-table", "show cdp"], 0, "show ip route (ou show ip route static)."),
             mc("Com 20 filiais a caminho, o que recomenda a médio prazo?", ["Rotas estáticas em todos", "Um protocolo dinâmico como OSPF", "Uma só VLAN", "Desligar a sede"], 1, "Escala melhor e reage a falhas."),
         ],
         "Com a rota de volta, a filial comunica com a sede. Lição: o tráfego tem sempre dois sentidos.",
         nivel="intermédio"),

    caso("c08", "A loja online fora do ar", "m7", "Loja de eletrónica", "Técnico de redes",
         """<p>A loja tem o site num servidor interno (<code>192.168.1.50</code>, porta 443). Mudaram o router e agora os clientes não conseguem abrir o site a partir da Internet, mas dentro da loja funciona. O IP público da loja é <code>203.0.113.10</code>.</p>""",
         [
             mc("O que falta no novo router?", ["NAT estático (port forwarding) para o servidor", "DHCP", "Uma VLAN", "STP"], 0, "Sem tradução, ninguém de fora chega ao IP privado."),
             cmd("Escreva o NAT estático 1:1 do servidor para o IP público.", ["ip nat inside source static 192.168.1.50 203.0.113.10"], "ip nat inside source static <local> <global>."),
             mc("O que mais tem de estar configurado nas interfaces?", ["ip nat inside na LAN e ip nat outside no lado da Internet", "switchport mode trunk", "spanning-tree portfast", "ip helper-address"], 0, "Sem inside/outside o NAT não atua."),
             vf("A firewall também tem de permitir tráfego HTTPS (443) para o servidor.", True, "Tradução e permissão são coisas diferentes."),
         ],
         "Site de volta ao ar. Documentou o NAT para a próxima troca de equipamento.",
         nivel="intermédio"),

    caso("c09", "Hospital: proteger a rede da farmácia", "m8", "Hospital municipal", "Administrador de redes",
         """<p>No hospital, os <b>quiosques públicos</b> da sala de espera (<code>192.168.50.0/24</code>) conseguem aceder ao servidor de stock da farmácia (<code>10.10.5.20</code>). A direção quer bloquear isso, mantendo o acesso dos quiosques à Internet. O router R1 liga os quiosques pela interface G0/1.</p>""",
         [
             mc("Que tipo de ACL e onde, segundo a boa prática?", ["Extended, perto da origem (G0/1 in)", "Standard, perto da origem", "Extended, na consola", "Nenhuma, basta DHCP"], 0, "Extended filtra origem e destino; aplica-se perto da origem."),
             mc("Qual a linha certa para bloquear o servidor?", ["deny ip 192.168.50.0 0.0.0.255 host 10.10.5.20", "deny ip any any", "permit ip 192.168.50.0 0.0.0.255 host 10.10.5.20", "deny tcp host 10.10.5.20 any"], 0, "Origem quiosques, destino servidor."),
             mc("O que tem de vir depois para os quiosques continuarem a navegar?", ["permit ip any any", "Nada", "deny ip any any", "ip nat outside"], 0, "Senão o deny implícito bloqueia tudo."),
             cmd("Aplique a ACL QUIOSQUES na entrada da interface (já dentro de interface g0/1).", ["ip access-group QUIOSQUES in"], "ip access-group QUIOSQUES in."),
         ],
         "Os quiosques continuam a navegar, mas o servidor da farmácia ficou fora do alcance do público.",
         nivel="avançado"),

    caso("c10", "Os PCs recebem IP errado", "m8", "Universidade, residência de estudantes", "Técnico de redes",
         """<p>Vários estudantes reclamam: <i>“Tenho Wi-Fi/cabo mas não há Internet.”</i> Os PCs afetados recebem IP <code>192.168.0.x</code> com gateway <code>192.168.0.1</code>, quando a rede correta é <code>10.20.0.0/16</code>. Um estudante ligou o seu router doméstico à tomada do quarto.</p>""",
         [
             mc("O que está a acontecer?", ["Um servidor DHCP não autorizado (rogue)", "Falha de DNS", "Loop STP", "Duplex mismatch"], 0, "O router doméstico está a responder a pedidos DHCP."),
             mc("Que funcionalidade do switch impede isto?", ["DHCP snooping", "PortFast", "CDP", "VTP"], 0, "Só portas confiáveis podem enviar ofertas DHCP."),
             mc("Que portas devem ser 'trusted'?", ["As que levam ao servidor DHCP legítimo (uplinks)", "Todas as portas dos quartos", "Nenhuma", "Só a porta do estudante"], 0, "Uplinks em trust; portas de utilizador untrusted."),
             cmd("Escreva o comando global que ativa o DHCP snooping.", ["ip dhcp snooping"], "ip dhcp snooping (+ ip dhcp snooping vlan X)."),
         ],
         "Com DHCP snooping, o router doméstico deixa de afetar os outros estudantes.",
         nivel="intermédio"),

    caso("c11", "Sexta-feira à noite: 60 switches", "m9", "Operadora regional", "Engenheiro de redes",
         """<p>A empresa mudou de servidor NTP e de servidor Syslog. Há <b>60 switches</b> para atualizar até segunda-feira. O colega sugere fazer à mão; você propõe automatizar com Python.</p>""",
         [
             mc("Que biblioteca Python liga por SSH a equipamentos Cisco e envia comandos?", ["Netmiko", "Pandas", "Pygame", "Flask"], 0, "Netmiko."),
             mc("Que método envia uma lista de comandos de configuração?", ["send_config_set", "send_command", "print", "open"], 0, "send_config_set; send_command é para show."),
             mc("Qual a prática mais segura antes de correr em produção?", ["Testar num laboratório e num switch pouco crítico", "Correr em todos ao mesmo tempo sem teste", "Guardar a palavra-passe no código", "Desligar os logs"], 0, "Testar primeiro, aumentar o alcance aos poucos."),
             vf("O script deve fazer backup da configuração antes de alterar.", True, "Permite voltar atrás se algo correr mal."),
         ],
         "60 switches atualizados em 6 minutos, com backups e um relatório. O fim de semana ficou livre."),
]
