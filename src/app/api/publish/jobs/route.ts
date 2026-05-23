import { NextRequest, NextResponse } from "next/server";
import { adminKeyOk, getSupabaseAdmin } from "@/lib/publish-server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!adminKeyOk(key)) {
    return NextResponse.json({ ok: false, detail: "Unauthorized" }, { status: 401 });
  }

  const status = req.nextUrl.searchParams.get("status");
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from("channel_publish_jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ ok: false, detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, jobs: data || [] });
}
