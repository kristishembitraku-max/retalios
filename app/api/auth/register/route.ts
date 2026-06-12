/**
 * POST /api/auth/register
 *
 * Creates a new Supabase auth user, an organisation record, and a user profile
 * linked to that organisation. Returns the new session on success.
 *
 * Body:
 *   email    — string (valid email)
 *   password — string (8–72 chars)
 *   name     — string (display name)
 *   orgName  — string (organisation name)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// ─── Validation ──────────────────────────────────────────────

const RegisterSchema = z.object({
  email: z.string().email("Must be a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
  name: z.string().min(1).max(100),
  orgName: z.string().min(1).max(100),
});

// ─── POST ────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const { email, password, name, orgName } = parsed.data;

    // Use the regular (user-scoped) client to call auth.signUp so that the
    // resulting session cookie is properly set.
    const supabase = await createClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, org_name: orgName },
      },
    });

    if (authError) {
      const alreadyExists =
        authError.message.toLowerCase().includes("already registered") ||
        authError.message.toLowerCase().includes("already exists");

      if (alreadyExists) {
        return NextResponse.json({ error: "Email is already in use" }, { status: 409 });
      }

      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Failed to create auth user" }, { status: 500 });
    }

    const userId = authData.user.id;
    const orgId = uuidv4();
    const now = new Date().toISOString();

    // Use admin client for privileged writes (bypasses RLS)
    const adminSupabase = createAdminClient();

    // Create organisation record
    const { error: orgError } = await adminSupabase
      .from("organizations")
      .insert({
        id: orgId,
        name: orgName,
        owner_id: userId,
        plan: "free",
        created_at: now,
        updated_at: now,
      });

    if (orgError) {
      console.error("[POST /api/auth/register] Org creation error:", orgError);
      // Best-effort cleanup of the auth user; ignore any secondary errors
      await adminSupabase.auth.admin.deleteUser(userId).catch(console.error);
      return NextResponse.json({ error: "Failed to create organisation" }, { status: 500 });
    }

    // Create user profile record
    const { error: profileError } = await adminSupabase
      .from("user_profiles")
      .insert({
        id: uuidv4(),
        user_id: userId,
        org_id: orgId,
        name,
        email,
        role: "owner",
        created_at: now,
        updated_at: now,
      });

    if (profileError) {
      console.error("[POST /api/auth/register] Profile creation error:", profileError);
      return NextResponse.json({ error: "Failed to create user profile" }, { status: 500 });
    }

    return NextResponse.json(
      {
        user: { id: userId, email, name },
        organization: { id: orgId, name: orgName },
        session: authData.session,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/auth/register] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
