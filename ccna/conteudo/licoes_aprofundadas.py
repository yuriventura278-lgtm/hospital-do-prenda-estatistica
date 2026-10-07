"""Aulas aprofundadas: conversões, classes, OSI, TCP/IP, máscaras e sub-redes."""
from .base import *
LICOES = {}
def reg(l):
    LICOES[l["id"]] = l
    return l


# ---------------------------------------------------------------------------
# 1. Conversão decimal <-> binário
# ---------------------------------------------------------------------------

reg(licao(
    "n_conv_bin", "Conversão decimal ↔ binário, passo a passo", 30,
    ["Explicar o que é um bit, um byte e um octeto",
     "Perceber de onde vêm os pesos 128 64 32 16 8 4 2 1",
     "Converter de decimal para binário por subtração e por divisões sucessivas",
     "Converter de binário para decimal somando pesos",
     "Converter um endereço IPv4 inteiro e reconhecer os valores de máscara"],
    [
        texto("Bit, byte e octeto: as peças mais pequenas", """
<p>Um computador só sabe guardar dois estados: <b>ligado</b> ou <b>desligado</b>, como um interruptor de luz. A cada um destes interruptores chamamos <b>bit</b> (de <b>binary digit</b>, dígito binário). Um bit vale <code>1</code> (ligado) ou <code>0</code> (desligado). Nada mais.</p>
<p>Sozinho, um bit diz muito pouco (sim ou não). Por isso juntam-se bits em grupos:</p>
<ul>
<li><b>Byte</b>: um grupo de <b>8 bits</b>. É a unidade com que se mede o tamanho de um ficheiro (KB, MB, GB).</li>
<li><b>Octeto</b>: também 8 bits. Em redes dizemos “octeto” porque a palavra é exata: <b>oct</b> = oito. Um endereço IPv4 tem <b>4 octetos</b> = 32 bits.</li>
</ul>
<p>Com 8 bits conseguimos escrever 2 × 2 × 2 × 2 × 2 × 2 × 2 × 2 = <b>256</b> combinações diferentes, do <code>00000000</code> (0) ao <code>11111111</code> (255). É por isso que cada número de um endereço IP vai de <b>0 a 255</b> e nunca passa disso.</p>"""),
        texto("Porque é que os pesos são 128 64 32 16 8 4 2 1", """
<p>Pense no sistema que usamos todos os dias, o <b>decimal</b> (base 10). No número <b>347</b> cada algarismo tem um “peso” conforme a posição:</p>
<ul>
<li>o 7 está na casa das <b>unidades</b> (peso 1 = 10<sup>0</sup>);</li>
<li>o 4 está na casa das <b>dezenas</b> (peso 10 = 10<sup>1</sup>);</li>
<li>o 3 está na casa das <b>centenas</b> (peso 100 = 10<sup>2</sup>).</li>
</ul>
<p>Logo 347 = 3×100 + 4×10 + 7×1. Cada casa vale <b>10 vezes</b> a casa à sua direita, porque temos 10 algarismos (0 a 9).</p>
<p>No <b>binário</b> (base 2) só há 2 algarismos (0 e 1), por isso cada casa vale <b>2 vezes</b> a casa à sua direita. Começando pela direita: 1, 2, 4, 8, 16, 32, 64, 128. São as <b>potências de 2</b>: 2<sup>0</sup>=1, 2<sup>1</sup>=2, 2<sup>2</sup>=4 … 2<sup>7</sup>=128.</p>
<p>Repare: 128+64+32+16+8+4+2+1 = <b>255</b>, o maior valor de um octeto.</p>"""),
        tabela(["Posição (da esquerda)", "1.ª", "2.ª", "3.ª", "4.ª", "5.ª", "6.ª", "7.ª", "8.ª"], [
            ["Potência", "2⁷", "2⁶", "2⁵", "2⁴", "2³", "2²", "2¹", "2⁰"],
            ["Peso", "128", "64", "32", "16", "8", "4", "2", "1"],
        ], "A tabela de pesos de um octeto — escreva-a sempre num papel antes de começar"),
        texto("Método 1: subtração com a tabela (o mais rápido)", """
<p>Para converter um número decimal em binário, percorremos os pesos da <b>esquerda para a direita</b> e, para cada um, fazemos uma pergunta: <b>“o peso cabe no que resta?”</b></p>
<ol>
<li>Se <b>cabe</b> (o resto é maior ou igual ao peso): escrevemos <code>1</code> e subtraímos o peso.</li>
<li>Se <b>não cabe</b>: escrevemos <code>0</code> e o resto fica igual.</li>
<li>Passamos ao peso seguinte até chegar ao 1. No fim, o resto tem de ser 0.</li>
</ol>
<p>É como pagar uma conta com notas de 128, 64, 32… kwanzas: usa sempre a nota maior que ainda cabe, e só uma de cada.</p>"""),
        tabela(["Peso", "Resto antes", "Cabe?", "Bit", "Resto depois"], [
            ["128", "172", "sim (172 ≥ 128)", "1", "172 − 128 = 44"],
            ["64", "44", "não", "0", "44"],
            ["32", "44", "sim", "1", "44 − 32 = 12"],
            ["16", "12", "não", "0", "12"],
            ["8", "12", "sim", "1", "12 − 8 = 4"],
            ["4", "4", "sim", "1", "4 − 4 = 0"],
            ["2", "0", "não", "0", "0"],
            ["1", "0", "não", "0", "0"],
        ], "Exemplo 1: 172 → 10101100"),
        exemplo("Exemplos 2 a 5: 10, 255, 192 e 168", """
<p><b>10</b>: 128 não cabe (0), 64 não (0), 32 não (0), 16 não (0), 8 cabe (1, resta 2), 4 não (0), 2 cabe (1, resta 0), 1 não (0). → <code>00001010</code>. Verificação: 8 + 2 = 10.</p>
<p><b>255</b>: 128 cabe (resta 127), 64 cabe (resta 63), 32 cabe (resta 31), 16 cabe (resta 15), 8 cabe (resta 7), 4 cabe (resta 3), 2 cabe (resta 1), 1 cabe (resta 0). → <code>11111111</code>. Todos os bits ligados.</p>
<p><b>192</b>: 128 cabe (resta 64), 64 cabe (resta 0), e todos os outros são 0. → <code>11000000</code>. Verificação: 128 + 64 = 192.</p>
<p><b>168</b>: 128 cabe (resta 40), 64 não (0), 32 cabe (resta 8), 16 não (0), 8 cabe (resta 0), 4, 2 e 1 não. → <code>10101000</code>. Verificação: 128 + 32 + 8 = 168.</p>"""),
        exemplo("Exemplos 6 a 10: 0, 1, 224, 248 e 252", """
<p><b>0</b>: nenhum peso cabe em 0 → <code>00000000</code>.</p>
<p><b>1</b>: só o último peso (1) cabe → <code>00000001</code>.</p>
<p><b>224</b>: 128 cabe (resta 96), 64 cabe (resta 32), 32 cabe (resta 0), o resto é 0 → <code>11100000</code>. Verificação: 128 + 64 + 32 = 224.</p>
<p><b>248</b>: 128 (resta 120), 64 (resta 56), 32 (resta 24), 16 (resta 8), 8 (resta 0) → <code>11111000</code>. Verificação: 128+64+32+16+8 = 248.</p>
<p><b>252</b>: 128 (resta 124), 64 (resta 60), 32 (resta 28), 16 (resta 12), 8 (resta 4), 4 (resta 0) → <code>11111100</code>. Verificação: 248 + 4 = 252.</p>"""),
        texto("Método 2: divisões sucessivas por 2", """
<p>Este método funciona para qualquer número, mesmo maior que 255. Divide-se o número por 2, anota-se o <b>resto</b> (0 ou 1) e volta-se a dividir o <b>quociente</b> por 2, até o quociente ser 0. No fim, lêem-se os restos <b>de baixo para cima</b>.</p>
<p>Exemplo com <b>37</b>:</p>
<ul>
<li>37 ÷ 2 = 18, resto <b>1</b></li>
<li>18 ÷ 2 = 9, resto <b>0</b></li>
<li>9 ÷ 2 = 4, resto <b>1</b></li>
<li>4 ÷ 2 = 2, resto <b>0</b></li>
<li>2 ÷ 2 = 1, resto <b>0</b></li>
<li>1 ÷ 2 = 0, resto <b>1</b></li>
</ul>
<p>Lendo os restos de baixo para cima: <code>100101</code>. Como um octeto tem 8 bits, acrescentam-se zeros à <b>esquerda</b>: <code>00100101</code>. Verificação: 32 + 4 + 1 = 37.</p>"""),
        texto("Binário → decimal: somar os pesos", """
<p>O caminho inverso é ainda mais fácil: escreve-se o número binário por baixo da tabela de pesos e <b>somam-se os pesos onde há um 1</b>. Onde há 0, ignora-se.</p>
<p>Exemplo: <code>11001000</code></p>
<ul>
<li>bit 1 debaixo do 128 → conta 128</li>
<li>bit 1 debaixo do 64 → conta 64</li>
<li>bit 0 debaixo do 32 e do 16 → nada</li>
<li>bit 1 debaixo do 8 → conta 8</li>
<li>bits 0 debaixo do 4, 2 e 1 → nada</li>
</ul>
<p>Total: 128 + 64 + 8 = <b>200</b>.</p>"""),
        tabela(["Octeto decimal", "128", "64", "32", "16", "8", "4", "2", "1", "Binário"], [
            ["192", "1", "1", "0", "0", "0", "0", "0", "0", "11000000"],
            ["168", "1", "0", "1", "0", "1", "0", "0", "0", "10101000"],
            ["10", "0", "0", "0", "0", "1", "0", "1", "0", "00001010"],
            ["37", "0", "0", "1", "0", "0", "1", "0", "1", "00100101"],
        ], "Endereço inteiro: 192.168.10.37 = 11000000.10101000.00001010.00100101"),
        tabela(["Decimal", "Binário", "Bits a 1", "Prefixo se for o último octeto da máscara"], [
            ["0", "00000000", "0", "/24 (ex.: 255.255.255.0)"],
            ["128", "10000000", "1", "/25"],
            ["192", "11000000", "2", "/26"],
            ["224", "11100000", "3", "/27"],
            ["240", "11110000", "4", "/28"],
            ["248", "11111000", "5", "/29"],
            ["252", "11111100", "6", "/30"],
            ["254", "11111110", "7", "/31"],
            ["255", "11111111", "8", "/32"],
        ], "Os únicos 9 valores possíveis num octeto de máscara"),
        dica("""Os valores de máscara obtêm-se somando os pesos da esquerda para a direita, um de cada vez: 128, 128+64 = 192, 192+32 = 224, 224+16 = 240, 240+8 = 248, 248+4 = 252, 252+2 = 254, 254+1 = 255. Decore esta sequência: vai usá-la em todos os cálculos de sub-redes."""),
        alerta("""<b>Erros típicos:</b>
<ul>
<li>Esquecer os <b>zeros à esquerda</b>: 10 é <code>00001010</code> num octeto, não apenas <code>1010</code>.</li>
<li>Ler os restos das divisões de <b>cima para baixo</b> (está ao contrário!).</li>
<li>Usar o mesmo peso duas vezes: cada peso só pode ser usado uma vez (é 0 ou 1).</li>
<li>Não confirmar: no fim, some os pesos dos bits a 1 e veja se dá o número original.</li>
</ul>"""),
    ],
    [
        valor("Quanto é 11000000 em decimal?", ["192"], "128 + 64 = 192."),
        valor("Escreva 172 em binário (8 bits).", ["10101100"], "128 + 32 + 8 + 4 = 172 → 10101100."),
        mc("Quantos bits tem um octeto?", ["8", "4", "16", "32"], 0, "Octeto = 8 bits, tal como um byte."),
        mc("Qual é o binário de 224?", ["11000000", "11110000", "11100000", "11111000"], 2, "128 + 64 + 32 = 224 → 11100000."),
        valor("Quanto é 00100101 em decimal?", ["37"], "32 + 4 + 1 = 37."),
        vf("O maior valor que cabe num octeto é 256.", False, "São 256 combinações, mas vão de 0 a 255. O maior valor é 255 (11111111)."),
        mc("No método das divisões sucessivas por 2, como se lêem os restos?", ["De cima para baixo", "De baixo para cima", "Só o primeiro resto", "Somam-se todos"], 1, "O último resto é o bit mais significativo, por isso lê-se de baixo para cima."),
        valor("Escreva 10 em binário com 8 bits.", ["00001010"], "8 + 2 = 10 → 00001010 (com os zeros à esquerda)."),
        mc("Qual destes valores NÃO pode aparecer num octeto de máscara?", ["252", "248", "250", "254"], 2, "250 = 11111010: os 1 não são contínuos. Os valores válidos são 0, 128, 192, 224, 240, 248, 252, 254, 255."),
        valor("Quanto é 11111100 em decimal?", ["252"], "128+64+32+16+8+4 = 252."),
    ],
    ["odom1", "netacad_itn", "comer"],
    nivel="básico",
))


# ---------------------------------------------------------------------------
# 2. Hexadecimal, MAC e IPv6
# ---------------------------------------------------------------------------

