/**
 * GET /api/bots/[id]/stats
 *
 * Returns aggregated stats for a specific bot owned by the authenticated user's org.
 *
 * Response:
 *   {
 *     total_conversations: number,
 *     total_messages: number,
 *     total_leads: number,
 *     avg_conversion_probability: number
 *   }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// ─── Auth helpers ─────────────────────────────────────────────

async function getAuthenticatedUser(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
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
    .from('user_profiles')
    .select('org_id')
    .eq('user_id', userId)
    .single();
  return profile?.org_id ?? null;
}

// ─── GET ─────────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: botId } = await params;

    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const orgId = await getUserOrgId(supabase, user.id);
    if (!orgId) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    const adminSupabase = createAdminClient();

    // Verify bot belongs to org
    const { data: bot } = await adminSupabase
      .from('bots')
      .select('id')
      .eq('id', botId)
      .eq('org_id', orgId)
      .single();

    if (!bot) {
      return NextResponse.json(
        { success: false, error: 'Bot not found or access denied' },
        { status: 404 }
      );
    }

    // Run all counts in parallel
    const [
      { count: totalConversations },
      { count: totalMessages },
      { data: leadsData },
      { data: stateData },
    ] = await Promise.all([
      // Total conversations
      adminSupabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('bot_id', botId),

      // Total messages
      adminSupabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('bot_id', botId),

      // Total leads (conversations with a lead_score threshold or from leads table)
      adminSupabase
        .from('leads')
        .select('id', { count: 'exact' })
        .eq('bot_id', botId),

      // Average conversion probability from customer_states
      adminSupabase
        .from('customer_states')
        .select('conversion_probability')
        .eq('bot_id', botId),
    ]);

    const totalLeads = leadsData?.length ?? 0;

    const avgConversionProbability =
      stateData && stateData.length > 0
        ? stateData.reduce(
            (sum, row) => sum + (row.conversion_probability ?? 0),
            0
          ) / stateData.length
        : 0;

    return NextResponse.json(
      {
        success: true,
        data: {
          total_conversations: totalConversations ?? 0,
          total_messages: totalMessages ?? 0,
          total_leads: totalLeads,
          avg_conversion_probability: Math.round(avgConversionProbability * 100) / 100,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[GET /api/bots/[id]/stats] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
