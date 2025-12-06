// Main Entry Point - Query → Insight Interface

import { DataRow, InsightResponse } from './types';
import { profileDataset, generateProfileSummary } from './profiler';
import { generateStatisticalSummary, getColumnStats } from './statistics';
import { analyzeTrend, analyzeAllTrends, getTrendSummary } from './trends';
import { detectAllAnomalies, getColumnAnomalySummary } from './anomalies';
import { forecast, forecastAll, getForecastSummary } from './forecasting';
import { analyzeCorrelations, getColumnCorrelation, findCorrelatedFeatures } from './correlations';
import { generateKeyInsights, generateExecutiveSummary, generateRecommendations, suggestVisualizations, generateCompleteAnalysis } from './insights';

type QueryIntent = 'summary' | 'anomalies' | 'forecast' | 'trends' | 'correlation' | 'explain' | 'profile';

/**
 * Detect query intent from natural language
 */
function detectIntent(query: string): { intent: QueryIntent; targetColumn?: string } {
  const lowerQuery = query.toLowerCase();
  
  // Check for specific column mentions
  const columnMatch = query.match(/column\s+["']?(\w+)["']?|["'](\w+)["']\s+column|(?:what|explain|analyze)\s+(?:is|about)?\s*["']?(\w+)["']?/i);
  const targetColumn = columnMatch ? (columnMatch[1] || columnMatch[2] || columnMatch[3]) : undefined;
  
  // Intent detection
  if (lowerQuery.includes('profile') || lowerQuery.includes('overview') || lowerQuery.includes('structure')) {
    return { intent: 'profile', targetColumn };
  }
  
  if (lowerQuery.includes('summar') || lowerQuery.includes('describe') || lowerQuery.includes('tell me about')) {
    return { intent: 'summary', targetColumn };
  }
  
  if (lowerQuery.includes('anomal') || lowerQuery.includes('outlier') || lowerQuery.includes('unusual') || lowerQuery.includes('strange')) {
    return { intent: 'anomalies', targetColumn };
  }
  
  if (lowerQuery.includes('forecast') || lowerQuery.includes('predict') || lowerQuery.includes('future') || lowerQuery.includes('project')) {
    return { intent: 'forecast', targetColumn };
  }
  
  if (lowerQuery.includes('trend') || lowerQuery.includes('pattern') || lowerQuery.includes('over time') || lowerQuery.includes('direction')) {
    return { intent: 'trends', targetColumn };
  }
  
  if (lowerQuery.includes('correlat') || lowerQuery.includes('relation') || lowerQuery.includes('connect') || lowerQuery.includes('affect')) {
    return { intent: 'correlation', targetColumn };
  }
  
  if (lowerQuery.includes('explain') || lowerQuery.includes('what is') || lowerQuery.includes('happening')) {
    return { intent: 'explain', targetColumn };
  }
  
  // Default to summary
  return { intent: 'summary', targetColumn };
}

/**
 * Handle profile queries
 */
function handleProfileQuery(rows: DataRow[]): InsightResponse {
  const profile = profileDataset(rows);
  const summary = generateProfileSummary(profile);
  
  return {
    query: 'Dataset profile',
    intent: 'profile',
    insights: { profile },
    textSummary: summary,
    recommendedCharts: ['bar', 'pie'],
  };
}

/**
 * Handle summary queries
 */
