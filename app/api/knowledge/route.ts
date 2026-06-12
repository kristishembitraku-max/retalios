/**
 * GET  /api/knowledge  — List knowledge base items for a bot
 * POST /api/knowledge  — Create a new knowledge item (text, FAQ, URL, or PDF)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { RAGEngine } from "@/lib/rag/knowledge-retrieval";

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

    const { data: items, error: itemsError } = await adminSupabase
      .from("knowledge_base")
      .select(
        "id, bot_id, title, content, source_type, file_url, metadata, created_at, updated_at"
      )
      .eq("bot_id", botId)
      .order("created_at", { ascending: false });

    if (itemsError) {
      console.error("[GET /api/knowledge] DB error:", itemsError);
      return NextResponse.json({ error: "Failed to fetch knowledge items" }, { status: 500 });
    }

    return NextResponse.json({ items: items ?? [] }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/knowledge] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── Validation ──────────────────────────────────────────────

const CreateKnowledgeSchema = z.object({
  botId: z.string().uuid("botId must be a valid UUID"),
  title: z.string().min(1, "title is required").max(200),
  content: z.string().min(1, "content is required"),
  sourceType: z.enum(["text", "faq", "url", "pdf"]),
});

// ─── POST ────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orgId = await getUserOrgId(supabase, user.id);
    if (!orgId) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = CreateKnowledgeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const { botId, title, content, sourceType } = parsed.data;

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

    const ragEngine = new RAGEngine();

    // Ingest document into vector store — returns the created document record
    const document = await ragEngine.ingestDocument({
      botId,
      title,
      content,
      sourceType,
    });

    return NextResponse.json({ item: document }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/knowledge] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
