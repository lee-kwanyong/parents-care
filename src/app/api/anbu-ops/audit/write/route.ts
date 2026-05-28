import { NextRequest, NextResponse } from 'next/server'
import { recordAudit } from '@/lib/anbu-audit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const action = text(body.action) || 'ops_manual_memo'
  const memo = text(body.memo)
  const severity = text(body.severity) || 'info'
  const actorName = text(body.actorName) || '운영실'

  if (!memo) {
    return NextResponse.json(
      { ok: false, message: '메모 내용을 입력해주세요.' },
      { status: 400 }
    )
  }

  const audit = await recordAudit(request, {
    actorRole: 'ops',
    actorName,
    action,
    targetType: text(body.targetType) || 'ops_memo',
    targetId: text(body.targetId) || '',
    status: 'ok',
    severity: severity === 'critical' ? 'critical' : severity === 'warning' ? 'warning' : 'info',
    memo,
    metadata: {
      source: 'ops-audit-manual',
      body
    }
  })

  return NextResponse.json({
    ok: audit.ok,
    message: audit.ok ? '감사 로그가 저장되었습니다.' : '감사 로그 저장에 실패했습니다.',
    audit
  })
}
