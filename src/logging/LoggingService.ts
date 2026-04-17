/**
 * Logging Service Interface
 * Dedicated logging service storing logs in a dedicated database
 */

import { IAdapter, ILoggingConfig, Result, ILogEntry, LogLevel, Timestamp } from '../../types';

export interface ILogQueryOptions {
  readonly level?: LogLevel;
  readonly levels?: LogLevel[];
  readonly fromTime?: Timestamp;
  readonly toTime?: Timestamp;
  readonly agentId?: string;
  readonly taskId?: string;
  readonly correlationId?: string;
  readonly limit?: number;
  readonly offset?: number;
  readonly search?: string;
  readonly sortBy?: 'timestamp' | 'level';
  readonly sortOrder?: 'ASC' | 'DESC';
}

export interface ILogStats {
  readonly totalLogs: number;
  readonly logsByLevel: Record<LogLevel, number>;
  readonly logsPerMinute?: number;
  readonly errorRate?: number;
  readonly oldestLog?: Timestamp;
  readonly newestLog?: Timestamp;
}

export interface ILogExporter {
  export(format: 'json' | 'csv' | 'ndjson', options?: ILogQueryOptions): Promise<Result<string>>;
}

export interface ILogAlert {
  readonly alertId: string;
  readonly name: string;
  readonly condition: (entry: ILogEntry) => boolean;
  readonly handler: (entries: ILogEntry[]) => Promise<void>;
  readonly enabled: boolean;
}

/**
 * Logging Service Interface - Dedicated storage for all application logs
 */
export interface ILoggingService extends IAdapter<ILoggingConfig, unknown> {
  /**
   * Log a message at the specified level
   */
  log(level: LogLevel, message: string, context?: Record<string, unknown>): Promise<Result<string>>;

  /**
   * Log a fatal message
   */
  fatal(message: string, context?: Record<string, unknown>): Promise<Result<string>>;

  /**
   * Log an error message
   */
  error(message: string, error?: Error, context?: Record<string, unknown>): Promise<Result<string>>;

  /**
   * Log a warning message
   */
  warn(message: string, context?: Record<string, unknown>): Promise<Result<string>>;

  /**
   * Log an info message
   */
  info(message: string, context?: Record<string, unknown>): Promise<Result<string>>;

  /**
   * Log a debug message
   */
  debug(message: string, context?: Record<string, unknown>): Promise<Result<string>>;

  /**
   * Log a trace message
   */
  trace(message: string, context?: Record<string, unknown>): Promise<Result<string>>;

  /**
   * Log with agent context
   */
  logWithContext(
    level: LogLevel,
    message: string,
    agentId: string,
    taskId?: string,
    correlationId?: string,
    context?: Record<string, unknown>
  ): Promise<Result<string>>;

  /**
   * Log an error with full stack trace
   */
  logError(error: Error, context?: Record<string, unknown>): Promise<Result<string>>;

  /**
   * Query logs
   */
  query(options?: ILogQueryOptions): Promise<Result<ILogEntry[]>>;

  /**
   * Get a single log entry by ID
   */
  getById(logId: string): Promise<Result<ILogEntry | null>>;

  /**
   * Get logs by correlation ID (for tracing a request flow)
   */
  getByCorrelationId(correlationId: string): Promise<Result<ILogEntry[]>>;

  /**
   * Get logs by agent ID
   */
  getByAgentId(agentId: string, limit?: number): Promise<Result<ILogEntry[]>>;

  /**
   * Get logs by task ID
   */
  getByTaskId(taskId: string): Promise<Result<ILogEntry[]>>;

  /**
   * Get error logs
   */
  getErrors(fromTime?: Timestamp, toTime?: Timestamp, limit?: number): Promise<Result<ILogEntry[]>>;

  /**
   * Get log statistics
   */
  getStats(timeRange?: { from: Timestamp; to: Timestamp }): Promise<Result<ILogStats>>;

  /**
   * Search logs by text
   */
  search(query: string, options?: ILogQueryOptions): Promise<Result<ILogEntry[]>>;

  /**
   * Aggregate logs by time bucket
   */
  aggregateByTimeBucket(bucketSize: '1m' | '5m' | '15m' | '1h' | '1d', fromTime: Timestamp, toTime: Timestamp): Promise<Result<Array<{
    timestamp: Timestamp;
    count: number;
    byLevel: Record<LogLevel, number>;
  }>>>;

  /**
   * Create a structured log entry
   */
  createLogEntry(entry: Omit<ILogEntry, 'logId' | 'timestamp'>): Promise<Result<ILogEntry>>;

  /**
   * Bulk insert log entries
   */
  bulkInsert(entries: Omit<ILogEntry, 'logId' | 'timestamp'>[]): Promise<Result<number>>;

  /**
   * Delete logs older than a certain date
   */
  deleteOldLogs(beforeDate: Timestamp): Promise<Result<number>>;

  /**
   * Archive logs to cold storage
   */
  archiveLogs(beforeDate: Timestamp): Promise<Result<{ archivedCount: number; archiveLocation: string }>>;

  /**
   * Export logs
   */
  export(format: 'json' | 'csv' | 'ndjson', options?: ILogQueryOptions): Promise<Result<string>>;

  /**
   * Register a log alert
   */
  registerAlert(alert: ILogAlert): Promise<Result<void>>;

  /**
   * Remove a log alert
   */
  removeAlert(alertId: string): Promise<Result<void>>;

  /**
   * List all registered alerts
   */
  listAlerts(): Promise<Result<ILogAlert[]>>;

  /**
   * Set minimum log level dynamically
   */
  setLogLevel(level: LogLevel): Promise<Result<void>>;

  /**
   * Get current log level
   */
  getLogLevel(): Result<LogLevel>;

  /**
   * Flush all pending logs to storage
   */
  flush(): Promise<Result<void>>;

  /**
   * Create a child logger with additional context
   */
  child(context: Record<string, unknown>): ILoggingService;

  /**
   * Start a log session/batch
   */
  startSession(sessionId: string): Promise<Result<void>>;

  /**
   * End a log session/batch
   */
  endSession(sessionId: string): Promise<Result<void>>;

  /**
   * Get logs for a specific session
   */
  getSessionLogs(sessionId: string): Promise<Result<ILogEntry[]>>;

  /**
   * Tail logs in real-time (streaming)
   */
  tail(options?: { levels?: LogLevel[]; filter?: (entry: ILogEntry) => boolean }): AsyncIterable<ILogEntry>;

  /**
   * Get unique values for a context field
   */
  getContextFieldValues(field: string, limit?: number): Promise<Result<string[]>>;

  /**
   * Get log volume by hour for the last 24 hours
   */
  getVolumeByHour(): Promise<Result<Array<{ hour: string; count: number }>>>;

  /**
   * Detect anomalies in log patterns
   */
  detectAnomalies(timeRange: { from: Timestamp; to: Timestamp }): Promise<Result<Array<{
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    affectedLogs: string[];
  }>>>;
}

/**
 * Factory function type for creating logging services
 */
export type LoggingServiceFactory = (config: ILoggingConfig) => ILoggingService;

/**
 * Registry for logging service implementations
 */
export interface ILoggingServiceRegistry {
  register(provider: 'postgres' | 'mongodb' | 'elasticsearch' | 'loki', factory: LoggingServiceFactory): void;
  get(provider: 'postgres' | 'mongodb' | 'elasticsearch' | 'loki'): LoggingServiceFactory;
  has(provider: 'postgres' | 'mongodb' | 'elasticsearch' | 'loki'): boolean;
}
