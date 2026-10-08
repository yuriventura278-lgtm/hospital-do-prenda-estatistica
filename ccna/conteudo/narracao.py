"""Guião das vídeo-aulas.

Para cada lição gera a sequência de cenas que o leitor de vídeo da app mostra e
narra. O guião cobre TODOS os blocos da lição (nada fica de fora) e cada fala tem
duas versões:

* ``t`` — o texto mostrado na legenda, com a grafia correta;
* ``f`` — o texto falado, preparado para a voz pronunciar bem: siglas soletradas
  (TCP → “T C P”), endereços IP lidos por partes, termos ingleses escritos como se
  dizem (router → “ráuter”), unidades por extenso (Mbit/s → “megabits por segundo”).

Para corrigir a pronúncia de uma palavra, acrescente-a a ``PALAVRAS`` (texto) ou
``COMANDOS`` (comandos Cisco) e corra ``python build.py``.
"""

from __future__ import annotations

import html as _html
import re

# ---------------------------------------------------------------------------
# Dicionários de pronúncia
# ---------------------------------------------------------------------------

# Siglas que se dizem como palavra (não se soletram)
SIGLAS_PALAVRA = {
    "LAN": "lan", "LANs": "lans", "WAN": "uan", "WANs": "uans", "WLAN": "uê lan", "VLAN": "vê lan", "VLANs": "vê lans",
    "NAT": "nat", "PAT": "pat", "MAC": "mac", "RAM": "ram", "ROM": "rom", "NVRAM": "ene vê ram", "CAPWAP": "cápuap",
    "ENIAC": "éniac", "ARPANET": "árpanet", "NSFNET": "éne ésse éfe net", "CERN": "cérne", "IANA": "iána", "AFRINIC": "áfrinic",
    "YANG": "iéng", "JSON": "djêisson", "REST": "rést", "CRUD": "crâd", "SaaS": "sás", "PaaS": "pás", "IaaS": "i á á ésse",
    "VoIP": "vóip", "TIC": "tic", "CIDR": "sáider", "DORA": "dóra", "ASCII": "ásqui", "WEP": "uép", "SLAAC": "slác",
    "NIC": "nic", "SOHO": "sôu rôu", "SNMPv3": "ésse ene ême pê vê três", "IPv4": "i pê vê quatro", "IPv6": "i pê vê seis",
    "ICMPv6": "i cê ême pê vê seis", "DHCPv6": "dê agá cê pê vê seis", "HTTPS": "agá tê tê pê ésse", "MIB": "mib",
    "OID": "ó i dê", "NASA": "násá", "IBM": "i bê ême", "CRC": "cê érre cê", "PoE": "pê ó i", "IOS": "ai ó ésse",
    "iOS": "ai ó ésse", "IOS-XE": "ai ó ésse éks i", "macOS": "mac ó ésse", "Wi-Fi": "uái fái", "WiFi": "uái fái",
    "AAA": "á á á", "MOTD": "ême ó tê dê", "DevNet": "dév net", "NetAcad": "net ácad", "TACACS+": "tácacs mais",
    "802.1X": "oito zero dois ponto um xis", "NGFW": "ene guê éfe dâblio", "QoS": "kiú ó ésse", "GUI": "guê u i",
}

# Palavras (sobretudo inglesas) no texto corrido
PALAVRAS = {
    "router": "ráuter", "routers": "ráuters", "switch": "suítch", "switches": "suítches", "firewall": "fáiruól",
    "firewalls": "fáiruóls", "hub": "râb", "hubs": "râbs", "host": "rôst", "hosts": "rôsts", "gateway": "guêituei",
    "software": "sóftuér", "hardware": "rárduér", "firmware": "fârmuér", "driver": "dráiver", "drivers": "dráivers",
    "browser": "bráuzer", "e-mail": "imêil", "email": "imêil", "online": "onláine", "site": "sáite", "sites": "sáites",
    "web": "uéb", "bluetooth": "blutufe", "smartphone": "esmártfone", "smartphones": "esmártfones", "cloud": "cláud",
    "backup": "bécâp", "backups": "bécâps", "login": "lóguin", "password": "pássuord", "ethernet": "íternet",
    "trunk": "trânk", "trunks": "trânks", "access": "ácsses", "point": "póint", "points": "póints", "rack": "réque",
    "packet": "péquet", "tracer": "treicer", "catalyst": "cátalist", "wireshark": "uáiarchárk", "netmiko": "netmíco",
    "ansible": "ânsibol", "terraform": "térraform", "puppet": "pâpet", "chef": "chéf", "python": "páiton",
    "linux": "línux", "windows": "uíndous", "android": "ândróid", "putty": "pâti", "spine": "spáine", "leaf": "líf",
    "core": "cór", "sneakernet": "snícker net", "helpdesk": "rélp désk", "phishing": "fíxing", "smishing": "smíxing",
    "vishing": "víxing", "whaling": "uêiling", "ransomware": "rânsomuér", "malware": "málduér", "spoofing": "spúfing",
    "overlay": "ouverlêi", "underlay": "ânderlêi", "fabric": "fébric", "northbound": "nórt báund", "southbound": "sáut báund",
    "playbook": "plêibúc", "playbooks": "plêibúcs", "script": "scrípte", "scripts": "scríptes", "token": "tôuken",
    "tokens": "tôukens", "frame": "frêime", "jitter": "djíter", "policing": "polícing", "shaping": "chêiping",
    "flooding": "flâding", "root": "rút", "bridge": "brídj", "edge": "édj", "full": "fúl", "half": "ráf",
    "duplex": "dúplex", "mismatch": "mismétch", "hello": "rélou", "gigabit": "guígabit", "gigabitethernet": "guígabit íternet",
    "fastethernet": "fást íternet", "loopback": "lúp béc", "subinterface": "sub interfêice", "subinterfaces": "sub interfêices",
    "relay": "rílêi", "snooping": "snúping", "trusted": "trâsted", "untrusted": "ântrâsted", "sticky": "stíqui",
    "shutdown": "chât dáun", "trap": "trép", "traps": "tréps", "inform": "infórm", "informs": "infórms",
    "community": "comiúniti", "agent": "êidjent", "push": "púch", "pull": "púl", "portfast": "pórt fást",
    "guard": "gárd", "spanning": "spéning", "tree": "tri", "etherchannel": "íter tchénel", "port-channel": "pórt tchénel",
    "overload": "ouverlôud", "inside": "insáide", "outside": "autsáide", "pool": "púl", "lease": "líss",
    "stack": "stéc", "stick": "stíc", "spine-leaf": "spáine líf", "cut-through": "cât trú", "store-and-forward": "stór end fóruard",
    "forwarding": "fóruarding", "blocking": "blóquing", "listening": "lísening", "learning": "lârning",
    "discarding": "discárding", "designated": "désignêited", "alternate": "ólternêit", "proposal": "propôusal",
    "agreement": "agríment", "default": "difólt", "best": "bést", "effort": "éfort", "boundary": "báundari",
    "scavenger": "scávendjer", "unicast": "iunicast", "multicast": "multicast", "broadcast": "bródcast",
    "anycast": "énicast", "link-local": "línk lôucal", "unique": "iuníque",
    "lightweight": "láit uêit", "flexconnect": "fléx conéct", "meraki": "meráqui", "split-mac": "split mac",
    "split": "split", "survey": "sârvei", "roaming": "rôuming", "guest": "guést", "suplicante": "suplicante",
    "enterprise": "énterpráiz", "personal": "pârsonal", "wireless": "uáierless", "controller": "contrôuler",
    "center": "sénter", "assurance": "achúrance", "dashboard": "déchbórd", "sandbox": "sénd box", "sandboxes": "sénd boxes",
    "requests": "ricuésts", "header": "réder", "headers": "réders", "payload": "pêilôud", "timeout": "táimáut",
    "teletrabalho": "teletrabalho", "secure": "sicúr", "client": "cláient", "tailgating": "têilguêiting",
    "pretexting": "pritéksting", "smart": "smárt", "framework": "frêimuórk", "debug": "dibâg", "ping": "ping",
    "traceroute": "treice ráut", "tracert": "treice ârt", "putty.": "pâti.", "tera": "téra", "term": "târm",
    "power": "páuer", "shell": "chél", "powershell": "páuer chél", "prompt": "prómpt",
    "simulation": "simulêichon", "physical": "físical", "desktop": "désktop",
    "command": "comând", "services": "sérvices", "copyright": "cópirráit", "sharing": "chéring",
    "multibanco": "multibanco", "helper": "rélper", "kleinrock": "cláinróc", "baran": "báran", "tomlinson": "tómlinson",
    "metcalfe": "métcalf", "xerox": "zírox", "parc": "párc", "vint": "vínt", "cerf": "cârf", "kahn": "cán",
    "berners-lee": "bârners lí", "tim": "tím", "bob": "bób", "ray": "rêi", "babbage": "bébidj", "ada": "êida",
    "lovelace": "lâvlêis", "jacquard": "jacár", "hollerith": "rólerith", "turing": "tiúring", "colossus": "colóssus",
    "neumann": "nóiman", "john": "djón", "bell": "bél", "labs": "lébs", "kilby": "quílbi", "intel": "íntel",
    "apple": "épol", "macintosh": "mécintóche", "gordon": "górdon", "moore": "múr", "fortran": "fórtran",
    "cobol": "cóbol", "mainframe": "mêinfrêim", "mainframes": "mêinfrêims", "modem": "môudem", "modems": "môudems",
    "morse": "mórse", "pascal": "pascal", "blaise": "blése", "word": "uórd", "excel": "excél", "office": "ófice",
    "whatsapp": "uótsáp", "youtube": "iutúbe", "google": "gúgol", "facebook": "feicebúc", "netflix": "nétflix",
    "imagiologia": "imagiologia", "pearson": "pírson", "vue": "viú", "cisco": "cisco", "press": "préss",
    "github": "guít râb", "ipconfig": "i pê cónfig", "ifconfig": "i éfe cónfig", "cmd": "cê ême dê", "cloudflare": "cláudflér", "eye": "ái", "ios": "ai ó ésse",
}

