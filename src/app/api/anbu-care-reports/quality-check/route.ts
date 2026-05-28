import { NextRequest, NextResponse } from 'next/server'
import { evaluateCareReportQuality } from '@/lib/anbu-care-report-quality'
import { supabasePatch, supabaseSelect, text } from '@/lib/anbu-integrations'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Row = Record<string, unknown>

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

  let quality

  if (reportId) {
    const report = await findReport(reportId)

    if (!report) {
      return NextResponse.json(
        { ok: false, message: '리포트를 찾지 못했습니다.' },
        { status: 404 }
      )
    }

    quality = evaluateCareReportQuality(toQualityInput(report))

    const patch = await supabasePatch(
      'anbu_partner_task_reports?id=eq.' + encodeURIComponent(reportId),
      {
        quality_status: quality.qualityStatus,
        quality_score: quality.qualityScore,
        quality_flags: quality.flags,
        ops_checklist: quality.checklist,
        quality_checked_at: quality.checkedAt,
        updated_at: new Date().toISOString()
      }
    )

    return NextResponse.json({
      ok: patch.ok,
      reportId,
      quality,
      patch
    })
  }

  quality = evaluateCareReportQuality({
    serviceSummary: text(body.serviceSummary),
    parentCondition: text(body.parentCondition),
    mealStatus: text(body.mealStatus),
    medicationStatus: text(body.medicationStatus),
    hospitalResult: text(body.hospitalResult),
    nextAction: text(body.nextAction),
    photoNote: text(body.photoNote),
    guardianMessage: text(body.guardianMessage)
  })

  return NextResponse.json({
    ok: true,
    quality
  })
}
