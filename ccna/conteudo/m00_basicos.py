"""Aula da Parte A: porque os computadores precisam de comunicar."""

from .base import *

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