function handleSummaryQuery(rows: DataRow[], targetColumn?: string): InsightResponse {
  const profile = profileDataset(rows);
  
  if (targetColumn) {
    const colProfile = profile.columns.find(c => c.name.toLowerCase() === targetColumn.toLowerCase());
    if (colProfile) {
      const stats = getColumnStats(rows, colProfile.name);
      return {
        query: `Summary of ${targetColumn}`,
        intent: 'summary',
        insights: { profile },
        textSummary: `Column "${colProfile.name}" (${colProfile.type}): ` +
          Object.entries(stats).map(([k, v]) => `${k}: ${v}`).join(', '),
        recommendedCharts: colProfile.type === 'numeric' ? ['histogram', 'box'] : ['bar', 'pie'],
      };
    }
  }
  
  const statistics = generateStatisticalSummary(rows, profile);
  const keyInsights = generateKeyInsights(rows, profile);
  
  return {
    query: 'Dataset summary',
    intent: 'summary',
    insights: { profile, statistics, keyInsights },
    textSummary: statistics.narrative,
    recommendedCharts: suggestVisualizations(profile, keyInsights),
    executiveSummary: generateExecutiveSummary(rows, profile, keyInsights),
    recommendations: generateRecommendations(keyInsights),
  };
}

/**
 * Handle anomaly queries
 */
function handleAnomalyQuery(rows: DataRow[], targetColumn?: string): InsightResponse {
  if (targetColumn) {
    const summary = getColumnAnomalySummary(rows, targetColumn);
    return {
      query: `Anomalies in ${targetColumn}`,
      intent: 'anomalies',
      insights: {
        anomalies: {
          anomalies: summary.topAnomalies,
          anomalyScore: summary.topAnomalies.length > 0 ? summary.topAnomalies[0].score : 0,
          affectedColumns: [targetColumn],
          explanation: `Found ${summary.count} anomalies in "${targetColumn}" with ${summary.severity} severity.`,
        },
      },
      textSummary: `Anomaly analysis for "${targetColumn}": ${summary.count} anomalies detected (severity: ${summary.severity}).`,
      recommendedCharts: ['scatter', 'line', 'box'],
    };
  }
  
  const anomalies = detectAllAnomalies(rows);
  return {
    query: 'Find anomalies',
    intent: 'anomalies',
    insights: { anomalies },
    textSummary: anomalies.explanation,
    recommendedCharts: ['scatter', 'line', 'heatmap'],
  };
}

/**
 * Handle forecast queries
 */
function handleForecastQuery(rows: DataRow[], targetColumn?: string): InsightResponse {
  if (targetColumn) {
    const result = forecast(rows, targetColumn);
    return {
      query: `Forecast ${targetColumn}`,
      intent: 'forecast',
      insights: { forecasts: [result] },
      textSummary: result.interpretation,
      recommendedCharts: ['line', 'area'],
    };
  }
  
  const forecasts = forecastAll(rows);
  return {
    query: 'Generate forecasts',
    intent: 'forecast',
    insights: { forecasts },
    textSummary: getForecastSummary(forecasts),
    recommendedCharts: ['line', 'area'],
  };
}

/**
 * Handle trend queries
 */
function handleTrendQuery(rows: DataRow[], targetColumn?: string): InsightResponse {
  if (targetColumn) {
    const trend = analyzeTrend(rows, targetColumn);
    return {
      query: `Trends in ${targetColumn}`,
      intent: 'trends',
      insights: { trends: [trend] },
      textSummary: trend.explanation,
      recommendedCharts: ['line', 'area'],
    };
  }
  
  const trends = analyzeAllTrends(rows);
  return {
    query: 'Analyze trends',
    intent: 'trends',
    insights: { trends },
    textSummary: getTrendSummary(trends),
    recommendedCharts: ['line', 'area', 'heatmap'],
  };
}

/**
 * Handle correlation queries
 */
function handleCorrelationQuery(rows: DataRow[], targetColumn?: string): InsightResponse {
  const correlations = analyzeCorrelations(rows);
  
  if (targetColumn) {
    const related = findCorrelatedFeatures(rows, targetColumn);
    return {
      query: `Correlations with ${targetColumn}`,
      intent: 'correlation',
      insights: { correlations },
      textSummary: related.length > 0
        ? `Top correlations with "${targetColumn}": ${related.slice(0, 5).map(r => `${r.column} (${r.correlation.toFixed(2)})`).join(', ')}.`
        : `No significant correlations found for "${targetColumn}".`,
      recommendedCharts: ['scatter', 'heatmap'],
    };
  }
  
  return {
    query: 'Explain correlations',
    intent: 'correlation',
    insights: { correlations },
    textSummary: correlations.explanation,
    recommendedCharts: ['heatmap', 'scatter'],
  };
}

