'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Role = 'guardian' | 'parent'

type FamilyData = {
  familyCode: string
  parentName: string
  guardianName: string
  parentPhoneMasked?: string
  guardianPhoneMasked?: string
  parentJoined?: boolean
  guardianJoined?: boolean
}

type InviteResponse = {
  ok: boolean
  demo?: boolean
  persisted?: boolean
  reused?: boolean
  warning?: string | null
  message?: string
  family?: FamilyData
  links?: Record<string, string>
  sourceErrors?: string[]
}

function initialFamilyCode() {
  if (typeof window === 'undefined') return ''

  const params = new URLSearchParams(window.location.search)

  return (
    params.get('familyCode') ||
    window.localStorage.getItem('anbu-guardian-family-code') ||
    window.localStorage.getItem('anbu-parent-family-code') ||
    ''
  )
}

function initialRole(): Role {
  if (typeof window === 'undefined') return 'guardian'

  const role = new URLSearchParams(window.location.search).get('role')

  return role === 'parent' ? 'parent' : 'guardian'
}

function absolute(path: string) {
  if (typeof window === 'undefined') return path
  return `${window.location.origin}${path}`
}

function saveFamilyCode(code: string) {
  if (typeof window === 'undefined' || !code) return
  window.localStorage.setItem('anbu-guardian-family-code', code)
  window.localStorage.setItem('anbu-parent-family-code', code)
}

