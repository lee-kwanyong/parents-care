'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Row = {
  id: string
  source: string
  familyCode: string
  parentName: string
  guardianName: string
  parentPhone: string
  parentPhoneMasked: string
  guardianPhone: string
  guardianPhoneMasked: string
  parentAddress: string
  guardianAddress: string
  memberStatus: string
  adminMemo: string
  authUsers: Array<{
    id: string
    email: string
    phone: string
    name: string
    role: string
    address: string
    createdAt: string
    lastSignInAt: string
  }>
  latestCare?: {
    signalLabel: string
    signalType: string
    riskLevel: string
    status: string
    createdAt: string
  } | null
  latestRing?: {
    status: string
    score: number
    quality: number
    battery: number
    wearMinutes: number
    createdAt: string
  } | null
  ringDevices: Array<{
    id: string
    supplier: string
    model: string
    stage: string
    status: string
    serialNumber: string
    ringSize: string
    batteryPct: number
    dataQualityScore: number
    wearMinutesAvg: number
  }>
  hasSmartRing: boolean
  duplicateCount: number
  duplicateDecisions: string[]
  risk: {
    code: string
    label: string
    tone: string
  }
  todayCareCount: number
  todayRingCount: number
  lastActivityAt: string
}

type Data = {
  ok: boolean
  message?: string
  generatedKst?: string
  rows?: Row[]
  metrics?: {
    totalFamilies: number
    totalRows: number
    authUsers: number
    smartRingFamilies: number
    checkNeeded: number
    watch: number
    pending: number
    completed: number
    duplicateFamilies: number
  }
  sourceErrors?: string[]
}

function toneClass(tone: string) {
  if (tone === 'danger') return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  if (tone === 'watch') return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  if (tone === 'safe') return 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
  return 'bg-white text-[#17443F] ring-[#D6EDE7]'
}

function formatDate(value?: string) {
  if (!value) return '기록 없음'
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return value

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(parsed))
}

function initialFilter() {
  if (typeof window === 'undefined') return 'all'
  return new URLSearchParams(window.location.search).get('filter') || 'all'
}

function initialFamilyCode() {
  if (typeof window === 'undefined') return ''
  return new URLSearchParams(window.location.search).get('familyCode') || ''
}