# Palavras dos comandos Cisco (só dentro de comandos, onde “no” é inglês)
COMANDOS = dict(PALAVRAS, **{
    "no": "nôu", "show": "chôu", "interface": "interfêice", "interfaces": "interfêices", "brief": "brife",
    "configure": "confíguer", "terminal": "términal", "enable": "enêibol", "disable": "disêibol", "hostname": "rôst nêim",
    "running-config": "râning cónfig", "startup-config": "stártâp cónfig", "address": "adréss", "secret": "sícret",
    "line": "láine", "console": "cónsol", "vty": "vê tê ípsilon", "transport": "transpórt", "input": "ímput",
    "copy": "cópi", "exit": "éksit", "end": "énd", "network": "nétuork", "area": "éria", "route": "ráut",
    "mode": "môud", "native": "nêitiv", "name": "nêim", "allowed": "aláud", "encapsulation": "encapsulêichon",
    "dot1q": "dót um kiú", "passive-interface": "péssiv interfêice", "spanning-tree": "spéning tri",
    "bpduguard": "bê pê dê u gárd", "channel-group": "tchénel grup", "active": "éctiv", "passive": "péssiv",
    "crypto": "cripto", "key": "quí", "generate": "djénereit", "modulus": "módiulus", "domain-name": "doméin nêim",
    "domain-lookup": "doméin lúcâp", "username": "iúzer nêim", "banner": "bâner", "motd": "ême ó tê dê",
    "service": "sârvice", "password-encryption": "pássuord encrípchon", "description": "discrípchon", "clock": "clóc",
    "timezone": "táim zôun", "server": "sârver", "logging": "lóguing", "synchronous": "síncronus",
    "exec-timeout": "éksec táimáut", "range": "rêindj", "switchport": "suítch pórt", "nonegotiate": "nou negôuxieit",
    "voice": "vóice", "port-security": "pórt seguiúriti", "maximum": "máksimum", "mac-address": "mac adréss",
    "violation": "vaiolêichon", "restrict": "ristríct", "protect": "protéct", "helper-address": "rélper adréss",
    "source": "sórce", "list": "líst", "static": "státic", "excluded-address": "ecsclúded adréss",
    "dns-server": "dê ene ésse sârver", "default-router": "difólt ráuter", "standby": "sténd bái", "priority": "praióriti",
    "preempt": "priémpt", "version": "vârchon", "unicast-routing": "iunicast ráuting", "eui-64": "i u i sessenta e quatro",
    "flash": "flésh", "flash:": "flésh", "reload": "rilôud", "write": "ráite", "memory": "mémori", "erase": "irêise",
    "access-list": "ácsses líst", "permit": "pârmit", "deny": "dinái", "any": "éni", "eq": "ê kiú", "echo": "éco",
    "access-group": "ácsses grup", "access-class": "ácsses clás", "in": "ín", "out": "áut", "extended": "ecsténded",
    "standard": "stândard", "remark": "rimárk", "class-map": "clás map", "policy-map": "póliçi map", "match": "métch",
    "match-any": "métch éni", "percent": "percént", "fair-queue": "fér kiú", "service-policy": "sârvice póliçi",
    "output": "áutput", "new-model": "niú módel", "authentication": "autenticêichon", "group": "grup", "run": "rân",
    "neighbors": "nêibors", "neighbor": "nêibor", "detail": "ditêil", "history": "ístori", "address-table": "adréss têibol",
    "summary": "sâmeri", "protocols": "prótocols", "binding": "báinding", "translations": "translêichons",
    "translation": "translêichon", "statistics": "statístics", "verify": "vérifai", "boot": "bút", "system": "sístem",
    "ipconfig": "i pê cónfig", "dir": "dír", "cd": "cê dê", "ls": "éle ésse", "auto": "ôuto", "speed": "spíd",
    "lldp": "éle éle dê pê", "cdp": "cê dê pê", "ntp": "ene tê pê", "master": "máster", "trap": "trép",
    "host": "rôst", "user": "iúzer", "auth": "ót", "sha": "ésse agá á", "priv": "priv", "aes": "á i ésse",
    "routing": "ráuting", "ospf": "ó ésse pê éfe", "ip": "i pê", "ipv6": "i pê vê seis", "rsa": "érre ésse á",
    "ssh": "ésse ésse agá", "dhcp": "dê agá cê pê", "pool": "púl", "lease": "líss", "router-id": "ráuter ái di",
    "reference-bandwidth": "réferenss béndguidth", "auto-cost": "ôuto cóst", "default-information": "difólt informêichon",
    "originate": "orídjineit", "cost": "cóst", "level": "lével", "level-1": "lével um", "general-keys": "djéneral quís",
    "mdix": "ême dê i éks", "vlan": "vê lan", "ftp": "éfe tê pê", "tftp": "tê éfe tê pê", "ftp:": "éfe tê pê",
    "tftp:": "tê éfe tê pê", "rommon": "rómon", "confreg": "cónf réguê", "config-register": "cónfig rédjister",
    "reset": "risét", "tacacs": "tácacs", "tacacs+": "tácacs mais", "lookup": "lúcâp", "rapid-pvst": "rápid pê vê ésse tê",
    "primary": "práimari", "secondary": "sécondari", "violation:": "vaiolêichon", "sticky": "stíqui",
    "trust": "trâst", "limit": "límit", "rate": "rêite", "inspection": "inspécchon", "arp": "arp", "snooping": "snúping",
    "information": "informêichon", "option": "ópchon", "dynamic": "dainâmic", "desirable": "dizáirabol",
    "on": "ón", "off": "óf", "set": "sét", "type": "táipe", "hash": "réch",
    "conf": "cónf", "sh": "chôu", "int": "ínt", "br": "brife", "wr": "ráite", "add": "éd", "sw": "suítch",
    "mo": "môud", "acc": "ácsses", "gen": "djén", "mod": "mód", "nei": "nêibor", "eth": "íter", "sum": "sâm",
})

