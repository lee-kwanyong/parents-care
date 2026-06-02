'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type DocKey = 'proposal' | 'pilot' | 'kpi' | 'security' | 'email'

type Docs = Record<DocKey, string>

type ApiData = {
  input: {
    projectTitle: string
    targetTrack: string
    targetRegion: string
    targetHouseholds: number
    pilotMonths: number
    requestedBudgetKrw: number
    createdByName: string
  }
  docs: Docs & {
    summary: string
  }
  checklist: string[]
  safeWording: Array<{
    before: string
    after: string
  }>
}

const docLabels: Record<DocKey, string> = {
  proposal: 'R&D 제안서',
  pilot: '실증계획서',
  kpi: 'KPI 매트릭스',
  security: '보안·개인정보',
  email: '지자체 제안 메일'
}

function money(value: string) {
  return value.replace(/[^\d]/g, '')
}

function qs(params: Record<string, string>) {
  return new URLSearchParams(params).toString()
}

export function GovSubmissionPackagePanel() {
  const [projectTitle, setProjectTitle] = useState('안부지문 기반 고령자 생활리듬 변화감지 및 IoT 스마트 실버 케어 통합돌봄 플랫폼 개발·실증')
  const [targetTrack, setTargetTrack] = useState('스마트 사회서비스 시범사업형 + 지자체 지역사회 통합돌봄 실증형 R&D')
  const [targetRegion, setTargetRegion] = useState('전남·경북 등 고령화 지수 상위 기초지자체')
  const [targetHouseholds, setTargetHouseholds] = useState('100')
  const [pilotMonths, setPilotMonths] = useState('6')
  const [requestedBudgetKrw, setRequestedBudgetKrw] = useState('100000000')
  const [createdByName, setCreatedByName] = useState('안부웍스')

  const [data, setData] = useState<ApiData | null>(null)
  const [activeDoc, setActiveDoc] = useState<DocKey>('proposal')
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(true)

  const query = useMemo(() => {
    return qs({
      projectTitle,
      targetTrack,
      targetRegion,
      targetHouseholds,
      pilotMonths,
      requestedBudgetKrw,
      createdByName
    })
  }, [projectTitle, targetTrack, targetRegion, targetHouseholds, pilotMonths, requestedBudgetKrw, createdByName])

  async function load() {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/gov-submission?' + query, { cache: 'no-store' })
      const json = await response.json().catch(() => ({}))

      if (!response.ok || !json.ok) {
        setMessage(json.message || '제출 패키지를 불러오지 못했습니다.')
        setDebug(JSON.stringify(json.detail || json, null, 2))
        return
      }

      setData(json)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '제출 패키지를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function savePackage() {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/gov-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectTitle,
          targetTrack,
          targetRegion,
          targetHouseholds: Number(targetHouseholds) || 100,
          pilotMonths: Number(pilotMonths) || 6,
          requestedBudgetKrw: Number(requestedBudgetKrw) || 100000000,
          createdByName
        })
      })

      const json = await response.json().catch(() => ({}))

      if (!response.ok || !json.ok) {
        setMessage(json.message || '제출 패키지 저장에 실패했습니다.')
        setDebug(JSON.stringify(json.detail || json, null, 2))
        return
      }

      setMessage(json.message || '제출 패키지가 저장되었습니다.')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '제출 패키지 저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function copyDoc() {
    const content = data?.docs?.[activeDoc] || ''
    if (!content) return

    try {
      await navigator.clipboard.writeText(content)
      setMessage(`${docLabels[activeDoc]} 내용이 복사되었습니다.`)
    } catch {
      setMessage('복사에 실패했습니다. 아래 내용을 직접 선택해 복사해주세요.')
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeContent = data?.docs?.[activeDoc] || ''

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-5 text-[#173B36] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            지자체 지원사업 제출 패키지
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            제안서·실증계획·KPI를
            <br />
            한 번에 준비합니다.
          </h1>

          <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            안부웍스의 부모님 안부 입력, 안부지문 리포트, 가족 실행 보드, 지자체 운영실, 스마트 복약통·UWB 관제 방향을 지자체 지원사업 제출 문서로 변환합니다.
          </p>

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#FFF8E8] p-4 text-sm font-black leading-7 text-[#795313] ring-1 ring-[#F4D8A5]">
              {message}
            </div>
          ) : null}

          {debug ? (
            <details className="mt-4 rounded-2xl bg-[#123F38] p-4 text-xs font-bold leading-6 text-[#E7FFF7]">
              <summary className="cursor-pointer text-sm font-black">상세 오류 보기</summary>
              <pre className="mt-3 max-h-60 overflow-auto whitespace-pre-wrap">{debug}</pre>
            </details>
          ) : null}
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">제출 조건 설정</h2>

            <div className="mt-5 space-y-3">
              <Input label="과제명" value={projectTitle} onChange={setProjectTitle} />
              <Input label="지원 트랙" value={targetTrack} onChange={setTargetTrack} />
              <Input label="대상 지역" value={targetRegion} onChange={setTargetRegion} />
              <Input label="실증 가구 수" value={targetHouseholds} onChange={(v) => setTargetHouseholds(v.replace(/[^\d]/g, ''))} />
              <Input label="실증 기간 개월" value={pilotMonths} onChange={(v) => setPilotMonths(v.replace(/[^\d]/g, ''))} />
              <Input label="신청 예산 원" value={requestedBudgetKrw} onChange={(v) => setRequestedBudgetKrw(money(v))} />
              <Input label="작성자" value={createdByName} onChange={setCreatedByName} />

              <div className="grid gap-3 sm:grid-cols-3">
                <button
                  onClick={load}
                  disabled={loading}
                  className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
                >
                  {loading ? '생성 중' : '문서 다시 생성'}
                </button>

                <button
                  onClick={savePackage}
                  disabled={loading}
                  className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8] disabled:opacity-50"
                >
                  제출 패키지 저장
                </button>

                <Link
                  href={'/gov/submission/print?' + query}
                  className="rounded-2xl bg-[#20BFA7] px-5 py-4 text-center text-sm font-black text-white"
                >
                  PDF 저장용 인쇄본
                </Link>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">제출 준비 체크리스트</h2>

            <div className="mt-5 space-y-3">
              {(data?.checklist || []).map((item, index) => (
                <div key={item} className="flex gap-3 rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8FAF5] text-sm font-black text-[#11977F]">
                    {index + 1}
                  </div>
                  <div className="text-sm font-black leading-7 text-[#637B76]">
                    {item}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-[-0.06em]">생성 문서</h2>
              <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                문서를 선택해서 복사하거나 Markdown 파일로 다운로드하세요.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(Object.keys(docLabels) as DocKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveDoc(key)}
                  className={
                    'rounded-full px-4 py-2 text-sm font-black ring-1 ' +
                    (activeDoc === key
                      ? 'bg-[#193B38] text-white ring-[#193B38]'
                      : 'bg-white text-[#173B36] ring-[#D8EEE8]')
                  }
                >
                  {docLabels[key]}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {(Object.keys(docLabels) as DocKey[]).map((key) => (
              <a
                key={key}
                href={`/api/gov-submission?format=markdown&type=${key}&${query}`}
                className="rounded-2xl bg-[#F8FCFB] px-4 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
              >
                {docLabels[key]} 다운로드
              </a>
            ))}
          </div>

          <div className="mt-5 rounded-[2rem] bg-[#123F38] p-5 text-white">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-black text-[#A7F2E3]">{docLabels[activeDoc]}</div>
                <h3 className="mt-2 text-2xl font-black tracking-[-0.05em]">미리보기</h3>
              </div>

              <button
                onClick={copyDoc}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#173B36]"
              >
                내용 복사
              </button>
            </div>

            <pre className="mt-5 max-h-[34rem] overflow-auto whitespace-pre-wrap rounded-2xl bg-[#0B2D28] p-4 text-xs font-bold leading-6 text-[#E7FFF7]">
              {activeContent || '문서를 불러오는 중입니다.'}
            </pre>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <h2 className="text-3xl font-black tracking-[-0.06em]">공공 제안용 표현 보정</h2>
          <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
            지자체·정부과제 문서는 확정·보장형 표현보다 목표·검증·연계 가능성 중심으로 작성합니다.
          </p>

          <div className="mt-5 grid gap-3">
            {(data?.safeWording || []).map((item) => (
              <article key={item.before} className="grid gap-3 rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8] md:grid-cols-2">
                <div>
                  <div className="text-xs font-black text-[#8A2525]">수정 전</div>
                  <div className="mt-1 text-sm font-bold leading-6 text-[#637B76]">{item.before}</div>
                </div>

                <div>
                  <div className="text-xs font-black text-[#116D5F]">제출용 표현</div>
                  <div className="mt-1 text-sm font-black leading-6 text-[#173B36]">{item.after}</div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-4">
          <Link href="/gov/dashboard" className="rounded-2xl bg-[#193B38] px-5 py-4 text-center text-sm font-black text-white">
            지자체 운영실
          </Link>
          <Link href="/gov/iot" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
            IoT 관제 준비
          </Link>
          <Link href="/gov/proposal" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
            R&D 제안 패키지
          </Link>
          <Link href={'/gov/submission/print?' + query} className="rounded-2xl bg-[#20BFA7] px-5 py-4 text-center text-sm font-black text-white">
            PDF 저장용 인쇄본
          </Link>
          <Link href="/gov/export" className="rounded-2xl bg-[#F8FCFB] px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
            CSV 내보내기
          </Link>
        </div>
      </section>
    </main>
  )
}

function Input({
  label,
  value,
  onChange
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-[#55736E]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-[#D8EEE8] bg-white px-4 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-[#D6F6EC]"
      />
    </label>
  )
}

export default GovSubmissionPackagePanel
