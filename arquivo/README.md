# Arquivo de dados

> **Estes dados já não ficam neste repositório.** O repositório GitHub é
> público; os registos do hospital são confidenciais. Desde que esta pasta
> passou a ser gerada, o conteúdo real vive no **Firebase Storage**
> (`arquivo/...`), atrás das regras em `storage.rules`, que só deixam ler a
> quem tem sessão iniciada no ZELO. Esta pasta no repositório fica só com
> este README — o `.gitignore` impede que o resto seja commitado por engano.

O arquivo guarda uma cópia completa (não resumida) de todos os registos do
Firebase, mês a mês — criada automaticamente pelo processo de resumo mensal,
sempre **antes** de esse mês ser apagado do Firebase (o Firebase só guarda o
mês actual e o anterior; no Storage fica tudo, para sempre).

Cada ficheiro é o registo bruto exactamente como estava no Firebase — nenhum
dado é resumido ou perdido, incluindo os dias em que um procedimento não foi
preenchido (guardados como `0`, nunca em branco). Nomes de doentes são
sempre removidos antes de guardar (ver `stripNomesDoentes()` em
`scripts/monthly-report.mjs`).

## Estrutura (no Firebase Storage)

```
arquivo/
  index.json                 ← lista de todos os meses já arquivados
  2026-06/
    index.json                ← resumo de quais serviços têm dados neste mês
    registos/                 ← bancos e serviços (dados brutos, dia a dia)
      cirurgia_geral.json
      ortopedia.json
      ...
    registos_enf/              ← Procedimentos de Enfermagem (dados brutos)
      cirurgia.json
      ortopedia.json
      ...
    registos_sistemas_locais/  ← Sistemas Locais (dados brutos)
      consulta_externa.json
      ...
```

Cada `<prefix>/<serviço>.json` tem a forma:

```json
{
  "2026-06-01": { "savedAt": "...", "snapshot": { ... } },
  "2026-06-02": { "savedAt": "...", "snapshot": { ... } }
}
```

## Como aceder

- Dentro do ZELO: `Estatística` (cópia de segurança mensal por serviço) ou
  `Base de Dados` (exportação para Excel), ambos autenticados.
- Fora do ZELO: só é possível através da Consola do Firebase ou da Firebase
  Admin SDK com as credenciais do projeto — nunca por um link directo, já que
  `zelo_relatorios.js` não gera URLs de download partilháveis.

Gerado por `scripts/monthly-report.mjs`, no dia 2 de cada mês (ver
`.github/workflows/relatorio-mensal.yml`).
