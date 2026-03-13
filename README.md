<p align="center">
  <img src="src/assets/six-logo-dark.png" alt="SIX AI" width="200" />
</p>

<h1 align="center">SIX AI</h1>

<p align="center">
  <strong>Plataforma SaaS de atendimento inteligente e vendas com IA para negócios</strong><br/>
  Automatize seu WhatsApp, gerencie leads e escale suas vendas com inteligência artificial.
</p>

<p align="center">
  <a href="https://six-ai.lovable.app">🌐 Acesse a plataforma</a>
</p>

---

## 📋 Visão Geral

O **SIX AI** é uma plataforma completa de automação comercial que combina inteligência artificial com WhatsApp para transformar o atendimento e as vendas de pequenos e médios negócios. A IA atende clientes 24/7, agenda compromissos, faz follow-up automático e fornece insights estratégicos — tudo integrado em um único painel.

---

## ✨ Funcionalidades

| Recurso | Descrição |
|---|---|
| 🤖 **Atendente IA** | Agente conversacional treinável com tom de voz, FAQ, objeções e base de conhecimento personalizáveis |
| 📱 **Integração WhatsApp** | Conexão direta via Evolution API com QR Code, envio e recebimento de mensagens em tempo real |
| 📊 **CRM / Kanban** | Pipeline visual de leads com colunas customizáveis (Novo → Em andamento → Interessado → Agendado → Cliente) |
| 📅 **Agendamentos com IA** | Criação automática de agendamentos via conversa, com configuração de horários e dias de trabalho |
| 🔄 **Follow-up Automático** | Fluxos de reengajamento configuráveis com múltiplas tentativas e intervalos personalizados |
| 🔔 **Lembretes Inteligentes** | Notificações automáticas pré-consulta com confirmação esperada do cliente |
| 📡 **Ativação de Base** | Campanhas de reativação para contatos inativos com filtros por status e tempo |
| 💡 **Insight Sales System** | Painel de insights e oportunidades gerados por IA com ações sugeridas |
| 🧠 **Memória Contextual** | Histórico e preferências por contato para conversas personalizadas |
| 👤 **Perfil com Upload de Foto** | Upload de avatar com recorte e ajuste de imagem integrado |

---

## 💰 Planos

| | Trial Free | Start | Plus | Pro |
|---|---|---|---|---|
| **Preço** | Grátis por 5 dias | R$ 49/mês | R$ 97/mês | R$ 197/mês |
| **Contatos** | 5.000 | 1.000 | 3.000 | 5.000 |
| Atendente IA | ✅ | ✅ | ✅ | ✅ |
| Conexão WhatsApp | ✅ | ✅ | ✅ | ✅ |
| Agendamentos com IA | ✅ | — | ✅ | ✅ |
| Google Agenda | ✅ | — | ✅ | ✅ |
| Lembretes com IA | ✅ | — | ✅ | ✅ |
| Follow-up com IA | ✅ | — | — | ✅ |
| Ativação de base | ✅ | — | — | ✅ |
| CRM / Kanban | ✅ | — | — | ✅ |
| Insight Sales System | ✅ | — | — | ✅ |

> O Trial inclui todos os recursos Pro por 5 dias. Após o período, converte automaticamente para o plano Pro.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologias |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| **Animações** | Framer Motion |
| **Gráficos** | Recharts |
| **Backend** | Supabase (Auth, Database, Storage, Edge Functions) |
| **IA** | Google Gemini API (via Edge Functions) |
| **WhatsApp** | Evolution API |
| **Pagamentos** | Ticto (webhooks) |

---

## 📁 Estrutura do Projeto

```
├── src/
│   ├── assets/              # Logos e imagens estáticas
│   ├── components/
│   │   ├── layout/          # AppLayout, AppSidebar
│   │   └── ui/              # Componentes shadcn/ui + customizados
│   ├── contexts/            # AuthContext (autenticação global)
│   ├── hooks/               # Hooks de dados (leads, billing, AI, WhatsApp, etc.)
│   ├── integrations/
│   │   └── supabase/        # Cliente e tipos gerados do Supabase
│   ├── pages/               # Todas as páginas da aplicação
│   ├── types/               # Tipos globais e constantes de planos
│   └── lib/                 # Utilitários (cn, helpers)
├── supabase/
│   ├── functions/           # Edge Functions (ai-chat, evolution-api, webhooks)
│   └── migrations/          # Migrações do banco de dados
├── public/                  # Arquivos estáticos (favicon, robots.txt)
└── index.html               # Entry point
```

---

## 🚀 Como Rodar Localmente

### Pré-requisitos

- [Node.js](https://nodejs.org/) 18+ (recomendado: usar [nvm](https://github.com/nvm-sh/nvm))
- Conta no [Supabase](https://supabase.com/) com projeto configurado

### Instalação

```bash
# 1. Clone o repositório
git clone <URL_DO_REPOSITÓRIO>
cd <NOME_DO_PROJETO>

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais (veja seção abaixo)

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`.

### Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com hot-reload |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build de produção |
| `npm run lint` | Linting com ESLint |
| `npm run test` | Executar testes |

---

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...sua_anon_key
VITE_SUPABASE_PROJECT_ID=seu_project_id
```

### Secrets das Edge Functions (configurar no Supabase Dashboard)

| Secret | Descrição |
|---|---|
| `GEMINI_API_KEY` | Chave da API do Google Gemini para o agente de IA |
| `EVOLUTION_API_URL` | URL da instância da Evolution API |
| `EVOLUTION_API_KEY` | Chave de autenticação da Evolution API |

---

## 🌐 Deploy

### Via Lovable (recomendado)

1. Acesse o [projeto no Lovable](https://lovable.dev/projects/)
2. Clique em **Share → Publish**
3. Opcionalmente, conecte um domínio personalizado em **Settings → Domains**

### Self-hosting

1. Execute `npm run build` para gerar o build de produção
2. Sirva o conteúdo da pasta `dist/` com qualquer servidor estático (Nginx, Vercel, Netlify, etc.)
3. Configure as variáveis de ambiente no seu provedor de hospedagem

---

## 📄 Licença

Este projeto é **proprietário e privado**. Todos os direitos reservados.

---

<p align="center">
  Desenvolvido com ❤️ usando <a href="https://lovable.dev">Lovable</a> + <a href="https://supabase.com">Supabase</a>
</p>
