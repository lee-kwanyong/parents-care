import { NextRequest, NextResponse } from 'next/server'
import { supabaseInsert, supabasePatch, text } from '@/lib/anbu-integrations'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const allowedStatuses = new Set([
  'submitted',
  'approved',
  'needs_revision',
  'rejected',
  'hidden'
])

function guardianVisibleFromStatus(status: string) {
  return status === 'approved'
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const reportId = text(body.reportId)
  const status = text(body.status)
  const reviewMemo = text(body.reviewMemo)
  const reviewerName = text(body.reviewerName) || '운영실'

  if (!reportId) {
    return NextResponse.json(
      { ok: false, message: '리포트 ID가 필요합니다.' },
      { status: 400 }
    )
  }

  if (!allowedStatuses.has(status)) {
    return NextResponse.json(
      { ok: false, message: '올바르지 않은 검수 상태입니다.' },
      { status: 400 }
    )
  }

  const reviewedAt = new Date().toISOString()

  const result = await supabasePatch(
    'anbu_partner_task_reports?id=eq.' + encodeURIComponent(reportId),
    {
      report_status: status,
      guardian_visible: guardianVisibleFromStatus(status),
      review_memo: reviewMemo || null,
      reviewed_by: reviewerName,
      reviewed_at: reviewedAt,
      updated_at: reviewedAt
    }
  )

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '리포트 검수 상태 저장 중 오류가 발생했습니다. Supabase SQL을 먼저 실행해주세요.',
        detail: result.error
      },
      { status: 500 }
    )
  }

  await supabaseInsert('anbu_audit_logs', {
    actor_role: 'ops',
    actor_name: reviewerName,
    action: 'care_report_review',
    target_type: 'anbu_partner_task_reports',
    target_id: reportId,
    memo: JSON.stringify({
      status,
      guardianVisible: guardianVisibleFromStatus(status),
      reviewMemo,
      reviewedAt
    })
  }).catch(() => null)

  return NextResponse.json({
    ok: true,
    message:
      status === 'approved'
        ? '리포트가 승인되어 보호자에게 공개됩니다.'
        : '리포트 검수 상태가 저장되었습니다.',
    report: Array.isArray(result.data) ? result.data[0] : result.data
  })
}
