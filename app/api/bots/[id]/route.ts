/**
 * GET    /api/bots/[id]  — Return a single bot with full config
 * PUT    /api/bots/[id]  — Update bot config
 * DELETE /api/bots/[id]  — Soft-delete bot (set is_active = false)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orgId = await getUserOrgId(supabase, user.id);
    if (!orgId) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

    const adminSupabase = createAdminClient();
    const { data: bot, error } = await adminSupabase
      .from("bots")
      .select("*")
      .eq("id", id)
      .eq("org_id", orgId)
      .single();

    if (error || !bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    return NextResponse.json({ bot }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/bots/[id]] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── Validation ──────────────────────────────────────────────

const UpdateBotSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  personality: z.string().min(1).max(2000).optional(),
  goals: z.array(z.string()).min(1).max(10).optional(),
  tone: z.enum(["professional", "friendly", "casual", "formal", "empathetic"]).optional(),
  sales_style: z.enum(["consultative", "direct", "educational", "relationship"]).optional(),
  language: z.string().optional(),
  welcome_message: z.string().max(500).optional(),
  fallback_message: z.string().max(500).optional(),
  allowed_topics: z.array(z.string()).optional(),
  blocked_topics: z.array(z.string()).optional(),
  max_response_length: z.number().int().min(100).max(4000).optional(),
  enable_memory: z.boolean().optional(),
  enable_rag: z.boolean().optional(),
  enable_analytics: z.boolean().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  config: z
    .object({
      greeting: z.string().max(500).optional(),
      primaryColor: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .optional(),
      secondaryColor: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .optional(),
      position: z.enum(["bottom-right", "bottom-left"]).optional(),
      collectEmail: z.boolean().optional(),
      collectName: z.boolean().optional(),
      showPoweredBy: z.boolean().optional(),
    })
    .optional(),
});

// ─── PUT ─────────────────────────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orgId = await getUserOrgId(supabase, user.id);
    if (!orgId) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

    const adminSupabase = createAdminClient();

    // Ownership check
    const { data: existingBot } = await adminSupabase
      .from("bots")
      .select("id, config")
      .eq("id", id)
      .eq("org_id", orgId)
      .single();

    if (!existingBot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = UpdateBotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const { config: configPatch, ...rest } = parsed.data;

    const updates: Record<string, unknown> = {
      ...rest,
      updated_at: new Date().toISOString(),
    };

    // Merge config patch with existing config
    if (configPatch) {
      updates.config = { ...(existingBot.config ?? {}), ...configPatch };
    }

    const { data: updatedBot, error: updateError } = await adminSupabase
      .from("bots")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) {
      console.error("[PUT /api/bots/[id]] Error:", updateError);
      return NextResponse.json({ error: "Failed to update bot" }, { status: 500 });
    }

    return NextResponse.json({ bot: updatedBot }, { status: 200 });
  } catch (error) {
    console.error("[PUT /api/bots/[id]] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE ──────────────────────────────────────────────────

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orgId = await getUserOrgId(supabase, user.id);
    if (!orgId) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

    const adminSupabase = createAdminClient();

    // Ownership check
    const { data: existingBot } = await adminSupabase
      .from("bots")
      .select("id")
      .eq("id", id)
      .eq("org_id", orgId)
      .single();

    if (!existingBot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    // Soft-delete: set is_active = false
    const { error: deleteError } = await adminSupabase
      .from("bots")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (deleteError) {
      console.error("[DELETE /api/bots/[id]] Error:", deleteError);
      return NextResponse.json({ error: "Failed to deactivate bot" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Bot deactivated successfully" }, { status: 200 });
  } catch (error) {
    console.error("[DELETE /api/bots/[id]] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
