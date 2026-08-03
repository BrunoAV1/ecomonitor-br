# Changelog

Todas as mudanças relevantes deste projeto serão registradas aqui.

## [2.0.0] - 2026-08-03

### Adicionado

- Vite, TypeScript, módulos ES, Chart.js local, ESLint, Prettier, Vitest e Playwright.
- Condições atuais completas, 24 horas, sete dias, nascer/pôr do sol e qualidade do ar detalhada.
- Busca global acessível e independente para cidade principal e comparação.
- Favoritos, recentes, última cidade, unidades, temas, geolocalização explicada e limpeza local.
- Comparação com diferenças, séries por timestamp, inversão e limpeza.
- PWA, snapshot offline explícito, estados resilientes e CSP.
- CI, auditoria, documentação técnica, implantação e captura real.

### Corrigido

- Fuso fixo de São Paulo em cidades globais.
- Uso do último AQI previsto como se fosse atual.
- Gráfico do dia civil rotulado como últimas 24 horas.
- Debounce compartilhado, requisições sem cancelamento e resultados fora de ordem.
- Interpolação de dados externos em `innerHTML`.
- Alinhamento de comparação por índice e séries com tamanhos diferentes.

## [1.0.0] - 2025

- Primeira versão do dashboard climático vanilla.
