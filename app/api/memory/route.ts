/**
 * GET /api/memory
 *
 * Returns memory entries associated with a bot, grouped by type. Optionally
 * filtered by sessionId and/or customerEmail. Includes a brief text summary
 * of the grouped entries.
 *
 * Query params:
 *   botId         — required, UUID
 *   sessionId     — optional, string
 *   customerEmail — optional, string
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { MemoryType } from "@/types";

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
    const sessionId = searchParams.get("sessionId") ?? undefined;
    const customerEmail = searchParams.get("customerEmail") ?? undefined;

    if (!botId) {
      return NextResponse.json({ error: "botId query parameter is required" }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // Verify bot belongs to org
    const { data: bot } = await adminSupabase
      .from("bots")
      .select("id")
      .eq("id", botId)
      .eq("org_id", orgId)
      .single();

    if (!bot) {
      return NextResponse.json({ error: "Bot not found or access denied" }, { status: 404 });
    }

    // Build memory query
    let query = adminSupabase
      .from("memory")
      .select("id, bot_id, session_id, customer_email, type, key, value, created_at, updated_at")
      .eq("bot_id", botId)
      .order("updated_at", { ascending: false });

    if (sessionId) {
      query = query.eq("session_id", sessionId);
    }
    if (customerEmail) {
      query = query.eq("customer_email", customerEmail);
    }

    const { data: memories, error: memoryError } = await query;

    if (memoryError) {
      console.error("[GET /api/memory] DB error:", memoryError);
      return NextResponse.json({ error: "Failed to fetch memory entries" }, { status: 500 });
    }

    const allMemories = memories ?? [];

    // Group by type
    const grouped: Partial<Record<MemoryType, typeof allMemories>> = {};
    for (const entry of allMemories) {
      const t = entry.type as MemoryType;
      if (!grouped[t]) grouped[t] = [];
      grouped[t]!.push(entry);
    }

    // Build a brief text summary
    const summaryParts: string[] = [];
    for (const [type, entries] of Object.entries(grouped)) {
      if (entries && entries.length > 0) {
        const preview = entries
          .slice(0, 3)
          .map((e) => `${e.key}: ${e.value}`)
          .join("; ");
        summaryParts.push(`${entries.length} ${type}(s) — ${preview}`);
      }
    }
    const summary =
      summaryParts.length > 0
        ? summaryParts.join(" | ")
        : "No memory entries found for this query.";

    return NextResponse.json(
      { memories: grouped, summary },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/memory] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
