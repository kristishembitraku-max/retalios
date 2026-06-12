// ============================================================
// Fluence AI — Core TypeScript Types
// ============================================================

// ─── Enums / Union Types ──────────────────────────────────────────────────────

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';
export type PlanTier = 'free' | 'starter' | 'growth' | 'enterprise';
export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete';
export type MessageRole = 'user' | 'assistant' | 'system';
export type MemoryType =
  | 'fact'
  | 'preference'
  | 'objection'
  | 'interest'
  | 'context'
  | 'summary';
export type BuyingStage =
  | 'awareness'
  | 'interest'
  | 'consideration'
  | 'intent'
  | 'evaluation'
  | 'purchase';
export type SentimentLabel = 'positive' | 'neutral' | 'negative';
export type CustomerIntent =
  | 'browsing'
  | 'interested'
  | 'evaluating'
  | 'ready_to_buy'
  | 'objecting'
  | 'churned';
export type KnowledgeSourceType = 'manual' | 'file' | 'url' | 'faq' | 'pdf' | 'product';
export type AnalyticsEventType =
  | 'conversation_started'
  | 'message_sent'
  | 'message_received'
  | 'lead_captured'
  | 'handoff_requested'
  | 'conversation_ended'
  | 'conversion'
  | 'objection_raised'
  | 'product_interest';
export type SalesStyle =
  | 'consultative'
  | 'assertive'
  | 'educational'
  | 'empathetic'
  | 'direct';
export type BotTone =
  | 'professional'
  | 'friendly'
  | 'formal'
  | 'casual'
  | 'enthusiastic';
export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'unqualified'
  | 'converted'
  | 'lost';
export type CustomerSentiment =
  | 'very_positive'
  | 'positive'
  | 'neutral'
  | 'negative'
  | 'very_negative';

// ─── Organization ─────────────────────────────────────────────────────────────

export interface OrganizationSettings {
  branding?: {
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
    font?: string;
  };
  notifications?: {
    email_leads?: boolean;
    email_digest?: boolean;
    slack_webhook?: string;
  };
  limits?: {
    max_bots?: number;
    max_conversations_per_month?: number;
    max_knowledge_base_size_mb?: number;
  };
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: PlanTier;
  settings: OrganizationSettings;
  created_at: string;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  org_id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  // Joined relations
  organization?: Organization;
}

// ─── Bot Configuration ────────────────────────────────────────────────────────

export interface BotPersonality {
  name: string;
  description: string;
  backstory?: string;
}

export interface BotConfig {
  personality: BotPersonality;
  goals: string[];
  tone: BotTone;
  languages: string[];
  sales_style: SalesStyle;
  system_prompt?: string;
  greeting_message?: string;
  fallback_message?: string;
  handoff_threshold?: number;
  max_conversation_turns?: number;
  collect_email?: boolean;
  collect_phone?: boolean;
  disallowed_topics?: string[];
  custom_instructions?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  enable_memory?: boolean;
  enable_rag?: boolean;
  enable_analytics?: boolean;
}

export interface Bot {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  config: BotConfig;
  is_active: boolean;
  embed_token: string;
  created_at: string;
  updated_at?: string;
  // Computed / joined
  _conversation_count?: number;
  _message_count?: number;
  _lead_count?: number;
}

// ─── Conversation ─────────────────────────────────────────────────────────────

export interface ConversationMetadata {
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  page_url?: string;
  country?: string;
  city?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  tags?: string[];
}

export interface Conversation {
  id: string;
  bot_id: string;
  session_id: string;
  customer_email: string | null;
  customer_name: string | null;
  metadata: ConversationMetadata;
  started_at: string;
  last_message_at: string;
  // Joined relations
  bot?: Pick<Bot, 'id' | 'name'>;
  messages?: Message[];
  customer_state?: CustomerState;
}

// ─── Message ──────────────────────────────────────────────────────────────────

export interface MessageMetadata {
  tokens_used?: number;
  model?: string;
  latency_ms?: number;
  detected_intent?: CustomerIntent;
  detected_language?: string;
  confidence?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  language: string | null;
  metadata: MessageMetadata;
  created_at: string;
}

// ─── Memory ───────────────────────────────────────────────────────────────────

export interface Memory {
  id: string;
  bot_id: string;
  session_id: string;
  customer_email: string | null;
  type: MemoryType;
  key: string;
  value: string;
  embedding: number[] | null;
  created_at: string;
  updated_at: string;
}

// ─── Customer State ───────────────────────────────────────────────────────────

export interface CustomerState {
  id: string;
  bot_id: string;
  session_id: string;
  customer_email: string | null;
  intent: CustomerIntent | null;
  sentiment: SentimentLabel | null;
  buying_stage: BuyingStage | null;
  conversion_probability: number;
  last_language: string | null;
  objections: string[];
  interests: string[];
  updated_at: string;
}

// ─── Knowledge Base ───────────────────────────────────────────────────────────

export interface KnowledgeBaseMetadata {
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  page_count?: number;
  chunk_index?: number;
  total_chunks?: number;
  source_url?: string;
}

export interface KnowledgeBase {
  id: string;
  bot_id: string;
  title: string;
  content: string;
  source_type: KnowledgeSourceType;
  file_url: string | null;
  embedding: number[] | null;
  metadata: KnowledgeBaseMetadata;
  created_at: string;
  updated_at?: string;
}

// ─── Analytics Logs ──────────────────────────────────────────────────────────

