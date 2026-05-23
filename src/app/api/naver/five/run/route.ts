import { NextRequest, NextResponse } from "next/server";
import { adminKeyOk, generateFivePackages, getSupabaseAdmin } from "@/lib/naver-five-server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!adminKeyOk(key)) {
    return NextResponse.json({ ok: false, detail: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const date = body.date || new Date().toISOString().slice(0, 10);
  const packages = generateFivePackages(date);
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("naver_five_daily_packages")
    .upsert(packages, { onConflict: "campaign_date,slot" })
    .select("*");

  if (error) {
    return NextResponse.json({ ok: false, detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, date, created: data?.length || 0, packages: data || [] });
}
