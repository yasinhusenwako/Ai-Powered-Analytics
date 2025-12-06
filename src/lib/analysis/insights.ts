// Insight Generation Module

import { DataRow, DatasetProfile, Insight, InsightResponse } from './types';
import { profileDataset, generateProfileSummary, findHighNullColumns, findPotentialIdColumns } from './profiler';
import { generateStatisticalSummary } from './statistics';
import { analyzeAllTrends, getTrendSummary } from './trends';
import { detectAllAnomalies } from './anomalies';
import { forecastAll, getForecastSummary } from './forecasting';
import { analyzeCorrelations, findCorrelatedFeatures } from './correlations';
import { mean, standardDeviation, formatNumber } from './utils';

/**
 * Generate key insights from all analysis modules
 */
export function generateKeyInsights(
  rows: DataRow[],
  profile: DatasetProfile
): Insight[] {
  const insights: Insight[] = [];
  
  // Data quality insights
  const highNullCols = findHighNullColumns(profile, 0.1);
  if (highNullCols.length > 0) {
    insights.push({
      type: 'warning',
      category: 'Data Quality',
      title: 'Missing Data Detected',
      description: `${highNullCols.length} column(s) have more than 10% missing values: ${highNullCols.map(c => c.name).join(', ')}. Consider imputation or investigation.`,
      importance: highNullCols.some(c => c.nullCount / c.totalCount > 0.3) ? 'high' : 'medium',
      relatedColumns: highNullCols.map(c => c.name),
    });
  }
  
  // ID column detection
  const idCols = findPotentialIdColumns(profile);
  if (idCols.length > 0) {
    insights.push({
      type: 'observation',
      category: 'Data Structure',
      title: 'Potential Identifier Columns',
      description: `Columns "${idCols.map(c => c.name).join(', ')}" appear to be unique identifiers and may not be useful for analysis.`,
      importance: 'low',
      relatedColumns: idCols.map(c => c.name),
    });
  }
  
  // Anomaly insights
  const anomalyResult = detectAllAnomalies(rows);
  if (anomalyResult.anomalies.length > 0) {
    const highSeverity = anomalyResult.anomalies.filter(a => a.score > 0.8);
    insights.push({
      type: highSeverity.length > 5 ? 'warning' : 'observation',
      category: 'Anomalies',
      title: 'Anomalous Data Points Detected',
      description: `Found ${anomalyResult.anomalies.length} anomalies across ${anomalyResult.affectedColumns.length} column(s). ${highSeverity.length > 0 ? `${highSeverity.length} require immediate attention.` : ''}`,
      importance: highSeverity.length > 5 ? 'high' : 'medium',
      relatedColumns: anomalyResult.affectedColumns,
    });
  }
  
  // Trend insights
  const trends = analyzeAllTrends(rows);
  const increasingTrends = trends.filter(t => t.direction === 'increasing' && t.strength > 0.5);
  const decreasingTrends = trends.filter(t => t.direction === 'decreasing' && t.strength > 0.5);
  
  if (increasingTrends.length > 0) {
    insights.push({
      type: 'opportunity',
      category: 'Trends',
      title: 'Growth Trends Identified',
      description: `${increasingTrends.length} metric(s) showing significant upward trends: ${increasingTrends.map(t => t.column).join(', ')}.`,
      importance: 'high',
      relatedColumns: increasingTrends.map(t => t.column),
    });
  }
  
  if (decreasingTrends.length > 0) {
    insights.push({
      type: 'warning',
      category: 'Trends',
      title: 'Declining Trends Detected',
      description: `${decreasingTrends.length} metric(s) showing downward trends: ${decreasingTrends.map(t => t.column).join(', ')}. Investigation recommended.`,
      importance: 'high',
      relatedColumns: decreasingTrends.map(t => t.column),
    });
  }
  
  // Correlation insights
  const correlations = analyzeCorrelations(rows);
  const strongCorr = correlations.strongestRelations.filter(c => c.strength === 'strong');
  
  if (strongCorr.length > 0) {
    const multicollinear = strongCorr.filter(c => Math.abs(c.coefficient) > 0.9);
    if (multicollinear.length > 0) {
      insights.push({
        type: 'warning',
        category: 'Correlations',
        title: 'Potential Multicollinearity',
        description: `Very high correlations (>0.9) detected between ${multicollinear.length} variable pair(s). This may cause issues in predictive models.`,
        importance: 'medium',
        relatedColumns: [...new Set(multicollinear.flatMap(c => [c.column1, c.column2]))],
      });
    } else {
      insights.push({
        type: 'observation',
        category: 'Correlations',
        title: 'Strong Variable Relationships',
        description: `Identified ${strongCorr.length} strong correlation(s) that may indicate important relationships or dependencies.`,
        importance: 'medium',
        relatedColumns: [...new Set(strongCorr.flatMap(c => [c.column1, c.column2]))],
      });
    }
  }
  
  // Distribution insights
  const numericCols = profile.columns.filter(c => c.type === 'numeric');
  const highVarianceCols = numericCols.filter(c => {
    if (c.stdDev === undefined || c.mean === undefined || c.mean === 0) return false;
    return Math.abs(c.stdDev / c.mean) > 1;
  });
  
  if (highVarianceCols.length > 0) {
    insights.push({
      type: 'observation',
      category: 'Distribution',
      title: 'High Variance Columns',
      description: `${highVarianceCols.length} column(s) show high coefficient of variation: ${highVarianceCols.map(c => c.name).join(', ')}. Consider normalization.`,
      importance: 'low',
      relatedColumns: highVarianceCols.map(c => c.name),
    });
  }
  
  // Sort by importance
  const importanceOrder = { high: 0, medium: 1, low: 2 };
  return insights.sort((a, b) => importanceOrder[a.importance] - importanceOrder[b.importance]);
}

