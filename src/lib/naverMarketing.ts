import { createClient } from "@supabase/supabase-js";

export type NaverSearchItem = {
  title: string;
  link: string;
  description?: string;
  bloggername?: string;
  postdate?: string;
};

export type AgentRunResult = {
  ok: boolean;
  keywordCount: number;
  researchCreated: number;
  contentCreated: number;
  adPlansCreated: number;
  warnings: string[];
};

const DEFAULT_KEYWORDS = [
  "부모님 안부 확인",
  "혼자 계신 부모님",
  "독거 부모님 케어",
  "부모님 복약 체크",
  "부모님 돌봄 서비스",
  "멀리 사는 부모님 케어",
  "어르신 안부 확인",
  "시니어 케어 서비스",
];

function cleanHtml(value: string | undefined | null) {
  return String(value || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BASE_URL ||
    "https://parents-care.net"
  ).replace(/\/$/, "");
}

function getKeywords() {
  const raw = process.env.NAVER_TARGET_KEYWORDS || "";
  const values = raw
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  return values.length ? values : DEFAULT_KEYWORDS;
}

export function isAuthorized(url: string, headers: Headers) {
  const key = new URL(url).searchParams.get("key") || headers.get("x-admin-key") || "";
  const admin = process.env.ADMIN_SECRET || "";
  const cron = process.env.CRON_SECRET || "";

  if (!key) return false;
  return Boolean((admin && key === admin) || (cron && key === cron));
}

export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 없습니다.");
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function searchNaverBlog(keyword: string): Promise<NaverSearchItem[]> {
  const clientId = process.env.NAVER_SEARCH_CLIENT_ID;
  const clientSecret = process.env.NAVER_SEARCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return [];
  }

  const url = new URL("https://openapi.naver.com/v1/search/blog.json");
  url.searchParams.set("query", keyword);
  url.searchParams.set("display", "10");
  url.searchParams.set("sort", "sim");

  const res = await fetch(url.toString(), {
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`네이버 블로그 검색 API 실패: ${res.status} ${text.slice(0, 200)}`);
  }

  const json = await res.json();
  return (json.items || []).map((item: any) => ({
    title: cleanHtml(item.title),
    link: String(item.link || ""),
    description: cleanHtml(item.description),
    bloggername: cleanHtml(item.bloggername),
    postdate: String(item.postdate || ""),
  }));
}

function inferConcern(keyword: string) {
  if (keyword.includes("복약") || keyword.includes("약")) return "복약 여부와 생활 루틴";
  if (keyword.includes("혼자") || keyword.includes("독거")) return "혼자 계신 부모님의 안부와 생활 변화";
  if (keyword.includes("돌봄")) return "가족 돌봄 부담과 정기 확인";
  if (keyword.includes("멀리")) return "멀리 사는 자녀의 현실적인 안부 확인";
  return "부모님 안부, 식사, 복약, 생활 변화";
}

function makeBlogTitle(keyword: string, topTitles: string[]) {
  const alreadyUsedQuestion = topTitles.some((t) => t.includes("방법") || t.includes("체크"));

  if (keyword.includes("복약")) return "부모님 복약 체크, 매일 확인하기 어려울 때 현실적인 방법";
  if (keyword.includes("독거") || keyword.includes("혼자")) return "혼자 계신 부모님 안부, 자녀가 놓치기 쉬운 생활 변화 신호";
  if (keyword.includes("멀리")) return "멀리 사는 자녀가 부모님 안부를 챙기는 현실적인 방법";
  if (alreadyUsedQuestion) return `${keyword}, 가족이 부담 없이 시작하는 안심 체크 루틴`;
  return `${keyword}, 매일 전화가 어려울 때 필요한 안심 체크 방법`;
}

