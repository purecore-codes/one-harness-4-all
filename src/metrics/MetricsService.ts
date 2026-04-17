/**
 * Metrics Service Interface
 * Dedicated metrics service storing metrics in a dedicated database
 * Compatible with Prometheus, Grafana, and other monitoring systems
 */

import { IAdapter, IMetricsConfig, Result, IMetricRecord, MetricType, Timestamp } from '../../types';

export interface IMetricLabel {
  readonly name: string;
  readonly value: string;
}

export interface IMetricQueryOptions {
  readonly name?: string;
  readonly names?: string[];
  readonly labels?: Record<string, string>;
  readonly fromTime?: Timestamp;
  readonly toTime?: Timestamp;
  readonly limit?: number;
  readonly aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'rate' | 'irate';
  readonly groupBy?: string[];
  readonly step?: string; // e.g., '1m', '5m', '1h'
}

export interface IMetricStats {
  readonly totalMetrics: number;
  readonly metricsByType: Record<MetricType, number>;
  readonly activeMetrics: number;
  readonly staleMetrics: number;
  readonly oldestMetric?: Timestamp;
  readonly newestMetric?: Timestamp;
  readonly samplesPerSecond?: number;
}

export interface IAlertRule {
  readonly alertId: string;
  readonly name: string;
  readonly metricName: string;
  readonly condition: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne';
  readonly threshold: number;
  readonly forDuration: number; // milliseconds
  readonly labels?: Record<string, string>;
  readonly annotations?: Record<string, string>;
  readonly handler: (metric: IMetricRecord) => Promise<void>;
  readonly enabled: boolean;
}

export interface IDashboard {
  readonly dashboardId: string;
  readonly name: string;
  readonly description?: string;
  readonly panels: Array<{
    readonly panelId: string;
    readonly title: string;
    readonly type: 'graph' | 'gauge' | 'stat' | 'table' | 'heatmap';
    readonly queries: Array<{
      readonly metricName: string;
      readonly aggregation?: string;
      readonly labels?: Record<string, string>;
    }>;
  }>;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export interface IRecordingRule {
  readonly ruleId: string;
  readonly name: string;
  readonly query: string;
  readonly labels?: Record<string, string>;
  readonly interval: number; // milliseconds
}

/**
 * Metrics Service Interface - Dedicated storage for all application metrics
 */
export interface IMetricsService extends IAdapter<IMetricsConfig, unknown> {
  /**
   * Record a counter metric
   */
  incrementCounter(name: string, value?: number, labels?: Record<string, string>): Promise<Result<void>>;

  /**
   * Set a gauge metric
   */
  setGauge(name: string, value: number, labels?: Record<string, string>): Promise<Result<void>>;

  /**
   * Increment a gauge metric
   */
  incrementGauge(name: string, value?: number, labels?: Record<string, string>): Promise<Result<void>>;

  /**
   * Decrement a gauge metric
   */
  decrementGauge(name: string, value?: number, labels?: Record<string, string>): Promise<Result<void>>;

  /**
   * Record a histogram observation
   */
  observeHistogram(name: string, value: number, labels?: Record<string, string>): Promise<Result<void>>;

  /**
   * Record a summary observation
   */
  observeSummary(name: string, value: number, labels?: Record<string, string>): Promise<Result<void>>;

  /**
   * Record a custom metric
   */
  recordMetric(metric: Omit<IMetricRecord, 'metricId' | 'timestamp'>): Promise<Result<string>>;

  /**
   * Record multiple metrics in batch
   */
  recordBatch(metrics: Array<Omit<IMetricRecord, 'metricId' | 'timestamp'>>): Promise<Result<number>>;

  /**
   * Query metrics
   */
  query(options?: IMetricQueryOptions): Promise<Result<IMetricRecord[]>>;

  /**
   * Query instant value (latest value)
   */
  queryInstant(name: string, labels?: Record<string, string>): Promise<Result<IMetricRecord | null>>;

  /**
   * Query range (time series data)
   */
  queryRange(name: string, options: {
    from: Timestamp;
    to: Timestamp;
    step?: string;
    labels?: Record<string, string>;
  }): Promise<Result<Array<{ timestamp: Timestamp; value: number }>>>;

  /**
   * Get metric statistics
   */
  getStats(timeRange?: { from: Timestamp; to: Timestamp }): Promise<Result<IMetricStats>>;

  /**
   * Get all metric names
   */
  getMetricNames(pattern?: string): Promise<Result<string[]>>;

  /**
   * Get label names for a metric
   */
  getLabelNames(metricName: string): Promise<Result<string[]>>;

  /**
   * Get label values for a label name
   */
  getLabelValues(labelName: string, metricName?: string): Promise<Result<string[]>>;

  /**
   * Delete a metric
   */
  deleteMetric(name: string, labels?: Record<string, string>): Promise<Result<number>>;

