'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  buildFamilySharingSummary,
  familyRoleOptions,
  labelFamilyRole,
  labelPermissionLevel,
  permissionLevelOptions,
  type CareFamilyGroup,
  type CareFamilyInviteCode,
  type CareFamilyJoinEvent,
  type CareFamilyMember,
  type FamilyMemberStatus,
  type InviteCodeStatus
} from '@/lib/family-sharing-engine'

export function FamilySharingBoard({ mode = 'family' }: { mode?: 'family' | 'ops' }) {
  const [groups, setGroups] = useState<CareFamilyGroup[]>([])
  const [members, setMembers] = useState<CareFamilyMember[]>([])
  const [codes, setCodes] = useState<CareFamilyInviteCode[]>([])
  const [events, setEvents] = useState<CareFamilyJoinEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/family-sharing', { cache: 'no-store' })
      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '가족 공동조회 정보를 불러오지 못했습니다.')
      }

      setGroups(data.groups || [])
      setMembers(data.members || [])
      setCodes(data.codes || [])
      setEvents(data.events || [])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '가족 공동조회 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function createFamily(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    const form = event.currentTarget
    const formData = new FormData(form)

    try {
      const response = await fetch('/api/family-sharing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_family',
          familyName: formData.get('familyName'),
          elderName: formData.get('elderName'),
          guardianName: formData.get('guardianName'),
          guardianPhone: formData.get('guardianPhone')
        })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '가족 공간 생성 실패')
      }

      setMessage(`가족 공간이 생성됐습니다. 공동조회 코드: ${data.code?.invite_code || '생성됨'}`)
      form.reset()
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '가족 공간 생성 실패')
    }
  }

  async function createInviteCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    const form = event.currentTarget
    const formData = new FormData(form)

    try {
      const response = await fetch('/api/family-sharing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_invite_code',
          familyGroupId: formData.get('familyGroupId'),
          invitedRole: formData.get('invitedRole'),
          permissionLevel: formData.get('permissionLevel'),
          maxUses: formData.get('maxUses')
        })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '초대 코드 생성 실패')
      }

      setMessage(`새 가족 공동조회 코드가 생성됐습니다: ${data.code?.invite_code}`)
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '초대 코드 생성 실패')
    }
  }

  async function joinWithCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    const form = event.currentTarget
    const formData = new FormData(form)

    try {
      const response = await fetch('/api/family-sharing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join_with_code',
          inviteCode: formData.get('inviteCode'),
          memberName: formData.get('memberName'),
          memberPhone: formData.get('memberPhone')
        })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '가족 참여 실패')
      }

      setMessage('가족 공동조회에 참여했습니다.')
      form.reset()
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '가족 참여 실패')
    }
  }

  async function updateMember(id: string, status: FamilyMemberStatus) {
    setMessage('')

    try {
      const response = await fetch('/api/family-sharing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'member', id, status })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '구성원 상태 변경 실패')
      }

      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '구성원 상태 변경 실패')
    }
  }

  async function updateCode(id: string, status: InviteCodeStatus) {
    setMessage('')

    try {
      const response = await fetch('/api/family-sharing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'code', id, status })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '초대 코드 상태 변경 실패')
      }

      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '초대 코드 상태 변경 실패')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const summary = useMemo(() => buildFamilySharingSummary(groups, members, codes), [groups, members, codes])

  const membersByGroup = useMemo(() => {
    const map = new Map<string, CareFamilyMember[]>()

    for (const member of members) {
      const current = map.get(member.family_group_id) || []
      current.push(member)
      map.set(member.family_group_id, current)
    }

    return map
  }, [members])

  const codesByGroup = useMemo(() => {
    const map = new Map<string, CareFamilyInviteCode[]>()

    for (const code of codes) {
      const current = map.get(code.family_group_id) || []
      current.push(code)
      map.set(code.family_group_id, current)
    }

    return map
  }, [codes])

  const eventsByGroup = useMemo(() => {
    const map = new Map<string, CareFamilyJoinEvent[]>()

    for (const event of events) {
      const current = map.get(event.family_group_id) || []
      current.push(event)
      map.set(event.family_group_id, current)
    }

    return map
  }, [events])

  return (
    <div>
      <section
        className={
          'rounded-3xl p-6 shadow-sm ' +
          (summary.reassuranceState === '안심' ? 'bg-emerald-50' : 'bg-amber-50')
        }
      >
        <p className="text-sm font-black text-slate-600">가족 공동조회 안심판</p>
        <h2 className="mt-2 text-5xl font-black">{summary.reassuranceState}</h2>

        <div className="mt-5 grid gap-3 md:grid-cols-5">
          <Stat label="가족 공간" value={summary.groupTotal} />
          <Stat label="참여 가족" value={summary.memberTotal} />
          <Stat label="초대 코드" value={summary.inviteCodeTotal} />
          <Stat label="비용 승인자" value={summary.costApproverTotal} />
          <Stat label="할 일 담당자" value={summary.taskManagerTotal} />
        </div>
      </section>

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black">가족이 할 일</h2>
        <div className="mt-4 space-y-3">
          {summary.familyNextActions.map((action, index) => (
            <div key={action} className="rounded-2xl bg-slate-50 p-4 text-lg font-black">
              {index + 1}. {action}
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={load} className="rounded-2xl bg-slate-900 px-5 py-4 font-black text-white">
          새로고침
        </button>
      </div>

      {message ? (
        <p className="mt-5 rounded-2xl bg-blue-50 p-4 font-bold text-blue-900">
          {message}
        </p>
      ) : null}

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <form onSubmit={createFamily} className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">가족 공간 만들기</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            대표 보호자가 가족 공동조회 공간을 만들고 초대 코드를 발급합니다.
          </p>

          <div className="mt-5 grid gap-3">
            <input name="familyName" className="rounded-2xl border border-slate-200 p-4" placeholder="예: 어머니 케어 가족" />
            <input name="elderName" className="rounded-2xl border border-slate-200 p-4" placeholder="부모님 성함" defaultValue="어머니" />
            <input name="guardianName" className="rounded-2xl border border-slate-200 p-4" placeholder="대표 보호자 이름" />
            <input name="guardianPhone" className="rounded-2xl border border-slate-200 p-4" placeholder="010-1234-5678" />
          </div>

          <button className="mt-4 w-full rounded-3xl bg-emerald-600 px-6 py-5 text-xl font-black text-white">
            가족 공간 만들기
          </button>
        </form>

        <form onSubmit={joinWithCode} className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">초대 코드로 참여</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            가족에게 받은 공동조회 코드를 입력하면 함께 확인할 수 있습니다.
          </p>

          <div className="mt-5 grid gap-3">
            <input name="inviteCode" className="rounded-2xl border border-slate-200 p-4 uppercase" placeholder="예: CARE-ABC123" />
            <input name="memberName" className="rounded-2xl border border-slate-200 p-4" placeholder="내 이름" />
            <input name="memberPhone" className="rounded-2xl border border-slate-200 p-4" placeholder="010-1234-5678" />
          </div>

          <button className="mt-4 w-full rounded-3xl bg-slate-900 px-6 py-5 text-xl font-black text-white">
            가족 공동조회 참여
          </button>
        </form>
      </section>

      {mode === 'ops' || groups.length > 0 ? (
        <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">새 초대 코드 만들기</h2>

          <form onSubmit={createInviteCode} className="mt-5 grid gap-3 md:grid-cols-[1fr_180px_180px_140px_auto]">
            <select name="familyGroupId" className="rounded-2xl border border-slate-200 p-4">
              {groups.length === 0 ? (
                <option value="">가족 공간 없음</option>
              ) : (
                groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.family_name}
                  </option>
                ))
              )}
            </select>

            <select name="invitedRole" className="rounded-2xl border border-slate-200 p-4">
              {familyRoleOptions
                .filter((role) => role.code !== 'primary_guardian' && role.code !== 'ops')
                .map((role) => (
                  <option key={role.code} value={role.code}>
                    {role.label}
                  </option>
                ))}
            </select>

            <select name="permissionLevel" className="rounded-2xl border border-slate-200 p-4">
              {permissionLevelOptions.map((level) => (
                <option key={level.code} value={level.code}>
                  {level.label}
                </option>
              ))}
            </select>

            <input name="maxUses" className="rounded-2xl border border-slate-200 p-4" inputMode="numeric" defaultValue="5" />

            <button className="rounded-2xl bg-emerald-600 px-5 py-4 font-black text-white">
              코드 생성
            </button>
          </form>
        </section>
      ) : null}

      <section className="mt-8 space-y-5">
        {loading ? (
          <div className="rounded-3xl bg-white p-8 text-center font-black shadow-sm">
            불러오는 중...
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <div className="text-xl font-black">아직 가족 공간이 없습니다.</div>
            <p className="mt-2 text-slate-500">위에서 가족 공간을 먼저 만들어보세요.</p>
          </div>
        ) : (
          groups.map((group) => {
            const groupMembers = membersByGroup.get(group.id) || []
            const groupCodes = codesByGroup.get(group.id) || []
            const groupEvents = eventsByGroup.get(group.id) || []

            return (
              <article key={group.id} className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge text={group.family_status} />
                  <Badge text={group.primary_elder_name} />
                  <Badge text={`가족 ${groupMembers.length}명`} />
                  <Badge text={`코드 ${groupCodes.length}개`} />
                </div>

                <h3 className="mt-3 text-3xl font-black">{group.family_name}</h3>
                <p className="mt-2 text-sm text-slate-600">
                  대표 보호자: {group.primary_guardian_name || '미입력'} · {group.primary_guardian_phone || '연락처 미입력'}
                </p>

                <section className="mt-6 rounded-3xl bg-slate-50 p-5">
                  <h4 className="text-xl font-black">가족 구성원</h4>

                  {groupMembers.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500">아직 구성원이 없습니다.</p>
                  ) : (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {groupMembers.map((member) => (
                        <div key={member.id} className="rounded-2xl bg-white p-4">
                          <div className="flex flex-wrap gap-2">
                            <Badge text={labelFamilyRole(member.family_role)} />
                            <Badge text={labelPermissionLevel(member.permission_level)} />
                            <Badge text={member.status} />
                          </div>

                          <div className="mt-3 text-lg font-black">{member.member_name}</div>
                          <p className="mt-1 text-sm text-slate-500">{member.member_phone || '연락처 미입력'}</p>

                          <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
                            {member.can_approve_costs ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800">비용 승인</span> : null}
                            {member.can_manage_tasks ? <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-800">할 일 담당</span> : null}
                            {member.can_invite_members ? <span className="rounded-full bg-slate-100 px-3 py-1">가족 초대</span> : null}
                          </div>

                          {mode === 'ops' ? (
                            <div className="mt-4 flex flex-wrap gap-2">
                              <button onClick={() => updateMember(member.id, 'paused')} className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-black text-amber-800">
                                일시중지
                              </button>
                              <button onClick={() => updateMember(member.id, 'removed')} className="rounded-xl bg-red-50 px-3 py-2 text-sm font-black text-red-700">
                                제거
                              </button>
                              <button onClick={() => updateMember(member.id, 'active')} className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-800">
                                활성
                              </button>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="mt-6 rounded-3xl bg-slate-50 p-5">
                  <h4 className="text-xl font-black">가족 공동조회 코드</h4>

                  {groupCodes.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500">아직 초대 코드가 없습니다.</p>
                  ) : (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {groupCodes.map((code) => (
                        <div key={code.id} className="rounded-2xl bg-white p-4">
                          <div className="flex flex-wrap gap-2">
                            <Badge text={code.status} />
                            <Badge text={labelFamilyRole(code.invited_role)} />
                            <Badge text={labelPermissionLevel(code.permission_level)} />
                          </div>

                          <div className="mt-3 select-all break-all text-2xl font-black">{code.invite_code}</div>
                          <p className="mt-2 text-sm text-slate-500">
                            사용 {code.used_count}/{code.max_uses}
                            {code.expires_at ? ` · 만료 ${new Date(code.expires_at).toLocaleDateString('ko-KR')}` : ''}
                          </p>

                          {mode === 'ops' ? (
                            <div className="mt-4 flex flex-wrap gap-2">
                              <button onClick={() => updateCode(code.id, 'disabled')} className="rounded-xl bg-red-50 px-3 py-2 text-sm font-black text-red-700">
                                비활성화
                              </button>
                              <button onClick={() => updateCode(code.id, 'active')} className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-800">
                                활성
                              </button>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {groupEvents.length > 0 ? (
                  <section className="mt-6 rounded-3xl bg-slate-900 p-5 text-white">
                    <h4 className="text-xl font-black">가족 참여 기록</h4>
                    <div className="mt-4 space-y-3">
                      {groupEvents.slice(0, 8).map((event) => (
                        <div key={event.id} className="rounded-2xl bg-white/10 p-4">
                          <div className="font-black">{event.title}</div>
                          {event.description ? <p className="mt-1 text-sm text-slate-200">{event.description}</p> : null}
                          <p className="mt-2 text-xs text-slate-400">{new Date(event.created_at).toLocaleString('ko-KR')}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}
              </article>
            )
          })
        )}
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="text-sm font-black text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-black">{value}</div>
    </div>
  )
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
      {text}
    </span>
  )
}
