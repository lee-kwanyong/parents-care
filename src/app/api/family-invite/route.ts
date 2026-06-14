import { randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Row = Record<string, unknown>

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function cleanFamilyCode(value: unknown) {
  return text(value).replace(/[^\w-]/g, '').slice(0, 32)
}

function makeFamilyCode() {
  return `ANBU-${randomBytes(3).toString('hex').toUpperCase()}`
}

function supabaseBaseUrl() {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

function restBaseUrl() {
  const base = supabaseBaseUrl()
  return base ? `${base}/rest/v1` : ''
}

function maskName(value: unknown) {
  const name = text(value)

  if (!name) return ''
  if (name.length === 1) return name
  if (name.length === 2) return `${name[0]}*`

  return `${name[0]}*${name[name.length - 1]}`
}

function maskPhone(value: unknown) {
  const digits = text(value).replace(/[^\d]/g, '')

  if (digits.length >= 10) return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`
  if (digits.length >= 4) return `****-${digits.slice(-4)}`

  return ''
}

function makeLinks(familyCode: string, role = 'guardian') {
  const code = encodeURIComponent(familyCode)

  return {
    invite: `/invite?familyCode=${code}`,
    consent: `/consent?familyCode=${code}&role=${encodeURIComponent(role)}`,
    parent: `/mobile/parent?familyCode=${code}`,
    guardianToday: `/guardian/today?familyCode=${code}`,
    guardianRing: `/guardian/ring-report?familyCode=${code}`,
    proxyCheckin: `/guardian/proxy-checkin?familyCode=${code}`,
    guide: '/guide'
  }
}

function normalizeFamily(row: Row | null | undefined, fallbackCode = '') {
  return {
    familyCode: text(row?.family_code) || fallbackCode,
    parentName: maskName(row?.parent_name) || '부모님',
    guardianName: maskName(row?.guardian_name) || '보호자',
    parentPhoneMasked: maskPhone(row?.parent_phone),
    guardianPhoneMasked: maskPhone(row?.guardian_phone),
    parentJoined: Boolean(row?.parent_joined_at || row?.parent_verified_at),
    guardianJoined: Boolean(row?.guardian_joined_at || row?.guardian_verified_at)
  }
}

async function restRows(table: string, params: Record<string, string>): Promise<{ ok: boolean; rows: Row[]; error?: string }> {
  const base = restBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      rows: [],
      error: 'Supabase URL 또는 service role key가 설정되지 않았습니다.'
    }
  }

  const search = new URLSearchParams(params)

  try {
    const response = await fetch(`${base}/${table}?${search.toString()}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    })

    const raw = await response.text()
    let parsed: unknown = []

    try {
      parsed = raw ? JSON.parse(raw) : []
    } catch {
      parsed = []
    }

    if (!response.ok) {
      return {
        ok: false,
        rows: [],
        error: `${table}: ${response.status} ${raw.slice(0, 220)}`
      }
    }

    return {
      ok: true,
      rows: Array.isArray(parsed) ? parsed as Row[] : []
    }
  } catch (error) {
    return {
      ok: false,
      rows: [],
      error: `${table}: ${error instanceof Error ? error.message : 'fetch failed'}`
    }
  }
}

async function insertAdaptive(table: string, attempts: Row[]) {
  const base = restBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return {
      ok: false,
      rows: [] as Row[],
      error: 'Supabase URL 또는 service role key가 설정되지 않았습니다.'
    }
  }

  let lastError = ''

  for (const body of attempts) {
    try {
      const response = await fetch(`${base}/${table}`, {
        method: 'POST',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        },
        body: JSON.stringify(body),
        cache: 'no-store'
      })

      const raw = await response.text()
      let parsed: unknown = []

      try {
        parsed = raw ? JSON.parse(raw) : []
      } catch {
        parsed = []
      }

      if (response.ok) {
        return {
          ok: true,
          rows: Array.isArray(parsed) ? parsed as Row[] : []
        }
      }

      lastError = raw.slice(0, 240)
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'insert failed'
    }
  }

  return {
    ok: false,
    rows: [] as Row[],
    error: lastError || 'insert failed'
  }
}

async function patchFamily(familyCode: string, body: Row) {
  const base = restBaseUrl()
  const key = serviceKey()

  if (!base || !key || !familyCode) {
    return {
      ok: false,
      error: 'Supabase URL 또는 service role key가 설정되지 않았습니다.'
    }
  }

  try {
    const response = await fetch(`${base}/anbu_family_links?family_code=eq.${encodeURIComponent(familyCode)}`, {
      method: 'PATCH',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify(body),
      cache: 'no-store'
    })

    const raw = await response.text()

    if (!response.ok) {
      return {
        ok: false,
        error: raw.slice(0, 240)
      }
    }

    return {
      ok: true
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'patch failed'
    }
  }
}

