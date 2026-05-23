import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function env(name: string) {
  return process.env[name] || "";
}

function supabase() {
  const url = env("SUPABASE_URL") || env("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceKey) {
    throw new Error("SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 없습니다.");
  }

  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

function escapeXml(value: string) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrap(text: string, max = 17) {
  const chars = Array.from(String(text || ""));
  const lines: string[] = [];
  let cur = "";

  for (const ch of chars) {
    cur += ch;
    if (Array.from(cur).length >= max || /[,.?!，。]/.test(ch)) {
      lines.push(cur.trim());
      cur = "";
    }
  }

  if (cur.trim()) lines.push(cur.trim());
  return lines.slice(0, 4);
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string; idx: string }> | { id: string; idx: string } }
) {
  try {
    const params: any = await ctx.params;
    const id = params.id;
    const idx = Math.max(0, Number(params.idx || 0));

    const { data, error } = await supabase()
      .from("naver_content_packages")
      .select("title,image_brief")
      .eq("id", id)
      .single();

    if (error) throw error;

    const cards = data?.image_brief?.cards || [];
    const card = cards[idx] || cards[0] || {
      title: data?.title || "부모님 안심케어",
      subtitle: "매일 전화하지 못해도 부모님 하루는 놓치지 않게",
      bullets: ["안부 확인", "식사 확인", "복약 확인"],
      footer: "parents-care.net",
    };

    const titleLines = wrap(card.title, 13);
    const subtitleLines = wrap(card.subtitle, 19);
    const bullets = Array.isArray(card.bullets) ? card.bullets.slice(0, 4) : [];

    const titleSvg = titleLines
      .map((line, i) => `<text x="90" y="${215 + i * 72}" font-size="58" font-weight="800" fill="#102033">${escapeXml(line)}</text>`)
      .join("");

    const subtitleSvg = subtitleLines
      .map((line, i) => `<text x="90" y="${430 + i * 42}" font-size="32" font-weight="600" fill="#274960">${escapeXml(line)}</text>`)
      .join("");

    const bulletSvg = bullets
      .map((b, i) => {
        const y = 610 + i * 72;
        return `
          <circle cx="112" cy="${y - 10}" r="16" fill="#4fd1b3" opacity="0.95" />
          <text x="145" y="${y}" font-size="34" font-weight="700" fill="#14212e">${escapeXml(b)}</text>
        `;
      })
      .join("");

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#d9fff4"/>
      <stop offset="45%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#e8f1ff"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#0f172a" flood-opacity="0.13"/>
    </filter>
  </defs>

  <rect width="1080" height="1080" fill="url(#bg)"/>
  <circle cx="910" cy="145" r="170" fill="#67e8c4" opacity="0.25"/>
  <circle cx="110" cy="930" r="220" fill="#93c5fd" opacity="0.23"/>

  <rect x="58" y="58" width="964" height="964" rx="54" fill="#ffffff" opacity="0.86" filter="url(#shadow)"/>
  <rect x="90" y="96" width="260" height="48" rx="24" fill="#0f766e"/>
  <text x="122" y="129" font-size="25" font-weight="800" fill="#ffffff">부모님 안심케어</text>

  ${titleSvg}
  ${subtitleSvg}

  <rect x="90" y="545" width="900" height="325" rx="36" fill="#f8fafc" stroke="#dbe8ef"/>
  ${bulletSvg}

  <text x="90" y="940" font-size="27" font-weight="700" fill="#0f766e">${escapeXml(card.footer || "parents-care.net")}</text>
  <text x="90" y="982" font-size="22" fill="#607084">안부 · 식사 · 복약 · 생활 변화 확인</text>
</svg>`;

    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const svg = `<svg width="1080" height="1080" xmlns="http://www.w3.org/2000/svg"><rect width="1080" height="1080" fill="#fff"/><text x="80" y="120" font-size="40" fill="#111">이미지 생성 오류</text><text x="80" y="180" font-size="24" fill="#555">${escapeXml(err instanceof Error ? err.message : String(err))}</text></svg>`;
    return new Response(svg, {
      status: 500,
      headers: { "Content-Type": "image/svg+xml; charset=utf-8" },
    });
  }
}
