import './styles/main.css';
import { searchLocations } from './api/openMeteo';
import { SearchCombobox } from './components/SearchCombobox';
import { WeatherChart } from './components/WeatherChart';
import { loadDashboard } from './services/dashboard';
import { storage } from './services/storage';
import { DEFAULT_LOCATION, Store } from './state/store';
import type { AppState, DashboardSnapshot, Location, ThemePreference } from './types/weather';
import { classifyAqi } from './utils/aqi';
import { ageInMinutes, formatFullDate, formatLocalTime, formatWeekday } from './utils/date';
import { compassDirection, formatMeasurement } from './utils/units';
import { describeWeatherCode } from './utils/weatherCodes';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Elemento raiz não encontrado.');

app.innerHTML = `
  <header class="topbar">
    <a class="brand" href="#visao-geral" aria-label="EcoMonitor 2.0 — início">
      <span class="brand-mark" aria-hidden="true"><i></i><b></b></span>
      <span><strong>EcoMonitor</strong><small>inteligência climática local</small></span>
    </a>
    <nav class="top-actions" aria-label="Ações rápidas">
      <button id="location-button" class="icon-button" type="button" aria-label="Usar minha localização">
        <span class="locator-icon" aria-hidden="true"></span>
      </button>
      <details class="settings">
        <summary class="icon-button" aria-label="Abrir preferências"><span class="settings-icon" aria-hidden="true"></span></summary>
        <div class="settings-panel">
          <label for="units-select">Unidades</label>
          <select id="units-select"><option value="metric">Métricas</option><option value="imperial">Imperiais</option></select>
          <label for="theme-select">Tema</label>
          <select id="theme-select"><option value="auto">Automático</option><option value="dark">Escuro</option><option value="light">Claro</option></select>
          <button id="clear-data-button" class="text-button danger" type="button">Remover dados locais</button>
        </div>
      </details>
    </nav>
  </header>

  <main id="conteudo">
    <section class="search-deck" aria-label="Escolha de cidades">
      <div class="search-field">
        <label for="primary-search">Cidade observada</label>
        <div class="combobox-shell">
          <span class="search-icon" aria-hidden="true"></span>
          <input id="primary-search" type="search" autocomplete="off" placeholder="Busque qualquer cidade" />
          <button id="primary-search-button" type="button" aria-label="Buscar cidade">Buscar</button>
          <ul id="primary-results" class="search-results" hidden></ul>
        </div>
      </div>
      <div class="search-field search-field--compare">
        <label for="compare-search">Comparar com</label>
        <div class="combobox-shell">
          <span class="compare-icon" aria-hidden="true"></span>
          <input id="compare-search" type="search" autocomplete="off" placeholder="Adicione uma segunda cidade" />
          <button id="compare-search-button" type="button" aria-label="Buscar cidade para comparar">Comparar</button>
          <ul id="compare-results" class="search-results" hidden></ul>
        </div>
      </div>
    </section>

    <div id="system-banner" class="system-banner" role="status" aria-live="polite" hidden>
      <span id="system-message"></span>
      <button id="retry-button" type="button">Tentar novamente</button>
    </div>

    <section id="visao-geral" class="hero-card" aria-labelledby="city-name">
      <div class="hero-map" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="hero-main">
        <p class="eyebrow"><span id="day-night-dot"></span><span id="local-context">Condições locais</span></p>
        <div class="city-line">
          <div>
            <h1 id="city-name">São Paulo</h1>
            <p id="city-region">São Paulo · Brasil</p>
          </div>
          <button id="favorite-button" class="favorite-button" type="button" aria-label="Adicionar cidade aos favoritos" aria-pressed="false"><span aria-hidden="true">+</span> Favoritar</button>
        </div>
        <div class="current-grid">
          <div class="temperature-lockup"><span id="current-temperature">—</span><small id="temperature-unit">°C</small></div>
          <div class="condition-lockup">
            <div id="weather-symbol" class="weather-symbol" data-tone="cloud" aria-hidden="true"><span></span></div>
            <div><strong id="weather-description">Carregando condições</strong><span id="feels-like">Sensação —</span></div>
          </div>
        </div>
        <p id="local-time" class="local-time">Horário local —</p>
      </div>
      <dl class="metric-grid">
        <div><dt>Umidade</dt><dd id="humidity">—</dd><span class="meter"><i id="humidity-meter"></i></span></div>
        <div><dt>Vento</dt><dd id="wind">—</dd><small id="wind-direction">—</small></div>
        <div><dt>Precipitação</dt><dd id="precipitation">—</dd><small>na última hora</small></div>
        <div><dt>Atualização</dt><dd id="last-update">—</dd><small id="data-age">aguardando dados</small></div>
      </dl>
    </section>

    <section class="dashboard-grid" aria-label="Previsão e qualidade ambiental">
      <article class="panel forecast-panel">
        <div class="panel-heading"><div><p class="eyebrow">Linha do tempo</p><h2>Próximas 24 horas</h2></div><span class="period-tag">horário local</span></div>
        <div id="hourly-strip" class="hourly-strip" aria-label="Resumo das próximas horas"></div>
        <div class="chart-shell"><canvas id="weather-chart" role="img" aria-label="Gráfico de temperatura e probabilidade de precipitação nas próximas 24 horas"></canvas></div>
      </article>

      <aside id="air-panel" class="panel air-panel" data-level="missing" aria-labelledby="air-heading">
        <div class="panel-heading"><div><p class="eyebrow">Saúde ambiental</p><h2 id="air-heading">Qualidade do ar</h2></div><span class="air-pulse" aria-hidden="true"></span></div>
        <div class="aqi-lockup"><span>US AQI</span><strong id="aqi-value">—</strong></div>
        <p id="aqi-label" class="aqi-label">Aguardando dados</p>
        <dl class="particle-grid"><div><dt>PM2.5</dt><dd id="pm25">—</dd></div><div><dt>PM10</dt><dd id="pm10">—</dd></div></dl>
        <p id="aqi-guidance" class="guidance">Informação ambiental geral; não substitui orientação médica.</p>
      </aside>
    </section>

    <section class="panel week-panel" aria-labelledby="week-heading">
      <div class="panel-heading"><div><p class="eyebrow">Panorama</p><h2 id="week-heading">Próximos sete dias</h2></div><span id="full-date" class="period-tag"></span></div>
      <div id="daily-forecast" class="daily-forecast"></div>
    </section>

    <section id="comparison-panel" class="panel comparison-panel" aria-labelledby="comparison-heading" hidden>
      <div class="panel-heading">
        <div><p class="eyebrow">Leitura lado a lado</p><h2 id="comparison-heading">Comparação</h2></div>
        <div class="button-row"><button id="swap-button" class="text-button" type="button">Inverter cidades</button><button id="clear-comparison-button" class="text-button" type="button">Limpar</button></div>
      </div>
      <div class="comparison-names"><strong id="primary-compare-name"></strong><span>versus</span><strong id="secondary-compare-name"></strong></div>
      <dl class="difference-grid"><div><dt>Temperatura</dt><dd id="temperature-difference"></dd></div><div><dt>Umidade</dt><dd id="humidity-difference"></dd></div><div><dt>US AQI</dt><dd id="aqi-difference"></dd></div></dl>
    </section>

    <section class="saved-grid" aria-label="Cidades salvas e recentes">
      <article class="panel compact-panel"><div class="panel-heading"><h2>Favoritas</h2><span id="favorites-count" class="count-badge">0</span></div><div id="favorites-list" class="location-chips"><p class="empty-copy">Suas cidades favoritas aparecerão aqui.</p></div></article>
      <article class="panel compact-panel"><div class="panel-heading"><h2>Recentes</h2></div><div id="recent-list" class="location-chips"><p class="empty-copy">As últimas buscas aparecerão aqui.</p></div></article>
    </section>
  </main>

  <footer><p>Dados meteorológicos e ambientais por <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a>.</p><p>© 2026 Bruno Araujo de Vasconcellos</p></footer>

  <dialog id="location-dialog">
    <form method="dialog">
      <p class="eyebrow">Privacidade em primeiro lugar</p>
      <h2>Usar sua localização atual?</h2>
      <p>O navegador fornecerá as coordenadas somente após sua permissão. Elas serão enviadas à Open-Meteo para consultar o clima e não serão salvas como cidade recente.</p>
      <div class="dialog-actions"><button class="text-button" value="cancel">Agora não</button><button id="confirm-location-button" class="primary-button" value="default">Entendi, usar localização</button></div>
    </form>
  </dialog>
`;

