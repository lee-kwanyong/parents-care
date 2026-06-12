'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type SafeClaim = {
  title: string
  say: string
  proof: string
}

type PilotClaim = {
  title: string
  say: string
  condition: string
}

type VisionClaim = {
  title: string
  say: string
  replace: string
}

type RiskyClaim = {
  risky: string
  why: string
  safer: string
}

type Snapshot = {
  id: string
  title: string
  status: string
  createdBy: string
  createdAt: string
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

export function ProposalRealityCheckPanel() {
  const [safeClaims, setSafeClaims] = useState<SafeClaim[]>([])
  const [pilotClaims, setPilotClaims] = useState<PilotClaim[]>([])
  const [visionClaims, setVisionClaims] = useState<VisionClaim[]>([])
  const [riskyClaims, setRiskyClaims] = useState<RiskyClaim[]>([])
  const [checklist, setChecklist] = useState<string[]>([])
  const [copyBlocks, setCopyBlocks] = useState<Record<string, string>>({})
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [activeTab, setActiveTab] = useState<'safe' | 'pilot' | 'vision' | 'risky' | 'copy' | 'checklist' | 'snapshots'>('safe')
  const [createdBy, setCreatedBy] = useState('운영실')
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)

    try {
      const response = await fetch('/api/proposal-reality-check', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '표현 점검 자료를 불러오지 못했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      setSafeClaims(Array.isArray(data.safeClaims) ? data.safeClaims : [])
      setPilotClaims(Array.isArray(data.pilotClaims) ? data.pilotClaims : [])
      setVisionClaims(Array.isArray(data.visionClaims) ? data.visionClaims : [])
      setRiskyClaims(Array.isArray(data.riskyClaims) ? data.riskyClaims : [])
      setChecklist(Array.isArray(data.checklist) ? data.checklist : [])
      setCopyBlocks(data.copyBlocks || {})
      setSnapshots(Array.isArray(data.snapshots) ? data.snapshots : [])
      setMessage('')
      setDebug('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '표현 점검 자료를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function saveSnapshot() {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/proposal-reality-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveSnapshot', createdBy })
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

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setMessage('문구를 복사했습니다.')
    } catch {
      setMessage('복사에 실패했습니다. 문구를 직접 선택해서 복사해주세요.')
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
            제안서 표현 현실화 센터
          </div>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
                현재 기능과 장기 비전을
                <br />
                분리해서 말합니다.
              </h1>

              <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
                외부 미팅, 지자체 제안, 바이오헬스 상담, 투자자료에서 과장으로 보일 수 있는 표현을 안전한 표현으로 바꿉니다.
              </p>
            </div>

            <div className="rounded-[2rem] bg-[#FFF9EE] px-6 py-5 text-center text-[#795C22] ring-1 ring-[#F3DEB5]">
              <div className="text-sm font-black opacity-70">위험 표현</div>
              <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{riskyClaims.length}개</div>
              <div className="mt-2 text-xs font-bold">수정 필요</div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            현재는 앱 기반 안부·리포트·문자·미응답·대리입력 실증 단계입니다. 500가구, UWB, 스마트 약통, 119 연계, 오탐률 같은 표현은 장기 비전이나 검증 예정으로만 말하세요.
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
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
              점검 저장
            </button>

            <Link href="/admin/ops/pilot-report" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              실증 리포트
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/response/about" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              서비스 소개
            </Link>

            <Link href="/gov/one-page-proposal" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              지자체 제안서
            </Link>

            <Link href="/admin/ops" className="rounded-2xl bg-[#FAFFFD] px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
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

        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard title="현재 말해도 됨" value={`${safeClaims.length}개`} desc="이미 구현·검증 중" tone="safe" />
          <MetricCard title="실증 후 표현" value={`${pilotClaims.length}개`} desc="조건부 표현" tone="warning" />
          <MetricCard title="장기 비전" value={`${visionClaims.length}개`} desc="로드맵 표현" />
          <MetricCard title="위험 표현" value={`${riskyClaims.length}개`} desc="수정 필요" tone="danger" />
        </section>

        <section className="rounded-[2rem] bg-white/95 p-3 shadow-sm ring-1 ring-[#D6EDE7]">
          <div className="grid gap-2 sm:grid-cols-7">
            {[
              ['safe', '현재 가능'],
              ['pilot', '실증 후'],
              ['vision', '장기 비전'],
              ['risky', '위험 표현'],
              ['copy', '복사 문구'],
              ['checklist', '체크리스트'],
              ['snapshots', '저장 기록']
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

        {activeTab === 'safe' ? (
          <ClaimList
            title="지금 말해도 되는 표현"
            tone="safe"
            items={safeClaims.map((item) => ({
              title: item.title,
              body: item.say,
              sub: `근거 화면: ${item.proof}`
            }))}
          />
        ) : null}

        {activeTab === 'pilot' ? (
          <ClaimList
            title="실증 후 또는 조건부로 말할 표현"
            tone="warning"
            items={pilotClaims.map((item) => ({
              title: item.title,
              body: item.say,
              sub: `조건: ${item.condition}`
            }))}
          />
        ) : null}

        {activeTab === 'vision' ? (
          <ClaimList
            title="장기 비전으로만 말할 표현"
            tone="normal"
            items={visionClaims.map((item) => ({
              title: item.title,
              body: item.say,
              sub: `수정 기준: ${item.replace}`
            }))}
          />
        ) : null}

        {activeTab === 'risky' ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">위험 표현과 대체 문구</h2>

            <div className="mt-5 space-y-3">
              {riskyClaims.map((item) => (
                <article key={item.risky} className="rounded-2xl bg-[#FFF4F4] p-4 text-[#8A3030] ring-1 ring-[#F3C8C8]">
                  <div className="flex flex-wrap gap-2">
                    <Pill tone="danger">수정 필요</Pill>
                  </div>
                  <h3 className="mt-3 text-xl font-black tracking-[-0.05em]">{item.risky}</h3>
                  <p className="mt-2 text-sm font-bold leading-7 opacity-80">
                    위험 사유: {item.why}
                  </p>
                  <div className="mt-3 rounded-2xl bg-white/80 p-4 text-sm font-black leading-7 text-[#17443F]">
                    대체 문구: {item.safer}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === 'copy' ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">상황별 복사 문구</h2>

            <div className="mt-5 grid gap-4">
              {Object.entries(copyBlocks).map(([key, value]) => (
                <article key={key} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-xl font-black tracking-[-0.05em]">
                      {key === 'biohealthMeeting'
                        ? '바이오헬스/유타대 미팅'
                        : key === 'municipality'
                          ? '지자체 제안'
                          : key === 'careCenter'
                            ? '방문요양센터'
                            : '투자/IR'}
                    </h3>
                    <button onClick={() => copyText(value)} className="rounded-xl bg-[#247A71] px-4 py-3 text-xs font-black text-white">
                      복사
                    </button>
                  </div>

                  <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-white p-4 text-sm font-bold leading-7 text-[#17443F] ring-1 ring-[#D6EDE7]">
                    {value}
                  </pre>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === 'checklist' ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">외부 제출 전 체크리스트</h2>

            <div className="mt-5 space-y-3">
              {checklist.map((item, index) => (
                <div key={item} className="flex gap-3 rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#EFFFFA] text-sm font-black text-[#247A71]">
                    {index + 1}
                  </div>
                  <div className="text-sm font-black leading-7">{item}</div>
                </div>
              ))}
            </div>
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
                    </div>
                    <h3 className="mt-3 text-lg font-black">{snapshot.title}</h3>
                    <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                      {snapshot.createdBy || '-'} · {snapshot.createdKst || snapshot.createdAt || '-'}
                    </p>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                  아직 저장한 점검 기록이 없습니다.
                </div>
              )}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  )
}

function ClaimList({
  title,
  items,
  tone
}: {
  title: string
  items: Array<{ title: string; body: string; sub: string }>
  tone: string
}) {
  return (
    <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
      <h2 className="text-3xl font-black tracking-[-0.06em]">{title}</h2>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <article key={item.title} className={'rounded-2xl p-4 ring-1 ' + toneClass(tone)}>
            <div className="flex flex-wrap gap-2">
              <Pill tone={tone}>{tone === 'safe' ? '현재 가능' : tone === 'warning' ? '조건부' : '비전'}</Pill>
            </div>
            <h3 className="mt-3 text-xl font-black tracking-[-0.05em]">{item.title}</h3>
            <p className="mt-2 text-sm font-bold leading-7 opacity-80">{item.body}</p>
            <p className="mt-3 rounded-2xl bg-white/80 p-3 text-sm font-black leading-7 text-[#637B76]">
              {item.sub}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default ProposalRealityCheckPanel
