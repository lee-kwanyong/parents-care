'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  buildAssistedIntakeSummary,
  labelAssistedChannel,
  labelAssistedStatus,
  labelPackCode,
  type AssistedIntakeAsset,
  type AssistedIntakeParseResult,
  type AssistedIntakeRequest,
  type AssistedIntakeStatus
} from '@/lib/assisted-intake-engine'

export function AssistedIntakeBoard({ mode = 'family' }: { mode?: 'family' | 'ops' }) {
  const [requests, setRequests] = useState<AssistedIntakeRequest[]>([])
  const [assets, setAssets] = useState<AssistedIntakeAsset[]>([])
  const [parses, setParses] = useState<AssistedIntakeParseResult[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/assisted-intake', { cache: 'no-store' })
      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '간편 접수를 불러오지 못했습니다.')
      }

      setRequests(data.requests || [])
      setAssets(data.assets || [])
      setParses(data.parses || [])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '간편 접수를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id: string, status: AssistedIntakeStatus) {
    setMessage('')

    try {
      const response = await fetch('/api/assisted-intake', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '상태 변경 실패')
      }

      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '상태 변경 실패')
    }
  }

  async function convertToCareRequest(id: string) {
    setMessage('')

    try {
      const response = await fetch('/api/assisted-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'convert_to_care_request', id })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '케어 요청 변환 실패')
      }

      setMessage('케어 요청으로 변환했습니다. 운영실 걱정센터에서 이어서 처리할 수 있습니다.')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '케어 요청 변환 실패')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const summary = useMemo(() => buildAssistedIntakeSummary(requests), [requests])

  const assetsByRequest = useMemo(() => {
    const map = new Map<string, AssistedIntakeAsset[]>()

    for (const asset of assets) {
      const current = map.get(asset.assisted_intake_request_id) || []
      current.push(asset)
      map.set(asset.assisted_intake_request_id, current)
    }

    return map
  }, [assets])

  const parsesByRequest = useMemo(() => {
    const map = new Map<string, AssistedIntakeParseResult[]>()

    for (const parse of parses) {
      const current = map.get(parse.assisted_intake_request_id) || []
      current.push(parse)
      map.set(parse.assisted_intake_request_id, current)
    }

    return map
  }, [parses])

  return (
    <div>
      <div
        className={
          'rounded-3xl p-6 ' +
          (summary.reassuranceState === '긴급'
            ? 'bg-red-50'
            : summary.reassuranceState === '확인 필요'
              ? 'bg-amber-50'
              : 'bg-emerald-50')
        }
      >
        <p className="text-sm font-black text-slate-600">사진·카톡 접수 안심판</p>
        <div className="mt-2 text-5xl font-black">{summary.reassuranceState}</div>

        <div className="mt-5 grid gap-3 md:grid-cols-5">
          <Stat label="전체" value={summary.total} />
          <Stat label="열린 접수" value={summary.open} />
          <Stat label="긴급" value={summary.urgent} />
          <Stat label="추가정보" value={summary.needsMoreInfo} />
          <Stat label="변환 완료" value={summary.converted} />
        </div>
      </div>

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black">가족이 볼 안내</h2>
        <div className="mt-4 space-y-3">
          {summary.familyNextActions.map((action, index) => (
            <div key={action} className="rounded-2xl bg-slate-50 p-4 text-lg font-black">
              {index + 1}. {action}
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={load} className="rounded-2xl bg-slate-900 px-5 py-4 font-black text-white">
          새로고침
        </button>
      </div>

      {message ? (
        <p className="mt-5 rounded-2xl bg-blue-50 p-4 font-bold text-blue-900">
          {message}
        </p>
      ) : null}

      <section className="mt-8 space-y-5">
        {loading ? (
          <div className="rounded-3xl bg-white p-8 text-center font-black shadow-sm">
            불러오는 중...
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <div className="text-xl font-black">아직 사진·카톡 간편 접수가 없습니다.</div>
            <p className="mt-2 text-slate-500">/care-intake 에서 먼저 접수해보세요.</p>
          </div>
        ) : (
          requests.map((request) => {
            const requestAssets = assetsByRequest.get(request.id) || []
            const requestParses = parsesByRequest.get(request.id) || []
            const latestParse = requestParses[0]

            return (
              <article key={request.id} className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge text={labelAssistedChannel(request.intake_channel)} />
                      <Badge text={labelAssistedStatus(request.status)} />
                      <Badge text={labelPackCode(request.recommended_pack_code)} />
                      <Badge text={request.priority} />
                      {request.social_care_requested ? <Badge text="사회공헌 요청" /> : null}
                    </div>

                    <h3 className="mt-3 text-3xl font-black">{request.summary_title}</h3>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      부모님: {request.elder_name} · 연락: {request.contact_name || '미입력'} {request.contact_phone || ''}
                    </p>

                    {request.raw_text ? (
                      <p className="mt-4 whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                        {request.raw_text}
                      </p>
                    ) : null}

                    {latestParse ? (
                      <div className="mt-4 rounded-2xl bg-emerald-50 p-4">
                        <div className="font-black text-emerald-950">
                          자동 정리: {labelPackCode(latestParse.recommended_pack_code)} · 신뢰도 {latestParse.confidence_label}
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <InfoBox title="가족 질문" items={latestParse.family_questions} />
                          <InfoBox title="운영실 할 일" items={latestParse.ops_next_actions} />
                        </div>
                      </div>
                    ) : null}

                    {requestAssets.length > 0 ? (
                      <div className="mt-4 rounded-2xl bg-blue-50 p-4">
                        <h4 className="font-black text-blue-950">첨부</h4>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          {requestAssets.map((asset) => (
                            <div key={asset.id} className="rounded-2xl bg-white p-3">
                              <div className="font-black">{asset.file_name || asset.asset_kind}</div>
                              <p className="mt-1 text-xs text-slate-500">
                                {asset.mime_type || '형식 미확인'} · {asset.size_bytes ? `${Math.round(asset.size_bytes / 1024)}KB` : '크기 미확인'}
                              </p>
                              {asset.data_url && asset.mime_type?.startsWith('image/') ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={asset.data_url} alt={asset.file_name || '첨부 이미지'} className="mt-3 max-h-48 rounded-xl object-contain" />
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="grid min-w-[190px] gap-2">
                    {mode === 'ops' ? (
                      <>
                        <button onClick={() => updateStatus(request.id, 'triaged')} className="rounded-2xl bg-slate-100 px-4 py-3 font-black">
                          정리 완료
                        </button>
                        <button onClick={() => convertToCareRequest(request.id)} className="rounded-2xl bg-emerald-600 px-4 py-3 font-black text-white">
                          케어 요청으로 변환
                        </button>
                        <button onClick={() => updateStatus(request.id, 'needs_more_info')} className="rounded-2xl bg-amber-100 px-4 py-3 font-black text-amber-900">
                          추가정보 필요
                        </button>
                        <button onClick={() => updateStatus(request.id, 'closed')} className="rounded-2xl bg-slate-900 px-4 py-3 font-black text-white">
                          완료
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => updateStatus(request.id, 'closed')} className="rounded-2xl bg-emerald-600 px-4 py-3 font-black text-white">
                          확인했어요
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            )
          })
        )}
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="text-sm font-black text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-black">{value}</div>
    </div>
  )
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
      {text}
    </span>
  )
}

function InfoBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <h4 className="font-black">{title}</h4>
      <div className="mt-2 space-y-1">
        {items.length > 0 ? (
          items.map((item) => (
            <p key={item} className="text-sm leading-6 text-slate-700">
              • {item}
            </p>
          ))
        ) : (
          <p className="text-sm text-slate-500">없음</p>
        )}
      </div>
    </div>
  )
}
