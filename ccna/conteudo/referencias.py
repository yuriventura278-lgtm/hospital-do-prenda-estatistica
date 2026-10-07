"""Referências bibliográficas (formato ABNT simplificado).

As lições citam estas referências pela chave. Assim cada obra é escrita uma
só vez e a lista no fim de cada lição fica sempre consistente.
"""

REFERENCIAS = {
    # Livros
    "odom1": "ODOM, Wendell. CCNA 200-301 Official Cert Guide, Volume 1. 2. ed. Hoboken: Cisco Press, 2024.",
    "odom2": "ODOM, Wendell. CCNA 200-301 Official Cert Guide, Volume 2. 2. ed. Hoboken: Cisco Press, 2024.",
    "lammle": "LAMMLE, Todd. CCNA Certification Study Guide: Exam 200-301. Indianapolis: Sybex/Wiley, 2020.",
    "kurose": "KUROSE, James F.; ROSS, Keith W. Redes de computadores e a Internet: uma abordagem top-down. 8. ed. São Paulo: Pearson, 2021.",
    "tanenbaum": "TANENBAUM, Andrew S.; FEAMSTER, Nick; WETHERALL, David. Redes de computadores. 6. ed. Porto Alegre: Bookman, 2021.",
    "comer": "COMER, Douglas E. Redes de computadores e Internet. 6. ed. Porto Alegre: Bookman, 2016.",
    "edgeworth": "EDGEWORTH, Brad; GARZA RIOS, Ramiro; GOOLEY, Jason; HUCABY, David. CCNP and CCIE Enterprise Core ENCOR 350-401 Official Cert Guide. 2. ed. Hoboken: Cisco Press, 2023.",
    "edelman": "EDELMAN, Jason; LOWE, Scott S.; OSWALT, Matt. Network Programmability and Automation. 2. ed. Sebastopol: O'Reilly, 2023.",

    # Cisco
    "netacad_itn": "CISCO NETWORKING ACADEMY. CCNA: Introduction to Networks (ITN). Disponível em: https://www.netacad.com. Acesso em: 2026.",
    "netacad_srwe": "CISCO NETWORKING ACADEMY. CCNA: Switching, Routing, and Wireless Essentials (SRWE). Disponível em: https://www.netacad.com. Acesso em: 2026.",
    "netacad_ensa": "CISCO NETWORKING ACADEMY. CCNA: Enterprise Networking, Security, and Automation (ENSA). Disponível em: https://www.netacad.com. Acesso em: 2026.",
    "cisco_exam": "CISCO SYSTEMS. CCNA Exam Topics (200-301 v1.1). Disponível em: https://learningnetwork.cisco.com. Acesso em: 2026.",
    "cisco_ios": "CISCO SYSTEMS. Cisco IOS Configuration Fundamentals Configuration Guide. Disponível em: https://www.cisco.com/c/en/us/support/index.html. Acesso em: 2026.",
    "cisco_pt": "CISCO NETWORKING ACADEMY. Cisco Packet Tracer. Disponível em: https://www.netacad.com/cisco-packet-tracer. Acesso em: 2026.",
    "cisco_devnet": "CISCO DEVNET. Network Automation and Programmability. Disponível em: https://developer.cisco.com. Acesso em: 2026.",

    # Normas IEEE
    "ieee8023": "IEEE. IEEE 802.3: Standard for Ethernet. New York: IEEE, 2022.",
    "ieee8021q": "IEEE. IEEE 802.1Q: Bridges and Bridged Networks (VLAN). New York: IEEE, 2022.",
    "ieee8021d": "IEEE. IEEE 802.1D: MAC Bridges (Spanning Tree Protocol). New York: IEEE, 2004.",
    "ieee8021w": "IEEE. IEEE 802.1w: Rapid Reconfiguration of Spanning Tree. New York: IEEE, 2001.",
    "ieee8021ax": "IEEE. IEEE 802.1AX: Link Aggregation. New York: IEEE, 2020.",
    "ieee80211": "IEEE. IEEE 802.11: Wireless LAN Medium Access Control (MAC) and Physical Layer (PHY) Specifications. New York: IEEE, 2020.",
    "ieee8021x": "IEEE. IEEE 802.1X: Port-Based Network Access Control. New York: IEEE, 2020.",
    "iso7498": "ISO/IEC. ISO/IEC 7498-1: Open Systems Interconnection – Basic Reference Model. Genebra: ISO, 1994.",
    "tia568": "TIA. ANSI/TIA-568.2-D: Balanced Twisted-Pair Telecommunications Cabling and Components Standard. Arlington: TIA, 2018.",

    # RFCs
    "rfc768": "POSTEL, J. RFC 768: User Datagram Protocol. IETF, 1980.",
    "rfc791": "POSTEL, J. RFC 791: Internet Protocol. IETF, 1981.",
    "rfc792": "POSTEL, J. RFC 792: Internet Control Message Protocol. IETF, 1981.",
    "rfc826": "PLUMMER, D. RFC 826: An Ethernet Address Resolution Protocol. IETF, 1982.",
    "rfc950": "MOGUL, J.; POSTEL, J. RFC 950: Internet Standard Subnetting Procedure. IETF, 1985.",
    "rfc1918": "REKHTER, Y. et al. RFC 1918: Address Allocation for Private Internets. IETF, 1996.",
    "rfc4632": "FULLER, V.; LI, T. RFC 4632: Classless Inter-domain Routing (CIDR). IETF, 2006.",
    "rfc9293": "EDDY, W. (ed.). RFC 9293: Transmission Control Protocol (TCP). IETF, 2022.",
    "rfc8200": "DEERING, S.; HINDEN, R. RFC 8200: Internet Protocol, Version 6 (IPv6) Specification. IETF, 2017.",
    "rfc4291": "HINDEN, R.; DEERING, S. RFC 4291: IP Version 6 Addressing Architecture. IETF, 2006.",
    "rfc4861": "NARTEN, T. et al. RFC 4861: Neighbor Discovery for IP version 6. IETF, 2007.",
    "rfc4862": "THOMSON, S.; NARTEN, T.; JINMEI, T. RFC 4862: IPv6 Stateless Address Autoconfiguration. IETF, 2007.",
    "rfc2328": "MOY, J. RFC 2328: OSPF Version 2. IETF, 1998.",
    "rfc2281": "LI, T. et al. RFC 2281: Cisco Hot Standby Router Protocol (HSRP). IETF, 1998.",
    "rfc5798": "NADAS, S. (ed.). RFC 5798: Virtual Router Redundancy Protocol (VRRP) Version 3. IETF, 2010.",
    "rfc2131": "DROMS, R. RFC 2131: Dynamic Host Configuration Protocol. IETF, 1997.",
    "rfc3022": "SRISURESH, P.; EGEVANG, K. RFC 3022: Traditional IP Network Address Translator (Traditional NAT). IETF, 2001.",
    "rfc1034": "MOCKAPETRIS, P. RFC 1034: Domain Names – Concepts and Facilities. IETF, 1987.",
    "rfc5905": "MILLS, D. et al. RFC 5905: Network Time Protocol Version 4. IETF, 2010.",
    "rfc5424": "GERHARDS, R. RFC 5424: The Syslog Protocol. IETF, 2009.",
    "rfc3411": "HARRINGTON, D.; PRESUHN, R.; WIJNEN, B. RFC 3411: An Architecture for Describing SNMP Management Frameworks. IETF, 2002.",
    "rfc2474": "NICHOLS, K. et al. RFC 2474: Definition of the Differentiated Services Field (DS Field). IETF, 1998.",
    "rfc4253": "YLONEN, T.; LONVICK, C. RFC 4253: The Secure Shell (SSH) Transport Layer Protocol. IETF, 2006.",
    "rfc4301": "KENT, S.; SEO, K. RFC 4301: Security Architecture for the Internet Protocol. IETF, 2005.",
    "rfc6241": "ENNS, R. et al. RFC 6241: Network Configuration Protocol (NETCONF). IETF, 2011.",
    "rfc8040": "BIERMAN, A.; BJORKLUND, M.; WATSEN, K. RFC 8040: RESTCONF Protocol. IETF, 2017.",
    "rfc8259": "BRAY, T. (ed.). RFC 8259: The JavaScript Object Notation (JSON) Data Interchange Format. IETF, 2017.",
    "rfc2865": "RIGNEY, C. et al. RFC 2865: Remote Authentication Dial In User Service (RADIUS). IETF, 2000.",
    "rfc8907": "DAHM, T. et al. RFC 8907: The TACACS+ Protocol. IETF, 2020.",

    # Ferramentas
    "netmiko": "BYERS, Kirk. Netmiko: Multi-vendor library to simplify CLI connections to network devices. Disponível em: https://github.com/ktbyers/netmiko. Acesso em: 2026.",
    "ansible": "RED HAT. Ansible Network Automation Documentation. Disponível em: https://docs.ansible.com. Acesso em: 2026.",
    "wifi_alliance": "WI-FI ALLIANCE. WPA3 Specification. Disponível em: https://www.wi-fi.org. Acesso em: 2026.",
    "nist": "NIST. SP 800-63B: Digital Identity Guidelines – Authentication and Lifecycle Management. Gaithersburg: NIST, 2017.",

    # História e computadores
    "leiner": "LEINER, Barry M. et al. A brief history of the Internet. ACM SIGCOMM Computer Communication Review, v. 39, n. 5, p. 22-31, 2009.",
    "isaacson": "ISAACSON, Walter. Os inovadores: uma biografia da revolução digital. São Paulo: Companhia das Letras, 2014.",
    "cerf_kahn": "CERF, Vinton G.; KAHN, Robert E. A Protocol for Packet Network Intercommunication. IEEE Transactions on Communications, v. 22, n. 5, p. 637-648, 1974.",
    "metcalfe": "METCALFE, Robert M.; BOGGS, David R. Ethernet: Distributed Packet Switching for Local Computer Networks. Communications of the ACM, v. 19, n. 7, p. 395-404, 1976.",
    "berners_lee": "BERNERS-LEE, Tim. Information Management: A Proposal. Genebra: CERN, 1989.",
    "rfc1": "CROCKER, S. RFC 1: Host Software. IETF, 1969.",
    "tanenbaum_org": "TANENBAUM, Andrew S.; AUSTIN, Todd. Organização estruturada de computadores. 6. ed. São Paulo: Pearson, 2013.",
    "patterson": "PATTERSON, David A.; HENNESSY, John L. Organização e projeto de computadores: a interface hardware/software. 5. ed. Rio de Janeiro: Elsevier, 2017.",
}