UNIDADES = [
    (r"Gbit/s", "gigabits por segundo"), (r"Mbit/s", "megabits por segundo"), (r"kbit/s", "quilobits por segundo"),
    (r"Kbit/sec", "quilobits por segundo"), (r"bits/sec", "bits por segundo"), (r"MB/s", "megabytes por segundo"),
    (r"Mb/s", "megabits por segundo"), (r"GHz", "gigahertz"), (r"µm", "micrómetros"), (r"°C", "graus"),
]
UNIDADES_APOS_NUMERO = {
    "TB": "terabytes", "GB": "gigabytes", "MB": "megabytes", "KB": "quilobytes", "km": "quilómetros", "m": "metros",
    "ms": "milissegundos", "s": "segundos", "min": "minutos", "h": "horas", "B": "bytes", "bits": "bits", "W": "watts",
}
ORDINAIS = {"1": "primeira", "2": "segunda", "3": "terceira", "4": "quarta", "5": "quinta", "6": "sexta"}
ORDINAIS_M = {"1": "primeiro", "2": "segundo", "3": "terceiro", "4": "quarto", "5": "quinto", "6": "sexto"}
INTERFACES = {"gigabitethernet": "guígabit", "gi": "guígabit", "g": "guígabit", "fastethernet": "fást íternet",
              "fa": "fást íternet", "f": "fást íternet", "serial": "sérial", "se": "sérial", "s": "sérial",
              "vlan": "vê lan", "loopback": "lúp béc", "lo": "lúp béc", "po": "pórt tchénel", "port-channel": "pórt tchénel"}


# Nomes das letras em português europeu: “TCP” → “tê cê pê”. Escritas assim, a voz
# diz a sigla de seguida, como em sala de aula (com letras soltas, “T C P”, muitas vozes
# fazem uma pausa entre cada letra).
LETRAS = {
    "a": "á", "b": "bê", "c": "cê", "d": "dê", "e": "é", "f": "éfe", "g": "guê", "h": "agá", "i": "i", "j": "jota",
    "k": "capa", "l": "éle", "m": "ême", "n": "ene", "o": "ó", "p": "pê", "q": "quê", "r": "érre", "s": "ésse",
    "t": "tê", "u": "u", "v": "vê", "w": "dâblio", "x": "xis", "y": "ípsilon", "z": "zê",
}

_UNID = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze",
         "treze", "catorze", "quinze", "dezasseis", "dezassete", "dezoito", "dezanove"]
_DEZ = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"]
_CEM = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"]


def por_extenso(n: int) -> str:
    """Número inteiro (0 a 999 999) por extenso, em português europeu."""
    if n < 20:
        return _UNID[n]
    if n < 100:
        d, u = divmod(n, 10)
        return _DEZ[d] + (f" e {_UNID[u]}" if u else "")
    if n < 1000:
        if n == 100:
            return "cem"
        c, r = divmod(n, 100)
        return _CEM[c] + (f" e {por_extenso(r)}" if r else "")
    if n < 1_000_000:
        m, r = divmod(n, 1000)
        txt = "mil" if m == 1 else por_extenso(m) + " mil"
        if not r:
            return txt
        return txt + (" e " if r < 100 or r % 100 == 0 else " ") + por_extenso(r)
    return str(n)


def _num(s: str, fluido: bool) -> str:
    return por_extenso(int(s)) if fluido and s.isdigit() and len(s) <= 6 and not (len(s) > 1 and s[0] == "0") else s


def _soletrar(s: str, fluido: bool = False) -> str:
    if not fluido:
        return " ".join(ch for ch in s if ch.strip())
    out = []
    for parte in re.findall(r"\d+|[A-Za-z]", s):
        out.append(_num(parte, True) if parte.isdigit() else LETRAS.get(parte.lower(), parte))
    return " ".join(out)


