

## Plano: Visualizar System Prompts dos Agentes

### Problema
Os cards dos agentes na página Atendente IA mostram apenas o número de caracteres do prompt. O usuário quer ver o conteúdo completo.

### Correção — `src/pages/AIAgentPage.tsx`

Tornar cada card de agente clicável/expandível para exibir o system prompt completo:

1. Adicionar estado local `expandedAgent` (string | null) para controlar qual agente está expandido
2. Ao clicar no card do agente, alternar a expansão
3. Quando expandido, mostrar o `system_prompt` completo abaixo do card em um bloco com:
   - `whitespace-pre-wrap` para respeitar quebras de linha do prompt
   - `max-h-[400px] overflow-y-auto` com ScrollArea para prompts longos
   - `text-xs text-muted-foreground font-mono` para leitura clara
   - Ícone de chevron indicando estado expandido/colapsado
4. Manter o grid layout — o conteúdo expandido aparece abaixo do grid (full width)

Componentes existentes utilizados: `ScrollArea` de `@/components/ui/scroll-area`.

