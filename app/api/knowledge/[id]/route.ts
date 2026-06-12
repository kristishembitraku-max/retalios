/**
 * DELETE /api/knowledge/[id]  — Remove a knowledge item and its vector embeddings
 */

import { NextRequest, NextResponse } from "next/server";
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

    // Fetch item and verify ownership through the bot → org chain
    const { data: item, error: itemError } = await adminSupabase
      .from("knowledge_base")
      .select(
        `
        id,
        bot_id,
        bots!inner(org_id)
        `
      )
      .eq("id", id)
      .eq("bots.org_id", orgId)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: "Knowledge item not found" }, { status: 404 });
    }

    // Hard-delete the knowledge_base record
    const { error: deleteError } = await adminSupabase
      .from("knowledge_base")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("[DELETE /api/knowledge/[id]] DB error:", deleteError);
      return NextResponse.json({ error: "Failed to delete knowledge item" }, { status: 500 });
    }

    // Best-effort cleanup of any associated vector chunks
    const ragEngine = new RAGEngine();
    await ragEngine.deleteDocument(id).catch((err: unknown) => {
      console.error("[DELETE /api/knowledge/[id]] RAG chunk cleanup error:", err);
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[DELETE /api/knowledge/[id]] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
