/**
 * WhatsApp Agent Schema Validator
 * Validates WhatsApp agent configuration from YAML/JSON
 */

import { ICondition, ICompoundCondition } from './types';

/**
 * Validation error structure
 */
export interface IValidationError {
  readonly path: string;
  readonly message: string;
  readonly code: string;
  readonly value?: unknown;
}

/**
 * Validation result
 */
export interface IValidationResult {
  readonly valid: boolean;
  readonly errors: IValidationError[];
  readonly warnings: IValidationError[];
}

/**
 * WhatsApp Agent Configuration Validator
 */
export class WhatsAppAgentValidator {
  
  /**
   * Validate a complete WhatsApp agent configuration
   */
  validate(config: unknown): IValidationResult {
    const errors: IValidationError[] = [];
    const warnings: IValidationError[] = [];

    // Check if config is an object
    if (!config || typeof config !== 'object') {
      errors.push({
        path: '',
        message: 'Configuration must be an object',
        code: 'INVALID_TYPE',
        value: config,
      });
      return { valid: false, errors, warnings };
    }

    const agentConfig = config as Record<string, unknown>;

    // Validate required fields
    this.validateRequiredFields(agentConfig, errors);
    
    // Validate agent section
    if (agentConfig.agentId) {
      this.validateAgentId(agentConfig.agentId as string, errors);
    }

    // Validate name
    if (agentConfig.name) {
      this.validateName(agentConfig.name as string, errors);
    }

    // Validate version
    if (agentConfig.version) {
      this.validateVersion(agentConfig.version as string, errors);
    }

    // Validate WhatsApp connection config
    if (agentConfig.whatsapp) {
      this.validateWhatsAppConfig(agentConfig.whatsapp as Record<string, unknown>, errors);
    }

    // Validate session config
    if (agentConfig.session) {
      this.validateSessionConfig(agentConfig.session as Record<string, unknown>, errors);
    }

    // Validate rate limit config
    if (agentConfig.rateLimit) {
      this.validateRateLimitConfig(agentConfig.rateLimit as Record<string, unknown>, errors);
    }

    // Validate rules
    if (agentConfig.rules) {
      this.validateRules(agentConfig.rules as Array<unknown>, errors, warnings);
    }

    // Validate flows
    if (agentConfig.flows) {
      this.validateFlows(agentConfig.flows as Array<unknown>, errors, warnings);
    }

    // Validate functions
    if (agentConfig.functions) {
      this.validateFunctions(agentConfig.functions as Array<unknown>, errors);
    }

    // Validate AI config if present
    if (agentConfig.ai) {
      this.validateAIConfig(agentConfig.ai as Record<string, unknown>, errors, warnings);
    }

    // Validate analytics config if present
    if (agentConfig.analytics) {
      this.validateAnalyticsConfig(agentConfig.analytics as Record<string, unknown>, errors);
    }

    // Validate default responses if present
    if (agentConfig.defaultResponses) {
      this.validateDefaultResponses(
        agentConfig.defaultResponses as Record<string, unknown>,
        errors,
        warnings
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate required fields exist
   */
  private validateRequiredFields(
    config: Record<string, unknown>,
    errors: IValidationError[]
  ): void {
    const requiredFields = ['agentId', 'name', 'version', 'enabled', 'whatsapp', 'session', 'rateLimit'];
    
    for (const field of requiredFields) {
      if (!(field in config)) {
        errors.push({
          path: field,
          message: `Required field "${field}" is missing`,
          code: 'MISSING_REQUIRED_FIELD',
        });
      }
    }
  }

  /**
   * Validate agent ID format
   */
  private validateAgentId(agentId: string, errors: IValidationError[]): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(agentId)) {
      errors.push({
        path: 'agentId',
        message: 'Agent ID must be a valid UUID',
        code: 'INVALID_UUID',
        value: agentId,
      });
    }
  }

  /**
   * Validate agent name
   */
  private validateName(name: string, errors: IValidationError[]): void {
    if (name.length < 3 || name.length > 100) {
      errors.push({
        path: 'name',
        message: 'Name must be between 3 and 100 characters',
        code: 'INVALID_LENGTH',
        value: name,
      });
    }
  }

  /**
   * Validate version format (semver)
   */
  private validateVersion(version: string, errors: IValidationError[]): void {
    const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*)?$/;
    if (!semverRegex.test(version)) {
      errors.push({
        path: 'version',
        message: 'Version must be in semver format (e.g., 1.0.0)',
        code: 'INVALID_VERSION',
        value: version,
      });
    }
  }

