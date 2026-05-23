import { NextRequest, NextResponse } from "next/server";
import { adminKeyOk, getSupabaseAdmin } from "@/lib/naver-five-server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!adminKeyOk(key)) {
    return NextResponse.json({ ok: false, detail: "Unauthorized" }, { status: 401 });
  }

  const date = req.nextUrl.searchParams.get("date");
  const supabase = getSupabaseAdmin();

  let q = supabase
    .from("naver_five_daily_packages")
    .select("*")
    .order("campaign_date", { ascending: false })
    .order("slot", { ascending: true })
    .limit(30);

  if (date) q = q.eq("campaign_date", date);

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ ok: false, detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, packages: data || [] });
}
