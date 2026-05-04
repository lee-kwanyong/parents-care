import { NextResponse } from 'next/server'
import {
  buildDeployEnvChecks,
  buildDeploySummary,
  normalizeSupabaseUrl,
  type DeployCheck
} from '@/lib/deploy-readiness-engine'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function checkSupabaseRest(): Promise<DeployCheck> {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  if (!rawUrl || !serviceKey) {
    return {
      key: 'SUPABASE_REST_CONNECTION',
      label: 'Supabase REST 연결',
      group: 'supabase',
      status: 'fail',
      message: 'Supabase URL 또는 API Key가 없어 연결을 확인할 수 없습니다.'
    }
  }

  const baseUrl = normalizeSupabaseUrl(rawUrl)

  try {
    const response = await fetch(
      baseUrl + '/rest/v1/care_qa_scenarios?select=id&limit=1',
      {
        headers: {
          apikey: serviceKey,
          Authorization: 'Bearer ' + serviceKey
        },
        cache: 'no-store'
      }
    )

    if (response.ok) {
      return {
        key: 'SUPABASE_REST_CONNECTION',
        label: 'Supabase REST 연결',
        group: 'supabase',
        status: 'pass',
        message: 'Supabase REST API 연결과 QA 테이블 조회가 가능합니다.'
      }
    }

    const detail = await response.text().catch(() => '')

    return {
      key: 'SUPABASE_REST_CONNECTION',
      label: 'Supabase REST 연결',
      group: 'supabase',
      status: response.status === 404 ? 'warning' : 'fail',
      message: response.status === 404
        ? 'Supabase 연결은 됐지만 QA 테이블을 찾지 못했습니다. SQL migration 실행 여부를 확인하세요.'
        : 'Supabase REST API 확인 실패: ' + detail.slice(0, 180)
    }
  } catch (error) {
    return {
      key: 'SUPABASE_REST_CONNECTION',
      label: 'Supabase REST 연결',
      group: 'supabase',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Supabase 연결 실패'
    }
  }
}

async function checkSupabaseStorage(): Promise<DeployCheck> {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!rawUrl || !serviceKey) {
    return {
      key: 'SUPABASE_STORAGE_BUCKET',
      label: 'Supabase Storage',
      group: 'storage',
      status: 'fail',
      message: 'Storage 확인에는 Supabase URL과 Service Role Key가 필요합니다.'
    }
  }

  const baseUrl = normalizeSupabaseUrl(rawUrl)

  try {
    const response = await fetch(
      baseUrl + '/storage/v1/bucket/care-files',
      {
        headers: {
          apikey: serviceKey,
          Authorization: 'Bearer ' + serviceKey
        },
        cache: 'no-store'
      }
    )

    if (response.ok) {
      return {
        key: 'SUPABASE_STORAGE_BUCKET',
        label: 'care-files Storage bucket',
        group: 'storage',
        status: 'pass',
        message: 'care-files Storage bucket을 확인했습니다.'
      }
    }

    const detail = await response.text().catch(() => '')

    return {
      key: 'SUPABASE_STORAGE_BUCKET',
      label: 'care-files Storage bucket',
      group: 'storage',
      status: response.status === 404 ? 'warning' : 'fail',
      message: response.status === 404
        ? 'care-files bucket이 없습니다. STEP28 Storage SQL을 실행하세요.'
        : 'Storage bucket 확인 실패: ' + detail.slice(0, 180)
    }
  } catch (error) {
    return {
      key: 'SUPABASE_STORAGE_BUCKET',
      label: 'care-files Storage bucket',
      group: 'storage',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Storage 연결 실패'
    }
  }
}

export async function GET() {
  const envChecks = buildDeployEnvChecks({
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    CRON_SECRET: process.env.CRON_SECRET,
    KAKAO_ALIMTALK_API_KEY: process.env.KAKAO_ALIMTALK_API_KEY,
    KAKAO_CHANNEL_ID: process.env.KAKAO_CHANNEL_ID,
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
    SERPAPI_API_KEY: process.env.SERPAPI_API_KEY,
    PAYMENT_PROVIDER_SECRET: process.env.PAYMENT_PROVIDER_SECRET,
    ESIGN_PROVIDER_SECRET: process.env.ESIGN_PROVIDER_SECRET,
    NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SERVICE_ROLE_KEY: process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY,
    VERCEL_ENV: process.env.VERCEL_ENV || 'local'
  })

  const [restCheck, storageCheck] = await Promise.all([
    checkSupabaseRest(),
    checkSupabaseStorage()
  ])

  const checks = [...envChecks, restCheck, storageCheck]
  const summary = buildDeploySummary(checks)

  return NextResponse.json({
    ok: true,
    summary,
    checks,
    system: {
      vercelEnv: process.env.VERCEL_ENV || 'local',
      vercelUrlPresent: Boolean(process.env.VERCEL_URL),
      nodeEnv: process.env.NODE_ENV || 'unknown'
    }
  })
}
