/**
 * Semantic type definitions for the AI Agent Harness
 * Provides strong typing with semantic meaning
 */

/** Unique identifiers with semantic meaning */
export type AgentId = string & { readonly __brand: unique symbol };
export type EventId = string & { readonly __brand: unique symbol };
export type CorrelationId = string & { readonly __brand: unique symbol };
export type CausationId = string & { readonly __brand: unique symbol };
export type StreamId = string & { readonly __brand: unique symbol };
export type AggregateId = string & { readonly __brand: unique symbol };

/** Timestamp in ISO 8601 format */
export type Timestamp = string;

/** Version number for event sourcing */
export type Version = number;

/** Event types with semantic categorization */
export type DomainEventType = 
  | 'AGENT_CREATED'
  | 'AGENT_UPDATED'
  | 'AGENT_DELETED'
  | 'TASK_RECEIVED'
  | 'TASK_STARTED'
  | 'TASK_COMPLETED'
  | 'TASK_FAILED'
  | 'MESSAGE_SENT'
  | 'MESSAGE_RECEIVED'
  | 'STATE_CHANGED'
  | 'DECISION_MADE'
  | 'ACTION_EXECUTED'
  | 'ERROR_OCCURRED'
  | 'METRIC_RECORDED'
  | 'LOG_ENTRY_CREATED';

/** Queue provider types */
export type QueueProviderType = 'rabbitmq' | 'nats' | 'kafka' | 'bullmq';

/** Database provider types */
export type DatabaseProviderType = 'postgres' | 'mongodb';

/** Cache operations */
export type CacheOperation = 'GET' | 'SET' | 'DELETE' | 'EXISTS' | 'EXPIRE';

/** Vector similarity metrics */
export type SimilarityMetric = 'cosine' | 'euclidean' | 'dotproduct';

/** Graph relationship direction */
export type RelationshipDirection = 'OUTGOING' | 'INCOMING' | 'UNDIRECTED';

/** Log levels */
export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

/** Metric types */
export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';

/** Agent status */
export type AgentStatus = 'IDLE' | 'BUSY' | 'ERROR' | 'STOPPED';

/** Task priority */
export type TaskPriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';

/** Generic UUID type */
export type UUID = `${string}-${string}-${string}-${string}-${string}`;

/** Result types for operations */
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

/** Optional utility type that excludes undefined */
export type Optional<T> = T | undefined;

/** Nullable utility type */
export type Nullable<T> = T | null;

/** Deep partial type */
export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

/** Read-only deep type */
export type DeepReadonly<T> = T extends object
  ? { readonly [P in keyof T]: DeepReadonly<T[P]> }
  : T;

/** Event payload base interface */
export interface IEventPayload {
  readonly timestamp: Timestamp;
  readonly eventType: DomainEventType;
  readonly aggregateId: AggregateId;
  readonly aggregateType: string;
  readonly version: Version;
  readonly correlationId: CorrelationId;
  readonly causationId: CausationId;
  readonly metadata: Record<string, unknown>;
}

/** Base domain event */
export interface IDomainEvent<TData = unknown> extends IEventPayload {
  readonly eventId: EventId;
  readonly data: TData;
}

/** Event store entry */
export interface IEventStoreEntry<TData = unknown> extends IDomainEvent<TData> {
  readonly streamId: StreamId;
  readonly position: number;
  readonly createdAt: Timestamp;
}

/** Agent configuration */
export interface IAgentConfig {
  readonly agentId: AgentId;
  readonly name: string;
  readonly description?: string;
  readonly capabilities: string[];
  readonly maxConcurrency: number;
  readonly timeout: number;
  readonly retryPolicy: IRetryPolicy;
  readonly queueConfig: IQueueConfig;
  readonly cacheConfig: ICacheConfig;
  readonly databaseConfig: IDatabaseConfig;
  readonly graphConfig: IGraphConfig;
  readonly vectorConfig: IVectorConfig;
  readonly eventStoreConfig: IEventStoreConfig;
  readonly loggingConfig: ILoggingConfig;
  readonly metricsConfig: IMetricsConfig;
}

/** Retry policy configuration */
export interface IRetryPolicy {
  readonly maxRetries: number;
  readonly initialDelay: number;
  readonly maxDelay: number;
  readonly backoffMultiplier: number;
  readonly jitter: boolean;
}

/** Queue configuration */
export interface IQueueConfig {
  readonly provider: QueueProviderType;
  readonly connectionUrl: string;
  readonly queueName: string;
  readonly prefetch?: number;
  readonly durable?: boolean;
  readonly autoAck?: boolean;
  readonly deadLetterQueue?: string;
}

/** Cache configuration */
export interface ICacheConfig {
  readonly enabled: boolean;
  readonly connectionUrl: string;
  readonly defaultTTL: number;
  readonly keyPrefix: string;
  readonly maxMemory?: number;
  readonly evictionPolicy?: 'lru' | 'lfu' | 'fifo';
}

