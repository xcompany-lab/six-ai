

# Redesign dos badges/títulos e ícones da HomePage

## 1. Badges com texto gradiente (sem borda/pill)

Os badges "Smart Interaction eXperience" (linha 59-61) e "Exclusivo do Plano Pro" (linha 216-218) atualmente usam um design pill com borda e fundo. Vamos trocar para:

- Remover o container pill (border, bg, rounded-full)
- Aplicar um gradiente na cor do texto (azul→ciano para o SIX, verde→ciano para o Pro)
- Usar uma fonte diferenciada (JetBrains Mono já disponível no projeto) com letter-spacing
- Adicionar um leve efeito de shimmer animado no texto

## 2. Ícones premium estilo "cyber" em todas as seções

Substituir os ícones simples por um componente `CyberIcon` que replica o design CSS fornecido. O componente terá:

- Camada externa (`icon-outer`) com gradiente animado (metalSlide) na borda — usando a variante `cyber-cyan` como padrão (alinhada com a paleta azul/ciano do SIX)
- Camada intermediária (`icon-mid`) com fundo escuro
- Camada interna (`icon-face`) com radial gradient e o ícone Lucide com glow/drop-shadow
- Tamanhos configuráveis (sm: 48px para inline cards, md: 64px para features, lg: 80px para how-it-works)

### Seções afetadas:
- **Solution** (linha 131-146): 5 cards com ícones inline
- **How it Works** (linha 159-176): 3 steps com ícones grandes
- **Benefits** (linha 189-206): 6 feature cards
- **Social Proof** (linha 371-383): 4 cards com ícones

### Implementação CSS:
- Adicionar as keyframes `metalSlide` e classes `.icon-outer`, `.icon-mid`, `.icon-face`, `.cyber-cyan` no `index.css`
- Criar componente `CyberIcon` em `src/components/ui/cyber-icon.tsx` que aceita um ícone Lucide, tamanho, e variante de cor (cyan como padrão, green para seção Pro)

## Arquivos
- `src/index.css` — adicionar keyframes e classes cyber icon
- `src/components/ui/cyber-icon.tsx` — novo componente
- `src/pages/HomePage.tsx` — trocar badges e ícones em todas as seções