function makeBlogBody(keyword: string, topTitles: string[]) {
  const concern = inferConcern(keyword);
  const cta = `${appUrl()}/?utm_source=naver&utm_medium=content_package&utm_campaign=parentcare`;

  return `매일 연락드리고 싶지만, 일과 생활 때문에 부모님 안부를 꾸준히 확인하기 어려운 순간이 있습니다. 특히 ${concern}은 한두 번 놓치면 가족 입장에서 더 큰 걱정으로 이어질 수 있습니다.

부모님 안심케어는 의료 진단이나 치료 서비스가 아니라, 부모님의 일상 상태를 정기적으로 확인하고 가족에게 안심 리포트를 전달하는 생활 케어 서비스입니다.

확인하는 항목은 단순하지만 중요합니다.

1. 오늘 컨디션은 괜찮으신지
2. 식사는 하셨는지
3. 약은 챙겨 드셨는지
4. 외출이나 귀가에 불편함은 없었는지
5. 평소와 다른 생활 변화는 없는지

자녀가 매일 직접 확인하기 어렵다면, 정기적인 안부 확인 루틴을 만들어두는 것이 도움이 됩니다. 부모님께는 꾸준한 관심을, 가족에게는 놓치지 않는 확인 체계를 제공하는 것이 부모님 안심케어의 목표입니다.

이런 분께 적합합니다.

- 부모님이 혼자 계시는 시간이 긴 가족
- 멀리 살아 자주 방문하기 어려운 자녀
- 복약, 식사, 안부 확인이 걱정되는 보호자
- 갑작스러운 생활 변화가 걱정되는 가족

부모님 상황에 맞는 확인 주기와 리포트 방식을 상담받고 싶다면 아래 링크에서 신청해 주세요.

상담 신청: ${cta}

※ 본 콘텐츠는 부모님 안심케어 서비스 안내 글입니다. 의료적 진단, 치료, 응급구조를 대신하지 않습니다.`;
}

function makeTags(keyword: string) {
  const base = ["부모님안심케어", "부모님케어", "부모님안부", "어르신케어", "시니어케어"];
  if (keyword.includes("복약")) return [...base, "복약체크", "부모님복약", "생활루틴"];
  if (keyword.includes("혼자") || keyword.includes("독거")) return [...base, "혼자계신부모님", "독거부모님", "안부확인"];
  return [...base, "안부확인", "식사확인", "자녀안심"];
}

function makeImageBrief(keyword: string) {
  return {
    format: "naver_blog_thumbnail_and_cardnews",
    heroText: "매일 전화하지 못해도, 부모님 하루는 놓치지 않게",
    subText: inferConcern(keyword),
    cardnews: [
      "매일 안부 확인이 어려운 자녀를 위해",
      "식사·복약·컨디션을 정기적으로 확인",
      "평소와 다른 생활 변화가 있으면 가족에게 공유",
      "부모님께는 꾸준한 관심, 가족에게는 안심 리포트",
      "지금 부모님 상황에 맞는 케어 주기를 상담받아보세요",
    ],
    style: "따뜻한 가족 케어 느낌, 과장 없는 신뢰형 이미지, 밝은 베이지와 블루 톤",
  };
}

function makeVideoBrief(keyword: string) {
  return {
    format: "youtube_shorts_or_instagram_reels",
    duration: "25-35s",
    title: `${keyword}, 놓치지 않는 안심 체크 루틴`,
    hook: "매일 전화드리기 어려워도 부모님 안부는 놓치고 싶지 않다면?",
    scenes: [
      { sec: "0-4", caption: "매일 전화드리고 싶지만 쉽지 않을 때", narration: "바쁜 하루 속에서도 부모님 걱정은 계속됩니다." },
      { sec: "5-11", caption: "식사·복약·컨디션 확인", narration: "부모님 안심케어는 중요한 생활 루틴을 정기적으로 확인합니다." },
      { sec: "12-20", caption: "가족에게 안심 리포트", narration: "확인한 내용은 가족이 보기 쉽게 요약해 전달합니다." },
      { sec: "21-30", caption: "부모님 상황에 맞게 상담", narration: "지금 부모님 상황에 맞는 케어 주기를 상담받아보세요." },
    ],
    thumbnailText: "부모님 안부, 놓치지 않는 방법",
    hashtags: ["#부모님케어", "#안부확인", "#시니어케어", "#복약체크"],
  };
}