export async function GET(request: NextRequest) {
  const familyCode = cleanFamilyCode(request.nextUrl.searchParams.get('familyCode'))

  if (!familyCode) {
    return NextResponse.json({
      ok: true,
      demo: true,
      family: normalizeFamily(null, ''),
      links: makeLinks('', 'guardian'),
      sourceErrors: []
    })
  }

  const familyResult = await restRows('anbu_family_links', {
    select: '*',
    family_code: `eq.${familyCode}`,
    order: 'created_at.desc',
    limit: '1'
  })

  const sourceErrors = familyResult.ok ? [] : [familyResult.error].filter(Boolean)

  return NextResponse.json({
    ok: true,
    demo: !familyResult.rows[0],
    family: normalizeFamily(familyResult.rows[0], familyCode),
    links: makeLinks(familyCode, 'guardian'),
    sourceErrors
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const action = text(body.action)

  if (action === 'create') {
    const requestedCode = cleanFamilyCode(body.familyCode)
    const familyCode = requestedCode || makeFamilyCode()
    const parentName = text(body.parentName) || '부모님'
    const guardianName = text(body.guardianName) || '보호자'
    const parentPhone = text(body.parentPhone)
    const guardianPhone = text(body.guardianPhone)
    const role = text(body.role) || 'guardian'

    const existing = await restRows('anbu_family_links', {
      select: '*',
      family_code: `eq.${familyCode}`,
      order: 'created_at.desc',
      limit: '1'
    })

    if (existing.ok && existing.rows[0]) {
      await patchFamily(familyCode, {
        parent_name: parentName,
        guardian_name: guardianName,
        parent_phone: parentPhone || null,
        guardian_phone: guardianPhone || null,
        updated_at: new Date().toISOString()
      })

      return NextResponse.json({
        ok: true,
        persisted: true,
        reused: true,
        family: normalizeFamily({
          ...existing.rows[0],
          parent_name: parentName,
          guardian_name: guardianName,
          parent_phone: parentPhone,
          guardian_phone: guardianPhone
        }, familyCode),
        links: makeLinks(familyCode, role)
      })
    }

    const fullRow = {
      family_code: familyCode,
      parent_name: parentName,
      guardian_name: guardianName,
      parent_phone: parentPhone || null,
      guardian_phone: guardianPhone || null,
      source: 'onboarding',
      payload: {
        createdFrom: 'family-invite-flow',
        role
      }
    }

    const result = await insertAdaptive('anbu_family_links', [
      fullRow,
      {
        family_code: familyCode,
        parent_name: parentName,
        guardian_name: guardianName,
        parent_phone: parentPhone || null,
        guardian_phone: guardianPhone || null,
        source: 'onboarding'
      },
      {
        family_code: familyCode,
        parent_name: parentName,
        guardian_name: guardianName
      },
      {
        family_code: familyCode
      }
    ])

    const row = result.rows[0] || fullRow

    return NextResponse.json({
      ok: true,
      persisted: result.ok,
      warning: result.ok ? null : result.error || '서버 저장에 실패했지만 가족코드는 생성되었습니다.',
      family: normalizeFamily(row, familyCode),
      links: makeLinks(familyCode, role)
    })
  }

  if (action === 'join') {
    const familyCode = cleanFamilyCode(body.familyCode)
    const role = text(body.role) || 'guardian'

    if (!familyCode) {
      return NextResponse.json(
        {
          ok: false,
          message: '가족코드가 필요합니다.'
        },
        { status: 400 }
      )
    }

    const patch: Row = {
      updated_at: new Date().toISOString()
    }

    if (role === 'parent') patch.parent_joined_at = new Date().toISOString()
    if (role === 'guardian') patch.guardian_joined_at = new Date().toISOString()

    const result = await patchFamily(familyCode, patch)

    return NextResponse.json({
      ok: true,
      persisted: result.ok,
      warning: result.ok ? null : result.error || '서버 저장에 실패했지만 이 기기에는 가족코드를 저장합니다.',
      links: makeLinks(familyCode, role)
    })
  }

  if (action === 'consent') {
    const familyCode = cleanFamilyCode(body.familyCode)
    const role = text(body.role) || 'guardian'
    const agreed = Boolean(body.agreed)
    const items = body.items && typeof body.items === 'object' ? body.items as Row : {}

    if (!familyCode) {
      return NextResponse.json(
        {
          ok: false,
          message: '가족코드가 필요합니다.'
        },
        { status: 400 }
      )
    }

    const result = await insertAdaptive('anbu_family_consents', [
      {
        family_code: familyCode,
        role,
        agreed,
        consent_items: items,
        payload: {
          source: 'consent-page',
          userAgent: request.headers.get('user-agent') || ''
        }
      },
      {
        family_code: familyCode,
        role,
        agreed,
        consent_items: items
      },
      {
        family_code: familyCode,
        role,
        agreed
      },
      {
        family_code: familyCode
      }
    ])

    await patchFamily(familyCode, {
      updated_at: new Date().toISOString(),
      ...(role === 'parent' ? { parent_verified_at: new Date().toISOString() } : {}),
      ...(role === 'guardian' ? { guardian_verified_at: new Date().toISOString() } : {})
    })

    return NextResponse.json({
      ok: true,
      persisted: result.ok,
      warning: result.ok ? null : result.error || '서버 저장에 실패했지만 이 기기에는 동의 상태를 저장합니다.',
      links: makeLinks(familyCode, role)
    })
  }

  return NextResponse.json(
    {
      ok: false,
      message: '알 수 없는 action입니다.'
    },
    { status: 400 }
  )
}
