/**
 * Event Store - Core component for Event Sourcing
 * Stores all domain events in a dedicated database for audit trail and state reconstruction
 */

import { 
  IAdapter, 
  IEventStoreConfig, 
  Result, 
  IDomainEvent, 
  StreamId,
  AggregateId,
  Version,
  CorrelationId,
  CausationId,
  Timestamp,
  DomainEventType
} from '../../types';

export interface IEventDomain<TData = unknown> extends IDomainEvent<TData> {
  readonly streamId: StreamId;
  readonly position: number;
}

export interface IAppendOptions {
  readonly expectedVersion?: Version; // For optimistic concurrency
  readonly correlationId?: CorrelationId;
  readonly causationId?: CausationId;
}

export interface IStreamMetadata {
  readonly streamId: StreamId;
  readonly currentVersion: Version;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
  readonly eventCount: number;
  readonly aggregateType: string;
  readonly aggregateId: AggregateId;
  readonly customMetadata?: Record<string, unknown>;
}

export interface ISnapshot<TState = unknown> {
  readonly streamId: StreamId;
  readonly version: Version;
  readonly state: TState;
  readonly createdAt: Timestamp;
  readonly metadata?: Record<string, unknown>;
}

export interface IReadEventsOptions {
  readonly fromVersion?: Version;
  readonly toVersion?: Version;
  readonly limit?: number;
  readonly ascending?: boolean;
}

export interface ISubscription {
  readonly subscriptionId: string;
  readonly streamId?: StreamId;
  readonly eventType?: DomainEventType;
  readonly fromPosition?: number;
  stop(): Promise<void>;
}

export interface IEventHandler<TData = unknown> {
  (event: IEventDomain<TData>, position: number): Promise<void>;
}

export interface IProjection<TState = unknown> {
  readonly name: string;
  readonly initialState: () => TState;
  readonly apply: <TData>(state: TState, event: IEventDomain<TData>) => TState;
  readonly getCurrentState: () => Promise<TState>;
  readonly rebuild: () => Promise<void>;
}

/**
 * Event Store Interface - Dedicated storage for all domain events
 */
export interface IEventStore extends IAdapter<IEventStoreConfig, unknown> {
  /**
   * Append one or more events to a stream
   */
  appendToStream<TData>(streamId: StreamId, events: Array<IDomainEvent<TData>>, options?: IAppendOptions): Promise<Result<Version>>;

  /**
   * Read events from a stream
   */
  readStream<TData>(streamId: StreamId, options?: IReadEventsOptions): Promise<Result<IEventDomain<TData>[]>>;

  /**
   * Read a single event by stream ID and version
   */
  readEvent<TData>(streamId: StreamId, version: Version): Promise<Result<IEventDomain<TData> | null>>;

  /**
   * Read all events from the global log
   */
  readAll<TData>(fromPosition: number, limit?: number): Promise<Result<Array<IEventDomain<TData> & { globalPosition: number }>>>;

  /**
   * Get the current version of a stream
   */
  getStreamVersion(streamId: StreamId): Promise<Result<Version>>;

  /**
   * Get stream metadata
   */
  getStreamMetadata(streamId: StreamId): Promise<Result<IStreamMetadata | null>>;

  /**
   * Set stream metadata
   */
  setStreamMetadata(streamId: StreamId, metadata: Partial<IStreamMetadata>): Promise<Result<void>>;

  /**
   * Delete a stream (soft delete by default)
   */
  deleteStream(streamId: StreamId, hardDelete?: boolean): Promise<Result<void>>;

  /**
   * Subscribe to a stream for real-time events
   */
  subscribeToStream<TData>(
    streamId: StreamId, 
    handler: IEventHandler<TData>,
    fromVersion?: Version
  ): Promise<ISubscription>;

  /**
   * Subscribe to all streams (global log)
   */
  subscribeToAll<TData>(
    handler: (event: IEventDomain<TData>, position: number) => Promise<void>,
    fromPosition?: number
  ): Promise<ISubscription>;

  /**
   * Subscribe to specific event types across all streams
   */
  subscribeToEventType<TData>(
    eventType: DomainEventType,
    handler: IEventHandler<TData>,
    fromPosition?: number
  ): Promise<ISubscription>;