reg(licao(
    "n_conv_hex", "Hexadecimal e conversões para MAC e IPv6", 28,
    ["Explicar a base 16 e os dígitos 0 a F",
     "Converter entre hexadecimal, binário e decimal usando nibbles",
     "Ler um endereço MAC e identificar o fabricante (OUI)",
     "Escrever e comprimir endereços IPv6 pelas regras oficiais"],
    [
        texto("Base 16: quando 10 algarismos não chegam", """
<p>No decimal temos 10 algarismos (0 a 9). No binário temos 2 (0 e 1). No <b>hexadecimal</b> (abreviado <b>hex</b>, base 16) precisamos de <b>16</b> símbolos diferentes. Como só existem 10 algarismos, usam-se as letras <b>A a F</b> para os valores de 10 a 15:</p>
<ul>
<li>A = 10, B = 11, C = 12, D = 13, E = 14, F = 15.</li>
</ul>
<p>Tal como no decimal cada casa vale 10 vezes a anterior, no hex cada casa vale <b>16 vezes</b> a anterior. Os pesos, da direita para a esquerda, são 1, 16, 256 (16×16), 4096 (16×16×16)…</p>
<p>Para não confundir <code>10</code> hex (que vale 16) com <code>10</code> decimal, escreve-se muitas vezes <code>0x10</code> ou <code>10h</code>. O prefixo <code>0x</code> quer dizer “isto é hexadecimal”.</p>"""),
        texto("O nibble: a ponte entre hex e binário", """
<p>Um <b>nibble</b> é meio byte: <b>4 bits</b>. Com 4 bits fazemos 2×2×2×2 = <b>16</b> combinações (0000 a 1111), ou seja, exatamente os 16 dígitos do hex. Por isso <b>cada dígito hex corresponde a 4 bits</b>, sempre.</p>
<p>Consequência prática: um byte (8 bits) escreve-se sempre com <b>2 dígitos hex</b>. Converter é só partir o byte ao meio e traduzir cada metade pela tabela abaixo. Os pesos dentro de um nibble são <b>8 4 2 1</b>.</p>"""),
        tabela(["Hex", "Binário (8 4 2 1)", "Decimal"], [
            ["0", "0000", "0"], ["1", "0001", "1"], ["2", "0010", "2"], ["3", "0011", "3"],
            ["4", "0100", "4"], ["5", "0101", "5"], ["6", "0110", "6"], ["7", "0111", "7"],
            ["8", "1000", "8"], ["9", "1001", "9"], ["A", "1010", "10"], ["B", "1011", "11"],
            ["C", "1100", "12"], ["D", "1101", "13"], ["E", "1110", "14"], ["F", "1111", "15"],
        ], "Os 16 dígitos hexadecimais"),
        tabela(["Hex", "Nibble alto", "Nibble baixo", "Binário", "Decimal (dois caminhos)"], [
            ["0xC0", "C = 1100", "0 = 0000", "11000000", "12×16 + 0 = 192  ou  128+64 = 192"],
            ["0xFF", "F = 1111", "F = 1111", "11111111", "15×16 + 15 = 240 + 15 = 255"],
            ["0xA8", "A = 1010", "8 = 1000", "10101000", "10×16 + 8 = 160 + 8 = 168"],
            ["0x2F", "2 = 0010", "F = 1111", "00101111", "2×16 + 15 = 32 + 15 = 47"],
        ], "Hex → binário → decimal, passo a passo"),
        exemplo("Um número maior: 3E8 hex = 1000 decimal", """
<p><b>Hex → decimal</b>: cada dígito vezes o seu peso.</p>
<ul>
<li>3 está na casa dos 256 → 3 × 256 = 768</li>
<li>E (14) está na casa dos 16 → 14 × 16 = 224</li>
<li>8 está na casa das unidades → 8 × 1 = 8</li>
</ul>
<p>Soma: 768 + 224 + 8 = <b>1000</b>.</p>
<p><b>Decimal → hex</b> (o caminho inverso, por divisões sucessivas por 16):</p>
<ul>
<li>1000 ÷ 16 = 62, resto <b>8</b></li>
<li>62 ÷ 16 = 3, resto <b>14 = E</b></li>
<li>3 ÷ 16 = 0, resto <b>3</b></li>
</ul>
<p>Restos lidos de baixo para cima: <b>3E8</b>. Em binário: 3 = 0011, E = 1110, 8 = 1000 → <code>0011 1110 1000</code>.</p>"""),
        exemplo("Decimal → hex de um octeto: 192 e 37", """
<p><b>192</b>: 192 ÷ 16 = 12, resto 0. 12 = C. Resultado <b>C0</b>. Confirmação pelo binário: 192 = 1100 0000 → C e 0.</p>
<p><b>37</b>: 37 ÷ 16 = 2, resto 5. Resultado <b>25</b>. Confirmação: 37 = 0010 0101 → 2 e 5.</p>
<p>Truque: se já sabe o binário do octeto, parta-o em dois nibbles e traduza cada um. Muitas vezes é mais rápido do que dividir.</p>"""),
        texto("Porque é que MAC e IPv6 usam hexadecimal", """
<p>Um endereço <b>MAC</b> (o “número de série” da placa de rede, gravado de fábrica) tem <b>48 bits</b>. Um endereço <b>IPv6</b> tem <b>128 bits</b>. Escrever 128 zeros e uns seria impossível de ler; em decimal, as contas de bits ficariam difíceis. O hex é o meio-termo perfeito: <b>cada dígito são exatamente 4 bits</b>, por isso é curto e, ao mesmo tempo, fácil de passar para binário.</p>
<ul>
<li>MAC: 48 bits ÷ 4 = <b>12 dígitos hex</b> (6 bytes).</li>
<li>IPv6: 128 bits ÷ 4 = <b>32 dígitos hex</b>, em 8 grupos de 4 (cada grupo chama-se <b>hexteto</b> = 16 bits).</li>
</ul>"""),
        exemplo("Ler o MAC 00:1A:2B:3C:4D:5E", """
<ul>
<li>São 6 bytes separados por dois pontos (a Cisco escreve <code>001a.2b3c.4d5e</code>, em 3 grupos de 4; o Windows usa hífens <code>00-1A-2B-3C-4D-5E</code>; é o mesmo endereço).</li>
<li>Os <b>3 primeiros bytes</b> (<code>00:1A:2B</code>) são o <b>OUI</b> (Organizationally Unique Identifier): identificam o <b>fabricante</b>, atribuído pelo IEEE.</li>
<li>Os <b>3 últimos</b> (<code>3C:4D:5E</code>) são o número de série que o fabricante dá a essa placa.</li>
<li>Exemplo de conversão: <code>1A</code> = 0001 1010 = 16 + 8 + 2 = <b>26</b>; <code>5E</code> = 0101 1110 = 64 + 16 + 8 + 4 + 2 = <b>94</b>.</li>
</ul>
<p>O MAC de broadcast é <code>FF:FF:FF:FF:FF:FF</code>: os 48 bits todos a 1.</p>"""),
        texto("Escrever um IPv6 e as duas regras de compressão", """
<p>Um IPv6 completo tem 8 hextetos: <code>2001:0db8:0000:0000:0000:ff00:0042:8329</code>. Para encurtar existem <b>duas regras</b> (RFC 4291 e RFC 5952):</p>
<ol>
<li><b>Omitir zeros à esquerda</b> em cada hexteto: <code>0db8</code> → <code>db8</code>, <code>0042</code> → <code>42</code>, <code>0000</code> → <code>0</code>. Os zeros à <b>direita</b> nunca se tiram (<code>ff00</code> fica <code>ff00</code>).</li>
<li>Substituir <b>uma única</b> sequência contínua de hextetos todos a zero por <code>::</code>. Só pode aparecer <b>uma vez</b>, senão não se saberia quantos zeros há em cada sítio. Se houver duas sequências, comprime-se a mais longa (se forem iguais, a primeira).</li>
</ol>
<p>Aplicando as duas: <code>2001:db8::ff00:42:8329</code>.</p>"""),
        tabela(["Endereço completo", "Comprimido", "O que se fez"], [
            ["2001:0db8:0000:0000:0000:ff00:0042:8329", "2001:db8::ff00:42:8329", "Zeros à esquerda + três hextetos 0 → ::"],
            ["fe80:0000:0000:0000:0202:b3ff:fe1e:8329", "fe80::202:b3ff:fe1e:8329", "Endereço link-local; 0202 → 202"],
            ["2001:0db8:0000:0001:0000:0000:0000:0001", "2001:db8:0:1::1", "Só a sequência mais longa (3 zeros) vira ::"],
            ["2001:0db8:0000:0000:abcd:0000:0000:1234", "2001:db8::abcd:0:0:1234", "Duas sequências iguais: comprime-se a primeira"],
            ["ff02:0000:0000:0000:0000:0000:0000:0001", "ff02::1", "Multicast “todos os nós”"],
            ["0000:…:0000:0001 (loopback)", "::1", "Equivale ao 127.0.0.1 do IPv4"],
        ], "Exemplos de compressão IPv6"),
        exemplo("O caminho inverso: expandir 2001:db8:a::1", """
<ol>
<li>Conte os hextetos que se vêem: 2001, db8, a, 1 → <b>4</b>.</li>
<li>Um IPv6 tem 8, logo o <code>::</code> representa 8 − 4 = <b>4 hextetos a zero</b>.</li>
<li>Complete cada hexteto com zeros à esquerda até ter 4 dígitos.</li>
</ol>
<p>Resultado: <code>2001:0db8:000a:0000:0000:0000:0000:0001</code>.</p>"""),
        alerta("""<b>Erros típicos:</b> usar <code>::</code> duas vezes no mesmo endereço (inválido); tirar zeros à <b>direita</b> (<code>ff00</code> não é <code>ff</code>); esquecer que A–F valem 10–15; confundir o hex <code>10</code> (16) com o decimal 10."""),
        dica("""Para converter hex ↔ binário não precisa de fazer contas: basta a tabela dos 16 nibbles. Escreva-a uma vez no início do exame e use-a para tudo (MAC, IPv6, máscaras wildcard)."""),
    ],
    [
        valor("Quanto vale 0xFF em decimal?", ["255"], "15×16 + 15 = 255."),
        valor("Quanto vale 0xA8 em decimal?", ["168"], "A = 10 → 10×16 + 8 = 168."),
        mc("Quantos bits representa um dígito hexadecimal?", ["4", "2", "8", "16"], 0, "Um dígito hex = um nibble = 4 bits."),
        valor("Escreva 192 em hexadecimal (2 dígitos).", ["C0", "0xC0", "c0"], "192 = 1100 0000 → C e 0."),
        mc("Qual é a forma comprimida correta de 2001:0db8:0000:0000:0000:ff00:0042:8329?", ["2001:db8::ff:42:8329", "2001:db8::ff00:42:8329", "2001:db8:0::ff00:0042:8329:0", "2001::db8::ff00:42:8329"], 1, "Tiram-se zeros à esquerda e os três hextetos 0 viram :: (uma só vez); ff00 mantém-se."),
        vf("Num endereço IPv6 o :: pode aparecer duas vezes se houver duas sequências de zeros.", False, "Só uma vez; senão seria impossível saber quantos zeros há em cada lado."),
        mc("Num MAC 00:1A:2B:3C:4D:5E, o que identificam os 3 primeiros bytes?", ["A VLAN", "O número da porta do switch", "A rede IP", "O fabricante (OUI)"], 3, "Os 24 primeiros bits são o OUI, atribuído pelo IEEE ao fabricante."),
        valor("Quanto é 3E8 hexadecimal em decimal?", ["1000"], "3×256 + 14×16 + 8 = 768 + 224 + 8 = 1000."),
        mc("Quantos bits tem um endereço IPv6?", ["32", "48", "64", "128"], 3, "128 bits = 32 dígitos hex = 8 hextetos."),
        valor("Quanto vale 0x2F em decimal?", ["47"], "2×16 + 15 = 47."),
    ],
    ["rfc4291", "odom1", "netacad_itn"],
    nivel="básico",
))


# ---------------------------------------------------------------------------
# 3. Classes de endereços IPv4
# ---------------------------------------------------------------------------

