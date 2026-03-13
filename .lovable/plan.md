

## Plano: Tipografia Premium com Gradiente e Layout Expandido

### Mudanças em `OnboardingPage.tsx`

**1. Expandir largura do conteúdo:**
- `max-w-2xl` → `max-w-4xl` para usar mais espaço horizontal

**2. Tipografia com gradiente nas perguntas:**
- Aplicar a classe utilitária existente `text-gradient-brand` (cyan→green) no texto das perguntas
- Aumentar fonte: `text-3xl md:text-4xl lg:text-5xl` com `font-bold leading-tight`
- Partes em **bold** terão um glow sutil via `drop-shadow` com a cor primary
- Remover emojis dos textos das perguntas

**3. Input mais largo:**
- Container do input acompanha o `max-w-4xl` do pai
- Textarea com `rows={3}` e `max-h-48` para mais espaço vertical

**4. Remover emojis:**
- Pergunta 1: remover "👋"
- Estado final: remover "✅"

### Mudanças em `index.css`

**Adicionar classe de glow para texto gradiente:**
```css
.text-gradient-glow {
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  background-image: linear-gradient(135deg, hsl(199 89% 48%), hsl(185 80% 55%), hsl(160 84% 50%));
  filter: drop-shadow(0 0 20px hsl(199 89% 48% / 0.3));
}
```

### Arquivos alterados
1. `src/pages/OnboardingPage.tsx` — layout + tipografia
2. `src/index.css` — nova classe `.text-gradient-glow`

