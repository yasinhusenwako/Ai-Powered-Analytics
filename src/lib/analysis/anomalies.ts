// Anomaly Detection Module

import { DataRow, Anomaly, AnomalyResult } from './types';
import {
  extractNumericValues,
  mean,
  standardDeviation,
  quartiles,
  zScore,
} from './utils';

/**
 * Detect anomalies using Z-score method
 */
function detectZScoreAnomalies(
  values: number[],
  columnName: string,
  threshold: number = 3
): Anomaly[] {
  if (values.length < 10) return [];
  
  const avg = mean(values);
  const std = standardDeviation(values);
  
  if (std === 0) return [];
  
  const anomalies: Anomaly[] = [];
  
  values.forEach((value, index) => {
    const z = zScore(value, avg, std);
    if (Math.abs(z) > threshold) {
      anomalies.push({
        rowIndex: index,
        column: columnName,
        value,
        expectedRange: { min: avg - 2 * std, max: avg + 2 * std },
        score: Math.min(Math.abs(z) / 5, 1),
        type: 'zscore',
      });
    }
  });
  
  return anomalies;
}

/**
 * Detect anomalies using IQR method
 */
function detectIQRAnomalies(
  values: number[],
  columnName: string,
  multiplier: number = 1.5
): Anomaly[] {
  if (values.length < 10) return [];
  
  const q = quartiles(values);
  const iqr = q.q3 - q.q1;
  const lowerBound = q.q1 - multiplier * iqr;
  const upperBound = q.q3 + multiplier * iqr;
  
  const anomalies: Anomaly[] = [];
  
  values.forEach((value, index) => {
    if (value < lowerBound || value > upperBound) {
      const distance = value < lowerBound 
        ? lowerBound - value 
        : value - upperBound;
      const score = Math.min(distance / (iqr || 1), 1);
      
      anomalies.push({
        rowIndex: index,
        column: columnName,
        value,
        expectedRange: { min: lowerBound, max: upperBound },
        score,
        type: 'iqr',
      });
    }
  });
  
  return anomalies;
}

/**
 * Detect sudden spikes and drops using rolling window
 */
function detectRollingAnomalies(
  values: number[],
  columnName: string,
  windowSize: number = 5,
  threshold: number = 2
): Anomaly[] {
  if (values.length < windowSize + 2) return [];
  
  const anomalies: Anomaly[] = [];
  
  for (let i = windowSize; i < values.length; i++) {
    const window = values.slice(i - windowSize, i);
    const windowMean = mean(window);
    const windowStd = standardDeviation(window);
    
    if (windowStd === 0) continue;
    
    const currentValue = values[i];
    const deviation = Math.abs(currentValue - windowMean) / windowStd;
    
    if (deviation > threshold) {
      const isSpike = currentValue > windowMean;
      anomalies.push({
        rowIndex: i,
        column: columnName,
        value: currentValue,
        expectedRange: { 
          min: windowMean - threshold * windowStd, 
          max: windowMean + threshold * windowStd 
        },
        score: Math.min(deviation / 5, 1),
        type: isSpike ? 'spike' : 'drop',
      });
    }
  }
  
  return anomalies;
}

/**
 * Detect anomalies in a single column
 */
export function detectColumnAnomalies(
  rows: DataRow[],
  columnName: string
): Anomaly[] {
  const values = extractNumericValues(rows, columnName);
  if (values.length < 10) return [];
  
  const zScoreAnomalies = detectZScoreAnomalies(values, columnName);
  const iqrAnomalies = detectIQRAnomalies(values, columnName);
  const rollingAnomalies = detectRollingAnomalies(values, columnName);
  
  // Merge and deduplicate anomalies
  const allAnomalies = [...zScoreAnomalies, ...iqrAnomalies, ...rollingAnomalies];
  const uniqueMap = new Map<number, Anomaly>();
  
  allAnomalies.forEach(anomaly => {
    const key = anomaly.rowIndex;
    const existing = uniqueMap.get(key);
    if (!existing || existing.score < anomaly.score) {
      uniqueMap.set(key, anomaly);
    }
  });
  
  return Array.from(uniqueMap.values()).sort((a, b) => b.score - a.score);
}

/**
 * Detect anomalies across all numeric columns
 */
