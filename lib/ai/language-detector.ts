/**
 * Language Detector
 *
 * Detects the ISO 639-1 language code from a user message.
 * Uses a fast heuristic first pass (character-set analysis + common word
 * matching) and falls back to DeepSeek for ambiguous cases.
 * Results are cached per message hash for the lifetime of the process.
 */

import { createChatCompletion } from "@/lib/ai/deepseek";
import type { ChatMessage } from "@/types";

// ─── Types ───────────────────────────────────────────────────

export type LanguageCode = string; // ISO 639-1, e.g. "en", "fr", "sq"

// ─── In-process LRU cache ─────────────────────────────────────

const CACHE_MAX_SIZE = 1000;
const _cache = new Map<string, LanguageCode>();

function cacheGet(key: string): LanguageCode | undefined {
  return _cache.get(key);
}

function cacheSet(key: string, value: LanguageCode): void {
  if (_cache.size >= CACHE_MAX_SIZE) {
    // Evict oldest entry
    const firstKey = _cache.keys().next().value;
    if (firstKey !== undefined) _cache.delete(firstKey);
  }
  _cache.set(key, value);
}

/**
 * Simple djb2-style hash for cache keys — no crypto dependency needed.
 */
function hashMessage(text: string): string {
  let h = 5381;
  for (let i = 0; i < Math.min(text.length, 256); i++) {
    h = ((h << 5) + h) ^ text.charCodeAt(i);
    h = h >>> 0; // convert to unsigned 32-bit
  }
  return h.toString(16);
}

// ─── Heuristic Detection ─────────────────────────────────────

/**
 * Script/character-set checks. Fast, O(n) in message length.
 */
interface ScriptRule {
  code: LanguageCode;
  pattern: RegExp;
}

const SCRIPT_RULES: ScriptRule[] = [
  // Arabic script
  { code: "ar", pattern: /[؀-ۿ]/ },
  // Hebrew
  { code: "he", pattern: /[֐-׿]/ },
  // Chinese (CJK Unified Ideographs)
  { code: "zh", pattern: /[一-鿿]/ },
  // Japanese Hiragana / Katakana
  { code: "ja", pattern: /[぀-ヿ]/ },
  // Korean Hangul
  { code: "ko", pattern: /[가-힯ᄀ-ᇿ]/ },
  // Cyrillic (Russian, Bulgarian, etc.) — default to Russian
  { code: "ru", pattern: /[Ѐ-ӿ]/ },
  // Greek
  { code: "el", pattern: /[Ͱ-Ͽ]/ },
  // Thai
  { code: "th", pattern: /[฀-๿]/ },
];

/**
 * Common high-frequency word lists for Latin-script languages.
 * Words are lowercased and include leading/trailing word boundaries via regex.
 */
interface WordRule {
  code: LanguageCode;
  words: string[];
  minMatches: number;
}

const WORD_RULES: WordRule[] = [
  {
    code: "sq",
    words: ["është", "dhe", "që", "me", "në", "për", "si", "ka", "nga", "jam", "une", "ju", "ne"],
    minMatches: 1,
  },
  {
    code: "fr",
    words: ["je", "tu", "il", "nous", "vous", "ils", "est", "les", "des", "une", "que", "pas", "avec", "pour", "bonjour", "merci"],
    minMatches: 2,
  },
  {
    code: "de",
    words: ["ich", "sie", "ist", "das", "die", "der", "und", "mit", "für", "nicht", "hallo", "danke", "bitte", "haben", "sein"],
    minMatches: 2,
  },
  {
    code: "es",
    words: ["yo", "tu", "el", "la", "los", "las", "es", "son", "con", "para", "que", "hola", "gracias", "como", "por"],
    minMatches: 2,
  },
  {
    code: "it",
    words: ["io", "tu", "lui", "lei", "sono", "siamo", "con", "per", "che", "ciao", "grazie", "prego", "come", "non"],
    minMatches: 2,
  },
  {
    code: "pt",
    words: ["eu", "tu", "ele", "ela", "nos", "com", "para", "que", "obrigado", "olá", "como", "não", "sim"],
    minMatches: 2,
  },
  {
    code: "nl",
    words: ["ik", "jij", "hij", "wij", "jullie", "zijn", "hebben", "met", "voor", "hallo", "dank", "niet", "het"],
    minMatches: 2,
  },
  {
    code: "pl",
    words: ["ja", "ty", "on", "ona", "my", "wy", "nie", "tak", "jest", "się", "jak", "co", "gdzie"],
    minMatches: 2,
  },
  {
    code: "tr",
    words: ["ben", "sen", "o", "biz", "siz", "merhaba", "teşekkür", "evet", "hayır", "var", "yok", "bir", "ile"],
    minMatches: 1,
  },
  {
    code: "en",
    words: ["i", "you", "he", "she", "we", "they", "the", "is", "are", "was", "have", "and", "for", "hello", "hi", "thanks", "what", "how"],
    minMatches: 2,
  },
];

