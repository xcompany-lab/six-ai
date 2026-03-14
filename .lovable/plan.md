

## Diagnóstico

Os PDFs **foram enviados com sucesso** ao Supabase Storage (6 arquivos encontrados). O problema é que os **anexos pendentes** (ainda não submetidos com o botão enviar) não são persistidos no localStorage. Quando a usuária trocou de aba/janela e a página recarregou, os anexos que ela tinha acabado de selecionar desapareceram.

O estado `attachments` (useState) é limpo a cada reload, enquanto apenas `allAttachments` (já submetidos) é salvo.

## Solução

Persistir o array `attachments` (anexos pendentes) no localStorage junto com os demais dados.

### Alterações em `src/pages/OnboardingPage.tsx`

1. **Adicionar `attachments` ao objeto salvo no localStorage** (no useEffect de persistência, linha ~98)
2. **Restaurar `attachments` no mount e no re-hydrate** (linhas ~68 e ~117)
3. Adicionar `attachments` na lista de dependências do useEffect de persistência

Como os arquivos já estão no Storage com URL pública, ao restaurar basta recriar os objetos `Attachment` — não precisa re-upload.

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/OnboardingPage.tsx` | Incluir `attachments` na persistência e restauração do localStorage |

