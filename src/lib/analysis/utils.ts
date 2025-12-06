// Utility functions for data analysis

import { ColumnType, DataRow } from './types';

/**
 * Detect the type of a column based on its values
 */
export function detectColumnType(values: unknown[]): ColumnType {
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
  
  if (nonNullValues.length === 0) return 'text';
  
  const sample = nonNullValues.slice(0, Math.min(100, nonNullValues.length));
  
  // Check boolean
  const booleanValues = new Set(['true', 'false', '1', '0', 'yes', 'no']);
  if (sample.every(v => booleanValues.has(String(v).toLowerCase()))) {
    return 'boolean';
  }
  
  // Check numeric
  const numericCount = sample.filter(v => !isNaN(Number(v)) && v !== '').length;
  if (numericCount / sample.length >= 0.9) {
    return 'numeric';
  }
  
  // Check datetime
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}/, // ISO date
    /^\d{2}\/\d{2}\/\d{4}/, // US date
    /^\d{2}-\d{2}-\d{4}/, // EU date
  ];
  const dateCount = sample.filter(v => {
    const str = String(v);
    return datePatterns.some(p => p.test(str)) || !isNaN(Date.parse(str));
  }).length;
  if (dateCount / sample.length >= 0.8) {
    return 'datetime';
  }
  
  // Check categorical vs text
  const uniqueRatio = new Set(sample.map(String)).size / sample.length;
  if (uniqueRatio < 0.5 || new Set(nonNullValues).size <= 20) {
    return 'categorical';
  }
  
  return 'text';
}

/**
 * Extract numeric values from a column
 */
export function extractNumericValues(rows: DataRow[], column: string): number[] {
  return rows
    .map(row => Number(row[column]))
    .filter(v => !isNaN(v) && isFinite(v));
}

/**
 * Calculate mean of numeric array
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Calculate median of numeric array
 */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calculate mode of an array
 */
export function mode<T>(values: T[]): T | undefined {
  if (values.length === 0) return undefined;
  const counts = new Map<T, number>();
  values.forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
  let maxCount = 0;
  let modeValue: T | undefined;
  counts.forEach((count, value) => {
    if (count > maxCount) {
      maxCount = count;
      modeValue = value;
    }
  });
  return modeValue;
}

/**
 * Calculate standard deviation
 */
export function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const squareDiffs = values.map(v => Math.pow(v - avg, 2));
  return Math.sqrt(mean(squareDiffs));
}

/**
 * Calculate percentile
 */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] * (upper - index) + sorted[upper] * (index - lower);
}

/**
 * Calculate quartiles
 */
export function quartiles(values: number[]): { q1: number; q2: number; q3: number } {
  return {
    q1: percentile(values, 25),
    q2: percentile(values, 50),
    q3: percentile(values, 75),
  };
}

/**
 * Calculate z-score for a value
 */
export function zScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

/**
 * Linear regression
 */
export function linearRegression(values: number[]): { slope: number; intercept: number; r2: number } {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] || 0, r2: 0 };
  
  const xMean = (n - 1) / 2;
  const yMean = mean(values);
  
  let numerator = 0;
  let denominator = 0;
  let ssTotal = 0;
  
  for (let i = 0; i < n; i++) {
    const xDiff = i - xMean;
    const yDiff = values[i] - yMean;
    numerator += xDiff * yDiff;
    denominator += xDiff * xDiff;
    ssTotal += yDiff * yDiff;
  }
  
  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;
  
  // Calculate R²
  let ssResidual = 0;
  for (let i = 0; i < n; i++) {
    const predicted = slope * i + intercept;
    ssResidual += Math.pow(values[i] - predicted, 2);
  }
  const r2 = ssTotal !== 0 ? 1 - ssResidual / ssTotal : 0;
  
  return { slope, intercept, r2 };
}

/**
 * Simple moving average
 */
export function movingAverage(values: number[], window: number): number[] {
  if (values.length < window) return values;
  const result: number[] = [];
  for (let i = 0; i <= values.length - window; i++) {
    const windowValues = values.slice(i, i + window);
    result.push(mean(windowValues));
  }
  return result;
}

/**
 * Exponential smoothing
 */
export function exponentialSmoothing(values: number[], alpha: number = 0.3): number[] {
  if (values.length === 0) return [];
  const result: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    result.push(alpha * values[i] + (1 - alpha) * result[i - 1]);
  }
  return result;
}

/**
 * Pearson correlation coefficient
 */
export function pearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;
  
  const xMean = mean(x.slice(0, n));
  const yMean = mean(y.slice(0, n));
  
  let numerator = 0;
  let xDenom = 0;
  let yDenom = 0;
  
  for (let i = 0; i < n; i++) {
    const xDiff = x[i] - xMean;
    const yDiff = y[i] - yMean;
    numerator += xDiff * yDiff;
    xDenom += xDiff * xDiff;
    yDenom += yDiff * yDiff;
  }
  
  const denominator = Math.sqrt(xDenom * yDenom);
  return denominator !== 0 ? numerator / denominator : 0;
}

/**
 * Cramer's V for categorical variables
 */
export function cramersV(x: string[], y: string[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;
  
  // Build contingency table
  const xCategories = [...new Set(x)];
  const yCategories = [...new Set(y)];
  
  const contingency: number[][] = Array(xCategories.length)
    .fill(0)
    .map(() => Array(yCategories.length).fill(0));
  
  for (let i = 0; i < n; i++) {
    const xi = xCategories.indexOf(x[i]);
    const yi = yCategories.indexOf(y[i]);
    if (xi >= 0 && yi >= 0) contingency[xi][yi]++;
  }
  
  // Calculate chi-squared
  const rowSums = contingency.map(row => row.reduce((a, b) => a + b, 0));
  const colSums = yCategories.map((_, j) => 
    contingency.reduce((sum, row) => sum + row[j], 0)
  );
  
  let chiSquared = 0;
  for (let i = 0; i < xCategories.length; i++) {
    for (let j = 0; j < yCategories.length; j++) {
      const expected = (rowSums[i] * colSums[j]) / n;
      if (expected > 0) {
        chiSquared += Math.pow(contingency[i][j] - expected, 2) / expected;
      }
    }
  }
  
  const k = Math.min(xCategories.length, yCategories.length);
  return k > 1 ? Math.sqrt(chiSquared / (n * (k - 1))) : 0;
}

/**
 * Format number for display
 */
export function formatNumber(value: number, decimals: number = 2): string {
  if (Math.abs(value) >= 1e9) return (value / 1e9).toFixed(decimals) + 'B';
  if (Math.abs(value) >= 1e6) return (value / 1e6).toFixed(decimals) + 'M';
  if (Math.abs(value) >= 1e3) return (value / 1e3).toFixed(decimals) + 'K';
  return value.toFixed(decimals);
}

/**
 * Get top N frequent values from an array
 */
export function topFrequentValues<T>(values: T[], n: number): Array<{ value: T; count: number }> {
  const counts = new Map<T, number>();
  values.forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

/**
 * Estimate memory size of dataset
 */
export function estimateMemorySize(rows: DataRow[]): string {
  const jsonStr = JSON.stringify(rows);
  const bytes = new TextEncoder().encode(jsonStr).length;
  if (bytes >= 1e9) return (bytes / 1e9).toFixed(2) + ' GB';
  if (bytes >= 1e6) return (bytes / 1e6).toFixed(2) + ' MB';
  if (bytes >= 1e3) return (bytes / 1e3).toFixed(2) + ' KB';
  return bytes + ' bytes';
}
