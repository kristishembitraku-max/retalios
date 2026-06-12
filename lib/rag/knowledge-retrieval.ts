/**
 * RAG Engine — Knowledge Retrieval
 *
 * Retrieval-Augmented Generation engine for Fluence AI.
 * Ingests documents by chunking them into ~500-token pieces with overlap,
 * embedding each chunk via DeepSeek, and storing them in Supabase.
 * At query time, embeds the user query and performs a pgvector similarity
 * search to surface the most relevant chunks.
 *
 * DB table: `knowledge_base`
 * RPC function: `match_knowledge_base`
 */

import { createAdminClient } from "@/lib/supabase/server";
import { createEmbedding } from "@/lib/ai/deepseek";
import type {
  KnowledgeBase,
  KnowledgeSourceType,
  IngestDocumentOptions,
  RAGSearchResult,
} from "@/types";
import type { Json } from "@/types/database";

// ─── Constants ───────────────────────────────────────────────

/** Approximate character count per token (conservative estimate). */
const CHARS_PER_TOKEN = 4;
/** Target chunk size in tokens. */
const CHUNK_TOKEN_SIZE = 500;
/** Overlap in tokens between consecutive chunks. */
const CHUNK_OVERLAP_TOKENS = 80;

const CHUNK_CHAR_SIZE = CHUNK_TOKEN_SIZE * CHARS_PER_TOKEN; // 2000 chars
const OVERLAP_CHAR_SIZE = CHUNK_OVERLAP_TOKENS * CHARS_PER_TOKEN; // 320 chars

/** Default number of chunks to return from vector search. */
const DEFAULT_SEARCH_LIMIT = 5;

/**
 * Patterns that indicate a message likely needs a knowledge base lookup.
 */
const PRODUCT_QUESTION_PATTERNS = [
  /\b(what|how|why|when|where|which|who|does|is|are|can|could|would|tell me|explain|describe)\b/i,
  /\b(price|cost|fee|plan|feature|benefit|difference|compare|versus|vs\.|work|support|include|offer|available|integrate)\b/i,
  /\b(product|service|solution|platform|tool|software|app|api|subscription|tier|package)\b/i,
  /\?$/,
];

// ─── Text Chunking ───────────────────────────────────────────

/**
 * Splits text into overlapping chunks of approximately CHUNK_CHAR_SIZE
 * characters, with OVERLAP_CHAR_SIZE overlap between adjacent chunks.
 * Prefers paragraph and sentence boundaries for natural splits.
 *
 * @param text - Full document text to chunk.
 * @returns    Array of text chunks.
 */
function chunkText(text: string): string[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();

  if (normalized.length <= CHUNK_CHAR_SIZE) return [normalized];

  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    let end = start + CHUNK_CHAR_SIZE;

    if (end < normalized.length) {
      // Prefer paragraph boundary
      const paragraphBreak = normalized.lastIndexOf("\n\n", end);
      if (paragraphBreak > start + CHUNK_CHAR_SIZE * 0.5) {
        end = paragraphBreak;
      } else {
        // Fall back to sentence boundary
        const sentenceBreak = Math.max(
          normalized.lastIndexOf(". ", end),
          normalized.lastIndexOf("! ", end),
          normalized.lastIndexOf("? ", end),
          normalized.lastIndexOf("\n", end)
        );
        if (sentenceBreak > start + CHUNK_CHAR_SIZE * 0.5) {
          end = sentenceBreak + 1;
        }
      }
    }

    const chunk = normalized.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    // Advance with overlap
    const advance = end - start - OVERLAP_CHAR_SIZE;
    if (advance <= 0) break; // safety: prevent infinite loop
    start = start + advance;
  }

  return chunks;
}

// ─── RAGEngine Class ─────────────────────────────────────────

export class RAGEngine {
  private get db() {
    return createAdminClient();
  }

  // ─── Ingestion ───────────────────────────────────────────