reg(licao(
    "n_classes", "Classes de endereços IPv4 (A, B, C, D, E), privados e especiais", 30,
    ["Identificar a classe de um endereço pelo primeiro octeto e pelos primeiros bits",
     "Calcular o número de redes e de hosts de cada classe",
     "Reconhecer os intervalos privados da RFC 1918",
     "Reconhecer endereços especiais: loopback, APIPA, broadcast, CGNAT, multicast",
     "Distinguir endereço público de privado em situações reais"],
    [
        texto("Um pouco de história: de classful a CIDR", """
<p>Em <b>1981</b>, a RFC 791 definiu o IPv4 e dividiu os endereços em <b>classes</b>. A ideia era simples: olhando para o <b>primeiro octeto</b>, qualquer router sabia logo onde acabava a parte de <b>rede</b> e começava a parte de <b>host</b> (o equipamento dentro dessa rede). A este sistema chama-se <b>classful</b> (“com classes”).</p>
<p>O problema: só havia três tamanhos de rede. Uma empresa com 300 computadores não cabia numa classe C (254 hosts) e recebia uma classe B (65 534 hosts), desperdiçando mais de 65 mil endereços. Os endereços começaram a esgotar-se.</p>
<p>Em <b>1993</b> surgiu o <b>CIDR</b> (Classless Inter-Domain Routing, hoje na RFC 4632): a fronteira rede/host passou a ser indicada pela <b>máscara</b> ou prefixo (<code>/22</code>, <code>/27</code>…) e já não pela classe. Hoje a Internet é <b>classless</b>. Mesmo assim, as classes continuam a aparecer no exame CCNA, nos manuais e na conversa entre técnicos, por isso é obrigatório conhecê-las.</p>"""),
        tabela(["Classe", "Primeiros bits", "1.º octeto", "Máscara por defeito", "Uso"], [
            ["A", "0", "1 – 126 (0 e 127 reservados)", "255.0.0.0 (/8)", "Redes enormes"],
            ["B", "10", "128 – 191", "255.255.0.0 (/16)", "Redes médias/grandes"],
            ["C", "110", "192 – 223", "255.255.255.0 (/24)", "Redes pequenas"],
            ["D", "1110", "224 – 239", "— (não tem)", "Multicast (um para um grupo)"],
            ["E", "1111", "240 – 255", "— (não tem)", "Experimental / reservado"],
        ], "As cinco classes"),
        texto("De onde vêm os intervalos? Dos primeiros bits", """
<p>A classe é definida pelos <b>bits mais à esquerda</b> do primeiro octeto (pesos 128 64 32 16 …):</p>
<ul>
<li><b>Classe A</b> começa por <code>0</code>: de <code>00000000</code> (0) a <code>01111111</code> (127).</li>
<li><b>Classe B</b> começa por <code>10</code>: de <code>10000000</code> (128) a <code>10111111</code> (128+63 = 191).</li>
<li><b>Classe C</b> começa por <code>110</code>: de <code>11000000</code> (192) a <code>11011111</code> (192+31 = 223).</li>
<li><b>Classe D</b> começa por <code>1110</code>: de <code>11100000</code> (224) a <code>11101111</code> (224+15 = 239).</li>
<li><b>Classe E</b> começa por <code>1111</code>: de <code>11110000</code> (240) a <code>11111111</code> (255).</li>
</ul>
<p>O 0 e o 127 caberiam na classe A, mas estão reservados (0 = “esta rede”, 127 = loopback). Por isso a classe A útil vai de 1 a 126.</p>"""),
        exemplo("Quantas redes e quantos hosts? As fórmulas", """
<p>Duas fórmulas, com <b>n</b> = bits livres para a rede e <b>h</b> = bits de host:</p>
<ul>
<li><b>Redes</b> = 2<sup>n</sup> (na classe A tiram-se ainda 2: a rede 0 e a 127).</li>
<li><b>Hosts por rede</b> = 2<sup>h</sup> − 2. Tiram-se 2 porque o primeiro endereço (todos os bits de host a 0) é o <b>endereço da rede</b> e o último (todos a 1) é o <b>broadcast</b> (mensagem para todos).</li>
</ul>
<p><b>Classe A</b>: 8 bits de rede, mas o 1.º é fixo (0) → sobram 7. Redes = 2<sup>7</sup> − 2 = 128 − 2 = <b>126</b>. Hosts = 2<sup>24</sup> − 2 = <b>16 777 214</b>.</p>
<p><b>Classe B</b>: 16 bits de rede, 2 fixos (10) → 14 livres. Redes = 2<sup>14</sup> = <b>16 384</b>. Hosts = 2<sup>16</sup> − 2 = 65 536 − 2 = <b>65 534</b>.</p>
<p><b>Classe C</b>: 24 bits de rede, 3 fixos (110) → 21 livres. Redes = 2<sup>21</sup> = <b>2 097 152</b>. Hosts = 2<sup>8</sup> − 2 = 256 − 2 = <b>254</b>.</p>"""),
        tabela(["Classe", "Bits rede / host", "N.º de redes", "Hosts por rede"], [
            ["A", "8 / 24", "126", "16 777 214"],
            ["B", "16 / 16", "16 384", "65 534"],
            ["C", "24 / 8", "2 097 152", "254"],
        ], "Resumo numérico"),
        texto("Endereços privados (RFC 1918)", """
<p>Em <b>1996</b> a RFC 1918 reservou três blocos para uso <b>privado</b>: qualquer casa ou empresa pode usá-los à vontade, sem pedir licença a ninguém, mas eles <b>não são encaminhados na Internet</b>. Para sair para a Internet, o router faz <b>NAT</b> (tradução para um endereço público).</p>
<ul>
<li><code>10.0.0.0/8</code> — 10.0.0.0 a 10.255.255.255 (um bloco de classe A)</li>
<li><code>172.16.0.0/12</code> — 172.16.0.0 a 172.31.255.255 (16 redes de classe B)</li>
<li><code>192.168.0.0/16</code> — 192.168.0.0 a 192.168.255.255 (256 redes de classe C)</li>
</ul>
<p>Analogia: os números de extensão de uma empresa (ramal 201, 202…) repetem-se em milhares de empresas; para fora, todas usam o número público da central.</p>"""),
        tabela(["Endereço / bloco", "Nome", "Para que serve"], [
            ["0.0.0.0", "“Este host” / qualquer", "PC sem IP ainda (pedido DHCP); numa rota, 0.0.0.0/0 = rota por defeito"],
            ["127.0.0.0/8", "Loopback", "A própria máquina (127.0.0.1). ping 127.0.0.1 testa a pilha TCP/IP local"],
            ["169.254.0.0/16", "APIPA / link-local", "O PC não obteve IP do DHCP e escolheu um sozinho"],
            ["255.255.255.255", "Broadcast limitado", "Mensagem para todos na rede local; os routers não a passam"],
            ["100.64.0.0/10", "CGNAT (RFC 6598)", "Endereços partilhados entre operador e cliente (100.64.0.0 a 100.127.255.255)"],
            ["224.0.0.0/4", "Multicast (classe D)", "Ex.: 224.0.0.5 = routers OSPF; vídeo IPTV"],
            ["240.0.0.0/4", "Classe E", "Reservado, não se usa em redes normais"],
        ], "Endereços especiais"),
        exemplo("Público e privado na vida real", """
<p><b>Em casa</b>: o router da operadora dá ao telemóvel <code>192.168.1.23</code> (privado). Quando abre um site, o router troca esse endereço pelo seu IP <b>público</b>, por exemplo <code>102.45.67.89</code>. O site só vê o público.</p>
<p><b>Numa empresa</b> em Luanda com 400 computadores: internamente usa <code>10.0.0.0/8</code> dividido por pisos; na Internet tem meia dúzia de IPs públicos comprados ao fornecedor (ISP), usados no router/firewall e nos servidores visíveis de fora (site, e-mail).</p>
<p><b>Rede móvel</b>: o telemóvel pode receber um <code>100.x.x.x</code>. É CGNAT: o operador partilha um IP público por muitos clientes.</p>"""),
        tabela(["Endereço", "Classe", "Tipo", "Porquê"], [
            ["10.5.3.2", "A", "Privado", "1.º octeto 10 → classe A; está em 10.0.0.0/8"],
            ["172.20.1.1", "B", "Privado", "172 → B; 20 está entre 16 e 31"],
            ["172.32.1.1", "B", "Público", "172.32 já está fora de 172.16–172.31"],
            ["192.168.0.254", "C", "Privado", "192 → C; está em 192.168.0.0/16"],
            ["192.169.1.1", "C", "Público", "192.169 não é 192.168"],
            ["8.8.8.8", "A", "Público", "DNS público da Google"],
            ["130.10.1.1", "B", "Público", "130 entre 128 e 191"],
            ["127.0.0.1", "(A, reservado)", "Loopback", "A própria máquina"],
            ["169.254.10.20", "B", "APIPA", "Falhou o DHCP"],
            ["224.0.0.10", "D", "Multicast", "224–239 (usado pelo EIGRP)"],
            ["100.70.1.5", "A", "CGNAT (partilhado)", "Está em 100.64.0.0/10"],
            ["245.1.1.1", "E", "Reservado", "240–255"],
        ], "Treino de identificação"),
        dica("""Para decorar os limites do 1.º octeto: <b>A até 127, B até 191, C até 223, D até 239</b>. Os inícios são as somas dos pesos: 128 (B), 128+64 = 192 (C), 192+32 = 224 (D), 224+16 = 240 (E)."""),
        alerta("""Atenção ao 172: só <code>172.16</code> a <code>172.31</code> é privado. <code>172.15.x.x</code> e <code>172.32.x.x</code> são públicos. E <code>192.168</code> é privado, mas <code>192.169</code> não. É uma armadilha clássica do exame."""),
    ],
    [
        mc("A que classe pertence 130.45.2.1?", ["A", "B", "C", "D"], 1, "O 1.º octeto 130 está entre 128 e 191 → classe B."),
        mc("Qual destes é um endereço privado?", ["172.32.0.5", "192.169.1.1", "172.18.4.9", "11.1.1.1"], 2, "172.18 está no bloco 172.16.0.0/12 (172.16 a 172.31)."),
        valor("Quantos hosts úteis tem uma rede de classe C (/24)?", ["254"], "2⁸ − 2 = 256 − 2 = 254."),
        valor("Quantos hosts úteis tem uma rede de classe B (/16)?", ["65534", "65 534"], "2¹⁶ − 2 = 65 536 − 2 = 65 534."),
        vf("Um PC com o endereço 169.254.33.7 obteve corretamente o endereço do servidor DHCP.", False, "169.254.x.x é APIPA: o PC não recebeu resposta do DHCP e escolheu um endereço sozinho."),
        mc("Com que bits começa um endereço de classe C?", ["0", "10", "110", "1110"], 2, "Classe C começa por 110 (192 a 223)."),
        mc("Para que serve o bloco 100.64.0.0/10?", ["CGNAT entre operador e cliente", "Loopback", "Multicast", "APIPA"], 0, "RFC 6598: espaço partilhado para Carrier-Grade NAT."),
        valor("Qual é a máscara por defeito de uma rede de classe B (decimal com pontos)?", ["255.255.0.0"], "Classe B = /16 = 255.255.0.0."),
        vf("Os endereços de classe D (224 a 239) são usados para multicast.", True, "Ex.: 224.0.0.5 (OSPF), 224.0.0.10 (EIGRP)."),
        mc("Em que ano o CIDR substituiu o endereçamento por classes?", ["1981", "1996", "2006", "1993"], 3, "1993 (RFC 1517–1519; atualizado na RFC 4632 em 2006). 1981 é o IPv4/classes; 1996 a RFC 1918."),
    ],
    ["rfc791", "rfc1918", "rfc4632", "odom1"],
    nivel="básico",
))


# ---------------------------------------------------------------------------
# 4. Máscaras, prefixo CIDR e wildcard
# ---------------------------------------------------------------------------

reg(licao(
    "n_mascaras", "Máscaras de rede, prefixo CIDR e wildcard", 28,
    ["Explicar o que a máscara faz: separar a parte de rede da parte de host",
     "Converter máscara decimal em prefixo /n e vice-versa",
     "Aplicar a operação AND bit a bit para descobrir o endereço de rede",
     "Calcular a máscara wildcard a partir da máscara"],
    [
        texto("Para que serve a máscara: a rua e o número da porta", """
<p>Um endereço IPv4 tem duas partes, tal como uma morada: <b>Rua da Missão, n.º 25</b>. A rua diz <b>em que bairro/rede</b> está a casa; o número diz <b>qual é a casa</b> dentro da rua.</p>
<ul>
<li>A <b>parte de rede</b> é a “rua”: é igual para todos os equipamentos da mesma rede.</li>
<li>A <b>parte de host</b> é o “número da porta”: é diferente para cada equipamento (host = qualquer equipamento com IP: PC, telemóvel, impressora, router).</li>
</ul>
<p>Mas olhando só para <code>192.168.10.25</code> não se sabe onde acaba a rua. É para isso que existe a <b>máscara de rede</b> (ou máscara de sub-rede): outro número de 32 bits em que os bits a <b>1</b> marcam a parte de rede e os bits a <b>0</b> marcam a parte de host. Os 1 vêm sempre todos seguidos, à esquerda.</p>
<p>Exemplo: <code>255.255.255.0</code> = <code>11111111.11111111.11111111.00000000</code> → 24 bits de rede (a rua é <code>192.168.10</code>) e 8 bits de host (a porta é o <code>25</code>).</p>"""),
        texto("Máscara ↔ prefixo CIDR", """
<p>Escrever <code>255.255.255.0</code> é comprido. O <b>prefixo CIDR</b> diz o mesmo de forma curta: <b>quantos bits a 1</b> tem a máscara, depois de uma barra. <code>255.255.255.0</code> tem 24 uns → <code>/24</code>. Escreve-se <code>192.168.10.25/24</code>.</p>
<p><b>Da máscara para o prefixo</b>: some os bits a 1 de cada octeto. 255 = 8 bits, e use a tabela 128 (1), 192 (2), 224 (3), 240 (4), 248 (5), 252 (6), 254 (7).</p>
<ul>
<li><code>255.255.255.240</code> → 8 + 8 + 8 + 4 = <b>/28</b></li>
<li><code>255.255.252.0</code> → 8 + 8 + 6 + 0 = <b>/22</b></li>
<li><code>255.192.0.0</code> → 8 + 2 = <b>/10</b></li>
</ul>
<p><b>Do prefixo para a máscara</b>: vá enchendo octetos de 8 em 8 bits. <code>/19</code> = 8 + 8 + 3 → 255.255.<b>224</b>.0 (3 bits = 128+64+32 = 224). <code>/27</code> = 8+8+8+3 → 255.255.255.<b>224</b>.</p>"""),
        tabela(["Prefixo", "Máscara", "Tamanho do bloco", "Endereços", "Hosts úteis (2ʰ − 2)"], [
            ["/8", "255.0.0.0", "1 no 1.º octeto", "16 777 216", "16 777 214"],
            ["/9", "255.128.0.0", "128 no 2.º octeto", "8 388 608", "8 388 606"],
            ["/10", "255.192.0.0", "64 no 2.º octeto", "4 194 304", "4 194 302"],
            ["/11", "255.224.0.0", "32 no 2.º octeto", "2 097 152", "2 097 150"],
            ["/12", "255.240.0.0", "16 no 2.º octeto", "1 048 576", "1 048 574"],
            ["/13", "255.248.0.0", "8 no 2.º octeto", "524 288", "524 286"],
            ["/14", "255.252.0.0", "4 no 2.º octeto", "262 144", "262 142"],
            ["/15", "255.254.0.0", "2 no 2.º octeto", "131 072", "131 070"],
            ["/16", "255.255.0.0", "1 no 2.º octeto", "65 536", "65 534"],
            ["/17", "255.255.128.0", "128 no 3.º octeto", "32 768", "32 766"],
            ["/18", "255.255.192.0", "64 no 3.º octeto", "16 384", "16 382"],
            ["/19", "255.255.224.0", "32 no 3.º octeto", "8 192", "8 190"],
            ["/20", "255.255.240.0", "16 no 3.º octeto", "4 096", "4 094"],
            ["/21", "255.255.248.0", "8 no 3.º octeto", "2 048", "2 046"],
            ["/22", "255.255.252.0", "4 no 3.º octeto", "1 024", "1 022"],
            ["/23", "255.255.254.0", "2 no 3.º octeto", "512", "510"],
            ["/24", "255.255.255.0", "1 no 3.º octeto", "256", "254"],
            ["/25", "255.255.255.128", "128 no 4.º octeto", "128", "126"],
            ["/26", "255.255.255.192", "64 no 4.º octeto", "64", "62"],
            ["/27", "255.255.255.224", "32 no 4.º octeto", "32", "30"],
            ["/28", "255.255.255.240", "16 no 4.º octeto", "16", "14"],
            ["/29", "255.255.255.248", "8 no 4.º octeto", "8", "6"],
            ["/30", "255.255.255.252", "4 no 4.º octeto", "4", "2"],
            ["/31", "255.255.255.254", "2 no 4.º octeto", "2", "2 (ponto a ponto, RFC 3021)"],
            ["/32", "255.255.255.255", "1 no 4.º octeto", "1", "1 (um só host)"],
        ], "De /8 a /32: a tabela completa"),
        texto("A operação AND: como o equipamento descobre a rede", """
<p>Para saber a que rede pertence um endereço, o PC ou o router faz uma operação lógica chamada <b>AND</b> (E) entre o endereço e a máscara, <b>bit a bit</b>. A regra do AND é só esta:</p>
<ul>
<li>1 AND 1 = <b>1</b></li>
<li>1 AND 0 = <b>0</b></li>
<li>0 AND 1 = <b>0</b></li>
<li>0 AND 0 = <b>0</b></li>
</ul>
<p>Ou seja, o resultado só é 1 quando <b>os dois</b> bits são 1. Na prática: onde a máscara tem 1, o bit do endereço <b>passa</b> tal como está; onde a máscara tem 0, o bit fica <b>apagado</b> (0). O resultado é o <b>endereço de rede</b>.</p>
<p>Atalho: octeto de máscara 255 → o octeto do endereço copia-se; octeto de máscara 0 → fica 0. Só é preciso fazer contas no octeto “interessante” (o que não é 255 nem 0).</p>"""),
        tabela(["", "128", "64", "32", "16", "8", "4", "2", "1", "Decimal"], [
            ["Endereço (200)", "1", "1", "0", "0", "1", "0", "0", "0", "200"],
            ["Máscara (224)", "1", "1", "1", "0", "0", "0", "0", "0", "224"],
            ["AND", "1", "1", "0", "0", "0", "0", "0", "0", "192"],
        ], "192.168.10.200/27: AND no 4.º octeto"),
        exemplo("Resultado completo de 192.168.10.200/27", """
<ol>
<li>Máscara /27 = 255.255.255.224.</li>
<li>1.º octeto: 192 AND 255 = 192 (copia). 2.º: 168 AND 255 = 168. 3.º: 10 AND 255 = 10.</li>
<li>4.º octeto: 200 = <code>11001000</code>, 224 = <code>11100000</code>. Bit a bit: 1·1=1, 1·1=1, 0·1=0, 0·0=0, 1·0=0, 0·0=0, 0·0=0, 0·0=0 → <code>11000000</code> = <b>192</b>.</li>
<li>Endereço de rede: <b>192.168.10.192</b>/27.</li>
</ol>
<p>Repare no bit de peso 8: o endereço tinha 1, mas a máscara tinha 0, por isso o resultado é 0. Esse bit pertence à parte de host e é “apagado”.</p>"""),
        exemplo("Outro AND: 172.16.45.130/20", """
<ol>
<li>/20 = 8 + 8 + 4 → máscara <b>255.255.240.0</b>. O octeto interessante é o <b>3.º</b>.</li>
<li>172 AND 255 = 172; 16 AND 255 = 16.</li>
<li>3.º octeto: 45 = <code>00101101</code>; 240 = <code>11110000</code>. AND → <code>00100000</code> = <b>32</b>.</li>
<li>4.º octeto: 130 AND 0 = <b>0</b>.</li>
<li>Endereço de rede: <b>172.16.32.0</b>/20.</li>
</ol>"""),
        texto("Máscara wildcard: a máscara “ao contrário”", """
<p>As <b>ACLs</b> (listas de controlo de acesso) e o <b>OSPF</b> no Cisco IOS não usam a máscara normal, mas a <b>wildcard</b> (máscara curinga). É a máscara invertida: onde a máscara tem 1, a wildcard tem 0, e vice-versa.</p>
<ul>
<li>Bit <b>0</b> na wildcard = “este bit tem de ser igual”.</li>
<li>Bit <b>1</b> na wildcard = “este bit tanto faz”.</li>
</ul>
<p>Como calcular sem binário: <b>wildcard = 255.255.255.255 − máscara</b>, octeto a octeto.</p>"""),
        tabela(["Prefixo", "Máscara", "Conta octeto a octeto", "Wildcard"], [
            ["/24", "255.255.255.0", "255−255 . 255−255 . 255−255 . 255−0", "0.0.0.255"],
            ["/27", "255.255.255.224", "0 . 0 . 0 . 255−224", "0.0.0.31"],
            ["/30", "255.255.255.252", "0 . 0 . 0 . 255−252", "0.0.0.3"],
            ["/20", "255.255.240.0", "0 . 0 . 255−240 . 255−0", "0.0.15.255"],
            ["/12", "255.240.0.0", "0 . 255−240 . 255 . 255", "0.15.255.255"],
            ["/32", "255.255.255.255", "0 . 0 . 0 . 0", "0.0.0.0 (= host)"],
        ], "Wildcards mais comuns"),
        dica("""O tamanho do bloco é sempre <b>wildcard + 1</b> no octeto interessante: /27 tem wildcard 31 e bloco 32; /20 tem wildcard 15 e bloco 16. Se souber um, sabe o outro."""),
        alerta("""<b>Erros típicos:</b> pensar que uma máscara pode ter 1 e 0 misturados (<code>255.255.255.250</code> não existe); trocar máscara e wildcard num comando <code>network</code> do OSPF ou numa ACL; fazer o AND com o octeto errado (o interessante é aquele onde a máscara não é 255 nem 0)."""),
    ],
    [
        valor("Qual é o prefixo da máscara 255.255.255.240? (ex.: /24)", ["/28", "28"], "8 + 8 + 8 + 4 = 28."),
        valor("Qual é a máscara decimal de /19?", ["255.255.224.0"], "19 = 8 + 8 + 3; 3 bits = 128+64+32 = 224."),
        mc("Quanto dá 1 AND 0?", ["0", "1", "2", "Depende"], 0, "O AND só dá 1 quando os dois bits são 1."),
        valor("Qual é o endereço de rede de 192.168.10.200/27?", ["192.168.10.192"], "200 AND 224 = 192."),
        valor("Qual é a wildcard de 255.255.240.0?", ["0.0.15.255"], "255−240 = 15 e 255−0 = 255."),
        mc("Quantos hosts úteis tem um /26?", ["30", "64", "126", "62"], 3, "6 bits de host: 2⁶ − 2 = 62."),
        vf("Na máscara de rede, os bits a 1 indicam a parte de host.", False, "Os bits a 1 indicam a parte de rede; os bits a 0, a de host."),
        mc("Qual é o endereço de rede de 172.16.45.130/20?", ["172.16.45.0", "172.16.32.0", "172.16.40.0", "172.16.0.0"], 1, "45 AND 240 = 32 → 172.16.32.0."),
        valor("Qual é a wildcard de um /30?", ["0.0.0.3"], "255 − 252 = 3."),
    ],
    ["rfc950", "rfc4632", "odom1", "lammle"],
    nivel="básico",
))


