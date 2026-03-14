

## Selo "O sistema de IA mais completo do Brasil" na Landing Page

### O que será feito

Adicionar uma faixa/selo entre os CTAs do hero e a seção "PROBLEM", com a bandeira do Brasil e a frase "O sistema de IA mais completo do Brasil". Posicionamento estratégico logo após os botões de ação, reforçando autoridade antes da seção de problema.

### Design

- Faixa horizontal centralizada com fundo sutil (glass ou bg-secondary/50)
- Ícone da bandeira do Brasil (imagem enviada, copiada para `src/assets/brazil-flag.png`) ao lado esquerdo, tamanho pequeno (~24-32px)
- Texto "O sistema de IA mais completo do Brasil" em `font-bold` com efeito `text-gradient-brand`
- Animação fade-up com Framer Motion, consistente com o restante da página
- Responsivo: no mobile (430px) fica compacto em uma linha; no desktop fica mais espaçado

### Localização no código

**`src/pages/HomePage.tsx`** — entre a `</section>` do Hero (linha 109) e a `</section>` do Problem (linha 111). Nova seção com `py-6 sm:py-10`.

### Arquivos

1. Copiar `user-uploads://IMG_3064.jpeg` → `src/assets/brazil-flag.png`
2. Editar `src/pages/HomePage.tsx` — adicionar a seção do selo

