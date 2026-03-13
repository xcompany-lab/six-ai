

## Plano: Simplificar a pagina de Perfil

Remover os campos de negocio que agora sao gerenciados pelo onboarding (orquestrador) e pela pagina de Agenda/Agendamento.

### Campos a remover
- Nicho
- Tom de voz da marca
- Horario de atendimento
- Servicos
- Endereco
- Objetivo principal
- Descricao do negocio

### Campos que ficam
- Nome completo
- Nome da marca
- WhatsApp
- Avatar + Plano (coluna esquerda, sem mudanca)

### Mudancas em `src/pages/ProfilePage.tsx`

1. **Estado `form`**: remover `niche`, `voice_tone`, `services`, `address`, `business_hours`, `business_description`, `objective`
2. **`useEffect`**: remover mapeamento desses campos do profile
3. **`handleSave`**: remover a conversao de `services` (split por virgula), salvar apenas `name`, `brand_name`, `whatsapp`
4. **JSX**: remover os 7 `<Field>` correspondentes, manter apenas os 3 campos restantes em grid de 1 coluna (ou manter 2 colunas com nome/marca na primeira linha e whatsapp sozinho)
5. **Subtitle do PageHeader**: ajustar de "Gerencie seus dados e configure o contexto da IA" para "Gerencie seus dados pessoais"

### Layout resultante
- Coluna esquerda: avatar, botao alterar foto, plano atual (sem mudanca)
- Coluna direita: 3 campos apenas (Nome completo, Nome da marca, WhatsApp) — layout mais limpo e focado

### Arquivo alterado
- `src/pages/ProfilePage.tsx`

