/**
 * Core Agent Harness
 * Main orchestrator that brings together all adapters and services
 */

import { 
  IAgentConfig, 
  ITask, 
  AgentStatus as IAgentStatus,
  AgentId,
  UUID,
  CorrelationId,
  Result,
  IPlugin,
  IHealthStatus,
  Timestamp
} from '../types';
import { IQueueAdapter } from '../adapters/queue/IQueueAdapter';
import { ICacheAdapter } from '../adapters/cache/ICacheAdapter';
import { IDatabaseAdapter } from '../adapters/database/IDatabaseAdapter';
import { IGraphAdapter } from '../adapters/graph/IGraphAdapter';
import { IVectorAdapter } from '../adapters/vector/IVectorAdapter';
import { IEventStore } from '../eventstore/EventStore';
import { ILoggingService } from '../logging/LoggingService';
import { IMetricsService } from '../metrics/MetricsService';

export interface IAgentContext {
  readonly agentId: AgentId;
  readonly taskId?: UUID;
  readonly correlationId: CorrelationId;
  readonly metadata: Record<string, unknown>;
}

export interface IAgentExecutionResult<TOutput = unknown> {
  readonly success: boolean;
  readonly output?: TOutput;
  readonly error?: Error;
  readonly duration: number;
  readonly metrics: {
    queueTime: number;
    executionTime: number;
    cacheHits: number;
    cacheMisses: number;
    dbQueries: number;
    vectorSearches: number;
    graphTraversals: number;
  };
}

export interface ITaskHandler<TInput = unknown, TOutput = unknown> {
  (task: ITask<TInput, TOutput>, context: IAgentContext): Promise<TOutput>;
}

export interface IAgentMiddleware<TContext = IAgentContext> {
  readonly name: string;
  readonly priority?: number;
  beforeExecute?(context: TContext): Promise<void>;
  afterExecute?(context: TContext, result?: unknown, error?: Error): Promise<void>;
  onError?(context: TContext, error: Error): Promise<void>;
}

export interface IAgentState {
  readonly status: IAgentStatus;
  readonly currentTask?: UUID;
  readonly completedTasks: number;
  readonly failedTasks: number;
  readonly lastActivity?: Timestamp;
  readonly startedAt?: Timestamp;
  readonly metadata: Record<string, unknown>;
}

export interface IAgentLifecycleHooks {
  onInitialize?(agent: IAgentHarness): Promise<void>;
  onStart?(agent: IAgentHarness): Promise<void>;
  onStop?(agent: IAgentHarness): Promise<void>;
  onTaskReceived?(agent: IAgentHarness, task: ITask): Promise<void>;
  onTaskCompleted?(agent: IAgentHarness, task: ITask, result: unknown): Promise<void>;
  onTaskFailed?(agent: IAgentHarness, task: ITask, error: Error): Promise<void>;
  onError?(agent: IAgentHarness, error: Error): Promise<void>;
}

/**
 * Main Agent Harness Interface
 * The central component that orchestrates all adapters and services for AI agents
 */
export interface IAgentHarness {
  /**
   * Agent identification
   */
  readonly agentId: AgentId;
  readonly name: string;
  readonly config: IAgentConfig;

  /**
   * Core services (may be undefined if not enabled)
   */
  readonly queue?: IQueueAdapter;
  readonly cache?: ICacheAdapter;
  readonly database?: IDatabaseAdapter;
  readonly graph?: IGraphAdapter;
  readonly vector?: IVectorAdapter;
  readonly eventStore?: IEventStore;
  readonly logging?: ILoggingService;
  readonly metrics?: IMetricsService;

  /**
   * Agent state
   */
  getState(): IAgentState;

  /**
   * Lifecycle management
   */
  initialize(): Promise<Result<void>>;
  start(): Promise<Result<void>>;
  stop(): Promise<Result<void>>;
  shutdown(): Promise<Result<void>>;
  isRunning(): boolean;
  isHealthy(): Promise<Result<IHealthStatus>>;

  /**
   * Task processing
   */
  registerHandler<TInput, TOutput>(handler: ITaskHandler<TInput, TOutput>): void;
  processTask<TInput, TOutput>(task: ITask<TInput, TOutput>): Promise<Result<IAgentExecutionResult<TOutput>>>;
  cancelTask(taskId: UUID): Promise<Result<boolean>>;
  pause(): Promise<Result<void>>;
  resume(): Promise<Result<void>>;

  /**
   * Queue integration
   */
  subscribeToQueue<T>(queueName: string, handler: (task: ITask<T>) => Promise<void>): Promise<Result<void>>;
  publishTask<T>(queueName: string, task: Omit<ITask<T>, 'taskId' | 'createdAt' | 'status'>): Promise<Result<UUID>>;

  /**
   * Cache operations (convenience methods)
   */
  cacheGet<T>(key: string): Promise<Result<T | null>>;
  cacheSet<T>(key: string, value: T, ttl?: number): Promise<Result<void>>;
  cacheDelete(key: string): Promise<Result<boolean>>;
  cacheExists(key: string): Promise<Result<boolean>>;

