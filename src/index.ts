/**
 * AI Agent Harness - One harness to rule them all
 * 
 * A standardized, componentized, and pluggable harness for AI agents featuring:
 * - Multiple queue providers (RabbitMQ, NATS, Kafka, BullMQ)
 * - Redis cache
 * - Vector database with pgvector
 * - Document storage (PostgreSQL or MongoDB)
 * - Graph database with Neo4j
 * - Event sourcing for all actions
 * - Dedicated logging and metrics storage
 * - TypeScript strict mode with semantic typing
 */

// Types
export * from './types';

// Core
export * from './core/AgentHarness';

// Adapters
export * from './adapters/queue/IQueueAdapter';
export * from './adapters/cache/ICacheAdapter';
export * from './adapters/database/IDatabaseAdapter';
export * from './adapters/graph/IGraphAdapter';
export * from './adapters/vector/IVectorAdapter';

// Event Store
export * from './eventstore/EventStore';

// Logging
export * from './logging/LoggingService';

// Metrics
export * from './metrics/MetricsService';

// Factory
export * from './factory/HarnessGenerator';
