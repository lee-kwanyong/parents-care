import { NextRequest, NextResponse } from 'next/server'
import { evaluateCareReportQuality } from '@/lib/anbu-care-report-quality'
import { supabaseInsert, supabasePatch, supabaseSelect, text } from '@/lib/anbu-integrations'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const allowedStatuses = new Set([
  'submitted',
  'approved',
  'needs_revision',
  'rejected',
  'hidden'
])

type Row = Record<string, unknown>

function guardianVisibleFromStatus(status: string) {
  return status === 'approved'
}

function toQualityInput(row: Row) {
  return {
    serviceSummary: text(row.service_summary),
    parentCondition: text(row.parent_condition),
    mealStatus: text(row.meal_status),
    medicationStatus: text(row.medication_status),
    hospitalResult: text(row.hospital_result),
    nextAction: text(row.next_action),
    photoNote: text(row.photo_note),
    guardianMessage: text(row.guardian_message)
  }
}

async function findReport(reportId: string) {
  const result = await supabaseSelect(
    'anbu_partner_task_reports?select=*&id=eq.' +
      encodeURIComponent(reportId) +
      '&limit=1'
  )

  if (!result.ok || !Array.isArray(result.data) || !result.data[0]) return null

  return result.data[0] as Row
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const reportId = text(body.reportId)
  const status = text(body.status)
  const reviewMemo = text(body.reviewMemo)
  const reviewerName = text(body.reviewerName) || '운영실'
  const forceApprove = body.forceApprove === true

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

  const report = await findReport(reportId)

  if (!report) {
    return NextResponse.json(
      { ok: false, message: '리포트를 찾지 못했습니다.' },
      { status: 404 }
    )
  }

  const quality = evaluateCareReportQuality(toQualityInput(report))

  if (status === 'approved' && quality.qualityStatus === 'block' && !forceApprove) {
    return NextResponse.json(
      {
        ok: false,
        message: '의료판단 표현 또는 개인정보 가능성이 감지되어 바로 승인할 수 없습니다. 수정요청 또는 반려를 권장합니다.',
        quality
      },
      { status: 409 }
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
      updated_at: reviewedAt,
      quality_status: quality.qualityStatus,
      quality_score: quality.qualityScore,
      quality_flags: quality.flags,
      ops_checklist: quality.checklist,
      quality_checked_at: quality.checkedAt
    }
  )

  if (!result.ok) {
    const fallback = await supabasePatch(
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

    if (!fallback.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '리포트 검수 상태 저장 중 오류가 발생했습니다. Supabase SQL을 먼저 실행해주세요.',
          detail: fallback.error,
          quality
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      message: '리포트 검수 상태가 저장되었습니다. 품질 컬럼 SQL은 아직 적용되지 않았습니다.',
      quality,
      report: Array.isArray(fallback.data) ? fallback.data[0] : fallback.data
    })
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
      quality,
      reviewedAt
    })
  }).catch(() => null)

  return NextResponse.json({
    ok: true,
    message:
      status === 'approved'
        ? '리포트가 승인되어 보호자에게 공개됩니다.'
        : '리포트 검수 상태가 저장되었습니다.',
    quality,
    report: Array.isArray(result.data) ? result.data[0] : result.data
  })
}
