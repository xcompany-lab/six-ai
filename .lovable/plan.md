

## Plano: Ajustar HomePage para verificação Google Cloud

### Contexto
O Google exige que a homepage do app:
1. Explique a funcionalidade do app ✅ (já atende)
2. Explique **por que** solicita dados do Google (Google Agenda) ❌
3. Tenha link para Política de Privacidade ✅ (footer)
4. Seja acessível sem login ✅

A Política de Privacidade também precisa mencionar explicitamente os dados do Google Calendar.

### Alterações

#### 1. `src/pages/HomePage.tsx`
- Adicionar uma seção **"Integrações e Uso de Dados Google"** após a seção de benefícios ou antes do CTA final
- Conteúdo: explicar que o SIX AI integra com Google Agenda para criar compromissos automaticamente, que solicita acesso somente a `calendar.events` e que os tokens são armazenados de forma segura
- Incluir link direto para `/privacidade` nessa seção
- Atualizar URLs no footer de caminhos relativos para absolutos com domínio `usesix.com.br` (se necessário)

#### 2. `src/pages/PrivacyPage.tsx`
- Adicionar subseção **"Dados de Integração Google"** dentro de "Dados Coletados", incluindo:
  - Token de acesso e refresh token do Google Calendar
  - Escopo solicitado: `calendar.events` (apenas leitura/escrita de eventos)
  - Dados NÃO acessados: e-mails, contatos, arquivos
- Adicionar em "Uso dos Dados": explicar que os dados do Google Calendar são usados exclusivamente para criar e sincronizar agendamentos
- Adicionar em "Direitos do Usuário": possibilidade de desconectar Google Calendar a qualquer momento nas Configurações

#### 3. `src/pages/TermsPage.tsx`
- Adicionar menção à integração com Google Calendar na seção de funcionalidades, esclarecendo que o uso requer autorização OAuth explícita do usuário

### Objetivo
Com essas alterações, a homepage e a política de privacidade atenderão aos requisitos de verificação de marca do Google Cloud Console, permitindo que o domínio `usesix.com.br` passe na verificação OAuth.

