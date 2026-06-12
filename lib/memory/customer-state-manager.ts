/**
 * Customer State Manager
 *
 * Manages the CustomerState record in Supabase (table: `customer_state`).
 * Tracks a customer's intent, sentiment, buying stage, conversion probability,
 * and accumulated objections/interests across a conversation session.
 *
 * Uses DeepSeek to analyse each message turn and update state accordingly.
 */

import { createAdminClient } from "@/lib/supabase/server";
import { createChatCompletion } from "@/lib/ai/deepseek";
import type {
  CustomerState,
  CustomerIntent,
  SentimentLabel,
  BuyingStage,
  ChatMessage,
} from "@/types";

// ─── Constants ───────────────────────────────────────────────

const STATE_ANALYSIS_TEMPERATURE = 0.1;
const STATE_ANALYSIS_MAX_TOKENS = 400;

// ─── Types ───────────────────────────────────────────────────

interface StateAnalysis {
  intent: CustomerIntent;
  sentiment: SentimentLabel;
  buying_stage: BuyingStage;
  conversion_probability: number;
  new_objections: string[];
  new_interests: string[];
}

const STATE_ANALYSIS_SCHEMA = `{
  "intent": "browsing|interested|evaluating|ready_to_buy|objecting|churned",
  "sentiment": "positive|neutral|negative",
  "buying_stage": "awareness|interest|consideration|intent|evaluation|purchase",
  "conversion_probability": <integer 0-100>,
  "new_objections": ["<string>"],
  "new_interests": ["<string>"]
}`;

// ─── DB row to CustomerState mapper ──────────────────────────

type StateRow = {
  id: string;
  bot_id: string;
  session_id: string;
  customer_email: string | null;
  intent: string | null;
  sentiment: "positive" | "neutral" | "negative" | null;
  buying_stage:
    | "awareness"
    | "interest"
    | "consideration"
    | "intent"
    | "evaluation"
    | "purchase"
    | null;
  conversion_probability: number;
  last_language: string | null;
  objections: unknown;
  interests: unknown;
  updated_at: string;
};

function rowToCustomerState(row: StateRow): CustomerState {
  return {
    id: row.id,
    bot_id: row.bot_id,
    session_id: row.session_id,
    customer_email: row.customer_email,
    intent: (row.intent as CustomerIntent | null) ?? null,
    sentiment: (row.sentiment as SentimentLabel | null) ?? null,
    buying_stage: (row.buying_stage as BuyingStage | null) ?? null,
    conversion_probability: row.conversion_probability,
    last_language: row.last_language,
    objections: (row.objections as string[]) ?? [],
    interests: (row.interests as string[]) ?? [],
    updated_at: row.updated_at,
  };
}

// ─── CustomerStateManager Class ──────────────────────────────

export class CustomerStateManager {
  private get db() {
    return createAdminClient();
  }

  // ─── Read ─────────────────────────────────────────────────

  /**
   * Retrieves or creates the CustomerState for a given bot + session.
   * If no state exists, creates a default "browsing / awareness" state.
   *
   * @param botId         - Bot identifier.
   * @param sessionId     - Session identifier.
   * @param customerEmail - Optional customer email.
   * @returns             Current CustomerState.
   */
  async getState(
    botId: string,
    sessionId: string,
    customerEmail?: string
  ): Promise<CustomerState> {
    const supabase = this.db;

    const { data, error } = await supabase
      .from("customer_state")
      .select(
        "id, bot_id, session_id, customer_email, intent, sentiment, buying_stage, conversion_probability, last_language, objections, interests, updated_at"
      )
      .eq("bot_id", botId)
      .eq("session_id", sessionId)
      .maybeSingle();

    if (error) {
      throw new Error(`CustomerStateManager.getState failed: ${error.message}`);
    }

    if (data) {
      return rowToCustomerState(data as unknown as StateRow);
    }

    return this.createDefaultState(botId, sessionId, customerEmail);
  }

