

## Plano: Editar prompts dos agentes via chat com IA

### Objetivo
Quando o usuario expandir um agente (Atendente, Agendador, Follow-up, CRM), alem de ver o system prompt atual, havera um input de chat na parte inferior. O usuario descreve o que quer alterar, a IA reescreve o prompt incorporando as mudancas, e o resultado e salvo automaticamente.

### Fluxo do usuario
1. Clica no card do agente → expande e mostra o system prompt
2. Na parte inferior do prompt expandido, ve um campo de texto com placeholder tipo "O que voce quer alterar ou incrementar nesse agente?"
3. Escreve a instrucao (ex: "Seja mais informal", "Adicione que aceitamos Pix")
4. Clica em Enviar → loading spinner no botao
5. A IA reescreve o prompt completo com as alteracoes
6. O novo prompt substitui o anterior na tela e e salvo no banco
7. Toast de confirmacao

### Alteracoes

**1. Nova edge function `supabase/functions/refine-agent-prompt/index.ts`**
- Recebe: `current_prompt` (string), `user_instruction` (string), `agent_type` (string)
- Chama Gemini com um meta-prompt: "Voce e um especialista em system prompts. Recebeu o prompt atual de um agente {tipo}. O usuario pediu a seguinte alteracao: {instrucao}. Reescreva o prompt COMPLETO incorporando a alteracao, mantendo toda a estrutura e regras existentes. Retorne APENAS o novo prompt, sem explicacoes."
- Retorna o novo prompt

**2. `supabase/config.toml`**
- Adicionar entrada `[functions.refine-agent-prompt]` com `verify_jwt = false`

**3. `src/hooks/use-agent-configs.ts`**
- Adicionar mutation `useUpdateAgentPrompt` que faz UPDATE na tabela `agent_configs` para o `id` especifico
- Adicionar mutation `useRefineAgentPrompt` que chama a edge function e depois salva

**4. `src/pages/AIAgentPage.tsx`**
- No bloco expandido de cada agente, adicionar abaixo do ScrollArea do prompt:
  - Um input de texto com icone de envio
  - Estado local para o texto da instrucao e loading
  - Ao submeter: chama `refine-agent-prompt` → atualiza o prompt na tela e no banco
  - Mostrar o prompt atualizado imediatamente apos o retorno
- O prompt exibido deve refletir o estado mais recente (usar invalidateQueries apos save)

### Estrutura visual do bloco expandido

```text
┌──────────────────────────────────────────────┐
│  [ScrollArea com system prompt - max 400px]  │
│                                              │
│  prompt completo aqui...                     │
│                                              │
├──────────────────────────────────────────────┤
│  💬 O que voce quer alterar nesse agente?    │
│  [____________________________________] [➤]  │
└──────────────────────────────────────────────┘
```

### Seguranca
- A edge function valida que o body contem os campos obrigatorios
- O update no banco usa RLS (usuario so altera seus proprios agent_configs)
- O Gemini recebe apenas o prompt atual + instrucao, sem dados sensiveis extras

