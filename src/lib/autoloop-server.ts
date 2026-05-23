import { createClient } from "@supabase/supabase-js";

export function adminOrCronOk(key: string | null, auth?: string | null) {
  const admin = process.env.ADMIN_SECRET || "";
  const cron = process.env.CRON_SECRET || "";
  return Boolean(
    (admin && key === admin) ||
    (cron && key === cron) ||
    (cron && auth === `Bearer ${cron}`)
  );
}

export function adminOk(key: string | null) {
  const admin = process.env.ADMIN_SECRET || "";
  return Boolean(admin && key === admin);
}

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !serviceKey) throw new Error("SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 없습니다.");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

const TOPICS = [
  ["혼자 계신 부모님 안부 확인", "혼자 계신 부모님 안부 확인, 자녀가 놓치지 말아야 할 생활 신호"],
  ["부모님 복약 체크", "부모님 복약 체크, 매일 확인하기 어려울 때 필요한 루틴"],
  ["멀리 사는 부모님 케어", "멀리 사는 자녀가 부모님을 챙기는 현실적인 방법"],
  ["독거 부모님 케어 서비스", "독거 부모님 케어 서비스가 필요한 순간과 체크리스트"],
  ["부모님 안심 리포트", "부모님 안심 리포트로 가족 돌봄 부담을 줄이는 방법"],
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function tags(keyword: string) {
  return ["부모님안심케어", keyword.replace(/\s+/g, ""), "부모님안부확인", "독거부모님", "복약체크", "시니어케어", "자녀안심리포트"];
}

function cardsFor(keyword: string) {
  return [
    { headline: "매일 전화하지 못해도", body: "부모님 하루는 놓치지 않게", footer: "부모님 안심케어" },
    { headline: "혼자 계신 부모님", body: "식사·복약·컨디션 변화가 걱정된다면", footer: keyword },
    { headline: "확인해야 할 4가지", body: "안부 · 식사 · 복약 · 외출", footer: "생활 루틴 체크" },
    { headline: "자녀에게 필요한 건", body: "막연한 걱정보다 확인 기록", footer: "안심 리포트" },
    { headline: "부모님 안심케어", body: "정기 확인과 요약 리포트", footer: "상황별 케어 주기" },
    { headline: "상담 신청", body: "부모님 상황에 맞는 확인 주기 안내", footer: "parents-care.net" },
  ];
}

function longBody(keyword: string, title: string, slot: number) {
  return `${title}

부모님을 챙기고 싶은 마음은 크지만, 매일 같은 시간에 전화를 드리고 식사와 복약, 컨디션까지 확인하는 일은 생각보다 어렵습니다. 특히 부모님이 혼자 지내시거나 자녀가 멀리 살고 있다면 작은 변화가 늦게 발견될 수 있습니다.

이 글은 ${keyword}을 고민하는 보호자를 위한 실전 체크리스트입니다. 광고 문구처럼 짧게 끝내는 것이 아니라, 실제 보호자가 읽고 “내 상황에 필요하겠다”고 느낄 수 있도록 구성했습니다.

1. 왜 안부 확인은 전화 한 통만으로 부족할까요?

전화는 가장 따뜻한 방식입니다. 하지만 부모님은 자녀가 걱정할까 봐 불편한 이야기를 줄이는 경우가 많습니다. “괜찮다”는 말만으로 식사, 복약, 외출, 컨디션, 집안일 상태를 모두 알기는 어렵습니다.

확인의 핵심은 감시가 아니라 자연스러운 생활 루틴 점검입니다. 부모님께 부담을 주지 않으면서도 보호자가 꼭 알아야 할 내용을 정기적으로 확인하는 구조가 필요합니다.

2. 보호자가 놓치기 쉬운 변화

- 전화를 받는 시간이 평소보다 늦어짐
- 식사를 자주 거름
- 약 복용 여부를 헷갈려 함
- 외출 빈도나 활동량이 줄어듦
- 목소리에 힘이 없거나 말수가 줄어듦
- 같은 이야기를 반복하는 빈도가 늘어남
- 장보기, 병원 일정, 약 수령이 밀림

이런 변화가 한 번 나타났다고 문제라고 볼 수는 없습니다. 하지만 반복되면 기록하고 살펴볼 필요가 있습니다.

3. 부모님 안심케어 체크 항목

부모님 안심케어는 아래 항목을 중심으로 확인합니다.

첫째, 오늘의 안부와 컨디션입니다. 단순히 “괜찮으세요?”가 아니라 평소와 달라진 점이 있는지 확인합니다.

둘째, 식사 여부입니다. 식사량과 식사 시간은 생활 리듬의 기본입니다.

셋째, 복약 여부입니다. 정해진 시간에 약을 드셨는지 확인합니다. 복약은 의료 행위가 아니라 생활 확인 범위에서 점검합니다.

넷째, 외출과 귀가입니다. 병원, 산책, 장보기 후 안전하게 귀가하셨는지 확인합니다.

다섯째, 도움 요청입니다. 장보기, 병원 동행, 약 수령, 집안 정리처럼 보호자가 알아야 할 요청사항을 확인합니다.

4. 부모님 안심케어가 필요한 보호자

- 부모님이 혼자 거주하신다
- 자녀가 타지역이나 해외에 있다
- 부모님 복약 여부가 걱정된다
- 매일 전화하기 어렵다
- 부모님이 불편한 일을 잘 말씀하지 않으신다
- 가족끼리 부모님 상태를 공유하고 싶다

5. 이용 흐름

상담 신청 후 부모님의 상황을 확인합니다. 그다음 안부, 식사, 복약, 외출, 컨디션 등 필요한 확인 항목을 정합니다. 주 1회, 주 3회, 매일 확인 등 상황에 맞는 주기를 정하고, 보호자에게 안심 리포트를 전달합니다.

6. 자주 묻는 질문

Q. 의료 서비스인가요?
A. 아닙니다. 부모님 안심케어는 의료 진단이나 치료가 아니라 생활 확인과 안부 확인 서비스입니다.

Q. 부모님이 부담스러워하지 않나요?
A. 확인 빈도와 항목은 부모님 성향에 맞춰 조정할 수 있습니다. 목적은 감시가 아니라 안부와 관심입니다.

Q. 매일 확인해야 하나요?
A. 부모님 상황에 따라 다릅니다. 안정적인 경우 주 1~3회부터 시작할 수 있고, 복약이나 혼자 생활이 걱정되는 경우 더 자주 확인할 수 있습니다.

7. 마무리

부모님을 향한 걱정은 줄이고, 실제 확인은 더 꾸준하게 만드는 것이 중요합니다. ${keyword}을 고민하고 있다면 부모님 상황에 맞는 확인 주기를 상담받아보세요.

상담 신청: https://parents-care.net

${tags(keyword).map(t => "#" + t).join(" ")}
`;
}

function videoScript(keyword: string, title: string) {
  return {
    title,
    thumbnail: "부모님 하루는 놓치지 않게",
    duration: "35초",
    scenes: [
      { time: "0-3초", caption: "부모님이 혼자 계신데 매일 확인하기 어렵다면?", narration: "부모님을 매일 챙기고 싶지만 쉽지 않죠." },
      { time: "3-8초", caption: "식사·복약·컨디션", narration: "식사와 약, 컨디션 변화는 작은 신호에서 시작됩니다." },
      { time: "8-15초", caption: "정기적인 확인 루틴", narration: "중요한 건 한 번의 전화가 아니라 꾸준한 확인입니다." },
      { time: "15-25초", caption: "부모님 안심케어", narration: "안부, 식사, 복약, 외출 여부를 정기적으로 확인합니다." },
      { time: "25-35초", caption: "상담 신청 parents-care.net", narration: "부모님 상황에 맞는 확인 주기를 상담받아보세요." },
    ],
    hashtags: tags(keyword).map(t => "#" + t),
  };
}

export function generateDailyCampaigns(date = today()) {
  const seed = new Date(date + "T00:00:00Z").getUTCDate();
  return Array.from({ length: 5 }).map((_, i) => {
    const [keyword, title] = TOPICS[(i + seed) % TOPICS.length];
    return {
      campaign_date: date,
      slot: i + 1,
      keyword,
      title,
      long_body: longBody(keyword, title, i + 1),
      cards: cardsFor(keyword),
      video_script: videoScript(keyword, title),
      ad_copy: {
        naver_search_ad: {
          headline1: keyword,
          headline2: "식사·복약·안부 확인",
          description: "매일 전화가 어려워도 부모님 하루는 놓치지 않도록. 상담 신청.",
          landing_url: "https://parents-care.net",
          daily_budget: 10000,
        },
      },
      status: process.env.AUTO_APPROVE_MARKETING === "true" ? "approved" : "draft",
      approved_at: process.env.AUTO_APPROVE_MARKETING === "true" ? new Date().toISOString() : null,
    };
  });
}

export async function ensureDailyCampaigns(date = today()) {
  const supabase = getSupabaseAdmin();
  const campaigns = generateDailyCampaigns(date);
  const { data, error } = await supabase
    .from("auto_marketing_campaigns")
    .upsert(campaigns, { onConflict: "campaign_date,slot" })
    .select("*");
  if (error) throw new Error(error.message);
  return data || [];
}

export function publishChannels() {
  const raw = process.env.AUTO_LOOP_CHANNELS || "youtube,tiktok,instagram,facebook,linkedin,wordpress,naver_ads";
  return raw.split(",").map(s => s.trim()).filter(Boolean);
}

export async function renderVideoIfNeeded(campaign: any) {
  const supabase = getSupabaseAdmin();
  if (campaign.video_url) return campaign.video_url;

  const webhook = process.env.VIDEO_RENDER_WEBHOOK_URL || "";
  if (!webhook) {
    await supabase.from("auto_marketing_campaigns")
      .update({ video_status: "missing_renderer", updated_at: new Date().toISOString() })
      .eq("id", campaign.id);
    return null;
  }

  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      campaign_id: campaign.id,
      title: campaign.title,
      cards: campaign.cards,
      video_script: campaign.video_script,
      brand: "부모님 안심케어",
      landing_url: "https://parents-care.net",
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    await supabase.from("auto_marketing_campaigns")
      .update({ video_status: "render_failed", updated_at: new Date().toISOString() })
      .eq("id", campaign.id);
    await event("video_render_failed", { campaign_id: campaign.id, error: text || res.status });
    return null;
  }

  const json = await res.json().catch(() => ({}));
  const videoUrl = json.video_url || json.url || null;
  await supabase.from("auto_marketing_campaigns")
    .update({ video_status: videoUrl ? "rendered" : "render_failed", video_url: videoUrl, updated_at: new Date().toISOString() })
    .eq("id", campaign.id);
  return videoUrl;
}

