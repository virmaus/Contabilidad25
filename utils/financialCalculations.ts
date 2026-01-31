
/**
 * Calcula la Tasa Interna de Retorno (TIR) usando el método de Newton-Raphson
 */
export const calculateIRR = (cashFlows: number[]): number => {
  if (cashFlows.length < 2) return 0;
  
  const MAX_ITERATIONS = 1000;
  const PRECISION = 10 ** -6;
  let rate = 0.1; // Estimación inicial

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    let npv = 0;
    let dNpv = 0;
    
    for (let j = 0; j < cashFlows.length; j++) {
      npv += cashFlows[j] / (1 + rate) ** j;
      dNpv -= (j * cashFlows[j]) / (1 + rate) ** (j + 1);
    }
    
    const newRate = rate - npv / dNpv;
    if (Math.abs(newRate - rate) < PRECISION) return newRate;
    rate = newRate;
  }
  return rate;
};

/**
 * Calcula el Valor en Riesgo (VaR) mediante simulación histórica simple (Percentil 5%)
 */
export const calculateVaR = (monthlyReturns: number[]): number => {
  if (monthlyReturns.length < 5) return 0;
  const sorted = [...monthlyReturns].sort((a, b) => a - b);
  const index = Math.floor(0.05 * sorted.length);
  return Math.abs(sorted[index]);
};

/**
 * Estima el periodo de recuperación (Payback) en meses
 */
export const calculatePayback = (initialInvestment: number, monthlyFlows: number[]): number => {
  let cumulative = -initialInvestment;
  for (let i = 0; i < monthlyFlows.length; i++) {
    cumulative += monthlyFlows[i];
    if (cumulative >= 0) {
      // Interpolación lineal para mayor precisión
      const previousCumulative = cumulative - monthlyFlows[i];
      const fraction = Math.abs(previousCumulative) / monthlyFlows[i];
      return i + fraction;
    }
  }
  return -1; // No recuperado aún
};

/**
 * Cálculo de depreciación lineal estándar
 */
export const calculateDepreciation = (cost: number, salvageValue: number, usefulLifeYears: number): number => {
  if (usefulLifeYears <= 0) return 0;
  return (cost - salvageValue) / usefulLifeYears;
};
