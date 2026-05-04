export type FamilyRole =
  | 'primary_guardian'
  | 'guardian'
  | 'sibling'
  | 'spouse'
  | 'relative'
  | 'caregiver'
  | 'viewer'
  | 'ops'

export type PermissionLevel =
  | 'full'
  | 'care_summary'
  | 'tasks_only'
  | 'emergency_only'
  | 'custom'

export type FamilyMemberStatus = 'invited' | 'active' | 'paused' | 'removed'
export type InviteCodeStatus = 'active' | 'expired' | 'disabled'

export type CareFamilyGroup = {
  id: string
  family_name: string
  primary_elder_name: string
  primary_guardian_name: string | null
  primary_guardian_phone: string | null
  family_status: 'active' | 'paused' | 'archived'
  default_share_scope: Record<string, boolean>
  created_at: string
  updated_at: string
}

export type CareFamilyMember = {
  id: string
  family_group_id: string
  member_name: string
  member_phone: string | null
  family_role: FamilyRole
  permission_level: PermissionLevel
  can_view_today: boolean
  can_view_cases: boolean
  can_view_tasks: boolean
  can_manage_tasks: boolean
  can_view_reports: boolean
  can_view_costs: boolean
  can_approve_costs: boolean
  can_view_social_support: boolean
  can_invite_members: boolean
  status: FamilyMemberStatus
  memo: string | null
  joined_at: string
  last_seen_at: string | null
  created_at: string
  updated_at: string
}

export type CareFamilyInviteCode = {
  id: string
  family_group_id: string
  invite_code: string
  code_label: string
  invited_role: Exclude<FamilyRole, 'primary_guardian' | 'ops'>
  permission_level: PermissionLevel
  max_uses: number
  used_count: number
  status: InviteCodeStatus
  expires_at: string | null
  created_by_member_id: string | null
  created_at: string
  updated_at: string
}

export type CareFamilyJoinEvent = {
  id: string
  family_group_id: string
  family_member_id: string | null
  invite_code_id: string | null
  event_type: string
  title: string
  description: string | null
  actor_role: 'family' | 'ops' | 'system'
  created_at: string
}

export const familyRoleOptions: Array<{
  code: FamilyRole
  label: string
  description: string
}> = [
  {
    code: 'primary_guardian',
    label: '대표 보호자',
    description: '전체 조회, 가족 초대, 비용 승인 가능'
  },
  {
    code: 'guardian',
    label: '보호자',
    description: '요약, 케이스, 가족 할 일 확인'
  },
  {
    code: 'sibling',
    label: '형제자매',
    description: '가족 할 일과 요약 확인'
  },
  {
    code: 'spouse',
    label: '배우자',
    description: '부모님 케어 요약과 긴급 알림 확인'
  },
  {
    code: 'relative',
    label: '친척',
    description: '요약 중심 확인'
  },
  {
    code: 'caregiver',
    label: '돌봄 담당자',
    description: '할 일과 일정 중심 확인'
  },
  {
    code: 'viewer',
    label: '보기만',
    description: '오늘의 안심판과 요약만 확인'
  },
  {
    code: 'ops',
    label: '운영실',
    description: '운영실 관리용'
  }
]

export const permissionLevelOptions: Array<{
  code: PermissionLevel
  label: string
  description: string
}> = [
  {
    code: 'full',
    label: '전체 보기',
    description: '케이스, 리포트, 비용, 사회공헌, 가족 초대까지 확인'
  },
  {
    code: 'care_summary',
    label: '요약 보기',
    description: '오늘의 안심판, 케이스, 리포트 요약 확인'
  },
  {
    code: 'tasks_only',
    label: '할 일만 보기',
    description: '가족 할 일 담당과 완료 처리 중심'
  },
  {
    code: 'emergency_only',
    label: '긴급만 받기',
    description: '긴급 알림과 도움 요청 중심'
  },
  {
    code: 'custom',
    label: '직접 설정',
    description: '운영실 또는 대표 보호자가 권한을 조정'
  }
]

export function labelFamilyRole(role: string) {
  return familyRoleOptions.find((item) => item.code === role)?.label || role
}

export function labelPermissionLevel(level: string) {
  return permissionLevelOptions.find((item) => item.code === level)?.label || level
}

export function generateFamilyInviteCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'CARE-'

  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]
  }

  return code
}

export function defaultPermissionsForRole(role: FamilyRole, permissionLevel: PermissionLevel) {
  const base = {
    can_view_today: true,
    can_view_cases: true,
    can_view_tasks: true,
    can_manage_tasks: false,
    can_view_reports: true,
    can_view_costs: false,
    can_approve_costs: false,
    can_view_social_support: false,
    can_invite_members: false
  }

  if (role === 'primary_guardian' || permissionLevel === 'full') {
    return {
      ...base,
      can_manage_tasks: true,
      can_view_costs: true,
      can_approve_costs: true,
      can_view_social_support: true,
      can_invite_members: true
    }
  }

  if (permissionLevel === 'tasks_only' || role === 'caregiver') {
    return {
      ...base,
      can_view_cases: false,
      can_view_reports: false,
      can_manage_tasks: true
    }
  }

  if (permissionLevel === 'emergency_only') {
    return {
      ...base,
      can_view_cases: false,
      can_view_tasks: false,
      can_view_reports: false,
      can_view_costs: false,
      can_approve_costs: false,
      can_view_social_support: false,
      can_invite_members: false
    }
  }

  if (role === 'viewer') {
    return {
      ...base,
      can_view_tasks: false,
      can_view_reports: false
    }
  }

  return base
}

export function buildFamilySharingSummary(groups: CareFamilyGroup[], members: CareFamilyMember[], codes: CareFamilyInviteCode[]) {
  const activeMembers = members.filter((member) => member.status === 'active')
  const costApprovers = activeMembers.filter((member) => member.can_approve_costs)
  const taskManagers = activeMembers.filter((member) => member.can_manage_tasks)
  const activeCodes = codes.filter((code) => code.status === 'active' && code.used_count < code.max_uses)

  const reassuranceState =
    groups.length === 0
      ? '확인 필요'
      : activeMembers.length === 0
        ? '확인 필요'
        : costApprovers.length === 0
          ? '확인 필요'
          : '안심'

  const familyNextActions: string[] = []

  if (groups.length === 0) {
    familyNextActions.push('가족 공간을 먼저 만들어주세요.')
  }

  if (activeMembers.length <= 1) {
    familyNextActions.push('가족 공동조회 코드를 만들어 가족을 초대해주세요.')
  }

  if (costApprovers.length === 0) {
    familyNextActions.push('추가비용 승인 가능한 가족을 지정해주세요.')
  }

  if (taskManagers.length === 0) {
    familyNextActions.push('가족 할 일을 맡을 담당자를 지정해주세요.')
  }

  if (familyNextActions.length === 0) {
    familyNextActions.push('가족 공동조회 설정이 준비됐습니다.')
  }

  return {
    reassuranceState,
    groupTotal: groups.length,
    memberTotal: activeMembers.length,
    inviteCodeTotal: activeCodes.length,
    costApproverTotal: costApprovers.length,
    taskManagerTotal: taskManagers.length,
    familyNextActions: familyNextActions.slice(0, 3)
  }
}
