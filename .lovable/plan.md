

# O Que Já Foi Feito (Sprints 1–6)

| Sprint | Escopo | Status |
|--------|--------|--------|
| 1 | Auth + Banco + Perfil | Concluído |
| 2 | CRM + Leads + Kanban | Concluído |
| 3 | Agenda + Agendamentos | Concluído |
| 4 | Follow-up + Lembretes + Ativação | Concluído |
| 5 | Atendente IA + WhatsApp (prep) | Concluído |
| 6 | Billing + Insights | Concluído |

---

# O Que Falta

### Sprint 7 — Polish, Mobile, Configurações e Suporte
1. **Responsividade mobile completa** — sidebar hamburger, layouts adaptados para 430px (viewport atual do usuário)
2. **Página de Configurações funcional** — cada seção (Branding, Notificações, Integrações, Permissões, Status Técnico) com formulários reais e persistência
3. **Central de Suporte** — tabela `support_tickets` no Supabase, CRUD de chamados, status tracking
4. **Refinamento visual** — animações, estados vazios, loading skeletons, tratamento de erros consistente

### Sprint 8 — Integrações Reais
1. **Evolution API (WhatsApp)** — Edge function `whatsapp-webhook` para receber mensagens, processar com ai-chat e responder automaticamente; QR code real; status da conexão
2. **Google Agenda** — OAuth flow, sync de disponibilidade bidirecional
3. **Pagamentos (Stripe ou Kiwify)** — checkout para upgrades de plano, webhook de confirmação, recarga pré-paga via Pix

### Sprint 9 — Admin + Segurança + Produção
1. **Painel admin** — visão multi-tenant, métricas globais da plataforma, gestão de usuários
2. **Segurança** — audit log, rate limiting nas edge functions, validação de inputs
3. **Testes end-to-end** — fluxos críticos (signup → onboarding → criar lead → agendar → follow-up)
4. **Deploy em produção** — custom domain, variáveis de ambiente, monitoramento

---

**Recomendação:** Iniciar pela Sprint 7 (mobile + configurações + suporte) pois são melhorias internas que não dependem de APIs externas e deixam o produto mais polido para quando as integrações reais entrarem.