function makeAdPlan(keyword: string) {
  return {
    keyword,
    campaign_name: "부모님 안심케어_검색",
    adgroup_name: keyword.includes("복약") ? "복약체크" : keyword.includes("혼자") || keyword.includes("독거") ? "독거부모님" : "안부확인",
    headline: keyword.includes("복약")
      ? "부모님 복약·안부 확인 서비스"
      : "부모님 안부, 매일 놓치지 않게",
    description: "식사·복약·생활 변화 확인 후 가족에게 안심 리포트. 부모님 상황별 무료 상담.",
    landing_url: `${appUrl()}/?utm_source=naver&utm_medium=searchad&utm_campaign=parentcare`,
    daily_budget: Number(process.env.NAVER_AD_DAILY_BUDGET || "10000"),
    status: "draft",
  };
}

export async function runNaverMarketingAgent(): Promise<AgentRunResult> {
  const supabase = supabaseAdmin();
  const keywords = getKeywords();
  const warnings: string[] = [];

  if (!process.env.NAVER_SEARCH_CLIENT_ID || !process.env.NAVER_SEARCH_CLIENT_SECRET) {
    warnings.push("NAVER_SEARCH_CLIENT_ID/SECRET이 없어 실제 네이버 검색 결과 분석 없이 기본 키워드로 콘텐츠를 생성했습니다.");
  }

  let researchCreated = 0;
  let contentCreated = 0;
  let adPlansCreated = 0;

  for (const keyword of keywords) {
    let items: NaverSearchItem[] = [];

    try {
      items = await searchNaverBlog(keyword);
    } catch (err) {
      warnings.push(`${keyword}: ${err instanceof Error ? err.message : String(err)}`);
      items = [];
    }

    const topTitles = items.map((i) => i.title).filter(Boolean).slice(0, 10);
    const topLinks = items.map((i) => i.link).filter(Boolean).slice(0, 10);

    const { error: researchError } = await supabase.from("naver_keyword_research").insert({
      keyword,
      source: process.env.NAVER_SEARCH_CLIENT_ID ? "naver_search_api" : "default_keyword_pack",
      result_count: items.length,
      top_titles: topTitles,
      top_links: topLinks,
      insights: {
        concern: inferConcern(keyword),
        top_blogger_names: items.map((i) => i.bloggername).filter(Boolean).slice(0, 10),
        note: items.length ? "네이버 블로그 검색 결과 기반" : "검색 API 미연결 또는 결과 없음",
      },
    });

    if (researchError) throw new Error(`naver_keyword_research insert 실패: ${researchError.message}`);
    researchCreated += 1;

    const title = makeBlogTitle(keyword, topTitles);
    const body = makeBlogBody(keyword, topTitles);
    const tags = makeTags(keyword);

    const { error: contentError } = await supabase.from("naver_content_packages").insert({
      package_type: "naver_blog_package",
      keyword,
      title,
      body,
      tags,
      publish_target: "naver_blog_manual_or_creator",
      image_brief: makeImageBrief(keyword),
      video_brief: makeVideoBrief(keyword),
      status: "draft",
      notes: "네이버 블로그 공식 글쓰기 API가 없어 자동 로그인 게시가 아니라, 운영자/제휴 블로거 게시용 패키지로 생성했습니다.",
    });

    if (contentError) throw new Error(`naver_content_packages insert 실패: ${contentError.message}`);
    contentCreated += 1;

    const adPlan = makeAdPlan(keyword);
    const { error: adError } = await supabase.from("naver_ad_plans").insert(adPlan);

    if (adError) throw new Error(`naver_ad_plans insert 실패: ${adError.message}`);
    adPlansCreated += 1;
  }

  return {
    ok: true,
    keywordCount: keywords.length,
    researchCreated,
    contentCreated,
    adPlansCreated,
    warnings,
  };
}

export async function getNaverMarketingDashboard() {
  const supabase = supabaseAdmin();

  const [packages, research, ads] = await Promise.all([
    supabase
      .from("naver_content_packages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("naver_keyword_research")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("naver_ad_plans")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  if (packages.error) throw new Error(packages.error.message);
  if (research.error) throw new Error(research.error.message);
  if (ads.error) throw new Error(ads.error.message);

  return {
    ok: true,
    packages: packages.data || [],
    research: research.data || [],
    ads: ads.data || [],
  };
}
