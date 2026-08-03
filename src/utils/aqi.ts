export interface AqiGuidance {
  label: string;
  level: 'good' | 'moderate' | 'sensitive' | 'unhealthy' | 'very-unhealthy' | 'hazardous';
  recommendation: string;
}

export function classifyAqi(value: number | null): AqiGuidance | null {
  if (value === null || !Number.isFinite(value) || value < 0) return null;
  if (value <= 50)
    return {
      label: 'Boa',
      level: 'good',
      recommendation: 'Condições favoráveis para atividades ao ar livre.',
    };
  if (value <= 100)
    return {
      label: 'Moderada',
      level: 'moderate',
      recommendation: 'Pessoas muito sensíveis podem preferir reduzir esforço prolongado.',
    };
  if (value <= 150)
    return {
      label: 'Insalubre para grupos sensíveis',
      level: 'sensitive',
      recommendation: 'Grupos sensíveis devem considerar limitar esforço ao ar livre.',
    };
  if (value <= 200)
    return {
      label: 'Insalubre',
      level: 'unhealthy',
      recommendation: 'Considere reduzir atividades intensas ou prolongadas ao ar livre.',
    };
  if (value <= 300)
    return {
      label: 'Muito insalubre',
      level: 'very-unhealthy',
      recommendation: 'Evite esforço ao ar livre e acompanhe orientações das autoridades locais.',
    };
  return {
    label: 'Perigosa',
    level: 'hazardous',
    recommendation: 'Permaneça em ambiente protegido e siga alertas das autoridades locais.',
  };
}
