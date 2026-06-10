'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Recommendation = {
  priority: number
  title: string
  reason: string
  action: string
}

type Snapshot = {
  id: string
  title: string
  status: string
  reportType: string
  createdBy: string
  createdAt: string
  createdKst: string
  reportMarkdown: string
}

function toneClass(tone?: string) {
  if (['safe', 'ok'].includes(tone || '')) return 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
  if (['warning'].includes(tone || '')) return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  if (['danger'].includes(tone || '')) return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
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

export function PilotReportPanel() {
  const [metrics, setMetrics] = useState<Record<string, any>>({})
  const [funnel, setFunnel] = useState<Record<string, any>>({})
  const [survey, setSurvey] = useState<Record<string, any>>({})
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [reportMarkdown, setReportMarkdown] = useState('')
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [activeTab, setActiveTab] = useState<'summary' | 'survey' | 'report' | 'actions' | 'snapshots'>('summary')
  const [createdBy, setCreatedBy] = useState('운영실')
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)

  const riskLevel = useMemo(() => {
    if (Number(metrics.failedMessages || 0) > 0) return 'warning'
    if (Number(metrics.reportSuccessRate || 0) < 70 && Number(metrics.reportLookupAttempts || 0) > 0) return 'warning'
    if (Number(metrics.careSignals || 0) === 0) return 'warning'
    return 'safe'
  }, [metrics])

  async function load() {
    setLoading(true)

    try {
      const response = await fetch('/api/pilot-report', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '실증 리포트를 불러오지 못했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      setMetrics(data.metrics || {})
      setFunnel(data.funnel || {})
      setSurvey(data.survey || {})
      setRecommendations(Array.isArray(data.recommendations) ? data.recommendations : [])
      setReportMarkdown(data.reportMarkdown || '')
      setSnapshots(Array.isArray(data.snapshots) ? data.snapshots : [])
      setMessage('')
      setDebug('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '실증 리포트를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function saveSnapshot() {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/pilot-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveSnapshot', createdBy, title: '안부웍스 실증 리포트' })
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || result.ok === false) {
        setMessage(result.message || '스냅샷 저장에 실패했습니다.')
        setDebug(JSON.stringify(result.detail || result, null, 2))
        await load()
        return
      }

      setMessage(result.message || '스냅샷을 저장했습니다.')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '스냅샷 저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(reportMarkdown)
      setMessage('실증 리포트 본문을 복사했습니다.')
    } catch {
      setMessage('복사에 실패했습니다. 리포트 본문을 직접 선택해서 복사해주세요.')
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
            실증 리포트 자동 생성센터
          </div>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
                실증 결과를
                <br />
                외부 미팅용 리포트로 정리합니다.
              </h1>

              <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
                가입자, 실증 가구, 안부 신호, 문자, 리포트 조회, 미응답, 대리입력, 유저스푼 결과를 한 화면에서 요약합니다.
              </p>
            </div>

            <div className={'rounded-[2rem] px-6 py-5 text-center ring-1 ' + toneClass(riskLevel)}>
              <div className="text-sm font-black opacity-70">실증 상태</div>
              <div className="mt-2 text-4xl font-black tracking-[-0.08em]">
                {riskLevel === 'safe' ? '진행' : '보완'}
              </div>
              <div className="mt-2 text-xs font-bold">
                자동 분석 기준
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            외부에는 “가입자 수”만 보여주지 말고, 가입→가족연결→안부신호→리포트조회→문자 성공 전환을 함께 보여줘야 합니다.
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto]">
            <input
              value={createdBy}
              onChange={(event) => setCreatedBy(event.target.value)}
              placeholder="작성자"
              className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-bold outline-none"
            />

            <button onClick={load} disabled={loading} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50">
              새로고침
            </button>

            <button onClick={saveSnapshot} disabled={loading} className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50">
              스냅샷 저장
            </button>

            <button onClick={copyReport} disabled={!reportMarkdown} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50">
              리포트 복사
            </button>

            <button onClick={() => window.print()} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              인쇄/PDF
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/ops/users" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              가입자센터
            </Link>
            <Link href="/ops/report-tracking" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              리포트 조회 추적
            </Link>
            <Link href="/ops/no-response" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              미응답 처리
            </Link>
            <Link href="/portal/ops" className="rounded-2xl bg-[#FAFFFD] px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              운영실 홈
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
          <MetricCard title="가입자" value={`${Number(metrics.totalUsers || 0)}명`} desc="Auth 기준" tone="safe" />
          <MetricCard title="최근 24시간" value={`${Number(metrics.users24h || 0)}명`} desc="신규 가입" tone="safe" />
          <MetricCard title="가족/실증 가구" value={`${Number(metrics.totalFamilies || 0)}가구`} desc="운영 대상" tone={Number(metrics.totalFamilies || 0) > 0 ? 'safe' : 'warning'} />
          <MetricCard title="안부 신호" value={`${Number(metrics.careSignals || 0)}건`} desc="핵심 사용" tone={Number(metrics.careSignals || 0) > 0 ? 'safe' : 'warning'} />
          <MetricCard title="오늘 미응답" value={`${Number(metrics.noResponseFamilies || 0)}가구`} desc="확인 필요" tone={Number(metrics.noResponseFamilies || 0) > 0 ? 'warning' : 'safe'} />
          <MetricCard title="리포트 성공률" value={`${Number(metrics.reportSuccessRate || 0)}%`} desc="보호자 조회" tone={Number(metrics.reportSuccessRate || 0) >= 70 ? 'safe' : 'warning'} />
          <MetricCard title="문자 성공" value={`${Number(metrics.sentMessages || 0)}건`} desc="발송 완료" tone="safe" />
          <MetricCard title="문자 실패" value={`${Number(metrics.failedMessages || 0)}건`} desc="정리 필요" tone={Number(metrics.failedMessages || 0) > 0 ? 'danger' : 'safe'} />
        </section>

        <section className="grid gap-4 md:grid-cols-5">
          <MetricCard title="가입→로그인" value={`${Number(funnel.signupToSignin || 0)}%`} desc="로그인 전환" tone={Number(funnel.signupToSignin || 0) >= 70 ? 'safe' : 'warning'} />
          <MetricCard title="가입→가족연결" value={`${Number(funnel.signupToFamily || 0)}%`} desc="연결 전환" tone={Number(funnel.signupToFamily || 0) >= 30 ? 'safe' : 'warning'} />
          <MetricCard title="가족→안부신호" value={`${Number(funnel.familyToSignal || 0)}%`} desc="핵심 행동" tone={Number(funnel.familyToSignal || 0) >= 30 ? 'safe' : 'warning'} />
          <MetricCard title="가족→리포트" value={`${Number(funnel.familyToReport || 0)}%`} desc="보호자 가치" tone={Number(funnel.familyToReport || 0) >= 30 ? 'safe' : 'warning'} />
          <MetricCard title="문자 성공률" value={`${Number(funnel.messageSuccessRate || 0)}%`} desc="발송 품질" tone={Number(funnel.messageSuccessRate || 0) >= 80 ? 'safe' : 'warning'} />
        </section>

        <section className="rounded-[2rem] bg-white/95 p-3 shadow-sm ring-1 ring-[#D6EDE7]">
          <div className="grid gap-2 sm:grid-cols-5">
            {[
              ['summary', '실증 요약'],
              ['survey', '유저스푼'],
              ['actions', '개선 우선순위'],
              ['report', '복사용 리포트'],
              ['snapshots', '저장 기록']
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
              <h2 className="text-3xl font-black tracking-[-0.06em]">한 줄 결론</h2>
              <p className="mt-5 rounded-2xl bg-[#FAFFFD] p-5 text-base font-black leading-8 text-[#17443F] ring-1 ring-[#D6EDE7]">
                안부웍스는 가입과 관심은 확인됐고, 다음 검증은 부모님 연결·안부 신호·보호자 리포트 조회 전환율입니다.
              </p>
            </section>

            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">강한 신호</h2>
              <div className="mt-5 space-y-3">
                {[
                  [`가입자 ${Number(metrics.totalUsers || 0)}명`, '관심도와 유입은 확인됨'],
                  [`실증 가구 ${Number(metrics.totalFamilies || 0)}가구`, '운영 대상이 생성됨'],
                  [`문자 성공 ${Number(metrics.sentMessages || 0)}건`, '알림 인프라 일부 검증']
                ].map(([title, desc]) => (
                  <div key={title} className="rounded-2xl bg-[#EFFFFA] p-4 text-[#247A71] ring-1 ring-[#CDEFE7]">
                    <div className="text-lg font-black">{title}</div>
                    <p className="mt-1 text-sm font-bold leading-7 opacity-80">{desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">보완 신호</h2>
              <div className="mt-5 space-y-3">
                {[
                  [`역할 미분류 ${Number(metrics.unknownRoleUsers || 0)}명`, '가입자 분석을 위해 역할 저장 필요'],
                  [`오늘 미응답 ${Number(metrics.noResponseFamilies || 0)}가구`, '미응답 처리와 대리입력 필요'],
                  [`문자 실패 ${Number(metrics.failedMessages || 0)}건`, '문자 안전정리와 비용 보호 필요']
                ].map(([title, desc]) => (
                  <div key={title} className="rounded-2xl bg-[#FFF9EE] p-4 text-[#795C22] ring-1 ring-[#F3DEB5]">
                    <div className="text-lg font-black">{title}</div>
                    <p className="mt-1 text-sm font-bold leading-7 opacity-80">{desc}</p>
                  </div>
                ))}
              </div>
            </section>
          </section>
        ) : null}

        {activeTab === 'survey' ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">유저스푼 사용 경험 조사 요약</h2>

            <div className="mt-5 grid gap-4 md:grid-cols-4">
              <MetricCard title="응답자" value={`${Number(survey.respondents || 0)}명`} desc="조사 참여" tone="safe" />
              <MetricCard title="첫인상 긍정" value={`${Number(survey.firstImpressionPositiveRate || 0)}%`} desc={`${Number(survey.firstImpressionPositive || 0)}명`} tone="safe" />
              <MetricCard title="몸상태·응급 니즈" value={`${Number(survey.bodyAndEmergencyRate || 0)}%`} desc="핵심 필요정보" tone="safe" />
              <MetricCard title="유료 의향" value={`${Number(survey.payIntentRate || 0)}%`} desc="현재 기준" tone="warning" />
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {[
                ['가장 강한 니즈', `병원동행 ${Number(survey.hospitalCompanionNeed || 0)}명, 방문안부 ${Number(survey.visitCheckNeed || 0)}명`],
                ['가격 반응', `무료만 사용 ${Number(survey.freeOnly || 0)}명, 19,900원 가능 ${Number(survey.paid19900 || 0)}명`],
                ['제품 해석', String(survey.coreFinding || '')],
                ['방향 수정', '식사·복약 체크보다 몸 상태, 응급 여부, 방문확인, 병원동행, 보호자 안심 리포트를 전면화']
              ].map(([title, desc]) => (
                <div key={title} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                  <div className="text-lg font-black">{title}</div>
                  <p className="mt-1 text-sm font-bold leading-7 text-[#637B76]">{desc}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === 'actions' ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">개선 우선순위</h2>

            <div className="mt-5 space-y-3">
              {recommendations.map((item) => (
                <article key={item.priority} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Pill tone={item.priority <= 2 ? 'warning' : 'safe'}>{item.priority}순위</Pill>
                      </div>
                      <h3 className="mt-3 text-xl font-black tracking-[-0.05em]">{item.title}</h3>
                      <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                        사유: {item.reason}
                        <br />
                        조치: {item.action}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === 'report' ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="text-3xl font-black tracking-[-0.06em]">복사용 리포트</h2>
              <button onClick={copyReport} className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white">
                리포트 복사
              </button>
            </div>

            <pre className="mt-5 max-h-[720px] overflow-auto whitespace-pre-wrap rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold leading-7 text-[#17443F] ring-1 ring-[#D6EDE7]">
              {reportMarkdown || '리포트 본문이 없습니다.'}
            </pre>
          </section>
        ) : null}

        {activeTab === 'snapshots' ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">저장 기록</h2>

            <div className="mt-5 space-y-3">
              {snapshots.length ? (
                snapshots.map((snapshot) => (
                  <article key={snapshot.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    <div className="flex flex-wrap gap-2">
                      <Pill tone="safe">{snapshot.status || 'saved'}</Pill>
                      <Pill>{snapshot.reportType || 'pilot_report'}</Pill>
                    </div>

                    <h3 className="mt-3 text-lg font-black">{snapshot.title || '실증 리포트'}</h3>
                    <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                      {snapshot.createdBy || '-'} · {snapshot.createdKst || snapshot.createdAt || '-'}
                    </p>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                  아직 저장한 스냅샷이 없습니다.
                </div>
              )}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  )
}

export default PilotReportPanel