export async function event(eventName: string, detail: any) {
  const supabase = getSupabaseAdmin();
  await supabase.from("auto_marketing_loop_events").insert({ event: eventName, detail });
}

function channelWebhook(channel: string) {
  const map: Record<string, string> = {
    youtube: "YOUTUBE_PUBLISH_WEBHOOK_URL",
    tiktok: "TIKTOK_PUBLISH_WEBHOOK_URL",
    instagram: "INSTAGRAM_PUBLISH_WEBHOOK_URL",
    facebook: "FACEBOOK_PUBLISH_WEBHOOK_URL",
    linkedin: "LINKEDIN_PUBLISH_WEBHOOK_URL",
    wordpress: "WORDPRESS_PUBLISH_WEBHOOK_URL",
    naver_ads: "NAVER_ADS_WEBHOOK_URL",
  };
  return process.env[map[channel] || ""] || "";
}

export async function queueJobs(campaigns: any[]) {
  const supabase = getSupabaseAdmin();
  const rows = [];
  for (const c of campaigns) {
    for (const channel of publishChannels()) {
      rows.push({
        campaign_id: c.id,
        channel,
        status: "queued",
        payload: {
          title: c.title,
          body: c.long_body,
          cards: c.cards,
          video_script: c.video_script,
          ad_copy: c.ad_copy,
          landing_url: "https://parents-care.net",
        },
        updated_at: new Date().toISOString(),
      });
    }
  }
  if (rows.length === 0) return [];
  const { data, error } = await supabase
    .from("auto_marketing_publish_jobs")
    .upsert(rows, { onConflict: "campaign_id,channel" })
    .select("*");
  if (error) throw new Error(error.message);
  return data || [];
}

