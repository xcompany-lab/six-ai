

# Simplificar Conexão WhatsApp

## Problema
A página atual não pede dados ao usuário mas o fluxo não aceita nome personalizado nem telefone. O blueprint pede: nome da instância + telefone, clique em Conectar, QR aparece, ao escanear fecha o QR e mostra "Conectado".

## Mudanças

### 1. Frontend -- `src/pages/WhatsAppPage.tsx`
Redesenhar a página com dois estados:

**Estado "sem instância"**: Formulário simples com 2 campos:
- **Nome** (texto, vira o nome da instância, sanitizado para slug)
- **Número do telefone** (input com prefixo +55, máscara)
- Botão "Conectar" que chama `create` passando `name` e `phone`

**Estado "scanning"**: Modal/overlay com QR Code grande centralizado + instrução + botão "Atualizar QR". Polling a cada 4s. Quando status muda para `connected`, fecha automaticamente o QR e mostra o card de "Conectado".

**Estado "connected"**: Card com status verde, nome da instância, telefone, botão "Desconectar". Remover checklist e seções complexas.

### 2. Hook -- `src/hooks/use-whatsapp.ts`
- `callEvolutionApi` passa a aceitar `body` genérico (não só `action`)
- `useCreateInstance` recebe `{ name, phone }` e envia como `{ action: 'create', name, phone }`

### 3. Edge Function -- `supabase/functions/evolution-api/index.ts`
- No action `create`: ler `name` e `phone` do body
- Usar `name` como `instanceName` (sanitizado: lowercase, sem espaços → hífens)
- Salvar `phone` na tabela `whatsapp_instances`
- Manter o resto do fluxo (criar instância, configurar webhook, retornar QR)

### 4. Migration -- adicionar coluna `phone` se não existe
A tabela já tem coluna `phone` (nullable). Sem migration necessária.

## Arquivos
- `src/pages/WhatsAppPage.tsx` -- redesign completo
- `src/hooks/use-whatsapp.ts` -- aceitar params no create
- `supabase/functions/evolution-api/index.ts` -- usar name/phone do body

