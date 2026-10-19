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
- **Início:** saudação, vendas de hoje comparadas com ontem, botão "Nova venda",
  atalhos, caixa "Precisa de atenção" (faturas por pagar, stock baixo, pró-formas
  em aberto), gráfico de 7, 14 ou 30 dias, últimos documentos e mais vendidos.
- **Vender:** catálogo agrupado por secção (grelha ou lista), "Mais vendidos" no
  topo, botão **+** e quantidade **− 1 +** no próprio artigo, item avulso, cliente
  pesquisado ou registado sem sair da venda, desconto e observação só quando
  precisa, troco em numerário. O total e o botão Emitir ficam sempre visíveis.
  No telemóvel: barra "Continuar" com o total e ecrã de finalizar venda; barra de
  baixo com Vender ao centro e o resto em "Mais".
- **Recargas (Unitel, Africell, ZAP, DStv, EDEL, EPAL):** cada operador tem um saldo
  em Kz. Em **Saldos**, "Carregar saldo" regista o saldo recebido e quanto se pagou
  (ex.: pagar 9.500 e receber 10.000). Na venda, separador **Recargas**: escolhe-se o
  operador, o valor (botões rápidos ou outro valor) e, se quiser, o número do
  cliente (telefone, cartão ou contador). Não se vende acima do saldo; anular
  devolve o saldo; a pró-forma só tira saldo quando é convertida. O lucro de cada
  recarga é o valor vendido menos o custo desse saldo (média do que se pagou) e
  aparece em Saldos e nos relatórios. Aviso de saldo baixo no Início.
  Pode carregar o mesmo operador quantas vezes quiser no mês: cada carregamento
  soma ao saldo, e Saldos mostra quanto e quantas vezes carregou.
- **Produtos e secções:** registar, editar e remover produtos e serviços (botão em
  cada linha). Secções com contagem, incluindo **Electrodomésticos**, **CCTV &
  Segurança** e **Material de Papelaria**; "Nova secção" cria qualquer outra, com um
  código próprio usado nos códigos dos produtos (ex.: CCTV → CS01). Uma secção só
  se remove quando está vazia.
- **Stock:** entradas, saídas, contagem geral, alertas, histórico de movimentos.
- **Relatórios:** diário, semanal, mensal, trimestral, semestral e anual, em PDF.
- **Utilizadores e permissões:**
  - *Vendedor* — vende, emite pró-formas, regista clientes, vê só os seus documentos.
  - *Administrador* — acesso total.
  - Permissões extra que o administrador pode dar a um vendedor: ver documentos
    de todos, anular, produtos e preços, stock, relatórios.

## Dados da empresa (Definições, só administrador)

- Nome, NIF, actividade e slogan.
- Contactos e localização: telefones, e-mail, endereço, ponto de referência, link
  do mapa, Facebook, TikTok e Instagram. Aparecem na fatura e no PDF.
- Coordenadas bancárias: titular e contas (acrescentar, editar, remover, pôr em
  primeiro). A primeira conta aparece no rodapé da fatura.
- **PDF das coordenadas bancárias** para enviar aos clientes (Definições, "A minha
  conta" ou menu Mais; também os vendedores): logótipo, titular, contas, contactos,
  localização com link do mapa e redes sociais.

## Progresso e espera

- Ao entrar: ecrã com o logótipo e uma barra de progresso com as etapas reais
  (ligação, conta, catálogo, vendas).
- Enquanto o servidor responde: linha fina no topo; botões mostram o que estão a
  fazer ("A guardar…", "A gerar PDF…").
- **Emitir** bloqueia ao primeiro toque ("A emitir…"): dois toques nunca criam duas
  faturas. Depois aparece "Fatura emitida" com o número, o total e o troco.
- PDF: aviso "A gerar o PDF…" e, no fim, onde ficou o ficheiro.

## Ecrã de espera e bloqueio por inatividade

- **5 minutos sem mexer:** aparece o ecrã de espera com o logótipo, a hora, a data e o nome de quem está a usar. Um toque volta ao que estava (carrinho e formulários ficam como estavam).
- **30 minutos sem mexer:** a sessão bloqueia e pede a senha de quem está a usar. O trabalho aberto não se perde. Recarregar a página ou fechar e abrir a aplicação não tira o bloqueio.
- A senha é confirmada no aparelho (funciona sem internet) a partir de uma impressão guardada no login; se a senha foi mudada noutro aparelho, confirma no servidor.
- Depois de 5 senhas erradas espera 30 segundos. "Entrar com outra conta" termina a sessão (avisa se há registos offline por enviar).
- Enquanto se emite uma fatura ou gera um PDF, o tempo não conta.

## Sem internet (modo offline)

- Cada vez que os dados chegam do servidor, fica uma cópia no aparelho (IndexedDB).
  Sem internet, o sistema abre com essa cópia e mostra "Offline".
- **Vendas (FR, FT, pró-forma, recargas) e clientes novos** podem ser feitos sem internet:
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
