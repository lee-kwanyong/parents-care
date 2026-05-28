import { NextRequest, NextResponse } from 'next/server'
import { supabaseSelect } from '@/lib/anbu-integrations'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get('status') || ''
  const region = request.nextUrl.searchParams.get('region') || ''

  let path = 'anbu_care_partner_applications?select=*&order=created_at.desc&limit=300'

  if (status) {
    path += '&verification_status=eq.' + encodeURIComponent(status)
  }

  const result = await supabaseSelect(path)

  if (!result.ok || !Array.isArray(result.data)) {
    return NextResponse.json({
      ok: false,
      message: '케어파트너 목록을 불러오지 못했습니다.',
      detail: result.error,
      partners: []
    })
  }

  let partners = result.data as Array<Record<string, unknown>>

  if (region) {
    partners = partners.filter((partner) =>
      String(partner.region || '').includes(region) || region.includes(String(partner.region || ''))
    )
  }

  return NextResponse.json({
    ok: true,
    partners
  })
}
