import { NextRequest, NextResponse } from 'next/server'
import { supabaseSelect, text } from '@/lib/anbu-integrations'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const severity = request.nextUrl.searchParams.get('severity') || ''
  const action = request.nextUrl.searchParams.get('action') || ''
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || 300), 500)

  let path = 'anbu_audit_logs?select=*&order=created_at.desc&limit=' + encodeURIComponent(String(limit))

  if (severity) {
    path += '&severity=eq.' + encodeURIComponent(severity)
  }

  if (action) {
    path += '&action=eq.' + encodeURIComponent(action)
  }

  const result = await supabaseSelect(path)

  if (!result.ok || !Array.isArray(result.data)) {
    return NextResponse.json({
      ok: false,
      message: '감사 로그를 불러오지 못했습니다. Supabase SQL을 먼저 실행해주세요.',
      detail: result.error,
      logs: []
    })
  }

  const logs = result.data as Array<Record<string, unknown>>

  const summary = {
    total: logs.length,
    info: logs.filter((row) => text(row.severity) === 'info').length,
    warning: logs.filter((row) => text(row.severity) === 'warning').length,
    critical: logs.filter((row) => text(row.severity) === 'critical').length,
    failed: logs.filter((row) => text(row.status) === 'failed').length
  }

  return NextResponse.json({
    ok: true,
    summary,
    logs
  })
}
