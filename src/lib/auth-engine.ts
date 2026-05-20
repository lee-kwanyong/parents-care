export type CareAuthRole = 'guardian' | 'family' | 'parent' | 'manager' | 'ops'

export type CareAuthProfile = {
  id: string
  user_id: string
  display_name: string | null
  phone: string | null
  email: string | null
  preferred_login_method: 'easy' | 'google' | 'kakao' | 'phone' | 'email_magic' | 'email_password'
  user_role: CareAuthRole
  onboarding_status: 'started' | 'profile_ready' | 'family_ready' | 'completed'
  easy_mode: boolean
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export const authRoleOptions: Array<{
  code: CareAuthRole
  label: string
  description: string
  homePath: string
}> = [
  {
    code: 'guardian',
    label: '자녀·보호자',
    description: '부모님 걱정을 맡기고 오늘의 안심판을 확인합니다.',
    homePath: '/child'
  },
  {
    code: 'family',
    label: '가족',
    description: '가족 공동조회와 가족 할 일을 함께 봅니다.',
    homePath: '/child/family'
  },
  {
    code: 'parent',
    label: '부모님',
    description: '큰 글씨 화면에서 오늘 일정과 도움 버튼만 봅니다.',
    homePath: '/parent/today'
  },
  {
    code: 'manager',
    label: '동행매니저',
    description: '오늘 배정과 현장 체크리스트를 확인합니다.',
    homePath: '/manager'
  },
  {
    code: 'ops',
    label: '운영실',
    description: '운영실 관제와 배정, 검증, 리포트를 관리합니다.',
    homePath: '/ops'
  }
]

export function labelAuthRole(role: string) {
  return authRoleOptions.find((item) => item.code === role)?.label || role
}

export function homePathForRole(role: string) {
  return authRoleOptions.find((item) => item.code === role)?.homePath || '/child'
}

export function normalizeKoreanPhoneNumber(input: string) {
  const digits = input.replace(/[^\d+]/g, '')

  if (!digits) return ''

  if (digits.startsWith('+')) return digits

  if (digits.startsWith('010')) {
    return '+82' + digits.slice(1)
  }

  if (digits.startsWith('82')) {
    return '+' + digits
  }

  return digits
}

export function displayPhone(input: string | null | undefined) {
  if (!input) return '연락처 없음'

  if (input.startsWith('+8210') && input.length >= 12) {
    return '010-' + input.slice(5, 9) + '-' + input.slice(9)
  }

  return input
}
