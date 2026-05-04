import { NextRequest, NextResponse } from 'next/server'
import {
  defaultPermissionsForRole,
  generateFamilyInviteCode,
  type FamilyRole,
  type PermissionLevel
} from '@/lib/family-sharing-engine'

export const dynamic = 'force-dynamic'

const allowedRoles = new Set([
  'primary_guardian',
  'guardian',
  'sibling',
  'spouse',
  'relative',
  'caregiver',
  'viewer',
  'ops'
])

const allowedInviteRoles = new Set([
  'guardian',
  'sibling',
  'spouse',
  'relative',
  'caregiver',
  'viewer'
])

const allowedPermissionLevels = new Set([
  'full',
  'care_summary',
  'tasks_only',
  'emergency_only',
  'custom'
])

const allowedMemberStatuses = new Set(['invited', 'active', 'paused', 'removed'])
const allowedCodeStatuses = new Set(['active', 'expired', 'disabled'])

function supabaseBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!raw) return ''
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function intValue(value: unknown, fallback = 5) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(1, Math.floor(value))

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return Math.max(1, Math.floor(parsed))
  }

  return fallback
}

async function rest(path: string, init?: RequestInit) {
  const base = supabaseBaseUrl()
  const key = serviceKey()

  if (!base || !key) {
    return { ok: false, data: null as any, error: 'Supabase env is missing' }
  }

  const response = await fetch(base + '/rest/v1/' + path, {
    ...init,
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    }
  })

  const bodyText = await response.text()
  let parsed: any = null

  try {
    parsed = bodyText ? JSON.parse(bodyText) : null
  } catch {
    parsed = bodyText
  }

  if (!response.ok) {
    return { ok: false, data: parsed, error: parsed || bodyText }
  }

  return { ok: true, data: parsed, error: null }
}

async function latestFamilyGroupId() {
  const result = await rest('care_family_groups?select=id&order=created_at.desc&limit=1')
  if (!result.ok || !Array.isArray(result.data)) return ''
  return result.data[0]?.id || ''
}

async function createUniqueInviteCode() {
  for (let i = 0; i < 8; i += 1) {
    const code = generateFamilyInviteCode()
    const found = await rest('care_family_invite_codes?select=id&invite_code=eq.' + encodeURIComponent(code) + '&limit=1')

    if (found.ok && Array.isArray(found.data) && found.data.length === 0) {
      return code
    }
  }

  return generateFamilyInviteCode() + '-' + Date.now().toString().slice(-4)
}

async function insertFamilyEvent(input: {
  familyGroupId: string
  familyMemberId?: string | null
  inviteCodeId?: string | null
  eventType: string
  title: string
  description?: string | null
  actorRole?: 'family' | 'ops' | 'system'
}) {
  await rest('care_family_join_events', {
    method: 'POST',
    body: JSON.stringify([
      {
        family_group_id: input.familyGroupId,
        family_member_id: input.familyMemberId || null,
        invite_code_id: input.inviteCodeId || null,
        event_type: input.eventType,
        title: input.title,
        description: input.description || null,
        actor_role: input.actorRole || 'family'
      }
    ])
  })
}