export async function publishApprovedJobs() {
  const supabase = getSupabaseAdmin();
  const { data: jobs, error } = await supabase
    .from("auto_marketing_publish_jobs")
    .select("*, auto_marketing_campaigns(*)")
    .in("status", ["queued", "missing_connector", "video_pending"])
    .limit(50);

  if (error) throw new Error(error.message);
  const results = [];

  for (const job of jobs || []) {
    const campaign = job.auto_marketing_campaigns;
    if (!campaign || campaign.status !== "approved") continue;

    const needsVideo = ["youtube", "tiktok", "instagram"].includes(job.channel);
    let videoUrl = campaign.video_url;
    if (needsVideo) {
      videoUrl = await renderVideoIfNeeded(campaign);
      if (!videoUrl) {
        await supabase.from("auto_marketing_publish_jobs")
          .update({ status: "video_pending", error_message: "VIDEO_RENDER_WEBHOOK_URL 미설정 또는 영상 생성 실패", updated_at: new Date().toISOString() })
          .eq("id", job.id);
        results.push({ channel: job.channel, status: "video_pending" });
        continue;
      }
    }

    if ((process.env.DRY_RUN || "true").toLowerCase() !== "false") {
      await supabase.from("auto_marketing_publish_jobs")
        .update({ status: "sent_dry_run", updated_at: new Date().toISOString(), published_at: new Date().toISOString() })
        .eq("id", job.id);
      results.push({ channel: job.channel, status: "sent_dry_run" });
      continue;
    }

    const webhook = channelWebhook(job.channel);
    if (!webhook) {
      await supabase.from("auto_marketing_publish_jobs")
        .update({ status: "missing_connector", error_message: `${job.channel} webhook/OAuth connector missing`, updated_at: new Date().toISOString() })
        .eq("id", job.id);
      results.push({ channel: job.channel, status: "missing_connector" });
      continue;
    }

    const payload = {
      channel: job.channel,
      campaign_id: campaign.id,
      title: campaign.title,
      body: campaign.long_body,
      cards: campaign.cards,
      video_script: campaign.video_script,
      video_url: videoUrl,
      ad_copy: campaign.ad_copy,
      landing_url: "https://parents-care.net",
    };

    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      await supabase.from("auto_marketing_publish_jobs")
        .update({ status: "failed", error_message: text || `HTTP ${res.status}`, updated_at: new Date().toISOString() })
        .eq("id", job.id);
      results.push({ channel: job.channel, status: "failed" });
      continue;
    }

    const json = await res.json().catch(() => ({}));
    await supabase.from("auto_marketing_publish_jobs")
      .update({ status: "published", external_url: json.url || json.external_url || null, updated_at: new Date().toISOString(), published_at: new Date().toISOString() })
      .eq("id", job.id);
    results.push({ channel: job.channel, status: "published", url: json.url || json.external_url || null });
  }

  return results;
}

export async function runAutoLoop() {
  const date = today();
  const campaigns = await ensureDailyCampaigns(date);
  const approved = campaigns.filter((c: any) => c.status === "approved");
  const jobs = await queueJobs(campaigns);
  const published = await publishApprovedJobs();
  await event("autoloop_run", { date, campaigns: campaigns.length, approved: approved.length, jobs: jobs.length, published });
  return { date, campaigns: campaigns.length, approved: approved.length, jobs: jobs.length, published };
}
