
Objetivo: corrigir o fluxo de áudio da IA da Kethy (hoje o webhook recebe o áudio, mas a transcrição falha e nada é enfileirado para resposta).

Diagnóstico confirmado
- O `whatsapp-webhook` está recebendo o áudio normalmente (`messages.upsert`).
- O campo recebido é `audioMessage.url` com arquivo `.enc` (mídia criptografada do WhatsApp).
- O código atual baixa essa URL e envia direto ao Whisper.
- O Whisper retorna `400 Invalid file format`, então `messageText` fica vazio e o webhook devolve `reason: "no text"` (por isso “nada acontece”).

Plano de implementação
1) Corrigir extração de mídia para Whisper
- Em `supabase/functions/whatsapp-webhook/index.ts`, criar um fluxo de mídia robusto:
  - Detectar quando a URL é `.enc` ou quando o download volta `application/octet-stream`.
  - Nesses casos, buscar a mídia decodificada via Evolution (`/chat/getBase64FromMediaMessage/{instance}` usando `message.key`).
  - Converter o base64 retornado em `Blob/File` com `mimetype` e extensão corretos (`.oga/.ogg/.mp3...`).

2) Ajustar função de transcrição
- Trocar `transcribeAudioWhisper(audioUrl)` por função que aceite `Blob/File` + filename real.
- Enviar ao Whisper com `FormData` preservando tipo/extensão reais.
- Manter `model: whisper-1` e `language: pt`.

3) Melhorar tratamento de falha (evitar silêncio)
- Se a transcrição falhar, não deixar “sumir”:
  - Log detalhado do motivo.
  - Retorno explícito no webhook (`audio_transcription_failed`), e opcionalmente uma resposta automática curta pedindo texto novamente.
- Isso evita a percepção de sistema travado.

4) Ajustar criação de instância para reduzir falhas futuras
- Em `supabase/functions/evolution-api/index.ts`, revisar configuração do webhook para mídia:
  - manter arquitetura Whisper, mas garantir payload que facilite obter mídia válida (sem depender de URL `.enc` direta).

Validação após implementação
- Enviar novo áudio na conversa da Kethy.
- Conferir logs de `whatsapp-webhook`: não pode mais aparecer `Invalid file format`.
- Confirmar que o áudio vira texto e entra em `message_queue`/`conversation_messages`.
- Confirmar resposta da IA ao áudio (fluxo ponta a ponta).

Critérios de aceite
- Áudio recebido → transcrito com Whisper → IA responde normalmente.
- Sem erro 400 de formato no Whisper.
- Sem “silêncio” quando houver falha de transcrição (erro fica explícito e tratável).
