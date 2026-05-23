import { NextRequest, NextResponse } from "next/server";
import { adminKeyOk, getSupabaseAdmin } from "@/lib/naver-five-server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!adminKeyOk(key)) {
    return NextResponse.json({ ok: false, detail: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  if (!body.id) {
    return NextResponse.json({ ok: false, detail: "id가 필요합니다." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("naver_five_daily_packages")
    .update({
      status: body.status || "approved",
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      notes: body.notes || null,
    })
    .eq("id", body.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, package: data });
}
