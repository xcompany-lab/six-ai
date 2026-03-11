

# Personalizar E-mail de Convite do Supabase com Identidade SIX AI

## Situacao Atual

O projeto nao possui um dominio de e-mail configurado. Para personalizar os templates de e-mail de autenticacao (incluindo o e-mail de convite enviado pelo webhook da Ticto), e necessario primeiro configurar um dominio de e-mail customizado.

## Plano

### Passo 1 -- Configurar dominio de e-mail

Antes de qualquer customizacao, e preciso configurar um dominio de envio (ex: `notify@seudominio.com`). Isso e feito pelo dialog de configuracao de e-mail do Lovable, que provisiona o dominio e configura a infraestrutura necessaria (filas, DNS, etc).

### Passo 2 -- Scaffoldar os templates de auth email

Apos o dominio configurado, usar a ferramenta `scaffold_auth_email_templates` para criar os 6 templates padrao (signup, recovery, invite, magic-link, email-change, reauthentication).

### Passo 3 -- Aplicar identidade visual da SIX AI

Customizar cada template com:
- **Logo**: Copiar a imagem enviada (`six-logo`) para o bucket `email-assets` e incluir no topo de cada template
- **Cores da marca**:
  - Botao: gradiente azul-verde (`hsl(199, 89%, 48%)` para `hsl(160, 84%, 50%)`) ou cor primaria solida
  - Texto titulo: `hsl(210, 20%, 95%)` (foreground claro) -- porem sobre fundo branco do e-mail, usar cor escura `#1a1a2e`
  - Texto secundario: `hsl(215, 15%, 50%)` (muted)
  - Background do body: `#ffffff` (obrigatorio para compatibilidade com clientes de e-mail)
  - Border radius: `0.75rem`
- **Fonte**: Space Grotesk com fallback para Arial
- **Tom**: Portugues brasileiro, alinhado com o tom da plataforma

### Passo 4 -- Deploy

Executar `deploy_edge_functions` com `auth-email-hook`.

## Primeira acao necessaria

Configurar o dominio de e-mail pelo dialog abaixo. Voce precisara adicionar registros DNS no seu provedor de dominio.

