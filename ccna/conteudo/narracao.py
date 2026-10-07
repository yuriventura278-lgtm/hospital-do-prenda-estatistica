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
    "anycast": "énicast", "link-local": "línk lôucal", "unique": "iuníque", "global": "glôbal", "local": "lôcal",
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


def _soletrar(s: str) -> str:
    return " ".join(ch for ch in s if ch.strip())


def _ip(m: re.Match) -> str:
    falado = " ponto ".join(str(int(o)) for o in m.group(1).split("."))
    return falado + (f" barra {m.group(2)[1:]}" if m.group(2) else "")


def _ipv6(m: re.Match) -> str:
    txt = m.group(0)
    partes = re.split(r"(::|:|/)", txt)
    out = []
    for p in partes:
        if p == "::":
            out.append("dois pontos dois pontos")
        elif p == ":":
            out.append("dois pontos")
        elif p == "/":
            out.append("barra")
        elif p:
            out.append(p if p.isdigit() else _soletrar(p.lower()))
    return " ".join(out)


def _interface(m: re.Match) -> str:
    nome = INTERFACES.get(m.group(1).lower(), m.group(1))
    num = " barra ".join(m.group(2).split("/"))
    sub = f" ponto {m.group(3)}" if m.group(3) else ""
    return f"{nome} {num}{sub}"


def falar(texto: str, comando: bool = False) -> str:
    """Converte um texto para a forma como deve ser dito em voz alta."""
    t = texto
    dic = COMANDOS if comando else PALAVRAS
    # símbolos e abreviaturas
    t = t.replace("…", "...").replace("“", "").replace("”", "").replace("«", "").replace("»", "")
    t = re.sub(r"\bex\.:?", "por exemplo,", t, flags=re.I)
    t = re.sub(r"\ba\.C\.", "antes de Cristo", t)
    t = re.sub(r"\betc\.", "etcétera", t)
    t = re.sub(r"\bn\.º\s*", "número ", t)
    t = re.sub(r"(\d)\.ª", lambda m: ORDINAIS.get(m.group(1), m.group(1) + ".ª"), t)
    t = re.sub(r"(\d)\.º", lambda m: ORDINAIS_M.get(m.group(1), m.group(1) + ".º"), t)
    t = re.sub(r"\b0x([0-9A-Fa-f]+)\b", lambda m: "zero xis " + _soletrar(m.group(1)), t)
    t = re.sub(r"\b802\.(\d+)([A-Za-z]{0,3})\b", lambda m: "oito zero dois ponto " + m.group(1) + (" " + _soletrar(m.group(2).upper()) if m.group(2) else ""), t)
    # endereços
    t = re.sub(r"\b([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}\b", lambda m: _soletrar(m.group(0).replace(":", " ").replace("-", " ").lower()), t)
    t = re.sub(r"\b[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\b", lambda m: " ponto ".join(_soletrar(g.lower()) for g in m.group(0).split(".")), t)
    t = re.sub(r"\b(\d{1,3}(?:\.\d{1,3}){3})(/\d{1,2})?\b", _ip, t)
    t = re.sub(r"(?<![\w:])(?:[0-9A-Fa-f]{1,4})?(?:::?[0-9A-Fa-f]{1,4}){1,7}(?:::)?(?:/\d{1,3})?(?![\w:])", lambda m: _ipv6(m) if ":" in m.group(0) and re.search(r"[A-Fa-f]|::|\d{3,}", m.group(0)) else m.group(0), t)
    t = re.sub(r"(?<![\w/])/(\d{1,3})\b", r"barra \1", t)
    t = re.sub(r"\b(gigabitethernet|fastethernet|serial|loopback|port-channel|vlan|gi|fa|se|lo|po|g|f|s)\s?(\d+(?:/\d+)+)(?:\.(\d+))?", _interface, t, flags=re.I)
    # unidades
    for a, b in UNIDADES:
        t = t.replace(a, b)
    t = re.sub(r"(\d)\s?(TB|GB|MB|KB|km|ms|min|bits|W|B|m|s|h)\b", lambda m: m.group(1) + " " + UNIDADES_APOS_NUMERO[m.group(2)], t)
    t = re.sub(r"(\d)\s?%", r"\1 por cento", t)
    t = re.sub(r"(\d)\^(\w+)", r"\1 elevado a \2", t)
    # operadores e setas
    t = t.replace("›", ", ").replace("→", ", e depois, ").replace("↔", " e ").replace("×", " vezes ").replace("÷", " a dividir por ")
    if comando:
        t = re.sub(r"\s-\s", " até ", t)
    t = re.sub(r"(\d)/(\d)", r"\1 e \2", t)
    t = re.sub(r"\s−\s|\s-\s", " menos ", t)
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
            return _soletrar(base)
        if re.fullmatch(r"[A-Z]{1,3}\d[A-Za-z0-9]*", w):  # WPA2, SHA256
            return _soletrar(re.sub(r"(\d+)", r" \1 ", w))
        return w

    t = re.sub(r"[A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9+\-:]*[A-Za-zÀ-ÿ0-9+]|[A-Za-zÀ-ÿ]", lambda m: palavra(m) if m.group(0) not in ("-",) else m.group(0), t)
    return re.sub(r"\s{2,}", " ", t).strip(" ,")


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


