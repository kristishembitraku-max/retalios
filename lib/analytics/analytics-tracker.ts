/**
 * Analytics Tracker
 *
 * Tracks events, messages, and conversions for Fluence AI bots.
 * Aggregates data for dashboard metrics including sentiment trends,
 * intent distribution, daily conversation counts, lead quality, and more.
 * Also manages per-day usage tracking per organisation / bot.
 *
 * DB tables: `analytics_logs`, `conversations`, `messages`, `customer_state`,
 *            `usage_tracking`
 */

import { createAdminClient } from "@/lib/supabase/server";
import type {
  AnalyticsLog,
  AnalyticsEventType,
  CustomerIntent,
  SentimentLabel,
  DashboardMetrics,
  DateRange,
} from "@/types";

// ─── Constants ───────────────────────────────────────────────

/** Maps SentimentLabel to a numeric score for averaging. */
const SENTIMENT_SCORES: Record<SentimentLabel, number> = {
  positive: 4,
  neutral: 3,
  negative: 2,
};

/** All valid CustomerIntent values for initialising distribution maps. */
const ALL_INTENTS: CustomerIntent[] = [
  "browsing",
  "interested",
  "evaluating",
  "ready_to_buy",
  "objecting",
  "churned",
];

// ─── AnalyticsTracker Class ───────────────────────────────────

export class AnalyticsTracker {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private get db(): any {
    return createAdminClient();
  }

  // ─── Event Tracking ──────────────────────────────────────

  /**
   * Tracks a generic analytics event.
   *
   * @param botId          - Bot identifier.
   * @param conversationId - Conversation identifier (or null for bot-level events).
   * @param eventType      - Type of event from AnalyticsEventType.
   * @param data           - Arbitrary event data payload.
   * @returns              The created AnalyticsLog row.
   */
  async trackEvent(
    botId: string,
    conversationId: string | null,
    eventType: AnalyticsEventType,
    data: Record<string, unknown>
  ): Promise<AnalyticsLog> {
    const supabase = this.db;

    const { data: row, error } = await supabase
      .from("analytics_logs")
      .insert({
        bot_id: botId,
        conversation_id: conversationId,
        event_type: eventType,
        data,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`AnalyticsTracker.trackEvent failed: ${error.message}`);
    }

    return row as AnalyticsLog;
  }

