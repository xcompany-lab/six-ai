

## Carrossel infinito de logos (Marquee) abaixo do selo Brasil

### O que será feito

Adicionar um carrossel de logos de clientes em movimento contínuo (efeito marquee/infinite scroll) logo abaixo do selo "O sistema de IA mais completo do Brasil". As logos serão exibidas em escala de cinza (CSS `grayscale`) com opacidade reduzida, mantendo o visual elegante e escuro da página.

### Design

- Faixa horizontal com overflow hidden, sem bordas visíveis
- Logos duplicadas 2x para criar loop infinito via CSS `@keyframes` (translateX de 0 a -50%)
- Filtro `grayscale(100%) brightness(200%)` + `opacity-50` para manter consistência visual no tema dark
- Altura das logos: ~40px no mobile, ~50px no desktop
- Velocidade suave (~30s por ciclo completo)
- Sem pausa no hover (movimento contínuo)

### Implementação

1. **Copiar as 5 imagens** para `src/assets/clients/`:
   - `claro.png`, `mais-saude.jpeg`, `nutri-integrar.png`, `nutrilife.jpeg`, `espaco-saude.jpeg`

2. **CSS em `src/index.css`** — adicionar keyframe `marquee`:
   ```css
   @keyframes marquee {
     0% { transform: translateX(0); }
     100% { transform: translateX(-50%); }
   }
   ```

3. **`src/pages/HomePage.tsx`** — inserir entre o selo Brasil (linha 126) e a seção Problem (linha 128):
   - Container com `overflow-hidden`
   - Div interna com `flex`, `animation: marquee 30s linear infinite`, contendo as logos duplicadas (10 imagens = 5 reais x2)
   - Cada logo com `h-10 sm:h-12`, `grayscale`, `opacity-50`, `object-contain`
   - Label opcional "Empresas que confiam na 6AI" acima em texto muted pequeno

### Arquivos

1. Copiar 5 imagens → `src/assets/clients/`
2. Editar `src/index.css` — adicionar keyframe `marquee`
3. Editar `src/pages/HomePage.tsx` — adicionar seção do carrossel

