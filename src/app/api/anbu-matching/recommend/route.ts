import { NextRequest, NextResponse } from 'next/server'
import { supabaseSelect, text } from '@/lib/anbu-integrations'
import { partnerScore, parsePartnerMemo } from '@/lib/anbu-partner-matching'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const region = request.nextUrl.searchParams.get('region') || ''
  const requestType = request.nextUrl.searchParams.get('requestType') || ''

  const result = await supabaseSelect(
    'anbu_care_partner_applications?select=*&order=created_at.desc&limit=300'
  )

  if (!result.ok || !Array.isArray(result.data)) {
    return NextResponse.json({
      ok: false,
      message: '파트너 목록을 불러오지 못했습니다.',
      detail: result.error,
      recommendations: []
    })
  }

  const requestInfo = {
    region,
    requestType
  }

  const recommendations = (result.data as Array<Record<string, unknown>>)
    .filter((partner) => ['approved', 'active'].includes(text(partner.verification_status)))
    .map((partner) => {
      const score = partnerScore(partner, requestInfo)

      return {
        ...partner,
        parsedMemo: parsePartnerMemo(partner.memo),
        matchScore: score.score,
        matchReasons: score.reasons
      }
    })
    .filter((partner) => partner.matchScore > 0)
    .sort((a, b) => Number(b.matchScore || 0) - Number(a.matchScore || 0))
    .slice(0, 10)

  return NextResponse.json({
    ok: true,
    request: requestInfo,
    recommendations
  })
}
