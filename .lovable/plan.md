

## Landing Page de Conversão para Webinar SIX AI

### Objetivo
Criar uma nova página dedicada (`/webinar`) 100% focada em conversão para inscrição no webinar, seguindo a estrutura: Curiosidade > Problema > Descoberta > Conteudo > Publico > Resultado > CTA > Urgencia.

### Novo arquivo: `src/pages/WebinarPage.tsx`

Pagina completa com 8 blocos, usando os mesmos componentes visuais do projeto (framer-motion, glass, cyber-btn, gradientes, CyberIcon). Layout mobile-first (430px viewport atual).

**Blocos:**

1. **Hero** -- Headline com destaque gradient, subheadline, 4 bullet points com checkmarks, CTA "Quero participar do encontro gratuito" (cyber-btn-primary), subtexto de urgencia
2. **Problema** -- Texto dramatico sobre perda de pacientes no WhatsApp, contraste com quem usa IA
3. **O que voce vai aprender** -- 5 itens numerados com icones CyberIcon, cada um com titulo + descricao curta
4. **Para quem e** -- Lista de especialidades (Nutricao, Psicologia, Odontologia, etc.) com checkmarks
5. **Resultado** -- Fluxo visual: paciente envia msg > IA responde > qualifica > agenda > registra no CRM
6. **Sobre o encontro** -- 3 bullets (demonstracao real, exemplos praticos, como clinicas aplicam), tom direto "Sem teoria. Sem complicacao."
7. **CTA Final + Formulario** -- Formulario com Nome, Email, WhatsApp + botao "Quero garantir minha vaga" (cyber-btn-primary). Sem integracao backend por enquanto (apenas UI)
8. **Urgencia** -- Aviso sobre o que recebe apos inscricao (link, lembretes, materiais), CTA final repetido

### Rota

Adicionar em `src/App.tsx`:
- `import WebinarPage from "./pages/WebinarPage"`
- `<Route path="/webinar" element={<WebinarPage />} />`

### Estilo

- Reutiliza todo o design system existente (glass, cyber-btn, text-gradient-brand, fadeUp/stagger animations, CyberIcon)
- Nav simplificada: apenas logo SIX AI + CTA "Garantir vaga"
- Sem footer complexo, sem links de navegacao para o app
- Formulario com inputs estilizados do projeto (border-input, bg-background)
- Mascara de WhatsApp com formato brasileiro

### Arquivos modificados

1. **Criar** `src/pages/WebinarPage.tsx` -- pagina completa
2. **Editar** `src/App.tsx` -- adicionar rota `/webinar`

