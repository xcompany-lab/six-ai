

## Diagnostico: Lembretes repetidos

### Causa raiz

O trigger `trg_schedule_reminders` dispara em **toda** operacao de INSERT ou UPDATE na tabela `appointments`. O fluxo problematico e:

```text
1. Appointment criado → trigger cria 2 reminders (pending)
2. Cron send-reminders envia → atualiza reminder p/ "sent"
3. Cliente responde "Sim" → webhook atualiza appointment.status = "confirmed"
4. UPDATE no appointment → trigger dispara NOVAMENTE
5. Trigger deleta reminders existentes + cria 2 NOVOS (pending)
6. Cron envia os novos → cliente recebe de novo
7. Repete infinitamente
```

Alem disso, o `sync-google-calendar` faz UPDATE em appointments existentes a cada sync, o que tambem re-dispara o trigger e recria lembretes.

### Solucao

Modificar a funcao `schedule_reminders_for_appointment()` para:

1. **Ignorar updates que nao mudam data/hora** — so recriar lembretes quando `date` ou `time` mudarem
2. **Ignorar updates de status** — quando o status muda para `confirmed`/`cancelled`, nao recriar lembretes (o caso `cancelled` ja deleta, mas o `confirmed` recria indevidamente)
3. **So executar em INSERT ou quando date/time mudaram** — usar `TG_OP = 'INSERT'` ou comparar `OLD.date/time` com `NEW.date/time`

### Alteracao tecnica

**Migracao SQL** — recriar a funcao do trigger:

```sql
CREATE OR REPLACE FUNCTION public.schedule_reminders_for_appointment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  ...
BEGIN
  -- Se cancelado, apaga lembretes e sai
  IF NEW.status = 'cancelled' THEN
    DELETE FROM scheduled_reminders WHERE appointment_id = NEW.id;
    RETURN NEW;
  END IF;

  -- Em UPDATE: so recriar lembretes se data ou hora mudaram
  IF TG_OP = 'UPDATE' THEN
    IF OLD.date = NEW.date AND OLD.time = NEW.time THEN
      RETURN NEW;  -- nada mudou, nao recriar
    END IF;
  END IF;

  -- resto da logica existente (buscar config, inserir reminders)
  ...
END;
$function$;
```

Isso resolve o loop porque:
- Quando o webhook muda status para `confirmed` → trigger dispara mas `date`/`time` nao mudaram → sai sem recriar
- Quando sync-google-calendar atualiza nome/descricao → `date`/`time` nao mudaram → sai sem recriar  
- Quando data/hora realmente mudam → lembretes sao recriados corretamente

### Arquivos alterados

| Arquivo | Alteracao |
|---------|-----------|
| Nova migracao SQL | Recriar funcao do trigger com guard contra updates de status |

