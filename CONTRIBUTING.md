# Contribuindo

## Preparação

Use Node 24 (`nvm use`, quando disponível), execute `npm ci` e instale o Chromium com `npx playwright install chromium`.

Crie uma branch curta e preserve a arquitetura sem framework ou back-end. Nunca adicione chaves, analytics ou serviços pagos.

## Padrões

- TypeScript estrito e dados externos tratados como `unknown`.
- Conteúdo externo entra no DOM somente via `textContent`/propriedades seguras.
- Toda mudança temporal deve considerar instante Unix e timezone IANA.
- Componentes interativos precisam funcionar com teclado e foco visível.
- Estados offline/stale nunca podem aparentar dados atuais.
- Dependências novas exigem justificativa e auditoria.

## Antes do commit

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm audit
```

Use commits convencionais, por exemplo `fix: align comparison points by timestamp`.