def falar(texto: str, comando: bool = False, fluido: bool = False) -> str:
    """Converte um texto para a forma como deve ser dito em voz alta.

    ``fluido=True`` (vídeo-aulas e assistente de leitura): siglas com o nome das letras
    (“tê cê pê”), IP lidos por octetos por extenso (“cento e noventa e dois ponto…”),
    prefixos por extenso (“barra vinte e seis”) e números de interfaces por extenso."""
    t = texto
    dic = COMANDOS if comando else PALAVRAS
    sol = lambda s: _soletrar(s, fluido)
    num = lambda s: _num(s, fluido)
    # hexadecimal (MAC, IPv6): carácter a carácter
    hexa = (lambda s: " ".join(LETRAS[c] if c in LETRAS else _UNID[int(c)] for c in s.lower() if c.isalnum())) if fluido else (lambda s: _soletrar(s.lower()))

    def ip(m: re.Match) -> str:
        falado = " ponto ".join(num(str(int(o))) for o in m.group(1).split("."))
        return falado + (f" barra {num(m.group(2)[1:])}" if m.group(2) else "")

    def ipv6(m: re.Match) -> str:
        out = []
        for p in re.split(r"(::|:|/)", m.group(0)):
            if p == "::":
                out.append("dois pontos dois pontos")
            elif p == ":":
                out.append("dois pontos")
            elif p == "/":
                out.append("barra")
            elif p:
                out.append(num(p) if p.isdigit() and (not fluido or out[-1:] == ["barra"]) else hexa(p))
        return " ".join(out)

    def interface(m: re.Match) -> str:
        nome = INTERFACES.get(m.group(1).lower(), m.group(1))
        numero = " barra ".join(num(x) for x in m.group(2).split("/"))
        sub = f" ponto {num(m.group(3))}" if m.group(3) else ""
        return f"{nome} {numero}{sub}"

    # símbolos e abreviaturas
    t = t.replace("…", "...").replace("“", "").replace("”", "").replace("«", "").replace("»", "")
    t = re.sub(r"\bex\.:?", "por exemplo,", t, flags=re.I)
    t = re.sub(r"\ba\.C\.", "antes de Cristo", t)
    t = re.sub(r"\betc\.", "etcétera", t)
    t = re.sub(r"\bn\.º\s*", "número ", t)
    t = re.sub(r"(\d)\.ª", lambda m: ORDINAIS.get(m.group(1), m.group(1) + ".ª"), t)
    t = re.sub(r"(\d)\.º", lambda m: ORDINAIS_M.get(m.group(1), m.group(1) + ".º"), t)
    t = re.sub(r"\b0x([0-9A-Fa-f]+)\b", lambda m: "zero xis " + sol(m.group(1)), t)
    t = re.sub(r"\b802\.(\d+)([A-Za-z]{0,3})\b", lambda m: "oito zero dois ponto " + num(m.group(1)) + (" " + sol(m.group(2).upper()) if m.group(2) else ""), t)
    # endereços
    t = re.sub(r"\b([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}\b", lambda m: sol(m.group(0).replace(":", " ").replace("-", " ").lower()) if not fluido else ", ".join(hexa(g) for g in re.split(r"[:-]", m.group(0))), t)
    t = re.sub(r"\b[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\b", lambda m: " ponto ".join(hexa(g) for g in m.group(0).split(".")), t)
    t = re.sub(r"\b(\d{1,3}(?:\.\d{1,3}){3})(/\d{1,2})?\b", ip, t)
    t = re.sub(r"(?<![\w:])(?:[0-9A-Fa-f]{1,4})?(?:::?[0-9A-Fa-f]{1,4}){1,7}(?:::)?(?:/\d{1,3})?(?![\w:])", lambda m: ipv6(m) if ":" in m.group(0) and re.search(r"[A-Fa-f]|::|\d{3,}", m.group(0)) else m.group(0), t)
    t = re.sub(r"(?<![\w/])/(\d{1,3})\b", lambda m: "barra " + num(m.group(1)), t)
    t = re.sub(r"\b(gigabitethernet|fastethernet|serial|loopback|port-channel|vlan|gi|fa|se|lo|po|g|f|s)\s?(\d+(?:/\d+)+)(?:\.(\d+))?", interface, t, flags=re.I)
    # unidades
    for a, b in UNIDADES:
        t = t.replace(a, b)
    t = re.sub(r"(\d)\s?(TB|GB|MB|KB|km|ms|min|bits|W|B|m|s|h)\b", lambda m: m.group(1) + " " + UNIDADES_APOS_NUMERO[m.group(2)], t)
    t = re.sub(r"(\d)\s?%", r"\1 por cento", t)
    t = re.sub(r"(\d)\^(\w+)", r"\1 elevado a \2", t)
    if fluido:
        t = re.sub(r"(\d)\s?–\s?(?=\.?\d)", r"\1 a ", t)  # intervalos “.0–.63”
        t = re.sub(r"(?<![\w.])\.(\d{1,3})\b", lambda m: "ponto " + num(m.group(1)), t)  # “.128”
        t = re.sub(r"\s*→\s*", ", portanto, ", t)
    # operadores e setas
    t = t.replace("›", ", ").replace("→", ", e depois, ").replace("↔", " e ").replace("×", " vezes ").replace("÷", " a dividir por ")
    if comando:
        t = re.sub(r"\s-\s", " até ", t)
    t = re.sub(r"(\d)/(\d)", r"\1 e \2", t)
    t = re.sub(r"\s−\s|\s-\s", " menos ", t)
    if fluido:
        t = re.sub(r"(\d)\s?−\s?(\d)", r"\1 menos \2", t)
        t = re.sub(r"(\d)\+(?=\d)", r"\1 mais ", t)
    t = re.sub(r"\s=\s", " igual a ", t).replace("≈", " aproximadamente ").replace("≤", "até ").replace("≥", "pelo menos ").replace("~", "cerca de ")
    t = re.sub(r"\s\+\s", " mais ", t)
    t = t.replace("&", " e ").replace("|", ", ").replace("*", "").replace("#", " ").replace("_", " ")
    t = re.sub(r"(?<=\w)/(?=[A-Za-zÀ-ÿ])", " ou ", t)

    # palavras e siglas
    def palavra(m: re.Match) -> str:
        w = m.group(0)
        if w in SIGLAS_PALAVRA:
            return SIGLAS_PALAVRA[w]
        low = w.lower()
        if low in dic:
            return dic[low]
        base = re.sub(r"s$", "", w)
        if re.fullmatch(r"[A-Z][A-Z0-9]{1,6}", base) and not base.isdigit():
            return sol(base)
        if re.fullmatch(r"[A-Z]{1,3}\d[A-Za-z0-9]*", w):  # WPA2, SHA256
            return sol(re.sub(r"(\d+)", r" \1 ", w))
        if fluido and re.fullmatch(r"[A-Z]", w) and m.start() > 0 and t[m.start() - 1] not in ".!?\n" and not t[:m.start()].rstrip().endswith((".", ":")):
            return LETRAS[low]  # letra isolada a meio da frase: “classe C”
        return w

    t = re.sub(r"[A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9+\-:]*[A-Za-zÀ-ÿ0-9+]|[A-Za-zÀ-ÿ]", lambda m: palavra(m) if m.group(0) not in ("-",) else m.group(0), t)
    return re.sub(r"\s+([,.;:])", r"\1", re.sub(r"\s{2,}", " ", t)).strip(" ,")


def falar_bem(texto: str, comando: bool = False) -> str:
    """Forma falada das vídeo-aulas e do assistente de leitura (modo fluido)."""
    return falar(texto, comando, fluido=True)


# ---------------------------------------------------------------------------
# HTML → frases
# ---------------------------------------------------------------------------