export function AdminFamilyHubPanel() {
  const [data, setData] = useState<Data | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [focusFamilyCode, setFocusFamilyCode] = useState('')
  const [showRawContact, setShowRawContact] = useState(true)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin-family-hub', {
        cache: 'no-store',
        credentials: 'include'
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || result.ok === false) {
        setMessage(result.message || '가입자 통합 목록을 불러오지 못했습니다.')
        setData(result)
        return
      }

      setData(result)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '가입자 통합 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function copyRow(row: Row) {
    const lines = [
      '[안부웍스] 가입자/가족 정보',
      '',
      `가족코드: ${row.familyCode || '-'}`,
      `부모님: ${row.parentName}`,
      `보호자: ${row.guardianName}`,
      `부모님 연락처: ${showRawContact ? row.parentPhone : row.parentPhoneMasked}`,
      `보호자 연락처: ${showRawContact ? row.guardianPhone : row.guardianPhoneMasked}`,
      `부모님 주소: ${row.parentAddress || '-'}`,
      `보호자 주소: ${row.guardianAddress || '-'}`,
      `상태: ${row.risk.label}`,
      `안부리포트: ${row.ringDevices.map((item) => `${item.model}/${item.stage}`).join(', ') || '없음'}`
    ]

    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      setMessage('가족 정보를 복사했습니다.')
    } catch {
      setMessage('복사에 실패했습니다.')
    }
  }

  useEffect(() => {
    setFilter(initialFilter())
    setFocusFamilyCode(initialFamilyCode())
    load()
  }, [])

  const rows = data?.rows || []

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase()

    return rows.filter((row) => {
      const textBlob = [
        row.familyCode,
        row.parentName,
        row.guardianName,
        row.parentPhone,
        row.guardianPhone,
        row.parentPhoneMasked,
        row.guardianPhoneMasked,
        row.parentAddress,
        row.guardianAddress,
        row.memberStatus,
        row.latestCare?.signalLabel,
        row.latestRing?.status,
        row.ringDevices.map((device) => `${device.supplier} ${device.model} ${device.stage} ${device.serialNumber}`).join(' '),
        row.authUsers.map((user) => `${user.name} ${user.email} ${user.phone} ${user.address}`).join(' ')
      ].join(' ').toLowerCase()

      const queryOk = !q || textBlob.includes(q)
      const focusOk = !focusFamilyCode || row.familyCode === focusFamilyCode

      let filterOk = true

      if (filter === 'check-needed') filterOk = row.risk.code === 'check-needed'
      if (filter === 'watch') filterOk = row.risk.code === 'watch'
      if (filter === 'completed') filterOk = row.risk.code === 'completed'
      if (filter === 'pending') filterOk = row.risk.code === 'pending'
      if (filter === 'smart-ring') filterOk = row.hasSmartRing
      if (filter === 'duplicates') filterOk = row.duplicateCount > 0
      if (filter === 'auth-only') filterOk = row.source === 'auth'

      return queryOk && focusOk && filterOk
    })
  }, [rows, query, filter, focusFamilyCode])

  const metrics = data?.metrics || {
    totalFamilies: 0,
    totalRows: 0,
    authUsers: 0,
    smartRingFamilies: 0,
    checkNeeded: 0,
    watch: 0,
    pending: 0,
    completed: 0,
    duplicateFamilies: 0
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#E7FFF7_0%,#F7FFFC_34%,#FFFFFF_72%)] px-4 py-8 text-[#17443F]">
      <section className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2.5rem] bg-white/95 p-6 shadow-[0_24px_80px_rgba(49,151,136,0.10)] ring-1 ring-[#D6EDE7] sm:p-9">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7]">
              가입자 통합관리
            </span>
            <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              가족 + 가입자 + 안부리포트
            </span>
            <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              {data?.generatedKst || '오늘'}
            </span>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_auto]">
            <div>
              <h1 className="text-4xl font-black leading-tight tracking-[-0.08em] sm:text-6xl">
                가입자와 가족,
                <br />
                안부리포트을 한 줄로 봅니다.
              </h1>

              <p className="mt-5 max-w-3xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
                이름, 연락처, 주소, 가족코드, 최신 안부, 안부리포트 배정 상태를 한 화면에서 관리합니다.
              </p>
            </div>

            <div className="grid min-w-[280px] gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <Link href="/admin/ops" className="rounded-2xl bg-[#EFFFFA] px-5 py-4 text-center text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7]">
                대시보드
              </Link>

              <button
                onClick={load}
                disabled={loading}
                className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50"
              >
                {loading ? '새로고침 중' : '새로고침'}
              </button>
            </div>
          </div>
        </section>

        {message ? (
          <section className="rounded-[2rem] bg-[#FFF9EE] p-5 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            {message}
          </section>
        ) : null}

        <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {[
            ['전체', metrics.totalRows, 'all'],
            ['확인필요', metrics.checkNeeded, 'check-needed'],
            ['주의', metrics.watch, 'watch'],
            ['완료', metrics.completed, 'completed'],
            ['안부리포트', metrics.smartRingFamilies, 'smart-ring'],
            ['중복검토', metrics.duplicateFamilies, 'duplicates']
          ].map(([label, value, key]) => (
            <button
              key={key}
              onClick={() => setFilter(String(key))}
              className={
                filter === key
                  ? 'rounded-2xl bg-[#EFFFFA] p-4 text-left text-[#247A71] ring-1 ring-[#CDEFE7]'
                  : 'rounded-2xl bg-white/95 p-4 text-left text-[#17443F] ring-1 ring-[#D6EDE7]'
              }
            >
              <div className="text-xs font-black opacity-70">{label}</div>
              <div className="mt-2 text-3xl font-black tracking-[-0.08em]">{String(value)}</div>
            </button>
          ))}
        </section>

        <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7]">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="이름, 전화번호, 주소, 가족코드, 안부리포트 모델 검색"
              className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
            />

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
            >
              <option value="all">전체</option>
              <option value="check-needed">확인필요</option>
              <option value="watch">주의</option>
              <option value="completed">완료</option>
              <option value="pending">대기</option>
              <option value="smart-ring">안부리포트</option>
              <option value="duplicates">중복검토</option>
              <option value="auth-only">가입자만 있고 가족 미연결</option>
            </select>

            <label className="flex cursor-pointer items-center gap-2 rounded-2xl bg-[#FAFFFD] px-4 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              <input
                type="checkbox"
                checked={showRawContact}
                onChange={(event) => setShowRawContact(event.target.checked)}
                className="h-5 w-5 accent-[#2AA897]"
              />
              원본 연락처 표시
            </label>
          </div>
        </section>

        <section className="space-y-4">
          {filteredRows.length ? (
            filteredRows.map((row) => (
              <article key={row.id} className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7]">
                <div className="grid gap-5 xl:grid-cols-[1fr_1.15fr_0.85fr]">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${toneClass(row.risk.tone)}`}>
                        {row.risk.label}
                      </span>

                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                        {row.familyCode || '가족코드 없음'}
                      </span>

                      {row.hasSmartRing ? (
                        <span className="rounded-full bg-[#F6F4FF] px-3 py-1 text-xs font-black text-[#4A3A8A] ring-1 ring-[#DED8FF]">
                          안부리포트 연결
                        </span>
                      ) : null}

                      {row.duplicateCount > 0 ? (
                        <span className="rounded-full bg-[#FFF9EE] px-3 py-1 text-xs font-black text-[#795C22] ring-1 ring-[#F3DEB5]">
                          중복검토 {row.duplicateCount}
                        </span>
                      ) : null}
                    </div>

                    <h2 className="mt-4 text-3xl font-black tracking-[-0.07em]">
                      {row.parentName}
                    </h2>

                    <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                      보호자 {row.guardianName}
                    </p>

                    <div className="mt-4 grid gap-2 text-sm font-bold leading-7 text-[#17443F]">
                      <div className="rounded-2xl bg-[#FAFFFD] p-3 ring-1 ring-[#D6EDE7]">
                        부모님 연락처: {showRawContact ? row.parentPhone || '미입력' : row.parentPhoneMasked || '미입력'}
                      </div>

                      <div className="rounded-2xl bg-[#FAFFFD] p-3 ring-1 ring-[#D6EDE7]">
                        보호자 연락처: {showRawContact ? row.guardianPhone || '미입력' : row.guardianPhoneMasked || '미입력'}
                      </div>

                      <div className="rounded-2xl bg-[#FAFFFD] p-3 ring-1 ring-[#D6EDE7]">
                        부모님 주소: {row.parentAddress || '주소 미입력'}
                      </div>

                      <div className="rounded-2xl bg-[#FAFFFD] p-3 ring-1 ring-[#D6EDE7]">
                        보호자 주소: {row.guardianAddress || '주소 미입력'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <section className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                        <div className="text-sm font-black text-[#637B76]">최신 안부</div>
                        <div className="mt-2 text-xl font-black tracking-[-0.05em]">
                          {row.latestCare?.signalLabel || '기록 없음'}
                        </div>
                        <p className="mt-2 text-xs font-bold leading-6 text-[#637B76]">
                          {formatDate(row.latestCare?.createdAt)}
                        </p>
                      </section>

                      <section className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                        <div className="text-sm font-black text-[#637B76]">최신 안부리포트</div>
                        <div className="mt-2 text-xl font-black tracking-[-0.05em]">
                          {row.latestRing ? `${row.latestRing.score || 0}점 / 품질 ${row.latestRing.quality || 0}` : '기록 없음'}
                        </div>
                        <p className="mt-2 text-xs font-bold leading-6 text-[#637B76]">
                          배터리 {row.latestRing?.battery || 0}% · {formatDate(row.latestRing?.createdAt)}
                        </p>
                      </section>
                    </div>

                    <section className="mt-3 rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                      <div className="text-sm font-black text-[#637B76]">안부리포트 기기</div>

                      <div className="mt-3 space-y-2">
                        {row.ringDevices.length ? (
                          row.ringDevices.map((device) => (
                            <div key={device.id} className="rounded-xl bg-white p-3 text-xs font-black leading-6 ring-1 ring-[#D6EDE7]">
                              {device.supplier} · {device.model} · {device.stage}
                              <br />
                              사이즈 {device.ringSize || '-'} · 시리얼 {device.serialNumber || '-'} · 배터리 {device.batteryPct || 0}%
                            </div>
                          ))
                        ) : (
                          <p className="text-sm font-bold leading-7 text-[#637B76]">
                            배정된 안부리포트 기기가 없습니다.
                          </p>
                        )}
                      </div>
                    </section>

                    <section className="mt-3 rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                      <div className="text-sm font-black text-[#637B76]">가입 계정</div>

                      <div className="mt-3 space-y-2">
                        {row.authUsers.length ? (
                          row.authUsers.map((user) => (
                            <div key={user.id} className="rounded-xl bg-white p-3 text-xs font-black leading-6 ring-1 ring-[#D6EDE7]">
                              {user.name} · {user.email || '이메일 없음'} · {showRawContact ? user.phone || '번호 없음' : '번호 숨김'}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm font-bold leading-7 text-[#637B76]">
                            연결된 auth 가입 계정이 없습니다.
                          </p>
                        )}
                      </div>
                    </section>
                  </div>

                  <aside className="space-y-3">
                    <Link
                      href={row.familyCode ? `/guardian/today?familyCode=${encodeURIComponent(row.familyCode)}` : '/guardian/today'}
                      className="block rounded-2xl bg-[#EFFFFA] px-4 py-4 text-center text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7]"
                    >
                      보호자 리포트
                    </Link>

                    <Link
                      href={row.familyCode ? `/guardian/ring-report?familyCode=${encodeURIComponent(row.familyCode)}` : '/guardian/ring-report'}
                      className="block rounded-2xl bg-white px-4 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
                    >
                      안부완료 리포트
                    </Link>

                    <Link
                      href={row.familyCode ? `/guardian/proxy-checkin?familyCode=${encodeURIComponent(row.familyCode)}` : '/guardian/proxy-checkin'}
                      className="block rounded-2xl bg-white px-4 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
                    >
                      대리입력
                    </Link>

                    <Link
                      href={row.familyCode ? `/mobile/parent?familyCode=${encodeURIComponent(row.familyCode)}` : '/mobile/parent'}
                      className="block rounded-2xl bg-white px-4 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
                    >
                      부모님 화면
                    </Link>

                    <button
                      onClick={() => copyRow(row)}
                      className="w-full rounded-2xl bg-[#FAFFFD] px-4 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
                    >
                      정보 복사
                    </button>
                  </aside>
                </div>
              </article>
            ))
          ) : (
            <section className="rounded-[2rem] bg-white/95 p-8 text-center shadow-sm ring-1 ring-[#D6EDE7]">
              <div className="text-3xl font-black tracking-[-0.07em]">표시할 가입자/가족이 없습니다.</div>
              <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">
                검색어 또는 필터를 바꿔보세요.
              </p>
            </section>
          )}
        </section>

        {data?.sourceErrors?.length ? (
          <details className="rounded-[2rem] bg-white/95 p-5 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D6EDE7]">
            <summary className="cursor-pointer text-base font-black text-[#795C22]">
              데이터 연결 확인 필요 {data.sourceErrors.length}건
            </summary>
            <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap rounded-2xl bg-[#FFF9EE] p-4 text-xs leading-6 text-[#795C22]">
              {data.sourceErrors.join('\n\n')}
            </pre>
          </details>
        ) : null}
      </section>
    </main>
  )
}

export default AdminFamilyHubPanel
