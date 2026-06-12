/**
 * DeepSeek API Client
 *
 * OpenAI-compatible client pointed at DeepSeek's inference endpoint.
 * Implements chat completions, streaming, and text embeddings with
 * automatic retry / exponential backoff on rate-limit and server errors.
 */

import OpenAI from "openai";
import type {
  ChatMessage,
  ChatCompletionOptions,
  ChatCompletionResponse,
  EmbeddingResponse,
} from "@/types";

// ─── Constants ───────────────────────────────────────────────

const DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const DEEPSEEK_CHAT_MODEL = "deepseek-chat";
const DEEPSEEK_EMBEDDING_MODEL = "deepseek-chat"; // DeepSeek uses the chat model for embeddings via their /embeddings endpoint

const DEFAULT_MAX_TOKENS = 1024;
const DEFAULT_TEMPERATURE = 0.7;

/** Maximum number of retry attempts for retryable errors. */
const MAX_RETRIES = 4;
/** Base delay in milliseconds for exponential backoff. */
const RETRY_BASE_DELAY_MS = 500;

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Returns true for HTTP status codes that should be retried:
 * 429 (rate limit), 500, 502, 503, 504 (transient server errors).
 */
function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

/**
 * Waits for `ms` milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculates jittered exponential backoff delay.
 * delay = base * 2^attempt + random jitter (0–200 ms)
 */
function backoffDelay(attempt: number): number {
  const exponential = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
  const jitter = Math.random() * 200;
  return exponential + jitter;
}

// ─── Client ──────────────────────────────────────────────────

/**
 * Lazily initialised singleton OpenAI-SDK instance pointed at DeepSeek.
 */
let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error("DEEPSEEK_API_KEY environment variable is not set.");
    }
    _client = new OpenAI({
      apiKey,
      baseURL: DEEPSEEK_BASE_URL,
      maxRetries: 0, // We handle retries manually for full control.
      timeout: 60_000,
    });
  }
  return _client;
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Sends a chat completion request to DeepSeek with automatic retry
 * on rate-limit (429) and transient server errors (5xx).
 *
 * @param messages     - Ordered conversation messages.
 * @param options      - Optional generation parameters.
 * @returns            Resolved {@link ChatCompletionResponse}.
 */
export async function createChatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {}
): Promise<ChatCompletionResponse> {
  const client = getClient();

  const {
    temperature = DEFAULT_TEMPERATURE,
    maxTokens = DEFAULT_MAX_TOKENS,
    topP,
    frequencyPenalty,
    presencePenalty,
    stop,
  } = options;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: DEEPSEEK_CHAT_MODEL,
        messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
        temperature,
        max_tokens: maxTokens,
        ...(topP !== undefined && { top_p: topP }),
        ...(frequencyPenalty !== undefined && { frequency_penalty: frequencyPenalty }),
        ...(presencePenalty !== undefined && { presence_penalty: presencePenalty }),
        ...(stop !== undefined && { stop }),
        stream: false,
      });

      const choice = response.choices[0];
      return {
        id: response.id,
        content: choice?.message?.content ?? "",
        model: response.model,
        usage: {
          prompt_tokens: response.usage?.prompt_tokens ?? 0,
          completion_tokens: response.usage?.completion_tokens ?? 0,
          total_tokens: response.usage?.total_tokens ?? 0,
        },
        finish_reason: (choice?.finish_reason as ChatCompletionResponse["finish_reason"]) ?? null,
      };
    } catch (error) {
      const isLastAttempt = attempt === MAX_RETRIES;

      if (error instanceof OpenAI.APIError) {
        if (isRetryableStatus(error.status) && !isLastAttempt) {
          // Honour Retry-After header when present (rate-limit responses).
          const retryAfterHeader = error.headers?.["retry-after"];
          const retryAfterMs = retryAfterHeader
            ? parseInt(retryAfterHeader, 10) * 1000
            : backoffDelay(attempt);

          await sleep(retryAfterMs);
          continue;
        }
        throw new DeepSeekError(
          `DeepSeek API error (${error.status}): ${error.message}`,
          error.status,
          error
        );
      }

      if (!isLastAttempt) {
        await sleep(backoffDelay(attempt));
        continue;
      }

      throw error;
    }
  }

  // TypeScript requires a return path; the loop always throws or returns.
  throw new DeepSeekError("Exceeded maximum retry attempts.", 0);
}