def _limpar(html: str) -> str:
    t = re.sub(r"<sup>(.*?)</sup>", r"^\1", html)
    t = re.sub(r"<[^>]+>", "", t)
    return re.sub(r"\s+", " ", _html.unescape(t)).strip()


def frases(html: str) -> list[str]:
    """Divide um bloco HTML em frases legíveis, mantendo cada item de lista."""
    html = re.sub(r"<pre>.*?</pre>", " ", html, flags=re.S)
    partes = re.split(r"</?(?:p|li|ol|ul|br)[^>]*>", html)
    out = []
    for p in partes:
        p = _limpar(p)
        if not p:
            continue
        for f in re.split(r"(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9\"(])", p):
            if f.strip():
                out.append(f.strip())
    return out


def _codigo(html: str) -> list[str]:
    return [_limpar(c) for c in re.findall(r"<pre>(.*?)</pre>", html, flags=re.S)]


def _pontuar(s: str) -> str:
    return re.sub(r"([?!:.])\.+", r"\1", s)


def fala(texto: str, comando: bool = False, mostrar: str | None = None, **extra) -> dict:
    """Uma fala: ``t`` (legenda) e ``f`` (texto falado). ``extra`` pode ter ``item`` (elemento
    do ecrã que acende), ``ideia`` (falas da mesma ideia encadeiam-se sem pausa) e ``pausa``."""
    texto = _pontuar(texto)
    d = {"t": _pontuar(mostrar) if mostrar is not None else texto, "f": falar_bem(texto, comando)}
    if extra.get("ideia") is not None:
        d["_i"] = extra.pop("ideia")
    extra.pop("ideia", None)
    d.update({k: v for k, v in extra.items() if v is not None})
    return d


# Pausas (segundos) do guião: dentro da mesma ideia não há pausa (a fala seguinte já
# está na fila da voz); entre ideias, uma pausa curta; ao mudar de cena, uma pausa maior;
# para observar uma figura ou código, e no “Pare e pense”, o tempo de pensar.
PAUSA_IDEIA, PAUSA_CENA, PAUSA_OBSERVAR, ESPERA_PENSE = 0.35, 0.9, 3.5, 5


def _ritmo(cena: dict) -> dict:
    falas = cena["falas"]
    for k, f in enumerate(falas):
        ideia = f.pop("_i", None)
        seguinte = falas[k + 1] if k + 1 < len(falas) else None
        if seguinte is None:
            f["pausa"] = max(f.get("pausa", 0), PAUSA_CENA)
        elif "pausa" in f or f.get("espera"):
            pass
        elif ideia is not None and seguinte.get("_i") == ideia:
            f["junta"] = True
        else:
            f["pausa"] = PAUSA_IDEIA
    return cena


def _itens_html(html: str) -> list[str]:
    """Parágrafos e itens de lista de um bloco (cada um é uma ideia no ecrã)."""
    html = re.sub(r"<pre>.*?</pre>", " ", html, flags=re.S)
    return [x for x in (_limpar(p) for p in re.split(r"</?(?:p|li|ol|ul|br)[^>]*>", html)) if x]


def _dividir(txt: str) -> list[str]:
    return [f.strip() for f in re.split(r"(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9\"(])", txt) if f.strip()]


def _negritos(html: str) -> list[str]:
    out = []
    for x in re.findall(r"<(?:b|strong)>(.*?)</(?:b|strong)>", html, flags=re.S):
        x = _limpar(x).strip(" .,:;")
        if x and len(x) <= 40 and len(x) > 5 and x.lower() not in (o.lower() for o in out):
            out.append(_minuscula(x))
    return out


def _lista(xs: list[str]) -> str:
    return xs[0] if len(xs) == 1 else ", ".join(xs[:-1]) + " e " + xs[-1]


def _palavras(txt: str) -> set[str]:
    return {w for w in re.findall(r"[a-zà-ÿ0-9]{5,}", txt.lower())}


def _minuscula(s: str) -> str:
    return s[:1].lower() + s[1:] if s[:2] != s[:2].upper() else s


INTRO_TEXTO = ["Vamos ver: {t}.", "Agora: {t}.", "A seguir: {t}.", "Passemos a: {t}."]


def _porque(ctx: dict, texto: str, ideia: int) -> list[dict]:
    """“Porque é que isto importa?”: liga a cena ao objetivo da aula mais parecido."""
    melhor, pontos = None, 0
    alvo = _palavras(texto)
    for k, o in enumerate(ctx["objetivos"]):
        p = len(alvo & _palavras(o))
        if k not in ctx["usados"] and p > pontos:
            melhor, pontos = k, p
    if melhor is None:
        return []
    ctx["usados"].add(melhor)
    o = ctx["objetivos"][melhor].rstrip(".")
    return [fala("Porque é que isto importa?", ideia=ideia), fala(f"Porque o ajuda a {_minuscula(o)}.", ideia=ideia)]


def _resumo(html: str, itens: list[str], exemplo: bool = False) -> str | None:
    neg = _negritos(html)
    if exemplo and len(neg) >= 2:
        return "Os resultados a reter deste exemplo: " + _lista(neg[:5]) + "."
    if len(neg) >= 2:
        return "Em resumo, retenha: " + _lista(neg[:5]) + "."
    if len(itens) >= 3:
        f = _dividir(itens[0])[0]
        if len(f) <= 160:
            return "A ideia principal: " + _minuscula(f.rstrip(".")) + "."
    return None


def _cena_texto(i: int, b: dict, ctx: dict) -> dict:
    tipo, titulo = b["tipo"], b.get("titulo", "")
    itens = _itens_html(b["html"])
    falas, ideia = [], 0
    if tipo == "exemplo":
        falas.append(fala(f"Vamos a um exemplo: {titulo}." if titulo else "Vamos a um exemplo.", mostrar=titulo or "Exemplo", ideia=ideia))
        if len(itens) > 1:
            falas.append(fala("Acompanhe cada passo no ecrã.", ideia=ideia))
    elif tipo == "texto" and titulo:
        intro = INTRO_TEXTO[ctx["n"] % len(INTRO_TEXTO)].format(t=titulo.rstrip("."))
        falas.append(fala(intro, mostrar=titulo, ideia=ideia))
        falas += _porque(ctx, titulo + " " + " ".join(itens), ideia)
    elif tipo == "dica":
        falas.append(fala("Uma dica para ajudar.", ideia=ideia))
    elif tipo == "alerta":
        falas.append(fala("Atenção a um erro comum.", ideia=ideia))
    for k, item in enumerate(itens):
        ideia += 1
        falas += [fala(f, item=k, ideia=ideia) for f in _dividir(item)]
    cena = {"tipo": tipo, "bloco": i, "titulo": titulo or {"dica": "Dica", "alerta": "Atenção"}.get(tipo, ""), "itens": itens, "falas": falas}
    codigo = _codigo(b["html"])
    if codigo:
        n = sum(len([l for l in c.split("\n") if l.strip()]) for c in codigo)
        cena["codigo"] = len(itens)
        falas.append({"t": "(observe o código no ecrã)", "f": f"Observe com atenção o código no ecrã. Tem {por_extenso(n) if n < 1000 else n} linha{'s' if n != 1 else ''}. Leia-o com calma.",
                      "item": len(itens), "pausa": min(5, PAUSA_OBSERVAR + n * 0.15)})
    if tipo in ("texto", "exemplo") and len(falas) >= 4:
        r = _resumo(b["html"], itens, tipo == "exemplo")
        if r:
            k = len(itens) + (1 if codigo else 0)
            cena["resumo"] = {"t": r, "item": k}
            falas.append(fala(r, item=k))
    return cena