  /**
   * Validate WhatsApp connection configuration
   */
  private validateWhatsAppConfig(
    config: Record<string, unknown>,
    errors: IValidationError[]
  ): void {
    const requiredFields = ['provider'];
    const validProviders = ['twilio', 'whatsapp-business-api', 'wenovate', '360dialog', 'meta-cloud-api'];

    for (const field of requiredFields) {
      if (!(field in config)) {
        errors.push({
          path: `whatsapp.${field}`,
          message: `Required field "${field}" is missing in whatsapp config`,
          code: 'MISSING_REQUIRED_FIELD',
        });
      }
    }

    if ('provider' in config && !validProviders.includes(config['provider'] as string)) {
      errors.push({
        path: 'whatsapp.provider',
        message: `Invalid provider. Must be one of: ${validProviders.join(', ')}`,
        code: 'INVALID_PROVIDER',
        value: config['provider'],
      });
    }
  }

  /**
   * Validate session configuration
   */
  private validateSessionConfig(
    config: Record<string, unknown>,
    errors: IValidationError[]
  ): void {
    const requiredFields = ['enabled', 'ttl', 'storage', 'keyPrefix'];
    
    for (const field of requiredFields) {
      if (!(field in config)) {
        errors.push({
          path: `session.${field}`,
          message: `Required field "${field}" is missing in session config`,
          code: 'MISSING_REQUIRED_FIELD',
        });
      }
    }

    if ('storage' in config && !['memory', 'redis', 'database'].includes(config['storage'] as string)) {
      errors.push({
        path: 'session.storage',
        message: 'Storage must be one of: memory, redis, database',
        code: 'INVALID_STORAGE',
        value: config['storage'],
      });
    }

    if ('ttl' in config && typeof config['ttl'] === 'number' && config['ttl'] <= 0) {
      errors.push({
        path: 'session.ttl',
        message: 'TTL must be a positive number',
        code: 'INVALID_TTL',
        value: config['ttl'],
      });
    }
  }

  /**
   * Validate rate limit configuration
   */
  private validateRateLimitConfig(
    config: Record<string, unknown>,
    errors: IValidationError[]
  ): void {
    const requiredFields = ['enabled', 'windowMs', 'maxMessages'];
    
    for (const field of requiredFields) {
      if (!(field in config)) {
        errors.push({
          path: `rateLimit.${field}`,
          message: `Required field "${field}" is missing in rateLimit config`,
          code: 'MISSING_REQUIRED_FIELD',
        });
      }
    }

    if ('windowMs' in config && typeof config['windowMs'] === 'number' && config['windowMs'] <= 0) {
      errors.push({
        path: 'rateLimit.windowMs',
        message: 'windowMs must be a positive number',
        code: 'INVALID_VALUE',
        value: config['windowMs'],
      });
    }

    if ('maxMessages' in config && typeof config['maxMessages'] === 'number' && config['maxMessages'] <= 0) {
      errors.push({
        path: 'rateLimit.maxMessages',
        message: 'maxMessages must be a positive number',
        code: 'INVALID_VALUE',
        value: config['maxMessages'],
      });
    }
  }

