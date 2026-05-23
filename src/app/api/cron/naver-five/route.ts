import { NextRequest, NextResponse } from "next/server";
import { generateFivePackages, getSupabaseAdmin } from "@/lib/naver-five-server";

export const dynamic = "force-dynamic";

function cronOk(req: NextRequest) {
  const secret = process.env.CRON_SECRET || "";
  const auth = req.headers.get("authorization") || "";
  const key = req.nextUrl.searchParams.get("key") || "";
  return Boolean(secret && (auth === `Bearer ${secret}` || key === secret));
}

export async function GET(req: NextRequest) {
  if (!cronOk(req)) {
    return NextResponse.json({ ok: false, detail: "Unauthorized" }, { status: 401 });
  }

  const date = new Date().toISOString().slice(0, 10);
  const packages = generateFivePackages(date);
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("naver_five_daily_packages")
    .upsert(packages, { onConflict: "campaign_date,slot" })
    .select("id, slot, title");

  if (error) {
    return NextResponse.json({ ok: false, detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, created: data?.length || 0, date, packages: data || [] });
}