def _cena_bloco(i: int, b: dict, ctx: dict | None = None) -> dict | None:
    ctx = ctx if ctx is not None else {"objetivos": [], "usados": set(), "n": 0}
    tipo = b["tipo"]
    if tipo in ("texto", "exemplo", "dica", "alerta"):
        return _cena_texto(i, b, ctx)
    if tipo == "figura":
        return {"tipo": tipo, "bloco": i, "titulo": "", "falas": [
            fala("Observe a ilustração.", ideia=0, item=0), fala(b["legenda"], ideia=0, item=0, pausa=PAUSA_OBSERVAR)]}
    if tipo == "topologia":
        nomes = {n["id"]: n["rotulo"] for n in b["nos"]}
        falas = [fala("Observe o diagrama.", ideia=0, item=0), fala(b["legenda"], ideia=0, item=0, pausa=2)]
        ligacoes = [f"{nomes[l['a']]} liga a {nomes[l['b']]}" + (f", por {l['rotulo']}" if l["rotulo"] else "") + "." for l in b["ligacoes"]]
        if ligacoes:
            falas += [fala(t, item=k + 1, ideia=1) for k, t in enumerate(ligacoes)]
        else:
            falas.append(fala("Neste diagrama vê: " + ", ".join(nomes.values()) + ".", item=0))
        return {"tipo": tipo, "bloco": i, "titulo": "", "itens": ligacoes, "falas": falas}
    if tipo == "tabela":
        falas = [fala(f"Tabela: {b['titulo']}.", ideia=0)] if b.get("titulo") else [fala("Vamos ver esta tabela.", mostrar="Tabela", ideia=0)]
        if len(b["linhas"]) > 1:
            falas.append(fala("Vamos lê-la linha a linha.", ideia=0))
        cab = b["cabecalho"]
        for r, linha in enumerate(b["linhas"]):
            partes = [linha[0]] + [f"{cab[j]}: {linha[j]}" for j in range(1, len(linha)) if linha[j] and cab[j]]
            txt = ". ".join(_limpar(p).rstrip(".") for p in partes if p) + "."
            falas.append(fala(txt, item=r, ideia=r + 1))
        return {"tipo": tipo, "bloco": i, "titulo": b.get("titulo", ""), "falas": falas}
    if tipo == "cli":
        falas = [fala(b["titulo"] + ". Vamos passo a passo.", mostrar=b["titulo"], ideia=0)]
        for k, p in enumerate(b["passos"]):
            if re.search(r"[#>]$", p["prompt"].strip()):
                falas.append({"t": f"{p['prompt']} {p['cmd']}", "f": f"Passo {por_extenso(k + 1)}. Escreva: {falar_bem(p['cmd'], True)}.", "item": k, "_i": k + 1})
                if p["explica"]:
                    falas.append(fala(p["explica"], item=k, ideia=k + 1))
            else:
                falas.append(fala(f"Passo {k + 1}. {p['cmd']}.", item=k, ideia=k + 1))
                if p["explica"]:
                    falas.append(fala(p["explica"], item=k, ideia=k + 1))
        if b.get("nota"):
            falas.append(fala(_limpar(b["nota"])))
        n = len(b["passos"])
        if n >= 3:
            falas.append(fala(f"Em resumo: {por_extenso(n)} passos. Pode copiar os comandos na lição, por baixo do vídeo."))
        return {"tipo": tipo, "bloco": i, "titulo": b["titulo"], "falas": falas}
    if tipo == "saida":
        falas = [fala(b["titulo"] + ".", mostrar=b["titulo"], ideia=0),
                 {"t": "(observe a saída do comando)", "f": "Observe no ecrã a saída do comando, tal como aparece no equipamento.", "item": 0, "pausa": PAUSA_OBSERVAR}]
        if b.get("explica"):
            for k, it in enumerate(_itens_html(b["explica"])):
                falas += [fala(f, item=0, ideia=k + 1) for f in _dividir(it)]
        return {"tipo": tipo, "bloco": i, "titulo": b["titulo"], "falas": falas}
    if tipo == "sim_real":
        ns = len(b["simulador"])
        falas = [fala(b["titulo"].replace("×", "comparado com") + ".", mostrar=b["titulo"], ideia=0), fala("No simulador:", ideia=1)]
        falas += [fala(_limpar(x), item=k, ideia=1) for k, x in enumerate(b["simulador"])]
        falas.append(fala("No equipamento real:", ideia=2))
        falas += [fala(_limpar(x), item=ns + k, ideia=2) for k, x in enumerate(b["real"])]
        return {"tipo": tipo, "bloco": i, "titulo": b["titulo"], "falas": falas}
    if tipo == "jogo_cabo":
        ordem = ["branco-laranja", "laranja", "branco-verde", "azul", "branco-azul", "verde", "branco-castanho", "castanho"] if b["norma"] == "T568B" else \
                ["branco-verde", "verde", "branco-laranja", "azul", "branco-azul", "laranja", "branco-castanho", "castanho"]
        falas = [fala(f"Agora pratique: monte o conector {b['norma']} fio a fio.", mostrar=f"Jogo: monte o cabo {b['norma']}", ideia=0)]
        falas += [fala(f"Pino {k + 1}: {c}.", item=k, ideia=1) for k, c in enumerate(ordem)]
        falas.append(fala("Depois da vídeo-aula, faça o jogo por baixo do vídeo e confirme se acertou."))
        return {"tipo": "jogo_cabo", "bloco": i, "titulo": f"Montar o cabo {b['norma']}", "itens": ordem, "falas": falas}
    return None


# ---------------------------------------------------------------------------
# “Pare e pense”: perguntas do quiz da própria aula, a meio do vídeo
# ---------------------------------------------------------------------------

