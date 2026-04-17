/**
 * WhatsApp Agent Types
 * Semantic type definitions for WhatsApp-specific agent configuration
 */

import { AgentId, UUID, Timestamp, TaskPriority } from '../../types';

/** WhatsApp message types */
export type WhatsAppMessageType = 
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'sticker'
  | 'location'
  | 'contact'
  | 'button'
  | 'list'
  | 'template';

/** WhatsApp message status */
export type WhatsAppMessageStatus = 
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';

/** Response action types */
export type ResponseActionType = 
  | 'reply_text'
  | 'reply_media'
  | 'send_template'
  | 'send_buttons'
  | 'send_list'
  | 'call_function'
  | 'forward_message'
  | 'mark_read'
  | 'typing_indicator'
  | 'presence_update';

/** Condition operators for rule matching */
export type ConditionOperator = 
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'starts_with'
  | 'ends_with'
  | 'regex'
  | 'greater_than'
  | 'less_than'
  | 'in'
  | 'not_in'
  | 'exists'
  | 'not_exists';

/** Logical operators for combining conditions */
export type LogicalOperator = 'AND' | 'OR' | 'NOT';

/** Function parameter definition */
export interface IFunctionParameter {
  readonly name: string;
  readonly type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  readonly required?: boolean;
  readonly description?: string;
  readonly defaultValue?: unknown;
  readonly validation?: string; // Regex pattern or validation function name
}

/** External function definition */
export interface IFunctionDefinition {
  readonly name: string;
  readonly description: string;
  readonly parameters: IFunctionParameter[];
  readonly handler: string; // Module path or inline function
  readonly timeout?: number;
  readonly retryCount?: number;
  readonly cacheResult?: boolean;
  readonly cacheTTL?: number;
}

/** Single condition for rule matching */
export interface ICondition {
  readonly field: string;
  readonly operator: ConditionOperator;
  readonly value?: unknown;
  readonly values?: unknown[]; // For 'in' and 'not_in' operators
  readonly pattern?: string; // For regex operator
  readonly caseSensitive?: boolean;
}

/** Compound condition with logical operators */
export interface ICompoundCondition {
  readonly logicalOperator: LogicalOperator;
  readonly conditions: (ICondition | ICompoundCondition)[];
}

/** Union type for all condition types */
export type IAnyCondition = ICondition | ICompoundCondition;

/** Response template for text messages */
export interface ITextResponse {
  readonly type: 'text';
  readonly content: string;
  readonly variables?: Record<string, string>;
  readonly parseMarkdown?: boolean;
  readonly disablePreview?: boolean;
}

/** Response for media messages */
export interface IMediaResponse {
  readonly type: 'image' | 'video' | 'audio' | 'document';
  readonly url: string;
  readonly caption?: string;
  readonly filename?: string;
  readonly mimeType?: string;
}

/** Button for interactive messages */
export interface IButton {
  readonly id: string;
  readonly title: string;
  readonly type: 'reply' | 'url' | 'phone_number';
  readonly url?: string;
  readonly phoneNumber?: string;
}

/** Response with buttons */
export interface IButtonsResponse {
  readonly type: 'buttons';
  readonly body: string;
  readonly footer?: string;
  readonly buttons: IButton[];
}

/** List item for list messages */
export interface IListSection {
  readonly title: string;
  readonly rows: {
    readonly id: string;
    readonly title: string;
    readonly description?: string;
  }[];
}

/** Response with list */
export interface IListResponse {
  readonly type: 'list';
  readonly header?: string;
  readonly body: string;
  readonly footer?: string;
  readonly buttonTitle: string;
  readonly sections: IListSection[];
}

/** Template response (WhatsApp Business API) */
export interface ITemplateResponse {
  readonly type: 'template';
  readonly name: string;
  readonly language: string;
  readonly components?: Array<{
    readonly type: 'header' | 'body' | 'button';
    readonly parameters?: Array<{
      readonly type: 'text' | 'media' | 'currency' | 'date_time';
      readonly text?: string;
      readonly media?: { url: string };
    }>;
  }>;
}

/** Function call response */
export interface IFunctionCallResponse {
  readonly type: 'call_function';
  readonly functionName: string;
  readonly arguments: Record<string, unknown>;
  readonly storeResult?: boolean;
  readonly resultVariable?: string;
}

