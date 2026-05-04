import { NextResponse } from 'next/server'
import { createCostApprovalDraft } from '@/lib/integrations/payments'
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  return NextResponse.json({ ok: true, approval: createCostApprovalDraft({ label: body.label ?? '추가 비용', estimatedAmount: Number(body.estimatedAmount ?? 0), reason: body.reason ?? '보호자 승인 필요' }) })
}
