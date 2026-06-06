'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'

type LeadForm = {
  organizationName: string
  region: string
  departmentName: string
  contactName: string
  roleTitle: string
  phone: string
  email: string
  householdsCount: string
  interestArea: string
  message: string
  privacyAgreed: boolean
  website: string
}

const defaultForm: LeadForm = {
  organizationName: '',
  region: '',
  departmentName: '',
  contactName: '',
  roleTitle: '',
  phone: '',
  email: '',
  householdsCount: '',
  interestArea: 'pilot',
  message: '',
  privacyAgreed: false,
  website: ''
}

function phoneOnly(value: string) {
  return value.replace(/[^\d]/g, '')
}

function MetricPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7]">
      <div className="text-4xl font-black tracking-[-0.08em] text-[#2AA897]">{value}</div>
      <div className="mt-2 text-sm font-black leading-6 text-[#637B76]">{label}</div>
    </div>
  )
}

function SectionTitle({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) {
  return (
    <div>
      <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
        {eyebrow}
      </div>
      <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-0.07em] text-[#17443F] sm:text-5xl">
        {title}
      </h2>
      <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
        {desc}
      </p>
    </div>
  )
}

function FeatureLine({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <article className="rounded-[2rem] bg-[#FAFFFD] p-5 ring-1 ring-[#D6EDE7]">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#247A71] text-xs font-black text-white">
        {number}
      </div>
      <h3 className="mt-4 text-xl font-black tracking-[-0.05em] text-[#17443F]">{title}</h3>
      <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">{desc}</p>
    </article>
  )
}

export function GovProposalLanding({
  printMode = false
}: {
  printMode?: boolean
}) {
  const [form, setForm] = useState<LeadForm>(defaultForm)
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/gov-proposal-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createLead',
          ...form
        })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '문의 접수에 실패했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      setMessage(data.message || '문의가 접수되었습니다.')
      setForm(defaultForm)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '문의 접수 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] text-[#17443F]">
      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-5 sm:py-8">
        <header className="flex items-center justify-between gap-4 rounded-[2rem] bg-white px-5 py-4 shadow-sm ring-1 ring-[#D6EDE7]">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EFFFFA] text-lg">♡</div>
            <div>
              <div className="text-sm font-black">안부웍스</div>
              <div className="text-xs font-bold text-[#637B76]">AnbuWorks · B2G Smart Care</div>
            </div>
          </Link>

          <div className="flex flex-wrap gap-2">
            <Link href="#contact" className="rounded-full bg-[#247A71] px-4 py-2 text-sm font-black text-white">
              시연 문의
            </Link>
            {!printMode ? (
              <button onClick={() => window.print()} className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                PDF 저장
              </button>
            ) : null}
          </div>
        </header>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:p-10">
            <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
              B2G / 지자체 실증 제안
            </div>

            <h1 className="mt-6 text-5xl font-black leading-tight tracking-[-0.08em] sm:text-6xl">
              초고령사회 돌봄 공백을
              <br />
              운영 가능한 관제 인프라로 바꿉니다.
            </h1>

            <p className="mt-6 max-w-3xl text-base font-bold leading-8 text-[#637B76]">
              부모님 안부 신호를 가족, 운영실, 돌봄파트너, 지역상점, 약국, 수행기관, 지자체가 처리 가능한 행동으로 연결하는 스마트 돌봄 운영 플랫폼입니다.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <MetricPill value="500" label="표준 실증 가구 모델" />
              <MetricPill value="A/B" label="고위험·일반 관리 분류" />
              <MetricPill value="6M" label="성과 도출·조달 연계" />
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#contact" className="rounded-2xl bg-[#247A71] px-6 py-4 text-sm font-black text-white">
                시연·실증 문의하기
              </Link>
              <Link href="/gov/proposal/print" className="rounded-2xl bg-white px-6 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                제안서 인쇄 화면
              </Link>
            </div>
          </section>

          <section className="rounded-[2.5rem] bg-[#247A71] p-6 text-white shadow-[0_18px_52px_rgba(49,151,136,0.10)] sm:p-8">
            <div className="text-sm font-black text-white/70">핵심 제안</div>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-0.06em]">
              공무원·생활지원사의 수작업 확인을 줄이고, 위험 가구를 먼저 보이게 합니다.
            </h2>

            <div className="mt-6 space-y-3">
              {[
                ['01', '위험 가구 실시간 소팅', '무응답, 복약 미확인, 도움 요청, 몸 상태 이상 신호를 운영 우선순위로 정렬합니다.'],
                ['02', '사람 도움망 자동 연결', '가족, 요양보호사, 돌봄파트너, 지역상점, 약국으로 요청을 전파합니다.'],
                ['03', '복지 보고서 자동화', '사건 타임라인, 문자, 개인정보 감사, 동의 기록을 보고서·제출 패키지로 묶습니다.']
              ].map(([num, title, desc]) => (
                <article key={num} className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/20">
                  <div className="text-xs font-black text-white/60">{num}</div>
                  <div className="mt-2 text-lg font-black">{title}</div>
                  <div className="mt-1 text-sm font-bold leading-7 text-white/70">{desc}</div>
                </article>
              ))}
            </div>
          </section>
        </section>

        <section className="mt-5 rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-[#D6EDE7] sm:p-8">
          <SectionTitle
            eyebrow="왜 필요한가"
            title="현장 돌봄은 인력 부족과 행정 과부하를 동시에 겪고 있습니다."
            desc="안부웍스는 단순 앱이 아니라 운영실 관제, 지역 도움망, 문자 알림, 제출 자료 자동화를 묶어 지자체가 실제로 운영할 수 있는 구조를 제공합니다."
          />

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <FeatureLine number="1" title="부모님 신호" desc="식사·복약·몸 상태·도움 요청 신호를 부모님 또는 보호자가 쉽게 남깁니다." />
            <FeatureLine number="2" title="운영실 자동운영" desc="오토파일럿과 Heartbeat가 열린 사건, 긴급 사건, 문자 대기열을 주기적으로 점검합니다." />
            <FeatureLine number="3" title="지자체 제출" desc="대상자 현황, 사건 이력, 운영보고서, 개인정보 감사 로그를 제출 패키지로 만듭니다." />
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-2">
          <section className="rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-[#D6EDE7] sm:p-8">
            <SectionTitle
              eyebrow="실증 모델"
              title="500가구 표준 실증을 기준으로 설계했습니다."
              desc="A그룹 고위험 150가구, B그룹 일반관리 350가구를 기준으로 대상자 관리, 위험 신호 처리, 보고서 자동화를 검증합니다."
            />

            <div className="mt-6 grid gap-3">
              <FeatureLine number="A" title="고위험 취약 노인" desc="도움 요청, 몸 상태 확인, 장시간 미응답, 복약·식사 미확인 신호를 우선 관제합니다." />
              <FeatureLine number="B" title="일반 관리 노인" desc="정기 안부, 복약·식사 확인, 보호자 리포트, 반복 위험 패턴을 추적합니다." />
            </div>
          </section>

          <section className="rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-[#D6EDE7] sm:p-8">
            <SectionTitle
              eyebrow="운영 패키지"
              title="기능이 아니라 운영 결과를 제출합니다."
              desc="시연 후 바로 보고서와 CSV 제출 묶음을 생성할 수 있도록 운영실 화면을 구성했습니다."
            />

            <div className="mt-6 space-y-3">
              {[
                '실증 대상자 관리',
                '사건별 타임라인',
                '알림 발송 기록',
                '개인정보 동의·열람 감사',
                '주간·월간 운영보고서',
                '지자체 제출 패키지'
              ].map((item) => (
                <div key={item} className="rounded-2xl bg-[#FAFFFD] px-4 py-3 text-sm font-black ring-1 ring-[#D6EDE7]">
                  {item}
                </div>
              ))}
            </div>
          </section>
        </section>

        <section className="mt-5 rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-[#D6EDE7] sm:p-8">
          <SectionTitle
            eyebrow="시연 흐름"
            title="버튼 하나로 지자체 담당자에게 전체 흐름을 보여줄 수 있습니다."
            desc="시연 모드에서 A그룹 대상자, 사건, 도움망, 문자 대기열, 타임라인, 보고서, 제출 패키지까지 순차적으로 확인합니다."
          />

          <div className="mt-6 overflow-x-auto">
            <div className="flex min-w-max items-center gap-3">
              {[
                ['1', '대상자 생성'],
                ['2', '위험 신호 발생'],
                ['3', '도움망 요청'],
                ['4', '문자 대기열'],
                ['5', '사건 타임라인'],
                ['6', '보고서·제출']
              ].map(([num, label], index) => (
                <div key={num} className="flex items-center gap-3">
                  <div className="rounded-full bg-[#247A71] px-5 py-4 text-sm font-black text-white">
                    {num}. {label}
                  </div>
                  {index < 5 ? <div className="text-2xl font-black text-[#17443F]/30">→</div> : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2.5rem] bg-[#247A71] p-6 text-white shadow-sm sm:p-8">
            <div className="text-sm font-black text-white/70">문의 접수</div>
            <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.07em]">
              실증·시연·제안 미팅을 요청하세요.
            </h2>
            <p className="mt-4 text-sm font-bold leading-7 text-white/70">
              접수된 문의는 운영실 제안 문의 관리 화면에서 확인하고, 담당자가 연락드립니다.
            </p>

            <div className="mt-6 space-y-3 text-sm font-bold leading-7 text-white/80">
              <p>• 지자체 스마트 돌봄 실증</p>
              <p>• 복지기관·수행기관 협력</p>
              <p>• 운영실 관제 대시보드 시연</p>
              <p>• 제출 패키지·보고서 자동화 데모</p>
            </div>
          </section>

          <form onSubmit={submit} className="rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-[#D6EDE7] sm:p-8">
            <input
              value={form.website}
              onChange={(event) => setForm({ ...form, website: event.target.value })}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
            />

            <div className="grid gap-3 md:grid-cols-2">
              <Input label="기관명 *" value={form.organizationName} onChange={(v) => setForm({ ...form, organizationName: v })} />
              <Input label="지역" value={form.region} onChange={(v) => setForm({ ...form, region: v })} />
              <Input label="부서명" value={form.departmentName} onChange={(v) => setForm({ ...form, departmentName: v })} />
              <Input label="담당자명 *" value={form.contactName} onChange={(v) => setForm({ ...form, contactName: v })} />
              <Input label="직책" value={form.roleTitle} onChange={(v) => setForm({ ...form, roleTitle: v })} />
              <Input label="연락처" value={form.phone} onChange={(v) => setForm({ ...form, phone: phoneOnly(v) })} />
              <Input label="이메일" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
              <Input label="예상 대상 가구 수" value={form.householdsCount} onChange={(v) => setForm({ ...form, householdsCount: v.replace(/[^\d]/g, '') })} />
            </div>

            <label className="mt-3 grid gap-2">
              <span className="text-sm font-black text-[#637B76]">관심 분야</span>
              <select
                value={form.interestArea}
                onChange={(event) => setForm({ ...form, interestArea: event.target.value })}
                className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-bold outline-none"
              >
                <option value="pilot">지자체 실증</option>
                <option value="demo">서비스 시연</option>
                <option value="procurement">조달·공공 SaaS</option>
                <option value="reporting">보고서 자동화</option>
                <option value="partnership">수행기관 협력</option>
              </select>
            </label>

            <label className="mt-3 grid gap-2">
              <span className="text-sm font-black text-[#637B76]">문의 내용</span>
              <textarea
                value={form.message}
                onChange={(event) => setForm({ ...form, message: event.target.value })}
                className="min-h-28 rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-bold outline-none"
                placeholder="시연 희망 일정, 대상 규모, 지역 현황 등을 적어주세요."
              />
            </label>

            <label className="mt-4 flex items-start gap-3 rounded-2xl bg-[#FAFFFD] p-4 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D6EDE7]">
              <input
                type="checkbox"
                checked={form.privacyAgreed}
                onChange={(event) => setForm({ ...form, privacyAgreed: event.target.checked })}
                className="mt-1"
              />
              <span>
                문의 응대를 위해 기관명, 담당자명, 연락처, 이메일, 문의 내용을 수집·이용하는 것에 동의합니다.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
            >
              {loading ? '접수 중...' : '시연·제안 문의 접수'}
            </button>

            {message ? (
              <div className="mt-4 rounded-2xl bg-[#EFFFFA] p-4 text-sm font-black leading-7 text-[#2AA897] ring-1 ring-[#CDEFE7]">
                {message}
              </div>
            ) : null}

            {debug ? (
              <details className="mt-4 rounded-2xl bg-[#247A71] p-4 text-xs font-bold leading-6 text-[#E7FFF7]" open>
                <summary className="cursor-pointer text-sm font-black">상세 보기</summary>
                <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap">{debug}</pre>
              </details>
            ) : null}
          </form>
        </section>

        <footer className="mt-5 rounded-[2rem] bg-white p-5 text-center text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
          안부웍스 · AnbuWorks · parents-care.net · contact@parents-care.net
        </footer>
      </section>
    </main>
  )
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-[#637B76]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-[#D6F6EC]"
      />
    </label>
  )
}

export default GovProposalLanding