def fala(texto: str, comando: bool = False, mostrar: str | None = None) -> dict:
    texto = _pontuar(texto)
    return {"t": _pontuar(mostrar) if mostrar is not None else texto, "f": falar(texto, comando)}


# ---------------------------------------------------------------------------
# Lição → cenas
# ---------------------------------------------------------------------------

def _cena_bloco(i: int, b: dict) -> dict | None:
    tipo = b["tipo"]
    if tipo in ("texto", "exemplo"):
        falas = []
        if b.get("titulo"):
            falas.append(fala(("Exemplo: " if tipo == "exemplo" else "") + b["titulo"] + "."))
        falas += [fala(f) for f in frases(b["html"])]
        for cod in _codigo(b["html"]):
            linhas = [l for l in cod.split("\n") if l.strip()]
            falas.append({"t": "(veja o código no ecrã)", "f": f"Observe com atenção o exemplo no ecrã. Tem {len(linhas)} linhas. Leia-o calmamente antes de continuar.", "pausa": min(12, 2 + len(linhas))})
        return {"tipo": tipo, "bloco": i, "titulo": b.get("titulo", ""), "falas": falas}
    if tipo in ("dica", "alerta"):
        prefixo = "Dica: " if tipo == "dica" else "Atenção: "
        fs = frases(b["html"])
        falas = [fala(prefixo + fs[0], mostrar=prefixo + fs[0])] + [fala(f) for f in fs[1:]] if fs else []
        return {"tipo": tipo, "bloco": i, "titulo": "Dica" if tipo == "dica" else "Atenção", "falas": falas}
    if tipo == "figura":
        return {"tipo": tipo, "bloco": i, "titulo": "", "falas": [fala("Observe a ilustração. " + b["legenda"], mostrar=b["legenda"])]}
    if tipo == "topologia":
        nomes = {n["id"]: n["rotulo"] for n in b["nos"]}
        falas = [fala("Observe o diagrama. " + b["legenda"], mostrar=b["legenda"])]
        if b["ligacoes"]:
            for l in b["ligacoes"]:
                txt = f"{nomes[l['a']]} liga a {nomes[l['b']]}" + (f", por {l['rotulo']}" if l["rotulo"] else "") + "."
                falas.append(fala(txt))
        else:
            falas.append(fala("Neste diagrama vê: " + ", ".join(nomes.values()) + "."))
        return {"tipo": tipo, "bloco": i, "titulo": "", "falas": falas}
    if tipo == "tabela":
        falas = [fala(f"Tabela: {b['titulo']}.")] if b.get("titulo") else [fala("Vamos ver esta tabela, linha a linha.", mostrar="Tabela")]
        cab = b["cabecalho"]
        for r, linha in enumerate(b["linhas"]):
            partes = [linha[0]] + [f"{cab[j]}: {linha[j]}" for j in range(1, len(linha)) if linha[j] and cab[j]]
            if cab[0] and not cab[0].strip().endswith("=") and cab[0] not in ("", "#"):
                partes[0] = f"{linha[0]}"
            txt = ". ".join(p.rstrip(".") for p in partes if p) + "."
            falas.append(dict(fala(txt), linha=r))
        return {"tipo": tipo, "bloco": i, "titulo": b.get("titulo", ""), "falas": falas}
    if tipo == "cli":
        falas = [fala(b["titulo"] + ". Vamos passo a passo.", mostrar=b["titulo"])]
        for k, p in enumerate(b["passos"]):
            explica = (" " + p["explica"]) if p["explica"] else ""
            if re.search(r"[#>]$", p["prompt"].strip()):
                falas.append({"t": f"{p['prompt']} {p['cmd']}", "f": f"Passo {k + 1}. Escreva: {falar(p['cmd'], True)}.{(' ' + falar(p['explica'])) if p['explica'] else ''}", "passo": k})
            else:
                falas.append(dict(fala(f"Passo {k + 1}. {p['cmd']}.{explica}"), passo=k))
        if b.get("nota"):
            falas.append(fala(_limpar(b["nota"])))
        return {"tipo": tipo, "bloco": i, "titulo": b["titulo"], "falas": falas}
    if tipo == "saida":
        falas = [fala(b["titulo"] + ".", mostrar=b["titulo"]),
                 {"t": "(observe a saída do comando)", "f": "Observe no ecrã a saída do comando, tal como aparece no equipamento.", "pausa": 4}]
        if b.get("explica"):
            falas += [fala(f) for f in frases(b["explica"])]
        return {"tipo": tipo, "bloco": i, "titulo": b["titulo"], "falas": falas}
    if tipo == "sim_real":
        falas = [fala(b["titulo"].replace("×", "comparado com") + ".", mostrar=b["titulo"]), fala("No simulador:")]
        falas += [dict(fala(_limpar(x)), lado="sim", item=k) for k, x in enumerate(b["simulador"])]
        falas.append(fala("No equipamento real:"))
        falas += [dict(fala(_limpar(x)), lado="real", item=k) for k, x in enumerate(b["real"])]
        return {"tipo": tipo, "bloco": i, "titulo": b["titulo"], "falas": falas}
    return None


