import { NextResponse } from 'next/server'
import { enqueueKakaoAlimtalk } from '@/lib/integrations/kakao'
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const queued = await enqueueKakaoAlimtalk({ to: body.to ?? 'demo', templateCode: body.templateCode ?? 'CARE_UPDATE', variables: body.variables ?? {} })
  return NextResponse.json({ ok: true, queued })
}
