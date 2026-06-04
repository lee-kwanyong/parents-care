'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type RequestRow = {
  id: string
  family_code?: string
  parent_name?: string
  signal_label?: string
  request_type?: string
  risk_level?: string
  status?: string
  service_area?: string
  requested_action?: string
  accepted_by_name?: string
  completed_note?: string
  created_at?: string
}

type ProviderRow = {
  id: string
  provider_type?: string
  provider_name?: string
  service_area?: string
  verified_status?: string
  available_status?: string
  response_time_min?: number
}

type Metrics = {
  total: number
  open: number
  urgent: number
  completed: number
  providers: number
}

function code6(value: string) {
  return value.replace(/[^\d]/g, '').slice(0, 6)
}

function readFamilyCode() {
  if (typeof window === 'undefined') return ''
  const keys = ['anbu_selected_family_code', 'anbu_guardian_family_code', 'anbu_family_code', 'pc_parent_invite_code']
  for (const key of keys) {
    const code = code6(window.localStorage.getItem(key) || '')
    if (/^\d{6}$/.test(code)) return code
  }
  return ''
}

function requestTypeLabel(type?: string) {
  if (type === 'meal_delivery') return '식사 연결'
  if (type === 'medication_reminder') return '복약 확인'
  if (type === 'urgent_neighbor_help') return '긴급 도움'
  if (type === 'care_partner_check') return '돌봄 확인'
  if (type === 'pharmacy_call') return '약국 상담'
  return '안부 확인'
}

function providerTypeLabel(type?: string) {
  if (type === 'care_partner') return '돌봄파트너'
  if (type === 'caregiver') return '요양보호사'
  if (type === 'local_store') return '지역상점'
  if (type === 'meal_provider') return '도시락/반찬'
  if (type === 'pharmacy') return '약국'
  if (type === 'welfare_org') return '수행기관'
  if (type === 'gov_center') return '지자체'
  if (type === 'family') return '가족'
  return type || '제공자'
}

function statusLabel(status?: string) {
  if (status === 'open') return '새 요청'
  if (status === 'dispatched') return '주변 도움망 전파'
  if (status === 'manual_needed') return '수동 연결 필요'
  if (status === 'accepted') return '확인 맡음'
  if (status === 'in_progress') return '확인 중'
  if (status === 'completed') return '완료'
  if (status === 'cancelled') return '취소'
  return status || '대기'
}

function riskClass(risk?: string) {
  if (risk === 'high') return 'bg-[#FFF1F1] text-[#8A2525] ring-[#F3BBBB]'
  return 'bg-[#FFF8E8] text-[#795313] ring-[#F4D8A5]'
}

function statusClass(status?: string) {
  if (status === 'completed') return 'bg-[#EFFFF9] text-[#116D5F] ring-[#CDEFE5]'
  if (status === 'manual_needed') return 'bg-[#FFF1F1] text-[#8A2525] ring-[#F3BBBB]'
  if (status === 'dispatched') return 'bg-[#EEF6FF] text-[#1B4E7A] ring-[#CFE5FA]'
  return 'bg-white text-[#173B36] ring-[#D8EEE8]'
}

function modeHelp(scope: 'family' | 'ops') {
  if (scope === 'ops') {
    return '운영실 모드는 전체 후속조치 요청을 보고, 지역 제공자 등록과 주변 도움망 전파를 관리합니다.'
  }

  return '보호자 모드는 가족코드로 내 부모님 후속조치만 조회합니다. 전체 요청이나 지역 제공자 연락처는 보이지 않습니다.'
}

function MetricCard({ title, value, desc, danger }: { title: string; value: string; desc: string; danger?: boolean }) {
  return (
    <article className={'rounded-[2rem] p-5 shadow-sm ring-1 ' + (danger ? 'bg-[#FFF1F1] text-[#8A2525] ring-[#F3BBBB]' : 'bg-white text-[#173B36] ring-[#D8EEE8]')}>
      <div className="text-sm font-black opacity-70">{title}</div>
      <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{value}</div>
      <p className="mt-2 text-sm font-bold leading-6 opacity-75">{desc}</p>
    </article>
  )
}

