/**
 * Sales Engine
 *
 * Core AI orchestration layer. Builds a rich, context-aware system prompt
 * from bot configuration, customer state, memory, and RAG context, then
 * calls DeepSeek to generate a sales-optimised response. Structured
 * insights are extracted from every turn.
 */

import { createChatCompletion } from "@/lib/ai/deepseek";
import type {
  Bot,
  BotConfig,
  BotTone,
  SalesStyle,
  CustomerState,
  Memory,
  KnowledgeBase,
  ChatMessage,
  SalesEngineOutput,
  SalesInsights,
  CustomerIntent,
  CustomerSentiment,
  BuyingStage,
  SentimentLabel,
} from "@/types";

// ─── Constants ───────────────────────────────────────────────

const INSIGHT_EXTRACTION_TEMPERATURE = 0.1;
const RESPONSE_TEMPERATURE_DEFAULT = 0.75;
const MAX_RESPONSE_TOKENS = 600;
const MAX_INSIGHT_TOKENS = 512;

// ─── Types ───────────────────────────────────────────────────

export interface SalesEngineConstructorArgs {
  bot: Bot;
  memory: Memory[];
  customerState: CustomerState | null;
  ragContext: KnowledgeBase[];
}

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Maps a BotTone value to a natural-language description for the system prompt.
 */
function toneDescription(tone: BotTone): string {
  const map: Record<BotTone, string> = {
    professional: "professional and polished",
    friendly: "warm and friendly",
    casual: "casual and conversational",
    formal: "formal and respectful",
    enthusiastic: "enthusiastic and energetic",
  };
  return map[tone] ?? "professional";
}

/**
 * Maps a SalesStyle value to strategic guidance for the system prompt.
 */
function salesStyleGuidance(style: SalesStyle): string {
  const map: Record<SalesStyle, string> = {
    consultative:
      "Ask discovery questions to understand the customer's needs before recommending solutions. Position yourself as a trusted advisor.",
    assertive:
      "Be confident and direct about product value. Make clear recommendations and calls-to-action when buying signals appear.",
    educational:
      "Provide valuable information and insights. Help the customer understand the problem and why your solution is the best fit.",
    empathetic:
      "Lead with understanding. Validate feelings and concerns before presenting solutions. Build emotional connection.",
    direct:
      "Be clear and concise about product benefits. Make direct offers and CTAs when the customer shows buying signals.",
  };
  return map[style] ?? "Engage the customer and guide them toward a purchase decision.";
}

/**
 * Maps a buying stage to a recommended next action for the AI.
 */
function stageNextAction(stage: BuyingStage): string {
  const map: Record<BuyingStage, string> = {
    awareness: "Educate the customer about the problem your product solves. Spark curiosity.",
    interest: "Highlight key benefits and differentiators. Invite them to learn more.",
    consideration:
      "Provide detailed comparisons, case studies, and social proof. Address concerns proactively.",
    intent:
      "Offer a demo, free trial, or direct purchase path. Remove final friction points.",
    evaluation:
      "Answer specific questions thoroughly. Provide proof points and reassurance to tip the decision.",
    purchase:
      "Confirm details smoothly. Upsell/cross-sell complementary products if relevant.",
  };
  return map[stage] ?? "Engage and understand the customer's needs.";
}

/**
 * Formats the memory array into a concise prompt block.
 */
function formatMemoryForPrompt(memory: Memory[]): string {
  if (!memory.length) return "No prior memory for this customer.";

  const grouped: Partial<Record<string, string[]>> = {};
  for (const m of memory) {
    if (!grouped[m.type]) grouped[m.type] = [];
    grouped[m.type]!.push(`${m.key}: ${m.value}`);
  }

  return Object.entries(grouped)
    .map(([type, items]) => `[${type.toUpperCase()}]\n${items!.join("\n")}`)
    .join("\n\n");
}

/**
 * Formats RAG chunks into a prompt-ready context block.
 */