  /**
   * Creates and persists a new default CustomerState.
   */
  private async createDefaultState(
    botId: string,
    sessionId: string,
    customerEmail?: string
  ): Promise<CustomerState> {
    const supabase = this.db;
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("customer_state")
      .insert({
        bot_id: botId,
        session_id: sessionId,
        customer_email: customerEmail ?? null,
        intent: "browsing",
        sentiment: "neutral",
        buying_stage: "awareness",
        conversion_probability: 10,
        last_language: null,
        objections: [] as unknown as never,
        interests: [] as unknown as never,
        updated_at: now,
      })
      .select(
        "id, bot_id, session_id, customer_email, intent, sentiment, buying_stage, conversion_probability, last_language, objections, interests, updated_at"
      )
      .single();

    if (error) {
      throw new Error(
        `CustomerStateManager.createDefaultState failed: ${error.message}`
      );
    }

    return rowToCustomerState(data as unknown as StateRow);
  }

  // ─── Write ────────────────────────────────────────────────

  /**
   * Applies a partial state update to the Supabase record for a session.
   *
   * @param botId         - Bot identifier.
   * @param sessionId     - Session identifier.
   * @param customerEmail - Optional email (used when creating if not exists).
   * @param updates       - Partial state fields to apply.
   * @returns             Updated CustomerState.
   */
  async updateState(
    botId: string,
    sessionId: string,
    customerEmail: string | undefined,
    updates: Partial<CustomerState>
  ): Promise<CustomerState> {
    const supabase = this.db;

    const { data: existing } = await supabase
      .from("customer_state")
      .select("id")
      .eq("bot_id", botId)
      .eq("session_id", sessionId)
      .maybeSingle();

    if (!existing) {
      await this.createDefaultState(botId, sessionId, customerEmail);
    }

    // Build a clean update object matching the DB column types
    const dbUpdate: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.intent !== undefined) dbUpdate.intent = updates.intent;
    if (updates.sentiment !== undefined) dbUpdate.sentiment = updates.sentiment;
    if (updates.buying_stage !== undefined) dbUpdate.buying_stage = updates.buying_stage;
    if (updates.conversion_probability !== undefined)
      dbUpdate.conversion_probability = updates.conversion_probability;
    if (updates.last_language !== undefined) dbUpdate.last_language = updates.last_language;
    if (updates.objections !== undefined) dbUpdate.objections = updates.objections;
    if (updates.interests !== undefined) dbUpdate.interests = updates.interests;
    if (updates.customer_email !== undefined) dbUpdate.customer_email = updates.customer_email;

    const { data, error } = await supabase
      .from("customer_state")
      .update(dbUpdate as Parameters<ReturnType<typeof supabase.from>["update"]>[0])
      .eq("bot_id", botId)
      .eq("session_id", sessionId)
      .select(
        "id, bot_id, session_id, customer_email, intent, sentiment, buying_stage, conversion_probability, last_language, objections, interests, updated_at"
      )
      .single();

    if (error) {
      throw new Error(`CustomerStateManager.updateState failed: ${error.message}`);
    }

