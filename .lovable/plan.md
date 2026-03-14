

## Diagnóstico: Comando /stop não funciona

### Causa raiz

Duas falhas identificadas:

1. **Formato `@lid` não tratado**: O WhatsApp agora usa JIDs no formato `@lid` além de `@s.whatsapp.net`. O código só faz `.replace("@s.whatsapp.net", "")`, resultando em `58939903369309@lid` como phone — que não bate com nenhum lead.

2. **Comando `/stop` vs `/parar`**: A Kethely enviou `/stop`, mas o default do sistema é `/parar`. Precisa verificar o que ela configurou no `ai_agent_config`.

### Correção

**`supabase/functions/whatsapp-webhook/index.ts`:**

- Criar função `cleanPhone(remoteJid)` que trata ambos os formatos:
  - Remove `@s.whatsapp.net`
  - Remove `@lid`
  - Remove qualquer sufixo `@*` restante
- Substituir todas as ocorrências de `.replace("@s.whatsapp.net", "")` por essa função (linhas ~154 e qualquer outra)
- Também usar `previousRemoteJid` ou `senderPn` quando disponível para obter o JID real do contato em mensagens `fromMe` com `@lid`

**Para mensagens `fromMe` com `@lid`**: O `remoteJid` com `@lid` é um identificador interno, não o número real do contato. Em mensagens `fromMe`, o campo `previousRemoteJid` ou o próprio `remoteJid` com `@lid` precisa ser mapeado. A solução mais robusta: quando `fromMe=true` e `remoteJid` tem `@lid`, buscar o lead pelo `previousRemoteJid` (que aparece em mensagens recebidas do mesmo contato) ou limpar o `@lid` e buscar por número parcial.

### Abordagem final

1. Extrair phone limpando `@s.whatsapp.net` e `@lid`
2. Para `fromMe` com `@lid`, o número `58939903369309` sem sufixo será usado na busca de leads (match parcial com `ilike` ou exato)
3. Redeploy da edge function

