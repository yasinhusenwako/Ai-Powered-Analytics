// Statistical Summary Generator

import { DataRow, DatasetProfile, StatisticalSummary, ColumnProfile } from './types';
import {
  extractNumericValues,
  mean,
  standardDeviation,
  percentile,
  quartiles,
  pearsonCorrelation,
  formatNumber,
} from './utils';
import { profileDataset, getColumnsByType } from './profiler';

/**
 * Detect distribution type for a numeric column
 */
function detectDistribution(values: number[]): { type: string; description: string } {
  if (values.length < 10) {
    return { type: 'insufficient_data', description: 'Not enough data points' };
  }
  
  const avg = mean(values);
  const std = standardDeviation(values);
  const q = quartiles(values);
  const skewness = values.reduce((sum, v) => sum + Math.pow((v - avg) / std, 3), 0) / values.length;
  
  if (Math.abs(skewness) < 0.5) {
    return { type: 'normal', description: 'Approximately normal distribution' };
  } else if (skewness > 1) {
    return { type: 'right_skewed', description: 'Right-skewed (positive skew) distribution' };
  } else if (skewness < -1) {
    return { type: 'left_skewed', description: 'Left-skewed (negative skew) distribution' };
  }
  
  // Check for bimodal
  const p25 = percentile(values, 25);
  const p75 = percentile(values, 75);
  const midRange = values.filter(v => v >= p25 && v <= p75);
  if (midRange.length < values.length * 0.3) {
    return { type: 'bimodal', description: 'Potentially bimodal distribution' };
  }
  
  return { type: 'unknown', description: 'Non-standard distribution pattern' };
}

/**
 * Find outliers using IQR method
 */
function findOutliers(values: number[]): { count: number; values: number[] } {
  if (values.length < 4) return { count: 0, values: [] };
  
  const q = quartiles(values);
  const iqr = q.q3 - q.q1;
  const lowerBound = q.q1 - 1.5 * iqr;
  const upperBound = q.q3 + 1.5 * iqr;
  
  const outliers = values.filter(v => v < lowerBound || v > upperBound);
  return { count: outliers.length, values: outliers.slice(0, 10) };
}

/**
 * Generate statistical summary for a dataset
 */
export function generateStatisticalSummary(rows: DataRow[], profile?: DatasetProfile): StatisticalSummary {
  const dataProfile = profile || profileDataset(rows);
  const numericColumns = getColumnsByType(dataProfile, 'numeric');
  
  // Key metrics
  const keyMetrics: Record<string, number | string> = {
    totalRows: dataProfile.rowCount,
    totalColumns: dataProfile.columnCount,
    completeness: `${dataProfile.completeness}%`,
    numericColumns: numericColumns.length,
  };
  
  // Add summary stats for numeric columns
  numericColumns.slice(0, 5).forEach(col => {
    if (col.mean !== undefined) {
      keyMetrics[`${col.name}_mean`] = formatNumber(col.mean);
    }
  });
  
  // Distributions
  const distributions = numericColumns.map(col => {
    const values = extractNumericValues(rows, col.name);
    const dist = detectDistribution(values);
    return {
      column: col.name,
      type: dist.type,
      description: dist.description,
    };
  });
  
  // Outliers
  const outliers = numericColumns.map(col => {
    const values = extractNumericValues(rows, col.name);
    const { count, values: outlierValues } = findOutliers(values);
    const percentage = values.length > 0 ? ((count / values.length) * 100).toFixed(1) : '0';
    return {
      column: col.name,
      count,
      description: count > 0 
        ? `${count} outliers detected (${percentage}% of values)`
        : 'No significant outliers',
    };
  }).filter(o => o.count > 0);
  
  // Correlation highlights
  const correlationHighlights: string[] = [];
  if (numericColumns.length >= 2) {
    for (let i = 0; i < Math.min(numericColumns.length, 5); i++) {
      for (let j = i + 1; j < Math.min(numericColumns.length, 5); j++) {
        const col1 = numericColumns[i];
        const col2 = numericColumns[j];
        const values1 = extractNumericValues(rows, col1.name);
        const values2 = extractNumericValues(rows, col2.name);
        const corr = pearsonCorrelation(values1, values2);
        
        if (Math.abs(corr) > 0.7) {
          const direction = corr > 0 ? 'positive' : 'negative';
          correlationHighlights.push(
            `Strong ${direction} correlation (${corr.toFixed(2)}) between ${col1.name} and ${col2.name}`
          );
        }
      }
    }
  }
  
  // Generate narrative
  const narrative = generateNarrative(dataProfile, numericColumns, outliers, correlationHighlights);
  
  return {
    overview: `Dataset contains ${dataProfile.rowCount.toLocaleString()} records across ${dataProfile.columnCount} variables with ${dataProfile.completeness}% data completeness.`,
    keyMetrics,
    distributions,
    outliers,
    correlationHighlights,
    narrative,
  };
}