function element<T extends HTMLElement>(id: string): T {
  const value = document.getElementById(id);
  if (!(value instanceof HTMLElement)) throw new Error(`Elemento #${id} não encontrado.`);
  return value as T;
}

const store = new Store();
const chart = new WeatherChart(element<HTMLCanvasElement>('weather-chart'));
let primaryRequest: AbortController | null = null;
let comparisonRequest: AbortController | null = null;
let primarySequence = 0;
let comparisonSequence = 0;

const themeMedia = window.matchMedia('(prefers-color-scheme: dark)');

function applyTheme(theme: ThemePreference): void {
  const resolved = theme === 'auto' ? (themeMedia.matches ? 'dark' : 'light') : theme;
  document.documentElement.dataset.theme = resolved;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', resolved === 'dark' ? '#0b1414' : '#eef4f1');
}

function setText(id: string, value: string): void {
  element(id).textContent = value;
}

function renderSnapshot(snapshot: DashboardSnapshot): void {
  const { current, location, units } = snapshot;
  const weather = describeWeatherCode(current.weatherCode);
  setText('city-name', location.name);
  setText('city-region', [location.admin1, location.country].filter(Boolean).join(' · '));
  setText('current-temperature', Math.round(current.temperature).toLocaleString('pt-BR'));
  setText('temperature-unit', units.temperature);
  setText('weather-description', weather.label);
  setText(
    'feels-like',
    `Sensação ${formatMeasurement(current.apparentTemperature, units.temperature)}`,
  );
  setText('local-context', current.isDay ? 'Condições locais · dia' : 'Condições locais · noite');
  element('day-night-dot').classList.toggle('is-night', !current.isDay);
  element('weather-symbol').dataset.tone = weather.tone;
  setText(
    'local-time',
    `${formatFullDate(current.time, location.timezone)} · ${formatLocalTime(current.time, location.timezone)}`,
  );
  setText('humidity', `${Math.round(current.humidity)}%`);
  element<HTMLElement>('humidity-meter').style.width =
    `${Math.min(100, Math.max(0, current.humidity))}%`;
  setText('wind', formatMeasurement(current.windSpeed, units.windSpeed));
  setText(
    'wind-direction',
    `${compassDirection(current.windDirection)} · ${Math.round(current.windDirection)}°`,
  );
  setText('precipitation', formatMeasurement(current.precipitation, units.precipitation, 1));
  setText('last-update', formatLocalTime(snapshot.fetchedAt / 1000, location.timezone));
  setText('data-age', 'dados atualizados agora');
  setText('full-date', formatFullDate(current.time, location.timezone));
  renderHourly(snapshot);
  renderDaily(snapshot);
  renderAirQuality(snapshot);
}

