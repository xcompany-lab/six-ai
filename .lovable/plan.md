

## Plano: Onboarding Conversacional com IA

Substituir o formulário de 6 etapas por uma interface de chat fullscreen onde o orquestrador IA conduz 3-4 perguntas abertas, o usuário responde livremente e anexa arquivos/links, e ao final o Gemini gera os 4 system prompts com qualidade máxima.

---

### 1. Nova página `OnboardingPage.tsx` — Interface de Chat

Reescrever completamente. Layout fullscreen com:
- Logo SIX no topo + subtítulo "Conte sobre seu negócio — nossa IA vai configurar tudo"
- Status bar com 3-4 dots indicando progresso
- Área de mensagens estilo chat (bolhas IA à esquerda, usuário à direita)
- Input com textarea auto-grow + botões de anexo (Arquivo, Foto, Link)
- Anexos aparecem como pills dentro da mensagem do usuário

**Fluxo da conversa (client-side, sem chamada de IA para as perguntas):**

1. Mensagem inicial do orquestrador (hardcoded): "Olá! Sou o orquestrador do SIX AI. Vou te fazer algumas perguntas sobre seu negócio e com suas respostas vou criar agentes de IA completos e personalizados para você. Para começar: me conte tudo sobre seu negócio. O que você faz, quem é seu cliente ideal, como você atende hoje? Pode ser à vontade — quanto mais detalhe, melhor seus agentes ficam. Você também pode anexar o link do seu Instagram, site, cardápio, tabela de preços ou qualquer arquivo que me ajude a entender sua marca."
2. Após resposta 1, pergunta 2: "Perfeito! Agora me conta: qual é a maior objeção que seus clientes têm antes de fechar? E como você costuma responder quando isso acontece?"
3. Após resposta 2, pergunta 3: "Última pergunta: como você prefere que a IA se comunique com seus clientes? Mais formal, descontraída, direta? E qual é o resultado mais importante que você quer alcançar com a automação?"
4. Após resposta 3: estado "Gerando seus agentes..." → chama Edge Function

**Componentes internos:**
- `ChatMessage` — bolha de mensagem (IA ou usuário) com pills de anexos
- `ChatInput` — textarea + botões de anexo
- Anexos armazenados em Supabase Storage (`avatars` bucket ou novo bucket)

---

### 2. Nova Edge Function `generate-agent-configs` — Reescrita total

Substituir os builders de template por uma chamada ao Gemini (via Lovable AI Gateway) com meta-prompt sofisticado.

**Input recebido:**
```json
{
  "free_text": "respostas concatenadas",
  "files": ["texto extraído de PDFs/imagens"],
  "links": ["conteúdo scrapeado de URLs"],
  "instagram_data": "bio + legendas extraídas"
}
```

**Meta-prompt do orquestrador:** O prompt completo descrito pelo usuário, pedindo ao Gemini que gere os 4 system prompts + business_profile estruturado em um único JSON.

**Processamento:**
1. Recebe o input concatenado
2. Chama Lovable AI Gateway com `google/gemini-2.5-pro` (modelo mais forte para esta tarefa criativa)
3. Parseia o JSON retornado
4. Upserta `business_profiles` com os dados estruturados extraídos
5. Upserta os 4 `agent_configs` com os system prompts gerados
6. Atualiza `profiles.is_onboarded = true`

---

### 3. Instagram Scraping via Firecrawl

Quando o usuário cola um link do Instagram, usar Firecrawl (já disponível como connector) para scrape do perfil público. Extrair bio, categoria e legendas recentes. Isso alimenta o contexto do orquestrador sem o usuário precisar digitar.

Necessário: conectar Firecrawl connector. Se não disponível, fallback para `fetch` simples na Edge Function.

**Alternativa sem Firecrawl:** A Edge Function faz fetch direto do HTML público do Instagram e extrai dados básicos via regex (bio, nome). Menos robusto mas funcional.

---

### 4. Upload de Arquivos

- PDFs/DOCX: upload para Supabase Storage, Edge Function usa Lovable AI para extrair conteúdo relevante
- Imagens: upload para Storage, URL passada ao Gemini (multimodal)
- Links: Edge Function faz fetch e extrai texto markdown

Criar bucket `onboarding-files` no Storage (público para leitura pela Edge Function).

---

### 5. Ajustes em `App.tsx` e `AuthContext`

- Manter rota `/onboarding` sem guard de `isOnboarded`
- `completeOnboarding` continua sendo chamado pela Edge Function (via upsert no profiles)
- Após sucesso, navegar para `/app`

---

### 6. `AIAgentPage.tsx` — Ajuste menor

O botão "Iniciar configuração guiada" e "Reconfigurar" já apontam para `/onboarding`. Sem mudanças necessárias.

---

### Ordem de implementação

1. Criar bucket `onboarding-files` no Storage
2. Reescrever `OnboardingPage.tsx` como interface de chat
3. Reescrever `generate-agent-configs` Edge Function com meta-prompt + Gemini
4. Integrar upload de arquivos e scraping de links/Instagram
5. Testar fluxo end-to-end

### Escopo estimado
Mudança grande: 2 arquivos principais (`OnboardingPage.tsx` ~300 linhas, `generate-agent-configs/index.ts` ~200 linhas), 1 migration (bucket), ajustes menores em hooks.

