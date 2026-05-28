import { NextResponse } from 'next/server'
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

export async function GET() {
  const requestsResult = await supabaseSelect(
    'anbu_care_requests?select=*&order=created_at.desc&limit=300'
  )

  const matchesResult = await supabaseSelect(
    'anbu_partner_matches?select=*&order=created_at.desc&limit=300'
  )

  const partnersResult = await supabaseSelect(
    'anbu_care_partner_applications?select=*&order=created_at.desc&limit=300'
  )

  const reportsResult = await supabaseSelect(
    'anbu_partner_task_reports?select=*&order=created_at.desc&limit=300'
  )

  const requests = requestsResult.ok && Array.isArray(requestsResult.data) ? requestsResult.data as Row[] : []
  const matches = matchesResult.ok && Array.isArray(matchesResult.data) ? matchesResult.data as Row[] : []
  const partners = partnersResult.ok && Array.isArray(partnersResult.data) ? partnersResult.data as Row[] : []
  const reports = reportsResult.ok && Array.isArray(reportsResult.data) ? reportsResult.data as Row[] : []

  const partnerMap = new Map(partners.map((partner) => [rowId(partner), partner]))

  const enrichedRequests = requests.map((request) => {
    const requestId = rowId(request)
    const requestMatches = matches.filter((match) => text(match.request_id) === requestId)

    const enrichedMatches = requestMatches.map((match) => {
      const matchId = rowId(match)
      const partner = partnerMap.get(text(match.partner_application_id)) || null
      const matchReports = reports.filter((report) => text(report.match_id) === matchId)

      return {
        ...match,
        partner,
        reports: matchReports
      }
    })

    return {
      ...request,
      matches: enrichedMatches
    }
  })

  return NextResponse.json({
    ok: true,
    requests: enrichedRequests,
    diagnostics: {
      requestsOk: requestsResult.ok,
      matchesOk: matchesResult.ok,
      partnersOk: partnersResult.ok,
      reportsOk: reportsResult.ok,
      requestsError: requestsResult.ok ? null : requestsResult.error,
      matchesError: matchesResult.ok ? null : matchesResult.error,
      partnersError: partnersResult.ok ? null : partnersResult.error,
      reportsError: reportsResult.ok ? null : reportsResult.error
    }
  })
}