/**
 * Generate human-readable narrative
 */
function generateNarrative(
  profile: DatasetProfile,
  numericColumns: ColumnProfile[],
  outliers: Array<{ column: string; count: number; description: string }>,
  correlations: string[]
): string {
  const paragraphs: string[] = [];
  
  // Paragraph 1: Overview
  const numericPct = profile.columnCount > 0 
    ? Math.round((numericColumns.length / profile.columnCount) * 100) 
    : 0;
  paragraphs.push(
    `This dataset comprises ${profile.rowCount.toLocaleString()} observations with ${profile.columnCount} features. ` +
    `Approximately ${numericPct}% of the variables are numeric, enabling quantitative analysis. ` +
    `The overall data completeness stands at ${profile.completeness}%, indicating ${
      profile.completeness >= 95 ? 'excellent' : profile.completeness >= 80 ? 'good' : 'moderate'
    } data quality.`
  );
  
  // Paragraph 2: Key findings
  if (numericColumns.length > 0) {
    const topCol = numericColumns[0];
    const rangeDescription = topCol.min !== undefined && topCol.max !== undefined
      ? `ranging from ${formatNumber(topCol.min as number)} to ${formatNumber(topCol.max as number)}`
      : '';
    
    paragraphs.push(
      `Key numeric variables show diverse distributions. ` +
      `The primary metric "${topCol.name}" ${rangeDescription} with a mean of ${
        topCol.mean !== undefined ? formatNumber(topCol.mean) : 'N/A'
      }. ` +
      `${outliers.length > 0 
        ? `Notable outliers were detected in ${outliers.length} column(s), warranting further investigation.`
        : 'No significant outliers were detected in the primary variables.'
      }`
    );
  }
  
  // Paragraph 3: Relationships and recommendations
  if (correlations.length > 0) {
    paragraphs.push(
      `Analysis reveals ${correlations.length} significant correlation(s) between variables. ` +
      correlations[0] + '. ' +
      `These relationships may indicate underlying patterns or potential multicollinearity in predictive modeling.`
    );
  } else {
    paragraphs.push(
      `Initial correlation analysis shows no strong linear relationships between numeric variables. ` +
      `This suggests either independent features or potential non-linear relationships that may require further investigation using advanced techniques.`
    );
  }
  
  return paragraphs.join('\n\n');
}

/**
 * Get quick stats for a specific column
 */
export function getColumnStats(rows: DataRow[], columnName: string): Record<string, number | string> {
  const values = extractNumericValues(rows, columnName);
  if (values.length === 0) return { error: 'No numeric values found' };
  
  const q = quartiles(values);
  return {
    count: values.length,
    min: formatNumber(Math.min(...values)),
    max: formatNumber(Math.max(...values)),
    mean: formatNumber(mean(values)),
    std: formatNumber(standardDeviation(values)),
    q25: formatNumber(q.q1),
    median: formatNumber(q.q2),
    q75: formatNumber(q.q3),
  };
}