/** Database configuration */
export interface IDatabaseConfig {
  readonly provider: DatabaseProviderType;
  readonly connectionUrl: string;
  readonly databaseName: string;
  readonly poolSize?: number;
  readonly ssl?: boolean;
}

/** Graph database configuration */
export interface IGraphConfig {
  readonly enabled: boolean;
  readonly connectionUrl: string;
  readonly databaseName?: string;
  readonly username?: string;
  readonly password?: string;
  readonly encrypted?: boolean;
}

/** Vector database configuration */
export interface IVectorConfig {
  readonly enabled: boolean;
  readonly connectionUrl: string;
  readonly dimensions: number;
  readonly similarityMetric: SimilarityMetric;
  readonly indexName: string;
}

/** Event store configuration */
export interface IEventStoreConfig {
  readonly enabled: boolean;
  readonly connectionUrl: string;
  readonly databaseName: string;
  readonly streamCategory: string;
  readonly snapshotThreshold?: number;
}

/** Logging configuration */
export interface ILoggingConfig {
  readonly enabled: boolean;
  readonly level: LogLevel;
  readonly format: 'json' | 'pretty' | 'simple';
  readonly destination?: 'stdout' | 'file' | 'elasticsearch' | 'loki';
  readonly filePath?: string;
  readonly includeMetadata?: boolean;
}

/** Metrics configuration */
export interface IMetricsConfig {
  readonly enabled: boolean;
  readonly port?: number;
  readonly path?: string;
  readonly defaultLabels?: Record<string, string>;
  readonly histogramBuckets?: number[];
}

/** Task definition */
export interface ITask<TInput = unknown, TOutput = unknown> {
  readonly taskId: UUID;
  readonly agentId: AgentId;
  readonly input: TInput;
  readonly priority: TaskPriority;
  readonly status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  readonly createdAt: Timestamp;
  readonly startedAt?: Timestamp;
  readonly completedAt?: Timestamp;
  readonly output?: TOutput;
  readonly error?: string;
  readonly correlationId: CorrelationId;
  readonly metadata?: Record<string, unknown>;
}

/** Message for queue communication */
export interface IMessage<TPayload = unknown> {
  readonly messageId: UUID;
  readonly messageType: string;
  readonly payload: TPayload;
  readonly correlationId: CorrelationId;
  readonly replyTo?: string;
  readonly expiration?: number;
  readonly priority?: number;
  readonly headers?: Record<string, string>;
  readonly timestamp: Timestamp;
}

/** Log entry structure */
export interface ILogEntry {
  readonly logId: UUID;
  readonly level: LogLevel;
  readonly message: string;
  readonly timestamp: Timestamp;
  readonly agentId?: AgentId;
  readonly taskId?: UUID;
  readonly correlationId?: CorrelationId;
  readonly context: Record<string, unknown>;
  readonly error?: {
    readonly name: string;
    readonly message: string;
    readonly stack?: string;
  };
}

/** Metric record */
export interface IMetricRecord {
  readonly metricId: UUID;
  readonly name: string;
  readonly type: MetricType;
  readonly value: number;
  readonly labels: Record<string, string>;
  readonly timestamp: Timestamp;
  readonly agentId?: AgentId;
  readonly taskId?: UUID;
}

/** Vector embedding */
export interface IVectorEmbedding {
  readonly embeddingId: UUID;
  readonly vector: number[];
  readonly metadata: Record<string, unknown>;
  readonly createdAt: Timestamp;
  readonly updatedAt?: Timestamp;
}

/** Graph node */
export interface IGraphNode {
  readonly nodeId: string;
  readonly labels: string[];
  readonly properties: Record<string, unknown>;
}

/** Graph relationship */
export interface IGraphRelationship {
  readonly relationshipId: string;
  readonly startNodeId: string;
  readonly endNodeId: string;
  readonly type: string;
  readonly direction: RelationshipDirection;
  readonly properties: Record<string, unknown>;
}

/** Query result wrapper */
export interface IQueryResult<T> {
  readonly data: T;
  readonly total?: number;
  readonly page?: number;
  readonly pageSize?: number;
  readonly hasMore?: boolean;
}

/** Health check status */
export interface IHealthStatus {
  readonly status: 'healthy' | 'unhealthy' | 'degraded';
  readonly checks: Record<string, {
    readonly status: 'up' | 'down' | 'degraded';
    readonly latency?: number;
    readonly message?: string;
  }>;
  readonly timestamp: Timestamp;
}

/** Plugin/Hook interface for extensibility */
export interface IPlugin<TContext = unknown> {
  readonly name: string;
  readonly version: string;
  readonly dependencies?: string[];
  initialize?(context: TContext): Promise<void>;
  shutdown?(): Promise<void>;
  onError?(error: Error, context: TContext): Promise<void>;
  onEvent?<T>(event: IDomainEvent<T>, context: TContext): Promise<void>;
}

/** Adapter interface for all providers */
export interface IAdapter<TConfig, TClient> {
  readonly type: string;
  readonly isConnected: boolean;
  connect(config: TConfig): Promise<TClient>;
  disconnect(): Promise<void>;
  healthCheck(): Promise<IHealthStatus>;
}