# ---------------------------------------------------------------------------
# 5. Calcular uma sub-rede passo a passo
# ---------------------------------------------------------------------------

reg(licao(
    "n_sub_passo", "Calcular uma sub-rede passo a passo (rede, broadcast, hosts)", 35,
    ["Calcular endereço de rede, primeiro e último host e broadcast",
     "Usar o método do número mágico (tamanho do bloco)",
     "Usar o método binário e confirmar os resultados",
     "Verificar se dois endereços estão na mesma rede"],
    [
        texto("O que queremos descobrir e as fórmulas", """
<p>Dado um endereço com prefixo, por exemplo <code>192.168.1.130/26</code>, queremos 6 respostas:</p>
<ol>
<li><b>Endereço de rede</b>: o primeiro endereço do bloco, com todos os bits de host a 0. Identifica a rede (como o nome da rua) e não se dá a nenhum equipamento.</li>
<li><b>Primeiro host</b>: rede + 1.</li>
<li><b>Último host</b>: broadcast − 1.</li>
<li><b>Broadcast</b>: o último endereço do bloco, com todos os bits de host a 1. Um pacote enviado para aqui chega a <b>todos</b> os equipamentos da rede (como um anúncio no altifalante).</li>
<li><b>Número de hosts úteis</b>: <b>2<sup>h</sup> − 2</b>, em que <b>h</b> = bits de host = 32 − prefixo. Tiram-se 2 (rede e broadcast).</li>
<li><b>Máscara</b> em decimal.</li>
</ol>"""),
        texto("Método do número mágico (tamanho do bloco)", """
<ol>
<li>Escreva a máscara em decimal e encontre o <b>octeto interessante</b>: aquele que não é 255 nem 0.</li>
<li><b>Número mágico</b> = 256 − valor da máscara nesse octeto. É o <b>tamanho do bloco</b>: as redes começam em múltiplos dele (0, bloco, 2×bloco…).</li>
<li>Veja entre que dois múltiplos cai o valor do endereço nesse octeto. O múltiplo de baixo é a <b>rede</b>.</li>
<li>O múltiplo seguinte menos 1 é o <b>broadcast</b>. Os octetos à direita do interessante ficam a 0 na rede e a 255 no broadcast.</li>
</ol>
<p>Analogia: uma rua dividida em lotes iguais de 64 metros. Se a sua casa está no metro 130, o lote começa no metro 128 e acaba no 191.</p>"""),
        exemplo("Exemplo 1 (número mágico): 192.168.1.130/26", """
<ol>
<li>/26 = 8+8+8+2 → máscara <b>255.255.255.192</b>. Octeto interessante: o 4.º (192).</li>
<li>Número mágico = 256 − 192 = <b>64</b>. Redes: .0, .64, .128, .192.</li>
<li>130 está entre 128 e 192 → rede <b>192.168.1.128</b>.</li>
<li>Próxima rede = .192 → broadcast = 192 − 1 = <b>192.168.1.191</b>.</li>
<li>Primeiro host = .128 + 1 = <b>.129</b>; último host = .191 − 1 = <b>.190</b>.</li>
<li>Hosts: h = 32 − 26 = 6 → 2<sup>6</sup> − 2 = 64 − 2 = <b>62</b>.</li>
</ol>"""),
        tabela(["Campo", "Valor"], [
            ["Endereço de rede", "192.168.1.128"], ["Primeiro host", "192.168.1.129"], ["Último host", "192.168.1.190"],
            ["Broadcast", "192.168.1.191"], ["Hosts úteis", "62"], ["Máscara", "255.255.255.192 (/26)"],
        ], "Resumo do exemplo 1"),
        texto("Método binário: o mesmo exemplo bit a bit", """
<p>O método binário é mais lento, mas mostra <b>porque</b> é que o resultado é aquele. Só é preciso trabalhar no octeto interessante.</p>
<ol>
<li>130 em binário: 128 cabe (resta 2), 2 cabe → <code>10000010</code>.</li>
<li>A máscara 192 = <code>11000000</code>: os <b>2 primeiros bits</b> do octeto são de rede, os <b>6 últimos</b> são de host. Separamos: <code>10 | 000010</code>.</li>
<li><b>Rede</b>: mantêm-se os bits de rede e põem-se os de host a 0 → <code>10 | 000000</code> = 128.</li>
<li><b>Broadcast</b>: bits de host todos a 1 → <code>10 | 111111</code> = 128+32+16+8+4+2+1 = 191.</li>
<li>Primeiro host: <code>10 | 000001</code> = 129. Último host: <code>10 | 111110</code> = 190.</li>
</ol>
<p>Os dois métodos dão o mesmo, como tem de ser.</p>"""),
        tabela(["", "Bits de rede", "Bits de host", "Decimal"], [
            ["Endereço 130", "10", "000010", "130"],
            ["Rede (host a 0)", "10", "000000", "128"],
            ["Primeiro host", "10", "000001", "129"],
            ["Último host", "10", "111110", "190"],
            ["Broadcast (host a 1)", "10", "111111", "191"],
        ], "4.º octeto de 192.168.1.130/26 em binário"),
        exemplo("Exemplo 2: 10.20.30.40/20 (o octeto interessante é o 3.º)", """
<p><b>Número mágico</b></p>
<ol>
<li>/20 = 8+8+4 → máscara <b>255.255.240.0</b>. Octeto interessante: o <b>3.º</b> (240).</li>
<li>Bloco = 256 − 240 = <b>16</b>. Redes no 3.º octeto: 0, 16, 32, 48…</li>
<li>30 está entre 16 e 32 → rede <b>10.20.16.0</b> (o 4.º octeto fica 0).</li>
<li>Broadcast: próxima rede 10.20.32.0 menos 1 → <b>10.20.31.255</b> (3.º octeto 32−1 = 31, 4.º octeto 255).</li>
<li>Primeiro host <b>10.20.16.1</b>; último host <b>10.20.31.254</b>.</li>
<li>h = 32 − 20 = 12 → 2<sup>12</sup> − 2 = 4096 − 2 = <b>4094</b> hosts.</li>
</ol>
<p><b>Confirmação em binário</b> (3.º octeto): 30 = <code>0001 | 1110</code>. Rede: <code>0001 | 0000</code> = 16. Broadcast: <code>0001 | 1111</code> = 31 e o 4.º octeto todo a 1 (255).</p>"""),
        tabela(["Campo", "Valor"], [
            ["Endereço de rede", "10.20.16.0"], ["Primeiro host", "10.20.16.1"], ["Último host", "10.20.31.254"],
            ["Broadcast", "10.20.31.255"], ["Hosts úteis", "4094"], ["Máscara", "255.255.240.0 (/20)"],
        ], "Resumo do exemplo 2"),
        exemplo("Exemplos 3 e 4: 172.16.5.200/27 e 192.168.50.77/29", """
<p><b>Exemplo 3 — 172.16.5.200/27</b></p>
<ol>
<li>/27 → 255.255.255.<b>224</b>; bloco = 256 − 224 = <b>32</b>. Redes: 0, 32, 64, 96, 128, 160, 192, 224.</li>
<li>200 está entre 192 e 224 → rede <b>172.16.5.192</b>; broadcast 224 − 1 = <b>172.16.5.223</b>.</li>
<li>Hosts de <b>.193</b> a <b>.222</b>; h = 5 → 2<sup>5</sup> − 2 = <b>30</b>.</li>
</ol>
<p><b>Exemplo 4 — 192.168.50.77/29</b></p>
<ol>
<li>/29 → 255.255.255.<b>248</b>; bloco = 256 − 248 = <b>8</b>. Múltiplos de 8 perto de 77: 72 (8×9) e 80 (8×10).</li>
<li>Rede <b>192.168.50.72</b>; broadcast 80 − 1 = <b>192.168.50.79</b>.</li>
<li>Hosts de <b>.73</b> a <b>.78</b>; h = 3 → 2<sup>3</sup> − 2 = <b>6</b>.</li>
</ol>"""),
        exemplo("Exemplos 5 e 6: 10.0.0.1/30 e 172.31.255.250/22", """
<p><b>Exemplo 5 — 10.0.0.1/30</b> (típico de uma ligação entre dois routers)</p>
<ol>
<li>/30 → 255.255.255.<b>252</b>; bloco = 256 − 252 = <b>4</b>. Redes: 0, 4, 8…</li>
<li>1 está entre 0 e 4 → rede <b>10.0.0.0</b>; broadcast 4 − 1 = <b>10.0.0.3</b>.</li>
<li>Hosts <b>10.0.0.1</b> e <b>10.0.0.2</b>; h = 2 → 2<sup>2</sup> − 2 = <b>2</b>. Um para cada router.</li>
</ol>
<p><b>Exemplo 6 — 172.31.255.250/22</b></p>
<ol>
<li>/22 = 8+8+6 → 255.255.<b>252</b>.0. Octeto interessante: o <b>3.º</b>. Bloco = 256 − 252 = <b>4</b>.</li>
<li>No 3.º octeto o valor é 255. Múltiplos de 4: …, 248, <b>252</b>, (256 já não existe). 255 está no bloco que começa em 252.</li>
<li>Rede <b>172.31.252.0</b>. Broadcast: bloco 252 a 255 no 3.º octeto, 4.º a 255 → <b>172.31.255.255</b>.</li>
<li>Hosts de <b>172.31.252.1</b> a <b>172.31.255.254</b>; h = 10 → 2<sup>10</sup> − 2 = 1024 − 2 = <b>1022</b>.</li>
</ol>"""),
        tabela(["Exemplo", "Máscara", "Rede", "Primeiro host", "Último host", "Broadcast", "Hosts"], [
            ["172.16.5.200/27", "255.255.255.224", "172.16.5.192", "172.16.5.193", "172.16.5.222", "172.16.5.223", "30"],
            ["192.168.50.77/29", "255.255.255.248", "192.168.50.72", "192.168.50.73", "192.168.50.78", "192.168.50.79", "6"],
            ["10.0.0.1/30", "255.255.255.252", "10.0.0.0", "10.0.0.1", "10.0.0.2", "10.0.0.3", "2"],
            ["172.31.255.250/22", "255.255.252.0", "172.31.252.0", "172.31.252.1", "172.31.255.254", "172.31.255.255", "1022"],
        ], "Resumo dos exemplos 3 a 6"),
        exemplo("Estão na mesma rede?", """
<p>Dois equipamentos só falam diretamente (sem router) se estiverem na <b>mesma rede</b>. Para verificar, calcula-se a rede de cada um <b>com a sua máscara</b> e comparam-se.</p>
<p><b>Caso A</b>: PC1 <code>192.168.1.100/26</code> e PC2 <code>192.168.1.130/26</code>. Bloco 64: 100 está em .64–.127 → rede 192.168.1.64. 130 está em .128–.191 → rede 192.168.1.128. <b>Redes diferentes</b>: precisam de um router, apesar de os endereços “parecerem” vizinhos.</p>
<p><b>Caso B</b>: PC1 <code>10.20.17.5/20</code> e PC2 <code>10.20.30.200/20</code>. Bloco 16 no 3.º octeto: 17 e 30 estão ambos entre 16 e 31 → ambos na rede 10.20.16.0. <b>Mesma rede</b>.</p>"""),
        dica("""Confirme sempre: (1) a rede é múltiplo do bloco; (2) o broadcast é ímpar no último octeto (em blocos de 2 ou mais); (3) último host − primeiro host + 1 = número de hosts. Em 192.168.50.73 a .78: 78 − 73 + 1 = 6. Certo."""),
        alerta("""<b>Erros típicos:</b>
<ul>
<li>Trabalhar no octeto errado: em /20 ou /22 o octeto interessante é o <b>3.º</b>, não o 4.º.</li>
<li>Esquecer de pôr os octetos à direita a <b>0</b> (rede) e a <b>255</b> (broadcast).</li>
<li>Usar 2<sup>h</sup> em vez de 2<sup>h</sup> − 2 para hosts úteis.</li>
<li>Dar o endereço de rede ou de broadcast a um PC: o sistema operativo recusa ou a comunicação falha.</li>
</ul>"""),
    ],
    [
        valor("Qual é o endereço de rede de 192.168.1.130/26?", ["192.168.1.128"], "Bloco 64: 130 está entre 128 e 191."),
        valor("Qual é o broadcast de 10.20.30.40/20?", ["10.20.31.255"], "Bloco 16 no 3.º octeto: rede 10.20.16.0, próxima 10.20.32.0, broadcast 10.20.31.255."),
        valor("Quantos hosts úteis tem um /27?", ["30"], "2⁵ − 2 = 30."),
        mc("Qual é o último host de 172.16.5.200/27?", ["172.16.5.222", "172.16.5.223", "172.16.5.254", "172.16.5.224"], 0, "Broadcast .223, logo último host .222."),
        mc("Qual é a rede de 192.168.50.77/29?", ["192.168.50.64", "192.168.50.76", "192.168.50.72", "192.168.50.80"], 2, "Bloco 8: 72 ≤ 77 < 80."),
        valor("Quantos hosts úteis tem 172.31.255.250/22?", ["1022"], "h = 10 → 2¹⁰ − 2 = 1022."),
        vf("192.168.1.100/26 e 192.168.1.130/26 estão na mesma rede.", False, "Ficam em 192.168.1.64/26 e 192.168.1.128/26: redes diferentes."),
        mc("Qual é o número mágico (tamanho do bloco) de um /28?", ["8", "14", "16", "32"], 2, "Máscara 240 → 256 − 240 = 16."),
        valor("Qual é o primeiro host de 172.31.255.250/22?", ["172.31.252.1"], "Rede 172.31.252.0 → primeiro host 172.31.252.1."),
        vf("10.20.17.5/20 e 10.20.30.200/20 pertencem à mesma rede.", True, "Ambos ficam em 10.20.16.0/20 (16 a 31 no 3.º octeto)."),
    ],
    ["rfc950", "odom1", "netacad_itn", "lammle"],
    nivel="intermédio",
))


