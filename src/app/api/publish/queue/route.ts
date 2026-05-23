import { NextRequest, NextResponse } from "next/server";
import { adminKeyOk, DEFAULT_CHANNELS, getSupabaseAdmin, loadLatestPackages, channelConfig } from "@/lib/publish-server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!adminKeyOk(key)) {
    return NextResponse.json({ ok: false, detail: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const body = await req.json().catch(() => ({}));
  const channels = Array.isArray(body.channels) && body.channels.length ? body.channels : DEFAULT_CHANNELS;

  const { table, packages } = await loadLatestPackages(10);

  if (packages.length === 0) {
    return NextResponse.json({
      ok: true,
      created: 0,
      table,
      detail: "마케팅 패키지가 없습니다. 먼저 /admin/naver에서 방대한 마케팅 패키지를 생성하세요.",
    });
  }

  let created = 0;
  let updated = 0;

  for (const pack of packages) {
    for (const channel of channels) {
      const config = channelConfig(channel);
      const status = config.mode === "manual" ? "ready_manual" : "draft";

      const payload = {
        source_type: table || "marketing_package",
        source_id: pack.id,
        channel,
        title: pack.title,
        body: pack.body,
        tags: pack.tags,
        image_urls: pack.imageUrls,
        video_brief: pack.videoBrief || {},
        status,
        manual_reason: config.reason || null,
        metadata: pack.metadata || {},
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("channel_publish_jobs")
        .upsert(payload, { onConflict: "source_id,channel" });

      if (error) {
        return NextResponse.json({ ok: false, detail: `${channel} 큐 생성 실패: ${error.message}` }, { status: 500 });
      }

      created += 1;
    }
  }

  return NextResponse.json({ ok: true, created, updated, table });
}
