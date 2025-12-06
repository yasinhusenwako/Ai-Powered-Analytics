// AI Data Analysis Engine - Main Export

export { analyze } from './analyze';

// Types
export type {
  ColumnType,
  ColumnProfile,
  DatasetProfile,
  StatisticalSummary,
  TrendResult,
  Anomaly,
  AnomalyResult,
  ForecastResult,
  CorrelationPair,
  CorrelationResult,
  Insight,
  InsightResponse,
  DataRow,
} from './types';

// Profiling
export {
  profileDataset,
  profileColumn,
  generateProfileSummary,
  getColumnsByType,
  findHighNullColumns,
  findPotentialIdColumns,
} from './profiler';

// Statistics
export {
  generateStatisticalSummary,
  getColumnStats,
} from './statistics';

// Trends
export {
  analyzeTrend,
  analyzeAllTrends,
  getTrendSummary,
} from './trends';

// Anomalies
export {
  detectColumnAnomalies,
  detectAllAnomalies,
  getColumnAnomalySummary,
} from './anomalies';

// Forecasting
export {
  forecast,
  forecastAll,
  getForecastSummary,
} from './forecasting';

// Correlations
export {
  calculateCorrelationMatrix,
  findStrongestCorrelations,
  analyzeCorrelations,
  getColumnCorrelation,
  findCorrelatedFeatures,
} from './correlations';

// Insights
export {
  generateKeyInsights,
  generateExecutiveSummary,
  generateRecommendations,
  suggestVisualizations,
  generateCompleteAnalysis,
} from './insights';

// Utilities
export {
  detectColumnType,
  extractNumericValues,
  mean,
  median,
  mode,
  standardDeviation,
  percentile,
  quartiles,
  zScore,
  linearRegression,
  movingAverage,
  exponentialSmoothing,
  pearsonCorrelation,
  cramersV,
  formatNumber,
  topFrequentValues,
} from './utils';