# ---------------------------------------------------------------------------
# 6. Dividir uma rede em sub-redes
# ---------------------------------------------------------------------------

reg(licao(
    "n_sub_dividir", "Dividir uma rede em sub-redes (borrowing bits)", 32,
    ["Explicar o que é pedir bits emprestados à parte de host",
     "Calcular quantas sub-redes e quantos hosts dá cada prefixo",
     "Escolher a máscara a partir do número de sub-redes ou de hosts pedido",
     "Listar todas as sub-redes de uma rede numa tabela"],
    [
        texto("Porque dividir uma rede?", """
<p>Imagine um prédio de escritórios com um único corredor onde todos gritam ao mesmo tempo: é assim uma rede grande sem divisões. Cada <b>broadcast</b> (mensagem para todos) chega a todos os equipamentos, o tráfego aumenta e qualquer problema afeta toda a gente.</p>
<p>Dividir em <b>sub-redes</b> (subnetting) é como pôr paredes e portas: cada departamento tem a sua sala (a sua sub-rede) e o <b>router</b> é a porta entre salas. Vantagens:</p>
<ul>
<li><b>Menos broadcast</b> em cada sub-rede → rede mais rápida.</li>
<li><b>Segurança</b>: pode filtrar-se o tráfego entre departamentos (ACLs).</li>
<li><b>Organização</b>: sabe-se pelo endereço a que piso ou serviço pertence um equipamento.</li>
<li><b>Menos desperdício</b> de endereços.</li>
</ul>"""),
        texto("Pedir bits emprestados", """
<p>Uma rede <code>192.168.10.0/24</code> tem 24 bits de rede e 8 de host. Para criar sub-redes, “pedimos emprestados” alguns <b>bits de host</b> e passamo-los para a parte de rede. O prefixo aumenta.</p>
<ul>
<li>Com <b>s</b> bits emprestados criam-se <b>2<sup>s</sup> sub-redes</b> (cada bit pode ser 0 ou 1, e cada combinação é uma sub-rede).</li>
<li>Ficam <b>h</b> bits de host, e cada sub-rede tem <b>2<sup>h</sup> − 2 hosts</b>.</li>
<li>Sempre: <b>bits de rede originais + s + h = 32</b>.</li>
</ul>
<p>É uma troca: <b>mais sub-redes = menos hosts em cada uma</b>. Como cortar um bolo: quanto mais fatias, mais pequena cada fatia.</p>"""),
        tabela(["Bits emprestados (s)", "Novo prefixo", "Máscara", "Sub-redes (2ˢ)", "Bits de host (h)", "Hosts por sub-rede (2ʰ − 2)"], [
            ["1", "/25", "255.255.255.128", "2", "7", "126"],
            ["2", "/26", "255.255.255.192", "4", "6", "62"],
            ["3", "/27", "255.255.255.224", "8", "5", "30"],
            ["4", "/28", "255.255.255.240", "16", "4", "14"],
            ["5", "/29", "255.255.255.248", "32", "3", "6"],
            ["6", "/30", "255.255.255.252", "64", "2", "2"],
        ], "A partir de um /24"),
        tabela(["N.º", "Sub-rede", "Primeiro host", "Último host", "Broadcast"], [
            ["1", "192.168.10.0/26", "192.168.10.1", "192.168.10.62", "192.168.10.63"],
            ["2", "192.168.10.64/26", "192.168.10.65", "192.168.10.126", "192.168.10.127"],
            ["3", "192.168.10.128/26", "192.168.10.129", "192.168.10.190", "192.168.10.191"],
            ["4", "192.168.10.192/26", "192.168.10.193", "192.168.10.254", "192.168.10.255"],
        ], "192.168.10.0/24 dividida em /26: 2 bits emprestados, 4 sub-redes de 62 hosts, bloco 64"),
        tabela(["N.º", "Sub-rede", "Primeiro host", "Último host", "Broadcast"], [
            ["1", "192.168.10.0/27", "192.168.10.1", "192.168.10.30", "192.168.10.31"],
            ["2", "192.168.10.32/27", "192.168.10.33", "192.168.10.62", "192.168.10.63"],
            ["3", "192.168.10.64/27", "192.168.10.65", "192.168.10.94", "192.168.10.95"],
            ["4", "192.168.10.96/27", "192.168.10.97", "192.168.10.126", "192.168.10.127"],
            ["5", "192.168.10.128/27", "192.168.10.129", "192.168.10.158", "192.168.10.159"],
            ["6", "192.168.10.160/27", "192.168.10.161", "192.168.10.190", "192.168.10.191"],
            ["7", "192.168.10.192/27", "192.168.10.193", "192.168.10.222", "192.168.10.223"],
            ["8", "192.168.10.224/27", "192.168.10.225", "192.168.10.254", "192.168.10.255"],
        ], "192.168.10.0/24 dividida em /27: 3 bits emprestados, 8 sub-redes de 30 hosts, bloco 32"),
        exemplo("Como se constrói a lista (sem decorar nada)", """
<ol>
<li>Calcule o bloco: /27 → máscara 224 → 256 − 224 = <b>32</b>.</li>
<li>A primeira sub-rede começa no endereço original: <b>.0</b>.</li>
<li>Cada sub-rede seguinte = anterior + bloco: 0, 32, 64, 96, 128, 160, 192, 224. Pára quando chegar a 256 (já não cabe).</li>
<li>Para cada uma: broadcast = próxima sub-rede − 1; primeiro host = sub-rede + 1; último host = broadcast − 1.</li>
</ol>
<p>Confirmação: 8 sub-redes × 32 endereços = 256 = o /24 inteiro. Nada se perde nem se sobrepõe.</p>"""),
        exemplo("Escolher a máscara pelo número de SUB-REDES", """
<p><b>Problema</b>: uma escola secundária no Huambo recebeu <code>192.168.10.0/24</code> e tem <b>5 departamentos</b> (Direção, Secretaria, Sala de Professores, Laboratório de Informática, Biblioteca), cada um com no máximo 25 computadores. Que máscara usar?</p>
<ol>
<li>Precisamos de pelo menos 5 sub-redes. Procuramos o menor <b>s</b> com 2<sup>s</sup> ≥ 5: 2<sup>2</sup> = 4 (não chega), 2<sup>3</sup> = <b>8</b> (chega). Logo <b>s = 3</b>.</li>
<li>Novo prefixo = 24 + 3 = <b>/27</b> → máscara 255.255.255.224.</li>
<li>Bits de host = 32 − 27 = 5 → 2<sup>5</sup> − 2 = <b>30 hosts</b> por sub-rede ≥ 25 pedidos. Serve.</li>
<li>Usamos as 5 primeiras sub-redes /27 e ficam <b>3 livres</b> para crescer (ex.: Wi-Fi dos alunos, câmaras).</li>
</ol>"""),
        tabela(["Departamento", "Sub-rede", "Gateway (1.º host)", "Hosts para PCs", "Broadcast"], [
            ["Direção", "192.168.10.0/27", "192.168.10.1", ".2 a .30", "192.168.10.31"],
            ["Secretaria", "192.168.10.32/27", "192.168.10.33", ".34 a .62", "192.168.10.63"],
            ["Sala de Professores", "192.168.10.64/27", "192.168.10.65", ".66 a .94", "192.168.10.95"],
            ["Laboratório de Informática", "192.168.10.96/27", "192.168.10.97", ".98 a .126", "192.168.10.127"],
            ["Biblioteca", "192.168.10.128/27", "192.168.10.129", ".130 a .158", "192.168.10.159"],
            ["(livre)", "192.168.10.160/27, .192/27, .224/27", "—", "—", "—"],
        ], "Plano da escola"),
        exemplo("Escolher a máscara pelo número de HOSTS", """
<p><b>Problema 1</b>: a partir de <code>192.168.10.0/24</code>, cada sub-rede tem de ter <b>50 hosts</b>.</p>
<ol>
<li>Procuramos o menor <b>h</b> com 2<sup>h</sup> − 2 ≥ 50: h = 5 → 30 (não chega); h = 6 → 64 − 2 = <b>62</b> (chega).</li>
<li>Prefixo = 32 − 6 = <b>/26</b> → 255.255.255.192. Bits emprestados = 26 − 24 = 2 → <b>4 sub-redes</b>.</li>
</ol>
<p><b>Problema 2</b>: uma empresa com <code>172.16.0.0/16</code> quer sub-redes de <b>500 hosts</b>.</p>
<ol>
<li>2<sup>8</sup> − 2 = 254 (não chega); 2<sup>9</sup> − 2 = 512 − 2 = <b>510</b> (chega) → h = 9.</li>
<li>Prefixo = 32 − 9 = <b>/23</b> → 255.255.254.0. Bits emprestados = 23 − 16 = 7 → 2<sup>7</sup> = <b>128 sub-redes</b>, com bloco 2 no 3.º octeto (172.16.0.0, 172.16.2.0, 172.16.4.0…).</li>
</ol>"""),
        tabela(["N.º", "Sub-rede", "Primeiro host", "Último host", "Broadcast"], [
            ["1", "172.16.0.0/20", "172.16.0.1", "172.16.15.254", "172.16.15.255"],
            ["2", "172.16.16.0/20", "172.16.16.1", "172.16.31.254", "172.16.31.255"],
            ["3", "172.16.32.0/20", "172.16.32.1", "172.16.47.254", "172.16.47.255"],
            ["4", "172.16.48.0/20", "172.16.48.1", "172.16.63.254", "172.16.63.255"],
            ["5", "172.16.64.0/20", "172.16.64.1", "172.16.79.254", "172.16.79.255"],
            ["6", "172.16.80.0/20", "172.16.80.1", "172.16.95.254", "172.16.95.255"],
            ["7", "172.16.96.0/20", "172.16.96.1", "172.16.111.254", "172.16.111.255"],
            ["8", "172.16.112.0/20", "172.16.112.1", "172.16.127.254", "172.16.127.255"],
            ["9", "172.16.128.0/20", "172.16.128.1", "172.16.143.254", "172.16.143.255"],
            ["10", "172.16.144.0/20", "172.16.144.1", "172.16.159.254", "172.16.159.255"],
            ["11", "172.16.160.0/20", "172.16.160.1", "172.16.175.254", "172.16.175.255"],
            ["12", "172.16.176.0/20", "172.16.176.1", "172.16.191.254", "172.16.191.255"],
            ["13", "172.16.192.0/20", "172.16.192.1", "172.16.207.254", "172.16.207.255"],
            ["14", "172.16.208.0/20", "172.16.208.1", "172.16.223.254", "172.16.223.255"],
            ["15", "172.16.224.0/20", "172.16.224.1", "172.16.239.254", "172.16.239.255"],
            ["16", "172.16.240.0/20", "172.16.240.1", "172.16.255.254", "172.16.255.255"],
        ], "Classe B: 172.16.0.0/16 em /20 — 4 bits emprestados, 2⁴ = 16 sub-redes, 2¹² − 2 = 4094 hosts cada, bloco 16 no 3.º octeto"),
        dica("""Pergunta-chave antes de calcular: o enunciado pede <b>sub-redes</b> (use 2<sup>s</sup> ≥ pedido) ou <b>hosts</b> (use 2<sup>h</sup> − 2 ≥ pedido)? Se pedir as duas coisas, verifique ambas com a mesma máscara. Deixe sempre alguma folga para o crescimento."""),
        alerta("""<b>Erros típicos:</b> usar 2<sup>s</sup> − 2 para sub-redes (essa regra antiga do “subnet zero” já não se aplica: o IOS usa a sub-rede zero por defeito, com <code>ip subnet-zero</code>); contar os bits emprestados a partir de /0 em vez de a partir do prefixo original; esquecer que o gateway gasta um dos hosts."""),
    ],
    [
        valor("Quantas sub-redes se obtêm emprestando 3 bits?", ["8"], "2³ = 8."),
        mc("Precisa de 5 sub-redes a partir de um /24. Que prefixo usa?", ["/25", "/26", "/27", "/28"], 2, "2² = 4 não chega; 2³ = 8 chega → 24 + 3 = /27."),
        valor("Precisa de 50 hosts por sub-rede. Qual é o prefixo? (ex.: /24)", ["/26", "26"], "2⁶ − 2 = 62 ≥ 50 → h = 6 → /26."),
        valor("Qual é a 3.ª sub-rede /27 de 192.168.10.0/24? (endereço de rede)", ["192.168.10.64", "192.168.10.64/27"], "Bloco 32: 0, 32, 64 → a 3.ª é .64."),
        mc("Qual é o broadcast da 2.ª sub-rede /26 de 192.168.10.0/24?", ["192.168.10.63", "192.168.10.64", "192.168.10.126", "192.168.10.127"], 3, "2.ª sub-rede = .64/26; próxima .128 → broadcast .127."),
        vf("Quanto mais bits se pedem emprestados, mais hosts cabem em cada sub-rede.", False, "É o contrário: mais sub-redes, menos hosts em cada uma."),
        valor("Quantas sub-redes /20 cabem em 172.16.0.0/16?", ["16"], "20 − 16 = 4 bits → 2⁴ = 16."),
        mc("Qual é o último host da sub-rede 172.16.48.0/20?", ["172.16.63.254", "172.16.48.254", "172.16.63.255", "172.16.64.1"], 0, "Bloco 16: 48 a 63 → broadcast 172.16.63.255, último host 172.16.63.254."),
        valor("Quantos hosts úteis tem cada sub-rede /23?", ["510"], "h = 9 → 2⁹ − 2 = 510."),
    ],
    ["rfc950", "odom1", "netacad_itn", "lammle"],
    nivel="intermédio",
))


