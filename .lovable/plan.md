

## Plano: Status de confirmacao e gestao de lembretes

### Problema atual
1. O agendamento ja aparece como "Confirmado" antes do cliente responder o lembrete
2. Na tela de lembretes nao e possivel excluir lembretes nem acompanhar confirmacoes

### Alteracoes

**1. Status inicial do agendamento deve ser `pending`**

O appointment da Madara Juliano esta com status `confirmed` mas deveria comecar como `pending`. O status so deve mudar para `confirmed` quando o cliente responder confirmando via lembrete.

- No `sync-google-calendar/index.ts`: ao criar appointments vindos do Google, usar status `pending` em vez de `confirmed`
- Verificar se a criacao manual de appointments tambem usa `pending` como default (ja e o default na tabela)

**2. Novo status `confirmed` no `scheduled_reminders`**

Adicionar o status `confirmed` ao fluxo de lembretes para rastrear quando o cliente confirmou.

- Adicionar ao `statusMap` na RemindersPage: `confirmed: { label: 'Confirmado', className: 'bg-green-500/10 text-green-500', icon: CheckCircle2 }`

**3. Botao de excluir lembretes na tabela**

- Adicionar coluna "Acoes" na tabela de lembretes
- Botao de lixeira em cada linha (apenas para lembretes com status `pending`)
- Nova mutation `useDeleteReminder` no hook `use-reminders.ts` que faz DELETE na tabela `scheduled_reminders`
- Confirmacao via toast antes de excluir

**4. Adicionar DELETE policy na tabela `scheduled_reminders`**

Atualmente nao ha policy de DELETE para `authenticated`. Criar via migracao:
```sql
CREATE POLICY "Users can delete own reminders"
ON scheduled_reminders FOR DELETE TO authenticated
USING (auth.uid() = user_id);
```

**5. Coluna de confirmacao na tabela de lembretes**

Adicionar uma coluna visual que mostra se o cliente ja confirmou ou nao:
- `pending` → Aguardando (cinza)
- `sent` → Enviado, aguardando resposta (amarelo)  
- `confirmed` → Cliente confirmou (verde)
- `failed` → Falha no envio (vermelho)

**6. Corrigir status do appointment no sync do Google**

No `sync-google-calendar/index.ts`, mudar o status de appointments criados de `confirmed` para `pending`, para que so fique confirmado apos resposta do cliente.

### Resumo das alteracoes por arquivo

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/use-reminders.ts` | Adicionar `useDeleteReminder` mutation |
| `src/pages/RemindersPage.tsx` | Adicionar coluna Acoes com botao excluir, expandir statusMap com `confirmed` |
| `supabase/functions/sync-google-calendar/index.ts` | Mudar status de appointments importados para `pending` |
| Migracao SQL | Adicionar DELETE policy em `scheduled_reminders` |

