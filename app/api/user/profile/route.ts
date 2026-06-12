/**
 * GET   /api/user/profile  — Return the authenticated user's profile
 * PATCH /api/user/profile  — Update the authenticated user's name
 *
 * Both endpoints require a valid Supabase session (auth cookie).
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// ─── Auth helper ──────────────────────────────────────────────

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return { user: null, supabase, adminSupabase: null };

  const adminSupabase = createAdminClient();
  return { user, supabase, adminSupabase };
}

// ─── GET ─────────────────────────────────────────────────────

export async function GET() {
  try {
    const { user, adminSupabase } = await requireAuth();

    if (!user || !adminSupabase) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await adminSupabase
      .from('user_profiles')
      .select('id, user_id, org_id, name, email, role, avatar_url, created_at, updated_at')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Fetch org details alongside the profile
    const { data: org } = await adminSupabase
      .from('organizations')
      .select('id, name, slug, plan, created_at')
      .eq('id', profile.org_id)
      .single();

    return NextResponse.json(
      {
        success: true,
        data: {
          ...profile,
          organization: org ?? null,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[GET /api/user/profile] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ─── PATCH Validation ─────────────────────────────────────────

const UpdateProfileSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or fewer')
    .optional(),
  avatar_url: z.string().url('Must be a valid URL').nullable().optional(),
});

// ─── PATCH ───────────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  try {
    const { user, adminSupabase } = await requireAuth();

    if (!user || !adminSupabase) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const parsed = UpdateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: parsed.error.flatten(),
        },
        { status: 422 }
      );
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.avatar_url !== undefined) updates.avatar_url = parsed.data.avatar_url;

    const { data: updated, error: updateError } = await adminSupabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', user.id)
      .select('id, user_id, org_id, name, email, role, avatar_url, created_at, updated_at')
      .single();

    if (updateError) {
      console.error('[PATCH /api/user/profile] DB error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data: updated },
      { status: 200 }
    );
  } catch (err) {
    console.error('[PATCH /api/user/profile] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
