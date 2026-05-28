import { NextRequest, NextResponse } from 'next/server'
import { evaluateCareReportQuality } from '@/lib/anbu-care-report-quality'
import { supabaseInsert, supabasePatch, supabaseSelect, text } from '@/lib/anbu-integrations'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Row = Record<string, unknown>

async function findMatch(matchId: string) {
  const result = await supabaseSelect(
    'anbu_partner_matches?select=*&id=eq.' + encodeURIComponent(matchId) + '&limit=1'
  )

  if (!result.ok || !Array.isArray(result.data) || !result.data[0]) return null

  return result.data[0] as Row
}

async function insertReport(payload: Record<string, unknown>, fallbackPayload: Record<string, unknown>) {
  const first = await supabaseInsert('anbu_partner_task_reports', payload)

  if (first.ok) return first

  const fallback = await supabaseInsert('anbu_partner_task_reports', fallbackPayload)

  return fallback.ok ? fallback : first
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const matchId = text(body.matchId)

  if (!matchId) {
    return NextResponse.json(
      { ok: false, message: '배정 ID가 필요합니다.' },
      { status: 400 }
    )
  }

  const match = await findMatch(matchId)

  if (!match) {
    return NextResponse.json(
      { ok: false, message: '배정 정보를 찾지 못했습니다.' },
      { status: 404 }
    )
  }

  const requestId = text(body.requestId) || text(match.request_id)
  const partnerId = text(body.partnerId) || text(match.partner_application_id)

  const quality = evaluateCareReportQuality({
    serviceSummary: text(body.serviceSummary),
    parentCondition: text(body.parentCondition),
    mealStatus: text(body.mealStatus),
    medicationStatus: text(body.medicationStatus),
    hospitalResult: text(body.hospitalResult),
    nextAction: text(body.nextAction),
    photoNote: text(body.photoNote),
    guardianMessage: text(body.guardianMessage)
  })

  const basePayload = {
    match_id: matchId,
    request_id: requestId || null,
    partner_application_id: partnerId || null,
    report_status: 'submitted',
    guardian_visible: false,
    performed_at: text(body.performedAt) || new Date().toISOString(),
    service_summary: text(body.serviceSummary),
    parent_condition: text(body.parentCondition),
    meal_status: text(body.mealStatus),
    medication_status: text(body.medicationStatus),
    hospital_result: text(body.hospitalResult),
    next_action: text(body.nextAction),
    photo_note: text(body.photoNote),
    guardian_message: text(body.guardianMessage)
  }

  const payloadWithQuality = {
    ...basePayload,
    quality_status: quality.qualityStatus,
    quality_score: quality.qualityScore,
    quality_flags: quality.flags,
    ops_checklist: quality.checklist,
    quality_checked_at: quality.checkedAt
  }

  const report = await insertReport(payloadWithQuality, basePayload)

  if (!report.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '케어 리포트 저장 중 오류가 발생했습니다. Supabase SQL을 먼저 실행해주세요.',
        detail: report.error,
        quality
      },
      { status: 500 }
    )
  }

  await supabasePatch(
    'anbu_partner_matches?id=eq.' + encodeURIComponent(matchId),
    {
      match_status: 'report_submitted',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  )

  if (requestId) {
    await supabasePatch(
      'anbu_care_requests?id=eq.' + encodeURIComponent(requestId),
      {
        status: 'reported',
        updated_at: new Date().toISOString()
      }
    )
  }

  return NextResponse.json({
    ok: true,
    message: '케어 리포트가 저장되었습니다. 운영실 검수 후 보호자에게 공개됩니다.',
    quality,
    report: Array.isArray(report.data) ? report.data[0] : report.data
  })
}