export function ResponseNetworkPanel() {
  const [scope, setScope] = useState<'family' | 'ops'>('family')
  const [familyCode, setFamilyCode] = useState('')
  const [requests, setRequests] = useState<RequestRow[]>([])
  const [providers, setProviders] = useState<ProviderRow[]>([])
  const [metrics, setMetrics] = useState<Metrics>({ total: 0, open: 0, urgent: 0, completed: 0, providers: 0 })
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showProvider, setShowProvider] = useState(false)

  const [requestForm, setRequestForm] = useState({
    familyCode: '',
    parentName: '부모님',
    parentPhone: '',
    guardianPhone: '',
    requestType: 'urgent_neighbor_help',
    signalLabel: '도움이 필요해요',
    riskLevel: 'high',
    serviceArea: '우리동네',
    addressHint: ''
  })

  const [providerForm, setProviderForm] = useState({
    providerType: 'care_partner',
    providerName: '',
    phone: '',
    serviceArea: '우리동네',
    verifiedStatus: 'verified',
    availableStatus: 'available',
    responseTimeMin: '30',
    qualification: '',
    notes: ''
  })

  const openRequests = useMemo(
    () => requests.filter((row) => row.status !== 'completed' && row.status !== 'cancelled'),
    [requests]
  )

  async function load(nextScope = scope, nextFamilyCode = familyCode) {
    const cleanFamilyCode = code6(nextFamilyCode)

    if (cleanFamilyCode) {
      setFamilyCode(cleanFamilyCode)
      window.localStorage.setItem('anbu_selected_family_code', cleanFamilyCode)
    }

    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const params = new URLSearchParams()
      if (nextScope === 'ops') params.set('scope', 'ops')
      if (cleanFamilyCode && nextScope !== 'ops') params.set('familyCode', cleanFamilyCode)

      const response = await fetch('/api/response-network?' + params.toString(), { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '지역 후속조치 네트워크를 불러오지 못했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        setRequests([])
        setProviders([])
        setMetrics({ total: 0, open: 0, urgent: 0, completed: 0, providers: 0 })
        return
      }

      if (data.needFamilyCode) {
        setMessage(data.message || '가족코드가 필요합니다.')
      }

      setRequests(Array.isArray(data.requests) ? data.requests : [])
      setProviders(Array.isArray(data.providers) ? data.providers : [])
      setMetrics(data.metrics || { total: 0, open: 0, urgent: 0, completed: 0, providers: 0 })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '지역 후속조치 네트워크를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function post(action: string, payload: Record<string, unknown>) {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/response-network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '처리에 실패했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return false
      }

      setMessage(data.message || '처리되었습니다.')
      await load()
      return true
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.')
      return false
    } finally {
      setLoading(false)
    }
  }

  async function patch(request: RequestRow, status: string, note?: string) {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/response-network', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: request.id,
          familyCode: familyCode || request.family_code || '',
          status,
          actorName: scope === 'ops' ? '운영실' : '가족',
          note
        })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '상태 변경에 실패했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      setMessage(data.message || '상태가 변경되었습니다.')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '상태 변경 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const isOps = params.get('scope') === 'ops'
    const storedCode = readFamilyCode()
    const initialScope = isOps ? 'ops' : 'family'
    setScope(initialScope)
    setFamilyCode(storedCode)
    setRequestForm((prev) => ({ ...prev, familyCode: storedCode }))
    load(initialScope, storedCode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isOps = scope === 'ops'

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-5 text-[#173B36] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            {isOps ? '운영실 후속조치 관제' : '보호자 후속조치 조회'}
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            지금 이 화면에서
            <br />
            무엇을 해야 하는지 보여줍니다.
          </h1>

          <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            후속조치 요청센터는 일반 소개 페이지가 아닙니다. 보호자는 내 부모님 요청만 확인하고, 운영실은 인증 후 전체 요청을 관제합니다.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <GuideCard number="1" title="가족코드 또는 운영실 선택" desc="보호자는 가족코드로 내 부모님 요청만 조회합니다." />
            <GuideCard number="2" title="요청 상태 확인" desc="긴급, 주의, 전파됨, 완료 상태를 색상과 문구로 구분합니다." />
            <GuideCard number="3" title="처리 결과 남기기" desc="확인 맡기, 주변 도움망 요청, 처리 완료를 기록합니다." />
          </div>

          <div className="mt-5 rounded-2xl bg-[#FFF8E8] p-4 text-sm font-black leading-7 text-[#795313] ring-1 ring-[#F4D8A5]">
            응급상황을 앱이 직접 판단하지 않습니다. 응급 가능성이 있으면 119 또는 의료기관에 연락해야 합니다.
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={() => {
                setScope('family')
                load('family', familyCode)
              }}
              className={'rounded-full px-4 py-2 text-sm font-black ring-1 ' + (!isOps ? 'bg-[#193B38] text-white ring-[#193B38]' : 'bg-white text-[#173B36] ring-[#D8EEE8]')}
            >
              보호자 모드
            </button>
            <button
              onClick={() => {
                setScope('ops')
                load('ops', '')
              }}
              className={'rounded-full px-4 py-2 text-sm font-black ring-1 ' + (isOps ? 'bg-[#193B38] text-white ring-[#193B38]' : 'bg-white text-[#173B36] ring-[#D8EEE8]')}
            >
              운영실 모드
            </button>
            <Link href="/response/about" className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
              지역 안심망 소개
            </Link>
          </div>

          <div className="mt-4 rounded-2xl bg-[#F8FCFB] p-4 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D8EEE8]">
            {modeHelp(scope)}
          </div>

          {!isOps ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_10rem]">
              <input
                value={familyCode}
                onChange={(event) => setFamilyCode(code6(event.target.value))}
                inputMode="numeric"
                maxLength={6}
                placeholder="가족코드 6자리"
                className="w-full rounded-2xl border border-[#D8EEE8] bg-white px-4 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-[#D6F6EC]"
              />
              <button
                onClick={() => load('family', familyCode)}
                disabled={loading}
                className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
              >
                조회
              </button>
            </div>
          ) : null}

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#EFFFF9] p-4 text-sm font-black leading-7 text-[#116D5F] ring-1 ring-[#CDEFE5]">
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

        <section className="grid gap-4 md:grid-cols-5">
          <MetricCard title="열린 요청" value={`${metrics.open}개`} desc="아직 처리 중인 지역 후속조치" danger={metrics.open > 0} />
          <MetricCard title="긴급" value={`${metrics.urgent}개`} desc="도움 요청·몸 상태·복약 위험" danger={metrics.urgent > 0} />
          <MetricCard title="완료" value={`${metrics.completed}개`} desc="처리 완료된 요청" />
          <MetricCard title="지역 제공자" value={`${metrics.providers}명`} desc="돌봄파트너·상점·약국·기관" />
          <MetricCard title="전체 요청" value={`${metrics.total}개`} desc="누적 후속조치 요청" />
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-[-0.06em]">현재 처리할 요청</h2>
              <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                긴급 요청은 먼저 확인하고, 처리한 사람과 결과를 남겨주세요.
              </p>
            </div>

            <button
              onClick={() => setShowCreate((value) => !value)}
              className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white"
            >
              {showCreate ? '요청 만들기 닫기' : '직접 요청 만들기'}
            </button>
          </div>

          {showCreate ? (
            <div className="mt-5 rounded-[2rem] bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8] sm:p-5">
              <h3 className="text-xl font-black tracking-[-0.05em]">후속조치 요청 만들기</h3>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <select
                  value={requestForm.requestType}
                  onChange={(event) => {
                    const type = event.target.value
                    setRequestForm({
                      ...requestForm,
                      requestType: type,
                      signalLabel:
                        type === 'meal_delivery'
                          ? '밥을 못 먹었어요'
                          : type === 'medication_reminder'
                            ? '약을 못 먹었어요'
                            : type === 'pharmacy_call'
                              ? '약 관련 확인이 필요해요'
                              : type === 'care_partner_check'
                                ? '몸이 아파요'
                                : '도움이 필요해요',
                      riskLevel: type === 'meal_delivery' ? 'medium' : 'high'
                    })
                  }}
                  className="w-full rounded-2xl border border-[#D8EEE8] bg-white px-4 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-[#D6F6EC]"
                >
                  <option value="urgent_neighbor_help">도움이 필요해요 → 가까운 돌봄망 확인</option>
                  <option value="meal_delivery">밥을 못 먹었어요 → 식사/지역상점 연결</option>
                  <option value="medication_reminder">약을 못 먹었어요 → 복약 확인</option>
                  <option value="care_partner_check">몸이 아파요 → 돌봄파트너 확인</option>
                  <option value="pharmacy_call">약국 상담 필요 → 약국 연결</option>
                </select>

                <Input label="가족코드" value={requestForm.familyCode} onChange={(v) => setRequestForm({ ...requestForm, familyCode: code6(v) })} />
                <Input label="부모님 이름" value={requestForm.parentName} onChange={(v) => setRequestForm({ ...requestForm, parentName: v })} />
                <Input label="부모님 연락처" value={requestForm.parentPhone} onChange={(v) => setRequestForm({ ...requestForm, parentPhone: v })} />
                <Input label="보호자 연락처" value={requestForm.guardianPhone} onChange={(v) => setRequestForm({ ...requestForm, guardianPhone: v })} />
                <Input label="권역/동네" value={requestForm.serviceArea} onChange={(v) => setRequestForm({ ...requestForm, serviceArea: v })} />
                <Input label="주소 힌트" value={requestForm.addressHint} onChange={(v) => setRequestForm({ ...requestForm, addressHint: v })} />

                <button
                  onClick={() => post('createRequest', requestForm)}
                  disabled={loading}
                  className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white disabled:opacity-50 md:col-span-2"
                >
                  후속조치 요청 생성
                </button>
              </div>
            </div>
          ) : null}

          <div className="mt-5 space-y-3">
            {openRequests.length === 0 ? (
              <div className="rounded-2xl bg-[#EFFFF9] p-5 text-sm font-black text-[#116D5F] ring-1 ring-[#CDEFE5]">
                현재 열린 지역 후속조치 요청이 없습니다.
              </div>
            ) : (
              openRequests.map((request) => (
                <article key={request.id} className={'rounded-[2rem] p-5 ring-1 ' + riskClass(request.risk_level)}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current">
                          {request.risk_level === 'high' ? '긴급' : '주의'}
                        </span>
                        <span className={'rounded-full px-3 py-1 text-xs font-black ring-1 ' + statusClass(request.status)}>
                          {statusLabel(request.status)}
                        </span>
                        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current">
                          {requestTypeLabel(request.request_type)}
                        </span>
                      </div>

                      <h3 className="mt-4 text-2xl font-black tracking-[-0.05em]">
                        {request.signal_label || requestTypeLabel(request.request_type)}
                      </h3>

                      <p className="mt-3 text-sm font-bold leading-7">
                        {request.parent_name || '부모님'} · {request.service_area || '권역 미지정'} · 가족코드 {request.family_code || '-'}
                      </p>

                      <div className="mt-4 rounded-2xl bg-white/70 p-4 text-sm font-black leading-7 ring-1 ring-current">
                        {request.requested_action || '가족이 먼저 확인하고 필요한 지역 후속조치를 연결하세요.'}
                      </div>
                    </div>

                    <div className="grid min-w-52 gap-2">
                      {isOps ? (
                        <button
                          onClick={() => post('dispatch', { requestId: request.id })}
                          disabled={loading}
                          className="rounded-xl bg-[#193B38] px-4 py-3 text-sm font-black text-white disabled:opacity-50"
                        >
                          주변 도움망에 요청
                        </button>
                      ) : null}

                      <button
                        onClick={() => patch(request, 'accepted', isOps ? '운영실이 확인을 맡았습니다.' : '가족이 확인을 맡았습니다.')}
                        disabled={loading}
                        className="rounded-xl bg-white/80 px-4 py-3 text-sm font-black ring-1 ring-current disabled:opacity-50"
                      >
                        확인 맡기
                      </button>

                      <button
                        onClick={() => patch(request, 'completed', '후속조치 확인 완료')}
                        disabled={loading}
                        className="rounded-xl bg-[#123F38] px-4 py-3 text-sm font-black text-white disabled:opacity-50"
                      >
                        처리 완료
                      </button>

                      <button
                        onClick={() => patch(request, 'cancelled', '요청 취소')}
                        disabled={loading}
                        className="rounded-xl bg-white/60 px-4 py-3 text-sm font-black ring-1 ring-current disabled:opacity-50"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        {isOps ? (
          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-3xl font-black tracking-[-0.06em]">지역 도움망 관리</h2>
                <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                  운영실에서 검증된 돌봄파트너, 상점, 약국, 수행기관을 등록합니다.
                </p>
              </div>

              <button
                onClick={() => setShowProvider((value) => !value)}
                className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white"
              >
                {showProvider ? '등록 닫기' : '제공자 등록'}
              </button>
            </div>

            {showProvider ? (
              <div className="mt-5 rounded-[2rem] bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8] sm:p-5">
                <div className="grid gap-3 md:grid-cols-2">
                  <select
                    value={providerForm.providerType}
                    onChange={(event) => setProviderForm({ ...providerForm, providerType: event.target.value })}
                    className="w-full rounded-2xl border border-[#D8EEE8] bg-white px-4 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-[#D6F6EC]"
                  >
                    <option value="care_partner">돌봄파트너</option>
                    <option value="caregiver">요양보호사</option>
                    <option value="local_store">지역상점</option>
                    <option value="meal_provider">도시락/반찬가게</option>
                    <option value="pharmacy">약국</option>
                    <option value="welfare_org">수행기관</option>
                    <option value="gov_center">지자체</option>
                    <option value="family">가족</option>
                  </select>

                  <Input label="이름/상호" value={providerForm.providerName} onChange={(v) => setProviderForm({ ...providerForm, providerName: v })} />
                  <Input label="연락처" value={providerForm.phone} onChange={(v) => setProviderForm({ ...providerForm, phone: v })} />
                  <Input label="권역/동네" value={providerForm.serviceArea} onChange={(v) => setProviderForm({ ...providerForm, serviceArea: v })} />
                  <Input label="자격/역할" value={providerForm.qualification} onChange={(v) => setProviderForm({ ...providerForm, qualification: v })} />
                  <Input label="응답 예상 시간 분" value={providerForm.responseTimeMin} onChange={(v) => setProviderForm({ ...providerForm, responseTimeMin: v.replace(/[^\d]/g, '') })} />
                  <Input label="메모" value={providerForm.notes} onChange={(v) => setProviderForm({ ...providerForm, notes: v })} />

                  <button
                    onClick={() => post('createProvider', providerForm)}
                    disabled={loading || !providerForm.providerName.trim()}
                    className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white disabled:opacity-50 md:col-span-2"
                  >
                    지역 제공자 등록
                  </button>
                </div>
              </div>
            ) : null}

            <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {providers.length === 0 ? (
                <div className="rounded-2xl bg-[#F8FCFB] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D8EEE8]">
                  아직 등록된 지역 제공자가 없습니다.
                </div>
              ) : (
                providers.map((provider) => (
                  <article key={provider.id} className="rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]">
                    <div className="text-xs font-black text-[#11977F]">{providerTypeLabel(provider.provider_type)}</div>
                    <h3 className="mt-2 text-xl font-black tracking-[-0.05em]">{provider.provider_name}</h3>
                    <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                      {provider.service_area || '권역 미지정'} · {provider.response_time_min || 30}분 내 응답 목표
                    </p>
                    <p className="mt-1 text-xs font-black text-[#7A9692]">
                      {provider.verified_status || 'pending'} · {provider.available_status || 'available'}
                    </p>
                  </article>
                ))
              )}
            </div>
          </section>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-4">
          <Link href="/response/about" className="rounded-2xl bg-[#193B38] px-5 py-4 text-center text-sm font-black text-white">
            지역 안심망 소개
          </Link>
          <Link href="/family/actions" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
            가족 실행 보드
          </Link>
          <Link href="/gov/cases" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
            지자체 사례관리
          </Link>
          <button
            onClick={() => load(scope, familyCode)}
            className="rounded-2xl bg-[#F8FCFB] px-5 py-4 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
          >
            새로고침
          </button>
        </div>
      </section>
    </main>
  )
}

function GuideCard({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <article className="rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#193B38] text-xs font-black text-white">
        {number}
      </div>
      <h3 className="mt-3 text-base font-black tracking-[-0.04em]">{title}</h3>
      <p className="mt-1 text-xs font-bold leading-6 text-[#637B76]">{desc}</p>
    </article>
  )
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
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

export default ResponseNetworkPanel
