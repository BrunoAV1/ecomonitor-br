# EcoMonitor 2.0 — plano de atualização

Este plano transforma a versão 1.0 sem alterar `main`, sem back-end próprio e sem serviços pagos.

## Fase 1 — base e contratos

- [x] Vite, TypeScript, módulos ES, Chart.js empacotado.
- [x] ESLint, Prettier, Vitest e Playwright configurados.
- [x] Tipos e validação defensiva para geocoding, forecast e air quality.
- [x] Utilitários testados para datas, unidades, WMO e AQI.

Critério de conclusão: instalação reproduzível, `typecheck`, lint, testes unitários e build executáveis.

## Fase 2 — dados confiáveis e estado

- [x] Fuso automático/IANA e timestamps Unix.
- [x] Condições atuais, AQI atual, próximas 24 horas e sete dias.
- [x] `AbortController`, prevenção de respostas fora de ordem e refresh centralizado.
- [x] Estados de loading, erro, vazio, offline e stale.
- [x] Snapshot offline com timestamp verificável.

Critério de conclusão: testes de regressão cobrem os achados críticos e altos da auditoria.

## Fase 3 — experiência EcoMonitor 2.0

- [x] Dashboard responsivo, semântico e acessível.
- [x] Comboboxes independentes e completos por teclado.
- [x] Favoritos, recentes, última cidade, unidades e temas persistidos.
- [x] Geolocalização explicada antes da permissão.
- [x] Comparação, inversão, limpeza e bloqueio da mesma cidade.
- [x] Gráficos acessíveis e previsão horária/diária.

Critério de conclusão: fluxos principais funcionam sem mouse em desktop e celular.

## Fase 4 — PWA, automação e documentação

- [x] Manifest, ícones locais, service worker e CSP.
- [x] GitHub Actions para instalação, lint, typecheck, testes e build.
- [x] README, arquitetura, implantação, contribuição, changelog e AGENTS.
- [x] Captura real da aplicação em `docs/images`.

Critério de conclusão: documentação corresponde ao produto e a aplicação é instalável em contexto HTTPS.

## Fase 5 — verificação final

- [x] Testes E2E de busca, preferência, comparação e offline.
- [x] Verificação visual desktop e 390 px.
- [x] Console sem erros inesperados.
- [x] Auditoria de dependências.
- [x] Revisão integral do diff e commits convencionais locais.

Critério de conclusão: lint, typecheck, testes unitários, E2E e build passam; limitações remanescentes estão documentadas.