def _cena_pense(q: dict) -> dict:
    pergunta = _limpar(q["p"])
    if q["tipo"] == "vf":
        opcoes, certa = ["Verdadeiro", "Falso"], 0 if q["correta"] else 1
        dito = f"Pare e pense. Verdadeiro ou falso? {pergunta}"
    else:
        opcoes, certa = [_limpar(o) for o in q["opcoes"]], q["correta"]
        dito = f"Pare e pense. {pergunta}"
        if sum(len(o) for o in opcoes) <= 160:
            dito += " As hipóteses são: " + "; ".join(o.rstrip(".") for o in opcoes) + "."
        else:
            dito += " Escolha uma das hipóteses no ecrã."
    dito = _frase(dito) + " Tem cinco segundos."
    explica = _dividir(re.sub(r"^(Verdadeiro|Falso)[.!:]\s*", "", _limpar(q.get("explica_longa") or q.get("explica") or "")))
    explicacao = ""
    for f in explica:
        if len(explicacao) + len(f) > 320:
            break
        explicacao = (explicacao + " " + f).strip()
    resposta = ("É verdadeiro." if certa == 0 else "É falso.") if q["tipo"] == "vf" else f"A resposta certa é: {opcoes[certa].rstrip('.')}."
    falas = [{"t": pergunta, "f": falar_bem(dito), "espera": ESPERA_PENSE},
             fala(resposta, item=certa, ideia=1)]
    if explicacao and not re.fullmatch(r"(Verdadeiro|Falso)\.?", explicacao):
        falas.append(fala(explicacao, item=certa, ideia=1))
    return {"tipo": "pense", "bloco": -1, "titulo": "Pare e pense", "pergunta": pergunta, "opcoes": opcoes, "certa": certa, "falas": falas}