  /**
   * Database operations (convenience methods)
   */
  dbInsert<T>(collection: string, document: T): Promise<Result<T & { _id: string }>>;
  dbFind<T>(collection: string, options?: any): Promise<Result<T[]>>;
  dbUpdate<T>(collection: string, id: string, updates: Partial<T>): Promise<Result<T | null>>;
  dbDelete(collection: string, id: string): Promise<Result<boolean>>;

  /**
   * Vector operations (convenience methods)
   */
  vectorSearch(query: number[], limit?: number): Promise<Result<Array<{ id: string; similarity: number; metadata: unknown }>>>;
  vectorInsert(embedding: number[], metadata?: Record<string, unknown>): Promise<Result<string>>;

  /**
   * Graph operations (convenience methods)
   */
  graphCreateNode(labels: string[], properties: Record<string, unknown>): Promise<Result<unknown>>;
  graphFindNodes(labels: string[], properties?: Record<string, unknown>): Promise<Result<unknown[]>>;
  graphCreateRelationship(startNodeId: string, endNodeId: string, type: string): Promise<Result<unknown>>;

  /**
   * Event sourcing
   */
  emitEvent<TData>(eventType: string, data: TData, aggregateId: string): Promise<Result<void>>;
  getEvents(aggregateId: string, fromVersion?: number): Promise<Result<any[]>>;

  /**
   * Logging (convenience methods)
   */
  logInfo(message: string, context?: Record<string, unknown>): Promise<Result<string>>;
  logError(error: Error, context?: Record<string, unknown>): Promise<Result<string>>;
  logDebug(message: string, context?: Record<string, unknown>): Promise<Result<string>>;
  logWarn(message: string, context?: Record<string, unknown>): Promise<Result<string>>;

  /**
   * Metrics (convenience methods)
   */
  recordMetric(name: string, value: number, labels?: Record<string, string>): Promise<Result<void>>;
  incrementCounter(name: string, value?: number, labels?: Record<string, string>): Promise<Result<void>>;
  setGauge(name: string, value: number, labels?: Record<string, string>): Promise<Result<void>>;

  /**
   * Middleware
   */
  use(middleware: IAgentMiddleware): void;
  removeMiddleware(name: string): boolean;

  /**
   * Plugins
   */
  registerPlugin<TContext>(plugin: IPlugin<TContext>): Promise<Result<void>>;
  unregisterPlugin(name: string): Promise<Result<void>>;
  getPlugin(name: string): IPlugin | undefined;
  listPlugins(): string[];

  /**
   * Lifecycle hooks
   */
  addLifecycleHooks(hooks: IAgentLifecycleHooks): void;

  /**
   * Context management
   */
  createContext(taskId?: UUID, correlationId?: CorrelationId, metadata?: Record<string, unknown>): IAgentContext;
  withContext<T>(context: IAgentContext, fn: () => Promise<T>): Promise<T>;

  /**
   * Health and monitoring
   */
  healthCheck(): Promise<IHealthStatus>;
  getMetrics(): Promise<Record<string, unknown>>;

  /**
   * Configuration
   */
  updateConfig(updates: Partial<IAgentConfig>): Promise<Result<void>>;
  reloadConfig(): Promise<Result<void>>;

  /**
   * Events
   */
  on(event: 'started' | 'stopped' | 'error' | 'taskCompleted' | 'taskFailed', handler: (...args: any[]) => void): void;
  off(event: 'started' | 'stopped' | 'error' | 'taskCompleted' | 'taskFailed', handler: (...args: any[]) => void): void;
  emit(event: 'started' | 'stopped' | 'error' | 'taskCompleted' | 'taskFailed', ...args: any[]): void;
}

/**
 * Factory function type for creating agent harness instances
 */
export type AgentHarnessFactory = (config: IAgentConfig) => IAgentHarness;

/**
 * Builder pattern for constructing agent harness instances
 */
export interface IAgentHarnessBuilder {
  withConfig(config: IAgentConfig): IAgentHarnessBuilder;
  withQueue(adapter: IQueueAdapter): IAgentHarnessBuilder;
  withCache(adapter: ICacheAdapter): IAgentHarnessBuilder;
  withDatabase(adapter: IDatabaseAdapter): IAgentHarnessBuilder;
  withGraph(adapter: IGraphAdapter): IAgentHarnessBuilder;
  withVector(adapter: IVectorAdapter): IAgentHarnessBuilder;
  withEventStore(store: IEventStore): IAgentHarnessBuilder;
  withLogging(service: ILoggingService): IAgentHarnessBuilder;
  withMetrics(service: IMetricsService): IAgentHarnessBuilder;
  withPlugin<TContext>(plugin: IPlugin<TContext>): IAgentHarnessBuilder;
  withMiddleware(middleware: IAgentMiddleware): IAgentHarnessBuilder;
  withLifecycleHooks(hooks: IAgentLifecycleHooks): IAgentHarnessBuilder;
  build(): IAgentHarness;
}

/**
 * Registry for agent harness instances
 */
export interface IAgentHarnessRegistry {
  register(agent: IAgentHarness): void;
  get(agentId: AgentId): IAgentHarness | undefined;
  remove(agentId: AgentId): boolean;
  list(): IAgentHarness[];
  findByName(name: string): IAgentHarness | undefined;
  findByStatus(status: IAgentStatus): IAgentHarness[];
  count(): number;
}
