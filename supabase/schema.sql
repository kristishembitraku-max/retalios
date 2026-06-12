-- ============================================================
-- Fluence AI — Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor or via CLI migrations.
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────

-- Enable pgvector for AI embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable pg_uuid-ossp for uuid generation fallback
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_stat_statements for performance monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- ─── Helper Functions ─────────────────────────────────────────────────────────

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── Organizations ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  plan        TEXT NOT NULL DEFAULT 'free'
                CHECK (plan IN ('free', 'starter', 'growth', 'enterprise')),
  settings    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS organizations_slug_idx ON organizations (slug);
CREATE INDEX IF NOT EXISTS organizations_plan_idx ON organizations (plan);

-- ─── Users ────────────────────────────────────────────────────────────────────
-- Mirrors auth.users — extended profile data lives here.

CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  name        TEXT NOT NULL DEFAULT '',
  role        TEXT NOT NULL DEFAULT 'member'
                CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS users_org_id_idx ON users (org_id);
CREATE INDEX IF NOT EXISTS users_email_idx  ON users (email);

-- ─── Bots ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  config      JSONB NOT NULL DEFAULT '{}',
              -- config shape: {
              --   personality: { name, description, backstory? }
              --   goals: string[]
              --   tone: 'professional' | 'friendly' | 'formal' | 'casual' | 'enthusiastic'
              --   languages: string[]
              --   sales_style: 'consultative' | 'assertive' | 'educational' | 'empathetic' | 'direct'
              --   system_prompt?: string
              --   greeting_message?: string
              --   fallback_message?: string
              --   model?: string
              --   temperature?: number
              --   max_tokens?: number
              -- }
  is_active   BOOLEAN NOT NULL DEFAULT true,
  embed_token TEXT NOT NULL UNIQUE DEFAULT ('bot_' || replace(gen_random_uuid()::text, '-', '')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE bots ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS bots_org_id_idx      ON bots (org_id);
CREATE INDEX IF NOT EXISTS bots_embed_token_idx ON bots (embed_token);
CREATE INDEX IF NOT EXISTS bots_is_active_idx   ON bots (is_active);

-- Auto-update updated_at
CREATE TRIGGER bots_updated_at
  BEFORE UPDATE ON bots
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- ─── Conversations ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS conversations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id           UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  session_id       TEXT NOT NULL,
  customer_email   TEXT,
  customer_name    TEXT,
  metadata         JSONB NOT NULL DEFAULT '{}',
                   -- metadata shape: {
                   --   ip_address?, user_agent?, referrer?, page_url?,
                   --   country?, city?, utm_source?, utm_medium?, utm_campaign?,
                   --   tags?: string[]
                   -- }
  started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS conversations_bot_id_idx         ON conversations (bot_id);
CREATE INDEX IF NOT EXISTS conversations_session_id_idx     ON conversations (session_id);
CREATE INDEX IF NOT EXISTS conversations_customer_email_idx ON conversations (customer_email);
CREATE INDEX IF NOT EXISTS conversations_started_at_idx     ON conversations (started_at DESC);
CREATE INDEX IF NOT EXISTS conversations_last_message_idx   ON conversations (last_message_at DESC);

-- Compound index for bot + session lookups (common in chat flows)
CREATE UNIQUE INDEX IF NOT EXISTS conversations_bot_session_idx
  ON conversations (bot_id, session_id);

-- ─── Messages ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role             TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content          TEXT NOT NULL,
  language         TEXT,
  metadata         JSONB NOT NULL DEFAULT '{}',
                   -- metadata shape: {
                   --   tokens_used?, model?, latency_ms?,
                   --   detected_intent?, detected_language?, confidence?
                   -- }
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages (conversation_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx      ON messages (created_at DESC);
CREATE INDEX IF NOT EXISTS messages_role_idx            ON messages (role);

-- ─── Memory ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS memory (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id          UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  session_id      TEXT NOT NULL,
  customer_email  TEXT,
  type            TEXT NOT NULL
                    CHECK (type IN ('fact', 'preference', 'objection', 'interest', 'context', 'summary')),
  key             TEXT NOT NULL,
  value           TEXT NOT NULL,
  embedding       vector(1536),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE memory ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS memory_bot_id_idx         ON memory (bot_id);
CREATE INDEX IF NOT EXISTS memory_session_id_idx     ON memory (session_id);
CREATE INDEX IF NOT EXISTS memory_customer_email_idx ON memory (customer_email);
CREATE INDEX IF NOT EXISTS memory_type_idx           ON memory (type);
CREATE INDEX IF NOT EXISTS memory_bot_session_idx    ON memory (bot_id, session_id);

-- Vector similarity index (HNSW for fast approximate search)
CREATE INDEX IF NOT EXISTS memory_embedding_idx
  ON memory USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Auto-update updated_at
CREATE TRIGGER memory_updated_at
  BEFORE UPDATE ON memory
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- ─── Customer State ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS customer_state (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id                  UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  session_id              TEXT NOT NULL,
  customer_email          TEXT,
  intent                  TEXT,
  sentiment               TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  buying_stage            TEXT CHECK (buying_stage IN (
                            'awareness', 'interest', 'consideration',
                            'intent', 'evaluation', 'purchase'
                          )),
  conversion_probability  NUMERIC(5, 2) NOT NULL DEFAULT 0
                            CHECK (conversion_probability BETWEEN 0 AND 100),
  last_language           TEXT,
  objections              JSONB NOT NULL DEFAULT '[]',
  interests               JSONB NOT NULL DEFAULT '[]',
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE customer_state ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS customer_state_bot_session_idx
  ON customer_state (bot_id, session_id);
CREATE INDEX IF NOT EXISTS customer_state_bot_id_idx         ON customer_state (bot_id);
CREATE INDEX IF NOT EXISTS customer_state_customer_email_idx ON customer_state (customer_email);
CREATE INDEX IF NOT EXISTS customer_state_buying_stage_idx   ON customer_state (buying_stage);

-- Auto-update updated_at
CREATE TRIGGER customer_state_updated_at
  BEFORE UPDATE ON customer_state
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- ─── Knowledge Base ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS knowledge_base (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id       UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  content      TEXT NOT NULL,
  source_type  TEXT NOT NULL
                 CHECK (source_type IN ('manual', 'file', 'url', 'faq', 'pdf', 'product')),
  file_url     TEXT,
  embedding    vector(1536),
  metadata     JSONB NOT NULL DEFAULT '{}',
               -- metadata shape: {
               --   file_name?, file_size?, mime_type?, page_count?,
               --   chunk_index?, total_chunks?, source_url?
               -- }
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS knowledge_base_bot_id_idx      ON knowledge_base (bot_id);
CREATE INDEX IF NOT EXISTS knowledge_base_source_type_idx ON knowledge_base (source_type);

-- Vector similarity index (HNSW)
CREATE INDEX IF NOT EXISTS knowledge_base_embedding_idx
  ON knowledge_base USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Full-text search on title + content
CREATE INDEX IF NOT EXISTS knowledge_base_fts_idx
  ON knowledge_base USING gin (to_tsvector('english', title || ' ' || content));

-- Auto-update updated_at
CREATE TRIGGER knowledge_base_updated_at
  BEFORE UPDATE ON knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- ─── Analytics Logs ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS analytics_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id           UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  conversation_id  UUID REFERENCES conversations(id) ON DELETE SET NULL,
  event_type       TEXT NOT NULL,
  data             JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE analytics_logs ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS analytics_logs_bot_id_idx          ON analytics_logs (bot_id);
CREATE INDEX IF NOT EXISTS analytics_logs_conversation_id_idx ON analytics_logs (conversation_id);
CREATE INDEX IF NOT EXISTS analytics_logs_event_type_idx      ON analytics_logs (event_type);
CREATE INDEX IF NOT EXISTS analytics_logs_created_at_idx      ON analytics_logs (created_at DESC);

-- Compound index for time-range queries per bot
CREATE INDEX IF NOT EXISTS analytics_logs_bot_time_idx
  ON analytics_logs (bot_id, created_at DESC);

-- ─── Subscriptions ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subscriptions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                 UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan                   TEXT NOT NULL
                           CHECK (plan IN ('free', 'starter', 'growth', 'enterprise')),
  status                 TEXT NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete')),
  current_period_start   TIMESTAMPTZ NOT NULL,
  current_period_end     TIMESTAMPTZ NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_org_id_idx          ON subscriptions (org_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx                 ON subscriptions (status);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_sub_id_idx
  ON subscriptions (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- ─── Usage Tracking ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS usage_tracking (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  bot_id         UUID REFERENCES bots(id) ON DELETE SET NULL,
  date           DATE NOT NULL,
  conversations  INTEGER NOT NULL DEFAULT 0 CHECK (conversations >= 0),
  messages       INTEGER NOT NULL DEFAULT 0 CHECK (messages >= 0),
  tokens_used    INTEGER NOT NULL DEFAULT 0 CHECK (tokens_used >= 0)
);

-- RLS
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS usage_tracking_org_bot_date_idx
  ON usage_tracking (org_id, bot_id, date);
CREATE INDEX IF NOT EXISTS usage_tracking_org_id_idx   ON usage_tracking (org_id);
CREATE INDEX IF NOT EXISTS usage_tracking_bot_id_idx   ON usage_tracking (bot_id);
CREATE INDEX IF NOT EXISTS usage_tracking_date_idx     ON usage_tracking (date DESC);

-- ─── RLS Policies ─────────────────────────────────────────────────────────────

-- Helper: get the authenticated user's org_id
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check if current user has a specific role
CREATE OR REPLACE FUNCTION user_has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND role = required_role
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check if current user is admin or owner
CREATE OR REPLACE FUNCTION user_is_admin_or_owner()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- organizations: members can read their own org; owners can update
CREATE POLICY "org_members_can_read" ON organizations
  FOR SELECT USING (id = get_user_org_id());

CREATE POLICY "org_owners_can_update" ON organizations
  FOR UPDATE USING (id = get_user_org_id() AND user_is_admin_or_owner());

-- users: members can read their own org's users; admins can manage
CREATE POLICY "users_can_read_same_org" ON users
  FOR SELECT USING (org_id = get_user_org_id());

CREATE POLICY "users_can_update_own_profile" ON users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "admins_can_manage_users" ON users
  FOR ALL USING (org_id = get_user_org_id() AND user_is_admin_or_owner());

-- bots: org members can read; admins can write
CREATE POLICY "bots_org_members_read" ON bots
  FOR SELECT USING (org_id = get_user_org_id());

CREATE POLICY "bots_admins_write" ON bots
  FOR ALL USING (org_id = get_user_org_id() AND user_is_admin_or_owner());

-- bots: public can read via embed_token (for chat widget)
CREATE POLICY "bots_public_read_by_embed_token" ON bots
  FOR SELECT USING (is_active = true);

-- conversations: org members can read their bot's conversations
CREATE POLICY "conversations_org_members_read" ON conversations
  FOR SELECT USING (
    bot_id IN (SELECT id FROM bots WHERE org_id = get_user_org_id())
  );

-- conversations: anyone can insert (public chat widget)
CREATE POLICY "conversations_public_insert" ON conversations
  FOR INSERT WITH CHECK (true);

-- conversations: allow updates from same session (system)
CREATE POLICY "conversations_service_update" ON conversations
  FOR UPDATE USING (true);

-- messages: org members can read
CREATE POLICY "messages_org_members_read" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT c.id FROM conversations c
      JOIN bots b ON b.id = c.bot_id
      WHERE b.org_id = get_user_org_id()
    )
  );

-- messages: public can insert (chat widget)
CREATE POLICY "messages_public_insert" ON messages
  FOR INSERT WITH CHECK (true);

-- memory: org members can read their bot's memory
CREATE POLICY "memory_org_members_read" ON memory
  FOR SELECT USING (
    bot_id IN (SELECT id FROM bots WHERE org_id = get_user_org_id())
  );

-- memory: service role manages memory (via API routes)
CREATE POLICY "memory_service_all" ON memory
  FOR ALL USING (true);

-- customer_state: org members read
CREATE POLICY "customer_state_org_members_read" ON customer_state
  FOR SELECT USING (
    bot_id IN (SELECT id FROM bots WHERE org_id = get_user_org_id())
  );

-- customer_state: upserted by service layer
CREATE POLICY "customer_state_service_all" ON customer_state
  FOR ALL USING (true);

-- knowledge_base: org members read/write
CREATE POLICY "kb_org_members_read" ON knowledge_base
  FOR SELECT USING (
    bot_id IN (SELECT id FROM bots WHERE org_id = get_user_org_id())
  );

CREATE POLICY "kb_admins_write" ON knowledge_base
  FOR ALL USING (
    bot_id IN (SELECT id FROM bots WHERE org_id = get_user_org_id())
    AND user_is_admin_or_owner()
  );

-- kb: chat API can read (for RAG)
CREATE POLICY "kb_public_read_for_rag" ON knowledge_base
  FOR SELECT USING (true);

-- analytics_logs: org members read
CREATE POLICY "analytics_org_members_read" ON analytics_logs
  FOR SELECT USING (
    bot_id IN (SELECT id FROM bots WHERE org_id = get_user_org_id())
  );

-- analytics_logs: service inserts
CREATE POLICY "analytics_service_insert" ON analytics_logs
  FOR INSERT WITH CHECK (true);

-- subscriptions: org members read their own
CREATE POLICY "subscriptions_org_members_read" ON subscriptions
  FOR SELECT USING (org_id = get_user_org_id());

-- usage_tracking: org members read
CREATE POLICY "usage_org_members_read" ON usage_tracking
  FOR SELECT USING (org_id = get_user_org_id());

-- usage_tracking: service upserts
CREATE POLICY "usage_service_upsert" ON usage_tracking
  FOR ALL USING (true);

-- ─── Vector Search Functions ──────────────────────────────────────────────────

-- Search knowledge base by vector similarity
CREATE OR REPLACE FUNCTION match_knowledge_base(
  query_embedding  vector(1536),
  bot_id           UUID,
  match_threshold  FLOAT DEFAULT 0.7,
  match_count      INT   DEFAULT 5
)
RETURNS TABLE (
  id           UUID,
  bot_id       UUID,
  title        TEXT,
  content      TEXT,
  source_type  TEXT,
  metadata     JSONB,
  similarity   FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.bot_id,
    kb.title,
    kb.content,
    kb.source_type,
    kb.metadata,
    1 - (kb.embedding <=> query_embedding) AS similarity
  FROM knowledge_base kb
  WHERE
    kb.bot_id = match_knowledge_base.bot_id
    AND kb.embedding IS NOT NULL
    AND 1 - (kb.embedding <=> query_embedding) > match_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Search memory by vector similarity
CREATE OR REPLACE FUNCTION match_memory(
  query_embedding  vector(1536),
  bot_id           UUID,
  session_id       TEXT  DEFAULT NULL,
  match_threshold  FLOAT DEFAULT 0.75,
  match_count      INT   DEFAULT 5
)
RETURNS TABLE (
  id          UUID,
  bot_id      UUID,
  session_id  TEXT,
  type        TEXT,
  key         TEXT,
  value       TEXT,
  similarity  FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.bot_id,
    m.session_id,
    m.type,
    m.key,
    m.value,
    1 - (m.embedding <=> query_embedding) AS similarity
  FROM memory m
  WHERE
    m.bot_id = match_memory.bot_id
    AND (match_memory.session_id IS NULL OR m.session_id = match_memory.session_id)
    AND m.embedding IS NOT NULL
    AND 1 - (m.embedding <=> query_embedding) > match_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ─── Utility Functions ────────────────────────────────────────────────────────

-- Upsert usage tracking (increment counters atomically)
CREATE OR REPLACE FUNCTION upsert_usage(
  p_org_id        UUID,
  p_bot_id        UUID,
  p_date          DATE,
  p_conversations INT DEFAULT 0,
  p_messages      INT DEFAULT 0,
  p_tokens_used   INT DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO usage_tracking (org_id, bot_id, date, conversations, messages, tokens_used)
  VALUES (p_org_id, p_bot_id, p_date, p_conversations, p_messages, p_tokens_used)
  ON CONFLICT (org_id, bot_id, date)
  DO UPDATE SET
    conversations = usage_tracking.conversations + EXCLUDED.conversations,
    messages      = usage_tracking.messages      + EXCLUDED.messages,
    tokens_used   = usage_tracking.tokens_used   + EXCLUDED.tokens_used;
END;
$$;

-- Get monthly usage for an org
CREATE OR REPLACE FUNCTION get_monthly_usage(
  p_org_id UUID,
  p_year   INT DEFAULT EXTRACT(YEAR FROM NOW())::INT,
  p_month  INT DEFAULT EXTRACT(MONTH FROM NOW())::INT
)
RETURNS TABLE (
  conversations INT,
  messages      INT,
  tokens_used   INT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(ut.conversations)::INT, 0),
    COALESCE(SUM(ut.messages)::INT, 0),
    COALESCE(SUM(ut.tokens_used)::INT, 0)
  FROM usage_tracking ut
  WHERE
    ut.org_id = p_org_id
    AND EXTRACT(YEAR  FROM ut.date) = p_year
    AND EXTRACT(MONTH FROM ut.date) = p_month;
END;
$$;

-- ─── Initial Seed Data (commented out — uncomment for dev) ───────────────────
--
-- INSERT INTO organizations (id, name, slug, plan, settings) VALUES
-- ('00000000-0000-0000-0000-000000000001', 'Acme Corp', 'acme-corp', 'growth', '{}');
--
-- INSERT INTO subscriptions (org_id, plan, status, current_period_start, current_period_end) VALUES
-- ('00000000-0000-0000-0000-000000000001', 'growth', 'active', NOW(), NOW() + INTERVAL '30 days');
