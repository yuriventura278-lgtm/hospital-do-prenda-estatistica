# Segurança da Base de Dados (Firebase Realtime Database)

Este documento descreve as **regras de segurança** do ZELO (`database.rules.json`)
— o que protegem, como fazer deploy e quais as limitações conhecidas.

> **Porque é que isto é crítico:** a configuração do Firebase (`apiKey`,
> `databaseURL`, etc.) está — como é normal em qualquer app Firebase — visível
> em texto claro no código do site. Isso **não** é o segredo do sistema. A única
> coisa que impede qualquer pessoa na internet de ler ou apagar todos os dados
> clínicos são **estas regras**. Sem elas (ou com a base de dados em "modo de
> teste"), todo o controlo de acesso feito no navegador (`zelo_pagegate.js`,
> `hasModuleAccess`) é contornável com um simples pedido HTTP.

---

## O que as regras garantem

| Nó | Ler | Escrever |
|----|-----|----------|
| `users/` (lista toda) | Só **administradores** (para o painel de utilizadores) | — |
| `users/<uid>` | O **próprio** ou um **admin** | **Admin** (qualquer perfil); o **próprio** só o campo `ultimoAcesso`; o **1.º admin** pode criar-se a si próprio enquanto não existir nenhum utilizador (bootstrap) |
| `registos/<serviço>/<data>` | Utilizador **autenticado e ativo** | Utilizador **autenticado e ativo** |
| `registos_enf/<serviço>/<data>` | Utilizador **autenticado e ativo** | Utilizador **autenticado e ativo** |
| `audit_log/<key>` | Só **administradores** | Qualquer autenticado, mas **só criar** (entradas imutáveis — não se podem alterar nem apagar pelo cliente) |
| `user_activity/<uid>/<key>` | O **próprio** ou um **admin** | O **próprio**, só criar (imutável) |
| `login_attempts/<emailKey>` | Público (necessário antes do login) | Público, mas **forma trancada** a `{count, firstAttempt, lastAttempt}` numéricos — não pode ser usado como armazenamento arbitrário |
| Qualquer outro nó | ❌ negado | ❌ negado |

Regras de validação adicionais:

- `users/<uid>/role` só aceita `admin`, `funcionario` ou `supervisor`.
- `users/<uid>/ativo` tem de ser booleano.
- Um perfil de utilizador tem sempre de conter `role` e `ativo`.
- As entradas de `audit_log` e `user_activity` exigem `action` e `ts`.

### Decisões importantes

- **Bootstrap do 1.º administrador:** enquanto o nó `users` não existir, é
  permitido lê-lo (para `admin_setup.html` confirmar que está vazio) e o próprio
  utilizado recém-criado pode gravar o seu perfil de admin. Assim que existir
  **um** utilizador, esta porta fecha-se permanentemente.
- **Registo de auditoria imutável:** as entradas de `audit_log` só podem ser
  criadas, nunca alteradas ou apagadas pelo cliente. Para limpar histórico antigo
  use o Admin SDK (o script mensal em `scripts/`), que ignora estas regras.
- **`login_falhado` sem sessão:** o registo de auditoria de uma tentativa de
  login falhada (feito antes de haver sessão) deixa de ser gravado em `audit_log`
  por exigirmos autenticação nesse nó. A tentativa continua a ficar registada em
  `login_attempts`, por isso o sinal de segurança não se perde.

---

## Como fazer deploy das regras

As regras neste ficheiro **não têm efeito** enquanto não forem publicadas no
projeto Firebase. Há duas formas:

### Opção A — Firebase CLI (recomendado, versionável)

```bash
# uma só vez: instalar e autenticar
npm install -g firebase-tools
firebase login

# associar ao projeto (uma só vez)
firebase use --add        # escolher: hospital-do-prenda-1de35

# publicar as regras
firebase deploy --only database
```

O `firebase.json` já está configurado para usar `database.rules.json`.

### Opção B — Consola Firebase (manual)

1. Abrir a [Consola Firebase](https://console.firebase.google.com/) →
   projeto **hospital-do-prenda-1de35**.
2. **Realtime Database → Regras**.
3. Colar o conteúdo de `database.rules.json` e clicar em **Publicar**.

> Faça o deploy destas regras **antes** de as considerar ativas. Depois de
> publicadas, teste um login normal, a gravação de um registo e o painel de
> administração para confirmar que nada legítimo ficou bloqueado.

---

## Limitações conhecidas (próximos passos recomendados)

1. **Permissões por módulo/item ainda são validadas no cliente.** Estas regras
   garantem que só utilizadores autenticados e ativos escrevem nos registos, mas
   a distinção fina entre *editar* e *só leitura* por módulo (a lógica de
   `hasModuleAccess`) continua a ser aplicada apenas no navegador. Um utilizador
   ativo mal-intencionado poderia, tecnicamente, escrever num serviço a que só
   deveria ter leitura. Para fechar isto seria preciso um mapa
   `módulo → caminho` refletido nas regras.
2. **Rate-limiting de login é do lado do cliente.** O nó `login_attempts` é
   público por necessidade (corre antes do login). Para um bloqueio robusto,
   ativar **Firebase App Check** e/ou mover o lockout para uma Cloud Function.
3. **Ativar o Firebase App Check** para garantir que só a app oficial (e não
   scripts anónimos) fala com a base de dados — é a defesa que complementa
   naturalmente estas regras.
