// Correlation & Relationship Analysis Module

import { DataRow, CorrelationPair, CorrelationResult, ColumnType } from './types';
import {
  extractNumericValues,
  pearsonCorrelation,
  cramersV,
  detectColumnType,
} from './utils';

/**
 * Determine correlation strength from coefficient
 */
function getCorrelationStrength(coefficient: number): CorrelationPair['strength'] {
  const abs = Math.abs(coefficient);
  if (abs >= 0.7) return 'strong';
  if (abs >= 0.4) return 'moderate';
  if (abs >= 0.2) return 'weak';
  return 'none';
}

/**
 * Calculate correlation matrix for numeric columns
 */
export function calculateCorrelationMatrix(
  rows: DataRow[],
  columns?: string[]
): Record<string, Record<string, number>> {
  if (rows.length === 0) return {};
  
  const allColumns = columns || Object.keys(rows[0]);
  const numericColumns = allColumns.filter(col => {
    const values = rows.map(row => row[col]);
    return detectColumnType(values) === 'numeric';
  });
  
  const matrix: Record<string, Record<string, number>> = {};
  
  for (const col1 of numericColumns) {
    matrix[col1] = {};
    const values1 = extractNumericValues(rows, col1);
    
    for (const col2 of numericColumns) {
      if (col1 === col2) {
        matrix[col1][col2] = 1;
      } else if (matrix[col2]?.[col1] !== undefined) {
        matrix[col1][col2] = matrix[col2][col1];
      } else {
        const values2 = extractNumericValues(rows, col2);
        matrix[col1][col2] = pearsonCorrelation(values1, values2);
      }
    }
  }
  
  return matrix;
}

/**
 * Find strongest correlations from matrix
 */
export function findStrongestCorrelations(
  matrix: Record<string, Record<string, number>>,
  limit: number = 10
): CorrelationPair[] {
  const pairs: CorrelationPair[] = [];
  const columns = Object.keys(matrix);
  
  for (let i = 0; i < columns.length; i++) {
    for (let j = i + 1; j < columns.length; j++) {
      const col1 = columns[i];
      const col2 = columns[j];
      const coefficient = matrix[col1]?.[col2] || 0;
      
      pairs.push({
        column1: col1,
        column2: col2,
        coefficient,
        type: 'pearson',
        strength: getCorrelationStrength(coefficient),
      });
    }
  }
  
  return pairs
    .filter(p => p.strength !== 'none')
    .sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient))
    .slice(0, limit);
}

/**
 * Calculate Cramer's V for categorical column pairs
 */
export function calculateCategoricalCorrelations(
  rows: DataRow[],
  columns?: string[]
): CorrelationPair[] {
  if (rows.length === 0) return [];
  
  const allColumns = columns || Object.keys(rows[0]);
  const categoricalColumns = allColumns.filter(col => {
    const values = rows.map(row => row[col]);
    const type = detectColumnType(values);
    return type === 'categorical' || type === 'boolean';
  });
  
  const pairs: CorrelationPair[] = [];
  
  for (let i = 0; i < categoricalColumns.length; i++) {
    for (let j = i + 1; j < categoricalColumns.length; j++) {
      const col1 = categoricalColumns[i];
      const col2 = categoricalColumns[j];
      
      const values1 = rows.map(row => String(row[col1] ?? ''));
      const values2 = rows.map(row => String(row[col2] ?? ''));
      
      const coefficient = cramersV(values1, values2);
      
      if (coefficient > 0.1) {
        pairs.push({
          column1: col1,
          column2: col2,
          coefficient,
          type: 'cramers_v',
          strength: getCorrelationStrength(coefficient),
        });
      }
    }
  }
  
  return pairs.sort((a, b) => b.coefficient - a.coefficient);
}

/**
 * Perform comprehensive correlation analysis
 */
export function analyzeCorrelations(rows: DataRow[]): CorrelationResult {
  if (rows.length === 0) {
    return {
      matrix: {},
      strongestRelations: [],
      explanation: 'No data available for correlation analysis.',
    };
  }
  
  // Calculate numeric correlations
  const matrix = calculateCorrelationMatrix(rows);
  const numericPairs = findStrongestCorrelations(matrix);
  
  // Calculate categorical correlations
  const categoricalPairs = calculateCategoricalCorrelations(rows);
  
  // Combine and sort all correlations
  const allPairs = [...numericPairs, ...categoricalPairs]
    .sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient))
    .slice(0, 15);
  
  // Generate explanation
  const explanation = generateCorrelationExplanation(numericPairs, categoricalPairs);
  
  return {
    matrix,
    strongestRelations: allPairs,
    explanation,
  };
}

/**
 * Generate human-readable correlation explanation
 */
