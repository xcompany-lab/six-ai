

## Plano: Transcrição de áudio via OpenAI Whisper

### Problema atual

A Evolution API envia o áudio como URL (não base64). O código atual tenta extrair `base64` do payload, que não existe. Precisamos baixar o áudio pela URL e transcrever com Whisper.

### Abordagem

Em vez de depender do base64 da Evolution API, vamos:
1. Extrair a **URL do áudio** do payload (`audioMessage.mediaUrl` ou `audioMessage.url`)
2. **Baixar o arquivo** de áudio diretamente dessa URL
3. Enviar para a **API Whisper da OpenAI** (`/v1/audio/transcriptions`) como `multipart/form-data`

### Pré-requisito: Secret OPENAI_API_KEY

Whisper é um endpoint separado do chat completions — não passa pelo Lovable AI Gateway. Precisamos de uma chave da OpenAI diretamente.

### Alterações

**`supabase/functions/whatsapp-webhook/index.ts`:**

1. Substituir `extractAudioBase64()` por `extractAudioUrl()` — extrai a URL do áudio do payload
2. Substituir `transcribeAudio(base64)` por `transcribeAudioWhisper(audioUrl)`:
   - Faz `fetch(audioUrl)` para baixar o arquivo OGG
   - Envia como `multipart/form-data` para `https://api.openai.com/v1/audio/transcriptions`
   - Model: `whisper-1`, language: `pt`
3. Remover toda lógica de base64

**Nenhuma outra alteração necessária** — o resto do pipeline (enqueue, memória) já funciona.

### Fluxo corrigido

```text
Áudio recebido no webhook
  → extractAudioUrl() pega URL do payload
  → fetch(url) baixa o arquivo OGG
  → POST /v1/audio/transcriptions (Whisper)
  → Retorna texto transcrito
  → Mensagem enfileirada normalmente
```

### Secret necessária

- `OPENAI_API_KEY` — chave da OpenAI para usar o Whisper. Obtida em https://platform.openai.com/api-keys

