'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Audience = 'customer' | 'b2g' | 'ir' | 'internal'
type Severity = 'danger' | 'watch' | 'info'

type Finding = {
  id: string
  title: string
  category: string
  severity: Severity
  term: string
  snippet: string
  suggestion: string
  safeExpression: string
  index: number
}

type Template = {
  id: string
  title: string
  audience: Audience
  text: string
}

type Rule = {
  id: string
  title: string
  category: string
  severity: Severity
  terms: string[]
  suggestion: string
  safeExpression: string
}

type Result = {
  ok: boolean
  message?: string
  audience?: Audience
  score?: number
  summary?: string
  counts?: {
    danger: number
    watch: number
    info: number
  }
  findings?: Finding[]
  rewritten?: string
  recommendedDisclaimer?: string
}

type InitData = {
  ok: boolean
  message?: string
  templates?: Template[]
  rules?: Rule[]
}

function severityClass(severity: Severity) {
  if (severity === 'danger') return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  if (severity === 'watch') return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  return 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
}

function severityLabel(severity: Severity) {
  if (severity === 'danger') return '위험'
  if (severity === 'watch') return '주의'
  return '참고'
}

function audienceLabel(audience: Audience) {
  if (audience === 'customer') return '고객 화면'
  if (audience === 'b2g') return '지자체/B2G 제안'
  if (audience === 'ir') return 'IR/투자 제안'
  return '내부 검토'
}

function localHistoryKey() {
  return 'anbu-proposal-compliance-history'
}

function readHistory(): Array<{ input: string; rewritten: string; score: number; at: string }> {
  if (typeof window === 'undefined') return []

  try {
    return JSON.parse(window.localStorage.getItem(localHistoryKey()) || '[]')
  } catch {
    return []
  }
}

function writeHistory(items: Array<{ input: string; rewritten: string; score: number; at: string }>) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(localHistoryKey(), JSON.stringify(items.slice(0, 20)))
}