def _inserir_pense(cenas: list[dict], quiz: list[dict]) -> list[dict]:
    cand = [q for q in quiz if q["tipo"] in ("mc", "vf") and (q["tipo"] == "vf" or len(q.get("opcoes", [])) >= 2)]
    conteudo = [k for k, c in enumerate(cenas) if c["tipo"] not in ("abertura", "fecho")]
    if not cand or len(conteudo) < 2:
        return cenas
    quantas = 2 if len(conteudo) >= 6 else 1
    textos = {k: _palavras(" ".join(f["t"] for f in cenas[k]["falas"])) for k in conteudo}
    escolhas = []
    for qi, q in enumerate(cand):
        alvo = _palavras(q["p"] + " " + " ".join(q.get("opcoes", [])) + " " + q.get("explica", ""))
        k, pontos = max(((k, len(alvo & textos[k])) for k in conteudo[1:]), key=lambda x: (x[1], -abs(x[0] - len(cenas) / 2)))
        escolhas.append((pontos, -qi, k, q))
    escolhas.sort(key=lambda x: (x[0], x[1]), reverse=True)
    usadas, inserir = set(), []
    for pontos, _, k, q in escolhas:
        if len(inserir) >= quantas:
            break
        if pontos < 2 or any(abs(k - u) < 2 for u in usadas):
            continue
        usadas.add(k)
        inserir.append((k, q))
    if not inserir:  # sem correspondência clara: a meio da aula
        inserir = [(conteudo[len(conteudo) // 2], cand[0])]
    for k, q in sorted(inserir, key=lambda x: x[0], reverse=True):
        cenas.insert(k + 1, _ritmo(_cena_pense(q)))
    return cenas


# ---------------------------------------------------------------------------
# Lição → cenas
# ---------------------------------------------------------------------------

PALAVRAS_POR_SEGUNDO = 2.5


def _duracao(f: dict) -> float:
    return len(f["f"].split()) / PALAVRAS_POR_SEGUNDO + f.get("pausa", 0) + f.get("espera", 0)


def _tempos(cenas: list[dict]) -> int:
    """Marca o início (segundos, a 1×) de cada cena — para os capítulos — e devolve o total."""
    t = 0.0
    for c in cenas:
        c["inicio"] = round(t)
        t += sum(_duracao(f) for f in c["falas"])
    return round(t)


def video_da_licao(l: dict, modulo: dict) -> dict:
    ctx = {"objetivos": l["objetivos"], "usados": set(), "n": 0}
    cenas = [_ritmo({
        "tipo": "abertura", "bloco": -1, "titulo": l["titulo"],
        "falas": [fala(f"Módulo {modulo['codigo']}. Aula: {l['titulo']}.", mostrar=l["titulo"]),
                  fala("Nesta aula vai aprender a:", ideia=1)] + [fala(o + ".", item=k, ideia=1) for k, o in enumerate(l["objetivos"])],
    })]
    for i, b in enumerate(l["blocos"]):
        c = _cena_bloco(i, b, ctx)
        if c and c["falas"]:
            ctx["n"] += 1
            cenas.append(_ritmo(c))
    cenas = _inserir_pense(cenas, l.get("quiz", []))
    cenas.append(_ritmo({
        "tipo": "fecho", "bloco": -1, "titulo": "Resumo",
        "falas": [fala("Resumo da aula. Agora já sabe:", ideia=0)] + [fala(o + ".", item=k, ideia=0) for k, o in enumerate(l["objetivos"])]
                 + [fala(f"Faça agora o quiz de {len(l['quiz'])} perguntas para confirmar o que aprendeu.", ideia=1),
                    fala("Se tiver dúvidas, repita a aula. As referências bibliográficas estão no fim da lição.", ideia=1)],
    }))
    return {"cenas": cenas, "segundos": _tempos(cenas)}


def video_do_modulo(m: dict, anterior: dict | None) -> dict:
    """Vídeo curto de abertura do módulo: resumo do módulo anterior, apresentação
    do novo módulo e o seu conteúdo programático. Tem o formato de uma aula
    (titulo, objetivos, blocos, video) para usar o mesmo leitor de vídeo."""
    blocos = []
    if anterior:
        blocos.append({"tipo": "texto", "titulo": f"Resumo do módulo anterior: {anterior['codigo']} — {anterior['titulo']}",
                       "html": "<p>No módulo anterior aprendeu a:</p><ul>" + "".join(f"<li>{o}.</li>" for o in anterior["objetivos"]) + "</ul>"
                               + "<p>Os temas foram: " + "; ".join(anterior["temas"]) + ".</p>"})
    else:
        blocos.append({"tipo": "texto", "titulo": "Bem-vindo ao curso",
                       "html": "<p>Este é o primeiro módulo. Começamos do zero: não precisa de saber nada antes.</p>"})
    blocos.append({"tipo": "texto", "titulo": f"Apresentação: {m['codigo']} — {m['titulo']}",
                   "html": f"<p>Este módulo tem {len(m['licoes'])} aula{'s' if len(m['licoes']) != 1 else ''} e cerca de {m['horas']} horas de estudo, com teoria, prática, exercícios e um teste no fim.</p>"
                           "<p>No fim do módulo vai ser capaz de:</p><ul>" + "".join(f"<li>{o}.</li>" for o in m["objetivos"]) + "</ul>"})
    blocos.append({"tipo": "tabela", "titulo": "Conteúdo programático do módulo", "cabecalho": ["N.º", "Tema"],
                   "linhas": [[str(k + 1), t] for k, t in enumerate(m["temas"])]})
    blocos.append({"tipo": "tabela", "titulo": "Aulas", "cabecalho": ["Aula", "Título", "Minutos"],
                   "linhas": [[str(k + 1), l["titulo"], str(l["minutos"])] for k, l in enumerate(m["licoes"])]})
    pratica = ["10 exercícios obrigatórios em cada aula (e mais, se quiser)", "ficha de trabalho"]
    if m.get("sim"):
        pratica.append(f"{len(m['sim'])} prática{'s' if len(m['sim']) != 1 else ''} no simulador de rede")
    if m.get("estagio"):
        pratica.append("estágio profissional numa empresa")
    pratica.append("teste final do módulo")
    blocos.append({"tipo": "texto", "titulo": "Como vai estudar",
                   "html": "<p>Em cada aula: veja a vídeo-aula, leia o conteúdo, faça o quiz e os exercícios. Depois:</p><ul>" + "".join(f"<li>{x}.</li>" for x in pratica) + "</ul>"})
    l = {"id": "apresentacao_" + m["id"], "titulo": f"{m['codigo']} — {m['titulo']}", "objetivos": m["objetivos"], "blocos": blocos, "quiz": []}
    ctx = {"objetivos": [], "usados": set(), "n": 0}
    cenas = [_ritmo({"tipo": "abertura", "bloco": -1, "titulo": l["titulo"],
                     "falas": [fala(f"Módulo {m['codigo']}: {m['titulo']}.", mostrar=l["titulo"], ideia=0), fala("Vídeo de apresentação do módulo.", ideia=0)]})]
    for i, b in enumerate(blocos):
        c = _cena_bloco(i, b, ctx)
        if c and c["falas"]:
            ctx["n"] += 1
            cenas.append(_ritmo(c))
    cenas.append(_ritmo({"tipo": "fecho", "bloco": -1, "titulo": "Vamos começar",
                         "falas": [fala("Agora já conhece o plano do módulo.", ideia=0), fala("Comece pela primeira aula. Bom estudo!", ideia=0)]}))
    l["video"] = {"cenas": cenas, "segundos": _tempos(cenas)}
    return l


# ---------------------------------------------------------------------------
# Leitura da aula pelo assistente (texto corrido, sem as pausas da vídeo-aula)
# ---------------------------------------------------------------------------

def _frase(t: str) -> str:
    t = t.strip()
    return t if not t or t[-1] in ".!?:;" else t + "."


def _linhas_codigo(html: str) -> list[str]:
    out = []
    for bruto in re.findall(r"<pre>(.*?)</pre>", html, flags=re.S):
        for linha in _html.unescape(re.sub(r"<[^>]+>", "", bruto)).split("\n"):
            linha = linha.strip()
            if linha:
                out.append(linha)
    return out


def _partes_bloco(b: dict) -> list[tuple[str, str]]:
    """Lista de (texto mostrado, texto falado) de um bloco, pela ordem de leitura."""
    tipo, P = b["tipo"], []
    def add(t, comando=False, falado=None):
        t = _frase(_pontuar(t))
        if t:
            P.append((t, falado if falado is not None else falar_bem(t, comando)))
    if tipo in ("texto", "exemplo"):
        if b.get("titulo"):
            add(("Exemplo: " if tipo == "exemplo" else "") + b["titulo"])
        for f in frases(b["html"]):
            add(f)
        cod = _linhas_codigo(b["html"])
        if cod:
            add("No ecrã está o exemplo, linha a linha")
            for c in cod[:12]:
                P.append((c, _frase(falar_bem(c, True))))
    elif tipo in ("dica", "alerta"):
        fs = frases(b["html"])
        for k, f in enumerate(fs):
            add(("Dica: " if tipo == "dica" else "Atenção: ") + f if k == 0 else f)
    elif tipo in ("figura", "topologia"):
        add(b["legenda"])
    elif tipo == "tabela":
        add(("Tabela: " + b["titulo"]) if b.get("titulo") else "Tabela")
        cab = b["cabecalho"]
        for linha in b["linhas"]:
            partes = [_limpar(linha[0])] + [f"{_limpar(cab[j])}: {_limpar(linha[j])}" for j in range(1, len(linha)) if linha[j] and cab[j]]
            add(", ".join(p.rstrip(".") for p in partes if p))
    elif tipo == "cli":
        add(b["titulo"])
        for k, p in enumerate(b["passos"]):
            mostrado = f"Passo {k + 1}: {p['prompt']} {p['cmd']}" + (f" — {p['explica']}" if p["explica"] else "")
            if re.search(r"[#>$]$", p["prompt"].strip()):
                falado = f"Passo {k + 1}: escreva {falar_bem(p['cmd'], True)}." + (" " + _frase(falar_bem(p["explica"])) if p["explica"] else "")
            else:
                falado = _frase(falar_bem(f"Passo {k + 1}: {p['cmd']}")) + (" " + _frase(falar_bem(p["explica"])) if p["explica"] else "")
            P.append((_frase(mostrado), falado))
        if b.get("nota"):
            add(_limpar(b["nota"]))
    elif tipo == "saida":
        add(b["titulo"] + ". A saída do comando está no ecrã")
        for f in frases(b.get("explica") or ""):
            add(f)
    elif tipo == "sim_real":
        add(b["titulo"].replace("×", "comparado com"))
        add("No simulador")
        for x in b["simulador"]:
            add(_limpar(x))
        add("No equipamento real")
        for x in b["real"]:
            add(_limpar(x))
    elif tipo == "jogo_cabo":
        add(f"Prática: monte o conector {b['norma']} fio a fio, do pino 1 ao 8")
    return P


def leitura_da_licao(l: dict, termos: list[dict] | None = None, maximo: int = 230) -> list[dict]:
    """Divide a aula em trechos de leitura contínua (cada trecho tem algumas frases do
    mesmo bloco, até ~230 caracteres, para a voz não cortar e não haver pausas a meio)."""
    blocos = [(-1, [(_frase(l["titulo"]), _frase(falar_bem("Aula: " + l["titulo"])))] +
               [(_frase("Objetivos: " + "; ".join(l["objetivos"])), _frase(falar_bem("Nesta aula vai aprender a: " + "; ".join(l["objetivos"]))))])]
    blocos += [(i, _partes_bloco(b)) for i, b in enumerate(l["blocos"])]
    if termos:
        blocos.append((-2, [("Termos técnicos desta aula.", "Termos técnicos desta aula.")] +
                       [(_frase(f"{t['termo']}: {t['def']}"), _frase(falar_bem(f"{t['termo']}" + (f", {t['extenso']}" if t.get('extenso') else "") + f": {t['def']}"))) for t in termos]))
    out = []
    for b, partes in blocos:
        atual = None
        for t, f in partes:
            if atual and len(atual["t"]) + len(t) + 1 <= maximo:
                atual["t"] += " " + t; atual["f"] += " " + f
            else:
                atual = {"b": b, "t": t, "f": f}
                out.append(atual)
    return out
