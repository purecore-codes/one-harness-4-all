/**
 * Graph Database Adapter Interface
 * Abstract interface for Neo4j and other graph database providers
 */

import { IAdapter, IGraphConfig, Result, IGraphNode, IGraphRelationship, RelationshipDirection } from '../../types';

export interface INodeCreateOptions {
  readonly labels: string[];
  readonly properties: Record<string, unknown>;
}

export interface IRelationshipCreateOptions {
  readonly type: string;
  readonly direction?: RelationshipDirection;
  readonly properties?: Record<string, unknown>;
}

export interface INodeQueryOptions {
  readonly labels?: string[];
  readonly properties?: Record<string, unknown>;
  readonly limit?: number;
  readonly skip?: number;
}

export interface ITraversalOptions {
  readonly maxDepth?: number;
  readonly relationshipTypes?: string[];
  readonly direction?: RelationshipDirection;
  readonly filter?: (node: IGraphNode, depth: number) => boolean;
}

export interface ICypherQueryOptions {
  readonly parameters?: Record<string, unknown>;
  readonly timeout?: number;
  readonly readOnly?: boolean;
}

export interface ICypherResult<T = Record<string, unknown>> {
  readonly records: T[];
  readonly summary: {
    readonly queryType: string;
    readonly counters: {
      readonly nodesCreated: number;
      readonly nodesDeleted: number;
      readonly relationshipsCreated: number;
      readonly relationshipsDeleted: number;
      readonly propertiesSet: number;
      readonly labelsAdded: number;
      readonly labelsRemoved: number;
      readonly indexesAdded: number;
      readonly indexesRemoved: number;
      readonly constraintsAdded: number;
      readonly constraintsRemoved: number;
    };
    readonly updateStatistics: boolean;
    readonly plan?: unknown;
    readonly profile?: unknown;
    readonly notifications?: Array<{
      readonly code: string;
      readonly title: string;
      readonly description: string;
      readonly severity: string;
    }>;
  };
}

export interface IGraphStats {
  readonly nodeCount: number;
  readonly relationshipCount: number;
  readonly labelCount: number;
  readonly relationshipTypeCount: number;
  readonly propertyKeyCount: number;
  readonly databaseSize?: number;
}

export interface IConstraintOptions {
  readonly name?: string;
  readonly type: 'UNIQUE' | 'EXISTS' | 'NODE_PROPERTY_EXISTS' | 'RELATIONSHIP_PROPERTY_EXISTS';
}

export interface IIndexOptions {
  readonly name?: string;
  readonly type?: 'RANGE' | 'TEXT' | 'POINT' | 'VECTOR';
  readonly properties: string[];
}

/**
 * Base Graph Database Adapter Interface
 */
export interface IGraphAdapter extends IAdapter<IGraphConfig, unknown> {
  /**
   * Create a node
   */
  createNode(labels: string[], properties: Record<string, unknown>): Promise<Result<IGraphNode>>;

  /**
   * Create multiple nodes in a transaction
   */
  createNodes(nodes: Array<{ labels: string[]; properties: Record<string, unknown> }>): Promise<Result<number>>;

  /**
   * Find a node by ID
   */
  findNodeById(nodeId: string): Promise<Result<IGraphNode | null>>;

  /**
   * Find nodes by labels and properties
   */
  findNodes(options: INodeQueryOptions): Promise<Result<IGraphNode[]>>;

  /**
   * Update a node
   */
  updateNode(nodeId: string, properties: Record<string, unknown>): Promise<Result<IGraphNode>>;

  /**
   * Delete a node
   */
  deleteNode(nodeId: string, detachRelationships?: boolean): Promise<Result<boolean>>;

  /**
   * Delete multiple nodes
   */
  deleteNodes(nodeIds: string[]): Promise<Result<number>>;

  /**
   * Create a relationship between two nodes
   */
  createRelationship(startNodeId: string, endNodeId: string, options: IRelationshipCreateOptions): Promise<Result<IGraphRelationship>>;

  /**
   * Find relationships
   */
  findRelationships(startNodeId?: string, endNodeId?: string, type?: string): Promise<Result<IGraphRelationship[]>>;

  /**
   * Delete a relationship
   */
  deleteRelationship(relationshipId: string): Promise<Result<boolean>>;

  /**
   * Traverse the graph from a starting node
   */
  traverse(startNodeId: string, options?: ITraversalOptions): Promise<Result<{
    nodes: IGraphNode[];
    relationships: IGraphRelationship[];
    paths: Array<{ nodes: string[]; relationships: string[] }>;
  }>>;

  /**
   * Execute a Cypher query (Neo4j specific but abstracted)
   */
  executeCypher<T>(query: string, options?: ICypherQueryOptions): Promise<Result<ICypherResult<T>>>;

  /**
   * Run a query in a read transaction
   */
  readTransaction<T>(queryFn: () => Promise<T>): Promise<Result<T>>;

  /**
   * Run a query in a write transaction
   */
  writeTransaction<T>(queryFn: () => Promise<T>): Promise<Result<T>>;

  /**
   * Get graph statistics
   */
  getStats(): Promise<Result<IGraphStats>>;

  /**
   * Create a constraint
   */
  createConstraint(label: string, property: string, options?: IConstraintOptions): Promise<Result<void>>;

  /**
   * Drop a constraint
   */
  dropConstraint(constraintName: string): Promise<Result<void>>;

  /**
   * List all constraints
   */
  listConstraints(): Promise<Result<Array<{ name: string; label: string; property: string; type: string }>>>;

  /**
   * Create an index
   */
  createIndex(label: string, properties: string[], options?: IIndexOptions): Promise<Result<void>>;

  /**
   * Drop an index
   */
  dropIndex(indexName: string): Promise<Result<void>>;

  /**
   * List all indexes
   */
  listIndexes(): Promise<Result<Array<{ name: string; label: string; properties: string[]; type: string }>>>;

  /**
   * Check if a label exists
   */
  labelExists(label: string): Promise<Result<boolean>>;

  /**
   * Get all labels
   */
  getAllLabels(): Promise<Result<string[]>>;

  /**
   * Get all relationship types
   */
  getAllRelationshipTypes(): Promise<Result<string[]>>;

  /**
   * Get all property keys
   */
  getAllPropertyKeys(): Promise<Result<string[]>>;

  /**
   * Import data in bulk
   */
  importData(data: {
    nodes?: Array<{ labels: string[]; properties: Record<string, unknown> }>;
    relationships?: Array<{
      startNodeId: string;
      endNodeId: string;
      type: string;
      properties?: Record<string, unknown>;
    }>;
  }): Promise<Result<{ nodesCreated: number; relationshipsCreated: number }>>;

  /**
   * Export graph data
   */
  exportData(options?: { labels?: string[]; relationshipTypes?: string[] }): Promise<Result<{
    nodes: IGraphNode[];
    relationships: IGraphRelationship[];
  }>>;
}

/**
 * Factory function type for creating graph adapters
 */
export type GraphAdapterFactory = (config: IGraphConfig) => IGraphAdapter;

/**
 * Registry for graph adapters
 */
export interface IGraphAdapterRegistry {
  register(provider: 'neo4j', factory: GraphAdapterFactory): void;
  get(provider: 'neo4j'): GraphAdapterFactory;
  has(provider: 'neo4j'): boolean;
}
