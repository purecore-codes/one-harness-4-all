/**
 * Agent Harness Factory
 * Creates and configures agent harness instances with pluggable adapters
 */

import { IAgentConfig, IAgentHarness, Result } from '../../types';
import { IAgentHarnessBuilder } from '../../core/AgentHarness';
import { QueueAdapterFactory, IQueueAdapterRegistry } from '../../adapters/queue/IQueueAdapter';
import { CacheAdapterFactory, ICacheAdapterRegistry } from '../../adapters/cache/ICacheAdapter';
import { DatabaseAdapterFactory, IDatabaseAdapterRegistry } from '../../adapters/database/IDatabaseAdapter';
import { GraphAdapterFactory, IGraphAdapterRegistry } from '../../adapters/graph/IGraphAdapter';
import { VectorAdapterFactory, IVectorAdapterRegistry } from '../../adapters/vector/IVectorAdapter';
import { EventStoreFactory, IEventStoreRegistry } from '../../eventstore/EventStore';
import { LoggingServiceFactory, ILoggingServiceRegistry } from '../../logging/LoggingService';
import { MetricsServiceFactory, IMetricsServiceRegistry } from '../../metrics/MetricsService';

export interface IAdapterFactories {
  queue: Map<string, QueueAdapterFactory>;
  cache: Map<string, CacheAdapterFactory>;
  database: Map<string, DatabaseAdapterFactory>;
  graph: Map<string, GraphAdapterFactory>;
  vector: Map<string, VectorAdapterFactory>;
  eventStore: Map<string, EventStoreFactory>;
  logging: Map<string, LoggingServiceFactory>;
  metrics: Map<string, MetricsServiceFactory>;
}

export interface IHarnessGeneratorOptions {
  readonly autoInitialize?: boolean;
  readonly autoStart?: boolean;
  readonly enableHealthChecks?: boolean;
  readonly healthCheckInterval?: number;
  readonly enableMetrics?: boolean;
  readonly enableLogging?: boolean;
  readonly enableEventSourcing?: boolean;
  readonly defaultRetryPolicy?: {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
  };
}

export interface IGeneratedHarness {
  harness: IAgentHarness;
  adapters: {
    queue?: unknown;
    cache?: unknown;
    database?: unknown;
    graph?: unknown;
    vector?: unknown;
    eventStore?: unknown;
    logging?: unknown;
    metrics?: unknown;
  };
  initializationTime: number;
}

/**
 * Main Harness Generator
 * Provides a fluent API for generating configured agent harnesses
 */
export class HarnessGenerator {
  private queueRegistry: IQueueAdapterRegistry;
  private cacheRegistry: ICacheAdapterRegistry;
  private databaseRegistry: IDatabaseAdapterRegistry;
  private graphRegistry: IGraphAdapterRegistry;
  private vectorRegistry: IVectorAdapterRegistry;
  private eventStoreRegistry: IEventStoreRegistry;
  private loggingRegistry: ILoggingServiceRegistry;
  private metricsRegistry: IMetricsServiceRegistry;

  constructor() {
    this.queueRegistry = this.createQueueRegistry();
    this.cacheRegistry = this.createCacheRegistry();
    this.databaseRegistry = this.createDatabaseRegistry();
    this.graphRegistry = this.createGraphRegistry();
    this.vectorRegistry = this.createVectorRegistry();
    this.eventStoreRegistry = this.createEventStoreRegistry();
    this.loggingRegistry = this.createLoggingRegistry();
    this.metricsRegistry = this.createMetricsRegistry();
  }

  /**
   * Create a new builder for configuring an agent harness
   */
  createBuilder(): IAgentHarnessBuilder {
    return new AgentHarnessBuilderImpl();
  }