function formatRAGForPrompt(chunks: KnowledgeBase[]): string {
  if (!chunks.length) return "";
  return chunks
    .map((c, i) => `[${i + 1}] ${c.title}\n${c.content}`)
    .join("\n\n---\n\n");
}

/**
 * Formats a CustomerState into a concise prompt-ready string.
 */
function formatStateForPrompt(state: CustomerState | null): string {
  if (!state) return "No customer state available. This may be the first interaction.";

  const lines: string[] = [];
  if (state.intent) lines.push(`Intent: ${state.intent}`);
  if (state.sentiment) lines.push(`Sentiment: ${state.sentiment}`);
  if (state.buying_stage) lines.push(`Buying Stage: ${state.buying_stage}`);
  lines.push(`Conversion Probability: ${state.conversion_probability}%`);

  if (state.interests && (state.interests as string[]).length > 0) {
    lines.push(`Known Interests: ${(state.interests as string[]).join(", ")}`);
  }
  if (state.objections && (state.objections as string[]).length > 0) {
    lines.push(`Known Objections: ${(state.objections as string[]).join(", ")}`);
  }

  return lines.join("\n");
}

// ─── Insight Extraction ──────────────────────────────────────

const INSIGHT_SCHEMA = `{
  "detectedIntent": "browsing|interested|evaluating|ready_to_buy|objecting|churned",
  "detectedSentiment": "very_positive|positive|neutral|negative|very_negative",
  "detectedBuyingStage": "awareness|interest|consideration|intent|evaluation|purchase",
  "conversionProbability": <0-100>,
  "newObjections": ["..."],
  "newInterests": ["..."],
  "suggestedFollowUp": "<optional string>",
  "handoffRecommended": true|false,
  "handoffReason": "<optional string>"
}`;

/**
 * Extracts structured SalesInsights from a user message + AI response pair.
 */
