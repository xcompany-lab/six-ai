

## Conectar formulário do webinar ao Supabase

### 1. Criar tabela `webinar_registrations`

Nova migration SQL:

```sql
CREATE TABLE public.webinar_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  whatsapp text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webinar_registrations ENABLE ROW LEVEL SECURITY;

-- Permitir inserção pública (anon) — visitantes não autenticados
CREATE POLICY "Anyone can register for webinar"
  ON public.webinar_registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Apenas service_role pode ler (admin)
CREATE POLICY "Service role can read registrations"
  ON public.webinar_registrations
  FOR SELECT
  TO service_role
  USING (true);
```

### 2. Atualizar `WebinarPage.tsx`

- Importar `supabase` client
- No `handleSubmit`, fazer `supabase.from('webinar_registrations').insert({ name, email, whatsapp })`
- Mostrar toast de erro se falhar
- Manter o estado `submitted` para sucesso

### Arquivos modificados

1. **Migration** — criar tabela `webinar_registrations`
2. **`src/pages/WebinarPage.tsx`** — integrar insert no formulário

