/**
 * POST /api/knowledge/upload
 *
 * Accepts a multipart form with a plain-text, Markdown, or PDF file plus a
 * botId. Extracts the text content, ingests it into the vector store via
 * RAGEngine, and returns the created item ID along with chunk count.
 *
 * Form fields:
 *   file    — required, File  (PDF | text/plain | text/markdown)
 *   botId   — required, string (UUID)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { RAGEngine } from "@/lib/rag/knowledge-retrieval";

// ─── CORS headers ────────────────────────────────────────────

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

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

// ─── Constants ───────────────────────────────────────────────

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
]);

// ─── POST ────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
    }

    const orgId = await getUserOrgId(supabase, user.id);
    if (!orgId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    // Parse multipart form data
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: "Invalid multipart form data" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const file = formData.get("file") as File | null;
    const botId = formData.get("botId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400, headers: CORS_HEADERS }
      );
    }
    if (!botId) {
      return NextResponse.json(
        { error: "botId is required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(botId)) {
      return NextResponse.json(
        { error: "botId must be a valid UUID" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File too large — maximum size is 10 MB" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Allowed: PDF, plain text, Markdown" },
        { status: 400, headers: CORS_HEADERS }
      );
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
      return NextResponse.json(
        { error: "Bot not found or access denied" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    // Extract text content
    let content: string;
    const originalName = file.name;
    const fileTitle = originalName.replace(/\.[^.]+$/, "");

    if (file.type === "application/pdf") {
      // Simple PDF text extraction: read buffer and attempt to decode printable text.
      // For production use, replace with a proper PDF parser (e.g. pdf-parse).
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        // Extract readable ASCII/UTF-8 text segments from the PDF binary
        const raw = buffer.toString("latin1");
        const textSegments = raw.match(/[\x20-\x7E\n\r\t]{4,}/g) ?? [];
        content = textSegments
          .filter((seg) => !/^(\d+\s+\d+\s+obj|stream|endstream|endobj)$/.test(seg.trim()))
          .join(" ")
          .replace(/\s{2,}/g, " ")
          .trim();

        if (!content) {
          // Fallback: store raw buffer text representation
          content = buffer.toString("utf8", 0, Math.min(buffer.length, 50000));
        }
      } catch {
        return NextResponse.json(
          { error: "Failed to extract text from PDF" },
          { status: 422, headers: CORS_HEADERS }
        );
      }
    } else {
      // text/plain and text/markdown
      content = await file.text();
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Could not extract any text content from the uploaded file" },
        { status: 422, headers: CORS_HEADERS }
      );
    }

    // Ingest into vector store
    const ragEngine = new RAGEngine();
    const document = await ragEngine.ingestDocument({
      botId,
      title: fileTitle,
      content,
      sourceType: "pdf",
      metadata: {
        originalName,
        size: file.size,
        type: file.type,
      },
    });

    return NextResponse.json(
      {
        success: true,
        itemId: document.id,
        chunks: (document as Record<string, unknown>).chunk_count ?? 1,
      },
      { status: 201, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("[POST /api/knowledge/upload] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