export function FamilyInviteFlowPanel({ mode = 'onboarding' }: { mode?: 'onboarding' | 'invite' }) {
  const [role, setRole] = useState<Role>('guardian')
  const [familyCode, setFamilyCode] = useState('')
  const [parentName, setParentName] = useState('부모님')
  const [guardianName, setGuardianName] = useState('보호자')
  const [parentPhone, setParentPhone] = useState('')
  const [guardianPhone, setGuardianPhone] = useState('')
  const [data, setData] = useState<InviteResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const family = data?.family
  const links = data?.links || {}

  const primaryHref = useMemo(() => {
    if (!family?.familyCode) return '/consent'
    const code = encodeURIComponent(family.familyCode)
    return role === 'parent'
      ? `/consent?familyCode=${code}&role=parent`
      : `/consent?familyCode=${code}&role=guardian`
  }, [family?.familyCode, role])

  async function load(code = familyCode) {
    const clean = code.trim()

    if (!clean) return

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch(`/api/family-invite?familyCode=${encodeURIComponent(clean)}`, {
        cache: 'no-store',
        credentials: 'include'
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || result.ok === false) {
        setMessage(result.message || '가족 정보를 불러오지 못했습니다.')
        setData(result)
        return
      }

      setData(result)
      setFamilyCode(result.family?.familyCode || clean)
      saveFamilyCode(result.family?.familyCode || clean)

      if (result.family?.parentName) setParentName(result.family.parentName)
      if (result.family?.guardianName) setGuardianName(result.family.guardianName)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '가족 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function createFamily() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/family-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          action: 'create',
          role,
          familyCode: familyCode.trim(),
          parentName,
          guardianName,
          parentPhone,
          guardianPhone
        })
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || result.ok === false) {
        setMessage(result.message || '가족코드 생성에 실패했습니다.')
        return
      }

      setData(result)
      const code = result.family?.familyCode || familyCode

      setFamilyCode(code)
      saveFamilyCode(code)

      if (typeof window !== 'undefined' && code) {
        const nextUrl = new URL(window.location.href)
        nextUrl.searchParams.set('familyCode', code)
        nextUrl.searchParams.set('role', role)
        window.history.replaceState(null, '', nextUrl.toString())
      }

      setMessage(result.persisted ? '가족코드와 초대 링크를 만들었습니다.' : '가족코드를 만들었습니다. 서버 저장은 나중에 다시 확인하세요.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '가족코드 생성에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function joinFamily(nextRole = role) {
    const code = family?.familyCode || familyCode

    if (!code) {
      setMessage('가족코드를 먼저 입력해주세요.')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/family-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          action: 'join',
          role: nextRole,
          familyCode: code
        })
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || result.ok === false) {
        setMessage(result.message || '가족 참여 처리에 실패했습니다.')
        return
      }

      saveFamilyCode(code)
      setMessage('가족코드를 이 기기에 저장했습니다. 이제 동의 후 시작할 수 있습니다.')
      await load(code)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '가족 참여 처리에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function copyLink(path: string, label: string) {
    if (!path) {
      setMessage('먼저 가족코드를 만들어주세요.')
      return
    }

    try {
      await navigator.clipboard.writeText(absolute(path))
      setMessage(`${label} 링크를 복사했습니다.`)
    } catch {
      setMessage('복사에 실패했습니다. 브라우저 권한을 확인해주세요.')
    }
  }

  useEffect(() => {
    const roleFromUrl = initialRole()
    const codeFromUrl = initialFamilyCode()

    setRole(roleFromUrl)
    setFamilyCode(codeFromUrl)

    if (codeFromUrl) load(codeFromUrl)
  }, [])

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#E7FFF7_0%,#F7FFFC_34%,#FFFFFF_72%)] px-4 py-8 text-[#17443F]">
      <section className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[2.5rem] bg-white/95 shadow-[0_24px_80px_rgba(49,151,136,0.10)] ring-1 ring-[#D6EDE7]">
          <div className="grid gap-0 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="p-6 sm:p-9">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7]">
                  {mode === 'invite' ? '초대 링크' : '시작하기'}
                </span>
                <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                  가족코드 기반 연결
                </span>
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.08em] sm:text-6xl">
                가족코드 하나로
                <br />
                안부 흐름을 연결합니다.
              </h1>

              <p className="mt-5 max-w-3xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
                부모님 안부 앱, 보호자 리포트, 안부완료 리포트, 대리입력 화면이 같은 가족코드로 이어집니다.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => setRole('guardian')}
                  className={role === 'guardian'
                    ? 'rounded-2xl bg-[#EFFFFA] px-5 py-4 text-left text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7]'
                    : 'rounded-2xl bg-white px-5 py-4 text-left text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]'}
                >
                  보호자로 시작
                  <span className="mt-1 block text-xs font-bold opacity-70">부모님을 초대하고 리포트를 봅니다.</span>
                </button>

                <button
                  onClick={() => setRole('parent')}
                  className={role === 'parent'
                    ? 'rounded-2xl bg-[#EFFFFA] px-5 py-4 text-left text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7]'
                    : 'rounded-2xl bg-white px-5 py-4 text-left text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]'}
                >
                  부모님으로 시작
                  <span className="mt-1 block text-xs font-bold opacity-70">초대받은 가족코드로 안부를 남깁니다.</span>
                </button>
              </div>
            </div>

            <aside className="bg-[linear-gradient(135deg,#EFFFFA_0%,#F7FFFC_50%,#FFFFFF_100%)] p-6 sm:p-9">
              <div className="rounded-[2rem] bg-white/90 p-6 ring-1 ring-[#D6EDE7]">
                <div className="text-sm font-black text-[#637B76]">현재 가족코드</div>
                <div className="mt-3 break-all text-4xl font-black tracking-[-0.08em] text-[#247A71]">
                  {family?.familyCode || familyCode || '아직 없음'}
                </div>
                <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">
                  가족코드를 만들거나 받은 가족코드를 입력하면 모든 고객 화면이 연결됩니다.
                </p>

                <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
                  의료 진단이 아닌 비의료 안부 참고 서비스입니다. 응급상황이 의심되면 119 또는 의료기관에 연락하세요.
                </div>
              </div>
            </aside>
          </div>
        </section>

        {message ? (
          <section className="rounded-[2rem] bg-[#FFF9EE] p-5 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            {message}
          </section>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-[2rem] bg-white/95 p-6 shadow-sm ring-1 ring-[#D6EDE7]">
            <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7]">
              가족 정보
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-[-0.07em]">
              처음 연결할 정보를 입력하세요.
            </h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-black text-[#637B76]">부모님 이름</span>
                <input
                  value={parentName}
                  onChange={(event) => setParentName(event.target.value.slice(0, 30))}
                  className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#637B76]">보호자 이름</span>
                <input
                  value={guardianName}
                  onChange={(event) => setGuardianName(event.target.value.slice(0, 30))}
                  className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#637B76]">부모님 연락처 선택</span>
                <input
                  value={parentPhone}
                  onChange={(event) => setParentPhone(event.target.value.replace(/[^\d-]/g, '').slice(0, 20))}
                  placeholder="선택 입력"
                  className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#637B76]">보호자 연락처 선택</span>
                <input
                  value={guardianPhone}
                  onChange={(event) => setGuardianPhone(event.target.value.replace(/[^\d-]/g, '').slice(0, 20))}
                  placeholder="선택 입력"
                  className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                />
              </label>
            </div>

            <label className="mt-5 block">
              <span className="text-sm font-black text-[#637B76]">받은 가족코드가 있으면 입력</span>
              <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  value={familyCode}
                  onChange={(event) => setFamilyCode(event.target.value.replace(/[^\w-]/g, '').slice(0, 32))}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') load()
                  }}
                  placeholder="예: ANBU-123ABC"
                  className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                />

                <button
                  onClick={() => load()}
                  disabled={loading || !familyCode.trim()}
                  className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50"
                >
                  코드 조회
                </button>
              </div>
            </label>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                onClick={createFamily}
                disabled={loading}
                className="rounded-2xl bg-[#EFFFFA] px-5 py-5 text-base font-black text-[#247A71] ring-1 ring-[#CDEFE7] disabled:opacity-50"
              >
                {loading ? '처리 중...' : family?.familyCode ? '가족 정보 업데이트' : '가족코드 만들기'}
              </button>

              <button
                onClick={() => joinFamily(role)}
                disabled={loading || !(family?.familyCode || familyCode)}
                className="rounded-2xl bg-white px-5 py-5 text-base font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50"
              >
                이 가족코드로 참여
              </button>
            </div>
          </article>

          <article className="rounded-[2rem] bg-white/95 p-6 shadow-sm ring-1 ring-[#D6EDE7]">
            <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7]">
              초대 링크
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-[-0.07em]">
              가족에게 보낼 링크입니다.
            </h2>

            <div className="mt-5 space-y-3">
              {[
                ['부모님 안부 앱', links.parent, '부모님이 오늘 상태를 남기는 화면'],
                ['보호자 오늘 리포트', links.guardianToday, '보호자가 오늘 상태와 다음 할 일을 확인하는 화면'],
                ['안부완료 리포트', links.guardianRing, '스마트링 안부리듬 참고 신호 화면'],
                ['보호자 대리입력', links.proxyCheckin, '전화 확인 후 보호자가 대신 기록하는 화면'],
                ['동의 화면', primaryHref, '실증 참여와 비의료 고지를 확인하는 화면']
              ].map(([label, href, desc]) => (
                <div key={label} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                  <div className="text-lg font-black">{label}</div>
                  <p className="mt-1 text-sm font-bold leading-6 text-[#637B76]">{desc}</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                    <code className="truncate rounded-xl bg-white px-3 py-2 text-xs font-black text-[#247A71] ring-1 ring-[#D6EDE7]">
                      {href || '가족코드를 먼저 만들어주세요.'}
                    </code>
                    <button
                      onClick={() => copyLink(String(href || ''), String(label))}
                      className="rounded-xl bg-white px-3 py-2 text-xs font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
                    >
                      복사
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Link
            href={primaryHref}
            className="rounded-[2rem] bg-[#EFFFFA] p-6 text-[#247A71] ring-1 ring-[#CDEFE7]"
          >
            <div className="text-sm font-black opacity-70">1단계</div>
            <div className="mt-3 text-2xl font-black tracking-[-0.06em]">동의하고 시작</div>
            <p className="mt-2 text-sm font-bold leading-7 opacity-75">비의료 고지와 개인정보 동의를 확인합니다.</p>
          </Link>

          <Link
            href={links.parent || '/mobile/parent'}
            className="rounded-[2rem] bg-white/95 p-6 text-[#17443F] ring-1 ring-[#D6EDE7]"
          >
            <div className="text-sm font-black text-[#637B76]">2단계</div>
            <div className="mt-3 text-2xl font-black tracking-[-0.06em]">부모님 안부 남기기</div>
            <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">큰 버튼으로 오늘 상태를 남깁니다.</p>
          </Link>

          <Link
            href={links.guardianToday || '/guardian/today'}
            className="rounded-[2rem] bg-white/95 p-6 text-[#17443F] ring-1 ring-[#D6EDE7]"
          >
            <div className="text-sm font-black text-[#637B76]">3단계</div>
            <div className="mt-3 text-2xl font-black tracking-[-0.06em]">보호자 리포트 확인</div>
            <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">오늘 상태와 다음 할 일을 확인합니다.</p>
          </Link>
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

export default FamilyInviteFlowPanel
