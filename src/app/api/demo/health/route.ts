import { NextResponse } from 'next/server'
import {
  buildDemoHealthSummary,
  demoHealthTargets,
  type DemoHealthCheck
} from '@/lib/demo-health-engine'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!raw) return ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

async function countTable(table: string) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      count: null,
      error: 'Supabase 환경변수가 없습니다.'
    }
  }

  const response = await fetch(base + '/rest/v1/' + table + '?select=id&limit=1', {
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      Prefer: 'count=exact'
    },
    cache: 'no-store'
  })

  const bodyText = await response.text().catch(() => '')

  if (!response.ok) {
    return {
      ok: false,
      count: null,
      error: bodyText || response.statusText
    }
  }

  const range = response.headers.get('content-range') || ''
  const totalText = range.includes('/') ? range.split('/').pop() || '' : ''
  const count = Number(totalText)

  if (Number.isFinite(count)) {
    return {
      ok: true,
      count,
      error: null
    }
  }

  try {
    const parsed = bodyText ? JSON.parse(bodyText) : []
    return {
      ok: true,
      count: Array.isArray(parsed) ? parsed.length : 0,
      error: null
    }
  } catch {
    return {
      ok: true,
      count: 0,
      error: null
    }
  }
}

async function checkStorageBucket(): Promise<DemoHealthCheck> {
  const base = supabaseBaseUrl()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!base || !key) {
    return {
      key: 'care_files_bucket',
      label: 'care-files Storage bucket',
      group: 'infra',
      status: 'fail',
      count: null,
      message: 'Storage 확인에는 Supabase URL과 Service Role Key가 필요합니다.',
      path: '/deploy-readiness'
    }
  }

  const response = await fetch(base + '/storage/v1/bucket/care-files', {
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key
    },
    cache: 'no-store'
  })

  if (response.ok) {
    return {
      key: 'care_files_bucket',
      label: 'care-files Storage bucket',
      group: 'infra',
      status: 'pass',
      count: 1,
      message: 'care-files bucket을 확인했습니다.',
      path: '/deploy-readiness'
    }
  }

  const detail = await response.text().catch(() => '')

  return {
    key: 'care_files_bucket',
    label: 'care-files Storage bucket',
    group: 'infra',
    status: response.status === 404 ? 'warning' : 'fail',
    count: 0,
    message: response.status === 404
      ? 'care-files bucket이 없습니다. STEP32 SQL을 먼저 실행하세요.'
      : 'Storage 확인 실패: ' + detail.slice(0, 160),
    path: '/deploy-readiness'
  }
}

export async function GET() {
  const checks: DemoHealthCheck[] = []

  for (const target of demoHealthTargets) {
    const result = await countTable(target.table)

    if (!result.ok) {
      checks.push({
        key: target.key,
        label: target.label,
        group: target.group,
        status: target.required ? 'fail' : 'warning',
        count: null,
        message: `${target.table} 확인 실패: ${String(result.error).slice(0, 160)}`,
        path: target.path
      })
      continue
    }

    const count = result.count || 0
    const passed = count >= target.minCount

    checks.push({
      key: target.key,
      label: target.label,
      group: target.group,
      status: passed ? 'pass' : target.required ? 'warning' : 'warning',
      count,
      message: passed
        ? `${count}건 확인됨`
        : `${target.minCount}건 이상 필요합니다. 현재 ${count}건입니다.`,
      path: target.path
    })
  }

  checks.push(await checkStorageBucket())

  const summary = buildDemoHealthSummary(checks)

  return NextResponse.json({
    ok: true,
    summary,
    checks,
    generatedAt: new Date().toISOString()
  })
}
