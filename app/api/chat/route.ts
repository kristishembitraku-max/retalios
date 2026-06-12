/**
 * POST /api/chat
 *
 * Public-facing chat endpoint consumed by the embeddable widget.
 * Validates the embedToken, runs the full sales-engine pipeline,
 * and returns the AI response together with conversation metadata.
 *
 * Supports two modes:
 *   - Streaming  (Accept: text/event-stream)  → ReadableStream of SSE chunks
 *   - Non-streaming (default)                 → JSON body
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { createAdminClient } from "@/lib/supabase/server";
import { SalesEngine } from "@/lib/ai/sales-engine";
import { detectLanguage } from "@/lib/ai/language-detector";
import { MemoryManager } from "@/lib/memory/memory-manager";
import { CustomerStateManager } from "@/lib/memory/customer-state-manager";
import { RAGEngine } from "@/lib/rag/knowledge-retrieval";
import { AnalyticsTracker } from "@/lib/analytics/analytics-tracker";
import type { ChatMessage, CustomerState } from "@/types";

// ─── CORS helpers ────────────────────────────────────────────

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// ─── Validation ──────────────────────────────────────────────

const ChatRequestSchema = z.object({
  botId: z.string().uuid("botId must be a valid UUID"),
  sessionId: z.string().min(1, "sessionId is required"),
  message: z.string().min(1, "message cannot be empty").max(4000, "message too long"),
  customerEmail: z.string().email().optional(),
  customerName: z.string().max(120).optional(),
  embedToken: z.string().min(1, "embedToken is required"),
});

// ─── POST handler ────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Parse + validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422, headers: CORS_HEADERS }
    );
  }

  const { botId, sessionId, message, customerEmail, customerName, embedToken } =
    parsed.data;

  const supabase = createAdminClient();

  // ── 1. Validate embedToken against bot record ──────────────
  const { data: bot, error: botError } = await supabase
    .from("bots")
    .select("*")
    .eq("id", botId)
    .eq("embed_token", embedToken)
    .eq("is_active", true)
    .single();

  if (botError || !bot) {
    return NextResponse.json(
      { error: "Invalid embedToken or bot not found" },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  // ── 2. Language detection ──────────────────────────────────
  const language = await detectLanguage(message).catch(() => bot.language ?? "en");

  // ── 3. Get or create conversation record ──────────────────
  let conversationId: string;

  const { data: existingConv } = await supabase
    .from("conversations")
    .select("id")
    .eq("bot_id", botId)
    .eq("session_id", sessionId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (existingConv) {
    conversationId = existingConv.id;
  } else {
    const { data: newConv, error: convError } = await supabase
      .from("conversations")
      .insert({
        id: uuidv4(),
        bot_id: botId,
        session_id: sessionId,
        customer_email: customerEmail ?? null,
        customer_name: customerName ?? null,
        language,
        status: "active",
      })
      .select("id")
      .single();

    if (convError || !newConv) {
      return NextResponse.json(
        { error: "Failed to create conversation" },
        { status: 500, headers: CORS_HEADERS }
      );
    }
    conversationId = newConv.id;
  }

  // ── 4. Retrieve previous messages (context window) ────────
  const { data: previousMessages } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(20);

  const conversationHistory: ChatMessage[] = (previousMessages ?? []).map((m) => ({
    role: m.role as "user" | "assistant" | "system",
    content: m.content,
  }));

  // ── 5. Memory + customer state ────────────────────────────
  const memoryManager = new MemoryManager(supabase as never);
  const stateManager = new CustomerStateManager(supabase as never);

  const [memoryContext, customerState] = await Promise.all([
    bot.enable_memory
      ? memoryManager.getRelevantMemory({ botId, sessionId, customerEmail, query: message }).catch(() => [])
      : Promise.resolve([]),
    stateManager.getOrCreate({ botId, sessionId, customerEmail }).catch(() => null),
  ]);

  // ── 6. RAG knowledge retrieval ────────────────────────────
  const ragEngine = new RAGEngine(supabase as never);
  const ragResults = bot.enable_rag
    ? await ragEngine.search({ botId, query: message, topK: 4 }).catch(() => ({ chunks: [] }))
    : { chunks: [] };

  // ── 7. Store user message ─────────────────────────────────
  const userMessageId = uuidv4();
  await supabase.from("messages").insert({
    id: userMessageId,
    conversation_id: conversationId,
    bot_id: botId,
    role: "user",
    content: message,
    language,
  });

  // ── 8. Decide streaming vs. JSON ──────────────────────────
  const wantsStream =
    request.headers.get("accept")?.includes("text/event-stream") ?? false;

  const salesEngine = new SalesEngine({
    bot,
    customerState: customerState as CustomerState | null,
    memoryContext,
    ragChunks: ragResults.chunks,
  });

  if (wantsStream) {
    return handleStreaming({
      salesEngine,
      botId,
      conversationId,
      sessionId,
      message,
      customerEmail,
      conversationHistory,
      language,
      customerState: customerState as CustomerState | null,
      supabase,
      memoryManager,
      stateManager,
      tracker: bot.enable_analytics ? new AnalyticsTracker(supabase as never) : null,
    });
  }

  // ── 9. Non-streaming response ─────────────────────────────
  const output = await salesEngine.generateResponse({
    userMessage: message,
    conversationHistory,
    language,
  });

  const assistantMessageId = uuidv4();
  await supabase.from("messages").insert({
    id: assistantMessageId,
    conversation_id: conversationId,
    bot_id: botId,
    role: "assistant",
    content: output.response,
    language,
    sentiment: output.insights.detectedSentiment,
    intent: output.insights.detectedIntent,
    tokens_used: output.tokensUsed,
  });

  // ── 10. Async side-effects (state, memory, analytics) ─────
  const sideEffects: Promise<unknown>[] = [
    stateManager
      .update({ botId, sessionId, customerEmail, updates: output.updatedState })
      .catch(console.error),
  ];

  if (bot.enable_memory) {
    sideEffects.push(
      memoryManager
        .extractAndStore({ botId, sessionId, customerEmail, userMessage: message, aiResponse: output.response })
        .catch(console.error)
    );
  }

  if (bot.enable_analytics) {
    const tracker = new AnalyticsTracker(supabase as never);
    sideEffects.push(
      tracker
        .track({ botId, conversationId, eventType: "message_received", data: { insights: output.insights, language, tokensUsed: output.tokensUsed } })
        .catch(console.error)
    );
  }

  // Fire-and-forget — do NOT await
  Promise.all(sideEffects);

  // ── 11. Update conversation lead_score ────────────────────
  supabase
    .from("conversations")
    .update({
      language,
      updated_at: new Date().toISOString(),
      lead_score: output.updatedState.conversion_probability ?? undefined,
    })
    .eq("id", conversationId)
    .then(() => {});

  return NextResponse.json(
    {
      response: output.response,
      conversationId,
      language,
      insights: {
        intent: output.insights.detectedIntent,
        sentiment: output.insights.detectedSentiment,
        buyingStage: output.insights.detectedBuyingStage,
        conversionProbability: output.insights.conversionProbability,
        handoffRecommended: output.insights.handoffRecommended,
        handoffReason: output.insights.handoffReason ?? null,
      },
    },
    { status: 200, headers: CORS_HEADERS }
  );
}

// ─── Streaming helper ────────────────────────────────────────

interface StreamingParams {
  salesEngine: SalesEngine;
  botId: string;
  conversationId: string;
  sessionId: string;
  message: string;
  customerEmail?: string;
  conversationHistory: ChatMessage[];
  language: string;
  customerState: CustomerState | null;
  supabase: ReturnType<typeof createAdminClient>;
  memoryManager: MemoryManager;
  stateManager: CustomerStateManager;
  tracker: AnalyticsTracker | null;
}

function handleStreaming(params: StreamingParams): NextResponse {
  const {
    salesEngine,
    botId,
    conversationId,
    message,
    customerEmail,
    sessionId,
    conversationHistory,
    language,
    supabase,
    memoryManager,
    stateManager,
    tracker,
  } = params;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (event: string, data: unknown) => {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      try {
        let fullResponse = "";

        const streamOutput = await salesEngine.generateResponseStream({
          userMessage: message,
          conversationHistory,
          language,
        });

        for await (const chunk of streamOutput.stream) {
          fullResponse += chunk;
          sendEvent("chunk", { text: chunk });
        }

        const insights = streamOutput.insights;

        sendEvent("done", {
          conversationId,
          language,
          insights: {
            intent: insights.detectedIntent,
            sentiment: insights.detectedSentiment,
            buyingStage: insights.detectedBuyingStage,
            conversionProbability: insights.conversionProbability,
            handoffRecommended: insights.handoffRecommended,
            handoffReason: insights.handoffReason ?? null,
          },
        });

        controller.close();

        // Persist AI message + fire side-effects after streaming ends
        const assistantMessageId = uuidv4();
        await Promise.allSettled([
          supabase.from("messages").insert({
            id: assistantMessageId,
            conversation_id: conversationId,
            bot_id: botId,
            role: "assistant",
            content: fullResponse,
            language,
            sentiment: insights.detectedSentiment,
            intent: insights.detectedIntent,
            tokens_used: streamOutput.tokensUsed,
          }),
          stateManager.update({ botId, sessionId, customerEmail, updates: streamOutput.updatedState }),
          memoryManager.extractAndStore({ botId, sessionId, customerEmail, userMessage: message, aiResponse: fullResponse }),
          tracker?.track({ botId, conversationId, eventType: "message_received", data: { insights, language } }),
          supabase.from("conversations").update({ language, updated_at: new Date().toISOString(), lead_score: streamOutput.updatedState.conversion_probability }).eq("id", conversationId),
        ]);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Stream error";
        const payload = `event: error\ndata: ${JSON.stringify({ error: message })}\n\n`;
        controller.enqueue(encoder.encode(payload));
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