function renderHourly(snapshot: DashboardSnapshot): void {
  const fragment = document.createDocumentFragment();
  snapshot.hourly.slice(0, 8).forEach((point, index) => {
    const item = document.createElement('div');
    item.className = 'hour-item';
    if (index === 0) item.classList.add('is-current');
    const time = document.createElement('time');
    time.textContent =
      index === 0 ? 'Agora' : formatLocalTime(point.time, snapshot.location.timezone);
    const symbol = document.createElement('span');
    symbol.className = 'mini-weather';
    symbol.dataset.tone = describeWeatherCode(point.weatherCode).tone;
    symbol.setAttribute('aria-label', describeWeatherCode(point.weatherCode).label);
    const temperature = document.createElement('strong');
    temperature.textContent = formatMeasurement(point.temperature, snapshot.units.temperature);
    const rain = document.createElement('small');
    rain.textContent =
      point.precipitationProbability === null
        ? '—'
        : `${Math.round(point.precipitationProbability)}% chuva`;
    item.append(time, symbol, temperature, rain);
    fragment.append(item);
  });
  element('hourly-strip').replaceChildren(fragment);
}

function renderDaily(snapshot: DashboardSnapshot): void {
  const fragment = document.createDocumentFragment();
  snapshot.daily.slice(0, 7).forEach((day, index) => {
    const item = document.createElement('article');
    item.className = 'day-card';
    const dayName = document.createElement('h3');
    dayName.textContent =
      index === 0 ? 'Hoje' : formatWeekday(day.time, snapshot.location.timezone);
    const condition = document.createElement('span');
    condition.className = 'mini-weather large';
    condition.dataset.tone = describeWeatherCode(day.weatherCode).tone;
    condition.setAttribute('aria-label', describeWeatherCode(day.weatherCode).label);
    const temperatures = document.createElement('p');
    temperatures.textContent = `${formatMeasurement(day.temperatureMax, snapshot.units.temperature)} / ${formatMeasurement(day.temperatureMin, snapshot.units.temperature)}`;
    const rain = document.createElement('small');
    rain.textContent = `${formatMeasurement(day.precipitation, snapshot.units.precipitation, 1)} chuva`;
    const sun = document.createElement('small');
    sun.textContent =
      day.sunrise === null || day.sunset === null
        ? 'Sol: sem dados'
        : `Sol ${formatLocalTime(day.sunrise, snapshot.location.timezone)}–${formatLocalTime(day.sunset, snapshot.location.timezone)}`;
    item.append(dayName, condition, temperatures, rain, sun);
    fragment.append(item);
  });
  element('daily-forecast').replaceChildren(fragment);
}

