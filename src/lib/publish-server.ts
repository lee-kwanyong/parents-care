import { createClient } from "@supabase/supabase-js";

export function adminKeyOk(key: string | null) {
  const expected = process.env.ADMIN_SECRET || "";
  return Boolean(expected && key && expected === key);
}

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !serviceKey) {
    throw new Error("SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 없습니다.");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

export type PackageRow = Record<string, any>;

function asTextArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") return value.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

function normalizePackage(row: PackageRow) {
  const id = String(row.id || row.package_id || row.source_id || crypto.randomUUID());
  const title =
    row.title ||
    row.blog_title ||
    row.naver_title ||
    row.headline ||
    "부모님 안심케어 콘텐츠 패키지";

  const body =
    row.body ||
    row.long_body ||
    row.blog_body ||
    row.content ||
    row.article ||
    row.description ||
    "";

  const tags =
    asTextArray(row.tags).length > 0
      ? asTextArray(row.tags)
      : ["부모님안심케어", "부모님안부확인", "독거부모님", "복약체크", "시니어케어"];

  const imageUrls =
    asTextArray(row.image_urls).length > 0
      ? asTextArray(row.image_urls)
      : asTextArray(row.card_image_urls);

  const videoBrief =
    row.video_brief ||
    row.video ||
    row.shorts_brief ||
    row.media?.video ||
    {};

  const metadata = {
    keyword: row.keyword || row.primary_keyword || "",
    package_type: row.package_type || row.type || "",
    raw: row,
  };

  return { id, title, body, tags, imageUrls, videoBrief, metadata };
}

export async function loadLatestPackages(limit = 10) {
  const supabase = getSupabaseAdmin();

  // 패치 버전에 따라 테이블명이 다를 수 있어 후보를 순차 조회합니다.
  const tables = [
    "naver_rich_marketing_packages",
    "naver_rich_content_packages",
    "rich_marketing_packages",
    "naver_content_packages",
    "marketing_content_packages",
  ];

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!error && data && data.length > 0) {
      return { table, packages: data.map(normalizePackage) };
    }
  }

  return { table: null, packages: [] as ReturnType<typeof normalizePackage>[] };
}

export function channelConfig(channel: string) {
  const configs: Record<string, { label: string; mode: "manual" | "api" | "webhook"; webhookEnv?: string; reason?: string }> = {
    naver_blog: {
      label: "네이버 블로그",
      mode: "manual",
      reason: "네이버 블로그 공식 글쓰기 API가 종료되어 자동 로그인/자동 게시 대신 수동 게시 패키지로 처리합니다.",
    },
    naver_cafe: {
      label: "네이버 카페",
      mode: "manual",
      reason: "카페 홍보성 자동 게시를 피하고 정보성 답변/게시 초안만 제공합니다.",
    },
    naver_kin: {
      label: "지식iN",
      mode: "manual",
      reason: "지식iN 자동 답변이 아니라 운영자 검토용 답변 초안만 제공합니다.",
    },
    youtube: {
      label: "YouTube Shorts",
      mode: "webhook",
      webhookEnv: "YOUTUBE_PUBLISH_WEBHOOK_URL",
    },
    tiktok: {
      label: "TikTok",
      mode: "webhook",
      webhookEnv: "TIKTOK_PUBLISH_WEBHOOK_URL",
    },
    instagram: {
      label: "Instagram/Reels",
      mode: "webhook",
      webhookEnv: "INSTAGRAM_PUBLISH_WEBHOOK_URL",
    },
    facebook: {
      label: "Facebook Page",
      mode: "webhook",
      webhookEnv: "FACEBOOK_PUBLISH_WEBHOOK_URL",
    },
    linkedin: {
      label: "LinkedIn",
      mode: "webhook",
      webhookEnv: "LINKEDIN_PUBLISH_WEBHOOK_URL",
    },
    wordpress: {
      label: "WordPress",
      mode: "webhook",
      webhookEnv: "WORDPRESS_PUBLISH_WEBHOOK_URL",
    },
  };

  return configs[channel] || { label: channel, mode: "manual" as const, reason: "수동 검토가 필요한 채널입니다." };
}

export const DEFAULT_CHANNELS = [
  "naver_blog",
  "naver_cafe",
  "naver_kin",
  "youtube",
  "tiktok",
  "instagram",
  "facebook",
  "linkedin",
  "wordpress",
];
