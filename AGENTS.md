# AGENTS.md

## Escopo

Este é um dashboard climático estático em Vite + TypeScript, sem React, Vue, Angular, Tailwind ou back-end. Preserve o uso gratuito e keyless da Open-Meteo.

## Regras de implementação

- Leia `docs/ARCHITECTURE.md` e `docs/AUDIT.md` antes de alterar dados ou concorrência.
- Não use `innerHTML` com conteúdo externo.
- Valide respostas como `unknown`; mantenha timestamps Unix e timezone IANA.
- Use `AbortController` e proteção contra resposta fora de ordem em novas solicitações.
- Mantenha estados loading, error, offline e stale distinguíveis.
- Garanta teclado, labels, foco, `aria-live` e movimento reduzido.
- Não adicione dependências, segredos, deploy ou push sem justificativa/autorização.

## Verificação obrigatória

Execute `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` e, para fluxos visíveis, `npm run test:e2e`.
