import { NextRequest, NextResponse } from 'next/server'
import { supabaseSelect } from '@/lib/anbu-integrations'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Row = Record<string, unknown>

function rowId(row: Row) {
  return typeof row.id === 'string' ? row.id : ''
}

function text(value: unknown) {
  return typeof value === 'string' ? value : ''
}

export async function GET(request: NextRequest) {
  const partnerId = request.nextUrl.searchParams.get('partnerId') || ''

  let matchesPath = 'anbu_partner_matches?select=*&order=created_at.desc&limit=300'

  if (partnerId) {
    matchesPath += '&partner_application_id=eq.' + encodeURIComponent(partnerId)
  }

  const matchesResult = await supabaseSelect(matchesPath)
  const requestsResult = await supabaseSelect(
    'anbu_care_requests?select=*&order=created_at.desc&limit=500'
  )
  const partnersResult = await supabaseSelect(
    'anbu_care_partner_applications?select=*&order=created_at.desc&limit=500'
  )
  const reportsResult = await supabaseSelect(
    'anbu_partner_task_reports?select=*&order=created_at.desc&limit=500'
  )

  const matches = matchesResult.ok && Array.isArray(matchesResult.data) ? matchesResult.data as Row[] : []
  const requests = requestsResult.ok && Array.isArray(requestsResult.data) ? requestsResult.data as Row[] : []
  const partners = partnersResult.ok && Array.isArray(partnersResult.data) ? partnersResult.data as Row[] : []
  const reports = reportsResult.ok && Array.isArray(reportsResult.data) ? reportsResult.data as Row[] : []

  const requestMap = new Map(requests.map((item) => [rowId(item), item]))
  const partnerMap = new Map(partners.map((item) => [rowId(item), item]))

  const tasks = matches.map((match) => {
    const matchId = rowId(match)

    return {
      match,
      request: requestMap.get(text(match.request_id)) || null,
      partner: partnerMap.get(text(match.partner_application_id)) || null,
      reports: reports.filter((report) => text(report.match_id) === matchId)
    }
  })

  return NextResponse.json({
    ok: true,
    tasks,
    diagnostics: {
      matchesOk: matchesResult.ok,
      requestsOk: requestsResult.ok,
      partnersOk: partnersResult.ok,
      reportsOk: reportsResult.ok,
      matchesError: matchesResult.ok ? null : matchesResult.error,
      reportsError: reportsResult.ok ? null : reportsResult.error
    }
  })
}