def video_da_licao(l: dict, modulo: dict) -> dict:
    cenas = [{
        "tipo": "abertura", "bloco": -1, "titulo": l["titulo"],
        "falas": [fala(f"Módulo {modulo['numero']}. Aula: {l['titulo']}.", mostrar=l["titulo"]),
                  fala("Nesta aula vai aprender a:")] + [dict(fala(o + "."), item=k) for k, o in enumerate(l["objetivos"])],
    }]
    for i, b in enumerate(l["blocos"]):
        c = _cena_bloco(i, b)
        if c and c["falas"]:
            cenas.append(c)
    cenas.append({
        "tipo": "fecho", "bloco": -1, "titulo": "Resumo",
        "falas": [fala("Resumo da aula. Agora já sabe:")] + [dict(fala(o + "."), item=k) for k, o in enumerate(l["objetivos"])]
                 + [fala(f"Faça agora o quiz de {len(l['quiz'])} perguntas para confirmar o que aprendeu. Se tiver dúvidas, repita a aula. As referências bibliográficas estão no fim da lição.")],
    })
    palavras = sum(len(f["f"].split()) for c in cenas for f in c["falas"])
    return {"cenas": cenas, "segundos": round(palavras / 2.4 + sum(f.get("pausa", 0) for c in cenas for f in c["falas"]))}
