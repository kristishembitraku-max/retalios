/**
 * GET /api/conversations
 *
 * Returns paginated conversations belonging to the authenticated user's
 * organisation's bots. Supports filtering by botId, date range, and a
 * keyword search against customer email / name.
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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const offset = (page - 1) * limit;

    const adminSupabase = createAdminClient();

    // ── Resolve the set of bot IDs the user may access ────────
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
      return NextResponse.json({ conversations: [], total: 0, page, limit, totalPages: 0 });
    }

    // ── Build query ───────────────────────────────────────────
    let query = adminSupabase
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
        messages(id, role, content, created_at)
        `,
        { count: "exact" }
      )
      .in("bot_id", botIds)
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (startDate) query = query.gte("started_at", startDate);
    if (endDate) query = query.lte("started_at", endDate);
    if (search) {
      query = query.or(
        `customer_email.ilike.%${search}%,customer_name.ilike.%${search}%`
      );
    }

    const { data: conversations, error: convError, count } = await query;

    if (convError) {
      console.error("[GET /api/conversations] DB error:", convError);
      return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
    }

    // ── Enrich with last message + message count ──────────────
    const formatted = (conversations ?? []).map((conv: Record<string, unknown>) => {
      const msgs = (conv.messages as Array<{ role: string; content: string; created_at: string }>) ?? [];
      const sorted = [...msgs].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const lastMessage = sorted[0]
        ? { content: sorted[0].content, role: sorted[0].role, createdAt: sorted[0].created_at }
        : null;

      return {
        ...conv,
        messages: undefined,
        lastMessage,
        messageCount: msgs.length,
      };
    });

    const total = count ?? 0;

    return NextResponse.json({
      conversations: formatted,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[GET /api/conversations] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