  /**
   * Tracks a message event with sentiment, intent, and language metadata.
   *
   * @param botId          - Bot identifier.
   * @param conversationId - Conversation identifier.
   * @param message        - The message content (used for length tracking).
   * @param sentiment      - Detected sentiment label.
   * @param intent         - Detected customer intent.
   * @param language       - Detected ISO 639-1 language code.
   * @returns              The created AnalyticsLog row.
   */
  async trackMessage(
    botId: string,
    conversationId: string,
    message: string,
    sentiment: SentimentLabel | null,
    intent: CustomerIntent | null,
    language: string
  ): Promise<AnalyticsLog> {
    return this.trackEvent(botId, conversationId, "message_sent", {
      sentiment,
      intent,
      language,
      message_length: message.length,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Tracks a conversion event (e.g., lead captured, purchase intent confirmed).
   *
   * @param botId          - Bot identifier.
   * @param conversationId - Conversation identifier.
   * @param conversionType - Human-readable conversion type label.
   * @param data           - Additional conversion data (value, plan, email, etc.).
   * @returns              The created AnalyticsLog row.
   */
  async trackConversion(
    botId: string,
    conversationId: string,
    conversionType: string,
    data: Record<string, unknown>
  ): Promise<AnalyticsLog> {
    return this.trackEvent(botId, conversationId, "conversion", {
      conversion_type: conversionType,
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  // ─── Dashboard Metrics ────────────────────────────────────

  /**
   * Computes dashboard metrics for a bot within a date range.
   *
   * @param botId     - Bot identifier.
   * @param dateRange - ISO date string range (start, end inclusive).
   * @returns         DashboardMetrics aggregate.
   */
  async getDashboardMetrics(
    botId: string,
    dateRange: DateRange
  ): Promise<DashboardMetrics> {
    const supabase = this.db;

    const startTs = new Date(dateRange.start).toISOString();
    const endTs = new Date(dateRange.end + "T23:59:59.999Z").toISOString();

    // ── 1. Conversations in range ──────────────────────────
    const { data: conversations, error: convError } = await supabase
      .from("conversations")
      .select("id, started_at")
      .eq("bot_id", botId)
      .gte("started_at", startTs)
      .lte("started_at", endTs);

    if (convError) {
      throw new Error(
        `AnalyticsTracker.getDashboardMetrics — conversations query failed: ${convError.message}`
      );
    }

    const convRows = (conversations ?? []) as Array<{ id: string; started_at: string }>;
    const totalConversations = convRows.length;
    const conversationIds = convRows.map((c) => c.id);

    // ── 2. Messages in range ───────────────────────────────
    let totalMessages = 0;
    const sentimentScores: number[] = [];
    const intentCounts: Partial<Record<CustomerIntent, number>> = Object.fromEntries(
      ALL_INTENTS.map((i) => [i, 0])
    );
    const languageCounts: Record<string, number> = {};

    if (conversationIds.length > 0) {
      const { data: messages, error: msgError } = await supabase
        .from("messages")
        .select("metadata, language")
        .in("conversation_id", conversationIds);

      if (msgError) {
        throw new Error(
          `AnalyticsTracker.getDashboardMetrics — messages query failed: ${msgError.message}`
        );
      }

      const msgRows = (messages ?? []) as Array<{
        metadata: Record<string, unknown> | null;
        language: string | null;
      }>;

      totalMessages = msgRows.length;

      for (const msg of msgRows) {
        const meta = msg.metadata ?? {};

        const sentiment = meta["detected_sentiment"] as SentimentLabel | undefined;
        if (sentiment && sentiment in SENTIMENT_SCORES) {
          sentimentScores.push(SENTIMENT_SCORES[sentiment]);
        }

        const intent = meta["detected_intent"] as CustomerIntent | undefined;
        if (intent && intent in intentCounts) {
          intentCounts[intent] = (intentCounts[intent] ?? 0) + 1;
        }

        const lang = msg.language ?? "unknown";
        languageCounts[lang] = (languageCounts[lang] ?? 0) + 1;
      }
    }

    const avgSentimentScore =
      sentimentScores.length > 0
        ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length
        : 3;

    // ── 3. Leads (lead_captured events) ───────────────────
    let totalLeads = 0;
    if (conversationIds.length > 0) {
      const { count, error: leadError } = await supabase
        .from("analytics_logs")
        .select("id", { count: "exact", head: true })
        .eq("bot_id", botId)
        .eq("event_type", "lead_captured")
        .in("conversation_id", conversationIds);

      if (!leadError) totalLeads = count ?? 0;
    }

    const conversionRate =
      totalConversations > 0 ? (totalLeads / totalConversations) * 100 : 0;

    // ── 4. Handoff Rate ────────────────────────────────────
    let handoffCount = 0;
    if (conversationIds.length > 0) {
      const { count, error: handoffError } = await supabase
        .from("analytics_logs")
        .select("id", { count: "exact", head: true })
        .eq("bot_id", botId)
        .eq("event_type", "handoff_requested")
        .in("conversation_id", conversationIds);

      if (!handoffError) handoffCount = count ?? 0;
    }

    const handoffRate =
      totalConversations > 0 ? (handoffCount / totalConversations) * 100 : 0;

    // ── 5. Top Languages ───────────────────────────────────
    const topLanguages = Object.entries(languageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([language, count]) => ({ language, count }));

    // ── 6. Daily Conversation Counts ───────────────────────
    const dailyMap: Record<string, number> = {};
    for (const conv of convRows) {
      const day = conv.started_at.slice(0, 10);
      dailyMap[day] = (dailyMap[day] ?? 0) + 1;
    }

    const dailyConversations = Object.entries(dailyMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));

    // ── 7. Common Objections ───────────────────────────────
    const objectionCounts: Record<string, number> = {};

    if (conversationIds.length > 0) {
      const { data: states, error: stateError } = await supabase
        .from("customer_state")
        .select("objections")
        .eq("bot_id", botId)
        .in("session_id", conversationIds);

      if (!stateError) {
        const stateRows = (states ?? []) as Array<{ objections: unknown }>;
        for (const state of stateRows) {
          const objs = (state.objections as string[]) ?? [];
          for (const obj of objs) {
            const key = obj.toLowerCase().trim();
            objectionCounts[key] = (objectionCounts[key] ?? 0) + 1;
          }
        }
      }
    }

    const commonObjections = Object.entries(objectionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([objection, count]) => ({ objection, count }));

    // ── 8. Avg Conversion Probability ─────────────────────
    let avgConversionProbability = 0;

    if (conversationIds.length > 0) {
      const { data: stateProbs, error: probError } = await supabase
        .from("customer_state")
        .select("conversion_probability")
        .eq("bot_id", botId)
        .in("session_id", conversationIds);

      if (!probError && stateProbs && stateProbs.length > 0) {
        const probRows = stateProbs as Array<{ conversion_probability: number }>;
        const probs = probRows.map((s) => s.conversion_probability ?? 0);
        avgConversionProbability = probs.reduce((a, b) => a + b, 0) / probs.length;
      }
    }

    return {
      totalConversations,
      totalMessages,
      totalLeads,
      avgSentimentScore: Math.round(avgSentimentScore * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100,
      topLanguages,
      intentDistribution: intentCounts,
      dailyConversations,
      commonObjections,
      avgConversionProbability: Math.round(avgConversionProbability * 100) / 100,
      handoffRate: Math.round(handoffRate * 100) / 100,
    };
  }

  // ─── Usage Tracking ───────────────────────────────────────

  /**
   * Upserts daily usage tracking totals for an organisation / bot.
   * Increments existing counters for the current day; inserts a new row
   * if no record exists for today.
   *
   * @param orgId         - Organisation identifier.
   * @param botId         - Bot identifier (null for org-level tracking).
   * @param conversations - Number of new conversations to add.
   * @param messages      - Number of new messages to add.
   * @param tokensUsed    - Number of tokens consumed to add.
   */
  async updateUsageTracking(
    orgId: string,
    botId: string | null,
    conversations: number,
    messages: number,
    tokensUsed: number
  ): Promise<void> {
    const supabase = this.db;
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const baseQuery = supabase
      .from("usage_tracking")
      .select("id, conversations, messages, tokens_used")
      .eq("org_id", orgId)
      .eq("date", today);

    const { data: existing, error: fetchError } = await (
      botId ? baseQuery.eq("bot_id", botId) : baseQuery.is("bot_id", null)
    ).maybeSingle();

    if (fetchError) {
      throw new Error(
        `AnalyticsTracker.updateUsageTracking — fetch failed: ${fetchError.message}`
      );
    }

    const row = existing as {
      id: string;
      conversations: number;
      messages: number;
      tokens_used: number;
    } | null;

    if (row) {
      const { error: updateError } = await supabase
        .from("usage_tracking")
        .update({
          conversations: row.conversations + conversations,
          messages: row.messages + messages,
          tokens_used: row.tokens_used + tokensUsed,
        })
        .eq("id", row.id);

      if (updateError) {
        throw new Error(
          `AnalyticsTracker.updateUsageTracking — update failed: ${updateError.message}`
        );
      }
    } else {
      const { error: insertError } = await supabase.from("usage_tracking").insert({
        org_id: orgId,
        bot_id: botId,
        date: today,
        conversations,
        messages,
        tokens_used: tokensUsed,
      });

      if (insertError) {
        throw new Error(
          `AnalyticsTracker.updateUsageTracking — insert failed: ${insertError.message}`
        );
      }
    }
  }
}
