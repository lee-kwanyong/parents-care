import { NextRequest, NextResponse } from 'next/server'
import { defaultParentConsent, normalizeConsent } from '@/lib/anbu-consent'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!raw) return ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

async function rest(path: string, init?: RequestInit) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      data: null as unknown,
      error: 'Supabase env is missing'
    }
  }

  const response = await fetch(base + '/rest/v1/' + path, {
    ...init,
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    },
    cache: 'no-store'
  })

  const bodyText = await response.text()
  let parsed: unknown = null

  try {
    parsed = bodyText ? JSON.parse(bodyText) : null
  } catch {
    parsed = bodyText
  }

  return {
    ok: response.ok,
    data: parsed,
    error: response.ok ? null : parsed || bodyText
  }
}

async function findFamily(request: NextRequest, requestedCode = '') {
  const familyCode =
    requestedCode ||
    request.nextUrl.searchParams.get('familyCode') ||
    request.cookies.get('anbu_family_code')?.value ||
    request.cookies.get('pc_parent_invite_code')?.value ||
    ''

  if (familyCode) {
    const found = await rest(
      'anbu_family_links?select=*&family_code=eq.' +
        encodeURIComponent(familyCode) +
        '&limit=1'
    )

    if (found.ok && Array.isArray(found.data) && found.data[0]) {
      return found.data[0] as Record<string, unknown>
    }

    return {
      family_code: familyCode,
      parent_name: '부모님',
      guardian_name: '보호자'
    }
  }

  return null
}

export async function GET(request: NextRequest) {
  const family = await findFamily(request)
  const familyCode = text(family?.family_code)

  if (!familyCode) {
    return NextResponse.json({
      ok: true,
      empty: true,
      message: '가족 연결코드가 없습니다. 부모님 6자리 코드를 입력하면 동의 설정을 저장할 수 있습니다.',
      family: null,
      consent: defaultParentConsent
    })
  }

  const consentResult = await rest(
    'anbu_parent_consents?select=*&family_code=eq.' +
      encodeURIComponent(familyCode) +
      '&order=updated_at.desc&limit=1'
  )

  const consentRow =
    consentResult.ok && Array.isArray(consentResult.data) && consentResult.data[0]
      ? consentResult.data[0] as Record<string, unknown>
      : null

  const settings =
    consentRow && typeof consentRow.consent_settings === 'object'
      ? normalizeConsent(consentRow.consent_settings as any)
      : defaultParentConsent

  return NextResponse.json({
    ok: true,
    family,
    consent: settings,
    row: consentRow,
    diagnostics: {
      consentOk: consentResult.ok,
      consentError: consentResult.ok ? null : consentResult.error
    }
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const familyCode = text(body.familyCode)
  const parentName = text(body.parentName)
  const consent = normalizeConsent(body.consentSettings || body.consent)

  if (!/^\d{6}$/.test(familyCode)) {
    return NextResponse.json(
      { ok: false, message: '6자리 가족 연결코드를 입력해주세요.' },
      { status: 400 }
    )
  }

  const family = await findFamily(request, familyCode)

  const payload = {
    family_code: familyCode,
    parent_name: parentName || text(family?.parent_name) || '부모님',
    consent_settings: consent,
    consent_status: 'active',
    updated_at: new Date().toISOString()
  }

  const result = await rest('anbu_parent_consents?on_conflict=family_code', {
    method: 'POST',
    headers: {
      Prefer: 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify([payload])
  })

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '안심동의 저장 중 오류가 발생했습니다. Supabase SQL을 먼저 실행해주세요.',
        detail: result.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    message: '부모님 안심동의 설정이 저장되었습니다.',
    family,
    consent,
    row: Array.isArray(result.data) ? result.data[0] : result.data
  })
}