# ---------------------------------------------------------------------------
# 7. VLSM e desenho da rede lógica
# ---------------------------------------------------------------------------

reg(licao(
    "n_vlsm_desenho", "VLSM e desenho da rede lógica", 35,
    ["Explicar porque o VLSM poupa endereços",
     "Aplicar o método VLSM: ordenar, começar pela maior, blocos contíguos",
     "Construir e documentar uma tabela de endereçamento completa",
     "Entender a sumarização de rotas"],
    [
        texto("O problema das sub-redes todas iguais", """
<p>Na divisão clássica todas as sub-redes têm o <b>mesmo tamanho</b>. Mas uma empresa real não é assim: a sede tem 100 computadores, uma filial tem 10 e uma ligação entre dois routers precisa só de <b>2</b> endereços. Se usarmos /25 para tudo, a ligação entre routers desperdiça 124 endereços.</p>
<p>O <b>VLSM</b> (Variable Length Subnet Mask, máscara de comprimento variável) permite usar <b>máscaras diferentes</b> dentro da mesma rede: cada sub-rede recebe o tamanho de que precisa. É como cortar um tecido para fazer roupa: primeiro corta-se a peça maior (o casaco), depois as calças, e com os retalhos fazem-se os bolsos. Se começasse pelos bolsos, ficaria sem espaço contínuo para o casaco.</p>"""),
        texto("O método VLSM em 5 passos", """
<ol>
<li><b>Liste</b> todas as redes necessárias (LANs e ligações WAN) com o número de hosts. Some 1 para o gateway se ainda não estiver incluído.</li>
<li><b>Ordene</b> da maior para a menor.</li>
<li>Para cada uma, escolha o <b>menor bloco</b> que chega: o menor h com 2<sup>h</sup> − 2 ≥ hosts. Prefixo = 32 − h.</li>
<li><b>Atribua</b> a maior no início do espaço disponível; a seguinte começa logo a seguir ao broadcast da anterior (blocos <b>contíguos</b>, sem buracos).</li>
<li>Confirme que cada endereço de rede é <b>múltiplo do seu bloco</b> e que nada se sobrepõe. Ordenando do maior para o menor isto acontece automaticamente.</li>
</ol>"""),
        tabela(["Rede", "Hosts pedidos", "h mínimo", "Hosts do bloco (2ʰ − 2)", "Prefixo", "Tamanho do bloco"], [
            ["LAN Sede (R1)", "100", "7", "126", "/25", "128"],
            ["LAN Filial Viana (R2)", "50", "6", "62", "/26", "64"],
            ["LAN Filial Benguela (R3)", "25", "5", "30", "/27", "32"],
            ["LAN Armazém (R3)", "10", "4", "14", "/28", "16"],
            ["WAN1 R1–R2", "2", "2", "2", "/30", "4"],
            ["WAN2 R1–R3", "2", "2", "2", "/30", "4"],
            ["WAN3 R2–R3", "2", "2", "2", "/30", "4"],
        ], "Passos 1 a 3: lista ordenada e tamanho de cada bloco (espaço: 192.168.1.0/24)"),
        exemplo("Passo 4: atribuir os blocos um a seguir ao outro", """
<ol>
<li><b>Sede /25</b>: começa em <b>192.168.1.0</b>. Bloco 128 → vai de .0 a .127.</li>
<li><b>Viana /26</b>: começa a seguir, em <b>.128</b>. Bloco 64 → .128 a .191.</li>
<li><b>Benguela /27</b>: começa em <b>.192</b>. Bloco 32 → .192 a .223.</li>
<li><b>Armazém /28</b>: começa em <b>.224</b>. Bloco 16 → .224 a .239.</li>
<li><b>WAN1 /30</b>: <b>.240</b> a .243. <b>WAN2 /30</b>: <b>.244</b> a .247. <b>WAN3 /30</b>: <b>.248</b> a .251.</li>
<li>Sobra <b>192.168.1.252/30</b> para uma futura ligação.</li>
</ol>
<p>Conta de controlo: 128 + 64 + 32 + 16 + 4 + 4 + 4 = 252 endereços usados; 256 − 252 = 4 livres. Tudo cabe num único /24! Com sub-redes iguais (/25) só teríamos 2 sub-redes e não chegava.</p>"""),
        tabela(["Rede", "Endereço de rede", "Máscara", "Gateway", "Intervalo de hosts", "Broadcast"], [
            ["LAN Sede", "192.168.1.0/25", "255.255.255.128", "192.168.1.1", "192.168.1.1 – 192.168.1.126", "192.168.1.127"],
            ["LAN Viana", "192.168.1.128/26", "255.255.255.192", "192.168.1.129", "192.168.1.129 – 192.168.1.190", "192.168.1.191"],
            ["LAN Benguela", "192.168.1.192/27", "255.255.255.224", "192.168.1.193", "192.168.1.193 – 192.168.1.222", "192.168.1.223"],
            ["LAN Armazém", "192.168.1.224/28", "255.255.255.240", "192.168.1.225", "192.168.1.225 – 192.168.1.238", "192.168.1.239"],
            ["WAN1 R1–R2", "192.168.1.240/30", "255.255.255.252", "—", "R1 .241 · R2 .242", "192.168.1.243"],
            ["WAN2 R1–R3", "192.168.1.244/30", "255.255.255.252", "—", "R1 .245 · R3 .246", "192.168.1.247"],
            ["WAN3 R2–R3", "192.168.1.248/30", "255.255.255.252", "—", "R2 .249 · R3 .250", "192.168.1.251"],
            ["Livre", "192.168.1.252/30", "255.255.255.252", "—", ".253 – .254", "192.168.1.255"],
        ], "Plano de endereçamento VLSM completo"),
        topologia(
            [("sa", "switch", 50, 5, "LAN Sede 192.168.1.0/25"),
             ("r1", "router", 50, 30, "R1 Sede .1"),
             ("r2", "router", 20, 62, "R2 Viana .129"),
             ("r3", "router", 80, 62, "R3 Benguela .193 / .225"),
             ("sb", "switch", 10, 92, "LAN Viana .128/26"),
             ("sc", "switch", 62, 92, "LAN Benguela .192/27"),
             ("sd", "switch", 94, 92, "LAN Armazém .224/28")],
            [("sa", "r1", "LAN /25"), ("r1", "r2", "WAN1 .240/30"), ("r1", "r3", "WAN2 .244/30"),
             ("r2", "r3", "WAN3 .248/30"), ("r2", "sb", "/26"), ("r3", "sc", "/27"), ("r3", "sd", "/28")],
            "Rede lógica da empresa: 4 LANs e 3 ligações ponto a ponto, tudo dentro de 192.168.1.0/24"),
        texto("Documentar: a tabela de endereçamento", """
<p>Numa empresa, o plano não fica só na cabeça do técnico. Faz-se uma <b>tabela de endereçamento</b> (num ficheiro partilhado pela equipa) com uma linha por <b>interface</b> de cada equipamento:</p>
<ul>
<li><b>Equipamento</b> (R1, SW-Sede, Servidor-Ficheiros…)</li>
<li><b>Interface</b> (G0/0, G0/1, S0/0/0, VLAN 10…)</li>
<li><b>Endereço IP</b> e <b>máscara</b></li>
<li><b>Gateway por defeito</b> (para PCs, servidores e switches)</li>
<li><b>Descrição</b> (“Ligação a R2”, “LAN Sede”)</li>
</ul>
<p>Convenções que ajudam toda a gente: gateway sempre no <b>primeiro</b> host; servidores e impressoras com IP fixo no início do intervalo (ex.: .2 a .20); DHCP para os restantes; o router com o número mais baixo de uma WAN fica com o primeiro host.</p>"""),
        tabela(["Equipamento", "Interface", "Endereço IP", "Máscara", "Gateway"], [
            ["R1", "G0/0 (LAN Sede)", "192.168.1.1", "255.255.255.128", "—"],
            ["R1", "S0/0/0 (WAN1)", "192.168.1.241", "255.255.255.252", "—"],
            ["R1", "S0/0/1 (WAN2)", "192.168.1.245", "255.255.255.252", "—"],
            ["R2", "G0/0 (LAN Viana)", "192.168.1.129", "255.255.255.192", "—"],
            ["R2", "S0/0/0 (WAN1)", "192.168.1.242", "255.255.255.252", "—"],
            ["R2", "S0/0/1 (WAN3)", "192.168.1.249", "255.255.255.252", "—"],
            ["R3", "G0/0 (LAN Benguela)", "192.168.1.193", "255.255.255.224", "—"],
            ["R3", "G0/1 (LAN Armazém)", "192.168.1.225", "255.255.255.240", "—"],
            ["R3", "S0/0/0 (WAN2)", "192.168.1.246", "255.255.255.252", "—"],
            ["R3", "S0/0/1 (WAN3)", "192.168.1.250", "255.255.255.252", "—"],
            ["PC-Sede-01", "NIC", "192.168.1.10", "255.255.255.128", "192.168.1.1"],
            ["PC-Armazém-01", "NIC", "192.168.1.230", "255.255.255.240", "192.168.1.225"],
        ], "Excerto da tabela de endereçamento"),
        exemplo("Sumarização: anunciar muitas redes numa só", """
<p><b>Sumarizar</b> é juntar várias redes contíguas numa só rota maior, para as tabelas dos routers ficarem pequenas. Como resumir o bairro inteiro em vez de dar a lista de todas as ruas.</p>
<p>No nosso desenho, todas as sub-redes estão dentro de <code>192.168.1.0/24</code>: para o resto do mundo basta <b>uma rota</b>.</p>
<p>Outro exemplo: 172.16.0.0/24, 172.16.1.0/24, 172.16.2.0/24 e 172.16.3.0/24.</p>
<ol>
<li>Escreva o 3.º octeto em binário: 0 = <code>000000|00</code>, 1 = <code>000000|01</code>, 2 = <code>000000|10</code>, 3 = <code>000000|11</code>.</li>
<li>Os primeiros <b>6 bits</b> são iguais em todos. Bits comuns: 8 + 8 + 6 = <b>22</b>.</li>
<li>Rota sumária: <b>172.16.0.0/22</b> (255.255.252.0), que cobre exatamente as quatro.</li>
</ol>"""),
        dica("""<b>Dicas do terreno:</b> reserve espaço para crescimento (uma filial de 25 hoje pode ter 40 daqui a dois anos); agrupe as WAN /30 no fim do espaço; use blocos alinhados por localização para facilitar a sumarização; e mantenha a tabela de endereçamento sempre atualizada: é o primeiro documento que se abre quando algo avaria."""),
        alerta("""Se atribuir primeiro as redes pequenas, os blocos grandes podem deixar de ficar alinhados (um /25 tem de começar em .0 ou .128) e acaba com <b>sobreposições</b> ou buracos inutilizáveis. Regra de ouro do VLSM: <b>da maior para a menor</b>."""),
    ],
    [
        mc("No VLSM, por que ordem se atribuem as sub-redes?", ["Da maior para a menor", "Da menor para a maior", "Por ordem alfabética", "Aleatoriamente"], 0, "Da maior para a menor, para os blocos ficarem alinhados e contíguos."),
        valor("Que prefixo serve para uma LAN de 100 hosts com o mínimo de desperdício? (ex.: /24)", ["/25", "25"], "2⁷ − 2 = 126 ≥ 100; 2⁶ − 2 = 62 não chega → /25."),
        valor("Que prefixo serve para uma LAN de 10 hosts com o mínimo de desperdício?", ["/28", "28"], "2⁴ − 2 = 14 ≥ 10 → /28."),
        mc("No plano da aula, qual é a rede da LAN Benguela (25 hosts)?", ["192.168.1.128/27", "192.168.1.224/27", "192.168.1.160/27", "192.168.1.192/27"], 3, "Depois de .0/25 e .128/26, o próximo livre é .192 → 192.168.1.192/27."),
        valor("Qual é o broadcast da WAN 192.168.1.244/30?", ["192.168.1.247"], "Bloco 4: .244 a .247."),
        vf("O VLSM permite usar máscaras diferentes dentro da mesma rede principal.", True, "É exatamente o significado de Variable Length Subnet Mask."),
        valor("Qual é a rota sumária de 172.16.0.0/24 a 172.16.3.0/24?", ["172.16.0.0/22"], "Os 22 primeiros bits são comuns."),
        mc("Qual é o gateway habitual da LAN Armazém 192.168.1.224/28?", ["192.168.1.224", "192.168.1.225", "192.168.1.238", "192.168.1.239"], 1, "Por convenção, o primeiro host: .225."),
        valor("Quantos endereços ficam livres no plano da aula (192.168.1.0/24)?", ["4"], "256 − (128+64+32+16+4+4+4) = 256 − 252 = 4 (o bloco .252/30)."),
    ],
    ["rfc4632", "rfc950", "odom1", "netacad_itn"],
    nivel="intermédio",
))


