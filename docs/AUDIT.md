# Auditoria técnica — EcoMonitor-BR v1.0

Data da auditoria: 3 de agosto de 2026  
Commit auditado: `fabc300` (`ecomonitor - v1.0`)  
Escopo: todos os quatro arquivos rastreados, histórico Git, execução local em desktop e viewport móvel, console e chamadas às APIs públicas.

## Método e evidências

- O histórico contém um único commit e a árvore inicial estava limpa.
- A aplicação foi servida por HTTP local e aberta no navegador em uma viewport desktop e em 390 × 844 px.
- O carregamento inicial concluiu e exibiu dados de São Paulo; o console mostrou apenas a mensagem de inicialização.
- Duas buscas foram disparadas quase simultaneamente (`Lisboa` na principal e `Porto` na comparação). Apenas a busca de comparação foi executada, confirmando interferência entre os debounces.
- A documentação oficial atual da Open-Meteo foi confrontada com os parâmetros e formatos usados no código.

## Achados

| ID | Severidade | Problema confirmado | Evidência | Correção proposta |
| --- | --- | --- | --- | --- |
| AUD-01 | Crítica | Dados globais são consultados no fuso de São Paulo. | `CONFIG.TIMEZONE` é `America/Sao_Paulo` e é enviado para qualquer coordenada em `js/script.js:13,146`. | Usar `timezone=auto`, preservar o IANA timezone retornado e trabalhar internamente com timestamps Unix/instantes. |
| AUD-02 | Alta | O AQI exibido não é o atual. | A série começa às 00:00 e o código usa `aqiSeries[aqiSeries.length - 1]` em `js/script.js:125-126`, ou seja, normalmente o último horário previsto do dia. | Solicitar `current=us_aqi,pm2_5,pm10` e validar o timestamp; manter fallback por vizinho temporal somente quando necessário. |
| AUD-03 | Alta | O gráfico não representa “Últimas 24 Horas”. | A API usa `forecast_days=1`, cuja série começa à meia-noite, e o título afirma “Últimas 24 Horas” em `index.html:143`. | Solicitar `forecast_hours=24` e rotular explicitamente “Próximas 24 horas”. |
| AUD-04 | Alta | Buscas principal e de comparação se cancelam. | Ambas usam `searchTimeout` (`js/script.js:36,624-635,649-658`). No navegador, `Lisboa` desapareceu quando `Porto` foi digitado logo depois. | Criar controladores de debounce e `AbortController` independentes por combobox. |
| AUD-05 | Alta | Respostas antigas podem sobrescrever seleções novas. | Nenhuma busca ou carga de clima é cancelada e não há token/identificador de requisição (`js/script.js:70-163,557-609`). | Cancelar solicitações anteriores e aplicar resultados somente se o request ainda for o ativo. |
| AUD-06 | Alta | Conteúdo externo é injetado como HTML. | Nomes e divisões retornados pela API entram em template string e `innerHTML` (`js/script.js:474-495`). | Construir elementos com `createElement` e preencher exclusivamente com `textContent`. |
| AUD-07 | Alta | Respostas externas não são validadas. | Objetos são usados diretamente e valores são arredondados sem checagem (`js/script.js:156-157,173-183,571-577`). | Adicionar validadores/normalizadores TypeScript, limites numéricos e tratamento para séries desalinhadas/nulos. |
| AUD-08 | Alta | Comparação pode alinhar instantes diferentes pelo índice. | O código apenas corta arrays ao menor tamanho (`js/script.js:207-220`); timestamps da segunda cidade não determinam o alinhamento. | Fazer join das séries por timestamp Unix e representar ausências como `null`. |
| AUD-09 | Média | A atualização automática pode duplicar chamadas e renderizações. | Alterar a cidade principal recarrega a comparação sem necessidade (`js/script.js:676-682`); o timer dispara duas atualizações autônomas (`js/script.js:771-775`). | Centralizar refresh em um serviço que carrega somente snapshots necessários e renderiza uma vez. |
| AUD-10 | Média | Erros de AQI são indistinguíveis de ausência de dados. | Qualquer falha retorna `null` (`js/script.js:127-129`), levando a “Sem dados”. | Distinguir indisponibilidade, timeout, limite e ausência legítima; oferecer tentar novamente. |
| AUD-11 | Média | Estado de loading e erro é parcial. | Apenas o painel recebe uma classe; cartões permanecem com dados antigos sem marcação e a cor do status é alterada por estilo inline temporário. | Criar estados explícitos `loading`, `ready`, `stale`, `empty`, `offline` e `error`, com `aria-live`. |
| AUD-12 | Alta | Busca não é acessível por teclado como combobox. | Resultados são `div` clicáveis, sem `role=combobox/listbox/option`, `aria-expanded`, `aria-activedescendant` ou navegação por setas (`index.html:45-55`; `js/script.js:482-500`). | Implementar padrão ARIA combobox, setas, Enter, Escape, foco visível e opção ativa. |
| AUD-13 | Média | Botões dependem de emojis/título para nome. | Botões de busca contêm apenas símbolos (`index.html:52-54,71-73`). | Usar SVG decorativo com `aria-hidden` e rótulos acessíveis explícitos. |
| AUD-14 | Média | Falta respeito a movimento reduzido. | O CSS contém animações/transições sem regra global de `prefers-reduced-motion`. | Desativar animações e suavização quando o usuário solicitar movimento reduzido. |
| AUD-15 | Média | Dependência de produção vem de CDN sem integridade e impede CSP estrita. | Chart.js é carregado de jsDelivr sem SRI (`index.html:17-18`). | Empacotar Chart.js via npm/Vite e adicionar CSP compatível. |
| AUD-16 | Média | Não existe modo offline nem indicação de desatualização. | Sem manifest, service worker ou cache de snapshot. | Implementar PWA, shell cacheado e último snapshot com timestamp/aviso de stale. |
| AUD-17 | Média | Geolocalização, preferências, favoritos, recentes, unidades e tema não existem. | Não há uso de `navigator.geolocation` ou `localStorage`. | Implementar armazenamento versionado e controles com limpeza total. |
| AUD-18 | Baixa | Código e documentação divergem. | README afirma módulos ES, acessibilidade e “tempo real”; o script é clássico, faltam padrões ARIA e os dados são previsão modelada. A estrutura documenta `assets/` inexistente. | Reescrever README com comportamento verificável e limitações explícitas. |
| AUD-19 | Baixa | Metadados estão incorretos/desatualizados. | Descrição restringe o produto a capitais brasileiras, autor é apenas “Bruno”, favicon é data URI com emoji e rodapé usa 2025 (`index.html:6-12,166`). | Atualizar metadados, autoria, favicon local, Open Graph, manifest e ano. |
| AUD-20 | Baixa | Código morto e estado redundante aumentam confusão. | `currentCity` só serve para selecionar o fallback; `cityName` em `handleSearchResultClick` não é usado; cidades Rio/Manaus nunca são expostas. | Remover estado morto e modelar `Location` de forma única. |

## Comportamento responsivo observado

A versão inicial não apresentou overflow horizontal em 390 × 844 px e os controles se empilharam. Isso deve ser preservado. Entretanto, o dropdown longo ocupa grande parte da tela e não oferece opção ativa, contagem, fechamento acessível nem semântica assistiva.

## Segurança e privacidade

Não foram encontradas chaves ou segredos. A aplicação envia apenas coordenadas para Open-Meteo, mas a geolocalização ainda não existia. O principal risco confirmado é XSS por interpolação de dados externos em `innerHTML`. A nova versão deve explicar o uso da localização antes do prompt do navegador, limitar conexões via CSP e não registrar coordenadas em produção.

## Conclusão

A proposta original é válida e o layout legado funciona em largura móvel, mas os erros temporais tornam parte dos dados enganosa em cidades fora de São Paulo e no cartão de AQI. A migração deve priorizar normalização temporal, validação de contratos, cancelamento de concorrência e estados resilientes antes do acabamento visual.