function generateCorrelationExplanation(
  numericPairs: CorrelationPair[],
  categoricalPairs: CorrelationPair[]
): string {
  const parts: string[] = [];
  
  // Overview
  const strongNumeric = numericPairs.filter(p => p.strength === 'strong');
  const strongCategorical = categoricalPairs.filter(p => p.strength === 'strong');
  
  if (strongNumeric.length === 0 && strongCategorical.length === 0) {
    parts.push(
      'Analysis reveals no strong correlations between variables. ' +
      'This suggests features are largely independent, which can be beneficial for predictive modeling.'
    );
  } else {
    parts.push(
      `Identified ${strongNumeric.length} strong numeric correlation(s) and ` +
      `${strongCategorical.length} strong categorical association(s).`
    );
  }
  
  // Top numeric correlations
  if (strongNumeric.length > 0) {
    const top = strongNumeric[0];
    const direction = top.coefficient > 0 ? 'positive' : 'negative';
    parts.push(
      `The strongest relationship is a ${direction} correlation (r=${top.coefficient.toFixed(2)}) ` +
      `between "${top.column1}" and "${top.column2}".`
    );
    
    if (top.coefficient > 0.9 || top.coefficient < -0.9) {
      parts.push(
        `This very high correlation may indicate redundancy or multicollinearity, ` +
        `suggesting one variable could potentially be removed without significant information loss.`
      );
    }
  }
  
  // Moderate correlations
  const moderatePairs = numericPairs.filter(p => p.strength === 'moderate');
  if (moderatePairs.length > 0) {
    parts.push(
      `Additionally, ${moderatePairs.length} moderate correlation(s) were detected, ` +
      `indicating meaningful but not deterministic relationships.`
    );
  }
  
  // Categorical associations
  if (strongCategorical.length > 0) {
    parts.push(
      `Among categorical variables, notable associations exist that may warrant ` +
      `further investigation for feature engineering or segmentation analysis.`
    );
  }
  
  return parts.join(' ');
}

/**
 * Get correlation for a specific column pair
 */
export function getColumnCorrelation(
  rows: DataRow[],
  column1: string,
  column2: string
): { coefficient: number; strength: string; interpretation: string } {
  const values1 = rows.map(row => row[column1]);
  const values2 = rows.map(row => row[column2]);
  
  const type1 = detectColumnType(values1);
  const type2 = detectColumnType(values2);
  
  let coefficient: number;
  let method: string;
  
  if (type1 === 'numeric' && type2 === 'numeric') {
    coefficient = pearsonCorrelation(
      extractNumericValues(rows, column1),
      extractNumericValues(rows, column2)
    );
    method = 'Pearson';
  } else {
    coefficient = cramersV(
      values1.map(String),
      values2.map(String)
    );
    method = "Cramer's V";
  }
  
  const strength = getCorrelationStrength(coefficient);
  
  let interpretation: string;
  if (strength === 'none') {
    interpretation = `No significant relationship between "${column1}" and "${column2}" (${method}: ${coefficient.toFixed(3)}).`;
  } else {
    const direction = coefficient > 0 ? 'positive' : 'negative';
    interpretation = `${strength.charAt(0).toUpperCase() + strength.slice(1)} ${direction} relationship between "${column1}" and "${column2}" (${method}: ${coefficient.toFixed(3)}).`;
  }
  
  return { coefficient, strength, interpretation };
}

/**
 * Find features most correlated with a target column
 */
export function findCorrelatedFeatures(
  rows: DataRow[],
  targetColumn: string,
  limit: number = 10
): Array<{ column: string; correlation: number; strength: string }> {
  if (rows.length === 0) return [];
  
  const columns = Object.keys(rows[0]).filter(c => c !== targetColumn);
  const targetValues = extractNumericValues(rows, targetColumn);
  
  if (targetValues.length === 0) {
    // Target is categorical, use Cramer's V
    const targetStrings = rows.map(row => String(row[targetColumn] ?? ''));
    return columns.map(col => {
      const colStrings = rows.map(row => String(row[col] ?? ''));
      const correlation = cramersV(targetStrings, colStrings);
      return {
        column: col,
        correlation,
        strength: getCorrelationStrength(correlation),
      };
    })
    .filter(r => r.strength !== 'none')
    .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
    .slice(0, limit);
  }
  
  // Target is numeric, use Pearson
  return columns.map(col => {
    const colValues = extractNumericValues(rows, col);
    const correlation = colValues.length >= 3 
      ? pearsonCorrelation(targetValues, colValues)
      : 0;
    return {
      column: col,
      correlation,
      strength: getCorrelationStrength(correlation),
    };
  })
  .filter(r => r.strength !== 'none')
  .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
  .slice(0, limit);
}
