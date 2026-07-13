# Arquivo de dados

Esta pasta guarda uma cópia completa (não resumida) de todos os registos do
Firebase, mês a mês — criada automaticamente pelo processo de resumo mensal,
sempre **antes** de esse mês ser apagado do Firebase (o Firebase só guarda o
mês actual e o anterior; aqui fica tudo, para sempre, versionado neste
repositório).

Cada ficheiro é o registo bruto exactamente como estava no Firebase — nenhum
dado é resumido ou perdido, incluindo os dias em que um procedimento não foi
preenchido (guardados como `0`, nunca em branco).

## Estrutura

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
```

Cada `registos/<serviço>.json` e `registos_enf/<serviço>.json` tem a forma:

```json
{
  "2026-06-01": { "savedAt": "...", "snapshot": { ... } },
  "2026-06-02": { "savedAt": "...", "snapshot": { ... } }
}
```

Gerado por `scripts/monthly-report.mjs`, no dia 2 de cada mês (ver
`.github/workflows/relatorio-mensal.yml`).
