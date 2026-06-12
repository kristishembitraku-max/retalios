/**
 * Memory Manager
 *
 * Manages persistent customer memory in Supabase (table: `memory`).
 * Stores and retrieves structured memory entries (preferences, facts,
 * objections, interests, context, summaries). Supports vector similarity
 * search via pgvector for semantic retrieval.
 *
 * RPC function: `match_memory`
 */

import { createAdminClient } from "@/lib/supabase/server";
import { createChatCompletion, createEmbedding } from "@/lib/ai/deepseek";
import type { Memory, MemoryType, ChatMessage } from "@/types";

// ─── Constants ───────────────────────────────────────────────

const DEFAULT_RETRIEVE_LIMIT = 20;
const DEFAULT_SIMILARITY_LIMIT = 10;
const INSIGHT_EXTRACTION_TEMPERATURE = 0.1;
const MAX_INSIGHT_TOKENS = 800;

// ─── Types ───────────────────────────────────────────────────

interface ExtractedInsight {
  type: MemoryType;
  key: string;
  value: string;
  confidence: number;
}

interface InsightExtractionResult {
  insights: ExtractedInsight[];
}

// ─── Insight Extraction Schema ───────────────────────────────

const INSIGHT_SCHEMA = `{
  "insights": [
    {
      "type": "fact|preference|objection|interest|context|summary",
      "key": "<short descriptive key, e.g. 'preferred_payment_method'>",
      "value": "<the extracted value>",
      "confidence": <0.0-1.0>
    }
  ]
}`;

// ─── MemoryManager Class ─────────────────────────────────────

export class MemoryManager {
  private get db() {
    return createAdminClient();
  }

  // ─── Core CRUD ──────────────────────────────────────────

  /**
   * Stores a memory entry for a customer. If an entry with the same
   * bot_id + session_id + key already exists, it is updated.
   *
   * @param botId         - Bot identifier.
   * @param sessionId     - Conversation session identifier.
   * @param customerEmail - Optional customer email for cross-session memory.
   * @param type          - Memory category.
   * @param key           - Short descriptive key for the memory.
   * @param value         - The value to store.
   * @param embedding     - Optional pre-computed vector (as number[]).
   * @returns             The stored or updated Memory row.
   */
  async storeMemory(
    botId: string,
    sessionId: string,
    customerEmail: string | undefined,
    type: MemoryType,
    key: string,
    value: string,
    embedding?: number[]
  ): Promise<Memory> {
    const supabase = this.db;

    // pgvector stores embeddings as a formatted vector string in Postgres
    const embeddingStr = embedding ? `[${embedding.join(",")}]` : null;

    const { data, error } = await supabase
      .from("memory")
      .upsert(
        {
          bot_id: botId,
          session_id: sessionId,
          customer_email: customerEmail ?? null,
          type: type as "fact" | "preference" | "objection" | "interest" | "context" | "summary",
          key,
          value,
          embedding: embeddingStr,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "bot_id,session_id,key" }
      )
      .select()
      .single();

    if (error) {
      throw new Error(`MemoryManager.storeMemory failed: ${error.message}`);
    }

    return {
      id: data.id,
      bot_id: data.bot_id,
      session_id: data.session_id,
      customer_email: data.customer_email,
      type: data.type as MemoryType,
      key: data.key,
      value: data.value,
      embedding: embedding ?? null,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  /**
   * Retrieves memory entries for a session. If customerEmail is provided,
   * also includes entries from other sessions for the same customer.
   *
   * @param botId         - Bot identifier.
   * @param sessionId     - Session identifier.
   * @param customerEmail - Optional email for cross-session retrieval.
   * @param limit         - Maximum number of entries to return.
   * @returns             Array of Memory entries ordered by most recent.
   */
  async retrieveMemory(
    botId: string,
    sessionId: string,
    customerEmail?: string,
    limit: number = DEFAULT_RETRIEVE_LIMIT
  ): Promise<Memory[]> {
    const supabase = this.db;

    if (customerEmail) {
      const { data, error } = await supabase
        .from("memory")
        .select("id, bot_id, session_id, customer_email, type, key, value, created_at, updated_at")
        .eq("bot_id", botId)
        .or(`session_id.eq.${sessionId},customer_email.eq.${customerEmail}`)
        .order("updated_at", { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`MemoryManager.retrieveMemory failed: ${error.message}`);
      }

      return (data ?? []).map((row) => ({
        ...row,
        type: row.type as MemoryType,
        embedding: null,
      })) as Memory[];
    } else {
      const { data, error } = await supabase
        .from("memory")
        .select("id, bot_id, session_id, customer_email, type, key, value, created_at, updated_at")
        .eq("bot_id", botId)
        .eq("session_id", sessionId)
        .order("updated_at", { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`MemoryManager.retrieveMemory failed: ${error.message}`);
      }

      return (data ?? []).map((row) => ({
        ...row,
        type: row.type as MemoryType,
        embedding: null,
      })) as Memory[];
    }
  }

  /**
   * Performs a vector similarity search over memories using pgvector.
   * Calls the `match_memory` Supabase RPC function.
   *
   * @param botId     - Bot identifier to scope the search.
   * @param embedding - Query embedding vector.
   * @param limit     - Maximum number of results.
   * @returns         Array of Memory entries sorted by similarity.
   */
  async searchSimilarMemory(
    botId: string,
    embedding: number[],
    limit: number = DEFAULT_SIMILARITY_LIMIT
  ): Promise<Memory[]> {
    const supabase = this.db;
    const embeddingStr = `[${embedding.join(",")}]`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("match_memory", {
      query_embedding: embeddingStr,
      bot_id: botId,
      match_count: limit,
    });

    if (error) {
      throw new Error(`MemoryManager.searchSimilarMemory failed: ${error.message}`);
    }

    return (data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      bot_id: row.bot_id as string,
      session_id: row.session_id as string,
      customer_email: null,
      type: row.type as MemoryType,
      key: row.key as string,
      value: row.value as string,
      embedding: null,
      created_at: (row.created_at as string) ?? "",
      updated_at: (row.updated_at as string) ?? "",
    })) as Memory[];
  }

