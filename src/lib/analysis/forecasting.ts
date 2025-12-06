// Forecasting Engine

import { DataRow, ForecastResult } from './types';
import {
  extractNumericValues,
  mean,
  standardDeviation,
  linearRegression,
  exponentialSmoothing,
  movingAverage,
} from './utils';

interface PredictionPoint {
  period: number;
  value: number;
  confidence: { lower: number; upper: number };
}

/**
 * Linear regression forecast
 */
function linearForecast(
  values: number[],
  periods: number
): { predictions: PredictionPoint[]; trend: string } {
  const { slope, intercept, r2 } = linearRegression(values);
  const std = standardDeviation(values);
  const confidenceMultiplier = 1.96; // 95% confidence
  
  const predictions: PredictionPoint[] = [];
  for (let i = 1; i <= periods; i++) {
    const predictedValue = slope * (values.length + i - 1) + intercept;
    const uncertainty = std * confidenceMultiplier * Math.sqrt(1 + (1 / values.length));
    
    predictions.push({
      period: i,
      value: predictedValue,
      confidence: {
        lower: predictedValue - uncertainty * (1 + i * 0.1),
        upper: predictedValue + uncertainty * (1 + i * 0.1),
      },
    });
  }
  
  let trend: string;
  if (Math.abs(slope) < 0.01 * mean(values)) {
    trend = 'stable';
  } else if (slope > 0) {
    trend = `increasing at ${((slope / mean(values)) * 100).toFixed(1)}% per period`;
  } else {
    trend = `decreasing at ${(Math.abs(slope / mean(values)) * 100).toFixed(1)}% per period`;
  }
  
  return { predictions, trend };
}

/**
 * Exponential smoothing forecast
 */
function exponentialForecast(
  values: number[],
  periods: number,
  alpha: number = 0.3
): { predictions: PredictionPoint[]; trend: string } {
  const smoothed = exponentialSmoothing(values, alpha);
  const lastSmoothed = smoothed[smoothed.length - 1];
  const std = standardDeviation(values);
  
  // Calculate trend from smoothed values
  const recentSmoothed = smoothed.slice(-Math.min(10, smoothed.length));
  const { slope } = linearRegression(recentSmoothed);
  
  const predictions: PredictionPoint[] = [];
  for (let i = 1; i <= periods; i++) {
    const predictedValue = lastSmoothed + slope * i;
    const uncertainty = std * 1.96 * Math.sqrt(i);
    
    predictions.push({
      period: i,
      value: predictedValue,
      confidence: {
        lower: predictedValue - uncertainty,
        upper: predictedValue + uncertainty,
      },
    });
  }
  
  const pctChange = lastSmoothed !== 0 
    ? ((predictions[periods - 1].value - lastSmoothed) / Math.abs(lastSmoothed)) * 100
    : 0;
  
  let trend: string;
  if (Math.abs(pctChange) < 5) {
    trend = 'expected to remain stable';
  } else if (pctChange > 0) {
    trend = `expected to increase by ${pctChange.toFixed(1)}%`;
  } else {
    trend = `expected to decrease by ${Math.abs(pctChange).toFixed(1)}%`;
  }
  
  return { predictions, trend };
}

/**
 * Rolling average forecast
 */
function rollingForecast(
  values: number[],
  periods: number,
  windowSize?: number
): { predictions: PredictionPoint[]; trend: string } {
  const window = windowSize || Math.max(3, Math.floor(values.length / 5));
  const ma = movingAverage(values, window);
  const lastMA = ma[ma.length - 1];
  const std = standardDeviation(values);
  
  // Use trend from moving averages
  const { slope } = linearRegression(ma);
  
  const predictions: PredictionPoint[] = [];
  for (let i = 1; i <= periods; i++) {
    const predictedValue = lastMA + slope * i;
    const uncertainty = std * 1.5 * Math.sqrt(i / window);
    
    predictions.push({
      period: i,
      value: predictedValue,
      confidence: {
        lower: predictedValue - uncertainty,
        upper: predictedValue + uncertainty,
      },
    });
  }
  
  const firstPred = predictions[0].value;
  const lastPred = predictions[periods - 1].value;
  const changePct = firstPred !== 0 ? ((lastPred - firstPred) / Math.abs(firstPred)) * 100 : 0;
  
  let trend: string;
  if (Math.abs(changePct) < 3) {
    trend = 'stable outlook';
  } else if (changePct > 0) {
    trend = `gradual upward trend (+${changePct.toFixed(1)}%)`;
  } else {
    trend = `gradual downward trend (${changePct.toFixed(1)}%)`;
  }
  
  return { predictions, trend };
}

/**
 * Generate forecast for a column using multiple methods
 */
