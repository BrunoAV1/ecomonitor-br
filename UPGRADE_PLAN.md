# EcoMonitor 2.0 — plano de atualização

Este plano transforma a versão 1.0 sem alterar `main`, sem back-end próprio e sem serviços pagos.

## Fase 1 — base e contratos

- [ ] Vite, TypeScript, módulos ES, Chart.js empacotado.
- [ ] ESLint, Prettier, Vitest e Playwright configurados.
- [ ] Tipos e validação defensiva para geocoding, forecast e air quality.
- [ ] Utilitários testados para datas, unidades, WMO e AQI.

Critério de conclusão: instalação reproduzível, `typecheck`, lint, testes unitários e build executáveis.

## Fase 2 — dados confiáveis e estado

- [ ] Fuso automático/IANA e timestamps Unix.
- [ ] Condições atuais, AQI atual, próximas 24 horas e sete dias.
- [ ] `AbortController`, prevenção de respostas fora de ordem e refresh centralizado.
- [ ] Estados de loading, erro, vazio, offline e stale.
- [ ] Snapshot offline com timestamp verificável.

Critério de conclusão: testes de regressão cobrem os achados críticos e altos da auditoria.

## Fase 3 — experiência EcoMonitor 2.0

- [ ] Dashboard responsivo, semântico e acessível.
- [ ] Comboboxes independentes e completos por teclado.
- [ ] Favoritos, recentes, última cidade, unidades e temas persistidos.
- [ ] Geolocalização explicada antes da permissão.
- [ ] Comparação, inversão, limpeza e bloqueio da mesma cidade.
- [ ] Gráficos acessíveis e previsão horária/diária.

Critério de conclusão: fluxos principais funcionam sem mouse em desktop e celular.

## Fase 4 — PWA, automação e documentação

- [ ] Manifest, ícones locais, service worker e CSP.
- [ ] GitHub Actions para instalação, lint, typecheck, testes e build.
- [ ] README, arquitetura, implantação, contribuição, changelog e AGENTS.
- [ ] Captura real da aplicação em `docs/images`.

Critério de conclusão: documentação corresponde ao produto e a aplicação é instalável em contexto HTTPS.

## Fase 5 — verificação final

- [ ] Testes E2E de busca, preferência, comparação e offline.
- [ ] Verificação visual desktop e 390 px.
- [ ] Console sem erros inesperados.
- [ ] Auditoria de dependências.
- [ ] Revisão integral do diff e commits convencionais locais.

Critério de conclusão: lint, typecheck, testes unitários, E2E e build passam; limitações remanescentes estão documentadas.
