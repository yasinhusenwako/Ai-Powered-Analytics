// Trend Analysis Engine

import { DataRow, TrendResult } from './types';
import {
  extractNumericValues,
  mean,
  standardDeviation,
  linearRegression,
  movingAverage,
} from './utils';

/**
 * Detect trend direction and strength
 */
function detectTrendDirection(values: number[]): { direction: TrendResult['direction']; strength: number } {
  if (values.length < 3) {
    return { direction: 'stable', strength: 0 };
  }
  
  const { slope, r2 } = linearRegression(values);
  const normalizedSlope = slope / (mean(values) || 1);
  
  // Determine direction
  let direction: TrendResult['direction'];
  if (Math.abs(normalizedSlope) < 0.01) {
    direction = 'stable';
  } else if (normalizedSlope > 0) {
    direction = 'increasing';
  } else {
    direction = 'decreasing';
  }
  
  // Check for volatility
  const std = standardDeviation(values);
  const avg = mean(values);
  const cv = avg !== 0 ? std / Math.abs(avg) : 0;
  if (cv > 0.5 && r2 < 0.3) {
    direction = 'volatile';
  }
  
  return { direction, strength: Math.min(Math.abs(r2), 1) };
}

/**
 * Detect seasonality using autocorrelation
 */
function detectSeasonality(values: number[]): { seasonal: boolean; period?: number } {
  if (values.length < 12) {
    return { seasonal: false };
  }
  
  const avg = mean(values);
  const detrended = values.map(v => v - avg);
  
  // Check common periods: 7 (weekly), 12 (monthly), 4 (quarterly)
  const periods = [7, 12, 4, 24, 30];
  
  for (const period of periods) {
    if (values.length < period * 2) continue;
    
    let correlation = 0;
    let count = 0;
    
    for (let i = period; i < values.length; i++) {
      correlation += detrended[i] * detrended[i - period];
      count++;
    }
    
    const variance = detrended.reduce((sum, v) => sum + v * v, 0);
    const autocorr = variance !== 0 ? correlation / variance : 0;
    
    if (autocorr > 0.5) {
      return { seasonal: true, period };
    }
  }
  
  return { seasonal: false };
}

/**
 * Detect sudden shifts in data
 */
function detectShifts(values: number[]): Array<{ index: number; magnitude: number; description: string }> {
  if (values.length < 5) return [];
  
  const shifts: Array<{ index: number; magnitude: number; description: string }> = [];
  const windowSize = Math.max(3, Math.floor(values.length / 10));
  
  for (let i = windowSize; i < values.length - windowSize; i++) {
    const beforeWindow = values.slice(i - windowSize, i);
    const afterWindow = values.slice(i, i + windowSize);
    
    const beforeMean = mean(beforeWindow);
    const afterMean = mean(afterWindow);
    const beforeStd = standardDeviation(beforeWindow);
    
    if (beforeStd === 0) continue;
    
    const changeMagnitude = Math.abs(afterMean - beforeMean) / beforeStd;
    
    if (changeMagnitude > 2) {
      const direction = afterMean > beforeMean ? 'increase' : 'decrease';
      const pctChange = beforeMean !== 0 
        ? ((afterMean - beforeMean) / Math.abs(beforeMean) * 100).toFixed(1)
        : 'N/A';
      
      shifts.push({
        index: i,
        magnitude: changeMagnitude,
        description: `Significant ${direction} of ${pctChange}% detected at position ${i}`,
      });
    }
  }
  
  // Return top 5 most significant shifts
  return shifts
    .sort((a, b) => b.magnitude - a.magnitude)
    .slice(0, 5);
}

/**
 * Analyze trends for a single column
 */
export function analyzeTrend(rows: DataRow[], columnName: string): TrendResult {
  const values = extractNumericValues(rows, columnName);
  
  if (values.length < 3) {
    return {
      column: columnName,
      direction: 'stable',
      strength: 0,
      movingAverages: values,
      seasonality: false,
      shifts: [],
      explanation: `Insufficient data points (${values.length}) for trend analysis.`,
    };
  }
  
  const { direction, strength } = detectTrendDirection(values);
  const { seasonal, period } = detectSeasonality(values);
  const shifts = detectShifts(values);
  const maWindow = Math.max(3, Math.floor(values.length / 10));
  const ma = movingAverage(values, maWindow);
  
  // Generate explanation
  const explanationParts: string[] = [];
  
  // Direction
  if (direction === 'increasing') {
    explanationParts.push(`The "${columnName}" metric shows an upward trend with ${(strength * 100).toFixed(0)}% confidence.`);
  } else if (direction === 'decreasing') {
    explanationParts.push(`The "${columnName}" metric exhibits a downward trend with ${(strength * 100).toFixed(0)}% confidence.`);
  } else if (direction === 'volatile') {
    explanationParts.push(`The "${columnName}" metric displays high volatility without a clear directional trend.`);
  } else {
    explanationParts.push(`The "${columnName}" metric remains relatively stable over the observed period.`);
  }
  
  // Seasonality
  if (seasonal && period) {
    explanationParts.push(`Seasonal patterns detected with an approximate ${period}-period cycle.`);
  }
  
  // Shifts
  if (shifts.length > 0) {
    explanationParts.push(`${shifts.length} significant shift(s) identified that may indicate structural changes.`);
  }
  
  return {
    column: columnName,
    direction,
    strength,
    movingAverages: ma,
    seasonality: seasonal,
    seasonalPeriod: period,
    shifts,
    explanation: explanationParts.join(' '),
  };
}

/**
 * Analyze trends for all numeric columns
 */
export function analyzeAllTrends(rows: DataRow[]): TrendResult[] {
  if (rows.length === 0) return [];
  
  const columnNames = Object.keys(rows[0]);
  const results: TrendResult[] = [];
  
  for (const column of columnNames) {
    const values = extractNumericValues(rows, column);
    if (values.length >= 3) {
      results.push(analyzeTrend(rows, column));
    }
  }
  
  return results;
}

/**
 * Get trend summary text
 */
export function getTrendSummary(trends: TrendResult[]): string {
  const increasing = trends.filter(t => t.direction === 'increasing');
  const decreasing = trends.filter(t => t.direction === 'decreasing');
  const volatile = trends.filter(t => t.direction === 'volatile');
  const seasonal = trends.filter(t => t.seasonality);
  
  const parts: string[] = [];
  
  if (increasing.length > 0) {
    parts.push(`${increasing.length} metric(s) showing growth: ${increasing.map(t => t.column).join(', ')}`);
  }
  if (decreasing.length > 0) {
    parts.push(`${decreasing.length} metric(s) declining: ${decreasing.map(t => t.column).join(', ')}`);
  }
  if (volatile.length > 0) {
    parts.push(`${volatile.length} metric(s) with high volatility`);
  }
  if (seasonal.length > 0) {
    parts.push(`Seasonal patterns detected in: ${seasonal.map(t => t.column).join(', ')}`);
  }
  
  return parts.join('. ') || 'No significant trends detected.';
}