  /**
   * Validate rules array
   */
  private validateRules(
    rules: Array<unknown>,
    errors: IValidationError[],
    warnings: IValidationError[]
  ): void {
    if (!Array.isArray(rules)) {
      errors.push({
        path: 'rules',
        message: 'Rules must be an array',
        code: 'INVALID_TYPE',
        value: rules,
      });
      return;
    }

    rules.forEach((rule, index) => {
      const ruleObj = rule as Record<string, unknown>;
      const basePath = `rules[${index}]`;

      // Validate required rule fields
      const requiredFields = ['id', 'name', 'priority', 'enabled', 'condition', 'actions'];
      for (const field of requiredFields) {
        if (!(field in ruleObj)) {
          errors.push({
            path: `${basePath}.${field}`,
            message: `Required field "${field}" is missing in rule`,
            code: 'MISSING_REQUIRED_FIELD',
          });
        }
      }

      // Validate condition
      if (ruleObj.condition) {
        this.validateCondition(ruleObj.condition as Record<string, unknown>, `${basePath}.condition`, errors);
      }

      // Validate actions
      if (ruleObj.actions && Array.isArray(ruleObj.actions)) {
        ruleObj.actions.forEach((action: unknown, actionIndex: number) => {
          this.validateAction(action as Record<string, unknown>, `${basePath}.actions[${actionIndex}]`, errors);
        });
      }

      // Check for duplicate rule IDs
      const currentId = ruleObj.id;
      const duplicates = rules.filter(
        (r, i) => i !== index && (r as Record<string, unknown>).id === currentId
      );
      if (duplicates.length > 0) {
        warnings.push({
          path: `${basePath}.id`,
          message: `Duplicate rule ID: ${currentId}`,
          code: 'DUPLICATE_ID',
          value: currentId,
        });
      }
    });
  }

  /**
   * Validate a single condition (simple or compound)
   */
  private validateCondition(
    condition: Record<string, unknown>,
    path: string,
    errors: IValidationError[]
  ): void {
    // Check if it's a compound condition
    if ('logicalOperator' in condition && 'conditions' in condition) {
      const compound = condition as unknown as ICompoundCondition;
      if (!['AND', 'OR', 'NOT'].includes(compound.logicalOperator)) {
        errors.push({
          path: `${path}.logicalOperator`,
          message: 'logicalOperator must be AND, OR, or NOT',
          code: 'INVALID_LOGICAL_OPERATOR',
          value: compound.logicalOperator,
        });
      }

      if (!Array.isArray(compound.conditions) || compound.conditions.length === 0) {
        errors.push({
          path: `${path}.conditions`,
          message: 'conditions must be a non-empty array',
          code: 'INVALID_CONDITIONS',
          value: compound.conditions,
        });
      } else {
        compound.conditions.forEach((cond, index) => {
          this.validateCondition(cond as unknown as Record<string, unknown>, `${path}.conditions[${index}]`, errors);
        });
      }
    } else {
      // Simple condition
      const simple = condition as unknown as ICondition;
      
      if (!simple.field || typeof simple.field !== 'string') {
        errors.push({
          path: `${path}.field`,
          message: 'field is required and must be a string',
          code: 'INVALID_FIELD',
        });
      }

      const validOperators = [
        'equals', 'not_equals', 'contains', 'starts_with', 'ends_with',
        'regex', 'greater_than', 'less_than', 'in', 'not_in', 'exists', 'not_exists'
      ];

      if (simple.operator && !validOperators.includes(simple.operator)) {
        errors.push({
          path: `${path}.operator`,
          message: `operator must be one of: ${validOperators.join(', ')}`,
          code: 'INVALID_OPERATOR',
          value: simple.operator,
        });
      }

      // Validate that 'value' exists for operators that need it
      const needsValue = ['equals', 'not_equals', 'contains', 'starts_with', 'ends_with', 'regex', 'greater_than', 'less_than'];
      if (simple.operator && needsValue.includes(simple.operator) && simple.value === undefined) {
        errors.push({
          path: `${path}.value`,
          message: `value is required for operator "${simple.operator}"`,
          code: 'MISSING_VALUE',
        });
      }

      // Validate that 'values' exists for 'in' and 'not_in' operators
      if (simple.operator && ['in', 'not_in'].includes(simple.operator) && !simple.values) {
        errors.push({
          path: `${path}.values`,
          message: `values array is required for operator "${simple.operator}"`,
          code: 'MISSING_VALUES',
        });
      }
    }
  }

