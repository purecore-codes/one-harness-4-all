/**
 * Queue Adapter Interface
 * Abstract interface for all queue providers (RabbitMQ, NATS, Kafka, BullMQ)
 */

import { IAdapter, IMessage, IQueueConfig, Result } from '../../types';

export interface IQueueMessage<TPayload = unknown> extends IMessage<TPayload> {
  readonly routingKey?: string;
  readonly partitionKey?: string;
  readonly retryCount?: number;
  readonly maxRetries?: number;
}

export interface IQueueConsumer {
  consume<T>(handler: (message: IQueueMessage<T>) => Promise<void>): Promise<void>;
  stop(): Promise<void>;
}

export interface IPublishOptions {
  readonly priority?: number;
  readonly expiration?: number;
  readonly headers?: Record<string, string>;
  readonly delay?: number;
}

/**
 * Base Queue Adapter Interface
 */
export interface IQueueAdapter extends IAdapter<IQueueConfig, unknown> {
  /**
   * Publish a message to the queue
   */
  publish<T>(queue: string, message: IQueueMessage<T>, options?: IPublishOptions): Promise<Result<void>>;

  /**
   * Subscribe to a queue and process messages
   */
  subscribe<T>(queue: string, handler: (message: IQueueMessage<T>) => Promise<void>): Promise<IQueueConsumer>;

  /**
   * Acknowledge a message
   */
  acknowledge(messageId: string): Promise<Result<void>>;

  /**
   * Reject a message (optionally requeue)
   */
  reject(messageId: string, requeue?: boolean): Promise<Result<void>>;

  /**
   * Get queue statistics
   */
  getQueueStats(queue: string): Promise<Result<{
    messageCount: number;
    consumerCount: number;
    pendingMessages: number;
  }>>;

  /**
   * Purge a queue
   */
  purge(queue: string): Promise<Result<void>>;

  /**
   * Create a queue if it doesn't exist
   */
  createQueue(queue: string, options?: {
    durable?: boolean;
    autoDelete?: boolean;
    deadLetterQueue?: string;
    maxPriority?: number;
  }): Promise<Result<void>>;

  /**
   * Delete a queue
   */
  deleteQueue(queue: string): Promise<Result<void>>;

  /**
   * Send delayed message
   */
  sendDelayed<T>(queue: string, message: IQueueMessage<T>, delayMs: number): Promise<Result<void>>;

  /**
   * Batch publish messages
   */
  publishBatch<T>(queue: string, messages: Array<IQueueMessage<T>>): Promise<Result<number>>;
}

/**
 * Factory function type for creating queue adapters
 */
export type QueueAdapterFactory = (config: IQueueConfig) => IQueueAdapter;

/**
 * Registry for queue adapters
 */
export interface IQueueAdapterRegistry {
  register(provider: 'rabbitmq' | 'nats' | 'kafka' | 'bullmq', factory: QueueAdapterFactory): void;
  get(provider: 'rabbitmq' | 'nats' | 'kafka' | 'bullmq'): QueueAdapterFactory;
  has(provider: 'rabbitmq' | 'nats' | 'kafka' | 'bullmq'): boolean;
}