async function extractInsights(
  userMessage: string,
  aiResponse: string,
  currentState: CustomerState | null
): Promise<SalesInsights> {
  const stateContext = currentState
    ? `Current intent: ${currentState.intent ?? "unknown"}, stage: ${currentState.buying_stage ?? "awareness"}, probability: ${currentState.conversion_probability}%`
    : "No prior state.";

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are a sales intelligence analyst. Analyse the conversation turn and return ONLY valid JSON matching this exact schema:\n${INSIGHT_SCHEMA}\n\nRules:\n- newObjections: price concerns, doubts, comparisons with competitors, trust issues\n- newInterests: features, products, or topics the customer expressed positive interest in\n- handoffRecommended: true if customer explicitly asks for human agent, is very frustrated, or is ready to purchase a high-value item\n- conversionProbability: integer 0-100 based on buying signals`,
    },
    {
      role: "user",
      content: `Context: ${stateContext}\n\nUser message: "${userMessage}"\n\nAI response: "${aiResponse}"\n\nExtract insights as JSON:`,
    },
  ];

  try {
    const result = await createChatCompletion(messages, {
      temperature: INSIGHT_EXTRACTION_TEMPERATURE,
      maxTokens: MAX_INSIGHT_TOKENS,
    });

    const raw = result.content
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    const parsed = JSON.parse(raw) as SalesInsights;

    return {
      detectedIntent: (parsed.detectedIntent as CustomerIntent) ?? "browsing",
      detectedSentiment: (parsed.detectedSentiment as CustomerSentiment) ?? "neutral",
      detectedBuyingStage: (parsed.detectedBuyingStage as BuyingStage) ?? "awareness",
      conversionProbability: Math.min(
        100,
        Math.max(0, Number(parsed.conversionProbability) || 0)
      ),
      newObjections: Array.isArray(parsed.newObjections) ? parsed.newObjections : [],
      newInterests: Array.isArray(parsed.newInterests) ? parsed.newInterests : [],
      suggestedFollowUp: parsed.suggestedFollowUp ?? undefined,
      handoffRecommended: Boolean(parsed.handoffRecommended),
      handoffReason: parsed.handoffReason ?? undefined,
    };
  } catch {
    return {
      detectedIntent: (currentState?.intent as CustomerIntent) ?? "browsing",
      detectedSentiment: "neutral",
      detectedBuyingStage: (currentState?.buying_stage as BuyingStage) ?? "awareness",
      conversionProbability: currentState?.conversion_probability ?? 10,
      newObjections: [],
      newInterests: [],
      handoffRecommended: false,
    };
  }
}

// ─── SalesEngine Class ───────────────────────────────────────

export class SalesEngine {
  private readonly bot: Bot;
  private readonly config: BotConfig;
  private readonly memory: Memory[];
  private readonly customerState: CustomerState | null;
  private readonly ragContext: KnowledgeBase[];

  constructor({ bot, memory, customerState, ragContext }: SalesEngineConstructorArgs) {
    this.bot = bot;
    this.config = bot.config as BotConfig;
    this.memory = memory;
    this.customerState = customerState;
    this.ragContext = ragContext;
  }

  // ─── System Prompt Builder ────────────────────────────────

  private buildSystemPrompt(language: string): string {
    const config = this.config;
    const botName = this.bot.name;

    const {
      personality,
      goals,
      tone,
      sales_style,
      disallowed_topics,
      max_tokens,
      custom_instructions,
      system_prompt,
    } = config;

    const hasRAG = this.ragContext.length > 0;
    const hasMemory = this.memory.length > 0;
    const state = this.customerState;

    // If the bot has a fully custom system prompt, use it as base
    const parts: string[] = [];

    if (system_prompt) {
      parts.push(`# System Instructions\n${system_prompt}`);
    }

    // ── Identity & Personality ──
    parts.push(
      `# Identity\nYou are ${botName}, an AI sales assistant.\n\n## Personality\n${personality.description}${personality.backstory ? `\n\n${personality.backstory}` : ""}`
    );

    // ── Tone & Style ──
    parts.push(
      `## Communication Style\n- Tone: ${toneDescription(tone)}\n- Sales approach: ${salesStyleGuidance(sales_style)}`
    );

    // ── Goals ──
    if (goals && goals.length > 0) {
      parts.push(`## Goals\n${goals.map((g, i) => `${i + 1}. ${g}`).join("\n")}`);
    }

    // ── Topic Restrictions ──
    if (disallowed_topics && disallowed_topics.length > 0) {
      parts.push(
        `## Blocked Topics\nNEVER discuss: ${disallowed_topics.join(", ")}. Politely redirect if raised.`
      );
    }

    // ── Custom Instructions ──
    if (custom_instructions) {
      parts.push(`## Additional Instructions\n${custom_instructions}`);
    }

    // ── Customer Context ──
    parts.push(`## Customer Context\n${formatStateForPrompt(state)}`);

    // ── Strategic Next Action ──
    if (state?.buying_stage) {
      const nextAction = stageNextAction(state.buying_stage as BuyingStage);
      parts.push(
        `## Strategic Focus\nThe customer is in the **${state.buying_stage}** stage. ${nextAction}`
      );
    }

    if (state?.objections && (state.objections as string[]).length > 0) {
      parts.push(
        `## Handling Known Objections\nThe customer has previously raised these objections: ${(state.objections as string[]).join("; ")}.\nAddress them naturally without being defensive. Use evidence, social proof, or reframing.`
      );
    }

    if (state?.intent === "objecting") {
      parts.push(
        `## Objection Handling Mode\nThe customer is currently objecting. Acknowledge their concern empathetically, validate it, then reframe with a benefit or offer a solution.`
      );
    }

    if (state?.intent === "ready_to_buy") {
      parts.push(
        `## Conversion Mode\nThe customer shows strong buying intent. Make a clear, confident call-to-action. Remove friction. Offer to help complete the purchase now.`
      );
    }

    // ── Memory Context ──
    if (hasMemory) {
      parts.push(
        `## What You Know About This Customer\n${formatMemoryForPrompt(this.memory)}`
      );
    }

    // ── RAG Knowledge Context ──
    if (hasRAG) {
      parts.push(
        `## Relevant Knowledge Base\nUse the following retrieved information to answer the customer accurately. Do not make up facts.\n\n${formatRAGForPrompt(this.ragContext)}`
      );
    }

    // ── Response Guidelines ──
    const maxWords = max_tokens ? Math.floor(max_tokens / 2) : 300;
    parts.push(
      `## Response Guidelines\n- Keep responses concise (under ${maxWords} words unless depth is explicitly needed)\n- Never use filler phrases like "Great question!" or "Certainly!"\n- Be specific and helpful; avoid vague marketing language\n- If you don't know something, say so honestly and offer to connect them with a specialist\n- End responses with a natural, open-ended question or soft CTA when appropriate\n- Do NOT reveal that you are an AI unless directly asked`
    );

    // ── Language Instruction ──
    parts.push(
      `## Language\nRespond ONLY in ${language} (ISO 639-1 code). Match the customer's language exactly, including informal registers if they use them.`
    );

    // ── Sales Intelligence Rules ──
    parts.push(
      `## Sales Intelligence Rules\n1. Detect buying signals (price inquiries, comparison requests, timeline questions) and escalate urgency appropriately\n2. Never apply high-pressure tactics — guide, don't push\n3. Personalise every response using the customer context and memory above\n4. If the customer is frustrated, prioritise empathy over selling\n5. Qualify leads naturally by asking about use case, timeline, and budget when appropriate\n6. If a question is outside your knowledge, offer to escalate to a human agent`
    );

    return parts.join("\n\n");
  }

  // ─── Main Generate Method ─────────────────────────────────

  /**
   * Generates an AI sales response for the given user message.
   *
   * @param userMessage         - The latest customer message.
   * @param conversationHistory - Prior turns (user + assistant messages).
   * @param language            - ISO 639-1 code for the response language.
   * @returns                   Response, updated state delta, and extracted insights.
   */
  async generateResponse(
    userMessage: string,
    conversationHistory: ChatMessage[],
    language: string
  ): Promise<SalesEngineOutput> {
    const systemPrompt = this.buildSystemPrompt(language);

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: userMessage },
    ];

    const response = await createChatCompletion(messages, {
      temperature: this.config.temperature ?? RESPONSE_TEMPERATURE_DEFAULT,
      maxTokens: this.config.max_tokens ?? MAX_RESPONSE_TOKENS,
    });

    const aiResponse = response.content;
    const tokensUsed = response.usage.total_tokens;

    const insights = await extractInsights(userMessage, aiResponse, this.customerState);

    // Build state delta from insights
    // Map CustomerSentiment (5 values) -> SentimentLabel (3 values) for storage
    const sentimentMap: Record<CustomerSentiment, SentimentLabel> = {
      very_positive: "positive",
      positive: "positive",
      neutral: "neutral",
      negative: "negative",
      very_negative: "negative",
    };

    const updatedState: Partial<CustomerState> = {
      intent: insights.detectedIntent,
      sentiment: sentimentMap[insights.detectedSentiment],
      buying_stage: insights.detectedBuyingStage,
      conversion_probability: insights.conversionProbability,
      last_language: language,
      updated_at: new Date().toISOString(),
    };

    // Merge new objections/interests without duplicates
    if (insights.newObjections.length > 0) {
      const existing = (this.customerState?.objections as string[]) ?? [];
      updatedState.objections = Array.from(
        new Set([...existing, ...insights.newObjections])
      );
    }

    if (insights.newInterests.length > 0) {
      const existing = (this.customerState?.interests as string[]) ?? [];
      updatedState.interests = Array.from(
        new Set([...existing, ...insights.newInterests])
      );
    }

    return {
      response: aiResponse,
      updatedState,
      insights,
      tokensUsed,
    };
  }
}
