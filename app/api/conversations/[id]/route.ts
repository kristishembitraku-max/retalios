/**
 * GET /api/conversations/[id]
 *
 * Returns the full conversation with all messages, plus a summary of the
 * customer's current state and memory entries.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { MemoryManager } from "@/lib/memory/memory-manager";
import { CustomerStateManager } from "@/lib/memory/customer-state-manager";

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

    // Fetch conversation, ensuring ownership via the bots join
    const { data: conversation, error: convError } = await adminSupabase
      .from("conversations")
      .select(
        `
        *,
        bots!inner(id, name, org_id)
        `
      )
      .eq("id", id)
      .eq("bots.org_id", orgId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Fetch all messages for this conversation
    const { data: messages, error: msgError } = await adminSupabase
      .from("messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    if (msgError) {
      console.error("[GET /api/conversations/[id]] Message fetch error:", msgError);
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
    }

    // Retrieve customer state and memory (best-effort, non-fatal)
    const memoryManager = new MemoryManager(adminSupabase as never);
    const stateManager = new CustomerStateManager(adminSupabase as never);

    const [memorySummary, customerState] = await Promise.all([
      memoryManager
        .getMemory({
          botId: conversation.bot_id,
          sessionId: conversation.session_id,
          customerEmail: conversation.customer_email ?? undefined,
        })
        .catch(() => null),
      stateManager
        .getState({
          botId: conversation.bot_id,
          sessionId: conversation.session_id,
          customerEmail: conversation.customer_email ?? undefined,
        })
        .catch(() => null),
    ]);

    // Strip internal bot join from the response
    const { bots, ...convData } = conversation as Record<string, unknown> & { bots: { name: string } | null };

    return NextResponse.json({
      conversation: {
        ...convData,
        botName: (bots as { name: string } | null)?.name ?? null,
      },
      messages: messages ?? [],
      customerState,
      memorySummary,
    });
  } catch (error) {
    console.error("[GET /api/conversations/[id]] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
