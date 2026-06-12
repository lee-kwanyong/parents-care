'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type InviteFamily = {
  id: string
  source: string
  familyCode: string
  pilotKey: string
  parentName: string
  parentPhone: string
  guardianName: string
  guardianPhone: string
  guardianEmail: string
  serviceArea: string
  addressHint: string
  status: string
  createdKst: string
  guardianPhoneLast4: string
  parentPhoneLast4: string
  links: Record<string, string>
  templates: Record<string, string>
}

type EventRow = {
  id: string
  action: string
  familyCode: string
  targetRole: string
  channel: string
  templateKey: string
  targetUrl: string
  copiedText: string
  createdBy: string
  createdKst: string
}

function toneClass(tone?: string) {
  if (tone === 'safe') return 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
  if (tone === 'warning') return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  if (tone === 'danger') return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
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

function labelForLink(key: string) {
  const labels: Record<string, string> = {
    guardianStart: '보호자 시작 링크',
    guardianRole: '보호자 역할 저장',
    consentGuardian: '보호자 동의서',
    consentParent: '부모님 동의서',
    parentApp: '부모님 앱 링크',
    guardianReport: '보호자 리포트',
    guardianReportTest: '리포트 내부 테스트용',
    guardianProxy: '보호자 대리입력',
    opsProxy: '운영실 대리입력',
    noResponse: '미응답 처리센터',
    providerRequests: '파트너 요청함',
    opsHome: '운영실 홈',
    home: '안부웍스 홈',
    onboarding: '가입 후 시작하기',
    mobileParent: '부모님 앱',
    guardianToday: '보호자 리포트',
    consentProvider: '파트너 동의서'
  }

  return labels[key] || key
}

function labelForTemplate(key: string) {
  const labels: Record<string, string> = {
    guardianSms: '보호자 문자',
    parentSms: '부모님 문자',
    consentOnly: '동의서만 보내기',
    guardianKakao: '보호자 카톡',
    careCenter: '방문요양센터/기관 문의',
    providerRecruit: '생활확인 파트너 모집'
  }

  return labels[key] || key
}

function roleForTemplate(key: string) {
  if (key.includes('parent')) return 'parent'
  if (key.includes('provider')) return 'provider'
  if (key.includes('careCenter')) return 'partner'
  return 'guardian'
}

export function InviteCenterPanel() {
  const [families, setFamilies] = useState<InviteFamily[]>([])
  const [events, setEvents] = useState<EventRow[]>([])
  const [metrics, setMetrics] = useState<Record<string, any>>({})
  const [genericLinks, setGenericLinks] = useState<Record<string, string>>({})
  const [genericTemplates, setGenericTemplates] = useState<Record<string, string>>({})
  const [selectedFamilyCode, setSelectedFamilyCode] = useState('')
  const [activeTab, setActiveTab] = useState<'links' | 'templates' | 'families' | 'events'>('templates')
  const [createdBy, setCreatedBy] = useState('운영실')
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)

  const selectedFamily = useMemo(() => {
    return families.find((family) => family.familyCode === selectedFamilyCode) || families[0] || null
  }, [families, selectedFamilyCode])

  const linkEntries = useMemo(() => {
    if (selectedFamily) return Object.entries(selectedFamily.links || {})
    return Object.entries(genericLinks || {})
  }, [selectedFamily, genericLinks])

  const templateEntries = useMemo(() => {
    if (selectedFamily) return Object.entries(selectedFamily.templates || {})
    return Object.entries(genericTemplates || {})
  }, [selectedFamily, genericTemplates])

  async function load() {
    setLoading(true)

    try {
      const response = await fetch('/api/invite-center', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '초대 링크 정보를 불러오지 못했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      const nextFamilies = Array.isArray(data.families) ? data.families : []

      setFamilies(nextFamilies)
      setEvents(Array.isArray(data.events) ? data.events : [])
      setMetrics(data.metrics || {})
      setGenericLinks(data.genericLinks || {})
      setGenericTemplates(data.genericTemplates || {})

      if (!selectedFamilyCode && nextFamilies[0]?.familyCode) {
        setSelectedFamilyCode(nextFamilies[0].familyCode)
      }

      setMessage('')
      setDebug('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '초대 링크 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function logCopy(args: {
    copiedText: string
    templateKey: string
    targetRole?: string
    channel?: string
    targetUrl?: string
  }) {
    try {
      await fetch('/api/invite-center', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'logCopy',
          familyCode: selectedFamily?.familyCode || '',
          targetRole: args.targetRole || '',
          channel: args.channel || 'copy',
          templateKey: args.templateKey,
          targetUrl: args.targetUrl || '',
          copiedText: args.copiedText,
          createdBy,
          path: typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/admin/ops/invite-center'
        })
      })
    } catch {
      // 복사 기록 실패가 운영 흐름을 막으면 안 됩니다.
    }
  }

  async function copyText(value: string, templateKey: string, targetRole?: string, channel?: string, targetUrl?: string) {
    try {
      await navigator.clipboard.writeText(value)
      await logCopy({
        copiedText: value,
        templateKey,
        targetRole,
        channel,
        targetUrl
      })
      setMessage('복사했습니다.')
      await load()
    } catch {
      setMessage('복사에 실패했습니다. 직접 선택해서 복사해주세요.')
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-7 text-[#17443F] sm:px-5 sm:py-10">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white/95 p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            실증 참여자 초대 링크 관리센터
          </div>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
                보호자·부모님·파트너에게
                <br />
                보낼 링크를 한 번에 복사합니다.
              </h1>

              <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
                동의서, 부모님 앱, 보호자 리포트, 대리입력, 파트너 요청함, 방문요양센터 안내 문구를 가구별로 자동 생성합니다.
              </p>
            </div>

            <div className="rounded-[2rem] bg-[#EFFFFA] px-6 py-5 text-center text-[#247A71] ring-1 ring-[#CDEFE7]">
              <div className="text-sm font-black opacity-70">초대 대상</div>
              <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{Number(metrics.totalFamilies || 0)}가구</div>
              <div className="mt-2 text-xs font-bold">복사 {Number(metrics.copyEvents || 0)}건</div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            보호자 리포트 내부 테스트용 링크에는 휴대폰 뒤 4자리가 포함될 수 있습니다. 외부 공유는 “보호자 리포트” 링크와 가족코드 안내 방식으로 보내세요.
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <input
              value={createdBy}
              onChange={(event) => setCreatedBy(event.target.value)}
              placeholder="처리자"
              className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-bold outline-none"
            />

            <select
              value={selectedFamilyCode}
              onChange={(event) => setSelectedFamilyCode(event.target.value)}
              className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
            >
              {families.length ? (
                families.map((family) => (
                  <option key={family.familyCode} value={family.familyCode}>
                    {family.familyCode} · {family.parentName} · {family.guardianName}
                  </option>
                ))
              ) : (
                <option value="">가구 없음</option>
              )}
            </select>

            <button onClick={load} disabled={loading} className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50">
              새로고침
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/admin/ops/private-pilot" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              실증 가구 관리
            </Link>
            <Link href="/consent" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              동의서
            </Link>
            <Link href="/admin/ops/today-runbook" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              오늘 운영센터
            </Link>
            <Link href="/admin/ops" className="rounded-2xl bg-[#FAFFFD] px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              운영실 홈
            </Link>
          </div>

          {selectedFamily ? (
            <div className="mt-5 rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
              <div className="flex flex-wrap gap-2">
                <Pill tone="safe">{selectedFamily.familyCode}</Pill>
                <Pill>{selectedFamily.source}</Pill>
                <Pill>{selectedFamily.serviceArea || '권역 없음'}</Pill>
              </div>

              <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">
                부모님 {selectedFamily.parentName || '-'} · 보호자 {selectedFamily.guardianName || '-'} · 보호자 번호 {selectedFamily.guardianPhone || '-'}
              </p>
            </div>
          ) : null}

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

        <section className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
          <MetricCard title="전체 가구" value={`${Number(metrics.totalFamilies || 0)}가구`} desc="초대 대상" tone="safe" />
          <MetricCard title="실증 가구" value={`${Number(metrics.pilotFamilies || 0)}가구`} desc="private pilot" tone="safe" />
          <MetricCard title="가족 연결" value={`${Number(metrics.linkedFamilies || 0)}건`} desc="family links" />
          <MetricCard title="보호자 대상" value={`${Number(metrics.guardianTargets || 0)}명`} desc="연락 가능" tone="safe" />
          <MetricCard title="오늘 복사" value={`${Number(metrics.todayCopyEvents || 0)}건`} desc="오늘 기록" tone="safe" />
          <MetricCard title="누적 복사" value={`${Number(metrics.copyEvents || 0)}건`} desc="전체 기록" />
        </section>

        <section className="rounded-[2rem] bg-white/95 p-3 shadow-sm ring-1 ring-[#D6EDE7]">
          <div className="grid gap-2 sm:grid-cols-4">
            {[
              ['templates', '초대 문구'],
              ['links', '링크'],
              ['families', '가구 목록'],
              ['events', '복사 기록']
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as typeof activeTab)}
                className={
                  'rounded-2xl px-4 py-4 text-sm font-black ring-1 ' +
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

        {activeTab === 'templates' ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">대상별 초대 문구</h2>

            <div className="mt-5 grid gap-4">
              {templateEntries.map(([key, value]) => (
                <article key={key} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Pill tone="safe">{labelForTemplate(key)}</Pill>
                        <Pill>{roleForTemplate(key)}</Pill>
                      </div>
                      <h3 className="mt-3 text-xl font-black tracking-[-0.05em]">{labelForTemplate(key)}</h3>
                    </div>

                    <button
                      onClick={() => copyText(value, key, roleForTemplate(key), key.includes('Kakao') ? 'kakao' : 'sms')}
                      className="rounded-xl bg-[#247A71] px-4 py-3 text-xs font-black text-white"
                    >
                      문구 복사
                    </button>
                  </div>

                  <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap rounded-2xl bg-white p-4 text-sm font-bold leading-7 text-[#17443F] ring-1 ring-[#D6EDE7]">
                    {value}
                  </pre>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === 'links' ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">가구별 링크</h2>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {linkEntries.map(([key, value]) => (
                <article key={key} className={'rounded-2xl p-4 ring-1 ' + toneClass(key.includes('Test') ? 'warning' : 'normal')}>
                  <div className="flex flex-wrap gap-2">
                    <Pill tone={key.includes('Test') ? 'warning' : 'safe'}>{labelForLink(key)}</Pill>
                  </div>

                  <h3 className="mt-3 text-lg font-black">{labelForLink(key)}</h3>
                  <p className="mt-2 break-all text-xs font-bold leading-6 text-[#637B76]">{value}</p>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <button
                      onClick={() => copyText(value, key, '', 'link', value)}
                      className="rounded-xl bg-[#247A71] px-4 py-3 text-xs font-black text-white"
                    >
                      링크 복사
                    </button>

                    <Link href={value} className="rounded-xl bg-white px-4 py-3 text-center text-xs font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                      열기
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === 'families' ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">초대 대상 가구</h2>

            <div className="mt-5 space-y-3">
              {families.length ? (
                families.map((family) => (
                  <article key={family.familyCode} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <Pill tone="safe">{family.familyCode}</Pill>
                          <Pill>{family.source}</Pill>
                        </div>

                        <h3 className="mt-3 text-lg font-black">{family.parentName} · 보호자 {family.guardianName}</h3>

                        <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                          보호자 {family.guardianPhone || family.guardianEmail || '-'} · 권역 {family.serviceArea || '-'} · 생성 {family.createdKst || '-'}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedFamilyCode(family.familyCode)
                          setActiveTab('templates')
                        }}
                        className="rounded-xl bg-[#247A71] px-4 py-3 text-xs font-black text-white"
                      >
                        이 가구 선택
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                  초대 가능한 가구가 없습니다. /ops/private-pilot에서 실증 가구를 먼저 생성하세요.
                </div>
              )}
            </div>
          </section>
        ) : null}

        {activeTab === 'events' ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">복사 기록</h2>

            <div className="mt-5 space-y-3">
              {events.length ? (
                events.map((event) => (
                  <article key={event.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    <div className="flex flex-wrap gap-2">
                      <Pill tone="safe">{event.templateKey || event.action}</Pill>
                      <Pill>{event.familyCode || '-'}</Pill>
                      <Pill>{event.channel || 'copy'}</Pill>
                    </div>

                    <h3 className="mt-3 text-lg font-black">{event.createdBy || '운영실'} · {event.createdKst || '-'}</h3>

                    <p className="mt-2 line-clamp-3 text-sm font-bold leading-7 text-[#637B76]">
                      {event.copiedText || event.targetUrl || '-'}
                    </p>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                  아직 복사 기록이 없습니다.
                </div>
              )}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  )
}

export default InviteCenterPanel