  /**
   * Delete old metrics
   */
  deleteOldMetrics(beforeDate: Timestamp): Promise<Result<number>>;

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheus(): Promise<Result<string>>;

  /**
   * Export metrics in JSON format
   */
  exportJSON(options?: IMetricQueryOptions): Promise<Result<string>>;

  /**
   * Import metrics from JSON
   */
  importJSON(jsonData: string): Promise<Result<number>>;

  /**
   * Register an alert rule
   */
  registerAlert(alert: IAlertRule): Promise<Result<void>>;

  /**
   * Remove an alert rule
   */
  removeAlert(alertId: string): Promise<Result<void>>;

  /**
   * List all alert rules
   */
  listAlerts(): Promise<Result<IAlertRule[]>>;

  /**
   * Trigger an alert manually
   */
  triggerAlert(alertId: string, metric: IMetricRecord): Promise<Result<void>>;

  /**
   * Create a recording rule
   */
  registerRecordingRule(rule: IRecordingRule): Promise<Result<void>>;

  /**
   * Remove a recording rule
   */
  removeRecordingRule(ruleId: string): Promise<Result<void>>;

  /**
   * List all recording rules
   */
  listRecordingRules(): Promise<Result<IRecordingRule[]>>;

  /**
   * Create a dashboard
   */
  createDashboard(dashboard: Omit<IDashboard, 'dashboardId' | 'createdAt' | 'updatedAt'>): Promise<Result<IDashboard>>;

  /**
   * Update a dashboard
   */
  updateDashboard(dashboardId: string, updates: Partial<IDashboard>): Promise<Result<IDashboard>>;

  /**
   * Get a dashboard
   */
  getDashboard(dashboardId: string): Promise<Result<IDashboard | null>>;

  /**
   * Delete a dashboard
   */
  deleteDashboard(dashboardId: string): Promise<Result<void>>;

  /**
   * List all dashboards
   */
  listDashboards(): Promise<Result<Pick<IDashboard, 'dashboardId' | 'name' | 'description'>[]>>;

  /**
   * Start HTTP server for Prometheus scraping
   */
  startPrometheusServer(port?: number, path?: string): Promise<Result<void>>;

  /**
   * Stop HTTP server
   */
  stopPrometheusServer(): Promise<Result<void>>;

  /**
   * Get Prometheus metrics endpoint content
   */
  getPrometheusMetrics(): Promise<Result<string>>;

  /**
   * Calculate rate of change for a counter
   */
  calculateRate(metricName: string, window: string, labels?: Record<string, string>): Promise<Result<number>>;

  /**
   * Calculate percentile from histogram
   */
  calculatePercentile(metricName: string, percentile: number, labels?: Record<string, string>): Promise<Result<number>>;

  /**
   * Get aggregated metrics by time bucket
   */
  aggregateByTimeBucket(
    metricName: string,
    bucketSize: string,
    fromTime: Timestamp,
    toTime: Timestamp,
    aggregation?: string
  ): Promise<Result<Array<{
    timestamp: Timestamp;
    value: number;
    count?: number;
    sum?: number;
    avg?: number;
    min?: number;
    max?: number;
  }>>>;

  /**
   * Detect anomalies in metrics
   */
  detectAnomalies(metricName: string, timeRange: { from: Timestamp; to: Timestamp }): Promise<Result<Array<{
    timestamp: Timestamp;
    value: number;
    expectedValue: number;
    deviation: number;
    severity: 'low' | 'medium' | 'high';
  }>>>;

  /**
   * Create a custom collector
   */
  registerCollector(name: string, collectFn: () => Promise<IMetricRecord[]>): Promise<Result<void>>;

  /**
   * Remove a custom collector
   */
  unregisterCollector(name: string): Promise<Result<void>>;

  /**
   * Get all registered collectors
   */
  listCollectors(): Promise<Result<string[]>>;

  /**
   * Reset a metric to initial state
   */
  resetMetric(name: string, labels?: Record<string, string>): Promise<Result<void>>;

  /**
   * Reset all metrics
   */
  resetAllMetrics(): Promise<Result<void>>;

  /**
   * Get memory usage of metrics store
   */
  getMemoryUsage(): Promise<Result<{
    heapUsed: number;
    heapTotal: number;
    external: number;
    arrayBuffers: number;
  }>>;
}

/**
 * Factory function type for creating metrics services
 */
export type MetricsServiceFactory = (config: IMetricsConfig) => IMetricsService;

/**
 * Registry for metrics service implementations
 */
export interface IMetricsServiceRegistry {
  register(provider: 'postgres' | 'mongodb' | 'prometheus' | 'influxdb', factory: MetricsServiceFactory): void;
  get(provider: 'postgres' | 'mongodb' | 'prometheus' | 'influxdb'): MetricsServiceFactory;
  has(provider: 'postgres' | 'mongodb' | 'prometheus' | 'influxdb'): boolean;
}
