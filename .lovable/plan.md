

# Fix: Campos perdem foco ao digitar

## Causa raiz
O componente `Field` está definido **dentro** da função `ProfilePage`. A cada keystroke, `setForm` causa re-render, o React recria `Field` como uma nova função/componente, e os inputs perdem o foco.

## Solução
Mover `Field` para **fora** do componente `ProfilePage`, passando `value` e `onChange` como props em vez de acessar `form` e `setForm` diretamente via closure.

### Arquivo: `src/pages/ProfilePage.tsx`

1. Extrair `Field` como componente separado no topo do arquivo (antes de `ProfilePage`), recebendo props: `label`, `value`, `onChange`, `placeholder`, `textarea`
2. No JSX, substituir cada `<Field field="name" .../>` por `<Field value={form.name} onChange={(v) => setForm(f => ({...f, name: v}))} .../>`

Mesma abordagem para `AIAgentPage.tsx` que tem o mesmo padrão com `TextArea` e `Input` definidos inline -- também serão extraídos.

