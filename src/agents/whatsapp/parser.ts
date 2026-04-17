/**
 * WhatsApp Agent Configuration Parser
 * Parses YAML/JSON configuration files and creates agent instances
 */

import { IWhatsAppAgentConfig, IAnyResponse } from './types';
import { whatsappAgentValidator, IValidationResult } from './validator';

// Dynamic imports for Node.js modules
let fsModule: typeof import('fs') | undefined = undefined;
let pathModule: typeof import('path') | undefined = undefined;

async function loadNodeModules() {
  if (!fsModule) {
    const mod = await import('fs');
    fsModule = mod;
  }
  if (!pathModule) {
    const mod = await import('path');
    pathModule = mod;
  }
  return { fs: fsModule!, path: pathModule! };
}

/**
 * Configuration source types
 */
export type ConfigSource = 
  | { type: 'file'; filePath: string }
  | { type: 'json'; content: string }
  | { type: 'yaml'; content: string }
  | { type: 'object'; config: Record<string, unknown> };

/**
 * Parse result with validation info
 */
export interface IParseResult<T = IWhatsAppAgentConfig> {
  readonly success: boolean;
  readonly config?: T;
  readonly validation?: IValidationResult;
  readonly error?: Error;
  readonly warnings: Array<{ path: string; message: string }>;
  readonly metadata: {
    readonly sourceType: ConfigSource['type'];
    readonly parsedAt: string;
    readonly parseTimeMs: number;
  };
}

/**
 * WhatsApp Agent Configuration Parser
 * Supports YAML and JSON formats
 */
export class WhatsAppAgentParser {
  