  /**
   * Ingests a document into the knowledge base.
   *
   * Steps:
   * 1. Splits content into overlapping chunks.
   * 2. Embeds each chunk via DeepSeek.
   * 3. Stores all chunks in `knowledge_base` with embeddings.
   *
   * @param options - Document ingestion options.
   * @returns       Array of created KnowledgeBase rows.
   */
  async ingestDocument(options: IngestDocumentOptions): Promise<KnowledgeBase[]> {
    const { botId, title, content, sourceType, fileUrl, metadata } = options;
    const supabase = this.db;
    const now = new Date().toISOString();

    const chunks = chunkText(content);

    if (chunks.length === 0) {
      throw new Error("RAGEngine.ingestDocument — document produced no text chunks.");
    }

    const insertedRows: KnowledgeBase[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunkContent = chunks[i];

      let embeddingStr: string | null = null;
      try {
        const embResult = await createEmbedding(`${title}\n\n${chunkContent}`);
        embeddingStr = `[${embResult.embedding.join(",")}]`;
      } catch (err) {
        console.warn(
          `RAGEngine: Failed to embed chunk ${i} of document "${title}". Storing without embedding.`,
          err
        );
      }

      const chunkMeta = {
        ...(typeof metadata === "object" && metadata !== null ? metadata : {}),
        chunk_index: i,
        total_chunks: chunks.length,
        ...(fileUrl ? { source_url: fileUrl } : {}),
      };

      const { data, error } = await supabase
        .from("knowledge_base")
        .insert({
          bot_id: botId,
          title: chunks.length > 1 ? `${title} (${i + 1}/${chunks.length})` : title,
          content: chunkContent,
          source_type: sourceType as "manual" | "file" | "url" | "faq" | "pdf" | "product",
          file_url: fileUrl ?? null,
          embedding: embeddingStr,
          metadata: chunkMeta as Json,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (error) {
        // Non-fatal for individual chunks — log and continue
        console.error(
          `RAGEngine: Failed to store chunk ${i} of "${title}": ${error.message}`
        );
        continue;
      }

      insertedRows.push({ ...(data as KnowledgeBase), embedding: null });
    }

    if (insertedRows.length === 0) {
      throw new Error(
        `RAGEngine.ingestDocument — all chunks failed to store for document "${title}".`
      );
    }

    return insertedRows;
  }

  // ─── Search ──────────────────────────────────────────────

  /**
   * Performs a semantic search over the knowledge base for a given bot.
   *
   * Embeds the query, then calls the `match_knowledge_base` Supabase
   * RPC function (pgvector cosine similarity).
   *
   * @param botId  - Bot identifier to scope the search.
   * @param query  - Natural-language query string.
   * @param limit  - Maximum chunks to return.
   * @returns      RAGSearchResult with chunks and the query embedding.
   */
  async search(
    botId: string,
    query: string,
    limit: number = DEFAULT_SEARCH_LIMIT
  ): Promise<RAGSearchResult> {
    const embResult = await createEmbedding(query);
    const queryEmbedding = embResult.embedding;
    const embeddingStr = `[${queryEmbedding.join(",")}]`;

    const supabase = this.db;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("match_knowledge_base", {
      query_embedding: embeddingStr,
      bot_id: botId,
      match_count: limit,
    });

    if (error) {
      throw new Error(`RAGEngine.search failed: ${error.message}`);
    }

    const chunks: KnowledgeBase[] = (data ?? []).map(
      (row: Record<string, unknown>) =>
        ({
          id: row.id as string,
          bot_id: row.bot_id as string,
          title: row.title as string,
          content: row.content as string,
          source_type: row.source_type as KnowledgeSourceType,
          file_url: null,
          embedding: null,
          metadata: (row.metadata as Record<string, unknown>) ?? {},
          created_at: "",
          updated_at: "",
          // Attach similarity score in metadata for context building
          ...(row.similarity !== undefined
            ? { _similarity: row.similarity }
            : {}),
        } as KnowledgeBase)
    );

    return { chunks, queryEmbedding };
  }

  // ─── Context Builder ─────────────────────────────────────

  /**
   * Formats an array of KnowledgeBase chunks into a prompt-ready context
   * string for injection into AI system prompts.
   *
   * @param chunks - Retrieved knowledge chunks.
   * @returns      Formatted context block, or empty string if no chunks.
   */
  buildContext(chunks: KnowledgeBase[]): string {
    if (!chunks.length) return "";

    const lines: string[] = [
      "The following information is retrieved from the knowledge base. Use it to answer the customer accurately.",
      "",
    ];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      // similarity may be stored in a custom _similarity field
      const sim = (chunk as KnowledgeBase & { _similarity?: number })._similarity;
      const simStr =
        sim !== undefined ? ` (relevance: ${(sim * 100).toFixed(0)}%)` : "";

      lines.push(`[Source ${i + 1}: ${chunk.title}${simStr}]`);
      lines.push(chunk.content);
      lines.push("");
    }

    return lines.join("\n").trim();
  }

  // ─── Intent Detection ────────────────────────────────────

  /**
   * Determines whether a user message is likely asking a product or
   * knowledge question that warrants a RAG lookup.
   *
   * Uses pattern matching for performance — no API call required.
   *
   * @param message - The user message.
   * @returns       true if RAG retrieval is recommended.
   */
  shouldUseRAG(message: string): boolean {
    if (!message.trim()) return false;

    // Very short messages (greetings, ack) rarely need RAG
    if (message.trim().split(/\s+/).length < 3) return false;

    let matchCount = 0;
    for (const pattern of PRODUCT_QUESTION_PATTERNS) {
      if (pattern.test(message)) matchCount++;
    }

    return matchCount >= 2;
  }

  // ─── Utility ─────────────────────────────────────────────

  /**
   * Deletes all knowledge base entries for a given bot.
   *
   * @param botId - Bot identifier.
   */
  async deleteAllForBot(botId: string): Promise<void> {
    const supabase = this.db;

    const { error } = await supabase
      .from("knowledge_base")
      .delete()
      .eq("bot_id", botId);

    if (error) {
      throw new Error(`RAGEngine.deleteAllForBot failed: ${error.message}`);
    }
  }

  /**
   * Lists all knowledge base entries for a given bot (without embeddings).
   *
   * @param botId - Bot identifier.
   * @returns     Array of KnowledgeBase records.
   */
  async listForBot(botId: string): Promise<KnowledgeBase[]> {
    const supabase = this.db;

    const { data, error } = await supabase
      .from("knowledge_base")
      .select("id, bot_id, title, content, source_type, file_url, metadata, created_at, updated_at")
      .eq("bot_id", botId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`RAGEngine.listForBot failed: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      ...(row as KnowledgeBase),
      embedding: null,
    }));
  }
}
