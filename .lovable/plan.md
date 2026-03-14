

## Diagnóstico

O arquivo "Apresentação HIDRAGLOSS.pdf.pdf" falhou no upload porque o nome contém o caractere acentuado `ã`. O Supabase Storage pode rejeitar paths com caracteres não-ASCII dependendo da configuração.

Todos os uploads bem-sucedidos têm nomes sem acentos (ex: "Curso Pro Beauty 3 em 1.pdf.pdf", "Curso Expert em Design de Sobrancelhas.pdf.pdf").

## Solução

Sanitizar o nome do arquivo antes de usá-lo no path do Storage, removendo acentos e caracteres especiais.

### Alteração em `src/pages/OnboardingPage.tsx`

Na função `uploadFile` (linha ~146), antes de montar o `path`:

1. Criar uma função `sanitizeFileName(name: string)` que:
   - Remove acentos usando `normalize('NFD').replace(/[\u0300-\u036f]/g, '')`
   - Substitui espaços e caracteres especiais por `-`
   - Remove caracteres não alfanuméricos (exceto `-`, `_`, `.`)

2. Usar o nome sanitizado no path do Storage, mas manter o nome original no objeto `Attachment` para exibição

```typescript
const sanitize = (name: string) =>
  name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .replace(/-+/g, '-');

const path = `${user.id}/${Date.now()}-${sanitize(file.name)}`;
```

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/OnboardingPage.tsx` | Sanitizar nome do arquivo no path de upload |