export interface AnalyticsLog {
  id: string;
  bot_id: string;
  conversation_id: string | null;
  event_type: AnalyticsEventType;
  data: Record<string, unknown>;
  created_at: string;
}

export interface AnalyticsSummary {
  total_conversations: number;
  total_messages: number;
  total_leads: number;
  avg_conversion_probability: number;
  avg_messages_per_conversation: number;
  top_languages: Array<{ language: string; count: number }>;
  sentiment_breakdown: Record<SentimentLabel, number>;
  buying_stage_breakdown: Record<BuyingStage, number>;
  conversations_by_day: Array<{ date: string; count: number }>;
}

// ─── Subscription ─────────────────────────────────────────────────────────────

export interface Subscription {
  id: string;
  org_id: string;
  plan: PlanTier;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  stripe_subscription_id: string | null;
  created_at: string;
}

// ─── Usage Tracking ───────────────────────────────────────────────────────────

export interface UsageTracking {
  id: string;
  org_id: string;
  bot_id: string | null;
  date: string;
  conversations: number;
  messages: number;
  tokens_used: number;
}

export interface UsageSummary {
  conversations_this_month: number;
  messages_this_month: number;
  tokens_this_month: number;
  conversations_limit: number;
  messages_limit: number;
  tokens_limit: number;
}

// ─── Lead ─────────────────────────────────────────────────────────────────────

export interface Lead {
  id: string;
  org_id: string;
  bot_id: string;
  conversation_id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  status: LeadStatus;
  buying_stage: BuyingStage | null;
  conversion_probability: number;
  interests: string[];
  objections: string[];
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined relations
  bot?: Pick<Bot, 'id' | 'name'>;
  conversation?: Pick<Conversation, 'id' | 'started_at'>;
}

// ─── Chat API ─────────────────────────────────────────────────────────────────

export interface ChatRequest {
  bot_token: string;
  session_id: string;
  message: string;
  customer_email?: string;
  customer_name?: string;
  metadata?: ConversationMetadata;
  stream?: boolean;
}

export interface ChatResponse {
  message: string;
  conversation_id: string;
  session_id: string;
  language: string;
  sentiment?: SentimentLabel;
  buying_stage?: BuyingStage;
  conversion_probability?: number;
  suggested_actions?: string[];
  handoff_requested?: boolean;
  metadata?: MessageMetadata;
}

// ─── AI / LLM shapes ──────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  content: string;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  finish_reason: 'stop' | 'length' | 'content_filter' | 'tool_calls' | null;
}

export interface EmbeddingResponse {
  embedding: number[];
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

// ─── Sales Engine ─────────────────────────────────────────────────────────────

export interface SalesEngineInput {
  userMessage: string;
  conversationHistory: ChatMessage[];
  language: string;
  customerState?: CustomerState;
  knowledgeContext?: string;
}

export interface SalesInsights {
  detectedIntent: CustomerIntent;
  detectedSentiment: CustomerSentiment;
  detectedBuyingStage: BuyingStage;
  conversionProbability: number;
  newObjections: string[];
  newInterests: string[];
  suggestedFollowUp?: string;
  handoffRecommended: boolean;
  handoffReason?: string;
}

export interface SalesEngineOutput {
  response: string;
  updatedState: Partial<CustomerState>;
  insights: SalesInsights;
  tokensUsed: number;
}

// ─── RAG ──────────────────────────────────────────────────────────────────────

export interface IngestDocumentOptions {
  botId: string;
  title: string;
  content: string;
  sourceType: KnowledgeSourceType;
  fileUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface RAGSearchResult {
  chunks: KnowledgeBase[];
  queryEmbedding: number[];
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  bots: {
    total: number;
    active: number;
  };
  conversations: {
    total: number;
    today: number;
    this_week: number;
    this_month: number;
  };
  messages: {
    total: number;
    this_month: number;
  };
  leads: {
    total: number;
    this_month: number;
    qualified: number;
    converted: number;
  };
  usage: UsageSummary;
}

export interface DashboardMetrics {
  totalConversations: number;
  totalMessages: number;
  totalLeads: number;
  avgSentimentScore: number;
  conversionRate: number;
  topLanguages: Array<{ language: string; count: number }>;
  intentDistribution: Partial<Record<CustomerIntent, number>>;
  dailyConversations: Array<{ date: string; count: number }>;
  commonObjections: Array<{ objection: string; count: number }>;
  avgConversionProbability: number;
  handoffRate: number;
}

export interface DateRange {
  start: string;
  end: string;
}

// ─── API Pagination ───────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, string[]>;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ─── Form Types ───────────────────────────────────────────────────────────────

export interface CreateBotFormData {
  name: string;
  description?: string;
  config: Partial<BotConfig>;
}

export interface UpdateBotFormData {
  name?: string;
  description?: string;
  config?: Partial<BotConfig>;
  is_active?: boolean;
}

export interface CreateKnowledgeBaseFormData {
  title: string;
  content: string;
  source_type: KnowledgeSourceType;
  file?: File;
  source_url?: string;
}

// ─── Embed Widget ─────────────────────────────────────────────────────────────

export interface EmbedConfig {
  bot_token: string;
  position?: 'bottom-right' | 'bottom-left';
  primary_color?: string;
  bot_name?: string;
  bot_avatar?: string;
  greeting?: string;
  placeholder?: string;
  open_on_load?: boolean;
  collect_email?: boolean;
  theme?: 'light' | 'dark' | 'auto';
}
