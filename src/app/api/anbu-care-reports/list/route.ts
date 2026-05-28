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
  const familyCode = request.nextUrl.searchParams.get('familyCode') || ''

  let requestsPath = 'anbu_care_requests?select=*&order=created_at.desc&limit=300'

  if (familyCode) {
    requestsPath += '&family_code=eq.' + encodeURIComponent(familyCode)
  }

  const requestsResult = await supabaseSelect(requestsPath)
  const reportsResult = await supabaseSelect(
    'anbu_partner_task_reports?select=*&order=created_at.desc&limit=500'
  )
  const partnersResult = await supabaseSelect(
    'anbu_care_partner_applications?select=*&order=created_at.desc&limit=500'
  )
  const matchesResult = await supabaseSelect(
    'anbu_partner_matches?select=*&order=created_at.desc&limit=500'
  )

  const requests = requestsResult.ok && Array.isArray(requestsResult.data) ? requestsResult.data as Row[] : []
  const reports = reportsResult.ok && Array.isArray(reportsResult.data) ? reportsResult.data as Row[] : []
  const partners = partnersResult.ok && Array.isArray(partnersResult.data) ? partnersResult.data as Row[] : []
  const matches = matchesResult.ok && Array.isArray(matchesResult.data) ? matchesResult.data as Row[] : []

  const requestMap = new Map(requests.map((item) => [rowId(item), item]))
  const partnerMap = new Map(partners.map((item) => [rowId(item), item]))
  const matchMap = new Map(matches.map((item) => [rowId(item), item]))

  const visibleRequestIds = new Set(requests.map(rowId))

  const careReports = reports
    .filter((report) => !familyCode || visibleRequestIds.has(text(report.request_id)))
    .map((report) => {
      const match = matchMap.get(text(report.match_id)) || null
      const requestRow = requestMap.get(text(report.request_id)) || null
      const partner = partnerMap.get(text(report.partner_application_id)) || null

      return {
        ...report,
        match,
        request: requestRow,
        partner
      }
    })

  return NextResponse.json({
    ok: true,
    reports: careReports,
    diagnostics: {
      requestsOk: requestsResult.ok,
      reportsOk: reportsResult.ok,
      partnersOk: partnersResult.ok,
      matchesOk: matchesResult.ok
    }
  })
}