  /**
   * Validate an action
   */
  private validateAction(
    action: Record<string, unknown>,
    path: string,
    errors: IValidationError[]
  ): void {
    if (!action.type) {
      errors.push({
        path: `${path}.type`,
        message: 'Action type is required',
        code: 'MISSING_TYPE',
      });
      return;
    }

    const validTypes = [
      'reply_text', 'reply_media', 'send_template', 'send_buttons', 'send_list',
      'call_function', 'forward_message', 'mark_read', 'typing_indicator', 'presence_update'
    ];

    if (!validTypes.includes(action.type as string)) {
      errors.push({
        path: `${path}.type`,
        message: `Invalid action type. Must be one of: ${validTypes.join(', ')}`,
        code: 'INVALID_ACTION_TYPE',
        value: action.type,
      });
    }

    // Validate response based on type
    if (action.response) {
      this.validateResponse(action.response as Record<string, unknown>, `${path}.response`, errors, action.type as string);
    }

    // Validate function call specifics
    if (action.type === 'call_function') {
      if (!action.functionName) {
        errors.push({
          path: `${path}.functionName`,
          message: 'functionName is required for call_function action',
          code: 'MISSING_FUNCTION_NAME',
        });
      }
    }
  }

  /**
   * Validate a response object
   */
  private validateResponse(
    response: Record<string, unknown>,
    path: string,
    errors: IValidationError[],
    actionType: string
  ): void {
    if (!response.type) {
      errors.push({
        path: `${path}.type`,
        message: 'Response type is required',
        code: 'MISSING_TYPE',
      });
      return;
    }

    // Type-specific validation
    if (response.type === 'text' && !response.content) {
      errors.push({
        path: `${path}.content`,
        message: 'Text response requires content field',
        code: 'MISSING_CONTENT',
      });
    }

    if (['image', 'video', 'audio', 'document'].includes(response.type as string) && !response.url) {
      errors.push({
        path: `${path}.url`,
        message: `${response.type} response requires url field`,
        code: 'MISSING_URL',
      });
    }

    if (response.type === 'buttons' && (!response.body || !Array.isArray(response.buttons))) {
      errors.push({
        path: `${path}`,
        message: 'Buttons response requires body and buttons array',
        code: 'INVALID_BUTTONS',
      });
    }

    if (response.type === 'template' && !response.name) {
      errors.push({
        path: `${path}.name`,
        message: 'Template response requires name field',
        code: 'MISSING_TEMPLATE_NAME',
      });
    }
  }

  /**
   * Validate conversation flows
   */
  private validateFlows(
    flows: Array<unknown>,
    errors: IValidationError[],
    warnings: IValidationError[]
  ): void {
    if (!Array.isArray(flows)) {
      errors.push({
        path: 'flows',
        message: 'Flows must be an array',
        code: 'INVALID_TYPE',
        value: flows,
      });
      return;
    }

    flows.forEach((flow, index) => {
      const flowObj = flow as Record<string, unknown>;
      const basePath = `flows[${index}]`;

      const requiredFields = ['id', 'name', 'initialState', 'states', 'transitions'];
      for (const field of requiredFields) {
        if (!(field in flowObj)) {
          errors.push({
            path: `${basePath}.${field}`,
            message: `Required field "${field}" is missing in flow`,
            code: 'MISSING_REQUIRED_FIELD',
          });
        }
      }

      // Validate states reference initial state
      if (flowObj.initialState && flowObj.states) {
        const states = flowObj.states as Array<Record<string, unknown>>;
        const stateIds = states.map(s => s.id);
        if (!stateIds.includes(flowObj.initialState)) {
          errors.push({
            path: `${basePath}.initialState`,
            message: 'initialState must reference a valid state ID',
            code: 'INVALID_STATE_REFERENCE',
            value: flowObj.initialState,
          });
        }
      }
    });
  }