/** Typing indicator response */
export interface ITypingResponse {
  readonly type: 'typing_indicator';
  readonly duration?: number; // in milliseconds
}

/** Presence update response */
export interface IPresenceResponse {
  readonly type: 'presence_update';
  readonly presence: 'available' | 'unavailable' | 'composing' | 'recording' | 'paused';
}

/** Union type for all response types */
export type IAnyResponse = 
  | ITextResponse
  | IMediaResponse
  | IButtonsResponse
  | IListResponse
  | ITemplateResponse
  | IFunctionCallResponse
  | ITypingResponse
  | IPresenceResponse;

/** Action to execute when rule matches */
export interface IAction {
  readonly type: ResponseActionType;
  readonly response?: IAnyResponse;
  readonly responses?: IAnyResponse[]; // For multiple sequential responses
  readonly delay?: number; // Delay before executing this action (ms)
  readonly condition?: IAnyCondition; // Additional condition for this action
}

/** Rule definition for message handling */
export interface IRule {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly priority: number; // Higher number = higher priority
  readonly enabled: boolean;
  readonly condition: IAnyCondition;
  readonly actions: IAction[];
  readonly metadata?: Record<string, unknown>;
}

/** Conversation state definition */
export interface IConversationState {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly entryCondition?: IAnyCondition;
  readonly exitCondition?: IAnyCondition;
  readonly defaultActions?: IAction[];
  readonly timeout?: number; // State timeout in milliseconds
  readonly onTimeout?: IAction[];
}

/** Conversation flow definition */
export interface IConversationFlow {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly initialState: string;
  readonly states: IConversationState[];
  readonly transitions: {
    readonly fromState: string;
    readonly toState: string;
    readonly condition: IAnyCondition;
    readonly actions?: IAction[];
  }[];
}

/** Session configuration */
export interface ISessionConfig {
  readonly enabled: boolean;
  readonly ttl: number; // Session TTL in seconds
  readonly storage: 'memory' | 'redis' | 'database';
  readonly keyPrefix: string;
}

/** Rate limiting configuration */
export interface IRateLimitConfig {
  readonly enabled: boolean;
  readonly windowMs: number; // Time window in milliseconds
  readonly maxMessages: number; // Max messages per window
  readonly blockDuration?: number; // How long to block after limit exceeded
  readonly bySender?: boolean; // Apply rate limit per sender
}

/** WhatsApp provider configuration */
export type WhatsAppProvider = 'twilio' | 'whatsapp-business-api' | 'wenovate' | '360dialog' | 'meta-cloud-api';

/** WhatsApp connection configuration */
export interface IWhatsAppConnectionConfig {
  readonly provider: WhatsAppProvider;
  readonly apiKey?: string;
  readonly apiSecret?: string;
  readonly phoneNumberId?: string;
  readonly businessAccountId?: string;
  readonly webhookUrl?: string;
  readonly webhookVerifyToken?: string;
  readonly baseUrl?: string;
  readonly version?: string;
}

/** AI/LLM configuration for intelligent responses */
export interface IAIConfig {
  readonly enabled: boolean;
  readonly provider: 'openai' | 'anthropic' | 'google' | 'azure' | 'local';
  readonly model?: string;
  readonly apiKey?: string;
  readonly baseUrl?: string;
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly systemPrompt?: string;
  readonly contextWindow?: number; // Number of previous messages to include
  readonly fallbackToRules?: boolean; // Use rules if AI fails
}

/** Analytics configuration */
export interface IAnalyticsConfig {
  readonly enabled: boolean;
  readonly trackMessages: boolean;
  readonly trackConversations: boolean;
  readonly trackUserBehavior: boolean;
  readonly customEvents?: string[];
  readonly retentionDays?: number;
}

/** Complete WhatsApp Agent Configuration */
export interface IWhatsAppAgentConfig {
  readonly agentId: AgentId;
  readonly name: string;
  readonly description?: string;
  readonly version: string;
  readonly enabled: boolean;
  
  // Connection settings
  readonly whatsapp: IWhatsAppConnectionConfig;
  