  /**
   * Updates the value of an existing memory entry by ID.
   *
   * @param id    - Memory row UUID.
   * @param value - New value string.
   * @returns     The updated Memory row.
   */
  async updateMemory(id: string, value: string): Promise<Memory> {
    const supabase = this.db;

    const { data, error } = await supabase
      .from("memory")
      .update({ value, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, bot_id, session_id, customer_email, type, key, value, created_at, updated_at")
      .single();

    if (error) {
      throw new Error(`MemoryManager.updateMemory failed: ${error.message}`);
    }

    return {
      ...data,
      type: data.type as MemoryType,
      embedding: null,
    } as Memory;
  }

  // ─── Insight Extraction ──────────────────────────────────

  /**
   * Uses DeepSeek to extract structured insights from a message and stores
   * each as a separate memory entry. Computes and stores embeddings for
   * semantic search.
   *
   * @param botId         - Bot identifier.
   * @param sessionId     - Session identifier.
   * @param customerEmail - Optional customer email.
   * @param message       - The message content to analyse.
   * @param role          - Whether this is a user or assistant message.
   * @param _aiClient     - Unused; kept for API compatibility.
   * @returns             Array of stored Memory entries.
   */
  async extractAndStoreInsights(
    botId: string,
    sessionId: string,
    customerEmail: string | undefined,
    message: string,
    role: "user" | "assistant",
    _aiClient?: unknown
  ): Promise<Memory[]> {
    // Only extract from user messages
    if (role !== "user") return [];

    const systemPrompt = `You are a customer insight extractor for a sales AI. Analyse the customer message and extract structured insights.

Return ONLY valid JSON matching this schema:
${INSIGHT_SCHEMA}

Extraction rules:
- "preference": things the customer prefers (payment method, delivery speed, communication channel, etc.)
- "fact": factual information stated by the customer (company size, budget, timeline, location)
- "objection": price concerns, doubts, competitive comparisons, trust issues
- "interest": products, features, or topics the customer is positively interested in
- "context": situational context about the customer's current situation or use case
- "summary": a high-level summary of the customer's needs (use sparingly)

Only include insights with confidence >= 0.6. If no extractable insights, return {"insights": []}.`;

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Customer message: "${message}"` },
    ];

    let extracted: InsightExtractionResult;
    try {
      const result = await createChatCompletion(messages, {
        temperature: INSIGHT_EXTRACTION_TEMPERATURE,
        maxTokens: MAX_INSIGHT_TOKENS,
      });

      const raw = result.content
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();

      extracted = JSON.parse(raw) as InsightExtractionResult;
    } catch {
      return [];
    }

    if (!extracted.insights || extracted.insights.length === 0) return [];

    const stored: Memory[] = [];

    for (const insight of extracted.insights) {
      if (!insight.key || !insight.value) continue;
      if (insight.confidence < 0.6) continue;

      try {
        let embedding: number[] | undefined;
        try {
          const embResult = await createEmbedding(`${insight.key}: ${insight.value}`);
          embedding = embResult.embedding;
        } catch {
          // Non-fatal — store without embedding
        }

        const memory = await this.storeMemory(
          botId,
          sessionId,
          customerEmail,
          insight.type as MemoryType,
          insight.key,
          insight.value,
          embedding
        );

        stored.push(memory);
      } catch {
        // Non-fatal — continue with remaining insights
      }
    }

    return stored;
  }

  // ─── Summary Builder ─────────────────────────────────────

  /**
   * Builds a formatted memory summary string suitable for injection
   * into an AI system prompt.
   *
   * @param botId         - Bot identifier.
   * @param sessionId     - Session identifier.
   * @param customerEmail - Optional customer email for cross-session memory.
   * @returns             Formatted string, or empty string if no memory exists.
   */
  async getMemorySummary(
    botId: string,
    sessionId: string,
    customerEmail?: string
  ): Promise<string> {
    const memories = await this.retrieveMemory(botId, sessionId, customerEmail);

    if (!memories.length) return "";

    const grouped: Partial<Record<MemoryType, Array<{ key: string; value: string }>>> = {};

    for (const m of memories) {
      if (!grouped[m.type]) grouped[m.type] = [];
      grouped[m.type]!.push({ key: m.key, value: m.value });
    }

    const typeLabels: Record<MemoryType, string> = {
      fact: "Known Facts",
      preference: "Preferences",
      objection: "Raised Objections",
      interest: "Expressed Interests",
      context: "Context",
      summary: "Summary",
    };

    const sections: string[] = [];

    for (const [type, items] of Object.entries(grouped)) {
      if (!items || items.length === 0) continue;
      const label = typeLabels[type as MemoryType] ?? type;
      const lines = items.map((i) => `  - ${i.key}: ${i.value}`).join("\n");
      sections.push(`${label}:\n${lines}`);
    }

    return sections.join("\n\n");
  }
}