  /**
   * Validate function definitions
   */
  private validateFunctions(
    functions: Array<unknown>,
    errors: IValidationError[]
  ): void {
    if (!Array.isArray(functions)) {
      errors.push({
        path: 'functions',
        message: 'Functions must be an array',
        code: 'INVALID_TYPE',
        value: functions,
      });
      return;
    }

    functions.forEach((fn, index) => {
      const fnObj = fn as Record<string, unknown>;
      const basePath = `functions[${index}]`;

      const requiredFields = ['name', 'description', 'handler'];
      for (const field of requiredFields) {
        if (!(field in fnObj)) {
          errors.push({
            path: `${basePath}.${field}`,
            message: `Required field "${field}" is missing in function`,
            code: 'MISSING_REQUIRED_FIELD',
          });
        }
      }

      // Validate parameters if present
      if (fnObj.parameters && Array.isArray(fnObj.parameters)) {
        const params = fnObj.parameters as Array<Record<string, unknown>>;
        params.forEach((param, paramIndex) => {
          if (!param.name || !param.type) {
            errors.push({
              path: `${basePath}.parameters[${paramIndex}]`,
              message: 'Function parameter must have name and type',
              code: 'INVALID_PARAMETER',
            });
          }
        });
      }
    });
  }

  /**
   * Validate AI configuration
   */
  private validateAIConfig(
    config: Record<string, unknown>,
    errors: IValidationError[],
    warnings: IValidationError[]
  ): void {
    if (config.enabled === true) {
      const validProviders = ['openai', 'anthropic', 'google', 'azure', 'local'];
      if (config.provider && !validProviders.includes(config.provider as string)) {
        errors.push({
          path: 'ai.provider',
          message: `Invalid AI provider. Must be one of: ${validProviders.join(', ')}`,
          code: 'INVALID_PROVIDER',
          value: config.provider,
        });
      }

      if (!config.apiKey && config.provider !== 'local') {
        warnings.push({
          path: 'ai.apiKey',
          message: 'apiKey is recommended when AI is enabled',
          code: 'MISSING_API_KEY',
        });
      }

      if (typeof config.temperature === 'number' && (config.temperature < 0 || config.temperature > 2)) {
        errors.push({
          path: 'ai.temperature',
          message: 'temperature must be between 0 and 2',
          code: 'INVALID_TEMPERATURE',
          value: config.temperature,
        });
      }
    }
  }

  /**
   * Validate analytics configuration
   */
  private validateAnalyticsConfig(
    config: Record<string, unknown>,
    errors: IValidationError[]
  ): void {
    if (config.enabled === true) {
      const requiredFields = ['trackMessages', 'trackConversations', 'trackUserBehavior'];
      for (const field of requiredFields) {
        if (!(field in config)) {
          errors.push({
            path: `analytics.${field}`,
            message: `Required field "${field}" is missing in analytics config`,
            code: 'MISSING_REQUIRED_FIELD',
          });
        }
      }
    }
  }

  /**
   * Validate default responses
   */
  private validateDefaultResponses(
    responses: Record<string, unknown>,
    errors: IValidationError[],
    warnings: IValidationError[]
  ): void {
    const validKeys = ['unmatched', 'error', 'rateLimited', 'sessionExpired'];
    
    for (const [key, value] of Object.entries(responses)) {
      if (!validKeys.includes(key)) {
        warnings.push({
          path: `defaultResponses.${key}`,
          message: `Unknown default response type: ${key}`,
          code: 'UNKNOWN_RESPONSE_TYPE',
          value: key,
        });
      }

      if (value && !Array.isArray(value)) {
        errors.push({
          path: `defaultResponses.${key}`,
          message: `Default response "${key}" must be an array`,
          code: 'INVALID_TYPE',
          value,
        });
      }
    }
  }
}

/**
 * Singleton instance of the validator
 */
export const whatsappAgentValidator = new WhatsAppAgentValidator();
