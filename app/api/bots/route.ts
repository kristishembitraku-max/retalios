/**
 * GET  /api/bots  — List all bots for the authenticated user's organisation
 * POST /api/bots  — Create a new bot
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// ─── Validation ──────────────────────────────────────────────

const CreateBotSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  personality: z.string().min(1).max(2000),
  goals: z.array(z.string()).min(1).max(10),
  tone: z.enum(["professional", "friendly", "casual", "formal", "empathetic"]),
  sales_style: z.enum(["consultative", "direct", "educational", "relationship"]),
  language: z.string().default("en"),
  welcome_message: z.string().max(500).optional(),
  fallback_message: z.string().max(500).optional(),
  allowed_topics: z.array(z.string()).optional(),
  blocked_topics: z.array(z.string()).optional(),
  max_response_length: z.number().int().min(100).max(4000).optional(),
  enable_memory: z.boolean().default(true),
  enable_rag: z.boolean().default(true),
  enable_analytics: z.boolean().default(true),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
});

// ─── GET ─────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Resolve org for this user
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("org_id")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "User profile not found" }, { status: 404 });
  }

  const adminSupabase = createAdminClient();

  // Fetch bots with aggregated stats via a join
  const { data: bots, error: botsError } = await adminSupabase
    .from("bots")
    .select(
      `
      *,
      conversations:conversations(count),
      leads:conversations(count)
      `
    )
    .eq("org_id", profile.org_id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (botsError) {
    console.error("[GET /api/bots] Error fetching bots:", botsError);
    return NextResponse.json({ error: "Failed to fetch bots" }, { status: 500 });
  }

  // Enrich with per-bot conversation + lead counts
  const botsWithStats = await Promise.all(
    (bots ?? []).map(async (bot) => {
      const [{ count: convCount }, { count: leadCount }] = await Promise.all([
        adminSupabase
          .from("conversations")
          .select("*", { count: "exact", head: true })
          .eq("bot_id", bot.id),
        adminSupabase
          .from("conversations")
          .select("*", { count: "exact", head: true })
          .eq("bot_id", bot.id)
          .gte("lead_score", 60),
      ]);

      return {
        ...bot,
        stats: {
          conversation_count: convCount ?? 0,
          lead_count: leadCount ?? 0,
        },
      };
    })
  );

  return NextResponse.json({ bots: botsWithStats }, { status: 200 });
}

// ─── POST ────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CreateBotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("org_id")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "User profile not found" }, { status: 404 });
  }

  const adminSupabase = createAdminClient();

  const embedToken = uuidv4();
  const now = new Date().toISOString();

  const { data: newBot, error: createError } = await adminSupabase
    .from("bots")
    .insert({
      id: uuidv4(),
      org_id: profile.org_id,
      embed_token: embedToken,
      is_active: true,
      created_at: now,
      updated_at: now,
      ...parsed.data,
    })
    .select("*")
    .single();

  if (createError || !newBot) {
    console.error("[POST /api/bots] Error creating bot:", createError);
    return NextResponse.json({ error: "Failed to create bot" }, { status: 500 });
  }

  return NextResponse.json({ bot: newBot }, { status: 201 });
}
