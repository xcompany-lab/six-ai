

## Plano: Criar conta trial interna

A forma mais limpa é simular o webhook da Ticto chamando a edge function `ticto-webhook` com o payload de trial. Porém, esse fluxo usa `inviteUserByEmail`, que envia um e-mail de convite para o usuário definir a senha — não permite definir a senha diretamente.

Para criar a conta com a senha específica, preciso de uma abordagem diferente:

### Abordagem

1. **Criar uma edge function utilitária temporária** (`admin-create-user`) que usa `supabase.auth.admin.createUser` com `email_confirm: true` e a senha definida diretamente
2. Chamar a function para criar o usuário
3. Aguardar o trigger `handle_new_user` criar o profile
4. Atualizar o profile com `plan: 'trial'` e `trial_ends_at: now() + 5 days`

### Edge function `admin-create-user`
- Recebe `email`, `password`, `name` no body
- Usa `admin.createUser({ email, password, email_confirm: true, user_metadata: { name } })`
- Após criação, atualiza o profile com plano trial
- Protegida por um token interno (ou removida após uso)

### Arquivo criado
- `supabase/functions/admin-create-user/index.ts`

### Após uso
- Posso deletar a function depois de criar a conta

