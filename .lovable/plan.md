

## Plano: Etapa de Precos e Pagamento no Onboarding

### Problema
Apos as 3 perguntas do onboarding, o sistema gera os agentes sem saber precos, planos ou formas de pagamento. Isso faz a IA inventar valores ou dizer "nao tenho essa informacao" quando o cliente pergunta preco.

### Solucao

Adicionar uma **etapa intermediaria** entre a ultima pergunta e a geracao dos agentes. Essa etapa:

1. Faz uma chamada rapida a IA (Gemini Flash) para extrair os servicos identificados nas respostas anteriores + conteudo scrapeado
2. Exibe os servicos detectados e pede ao usuario para preencher: valor de cada servico, planos/pacotes, e formas de pagamento aceitas
3. Envia tudo junto para o `generate-agent-configs`

### Fluxo atualizado

```text
Etapa 1: Sobre o negocio
Etapa 2: Objecoes
Etapa 3: Tom e objetivo
Etapa 4: [NOVA] Precos e pagamento  ← dinamica
         → AI extrai servicos das respostas
         → Mostra cards editaveis com cada servico
         → Campos: valor, planos/pacotes, formas de pagamento
         → Botao "Adicionar servico" para servicos nao detectados
Geracao dos agentes
```

### Alteracoes

**1. `src/pages/OnboardingPage.tsx`**
- Adicionar estado `extractedServices` e `pricingStep` (boolean)
- Apos a etapa 3, em vez de chamar `generate-agent-configs`, chamar uma edge function leve `extract-services` que retorna a lista de servicos identificados
- Renderizar UI com cards para cada servico: nome (editavel), valor (input monetario), observacoes (textarea opcional)
- Campos globais: formas de pagamento (checkboxes: Pix, Cartao, Dinheiro, Boleto, etc.) e campo livre para planos/pacotes
- Ao confirmar, concatenar os dados de pricing ao `free_text` e prosseguir com a geracao

**2. `supabase/functions/extract-services/index.ts`** (nova)
- Recebe o `free_text` acumulado + links scrapeados
- Chama Gemini Flash com prompt simples: "Extraia a lista de servicos/produtos mencionados. Retorne JSON: {services: [{name, price_if_mentioned}]}"
- Retorna a lista para o frontend

**3. `supabase/functions/generate-agent-configs/index.ts`**
- O `free_text` ja vira enriquecido com a tabela de precos — nenhuma mudanca estrutural necessaria
- O meta-prompt ja instrui a usar precos informados

**4. `supabase/config.toml`**
- Adicionar entrada para `extract-services`

**5. Migracoes SQL**
- Adicionar coluna `service_prices` (jsonb) na tabela `business_profiles` para persistir os precos informados

### UI da etapa de precos

- Headline: "Identifiquei esses servicos. Pode me dizer os valores?"
- Subtitle: "Se algum servico estiver faltando, adicione abaixo"
- Cards com: nome do servico (pre-preenchido, editavel), campo de valor (R$), campo de observacao
- Secao inferior: "Formas de pagamento aceitas" (chips selecionaveis) + "Planos ou pacotes" (textarea)
- Botao "+ Adicionar servico"
- Mesmo estilo visual do onboarding atual (dark, gradiente, sem emoji)

### Ordem de implementacao

1. Criar edge function `extract-services`
2. Adicionar etapa dinamica no `OnboardingPage`
3. Migrar coluna `service_prices` no `business_profiles`
4. Atualizar `generate-agent-configs` para persistir `service_prices`

