import {
  CategoryScale,
  Chart,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import type { ChartDataset } from 'chart.js';
import type { DashboardSnapshot } from '../types/weather';
import { formatLocalTime } from '../utils/date';

Chart.register(
  CategoryScale,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Filler,
  Legend,
  Tooltip,
);

export class WeatherChart {
  private chart: Chart<'line'> | null = null;

  constructor(private readonly canvas: HTMLCanvasElement) {}

  render(primary: DashboardSnapshot, comparison: DashboardSnapshot | null): void {
    const comparisonByTime = new Map(
      comparison?.hourly.map((point) => [point.time, point.temperature] as const) ?? [],
    );
    const labels = primary.hourly.map((point) =>
      formatLocalTime(point.time, primary.location.timezone),
    );
    const datasets: ChartDataset<'line', Array<number | null>>[] = [
      {
        label: `${primary.location.name} · temperatura`,
        data: primary.hourly.map((point) => point.temperature),
        borderColor: '#80b69b',
        backgroundColor: 'rgba(128, 182, 155, 0.12)',
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
        fill: true,
        tension: 0.32,
        yAxisID: 'temperature',
      },
      {
        label: 'Probabilidade de precipitação',
        data: primary.hourly.map((point) => point.precipitationProbability),
        borderColor: '#72a9c2',
        backgroundColor: 'transparent',
        pointRadius: 0,
        borderWidth: 1.5,
        borderDash: [4, 5],
        tension: 0.25,
        yAxisID: 'probability',
      },
    ];
    if (comparison) {
      datasets.push({
        label: `${comparison.location.name} · temperatura`,
        data: primary.hourly.map((point) => comparisonByTime.get(point.time) ?? null),
        borderColor: '#d6a85f',
        backgroundColor: 'transparent',
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
        borderDash: [7, 5],
        fill: false,
        tension: 0.32,
        yAxisID: 'temperature',
      });
    }
    this.chart?.destroy();
    this.chart = new Chart(this.canvas, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? false
          : { duration: 350 },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { labels: { color: '#9fb2ad', usePointStyle: true, boxWidth: 8 } },
          tooltip: {
            backgroundColor: '#10201f',
            borderColor: '#35514b',
            borderWidth: 1,
            titleColor: '#f3f7f5',
            bodyColor: '#d8e2df',
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#829690', maxTicksLimit: 8, maxRotation: 0 },
          },
          temperature: {
            position: 'left',
            grid: { color: 'rgba(130, 150, 144, 0.12)' },
            ticks: { color: '#829690' },
            title: { display: true, text: primary.units.temperature, color: '#829690' },
          },
          probability: {
            position: 'right',
            min: 0,
            max: 100,
            grid: { display: false },
            ticks: { color: '#829690', callback: (value) => `${value}%` },
          },
        },
      },
    });
  }

  destroy(): void {
    this.chart?.destroy();
  }
}