    return rowToCustomerState(data as unknown as StateRow);
  }

  // ─── AI Analysis ──────────────────────────────────────────

  /**
   * Uses DeepSeek to analyse the latest message turn and updates the
   * customer state accordingly. Merges new objections/interests without
   * overwriting existing ones.
   *
   * @param botId         - Bot identifier.
   * @param sessionId     - Session identifier.
   * @param customerEmail - Optional customer email.
   * @param message       - The user message being analysed.
   * @param role          - "user" or "assistant".
   * @param aiResponse    - The assistant's reply (for context).
   * @param _aiClient     - Unused; kept for API compatibility.
   * @returns             Updated CustomerState.
   */
  async analyzeAndUpdateState(
    botId: string,
    sessionId: string,
    customerEmail: string | undefined,
    message: string,
    role: "user" | "assistant",
    aiResponse: string,
    _aiClient?: unknown
  ): Promise<CustomerState> {
    const currentState = await this.getState(botId, sessionId, customerEmail);

    if (role !== "user") {
      return this.updateState(botId, sessionId, customerEmail, {
        updated_at: new Date().toISOString(),
      });
    }

    const analysis = await this.runStateAnalysis(message, aiResponse, currentState);

    const mergedObjections = Array.from(
      new Set([
        ...((currentState.objections as string[]) ?? []),
        ...(analysis.new_objections ?? []),
      ])
    );
    const mergedInterests = Array.from(
      new Set([
        ...((currentState.interests as string[]) ?? []),
        ...(analysis.new_interests ?? []),
      ])
    );

    return this.updateState(botId, sessionId, customerEmail, {
      intent: analysis.intent,
      sentiment: analysis.sentiment,
      buying_stage: analysis.buying_stage,
      conversion_probability: analysis.conversion_probability,
      objections: mergedObjections,
      interests: mergedInterests,
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Calls DeepSeek to classify the customer state from the current message.
   */
  private async runStateAnalysis(
    userMessage: string,
    aiResponse: string,
    currentState: CustomerState
  ): Promise<StateAnalysis> {
    const contextSummary = `Current state: intent=${currentState.intent ?? "unknown"}, stage=${currentState.buying_stage ?? "awareness"}, probability=${currentState.conversion_probability}%, sentiment=${currentState.sentiment ?? "neutral"}`;

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `You are a sales state classifier. Analyse the customer message and AI response to update the customer's sales state.

Return ONLY valid JSON matching this schema:
${STATE_ANALYSIS_SCHEMA}

Rules:
- intent: browsing=just looking, interested=showing interest, evaluating=comparing options, ready_to_buy=ready to purchase, objecting=raising concerns, churned=disengaging
- sentiment: positive|neutral|negative based on overall tone
- buying_stage: awareness→interest→consideration→intent→evaluation→purchase
- conversion_probability: 0-100 integer. Consider buying signals and objections
- new_objections: NEW objections in THIS message only
- new_interests: NEW products/features/topics expressed positively in THIS message only
- Do NOT regress buying_stage without strong evidence of disengagement`,
      },
      {
        role: "user",
        content: `${contextSummary}\n\nCustomer message: "${userMessage}"\nAI response: "${aiResponse}"\n\nClassify the updated state:`,
      },
    ];

    try {
      const result = await createChatCompletion(messages, {
        temperature: STATE_ANALYSIS_TEMPERATURE,
        maxTokens: STATE_ANALYSIS_MAX_TOKENS,
      });

      const raw = result.content
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();

      const parsed = JSON.parse(raw) as StateAnalysis;

      return {
        intent:
          (parsed.intent as CustomerIntent) ??
          (currentState.intent as CustomerIntent) ??
          "browsing",
        sentiment:
          (parsed.sentiment as SentimentLabel) ??
          (currentState.sentiment as SentimentLabel) ??
          "neutral",
        buying_stage:
          (parsed.buying_stage as BuyingStage) ??
          (currentState.buying_stage as BuyingStage) ??
          "awareness",
        conversion_probability: Math.min(
          100,
          Math.max(
            0,
            Number(parsed.conversion_probability) || currentState.conversion_probability
          )
        ),
        new_objections: Array.isArray(parsed.new_objections) ? parsed.new_objections : [],
        new_interests: Array.isArray(parsed.new_interests) ? parsed.new_interests : [],
      };
    } catch {
      return {
        intent: (currentState.intent as CustomerIntent) ?? "browsing",
        sentiment: (currentState.sentiment as SentimentLabel) ?? "neutral",
        buying_stage: (currentState.buying_stage as BuyingStage) ?? "awareness",
        conversion_probability: currentState.conversion_probability,
        new_objections: [],
        new_interests: [],
      };
    }
  }

  // ─── Prompt Formatter ─────────────────────────────────────

  /**
   * Formats a CustomerState into a concise string for injection into
   * AI system prompts.
   *
   * @param state - The customer state to format.
   * @returns     Multi-line string summarising the state.
   */
  getStateForPrompt(state: CustomerState): string {
    const lines: string[] = [
      `Conversion Probability: ${state.conversion_probability}%`,
    ];

    if (state.intent) lines.push(`Intent: ${state.intent}`);
    if (state.sentiment) lines.push(`Sentiment: ${state.sentiment}`);
    if (state.buying_stage) lines.push(`Buying Stage: ${state.buying_stage}`);
    if (state.last_language) lines.push(`Last Language: ${state.last_language}`);

    const interests = (state.interests as string[]) ?? [];
    if (interests.length > 0) {
      lines.push(`Interests: ${interests.join(", ")}`);
    }

    const objections = (state.objections as string[]) ?? [];
    if (objections.length > 0) {
      lines.push(`Active Objections: ${objections.join(", ")}`);
    }

    if (state.customer_email) {
      lines.push(`Customer Email: ${state.customer_email}`);
    }

    return lines.join("\n");
  }
}