  /**
   * Create a snapshot for an aggregate
   */
  createSnapshot<TState>(streamId: StreamId, version: Version, state: TState, metadata?: Record<string, unknown>): Promise<Result<void>>;

  /**
   * Get the latest snapshot for a stream
   */
  getLatestSnapshot<TState>(streamId: StreamId): Promise<Result<ISnapshot<TState> | null>>;

  /**
   * Get a snapshot at a specific version
   */
  getSnapshotAtVersion<TState>(streamId: StreamId, version: Version): Promise<Result<ISnapshot<TState> | null>>;

  /**
   * Rebuild a projection from events
   */
  registerProjection<TState>(projection: IProjection<TState>): Promise<Result<void>>;

  /**
   * Get a registered projection
   */
  getProjection<TState>(name: string): Promise<Result<IProjection<TState>>>;

  /**
   * List all projections
   */
  listProjections(): Promise<Result<string[]>>;

  /**
   * Find events by correlation ID
   */
  findByCorrelationId<TData>(correlationId: CorrelationId): Promise<Result<IEventDomain<TData>[]>>;

  /**
   * Find events by causation ID
   */
  findByCausationId<TData>(causationId: CausationId): Promise<Result<IEventDomain<TData>[]>>;

  /**
   * Find events by aggregate type
   */
  findByAggregateType<TData>(aggregateType: string, limit?: number): Promise<Result<IEventDomain<TData>[]>>;

  /**
   * Find events by time range
   */
  findByTimeRange<TData>(from: Timestamp, to: Timestamp, limit?: number): Promise<Result<IEventDomain<TData>[]>>;

  /**
   * Count events in a stream
   */
  countEvents(streamId: StreamId): Promise<Result<number>>;

  /**
   * Count total events in the store
   */
  countAllEvents(): Promise<Result<number>>;

  /**
   * Compact the event log (remove deleted streams, optimize storage)
   */
  compact(): Promise<Result<{ eventsRemoved: number; spaceSaved: number }>>;

  /**
   * Export events to JSON
   */
  exportEvents(options?: { streamId?: StreamId; fromVersion?: Version }): Promise<Result<string>>;

  /**
   * Import events from JSON
   */
  importEvents(jsonData: string, skipExisting?: boolean): Promise<Result<number>>;

  /**
   * Get event store statistics
   */
  getStats(): Promise<Result<{
    totalStreams: number;
    totalEvents: number;
    totalSnapshots: number;
    activeSubscriptions: number;
    storageSize: number;
    eventsPerSecond?: number;
  }>>;

  /**
   * Purge events older than a certain date (for GDPR compliance)
   */
  purgeOldEvents(beforeDate: Timestamp): Promise<Result<number>>;
}

/**
 * Factory function type for creating event store adapters
 */
export type EventStoreFactory = (config: IEventStoreConfig) => IEventStore;

/**
 * Registry for event store implementations
 */
export interface IEventStoreRegistry {
  register(provider: 'postgres' | 'mongodb', factory: EventStoreFactory): void;
  get(provider: 'postgres' | 'mongodb'): EventStoreFactory;
  has(provider: 'postgres' | 'mongodb'): boolean;
}

/**
 * Event sourcing helper functions
 */
export interface IEventSourcingHelpers {
  /**
   * Generate a stream ID from aggregate type and ID
   */
  createStreamId(aggregateType: string, aggregateId: AggregateId): StreamId;

  /**
   * Parse a stream ID into aggregate type and ID
   */
  parseStreamId(streamId: StreamId): { aggregateType: string; aggregateId: AggregateId };

  /**
   * Calculate the next version for a stream
   */
  calculateNextVersion(currentVersion: Version): Version;

  /**
   * Validate event ordering
   */
  validateEventOrdering(events: IDomainEvent[]): Result<boolean>;

  /**
   * Rehydrate an aggregate from events
   */
  rehydrateAggregate<TState>(
    initialState: TState,
    events: IDomainEvent[],
    applyFunction: (state: TState, event: IDomainEvent) => TState
  ): TState;
}
