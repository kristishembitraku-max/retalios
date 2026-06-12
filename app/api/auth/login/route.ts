/**
 * POST /api/auth/login
 *
 * Authenticates a user with email + password via Supabase.
 *
 * Body:
 *   email    — string (valid email)
 *   password — string (min 8 chars)
 *
 * Returns:
 *   200 { success: true, user: { id, email } }
 *   401 { success: false, error: string }
 *   422 { success: false, error: string, details: object }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// ─── Validation ──────────────────────────────────────────────

const LoginSchema = z.object({
  email: z.string().email('Must be a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters'),
});

// ─── POST ────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const parsed = LoginSchema.safeParse(body);
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

    const { email, password } = parsed.data;

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      // Don't leak whether the email exists
      const message =
        error?.message?.toLowerCase().includes('invalid login credentials')
          ? 'Invalid email or password'
          : (error?.message ?? 'Authentication failed');

      return NextResponse.json(
        { success: false, error: message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[POST /api/auth/login] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