# ---------------------------------------------------------------------------
# 8. O modelo OSI em profundidade
# ---------------------------------------------------------------------------

reg(licao(
    "n_osi_fundo", "O modelo OSI em profundidade", 32,
    ["Explicar porque se usam modelos em camadas",
     "Descrever as 7 camadas: função, PDU, equipamentos e protocolos",
     "Seguir o encapsulamento e o desencapsulamento de um pedido real",
     "Usar o OSI para localizar avarias (de baixo para cima e de cima para baixo)"],
    [
        texto("Porque existem modelos em camadas: a encomenda pelo correio", """
<p>Enviar dados pela rede é um trabalho enorme. Para o tornar manejável, divide-se em <b>camadas</b>: cada uma faz uma parte do trabalho e só precisa de “falar” com a camada de cima e a de baixo.</p>
<p>Pense em enviar uma encomenda de Luanda para Lubango por uma transportadora:</p>
<ul>
<li>Você escreve a carta (o <b>conteúdo</b>) e não quer saber de camiões.</li>
<li>Põe-na num envelope com morada (o <b>endereço</b>).</li>
<li>A transportadora mete o envelope numa caixa, numa carrinha, num camião (o <b>transporte físico</b>).</li>
<li>No destino, cada etapa desfaz o que a correspondente fez, até a carta chegar às mãos do destinatário.</li>
</ul>
<p>O <b>modelo OSI</b> (Open Systems Interconnection), publicado pela ISO em 1984 (norma ISO/IEC 7498-1), divide a comunicação em <b>7 camadas</b>. Vantagens: fabricantes diferentes conseguem trabalhar juntos (normas), pode mudar-se uma camada sem mexer nas outras (trocar cabo por Wi-Fi não altera o navegador) e os técnicos têm uma linguagem comum (“é um problema de camada 2”).</p>"""),
        figura("osi", "As 7 camadas do modelo OSI, da Física (1) à Aplicação (7)"),
        texto("Camada 1 — Física", """
<p><b>O que faz</b>: transforma os bits (0 e 1) em <b>sinais</b> — impulsos elétricos no cabo de cobre, luz na fibra ótica, ondas de rádio no Wi-Fi — e define cabos, conectores, tensões e velocidades.</p>
<p><b>PDU</b> (Protocol Data Unit, o nome do “pacote” de dados em cada camada): <b>bits</b>.</p>
<p><b>Equipamentos</b>: cabos UTP e de fibra, conectores RJ45, hubs, repetidores, transceivers, placas de rede (parte física).</p>
<p><b>Normas</b>: Ethernet física (IEEE 802.3: 100BASE-TX, 1000BASE-T), TIA-568, rádio 802.11.</p>
<p><b>Exemplo real</b>: a luz verde a piscar na porta do switch indica que há sinal elétrico.</p>
<p><b>O que corre mal</b>: cabo cortado ou mal cravado, conector partido, interferência eletromagnética, cabo demasiado comprido (mais de 100 m em UTP), porta desligada. Sintoma: interface <code>down/down</code>, sem luz.</p>"""),
        texto("Camada 2 — Ligação de dados (Data Link)", """
<p><b>O que faz</b>: entrega dados entre equipamentos <b>da mesma rede local</b> usando endereços <b>MAC</b>. Organiza os bits em tramas, deteta erros com o <b>FCS</b> (um código de verificação no fim da trama) e controla quem pode transmitir.</p>
<p><b>PDU</b>: <b>trama</b> (frame).</p>
<p><b>Equipamentos</b>: switch, bridge, access point, placa de rede.</p>
<p><b>Protocolos</b>: Ethernet (802.3), Wi-Fi (802.11), VLANs (802.1Q), STP, ARP (entre a 2 e a 3), PPP.</p>
<p><b>Exemplo real</b>: o switch aprende que o MAC do seu PC está na porta 5 e passa a enviar-lhe só a ele as tramas destinadas a esse MAC.</p>
<p><b>O que corre mal</b>: VLAN errada na porta, loops de switching (sem STP), MAC duplicado, desajuste de duplex (muitas colisões e erros CRC). Sintoma: <code>up/down</code> ou ligação lenta com erros.</p>"""),
        texto("Camada 3 — Rede", """
<p><b>O que faz</b>: leva os dados <b>de uma rede para outra</b>, escolhendo o caminho (<b>encaminhamento</b> ou routing) com base em endereços lógicos: <b>IP</b>.</p>
<p><b>PDU</b>: <b>pacote</b>.</p>
<p><b>Equipamentos</b>: router, switch de camada 3, firewall.</p>
<p><b>Protocolos</b>: IPv4, IPv6, ICMP (ping), OSPF, EIGRP, BGP.</p>
<p><b>Exemplo real</b>: o router de casa recebe um pacote para 8.8.8.8, vê que não é da rede local e envia-o para o operador.</p>
<p><b>O que corre mal</b>: IP ou máscara errados, gateway por defeito em falta, rota inexistente, ACL a bloquear. Sintoma: consegue falar com PCs da mesma rede mas não com outras redes.</p>"""),
        texto("Camada 4 — Transporte", """
<p><b>O que faz</b>: entrega os dados à <b>aplicação certa</b> (através das <b>portas</b>: 80 para web, 443 para web segura, 53 para DNS) e, se for preciso, garante que tudo chega completo e por ordem.</p>
<p><b>PDU</b>: <b>segmento</b> (TCP) ou <b>datagrama</b> (UDP).</p>
<p><b>Equipamentos</b>: não há um equipamento típico; firewalls e balanceadores de carga olham para esta camada.</p>
<p><b>Protocolos</b>: <b>TCP</b> (fiável: confirma, reenvia, ordena; ex.: web, e-mail) e <b>UDP</b> (rápido, sem confirmações; ex.: voz, vídeo, DNS).</p>
<p><b>Exemplo real</b>: ao descarregar um ficheiro, o TCP reenvia os segmentos que se perderam e o ficheiro chega inteiro.</p>
<p><b>O que corre mal</b>: porta bloqueada por firewall, serviço não está à escuta naquela porta, demasiadas retransmissões. Sintoma: o ping funciona mas o site não abre.</p>"""),
        texto("Camada 5 — Sessão", """
<p><b>O que faz</b>: abre, mantém e fecha o “diálogo” (<b>sessão</b>) entre duas aplicações, e pode criar pontos de controlo para retomar uma transferência interrompida.</p>
<p><b>PDU</b>: <b>dados</b>.</p>
<p><b>Protocolos/exemplos</b>: NetBIOS, RPC, PPTP, controlo de sessões em videoconferência. Em TCP/IP estas funções ficam dentro da aplicação.</p>
<p><b>Exemplo real</b>: o banco online termina a sua sessão ao fim de 5 minutos sem atividade.</p>
<p><b>O que corre mal</b>: sessões que expiram demasiado cedo, autenticação de sessão falhada.</p>"""),
        texto("Camada 6 — Apresentação", """
<p><b>O que faz</b>: garante que os dados estão num <b>formato</b> que o destino entende: <b>codificação</b> de caracteres (ASCII, UTF-8), <b>compressão</b> (JPEG, MP3) e <b>cifra</b> (encriptação). É o “tradutor” da rede.</p>
<p><b>PDU</b>: <b>dados</b>.</p>
<p><b>Exemplos</b>: TLS/SSL (cifra do HTTPS), JPEG, PNG, MPEG, UTF-8.</p>
<p><b>Exemplo real</b>: o cadeado do navegador: a página vem cifrada e é decifrada antes de ser mostrada.</p>
<p><b>O que corre mal</b>: acentos que aparecem como símbolos estranhos (“Ã©” em vez de “é”, codificação errada), certificado TLS inválido ou expirado.</p>"""),
        texto("Camada 7 — Aplicação", """
<p><b>O que faz</b>: é a camada mais próxima do <b>utilizador</b>: fornece os serviços de rede às aplicações (navegador, e-mail, WhatsApp). Atenção: a camada 7 não é o programa em si, mas o <b>protocolo</b> que ele usa.</p>
<p><b>PDU</b>: <b>dados</b>.</p>
<p><b>Protocolos</b>: HTTP/HTTPS (web), DNS (nomes), DHCP (endereços automáticos), SMTP/IMAP (e-mail), FTP, SSH, Telnet, SNMP.</p>
<p><b>Exemplo real</b>: o navegador envia <code>GET /index.html</code> por HTTP para pedir uma página.</p>
<p><b>O que corre mal</b>: DNS não resolve o nome (“servidor não encontrado”), erro 404 (página não existe), servidor web parado, credenciais erradas.</p>"""),
        dica("""<b>Mnemónicas</b>. De baixo para cima (1→7): <b>F</b>aça <b>L</b>á <b>R</b>apidamente <b>T</b>odas as <b>S</b>uas <b>A</b>ulas <b>A</b>trasadas → Física, Ligação de dados, Rede, Transporte, Sessão, Apresentação, Aplicação. Em inglês: <b>P</b>lease <b>D</b>o <b>N</b>ot <b>T</b>hrow <b>S</b>ausage <b>P</b>izza <b>A</b>way. E as PDUs (4→1): <b>S</b>egmento, <b>P</b>acote, <b>T</b>rama, <b>B</b>its — “<b>S</b>ó <b>P</b>enso <b>T</b>odos os <b>B</b>its”."""),
        exemplo("Encapsulamento ao abrir um site, passo a passo", """
<p><b>No seu PC (a descer, 7 → 1), ao abrir www.exemplo.ao:</b></p>
<ol>
<li><b>7 Aplicação</b>: o navegador cria o pedido HTTP <code>GET /</code>.</li>
<li><b>6 Apresentação</b>: o TLS cifra o pedido (HTTPS) e o texto está em UTF-8.</li>
<li><b>5 Sessão</b>: mantém-se a sessão aberta com o servidor.</li>
<li><b>4 Transporte</b>: o TCP junta um cabeçalho com porta de origem (ex.: 50123) e destino <b>443</b> → <b>segmento</b>.</li>
<li><b>3 Rede</b>: o IP junta o IP de origem (192.168.1.23) e de destino (o do servidor) → <b>pacote</b>.</li>
<li><b>2 Ligação de dados</b>: a Ethernet junta MAC de origem (o do PC) e de destino (o do <b>gateway</b>, porque o servidor está noutra rede) e o FCS no fim → <b>trama</b>.</li>
<li><b>1 Física</b>: a placa de rede envia os <b>bits</b> como sinais no cabo ou no ar.</li>
</ol>
<p><b>Em cada router pelo caminho</b>: sobe só até à camada 3 — tira a trama, lê o IP de destino, escolhe o caminho e cria uma <b>trama nova</b> (MACs novos) para o próximo salto. Os IPs não mudam (exceto com NAT).</p>
<p><b>No servidor (a subir, 1 → 7)</b>: é o <b>desencapsulamento</b>. Cada camada lê e retira o “seu” cabeçalho e entrega o resto à camada de cima, até o servidor web receber o <code>GET /</code>.</p>"""),
        figura("encapsulamento", "Cada camada acrescenta o seu cabeçalho: dados → segmento → pacote → trama → bits"),
        texto("Resolver avarias camada a camada", """
<p>O OSI é uma ferramenta de diagnóstico. Dois métodos clássicos:</p>
<ul>
<li><b>De baixo para cima</b> (bottom-up): começa na camada 1 (o cabo está ligado? há luz?), depois 2 (a porta está na VLAN certa? o MAC aparece na tabela?), depois 3 (o IP e o gateway estão certos? o ping ao gateway funciona?), e assim por diante. Bom quando suspeita de problema físico ou quando não sabe nada.</li>
<li><b>De cima para baixo</b> (top-down): começa na aplicação (abre outro site? o nome resolve?) e desce. Bom quando só uma aplicação falha.</li>
<li><b>Dividir para conquistar</b>: começa no meio (um <code>ping</code> = camada 3). Se funciona, as camadas 1–3 estão bem e o problema está acima; se falha, está abaixo.</li>
</ul>
<p>Exemplo: um utilizador diz “a Internet não funciona”. <code>ping 8.8.8.8</code> funciona mas <code>ping www.exemplo.ao</code> falha → as camadas 1–3 estão bem; o problema é o <b>DNS</b> (camada 7).</p>"""),
        tabela(["N.º", "Camada", "Função", "PDU", "Equipamentos", "Protocolos / exemplos"], [
            ["7", "Aplicação", "Serviços de rede para as aplicações", "Dados", "Servidores, PCs", "HTTP, DNS, DHCP, SMTP, SSH"],
            ["6", "Apresentação", "Formato, cifra, compressão", "Dados", "—", "TLS, JPEG, UTF-8"],
            ["5", "Sessão", "Abrir, manter, fechar diálogos", "Dados", "—", "NetBIOS, RPC"],
            ["4", "Transporte", "Portas, fiabilidade, ordem", "Segmento / datagrama", "Firewall", "TCP, UDP"],
            ["3", "Rede", "Endereço lógico e encaminhamento", "Pacote", "Router, switch L3", "IPv4, IPv6, ICMP, OSPF"],
            ["2", "Ligação de dados", "Entrega local por MAC, deteção de erros", "Trama", "Switch, AP, placa de rede", "Ethernet, 802.11, 802.1Q, STP"],
            ["1", "Física", "Sinais, cabos, conectores", "Bits", "Cabos, hub, repetidor", "802.3 física, RJ45, fibra"],
        ], "Resumo do modelo OSI"),
    ],
    [
        mc("Qual é a PDU da camada 2?", ["Pacote", "Segmento", "Trama", "Bits"], 2, "Camada 2 = trama (frame)."),
        mc("Em que camada trabalha um router?", ["3", "1", "2", "7"], 0, "O router encaminha pacotes por endereço IP: camada 3."),
        valor("Qual é o número da camada de Transporte no OSI?", ["4"], "Física 1, Ligação 2, Rede 3, Transporte 4."),
        mc("A cifra TLS e a codificação UTF-8 pertencem a que camada?", ["Sessão", "Apresentação", "Transporte", "Rede"], 1, "Formato, cifra e compressão: camada 6, Apresentação."),
        vf("Quando um pacote atravessa um router, os endereços MAC da trama são substituídos.", True, "Cada salto cria uma trama nova; os IPs mantêm-se (sem NAT)."),
        mc("O ping a 8.8.8.8 funciona, mas www.exemplo.ao não abre. Qual é a suspeita mais provável?", ["Cabo partido", "VLAN errada", "DNS (camada 7)", "Máscara errada"], 2, "Se o ping a um IP externo funciona, as camadas 1–3 estão bem; falha a resolução de nomes."),
        mc("Que equipamento trabalha principalmente na camada 2?", ["Hub", "Router", "Repetidor", "Switch"], 3, "O switch encaminha tramas pelo endereço MAC."),
        vf("No encapsulamento, os dados descem da camada 7 para a 1 e cada camada acrescenta o seu cabeçalho.", True, "No destino faz-se o inverso (desencapsulamento)."),
        valor("Quantas camadas tem o modelo OSI?", ["7", "sete"], "Física, Ligação de dados, Rede, Transporte, Sessão, Apresentação, Aplicação."),
    ],
    ["iso7498", "kurose", "tanenbaum", "odom1"],
    nivel="básico",
))