export async function GET() {
  const groupSelect = [
    'id',
    'family_name',
    'primary_elder_name',
    'primary_guardian_name',
    'primary_guardian_phone',
    'family_status',
    'default_share_scope',
    'created_at',
    'updated_at'
  ].join(',')

  const memberSelect = [
    'id',
    'family_group_id',
    'member_name',
    'member_phone',
    'family_role',
    'permission_level',
    'can_view_today',
    'can_view_cases',
    'can_view_tasks',
    'can_manage_tasks',
    'can_view_reports',
    'can_view_costs',
    'can_approve_costs',
    'can_view_social_support',
    'can_invite_members',
    'status',
    'memo',
    'joined_at',
    'last_seen_at',
    'created_at',
    'updated_at'
  ].join(',')

  const codeSelect = [
    'id',
    'family_group_id',
    'invite_code',
    'code_label',
    'invited_role',
    'permission_level',
    'max_uses',
    'used_count',
    'status',
    'expires_at',
    'created_by_member_id',
    'created_at',
    'updated_at'
  ].join(',')

  const eventSelect = [
    'id',
    'family_group_id',
    'family_member_id',
    'invite_code_id',
    'event_type',
    'title',
    'description',
    'actor_role',
    'created_at'
  ].join(',')

  const [groups, members, codes, events] = await Promise.all([
    rest('care_family_groups?select=' + encodeURIComponent(groupSelect) + '&order=created_at.desc&limit=100'),
    rest('care_family_members?select=' + encodeURIComponent(memberSelect) + '&order=created_at.desc&limit=300'),
    rest('care_family_invite_codes?select=' + encodeURIComponent(codeSelect) + '&order=created_at.desc&limit=200'),
    rest('care_family_join_events?select=' + encodeURIComponent(eventSelect) + '&order=created_at.desc&limit=300')
  ])

  if (!groups.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: '가족 공동조회 정보를 불러오지 못했습니다. STEP27 SQL이 실행됐는지 확인해주세요.',
        detail: groups.error
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    groups: Array.isArray(groups.data) ? groups.data : [],
    members: members.ok && Array.isArray(members.data) ? members.data : [],
    codes: codes.ok && Array.isArray(codes.data) ? codes.data : [],
    events: events.ok && Array.isArray(events.data) ? events.data : []
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const action = text(body.action) || 'create_family'

  if (action === 'create_family') {
    const elderName = text(body.elderName) || '부모님'
    const guardianName = text(body.guardianName) || '대표 보호자'
    const guardianPhone = text(body.guardianPhone)

    const familyName = text(body.familyName) || `${elderName} 가족`

    const groupInsert = await rest('care_family_groups', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([
        {
          family_name: familyName,
          primary_elder_name: elderName,
          primary_guardian_name: guardianName,
          primary_guardian_phone: guardianPhone || null,
          family_status: 'active',
          created_by_role: 'family'
        }
      ])
    })

    if (!groupInsert.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '가족 공간 생성 중 오류가 발생했습니다.',
          detail: groupInsert.error
        },
        { status: 500 }
      )
    }

    const group = Array.isArray(groupInsert.data) ? groupInsert.data[0] : null

    if (!group?.id) {
      return NextResponse.json({ ok: false, message: '생성된 가족 공간을 찾지 못했습니다.' }, { status: 500 })
    }

    const permissions = defaultPermissionsForRole('primary_guardian', 'full')

    const memberInsert = await rest('care_family_members', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([
        {
          family_group_id: group.id,
          member_name: guardianName,
          member_phone: guardianPhone || null,
          family_role: 'primary_guardian',
          permission_level: 'full',
          ...permissions,
          status: 'active'
        }
      ])
    })

    const member = memberInsert.ok && Array.isArray(memberInsert.data) ? memberInsert.data[0] : null

    const inviteCode = await createUniqueInviteCode()

    const codeInsert = await rest('care_family_invite_codes', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([
        {
          family_group_id: group.id,
          invite_code: inviteCode,
          code_label: '가족 공동조회 코드',
          invited_role: 'guardian',
          permission_level: 'care_summary',
          max_uses: 5,
          used_count: 0,
          status: 'active',
          created_by_member_id: member?.id || null,
          expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        }
      ])
    })

    const code = codeInsert.ok && Array.isArray(codeInsert.data) ? codeInsert.data[0] : null

    await insertFamilyEvent({
      familyGroupId: group.id,
      familyMemberId: member?.id || null,
      inviteCodeId: code?.id || null,
      eventType: 'family_created',
      title: '가족 공간 생성',
      description: `${familyName} 가족 공동조회 공간이 생성됐습니다.`
    })

    if (code?.id) {
      await insertFamilyEvent({
        familyGroupId: group.id,
        familyMemberId: member?.id || null,
        inviteCodeId: code.id,
        eventType: 'invite_code_created',
        title: '가족 공동조회 코드 발급',
        description: `초대 코드 ${code.invite_code}가 발급됐습니다.`
      })
    }

    return NextResponse.json({
      ok: true,
      group,
      member,
      code
    })
  }

  if (action === 'create_invite_code') {
    const familyGroupId = text(body.familyGroupId) || await latestFamilyGroupId()

    if (!familyGroupId) {
      return NextResponse.json({ ok: false, message: '가족 공간이 먼저 필요합니다.' }, { status: 400 })
    }

    const invitedRoleValue = text(body.invitedRole) || 'guardian'
    const permissionLevelValue = text(body.permissionLevel) || 'care_summary'

    const invitedRole = allowedInviteRoles.has(invitedRoleValue) ? invitedRoleValue : 'guardian'
    const permissionLevel = allowedPermissionLevels.has(permissionLevelValue) ? permissionLevelValue : 'care_summary'
    const maxUses = intValue(body.maxUses, 5)
    const inviteCode = await createUniqueInviteCode()

    const codeInsert = await rest('care_family_invite_codes', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([
        {
          family_group_id: familyGroupId,
          invite_code: inviteCode,
          code_label: text(body.codeLabel) || '가족 공동조회 코드',
          invited_role: invitedRole,
          permission_level: permissionLevel,
          max_uses: maxUses,
          used_count: 0,
          status: 'active',
          expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        }
      ])
    })

    if (!codeInsert.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '초대 코드 생성 중 오류가 발생했습니다.',
          detail: codeInsert.error
        },
        { status: 500 }
      )
    }

    const code = Array.isArray(codeInsert.data) ? codeInsert.data[0] : null

    if (code?.id) {
      await insertFamilyEvent({
        familyGroupId,
        inviteCodeId: code.id,
        eventType: 'invite_code_created',
        title: '가족 공동조회 코드 발급',
        description: `초대 코드 ${code.invite_code}가 발급됐습니다.`
      })
    }

    return NextResponse.json({ ok: true, code })
  }

  if (action === 'join_with_code') {
    const inviteCode = text(body.inviteCode).toUpperCase()
    const memberName = text(body.memberName)
    const memberPhone = text(body.memberPhone)

    if (!inviteCode || !memberName) {
      return NextResponse.json({ ok: false, message: '초대 코드와 이름이 필요합니다.' }, { status: 400 })
    }

    const codeResult = await rest(
      'care_family_invite_codes?select=' +
        encodeURIComponent('id,family_group_id,invite_code,invited_role,permission_level,max_uses,used_count,status,expires_at') +
        '&invite_code=eq.' +
        encodeURIComponent(inviteCode) +
        '&limit=1'
    )

    if (!codeResult.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '초대 코드 확인 중 오류가 발생했습니다.',
          detail: codeResult.error
        },
        { status: 500 }
      )
    }

    const code = Array.isArray(codeResult.data) ? codeResult.data[0] : null

    if (!code || code.status !== 'active') {
      return NextResponse.json({ ok: false, message: '사용할 수 없는 초대 코드입니다.' }, { status: 404 })
    }

    if (code.expires_at && new Date(code.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ ok: false, message: '만료된 초대 코드입니다.' }, { status: 400 })
    }

    if (Number(code.used_count || 0) >= Number(code.max_uses || 1)) {
      return NextResponse.json({ ok: false, message: '사용 횟수가 끝난 초대 코드입니다.' }, { status: 400 })
    }

    const role = allowedRoles.has(code.invited_role) ? (code.invited_role as FamilyRole) : 'guardian'
    const permissionLevel = allowedPermissionLevels.has(code.permission_level) ? (code.permission_level as PermissionLevel) : 'care_summary'
    const permissions = defaultPermissionsForRole(role, permissionLevel)

    const memberInsert = await rest('care_family_members', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([
        {
          family_group_id: code.family_group_id,
          member_name: memberName,
          member_phone: memberPhone || null,
          family_role: role,
          permission_level: permissionLevel,
          ...permissions,
          status: 'active'
        }
      ])
    })

    if (!memberInsert.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '가족 참여 중 오류가 발생했습니다.',
          detail: memberInsert.error
        },
        { status: 500 }
      )
    }

    const member = Array.isArray(memberInsert.data) ? memberInsert.data[0] : null

    await rest('care_family_invite_codes?id=eq.' + encodeURIComponent(code.id), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        used_count: Number(code.used_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
    })

    await insertFamilyEvent({
      familyGroupId: code.family_group_id,
      familyMemberId: member?.id || null,
      inviteCodeId: code.id,
      eventType: 'joined',
      title: '가족 구성원 참여',
      description: `${memberName}님이 가족 공동조회에 참여했습니다.`
    })

    return NextResponse.json({ ok: true, member })
  }

  return NextResponse.json({ ok: false, message: 'action이 올바르지 않습니다.' }, { status: 400 })
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const kind = text(body.kind)
  const id = text(body.id)

  if (!id) {
    return NextResponse.json({ ok: false, message: 'id가 필요합니다.' }, { status: 400 })
  }

  if (kind === 'member') {
    const statusValue = text(body.status)
    const permissionLevelValue = text(body.permissionLevel)

    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (statusValue) {
      if (!allowedMemberStatuses.has(statusValue)) {
        return NextResponse.json({ ok: false, message: 'member status가 올바르지 않습니다.' }, { status: 400 })
      }

      patch.status = statusValue
    }

    if (permissionLevelValue) {
      if (!allowedPermissionLevels.has(permissionLevelValue)) {
        return NextResponse.json({ ok: false, message: 'permissionLevel이 올바르지 않습니다.' }, { status: 400 })
      }

      patch.permission_level = permissionLevelValue
      Object.assign(patch, defaultPermissionsForRole(text(body.familyRole) as FamilyRole || 'guardian', permissionLevelValue as PermissionLevel))
    }

    const result = await rest('care_family_members?id=eq.' + encodeURIComponent(id), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(patch)
    })

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '가족 구성원 변경 중 오류가 발생했습니다.',
          detail: result.error
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      item: Array.isArray(result.data) ? result.data[0] : result.data
    })
  }

  if (kind === 'code') {
    const statusValue = text(body.status)

    if (!allowedCodeStatuses.has(statusValue)) {
      return NextResponse.json({ ok: false, message: 'code status가 올바르지 않습니다.' }, { status: 400 })
    }

    const result = await rest('care_family_invite_codes?id=eq.' + encodeURIComponent(id), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        status: statusValue,
        updated_at: new Date().toISOString()
      })
    })

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: '초대 코드 변경 중 오류가 발생했습니다.',
          detail: result.error
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      item: Array.isArray(result.data) ? result.data[0] : result.data
    })
  }

  return NextResponse.json({ ok: false, message: 'kind가 올바르지 않습니다.' }, { status: 400 })
}