/**
 * Handle explain queries (comprehensive analysis of specific aspects)
 */
function handleExplainQuery(rows: DataRow[], targetColumn?: string): InsightResponse {
  const profile = profileDataset(rows);
  
  if (targetColumn) {
    const colProfile = profile.columns.find(c => c.name.toLowerCase() === targetColumn.toLowerCase());
    if (!colProfile) {
      return {
        query: `Explain ${targetColumn}`,
        intent: 'explain',
        insights: { profile },
        textSummary: `Column "${targetColumn}" not found in dataset.`,
        recommendedCharts: [],
      };
    }
    
    const parts: string[] = [];
    parts.push(`"${colProfile.name}" is a ${colProfile.type} column with ${colProfile.totalCount} values (${colProfile.nullCount} null).`);
    
    if (colProfile.type === 'numeric') {
      parts.push(`Range: ${colProfile.min} to ${colProfile.max}, Mean: ${colProfile.mean?.toFixed(2)}, StdDev: ${colProfile.stdDev?.toFixed(2)}.`);
      
      const trend = analyzeTrend(rows, colProfile.name);
      parts.push(`Trend: ${trend.direction} (${(trend.strength * 100).toFixed(0)}% confidence).`);
      
      const anomalySummary = getColumnAnomalySummary(rows, colProfile.name);
      parts.push(`Anomalies: ${anomalySummary.count} detected (${anomalySummary.severity} severity).`);
      
      const related = findCorrelatedFeatures(rows, colProfile.name, 3);
      if (related.length > 0) {
        parts.push(`Top correlations: ${related.map(r => `${r.column} (${r.correlation.toFixed(2)})`).join(', ')}.`);
      }
    } else {
      parts.push(`Unique values: ${colProfile.uniqueCount}. Top values: ${colProfile.topValues.slice(0, 3).map(v => `"${v.value}" (${v.count})`).join(', ')}.`);
    }
    
    return {
      query: `Explain ${targetColumn}`,
      intent: 'explain',
      insights: { profile },
      textSummary: parts.join(' '),
      recommendedCharts: colProfile.type === 'numeric' ? ['line', 'histogram', 'scatter'] : ['bar', 'pie'],
    };
  }
  
  // Full explain without target
  return generateCompleteAnalysis(rows);
}

/**
 * Main analyze function - Query → Insight Interface
 */
export async function analyze(query: string, dataset: DataRow[]): Promise<InsightResponse> {
  if (!dataset || dataset.length === 0) {
    return {
      query,
      intent: 'summary',
      insights: {},
      textSummary: 'No data provided for analysis. Please provide a valid dataset.',
      recommendedCharts: [],
    };
  }
  
  const { intent, targetColumn } = detectIntent(query);
  
  switch (intent) {
    case 'profile':
      return handleProfileQuery(dataset);
    case 'summary':
      return handleSummaryQuery(dataset, targetColumn);
    case 'anomalies':
      return handleAnomalyQuery(dataset, targetColumn);
    case 'forecast':
      return handleForecastQuery(dataset, targetColumn);
    case 'trends':
      return handleTrendQuery(dataset, targetColumn);
    case 'correlation':
      return handleCorrelationQuery(dataset, targetColumn);
    case 'explain':
      return handleExplainQuery(dataset, targetColumn);
    default:
      return handleSummaryQuery(dataset, targetColumn);
  }
}

// Re-export all modules for direct access
export * from './types';
export * from './profiler';
export * from './statistics';
export * from './trends';
export * from './anomalies';
export * from './forecasting';
export * from './correlations';
export * from './insights';
export * from './utils';