  /**
   * Generate a fully configured agent harness from configuration
   */
  async generate(config: IAgentConfig, options?: IHarnessGeneratorOptions): Promise<Result<IGeneratedHarness>> {
    const startTime = Date.now();
    
    try {
      const builder = this.createBuilder().withConfig(config);

      // Initialize queue adapter if enabled
      if (config.queueConfig) {
        const queueFactory = this.queueRegistry.get(config.queueConfig.provider);
        if (queueFactory) {
          const queueAdapter = queueFactory(config.queueConfig);
          builder.withQueue(queueAdapter);
        }
      }

      // Initialize cache adapter if enabled
      if (config.cacheConfig.enabled) {
        const cacheFactory = this.cacheRegistry.get('redis');
        if (cacheFactory) {
          const cacheAdapter = cacheFactory(config.cacheConfig);
          builder.withCache(cacheAdapter);
        }
      }

      // Initialize database adapter if enabled
      if (config.databaseConfig) {
        const dbFactory = this.databaseRegistry.get(config.databaseConfig.provider);
        if (dbFactory) {
          const dbAdapter = dbFactory(config.databaseConfig);
          builder.withDatabase(dbAdapter);
        }
      }

      // Initialize graph adapter if enabled
      if (config.graphConfig.enabled) {
        const graphFactory = this.graphRegistry.get('neo4j');
        if (graphFactory) {
          const graphAdapter = graphFactory(config.graphConfig);
          builder.withGraph(graphAdapter);
        }
      }

      // Initialize vector adapter if enabled
      if (config.vectorConfig.enabled) {
        const vectorFactory = this.vectorRegistry.get('pgvector');
        if (vectorFactory) {
          const vectorAdapter = vectorFactory(config.vectorConfig);
          builder.withVector(vectorAdapter);
        }
      }

      // Initialize event store if enabled
      if (config.eventStoreConfig.enabled) {
        const eventStoreFactory = this.eventStoreRegistry.get('postgres');
        if (eventStoreFactory) {
          const eventStore = eventStoreFactory(config.eventStoreConfig);
          builder.withEventStore(eventStore);
        }
      }

      // Initialize logging if enabled
      if (config.loggingConfig.enabled) {
        const loggingFactory = this.loggingRegistry.get('postgres');
        if (loggingFactory) {
          const loggingService = loggingFactory(config.loggingConfig);
          builder.withLogging(loggingService);
        }
      }

      // Initialize metrics if enabled
      if (config.metricsConfig.enabled) {
        const metricsFactory = this.metricsRegistry.get('postgres');
        if (metricsFactory) {
          const metricsService = metricsFactory(config.metricsConfig);
          builder.withMetrics(metricsService);
        }
      }

      const harness = builder.build();

      // Auto-initialize if requested
      if (options?.autoInitialize) {
        await harness.initialize();
      }

      // Auto-start if requested
      if (options?.autoStart) {
        await harness.start();
      }

      const initializationTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          harness,
          adapters: {
            queue: harness.queue,
            cache: harness.cache,
            database: harness.database,
            graph: harness.graph,
            vector: harness.vector,
            eventStore: harness.eventStore,
            logging: harness.logging,
            metrics: harness.metrics,
          },
          initializationTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Register a custom queue adapter factory
   */
  registerQueueAdapter(provider: string, factory: QueueAdapterFactory): void {
    this.queueRegistry.register(provider as any, factory);
  }

  /**
   * Register a custom cache adapter factory
   */
  registerCacheAdapter(provider: string, factory: CacheAdapterFactory): void {
    this.cacheRegistry.register(provider as any, factory);
  }

  /**
   * Register a custom database adapter factory
   */
  registerDatabaseAdapter(provider: string, factory: DatabaseAdapterFactory): void {
    this.databaseRegistry.register(provider as any, factory);
  }

  /**
   * Register a custom graph adapter factory
   */
  registerGraphAdapter(provider: string, factory: GraphAdapterFactory): void {
    this.graphRegistry.register(provider as any, factory);
  }

  /**
   * Register a custom vector adapter factory
   */
  registerVectorAdapter(provider: string, factory: VectorAdapterFactory): void {
    this.vectorRegistry.register(provider as any, factory);
  }

  /**
   * Register a custom event store factory
   */
  registerEventStore(provider: string, factory: EventStoreFactory): void {
    this.eventStoreRegistry.register(provider as any, factory);
  }

  /**
   * Register a custom logging service factory
   */
  registerLoggingService(provider: string, factory: LoggingServiceFactory): void {
    this.loggingRegistry.register(provider as any, factory);
  }

  /**
   * Register a custom metrics service factory
   */
  registerMetricsService(provider: string, factory: MetricsServiceFactory): void {
    this.metricsRegistry.register(provider as any, factory);
  }

  /**
   * Get all registered adapter factories
   */
  getRegisteredAdapters(): {
    queue: string[];
    cache: string[];
    database: string[];
    graph: string[];
    vector: string[];
    eventStore: string[];
    logging: string[];
    metrics: string[];
  } {
    return {
      queue: ['rabbitmq', 'nats', 'kafka', 'bullmq'],
      cache: ['redis'],
      database: ['postgres', 'mongodb'],
      graph: ['neo4j'],
      vector: ['pgvector'],
      eventStore: ['postgres', 'mongodb'],
      logging: ['postgres', 'mongodb', 'elasticsearch', 'loki'],
      metrics: ['postgres', 'mongodb', 'prometheus', 'influxdb'],
    };
  }

  // Registry creation methods (to be implemented with actual adapter factories)
  private createQueueRegistry(): IQueueAdapterRegistry {
    return {
      register: () => {},
      get: () => {
        throw new Error('Queue adapter factory not registered. Use registerQueueAdapter to add one.');
      },
      has: () => false,
    };
  }

  private createCacheRegistry(): ICacheAdapterRegistry {
    return {
      register: () => {},
      get: () => {
        throw new Error('Cache adapter factory not registered. Use registerCacheAdapter to add one.');
      },
      has: () => false,
    };
  }

  private createDatabaseRegistry(): IDatabaseAdapterRegistry {
    return {
      register: () => {},
      get: () => {
        throw new Error('Database adapter factory not registered. Use registerDatabaseAdapter to add one.');
      },
      has: () => false,
    };
  }

  private createGraphRegistry(): IGraphAdapterRegistry {
    return {
      register: () => {},
      get: () => {
        throw new Error('Graph adapter factory not registered. Use registerGraphAdapter to add one.');
      },
      has: () => false,
    };
  }

  private createVectorRegistry(): IVectorAdapterRegistry {
    return {
      register: () => {},
      get: () => {
        throw new Error('Vector adapter factory not registered. Use registerVectorAdapter to add one.');
      },
      has: () => false,
    };
  }

  private createEventStoreRegistry(): IEventStoreRegistry {
    return {
      register: () => {},
      get: () => {
        throw new Error('Event store factory not registered. Use registerEventStore to add one.');
      },
      has: () => false,
    };
  }

  private createLoggingRegistry(): ILoggingServiceRegistry {
    return {
      register: () => {},
      get: () => {
        throw new Error('Logging service factory not registered. Use registerLoggingService to add one.');
      },
      has: () => false,
    };
  }

  private createMetricsRegistry(): IMetricsServiceRegistry {
    return {
      register: () => {},
      get: () => {
        throw new Error('Metrics service factory not registered. Use registerMetricsService to add one.');
      },
      has: () => false,
    };
  }
}

/**
 * Default implementation of the Agent Harness Builder
 */
class AgentHarnessBuilderImpl implements IAgentHarnessBuilder {
  private config?: IAgentConfig;
  private queueAdapter?: unknown;
  private cacheAdapter?: unknown;
  private databaseAdapter?: unknown;
  private graphAdapter?: unknown;
  private vectorAdapter?: unknown;
  private eventStoreAdapter?: unknown;
  private loggingService?: unknown;
  private metricsService?: unknown;

  withConfig(config: IAgentConfig): IAgentHarnessBuilder {
    this.config = config;
    return this;
  }

  withQueue(adapter: unknown): IAgentHarnessBuilder {
    this.queueAdapter = adapter;
    return this;
  }

  withCache(adapter: unknown): IAgentHarnessBuilder {
    this.cacheAdapter = adapter;
    return this;
  }

  withDatabase(adapter: unknown): IAgentHarnessBuilder {
    this.databaseAdapter = adapter;
    return this;
  }

  withGraph(adapter: unknown): IAgentHarnessBuilder {
    this.graphAdapter = adapter;
    return this;
  }

  withVector(adapter: unknown): IAgentHarnessBuilder {
    this.vectorAdapter = adapter;
    return this;
  }

  withEventStore(store: unknown): IAgentHarnessBuilder {
    this.eventStoreAdapter = store;
    return this;
  }

  withLogging(service: unknown): IAgentHarnessBuilder {
    this.loggingService = service;
    return this;
  }

  withMetrics(service: unknown): IAgentHarnessBuilder {
    this.metricsService = service;
    return this;
  }

  withPlugin(): IAgentHarnessBuilder {
    // Plugin registration handled by harness
    return this;
  }

  withMiddleware(): IAgentHarnessBuilder {
    // Middleware registration handled by harness
    return this;
  }

  withLifecycleHooks(): IAgentHarnessBuilder {
    // Lifecycle hooks handled by harness
    return this;
  }

  build(): IAgentHarness {
    if (!this.config) {
      throw new Error('Configuration is required. Call withConfig() before build().');
    }

    // Return a stub implementation - actual implementation would be in src/core/AgentHarnessImpl.ts
    return createStubHarness(this.config);
  }
}

/**
 * Create a stub harness for demonstration purposes
 * In production, this would be replaced with the full implementation
 */
function createStubHarness(config: IAgentConfig): IAgentHarness {
  return {
    agentId: config.agentId,
    name: config.name,
    config,
    getState: () => ({
      status: 'IDLE',
      completedTasks: 0,
      failedTasks: 0,
      metadata: {},
    }),
    initialize: async () => ({ success: true, data: undefined }),
    start: async () => ({ success: true, data: undefined }),
    stop: async () => ({ success: true, data: undefined }),
    shutdown: async () => ({ success: true, data: undefined }),
    isRunning: () => false,
    isHealthy: async () => ({
      success: true,
      data: {
        status: 'healthy',
        checks: {},
        timestamp: new Date().toISOString(),
      },
    }),
    registerHandler: () => {},
    processTask: async () => ({
      success: true,
      data: {
        success: true,
        duration: 0,
        metrics: {
          queueTime: 0,
          executionTime: 0,
          cacheHits: 0,
          cacheMisses: 0,
          dbQueries: 0,
          vectorSearches: 0,
          graphTraversals: 0,
        },
      },
    }),
    cancelTask: async () => ({ success: true, data: false }),
    pause: async () => ({ success: true, data: undefined }),
    resume: async () => ({ success: true, data: undefined }),
    subscribeToQueue: async () => ({ success: true, data: undefined }),
    publishTask: async () => ({ success: true, data: '00000000-0000-0000-0000-000000000000' as any }),
    cacheGet: async () => ({ success: true, data: null }),
    cacheSet: async () => ({ success: true, data: undefined }),
    cacheDelete: async () => ({ success: true, data: false }),
    cacheExists: async () => ({ success: true, data: false }),
    dbInsert: async () => ({ success: true, data: { _id: '' } as any }),
    dbFind: async () => ({ success: true, data: [] }),
    dbUpdate: async () => ({ success: true, data: null }),
    dbDelete: async () => ({ success: true, data: false }),
    vectorSearch: async () => ({ success: true, data: [] }),
    vectorInsert: async () => ({ success: true, data: '' }),
    graphCreateNode: async () => ({ success: true, data: {} }),
    graphFindNodes: async () => ({ success: true, data: [] }),
    graphCreateRelationship: async () => ({ success: true, data: {} }),
    emitEvent: async () => ({ success: true, data: undefined }),
    getEvents: async () => ({ success: true, data: [] }),
    logInfo: async () => ({ success: true, data: '' }),
    logError: async () => ({ success: true, data: '' }),
    logDebug: async () => ({ success: true, data: '' }),
    logWarn: async () => ({ success: true, data: '' }),
    recordMetric: async () => ({ success: true, data: undefined }),
    incrementCounter: async () => ({ success: true, data: undefined }),
    setGauge: async () => ({ success: true, data: undefined }),
    use: () => {},
    removeMiddleware: () => false,
    registerPlugin: async () => ({ success: true, data: undefined }),
    unregisterPlugin: async () => ({ success: true, data: undefined }),
    getPlugin: () => undefined,
    listPlugins: () => [],
    addLifecycleHooks: () => {},
    createContext: () => ({
      agentId: config.agentId,
      correlationId: '' as any,
      metadata: {},
    }),
    withContext: async (_context: any, fn: () => Promise<any>) => fn(),
    healthCheck: async () => ({
      status: 'healthy',
      checks: {},
      timestamp: new Date().toISOString(),
    }),
    getMetrics: async () => ({}),
    updateConfig: async () => ({ success: true, data: undefined }),
    reloadConfig: async () => ({ success: true, data: undefined }),
    on: () => {},
    off: () => {},
    emit: () => {},
  };
}

// Export singleton instance
export const harnessGenerator = new HarnessGenerator();
