'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type RecordRow = {
  id: string
  record_type?: string
  status?: string
  title?: string
  content?: string
  evidence_count?: number
  checked_by_name?: string
  created_at?: string
}

const privacyChecks = [
  '주민등록번호 수집 금지',
  '가족코드·휴대폰 뒤 4자리 기반 최소 식별',
  '식사·복약·몸 상태·도움 요청 공유 동의 항목 분리',
  '가족 공유 동의와 수행기관 공유 동의 분리',
  '통계 활용 동의 문구 별도 관리',
  'PDF·CSV 다운로드 감사로그 기록',
  '카메라·음성 수집 배제 원칙 명시'
]

const accessibilityChecks = [
  '부모님 화면 큰 글씨 적용',
  '부모님 화면 큰 버튼 적용',
  '한 화면 한 질문 중심 구조',
  '색상만으로 상태를 구분하지 않고 문구 병행',
  '모바일 브라우저 터치 영역 확보',
  '운영실 비밀번호 화면 노출 제거',
  '부모님 3명 이상 실제 입력 테스트 예정 또는 완료 기록'
]

function statusClass(done: boolean) {
  return done
    ? 'bg-[#EFFFF9] text-[#116D5F] ring-[#CDEFE5]'
    : 'bg-[#FFF8E8] text-[#795313] ring-[#F4D8A5]'
}

export function GovCompliancePanel() {
  const [records, setRecords] = useState<RecordRow[]>([])
  const [checkedByName, setCheckedByName] = useState('이관용')
  const [notes, setNotes] = useState('')
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(true)

  const latest = useMemo(() => {
    const map: Record<string, RecordRow> = {}

    for (const record of records) {
      const type = record.record_type || ''
      if (!type) continue
      if (!map[type]) map[type] = record
    }

    return map
  }, [records])

  const privacyDone = latest['privacy-minimization']?.status === 'done'
  const accessibilityDone = latest['senior-accessibility']?.status === 'done'

  async function load() {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/gov-compliance', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '컴플라이언스 기록을 불러오지 못했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      setRecords(Array.isArray(data.records) ? data.records : [])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '컴플라이언스 기록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function saveRecord(type: 'privacy-minimization' | 'senior-accessibility') {
    const isPrivacy = type === 'privacy-minimization'

    const title = isPrivacy
      ? '개인정보 최소수집 원칙 검토 완료'
      : '고령친화 UI·접근성 점검 완료'

    const checks = isPrivacy ? privacyChecks : accessibilityChecks

    const content = [
      title,
      '',
      ...checks.map((item) => `- ${item}`),
      '',
      notes ? `추가 메모: ${notes}` : ''
    ].join('\n')

    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/gov-compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordType: type,
          status: 'done',
          title,
          content,
          evidenceCount: checks.length,
          checkedByName,
          targetRoute: '/gov/readiness',
          notes
        })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '기록 저장에 실패했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      setMessage(data.message || '기록이 저장되었습니다.')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '기록 저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-5 text-[#173B36] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            공공 제출 컴플라이언스
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            남은 점검 항목을
            <br />
            제출 증빙으로 남깁니다.
          </h1>

          <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            지자체 제출 전 필요한 개인정보 최소수집 원칙과 고령친화 UI·접근성 점검 기록을 저장합니다. 저장 후 /gov/readiness에서 준비상태가 갱신됩니다.
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

        <section className="grid gap-4 md:grid-cols-2">
          <StatusCard
            title="개인정보 최소수집 원칙"
            done={privacyDone}
            desc={privacyDone ? '검토 완료 기록이 저장되었습니다.' : '동의·최소수집 검토 기록이 필요합니다.'}
          />
          <StatusCard
            title="고령친화 UI·접근성"
            done={accessibilityDone}
            desc={accessibilityDone ? '접근성 점검 완료 기록이 저장되었습니다.' : '고령자 사용성 점검 기록이 필요합니다.'}
          />
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">점검자 정보</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-black text-[#55736E]">점검자</span>
              <input
                value={checkedByName}
                onChange={(event) => setCheckedByName(event.target.value)}
                className="w-full rounded-2xl border border-[#D8EEE8] bg-white px-4 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-[#D6F6EC]"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-[#55736E]">추가 메모</span>
              <input
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="예: 제출 전 최종 검토 완료"
                className="w-full rounded-2xl border border-[#D8EEE8] bg-white px-4 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-[#D6F6EC]"
              />
            </label>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <CheckPanel
            title="개인정보 최소수집 원칙"
            checks={privacyChecks}
            done={privacyDone}
            buttonLabel="개인정보 최소수집 검토 완료 기록"
            onClick={() => saveRecord('privacy-minimization')}
            loading={loading}
          />

          <CheckPanel
            title="고령친화 UI·접근성"
            checks={accessibilityChecks}
            done={accessibilityDone}
            buttonLabel="고령친화 UI 점검 완료 기록"
            onClick={() => saveRecord('senior-accessibility')}
            loading={loading}
          />
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">최근 기록</h2>

          <div className="mt-5 space-y-3">
            {records.length === 0 ? (
              <div className="rounded-2xl bg-[#F8FCFB] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D8EEE8]">
                아직 저장된 컴플라이언스 기록이 없습니다.
              </div>
            ) : (
              records.slice(0, 10).map((record) => (
                <article key={record.id} className="rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]">
                  <div className="text-lg font-black">{record.title || '기록'}</div>
                  <p className="mt-1 text-sm font-bold leading-6 text-[#637B76]">
                    {record.checked_by_name || '운영실'} · {record.created_at || '-'}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            href="/gov/readiness"
            className="rounded-2xl bg-[#193B38] px-5 py-4 text-center text-sm font-black text-white"
          >
            준비상태 다시 확인
          </Link>

          <Link
            href="/gov/submission/print"
            className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
          >
            제출 PDF 인쇄본
          </Link>

          <button
            onClick={load}
            className="rounded-2xl bg-[#F8FCFB] px-5 py-4 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
          >
            새로고침
          </button>
        </div>
      </section>
    </main>
  )
}

function StatusCard({ title, done, desc }: { title: string; done: boolean; desc: string }) {
  return (
    <article className={'rounded-[2rem] p-5 shadow-sm ring-1 ' + statusClass(done)}>
      <div className="text-sm font-black opacity-70">{done ? '준비됨' : '점검 필요'}</div>
      <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">{title}</h2>
      <p className="mt-2 text-sm font-bold leading-7 opacity-80">{desc}</p>
    </article>
  )
}

function CheckPanel({
  title,
  checks,
  done,
  buttonLabel,
  onClick,
  loading
}: {
  title: string
  checks: string[]
  done: boolean
  buttonLabel: string
  onClick: () => void
  loading: boolean
}) {
  return (
    <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
      <h2 className="text-2xl font-black tracking-[-0.05em]">{title}</h2>

      <div className="mt-5 space-y-2">
        {checks.map((check) => (
          <div key={check} className="rounded-2xl bg-[#F8FCFB] p-3 text-sm font-bold leading-6 text-[#637B76] ring-1 ring-[#D8EEE8]">
            {check}
          </div>
        ))}
      </div>

      <button
        onClick={onClick}
        disabled={loading || done}
        className="mt-5 w-full rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
      >
        {done ? '완료 기록 저장됨' : buttonLabel}
      </button>
    </section>
  )
}

export default GovCompliancePanel
