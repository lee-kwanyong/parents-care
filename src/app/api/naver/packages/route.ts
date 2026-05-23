import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function env(name: string) {
  return process.env[name] || "";
}

function isAuthorized(req: NextRequest) {
  const key =
    req.nextUrl.searchParams.get("key") ||
    req.headers.get("x-admin-key") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";

  return Boolean(key && key === env("ADMIN_SECRET"));
}

function supabase() {
  const url = env("SUPABASE_URL") || env("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceKey) {
    throw new Error("SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 없습니다.");
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, detail: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = supabase();

    const [packages, research, ads] = await Promise.all([
      db
        .from("naver_content_packages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(12),
      db
        .from("naver_keyword_research")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(12),
      db
        .from("naver_ad_plans")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(12),
    ]);

    if (packages.error) throw new Error(packages.error.message);
    if (research.error) throw new Error(research.error.message);
    if (ads.error) throw new Error(ads.error.message);

    return NextResponse.json({
      ok: true,
      packages: packages.data || [],
      research: research.data || [],
      ads: ads.data || [],
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
