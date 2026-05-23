import { NextRequest, NextResponse } from "next/server";
import { adminOk, getSupabaseAdmin } from "@/lib/autoloop-server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!adminOk(req.nextUrl.searchParams.get("key"))) {
    return NextResponse.json({ ok: false, detail: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  if (!body.id) return NextResponse.json({ ok: false, detail: "id 필요" }, { status: 400 });
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("auto_marketing_campaigns")
    .update({ status: "approved", approved_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", body.id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ ok: false, detail: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, campaign: data });
}
