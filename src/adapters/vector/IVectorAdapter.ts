/**
 * Vector Database Adapter Interface
 * Abstract interface for pgvector and other vector database providers
 */

import { IAdapter, IVectorConfig, Result, SimilarityMetric, IVectorEmbedding } from '../../types';

export interface IVectorSearchOptions {
  readonly limit?: number;
  readonly similarityThreshold?: number;
  readonly filters?: Record<string, unknown>;
  readonly includeMetadata?: boolean;
  readonly includeDistance?: boolean;
}

export interface IVectorSearchResult<T = unknown> {
  readonly id: string;
  readonly distance: number;
  readonly similarity: number;
  readonly metadata: T;
  readonly vector?: number[];
}

export interface IIndexConfig {
  readonly indexType?: 'ivfflat' | 'hnsw' | 'flat';
  readonly lists?: number; // For IVFFlat
  readonly m?: number; // For HNSW
  readonly efConstruction?: number; // For HNSW
}

export interface IVectorStats {
  readonly totalVectors: number;
  readonly dimensions: number;
  readonly indexSize?: number;
  readonly indexType?: string;
}

/**
 * Base Vector Database Adapter Interface
 */
export interface IVectorAdapter extends IAdapter<IVectorConfig, unknown> {
  /**
   * Insert a single vector embedding
   */
  insert(embedding: IVectorEmbedding): Promise<Result<string>>;

  /**
   * Insert multiple vector embeddings
   */
  insertMany(embeddings: IVectorEmbedding[]): Promise<Result<number>>;

  /**
   * Search for similar vectors
   */
  search(query: number[], options?: IVectorSearchOptions): Promise<Result<IVectorSearchResult[]>>;

  /**
   * Search with filter
   */
  searchWithFilter(query: number[], filters: Record<string, unknown>, limit?: number): Promise<Result<IVectorSearchResult[]>>;

  /**
   * Get a vector by ID
   */
  getById(id: string, includeVector?: boolean): Promise<Result<IVectorEmbedding | null>>;

  /**
   * Delete a vector by ID
   */
  delete(id: string): Promise<Result<boolean>>;

  /**
   * Delete multiple vectors by IDs
   */
  deleteMany(ids: string[]): Promise<Result<number>>;

  /**
   * Update a vector
   */
  update(id: string, updates: Partial<IVectorEmbedding>): Promise<Result<boolean>>;

  /**
   * Create an index for vector similarity search
   */
  createIndex(indexName: string, config?: IIndexConfig): Promise<Result<void>>;

  /**
   * Drop an index
   */
  dropIndex(indexName: string): Promise<Result<void>>;

  /**
   * Check if index exists
   */
  indexExists(indexName: string): Promise<Result<boolean>>;

  /**
   * Get vector statistics
   */
  getStats(): Promise<Result<IVectorStats>>;

  /**
   * Calculate similarity between two vectors
   */
  calculateSimilarity(vector1: number[], vector2: number[], metric?: SimilarityMetric): Promise<Result<number>>;

  /**
   * Normalize a vector
   */
  normalize(vector: number[]): Promise<Result<number[]>>;

  /**
   * Batch search for multiple queries
   */
  batchSearch(queries: number[][], options?: IVectorSearchOptions): Promise<Result<IVectorSearchResult[][]>>;

  /**
   * Upsert a vector (insert or update)
   */
  upsert(embedding: IVectorEmbedding): Promise<Result<string>>;

  /**
   * List all collections/indexes
   */
  listCollections(): Promise<Result<string[]>>;

  /**
   * Create a collection for storing vectors
   */
  createCollection(collectionName: string, dimensions: number, metric?: SimilarityMetric): Promise<Result<void>>;

  /**
   * Delete a collection
   */
  deleteCollection(collectionName: string): Promise<Result<void>>;
}

/**
 * Factory function type for creating vector adapters
 */
export type VectorAdapterFactory = (config: IVectorConfig) => IVectorAdapter;

/**
 * Registry for vector adapters
 */
export interface IVectorAdapterRegistry {
  register(provider: 'pgvector', factory: VectorAdapterFactory): void;
  get(provider: 'pgvector'): VectorAdapterFactory;
  has(provider: 'pgvector'): boolean;
}
