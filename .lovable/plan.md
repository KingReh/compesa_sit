# Sugestão de novo recurso: **Central de Notificações + Command Palette**

Foco: **Experiência do Usuário** • Esforço: **Novo recurso médio**

Dois módulos complementares que trabalham juntos para reduzir cliques, dar visibilidade proativa de eventos importantes e acelerar a navegação — sem alterar regras de negócio existentes.

---

## 1. Central de Notificações (sino no cabeçalho)

Um painel unificado, acessível pelo ícone de sino no header (ao lado do botão "Sair"), que agrega em tempo real eventos relevantes derivados dos dados já carregados na sessão.

### Tipos de notificações (geradas automaticamente a partir do estado atual)

- 🎂 **Aniversariantes** (hoje e da semana) — consolidando o mesmo cálculo já feito pelo `BirthdayToasts`.
- 🏖️ **Férias começando nos próximos 7 dias** — a partir de `vacationPlansService`.
- ⚠️ **Impacto de cobertura** — alerta quando um mês tem mais de X% do efetivo de uma coordenação em férias no mesmo período.
- 📄 **Cadastros incompletos** — funcionários sem `telefone`, `foto` ou `dataNascimento` preenchidos.
- 🚗 **Condutores** — quando alguém for marcado como "autorizado a dirigir" e faltarem dados obrigatórios.
- 🆕 **Novidades do sistema** — mensagens estáticas versionadas (changelog leve).

### Comportamento

- Badge com contador de não lidas no sino.
- Painel dropdown ancorado (largura ~380px desktop / full-width mobile) com filtro por tipo.
- Cada item tem: ícone, título, descrição curta, timestamp relativo (“hoje”, “em 2 dias”) e uma **ação primária** (ex: “Ver funcionário”, “Abrir cronograma”).
- Estado "lida/não lida" persistido em `localStorage` (`@sit:notifications:read`).
- Botão "Marcar todas como lidas" e "Silenciar até amanhã".
- Respeita `prefers-reduced-motion` e safe-area no mobile.

---

## 2. Command Palette (⌘K / Ctrl+K)

Barra de comandos global inspirada em ferramentas modernas (Linear, Raycast, GitHub), acionada por atalho de teclado ou por um botão discreto no header.

### Capacidades

- **Navegação instantânea**: “Ir para Painel”, “Ir para Férias”, “Ir para Relatórios”, “Ir para Configuração”.
- **Busca global de funcionários** por nome, matrícula ou CPF, abrindo direto o `ViewModal`.
- **Busca de empresas, contratos, unidades e coordenações** com ação de abrir na aba correspondente do `RegistrationPanel`.
- **Ações rápidas**: “Cadastrar novo funcionário”, “Exportar relatório XLSX”, “Ver condutores credenciados”, “Sair do sistema”.
- **Histórico** dos últimos 5 comandos usados (persistido em `localStorage`).

### UX

- Atalho `Ctrl/⌘ + K` global; `Esc` fecha; setas navegam; `Enter` executa.
- Resultados agrupados por seção (Navegação · Pessoas · Empresas · Ações).
- Modal centralizado com backdrop `blur`, focus trap e ARIA (`role="dialog"`).
- Dica visual "⌘K" no header ao lado da busca existente.

---

## Detalhes técnicos

```text
src/components/
├── NotificationCenter/
│   ├── NotificationCenter.tsx      # botão-sino + dropdown
│   ├── useNotifications.ts         # deriva itens de employees/vacations
│   ├── NotificationItem.tsx
│   └── notificationStore.ts        # read/unread em localStorage
└── CommandPalette/
    ├── CommandPalette.tsx          # modal + input + lista
    ├── useCommandItems.ts          # gera itens a partir do estado do App
    └── useHotkey.ts                # registra ⌘K globalmente
```

Integrações no `App.tsx`:

- Injetar `NotificationCenter` no header (perto do botão "Sair").
- Montar `CommandPalette` em nível de app; expor callbacks já existentes (`setCurrentView`, `handleOpenNew`, `setIsDriversModalOpen`, `handleView`) para as ações.
- Reaproveitar `parseLocalDate`, `formatEmployeeName` e `vacationPlansService` já presentes.

Estilo:
- Usar as classes/tokens existentes (`sit-panel`, `sit-panel-inner`, `brand-accent`, `brand-muted`) — sem introduzir novo design system.
- Animações leves com `motion/react` (já instalado).

Acessibilidade:
- Sino e trigger do palette com `aria-label` e `aria-expanded`.
- Focus trap, `Esc` para fechar, navegação por teclado completa.
- Anúncio via `aria-live="polite"` quando novas notificações aparecerem.

Sem alterações de backend, sem novas dependências, sem mudanças em serviços.

---

## Entregáveis

1. Central de Notificações funcional no header, com pelo menos 4 tipos de notificação derivadas do estado atual.
2. Command Palette global com navegação, busca de pessoas e ações rápidas.
3. Persistência local de leitura e histórico.
4. Documentação curta no topo dos arquivos principais explicando a origem dos dados.

Se preferir, posso implementar **apenas a Central de Notificações** primeiro (menor risco/tempo) e o Command Palette num segundo passo — é só me avisar.