function renderAirQuality(snapshot: DashboardSnapshot): void {
  const { airQuality } = snapshot;
  const guidance = classifyAqi(airQuality.usAqi);
  const panel = element('air-panel');
  panel.dataset.level = guidance?.level ?? 'missing';
  setText('aqi-value', airQuality.usAqi === null ? '—' : String(Math.round(airQuality.usAqi)));
  setText('pm25', formatMeasurement(airQuality.pm25, 'µg/m³', 1));
  setText('pm10', formatMeasurement(airQuality.pm10, 'µg/m³', 1));
  if (airQuality.availability === 'unavailable') {
    setText('aqi-label', 'Fonte temporariamente indisponível');
    setText('aqi-guidance', 'Os dados climáticos continuam válidos. Tente atualizar mais tarde.');
  } else if (!guidance) {
    setText('aqi-label', 'Sem dados para esta área');
    setText('aqi-guidance', 'A cobertura de qualidade do ar varia conforme a região.');
  } else {
    setText('aqi-label', guidance.label);
    setText(
      'aqi-guidance',
      `${guidance.recommendation} Informação geral, não aconselhamento médico.`,
    );
  }
}

function renderComparison(state: AppState): void {
  const panel = element('comparison-panel');
  const primary = state.primarySnapshot;
  const secondary = state.comparisonSnapshot;
  panel.hidden = !(state.comparisonLocation || secondary);
  if (!primary || !secondary) return;
  setText('primary-compare-name', primary.location.name);
  setText('secondary-compare-name', secondary.location.name);
  const tempDiff = secondary.current.temperature - primary.current.temperature;
  const humidityDiff = secondary.current.humidity - primary.current.humidity;
  const aqiDiff =
    secondary.airQuality.usAqi === null || primary.airQuality.usAqi === null
      ? null
      : secondary.airQuality.usAqi - primary.airQuality.usAqi;
  setText(
    'temperature-difference',
    `${secondary.location.name}: ${tempDiff >= 0 ? '+' : ''}${tempDiff.toFixed(1)} ${primary.units.temperature}`,
  );
  setText(
    'humidity-difference',
    `${secondary.location.name}: ${humidityDiff >= 0 ? '+' : ''}${Math.round(humidityDiff)} p.p.`,
  );
  setText(
    'aqi-difference',
    aqiDiff === null
      ? 'Sem dados comparáveis'
      : `${secondary.location.name}: ${aqiDiff >= 0 ? '+' : ''}${Math.round(aqiDiff)} pontos`,
  );
}

function renderLocationList(id: string, locations: Location[], emptyMessage: string): void {
  const container = element(id);
  if (locations.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-copy';
    empty.textContent = emptyMessage;
    container.replaceChildren(empty);
    return;
  }
  const fragment = document.createDocumentFragment();
  locations.forEach((location) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'location-chip';
    button.textContent = `${location.name}${location.country ? ` · ${location.country}` : ''}`;
    button.addEventListener('click', () => {
      store.selectPrimary(location);
      void refreshPrimary();
    });
    fragment.append(button);
  });
  container.replaceChildren(fragment);
}