export function AdminProposalCompliancePanel() {
  const [input, setInput] = useState('')
  const [audience, setAudience] = useState<Audience>('customer')
  const [result, setResult] = useState<Result | null>(null)
  const [initData, setInitData] = useState<InitData | null>(null)
  const [history, setHistory] = useState<Array<{ input: string; rewritten: string; score: number; at: string }>>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const findings = result?.findings || []
  const dangerCount = result?.counts?.danger || 0
  const watchCount = result?.counts?.watch || 0
  const infoCount = result?.counts?.info || 0

  const groupedFindings = useMemo(() => {
    return findings.reduce<Record<string, Finding[]>>((acc, finding) => {
      acc[finding.category] = acc[finding.category] || []
      acc[finding.category].push(finding)
      return acc
    }, {})
  }, [findings])

  async function loadInit() {
    try {
      const response = await fetch('/api/admin-proposal-compliance', {
        cache: 'no-store',
        credentials: 'include'
      })

      const data = await response.json().catch(() => ({}))
      setInitData(data)
    } catch {
      // 초기 데이터 실패는 분석 기능에는 영향 없음
    }
  }

  async function analyze() {
    if (!input.trim()) {
      setMessage('점검할 문장을 입력해주세요.')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin-proposal-compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          text: input,
          audience
        })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || data.ok === false) {
        setMessage(data.message || '표현 점검에 실패했습니다.')
        setResult(data)
        return
      }

      setResult(data)

      const nextHistory = [
        {
          input,
          rewritten: data.rewritten || '',
          score: data.score || 0,
          at: new Date().toISOString()
        },
        ...readHistory()
      ].slice(0, 20)

      writeHistory(nextHistory)
      setHistory(nextHistory)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '표현 점검에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function copyText(value: string, label: string) {
    if (!value) {
      setMessage('복사할 내용이 없습니다.')
      return
    }

    try {
      await navigator.clipboard.writeText(value)
      setMessage(`${label}을 복사했습니다.`)
    } catch {
      setMessage('복사에 실패했습니다. 브라우저 권한을 확인해주세요.')
    }
  }

  function applyTemplate(template: Template) {
    setInput(template.text)
    setAudience(template.audience)
    setResult(null)
    setMessage(`${template.title} 템플릿을 불러왔습니다.`)
  }

  function loadHistory(item: { input: string; rewritten: string; score: number; at: string }) {
    setInput(item.input)
    setResult({
      ok: true,
      score: item.score,
      summary: '이전 점검 기록입니다. 다시 점검하면 최신 규칙으로 확인합니다.',
      rewritten: item.rewritten,
      findings: [],
      counts: {
        danger: 0,
        watch: 0,
        info: 0
      }
    })
  }

  useEffect(() => {
    setHistory(readHistory())
    loadInit()
  }, [])

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#E7FFF7_0%,#F7FFFC_34%,#FFFFFF_72%)] px-4 py-8 text-[#17443F]">
      <section className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[2.5rem] bg-white/95 shadow-[0_24px_80px_rgba(49,151,136,0.10)] ring-1 ring-[#D6EDE7]">
          <div className="grid gap-0 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="p-6 sm:p-9">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#FFF9EE] px-4 py-2 text-sm font-black text-[#795C22] ring-1 ring-[#F3DEB5]">
                  제안 표현 점검
                </span>
                <span className="rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7]">
                  비의료 안부 참고 표현
                </span>
                <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                  Admin 전용
                </span>
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.08em] sm:text-6xl">
                위험한 제안 문장을
                <br />
                안전한 표현으로 바꿉니다.
              </h1>

              <p className="mt-5 max-w-3xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
                의료, 생체, 119, 오탐률, 보장, 자동판단 같은 표현을 찾아서 고객 화면·지자체 제안·IR 문서에 맞는 문장으로 낮춥니다.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  onClick={analyze}
                  disabled={loading}
                  className="rounded-2xl bg-[#EFFFFA] px-5 py-4 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7] disabled:opacity-50"
                >
                  {loading ? '점검 중...' : '표현 점검하기'}
                </button>

                <button
                  onClick={() => copyText(result?.rewritten || '', '수정 문장')}
                  className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
                >
                  수정 문장 복사
                </button>

                <button
                  onClick={() => copyText(result?.recommendedDisclaimer || '', '고지 문구')}
                  className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
                >
                  고지 문구 복사
                </button>

                <Link
                  href="/admin/ops/gov-rnd"
                  className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
                >
                  지자체·R&D
                </Link>

                <Link
                  href="/admin/ops"
                  className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
                >
                  Admin 운영실
                </Link>
              </div>
            </div>

            <aside className="bg-[linear-gradient(135deg,#FFF9EE_0%,#F7FFFC_50%,#FFFFFF_100%)] p-6 sm:p-9">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/90 p-5 ring-1 ring-[#D6EDE7]">
                  <div className="text-xs font-black text-[#637B76]">안전 점수</div>
                  <div className="mt-2 text-5xl font-black tracking-[-0.08em] text-[#247A71]">
                    {result?.score ?? '-'}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/90 p-5 ring-1 ring-[#D6EDE7]">
                  <div className="text-xs font-black text-[#637B76]">위험 표현</div>
                  <div className="mt-2 text-5xl font-black tracking-[-0.08em] text-[#8A3030]">
                    {dangerCount}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/90 p-5 ring-1 ring-[#D6EDE7]">
                  <div className="text-xs font-black text-[#637B76]">주의 표현</div>
                  <div className="mt-2 text-5xl font-black tracking-[-0.08em] text-[#795C22]">
                    {watchCount}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/90 p-5 ring-1 ring-[#D6EDE7]">
                  <div className="text-xs font-black text-[#637B76]">참고 표현</div>
                  <div className="mt-2 text-5xl font-black tracking-[-0.08em] text-[#247A71]">
                    {infoCount}
                  </div>
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

        <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7]">
                템플릿
              </span>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.07em]">자주 쓰는 문장 점검</h2>
            </div>

            <select
              value={audience}
              onChange={(event) => setAudience(event.target.value as Audience)}
              className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
            >
              <option value="customer">고객 화면</option>
              <option value="b2g">지자체/B2G 제안</option>
              <option value="ir">IR/투자 제안</option>
              <option value="internal">내부 검토</option>
            </select>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {(initData?.templates || []).map((template) => (
              <button
                key={template.id}
                onClick={() => applyTemplate(template)}
                className="rounded-2xl bg-[#FAFFFD] p-4 text-left ring-1 ring-[#D6EDE7] transition hover:-translate-y-0.5 hover:bg-white"
              >
                <div className="text-lg font-black tracking-[-0.05em]">{template.title}</div>
                <p className="mt-2 text-xs font-bold leading-6 text-[#637B76]">
                  {audienceLabel(template.audience)}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <article className="rounded-[2rem] bg-white/95 p-6 shadow-sm ring-1 ring-[#D6EDE7]">
            <div className="inline-flex rounded-full bg-[#FAFFFD] px-4 py-2 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              원문
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-[-0.07em]">점검할 문장</h2>

            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value.slice(0, 12000))}
              placeholder="사업계획서, 제안서, 고객 화면 문구, 이메일 문장을 붙여넣으세요."
              className="mt-5 min-h-[380px] w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-bold leading-7 outline-none focus:border-[#2AA897] focus:ring-4 focus:ring-[#D8FFF3]"
            />

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={analyze}
                disabled={loading}
                className="rounded-2xl bg-[#EFFFFA] px-5 py-4 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7] disabled:opacity-50"
              >
                {loading ? '점검 중...' : '표현 점검하기'}
              </button>

              <button
                onClick={() => {
                  setInput('')
                  setResult(null)
                }}
                className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
              >
                비우기
              </button>
            </div>
          </article>

          <article className="rounded-[2rem] bg-white/95 p-6 shadow-sm ring-1 ring-[#D6EDE7]">
            <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7]">
              수정안
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-[-0.07em]">안전한 표현</h2>

            <textarea
              value={result?.rewritten || ''}
              onChange={(event) => {
                setResult((prev) => ({
                  ...(prev || { ok: true }),
                  rewritten: event.target.value
                }))
              }}
              placeholder="점검 후 수정 문장이 여기에 표시됩니다."
              className="mt-5 min-h-[380px] w-full rounded-2xl border border-[#D6EDE7] bg-[#FAFFFD] px-4 py-4 text-sm font-bold leading-7 outline-none focus:border-[#2AA897] focus:ring-4 focus:ring-[#D8FFF3]"
            />

            {result?.summary ? (
              <div className="mt-4 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
                {result.summary}
              </div>
            ) : null}

            {result?.recommendedDisclaimer ? (
              <div className="mt-3 rounded-2xl bg-[#FAFFFD] p-4 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D6EDE7]">
                <span className="font-black text-[#17443F]">권장 고지: </span>
                {result.recommendedDisclaimer}
              </div>
            ) : null}
          </article>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-[2rem] bg-white/95 p-6 shadow-sm ring-1 ring-[#D6EDE7]">
            <div className="inline-flex rounded-full bg-[#FFF9EE] px-4 py-2 text-sm font-black text-[#795C22] ring-1 ring-[#F3DEB5]">
              발견된 표현
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-[-0.07em]">수정해야 할 부분</h2>

            <div className="mt-5 space-y-4">
              {Object.keys(groupedFindings).length ? (
                Object.entries(groupedFindings).map(([category, items]) => (
                  <section key={category} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    <h3 className="text-xl font-black tracking-[-0.05em]">{category}</h3>

                    <div className="mt-3 space-y-3">
                      {items.map((finding, index) => (
                        <div key={`${finding.id}-${finding.term}-${index}`} className="rounded-2xl bg-white p-4 ring-1 ring-[#D6EDE7]">
                          <div className="flex flex-wrap gap-2">
                            <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${severityClass(finding.severity)}`}>
                              {severityLabel(finding.severity)}
                            </span>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                              {finding.term}
                            </span>
                          </div>

                          <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">
                            {finding.snippet}
                          </p>

                          <div className="mt-3 rounded-xl bg-[#EFFFFA] p-3 text-xs font-black leading-6 text-[#247A71] ring-1 ring-[#CDEFE7]">
                            권장: {finding.safeExpression}
                          </div>

                          <p className="mt-2 text-xs font-bold leading-6 text-[#637B76]">
                            {finding.suggestion}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                ))
              ) : (
                <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D6EDE7]">
                  아직 점검 결과가 없습니다. 문장을 붙여넣고 표현 점검을 눌러주세요.
                </div>
              )}
            </div>
          </article>

          <article className="rounded-[2rem] bg-white/95 p-6 shadow-sm ring-1 ring-[#D6EDE7]">
            <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7]">
              사용 기준
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-[-0.07em]">어디에 쓰느냐에 따라 다릅니다.</h2>

            <div className="mt-5 space-y-3">
              {[
                ['고객 화면', '가장 보수적으로 씁니다. 의료·응급·생체·AI 판단 표현을 피하고, 비의료 안부 참고와 보호자 확인 권장으로 표현합니다.'],
                ['지자체/B2G 제안', '문제 정의와 목표 수치는 가능하지만, 실증으로 검증 예정·기관 협의 후 확정이라는 조건을 붙입니다.'],
                ['IR/투자 제안', '시장성과 목표를 말할 수 있지만, 확정 매출이나 보장 표현은 가정 기반 시나리오로 구분합니다.'],
                ['내부 문서', '강한 표현을 남겨도 되지만, 외부 공개 전 반드시 고객용·제안용 문장으로 변환합니다.']
              ].map(([title, desc]) => (
                <div key={title} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                  <div className="text-lg font-black">{title}</div>
                  <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">{desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
              핵심 원칙: 안부웍스는 “진단하는 서비스”가 아니라 “보호자가 확인할 수 있게 돕는 비의료 안부 참고 서비스”로 표현합니다.
            </div>
          </article>
        </section>

        <section className="rounded-[2rem] bg-white/95 p-6 shadow-sm ring-1 ring-[#D6EDE7]">
          <div className="inline-flex rounded-full bg-[#FAFFFD] px-4 py-2 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
            점검 기록
          </div>

          <h2 className="mt-4 text-3xl font-black tracking-[-0.07em]">최근 점검</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {history.length ? (
              history.map((item) => (
                <button
                  key={item.at}
                  onClick={() => loadHistory(item)}
                  className="rounded-2xl bg-[#FAFFFD] p-4 text-left ring-1 ring-[#D6EDE7]"
                >
                  <div className="text-sm font-black text-[#247A71]">점수 {item.score}</div>
                  <p className="mt-2 line-clamp-3 text-sm font-bold leading-6 text-[#637B76]">
                    {item.input}
                  </p>
                </button>
              ))
            ) : (
              <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D6EDE7]">
                아직 점검 기록이 없습니다.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[2rem] bg-[#FFF9EE] p-5 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
          이 도구는 법률 검토를 대체하지 않습니다. 외부 제출용 문서, 투자계약, 지자체 제안서, 개인정보 처리방침은 최종 제출 전 별도 법무·정책 검토가 필요합니다.
        </section>
      </section>
    </main>
  )
}

export default AdminProposalCompliancePanel
