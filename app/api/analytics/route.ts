/**
 * GET /api/analytics
 *
 * Returns dashboard metrics for the authenticated user's organisation.
 * Supports filtering by botId, date range, and aggregation period.
 *
 * Query params:
 *   botId      — optional, scope metrics to a single bot
 *   startDate  — ISO timestamp (default: 30 days ago)
 *   endDate    — ISO timestamp (default: now)
 *   period     — "hour" | "day" | "week" | "month" (default: "day")
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { AnalyticsTracker } from "@/lib/analytics/analytics-tracker";

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

// ─── Validation ──────────────────────────────────────────────

const PeriodSchema = z.enum(["hour", "day", "week", "month"]);

// ─── GET ─────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orgId = await getUserOrgId(supabase, user.id);
    if (!orgId) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const botId = searchParams.get("botId") ?? undefined;
    const startDate =
      searchParams.get("startDate") ??
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = searchParams.get("endDate") ?? new Date().toISOString();

    const periodRaw = searchParams.get("period") ?? "day";
    const periodParsed = PeriodSchema.safeParse(periodRaw);
    const period: "hour" | "day" | "week" | "month" = periodParsed.success
      ? periodParsed.data
      : "day";

    const adminSupabase = createAdminClient();

    // If botId provided, verify ownership
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
    }

    const tracker = new AnalyticsTracker(adminSupabase as never);
    const metrics = await tracker.getDashboardMetrics({
      orgId,
      botId,
      startDate,
      endDate,
      period,
    });

    return NextResponse.json({ metrics }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/analytics] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