function render(state: AppState): void {
  applyTheme(state.preferences.theme);
  element<HTMLSelectElement>('units-select').value = state.preferences.units;
  element<HTMLSelectElement>('theme-select').value = state.preferences.theme;
  if (state.primarySnapshot) renderSnapshot(state.primarySnapshot);
  const favorite = state.favorites.some((item) => item.id === state.primaryLocation.id);
  const favoriteButton = element<HTMLButtonElement>('favorite-button');
  favoriteButton.setAttribute('aria-pressed', String(favorite));
  favoriteButton.setAttribute(
    'aria-label',
    favorite ? 'Remover cidade dos favoritos' : 'Adicionar cidade aos favoritos',
  );
  favoriteButton.lastChild?.replaceWith(
    document.createTextNode(favorite ? ' Remover favorito' : ' Favoritar'),
  );
  setText('favorites-count', String(state.favorites.length));
  renderLocationList('favorites-list', state.favorites, 'Suas cidades favoritas aparecerão aqui.');
  renderLocationList('recent-list', state.recent, 'As últimas buscas aparecerão aqui.');
  renderComparison(state);
  if (state.primarySnapshot) chart.render(state.primarySnapshot, state.comparisonSnapshot);
  const banner = element('system-banner');
  banner.hidden = !state.message;
  setText('system-message', state.message);
  banner.dataset.status = state.status;
  element<HTMLButtonElement>('retry-button').hidden =
    state.status !== 'error' && state.status !== 'stale';
}

