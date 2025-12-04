# 🌿 EcoMonitor-BR

Dashboard de monitoramento climático em tempo real de **qualquer cidade** (busca global), com comparação lado a lado e qualidade do ar.

## 📋 Sobre o Projeto

**EcoMonitor-BR** é um projeto de portfólio focado em "Tech for Good", que disponibiliza dados climáticos (temperatura, umidade, vento) e **qualidade do ar (US AQI)** em tempo real, com visualização interativa e comparação entre duas cidades.

## 🎯 Objetivos

- **Sustentabilidade**: Promover consciência ambiental através da visualização de dados climáticos
- **Acessibilidade**: Interface responsiva e fácil de usar
- **Educação**: Democratizar o acesso a informações meteorológicas
- **Portfolio**: Demonstrar habilidades em Frontend e Data Visualization

## 🛠️ Stack Tecnológica

- **HTML5**: Marcação semântica e estruturada
- **CSS3**: Estilização moderna com Flexbox e Grid Layout
- **JavaScript ES6+**: Lógica de aplicação puramente vanilla (sem frameworks)
- **Chart.js**: Biblioteca de visualização de dados
- **Open-Meteo API**: Fonte de dados meteorológicos (gratuita e sem chave de API)

## 📁 Estrutura do Projeto

```
ecomonitor-br/
│
├── index.html          # Página principal
├── css/
│   └── style.css       # Estilos com tema Eco/Dark Mode
├── js/
│   └── script.js       # Lógica da aplicação (fetch, AQI, comparação)
├── assets/             # Recursos (imagens, ícones futuros)
├── README.md           # Documentação
└── .gitignore          # Itens ignorados no controle de versão
```

## 🚀 Funcionalidades

### ✅ Implementadas

- **Busca Global de Cidades**: Autocomplete via Open-Meteo Geocoding (sem chave)
- **Qualidade do Ar (US AQI)**: Cartão dedicado com semáforo de saúde (bom, moderado, ruim)
- **Modo Comparativo**: Sobreposição de duas cidades no mesmo gráfico (linhas tracejadas e badge de comparação)
- **Gráfico Interativo 24h**: Temperatura, umidade e vento com múltiplos eixos
- **Auto-atualização**: Refresh a cada 5 minutos para cidade principal e comparação
- **Design Eco Dark Mode**: Layout responsivo, animações suaves e componentes acessíveis

### 🎨 Design

- **Paleta de Cores**:
  - Verde principal: `#10b981` (Eco)
  - Fundo escuro: `#0f172a` (Dark)
  - Acentos: Laranja (temperatura), Azul (umidade), Roxo (vento)
- **Tipografia**: System fonts para melhor performance
- **Animações**: Transições suaves e micro-interações
- **Responsividade**: Breakpoints em 768px e 480px

## 📊 APIs Utilizadas

**Open-Meteo Forecast** (meteo) — `https://api.open-meteo.com/v1/forecast`
- `temperature_2m`: Temperatura a 2 metros do solo
- `relative_humidity_2m`: Umidade relativa do ar
- `wind_speed_10m`: Velocidade do vento a 10 metros

**Open-Meteo Air Quality** (air-quality) — `https://air-quality-api.open-meteo.com/v1/air-quality`
- `us_aqi`: Índice de qualidade do ar (US AQI)

**Open-Meteo Geocoding** (geocoding) — `https://geocoding-api.open-meteo.com/v1/search`
- Busca de cidades (name, latitude, longitude) — keyless

> Todas as APIs são gratuitas e **não requerem chave**.

## 🖥️ Como Executar

### Opção 1: Servidor Local Simples

1. Clone ou baixe o repositório
2. Navegue até a pasta do projeto
3. Execute um servidor HTTP local:

**Python 3**:
```bash
python -m http.server 8000
```

**Node.js (http-server)**:
```bash
npx http-server -p 8000
```

**VS Code Live Server**:
- Instale a extensão "Live Server"
- Clique com o botão direito em `index.html`
- Selecione "Open with Live Server"

4. Acesse `http://localhost:8000` no navegador

### Opção 2: Abrir Diretamente

Como o projeto usa apenas JavaScript vanilla e APIs públicas, você pode abrir o arquivo `index.html` diretamente no navegador. Porém, alguns navegadores podem bloquear requisições CORS em arquivos locais.

## 🔧 Configurações

### Intervalo de Atualização

Edite em `js/script.js`:

```javascript
const CONFIG = {
    UPDATE_INTERVAL: 300000, // 5 minutos (em milissegundos)
};
```

### Como Usar (UI)

1. **Buscar cidade principal**: digite no campo superior e escolha um resultado.
2. **Comparar (opcional)**: use o campo “Comparar com” e selecione outra cidade; linhas tracejadas aparecem no gráfico e um badge indica a cidade comparada.
3. **Limpar comparação**: clique em “Limpar comparação” para voltar ao modo simples.
4. **AQI**: o cartão “Qualidade do Ar” mostra o valor mais recente do US AQI (se disponível para a região).

## 📱 Compatibilidade

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Dispositivos móveis (iOS/Android)

## 🎓 Aprendizados

Este projeto demonstra:

1. **Consumo de APIs REST**: Fetch API com async/await
2. **Manipulação do DOM**: JavaScript vanilla moderno
3. **Data Visualization**: Integração com Chart.js
4. **CSS Grid & Flexbox**: Layout responsivo profissional
5. **ES6+ Features**: Arrow functions, destructuring, modules
6. **Best Practices**: Código limpo, comentado e organizado

## 📈 Melhorias Futuras
 
- [ ] Persistir cidade favorita e última comparação no LocalStorage
- [ ] Previsão estendida (7 dias) e cartão de tendência
- [ ] Suporte a 3+ cidades em modo comparativo
- [ ] PWA (offline para último snapshot)
- [ ] Testes unitários / e2e
- [ ] Internacionalização (i18n)
- [ ] Toggle Dark/Light

## 📄 Licença

Este projeto é open source e está disponível sob a [Licença MIT](https://opensource.org/licenses/MIT).

## 👤 Autor

**Bruno A. Vasconcellos**

- GitHub: [Bruno Vasconcellos](https://github.com/BrunoAV1)
- LinkedIn: [Bruno Vasconcellos](www.linkedin.com/in/bruno-vasconcellos-360070351)

## 🙏 Agradecimentos

- **Open-Meteo**: Pela API gratuita e confiável
- **Chart.js**: Pela excelente biblioteca de visualização
- **Comunidade Open Source**: Por inspiração e recursos

---

**Feito com 💚 para um mundo mais sustentável**
