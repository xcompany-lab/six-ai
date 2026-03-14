

## Plano: Badges "PASSO N" no sidebar para usuários Trial

### O que muda

Para contas com `plan === 'trial'`, exibir badges numerados ao lado de 5 itens específicos do menu, guiando o onboarding pós-setup:

| Badge | Item do menu |
|-------|-------------|
| PASSO 1 | Atendente IA |
| PASSO 2 | Agendamentos |
| PASSO 3 | Follow Up |
| PASSO 4 | Agenda |
| PASSO 5 | WhatsApp |

### Estilo visual

Badges com estética cyber/roxo alinhada à identidade visual:
- Fundo `bg-purple-500/20` com borda `border-purple-500/50`
- Texto em `text-purple-400` com fonte `JetBrains Mono` (ou monospace)
- Glow sutil via `shadow-[0_0_8px_rgba(168,85,247,0.4)]`
- Tamanho pequeno (`text-[10px]`, `px-2 py-0.5`) para ser sutil mas visível

### Alteração técnica

| Arquivo | Alteração |
|---------|-----------|
| `src/components/layout/AppSidebar.tsx` | Adicionar mapa `trialSteps` (path → número do passo), renderizar badge condicional quando `profile?.plan === 'trial'` e `showLabels` estiver ativo |

A lógica é um simples `Record<string, number>` mapeando paths aos passos, renderizado como `<span>` após o label do menu item.

