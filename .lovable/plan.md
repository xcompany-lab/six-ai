

## Plano: Gravacao de Audio com Transcricao no Onboarding

Adicionar um botao de microfone na barra de acoes do input que permite gravar audio, transcrever via Gemini (Lovable AI Gateway) e inserir o texto na textarea.

### 1. Nova Edge Function: `transcribe-onboarding-audio`

Recebe audio em base64, envia para o Lovable AI Gateway (Gemini) para transcricao e retorna o texto. Reutiliza o padrao ja existente em `whatsapp-webhook/index.ts` (linhas 98-138).

- Endpoint simples: recebe `{ audio_base64: string }`, retorna `{ text: string }`
- Usa `LOVABLE_API_KEY` (ja configurado)
- CORS headers padrao
- Registrar no `config.toml` com `verify_jwt = false`

### 2. Alteracoes em `OnboardingPage.tsx`

**Novos estados:**
- `isRecording` (boolean)
- `isTranscribing` (boolean)
- `mediaRecorderRef` (ref)

**Logica de gravacao:**
- Usar `navigator.mediaDevices.getUserMedia({ audio: true })` para capturar audio
- `MediaRecorder` para gravar chunks
- Ao parar, converter para base64 e enviar para a edge function
- O texto transcrito e inserido (append) na textarea

**UI:**
- Botao de microfone (`Mic` icon do lucide) na barra de acoes, ao lado dos botoes de anexo
- Enquanto grava: botao fica vermelho pulsante com icone `MicOff` ou `Square` para parar, e um indicador textual "Gravando..."
- Enquanto transcreve: icone com `Loader2` animado
- Hint no placeholder ou no texto inferior: "Pressione Enter para enviar" vira "Pressione Enter para enviar · ou use o microfone"
- Tooltip ou indicacao visual clara da funcionalidade de audio

### 3. Fluxo do usuario

1. Clica no microfone → navegador pede permissao
2. Comeca a gravar → botao fica vermelho pulsante + "Gravando..."
3. Clica novamente para parar → envia para transcricao
4. Texto transcrito aparece na textarea, usuario pode editar antes de enviar

### Arquivos alterados
1. `supabase/functions/transcribe-onboarding-audio/index.ts` (novo)
2. `supabase/config.toml` (adicionar funcao)
3. `src/pages/OnboardingPage.tsx` (botao mic + logica de gravacao/transcricao)