  /**
   * Parse configuration from various sources
   */
  async parse(source: ConfigSource): Promise<IParseResult> {
    const startTime = Date.now();
    const warnings: Array<{ path: string; message: string }> = [];

    try {
      let rawConfig: unknown;

      // Load configuration based on source type
      switch (source.type) {
        case 'file':
          rawConfig = await this.loadFromFile(source.filePath);
          break;
        case 'json':
          rawConfig = this.parseJSON(source.content);
          break;
        case 'yaml':
          rawConfig = await this.parseYAML(source.content);
          break;
        case 'object':
          rawConfig = source.config;
          break;
        default:
          throw new Error(`Unknown source type: ${(source as any).type}`);
      }

      // Validate the configuration
      const validationResult = whatsappAgentValidator.validate(rawConfig);

      // Add warnings from validation
      warnings.push(...validationResult.warnings.map(w => ({
        path: w.path,
        message: w.message,
      })));

      // If validation failed, return error
      if (!validationResult.valid) {
        return {
          success: false,
          validation: validationResult,
          error: new Error(`Configuration validation failed with ${validationResult.errors.length} errors`),
          warnings,
          metadata: {
            sourceType: source.type,
            parsedAt: new Date().toISOString(),
            parseTimeMs: Date.now() - startTime,
          },
        };
      }

      // Cast to typed config (validation passed)
      const config = rawConfig as IWhatsAppAgentConfig;

      return {
        success: true,
        config,
        validation: validationResult,
        warnings,
        metadata: {
          sourceType: source.type,
          parsedAt: new Date().toISOString(),
          parseTimeMs: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        warnings,
        metadata: {
          sourceType: source.type,
          parsedAt: new Date().toISOString(),
          parseTimeMs: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Load configuration from a file (auto-detect format)
   */
  private async loadFromFile(filePath: string): Promise<unknown> {
    const { fs, path } = await loadNodeModules();
    const absolutePath = path.resolve(filePath);
    
    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Configuration file not found: ${absolutePath}`);
    }

    const content = fs.readFileSync(absolutePath, 'utf-8');
    const ext = path.extname(absolutePath).toLowerCase();

    // Parse based on extension
    if (ext === '.json') {
      return this.parseJSON(content);
    } else if (ext === '.yaml' || ext === '.yml') {
      return this.parseYAML(content);
    } else {
      throw new Error(`Unsupported file extension: ${ext}. Use .json, .yaml, or .yml`);
    }
  }

  /**
   * Parse JSON string
   */
  private parseJSON(content: string): unknown {
    try {
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse YAML string
   * Uses dynamic import to avoid requiring js-yaml if not needed
   */
  private async parseYAML(content: string): Promise<unknown> {
    try {
      // Try to use js-yaml if available
      const yaml = await import('js-yaml');
      return yaml.load(content);
    } catch (error) {
      // Fallback: try to parse as JSON if js-yaml is not available
      const err = error instanceof Error ? error : new Error(String(error));
      if ((err as any).code === 'MODULE_NOT_FOUND') {
        console.warn('js-yaml not installed. Attempting to parse YAML as JSON...');
        try {
          return JSON.parse(content);
        } catch {
          throw new Error('Failed to parse configuration. Install js-yaml for YAML support: npm install js-yaml');
        }
      }
      throw new Error(`Invalid YAML: ${err.message}`);
    }
  }

  /**
   * Parse multiple configurations from a directory
   */
  async parseDirectory(dirPath: string): Promise<Array<IParseResult<IWhatsAppAgentConfig>>> {
    const { path, fs } = await loadNodeModules();
    const absoluteDir = path.resolve(dirPath);
    
    if (!fs.existsSync(absoluteDir)) {
      throw new Error(`Directory not found: ${absoluteDir}`);
    }

    const results: Array<IParseResult<IWhatsAppAgentConfig>> = [];
    const files = fs.readdirSync(absoluteDir);

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (['.json', '.yaml', '.yml'].includes(ext)) {
        const filePath = path.join(absoluteDir, file);
        const result = await this.parse({ type: 'file', filePath });
        results.push(result as IParseResult<IWhatsAppAgentConfig>);
      }
    }

    return results;
  }

  /**
   * Merge multiple configurations (for composition)
   */
  mergeConfigs(...configs: Array<Partial<IWhatsAppAgentConfig>>): IWhatsAppAgentConfig {
    if (configs.length === 0) {
      throw new Error('At least one configuration is required');
    }

    // Deep merge configurations
    const merged = configs.reduce((acc, config) => {
      return this.deepMerge(acc, config);
    }, {} as Record<string, unknown>);

    return merged as unknown as IWhatsAppAgentConfig;
  }

  /**
   * Deep merge two objects
   */
  private deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
    const result = { ...target };

    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sourceValue = source[key];
        const targetValue = target[key];

        if (this.isObject(sourceValue) && this.isObject(targetValue)) {
          result[key] = this.deepMerge(targetValue as Record<string, unknown>, sourceValue as Record<string, unknown>);
        } else if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
          // For arrays, concatenate and remove duplicates based on 'id' field if present
          result[key] = this.mergeArrays(targetValue, sourceValue);
        } else {
          result[key] = sourceValue;
        }
      }
    }

    return result;
  }

  /**
   * Merge arrays with duplicate removal
   */
  private mergeArrays<T>(target: T[], source: T[]): T[] {
    const merged = [...target, ...source];
    
    // Remove duplicates if objects have 'id' field
    if (merged.length > 0 && typeof merged[0] === 'object' && merged[0] !== null && 'id' in merged[0]) {
      const map = new Map();
      for (const item of merged) {
        if (item && typeof item === 'object' && 'id' in item) {
          const id = (item as any).id;
          if (id !== undefined) {
            map.set(id, item);
          }
        }
      }
      return Array.from(map.values()) as T[];
    }

    return merged;
  }

  /**
   * Check if value is a plain object
   */
  private isObject(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  /**
   * Create a configuration template
   */
  createTemplate(options?: {
    withAI?: boolean;
    withFlows?: boolean;
    provider?: 'twilio' | 'meta-cloud-api' | 'whatsapp-business-api';
  }): Partial<IWhatsAppAgentConfig> {
    const template: any = {
      agentId: '00000000-0000-0000-0000-000000000000' as any,
      name: 'My WhatsApp Agent',
      description: 'A WhatsApp agent configured via YAML/JSON',
      version: '1.0.0',
      enabled: true,
      whatsapp: {
        provider: options?.provider || 'meta-cloud-api',
      },
      session: {
        enabled: true,
        ttl: 3600,
        storage: 'redis',
        keyPrefix: 'whatsapp:session:',
      },
      rateLimit: {
        enabled: true,
        windowMs: 60000,
        maxMessages: 20,
        bySender: true,
      },
      rules: [
        {
          id: 'greeting-rule',
          name: 'Greeting Rule',
          description: 'Respond to greetings',
          priority: 100,
          enabled: true,
          condition: {
            field: 'text.body',
            operator: 'regex',
            pattern: '^(hi|hello|hey|olá|bom dia|boa tarde|boa noite)',
            caseSensitive: false,
          },
          actions: [
            {
              type: 'typing_indicator' as any,
              duration: 1000,
            } as any,
            {
              type: 'reply_text' as any,
              response: {
                type: 'text',
                content: 'Hello! How can I help you today?',
              },
            } as any,
          ],
        },
      ],
      flows: [],
      functions: [],
    };

    if (options?.withAI) {
      template.ai = {
        enabled: true,
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.7,
        systemPrompt: 'You are a helpful assistant.',
        contextWindow: 10,
        fallbackToRules: true,
      };
    }

    if (options?.withFlows) {
      template.flows = [
        {
          id: 'support-flow',
          name: 'Customer Support Flow',
          description: 'Basic customer support conversation flow',
          initialState: 'greeting',
          states: [
            {
              id: 'greeting',
              name: 'Greeting',
              defaultActions: [
                {
                  type: 'reply_text' as any,
                  response: {
                    type: 'text',
                    content: 'Welcome! How can I assist you?',
                  },
                } as any,
              ],
            },
          ],
          transitions: [],
        },
      ];
    }

    return template;
  }
}

/**
 * Singleton instance of the parser
 */
export const whatsappAgentParser = new WhatsAppAgentParser();