/**
 * Streams a chat completion from DeepSeek, yielding text delta chunks.
 *
 * @param messages  - Ordered conversation messages.
 * @param options   - Optional generation parameters.
 * @yields          Text deltas as they arrive.
 */
export async function* streamChatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {}
): AsyncGenerator<string, void, unknown> {
  const client = getClient();

  const {
    temperature = DEFAULT_TEMPERATURE,
    maxTokens = DEFAULT_MAX_TOKENS,
    topP,
    frequencyPenalty,
    presencePenalty,
    stop,
  } = options;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const stream = await client.chat.completions.create({
        model: DEEPSEEK_CHAT_MODEL,
        messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
        temperature,
        max_tokens: maxTokens,
        ...(topP !== undefined && { top_p: topP }),
        ...(frequencyPenalty !== undefined && { frequency_penalty: frequencyPenalty }),
        ...(presencePenalty !== undefined && { presence_penalty: presencePenalty }),
        ...(stop !== undefined && { stop }),
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          yield delta;
        }
      }
      return;
    } catch (error) {
      const isLastAttempt = attempt === MAX_RETRIES;

      if (error instanceof OpenAI.APIError) {
        if (isRetryableStatus(error.status) && !isLastAttempt) {
          const retryAfterHeader = error.headers?.["retry-after"];
          const retryAfterMs = retryAfterHeader
            ? parseInt(retryAfterHeader, 10) * 1000
            : backoffDelay(attempt);
          await sleep(retryAfterMs);
          continue;
        }
        throw new DeepSeekError(
          `DeepSeek stream error (${error.status}): ${error.message}`,
          error.status,
          error
        );
      }

      if (!isLastAttempt) {
        await sleep(backoffDelay(attempt));
        continue;
      }

      throw error;
    }
  }
}

/**
 * Creates a text embedding using DeepSeek's embeddings endpoint.
 *
 * @param text  - Input text to embed (will be trimmed/truncated to 8192 chars).
 * @returns     {@link EmbeddingResponse} containing the float embedding vector.
 */
export async function createEmbedding(text: string): Promise<EmbeddingResponse> {
  const client = getClient();

  // Truncate to a safe token budget; rough proxy is character count.
  const safeText = text.trim().slice(0, 8192);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.embeddings.create({
        model: DEEPSEEK_EMBEDDING_MODEL,
        input: safeText,
      });

      const embeddingData = response.data[0];
      if (!embeddingData) {
        throw new DeepSeekError("No embedding returned by DeepSeek API.", 0);
      }

      return {
        embedding: embeddingData.embedding,
        model: response.model,
        usage: {
          prompt_tokens: response.usage?.prompt_tokens ?? 0,
          total_tokens: response.usage?.total_tokens ?? 0,
        },
      };
    } catch (error) {
      const isLastAttempt = attempt === MAX_RETRIES;

      if (error instanceof OpenAI.APIError) {
        if (isRetryableStatus(error.status) && !isLastAttempt) {
          const retryAfterHeader = error.headers?.["retry-after"];
          const retryAfterMs = retryAfterHeader
            ? parseInt(retryAfterHeader, 10) * 1000
            : backoffDelay(attempt);
          await sleep(retryAfterMs);
          continue;
        }
        throw new DeepSeekError(
          `DeepSeek embedding error (${error.status}): ${error.message}`,
          error.status,
          error
        );
      }

      if (!isLastAttempt) {
        await sleep(backoffDelay(attempt));
        continue;
      }

      throw error;
    }
  }

  throw new DeepSeekError("Exceeded maximum retry attempts for embedding.", 0);
}

// ─── Error class ─────────────────────────────────────────────

export class DeepSeekError extends Error {
  public readonly status: number;
  public readonly cause?: unknown;

  constructor(message: string, status: number, cause?: unknown) {
    super(message);
    this.name = "DeepSeekError";
    this.status = status;
    this.cause = cause;
  }
}