export function forecast(
  rows: DataRow[],
  columnName: string,
  periods: number = 7,
  method: 'linear' | 'exponential' | 'rolling' | 'auto' = 'auto'
): ForecastResult {
  const values = extractNumericValues(rows, columnName);
  
  if (values.length < 5) {
    return {
      column: columnName,
      method: 'linear',
      predictions: [],
      trend: 'insufficient data',
      interpretation: `Cannot generate forecast for "${columnName}": insufficient data points (minimum 5 required, found ${values.length}).`,
    };
  }
  
  // Auto-select method based on data characteristics
  let selectedMethod = method;
  if (method === 'auto') {
    const { r2 } = linearRegression(values);
    const cv = standardDeviation(values) / (mean(values) || 1);
    
    if (r2 > 0.7) {
      selectedMethod = 'linear';
    } else if (cv > 0.3) {
      selectedMethod = 'exponential';
    } else {
      selectedMethod = 'rolling';
    }
  }
  
  let result: { predictions: PredictionPoint[]; trend: string };
  
  switch (selectedMethod) {
    case 'linear':
      result = linearForecast(values, periods);
      break;
    case 'exponential':
      result = exponentialForecast(values, periods);
      break;
    case 'rolling':
      result = rollingForecast(values, periods);
      break;
    default:
      result = linearForecast(values, periods);
  }
  
  // Generate interpretation
  const lastActual = values[values.length - 1];
  const finalPredicted = result.predictions[result.predictions.length - 1];
  const changeFromCurrent = lastActual !== 0 
    ? ((finalPredicted.value - lastActual) / Math.abs(lastActual)) * 100
    : 0;
  
  const interpretation = generateForecastInterpretation(
    columnName,
    selectedMethod as 'linear' | 'exponential' | 'rolling',
    result.predictions,
    result.trend,
    changeFromCurrent
  );
  
  return {
    column: columnName,
    method: selectedMethod as 'linear' | 'exponential' | 'rolling',
    predictions: result.predictions,
    trend: result.trend,
    interpretation,
  };
}

/**
 * Generate human-readable forecast interpretation
 */
function generateForecastInterpretation(
  column: string,
  method: string,
  predictions: PredictionPoint[],
  trend: string,
  changeFromCurrent: number
): string {
  const methodNames = {
    linear: 'linear regression',
    exponential: 'exponential smoothing',
    rolling: 'rolling average',
  };
  
  const parts: string[] = [];
  
  // Method and general outlook
  parts.push(
    `Forecast for "${column}" using ${methodNames[method as keyof typeof methodNames] || method}: ` +
    `${trend}.`
  );
  
  // Specific predictions
  if (predictions.length > 0) {
    const firstPred = predictions[0];
    const lastPred = predictions[predictions.length - 1];
    
    parts.push(
      `Short-term prediction (period 1): ${firstPred.value.toFixed(2)} ` +
      `(95% CI: ${firstPred.confidence.lower.toFixed(2)} - ${firstPred.confidence.upper.toFixed(2)}).`
    );
    
    if (predictions.length > 1) {
      parts.push(
        `Extended prediction (period ${predictions.length}): ${lastPred.value.toFixed(2)} ` +
        `(95% CI: ${lastPred.confidence.lower.toFixed(2)} - ${lastPred.confidence.upper.toFixed(2)}).`
      );
    }
  }
  
  // Change interpretation
  if (Math.abs(changeFromCurrent) > 10) {
    if (changeFromCurrent > 0) {
      parts.push(`This represents a significant projected increase of ${changeFromCurrent.toFixed(1)}% from current levels.`);
    } else {
      parts.push(`This represents a significant projected decrease of ${Math.abs(changeFromCurrent).toFixed(1)}% from current levels.`);
    }
  } else {
    parts.push(`The forecast indicates relatively stable conditions with minimal deviation from current levels.`);
  }
  
  return parts.join(' ');
}

/**
 * Generate forecasts for all numeric columns
 */
export function forecastAll(
  rows: DataRow[],
  periods: number = 7
): ForecastResult[] {
  if (rows.length === 0) return [];
  
  const columnNames = Object.keys(rows[0]);
  const results: ForecastResult[] = [];
  
  for (const column of columnNames) {
    const values = extractNumericValues(rows, column);
    if (values.length >= 5) {
      results.push(forecast(rows, column, periods));
    }
  }
  
  return results;
}

/**
 * Get forecast summary text
 */
export function getForecastSummary(forecasts: ForecastResult[]): string {
  if (forecasts.length === 0) {
    return 'No columns have sufficient data for forecasting.';
  }
  
  const growing = forecasts.filter(f => f.trend.includes('increas') || f.trend.includes('upward'));
  const declining = forecasts.filter(f => f.trend.includes('decreas') || f.trend.includes('downward'));
  const stable = forecasts.filter(f => f.trend.includes('stable'));
  
  const parts: string[] = [];
  
  if (growing.length > 0) {
    parts.push(`${growing.length} metric(s) forecasted to grow: ${growing.map(f => f.column).join(', ')}`);
  }
  if (declining.length > 0) {
    parts.push(`${declining.length} metric(s) forecasted to decline: ${declining.map(f => f.column).join(', ')}`);
  }
  if (stable.length > 0) {
    parts.push(`${stable.length} metric(s) expected to remain stable`);
  }
  
  return parts.join('. ') + '.';
}
