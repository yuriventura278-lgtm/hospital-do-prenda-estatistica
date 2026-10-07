# CCNA Passo a Passo

Aplicação móvel (PWA) para estudar **todo o CCNA 200-301**, do conceito mais básico ao mais avançado.

- **9 módulos, 37 lições** com texto, ilustrações dos equipamentos (SVG), topologias, exemplos resolvidos, configurações Cisco passo a passo, saídas de `show`, vídeos de apoio e **referências bibliográficas** (livros Cisco Press, NetAcad, normas IEEE e RFCs) no fim de cada lição.
- **Simulador × equipamento real** em cada tema: o que muda entre o Packet Tracer e um router/switch físico.
- **Quiz em cada lição** (70% para concluir), botão **Repetir aula**, e **prova cronometrada** no fim de cada módulo (nota 0–1000, aprovação 825) que desbloqueia o módulo seguinte.
- **Jogos**: quiz relâmpago (60 s), desafio de sub-redes, **laboratório CLI** com um terminal Cisco IOS simulado (12 labs com verificação automática) e caderno de erros.
- **Classificação**: XP, 7 níveis (de Estagiário a Arquiteto de Redes), conquistas, notas das provas e ranking dos perfis no dispositivo.
- **Guia de estudo**: domínios e pesos do exame, plano de 12 semanas, dicas de exame, ferramentas, glossário e todas as referências.
- Funciona sem internet, tema claro/escuro, instalável no telemóvel.

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
| `labs.py` | Laboratórios do terminal simulado |
| `guia.py` | Plano de estudo, dicas, glossário |
| `referencias.py` | Bibliografia (citada nas lições pela chave) |

Exemplo — acrescentar uma pergunta ao quiz de uma lição:

```python
mc("Que comando mostra a tabela de encaminhamento?",
   ["show ip route", "show route", "show ip table", "show routing"], 0,
   "show ip route mostra rotas ligadas (C), estáticas (S), OSPF (O)…"),
```

Para fixar um vídeo concreto numa lição, ponha o ID do YouTube em `video(..., youtube_id="...")`.

Depois de editar: `python build.py` (valida tudo e avisa se faltar algo) e `python -m unittest discover tests`.

A interface está em `www/` (HTML, CSS e JavaScript sem dependências): `js/app.js` (ecrãs e jogos), `js/ios.js` (simulador do IOS), `js/figuras.js` (ilustrações).

Cisco, CCNA, Catalyst e Packet Tracer são marcas da Cisco Systems. Este é material de estudo independente.
