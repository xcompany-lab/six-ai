

## Corrigir logos do carrossel — remover fundos e ajustar visual

### Problema

As logos dos clientes estão aparecendo com fundo cinza/quadrado porque as imagens PNG não têm transparência real. O CSS `grayscale brightness-200` não remove fundos — apenas altera cores.

### Solução

1. **Reprocessar todas as 5 imagens** a partir dos uploads originais, garantindo remoção de fundo (transparência real no PNG). Substituir os arquivos em `src/assets/clients/`.

2. **Ajustar CSS das logos** no carrossel para um visual mais acinzentado e sutil:
   - Trocar `grayscale brightness-200 opacity-50` por `grayscale opacity-30 brightness-150`
   - Isso deixa as logos mais "fantasma", sem os quadrados de fundo visíveis

### Arquivos modificados

1. `src/assets/clients/claro.png` — reprocessar sem fundo
2. `src/assets/clients/mais-saude.png` — reprocessar sem fundo
3. `src/assets/clients/nutri-integrar-nobg.png` — reprocessar sem fundo
4. `src/assets/clients/nutrilife.png` — reprocessar sem fundo
5. `src/assets/clients/espaco-saude-nobg.png` — reprocessar sem fundo
6. `src/pages/HomePage.tsx` — ajustar classes CSS das logos (linha 151)

