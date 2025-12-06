// Data Profiling Module

import { DataRow, ColumnProfile, DatasetProfile, ColumnType } from './types';
import {
  detectColumnType,
  extractNumericValues,
  mean,
  median,
  mode,
  standardDeviation,
  topFrequentValues,
  estimateMemorySize,
} from './utils';

/**
 * Profile a single column
 */
export function profileColumn(rows: DataRow[], columnName: string): ColumnProfile {
  const values = rows.map(row => row[columnName]);
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
  const type = detectColumnType(values);
  
  const profile: ColumnProfile = {
    name: columnName,
    type,
    nullCount: values.length - nonNullValues.length,
    totalCount: values.length,
    uniqueCount: new Set(nonNullValues.map(String)).size,
    topValues: topFrequentValues(
      nonNullValues.map(v => type === 'numeric' ? Number(v) : String(v)),
      5
    ),
  };
  
  if (type === 'numeric') {
    const numericValues = extractNumericValues(rows, columnName);
    if (numericValues.length > 0) {
      profile.min = Math.min(...numericValues);
      profile.max = Math.max(...numericValues);
      profile.mean = mean(numericValues);
      profile.median = median(numericValues);
      profile.mode = mode(numericValues);
      profile.stdDev = standardDeviation(numericValues);
    }
  } else if (type === 'datetime') {
    const dates = nonNullValues
      .map(v => new Date(String(v)))
      .filter(d => !isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());
    if (dates.length > 0) {
      profile.min = dates[0];
      profile.max = dates[dates.length - 1];
    }
  } else if (type === 'categorical' || type === 'text') {
    const stringValues = nonNullValues.map(String);
    profile.mode = mode(stringValues);
  }
  
  return profile;
}

/**
 * Profile an entire dataset
 */
export function profileDataset(rows: DataRow[]): DatasetProfile {
  if (rows.length === 0) {
    return {
      rowCount: 0,
      columnCount: 0,
      columns: [],
      memoryEstimate: '0 bytes',
      completeness: 0,
    };
  }
  
  const columnNames = Object.keys(rows[0]);
  const columns = columnNames.map(name => profileColumn(rows, name));
  
  const totalCells = rows.length * columnNames.length;
  const nullCells = columns.reduce((sum, col) => sum + col.nullCount, 0);
  const completeness = totalCells > 0 ? ((totalCells - nullCells) / totalCells) * 100 : 0;
  
  return {
    rowCount: rows.length,
    columnCount: columnNames.length,
    columns,
    memoryEstimate: estimateMemorySize(rows),
    completeness: Math.round(completeness * 100) / 100,
  };
}

/**
 * Generate a text summary of the profile
 */
export function generateProfileSummary(profile: DatasetProfile): string {
  const numericCols = profile.columns.filter(c => c.type === 'numeric');
  const categoricalCols = profile.columns.filter(c => c.type === 'categorical');
  const datetimeCols = profile.columns.filter(c => c.type === 'datetime');
  
  const lines: string[] = [
    `Dataset Overview:`,
    `• ${profile.rowCount.toLocaleString()} rows × ${profile.columnCount} columns`,
    `• Data completeness: ${profile.completeness}%`,
    `• Estimated size: ${profile.memoryEstimate}`,
    ``,
    `Column Types:`,
    `• Numeric: ${numericCols.length} columns`,
    `• Categorical: ${categoricalCols.length} columns`,
    `• DateTime: ${datetimeCols.length} columns`,
  ];
  
  if (numericCols.length > 0) {
    lines.push(``, `Key Numeric Columns:`);
    numericCols.slice(0, 5).forEach(col => {
      lines.push(`• ${col.name}: range [${col.min?.toLocaleString()} - ${col.max?.toLocaleString()}], mean ${col.mean?.toFixed(2)}`);
    });
  }
  
  if (categoricalCols.length > 0) {
    lines.push(``, `Key Categorical Columns:`);
    categoricalCols.slice(0, 5).forEach(col => {
      lines.push(`• ${col.name}: ${col.uniqueCount} unique values`);
    });
  }
  
  return lines.join('\n');
}

/**
 * Get columns by type
 */
export function getColumnsByType(profile: DatasetProfile, type: ColumnType): ColumnProfile[] {
  return profile.columns.filter(c => c.type === type);
}

/**
 * Find columns with high null rates
 */
export function findHighNullColumns(profile: DatasetProfile, threshold: number = 0.1): ColumnProfile[] {
  return profile.columns.filter(c => c.nullCount / c.totalCount > threshold);
}

/**
 * Find potential ID columns (high uniqueness)
 */
export function findPotentialIdColumns(profile: DatasetProfile): ColumnProfile[] {
  return profile.columns.filter(c => {
    const uniqueRatio = c.uniqueCount / c.totalCount;
    return uniqueRatio > 0.95 && c.totalCount > 10;
  });
}
