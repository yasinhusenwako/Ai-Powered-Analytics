// Core Types for AI Data Analysis Engine

export type ColumnType = 'numeric' | 'categorical' | 'datetime' | 'boolean' | 'text';

export interface ColumnProfile {
  name: string;
  type: ColumnType;
  nullCount: number;
  totalCount: number;
  uniqueCount: number;
  min?: number | string | Date;
  max?: number | string | Date;
  mean?: number;
  median?: number;
  mode?: string | number;
  stdDev?: number;
  topValues: Array<{ value: string | number; count: number }>;
}

export interface DatasetProfile {
  rowCount: number;
  columnCount: number;
  columns: ColumnProfile[];
  memoryEstimate: string;
  completeness: number;
}

export interface StatisticalSummary {
  overview: string;
  keyMetrics: Record<string, number | string>;
  distributions: Array<{
    column: string;
    type: string;
    description: string;
  }>;
  outliers: Array<{
    column: string;
    count: number;
    description: string;
  }>;
  correlationHighlights: string[];
  narrative: string;
}

export interface TrendResult {
  column: string;
  direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  strength: number;
  movingAverages: number[];
  seasonality: boolean;
  seasonalPeriod?: number;
  shifts: Array<{
    index: number;
    magnitude: number;
    description: string;
  }>;
  explanation: string;
}

export interface Anomaly {
  rowIndex: number;
  column: string;
  value: number;
  expectedRange: { min: number; max: number };
  score: number;
  type: 'zscore' | 'iqr' | 'spike' | 'drop';
}

export interface AnomalyResult {
  anomalies: Anomaly[];
  anomalyScore: number;
  affectedColumns: string[];
  explanation: string;
}

export interface ForecastResult {
  column: string;
  method: 'linear' | 'exponential' | 'rolling';
  predictions: Array<{
    period: number;
    value: number;
    confidence: { lower: number; upper: number };
  }>;
  trend: string;
  interpretation: string;
}

export interface CorrelationPair {
  column1: string;
  column2: string;
  coefficient: number;
  type: 'pearson' | 'cramers_v';
  strength: 'strong' | 'moderate' | 'weak' | 'none';
}

export interface CorrelationResult {
  matrix: Record<string, Record<string, number>>;
  strongestRelations: CorrelationPair[];
  explanation: string;
}

export interface Insight {
  type: 'observation' | 'recommendation' | 'warning' | 'opportunity';
  category: string;
  title: string;
  description: string;
  importance: 'high' | 'medium' | 'low';
  relatedColumns: string[];
}

export interface InsightResponse {
  query: string;
  intent: 'summary' | 'anomalies' | 'forecast' | 'trends' | 'correlation' | 'explain' | 'profile';
  insights: {
    profile?: DatasetProfile;
    statistics?: StatisticalSummary;
    trends?: TrendResult[];
    anomalies?: AnomalyResult;
    forecasts?: ForecastResult[];
    correlations?: CorrelationResult;
    keyInsights?: Insight[];
  };
  textSummary: string;
  recommendedCharts: string[];
  executiveSummary?: string;
  recommendations?: string[];
}

export type DataRow = Record<string, unknown>;
