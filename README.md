# EcoMonitor 2.0

Um dashboard ambiental global para entender as condições de uma cidade agora, antecipar as próximas horas e comparar localidades sem perder o contexto de fuso horário.

![EcoMonitor 2.0 em execução](docs/images/ecomonitor-2.0-dashboard.png)

O EcoMonitor funciona inteiramente no navegador, usa fontes públicas e gratuitas da Open-Meteo e não exige conta, chave de API ou back-end próprio. A interface foi pensada para portfólio profissional, computadores modestos, telas pequenas e navegação sem mouse.

## Funcionalidades

- Condições atuais: temperatura, sensação, umidade, vento/direção, precipitação, condição WMO, dia/noite, horário local e atualização.
- Próximas 24 horas: resumo rolável e gráfico de temperatura/probabilidade de precipitação com período correto.
- Sete dias: mínima, máxima, precipitação, condição predominante, nascer e pôr do sol.
- Qualidade do ar: US AQI, PM2.5, PM10, classificação e recomendação ambiental não médica.
- Busca global: dois comboboxes independentes, debounce, cancelamento, prevenção de resposta fora de ordem e teclado completo.
- Comparação: diferenças resumidas, séries identificadas, inversão, limpeza e bloqueio da mesma cidade.
- Preferências: unidades métricas/imperiais e temas claro, escuro ou automático.
- Dados locais: última cidade, favoritos, recentes, limpeza e snapshot offline com aviso de desatualização.
- Localização: explicação de privacidade antes de solicitar a permissão do navegador.
- PWA: manifest, ícones, service worker e shell seguro em cache.

## Stack

- Vite 8, TypeScript 6 e módulos ES.
- HTML semântico e CSS próprio, sem framework de UI.
- Chart.js 4 empacotado localmente.
- Vitest para regressões unitárias.
- Playwright + Chromium para fluxos end-to-end em desktop e celular.
- ESLint 10 e Prettier.

## Arquitetura

```text
src/
├── api/          # HTTP, URLs e normalização das respostas Open-Meteo
├── components/   # combobox acessível e gráfico
├── services/     # composição do dashboard e persistência local
├── state/        # estado observável da aplicação
├── styles/       # sistema visual responsivo
├── types/        # contratos internos
└── utils/        # AQI, datas, unidades, guardas e códigos WMO
tests/
├── unit/         # transformações e regressões
└── e2e/          # fluxos completos com APIs determinísticas
public/           # PWA, ícones e imagem social
docs/             # auditoria, arquitetura, implantação e captura real
```

Veja [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para as decisões e o fluxo de dados.

## Instalação

Requisitos: Node.js 24 ou superior e npm 11. A versão principal está registrada em `.nvmrc`.

```bash
npm install
npm run dev
```

Abra a URL informada pelo Vite. Não abra `index.html` diretamente: módulos, service worker e CSP dependem de HTTP/HTTPS.

## Comandos

| Comando             | Função                                 |
| ------------------- | -------------------------------------- |
| `npm run dev`       | servidor de desenvolvimento            |
| `npm run typecheck` | validação TypeScript                   |
| `npm run lint`      | análise estática                       |
| `npm test`          | testes unitários                       |
| `npm run test:e2e`  | testes Playwright em desktop e celular |
| `npm run build`     | build de produção em `dist/`           |
| `npm run preview`   | prévia local do build                  |
| `npm run check`     | lint, tipos, unitários e build         |

Na primeira execução dos E2E, instale o navegador:

```bash
npx playwright install chromium
```

## Fontes dos dados

- [Open-Meteo Weather Forecast](https://open-meteo.com/en/docs): clima atual, série horária e previsão diária.
- [Open-Meteo Air Quality](https://open-meteo.com/en/docs/air-quality-api): US AQI, PM2.5 e PM10 modelados.
- [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api): busca global baseada em GeoNames.

Os timestamps chegam como Unix time e são formatados no fuso IANA retornado para a coordenada. Dados meteorológicos e de qualidade do ar são resultados de modelos/grades; não são sensores locais em tempo real.

## Privacidade e segurança

- Não existem cookies de rastreamento, analytics, contas, chaves ou segredos.
- Preferências e snapshots ficam apenas no `localStorage` do dispositivo e podem ser removidos pela interface.
- A localização é solicitada somente depois de uma explicação; coordenadas precisas dessa ação não são salvas como cidade recente.
- Dados externos são validados e inseridos no DOM com `textContent`, nunca interpolados em `innerHTML`.
- A CSP limita scripts, imagens, workers e conexões às origens necessárias. Em produção, prefira também enviar a política como header HTTP.

## Acessibilidade

A interface oferece landmark semântico, link de salto, labels, status `aria-live`, foco visível, combobox/listbox conforme ARIA, setas/Enter/Escape, nomes acessíveis, contraste nos dois temas e `prefers-reduced-motion`. O gráfico possui alternativa nominal e os dados essenciais também existem em texto.

## Limitações

- AQI é previsão modelada em grade; a resolução e cobertura variam por região.
- Sem back-end, limites ou indisponibilidade da Open-Meteo afetam diretamente novas consultas.
- O snapshot offline representa apenas a última cidade principal e é sempre marcado como desatualizado.
- O service worker não armazena respostas das APIs; apenas o shell estático seguro é cacheado.
- A ação de localização não executa geocodificação reversa, portanto a cidade é mostrada como “Localização atual”.
- PWA e geolocalização exigem HTTPS em produção (localhost é permitido no desenvolvimento).

## Publicação

O projeto gera arquivos estáticos em `dist/` e usa caminhos relativos, funcionando na Vercel e no GitHub Pages. Consulte [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Roadmap

- Internacionalização completa além de pt-BR.
- Alertas meteorológicos oficiais quando existir uma fonte global gratuita e compatível.
- Testes automatizados de contraste com uma ferramenta dedicada.
- Opção explícita de exportar preferências e cidades salvas.

## Documentação do projeto

- [Auditoria da v1.0](docs/AUDIT.md)
- [Plano da migração](UPGRADE_PLAN.md)
- [Arquitetura](docs/ARCHITECTURE.md)
- [Implantação](docs/DEPLOYMENT.md)
- [Como contribuir](CONTRIBUTING.md)
- [Histórico de mudanças](CHANGELOG.md)

## Autoria e licença

Criado por **Bruno Araujo de Vasconcellos**. Distribuído sob a licença MIT.
