export type SupabaseRestResult = {
  ok: boolean
  data: unknown
  error: unknown
  status?: number
}

export function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!raw) return ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

export function supabaseServiceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

export function hasSupabaseServerEnv() {
  return Boolean(supabaseBaseUrl() && supabaseServiceKey())
}

export async function supabaseRest(path: string, init?: RequestInit): Promise<SupabaseRestResult> {
  const base = supabaseBaseUrl()
  const key = supabaseServiceKey()

  if (!base || !key) {
    return {
      ok: false,
      data: null,
      error: 'NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.'
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
    status: response.status,
    data: parsed,
    error: response.ok ? null : parsed || bodyText
  }
}

export function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function bool(value: unknown) {
  return value === true || value === 'true' || value === 'on' || value === '1'
}

export function firstRow<T>(data: unknown): T | null {
  return Array.isArray(data) && data.length > 0 ? (data[0] as T) : null
}

export function requireAdminCode(inputCode: string) {
  const expectedCode = process.env.ANBU_ADMIN_CODE || process.env.PARENTS_CARE_ADMIN_CODE || ''

  if (!expectedCode) {
    return {
      ok: false,
      status: 500,
      message: 'ANBU_ADMIN_CODE 또는 PARENTS_CARE_ADMIN_CODE 환경변수가 필요합니다.'
    }
  }

  if (inputCode !== expectedCode) {
    return {
      ok: false,
      status: 401,
      message: '관리자 코드가 올바르지 않습니다.'
    }
  }

  return {
    ok: true,
    status: 200,
    message: 'OK'
  }
}
