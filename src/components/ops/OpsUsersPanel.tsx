'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type UserRow = {
  id: string
  email: string
  phone: string
  role: string
  roleLabel: string
  name: string
  providers: string[]
  createdKst: string
  lastSignInKst: string
  confirmedKst: string
  isConfirmed: boolean
  hasSignedIn: boolean
  familyLinkCount: number
  householdCount: number
  familyCodes: string[]
  signalCount: number
  messageCount: number
}

type FamilyRow = {
  id: string
  source: string
  familyCode: string
  guardianName: string
  guardianEmail: string
  guardianPhone: string
  parentName: string
  parentPhone: string
  serviceArea: string
  status: string
  consentStatus: string
  linkStatus: string
  parentJoinedKst: string
  createdKst: string
  signalCount: number
  lastSignalKst: string
  messageCount: number
  sentMessageCount: number
}

type SignalRow = {
  id: string
  familyCode: string
  parentName: string
  guardianName: string
  guardianPhone: string
  signalType: string
  signalLabel: string
  riskLevel: string
  status: string
  source: string
  createdKst: string
}

type MessageRow = {
  id: string
  familyCode: string
  toName: string
  toPhone: string
  title: string
  templateCode: string
  reason: string
  status: string
  provider: string
  createdKst: string
  sentKst: string
}

function toneClass(tone?: string) {
  if (['safe', 'confirmed', 'sent', 'guardian', 'parent', 'provider', 'ops'].includes(tone || '')) return 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
  if (['warning', 'queued', 'unknown', 'unconfirmed'].includes(tone || '')) return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  if (['danger', 'failed', 'urgent'].includes(tone || '')) return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  return 'bg-white text-[#17443F] ring-[#D6EDE7]'
}

function MetricCard({ title, value, desc, tone }: { title: string; value: string; desc: string; tone?: string }) {
  return (
    <article className={'rounded-[1.6rem] p-5 shadow-sm ring-1 ' + toneClass(tone)}>
      <div className="text-sm font-black opacity-70">{title}</div>
      <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{value}</div>
      <p className="mt-2 text-sm font-bold leading-6 opacity-75">{desc}</p>
    </article>
  )
}

function Pill({ children, tone }: { children: React.ReactNode; tone?: string }) {
  return (
    <span className={'inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ' + toneClass(tone)}>
      {children}
    </span>
  )
}

