import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createRichPackage, fetchNaverResearch, getPrimaryKeywords } from "@/lib/naverRichMarketing";

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

  return Boolean(key && (key === env("ADMIN_SECRET") || key === env("CRON_SECRET")));
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
    const countParam = Number(req.nextUrl.searchParams.get("count") || 3);
    const count = Math.max(1, Math.min(5, countParam));
    const keywords = getPrimaryKeywords().slice(0, count);

    const createdPackages: any[] = [];
    const researchRows: any[] = [];
    const adRows: any[] = [];

    for (const keyword of keywords) {
      const research = await fetchNaverResearch(keyword);

      const researchPayload = {
        keyword,
        source: "naver_search_api_or_fallback",
        result_count: research.resultCount,
        top_titles: research.topTitles,
        top_links: research.topLinks,
        insights: research.insights,
      };

      const { data: researchData, error: researchError } = await db
        .from("naver_keyword_research")
        .insert(researchPayload)
        .select("*")
        .single();

      if (researchError) {
        throw new Error(`naver_keyword_research insert 실패: ${researchError.message}`);
      }

      researchRows.push(researchData);

      const pkg = createRichPackage(keyword, research);

      const { data: packageData, error: packageError } = await db
        .from("naver_content_packages")
        .insert({
          package_type: "rich_naver_marketing_package",
          keyword: pkg.keyword,
          title: pkg.title,
          body: pkg.body,
          tags: pkg.tags,
          publish_target: "naver_blog_creator_sns_youtube_package",
          image_brief: pkg.imageBrief,
          video_brief: pkg.videoBrief,
          status: "draft",
          notes: "네이버 블로그 직접 자동 글쓰기가 아니라, 운영자/제휴 블로거/체험단 게시용 고품질 원고·이미지·영상 패키지입니다.",
        })
        .select("*")
        .single();

      if (packageError) {
        throw new Error(`naver_content_packages insert 실패: ${packageError.message}`);
      }

      createdPackages.push(packageData);

      const { data: adData, error: adError } = await db
        .from("naver_ad_plans")
        .insert({
          keyword: pkg.keyword,
          campaign_name: pkg.adPlan.campaignName,
          adgroup_name: pkg.adPlan.adgroupName,
          headline: pkg.adPlan.headline,
          description: pkg.adPlan.description,
          landing_url: pkg.adPlan.landingUrl,
          daily_budget: pkg.adPlan.dailyBudget,
          status: "draft",
        })
        .select("*")
        .single();

      if (adError) {
        throw new Error(`naver_ad_plans insert 실패: ${adError.message}`);
      }

      adRows.push(adData);
    }

    return NextResponse.json({
      ok: true,
      created: createdPackages.length,
      research: researchRows.length,
      ads: adRows.length,
      packages: createdPackages,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
