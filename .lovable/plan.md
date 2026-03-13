

## Plano: Onboarding Premium — Estilo Claude

Redesenhar a tela de onboarding para um layout centrado, premium, com gradiente animado de fundo e tipografia grande, inspirado na tela inicial do Claude (imagem de referência).

---

### Mudanças em `OnboardingPage.tsx`

**Layout — de chat para tela centrada:**
- Remover o layout de chat com bolhas laterais
- Layout centralizado verticalmente com `flex items-center justify-center`
- Logo SIX grande no topo central
- Pergunta atual exibida como título grande (`text-2xl md:text-3xl font-bold`) centralizada, com formatação bold via markdown
- Após responder, a pergunta some com animação e a próxima aparece (transição fade)
- Progress dots mantidos, mas mais discretos

**Campo de input — estilo Claude:**
- Input centralizado na tela, largura `max-w-2xl`
- Container com `glass-strong` (backdrop-blur), `rounded-2xl`, borda sutil com gradiente
- Textarea dentro do container, sem borda própria, `text-base` (maior que antes)
- Botões de anexo (Paperclip, Image, Link2) dentro do container, à esquerda na parte inferior
- Botão Send à direita inferior dentro do container
- Pills de anexo aparecem acima do textarea, dentro do container

**Fundo — gradiente animado:**
- Div de fundo absoluto com gradiente radial usando as cores da identidade (cyan `hsl(199 89% 48%)`, green `hsl(160 84% 50%)`)
- Animação CSS de movimento lento (shift do gradiente via `background-position` ou `@keyframes`)
- Opacidade baixa (~15-20%) para não competir com o conteúdo
- Adicionar 2-3 "orbs" com `blur-3xl` e `animate` para movimento suave

**Histórico de respostas:**
- Após o usuário responder, mostrar um resumo compacto das respostas anteriores acima da pergunta atual (pills ou badges pequenos tipo "✓ Sobre o negócio", "✓ Objeções")
- Manter o estado funcional existente (userResponses, allAttachments, etc.)

### Mudanças em `index.css`

- Adicionar keyframe `@keyframes gradientShift` para animar background-position
- Adicionar keyframe `@keyframes floatOrb` para movimento suave dos orbs de gradiente

### Arquivos alterados
1. `src/pages/OnboardingPage.tsx` — reescrita do layout
2. `src/index.css` — 2 novos keyframes

### Lógica preservada
Toda a lógica de upload, anexos, envio de mensagens, chamada à Edge Function permanece inalterada. Apenas a apresentação visual muda.

