import { NextRequest, NextResponse } from "next/server";
import { adminKeyOk, channelConfig, getSupabaseAdmin } from "@/lib/publish-server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!adminKeyOk(key)) {
    return NextResponse.json({ ok: false, detail: "Unauthorized" }, { status: 401 });
  }

  const { job_id } = await req.json().catch(() => ({}));
  if (!job_id) {
    return NextResponse.json({ ok: false, detail: "job_id가 필요합니다." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: job, error } = await supabase
    .from("channel_publish_jobs")
    .select("*")
    .eq("id", job_id)
    .single();

  if (error || !job) {
    return NextResponse.json({ ok: false, detail: error?.message || "작업을 찾지 못했습니다." }, { status: 404 });
  }

  const config = channelConfig(job.channel);

  if (config.mode === "manual") {
    await supabase
      .from("channel_publish_jobs")
      .update({
        status: "ready_manual",
        updated_at: new Date().toISOString(),
      })
      .eq("id", job_id);

    return NextResponse.json({
      ok: true,
      status: "ready_manual",
      detail: config.reason || "수동 게시가 필요한 채널입니다.",
    });
  }

  if ((process.env.DRY_RUN || "true").toLowerCase() !== "false") {
    await supabase
      .from("channel_publish_jobs")
      .update({
        status: "sent_dry_run",
        updated_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
      })
      .eq("id", job_id);

    return NextResponse.json({ ok: true, status: "sent_dry_run", detail: "DRY_RUN=true라 실제 게시하지 않았습니다." });
  }

  const webhookUrl = config.webhookEnv ? process.env[config.webhookEnv] : "";
  if (!webhookUrl) {
    await supabase
      .from("channel_publish_jobs")
      .update({
        status: "missing_connector",
        error_message: `${config.webhookEnv || "WEBHOOK"} 환경변수가 없습니다.`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", job_id);

    return NextResponse.json({
      ok: false,
      status: "missing_connector",
      detail: `${job.channel} 게시용 Webhook/OAuth 연결이 없습니다.`,
    }, { status: 400 });
  }

  const payload = {
    channel: job.channel,
    title: job.title,
    body: job.body,
    tags: job.tags || [],
    image_urls: job.image_urls || [],
    video_brief: job.video_brief || {},
    source_id: job.source_id,
    metadata: job.metadata || {},
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    await supabase
      .from("channel_publish_jobs")
      .update({
        status: "failed",
        error_message: text || `HTTP ${res.status}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", job_id);

    return NextResponse.json({ ok: false, status: "failed", detail: text || `HTTP ${res.status}` }, { status: 500 });
  }

  const result = await res.json().catch(() => ({}));
  await supabase
    .from("channel_publish_jobs")
    .update({
      status: "published",
      external_url: result.url || result.external_url || null,
      updated_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
    })
    .eq("id", job_id);

  return NextResponse.json({ ok: true, status: "published", result });
}
