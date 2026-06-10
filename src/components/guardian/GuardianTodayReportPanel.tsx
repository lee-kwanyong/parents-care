'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'

type Report = {
  familyCode: string
  parentName: string
  guardianName: string
  serviceArea: string
  parentAppUrl: string
  status: {
    level: string
    label: string
    message: string
  }
  latestSignal: null | {
    signalType: string
    signalLabel: string
    riskLevel: string
    requestStatus: string
    createdKst: string
    requestedAction: string
  }
  metrics: Record<string, number>
  requests: Array<Record<string, string>>
  messages: Array<Record<string, string>>
  nextAction: string
}

function toneClass(level?: string) {
  if (level === 'safe') return 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
  if (level === 'warning') return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  if (level === 'urgent') return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
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

function Input({
  label,
  value,
  onChange,
  placeholder,
  inputMode
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  inputMode?: 'text' | 'numeric' | 'tel'
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-[#637B76]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-base font-bold outline-none"
      />
    </label>
  )
}

export function GuardianTodayReportPanel() {
  const params = useSearchParams()
  const [familyCode, setFamilyCode] = useState('')
  const [last4, setLast4] = useState('')
  const [report, setReport] = useState<Report | null>(null)
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)

  const metrics = report?.metrics || {}

  const statusTone = useMemo(() => {
    if (!report) return 'empty'
    return report.status.level
  }, [report])

  useEffect(() => {
    const qFamilyCode = params.get('familyCode') || ''
    const qLast4 = params.get('last4') || ''

    const storedFamilyCode = typeof window !== 'undefined' ? localStorage.getItem('anbu_guardian_family_code') || '' : ''
    const storedLast4 = typeof window !== 'undefined' ? localStorage.getItem('anbu_guardian_last4') || '' : ''

    const nextFamilyCode = qFamilyCode || storedFamilyCode
    const nextLast4 = qLast4 || storedLast4

    if (nextFamilyCode) setFamilyCode(nextFamilyCode)
    if (nextLast4) setLast4(nextLast4)

    if (nextFamilyCode && nextLast4) {
      loadReport(nextFamilyCode, nextLast4)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  async function loadReport(nextFamilyCode = familyCode, nextLast4 = last4) {
    const cleanFamilyCode = nextFamilyCode.trim()
    const cleanLast4 = nextLast4.replace(/[^\d]/g, '').slice(-4)

    if (!cleanFamilyCode || cleanLast4.length !== 4) {
      setMessage('가족코드와 휴대폰 뒤 4자리를 입력해주세요.')
      return
    }

    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('anbu_guardian_family_code', cleanFamilyCode)
        localStorage.setItem('anbu_guardian_last4', cleanLast4)
      }

      const search = new URLSearchParams()
      search.set('familyCode', cleanFamilyCode)
      search.set('last4', cleanLast4)

      const response = await fetch('/api/guardian-report?' + search.toString(), { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setReport(null)
        setMessage(data.message || '리포트를 찾지 못했습니다.')
        setDebug(JSON.stringify(data, null, 2))
        return
      }

      setReport(data.report)
      setMessage(data.report ? '오늘 리포트를 불러왔습니다.' : data.message || '')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '리포트를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function copyParentLink() {
    if (!report?.parentAppUrl) return

    try {
      await navigator.clipboard.writeText(report.parentAppUrl)
      setMessage('부모님 앱 링크를 복사했습니다.')
    } catch {
      setMessage('복사에 실패했습니다. 링크를 직접 열어주세요.')
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-7 text-[#17443F] sm:px-5 sm:py-10">
      <section className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-[2rem] bg-white/95 p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            자녀·보호자 오늘 리포트
          </div>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
                오늘 부모님 상태를
                <br />
                한 화면에서 확인합니다.
              </h1>

              <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
                가족코드와 휴대폰 뒤 4자리만 입력하면 안부 신호, 문자 알림, 다음 할 일을 바로 확인할 수 있습니다.
              </p>
            </div>

            <div className={'rounded-[2rem] px-6 py-5 text-center ring-1 ' + toneClass(statusTone)}>
              <div className="text-sm font-black opacity-70">오늘 상태</div>
              <div className="mt-2 text-4xl font-black tracking-[-0.08em]">
                {report?.status.label || '확인 전'}
              </div>
              <div className="mt-2 text-xs font-bold">
                {report?.latestSignal?.createdKst || '안부 신호 대기'}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            안부웍스는 119를 대체하지 않습니다. 낙상, 의식저하, 호흡곤란, 심한 통증 등 응급상황은 즉시 119 또는 의료기관에 연락해주세요.
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_0.8fr_auto]">
            <Input
              label="가족코드"
              value={familyCode}
              onChange={setFamilyCode}
              placeholder="예: 123456"
              inputMode="text"
            />

            <Input
              label="보호자 또는 부모님 휴대폰 뒤 4자리"
              value={last4}
              onChange={(value) => setLast4(value.replace(/[^\d]/g, '').slice(-4))}
              placeholder="예: 0336"
              inputMode="numeric"
            />

            <button
              onClick={() => loadReport()}
              disabled={loading}
              className="self-end rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
            >
              {loading ? '확인 중' : '리포트 확인'}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/family-link" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              부모님 연결코드 만들기
            </Link>

            <Link href="/mobile/parent" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              부모님 앱 열기
            </Link>

            {report?.parentAppUrl ? (
              <>
                <button onClick={copyParentLink} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                  부모님 앱 링크 복사
                </button>

                <Link href={report.parentAppUrl} className="rounded-2xl bg-[#FAFFFD] px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                  부모님 앱 링크 열기
                </Link>
              </>
            ) : null}
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#EFFFFA] p-4 text-sm font-black leading-7 text-[#247A71] ring-1 ring-[#CDEFE7]">
              {message}
            </div>
          ) : null}

          {debug ? (
            <details className="mt-4 rounded-2xl bg-[#247A71] p-4 text-xs font-bold leading-6 text-white">
              <summary className="cursor-pointer text-sm font-black">상세 보기</summary>
              <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap">{debug}</pre>
            </details>
          ) : null}
        </section>

        {report ? (
          <>
            <section className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
              <MetricCard title="안부 신호" value={`${metrics.totalSignals || 0}건`} desc="누적" tone={(metrics.totalSignals || 0) > 0 ? 'safe' : 'empty'} />
              <MetricCard title="괜찮아요" value={`${metrics.okSignals || 0}건`} desc="정상" tone="safe" />
              <MetricCard title="주의 신호" value={`${metrics.warningSignals || 0}건`} desc="식사/약/몸" tone={(metrics.warningSignals || 0) > 0 ? 'warning' : 'empty'} />
              <MetricCard title="긴급 신호" value={`${metrics.urgentSignals || 0}건`} desc="도움 요청" tone={(metrics.urgentSignals || 0) > 0 ? 'urgent' : 'safe'} />
              <MetricCard title="완료" value={`${metrics.completed || 0}건`} desc="처리 완료" tone="safe" />
              <MetricCard title="열린 사건" value={`${metrics.open || 0}건`} desc="확인 필요" tone={(metrics.open || 0) > 0 ? 'urgent' : 'safe'} />
              <MetricCard title="문자 성공" value={`${metrics.sentMessages || 0}건`} desc="보호자 알림" tone="safe" />
              <MetricCard title="문자 실패" value={`${metrics.failedMessages || 0}건`} desc="재확인" tone={(metrics.failedMessages || 0) > 0 ? 'urgent' : 'empty'} />
            </section>

            <section className={'rounded-[2rem] p-5 shadow-sm ring-1 sm:p-6 ' + toneClass(report.status.level)}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-black opacity-70">{report.parentName} · {report.serviceArea}</div>
                  <h2 className="mt-2 text-3xl font-black tracking-[-0.06em]">{report.status.label}</h2>
                  <p className="mt-3 text-sm font-bold leading-7 opacity-80">{report.status.message}</p>
                </div>

                <div className="rounded-2xl bg-white/80 p-4 text-sm font-black leading-7 ring-1 ring-current/10">
                  다음 할 일:
                  <br />
                  {report.nextAction}
                </div>
              </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
              <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
                <h2 className="text-3xl font-black tracking-[-0.06em]">최근 안부 신호</h2>

                <div className="mt-5 space-y-3">
                  {report.requests.length ? (
                    report.requests.map((item) => (
                      <article key={item.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-[#EFFFFA] px-3 py-1 text-xs font-black text-[#247A71] ring-1 ring-[#CDEFE7]">
                            {item.signalLabel || item.signalType}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#637B76] ring-1 ring-[#D6EDE7]">
                            {item.status}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#637B76] ring-1 ring-[#D6EDE7]">
                            {item.createdKst}
                          </span>
                        </div>
                        <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">
                          {item.requestedAction || '기록된 후속조치가 없습니다.'}
                        </p>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D6EDE7]">
                      아직 안부 신호가 없습니다. 부모님 앱 링크를 열고 “괜찮아요”를 먼저 눌러보세요.
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
                <h2 className="text-3xl font-black tracking-[-0.06em]">보호자 문자 기록</h2>

                <div className="mt-5 space-y-3">
                  {report.messages.length ? (
                    report.messages.map((item) => (
                      <article key={item.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                        <div className="flex flex-wrap gap-2">
                          <span className={'rounded-full px-3 py-1 text-xs font-black ring-1 ' + toneClass(item.status === 'sent' ? 'safe' : item.status === 'failed' ? 'urgent' : 'warning')}>
                            {item.status}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#637B76] ring-1 ring-[#D6EDE7]">
                            {item.createdKst}
                          </span>
                        </div>
                        <h3 className="mt-3 text-base font-black">{item.title || '안부웍스 알림'}</h3>
                        <p className="mt-2 line-clamp-4 text-sm font-bold leading-7 text-[#637B76]">{item.body}</p>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D6EDE7]">
                      아직 보호자 문자 기록이 없습니다. 안부 신호가 들어오면 상황별 알림이 생성됩니다.
                    </div>
                  )}
                </div>
              </section>
            </section>
          </>
        ) : (
          <section className="grid gap-5 lg:grid-cols-3">
            {[
              ['1', '부모님 연결코드 만들기', '보호자가 가족코드를 만들고 부모님과 연결합니다.', '/family-link', '연결코드 만들기'],
              ['2', '부모님 앱 링크 보내기', '부모님은 큰 버튼 5개로 오늘 상태를 보냅니다.', '/mobile/parent', '부모님 앱 보기'],
              ['3', '오늘 리포트 확인하기', '보호자는 오늘 상태와 다음 할 일을 한 화면에서 봅니다.', '/guardian/today', '리포트 확인']
            ].map(([num, title, desc, href, cta]) => (
              <article key={num} className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EFFFFA] text-xl font-black text-[#247A71] ring-1 ring-[#CDEFE7]">
                  {num}
                </div>
                <h2 className="mt-4 text-2xl font-black tracking-[-0.06em]">{title}</h2>
                <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">{desc}</p>
                <Link href={href} className="mt-5 block rounded-2xl bg-[#247A71] px-5 py-4 text-center text-sm font-black text-white">
                  {cta}
                </Link>
              </article>
            ))}
          </section>
        )}

        <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <h2 className="text-3xl font-black tracking-[-0.06em]">리포트가 안 보이면</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              ['가족코드 확인', '부모님 연결코드 6자리가 맞는지 확인해주세요.'],
              ['휴대폰 뒤 4자리 확인', '보호자 또는 부모님 휴대폰 뒤 4자리를 입력해야 합니다.'],
              ['안부 신호 확인', '아직 부모님이 버튼을 누르지 않았다면 리포트가 비어 있을 수 있습니다.'],
              ['문자 기록 확인', '문자 비용 또는 발송 설정 때문에 실제 수신 전일 수 있습니다.']
            ].map(([title, desc]) => (
              <div key={title} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                <div className="text-lg font-black">{title}</div>
                <p className="mt-1 text-sm font-bold leading-7 text-[#637B76]">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}

export default GuardianTodayReportPanel
