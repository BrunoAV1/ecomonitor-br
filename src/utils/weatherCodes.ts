export interface WeatherDescription {
  label: string;
  shortLabel: string;
  tone: 'clear' | 'cloud' | 'rain' | 'storm' | 'snow' | 'fog';
}

const descriptions: Record<number, WeatherDescription> = {
  0: { label: 'Céu limpo', shortLabel: 'Limpo', tone: 'clear' },
  1: { label: 'Predominantemente limpo', shortLabel: 'Quase limpo', tone: 'clear' },
  2: { label: 'Parcialmente nublado', shortLabel: 'Parcialmente nublado', tone: 'cloud' },
  3: { label: 'Encoberto', shortLabel: 'Encoberto', tone: 'cloud' },
  45: { label: 'Nevoeiro', shortLabel: 'Nevoeiro', tone: 'fog' },
  48: { label: 'Nevoeiro com geada', shortLabel: 'Nevoeiro', tone: 'fog' },
  51: { label: 'Garoa leve', shortLabel: 'Garoa', tone: 'rain' },
  53: { label: 'Garoa moderada', shortLabel: 'Garoa', tone: 'rain' },
  55: { label: 'Garoa intensa', shortLabel: 'Garoa intensa', tone: 'rain' },
  56: { label: 'Garoa congelante leve', shortLabel: 'Garoa gelada', tone: 'rain' },
  57: { label: 'Garoa congelante intensa', shortLabel: 'Garoa gelada', tone: 'rain' },
  61: { label: 'Chuva leve', shortLabel: 'Chuva leve', tone: 'rain' },
  63: { label: 'Chuva moderada', shortLabel: 'Chuva', tone: 'rain' },
  65: { label: 'Chuva intensa', shortLabel: 'Chuva intensa', tone: 'rain' },
  66: { label: 'Chuva congelante leve', shortLabel: 'Chuva gelada', tone: 'rain' },
  67: { label: 'Chuva congelante intensa', shortLabel: 'Chuva gelada', tone: 'rain' },
  71: { label: 'Neve leve', shortLabel: 'Neve leve', tone: 'snow' },
  73: { label: 'Neve moderada', shortLabel: 'Neve', tone: 'snow' },
  75: { label: 'Neve intensa', shortLabel: 'Neve intensa', tone: 'snow' },
  77: { label: 'Grãos de neve', shortLabel: 'Grãos de neve', tone: 'snow' },
  80: { label: 'Pancadas de chuva leves', shortLabel: 'Pancadas', tone: 'rain' },
  81: { label: 'Pancadas de chuva', shortLabel: 'Pancadas', tone: 'rain' },
  82: { label: 'Pancadas de chuva intensas', shortLabel: 'Pancadas fortes', tone: 'rain' },
  85: { label: 'Pancadas de neve leves', shortLabel: 'Neve leve', tone: 'snow' },
  86: { label: 'Pancadas de neve intensas', shortLabel: 'Neve intensa', tone: 'snow' },
  95: { label: 'Trovoada', shortLabel: 'Trovoada', tone: 'storm' },
  96: { label: 'Trovoada com granizo leve', shortLabel: 'Trovoada', tone: 'storm' },
  99: { label: 'Trovoada com granizo intenso', shortLabel: 'Temporal', tone: 'storm' },
};

const unknown: WeatherDescription = {
  label: 'Condição não informada',
  shortLabel: 'Sem condição',
  tone: 'cloud',
};

export function describeWeatherCode(code: number | null): WeatherDescription {
  return code === null ? unknown : (descriptions[code] ?? unknown);
}
