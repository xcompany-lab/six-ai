

## Plano: Páginas de Termos de Uso e Política de Privacidade

### Design

Seguindo o layout da referência Apollo-X, adaptado para a identidade visual SIX AI:

- **Header fixo** com logo SIX AI + botão "Voltar" + botão "Login"
- **Hero section** com ícone centralizado (estilo cyber-icon), título com gradiente e data de atualização
- **Layout duas colunas**: sidebar esquerda com índice fixo (sticky) + conteúdo principal à direita
- **Tema escuro** consistente com o design system existente
- **Responsivo**: índice colapsa no mobile

### Arquivos a criar/modificar

1. **`src/pages/TermsPage.tsx`** — Página de Termos de Uso com conteúdo adaptado para SIX AI (atendimento IA, WhatsApp, agendamentos, CRM, etc.)
2. **`src/pages/PrivacyPage.tsx`** — Página de Política de Privacidade com conteúdo adaptado
3. **`src/components/legal/LegalPageLayout.tsx`** — Componente compartilhado com o layout (nav, hero com ícone/título, sidebar índice sticky, área de conteúdo)
4. **`src/App.tsx`** — Adicionar rotas `/termos` e `/privacidade` (rotas públicas)
5. **`src/pages/HomePage.tsx`** — Adicionar links no footer para as duas páginas

### Estrutura do componente LegalPageLayout

- Recebe: `title`, `icon`, `lastUpdated`, `sections: { id, title, icon, content: ReactNode }[]`
- Renderiza nav fixa, hero centralizado, sidebar com scroll-spy, e seções com ícones

### Conteúdo dos Termos (adaptado para SIX AI)

Seções: Aceitação, Definições (plataforma SIX AI, Atendente IA, leads, agendamentos), Cadastro e Conta, Funcionalidades da Plataforma, Inteligência Artificial, Dados e Privacidade, Propriedade Intelectual, Limitação de Responsabilidade, Suspensão/Cancelamento, Modificações, Lei Aplicável (Brasil), Foro, Contato

### Conteúdo da Privacidade (adaptado para SIX AI)

Seções: Introdução, Dados Coletados (cadastro, perfil empresarial, uso da plataforma, WhatsApp), Uso dos Dados, Compartilhamento, Armazenamento (Supabase), Segurança, Direitos do Usuário (LGPD), Cookies, Alterações, Contato

