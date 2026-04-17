/**
 * Cache Adapter Interface
 * Abstract interface for Redis cache provider
 */

import { IAdapter, ICacheConfig, Result } from '../../types';

export interface ICacheEntry<T = unknown> {
  readonly key: string;
  readonly value: T;
  readonly ttl?: number;
  readonly createdAt: number;
}

export interface ICacheSetOptions {
  readonly ttl?: number;
  readonly nx?: boolean; // Only set if not exists
  readonly xx?: boolean; // Only set if exists
}

export interface ICacheGetOptions {
  readonly parse?: boolean;
}

export interface ICacheStats {
  readonly hits: number;
  readonly misses: number;
  readonly keys: number;
  readonly memoryUsed?: number;
  readonly hitRate?: number;
}

/**
 * Base Cache Adapter Interface
 */
export interface ICacheAdapter extends IAdapter<ICacheConfig, unknown> {
  /**
   * Get a value from cache
   */
  get<T>(key: string, options?: ICacheGetOptions): Promise<Result<T | null>>;

  /**
   * Set a value in cache
   */
  set<T>(key: string, value: T, options?: ICacheSetOptions): Promise<Result<void>>;

  /**
   * Delete a key from cache
   */
  delete(key: string): Promise<Result<boolean>>;

  /**
   * Check if a key exists
   */
  exists(key: string): Promise<Result<boolean>>;

  /**
   * Set expiration on a key
   */
  expire(key: string, ttl: number): Promise<Result<void>>;

  /**
   * Get multiple keys at once
   */
  mget<T>(keys: string[]): Promise<Result<(T | null)[]>>;

  /**
   * Set multiple keys at once
   */
  mset(entries: Array<{ key: string; value: unknown; ttl?: number }>): Promise<Result<void>>;

  /**
   * Increment a numeric value
   */
  incr(key: string, by?: number): Promise<Result<number>>;

  /**
   * Decrement a numeric value
   */
  decr(key: string, by?: number): Promise<Result<number>>;

  /**
   * Get cache statistics
   */
  getStats(): Promise<Result<ICacheStats>>;

  /**
   * Clear all keys with a specific prefix
   */
  clearByPrefix(prefix: string): Promise<Result<number>>;

  /**
   * List keys matching a pattern
   */
  keys(pattern: string): Promise<Result<string[]>>;

  /**
   * Set a value and return the old value (atomic)
   */
  getAndSet<T>(key: string, value: T, options?: ICacheSetOptions): Promise<Result<T | null>>;

  /**
   * Execute a Lua script
   */
  evalScript<T>(script: string, keys: string[], args: unknown[]): Promise<Result<T>>;

  /**
   * Publish to a channel
   */
  publish(channel: string, message: string): Promise<Result<number>>;

  /**
   * Subscribe to a channel
   */
  subscribe(channel: string, handler: (message: string) => void): Promise<Result<void>>;

  /**
   * Add to a sorted set
   */
  zadd(key: string, score: number, member: string): Promise<Result<number>>;

  /**
   * Get range from sorted set
   */
  zrange(key: string, start: number, stop: number, withScores?: boolean): Promise<Result<string[]>>;

  /**
   * Remove from sorted set
   */
  zrem(key: string, members: string[]): Promise<Result<number>>;

  /**
   * Add to a list (left push)
   */
  lpush(key: string, values: unknown[]): Promise<Result<number>>;

  /**
   * Get range from list
   */
  lrange(key: string, start: number, stop: number): Promise<Result<unknown[]>>;

  /**
   * Add to a set
   */
  sadd(key: string, members: string[]): Promise<Result<number>>;

  /**
   * Get all members of a set
   */
  smembers(key: string): Promise<Result<string[]>>;

  /**
   * Check if member exists in set
   */
  sismember(key: string, member: string): Promise<Result<boolean>>;
}

/**
 * Factory function type for creating cache adapters
 */
export type CacheAdapterFactory = (config: ICacheConfig) => ICacheAdapter;

/**
 * Registry for cache adapters
 */
export interface ICacheAdapterRegistry {
  register(provider: 'redis', factory: CacheAdapterFactory): void;
  get(provider: 'redis'): CacheAdapterFactory;
  has(provider: 'redis'): boolean;
}
