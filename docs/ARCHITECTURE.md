# Arquitetura do EcoMonitor 2.0

## Visão geral

O EcoMonitor é uma aplicação estática, browser-only. Vite compila TypeScript, CSS e Chart.js em arquivos que podem ser hospedados por qualquer servidor estático. Não existe proxy, banco remoto ou chave de API.

```text
interação do usuário
        ↓
Store ─────────→ renderização semântica + Chart.js
  ↓                         ↑
serviço de dashboard ─→ normalizadores Open-Meteo
  ↓                         ↑
localStorage          fetch + AbortSignal
```

## Responsabilidades

- `src/api/client.ts`: converte erros de rede/HTTP/JSON em erros previsíveis.
- `src/api/openMeteo.ts`: constrói os parâmetros oficiais e converte `unknown` em contratos internos validados.
- `src/services/dashboard.ts`: carrega clima e ar em paralelo; clima é obrigatório e AQI degrada isoladamente.
- `src/services/storage.ts`: persiste preferências, cidades e um único snapshot versionado.
- `src/state/store.ts`: concentra transições e notifica a interface.
- `src/components/SearchCombobox.ts`: encapsula debounce, cancelamento, sequência e padrão ARIA para cada busca.
- `src/components/WeatherChart.ts`: alinha comparação por timestamp Unix, não por posição do array.
- `src/main.ts`: coordena eventos, estados, renderização textual, refresh e ciclo de vida.

## Tempo e séries

As consultas usam `timeformat=unixtime` e `timezone=auto`. Unix time representa um instante inequívoco; o timezone IANA da resposta é usado apenas na apresentação. A série horária usa `forecast_hours=24`, portanto o título “Próximas 24 horas” corresponde ao conteúdo.

Ao comparar cidades, a série secundária é indexada pelo timestamp e projetada sobre os instantes da primária. Pontos ausentes permanecem `null`, evitando deslocar horários ou inventar valores.

## Concorrência

Cada combobox possui debounce, `AbortController` e contador de sequência próprios. As cargas principal e secundária também usam controladores e sequências separados. Resultado abortado ou fora de ordem é ignorado.

O refresh automático é centralizado a cada dez minutos e só ocorre quando a aba está visível e a rede está disponível. Selecionar uma nova cidade principal não recarrega a comparação sem necessidade.

## Resiliência

O último snapshot principal é salvo junto ao horário de obtenção. Em falha, ele só é usado quando pertence à mesma localidade e sistema de unidades; a interface mostra estado `stale`, idade e botão de nova tentativa. AQI indisponível não invalida a previsão meteorológica.

O service worker cacheia navegação e recursos estáticos da própria origem. Requisições Open-Meteo não são interceptadas, evitando apresentar respostas antigas como atuais.

## Segurança

- Respostas começam como `unknown` e passam por guardas de tipo e limites geográficos.
- Strings externas são normalizadas, limitadas e inseridas com `textContent`.
- Não existe `innerHTML` com conteúdo externo.
- CSP restringe origens e proíbe objetos; Chart.js é empacotado localmente.
- Não há secrets ou armazenamento de coordenadas precisas obtidas pela geolocalização.

## Decisões conscientes

- Sem framework: o domínio é pequeno e componentes isolados atendem à complexidade.
- Sem biblioteca de schema: guardas locais mantêm o bundle e a superfície de dependências pequenos.
- Sem cache de API no service worker: o snapshot explícito fornece semântica de obsolescência mais segura.
- CSS e símbolos meteorológicos próprios: reduz dependências, tráfego e inconsistência visual.
