

# Conexão com Evolution API -- Plano de Implementação

## Contexto

O usuário forneceu as credenciais do servidor Evolution API (host + API key global). A arquitetura é multi-tenant: cada usuário do SIX AI cria sua própria instância na Evolution API a partir da página WhatsApp. O servidor Evolution é compartilhado.

## O que será feito

### 1. Salvar credenciais globais como Supabase Secrets

Adicionar 2 secrets:
- `EVOLUTION_API_URL` = `https://xcompany-evolution.oqngna.easypanel.host`
- `EVOLUTION_API_KEY` = `MADSARAXCOASDHASJKHFGMADASRAMADARA`

### 2. Nova tabela: `whatsapp_instances` (per-user)

Cada usuário terá sua instância registrada no banco:

```sql
create table public.whatsapp_instances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  instance_name text not null,
  instance_id text,
  status text default 'disconnected',
  phone text,
  qr_code text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS: usuário só vê/edita sua própria instância
alter table public.whatsapp_instances enable row level security;
create policy "Users manage own instance" on public.whatsapp_instances
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
```

### 3. Nova Edge Function: `evolution-api`

Proxy autenticado para a Evolution API. Endpoints:
- **POST /create** -- Cria instância na Evolution API (`/instance/create`), registra webhook automático apontando para `whatsapp-webhook`, salva na tabela `whatsapp_instances`
- **POST /connect** -- Gera QR Code (`/instance/connect/{name}`) e retorna base64
- **POST /status** -- Consulta status da conexão (`/instance/connectionState/{name}`)
- **POST /disconnect** -- Desconecta/deleta instância (`/instance/delete/{name}`)

O nome da instância será gerado automaticamente: `six-{userId.slice(0,8)}`.

### 4. Atualizar `whatsapp-webhook` Edge Function

Mudar o lookup de multi-tenant: em vez de usar env `EVOLUTION_INSTANCE_NAME` (global), buscar o `user_id` pela `instance_name` na tabela `whatsapp_instances` usando o campo `body.instance` que a Evolution API envia no webhook. Depois, buscar a config do agente IA desse user. Para enviar resposta, usar os secrets globais `EVOLUTION_API_URL` e `EVOLUTION_API_KEY` + o `instance_name` do banco.

### 5. Refatorar `WhatsAppPage.tsx`

Remover campos manuais de API URL/Key/Instance (agora são globais). Fluxo simplificado:
1. Ao clicar "Conectar", chama `evolution-api` com action `create` (cria instância + webhook)
2. Recebe QR Code em base64 e exibe como `<img>`
3. Polling de status a cada 5s até `connected`
4. Botão "Desconectar" chama action `disconnect`
5. Estado persiste na tabela `whatsapp_instances` (carregado via query no mount)

### 6. Hook `use-whatsapp.ts`

Queries e mutations para `whatsapp_instances` + chamadas à edge function `evolution-api`.

## Arquivos envolvidos

- **Secrets**: `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`
- **Migration**: criar tabela `whatsapp_instances`
- **Nova edge function**: `supabase/functions/evolution-api/index.ts`
- **Editar**: `supabase/functions/whatsapp-webhook/index.ts` (multi-tenant por instance_name)
- **Editar**: `supabase/config.toml` (adicionar `[functions.evolution-api]`)
- **Novo**: `src/hooks/use-whatsapp.ts`
- **Editar**: `src/pages/WhatsAppPage.tsx`

