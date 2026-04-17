/**
 * Database Adapter Interface
 * Abstract interface for PostgreSQL and MongoDB providers
 */

import { IAdapter, IDatabaseConfig, Result, IQueryResult } from '../../types';

export type SortOrder = 'ASC' | 'DESC';

export interface ISortField {
  field: string;
  order: SortOrder;
}

export interface IFilterCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'like' | 'regex' | 'exists';
  value: unknown;
}

export interface IQueryOptions {
  readonly limit?: number;
  readonly offset?: number;
  readonly sort?: ISortField[];
  readonly select?: string[];
  readonly filters?: IFilterCondition[];
}

export interface IUpdateOptions {
  readonly upsert?: boolean;
  readonly returnNew?: boolean;
}

export interface IDatabaseStats {
  readonly size: number;
  readonly collections?: number;
  readonly documents?: number;
  readonly connections: number;
  readonly queriesPerSecond?: number;
}

/**
 * Base Database Adapter Interface
 */
export interface IDatabaseAdapter extends IAdapter<IDatabaseConfig, unknown> {
  /**
   * Insert a single document
   */
  insert<T>(collection: string, document: T): Promise<Result<T & { _id: string }>>;

  /**
   * Insert multiple documents
   */
  insertMany<T>(collection: string, documents: T[]): Promise<Result<number>>;

  /**
   * Find documents matching criteria
   */
  find<T>(collection: string, options?: IQueryOptions): Promise<Result<IQueryResult<T>>>;

  /**
   * Find a single document
   */
  findOne<T>(collection: string, filters?: IFilterCondition[], select?: string[]): Promise<Result<T | null>>;

  /**
   * Find by ID
   */
  findById<T>(collection: string, id: string): Promise<Result<T | null>>;

  /**
   * Update a single document
   */
  update<T>(collection: string, filters: IFilterCondition[], updates: Partial<T>, options?: IUpdateOptions): Promise<Result<number>>;

  /**
   * Update by ID
   */
  updateById<T>(collection: string, id: string, updates: Partial<T>, options?: IUpdateOptions): Promise<Result<T | null>>;

  /**
   * Delete documents matching criteria
   */
  delete(collection: string, filters: IFilterCondition[]): Promise<Result<number>>;

  /**
   * Delete by ID
   */
  deleteById(collection: string, id: string): Promise<Result<boolean>>;

  /**
   * Count documents
   */
  count(collection: string, filters?: IFilterCondition[]): Promise<Result<number>>;

  /**
   * Aggregate pipeline
   */
  aggregate<T>(collection: string, pipeline: unknown[]): Promise<Result<T[]>>;

  /**
   * Create index
   */
  createIndex(collection: string, fields: Record<string, SortOrder>, options?: { unique?: boolean; name?: string }): Promise<Result<void>>;

  /**
   * Drop index
   */
  dropIndex(collection: string, indexName: string): Promise<Result<void>>;

  /**
   * List indexes
   */
  listIndexes(collection: string): Promise<Result<Array<{ name: string; fields: Record<string, SortOrder> }>>>;

  /**
   * Execute raw query (provider-specific)
   */
  executeRaw<T>(query: string, params?: unknown[]): Promise<Result<T>>;

  /**
   * Start a transaction
   */
  startTransaction(): Promise<Result<ITransaction>>;

  /**
   * Get database statistics
   */
  getStats(): Promise<Result<IDatabaseStats>>;

  /**
   * Create collection/table
   */
  createCollection(name: string, schema?: unknown): Promise<Result<void>>;

  /**
   * Drop collection/table
   */
  dropCollection(name: string): Promise<Result<void>>;

  /**
   * List collections/tables
   */
  listCollections(): Promise<Result<string[]>>;

  /**
   * Check if collection exists
   */
  collectionExists(name: string): Promise<Result<boolean>>;
}

/**
 * Transaction interface
 */
export interface ITransaction {
  readonly id: string;
  commit(): Promise<Result<void>>;
  rollback(): Promise<Result<void>>;
  isActive(): boolean;
}

/**
 * Factory function type for creating database adapters
 */
export type DatabaseAdapterFactory = (config: IDatabaseConfig) => IDatabaseAdapter;

/**
 * Registry for database adapters
 */
export interface IDatabaseAdapterRegistry {
  register(provider: 'postgres' | 'mongodb', factory: DatabaseAdapterFactory): void;
  get(provider: 'postgres' | 'mongodb'): DatabaseAdapterFactory;
  has(provider: 'postgres' | 'mongodb'): boolean;
}