/**
 * Generate executive summary
 */
export function generateExecutiveSummary(
  rows: DataRow[],
  profile: DatasetProfile,
  insights: Insight[]
): string {
  const parts: string[] = [];
  
  // Dataset overview
  parts.push(
    `Analysis of ${profile.rowCount.toLocaleString()} records across ${profile.columnCount} variables ` +
    `reveals a dataset with ${profile.completeness}% completeness.`
  );
  
  // Key findings
  const highPriorityInsights = insights.filter(i => i.importance === 'high');
  if (highPriorityInsights.length > 0) {
    parts.push(
      `${highPriorityInsights.length} high-priority finding(s) require attention: ` +
      highPriorityInsights.map(i => i.title.toLowerCase()).join(', ') + '.'
    );
  }
  
  // Opportunities
  const opportunities = insights.filter(i => i.type === 'opportunity');
  if (opportunities.length > 0) {
    parts.push(
      `Notable opportunities identified include ${opportunities.map(o => o.title.toLowerCase()).join(' and ')}.`
    );
  }
  
  // Warnings
  const warnings = insights.filter(i => i.type === 'warning');
  if (warnings.length > 0) {
    parts.push(
      `Areas requiring investigation: ${warnings.map(w => w.title.toLowerCase()).join(', ')}.`
    );
  }
  
  return parts.join(' ');
}

/**
 * Generate recommendations based on insights
 */
export function generateRecommendations(insights: Insight[]): string[] {
  const recommendations: string[] = [];
  
  for (const insight of insights) {
    if (insight.type === 'warning' && insight.category === 'Data Quality') {
      recommendations.push(
        `Address missing data in ${insight.relatedColumns.join(', ')} through imputation or removal.`
      );
    }
    
    if (insight.type === 'warning' && insight.category === 'Anomalies') {
      recommendations.push(
        `Investigate anomalous values in ${insight.relatedColumns.join(', ')} to determine if they are errors or genuine outliers.`
      );
    }
    
    if (insight.type === 'opportunity' && insight.category === 'Trends') {
      recommendations.push(
        `Capitalize on growth trends in ${insight.relatedColumns.join(', ')} by allocating resources to these areas.`
      );
    }
    
    if (insight.type === 'warning' && insight.category === 'Trends') {
      recommendations.push(
        `Address declining metrics in ${insight.relatedColumns.join(', ')} through root cause analysis.`
      );
    }
    
    if (insight.type === 'warning' && insight.category === 'Correlations') {
      recommendations.push(
        `Consider dimensionality reduction or feature selection to address multicollinearity.`
      );
    }
  }
  
  // General recommendations
  recommendations.push(
    'Establish ongoing monitoring for key metrics to track changes over time.'
  );
  
  return recommendations.slice(0, 7);
}

/**
 * Suggest appropriate visualizations
 */
export function suggestVisualizations(
  profile: DatasetProfile,
  insights: Insight[]
): string[] {
  const suggestions: string[] = [];
  
  const numericCols = profile.columns.filter(c => c.type === 'numeric').length;
  const categoricalCols = profile.columns.filter(c => c.type === 'categorical').length;
  const datetimeCols = profile.columns.filter(c => c.type === 'datetime').length;
  
  // Time series
  if (datetimeCols > 0 && numericCols > 0) {
    suggestions.push('line');
    suggestions.push('area');
  }
  
  // Distributions
  if (numericCols > 0) {
    suggestions.push('histogram');
    suggestions.push('box');
  }
  
  // Categorical analysis
  if (categoricalCols > 0) {
    suggestions.push('bar');
    suggestions.push('pie');
  }
  
  // Correlations
  if (numericCols >= 2) {
    suggestions.push('scatter');
    suggestions.push('heatmap');
  }
  
  // Based on insights
  const hasAnomalies = insights.some(i => i.category === 'Anomalies');
  if (hasAnomalies) {
    suggestions.push('scatter');
  }
  
  const hasTrends = insights.some(i => i.category === 'Trends');
  if (hasTrends) {
    suggestions.push('line');
  }
  
  return [...new Set(suggestions)];
}

/**
 * Generate complete insight response
 */
export function generateCompleteAnalysis(rows: DataRow[]): InsightResponse {
  const profile = profileDataset(rows);
  const statistics = generateStatisticalSummary(rows, profile);
  const trends = analyzeAllTrends(rows);
  const anomalies = detectAllAnomalies(rows);
  const forecasts = forecastAll(rows);
  const correlations = analyzeCorrelations(rows);
  const keyInsights = generateKeyInsights(rows, profile);
  const executiveSummary = generateExecutiveSummary(rows, profile, keyInsights);
  const recommendations = generateRecommendations(keyInsights);
  const charts = suggestVisualizations(profile, keyInsights);
  
  return {
    query: 'Complete dataset analysis',
    intent: 'summary',
    insights: {
      profile,
      statistics,
      trends,
      anomalies,
      forecasts,
      correlations,
      keyInsights,
    },
    textSummary: statistics.narrative,
    recommendedCharts: charts,
    executiveSummary,
    recommendations,
  };
}
