# Grupo Kambas — Sistema de Gestão

Vendas, faturação e gestão de stock do **Grupo Kambas**, com o catálogo oficial
(13 secções, 79 produtos e serviços, preços em kwanzas) já carregado.

## O que faz

- **Vender**: escolher produtos/serviços do catálogo, quantidades, cliente,
  forma de pagamento (Transferência, Numerário, TPA/Multicaixa, Visa RedotPay)
  e desconto. Preços "a partir de" e "por consulta" são ajustados na venda;
  preços por quantidade (ex.: Lacoste bordada 11+ un.) aplicam-se sozinhos.
- **Faturas**: numeradas em sequência (Nº 0001, 0002…), com o mesmo desenho do
  bloco de faturas; PDF A5 e impressão; anulação com reposição do stock.
- **Produtos & Serviços**: registar/editar itens com preço em Kz, secção, tipo
  (produto com stock ou serviço), stock mínimo.
- **Stock**: entradas, saídas, contagens, alertas de stock baixo, histórico.
- **Relatórios** diário, semanal, mensal, trimestral, semestral e anual:
  faturação (com comparação ao período anterior), formas de pagamento,
  secções, produtos e serviços vendidos, clientes, movimento do stock e
  lista de faturas. Descarregam-se em PDF (`/relatorio.pdf?periodo=mensal&data=2026-10-18`).
- **Clientes**, **Painel** (vendas do dia/mês, gráfico, mais vendidos) e
  **Definições** (dados da empresa, próximo nº de fatura).

## Como correr (Python)

```bash
cd grupo-kambas
pip install -r requirements.txt
python app.py              # abre em http://127.0.0.1:5000
python app.py --sem-exemplos   # começar sem as vendas de exemplo
```

Os dados ficam em `kambas.db` (SQLite). Para usar noutros dispositivos da
loja na mesma rede: `KAMBAS_HOST=0.0.0.0 python app.py`.

## Estrutura

| Ficheiro | Função |
|---|---|
| `app.py` | servidor Flask: API JSON e PDF das faturas |
| `kambas/catalogo.py` | catálogo oficial, dados da empresa, exemplos |
| `kambas/db.py` | base de dados SQLite e regras (venda, stock, anulação) |
| `kambas/pdf_fatura.py` | PDF A5 igual ao bloco de faturas |
| `kambas/relatorios.py` | cálculo dos relatórios por período |
| `kambas/pdf_relatorio.py` | relatório em PDF (A4) |
| `web/template.html` | interface (editar aqui) |
| `construir.py` | gera `index.html` a partir do template + catálogo |

Depois de mudar `web/template.html` ou o catálogo, corra `python construir.py`.
Aberto sem servidor, o `index.html` funciona em modo demonstração (dados
guardados no navegador).
