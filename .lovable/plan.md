

## Plano: Indicador de Google Agenda na página Agenda

### O que muda

Adicionar na barra de ações do header da Agenda (ao lado de "Configurações" e "Sincronizar") um indicador do status de conexão com o Google Calendar, com ação de conectar/desconectar.

### Comportamento

- Ao carregar a página, consultar `user_settings.google_calendar_connected` do usuário
- **Se conectado**: mostrar badge verde "Google Agenda" com ícone de check. Ao clicar, opção de desconectar
- **Se desconectado**: mostrar botão "Conectar Google Agenda" que inicia o fluxo OAuth (mesma lógica do `SettingsPage`)
- O botão "Sincronizar" só aparece se o Google estiver conectado

### Alterações técnicas

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/AgendaPage.tsx` | Adicionar estado `googleConnected` + query ao `user_settings`, botão condicional de conexão/desconexão no header, e lógica de OAuth redirect (reutilizando a mesma chamada à edge function `google-calendar-auth`) |

### Visual

No header, antes dos botões existentes:

```text
[● Google Agenda ✓] [⚙ Configurações] [↻ Sincronizar] [Dia|Semana|Mês]
```

Ou se desconectado:

```text
[🔗 Conectar Google] [⚙ Configurações] [Dia|Semana|Mês]
```

O badge conectado usará `bg-accent/10 text-accent border-accent/20` com ícone `Check`. O botão desconectado usará estilo similar aos outros botões do header.

