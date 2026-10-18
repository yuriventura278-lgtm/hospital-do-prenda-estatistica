# Grupo Kambas — Sistema de Gestão

Vendas, faturação, stock e relatórios do **Grupo Kambas**, com o catálogo
oficial (13 secções, 79 produtos e serviços, preços em kwanzas), login por
utilizador e sincronização entre dispositivos.

- **Página web:** `index.html` (publicada no GitHub Pages, pasta `grupo-kambas/`)
- **APK Android:** release `grupo-kambas-apk` do repositório (compilada pelo GitHub Actions)
- **Demonstração sem servidor:** `demo.html`

## O que faz

- **Documentos:** Fatura-Recibo (FR, paga no acto), Fatura (FT, a pagar,
  com "Registar pagamento") e Fatura Pró-forma (PP, orçamento com validade,
  convertível em FR ou FT). Numeração própria por tipo (FR 0001, FT 0001, PP 0001).
  O documento mostra o **nome do vendedor** que o emitiu (o do utilizador com
  sessão iniciada). O tipo aparece por extenso numa faixa colorida no topo
  (verde FR, laranja FT, azul pró-forma). PDF A5 com o desenho do bloco de faturas,
  **Imprimir** (no telemóvel Android abre a escolha de impressora ou app) e cópia do resumo.
- **Login:** botão para ver a senha; o navegador ou o telemóvel oferece-se para guardar a senha.
- **Vender:** catálogo com pesquisa, "Mais vendidos", item avulso, cliente
  pesquisado ou registado sem sair da venda, desconto em Kz ou %, troco em numerário.
- **Stock:** entradas, saídas, contagem geral, alertas, histórico de movimentos.
- **Relatórios:** diário, semanal, mensal, trimestral, semestral e anual, em PDF.
- **Utilizadores e permissões:**
  - *Vendedor* — vende, emite pró-formas, regista clientes, vê só os seus documentos.
  - *Administrador* — acesso total.
  - Permissões extra que o administrador pode dar a um vendedor: ver documentos
    de todos, anular, produtos e preços, stock, relatórios.

## Sem internet (modo offline)

- Cada vez que os dados chegam do servidor, fica uma cópia no aparelho (IndexedDB).
  Sem internet, o sistema abre com essa cópia e mostra "Offline".
- **Vendas (FR, FT, pró-forma) e clientes novos** podem ser feitos sem internet:
  ficam numa fila no aparelho e são enviados sozinhos quando a ligação volta,
  pela ordem em que foram feitos (o cliente antes da venda que o usa).
- O número oficial (ex.: FR 0012) é dado pelo servidor no envio, para dois
  aparelhos nunca usarem o mesmo número. Até lá o documento aparece "por enviar".
- Cada registo leva uma referência única: se a ligação cair a meio do envio,
  o servidor devolve o documento já criado em vez de o duplicar. A hora gravada
  é a hora real da venda (aceite até 7 dias para trás).
- Stock, preços, anulações, utilizadores e definições precisam de internet.
- A página web abre sem internet graças ao `sw.js` (service worker); a APK e o
  programa para Windows já têm os ficheiros no aparelho.

## Como está montado

| Parte | Onde |
|---|---|
| Base de dados, regras de acesso (RLS) e operações de venda/stock | Supabase — `supabase/esquema.sql` |
| Criação de utilizadores (precisa da chave de serviço) | Supabase Edge Function — `supabase/functions/utilizadores/` |
| Catálogo inicial | `kambas/catalogo.py` → `supabase/gerar_catalogo_sql.py` |
| Interface | `web/template.html` + `web/app.js` |
| Montagem das páginas | `construir.py` (Python) |
| APK | `android-app/` (Capacitor) + `.github/workflows/grupo-kambas-apk.yml` |

Todas as escritas passam por funções da base de dados que verificam as
permissões de quem está com sessão iniciada; um vendedor não consegue
contornar as regras a partir do telemóvel.

## Primeira utilização

1. Abra a página ou a APK. Aparece **Configuração inicial**.
2. Escreva o código de configuração (fornecido à parte), o seu nome,
   utilizador e senha. Fica criado o administrador, e o código deixa de servir.
3. Em **Stock → Contagem geral**, registe as quantidades que tem na loja.
4. Em **Utilizadores**, crie as contas dos vendedores.

## Desenvolvimento

```bash
cd grupo-kambas
python construir.py          # gera index.html, demo.html e manifest
python -m http.server 8000   # abrir http://localhost:8000/demo.html
```

Depois de mudar `web/` ou o catálogo, corra `python construir.py` outra vez.
