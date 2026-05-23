import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, svgCard } from "@/lib/naver-five-server";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string; idx: string }> }) {
  const { id, idx } = await context.params;
  const index = Number(idx || 0);
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("naver_five_daily_packages")
    .select("card_news")
    .eq("id", id)
    .single();

  if (error || !data) {
    return new NextResponse("not found", { status: 404 });
  }

  const cards = Array.isArray(data.card_news) ? data.card_news : [];
  const svg = svgCard(cards[index] || cards[0] || {}, index);

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