async function refreshPrimary(): Promise<void> {
  primaryRequest?.abort();
  const request = new AbortController();
  primaryRequest = request;
  const sequence = ++primarySequence;
  const state = store.get();
  store.update({ status: 'loading', message: `Atualizando ${state.primaryLocation.name}…` });
  try {
    const snapshot = await loadDashboard(
      state.primaryLocation,
      state.preferences.units,
      request.signal,
    );
    if (sequence !== primarySequence || request.signal.aborted) return;
    storage.saveSnapshot(snapshot);
    store.update({
      primaryLocation: snapshot.location,
      primarySnapshot: snapshot,
      status: 'ready',
      message: '',
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return;
    const cached = storage.snapshot();
    if (
      cached &&
      cached.location.id === state.primaryLocation.id &&
      cached.units.temperature === (state.preferences.units === 'metric' ? '°C' : '°F')
    ) {
      const age = ageInMinutes(cached.fetchedAt);
      store.update({
        primarySnapshot: cached,
        status: 'stale',
        message: `Sem conexão. Exibindo a última consulta, feita há ${age} min. Dados desatualizados.`,
      });
    } else {
      store.update({
        status: 'error',
        message: error instanceof Error ? error.message : 'Não foi possível carregar os dados.',
      });
    }
  }
}

async function refreshComparison(): Promise<void> {
  const state = store.get();
  if (!state.comparisonLocation) return;
  comparisonRequest?.abort();
  const request = new AbortController();
  comparisonRequest = request;
  const sequence = ++comparisonSequence;
  try {
    const snapshot = await loadDashboard(
      state.comparisonLocation,
      state.preferences.units,
      request.signal,
    );
    if (sequence !== comparisonSequence || request.signal.aborted) return;
    store.update({ comparisonLocation: snapshot.location, comparisonSnapshot: snapshot });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return;
    store.update({ message: 'A cidade de comparação não pôde ser atualizada.', status: 'error' });
  }
}

async function refreshAll(): Promise<void> {
  const tasks: Promise<void>[] = [refreshPrimary()];
  if (store.get().comparisonLocation) tasks.push(refreshComparison());
  await Promise.allSettled(tasks);
}

store.subscribe(render);
applyTheme(store.get().preferences.theme);

const primarySearch = new SearchCombobox({
  input: element<HTMLInputElement>('primary-search'),
  list: element('primary-results'),
  button: element<HTMLButtonElement>('primary-search-button'),
  search: searchLocations,
  onSelect: (location) => {
    store.selectPrimary(location);
    void refreshPrimary();
  },
});

const compareSearch = new SearchCombobox({
  input: element<HTMLInputElement>('compare-search'),
  list: element('compare-results'),
  button: element<HTMLButtonElement>('compare-search-button'),
  search: searchLocations,
  unavailableLocation: () => store.get().primaryLocation,
  onSelect: (location) => {
    if (location.id === store.get().primaryLocation.id) {
      store.update({ status: 'error', message: 'Escolha uma cidade diferente para comparar.' });
      return;
    }
    store.update({ comparisonLocation: location, comparisonSnapshot: null, message: '' });
    void refreshComparison();
  },
});

element('favorite-button').addEventListener('click', () =>
  store.toggleFavorite(store.get().primaryLocation),
);
element('retry-button').addEventListener('click', () => void refreshAll());
element('clear-comparison-button').addEventListener('click', () => {
  comparisonRequest?.abort();
  store.update({ comparisonLocation: null, comparisonSnapshot: null, message: '' });
});
element('swap-button').addEventListener('click', () => {
  const state = store.get();
  if (!state.comparisonLocation || !state.comparisonSnapshot || !state.primarySnapshot) return;
  const nextPrimary = state.comparisonLocation;
  storage.saveLastLocation(nextPrimary);
  storage.saveSnapshot(state.comparisonSnapshot);
  store.update({
    primaryLocation: nextPrimary,
    primarySnapshot: state.comparisonSnapshot,
    comparisonLocation: state.primaryLocation,
    comparisonSnapshot: state.primarySnapshot,
  });
});

element<HTMLSelectElement>('units-select').addEventListener('change', (event) => {
  const select = event.currentTarget;
  if (!(select instanceof HTMLSelectElement)) return;
  store.setPreferences({
    ...store.get().preferences,
    units: select.value === 'imperial' ? 'imperial' : 'metric',
  });
  void refreshAll();
});
element<HTMLSelectElement>('theme-select').addEventListener('change', (event) => {
  const select = event.currentTarget;
  if (!(select instanceof HTMLSelectElement)) return;
  const theme = select.value === 'light' || select.value === 'dark' ? select.value : 'auto';
  store.setPreferences({ ...store.get().preferences, theme });
});
themeMedia.addEventListener('change', () => {
  if (store.get().preferences.theme === 'auto') applyTheme('auto');
});

element('clear-data-button').addEventListener('click', () => {
  storage.clear();
  store.update({
    favorites: [],
    recent: [],
    preferences: { units: 'metric', theme: 'auto' },
    message: 'Dados locais removidos.',
  });
});

const locationDialog = element<HTMLDialogElement>('location-dialog');
element('location-button').addEventListener('click', () => locationDialog.showModal());
element('confirm-location-button').addEventListener('click', (event) => {
  event.preventDefault();
  locationDialog.close();
  if (!navigator.geolocation) {
    store.update({ status: 'error', message: 'Geolocalização não disponível neste navegador.' });
    return;
  }
  store.update({
    status: 'loading',
    message: 'Obtendo sua localização com permissão do navegador…',
  });
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const location: Location = {
        id: `geo:${position.coords.latitude.toFixed(4)},${position.coords.longitude.toFixed(4)}`,
        name: 'Localização atual',
        country: '',
        admin1: 'Coordenadas não armazenadas',
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        source: 'geolocation',
      };
      store.update({ primaryLocation: location, primarySnapshot: null });
      void refreshPrimary();
    },
    (error) => {
      const message =
        error.code === error.PERMISSION_DENIED
          ? 'Permissão de localização não concedida.'
          : 'Não foi possível obter sua localização.';
      store.update({ status: 'error', message });
    },
    { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
  );
});

window.addEventListener('offline', () =>
  store.update({
    status: 'stale',
    message: 'Você está offline. Os dados exibidos podem estar desatualizados.',
  }),
);
window.addEventListener('online', () => void refreshAll());
window.addEventListener('unhandledrejection', () =>
  store.update({ status: 'error', message: 'Ocorreu um erro inesperado. Tente novamente.' }),
);
window.addEventListener('error', () =>
  store.update({ status: 'error', message: 'Ocorreu um erro inesperado. Tente novamente.' }),
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
      scope: import.meta.env.BASE_URL,
    });
  });
}

const cached = storage.snapshot();
if (cached && cached.location.id === store.get().primaryLocation.id) {
  store.update({
    primarySnapshot: cached,
    status: 'stale',
    message: `Atualizando dados salvos de ${cached.location.name}…`,
  });
}
void refreshPrimary();

const refreshTimer = window.setInterval(
  () => {
    if (!document.hidden && navigator.onLine) void refreshAll();
  },
  10 * 60 * 1000,
);

window.addEventListener('beforeunload', () => {
  window.clearInterval(refreshTimer);
  primaryRequest?.abort();
  comparisonRequest?.abort();
  primarySearch.destroy();
  compareSearch.destroy();
  chart.destroy();
});

if (import.meta.env.DEV) {
  console.info('EcoMonitor 2.0 iniciado em modo de desenvolvimento.', {
    fallback: DEFAULT_LOCATION.name,
  });
}
