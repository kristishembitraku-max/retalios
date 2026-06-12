/**
 * GET /api/leads
 *
 * Returns conversations whose lead_score (conversion probability) meets or
 * exceeds the LEAD_THRESHOLD. Each record is enriched with the customer state
 * snapshot and the number of messages exchanged.
 *
 * Query params:
 *   botId      — optional UUID, scope to a single bot
 *   page       — default 1
 *   limit      — default 20, max 100
 *   sortBy     — field name (default: "lead_score")
 *   sortOrder  — "asc" | "desc" (default: "desc")
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// ─── Auth helpers ────────────────────────────────────────────

async function getAuthenticatedUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

async function getUserOrgId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<string | null> {
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("org_id")
    .eq("user_id", userId)
    .single();
  return profile?.org_id ?? null;
}

// ─── Constants ───────────────────────────────────────────────

const LEAD_THRESHOLD = 60; // lead_score is stored as 0–100 integer

const ALLOWED_SORT_FIELDS = new Set([
  "lead_score",
  "conversion_probability",
  "updated_at",
  "created_at",
  "started_at",
]);

// ─── GET ─────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orgId = await getUserOrgId(supabase, user.id);
    if (!orgId) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const botId = searchParams.get("botId");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const offset = (page - 1) * limit;

    const sortByRaw = searchParams.get("sortBy") ?? "lead_score";
    const sortBy = ALLOWED_SORT_FIELDS.has(sortByRaw) ? sortByRaw : "lead_score";
    const ascending = searchParams.get("sortOrder") === "asc";

    const adminSupabase = createAdminClient();

    // Resolve bot IDs in scope
    let botIds: string[];

    if (botId) {
      const { data: bot } = await adminSupabase
        .from("bots")
        .select("id")
        .eq("id", botId)
        .eq("org_id", orgId)
        .single();

      if (!bot) {
        return NextResponse.json({ error: "Bot not found or access denied" }, { status: 404 });
      }
      botIds = [botId];
    } else {
      const { data: bots } = await adminSupabase
        .from("bots")
        .select("id")
        .eq("org_id", orgId);

      botIds = (bots ?? []).map((b: { id: string }) => b.id);
    }

    if (botIds.length === 0) {
      return NextResponse.json({ leads: [], total: 0, page, limit, totalPages: 0 });
    }

    // Fetch high-score conversations with their customer state
    const { data: leads, error: leadsError, count } = await adminSupabase
      .from("conversations")
      .select(
        `
        id,
        bot_id,
        session_id,
        customer_email,
        customer_name,
        language,
        status,
        lead_score,
        conversion_probability,
        started_at,
        updated_at,
        created_at,
        customer_state:customer_states(*)
        `,
        { count: "exact" }
      )
      .in("bot_id", botIds)
      .gte("lead_score", LEAD_THRESHOLD)
      .order(sortBy, { ascending })
      .range(offset, offset + limit - 1);

    if (leadsError) {
      console.error("[GET /api/leads] DB error:", leadsError);
      return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
    }

    // Enrich with message count for each lead
    const enrichedLeads = await Promise.all(
      (leads ?? []).map(async (lead: Record<string, unknown>) => {
        const { count: msgCount } = await adminSupabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", lead.id as string);

        return {
          ...lead,
          messageCount: msgCount ?? 0,
          lastActivity: lead.updated_at,
        };
      })
    );

    const total = count ?? 0;

    return NextResponse.json({
      leads: enrichedLeads,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[GET /api/leads] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