/**
 * Attempts to detect language using script rules and word frequency.
 * Returns null if confidence is insufficient.
 */
function heuristicDetect(text: string): LanguageCode | null {
  const lower = text.toLowerCase();

  // 1. Script rules — deterministic for non-Latin scripts
  for (const rule of SCRIPT_RULES) {
    if (rule.pattern.test(lower)) return rule.code;
  }

  // 2. Word frequency matching for Latin-script languages
  const words = lower.match(/\b\w+\b/g) ?? [];
  const wordSet = new Set(words);

  const scores: Array<{ code: LanguageCode; score: number }> = [];

  for (const rule of WORD_RULES) {
    let matches = 0;
    for (const w of rule.words) {
      if (wordSet.has(w)) matches++;
    }
    if (matches >= rule.minMatches) {
      scores.push({ code: rule.code, score: matches });
    }
  }

  if (scores.length === 0) return null;

  // Sort by score descending; if top two are tied and different, fall back to DeepSeek
  scores.sort((a, b) => b.score - a.score);

  if (scores.length >= 2 && scores[0].score === scores[1].score) {
    return null; // ambiguous — let DeepSeek decide
  }

  return scores[0].code;
}

// ─── DeepSeek Fallback ───────────────────────────────────────

/**
 * Uses DeepSeek to identify the language when heuristics are inconclusive.
 */
async function deepseekDetect(text: string): Promise<LanguageCode> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You are a language detection expert. Given a text snippet, respond with ONLY the ISO 639-1 two-letter language code (e.g. 'en', 'fr', 'de', 'sq', 'it', 'es', 'pt', 'ar', 'zh', 'ja', 'ko', 'ru'). No explanation, no punctuation, just the code.",
    },
    {
      role: "user",
      content: `Detect the language of this text:\n\n"${text.slice(0, 500)}"`,
    },
  ];

  try {
    const result = await createChatCompletion(messages, {
      temperature: 0,
      maxTokens: 10,
    });

    const code = result.content.trim().toLowerCase().slice(0, 2);

    // Validate it looks like an ISO 639-1 code
    if (/^[a-z]{2}$/.test(code)) return code;

    return "en"; // ultimate fallback
  } catch {
    return "en";
  }
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Detects the ISO 639-1 language code of the given message.
 *
 * Uses fast heuristics for common cases and DeepSeek for ambiguous inputs.
 * Results are memoised for the lifetime of the process.
 *
 * @param message - The user message to analyse.
 * @returns         ISO 639-1 language code (e.g. "en", "fr", "sq").
 */
export async function detectLanguage(message: string): Promise<LanguageCode> {
  if (!message.trim()) return "en";

  const key = hashMessage(message);
  const cached = cacheGet(key);
  if (cached) return cached;

  // Heuristic fast path
  const heuristic = heuristicDetect(message);
  if (heuristic) {
    cacheSet(key, heuristic);
    return heuristic;
  }

  // DeepSeek fallback for ambiguous cases
  const detected = await deepseekDetect(message);
  cacheSet(key, detected);
  return detected;
}

/**
 * Detects language using only heuristics (no API call).
 * Returns "en" if the heuristic is inconclusive.
 *
 * @param message - The user message to analyse.
 * @returns         ISO 639-1 language code or "en" as fallback.
 */
export function detectLanguageSync(message: string): LanguageCode {
  if (!message.trim()) return "en";
  return heuristicDetect(message) ?? "en";
}

/**
 * Clears the internal language detection cache.
 * Useful for testing or memory management.
 */
export function clearLanguageCache(): void {
  _cache.clear();
}
