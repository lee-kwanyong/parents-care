import { NextRequest, NextResponse } from "next/server";
import { adminOk, getSupabaseAdmin } from "@/lib/autoloop-server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!adminOk(req.nextUrl.searchParams.get("key"))) {
    return NextResponse.json({ ok: false, detail: "Unauthorized" }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  const { data: campaigns, error } = await supabase
    .from("auto_marketing_campaigns")
    .select("*, auto_marketing_publish_jobs(*)")
    .order("campaign_date", { ascending: false })
    .order("slot", { ascending: true })
    .limit(50);
  if (error) return NextResponse.json({ ok: false, detail: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, campaigns: campaigns || [] });
}