# ---------------------------------------------------------------------------
# 9. O modelo TCP/IP em profundidade
# ---------------------------------------------------------------------------

reg(licao(
    "n_tcpip_fundo", "O modelo TCP/IP em profundidade", 32,
    ["Descrever as 4 camadas do TCP/IP e o modelo híbrido de 5 camadas",
     "Relacionar o TCP/IP com o OSI",
     "Seguir tudo o que acontece ao escrever um endereço no navegador",
     "Calcular o tamanho dos cabeçalhos e explicar portas e sockets"],
    [
        texto("O modelo que a Internet realmente usa", """
<p>O OSI é ótimo para estudar, mas a Internet funciona com o modelo <b>TCP/IP</b>, nascido nos anos 70 com o trabalho de Vint Cerf e Bob Kahn e adotado na ARPANET em <b>1 de janeiro de 1983</b>. Chama-se assim pelos seus dois protocolos mais importantes: <b>TCP</b> (Transmission Control Protocol) e <b>IP</b> (Internet Protocol).</p>
<p>Tem <b>4 camadas</b>:</p>
<ol>
<li><b>Acesso à rede</b> (ou Ligação): põe os dados no meio físico da rede local — Ethernet, Wi-Fi, cabos, MAC. Junta as camadas 1 e 2 do OSI.</li>
<li><b>Internet</b>: endereça e encaminha os pacotes entre redes — IP, ICMP. Corresponde à camada 3.</li>
<li><b>Transporte</b>: entrega à aplicação certa através das portas, com fiabilidade (TCP) ou rapidez (UDP). Corresponde à camada 4.</li>
<li><b>Aplicação</b>: protocolos que os programas usam — HTTP, DNS, DHCP, SMTP, SSH. Junta as camadas 5, 6 e 7.</li>
</ol>"""),
        tabela(["OSI (7)", "TCP/IP (4)", "Híbrido (5) — Cisco/Kurose", "Exemplos"], [
            ["7 Aplicação", "Aplicação", "5 Aplicação", "HTTP, DNS, DHCP, SMTP, SSH"],
            ["6 Apresentação", "Aplicação", "5 Aplicação", "TLS, UTF-8, JPEG"],
            ["5 Sessão", "Aplicação", "5 Aplicação", "Sessões, RPC"],
            ["4 Transporte", "Transporte", "4 Transporte", "TCP, UDP"],
            ["3 Rede", "Internet", "3 Rede", "IPv4, IPv6, ICMP"],
            ["2 Ligação de dados", "Acesso à rede", "2 Ligação de dados", "Ethernet, 802.11, ARP"],
            ["1 Física", "Acesso à rede", "1 Física", "UTP, fibra, rádio"],
        ], "Mapeamento entre os modelos"),
        texto("O modelo híbrido de 5 camadas", """
<p>Muitos livros (Kurose, Tanenbaum) e o próprio material da Cisco usam um modelo de <b>5 camadas</b>: é o TCP/IP, mas com a camada de Acesso à rede <b>separada</b> em <b>Física</b> e <b>Ligação de dados</b>. Porquê? Porque na prática os técnicos falam muito destas duas em separado: “é camada 1” (cabo) é muito diferente de “é camada 2” (VLAN, switch).</p>
<p>Por isso, quando ouvir “switch de camada 3” ou “problema de camada 2”, os números vêm do OSI, que continua a ser a linguagem comum, mesmo que o software siga o TCP/IP.</p>"""),
        exemplo("Escrever www.exemplo.ao no navegador (parte 1: preparar)", """
<p>O PC tem IP 192.168.1.23/24, gateway 192.168.1.1 e DNS 8.8.8.8. O utilizador escreve <code>www.exemplo.ao</code> e carrega em Enter.</p>
<ol>
<li><b>DNS — descobrir o IP</b>. O navegador não sabe o IP do site. Pergunta ao servidor DNS (porta <b>UDP 53</b>): “qual é o IP de www.exemplo.ao?”. Resposta, por exemplo: <code>196.46.10.5</code>.</li>
<li><b>Decidir: local ou remoto?</b> O PC faz o AND do IP de destino com a sua máscara: 196.46.10.0 ≠ 192.168.1.0 → o destino está <b>noutra rede</b>, por isso os pacotes vão para o <b>gateway</b> (192.168.1.1).</li>
<li><b>ARP — descobrir o MAC do gateway</b>. Para construir a trama Ethernet o PC precisa do MAC do gateway. Envia um <b>ARP Request</b> em broadcast (“quem tem 192.168.1.1?”); o router responde com um <b>ARP Reply</b> com o seu MAC. O PC guarda-o na <b>tabela ARP</b> (cache).</li>
</ol>
<p>Nota: o pedido DNS do passo 1 também precisou do ARP do gateway, já que 8.8.8.8 está fora da rede local. Normalmente o MAC já está em cache.</p>"""),
        figura("handshake", "O three-way handshake do TCP: SYN, SYN-ACK, ACK"),
        exemplo("Escrever www.exemplo.ao no navegador (parte 2: falar com o servidor)", """
<ol start="4">
<li><b>TCP — three-way handshake</b> (aperto de mão em 3 passos) para a porta <b>443</b> (HTTPS):
<ul><li>PC → servidor: <b>SYN</b> (“quero ligar-me”)</li><li>Servidor → PC: <b>SYN-ACK</b> (“aceito, e também quero”)</li><li>PC → servidor: <b>ACK</b> (“combinado”)</li></ul></li>
<li><b>TLS</b>: negociam as chaves de cifra e o servidor mostra o seu certificado.</li>
<li><b>HTTP</b>: o navegador envia <code>GET / HTTP/1.1</code> com <code>Host: www.exemplo.ao</code>. O servidor responde <code>200 OK</code> com o HTML da página.</li>
<li><b>Encaminhamento (routing)</b>: cada pacote atravessa vários routers (casa → operador → Internet → servidor). Em cada um, a trama é retirada, o IP de destino é consultado na <b>tabela de encaminhamento</b> e é criada uma trama nova para o salto seguinte. Pelo caminho, o router de casa fez <b>NAT</b>: trocou 192.168.1.23 pelo IP público.</li>
<li>O navegador lê o HTML, pede imagens e scripts (mais pedidos HTTP) e desenha a página no ecrã.</li>
</ol>
<p>Tudo isto acontece, normalmente, em menos de um segundo.</p>"""),
        tabela(["Camada", "Cabeçalho", "Tamanho", "Campos principais"], [
            ["Acesso à rede", "Ethernet", "14 bytes + 4 de FCS no fim", "MAC destino (6), MAC origem (6), EtherType (2); FCS (4)"],
            ["Internet", "IPv4", "20 bytes (mínimo, sem opções)", "Versão, TTL, protocolo, IP origem, IP destino, checksum"],
            ["Internet", "IPv6", "40 bytes (fixo)", "Endereços de 128 bits, hop limit, flow label"],
            ["Transporte", "TCP", "20 bytes (mínimo)", "Portas, n.º de sequência, ACK, flags (SYN, ACK, FIN), janela"],
            ["Transporte", "UDP", "8 bytes", "Porta origem, porta destino, comprimento, checksum"],
        ], "Cabeçalhos acrescentados em cada camada"),
        exemplo("Quanto “pesa” o envelope? Contas de cabeçalhos", """
<p>Uma aplicação envia <b>1000 bytes</b> de dados por TCP sobre IPv4 e Ethernet:</p>
<ol>
<li>Segmento TCP = 1000 + 20 = <b>1020 bytes</b>.</li>
<li>Pacote IP = 1020 + 20 = <b>1040 bytes</b>.</li>
<li>Trama Ethernet = 1040 + 14 + 4 = <b>1058 bytes</b>.</li>
</ol>
<p>Os mesmos 1000 bytes por <b>UDP</b>: 1000 + 8 = 1008; + 20 = 1028; + 18 = <b>1046 bytes</b>. O UDP gasta menos 12 bytes por cabeçalho — uma das razões por que é preferido para voz e vídeo.</p>
<p>A <b>MTU</b> (Maximum Transmission Unit) da Ethernet é <b>1500 bytes</b>: o tamanho máximo do pacote IP dentro da trama. Por isso o máximo de dados TCP por segmento (MSS) é 1500 − 20 − 20 = <b>1460 bytes</b>.</p>"""),
        figura("trama_ethernet", "A trama Ethernet: cabeçalho de 14 bytes, dados (pacote IP) e FCS de 4 bytes"),
        texto("Portas e sockets", """
<p>Um servidor pode ter ao mesmo tempo um site, e-mail e DNS. Como sabe a que programa entregar cada segmento? Pela <b>porta</b>: um número de 16 bits (0 a 65 535) no cabeçalho TCP/UDP. Analogia: o IP é a morada do prédio, a porta é o número do apartamento.</p>
<ul>
<li><b>0–1023</b>: portas bem conhecidas (well-known): 20/21 FTP, 22 SSH, 23 Telnet, 25 SMTP, 53 DNS, 67/68 DHCP, 80 HTTP, 110 POP3, 143 IMAP, 161 SNMP, 443 HTTPS.</li>
<li><b>1024–49 151</b>: registadas (ex.: 3389 RDP).</li>
<li><b>49 152–65 535</b>: dinâmicas/efémeras — escolhidas ao acaso pelo cliente como porta de origem.</li>
</ul>
<p>Um <b>socket</b> é a combinação <b>IP + protocolo + porta</b>, por exemplo <code>192.168.1.23:50123</code>. Uma ligação TCP é identificada por um par de sockets: <code>192.168.1.23:50123 ↔ 196.46.10.5:443</code>. É assim que o PC tem 10 separadores abertos no mesmo site sem misturar as respostas: cada um usa uma porta de origem diferente.</p>"""),
        tabela(["Aspeto", "OSI", "TCP/IP"], [
            ["Camadas", "7", "4 (ou 5 no modelo híbrido)"],
            ["Origem", "ISO, norma teórica (1984)", "DARPA/IETF, nasceu da prática (anos 70–80)"],
            ["Uso real", "Referência para estudo e diagnóstico", "É o que corre na Internet e nas redes"],
            ["Sessão e Apresentação", "Camadas separadas", "Dentro da Aplicação"],
            ["Física e Ligação", "Camadas separadas", "Juntas em Acesso à rede"],
            ["Normas", "ISO/IEC 7498", "RFCs (791 IP, 9293 TCP, 768 UDP…)"],
        ], "OSI vs TCP/IP"),
        dica("""No exame, se perguntarem “em que camada TCP/IP funciona o HTTP?”, a resposta é <b>Aplicação</b>; se perguntarem “em que camada OSI funciona a Ethernet?”, é a <b>2 (Ligação de dados)</b>. Leia sempre com atenção <b>qual dos modelos</b> está a ser pedido."""),
    ],
    [
        valor("Quantas camadas tem o modelo TCP/IP original?", ["4", "quatro"], "Acesso à rede, Internet, Transporte, Aplicação."),
        mc("A camada Internet do TCP/IP corresponde a que camada OSI?", ["2", "3", "4", "7"], 1, "Internet = Rede (camada 3): IP e ICMP."),
        mc("Que protocolo descobre o MAC do gateway a partir do seu IP?", ["DNS", "DHCP", "ICMP", "ARP"], 3, "ARP: Request em broadcast, Reply em unicast."),
        valor("Quantos bytes tem o cabeçalho UDP?", ["8"], "Portas (2+2), comprimento (2), checksum (2) = 8."),
        valor("1000 bytes de dados por TCP/IPv4 sobre Ethernet: quantos bytes tem a trama (cabeçalho 14 + FCS 4)?", ["1058"], "1000 + 20 (TCP) + 20 (IP) + 14 + 4 = 1058."),
        mc("Qual é a ordem correta do three-way handshake?", ["ACK, SYN, SYN-ACK", "SYN, ACK, SYN-ACK", "SYN, SYN-ACK, ACK", "SYN-ACK, SYN, ACK"], 2, "SYN → SYN-ACK → ACK."),
        vf("No modelo TCP/IP, as funções das camadas Sessão e Apresentação do OSI ficam na camada de Aplicação.", True, "A Aplicação do TCP/IP junta as camadas 5, 6 e 7."),
        mc("O que é um socket?", ["A combinação IP + protocolo + porta", "Um tipo de cabo", "O endereço MAC", "Uma VLAN"], 0, "Ex.: 192.168.1.23:50123 (TCP)."),
        valor("Qual é a porta bem conhecida do HTTPS?", ["443"], "HTTP 80, HTTPS 443."),
        mc("Qual é o MSS típico do TCP numa Ethernet com MTU de 1500 bytes?", ["1500", "1480", "1460", "1440"], 2, "1500 − 20 (IP) − 20 (TCP) = 1460."),
    ],
    ["rfc9293", "rfc768", "rfc791", "kurose"],
    nivel="intermédio",
))
