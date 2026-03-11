

# Ajuste do Fluxo de Cadastro: Compra via Ticto → Criação de Conta Automática

## Resumo

Remover o formulário de "Criar conta" da LoginPage. O cadastro passa a ser feito exclusivamente via compra na Ticto. O webhook cria o usuário no Supabase Auth automaticamente e envia um e-mail de convite para o comprador definir sua senha.

## Fluxo do Usuário

1. Usuário acessa a landing page (`/`) → clica em "Teste Grátis" ou escolhe um plano
2. Faz a compra no checkout da Ticto
3. Ticto envia postback → webhook recebe
4. Webhook cria o usuário no Supabase Auth via `admin.inviteUserByEmail(email)` — isso envia automaticamente um e-mail com link para definir senha
5. O trigger `handle_new_user` cria o perfil automaticamente
6. Webhook atualiza o plano no perfil recém-criado
7. Usuário clica no link do e-mail → define senha → faz login

Se o usuário já existir (recompra/upgrade), o webhook apenas atualiza o plano.

## Alterações

### 1. `supabase/functions/ticto-webhook/index.ts`

Na lógica de ativação (`authorized`), antes de atualizar o perfil:

- Tentar criar o usuário via `supabase.auth.admin.inviteUserByEmail(email, { data: { name: body.customer?.name || '' } })`
- Se o usuário já existir (erro de "already registered"), ignorar e seguir
- Aguardar um breve delay (~1s) para o trigger `handle_new_user` criar o perfil
- Então atualizar o perfil com o plano correto
- Para o Trial (offer `O34DA3017`), definir plano `trial` com `contacts_limit: 5000`

Adicionar o offer code do Trial ao `OFFER_PLAN_MAP`:
```
"O34DA3017": { plan: "trial", contactsLimit: 5000 }
```

### 2. `src/pages/LoginPage.tsx`

- Remover todo o estado e lógica de signup (`isLogin`, `name`, `signUp`)
- Manter apenas: login com email/senha, login com Google, recuperação de senha
- Trocar "Não tem conta? Criar conta grátis" por um link "Não tem conta?" que redireciona para a landing page (`/`) ou diretamente para o checkout do Trial
- Atualizar textos: remover menções a "conta grátis"

### 3. `src/pages/HomePage.tsx`

- Nenhuma alteração necessária (já aponta CTAs para o checkout da Ticto)

### Detalhes Técnicos

O `supabase.auth.admin.inviteUserByEmail()` usa a service role key (já disponível no webhook) e:
- Cria o usuário em `auth.users`
- Envia e-mail de convite do Supabase com link para definir senha
- O link direciona para a URL do site onde o usuário define a senha (usa o redirect URL configurado no Supabase)

A página `/reset-password` já existe e lida com o fluxo de definir/redefinir senha, então o link de convite pode usar essa mesma página.

