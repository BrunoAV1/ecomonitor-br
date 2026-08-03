import { expect, test, type Page, type Route } from '@playwright/test';

const start = 1_785_780_000;

function forecastPayload(url: URL) {
  const latitude = Number(url.searchParams.get('latitude'));
  const imperial = url.searchParams.get('temperature_unit') === 'fahrenheit';
  const temperature = latitude > 35 ? 20 : latitude > -23 ? 29 : 25;
  const hourlyTimes = Array.from({ length: 24 }, (_, index) => start + index * 3600);
  const dailyTimes = Array.from({ length: 7 }, (_, index) => start + index * 86400);
  return {
    timezone: latitude > 35 ? 'Europe/Lisbon' : 'America/Sao_Paulo',
    current_units: {
      temperature_2m: imperial ? '°F' : '°C',
      wind_speed_10m: imperial ? 'mph' : 'km/h',
    },
    current: {
      time: start,
      temperature_2m: imperial ? temperature * 1.8 + 32 : temperature,
      apparent_temperature: imperial ? temperature * 1.8 + 33 : temperature + 0.5,
      relative_humidity_2m: 61,
      wind_speed_10m: 13,
      wind_direction_10m: 135,
      precipitation: 0.2,
      weather_code: 2,
      is_day: 1,
    },
    hourly: {
      time: hourlyTimes,
      temperature_2m: hourlyTimes.map((_, index) => temperature + index / 10),
      apparent_temperature: hourlyTimes.map((_, index) => temperature + index / 10 + 0.5),
      relative_humidity_2m: hourlyTimes.map(() => 61),
      precipitation_probability: hourlyTimes.map((_, index) => index * 2),
      precipitation: hourlyTimes.map(() => 0.2),
      weather_code: hourlyTimes.map(() => 2),
      wind_speed_10m: hourlyTimes.map(() => 13),
    },
    daily: {
      time: dailyTimes,
      weather_code: dailyTimes.map(() => 2),
      temperature_2m_max: dailyTimes.map(() => temperature + 4),
      temperature_2m_min: dailyTimes.map(() => temperature - 5),
      precipitation_sum: dailyTimes.map(() => 1.2),
      sunrise: dailyTimes.map((time) => time + 6 * 3600),
      sunset: dailyTimes.map((time) => time + 18 * 3600),
    },
  };
}

async function mockApis(page: Page): Promise<void> {
  await page.route('https://api.open-meteo.com/v1/forecast*', async (route: Route) => {
    await route.fulfill({ json: forecastPayload(new URL(route.request().url())) });
  });
  await page.route(
    'https://air-quality-api.open-meteo.com/v1/air-quality*',
    async (route: Route) => {
      await route.fulfill({
        json: { current: { time: start, us_aqi: 42, pm2_5: 8.4, pm10: 15.2 } },
      });
    },
  );
  await page.route('https://geocoding-api.open-meteo.com/v1/search*', async (route: Route) => {
    const query = new URL(route.request().url()).searchParams.get('name')?.toLowerCase() ?? '';
    const result = query.includes('porto')
      ? {
          id: 3,
          name: 'Porto',
          latitude: 41.1496,
          longitude: -8.6109,
          country: 'Portugal',
          admin1: 'Porto',
          timezone: 'Europe/Lisbon',
        }
      : query.includes('lisboa')
        ? {
            id: 2,
            name: 'Lisboa',
            latitude: 38.7167,
            longitude: -9.1333,
            country: 'Portugal',
            admin1: 'Lisboa',
            timezone: 'Europe/Lisbon',
          }
        : {
            id: 1,
            name: 'Rio de Janeiro',
            latitude: -22.9068,
            longitude: -43.1729,
            country: 'Brasil',
            admin1: 'Rio de Janeiro',
            timezone: 'America/Sao_Paulo',
          };
    await route.fulfill({ json: { results: [result] } });
  });
}

test.beforeEach(async ({ page }) => {
  await mockApis(page);
  await page.goto('/');
});

test('mostra condições, AQI, 24 horas e sete dias', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'São Paulo', level: 1 })).toBeVisible();
  await expect(page.locator('#current-temperature')).toHaveText('25');
  await expect(page.locator('#aqi-value')).toHaveText('42');
  await expect(page.locator('.hour-item')).toHaveCount(8);
  await expect(page.locator('.day-card')).toHaveCount(7);
  await expect(page.getByRole('status')).toBeHidden();
});

test('mantém as duas buscas independentes e permite comparação por teclado', async ({ page }) => {
  const primary = page.getByRole('combobox', { name: 'Cidade observada' });
  const comparison = page.getByRole('combobox', { name: 'Comparar com' });
  await primary.fill('Lisboa');
  await comparison.fill('Porto');
  await expect(page.locator('#primary-results [role="option"]')).toContainText('Lisboa');
  await expect(page.locator('#compare-results [role="option"]')).toContainText('Porto');
  await expect(primary).toHaveAttribute('aria-expanded', 'true');
  await primary.press('Enter');
  await expect(page.getByRole('heading', { name: 'Lisboa', level: 1 })).toBeVisible();
  await comparison.fill('Porto');
  await expect(page.locator('#compare-results [role="option"]')).toContainText('Porto');
  await comparison.press('Enter');
  await expect(page.locator('#comparison-panel')).toBeVisible();
  await expect(page.locator('#secondary-compare-name')).toHaveText('Porto');
});

test('persiste unidades e tema', async ({ page }) => {
  await page.locator('details.settings > summary').click();
  await page.locator('#units-select').selectOption('imperial');
  await expect(page.locator('#temperature-unit')).toHaveText('°F');
  await page.locator('#theme-select').selectOption('light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('#units-select')).toHaveValue('imperial');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('persiste favoritos e explica a localização antes da permissão', async ({ page }) => {
  const primary = page.getByRole('combobox', { name: 'Cidade observada' });
  await primary.fill('Lisboa');
  await expect(page.locator('#primary-results [role="option"]')).toContainText('Lisboa');
  await primary.press('Enter');
  await page.getByRole('button', { name: 'Adicionar cidade aos favoritos' }).click();
  await expect(page.locator('#favorites-list')).toContainText('Lisboa · Portugal');
  await page.getByRole('button', { name: 'Usar minha localização' }).click();
  await expect(page.getByRole('dialog')).toContainText('não serão salvas como cidade recente');
  await page.getByRole('button', { name: 'Agora não' }).click();
  await page.reload();
  await expect(page.locator('#favorites-list')).toContainText('Lisboa · Portugal');
});

test('usa o último snapshot e marca dados desatualizados quando a API falha', async ({ page }) => {
  await expect(page.locator('#current-temperature')).toHaveText('25');
  await page.route('https://api.open-meteo.com/v1/forecast*', async (route) =>
    route.abort('failed'),
  );
  await page.reload();
  await expect(page.locator('#system-banner')).toContainText('Dados desatualizados');
  await expect(page.locator('#current-temperature')).toHaveText('25');
  await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible();
});

test('não cria overflow horizontal em viewport móvel', async ({ page }) => {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});
