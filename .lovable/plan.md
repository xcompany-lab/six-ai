

# SIX AI — Roadmap Completo de Implementacao

## Estado Atual

O sistema possui **toda a UI/frontend** construida com dados mockados (hardcoded). Nao ha backend real: sem banco de dados, sem autenticacao real, sem edge functions, sem integracoes. Tudo funciona com `useState` local e dados fictícios.

---

## O Que Falta

### Backend / Infraestrutura
- Autenticacao real com Supabase Auth (email/senha, Google, recuperacao de senha)
- Tabelas no banco (profiles, leads, appointments, follow_up_flows, campaigns, reminders, ai_agent_config, insights, support_tickets, etc.)
- RLS policies para multi-tenancy (isolamento por user_id)
- Edge functions para logica de negocio (webhooks, integracao IA, etc.)
- Sistema de roles (admin plataforma vs usuario comum)

### Dados Reais (CRUD)
- Dashboard com dados reais do banco
- Kanban CRM com drag-and-drop real e persistencia
- Agendamentos com CRUD completo
- Follow-up flows com CRUD
- Ativacao de base com filtros e disparos reais
- Lembretes com configuracao persistente
- Perfil do usuario editavel com persistencia
- Plano/assinatura com estado real

### Integracoes
- Evolution API (WhatsApp): criar/conectar instancia, QR code real, webhooks
- Google Agenda: OAuth, sync de disponibilidade
- Gemini API: prompt engine para o Atendente IA
- Kiwify: webhook de billing/pagamento

### Funcionalidades Avancadas
- Atendente IA com prompt engine real e memoria por contato
- Insight Sales System com analise real dos dados
- Controle de uso de IA (tokens/percentual) com limites e alertas
- Recarga pre-paga via Pix
- Configuracoes com persistencia
- Suporte com abertura de chamados real
- Responsividade mobile (sidebar hamburger)

---

## Sprints de Implementacao

### Sprint 1 — Fundacao (Auth + Banco + Perfil)
1. Criar tabelas no Supabase: `profiles`, `user_roles`
2. Implementar autenticacao real (email/senha, Google, reset password, pagina `/reset-password`)
3. Trigger para auto-criar profile no signup
4. RLS policies em profiles
5. Onboarding wizard persistindo dados no profile
6. Tela de perfil com CRUD real
7. AuthContext consumindo Supabase Auth + profile do banco

### Sprint 2 — CRM + Leads
1. Criar tabela `leads` com RLS por user_id
2. CRUD de leads completo
3. Kanban com drag-and-drop real (persistir mudanca de coluna)
4. Modal de detalhes do lead (historico, edicao, observacoes)
5. Dashboard consumindo contagens reais de leads

### Sprint 3 — Agenda + Agendamentos
1. Criar tabela `appointments` com RLS
2. CRUD de agendamentos
3. Criar tabela `scheduling_config` (horarios, duracao, buffer, bloqueios)
4. Agenda interna com calendario funcional
5. Preparar estrutura para integracao Google Agenda (OAuth flow)

### Sprint 4 — Follow-up + Lembretes + Ativacao
1. Criar tabela `follow_up_flows` com RLS
2. CRUD de fluxos de follow-up
3. Criar tabela `reminders_config`
4. Lembretes com configuracao persistente
5. Criar tabela `activation_campaigns`
6. Ativacao de base com filtros reais sobre leads

### Sprint 5 — Atendente IA + WhatsApp
1. Criar tabela `ai_agent_config` (prompt, tom, regras, FAQs, knowledge base)
2. Tela do agente com persistencia no banco
3. Edge function para proxy com Gemini API
4. Criar tabela `contact_memory` para memoria por contato
5. Preparar estrutura de integracao com Evolution API (criar instancia, status, webhook receiver)

### Sprint 6 — Billing + Planos + Insights
1. Criar tabela `subscriptions` (plano atual, status, trial_ends_at, ciclo)
2. Logica de gate por plano consumindo banco real
3. Controle de uso de IA (tabela `ai_usage_logs`, calculo de percentual)
4. Alertas em 80/90/100%
5. Preparar webhook para Kiwify
6. Insight Sales System com queries reais sobre leads, agendamentos, conversao

### Sprint 7 — Polish + Mobile + Admin
1. Responsividade mobile completa (sidebar hamburger, layouts adaptados)
2. Painel admin da plataforma (visao multi-tenant, metricas globais)
3. Central de suporte com chamados (tabela `support_tickets`)
4. Configuracoes com persistencia
5. Testes end-to-end e refinamento visual

---

**Total: 7 sprints.** Cada sprint pode levar de 1 a 3 sessoes de implementacao dependendo da complexidade. Recomendo comecar pela Sprint 1 (autenticacao real e banco) pois tudo depende dis