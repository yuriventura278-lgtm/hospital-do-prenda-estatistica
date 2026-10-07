from .base import *

MODULO = modulo(
    id="m9", numero=9, icone="codigo",
    titulo="Automação e Programabilidade",
    descricao="SDN, controladores, APIs REST, JSON, Python com Netmiko, Ansible e IA nas operações de rede.",
    dominio="6.0 Automation and Programmability",
    licoes=[
        licao(
            "m9l1", "SDN e controladores", 15,
            ["Separar plano de controlo, de dados e de gestão",
             "Explicar APIs northbound e southbound",
             "Conhecer Catalyst Center e SD-Access"],
            [
                figura("sdn", "Arquitetura SDN: aplicações por cima (northbound API), controlador ao centro, equipamentos por baixo (southbound API)."),
                tabela(["Plano", "Função", "Exemplos"], [
                    ["Dados (data/forwarding)", "Encaminhar tramas e pacotes", "Comutação, NAT, ACLs a filtrar"],
                    ["Controlo", "Decidir como encaminhar", "OSPF, STP, ARP, tabela MAC"],
                    ["Gestão", "Administrar o equipamento", "SSH, SNMP, Syslog"],
                ], "Os três planos"),
                texto("Tradicional × controlador", """
<p>Na rede tradicional, cada equipamento tem o seu plano de controlo e é configurado um a um (CLI). Na <b>SDN</b> o <b>controlador</b> centraliza parte do controlo e a configuração: define-se a <b>intenção</b> (“convidados não acedem a servidores”) e ele aplica-a em todos os equipamentos.</p>
<ul>
<li><b>Northbound API</b>: entre aplicações/scripts e o controlador — normalmente <b>REST</b> com JSON.</li>
<li><b>Southbound API</b>: entre controlador e equipamentos — NETCONF, RESTCONF, OpenFlow, SSH/CLI, SNMP.</li>
<li><b>Underlay</b>: a rede física. <b>Overlay</b>: túneis lógicos por cima (VXLAN no SD-Access). <b>Fabric</b>: o conjunto.</li>
</ul>
<p>Na Cisco: <b>Catalyst Center</b> (antigo DNA Center) para campus com <b>SD-Access</b>, e <b>SD-WAN</b> (Catalyst SD-WAN) para WAN.</p>"""),
                tabela(["", "Gestão tradicional", "Catalyst Center"], [
                    ["Configuração", "Equipamento a equipamento, CLI", "Central, por políticas e modelos"],
                    ["Visibilidade", "show/SNMP isolados", "Telemetria e saúde de toda a rede"],
                    ["Alterações", "Manuais, propensas a erro", "Automatizadas e consistentes"],
                    ["Resolução de problemas", "Reativa", "Assistida (garantia/analytics)"],
                ]),
            ],
            [
                mc("OSPF pertence a que plano?", ["Dados", "Controlo", "Gestão", "Aplicação"], 1, "Protocolos de encaminhamento decidem o caminho: controlo."),
                mc("A API entre um script Python e o controlador é…", ["Southbound", "Northbound", "Eastbound", "Underlay"], 1, "Northbound."),
                vf("SSH para gerir um router faz parte do plano de gestão.", True, "Gestão."),
                mc("Que tecnologia de overlay usa o SD-Access?", ["GRE", "VXLAN", "MPLS", "PPP"], 1, "VXLAN (com LISP no plano de controlo)."),
            ],
            ["odom2", "edelman", "cisco_devnet"],
        ),

        licao(
            "m9l2", "APIs REST e JSON", 18,
            ["Usar verbos HTTP e códigos de resposta",
             "Ler e escrever JSON",
             "Fazer um pedido REST em Python"],
            [
                tabela(["Verbo HTTP", "CRUD", "Exemplo"], [
                    ["GET", "Read", "Listar equipamentos"], ["POST", "Create", "Criar uma VLAN"],
                    ["PUT / PATCH", "Update", "Substituir / alterar parte"], ["DELETE", "Delete", "Apagar"],
                ]),
                tabela(["Código", "Significado"], [
                    ["200 OK", "Sucesso"], ["201 Created", "Recurso criado"], ["204 No Content", "Sucesso sem corpo"],
                    ["400 Bad Request", "Pedido mal formado"], ["401 Unauthorized", "Falta autenticação"], ["403 Forbidden", "Sem permissão"],
                    ["404 Not Found", "Recurso não existe"], ["500 Internal Server Error", "Erro no servidor"],
                ], "Códigos HTTP"),
                exemplo("JSON", """
<pre><code>{
  "hostname": "R1",
  "interfaces": [
    {"nome": "GigabitEthernet0/0", "ip": "192.168.1.1", "ativa": true},
    {"nome": "GigabitEthernet0/1", "ip": null, "ativa": false}
  ],
  "ospf": {"processo": 1, "area": 0}
}</code></pre>
<p>Tipos: <b>objeto</b> <code>{}</code> com pares chave:valor, <b>array</b> <code>[]</code>, string entre aspas duplas, número, <code>true</code>/<code>false</code> e <code>null</code>.</p>"""),
                exemplo("Pedido REST em Python (requests)", """
<pre><code>import requests

url = "https://controlador.exemplo/api/v1/network-device"
cabecalhos = {"X-Auth-Token": TOKEN, "Accept": "application/json"}

resposta = requests.get(url, headers=cabecalhos, timeout=10)
resposta.raise_for_status()          # erro se não for 2xx

for equipamento in resposta.json()["response"]:
    print(equipamento["hostname"], equipamento["managementIpAddress"])</code></pre>"""),
                texto("Características REST", """
<ul>
<li><b>Cliente-servidor</b>, <b>sem estado</b> (cada pedido traz tudo o que é preciso, incluindo o token), cacheável, interface uniforme baseada em URIs.</li>
<li>Autenticação comum: Basic, tokens (Bearer), chaves de API, OAuth.</li>
</ul>"""),
            ],
            [
                mc("Que verbo HTTP corresponde a 'Create'?", ["GET", "POST", "PUT", "DELETE"], 1, "POST cria."),
                mc("Que código indica falta de autenticação?", ["200", "401", "404", "500"], 1, "401 Unauthorized."),
                mc("Qual destes é JSON válido?", ["{'a': 1}", "{\"a\": 1}", "{a = 1}", "<a>1</a>"], 1, "Chaves e strings sempre com aspas duplas."),
                vf("As APIs REST são sem estado (stateless).", True, "O servidor não guarda contexto entre pedidos."),
            ],
            ["rfc8259", "edelman", "cisco_devnet", "odom2"],
            nivel="intermédio",
        ),

        licao(
            "m9l3", "Python, Ansible, Terraform e IA", 22,
            ["Automatizar configurações com Python e Netmiko",
             "Comparar Ansible, Terraform, Puppet e Chef",
             "Conhecer NETCONF/RESTCONF e YANG",
             "Perceber o papel da IA nas operações de rede"],
            [
                exemplo("Backup de vários routers com Netmiko", """
<pre><code>from netmiko import ConnectHandler
from datetime import date

routers = ["10.0.0.1", "10.0.0.2", "10.0.0.3"]

for ip in routers:
    equipamento = {
        "device_type": "cisco_ios",
        "host": ip,
        "username": "admin",
        "password": SENHA,          # leia de variável de ambiente, nunca no código
    }
    with ConnectHandler(**equipamento) as ligacao:
        config = ligacao.send_command("show running-config")
        with open(f"backup_{ip}_{date.today()}.txt", "w") as f:
            f.write(config)
    print(f"{ip}: backup feito")</code></pre>"""),
                exemplo("Criar VLANs em todos os switches", """
<pre><code>vlans = {10: "VENDAS", 20: "TI", 30: "VOZ"}
comandos = []
for numero, nome in vlans.items():
    comandos += [f"vlan {numero}", f"name {nome}"]

with ConnectHandler(**switch) as ligacao:
    print(ligacao.send_config_set(comandos))
    ligacao.save_config()</code></pre>"""),
                tabela(["Ferramenta", "Modelo", "Agente", "Linguagem"], [
                    ["Ansible", "Push", "Sem agente (SSH/NETCONF)", "YAML (playbooks)"],
                    ["Terraform", "Declarativo (infra como código)", "Sem agente (APIs)", "HCL"],
                    ["Puppet", "Pull", "Com agente", "Manifests (DSL)"],
                    ["Chef", "Pull", "Com agente", "Recipes/Cookbooks (Ruby)"],
                ], "Gestão de configuração"),
                exemplo("Playbook Ansible", """
<pre><code>- name: Configurar NTP nos routers
  hosts: routers
  gather_facts: no
  tasks:
    - name: Servidor NTP
      cisco.ios.ios_config:
        lines:
          - ntp server 10.0.0.100</code></pre>"""),
                texto("Modelos de dados", """
<p><b>YANG</b> é a linguagem que descreve <i>o que</i> se pode configurar num equipamento (modelo). <b>NETCONF</b> (SSH, porta 830, XML) e <b>RESTCONF</b> (HTTPS, JSON ou XML) são os protocolos que leem/escrevem dados segundo esses modelos — mais fiáveis do que analisar texto da CLI.</p>"""),
                texto("IA e machine learning nas operações de rede", """
<p>O tópico 6.x do exame v1.1 inclui IA: <b>IA generativa</b> (assistentes que explicam saídas e geram configurações — revê sempre antes de aplicar!), <b>IA preditiva</b> e <b>machine learning</b> (deteção de anomalias, previsão de falhas e de capacidade a partir da telemetria).</p>"""),
                sim_real(
                    ["O Packet Tracer tem um modo de programação Python limitado e suporte a algumas APIs do controlador simulado.",
                     "Use os sandboxes gratuitos do Cisco DevNet para experimentar APIs reais."],
                    ["Teste sempre os scripts primeiro num laboratório (CML/EVE-NG) e depois num equipamento pouco crítico.",
                     "Guarde credenciais num cofre/variáveis de ambiente, nunca no repositório.",
                     "Use controlo de versões (Git) para scripts, playbooks e backups de configuração."]),
            ],
            [
                mc("Qual destas ferramentas não precisa de agente nos equipamentos?", ["Puppet", "Chef", "Ansible", "Todas precisam"], 2, "Ansible usa SSH/APIs."),
                mc("Em que formato se escrevem os playbooks Ansible?", ["JSON", "YAML", "XML", "Ruby"], 1, "YAML."),
                mc("Que porta usa o NETCONF sobre SSH?", ["22", "443", "830", "8080"], 2, "830."),
                vf("YANG é um protocolo de transporte como o HTTP.", False, "YANG é uma linguagem de modelação de dados."),
                mc("No Netmiko, que método envia uma lista de comandos de configuração?", ["send_command", "send_config_set", "push_config", "configure"], 1, "send_config_set."),
            ],
            ["netmiko", "ansible", "rfc6241", "rfc8040", "edelman"],
            nivel="intermédio",
        ),
    ],
    prova_extra=[
        mc("Um script recebe 404 ao chamar a API. Significa…", ["Sem autenticação", "Recurso/URL inexistente", "Erro do servidor", "Sucesso sem conteúdo"], 1, "404 Not Found."),
        mc("Qual protocolo southbound usa HTTPS e JSON?", ["NETCONF", "RESTCONF", "OpenFlow", "SNMP"], 1, "RESTCONF."),
        vf("Num controlador SDN, a northbound API normalmente é REST.", True, "Aplicações falam com o controlador por REST."),
    ],
)
