# Curso de Redes de Computadores — CCNA Passo a Passo

Aplicação móvel (PWA) para estudar redes de computadores **do zero absoluto até ao CCNA 200-301**.

- **Primeiro acesso guiado**: nome, idade, género, motivos para estudar, experiência e horário de estudo (minutos por dia, sessões por dia, dias da semana).
- **Plano diário adaptativo**: as aulas de cada dia distribuídas pelas sessões; a data de conclusão é recalculada pelo ritmo real, pelas notas (aulas fracas ganham reforço), pelo caderno de erros e pelos dias falhados. Avisa quando há atraso e propõe a nova carga horária.
- **Conteúdo programático completo**: 65 módulos em 6 partes (Fundamentos, CCNA 1 ITN, CCNA 2 SRWE, CCNA 3 ENSA, complementares e projeto final), 98 aulas. Cada módulo abre com um **vídeo curto**: resumo do módulo anterior, apresentação do novo e o seu conteúdo programático.
- **Aulas aprofundadas e muito explicadas**: conversões decimal/binário/hexadecimal, classes de endereços, máscaras e CIDR, cálculo de sub-redes passo a passo, divisão em sub-redes, VLSM e desenho da rede lógica, modelo OSI e TCP/IP em profundidade.
- **Termos técnicos explicados em todas as aulas** (glossário de 573 termos) e **catálogo de 68 protocolos** (para que servem, camada, portas, como funcionam, comandos, segurança).
- **Exercícios sem fim em cada aula**: 10 obrigatórios para concluir a aula, depois tantos quantos quiser, todos com a resolução passo a passo. Cadernos numerados: **50 de conversão binária**, **100 de sub-redes**, 40 de classes/máscaras, 20 de VLSM com diagrama e 40 de OSI/portas.
- **Teste final de cada módulo** (nota 0–1000, aprovação 825) com perguntas e exercícios gerados.
- **Estágio profissional em cada módulo**: numa empresa (loja, escola, clínica, hotel, banco, hospital, operador, fábrica) o instrutor resolve um ticket real passo a passo; depois o estagiário resolve 5 tickets sozinho e recebe nota de 0 a 20.
- **Simulador de rede dentro da app** (como o Packet Tracer): equipamentos, cabos com luzes, terminal Cisco IOS com os comandos do CCNA, PCs, servidores DHCP/DNS, **partilha de pastas (SMB)**, 14 atividades guiadas e **projetos com nome** que se guardam e se continuam depois (exportar/importar).
- **Sala de laboratório**: bancadas com equipamento “físico”: escolher e ligar cabos, ligar à corrente, luzes das portas, cabo de consola e PuTTY, placa de rede no Windows, testador de cabos, tomada de parede e patch panel, partilhar uma pasta entre dois PCs.
- **Crimpagem**: aula de conectores e ferramentas e jogo de montar o RJ45 (T568A/T568B).
- **Os dados nunca se perdem**: tudo é gravado ao mesmo tempo no localStorage e no IndexedDB (com cópias diárias dos últimos 14 dias); se um dos dois for apagado, a app recupera do outro.
- **11 casos reais**, laboratórios CLI e fichas de trabalho por módulo.

## Como usar

```bash
cd ccna
python build.py          # valida o conteúdo e gera a app
python servidor.py       # abre em http://localhost:8000 (e no telemóvel, na mesma rede)
```

Também pode abrir `dist/ccna-passo-a-passo.html` com duplo clique: é a app inteira num único ficheiro.

No telemóvel, abra o endereço no Chrome/Safari e escolha **Adicionar ao ecrã principal** para a instalar como app.

## Como participar no desenvolvimento

Todo o conteúdo está em **Python**, na pasta `conteudo/`:

| Ficheiro | O quê |
|---|---|
| `base.py` | Funções para escrever lições: `texto`, `figura`, `topologia`, `cli`, `saida`, `sim_real`, `dica`, `tabela`, `video`, `mc`, `vf`, `cmd` |
| `m01_fundamentos.py` … `m09_automacao.py` | Um ficheiro por módulo |
| `m00_do_zero.py` | Módulo 0, para quem começa do zero |
| `introducoes.py` | Aulas “Comece por aqui” de cada módulo |
| `casos.py` | Casos reais (desafios com contexto prático) |
| `labs.py` | Laboratórios do terminal simulado (com cenário) |
| `guia.py` | Plano de estudo, dicas, glossário |
| `referencias.py` | Bibliografia (citada nas lições pela chave) |
| `programa.py` | Conteúdo programático: cursos, módulos, aulas de cada módulo, ficha de trabalho |
| `licoes_aprofundadas.py`, `licoes_partilha.py`, `licoes_novas_*.py` | Aulas do novo programa |
| `glossario.py` | Glossário: todos os termos técnicos (`termo(...)`) |
| `protocolos.py` | Catálogo de protocolos (`protocolo(...)`) |
| `estagio_a.py`, `estagio_b.py`, `estagio_empresas.py` | Estágio profissional de cada módulo |
| `exercicios.py` | Que exercícios gerados pertencem a cada aula (os geradores estão em `www/js/exercicios.js`) |
| `simulador.py` | Atividades guiadas do simulador de rede |

Exemplo — acrescentar uma pergunta ao quiz de uma lição:

```python
mc("Que comando mostra a tabela de encaminhamento?",
   ["show ip route", "show route", "show ip table", "show routing"], 0,
   "show ip route mostra rotas ligadas (C), estáticas (S), OSPF (O)…"),
```

### Vídeo-aulas

Cada lição tem uma vídeo-aula gerada a partir de **todo** o seu conteúdo (`conteudo/narracao.py`): cenas animadas (texto, figuras, tabelas linha a linha, comandos a ser escritos no terminal), legendas sempre visíveis e narração com a voz portuguesa do dispositivo. Funciona sem Internet.

- Para corrigir a pronúncia de uma palavra, acrescente-a a `PALAVRAS` (texto) ou `COMANDOS` (comandos Cisco) em `narracao.py`.
- Para juntar um vídeo gravado por um professor, coloque o ficheiro em `www/videos/` e use `video("Título", "videos/ficheiro.mp4")` na lição.

Depois de editar: `python build.py` (valida tudo e avisa se faltar algo) e `python -m unittest discover tests`.

A interface está em `www/` (HTML, CSS e JavaScript sem dependências): `js/app.js` (ecrãs e jogos), `js/plano.js` (plano de estudo adaptativo), `js/ios.js` (simulador do IOS), `js/figuras.js` (ilustrações).

Cisco, CCNA, Catalyst e Packet Tracer são marcas da Cisco Systems. Este é material de estudo independente.
