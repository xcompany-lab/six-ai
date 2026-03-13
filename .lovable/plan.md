

## Plano: Substituir `prompt()` por input inline para links

Trocar o `window.prompt()` nativo (que expõe a URL do projeto) por um input inline dentro do próprio container de anexos.

### Mudanças em `OnboardingPage.tsx`

1. **Novo estado:** `showLinkInput` (boolean) e `linkInputValue` (string)
2. **Remover** a função `addLink` que usa `prompt()`
3. **Botão Link2:** ao clicar, seta `showLinkInput(true)` em vez de chamar `prompt()`
4. **Input inline:** Quando `showLinkInput` é true, renderizar um pequeno input dentro da área de attachment pills (acima do textarea), com:
   - Input de texto com placeholder "Cole o link (Instagram, site, etc)"
   - Botão de confirmar (Check) e cancelar (X)
   - Ao confirmar ou pressionar Enter, adiciona o link como attachment e limpa/esconde o input
   - Ao cancelar ou Escape, esconde o input
5. **Estilo:** Input com `bg-muted rounded-lg px-3 py-1.5 text-sm` integrado ao visual glass do container

### Arquivo alterado
- `src/pages/OnboardingPage.tsx`

