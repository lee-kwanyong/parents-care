import { NextRequest, NextResponse } from "next/server";
import { adminOrCronOk, runAutoLoop } from "@/lib/autoloop-server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!adminOrCronOk(req.nextUrl.searchParams.get("key"), req.headers.get("authorization"))) {
    return NextResponse.json({ ok: false, detail: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await runAutoLoop();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, detail: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