  // Session management
  readonly session: ISessionConfig;
  
  // Rate limiting
  readonly rateLimit: IRateLimitConfig;
  
  // Rules and flows
  readonly rules: IRule[];
  readonly flows: IConversationFlow[];
  
  // Functions that can be called
  readonly functions: IFunctionDefinition[];
  
  // AI configuration
  readonly ai?: IAIConfig;
  
  // Analytics
  readonly analytics?: IAnalyticsConfig;
  
  // Default responses
  readonly defaultResponses?: {
    readonly unmatched?: IAnyResponse[];
    readonly error?: IAnyResponse[];
    readonly rateLimited?: IAnyResponse[];
    readonly sessionExpired?: IAnyResponse[];
  };
  
  // Metadata
  readonly metadata?: Record<string, unknown>;
}

/** Incoming WhatsApp message structure */
export interface IWhatsAppMessage {
  readonly messageId: UUID;
  readonly from: string;
  readonly to: string;
  readonly type: WhatsAppMessageType;
  readonly timestamp: Timestamp;
  readonly text?: { body: string };
  readonly image?: { url: string; caption?: string; mimeType?: string };
  readonly video?: { url: string; caption?: string; mimeType?: string };
  readonly audio?: { url: string; mimeType?: string };
  readonly document?: { url: string; filename?: string; mimeType?: string };
  readonly sticker?: { url: string; mimeType?: string };
  readonly location?: { latitude: number; longitude: number; address?: string; name?: string };
  readonly contact?: { name: string; phones?: string[]; emails?: string[] };
  readonly button?: { text: string; payload: string };
  readonly listReply?: { id: string; title: string; description?: string };
  readonly context?: {
    readonly from?: string;
    readonly id?: UUID;
    readonly forwarded?: boolean;
    readonly referredProduct?: { id: string; catalogId: string };
  };
  readonly metadata?: Record<string, unknown>;
}

/** Outgoing WhatsApp message structure */
export interface IOutgoingWhatsAppMessage {
  readonly to: string;
  readonly type: WhatsAppMessageType;
  readonly content: IAnyResponse;
  readonly correlationId?: UUID;
  readonly replyTo?: UUID;
  readonly priority?: TaskPriority;
  readonly scheduledAt?: Timestamp;
  readonly metadata?: Record<string, unknown>;
}

/** Message processing result */
export interface IMessageProcessingResult {
  readonly success: boolean;
  readonly matchedRule?: IRule;
  readonly executedActions: IAction[];
  readonly nextState?: string;
  readonly conversationId?: string;
  readonly sessionId?: string;
  readonly aiResponse?: string;
  readonly functionResults?: Record<string, unknown>;
  readonly error?: string;
  readonly duration: number;
  readonly timestamp: Timestamp;
}

/** Conversation context */
export interface IConversationContext {
  readonly conversationId: string;
  readonly sessionId: string;
  readonly userId: string;
  readonly currentState?: string;
  readonly variables: Record<string, unknown>;
  readonly messageHistory: IWhatsAppMessage[];
  readonly lastActivity: Timestamp;
  readonly createdAt: Timestamp;
  readonly metadata?: Record<string, unknown>;
}

/** Event types for WhatsApp agent */
export type WhatsAppAgentEventType =
  | 'MESSAGE_RECEIVED'
  | 'MESSAGE_SENT'
  | 'MESSAGE_DELIVERED'
  | 'MESSAGE_READ'
  | 'MESSAGE_FAILED'
  | 'CONVERSATION_STARTED'
  | 'CONVERSATION_ENDED'
  | 'STATE_CHANGED'
  | 'ACTION_EXECUTED'
  | 'FUNCTION_CALLED'
  | 'ERROR_OCCURRED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SESSION_CREATED'
  | 'SESSION_EXPIRED';

/** WhatsApp agent event */
export interface IWhatsAppAgentEvent<TData = unknown> {
  readonly eventId: UUID;
  readonly eventType: WhatsAppAgentEventType;
  readonly agentId: AgentId;
  readonly conversationId?: string;
  readonly sessionId?: string;
  readonly messageId?: UUID;
  readonly timestamp: Timestamp;
  readonly data: TData;
  readonly metadata?: Record<string, unknown>;
}
