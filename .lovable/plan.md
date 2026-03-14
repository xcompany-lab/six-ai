

## Plano: Modal de Recarga com valores via Pix

### O que muda

Substituir o botão "Recarregar Agora" por um botão que abre um modal com 4 opções de recarga, cada uma com link específico da Ticto.

### Alterações

**`src/pages/PlanPage.tsx`:**
- Importar `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`
- Adicionar estado `rechargeOpen` para controlar o modal
- O botão "Recarregar Agora" agora abre o modal
- Modal com layout conforme sugestão:
  - Título: "Sem créditos de IA disponíveis" (com ícone Zap)
  - Subtítulo: "Seu limite mensal foi atingido. Faça uma recarga rápida para continuar usando o atendimento inteligente."
  - 4 botões em grid 2x2:
    - **R$10** – recarga básica → `https://checkout.ticto.app/O7FB21253`
    - **R$15** – uso moderado → `https://checkout.ticto.app/O82700531`
    - **R$25** – uso avançado → `https://checkout.ticto.app/OF75DAE2F`
    - **R$35** – alto volume → `https://checkout.ticto.app/O31D85879`
  - Cada botão abre o link em nova aba com `?email=` do usuário

