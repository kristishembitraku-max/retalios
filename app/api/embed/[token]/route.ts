/**
 * GET /api/embed/[token]
 *
 * Public endpoint — no authentication required.
 * Returns the bot's public-facing configuration from its embed token.
 * Used by the embeddable chat widget to initialise itself.
 *
 * Only safe, non-sensitive fields are returned (never org_id, embed_token, etc.).
 * Responses are cached for 5 minutes via Cache-Control.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// ─── CORS (widget runs on any domain) ────────────────────────

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// ─── GET ─────────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token || token.trim().length === 0) {
      return NextResponse.json(
        { error: "Embed token is required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const adminSupabase = createAdminClient();

    const { data: bot, error } = await adminSupabase
      .from("bots")
      .select("id, name, config, is_active")
      .eq("embed_token", token)
      .eq("is_active", true)
      .single();

    if (error || !bot) {
      return NextResponse.json(
        { error: "Bot not found or inactive" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    // Expose only public-safe fields — never leak embed_token, org_id, etc.
    const publicConfig = {
      botId: bot.id,
      name: bot.name,
      greeting: bot.config?.greeting ?? "Hello! How can I help you today?",
      primaryColor: bot.config?.primaryColor ?? "#6366f1",
      secondaryColor: bot.config?.secondaryColor ?? "#ffffff",
      position: bot.config?.position ?? "bottom-right",
      collectEmail: bot.config?.collectEmail ?? true,
      collectName: bot.config?.collectName ?? true,
      showPoweredBy: bot.config?.showPoweredBy ?? true,
      language: bot.config?.language ?? "auto",
    };

    return NextResponse.json(
      { config: publicConfig },
      {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("[GET /api/embed/[token]] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