export function detectAllAnomalies(rows: DataRow[]): AnomalyResult {
  if (rows.length === 0) {
    return {
      anomalies: [],
      anomalyScore: 0,
      affectedColumns: [],
      explanation: 'No data available for anomaly detection.',
    };
  }
  
  const columnNames = Object.keys(rows[0]);
  const allAnomalies: Anomaly[] = [];
  const affectedColumns = new Set<string>();
  
  for (const column of columnNames) {
    const values = extractNumericValues(rows, column);
    if (values.length >= 10) {
      const anomalies = detectColumnAnomalies(rows, column);
      if (anomalies.length > 0) {
        allAnomalies.push(...anomalies);
        affectedColumns.add(column);
      }
    }
  }
  
  // Sort by score and limit
  const sortedAnomalies = allAnomalies
    .sort((a, b) => b.score - a.score)
    .slice(0, 100);
  
  // Calculate overall anomaly score
  const anomalyScore = sortedAnomalies.length > 0
    ? Math.min(sortedAnomalies.length / rows.length, 1)
    : 0;
  
  // Generate explanation
  const explanation = generateAnomalyExplanation(
    sortedAnomalies,
    Array.from(affectedColumns),
    rows.length
  );
  
  return {
    anomalies: sortedAnomalies,
    anomalyScore,
    affectedColumns: Array.from(affectedColumns),
    explanation,
  };
}

/**
 * Generate human-readable anomaly explanation
 */
function generateAnomalyExplanation(
  anomalies: Anomaly[],
  affectedColumns: string[],
  totalRows: number
): string {
  if (anomalies.length === 0) {
    return 'No significant anomalies detected in the dataset. Data values fall within expected ranges across all analyzed columns.';
  }
  
  const parts: string[] = [];
  
  // Overview
  const pct = ((anomalies.length / totalRows) * 100).toFixed(2);
  parts.push(
    `Detected ${anomalies.length} anomalous data point(s) affecting ${affectedColumns.length} column(s), ` +
    `representing ${pct}% of the dataset.`
  );
  
  // By type
  const byType = {
    zscore: anomalies.filter(a => a.type === 'zscore').length,
    iqr: anomalies.filter(a => a.type === 'iqr').length,
    spike: anomalies.filter(a => a.type === 'spike').length,
    drop: anomalies.filter(a => a.type === 'drop').length,
  };
  
  const typeDescriptions: string[] = [];
  if (byType.zscore > 0) typeDescriptions.push(`${byType.zscore} statistical outlier(s)`);
  if (byType.iqr > 0) typeDescriptions.push(`${byType.iqr} IQR-based anomaly(ies)`);
  if (byType.spike > 0) typeDescriptions.push(`${byType.spike} sudden spike(s)`);
  if (byType.drop > 0) typeDescriptions.push(`${byType.drop} sudden drop(s)`);
  
  if (typeDescriptions.length > 0) {
    parts.push(`Anomaly breakdown: ${typeDescriptions.join(', ')}.`);
  }
  
  // Most affected columns
  const columnCounts = new Map<string, number>();
  anomalies.forEach(a => {
    columnCounts.set(a.column, (columnCounts.get(a.column) || 0) + 1);
  });
  
  const sortedColumns = Array.from(columnCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  if (sortedColumns.length > 0) {
    const colDescriptions = sortedColumns.map(([col, count]) => `"${col}" (${count})`);
    parts.push(`Most affected columns: ${colDescriptions.join(', ')}.`);
  }
  
  // High severity
  const highSeverity = anomalies.filter(a => a.score > 0.8);
  if (highSeverity.length > 0) {
    parts.push(
      `${highSeverity.length} high-severity anomaly(ies) detected that warrant immediate investigation.`
    );
  }
  
  return parts.join(' ');
}

/**
 * Get anomaly summary for a specific column
 */
export function getColumnAnomalySummary(
  rows: DataRow[],
  columnName: string
): { count: number; severity: string; topAnomalies: Anomaly[] } {
  const anomalies = detectColumnAnomalies(rows, columnName);
  const maxScore = anomalies.length > 0 ? Math.max(...anomalies.map(a => a.score)) : 0;
  
  let severity: string;
  if (maxScore > 0.8) severity = 'high';
  else if (maxScore > 0.5) severity = 'medium';
  else if (anomalies.length > 0) severity = 'low';
  else severity = 'none';
  
  return {
    count: anomalies.length,
    severity,
    topAnomalies: anomalies.slice(0, 5),
  };
}