export function OpsUsersPanel() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [families, setFamilies] = useState<FamilyRow[]>([])
  const [signals, setSignals] = useState<SignalRow[]>([])
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [metrics, setMetrics] = useState<Record<string, any>>({})
  const [dropoffs, setDropoffs] = useState<Record<string, number>>({})
  const [activeTab, setActiveTab] = useState<'summary' | 'users' | 'families' | 'signals' | 'messages'>('summary')
  const [roleFilter, setRoleFilter] = useState('all')
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)

  const filteredUsers = useMemo(() => {
    if (roleFilter === 'all') return users
    return users.filter((user) => user.role === roleFilter)
  }, [users, roleFilter])

  const unknownUsers = useMemo(() => users.filter((user) => user.role === 'unknown'), [users])
  const inactiveUsers = useMemo(() => users.filter((user) => user.hasSignedIn && user.familyCodes.length === 0 && user.signalCount === 0), [users])
  const familiesWithoutSignal = useMemo(() => families.filter((family) => family.signalCount === 0), [families])

  async function load() {
    setLoading(true)

    try {
      const response = await fetch('/api/ops-users', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '가입자 정보를 불러오지 못했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      setUsers(Array.isArray(data.users) ? data.users : [])
      setFamilies(Array.isArray(data.families) ? data.families : [])
      setSignals(Array.isArray(data.signals) ? data.signals : [])
      setMessages(Array.isArray(data.messages) ? data.messages : [])
      setMetrics(data.metrics || {})
      setDropoffs(data.dropoffs || {})
      setMessage('')
      setDebug('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '가입자 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function updateRole(user: UserRow, role: string) {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/ops-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateUserRole', userId: user.id, role })
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || result.ok === false) {
        setMessage(result.message || '역할 수정에 실패했습니다.')
        setDebug(JSON.stringify(result.detail || result, null, 2))
        await load()
        return
      }

      setMessage(result.message || '역할을 수정했습니다.')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '역할 수정 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-7 text-[#17443F] sm:px-5 sm:py-10">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white/95 p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            가입자·실증 참여자 관리센터
          </div>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
                가입자가 실제 사용까지
                <br />
                넘어갔는지 확인합니다.
              </h1>

              <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
                회원가입, 역할, 부모님 연결, 안부 신호, 문자 발송을 한 화면에서 확인하고 역할 미분류 계정을 정리합니다.
              </p>
            </div>

            <div className={'rounded-[2rem] px-6 py-5 text-center ring-1 ' + toneClass(Number(metrics.unknownRoleUsers || 0) > 0 ? 'warning' : 'safe')}>
              <div className="text-sm font-black opacity-70">역할 미분류</div>
              <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{Number(metrics.unknownRoleUsers || 0)}명</div>
              <div className="mt-2 text-xs font-bold">정리 필요</div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            유저스푼 실증에서는 가입 수보다 “부모님 연결 → 안부 신호 → 리포트 확인” 전환이 더 중요합니다.
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={load} disabled={loading} className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50">
              {loading ? '새로고침 중' : '상태 새로고침'}
            </button>

            <Link href="/portal/ops" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              운영실 홈
            </Link>

            <Link href="/ops/private-pilot" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              자체 예비 실증
            </Link>

            <Link href="/ops/notification-safety" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              문자 안전정리
            </Link>

            <Link href="/onboarding" className="rounded-2xl bg-[#FAFFFD] px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              가입 후 시작하기
            </Link>
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#EFFFFA] p-4 text-sm font-black leading-7 text-[#247A71] ring-1 ring-[#CDEFE7]">
              {message}
            </div>
          ) : null}

          {debug ? (
            <details className="mt-4 rounded-2xl bg-[#247A71] p-4 text-xs font-bold leading-6 text-white">
              <summary className="cursor-pointer text-sm font-black">상세 결과 보기</summary>
              <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap">{debug}</pre>
            </details>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
          <MetricCard title="전체 가입자" value={`${Number(metrics.totalUsers || 0)}명`} desc="Auth 기준" tone="safe" />
          <MetricCard title="최근 24시간" value={`${Number(metrics.users24h || 0)}명`} desc="신규 가입" tone="safe" />
          <MetricCard title="인증 완료" value={`${Number(metrics.confirmedUsers || 0)}명`} desc="이메일 인증" tone="safe" />
          <MetricCard title="로그인 완료" value={`${Number(metrics.signedInUsers || 0)}명`} desc="실제 진입" tone="safe" />
          <MetricCard title="역할 미분류" value={`${Number(metrics.unknownRoleUsers || 0)}명`} desc="unknown" tone={Number(metrics.unknownRoleUsers || 0) > 0 ? 'warning' : 'safe'} />
          <MetricCard title="실증 가구" value={`${Number(metrics.pilotHouseholds || 0)}가구`} desc="Private Pilot" tone={Number(metrics.pilotHouseholds || 0) > 0 ? 'safe' : 'warning'} />
          <MetricCard title="안부 신호" value={`${Number(metrics.careSignals || 0)}건`} desc="실제 사용" tone={Number(metrics.careSignals || 0) > 0 ? 'safe' : 'warning'} />
          <MetricCard title="문자 실패" value={`${Number(metrics.failedMessages || 0)}건`} desc="정리 필요" tone={Number(metrics.failedMessages || 0) > 0 ? 'danger' : 'safe'} />
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard title="가입→로그인" value={`${Number(dropoffs.signupToSignin || 0)}%`} desc="로그인 전환" tone={Number(dropoffs.signupToSignin || 0) >= 70 ? 'safe' : 'warning'} />
          <MetricCard title="가입→가족연결" value={`${Number(dropoffs.signupToFamily || 0)}%`} desc="연결 전환" tone={Number(dropoffs.signupToFamily || 0) >= 30 ? 'safe' : 'warning'} />
          <MetricCard title="가족→안부신호" value={`${Number(dropoffs.familyToSignal || 0)}%`} desc="핵심 행동" tone={Number(dropoffs.familyToSignal || 0) >= 30 ? 'safe' : 'warning'} />
          <MetricCard title="문자 성공" value={`${Number(metrics.sentMessages || 0)}건`} desc="발송 완료" tone="safe" />
        </section>

        <section className="rounded-[2rem] bg-white/95 p-3 shadow-sm ring-1 ring-[#D6EDE7]">
          <div className="grid gap-2 sm:grid-cols-5">
            {[
              ['summary', '전환 요약'],
              ['users', '가입자'],
              ['families', '가족·실증 가구'],
              ['signals', '안부 신호'],
              ['messages', '문자 기록']
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as typeof activeTab)}
                className={
                  'rounded-2xl px-5 py-4 text-sm font-black ring-1 ' +
                  (activeTab === key
                    ? 'bg-[#247A71] text-white ring-[#247A71]'
                    : 'bg-white text-[#17443F] ring-[#D6EDE7]')
                }
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {activeTab === 'summary' ? (
          <section className="grid gap-5 xl:grid-cols-3">
            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">지금 고칠 병목</h2>

              <div className="mt-5 space-y-3">
                {[
                  [`역할 미분류 ${Number(metrics.unknownRoleUsers || 0)}명`, '가입할 때 역할 metadata가 안 들어간 계정을 정리해야 합니다.', Number(metrics.unknownRoleUsers || 0) > 0 ? 'warning' : 'safe'],
                  [`부모님 연결 ${Number(metrics.familiesTotal || 0)}건`, '가입자가 부모님 연결까지 갔는지 확인하세요.', Number(metrics.familiesTotal || 0) > 0 ? 'safe' : 'warning'],
                  [`안부 신호 ${Number(metrics.careSignals || 0)}건`, '실제 핵심 행동입니다. 신호 수가 낮으면 온보딩과 부모님 앱을 더 단순화해야 합니다.', Number(metrics.careSignals || 0) > 0 ? 'safe' : 'warning'],
                  [`문자 실패 ${Number(metrics.failedMessages || 0)}건`, '실증 문자는 문자 안전정리센터에서 테스트/실사용을 분리하세요.', Number(metrics.failedMessages || 0) > 0 ? 'danger' : 'safe']
                ].map(([title, desc, tone]) => (
                  <div key={String(title)} className={'rounded-2xl p-4 ring-1 ' + toneClass(String(tone))}>
                    <div className="text-lg font-black">{title}</div>
                    <p className="mt-1 text-sm font-bold leading-7 opacity-80">{desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">역할별 가입자</h2>

              <div className="mt-5 space-y-3">
                {[
                  ['보호자', metrics.guardianUsers || 0, 'guardian'],
                  ['부모님', metrics.parentUsers || 0, 'parent'],
                  ['생활확인 파트너', metrics.providerUsers || 0, 'provider'],
                  ['운영실', metrics.opsUsers || 0, 'ops'],
                  ['미분류', metrics.unknownRoleUsers || 0, 'unknown']
                ].map(([label, count, tone]) => (
                  <div key={String(label)} className="flex items-center justify-between rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    <div className="text-base font-black">{label}</div>
                    <Pill tone={String(tone)}>{String(count)}명</Pill>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">실증 운영 기준</h2>

              <div className="mt-5 space-y-3">
                {[
                  ['가입자는 관심도', '회원가입 수는 관심도 지표입니다.'],
                  ['가족 연결은 실증 후보', '부모님 코드나 실증 가구가 생겨야 운영 대상입니다.'],
                  ['안부 신호가 핵심 사용', '괜찮아요/도움 요청 버튼이 실제 사용 지표입니다.'],
                  ['문자·리포트가 가치 검증', '보호자가 알림과 리포트를 이해해야 유료화가 가능합니다.']
                ].map(([title, desc]) => (
                  <div key={title} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    <div className="text-base font-black">{title}</div>
                    <p className="mt-1 text-sm font-bold leading-7 text-[#637B76]">{desc}</p>
                  </div>
                ))}
              </div>
            </section>
          </section>
        ) : null}

        {activeTab === 'users' ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-3xl font-black tracking-[-0.06em]">가입자 목록</h2>
                <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                  역할이 unknown이면 실증 분석이 어려우니 보호자/부모님/파트너로 정리하세요.
                </p>
              </div>

              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
              >
                <option value="all">전체</option>
                <option value="unknown">미분류</option>
                <option value="guardian">보호자</option>
                <option value="parent">부모님</option>
                <option value="provider">파트너</option>
                <option value="ops">운영실</option>
              </select>
            </div>

            <UserList users={filteredUsers} updateRole={updateRole} loading={loading} />
          </section>
        ) : null}

        {activeTab === 'families' ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">가족 연결·실증 가구</h2>
            <FamilyList families={families} />
          </section>
        ) : null}

        {activeTab === 'signals' ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">안부 신호</h2>
            <SignalList signals={signals} />
          </section>
        ) : null}

        {activeTab === 'messages' ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">문자 기록</h2>
            <MessageList messages={messages} />
          </section>
        ) : null}
      </section>
    </main>
  )
}

function UserList({
  users,
  updateRole,
  loading
}: {
  users: UserRow[]
  updateRole: (user: UserRow, role: string) => void
  loading: boolean
}) {
  return (
    <div className="mt-5 space-y-3">
      {users.length ? (
        users.map((user) => (
          <article key={user.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <Pill tone={user.role}>{user.roleLabel}</Pill>
                  <Pill tone={user.isConfirmed ? 'confirmed' : 'unconfirmed'}>{user.isConfirmed ? '인증 완료' : '인증 미완료'}</Pill>
                  <Pill tone={user.hasSignedIn ? 'safe' : 'warning'}>{user.hasSignedIn ? '로그인 있음' : '로그인 없음'}</Pill>
                  {user.providers.map((provider) => (
                    <Pill key={provider}>{provider}</Pill>
                  ))}
                </div>

                <h3 className="mt-3 text-lg font-black">
                  {user.email || user.phone || user.id}
                </h3>

                <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                  이름 {user.name || '-'} · 가입 {user.createdKst || '-'} · 최근 로그인 {user.lastSignInKst || '-'}
                  <br />
                  가족코드 {user.familyCodes.length ? user.familyCodes.join(', ') : '-'} · 안부 신호 {user.signalCount}건 · 문자 {user.messageCount}건
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-4 xl:min-w-[420px]">
                <button disabled={loading} onClick={() => updateRole(user, 'guardian')} className="rounded-xl bg-white px-3 py-3 text-xs font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50">
                  보호자 지정
                </button>
                <button disabled={loading} onClick={() => updateRole(user, 'parent')} className="rounded-xl bg-white px-3 py-3 text-xs font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50">
                  부모님 지정
                </button>
                <button disabled={loading} onClick={() => updateRole(user, 'provider')} className="rounded-xl bg-white px-3 py-3 text-xs font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50">
                  파트너 지정
                </button>
                <button disabled={loading} onClick={() => updateRole(user, 'ops')} className="rounded-xl bg-white px-3 py-3 text-xs font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50">
                  운영실 지정
                </button>
              </div>
            </div>
          </article>
        ))
      ) : (
        <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
          가입자가 없습니다.
        </div>
      )}
    </div>
  )
}

function FamilyList({ families }: { families: FamilyRow[] }) {
  return (
    <div className="mt-5 space-y-3">
      {families.length ? (
        families.map((family) => (
          <article key={family.source + family.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <Pill tone="safe">{family.source}</Pill>
                  <Pill>{family.status || '-'}</Pill>
                  {family.signalCount > 0 ? <Pill tone="safe">안부 {family.signalCount}건</Pill> : <Pill tone="warning">안부 없음</Pill>}
                </div>

                <h3 className="mt-3 text-lg font-black">
                  {family.familyCode || '-'} · {family.parentName || '부모님'}
                </h3>

                <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                  보호자 {family.guardianName || '-'} · {family.guardianPhone || family.guardianEmail || '-'}
                  <br />
                  생성 {family.createdKst || '-'} · 부모님 접속 {family.parentJoinedKst || '-'} · 마지막 신호 {family.lastSignalKst || '-'}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link href={`/guardian/today?familyCode=${encodeURIComponent(family.familyCode || '')}`} className="rounded-xl bg-white px-4 py-3 text-xs font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                  리포트
                </Link>
                <Link href="/mobile/parent" className="rounded-xl bg-white px-4 py-3 text-xs font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                  부모님 앱
                </Link>
              </div>
            </div>
          </article>
        ))
      ) : (
        <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
          가족 연결 또는 실증 가구가 없습니다.
        </div>
      )}
    </div>
  )
}

function SignalList({ signals }: { signals: SignalRow[] }) {
  return (
    <div className="mt-5 space-y-3">
      {signals.length ? (
        signals.map((signal) => (
          <article key={signal.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
            <div className="flex flex-wrap gap-2">
              <Pill tone={signal.riskLevel === 'high' ? 'danger' : signal.riskLevel === 'medium' ? 'warning' : 'safe'}>
                {signal.signalLabel || signal.signalType}
              </Pill>
              <Pill>{signal.status}</Pill>
              <Pill>{signal.source || '-'}</Pill>
            </div>

            <h3 className="mt-3 text-lg font-black">{signal.familyCode || '-'} · {signal.parentName || '부모님'}</h3>

            <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
              보호자 {signal.guardianName || '-'} · {signal.guardianPhone || '-'} · {signal.createdKst || '-'}
            </p>
          </article>
        ))
      ) : (
        <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
          아직 안부 신호가 없습니다.
        </div>
      )}
    </div>
  )
}

function MessageList({ messages }: { messages: MessageRow[] }) {
  return (
    <div className="mt-5 space-y-3">
      {messages.length ? (
        messages.map((message) => (
          <article key={message.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
            <div className="flex flex-wrap gap-2">
              <Pill tone={message.status === 'sent' ? 'safe' : message.status === 'failed' ? 'danger' : 'warning'}>
                {message.status}
              </Pill>
              <Pill>{message.provider || '-'}</Pill>
              <Pill>{message.reason || '-'}</Pill>
            </div>

            <h3 className="mt-3 text-lg font-black">{message.title || '안부웍스 알림'}</h3>

            <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
              {message.toName || '-'} · {message.toPhone || '-'} · 생성 {message.createdKst || '-'} · 발송 {message.sentKst || '-'}
              <br />
              template: {message.templateCode || '-'}
            </p>
          </article>
        ))
      ) : (
        <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
          문자 기록이 없습니다.
        </div>
      )}
    </div>
  )
}

export default OpsUsersPanel
